import { Fragment, useState } from 'react'
import { formatLong, formatMdy, parseMdy } from '@/lib/dates'
import { formatAmount, formatPeso } from '@/lib/money'
import { collectible, groupByStatus, recap, STATUS_LABELS, totalAccounts, type TargetTotals } from '@/lib/dailyTarget'
import { cn } from '@/lib/utils'
import { branches, collectors } from '@/data/sample'
import { ROUTE_SNAPSHOT_DATE, routeAccounts } from '@/data/routeAccounts'
import { LOAN_STATUSES, type LoanStatus, type RouteAccount } from '@/data/types'
import { Page } from '@/components/layout'
import { downloadCsv, ExportButtons, ReportTabs, ReportTitle, SimpleSelect } from '@/components/reports'
import { PageHeader, SampleNote, StatCard, StatStrip, StatusBadge } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup } from '@/components/ui/item'
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

type Filters = { date: string; branchId: string; collectorId: string; status: 'all' | LoanStatus }

const num = 'text-right'
const dash = <span className="text-muted-foreground">–</span>
const accountsLabel = (n: number) => `${n} ${n === 1 ? 'account' : 'accounts'}`

export function DailyTarget() {
  const { user, canSeeBranch } = useSession()
  const initial: Filters = {
    date: formatMdy(user.businessDate),
    branchId: user.branchId ?? 'all',
    collectorId: 'all',
    status: 'all',
  }
  const [draft, setDraft] = useState(initial)
  const [applied, setApplied] = useState(initial)
  const [dateError, setDateError] = useState<string>()

  const branchOptions = [
    ...(user.branchId === null ? [{ value: 'all', label: 'All branches' }] : []),
    ...branches.filter((b) => canSeeBranch(b.id)).map((b) => ({ value: b.id, label: b.name })),
  ]
  const routeCollectors = (branchId: string) =>
    collectors.filter((col) => canSeeBranch(col.branchId) && (branchId === 'all' || col.branchId === branchId))

  const date = parseMdy(applied.date)!
  const accounts =
    date === ROUTE_SNAPSHOT_DATE
      ? routeAccounts.filter(
          (a) =>
            canSeeBranch(a.branchId) &&
            (applied.branchId === 'all' || a.branchId === applied.branchId) &&
            (applied.collectorId === 'all' || a.collectorId === applied.collectorId) &&
            (applied.status === 'all' || a.status === applied.status),
        )
      : []
  const byCollector = routeCollectors(applied.branchId)
    .map((col) => ({ collector: col, accounts: accounts.filter((a) => a.collectorId === col.id) }))
    .filter((g) => g.accounts.length > 0)
  const grand = totalAccounts(accounts)
  const shares = recap(accounts)

  const branchName =
    applied.branchId === 'all' ? 'All branches' : (branches.find((b) => b.id === applied.branchId)?.name ?? '')
  const collectorLine =
    applied.collectorId === 'all' ? 'All collectors' : `Collector ${collectorLabel(applied.collectorId)}`

  function run() {
    if (!parseMdy(draft.date)) return setDateError('Use MM/DD/YYYY.')
    setDateError(undefined)
    setApplied(draft)
  }

  function exportExcel() {
    const header = ['No.', 'Loan ID', 'Borrower', 'Address', 'Status', 'Granted', 'Maturity', 'Loan amount', 'Balance', 'Daily amort.', 'Due today', 'Penalty', 'Collectible', 'Last payment', 'Rebate']
    downloadCsv(`daily-target-${date}.csv`, [
      [`DAILY TARGET OF COLLECTORS · ${formatLong(date)}`],
      [branchName, collectorLine],
      [],
      header,
      ...accounts.map((a, i) => [
        i + 1,
        a.loanId,
        a.borrower,
        a.address,
        STATUS_LABELS[a.status],
        formatMdy(a.grantedOn),
        formatMdy(a.maturesOn),
        formatAmount(a.loanAmount),
        formatAmount(a.balance),
        formatAmount(a.dailyAmortization),
        a.dueToday < 0 ? `(${formatAmount(-a.dueToday)})` : formatAmount(a.dueToday),
        formatAmount(a.penalty),
        formatAmount(collectible(a)),
        formatMdy(a.lastPaymentOn),
        formatAmount(a.potentialRebate),
      ]),
      ['Grand total', '', '', '', '', '', '', '', formatAmount(grand.balance), formatAmount(grand.dailyAmortization), formatAmount(grand.dueToday), formatAmount(grand.penalty), formatAmount(grand.collectible), '', formatAmount(grand.potentialRebate)],
    ])
  }

  let rowNo = 0

  return (
    <Page crumbs={['Reports', 'Daily target of collectors']}>
      <PageHeader
        title="Daily target of collectors"
        description="Each collector's accounts for the day, grouped by loan status, with what is collectible today."
        actions={<ExportButtons onExcel={exportExcel} />}
      />
      <ReportTabs />

      <div className="no-print">
        <div>
          <form
            className="flex flex-wrap items-end gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              run()
            }}
          >
            <Field data-invalid={!!dateError || undefined} className="w-40">
              <FieldLabel htmlFor="ct-date">Date</FieldLabel>
              <Input id="ct-date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <Field className="w-48">
              <FieldLabel htmlFor="ct-branch">Branch</FieldLabel>
              <SimpleSelect
                id="ct-branch"
                value={draft.branchId}
                onValueChange={(branchId) => setDraft({ ...draft, branchId, collectorId: 'all' })}
                options={branchOptions}
                disabled={user.branchId !== null}
              />
            </Field>
            <Field className="min-w-48 flex-1">
              <FieldLabel htmlFor="ct-col">Collector (route)</FieldLabel>
              <SimpleSelect
                id="ct-col"
                value={draft.collectorId}
                onValueChange={(collectorId) => setDraft({ ...draft, collectorId })}
                options={[
                  { value: 'all', label: 'All collectors' },
                  ...routeCollectors(draft.branchId).map((col) => ({ value: col.id, label: collectorLabel(col.id) })),
                ]}
              />
            </Field>
            <Field className="w-44">
              <FieldLabel htmlFor="ct-status">Loan status</FieldLabel>
              <SimpleSelect
                id="ct-status"
                value={draft.status}
                onValueChange={(status) => setDraft({ ...draft, status: status as Filters['status'] })}
                options={[
                  { value: 'all', label: 'All statuses' },
                  ...LOAN_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
                ]}
              />
            </Field>
            <Button type="submit" variant="outline">Run report</Button>
            {dateError && <FieldError className="basis-full">{dateError}</FieldError>}
          </form>
        </div>
      </div>

      <StatStrip>
        <StatCard label="Accounts on route" value={accounts.length} />
        <StatCard label="Outstanding balance" value={formatPeso(grand.balance)} />
        <StatCard label="Collectible today" value={formatPeso(grand.collectible)} />
        <StatCard label="Paid ahead" value={accountsLabel(accounts.filter((a) => a.dueToday < 0).length)} />
        <StatCard label="Potential rebate" value={formatPeso(grand.potentialRebate)} />
      </StatStrip>

      <Card aria-label="Report preview" className="print:ring-0">
        <CardContent className="flex flex-col gap-6">
          <ReportTitle
            branch={branchName}
            title="DAILY TARGET OF COLLECTORS"
            subtitle={`For ${formatLong(date)} · ${collectorLine}`}
          />

          <div className="-mx-3">
            <Table className="min-w-[1180px] text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Granted · Maturity</TableHead>
                  <TableHead className={num}>Loan amount</TableHead>
                  <TableHead className={num}>Balance</TableHead>
                  <TableHead className={num}>Daily amort.</TableHead>
                  <TableHead className={num}>Due today</TableHead>
                  <TableHead className={num}>Penalty</TableHead>
                  <TableHead className={num}>Collectible</TableHead>
                  <TableHead>Last payment</TableHead>
                  <TableHead className={num}>Rebate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCollector.map(({ collector, accounts: route }) => (
                  <Fragment key={collector.id}>
                    {groupByStatus(route).map((group) => (
                      <Fragment key={group.status}>
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={12} className="pt-4">
                            <StatusBadge status={group.status} />
                            <span className="ml-2 text-xs text-muted-foreground">
                              {accountsLabel(group.accounts.length)}
                            </span>
                          </TableCell>
                        </TableRow>
                        {group.accounts.map((a) => (
                          <AccountRow key={a.loanId} no={++rowNo} account={a} />
                        ))}
                        <TotalsRow
                          label={`Subtotal · ${STATUS_LABELS[group.status]}`}
                          totals={group.totals}
                          className="bg-muted/50 font-medium"
                        />
                      </Fragment>
                    ))}
                    <TotalsRow
                      label={`Total · Collector ${collectorLabel(collector.id)}`}
                      totals={totalAccounts(route)}
                      className="bg-muted font-semibold"
                    />
                  </Fragment>
                ))}
                {accounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="h-20 text-center text-muted-foreground">
                      {date === ROUTE_SNAPSHOT_DATE
                        ? 'No accounts on route for these filters.'
                        : `No route snapshot for ${formatMdy(date)}. The sample data covers ${formatMdy(ROUTE_SNAPSHOT_DATE)}.`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TotalsRow label="Grand total" totals={grand} className="font-semibold" />
              </TableFooter>
            </Table>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <p className="text-sm text-muted-foreground">
              Amounts in <span className="font-medium text-positive">green parentheses</span> are paid ahead and are
              not collectible today. Matured accounts show their whole balance as due. Potential rebate applies if the
              loan is paid in full today.
            </p>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Recap · share of outstanding balance</CardTitle>
              </CardHeader>
              <CardContent>
                <ItemGroup>
                  <RecapLine label="Based on Updated" value={shares.updated} />
                  <RecapLine label="Based on Arrears" value={shares.arrears} />
                  <RecapLine label="Others" value={shares.others} />
                </ItemGroup>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      <SampleNote />
    </Page>
  )
}

function AccountRow({ no, account: a }: { no: number; account: RouteAccount }) {
  const due = collectible(a)
  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{no}</TableCell>
      <TableCell>{a.loanId}</TableCell>
      <TableCell>
        <div className="font-medium">{a.borrower}</div>
        <div className="text-xs text-muted-foreground">{a.address}</div>
      </TableCell>
      <TableCell>
        {formatMdy(a.grantedOn)}
        <div className="text-muted-foreground">{formatMdy(a.maturesOn)}</div>
      </TableCell>
      <TableCell className={num}>{formatAmount(a.loanAmount)}</TableCell>
      <TableCell className={num}>{formatAmount(a.balance)}</TableCell>
      <TableCell className={num}>{formatAmount(a.dailyAmortization)}</TableCell>
      <TableCell className={cn(num, a.dueToday < 0 && 'text-positive')}>
        {a.dueToday < 0 ? (
          <span aria-label={`Paid ahead ${formatAmount(-a.dueToday)}`}>({formatAmount(-a.dueToday)})</span>
        ) : (
          formatAmount(a.dueToday)
        )}
      </TableCell>
      <TableCell className={num}>{a.penalty ? formatAmount(a.penalty) : dash}</TableCell>
      <TableCell className={cn(num, 'font-medium')}>{due ? formatAmount(due) : dash}</TableCell>
      <TableCell>{formatMdy(a.lastPaymentOn)}</TableCell>
      <TableCell className={num}>{a.potentialRebate ? formatAmount(a.potentialRebate) : dash}</TableCell>
    </TableRow>
  )
}

function TotalsRow({ label, totals, className }: { label: string; totals: TargetTotals; className?: string }) {
  const amount = (v: number) => (v ? formatAmount(v) : '–')
  return (
    <TableRow className={className}>
      <TableCell colSpan={5}>{label}</TableCell>
      <TableCell className={num}>{formatAmount(totals.balance)}</TableCell>
      <TableCell className={num}>{formatAmount(totals.dailyAmortization)}</TableCell>
      <TableCell className={num}>{formatAmount(totals.dueToday)}</TableCell>
      <TableCell className={num}>{amount(totals.penalty)}</TableCell>
      <TableCell className={num}>{formatAmount(totals.collectible)}</TableCell>
      <TableCell />
      <TableCell className={num}>{amount(totals.potentialRebate)}</TableCell>
    </TableRow>
  )
}

function RecapLine({ label, value }: { label: string; value: number }) {
  return (
    <Item size="xs" className="px-0">
      <ItemContent>
        <ItemDescription>{label}</ItemDescription>
      </ItemContent>
      <ItemActions className="text-sm font-medium">{value.toFixed(2)}%</ItemActions>
    </Item>
  )
}
