import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderApp } from '../../test/renderApp'
import type { SquadsState } from './squadsSlice'

// Charizard, Gyarados, Dragonite, Venusaur, Gengar (+ Pikachu for a full squad).
const KANTO_FIVE = [6, 130, 149, 3, 94]
const squads = (members: number[]): SquadsState => ({
  squads: [{ id: 'k', name: 'Kanto run', members, updatedAt: 1 }],
  currentId: 'k',
})
const cards = (list: string) =>
  within(screen.getByRole('list', { name: list }))
    .getAllByRole('listitem')
    .filter((li) => li.querySelector('h3'))
const cardTitles = (list: string) =>
  cards(list).map((card) => card.querySelector('h3')!.getAttribute('aria-label'))

describe('Complete your squad', () => {
  test('nothing is suggested with 2 members', async () => {
    renderApp('/squads/k', { squads: squads([6, 130]) })
    await screen.findByRole('heading', { level: 1, name: 'Kanto run' })
    expect(screen.queryByRole('heading', { name: 'Complete your squad' })).not.toBeInTheDocument()
  })

  test('three members: Ground/Steel first, with reasons and the strongest Pokémon', async () => {
    renderApp('/squads/k', { squads: squads([6, 130, 3]) })
    expect(await screen.findByRole('heading', { name: 'Complete your squad' })).toBeInTheDocument()
    expect(cardTitles('Suggestions')[0]).toBe('Ground/Steel')
    expect(cardTitles('Suggestions')).toHaveLength(5)
  })

  test('the example five: Dark/Steel first, fixing Rock, listing Kingambit first', async () => {
    renderApp('/squads/k', { squads: squads(KANTO_FIVE) })
    await screen.findByRole('heading', { name: 'Complete your squad' })
    const first = cards('Suggestions')[0]!
    expect(first.querySelector('h3')).toHaveAttribute('aria-label', 'Steel/Dark')
    expect(within(first).getByText('Fixes the Rock problem.')).toBeInTheDocument()
    expect(within(first).getByText('Defense +19 · Attack 0')).toBeInTheDocument()
    const pokemon = within(
      within(first).getByRole('list', { name: 'Steel/Dark Pokémon' }),
    ).getAllByRole('link')
    expect(pokemon.map((l) => l.textContent)).toEqual(
      ['Kingambit', 'Bisharp', 'Pawniard'].slice(0, pokemon.length),
    )
  })

  test('"Show all" reveals the rest of a group', async () => {
    const user = userEvent.setup()
    renderApp('/squads/k', { squads: squads(KANTO_FIVE) })
    await screen.findByRole('heading', { name: 'Complete your squad' })
    const card = cards('Suggestions').find((c) =>
      within(c).queryByRole('button', { name: /^Show all/ }),
    )!
    const list = () => within(card).getAllByRole('button', { name: /^Add / })
    expect(list()).toHaveLength(3)
    await user.click(within(card).getByRole('button', { name: /^Show all/ }))
    expect(list().length).toBeGreaterThan(3)
  })

  test('adding from a suggestion fills the squad and switches to full-squad behaviour', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/squads/k', { squads: squads(KANTO_FIVE) })
    await user.click(await screen.findByRole('button', { name: 'Add Kingambit to Kanto run' }))
    expect(store.getState().squads.squads[0]!.members).toEqual([...KANTO_FIVE, 983])
    expect(screen.getByTestId('announcer')).toHaveTextContent('Added Kingambit to Kanto run')
    expect(screen.queryByRole('heading', { name: 'Complete your squad' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Find a replacement for/ })).toHaveLength(6)
  })

  test('options live in the URL; up to generation 4 hides Kingambit', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/squads/k', { squads: squads(KANTO_FIVE) })
    await screen.findByRole('heading', { name: 'Complete your squad' })
    await user.selectOptions(screen.getByLabelText('Generation'), '4')
    expect(router.state.location.search).toBe('?gen=4')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(
      screen.queryByRole('button', { name: 'Add Kingambit to Kanto run' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Legendary and mythical' }))
    expect(router.state.location.search).toBe('?gen=4&legendary=include')
  })

  test('the shared view shows no suggestions', async () => {
    renderApp('/squad?m=6,130,149,3,94&n=Kanto+run')
    await screen.findByRole('heading', { level: 1, name: 'Kanto run' })
    expect(screen.queryByRole('heading', { name: 'Complete your squad' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Find a replacement/ })).not.toBeInTheDocument()
  })
})

describe('Find a replacement', () => {
  const SIX = [...KANTO_FIVE, 25]

  test('only full squads offer it', async () => {
    renderApp('/squads/k', { squads: squads(KANTO_FIVE) })
    await screen.findByRole('heading', { level: 1, name: 'Kanto run' })
    expect(screen.queryByRole('button', { name: /^Find a replacement/ })).not.toBeInTheDocument()
  })

  test("Venusaur's slot: Dark/Steel first, labelled, with an effect", async () => {
    const user = userEvent.setup()
    renderApp('/squads/k', { squads: squads(SIX) })
    await user.click(await screen.findByRole('button', { name: 'Find a replacement for Venusaur' }))
    expect(screen.getByRole('heading', { name: 'Replacements for Venusaur' })).toBeInTheDocument()
    const first = cards('Replacement suggestions')[0]!
    expect(first.querySelector('h3')).toHaveAttribute('aria-label', 'Steel/Dark')
    expect(within(first).getByText('Improves the squad')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Find a replacement for Venusaur' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('swapping in keeps the position, announces it and closes the panel', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/squads/k', { squads: squads(SIX) })
    await user.click(await screen.findByRole('button', { name: 'Find a replacement for Venusaur' }))
    await user.click(screen.getByRole('button', { name: 'Swap in Kingambit for Venusaur' }))
    expect(store.getState().squads.squads[0]!.members).toEqual([6, 130, 149, 983, 94, 25])
    expect(screen.getByTestId('announcer')).toHaveTextContent(
      'Replaced Venusaur with Kingambit in Kanto run',
    )
    expect(screen.queryByRole('heading', { name: /Replacements for/ })).not.toBeInTheDocument()
  })

  test('one panel at a time; Close closes it', async () => {
    const user = userEvent.setup()
    renderApp('/squads/k', { squads: squads(SIX) })
    await user.click(await screen.findByRole('button', { name: 'Find a replacement for Venusaur' }))
    await user.click(screen.getByRole('button', { name: 'Find a replacement for Gengar' }))
    expect(screen.getAllByRole('heading', { name: /Replacements for/ })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Replacements for Gengar' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('heading', { name: /Replacements for/ })).not.toBeInTheDocument()
  })
})
