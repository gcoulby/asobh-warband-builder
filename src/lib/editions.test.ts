import { describe, expect, it } from 'vitest'
import { editions } from '@/data/editions'
import { editionIdOf, ruleAllowed, ruleScope, rulesFor, sourcesInUse } from '@/lib/editions'
import { flattenSources } from '@/lib/sources'
import { bundledSources, loadBundledSources } from '@/lib/sources-loader'
import { validateWarband } from '@/lib/validate'
import { makeModel, makeWarband } from '@/test/fixtures'
import type { Source, SpecialRule, WarbandEntry } from '@/lib/schema'

// Fake sources. The rule ids are the ones the SBH Revised checks look for; names and costs are made up.
const rule = (id: string, name: string, extra: Partial<SpecialRule> = {}): SpecialRule => ({ id, name, cost: 0, summary: '', ...extra })
const fakeSources: Source[] = [
  {
    id: 'fake-sbh-core',
    name: 'Fake SBH core',
    kind: 'core',
    game: 'sbh',
    rules: [
      rule('sbh-animal', 'Beasty'),
      rule('sbh-swarm', 'Many legs'),
      rule('sbh-rabble', 'Mob'),
      rule('sbh-big', 'Tall', { excludes: ['sbh-small'] }),
      rule('sbh-small', 'Short', { excludes: ['sbh-big'] }),
      rule('sbh-boss', 'Bossy', { cost: 10, tags: ['P'] }),
    ],
    rosters: [],
    profiles: [],
  },
  {
    id: 'fake-supplement',
    name: 'Fake supplement',
    kind: 'supplement',
    game: 'sbh',
    usableIn: ['asobh'],
    rules: [rule('sbh-paladin', 'Shiny'), rule('sbh-evil', 'Grim')],
    rosters: [],
    profiles: [],
  },
  { id: 'fake-asobh-core', name: 'Fake ASOBH core', kind: 'core', game: 'asobh', rules: [rule('asobh-glow', 'Glows')], rosters: [], profiles: [] },
]
const sbhRules = flattenSources(fakeSources).rules

const sbh = (overrides = {}) => makeWarband({ edition: 'sbh', pointsCap: 300, ...overrides })
const entry = (modelId: string, quantity = 1): WarbandEntry => ({ modelId, quantity })
const kinds = (issues: { kind: string }[]) => issues.map((i) => i.kind)

describe('edition helpers', () => {
  it('treats anything without an edition as Advanced SBH', () => {
    expect(editionIdOf({})).toBe('asobh')
    expect(editionIdOf({ edition: 'nope' })).toBe('asobh')
    expect(editionIdOf({ edition: 'sbh' })).toBe('sbh')
  })

  it('always uses the core source, and every source when none are chosen', () => {
    const ids = (chosen?: string[]) => sourcesInUse(fakeSources, 'sbh', chosen).map((x) => x.id)
    expect(ids([])).toEqual(['fake-sbh-core'])
    expect(ids(['fake-supplement'])).toEqual(['fake-sbh-core', 'fake-supplement'])
    expect(ids()).toEqual(['fake-sbh-core', 'fake-supplement'])
  })

  it('offers only rules of the game and its sources in use', () => {
    expect(rulesFor(sbhRules, ruleScope(fakeSources, 'sbh', [])).map((r) => r.id)).not.toContain('sbh-paladin')
    expect(ruleAllowed(sbhRules.find((r) => r.id === 'sbh-paladin')!, ruleScope(fakeSources, 'sbh'))).toBe(true)
  })

  it('lets Advanced SBH borrow supplements that say so, but not SBH core rules', () => {
    const ids = (chosen?: string[]) => rulesFor(sbhRules, ruleScope(fakeSources, 'asobh', chosen)).map((r) => r.id)
    expect(ids()).toEqual(['asobh-glow', 'sbh-evil', 'sbh-paladin'])
    expect(ids([])).toEqual(['asobh-glow'])
    expect(ids(['fake-supplement'])).toContain('sbh-paladin')
  })

  it("prefers the game's own rule over a borrowed one of the same name", () => {
    const own: Source = { ...fakeSources[2]!, rules: [rule('asobh-shiny', 'S-hiny')] }
    const sources = [fakeSources[0]!, fakeSources[1]!, own]
    const ids = rulesFor(flattenSources(sources).rules, ruleScope(sources, 'asobh')).map((r) => r.id)
    expect(ids).toContain('asobh-shiny')
    expect(ids).not.toContain('sbh-paladin')
  })
})

describe('SBH Revised checks', () => {
  const models = [
    makeModel({ id: 'boss', name: 'Boss', quality: 3, ruleIds: ['sbh-boss'], edition: 'sbh' }),
    makeModel({ id: 'grunt', edition: 'sbh' }),
    makeModel({ id: 'dog', name: 'Dog', ruleIds: ['sbh-animal'], edition: 'sbh' }),
    makeModel({ id: 'bugs', name: 'Bugs', ruleIds: ['sbh-swarm'], edition: 'sbh' }),
    makeModel({ id: 'mob', name: 'Mob', quality: 3, ruleIds: ['sbh-rabble'], edition: 'sbh' }),
    makeModel({ id: 'knight', name: 'Knight', ruleIds: ['sbh-paladin'], edition: 'sbh' }),
    makeModel({ id: 'villain', name: 'Villain', ruleIds: ['sbh-evil'], edition: 'sbh' }),
    makeModel({ id: 'odd', name: 'Odd', ruleIds: ['sbh-big', 'sbh-small'], edition: 'sbh' }),
    makeModel({ id: 'elf', name: 'Elf' }),
    makeModel({ id: 'glowy', name: 'Glowy', ruleIds: ['asobh-glow'], edition: 'sbh' }),
  ]
  const check = (entries: WarbandEntry[], warband = sbh()) =>
    kinds(validateWarband({ ...warband, entries }, models, sbhRules, [], fakeSources))

  it('caps Personalities at a third', () => {
    // Boss costs ((15 + 10) × 4) / 2 = 50. A third of 120 is 40.
    expect(check([entry('boss')], sbh({ pointsCap: 120 }))).toContain('personalities-over-limit')
    expect(check([entry('boss')], sbh({ pointsCap: 150 }))).not.toContain('personalities-over-limit')
  })

  it('caps Animals and Swarms at half', () => {
    // Dog and grunt cost 23 each.
    expect(check([entry('dog', 3), entry('grunt')], sbh({ pointsCap: 120 }))).toContain('animals-over-half')
    expect(check([entry('dog', 2), entry('grunt')], sbh({ pointsCap: 120 }))).not.toContain('animals-over-half')
  })

  it('needs two Swarm bases', () => {
    expect(check([entry('bugs')])).toContain('swarm-too-small')
    expect(check([entry('bugs', 2)])).not.toContain('swarm-too-small')
  })

  it('keeps Rabble at Quality 4+ or worse', () => {
    expect(check([entry('mob')])).toContain('quality-too-good')
  })

  it('flags incompatible models in one warband', () => {
    expect(check([entry('knight')])).not.toContain('incompatible-rules')
    expect(check([entry('knight'), entry('villain')])).toContain('incompatible-rules')
  })

  it('flags rules a model cannot combine, once per pair', () => {
    expect(check([entry('odd')]).filter((k) => k === 'conflicting-rules')).toHaveLength(1)
  })

  it('flags models and rules from another game or an unused book', () => {
    expect(check([entry('elf')])).toContain('wrong-edition')
    expect(check([entry('glowy')])).toContain('rule-not-in-use')
    expect(check([entry('knight')], sbh({ sourceIds: [] }))).toContain('rule-not-in-use')
    expect(check([entry('knight')], sbh({ sourceIds: ['fake-supplement'] }))).not.toContain('rule-not-in-use')
  })

  it('leaves Advanced SBH warbands to their own checks', () => {
    const asobh = makeWarband({ pointsCap: 120 })
    expect(kinds(validateWarband({ ...asobh, entries: [entry('elf')] }, models, sbhRules, [], fakeSources))).toEqual([])
  })

  it('lets Advanced SBH models use supplements the warband has on', () => {
    const asobhModels = [
      makeModel({ id: 'knight', name: 'Knight', ruleIds: ['sbh-paladin'] }),
      makeModel({ id: 'villain', name: 'Villain', ruleIds: ['sbh-evil'] }),
      makeModel({ id: 'tall', name: 'Tall', ruleIds: ['sbh-big'] }),
    ]
    const run = (entries: WarbandEntry[], sourceIds?: string[]) =>
      kinds(validateWarband(makeWarband({ sourceIds, entries }), asobhModels, sbhRules, [], fakeSources))
    expect(run([entry('knight')])).toEqual([])
    expect(run([entry('knight')], [])).toEqual(['rule-not-in-use'])
    expect(run([entry('knight'), entry('villain')])).toContain('incompatible-rules')
    expect(run([entry('tall')])).toEqual(['rule-not-in-use'])
  })

  it('matches exclusions by name across games', () => {
    const rules = [...sbhRules, { id: 'asobh-short', name: 'Short', cost: 0, summary: '' }]
    const mixed = [makeModel({ id: 'mix', ruleIds: ['sbh-big', 'asobh-short'], edition: 'sbh' })]
    const issues = validateWarband(sbh({ entries: [entry('mix')] }), mixed, rules)
    expect(kinds(issues)).toContain('conflicting-rules')
  })
})

// The included sources live outside the repo, so these checks run only where they are present.
describe.skipIf(loadBundledSources().length === 0)('bundled sources', () => {
  const sources = bundledSources()
  const { rules, profiles } = flattenSources(sources)
  const ids = new Set(rules.map((r) => r.id))

  it('load without skipped entries', () => {
    for (const file of loadBundledSources()) {
      expect(file.error, file.fileName).toBeUndefined()
      expect(file.errors, file.fileName).toEqual([])
    }
    expect(sources.length).toBeGreaterThan(0)
  })

  it('use rule and roster ids no other source uses', () => {
    expect(ids.size).toBe(rules.length)
    const rosterIds = sources.flatMap((s) => s.rosters.map((r) => r.id))
    expect(new Set(rosterIds).size).toBe(rosterIds.length)
  })

  it('give each profile known rules', () => {
    const missing = profiles.flatMap((p) => p.ruleIds.filter((id) => !ids.has(id)).map((id) => `${p.id}: ${id}`))
    expect(missing).toEqual([])
  })

  it('exclude rules both ways', () => {
    for (const r of rules) {
      for (const other of r.excludes ?? []) {
        expect(ids.has(other), other).toBe(true)
        expect(rules.find((x) => x.id === other)?.excludes).toContain(r.id)
      }
    }
  })

  it('price every unedited profile at its book points', async () => {
    const { modelCost } = await import('@/lib/cost')
    const wrong = profiles.filter((p) => {
      const cost = modelCost({ ...p, profileId: p.id }, rules, profiles)
      return p.bookPoints !== undefined && (!cost.known || cost.cost !== p.bookPoints)
    })
    expect(wrong.map((p) => p.id)).toEqual([])
  })

  it('have every rule the edition checks look for', () => {
    for (const edition of editions) {
      const { animalRuleIds = [], swarm, qualityFloor, incompatible = [] } = edition.checks
      for (const id of [...animalRuleIds, swarm?.ruleId, qualityFloor?.ruleId, ...incompatible.flat()]) {
        if (id) expect(ids.has(id), id).toBe(true)
      }
    }
  })
})
