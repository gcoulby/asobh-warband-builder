import { useMemo, useState } from 'react'
import { Download, FileJson, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { RuleList } from '@/components/RuleList'
import { RulesImportDialog } from '@/components/RulesImportDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { jsonFileType, saveFile } from '@/lib/file-access'
import { loadBundledRules, rulesTemplate } from '@/lib/rules-loader'
import { ruleKeywords } from '@/lib/rule-meta'
import { useDataStore } from '@/stores/data-store'

export function RulesPage() {
  const rules = useDataStore((s) => s.rules)
  const importRules = useDataStore((s) => s.importRules)
  const clearRules = useDataStore((s) => s.clearRules)
  const bundled = useMemo(() => loadBundledRules(), [])

  const [query, setQuery] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rules
    return rules.filter((r) => [r.name, ...ruleKeywords(r)].some((text) => text.toLowerCase().includes(q)))
  }, [rules, query])

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
          Up to half the points cap may go on Personalities.
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
            <Button variant="ghost" onClick={() => setClearOpen(true)}>
              <Trash2 /> Remove all rules
            </Button>
          </div>
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
            <RuleList rules={filtered} />
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
    </main>
  )
}
