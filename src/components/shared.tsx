import type { ReactNode } from 'react'
import { Check, CircleAlert } from 'lucide-react'
import type { LoanStatus } from '@/data/types'
import { STATUS_LABELS } from '@/lib/dailyTarget'
import { cn } from '@/lib/utils'
import { maybeMoney } from '@/components/money'
import { Badge } from '@/components/ui/badge'

/** The page's title row: a noun title, one plain line under it, and the page's actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-medium tracking-[-0.02em]">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * A row of totals split by hairlines (Mercury's "Net change / Money in / Money out" strip), so a
 * set of figures reads as one block instead of a row of boxed cards.
 */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'no-print grid grid-cols-2 border-y sm:flex sm:flex-wrap [&>*]:py-4 sm:[&>*]:pr-10 sm:[&>*+*]:pl-10 sm:[&>*+*]:border-l',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** One figure in a StatStrip: small grey label over the value. */
export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-xl font-medium tracking-[-0.01em] tabular-nums">{maybeMoney(value)}</span>
    </div>
  )
}

export function KycBadge() {
  return (
    <Badge variant="secondary">
      <Check data-icon="inline-start" />
      KYC verified
    </Badge>
  )
}

export function CancelledBadge({ className }: { className?: string }) {
  return (
    <Badge variant="destructive" className={className}>
      Cancelled
    </Badge>
  )
}

// One hue per meaning: grey when nothing is owed, amber when late, red when it needs action.
const statusVariant: Record<LoanStatus, 'secondary' | 'positive' | 'warning' | 'destructive'> = {
  current: 'secondary',
  updated: 'positive',
  arrears: 'warning',
  past_due: 'destructive',
  litigation: 'destructive',
  dormant: 'secondary',
  doubtful: 'destructive',
}

export function StatusBadge({ status }: { status: LoanStatus }) {
  return <Badge variant={statusVariant[status]}>{STATUS_LABELS[status]}</Badge>
}

/** Balanced / not balanced line: a quiet check when it adds up, a red notice when it doesn't. */
export function BalanceAlert({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2.5 rounded-md px-3.5 py-3 text-sm',
        ok ? 'bg-muted text-foreground' : 'bg-pill-negative text-pill-negative-ink',
      )}
    >
      {ok ? (
        <Check className="mt-0.5 size-4 shrink-0 text-positive" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
      )}
      <p>{children}</p>
    </div>
  )
}

export function SampleNote() {
  return <p className="no-print text-xs text-muted-foreground">Sample data for preview only.</p>
}
