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

  it('works rules, profiles and rosters out from sources', () => {
    store().saveSource({
      id: 'fake',
      name: 'Fake book',
      shortName: 'Fake',
      kind: 'supplement',
      game: 'asobh',
      rules: fakeRules,
      rosters: [{ id: 'fake-roster', label: 'Fakes' }],
      profiles: [{ id: 'fake-p', roster: 'fake-roster', name: 'Fake', quality: 4, combat: 2, ruleIds: [] }],
    })
    expect(store().rules).toHaveLength(fakeRules.length)
    expect(store().rules[0]).toMatchObject({ book: 'fake', source: 'Fake', edition: 'asobh' })
    expect(store().profiles[0]).toMatchObject({ id: 'fake-p', sourceId: 'fake' })
    expect(store().rosters).toEqual([{ id: 'fake-roster', label: 'Fakes', sourceId: 'fake' }])
  })

  it('edits rules and profiles inside their source', () => {
    store().saveSource({ id: 'mine', name: 'Mine', kind: 'custom', game: 'asobh', rules: [], rosters: [], profiles: [] })
    store().saveRule('mine', { id: 'r1', name: 'Rule', cost: 2, summary: '', book: 'other', source: 'Other' })
    expect(store().sources[0]?.rules[0]).toEqual({ id: 'r1', name: 'Rule', cost: 2, summary: '' })
    store().saveRule('mine', { id: 'r1', name: 'Rule', cost: 3, summary: 'Changed.' })
    expect(store().rules.find((r) => r.id === 'r1')?.cost).toBe(3)
    store().saveProfile('mine', { id: 'p1', roster: 'ros', name: 'P', quality: 4, combat: 2, ruleIds: ['r1'] }, { id: 'ros', label: 'Ros' })
    expect(store().rosters.map((r) => r.id)).toEqual(['ros'])
    store().deleteProfile('mine', 'p1')
    expect(store().rosters).toEqual([])
    store().deleteRule('mine', 'r1')
    expect(store().rules).toEqual([])
    store().deleteSource('mine')
    expect(store().sources).toEqual([])
  })
})
