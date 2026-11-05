import { Trash2 } from 'lucide-react'
import { ModelRow } from '@/components/ModelRow'
import { Button } from '@/components/ui/button'
import { modelCost } from '@/lib/cost'
import type { Profile, Roster, SpecialRule } from '@/lib/schema'

interface SourceProfileListProps {
  rosters: readonly Roster[]
  profiles: readonly Profile[]
  rules: readonly SpecialRule[]
  onDelete: (profileId: string) => void
}

/** A source's profiles, grouped under their rosters. */
export function SourceProfileList({ rosters, profiles, rules, onDelete }: SourceProfileListProps) {
  return (
    <div className="flex flex-col gap-4">
      {rosters.map((roster) => {
        const inRoster = profiles.filter((p) => p.roster === roster.id)
        if (inRoster.length === 0) return null
        return (
          <section key={roster.id} aria-labelledby={`roster-${roster.id}`} className="flex flex-col gap-1.5">
            <h3 id={`roster-${roster.id}`} className="font-display text-lg font-semibold">
              {roster.label} <span className="text-sm text-muted-foreground tabular-nums">{inRoster.length}</span>
            </h3>
            <ul className="rounded-sm border bg-card" aria-label={roster.label}>
              {inRoster.map((profile) => {
                const cost = modelCost({ ...profile, profileId: profile.id }, rules, profiles)
                const notes = [
                  profile.rare !== undefined && `Rare, up to ${profile.rare}`,
                  profile.unique && 'Unique',
                  cost.known && cost.formula !== undefined && `Formula gives ${cost.formula} pts`,
                ].filter(Boolean)
                return (
                  <ModelRow
                    key={profile.id}
                    model={profile}
                    rules={rules}
                    cost={cost}
                    note={notes.length > 0 ? notes.join(' · ') : undefined}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => onDelete(profile.id)}
                        aria-label={`Delete profile ${profile.name}`}
                      >
                        <Trash2 />
                      </Button>
                    }
                  />
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
