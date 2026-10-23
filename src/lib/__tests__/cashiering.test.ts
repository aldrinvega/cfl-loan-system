import { describe, expect, it } from 'vitest'
import { loans, penalties, receipts } from '@/data/sample'
import type { Receipt } from '@/data/types'
import {
  breakdownDueToday,
  breakdownFullPayment,
  breakdownOfReceived,
  breakdownTotal,
  toLoan,
} from '../cashiering'
import { buildLedger, rebateIfPaidInFull, splitAccount } from '../ledger'

const p = (pesos: number) => Math.round(pesos * 100)
const nora = loans.find((l) => l.id === 'LN-2026-0381')!

describe('account summary for LN-2026-0381', () => {
  const split = splitAccount(nora, receipts, penalties)

  it('matches the cashiering mockup', () => {
    expect(split).toEqual({
      charges: { amortization: p(12000), penalty: p(50) },
      payments: { amortization: p(7000), penalty: p(50) },
      adjusted: { amortization: 0, penalty: 0 },
      balance: { amortization: p(5000), penalty: 0 },
      due: { amortization: p(1000), penalty: 0 },
    })
  })

  it('rebates the interest on the five installments not yet due', () => {
    expect(rebateIfPaidInFull(nora, split, '2026-10-22')).toBe(p(833.33))
  })
})

describe('breakdown', () => {
  const split = splitAccount(nora, receipts, penalties)
  const none = { otherPenalty: 0, safekeeping: 0 }

  it('takes the safekeeping typed in, then pays the amount due', () => {
    const b = breakdownOfReceived(p(1100), split, { otherPenalty: 0, safekeeping: p(100) })
    expect(b).toEqual({ amortization: p(1000), penalty: 0, otherPenalty: 0, safekeeping: p(100), rebate: 0 })
    expect(breakdownTotal(b)).toBe(p(1100))
  })

  it('puts anything above the amount due toward the loan when no safekeeping is typed', () => {
    const b = breakdownOfReceived(p(1100), split, none)
    expect(b).toEqual({ amortization: p(1100), penalty: 0, otherPenalty: 0, safekeeping: 0, rebate: 0 })
  })

  it("leaves money beyond the loan balance unallocated, so it can't post", () => {
    const b = breakdownOfReceived(p(6000), split, none)
    expect(b.amortization).toBe(split.balance.amortization)
    expect(breakdownTotal(b)).toBe(p(5000))
  })

  it('pays safekeeping, other penalty and unpaid penalties before amortization', () => {
    const owing = { ...split, due: { amortization: p(1000), penalty: p(50) } }
    expect(breakdownOfReceived(p(600), owing, { otherPenalty: p(20), safekeeping: p(30) })).toEqual({
      amortization: p(500),
      penalty: p(50),
      otherPenalty: p(20),
      safekeeping: p(30),
      rebate: 0,
    })
  })

  it('computes the total due today and the full payment, plus what was typed in', () => {
    expect(breakdownTotal(breakdownDueToday(split, none))).toBe(p(1000))
    expect(breakdownTotal(breakdownDueToday(split, { otherPenalty: 0, safekeeping: p(100) }))).toBe(p(1100))
    const full = breakdownFullPayment(split, p(833.33), none)
    expect(breakdownTotal(full)).toBe(p(4166.67))
    expect(full.amortization + full.rebate).toBe(split.balance.amortization)
  })
})

describe('posting a cashiering receipt', () => {
  it('pays off the loan with a rebate and charges the other penalty', () => {
    const split = splitAccount(nora, receipts, penalties)
    const b = breakdownFullPayment(split, p(833.33), { otherPenalty: p(25), safekeeping: 0 })
    const receipt: Receipt = {
      no: '450112',
      date: '2026-10-22',
      effectiveDate: '2026-10-22',
      clientId: 'CL-00418',
      loanId: nora.id,
      collectorId: '03',
      branchId: 'sindalan',
      amount: breakdownTotal(b),
      loansReceivable: toLoan(b),
      safekeeping: b.safekeeping,
      penaltyPaid: b.penalty + b.otherPenalty,
      otherPenalty: b.otherPenalty,
      rebate: b.rebate,
      particulars: 'Full payment with rebate',
      status: 'posted',
    }
    const all = [...receipts, receipt]
    const after = splitAccount(nora, all, penalties)
    expect(after.balance).toEqual({ amortization: 0, penalty: 0 })
    expect(after.adjusted.amortization).toBe(p(833.33))
    expect(buildLedger(nora, all, penalties).at(-1)?.balance).toBe(0)
    // Cash Receipts still balances: cash = Loans Receivable + Safekeeping.
    expect(receipt.amount).toBe(receipt.loansReceivable + receipt.safekeeping)
  })
})
