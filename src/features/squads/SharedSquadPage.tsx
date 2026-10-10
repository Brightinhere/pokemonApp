import { Link, useNavigate, useSearchParams } from 'react-router'
import { useStore } from 'react-redux'
import { useAppDispatch } from '../../app/hooks'
import type { RootState } from '../../app/store'
import { retryPokemonIndex, usePokemonIndex } from '../../data/pokemonIndex'
import { Button } from '../../ui'
import { MemberSlots } from './MemberSlots'
import { parseShareQuery } from './shareLink'
import { SquadAnalysis } from './SquadAnalysis'
import { saveSharedSquad, selectCurrentSquad } from './squadsSlice'
import { SquadWarnings } from './SquadWarnings'
import { useEntryLookup } from './useSquadEntries'

const SHARED_NAME = 'Shared squad'

/** `/squad?m=...&n=...`: a squad from a link, read-only until saved. Never touches the user's squads. */
export function SharedSquadPage() {
  const [params] = useSearchParams()
  const index = usePokemonIndex()
  const lookup = useEntryLookup()
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const navigate = useNavigate()

  if (index.status === 'error') {
    return (
      <div role="alert" className="grid justify-items-start gap-3 py-12">
        <p className="text-lg font-bold font-stretch-expanded">
          The Pokémon list could not be loaded.
        </p>
        <Button onClick={() => void retryPokemonIndex()}>Try again</Button>
      </div>
    )
  }
  if (!lookup) {
    return (
      <p role="status" className="py-12 text-ink-soft">
        Loading…
      </p>
    )
  }

  const shared = parseShareQuery(params, lookup.byId)
  const name = shared.name ?? SHARED_NAME

  if (shared.members.length === 0) {
    return (
      <section>
        <title>Shared squad | Squad Lab</title>
        <h1 className="mb-2 text-2xl font-extrabold font-stretch-expanded">
          This link has no Pokémon in it
        </h1>
        <p className="mb-4 text-ink-soft">
          The link may be incomplete. Ask for it again, or build your own squad.
        </p>
        <Link to="/" className="underline underline-offset-3">
          Browse the Pokédex
        </Link>
      </section>
    )
  }

  const save = () => {
    dispatch(saveSharedSquad({ name, members: shared.members.map((m) => m.id) }))
    const saved = selectCurrentSquad(store.getState())
    if (saved) void navigate(`/squads/${saved.id}`)
  }

  return (
    <article>
      <title>{`${name} (shared) | Squad Lab`}</title>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-ink-soft">Shared with you</p>
          <h1 className="text-2xl font-extrabold font-stretch-expanded tracking-tight break-words">
            {name}
          </h1>
        </div>
        <Button variant="primary" onClick={save}>
          Save as my squad
        </Button>
      </div>
      {shared.dropped && (
        <p role="note" className="mb-6 max-w-[72ch] border-l-4 border-ink bg-panel px-4 py-2.5">
          Some Pokémon in this link couldn&apos;t be shown: they don&apos;t exist, or the link has
          more than six.
        </p>
      )}
      <MemberSlots members={shared.members} />
      <SquadWarnings members={shared.members} speciesName={lookup.speciesName} />
      <SquadAnalysis members={shared.members} />
    </article>
  )
}
