import { Badge } from '@/components/ui/badge'
import type { SpecialRule } from '@/lib/schema'
import { cn } from '@/lib/utils'

interface RuleChipsProps {
  ruleIds: readonly string[]
  rules: readonly SpecialRule[]
  compact?: boolean
}

/** A model's special rules as small chips. Unknown ids are shown, not hidden. */
export function RuleChips({ ruleIds, rules, compact = false }: RuleChipsProps) {
  if (ruleIds.length === 0) {
    return <p className="text-sm text-muted-foreground">No special rules</p>
  }
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Special rules">
      {ruleIds.map((id) => {
        const rule = rules.find((r) => r.id === id)
        return (
          <li key={id}>
            <Badge
              variant={rule ? 'secondary' : 'destructive'}
              className={cn(
                'h-auto rounded-sm px-1.5 py-0.5 font-normal whitespace-nowrap print:border print:border-black print:bg-white print:text-black',
                compact ? 'text-[0.6875rem]' : 'text-[0.8125rem]',
              )}
              title={rule?.summary}
            >
              {rule ? rule.name : `Unknown rule: ${id}`}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
