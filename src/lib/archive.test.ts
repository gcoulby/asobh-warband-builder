import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { buildArchive, readArchive } from '@/lib/archive'
import { bundleWarband } from '@/lib/bundle'
import { fakeRules, makeModel, makeWarband } from '@/test/fixtures'

const models = [makeModel({ id: 'a', imageId: 'img-1' }), makeModel({ id: 'b', imageId: 'img-2' })]
const warband = makeWarband({
  entries: [
    { modelId: 'a', quantity: 1 },
    { modelId: 'b', quantity: 4 },
  ],
})
const bundle = bundleWarband(warband, { models, rules: fakeRules })
const pixels = new Uint8Array([1, 2, 3, 4])

describe('archive', () => {
  it('stores images as separate files and round trips', async () => {
    const zipped = await buildArchive(bundle, [
      { id: 'img-1', type: 'image/webp', data: pixels },
      { id: 'img-2', type: 'image/jpeg', data: pixels },
    ])

    const zip = await JSZip.loadAsync(zipped)
    expect(Object.keys(zip.files).sort()).toEqual(['images/', 'images/img-1.webp', 'images/img-2.jpg', 'warband.json'])
    const json = await zip.file('warband.json')?.async('string')
    expect(json).not.toMatch(/base64/)

    const result = await readArchive(zipped)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.bundle.warband).toEqual(warband)
    expect(result.value.images.map((i) => [i.id, i.type])).toEqual([
      ['img-1', 'image/webp'],
      ['img-2', 'image/jpeg'],
    ])
    expect([...(result.value.images[0]?.data ?? [])]).toEqual([1, 2, 3, 4])
  })

  it('rejects a file that is not a zip', async () => {
    const result = await readArchive(new Uint8Array([9, 9, 9]))
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/not a zip/) })
  })

  it('rejects a zip without warband.json', async () => {
    const zip = new JSZip()
    zip.file('other.txt', 'x')
    const result = await readArchive(await zip.generateAsync({ type: 'uint8array' }))
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/no warband\.json/) })
  })

  it('rejects an invalid warband.json', async () => {
    const zip = new JSZip()
    zip.file('warband.json', JSON.stringify({ warband: { id: 1 } }))
    const result = await readArchive(await zip.generateAsync({ type: 'uint8array' }))
    expect(result.ok).toBe(false)
  })
})
