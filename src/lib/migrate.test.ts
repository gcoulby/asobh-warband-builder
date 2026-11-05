import { describe, expect, it } from 'vitest'
import { migrateStoredData } from '@/lib/migrate'
import { emptyStoredData } from '@/lib/schema'
import { bundledSources } from '@/lib/sources-loader'
import { makeModel, makeWarband } from '@/test/fixtures'

describe('migrateStoredData', () => {
  it('starts empty when nothing is saved', () => {
    expect(migrateStoredData(null)).toEqual({ ok: true, value: emptyStoredData() })
  })

  it('reads current data unchanged', () => {
    const data = { ...emptyStoredData(), models: [makeModel()], warbands: [makeWarband()] }
    expect(migrateStoredData(data)).toEqual({ ok: true, value: data })
  })

  it.skipIf(bundledSources().length === 0)('moves version 1 rules into sources, keeping summaries', () => {
    const bundled = bundledSources().find((b) => b.kind === 'core' && b.game === 'asobh')!
    const known = bundled.rules[0]!
    const v1 = {
      schemaVersion: 1,
      models: [],
      warbands: [{ ...makeWarband(), books: ['sgd'] }],
      rules: [
        { ...known, summary: 'My own words.', source: 'Old label' },
        { id: 'fake-own', name: 'Made up', cost: 2, summary: 'Test rule.', source: 'House rules' },
      ],
    }
    const result = migrateStoredData(v1)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const core = result.value.sources.find((x) => x.id === bundled.id)
    expect(core?.rules.find((r) => r.id === known.id)?.summary).toBe('My own words.')
    const leftover = result.value.sources.find((x) => x.rules.some((r) => r.id === 'fake-own'))
    expect(leftover).toMatchObject({ kind: 'custom', name: 'House rules' })
    expect(result.value.warbands[0]?.sourceIds).toContain('sgd')
    expect(result.value.warbands[0]?.sourceIds).toContain('hammer-and-forge')
  })

  it('refuses data from a newer version', () => {
    const result = migrateStoredData({ ...emptyStoredData(), schemaVersion: 99 })
    expect(result.ok).toBe(false)
  })

  it('refuses damaged data', () => {
    const result = migrateStoredData({ schemaVersion: 1, warbands: 'x' })
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/damaged/) })
  })
})
