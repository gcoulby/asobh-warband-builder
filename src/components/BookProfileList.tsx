import { Plus } from 'lucide-react'
import { ModelRow } from '@/components/ModelRow'
import { NoncombatantsHeader } from '@/components/NoncombatantsHeader'
import { Button } from '@/components/ui/button'
import { isNoncombatant, type CostResult } from '@/lib/cost'
import type { Profile, SpecialRule } from '@/lib/schema'

export interface BookItem {
  profile: Profile
  cost: CostResult
  /** How many models from this profile the open warband has. */
  inWarband: number
}

interface BookProfileListProps {
  items: readonly BookItem[]
  rules: readonly SpecialRule[]
  onAdd: (profileId: string) => void
  showNoncombatants: boolean
  onShowNoncombatantsChange: (shown: boolean) => void
}

/** Ready-made profiles from one of the book's rosters. Adding one makes a library model from it. */
export function BookProfileList({ items, rules, onAdd, showNoncombatants, onShowNoncombatantsChange }: BookProfileListProps) {
  const row = ({ profile, cost, inWarband }: BookItem) => {
    const notes = [
      profile.rare !== undefined && `Rare, up to ${profile.rare}`,
      profile.unique && 'Unique',
    ].filter(Boolean)
    return (
      <ModelRow
        key={profile.id}
        model={profile}
        rules={rules}
        cost={cost}
        prefix={inWarband > 0 && <span className="text-primary tabular-nums">{inWarband}× </span>}
        note={notes.length > 0 ? notes.join(' · ') : undefined}
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="text-primary"
            onClick={() => onAdd(profile.id)}
            aria-label={`Add ${profile.name} to warband`}
          >
            <Plus />
          </Button>
        }
      />
    )
  }

  const fighters = items.filter((i) => !isNoncombatant(i.cost))
  const noncombatants = items.filter((i) => isNoncombatant(i.cost))

  return (
    <>
      <ul aria-label="Book profiles">{fighters.map(row)}</ul>
      {noncombatants.length > 0 && (
        <>
          <NoncombatantsHeader count={noncombatants.length} shown={showNoncombatants} onShownChange={onShowNoncombatantsChange} />
          {showNoncombatants && <ul aria-label="Noncombatant profiles">{noncombatants.map(row)}</ul>}
        </>
      )}
    </>
  )
}
