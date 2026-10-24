import type { IsoDate } from './dates'
import { sum, type Centavos } from './money'

/** One title in the chart of accounts. Codes follow the legacy system's numbering. */
export type Account = { code: string; title: string }

// Titles and codes seen on the legacy Disbursements screen, plus common expense titles.
// Sample only: the real chart of accounts comes from the accounting office.
export const chartOfAccounts: Account[] = [
  { code: '1-001-15', title: 'Loans Receivable' },
  { code: '1-001-102', title: 'Cash in Bank - Security Bank' },
  { code: '1-001-118', title: 'Cash in Bank - China Bank' },
  { code: '1-001-107', title: 'Petty Cash Fund' },
  { code: '1-004-252', title: 'Security Deposit' },
  { code: '800-0010', title: 'Unearned Interest Income' },
  { code: '800-0020', title: 'Unearned Service Fee' },
  { code: '800-0030', title: 'Unearned Notarial Fee' },
  { code: '800-0040', title: 'Medical Assistance Uncollected' },
  { code: '800-0050', title: 'PAF Uncollected' },
  { code: '800-0060', title: 'VAT Uncollected' },
  { code: '800-0080', title: 'DOC Uncollected' },
  { code: '800-0090', title: 'Unearned Misc Fee' },
  { code: '4-000-406', title: 'Processing Fee' },
  { code: '2-001-3030', title: 'Safekeeping Log' },
  { code: '2-001-319', title: 'SSS Premium Payable' },
  { code: '2-001-308', title: 'SSS Salary Loan Payable' },
  { code: '801-0091', title: 'Rent Expense' },
  { code: '5-002-516', title: 'Salaries and Wages' },
  { code: '5-002-523', title: 'Postage, Telephone and Cable' },
  { code: '5-002-541', title: 'Transportation Allowance' },
  { code: '5-002-551', title: 'Power, Light and Water' },
  { code: '5-002-554', title: 'Repairs and Maintenance' },
  { code: '5-002-556', title: 'Taxes and Licenses' },
  { code: '5-002-559', title: 'Representation Expense' },
  { code: '5-002-560', title: 'Office Supplies' },
]

export const CASH_IN_BANK = { 'China Bank': '1-001-118', 'Security Bank': '1-001-102' } as const
export type Bank = keyof typeof CASH_IN_BANK
export const banks = Object.keys(CASH_IN_BANK) as Bank[]

export function accountTitle(code: string): string {
  return chartOfAccounts.find((a) => a.code === code)?.title ?? code
}

const isCashInBank = (code: string) => Object.values(CASH_IN_BANK).includes(code as never)

export type VoucherLine = { accountCode: string; debit: Centavos; credit: Centavos }

/** A check voucher: who was paid, by which check, and the journal lines behind it. */
export type Voucher = {
  no: string
  date: IsoDate
  branchId: string
  payee: string
  bank: Bank
  checkNo: string
  encoder: string
  /** Loan releases come from the Loans screen and can't be edited or deleted here. */
  kind: 'release' | 'expense'
  loanId?: string
  explanation: string
  lines: VoucherLine[]
}

export function voucherTotals(lines: readonly VoucherLine[]) {
  const debit = sum(lines, (l) => l.debit)
  const credit = sum(lines, (l) => l.credit)
  return { debit, credit, balanced: debit === credit && debit > 0 }
}

/** The money that left the bank: the voucher's credits to Cash in Bank. */
export function cashOut(v: Pick<Voucher, 'lines'>): Centavos {
  return sum(
    v.lines.filter((l) => isCashInBank(l.accountCode)),
    (l) => l.credit - l.debit,
  )
}

/**
 * The journal for a loan release: Loans Receivable at the full amount to repay, the interest
 * and fees held as unearned or uncollected, and the net proceeds paid out of the bank.
 */
export function releaseLines(
  r: { principal: Centavos; interest: Centavos; serviceFee: Centavos; insurance: Centavos },
  bank: Bank,
): VoucherLine[] {
  const net = r.principal - r.serviceFee - r.insurance
  const line = (accountCode: string, debit: Centavos, credit: Centavos): VoucherLine => ({ accountCode, debit, credit })
  return [
    line('1-001-15', r.principal + r.interest, 0),
    line('800-0010', 0, r.interest),
    line('800-0020', 0, r.serviceFee),
    line('800-0040', 0, r.insurance),
    line(CASH_IN_BANK[bank], 0, net),
  ]
}
