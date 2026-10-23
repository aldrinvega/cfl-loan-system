import { describe, expect, it } from 'vitest'
import { buildSchedule, flatInterest, installmentFor, nextNumber, PRODUCTS } from '../loans'

const p = (pesos: number) => Math.round(pesos * 100)
const weekly = PRODUCTS.find((x) => x.name === 'Weekly regular')!

describe('loan terms', () => {
  it('charges the product rate for its standard term, pro-rated by days', () => {
    expect(flatInterest(weekly, p(10000), 12, 7)).toBe(p(2000))
    expect(flatInterest(weekly, p(10000), 24, 7)).toBe(p(4000))
    // 84 daily installments run as long as 12 weekly ones.
    expect(flatInterest(weekly, p(10000), 84, 1)).toBe(p(2000))
  })

  it('builds a schedule that adds up, with the rounding in the last installment', () => {
    const principal = p(7777.77)
    const interest = flatInterest(weekly, principal, 12, 7)
    const rows = buildSchedule(principal, interest, 12, 7, '2026-10-22')
    expect(rows).toHaveLength(12)
    expect(rows[0].dueOn).toBe('2026-10-29')
    expect(rows.at(-1)!.dueOn).toBe('2027-01-14')
    expect(rows.reduce((t, r) => t + r.amount, 0)).toBe(principal + interest)
    expect(rows.reduce((t, r) => t + r.principal, 0)).toBe(principal)
    expect(rows.at(-1)!.balance).toBe(0)
    const installment = installmentFor(principal, interest, 12)
    rows.slice(0, -1).forEach((r) => expect(r.amount).toBe(installment))
    expect(rows.at(-1)!.amount).toBeLessThanOrEqual(installment)
  })

  it('numbers loans and vouchers after the highest one in use', () => {
    expect(nextNumber(['LN-2026-0481', 'LN-2026-0482', 'LN-2025-0990'], 'LN-2026-', 4)).toBe('LN-2026-0483')
    expect(nextNumber(['DV-1162', 'DV-2223'], 'DV-', 4)).toBe('DV-2224')
  })
})
