import { useMemo } from 'react'
import { penalties } from '@/data/sample'
import { collectionDays, type CollectionDay } from '@/data/reportSamples'
import { ROUTE_SNAPSHOT_DATE, routeAccounts } from '@/data/routeAccounts'
import type { IsoDate } from '@/lib/dates'
import { buildLedger, splitAccount, summarizeLoan } from '@/lib/ledger'
import type { Centavos } from '@/lib/money'
import { totalReceipts } from '@/lib/receipts'
import { useSession } from './session'
import { clientName, useStore } from './store'

export type OpenLoan = {
  loanId: string
  borrower: string
  /** Set for loans kept in the live store, so screens can link to the client. */
  clientId?: string
  branchId: string
  collectorId: string
  balance: Centavos
  lastPaymentOn: IsoDate
  /** The next amount the borrower owes, and when. */
  due: { on: IsoDate; amount: Centavos } | null
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

/**
 * Every loan with a balance. Sindalan loans come from the live ledger, so they move as receipts
 * are posted; Angeles loans come from the October 23 route snapshot.
 */
export function useOpenLoans(): OpenLoan[] {
  const { loans, receipts, clients } = useStore()
  return useMemo(() => {
    const live = loans.flatMap((loan): OpenLoan[] => {
      const client = clients.find((c) => c.id === loan.clientId)!
      const summary = summarizeLoan(loan, buildLedger(loan, receipts, penalties))
      if (summary.balance <= 0) return []
      const paid = receipts
        .filter((r) => r.loanId === loan.id && r.status === 'posted')
        .map((r) => r.date)
        .sort()
      return [
        {
          loanId: loan.id,
          borrower: clientName(client),
          clientId: client.id,
          branchId: client.branchId,
          collectorId: client.collectorId,
          balance: summary.balance,
          lastPaymentOn: paid.at(-1) ?? loan.releasedOn,
          due: summary.next ? { on: summary.next.dueOn, amount: summary.next.amountDue } : null,
        },
      ]
    })
    const snapshot = routeAccounts.map(
      (a): OpenLoan => ({
        loanId: a.loanId,
        borrower: a.borrower,
        branchId: a.branchId,
        collectorId: a.collectorId,
        balance: a.balance,
        lastPaymentOn: a.lastPaymentOn,
        due: a.dueToday > 0 ? { on: ROUTE_SNAPSHOT_DATE, amount: a.dueToday + a.penalty } : null,
      }),
    )
    return [...live, ...snapshot]
  }, [loans, receipts, clients])
}

/**
 * Daily collections per collector. Collector 03's day in the open period comes from the live
 * receipts, so it moves when a receipt is posted or cancelled.
 */
export function useCollectionDays(): CollectionDay[] {
  const { receipts } = useStore()
  return useMemo(
    () =>
      collectionDays.map((d) => {
        if (d.collectorId !== '03' || d.date !== '2026-10-22') return d
        const totals = totalReceipts(receipts.filter((r) => r.collectorId === '03' && r.date === d.date))
        return { ...d, collected: totals.cash, accountsPaid: totals.posted }
      }),
    [receipts],
  )
}

/** The open accounts on one collector's route, with what each owes today. */
export function useRouteAccounts(collectorId: string | undefined) {
  const { clients, loans, receipts } = useStore()
  const { user, canSeeClient } = useSession()
  return useMemo(() => {
    if (!collectorId) return []
    return loans
      .flatMap((loan) => {
        const client = clients.find((c) => c.id === loan.clientId)
        if (!client || client.collectorId !== collectorId || !canSeeClient(client)) return []
        const summary = summarizeLoan(loan, buildLedger(loan, receipts, penalties))
        if (summary.balance <= 0) return []
        const split = splitAccount(loan, receipts, penalties)
        const overdue = summary.next !== null && summary.next.dueOn < user.businessDate
        return [{ loan, client, summary, split, status: overdue ? ('arrears' as const) : ('current' as const) }]
      })
      .sort((a, b) => clientName(a.client).localeCompare(clientName(b.client)))
  }, [collectorId, clients, loans, receipts, canSeeClient, user.businessDate])
}

export type RouteAccount = ReturnType<typeof useRouteAccounts>[number]
