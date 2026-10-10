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

type IndexLoader = () => Promise<PokemonEntry[]>

const importIndex: IndexLoader = () =>
  import('./index.json').then((module) => module.default as PokemonEntry[])
let loader = importIndex

/**
 * Loads index.json once. The dynamic import makes Vite emit it as its own chunk, so it is
 * cached separately from app code and does not block the first paint of the shell.
 */
export function loadPokemonIndex(): Promise<void> {
  if (started) return Promise.resolve()
  started = true
  return loader().then(
    (entries) => setState({ status: 'ready', entries }),
    () => {
      started = false // allow retryPokemonIndex() to try again
      setState({ status: 'error', entries: null })
    },
  )
}

/** Tries again after a failed load (the "Try again" action). */
export function retryPokemonIndex(): Promise<void> {
  if (state.status !== 'error') return Promise.resolve()
  setState({ status: 'loading', entries: null })
  return loadPokemonIndex()
}

/** Test hook: start over with a different loader (e.g. one that fails). */
export function resetPokemonIndexForTests(nextLoader: IndexLoader = importIndex) {
  loader = nextLoader
  started = false
  state = { status: 'loading', entries: null }
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
