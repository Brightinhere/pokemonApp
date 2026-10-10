import { useParams } from 'react-router'
import { Placeholder } from '../../app/Placeholder'

export function SquadPage() {
  const { id } = useParams<'id'>()
  return (
    <Placeholder title="Squad">
      <p className="mt-2">
        Squad <strong>{id}</strong>.
      </p>
    </Placeholder>
  )
}
