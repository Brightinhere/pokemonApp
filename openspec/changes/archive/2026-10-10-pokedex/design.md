# Design

## Context

- **From `foundation`:** the app shell with placeholder pages for `/` and `/pokemon/:name`; `usePokemonIndex()` (index loaded as its own chunk); an RTK Query `pokeApi` slice with one endpoint, `getPokemonSpecies`; and Tailwind 4 tokens in `src/theme/index.css` (old neutral tokens plus the 18 type colour pairs, guarded by a contrast test).
- **From `type-engine`:** `typeEngine` in `src/data/typeEngine.ts`.
- **The visual direction:** `design/README.md`, with the static reference in `design/prototype/`.

See proposal.md for scope and specs/ for behavior. Decisions taken with the user before planning:
- list state lives in the URL
- an "Other forms" toggle
- render every row, relying on browser optimisations
- self-hosted Archivo
- no "Add to squad" yet

Verified facts used below:
- `@fontsource-variable/archivo` ships `standard.css`, which covers both the `wght` and `wdth` axes.
- PokeAPI `/pokemon/{slug}` lists abilities and cosmetic `forms` (Vivillon has 20).
- `/pokemon-species/{id}` has English flavor text and the evolution-chain URL.
- `/evolution-chain/{id}` is a tree whose `evolution_details` carry the trigger, `min_level`, `item`, `min_happiness`, `time_of_day` and so on (Eevee has 8 branches).
- `/ability/{name}` has English flavor text and `short_effect`.
- The only mis-classified entries are `pikachu-alola-cap` and `raticate-totem-alola`.

## Goals / Non-Goals

**Goals:**
- Screens that match `design/README.md` and the prototype, built from small shared UI pieces that `squad-builder` can reuse.
- List logic (search, filter, sort, URL parsing) as pure, exhaustively tested functions, so components stay thin.
- Filtering and sorting feel instant across all 1,351 entries.

**Non-Goals:**
- The squad tray, "Add to squad" and matchup marks (`squad-builder`).
- Moves or learnsets, and showing cries.
- A Playwright suite. It starts in `squad-builder` as planned; this change is verified with RTL tests plus a scripted browser check.

## Decisions

### D1. Design system lands first, as tokens plus a few primitives
`src/theme/index.css` swaps the old neutral tokens for the design tokens. Tailwind generates utilities from them: `bg-paper`, `bg-panel`, `text-ink`, `text-ink-soft`, `border-rule`, `border-rule-strong`. `--color-accent` is removed, and the type colour pairs are unchanged. Dark values stay in the `prefers-color-scheme` override. `Layout`, `Placeholder` and `NotFoundPage` move to the new names. The contrast test grows to cover ink and ink soft on paper and panel.

Archivo comes from `@fontsource-variable/archivo/standard.css` and is set as `--font-sans: 'Archivo Variable', system-ui, sans-serif`. Width uses Tailwind's built-in `font-stretch-*` utilities (`font-stretch-expanded` = 125%, `font-stretch-condensed` = 75%), which are confirmed in the installed Tailwind 4.3.

Shared UI goes in `src/ui/`:

| Component | Purpose |
| --- | --- |
| `TypeChip` | A type label coloured with its type token pair |
| `Button` | Ink outline or filled |
| `Toggle` | A button with `aria-pressed`; optionally coloured as a type |
| `PokemonArt` | Fixed-size `<img>` with lazy loading and a same-size placeholder on null or error |
| `DexNumber` | `#0006` |
| `StatBar` | A proportional bar for a base stat |

*Why first:* both features and the next change use these. *Alternative:* styling each feature locally. That would drift from the design and get duplicated in `squad-builder`.

### D2. The URL is the only list state
`src/features/pokedex/listQuery.ts` holds pure functions:
- `parseListQuery(URLSearchParams) -> ListQuery`, which drops invalid values and keeps at most the first two valid types
- `serializeListQuery(ListQuery) -> URLSearchParams`, which omits defaults
- `applyListQuery(entries, query) -> PokemonEntry[]`, which searches, filters and sorts

The page reads `useSearchParams()`, parses, renders and writes changes back. Typing in search uses `replace` so each keystroke doesn't add a history entry; every other control uses `push`, so back and forward step through real choices.

Query keys: `q`, `types` (comma-separated), `gen`, `forms` (comma-separated: `regional,mega,gmax,other`), `legendary=exclude`, `sort` (`number`, `name`, `total`, `hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed`).

*Why not a Redux slice* (as the roadmap proposal guessed): the URL has to hold this state anyway (spec), and mirroring it in Redux creates two sources of truth to keep in sync. Redux stays for squads in `squad-builder`.

### D3. Search, filter and sort rules
- **Normalize:** NFD, strip diacritics, lowercase, remove non-alphanumerics, so "Flabébé" becomes `flabebe` and "Mr. Mime" becomes `mrmime`.
- **Search:** a query matching `/^#?\d+$/` is a dex-number search (`speciesId === n`). Otherwise it's a substring match on the normalized display name or slug.
- **Forms:** an entry is a candidate if it's a default form, or its category's toggle is on.
- **Order of checks:** search, then types (an entry must have every selected type), then generation (`entry.generation <= gen`), then legendary/mythical.
- **Sort keys:**
  - number: `(speciesId, isDefault ? 0 : 1, id)`, so forms follow their species
  - name: `localeCompare` on display name, then `(speciesId, id)`
  - stats: value descending, then `(speciesId, id)`

### D4. Rendering all rows
`applyListQuery` runs in a `useMemo` keyed on the entries and the parsed query. The search text goes through `useDeferredValue`, so typing stays responsive while the list re-renders. Each row uses `content-visibility: auto; contain-intrinsic-size: auto 72px`, so offscreen rows skip layout and paint, and images use `loading="lazy" decoding="async"` with fixed width and height. Budget: `applyListQuery` on the full index under 10ms; re-render after a filter change under 100ms on a laptop. Measure in the browser check. If the budget is missed, the fallback is virtualization, which needs a design update first.

### D5. Live detail data: small endpoints, shaped in `transformResponse`

| Endpoint | URL | Shaped to |
| --- | --- | --- |
| `getPokemon(slug)` | `/pokemon/{slug}` | `{ abilities: { name, isHidden }[], cosmeticForms: string[] }` |
| `getPokemonSpecies(id)` | `/pokemon-species/{id}` | `{ flavorText, evolutionChainId }` |
| `getEvolutionChain(id)` | `/evolution-chain/{id}` | `EvolutionNode` tree: `{ speciesId, speciesName, condition, children }` |
| `getAbility(name)` | `/ability/{name}` | `{ displayName, description }` |
| `getPokemonForm(name)` | `/pokemon-form/{name}` | `{ displayName, sprite }`, fetched only when that cosmetic form is chosen |

The existing `getPokemonSpecies` changes from name to species id (the index has `speciesId`, and form slugs aren't species names), and its `PokemonSpecies` type is replaced by the shaped result. Cosmetic form buttons are labelled from the slug suffix (`vivillon-icy-snow` becomes "Icy Snow") so the switcher appears without 20 requests; choosing one fetches that form for its proper name and sprite. Shaping and formatting are pure functions, unit-tested against trimmed real responses (Charizard, Eevee, Vivillon) stored as test fixtures:
- `cleanFlavorText`
- `pickEnglish`
- `formatEvolutionCondition`
- `toEvolutionTree`

`formatEvolutionCondition` covers:
- `level-up` with `min_level` becomes "Level 16"
- `use-item` becomes "Water Stone"
- `trade`, optionally with `held_item`, becomes "Trade holding Metal Coat"
- `min_happiness` becomes "Friendship", plus `time_of_day` as ", during the day" or ", at night"
- `known_move_type` becomes "Knowing a Fairy move"
- anything else becomes "Special condition"

### D6. Detail page composition
`PokemonDetailPage` resolves the slug against the index first. An unknown slug renders not-found and every query is `skip`ped (spec: no PokeAPI request).

- **Shown immediately from the index:** header, stats and damage taken (`typeEngine.defensiveProfile`, grouped by multiplier).
- **Each live section is its own component with its own query:** flavor text, abilities, evolution and forms. Each renders loading, error with retry (`refetch`), or content, so one failure never blanks the page.
- **Tab title:** React 19's `<title>` element.
- **Evolution layout:** the tree renders as nested lists, with branches as a wrapped row under their parent.

### D7. Classifier fix
In `classifyForm`, check for `totem` or `cap` tokens in the slug before the regional rule and return `other`. Add fixture tests for `pikachu-alola-cap`, `raticate-totem-alola`, `raticate-alola`, `darmanitan-galar-zen` and `tauros-paldea-combat-breed`. Rerun `npm run data:build`. The expected diff in `index.json` is exactly those two lines; any other change is investigated before committing.

### D8. File layout
```
src/ui/                     TypeChip, Button, Toggle, PokemonArt, DexNumber, StatBar (+ tests)
src/features/pokedex/       PokedexPage, Filters, PokemonRow, listQuery.ts (+ tests)
src/features/pokemon-detail/ PokemonDetailPage, sections/*, shape.ts (+ fixtures, tests)
src/services/pokeApi.ts     new endpoints
```

## Risks / Trade-offs

- **[Rendering 1,351 rows is slow on low-end phones]** → `content-visibility`, lazy images and a deferred search value. Measure against the D4 budget. Virtualization is the documented fallback, needing a design update.
- **[Evolution data has many rare methods (location, gender, weather, upside-down…)]** → Format the common ones and fall back to "Special condition". Players still see the chain and can open the species.
- **[Cosmetic form labels from slugs can read oddly ("Icy Snow" vs "Icy Snow Pattern")]** → Acceptable for buttons. The fetched form name is shown once a form is chosen.
- **[Hotlinked sprites fail or are missing]** → `PokemonArt` placeholder (spec). There are 4 known nulls (Koraidon and Miraidon builds).
- **[URL history spam while typing]** → `replace` for search input (D2).
- **[Font weight on mobile data]** → One latin `woff2` variable file, `font-display: swap`. Measure the transfer in the browser check.
