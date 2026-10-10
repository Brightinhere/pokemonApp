# Proposal

## Why

The core value of the tool is building a team and seeing at a glance where it is weak. With the Pokédex in place, players can find Pokémon but can't yet put them together, keep a team, share it, or see its type strengths and gaps. This change delivers that, using the type engine and the design system already built.

## What Changes

- **Squads**: any number of named squads with up to 6 members each, saved in the browser.
  - Create, rename and delete squads.
  - Reorder members (move earlier or later) and remove them.
  - One squad is the **current squad**: the one you last opened or created, where "Add" sends Pokémon.
- **Adding members**:
  - An "Add" button on each Pokédex row and an "Add to <squad name>" button on the detail page, both targeting the current squad.
  - With no squad yet, the first add creates one.
  - When the current squad is full, adding is unavailable and says why.
- **Squad tray** in the app bar: the current squad's six slots, linking to it. On phones it collapses to "Squad n/6".
- **Soft warnings**, never blocking:
  - the same species twice (for example Charizard and Mega Charizard X)
  - more than one Mega form
- **Analysis**, built from the type engine:
  - **Matchup sheet**: 18 attacking types × members, drawn with the ink marks from `design/README.md`, plus weak and resist counts per row.
  - **Problem types**: highlighted with a margin bar and explained in a sentence that names the types which would resist them.
  - **Coverage**: the types the squad's own types hit super-effectively, and the ones they don't.
- **Motion**: the design's one animation. When a member is added, their column's marks stamp in, skipped for reduced motion.
- **Sharing**:
  - "Copy share link" creates `/squad?m=<ids>&n=<name>`.
  - Opening it shows the squad and its analysis read-only, with "Save as my squad".
  - Invalid or excess ids are ignored, with a note.
- **Playwright**: the first end-to-end smoke tests (search → add → share link → save), run in CI.

## Capabilities

### New Capabilities
- `squad-management`: Squads and their members, the current squad, adding from the Pokédex, the tray, warnings, and persistence in the browser.
- `squad-analysis`: The matchup sheet, problem types and attack coverage for a squad.
- `squad-sharing`: The share-link format and the read-only shared view, including saving a copy.

### Modified Capabilities
- `app-shell`: Top-level routes gain `/squad` (shared squad view), and the squad routes stop being placeholders.

## Impact

- New `src/features/squads/` and a `squads` Redux slice persisted to `localStorage` under a versioned key (`squad-lab:squads`, version 1).
- `PokemonRow` and the detail page gain add buttons, and the app bar gains the tray.
- New dev dependency `@playwright/test`; CI installs Chromium and runs the e2e suite against `vite preview`.
- No backend; squads live only in the browser that made them, or in a share link.
- Out of scope: accounts and server storage, moves, items, abilities or EVs per member, and recommendations (`recommender`).
