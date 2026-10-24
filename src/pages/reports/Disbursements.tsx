import { formatMdy } from '@/lib/dates'
import { formatAmount, formatPeso, sum } from '@/lib/money'
import { netProceeds } from '@/data/reportSamples'
import { useStore } from '@/state/store'
import { Page } from '@/components/layout'
import { downloadCsv, ExportButtons, ReportTabs, ReportTitle } from '@/components/reports'
import { PageHeader, SampleNote, StatCard, StatStrip } from '@/components/shared'
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
import { ReportFilters, useReportFilters } from './filters'

export function Disbursements() {
  const { disbursements } = useStore()
  const filters = useReportFilters({ from: '2026-09-01', to: '2026-10-23' })
  const { branchName, from, to } = filters

  const rows = disbursements
    .filter((d) => filters.inScope(d.branchId) && d.date >= from && d.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.voucher.localeCompare(b.voucher))

  const totals = {
    principal: sum(rows, (d) => d.principal),
    serviceFee: sum(rows, (d) => d.serviceFee),
    insurance: sum(rows, (d) => d.insurance),
    net: sum(rows, netProceeds),
  }
  const range = `${formatMdy(from)} to ${formatMdy(to)}`

  function exportExcel() {
    downloadCsv(`disbursements-${from}-to-${to}.csv`, [
      [`DISBURSEMENTS for ${range}`],
      [branchName],
      [],
      ['Date', 'Voucher', 'Borrower', 'Loan', 'Product', 'Principal', 'Service fee', 'Insurance', 'Net proceeds', 'Released by'],
      ...rows.map((d) => [
        formatMdy(d.date),
        d.voucher,
        d.borrower,
        d.loanId,
        d.product,
        formatAmount(d.principal),
        formatAmount(d.serviceFee),
        formatAmount(d.insurance),
        formatAmount(netProceeds(d)),
        d.releasedBy,
      ]),
      ['Totals', '', '', '', '', formatAmount(totals.principal), formatAmount(totals.serviceFee), formatAmount(totals.insurance), formatAmount(totals.net), ''],
    ])
  }

  return (
    <Page crumbs={['Reports', 'Disbursements']}>
      <PageHeader
        title="Disbursements"
        description="Loans released, with what was deducted and what the borrower took home."
        actions={<ExportButtons onExcel={exportExcel} />}
      />
      <ReportTabs />
      <ReportFilters filters={filters} collector={false} />

      <StatStrip>
        <StatCard label="Loans released" value={rows.length} />
        <StatCard label="Principal" value={formatPeso(totals.principal)} />
        <StatCard label="Fees and insurance" value={formatPeso(totals.serviceFee + totals.insurance)} />
        <StatCard label="Net cash released" value={formatPeso(totals.net)} />
      </StatStrip>

      <Card aria-label="Report preview" className="print:ring-0">
        <CardContent className="flex flex-col gap-6">
          <ReportTitle branch={branchName} title={`DISBURSEMENTS for ${range}`} subtitle={`${rows.length} ${rows.length === 1 ? 'loan' : 'loans'} released`} />
          <div className="-mx-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Loan</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Service fee</TableHead>
                  <TableHead className="text-right">Insurance</TableHead>
                  <TableHead className="text-right">Net proceeds</TableHead>
                  <TableHead>Released by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.voucher}>
                    <TableCell>{formatMdy(d.date)}</TableCell>
                    <TableCell>{d.voucher}</TableCell>
                    <TableCell className="font-medium">{d.borrower}</TableCell>
                    <TableCell>
                      {d.loanId}
                      <div className="text-xs text-muted-foreground">{d.product}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatAmount(d.principal)}</TableCell>
                    <TableCell className="text-right">{formatAmount(d.serviceFee)}</TableCell>
                    <TableCell className="text-right">{formatAmount(d.insurance)}</TableCell>
                    <TableCell className="text-right font-medium">{formatAmount(netProceeds(d))}</TableCell>
                    <TableCell>{d.releasedBy}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                      No loans released in this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Totals · {rows.length} loans</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.principal)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.serviceFee)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.insurance)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.net)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Net proceeds = principal − 3% service fee − 1% credit life insurance.
          </p>
        </CardContent>
      </Card>
      <SampleNote />
    </Page>
  )
}
