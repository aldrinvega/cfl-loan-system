import { useState, type ReactNode } from 'react'
import { formatMdy, parseMdy, type IsoDate } from '@/lib/dates'
import { branches, collectors } from '@/data/sample'
import { SimpleSelect } from '@/components/reports'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { collectorLabel, useSession } from '@/state/session'

type Draft = { from: string; to: string; branchId: string; collectorId: string }

/**
 * Date range, branch and collector filters shared by the simpler reports. Branch scoping follows
 * the session: only the President can pick a branch.
 */
export function useReportFilters(defaults: { from: IsoDate; to: IsoDate }) {
  const { user, canSeeBranch } = useSession()
  const initial: Draft = {
    from: formatMdy(defaults.from),
    to: formatMdy(defaults.to),
    branchId: user.branchId ?? 'all',
    collectorId: 'all',
  }
  const [draft, setDraft] = useState(initial)
  const [applied, setApplied] = useState(initial)
  const [dateError, setDateError] = useState<string>()

  function run() {
    const from = parseMdy(draft.from)
    const to = parseMdy(draft.to)
    if (!from || !to) return setDateError('Use MM/DD/YYYY for both dates.')
    if (from > to) return setDateError('"From" must be on or before "To".')
    setDateError(undefined)
    setApplied(draft)
  }

  const branchOptions = [
    ...(user.branchId === null ? [{ value: 'all', label: 'All branches' }] : []),
    ...branches.filter((b) => canSeeBranch(b.id)).map((b) => ({ value: b.id, label: b.name })),
  ]
  const collectorOptions = [
    { value: 'all', label: 'All collectors' },
    ...collectors
      .filter((c) => canSeeBranch(c.branchId) && (draft.branchId === 'all' || c.branchId === draft.branchId))
      .map((c) => ({ value: c.id, label: collectorLabel(c.id) })),
  ]

  return {
    user,
    draft,
    setDraft,
    applied,
    run,
    dateError,
    branchOptions,
    collectorOptions,
    from: parseMdy(applied.from)!,
    to: parseMdy(applied.to)!,
    branchName:
      applied.branchId === 'all' ? 'All branches' : (branches.find((b) => b.id === applied.branchId)?.name ?? ''),
    collectorLine:
      applied.collectorId === 'all' ? 'All collectors' : `Collector ${collectorLabel(applied.collectorId)}`,
    /** Whether a row from this branch (and collector, if given) belongs in the report. */
    inScope: (branchId: string, collectorId?: string) =>
      canSeeBranch(branchId) &&
      (applied.branchId === 'all' || branchId === applied.branchId) &&
      (collectorId === undefined || applied.collectorId === 'all' || collectorId === applied.collectorId),
  }
}

export type ReportFilterState = ReturnType<typeof useReportFilters>

export function ReportFilters({
  filters,
  collector = true,
  dates = true,
  children,
}: {
  filters: ReportFilterState
  collector?: boolean
  dates?: boolean
  children?: ReactNode
}) {
  const { draft, setDraft, user } = filters
  return (
    <Card className="no-print">
      <CardContent>
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            filters.run()
          }}
        >
          {dates && (
            <>
              <Field data-invalid={!!filters.dateError || undefined} className="w-40">
                <FieldLabel htmlFor="rf-from">From</FieldLabel>
                <Input id="rf-from" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
              </Field>
              <Field className="w-40">
                <FieldLabel htmlFor="rf-to">To</FieldLabel>
                <Input id="rf-to" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
              </Field>
            </>
          )}
          <Field className="w-48">
            <FieldLabel htmlFor="rf-branch">Branch</FieldLabel>
            <SimpleSelect
              id="rf-branch"
              value={draft.branchId}
              onValueChange={(branchId) => setDraft({ ...draft, branchId, collectorId: 'all' })}
              options={filters.branchOptions}
              disabled={user.branchId !== null}
            />
          </Field>
          {collector && (
            <Field className="min-w-48 flex-1">
              <FieldLabel htmlFor="rf-collector">Collector</FieldLabel>
              <SimpleSelect
                id="rf-collector"
                value={draft.collectorId}
                onValueChange={(collectorId) => setDraft({ ...draft, collectorId })}
                options={filters.collectorOptions}
              />
            </Field>
          )}
          {children}
          <Button type="submit">Run report</Button>
          {filters.dateError && <FieldError className="basis-full">{filters.dateError}</FieldError>}
        </form>
      </CardContent>
    </Card>
  )
}
