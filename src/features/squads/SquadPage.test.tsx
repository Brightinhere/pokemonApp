import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderApp } from '../../test/renderApp'
import { addMember } from './squadsSlice'
import type { SquadsState } from './squadsSlice'

// Charizard, Gyarados, Dragonite, Venusaur, Gengar: Rock is the problem type.
const example = [6, 130, 149, 3, 94]

const squads = (members: number[], extra: SquadsState['squads'] = []): SquadsState => ({
  squads: [{ id: 'k', name: 'Kanto run', members, updatedAt: 5 }, ...extra],
  currentId: 'k',
})

const memberNames = () =>
  within(screen.getByRole('list', { name: 'Members' }))
    .queryAllByRole('link')
    .map((link) => link.textContent)
    .filter((name) => name !== 'Add a Pokémon')

describe('squad page: managing the squad', () => {
  test('rename trims, and an empty name shows an error and keeps the old name', async () => {
    const user = userEvent.setup()
    const { store } = renderApp('/squads/k', { squads: squads([6]) })
    await user.click(await screen.findByRole('button', { name: 'Rename' }))
    const input = screen.getByLabelText('Squad name')
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Save name' }))
    expect(screen.getByRole('alert')).toHaveTextContent("The name can't be empty.")
    expect(store.getState().squads.squads[0]!.name).toBe('Kanto run')

    await user.type(input, '  Johto run  ')
    await user.click(screen.getByRole('button', { name: 'Save name' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Johto run' })).toBeInTheDocument()
    expect(store.getState().squads.squads[0]!.name).toBe('Johto run')
  })

  test('delete needs confirmation; cancel keeps the squad', async () => {
    const user = userEvent.setup()
    const { store, router } = renderApp('/squads/k', { squads: squads([6]) })
    await user.click(await screen.findByRole('button', { name: 'Delete squad' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(store.getState().squads.squads).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Delete squad' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(store.getState().squads.squads).toHaveLength(0)
    expect(router.state.location.pathname).toBe('/squads')
  })

  test('reorder and remove members', async () => {
    const user = userEvent.setup()
    renderApp('/squads/k', { squads: squads([6, 130, 94]) })
    expect(await screen.findByRole('list', { name: 'Members' })).toBeInTheDocument()
    expect(memberNames()).toEqual(['Charizard', 'Gyarados', 'Gengar'])
    expect(screen.queryByRole('button', { name: 'Move Charizard earlier' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Move Gengar later' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Move Gengar earlier' }))
    expect(memberNames()).toEqual(['Charizard', 'Gengar', 'Gyarados'])

    await user.click(screen.getByRole('button', { name: 'Remove Gyarados' }))
    expect(memberNames()).toEqual(['Charizard', 'Gengar'])
    expect(screen.getByText('4 slots left')).toBeInTheDocument()
  })

  test('warnings for the same species and for two Megas', async () => {
    renderApp('/squads/k', { squads: squads([6, 10034, 10038]) })
    const warnings = within(await screen.findByRole('list', { name: 'Warnings' }))
    expect(warnings.getByText(/Charizard appears more than once/)).toBeInTheDocument()
    expect(
      warnings.getByText(/Only one Mega Evolution can be used in a battle/),
    ).toBeInTheDocument()
    expect(memberNames()).toHaveLength(3)
  })

  test('opening a squad makes it current', async () => {
    const { store } = renderApp('/squads/b', {
      squads: squads([6], [{ id: 'b', name: 'Squad 2', members: [], updatedAt: 1 }]),
    })
    await screen.findByRole('heading', { level: 1, name: 'Squad 2' })
    expect(store.getState().squads.currentId).toBe('b')
  })

  test('an unknown squad id says so and links to the list', async () => {
    renderApp('/squads/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Squad not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to your squads' })).toHaveAttribute(
      'href',
      '/squads',
    )
  })
})

describe('squad page: analysis', () => {
  test('matchup sheet shape and cells for the example squad', async () => {
    renderApp('/squads/k', { squads: squads(example) })
    const sheet = await screen.findByRole('table')
    const rows = within(sheet).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(18)
    expect(within(sheet).getAllByRole('columnheader')).toHaveLength(1 + 5 + 2)

    const rock = rows.find((row) =>
      within(row).getByRole('rowheader').textContent?.startsWith('Rock'),
    )!
    const cells = within(rock).getAllByRole('cell')
    expect(cells.at(-2)).toHaveTextContent('3')
    expect(cells.at(-1)).toHaveTextContent('0')
    expect(within(cells[0]!).getByRole('img')).toHaveAccessibleName('takes 4×')
    expect(within(rock).getByRole('rowheader')).toHaveTextContent('(problem type)')

    const electric = rows.find((row) =>
      within(row).getByRole('rowheader').textContent?.startsWith('Electric'),
    )!
    expect(within(within(electric).getAllByRole('cell')[1]!).getByRole('img')).toHaveAccessibleName(
      'takes 4×',
    )
    const ground = rows.find((row) =>
      within(row).getByRole('rowheader').textContent?.startsWith('Ground'),
    )!
    expect(within(within(ground).getAllByRole('cell')[0]!).getByRole('img')).toHaveAccessibleName(
      'immune',
    )
  })

  test('the Rock problem is explained with the types that resist it', async () => {
    renderApp('/squads/k', { squads: squads(example) })
    const heading = await screen.findByRole('heading', {
      name: "Rock hits 3 of this squad's Pokémon super-effectively, and none of them resist it.",
    })
    const fix = heading.nextElementSibling!
    expect(
      within(fix as HTMLElement)
        .getAllByText(/^(Fighting|Ground|Steel)$/)
        .map((e) => e.textContent),
    ).toEqual(['Fighting', 'Ground', 'Steel'])
    expect(
      screen.getAllByRole('heading', { name: /hits \d of this squad's Pokémon/ }),
    ).toHaveLength(1)
  })

  test('coverage lists the 5 uncovered types', async () => {
    renderApp('/squads/k', { squads: squads(example) })
    const uncovered = within(await screen.findByRole('list', { name: 'Uncovered types' }))
    expect(uncovered.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Normal',
      'Flying',
      'Poison',
      'Electric',
      'Dark',
    ])
    expect(
      within(screen.getByRole('list', { name: 'Covered types' })).getAllByRole('listitem'),
    ).toHaveLength(13)
  })

  test('adding a Steel member clears the Rock problem', async () => {
    const { store } = renderApp('/squads/k', { squads: squads(example) })
    await screen.findByRole('heading', { name: /Rock hits 3/ })
    act(() => {
      store.dispatch(addMember({ entryId: 376 })) // Metagross: Steel/Psychic
    })
    expect(await screen.findByRole('heading', { name: 'No problem types.' })).toBeInTheDocument()
  })

  test('an empty squad invites adding Pokémon instead of showing the sheet', async () => {
    renderApp('/squads/k', { squads: squads([]) })
    expect(
      await screen.findByText('Add Pokémon to see how this squad holds up.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse the Pokédex' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('squad page: stamp-in animation', () => {
  test('only the newly added member animates, and nothing animates on first render', async () => {
    const { store, container } = renderAppWithContainer()
    await screen.findByRole('table')
    expect(container.querySelectorAll('.mark-fresh')).toHaveLength(0)

    act(() => {
      store.dispatch(addMember({ entryId: 376 }))
    })
    const sheet = screen.getByRole('table')
    const metagrossColumn = 6 // after the type column and 5 members
    const fresh = sheet.querySelectorAll('.mark-fresh')
    expect(fresh).toHaveLength(18)
    for (const mark of fresh) {
      expect(mark.closest('td')!.cellIndex).toBe(metagrossColumn)
    }
  })
})

function renderAppWithContainer() {
  const result = renderApp('/squads/k', { squads: squads(example) })
  return { ...result, container: document.body }
}
