import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderApp } from '../../test/renderApp'

const twoMembers = {
  squads: [{ id: 'k', name: 'Kanto run', members: [6, 130], updatedAt: 1 }],
  currentId: 'k',
}

describe('SquadTray', () => {
  test('is hidden without squads', async () => {
    renderApp('/')
    await screen.findByRole('heading', { name: '1,025 Pokémon' })
    expect(screen.queryByRole('link', { name: /Current squad/ })).not.toBeInTheDocument()
  })

  test('shows the current squad, links to it, and follows adds', async () => {
    const user = userEvent.setup()
    renderApp('/?q=gengar', { squads: twoMembers })
    const tray = await screen.findByRole('link', { name: 'Current squad: Kanto run, 2 of 6' })
    expect(tray).toHaveAttribute('href', '/squads/k')
    expect(await within(tray).findAllByTestId('tray-slot-filled')).toHaveLength(2)
    expect(tray).toHaveTextContent('Squad 2/6')

    await user.click(await screen.findByRole('button', { name: 'Add Gengar to Kanto run' }))
    const updated = screen.getByRole('link', { name: 'Current squad: Kanto run, 3 of 6' })
    expect(within(updated).getAllByTestId('tray-slot-filled')).toHaveLength(3)
    expect(within(updated).getAllByTestId('tray-slot-empty')).toHaveLength(3)
  })
})
