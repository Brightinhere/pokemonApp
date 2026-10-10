import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { MAX_MEMBERS, newSquadId, nextSquadName, normalizeName } from './squadRules'

export interface Squad {
  id: string
  name: string
  /** Index entry ids, in squad order. */
  members: number[]
  /** Last change, in ms; orders the squad list. */
  updatedAt: number
}

export interface SquadsState {
  squads: Squad[]
  currentId: string | null
}

export const initialSquadsState: SquadsState = { squads: [], currentId: null }

const find = (state: SquadsState, id: string | null) =>
  state.squads.find((squad) => squad.id === id)

const mostRecent = (squads: readonly Squad[]) =>
  squads.reduce<Squad | null>(
    (best, squad) => (!best || squad.updatedAt > best.updatedAt ? squad : best),
    null,
  )

/** Ids and timestamps are made in `prepare`, so the reducers below stay pure and testable. */
const stamp = <P extends object>(payload: P) => ({ payload: { ...payload, at: Date.now() } })
const withNewId = <P extends object>(payload: P) => stamp({ ...payload, id: newSquadId() })

export const squadsSlice = createSlice({
  name: 'squads',
  initialState: initialSquadsState,
  reducers: {
    createSquad: {
      reducer(state, { payload }: PayloadAction<{ id: string; name?: string; at: number }>) {
        state.squads.push({
          id: payload.id,
          name:
            (payload.name && normalizeName(payload.name)) ||
            nextSquadName(state.squads.map((s) => s.name)),
          members: [],
          updatedAt: payload.at,
        })
        state.currentId = payload.id
      },
      prepare: (payload: { name?: string } = {}) => withNewId(payload),
    },

    renameSquad: {
      reducer(state, { payload }: PayloadAction<{ id: string; name: string; at: number }>) {
        const squad = find(state, payload.id)
        const name = normalizeName(payload.name)
        if (!squad || !name) return
        squad.name = name
        squad.updatedAt = payload.at
      },
      prepare: (payload: { id: string; name: string }) => stamp(payload),
    },

    deleteSquad(state, { payload }: PayloadAction<{ id: string }>) {
      state.squads = state.squads.filter((squad) => squad.id !== payload.id)
      if (state.currentId === payload.id) state.currentId = mostRecent(state.squads)?.id ?? null
    },

    setCurrentSquad(state, { payload }: PayloadAction<{ id: string }>) {
      if (find(state, payload.id)) state.currentId = payload.id
    },

    /** Adds to the current squad, creating "Squad N" first when there is none. Full squads are left as is. */
    addMember: {
      reducer(
        state,
        { payload }: PayloadAction<{ entryId: number; newSquadId: string; at: number }>,
      ) {
        let squad = find(state, state.currentId)
        if (!squad) {
          squad = {
            id: payload.newSquadId,
            name: nextSquadName(state.squads.map((s) => s.name)),
            members: [],
            updatedAt: payload.at,
          }
          state.squads.push(squad)
          state.currentId = squad.id
        }
        if (squad.members.length >= MAX_MEMBERS) return
        squad.members.push(payload.entryId)
        squad.updatedAt = payload.at
      },
      prepare: (payload: { entryId: number }) => stamp({ ...payload, newSquadId: newSquadId() }),
    },

    removeMember: {
      reducer(state, { payload }: PayloadAction<{ squadId: string; index: number; at: number }>) {
        const squad = find(state, payload.squadId)
        if (!squad || payload.index < 0 || payload.index >= squad.members.length) return
        squad.members.splice(payload.index, 1)
        squad.updatedAt = payload.at
      },
      prepare: (payload: { squadId: string; index: number }) => stamp(payload),
    },

    moveMember: {
      reducer(
        state,
        {
          payload,
        }: PayloadAction<{ squadId: string; index: number; direction: -1 | 1; at: number }>,
      ) {
        const squad = find(state, payload.squadId)
        const target = payload.index + payload.direction
        if (!squad || payload.index < 0 || target < 0 || target >= squad.members.length) return
        const [member] = squad.members.splice(payload.index, 1)
        squad.members.splice(target, 0, member!)
        squad.updatedAt = payload.at
      },
      prepare: (payload: { squadId: string; index: number; direction: -1 | 1 }) => stamp(payload),
    },

    /** Swaps a member for another entry, keeping its position. */
    replaceMember: {
      reducer(
        state,
        { payload }: PayloadAction<{ squadId: string; index: number; entryId: number; at: number }>,
      ) {
        const squad = find(state, payload.squadId)
        if (!squad || payload.index < 0 || payload.index >= squad.members.length) return
        squad.members[payload.index] = payload.entryId
        squad.updatedAt = payload.at
      },
      prepare: (payload: { squadId: string; index: number; entryId: number }) => stamp(payload),
    },

    /** "Save as my squad" from a share link. */
    saveSharedSquad: {
      reducer(
        state,
        { payload }: PayloadAction<{ id: string; name: string; members: number[]; at: number }>,
      ) {
        state.squads.push({
          id: payload.id,
          name: normalizeName(payload.name) ?? 'Shared squad',
          members: payload.members.slice(0, MAX_MEMBERS),
          updatedAt: payload.at,
        })
        state.currentId = payload.id
      },
      prepare: (payload: { name: string; members: number[] }) => withNewId(payload),
    },

    /** Drops members that are not in the index (e.g. after a data rebuild). */
    pruneMembers(state, { payload }: PayloadAction<{ validIds: readonly number[] }>) {
      const valid = new Set(payload.validIds)
      for (const squad of state.squads) {
        if (squad.members.some((id) => !valid.has(id)))
          squad.members = squad.members.filter((id) => valid.has(id))
      }
    },
  },
  selectors: {
    selectSquads: (state) => state.squads,
    selectCurrentSquad: (state) => find(state, state.currentId) ?? null,
  },
})

export const {
  createSquad,
  renameSquad,
  deleteSquad,
  setCurrentSquad,
  addMember,
  removeMember,
  moveMember,
  replaceMember,
  saveSharedSquad,
  pruneMembers,
} = squadsSlice.actions

export const { selectSquads, selectCurrentSquad } = squadsSlice.selectors
