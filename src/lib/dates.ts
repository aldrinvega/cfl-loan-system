// Dates are ISO "YYYY-MM-DD" strings, handled in UTC so the local timezone never shifts a day.
export type IsoDate = string

function toDate(iso: IsoDate): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function fmt(iso: IsoDate, options: Intl.DateTimeFormatOptions): string {
  return toDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...options })
}

/** "10/22/2026" */
export const formatMdy = (iso: IsoDate) =>
  fmt(iso, { month: '2-digit', day: '2-digit', year: 'numeric' })

/** "October 22, 2026" */
export const formatLong = (iso: IsoDate) =>
  fmt(iso, { month: 'long', day: 'numeric', year: 'numeric' })

/** "Thursday, October 22, 2026" */
export const formatWeekdayLong = (iso: IsoDate) =>
  fmt(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

/** "Oct 22" */
export const formatShort = (iso: IsoDate) => fmt(iso, { month: 'short', day: 'numeric' })

/** "Nov 24, 2026" */
export const formatShortYear = (iso: IsoDate) =>
  fmt(iso, { month: 'short', day: 'numeric', year: 'numeric' })

/** "Thu, Oct 22" */
export const formatWeekdayShort = (iso: IsoDate) =>
  fmt(iso, { weekday: 'short', month: 'short', day: 'numeric' })

/** "Thu, Oct 22, 2026" */
export const formatWeekdayShortYear = (iso: IsoDate) =>
  fmt(iso, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

/** "March 2025" */
export const formatMonthYear = (iso: IsoDate) => fmt(iso, { month: 'long', year: 'numeric' })

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = toDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Parses "10/22/2026" (or "10/22/26") into an ISO date. Returns null when invalid. */
export function parseMdy(input: string): IsoDate | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(input.trim())
  if (!match) return null
  const [, m, d, y] = match
  const year = y.length === 2 ? 2000 + Number(y) : Number(y)
  const iso = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  const date = toDate(iso)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return null
  return iso
}
