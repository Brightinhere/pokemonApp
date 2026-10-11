import { describe, expect, test } from 'vitest'
import { breakdownText } from './suggestionText'

describe('breakdownText', () => {
  test('signs positive parts and leaves zero bare', () => {
    expect(breakdownText({ defense: 19, attack: 0 })).toBe('Defense +19 · Attack 0')
  })

  test('negative parts use a real minus sign', () => {
    expect(breakdownText({ defense: -4, attack: 2 })).toBe('Defense −4 · Attack +2')
  })
})
