// Fictional expense vouchers for the Disbursements screen. Nothing here is real data.
// Numbered below the loan-release vouchers so a new release still takes the next number up.
import { CASH_IN_BANK, type Bank, type Voucher, type VoucherLine } from '@/lib/vouchers'

const p = (pesos: number) => Math.round(pesos * 100)

function expense(
  no: string,
  date: string,
  payee: string,
  checkNo: string,
  explanation: string,
  debits: [string, number][],
  bank: Bank = 'China Bank',
  branchId = 'sindalan',
): Voucher {
  const lines: VoucherLine[] = debits.map(([accountCode, amount]) => ({ accountCode, debit: p(amount), credit: 0 }))
  const total = debits.reduce((t, [, amount]) => t + p(amount), 0)
  lines.push({ accountCode: CASH_IN_BANK[bank], debit: 0, credit: total })
  return { no, date, branchId, payee, bank, checkNo, encoder: 'M. Santos', kind: 'expense', explanation, lines }
}

export const expenseVouchers: Voucher[] = [
  expense('DV-2201', '2026-10-01', 'Social Security System', '0283801', 'SSS premiums for September', [
    ['2-001-319', 6330],
  ]),
  expense('DV-2202', '2026-10-02', 'Dizon Realty', '0283802', 'Office rent for October', [['801-0091', 18000]]),
  expense('DV-2203', '2026-10-05', 'Pampanga Electric Cooperative', '0283803', 'Electricity, September billing', [
    ['5-002-551', 4120.5],
  ]),
  expense('DV-2204', '2026-10-07', 'M. Santos', '0283804', 'Petty cash replenishment', [
    ['5-002-560', 1840],
    ['5-002-541', 2160],
  ]),
  expense('DV-2205', '2026-10-09', 'Castro Aircon Services', '0283805', 'Aircon cleaning and repair, front office', [
    ['5-002-554', 3500],
  ]),
  expense('DV-2206', '2026-10-14', 'Converge ICT', '0283806', 'Internet and telephone, October', [['5-002-523', 2499]]),
  expense('DV-2207', '2026-10-16', 'City Treasurer, San Fernando', '0283807', 'Barangay clearance and permit renewal', [
    ['5-002-556', 2750],
  ]),
  expense(
    'DV-2208',
    '2026-10-20',
    'Social Security System',
    '0283808',
    'SSS salary loan amortizations withheld',
    [['2-001-308', 4820]],
    'Security Bank',
  ),
  expense('DV-2209', '2026-10-21', 'Angeles Branch staff', '0283809', 'Transportation allowance, collectors', [['5-002-541', 3600]], 'China Bank', 'angeles'),
]
