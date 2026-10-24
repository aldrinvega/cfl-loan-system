import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { formatMdy, formatShort } from '@/lib/dates'
import { formatAmount, formatPeso, sum } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useCollectionDays } from '@/state/portfolio'
import { Page } from '@/components/layout'
import { downloadCsv, ExportButtons, ReportTabs, ReportTitle } from '@/components/reports'
import { PageHeader, SampleNote, StatCard, StatStrip } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
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
import { ReportFilters, useReportFilters } from './filters'

const chartConfig = {
  target: { label: 'Target', color: 'var(--chart-2)' },
  collected: { label: 'Collected', color: 'var(--chart-4)' },
} satisfies ChartConfig

const efficiency = (collected: number, target: number) => (target === 0 ? 0 : (collected / target) * 100)

function EfficiencyBadge({ value }: { value: number }) {
  return (
    <Badge variant={value < 80 ? 'destructive' : value >= 100 ? 'positive' : 'secondary'}>{value.toFixed(1)}%</Badge>
  )
}

export function Collections() {
  const { user } = useSession()
  // The sample data covers the week of October 19.
  const filters = useReportFilters({ from: '2026-10-19', to: user.businessDate })
  const { branchName, collectorLine, from, to } = filters

  const days = useCollectionDays()

  const rows = days
    .filter((d) => filters.inScope(d.branchId, d.collectorId) && d.date >= from && d.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.collectorId.localeCompare(b.collectorId))

  const target = sum(rows, (d) => d.target)
  const collected = sum(rows, (d) => d.collected)
  const due = rows.reduce((t, d) => t + d.accountsDue, 0)
  const paid = rows.reduce((t, d) => t + d.accountsPaid, 0)

  const chartData = [...new Set(rows.map((d) => d.date))].map((date) => {
    const onDay = rows.filter((d) => d.date === date)
    return {
      day: formatShort(date),
      target: sum(onDay, (d) => d.target) / 100,
      collected: sum(onDay, (d) => d.collected) / 100,
    }
  })

  function exportExcel() {
    downloadCsv(`collections-${from}-to-${to}.csv`, [
      [`COLLECTIONS for ${formatMdy(from)} to ${formatMdy(to)}`],
      [branchName, collectorLine],
      [],
      ['Date', 'Collector', 'Accounts due', 'Accounts paid', 'Target', 'Collected', 'Variance', 'Efficiency'],
      ...rows.map((d) => [
        formatMdy(d.date),
        collectorLabel(d.collectorId),
        d.accountsDue,
        d.accountsPaid,
        formatAmount(d.target),
        formatAmount(d.collected),
        formatAmount(d.collected - d.target),
        `${efficiency(d.collected, d.target).toFixed(1)}%`,
      ]),
      ['Totals', '', due, paid, formatAmount(target), formatAmount(collected), formatAmount(collected - target), `${efficiency(collected, target).toFixed(1)}%`],
    ])
  }

  return (
    <Page crumbs={['Reports', 'Collections']}>
      <PageHeader
        title="Collections"
        description="What each collector brought in against the day's target."
        actions={<ExportButtons onExcel={exportExcel} />}
      />
      <ReportTabs />
      <ReportFilters filters={filters} />

      <StatStrip>
        <StatCard label="Target" value={formatPeso(target)} />
        <StatCard label="Collected" value={formatPeso(collected)} />
        <StatCard label="Efficiency" value={`${efficiency(collected, target).toFixed(1)}%`} />
        <StatCard label="Accounts paid" value={`${paid} of ${due}`} />
      </StatStrip>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Target vs. collected</CardTitle>
          <CardDescription>
            {formatMdy(from)} to {formatMdy(to)} · {collectorLine}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="target" fill="var(--color-target)" radius={4} isAnimationActive={false} />
              <Bar dataKey="collected" fill="var(--color-collected)" radius={4} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card aria-label="Report preview" className="print:ring-0">
        <CardContent className="flex flex-col gap-6">
          <ReportTitle
            branch={branchName}
            title={`COLLECTIONS for ${formatMdy(from)} to ${formatMdy(to)}`}
            subtitle={collectorLine}
          />
          <div className="-mx-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead className="text-right">Accounts due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => {
                  const variance = d.collected - d.target
                  return (
                    <TableRow key={`${d.date}-${d.collectorId}`}>
                      <TableCell>{formatMdy(d.date)}</TableCell>
                      <TableCell>{collectorLabel(d.collectorId)}</TableCell>
                      <TableCell className="text-right">{d.accountsDue}</TableCell>
                      <TableCell className="text-right">{d.accountsPaid}</TableCell>
                      <TableCell className="text-right">{formatAmount(d.target)}</TableCell>
                      <TableCell className="text-right">{formatAmount(d.collected)}</TableCell>
                      <TableCell className={cn('text-right', variance < 0 ? 'text-destructive' : 'text-positive')}>
                        {variance < 0 ? `(${formatAmount(-variance)})` : formatAmount(variance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <EfficiencyBadge value={efficiency(d.collected, d.target)} />
                      </TableCell>
                    </TableRow>
                  )
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                      No collections for these filters. The sample data covers 09/21/2026 to 10/23/2026.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Totals</TableCell>
                  <TableCell className="text-right">{due}</TableCell>
                  <TableCell className="text-right">{paid}</TableCell>
                  <TableCell className="text-right">{formatAmount(target)}</TableCell>
                  <TableCell className="text-right">{formatAmount(collected)}</TableCell>
                  <TableCell className="text-right">
                    {collected < target ? `(${formatAmount(target - collected)})` : formatAmount(collected - target)}
                  </TableCell>
                  <TableCell className="text-right">{efficiency(collected, target).toFixed(1)}%</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Variance in parentheses means the collector came in under target. Today's target counts accounts that
            haven't been visited yet.
          </p>
        </CardContent>
      </Card>
      <SampleNote />
    </Page>
  )
}
