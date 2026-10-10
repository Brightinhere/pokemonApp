import { readFile } from 'node:fs/promises'
import { validateIndex, validateTypeChart } from '../../src/data/validate'
import { DEFAULT_PATHS } from './build'

/** Validates the committed datasets without touching the network. */
export async function check(paths = DEFAULT_PATHS): Promise<string[]> {
  const read = async (path: string) => JSON.parse(await readFile(path, 'utf8')) as unknown
  try {
    return [
      ...validateIndex(await read(paths.index)),
      ...validateTypeChart(await read(paths.typeChart)),
    ]
  } catch (error) {
    return [(error as Error).message]
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = await check()
  if (problems.length) {
    console.error(`data:check failed:\n  ${problems.join('\n  ')}`)
    process.exitCode = 1
  } else {
    console.log('data:check passed')
  }
}
