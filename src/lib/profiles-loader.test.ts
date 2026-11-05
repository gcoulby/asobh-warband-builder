import { describe, expect, it } from 'vitest'
import { loadBundledProfiles, parseProfilesData } from '@/lib/profiles-loader'

// Fake profiles, not book data.
const rosters = [{ id: 'fakes', label: 'Fakes' }]
const good = { id: 'fake-a', roster: 'fakes', name: 'Fake A', quality: 4, combat: 2, ruleIds: [] }

describe('parseProfilesData', () => {
  it('keeps valid profiles', () => {
    expect(parseProfilesData({ rosters, profiles: [good] }).profiles).toEqual([good])
  })

  it('reports bad entries by position and keeps the rest', () => {
    const result = parseProfilesData({
      rosters,
      profiles: [good, { id: 'bad-q', roster: 'fakes', name: 'Bad', quality: 9, combat: 2, ruleIds: [] }, { ...good, id: 'x', roster: 'nowhere' }],
    })
    expect(result.profiles.map((p) => p.id)).toEqual(['fake-a'])
    expect(result.errors).toEqual([
      { position: 2, id: 'bad-q' },
      { position: 3, id: 'x' },
    ])
  })

  it('returns nothing for a file of the wrong shape', () => {
    expect(parseProfilesData({ nope: true })).toEqual({ rosters: [], profiles: [], errors: [] })
  })
})

describe('loadBundledProfiles', () => {
  it('loads the bundled roster file with no bad entries', () => {
    const data = loadBundledProfiles()
    expect(data.errors).toEqual([])
    expect(new Set(data.profiles.map((p) => p.id)).size).toBe(data.profiles.length)
  })
})

describe('bundled roster data', () => {
  it('uses only rule ids from the bundled rules file and rosters the app knows', async () => {
    const { loadBundledRules } = await import('@/lib/rules-loader')
    const { rosterOptions } = await import('@/data/warband-options')
    const ruleIds = new Set(loadBundledRules().flatMap((f) => (f.result.ok ? f.result.rules.map((r) => r.id) : [])))
    const rosterIds = new Set(rosterOptions.map((r) => r.id))
    for (const profile of loadBundledProfiles().profiles) {
      expect(rosterIds.has(profile.roster), profile.id).toBe(true)
      for (const id of profile.ruleIds) expect(ruleIds.has(id), `${profile.id}: ${id}`).toBe(true)
    }
  })
})

describe('book prices for bundled profiles', () => {
  it('every unedited profile costs what the book prints', async () => {
    const { loadBundledRules } = await import('@/lib/rules-loader')
    const { modelCost } = await import('@/lib/cost')
    const { profiles } = loadBundledProfiles()
    const rules = loadBundledRules().flatMap((f) => (f.result.ok ? f.result.rules : []))
    const wrong = profiles.filter((p) => {
      const cost = modelCost({ ...p, profileId: p.id }, rules, profiles)
      return p.bookPoints !== undefined && (!cost.known || cost.cost !== p.bookPoints)
    })
    expect(wrong.map((p) => p.id)).toEqual([])
  })
})
