import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { usePokemonIndex } from './pokemonIndex'
import index from './index.json'

test('usePokemonIndex starts loading and resolves to every entry', async () => {
  const { result } = renderHook(() => usePokemonIndex())
  expect(['loading', 'ready']).toContain(result.current.status)
  await act(async () => {})
  await waitFor(() => expect(result.current.status).toBe('ready'))
  expect(result.current.entries).toHaveLength(index.length)
  expect(result.current.entries?.find((e) => e.name === 'vulpix-alola')?.types).toEqual(['ice'])
})

test('a failed load reports an error and can be retried', async () => {
  const { resetPokemonIndexForTests, retryPokemonIndex } = await import('./pokemonIndex')
  let attempts = 0
  resetPokemonIndexForTests(async () => {
    attempts++
    if (attempts === 1) throw new Error('offline')
    return index as never
  })
  const { result } = renderHook(() => usePokemonIndex())
  await waitFor(() => expect(result.current.status).toBe('error'))
  await act(() => retryPokemonIndex())
  expect(result.current.status).toBe('ready')
  expect(attempts).toBe(2)
  resetPokemonIndexForTests()
})
