import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  PiggyBank,
  Printer,
  ReceiptText,
  SquareArrowOutUpRight,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useSettings } from '@/state/settings'
import type { Permission } from '@/state/permissions'
import { useSession } from '@/state/session'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  match?: string[]
  /** Shown only to roles with one of these permissions. */
  needs?: Permission[]
}

const overview: NavItem[] = [{ to: '/home', label: 'Dashboard', icon: LayoutDashboard }]

// Same names and order as the legacy system's main menu, so staff find things where they expect.
const menu: NavItem[] = [
  { to: '/payments/new', label: 'Encode Payments', icon: ReceiptText, match: ['/payments'], needs: ['encodePayments'] },
  { to: '/loans', label: 'Loans', icon: FileText, needs: ['viewLoans'] },
  { to: '/reports/safekeeping', label: 'Safekeeping', icon: PiggyBank, needs: ['viewCashReports'] },
  { to: '/clients', label: 'Clients', icon: Users, needs: ['viewClients'] },
  { to: '/reports/cash-receipts', label: 'Cash Receipts Book', icon: BookOpen, needs: ['viewCashReports'] },
  { to: '/reports/disbursements', label: 'Disbursements', icon: SquareArrowOutUpRight, match: ['/reports/disbursements', '/disbursements'], needs: ['viewCashReports'] },
  { to: '/utilities', label: 'Utilities', icon: Wrench, match: ['/utilities', '/day-close', '/settings'], needs: ['dayClose', 'settings'] },
  { to: '/reports/more', label: 'Print Reports', icon: Printer, match: ['/reports'] },
]

/** The item whose path matches the current page most closely, so /reports/... picks the right one. */
function activeItem(pathname: string): string | undefined {
  let best: { to: string; length: number } | undefined
  for (const item of [...overview, ...menu]) {
    for (const prefix of item.match ?? [item.to]) {
      if (pathname.startsWith(prefix) && prefix.length > (best?.length ?? 0)) best = { to: item.to, length: prefix.length }
    }
  }
  return best?.to
}

function NavGroup({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()
  const { can } = useSession()
  const active = activeItem(pathname)
  return (
    <SidebarGroup className="py-1">
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.filter((item) => !item.needs || item.needs.some(can)).map(({ to, label, icon: Icon }) => (
            <SidebarMenuItem key={to}>
              <SidebarMenuButton
                isActive={active === to}
                tooltip={label}
                className="h-8 gap-2.5 px-2.5 text-sm text-sidebar-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground data-active:[&_svg]:text-foreground"
                render={<Link to={to} />}
              >
                <Icon strokeWidth={1.75} />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { user, branchLabel } = useSession()
  const { showDashboard, homeFor } = useSettings()

  return (
    <Sidebar collapsible="icon" className="no-print">
      <SidebarHeader className="px-3 pt-3 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-11 gap-2.5 px-1.5" render={<Link to={homeFor(user)} />}>
              <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-sidebar-primary text-[11px] font-semibold tracking-tight text-sidebar-primary-foreground">
                CF
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium text-foreground">Cash Flow Lending</span>
                <span className="truncate text-xs text-muted-foreground">{branchLabel}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {showDashboard && <NavGroup items={overview} />}
        <NavGroup items={menu} />
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4 group-data-[collapsible=icon]:hidden">
        <p className="text-xs leading-relaxed text-muted-foreground">Sample data for preview only.</p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
