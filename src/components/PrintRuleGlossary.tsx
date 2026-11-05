import { formatRuleCost, ruleDescription, ruleMarkers, ruleSource } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'

interface PrintRuleGlossaryProps {
  /** Rules used in the warband, in the order to list them. */
  rules: readonly SpecialRule[]
}

/** What each rule on the sheet does: its full text or summary, or where to look it up when it has neither. */
export function PrintRuleGlossary({ rules }: PrintRuleGlossaryProps) {
  if (rules.length === 0) return null
  return (
    <section className="mt-4" aria-labelledby="print-rules-heading">
      <h2 id="print-rules-heading" className="mb-2 border-b border-black/40 pb-1 font-display text-lg font-bold">
        Special rules
      </h2>
      <dl className="columns-1 gap-6 text-xs min-[560px]:columns-2 print:columns-2">
        {rules.map((rule) => {
          const source = ruleSource(rule)
          const description = ruleDescription(rule)
          return (
            <div key={rule.id} className="mb-1.5 break-inside-avoid">
              <dt className="inline font-bold">
                {rule.name}
                <span className="ml-1 font-normal tabular-nums">
                  ({[...ruleMarkers(rule).map((m) => m.short), formatRuleCost(rule.cost)].join(' · ')})
                </span>
              </dt>{' '}
              <dd className="inline">
                {description ? description : <span className="italic">{source ? `See ${source}.` : 'No summary yet.'}</span>}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
