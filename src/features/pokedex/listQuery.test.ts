import { describe, expect, test } from 'vitest'
import indexJson from '../../data/index.json'
import type { PokemonEntry } from '../../data/types'
import {
  DEFAULT_QUERY,
  applyListQuery,
  normalize,
  parseListQuery,
  serializeListQuery,
  type ListQuery,
} from './listQuery'

const index = indexJson as PokemonEntry[]
const query = (overrides: Partial<ListQuery> = {}): ListQuery => ({
  ...DEFAULT_QUERY,
  ...overrides,
})
const run = (overrides: Partial<ListQuery> = {}) => applyListQuery(index, query(overrides))
const names = (entries: PokemonEntry[]) => entries.map((e) => e.displayName)

describe('parseListQuery / serializeListQuery', () => {
  test('the default query serializes to an empty URL', () => {
    expect(serializeListQuery(DEFAULT_QUERY).toString()).toBe('')
    expect(parseListQuery(new URLSearchParams())).toEqual(DEFAULT_QUERY)
  })

  test('a full query round-trips', () => {
    const full: ListQuery = {
      search: 'char',
      types: ['fire', 'flying'],
      maxGeneration: 4,
      forms: ['regional', 'gmax'],
      includeLegendary: false,
      sort: 'speed',
    }
    const params = serializeListQuery(full)
    expect(params.toString()).toBe(
      'q=char&types=fire%2Cflying&gen=4&forms=regional%2Cgmax&legendary=exclude&sort=speed',
    )
    expect(parseListQuery(params)).toEqual(full)
  })

  test('the shared-link example parses', () => {
    expect(parseListQuery(new URLSearchParams('types=fire,flying&sort=speed'))).toEqual(
      query({ types: ['fire', 'flying'], sort: 'speed' }),
    )
  })

  test('invalid values are ignored and at most two valid types are kept', () => {
    const parsed = parseListQuery(
      new URLSearchParams('types=fire,shadow,water,grass&gen=42&sort=height'),
    )
    expect(parsed).toEqual(query({ types: ['fire', 'water'] }))
  })

  test.each(['0', '10', '2.5', 'abc', ''])('generation %j falls back to all', (gen) => {
    expect(parseListQuery(new URLSearchParams({ gen })).maxGeneration).toBeNull()
  })

  test('forms are deduplicated and kept in canonical order', () => {
    expect(parseListQuery(new URLSearchParams('forms=other,mega,mega,shiny')).forms).toEqual([
      'mega',
      'other',
    ])
  })
})

describe('normalize', () => {
  test.each([
    ['Flabébé', 'flabebe'],
    ['Mr. Mime', 'mrmime'],
    ['Farfetch’d', 'farfetchd'],
    ['Type: Null', 'typenull'],
  ])('%s -> %s', (input, output) => {
    expect(normalize(input)).toBe(output)
  })
})

describe('applyListQuery', () => {
  test('default: one row per species in dex order', () => {
    const result = run()
    expect(result).toHaveLength(1025)
    expect(result[0]?.displayName).toBe('Bulbasaur')
    expect(result.every((e) => e.isDefault)).toBe(true)
  })

  test('Mega toggle adds 97 rows', () => {
    const result = run({ forms: ['mega'] })
    expect(result).toHaveLength(1122)
    expect(result.filter((e) => e.formCategory === 'mega')).toHaveLength(97)
  })

  test('forms follow their species when sorted by number', () => {
    const result = names(run({ forms: ['mega', 'gmax'] }))
    const at = result.indexOf('Charizard')
    expect(result.slice(at, at + 5)).toEqual([
      'Charizard',
      'Mega Charizard X',
      'Mega Charizard Y',
      'Gigantamax Charizard',
      'Squirtle',
    ])
  })

  test('Other forms include Rotom appliances and Alola Cap Pikachu, which is not regional', () => {
    const other = names(run({ forms: ['other'] }))
    for (const name of [
      'Heat Rotom',
      'Wash Rotom',
      'Frost Rotom',
      'Fan Rotom',
      'Mow Rotom',
      'Alola Cap Pikachu',
    ]) {
      expect(other).toContain(name)
    }
    expect(names(run({ forms: ['regional'] }))).not.toContain('Alola Cap Pikachu')
  })

  test('name search', () => {
    expect(names(run({ search: 'char' }))).toEqual(
      expect.arrayContaining(['Charmander', 'Charmeleon', 'Charizard', 'Charjabug', 'Charcadet']),
    )
  })

  test.each([
    ['farfetchd', 'Farfetch’d'],
    ['mr mime', 'Mr. Mime'],
    ['flabebe', 'Flabébé'],
    ['  PIKACHU ', 'Pikachu'],
  ])('search %j finds %s', (search, name) => {
    expect(names(run({ search }))).toContain(name)
  })

  test.each(['6', '#0006', '#6'])('number search %j matches only dex number 6', (search) => {
    const result = run({ search, forms: ['mega', 'gmax'] })
    expect(result.length).toBe(4)
    expect(result.every((e) => e.speciesId === 6)).toBe(true)
  })

  test('two types: exactly the Fire/Flying species', () => {
    expect(names(run({ types: ['fire', 'flying'] }))).toEqual([
      'Charizard',
      'Moltres',
      'Ho-Oh',
      'Fletchinder',
      'Talonflame',
      'Oricorio',
    ])
  })

  test('up to generation 1 is 151 rows', () => {
    expect(run({ maxGeneration: 1 })).toHaveLength(151)
  })

  test('forms are judged by their own generation', () => {
    const result = names(run({ maxGeneration: 6, forms: ['regional'] }))
    expect(result).toContain('Vulpix')
    expect(result).not.toContain('Alolan Vulpix')
  })

  test('excluding legendary and mythical', () => {
    const result = names(run({ includeLegendary: false }))
    expect(result).not.toContain('Mewtwo')
    expect(result).not.toContain('Mew')
    expect(result).not.toContain('Arceus')
    expect(result).toContain('Charizard')
  })

  test('sort by speed', () => {
    expect(
      run({ sort: 'speed' })
        .slice(0, 3)
        .map((e) => [e.displayName, e.stats.speed]),
    ).toEqual([
      ['Regieleki', 200],
      ['Ninjask', 160],
      ['Pheromosa', 151],
    ])
  })

  test('sort by total', () => {
    expect(names(run({ sort: 'total' }).slice(0, 3))).toEqual(['Arceus', 'Eternatus', 'Mewtwo'])
  })

  test('sort by name', () => {
    const result = names(run({ sort: 'name' }))
    expect(result[0]).toBe('Abomasnow')
    expect([...result].sort((a, b) => a.localeCompare(b, 'en'))).toEqual(result)
  })

  test('stat ties break by dex number', () => {
    const result = run({ sort: 'hp' })
    for (let i = 1; i < result.length; i++) {
      const [a, b] = [result[i - 1]!, result[i]!]
      if (a.stats.hp === b.stats.hp) expect(a.speciesId <= b.speciesId).toBe(true)
    }
  })

  test('no match returns an empty list', () => {
    expect(run({ search: 'zzzz' })).toEqual([])
  })

  test('does not modify the input', () => {
    const copy = [...index]
    run({ sort: 'speed', forms: ['mega'] })
    expect(index).toEqual(copy)
  })
})
