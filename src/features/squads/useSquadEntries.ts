import { useMemo } from 'react'
import { usePokemonIndex } from '../../data/pokemonIndex'
import type { PokemonEntry } from '../../data/types'

/** Index lookups for squads: entry by id, and a species' default entry. Null until the index loads. */
export function useEntryLookup() {
  const index = usePokemonIndex()
  return useMemo(() => {
    if (index.status !== 'ready') return null
    const byId = new Map<number, PokemonEntry>()
    const speciesDefault = new Map<number, PokemonEntry>()
    for (const entry of index.entries) {
      byId.set(entry.id, entry)
      if (entry.isDefault) speciesDefault.set(entry.speciesId, entry)
    }
    return {
      byId,
      membersOf: (ids: readonly number[]) =>
        ids.map((id) => byId.get(id)).filter((entry): entry is PokemonEntry => entry !== undefined),
      speciesName: (speciesId: number) =>
        speciesDefault.get(speciesId)?.displayName ?? `#${speciesId}`,
    }
  }, [index])
}
