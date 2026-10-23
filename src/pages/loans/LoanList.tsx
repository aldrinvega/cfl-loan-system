import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addDays, formatMdy } from '@/lib/dates'
import { formatAmount, formatPeso } from '@/lib/money'
import { frequencyLabel } from '@/lib/loans'
import { disbursementFor, netProceeds } from '@/data/reportSamples'
import type { ApplicationStatus, Loan } from '@/data/types'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { PageHeader, SampleNote } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  const count = (s: ApplicationStatus) => visible.filter((l) => l.status === s).length
  const rows = filter === 'all' ? visible : visible.filter((l) => l.status === filter)
  const nameOf = (id: string) => {
    const client = clients.find((c) => c.id === id)
    return client ? clientName(client) : id
  }

  return (
    <Page crumbs={['Loans']}>
      <PageHeader
        title="Loans"
        description="Loan officers file and approve loans; an accounting officer releases them. A loan takes payments once it's released."
        actions={
          can('fileLoans') && (
            <ButtonLink to="/loans/new">
              <Plus data-icon="inline-start" />
              New loan
            </ButtonLink>
          )
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="all" className="flex-none">All {visible.length}</TabsTrigger>
          <TabsTrigger value="pending" className="flex-none">For approval {count('pending')}</TabsTrigger>
          <TabsTrigger value="approved" className="flex-none">Approved {count('approved')}</TabsTrigger>
          <TabsTrigger value="released" className="flex-none">Released {count('released')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead className="w-28">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.id}</TableCell>
                    <TableCell>{nameOf(l.clientId)}</TableCell>
                    <TableCell>{l.product}</TableCell>
                    <TableCell className="text-right">{formatAmount(l.principal)}</TableCell>
                    <TableCell className="text-right">{formatAmount(l.interest)}</TableCell>
                    <TableCell>
                      {l.term} {frequencyLabel(l.frequencyDays).toLowerCase()}
                    </TableCell>
                    <TableCell>
                      {formatMdy(l.appliedOn)}
                      <div className="text-xs text-muted-foreground">{l.appliedBy}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status === 'released' ? 'outline' : l.status === 'approved' ? 'secondary' : 'default'}>
                        {statusText[l.status]}
                      </Badge>
                      {l.approvedBy && l.status !== 'pending' && (
                        <div className="mt-1 text-xs text-muted-foreground">Approved by {l.approvedBy}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {l.releaseRef ? (
                        <>
                          {l.releaseRef}
                          <div className="text-xs text-muted-foreground">{formatMdy(l.releasedOn)}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1 text-right">
                      {l.status === 'pending' && can('approveLoans') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            approveLoan(l.id, user.name)
                            toast.success(`${l.id} approved`, { description: 'It can be released now.' })
                          }}
                        >
                          Approve
                        </Button>
                      )}
                      {l.status === 'approved' && can('releaseLoans') && (
                        <Button size="sm" onClick={() => setReleasing(l)}>
                          Release
                        </Button>
                      )}
                      {l.status === 'released' && (
                        <ButtonLink size="sm" variant="ghost" to={`/clients/${l.clientId}`}>
                          Ledger
                        </ButtonLink>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-20 text-center text-muted-foreground">
                      No loans here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <SampleNote />

      <ReleaseDialog loan={releasing} borrower={releasing ? nameOf(releasing.clientId) : ''} onClose={() => setReleasing(null)} />
    </Page>
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
    <Item size="xs" className="px-0">
      <ItemContent>
        <ItemTitle className={strong ? 'font-semibold' : 'font-normal text-muted-foreground'}>{label}</ItemTitle>
      </ItemContent>
      <ItemActions className={strong ? 'font-semibold' : ''}>{value}</ItemActions>
    </Item>
  )
}
