# Proposal

## Why

The Pokémon companion tool (Pokédex, detail pages, squad builder with type analysis, recommender) has no code yet. Every later feature depends on the same base: a project scaffold, tooling that keeps quality up while learning, and a fast local copy of Pokémon data so the app doesn't hammer PokeAPI. Building that base first, and on its own, keeps the later feature changes small and focused.

## What Changes

- Scaffold a Vite + React + TypeScript single-page app with React Router, Redux Toolkit (with RTK Query for live PokeAPI calls), and Tailwind CSS.
- Add tooling: npm with a pinned Node LTS (`.nvmrc`), ESLint + Prettier, Vitest + React Testing Library, and a GitHub Actions workflow running lint, type-check, and tests on every push.
- Reserve `src/engine/` for pure, UI-free logic, enforced by an ESLint rule that forbids React, Redux, and browser APIs there (the type engine itself arrives in the `type-engine` change).
- Add a manually run build script that queries PokeAPI's GraphQL endpoint (REST crawl as fallback) and writes two committed data files:
  - `index.json` — one compact entry per Pokémon (all non-cosmetic forms: default, regional, Mega, Gmax, other).
  - `typechart.json` — the modern 18×18 type-effectiveness chart.
- Add an app shell: top-level routes with placeholder pages, light/dark mode following the system preference, and Tailwind theme tokens including the 18 type colours. Real screen design is deferred to a `frontend-design` session before the `pokedex` change.
- `npm run build` produces a self-contained static `dist/`. Deployment is out of scope (see `deploy-vps`).

## Capabilities

### New Capabilities
- `pokemon-data-index`: The committed, build-time Pokémon dataset (`index.json`, `typechart.json`): what each entry contains, how forms and generations are classified, and how the data is regenerated.
- `app-shell`: The application frame: routes, navigation, not-found handling, theming (light/dark, type colour tokens), and the live-data API client setup.

### Modified Capabilities
<!-- None: no existing specs. -->

## Impact

- New codebase in the repo root (`package.json`, `src/`, `scripts/`, `public/` or `src/data/`, `.github/workflows/`).
- New dependencies: react, react-dom, react-router, @reduxjs/toolkit, react-redux, tailwindcss, vite, typescript, vitest, @testing-library/react, eslint, prettier.
- External systems: PokeAPI GraphQL (`graphql.pokeapi.co/v1beta2`) at build-script time only; PokeAPI REST at runtime for detail data (used from the `pokedex` change on); sprites hotlinked from PokeAPI's GitHub sprites repository.
- Out of scope: type engine logic, any real Pokédex/squad UI, deployment.
