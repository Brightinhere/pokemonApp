# Pokémon Squad Lab

A Pokémon companion tool: browse the Pokédex, look up any Pokémon, build squads, see their type
strengths and weaknesses, and get suggestions for what to add or swap. Built with React and
[PokeAPI](https://pokeapi.co/) as a learning project.

> Status: the **Pokédex**, **squads** and **suggestions** work. Browse and search every Pokémon and
> battle-relevant form, open detail pages, and build squads of up to six. Each squad gets a matchup
> sheet, its problem types and its attack coverage, and can be shared as a link. From three members,
> "Complete your squad" suggests type combinations that fix its weak spots. On a full squad, "Find a
> replacement" suggests what could take a member's place. Squads are saved in your browser.

## Prerequisites

- Node.js 24 LTS or newer (`nvm use` picks up `.nvmrc`)
- npm

## Getting started

```sh
npm ci
npm run dev        # http://localhost:5173
```

## Scripts

| Script                                    | What it does                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run dev`                             | Dev server with hot reload                                                                                |
| `npm run build`                           | Type-check and build the static site into `dist/`                                                         |
| `npm run preview`                         | Serve `dist/` locally (with SPA fallback, so deep links work)                                             |
| `npm run lint`                            | ESLint, including the engine boundary rules                                                               |
| `npm run typecheck`                       | TypeScript for app, engine (no DOM) and tooling                                                           |
| `npm test` / `npm run test:watch`         | Vitest (node + jsdom projects)                                                                            |
| `npm run format` / `npm run format:check` | Prettier                                                                                                  |
| `npm run data:build`                      | Regenerate the Pokémon data from PokeAPI (rarely; see below)                                              |
| `npm run data:check`                      | Validate the committed data files (no network)                                                            |
| `npm run e2e`                             | Playwright end-to-end smoke tests (builds and serves the app; run `npx playwright install chromium` once) |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, data:check, build and the e2e tests on
every pull request and on pushes to `main`.

## Project layout

```
scripts/build-index/  data build: PokeAPI GraphQL -> validated JSON (see its README)
src/
  app/                store, routes, layout, not-found page
  data/               index.json + typechart.json (generated, committed), types, validator
  engine/             pure TypeScript logic, no React/browser APIs (see its README)
  features/           one folder per feature (pokedex, pokemon-detail, squads)
e2e/                  Playwright smoke tests (PokeAPI and sprites mocked)
  ui/                 shared building blocks: type chips, buttons, toggles, artwork, stat bars
  services/           RTK Query client for live PokeAPI data
  theme/              Tailwind tokens: paper, panel, ink, rules, 18 type colours, light/dark
design/               design direction (README) and the static prototype
openspec/             specs and planned changes
```

## Data

The Pokémon list, types, stats and type chart ship with the app as committed JSON, so the app is
fast, works offline, and does not load PokeAPI. Only detail data (evolutions, flavor text, …) is
fetched live and cached for the session. See [`scripts/build-index/README.md`](scripts/build-index/README.md)
for how the data is built and when to rebuild it.

## Roadmap

Planned as [OpenSpec](https://github.com/Fission-AI/OpenSpec) changes in `openspec/changes/`:

1. `foundation` — scaffold, tooling, data index (done)
2. `type-engine` — type effectiveness for Pokémon and squads (done)
3. `pokedex` — list, search, filters, detail page (done)
4. `squad-builder` — squads, analysis, share links (done)
5. `recommender` — add/swap suggestions (done)
6. `deploy-vps` — Docker + Caddy self-hosting

Later, maybe: online battling.
