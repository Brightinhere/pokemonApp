# Proposal

> Roadmap change 5 of 6. Short proposal only; specs, design and tasks are written when this change starts. Depends on `type-engine` and `squad-builder`.

## Why

The analysis shows what is wrong with a squad; users then have to work out the fix themselves across ~1,350 Pokémon. Suggesting concrete additions and swaps turns the analysis into action.

## What Changes

- **Scoring** in `src/engine/` (pure, reusable): defensive weaknesses (problem types, 4× weaknesses, missing resistances/immunities) plus offensive coverage from members' own types. No moves or stats.
- **Add suggestions** for squads with fewer than 6 members: the top candidates ranked by score improvement, each with a short reason (e.g. "Resists Ground and Ice; covers Water").
- **Swap suggestions**: for each member, the best replacement and how the score changes.
- **Candidate pool**: respects the Pokédex "up to Gen X" filter, excludes battle-only forms by default, and has an "exclude legendaries/mythicals" toggle (on by default).
- Deterministic results with a stable tie-breaker (dex number) and a thorough Vitest suite.

## Capabilities

### New Capabilities
- `squad-recommendations`: Candidate pool rules, scoring, and add/swap suggestion output.

### Modified Capabilities
<!-- Likely squad-analysis (suggestions shown alongside it); decide when specs are written. -->

## Impact

- New scoring module in `src/engine/`, a suggestions panel in the squad view.
- Performance needs to be checked: swap search is up to 6 × ~1,350 evaluations per update, which should be fine but is measured during design.
- Out of scope: moves/learnset-based coverage, stats/roles, usage or meta data (not in PokeAPI).
