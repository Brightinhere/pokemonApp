# Tasks

## 1. Project scaffold and tooling

- [x] 1.1 Scaffold Vite + React + TypeScript (strict) in the repo root, add `.nvmrc` (Node 24 LTS) and `engines` in `package.json`, `.gitignore` for `node_modules`/`dist`; verify `npm ci && npm run dev` serves the default page
- [x] 1.2 Add dependencies: react-router, @reduxjs/toolkit, react-redux, tailwindcss (+ Vite plugin), vitest, @testing-library/react, @testing-library/jest-dom, jsdom, tsx, eslint (flat config) + typescript-eslint + react-hooks plugin, prettier; verify `npm ci` succeeds from a clean checkout
- [x] 1.3 Configure scripts `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`, `data:build`, `data:check`; verify each script runs (data scripts may be stubs until group 3)
- [x] 1.4 Configure Vitest projects (`node` for `scripts/`, `src/engine/`, `src/data/`; `jsdom` for components) with one trivial test in each; verify `npm test` runs both projects green
- [x] 1.5 Create the directory layout from design D2 (`src/app`, `src/engine`, `src/data`, `src/features`, `src/services`, `src/theme`, `scripts/build-index`); verify `npm run typecheck` passes

## 2. Engine boundary

- [x] 2.1 Add `src/engine/index.ts` (empty export) and `src/engine/README.md` explaining the "pure TS, no UI/browser" rule and why (future battle server reuse)
- [x] 2.2 Add the ESLint override for `src/engine/**` (restricted imports and globals per design D3); verify with a temporary file importing `react` and using `window` that `npm run lint` fails with both errors, then remove it
- [x] 2.3 Add `tsconfig.engine.json` (no DOM lib) and include it in `npm run typecheck`; verify a temporary `document.title` reference in `src/engine/` fails type-check, then remove it

## 3. Data index build

- [x] 3.1 Define `PokemonEntry`, `PokemonType`, `FormCategory` and `TypeChart` in `src/data/types.ts` per design D6
- [x] 3.2 Implement `src/data/validate.ts` checking every requirement in `specs/pokemon-data-index` (fields, 1–2 known types, six non-negative stats, valid category, generation ≥ 1, sprite host, 18×18 chart with allowed multipliers); verify unit tests for valid data and each failure type, with errors naming the offending entry
- [x] 3.3 Implement the GraphQL fetch layer in `scripts/build-index/` (paged `pokemon` query, `typeefficacy` query, User-Agent header, non-zero exit on HTTP/GraphQL errors); verify with a test using a stubbed `fetch` that a GraphQL error response exits non-zero
- [x] 3.4 Implement the transform per design D5 (category, generation fallback, display name, sprite selection, 18-type chart filtering and factor→multiplier); verify fixture tests for `charizard`, `charizard-mega-x`, `charizard-gmax`, `vulpix-alola`, `rotom-wash`, `darmanitan-galar-zen`, `vivillon` and a stellar/unknown type row
- [x] 3.5 Implement the writer: sort by id, stable key order, validate, write to temp then rename, leave existing files untouched on failure; verify a test where validation fails leaves pre-existing files byte-identical
- [x] 3.6 Run `npm run data:build` against live PokeAPI and commit `src/data/index.json` and `src/data/typechart.json`; verify entry count equals PokeAPI's `pokemon` count, the scenario matchups (ground→flying 0, fire→grass 2, dragon→fairy 0) hold, and a second run produces no git diff
- [x] 3.7 Implement `npm run data:check` (validate committed files, no network); verify it passes on the committed data and fails on a hand-corrupted copy
- [x] 3.8 Document the data build in `scripts/build-index/README.md` (what it fetches, when to re-run, how to respond to a schema break); verify the documented command runs as written

## 4. App shell

- [x] 4.1 Create the Redux store with the RTK Query `pokeApi` slice (`getPokemonSpecies`, `keepUnusedDataFor` 24h) and wire the Provider; verify tests with stubbed `fetch` that a repeat query makes one network call and a failed query yields an error state
- [x] 4.2 Create the router (`/`, `/pokemon/:name`, `/squads`, `/squads/:id`, catch-all not-found) with a layout containing keyboard-accessible nav and placeholder pages naming each feature (detail placeholder shows the `:name` param); verify RTL tests for each route, the not-found link to `/`, and nav by keyboard
- [x] 4.3 Add the index loader hook using dynamic `import()` of `index.json` exposing `{ status, entries }` and show the entry count on the Pokédex placeholder; verify a test that it resolves to the expected count and `npm run build` emits the index as a separate chunk
- [x] 4.4 Add Tailwind theme tokens in `src/theme/index.css` (neutral surface/text, 18 `--color-type-*` with paired `-fg` tokens, dark overrides via `prefers-color-scheme`); verify a test that parses the tokens and asserts ≥ 4.5:1 contrast for all 18 types in both themes
- [x] 4.5 Verify deep links: `npm run build && npm run preview`, open `/pokemon/pikachu` directly and refresh, confirm the placeholder renders; toggle the OS colour scheme and confirm the theme switches without reload

## 5. CI and integration

- [x] 5.1 Add `.github/workflows/ci.yml` (push + PR: setup-node from `.nvmrc` with npm cache, `npm ci`, lint, typecheck, test, data:check, build); verify the workflow passes on GitHub after pushing
- [x] 5.2 Write the root `README.md` (what the project is, prerequisites, scripts, project layout, link to the OpenSpec roadmap changes); verify a fresh clone following it reaches a running dev server
- [x] 5.3 Final integration check: from a clean clone with network disabled after `npm ci`, run lint, typecheck, test, data:check and build; verify all pass and no request to `pokeapi.co` is made

## Workflow follow-up

- Archive the change with `/opsx:archive` once all tasks are done and CI is green, so `pokemon-data-index` and `app-shell` become main specs.
- Run a `frontend-design` session before starting the `pokedex` change.
