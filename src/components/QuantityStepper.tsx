import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  label: string
  min?: number
  max?: number
}

export function QuantityStepper({ value, onChange, label, min = 1, max = 99 }: QuantityStepperProps) {
  return (
    <div className="flex items-center" role="group" aria-label={label}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Remove one from ${label}`}
      >
        <Minus />
      </Button>
      <output className="min-w-8 text-center font-display text-xl font-bold tabular-nums" aria-live="polite">
        {value}
      </output>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Add one to ${label}`}
      >
        <Plus />
      </Button>
    </div>
  )
}
