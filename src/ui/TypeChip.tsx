import type { PokemonType } from '../data/types'
import { capitalize } from './format'
import { typeColorStyle } from './styles'

export function TypeChip({ type, size = 'md' }: { type: PokemonType; size?: 'md' | 'lg' }) {
  return (
    <span
      style={typeColorStyle(type)}
      className={`inline-block rounded-chip bg-(--chip-bg) leading-none font-semibold whitespace-nowrap text-(--chip-fg) font-stretch-condensed ${
        size === 'lg' ? 'px-3 pt-[7px] pb-2 text-base' : 'px-2 pt-[5px] pb-1.5 text-sm'
      }`}
    >
      {capitalize(type)}
    </span>
  )
}

export function TypeList({ types, size }: { types: readonly PokemonType[]; size?: 'md' | 'lg' }) {
  return (
    <span className="flex flex-wrap gap-1">
      {types.map((type) => (
        <TypeChip key={type} type={type} size={size} />
      ))}
    </span>
  )
}
