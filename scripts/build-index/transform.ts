import {
  POKEMON_TYPES,
  type BaseStats,
  type FormCategory,
  type Multiplier,
  type PokemonEntry,
  type PokemonType,
  type TypeChart,
} from '../../src/data/types'
import { SPRITE_URL_PREFIX } from '../../src/data/validate'
import type { RawPokemon, RawSprites, RawTypeEfficacy } from './queries'

const REGIONAL_TOKENS = ['alola', 'galar', 'hisui', 'paldea']

const STAT_NAMES: Record<string, keyof BaseStats> = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'specialAttack',
  'special-defense': 'specialDefense',
  speed: 'speed',
}

export interface TransformReport {
  /** Entries whose generation fell back to the species generation. */
  generationFallbacks: string[]
}

export function classifyForm(raw: RawPokemon): FormCategory {
  const form = raw.pokemonforms[0]
  if (raw.is_default) return 'default'
  if (form?.is_mega) return 'mega'
  if (form && (form.form_name === 'gmax' || form.form_name.endsWith('-gmax'))) return 'gmax'
  if (raw.name.split('-').some((token) => REGIONAL_TOKENS.includes(token))) return 'regional'
  return 'other'
}

/** Picks official artwork, then the front sprite; only GitHub-hosted URLs are kept. */
export function pickSprite(sprites: RawSprites | string | undefined): string | null {
  const parsed: RawSprites = typeof sprites === 'string' ? JSON.parse(sprites) : (sprites ?? {})
  const candidates = [parsed.other?.['official-artwork']?.front_default, parsed.front_default]
  for (const candidate of candidates) {
    if (!candidate) continue
    // Older GraphQL payloads use paths relative to the sprites repo, e.g. /media/sprites/...
    const url = candidate.startsWith('/media/')
      ? `${SPRITE_URL_PREFIX}master/${candidate.slice('/media/'.length)}`
      : candidate
    if (url.startsWith(SPRITE_URL_PREFIX)) return url
  }
  return null
}

export function toEntry(raw: RawPokemon, report: TransformReport): PokemonEntry {
  const form = raw.pokemonforms[0]
  const species = raw.pokemonspecy

  let generation = form?.versiongroup?.generation_id
  if (generation == null) {
    generation = species.generation_id
    report.generationFallbacks.push(raw.name)
  }

  const stats = {} as BaseStats
  for (const { base_stat, stat } of raw.pokemonstats) {
    const key = STAT_NAMES[stat.name]
    if (key) stats[key] = base_stat
  }

  // Default forms use the species name ("Vivillon", not "Meadow Vivillon").
  const speciesName = species.pokemonspeciesnames[0]?.name ?? ''
  const displayName = raw.is_default
    ? speciesName
    : form?.pokemonformnames[0]?.pokemon_name || speciesName

  // Key order here is the key order in index.json; keep it stable.
  return {
    id: raw.id,
    speciesId: raw.pokemon_species_id,
    name: raw.name,
    displayName,
    types: raw.pokemontypes.map((t) => t.type.name) as PokemonEntry['types'],
    stats: {
      hp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      specialAttack: stats.specialAttack,
      specialDefense: stats.specialDefense,
      speed: stats.speed,
    },
    generation,
    formCategory: classifyForm(raw),
    isDefault: raw.is_default,
    isBattleOnly: form?.is_battle_only ?? false,
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
    sprite: pickSprite(raw.pokemonsprites[0]?.sprites),
  }
}

const FACTOR_TO_MULTIPLIER: Record<number, Multiplier> = { 0: 0, 50: 0.5, 100: 1, 200: 2 }

const isBattleType = (name: string): name is PokemonType =>
  (POKEMON_TYPES as readonly string[]).includes(name)

/** Builds the 18x18 chart; rows for non-battle types (stellar, unknown, shadow) are dropped. */
export function toTypeChart(rows: RawTypeEfficacy[]): TypeChart {
  const chart = Object.fromEntries(POKEMON_TYPES.map((t) => [t, {}])) as Record<
    PokemonType,
    Partial<Record<PokemonType, Multiplier>>
  >
  for (const row of rows) {
    const attacker = row.type.name
    const defender = row.TypeByTargetTypeId.name
    if (!isBattleType(attacker) || !isBattleType(defender)) continue
    const multiplier = FACTOR_TO_MULTIPLIER[row.damage_factor]
    if (multiplier === undefined) {
      throw new Error(`Unexpected damage factor ${row.damage_factor} for ${attacker}->${defender}`)
    }
    chart[attacker][defender] = multiplier
  }
  // Rebuild in canonical order so the output is deterministic.
  return Object.fromEntries(
    POKEMON_TYPES.map((a) => [a, Object.fromEntries(POKEMON_TYPES.map((d) => [d, chart[a][d]]))]),
  ) as TypeChart
}
