import { useEffect } from 'react'
import { useAppDispatch } from '../../app/hooks'
import { usePokemonIndex } from '../../data/pokemonIndex'
import { pruneMembers } from './squadsSlice'

/** Once the index has loaded, drop saved members that no longer exist in it. */
export function usePruneSquads() {
  const index = usePokemonIndex()
  const dispatch = useAppDispatch()
  const entries = index.status === 'ready' ? index.entries : null
  useEffect(() => {
    if (entries) dispatch(pruneMembers({ validIds: entries.map((entry) => entry.id) }))
  }, [entries, dispatch])
}
