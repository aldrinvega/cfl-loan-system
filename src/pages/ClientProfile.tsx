import { useParams } from 'react-router-dom'
import { Download, UserX } from 'lucide-react'
import { formatLong, formatMdy, formatMonthYear, formatShort } from '@/lib/dates'
import { formatAmount, formatPeso } from '@/lib/money'
import { cn } from '@/lib/utils'
import { collectors } from '@/data/sample'
import { Page } from '@/components/layout'
import { CancelledBadge, KycBadge, SampleNote, StatCard } from '@/components/shared'
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { collectorLabel, useSession } from '@/state/session'
import { clientInitials, clientName, useClientAccount, type ClientAccount } from '@/state/store'
import { ButtonLink } from '@/components/button-link'

export function ClientProfile() {
  const { clientId } = useParams()
  const account = useClientAccount(clientId)
  const { canSeeClient, can } = useSession()

  if (!account || !canSeeClient(account.client)) {
    return (
      <Page crumbs={['Clients', 'Not found']}>
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><UserX /></EmptyMedia>
            <EmptyTitle>Client not found</EmptyTitle>
            <EmptyDescription>There's no client {clientId} in the branches you can see.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Page>
    )
  }

  const { client } = account
  const nextDue = account.openLoans[0]?.summary.next
  const collector = collectors.find((c) => c.id === client.collectorId)

  return (
    <Page crumbs={['Clients', clientName(client)]}>
      <Card>
        <CardHeader className="flex flex-wrap items-center gap-4">
          <Avatar size="lg" className="size-14">
            <AvatarFallback className="text-lg">{clientInitials(client)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle className="text-2xl font-semibold">{clientName(client)}</CardTitle>
            <CardDescription>
              {client.id} · Collector {collector?.id} · {collector?.name} · Client since{' '}
              {formatMonthYear(client.clientSince)}
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {client.kyc === 'verified' && <KycBadge />}
              {client.status === 'active' && <Badge variant="secondary">Active</Badge>}
            </div>
          </div>
          <CardAction className="no-print ml-auto flex gap-2 self-center">
            {can('encodePayments') && (
              <ButtonLink to={`/payments/new?client=${client.id}`}>New payment</ButtonLink>
            )}
            {can('fileLoans') && (
              <ButtonLink variant="outline" to={`/loans/new?client=${client.id}`}>
                New loan
              </ButtonLink>
            )}
          </CardAction>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Loan balance" value={formatPeso(account.loanBalance)} />
        <StatCard label="Safekeeping" value={formatPeso(account.safekeeping.balance)} />
        <StatCard
          label={nextDue ? `Next due · ${formatLong(nextDue.dueOn)}` : 'Next due'}
          value={nextDue ? formatPeso(nextDue.amountDue) : '–'}
        />
      </div>

      <Tabs defaultValue="loans" className="gap-6">
        <TabsList variant="line" className="no-print w-full justify-start overflow-x-auto">
          <TabsTrigger value="details" className="flex-none">Details</TabsTrigger>
          <TabsTrigger value="ids" className="flex-none">IDs and documents</TabsTrigger>
          <TabsTrigger value="loans" className="flex-none">Loans</TabsTrigger>
          <TabsTrigger value="receipts" className="flex-none">Receipts</TabsTrigger>
          <TabsTrigger value="safekeeping" className="flex-none">Safekeeping</TabsTrigger>
          <TabsTrigger value="history" className="flex-none">History</TabsTrigger>
        </TabsList>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-6">
            <TabsContent value="loans" className="flex flex-col gap-6">
              {account.loans.map((l) => (
                <LoanLedger key={l.loan.id} {...l} />
              ))}
            </TabsContent>
            <TabsContent value="receipts">
              <ReceiptsCard account={account} />
            </TabsContent>
            <TabsContent value="safekeeping">
              <SafekeepingCard account={account} detailed />
            </TabsContent>
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <ItemGroup>
                    <Row label="Client ID" value={client.id} />
                    <Row label="Collector" value={collectorLabel(client.collectorId)} />
                    <Row label="Client since" value={formatLong(client.clientSince)} />
                    <Row label="Phone" value={client.phone} />
                    <Row label="Address" value={client.address} />
                  </ItemGroup>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ids">
              <IdsCard account={account} />
            </TabsContent>
            <TabsContent value="history">
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>No history yet</EmptyTitle>
                  <EmptyDescription>The change history isn't available in this preview.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TabsContent>
          </div>

          <aside aria-label="Client details" className="flex flex-col gap-4">
            <IdsCard account={account} />
            <SafekeepingCard account={account} />
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
                <CardDescription>{client.address}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">{client.phone}</CardContent>
            </Card>
            <SampleNote />
          </aside>
        </div>
      </Tabs>
    </Page>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Item size="xs" className="px-0">
      <ItemContent>
        <ItemDescription>{label}</ItemDescription>
      </ItemContent>
      <ItemActions className="text-right text-sm">{value}</ItemActions>
    </Item>
  )
}

function IdsCard({ account }: { account: ClientAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>IDs on file</CardTitle>
        {account.client.kycVerifiedBy && (
          <CardDescription>Verified by {account.client.kycVerifiedBy}. Every file view is logged.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {account.client.ids.map((id) => (
            <Item key={id.type} size="xs" className="px-0">
              <ItemContent>
                <ItemTitle>{id.type}</ItemTitle>
                <ItemDescription>{id.detail}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant={id.status === 'verified' ? 'secondary' : 'destructive'}>
                  {id.status === 'verified' ? 'Verified' : 'Pending'}
                </Badge>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

function SafekeepingCard({ account, detailed = false }: { account: ClientAccount; detailed?: boolean }) {
  const { client, safekeeping } = account
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safekeeping</CardTitle>
        <CardAction className="font-semibold">{formatPeso(safekeeping.balance)}</CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {detailed ? (
            <>
              <Row label="Brought forward" value={formatPeso(client.safekeepingOpening)} />
              {safekeeping.deposits.map((r) => (
                <Row key={r.no} label={`${formatMdy(r.date)} · OR ${r.no}`} value={formatPeso(r.safekeeping)} />
              ))}
            </>
          ) : (
            safekeeping.lastDeposit && (
              <Row
                label="Last deposit"
                value={`${formatPeso(safekeeping.lastDeposit.safekeeping)} · ${formatShort(safekeeping.lastDeposit.date)}`}
              />
            )
          )}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

function Amount({ value }: { value: number }) {
  return (
    <TableCell className={cn('text-right', value === 0 && 'text-muted-foreground')}>
      {value === 0 ? '–' : formatAmount(value)}
    </TableCell>
  )
}

function LoanLedger({ loan, ledger, summary }: ClientAccount['loans'][number]) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {loan.id} · {loan.product}
        </CardTitle>
        <CardDescription>
          Released {formatLong(loan.releasedOn)} · matures {formatLong(summary.maturesOn)}
        </CardDescription>
        <CardAction className="no-print">
          <Button variant="outline" onClick={() => window.print()}>
            <Download data-icon="inline-start" />
            Statement of account (PDF)
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Principal" value={formatPeso(loan.principal)} />
          <StatCard label="Interest (flat)" value={formatPeso(loan.interest)} />
          <StatCard
            label={`Installment · ${loan.frequencyDays === 7 ? 'weekly' : 'daily'}`}
            value={formatPeso(loan.installment)}
          />
          <StatCard label="Penalties charged" value={formatPeso(summary.penaltiesCharged)} />
        </div>

        <Progress value={summary.percentPaid}>
          <ProgressLabel>
            {summary.installmentsPaid} of {loan.term} installments paid
          </ProgressLabel>
          <ProgressValue className="ml-auto" />
        </Progress>

        <div className="rounded-lg border">
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
              {ledger.map((e) => (
                <TableRow key={`${e.reference}-${e.kind}`} className={cn(e.kind === 'penalty' && 'bg-destructive/5')}>
                  <TableCell>{formatMdy(e.date)}</TableCell>
                  <TableCell>{e.reference}</TableCell>
                  <TableCell className={cn(e.kind === 'penalty' && 'font-medium text-destructive')}>
                    {e.entry}
                  </TableCell>
                  <Amount value={e.charges} />
                  <Amount value={e.payment} />
                  <TableCell className="text-right font-medium">{formatAmount(e.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Totals</TableCell>
                <TableCell className="text-right">{formatAmount(summary.totalCharges)}</TableCell>
                <TableCell className="text-right">{formatAmount(summary.totalPaid)}</TableCell>
                <TableCell className="text-right">{formatAmount(summary.balance)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Posted lines are never edited. Corrections appear as reversal entries, so the history always matches the
          receipts.
        </p>
      </CardFooter>
    </Card>
  )
}

function ReceiptsCard({ account }: { account: ClientAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts</CardTitle>
        <CardDescription>Every receipt on record for this client, including cancelled ones.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>OR no.</TableHead>
                <TableHead>Loan</TableHead>
                <TableHead className="text-right">Cash received</TableHead>
                <TableHead className="text-right">Loans Receivable</TableHead>
                <TableHead className="text-right">Safekeeping</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {account.receipts.map((r) => (
                <TableRow key={r.no} className={cn(r.status === 'cancelled' && 'text-muted-foreground')}>
                  <TableCell>{formatMdy(r.date)}</TableCell>
                  <TableCell>
                    {r.no}
                    {r.status === 'cancelled' && <CancelledBadge className="ml-2" />}
                  </TableCell>
                  <TableCell>{r.loanId}</TableCell>
                  <TableCell className="text-right">{formatAmount(r.amount)}</TableCell>
                  <TableCell className="text-right">{formatAmount(r.loansReceivable)}</TableCell>
                  <TableCell className="text-right">{formatAmount(r.safekeeping)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
