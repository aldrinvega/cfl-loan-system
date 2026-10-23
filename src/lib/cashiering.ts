import type { AccountSplit } from './ledger'
import type { Centavos } from './money'

/** Where the money received goes. Everything but the rebate is cash. */
export type Breakdown = {
  amortization: Centavos
  /** Unpaid penalties on the ledger, computed by the system. */
  penalty: Centavos
  /** Penalty the cashier works out by hand; never computed by the system. */
  otherPenalty: Centavos
  /** Typed in by the accounting officer from the collector's receipt. */
  safekeeping: Centavos
  /** Interest waived for full payment. Not cash, so not part of the total. */
  rebate: Centavos
}

/** How the breakdown was worked out: from the amount received, or from what's owed. */
export type BreakdownMode = 'received' | 'due' | 'full'

/** The two amounts the accounting officer types in; the system works out the rest. */
export type ManualParts = { otherPenalty: Centavos; safekeeping: Centavos }

/** Cash that has to come in for this breakdown. */
export function breakdownTotal(b: Breakdown): Centavos {
  return b.amortization + b.penalty + b.otherPenalty + b.safekeeping
}

/** Part that goes to the loan (Loans Receivable). */
export function toLoan(b: Breakdown): Centavos {
  return b.amortization + b.penalty + b.otherPenalty
}

/**
 * Splits the amount received. Safekeeping comes off first, as typed; then other penalty, unpaid
 * penalties, and the rest to amortization. Paying more than is due goes toward the loan (paid
 * ahead), up to the loan balance; anything beyond that stays unallocated, so it won't match.
 */
export function breakdownOfReceived(received: Centavos, split: AccountSplit, manual: ManualParts): Breakdown {
  let left = received
  const take = (wanted: Centavos) => {
    const got = Math.max(0, Math.min(wanted, left))
    left -= got
    return got
  }
  const safekeeping = take(manual.safekeeping)
  const otherPenalty = take(manual.otherPenalty)
  const penalty = take(split.due.penalty)
  const amortization = take(split.balance.amortization)
  return { amortization, penalty, otherPenalty, safekeeping, rebate: 0 }
}

/** Exactly what's due today, plus the safekeeping and other penalty typed in. */
export function breakdownDueToday(split: AccountSplit, manual: ManualParts): Breakdown {
  return {
    amortization: split.due.amortization,
    penalty: split.due.penalty,
    otherPenalty: manual.otherPenalty,
    safekeeping: manual.safekeeping,
    rebate: 0,
  }
}

/** Pays off the whole loan, less the rebate on interest not yet due, plus what was typed in. */
export function breakdownFullPayment(split: AccountSplit, rebate: Centavos, manual: ManualParts): Breakdown {
  return {
    amortization: split.balance.amortization - rebate,
    penalty: split.balance.penalty,
    otherPenalty: manual.otherPenalty,
    safekeeping: manual.safekeeping,
    rebate,
  }
}

export type CheckLine = {
  id: number
  amount: Centavos | null
  no: string
  bank: string
  branch: string
  /** As typed, MM/DD/YYYY. */
  date: string
}

/** What's missing on a check line, or null when it's complete. */
export function checkProblem(line: CheckLine, isValidDate: (text: string) => boolean): string | null {
  if (!line.amount) return 'Enter the check amount, or remove the line.'
  if (!line.no.trim()) return 'Enter the check number.'
  if (!line.bank.trim()) return 'Enter the bank.'
  if (!line.branch.trim()) return 'Enter the bank branch.'
  if (!isValidDate(line.date)) return 'Enter the check date as MM/DD/YYYY.'
  return null
}
