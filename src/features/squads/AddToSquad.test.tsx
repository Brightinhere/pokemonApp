import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderApp } from '../../test/renderApp'
import type { SquadsState } from './squadsSlice'

const kantoRun = (members: number[]): SquadsState => ({
  squads: [{ id: 'k', name: 'Kanto run', members, updatedAt: 1 }],
  currentId: 'k',
})

beforeEach(() => {
  // The detail page loads live data; keep these tests offline.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('adding from the Pokédex list', () => {
  test('adds to the current squad, stays on the list and announces it', async () => {
    const user = userEvent.setup()
    const { store, router } = renderApp('/?q=gengar', { squads: kantoRun([6, 130, 149]) })
    await user.click(await screen.findByRole('button', { name: 'Add Gengar to Kanto run' }))
    expect(store.getState().squads.squads[0]!.members).toEqual([6, 130, 149, 94])
    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByTestId('announcer')).toHaveTextContent('Added Gengar to Kanto run')
  })

  test('with no squads, the first add creates "Squad 1"', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/?q=charizard')
    await user.click(await screen.findByRole('button', { name: 'Add Charizard to a new squad' }))
    const { squads, currentId } = store.getState().squads
    expect(squads).toHaveLength(1)
    expect(squads[0]).toMatchObject({ name: 'Squad 1', members: [6] })
    expect(currentId).toBe(squads[0]!.id)
    expect(screen.getByTestId('announcer')).toHaveTextContent('Added Charizard to Squad 1')
  })

  test('a full squad makes adding unavailable and says why', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/?q=charizard', { squads: kantoRun([1, 2, 3, 4, 5, 7]) })
    const button = await screen.findByRole('button', { name: 'Kanto run is full, 6 of 6' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveTextContent('Full')
    await user.click(button)
    expect(store.getState().squads.squads[0]!.members).toHaveLength(6)
  })
})

describe('adding from the detail page', () => {
  test('"Add to <squad name>" adds that entry', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/pokemon/charizard-mega-x', { squads: kantoRun([94]) })
    const button = await screen.findByRole('button', { name: 'Add Mega Charizard X to Kanto run' })
    expect(button).toHaveTextContent('Add to Kanto run')
    await user.click(button)
    await waitFor(() => expect(store.getState().squads.squads[0]!.members).toEqual([94, 10034]))
  })

  test('a full squad is named on the detail page', async () => {
    renderApp('/pokemon/charizard', { squads: kantoRun([1, 2, 3, 4, 5, 7]) })
    expect(
      await screen.findByRole('button', { name: 'Kanto run is full, 6 of 6' }),
    ).toHaveTextContent('Kanto run is full')
  })
})
