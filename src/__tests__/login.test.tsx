// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Login } from '@/pages/Login'
import { AuthProvider, RequireAuth } from '@/state/auth'
import { SettingsProvider } from '@/state/settings'
import { useSession } from '@/state/session'
import { TooltipProvider } from '@/components/ui/tooltip'

beforeAll(() => {
  window.matchMedia = (query: string) =>
    ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

function WhoAmI({ label }: { label: string }) {
  const { user } = useSession()
  return <p>{label} as {user.username}</p>
}

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <SettingsProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<RequireAuth area="office"><WhoAmI label="Dashboard" /></RequireAuth>} />
            <Route path="/payments/new" element={<RequireAuth area="office"><WhoAmI label="Encode Payments" /></RequireAuth>} />
            <Route path="/reports/daily-target" element={<RequireAuth area="office"><WhoAmI label="Daily target" /></RequireAuth>} />
            <Route path="/loans" element={<RequireAuth area="office"><WhoAmI label="Loans" /></RequireAuth>} />
            <Route path="/reports/aging" element={<RequireAuth area="office"><WhoAmI label="Aging" /></RequireAuth>} />
            <Route path="/m/today" element={<RequireAuth area="collector"><WhoAmI label="Phone" /></RequireAuth>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
      </SettingsProvider>
    </TooltipProvider>,
  )
}

async function signIn(username: string, password: string) {
  const user = userEvent.setup()
  await user.clear(screen.getByLabelText('Username'))
  await user.type(screen.getByLabelText('Username'), username)
  await user.clear(screen.getByLabelText('Password'))
  if (password) await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('sign in', () => {
  it('sends signed-out users to the sign-in page, then back where they were going', async () => {
    renderAt('/reports/aging')
    expect(screen.getByText('Welcome back')).toBeTruthy()
    await signIn('tnaguit', 'cashflow123')
    expect(await screen.findByText('Aging as tnaguit')).toBeTruthy()
  })

  it('lands each role on its own start page', async () => {
    renderAt('/login')
    await signIn('msantos', 'cashflow123')
    expect(await screen.findByText('Encode Payments as msantos')).toBeTruthy()
    cleanup()
    localStorage.clear()
    sessionStorage.clear()

    renderAt('/login')
    await signIn('acruz', 'cashflow123')
    expect(await screen.findByText('Loans as acruz')).toBeTruthy()
    cleanup()
    localStorage.clear()
    sessionStorage.clear()

    renderAt('/login')
    await signIn('tnaguit', 'cashflow123')
    expect(await screen.findByText('Daily target as tnaguit')).toBeTruthy()
    cleanup()
    localStorage.clear()
    sessionStorage.clear()

    renderAt('/login')
    await signIn('RLACSON', 'cashflow123')
    expect(await screen.findByText('Phone as rlacson')).toBeTruthy()
  })

  it('lands on the Dashboard only when the setting is on', async () => {
    localStorage.setItem('cfl.settings', JSON.stringify({ showDashboard: true }))
    renderAt('/login')
    await signIn('msantos', 'cashflow123')
    expect(await screen.findByText('Dashboard as msantos')).toBeTruthy()
  })

  it('keeps a collector out of the office screens', async () => {
    sessionStorage.setItem('cfl.signedInUser', 'rlacson')
    renderAt('/home')
    expect(await screen.findByText('Phone as rlacson')).toBeTruthy()
  })

  it('rejects a wrong password and locks out after five tries', async () => {
    renderAt('/login')
    await signIn('msantos', 'nope')
    expect(screen.getByRole('alert').textContent).toContain('4 tries left')
    for (let i = 0; i < 4; i++) await signIn('msantos', 'nope')
    expect(screen.getByRole('alert').textContent).toContain('Too many tries')
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveProperty('disabled', true)
  })

  it('asks for both fields', async () => {
    renderAt('/login')
    await signIn('msantos', '')
    expect(screen.getByRole('alert').textContent).toContain('Enter your username and password')
  })
})
