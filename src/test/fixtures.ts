import type { Model, SpecialRule, Warband } from '@/lib/schema'

/**
 * Fake fixtures for tests. The names and numbers are made up and do not come
 * from any rulebook.
 */

export const fakeRules: SpecialRule[] = [
  { id: 'fake-glow', name: 'Glows faintly', cost: 5, summary: 'Test rule.' },
  { id: 'fake-hop', name: 'Hops', cost: 7, summary: 'Test rule.', page: '99' },
  { id: 'fake-free', name: 'Free rule', cost: 0, summary: 'Test rule.' },
  { id: 'fake-drawback', name: 'Drawback', cost: -3, summary: 'Test rule.' },
  { id: 'fake-hero', name: 'Heroic glow', cost: 4, summary: 'Test rule.', tags: ['P'] },
  { id: 'fake-chief', name: 'Bossy', cost: 10, summary: 'Test rule.', tags: ['L', 'P'] },
  { id: 'fake-captain', name: 'Shouty', cost: 8, summary: 'Test rule.', tags: ['L'] },
  { id: 'fake-rare', name: 'Rare hat', cost: 2, summary: 'Test rule.', rare: 2 },
  // Named after the rulebook terms the builder checks by name. Costs are made up.
  { id: 'fake-leader', name: 'Leader', cost: 9, summary: 'Test rule.', tags: ['L', 'P'] },
  { id: 'fake-unique', name: 'Unique', cost: 0, summary: 'Test rule.' },
]

export const makeModel = (overrides: Partial<Model> = {}): Model => ({
  id: 'm1',
  name: 'Test grunt',
  quality: 4,
  combat: 3,
  ruleIds: [],
  ...overrides,
})

export const makeWarband = (overrides: Partial<Warband> = {}): Warband => ({
  id: 'w1',
  name: 'Test band',
  pointsCap: 400,
  entries: [],
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})
