// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DesktopLayout } from '@/components/layout'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { EncodePayment } from '@/pages/EncodePayment'
import { AuthProvider } from '@/state/auth'
import { SessionProvider } from '@/state/session'
import { SettingsProvider } from '@/state/settings'
import { StoreProvider } from '@/state/store'

afterEach(cleanup)

beforeAll(() => {
  window.matchMedia = (query: string) =>
    ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
})

function renderPayments() {
  return render(
    <TooltipProvider>
      <StoreProvider>
        <SettingsProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={['/payments/new']}>
              <Routes>
                <Route element={<SessionProvider userId="msantos"><DesktopLayout /></SessionProvider>}>
                  <Route path="payments/new" element={<EncodePayment />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </SettingsProvider>
        <Toaster />
      </StoreProvider>
    </TooltipProvider>,
  )
}

const focused = () => document.activeElement as HTMLElement

describe('Encode Payments with the keyboard only', () => {
  it('route by number, account by name, cash, post, and back for the next receipt', async () => {
    const user = userEvent.setup()
    renderPayments()

    // The cursor starts on the route; "3" finds collector 03.
    expect(focused()).toBe(screen.getByLabelText('Search collectors'))
    await user.keyboard('3{Enter}')
    expect(focused()).toBe(screen.getByLabelText('Search accounts'))

    // Arrows move the highlight; typing narrows it; Enter picks and lands in Cash.
    await user.keyboard('castillo{Enter}')
    expect(screen.getByText('3. Payment · LN-2026-0381 · Castillo, Nora')).toBeTruthy()
    expect(focused()).toBe(screen.getByLabelText('Cash'))
    await user.keyboard('1000')

    // The legacy Alt letters run the breakdown buttons.
    await user.keyboard('{Alt>}f{/Alt}')
    expect(screen.getByRole('button', { name: /Full payment with rebate/ }).getAttribute('aria-pressed')).toBe('true')
    await user.keyboard('{F7}')
    expect(screen.getByRole('button', { name: 'Compute total due today' }).getAttribute('aria-pressed')).toBe('true')
    await user.keyboard('{Alt>}e{/Alt}')
    expect(
      screen.getByRole('button', { name: 'Compute breakdown of amount received' }).getAttribute('aria-pressed'),
    ).toBe('true')

    // Alt+P posts after the confirmation; Enter confirms.
    await user.keyboard('{Alt>}p{/Alt}')
    expect(await screen.findByText('Post OR 450112?')).toBeTruthy()
    await user.keyboard('{Enter}')
    expect(await screen.findByText('OR 450112 posted')).toBeTruthy()

    // Ready for the next receipt on the same route, then Esc steps back to the route.
    expect(focused()).toBe(screen.getByLabelText('Search accounts'))
    await user.keyboard('{Escape}')
    expect(focused()).toBe(screen.getByLabelText('Search collectors'))
  })

  it('arrows move the highlight through the route and Esc clears the search first', async () => {
    const user = userEvent.setup()
    renderPayments()
    await user.keyboard('3{Enter}')
    const search = screen.getByLabelText('Search accounts')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    const highlighted = search.getAttribute('aria-activedescendant')!
    expect(document.getElementById(highlighted)?.getAttribute('data-highlighted')).toBe('true')

    await user.keyboard('zzz')
    expect(screen.getByText('No account matches.')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect((search as HTMLInputElement).value).toBe('')
    expect(focused()).toBe(search)

    // Alt+A adds a check with the cursor in its amount; Esc from the payment steps back to the accounts.
    await user.keyboard('{Enter}')
    expect(focused()).toBe(screen.getByLabelText('Cash'))
    await user.keyboard('{Alt>}a{/Alt}')
    expect(focused()).toBe(screen.getByLabelText('Check 1 amount'))
    await user.keyboard('{Escape}')
    expect(focused()).toBe(search)
  })
})
