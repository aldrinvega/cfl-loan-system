import { Link } from 'react-router-dom'
import { ChevronRight, Eye } from 'lucide-react'
import { formatWeekdayShortYear } from '@/lib/dates'
import { splitTotal } from '@/lib/ledger'
import { formatPeso, sum } from '@/lib/money'
import { Money } from '@/components/money'
import { collectors } from '@/data/sample'
import { greetingFor, useNow } from '@/hooks/use-now'
import { MobileScreen } from '@/components/mobile-layout'
import { dayPeriod, TimeOfDayIcon } from '@/components/time-of-day'
import { StatusBadge } from '@/components/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle } from '@/components/ui/item'
import { useRouteAccounts, type RouteAccount } from '@/state/portfolio'
import { useSession } from '@/state/session'
import { clientName } from '@/state/store'

/** The collector's daily target: who to visit today and how much each owes. View only. */
export function Today() {
  const { user } = useSession()
  const now = useNow()
  const collector = collectors.find((c) => c.id === user.collectorId)
  const accounts = useRouteAccounts(user.collectorId)

  const dueOf = (a: RouteAccount) => splitTotal(a.split.due)
  // Overdue accounts first, then the biggest amounts, so the route starts where it matters most.
  const due = accounts
    .filter((a) => dueOf(a) > 0)
    .sort((a, b) => Number(b.status === 'arrears') - Number(a.status === 'arrears') || dueOf(b) - dueOf(a))
  const notDue = accounts.filter((a) => dueOf(a) === 0)
  const collectible = sum(due, dueOf)
  const overdue = due.filter((a) => a.status === 'arrears').length

  return (
    <MobileScreen title="Today">
      <div className="flex flex-col gap-0.5">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <span>
            {greetingFor(now)}, {user.firstName}
          </span>
          <TimeOfDayIcon period={dayPeriod(now)} className="size-7" />
        </h2>
        <p className="text-xs text-muted-foreground">
          <time dateTime={now.toISOString()} className="tabular-nums">
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
            {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
          </time>
        </p>
        <p className="text-xs text-muted-foreground">
          Collector {collector?.id} · {collector?.name} · business day {formatWeekdayShortYear(user.businessDate)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Collectible today</CardDescription>
          <CardTitle className="text-3xl font-medium tracking-[-0.02em]"><Money value={collectible} /></CardTitle>
          <CardAction>
            <Badge variant={overdue ? 'destructive' : 'outline'}>
              {overdue ? `${overdue} overdue` : 'None overdue'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Accounts due</span>
            <span className="font-medium">
              {due.length} of {accounts.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Penalties included</span>
            <span className="font-medium"><Money value={sum(due, (a) => a.split.due.penalty)} /></span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily target</CardTitle>
          <CardDescription>Accounts due today, overdue first</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountList accounts={due} amount={dueOf} />
          {due.length === 0 && <p className="text-sm text-muted-foreground">Nothing due on your route today.</p>}
        </CardContent>
      </Card>

      {notDue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nothing due today</CardTitle>
            <CardDescription>Open accounts that are paid up for now</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountList accounts={notDue} amount={() => 0} />
          </CardContent>
        </Card>
      )}

      <Alert>
        <Eye />
        <AlertDescription>
          View only. Issue the official receipt in the field; an accounting officer encodes it.
        </AlertDescription>
      </Alert>
    </MobileScreen>
  )
}

function AccountList({ accounts, amount }: { accounts: RouteAccount[]; amount: (a: RouteAccount) => number }) {
  return (
    <ItemGroup>
      {accounts.map((a, i) => (
        <div key={a.loan.id}>
          {i > 0 && <ItemSeparator />}
          <Item size="sm" className="px-0" render={<Link to={`/m/clients/${a.client.id}`} />}>
            <ItemContent>
              <ItemTitle>
                {clientName(a.client)}
                {a.status === 'arrears' && <StatusBadge status="arrears" />}
              </ItemTitle>
              <ItemDescription>
                {a.loan.id} · {formatPeso(a.loan.installment)} per installment
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <span className="font-medium tabular-nums">{amount(a) ? <Money value={amount(a)} /> : '–'}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </ItemActions>
          </Item>
        </div>
      ))}
    </ItemGroup>
  )
}
