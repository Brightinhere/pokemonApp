import { useStore } from 'react-redux'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { useAnnounce } from '../../app/announcerContext'
import type { RootState } from '../../app/store'
import type { PokemonEntry } from '../../data/types'
import { buttonClass } from '../../ui'
import { MAX_MEMBERS } from './squadRules'
import { addMember, selectCurrentSquad } from './squadsSlice'

interface AddToSquadButtonProps {
  entry: PokemonEntry
  /** `row`: a compact "Add" in Pokédex rows. `detail`: "Add to <squad name>". */
  variant: 'row' | 'detail'
}

export function AddToSquadButton({ entry, variant }: AddToSquadButtonProps) {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const announce = useAnnounce()
  const squad = useAppSelector(selectCurrentSquad)
  const full = squad !== null && squad.members.length >= MAX_MEMBERS

  const label = full
    ? variant === 'row'
      ? 'Full'
      : `${squad.name} is full`
    : variant === 'row'
      ? 'Add'
      : `Add to ${squad?.name ?? 'a new squad'}`
  const accessibleName = full
    ? `${squad.name} is full, ${MAX_MEMBERS} of ${MAX_MEMBERS}`
    : `Add ${entry.displayName} to ${squad?.name ?? 'a new squad'}`

  return (
    <button
      type="button"
      aria-label={accessibleName}
      aria-disabled={full || undefined}
      title={full ? `${squad.name} already has ${MAX_MEMBERS} Pokémon` : undefined}
      onClick={() => {
        if (full) return
        dispatch(addMember({ entryId: entry.id }))
        const current = selectCurrentSquad(store.getState())
        if (current) announce(`Added ${entry.displayName} to ${current.name}`)
      }}
      className={`${buttonClass(variant === 'detail' ? 'primary' : 'outline')} aria-disabled:cursor-not-allowed aria-disabled:opacity-50`}
    >
      {label}
    </button>
  )
}
