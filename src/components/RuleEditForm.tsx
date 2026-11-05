import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ruleCategoryOptions } from '@/data/source-options'
import { ruleTagLabels } from '@/lib/rule-meta'
import { freeId } from '@/lib/sources'
import { RULE_TAGS, ruleTagSchema, type SpecialRule } from '@/lib/schema'

interface RuleEditFormProps {
  rule?: SpecialRule
  takenIds: ReadonlySet<string>
  onCancel: () => void
  onSave: (rule: SpecialRule) => void
}

const MAX_SUMMARY_LENGTH = 400

/** The fields of one rule, with the dialog's title and buttons. Mounted fresh for each rule. */
export function RuleEditForm({ rule, takenIds, onCancel, onSave }: RuleEditFormProps) {
  const [name, setName] = useState(rule?.name ?? '')
  const [cost, setCost] = useState(String(rule?.cost ?? 0))
  const [category, setCategory] = useState(rule?.category ?? 'Trait')
  const [tags, setTags] = useState<string[]>(rule?.tags ?? [])
  const [rare, setRare] = useState(rule?.rare === undefined ? '' : String(rule.rare))
  const [page, setPage] = useState(rule?.page ?? '')
  const [summary, setSummary] = useState(rule?.summary ?? '')
  const [text, setText] = useState(rule?.text ?? '')
  const costNumber = Number(cost)
  const rareNumber = Number(rare)
  const costValid = cost.trim() !== '' && Number.isInteger(costNumber)
  const rareValid = rare.trim() === '' || (Number.isInteger(rareNumber) && rareNumber > 0)
  const valid = name.trim() !== '' && costValid && rareValid

  return (
    <>
      <DialogHeader>
        <DialogTitle>{rule ? `Edit ${rule.name}` : 'New rule'}</DialogTitle>
        <DialogDescription>
          Costs feed the points formula. A summary is a line in your own words; full text is for your own copy only and
          is never put in share links.
        </DialogDescription>
      </DialogHeader>
      <form
        id="rule-edit"
        className="-mx-4 min-h-0 overflow-y-auto px-4 py-1"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          const saved: SpecialRule = {
            ...(rule ?? {}),
            id: rule?.id ?? freeId(name, takenIds),
            name: name.trim(),
            cost: costNumber,
            summary: summary.trim(),
            category: category.trim() || undefined,
            page: page.trim() || undefined,
            tags: tags.flatMap((t) => {
              const parsed = ruleTagSchema.safeParse(t)
              return parsed.success ? [parsed.data] : []
            }),
            rare: rare.trim() ? rareNumber : undefined,
            text: text.trim() || undefined,
          }
          if (saved.tags?.length === 0) delete saved.tags
          for (const key of ['category', 'page', 'rare', 'text'] as const) if (saved[key] === undefined) delete saved[key]
          onSave(saved)
        }}
      >
        <FieldGroup className="grid gap-4 sm:grid-cols-[1fr_6rem]">
          <Field>
            <FieldLabel htmlFor="rule-name">Name</FieldLabel>
            <Input id="rule-name" value={name} autoComplete="off" maxLength={80} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field data-invalid={!costValid}>
            <FieldLabel htmlFor="rule-cost">Cost</FieldLabel>
            <Input id="rule-cost" type="number" inputMode="numeric" step={1} value={cost} aria-invalid={!costValid} onChange={(e) => setCost(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="rule-category">Kind</FieldLabel>
            <Input id="rule-category" list="rule-categories" value={category} autoComplete="off" onChange={(e) => setCategory(e.target.value)} />
            <datalist id="rule-categories">
              {ruleCategoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field>
            <FieldLabel htmlFor="rule-page">Page</FieldLabel>
            <Input id="rule-page" value={page} autoComplete="off" onChange={(e) => setPage(e.target.value)} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel id="rule-tags-label">Markers</FieldLabel>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              spacing={0}
              value={tags}
              onValueChange={setTags}
              aria-labelledby="rule-tags-label"
              className="flex-wrap"
            >
              {RULE_TAGS.map((t) => (
                <ToggleGroupItem key={t} value={t} aria-label={ruleTagLabels[t]} title={ruleTagLabels[t]}>
                  {t}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field data-invalid={!rareValid} className="sm:col-span-2">
            <FieldLabel htmlFor="rule-rare">Rare limit</FieldLabel>
            <Input
              id="rule-rare"
              type="number"
              inputMode="numeric"
              min={1}
              value={rare}
              placeholder="No limit"
              aria-invalid={!rareValid}
              className="w-32"
              onChange={(e) => setRare(e.target.value)}
            />
            <FieldDescription>Most models in a warband that may have this rule.</FieldDescription>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="rule-summary">Summary</FieldLabel>
            <Textarea id="rule-summary" rows={2} maxLength={MAX_SUMMARY_LENGTH} value={summary} onChange={(e) => setSummary(e.target.value)} />
            <FieldDescription>One line, in your own words. Shown in pickers and on the print sheet.</FieldDescription>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="rule-text">Full text</FieldLabel>
            <Textarea id="rule-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
            <FieldDescription>Optional, for your own use. Printed in place of the summary when set.</FieldDescription>
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" form="rule-edit" disabled={!valid}>
          {rule ? 'Save rule' : 'Add rule'}
        </Button>
      </DialogFooter>
    </>
  )
}
