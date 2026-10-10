/**
 * Pure helpers that turn PokeAPI responses into the small shapes the detail page renders.
 * Only the fields used here are typed.
 */

interface NamedResource {
  name: string
  url: string
}

interface Localized {
  language: NamedResource
}

export interface RawPokemon {
  name: string
  abilities: { ability: NamedResource; is_hidden: boolean; slot: number }[]
  forms: NamedResource[]
}

export interface RawSpecies {
  flavor_text_entries: (Localized & { flavor_text: string })[]
  evolution_chain: { url: string } | null
}

export interface RawEvolutionDetail {
  trigger: NamedResource
  is_default?: boolean
  [condition: string]: unknown
}

export interface RawChainLink {
  species: NamedResource
  evolution_details: RawEvolutionDetail[]
  evolves_to: RawChainLink[]
}

export interface RawEvolutionChain {
  chain: RawChainLink
}

export interface RawAbility {
  name: string
  names: (Localized & { name: string })[]
  effect_entries: (Localized & { short_effect: string })[]
  flavor_text_entries: (Localized & { flavor_text: string })[]
}

export interface RawPokemonForm {
  name: string
  form_names: (Localized & { name: string })[]
  sprites: { front_default: string | null }
}

export interface PokemonLiveData {
  abilities: { name: string; isHidden: boolean }[]
  /** Cosmetic form slugs (first is the default look), empty when there is only one. */
  cosmeticForms: string[]
}

export interface SpeciesLiveData {
  flavorText: string | null
  evolutionChainId: number | null
}

export interface EvolutionNode {
  speciesId: number
  /** Species slug, e.g. `charmeleon`. */
  speciesName: string
  /** How this stage is reached; null for the first stage. */
  condition: string | null
  children: EvolutionNode[]
}

export interface AbilityLiveData {
  displayName: string
  description: string | null
}

export interface FormLiveData {
  displayName: string
  sprite: string | null
}

/** `water-stone` -> `Water Stone`. */
export const titleCase = (slug: string) =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/** The last English entry: PokeAPI lists entries oldest game first. */
export const pickEnglish = <T extends Localized>(entries: readonly T[]): T | undefined =>
  entries.findLast((entry) => entry.language.name === 'en')

/** Game text uses line breaks, form feeds and soft hyphens for its text boxes. */
export const cleanFlavorText = (text: string) =>
  text
    .replace(/\u00ad\s*/g, '') // soft hyphens join words split across lines
    .replace(/\s+/g, ' ') // \s covers \n and form feeds
    .trim()

/** Trailing number of a PokeAPI resource URL: `.../evolution-chain/2/` -> 2. */
export const idFromUrl = (url: string) => Number(/\/(\d+)\/?$/.exec(url)?.[1] ?? NaN)

/** `vivillon-icy-snow` (of `vivillon`) -> `Icy Snow`. */
export const cosmeticFormLabel = (formSlug: string, pokemonSlug: string) =>
  titleCase(
    formSlug.startsWith(`${pokemonSlug}-`) ? formSlug.slice(pokemonSlug.length + 1) : formSlug,
  )

// Fields that never describe a condition the player has to meet.
const IGNORED_FIELDS = new Set(['trigger', 'is_default', 'version_group', 'required_pokemon_form'])
const HANDLED_FIELDS = new Set([
  'min_level',
  'item',
  'held_item',
  'min_happiness',
  'min_affection',
  'time_of_day',
  'known_move_type',
  'near_special_rock',
  'location',
])

const isSet = (value: unknown) =>
  value !== null && value !== undefined && value !== '' && value !== false

const resourceName = (value: unknown) => titleCase((value as NamedResource).name)

/** Prefer the entry PokeAPI marks as default, otherwise the most recent game's. */
export const pickEvolutionDetail = (details: readonly RawEvolutionDetail[]) =>
  details.find((detail) => detail.is_default) ?? details.at(-1)

/** A short, player-facing description of how an evolution happens. */
export function formatEvolutionCondition(detail: RawEvolutionDetail | undefined): string {
  if (!detail) return 'Special condition'
  const set = Object.entries(detail).filter(
    ([key, value]) => !IGNORED_FIELDS.has(key) && isSet(value),
  )
  if (set.some(([key]) => !HANDLED_FIELDS.has(key))) return 'Special condition'
  const has = (key: string) => set.some(([k]) => k === key)

  switch (detail.trigger.name) {
    case 'use-item':
      return has('item') && set.length === 1 ? resourceName(detail.item) : 'Special condition'
    case 'trade':
      if (set.length === 0) return 'Trade'
      return has('held_item') && set.length === 1
        ? `Trade holding ${resourceName(detail.held_item)}`
        : 'Special condition'
    case 'level-up': {
      // A location without a special rock is game-specific: too much for a one-liner.
      if (has('location') && !has('near_special_rock')) return 'Special condition'
      const parts: string[] = []
      if (has('min_level')) parts.push(`Level ${detail.min_level as number}`)
      if (has('min_happiness') || has('min_affection')) parts.push('Friendship')
      if (has('known_move_type'))
        parts.push(`knowing a ${resourceName(detail.known_move_type)} move`)
      if (has('held_item')) parts.push(`holding ${resourceName(detail.held_item)}`)
      if (has('near_special_rock')) parts.push('near a special rock')
      if (detail.time_of_day === 'day') parts.push('during the day')
      if (detail.time_of_day === 'night') parts.push('at night')
      if (has('item')) return 'Special condition'
      if (parts.length === 0) return 'Level up'
      const text = parts.join(', ')
      return parts[0]!.startsWith('Level') || parts[0] === 'Friendship' ? text : `Level up ${text}`
    }
    default:
      return 'Special condition'
  }
}

export function toEvolutionTree(link: RawChainLink, isRoot = true): EvolutionNode {
  return {
    speciesId: idFromUrl(link.species.url),
    speciesName: link.species.name,
    condition: isRoot
      ? null
      : formatEvolutionCondition(pickEvolutionDetail(link.evolution_details)),
    children: link.evolves_to.map((child) => toEvolutionTree(child, false)),
  }
}

export const shapePokemon = (raw: RawPokemon): PokemonLiveData => ({
  abilities: raw.abilities.map(({ ability, is_hidden }) => ({
    name: ability.name,
    isHidden: is_hidden,
  })),
  cosmeticForms: raw.forms.length > 1 ? raw.forms.map((form) => form.name) : [],
})

export const shapeSpecies = (raw: RawSpecies): SpeciesLiveData => {
  const flavor = pickEnglish(raw.flavor_text_entries)
  return {
    flavorText: flavor ? cleanFlavorText(flavor.flavor_text) : null,
    evolutionChainId: raw.evolution_chain ? idFromUrl(raw.evolution_chain.url) : null,
  }
}

export const shapeAbility = (raw: RawAbility): AbilityLiveData => {
  const flavor = pickEnglish(raw.flavor_text_entries)
  const effect = pickEnglish(raw.effect_entries)
  return {
    displayName: pickEnglish(raw.names)?.name ?? titleCase(raw.name),
    description: flavor
      ? cleanFlavorText(flavor.flavor_text)
      : effect
        ? cleanFlavorText(effect.short_effect)
        : null,
  }
}

export const shapePokemonForm = (raw: RawPokemonForm): FormLiveData => ({
  displayName: pickEnglish(raw.form_names)?.name ?? titleCase(raw.name),
  sprite: raw.sprites.front_default,
})
