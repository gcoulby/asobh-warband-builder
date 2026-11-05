import { describe, expect, it } from 'vitest'
import { bookPrice, formulaCost, hasRuleNamed, isLeader, isNoncombatant, isPersonality, modelCost, warbandTotals, type CostResult } from '@/lib/cost'
import { fakeRules, makeModel, makeWarband } from '@/test/fixtures'
import type { Combat, Profile, Quality } from '@/lib/schema'

const known = (cost: number): CostResult => ({ known: true, cost })

describe('formulaCost', () => {
  it.each<[Quality, Combat, number, number]>([
    // The rulebook's Spearman: Q4 C2 with a 3 point trait is 20 points.
    [4, 2, 3, 20],
    [4, 3, 0, 23],
    [2, 6, 5, 88],
    [6, 0, 0, 1],
    [6, 0, -3, 1],
    [3, 3, 0, 30],
  ])('Quality %i+ Combat %i with %i points of traits costs %i', (q, c, traits, expected) => {
    expect(formulaCost(q, c, traits)).toBe(expected)
  })
})

describe('modelCost', () => {
  it.each<[string, string[], CostResult]>([
    ['zero rules', [], known(23)],
    ['one rule', ['fake-glow'], known(30)],
    ['many rules', ['fake-glow', 'fake-hop', 'fake-free'], known(41)],
    ['a negative rule', ['fake-hop', 'fake-drawback'], known(29)],
    ['an unknown rule', ['fake-glow', 'nope'], { known: false, reason: { kind: 'unknown-rule', ruleId: 'nope' } }],
  ])('%s', (_label, ruleIds, expected) => {
    expect(modelCost(makeModel({ ruleIds }), fakeRules)).toEqual(expected)
  })
})

describe('isPersonality and isLeader', () => {
  it('follow the rule tags', () => {
    expect(isPersonality(makeModel({ ruleIds: ['fake-glow'] }), fakeRules)).toBe(false)
    expect(isPersonality(makeModel({ ruleIds: ['fake-hero'] }), fakeRules)).toBe(true)
    expect(isLeader(makeModel({ ruleIds: ['fake-hero'] }), fakeRules)).toBe(false)
    expect(isLeader(makeModel({ ruleIds: ['fake-captain'] }), fakeRules)).toBe(true)
  })
})

describe('warbandTotals', () => {
  const models = [makeModel({ id: 'a' }), makeModel({ id: 'b', quality: 3, combat: 4, ruleIds: ['fake-hero'] })]

  it('multiplies by quantity and counts models, groups and Personality points', () => {
    const warband = makeWarband({
      entries: [
        { modelId: 'a', quantity: 3 },
        { modelId: 'b', quantity: 1 },
      ],
    })
    // b: ((4 × 5 + 4) × 4) / 2 = 48
    expect(warbandTotals(warband, models, fakeRules)).toEqual({
      total: 23 * 3 + 48,
      personalityTotal: 48,
      hasUnknown: false,
      modelCount: 4,
      noncombatantCount: 0,
      groupCount: 2,
    })
  })

  it('flags unknown costs instead of counting them as zero', () => {
    const warband = makeWarband({ entries: [{ modelId: 'b', quantity: 2 }] })
    expect(warbandTotals(warband, models, [])).toMatchObject({ total: 0, hasUnknown: true })
  })

  it('counts noncombatants among the models', () => {
    // Quality 6+ Combat 1: ((1 × 5) × 1) / 2 = 2.5, rounded to 3 points.
    const withVillagers = [...models, makeModel({ id: 'v', quality: 6, combat: 1 })]
    const warband = makeWarband({ entries: [{ modelId: 'a', quantity: 1 }, { modelId: 'v', quantity: 2 }] })
    expect(warbandTotals(warband, withVillagers, fakeRules)).toMatchObject({ modelCount: 3, noncombatantCount: 2 })
  })

  it('totals an empty warband as zero', () => {
    expect(warbandTotals(makeWarband(), models, fakeRules)).toEqual({
      total: 0,
      personalityTotal: 0,
      hasUnknown: false,
      modelCount: 0,
      noncombatantCount: 0,
      groupCount: 0,
    })
  })
})

describe('isNoncombatant', () => {
  it.each<[CostResult, boolean]>([
    [{ known: true, cost: 1 }, true],
    [{ known: true, cost: 5 }, true],
    [{ known: true, cost: 6 }, false],
    [{ known: false, reason: { kind: 'unknown-rule', ruleId: 'x' } }, false],
  ])('%o is noncombatant: %s', (cost, expected) => {
    expect(isNoncombatant(cost)).toBe(expected)
  })
})

describe('hasRuleNamed', () => {
  it('matches the rule name ignoring case, not the id', () => {
    const model = makeModel({ ruleIds: ['fake-leader'] })
    expect(hasRuleNamed(model, fakeRules, 'leader')).toBe(true)
    expect(hasRuleNamed(model, fakeRules, 'fake-leader')).toBe(false)
  })
})

describe('book prices', () => {
  const profile: Profile = { id: 'p1', roster: 'r', name: 'Book glow', quality: 4, combat: 3, ruleIds: ['fake-glow'], bookPoints: 25 }
  const fromBook = makeModel({ profileId: 'p1', ruleIds: ['fake-glow'] })

  it('uses the book points while the model matches its profile', () => {
    expect(modelCost(fromBook, fakeRules, [profile])).toEqual({ known: true, cost: 25, formula: 30 })
  })

  it('ignores rule order and the name', () => {
    const p = { ...profile, ruleIds: ['fake-glow', 'fake-hop'] }
    const m = makeModel({ name: 'Renamed', profileId: 'p1', ruleIds: ['fake-hop', 'fake-glow'] })
    expect(bookPrice(m, [p])).toBe(25)
  })

  it('uses the formula once the stats or rules change', () => {
    expect(modelCost({ ...fromBook, quality: 3 }, fakeRules, [profile])).toEqual(known(40))
    expect(modelCost({ ...fromBook, ruleIds: [] }, fakeRules, [profile])).toEqual(known(23))
  })

  it('leaves out the formula when the two agree', () => {
    expect(modelCost(fromBook, fakeRules, [{ ...profile, bookPoints: 30 }])).toEqual(known(30))
  })

  it('counts towards warband totals', () => {
    const warband = makeWarband({ entries: [{ modelId: fromBook.id, quantity: 2 }] })
    expect(warbandTotals(warband, [fromBook], fakeRules, [profile]).total).toBe(50)
  })
})
