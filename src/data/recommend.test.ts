import { describe, expect, test } from 'vitest'
import { recommend } from '../engine'
import indexJson from './index.json'
import type { PokemonEntry } from './types'
import { typeEngine } from './typeEngine'

const index = indexJson as PokemonEntry[]
const byName = new Map(index.map((e) => [e.name, e]))
const squad = (...names: string[]) => names.map((n) => byName.get(n)!)
/** The default options: no legendary, mythical or battle-only entries; all generations. */
const defaultPool = index.filter((e) => !e.isBattleOnly && !e.isLegendary && !e.isMythical)

const kantoFive = squad('charizard', 'gyarados', 'dragonite', 'venusaur', 'gengar')

describe('recommendations on real data (spec scenarios)', () => {
  test('completing the example five: Dark/Steel first, and every suggestion resists Rock', () => {
    const suggestions = recommend(typeEngine, { members: kantoFive, pool: defaultPool })
    expect(suggestions[0]!.types).toEqual(['steel', 'dark'])
    expect(suggestions[0]!.entries[0]!.displayName).toBe('Kingambit')
    expect(suggestions[0]!.reasons.fixes).toEqual(['rock'])
    for (const s of suggestions) {
      expect(typeEngine.multiplier('rock', { types: s.types })).toBeLessThan(1)
    }
  })

  test('breakdown on the example five: Dark/Steel is all defense, Fairy/Steel adds attack', () => {
    const suggestions = recommend(typeEngine, { members: kantoFive, pool: defaultPool })
    const find = (key: string) => suggestions.find((s) => s.types.join('/') === key)!
    expect(find('steel/dark').breakdown).toEqual({ defense: 19, attack: 0 })
    expect(find('steel/fairy').breakdown).toEqual({ defense: 18, attack: 1 })
    expect(find('steel/fairy').gain).toBe(find('steel/dark').gain)
  })

  test('three members: Ground/Steel first', () => {
    const [first] = recommend(typeEngine, {
      members: squad('charizard', 'gyarados', 'venusaur'),
      pool: defaultPool,
    })
    expect(first!.types).toEqual(['ground', 'steel'])
  })

  test('replacing Venusaur in the six-member example: Dark/Steel first', () => {
    const six = [...kantoFive, byName.get('pikachu')!]
    const suggestions = recommend(typeEngine, { members: six, pool: defaultPool, replaceIndex: 3 })
    expect(suggestions[0]!.types).toEqual(['steel', 'dark'])
    expect(suggestions.flatMap((s) => s.entries).some((e) => e.speciesId === 3)).toBe(false)
  })

  test('Steel/Psychic lists the strongest first, Beldum last', () => {
    // A replacement search returns every group regardless of gain, so Steel/Psychic is always present.
    const suggestions = recommend(typeEngine, {
      members: kantoFive,
      pool: defaultPool,
      replaceIndex: 0,
      limit: 500,
    })
    const steelPsychic = suggestions.find((s) => s.types.join('/') === 'steel/psychic')!
    const names = steelPsychic.entries.map((e) => e.displayName)
    expect(names.slice(0, 3)).toEqual(['Metagross', 'Iron Crown', 'Bronzong'])
    expect(names.indexOf('Beldum')).toBeGreaterThan(2)
  })

  test('defaults never suggest legendary, mythical, battle-only or squad species', () => {
    const entries = recommend(typeEngine, {
      members: kantoFive,
      pool: defaultPool,
      limit: 200,
    }).flatMap((s) => s.entries)
    expect(entries.some((e) => e.isLegendary || e.isMythical || e.isBattleOnly)).toBe(false)
    const squadSpecies = new Set(kantoFive.map((m) => m.speciesId))
    expect(entries.some((e) => squadSpecies.has(e.speciesId))).toBe(false)
  })

  test('performance: a full-index replacement search stays under 20ms', () => {
    const six = [...kantoFive, byName.get('pikachu')!]
    recommend(typeEngine, { members: six, pool: index, replaceIndex: 3 }) // warm up
    const times = Array.from({ length: 10 }, () => {
      const start = performance.now()
      recommend(typeEngine, { members: six, pool: index, replaceIndex: 3 })
      return performance.now() - start
    }).sort((a, b) => a - b)
    expect(times[5]).toBeLessThan(20)
  })
})
