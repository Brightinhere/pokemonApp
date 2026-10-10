import type { PokemonEntry } from '../../data/types'

export const MAX_GENERATION = 9

export interface RecommendOptions {
  /** Only entries introduced in or before this generation; null = all. */
  maxGeneration: number | null
  includeLegendary: boolean
  includeBattleOnly: boolean
}

export const DEFAULT_RECOMMEND_OPTIONS: RecommendOptions = {
  maxGeneration: null,
  includeLegendary: false,
  includeBattleOnly: false,
}

/** Reads options from the squad page URL; invalid values fall back to the defaults. */
export function parseRecommendOptions(params: URLSearchParams): RecommendOptions {
  const gen = Number(params.get('gen'))
  return {
    maxGeneration: Number.isInteger(gen) && gen >= 1 && gen <= MAX_GENERATION ? gen : null,
    includeLegendary: params.get('legendary') === 'include',
    includeBattleOnly: params.get('battleOnly') === 'include',
  }
}

/** Writes options to URL params, leaving out defaults. */
export function serializeRecommendOptions(options: RecommendOptions): URLSearchParams {
  const params = new URLSearchParams()
  if (options.maxGeneration !== null) params.set('gen', String(options.maxGeneration))
  if (options.includeLegendary) params.set('legendary', 'include')
  if (options.includeBattleOnly) params.set('battleOnly', 'include')
  return params
}

/** The candidate pool for the given options. */
export function filterPool(
  entries: readonly PokemonEntry[],
  options: RecommendOptions,
): PokemonEntry[] {
  return entries.filter(
    (entry) =>
      (options.maxGeneration === null || entry.generation <= options.maxGeneration) &&
      (options.includeLegendary || !(entry.isLegendary || entry.isMythical)) &&
      (options.includeBattleOnly || !entry.isBattleOnly),
  )
}
