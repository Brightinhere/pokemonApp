import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { makeStore } from '../app/store'
import abilitySolarPower from '../features/pokemon-detail/fixtures/ability-solar-power.json'
import chainCharizard from '../features/pokemon-detail/fixtures/evolution-chain-2.json'
import pokemonCharizard from '../features/pokemon-detail/fixtures/pokemon-charizard.json'
import formPolar from '../features/pokemon-detail/fixtures/pokemon-form-vivillon-polar.json'
import species6 from '../features/pokemon-detail/fixtures/species-6.json'
import { pokeApi } from './pokeApi'

const fetchMock = vi.fn<typeof fetch>()
const requestedUrl = (call = 0) => (fetchMock.mock.calls[call]![0] as Request).url

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pokeApi endpoints', () => {
  test('getPokemon requests by slug and shapes abilities', async () => {
    fetchMock.mockResolvedValue(Response.json(pokemonCharizard))
    const result = await makeStore().dispatch(pokeApi.endpoints.getPokemon.initiate('charizard'))
    expect(requestedUrl()).toBe('https://pokeapi.co/api/v2/pokemon/charizard')
    expect(result.data?.abilities).toEqual([
      { name: 'blaze', isHidden: false },
      { name: 'solar-power', isHidden: true },
    ])
  })

  test('getPokemonSpecies requests by species id', async () => {
    fetchMock.mockResolvedValue(Response.json(species6))
    const result = await makeStore().dispatch(pokeApi.endpoints.getPokemonSpecies.initiate(6))
    expect(requestedUrl()).toBe('https://pokeapi.co/api/v2/pokemon-species/6')
    expect(result.data?.evolutionChainId).toBe(2)
  })

  test('getEvolutionChain shapes the chain into a tree', async () => {
    fetchMock.mockResolvedValue(Response.json(chainCharizard))
    const result = await makeStore().dispatch(pokeApi.endpoints.getEvolutionChain.initiate(2))
    expect(requestedUrl()).toBe('https://pokeapi.co/api/v2/evolution-chain/2')
    expect(result.data?.children[0]?.condition).toBe('Level 16')
  })

  test('getAbility and getPokemonForm', async () => {
    const store = makeStore()
    fetchMock.mockResolvedValueOnce(Response.json(abilitySolarPower))
    const ability = await store.dispatch(pokeApi.endpoints.getAbility.initiate('solar-power'))
    expect(requestedUrl(0)).toBe('https://pokeapi.co/api/v2/ability/solar-power')
    expect(ability.data?.displayName).toBe('Solar Power')

    fetchMock.mockResolvedValueOnce(Response.json(formPolar))
    const form = await store.dispatch(pokeApi.endpoints.getPokemonForm.initiate('vivillon-polar'))
    expect(requestedUrl(1)).toBe('https://pokeapi.co/api/v2/pokemon-form/vivillon-polar')
    expect(form.data?.displayName).toBe('Polar Pattern')
  })

  test('a repeat request in the same session is served from cache', async () => {
    fetchMock.mockResolvedValue(Response.json(species6))
    const store = makeStore()
    const first = store.dispatch(pokeApi.endpoints.getPokemonSpecies.initiate(6))
    await first
    first.unsubscribe()
    const second = await store.dispatch(pokeApi.endpoints.getPokemonSpecies.initiate(6))
    expect(second.data?.evolutionChainId).toBe(2)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('network failures and HTTP errors surface as error states', async () => {
    const store = makeStore()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const failed = await store.dispatch(pokeApi.endpoints.getPokemon.initiate('charizard'))
    expect(failed.error).toMatchObject({ status: 'FETCH_ERROR' })

    fetchMock.mockResolvedValueOnce(new Response('Not Found', { status: 404 }))
    const missing = await store.dispatch(pokeApi.endpoints.getPokemon.initiate('nope'))
    expect(missing.error).toMatchObject({ status: 404 })
  })
})
