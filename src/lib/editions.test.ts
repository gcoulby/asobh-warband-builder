import { describe, expect, it } from 'vitest'
import { editions } from '@/data/editions'
import { booksInUse, editionById, editionIdOf, ruleAllowed, rulesFor, ruleSections } from '@/lib/editions'
import { loadBundledRules } from '@/lib/rules-loader'
import { validateWarband } from '@/lib/validate'
import { makeModel, makeWarband } from '@/test/fixtures'
import type { SpecialRule, WarbandEntry } from '@/lib/schema'

// Fake rules. The ids are the ones the SBH Revised checks look for; names and costs are made up.
const sbhRules: SpecialRule[] = [
  { id: 'sbh-animal', name: 'Beasty', cost: 0, summary: '', edition: 'sbh', book: 'sbh' },
  { id: 'sbh-swarm', name: 'Many legs', cost: 0, summary: '', edition: 'sbh', book: 'sbh' },
  { id: 'sbh-rabble', name: 'Mob', cost: 0, summary: '', edition: 'sbh', book: 'sbh' },
  { id: 'sbh-paladin', name: 'Shiny', cost: 0, summary: '', edition: 'sbh', book: 'sgd' },
  { id: 'sbh-evil', name: 'Grim', cost: 0, summary: '', edition: 'sbh', book: 'sgd' },
  { id: 'sbh-big', name: 'Tall', cost: 0, summary: '', edition: 'sbh', book: 'sbh', excludes: ['sbh-small'] },
  { id: 'sbh-small', name: 'Short', cost: 0, summary: '', edition: 'sbh', book: 'sbh', excludes: ['sbh-big'] },
  { id: 'sbh-boss', name: 'Bossy', cost: 10, summary: '', edition: 'sbh', book: 'sbh', tags: ['P'] },
  { id: 'asobh-glow', name: 'Glows', cost: 0, summary: '' },
]

const sbh = (overrides = {}) => makeWarband({ edition: 'sbh', pointsCap: 300, ...overrides })
const entry = (modelId: string, quantity = 1): WarbandEntry => ({ modelId, quantity })
const kinds = (issues: { kind: string }[]) => issues.map((i) => i.kind)

describe('edition helpers', () => {
  it('treats anything without an edition as Advanced SBH', () => {
    expect(editionIdOf({})).toBe('asobh')
    expect(editionIdOf({ edition: 'nope' })).toBe('asobh')
    expect(editionIdOf({ edition: 'sbh' })).toBe('sbh')
  })

  it('always uses the core book, and every book when none are chosen', () => {
    const edition = editionById('sbh')
    expect(booksInUse(edition, []).map((b) => b.id)).toEqual(['sbh'])
    expect(booksInUse(edition, ['sgd']).map((b) => b.id)).toEqual(['sbh', 'sgd'])
    expect(booksInUse(edition, undefined)).toHaveLength(edition.books.length)
  })

  it('offers only rules of the edition and its books', () => {
    const books = booksInUse(editionById('sbh'), [])
    expect(rulesFor(sbhRules, 'sbh', books).map((r) => r.id)).not.toContain('sbh-paladin')
    expect(ruleAllowed(sbhRules[3], 'sbh')).toBe(true)
  })

  it('lets Advanced SBH borrow supplement rules, but not SBH core rules', () => {
    const ids = (books?: string[]) =>
      rulesFor(sbhRules, 'asobh', books && booksInUse(editionById('asobh'), books)).map((r) => r.id)
    expect(ids()).toEqual(['sbh-paladin', 'sbh-evil', 'asobh-glow'])
    expect(ids([])).toEqual(['asobh-glow'])
    expect(ids(['sgd'])).toContain('sbh-paladin')
  })

  it('prefers the edition\'s own rule over a borrowed one of the same name', () => {
    const rules = [...sbhRules, { id: 'asobh-shiny', name: 'S-hiny', cost: 1, summary: '' }]
    const ids = rulesFor(rules, 'asobh').map((r) => r.id)
    expect(ids).toContain('asobh-shiny')
    expect(ids).not.toContain('sbh-paladin')
  })

  it('splits rules into sections by game and book, never repeating a rule', () => {
    const sections = ruleSections(sbhRules)
    expect(sections.map((s) => s.id)).toEqual(['asobh', 'sbh-sbh', 'sbh-sgd'])
    expect(sections.flatMap((s) => s.rules)).toHaveLength(sbhRules.length)
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
  const check = (entries: WarbandEntry[], warband = sbh()) => kinds(validateWarband({ ...warband, entries }, models, sbhRules))

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
    expect(check([entry('knight')], sbh({ books: [] }))).toContain('rule-not-in-use')
    expect(check([entry('knight')], sbh({ books: ['sgd'] }))).not.toContain('rule-not-in-use')
  })

  it('leaves Advanced SBH warbands to their own checks', () => {
    const asobh = makeWarband({ pointsCap: 120 })
    expect(kinds(validateWarband({ ...asobh, entries: [entry('elf')] }, models, sbhRules))).toEqual([])
  })

  it('lets Advanced SBH models use supplements the warband has on', () => {
    const asobhModels = [
      makeModel({ id: 'knight', name: 'Knight', ruleIds: ['sbh-paladin'] }),
      makeModel({ id: 'villain', name: 'Villain', ruleIds: ['sbh-evil'] }),
      makeModel({ id: 'tall', name: 'Tall', ruleIds: ['sbh-big'] }),
    ]
    const run = (entries: WarbandEntry[], books?: string[]) =>
      kinds(validateWarband(makeWarband({ books, entries }), asobhModels, sbhRules))
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

describe('bundled SBH Revised rules', () => {
  const file = loadBundledRules().find((f) => f.fileName === 'sbh-revised-rules.json')
  const rules = file?.result.ok ? file.result.rules : []
  const ids = new Set(rules.map((r) => r.id))

  it('loads every entry', () => {
    expect(file?.result.ok && file.result.errors).toEqual([])
    expect(rules.length).toBeGreaterThan(0)
  })

  it('uses only known books, and excludes rules that exist both ways', () => {
    const books = new Set(editionById('sbh').books.map((b) => b.id))
    for (const rule of rules) {
      expect(rule.edition).toBe('sbh')
      expect(books.has(rule.book ?? '')).toBe(true)
      for (const other of rule.excludes ?? []) {
        expect(ids.has(other)).toBe(true)
        expect(rules.find((r) => r.id === other)?.excludes).toContain(rule.id)
      }
    }
  })

  it('has every rule the edition checks look for', () => {
    for (const edition of editions) {
      const { animalRuleIds = [], swarm, qualityFloor, incompatible = [] } = edition.checks
      for (const id of [...animalRuleIds, swarm?.ruleId, qualityFloor?.ruleId, ...incompatible.flat()]) {
        if (id) expect(ids.has(id), id).toBe(true)
      }
    }
  })
})
