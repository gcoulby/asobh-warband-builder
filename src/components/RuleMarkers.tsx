import type { RuleMarker } from '@/lib/rule-meta'

interface RuleMarkersProps {
  markers: readonly RuleMarker[]
}

/** Rulebook markers (P, W, L and so on) as small badges. The full meaning is read out and shown on hover. */
export function RuleMarkers({ markers }: RuleMarkersProps) {
  if (markers.length === 0) return null
  return (
    <span className="flex shrink-0 gap-1">
      {markers.map((m) => (
        <abbr
          key={m.short}
          title={m.label}
          className="rounded-sm border px-1 text-[0.6875rem] leading-4 font-bold text-muted-foreground no-underline"
        >
          <span aria-hidden="true">{m.short}</span>
          <span className="sr-only">{m.label}</span>
        </abbr>
      ))}
    </span>
  )
}
