import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { users } from '@/data/sample'
import type { User } from '@/data/types'
import { SessionProvider } from './session'
import { useSettings } from './settings'

// Sample sign-in only. A real system checks passwords on the server and keeps a session token,
// never the password, in the browser.

const STORAGE_KEY = 'cfl.signedInUser'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

type SignInResult = { ok: true; user: User } | { ok: false; error: string }

type Auth = {
  user: User | null
  signIn: (username: string, password: string, remember: boolean) => SignInResult
  signOut: () => void
  /** Time the lockout ends, while too many wrong passwords have been tried. */
  lockedUntil: number | null
}

const AuthContext = createContext<Auth | null>(null)

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function store(userId: string | null, remember = false) {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    if (userId) (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, userId)
  } catch {
    // Storage can be blocked; the sign-in then lasts until the page reloads.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(readStored)
  const [failures, setFailures] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  const value = useMemo<Auth>(() => {
    const locked = lockedUntil !== null && Date.now() < lockedUntil
    return {
      user: users.find((u) => u.id === userId) ?? null,
      lockedUntil: locked ? lockedUntil : null,
      signIn(username, password, remember) {
        if (locked) return { ok: false, error: 'Too many tries. Wait 30 seconds, then try again.' }
        const user = users.find((u) => u.username === username.trim().toLowerCase())
        if (!user || user.password !== password) {
          const next = failures + 1
          if (next >= MAX_ATTEMPTS) {
            setFailures(0)
            setLockedUntil(Date.now() + LOCKOUT_MS)
            return { ok: false, error: 'Too many tries. Wait 30 seconds, then try again.' }
          }
          setFailures(next)
          const left = MAX_ATTEMPTS - next
          return {
            ok: false,
            error: `Wrong username or password. ${left} ${left === 1 ? 'try' : 'tries'} left before a short lockout.`,
          }
        }
        setFailures(0)
        setLockedUntil(null)
        setUserId(user.id)
        store(user.id, remember)
        return { ok: true, user }
      },
      signOut() {
        setUserId(null)
        store(null)
      },
    }
  }, [userId, failures, lockedUntil])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside AuthProvider')
  return auth
}

/**
 * Lets a screen through only for a signed-in user of the right kind. Anyone else goes to the
 * sign-in page (and comes back here after), or to their own home screen.
 */
export function RequireAuth({ area, children }: { area: 'office' | 'collector'; children: ReactNode }) {
  const { user } = useAuth()
  const { homeFor } = useSettings()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if ((user.role === 'collector') !== (area === 'collector')) return <Navigate to={homeFor(user)} replace />
  return <SessionProvider userId={user.id}>{children}</SessionProvider>
}
