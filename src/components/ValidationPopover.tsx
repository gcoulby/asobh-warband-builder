import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { ValidationPanel } from '@/components/ValidationPanel'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ValidationMessage } from '@/lib/validate'

interface ValidationPopoverProps {
  messages: readonly ValidationMessage[]
}

/** Counts of errors and warnings in a small button. The details open beside it. */
export function ValidationPopover({ messages }: ValidationPopoverProps) {
  const errors = messages.filter((m) => m.severity === 'error').length
  const warnings = messages.filter((m) => m.severity === 'warning').length
  const label =
    errors + warnings === 0
      ? 'Warband is ready to play'
      : [errors && `${errors} ${errors === 1 ? 'thing to fix' : 'things to fix'}`, warnings && `${warnings} ${warnings === 1 ? 'warning' : 'warnings'}`]
          .filter(Boolean)
          .join(', ')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 font-bold tabular-nums" aria-label={`Checks: ${label}`}>
          {errors + warnings === 0 && <CircleCheck className="text-muted-foreground" />}
          {errors > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <CircleAlert /> {errors}
            </span>
          )}
          {warnings > 0 && (
            <span className="flex items-center gap-1 text-warning">
              <TriangleAlert /> {warnings}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(26rem,calc(100vw-2rem))] p-2">
        <ValidationPanel messages={messages} />
      </PopoverContent>
    </Popover>
  )
}
