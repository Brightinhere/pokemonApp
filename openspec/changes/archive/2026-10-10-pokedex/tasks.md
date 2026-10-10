# Tasks

## 1. Data fix

- [x] 1.1 Update `classifyForm` so slugs with a `totem` or `cap` token are `other` before the regional rule (design D7); verify new fixture tests for `pikachu-alola-cap`, `raticate-totem-alola` (other) and `raticate-alola`, `darmanitan-galar-zen`, `tauros-paldea-combat-breed` (regional) pass
- [x] 1.2 Run `npm run data:build`; verify `git diff src/data/index.json` changes exactly two lines (those two entries), `npm run data:check` passes, and a second build produces no diff

## 2. Design system foundation

- [x] 2.1 Add `@fontsource-variable/archivo`, import `standard.css`, and set `--font-sans`; verify `npm run build` emits a latin Archivo `woff2` and the app renders in Archivo with `font-stretch-expanded` visibly wider than normal text
- [x] 2.2 Replace the neutral tokens in `src/theme/index.css` with paper, panel, ink, ink-soft, rule and rule-strong (light and dark), remove `--color-accent`, and move `Layout`, `Placeholder` and `NotFoundPage` to the new utilities; verify the theme test checks ink and ink-soft on paper and panel at ≥ 4.5:1 in both themes and fails if `--color-accent` reappears
- [x] 2.3 Build `src/ui/` primitives: `TypeChip`, `Button`, `Toggle` (with `aria-pressed`), `PokemonArt` (lazy, fixed size, placeholder on null or error), `DexNumber`, `StatBar`; verify RTL tests for chip text and colours, toggle pressed state, art fallback on null and on an `error` event, and `#0006` formatting
- [x] 2.4 Restyle the app bar to the design (wide-type brand, ink underline on the current nav item); verify the existing route and keyboard-navigation tests still pass

## 3. List logic (pure)

- [x] 3.1 Implement `parseListQuery` and `serializeListQuery` (design D2 keys); verify tests for defaults producing an empty query, round-trips, invalid and unknown values ignored, at most the first two valid types kept, and the spec's invalid-URL scenario
- [x] 3.2 Implement `applyListQuery` search, filters and sorting (design D3); verify tests against the real index for every `pokedex-browse` scenario with numbers (1,025 default rows, +97 Mega, the "char" results, punctuation and accent search, number search, Fire+Flying, generation 1 = 151, the Alolan Vulpix generation rule, the legendary toggle, Speed and Total top three, forms following their species)
- [x] 3.3 Measure `applyListQuery` on the full index with every filter combination used in the tests; verify each call stays under the 10ms budget (design D4) and record the numbers in the task notes
  - Measured 2026-10-10 (Node 26, 50 runs each, all 1,351 entries): median 0.03–0.64ms, worst 1.38ms (name sort with all forms on). Well under budget.

## 4. Pokédex page

- [x] 4.1 Build `PokedexPage` with the filters rail (search, type toggles limited to two, generation select, four form toggles, legendary toggle, sort select) wired to the URL (`replace` for typing, `push` otherwise); verify RTL tests for the shared-link scenario, back after a filter change, the third type being unavailable, and a cleared state producing `/`
- [x] 4.2 Build `PokemonRow` and the list (count line, rows with art, number, name link, types, total, battle-only label, form styling, `content-visibility`); verify RTL tests for the Charizard and Mega Charizard X row scenarios and the result count
- [x] 4.3 Add the empty, loading and error states ("Clear search and filters", index loading, "Try again"); verify RTL tests for each, with the index import failing for the error case
- [x] 4.4 Make the layout responsive: filters collapse behind a "Filters" disclosure at 960px or less, rows reflow; verify an RTL test for the disclosure and keyboard toggling of a form toggle with Space

## 5. Live detail data

- [x] 5.1 Add the shaping helpers `cleanFlavorText`, `pickEnglish`, `formatEvolutionCondition`, `toEvolutionTree` and the cosmetic-form label helper, with trimmed real fixtures (Charizard, Eevee, Vivillon); verify unit tests for level, item, trade, friendship with time of day, move type and the "Special condition" fallback, Eevee's eight branches, and flavor-text cleaning
- [x] 5.2 Add the endpoints `getPokemon`, `getEvolutionChain`, `getAbility` and `getPokemonForm`, and switch `getPokemonSpecies` to species id, all with `transformResponse` (design D5); verify tests with stubbed `fetch` for the request URLs and shaped results, and that a repeat request is served from cache

## 6. Detail page

- [x] 6.1 Build the page shell: resolve the slug from the index, not-found with no PokeAPI request, header (art, name, number, types, battle-only label, `<title>`), base stats and damage taken from `typeEngine`; verify RTL tests for the Mega Charizard X header, Charizard's stats, Charizard's damage groups, and `missingno` making zero `fetch` calls
- [x] 6.2 Build the live sections (flavor text, abilities, evolution chain, forms switcher), each with loading, error-with-retry and content states; verify RTL tests with stubbed `fetch` for Charizard's abilities and evolution, Eevee's branches, the Charizard and Vivillon forms switchers (Polar keeps the URL), Bulbasaur with no switcher, and an evolution failure that leaves the other sections visible
- [x] 6.3 Show the artwork placeholder on the detail page; verify an RTL test for `koraidon-limited-build`

## 7. Integration

- [x] 7.1 Browser check with `playwright-cli` against `npm run preview`, at 1280px and 390px in light and dark: compare against `design/prototype/`; check no horizontal scroll at 390px and a filter change → detail → back round-trip; measure list re-render after a filter change against the 100ms budget and the font transfer size; note results in the PR
  - Checked 2026-10-10 against `npm run preview` (1280px and 390px, light and dark): list, Charizard, Eevee and Vivillon match the prototype; no horizontal scroll at 390px; no console errors.
  - Re-render after a filter change: 33–72ms (Mega on 1,025→1,122 rows: 72ms). Font: only the latin Archivo file loads (90 KB woff2).
  - Mega toggle → Mega Charizard X → browser back restored `?forms=regional,mega` with Mega still pressed.
  - Fixes made during the check: Pokédex nav item stays current on detail pages; evolution chains with more than two branches (Eevee) wrap into a grid, stacked under the base stage on phones.
- [x] 7.2 Update `README.md` (status line, what the app does now) and `design/README.md` (remove the "known data issue" section now that it's fixed); verify both read correctly
- [x] 7.3 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run data:check` and `npm run build`; verify all pass

## Workflow follow-up

- Open a PR from the `pokedex` branch; merge after CI passes.
- Archive with `/opsx:archive pokedex` so `pokedex-browse` and `pokemon-detail` become main specs and the `pokemon-data-index` change is applied.
