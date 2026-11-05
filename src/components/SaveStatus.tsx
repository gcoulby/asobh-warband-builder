import { Check, CircleAlert, LoaderCircle } from 'lucide-react'
import type { PersistenceStatus } from '@/hooks/use-persistence'
import { cn } from '@/lib/utils'

interface SaveStatusProps {
  status: PersistenceStatus
}

export function SaveStatus({ status }: SaveStatusProps) {
  return (
    <p
      role="status"
      className={cn('flex items-center gap-1 text-sm', status === 'error' ? 'font-bold text-destructive' : 'text-muted-foreground')}
    >
      {status === 'saving' && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
      {status === 'idle' && <Check className="size-4" aria-hidden="true" />}
      {status === 'error' && <CircleAlert className="size-4" aria-hidden="true" />}
      <span className={cn(status !== 'error' && 'max-sm:sr-only')}>
        {status === 'saving' ? 'Saving' : status === 'error' ? 'Not saved' : 'Saved'}
      </span>
    </p>
  )
}
