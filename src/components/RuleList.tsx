import { RuleMarkers } from '@/components/RuleMarkers'
import { ruleGroupLabels } from '@/data/rule-groups'
import { ruleGroupOf } from '@/lib/rule-groups'
import { formatRuleCost, ruleMarkers, ruleSource } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'

interface RuleListProps {
  rules: readonly SpecialRule[]
}

/** Every loaded rule, one line each: name, markers, kind and cost. The book and page show on hover. */
export function RuleList({ rules }: RuleListProps) {
  return (
    <ul className="divide-y rounded-sm border bg-card" aria-label="Special rules">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className="flex h-9 items-center gap-2 px-3 text-sm"
          title={[rule.summary, ruleSource(rule)].filter(Boolean).join(' · ') || undefined}
        >
          <span className="min-w-0 truncate font-semibold">{rule.name}</span>
          <RuleMarkers markers={ruleMarkers(rule)} />
          <span className="ml-auto hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:inline">
            {ruleGroupLabels[ruleGroupOf(rule)]}
          </span>
          <span className="ml-auto w-9 shrink-0 text-right font-display font-bold tabular-nums sm:ml-0">{formatRuleCost(rule.cost)}</span>
        </li>
      ))}
    </ul>
  )
}
