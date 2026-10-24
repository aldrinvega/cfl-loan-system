import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Guard } from '@/components/access'
import { DesktopLayout } from '@/components/layout'
import { MobileLayout } from '@/components/mobile-layout'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CashReceipts } from '@/pages/CashReceipts'
import { ClientProfile } from '@/pages/ClientProfile'
import { Clients } from '@/pages/Clients'
import { DailyTarget } from '@/pages/DailyTarget'
import { EncodePayment } from '@/pages/EncodePayment'
import { MobileMore, Placeholder } from '@/pages/Placeholder'
import { Aging } from '@/pages/reports/Aging'
import { Collections } from '@/pages/reports/Collections'
import { Disbursements } from '@/pages/reports/Disbursements'
import { LoanLedger } from '@/pages/reports/LoanLedger'
import { MoreReports } from '@/pages/reports/MoreReports'
import { SafekeepingBalances } from '@/pages/reports/SafekeepingBalances'
import { MobileClients } from '@/pages/mobile/Clients'
import { MobileClient } from '@/pages/mobile/MobileClient'
import { Today } from '@/pages/mobile/Today'
import { LoanList } from '@/pages/loans/LoanList'
import { NewVoucher } from '@/pages/disbursements/NewVoucher'
import { VoucherList } from '@/pages/disbursements/VoucherList'
import { VoucherPrint } from '@/pages/disbursements/VoucherPrint'
import { NewLoan } from '@/pages/loans/NewLoan'
import { DashboardRoute, HomeRedirect, Settings } from '@/pages/Settings'
import { Login } from '@/pages/Login'
import { Utilities } from '@/pages/Utilities'
import { AuthProvider, RequireAuth } from '@/state/auth'
import { SettingsProvider } from '@/state/settings'
import { StoreProvider } from '@/state/store'

// Office staff sign in to the desktop screens; collectors to the read-only phone screens.
export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <StoreProvider>
      <SettingsProvider>
      <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route
            element={
              <RequireAuth area="office">
                <DesktopLayout />
              </RequireAuth>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route path="home" element={<DashboardRoute />} />
            <Route path="clients" element={<Guard permission="viewClients" name="Clients"><Clients /></Guard>} />
            <Route path="clients/:clientId" element={<Guard permission="viewClients" name="Clients"><ClientProfile /></Guard>} />
            <Route path="loans" element={<Guard permission="viewLoans" name="Loans"><LoanList /></Guard>} />
            <Route path="loans/new" element={<Guard permission="fileLoans" name="New loan"><NewLoan /></Guard>} />
            <Route path="payments" element={<Navigate to="/payments/new" replace />} />
            <Route path="payments/new" element={<Guard permission="encodePayments" name="Encode Payments"><EncodePayment /></Guard>} />
            <Route path="disbursements" element={<Guard permission="viewCashReports" name="Disbursements"><VoucherList /></Guard>} />
            <Route path="disbursements/new" element={<Guard permission="encodeVouchers" name="New voucher"><NewVoucher /></Guard>} />
            <Route path="disbursements/:no" element={<Guard permission="viewCashReports" name="Disbursements"><VoucherPrint /></Guard>} />
            <Route path="reports" element={<Navigate to="/reports/more" replace />} />
            <Route path="reports/cash-receipts" element={<Guard permission="viewCashReports" name="Cash Receipts Book"><CashReceipts /></Guard>} />
            <Route path="reports/daily-target" element={<Guard permission="viewLoanReports" name="Daily target of collectors"><DailyTarget /></Guard>} />
            <Route path="reports/collections" element={<Guard permission="viewCashReports" name="Collections"><Collections /></Guard>} />
            <Route path="reports/disbursements" element={<Guard permission="viewCashReports" name="Disbursements"><Disbursements /></Guard>} />
            <Route path="reports/loan-ledger" element={<Guard permission="viewLoanReports" name="Loan ledger"><LoanLedger /></Guard>} />
            <Route path="reports/more" element={<MoreReports />} />
            <Route path="reports/aging" element={<Guard permission="viewLoanReports" name="Aging of receivables"><Aging /></Guard>} />
            <Route path="reports/safekeeping" element={<Guard permission="viewCashReports" name="Safekeeping"><SafekeepingBalances /></Guard>} />
            <Route path="utilities" element={<Utilities />} />
            <Route path="day-close" element={<Guard permission="dayClose" name="Day close"><Placeholder crumbs={['Utilities', 'Day close']} /></Guard>} />
            <Route path="settings" element={<Guard permission="settings" name="Settings"><Settings /></Guard>} />
            <Route path="*" element={<Placeholder crumbs={['Not found']} />} />
          </Route>

          <Route
            path="m"
            element={
              <RequireAuth area="collector">
                <MobileLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/m/today" replace />} />
            <Route path="today" element={<Today />} />
            <Route path="clients" element={<MobileClients />} />
            <Route path="clients/:clientId" element={<MobileClient />} />
            <Route path="more" element={<MobileMore />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
      </SettingsProvider>
      <Toaster position="top-center" />
        </StoreProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
