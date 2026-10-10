import { describe, expect, test } from 'vitest'
import chartJson from '../data/typechart.json'
import { POKEMON_TYPES, type PokemonType, type TypeChart } from '../data/types'
import { classify, createTypeEngine, type Defender } from './typeEffectiveness'

const chart = chartJson as TypeChart
const engine = createTypeEngine(chart)
const pokemon = (...types: PokemonType[]): Defender => ({ types })

const dualCombinations = POKEMON_TYPES.flatMap((first, i) =>
  POKEMON_TYPES.slice(i + 1).map((second) => [first, second] as const),
)

describe('classify', () => {
  test.each([
    [0, 'immune'],
    [0.25, 'resist'],
    [0.5, 'resist'],
    [1, 'neutral'],
    [2, 'weak'],
    [4, 'weak'],
  ] as const)('%d is %s', (multiplier, expected) => {
    expect(classify(multiplier)).toBe(expected)
  })
})

describe('multiplier: single type', () => {
  test('all 324 attacking/defending pairs equal the chart', () => {
    let checked = 0
    for (const attacker of POKEMON_TYPES) {
      for (const defender of POKEMON_TYPES) {
        expect(engine.multiplier(attacker, pokemon(defender)), `${attacker}->${defender}`).toBe(
          chart[attacker][defender],
        )
        checked++
      }
    }
    expect(checked).toBe(324)
  })

  // Written out by hand rather than read from the chart, so a transposed attacker/defender
  // anywhere in the engine fails here even if the exhaustive checks agree with themselves.
  test.each([
    ['fire', 'grass', 2],
    ['grass', 'fire', 0.5],
    ['water', 'fire', 2],
    ['fire', 'water', 0.5],
    ['electric', 'water', 2],
    ['electric', 'ground', 0],
    ['ground', 'electric', 2],
    ['ground', 'flying', 0],
    ['flying', 'ground', 1],
    ['normal', 'ghost', 0],
    ['ghost', 'normal', 0],
    ['fighting', 'ghost', 0],
    ['psychic', 'dark', 0],
    ['dark', 'psychic', 2],
    ['dragon', 'fairy', 0],
    ['fairy', 'dragon', 2],
    ['poison', 'steel', 0],
    ['steel', 'fairy', 2],
    ['fairy', 'steel', 0.5],
    ['ice', 'dragon', 2],
    ['bug', 'psychic', 2],
    ['rock', 'flying', 2],
  ] as const)('%s -> %s is %d', (attacker, defender, expected) => {
    expect(engine.multiplier(attacker, pokemon(defender))).toBe(expected)
  })
})

describe('multiplier: dual type', () => {
  test('all 153 combinations x 18 attackers are the product of both chart values', () => {
    expect(dualCombinations).toHaveLength(153)
    for (const [first, second] of dualCombinations) {
      for (const attacker of POKEMON_TYPES) {
        const result = engine.multiplier(attacker, pokemon(first, second))
        expect(result, `${attacker}->${first}/${second}`).toBe(
          chart[attacker][first] * chart[attacker][second],
        )
        expect([0, 0.25, 0.5, 1, 2, 4]).toContain(result)
        expect(engine.multiplier(attacker, pokemon(second, first))).toBe(result)
      }
    }
  })

  test('Fire/Flying', () => {
    const charizard = pokemon('fire', 'flying')
    expect(engine.multiplier('rock', charizard)).toBe(4)
    expect(engine.multiplier('water', charizard)).toBe(2)
    expect(engine.multiplier('electric', charizard)).toBe(2)
    expect(engine.multiplier('grass', charizard)).toBe(0.25)
    expect(engine.multiplier('bug', charizard)).toBe(0.25)
    expect(engine.multiplier('ground', charizard)).toBe(0)
  })

  test('immunity wins over weakness (electric vs Water/Ground)', () => {
    expect(engine.multiplier('electric', pokemon('water'))).toBe(2)
    expect(engine.multiplier('electric', pokemon('water', 'ground'))).toBe(0)
  })

  test('type order does not matter (Water/Ground vs Ground/Water)', () => {
    for (const attacker of POKEMON_TYPES) {
      expect(engine.multiplier(attacker, pokemon('water', 'ground'))).toBe(
        engine.multiplier(attacker, pokemon('ground', 'water')),
      )
    }
  })
})

describe('chart-driven', () => {
  test('a custom chart changes results', () => {
    const custom = JSON.parse(JSON.stringify(chart)) as TypeChart
    custom.fire.grass = 1
    expect(createTypeEngine(custom).multiplier('fire', pokemon('grass'))).toBe(1)
    expect(engine.multiplier('fire', pokemon('grass'))).toBe(2)
  })

  test('modern chart: dragon and steel against Fairy', () => {
    expect(engine.multiplier('dragon', pokemon('fairy'))).toBe(0)
    expect(engine.multiplier('steel', pokemon('fairy'))).toBe(2)
  })
})

describe('defensive modifiers', () => {
  test('immune sets one attacking type to 0 and leaves the rest unchanged', () => {
    const levitating: Defender = {
      types: ['electric'],
      modifiers: [{ attackingType: 'ground', effect: 'immune' }],
    }
    expect(engine.multiplier('ground', levitating)).toBe(0)
    for (const attacker of POKEMON_TYPES.filter((t) => t !== 'ground')) {
      expect(engine.multiplier(attacker, levitating)).toBe(
        engine.multiplier(attacker, pokemon('electric')),
      )
    }
  })

  test('scale multiplies the type result', () => {
    const thickFat: Defender = {
      types: ['ice'],
      modifiers: [
        { attackingType: 'fire', effect: 'scale', factor: 0.5 },
        { attackingType: 'ice', effect: 'scale', factor: 0.5 },
      ],
    }
    expect(engine.multiplier('fire', thickFat)).toBe(1)
    expect(engine.multiplier('ice', thickFat)).toBe(0.25)
  })

  test('modifiers apply in order and immune overrides any scale', () => {
    const stacked: Defender = {
      types: ['grass'],
      modifiers: [
        { attackingType: 'fire', effect: 'scale', factor: 0.5 },
        { attackingType: 'fire', effect: 'scale', factor: 0.5 },
        { attackingType: 'water', effect: 'scale', factor: 4 },
        { attackingType: 'water', effect: 'immune' },
      ],
    }
    expect(engine.multiplier('fire', stacked)).toBe(0.5)
    expect(engine.multiplier('water', stacked)).toBe(0)
  })

  test('no modifiers (missing or empty) gives the plain type result', () => {
    for (const attacker of POKEMON_TYPES) {
      const plain = chart[attacker].water * chart[attacker].ground
      expect(engine.multiplier(attacker, { types: ['water', 'ground'] })).toBe(plain)
      expect(engine.multiplier(attacker, { types: ['water', 'ground'], modifiers: [] })).toBe(plain)
    }
  })
})

describe('defensiveProfile', () => {
  test('has 18 entries in canonical order matching multiplier()', () => {
    const defender: Defender = {
      types: ['fire', 'flying'],
      modifiers: [{ attackingType: 'rock', effect: 'scale', factor: 0.5 }],
    }
    const profile = engine.defensiveProfile(defender)
    expect(profile.map((row) => row.type)).toEqual([...POKEMON_TYPES])
    for (const row of profile) expect(row.multiplier).toBe(engine.multiplier(row.type, defender))
  })

  test('Normal/Ghost', () => {
    const profile = Object.fromEntries(
      engine.defensiveProfile(pokemon('normal', 'ghost')).map((row) => [row.type, row.multiplier]),
    )
    expect([profile.normal, profile.fighting, profile.ghost]).toEqual([0, 0, 0])
    expect(profile.dark).toBe(2)
    expect([profile.poison, profile.bug]).toEqual([0.5, 0.5])
  })
})

describe('coverage', () => {
  test('fire and water', () => {
    const { covered, uncovered } = engine.coverage(['fire', 'water'])
    expect(covered).toEqual(['ground', 'rock', 'bug', 'steel', 'fire', 'grass', 'ice'])
    expect(uncovered).toHaveLength(11)
    expect([...covered, ...uncovered].sort()).toEqual([...POKEMON_TYPES].sort())
  })

  test('normal alone covers nothing', () => {
    expect(engine.coverage(['normal']).covered).toEqual([])
  })

  test('an empty set leaves all 18 uncovered', () => {
    expect(engine.coverage([])).toEqual({ covered: [], uncovered: [...POKEMON_TYPES] })
  })

  test('order and duplicates do not change the result', () => {
    expect(engine.coverage(['water', 'fire', 'water'])).toEqual(engine.coverage(['fire', 'water']))
  })
})

describe('bestAttack', () => {
  test('picks the strongest attacking type (fire, water vs Rock/Ground)', () => {
    expect(engine.bestAttack(['fire', 'water'], pokemon('rock', 'ground'))).toEqual({
      multiplier: 4,
      types: ['water'],
    })
  })

  test('reports every tied type in canonical order (water, grass vs Ground)', () => {
    expect(engine.bestAttack(['grass', 'water'], pokemon('ground'))).toEqual({
      multiplier: 2,
      types: ['water', 'grass'],
    })
  })

  test('respects defender modifiers', () => {
    const levitating: Defender = {
      types: ['electric'],
      modifiers: [{ attackingType: 'ground', effect: 'immune' }],
    }
    expect(engine.bestAttack(['ground', 'normal'], levitating)).toEqual({
      multiplier: 1,
      types: ['normal'],
    })
  })

  test('returns null without attacking types', () => {
    expect(engine.bestAttack([], pokemon('fire'))).toBeNull()
  })

  test('duplicates do not change the result', () => {
    expect(engine.bestAttack(['water', 'water', 'grass'], pokemon('ground'))).toEqual({
      multiplier: 2,
      types: ['water', 'grass'],
    })
  })
})

describe('squadSummary', () => {
  const row = (defenders: Defender[], type: PokemonType) =>
    engine.squadSummary(defenders).find((r) => r.attackingType === type)!

  test('has one row per attacking type in canonical order', () => {
    expect(engine.squadSummary([pokemon('fire')]).map((r) => r.attackingType)).toEqual([
      ...POKEMON_TYPES,
    ])
  })

  test('counts weak, neutral, resist and immune members', () => {
    const squad = [pokemon('fire', 'flying'), pokemon('water', 'ground'), pokemon('grass')]
    expect(row(squad, 'electric')).toMatchObject({
      weak: 1,
      neutral: 0,
      resist: 1,
      immune: 1,
      quadWeak: 0,
    })
    for (const r of engine.squadSummary(squad)) {
      expect(r.weak + r.neutral + r.resist + r.immune).toBe(squad.length)
    }
  })

  test('counts 4x weaknesses', () => {
    const squad = [pokemon('fire', 'flying'), pokemon('water', 'ground')]
    expect(row(squad, 'rock')).toMatchObject({ weak: 1, quadWeak: 1 })
    expect(row(squad, 'grass')).toMatchObject({ weak: 1, quadWeak: 1 })
  })

  test('an empty squad has all counts at 0 and no problems', () => {
    for (const r of engine.squadSummary([])) {
      expect(r).toMatchObject({
        weak: 0,
        neutral: 0,
        resist: 0,
        immune: 0,
        quadWeak: 0,
        isProblem: false,
      })
    }
  })

  test('3 weak members and no resist is a problem; one resist clears it', () => {
    const fireTrio = [pokemon('fire'), pokemon('fire'), pokemon('fire')]
    expect(row(fireTrio, 'water').isProblem).toBe(true)
    expect(row([...fireTrio, pokemon('water')], 'water').isProblem).toBe(false)
  })

  test('an immunity also clears a problem, and 2 weak members are not a problem', () => {
    const electricWeak = [pokemon('water'), pokemon('water'), pokemon('flying')]
    expect(row(electricWeak, 'electric').isProblem).toBe(true)
    expect(row([...electricWeak, pokemon('ground')], 'electric').isProblem).toBe(false)
    expect(row(electricWeak.slice(0, 2), 'electric').isProblem).toBe(false)
  })
})

describe('squadCoverage', () => {
  test('equals coverage of the union of member types', () => {
    expect(engine.squadCoverage([pokemon('fire'), pokemon('water')])).toEqual(
      engine.coverage(['fire', 'water']),
    )
    expect(engine.squadCoverage([pokemon('fire', 'flying'), pokemon('water', 'ground')])).toEqual(
      engine.coverage(['fire', 'flying', 'water', 'ground']),
    )
  })

  test('an empty squad covers nothing', () => {
    expect(engine.squadCoverage([])).toEqual({ covered: [], uncovered: [...POKEMON_TYPES] })
  })
})

describe('purity', () => {
  const deepFreeze = <T>(value: T): T => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(deepFreeze)
      Object.freeze(value)
    }
    return value
  }

  test('frozen inputs are accepted, left unchanged, and give equal results', () => {
    const frozenChart = deepFreeze(JSON.parse(JSON.stringify(chart)) as TypeChart)
    const squad = deepFreeze<Defender[]>([
      { types: ['fire', 'flying'] },
      { types: ['electric'], modifiers: [{ attackingType: 'ground', effect: 'immune' }] },
      { types: ['ice'], modifiers: [{ attackingType: 'fire', effect: 'scale', factor: 0.5 }] },
    ])
    const attackers = deepFreeze<PokemonType[]>(['water', 'fire'])
    const snapshot = JSON.stringify({ frozenChart, squad, attackers })

    const callAll = () => {
      const frozenEngine = createTypeEngine(frozenChart)
      return {
        multiplier: frozenEngine.multiplier('rock', squad[0]!),
        profile: frozenEngine.defensiveProfile(squad[1]!),
        coverage: frozenEngine.coverage(attackers),
        best: frozenEngine.bestAttack(attackers, squad[2]!),
        summary: frozenEngine.squadSummary(squad),
        squadCoverage: frozenEngine.squadCoverage(squad),
      }
    }

    const first = callAll()
    expect(callAll()).toEqual(first)
    expect(JSON.stringify({ frozenChart, squad, attackers })).toBe(snapshot)
  })

  test('results are fresh objects the caller may change without affecting later calls', () => {
    const first = engine.coverage(['fire'])
    first.covered.push('dragon')
    expect(engine.coverage(['fire']).covered).not.toContain('dragon')
  })
})
