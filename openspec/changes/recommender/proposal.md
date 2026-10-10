# Proposal

## Why

The squad analysis shows what's wrong with a squad, but the player still has to search ~1,350 Pokémon for a fix. Suggestions that build on the player's own picks turn the analysis into action. The player stays in charge: their first picks are theirs, suggestions only appear once there is a squad to complement, and a full squad is only changed when they ask.

## What Changes

- **When suggestions appear**, by squad size (decided with the user):
  - **0–2 members:** no suggestions. The first picks are the player's own.
  - **3–5 members:** "Complete your squad" suggests what to add, based on the members already chosen.
  - **6 members:** no unprompted suggestions. Each member gets a "Find a replacement" action that suggests what could take that member's slot, scored against the other five.
- **Grouped by type combination**: each suggestion is a type pair (or single type), not a single Pokémon. The scoring only looks at types, so every Steel/Psychic scores the same.
  - Each group shows why it helps (fixes a problem type, resists the squad's weaknesses, adds attack coverage). Replacement suggestions also show what the change would cost.
  - Each group lists the matching Pokémon, highest total base stats first, so Metagross appears before Beldum.
  - Each listed Pokémon can be added, or swapped in, directly.
- **Scoring** in `src/engine/` (pure, reusable): problem types, uncovered weaknesses, 4× weaknesses and offensive coverage from members' own types. No moves; stats only order Pokémon within a group.
- **Options on the squad page**, kept in its URL:
  - up to generation X (all by default)
  - include legendary and mythical Pokémon (off by default)
  - include battle-only forms (off by default)
- **Candidates exclude species already in the squad.**
- Recommendations appear only for the player's own squads, not in the read-only shared view.

## Capabilities

### New Capabilities
- `squad-recommendations`: When suggestions appear, the candidate pool and its options, scoring and grouping, reasons, and adding or replacing from a suggestion.

### Modified Capabilities
<!-- None: the analysis, management and sharing requirements are unchanged. The new replace action belongs to squad-recommendations. -->

## Impact

- New `src/engine/recommend.ts` (scoring and grouping; imports only `src/data/types.ts`) and a `replaceMember` action in the squads slice.
- A recommendations panel on the squad page, plus a "Find a replacement" action on member cards of full squads.
- Performance: candidates are scored per type combination (160 combinations with the default pool, not ~1,350 entries).
- Out of scope: moves and learnset coverage, stat roles, usage or meta data, abilities.
