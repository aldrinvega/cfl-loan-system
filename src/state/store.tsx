import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import * as sample from '@/data/sample'
import { disbursementFor, disbursements as sampleDisbursements, type Disbursement } from '@/data/reportSamples'
import type { Client, Loan, Receipt } from '@/data/types'
import type { IsoDate } from '@/lib/dates'
import { buildLedger, safekeepingFor, summarizeLoan } from '@/lib/ledger'
import { nextNumber } from '@/lib/loans'
import { cancelled } from '@/lib/receipts'

type State = { receipts: Receipt[]; loans: Loan[]; disbursements: Disbursement[] }

type Action =
  | { type: 'post'; receipt: Receipt }
  | { type: 'cancel'; no: string; reason: string }
  | { type: 'submitLoan'; loan: Loan }
  | { type: 'approveLoan'; id: string; by: string }
  | { type: 'releaseLoan'; id: string; by: string; on: IsoDate; voucher: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'post':
      if (state.receipts.some((r) => r.no === action.receipt.no)) return state
      return { ...state, receipts: [...state.receipts, action.receipt] }
    case 'cancel':
      // Posted receipts are never edited; cancelling keeps the number with zero amounts.
      return {
        ...state,
        receipts: state.receipts.map((r) =>
          r.no === action.no && r.status === 'posted' ? cancelled(r, action.reason) : r,
        ),
      }
    case 'submitLoan':
      return { ...state, loans: [...state.loans, action.loan] }
    case 'approveLoan':
      return {
        ...state,
        loans: state.loans.map((l) =>
          l.id === action.id && l.status === 'pending' ? { ...l, status: 'approved', approvedBy: action.by } : l,
        ),
      }
    case 'releaseLoan': {
      const loan = state.loans.find((l) => l.id === action.id && l.status === 'approved')
      if (!loan) return state
      const client = sample.clients.find((c) => c.id === loan.clientId)!
      const released: Loan = {
        ...loan,
        status: 'released',
        releasedOn: action.on,
        releaseRef: action.voucher,
        releasedBy: action.by,
      }
      return {
        ...state,
        loans: state.loans.map((l) => (l.id === loan.id ? released : l)),
        disbursements: [
          ...state.disbursements,
          disbursementFor({
            voucher: action.voucher,
            date: action.on,
            branchId: client.branchId,
            borrower: clientName(client),
            loanId: loan.id,
            product: loan.product,
            principal: loan.principal,
            releasedBy: action.by,
          }),
        ],
      }
    }
  }
}

export type NewLoan = Pick<Loan, 'clientId' | 'product' | 'frequencyDays' | 'principal' | 'interest' | 'installment' | 'term'>

type Store = {
  receipts: Receipt[]
  clients: Client[]
  /** Released loans: the ones with a balance, routes and payments. */
  loans: Loan[]
  /** Every loan, including applications waiting on approval or release. */
  allLoans: Loan[]
  disbursements: Disbursement[]
  postReceipt: (receipt: Receipt) => void
  cancelReceipt: (no: string, reason: string) => void
  /** Files a loan application and returns its loan ID. */
  submitLoan: (loan: NewLoan, by: string, on: IsoDate) => string
  approveLoan: (id: string, by: string) => void
  /** Releases an approved loan and returns its disbursement voucher number. */
  releaseLoan: (id: string, by: string, on: IsoDate) => string
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    receipts: sample.receipts,
    loans: sample.loans,
    disbursements: sampleDisbursements,
  })
  const value = useMemo<Store>(
    () => ({
      receipts: state.receipts,
      clients: sample.clients,
      loans: state.loans.filter((l) => l.status === 'released'),
      allLoans: state.loans,
      disbursements: state.disbursements,
      postReceipt: (receipt) => dispatch({ type: 'post', receipt }),
      cancelReceipt: (no, reason) => dispatch({ type: 'cancel', no, reason }),
      submitLoan(loan, by, on) {
        const id = nextNumber(
          state.loans.map((l) => l.id),
          `LN-${on.slice(0, 4)}-`,
          4,
        )
        dispatch({
          type: 'submitLoan',
          loan: { ...loan, id, status: 'pending', releasedOn: on, releaseRef: '', appliedOn: on, appliedBy: by },
        })
        return id
      },
      approveLoan: (id, by) => dispatch({ type: 'approveLoan', id, by }),
      releaseLoan(id, by, on) {
        const voucher = nextNumber(
          state.disbursements.map((d) => d.voucher),
          'DV-',
          4,
        )
        dispatch({ type: 'releaseLoan', id, by, on, voucher })
        return voucher
      },
    }),
    [state],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}

export function clientName(client: Pick<Client, 'lastName' | 'firstName'>): string {
  return `${client.lastName}, ${client.firstName}`
}

export function clientInitials(client: Pick<Client, 'lastName' | 'firstName'>): string {
  return `${client.firstName[0]}${client.lastName[0]}`.toUpperCase()
}

/** Everything a screen needs about one client: loans with ledgers, safekeeping and receipts. */
export function useClientAccount(clientId: string | undefined) {
  const { clients, loans, receipts } = useStore()
  return useMemo(() => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return null
    const clientReceipts = receipts
      .filter((r) => r.clientId === client.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no))
    const clientLoans = loans
      .filter((l) => l.clientId === client.id)
      .map((loan) => {
        const ledger = buildLedger(loan, receipts, sample.penalties)
        return { loan, ledger, summary: summarizeLoan(loan, ledger) }
      })
    const openLoans = clientLoans.filter((l) => l.summary.balance > 0)
    return {
      client,
      receipts: clientReceipts,
      loans: clientLoans,
      openLoans,
      loanBalance: openLoans.reduce((t, l) => t + l.summary.balance, 0),
      safekeeping: safekeepingFor(client.safekeepingOpening, clientReceipts),
    }
  }, [clients, loans, receipts, clientId])
}

export type ClientAccount = NonNullable<ReturnType<typeof useClientAccount>>
