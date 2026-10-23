import { useState } from 'react'
import { booklets, collectors } from '@/data/sample'
import type { Receipt } from '@/data/types'
import {
  breakdownDueToday,
  breakdownFullPayment,
  breakdownOfReceived,
  breakdownTotal,
  checkProblem,
  toLoan,
  type BreakdownMode,
  type CheckLine,
} from '@/lib/cashiering'
import { formatMdy, parseMdy } from '@/lib/dates'
import { rebateIfPaidInFull, splitTotal } from '@/lib/ledger'
import { sum, type Centavos } from '@/lib/money'
import { nextReceiptNo } from '@/lib/receipts'
import { useSession } from './session'
import { useRouteAccounts } from './portfolio'
import { useStore } from './store'

export type CashieringErrors = Partial<
  Record<'collector' | 'account' | 'orNo' | 'paymentDate' | 'effectiveDate' | 'received' | 'checks' | 'breakdown', string>
>

let nextCheckId = 1
const blankCheck = (amount: Centavos | null = null): CheckLine => ({
  id: nextCheckId++,
  amount,
  no: '',
  bank: '',
  branch: '',
  date: '',
})

/**
 * Cashiering: the collector's route, the account, the OR number from that collector's booklet, and
 * the cash and checks received. The breakdown is always computed, never typed in.
 */
export function useCashieringForm(initial?: { collectorId?: string; loanId?: string }) {
  const { user } = useSession()
  const { receipts, postReceipt } = useStore()

  const [collectorId, setCollectorIdState] = useState(initial?.collectorId)
  const [loanId, setLoanIdState] = useState(initial?.loanId)
  const [orDraft, setOrDraft] = useState<string | null>(null)
  const [orUnlocked, setOrUnlocked] = useState(false)
  const [paymentDate, setPaymentDate] = useState(formatMdy(user.businessDate))
  const [effectiveDate, setEffectiveDate] = useState(formatMdy(user.businessDate))
  const [cash, setCash] = useState<Centavos | null>(null)
  const [checks, setChecks] = useState<CheckLine[]>([])
  const [otherPenalty, setOtherPenalty] = useState<Centavos | null>(null)
  const [safekeeping, setSafekeeping] = useState<Centavos | null>(null)
  const [mode, setMode] = useState<BreakdownMode>('received')
  const [submitted, setSubmitted] = useState(false)

  const accounts = useRouteAccounts(collectorId)
  const account = accounts.find((a) => a.loan.id === loanId) ?? null
  const collector = collectors.find((c) => c.id === collectorId) ?? null
  const booklet = booklets.find((b) => b.collectorId === collectorId) ?? null
  const suggestedOr = booklet ? nextReceiptNo(booklet, receipts) : null
  const orNo = orDraft ?? suggestedOr ?? ''

  const received = (cash ?? 0) + sum(checks, (c) => c.amount ?? 0)
  const effective = parseMdy(effectiveDate)
  const rebate = account && effective ? rebateIfPaidInFull(account.loan, account.split, effective) : 0
  const manual = { otherPenalty: otherPenalty ?? 0, safekeeping: safekeeping ?? 0 }

  const breakdown = !account
    ? null
    : mode === 'due'
      ? breakdownDueToday(account.split, manual)
      : mode === 'full'
        ? breakdownFullPayment(account.split, rebate, manual)
        : breakdownOfReceived(received, account.split, manual)
  const total = breakdown ? breakdownTotal(breakdown) : 0
  const matches = breakdown !== null && received > 0 && total === received

  const errors: CashieringErrors = {}
  if (!collector) errors.collector = "Pick the collector's route."
  if (!account) errors.account = 'Pick the account the payment is for.'
  const used = new Set(receipts.map((r) => r.no))
  if (!/^\d+$/.test(orNo)) errors.orNo = 'Enter the OR number from the receipt.'
  else if (used.has(orNo)) errors.orNo = `OR ${orNo} is already on record.`
  else if (booklet && (Number(orNo) < booklet.from || Number(orNo) > booklet.to))
    errors.orNo = `Not in ${collector?.name ?? 'the collector'}'s booklet ${booklet.from}–${booklet.to}.`
  for (const [key, text] of [
    ['paymentDate', paymentDate],
    ['effectiveDate', effectiveDate],
  ] as const) {
    const date = parseMdy(text)
    if (!date) errors[key] = 'Use MM/DD/YYYY.'
    else if (date > user.businessDate) errors[key] = "Can't be after today."
    else if (date.slice(0, 7) !== user.businessDate.slice(0, 7)) errors[key] = 'Outside the open period.'
  }
  if (received <= 0) errors.received = 'Enter the cash or checks received.'
  const checkError = checks.map((c) => checkProblem(c, (t) => parseMdy(t) !== null)).find(Boolean)
  if (checkError) errors.checks = checkError
  if (breakdown && received > 0 && !matches) errors.breakdown = "The breakdown doesn't match the total received."

  const canPost = Object.keys(errors).length === 0

  function reset(keepCollector = true) {
    if (!keepCollector) setCollectorIdState(undefined)
    setLoanIdState(undefined)
    setOrDraft(null)
    setOrUnlocked(false)
    setCash(null)
    setChecks([])
    setOtherPenalty(null)
    setSafekeeping(null)
    setMode('received')
    setSubmitted(false)
  }

  /** Posts the receipt if everything checks out. Returns the posted receipt, or null. */
  function post(): Receipt | null {
    setSubmitted(true)
    if (!canPost || !account || !breakdown || !effective) return null
    const date = parseMdy(paymentDate)!
    const installment = account.summary.next
    const receipt: Receipt = {
      no: orNo,
      date,
      effectiveDate: effective,
      clientId: account.client.id,
      loanId: account.loan.id,
      // The collector comes from the client's record, not from the route picked on screen.
      collectorId: account.client.collectorId,
      branchId: account.client.branchId,
      amount: received,
      loansReceivable: toLoan(breakdown),
      safekeeping: breakdown.safekeeping,
      penaltyPaid: breakdown.penalty + breakdown.otherPenalty,
      otherPenalty: breakdown.otherPenalty || undefined,
      rebate: breakdown.rebate || undefined,
      cash: cash ?? 0,
      checks: checks.map((c) => ({
        no: c.no.trim(),
        bank: c.bank.trim(),
        branch: c.branch.trim(),
        date: parseMdy(c.date)!,
        amount: c.amount ?? 0,
      })),
      particulars:
        mode === 'full'
          ? 'Full payment with rebate'
          : installment
            ? `${account.loan.product} payment, installment ${installment.installmentNo} of ${account.loan.term}`
            : 'Payment',
      status: 'posted',
    }
    postReceipt(receipt)
    reset()
    return receipt
  }

  return {
    collector,
    collectorId,
    accounts,
    account,
    booklet,
    orNo,
    orUnlocked,
    paymentDate,
    effectiveDate,
    cash,
    checks,
    otherPenalty,
    safekeeping,
    received,
    rebate,
    breakdown,
    total,
    matches,
    mode,
    /** Errors show once the cashier has tried to post. */
    errors: submitted ? errors : {},
    canPost,
    dueToday: account ? splitTotal(account.split.due) : 0,
    setCollectorId(id: string) {
      setCollectorIdState(id)
      reset()
    },
    setLoanId(id: string) {
      setLoanIdState(id)
      setOrDraft(null)
      setOrUnlocked(false)
      setOtherPenalty(null)
      setSafekeeping(null)
      setMode('received')
      setSubmitted(false)
    },
    setOrNo: setOrDraft,
    unlockOr: () => setOrUnlocked(true),
    setPaymentDate,
    setEffectiveDate,
    setCash,
    setOtherPenalty,
    setSafekeeping,
    addCheck: () => setChecks((cs) => [...cs, blankCheck()]),
    updateCheck: (id: number, patch: Partial<CheckLine>) =>
      setChecks((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    removeCheck: (id: number) => setChecks((cs) => cs.filter((c) => c.id !== id)),
    computeFromReceived: () => setMode('received'),
    computeDueToday: () => setMode('due'),
    fullPaymentWithRebate: () => setMode('full'),
    totalToCash() {
      setCash(total)
      setChecks([])
    },
    totalToCheck() {
      setCash(0)
      setChecks((cs) => [{ ...(cs[0] ?? blankCheck()), amount: total }])
    },
    post,
    clear: () => reset(),
  }
}
