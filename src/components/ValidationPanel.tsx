import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { IssueSeverity, ValidationMessage } from '@/lib/validate'
import { cn } from '@/lib/utils'

interface ValidationPanelProps {
  messages: readonly ValidationMessage[]
}

const groups: readonly { severity: IssueSeverity; one: string; many: string }[] = [
  { severity: 'error', one: 'thing to fix', many: 'things to fix' },
  { severity: 'warning', one: 'warning', many: 'warnings' },
]

/** Errors to fix, then warnings to agree with your opponent. */
export function ValidationPanel({ messages }: ValidationPanelProps) {
  if (messages.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <CircleCheck className="size-4" aria-hidden="true" />
        Warband is ready to play.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map(({ severity, one, many }) => {
        const items = messages.filter((m) => m.severity === severity)
        if (items.length === 0) return null
        const isError = severity === 'error'
        const Icon = isError ? CircleAlert : TriangleAlert
        return (
          <Alert
            key={severity}
            variant={isError ? 'destructive' : 'default'}
            className={cn(
              'rounded-sm border-l-4 bg-card',
              isError ? 'border-destructive/60 border-l-destructive' : 'border-warning/50 border-l-warning text-warning',
            )}
          >
            <Icon aria-hidden="true" />
            <AlertTitle className="font-bold">
              {items.length} {items.length === 1 ? one : many}
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-0.5 flex flex-col gap-1">
                {items.map((m, i) => (
                  <li key={`${m.issue.kind}-${i}`} className="text-foreground">
                    <span className="font-bold">{m.title}</span> {m.fix}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}
