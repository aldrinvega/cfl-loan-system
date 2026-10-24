import { Check, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { accountTitle, voucherTotals, type VoucherLine } from '@/lib/vouchers'
import { Money } from '@/components/money'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/** A voucher's debits and credits by account title, with totals that must agree. */
export function JournalLines({ lines, className }: { lines: readonly VoucherLine[]; className?: string }) {
  const totals = voucherTotals(lines)
  const amount = (c: number) => (c ? <Money value={c} peso={false} /> : <span className="text-muted-foreground">–</span>)
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="-mx-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="whitespace-normal">
                  {accountTitle(l.accountCode)}
                  <div className="text-xs text-muted-foreground">{l.accountCode}</div>
                </TableCell>
                <TableCell className="text-right">{amount(l.debit)}</TableCell>
                <TableCell className="text-right">{amount(l.credit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Totals</TableCell>
              <TableCell className="text-right">
                <Money value={totals.debit} peso={false} />
              </TableCell>
              <TableCell className="text-right">
                <Money value={totals.credit} peso={false} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className={cn('flex items-center gap-1.5 text-xs', totals.balanced ? 'text-muted-foreground' : 'text-destructive')}>
        {totals.balanced ? <Check className="size-3.5 text-positive" /> : <CircleAlert className="size-3.5" />}
        {totals.balanced ? 'Debits equal credits.' : 'Debits and credits don’t agree yet.'}
      </p>
    </div>
  )
}
