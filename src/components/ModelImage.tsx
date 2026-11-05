import { ModelPlaceholder } from '@/components/ModelPlaceholder'
import { cn } from '@/lib/utils'

interface ModelImageProps {
  name: string
  imageUrl?: string
  className?: string
}

/** Model picture at the card ratio, or the placeholder when there is none. */
export function ModelImage({ name, imageUrl, className }: ModelImageProps) {
  return (
    <div className={cn('@container aspect-[4/5] overflow-hidden bg-muted', className)}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        <ModelPlaceholder name={name} />
      )}
    </div>
  )
}
