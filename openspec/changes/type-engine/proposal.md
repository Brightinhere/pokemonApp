# Proposal

> Roadmap change 2 of 6. Short proposal only; specs, design and tasks are written when this change starts. Depends on `foundation`.

## Why

Squad analysis, the recommender, and any future battle mode all need the same question answered: how effective is an attacking type against a given Pokémon? Putting this in one pure, well-tested module in `src/engine/` gives every feature a single, correct source of truth, and a future battle server can reuse it unchanged.

## What Changes

- A pure TypeScript type engine in `src/engine/`, taking the type chart as input rather than hardcoding it.
- Defensive multipliers for single- and dual-type Pokémon (e.g. Fire/Flying takes 4× from Rock and 0× from Ground).
- A full defensive profile per Pokémon: the multiplier for each of the 18 attacking types.
- Offensive coverage from a set of types (which defending types can be hit super-effectively by STAB types).
- Squad-level aggregation: per attacking type, how many members are weak, neutral, resistant or immune.
- An extension point for per-Pokémon overrides (e.g. a future "immune to Ground" from Levitate). No abilities are modelled in this change.
- An exhaustive Vitest suite.

## Capabilities

### New Capabilities
- `type-effectiveness`: Matchup calculation for types, Pokémon, and squads (defensive profiles, offensive coverage, squad aggregation, override hook).

### Modified Capabilities
<!-- None expected. -->

## Impact

- New code in `src/engine/` only; consumes `typechart.json` and the `PokemonEntry` type from `foundation`.
- No UI. Consumers arrive in `pokedex` (detail-page matchups), `squad-builder` and `recommender`.
- Out of scope: abilities, moves, damage formulas, battle simulation.
