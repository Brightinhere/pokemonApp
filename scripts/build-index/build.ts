import { fileURLToPath } from 'node:url'
import type { FetchFn } from './graphql'
import { fetchAllPokemon, fetchPokemonCount, fetchTypeEfficacy } from './queries'
import { toEntry, toTypeChart, type TransformReport } from './transform'
import { writeDatasets } from './write'

const dataDir = fileURLToPath(new URL('../../src/data/', import.meta.url))

export const DEFAULT_PATHS = {
  index: `${dataDir}index.json`,
  typeChart: `${dataDir}typechart.json`,
}

interface RunOptions {
  fetchFn?: FetchFn
  paths?: { index: string; typeChart: string }
  log?: (message: string) => void
}

/** Fetches, transforms, validates and writes the datasets. Returns a process exit code. */
export async function run({
  fetchFn,
  paths = DEFAULT_PATHS,
  log = console.log,
}: RunOptions = {}): Promise<number> {
  try {
    const expectedCount = await fetchPokemonCount(fetchFn)
    const rawPokemon = await fetchAllPokemon(fetchFn)
    if (rawPokemon.length !== expectedCount) {
      throw new Error(`Fetched ${rawPokemon.length} Pokémon but PokeAPI reports ${expectedCount}`)
    }
    const report: TransformReport = { generationFallbacks: [] }
    const entries = rawPokemon.map((raw) => toEntry(raw, report))
    const chart = toTypeChart(await fetchTypeEfficacy(fetchFn))

    await writeDatasets(paths, entries, chart)

    log(`Wrote ${entries.length} entries to ${paths.index}`)
    log(`Wrote 18x18 type chart to ${paths.typeChart}`)
    if (report.generationFallbacks.length) {
      log(
        `Generation fell back to species for ${report.generationFallbacks.length} entries: ` +
          report.generationFallbacks.join(', '),
      )
    }
    return 0
  } catch (error) {
    log(`data:build failed; existing files were left unchanged.\n${(error as Error).message}`)
    return 1
  }
}
