import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { makeStore } from '../app/store'
import { pokeApi } from './pokeApi'

const species = {
  id: 25,
  name: 'pikachu',
  names: [],
  flavor_text_entries: [],
  evolution_chain: null,
  varieties: [],
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pokeApi', () => {
  test('requests the species endpoint on PokeAPI', async () => {
    fetchMock.mockResolvedValue(Response.json(species))
    const store = makeStore()
    const result = await store.dispatch(pokeApi.endpoints.getPokemonSpecies.initiate('pikachu'))
    expect(result.data).toEqual(species)
    const request = fetchMock.mock.calls[0]![0] as Request
    expect(request.url).toBe('https://pokeapi.co/api/v2/pokemon-species/pikachu')
  })

  test('serves a repeat request in the same session from cache', async () => {
    fetchMock.mockResolvedValue(Response.json(species))
    const store = makeStore()

    const first = store.dispatch(pokeApi.endpoints.getPokemonSpecies.initiate('pikachu'))
    await first
    first.unsubscribe() // no component is using it any more...

    const second = await store.dispatch(pokeApi.endpoints.getPokemonSpecies.initiate('pikachu'))
    expect(second.data).toEqual(species) // ...yet it is still cached
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('surfaces network failures as an error state', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const store = makeStore()
    const failed = await store.dispatch(pokeApi.endpoints.getPokemonSpecies.initiate('pikachu'))
    expect(failed.isError).toBe(true)
    expect(failed.error).toMatchObject({ status: 'FETCH_ERROR' })

    // The store keeps working for other requests.
    fetchMock.mockResolvedValueOnce(Response.json({ ...species, id: 1, name: 'bulbasaur' }))
    const ok = await store.dispatch(pokeApi.endpoints.getPokemonSpecies.initiate('bulbasaur'))
    expect(ok.isSuccess).toBe(true)
  })

  test('surfaces HTTP errors as an error state', async () => {
    fetchMock.mockResolvedValue(new Response('Not Found', { status: 404 }))
    const store = makeStore()
    const result = await store.dispatch(pokeApi.endpoints.getPokemonSpecies.initiate('nope'))
    expect(result.error).toMatchObject({ status: 404 })
  })
})
