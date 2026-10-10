import type { PokemonEntry } from '../data/types'

/** `fire` -> `Fire`. */
export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

/** Species dex number as shown everywhere: `#0006`. */
export const formatDexNumber = (speciesId: number) => `#${String(speciesId).padStart(4, '0')}`

/** "Battle-only Mega form", "Regional form", ... or null for default forms. */
export function formLabel(entry: PokemonEntry): string | null {
  if (entry.isDefault) return null
  const kind = {
    regional: 'Regional form',
    mega: 'Mega form',
    gmax: 'Gigantamax form',
    other: 'Alternate form',
    default: 'Form',
  }[entry.formCategory]
  return entry.isBattleOnly ? `Battle-only ${kind.charAt(0).toLowerCase()}${kind.slice(1)}` : kind
}
