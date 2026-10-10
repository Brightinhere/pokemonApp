# Tasks

## 1. Squad state (pure)

- [x] 1.1 Add `squadRules.ts` (`nextSquadName`, `normalizeName`, `warningsFor`) and `newSquadId`; verify unit tests for the "Squad 2" gap case, trimming and the 1–40 limit, the same-species warning (Charizard + Mega Charizard X) and the two-Megas warning (Mega Charizard X + Mega Gengar)
- [x] 1.2 Add the `squads` slice (design D2) and register it in `makeStore(preloaded?)`; verify reducer tests for create, rename (empty rejected), delete with current fallback, set current, add (including creating "Squad 1" with no squads, and refusing a 7th member), remove, move earlier/later (no-ops at the ends), save shared, and prune unknown members
- [x] 1.3 Add `storage.ts` (`loadSquads`, `saveSquads`, backup key, version check) and wire loading in `main.tsx` and saving via `store.subscribe`; verify tests for the round trip, invalid JSON and wrong version going to `squad-lab:squads:backup`, a throwing `localStorage`, and the current-id fallback

## 2. Adding and the tray

- [x] 2.1 Add the app-level announcer (`useAnnounce` plus a live region in `Layout`) and `AddToSquadButton`; verify RTL tests for adding to the current squad with the "Added Gengar to Kanto run" announcement, adding with no squads creating "Squad 1", and the full-squad disabled state with its explanation
- [x] 2.2 Put the button in `PokemonRow` (responsive column) and on the detail page ("Add to <name>"); verify the existing Pokédex and detail tests still pass and new tests cover both entry points
- [x] 2.3 Build `SquadTray` in the app bar (slots, label, phone pill, hidden without squads); verify RTL tests for the slot count after an add and the accessible label

## 3. Squad pages

- [x] 3.1 Build the squad list page (sorted cards, current label, empty state, "New squad" with navigation); verify RTL tests for the empty state, ordering by last change, and creating then landing on the new squad
- [x] 3.2 Build `SquadPage`: header with inline rename and two-step delete, `MemberSlots` (move earlier/later, remove, empty "Add a Pokémon" slots), warnings, opening sets current, unknown-id message; verify RTL tests for rename (including the empty-name error), confirmed and cancelled delete, reorder, remove, both warnings, the current squad switching on open, and `/squads/does-not-exist`
- [x] 3.3 Add `Mark` to `src/ui/` and build `SquadAnalysis` (problem summary with resisting types, `MatchupSheet` with sticky type column and accessible marks, legend, coverage, empty invitation); verify RTL tests with the example squad (Rock row 3/0, Charizard Rock "takes 4×", Gyarados Electric "takes 4×", the Rock problem sentence listing Fighting, Ground and Steel, the 5 uncovered types), adding a Steel member clearing the problem, and the empty-squad invitation
- [x] 3.4 Add the stamp-in animation for newly added members (design D7) under `prefers-reduced-motion: no-preference`; verify a test that only the new member's cells get the animation class and none do on first render

## 4. Sharing

- [x] 4.1 Add `shareLink.ts` (`buildShareQuery`, `parseShareQuery`); verify tests for the exact `m=6,10034,94&n=Kanto+run` format, a round trip, non-numeric and unknown ids dropped with `dropped` set, more than 6 ids truncated, and no name
- [x] 4.2 Add "Copy share link" with the clipboard fallback field; verify RTL tests for a successful copy ("Link copied") and a rejected clipboard showing the selected field
- [x] 4.3 Build `SharedSquadPage` at `/squad` (read-only slots, analysis, dropped note, empty-link message, "Save as my squad"), and add the route; verify RTL tests for the shared-link scenario leaving own squads unchanged, the partly invalid and no-valid-ids links, and saving creating a current squad then opening it

## 5. End-to-end and integration

- [x] 5.1 Add Playwright (config, `e2e/` with PokeAPI mocked, `npm run e2e`, Vitest excluding `e2e/`) and the smoke flow from design D10, plus reload persistence and the 390px no-horizontal-scroll check; verify `npm run e2e` passes locally
- [ ] 5.2 Add the e2e job steps to CI (browser install with cache, `npm run e2e`); verify the workflow passes on the PR
- [x] 5.3 Browser check with `playwright-cli` at 1280px and 390px, light and dark, against `design/prototype/squad.html`; fix visual mismatches and note the results in the PR
  - Checked 2026-10-10 against `npm run preview` (1280px and 390px, light and dark), with the prototype's example squad: the squad page, shared view, squad list and Pokédex rows match `design/prototype/`; no console errors.
  - Fixes made during the check:
    - The app bar overflowed at phone widths with the tray. It's tighter below 480px, and the pill drops "Squad" below 380px.
    - `PokemonArt` ignored its container width, so the detail hero overflowed at 360px. Art now shrinks to fit.
    - The problem sentence said "your Pokémon" on shared squads; it now says "this squad's Pokémon".
  - Measured no horizontal scroll at 360px and 390px on `/`, `/?forms=…`, `/squads`, `/squads/:id`, `/squad?m=…` and three detail pages.
- [x] 5.4 Update `README.md` (status, the squads feature, `npm run e2e`) and the routes test for `/squad`; run lint, typecheck, test, e2e, data:check and build; verify all pass

## Workflow follow-up

- Archive with `/opsx:archive squad-builder` on the branch before merging, so the specs land with the code.
