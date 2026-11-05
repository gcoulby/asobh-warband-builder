import { useMemo, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isRuleGroupId, ruleGroupLabels, type RuleGroupId } from '@/data/rule-groups'
import { groupRules } from '@/lib/rule-groups'
import { RuleMarkers } from '@/components/RuleMarkers'
import { formatRuleCost, matchesRuleSearch, ruleMarkers, ruleSource } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'
import { cn } from '@/lib/utils'

interface RuleBrowserProps {
  rules: readonly SpecialRule[]
  value: readonly string[]
  onChange: (ruleIds: string[]) => void
  /** Pinned above the search, so the model stays in view while scrolling the list. */
  title?: ReactNode
  className?: string
}

const isPersonalityOnly = (rule: SpecialRule) => rule.tags?.includes('P') ?? false

/**
 * Every special rule, sorted into tabs by kind. Searching looks across all tabs.
 * Picking a rule toggles it on the model. The list scrolls with the panel around
 * it while the search and tabs stay pinned to the top.
 */
export function RuleBrowser({ rules, value, onChange, title, className }: RuleBrowserProps) {
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
    const source = ruleSource(rule)
    return (
      <CommandItem
        key={rule.id}
        value={rule.id}
        onSelect={() => toggle(rule.id)}
        data-chosen={isOn}
        title={[rule.summary, source].filter(Boolean).join(' · ') || undefined}
        className={cn(
          'h-9 gap-2 rounded-none border-b border-l-2 border-l-transparent px-3 py-0 [&>svg:last-child]:hidden',
          isOn && 'border-l-primary bg-accent/70',
        )}
      >
        <Check className={cn('shrink-0 text-primary', isOn ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
        <span className="min-w-0 truncate font-semibold">
          {rule.name}
          {isOn && <span className="sr-only">, chosen</span>}
        </span>
        <RuleMarkers markers={ruleMarkers(rule)} />
        <span className="ml-auto w-9 shrink-0 text-right font-display text-sm font-bold tabular-nums">{formatRuleCost(rule.cost)}</span>
      </CommandItem>
    )
  }

  const searching = search.trim().length > 0

  return (
    <Command
      shouldFilter={false}
      className={cn('size-auto overflow-visible rounded-none! bg-transparent p-0', className)}
    >
      <Tabs value={activeTab} onValueChange={(v) => isRuleGroupId(v) && setTab(v)} className="gap-0">
        <div className="sticky top-0 z-10 flex flex-col gap-2 border-b bg-card px-3 pt-2 pb-2">
          {title}
          <CommandInput value={search} onValueChange={setSearch} placeholder="Search all special rules" />
          <div className="flex items-center gap-2">
            <Switch id="hide-personality" checked={hidePersonality} onCheckedChange={setHidePersonality} />
            <Label htmlFor="hide-personality" className="text-xs font-normal text-muted-foreground">
              Hide Personality-only rules
            </Label>
          </div>
          {!searching && (
            <TabsList
              aria-label="Kinds of special rule"
              className="h-auto w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto"
            >
              {groups.map((group) => {
                const chosen = group.rules.filter((r) => selected.has(r.id)).length
                return (
                  <TabsTrigger
                    key={group.id}
                    value={group.id}
                    className="h-7 flex-none rounded-sm border-border px-2 text-xs data-active:border-primary data-active:bg-accent"
                  >
                    {ruleGroupLabels[group.id]}
                    <span className="text-muted-foreground tabular-nums">
                      {chosen > 0 ? `${chosen}/${group.rules.length}` : group.rules.length}
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          )}
        </div>

        {searching ? (
          <CommandList className="max-h-none overflow-visible" aria-label="Matching special rules">
            <CommandEmpty>No rules match that search.</CommandEmpty>
            {groups.map((group) => {
              const matches = group.rules.filter((r) => matchesRuleSearch(r, search))
              if (matches.length === 0) return null
              return (
                <CommandGroup key={group.id} heading={ruleGroupLabels[group.id]} className="p-0">
                  {matches.map(item)}
                </CommandGroup>
              )
            })}
          </CommandList>
        ) : (
          groups.map((group) => (
            <TabsContent key={group.id} value={group.id}>
              <CommandList className="max-h-none overflow-visible" aria-label={ruleGroupLabels[group.id]}>
                <CommandGroup className="p-0">{group.rules.map(item)}</CommandGroup>
              </CommandList>
            </TabsContent>
          ))
        )}
      </Tabs>
    </Command>
  )
}
