import { CostLabel } from '@/components/CostLabel'
import { ModelImage } from '@/components/ModelImage'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatQuality } from '@/data/profile-options'
import type { CostResult } from '@/lib/cost'
import type { Model } from '@/lib/schema'

export interface LibraryPickerItem {
  model: Model
  cost: CostResult
  imageUrl?: string
  ruleNames: string[]
}

interface LibraryPickerDialogProps {
  open: boolean
  items: readonly LibraryPickerItem[]
  onOpenChange: (open: boolean) => void
  onPick: (modelId: string) => void
}

/** Searchable list of library models to add to a warband. */
export function LibraryPickerDialog({ open, items, onOpenChange, onPick }: LibraryPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-3 p-0 sm:max-w-lg">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Add from library</DialogTitle>
          <DialogDescription>Search by name or special rule. Adding a model already in the roster adds one more.</DialogDescription>
        </DialogHeader>
        <Command className="rounded-none!">
          <CommandInput placeholder="Search models" />
          <CommandList className="max-h-[60dvh]">
            <CommandEmpty>No models match. Create models in the Library.</CommandEmpty>
            <CommandGroup>
              {items.map(({ model, cost, imageUrl, ruleNames }) => (
                <CommandItem
                  key={model.id}
                  value={`${model.name} ${model.id}`}
                  keywords={ruleNames}
                  onSelect={() => onPick(model.id)}
                  className="gap-3 py-2"
                >
                  <ModelImage name={model.name} imageUrl={imageUrl} className="w-10 shrink-0 rounded-[2px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-semibold">{model.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Quality {formatQuality(model.quality)} · Combat {model.combat}
                      {ruleNames.length > 0 && ` · ${ruleNames.join(', ')}`}
                    </p>
                  </div>
                  <CostLabel cost={cost} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
