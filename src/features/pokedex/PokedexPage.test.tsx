import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { resetPokemonIndexForTests } from '../../data/pokemonIndex'
import { renderApp } from '../../test/renderApp'

const rows = () => within(screen.getByRole('list', { name: 'Pokémon' })).getAllByRole('listitem')
const row = (name: string) => screen.getByRole('link', { name }).closest('li')!
const toggle = (name: string) => screen.getByRole('button', { name })

afterEach(() => {
  resetPokemonIndexForTests()
  vi.unstubAllGlobals()
})

describe('Pokédex list', () => {
  test('default view: 1,025 species, Charizard row content', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { name: '1,025 Pokémon' })).toBeInTheDocument()
    expect(rows()).toHaveLength(1025)
    const charizard = row('Charizard')
    expect(within(charizard).getByText('#0006')).toBeInTheDocument()
    expect(within(charizard).getByRole('link', { name: 'Charizard' })).toHaveAttribute(
      'href',
      '/pokemon/charizard',
    )
    expect(within(charizard).getByText('Fire')).toBeInTheDocument()
    expect(within(charizard).getByText('Flying')).toBeInTheDocument()
    expect(within(charizard).getByText('534')).toBeInTheDocument()
  })

  test('battle-only form row', async () => {
    renderApp('/?forms=mega')
    expect(
      await screen.findByRole('heading', { name: '1,122 Pokémon and forms' }),
    ).toBeInTheDocument()
    const megaX = row('Mega Charizard X')
    expect(within(megaX).getByText('#0006')).toBeInTheDocument()
    expect(within(megaX).getByRole('link')).toHaveAttribute('href', '/pokemon/charizard-mega-x')
    expect(within(megaX).getByText('Battle-only mega form')).toBeInTheDocument()
  })

  test('a shared link restores filters and sort', async () => {
    renderApp('/?types=fire,flying&sort=speed')
    await screen.findByRole('heading', { name: '6 Pokémon' })
    expect(toggle('Fire')).toHaveAttribute('aria-pressed', 'true')
    expect(toggle('Flying')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Sort by')).toHaveValue('speed')
    expect(within(rows()[0]!).getByRole('link')).toHaveTextContent('Talonflame')
  })

  test('back and forward step through filter changes', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await screen.findByRole('heading', { name: '1,025 Pokémon' })
    await user.click(toggle('Mega'))
    expect(router.state.location.search).toBe('?forms=mega')
    await screen.findByRole('heading', { name: '1,122 Pokémon and forms' })

    await act(() => router.navigate(-1))
    expect(router.state.location.search).toBe('')
    expect(await screen.findByRole('heading', { name: '1,025 Pokémon' })).toBeInTheDocument()
    expect(toggle('Mega')).toHaveAttribute('aria-pressed', 'false')
  })

  test('returning from a detail page keeps the list state', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/?q=char')
    await user.click(await screen.findByRole('link', { name: 'Charizard' }))
    expect(router.state.location.pathname).toBe('/pokemon/charizard')
    await act(() => router.navigate(-1))
    expect(router.state.location.search).toBe('?q=char')
    expect(await screen.findByLabelText('Search')).toHaveValue('char')
  })

  test('typing searches without adding history entries', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await screen.findByRole('heading', { name: '1,025 Pokémon' })
    await user.type(screen.getByLabelText('Search'), 'mr mime')
    expect(screen.getByLabelText('Search')).toHaveValue('mr mime')
    expect(router.state.location.search).toBe('?q=mr+mime')
    expect(router.state.historyAction).toBe('REPLACE')
    await waitFor(() =>
      expect(rows().map((r) => within(r).getByRole('link').textContent)).toContain('Mr. Mime'),
    )
  })

  test('a third type cannot be selected', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await screen.findByRole('heading', { name: '1,025 Pokémon' })
    await user.click(toggle('Fire'))
    await user.click(toggle('Flying'))
    expect(toggle('Water')).toBeDisabled()
    expect(toggle('Fire')).toBeEnabled()
    await user.click(toggle('Fire'))
    expect(toggle('Water')).toBeEnabled()
  })

  test('empty state clears everything back to /', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/?q=zzzz&types=fire&sort=speed')
    expect(await screen.findByText('No Pokémon match your search and filters.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }))
    expect(router.state.location.search).toBe('')
    expect(await screen.findByRole('heading', { name: '1,025 Pokémon' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search')).toHaveValue('')
  })
})

describe('Pokédex loading and errors', () => {
  test('shows a loading state while the index loads', async () => {
    resetPokemonIndexForTests(() => new Promise(() => {}))
    renderApp('/')
    expect(await screen.findByText('Loading the Pokédex…')).toBeInTheDocument()
  })

  test('shows an error with a working "Try again"', async () => {
    const user = userEvent.setup()
    let attempts = 0
    resetPokemonIndexForTests(async () => {
      attempts++
      if (attempts === 1) throw new Error('offline')
      return (await import('../../data/index.json')).default as never
    })
    renderApp('/')
    expect(await screen.findByText('The Pokémon list could not be loaded.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: '1,025 Pokémon' })).toBeInTheDocument()
  })
})

describe('Pokédex on small screens and keyboard', () => {
  test('filters collapse behind "Filters" at 960px or less', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(max-width: 960px)', media: q }))
    renderApp('/')
    await screen.findByRole('heading', { name: '1,025 Pokémon' })
    const details = screen.getByText('Filters', { selector: 'summary' }).closest('details')!
    expect(details).not.toHaveAttribute('open')
    await user.click(screen.getByText('Filters', { selector: 'summary' }))
    expect(details).toHaveAttribute('open')
  })

  test('filters are open on wide screens', async () => {
    renderApp('/')
    await screen.findByRole('heading', { name: '1,025 Pokémon' })
    expect(screen.getByText('Filters', { selector: 'summary' }).closest('details')).toHaveAttribute(
      'open',
    )
  })

  test('a form toggle works with Space', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await screen.findByRole('heading', { name: '1,025 Pokémon' })
    toggle('Mega').focus()
    await user.keyboard(' ')
    expect(toggle('Mega')).toHaveAttribute('aria-pressed', 'true')
    expect(router.state.location.search).toBe('?forms=mega')
  })
})
