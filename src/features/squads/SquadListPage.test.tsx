import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('squad list', () => {
  test('empty state explains squads and offers "New squad"', async () => {
    renderApp('/squads')
    expect(await screen.findByText('No squads yet')).toBeInTheDocument()
    expect(screen.getByText(/A squad holds up to six Pokémon/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'New squad' }).length).toBeGreaterThan(0)
  })

  test('lists squads, most recently changed first, marking the current one', async () => {
    renderApp('/squads', {
      squads: {
        squads: [
          { id: 'a', name: 'Squad 2', members: [], updatedAt: 1 },
          { id: 'k', name: 'Kanto run', members: [6, 130, 94], updatedAt: 9 },
        ],
        currentId: 'a',
      },
    })
    const items = within(screen.getByRole('list')).getAllByRole('link')
    expect(items.map((item) => item.getAttribute('href'))).toEqual(['/squads/k', '/squads/a'])
    expect(items[0]).toHaveTextContent('Kanto run')
    expect(items[0]).toHaveTextContent('3 of 6')
    expect(within(items[1]!).getByText('Current')).toBeInTheDocument()
  })

  test('"New squad" creates "Squad 1" and opens it', async () => {
    const user = userEvent.setup()
    const { router, store } = renderApp('/squads')
    await user.click((await screen.findAllByRole('button', { name: 'New squad' }))[0]!)
    const { squads, currentId } = store.getState().squads
    expect(squads).toHaveLength(1)
    expect(squads[0]!.name).toBe('Squad 1')
    expect(currentId).toBe(squads[0]!.id)
    expect(router.state.location.pathname).toBe(`/squads/${squads[0]!.id}`)
  })
})
