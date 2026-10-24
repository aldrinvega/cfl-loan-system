import type { Role, User } from '@/data/types'

/** Things a user can open or do. Each office role gets only its own duties. */
export type Permission =
  | 'encodePayments'
  | 'cancelReceipts'
  | 'fileLoans'
  | 'approveLoans'
  | 'releaseLoans'
  | 'encodeVouchers'
  | 'viewLoans'
  | 'viewClients'
  | 'viewCashReports'
  | 'viewLoanReports'
  | 'dayClose'
  | 'settings'

/**
 * Accounting officers handle money: payments, receipts, releases and the cash reports.
 * Loan officers handle clients and loans: applications, approvals and the loan reports.
 * The President sees everything across branches and can approve loans, but doesn't post entries.
 */
const PERMISSIONS: Record<Role, readonly Permission[]> = {
  accounting: [
    'encodePayments',
    'cancelReceipts',
    'releaseLoans',
    'encodeVouchers',
    'viewLoans',
    'viewClients',
    'viewCashReports',
    'viewLoanReports',
    'dayClose',
    'settings',
  ],
  loan_officer: ['fileLoans', 'approveLoans', 'viewLoans', 'viewClients', 'viewLoanReports'],
  president: ['approveLoans', 'viewLoans', 'viewClients', 'viewCashReports', 'viewLoanReports', 'settings'],
  collector: [],
}

export function can(user: Pick<User, 'role'>, permission: Permission): boolean {
  return PERMISSIONS[user.role].includes(permission)
}

export const ROLE_LABELS: Record<Role, string> = {
  accounting: 'Accounting officer',
  loan_officer: 'Loan officer',
  president: 'President',
  collector: 'Collector',
}

/** Where each role starts after signing in (when the Dashboard is off). */
export const START_PAGE: Record<Role, string> = {
  accounting: '/payments/new',
  loan_officer: '/loans',
  president: '/reports/daily-target',
  collector: '/m/today',
}
