import type { ReactNode } from 'react'
import { RuleBrowser } from '@/components/RuleBrowser'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { SpecialRule } from '@/lib/schema'

interface RuleBrowserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rules: readonly SpecialRule[]
  value: readonly string[]
  onChange: (ruleIds: string[]) => void
  /** Running model cost, shown while picking. */
  costLabel: ReactNode
}

/** The rules browser as a full-screen panel, for editors too narrow to show it alongside. */
export function RuleBrowserSheet({ open, onOpenChange, rules, value, onChange, costLabel }: RuleBrowserSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b py-3">
          <SheetTitle className="font-display text-2xl">Special rules</SheetTitle>
          <SheetDescription className="sr-only">Pick special rules for this model, grouped by kind.</SheetDescription>
        </SheetHeader>
        <RuleBrowser
          rules={rules}
          value={value}
          onChange={onChange}
          className="flex-1 pb-[env(safe-area-inset-bottom)]"
          footer={
            <>
              <span>{costLabel}</span>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </>
          }
        />
      </SheetContent>
    </Sheet>
  )
}
