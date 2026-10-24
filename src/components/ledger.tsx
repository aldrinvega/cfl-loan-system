import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

/** "Castillo, Nora" → "NC"; "R. Lacson" → "RL". */
export function initialsOf(name: string): string {
  const parts = name.includes(',') ? name.split(',').reverse() : name.split(' ')
  return parts
    .map((p) => p.trim().replace(/[^A-Za-zÑñ]/g, '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** A person or company in a row: initials in a quiet circle, the name, and an optional grey line. */
export function Person({ name, sub, size = 'sm' }: { name: string; sub?: ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className={cn(
          'flex flex-none items-center justify-center rounded-full bg-sidebar-accent font-medium text-foreground/80 max-sm:hidden',
          size === 'sm' ? 'size-7 text-[11px]' : 'size-10 text-sm',
        )}
      >
        {initialsOf(name)}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{name}</span>
        {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
    </span>
  )
}

/**
 * Props that make a table row open its detail panel on click or Enter, like a Mercury transaction.
 * Buttons inside the row keep their own clicks (they stop propagation in `stopRow`).
 */
export function rowOpens(open: () => void, selected: boolean) {
  return {
    tabIndex: 0,
    'data-state': selected ? 'selected' : undefined,
    className: 'group/row cursor-pointer focus-visible:bg-muted focus-visible:outline-none',
    onClick: open,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.target === e.currentTarget) open()
    },
  }
}

export const stopRow = { onClick: (e: React.MouseEvent) => e.stopPropagation() }

/** The right-hand detail panel: title, a grey line, the body, and the actions pinned at the foot. */
export function DetailPanel({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-[420px]">
        <SheetHeader className="gap-1 border-b px-6 pt-6 pb-5">
          <SheetTitle className="pr-8 text-base font-medium">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}

/** Label-left, value-right facts inside a panel. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-6 border-b border-rule py-2.5 text-sm last:border-0">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export type TimelineStep = { title: ReactNode; detail?: ReactNode; done: boolean }

/** Mercury's vertical trail: a line between dots, filled where the step happened. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => (
        <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn('absolute top-3 left-[5px] h-full w-px', steps[i + 1].done ? 'bg-link' : 'bg-border')}
            />
          )}
          <span
            aria-hidden
            className={cn(
              'relative mt-1 size-[11px] flex-none rounded-full border-2',
              step.done ? 'border-link bg-link' : 'border-border bg-background',
            )}
          />
          <div className="flex flex-col gap-0.5 text-sm">
            <span className={cn('font-medium', !step.done && 'text-muted-foreground')}>{step.title}</span>
            {step.detail && <span className="text-xs text-muted-foreground">{step.detail}</span>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** A panel's lead figure: the amount large, a grey line under it (Mercury's "−$2.55"). */
export function LeadFigure({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[28px] leading-tight font-medium tracking-[-0.02em]">{children}</span>
      {sub && <span className="text-sm text-muted-foreground">{sub}</span>}
    </div>
  )
}

/** A small heading inside a panel. */
export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}
