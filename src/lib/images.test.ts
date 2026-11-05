import { describe, expect, it } from 'vitest'
import { fitWithin, initials } from '@/lib/images'

describe('fitWithin', () => {
  it.each([
    [4000, 3000, { width: 800, height: 600 }],
    [3000, 4000, { width: 600, height: 800 }],
    [640, 800, { width: 640, height: 800 }],
    [200, 250, { width: 200, height: 250 }],
    [8000, 1, { width: 800, height: 1 }],
  ])('%i by %i', (w, h, expected) => {
    expect(fitWithin(w, h, 800)).toEqual(expected)
  })
})

describe('initials', () => {
  it.each([
    ['Goblin spearman', 'GS'],
    ['Orc', 'OR'],
    ['  the big bad wolf ', 'TW'],
    ['', '?'],
  ])('%s gives %s', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
