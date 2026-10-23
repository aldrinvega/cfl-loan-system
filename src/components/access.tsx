import type { ReactNode } from 'react'
import { ShieldOff } from 'lucide-react'
import { Page } from '@/components/layout'
import { ButtonLink } from '@/components/button-link'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { Permission } from '@/state/permissions'
import { useSession } from '@/state/session'
import { useSettings } from '@/state/settings'

/** Shows the screen only to roles with the permission; everyone else gets a plain "no access" page. */
export function Guard({ permission, name, children }: { permission: Permission; name: string; children: ReactNode }) {
  const { user, roleLabel, can } = useSession()
  const { homeFor } = useSettings()
  if (can(permission)) return <>{children}</>
  return (
    <Page crumbs={[name]}>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldOff />
          </EmptyMedia>
          <EmptyTitle>No access to {name}</EmptyTitle>
          <EmptyDescription>
            {name} isn't part of the {roleLabel} role. Ask your branch manager if you need it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <ButtonLink to={homeFor(user)}>Go to my start page</ButtonLink>
        </EmptyContent>
      </Empty>
    </Page>
  )
}
