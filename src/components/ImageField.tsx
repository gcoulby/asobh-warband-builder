import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageCropDialog } from '@/components/ImageCropDialog'
import { ModelImage } from '@/components/ModelImage'
import { Button } from '@/components/ui/button'
import { cropAndCompress, type PixelArea } from '@/lib/images'

export type ImageChange = { kind: 'keep' } | { kind: 'set'; blob: Blob } | { kind: 'remove' }

interface ImageFieldProps {
  name: string
  /** URL of the picture already saved for this model. */
  currentUrl?: string
  change: ImageChange
  onChange: (change: ImageChange) => void
}

/** Picks a picture from the camera or files, crops it to the card ratio and compresses it. */
export function ImageField({ name, currentUrl, change, onChange }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [pendingUrl, setPendingUrl] = useState<string>()
  const [busy, setBusy] = useState(false)
  const pendingRef = useRef<string>(undefined)

  useEffect(() => () => {
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current)
  }, [])

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
  }, [sourceUrl])

  const setPending = (blob: Blob) => {
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current)
    const url = URL.createObjectURL(blob)
    pendingRef.current = url
    setPendingUrl(url)
  }

  const shownUrl = change.kind === 'set' ? pendingUrl : change.kind === 'remove' ? undefined : currentUrl

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('That file is not a picture. Choose a JPEG, PNG or WebP file.')
      return
    }
    setSourceUrl(URL.createObjectURL(file))
  }

  const handleConfirm = async (area: PixelArea) => {
    if (!sourceUrl) return
    setBusy(true)
    try {
      const blob = await cropAndCompress(sourceUrl, area)
      setPending(blob)
      onChange({ kind: 'set', blob })
      setSourceUrl(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The picture could not be processed. Try another file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-end gap-3">
      <ModelImage name={name || 'New model'} imageUrl={shownUrl} className="w-20 shrink-0 rounded-sm border" />
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImagePlus /> {shownUrl ? 'Change picture' : 'Add picture'}
        </Button>
        {shownUrl && (
          <Button type="button" variant="ghost" onClick={() => onChange({ kind: 'remove' })}>
            <Trash2 /> Remove picture
          </Button>
        )}
      </div>
      <ImageCropDialog
        key={sourceUrl ?? 'none'}
        sourceUrl={sourceUrl}
        busy={busy}
        onCancel={() => setSourceUrl(null)}
        onConfirm={(area) => void handleConfirm(area)}
      />
    </div>
  )
}
