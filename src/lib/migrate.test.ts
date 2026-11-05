import { describe, expect, it } from 'vitest'
import { migrateStoredData } from '@/lib/migrate'
import { emptyStoredData } from '@/lib/schema'
import { makeModel, makeWarband } from '@/test/fixtures'

describe('migrateStoredData', () => {
  it('starts empty when nothing is saved', () => {
    expect(migrateStoredData(null)).toEqual({ ok: true, value: emptyStoredData() })
  })

  it('reads current data unchanged', () => {
    const data = { ...emptyStoredData(), models: [makeModel()], warbands: [makeWarband()] }
    expect(migrateStoredData(data)).toEqual({ ok: true, value: data })
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
