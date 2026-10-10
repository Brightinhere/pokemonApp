import { POKEMON_TYPES, type PokemonEntry, type PokemonType } from '../data/types'
import type { TypeEngine } from './typeEffectiveness'

/** Score weights (see the squad-recommendations spec). Problem types dominate on purpose. */
export const SCORE_WEIGHTS = {
  /** Per weak member beyond those that resist or are immune. */
  weakExcess: 2,
  /** Per member taking 4×. */
  quad: 1,
  /** Per problem type (3+ weak, none resisting). */
  problem: 6,
  /** Per defending type the squad's own types hit super-effectively. */
  coverage: 1,
} as const

type TypeSet = readonly PokemonType[]

const total = (entry: PokemonEntry) =>
  entry.stats.hp +
  entry.stats.attack +
  entry.stats.defense +
  entry.stats.specialAttack +
  entry.stats.specialDefense +
  entry.stats.speed

const canonical = (types: Iterable<PokemonType>) => {
  const set = new Set(types)
  return POKEMON_TYPES.filter((type) => set.has(type))
}

/** A squad's type score: coverage minus defensive penalties. Higher is better. */
export function scoreSquad(engine: TypeEngine, squad: readonly TypeSet[]): number {
  const defenders = squad.map((types) => ({ types }))
  let score = engine.squadCoverage(defenders).covered.length * SCORE_WEIGHTS.coverage
  for (const row of engine.squadSummary(defenders)) {
    score -= Math.max(0, row.weak - (row.resist + row.immune)) * SCORE_WEIGHTS.weakExcess
    score -= row.quadWeak * SCORE_WEIGHTS.quad
    if (row.isProblem) score -= SCORE_WEIGHTS.problem
  }
  return score
}

export interface SuggestionReasons {
  /** Problem types that stop being problems. */
  fixes: PokemonType[]
  /** Attacking types the squad was exposed to (more weak than resisting) that this resists or is immune to. */
  resists: PokemonType[]
  /** Defending types newly hit super-effectively by the squad's own types. */
  covers: PokemonType[]
  /** Problem types the change creates. */
  newProblems: PokemonType[]
  /** Defending types the squad no longer hits super-effectively. */
  losesCoverage: PokemonType[]
}

export interface Suggestion {
  /** The type combination, in canonical order. */
  types: PokemonType[]
  /** Score change compared with the current squad. */
  gain: number
  /** Highest base-stat total in the group (tie-break). */
  bestTotal: number
  /** Every matching entry: highest total first, then dex number, then id. */
  entries: PokemonEntry[]
  reasons: SuggestionReasons
}

export interface RecommendInput {
  /** The current squad, in order. */
  members: readonly PokemonEntry[]
  /** Candidates, already filtered by the player's options. */
  pool: readonly PokemonEntry[]
  /** Suggest replacements for this member instead of additions. */
  replaceIndex?: number
  /** Maximum number of suggestions (default 5). */
  limit?: number
}

const exposedTo = (engine: TypeEngine, squad: readonly TypeSet[]) =>
  engine
    .squadSummary(squad.map((types) => ({ types })))
    .filter((row) => row.weak > row.resist + row.immune)
    .map((row) => row.attackingType)

const problemsOf = (engine: TypeEngine, squad: readonly TypeSet[]) =>
  engine
    .squadSummary(squad.map((types) => ({ types })))
    .filter((row) => row.isProblem)
    .map((row) => row.attackingType)

const coveredBy = (engine: TypeEngine, squad: readonly TypeSet[]) =>
  engine.squadCoverage(squad.map((types) => ({ types }))).covered

const minus = (a: readonly PokemonType[], b: readonly PokemonType[]) =>
  a.filter((type) => !b.includes(type))

/**
 * Suggests type combinations to add to a squad (or to replace one member with), best first.
 * Pure: depends only on the engine's chart and the input.
 */
export function recommend(engine: TypeEngine, input: RecommendInput): Suggestion[] {
  const { members, pool, replaceIndex, limit = 5 } = input
  const replacing = replaceIndex !== undefined
  const current = members.map((member) => member.types)
  const base = replacing ? current.filter((_, i) => i !== replaceIndex) : current
  const currentScore = scoreSquad(engine, current)
  const excludedSpecies = new Set(members.map((member) => member.speciesId))

  const before = {
    problems: problemsOf(engine, current),
    exposed: exposedTo(engine, current),
    covered: coveredBy(engine, current),
  }

  const groups = new Map<string, { types: PokemonType[]; entries: PokemonEntry[] }>()
  for (const entry of pool) {
    if (excludedSpecies.has(entry.speciesId)) continue
    const types = canonical(entry.types)
    const key = types.join('/')
    const group = groups.get(key)
    if (group) group.entries.push(entry)
    else groups.set(key, { types, entries: [entry] })
  }

  const suggestions: Suggestion[] = []
  for (const { types, entries } of groups.values()) {
    const after = [...base, types]
    const gain = scoreSquad(engine, after) - currentScore
    if (!replacing && gain <= 0) continue

    const afterProblems = problemsOf(engine, after)
    const afterCovered = coveredBy(engine, after)
    entries.sort((a, b) => total(b) - total(a) || a.speciesId - b.speciesId || a.id - b.id)
    suggestions.push({
      types,
      gain,
      bestTotal: total(entries[0]!),
      entries,
      reasons: {
        fixes: minus(before.problems, afterProblems),
        resists: before.exposed.filter((attack) => engine.multiplier(attack, { types }) < 1),
        covers: minus(afterCovered, before.covered),
        newProblems: minus(afterProblems, before.problems),
        losesCoverage: minus(before.covered, afterCovered),
      },
    })
  }

  return suggestions
    .sort(
      (a, b) =>
        b.gain - a.gain ||
        b.bestTotal - a.bestTotal ||
        a.types.join('/').localeCompare(b.types.join('/')),
    )
    .slice(0, limit)
}
