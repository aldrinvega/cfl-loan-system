import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { formatMdy } from '@/lib/dates'
import { formatAmount, formatPeso, type Centavos } from '@/lib/money'
import {
  buildSchedule,
  flatInterest,
  FREQUENCIES,
  frequencyLabel,
  installmentFor,
  PRODUCTS,
} from '@/lib/loans'
import { disbursementFor, INSURANCE_RATE, netProceeds, SERVICE_FEE_RATE } from '@/data/reportSamples'
import { Page } from '@/components/layout'
import { MoneyInput } from '@/components/MoneyInput'
import { SimpleSelect } from '@/components/reports'
import { PageHeader, SampleNote } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item'
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

const MIN_PRINCIPAL = 100_000 // ₱1,000.00
const MAX_PRINCIPAL = 50_000_000 // ₱500,000.00
const MAX_TERM = 120

/** New loan application: the terms, the schedule they produce, and submit for approval. */
export function NewLoan() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { clients, submitLoan } = useStore()
  const { user, canSeeClient } = useSession()
  const visible = clients.filter(canSeeClient)

  const [clientId, setClientId] = useState(() => {
    const id = params.get('client')
    return visible.some((c) => c.id === id) ? (id as string) : ''
  })
  const [productName, setProductName] = useState(PRODUCTS[0].name)
  const [principal, setPrincipal] = useState<Centavos | null>(null)
  const [termText, setTermText] = useState(String(PRODUCTS[0].term))
  const [frequencyDays, setFrequencyDays] = useState(PRODUCTS[0].frequencyDays)
  const [submitted, setSubmitted] = useState(false)

  const product = PRODUCTS.find((p) => p.name === productName)!
  const client = visible.find((c) => c.id === clientId)
  const term = Number(termText)
  const termOk = Number.isInteger(term) && term >= 1 && term <= MAX_TERM
  const principalOk = principal !== null && principal >= MIN_PRINCIPAL && principal <= MAX_PRINCIPAL

  const errors = {
    client: client ? undefined : 'Pick the client.',
    principal: principalOk ? undefined : `Enter ${formatPeso(MIN_PRINCIPAL)} to ${formatPeso(MAX_PRINCIPAL)}.`,
    term: termOk ? undefined : `Enter 1 to ${MAX_TERM} installments.`,
  }
  const valid = !errors.client && !errors.principal && !errors.term
  const shown: Partial<typeof errors> = submitted ? errors : {}

  const ready = principalOk && termOk
  const interest = ready ? flatInterest(product, principal, term, frequencyDays) : 0
  const installment = ready ? installmentFor(principal, interest, term) : 0
  const schedule = ready ? buildSchedule(principal, interest, term, frequencyDays, user.businessDate) : []
  const release = ready
    ? disbursementFor({
        voucher: '',
        date: user.businessDate,
        branchId: '',
        borrower: '',
        loanId: '',
        product: product.name,
        principal,
        releasedBy: '',
      })
    : null

  function submit() {
    setSubmitted(true)
    if (!valid || !client || principal === null) return
    const id = submitLoan(
      { clientId: client.id, product: product.name, frequencyDays, principal, interest, installment, term },
      user.name,
      user.businessDate,
    )
    toast.success(`${id} filed for approval`, { description: `${formatPeso(principal)} for ${clientName(client)}` })
    navigate('/loans')
  }

  return (
    <Page crumbs={['Loans', 'New loan']}>
      <PageHeader title="New loan" description="Set the terms, check the schedule, then submit the loan for approval." />

      <div className="grid items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <form
            noValidate
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <CardHeader>
              <CardTitle>Loan terms</CardTitle>
              <CardDescription>Interest is flat, on the principal.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={!!shown.client || undefined}>
                  <FieldLabel htmlFor="loan-client">Client</FieldLabel>
                  <SimpleSelect
                    id="loan-client"
                    value={clientId}
                    onValueChange={setClientId}
                    options={[
                      { value: '', label: 'Pick a client' },
                      ...visible.map((c) => ({ value: c.id, label: `${clientName(c)} · ${c.id}` })),
                    ]}
                  />
                  {shown.client ? (
                    <FieldError>{shown.client}</FieldError>
                  ) : (
                    client && (
                      <FieldDescription>
                        Collector {collectorLabel(client.collectorId)} ·{' '}
                        {client.kyc === 'verified' ? 'KYC verified' : 'KYC pending'}
                      </FieldDescription>
                    )
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="loan-product">Product</FieldLabel>
                  <SimpleSelect
                    id="loan-product"
                    value={productName}
                    onValueChange={(name) => {
                      const p = PRODUCTS.find((x) => x.name === name)!
                      setProductName(name)
                      setTermText(String(p.term))
                      setFrequencyDays(p.frequencyDays)
                    }}
                    options={PRODUCTS.map((p) => ({ value: p.name, label: p.name }))}
                  />
                  <FieldDescription>
                    {Math.round(product.rate * 100)}% flat for {product.term} {frequencyLabel(product.frequencyDays).toLowerCase()}{' '}
                    installments, pro-rated to the term.
                  </FieldDescription>
                </Field>
                <Field data-invalid={!!shown.principal || undefined}>
                  <FieldLabel htmlFor="loan-principal">Principal</FieldLabel>
                  <MoneyInput
                    id="loan-principal"
                    value={principal}
                    onValueChange={setPrincipal}
                    aria-invalid={!!shown.principal}
                    className="text-right"
                  />
                  {shown.principal && <FieldError>{shown.principal}</FieldError>}
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field data-invalid={!!shown.term || undefined}>
                    <FieldLabel htmlFor="loan-term">Term (installments)</FieldLabel>
                    <Input
                      id="loan-term"
                      inputMode="numeric"
                      value={termText}
                      onChange={(e) => setTermText(e.target.value.replace(/\D/g, ''))}
                      aria-invalid={!!shown.term}
                    />
                    {shown.term && <FieldError>{shown.term}</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="loan-frequency">Frequency</FieldLabel>
                    <SimpleSelect
                      id="loan-frequency"
                      value={String(frequencyDays)}
                      onValueChange={(v) => setFrequencyDays(Number(v))}
                      options={FREQUENCIES.map((f) => ({ value: String(f.days), label: f.label }))}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
            <CardContent>
              <ItemGroup>
                <Line label="Interest (flat)" value={formatPeso(interest)} />
                <Line label="Total to repay" value={formatPeso((principal ?? 0) + interest)} />
                <Line label={`Installment · ${frequencyLabel(frequencyDays).toLowerCase()}`} value={formatPeso(installment)} strong />
                <Separator className="my-1" />
                <Line label={`Service fee (${SERVICE_FEE_RATE * 100}%)`} value={`−${formatPeso(release?.serviceFee ?? 0)}`} />
                <Line label={`Insurance (${INSURANCE_RATE * 100}%)`} value={`−${formatPeso(release?.insurance ?? 0)}`} />
                <Line label="Net proceeds on release" value={formatPeso(release ? netProceeds(release) : 0)} strong />
              </ItemGroup>
            </CardContent>
            <CardFooter className="gap-3 border-t">
              <Button type="submit">Submit for approval</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/loans')}>
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Schedule preview</CardTitle>
            <CardDescription>
              {ready
                ? `If released today (${formatMdy(user.businessDate)}): ${term} ${frequencyLabel(frequencyDays).toLowerCase()} installments, last due ${formatMdy(schedule.at(-1)!.dueOn)}.`
                : 'Enter the principal and term to see the schedule.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[560px] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Installment</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((r) => (
                    <TableRow key={r.no}>
                      <TableCell>{r.no}</TableCell>
                      <TableCell>{formatMdy(r.dueOn)}</TableCell>
                      <TableCell className="text-right">{formatAmount(r.principal)}</TableCell>
                      <TableCell className="text-right">{formatAmount(r.interest)}</TableCell>
                      <TableCell className="text-right font-medium">{formatAmount(r.amount)}</TableCell>
                      <TableCell className="text-right">{formatAmount(r.balance)}</TableCell>
                    </TableRow>
                  ))}
                  {schedule.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No schedule yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {ready && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>Totals</TableCell>
                      <TableCell className="text-right">{formatAmount(principal)}</TableCell>
                      <TableCell className="text-right">{formatAmount(interest)}</TableCell>
                      <TableCell className="text-right">{formatAmount(principal + interest)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <SampleNote />
    </Page>
  )
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <Item size="xs" className="px-0">
      <ItemContent>
        <ItemTitle className={strong ? 'font-semibold' : 'font-normal text-muted-foreground'}>{label}</ItemTitle>
      </ItemContent>
      <ItemActions className={strong ? 'font-semibold tabular-nums' : 'tabular-nums'}>{value}</ItemActions>
    </Item>
  )
}
