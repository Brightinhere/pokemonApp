# Tasks

## 1. Score parts (engine)

- [x] 1.1 Add `scoreParts` to `src/engine/recommend.ts`, make `scoreSquad` sum it, and add `breakdown: { defense, attack }` to `Suggestion` (design D1); verify unit tests that the parts add up to `gain` for additions and replacements, that a coverage-only change has defense 0, and that every existing recommender test passes unchanged
- [x] 1.2 Verify the spec scenarios on real data in `src/data/recommend.test.ts`: for the example five, Steel/Dark has defense +19 and attack 0, and Steel/Fairy has defense +18 and attack +1

## 2. Squad page

- [x] 2.1 Restructure `Coverage` in `SquadAnalysis.tsx` into one "Coverage" section with Attack and Defense blocks, with "Resisted types" and "Not resisted types" lists and weak counts (design D3); verify RTL tests for the example squad's resisted and not-resisted lists, Rock showing "3 weak", Rock moving to resisted after adding a Steel member, the shared view showing defense coverage, and the existing attack coverage test still passing
- [x] 2.2 Add `breakdownText` to `suggestionText.ts` and show it on every suggestion card (design D2); verify unit tests for "+19", "0" and a negative part using U+2212, and an RTL test that Steel/Dark's card on the example five shows "Defense +19 · Attack 0"

## 3. Integration

- [x] 3.1 Browser check with `playwright-cli` at 1280px and 390px, light and dark: coverage blocks and breakdown lines read well and there's no horizontal scroll at 360px; update `README.md` where it describes the analysis and suggestions; run lint, typecheck, test, e2e and build and verify all pass

## Workflow follow-up

- Open a PR from `squad-defense-summary`, archive with `/opsx:archive squad-defense-summary` on the branch, then merge.
