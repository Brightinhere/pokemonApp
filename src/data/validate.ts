import { FORM_CATEGORIES, POKEMON_TYPES, type PokemonEntry, type PokemonType } from './types'

export const SPRITE_URL_PREFIX = 'https://raw.githubusercontent.com/PokeAPI/sprites/'

const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
const MULTIPLIERS: readonly unknown[] = [0, 0.5, 1, 2]

const isType = (value: unknown): value is PokemonType =>
  (POKEMON_TYPES as readonly unknown[]).includes(value)

const isPositiveInt = (value: unknown) => Number.isInteger(value) && (value as number) >= 1

/** Returns one message per problem found; an empty array means the index is valid. */
export function validateIndex(entries: unknown): string[] {
  if (!Array.isArray(entries)) return ['index: expected an array of entries']
  if (entries.length === 0) return ['index: no entries']

  const errors: string[] = []
  const seenIds = new Set<number>()

  entries.forEach((raw: Partial<PokemonEntry>, position) => {
    const label = `entry ${typeof raw?.name === 'string' ? raw.name : `#${position}`}`
    const fail = (message: string) => errors.push(`${label}: ${message}`)

    if (!isPositiveInt(raw.id)) fail('id must be a positive integer')
    else if (seenIds.has(raw.id!)) fail(`duplicate id ${raw.id}`)
    else seenIds.add(raw.id!)

    if (!isPositiveInt(raw.speciesId)) fail('speciesId must be a positive integer')
    if (typeof raw.name !== 'string' || raw.name === '') fail('name is missing')
    if (typeof raw.displayName !== 'string' || raw.displayName === '')
      fail('displayName is missing')

    const types = raw.types as unknown
    if (!Array.isArray(types) || types.length < 1 || types.length > 2) {
      fail('must have one or two types')
    } else if (!types.every(isType)) {
      fail(`unknown type in ${JSON.stringify(types)}`)
    } else if (types.length === 2 && types[0] === types[1]) {
      fail('duplicate type')
    }

    const stats = raw.stats as Record<string, unknown> | undefined
    for (const key of STAT_KEYS) {
      const value = stats?.[key]
      if (!Number.isInteger(value) || (value as number) < 0) {
        fail(`stat ${key} must be a non-negative integer`)
      }
    }

    if (!isPositiveInt(raw.generation)) fail('generation must be a positive integer')
    if (!(FORM_CATEGORIES as readonly unknown[]).includes(raw.formCategory)) {
      fail(`unknown formCategory ${JSON.stringify(raw.formCategory)}`)
    }
    for (const flag of ['isDefault', 'isBattleOnly', 'isLegendary', 'isMythical'] as const) {
      if (typeof raw[flag] !== 'boolean') fail(`${flag} must be a boolean`)
    }
    if (
      raw.sprite !== null &&
      !(typeof raw.sprite === 'string' && raw.sprite.startsWith(SPRITE_URL_PREFIX))
    ) {
      fail(`sprite must be null or start with ${SPRITE_URL_PREFIX}`)
    }
  })

  return errors
}

/** Returns one message per problem found; an empty array means the chart is valid. */
export function validateTypeChart(chart: unknown): string[] {
  if (typeof chart !== 'object' || chart === null) return ['typechart: expected an object']

  const errors: string[] = []
  const rows = chart as Record<string, unknown>

  for (const key of Object.keys(rows)) {
    if (!isType(key)) errors.push(`typechart: unexpected attacking type "${key}"`)
  }
  for (const attacker of POKEMON_TYPES) {
    const row = rows[attacker]
    if (typeof row !== 'object' || row === null) {
      errors.push(`typechart: missing row for ${attacker}`)
      continue
    }
    const cells = row as Record<string, unknown>
    for (const key of Object.keys(cells)) {
      if (!isType(key)) errors.push(`typechart: unexpected defending type "${key}" in ${attacker}`)
    }
    for (const defender of POKEMON_TYPES) {
      if (!MULTIPLIERS.includes(cells[defender])) {
        errors.push(`typechart: ${attacker}->${defender} must be 0, 0.5, 1 or 2`)
      }
    }
  }
  return errors
}
