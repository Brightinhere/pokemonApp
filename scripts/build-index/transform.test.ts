import { describe, expect, test } from 'vitest'
import { POKEMON_TYPES } from '../../src/data/types'
import * as f from './fixtures'
import { pickSprite, toEntry, toTypeChart, type TransformReport } from './transform'

const transform = (raw: Parameters<typeof toEntry>[0]) => {
  const report: TransformReport = { generationFallbacks: [] }
  return { entry: toEntry(raw, report), report }
}

describe('toEntry', () => {
  test.each([
    [f.charizard, 'default', 1, 'Charizard', false],
    [f.charizardMegaX, 'mega', 6, 'Mega Charizard X', true],
    [f.charizardGmax, 'gmax', 8, 'Gigantamax Charizard', true],
    [f.vulpixAlola, 'regional', 7, 'Alolan Vulpix', false],
    [f.rotomWash, 'other', 4, 'Wash Rotom', false],
    [f.darmanitanGalarZen, 'regional', 8, 'Zen Galarian Darmanitan', true],
    [f.vivillon, 'default', 6, 'Vivillon', false],
  ] as const)('%# classifies %o', (raw, category, generation, displayName, battleOnly) => {
    const { entry } = transform(raw)
    expect(entry.formCategory).toBe(category)
    expect(entry.generation).toBe(generation)
    expect(entry.displayName).toBe(displayName)
    expect(entry.isBattleOnly).toBe(battleOnly)
  })

  test.each([
    [f.pikachuAlolaCap, 'other'],
    [f.raticateTotemAlola, 'other'],
    [f.raticateAlola, 'regional'],
    [f.darmanitanGalarZen, 'regional'],
    [f.taurosPaldeaCombat, 'regional'],
  ] as const)('totem and cap forms are not regional: %#', (raw, category) => {
    expect(transform(raw).entry.formCategory).toBe(category)
  })

  test('maps ids, types in slot order and all six stats', () => {
    const { entry } = transform(f.vulpixAlola)
    expect(entry).toMatchObject({ id: 10103, speciesId: 37, name: 'vulpix-alola', types: ['ice'] })
    expect(Object.keys(entry.stats)).toEqual([
      'hp',
      'attack',
      'defense',
      'specialAttack',
      'specialDefense',
      'speed',
    ])
    expect(transform(f.charizardMegaX).entry.types).toEqual(['fire', 'dragon'])
  })

  test('falls back to the species generation and reports it', () => {
    const raw = {
      ...f.rotomWash,
      pokemonforms: [{ ...f.rotomWash.pokemonforms[0]!, versiongroup: null }],
    }
    const { entry, report } = transform(raw)
    expect(entry.generation).toBe(4)
    expect(report.generationFallbacks).toEqual(['rotom-wash'])
  })
})

describe('pickSprite', () => {
  const gh = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

  test('prefers official artwork, then front sprite', () => {
    expect(
      pickSprite({
        front_default: `${gh}/1.png`,
        other: { 'official-artwork': { front_default: `${gh}/a/1.png` } },
      }),
    ).toBe(`${gh}/a/1.png`)
    expect(pickSprite({ front_default: `${gh}/1.png` })).toBe(`${gh}/1.png`)
  })

  test('rewrites repo-relative /media paths and rejects other hosts', () => {
    expect(pickSprite({ front_default: '/media/sprites/pokemon/1.png' })).toBe(`${gh}/1.png`)
    expect(
      pickSprite({ front_default: 'https://pokeapi.co/media/sprites/pokemon/1.png' }),
    ).toBeNull()
    expect(pickSprite(JSON.stringify({ front_default: null }))).toBeNull()
  })
})

describe('toTypeChart', () => {
  const allNeutral = POKEMON_TYPES.flatMap((a, i) =>
    POKEMON_TYPES.map((d, j) => f.efficacy([i + 1, a], [j + 1, d], 100)),
  )

  test('converts factors to multipliers', () => {
    const rows = allNeutral.map((row) =>
      row.type.name === 'ground' && row.TypeByTargetTypeId.name === 'flying'
        ? { ...row, damage_factor: 0 }
        : row.type.name === 'fire' && row.TypeByTargetTypeId.name === 'grass'
          ? { ...row, damage_factor: 200 }
          : row,
    )
    const chart = toTypeChart(rows)
    expect(chart.ground.flying).toBe(0)
    expect(chart.fire.grass).toBe(2)
    expect(chart.normal.normal).toBe(1)
  })

  test('drops stellar, unknown and shadow rows', () => {
    const chart = toTypeChart([
      ...allNeutral,
      f.efficacy([19, 'stellar'], [1, 'normal'], 200),
      f.efficacy([1, 'normal'], [10001, 'unknown'], 100),
      f.efficacy([10002, 'shadow'], [10002, 'shadow'], 50),
    ])
    expect(Object.keys(chart)).toEqual([...POKEMON_TYPES])
    expect(Object.keys(chart.normal)).toEqual([...POKEMON_TYPES])
  })

  test('throws on an unknown damage factor', () => {
    expect(() => toTypeChart([f.efficacy([10, 'fire'], [12, 'grass'], 400)])).toThrow('400')
  })
})
