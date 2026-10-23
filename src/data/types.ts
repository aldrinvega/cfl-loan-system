import type { IsoDate } from '@/lib/dates'
import type { Centavos } from '@/lib/money'

export type Branch = { id: string; name: string }

/** A collector's route. The office keeps a walk-in "route" for clients who pay at the counter. */
export type Collector = { id: string; name: string; branchId: string; walkIn?: boolean }

export type Role = 'accounting' | 'loan_officer' | 'president' | 'collector'

export type User = {
  id: string
  /** Sign-in name. Sample accounts only: real passwords never live in the front end. */
  username: string
  password: string
  firstName: string
  name: string
  initials: string
  role: Role
  /** null means the user can see every branch. */
  branchId: string | null
  /** Set for collectors: they only see their own clients. */
  collectorId?: string
  businessDate: IsoDate
}

export type ClientId = { type: string; detail: string; status: 'verified' | 'pending' }

export type Client = {
  id: string
  lastName: string
  firstName: string
  branchId: string
  collectorId: string
  clientSince: IsoDate
  kyc: 'verified' | 'pending'
  status: 'active' | 'inactive'
  phone: string
  address: string
  ids: ClientId[]
  kycVerifiedBy?: string
  /** Safekeeping carried in before the receipts on record. */
  safekeepingOpening: Centavos
}

export type ApplicationStatus = 'pending' | 'approved' | 'released'

export type Loan = {
  id: string
  clientId: string
  product: string
  /** Days between installments. */
  frequencyDays: number
  /** Pending and approved loans count from the day the loan is expected to be released. */
  releasedOn: IsoDate
  /** Disbursement voucher; empty until the loan is released. */
  releaseRef: string
  /** Only released loans carry a balance, take payments and show on routes and reports. */
  status: ApplicationStatus
  appliedOn: IsoDate
  appliedBy: string
  approvedBy?: string
  releasedBy?: string
  principal: Centavos
  interest: Centavos
  installment: Centavos
  term: number
}

export type Penalty = { ref: string; loanId: string; date: IsoDate; amount: Centavos }

export type Check = {
  no: string
  bank: string
  branch: string
  date: IsoDate
  amount: Centavos
}

export type Receipt = {
  no: string
  /** Date on the receipt; the Cash Receipts report groups by this. */
  date: IsoDate
  /** Date the payment counts toward the loan. Defaults to `date`. */
  effectiveDate?: IsoDate
  clientId: string
  loanId: string
  /** Copied from the client's record when posted, never chosen by the user. */
  collectorId: string
  branchId: string
  amount: Centavos
  loansReceivable: Centavos
  safekeeping: Centavos
  particulars: string
  status: 'posted' | 'cancelled'
  cancelReason?: string
  /** How the money came in. Receipts encoded before cashiering have neither. */
  cash?: Centavos
  checks?: Check[]
  /**
   * Part of Loans Receivable that paid penalties (computed + other). When missing, the ledger
   * applies the payment to unpaid penalties first.
   */
  penaltyPaid?: Centavos
  /** Penalty the cashier charged by hand on this receipt; charged and paid in one go. */
  otherPenalty?: Centavos
  /** Interest waived for paying the loan in full. Credits the loan but isn't cash. */
  rebate?: Centavos
}

/** A pad of official receipts issued to a collector. */
export type Booklet = { from: number; to: number; collectorId: string }

/** Collection status of a released loan (daily target report). */
export const LOAN_STATUSES = [
  'current',
  'updated',
  'arrears',
  'past_due',
  'litigation',
  'dormant',
  'doubtful',
] as const

export type LoanStatus = (typeof LOAN_STATUSES)[number]

export type RouteAccount = {
  loanId: string
  borrower: string
  address: string
  branchId: string
  collectorId: string
  status: LoanStatus
  grantedOn: IsoDate
  maturesOn: IsoDate
  loanAmount: Centavos
  balance: Centavos
  dailyAmortization: Centavos
  /** Negative when the borrower has paid ahead. Matured accounts carry the whole balance. */
  dueToday: Centavos
  penalty: Centavos
  lastPaymentOn: IsoDate
  /** Rebate if paid in full today; 0 when none. */
  potentialRebate: Centavos
}
