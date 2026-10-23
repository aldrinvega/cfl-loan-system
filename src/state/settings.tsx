import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/data/types'
import { START_PAGE } from './permissions'

const STORAGE_KEY = 'cfl.settings'

export type AppSettings = {
  /** Show the Dashboard and land on it after signing in. Off by default. */
  showDashboard: boolean
}

const defaults: AppSettings = { showDashboard: false }

function read(): AppSettings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return defaults
  }
}

type SettingsContextValue = AppSettings & {
  setShowDashboard: (on: boolean) => void
  /** Where a user lands after signing in, and when they open a screen that isn't theirs. */
  homeFor: (user: User) => string
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Settings for this device. They live in the browser, so each workstation keeps its own. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(read)
  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setShowDashboard(on) {
        const next = { ...settings, showDashboard: on }
        setSettings(next)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // Storage blocked: the setting lasts until the page reloads.
        }
      },
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
