import { useSyncExternalStore } from 'react'
import type { PokemonEntry } from './types'

export type IndexState =
  | { status: 'loading'; entries: null }
  | { status: 'ready'; entries: PokemonEntry[] }
  | { status: 'error'; entries: null }

let state: IndexState = { status: 'loading', entries: null }
let started = false
const listeners = new Set<() => void>()

function setState(next: IndexState) {
  state = next
  listeners.forEach((listener) => listener())
}

/**
 * Loads index.json once. The dynamic import makes Vite emit it as its own chunk, so it is
 * cached separately from app code and does not block the first paint of the shell.
 */
export function loadPokemonIndex(): Promise<void> {
  if (started) return Promise.resolve()
  started = true
  return import('./index.json').then(
    (module) => setState({ status: 'ready', entries: module.default as PokemonEntry[] }),
    () => setState({ status: 'error', entries: null }),
  )
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  void loadPokemonIndex()
  return () => listeners.delete(listener)
}

/** The static Pokémon index: `{ status, entries }`, loading on first use. */
export function usePokemonIndex(): IndexState {
  return useSyncExternalStore(subscribe, () => state)
}
