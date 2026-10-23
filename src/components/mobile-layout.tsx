import type { ReactNode } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, Ellipsis, Menu, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from '@/state/session'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/button-link'

const tabs: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/m/today', label: 'Today', icon: CalendarDays },
  { to: '/m/clients', label: 'Clients', icon: Users },
  { to: '/m/more', label: 'More', icon: Ellipsis },
]

/** Read-only phone layout for collectors: header, scrolling body, bottom tab bar. */
export function MobileLayout() {
  const { pathname } = useLocation()
  return (
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden border-x bg-background">
      <Outlet />
      <nav aria-label="Main menu" className="no-print grid h-16 shrink-0 grid-cols-3 border-t bg-background">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground',
                active && 'font-medium text-foreground',
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function MobileScreen({
  title,
  back,
  children,
}: {
  title: string
  /** Shows a back arrow instead of the menu button. */
  back?: boolean
  children: ReactNode
}) {
  const { user } = useSession()
  const navigate = useNavigate()

  return (
    <>
      <header className="no-print flex h-14 shrink-0 items-center gap-2 border-b px-2">
        {back ? (
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate(-1)}>
            <ChevronLeft />
          </Button>
        ) : (
          <ButtonLink variant="ghost" size="icon" aria-label="Open menu" to="/m/more">
            <Menu />
          </ButtonLink>
        )}
        <h1 className="flex-1 text-base font-semibold">{title}</h1>
        <Avatar aria-label={`Signed in as ${user.name}`} className="mr-2">
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 *:shrink-0">{children}</div>
    </>
  )
}
