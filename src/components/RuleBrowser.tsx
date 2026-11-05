import { useMemo, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isRuleGroupId, ruleGroupLabels, type RuleGroupId } from '@/data/rule-groups'
import { groupRules } from '@/lib/rule-groups'
import { formatRuleCost, matchesRuleSearch, ruleMeta } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'
import { cn } from '@/lib/utils'

interface RuleBrowserProps {
  rules: readonly SpecialRule[]
  value: readonly string[]
  onChange: (ruleIds: string[]) => void
  /** Shown along the foot, such as the running model cost and a Done button. */
  footer?: ReactNode
  className?: string
}

const isPersonalityOnly = (rule: SpecialRule) => rule.tags?.includes('P') ?? false

/**
 * Every special rule, sorted into tabs by kind. Searching looks across all tabs.
 * Picking a rule toggles it on the model.
 */
export function RuleBrowser({ rules, value, onChange, footer, className }: RuleBrowserProps) {
  const [search, setSearch] = useState('')
  const [hidePersonality, setHidePersonality] = useState(false)
  const selected = new Set(value)

  const groups = useMemo(
    () => groupRules(hidePersonality ? rules.filter((r) => !isPersonalityOnly(r)) : rules),
    [rules, hidePersonality],
  )
  const [tab, setTab] = useState<RuleGroupId | undefined>(undefined)
  const activeTab = groups.some((g) => g.id === tab) ? tab : groups[0]?.id

  const toggle = (ruleId: string) =>
    onChange(selected.has(ruleId) ? value.filter((v) => v !== ruleId) : [...value, ruleId])

  const item = (rule: SpecialRule) => {
    const isOn = selected.has(rule.id)
    const meta = ruleMeta(rule)
    return (
      <CommandItem
        key={rule.id}
        value={rule.id}
        onSelect={() => toggle(rule.id)}
        data-chosen={isOn}
        className={cn(
          'min-h-11 items-start gap-2 rounded-sm border-l-2 border-transparent py-1.5',
          isOn && 'border-l-primary bg-accent/60',
        )}
      >
        <Check className={cn('mt-0.5 shrink-0', isOn ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex justify-between gap-2 font-bold">
            <span>
              {rule.name}
              {isOn && <span className="sr-only">, chosen</span>}
            </span>
            <span className="font-display text-base text-brass tabular-nums">{formatRuleCost(rule.cost)}</span>
          </span>
          {rule.summary && <span className="text-xs text-muted-foreground">{rule.summary}</span>}
          {meta.length > 0 && <span className="text-xs text-muted-foreground">{meta.join(' · ')}</span>}
        </div>
      </CommandItem>
    )
  }

  const searching = search.trim().length > 0
  const listClass = 'max-h-none min-h-0 flex-1 px-1 pb-2'

  return (
    <Command shouldFilter={false} className={cn('flex min-h-0 flex-col rounded-none bg-transparent', className)}>
      <div className="flex flex-col gap-2 border-b px-3 pt-3 pb-2">
        <CommandInput value={search} onValueChange={setSearch} placeholder="Search all special rules" />
        <div className="flex items-center gap-2">
          <Switch id="hide-personality" checked={hidePersonality} onCheckedChange={setHidePersonality} />
          <Label htmlFor="hide-personality" className="text-sm font-normal text-muted-foreground">
            Hide Personality-only rules
          </Label>
        </div>
      </div>

      {searching ? (
        <CommandList className={cn(listClass, 'pt-1')} aria-label="Matching special rules">
          <CommandEmpty>No rules match that search.</CommandEmpty>
          {groups.map((group) => {
            const matches = group.rules.filter((r) => matchesRuleSearch(r, search))
            if (matches.length === 0) return null
            return (
              <CommandGroup key={group.id} heading={ruleGroupLabels[group.id]}>
                {matches.map(item)}
              </CommandGroup>
            )
          })}
        </CommandList>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => isRuleGroupId(v) && setTab(v)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList
            aria-label="Kinds of special rule"
            className="h-auto w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto gap-1 rounded-none border-b bg-transparent px-2 py-2"
          >
            {groups.map((group) => {
              const chosen = group.rules.filter((r) => selected.has(r.id)).length
              return (
                <TabsTrigger
                  key={group.id}
                  value={group.id}
                  className="h-8 flex-none rounded-sm border-border px-2 data-active:border-primary data-active:bg-accent"
                >
                  {ruleGroupLabels[group.id]}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {chosen > 0 ? `${chosen}/${group.rules.length}` : group.rules.length}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
          {groups.map((group) => (
            <TabsContent key={group.id} value={group.id} className="flex min-h-0 flex-1 flex-col">
              <CommandList className={cn(listClass, 'pt-1')} aria-label={ruleGroupLabels[group.id]}>
                <CommandGroup>{group.rules.map(item)}</CommandGroup>
              </CommandList>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {footer && <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-sm">{footer}</div>}
    </Command>
  )
}
