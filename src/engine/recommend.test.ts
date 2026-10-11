import { describe, expect, test } from 'vitest'
import chartJson from '../data/typechart.json'
import type { PokemonEntry, PokemonType, TypeChart } from '../data/types'
import { SCORE_WEIGHTS, recommend, scoreParts, scoreSquad } from './recommend'
import { createTypeEngine } from './typeEffectiveness'

const engine = createTypeEngine(chartJson as TypeChart)

let nextId = 1
/** A hand-built entry: only types, species, id and stats matter to the recommender. */
const mon = (
  types: PokemonType[],
  { total = 300, speciesId = nextId, name = '' } = {},
): PokemonEntry => {
  const id = nextId++
  const each = Math.floor(total / 6)
  return {
    id,
    speciesId,
    name: name || `mon-${id}`,
    displayName: name || `Mon ${id}`,
    types: types as PokemonEntry['types'],
    stats: {
      hp: total - each * 5,
      attack: each,
      defense: each,
      specialAttack: each,
      specialDefense: each,
      speed: each,
    },
    generation: 1,
    formCategory: 'default',
    isDefault: true,
    isBattleOnly: false,
    isLegendary: false,
    isMythical: false,
    sprite: null,
  }
}

describe('scoreSquad', () => {
  test('a single Normal type: no coverage, Fighting weakness 2 over 0 resists costs 2', () => {
    expect(scoreSquad(engine, [['normal']])).toBe(-SCORE_WEIGHTS.weakExcess)
  })

  test('a problem type costs 6 on top of the weakness excess', () => {
    const threeFire = [['fire'], ['fire'], ['fire']] as PokemonType[][]
    const rows = engine.squadSummary(threeFire.map((types) => ({ types })))
    const excess = rows.reduce((sum, r) => sum + Math.max(0, r.weak - r.resist - r.immune), 0)
    const problems = rows.filter((r) => r.isProblem).length
    expect(problems).toBe(3) // water, ground, rock
    const covered = engine.squadCoverage(threeFire.map((types) => ({ types }))).covered.length
    expect(scoreSquad(engine, threeFire)).toBe(covered - excess * 2 - problems * 6)
  })

  test('a 4× weakness costs 1 more than a 2× one', () => {
    // Fire/Flying takes 4× from Rock: one quad weakness, costing 1 on top of the weakness excess.
    const quad = scoreSquad(engine, [['fire', 'flying']])
    const rows = engine.squadSummary([{ types: ['fire', 'flying'] }])
    const excess = rows.reduce((sum, r) => sum + Math.max(0, r.weak - r.resist - r.immune), 0)
    const covered = engine.squadCoverage([{ types: ['fire', 'flying'] }]).covered.length
    expect(quad).toBe(covered - excess * 2 - 1)
  })

  test('coverage adds 1 per covered defending type', () => {
    const covered = engine.squadCoverage([{ types: ['fighting'] }]).covered.length
    const rows = engine.squadSummary([{ types: ['fighting'] }])
    const excess = rows.reduce((sum, r) => sum + Math.max(0, r.weak - r.resist - r.immune), 0)
    expect(scoreSquad(engine, [['fighting']])).toBe(covered - excess * 2)
    expect(covered).toBe(5)
  })
})

describe('scoreParts', () => {
  test('the parts add up to scoreSquad, with coverage as attack', () => {
    const squad = [['fire', 'flying'], ['water'], ['grass', 'poison']] as PokemonType[][]
    const { defense, attack } = scoreParts(engine, squad)
    expect(defense + attack).toBe(scoreSquad(engine, squad))
    expect(attack).toBe(engine.squadCoverage(squad.map((types) => ({ types }))).covered.length)
    expect(defense).toBeLessThan(0)
  })
})

describe('recommend', () => {
  const fireTrio = [mon(['fire']), mon(['fire']), mon(['fire'])]

  test('groups the pool by type combination and orders entries by total, then dex number', () => {
    const weak = mon(['water', 'ground'], { total: 300, speciesId: 900 })
    const strong = mon(['ground', 'water'], { total: 535, speciesId: 901 })
    const tied = mon(['water', 'ground'], { total: 300, speciesId: 899 })
    const [first] = recommend(engine, { members: fireTrio, pool: [weak, strong, tied] })
    expect(first!.types).toEqual(['ground', 'water'])
    expect(first!.entries.map((e) => e.speciesId)).toEqual([901, 899, 900])
    expect(first!.bestTotal).toBe(535)
  })

  test('orders by gain, then best total, then type names; respects the limit', () => {
    const pool = [
      mon(['water'], { total: 400 }),
      mon(['water', 'ground'], { total: 300 }),
      mon(['rock'], { total: 500 }),
      mon(['dragon'], { total: 600 }),
    ]
    const all = recommend(engine, { members: fireTrio, pool, limit: 10 })
    for (let i = 1; i < all.length; i++) {
      const [a, b] = [all[i - 1]!, all[i]!]
      expect(a.gain > b.gain || (a.gain === b.gain && a.bestTotal >= b.bestTotal)).toBe(true)
    }
    expect(recommend(engine, { members: fireTrio, pool, limit: 1 })).toHaveLength(1)
  })

  test('additions only suggest combinations that raise the score', () => {
    const suggestions = recommend(engine, {
      members: fireTrio,
      pool: [mon(['fire']), mon(['water'])],
    })
    expect(suggestions.every((s) => s.gain > 0)).toBe(true)
    expect(suggestions.map((s) => s.types)).not.toContainEqual(['fire'])
  })

  test('never suggests a species already in the squad, including the one being replaced', () => {
    const squad = [mon(['fire'], { speciesId: 4 }), mon(['water'], { speciesId: 7 })]
    const pool = [
      mon(['fire', 'flying'], { speciesId: 4 }),
      mon(['grass'], { speciesId: 7 }),
      mon(['grass'], { speciesId: 1 }),
    ]
    const ids = (s: ReturnType<typeof recommend>) =>
      s.flatMap((g) => g.entries.map((e) => e.speciesId))
    expect(ids(recommend(engine, { members: squad, pool, limit: 10 }))).not.toContain(4)
    expect(ids(recommend(engine, { members: squad, pool, replaceIndex: 0, limit: 10 }))).toEqual([
      1,
    ])
  })

  test('replacements are returned even when they make the squad weaker', () => {
    const squad = [mon(['water', 'ground']), mon(['steel'])]
    const suggestions = recommend(engine, {
      members: squad,
      pool: [mon(['normal'])],
      replaceIndex: 1,
    })
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]!.gain).toBeLessThan(0)
  })

  test('reasons: fixes, resists and covers for an addition', () => {
    const [water] = recommend(engine, { members: fireTrio, pool: [mon(['water'])] })
    expect(water!.reasons.fixes).toEqual(['water'])
    expect(water!.reasons.resists).toEqual(expect.arrayContaining(['water']))
    expect(water!.reasons.covers).toEqual(expect.arrayContaining(['fire', 'ground', 'rock']))
    expect(water!.reasons.newProblems).toEqual([])
    expect(water!.reasons.losesCoverage).toEqual([])
  })

  test('reasons: a replacement reports lost coverage and new problems', () => {
    const squad = [mon(['fire']), mon(['fire']), mon(['water'])]
    const [swap] = recommend(engine, {
      members: squad,
      pool: [mon(['fire'], { speciesId: 999 })],
      replaceIndex: 2,
    })
    expect(swap!.reasons.losesCoverage).toEqual(expect.arrayContaining(['fire', 'ground', 'rock']))
    expect(swap!.reasons.newProblems).toEqual(expect.arrayContaining(['water']))
  })

  test('breakdown parts add up to the gain for additions and replacements', () => {
    const pool = [mon(['water']), mon(['steel', 'dark']), mon(['normal']), mon(['ground'])]
    const squad = [...fireTrio, mon(['grass'])]
    const all = [
      ...recommend(engine, { members: fireTrio, pool, limit: 10 }),
      ...recommend(engine, { members: squad, pool, replaceIndex: 3, limit: 10 }),
    ]
    expect(all.length).toBeGreaterThan(3)
    for (const s of all) expect(s.breakdown.defense + s.breakdown.attack).toBe(s.gain)
  })

  test('an addition that only adds coverage has a defense part of 0', () => {
    // Fairy's extra Steel weakness costs 2, and resisting Fighting (both members weak) wins 2 back.
    const [fairy] = recommend(engine, {
      members: [mon(['normal']), mon(['rock'])],
      pool: [mon(['fairy'])],
    })
    expect(fairy!.breakdown).toEqual({ defense: 0, attack: 3 })
  })

  test('is pure: inputs are untouched and results repeat', () => {
    const pool = Object.freeze([mon(['water'], { total: 300 }), mon(['water'], { total: 500 })])
    const members = Object.freeze([...fireTrio])
    const first = recommend(engine, { members, pool })
    expect(recommend(engine, { members, pool })).toEqual(first)
    expect(pool[0]!.stats.hp).toBeDefined()
  })
})
