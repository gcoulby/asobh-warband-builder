import { NONCOMBATANT_MAX_COST } from '@/data/rule-names'

/** Marks a model costing 5 points or fewer. */
export function NoncombatantBadge() {
  return (
    <span
      className="shrink-0 rounded-sm border border-warning/50 px-1 text-[0.6875rem] leading-4 font-bold text-warning"
      title={`Noncombatant: ${NONCOMBATANT_MAX_COST} points or fewer, for special scenarios only`}
    >
      Noncombatant
    </span>
  )
}
