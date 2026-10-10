import type { CSSProperties } from 'react'
import type { PokemonType } from '../data/types'

/** CSS variables for a type's colour pair, used by chips and type toggles. */
export const typeColorStyle = (type: PokemonType) =>
  ({
    '--chip-bg': `var(--color-type-${type})`,
    '--chip-fg': `var(--color-type-${type}-fg)`,
  }) as CSSProperties

export type ButtonVariant = 'outline' | 'primary'

/** Button classes, also used to style links that act as buttons. */
export const buttonClass = (variant: ButtonVariant = 'outline') =>
  `inline-flex items-center justify-center rounded-panel border-[1.5px] px-3.5 py-2.5 text-sm leading-none font-semibold whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
    variant === 'primary'
      ? 'border-ink bg-ink text-panel hover:border-ink-soft hover:bg-ink-soft'
      : 'border-ink bg-panel text-ink hover:bg-paper'
  }`
