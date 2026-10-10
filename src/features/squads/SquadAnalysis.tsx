import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { typeChart } from '../../data/typeChart'
import { typeEngine } from '../../data/typeEngine'
import { POKEMON_TYPES, type PokemonEntry, type PokemonType } from '../../data/types'
import { Mark, PokemonArt, TypeChip, buttonClass, capitalize } from '../../ui'

const resisters = (attack: PokemonType) =>
  POKEMON_TYPES.filter((type) => typeChart[attack][type] < 1)

/** Ids added since the previous render, so only the new member's marks animate (never on first render). */
function useFreshIds(ids: readonly number[]) {
  const key = ids.join(',')
  const [snapshot, setSnapshot] = useState({ key, fresh: new Set<number>() })
  if (snapshot.key !== key) {
    const before = new Set(snapshot.key ? snapshot.key.split(',').map(Number) : [])
    setSnapshot({ key, fresh: new Set(ids.filter((id) => !before.has(id))) })
  }
  return snapshot.key === key ? snapshot.fresh : new Set<number>()
}

function ProblemSummary({ members }: { members: PokemonEntry[] }) {
  const problems = typeEngine.squadSummary(members).filter((row) => row.isProblem)
  if (problems.length === 0) {
    return (
      <div className="mb-6 max-w-[64ch]">
        <h2 className="mb-2 text-xl font-extrabold font-stretch-expanded">No problem types.</h2>
        <p className="text-ink-soft">
          Every attacking type is resisted by a member, or hits fewer than three of them.
        </p>
      </div>
    )
  }
  return (
    <div className="mb-6 grid max-w-[64ch] gap-5">
      {problems.map((row) => (
        <div key={row.attackingType}>
          <h2 className="mb-2 text-xl leading-tight font-extrabold font-stretch-expanded">
            {capitalize(row.attackingType)} hits {row.weak} of this squad's Pokémon
            super-effectively, and none of them resist it.
          </h2>
          <p className="leading-loose text-ink-soft">
            Add or swap in a Pokémon with one of these types to take the hit:{' '}
            {resisters(row.attackingType).map((type) => (
              <span key={type} className="mr-1 align-[1px]">
                <TypeChip type={type} />
              </span>
            ))}
          </p>
        </div>
      ))}
    </div>
  )
}

function MatchupSheet({ members }: { members: PokemonEntry[] }) {
  const fresh = useFreshIds(members.map((member) => member.id))
  const summary = typeEngine.squadSummary(members)
  const cell = 'h-10 border-b border-rule'
  return (
    <div className="overflow-x-auto rounded-panel border border-rule bg-panel">
      <table className="w-full min-w-[640px] border-collapse">
        <caption className="sr-only">Damage each member takes from each attacking type</caption>
        <thead>
          <tr className="border-b-[1.5px] border-ink text-sm font-bold font-stretch-condensed">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-panel px-4 pt-3.5 pb-3 text-left align-bottom sm:pl-6"
            >
              Attacking type
            </th>
            {members.map((member, i) => (
              <th
                key={`${member.id}-${i}`}
                scope="col"
                className="px-2 pt-3.5 pb-3 text-center align-bottom"
              >
                <PokemonArt src={member.sprite} size={40} className="mx-auto mb-1" />
                {member.displayName}
              </th>
            ))}
            <th scope="col" className="border-l-[1.5px] border-ink px-2 pb-3 align-bottom">
              Weak
            </th>
            <th scope="col" className="px-2 pb-3 align-bottom">
              Resist
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row, rowIndex) => {
            const resist = row.resist + row.immune
            return (
              <tr
                key={row.attackingType}
                data-problem={row.isProblem || undefined}
                style={{ '--row': rowIndex } as CSSProperties}
                className={`last:[&>*]:border-b-0 ${row.isProblem ? 'bg-paper/70' : ''}`}
              >
                <th
                  scope="row"
                  className={`${cell} sticky left-0 z-10 px-4 text-left sm:pl-6 ${
                    row.isProblem
                      ? "bg-[color-mix(in_srgb,var(--color-paper)_70%,var(--color-panel))] before:absolute before:inset-y-0 before:left-0 before:w-2 before:bg-ink before:content-['']"
                      : 'bg-panel'
                  }`}
                >
                  <TypeChip type={row.attackingType} />
                  {row.isProblem && <span className="sr-only"> (problem type)</span>}
                </th>
                {members.map((member, i) => (
                  <td key={`${member.id}-${i}`} className={`${cell} text-center`}>
                    <Mark
                      multiplier={typeEngine.multiplier(row.attackingType, member)}
                      fresh={fresh.has(member.id)}
                    />
                  </td>
                ))}
                <td
                  className={`${cell} border-l-[1.5px] border-l-ink text-center ${
                    row.weak === 0
                      ? 'font-medium text-rule-strong'
                      : row.isProblem
                        ? 'text-lg font-extrabold'
                        : 'font-bold'
                  }`}
                >
                  {row.weak}
                </td>
                <td
                  className={`${cell} text-center ${resist === 0 ? 'font-medium text-rule-strong' : 'font-bold'}`}
                >
                  {resist}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const LEGEND = [
  [4, 'Takes 4×'],
  [2, 'Takes 2×'],
  [1, 'Normal damage'],
  [0.5, 'Takes ½×'],
  [0.25, 'Takes ¼×'],
  [0, 'Immune'],
] as const

function Legend() {
  return (
    <ul aria-label="Legend" className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
      {LEGEND.map(([multiplier, label]) => (
        <li key={label} className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-flex min-w-8 justify-center">
            <Mark multiplier={multiplier} />
          </span>
          {label}
        </li>
      ))}
    </ul>
  )
}

function Coverage({ members }: { members: PokemonEntry[] }) {
  const { covered, uncovered } = typeEngine.squadCoverage(members)
  return (
    <section aria-labelledby="coverage-title" className="mt-12 grid gap-10 md:grid-cols-2">
      <div>
        <h2 id="coverage-title" className="mb-3 text-lg font-bold font-stretch-expanded">
          Attack coverage
        </h2>
        <p className="mb-3 max-w-[56ch] text-ink-soft">
          Types this squad hits super-effectively with its own types:
        </p>
        <ul aria-label="Covered types" className="flex flex-wrap gap-1">
          {covered.map((type) => (
            <li key={type}>
              <TypeChip type={type} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="mb-3 text-lg font-bold font-stretch-expanded">Not covered</h2>
        <p className="mb-3 max-w-[56ch] text-ink-soft">
          No member&apos;s own type hits these super-effectively. A member of a type that does would
          close the gap.
        </p>
        <ul aria-label="Uncovered types" className="flex flex-wrap gap-1">
          {uncovered.map((type) => (
            <li key={type}>
              <TypeChip type={type} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Problem types, the matchup sheet and coverage for a list of members (own or shared squads). */
export function SquadAnalysis({ members }: { members: PokemonEntry[] }) {
  if (members.length === 0) {
    return (
      <div className="grid max-w-[60ch] justify-items-start gap-3 rounded-panel border border-rule bg-panel p-6">
        <p className="text-lg font-bold font-stretch-expanded">
          Add Pokémon to see how this squad holds up.
        </p>
        <p className="text-ink-soft">
          Use “Add” in the Pokédex: each Pokémon goes into your current squad.
        </p>
        <Link to="/" className={buttonClass()}>
          Browse the Pokédex
        </Link>
      </div>
    )
  }
  return (
    <section aria-label="Analysis">
      <ProblemSummary members={members} />
      <MatchupSheet members={members} />
      <Legend />
      <Coverage members={members} />
    </section>
  )
}
