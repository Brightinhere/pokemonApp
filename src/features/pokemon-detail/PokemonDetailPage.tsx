import { useParams } from 'react-router'
import { Placeholder } from '../../app/Placeholder'

export function PokemonDetailPage() {
  const { name } = useParams<'name'>()
  return (
    <Placeholder title="Pokémon detail">
      <p className="mt-2">
        Details for <strong>{name}</strong>.
      </p>
    </Placeholder>
  )
}
