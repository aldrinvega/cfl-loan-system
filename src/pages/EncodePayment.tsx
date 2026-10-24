import { useEffect, useEffectEvent, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, CircleAlert, Plus, Search, Trash2, UserRoundSearch } from 'lucide-react'
import { toast } from 'sonner'
import { formatMdy } from '@/lib/dates'
import { formatPeso } from '@/lib/money'
import { breakdownTotal, type Breakdown, type BreakdownMode } from '@/lib/cashiering'
import { buildLedger, safekeepingFor, splitTotal, summarizeLoan } from '@/lib/ledger'
import { cn } from '@/lib/utils'
import { collectors, penalties } from '@/data/sample'
import type { Collector } from '@/data/types'
import { Money } from '@/components/money'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { MoneyInput } from '@/components/MoneyInput'
import { KycBadge, PageHeader, SampleNote, StatusBadge } from '@/components/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { collectorLabel, useSession } from '@/state/session'
import { clientName, useStore } from '@/state/store'
import type { RouteAccount } from '@/state/portfolio'
import { useCashieringForm } from '@/state/useCashieringForm'

type Form = ReturnType<typeof useCashieringForm>

export function EncodePayment() {
  const [params] = useSearchParams()
  const { clients, loans, receipts } = useStore()
  const { canSeeBranch, canSeeClient } = useSession()

  // Coming from a client (dashboard, profile): start on their route and their open loan.
  // Read once, so later receipt changes don't move the cashier.
  const [initial] = useState(() => {
    const client = clients.find((c) => c.id === params.get('client'))
    if (!client || !canSeeClient(client)) return undefined
    const loan = loans.find(
      (l) => l.clientId === client.id && summarizeLoan(l, buildLedger(l, receipts, penalties)).balance > 0,
    )
    return { collectorId: client.collectorId, loanId: loan?.id }
  })
  const form = useCashieringForm(initial)

  const accountSearchRef = useRef<HTMLInputElement>(null)
  const orRef = useRef<HTMLInputElement>(null)
  const paymentRef = useRef<HTMLFormElement>(null)

  const [confirming, setConfirming] = useState(false)

  /** Like the legacy "Sure about your entries?": everything checks out, so show it once before posting. */
  function post() {
    if (form.check()) setConfirming(true)
    else toast.error("Payment wasn't posted", { description: 'Fix the items marked in red first.' })
  }

  function confirmPost() {
    setConfirming(false)
    const name = form.account ? clientName(form.account.client) : ''
    const receipt = form.post()
    if (receipt) {
      toast.success(`OR ${receipt.no} posted`, { description: `${formatPeso(receipt.amount)} from ${name}` })
      accountSearchRef.current?.focus()
    } else {
      toast.error("Payment wasn't posted", { description: 'Fix the items marked in red first.' })
    }
  }

  function unlockOr() {
    form.unlockOr()
    requestAnimationFrame(() => orRef.current?.select())
  }

  // F2 finds an account, F5 unlocks the OR number, Ctrl+S posts.
  const onShortcut = useEffectEvent((e: globalThis.KeyboardEvent) => {
    if (e.key === 'F2') {
      e.preventDefault()
      accountSearchRef.current?.focus()
    } else if (e.key === 'F5') {
      // Never reload the page mid-entry.
      e.preventDefault()
      if (form.account) unlockOr()
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      post()
    }
  })
  useEffect(() => {
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  // Enter moves to the next field in the payment form.
  function onPaymentKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    const target = e.target as HTMLElement
    if (e.key !== 'Enter' || !target.matches('input')) return
    e.preventDefault()
    const fields = Array.from(
      paymentRef.current?.querySelectorAll<HTMLElement>('input:not([readonly]):not([disabled])') ?? [],
    )
    fields[fields.indexOf(target) + 1]?.focus()
  }

  const routes = useMemo(
    () =>
      collectors
        .filter((c) => canSeeBranch(c.branchId))
        .map((collector) => ({
          collector,
          open: loans.filter((l) => {
            const client = clients.find((cl) => cl.id === l.clientId)
            return (
              client?.collectorId === collector.id &&
              summarizeLoan(l, buildLedger(l, receipts, penalties)).balance > 0
            )
          }).length,
        })),
    [canSeeBranch, clients, loans, receipts],
  )

  return (
    <Page crumbs={['Encode Payments']}>
      <PageHeader
        title="Encode payment"
        description="Pick the collector's route, pick the account, then enter the cash and checks from the collector's receipt."
        actions={
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Kbd>F2</Kbd> Find account</span>
            <span className="flex items-center gap-1.5"><Kbd>F5</Kbd> Change OR no.</span>
            <span className="flex items-center gap-1.5">
              <KbdGroup><Kbd>Ctrl</Kbd><Kbd>S</Kbd></KbdGroup> Post
            </span>
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CollectorPicker routes={routes} selected={form.collectorId} onSelect={form.setCollectorId} />
        <AccountPicker
          searchRef={accountSearchRef}
          collectorId={form.collectorId}
          accounts={form.accounts}
          selected={form.account?.loan.id}
          onSelect={(id) => {
            form.setLoanId(id)
            requestAnimationFrame(() => document.getElementById('cash')?.focus())
          }}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {form.account && form.breakdown ? (
          <Card className="border-foreground/25">
            <form
              ref={paymentRef}
              aria-label="Payment"
              className="flex flex-col gap-6"
              onKeyDown={onPaymentKeyDown}
              onSubmit={(e) => {
                e.preventDefault()
                post()
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  3. Payment · {form.account.loan.id} · {clientName(form.account.client)}
                </CardTitle>
                <CardDescription>
                  {form.account.client.address} · Collector {collectorLabel(form.account.client.collectorId)}
                </CardDescription>
                <CardAction>{form.account.client.kyc === 'verified' && <KycBadge />}</CardAction>
              </CardHeader>

              <CardContent className="flex flex-col gap-6">
                <FieldGroup className="grid gap-4 md:grid-cols-3">
                  <Field data-invalid={!!form.errors.orNo || undefined}>
                    <FieldLabel htmlFor="orno">OR number</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        ref={orRef}
                        id="orno"
                        inputMode="numeric"
                        readOnly={!form.orUnlocked}
                        value={form.orNo}
                        onChange={(e) => form.setOrNo(e.target.value.trim())}
                        aria-invalid={!!form.errors.orNo}
                      />
                      {!form.orUnlocked && (
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton size="xs" onClick={unlockOr}>
                            Change <Kbd>F5</Kbd>
                          </InputGroupButton>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                    {form.errors.orNo ? (
                      <FieldError>{form.errors.orNo}</FieldError>
                    ) : (
                      <FieldDescription>
                        {form.booklet
                          ? `From the collector's booklet ${form.booklet.from}–${form.booklet.to}.`
                          : 'This route has no booklet on file.'}
                      </FieldDescription>
                    )}
                  </Field>
                  <DateField
                    id="pdate"
                    label="Payment date"
                    hint="Date on the receipt"
                    value={form.paymentDate}
                    onChange={form.setPaymentDate}
                    error={form.errors.paymentDate}
                  />
                  <DateField
                    id="edate"
                    label="Effective date"
                    hint="Date the payment counts toward the loan"
                    value={form.effectiveDate}
                    onChange={form.setEffectiveDate}
                    error={form.errors.effectiveDate}
                  />
                </FieldGroup>

                <CashAndChecks form={form} />

                <div className="grid gap-4 md:grid-cols-2">
                  <BreakdownCard
                    breakdown={form.breakdown}
                    mode={form.mode}
                    otherPenalty={form.otherPenalty}
                    onOtherPenalty={form.setOtherPenalty}
                    safekeeping={form.safekeeping}
                    onSafekeeping={form.setSafekeeping}
                  />
                  <div className="flex flex-col gap-2">
                    <HelperButton active={form.mode === 'received'} onClick={form.computeFromReceived}>
                      Compute breakdown of amount received
                    </HelperButton>
                    <HelperButton active={form.mode === 'due'} onClick={form.computeDueToday}>
                      Compute total due today
                    </HelperButton>
                    <HelperButton active={form.mode === 'full'} onClick={form.fullPaymentWithRebate}>
                      Full payment with rebate
                      {form.rebate > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          −{formatPeso(form.rebate)}
                        </Badge>
                      )}
                    </HelperButton>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" onClick={form.totalToCash} disabled={form.total === 0}>
                        Total to cash
                      </Button>
                      <Button type="button" variant="outline" onClick={form.totalToCheck} disabled={form.total === 0}>
                        Total to check
                      </Button>
                    </div>
                    <FieldDescription>
                      {form.mode === 'received'
                        ? 'The breakdown follows the cash and checks as you type them.'
                        : `The breakdown is fixed at ${formatPeso(form.total)}. Use "Total to cash" or "Total to check" to receive it.`}
                    </FieldDescription>
                  </div>
                </div>

                <MatchAlert breakdown={form.breakdown} received={form.received} matches={form.matches} />

                {(form.errors.received || form.errors.checks) && (
                  <FieldError>{[form.errors.received, form.errors.checks].filter(Boolean).join(' ')}</FieldError>
                )}
              </CardContent>

              <CardFooter className="flex-wrap gap-3 border-t">
                <Button type="submit" disabled={!form.matches}>
                  Post
                  <KbdGroup data-icon="inline-end">
                    <Kbd>Ctrl</Kbd>
                    <Kbd>S</Kbd>
                  </KbdGroup>
                </Button>
                <Button type="button" variant="outline" onClick={form.clear}>
                  Clear
                </Button>
                <span className="text-xs text-muted-foreground">
                  Posts under Collector {form.account.client.collectorId} and OR {form.orNo || '—'}. Posted payments
                  can't be edited; cancel the OR and encode it again.
                </span>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UserRoundSearch />
                  </EmptyMedia>
                  <EmptyTitle>3. Payment</EmptyTitle>
                  <EmptyDescription>
                    {form.collectorId
                      ? 'Pick an account from the route above, or press F2 to search for one.'
                      : "Start by picking the collector's route."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          {form.account && <AccountSummary account={form.account} />}
          {form.account && <PaymentRecord account={form.account} />}
          <SampleNote />
        </div>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          {form.account && form.breakdown && (
            <>
              <DialogHeader>
                <DialogTitle>Post OR {form.orNo}?</DialogTitle>
                <DialogDescription>
                  {clientName(form.account.client)} · {form.account.loan.id}. Posted receipts can't be edited; a
                  mistake is fixed by cancelling the OR.
                </DialogDescription>
              </DialogHeader>
              <dl className="flex flex-col text-sm">
                {(
                  [
                    ['Cash', form.cash ?? 0],
                    ...form.checks.map((c, i): [string, number] => [`Check ${c.no || i + 1}`, c.amount ?? 0]),
                    ['Amortization', form.breakdown.amortization],
                    ['Penalties', form.breakdown.penalty + form.breakdown.otherPenalty],
                    ['Safekeeping', form.breakdown.safekeeping],
                  ] as [string, number][]
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-6 border-b border-rule py-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>
                      <Money value={value} />
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between gap-6 pt-2 font-medium">
                  <dt>Total received</dt>
                  <dd>
                    <Money value={form.received} />
                  </dd>
                </div>
              </dl>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirming(false)}>
                  Go back
                </Button>
                <Button autoFocus onClick={confirmPost}>
                  Post OR {form.orNo}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Page>
  )
}

function DateField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      {error ? <FieldError>{error}</FieldError> : <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

function CollectorPicker({
  routes,
  selected,
  onSelect,
}: {
  routes: { collector: Collector; open: number }[]
  selected: string | undefined
  onSelect: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = routes.filter(
    ({ collector }) => !q || collector.name.toLowerCase().includes(q) || collector.id.toLowerCase().includes(q),
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Collector</CardTitle>
        <CardAction className="text-xs text-muted-foreground">Route</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search collectors"
            placeholder="Search collector"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <ItemGroup className="gap-1" aria-label="Collectors">
          {shown.map(({ collector, open }) => {
            const isSelected = collector.id === selected
            return (
              <Item
                key={collector.id}
                size="sm"
                aria-pressed={isSelected}
                render={<button type="button" onClick={() => onSelect(collector.id)} />}
                className={cn('w-full text-left', isSelected ? 'bg-muted' : 'hover:bg-muted/50')}
              >
                <ItemContent>
                  <ItemTitle className={cn(isSelected && 'font-semibold')}>
                    {collector.walkIn ? collector.name : `${collector.id} · ${collector.name}`}
                  </ItemTitle>
                </ItemContent>
                <ItemActions className="text-xs text-muted-foreground tabular-nums">{open}</ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

function AccountPicker({
  searchRef,
  collectorId,
  accounts,
  selected,
  onSelect,
}: {
  searchRef: RefObject<HTMLInputElement | null>
  collectorId: string | undefined
  accounts: RouteAccount[]
  selected: string | undefined
  onSelect: (loanId: string) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = accounts.filter(
    (a) => !q || clientName(a.client).toLowerCase().includes(q) || a.loan.id.toLowerCase().includes(q),
  )
  const collector = collectors.find((c) => c.id === collectorId)
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>2. Account</CardTitle>
        <CardDescription>
          {collector
            ? `${collector.walkIn ? collector.name : `Collector ${collectorLabel(collector.id)}`} · ${accounts.length} open accounts`
            : 'Pick a route first'}
        </CardDescription>
        <CardAction>
          <InputGroup className="w-64">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchRef}
              aria-label="Search accounts"
              placeholder="Name or loan ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && shown[0]) {
                  e.preventDefault()
                  onSelect(shown[0].loan.id)
                }
              }}
            />
            <InputGroupAddon align="inline-end">
              <Kbd>F2</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="max-h-[420px] overflow-auto">
          <Table className="[&_td]:px-2 [&_th]:px-2">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Loan amount</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Due today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((a) => {
                const isSelected = a.loan.id === selected
                return (
                  <TableRow
                    key={a.loan.id}
                    tabIndex={0}
                    aria-selected={isSelected}
                    data-state={isSelected ? 'selected' : undefined}
                    onClick={() => onSelect(a.loan.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(a.loan.id)
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell>{a.loan.id}</TableCell>
                    <TableCell className="font-medium">{clientName(a.client)}</TableCell>
                    <TableCell className="text-right"><Money value={a.loan.principal} peso={false} /></TableCell>
                    <TableCell>{formatMdy(a.loan.releasedOn)}</TableCell>
                    <TableCell>{formatMdy(a.summary.maturesOn)}</TableCell>
                    <TableCell>{a.loan.frequencyDays === 7 ? 'Weekly' : 'Daily'}</TableCell>
                    <TableCell>{a.status === 'arrears' ? <StatusBadge status="arrears" /> : 'Current'}</TableCell>
                    <TableCell className="text-right"><Money value={splitTotal(a.split.due)} peso={false} /></TableCell>
                  </TableRow>
                )
              })}
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                    {!collectorId
                      ? "Pick the collector's route on the left."
                      : q
                        ? 'No account matches.'
                        : 'No open accounts on this route.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function CashAndChecks({ form }: { form: Form }) {
  const checkTotal = form.checks.reduce((t, c) => t + (c.amount ?? 0), 0)
  return (
    <FieldSet className="min-w-0">
      <FieldLegend variant="label">Cash and checks received</FieldLegend>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Check</TableHead>
              <TableHead>Check no.</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Check date</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Remove</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell className="w-40">
                <MoneyInput
                  id="cash"
                  aria-label="Cash"
                  value={form.cash}
                  onValueChange={form.setCash}
                  aria-invalid={!!form.errors.received}
                  className="text-right font-semibold"
                />
              </TableCell>
              <TableCell className="text-right text-muted-foreground"><Money value={checkTotal} peso={false} /></TableCell>
              <TableCell colSpan={5} className="text-muted-foreground">
                {form.checks.length ? `${form.checks.length} check${form.checks.length === 1 ? '' : 's'} below` : '–'}
              </TableCell>
            </TableRow>
            {form.checks.map((c, i) => (
              <TableRow key={c.id} className="hover:bg-transparent">
                <TableCell className="text-right text-muted-foreground">–</TableCell>
                <TableCell className="w-36">
                  <MoneyInput
                    aria-label={`Check ${i + 1} amount`}
                    value={c.amount}
                    onValueChange={(amount) => form.updateCheck(c.id, { amount })}
                    className="text-right"
                  />
                </TableCell>
                <TableCell>
                  <Input aria-label={`Check ${i + 1} number`} value={c.no} onChange={(e) => form.updateCheck(c.id, { no: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input aria-label={`Check ${i + 1} bank`} value={c.bank} onChange={(e) => form.updateCheck(c.id, { bank: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input aria-label={`Check ${i + 1} branch`} value={c.branch} onChange={(e) => form.updateCheck(c.id, { branch: e.target.value })} />
                </TableCell>
                <TableCell className="w-36">
                  <Input
                    aria-label={`Check ${i + 1} date`}
                    placeholder="MM/DD/YYYY"
                    value={c.date}
                    onChange={(e) => form.updateCheck(c.id, { date: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove check ${i + 1}`}
                    onClick={() => form.removeCheck(c.id)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={form.addCheck}>
          <Plus data-icon="inline-start" />
          Add check
        </Button>
        <span className="text-sm text-muted-foreground">
          Total received <span className="text-lg font-semibold text-foreground"><Money value={form.received} /></span>
        </span>
      </div>
    </FieldSet>
  )
}

const modeLabel: Record<BreakdownMode, string> = {
  received: 'from the amount received',
  due: 'total due today',
  full: 'full payment',
}

function BreakdownCard({
  breakdown,
  mode,
  otherPenalty,
  onOtherPenalty,
  safekeeping,
  onSafekeeping,
}: {
  breakdown: Breakdown
  mode: BreakdownMode
  otherPenalty: number | null
  onOtherPenalty: (v: number | null) => void
  safekeeping: number | null
  onSafekeeping: (v: number | null) => void
}) {
  return (
    <section aria-label="Payment breakdown" className="flex flex-col gap-3 rounded-md bg-muted p-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">Payment breakdown</h3>
        <p className="text-sm text-muted-foreground">Computed by the system, {modeLabel[mode]}</p>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <Line label="Amortization" value={breakdown.amortization} />
        <Line label="Computed penalty" value={breakdown.penalty} />
        <ManualLine id="other-penalty" label="Other penalty" value={otherPenalty} onChange={onOtherPenalty} />
        <ManualLine id="safekeeping" label="Safekeeping" value={safekeeping} onChange={onSafekeeping} />
        <Separator />
        <Line label="Total" value={breakdownTotal(breakdown)} strong />
        <Separator />
        <Line label="Rebate (not cash)" value={breakdown.rebate} />
        <p className="text-xs text-muted-foreground">
          Other penalty and safekeeping are typed in from the collector's receipt, not computed by the system.
        </p>
      </div>
    </section>
  )
}

/** A breakdown line the accounting officer types in. */
function ManualLine({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-muted-foreground">
        {label}
      </label>
      <MoneyInput id={id} value={value} onValueChange={onChange} className="w-28 text-right" placeholder="0.00" />
    </div>
  )
}

function Line({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-3', strong && 'font-semibold')}>
      <span className={cn(!strong && 'text-muted-foreground')}>{label}</span>
      <span className="tabular-nums"><Money value={value} peso={false} /></span>
    </div>
  )
}

function HelperButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'outline'}
      aria-pressed={active}
      className="justify-start"
      onClick={onClick}
    >
      {active && <Check data-icon="inline-start" />}
      {children}
    </Button>
  )
}

function MatchAlert({ breakdown, received, matches }: { breakdown: Breakdown; received: number; matches: boolean }) {
  const total = breakdownTotal(breakdown)
  if (received === 0 && total === 0) {
    return (
      <Alert>
        <CircleAlert />
        <AlertDescription>
          Enter the cash and checks from the collector's receipt. The system works out the rest.
        </AlertDescription>
      </Alert>
    )
  }
  const parts = [
    breakdown.amortization,
    breakdown.penalty,
    ...(breakdown.otherPenalty ? [breakdown.otherPenalty] : []),
    breakdown.safekeeping,
  ]
  const equation = `${parts.map(formatPeso).join(' + ')} = ${formatPeso(total)}`
  if (matches) {
    return (
      <Alert role="status">
        <Check className="text-positive!" />
        <AlertDescription className="text-foreground">Breakdown matches the total received: {equation}</AlertDescription>
      </Alert>
    )
  }
  const diff = total - received
  return (
    <Alert variant="destructive" role="status">
      <CircleAlert />
      <AlertDescription>
        Breakdown doesn't match the total received: {equation}, but {formatPeso(received)} was received (
        <Money value={Math.abs(diff)} /> {diff > 0 ? 'short' : 'over'}).
      </AlertDescription>
    </Alert>
  )
}

function SplitRow({ label, split }: { label: string; split: { amortization: number; penalty: number } }) {
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell className="text-right"><Money value={split.amortization} peso={false} /></TableCell>
      <TableCell className="text-right"><Money value={split.penalty} peso={false} /></TableCell>
      <TableCell className="text-right"><Money value={splitTotal(split)} peso={false} /></TableCell>
    </TableRow>
  )
}

function AccountSummary({ account }: { account: RouteAccount }) {
  const { client, split } = account
  const { receipts } = useStore()
  const safekeeping = safekeepingFor(
    client.safekeepingOpening,
    receipts.filter((r) => r.clientId === client.id),
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account summary</CardTitle>
        <CardAction>
          <ButtonLink variant="link" size="sm" to={`/clients/${client.id}`}>
            Open profile
          </ButtonLink>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="-mx-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="sr-only">Line</span>
                </TableHead>
                <TableHead className="text-right">Amort.</TableHead>
                <TableHead className="text-right">Penalty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SplitRow label="Charges" split={split.charges} />
              <SplitRow label="Payments" split={split.payments} />
              <SplitRow label="Adjusted" split={split.adjusted} />
            </TableBody>
            <TableFooter>
              <SplitRow label="Balance" split={split.balance} />
              <SplitRow label="Due today" split={split.due} />
            </TableFooter>
          </Table>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Safekeeping balance</span>
          <span className="font-semibold"><Money value={safekeeping.balance} /></span>
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentRecord({ account }: { account: RouteAccount }) {
  const { receipts } = useStore()
  const entries = buildLedger(account.loan, receipts, penalties)
    .filter((e) => e.kind !== 'release')
    .reverse()
    .slice(0, 6)
  const reference = (e: (typeof entries)[number]) => {
    if (e.kind === 'penalty') return e.reference.startsWith('OR') ? `${e.reference} · other penalty` : 'Penalty'
    if (e.kind === 'rebate') return `${e.reference} · rebate`
    return e.reference
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment record</CardTitle>
        <CardDescription>Latest entries on {account.loan.id}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="-mx-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={`${e.reference}-${e.kind}`}>
                  <TableCell>{formatMdy(e.date)}</TableCell>
                  <TableCell className="text-right"><Money value={e.charges} peso={false} /></TableCell>
                  <TableCell className="text-right"><Money value={e.payment} peso={false} /></TableCell>
                  <TableCell>{reference(e)}</TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    No payments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
