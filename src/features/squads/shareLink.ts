import type { PokemonEntry } from '../../data/types'
import { MAX_MEMBERS } from './squadRules'

export const SHARE_PATH = '/squad'

/** `m=6,10034,94&n=Kanto+run`: commas stay literal so links are readable. */
export function buildShareQuery(name: string, memberIds: readonly number[]): string {
  return new URLSearchParams({ m: memberIds.join(','), n: name }).toString().replace(/%2C/g, ',')
}

export const buildSharePath = (name: string, memberIds: readonly number[]) =>
  `${SHARE_PATH}?${buildShareQuery(name, memberIds)}`

export interface ParsedShare {
  name: string | null
  members: PokemonEntry[]
  /** True when some ids were invalid, unknown or beyond the sixth. */
  dropped: boolean
}

export function parseShareQuery(
  params: URLSearchParams,
  byId: ReadonlyMap<number, PokemonEntry>,
): ParsedShare {
  const parts = (params.get('m') ?? '').split(',').filter((part) => part !== '')
  const valid = parts
    .filter((part) => /^\d+$/.test(part))
    .map(Number)
    .map((id) => byId.get(id))
    .filter((entry): entry is PokemonEntry => entry !== undefined)
  const members = valid.slice(0, MAX_MEMBERS)
  const name = params.get('n')?.trim() || null
  return { name, members, dropped: members.length !== parts.length }
}
