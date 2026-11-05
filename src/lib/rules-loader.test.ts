import { describe, expect, it } from 'vitest'
import { mergeRules, parseRulesData, parseRulesText, rulesTemplate } from '@/lib/rules-loader'
import { fakeRules } from '@/test/fixtures'
import bundledAsobh from '@/data/rules/asobh-rules.json'

describe('parseRulesData', () => {
  it('accepts a valid file', () => {
    const result = parseRulesData({ name: 'Fake', rules: fakeRules })
    expect(result).toEqual({ ok: true, name: 'Fake', rules: fakeRules, errors: [] })
  })

  it('rejects a file without a rules array', () => {
    const result = parseRulesData({ name: 'Fake' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/not a rules file/)
  })

  it('fills in a missing summary and rejects an unknown tag', () => {
    const result = parseRulesData({
      rules: [
        { id: 'a', name: 'A', cost: 1 },
        { id: 'b', name: 'B', cost: 1, summary: '', tags: ['X'] },
      ],
    })
    expect(result.ok && result.rules).toEqual([{ id: 'a', name: 'A', cost: 1, summary: '' }])
    expect(result.ok && result.errors.map((e) => e.id)).toEqual(['b'])
  })

  it('loads the bundled rules file without errors', () => {
    const result = parseRulesData(bundledAsobh)
    expect(result.ok && result.errors).toEqual([])
    expect(result.ok && result.rules.length).toBeGreaterThan(300)
  })

  it('keeps the valid entries of a partly valid file and lists the failing ones', () => {
    const result = parseRulesData({
      rules: [
        fakeRules[0],
        { id: 'no-name', cost: 3, summary: '' },
        { id: 'bad-cost', name: 'Bad', cost: 'lots', summary: '' },
        fakeRules[0],
        fakeRules[1],
      ],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rules.map((r) => r.id)).toEqual(['fake-glow', 'fake-hop'])
    expect(result.errors.map((e) => [e.position, e.id])).toEqual([
      [2, 'no-name'],
      [3, 'bad-cost'],
      [4, 'fake-glow'],
    ])
    expect(result.errors[0]?.messages[0]).toMatch(/^name:/)
    expect(result.errors[2]?.messages[0]).toMatch(/Duplicate/)
  })
})

describe('parseRulesText', () => {
  it('reports invalid JSON readably', () => {
    const result = parseRulesText('{ nope')
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/not valid JSON/) })
  })

  it('parses the template it offers', () => {
    const result = parseRulesText(rulesTemplate())
    expect(result.ok && result.errors).toEqual([])
    expect(result.ok && result.rules).toHaveLength(1)
  })
})

describe('mergeRules', () => {
  it('replaces by id and keeps the rest', () => {
    const updated = { ...fakeRules[0]!, cost: 99 }
    const merged = mergeRules(fakeRules, [updated])
    expect(merged).toHaveLength(fakeRules.length)
    expect(merged.find((r) => r.id === 'fake-glow')?.cost).toBe(99)
  })

  it('keeps an existing summary when the imported entry has none', () => {
    const merged = mergeRules(fakeRules, [{ ...fakeRules[0]!, summary: '' }])
    expect(merged.find((r) => r.id === 'fake-glow')?.summary).toBe('Test rule.')
    const replaced = mergeRules(fakeRules, [{ ...fakeRules[0]!, summary: 'New words.' }])
    expect(replaced.find((r) => r.id === 'fake-glow')?.summary).toBe('New words.')
  })

  it('keeps existing full text when the imported entry has none', () => {
    const withText = mergeRules(fakeRules, [{ ...fakeRules[0]!, text: 'Made-up full text.' }])
    const reimported = mergeRules(withText, [{ ...fakeRules[0]!, summary: '' }])
    expect(reimported.find((r) => r.id === 'fake-glow')?.text).toBe('Made-up full text.')
  })
})
