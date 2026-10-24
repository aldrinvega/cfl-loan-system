// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Guard } from '@/components/access'
import { DesktopLayout } from '@/components/layout'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { EncodePayment } from '@/pages/EncodePayment'
import { LoanList } from '@/pages/loans/LoanList'
import { NewLoan } from '@/pages/loans/NewLoan'
import { NewVoucher } from '@/pages/disbursements/NewVoucher'
import { VoucherList } from '@/pages/disbursements/VoucherList'
import { AuthProvider } from '@/state/auth'
import { SessionProvider } from '@/state/session'
import { SettingsProvider } from '@/state/settings'
import { StoreProvider } from '@/state/store'

afterEach(cleanup)

beforeAll(() => {
  window.matchMedia = (query: string) =>
    ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
  // jsdom lacks these; the account search popover uses them.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  Element.prototype.scrollIntoView ??= () => {}
})

/** The office screens as `userId` sees them, with the same permission guards as the app. */
function app(path: string, userId: string) {
  return (
    <TooltipProvider>
      <StoreProvider>
        <SettingsProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route element={<SessionProvider userId={userId}><DesktopLayout /></SessionProvider>}>
                  <Route path="loans" element={<Guard permission="viewLoans" name="Loans"><LoanList /></Guard>} />
                  <Route path="loans/new" element={<Guard permission="fileLoans" name="New loan"><NewLoan /></Guard>} />
                  <Route
                    path="disbursements"
                    element={<Guard permission="viewCashReports" name="Disbursements"><VoucherList /></Guard>}
                  />
                  <Route
                    path="disbursements/new"
                    element={<Guard permission="encodeVouchers" name="New voucher"><NewVoucher /></Guard>}
                  />
                  <Route
                    path="payments/new"
                    element={<Guard permission="encodePayments" name="Encode Payments"><EncodePayment /></Guard>}
                  />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </SettingsProvider>
        <Toaster />
      </StoreProvider>
    </TooltipProvider>
  )
}

/** Renders as one user; `switchTo` swaps the signed-in user and keeps the data and the page. */
function renderApp(path: string, userId: string) {
  const result = render(app(path, userId))
  return { switchTo: (next: string) => result.rerender(app(path, next)) }
}

const rowOf = (text: string) => screen.getByText(text).closest('tr')!

/** Matches an amount shown with raised centavos, whose digits are split across two spans. */
const money = (text: string) => (_: string, el: Element | null) =>
  !!el?.classList.contains('money') && el.textContent === text

describe('loans: apply → approve → release', () => {
  it('checks the terms before filing', async () => {
    const user = userEvent.setup()
    renderApp('/loans/new?client=CL-00418', 'acruz')
    await user.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(screen.getByText('Enter ₱1,000.00 to ₱500,000.00.')).toBeTruthy()
    await user.clear(screen.getByLabelText('Term (installments)'))
    await user.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(screen.getByText('Enter 1 to 120 installments.')).toBeTruthy()
  })

  it('loan officer files and approves, accounting officer releases with a voucher', async () => {
    const user = userEvent.setup()
    const { switchTo } = renderApp('/loans/new?client=CL-00418', 'acruz')

    // ₱6,000.00 weekly for 12 weeks at 20% flat: ₱7,200.00 in 12 installments of ₱600.00.
    await user.type(screen.getByLabelText('Principal'), '6000')
    await user.tab()
    expect(screen.getByText('₱1,200.00')).toBeTruthy()
    expect(screen.getByText('₱600.00')).toBeTruthy()
    expect(screen.getByText(/12 weekly installments, last due 01\/14\/2027/)).toBeTruthy()
    // Net proceeds after the 3% service fee and 1% insurance.
    expect(screen.getByText('₱5,760.00')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(await screen.findByText('LN-2026-0483 filed for approval')).toBeTruthy()

    // The list: for approval, then approved, then released with a voucher.
    expect(within(rowOf('LN-2026-0483')).getByText('For approval')).toBeTruthy()
    await user.click(within(rowOf('LN-2026-0483')).getByRole('button', { name: 'Approve' }))
    expect(within(rowOf('LN-2026-0483')).getByText('Approved')).toBeTruthy()
    // Releasing is an accounting officer's job, not the loan officer's.
    expect(within(rowOf('LN-2026-0483')).queryByRole('button', { name: 'Release' })).toBeNull()

    switchTo('msantos')
    await user.click(within(rowOf('LN-2026-0483')).getByRole('button', { name: 'Release' }))
    expect(await screen.findByText('Release LN-2026-0483?')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Release and create voucher' }))
    expect(await screen.findByText('DV-2224 created')).toBeTruthy()
    expect(within(rowOf('LN-2026-0483')).getByText('Released')).toBeTruthy()
    expect(within(rowOf('LN-2026-0483')).getByText('DV-2224')).toBeTruthy()

    // The voucher is on the Disbursements screen: net proceeds paid out, journal behind it.
    await user.click(screen.getByRole('link', { name: 'Disbursements' }))
    const voucher = (await screen.findByText('DV-2224')).closest('tr')!
    expect(within(voucher).getByText('Castillo, Nora')).toBeTruthy()
    expect(within(voucher).getByText(money('5,760.00'))).toBeTruthy()
    await user.click(voucher)
    const lines = await screen.findByRole('dialog')
    // Loans Receivable at the full amount to repay: ₱6,000.00 + ₱1,200.00 interest.
    expect(within(lines).getByText('Loans Receivable')).toBeTruthy()
    expect(within(lines).getAllByText(money('7,200.00')).length).toBeGreaterThan(0)
    expect(within(lines).getByText('Debits equal credits.')).toBeTruthy()
    await user.keyboard('{Escape}')

    // The released loan now takes payments; an application still waiting does not.
    await user.click(screen.getByRole('link', { name: 'Encode Payments' }))
    await user.click(screen.getByRole('button', { name: /03 · R\. Lacson/ }))
    expect(screen.getByText('LN-2026-0483')).toBeTruthy()
    expect(screen.queryByText('LN-2026-0481')).toBeNull()
  })
})

describe('role limits', () => {
  it('keeps a loan officer out of Encode Payments and away from releases', async () => {
    renderApp('/payments/new', 'acruz')
    expect(screen.getByText('No access to Encode Payments')).toBeTruthy()
    const menu = within(document.querySelector<HTMLElement>('[data-slot="sidebar-content"]')!)
    expect(menu.queryByRole('link', { name: 'Encode Payments' })).toBeNull()
    expect(menu.queryByRole('link', { name: 'Cash Receipts Book' })).toBeNull()
    expect(menu.getByRole('link', { name: 'Loans' })).toBeTruthy()
    await userEvent.setup().click(screen.getByRole('link', { name: 'Loans' }))
    expect(screen.getByRole('link', { name: /New loan/ })).toBeTruthy()
    expect(within(rowOf('LN-2026-0481')).getByRole('button', { name: 'Approve' })).toBeTruthy()
    expect(within(rowOf('LN-2026-0482')).queryByRole('button', { name: 'Release' })).toBeNull()
  })

  it("keeps an accounting officer from filing or approving loans", async () => {
    renderApp('/loans', 'msantos')
    expect(screen.queryByRole('link', { name: /New loan/ })).toBeNull()
    expect(within(rowOf('LN-2026-0481')).queryByRole('button', { name: 'Approve' })).toBeNull()
    expect(within(rowOf('LN-2026-0482')).getByRole('button', { name: 'Release' })).toBeTruthy()
    cleanup()
    renderApp('/loans/new', 'msantos')
    expect(screen.getByText('No access to New loan')).toBeTruthy()
  })
})

describe('disbursements: expense vouchers', () => {
  it('saves a balanced voucher with an account from the chart, then deletes it', async () => {
    const user = userEvent.setup()
    renderApp('/disbursements/new', 'msantos')

    // Nothing balances yet, so it won't save.
    await user.click(screen.getByRole('button', { name: 'Save voucher' }))
    expect(screen.getByText('Enter who the check is for.')).toBeTruthy()

    await user.type(screen.getByLabelText('Payee'), 'Dizon Realty')
    await user.click(screen.getByRole('button', { name: 'Line 1 account' }))
    await user.type(await screen.findByPlaceholderText('Search title or code'), 'rent')
    await user.click(await screen.findByText('Rent Expense'))
    await user.type(screen.getByLabelText('Line 1 debit'), '18000')
    await user.tab()
    // The check side: credit China Bank with the difference.
    await user.click(screen.getByRole('button', { name: 'Balance with China Bank' }))
    expect(screen.getByRole('button', { name: 'Line 1 account' }).textContent).toContain('Rent Expense')
    expect(screen.getByRole('button', { name: 'Line 2 account' }).textContent).toContain('Cash in Bank - China Bank')
    await user.click(screen.getByRole('button', { name: 'Save voucher' }))
    expect(await screen.findByText('DV-2224 saved')).toBeTruthy()

    // It opens on the list with its journal entry.
    const panel = await screen.findByRole('dialog')
    expect(within(panel).getByText('Rent Expense')).toBeTruthy()
    expect(within(panel).getByText('Debits equal credits.')).toBeTruthy()
    await user.click(within(panel).getByRole('button', { name: 'Delete voucher' }))
    const confirm = await screen.findByText('Delete DV-2224?')
    await user.click(within(confirm.closest('[role="dialog"]') as HTMLElement).getByRole('button', { name: 'Delete voucher' }))
    expect(await screen.findByText('DV-2224 deleted')).toBeTruthy()
  })

  it('keeps a loan officer from encoding vouchers', () => {
    renderApp('/disbursements/new', 'acruz')
    expect(screen.getByText('No access to New voucher')).toBeTruthy()
  })
})
