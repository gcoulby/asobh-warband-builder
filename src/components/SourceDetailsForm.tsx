import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { editions } from '@/data/editions'
import { sourceKindOptions } from '@/data/source-options'
import { isSourceKind } from '@/lib/sources'
import type { Source } from '@/lib/schema'
import type { SourceDetails } from '@/stores/data-store'

interface SourceDetailsFormProps {
  source: Source
  onSave: (details: SourceDetails) => void
}

const detailsOf = (s: Source): SourceDetails => ({
  name: s.name,
  shortName: s.shortName,
  kind: s.kind,
  game: s.game,
  usableIn: s.usableIn,
  author: s.author,
  publisher: s.publisher,
  url: s.url,
  version: s.version,
  description: s.description,
})

const text = (value: string) => value.trim() || undefined

/** Edits a source's name, kind, game and publishing details. Rules and profiles are edited on their own tabs. */
export function SourceDetailsForm({ source, onSave }: SourceDetailsFormProps) {
  const [draft, setDraft] = useState<SourceDetails>(() => detailsOf(source))
  const set = (patch: Partial<SourceDetails>) => setDraft((d) => ({ ...d, ...patch }))
  const field = (key: 'shortName' | 'author' | 'publisher' | 'url' | 'version') => ({
    id: `source-${key}`,
    value: draft[key] ?? '',
    autoComplete: 'off',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set({ [key]: e.target.value }),
  })
  const otherGames = editions.filter((e) => e.id !== draft.game)

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!draft.name.trim()) return
        onSave({
          ...draft,
          name: draft.name.trim(),
          shortName: text(draft.shortName ?? ''),
          author: text(draft.author ?? ''),
          publisher: text(draft.publisher ?? ''),
          url: text(draft.url ?? ''),
          version: text(draft.version ?? ''),
          description: text(draft.description ?? ''),
          usableIn: draft.usableIn?.filter((g) => g !== draft.game).length ? draft.usableIn.filter((g) => g !== draft.game) : undefined,
        })
      }}
    >
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="source-name">Name</FieldLabel>
          <Input id="source-name" value={draft.name} autoComplete="off" onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel htmlFor="source-shortName">Short name</FieldLabel>
          <Input {...field('shortName')} placeholder="Optional, used in lists" />
        </Field>
        <Field>
          <FieldLabel htmlFor="source-kind">Kind</FieldLabel>
          <Select value={draft.kind} onValueChange={(v) => isSourceKind(v) && set({ kind: v })}>
            <SelectTrigger id="source-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceKindOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="source-game">Game</FieldLabel>
          <Select value={draft.game} onValueChange={(v) => set({ game: v })}>
            <SelectTrigger id="source-game" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {editions.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {otherGames.map((g) => (
          <Field key={g.id} orientation="horizontal" className="sm:col-span-2">
            <Checkbox
              id={`source-usable-${g.id}`}
              checked={draft.usableIn?.includes(g.id) ?? false}
              onCheckedChange={(checked) =>
                set({
                  usableIn: checked
                    ? [...(draft.usableIn ?? []), g.id]
                    : (draft.usableIn ?? []).filter((id) => id !== g.id),
                })
              }
            />
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor={`source-usable-${g.id}`}>Also usable in {g.label}</FieldLabel>
              <FieldDescription>Its rules are offered there too, unless that game has its own rule of the same name.</FieldDescription>
            </div>
          </Field>
        ))}
        <Field>
          <FieldLabel htmlFor="source-author">Author</FieldLabel>
          <Input {...field('author')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="source-publisher">Publisher</FieldLabel>
          <Input {...field('publisher')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="source-url">Web address</FieldLabel>
          <Input {...field('url')} type="url" />
        </Field>
        <Field>
          <FieldLabel htmlFor="source-version">Version</FieldLabel>
          <Input {...field('version')} placeholder="Such as 2nd printing" />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="source-description">Description</FieldLabel>
          <Textarea
            id="source-description"
            rows={2}
            value={draft.description ?? ''}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" className="self-start" disabled={!draft.name.trim()}>
        Save details
      </Button>
    </form>
  )
}
