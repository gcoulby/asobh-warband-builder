import { Link } from 'react-router'
import { ThumbnailStrip, type Thumbnail } from '@/components/ThumbnailStrip'
import { cn } from '@/lib/utils'

interface WarbandListItemProps {
  id: string
  name: string
  theme?: string
  /** Roster label, if one is set. */
  roster?: string
  total: number
  cap: number
  hasUnknown: boolean
  modelCount: number
  thumbnails: readonly Thumbnail[]
}

export function WarbandListItem({ id, name, theme, roster, total, cap, hasUnknown, modelCount, thumbnails }: WarbandListItemProps) {
  const over = total > cap
  return (
    <li className="relative rounded-sm border border-b-4 border-b-base-edge bg-card p-3 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[1.375rem] leading-tight font-semibold">
            <Link to={`/warband/${id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {name}
            </Link>
          </h2>
          {(roster || theme) && (
            <p className="text-sm text-muted-foreground">{[roster, theme].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <p className="shrink-0 text-right leading-none">
          <span className={cn('font-display text-2xl font-bold tabular-nums', over ? 'text-destructive' : 'text-brass')}>
            {total}
            {hasUnknown && '+'}
          </span>
          <span className="font-display text-base text-muted-foreground tabular-nums"> / {cap}</span>
          <span className="block pt-1 text-sm text-muted-foreground">
            {modelCount} {modelCount === 1 ? 'model' : 'models'}
          </span>
        </p>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className={cn('h-full', over ? 'bg-destructive' : 'bg-brass-fill')}
          // Fill width is the share of the cap spent, so it is set per warband.
          style={{ width: `${cap > 0 ? Math.min(100, (total / cap) * 100) : 0}%` }}
        />
      </div>
      <div className="mt-2">
        <ThumbnailStrip items={thumbnails} />
      </div>
    </li>
  )
}
