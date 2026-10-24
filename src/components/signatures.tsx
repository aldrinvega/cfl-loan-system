import { useSession } from '@/state/session'
import { useSettings } from '@/state/settings'

/**
 * The legacy reports' sign-off: Prepared by (whoever is signed in), Checked by and
 * Noted/Approved by, with designations. The names are set once under Print Reports.
 */
export function Signatures({ received = false }: { received?: boolean }) {
  const { user, roleLabel } = useSession()
  const { signatories } = useSettings()
  const blocks = [
    { label: 'Prepared by', name: user.name, title: roleLabel },
    { label: 'Checked by', name: signatories.checkedBy, title: signatories.checkedTitle },
    { label: 'Noted / Approved by', name: signatories.notedBy, title: signatories.notedTitle },
    ...(received ? [{ label: 'Received by', name: '', title: 'Signature over printed name' }] : []),
  ]
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-8 text-sm sm:grid-cols-3 print:grid-cols-4">
      {blocks.map((b) => (
        <div key={b.label} className="flex min-w-0 flex-col gap-6">
          <span className="text-muted-foreground">{b.label}</span>
          <div className="flex flex-col border-t pt-2">
            <span className="min-h-5 font-medium">{b.name}</span>
            <span className="text-xs text-muted-foreground">{b.title}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
