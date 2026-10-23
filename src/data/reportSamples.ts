// Fictional figures for the extra reports. Nothing here is real data.
import { clients, loans } from './sample'
import type { IsoDate } from '@/lib/dates'
import type { Centavos } from '@/lib/money'

const p = (pesos: number) => Math.round(pesos * 100)

/** One collector's day: what the route was expected to bring in and what came in. */
export type CollectionDay = {
  date: IsoDate
  collectorId: string
  branchId: string
  accountsDue: number
  accountsPaid: number
  target: Centavos
  collected: Centavos
}

const day = (
  date: IsoDate,
  collectorId: string,
  branchId: string,
  accountsDue: number,
  accountsPaid: number,
  target: number,
  collected: number,
): CollectionDay => ({
  date,
  collectorId,
  branchId,
  accountsDue,
  accountsPaid,
  target: p(target),
  collected: p(collected),
})

/** Deterministic 0–1 wobble so the generated history looks real but never changes. */
function wobble(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/** Four earlier weeks (Sept 21 to Oct 16, weekdays) generated around each route's usual numbers. */
function history(): CollectionDay[] {
  const routes = [
    { collectorId: '03', branchId: 'sindalan', accounts: 14, target: 9200 },
    { collectorId: '05', branchId: 'angeles', accounts: 20, target: 79000 },
  ]
  const days: CollectionDay[] = []
  const start = Date.parse('2026-09-21T00:00:00Z')
  for (let i = 0; i < 26; i++) {
    const date = new Date(start + i * 86_400_000)
    const weekday = date.getUTCDay()
    if (weekday === 0 || weekday === 6) continue
    const iso = date.toISOString().slice(0, 10)
    routes.forEach((r, ri) => {
      const target = Math.round(r.target * (0.94 + wobble(i * 7 + ri) * 0.12))
      const rate = 0.72 + wobble(i * 13 + ri * 5) * 0.3
      const paid = Math.round(r.accounts * Math.min(1, rate + 0.05))
      days.push(day(iso, r.collectorId, r.branchId, r.accounts, paid, target, Math.round(target * rate)))
    })
  }
  return days
}

/**
 * Week of October 19–23, 2026. Collector 03's figure for October 22 is replaced at run time by the
 * live receipts, so it moves when a receipt is posted or cancelled.
 */
export const collectionDays: CollectionDay[] = [
  ...history(),
  day('2026-10-19', '03', 'sindalan', 14, 12, 9200, 8650),
  day('2026-10-20', '03', 'sindalan', 13, 13, 8800, 9100),
  day('2026-10-21', '03', 'sindalan', 15, 11, 9600, 7420),
  day('2026-10-22', '03', 'sindalan', 12, 10, 9000, 0),
  day('2026-10-23', '03', 'sindalan', 14, 0, 9400, 0),
  day('2026-10-19', '05', 'angeles', 20, 15, 81200, 64300),
  day('2026-10-20', '05', 'angeles', 20, 17, 79800, 70150),
  day('2026-10-21', '05', 'angeles', 20, 14, 78400, 58900),
  day('2026-10-22', '05', 'angeles', 20, 16, 77900, 66420),
  day('2026-10-23', '05', 'angeles', 20, 0, 77100, 0),
]

export type Disbursement = {
  voucher: string
  date: IsoDate
  branchId: string
  borrower: string
  loanId: string
  product: string
  principal: Centavos
  serviceFee: Centavos
  insurance: Centavos
  releasedBy: string
}

/** Deductions taken from the principal when a loan is released. */
export const SERVICE_FEE_RATE = 0.03
export const INSURANCE_RATE = 0.01

/** A disbursement voucher for a loan release, with the standard deductions. */
export function disbursementFor(fields: Omit<Disbursement, 'serviceFee' | 'insurance'>): Disbursement {
  return {
    ...fields,
    serviceFee: Math.round(fields.principal * SERVICE_FEE_RATE),
    insurance: Math.round(fields.principal * INSURANCE_RATE),
  }
}

const dv = (
  voucher: string,
  date: IsoDate,
  branchId: string,
  borrower: string,
  loanId: string,
  product: string,
  principal: number,
  releasedBy = 'M. Santos',
): Disbursement => disbursementFor({ voucher, date, branchId, borrower, loanId, product, principal: p(principal), releasedBy })

// Sindalan vouchers come straight from the released sample loans, so the report and the
// ledgers always agree.
const sindalanReleases: Disbursement[] = loans
  .filter((l) => l.status === 'released' && l.releaseRef)
  .map((l) => {
    const client = clients.find((c) => c.id === l.clientId)!
    return disbursementFor({
      voucher: l.releaseRef,
      date: l.releasedOn,
      branchId: client.branchId,
      borrower: `${client.lastName}, ${client.firstName}`,
      loanId: l.id,
      product: l.product,
      principal: l.principal,
      releasedBy: l.releasedBy ?? 'M. Santos',
    })
  })

export const disbursements: Disbursement[] = [
  ...sindalanReleases,
  dv('DV-2210', '2026-10-12', 'angeles', 'ESPIRITU, JOY A.', '4861', 'Daily regular', 80000, 'L. Dizon'),
  dv('DV-2214', '2026-10-14', 'angeles', 'IBARRA, KRISTINE M.', '4877', 'Daily regular', 28600, 'L. Dizon'),
  dv('DV-2219', '2026-10-21', 'angeles', 'DAVID, ARNEL S.', '4890', 'Daily regular', 15000, 'L. Dizon'),
  dv('DV-2223', '2026-10-22', 'angeles', 'MERCADO, LOVELY T.', '4893', 'Daily regular', 24000, 'L. Dizon'),
]

export function netProceeds(d: Disbursement): Centavos {
  return d.principal - d.serviceFee - d.insurance
}
