import { LOAN_STATUSES, type LoanStatus, type RouteAccount } from '@/data/types'
import { sum, type Centavos } from './money'

export const STATUS_LABELS: Record<LoanStatus, string> = {
  current: 'Current',
  updated: 'Updated',
  arrears: 'Arrears',
  past_due: 'Past due',
  litigation: 'Litigation',
  dormant: 'Dormant',
  doubtful: 'Doubtful',
}

/** Paid-ahead amounts aren't collectible; collectible is what's due today plus any penalty. */
export function collectible(account: RouteAccount): Centavos {
  return Math.max(0, account.dueToday) + account.penalty
}

export type TargetTotals = {
  balance: Centavos
  dailyAmortization: Centavos
  /** Only positive amounts due are added. */
  dueToday: Centavos
  penalty: Centavos
  collectible: Centavos
  potentialRebate: Centavos
}

export function totalAccounts(accounts: readonly RouteAccount[]): TargetTotals {
  return {
    balance: sum(accounts, (a) => a.balance),
    dailyAmortization: sum(accounts, (a) => a.dailyAmortization),
    dueToday: sum(accounts, (a) => Math.max(0, a.dueToday)),
    penalty: sum(accounts, (a) => a.penalty),
    collectible: sum(accounts, collectible),
    potentialRebate: sum(accounts, (a) => a.potentialRebate),
  }
}

export type StatusGroup = {
  status: LoanStatus
  accounts: RouteAccount[]
  totals: TargetTotals
}

/** Groups accounts by loan status in report order, skipping empty groups. */
export function groupByStatus(accounts: readonly RouteAccount[]): StatusGroup[] {
  return LOAN_STATUSES.map((status) => {
    const inGroup = accounts.filter((a) => a.status === status)
    return { status, accounts: inGroup, totals: totalAccounts(inGroup) }
  }).filter((g) => g.accounts.length > 0)
}

/**
 * Each status's share of the outstanding balance. "Others" is 100% minus Updated and Arrears,
 * computed on the rounded figures so the three always add to 100.00%.
 */
export function recap(accounts: readonly RouteAccount[]) {
  const total = sum(accounts, (a) => a.balance)
  const share = (status: LoanStatus) => {
    if (total === 0) return 0
    const part = sum(
      accounts.filter((a) => a.status === status),
      (a) => a.balance,
    )
    return Math.round((part / total) * 10000) / 100
  }
  const updated = share('updated')
  const arrears = share('arrears')
  const others = total === 0 ? 0 : Math.round((100 - updated - arrears) * 100) / 100
  return { updated, arrears, others }
}
