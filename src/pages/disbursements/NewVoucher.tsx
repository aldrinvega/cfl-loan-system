import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsUpDown, Plus, Scale, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatMdy, parseMdy } from '@/lib/dates'
import { formatPeso, sum, type Centavos } from '@/lib/money'
import { cn } from '@/lib/utils'
import {
  accountTitle,
  banks,
  CASH_IN_BANK,
  cashOut,
  chartOfAccounts,
  voucherTotals,
  type Bank,
  type VoucherLine,
} from '@/lib/vouchers'
import { Page } from '@/components/layout'
import { MoneyInput } from '@/components/MoneyInput'
import { Money } from '@/components/money'
import { SimpleSelect } from '@/components/reports'
import { PageHeader, SampleNote } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/state/session'
import { useStore } from '@/state/store'

type DraftLine = { key: number; accountCode: string; debit: Centavos | null; credit: Centavos | null }

let nextKey = 1
const blankLine = (): DraftLine => ({ key: nextKey++, accountCode: '', debit: null, credit: null })

/** The legacy "New CV": payee and check, then the journal lines, which must balance before saving. */
export function NewVoucher() {
  const { vouchers, saveVoucher } = useStore()
  const { user } = useSession()
  const navigate = useNavigate()

  const nextCheck = String(Math.max(0, ...vouchers.map((v) => Number(v.checkNo) || 0)) + 1).padStart(7, '0')
  const [payee, setPayee] = useState('')
  const [date, setDate] = useState(formatMdy(user.businessDate))
  const [bank, setBank] = useState<Bank>('China Bank')
  const [checkNo, setCheckNo] = useState(nextCheck)
  const [explanation, setExplanation] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([blankLine(), blankLine()])
  const [submitted, setSubmitted] = useState(false)

  const filled: VoucherLine[] = lines
    .filter((l) => l.accountCode && (l.debit || l.credit))
    .map((l) => ({ accountCode: l.accountCode, debit: l.debit ?? 0, credit: l.credit ?? 0 }))
  const totals = voucherTotals(filled)
  const paidOut = cashOut({ lines: filled })
  const cashCode = CASH_IN_BANK[bank]

  const errors: Record<string, string> = {}
  if (!payee.trim()) errors.payee = 'Enter who the check is for.'
  if (!parseMdy(date)) errors.date = 'Use MM/DD/YYYY.'
  if (!/^\d{4,10}$/.test(checkNo.trim())) errors.checkNo = 'Enter the check number, digits only.'
  if (lines.some((l) => (l.debit || l.credit) && !l.accountCode)) errors.lines = 'Pick an account for every amount.'
  else if (lines.some((l) => l.debit && l.credit)) errors.lines = 'A line takes a debit or a credit, not both.'
  else if (!totals.balanced) errors.lines = `Debits ${formatPeso(totals.debit)} and credits ${formatPeso(totals.credit)} must be equal.`
  else if (paidOut <= 0) errors.lines = `Credit ${accountTitle(cashCode)} with the amount of the check.`
  const shown = submitted ? errors : {}

  const update = (key: number, patch: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  /** Puts the difference on a Cash in Bank credit line, so the voucher balances. */
  function balanceWithCash() {
    const others = lines.filter((l) => l.accountCode !== cashCode)
    const diff = sum(others, (l) => l.debit ?? 0) - sum(others, (l) => l.credit ?? 0)
    if (diff <= 0) return toast.error('Enter the debit lines first.')
    const existing = lines.find((l) => l.accountCode === cashCode)
    setLines(
      existing
        ? lines.map((l) => (l === existing ? { ...l, debit: null, credit: diff } : l))
        : [...lines.filter((l) => l.accountCode || l.debit || l.credit), { key: nextKey++, accountCode: cashCode, debit: null, credit: diff }],
    )
  }

  function save() {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    const no = saveVoucher({
      date: parseMdy(date)!,
      branchId: user.branchId ?? 'sindalan',
      payee: payee.trim(),
      bank,
      checkNo: checkNo.trim(),
      encoder: user.name,
      explanation: explanation.trim(),
      lines: filled,
    })
    toast.success(`${no} saved`, { description: `Check ${checkNo.trim()} to ${payee.trim()}, ${formatPeso(paidOut)}` })
    navigate(`/disbursements?open=${no}`)
  }

  return (
    <Page crumbs={['Disbursements', 'New voucher']}>
      <PageHeader
        title="New voucher"
        description="Who the check is for, then the journal lines. Press F5 on an account to search the chart of accounts."
      />

      <form
        noValidate
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Journal lines</CardTitle>
            <CardDescription>Debit what the money paid for; credit the bank the check is drawn on.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div role="table" aria-label="Journal lines" className="flex flex-col">
              <div role="row" className="hidden grid-cols-[minmax(0,1fr)_150px_150px_40px] gap-2 pb-2 text-xs text-muted-foreground sm:grid">
                <span role="columnheader">Account</span>
                <span role="columnheader" className="text-right">Debit</span>
                <span role="columnheader" className="text-right">Credit</span>
                <span role="columnheader" className="sr-only">Remove</span>
              </div>
              {lines.map((l, i) => (
                <div
                  key={l.key}
                  role="row"
                  className="grid grid-cols-[minmax(0,1fr)_40px] gap-2 border-t border-rule py-2 sm:grid-cols-[minmax(0,1fr)_150px_150px_40px]"
                >
                  <div role="cell" className="col-span-2 sm:col-span-1">
                    <AccountPicker
                      label={`Line ${i + 1} account`}
                      value={l.accountCode}
                      onChange={(accountCode) => update(l.key, { accountCode })}
                    />
                  </div>
                  <div role="cell">
                    <MoneyInput
                      aria-label={`Line ${i + 1} debit`}
                      className="text-right"
                      value={l.debit}
                      onValueChange={(debit) => update(l.key, { debit })}
                    />
                  </div>
                  <div role="cell">
                    <MoneyInput
                      aria-label={`Line ${i + 1} credit`}
                      className="text-right"
                      value={l.credit}
                      onValueChange={(credit) => update(l.key, { credit })}
                    />
                  </div>
                  <div role="cell" className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove line ${i + 1}`}
                      disabled={lines.length <= 1}
                      onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2 border-t pt-3 text-sm font-medium sm:grid-cols-[minmax(0,1fr)_150px_150px_40px]">
                <span>Totals</span>
                <span className="hidden text-right sm:block">
                  <Money value={totals.debit} peso={false} />
                </span>
                <span className="hidden text-right sm:block">
                  <Money value={totals.credit} peso={false} />
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setLines((ls) => [...ls, blankLine()])}>
                <Plus data-icon="inline-start" />
                Add line
              </Button>
              <Button type="button" variant="outline" onClick={balanceWithCash}>
                <Scale data-icon="inline-start" />
                Balance with {bank}
              </Button>
            </div>
            {shown.lines && <FieldError>{shown.lines}</FieldError>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check</CardTitle>
            <CardDescription>Paid out: {formatPeso(Math.max(paidOut, 0))}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!shown.payee || undefined}>
                <FieldLabel htmlFor="payee">Payee</FieldLabel>
                <Input id="payee" value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="Who the check is for" />
                {shown.payee && <FieldError>{shown.payee}</FieldError>}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field data-invalid={!!shown.date || undefined}>
                  <FieldLabel htmlFor="voucher-date">Date</FieldLabel>
                  <Input id="voucher-date" value={date} onChange={(e) => setDate(e.target.value)} />
                  {shown.date && <FieldError>{shown.date}</FieldError>}
                </Field>
                <Field data-invalid={!!shown.checkNo || undefined}>
                  <FieldLabel htmlFor="check-no">Check no.</FieldLabel>
                  <Input id="check-no" inputMode="numeric" value={checkNo} onChange={(e) => setCheckNo(e.target.value)} />
                  {shown.checkNo && <FieldError>{shown.checkNo}</FieldError>}
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="bank">Bank</FieldLabel>
                <SimpleSelect
                  id="bank"
                  value={bank}
                  onValueChange={(b) => setBank(b as Bank)}
                  options={banks.map((b) => ({ value: b, label: b }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="explanation">Explanation</FieldLabel>
                <Textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="e.g. Office rent for November"
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit">Save voucher</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/disbursements')}>
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      </form>
      <SampleNote />
    </Page>
  )
}

/** Account title search over the chart of accounts. F5 on the field opens it, as in the legacy system. */
function AccountPicker({ label, value, onChange }: { label: string; value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={label}
            onKeyDown={(e) => {
              if (e.key === 'F5') {
                e.preventDefault()
                setOpen(true)
              }
            }}
            className={cn(
              'flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20',
              !value && 'text-muted-foreground',
            )}
          />
        }
      >
        <span className="min-w-0 flex-1 truncate">{value ? accountTitle(value) : 'Pick an account'}</span>
        {value ? (
          <span className="text-xs text-muted-foreground">{value}</span>
        ) : (
          <Kbd className="hidden sm:inline-flex">F5</Kbd>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(420px,calc(100vw-2rem))] p-0">
        <Command>
          <CommandInput placeholder="Search title or code" />
          <CommandList>
            <CommandEmpty>No account matches.</CommandEmpty>
            <CommandGroup>
              {chartOfAccounts.map((a) => (
                <CommandItem
                  key={a.code}
                  value={`${a.title} ${a.code}`}
                  onSelect={() => {
                    onChange(a.code)
                    setOpen(false)
                  }}
                >
                  <span className="flex-1 truncate">{a.title}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{a.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
