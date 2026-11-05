import { useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CARD_ASPECT, type PixelArea } from '@/lib/images'

interface ImageCropDialogProps {
  sourceUrl: string | null
  onCancel: () => void
  onConfirm: (area: PixelArea) => void
  busy: boolean
}

export function ImageCropDialog({ sourceUrl, onCancel, onConfirm, busy }: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)

  return (
    <Dialog open={sourceUrl !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop picture</DialogTitle>
          <DialogDescription>Drag to position. Pinch or use the slider to zoom.</DialogDescription>
        </DialogHeader>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-sm bg-black">
          {sourceUrl && (
            <Cropper
              image={sourceUrl}
              crop={crop}
              zoom={zoom}
              aspect={CARD_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
              objectFit="cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="crop-zoom">Zoom</Label>
          <Slider
            id="crop-zoom"
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={([z]) => z !== undefined && setZoom(z)}
            aria-label="Zoom"
            className="py-3"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => area && onConfirm(area)} disabled={!area || busy}>
            {busy ? 'Processing picture' : 'Use picture'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
