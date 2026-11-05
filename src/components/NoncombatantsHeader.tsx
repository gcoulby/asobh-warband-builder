import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { NONCOMBATANT_MAX_COST } from '@/data/rule-names'

interface NoncombatantsHeaderProps {
  count: number
  shown: boolean
  onShownChange: (shown: boolean) => void
}

/** Heads the noncombatant group at the foot of a model list, with a switch to show or hide it. */
export function NoncombatantsHeader({ count, shown, onShownChange }: NoncombatantsHeaderProps) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-1.5">
      <p className="text-xs">
        <span className="font-bold">Noncombatants</span>{' '}
        <span className="text-muted-foreground tabular-nums">
          {count} · {NONCOMBATANT_MAX_COST} points or fewer
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
          Show
        </Label>
        <Switch id={id} size="sm" checked={shown} onCheckedChange={onShownChange} />
      </div>
    </div>
  )
}
