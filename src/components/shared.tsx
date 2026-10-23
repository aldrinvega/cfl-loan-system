import type { ReactNode } from 'react'
import { Check, CircleAlert } from 'lucide-react'
import type { LoanStatus } from '@/data/types'
import { STATUS_LABELS } from '@/lib/dailyTarget'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** KPI card: small label above a large value. */
export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl font-semibold tabular-nums group-data-[size=sm]/card:text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export function KycBadge() {
  return (
    <Badge variant="outline">
      <Check data-icon="inline-start" className="text-positive" />
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

const statusDot: Record<LoanStatus, string> = {
  current: 'bg-status-current',
  updated: 'bg-status-updated',
  arrears: 'bg-status-arrears',
  past_due: 'bg-status-past-due',
  litigation: 'bg-status-litigation',
  dormant: 'bg-status-dormant',
  doubtful: 'bg-status-doubtful',
}

export function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <Badge variant="outline">
      <span aria-hidden className={cn('size-2 rounded-full', statusDot[status])} />
      {STATUS_LABELS[status]}
    </Badge>
  )
}

/** Balanced / not balanced banner. */
export function BalanceAlert({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <Alert variant={ok ? 'default' : 'destructive'} role="status">
      {ok ? <Check className="text-positive!" /> : <CircleAlert />}
      <AlertDescription className={cn(ok && 'text-foreground')}>{children}</AlertDescription>
    </Alert>
  )
}

export function SampleNote() {
  return <p className="no-print text-xs text-muted-foreground">Sample data for preview only.</p>
}
