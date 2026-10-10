import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { retryPokemonIndex, usePokemonIndex } from '../../data/pokemonIndex'
import type { PokemonEntry } from '../../data/types'
import { useGetPokemonFormQuery } from '../../services/pokeApi'
import { Button, DexNumber, PokemonArt, TypeList, formLabel } from '../../ui'
import { FormsSwitcher } from './FormsSwitcher'
import { Abilities, BaseStats, DamageTaken, Evolution, FlavorText } from './sections'

export function PokemonDetailPage() {
  const { name = '' } = useParams<'name'>()
  const index = usePokemonIndex()

  if (index.status === 'loading') {
    return (
      <p role="status" className="py-12 text-ink-soft">
        Loading…
      </p>
    )
  }
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

  const entry = index.entries.find((e) => e.name === name)
  if (!entry) return <UnknownPokemon name={name} />
  // Keyed by slug so per-page state (the chosen cosmetic form) resets on navigation.
  return <PokemonDetail key={entry.name} entry={entry} entries={index.entries} />
}

function UnknownPokemon({ name }: { name: string }) {
  return (
    <section>
      <title>Pokémon not found | Squad Lab</title>
      <h1 className="mb-2 text-2xl font-extrabold font-stretch-expanded">Pokémon not found</h1>
      <p className="mb-4 text-ink-soft">There is no Pokémon called “{name}”.</p>
      <Link to="/" className="underline underline-offset-3">
        Back to the Pokédex
      </Link>
    </section>
  )
}

function BackToList() {
  const location = useLocation()
  const navigate = useNavigate()
  const cameFromList = (location.state as { fromList?: boolean } | null)?.fromList === true
  return (
    <Link
      to="/"
      onClick={(event) => {
        // Going back restores the list exactly as it was (filters, sort, scroll).
        if (cameFromList) {
          event.preventDefault()
          void navigate(-1)
        }
      }}
      className="mb-6 inline-block text-sm text-ink-soft underline underline-offset-3"
    >
      Back to the Pokédex
    </Link>
  )
}

function PokemonDetail({ entry, entries }: { entry: PokemonEntry; entries: PokemonEntry[] }) {
  const [cosmeticForm, setCosmeticForm] = useState<string | null>(null)
  const form = useGetPokemonFormQuery(cosmeticForm ?? '', { skip: cosmeticForm === null })
  const label = formLabel(entry)

  const { speciesEntries, speciesDefaults } = useMemo(() => {
    const defaults = new Map<number, PokemonEntry>()
    for (const e of entries) if (e.isDefault) defaults.set(e.speciesId, e)
    const sameSpecies = entries
      .filter((e) => e.speciesId === entry.speciesId)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id)
    return { speciesEntries: sameSpecies, speciesDefaults: defaults }
  }, [entries, entry.speciesId])

  const showingCosmetic = cosmeticForm !== null && form.data
  const art = showingCosmetic ? form.data!.sprite : entry.sprite

  return (
    <article>
      <title>{`${entry.displayName} | Squad Lab`}</title>
      <BackToList />

      <header className="grid items-center gap-8 border-b border-rule pb-10 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid justify-items-start gap-5">
          <div>
            <DexNumber speciesId={entry.speciesId} className="text-lg" />
            <h1 className="text-hero font-black tracking-[-0.035em] font-stretch-expanded">
              {entry.displayName}
            </h1>
            {label && (
              <p className="mt-2 font-semibold text-ink-soft font-stretch-condensed">{label}</p>
            )}
            {showingCosmetic && (
              <p className="mt-2 font-semibold text-ink-soft font-stretch-condensed">
                {form.data!.displayName}
              </p>
            )}
          </div>
          <TypeList types={entry.types} size="lg" />
          <FlavorText speciesId={entry.speciesId} />
          <FormsSwitcher
            entry={entry}
            speciesEntries={speciesEntries}
            cosmeticForm={cosmeticForm}
            onCosmeticForm={setCosmeticForm}
          />
        </div>
        <PokemonArt
          src={art}
          size={360}
          eager
          alt={`${entry.displayName} artwork`}
          className="max-md:row-start-1 max-md:size-60 md:justify-self-end"
        />
      </header>

      <div className="grid gap-x-16 gap-y-12 pt-10 md:grid-cols-2">
        <BaseStats entry={entry} />
        <DamageTaken entry={entry} />
        <Abilities slug={entry.name} />
        <Evolution entry={entry} speciesDefaults={speciesDefaults} />
      </div>
    </article>
  )
}
