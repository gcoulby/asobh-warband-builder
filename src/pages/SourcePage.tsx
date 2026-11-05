import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft, Download, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ProfileFromModelDialog } from '@/components/ProfileFromModelDialog'
import { RuleEditDialog } from '@/components/RuleEditDialog'
import { RuleList } from '@/components/RuleList'
import { SourceDetailsForm } from '@/components/SourceDetailsForm'
import { SourceProfileList } from '@/components/SourceProfileList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sourceKindLabels } from '@/data/source-options'
import { fileNameFor, jsonFileType, saveFile } from '@/lib/file-access'
import { editionById, isEditionId } from '@/lib/editions'
import { matchesRuleSearch } from '@/lib/rule-meta'
import { freeId, sourceFileText } from '@/lib/sources'
import { bundledSources } from '@/lib/sources-loader'
import type { SpecialRule } from '@/lib/schema'
import { useDataStore } from '@/stores/data-store'
import { NotFoundPage } from '@/pages/NotFoundPage'

/** One source: its details, rules and profiles, all editable, and a download of the whole source. */
export function SourcePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const source = useDataStore((s) => s.sources.find((x) => x.id === id))
  const allRules = useDataStore((s) => s.rules)
  const models = useDataStore((s) => s.models)
  const actions = useDataStore.getState()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<{ rule?: SpecialRule }>()
  const [deletingRuleId, setDeletingRuleId] = useState<string>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const origin = source?.origin
  const bundled = useMemo(() => (origin ? bundledSources().find((b) => b.id === origin) : undefined), [origin])

  if (!source) return <NotFoundPage what="source" />

  const ruleIds = new Set(source.rules.map((r) => r.id))
  const usingModels = models.filter((m) => m.ruleIds.some((r) => ruleIds.has(r)))
  const shownRules = source.rules
    .filter((r) => matchesRuleSearch(r, query))
    .sort((a, b) => a.name.localeCompare(b.name))
  const deletingRule = source.rules.find((r) => r.id === deletingRuleId)
  const game = isEditionId(source.game) ? editionById(source.game).label : source.game

  const download = () => {
    saveFile(new Blob([sourceFileText(source)], { type: 'application/json' }), fileNameFor(source.id, 'json'), jsonFileType).catch(() =>
      toast.error('The source could not be saved. Try again.'),
    )
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4">
      <Button asChild variant="ghost" className="self-start">
        <Link to="/sources">
          <ChevronLeft /> Sources
        </Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[1.75rem] leading-none font-bold">{source.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{sourceKindLabels[source.kind]}</Badge>
            {[game, source.author, source.publisher, source.version].filter(Boolean).join(' · ')}
          </p>
          {source.description && <p className="max-w-prose text-sm text-muted-foreground">{source.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={download}>
            <Download /> Download source
          </Button>
          {bundled && (
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              <RotateCcw /> Restore included version
            </Button>
          )}
          <Button variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2 /> Delete source
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rules" className="gap-3">
        <TabsList>
          <TabsTrigger value="rules">Rules {source.rules.length}</TabsTrigger>
          <TabsTrigger value="profiles">Profiles {source.profiles.length}</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Label htmlFor="source-rules-search" className="sr-only">
                Search rules
              </Label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="source-rules-search"
                type="search"
                placeholder="Search rules"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setEditing({})}>
              <Plus /> Add rule
            </Button>
          </div>
          {source.rules.length === 0 ? (
            <p className="text-muted-foreground">No rules yet. Add one to give your models something new.</p>
          ) : shownRules.length === 0 ? (
            <p className="text-muted-foreground">No rules match “{query}”.</p>
          ) : (
            <RuleList
              rules={shownRules}
              label={`Rules in ${source.name}`}
              onEdit={(ruleId) => setEditing({ rule: source.rules.find((r) => r.id === ruleId) })}
              onDelete={setDeletingRuleId}
            />
          )}
        </TabsContent>

        <TabsContent value="profiles" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Ready-made models, offered by roster under From the book in the builder's library.
            </p>
            <Button onClick={() => setProfileOpen(true)} disabled={models.length === 0}>
              <Plus /> Add from a library model
            </Button>
          </div>
          {source.profiles.length === 0 ? (
            <p className="text-muted-foreground">No profiles in this source.</p>
          ) : (
            <SourceProfileList
              rosters={source.rosters}
              profiles={source.profiles}
              rules={allRules}
              onDelete={(profileId) => {
                actions.deleteProfile(source.id, profileId)
                toast.success('Profile deleted')
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="details">
          <SourceDetailsForm
            key={source.id}
            source={source}
            onSave={(details) => {
              actions.updateSourceDetails(source.id, details)
              toast.success('Details saved')
            }}
          />
        </TabsContent>
      </Tabs>

      <RuleEditDialog
        open={editing !== undefined}
        rule={editing?.rule}
        takenIds={new Set(allRules.map((r) => r.id))}
        onOpenChange={(open) => !open && setEditing(undefined)}
        onSave={(rule) => {
          actions.saveRule(source.id, rule)
          setEditing(undefined)
          toast.success(editing?.rule ? 'Rule saved' : 'Rule added')
        }}
      />
      <ProfileFromModelDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        models={models}
        rosters={source.rosters}
        onSave={(model, choice) => {
          const taken = new Set(useDataStore.getState().rosters.map((r) => r.id))
          const roster =
            'newLabel' in choice ? { id: freeId(choice.newLabel, taken, `${source.id}-`), label: choice.newLabel } : undefined
          const rosterId = roster?.id ?? ('id' in choice ? choice.id : '')
          const profileIds = new Set(useDataStore.getState().profiles.map((p) => p.id))
          actions.saveProfile(
            source.id,
            {
              id: freeId(model.name, profileIds, `${rosterId}-`),
              roster: rosterId,
              name: model.name,
              quality: model.quality,
              combat: model.combat,
              ruleIds: [...model.ruleIds],
            },
            roster,
          )
          toast.success(`${model.name} added as a profile`)
        }}
      />
      <ConfirmDialog
        open={deletingRule !== undefined}
        onOpenChange={(open) => !open && setDeletingRuleId(undefined)}
        title={`Delete ${deletingRule?.name ?? 'rule'}?`}
        description="Models that have this rule keep it, but show an unknown cost until a source provides it again."
        confirmLabel="Delete rule"
        onConfirm={() => {
          if (deletingRule) actions.deleteRule(source.id, deletingRule.id)
          setDeletingRuleId(undefined)
          toast.success('Rule deleted')
        }}
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restore the included version?"
        description="Your edits to this source's details, rules and profiles are replaced by the version that comes with the builder. Download it first to keep a copy."
        confirmLabel="Restore"
        onConfirm={() => {
          if (bundled) actions.saveSource(bundled)
          toast.success('Included version restored')
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${source.name}?`}
        description={
          usingModels.length > 0
            ? `${usingModels.length} of your models use its rules. They keep them, but show unknown costs until you add the source again.`
            : 'Its rules and profiles are removed. You can add it again later.'
        }
        confirmLabel="Delete source"
        onConfirm={() => {
          actions.deleteSource(source.id)
          toast.success(`${source.name} deleted`)
          void navigate('/sources')
        }}
      />
    </main>
  )
}
