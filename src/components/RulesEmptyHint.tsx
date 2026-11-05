import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

interface RulesEmptyHintProps {
  /** Set when other rules are loaded but none for this game. */
  edition?: string
}

export function RulesEmptyHint({ edition }: RulesEmptyHintProps) {
  return (
    <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
      <p>
        {edition
          ? `No ${edition} special rules yet. Add a source for this game to pick from.`
          : 'No special rules yet. Add a source, such as a rulebook, to pick from.'}
      </p>
      <Button asChild variant="outline">
        <Link to="/sources">Add sources</Link>
      </Button>
    </div>
  )
}
