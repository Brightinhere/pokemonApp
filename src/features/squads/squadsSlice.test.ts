import { describe, expect, test } from 'vitest'
import { makeStore } from '../../app/store'
import {
  addMember,
  createSquad,
  deleteSquad,
  initialSquadsState,
  moveMember,
  pruneMembers,
  removeMember,
  renameSquad,
  saveSharedSquad,
  selectCurrentSquad,
  setCurrentSquad,
  squadsSlice,
  type SquadsState,
} from './squadsSlice'

const reduce = squadsSlice.reducer
/** Builds actions with fixed ids and times so results are exact. */
const create = (id: string, at: number, name?: string) => ({
  type: createSquad.type,
  payload: { id, at, ...(name ? { name } : {}) },
})
const add = (entryId: number, at = 10, newSquadId = 'auto') => ({
  type: addMember.type,
  payload: { entryId, at, newSquadId },
})
const run = (...actions: { type: string; payload?: unknown }[]) =>
  actions.reduce<SquadsState>((state, action) => reduce(state, action), initialSquadsState)

describe('squads slice', () => {
  test('createSquad makes an empty, current "Squad N"', () => {
    const state = run(create('a', 1), create('b', 2, 'Squad 3'), create('c', 3))
    expect(state.squads.map((s) => s.name)).toEqual(['Squad 1', 'Squad 3', 'Squad 2'])
    expect(state.squads[0]!.members).toEqual([])
    expect(state.currentId).toBe('c')
  })

  test('the action creator generates an id and a time', () => {
    const action = createSquad()
    expect(action.payload.id).toMatch(/^[A-Za-z0-9_-]{10}$/)
    expect(typeof action.payload.at).toBe('number')
  })

  test('renameSquad trims, and ignores empty names', () => {
    let state = run(create('a', 1))
    state = reduce(state, {
      type: renameSquad.type,
      payload: { id: 'a', name: '  Kanto run ', at: 5 },
    })
    expect(state.squads[0]).toMatchObject({ name: 'Kanto run', updatedAt: 5 })
    state = reduce(state, { type: renameSquad.type, payload: { id: 'a', name: '   ', at: 6 } })
    expect(state.squads[0]).toMatchObject({ name: 'Kanto run', updatedAt: 5 })
  })

  test('deleting the current squad makes the most recently changed one current', () => {
    const state = run(create('a', 1), create('b', 5), create('c', 3), deleteSquad({ id: 'c' }))
    expect(state.squads.map((s) => s.id)).toEqual(['a', 'b'])
    expect(state.currentId).toBe('b')
    expect(reduce(state, deleteSquad({ id: 'a' })).currentId).toBe('b')
    expect(run(create('a', 1), deleteSquad({ id: 'a' })).currentId).toBeNull()
  })

  test('setCurrentSquad ignores unknown ids', () => {
    const state = run(create('a', 1), create('b', 2), setCurrentSquad({ id: 'a' }))
    expect(state.currentId).toBe('a')
    expect(reduce(state, setCurrentSquad({ id: 'zzz' })).currentId).toBe('a')
  })

  test('addMember adds to the current squad and updates its time', () => {
    const state = run(
      create('a', 1),
      create('b', 2),
      setCurrentSquad({ id: 'a' }),
      add(6, 7),
      add(94, 8),
    )
    expect(state.squads[0]).toMatchObject({ members: [6, 94], updatedAt: 8 })
    expect(state.squads[1]!.members).toEqual([])
  })

  test('addMember with no squads creates "Squad 1" and makes it current', () => {
    const state = run(add(6, 1, 'new-id'))
    expect(state.squads).toEqual([{ id: 'new-id', name: 'Squad 1', members: [6], updatedAt: 1 }])
    expect(state.currentId).toBe('new-id')
  })

  test('a full squad refuses a seventh member', () => {
    const state = run(create('a', 1), ...[1, 2, 3, 4, 5, 6, 7].map((id) => add(id)))
    expect(state.squads[0]!.members).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('removeMember', () => {
    const state = run(create('a', 1), add(6), add(130), add(94), {
      type: removeMember.type,
      payload: { squadId: 'a', index: 1, at: 20 },
    })
    expect(state.squads[0]).toMatchObject({ members: [6, 94], updatedAt: 20 })
  })

  test('moveMember earlier and later, with no-ops at the ends', () => {
    const move = (index: number, direction: -1 | 1) => ({
      type: moveMember.type,
      payload: { squadId: 'a', index, direction, at: 30 },
    })
    const base = run(create('a', 1), add(6), add(130), add(94))
    expect(reduce(base, move(2, -1)).squads[0]!.members).toEqual([6, 94, 130])
    expect(reduce(base, move(0, 1)).squads[0]!.members).toEqual([130, 6, 94])
    expect(reduce(base, move(0, -1)).squads[0]!.members).toEqual([6, 130, 94])
    expect(reduce(base, move(2, 1)).squads[0]!.members).toEqual([6, 130, 94])
  })

  test('saveSharedSquad creates a current squad, capped at 6, with a fallback name', () => {
    const state = run(create('a', 1), {
      type: saveSharedSquad.type,
      payload: { id: 's', name: '', members: [1, 2, 3, 4, 5, 6, 7], at: 9 },
    })
    expect(state.squads[1]).toEqual({
      id: 's',
      name: 'Shared squad',
      members: [1, 2, 3, 4, 5, 6],
      updatedAt: 9,
    })
    expect(state.currentId).toBe('s')
  })

  test('pruneMembers drops ids that are not in the index', () => {
    const state = run(
      create('a', 1),
      add(6),
      add(99999),
      add(94),
      pruneMembers({ validIds: [6, 94] }),
    )
    expect(state.squads[0]!.members).toEqual([6, 94])
  })

  test('works inside the app store, with preloaded state', () => {
    const store = makeStore({ squads: run(create('a', 1), add(6)) })
    expect(selectCurrentSquad(store.getState())?.members).toEqual([6])
    store.dispatch(addMember({ entryId: 94 }))
    expect(selectCurrentSquad(store.getState())?.members).toEqual([6, 94])
  })
})
