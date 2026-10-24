import { useState } from 'react'
import { formatLong, formatMdy } from '@/lib/dates'
import { formatAmount, formatPeso } from '@/lib/money'
import { cn } from '@/lib/utils'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { downloadCsv, ExportButtons, ReportTabs, ReportTitle, SimpleSelect } from '@/components/reports'
import { PageHeader, SampleNote, StatCard, StatStrip } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { collectorLabel, useSession } from '@/state/session'
import { clientName, useClientAccount, useStore } from '@/state/store'

/** One loan's full ledger, built from its release, penalties and posted receipts. */
export function LoanLedger() {
  const { loans, clients } = useStore()
  const { canSeeClient } = useSession()
  const visibleLoans = loans.filter((l) => {
    const client = clients.find((c) => c.id === l.clientId)
    return client && canSeeClient(client)
  })
  const [loanId, setLoanId] = useState(visibleLoans[0]?.id ?? '')
  const loan = visibleLoans.find((l) => l.id === loanId)
  const account = useClientAccount(loan?.clientId)
  const entry = account?.loans.find((l) => l.loan.id === loanId)

  const options = visibleLoans.map((l) => {
    const client = clients.find((c) => c.id === l.clientId)!
    return { value: l.id, label: `${l.id} · ${clientName(client)}` }
  })

  function exportExcel() {
    if (!entry || !account) return
    downloadCsv(`loan-ledger-${entry.loan.id}.csv`, [
      [`LOAN LEDGER ${entry.loan.id}`],
      [clientName(account.client), account.client.id],
      [],
      ['Date', 'Reference', 'Entry', 'Charges', 'Payment', 'Balance'],
      ...entry.ledger.map((e) => [formatMdy(e.date), e.reference, e.entry, formatAmount(e.charges), formatAmount(e.payment), formatAmount(e.balance)]),
      ['Totals', '', '', formatAmount(entry.summary.totalCharges), formatAmount(entry.summary.totalPaid), formatAmount(entry.summary.balance)],
    ])
  }

  return (
    <Page crumbs={['Reports', 'Loan ledger']}>
      <PageHeader
        title="Loan ledger"
        description="Every charge and payment on one loan, with the running balance."
        actions={<ExportButtons onExcel={exportExcel} />}
      />
      <ReportTabs />

      <div className="no-print">
        <div className="flex flex-wrap items-end gap-4">
          <Field className="max-w-md flex-1">
            <FieldLabel htmlFor="ll-loan">Loan</FieldLabel>
            <SimpleSelect id="ll-loan" value={loanId} onValueChange={setLoanId} options={options} />
          </Field>
          {account && (
            <ButtonLink variant="outline" to={`/clients/${account.client.id}`}>
              Open client profile
            </ButtonLink>
          )}
        </div>
      </div>

      {entry && account ? (
        <>
          <StatStrip>
            <StatCard label="Balance" value={formatPeso(entry.summary.balance)} />
            <StatCard label="Total charges" value={formatPeso(entry.summary.totalCharges)} />
            <StatCard label="Total paid" value={formatPeso(entry.summary.totalPaid)} />
            <StatCard
              label="Next due"
              value={entry.summary.next ? formatPeso(entry.summary.next.amountDue) : 'Paid'}
            />
          </StatStrip>

          <Card aria-label="Report preview" className="print:ring-0">
            <CardContent className="flex flex-col gap-6">
              <ReportTitle
                branch={`${clientName(account.client)} · ${account.client.id}`}
                title={`LOAN LEDGER ${entry.loan.id}`}
                subtitle={`${entry.loan.product} · released ${formatLong(entry.loan.releasedOn)} · matures ${formatLong(entry.summary.maturesOn)} · Collector ${collectorLabel(account.client.collectorId)}`}
              />
              <Progress value={entry.summary.percentPaid}>
                <ProgressLabel>
                  {entry.summary.installmentsPaid} of {entry.loan.term} installments paid
                </ProgressLabel>
                <ProgressValue className="ml-auto" />
              </Progress>
              <div className="-mx-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead className="text-right">Charges</TableHead>
                      <TableHead className="text-right">Payment</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.ledger.map((e) => (
                      <TableRow key={`${e.reference}-${e.kind}`} className={cn(e.kind === 'penalty' && 'bg-destructive/5')}>
                        <TableCell>{formatMdy(e.date)}</TableCell>
                        <TableCell>{e.reference}</TableCell>
                        <TableCell className={cn(e.kind === 'penalty' && 'font-medium text-destructive')}>{e.entry}</TableCell>
                        <TableCell className="text-right">{e.charges ? formatAmount(e.charges) : '–'}</TableCell>
                        <TableCell className="text-right">{e.payment ? formatAmount(e.payment) : '–'}</TableCell>
                        <TableCell className="text-right font-medium">{formatAmount(e.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>Totals</TableCell>
                      <TableCell className="text-right">{formatAmount(entry.summary.totalCharges)}</TableCell>
                      <TableCell className="text-right">{formatAmount(entry.summary.totalPaid)}</TableCell>
                      <TableCell className="text-right">{formatAmount(entry.summary.balance)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No loans in the branches you can see.</p>
      )}
      <SampleNote />
    </Page>
  )
}
