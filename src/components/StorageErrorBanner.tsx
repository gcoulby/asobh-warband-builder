import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface StorageErrorBannerProps {
  message: string
}

export function StorageErrorBanner({ message }: StorageErrorBannerProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 print:hidden">
      <Alert variant="destructive" className="border-destructive bg-card">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>Changes are not being saved</AlertTitle>
        <AlertDescription className="text-foreground">{message}</AlertDescription>
      </Alert>
    </div>
  )
}
