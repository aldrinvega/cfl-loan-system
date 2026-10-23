import type { Loan, Penalty, Receipt } from '@/data/types'
import { addDays, type IsoDate } from './dates'
import { formatPeso, sum, type Centavos } from './money'

export type LedgerEntry = {
  date: IsoDate
  reference: string
  kind: 'release' | 'penalty' | 'payment' | 'rebate'
  entry: string
  charges: Centavos
  payment: Centavos
  balance: Centavos
}

// Same-day order on the ledger: release, then penalties, then payments, then rebates.
const kindOrder = { release: 0, penalty: 1, payment: 2, rebate: 3 } as const

const postedFor = (loan: Loan, receipts: readonly Receipt[]) =>
  receipts.filter((r) => r.loanId === loan.id && r.status === 'posted')

/** The date a receipt counts toward the loan. */
export const effectiveDate = (r: Receipt): IsoDate => r.effectiveDate ?? r.date

/**
 * Builds a loan's ledger from its release, penalties and posted receipts, with a running balance.
 * Cancelled receipts carry zero amounts and never touch the ledger.
 */
export function buildLedger(
  loan: Loan,
  receipts: readonly Receipt[],
  penalties: readonly Penalty[],
): LedgerEntry[] {
  const lines: Omit<LedgerEntry, 'balance'>[] = [
    {
      date: loan.releasedOn,
      reference: loan.releaseRef,
      kind: 'release',
      entry: `Release: principal ${formatPeso(loan.principal)} + interest ${formatPeso(loan.interest)}`,
      charges: loan.principal + loan.interest,
      payment: 0,
    },
    ...penalties
      .filter((pen) => pen.loanId === loan.id)
      .map((pen) => ({
        date: pen.date,
        reference: pen.ref,
        kind: 'penalty' as const,
        entry: 'Late penalty',
        charges: pen.amount,
        payment: 0,
      })),
    ...postedFor(loan, receipts)
      .filter((r) => (r.otherPenalty ?? 0) > 0)
      .map((r) => ({
        date: effectiveDate(r),
        reference: `OR ${r.no}`,
        kind: 'penalty' as const,
        entry: 'Other penalty (manual)',
        charges: r.otherPenalty ?? 0,
        payment: 0,
      })),
    ...postedFor(loan, receipts)
      .filter((r) => r.loansReceivable > 0)
      .map((r) => ({
        date: effectiveDate(r),
        reference: `OR ${r.no}`,
        kind: 'payment' as const,
        entry:
          r.loansReceivable < loan.installment
            ? `Payment (short ${formatPeso(loan.installment - r.loansReceivable)})`
            : 'Payment',
        charges: 0,
        payment: r.loansReceivable,
      })),
    ...postedFor(loan, receipts)
      .filter((r) => (r.rebate ?? 0) > 0)
      .map((r) => ({
        date: effectiveDate(r),
        reference: `OR ${r.no}`,
        kind: 'rebate' as const,
        entry: 'Rebate for full payment',
        charges: 0,
        payment: r.rebate ?? 0,
      })),
  ]

  lines.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      kindOrder[a.kind] - kindOrder[b.kind] ||
      a.reference.localeCompare(b.reference),
  )

  let balance = 0
  return lines.map((line) => {
    balance += line.charges - line.payment
    return { ...line, balance }
  })
}

export type LoanSummary = {
  balance: Centavos
  totalCharges: Centavos
  totalPaid: Centavos
  penaltiesCharged: Centavos
  installmentsPaid: number
  percentPaid: number
  maturesOn: IsoDate
  /** null once the loan is fully paid. */
  next: { installmentNo: number; dueOn: IsoDate; amountDue: Centavos } | null
}

export function summarizeLoan(loan: Loan, ledger: readonly LedgerEntry[]): LoanSummary {
  const totalCharges = sum(ledger, (e) => e.charges)
  const totalPaid = sum(ledger, (e) => e.payment)
  const penaltiesCharged = sum(
    ledger.filter((e) => e.kind === 'penalty'),
    (e) => e.charges,
  )
  const balance = totalCharges - totalPaid
  const installmentsPaid = Math.min(loan.term, Math.floor(totalPaid / loan.installment))
  const maturesOn = addDays(loan.releasedOn, loan.frequencyDays * loan.term)

  let next: LoanSummary['next'] = null
  if (balance > 0) {
    const installmentNo = Math.min(loan.term, installmentsPaid + 1)
    // Everything scheduled through the next installment, plus penalties, less what was paid.
    const scheduled = loan.installment * installmentNo + penaltiesCharged
    next = {
      installmentNo,
      dueOn: addDays(loan.releasedOn, loan.frequencyDays * installmentNo),
      amountDue: Math.min(balance, Math.max(0, scheduled - totalPaid)),
    }
  }

  return {
    balance,
    totalCharges,
    totalPaid,
    penaltiesCharged,
    installmentsPaid,
    percentPaid: Math.round((installmentsPaid / loan.term) * 100),
    maturesOn,
    next,
  }
}

type Split = { amortization: Centavos; penalty: Centavos }
const total = (s: Split) => s.amortization + s.penalty

/** The cashier's account summary: every figure split into amortization and penalty. */
export type AccountSplit = {
  charges: Split
  payments: Split
  /** Credits that aren't cash, such as rebates. */
  adjusted: Split
  balance: Split
  /** What the borrower owes today: unpaid penalties plus the current installment. */
  due: Split
}

export const splitTotal = total

/**
 * Splits a loan's figures into amortization and penalty. Receipts posted through cashiering say how
 * much went to penalties; older receipts are applied to unpaid penalties first.
 */
export function splitAccount(
  loan: Loan,
  receipts: readonly Receipt[],
  penalties: readonly Penalty[],
): AccountSplit {
  const posted = postedFor(loan, receipts).sort(
    (a, b) => effectiveDate(a).localeCompare(effectiveDate(b)) || a.no.localeCompare(b.no),
  )
  const penaltyCharges = [
    ...penalties.filter((p) => p.loanId === loan.id).map((p) => ({ date: p.date, amount: p.amount })),
    ...posted.map((r) => ({ date: effectiveDate(r), amount: r.otherPenalty ?? 0 })),
  ]

  let penaltyPaid = 0
  let amortPaid = 0
  for (const r of posted) {
    const date = effectiveDate(r)
    const charged = sum(
      penaltyCharges.filter((p) => p.date <= date),
      (p) => p.amount,
    )
    const toPenalty = r.penaltyPaid ?? Math.min(Math.max(0, charged - penaltyPaid), r.loansReceivable)
    penaltyPaid += toPenalty
    amortPaid += r.loansReceivable - toPenalty
  }
  const rebates = sum(posted, (r) => r.rebate ?? 0)

  const charges = { amortization: loan.principal + loan.interest, penalty: sum(penaltyCharges, (p) => p.amount) }
  const payments = { amortization: amortPaid, penalty: penaltyPaid }
  const adjusted = { amortization: rebates, penalty: 0 }
  const balance = {
    amortization: charges.amortization - payments.amortization - adjusted.amortization,
    penalty: charges.penalty - payments.penalty,
  }
  // The current installment: everything scheduled through the next one, less what's been paid.
  const credited = amortPaid + rebates
  const nextNo = Math.min(loan.term, Math.floor(credited / loan.installment) + 1)
  const due = {
    amortization: Math.min(balance.amortization, Math.max(0, loan.installment * nextNo - credited)),
    penalty: balance.penalty,
  }
  return { charges, payments, adjusted, balance, due }
}

/**
 * Interest waived when the loan is paid in full on `asOf`: the flat interest of every unpaid
 * installment that isn't due yet.
 */
export function rebateIfPaidInFull(loan: Loan, split: AccountSplit, asOf: IsoDate): Centavos {
  const dueByNow = Math.min(
    loan.term,
    Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${loan.releasedOn}T00:00:00Z`)) / 86_400_000 / loan.frequencyDays),
  )
  const paid = Math.floor((split.payments.amortization + split.adjusted.amortization) / loan.installment)
  const notYetDue = Math.max(0, loan.term - Math.max(dueByNow, paid))
  const rebate = Math.round((loan.interest / loan.term) * notYetDue)
  return Math.min(rebate, split.balance.amortization)
}

/** Safekeeping balance and the latest deposit, from the opening balance plus posted receipts. */
export function safekeepingFor(opening: Centavos, clientReceipts: readonly Receipt[]) {
  const deposits = clientReceipts
    .filter((r) => r.status === 'posted' && r.safekeeping > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.no.localeCompare(b.no))
  return {
    balance: opening + sum(deposits, (r) => r.safekeeping),
    deposits,
    lastDeposit: deposits.at(-1) ?? null,
  }
}
