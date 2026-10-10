import { POKEMON_TYPES, type PokemonType, type TypeChart } from '../data/types'

/** Adjusts the result for one attacking type after the type product (e.g. an ability). */
export type DefensiveModifier =
  | { attackingType: PokemonType; effect: 'immune' }
  | { attackingType: PokemonType; effect: 'scale'; factor: number }

/** Anything that can be hit: a `PokemonEntry` fits as-is. */
export interface Defender {
  /** One or two types; order does not matter. */
  types: readonly PokemonType[]
  modifiers?: readonly DefensiveModifier[]
}

export type Effectiveness = 'immune' | 'resist' | 'neutral' | 'weak'

export interface TypeMultiplier {
  type: PokemonType
  multiplier: number
}

export interface Coverage {
  /** Defending types at least one attacking type hits super-effectively. */
  covered: PokemonType[]
  /** Defending types no attacking type hits super-effectively. */
  uncovered: PokemonType[]
}

export interface BestAttack {
  multiplier: number
  /** Every attacking type reaching `multiplier`, in canonical order. */
  types: PokemonType[]
}

export interface SquadSummaryRow {
  attackingType: PokemonType
  weak: number
  neutral: number
  resist: number
  immune: number
  /** Members taking 4x or more (a subset of `weak`). */
  quadWeak: number
  isProblem: boolean
}

/** A type is a squad problem when at least this many members are weak and none resist it. */
export const PROBLEM_WEAK_THRESHOLD = 3

export function classify(multiplier: number): Effectiveness {
  if (multiplier === 0) return 'immune'
  if (multiplier < 1) return 'resist'
  if (multiplier === 1) return 'neutral'
  return 'weak'
}

/** Keeps canonical type order and drops duplicates. */
const canonical = (types: Iterable<PokemonType>): PokemonType[] => {
  const set = new Set(types)
  return POKEMON_TYPES.filter((type) => set.has(type))
}

/**
 * Binds the type logic to a chart (`chart[attacker][defender]`). Every function is pure:
 * results depend only on the chart and the arguments, and nothing passed in is modified.
 */
export function createTypeEngine(chart: TypeChart) {
  function typeProduct(attackingType: PokemonType, defendingTypes: readonly PokemonType[]) {
    let product = 1
    for (const defendingType of defendingTypes) product *= chart[attackingType][defendingType]
    return product
  }

  /** Damage multiplier of `attackingType` against `defender`, modifiers included. */
  function multiplier(attackingType: PokemonType, defender: Defender): number {
    let result = typeProduct(attackingType, defender.types)
    for (const modifier of defender.modifiers ?? []) {
      if (modifier.attackingType !== attackingType) continue
      if (modifier.effect === 'immune') return 0
      result *= modifier.factor
    }
    return result
  }

  /** Multiplier of each of the 18 attacking types against `defender`, in canonical order. */
  function defensiveProfile(defender: Defender): TypeMultiplier[] {
    return POKEMON_TYPES.map((type) => ({ type, multiplier: multiplier(type, defender) }))
  }

  /** Which single defending types the attacking types can hit super-effectively. */
  function coverage(attackingTypes: Iterable<PokemonType>): Coverage {
    const attackers = canonical(attackingTypes)
    const covered: PokemonType[] = []
    const uncovered: PokemonType[] = []
    for (const defendingType of POKEMON_TYPES) {
      const hit = attackers.some((attacker) => chart[attacker][defendingType] > 1)
      ;(hit ? covered : uncovered).push(defendingType)
    }
    return { covered, uncovered }
  }

  /** The strongest of `attackingTypes` against `defender`, or null when there are none. */
  function bestAttack(
    attackingTypes: Iterable<PokemonType>,
    defender: Defender,
  ): BestAttack | null {
    let best: BestAttack | null = null
    for (const type of canonical(attackingTypes)) {
      const value = multiplier(type, defender)
      if (!best || value > best.multiplier) best = { multiplier: value, types: [type] }
      else if (value === best.multiplier) best.types.push(type)
    }
    return best
  }

  /** Per attacking type: how the squad's members fare against it. */
  function squadSummary(defenders: readonly Defender[]): SquadSummaryRow[] {
    return POKEMON_TYPES.map((attackingType) => {
      const row = { weak: 0, neutral: 0, resist: 0, immune: 0, quadWeak: 0 }
      for (const defender of defenders) {
        const value = multiplier(attackingType, defender)
        row[classify(value)] += 1
        if (value >= 4) row.quadWeak += 1
      }
      const isProblem = row.weak >= PROBLEM_WEAK_THRESHOLD && row.resist + row.immune === 0
      return { attackingType, ...row, isProblem }
    })
  }

  /** Coverage of the union of every member's own types. */
  function squadCoverage(defenders: readonly Defender[]): Coverage {
    return coverage(defenders.flatMap((defender) => defender.types))
  }

  return { multiplier, defensiveProfile, coverage, bestAttack, squadSummary, squadCoverage }
}

export type TypeEngine = ReturnType<typeof createTypeEngine>
