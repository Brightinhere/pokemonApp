import { Link, useNavigate } from 'react-router'
import { useStore } from 'react-redux'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { RootState } from '../../app/store'
import { Button, PokemonArt } from '../../ui'
import { MAX_MEMBERS } from './squadRules'
import { createSquad, selectCurrentSquad, selectSquads } from './squadsSlice'
import { useEntryLookup } from './useSquadEntries'

export function SquadListPage() {
  const squads = useAppSelector(selectSquads)
  const current = useAppSelector(selectCurrentSquad)
  const lookup = useEntryLookup()
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const navigate = useNavigate()

  const newSquad = () => {
    dispatch(createSquad())
    const created = selectCurrentSquad(store.getState())
    if (created) void navigate(`/squads/${created.id}`)
  }

  const sorted = [...squads].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <section>
      <title>Squads | Squad Lab</title>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold font-stretch-expanded tracking-tight">Squads</h1>
        <Button variant="primary" onClick={newSquad}>
          New squad
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="grid max-w-[60ch] justify-items-start gap-3 rounded-panel border border-rule bg-panel p-6">
          <p className="text-lg font-bold font-stretch-expanded">No squads yet</p>
          <p className="text-ink-soft">
            A squad holds up to six Pokémon. Build one to see which types it is weak to and what it
            can hit. You can also add Pokémon straight from the Pokédex. Squads are saved in this
            browser.
          </p>
          <Button onClick={newSquad}>New squad</Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((squad) => {
            const members = lookup ? lookup.membersOf(squad.members) : []
            return (
              <li key={squad.id}>
                <Link
                  to={`/squads/${squad.id}`}
                  className="grid gap-3 rounded-panel border border-rule bg-panel p-4 no-underline hover:border-ink"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-lg font-bold font-stretch-expanded">
                      {squad.name}
                    </span>
                    {current?.id === squad.id && (
                      <span className="shrink-0 text-sm font-semibold text-ink-soft font-stretch-condensed">
                        Current
                      </span>
                    )}
                  </span>
                  <span className="flex gap-1" aria-hidden="true">
                    {Array.from({ length: MAX_MEMBERS }, (_, i) =>
                      members[i] ? (
                        <PokemonArt key={i} src={members[i].sprite} size={40} />
                      ) : (
                        <span
                          key={i}
                          className="size-10 rounded-panel border-[1.5px] border-dashed border-rule-strong"
                        />
                      ),
                    )}
                  </span>
                  <span className="text-sm text-ink-soft">
                    {squad.members.length} of {MAX_MEMBERS}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
