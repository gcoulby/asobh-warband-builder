import { useMemo, useState } from 'react'
import { Copy, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EditorSheet } from '@/components/EditorSheet'
import { EmptyState } from '@/components/EmptyState'
import { ModelRow } from '@/components/ModelRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModelPanelContainer } from '@/containers/ModelPanelContainer'
import { useDeleteModel } from '@/hooks/use-delete-model'
import { useImageUrls } from '@/hooks/use-image-urls'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { modelCost } from '@/lib/cost'
import type { Model } from '@/lib/schema'
import { useDataStore } from '@/stores/data-store'

export function LibraryPage() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const models = useDataStore((s) => s.models)
  const rules = useDataStore((s) => s.rules)
  const warbands = useDataStore((s) => s.warbands)
  const duplicateModel = useDataStore((s) => s.duplicateModel)
  const deleteModel = useDeleteModel()
  const imageUrls = useImageUrls(useMemo(() => models.map((m) => m.imageId), [models]))

  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<string>()
  const createModel = useDataStore((s) => s.createModel)
  const startNew = () => setEditing(createModel({ name: 'New model' }))
  const [deleting, setDeleting] = useState<Model>()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...models].sort((a, b) => a.name.localeCompare(b.name))
    if (!q) return sorted
    return sorted.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.ruleIds.some((id) => (rules.find((r) => r.id === id)?.name ?? id).toLowerCase().includes(q)),
    )
  }, [models, rules, query])

  const usageOf = (modelId: string) => warbands.filter((w) => w.entries.some((e) => e.modelId === modelId)).length

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[1.75rem] leading-none font-bold">
          Library <span className="text-base text-muted-foreground tabular-nums">{models.length}</span>
        </h1>
        <Button onClick={startNew}>
          <Plus /> New model
        </Button>
      </div>

      {models.length > 0 && (
        <div className="relative max-w-md">
          <Label htmlFor="library-search" className="sr-only">
            Search models
          </Label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="library-search"
            type="search"
            placeholder="Search by name or special rule"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {models.length === 0 ? (
        <EmptyState
          title="No models yet. Add your first model."
          action={
            <Button onClick={startNew}>
              <Plus /> New model
            </Button>
          }
        >
          Every model you make goes here, ready to add to any warband.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No models match “{query}”. Try another name or rule.</p>
      ) : (
        <ul className="overflow-hidden rounded-sm border bg-card" aria-label="Library models">
          {filtered.map((model) => {
            const usage = usageOf(model.id)
            return (
              <ModelRow
                key={model.id}
                model={model}
                rules={rules}
                cost={modelCost(model, rules)}
                imageUrl={model.imageId ? imageUrls.get(model.imageId) : undefined}
                note={usage > 0 ? `In ${usage} ${usage === 1 ? 'warband' : 'warbands'}` : 'Not in a warband'}
                onOpen={() => setEditing(model.id)}
                className="last:border-b-0"
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Duplicate ${model.name}`}
                      onClick={() => {
                        duplicateModel(model.id)
                        toast.success('Model duplicated')
                      }}
                    >
                      <Copy />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-destructive"
                      aria-label={`Delete ${model.name}`}
                      onClick={() => setDeleting(model)}
                    >
                      <Trash2 />
                    </Button>
                  </>
                }
              />
            )
          })}
        </ul>
      )}

      <EditorSheet
        open={Boolean(editing)}
        title="Edit model"
        side={isDesktop ? 'right' : 'bottom'}
        onOpenChange={(open) => !open && setEditing(undefined)}
      >
        {editing && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ModelPanelContainer key={editing} modelId={editing} />
          </div>
        )}
      </EditorSheet>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title={`Delete ${deleting?.name ?? 'model'}?`}
        description={
          deleting && usageOf(deleting.id) > 0
            ? `It is used in ${usageOf(deleting.id)} ${usageOf(deleting.id) === 1 ? 'warband' : 'warbands'} and will be removed from them. This cannot be undone.`
            : 'This cannot be undone.'
        }
        confirmLabel="Delete model"
        onConfirm={() => {
          if (!deleting) return
          deleteModel(deleting.id)
          setDeleting(undefined)
          toast.success('Model deleted')
        }}
      />
    </main>
  )
}
