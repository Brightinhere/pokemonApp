# Proposal

> Roadmap change 4 of 6. Short proposal only; specs, design and tasks are written when this change starts. Depends on `type-engine` and `pokedex`.

## Why

The core value of the tool is building a team and seeing at a glance where it is weak. Users need to build squads, keep them, share them, and understand their type strengths and gaps.

## What Changes

- **Squads**: multiple named squads of up to 6 members, created, renamed and deleted, saved in localStorage via Redux.
- **Adding members** from the Pokédex list and detail page; reordering and removing members.
- **Soft warnings** (never blocking): duplicate Pokémon in a squad; more than one Mega form.
- **Analysis view**:
  - an 18-type × members grid of defensive multipliers;
  - summary rows counting weak and resistant members per attacking type, highlighting problem types (3+ weak and 0 resists);
  - an offensive coverage list of types no member can hit super-effectively with its own types.
- **Sharing**: a URL encoding the member ids (e.g. `/squad?m=6,10034,445`). Opening it shows the squad read-only with "Save as my squad".
- **First Playwright smoke tests**: search → add to squad → open the share link.

## Capabilities

### New Capabilities
- `squad-management`: Creating, editing, persisting squads and their warnings.
- `squad-analysis`: The defensive grid, summary and offensive coverage view.
- `squad-sharing`: The share-URL format and the read-only shared view.

### Modified Capabilities
<!-- Likely app-shell (adds the share route) and pokedex-browse/pokemon-detail ("Add to squad"); decide when specs are written. -->

## Impact

- New `src/features/squads/`, a persisted squads slice, the share route.
- Adds Playwright to the toolchain and CI.
- localStorage format becomes something to version/migrate from here on.
- Out of scope: accounts, server-side storage, moves/items/EVs per member.
