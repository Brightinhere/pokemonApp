import type { ButtonHTMLAttributes } from 'react'
import type { PokemonType } from '../data/types'
import { typeColorStyle } from './styles'

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  /** Colour the pressed state as this type (type filters). */
  colorType?: PokemonType
}

/** A two-state button: announces its state via `aria-pressed`. */
export function Toggle({
  pressed,
  onPressedChange,
  colorType,
  className = '',
  style,
  ...props
}: ToggleProps) {
  const pressedClass = colorType
    ? 'border-ink bg-(--chip-bg) text-(--chip-fg) shadow-[0_0_0_1.5px_var(--color-ink)]'
    : 'border-ink bg-ink text-panel'
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      style={colorType ? { ...typeColorStyle(colorType), ...style } : style}
      className={`cursor-pointer rounded-chip border-[1.5px] px-2.5 py-1.5 text-sm leading-none font-semibold font-stretch-condensed disabled:cursor-not-allowed disabled:opacity-40 ${
        pressed ? pressedClass : 'border-rule-strong bg-transparent text-ink'
      } ${className}`}
      {...props}
    />
  )
}
