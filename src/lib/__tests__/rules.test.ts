import { describe, expect, it } from 'vitest'
import { loans, penalties, receipts } from '@/data/sample'
import { routeAccounts } from '@/data/routeAccounts'
import { groupByStatus, recap, totalAccounts } from '../dailyTarget'
import { buildLedger, safekeepingFor, summarizeLoan } from '../ledger'
import { formatPeso, parseAmount } from '../money'
import { cancelled, nextReceiptNo, totalReceipts } from '../receipts'

const p = (pesos: number) => Math.round(pesos * 100)

describe('money', () => {
  it('parses and formats pesos', () => {
    expect(parseAmount('₱1,100.00')).toBe(p(1100))
    expect(parseAmount('2062.5')).toBe(p(2062.5))
    expect(parseAmount('12.345')).toBeNull()
    expect(parseAmount('')).toBeNull()
    expect(formatPeso(p(8370))).toBe('₱8,370.00')
  })
})

describe('receipts', () => {
  it('cancelling keeps the number with zero amounts', () => {
    const r = cancelled(receipts[7], 'Wrong amount')
    expect(r).toMatchObject({ no: receipts[7].no, status: 'cancelled', amount: 0, loansReceivable: 0, safekeeping: 0 })
  })

  it('suggests the next unused number in the booklet', () => {
    expect(nextReceiptNo({ from: 450101, to: 450150, collectorId: '03' }, receipts)).toBe('450112')
  })
})

describe('Cash Receipts, Collector 03, 10/22/2026', () => {
  const today = receipts.filter((r) => r.date === '2026-10-22' && r.collectorId === '03')
  it('matches the mockup totals and balances', () => {
    expect(totalReceipts(today)).toEqual({
      posted: 10,
      cancelled: 1,
      cash: p(8370),
      loansReceivable: p(7960),
      safekeeping: p(410),
      balanced: true,
    })
  })
})

describe('Castillo, Nora · LN-2026-0381', () => {
  const loan = loans[0]
  const ledger = buildLedger(loan, receipts, penalties)
  const summary = summarizeLoan(loan, ledger)

  it('builds the running balance from the receipts', () => {
    expect(ledger.map((e) => e.balance / 100)).toEqual([
      12000, 11000, 10000, 9000, 8200, 8250, 7000, 6000, 5000,
    ])
    expect(ledger[4].entry).toBe('Payment (short ₱200.00)')
    expect(ledger[5].entry).toBe('Late penalty')
  })

  it('summarizes the loan like the profile', () => {
    expect(summary).toMatchObject({
      balance: p(5000),
      totalCharges: p(12050),
      totalPaid: p(7050),
      penaltiesCharged: p(50),
      installmentsPaid: 7,
      percentPaid: 58,
      maturesOn: '2026-11-24',
      next: { installmentNo: 8, dueOn: '2026-10-27', amountDue: p(1000) },
    })
  })

  it('has ₱640.00 in safekeeping, last deposit ₱100.00 on Oct 20', () => {
    const sk = safekeepingFor(p(540), receipts.filter((r) => r.clientId === 'CL-00418'))
    expect(sk.balance).toBe(p(640))
    expect(sk.lastDeposit).toMatchObject({ date: '2026-10-20', safekeeping: p(100) })
  })
})

describe('Daily target, Collector 05, 10/23/2026', () => {
  it('adds only positive amounts due', () => {
    const current = groupByStatus(routeAccounts)[0]
    expect(current.status).toBe('current')
    expect(current.totals).toMatchObject({
      balance: p(168450),
      dailyAmortization: p(2992),
      dueToday: p(32140),
      collectible: p(32140),
      potentialRebate: p(11577.5),
    })
  })

  it('matches the grand total and recap', () => {
    expect(totalAccounts(routeAccounts)).toMatchObject({
      balance: p(213410),
      dailyAmortization: p(4819),
      dueToday: p(77100),
      collectible: p(77100),
      potentialRebate: p(11577.5),
    })
    expect(recap(routeAccounts)).toEqual({ updated: 2.01, arrears: 3.84, others: 94.15 })
    expect(routeAccounts.filter((a) => a.dueToday < 0)).toHaveLength(6)
  })
})
