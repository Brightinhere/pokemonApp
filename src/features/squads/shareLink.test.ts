import { describe, expect, test } from 'vitest'
import indexJson from '../../data/index.json'
import type { PokemonEntry } from '../../data/types'
import { buildSharePath, buildShareQuery, parseShareQuery } from './shareLink'

const byId = new Map((indexJson as PokemonEntry[]).map((e) => [e.id, e]))
const parse = (query: string) => parseShareQuery(new URLSearchParams(query), byId)
const names = (query: string) => parse(query).members.map((m) => m.displayName)

describe('share links', () => {
  test('exact format', () => {
    expect(buildShareQuery('Kanto run', [6, 10034, 94])).toBe('m=6,10034,94&n=Kanto+run')
    expect(buildSharePath('Kanto run', [6, 10034, 94])).toBe('/squad?m=6,10034,94&n=Kanto+run')
  })

  test('round trip, including awkward names', () => {
    const name = 'Mr. Mime & co #1 ?'
    const parsed = parse(buildShareQuery(name, [6, 10034, 94]))
    expect(parsed).toMatchObject({ name, dropped: false })
    expect(parsed.members.map((m) => m.id)).toEqual([6, 10034, 94])
  })

  test('invalid and unknown ids are dropped and reported', () => {
    expect(names('m=6,abc,99999,94')).toEqual(['Charizard', 'Gengar'])
    expect(parse('m=6,abc,99999,94').dropped).toBe(true)
    expect(parse('m=6,-3,1.5').dropped).toBe(true)
  })

  test('only the first 6 are kept', () => {
    const parsed = parse('m=1,2,3,4,5,6,7,8')
    expect(parsed.members.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6])
    expect(parsed.dropped).toBe(true)
  })

  test('no name, no members', () => {
    expect(parse('m=6')).toMatchObject({ name: null, dropped: false })
    expect(parse('m=6&n=%20%20').name).toBeNull()
    expect(parse('')).toEqual({ name: null, members: [], dropped: false })
    expect(parse('m=abc')).toMatchObject({ members: [], dropped: true })
  })
})
