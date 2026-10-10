import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../app/routes'
import { makeStore } from '../app/store'

/** Renders the full app (store + routes) at `path`, as a user opening that URL would see it. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <Provider store={makeStore()}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return { router }
}
