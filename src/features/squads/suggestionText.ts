import type { PokemonType } from '../../data/types'
import type { ScoreParts, Suggestion } from '../../engine'
import { capitalize } from '../../ui'

/** "Rock", "Rock and Ice", "Rock, Ice and Water", "Rock, Ice, Water and 2 more". */
function typeList(types: readonly PokemonType[]) {
  const names = types.map(capitalize)
  if (names.length > 3) return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
  if (names.length === 1) return names[0]!
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** One plain sentence per reason, in order of importance. */
export function reasonSentences(suggestion: Suggestion, replacing: boolean): string[] {
  const { fixes, resists, covers, newProblems, losesCoverage } = suggestion.reasons
  const sentences: string[] = []
  if (fixes.length) sentences.push(`Fixes the ${typeList(fixes)} problem.`)
  const resistsOnly = resists.filter((t) => !fixes.includes(t))
  if (resistsOnly.length)
    sentences.push(`Takes hits from ${typeList(resistsOnly)} that the squad is weak to.`)
  if (covers.length) sentences.push(`Adds attack coverage against ${typeList(covers)}.`)
  if (replacing && newProblems.length)
    sentences.push(`Creates a problem with ${typeList(newProblems)}.`)
  if (replacing && losesCoverage.length)
    sentences.push(`Loses attack coverage against ${typeList(losesCoverage)}.`)
  return sentences
}

export const effectLabel = (gain: number) =>
  gain > 0 ? 'Improves the squad' : gain === 0 ? 'About the same' : 'Weaker overall'

/** "+19", "0", "−3" (with a real minus sign). */
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `\u2212${-n}` : '0')

/** "Defense +19 · Attack 0": the gain split into its two parts. */
export const breakdownText = ({ defense, attack }: ScoreParts) =>
  `Defense ${signed(defense)} · Attack ${signed(attack)}`
