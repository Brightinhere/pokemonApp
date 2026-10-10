import { describe, expect, test } from 'vitest'
import { POKEMON_TYPES } from '../data/types'
import { contrastRatio } from './contrast'
import css from './index.css?raw'

/** Collects `--name: #hex;` declarations from one CSS block. */
function tokens(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1]!, m[2]!]),
  )
}

const lightBlock = css.slice(css.indexOf('@theme'), css.indexOf('@media'))
const darkBlock = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))
const themes = { light: tokens(lightBlock), dark: tokens(darkBlock) }

describe.each(Object.entries(themes))('%s theme', (_, theme) => {
  test.each(POKEMON_TYPES)('%s label has at least 4.5:1 contrast', (type) => {
    const background = theme[`color-type-${type}`]
    const foreground = theme[`color-type-${type}-fg`]
    expect(background, `missing --color-type-${type}`).toBeDefined()
    expect(foreground, `missing --color-type-${type}-fg`).toBeDefined()
    expect(contrastRatio(background!, foreground!)).toBeGreaterThanOrEqual(4.5)
  })

  test('type colours are distinct', () => {
    const colours = POKEMON_TYPES.map((type) => theme[`color-type-${type}`])
    expect(new Set(colours).size).toBe(POKEMON_TYPES.length)
  })

  test.each([
    ['ink', 'paper'],
    ['ink', 'panel'],
    ['ink-soft', 'paper'],
    ['ink-soft', 'panel'],
  ])('%s text on %s has at least 4.5:1 contrast', (text, background) => {
    expect(
      contrastRatio(theme[`color-${text}`]!, theme[`color-${background}`]!),
    ).toBeGreaterThanOrEqual(4.5)
  })

  test('rule-strong is visible against panel (3:1 for UI boundaries)', () => {
    expect(
      contrastRatio(theme['color-rule-strong']!, theme['color-panel']!),
    ).toBeGreaterThanOrEqual(3)
  })
})

test('contrastRatio matches known WCAG values', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21)
  expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
})

test('the interface has no accent colour: colour belongs to the Pokémon', () => {
  expect(css).not.toMatch(/--color-accent/)
  const chromeTokens = Object.keys(themes.light).filter((name) => !name.startsWith('color-type-'))
  expect(chromeTokens.sort()).toEqual(
    [
      'color-ink',
      'color-ink-soft',
      'color-panel',
      'color-paper',
      'color-rule',
      'color-rule-strong',
    ].sort(),
  )
})
