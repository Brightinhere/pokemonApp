# Design

## Context

`foundation` delivered the committed 18x18 chart (`src/data/typechart.json`, `chart[attacker][defender]`), the `PokemonType` / `TypeChart` / `PokemonEntry` types in `src/data/types.ts`, and an empty `src/engine/` guarded by two checks: ESLint (only `src/engine/**` and `src/data/types.ts` may be imported) and a DOM-less `tsconfig.engine.json`. See proposal.md for why, and specs/type-effectiveness for required behavior. The consumers come later: the detail page (`pokedex`), the analysis grid (`squad-builder`) and scoring (`recommender`). The recommender will call the engine thousands of times per update.

## Goals / Non-Goals

**Goals:**
- A small, readable API that the three consumers can use directly, with `PokemonEntry` objects passed in as-is.
- Tests strong enough that later changes can trust every number the engine returns.

**Non-Goals:**
- Choosing which abilities map to which modifiers (a later change). This change only provides the modifier mechanism.
- Move-based or stat-based logic, damage formulas, generation-specific charts.
- Memoization or other performance work (see Risks).

## Decisions

### D1. A factory bound to a chart
```ts
const engine = createTypeEngine(chart)
engine.multiplier('rock', defender)        // 4
engine.defensiveProfile(defender)          // [{ type: 'normal', multiplier: 1 }, ...18]
engine.coverage(['fire', 'water'])         // { covered: [...], uncovered: [...] }
engine.bestAttack(['fire', 'water'], defender) // { multiplier: 4, types: ['water'] } | null
engine.squadSummary(defenders)             // 18 rows with counts + isProblem
engine.squadCoverage(defenders)            // coverage of the union of member types
```
*Why:* the chart is an input (spec: "Results come from the supplied type chart") but callers shouldn't pass it on every call. *Alternative:* free functions taking `chart` as the first argument. Equally pure, but noisier at every call site.

### D2. Structural defender input
```ts
interface Defender {
  types: readonly PokemonType[]            // 1 or 2
  modifiers?: readonly DefensiveModifier[]
}
type DefensiveModifier =
  | { attackingType: PokemonType; effect: 'immune' }
  | { attackingType: PokemonType; effect: 'scale'; factor: number }
```
`PokemonEntry` already satisfies `Defender`, so callers pass index entries without mapping. Modifiers are plain data (serializable for share URLs or a server later) and are applied after the type product, in array order. `immune` short-circuits to 0. *Alternative:* modifier callbacks. More flexible, but not serializable and harder to test; the two effects cover the agreed future cases (Levitate, Flash Fire, Volt Absorb, Thick Fat).

### D3. Results are plain `number`s, plus a shared classifier
Pure type results are always 0, 0.25, 0.5, 1, 2 or 4, but `scale` modifiers can produce other values, so the return type is `number`. `classify(multiplier)` returns `'immune' | 'resist' | 'neutral' | 'weak'` (0 / <1 / 1 / >1). The squad summary and later UI use it, so the thresholds live in one place. All chart values are powers of two, so products are exact in floating point.

### D4. Ordered arrays, not records
Profiles, coverage lists and squad summaries are arrays in `POKEMON_TYPES` order. Consumers render them directly, and order is part of the contract (spec: "canonical order"). Lookup by type stays easy with `.find`, and a record view can be added if a consumer needs it.

### D5. Problem-type rule as exported constants
`squadSummary` rows include `isProblem`, computed as `weak >= PROBLEM_WEAK_THRESHOLD (3) && resist + immune === 0`. The threshold is an exported constant so the recommender and the UI agree. Rows also carry `quadWeak` (count of members at 4x or more).

### D6. File layout
```
src/engine/
  index.ts                  public exports only
  typeEffectiveness.ts      createTypeEngine, classify, constants, types
  typeEffectiveness.test.ts
src/data/typeEngine.ts      app binding: createTypeEngine(typeChart)
```
The engine imports only `src/data/types.ts`. The app imports the ready-made instance from `src/data/typeEngine.ts`, which is the one place the JSON chart meets the engine.

### D7. Engine tests may read the real chart
Engine tests need the committed chart (spec scenarios use modern values), but the boundary rule forbids engine files from importing `src/data/typechart.json`. Add a narrow ESLint override for `src/engine/**/*.test.ts` that also allows `./data/typechart.json`. Production engine files keep the strict rule, and tests never ship. *Alternative:* put these tests in `src/data/`. That would separate the engine's tests from the engine, which hurts a later extraction into its own package.

### D8. Test strategy (layered, so a transposed chart is caught)
1. **Exhaustive against the chart:** all 324 single-type pairs, all 153 dual-type combinations x 18 attackers (product, order independence, value in {0, 0.25, 0.5, 1, 2, 4}).
2. **Hand-written known facts:** about 20 well-known matchups written out literally (e.g. fire→grass 2 but grass→fire 0.5, ghost→normal 0, ground→flying 0), so a swapped attacker/defender in the engine fails even if the exhaustive layer agrees with itself.
3. **Every spec scenario** as a named test.
4. **Purity:** a frozen chart and frozen defenders, deep-frozen with `Object.freeze`.

## Risks / Trade-offs

- [Attacker/defender transposed somewhere] → D8 layer 2 tests asymmetric pairs explicitly; the `TypeChart` doc comment already states `[attacker][defender]`.
- [Modifier model too simple for some abilities (Wonder Guard, Filter, Tera)] → Out of scope; the modifier union can grow new variants without breaking existing callers.
- [Recommender call volume (up to about 6 x 1,351 profiles per update)] → Each profile is 18 to 36 multiplications, so a few hundred thousand operations, well under a frame. Memoize per type-combination (171 combos) only if `recommender` measures a problem.
- [Problem rule (3 weak, 0 resists) is crude for small squads] → It's the agreed rule; it's a constant in one place, and the recommender can define its own scoring.
