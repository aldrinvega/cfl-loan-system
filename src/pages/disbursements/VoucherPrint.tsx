import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { formatMdy } from '@/lib/dates'
import { cashOut } from '@/lib/vouchers'
import { branches, COMPANY_NAME } from '@/data/sample'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { Money } from '@/components/money'
import { PageHeader, SampleNote } from '@/components/shared'
import { Signatures } from '@/components/signatures'
import { JournalLines } from '@/pages/disbursements/JournalLines'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useSession } from '@/state/session'
import { useStore } from '@/state/store'

/** The check voucher as it prints: payee and check, the journal entry, and the sign-offs. */
export function VoucherPrint() {
  const { no } = useParams()
  const { vouchers } = useStore()
  const { canSeeBranch } = useSession()
  const v = vouchers.find((x) => x.no === no && canSeeBranch(x.branchId))

  if (!v)
    return (
      <Page crumbs={['Disbursements', no ?? '']}>
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No voucher {no}</EmptyTitle>
            <EmptyDescription>It may have been deleted, or it belongs to another branch.</EmptyDescription>
          </EmptyHeader>
          <ButtonLink variant="outline" to="/disbursements">
            Back to Disbursements
          </ButtonLink>
        </Empty>
      </Page>
    )

  const branch = branches.find((b) => b.id === v.branchId)?.name ?? ''
  return (
    <Page crumbs={['Disbursements', v.no]}>
      <PageHeader
        title={`Voucher ${v.no}`}
        description={`${v.kind === 'release' ? 'Loan release' : 'Expense'} · check ${v.checkNo}, ${v.bank}`}
        actions={
          <>
            <ButtonLink variant="outline" to={`/disbursements?open=${v.no}`}>
              Back
            </ButtonLink>
            <Button onClick={() => window.print()}>
              <Printer data-icon="inline-start" />
              Print voucher
            </Button>
          </>
        }
      />
      <Card className="mx-auto w-full max-w-3xl print:max-w-none print:border-0">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm text-muted-foreground">
              {COMPANY_NAME} · {branch}
            </span>
            <h2 className="text-lg font-semibold tracking-tight">CHECK VOUCHER {v.no}</h2>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
            <Field label="Pay to" value={v.payee} wide />
            <Field label="Date" value={formatMdy(v.date)} />
            <Field label="Amount" value={<Money value={cashOut(v)} className="font-semibold" />} />
            <Field label="Bank" value={v.bank} />
            <Field label="Check no." value={v.checkNo} />
            <Field label="Encoded by" value={v.encoder} />
            <Field label="Explanation" value={v.explanation || '–'} wide />
          </dl>
          <JournalLines lines={v.lines} />
        </CardContent>
        <CardFooter className="block border-t">
          <Signatures received />
        </CardFooter>
      </Card>
      <SampleNote />
    </Page>
  )
}

function Field({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
