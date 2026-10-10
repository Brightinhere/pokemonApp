import { Link } from 'react-router'
import { useAppSelector } from '../../app/hooks'
import { PokemonArt } from '../../ui'
import { MAX_MEMBERS } from './squadRules'
import { selectCurrentSquad } from './squadsSlice'
import { useEntryLookup } from './useSquadEntries'

/** The current squad in the app bar: six slots on wide screens, "Squad n/6" on phones. */
export function SquadTray() {
  const squad = useAppSelector(selectCurrentSquad)
  const lookup = useEntryLookup()
  if (!squad) return null

  const members = lookup ? lookup.membersOf(squad.members) : []
  const count = squad.members.length
  return (
    <Link
      to={`/squads/${squad.id}`}
      aria-label={`Current squad: ${squad.name}, ${count} of ${MAX_MEMBERS}`}
      className="ml-auto flex items-center gap-1 no-underline"
    >
      <span className="mr-2 max-w-40 truncate text-sm text-ink-soft max-[960px]:hidden">
        {squad.name}
      </span>
      {Array.from({ length: MAX_MEMBERS }, (_, i) => {
        const member = members[i]
        return (
          <span
            key={i}
            data-testid={member ? 'tray-slot-filled' : 'tray-slot-empty'}
            className={`grid size-9 place-items-center rounded-panel max-[560px]:hidden ${
              member
                ? 'border border-rule bg-paper'
                : 'border-[1.5px] border-dashed border-rule-strong'
            }`}
          >
            {member && <PokemonArt src={member.sprite} size={32} />}
          </span>
        )
      })}
      <span className="hidden rounded-panel border-[1.5px] border-ink px-2 py-1 text-sm font-bold whitespace-nowrap max-[560px]:inline-block">
        <span className="max-[380px]:hidden">Squad </span>
        {count}/{MAX_MEMBERS}
      </span>
    </Link>
  )
}
