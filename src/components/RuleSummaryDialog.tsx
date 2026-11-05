import { RuleSummaryForm } from '@/components/RuleSummaryForm'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { SpecialRule } from '@/lib/schema'

interface RuleSummaryDialogProps {
  /** The rule being edited. The dialog is open while this is set. */
  rule?: SpecialRule
  onOpenChange: (open: boolean) => void
  onSave: (summary: string) => void
}

/** Edits one rule's summary, which shows in the pickers and on the print sheet. */
export function RuleSummaryDialog({ rule, onOpenChange, onSave }: RuleSummaryDialogProps) {
  return (
    <Dialog open={rule !== undefined} onOpenChange={onOpenChange}>
      <DialogContent>
        {rule && <RuleSummaryForm key={rule.id} rule={rule} onCancel={() => onOpenChange(false)} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}
