import { describe, expect, it } from 'vitest'
import { decodeShare, encodeShare, shareUrl } from '@/lib/share'
import { bundleWarband, rekeyBundle } from '@/lib/bundle'
import { fakeRules, makeModel, makeWarband } from '@/test/fixtures'
import { compressToEncodedURIComponent } from 'lz-string'

const models = [
  makeModel({ id: 'a', ruleIds: ['fake-glow'], imageId: 'img-1' }),
  makeModel({ id: 'b', name: 'Unused' }),
]
const warband = makeWarband({ entries: [{ modelId: 'a', quantity: 2 }] })
const bundle = bundleWarband(warband, { models, rules: fakeRules })

describe('bundleWarband', () => {
  it('includes only the models and rules the warband uses', () => {
    expect(bundle.models.map((m) => m.id)).toEqual(['a'])
    expect(bundle.rules.map((r) => r.id)).toEqual(['fake-glow'])
  })
})

describe('share', () => {
  it('round trips a bundle, dropping image references', () => {
    const result = decodeShare(encodeShare(bundle))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.warband).toEqual(warband)
    expect(result.value.rules).toEqual(bundle.rules)
    expect(result.value.models[0]).not.toHaveProperty('imageId')
    expect(result.value.models[0]?.name).toBe('Test grunt')
  })

  it('leaves full rule text out of the link', () => {
    const withText = { ...bundle, rules: bundle.rules.map((r) => ({ ...r, text: 'Made-up full text.' })) }
    const decoded = decodeShare(encodeShare(withText))
    expect(decoded.ok && decoded.value.rules.every((r) => r.text === undefined)).toBe(true)
  })

  it('produces a URL-safe payload', () => {
    expect(encodeShare(bundle)).toMatch(/^[A-Za-z0-9+\-$_]+$/)
    expect(shareUrl(bundle, 'https://x.test', '/repo/')).toMatch(/^https:\/\/x\.test\/repo\/#\/s\//)
  })

  it.each([
    ['garbage', 'not-a-payload!!'],
    ['an empty string', ''],
    ['a truncated payload', encodeShare(bundle).slice(0, 20)],
    ['valid compression of the wrong shape', compressToEncodedURIComponent(JSON.stringify({ v: 1, bundle: {} }))],
  ])('gives a readable error for %s', (_label, payload) => {
    const result = decodeShare(payload)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/share link/)
  })
})

describe('rekeyBundle', () => {
  it('gives new ids and remaps entries', () => {
    let n = 0
    const imported = rekeyBundle(bundle, () => `new-${++n}`, 123)
    expect(imported.models[0]?.id).toBe('new-1')
    expect(imported.warband.id).toBe('new-2')
    expect(imported.warband.entries[0]?.modelId).toBe('new-1')
    expect(imported.warband.createdAt).toBe(123)
  })
})
