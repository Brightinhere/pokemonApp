/** The 18 battle types, in PokeAPI id order. */
export const POKEMON_TYPES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

export const FORM_CATEGORIES = ['default', 'regional', 'mega', 'gmax', 'other'] as const

export type FormCategory = (typeof FORM_CATEGORIES)[number]

export interface BaseStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

/** One entry per PokeAPI `pokemon` resource (cosmetic forms excluded). */
export interface PokemonEntry {
  id: number
  speciesId: number
  /** PokeAPI slug, e.g. `vulpix-alola`. */
  name: string
  /** English name, e.g. `Alolan Vulpix`. */
  displayName: string
  types: [PokemonType] | [PokemonType, PokemonType]
  stats: BaseStats
  /** Generation in which this specific form was introduced. */
  generation: number
  formCategory: FormCategory
  isDefault: boolean
  isBattleOnly: boolean
  isLegendary: boolean
  isMythical: boolean
  sprite: string | null
}

export type Multiplier = 0 | 0.5 | 1 | 2

/** `chart[attacker][defender]` is the damage multiplier. */
export type TypeChart = Record<PokemonType, Record<PokemonType, Multiplier>>
