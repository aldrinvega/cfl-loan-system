// Fictional sample data matching the design mockups.
import type {
  Booklet,
  Branch,
  Client,
  Collector,
  Loan,
  Penalty,
  Receipt,
  User,
} from './types'

/** Pesos to centavos. */
const p = (pesos: number) => Math.round(pesos * 100)

export const COMPANY_NAME = 'Cash Flow Lending Corporation'

export const branches: Branch[] = [
  { id: 'sindalan', name: 'Sindalan Branch' },
  { id: 'angeles', name: 'Angeles Branch' },
]

export const collectors: Collector[] = [
  { id: '01', name: 'A. Dela Paz', branchId: 'sindalan' },
  { id: '02', name: 'B. Manalo', branchId: 'sindalan' },
  { id: '03', name: 'R. Lacson', branchId: 'sindalan' },
  { id: '04', name: 'D. Yumul', branchId: 'sindalan' },
  { id: '06', name: 'K. Lising', branchId: 'sindalan' },
  { id: 'OF', name: 'Office (walk-in)', branchId: 'sindalan', walkIn: true },
  { id: '05', name: 'J. Pineda', branchId: 'angeles' },
]

export const users: User[] = [
  {
    id: 'msantos',
    username: 'msantos',
    password: 'cashflow123',
    firstName: 'Mila',
    name: 'M. Santos',
    initials: 'MS',
    role: 'accounting',
    branchId: 'sindalan',
    businessDate: '2026-10-22',
  },
  {
    id: 'acruz',
    username: 'acruz',
    password: 'cashflow123',
    firstName: 'Andrea',
    name: 'A. Cruz',
    initials: 'AC',
    role: 'loan_officer',
    branchId: 'sindalan',
    businessDate: '2026-10-22',
  },
  {
    id: 'tnaguit',
    username: 'tnaguit',
    password: 'cashflow123',
    firstName: 'Tanya',
    name: 'T. Naguit',
    initials: 'TN',
    role: 'president',
    branchId: null,
    businessDate: '2026-10-23',
  },
  {
    id: 'rlacson',
    username: 'rlacson',
    password: 'cashflow123',
    firstName: 'Ramon',
    name: 'R. Lacson',
    initials: 'RL',
    role: 'collector',
    branchId: 'sindalan',
    collectorId: '03',
    businessDate: '2026-10-22',
  },
]

export const booklets: Booklet[] = [
  { from: 450101, to: 450150, collectorId: '03' },
  { from: 451001, to: 451050, collectorId: '01' },
  { from: 451201, to: 451250, collectorId: '02' },
  { from: 451401, to: 451450, collectorId: '04' },
  { from: 451601, to: 451650, collectorId: '06' },
  { from: 459001, to: 459050, collectorId: 'OF' },
]

const sindalanAddress = 'Brgy. Sample, Sindalan, San Fernando, Pampanga'

function basicClient(
  id: string,
  lastName: string,
  firstName: string,
  clientSince: string,
  collectorId = '03',
): Client {
  return {
    id,
    lastName,
    firstName,
    branchId: 'sindalan',
    collectorId,
    clientSince,
    kyc: 'verified',
    status: 'active',
    phone: '0917 000 0000',
    address: sindalanAddress,
    ids: [{ type: 'UMID', detail: 'On file', status: 'verified' }],
    safekeepingOpening: 0,
  }
}

export const clients: Client[] = [
  {
    id: 'CL-00418',
    lastName: 'Castillo',
    firstName: 'Nora',
    branchId: 'sindalan',
    collectorId: '03',
    clientSince: '2025-03-12',
    kyc: 'verified',
    status: 'active',
    phone: '0917 000 0000',
    address: sindalanAddress,
    ids: [
      { type: 'UMID', detail: '•••• 4821 · expires 2031', status: 'verified' },
      { type: 'Proof of billing', detail: 'Uploaded March 12, 2025', status: 'verified' },
    ],
    kycVerifiedBy: 'A. Cruz, loan officer',
    safekeepingOpening: p(540),
  },
  basicClient('CL-00301', 'Bautista', 'Ramon', '2024-06-03'),
  basicClient('CL-00322', 'Villanueva', 'Grace', '2024-08-19'),
  basicClient('CL-00345', 'Mendoza', 'Lito', '2024-11-04'),
  basicClient('CL-00352', 'Navarro', 'Joy', '2025-01-13'),
  basicClient('CL-00367', 'Ramos', 'Elmer', '2025-02-10'),
  basicClient('CL-00380', 'Torres', 'Annabelle', '2025-04-07'),
  basicClient('CL-00391', 'Flores', 'Dante', '2025-05-26'),
  basicClient('CL-00402', 'Santiago', 'Liza', '2025-07-14'),
  basicClient('CL-00409', 'Ocampo', 'Rhea', '2025-08-11'),
  basicClient('CL-00426', 'Tolentino', 'Mark', '2025-10-06'),
  basicClient('CL-00433', 'Soriano', 'Ivy', '2025-12-01'),
  // Other Sindalan routes, with no receipts on record yet.
  basicClient('CL-00501', 'Aquino', 'Benjie', '2025-02-03', '01'),
  basicClient('CL-00502', 'Bernardo', 'Celia', '2025-06-16', '01'),
  basicClient('CL-00503', 'Canlas', 'Edwin', '2026-01-12', '01'),
  basicClient('CL-00511', 'David', 'Fe', '2025-03-24', '02'),
  basicClient('CL-00512', 'Espiritu', 'Gil', '2025-09-08', '02'),
  basicClient('CL-00521', 'Garcia', 'Helen', '2024-11-18', '04'),
  basicClient('CL-00522', 'Guevarra', 'Isko', '2025-05-05', '04'),
  basicClient('CL-00523', 'Lansangan', 'Jun', '2026-02-09', '04'),
  basicClient('CL-00531', 'Manalang', 'Karen', '2025-07-21', '06'),
  basicClient('CL-00532', 'Nucup', 'Leo', '2025-10-13', '06'),
  basicClient('CL-00541', 'Pangilinan', 'Mylene', '2024-08-05', 'OF'),
  basicClient('CL-00542', 'Quiambao', 'Nestor', '2025-12-15', 'OF'),
]

/** A 12-week loan at 20% flat interest, so the installment is a tenth of the principal. */
function weeklyLoan(
  id: string,
  clientId: string,
  installment: number,
  releaseRef: string,
  releasedOn = '2026-10-15',
): Loan {
  return {
    id,
    clientId,
    product: 'Weekly regular',
    frequencyDays: 7,
    releasedOn,
    releaseRef,
    principal: p(installment * 10),
    interest: p(installment * 2),
    installment: p(installment),
    term: 12,
    status: 'released',
    appliedOn: releasedOn,
    appliedBy: 'A. Cruz',
    approvedBy: 'T. Naguit',
    releasedBy: 'M. Santos',
  }
}

/** A loan waiting on approval or release, for the Loans screen. */
function application(id: string, clientId: string, installment: number, status: 'pending' | 'approved'): Loan {
  return {
    ...weeklyLoan(id, clientId, installment, '', '2026-10-22'),
    status,
    appliedOn: '2026-10-21',
    approvedBy: status === 'approved' ? 'T. Naguit' : undefined,
    releasedBy: undefined,
  }
}

export const loans: Loan[] = [
  {
    id: 'LN-2026-0381',
    clientId: 'CL-00418',
    product: 'Weekly regular',
    frequencyDays: 7,
    releasedOn: '2026-09-01',
    releaseRef: 'DV-1043',
    principal: p(10000),
    interest: p(2000),
    installment: p(1000),
    term: 12,
    status: 'released',
    appliedOn: '2026-08-28',
    appliedBy: 'A. Cruz',
    approvedBy: 'T. Naguit',
    releasedBy: 'M. Santos',
  },
  weeklyLoan('LN-2026-0412', 'CL-00301', 1100, 'DV-1101'),
  weeklyLoan('LN-2026-0413', 'CL-00322', 1450, 'DV-1102'),
  weeklyLoan('LN-2026-0414', 'CL-00345', 260, 'DV-1103'),
  weeklyLoan('LN-2026-0415', 'CL-00352', 720, 'DV-1104'),
  weeklyLoan('LN-2026-0416', 'CL-00367', 500, 'DV-1105'),
  weeklyLoan('LN-2026-0417', 'CL-00380', 350, 'DV-1106'),
  weeklyLoan('LN-2026-0418', 'CL-00391', 2060, 'DV-1107'),
  weeklyLoan('LN-2026-0419', 'CL-00402', 130, 'DV-1108'),
  weeklyLoan('LN-2026-0420', 'CL-00409', 600, 'DV-1109'),
  weeklyLoan('LN-2026-0421', 'CL-00426', 1000, 'DV-1110'),
  weeklyLoan('LN-2026-0422', 'CL-00433', 290, 'DV-1111'),
  weeklyLoan('LN-2026-0431', 'CL-00501', 800, 'DV-1121', '2026-10-08'),
  weeklyLoan('LN-2026-0432', 'CL-00502', 1500, 'DV-1122', '2026-10-15'),
  weeklyLoan('LN-2026-0433', 'CL-00503', 450, 'DV-1123', '2026-09-24'),
  weeklyLoan('LN-2026-0441', 'CL-00511', 1200, 'DV-1131', '2026-10-15'),
  weeklyLoan('LN-2026-0442', 'CL-00512', 650, 'DV-1132', '2026-10-08'),
  weeklyLoan('LN-2026-0451', 'CL-00521', 2000, 'DV-1141', '2026-10-15'),
  weeklyLoan('LN-2026-0452', 'CL-00522', 900, 'DV-1142', '2026-10-01'),
  weeklyLoan('LN-2026-0453', 'CL-00523', 350, 'DV-1143', '2026-10-15'),
  weeklyLoan('LN-2026-0461', 'CL-00531', 1100, 'DV-1151', '2026-10-15'),
  weeklyLoan('LN-2026-0462', 'CL-00532', 500, 'DV-1152', '2026-10-08'),
  weeklyLoan('LN-2026-0471', 'CL-00541', 3000, 'DV-1161', '2026-10-15'),
  weeklyLoan('LN-2026-0472', 'CL-00542', 700, 'DV-1162', '2026-10-08'),
  // Applications in progress.
  application('LN-2026-0481', 'CL-00352', 900, 'pending'),
  application('LN-2026-0482', 'CL-00512', 1200, 'approved'),
]

export const penalties: Penalty[] = [
  { ref: 'PEN-0211', loanId: 'LN-2026-0381', date: '2026-10-06', amount: p(50) },
]

function receipt(
  no: string,
  date: string,
  clientId: string,
  loanId: string,
  loansReceivable: number,
  safekeeping: number,
  particulars = 'Weekly payment',
): Receipt {
  return {
    no,
    date,
    clientId,
    loanId,
    collectorId: '03',
    branchId: 'sindalan',
    amount: p(loansReceivable + safekeeping),
    loansReceivable: p(loansReceivable),
    safekeeping: p(safekeeping),
    particulars,
    status: 'posted',
  }
}

const today = '2026-10-22'

export const receipts: Receipt[] = [
  // Castillo, Nora: earlier payments on LN-2026-0381
  receipt('446210', '2026-09-08', 'CL-00418', 'LN-2026-0381', 1000, 0),
  receipt('446602', '2026-09-15', 'CL-00418', 'LN-2026-0381', 1000, 0),
  receipt('447015', '2026-09-22', 'CL-00418', 'LN-2026-0381', 1000, 0),
  receipt('447388', '2026-09-29', 'CL-00418', 'LN-2026-0381', 800, 0),
  receipt('448790', '2026-10-06', 'CL-00418', 'LN-2026-0381', 1250, 0),
  receipt('449166', '2026-10-13', 'CL-00418', 'LN-2026-0381', 1000, 0),
  receipt('449870', '2026-10-20', 'CL-00418', 'LN-2026-0381', 1000, 100),
  // Collector 03, October 22, 2026
  receipt('450101', today, 'CL-00301', 'LN-2026-0412', 1100, 100),
  receipt('450102', today, 'CL-00322', 'LN-2026-0413', 1450, 100),
  receipt('450103', today, 'CL-00345', 'LN-2026-0414', 260, 40),
  receipt('450104', today, 'CL-00352', 'LN-2026-0415', 720, 50),
  {
    ...receipt('450105', today, 'CL-00367', 'LN-2026-0416', 0, 0),
    status: 'cancelled',
    cancelReason: 'Wrong client encoded',
  },
  receipt('450106', today, 'CL-00380', 'LN-2026-0417', 350, 50),
  receipt('450107', today, 'CL-00391', 'LN-2026-0418', 2060, 0),
  receipt('450108', today, 'CL-00402', 'LN-2026-0419', 130, 20),
  receipt('450109', today, 'CL-00409', 'LN-2026-0420', 600, 0),
  receipt('450110', today, 'CL-00426', 'LN-2026-0421', 1000, 0),
  receipt('450111', today, 'CL-00433', 'LN-2026-0422', 290, 50),
]
