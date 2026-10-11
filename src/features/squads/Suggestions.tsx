import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAnnounce } from '../../app/announcerContext'
import { useAppDispatch } from '../../app/hooks'
import { usePokemonIndex } from '../../data/pokemonIndex'
import { typeEngine } from '../../data/typeEngine'
import type { PokemonEntry } from '../../data/types'
import { recommend, type Suggestion } from '../../engine'
import { Button, PokemonArt, Toggle, TypeChip, capitalize } from '../../ui'
import { breakdownText, effectLabel, reasonSentences } from './suggestionText'
import { MAX_GENERATION, filterPool, type RecommendOptions } from './recommendOptions'
import { addMember, replaceMember, type Squad } from './squadsSlice'
import { useRecommendOptions } from './useRecommendOptions'

const VISIBLE_ENTRIES = 3

const total = (e: PokemonEntry) =>
  e.stats.hp +
  e.stats.attack +
  e.stats.defense +
  e.stats.specialAttack +
  e.stats.specialDefense +
  e.stats.speed

interface CardProps {
  suggestion: Suggestion
  squad: Squad
  /** Set when suggesting replacements for this member. */
  replacing?: { index: number; member: PokemonEntry; onDone: () => void }
}

export function SuggestionCard({ suggestion, squad, replacing }: CardProps) {
  const dispatch = useAppDispatch()
  const announce = useAnnounce()
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? suggestion.entries : suggestion.entries.slice(0, VISIBLE_ENTRIES)
  const hidden = suggestion.entries.length - VISIBLE_ENTRIES
  const title = suggestion.types.map(capitalize).join('/')

  const choose = (entry: PokemonEntry) => {
    if (replacing) {
      dispatch(replaceMember({ squadId: squad.id, index: replacing.index, entryId: entry.id }))
      announce(
        `Replaced ${replacing.member.displayName} with ${entry.displayName} in ${squad.name}`,
      )
      replacing.onDone()
    } else {
      dispatch(addMember({ entryId: entry.id }))
      announce(`Added ${entry.displayName} to ${squad.name}`)
    }
  }

  return (
    <li className="grid content-start gap-3 rounded-panel border border-rule bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex flex-wrap gap-1" aria-label={title}>
          {suggestion.types.map((type) => (
            <TypeChip key={type} type={type} size="lg" />
          ))}
        </h3>
        {replacing && (
          <span className="text-sm font-semibold font-stretch-condensed">
            {effectLabel(suggestion.gain)}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold tracking-wide text-ink-soft tabular-nums">
        {breakdownText(suggestion.breakdown)}
      </p>
      <ul className="grid gap-1 text-sm text-ink-soft">
        {reasonSentences(suggestion, Boolean(replacing)).map((sentence) => (
          <li key={sentence}>{sentence}</li>
        ))}
      </ul>
      <ul aria-label={`${title} Pokémon`} className="grid gap-1">
        {shown.map((entry) => (
          <li
            key={entry.id}
            className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3"
          >
            <PokemonArt src={entry.sprite} size={40} />
            <span className="min-w-0">
              <Link
                to={`/pokemon/${entry.name}`}
                className="block truncate font-bold font-stretch-expanded no-underline hover:underline hover:underline-offset-3"
              >
                {entry.displayName}
              </Link>
              <span className="text-xs text-ink-soft">Total {total(entry)}</span>
            </span>
            <Button
              className="px-2.5 py-1.5 text-xs"
              aria-label={
                replacing
                  ? `Swap in ${entry.displayName} for ${replacing.member.displayName}`
                  : `Add ${entry.displayName} to ${squad.name}`
              }
              onClick={() => choose(entry)}
            >
              {replacing ? 'Swap in' : 'Add'}
            </Button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="justify-self-start text-sm underline underline-offset-3"
        >
          {showAll ? 'Show fewer' : `Show all ${suggestion.entries.length}`}
        </button>
      )}
    </li>
  )
}

export function RecommendOptionsRow({
  options,
  update,
}: {
  options: RecommendOptions
  update: (changes: Partial<RecommendOptions>) => void
}) {
  const genId = useId()
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <label htmlFor={genId} className="font-semibold">
        Generation
      </label>
      <select
        id={genId}
        value={options.maxGeneration ?? ''}
        onChange={(event) =>
          update({ maxGeneration: event.target.value ? Number(event.target.value) : null })
        }
        className="rounded-panel border-[1.5px] border-rule-strong bg-panel px-2.5 py-1.5 text-ink"
      >
        <option value="">All generations</option>
        {Array.from({ length: MAX_GENERATION }, (_, i) => i + 1).map((gen) => (
          <option key={gen} value={gen}>
            Up to generation {gen}
          </option>
        ))}
      </select>
      <Toggle
        pressed={options.includeLegendary}
        onPressedChange={(includeLegendary) => update({ includeLegendary })}
      >
        Legendary and mythical
      </Toggle>
      <Toggle
        pressed={options.includeBattleOnly}
        onPressedChange={(includeBattleOnly) => update({ includeBattleOnly })}
      >
        Battle-only forms
      </Toggle>
    </div>
  )
}

function useSuggestions(members: PokemonEntry[], replaceIndex?: number) {
  const index = usePokemonIndex()
  const { options, update } = useRecommendOptions()
  const entries = index.status === 'ready' ? index.entries : null
  const suggestions = useMemo(
    () =>
      entries
        ? recommend(typeEngine, { members, pool: filterPool(entries, options), replaceIndex })
        : [],
    [entries, members, options, replaceIndex],
  )
  return { suggestions, options, update }
}

/** Suggestions to add, for squads of 3–5 members. */
export function CompleteYourSquad({ squad, members }: { squad: Squad; members: PokemonEntry[] }) {
  const { suggestions, options, update } = useSuggestions(members)
  return (
    <section aria-labelledby="complete-title" className="mt-12">
      <h2 id="complete-title" className="mb-1 text-lg font-bold font-stretch-expanded">
        Complete your squad
      </h2>
      <p className="mb-4 max-w-[64ch] text-ink-soft">
        Types that would cover this squad&apos;s weak spots, based on the Pokémon you picked.
      </p>
      <RecommendOptionsRow options={options} update={update} />
      {suggestions.length === 0 ? (
        <p className="rounded-panel border border-rule bg-panel p-4">
          No addition improves this squad&apos;s type matchups with these options.
        </p>
      ) : (
        <ol aria-label="Suggestions" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.types.join('/')}
              suggestion={suggestion}
              squad={squad}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

/** Replacement suggestions for one member of a full squad. */
export function ReplacementPanel({
  squad,
  members,
  index,
  onClose,
}: {
  squad: Squad
  members: PokemonEntry[]
  index: number
  onClose: () => void
}) {
  const member = members[index]!
  const { suggestions, options, update } = useSuggestions(members, index)
  return (
    <section
      aria-labelledby="replace-title"
      className="mb-10 rounded-panel border-[1.5px] border-ink bg-panel p-4 sm:p-6"
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="replace-title" className="text-lg font-bold font-stretch-expanded">
          Replacements for {member.displayName}
        </h2>
        <Button onClick={onClose}>Close</Button>
      </div>
      <p className="mb-4 max-w-[64ch] text-ink-soft">
        Types that could take {member.displayName}&apos;s place, judged against the other five.
      </p>
      <RecommendOptionsRow options={options} update={update} />
      <ol aria-label="Replacement suggestions" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.types.join('/')}
            suggestion={suggestion}
            squad={squad}
            replacing={{ index, member, onDone: onClose }}
          />
        ))}
      </ol>
    </section>
  )
}
