import type { PokemonEntry } from '../../data/types'

export const MAX_MEMBERS = 6
export const MAX_NAME_LENGTH = 40

/** "Squad N" with the lowest N not already taken by a squad of that exact name. */
export function nextSquadName(existingNames: readonly string[]): string {
  const taken = new Set(existingNames)
  for (let n = 1; ; n++) {
    if (!taken.has(`Squad ${n}`)) return `Squad ${n}`
  }
}

/** Trimmed name, or null when it is empty or too long. */
export function normalizeName(name: string): string | null {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= MAX_NAME_LENGTH ? trimmed : null
}

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'

/** 10 random url-safe characters (~60 bits), regenerated if it clashes with `taken`. */
export function newSquadId(taken: Iterable<string> = []): string {
  const used = new Set(taken)
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(10))
    const id = Array.from(bytes, (b) => ID_ALPHABET[b % 64]).join('')
    if (!used.has(id)) return id
  }
}

export type SquadWarning =
  { kind: 'duplicate-species'; speciesName: string } | { kind: 'multiple-megas'; count: number }

/** Soft warnings: they inform, never block. `speciesName` resolves a species id to its name. */
export function warningsFor(
  members: readonly PokemonEntry[],
  speciesName: (speciesId: number) => string,
): SquadWarning[] {
  const warnings: SquadWarning[] = []
  const seen = new Map<number, number>()
  for (const member of members) seen.set(member.speciesId, (seen.get(member.speciesId) ?? 0) + 1)
  for (const [speciesId, count] of seen) {
    if (count > 1) warnings.push({ kind: 'duplicate-species', speciesName: speciesName(speciesId) })
  }
  const megas = members.filter((member) => member.formCategory === 'mega').length
  if (megas > 1) warnings.push({ kind: 'multiple-megas', count: megas })
  return warnings
}
