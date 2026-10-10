import { describe, expect, test } from 'vitest'
import { POKEMON_TYPES, type PokemonEntry, type TypeChart } from './types'
import { SPRITE_URL_PREFIX, validateIndex, validateTypeChart } from './validate'

const entry = (overrides: Partial<PokemonEntry> = {}): PokemonEntry => ({
  id: 25,
  speciesId: 25,
  name: 'pikachu',
  displayName: 'Pikachu',
  types: ['electric'],
  stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  generation: 1,
  formCategory: 'default',
  isDefault: true,
  isBattleOnly: false,
  isLegendary: false,
  isMythical: false,
  sprite: `${SPRITE_URL_PREFIX}master/sprites/pokemon/other/official-artwork/25.png`,
  ...overrides,
})

const neutralChart = (): TypeChart =>
  Object.fromEntries(
    POKEMON_TYPES.map((a) => [a, Object.fromEntries(POKEMON_TYPES.map((d) => [d, 1]))]),
  ) as TypeChart

describe('validateIndex', () => {
  test('accepts valid entries', () => {
    expect(validateIndex([entry(), entry({ id: 26, name: 'raichu', sprite: null })])).toEqual([])
  })

  test('rejects a non-array and an empty array', () => {
    expect(validateIndex({})).toHaveLength(1)
    expect(validateIndex([])).toEqual(['index: no entries'])
  })

  test.each([
    ['no types', { types: [] as unknown as PokemonEntry['types'] }, 'must have one or two types'],
    ['unknown type', { types: ['stellar'] as unknown as PokemonEntry['types'] }, 'unknown type'],
    ['duplicate type', { types: ['fire', 'fire'] as PokemonEntry['types'] }, 'duplicate type'],
    ['negative stat', { stats: { ...entry().stats, speed: -1 } }, 'stat speed'],
    ['bad category', { formCategory: 'shiny' as PokemonEntry['formCategory'] }, 'formCategory'],
    ['bad generation', { generation: 0 }, 'generation'],
    ['missing display name', { displayName: '' }, 'displayName'],
    ['sprite on pokeapi.co', { sprite: 'https://pokeapi.co/media/25.png' }, 'sprite'],
    ['non-boolean flag', { isLegendary: 'no' as unknown as boolean }, 'isLegendary'],
  ])('rejects %s and names the entry', (_, overrides, fragment) => {
    const errors = validateIndex([entry(overrides)])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('entry pikachu')
    expect(errors[0]).toContain(fragment)
  })

  test('rejects duplicate ids', () => {
    expect(validateIndex([entry(), entry({ name: 'pikachu-copy' })])).toEqual([
      'entry pikachu-copy: duplicate id 25',
    ])
  })
})

describe('validateTypeChart', () => {
  test('accepts a complete 18x18 chart', () => {
    expect(validateTypeChart(neutralChart())).toEqual([])
  })

  test('rejects a missing row', () => {
    const chart: Partial<TypeChart> = neutralChart()
    delete chart.fairy
    expect(validateTypeChart(chart)).toEqual(['typechart: missing row for fairy'])
  })

  test('rejects non-battle types and invalid multipliers', () => {
    const chart = neutralChart() as Record<string, Record<string, number>>
    chart.stellar = {}
    chart.fire!.grass = 4
    chart.fire!.unknown = 1
    expect(validateTypeChart(chart)).toEqual([
      'typechart: unexpected attacking type "stellar"',
      'typechart: unexpected defending type "unknown" in fire',
      'typechart: fire->grass must be 0, 0.5, 1 or 2',
    ])
  })
})
