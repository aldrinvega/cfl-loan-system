import { formatMdy } from '@/lib/dates'
import { formatAmount, formatPeso, sum } from '@/lib/money'
import { safekeepingFor } from '@/lib/ledger'
import { Page } from '@/components/layout'
import { downloadCsv, ExportButtons, ReportTabs, ReportTitle } from '@/components/reports'
import { PageHeader, SampleNote, StatCard } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { collectorLabel } from '@/state/session'
import { clientName, useStore } from '@/state/store'
import { ReportFilters, useReportFilters } from './filters'

/** What the company holds for each client in safekeeping, as of the business date. */
export function SafekeepingBalances() {
  const { clients, receipts } = useStore()
  const filters = useReportFilters({ from: '2026-10-01', to: '2026-10-23' })
  const { from, to } = filters

  const rows = clients
    .filter((c) => filters.inScope(c.branchId, c.collectorId))
    .map((client) => {
      const own = receipts.filter((r) => r.clientId === client.id && r.date <= to)
      const sk = safekeepingFor(client.safekeepingOpening, own)
      const beginning =
        client.safekeepingOpening + sum(sk.deposits.filter((r) => r.date < from), (r) => r.safekeeping)
      const deposits = sum(sk.deposits.filter((r) => r.date >= from), (r) => r.safekeeping)
      return { client, beginning, deposits, ending: sk.balance, lastDeposit: sk.lastDeposit?.date }
    })
    .filter((r) => r.ending > 0 || r.deposits > 0)
    .sort((a, b) => b.ending - a.ending)

  const totals = {
    beginning: sum(rows, (r) => r.beginning),
    deposits: sum(rows, (r) => r.deposits),
    ending: sum(rows, (r) => r.ending),
  }
  const range = `${formatMdy(from)} to ${formatMdy(to)}`

  function exportExcel() {
    downloadCsv(`safekeeping-${from}-to-${to}.csv`, [
      [`SAFEKEEPING BALANCES for ${range}`],
      [filters.branchName, filters.collectorLine],
      [],
      ['Client', 'Client ID', 'Collector', 'Beginning', 'Deposits', 'Ending', 'Last deposit'],
      ...rows.map((r) => [
        clientName(r.client),
        r.client.id,
        collectorLabel(r.client.collectorId),
        formatAmount(r.beginning),
        formatAmount(r.deposits),
        formatAmount(r.ending),
        r.lastDeposit ? formatMdy(r.lastDeposit) : '',
      ]),
      ['Totals', '', '', formatAmount(totals.beginning), formatAmount(totals.deposits), formatAmount(totals.ending), ''],
    ])
  }

  return (
    <Page crumbs={['Reports', 'Safekeeping balances']}>
      <PageHeader
        title="Safekeeping balances"
        description="Money held for clients, with deposits made in the period."
        actions={<ExportButtons onExcel={exportExcel} />}
      />
      <ReportTabs />
      <ReportFilters filters={filters} />

      <div className="no-print grid gap-4 sm:grid-cols-3">
        <StatCard label="Clients with a balance" value={rows.length} />
        <StatCard label="Deposits in period" value={formatPeso(totals.deposits)} />
        <StatCard label="Total held" value={formatPeso(totals.ending)} />
      </div>

      <Card aria-label="Report preview" className="print:ring-0">
        <CardContent className="flex flex-col gap-6">
          <ReportTitle branch={filters.branchName} title={`SAFEKEEPING BALANCES for ${range}`} subtitle={filters.collectorLine} />
          <div className="-mx-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead className="text-right">Beginning</TableHead>
                  <TableHead className="text-right">Deposits</TableHead>
                  <TableHead className="text-right">Ending</TableHead>
                  <TableHead>Last deposit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.client.id}>
                    <TableCell className="font-medium">{clientName(r.client)}</TableCell>
                    <TableCell>{r.client.id}</TableCell>
                    <TableCell>{collectorLabel(r.client.collectorId)}</TableCell>
                    <TableCell className="text-right">{formatAmount(r.beginning)}</TableCell>
                    <TableCell className="text-right">{formatAmount(r.deposits)}</TableCell>
                    <TableCell className="text-right font-medium">{formatAmount(r.ending)}</TableCell>
                    <TableCell>{r.lastDeposit ? formatMdy(r.lastDeposit) : '–'}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                      No safekeeping balances for these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Totals · {rows.length} clients</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.beginning)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.deposits)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.ending)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Beginning + deposits = ending. Withdrawals aren't in the sample data yet.
          </p>
        </CardContent>
      </Card>
      <SampleNote />
    </Page>
  )
}
