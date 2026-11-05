import { ModelImage } from '@/components/ModelImage'

export interface Thumbnail {
  id: string
  name: string
  imageUrl?: string
}

interface ThumbnailStripProps {
  items: readonly Thumbnail[]
  max?: number
}

export function ThumbnailStrip({ items, max = 6 }: ThumbnailStripProps) {
  const shown = items.slice(0, max)
  const extra = items.length - shown.length
  if (shown.length === 0) return null
  return (
    <ul className="flex items-center gap-1" aria-hidden="true">
      {shown.map((item) => (
        <li key={item.id}>
          <ModelImage name={item.name} imageUrl={item.imageUrl} className="w-10 rounded-[2px]" />
        </li>
      ))}
      {extra > 0 && <li className="pl-1 text-sm text-muted-foreground tabular-nums">+{extra}</li>}
    </ul>
  )
}
