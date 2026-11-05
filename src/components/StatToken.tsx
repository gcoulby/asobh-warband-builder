import { cn } from '@/lib/utils'

interface StatTokenProps {
  label: string
  value: string
  size?: 'lg' | 'sm'
}

/** A profile number set large, for reading across the table. */
export function StatToken({ label, value, size = 'lg' }: StatTokenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-sm border-2 border-foreground/80 bg-background/60 print:border-black print:bg-white',
        size === 'lg' ? 'min-w-14 px-2 pt-0.5 pb-1' : 'min-w-10 px-1.5 pb-0.5',
      )}
    >
      <span
        className={cn(
          'font-display leading-none font-bold tabular-nums',
          size === 'lg' ? 'text-[2.5rem]' : 'text-[1.75rem]',
        )}
      >
        {value}
      </span>
      <span className={cn('leading-tight text-muted-foreground print:text-black', size === 'lg' ? 'text-xs' : 'text-[0.625rem]')}>
        {label}
      </span>
    </div>
  )
}
