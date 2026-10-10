import { expect, test } from 'vitest'
import index from './index.json'
import type { PokemonEntry } from './types'
import { typeEngine } from './typeEngine'

const entry = (name: string) => (index as PokemonEntry[]).find((e) => e.name === name)!

test('index entries can be passed to the engine as-is', () => {
  expect(typeEngine.multiplier('rock', entry('charizard'))).toBe(4)
  expect(typeEngine.multiplier('fire', entry('vulpix-alola'))).toBe(2)
  expect(typeEngine.squadSummary([entry('charizard'), entry('vulpix-alola')])[0]).toMatchObject({
    attackingType: 'normal',
    neutral: 2,
  })
})
