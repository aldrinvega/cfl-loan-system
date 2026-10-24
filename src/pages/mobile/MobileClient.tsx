import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatShort, formatShortYear } from '@/lib/dates'
import { formatPeso } from '@/lib/money'
import { cn } from '@/lib/utils'
import { Money } from '@/components/money'
import { MobileScreen } from '@/components/mobile-layout'
import { KycBadge, StatCard } from '@/components/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle } from '@/components/ui/item'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { useSession } from '@/state/session'
import { clientInitials, clientName, useClientAccount } from '@/state/store'

const RECENT_COUNT = 4

export function MobileClient() {
  const { clientId } = useParams()
  const account = useClientAccount(clientId)
  const { canSeeClient } = useSession()
  const [fullLedger, setFullLedger] = useState(false)

  // A collector sees only their own clients.
  if (!account || !canSeeClient(account.client)) {
    return (
      <MobileScreen title="Client" back>
        <p className="text-sm text-muted-foreground">This client isn't on your route.</p>
      </MobileScreen>
    )
  }

  const { client } = account
  const open = account.openLoans[0] ?? account.loans[0]
  const next = open?.summary.next
  const entries = open
    ? [...open.ledger]
        .reverse()
        .filter((e) => e.kind !== 'release' || fullLedger)
        .slice(0, fullLedger ? undefined : RECENT_COUNT)
    : []

  return (
    <MobileScreen title="Client" back>
      <div className="flex items-center gap-4">
        <Avatar size="lg" className="size-14">
          <AvatarFallback className="text-lg">{clientInitials(client)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xl font-semibold">{clientName(client)}</h2>
          <span className="text-xs text-muted-foreground">
            {client.id} · Collector {client.collectorId}
          </span>
          <div className="flex gap-1.5">
            {client.kyc === 'verified' && <KycBadge />}
            {client.status === 'active' && <Badge variant="secondary">Active</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Loan balance" value={formatPeso(account.loanBalance)} />
        <StatCard
          label={next ? `Next due · ${formatShort(next.dueOn)}` : 'Next due'}
          value={next ? formatPeso(next.amountDue) : '–'}
        />
        <StatCard label="Safekeeping" value={formatPeso(account.safekeeping.balance)} />
        <StatCard label="Installments" value={open ? `${open.summary.installmentsPaid} of ${open.loan.term}` : '–'} />
      </div>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle>{open.loan.id}</CardTitle>
            <CardDescription>Matures {formatShortYear(open.summary.maturesOn)}</CardDescription>
            <CardAction>
              <Badge variant="outline">{open.loan.product}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Progress value={open.summary.percentPaid}>
              <ProgressLabel className="text-xs text-muted-foreground">Paid</ProgressLabel>
              <ProgressValue className="ml-auto text-xs" />
            </Progress>
            <ItemGroup>
              {entries.map((e, i) => (
                <div key={`${e.reference}-${e.kind}`}>
                  {i > 0 && <ItemSeparator />}
                  <Item size="sm" className="px-0">
                    <ItemContent>
                      <ItemTitle className={cn(e.kind === 'penalty' && 'text-destructive')}>
                        {e.kind === 'release' ? 'Release' : e.entry}
                      </ItemTitle>
                      <ItemDescription>
                        {formatShort(e.date)} · {e.reference}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="flex-col items-end gap-0">
                      <span className="text-sm font-medium">
                        <Money value={e.payment ? -e.payment : e.charges} signed />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Bal <Money value={e.balance} />
                      </span>
                    </ItemActions>
                  </Item>
                </div>
              ))}
            </ItemGroup>
          </CardContent>
          <CardFooter className="border-t">
            <Button variant="link" className="w-full" onClick={() => setFullLedger(!fullLedger)}>
              {fullLedger ? 'Show recent only' : 'View full ledger'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </MobileScreen>
  )
}
