import { BookCopy, ChevronRight, KeyRound, Lock, Settings, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Page } from '@/components/layout'
import { PageHeader } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import type { Permission } from '@/state/permissions'
import { useSession } from '@/state/session'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'

type Utility = { title: string; description: string; icon: LucideIcon; to?: string; needs?: Permission }

const utilities: Utility[] = [
  { title: 'Day close', description: 'Close the business day after the last collector remits.', icon: Lock, to: '/day-close', needs: 'dayClose' },
  { title: 'Settings', description: 'Branch details, penalty rates and receipt printing.', icon: Settings, to: '/settings', needs: 'settings' },
  { title: 'Receipt booklets', description: "Issue OR booklets to collectors and track what's left.", icon: BookCopy },
  { title: 'Users and passwords', description: 'Add staff accounts and reset passwords.', icon: KeyRound },
]

/** Housekeeping tools, as on the legacy system's Utilities menu. */
export function Utilities() {
  const { can } = useSession()
  return (
    <Page crumbs={['Utilities']}>
      <PageHeader title="Utilities" description="Housekeeping for the branch." />
      <ItemGroup className="grid gap-3 md:grid-cols-2">
        {utilities.filter((u) => !u.needs || can(u.needs)).map(({ title, description, icon: Icon, to }) => {
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
