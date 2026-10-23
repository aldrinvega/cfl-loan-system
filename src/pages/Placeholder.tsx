import { useNavigate } from 'react-router-dom'
import { Construction, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Page } from '@/components/layout'
import { MobileScreen } from '@/components/mobile-layout'
import { PageHeader } from '@/components/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { useAuth } from '@/state/auth'
import { useSession } from '@/state/session'
import { ButtonLink } from '@/components/button-link'

/** Stand-in for desktop sections the mockups don't cover yet. */
export function Placeholder({ crumbs }: { crumbs: string[] }) {
  const title = crumbs.at(-1) ?? ''
  return (
    <Page crumbs={crumbs}>
      <PageHeader title={title} description="Not designed yet." />
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Construction />
          </EmptyMedia>
          <EmptyTitle>This screen isn't designed yet</EmptyTitle>
          <EmptyDescription>The mockups cover payments, client profiles and two reports.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <ButtonLink to="/payments/new">
            Encode payment
          </ButtonLink>
          <ButtonLink variant="outline" to="/reports/cash-receipts">
            Cash Receipts
          </ButtonLink>
        </EmptyContent>
      </Empty>
    </Page>
  )
}

export function MobileMore() {
  const { user, roleLabel } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const dark = resolvedTheme === 'dark'
  return (
    <MobileScreen title="More">
      <Card>
        <CardContent>
          <ItemGroup>
            <Item className="px-0">
              <ItemMedia>
                <Avatar>
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{user.name}</ItemTitle>
                <ItemDescription>
                  {roleLabel} {user.collectorId}
                </ItemDescription>
              </ItemContent>
            </Item>
            <Item className="px-0">
              <ItemMedia variant="icon">{dark ? <Sun /> : <Moon />}</ItemMedia>
              <ItemContent>
                <ItemTitle>{dark ? 'Light mode' : 'Dark mode'}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm" onClick={() => setTheme(dark ? 'light' : 'dark')}>
                  Switch
                </Button>
              </ItemActions>
            </Item>
            <Item className="px-0">
              <ItemMedia variant="icon">
                <LogOut />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Sign out</ItemTitle>
                <ItemDescription>Do this before handing the phone to someone else.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    signOut()
                    navigate('/login', { replace: true })
                  }}
                >
                  Sign out
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
        </CardContent>
      </Card>
    </MobileScreen>
  )
}
