# Design

## Context

Greenfield repo: only OpenSpec and Claude Code config exist. See proposal.md for motivation and specs/ for required behavior. This is a learning project, so choices favour mainstream, well-documented tools and small, readable code over cleverness. Later changes (`type-engine`, `pokedex`, `squad-builder`, `recommender`, `deploy-vps`) build directly on the structure set here, and a future Node battle server must be able to reuse `src/engine/`.

Verified facts about the data source (October 2026):
- PokeAPI has 1,025 species, 1,351 `pokemon` resources and 1,579 `pokemon-form` resources.
- The GraphQL endpoint `https://graphql.pokeapi.co/v1beta2` exposes `pokemon` (with types, stats, forms, species, sprites) and `typeefficacy`. Forms carry `is_mega`, `is_battle_only`, `form_name` and `versiongroup.generation_id`.
- `type` contains non-battle entries (`stellar`, `unknown`, `shadow`) alongside the 18 battle types.

## Goals / Non-Goals

**Goals:**
- A scaffold where `npm ci && npm run lint && npm run typecheck && npm test && npm run build` passes locally and in CI.
- A repeatable, validated, deterministic data build producing small JSON files the app loads instantly.
- Hard guard rails that keep `src/engine/` free of UI and browser dependencies.

**Non-Goals:**
- Visual design. Pages are unstyled placeholders apart from theme tokens; the look comes from a `frontend-design` session before `pokedex`.
- A REST-crawl fallback for the data build. It is only a documented contingency (see Risks).
- Persisting the live-data cache across sessions.

## Decisions

### D1. Toolchain versions
Latest stable majors at scaffold time (as installed: Vite 8, React 19, TypeScript 6.0 strict, React Router 8 data router via `createBrowserRouter`, Redux Toolkit 2 + react-redux, Tailwind CSS 4, Vitest 5 with React Testing Library + jsdom), ESLint 9 flat config with typescript-eslint, Prettier. Node 24 LTS pinned in `.nvmrc` and `package.json#engines` (`>=24`); npm as package manager. TypeScript stays on 6.0 rather than 7 because typescript-eslint supports `<6.1`; revisit when it supports 7.
*Why:* current stable majors with the most learning material. *Alternative:* Next.js was rejected (no server needed; static SPA was chosen).

### D2. Directory layout
```
scripts/
  build-index/        data build (fetch -> transform -> validate -> write)
src/
  app/                store.ts, router.tsx, App shell, layout, NotFound
  engine/             pure TS only (empty now except README + index.ts)
  data/               index.json, typechart.json (generated, committed)
                      + types.ts (shared entry/chart types) + validate.ts
  features/           one folder per feature (pokedex, squads, ...), placeholders now
  services/pokeApi.ts RTK Query API slice
  theme/              Tailwind entry CSS with @theme tokens
```
*Why:* feature folders scale with the planned changes; `data/types.ts` and `data/validate.ts` are shared by the build script and the app (and CI) so the contract lives in one place.

### D3. Engine boundary enforced twice
1. ESLint override for `src/engine/**`: `no-restricted-imports` bans `react*`, `@reduxjs/*`, `react-redux`, `react-router*`; `import-x/no-restricted-paths` (eslint-plugin-import-x) bans anything under `src/` outside `src/engine/` and `src/data/types.ts`, resolved by path so it works at any folder depth; `no-restricted-globals` bans `window`, `document`, `localStorage`, `sessionStorage`, `fetch`, `navigator`.
2. A separate `tsconfig.engine.json` covering only `src/engine/**` with `lib: ["ES2023"]` (no DOM), run by `npm run typecheck`.
*Why:* the lint rule catches imports, the DOM-less tsconfig catches accidental browser API use the lint rule misses. *Alternative:* a workspace package now, rejected in exploration as premature; extraction happens when a server exists.

### D4. Data build via GraphQL, in a few paged queries
`npm run data:build` runs `scripts/build-index/main.ts` with `tsx`. It:
1. Queries `pokemon` in pages (e.g. 500 per request) with types, stats, forms (`is_default`, `is_mega`, `is_battle_only`, `form_name`, `versiongroup.generation_id`), species (`generation_id`, `is_legendary`, `is_mythical`, English name), English form names, and sprites.
2. Queries `typeefficacy` joined to type names and keeps only the 18 battle types (ids 1–18), converting `damage_factor` (0/50/100/200) to multipliers.
3. Transforms to the entry shape, validates with `src/data/validate.ts`, sorts by id, serializes with stable key order and a trailing newline.
4. Writes to a temp file then renames over the committed files, only after validation passes.

About 4 HTTP requests per run instead of ~3,000 REST calls. A descriptive `User-Agent`/contact header is sent per PokeAPI fair-use etiquette.

### D5. Classification rules (implemented in the transform, unit-tested on fixtures)
- **Form category**, first match wins: species default `pokemon` -> `default`; default form `is_mega` -> `mega`; `form_name` is `gmax` -> `gmax`; name contains a `-alola`, `-galar`, `-hisui` or `-paldea` token -> `regional`; else `other`.
- **Generation**: the default `pokemon-form`'s `versiongroup.generation_id`, falling back to species `generation_id` if missing.
- **Display name**: English species name for default forms ("Vivillon", not "Meadow Vivillon"); otherwise the English form `pokemon_name` (e.g. "Alolan Vulpix", "Mega Charizard X"), falling back to the species name.
- **Sprite**: official-artwork URL from the sprites JSON, else `front_default`, else null; URLs are kept only if they point at `raw.githubusercontent.com/PokeAPI/sprites`.

### D6. Entry shape (readable keys, not a packed array)
```ts
interface PokemonEntry {
  id: number; speciesId: number; name: string; displayName: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  stats: { hp: number; attack: number; defense: number;
           specialAttack: number; specialDefense: number; speed: number };
  generation: number;
  formCategory: 'default' | 'regional' | 'mega' | 'gmax' | 'other';
  isDefault: boolean; isBattleOnly: boolean;
  isLegendary: boolean; isMythical: boolean;
  sprite: string | null;
}
type TypeChart = Record<PokemonType, Record<PokemonType, 0 | 0.5 | 1 | 2>>; // [attacker][defender]
```
Estimated ~350 KB raw / ~50 KB gzipped for 1,351 entries. *Alternative:* packed arrays would halve the size but hurt readability while learning; not worth it at this size.

### D7. How the app loads the data
`typechart.json` is a static import (tiny). `index.json` is loaded with a dynamic `import()` so Vite emits it as its own chunk, cached independently of app code and not blocking first paint of the shell. A small hook exposes `{ status, entries }`. *Alternative:* `fetch('/data/index.json')` from `public/` would work equally well; dynamic import was chosen for type safety and content-hashed caching.

### D8. Redux store and live data
`configureStore` with the `pokeApi` slice from RTK Query (`createApi`, `fetchBaseQuery` at `https://pokeapi.co/api/v2/`, `keepUnusedDataFor` = 24h so data effectively lives for the session). Foundation defines one endpoint, `getPokemonSpecies(name)`, to prove the caching and error behaviour in tests; feature changes add the rest. Client state slices (squads, filters) arrive with their features.

### D9. Theming with Tailwind 4 tokens
`src/theme/index.css` defines `@theme` tokens: neutral surface/text colours and `--color-type-<type>` (18). Dark values are overridden in `@media (prefers-color-scheme: dark)`, which also gives live switching without JS. Text colour per type label is a paired token (`--color-type-<type>-fg`). A Vitest test parses the CSS tokens and asserts AA contrast for every type in both themes.

### D10. Testing and CI
Vitest with two environments: `node` for `scripts/`, `src/engine/`, `src/data/`; `jsdom` for components (Vitest `projects` config). Live API tests stub `fetch`. GitHub Actions (`.github/workflows/ci.yml`) on every push and PR: `setup-node` from `.nvmrc` with npm cache -> `npm ci` -> `lint` -> `typecheck` -> `test` -> `data:check` (validates the committed JSON, no network) -> `build`.

## Risks / Trade-offs

- [GraphQL endpoint is labelled beta and its schema may change] -> The build fails loudly with validation errors and never overwrites good data; committed JSON keeps the app working. If it breaks permanently, write a throttled REST crawler that feeds the same transform and validator.
- [Classification heuristics misfile an odd form (e.g. a regional name that doesn't follow the suffix pattern)] -> Fixture tests for known edge cases (`darmanitan-galar-zen`, `tauros-paldea-*`, `rotom-*`, `pikachu-*` caps); the category is presentational and can be patched with a small override map.
- [Form `versiongroup` missing for some entries] -> Fall back to species generation (D5); the build logs how many fallbacks were used.
- [Hotlinked GitHub sprites could be rate-limited or moved] -> Sprites are non-critical; UI shows a placeholder on image error (in `pokedex`). Self-hosting sprites can be done during `deploy-vps` if needed.
- [Index size grows with future generations] -> Separate chunk plus gzip keeps it cheap; revisit packing only if it passes ~150 KB gzipped.
