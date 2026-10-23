// Amounts are stored as integer centavos so sums never drift.
export type Centavos = number

const amountFormat = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 110000 → "1,100.00" */
export function formatAmount(c: Centavos): string {
  return amountFormat.format(c / 100)
}

/** 110000 → "₱1,100.00", -5000 → "−₱50.00" */
export function formatPeso(c: Centavos): string {
  return c < 0 ? `−₱${formatAmount(-c)}` : `₱${formatAmount(c)}`
}

/** Parses "₱1,100.00", "1100", "1,100.5" into centavos. Returns null when empty or invalid. */
export function parseAmount(input: string): Centavos | null {
  const cleaned = input.replace(/[₱,\s]/g, '')
  if (cleaned === '') return null
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const [whole, frac = ''] = cleaned.split('.')
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'))
}

export function sum<T>(items: readonly T[], pick: (item: T) => Centavos): Centavos {
  return items.reduce((total, item) => total + pick(item), 0)
}

