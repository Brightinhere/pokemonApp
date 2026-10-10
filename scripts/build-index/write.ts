import { mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { PokemonEntry, TypeChart } from '../../src/data/types'
import { validateIndex, validateTypeChart } from '../../src/data/validate'

/** One entry per line: compact, yet diffs show exactly which Pokémon changed. */
export function serializeIndex(entries: PokemonEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.id - b.id)
  return `[\n${sorted.map((e) => JSON.stringify(e)).join(',\n')}\n]\n`
}

export function serializeTypeChart(chart: TypeChart): string {
  return `${JSON.stringify(chart, null, 2)}\n`
}

export class ValidationError extends Error {
  readonly problems: string[]

  constructor(problems: string[]) {
    super(`Generated data is invalid:\n  ${problems.join('\n  ')}`)
    this.problems = problems
  }
}

/**
 * Validates, then writes both files. Each file is written to a temp path first and renamed
 * into place, so a failure never leaves a half-written or invalid file behind.
 */
export async function writeDatasets(
  paths: { index: string; typeChart: string },
  entries: PokemonEntry[],
  chart: TypeChart,
): Promise<void> {
  const problems = [...validateIndex(entries), ...validateTypeChart(chart)]
  if (problems.length) throw new ValidationError(problems)

  const outputs = [
    [paths.index, serializeIndex(entries)],
    [paths.typeChart, serializeTypeChart(chart)],
  ] as const

  const staged: [string, string][] = []
  for (const [target, content] of outputs) {
    // Stage next to the target so rename() stays on one filesystem.
    const dir = await mkdtemp(join(dirname(target), '.tmp-'))
    const temp = join(dir, 'data.json')
    await writeFile(temp, content)
    staged.push([temp, target])
  }
  try {
    for (const [temp, target] of staged) await rename(temp, target)
  } finally {
    await Promise.all(staged.map(([temp]) => rm(dirname(temp), { recursive: true, force: true })))
  }
}
