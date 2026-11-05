import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface ShareDialogProps {
  open: boolean
  url: string
  onOpenChange: (open: boolean) => void
  onCopy: () => void
}

export function ShareDialog({ open, url, onOpenChange, onCopy }: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>
            Anyone with the link sees a read-only copy of this warband and can save their own copy. Pictures are not
            included in links, so the other person sees placeholders. To share pictures, export the warband as a .zip.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="share-url">Link</FieldLabel>
          <Input id="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        </Field>
        <DialogFooter>
          <Button onClick={onCopy}>
            <Copy /> Copy link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
