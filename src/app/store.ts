import { configureStore } from '@reduxjs/toolkit'
import { pokeApi } from '../services/pokeApi'

export function makeStore() {
  return configureStore({
    reducer: {
      [pokeApi.reducerPath]: pokeApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(pokeApi.middleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
