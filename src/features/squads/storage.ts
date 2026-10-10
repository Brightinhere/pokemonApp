import { MAX_MEMBERS } from './squadRules'
import { initialSquadsState, type Squad, type SquadsState } from './squadsSlice'

export const STORAGE_KEY = 'squad-lab:squads'
export const BACKUP_KEY = 'squad-lab:squads:backup'
export const STORAGE_VERSION = 1

interface StoredSquads extends SquadsState {
  version: typeof STORAGE_VERSION
}

/** localStorage can be missing or throw (private mode, blocked site data): never let that break the app. */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

const isSquad = (value: unknown): value is Squad => {
  const s = value as Squad
  return (
    typeof s === 'object' &&
    s !== null &&
    typeof s.id === 'string' &&
    s.id !== '' &&
    typeof s.name === 'string' &&
    Array.isArray(s.members) &&
    s.members.every((id) => Number.isInteger(id) && id > 0) &&
    typeof s.updatedAt === 'number'
  )
}

/** Validates stored data; returns null when it isn't a version-1 squads document. */
function parse(raw: string): SquadsState | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  const doc = data as StoredSquads
  if (
    typeof doc !== 'object' ||
    doc === null ||
    doc.version !== STORAGE_VERSION ||
    !Array.isArray(doc.squads)
  ) {
    return null
  }
  if (!doc.squads.every(isSquad)) return null

  const seen = new Set<string>()
  const squads = doc.squads
    .filter((squad) => !seen.has(squad.id) && seen.add(squad.id))
    .map((squad) => ({ ...squad, members: squad.members.slice(0, MAX_MEMBERS) }))
  const current = squads.find((s) => s.id === doc.currentId)
  const fallback = squads.reduce<Squad | null>(
    (best, s) => (!best || s.updatedAt > best.updatedAt ? s : best),
    null,
  )
  return { squads, currentId: (current ?? fallback)?.id ?? null }
}

/**
 * Reads saved squads. Unreadable or unknown-version data is kept aside under BACKUP_KEY and the
 * app starts empty; members missing from the index are pruned later, once the index has loaded.
 */
export function loadSquads(): SquadsState {
  const store = storage()
  if (!store) return initialSquadsState
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (raw === null) return initialSquadsState
    const state = parse(raw)
    if (state) return state
    store.setItem(BACKUP_KEY, raw)
    store.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked: work in memory for this visit.
  }
  return initialSquadsState
}

export function saveSquads(state: SquadsState): void {
  try {
    const doc: StoredSquads = {
      version: STORAGE_VERSION,
      squads: state.squads,
      currentId: state.currentId,
    }
    storage()?.setItem(STORAGE_KEY, JSON.stringify(doc))
  } catch {
    // Storage blocked or full: squads still work until the page is closed.
  }
}

/** Saves whenever the squads slice changes (not on unrelated store updates). */
export function persistSquads(store: {
  getState: () => { squads: SquadsState }
  subscribe: (l: () => void) => () => void
}) {
  let last = store.getState().squads
  return store.subscribe(() => {
    const next = store.getState().squads
    if (next !== last) {
      last = next
      saveSquads(next)
    }
  })
}
