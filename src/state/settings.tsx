import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/data/types'
import { START_PAGE } from './permissions'

const STORAGE_KEY = 'cfl.settings'

/** Names printed at the foot of reports and vouchers, as on the legacy Print Reports screen. */
export type Signatories = {
  checkedBy: string
  checkedTitle: string
  notedBy: string
  notedTitle: string
}

export type AppSettings = {
  /** Show the Dashboard and land on it after signing in. Off by default. */
  showDashboard: boolean
  signatories: Signatories
}

const defaults: AppSettings = {
  showDashboard: false,
  signatories: { checkedBy: '', checkedTitle: 'Branch manager', notedBy: 'T. Naguit', notedTitle: 'President' },
}

function read(): AppSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return { ...defaults, ...saved, signatories: { ...defaults.signatories, ...saved.signatories } }
  } catch {
    return defaults
  }
}

type SettingsContextValue = AppSettings & {
  setShowDashboard: (on: boolean) => void
  setSignatories: (signatories: Signatories) => void
  /** Where a user lands after signing in, and when they open a screen that isn't theirs. */
  homeFor: (user: User) => string
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Settings for this device. They live in the browser, so each workstation keeps its own. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(read)
  function save(next: AppSettings) {
    setSettings(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage blocked: the setting lasts until the page reloads.
    }
  }
  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setShowDashboard: (on) => save({ ...settings, showDashboard: on }),
      setSignatories: (signatories) => save({ ...settings, signatories }),
      homeFor(user) {
        if (user.role !== 'collector' && settings.showDashboard) return '/home'
        return START_PAGE[user.role]
      },
    }),
    [settings],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const settings = useContext(SettingsContext)
  if (!settings) throw new Error('useSettings must be used inside SettingsProvider')
  return settings
}
