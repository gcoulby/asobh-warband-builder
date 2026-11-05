import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { ChevronLeft, ImageDown, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { PrintSheet } from '@/components/PrintSheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useImageUrls } from '@/hooks/use-image-urls'
import { printNoncombatantOptions } from '@/data/warband-options'
import { usePrefs, type PaperSize, type PrintNoncombatants } from '@/hooks/use-prefs'
import { useRoster } from '@/hooks/use-roster'
import { useWarbandFiles } from '@/hooks/use-warband-files'
import { useDataStore } from '@/stores/data-store'
import { NotFoundPage } from '@/pages/NotFoundPage'

const isPaperSize = (value: string): value is PaperSize => value === 'a4' || value === 'letter'
const isPrintNoncombatants = (value: string): value is PrintNoncombatants =>
  printNoncombatantOptions.some((o) => o.value === value)

export function PrintPage() {
  const { id = '' } = useParams()
  const [prefs, setPrefs] = usePrefs()
  const warband = useDataStore((s) => s.warbands.find((w) => w.id === id))
  const models = useDataStore((s) => s.models)
  const rules = useDataStore((s) => s.rules)
  const imageUrls = useImageUrls(useMemo(() => models.map((m) => m.imageId), [models]))
  const view = useRoster(warband, models, rules, imageUrls)
  const { exportPng } = useWarbandFiles()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.paper = prefs.paperSize
    return () => {
      delete root.dataset.paper
    }
  }, [prefs.paperSize])

  if (!warband || !view) return <NotFoundPage what="warband" />

  const exportNode = (node: HTMLElement, name: string) => {
    exportPng(node, name)
      .then((outcome) => outcome !== 'cancelled' && toast.success('PNG exported'))
      .catch(() => toast.error('The PNG could not be made. Try again.'))
  }

  return (
    <div className="min-h-dvh bg-muted print:min-h-0 print:bg-white">
      <div className="sticky top-0 z-10 border-b bg-background print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-2 py-2 sm:px-4">
          <Button asChild variant="ghost">
            <Link to={`/warband/${warband.id}`}>
              <ChevronLeft /> Back to warband
            </Link>
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Label htmlFor="paper-size" className="sr-only">
              Paper size
            </Label>
            <Select value={prefs.paperSize} onValueChange={(v) => isPaperSize(v) && setPrefs({ paperSize: v })}>
              <SelectTrigger id="paper-size" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="letter">US Letter</SelectItem>
              </SelectContent>
            </Select>
            {view.totals.noncombatantCount > 0 && (
              <>
                <Label htmlFor="print-noncombatants" className="sr-only">
                  Noncombatants on the sheet
                </Label>
                <Select
                  value={prefs.printNoncombatants}
                  onValueChange={(v) => isPrintNoncombatants(v) && setPrefs({ printNoncombatants: v })}
                >
                  <SelectTrigger id="print-noncombatants" className="w-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {printNoncombatantOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <Button variant="outline" onClick={() => sheetRef.current && exportNode(sheetRef.current, warband.name)}>
              <ImageDown /> Export roster as PNG
            </Button>
            <Button onClick={() => window.print()}>
              <Printer /> Print or save PDF
            </Button>
          </div>
        </div>
      </div>
      <main className="px-2 py-4 sm:px-4 print:p-0">
        <PrintSheet
          warband={warband}
          rows={view.rows}
          totals={view.totals}
          rules={rules}
          paperSize={prefs.paperSize}
          sheetRef={sheetRef}
          onExportCard={exportNode}
          noncombatantMode={prefs.printNoncombatants}
        />
      </main>
    </div>
  )
}
