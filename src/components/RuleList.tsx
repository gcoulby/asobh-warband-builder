import { Pencil, Trash2 } from 'lucide-react'
import { RuleMarkers } from '@/components/RuleMarkers'
import { Button } from '@/components/ui/button'
import { ruleGroupLabels } from '@/data/rule-groups'
import { ruleGroupOf } from '@/lib/rule-groups'
import { formatRuleCost, ruleDescription, ruleMarkers, ruleSource } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'

interface RuleListProps {
  rules: readonly SpecialRule[]
  /** Accessible name for the list, such as the book it shows. */
  label?: string
  /** Opens the editor for a rule. */
  onEdit?: (ruleId: string) => void
  onDelete?: (ruleId: string) => void
}

/** Rules, one row each: name, markers, kind, cost and summary. The book and page show on hover. */
export function RuleList({ rules, label = 'Special rules', onEdit, onDelete }: RuleListProps) {
  return (
    <ul className="divide-y rounded-sm border bg-card" aria-label={label}>
      {rules.map((rule) => (
        <li key={rule.id} className="flex min-h-9 items-center gap-2 py-1 pr-1 pl-3 text-sm" title={[rule.text, ruleSource(rule)].filter(Boolean).join(' · ') || undefined}>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate font-semibold">{rule.name}</span>
              <RuleMarkers markers={ruleMarkers(rule)} />
            </span>
            {ruleDescription(rule) && (
              <span className="line-clamp-2 text-xs text-muted-foreground">{rule.summary || rule.text}</span>
            )}
          </div>
          <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:inline">
            {ruleGroupLabels[ruleGroupOf(rule)]}
          </span>
          <span className="w-9 shrink-0 text-right font-display font-bold tabular-nums">{formatRuleCost(rule.cost)}</span>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 pointer-fine:size-8"
              onClick={() => onEdit(rule.id)}
              aria-label={`Edit ${rule.name}`}
            >
              <Pencil />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground pointer-fine:size-8"
              onClick={() => onDelete(rule.id)}
              aria-label={`Delete ${rule.name}`}
            >
              <Trash2 />
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}
