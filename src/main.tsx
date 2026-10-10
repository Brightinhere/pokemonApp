import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { routes } from './app/routes'
import { makeStore } from './app/store'
import { loadSquads, persistSquads } from './features/squads/storage'
import '@fontsource-variable/archivo/standard.css'
import './theme/index.css'

const store = makeStore({ squads: loadSquads() })
persistSquads(store)
const router = createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
