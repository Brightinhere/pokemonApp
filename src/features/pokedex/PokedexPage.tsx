import { useDeferredValue, useId, useMemo, useState } from 'react'
import { retryPokemonIndex, usePokemonIndex } from '../../data/pokemonIndex'
import type { PokemonEntry } from '../../data/types'
import { Button } from '../../ui'
import { Filters } from './Filters'
import { applyListQuery, type ListQuery, type Sort } from './listQuery'
import { PokemonRow } from './PokemonRow'
import { useListQuery } from './useListQuery'

const SORT_LABELS: Record<Sort, string> = {
  number: 'Number',
  name: 'Name',
  total: 'Total stats',
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Sp. Attack',
  specialDefense: 'Sp. Defense',
  speed: 'Speed',
}

const NARROW = '(max-width: 960px)'
const isNarrow = () => typeof window.matchMedia === 'function' && window.matchMedia(NARROW).matches

export function PokedexPage() {
  const index = usePokemonIndex()
  const { query, update, reset } = useListQuery()
  const [filtersOpen, setFiltersOpen] = useState(() => !isNarrow())

  return (
    <div className="grid items-start gap-6 min-[961px]:grid-cols-[248px_minmax(0,1fr)] min-[961px]:gap-10">
      <title>Pokédex | Squad Lab</title>
      <aside
        aria-label="Filters"
        className="grid gap-4 min-[961px]:sticky min-[961px]:top-6 min-[961px]:gap-6"
      >
        <h1 className="text-2xl font-extrabold font-stretch-expanded tracking-tight">Pokédex</h1>
        <details open={filtersOpen} onToggle={(event) => setFiltersOpen(event.currentTarget.open)}>
          <summary className="cursor-pointer border-y border-rule py-2.5 font-bold min-[961px]:hidden">
            Filters
          </summary>
          <div className="pt-5 min-[961px]:pt-0">
            <Filters query={query} update={update} />
          </div>
        </details>
      </aside>

      <section aria-labelledby="results-heading">
        {index.status === 'loading' && (
          <p role="status" className="py-12 text-ink-soft">
            Loading the Pokédex…
          </p>
        )}
        {index.status === 'error' && (
          <div role="alert" className="grid justify-items-start gap-3 py-12">
            <p className="text-lg font-bold font-stretch-expanded">
              The Pokémon list could not be loaded.
            </p>
            <p className="text-ink-soft">Check your connection, then try again.</p>
            <Button onClick={() => void retryPokemonIndex()}>Try again</Button>
          </div>
        )}
        {index.status === 'ready' && (
          <Results entries={index.entries} query={query} update={update} reset={reset} />
        )}
      </section>
    </div>
  )
}

interface ResultsProps {
  entries: PokemonEntry[]
  query: ListQuery
  update: (changes: Partial<ListQuery>) => void
  reset: () => void
}

function Results({ entries, query, update, reset }: ResultsProps) {
  // Typing stays responsive: the list re-renders with the deferred query.
  const deferredQuery = useDeferredValue(query)
  const results = useMemo(() => applyListQuery(entries, deferredQuery), [entries, deferredQuery])
  const sortId = useId()
  const count = results.length.toLocaleString('en')
  const what = query.forms.length ? 'Pokémon and forms' : 'Pokémon'

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <h2 id="results-heading" className="text-ink-soft" aria-live="polite">
          {count} {what}
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor={sortId} className="text-sm font-semibold">
            Sort by
          </label>
          <select
            id={sortId}
            value={query.sort}
            onChange={(event) => update({ sort: event.target.value as Sort })}
            className="rounded-panel border-[1.5px] border-rule-strong bg-panel px-3 py-2 text-ink"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-panel border border-rule bg-panel p-6">
          <p className="text-lg font-bold font-stretch-expanded">
            No Pokémon match your search and filters.
          </p>
          <p className="text-ink-soft">Try fewer filters, or a different name or number.</p>
          <Button onClick={reset}>Clear search and filters</Button>
        </div>
      ) : (
        <ol
          aria-label="Pokémon"
          className="overflow-hidden rounded-panel border border-rule bg-panel"
        >
          {results.map((entry) => (
            <PokemonRow key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
    </>
  )
}
