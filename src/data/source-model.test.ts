import type { z } from 'zod'
import { agentGuideText } from '@/data/agent-guide'
import { sourceEcore, sourceJsonSchema, sourceModel, sourceTemplate } from '@/data/source-model'
import { profileSchema, rosterSchema, sourceSchema, specialRuleSchema } from '@/lib/schema'
import { checkSourceFiles } from '@/lib/source-check'
import { readSourceData } from '@/lib/sources'

/** Fields the app fills in itself, which files leave out. */
const internal: Record<string, readonly string[]> = {
  Source: ['origin'],
  SpecialRule: ['source', 'edition', 'book'],
}

const schemas: Record<string, z.ZodObject> = {
  Source: sourceSchema,
  SpecialRule: specialRuleSchema,
  Roster: rosterSchema,
  Profile: profileSchema,
}

describe('source data model', () => {
  it.each(Object.keys(schemas))('%s lists every field the app reads, with the same required fields', (name) => {
    const modelClass = sourceModel.find((c) => c.name === name)
    const shape = schemas[name].shape
    const expected = Object.keys(shape).filter((k) => !internal[name]?.includes(k))
    expect(modelClass?.fields.map((f) => f.name).sort()).toEqual(expected.sort())
    for (const field of modelClass?.fields ?? []) {
      // `summary` has a default, so the app accepts it missing, but files should always carry it.
      if (field.name === 'summary') continue
      expect(shape[field.name].safeParse(undefined).success, `${name}.${field.name}`).toBe(!field.required)
    }
  })

  it('has a template the importer accepts whole', () => {
    const result = readSourceData(sourceTemplate)
    expect(result.ok && result.errors).toEqual([])
  })

  it('makes a JSON Schema whose references all resolve', () => {
    const schema = sourceJsonSchema()
    const defs = Object.keys(schema.$defs as object)
    const refs = [...JSON.stringify(schema).matchAll(/"\$ref":"#\/\$defs\/(\w+)"/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    refs.forEach((r) => expect(defs).toContain(r))
  })

  it('makes well-formed ecore', () => {
    const doc = new DOMParser().parseFromString(sourceEcore(), 'application/xml')
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0)
    expect(doc.getElementsByTagName('eClassifiers').length).toBeGreaterThanOrEqual(sourceModel.length)
  })

  it('puts the schema at the end of AGENT.md', () => {
    expect(agentGuideText()).toContain('"title": "Warband source file"')
  })
})

describe('checking several source files', () => {
  const file = (id: string, ruleId: string) => ({
    path: `${id}.json`,
    text: JSON.stringify({ ...sourceTemplate, source: { ...sourceTemplate.source, id, rules: [{ id: ruleId, name: ruleId, cost: 1, summary: '' }], rosters: [], profiles: [] } }),
  })

  it('keeps the first of two files with the same source id', () => {
    const checks = checkSourceFiles([file('a', 'one'), file('a', 'two')], [])
    expect(checks.map((c) => Boolean(c.source))).toEqual([true, false])
  })

  it('skips a file whose rule ids another source has', () => {
    const checks = checkSourceFiles([file('a', 'one'), file('b', 'one')], [])
    expect(checks[1].problem).toMatch(/ids another source has/)
  })

  it('marks a source you already have as a replacement', () => {
    const existing = readSourceData(JSON.parse(file('a', 'one').text))
    if (!existing.ok) throw new Error('fixture')
    expect(checkSourceFiles([file('a', 'one')], [existing.source])[0].replaces).toBe(true)
  })
})
