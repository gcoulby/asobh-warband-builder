import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { sourceKindLabels } from '@/data/source-options'
import { editionById, isEditionId } from '@/lib/editions'
import type { Source } from '@/lib/schema'

interface SourceListItemProps {
  source: Source
}

const count = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`

/** One source in the source manager: name, kind, game and what it holds. Opens the source. */
export function SourceListItem({ source }: SourceListItemProps) {
  const game = isEditionId(source.game) ? editionById(source.game).shortLabel : source.game
  return (
    <li>
      <Link
        to={`/sources/${encodeURIComponent(source.id)}`}
        className="flex items-center gap-3 rounded-sm border bg-card px-3 py-2.5 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{source.name}</span>
            <Badge variant="outline">{sourceKindLabels[source.kind]}</Badge>
          </span>
          <span className="text-sm text-muted-foreground">
            {[game, count(source.rules.length, 'rule'), count(source.profiles.length, 'profile'), source.author]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}
