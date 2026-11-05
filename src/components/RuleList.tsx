import { ruleMeta } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'

interface RuleListProps {
  rules: readonly SpecialRule[]
}

const formatCost = (cost: number) => (cost > 0 ? `+${cost}` : String(cost))

export function RuleList({ rules }: RuleListProps) {
  return (
    <ul className="divide-y rounded-sm border bg-card" aria-label="Special rules">
      {rules.map((rule) => {
        const meta = ruleMeta(rule)
        return (
          <li key={rule.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="font-bold">{rule.name}</p>
              {rule.summary && <p className="text-sm text-muted-foreground">{rule.summary}</p>}
              {meta.length > 0 && <p className="text-xs text-muted-foreground">{meta.join(' · ')}</p>}
            </div>
            <span className="shrink-0 font-display text-xl font-bold text-brass tabular-nums">
              {formatCost(rule.cost)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
