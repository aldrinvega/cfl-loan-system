import { addDays, type IsoDate } from './dates'
import type { Centavos } from './money'

export type Frequency = { days: number; label: string; unit: string }

export const FREQUENCIES: Frequency[] = [
  { days: 1, label: 'Daily', unit: 'days' },
  { days: 7, label: 'Weekly', unit: 'weeks' },
  { days: 15, label: 'Semi-monthly', unit: 'half-months' },
]

export const frequencyLabel = (days: number) => FREQUENCIES.find((f) => f.days === days)?.label ?? `Every ${days} days`

export type Product = {
  name: string
  /** Flat interest for the standard term, pro-rated when the term is longer or shorter. */
  rate: number
  frequencyDays: number
  term: number
}

// Sample products. Real rates come from the head office.
export const PRODUCTS: Product[] = [
  { name: 'Weekly regular', rate: 0.2, frequencyDays: 7, term: 12 },
  { name: 'Daily regular', rate: 0.2, frequencyDays: 1, term: 84 },
  { name: 'Semi-monthly', rate: 0.18, frequencyDays: 15, term: 6 },
]

/**
 * Flat interest on the principal. The product's rate covers its standard length of time
 * (e.g. 20% for 12 weeks) and is pro-rated by the number of days the loan actually runs.
 */
export function flatInterest(product: Product, principal: Centavos, term: number, frequencyDays: number): Centavos {
  const standardDays = product.term * product.frequencyDays
  return Math.round((principal * product.rate * term * frequencyDays) / standardDays)
}

/** The regular installment, rounded up to the centavo; the last one takes the rounding. */
export function installmentFor(principal: Centavos, interest: Centavos, term: number): Centavos {
  return Math.ceil((principal + interest) / term)
}

export type ScheduleRow = {
  no: number
  dueOn: IsoDate
  principal: Centavos
  interest: Centavos
  amount: Centavos
  balance: Centavos
}

/** One row per installment, from the release date. */
export function buildSchedule(
  principal: Centavos,
  interest: Centavos,
  term: number,
  frequencyDays: number,
  releasedOn: IsoDate,
): ScheduleRow[] {
  const total = principal + interest
  const installment = installmentFor(principal, interest, term)
  const principalPart = Math.round(principal / term)
  const rows: ScheduleRow[] = []
  let paid = 0
  let principalPaid = 0
  for (let no = 1; no <= term; no++) {
    const last = no === term
    const amount = last ? total - paid : Math.min(installment, total - paid)
    const p = last ? principal - principalPaid : Math.min(principalPart, amount)
    paid += amount
    principalPaid += p
    rows.push({
      no,
      dueOn: addDays(releasedOn, frequencyDays * no),
      principal: p,
      interest: amount - p,
      amount,
      balance: total - paid,
    })
  }
  return rows
}

/** The next free number in a series like "LN-2026-0482" or "DV-1162". */
export function nextNumber(existing: readonly string[], prefix: string, width: number): string {
  const used = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter(Number.isFinite)
  return `${prefix}${String(Math.max(0, ...used) + 1).padStart(width, '0')}`
}
