import { BookUnlockButton } from '@/components/BookUnlockButton'
import { builderCredit, dataCredit, gameCredit } from '@/data/credits'
import { cn } from '@/lib/utils'

interface CreditsFooterProps {
  className?: string
}

/** Credits the game and its author, the builder's author and the source of the SBH Revised data. The author's surname also unlocks published book data. */
export function CreditsFooter({ className }: CreditsFooterProps) {
  return (
    <footer className={cn('flex flex-col gap-0.5 border-t pt-3 text-xs text-muted-foreground', className)}>
      <p>
        {gameCredit.title} © {gameCredit.holder},{' '}
        <a
          href={gameCredit.url}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          ganeshagames.net
        </a>
        . This is an unofficial fan-made tool.
      </p>
      <p>
        {builderCredit.role} {builderCredit.name.split(' ').slice(0, -1).join(' ')}{' '}
        <BookUnlockButton>{builderCredit.name.split(' ').pop()}</BookUnlockButton>.
      </p>
      {[dataCredit].map((credit) => (
        <p key={credit.name}>
          {credit.role}{' '}
          {credit.url ? (
            <a href={credit.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
              {credit.name}
            </a>
          ) : (
            credit.name
          )}
          .
        </p>
      ))}
    </footer>
  )
}
