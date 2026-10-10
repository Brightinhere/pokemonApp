import type { RouteObject } from 'react-router'
import { PokedexPage } from '../features/pokedex/PokedexPage'
import { PokemonDetailPage } from '../features/pokemon-detail/PokemonDetailPage'
import { SquadListPage } from '../features/squads/SquadListPage'
import { SquadPage } from '../features/squads/SquadPage'
import { Layout } from './Layout'
import { NotFoundPage } from './NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <PokedexPage /> },
      { path: '/pokemon/:name', element: <PokemonDetailPage /> },
      { path: '/squads', element: <SquadListPage /> },
      { path: '/squads/:id', element: <SquadPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
