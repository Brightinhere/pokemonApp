import { Link } from 'react-router'
import type { PokemonEntry } from '../../data/types'
import { Button, PokemonArt, TypeList, buttonClass } from '../../ui'
import { MAX_MEMBERS } from './squadRules'

interface MemberSlotsProps {
  members: PokemonEntry[]
  /** Omit for read-only slots (shared squads). */
  onMove?: (index: number, direction: -1 | 1) => void
  onRemove?: (index: number) => void
}

const small = 'px-2.5 py-1.5 text-xs'

/** Six slots: members in order, then empty ones. */
export function MemberSlots({ members, onMove, onRemove }: MemberSlotsProps) {
  const editable = Boolean(onMove && onRemove)
  const free = MAX_MEMBERS - members.length
  return (
    <ol aria-label="Members" className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {members.map((member, index) => (
        <li
          key={`${member.id}-${index}`}
          className="grid content-start gap-2 rounded-panel border border-rule bg-panel p-3"
        >
          <PokemonArt src={member.sprite} size={96} className="mx-auto" />
          <Link
            to={`/pokemon/${member.name}`}
            className="leading-tight font-bold font-stretch-expanded no-underline hover:underline hover:underline-offset-3"
          >
            {member.displayName}
          </Link>
          <TypeList types={member.types} />
          {editable && (
            <div className="mt-1 flex flex-wrap gap-1">
              {index > 0 && (
                <Button
                  className={small}
                  aria-label={`Move ${member.displayName} earlier`}
                  onClick={() => onMove!(index, -1)}
                >
                  ← Earlier
                </Button>
              )}
              {index < members.length - 1 && (
                <Button
                  className={small}
                  aria-label={`Move ${member.displayName} later`}
                  onClick={() => onMove!(index, 1)}
                >
                  Later →
                </Button>
              )}
              <Button
                className={small}
                aria-label={`Remove ${member.displayName}`}
                onClick={() => onRemove!(index)}
              >
                Remove
              </Button>
            </div>
          )}
        </li>
      ))}
      {Array.from({ length: free }, (_, i) => (
        <li
          key={`empty-${i}`}
          className="grid min-h-48 place-content-center justify-items-center gap-2 rounded-panel border-[1.5px] border-dashed border-rule-strong p-3 text-center text-sm text-ink-soft"
        >
          {i === 0 ? (
            <>
              <span>{free === 1 ? 'One slot left' : `${free} slots left`}</span>
              {editable && (
                <Link to="/" className={buttonClass()}>
                  Add a Pokémon
                </Link>
              )}
            </>
          ) : (
            <span className="sr-only">Empty slot</span>
          )}
        </li>
      ))}
    </ol>
  )
}
