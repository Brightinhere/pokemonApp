import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/'

/** Keep unused results for 24h, which in practice means "for the whole session". */
const SESSION_CACHE_SECONDS = 24 * 60 * 60

interface NamedResource {
  name: string
  url: string
}

/** The subset of `/pokemon-species/{name}` the app reads. Extended by feature changes. */
export interface PokemonSpecies {
  id: number
  name: string
  names: { name: string; language: NamedResource }[]
  flavor_text_entries: { flavor_text: string; language: NamedResource; version: NamedResource }[]
  evolution_chain: { url: string } | null
  varieties: { is_default: boolean; pokemon: NamedResource }[]
}

/** Live PokeAPI data. Static data (list, types, stats) comes from src/data instead. */
export const pokeApi = createApi({
  reducerPath: 'pokeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: POKEAPI_BASE_URL,
    // PokeAPI answers unknown resources with a plain-text "Not Found"; parse by content type
    // so pages receive `{ status: 404 }` rather than a JSON parsing error.
    responseHandler: 'content-type',
  }),
  keepUnusedDataFor: SESSION_CACHE_SECONDS,
  endpoints: (build) => ({
    getPokemonSpecies: build.query<PokemonSpecies, string>({
      query: (name) => `pokemon-species/${encodeURIComponent(name)}`,
    }),
  }),
})

export const { useGetPokemonSpeciesQuery } = pokeApi
