import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { Client } from '@/data/types'
import { formatPeso } from '@/lib/money'
import { useSession } from '@/state/session'
import { clientName, useStore } from '@/state/store'

/** Find a client by name, client ID or loan no. Only clients the user may see are listed. */
export function ClientSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (client: Client) => void
}) {
  const { clients, loans } = useStore()
  const { canSeeClient } = useSession()

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Find client"
      description="Search by name, client ID or loan no."
      className="sm:max-w-xl"
    >
      <Command>
        <CommandInput placeholder="Name, client ID or loan no." />
        <CommandList>
          <CommandEmpty>No client matches.</CommandEmpty>
          <CommandGroup heading="Clients">
            {clients.filter(canSeeClient).map((client) => {
              const clientLoans = loans.filter((l) => l.clientId === client.id)
              return (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  keywords={[clientName(client), client.firstName, ...clientLoans.map((l) => l.id)]}
                  onSelect={() => {
                    onSelect(client)
                    onOpenChange(false)
                  }}
                >
                  <span>
                    {clientName(client)}
                    <span className="text-muted-foreground"> · {client.id}</span>
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {clientLoans.map((l) => `${l.id} · ${formatPeso(l.installment)}`).join(', ')}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
