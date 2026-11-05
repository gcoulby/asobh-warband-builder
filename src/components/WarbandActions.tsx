import { FileArchive, Link2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WarbandActionsProps {
  onPrint: () => void
  onExportZip: () => void
  onShare: () => void
}

/** Output actions for a warband, always on show beside the roster. */
export function WarbandActions({ onPrint, onExportZip, onShare }: WarbandActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Print and export">
      <Button variant="outline" size="sm" onClick={onPrint}>
        <Printer /> Print or PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onExportZip}>
        <FileArchive /> Export .zip
      </Button>
      <Button variant="outline" size="sm" onClick={onShare}>
        <Link2 /> Share link
      </Button>
    </div>
  )
}
