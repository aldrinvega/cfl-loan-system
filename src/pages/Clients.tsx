import { useState } from 'react'
import { formatMdy } from '@/lib/dates'
import { sum } from '@/lib/money'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { DetailPanel, Facts, LeadFigure, PanelSection, Person, rowOpens } from '@/components/ledger'
import { Money } from '@/components/money'
import { KycBadge, PageHeader, SampleNote, StatCard, StatStrip } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useOpenLoans } from '@/state/portfolio'
import { collectorLabel, useSession } from '@/state/session'
import { clientName, useClientAccount, useStore } from '@/state/store'

export function Clients() {
  const { clients, loans } = useStore()
  const { canSeeClient } = useSession()
  const openLoans = useOpenLoans()
  const [openId, setOpenId] = useState<string | null>(null)
  const visible = clients.filter(canSeeClient).sort((a, b) => clientName(a).localeCompare(clientName(b)))
  const balanceOf = (clientId: string) => sum(openLoans.filter((l) => l.clientId === clientId), (l) => l.balance)
  const withBalance = visible.filter((c) => balanceOf(c.id) > 0)

  return (
    <Page crumbs={['Clients']}>
      <PageHeader title="Clients" description="Everyone on the books in the branches you can see." />

      <StatStrip>
        <StatCard label="Clients" value={visible.length} />
        <StatCard label="With an open loan" value={withBalance.length} />
        <StatCard label="Loan balance" value={<Money value={sum(visible, (c) => balanceOf(c.id))} />} />
      </StatStrip>

      <div className="flex flex-col gap-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[34%]">Client</TableHead>
              <TableHead>Collector</TableHead>
              <TableHead>Loans</TableHead>
              <TableHead className="text-right">Installment</TableHead>
              <TableHead className="text-right">Loan balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((client) => {
              const clientLoans = loans.filter((l) => l.clientId === client.id)
              const balance = balanceOf(client.id)
              return (
                <TableRow key={client.id} {...rowOpens(() => setOpenId(client.id), openId === client.id)}>
                  <TableCell>
                    <Person name={clientName(client)} sub={client.id} />
                  </TableCell>
                  <TableCell>{collectorLabel(client.collectorId)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {clientLoans.map((l) => l.id).join(', ') || '–'}
                  </TableCell>
                  <TableCell className="text-right">
                    {clientLoans.length ? (
                      clientLoans.map((l, i) => (
                        <span key={l.id}>
                          {i > 0 && ', '}
                          <Money value={l.installment} peso={false} />
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {balance > 0 ? <Money value={balance} peso={false} /> : <span className="text-muted-foreground">0.00</span>}
                  </TableCell>
                </TableRow>
              )
            })}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  No clients in your branch yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="pt-2 text-sm text-muted-foreground">{visible.length} clients</p>
      </div>
      <SampleNote />

      <ClientPanel clientId={openId} onClose={() => setOpenId(null)} />
    </Page>
  )
}

/** A client at a glance: what they owe, their open loans and safekeeping, and the way into the profile. */
function ClientPanel({ clientId, onClose }: { clientId: string | null; onClose: () => void }) {
  const account = useClientAccount(clientId ?? undefined)
  const { can } = useSession()
  const client = account?.client
  return (
    <DetailPanel
      open={!!account}
      onClose={onClose}
      title={client ? clientName(client) : ''}
      description={client ? `${client.id} · Collector ${collectorLabel(client.collectorId)}` : ''}
      footer={
        client && (
          <>
            <ButtonLink variant="outline" size="sm" to={`/clients/${client.id}`}>
              Open profile
            </ButtonLink>
            {can('encodePayments') && account.openLoans.length > 0 && (
              <ButtonLink size="sm" to={`/payments/new?client=${client.id}`}>
                Encode payment
              </ButtonLink>
            )}
          </>
        )
      }
    >
      {account && client && (
        <>
          <LeadFigure
            sub={account.openLoans.length ? `Loan balance on ${account.openLoans.length} open loan${account.openLoans.length > 1 ? 's' : ''}` : 'No open loans'}
          >
            <Money value={account.loanBalance} />
          </LeadFigure>
          <div className="flex flex-wrap gap-2">
            {client.kyc === 'verified' ? <KycBadge /> : <Badge variant="warning">KYC pending</Badge>}
            <Badge variant={client.status === 'active' ? 'secondary' : 'outline'}>
              {client.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {account.openLoans.length > 0 && (
            <PanelSection title="Open loans">
              <Facts
                rows={account.openLoans.map(({ loan, summary }) => [
                  loan.id,
                  <span className="flex flex-col items-end">
                    <Money value={summary.balance} />
                    <span className="text-xs text-muted-foreground">
                      {summary.next
                        ? `Next ${formatMdy(summary.next.dueOn)}, `
                        : ''}
                      {summary.installmentsPaid} of {loan.term} paid
                    </span>
                  </span>,
                ])}
              />
            </PanelSection>
          )}
          <PanelSection title="Details">
            <Facts
              rows={[
                ['Safekeeping', <Money value={account.safekeeping.balance} />],
                ['Phone', client.phone],
                ['Address', <span className="block max-w-56 text-right whitespace-normal">{client.address}</span>],
                ['Client since', formatMdy(client.clientSince)],
              ]}
            />
          </PanelSection>
        </>
      )}
    </DetailPanel>
  )
}
