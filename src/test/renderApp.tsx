import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../app/routes'
import { makeStore } from '../app/store'
import type { SquadsState } from '../features/squads/squadsSlice'

/** Renders the full app (store + routes) at `path`, as a user opening that URL would see it. */
export function renderApp(path: string, { squads }: { squads?: SquadsState } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const store = makeStore(squads ? { squads } : undefined)
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return { router, store }
}
