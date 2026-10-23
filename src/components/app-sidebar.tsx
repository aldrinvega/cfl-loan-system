import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  BookOpen,
  ChevronsUpDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  PiggyBank,
  Printer,
  ReceiptText,
  SquareArrowOutUpRight,
  Sun,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { COMPANY_NAME } from '@/data/sample'
import { useAuth } from '@/state/auth'
import { useSettings } from '@/state/settings'
import type { Permission } from '@/state/permissions'
import { useSession } from '@/state/session'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const { pathname } = useLocation()
  const { can } = useSession()
  const active = activeItem(pathname)
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.filter((item) => !item.needs || item.needs.some(can)).map(({ to, label, icon: Icon }) => (
            <SidebarMenuItem key={to}>
              <SidebarMenuButton isActive={active === to} tooltip={label} render={<Link to={to} />}>
                <Icon />
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
  const { user, branchLabel, roleLabel } = useSession()
  const { signOut } = useAuth()
  const { showDashboard, homeFor } = useSettings()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Sidebar collapsible="icon" className="no-print">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to={homeFor(user)} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">
                CFL
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{COMPANY_NAME}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{branchLabel}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {showDashboard && <NavGroup label="Overview" items={overview} />}
        <NavGroup label="Menu" items={menu} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent" />}
              >
                <Avatar className="rounded-lg">
                  <AvatarFallback className="rounded-lg">{user.initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{roleLabel}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="font-medium text-foreground">
                      {user.firstName} {user.name.split(' ').at(-1)}
                    </div>
                    <div className="text-xs font-normal">
                      @{user.username} · {roleLabel}, {branchLabel}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
                  {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
                  {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    signOut()
                    navigate('/login', { replace: true })
                  }}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
