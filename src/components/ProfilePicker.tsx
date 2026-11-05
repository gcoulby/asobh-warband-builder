import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ProfileOption } from '@/data/profile-options'

interface ProfilePickerProps<T extends number> {
  options: readonly ProfileOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  id?: string
}

/** One-tap picker for a profile value. A selection can be changed but not cleared. */
export function ProfilePicker<T extends number>({ options, value, onChange, label, id }: ProfilePickerProps<T>) {
  return (
    <ToggleGroup
      id={id}
      type="single"
      variant="outline"
      spacing={0}
      value={String(value)}
      onValueChange={(next) => {
        const option = options.find((o) => String(o.value) === next)
        if (option) onChange(option.value)
      }}
      aria-label={label}
      className="w-full"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={String(option.value)}
          aria-label={`${label} ${option.label}`}
          className="h-11 flex-1 px-0 font-display text-xl pointer-fine:h-10 font-bold tabular-nums data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
