import { describe, expect, it } from 'vitest'
import type { RuleGroupId } from '@/data/rule-groups'
import { groupRules, ruleGroupOf } from '@/lib/rule-groups'
import type { SpecialRule } from '@/lib/schema'

// Fake rules, not real game data.
const rule = (id: string, extra: Partial<SpecialRule> = {}): SpecialRule => ({ id, name: id, cost: 1, summary: '', ...extra })

describe('ruleGroupOf', () => {
  it.each<[Partial<SpecialRule>, RuleGroupId]>([
    [{}, 'traits'],
    [{ category: 'Trait' }, 'traits'],
    [{ tags: ['P'] }, 'traits'],
    [{ tags: ['W'] }, 'weapons'],
    [{ tags: ['L', 'P'] }, 'leadership'],
    [{ tags: ['MA', 'P'] }, 'martial-arts'],
    [{ tags: ['MI'] }, 'magic-items'],
    [{ tags: ['A'] }, 'alchemical'],
    [{ category: 'Spell', tags: ['P'] }, 'spells'],
    [{ category: 'Runestone', tags: ['MI'] }, 'runestones'],
    [{ category: 'Feral Trait' }, 'feral'],
  ])('puts %o in %s', (extra, group) => {
    expect(ruleGroupOf(rule('x', extra))).toBe(group)
  })
})

describe('groupRules', () => {
  it('returns no groups for no rules', () => {
    expect(groupRules([])).toEqual([])
  })

  it('orders groups for display, sorts by name and drops empty groups', () => {
    const groups = groupRules([
      rule('Zap', { category: 'Spell' }),
      rule('Sword', { tags: ['W'] }),
      rule('Brave'),
      rule('Agile'),
    ])
    expect(groups.map((g) => g.id)).toEqual(['traits', 'weapons', 'spells'])
    expect(groups[0].rules.map((r) => r.name)).toEqual(['Agile', 'Brave'])
  })
})
