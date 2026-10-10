import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('routes', () => {
  test.each([
    ['/', 'Pokédex'],
    ['/pokemon/pikachu', 'Pokémon detail'],
    ['/squads', 'Squads'],
    ['/squads/abc', 'Squad'],
  ])('%s renders its page inside the app frame', async (path, heading) => {
    renderApp(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  test('detail page receives the :name parameter', async () => {
    renderApp('/pokemon/pikachu')
    expect(await screen.findByText('pikachu')).toBeInTheDocument()
  })

  test('squad page receives the :id parameter', async () => {
    renderApp('/squads/abc')
    expect(await screen.findByText('abc')).toBeInTheDocument()
  })

  test('unknown paths show a not-found page linking to the Pokédex', async () => {
    renderApp('/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the Pokédex' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  test('navigation works with the keyboard alone', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await screen.findByRole('heading', { name: 'Pokédex' })

    await user.tab() // Pokédex link
    await user.tab() // Squads link
    expect(screen.getByRole('link', { name: 'Squads' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('heading', { level: 1, name: 'Squads' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/squads')
  })
})
