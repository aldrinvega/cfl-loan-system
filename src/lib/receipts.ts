import type { Booklet, Receipt } from '@/data/types'
import { sum, type Centavos } from './money'

export type ReceiptTotals = {
  posted: number
  cancelled: number
  cash: Centavos
  loansReceivable: Centavos
  safekeeping: Centavos
  /** Cash received = Loans Receivable + Safekeeping. */
  balanced: boolean
}

export function totalReceipts(receipts: readonly Receipt[]): ReceiptTotals {
  const cash = sum(receipts, (r) => r.amount)
  const loansReceivable = sum(receipts, (r) => r.loansReceivable)
  const safekeeping = sum(receipts, (r) => r.safekeeping)
  return {
    posted: receipts.filter((r) => r.status === 'posted').length,
    cancelled: receipts.filter((r) => r.status === 'cancelled').length,
    cash,
    loansReceivable,
    safekeeping,
    balanced: cash === loansReceivable + safekeeping,
  }
}

/** The next unused number in a collector's booklet, or null when the booklet is used up. */
export function nextReceiptNo(booklet: Booklet, receipts: readonly Receipt[]): string | null {
  const used = new Set(receipts.map((r) => r.no))
  for (let n = booklet.from; n <= booklet.to; n++) {
    if (!used.has(String(n))) return String(n)
  }
  return null
}

/** Cancelling keeps the receipt number on record with zero amounts. */
export function cancelled(receipt: Receipt, reason: string): Receipt {
  return {
    ...receipt,
    status: 'cancelled',
    cancelReason: reason,
    amount: 0,
    loansReceivable: 0,
    safekeeping: 0,
  }
}
