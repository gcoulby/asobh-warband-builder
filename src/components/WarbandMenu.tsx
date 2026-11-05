import { EllipsisVertical, FileArchive, Link2, Printer, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WarbandMenuProps {
  onSettings: () => void
  onShare: () => void
  onPrint: () => void
  onExportZip: () => void
  onDelete: () => void
}

export function WarbandMenu({ onSettings, onShare, onPrint, onExportZip, onDelete }: WarbandMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Warband actions">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onSelect={onSettings}>
          <Settings /> Warband settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onShare}>
          <Link2 /> Share link
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPrint}>
          <Printer /> Print, PDF and PNG
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportZip}>
          <FileArchive /> Export warband (.zip)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 /> Delete warband
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
