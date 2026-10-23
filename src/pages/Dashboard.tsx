import { useState, type ReactNode } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  BookOpen,
  CalendarClock,
  ChartColumn,
  CircleAlert,
  CircleCheck,
  FilePlus,
  Clock,
  Lock,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { addDays, formatLong, formatMdy, formatShort, formatWeekdayLong, type IsoDate } from '@/lib/dates'
import { formatPeso, sum } from '@/lib/money'
import { totalReceipts } from '@/lib/receipts'
import { cn } from '@/lib/utils'
import { booklets, collectors } from '@/data/sample'
import { netProceeds } from '@/data/reportSamples'
import { greetingFor, useNow } from '@/hooks/use-now'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { CancelledBadge } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { collectorLabel, useSession } from '@/state/session'
import { clientName, useStore } from '@/state/store'
import { daysBetween, useCollectionDays, useOpenLoans, type OpenLoan } from '@/state/portfolio'

/** Warn when a collector's OR booklet is down to this many unused receipts. */
const LOW_BOOKLET = 10

const pct = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100)

/** Monday of the week the date falls in. */
function weekStart(iso: IsoDate): IsoDate {
  const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay()
  return addDays(iso, -((weekday + 6) % 7))
}

export function Dashboard() {
  const { user, canSeeBranch, canSeeClient, branchLabel, can } = useSession()
  const { receipts, clients, disbursements, allLoans } = useStore()
  const openLoans = useOpenLoans().filter((l) => canSeeBranch(l.branchId))
  const today = user.businessDate
  // A route that hasn't reported yet today would read as zero; leave it out until it does.
  const days = useCollectionDays().filter(
    (d) => canSeeBranch(d.branchId) && !(d.date === today && d.collected === 0),
  )
  const isPresident = user.role === 'president'
  const isLoanOfficer = user.role === 'loan_officer'
  // Loans waiting on someone, in the branches this user can see.
  const waiting = allLoans.filter((l) => {
    const client = clients.find((c) => c.id === l.clientId)
    return l.status !== 'released' && client && canSeeClient(client)
  })
  const forApproval = waiting.filter((l) => l.status === 'pending')

  // Today's receipts and this week's collections, compared with the same days last week.
  const todayReceipts = receipts
    .filter((r) => canSeeBranch(r.branchId) && r.date === today)
    .sort((a, b) => b.no.localeCompare(a.no))
  const todayTotals = totalReceipts(todayReceipts)
  const monday = weekStart(today)
  const thisWeek = days.filter((d) => d.date >= monday && d.date <= today)
  // Same routes on the same weekdays last week, so the comparison is like for like.
  const sameDaysLastWeek = new Set(thisWeek.map((d) => `${addDays(d.date, -7)}|${d.collectorId}`))
  const lastWeek = days.filter((d) => sameDaysLastWeek.has(`${d.date}|${d.collectorId}`))
  const weekCollected = sum(thisWeek, (d) => d.collected)
  const weekTarget = sum(thisWeek, (d) => d.target)
  const lastWeekCollected = sum(lastWeek, (d) => d.collected)
  const weekChange = pct(weekCollected - lastWeekCollected, lastWeekCollected)

  const portfolio = sum(openLoans, (l) => l.balance)
  const over90 = openLoans.filter((l) => daysBetween(l.lastPaymentOn, today) > 90)
  const par = pct(sum(over90, (l) => l.balance), portfolio)
  const dueSoon = openLoans
    .filter((l): l is OpenLoan & { due: NonNullable<OpenLoan['due']> } => !!l.due && l.due.on <= addDays(today, 7))
    .sort((a, b) => a.due.on.localeCompare(b.due.on) || b.due.amount - a.due.amount)
  const overdue = dueSoon.filter((l) => l.due.on < today)
  const monthReleases = disbursements.filter((d) => canSeeBranch(d.branchId) && d.date.slice(0, 7) === today.slice(0, 7))

  const bookletsLeft = booklets
    .filter((b) => canSeeBranch(collectors.find((c) => c.id === b.collectorId)?.branchId ?? ''))
    .map((b) => {
      const used = receipts.filter((r) => Number(r.no) >= b.from && Number(r.no) <= b.to).length
      return { ...b, left: b.to - b.from + 1 - used }
    })

  const nameOf = (id: string) => {
    const client = clients.find((c) => c.id === id)
    return client ? clientName(client) : id
  }

  return (
    <Page crumbs={['Dashboard']}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <Greeting
          actions={
            isPresident ? (
              <>
                <ButtonLink to="/reports/daily-target">Daily target</ButtonLink>
                <ButtonLink variant="outline" to="/reports/collections">Collections</ButtonLink>
                <ButtonLink variant="outline" to="/reports/aging">Aging</ButtonLink>
              </>
            ) : isLoanOfficer ? (
              <>
                <ButtonLink to="/loans/new">
                  <FilePlus data-icon="inline-start" />
                  New loan
                </ButtonLink>
                <ButtonLink variant="outline" to="/loans">Loans</ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink to="/payments/new">
                  <ReceiptText data-icon="inline-start" />
                  Encode payment
                </ButtonLink>
                <ButtonLink variant="outline" to="/reports/cash-receipts">Cash Receipts</ButtonLink>
              </>
            )
          }
        />

        <SectionCards>
          {isPresident ? (
            <SectionCard
              label="Outstanding portfolio"
              value={formatPeso(portfolio)}
              badge={`${openLoans.length} loans`}
              headline={`Across ${branchLabel.toLowerCase()}`}
              note="Open loan balances, all statuses"
            />
          ) : isLoanOfficer ? (
            <SectionCard
              label="Loans for approval"
              value={formatPeso(sum(forApproval, (l) => l.principal))}
              badge={`${forApproval.length} ${forApproval.length === 1 ? 'loan' : 'loans'}`}
              good={forApproval.length === 0}
              headline={`${waiting.length - forApproval.length} approved, waiting for release`}
              note="Principal applied for, not yet approved"
            />
          ) : (
            <SectionCard
              label="Cash received today"
              value={formatPeso(todayTotals.cash)}
              badge={todayTotals.balanced ? 'Balanced' : "Doesn't balance"}
              good={todayTotals.balanced}
              headline={`${todayTotals.posted} posted · ${todayTotals.cancelled} cancelled`}
              note={`Loans Receivable ${formatPeso(todayTotals.loansReceivable)} + Safekeeping ${formatPeso(todayTotals.safekeeping)}`}
            />
          )}
          <SectionCard
            label="Collected this week"
            value={formatPeso(weekCollected)}
            badge={`${weekChange >= 0 ? '+' : ''}${weekChange.toFixed(1)}%`}
            good={weekChange >= 0}
            trend
            headline={`${pct(weekCollected, weekTarget).toFixed(1)}% of the ${formatPeso(weekTarget)} target`}
            note={`${formatShort(monday)} to ${formatShort(thisWeek.map((d) => d.date).sort().at(-1) ?? today)}, compared with last week`}
          />
          {isPresident ? (
            <SectionCard
              label="Released this month"
              value={formatPeso(sum(monthReleases, (d) => d.principal))}
              badge={`${monthReleases.length} loans`}
              headline={`${formatPeso(sum(monthReleases, netProceeds))} net cash out`}
              note="Principal, before fees and insurance"
            />
          ) : (
            <SectionCard
              label="Due in the next 7 days"
              value={formatPeso(sum(dueSoon, (l) => l.due.amount))}
              badge={`${dueSoon.length} accounts`}
              good={overdue.length === 0}
              headline={overdue.length ? `${overdue.length} already overdue` : 'Nothing overdue'}
              note={`Through ${formatLong(addDays(today, 7))}`}
            />
          )}
          <SectionCard
            label="Portfolio at risk (90+ days)"
            value={`${par.toFixed(2)}%`}
            badge={`${over90.length} accounts`}
            good={par < 5}
            headline={par < 5 ? 'Within the 5% limit' : 'Above the 5% limit'}
            note={`${formatPeso(sum(over90, (l) => l.balance))} with no payment in 90 days`}
          />
        </SectionCards>

        <CollectionsChart days={days} today={today} />

        <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Due soon</CardTitle>
              <CardDescription>Installments due through {formatLong(addDays(today, 7))}, oldest first.</CardDescription>
              <CardAction>
                <ButtonLink variant="outline" size="sm" to="/reports/daily-target">Daily target</ButtonLink>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {can('encodePayments') && <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dueSoon.slice(0, 8).map((l) => (
                      <TableRow key={l.loanId}>
                        <TableCell>
                          <div className="font-medium">{l.borrower}</div>
                          <div className="text-xs text-muted-foreground">{l.loanId}</div>
                        </TableCell>
                        <TableCell>{collectorLabel(l.collectorId)}</TableCell>
                        <TableCell>
                          {formatMdy(l.due.on)}
                          {l.due.on < today && (
                            <Badge variant="destructive" className="ml-2">
                              {daysBetween(l.due.on, today)}d late
                            </Badge>
                          )}
                          {l.due.on === today && <Badge variant="secondary" className="ml-2">Today</Badge>}
                        </TableCell>
                        <TableCell className="text-right">{formatPeso(l.due.amount)}</TableCell>
                        {can('encodePayments') && (
                          <TableCell className="py-0 text-right">
                            {l.clientId && canSeeClient({ branchId: l.branchId, collectorId: l.collectorId }) && (
                              <ButtonLink variant="ghost" size="sm" to={`/payments/new?client=${l.clientId}`}>
                                Collect
                              </ButtonLink>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {dueSoon.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                          Nothing due in the next 7 days.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            {dueSoon.length > 8 && (
              <CardFooter className="border-t text-sm text-muted-foreground">
                Showing 8 of {dueSoon.length}. The Daily target report has the full route.
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>Things to sort out before the day closes.</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup className="gap-2">
                {can('encodePayments') && !todayTotals.balanced && (
                  <Attention icon={CircleAlert} tone="bad" title="Today's receipts don't balance" description="Cash received isn't equal to Loans Receivable + Safekeeping." to="/reports/cash-receipts" />
                )}
                {overdue.length > 0 && (
                  <Attention icon={CalendarClock} tone="bad" title={`${overdue.length} overdue ${overdue.length === 1 ? 'installment' : 'installments'}`} description={`${formatPeso(sum(overdue, (l) => l.due.amount))} past its due date.`} to="/reports/daily-target" />
                )}
                {over90.length > 0 && (
                  <Attention icon={Clock} tone="bad" title={`${over90.length} accounts unpaid for 90+ days`} description="Schedule a visit or send a demand letter." to="/reports/aging" />
                )}
                {can('viewCashReports') && todayTotals.cancelled > 0 && (
                  <Attention icon={ReceiptText} title={`${todayTotals.cancelled} receipt${todayTotals.cancelled === 1 ? '' : 's'} cancelled today`} description="Check that each has a reason and a replacement receipt." to="/reports/cash-receipts" />
                )}
                {bookletsLeft
                  .filter((b) => b.left <= LOW_BOOKLET)
                  .map((b) => (
                    <Attention
                      key={b.from}
                      icon={BookOpen}
                      tone="bad"
                      title={`Booklet ${b.from}–${b.to}: ${b.left} receipts left`}
                      description={`Collector ${collectorLabel(b.collectorId)}. Issue a new booklet before it runs out.`}
                    />
                  ))}
                {can('dayClose') && (
                  <Attention icon={Lock} title="Day is still open" description="Close the day after the last collector remits." to="/day-close" />
                )}
                {isLoanOfficer && forApproval.length > 0 && (
                  <Attention icon={FilePlus} title={`${forApproval.length} ${forApproval.length === 1 ? 'loan' : 'loans'} waiting for approval`} description="Review the terms and approve, so an accounting officer can release." to="/loans" />
                )}
                {!can('dayClose') && overdue.length === 0 && over90.length === 0 && (
                  <Attention icon={CircleCheck} tone="good" title="All clear" description="Nothing urgent across the branches." />
                )}
              </ItemGroup>
            </CardContent>
          </Card>
        </div>

        {!can('encodePayments') ? (
          <CollectorsThisWeek rows={thisWeek} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Latest receipts</CardTitle>
              <CardDescription>{formatWeekdayLong(today)}</CardDescription>
              <CardAction>
                <ButtonLink variant="outline" size="sm" to="/reports/cash-receipts">See all</ButtonLink>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OR no.</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead className="text-right">Loans Receivable</TableHead>
                      <TableHead className="text-right">Safekeeping</TableHead>
                      <TableHead className="text-right">Cash received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayReceipts.slice(0, 6).map((r) => (
                      <TableRow key={r.no} className={cn(r.status === 'cancelled' && 'text-muted-foreground')}>
                        <TableCell>{r.no}</TableCell>
                        <TableCell>
                          {nameOf(r.clientId)}
                          {r.status === 'cancelled' && <CancelledBadge className="ml-2" />}
                        </TableCell>
                        <TableCell>{collectorLabel(r.collectorId)}</TableCell>
                        <TableCell className="text-right">{formatPeso(r.loansReceivable)}</TableCell>
                        <TableCell className="text-right">{formatPeso(r.safekeeping)}</TableCell>
                        <TableCell className="text-right font-medium">{formatPeso(r.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {todayReceipts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                          No receipts yet today.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        <p className="text-xs text-muted-foreground">Sample data for preview only.</p>
      </div>
    </Page>
  )
}

/** "Good morning, Mila" with a live clock and the open business day. */
function Greeting({ actions }: { actions: ReactNode }) {
  const { user, branchLabel, can } = useSession()
  const now = useNow()
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
  const businessDayDiffers = now.toLocaleDateString('en-CA') !== user.businessDate

  return (
    <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <CardHeader className="gap-2">
        <CardDescription>
          <time dateTime={now.toISOString()}>
            {date} · <span className="tabular-nums">{time}</span>
          </time>
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight @[640px]/main:text-3xl">
          {greetingFor(now)}, {user.firstName}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">
            <span aria-hidden className="size-1.5 rounded-full bg-positive" />
            {user.branchId === null ? 'Viewing all branches' : 'Day open'}
          </Badge>
          <span>
            {businessDayDiffers ? `Business day ${formatWeekdayLong(user.businessDate)}` : 'Business day is today'} ·{' '}
            {branchLabel}
          </span>
        </div>
        <CardAction className="no-print hidden items-center gap-2 self-center @[640px]/main:flex">{actions}</CardAction>
      </CardHeader>
      <CardFooter className="flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup> Find a client
        </span>
        {can('encodePayments') && (
          <span className="flex items-center gap-1.5">
            <Kbd>F2</Kbd> on Encode payment to search
          </span>
        )}
        <div className="flex gap-2 @[640px]/main:hidden">{actions}</div>
      </CardFooter>
    </Card>
  )
}

/** The shadcn dashboard-01 section cards, laid out four across on wide screens. */
function SectionCards({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {children}
    </div>
  )
}

function SectionCard({
  label,
  value,
  badge,
  headline,
  note,
  good,
  trend = false,
}: {
  label: string
  value: string
  badge: string
  headline: string
  note: string
  /** true = good news, false = needs attention, undefined = neutral. */
  good?: boolean
  /** Shows an up or down arrow next to the badge. */
  trend?: boolean
}) {
  const Icon = good === false ? TrendingDown : TrendingUp
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
        <CardAction>
          <Badge variant={good === false ? 'destructive' : 'outline'}>
            {trend && <Icon data-icon="inline-start" />}
            {badge}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 font-medium">{headline}</div>
        <div className="text-muted-foreground">{note}</div>
      </CardFooter>
    </Card>
  )
}

const chartConfig = {
  collected: { label: 'Collected', color: 'var(--primary)' },
  target: { label: 'Target', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

const ranges = { '7d': 7, '30d': 30, all: 90 } as const
type Range = keyof typeof ranges

/** The shadcn dashboard-01 interactive area chart, showing collections against target. */
function CollectionsChart({ days, today }: { days: ReturnType<typeof useCollectionDays>; today: IsoDate }) {
  const [range, setRange] = useState<Range>('30d')
  const since = addDays(today, -ranges[range])
  const dates = [...new Set(days.filter((d) => d.date > since && d.date <= today).map((d) => d.date))].sort()
  const data = dates.map((date) => {
    const onDay = days.filter((d) => d.date === date)
    return { date, collected: sum(onDay, (d) => d.collected) / 100, target: sum(onDay, (d) => d.target) / 100 }
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Collections vs. target</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Cash collected each working day against the route target</span>
          <span className="@[540px]/card:hidden">Collected vs. target</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[range]}
            onValueChange={(value) => setRange((value[0] as Range | undefined) ?? '30d')}
            variant="outline"
            aria-label="Date range"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-collected)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-collected)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => formatShort(value)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={(value) => formatShort(String(value))} indicator="dot" />}
            />
            <Area
              dataKey="target"
              type="monotone"
              fill="none"
              stroke="var(--color-target)"
              strokeDasharray="4 4"
              isAnimationActive={false}
            />
            <Area
              dataKey="collected"
              type="monotone"
              fill="url(#fillCollected)"
              stroke="var(--color-collected)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function Attention({
  icon: Icon,
  title,
  description,
  to,
  tone,
}: {
  icon: LucideIcon
  title: string
  description: string
  to?: string
  tone?: 'good' | 'bad'
}) {
  return (
    <Item variant="outline" size="sm">
      <ItemMedia
        variant="icon"
        className={cn(tone === 'bad' && 'bg-destructive/10 text-destructive', tone === 'good' && 'text-positive')}
      >
        <Icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      {to && (
        <ItemActions>
          <ButtonLink variant="ghost" size="sm" to={to}>
            Open
          </ButtonLink>
        </ItemActions>
      )}
    </Item>
  )
}

/** The President's view of every route this week. */
function CollectorsThisWeek({ rows }: { rows: ReturnType<typeof useCollectionDays> }) {
  const { canSeeBranch } = useSession()
  const routes = collectors
    .filter((c) => canSeeBranch(c.branchId))
    .map((c) => {
      const own = rows.filter((d) => d.collectorId === c.id)
      const collected = sum(own, (d) => d.collected)
      const target = sum(own, (d) => d.target)
      return { collector: c, collected, target, efficiency: pct(collected, target) }
    })
    // Routes with nothing scheduled this week would only read as 0%.
    .filter((r) => r.target > 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collectors this week</CardTitle>
        <CardDescription>Collected against target, Monday to today.</CardDescription>
        <CardAction>
          <ButtonLink variant="outline" size="sm" to="/reports/collections">
            <ChartColumn data-icon="inline-start" />
            Collections
          </ButtonLink>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collector</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((r) => (
                <TableRow key={r.collector.id}>
                  <TableCell className="font-medium">{collectorLabel(r.collector.id)}</TableCell>
                  <TableCell className="text-right">{formatPeso(r.target)}</TableCell>
                  <TableCell className="text-right">{formatPeso(r.collected)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={r.efficiency < 80 ? 'destructive' : 'secondary'}>{r.efficiency.toFixed(1)}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
