import type { Ref } from 'react'
import { ImageDown } from 'lucide-react'
import { ModelCard } from '@/components/ModelCard'
import type { RosterRow } from '@/components/RosterRow'
import { Button } from '@/components/ui/button'
import type { PaperSize, PrintNoncombatants } from '@/hooks/use-prefs'
import { isNoncombatant, type WarbandTotals } from '@/lib/cost'
import type { SpecialRule, Warband } from '@/lib/schema'
import { rosterLabel } from '@/data/warband-options'
import { cn } from '@/lib/utils'

interface PrintSheetProps {
  warband: Warband
  rows: readonly RosterRow[]
  totals: WarbandTotals
  rules: readonly SpecialRule[]
  paperSize: PaperSize
  sheetRef: Ref<HTMLDivElement>
  onExportCard: (node: HTMLElement, name: string) => void
  /** Noncombatants go after the rest: as cards, as one summary line, or not at all. */
  noncombatantMode: PrintNoncombatants
}

/** Printable roster sheet: warband header and one compact card per row, two up. */
export function PrintSheet({
  warband,
  rows,
  totals,
  rules,
  paperSize,
  sheetRef,
  onExportCard,
  noncombatantMode,
}: PrintSheetProps) {
  const fighters = rows.filter((r) => !isNoncombatant(r.cost))
  const noncombatants = rows.filter((r) => isNoncombatant(r.cost))
  const noncombatantModels = noncombatants.reduce((sum, r) => sum + r.entry.quantity, 0)
  const noncombatantPoints = noncombatants.reduce(
    (sum, r) => sum + (r.cost.known ? r.cost.cost * r.entry.quantity : 0),
    0,
  )

  const card = (row: RosterRow) => (
    <li key={row.entry.modelId} className="flex break-inside-avoid flex-col gap-1">
      <div data-card={row.entry.modelId}>
        <ModelCard
          variant="print"
          model={row.model}
          rules={rules}
          cost={row.cost}
          quantity={row.entry.quantity}
          imageUrl={row.imageUrl}
        />
      </div>
      <Button
        variant="ghost"
        className="self-end text-black hover:bg-black/5 print:hidden"
        onClick={(e) => {
          const node = e.currentTarget.parentElement?.querySelector<HTMLElement>('[data-card]')
          if (node) onExportCard(node, row.model.name)
        }}
      >
        <ImageDown /> Export card as PNG
      </Button>
    </li>
  )

  return (
    <div
      ref={sheetRef}
      className={cn(
        'paper mx-auto bg-white p-[10mm] text-black shadow-sm print:w-auto print:max-w-none print:p-0 print:shadow-none',
        paperSize === 'a4' ? 'w-[210mm] max-w-full' : 'w-[8.5in] max-w-full',
      )}
    >
      <header className="mb-4 flex items-end justify-between gap-4 border-b-2 border-black pb-2">
        <div>
          <h1 className="font-display text-3xl leading-tight font-bold">{warband.name}</h1>
          {(warband.roster || warband.theme) && (
            <p className="text-sm">{[rosterLabel(warband.roster), warband.theme].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-display text-3xl leading-none font-bold tabular-nums">
            {totals.total}
            {totals.hasUnknown && '+'} / {warband.pointsCap} pts
          </p>
          <p className="text-sm tabular-nums">
            {totals.modelCount} {totals.modelCount === 1 ? 'model' : 'models'} · {totals.groupCount}{' '}
            {totals.groupCount === 1 ? 'group' : 'groups'}
            {totals.noncombatantCount > 0 &&
              ` · ${totals.noncombatantCount} ${totals.noncombatantCount === 1 ? 'noncombatant' : 'noncombatants'}`}
          </p>
        </div>
      </header>
      <ul className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 print:grid-cols-2">
        {fighters.map(card)}
      </ul>
      {noncombatants.length > 0 && noncombatantMode === 'all' && (
        <section className="mt-4 break-inside-avoid">
          <h2 className="mb-2 border-b border-black/40 pb-1 font-display text-lg font-bold">
            Noncombatants <span className="text-sm font-semibold">({noncombatantModels})</span>
          </h2>
          <ul className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 print:grid-cols-2">{noncombatants.map(card)}</ul>
        </section>
      )}
      {noncombatants.length > 0 && noncombatantMode === 'summary' && (
        <p className="mt-4 border-t border-black/40 pt-2 text-sm">
          <span className="font-bold">
            {noncombatantModels} {noncombatantModels === 1 ? 'noncombatant' : 'noncombatants'}:
          </span>{' '}
          {noncombatants
            .map((r) => (r.entry.quantity > 1 ? `${r.model.name} ×${r.entry.quantity}` : r.model.name))
            .join(', ')}
          {' · '}
          <span className="tabular-nums">{noncombatantPoints} pts</span>
        </p>
      )}
    </div>
  )
}
