import { RuleEditForm } from '@/components/RuleEditForm'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { SpecialRule } from '@/lib/schema'

interface RuleEditDialogProps {
  open: boolean
  /** The rule to edit, or undefined to add a new one. */
  rule?: SpecialRule
  /** Ids in use, so a new rule gets a free one. */
  takenIds: ReadonlySet<string>
  onOpenChange: (open: boolean) => void
  onSave: (rule: SpecialRule) => void
}

/** Adds or edits one rule of a source. */
export function RuleEditDialog({ open, rule, takenIds, onOpenChange, onSave }: RuleEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        {open && (
          <RuleEditForm key={rule?.id ?? 'new'} rule={rule} takenIds={takenIds} onCancel={() => onOpenChange(false)} onSave={onSave} />
        )}
      </DialogContent>
    </Dialog>
  )
}
