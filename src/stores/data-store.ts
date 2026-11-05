import { create } from 'zustand'
import { DEFAULT_POINTS_CAP, defaultProfile } from '@/data/profile-options'
import { rekeyBundle } from '@/lib/bundle'
import { flattenSources, placeRules, type Flattened } from '@/lib/sources'
import {
  emptyStoredData,
  type Model,
  type Profile,
  type Roster,
  type Source,
  type SpecialRule,
  type StoredData,
  type Warband,
  type WarbandBundle,
  type WarbandEntry,
} from '@/lib/schema'

export const newId = (): string => crypto.randomUUID()

export type ModelDraft = Omit<Model, 'id'>

export type WarbandSettings = Pick<
  Warband,
  'name' | 'theme' | 'roster' | 'strictRoster' | 'pointsCap' | 'edition' | 'sourceIds'
>

/** Details of a source that can be edited apart from its rules and profiles. */
export type SourceDetails = Omit<Source, 'id' | 'rules' | 'rosters' | 'profiles' | 'origin'>

interface DataState extends StoredData, Flattened {
  /** True once saved data has been read, so nothing is written before then. */
  hydrated: boolean
}

interface DataActions {
  hydrate: (data: StoredData) => void

  createWarband: (settings?: Partial<WarbandSettings>) => string
  updateWarband: (id: string, settings: WarbandSettings) => void
  deleteWarband: (id: string) => void

  addEntry: (warbandId: string, modelId: string) => void
  updateEntry: (warbandId: string, modelId: string, patch: Partial<Omit<WarbandEntry, 'modelId'>>) => void
  removeEntry: (warbandId: string, modelId: string) => void
  moveEntry: (warbandId: string, from: number, to: number) => void
  duplicateEntry: (warbandId: string, modelId: string) => string | undefined

  createModel: (draft?: Partial<ModelDraft>) => string
  saveModel: (model: Model) => void
  duplicateModel: (id: string) => string | undefined
  deleteModel: (id: string) => void

  /** Adds a source, or replaces the one with the same id. */
  saveSource: (source: Source) => void
  updateSourceDetails: (id: string, details: SourceDetails) => void
  deleteSource: (id: string) => void
  /** Adds a rule to a source, or replaces the rule with the same id there. */
  saveRule: (sourceId: string, rule: SpecialRule) => void
  deleteRule: (sourceId: string, ruleId: string) => void
  /** Adds a profile to a source, with its roster when that is new to the source. */
  saveProfile: (sourceId: string, profile: Profile, roster?: Roster) => void
  deleteProfile: (sourceId: string, profileId: string) => void

  importBundle: (bundle: WarbandBundle, imageIdMap?: ReadonlyMap<string, string>) => string
}

export type DataStore = DataState & DataActions

/** The persisted part of the store. Everything else is runtime only. */
export const selectStoredData = (state: DataStore): StoredData => ({
  schemaVersion: state.schemaVersion,
  warbands: state.warbands,
  models: state.models,
  sources: state.sources,
})

const touch = (warband: Warband): Warband => ({ ...warband, updatedAt: Date.now() })

/** Sources with the rules, profiles and rosters worked out from them. */
const withSources = (sources: Source[]): Pick<DataState, 'sources'> & Flattened => ({
  sources,
  ...flattenSources(sources),
})

/** Rule fields a source fills in. They are not stored on the rule inside a source. */
const storedRule = ({ edition: _e, book: _b, source: _s, ...rule }: SpecialRule): SpecialRule => rule

export const useDataStore = create<DataStore>()((set, get) => {
  const mapWarband = (id: string, update: (w: Warband) => Warband) =>
    set((s) => ({ warbands: s.warbands.map((w) => (w.id === id ? touch(update(w)) : w)) }))

  const mapSource = (id: string, update: (source: Source) => Source) =>
    set((s) => withSources(s.sources.map((source) => (source.id === id ? update(source) : source))))

  return {
    ...emptyStoredData(),
    ...flattenSources([]),
    hydrated: false,

    hydrate: (data) => set({ ...data, ...withSources(data.sources), hydrated: true }),

    createWarband: (settings = {}) => {
      const now = Date.now()
      const warband: Warband = {
        id: newId(),
        name: settings.name ?? 'New warband',
        theme: settings.theme,
        roster: settings.roster,
        strictRoster: settings.strictRoster,
        edition: settings.edition,
        sourceIds: settings.sourceIds,
        pointsCap: settings.pointsCap ?? DEFAULT_POINTS_CAP,
        entries: [],
        createdAt: now,
        updatedAt: now,
      }
      set((s) => ({ warbands: [warband, ...s.warbands] }))
      return warband.id
    },

    updateWarband: (id, settings) =>
      mapWarband(id, (w) => ({ ...w, ...settings, theme: settings.theme?.trim() || undefined })),

    deleteWarband: (id) => set((s) => ({ warbands: s.warbands.filter((w) => w.id !== id) })),

    addEntry: (warbandId, modelId) =>
      mapWarband(warbandId, (w) => {
        const existing = w.entries.find((e) => e.modelId === modelId)
        if (existing) {
          return {
            ...w,
            entries: w.entries.map((e) => (e.modelId === modelId ? { ...e, quantity: e.quantity + 1 } : e)),
          }
        }
        return { ...w, entries: [...w.entries, { modelId, quantity: 1 }] }
      }),

    updateEntry: (warbandId, modelId, patch) =>
      mapWarband(warbandId, (w) => ({
        ...w,
        entries: w.entries.map((e) => (e.modelId === modelId ? { ...e, ...patch } : e)),
      })),

    removeEntry: (warbandId, modelId) =>
      mapWarband(warbandId, (w) => ({ ...w, entries: w.entries.filter((e) => e.modelId !== modelId) })),

    moveEntry: (warbandId, from, to) =>
      mapWarband(warbandId, (w) => {
        if (from === to || from < 0 || to < 0 || from >= w.entries.length || to >= w.entries.length) return w
        const entries = [...w.entries]
        const [moved] = entries.splice(from, 1)
        if (moved) entries.splice(to, 0, moved)
        return { ...w, entries }
      }),

    duplicateEntry: (warbandId, modelId) => {
      const copyId = get().duplicateModel(modelId)
      if (!copyId) return undefined
      mapWarband(warbandId, (w) => {
        const index = w.entries.findIndex((e) => e.modelId === modelId)
        const source = w.entries[index]
        if (!source) return w
        const entries = [...w.entries]
        entries.splice(index + 1, 0, { modelId: copyId, quantity: source.quantity })
        return { ...w, entries }
      })
      return copyId
    },

    createModel: (draft = {}) => {
      const model: Model = {
        name: 'New model',
        quality: defaultProfile.quality,
        combat: defaultProfile.combat,
        ruleIds: [],
        ...draft,
        id: newId(),
      }
      set((s) => ({ models: [...s.models, model] }))
      return model.id
    },

    saveModel: (model) =>
      set((s) => ({
        models: s.models.some((m) => m.id === model.id)
          ? s.models.map((m) => (m.id === model.id ? model : m))
          : [...s.models, model],
      })),

    duplicateModel: (id) => {
      const source = get().models.find((m) => m.id === id)
      if (!source) return undefined
      return get().createModel({ ...source, name: `${source.name} copy` })
    },

    deleteModel: (id) =>
      set((s) => ({
        models: s.models.filter((m) => m.id !== id),
        warbands: s.warbands.map((w) =>
          w.entries.some((e) => e.modelId === id)
            ? touch({ ...w, entries: w.entries.filter((e) => e.modelId !== id) })
            : w,
        ),
      })),

    saveSource: (source) =>
      set((s) =>
        withSources(
          s.sources.some((x) => x.id === source.id)
            ? s.sources.map((x) => (x.id === source.id ? source : x))
            : [...s.sources, source],
        ),
      ),

    updateSourceDetails: (id, details) => mapSource(id, (source) => ({ ...source, ...details })),

    deleteSource: (id) => set((s) => withSources(s.sources.filter((x) => x.id !== id))),

    saveRule: (sourceId, rule) =>
      mapSource(sourceId, (source) => {
        const clean = storedRule(rule)
        return {
          ...source,
          rules: source.rules.some((r) => r.id === rule.id)
            ? source.rules.map((r) => (r.id === rule.id ? clean : r))
            : [...source.rules, clean],
        }
      }),

    deleteRule: (sourceId, ruleId) =>
      mapSource(sourceId, (source) => ({ ...source, rules: source.rules.filter((r) => r.id !== ruleId) })),

    saveProfile: (sourceId, profile, roster) =>
      mapSource(sourceId, (source) => ({
        ...source,
        rosters: roster && !source.rosters.some((r) => r.id === roster.id) ? [...source.rosters, roster] : source.rosters,
        profiles: source.profiles.some((p) => p.id === profile.id)
          ? source.profiles.map((p) => (p.id === profile.id ? profile : p))
          : [...source.profiles, profile],
      })),

    deleteProfile: (sourceId, profileId) =>
      mapSource(sourceId, (source) => {
        const profiles = source.profiles.filter((p) => p.id !== profileId)
        // A roster left with no profiles in a custom source goes too.
        const rosters =
          source.kind === 'custom' ? source.rosters.filter((r) => profiles.some((p) => p.roster === r.id)) : source.rosters
        return { ...source, profiles, rosters }
      }),

    importBundle: (bundle, imageIdMap) => {
      const imported = rekeyBundle(bundle, newId, Date.now())
      const models = imported.models.map((m) => {
        const imageId = m.imageId ? imageIdMap?.get(m.imageId) : undefined
        const { imageId: _old, ...rest } = m
        return imageId ? { ...rest, imageId } : rest
      })
      set((s) => ({
        warbands: [imported.warband, ...s.warbands],
        models: [...s.models, ...models],
        ...withSources(placeRules(s.sources, bundle.rules)),
      }))
      return imported.warband.id
    },
  }
})
