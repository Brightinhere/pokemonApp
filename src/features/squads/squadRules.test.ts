import { describe, expect, test } from 'vitest'
import indexJson from '../../data/index.json'
import type { PokemonEntry } from '../../data/types'
import { newSquadId, nextSquadName, normalizeName, warningsFor } from './squadRules'

const index = indexJson as PokemonEntry[]
const entry = (name: string) => index.find((e) => e.name === name)!
const speciesName = (id: number) =>
  index.find((e) => e.speciesId === id && e.isDefault)!.displayName

describe('nextSquadName', () => {
  test.each([
    [[], 'Squad 1'],
    [['Squad 1'], 'Squad 2'],
    [['Squad 1', 'Squad 3'], 'Squad 2'],
    [['Kanto run', 'squad 1'], 'Squad 1'],
  ])('%j -> %s', (names, expected) => {
    expect(nextSquadName(names)).toBe(expected)
  })
})

describe('normalizeName', () => {
  test('trims', () => expect(normalizeName('  Kanto run  ')).toBe('Kanto run'))
  test('rejects empty', () => expect(normalizeName('   ')).toBeNull())
  test('allows 40 and rejects 41 characters', () => {
    expect(normalizeName('x'.repeat(40))).toBe('x'.repeat(40))
    expect(normalizeName('x'.repeat(41))).toBeNull()
  })
})

describe('newSquadId', () => {
  test('is 10 url-safe characters and avoids taken ids', () => {
    const id = newSquadId()
    expect(id).toMatch(/^[A-Za-z0-9_-]{10}$/)
    const many = new Set(Array.from({ length: 500 }, () => newSquadId()))
    expect(many.size).toBe(500)
  })
})

describe('warningsFor', () => {
  test('no warnings for a normal squad', () => {
    expect(warningsFor([entry('charizard'), entry('gengar')], speciesName)).toEqual([])
  })

  test('same species twice (Charizard + Mega Charizard X)', () => {
    expect(warningsFor([entry('charizard'), entry('charizard-mega-x')], speciesName)).toEqual([
      { kind: 'duplicate-species', speciesName: 'Charizard' },
    ])
  })

  test('more than one Mega', () => {
    expect(warningsFor([entry('charizard-mega-x'), entry('gengar-mega')], speciesName)).toEqual([
      { kind: 'multiple-megas', count: 2 },
    ])
  })
})
