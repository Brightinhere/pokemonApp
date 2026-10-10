import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test } from 'vitest'
import { DexNumber, PokemonArt, StatBar, Toggle, TypeChip } from '.'

describe('TypeChip', () => {
  test('shows the capitalized type in its own colour pair', () => {
    render(<TypeChip type="fire" />)
    const chip = screen.getByText('Fire')
    expect(chip.style.getPropertyValue('--chip-bg')).toBe('var(--color-type-fire)')
    expect(chip.style.getPropertyValue('--chip-fg')).toBe('var(--color-type-fire-fg)')
  })
})

describe('DexNumber', () => {
  test.each([
    [6, '#0006'],
    [151, '#0151'],
    [1025, '#1025'],
  ])('%d is shown as %s', (id, text) => {
    render(<DexNumber speciesId={id} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })
})

describe('Toggle', () => {
  function Harness() {
    const [pressed, setPressed] = useState(false)
    return (
      <Toggle pressed={pressed} onPressedChange={setPressed}>
        Mega
      </Toggle>
    )
  }

  test('reports and flips its pressed state, by click and by keyboard', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const toggle = screen.getByRole('button', { name: 'Mega' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    toggle.focus()
    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  test('a type toggle carries its type colours', () => {
    render(
      <Toggle pressed onPressedChange={() => {}} colorType="water">
        Water
      </Toggle>,
    )
    expect(screen.getByRole('button', { name: 'Water' }).style.getPropertyValue('--chip-bg')).toBe(
      'var(--color-type-water)',
    )
  })
})

describe('PokemonArt', () => {
  const url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png'

  test('renders a lazy, fixed-size image', () => {
    render(<PokemonArt src={url} size={56} alt="Charizard" />)
    const img = screen.getByRole('img', { name: 'Charizard' })
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('width', '56')
  })

  test('shows a same-size placeholder when there is no artwork', () => {
    render(<PokemonArt src={null} size={56} />)
    const placeholder = screen.getByTestId('art-placeholder')
    expect(placeholder.style.width).toBe('56px')
    expect(placeholder.style.aspectRatio).toBe('1 / 1')
    expect(placeholder.style.maxWidth).toBe('100%')
  })

  test('falls back to the placeholder when the image fails to load', () => {
    render(<PokemonArt src={url} size={96} alt="Charizard" />)
    fireEvent.error(screen.getByRole('img', { name: 'Charizard' }))
    expect(screen.getByRole('img', { name: 'Charizard' })).toHaveAttribute(
      'data-testid',
      'art-placeholder',
    )
  })
})

describe('StatBar', () => {
  test('fills in proportion and clamps to 100%', () => {
    const { container, rerender } = render(<StatBar value={51} max={255} />)
    expect((container.querySelector('span > span') as HTMLElement).style.width).toBe('20%')
    rerender(<StatBar value={999} max={255} />)
    expect((container.querySelector('span > span') as HTMLElement).style.width).toBe('100%')
  })
})
