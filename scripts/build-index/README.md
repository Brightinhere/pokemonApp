# Data build

Generates the two datasets the app ships with:

| File                      | Contents                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/data/index.json`     | One entry per PokeAPI `pokemon` resource (default, regional, Mega, Gmax and other forms; cosmetic forms excluded), one entry per line. Shape: `PokemonEntry` in `src/data/types.ts`. |
| `src/data/typechart.json` | The 18×18 type chart, `chart[attacker][defender]` = 0, 0.5, 1 or 2.                                                                                                                  |

Both files are **committed**. Installing, testing and building the app never contacts PokeAPI.

## Commands

```sh
npm run data:build   # fetch from PokeAPI, validate, write both files
npm run data:check   # validate the committed files (no network; runs in CI)
```

`data:build` sends about five requests to PokeAPI's GraphQL endpoint
(`https://graphql.pokeapi.co/v1beta2`): a count, three pages of 500 Pokémon, and the type
efficacy table. It validates everything before writing, and writes via temp files, so a failed
run leaves the committed files untouched. Two runs against the same PokeAPI data produce
byte-identical files.

## When to re-run

Only when PokeAPI gains new data you want, typically after a new game or generation is
released. Review the diff (one line per Pokémon makes it readable), then commit.

## How the data is shaped

The transform rules (form category, generation, display name, sprite choice) live in
`transform.ts` and are covered by fixture tests in `transform.test.ts`. In short:

- **Form category**: default → `mega` (form `is_mega`) → `gmax` → `regional`
  (`-alola`/`-galar`/`-hisui`/`-paldea` in the name) → `other`.
- **Generation**: the generation the form was introduced in; falls back to the species
  generation when PokeAPI has none (the build logs which entries).
- **Sprites**: official artwork, else the front sprite, only from the PokeAPI sprites repo on
  GitHub.

## If the build breaks

The GraphQL endpoint is labelled beta, so its schema can change. A failing build prints the
GraphQL or validation error and exits non-zero; the app keeps working on the committed data.

1. Read the error. `field 'x' not found` means a renamed field: introspect it with
   `{ __type(name: "<type>") { fields { name } } }` and update `queries.ts`.
2. If validation fails, the message names the entry and field. Fix the transform or add a
   case to the fixtures.
3. If the endpoint disappears for good, write a throttled REST crawler that produces the same
   `RawPokemon` shape. `transform.ts`, `write.ts` and the validator stay unchanged.
