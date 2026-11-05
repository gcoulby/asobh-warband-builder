import { useState, type ReactNode } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ruleKeywords, ruleMeta } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'
import { cn } from '@/lib/utils'

interface RulePickerProps {
  rules: readonly SpecialRule[]
  value: readonly string[]
  onChange: (ruleIds: string[]) => void
  /** Running model cost, shown while picking. */
  costLabel: ReactNode
  /** Shown in place of the picker when there are no rules at all. */
  emptyState: ReactNode
  id?: string
}

const formatRuleCost = (cost: number) => (cost > 0 ? `+${cost}` : String(cost))

export function RulePicker({ rules, value, onChange, costLabel, emptyState, id }: RulePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = new Set(value)

  const toggle = (ruleId: string) =>
    onChange(selected.has(ruleId) ? value.filter((v) => v !== ruleId) : [...value, ruleId])

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Chosen special rules">
          {value.map((ruleId) => {
            const rule = rules.find((r) => r.id === ruleId)
            return (
              <li key={ruleId}>
                <Badge variant={rule ? 'secondary' : 'destructive'} className="h-auto gap-0 rounded-sm py-0 pr-0 pl-2 text-sm">
                  {rule ? `${rule.name} ${formatRuleCost(rule.cost)}` : `Unknown rule: ${ruleId}`}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-sm"
                    onClick={() => toggle(ruleId)}
                    aria-label={`Remove ${rule?.name ?? ruleId}`}
                  >
                    <X />
                  </Button>
                </Badge>
              </li>
            )
          })}
        </ul>
      )}

      {rules.length === 0 ? (
        emptyState
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button id={id} type="button" variant="outline" className="justify-start self-start" aria-expanded={open}>
              <Plus /> Add special rules
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search special rules" />
              <CommandList className="max-h-[min(20rem,50dvh)]">
                <CommandEmpty>No rules match that search.</CommandEmpty>
                <CommandGroup>
                  {rules.map((rule) => {
                    const isOn = selected.has(rule.id)
                    const meta = ruleMeta(rule)
                    return (
                      <CommandItem
                        key={rule.id}
                        value={`${rule.name} ${rule.id}`}
                        keywords={ruleKeywords(rule)}
                        onSelect={() => toggle(rule.id)}
                        aria-selected={isOn}
                        className="min-h-11 items-start gap-2 py-2"
                      >
                        <Check className={cn('mt-0.5 shrink-0', isOn ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="flex justify-between gap-2 font-bold">
                            {rule.name}
                            <span className="font-display text-base text-brass tabular-nums">{formatRuleCost(rule.cost)}</span>
                          </span>
                          {rule.summary && <span className="text-xs text-muted-foreground">{rule.summary}</span>}
                          {meta.length > 0 && <span className="text-xs text-muted-foreground">{meta.join(' · ')}</span>}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
              <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-sm">
                <span>{costLabel}</span>
                <Button type="button" size="sm" className="h-9" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
