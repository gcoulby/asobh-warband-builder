import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRuleCost } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'

interface ChosenRulesProps {
  rules: readonly SpecialRule[]
  value: readonly string[]
  onRemove: (ruleId: string) => void
}

/** The rules on a model, each with a remove button. Unknown ids are shown, not hidden. */
export function ChosenRules({ rules, value, onRemove }: ChosenRulesProps) {
  if (value.length === 0) {
    return <p className="text-sm text-muted-foreground">No special rules yet.</p>
  }
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Chosen special rules">
      {value.map((ruleId) => {
        const rule = rules.find((r) => r.id === ruleId)
        return (
          <li key={ruleId}>
            <Badge
              variant={rule ? 'secondary' : 'destructive'}
              className="h-auto gap-1 rounded-sm py-0 pr-0 pl-2 text-sm"
            >
              {rule ? rule.name : `Unknown rule: ${ruleId}`}
              {rule && <span className="font-display text-brass tabular-nums">{formatRuleCost(rule.cost)}</span>}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-sm"
                onClick={() => onRemove(ruleId)}
                aria-label={`Remove ${rule?.name ?? ruleId}`}
              >
                <X />
              </Button>
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
