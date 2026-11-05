import { CircleAlert, CircleCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ValidationMessage } from '@/lib/validate'

interface ValidationPanelProps {
  messages: readonly ValidationMessage[]
}

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
    <Alert variant="destructive" className="border-destructive/50 bg-card">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>
        {messages.length === 1 ? '1 thing to fix' : `${messages.length} things to fix`}
      </AlertTitle>
      <AlertDescription>
        <ul className="mt-1 flex flex-col gap-1.5">
          {messages.map((m) => (
            <li key={m.issue.kind} className="text-foreground">
              <span className="font-bold">{m.title}</span> {m.fix}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
