import { formatPeso } from '@/lib/money'
import { Page } from '@/components/layout'
import { PageHeader, SampleNote } from '@/components/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { collectorLabel, useSession } from '@/state/session'
import { clientInitials, clientName, useStore } from '@/state/store'
import { ButtonLink } from '@/components/button-link'

export function Clients() {
  const { clients, loans } = useStore()
  const { canSeeClient } = useSession()
  const visible = clients.filter(canSeeClient).sort((a, b) => clientName(a).localeCompare(clientName(b)))

  return (
    <Page crumbs={['Clients']}>
      <PageHeader
        title="Clients"
        description="Everyone on the books in the branches you can see."
        actions={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup> to search
          </span>
        }
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Client ID</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Loans</TableHead>
                <TableHead className="text-right">Installment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((client) => {
                const clientLoans = loans.filter((l) => l.clientId === client.id)
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <ButtonLink variant="link" className="h-auto px-0" to={`/clients/${client.id}`}>
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px]">{clientInitials(client)}</AvatarFallback>
                        </Avatar>
                        {clientName(client)}
                      </ButtonLink>
                    </TableCell>
                    <TableCell>{client.id}</TableCell>
                    <TableCell>{collectorLabel(client.collectorId)}</TableCell>
                    <TableCell>{clientLoans.map((l) => l.id).join(', ')}</TableCell>
                    <TableCell className="text-right">
                      {clientLoans.map((l) => formatPeso(l.installment)).join(', ')}
                    </TableCell>
                  </TableRow>
                )
              })}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    No clients in your branch yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SampleNote />
    </Page>
  )
}
