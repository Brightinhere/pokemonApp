import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderApp } from '../test/renderApp'

// Detail pages load live data; keep these routing tests offline.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('routes', () => {
  test.each([
    ['/', 'Pokédex'],
    ['/pokemon/pikachu', 'Pikachu'],
    ['/squads', 'Squads'],
    ['/squads/abc', 'Squad not found'],
    ['/squad?m=6,94', 'Shared squad'],
  ])('%s renders its page inside the app frame', async (path, heading) => {
    renderApp(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  test('detail page receives the :name parameter', async () => {
    renderApp('/pokemon/vulpix-alola')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Alolan Vulpix' }),
    ).toBeInTheDocument()
  })

  test('the Pokédex nav item stays current on detail pages', async () => {
    renderApp('/pokemon/vulpix-alola')
    await screen.findByRole('heading', { level: 1, name: 'Alolan Vulpix' })
    expect(screen.getByRole('link', { name: 'Pokédex' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Squads' })).not.toHaveAttribute('aria-current')
  })

  test('squad page receives the :id parameter', async () => {
    renderApp('/squads/k', {
      squads: {
        squads: [{ id: 'k', name: 'Kanto run', members: [], updatedAt: 1 }],
        currentId: 'k',
      },
    })
    expect(await screen.findByRole('heading', { level: 1, name: 'Kanto run' })).toBeInTheDocument()
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
