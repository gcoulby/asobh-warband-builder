import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-sm border border-dashed border-input p-5">
      <p className="font-display text-xl font-semibold">{title}</p>
      {children && <div className="text-muted-foreground">{children}</div>}
      {action}
    </div>
  )
}
