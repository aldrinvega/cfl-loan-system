import { addDays, formatMdy } from '@/lib/dates'
import { formatAmount, formatPeso, sum } from '@/lib/money'
import { ROUTE_SNAPSHOT_DATE } from '@/data/routeAccounts'
import { daysBetween, useOpenLoans } from '@/state/portfolio'
import { Page } from '@/components/layout'
import { downloadCsv, ExportButtons, ReportTabs, ReportTitle } from '@/components/reports'
import { PageHeader, SampleNote, StatCard } from '@/components/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReportFilters, useReportFilters } from './filters'

const BUCKETS = [
  { label: '0–30 days', max: 30 },
  { label: '31–60 days', max: 60 },
  { label: '61–90 days', max: 90 },
  { label: '91–180 days', max: 180 },
  { label: '181–365 days', max: 365 },
  { label: 'Over a year', max: Infinity },
]

/** Open balances grouped by days since the borrower last paid. */
export function Aging() {
  const all = useOpenLoans()
  const filters = useReportFilters({ from: ROUTE_SNAPSHOT_DATE, to: ROUTE_SNAPSHOT_DATE })
  const asOf = ROUTE_SNAPSHOT_DATE

  const rows = all.filter((r) => filters.inScope(r.branchId, r.collectorId))
  const total = sum(rows, (r) => r.balance)
  const buckets = BUCKETS.map((b, i) => {
    const min = i === 0 ? -Infinity : BUCKETS[i - 1].max
    const inBucket = rows.filter((r) => {
      const days = daysBetween(r.lastPaymentOn, asOf)
      return days > min && days <= b.max
    })
    const balance = sum(inBucket, (r) => r.balance)
    return { ...b, accounts: inBucket.length, balance, share: total ? (balance / total) * 100 : 0 }
  })
  const over90 = rows
    .map((r) => ({ ...r, days: daysBetween(r.lastPaymentOn, asOf) }))
    .filter((r) => r.days > 90)
    .sort((a, b) => b.days - a.days)
  const atRisk = sum(over90, (r) => r.balance)

  function exportExcel() {
    downloadCsv(`aging-${asOf}.csv`, [
      [`AGING OF RECEIVABLES as of ${formatMdy(asOf)}`],
      [filters.branchName, filters.collectorLine],
      [],
      ['Days since last payment', 'Accounts', 'Balance', 'Share'],
      ...buckets.map((b) => [b.label, b.accounts, formatAmount(b.balance), `${b.share.toFixed(2)}%`]),
      ['Total', rows.length, formatAmount(total), '100.00%'],
    ])
  }

  return (
    <Page crumbs={['Reports', 'Aging of receivables']}>
      <PageHeader
        title="Aging of receivables"
        description="Open loan balances grouped by how long since the borrower last paid."
        actions={<ExportButtons onExcel={exportExcel} />}
      />
      <ReportTabs />
      <ReportFilters filters={filters} dates={false} />

      <div className="no-print grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open accounts" value={rows.length} />
        <StatCard label="Outstanding balance" value={formatPeso(total)} />
        <StatCard label="Over 90 days" value={formatPeso(atRisk)} />
        <StatCard label="Portfolio at risk" value={`${total ? ((atRisk / total) * 100).toFixed(2) : '0.00'}%`} />
      </div>

      <Card aria-label="Report preview" className="print:ring-0">
        <CardContent className="flex flex-col gap-6">
          <ReportTitle
            branch={filters.branchName}
            title={`AGING OF RECEIVABLES as of ${formatMdy(asOf)}`}
            subtitle={filters.collectorLine}
          />
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Days since last payment</TableHead>
                  <TableHead className="text-right">Accounts</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-1/3">Share of balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buckets.map((b) => (
                  <TableRow key={b.label}>
                    <TableCell className="font-medium">{b.label}</TableCell>
                    <TableCell className="text-right">{b.accounts}</TableCell>
                    <TableCell className="text-right">{formatAmount(b.balance)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={b.share} className="flex-1" aria-label={`${b.label} share`} />
                        <span className="w-14 text-right text-xs text-muted-foreground">{b.share.toFixed(2)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{rows.length}</TableCell>
                  <TableCell className="text-right">{formatAmount(total)}</TableCell>
                  <TableCell>100.00%</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Over 90 days</CardTitle>
          <CardDescription>
            No payment since {formatMdy(addDays(asOf, -90))} or earlier. These need a visit or a demand letter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Last payment</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {over90.map((r) => (
                  <TableRow key={r.loanId}>
                    <TableCell>{r.loanId}</TableCell>
                    <TableCell className="font-medium">{r.borrower}</TableCell>
                    <TableCell>{formatMdy(r.lastPaymentOn)}</TableCell>
                    <TableCell className="text-right">{r.days}</TableCell>
                    <TableCell className="text-right">{formatAmount(r.balance)}</TableCell>
                  </TableRow>
                ))}
                {over90.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                      Nothing over 90 days.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <SampleNote />
    </Page>
  )
}
