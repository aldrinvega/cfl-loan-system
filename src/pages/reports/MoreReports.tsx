import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Page } from '@/components/layout'
import { ReportTabs } from '@/components/reports'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Permission } from '@/state/permissions'
import { useSession } from '@/state/session'
import { useSettings, type Signatories } from '@/state/settings'

type Report = { title: string; to?: string; needs?: Permission }

// The legacy "Kind of Report" list, in its order and numbering, so staff find each report
// where they expect it. Reports without a screen yet are listed and marked.
const reports: Report[] = [
  { title: 'Summary of Loan Release & Collection' },
  { title: 'Disbursement Report', to: '/disbursements', needs: 'viewCashReports' },
  { title: 'Cash Receipts Report', to: '/reports/cash-receipts', needs: 'viewCashReports' },
  { title: 'Journal Report' },
  { title: 'Summary Trial Balance' },
  { title: 'Comparative Statement of Operation' },
  { title: 'Statement of Financial Condition' },
  { title: 'Aging of Amortizations', to: '/reports/aging', needs: 'viewLoanReports' },
  { title: 'Aging of Loans Receivable by Maturity' },
  { title: 'Loan Status' },
  { title: 'Distribution of Loans Receivable to Income' },
  { title: 'Aging of Past Due & for Litigation Loans' },
  { title: 'Past Due & Litigation Collected for the Month' },
  { title: 'Daily Target of Collectors', to: '/reports/daily-target', needs: 'viewLoanReports' },
  { title: 'Loan Release Report', to: '/loans', needs: 'viewLoans' },
  { title: 'Monthly Collection Report', to: '/reports/collections', needs: 'viewCashReports' },
  { title: 'Loan Collection Summary per Collector' },
  { title: 'Sales Report per Day' },
  { title: 'Rebates given' },
  { title: 'Collection Target for Appliance Loans' },
  { title: 'Report of Safekeeping Balances', to: '/reports/safekeeping', needs: 'viewCashReports' },
  { title: 'Interest Expense on Safekeeping Deposits' },
  { title: 'Disbursement Report - Loan Releases', to: '/reports/disbursements', needs: 'viewCashReports' },
  { title: 'Disbursement Report - Expenses', to: '/disbursements?kind=expense', needs: 'viewCashReports' },
  { title: 'Report of Duplicate Names' },
  { title: 'Excluded Past Due & Litigation Accounts' },
]

export function MoreReports() {
  const { can } = useSession()
  const shown = reports.map((r, i) => ({ ...r, no: i + 1 })).filter((r) => !r.needs || can(r.needs))
  const built = shown.filter((r) => r.to).length

  return (
    <Page crumbs={['Print Reports']}>
      <PageHeader
        title="Print Reports"
        description={`The legacy system's ${reports.length} reports, numbered as before. ${built} open here; the rest are marked.`}
      />
      <ReportTabs />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="kinds" className="flex flex-col gap-2">
          <h2 id="kinds" className="text-base font-medium">
            Kind of report
          </h2>
          <ol className="flex flex-col">
            {shown.map((r) => {
              const body = (
                <>
                  <span className="w-7 flex-none text-right text-muted-foreground tabular-nums">{r.no}</span>
                  <span className={r.to ? 'flex-1 font-medium' : 'flex-1 text-muted-foreground'}>{r.title}</span>
                  {r.to ? (
                    <ChevronRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Not built yet</span>
                  )}
                </>
              )
              const row = 'group flex min-h-11 items-center gap-4 border-b border-rule px-2 text-sm'
              return (
                <li key={r.no}>
                  {r.to ? (
                    <Link to={r.to} className={`${row} rounded-sm transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none`}>
                      {body}
                    </Link>
                  ) : (
                    <div className={row} aria-disabled>
                      {body}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>

        <SignatoriesCard />
      </div>
    </Page>
  )
}

/** Prepared / Checked / Noted-by names printed at the foot of every report and voucher. */
function SignatoriesCard() {
  const { user, roleLabel, can } = useSession()
  const { signatories, setSignatories } = useSettings()
  const [draft, setDraft] = useState<Signatories>(signatories)
  const editable = can('settings')
  const field = (key: keyof Signatories, label: string) => (
    <Field>
      <FieldLabel htmlFor={`sig-${key}`}>{label}</FieldLabel>
      <Input
        id={`sig-${key}`}
        value={draft[key]}
        disabled={!editable}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
      />
    </Field>
  )
  return (
    // Stays in view beside the long report list instead of floating at its top.
    <Card className="xl:sticky xl:top-20">
      <CardHeader>
        <CardTitle>Signatories</CardTitle>
        <CardDescription>
          Printed at the foot of reports and vouchers. Prepared by is whoever is signed in: {user.name}, {roleLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSignatories(draft)
            toast.success('Signatories saved on this computer')
          }}
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              {field('checkedBy', 'Checked by')}
              {field('checkedTitle', 'Designation')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('notedBy', 'Noted / Approved by')}
              {field('notedTitle', 'Designation')}
            </div>
            {editable ? (
              <Button type="submit" variant="outline" className="self-start">
                Save signatories
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">An accounting officer or the President can change these.</p>
            )}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
