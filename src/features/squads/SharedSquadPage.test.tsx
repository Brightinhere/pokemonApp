import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderApp } from '../../test/renderApp'
import type { SquadsState } from './squadsSlice'

const own: SquadsState = {
  squads: [{ id: 'mine', name: 'My team', members: [25], updatedAt: 1 }],
  currentId: 'mine',
}
const memberNames = () =>
  within(screen.getByRole('list', { name: 'Members' }))
    .getAllByRole('link')
    .map((link) => link.textContent)

describe('shared squad view', () => {
  test('shows the squad and analysis read-only, leaving own squads alone', async () => {
    const { store } = renderApp('/squad?m=6,130,149,3,94&n=Kanto+run', { squads: own })
    expect(await screen.findByRole('heading', { level: 1, name: 'Kanto run' })).toBeInTheDocument()
    expect(memberNames()).toEqual(['Charizard', 'Gyarados', 'Dragonite', 'Venusaur', 'Gengar'])
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Remove|Move|Rename|Delete/ }),
    ).not.toBeInTheDocument()
    expect(store.getState().squads).toEqual(own)
  })

  test('without a name it is called "Shared squad"', async () => {
    renderApp('/squad?m=6,94')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Shared squad' }),
    ).toBeInTheDocument()
  })

  test('partly invalid links show what they can, with a note', async () => {
    renderApp('/squad?m=6,abc,99999,94')
    await screen.findByRole('heading', { level: 1, name: 'Shared squad' })
    expect(memberNames()).toEqual(['Charizard', 'Gengar'])
    expect(screen.getByRole('note')).toHaveTextContent(
      "Some Pokémon in this link couldn't be shown",
    )
  })

  test('more than six: the first six, with the same note', async () => {
    renderApp('/squad?m=1,2,3,4,5,6,7,8')
    await screen.findByRole('heading', { level: 1, name: 'Shared squad' })
    expect(memberNames()).toHaveLength(6)
    expect(screen.getByRole('note')).toBeInTheDocument()
  })

  test('a link with nothing valid says so and links to the Pokédex', async () => {
    renderApp('/squad?m=abc')
    expect(
      await screen.findByRole('heading', { name: 'This link has no Pokémon in it' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse the Pokédex' })).toHaveAttribute('href', '/')
  })

  test('"Save as my squad" creates a current squad and opens it', async () => {
    const user = userEvent.setup()
    const { store, router } = renderApp('/squad?m=6,130,94&n=Kanto+run', { squads: own })
    await user.click(await screen.findByRole('button', { name: 'Save as my squad' }))
    const { squads, currentId } = store.getState().squads
    expect(squads).toHaveLength(2)
    expect(squads[1]).toMatchObject({ name: 'Kanto run', members: [6, 130, 94] })
    expect(currentId).toBe(squads[1]!.id)
    expect(router.state.location.pathname).toBe(`/squads/${squads[1]!.id}`)
    expect(await screen.findByRole('button', { name: 'Rename' })).toBeInTheDocument()
  })
})
