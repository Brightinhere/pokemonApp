import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { squadsSlice, type SquadsState } from '../features/squads/squadsSlice'
import { pokeApi } from '../services/pokeApi'

const rootReducer = combineSlices(pokeApi, squadsSlice)

export function makeStore(preloaded?: { squads?: SquadsState }) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloaded,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(pokeApi.middleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
