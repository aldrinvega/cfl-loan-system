// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CashReceipts } from '@/pages/CashReceipts'
import { EncodePayment } from '@/pages/EncodePayment'
import { DesktopLayout } from '@/components/layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from '@/state/session'
import { StoreProvider } from '@/state/store'
import { AuthProvider } from '@/state/auth'
import { SettingsProvider } from '@/state/settings'
import { Toaster } from '@/components/ui/sonner'

// jsdom has no matchMedia; the sidebar uses it to detect phones.
beforeAll(() => {
  window.matchMedia = (query: string) =>
    ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
})

function renderApp(path: string) {
  return render(
    <TooltipProvider>
    <StoreProvider>
      <SettingsProvider>
      <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<SessionProvider userId="msantos"><DesktopLayout /></SessionProvider>}>
            <Route path="payments/new" element={<EncodePayment />} />
            <Route path="reports/cash-receipts" element={<CashReceipts />} />
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

describe('cashiering → cash receipts', () => {
  it('computes the breakdown, checks the checks, posts, and reports it', async () => {
    const user = userEvent.setup()
    renderApp('/payments/new')
    expect(screen.getByText("Start by picking the collector's route.")).toBeTruthy()

    // 1. Route, 2. account.
    await user.click(screen.getByRole('button', { name: /03 · R\. Lacson/ }))
    await user.click(screen.getByText('Castillo, Nora'))
    const or = screen.getByLabelText('OR number') as HTMLInputElement
    expect(or.value).toBe('450112')
    expect(or.readOnly).toBe(true)

    // 3. Cash, with the safekeeping typed in from the collector's receipt.
    await user.type(screen.getByLabelText('Cash'), '1100')
    await user.tab()
    // Without safekeeping, the extra ₱100.00 goes toward the loan.
    expect(screen.getByText(/₱1,100.00 \+ ₱0.00 \+ ₱0.00 = ₱1,100.00/)).toBeTruthy()
    await user.type(screen.getByLabelText('Safekeeping'), '100')
    await user.tab()
    expect(
      screen.getByText(/Breakdown matches the total received: ₱1,000.00 \+ ₱0.00 \+ ₱100.00 = ₱1,100.00/),
    ).toBeTruthy()

    // Total due today plus the safekeeping typed in: ₱1,000.00 + ₱100.00 still matches.
    await user.click(screen.getByRole('button', { name: 'Compute total due today' }))
    expect(screen.getByText(/Breakdown matches the total received: ₱1,000.00 \+ ₱0.00 \+ ₱100.00/)).toBeTruthy()
    // Clear the safekeeping: due today is ₱1,000.00, which no longer matches the ₱1,100.00 cash.
    await user.clear(screen.getByLabelText('Safekeeping'))
    await user.tab()
    expect(screen.getByText(/Breakdown doesn't match the total received/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Post/ })).toHaveProperty('disabled', true)
    await user.click(screen.getByRole('button', { name: 'Total to cash' }))
    expect(screen.getByText(/₱1,000.00 \+ ₱0.00 \+ ₱0.00 = ₱1,000.00/)).toBeTruthy()

    // Add a ₱100 check for the safekeeping and go back to splitting what was received.
    await user.click(screen.getByRole('button', { name: 'Add check' }))
    await user.type(screen.getByLabelText('Check 1 amount'), '100')
    await user.type(screen.getByLabelText('Safekeeping'), '100')
    await user.click(screen.getByRole('button', { name: 'Compute breakdown of amount received' }))
    expect(screen.getByText(/₱1,000.00 \+ ₱0.00 \+ ₱100.00 = ₱1,100.00/)).toBeTruthy()

    // An incomplete check blocks posting.
    await user.keyboard('{Control>}s{/Control}')
    expect(await screen.findByText(/Enter the check number/)).toBeTruthy()
    await user.type(screen.getByLabelText('Check 1 number'), '0012345')
    await user.type(screen.getByLabelText('Check 1 bank'), 'BDO')
    await user.type(screen.getByLabelText('Check 1 branch'), 'San Fernando')
    await user.type(screen.getByLabelText('Check 1 date'), '10/22/2026')
    await user.keyboard('{Control>}s{/Control}')
    expect(await screen.findByText('OR 450112 posted')).toBeTruthy()

    // Cash Receipts picks it up and still balances.
    await user.click(screen.getByRole('link', { name: 'Cash Receipts Book' }))
    expect(await screen.findByText('Totals · 11 posted, 1 cancelled')).toBeTruthy()
    expect(
      screen.getByText(/Balanced: Cash received ₱9,470.00 = Loans Receivable ₱8,960.00 \+ Safekeeping ₱510.00/),
    ).toBeTruthy()

    // Cancel it: the number stays with zero amounts.
    const row = screen.getByText('450112').closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Cancel receipt 450112' }))
    await user.type(await screen.findByLabelText('Reason'), 'Encoded twice')
    await user.click(screen.getByRole('button', { name: 'Cancel receipt' }))
    expect(await screen.findByText('Totals · 10 posted, 2 cancelled')).toBeTruthy()
    expect(within(screen.getByText('450112').closest('tr')!).getByText('Cancelled')).toBeTruthy()
    expect(screen.getByText(/Balanced: Cash received ₱8,370.00/)).toBeTruthy()
  })
})
