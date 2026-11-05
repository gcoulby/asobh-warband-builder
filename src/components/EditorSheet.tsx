import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface EditorSheetProps {
  open: boolean
  title: string
  onOpenChange: (open: boolean) => void
  side: 'bottom' | 'right'
  children: ReactNode
}

/** Full-height sheet that holds the model editor. */
export function EditorSheet({ open, title, onOpenChange, side, children }: EditorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={
          side === 'bottom'
            ? 'gap-0 rounded-none pt-[env(safe-area-inset-top)] data-[side=bottom]:h-[100dvh]'
            : 'gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg'
        }
      >
        <SheetHeader className="border-b">
          <SheetTitle className="font-display text-2xl">{title}</SheetTitle>
          <SheetDescription className="sr-only">Set the model's name, picture, profile and special rules. Changes are saved as you make them.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
