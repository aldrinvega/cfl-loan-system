import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { branches, collectors, users } from '@/data/sample'
import type { Client, User } from '@/data/types'
import { can, ROLE_LABELS, type Permission } from './permissions'

type Session = {
  user: User
  /** Branch name for the sidebar, or "All branches" for users who see every branch. */
  branchLabel: string
  roleLabel: string
  /** Branch and collector scoping: each branch sees its own data, a collector only their clients. */
  canSeeClient: (client: Pick<Client, 'branchId' | 'collectorId'>) => boolean
  canSeeBranch: (branchId: string) => boolean
  /** What this user's role is allowed to open or do. */
  can: (permission: Permission) => boolean
}

const SessionContext = createContext<Session | null>(null)

/** The signed-in user and what they may see. */
export function SessionProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const value = useMemo<Session>(() => {
    const user = users.find((u) => u.id === userId) ?? users[0]
    const canSeeBranch = (branchId: string) => user.branchId === null || user.branchId === branchId
    return {
      user,
      branchLabel: branches.find((b) => b.id === user.branchId)?.name ?? 'All branches',
      roleLabel: ROLE_LABELS[user.role],
      can: (permission) => can(user, permission),
      canSeeBranch,
      canSeeClient: (client) =>
        canSeeBranch(client.branchId) &&
        (user.collectorId === undefined || user.collectorId === client.collectorId),
    }
  }, [userId])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}

export function collectorLabel(collectorId: string): string {
  const collector = collectors.find((c) => c.id === collectorId)
  return collector ? `${collector.id} · ${collector.name}` : collectorId
}
