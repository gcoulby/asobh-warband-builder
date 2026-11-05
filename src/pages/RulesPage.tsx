import { useMemo, useState } from 'react'
import { Download, FileJson, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CreditsFooter } from '@/components/CreditsFooter'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { RuleList } from '@/components/RuleList'
import { RulesImportDialog } from '@/components/RulesImportDialog'
import { RuleSummaryDialog } from '@/components/RuleSummaryDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { jsonFileType, saveFile } from '@/lib/file-access'
import { loadBundledRules, rulesTemplate } from '@/lib/rules-loader'
import { ruleSections } from '@/lib/editions'
import { ruleKeywords } from '@/lib/rule-meta'
import { useDataStore } from '@/stores/data-store'

export function RulesPage() {
  const rules = useDataStore((s) => s.rules)
  const importRules = useDataStore((s) => s.importRules)
  const clearRules = useDataStore((s) => s.clearRules)
  const setRuleSummary = useDataStore((s) => s.setRuleSummary)
  const [editingId, setEditingId] = useState<string>()
  const editing = editingId ? rules.find((r) => r.id === editingId) : undefined
  const bundled = useMemo(() => loadBundledRules(), [])

  const [query, setQuery] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rules
    return rules.filter((r) => [r.name, ...ruleKeywords(r)].some((text) => text.toLowerCase().includes(q)))
  }, [rules, query])

  const downloadRules = () => {
    const text = JSON.stringify({ name: 'My rules', rules }, null, 2)
    saveFile(new Blob([text], { type: 'application/json' }), 'my-rules.json', jsonFileType).catch(() =>
      toast.error('The rules could not be saved. Try again.'),
    )
  }

  const downloadTemplate = () => {
    saveFile(new Blob([rulesTemplate()], { type: 'application/json' }), 'rules-template.json', jsonFileType).catch(() =>
      toast.error('The template could not be saved. Try again.'),
    )
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[1.75rem] leading-none font-bold">Rules</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download /> Download template
          </Button>
          <Button onClick={() => setImportOpen(true)}>
            <FileJson /> Import rules
          </Button>
        </div>
      </div>

      <section aria-labelledby="cost-heading" className="rounded-sm border bg-card p-3">
        <h2 id="cost-heading" className="font-display text-xl font-semibold">
          How costs work
        </h2>
        <p className="text-muted-foreground">
          A model costs ((Combat × 5 + its rules' costs) × (7 − Quality)) ÷ 2 points, rounded, and never less than 1.
          Advanced SBH allows up to half the points cap on Personalities. SBH Revised allows a third, and half on
          Animals and Swarms.
        </p>
      </section>

      {bundled.length > 0 && (
        <section aria-labelledby="bundled-heading" className="flex flex-col gap-2">
          <h2 id="bundled-heading" className="font-display text-xl font-semibold">
            Included rules files
          </h2>
          <ul className="flex flex-col gap-2">
            {bundled.map(({ fileName, result }) => (
              <li key={fileName} className="flex items-center justify-between gap-3 rounded-sm border bg-card p-3">
                <span>
                  <span className="font-bold">{result.ok ? (result.name ?? fileName) : fileName}</span>
                  <span className="block text-sm text-muted-foreground">
                    {result.ok
                      ? `${result.rules.length} rules${result.errors.length ? `, ${result.errors.length} invalid entries skipped` : ''}`
                      : result.error}
                  </span>
                </span>
                <Button
                  variant="outline"
                  disabled={!result.ok}
                  onClick={() => {
                    if (!result.ok) return
                    importRules(result.rules)
                    toast.success('Rules imported')
                  }}
                >
                  Import rules
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rules.length === 0 ? (
        <EmptyState
          title="No rules yet. Import a rules file to give your models special rules."
          action={
            <Button onClick={() => setImportOpen(true)}>
              <FileJson /> Import rules
            </Button>
          }
        >
          A rules file lists each special rule with an id, name, cost and a one line summary in your own words.
          Download the template to start one.
        </EmptyState>
      ) : (
        <section aria-labelledby="rules-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="rules-heading" className="font-display text-xl font-semibold">
              {rules.length} special {rules.length === 1 ? 'rule' : 'rules'}
            </h2>
            <div className="flex flex-wrap gap-1">
              <Button variant="ghost" onClick={downloadRules}>
                <Download /> Download rules
              </Button>
              <Button variant="ghost" onClick={() => setClearOpen(true)}>
                <Trash2 /> Remove all rules
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Add a one line summary to any rule, in your own words, with the pencil button. Summaries show in the rule
            picker and on the print sheet. Download your rules to keep them or share them.
          </p>
          <div className="relative">
            <Label htmlFor="rules-search" className="sr-only">
              Search rules
            </Label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="rules-search"
              type="search"
              placeholder="Search rules"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No rules match “{query}”.</p>
          ) : (
            ruleSections(filtered).map((section) => (
              <section key={section.id} aria-labelledby={`rules-${section.id}`} className="flex flex-col gap-1.5">
                <h3 id={`rules-${section.id}`} className="font-display text-lg font-semibold">
                  {section.label}{' '}
                  <span className="text-sm text-muted-foreground tabular-nums">{section.rules.length}</span>
                </h3>
                <RuleList rules={section.rules} label={section.label} onEdit={setEditingId} />
              </section>
            ))
          )}
        </section>
      )}

      <RulesImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(result) => {
          importRules(result.rules)
          setImportOpen(false)
          toast.success('Rules imported')
        }}
      />

      <RuleSummaryDialog
        rule={editing}
        onOpenChange={(open) => !open && setEditingId(undefined)}
        onSave={(summary) => {
          if (editing) setRuleSummary(editing.id, summary)
          setEditingId(undefined)
          toast.success('Summary saved')
        }}
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Remove all rules?"
        description="Special rules are removed. Your models keep their rule choices but show unknown costs until you import rules again."
        confirmLabel="Remove all rules"
        onConfirm={() => {
          clearRules()
          toast.success('Rules removed')
        }}
      />
      <CreditsFooter className="mt-6" />
    </main>
  )
}
