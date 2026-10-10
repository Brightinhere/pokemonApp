import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { makeStore } from '../../app/store'
import { addMember, createSquad, type SquadsState } from './squadsSlice'
import { BACKUP_KEY, STORAGE_KEY, loadSquads, persistSquads, saveSquads } from './storage'

const state: SquadsState = {
  squads: [
    { id: 'a', name: 'Kanto run', members: [6, 130, 94], updatedAt: 2 },
    { id: 'b', name: 'Squad 2', members: [], updatedAt: 5 },
  ],
  currentId: 'a',
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('squad storage', () => {
  test('round trip keeps squads, member order and the current squad', () => {
    saveSquads(state)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1)
    expect(loadSquads()).toEqual(state)
  })

  test('nothing saved means no squads', () => {
    expect(loadSquads()).toEqual({ squads: [], currentId: null })
  })

  test.each([
    ['invalid JSON', '{nope'],
    ['an unknown version', JSON.stringify({ version: 2, squads: [], currentId: null })],
    ['a bad squad', JSON.stringify({ version: 1, squads: [{ id: 'a', name: 7 }], currentId: 'a' })],
  ])('%s is kept aside under the backup key and the app starts empty', (_, raw) => {
    localStorage.setItem(STORAGE_KEY, raw)
    expect(loadSquads()).toEqual({ squads: [], currentId: null })
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  test('a missing current squad falls back to the most recently changed one', () => {
    saveSquads({ ...state, currentId: 'gone' })
    expect(loadSquads().currentId).toBe('b')
  })

  test('duplicate squad ids keep the first; members are capped at 6', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        currentId: 'a',
        squads: [
          { id: 'a', name: 'A', members: [1, 2, 3, 4, 5, 6, 7], updatedAt: 1 },
          { id: 'a', name: 'Copy', members: [], updatedAt: 2 },
        ],
      }),
    )
    expect(loadSquads().squads).toEqual([
      { id: 'a', name: 'A', members: [1, 2, 3, 4, 5, 6], updatedAt: 1 },
    ])
  })

  test('storage that throws: loading and saving keep working in memory', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadSquads()).toEqual({ squads: [], currentId: null })
    const store = makeStore({ squads: loadSquads() })
    persistSquads(store)
    expect(() => store.dispatch(addMember({ entryId: 6 }))).not.toThrow()
    expect(store.getState().squads.squads[0]!.members).toEqual([6])
  })

  test('the store saves only when squads change', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const store = makeStore({ squads: loadSquads() })
    persistSquads(store)
    store.dispatch({ type: 'unrelated/action' })
    expect(setItem).not.toHaveBeenCalled()
    store.dispatch(createSquad({ name: 'Kanto run' }))
    expect(setItem).toHaveBeenCalledTimes(1)
    expect(loadSquads().squads[0]!.name).toBe('Kanto run')
  })
})

describe('pruning once the index loads', () => {
  test('members missing from the index are dropped', async () => {
    const { renderApp } = await import('../../test/renderApp')
    const { waitFor } = await import('@testing-library/react')
    const { store } = renderApp('/squads', {
      squads: {
        squads: [{ id: 'a', name: 'A', members: [6, 99999, 94], updatedAt: 1 }],
        currentId: 'a',
      },
    })
    await waitFor(() => expect(store.getState().squads.squads[0]!.members).toEqual([6, 94]))
  })
})
