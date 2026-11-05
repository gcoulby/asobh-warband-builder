import { describe, expect, it } from 'vitest'
import { describeIssue, issueSeverity, validateWarband, type IssueSeverity, type ValidationIssue } from '@/lib/validate'
import { fakeRules, makeModel, makeWarband } from '@/test/fixtures'
import type { Profile, Warband, WarbandEntry } from '@/lib/schema'

// Costs by the formula: grunt 23, boss 38 (Personality, Leadership), hero 29
// (Personality), captain 35 (Leadership), overlord 50 (two Leadership rules), hatted 26,
// chief 36 (Leader), one-off 23 (Unique), villager 3 (noncombatant).
// Leadership here means the L marker; only the rule named Leader counts as the Leader.
const models = [
  makeModel({ id: 'grunt' }),
  makeModel({ id: 'boss', name: 'Boss', ruleIds: ['fake-chief'] }),
  makeModel({ id: 'hero', name: 'Hero', ruleIds: ['fake-hero'] }),
  makeModel({ id: 'captain', name: 'Captain', ruleIds: ['fake-captain'] }),
  makeModel({ id: 'overlord', name: 'Overlord', ruleIds: ['fake-chief', 'fake-captain'] }),
  makeModel({ id: 'hatted', name: 'Hatted', ruleIds: ['fake-rare'] }),
  makeModel({ id: 'chief', name: 'Chief', ruleIds: ['fake-leader'] }),
  makeModel({ id: 'chief2', name: 'Other chief', ruleIds: ['fake-leader'] }),
  makeModel({ id: 'oneoff', name: 'One-off', ruleIds: ['fake-unique'] }),
  makeModel({ id: 'villager', name: 'Villager', quality: 6, combat: 1 }),
]

const entry = (modelId: string, quantity = 1): WarbandEntry => ({ modelId, quantity })

describe('validateWarband', () => {
  it.each<[string, WarbandEntry[], number, ValidationIssue[]]>([
    ['empty warband', [], 400, [{ kind: 'empty' }]],
    ['valid warband', [entry('boss'), entry('grunt', 2)], 400, []],
    ['no leader is allowed', [entry('grunt', 2)], 400, []],
    ['exactly at cap', [entry('boss'), entry('grunt', 2)], 84, []],
    ['over cap by one point', [entry('grunt', 2), entry('captain')], 80, [{ kind: 'over-cap', over: 1 }]],
    [
      'Personalities over half the cap',
      [entry('boss'), entry('hero')],
      120,
      [{ kind: 'personalities-over-limit', spent: 67, allowed: 60, share: 'half' }],
    ],
    ['Personalities at exactly half the cap', [entry('boss'), entry('grunt')], 76, []],
    ['two models with the Leader rule', [entry('chief'), entry('chief2')], 400, [{ kind: 'multiple-leaders', count: 2 }]],
    ['a Leader row with two models', [entry('chief', 2)], 400, [{ kind: 'multiple-leaders', count: 2 }]],
    ['a Leader alongside other Leadership rules', [entry('chief'), entry('boss'), entry('captain')], 400, []],
    ['a Unique model once', [entry('oneoff')], 400, []],
    [
      'a Unique model twice',
      [entry('oneoff', 2)],
      400,
      [{ kind: 'unique-exceeded', modelName: 'One-off', count: 2 }],
    ],
    ['noncombatants are flagged, not removed', [entry('grunt'), entry('villager', 3)], 400, [{ kind: 'noncombatants', count: 3 }]],
    [
      'two Leadership rules on one model',
      [entry('overlord')],
      400,
      [{ kind: 'multiple-leadership-rules', modelName: 'Overlord' }],
    ],
    ['a rare rule at its limit', [entry('hatted', 2)], 400, []],
    [
      'a rare rule over its limit',
      [entry('hatted', 3)],
      400,
      [{ kind: 'rare-exceeded', ruleName: 'Rare hat', count: 3, limit: 2 }],
    ],
    [
      'row pointing at a missing model',
      [entry('boss'), entry('ghost')],
      400,
      [{ kind: 'missing-model', modelId: 'ghost' }, { kind: 'unknown-costs' }],
    ],
  ])('%s', (_label, entries, pointsCap, expected) => {
    expect(validateWarband(makeWarband({ entries, pointsCap }), models, fakeRules)).toEqual(expected)
  })

  it('reports unknown costs when a rule is missing', () => {
    const issues = validateWarband(makeWarband({ entries: [entry('hero')] }), models, [])
    expect(issues).toEqual([{ kind: 'unknown-costs' }])
  })
})

describe('describeIssue', () => {
  it('uses singular point for a one point overage', () => {
    expect(describeIssue({ kind: 'over-cap', over: 1 }).title).toBe('Over the points cap by 1 point.')
  })

  it('gives every issue a title and a fix', () => {
    const issues: ValidationIssue[] = [
      { kind: 'empty' },
      { kind: 'over-cap', over: 5 },
      { kind: 'personalities-over-limit', spent: 210, allowed: 200, share: 'half' },
      { kind: 'multiple-leaders', count: 2 },
      { kind: 'multiple-leadership-rules', modelName: 'X' },
      { kind: 'rare-exceeded', ruleName: 'X', count: 3, limit: 1 },
      { kind: 'unknown-costs' },
      { kind: 'missing-model', modelId: 'x' },
      { kind: 'unique-exceeded', modelName: 'X', count: 2 },
      { kind: 'noncombatants', count: 1 },
      { kind: 'off-roster', modelName: 'X', roster: 'orcs', warbandRoster: 'lizardmen' },
      { kind: 'no-roster', modelName: 'X', warbandRoster: 'lizardmen' },
      { kind: 'profile-rare-exceeded', profileName: 'X', count: 2, limit: 1 },
    ]
    for (const issue of issues) {
      const message = describeIssue(issue)
      expect(message.title.length).toBeGreaterThan(0)
      expect(message.fix.length).toBeGreaterThan(0)
    }
  })
})

describe('issueSeverity', () => {
  it.each<[ValidationIssue, IssueSeverity]>([
    [{ kind: 'over-cap', over: 1 }, 'error'],
    [{ kind: 'rare-exceeded', ruleName: 'X', count: 2, limit: 1 }, 'error'],
    [{ kind: 'multiple-leadership-rules', modelName: 'X' }, 'error'],
    [{ kind: 'missing-model', modelId: 'x' }, 'error'],
    [{ kind: 'personalities-over-limit', spent: 210, allowed: 200, share: 'half' }, 'warning'],
    [{ kind: 'multiple-leaders', count: 2 }, 'warning'],
    [{ kind: 'unknown-costs' }, 'warning'],
    [{ kind: 'unique-exceeded', modelName: 'X', count: 2 }, 'error'],
    [{ kind: 'noncombatants', count: 1 }, 'warning'],
    [{ kind: 'off-roster', modelName: 'X', roster: 'orcs', warbandRoster: 'lizardmen' }, 'error'],
    [{ kind: 'no-roster', modelName: 'X', warbandRoster: 'lizardmen' }, 'warning'],
    [{ kind: 'profile-rare-exceeded', profileName: 'X', count: 2, limit: 1 }, 'error'],
  ])('rates %o as %s', (issue, severity) => {
    expect(issueSeverity(issue)).toBe(severity)
    expect(describeIssue(issue).severity).toBe(severity)
  })
})

describe('validateWarband with rosters and profiles', () => {
  // Fake profiles, not book data.
  const profiles: Profile[] = [
    { id: 'p-rare', roster: 'lizardmen', name: 'Rare beast', quality: 4, combat: 3, ruleIds: [], rare: 1 },
    { id: 'p-unique', roster: 'lizardmen', name: 'One hero', quality: 4, combat: 3, ruleIds: [], unique: true },
  ]
  const rosterModels = [
    makeModel({ id: 'liz', name: 'Liz', roster: 'lizardmen' }),
    makeModel({ id: 'elf', name: 'Elf', roster: 'high-elves' }),
    makeModel({ id: 'loose', name: 'Loose' }),
    makeModel({ id: 'beast', name: 'Beast', roster: 'lizardmen', profileId: 'p-rare' }),
    makeModel({ id: 'beast2', name: 'Beast copy', roster: 'lizardmen', profileId: 'p-rare' }),
    makeModel({ id: 'hero1', name: 'Hero', roster: 'lizardmen', profileId: 'p-unique' }),
  ]
  const run = (entries: WarbandEntry[], extra: Partial<Warband> = {}) =>
    validateWarband(makeWarband({ entries, ...extra }), rosterModels, fakeRules, profiles)

  it('ignores rosters when strict roster is off', () => {
    expect(run([entry('liz'), entry('elf'), entry('loose')], { roster: 'lizardmen' })).toEqual([])
  })

  it('ignores strict roster for an Anything goes warband', () => {
    expect(run([entry('elf')], { roster: 'mixed', strictRoster: true })).toEqual([])
  })

  it('flags models from other rosters and models with none when strict', () => {
    expect(run([entry('liz'), entry('elf'), entry('loose')], { roster: 'lizardmen', strictRoster: true })).toEqual([
      { kind: 'off-roster', modelName: 'Elf', roster: 'high-elves', warbandRoster: 'lizardmen' },
      { kind: 'no-roster', modelName: 'Loose', warbandRoster: 'lizardmen' },
    ])
  })

  it('counts a Rare profile across every model made from it', () => {
    expect(run([entry('beast')])).toEqual([])
    expect(run([entry('beast'), entry('beast2')])).toEqual([
      { kind: 'profile-rare-exceeded', profileName: 'Rare beast', count: 2, limit: 1 },
    ])
  })

  it('allows one model from a Unique profile', () => {
    expect(run([entry('hero1')])).toEqual([])
    expect(run([entry('hero1', 2)])).toEqual([
      { kind: 'profile-rare-exceeded', profileName: 'One hero', count: 2, limit: 1 },
    ])
  })
})
