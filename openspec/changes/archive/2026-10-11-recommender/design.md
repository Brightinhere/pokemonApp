# Design

## Context

Already in place:
- `typeEngine` (`multiplier`, `squadSummary`, `squadCoverage`) and the squads slice, with members stored as entry ids.
- The squad page (`SquadView`: name, slots, warnings, `SquadAnalysis`), the shared view, `AddToSquadButton` and the announcer.
- `src/engine/` may import only `src/data/types.ts`.

Decided with the user while planning:
- Suggestions only from 3 members.
- Replacements only on full squads, on demand, per member.
- Suggestions grouped by type combination.
- Pokémon ordered by total base stats.
- Options are the squad page's own controls.

A prototype of the score against real squads (see proposal) gave sensible results. With the Kanto example, every top suggestion resists Rock: Dark/Steel led by Kingambit, Fairy/Steel, Ground/Steel. See proposal.md for scope and specs/squad-recommendations for behavior.

## Goals / Non-Goals

**Goals:**
- A pure, deterministic engine module (`recommend.ts`): same squad and pool in, same suggestions out. It's exhaustively tested and reusable by a future server.
- Fast enough to recompute on every change without memoization tricks.
- Explanations derived from the same numbers that produce the ranking, so reasons never disagree with the order.

**Non-Goals:**
- Tuning weights with data. The weights are fixed constants, chosen to make problem types dominate, and kept in one place.
- Recommendations based on moves, stats or roles.
- Recommendations in the shared view.

## Decisions

### D1. Score per type combination, not per Pokémon
`scoreSquad(engine, typeSets)` follows the spec formula, using `squadSummary` and `squadCoverage`:
```
coverage(+1 per covered defending type)
− Σ_attacking [ 2·max(0, weak − (resist+immune)) + 1·quadWeak + (isProblem ? 6 : 0) ]
```
The candidate pool is grouped by sorted type set first (about 160 groups with the default pool). Each group is scored once: `score(squad ∪ {types}) − score(current)`. Within a group, Pokémon are sorted by base-stat total descending, then `speciesId`, then `id`.
- **Why per group:** every member of a group scores identically, so scoring 1,351 entries is redundant. 160 × 18 × ≤6 multiplications is trivial.
- **Alternative:** per-entry scoring with a stat bonus. Rejected because it mixes stats into the type score and contradicts the explanations.

Weights are exported constants (`WEAK_EXCESS = 2`, `QUAD = 1`, `PROBLEM = 6`, `COVERAGE = 1`) so tests and any future tuning share them.

### D2. API
```ts
interface RecommendInput {
  members: readonly PokemonEntry[]      // current squad, in order
  pool: readonly PokemonEntry[]         // already filtered by options (D4)
  replaceIndex?: number                 // set for "Find a replacement"
  limit?: number                        // default 5
}
interface Suggestion {
  types: PokemonType[]                  // canonical order
  gain: number                          // score delta vs the current squad (may be ≤ 0 for replacements)
  bestTotal: number                     // tie-break
  entries: PokemonEntry[]               // all matching, best first
  reasons: {
    fixes: PokemonType[]                // problem types no longer problems
    resists: PokemonType[]              // attacking types where the squad had weak > resist and this resists/is immune
    covers: PokemonType[]               // newly covered defending types
    newProblems: PokemonType[]          // replacements: problem types created
    losesCoverage: PokemonType[]        // replacements: defending types no longer covered
  }
}
recommend(engine, input): Suggestion[]
```
- **Excluded species:** those of every current member, including the replaced one.
- **Additions:** only `gain > 0` is returned.
- **Replacements:** the top `limit` are returned regardless of sign. The UI labels a gain above 0 as "Improves", 0 as "About the same", and below 0 as "Weaker".
- **Ordering:** `gain` descending, then `bestTotal` descending, then the joined type names.

It's a plain function taking the engine (D1 of `type-engine`), so it stays chart-driven and pure.

### D3. When suggestions show, and where (UI)
In `SquadView`, below the analysis:
- **3–5 members:** a "Complete your squad" section with options and up to 5 `SuggestionCard`s.
- **6 members:** each `MemberSlots` card gets "Find a replacement". It opens a `ReplacementPanel` for that slot, shown directly under the member grid with a heading naming the member, and only one is open at a time. Choosing another member switches it; "Close" or swapping closes it.

The shared view does not render either. A `SuggestionCard` shows:
- the type chips and the reasons (each as a short sentence, at most 3 types per reason with "and N more")
- for replacements, the Improves / About the same / Weaker label
- the first 3 Pokémon as rows: art, name, total, and an "Add" or "Swap in" button
- "Show all N"

### D4. Options in the squad page URL
They live on `/squads/:id` as `?gen=4&legendary=include&battleOnly=include`, with defaults omitted. They're parsed and serialized by small pure functions, reusing the list-query style. `useSearchParams` updates them with `replace` so option fiddling doesn't fill history. `filterPool(entries, options)` applies generation, legendary/mythical and battle-only. The options row shows only when suggestions or a replacement panel are visible.

### D5. Replace action
New reducer `replaceMember({ squadId, index, entryId })`, which keeps the position and updates `updatedAt`. "Swap in" dispatches it, announces "Replaced Venusaur with Kingambit in Kanto run", and closes the panel. The analysis stamp-in animation already highlights the new member's column, because its id is new.

### D6. Performance check
A test measures `recommend` on the full index for the six-member replacement case and asserts it finishes under 20ms (a generous bound; expected well under 5ms). A slower result would point at accidental per-entry scoring.

## Risks / Trade-offs

- **[Steel dominates suggestions]** → That's how type matchups really are. Grouping keeps the five options distinct, and the reasons show why. Revisit only if players find it repetitive.
- **[Paradox and other strong non-legendary Pokémon (Iron Treads, Iron Crown) top the lists]** → PokeAPI doesn't flag them as legendary. That's acceptable, and they're legal in most formats.
- **[Weights are a judgment call]** → They're constants in one module, the tests describe the intended ordering, and the reasons make each suggestion's case visible.
- **[A gain of 0 vs small positive gains can feel arbitrary]** → Additions show only positive gains, and replacements carry an explicit label.
