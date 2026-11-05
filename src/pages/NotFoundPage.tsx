import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

interface NotFoundPageProps {
  what?: string
}

export function NotFoundPage({ what = 'page' }: NotFoundPageProps) {
  return (
    <main className="mx-auto max-w-3xl p-4">
      <EmptyState
        title={`This ${what} does not exist.`}
        action={
          <Button asChild>
            <Link to="/">Go to warbands</Link>
          </Button>
        }
      >
        It may have been deleted, or the link is wrong.
      </EmptyState>
    </main>
  )
}
