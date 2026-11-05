import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageCropDialog } from '@/components/ImageCropDialog'
import { ModelImage } from '@/components/ModelImage'
import { Button } from '@/components/ui/button'
import { cropAndCompress, type PixelArea } from '@/lib/images'
import { cn } from '@/lib/utils'

export type ImageChange = { kind: 'keep' } | { kind: 'set'; blob: Blob } | { kind: 'remove' }

interface ImageFieldProps {
  name: string
  /** URL of the picture already saved for this model. */
  currentUrl?: string
  change: ImageChange
  onChange: (change: ImageChange) => void
  /** Smaller picture and buttons, for panel headers. */
  compact?: boolean
}

/** Picks a picture from the camera or files, crops it to the card ratio and compresses it. */
export function ImageField({ name, currentUrl, change, onChange, compact = false }: ImageFieldProps) {
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
    <div className={cn('flex gap-3', compact ? 'flex-col items-start gap-1.5' : 'items-end')}>
      <ModelImage name={name || 'New model'} imageUrl={shownUrl} className={cn('shrink-0 rounded-sm border', compact ? 'w-16' : 'w-20')} />
      <div className={cn('flex flex-col', compact ? 'gap-0.5' : 'gap-2')}>
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
        <Button
          type="button"
          variant={compact ? 'ghost' : 'outline'}
          size={compact ? 'sm' : 'default'}
          className={cn(compact && 'h-7 px-1.5 text-xs')}
          onClick={() => inputRef.current?.click()}
          aria-label={shownUrl ? 'Change picture' : 'Add picture'}
        >
          <ImagePlus /> {compact ? (shownUrl ? 'Change' : 'Picture') : shownUrl ? 'Change picture' : 'Add picture'}
        </Button>
        {shownUrl && (
          <Button
            type="button"
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            className={cn(compact && 'h-7 px-1.5 text-xs')}
            onClick={() => onChange({ kind: 'remove' })}
            aria-label="Remove picture"
          >
            <Trash2 /> {compact ? 'Remove' : 'Remove picture'}
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
