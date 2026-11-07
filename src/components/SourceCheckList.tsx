import { CircleAlert, CircleCheck } from 'lucide-react'
import { validSources, type SourceFileCheck } from '@/lib/source-check'

interface SourceCheckListProps {
  checks: readonly SourceFileCheck[]
  /** Said when there are no files at all. */
  emptyText?: string
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`

/** One line per checked source file: what it holds, or why it is skipped. */
export function SourceCheckList({ checks, emptyText = 'No JSON files found there.' }: SourceCheckListProps) {
  const valid = validSources(checks).length
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <p className="font-semibold">
        {checks.length === 0
          ? emptyText
          : `${plural(valid, 'source')} ready to import, ${plural(checks.length - valid, 'file')} skipped.`}
      </p>
      {checks.length > 0 && (
        <ul className="flex flex-col divide-y rounded-sm border bg-card">
          {checks.map((c) => (
            <li key={c.path} className="flex items-start gap-2 px-3 py-2 text-sm">
              {c.source ? (
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Valid" />
              ) : (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Skipped" />
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-xs text-muted-foreground">{c.path}</span>
                {c.source ? (
                  <span>
                    <span className="font-semibold">{c.source.name}</span>: {plural(c.source.rules.length, 'rule')},{' '}
                    {plural(c.source.profiles.length, 'profile')}
                    {c.replaces && ', replaces your copy'}
                    {c.skipped ? `, ${plural(c.skipped, 'bad entry')} left out` : ''}.
                  </span>
                ) : (
                  <span className="text-destructive">{c.problem}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
