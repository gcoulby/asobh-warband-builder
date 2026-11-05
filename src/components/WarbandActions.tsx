import { FileArchive, Link2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface WarbandActionsProps {
  onPrint: () => void
  onExportZip: () => void
  onShare: () => void
}

const actions = [
  { key: 'print', label: 'Print or save PDF', Icon: Printer },
  { key: 'export', label: 'Export warband (.zip)', Icon: FileArchive },
  { key: 'share', label: 'Share link', Icon: Link2 },
] as const

/** Output actions for a warband as icon buttons, always on show in the warband header. */
export function WarbandActions({ onPrint, onExportZip, onShare }: WarbandActionsProps) {
  const handlers = { print: onPrint, export: onExportZip, share: onShare }
  return (
    <div className="flex" role="group" aria-label="Print and export">
      {actions.map(({ key, label, Icon }) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handlers[key]} aria-label={label}>
              <Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
