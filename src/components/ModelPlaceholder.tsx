import { initials } from '@/lib/images'
import { cn } from '@/lib/utils'

interface ModelPlaceholderProps {
  name: string
  className?: string
}

/** Stand-in picture: a figure on a round base with the model's initials. */
export function ModelPlaceholder({ name, className }: ModelPlaceholderProps) {
  return (
    <div
      className={cn(
        'relative flex size-full items-end justify-center overflow-hidden bg-placeholder text-placeholder-foreground',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 100" className="absolute inset-0 size-full text-placeholder-foreground/25" fill="currentColor">
        <circle cx="40" cy="30" r="11" />
        <path d="M24 74 C24 52 30 44 40 44 C50 44 56 52 56 74 Z" />
        <ellipse cx="40" cy="80" rx="26" ry="6" />
      </svg>
      <span className="relative mb-[12%] font-display text-[clamp(1.5rem,9cqw,3rem)] leading-none font-bold tracking-wide">
        {initials(name)}
      </span>
    </div>
  )
}
