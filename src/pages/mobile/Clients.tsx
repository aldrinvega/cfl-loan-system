import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { formatPeso } from '@/lib/money'
import { MobileScreen } from '@/components/mobile-layout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { useSession } from '@/state/session'
import { clientInitials, clientName, useStore } from '@/state/store'

export function MobileClients() {
  return (
    <MobileScreen title="My clients">
      <ClientList linkTo={(id) => `/m/clients/${id}`} />
    </MobileScreen>
  )
}

/** Searchable list of the collector's own clients. */
export function ClientList({ linkTo }: { linkTo: (clientId: string) => string }) {
  const { clients, loans } = useStore()
  const { canSeeClient } = useSession()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = clients.filter(canSeeClient).filter((c) => {
    if (!q) return true
    const loanIds = loans.filter((l) => l.clientId === c.id).map((l) => l.id.toLowerCase())
    return clientName(c).toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || loanIds.some((id) => id.includes(q))
  })

  return (
    <>
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search clients"
          placeholder="Name, client ID or loan no."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>
      <ItemGroup className="gap-2">
        {visible.map((client) => {
          const loan = loans.find((l) => l.clientId === client.id)
          return (
            <Item key={client.id} variant="outline" render={<Link to={linkTo(client.id)} />}>
              <ItemMedia>
                <Avatar>
                  <AvatarFallback>{clientInitials(client)}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{clientName(client)}</ItemTitle>
                <ItemDescription>
                  {client.id}
                  {loan && ` · ${loan.id}`}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                {loan && <span className="text-sm font-medium">{formatPeso(loan.installment)}</span>}
                <ChevronRight className="size-4 text-muted-foreground" />
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>
      {visible.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No match</EmptyTitle>
            <EmptyDescription>No client on your route matches “{query}”.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  )
}
