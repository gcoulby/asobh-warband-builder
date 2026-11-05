import { beforeEach, describe, expect, it } from 'vitest'
import { useDataStore } from '@/stores/data-store'
import { emptyStoredData } from '@/lib/schema'
import { fakeRules } from '@/test/fixtures'

const store = () => useDataStore.getState()
const warband = (id: string) => store().warbands.find((w) => w.id === id)

describe('data store', () => {
  beforeEach(() => store().hydrate(emptyStoredData()))

  it('adds the same model twice as one row with quantity two', () => {
    const w = store().createWarband()
    const m = store().createModel({ name: 'Goblin' })
    store().addEntry(w, m)
    store().addEntry(w, m)
    expect(warband(w)?.entries).toEqual([{ modelId: m, quantity: 2 }])
  })

  it('duplicates a row as a new model placed after it', () => {
    const w = store().createWarband()
    const a = store().createModel({ name: 'A' })
    const b = store().createModel({ name: 'B' })
    store().addEntry(w, a)
    store().addEntry(w, b)
    const copy = store().duplicateEntry(w, a)
    expect(warband(w)?.entries.map((e) => e.modelId)).toEqual([a, copy, b])
    expect(warband(w)?.entries[1]?.quantity).toBe(1)
    expect(store().models.find((m) => m.id === copy)?.name).toBe('A copy')
  })

  it('reorders rows', () => {
    const w = store().createWarband()
    const ids = ['A', 'B', 'C'].map((name) => store().createModel({ name }))
    ids.forEach((id) => store().addEntry(w, id))
    store().moveEntry(w, 0, 2)
    expect(warband(w)?.entries.map((e) => e.modelId)).toEqual([ids[1], ids[2], ids[0]])
  })

  it('removes a deleted model from every warband', () => {
    const w = store().createWarband()
    const m = store().createModel()
    store().addEntry(w, m)
    store().deleteModel(m)
    expect(warband(w)?.entries).toEqual([])
  })

  it('merges imported rules by id', () => {
    store().importRules(fakeRules)
    store().importRules([{ id: 'x', name: 'X', cost: 1, summary: '' }, { ...fakeRules[0]!, cost: 99 }])
    expect(store().rules).toHaveLength(fakeRules.length + 1)
    expect(store().rules.find((r) => r.id === fakeRules[0]!.id)?.cost).toBe(99)
  })
})
