import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function RulesEmptyHint() {
  return (
    <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
      <p>No special rules loaded. Import a rules file to pick from.</p>
      <Button asChild variant="outline">
        <Link to="/rules">Import rules</Link>
      </Button>
    </div>
  )
}
