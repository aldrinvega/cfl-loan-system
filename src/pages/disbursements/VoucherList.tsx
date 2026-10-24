import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { formatMdy } from '@/lib/dates'
import { sum } from '@/lib/money'
import { cashOut, type Voucher } from '@/lib/vouchers'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { DetailPanel, Facts, LeadFigure, PanelSection, Person, rowOpens } from '@/components/ledger'
import { Money } from '@/components/money'
import { PageHeader, SampleNote, StatCard, StatStrip } from '@/components/shared'
import { JournalLines } from '@/pages/disbursements/JournalLines'
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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from '@/state/session'
import { useStore } from '@/state/store'

type Kind = 'all' | Voucher['kind']
const kindLabel: Record<Kind, string> = { all: 'All', release: 'Loan releases', expense: 'Expenses' }

/** The legacy Disbursements screen: every check voucher, with its journal lines one click away. */
export function VoucherList() {
  const { vouchers } = useStore()
  const { canSeeBranch, can } = useSession()
  const [params, setParams] = useSearchParams()
  const [kind, setKind] = useState<Kind>((params.get('kind') as Kind) ?? 'all')
  const [query, setQuery] = useState('')
  const openNo = params.get('open')
  const [deleting, setDeleting] = useState<Voucher | null>(null)

  const visible = vouchers.filter((v) => canSeeBranch(v.branchId))
  const ofKind = (k: Kind) => (k === 'all' ? visible : visible.filter((v) => v.kind === k))
  const q = query.trim().toLowerCase()
  const rows = ofKind(kind).filter(
    (v) => !q || [v.no, v.payee, v.checkNo, v.loanId ?? ''].some((f) => f.toLowerCase().includes(q)),
  )
  const opened = visible.find((v) => v.no === openNo) ?? null
  const open = (no: string | null) =>
    setParams(
      (p) => {
        if (no) p.set('open', no)
        else p.delete('open')
        return p
      },
      { replace: true },
    )

  return (
    <Page crumbs={['Disbursements']}>
      <PageHeader
        title="Disbursements"
        description="Every check voucher: loan releases from the Loans screen and the branch's expenses."
        actions={
          can('encodeVouchers') && (
            <ButtonLink to="/disbursements/new">New voucher</ButtonLink>
          )
        }
      />

      <StatStrip>
        <StatCard label={`Vouchers · ${rows.length}`} value={<Money value={sum(rows, cashOut)} />} />
        <StatCard
          label="Loan releases"
          value={<Money value={sum(rows.filter((v) => v.kind === 'release'), cashOut)} />}
        />
        <StatCard label="Expenses" value={<Money value={sum(rows.filter((v) => v.kind === 'expense'), cashOut)} />} />
      </StatStrip>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b">
          <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <TabsList variant="line" className="justify-start">
              {(['all', 'release', 'expense'] as const).map((k) => (
                <TabsTrigger key={k} value={k} className="flex-none">
                  {kindLabel[k]}
                  <span className="text-muted-foreground tabular-nums">{ofKind(k).length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <InputGroup className="mb-2 w-full sm:w-72">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Find a voucher"
              placeholder="Voucher no., payee or check no."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher</TableHead>
              <TableHead className="w-[34%]">Payee</TableHead>
              <TableHead className="hidden md:table-cell">Check</TableHead>
              <TableHead className="hidden md:table-cell">Encoder</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((v) => (
              <TableRow key={v.no} {...rowOpens(() => open(v.no), openNo === v.no)}>
                <TableCell>
                  <span className="font-medium">{v.no}</span>
                  <div className="text-xs text-muted-foreground">{formatMdy(v.date)}</div>
                </TableCell>
                <TableCell className="max-w-0">
                  <Person name={v.payee} sub={v.kind === 'release' ? `Release of ${v.loanId}` : v.explanation} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {v.checkNo}
                  <div className="text-xs text-muted-foreground">{v.bank}</div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{v.encoder}</TableCell>
                <TableCell className="text-right">
                  <Money value={cashOut(v)} peso={false} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  {q ? 'No voucher matches.' : 'No vouchers here.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="pt-2 text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? 'voucher' : 'vouchers'}
        </p>
      </div>
      <SampleNote />

      <VoucherPanel
        voucher={opened}
        onClose={() => open(null)}
        onDelete={can('encodeVouchers') ? setDeleting : undefined}
      />
      <DeleteVoucherDialog
        voucher={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => open(null)}
      />
    </Page>
  )
}

/** One voucher: the amount paid out, by which check, and the journal lines behind it. */
function VoucherPanel({
  voucher: v,
  onClose,
  onDelete,
}: {
  voucher: Voucher | null
  onClose: () => void
  onDelete?: (v: Voucher) => void
}) {
  return (
    <DetailPanel
      open={v !== null}
      onClose={onClose}
      title={v ? `${v.no} · ${v.payee}` : ''}
      description={v ? `${formatMdy(v.date)} · check ${v.checkNo}, ${v.bank}` : ''}
      footer={
        v && (
          <>
            {onDelete && v.kind === 'expense' && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(v)}>
                Delete voucher
              </Button>
            )}
            <ButtonLink variant="outline" size="sm" to={`/disbursements/${v.no}`}>
              Print voucher
            </ButtonLink>
          </>
        )
      }
    >
      {v && (
        <>
          <LeadFigure sub={v.kind === 'release' ? 'Net proceeds paid to the borrower' : 'Paid out of the bank'}>
            <Money value={cashOut(v)} />
          </LeadFigure>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{v.kind === 'release' ? 'Loan release' : 'Expense'}</Badge>
            {v.kind === 'release' && <Badge variant="outline">Locked: edit it from the loan</Badge>}
          </div>
          <PanelSection title="Journal entry">
            <JournalLines lines={v.lines} />
          </PanelSection>
          <PanelSection title="Details">
            <Facts
              rows={[
                ['Explanation', <span className="block max-w-56 text-right whitespace-normal">{v.explanation}</span>],
                ...(v.loanId
                  ? ([['Loan', <Link className="text-link hover:underline" to={`/loans`}>{v.loanId}</Link>]] as [
                      string,
                      React.ReactNode,
                    ][])
                  : []),
                ['Encoded by', v.encoder],
              ]}
            />
          </PanelSection>
        </>
      )}
    </DetailPanel>
  )
}

/** Deleting takes an expense voucher off the books; loan releases can't be deleted. */
function DeleteVoucherDialog({
  voucher,
  onClose,
  onDeleted,
}: {
  voucher: Voucher | null
  onClose: () => void
  onDeleted: () => void
}) {
  const { deleteVoucher } = useStore()
  return (
    <Dialog open={voucher !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {voucher?.no}?</DialogTitle>
          <DialogDescription>
            The voucher to {voucher?.payee} and its journal lines come off the books. Void the check {voucher?.checkNo}{' '}
            separately. This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Keep voucher
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!voucher) return
              deleteVoucher(voucher.no)
              toast.success(`${voucher.no} deleted`)
              onClose()
              onDeleted()
            }}
          >
            Delete voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
