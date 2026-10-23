// Fictional route snapshot for Collector 05 · J. Pineda, Angeles Branch, October 23, 2026.
import type { LoanStatus, RouteAccount } from './types'

export const ROUTE_SNAPSHOT_DATE = '2026-10-23'

const p = (pesos: number) => Math.round(pesos * 100)

type Row = [
  loanId: string,
  borrower: string,
  address: string,
  status: LoanStatus,
  grantedOn: string,
  maturesOn: string,
  loanAmount: number,
  balance: number,
  dailyAmortization: number,
  dueToday: number,
  lastPaymentOn: string,
  potentialRebate: number,
]

const rows: Row[] = [
  ['4812', 'AQUINO, MARITES D.', 'Purok 3, Pampang, Angeles City', 'current', '2026-08-24', '2026-12-24', 19200, 3900, 214, -6800, '2026-10-22', 825],
  ['4820', 'BUENAVENTURA, LIZA M.', 'Sto. Rosario St., Angeles City', 'current', '2026-08-25', '2026-12-25', 38400, 20500, 427, 1280, '2026-10-20', 1650],
  ['4703', 'CRUZ, DANILO P.', 'Capaya 1, Angeles City', 'current', '2026-05-26', '2026-09-26', 8960, 4100, 100, 4100, '2026-10-21', 0],
  ['4855', 'DE LEON, ROWENA S.', 'Sta. Teresita, Angeles City', 'current', '2026-08-27', '2026-12-27', 14080, 3500, 157, -4300, '2026-10-22', 605],
  ['4861', 'ESPIRITU, JOY A.', 'Balibago, Angeles City', 'current', '2026-10-12', '2027-02-12', 89600, 75000, 996, -7600, '2026-10-22', 5775],
  ['4744', 'FLORES, RICARDO T.', 'Zamora St., Angeles City', 'current', '2026-07-04', '2026-11-04', 19200, 17900, 214, 15760, '2026-07-23', 0],
  ['4790', 'GALANG, TERESA B.', 'Sta. Trinidad, Angeles City', 'current', '2026-08-26', '2026-12-26', 7680, 2600, 86, -1500, '2026-10-21', 330],
  ['4802', 'HERNANDEZ, PAOLO R.', 'Capaya 2, Angeles City', 'current', '2026-06-06', '2026-10-06', 32000, 11000, 356, 11000, '2026-10-19', 0],
  ['4877', 'IBARRA, KRISTINE M.', 'Pandan, Angeles City', 'current', '2026-10-14', '2027-02-14', 32000, 27500, 356, -2100, '2026-10-21', 2062.5],
  ['4833', 'JAVIER, NOEL C.', 'Cutcut, Angeles City', 'current', '2026-08-26', '2026-12-26', 7680, 2450, 86, -1700, '2026-10-22', 330],
  ['4410', 'KATIGBAK, SHEILA R.', 'Pulung Maragul, Angeles City', 'updated', '2026-03-04', '2026-07-04', 12800, 4300, 143, 4300, '2026-09-07', 0],
  ['4062', 'LACSAMANA, EDNA V.', 'Mt. View, Balibago, Angeles City', 'arrears', '2025-11-29', '2026-03-29', 19200, 2400, 214, 2400, '2026-08-17', 0],
  ['4205', 'MALLARI, ROSE P.', 'Alim St., Cutcut, Angeles City', 'arrears', '2026-02-04', '2026-06-04', 8960, 5800, 100, 5800, '2026-08-15', 0],
  ['3961', 'NAVARRO, SHARON G.', 'Hadrian St., Balibago, Angeles City', 'past_due', '2025-11-06', '2026-03-06', 25600, 1900, 285, 1900, '2026-08-17', 0],
  ['3292', 'OCAMPO, JOSEPH L.', 'Zamora St., Angeles City', 'litigation', '2025-06-23', '2025-10-23', 15240, 560, 200, 560, '2026-03-20', 0],
  ['3463', 'PAMINTUAN, WILMA E.', 'Hensonville, Angeles City', 'litigation', '2025-09-27', '2026-01-27', 25600, 9000, 285, 9000, '2026-01-19', 0],
  ['2436', 'QUIAMBAO, EDUARDO F.', 'P. Gomez St., Angeles City', 'dormant', '2025-03-04', '2025-07-04', 8890, 3200, 120, 3200, '2025-09-08', 0],
  ['2393', 'ROQUE, ADRIAN A.', 'Mabiga, Mabalacat City', 'dormant', '2025-02-25', '2025-06-25', 6350, 2500, 80, 2500, '2025-06-30', 0],
  ['1214', 'SALONGA, EDGIELYN R.', 'Arayat Blvd., Angeles City', 'doubtful', '2024-06-25', '2024-10-25', 12700, 7600, 160, 7600, '2025-01-18', 0],
  ['1550', 'TUAZON, MARIFE G.', 'Dau, Mabalacat City', 'doubtful', '2024-09-09', '2025-01-09', 19050, 7700, 240, 7700, '2025-02-20', 0],
]

export const routeAccounts: RouteAccount[] = rows.map(
  ([loanId, borrower, address, status, grantedOn, maturesOn, loanAmount, balance, daily, due, last, rebate]) => ({
    loanId,
    borrower,
    address,
    branchId: 'angeles',
    collectorId: '05',
    status,
    grantedOn,
    maturesOn,
    loanAmount: p(loanAmount),
    balance: p(balance),
    dailyAmortization: p(daily),
    dueToday: p(due),
    penalty: 0,
    lastPaymentOn: last,
    potentialRebate: p(rebate),
  }),
)
