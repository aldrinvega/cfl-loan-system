import { useLocation, useNavigate } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { COMPANY_NAME } from '@/data/sample'
import type { Permission } from '@/state/permissions'
import { useSession } from '@/state/session'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const reportTabs: { to: string; label: string; needs?: Permission }[] = [
  { to: '/reports/cash-receipts', label: 'Cash Receipts', needs: 'viewCashReports' },
  { to: '/reports/daily-target', label: 'Daily target of collectors', needs: 'viewLoanReports' },
  { to: '/reports/collections', label: 'Collections', needs: 'viewCashReports' },
  { to: '/reports/disbursements', label: 'Loan releases', needs: 'viewCashReports' },
  { to: '/reports/loan-ledger', label: 'Loan ledger', needs: 'viewLoanReports' },
  { to: '/reports/more', label: 'All reports' },
]

/** Report switcher: one tab per report route. */
export function ReportTabs() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { can } = useSession()
  const tabs = reportTabs.filter((t) => !t.needs || can(t.needs))
  // Reports listed only under "All reports" keep that tab selected.
  const value = tabs.some((t) => t.to === pathname) ? pathname : '/reports/more'
  return (
    <Tabs value={value} onValueChange={(v) => navigate(String(v))} className="no-print">
      <TabsList variant="line" className="w-full justify-start overflow-x-auto pr-3">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.to} value={tab.to} className="flex-none">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export type Cell = string | number

/** Downloads rows as a CSV file, which Excel opens directly. */
export function downloadCsv(filename: string, rows: Cell[][]) {
  const escape = (cell: Cell) => {
    const text = String(cell)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const csv = '﻿' + rows.map((row) => row.map(escape).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportButtons({ onExcel }: { onExcel: () => void }) {
  return (
    <>
      <Button variant="outline" onClick={onExcel}>
        <Download data-icon="inline-start" />
        Excel
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast('Choose "Save as PDF" as the printer.')
          window.print()
        }}
      >
        <Download data-icon="inline-start" />
        PDF
      </Button>
      <Button variant="outline" onClick={() => window.print()}>
        <Printer data-icon="inline-start" />
        Print
      </Button>
    </>
  )
}

export type Option = { value: string; label: string }

export function SimpleSelect({
  id,
  value,
  onValueChange,
  options,
  disabled,
}: {
  id: string
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(String(v))} items={options} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Centered company / title / subtitle block at the top of a printable report. */
export function ReportTitle({ branch, title, subtitle }: { branch: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-sm text-muted-foreground">
        {COMPANY_NAME} · {branch}
      </span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <span className="text-sm font-medium">{subtitle}</span>
    </div>
  )
}
