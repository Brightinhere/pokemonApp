import { Link } from 'react-router'
import type { PokemonEntry } from '../../data/types'
import { typeEngine } from '../../data/typeEngine'
import { POKEMON_TYPES } from '../../data/types'
import {
  useGetAbilityQuery,
  useGetEvolutionChainQuery,
  useGetPokemonQuery,
  useGetPokemonSpeciesQuery,
} from '../../services/pokeApi'
import { PokemonArt, StatBar, TypeChip } from '../../ui'
import { titleCase, type EvolutionNode } from './shape'
import { SectionError, SectionLoading, SectionTitle } from './SectionStatus'

const STATS = [
  ['hp', 'HP'],
  ['attack', 'Attack'],
  ['defense', 'Defense'],
  ['specialAttack', 'Sp. Attack'],
  ['specialDefense', 'Sp. Defense'],
  ['speed', 'Speed'],
] as const

export function BaseStats({ entry }: { entry: PokemonEntry }) {
  const total = STATS.reduce((sum, [key]) => sum + entry.stats[key], 0)
  return (
    <section aria-labelledby="stats-title">
      <SectionTitle id="stats-title">Base stats</SectionTitle>
      <dl className="grid grid-cols-[max-content_40px_1fr] items-center gap-x-3.5 gap-y-2.5">
        {STATS.map(([key, label]) => (
          <div key={key} className="contents">
            <dt className="font-semibold text-ink-soft font-stretch-condensed">{label}</dt>
            <dd className="text-right font-bold">{entry.stats[key]}</dd>
            <StatBar value={entry.stats[key]} max={255} className="h-2.5" />
          </div>
        ))}
        <div className="contents">
          <dt className="font-extrabold">Total</dt>
          <dd className="text-right font-extrabold">{total}</dd>
        </div>
      </dl>
    </section>
  )
}

const DAMAGE_GROUPS = [
  [4, '4×'],
  [2, '2×'],
  [0.5, '½×'],
  [0.25, '¼×'],
  [0, '0×'],
] as const

export function DamageTaken({ entry }: { entry: PokemonEntry }) {
  const profile = typeEngine.defensiveProfile(entry)
  return (
    <section aria-labelledby="damage-title">
      <SectionTitle id="damage-title">Damage taken</SectionTitle>
      <dl className="grid gap-3.5">
        {DAMAGE_GROUPS.map(([multiplier, label]) => {
          const types = profile
            .filter((row) => row.multiplier === multiplier)
            .map((row) => row.type)
          if (!types.length) return null
          return (
            <div key={label} className="grid grid-cols-[72px_1fr] items-baseline gap-3">
              <dt className="text-lg font-extrabold font-stretch-expanded">{label}</dt>
              <dd className="flex flex-wrap gap-1">
                {POKEMON_TYPES.filter((t) => types.includes(t)).map((type) => (
                  <TypeChip key={type} type={type} />
                ))}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

export function FlavorText({ speciesId }: { speciesId: number }) {
  const { data, isLoading, isError, refetch } = useGetPokemonSpeciesQuery(speciesId)
  if (isLoading) return <SectionLoading label="the Pokédex entry" />
  if (isError) return <SectionError what="Pokédex entry" onRetry={() => void refetch()} />
  if (!data?.flavorText) return null
  return <p className="max-w-[52ch] text-lg leading-snug">{data.flavorText}</p>
}

function Ability({ name, isHidden }: { name: string; isHidden: boolean }) {
  const { data, isLoading, isError, refetch } = useGetAbilityQuery(name)
  return (
    <li>
      <strong className="font-bold font-stretch-expanded">
        {data?.displayName ?? titleCase(name)}
      </strong>
      {isHidden && <span className="text-ink-soft"> (hidden ability)</span>}
      <div className="mt-0.5 max-w-[56ch] text-ink-soft">
        {isLoading && <span role="status">Loading description…</span>}
        {isError && <SectionError what="ability description" onRetry={() => void refetch()} />}
        {data && (data.description ?? 'No description available.')}
      </div>
    </li>
  )
}

export function Abilities({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch } = useGetPokemonQuery(slug)
  return (
    <section aria-labelledby="abilities-title">
      <SectionTitle id="abilities-title">Abilities</SectionTitle>
      {isLoading && <SectionLoading label="abilities" />}
      {isError && <SectionError what="abilities" onRetry={() => void refetch()} />}
      {data && (
        <ul className="grid gap-3.5">
          {data.abilities.map((ability) => (
            <Ability key={ability.name} {...ability} />
          ))}
        </ul>
      )}
    </section>
  )
}

interface EvolutionProps {
  entry: PokemonEntry
  /** Default index entry per species id, for names, art and links. */
  speciesDefaults: Map<number, PokemonEntry>
}

function EvolutionStage({
  node,
  entry,
  speciesDefaults,
}: EvolutionProps & { node: EvolutionNode }) {
  const target = speciesDefaults.get(node.speciesId)
  const isCurrent = node.speciesId === entry.speciesId
  return (
    <li
      className={`flex gap-2 ${node.children.length > 2 ? 'items-start max-sm:flex-col' : 'flex-wrap items-center'}`}
    >
      <Link
        to={target ? `/pokemon/${target.name}` : '#'}
        aria-current={isCurrent ? 'page' : undefined}
        className={`grid w-[118px] justify-items-center gap-1 rounded-panel px-2 py-2 text-center hover:bg-panel ${
          isCurrent ? 'shadow-[inset_0_0_0_1.5px_var(--color-ink)]' : ''
        }`}
      >
        <PokemonArt src={target?.sprite ?? null} size={88} />
        <span className="leading-tight font-bold font-stretch-expanded">
          {target?.displayName ?? titleCase(node.speciesName)}
        </span>
        <span className="text-sm text-ink-soft">{node.condition ?? 'Base'}</span>
      </Link>
      {node.children.length > 0 && (
        <>
          <span
            aria-hidden="true"
            className={`text-ink-soft ${node.children.length > 2 ? 'self-start pt-12 max-sm:hidden' : ''}`}
          >
            →
          </span>
          {node.children.length > 2 && (
            <span aria-hidden="true" className="pl-12 text-ink-soft sm:hidden">
              ↓
            </span>
          )}
          <ol
            className={
              node.children.length > 2
                ? // Many branches (Eevee): a wrapping grid beside the base stage.
                  'grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-1 max-sm:w-full'
                : 'grid gap-1'
            }
          >
            {node.children.map((child) => (
              <EvolutionStage
                key={child.speciesId}
                node={child}
                entry={entry}
                speciesDefaults={speciesDefaults}
              />
            ))}
          </ol>
        </>
      )}
    </li>
  )
}

export function Evolution({ entry, speciesDefaults }: EvolutionProps) {
  const species = useGetPokemonSpeciesQuery(entry.speciesId)
  const chainId = species.data?.evolutionChainId ?? null
  const chain = useGetEvolutionChainQuery(chainId ?? 0, { skip: chainId === null })
  const speciesName = speciesDefaults.get(entry.speciesId)?.displayName ?? entry.displayName

  let body
  if (species.isLoading || chain.isLoading) body = <SectionLoading label="the evolution chain" />
  else if (species.isError || chain.isError)
    body = (
      <SectionError
        what="evolution chain"
        onRetry={() => void (species.isError ? species.refetch() : chain.refetch())}
      />
    )
  else if (chainId === null || (chain.data && chain.data.children.length === 0))
    body = <p className="text-ink-soft">{speciesName} does not evolve.</p>
  else if (chain.data)
    body = (
      <ol aria-label="Evolution chain">
        <EvolutionStage node={chain.data} entry={entry} speciesDefaults={speciesDefaults} />
      </ol>
    )

  return (
    <section aria-labelledby="evo-title">
      <SectionTitle id="evo-title">Evolution</SectionTitle>
      {body}
    </section>
  )
}
