import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderApp } from '../../test/renderApp'
import abilityBlaze from './fixtures/ability-blaze.json'
import abilitySolarPower from './fixtures/ability-solar-power.json'
import chainCharizard from './fixtures/evolution-chain-2.json'
import chainEevee from './fixtures/evolution-chain-67.json'
import pokemonCharizard from './fixtures/pokemon-charizard.json'
import formPolar from './fixtures/pokemon-form-vivillon-polar.json'
import pokemonVivillon from './fixtures/pokemon-vivillon.json'
import species133 from './fixtures/species-133.json'
import species6 from './fixtures/species-6.json'

const noEvolution = { flavor_text_entries: [], evolution_chain: null }
const minimalPokemon = (name: string) => ({ name, abilities: [], forms: [{ name, url: '' }] })

/** A fake PokeAPI: path -> JSON body, or a status code to fail with. */
let routes: Record<string, unknown>
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  routes = {
    'pokemon/charizard': pokemonCharizard,
    'pokemon/charizard-mega-x': minimalPokemon('charizard-mega-x'),
    'pokemon/eevee': minimalPokemon('eevee'),
    'pokemon/bulbasaur': minimalPokemon('bulbasaur'),
    'pokemon/tauros': minimalPokemon('tauros'),
    'pokemon/vivillon': pokemonVivillon,
    'pokemon/koraidon-limited-build': minimalPokemon('koraidon-limited-build'),
    'pokemon-species/1': noEvolution,
    'pokemon-species/128': noEvolution,
    'pokemon-species/6': species6,
    'pokemon-species/133': species133,
    'pokemon-species/666': noEvolution,
    'pokemon-species/1007': noEvolution,
    'evolution-chain/2': chainCharizard,
    'evolution-chain/67': chainEevee,
    'ability/blaze': abilityBlaze,
    'ability/solar-power': abilitySolarPower,
    'pokemon-form/vivillon-polar': formPolar,
  }
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input) => {
    const path = new URL((input as Request).url).pathname
      .replace('/api/v2/', '')
      .replace(/^\/|\/$/g, '')
    const body = routes[path]
    if (body === undefined) return new Response('Not Found', { status: 404 })
    if (typeof body === 'number') return new Response('Server error', { status: body })
    return Response.json(body)
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

const section = (title: string) => screen.getByRole('heading', { name: title }).closest('section')!

describe('detail page from the index', () => {
  test('Mega Charizard X header', async () => {
    renderApp('/pokemon/charizard-mega-x')
    const heading = await screen.findByRole('heading', { level: 1, name: 'Mega Charizard X' })
    const header = heading.closest('header')!
    expect(within(header).getByText('#0006')).toBeInTheDocument()
    expect(within(header).getByText('Fire')).toBeInTheDocument()
    expect(within(header).getByText('Dragon')).toBeInTheDocument()
    expect(within(header).getByText('Battle-only mega form')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toContain('Mega Charizard X'))
  })

  test("Charizard's base stats", async () => {
    renderApp('/pokemon/charizard')
    await screen.findByRole('heading', { level: 1, name: 'Charizard' })
    const stats = within(section('Base stats'))
    for (const [label, value] of [
      ['HP', '78'],
      ['Attack', '84'],
      ['Defense', '78'],
      ['Sp. Attack', '109'],
      ['Sp. Defense', '85'],
      ['Speed', '100'],
      ['Total', '534'],
    ] as const) {
      expect(stats.getByText(label).nextElementSibling).toHaveTextContent(value)
    }
  })

  test("Charizard's damage taken", async () => {
    renderApp('/pokemon/charizard')
    await screen.findByRole('heading', { level: 1, name: 'Charizard' })
    const damage = within(section('Damage taken'))
    const group = (label: string) =>
      [...damage.getByText(label).nextElementSibling!.children].map((c) => c.textContent)
    expect(group('4×')).toEqual(['Rock'])
    expect(group('2×')).toEqual(['Water', 'Electric'])
    expect(group('½×')).toEqual(['Fighting', 'Steel', 'Fire', 'Fairy'])
    expect(group('¼×')).toEqual(['Bug', 'Grass'])
    expect(group('0×')).toEqual(['Ground'])
  })

  test('an unknown name shows not-found and requests nothing', async () => {
    renderApp('/pokemon/missingno')
    expect(await screen.findByText('There is no Pokémon called “missingno”.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the Pokédex' })).toHaveAttribute('href', '/')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('missing artwork shows a placeholder', async () => {
    renderApp('/pokemon/koraidon-limited-build')
    const heading = await screen.findByRole('heading', { level: 1 })
    expect(within(heading.closest('header')!).getByTestId('art-placeholder')).toBeInTheDocument()
    expect(within(section('Base stats')).getByText('Total')).toBeInTheDocument()
  })
})

describe('live sections', () => {
  test('flavor text and abilities', async () => {
    renderApp('/pokemon/charizard')
    expect(
      await screen.findByText(/Its wings can carry this Pokémon close to an altitude/),
    ).toBeInTheDocument()
    const abilities = within(section('Abilities'))
    expect(await abilities.findByText('Blaze')).toBeInTheDocument()
    expect(abilities.getByText('Solar Power')).toBeInTheDocument()
    expect(abilities.getByText('(hidden ability)').previousElementSibling).toHaveTextContent(
      'Solar Power',
    )
    expect(await abilities.findByText(/Sp\. Atk stat is boosted/)).toBeInTheDocument()
  })

  test("Charizard's evolution chain", async () => {
    renderApp('/pokemon/charizard')
    const chain = within(await screen.findByRole('list', { name: 'Evolution chain' }))
    const links = chain.getAllByRole('link')
    expect(links.map((l) => l.querySelector('.font-bold')?.textContent)).toEqual([
      'Charmander',
      'Charmeleon',
      'Charizard',
    ])
    expect(chain.getByText('Level 16')).toBeInTheDocument()
    expect(chain.getByText('Level 36')).toBeInTheDocument()
    expect(links[2]).toHaveAttribute('aria-current', 'page')
    expect(links[0]).toHaveAttribute('href', '/pokemon/charmander')
  })

  test("Eevee's branches", async () => {
    renderApp('/pokemon/eevee')
    const chain = within(await screen.findByRole('list', { name: 'Evolution chain' }))
    expect(chain.getAllByRole('link')).toHaveLength(9)
    expect(chain.getByText('Water Stone')).toBeInTheDocument()
    expect(chain.getByText('Friendship, during the day')).toBeInTheDocument()
  })

  test('an alternate form shows its species chain', async () => {
    renderApp('/pokemon/charizard-mega-x')
    const chain = within(await screen.findByRole('list', { name: 'Evolution chain' }))
    expect(chain.getByRole('link', { current: 'page' })).toHaveTextContent('Charizard')
  })

  test('a failed evolution chain leaves the other sections and offers "Try again"', async () => {
    const user = userEvent.setup()
    routes['evolution-chain/2'] = 500
    renderApp('/pokemon/charizard')
    const evolution = within(section('Evolution'))
    expect(
      await evolution.findByText('The evolution chain could not be loaded.'),
    ).toBeInTheDocument()
    expect(within(section('Abilities')).getByText('Blaze')).toBeInTheDocument()
    expect(section('Base stats')).toBeInTheDocument()
    expect(section('Damage taken')).toBeInTheDocument()

    routes['evolution-chain/2'] = chainCharizard
    await user.click(evolution.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('list', { name: 'Evolution chain' })).toBeInTheDocument()
  })

  test('a species that does not evolve says so', async () => {
    renderApp('/pokemon/tauros')
    expect(
      await within(section('Evolution')).findByText('Tauros does not evolve.'),
    ).toBeInTheDocument()
  })
})

describe('forms switcher', () => {
  test('Charizard lists its battle forms as links', async () => {
    renderApp('/pokemon/charizard')
    const forms = within(await screen.findByRole('navigation', { name: 'Forms' }))
    const links = forms.getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual([
      'Charizard',
      'Mega Charizard X',
      'Mega Charizard Y',
      'Gigantamax Charizard',
    ])
    expect(links[0]).toHaveAttribute('aria-current', 'page')
    expect(links[1]).toHaveAttribute('href', '/pokemon/charizard-mega-x')
  })

  test('Vivillon patterns change only the artwork', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/pokemon/vivillon')
    const forms = within(await screen.findByRole('navigation', { name: 'Forms' }))
    expect(forms.getAllByRole('button')).toHaveLength(20)
    await user.click(forms.getByRole('button', { name: 'Polar' }))
    const art = screen.getByRole('img', { name: 'Vivillon artwork' })
    await waitFor(() => expect(art).toHaveAttribute('src', formPolar.sprites.front_default))
    expect(await screen.findByText('Polar Pattern')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/pokemon/vivillon')
    expect(within(section('Base stats')).getByText('Total')).toBeInTheDocument()
  })

  test('Bulbasaur has no switcher', async () => {
    renderApp('/pokemon/bulbasaur')
    await screen.findByRole('heading', { level: 1, name: 'Bulbasaur' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.queryByRole('navigation', { name: 'Forms' })).not.toBeInTheDocument()
  })
})
