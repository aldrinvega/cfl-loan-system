import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { addDays, formatMdy } from '@/lib/dates'
import { formatPeso, sum } from '@/lib/money'
import { frequencyLabel } from '@/lib/loans'
import { disbursementFor, netProceeds } from '@/data/reportSamples'
import type { ApplicationStatus, Loan } from '@/data/types'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { DetailPanel, Facts, LeadFigure, PanelSection, Person, rowOpens, stopRow, Timeline } from '@/components/ledger'
import { Money } from '@/components/money'
import { PageHeader, SampleNote, StatCard, StatStrip } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from '@/state/session'
import { clientName, useStore } from '@/state/store'

const statusText: Record<ApplicationStatus, string> = {
  pending: 'For approval',
  approved: 'Approved',
  released: 'Released',
}

type Filter = 'all' | ApplicationStatus

export function LoanList() {
  const { allLoans, clients, approveLoan } = useStore()
  const { user, canSeeClient, can } = useSession()
  const [filter, setFilter] = useState<Filter>('all')
  const [releasing, setReleasing] = useState<Loan | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const visible = allLoans
    .filter((l) => {
      const client = clients.find((c) => c.id === l.clientId)
      return client && canSeeClient(client)
    })
    // Work waiting on someone comes first, newest applications at the top.
    .sort(
      (a, b) =>
        order[a.status] - order[b.status] || b.appliedOn.localeCompare(a.appliedOn) || b.id.localeCompare(a.id),
    )
  const inStatus = (s: ApplicationStatus) => visible.filter((l) => l.status === s)
  const rows = filter === 'all' ? visible : inStatus(filter)
  const nameOf = (id: string) => {
    const client = clients.find((c) => c.id === id)
    return client ? clientName(client) : id
  }
  const opened = visible.find((l) => l.id === openId) ?? null

  function approve(l: Loan) {
    approveLoan(l.id, user.name)
    toast.success(`${l.id} approved`, { description: 'It can be released now.' })
  }

  const actions = (l: Loan) => (
    <>
      {l.status === 'pending' && can('approveLoans') && (
        <Button size="sm" variant="outline" onClick={() => approve(l)}>
          Approve
        </Button>
      )}
      {l.status === 'approved' && can('releaseLoans') && (
        <Button size="sm" onClick={() => setReleasing(l)}>
          Release
        </Button>
      )}
    </>
  )

  return (
    <Page crumbs={['Loans']}>
      <PageHeader
        title="Loans"
        description="Loan officers file and approve loans; an accounting officer releases them. A loan takes payments once it's released."
      />

      <StatStrip>
        <StatCard
          label={`For approval · ${inStatus('pending').length}`}
          value={formatPeso(sum(inStatus('pending'), (l) => l.principal))}
        />
        <StatCard
          label={`Approved, to release · ${inStatus('approved').length}`}
          value={formatPeso(sum(inStatus('approved'), (l) => l.principal))}
        />
        <StatCard
          label={`Released · ${inStatus('released').length}`}
          value={formatPeso(sum(inStatus('released'), (l) => l.principal))}
        />
      </StatStrip>

      <div className="flex flex-col gap-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList variant="line" className="w-full justify-start border-b">
            {(['all', 'pending', 'approved', 'released'] as const).map((f) => (
              <TabsTrigger key={f} value={f} className="flex-none">
                {f === 'all' ? 'All' : statusText[f]}
                <span className="text-muted-foreground tabular-nums">
                  {f === 'all' ? visible.length : inStatus(f).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%]">Client</TableHead>
              <TableHead className="hidden md:table-cell">Product</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="hidden md:table-cell text-right">Interest</TableHead>
              <TableHead className="hidden md:table-cell">Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Voucher</TableHead>
              <TableHead className="hidden w-28 sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((l) => (
              <TableRow key={l.id} {...rowOpens(() => setOpenId(l.id), openId === l.id)}>
                <TableCell>
                  <Person name={nameOf(l.clientId)} sub={l.id} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {l.product}
                  <div className="text-xs text-muted-foreground">
                    {l.term} {frequencyLabel(l.frequencyDays).toLowerCase()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Money value={l.principal} peso={false} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                  <Money value={l.interest} peso={false} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatMdy(l.appliedOn)}
                  <div className="text-xs text-muted-foreground">{l.appliedBy}</div>
                </TableCell>
                <TableCell>
                  {l.status === 'released' ? (
                    <span className="text-muted-foreground">{statusText[l.status]}</span>
                  ) : (
                    <Badge variant={l.status === 'pending' ? 'warning' : 'positive'}>{statusText[l.status]}</Badge>
                  )}
                  {l.approvedBy && l.status !== 'pending' && (
                    <div className="mt-1 hidden text-xs text-muted-foreground sm:block">Approved by {l.approvedBy}</div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {l.releaseRef ? (
                    <>
                      {l.releaseRef}
                      <div className="text-xs text-muted-foreground">{formatMdy(l.releasedOn)}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
                <TableCell className="hidden py-1 text-right sm:table-cell" {...stopRow}>
                  {actions(l)}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                  No loans here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="pt-2 text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? 'loan' : 'loans'}
        </p>
      </div>
      <SampleNote />

      <LoanPanel
        loan={opened}
        borrower={opened ? nameOf(opened.clientId) : ''}
        onClose={() => setOpenId(null)}
        actions={opened && actions(opened)}
      />
      <ReleaseDialog
        loan={releasing}
        borrower={releasing ? nameOf(releasing.clientId) : ''}
        onClose={() => setReleasing(null)}
      />
    </Page>
  )
}

/** The loan's side panel: principal, where it is in apply → approve → release, and its terms. */
function LoanPanel({
  loan,
  borrower,
  onClose,
  actions,
}: {
  loan: Loan | null
  borrower: string
  onClose: () => void
  actions: ReactNode
}) {
  const freq = loan ? frequencyLabel(loan.frequencyDays).toLowerCase() : ''
  return (
    <DetailPanel
      open={loan !== null}
      onClose={onClose}
      title={loan ? `${loan.id} · ${borrower}` : ''}
      description={loan ? `${loan.product}, ${loan.term} ${freq} installments` : ''}
      footer={
        loan && (
          <>
            <ButtonLink variant="outline" size="sm" to={`/clients/${loan.clientId}`}>
              Open client
            </ButtonLink>
            {actions}
          </>
        )
      }
    >
      {loan && (
        <>
          <LeadFigure sub={`${statusText[loan.status]} · applied ${formatMdy(loan.appliedOn)}`}>
            <Money value={loan.principal} />
          </LeadFigure>
          <Timeline
            steps={[
              { title: 'Filed for approval', detail: `${formatMdy(loan.appliedOn)} by ${loan.appliedBy}`, done: true },
              {
                title: loan.approvedBy ? `Approved by ${loan.approvedBy}` : 'Waiting for approval',
                detail: loan.approvedBy ? undefined : 'A loan officer or the President approves it.',
                done: loan.status !== 'pending',
              },
              {
                title: loan.releaseRef ? `Released on ${loan.releaseRef}` : 'Not released yet',
                detail: loan.releaseRef
                  ? `${formatMdy(loan.releasedOn)}${loan.releasedBy ? ` by ${loan.releasedBy}` : ''}`
                  : 'An accounting officer releases it and creates the voucher.',
                done: loan.status === 'released',
              },
            ]}
          />
          <PanelSection title="Terms">
            <Facts
              rows={[
                ['Principal', <Money value={loan.principal} />],
                ['Interest', <Money value={loan.interest} />],
                ['Total to repay', <Money value={loan.principal + loan.interest} />],
                ['Installment', <Money value={loan.installment} />],
                ['Term', `${loan.term} ${freq}`],
              ]}
            />
          </PanelSection>
        </>
      )}
    </DetailPanel>
  )
}

const order: Record<ApplicationStatus, number> = { pending: 0, approved: 1, released: 2 }

/** Confirms the release: shows the voucher's deductions, then creates it. */
function ReleaseDialog({ loan, borrower, onClose }: { loan: Loan | null; borrower: string; onClose: () => void }) {
  const { releaseLoan } = useStore()
  const { user } = useSession()
  if (!loan) return null

  const today = user.businessDate
  const preview = disbursementFor({
    voucher: '',
    date: today,
    branchId: '',
    borrower,
    loanId: loan.id,
    product: loan.product,
    principal: loan.principal,
    releasedBy: user.name,
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release {loan.id}?</DialogTitle>
          <DialogDescription>
            Creates a disbursement voucher for {borrower} dated {formatMdy(today)}. The loan then appears on the
            collector's route and takes payments.
          </DialogDescription>
        </DialogHeader>
        <ItemGroup>
          <Line label="Principal" value={formatPeso(preview.principal)} />
          <Line label="Service fee (3%)" value={`−${formatPeso(preview.serviceFee)}`} />
          <Line label="Insurance (1%)" value={`−${formatPeso(preview.insurance)}`} />
          <Line label="Net proceeds" value={formatPeso(netProceeds(preview))} strong />
          <Line
            label="First installment"
            value={`${formatPeso(loan.installment)} on ${formatMdy(addDays(today, loan.frequencyDays))}`}
          />
        </ItemGroup>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Not yet
          </Button>
          <Button
            onClick={() => {
              const voucher = releaseLoan(loan.id, user.name, today)
              toast.success(`${voucher} created`, { description: `${loan.id} released to ${borrower}.` })
              onClose()
            }}
          >
            Release and create voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <Item size="xs" className="rounded-none border-0 border-b border-rule px-0 last:border-b-0">
      <ItemContent>
        <ItemTitle className={strong ? 'font-medium' : 'font-normal text-muted-foreground'}>{label}</ItemTitle>
      </ItemContent>
      <ItemActions className={strong ? 'font-medium' : ''}>{value}</ItemActions>
    </Item>
  )
}
