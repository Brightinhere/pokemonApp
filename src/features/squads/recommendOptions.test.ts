import { describe, expect, test } from 'vitest'
import indexJson from '../../data/index.json'
import type { PokemonEntry } from '../../data/types'
import {
  DEFAULT_RECOMMEND_OPTIONS,
  filterPool,
  parseRecommendOptions,
  serializeRecommendOptions,
} from './recommendOptions'

const index = indexJson as PokemonEntry[]

describe('recommendation options', () => {
  test('defaults serialize to an empty query and parse back', () => {
    expect(serializeRecommendOptions(DEFAULT_RECOMMEND_OPTIONS).toString()).toBe('')
    expect(parseRecommendOptions(new URLSearchParams())).toEqual(DEFAULT_RECOMMEND_OPTIONS)
  })

  test('round trip', () => {
    const options = { maxGeneration: 4, includeLegendary: true, includeBattleOnly: true }
    const params = serializeRecommendOptions(options)
    expect(params.toString()).toBe('gen=4&legendary=include&battleOnly=include')
    expect(parseRecommendOptions(params)).toEqual(options)
  })

  test('invalid values are ignored', () => {
    expect(parseRecommendOptions(new URLSearchParams('gen=42&legendary=yes&battleOnly=1'))).toEqual(
      DEFAULT_RECOMMEND_OPTIONS,
    )
  })
})

describe('filterPool', () => {
  test('defaults drop legendary, mythical and battle-only entries', () => {
    const pool = filterPool(index, DEFAULT_RECOMMEND_OPTIONS)
    expect(pool.some((e) => e.isLegendary || e.isMythical || e.isBattleOnly)).toBe(false)
    expect(pool.some((e) => e.name === 'charizard')).toBe(true)
  })

  test('generation limit uses each entry’s own generation', () => {
    const pool = filterPool(index, { ...DEFAULT_RECOMMEND_OPTIONS, maxGeneration: 4 })
    expect(pool.every((e) => e.generation <= 4)).toBe(true)
    expect(pool.some((e) => e.name === 'vulpix-alola')).toBe(false)
  })

  test('includes legendaries and battle-only forms when asked', () => {
    const pool = filterPool(index, {
      maxGeneration: null,
      includeLegendary: true,
      includeBattleOnly: true,
    })
    expect(pool).toHaveLength(index.length)
  })
})
