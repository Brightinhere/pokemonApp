# Proposal

## Why

The squad page gives attack a short verdict (covered / not covered), but defense only appears as an 18-row matchup sheet and the problem-type sentences. That makes it look like the page ignores defense, even though defense is what the recommender mostly optimises: a problem type costs 6 points and a newly covered type earns 1. Players can't see that trade-off on the page or on the suggestions.

## What Changes

- **Defense coverage on the squad page**, next to attack coverage and shaped the same way:
  - **Resisted:** attacking types at least one member resists or is immune to.
  - **Not resisted:** attacking types no member resists or is immune to, each with how many members are weak to it ("Rock · 3 weak").
  - It shows in the shared view too, like the rest of the analysis.
- **Score breakdown on each suggestion:** the gain is split into a defense part and an attack part, shown as "Defense +19 · Attack 0" on both "Complete your squad" and replacement cards. The split adds up to the gain, so ranking is unchanged.
- **Coverage section restructured:** "Attack coverage" and "Defense coverage" become two blocks of one "Coverage" section, so the two sides read as a pair.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `squad-analysis`: adds a defense coverage requirement alongside attack coverage.
- `squad-recommendations`: the squad score is defined as a defense part plus an attack part, and each suggestion shows both.

## Impact

- `src/engine/recommend.ts`: `scoreSquad` gains a split form (`scoreParts`) and `Suggestion` gains `breakdown: { defense, attack }`. `scoreSquad` and the ranking stay as they are.
- `src/features/squads/SquadAnalysis.tsx`: the `Coverage` component renders both sides.
- `src/features/squads/Suggestions.tsx` and `suggestionText.ts`: the breakdown line on each card.
- No data, URL or storage changes.
- Out of scope: changing the weights, and moves or learnsets (attack coverage stays based on members' own types).
