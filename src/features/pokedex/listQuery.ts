import {
  POKEMON_TYPES,
  type BaseStats,
  type PokemonEntry,
  type PokemonType,
} from '../../data/types'

/** Form categories that can be added to the list as rows (default forms always are). */
export const FORM_TOGGLES = ['regional', 'mega', 'gmax', 'other'] as const
export type FormToggle = (typeof FORM_TOGGLES)[number]

export const STAT_SORTS = [
  'hp',
  'attack',
  'defense',
  'specialAttack',
  'specialDefense',
  'speed',
] as const satisfies readonly (keyof BaseStats)[]
export const SORTS = ['number', 'name', 'total', ...STAT_SORTS] as const
export type Sort = (typeof SORTS)[number]

export const MAX_GENERATION = 9
export const MAX_TYPES = 2

export interface ListQuery {
  search: string
  types: PokemonType[]
  /** Only entries introduced in or before this generation; null = all. */
  maxGeneration: number | null
  forms: FormToggle[]
  includeLegendary: boolean
  sort: Sort
}

export const DEFAULT_QUERY: ListQuery = {
  search: '',
  types: [],
  maxGeneration: null,
  forms: [],
  includeLegendary: true,
  sort: 'number',
}

const pickKnown = <T extends string>(raw: string | null, known: readonly T[]): T[] => {
  const seen = new Set<T>()
  for (const part of (raw ?? '').split(',')) {
    if ((known as readonly string[]).includes(part)) seen.add(part as T)
  }
  return [...seen]
}

/** Reads list state from the URL; unknown or invalid values fall back to defaults. */
export function parseListQuery(params: URLSearchParams): ListQuery {
  const gen = Number(params.get('gen'))
  const sort = params.get('sort')
  return {
    search: params.get('q')?.trim() ?? '',
    types: pickKnown(params.get('types'), POKEMON_TYPES).slice(0, MAX_TYPES),
    maxGeneration: Number.isInteger(gen) && gen >= 1 && gen <= MAX_GENERATION ? gen : null,
    // Keep the canonical order so equal states produce equal URLs.
    forms: FORM_TOGGLES.filter((form) =>
      pickKnown(params.get('forms'), FORM_TOGGLES).includes(form),
    ),
    includeLegendary: params.get('legendary') !== 'exclude',
    sort: (SORTS as readonly string[]).includes(sort ?? '') ? (sort as Sort) : 'number',
  }
}

/** Writes list state to URL params, leaving out everything that equals its default. */
export function serializeListQuery(query: ListQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.search.trim()) params.set('q', query.search.trim())
  if (query.types.length) params.set('types', query.types.slice(0, MAX_TYPES).join(','))
  if (query.maxGeneration !== null) params.set('gen', String(query.maxGeneration))
  const forms = FORM_TOGGLES.filter((form) => query.forms.includes(form))
  if (forms.length) params.set('forms', forms.join(','))
  if (!query.includeLegendary) params.set('legendary', 'exclude')
  if (query.sort !== 'number') params.set('sort', query.sort)
  return params
}

/** Lowercase, no accents, letters and digits only: "Flabébé" -> "flabebe", "Mr. Mime" -> "mrmime". */
export const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const total = (stats: BaseStats) =>
  stats.hp + stats.attack + stats.defense + stats.specialAttack + stats.specialDefense + stats.speed

const byNumber = (a: PokemonEntry, b: PokemonEntry) =>
  a.speciesId - b.speciesId || Number(b.isDefault) - Number(a.isDefault) || a.id - b.id

const byNumberThenId = (a: PokemonEntry, b: PokemonEntry) =>
  a.speciesId - b.speciesId || a.id - b.id

function matchesSearch(search: string) {
  const numeric = /^#?(\d+)$/.exec(search.trim())
  if (numeric) {
    const number = Number(numeric[1])
    return (entry: PokemonEntry) => entry.speciesId === number
  }
  const needle = normalize(search)
  if (!needle) return () => true
  return (entry: PokemonEntry) =>
    normalize(entry.displayName).includes(needle) || normalize(entry.name).includes(needle)
}

/** Searches, filters and sorts the index. Returns a new array; `entries` is not modified. */
export function applyListQuery(entries: readonly PokemonEntry[], query: ListQuery): PokemonEntry[] {
  const search = matchesSearch(query.search)
  const forms = new Set<string>(query.forms)

  const result = entries.filter(
    (entry) =>
      (entry.isDefault || forms.has(entry.formCategory)) &&
      search(entry) &&
      query.types.every((type) => entry.types.includes(type)) &&
      (query.maxGeneration === null || entry.generation <= query.maxGeneration) &&
      (query.includeLegendary || !(entry.isLegendary || entry.isMythical)),
  )

  const { sort } = query
  if (sort === 'number') return result.sort(byNumber)
  if (sort === 'name') {
    return result.sort(
      (a, b) => a.displayName.localeCompare(b.displayName, 'en') || byNumberThenId(a, b),
    )
  }
  const value =
    sort === 'total' ? (e: PokemonEntry) => total(e.stats) : (e: PokemonEntry) => e.stats[sort]
  return result.sort((a, b) => value(b) - value(a) || byNumberThenId(a, b))
}

export const baseStatTotal = total
