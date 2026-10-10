# Tasks

## 1. Test access to the real chart

- [x] 1.1 Add the ESLint override from design D7 so `src/engine/**/*.test.ts` may also import `src/data/typechart.json`; verify a test file importing it lints clean while a non-test engine file importing it still fails `npm run lint`

## 2. Single and dual-type multipliers

- [x] 2.1 Create `src/engine/typeEffectiveness.ts` with the `Defender`/`DefensiveModifier` types, `classify`, and `createTypeEngine(chart).multiplier(attackingType, defender)` without modifiers; verify tests for all 324 single-type pairs, all 153 dual combinations (product, order independence, allowed values), the hand-written known-facts table (design D8 layer 2), the custom-chart scenario and the Fire/Flying, Water/Ground scenarios
- [x] 2.2 Add defensive modifiers (`immune`, `scale`, applied after the type product in array order); verify the spec's immunity, scale and no-modifier scenarios pass

## 3. Profiles and offensive logic

- [x] 3.1 Add `defensiveProfile(defender)`; verify tests that it returns 18 entries in canonical order matching `multiplier`, plus the Normal/Ghost scenario
- [x] 3.2 Add `coverage(attackingTypes)` and `bestAttack(attackingTypes, defender)`; verify the spec scenarios (fire+water, normal alone, empty set, Rock/Ground best, water+grass tie) and that duplicate attacking types don't change results

## 4. Squad logic

- [x] 4.1 Add `squadSummary(defenders)` with weak/neutral/resist/immune/quadWeak counts and `isProblem` via the exported `PROBLEM_WEAK_THRESHOLD`; verify the counts, 4x, empty-squad and problem-type scenarios
- [x] 4.2 Add `squadCoverage(defenders)` as coverage of the union of member types; verify the union scenario and an empty squad

## 5. Purity, exports and binding

- [x] 5.1 Add the purity test (deep-frozen chart and defenders, inputs unchanged, equal results for equal inputs) covering every engine function
- [x] 5.2 Export the public API from `src/engine/index.ts` and add `src/data/typeEngine.ts` (`createTypeEngine(typeChart)`); verify a test that `typeEngine.multiplier('rock', <charizard entry from index.json>)` is 4
- [x] 5.3 Document the API and the modifier model in `src/engine/README.md` with a short usage example; verify the example's results match the tests
- [x] 5.4 Integration check: `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` all pass

## Workflow follow-up

- Open a PR from the `type-engine` branch and let CI pass before merging.
- Archive the change with `/opsx:archive type-engine` after merge, so `type-effectiveness` becomes a main spec.
