import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  shapeAbility,
  shapePokemon,
  shapePokemonForm,
  shapeSpecies,
  toEvolutionTree,
  type AbilityLiveData,
  type EvolutionNode,
  type FormLiveData,
  type PokemonLiveData,
  type RawAbility,
  type RawEvolutionChain,
  type RawPokemon,
  type RawPokemonForm,
  type RawSpecies,
  type SpeciesLiveData,
} from '../features/pokemon-detail/shape'

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/'

/** Keep unused results for 24h, which in practice means "for the whole session". */
const SESSION_CACHE_SECONDS = 24 * 60 * 60

/**
 * Live PokeAPI data for the detail page. Static data (list, types, stats) comes from src/data.
 * Responses are reduced to small shapes in `transformResponse`, so the cache stays small and
 * components never touch raw PokeAPI JSON.
 */
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
    /** By index slug, e.g. `charizard-mega-x`. */
    getPokemon: build.query<PokemonLiveData, string>({
      query: (slug) => `pokemon/${encodeURIComponent(slug)}`,
      transformResponse: (raw: RawPokemon) => shapePokemon(raw),
    }),
    /** By species id (form slugs are not species names). */
    getPokemonSpecies: build.query<SpeciesLiveData, number>({
      query: (speciesId) => `pokemon-species/${speciesId}`,
      transformResponse: (raw: RawSpecies) => shapeSpecies(raw),
    }),
    getEvolutionChain: build.query<EvolutionNode, number>({
      query: (chainId) => `evolution-chain/${chainId}`,
      transformResponse: (raw: RawEvolutionChain) => toEvolutionTree(raw.chain),
    }),
    getAbility: build.query<AbilityLiveData, string>({
      query: (name) => `ability/${encodeURIComponent(name)}`,
      transformResponse: (raw: RawAbility) => shapeAbility(raw),
    }),
    getPokemonForm: build.query<FormLiveData, string>({
      query: (name) => `pokemon-form/${encodeURIComponent(name)}`,
      transformResponse: (raw: RawPokemonForm) => shapePokemonForm(raw),
    }),
  }),
})

export const {
  useGetPokemonQuery,
  useGetPokemonSpeciesQuery,
  useGetEvolutionChainQuery,
  useGetAbilityQuery,
  useGetPokemonFormQuery,
} = pokeApi
