import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarClock,
  ChartColumn,
  ChevronRight,
  Clock,
  FileText,
  Gavel,
  PiggyBank,
  Scale,
  SquareArrowOutUpRight,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { Page } from '@/components/layout'
import { ReportTabs } from '@/components/reports'
import { PageHeader } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/state/session'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

type Report = { title: string; description: string; icon: LucideIcon; to?: string }

// Which reports each kind of user may open.
const cashReports = ['/reports/cash-receipts', '/reports/disbursements', '/reports/safekeeping', '/reports/collections']

const reports: Report[] = [
  {
    title: 'Cash Receipts Book',
    description: 'Posted and cancelled receipts by collector and date, with balancing totals.',
    icon: BookOpen,
    to: '/reports/cash-receipts',
  },
  {
    title: 'Daily target of collectors',
    description: "Each route's accounts grouped by loan status, with what's collectible today.",
    icon: Target,
    to: '/reports/daily-target',
  },
  {
    title: 'Disbursements',
    description: 'Loans released, with fees, insurance and net proceeds.',
    icon: SquareArrowOutUpRight,
    to: '/reports/disbursements',
  },
  {
    title: 'Loan ledger',
    description: 'Every charge and payment on one loan, with the running balance.',
    icon: FileText,
    to: '/reports/loan-ledger',
  },
  {
    title: 'Aging of receivables',
    description: 'Open balances by days since the last payment, with everything over 90 days listed.',
    icon: Clock,
    to: '/reports/aging',
  },
  {
    title: 'Safekeeping balances',
    description: 'Money held for each client: beginning, deposits and ending balance.',
    icon: PiggyBank,
    to: '/reports/safekeeping',
  },
  {
    title: 'Collector performance',
    description: 'Collection efficiency by collector, week over week.',
    icon: ChartColumn,
    to: '/reports/collections',
  },
  { title: 'Matured loans', description: 'Loans past maturity that still carry a balance.', icon: CalendarClock },
  { title: 'Penalties charged', description: 'Late penalties by client and period.', icon: Scale },
  { title: 'Accounts in litigation', description: 'Status, lawyer and next hearing for each case.', icon: Gavel },
]

export function MoreReports() {
  const { can } = useSession()
  const shown = reports.filter(
    (r) => !r.to || can(cashReports.includes(r.to) ? 'viewCashReports' : 'viewLoanReports'),
  )
  return (
    <Page crumbs={['Print Reports']}>
      <PageHeader
        title="Print Reports"
        description="Pick a report to view, export to Excel or PDF, or print."
      />
      <ReportTabs />
      <ItemGroup className="grid gap-3 md:grid-cols-2">
        {shown.map(({ title, description, icon: Icon, to }) => {
          const content = (
            <>
              <ItemMedia variant="icon">
                <Icon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{title}</ItemTitle>
                <ItemDescription>{description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                {to ? <ChevronRight className="size-4 text-muted-foreground" /> : <Badge variant="secondary">Coming soon</Badge>}
              </ItemActions>
            </>
          )
          return to ? (
            <Item key={title} variant="outline" render={<Link to={to} />}>
              {content}
            </Item>
          ) : (
            <Item key={title} variant="outline" aria-disabled className="opacity-60">
              {content}
            </Item>
          )
        })}
      </ItemGroup>
    </Page>
  )
}
