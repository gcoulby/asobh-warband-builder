import { formatQuality } from '@/data/profile-options'
import type { Model } from '@/lib/schema'

interface ModelStatsProps {
  model: Pick<Model, 'quality' | 'combat'>
}

/** Quality and Combat on one line, for list rows. */
export function ModelStats({ model }: ModelStatsProps) {
  return (
    <p className="flex gap-2.5 text-xs text-muted-foreground tabular-nums">
      <span>
        Quality <span className="font-bold text-foreground">{formatQuality(model.quality)}</span>
      </span>
      <span>
        Combat <span className="font-bold text-foreground">{model.combat}</span>
      </span>
    </p>
  )
}
