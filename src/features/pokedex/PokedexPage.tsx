import { Placeholder } from '../../app/Placeholder'
import { usePokemonIndex } from '../../data/pokemonIndex'

export function PokedexPage() {
  const index = usePokemonIndex()
  return (
    <Placeholder title="Pokédex">
      <p className="mt-2" role="status">
        {index.status === 'loading' && 'Loading Pokémon…'}
        {index.status === 'error' && 'Could not load the Pokémon index.'}
        {index.status === 'ready' && `${index.entries.length} Pokémon in the index.`}
      </p>
    </Placeholder>
  )
}
