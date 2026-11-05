import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BuilderPanelProps {
  label: string
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/** One column of the builder. The header and footer stay put and the body scrolls on its own. */
export function BuilderPanel({ label, header, footer, children, className }: BuilderPanelProps) {
  return (
    <section aria-label={label} className={cn('flex h-full min-h-0 flex-col bg-card', className)}>
      {header && <div className="shrink-0 border-b px-3 py-2">{header}</div>}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer && <div className="shrink-0">{footer}</div>}
    </section>
  )
}
