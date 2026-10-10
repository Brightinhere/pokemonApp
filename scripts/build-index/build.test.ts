import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, test } from 'vitest'
import { POKEMON_TYPES } from '../../src/data/types'
import { run } from './build'
import { check } from './check'
import * as f from './fixtures'
import type { FetchFn } from './graphql'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const pokemon = [f.charizard, f.charizardMegaX, f.vulpixAlola]
const typeRows = POKEMON_TYPES.flatMap((a, i) =>
  POKEMON_TYPES.map((d, j) => f.efficacy([i + 1, a], [j + 1, d], 100)),
)

/** A fake PokeAPI GraphQL endpoint that answers by query shape. */
const fakeApi =
  (data = { pokemon, typeRows }): FetchFn =>
  async (_url, init) => {
    const { query } = JSON.parse(init!.body as string) as { query: string }
    if (query.includes('pokemon_aggregate')) {
      return json({ data: { pokemon_aggregate: { aggregate: { count: data.pokemon.length } } } })
    }
    if (query.includes('typeefficacy')) return json({ data: { typeefficacy: data.typeRows } })
    return json({ data: { pokemon: data.pokemon } })
  }

let dir: string
let paths: { index: string; typeChart: string }
const ORIGINAL = '{"original":true}\n'

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'data-build-'))
  paths = { index: join(dir, 'index.json'), typeChart: join(dir, 'typechart.json') }
  await writeFile(paths.index, ORIGINAL)
  await writeFile(paths.typeChart, ORIGINAL)
})

const silent = () => {}
const unchanged = async () => {
  expect(await readFile(paths.index, 'utf8')).toBe(ORIGINAL)
  expect(await readFile(paths.typeChart, 'utf8')).toBe(ORIGINAL)
  expect(await readdir(dir)).toEqual(['index.json', 'typechart.json'])
}

describe('run', () => {
  test('writes valid, deterministic datasets', async () => {
    expect(await run({ fetchFn: fakeApi(), paths, log: silent })).toBe(0)
    const first = await readFile(paths.index, 'utf8')
    expect(await check(paths)).toEqual([])
    expect(first.split('\n')).toHaveLength(pokemon.length + 3) // [, entries, ], trailing newline

    expect(await run({ fetchFn: fakeApi(), paths, log: silent })).toBe(0)
    expect(await readFile(paths.index, 'utf8')).toBe(first)
    expect(await readdir(dir)).toEqual(['index.json', 'typechart.json'])
  })

  test('exits non-zero on a GraphQL error and leaves files unchanged', async () => {
    const messages: string[] = []
    const fetchFn: FetchFn = async () => json({ errors: [{ message: "field 'x' not found" }] })
    expect(await run({ fetchFn, paths, log: (m) => messages.push(m) })).toBe(1)
    expect(messages.join()).toContain("field 'x' not found")
    await unchanged()
  })

  test('exits non-zero when PokeAPI is unreachable', async () => {
    const fetchFn: FetchFn = async () => {
      throw new TypeError('fetch failed')
    }
    expect(await run({ fetchFn, paths, log: silent })).toBe(1)
    await unchanged()
  })

  test('exits non-zero on HTTP errors', async () => {
    expect(await run({ fetchFn: async () => json({}, 503), paths, log: silent })).toBe(1)
    await unchanged()
  })

  test('names the offending entry and leaves files unchanged when validation fails', async () => {
    const typeless = { ...f.vulpixAlola, pokemontypes: [] }
    const messages: string[] = []
    const fetchFn = fakeApi({ pokemon: [f.charizard, typeless], typeRows })
    expect(await run({ fetchFn, paths, log: (m) => messages.push(m) })).toBe(1)
    expect(messages.join()).toContain('entry vulpix-alola: must have one or two types')
    await unchanged()
  })
})

describe('check', () => {
  test('fails on a corrupted file', async () => {
    await run({ fetchFn: fakeApi(), paths, log: silent })
    await writeFile(
      paths.index,
      (await readFile(paths.index, 'utf8')).replace('"fire"', '"stellar"'),
    )
    expect((await check(paths)).join()).toContain('unknown type')
  })

  test('fails on unparsable JSON', async () => {
    await writeFile(paths.index, '{nope')
    expect(await check(paths)).toHaveLength(1)
  })
})
