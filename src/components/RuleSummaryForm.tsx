import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ruleSource } from '@/lib/rule-meta'
import type { SpecialRule } from '@/lib/schema'

const MAX_SUMMARY_LENGTH = 400

interface RuleSummaryFormProps {
  rule: SpecialRule
  onCancel: () => void
  onSave: (summary: string) => void
}

/** The summary field, with the dialog's title and buttons. Mounted fresh for each rule. */
export function RuleSummaryForm({ rule, onCancel, onSave }: RuleSummaryFormProps) {
  const [summary, setSummary] = useState(rule.summary)
  const source = ruleSource(rule)
  return (
    <>
      <DialogHeader>
        <DialogTitle>{rule.name}</DialogTitle>
        <DialogDescription>
          Say what it does in a line, in your own words{source ? `. The full rule is in ${source}` : ''}.
        </DialogDescription>
      </DialogHeader>
      <form
        id="rule-summary"
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(summary)
        }}
      >
        <Label htmlFor="rule-summary-text">Summary</Label>
        <Textarea
          id="rule-summary-text"
          rows={3}
          maxLength={MAX_SUMMARY_LENGTH}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" form="rule-summary">
          Save summary
        </Button>
      </DialogFooter>
    </>
  )
}
