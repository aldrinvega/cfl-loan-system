import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ban } from 'lucide-react'
import { toast } from 'sonner'
import { formatMdy, parseMdy } from '@/lib/dates'
import { formatAmount, formatPeso } from '@/lib/money'
import { totalReceipts } from '@/lib/receipts'
import { cn } from '@/lib/utils'
import { branches, collectors } from '@/data/sample'
import type { Receipt } from '@/data/types'
import { Page } from '@/components/layout'
import { downloadCsv, ExportButtons, ReportTabs, ReportTitle, SimpleSelect } from '@/components/reports'
import { BalanceAlert, CancelledBadge, PageHeader, SampleNote, StatCard, StatStrip } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { DetailPanel, Facts, LeadFigure, PanelSection, Person, rowOpens, stopRow } from '@/components/ledger'
import { Money } from '@/components/money'
import { Signatures } from '@/components/signatures'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { collectorLabel, useSession } from '@/state/session'
import { clientName, useStore } from '@/state/store'

type Filters = {
  from: string
  to: string
  branchId: string
  collectorId: string
  status: 'all' | 'posted'
}

export function CashReceipts() {
  const { user, canSeeBranch, can } = useSession()
  const { receipts, clients } = useStore()
  const [params] = useSearchParams()

  const today = formatMdy(user.businessDate)
  const initial: Filters = {
    from: today,
    to: today,
    branchId: user.branchId ?? 'all',
    collectorId: params.get('collector') ?? 'all',
    status: 'all',
  }
  const [draft, setDraft] = useState(initial)
  const [applied, setApplied] = useState(initial)
  const [dateError, setDateError] = useState<string>()
  const [cancelling, setCancelling] = useState<Receipt | null>(null)
  const [openNo, setOpenNo] = useState<string | null>(null)

  const branchOptions = [
    ...(user.branchId === null ? [{ value: 'all', label: 'All branches' }] : []),
    ...branches.filter((b) => canSeeBranch(b.id)).map((b) => ({ value: b.id, label: b.name })),
  ]
  const collectorOptions = [
    { value: 'all', label: 'All collectors' },
    ...collectors
      .filter((c) => canSeeBranch(c.branchId) && (draft.branchId === 'all' || c.branchId === draft.branchId))
      .map((c) => ({ value: c.id, label: collectorLabel(c.id) })),
  ]

  function run() {
    const from = parseMdy(draft.from)
    const to = parseMdy(draft.to)
    if (!from || !to) return setDateError('Use MM/DD/YYYY for both dates.')
    if (from > to) return setDateError('"From" must be on or before "To".')
    setDateError(undefined)
    setApplied(draft)
  }

  const from = parseMdy(applied.from)!
  const to = parseMdy(applied.to)!
  const rows = receipts
    .filter(
      (r) =>
        canSeeBranch(r.branchId) &&
        (applied.branchId === 'all' || r.branchId === applied.branchId) &&
        (applied.collectorId === 'all' || r.collectorId === applied.collectorId) &&
        (applied.status === 'all' || r.status === 'posted') &&
        r.date >= from &&
        r.date <= to,
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.no.localeCompare(b.no))
  const totals = totalReceipts(rows)
  const nameOf = (id: string) => {
    const client = clients.find((c) => c.id === id)
    return client ? clientName(client) : id
  }

  const branchName =
    applied.branchId === 'all' ? 'All branches' : (branches.find((b) => b.id === applied.branchId)?.name ?? '')
  const range = `${formatMdy(from)} to ${formatMdy(to)}`
  const collectorLine =
    applied.collectorId === 'all' ? 'All collectors' : `Collector ${collectorLabel(applied.collectorId)}`
  const totalsLabel = `Totals · ${totals.posted} posted, ${totals.cancelled} cancelled`
  const canCancel = can('cancelReceipts')

  function exportExcel() {
    downloadCsv(`cash-receipts-${from}-to-${to}.csv`, [
      [`CASH RECEIPTS for ${range}`],
      [branchName, collectorLine],
      [],
      ['Date', 'OR no.', 'Status', 'Particulars', 'Cash received (Dr)', 'Loans Receivable (Cr)', 'Safekeeping (Cr)'],
      ...rows.map((r) => [
        formatMdy(r.date),
        r.no,
        r.status === 'cancelled' ? 'CANCELLED' : 'Posted',
        nameOf(r.clientId),
        formatAmount(r.amount),
        formatAmount(r.loansReceivable),
        formatAmount(r.safekeeping),
      ]),
      [totalsLabel, '', '', '', formatAmount(totals.cash), formatAmount(totals.loansReceivable), formatAmount(totals.safekeeping)],
    ])
  }

  return (
    <Page crumbs={['Reports', 'Cash Receipts']}>
      <PageHeader
        title="Cash Receipts"
        description="Posted and cancelled receipts by collector and date."
        actions={<ExportButtons onExcel={exportExcel} />}
      />
      <ReportTabs />

      <div className="no-print">
        <div>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              run()
            }}
          >
            <Field data-invalid={!!dateError || undefined} className="w-40">
              <FieldLabel htmlFor="from">From</FieldLabel>
              <Input id="from" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
            </Field>
            <Field className="w-40">
              <FieldLabel htmlFor="to">To</FieldLabel>
              <Input id="to" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
            </Field>
            {user.branchId === null && (
              <Field className="w-48">
                <FieldLabel htmlFor="branch">Branch</FieldLabel>
                <SimpleSelect
                  id="branch"
                  value={draft.branchId}
                  onValueChange={(branchId) => setDraft({ ...draft, branchId, collectorId: 'all' })}
                  options={branchOptions}
                />
              </Field>
            )}
            <Field className="min-w-48 flex-1">
              <FieldLabel htmlFor="collector">Collector</FieldLabel>
              <SimpleSelect
                id="collector"
                value={draft.collectorId}
                onValueChange={(collectorId) => setDraft({ ...draft, collectorId })}
                options={collectorOptions}
              />
            </Field>
            <Field className="w-52">
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <SimpleSelect
                id="status"
                value={draft.status}
                onValueChange={(status) => setDraft({ ...draft, status: status as Filters['status'] })}
                options={[
                  { value: 'all', label: 'Posted and cancelled' },
                  { value: 'posted', label: 'Posted only' },
                ]}
              />
            </Field>
            <Button type="submit" variant="outline">Run report</Button>
            {dateError && <FieldError className="basis-full">{dateError}</FieldError>}
          </form>
        </div>
      </div>

      <StatStrip>
        <StatCard label="Receipts posted" value={totals.posted} />
        <StatCard label="Cancelled" value={totals.cancelled} />
        <StatCard label="Cash received" value={formatPeso(totals.cash)} />
        <StatCard label="Loans Receivable" value={formatPeso(totals.loansReceivable)} />
        <StatCard label="Safekeeping" value={formatPeso(totals.safekeeping)} />
      </StatStrip>

      <Card aria-label="Report preview" className="print:ring-0">
        <CardContent className="flex flex-col gap-6">
          <ReportTitle branch={branchName} title={`CASH RECEIPTS for ${range}`} subtitle={collectorLine} />

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>OR no.</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead className="text-right">Cash received (Dr)</TableHead>
                  <TableHead className="text-right">Loans Receivable (Cr)</TableHead>
                  <TableHead className="text-right">Safekeeping (Cr)</TableHead>
                  {canCancel && <TableHead className="no-print w-10"><span className="sr-only">Actions</span></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const isCancelled = r.status === 'cancelled'
                  return (
                    <TableRow key={r.no} {...rowOpens(() => setOpenNo(r.no), openNo === r.no)}>
                      <TableCell className={cn(isCancelled && 'text-muted-foreground')}>{formatMdy(r.date)}</TableCell>
                      <TableCell className={cn(isCancelled && 'text-muted-foreground')}>{r.no}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className={cn('font-medium', isCancelled && 'text-muted-foreground')}>{nameOf(r.clientId)}</span>
                          {isCancelled && <CancelledBadge />}
                        </span>
                      </TableCell>
                      <TableCell className={cn('text-right', isCancelled && 'text-muted-foreground line-through decoration-muted-foreground/60')}>
                        <Money value={r.amount} peso={false} positive={!isCancelled} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <Money value={r.loansReceivable} peso={false} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <Money value={r.safekeeping} peso={false} />
                      </TableCell>
                      {canCancel && (
                        <TableCell className="no-print py-0" {...stopRow}>
                          {!isCancelled && (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-muted-foreground opacity-0 group-hover/row:opacity-100 group-focus-visible/row:opacity-100 focus-visible:opacity-100"
                                    aria-label={`Cancel receipt ${r.no}`}
                                    onClick={() => setCancelling(r)}
                                  />
                                }
                              >
                                <Ban />
                              </TooltipTrigger>
                              <TooltipContent>Cancel receipt</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                      No receipts for these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>{totalsLabel}</TableCell>
                  <TableCell className="text-right">
                    <Money value={totals.cash} peso={false} positive />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money value={totals.loansReceivable} peso={false} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money value={totals.safekeeping} peso={false} />
                  </TableCell>
                  {canCancel && <TableCell className="no-print" />}
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <BalanceAlert ok={totals.balanced}>
            {totals.balanced ? 'Balanced' : "Doesn't balance"}: Cash received {formatPeso(totals.cash)}{' '}
            {totals.balanced ? '=' : '≠'} Loans Receivable {formatPeso(totals.loansReceivable)} + Safekeeping{' '}
            {formatPeso(totals.safekeeping)}
          </BalanceAlert>
        </CardContent>
        <CardFooter className="block border-t">
          <Signatures />
        </CardFooter>
      </Card>
      <SampleNote />

      <ReceiptPanel
        receipt={rows.find((r) => r.no === openNo) ?? null}
        borrower={(r) => nameOf(r.clientId)}
        onClose={() => setOpenNo(null)}
        onCancel={canCancel ? (r) => setCancelling(r) : undefined}
      />
      <CancelReceiptDialog receipt={cancelling} onClose={() => setCancelling(null)} />
    </Page>
  )
}

/** One receipt: the amount, how it came in, where it went, and who collected it. */
function ReceiptPanel({
  receipt,
  borrower,
  onClose,
  onCancel,
}: {
  receipt: Receipt | null
  borrower: (r: Receipt) => string
  onClose: () => void
  onCancel?: (r: Receipt) => void
}) {
  const r = receipt
  const isCancelled = r?.status === 'cancelled'
  return (
    <DetailPanel
      open={r !== null}
      onClose={onClose}
      title={r ? `OR ${r.no}` : ''}
      description={r ? `${formatMdy(r.date)} · Collector ${collectorLabel(r.collectorId)}` : ''}
      footer={
        r && onCancel && !isCancelled && (
          <Button variant="destructive" size="sm" onClick={() => onCancel(r)}>
            Cancel this receipt
          </Button>
        )
      }
    >
      {r && (
        <>
          <Person name={borrower(r)} sub={`${r.clientId} · ${r.loanId}`} size="lg" />
          <LeadFigure sub={isCancelled ? `Cancelled: ${r.cancelReason ?? 'no reason given'}` : 'Cash received'}>
            <Money value={r.amount} positive={!isCancelled} className={cn(isCancelled && 'text-muted-foreground line-through')} />
          </LeadFigure>
          <PanelSection title="Where it went">
            <Facts
              rows={[
                ['Loans Receivable', <Money value={r.loansReceivable} />],
                ['Safekeeping', <Money value={r.safekeeping} />],
                ...(r.penaltyPaid ? ([['Of which penalties', <Money value={r.penaltyPaid} />]] as [string, React.ReactNode][]) : []),
                ...(r.rebate ? ([['Rebate (not cash)', <Money value={r.rebate} />]] as [string, React.ReactNode][]) : []),
              ]}
            />
          </PanelSection>
          {(r.cash !== undefined || (r.checks?.length ?? 0) > 0) && (
            <PanelSection title="How it came in">
              <Facts
                rows={[
                  ['Cash', <Money value={r.cash ?? 0} />],
                  ...(r.checks ?? []).map(
                    (c): [string, React.ReactNode] => [`Check ${c.no}, ${c.bank}`, <Money value={c.amount} />],
                  ),
                ]}
              />
            </PanelSection>
          )}
          <PanelSection title="Receipt">
            <Facts
              rows={[
                ['Payment date', formatMdy(r.date)],
                ['Effective date', formatMdy(r.effectiveDate ?? r.date)],
                ['Particulars', r.particulars || '–'],
              ]}
            />
          </PanelSection>
        </>
      )}
    </DetailPanel>
  )
}


/** Cancelling keeps the receipt number on record with zero amounts. A reason is required. */
function CancelReceiptDialog({ receipt, onClose }: { receipt: Receipt | null; onClose: () => void }) {
  const { cancelReceipt } = useStore()
  const [reason, setReason] = useState('')

  function close() {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={receipt !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel receipt {receipt?.no}?</DialogTitle>
          <DialogDescription>
            The number stays on record with zero amounts, and the payment comes off the client's ledger. This can't
            be undone. Encode a new receipt for the correct payment.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="cancel-reason">Reason</FieldLabel>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Wrong client encoded"
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Keep receipt
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim() === ''}
            onClick={() => {
              if (!receipt) return
              cancelReceipt(receipt.no, reason.trim())
              toast.success(`Receipt ${receipt.no} cancelled`)
              close()
            }}
          >
            Cancel receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
