# Tasks

## 1. Recommendation engine (pure)

- [x] 1.1 Add `src/engine/recommend.ts` with the score weights, `scoreSquad` and `recommend` (grouping by type set, species exclusion, gain/tie-break ordering, entries by total then dex number, `limit`, additions only when gain > 0) and export it from `src/engine/index.ts`; verify tests for the formula on hand-built squads (a problem type costing 6, 4× costing 1, weakness excess costing 2, coverage +1), species exclusion including the replaced member, ordering and tie-breaks, and the Steel/Psychic entry order (Metagross, Iron Crown, Bronzong, … Beldum)
- [x] 1.2 Add the reasons (`fixes`, `resists`, `covers`, `newProblems`, `losesCoverage`); verify tests that Dark/Steel fixes Rock for the example five-member squad, that a replacement losing a covered type reports it, and that reasons are empty lists rather than missing
- [x] 1.3 Verify the spec scenarios against the real index and chart: example five → first Dark/Steel and all resist Rock; Charizard, Gyarados and Venusaur → first Ground/Steel; replacing Venusaur in the six-member example → first Dark/Steel; plus the performance bound (design D6) under 20ms

## 2. Options and state

- [x] 2.1 Add the options `parse`/`serialize` helpers and `filterPool` (generation, legendary/mythical, battle-only); verify tests for defaults producing an empty query, invalid values ignored, and each filter
- [x] 2.2 Add the `replaceMember` reducer; verify tests that position and the other members are kept, `updatedAt` changes, and out-of-range indexes are no-ops

## 3. UI

- [x] 3.1 Build `SuggestionCard` (type chips, reasons as sentences, effect label for replacements, first 3 Pokémon with "Show all N", Add/Swap in buttons with accessible names) and the options row bound to the URL with `replace`; verify RTL tests for reason text, the label, show all, and options updating the URL
- [x] 3.2 Add "Complete your squad" to the squad page for 3–5 members, with the "nothing improves this squad" message; verify RTL tests that 2 members show nothing, 3 members show Ground/Steel first for Charizard/Gyarados/Venusaur, adding Kingambit from a suggestion to a five-member squad makes it six and removes the section, and the shared view shows no suggestions
- [x] 3.3 Add "Find a replacement" on full squads with the `ReplacementPanel` (one open at a time, close, swap in place, announcement); verify RTL tests for Venusaur's slot showing Dark/Steel first, swapping Kingambit into Venusaur's position, the panel closing, and no replacement action on squads under 6
- [x] 3.4 Browser check with `playwright-cli` at 1280px and 390px, light and dark; extend the e2e smoke test to add a suggested Pokémon; verify `npm run e2e` passes and there's no horizontal scroll at 360px
  - Checked 2026-10-11 against `npm run preview` (1280px and 390px, light and dark): "Complete your squad" on the example five shows Steel/Dark, Steel/Fairy, Ground/Steel, Steel/Electric, Fighting/Steel, all fixing Rock. Replacing Venusaur on the six-member squad shows labelled options led by Kingambit. No console errors.
  - The e2e suite gained a suggestions flow at 360px (add a suggested Kingambit, open a replacement panel, no horizontal scroll): 4 tests pass.

## 4. Integration

- [x] 4.1 Update `README.md` (status, how suggestions work) and run lint, typecheck, test, e2e, data:check and build; verify all pass

## Workflow follow-up

- Open a PR from `recommender`, archive with `/opsx:archive recommender` on the branch, then merge.
