import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sourceKindLabels } from '@/data/source-options'
import { editionById, isEditionId } from '@/lib/editions'
import type { Source } from '@/lib/schema'

interface BundledSourcesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sources that ship with the app. */
  bundled: readonly Source[]
  /** Your sources, to show which are added already. */
  added: readonly Source[]
  onAdd: (source: Source) => void
}

const count = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`

/** The included sources, each added to your sources with one tap. */
export function BundledSourcesDialog({ open, onOpenChange, bundled, added, onAdd }: BundledSourcesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Included sources</DialogTitle>
          <DialogDescription>
            Rules and profiles that come with the builder. Adding one makes your own copy, which you can edit.
          </DialogDescription>
        </DialogHeader>
        {bundled.length === 0 && (
          <p className="text-sm text-muted-foreground">
            This copy of the builder has no included sources. Use Import source file to add one from a file.
          </p>
        )}
        <ul className="-mx-4 flex min-h-0 flex-col divide-y overflow-y-auto border-y px-4 empty:hidden">
          {bundled.map((source) => {
            const have = added.some((s) => s.id === source.id)
            const game = isEditionId(source.game) ? editionById(source.game).shortLabel : source.game
            return (
              <li key={source.id} className="flex items-center gap-3 py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{source.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[game, sourceKindLabels[source.kind], count(source.rules.length, 'rule'), count(source.profiles.length, 'profile')].join(
                      ' · ',
                    )}
                  </span>
                </span>
                {have ? (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Check className="size-4" aria-hidden="true" /> Added
                  </span>
                ) : (
                  <Button size="sm" onClick={() => onAdd(source)}>
                    <Plus /> Add
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
