import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { formatWeekdayLong } from '@/lib/dates'
import { useSession } from '@/state/session'
import { AppSidebar } from '@/components/app-sidebar'
import { ClientSearchDialog } from '@/components/client-search'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

function SiteHeader({ crumbs }: { crumbs: string[] }) {
  const { user } = useSession()
  return (
    <header className="no-print flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? <BreadcrumbPage>{crumb}</BreadcrumbPage> : crumb}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {formatWeekdayLong(user.businessDate)}
        </span>
        {user.branchId === null ? (
          <Badge variant="secondary">Viewing all branches</Badge>
        ) : (
          <Badge variant="outline">
            <span aria-hidden className="size-1.5 rounded-full bg-positive" />
            Day open
          </Badge>
        )}
      </div>
    </header>
  )
}

/** Header plus padded page body used by every desktop screen. */
export function Page({ crumbs, children }: { crumbs: string[]; children: ReactNode }) {
  return (
    <>
      <SiteHeader crumbs={crumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">{children}</div>
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
  )
}
