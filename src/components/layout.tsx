import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { FilePlus2, LogOut, Moon, ReceiptText, Search, Sun } from 'lucide-react'
import { formatWeekdayShortYear } from '@/lib/dates'
import { useAuth } from '@/state/auth'
import { useSession } from '@/state/session'
import { AppSidebar } from '@/components/app-sidebar'
import { ButtonLink } from '@/components/button-link'
import { ClientSearchDialog } from '@/components/client-search'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

const SearchContext = createContext<() => void>(() => {})

function AccountMenu() {
  const { user, branchLabel, roleLabel } = useSession()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" aria-label={`Account: ${user.name}`} />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-foreground">{user.initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
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
  )
}

/** The role's most frequent job, one click away from every screen (Mercury's "Move Money"). */
function PrimaryJob() {
  const { can } = useSession()
  const { pathname } = useLocation()
  if (can('encodePayments') && !pathname.startsWith('/payments') && pathname !== '/home')
    return (
      <ButtonLink variant="outline" className="max-sm:size-10 max-sm:px-0" to="/payments/new">
        <ReceiptText data-icon="inline-start" />
        <span className="max-sm:sr-only">Encode payment</span>
      </ButtonLink>
    )
  if (can('fileLoans') && pathname !== '/loans/new')
    return (
      <ButtonLink variant="outline" className="max-sm:size-10 max-sm:px-0" to="/loans/new">
        <FilePlus2 data-icon="inline-start" />
        <span className="max-sm:sr-only">New loan</span>
      </ButtonLink>
    )
  return null
}

function SiteHeader() {
  const { user } = useSession()
  const openSearch = useContext(SearchContext)
  return (
    <header className="no-print sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 bg-background px-4 md:px-8">
      <SidebarTrigger className="-ml-1 text-muted-foreground md:hidden" />
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search clients, loans, IDs"
        className="flex h-10 w-10 flex-none items-center justify-center gap-2.5 rounded-md border min-w-0 sm:w-full sm:max-w-md sm:flex-1 sm:justify-start bg-background px-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden truncate sm:inline">Search clients, loans, IDs</span>
        <KbdGroup className="ml-auto hidden sm:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden items-center gap-2 text-sm whitespace-nowrap text-muted-foreground lg:flex">
          {user.branchId === null ? (
            'All branches'
          ) : (
            <>
              <span aria-hidden className="size-1.5 rounded-full bg-positive" />
              Day open
            </>
          )}
          <span aria-hidden>·</span>
          {formatWeekdayShortYear(user.businessDate)}
        </span>
        <PrimaryJob />
        <AccountMenu />
      </div>
    </header>
  )
}

/** Top bar plus the page body used by every desktop screen. `crumbs` names the page for the tab title. */
export function Page({ crumbs, children }: { crumbs: string[]; children: ReactNode }) {
  const title = crumbs.at(-1)
  useEffect(() => {
    document.title = title ? `${title} · Cash Flow Lending` : 'Cash Flow Lending'
  }, [title])
  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-[1360px] min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-10 md:px-8 print:p-0 [&>*]:min-w-0">
        {children}
      </div>
    </>
  )
}

export function DesktopLayout() {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  // Ctrl+K searches clients from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SearchContext.Provider value={() => setSearchOpen(true)}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
        <ClientSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelect={(client) => navigate(`/clients/${client.id}`)}
        />
      </SidebarProvider>
    </SearchContext.Provider>
  )
}
