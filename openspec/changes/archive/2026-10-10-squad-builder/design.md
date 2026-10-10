# Design

## Context

Already in place:
- The Redux store has only the `pokeApi` slice.
- `/squads` and `/squads/:id` are placeholders.
- `typeEngine` (`src/data/typeEngine.ts`) provides `squadSummary` (weak/neutral/resist/immune/quadWeak/isProblem) and `squadCoverage`.
- Pokédex rows and the detail page come from the `pokedex` change.
- Shared UI lives in `src/ui/`.
- `design/README.md` and `design/prototype/squad.html` define the squad page, the matchup marks, the tray and the one stamp-in animation.
- Index entry ids are PokeAPI `pokemon` ids, stable across data rebuilds.

The user was unavailable while this was planned and asked for recommended choices. The decisions marked **(decided without the user)** are listed for review in the hand-off.

## Goals / Non-Goals

**Goals:**
- Squad logic (create, add, reorder, warnings, share-link parsing) as pure, tested functions, with components kept thin.
- Persistence that survives bad data and blocked storage (spec).
- The prototype's squad page, made real and reusable by `recommender`.

**Non-Goals:**
- Syncing squads across devices; accounts.
- Drag-and-drop reordering.
- Per-member abilities or modifiers. The type engine supports them, but there's no UI yet.

## Decisions

### D1. Data model (decided without the user)
```ts
interface Squad {
  id: string           // 10 random url-safe characters from crypto.getRandomValues
  name: string         // 1–40 characters, trimmed
  members: number[]    // index entry ids, in order, at most 6
  updatedAt: number    // ms; orders the squad list
}
interface SquadsState { squads: Squad[]; currentId: string | null }
```
Members are stored as **entry ids**, not slugs. They're compact, stable, and the same numbers the share link uses. Components look entries up through a `Map<id, PokemonEntry>` built once from the index. *Alternative:* slugs. They're more readable, but longer in links and not what the URL format promised.

### D2. A Redux slice with pure reducers
`src/features/squads/squadsSlice.ts` (RTK `createSlice`):
- `createSquad({ id, name? })`
- `renameSquad`
- `deleteSquad`
- `setCurrent`
- `addMember({ squadId?, entryId, newSquadId })`, which creates "Squad N" when there's no current squad
- `removeMember`
- `moveMember({ squadId, index, direction })`
- `saveShared({ id, name, members })`

IDs are generated **outside** reducers and passed in, so reducers stay pure and testable. Name logic lives in `squadRules.ts` (pure):
- `nextSquadName`
- `normalizeName`

Warnings (`warningsFor`) also live there. They need index entries, so they're computed with selectors rather than stored.

### D3. Persistence: subscribe and write, versioned, defensive
`src/features/squads/storage.ts`:
- `loadSquads(entryIds: Set<number>) -> SquadsState`: reads `squad-lab:squads`, expects `{ version: 1, squads, currentId }`, and validates the shape. Unknown member ids are dropped and duplicate squad ids skipped. A missing or invalid `currentId` falls back to the most recent squad.
  - **Invalid JSON or shape:** copy the raw string to `squad-lab:squads:backup` and return an empty state.
  - **Storage that throws:** return an empty state, and keep working in memory.
- `saveSquads(state)`: `JSON.stringify` inside `try/catch`, called from a `store.subscribe` listener only when the slice reference changes.

`makeStore(preloaded?)` takes the loaded state. `main.tsx` loads before rendering, so there's no flash of "no squads".

**Dropping unknown members at load needs the index, which loads asynchronously.** So the persisted state is loaded raw (shape-validated only), and an `index loaded` effect dispatches `pruneMembers(validIds)` once. Version 1 has no migrations; the loader rejects other versions into the backup key, so a future version can migrate instead.

### D4. The current squad and adding
`currentId` changes on create, on opening `/squads/:id` (an effect), and on `saveShared`.
- **`AddToSquadButton`** (`src/features/squads/`) reads the current squad.
  - Its label is "Add" in rows and "Add to <name>" on the detail page.
  - It's `aria-disabled` with a title and visible "Squad full" text when there are 6 members.
  - It dispatches `addMember`.
  - It announces the result through one app-level live region (`useAnnounce`), mounted in `Layout`.
- **No squad exists:** the first add creates "Squad 1" and stays on the page (spec).
- **`PokemonRow`** gets a sixth grid column for the button. On mobile it's the third column, as in the prototype.

### D5. The tray
`SquadTray` sits in `Layout`. It renders nothing without a current squad. Otherwise it's a link to `/squads/:id` with an `aria-label` like "Current squad: Kanto run, 5 of 6", six slots (32px art or a dashed empty slot) and the name. At 560px or less the slots hide and a "Squad 5/6" pill shows (CSS only).

### D6. Squad page composition
`SquadPage`:
- header: name (rename inline as a small form), "Copy share link", "Delete squad" with inline confirm/cancel
- `MemberSlots`: 6 cards with art, name, types, "Move earlier", "Move later" and "Remove", plus empty slots with "Add a Pokémon" linking to `/`
- `SquadWarnings`
- `SquadAnalysis`

`SquadAnalysis({ entries })` is shared with the shared view and contains:
- `ProblemSummary`: the sentence, plus `TypeChip`s for resisting types from `chart[attack][t] < 1`
- `MatchupSheet`: a `<table>` with `<th scope>` headers, a sticky first column, and marks as `<span role="img" aria-label>`
- `Legend`
- `Coverage`

Marks are a `Mark` component in `src/ui/` (`multiplier -> mark`). The resist column counts `resist + immune`, per the spec.

### D7. Stamp-in animation
`MatchupSheet` remembers the previous member ids (`useRef`) and gives cells of newly added members a `mark-fresh` class. The keyframes are 260ms scale-in with an 18ms × row-index delay, inside `@media (prefers-reduced-motion: no-preference)` in `src/theme/index.css`. Nothing animates on first render.

### D8. Share links
`shareLink.ts` (pure):
- `buildShareQuery(name, ids)`: `URLSearchParams` with commas kept literal (`.replace(/%2C/g, ',')`), so links read `m=6,10034,94&n=Kanto+run` as the spec shows.
- `parseShareQuery(params, entriesById)`: returns `{ name, entries, dropped }`. It accepts ids matching `^\d+$` that exist in the index, keeps the first 6, and sets `dropped` when anything was ignored.

"Copy share link" uses `navigator.clipboard.writeText(location.origin + path)`. On rejection or absence it shows a read-only `<input>` with the link, selected. The shared view (`SharedSquadPage` at `/squad`) reuses `MemberSlots` in read-only mode and `SquadAnalysis`.

### D9. Squad list page
Squads are sorted by `updatedAt` descending, as cards with the name, up to 6 small art slots and "n of 6". The current squad has a "Current" label. "New squad" generates an id, dispatches `createSquad`, and navigates. In the empty state, the text explains that a squad holds up to six Pokémon.

### D10. Playwright (decided without the user: Chromium only)
- **Setup:** `@playwright/test` with `playwright.config.ts`. The `webServer` is `npm run build && npm run preview -- --port 4173`, the project is Chromium only, and tests live in `e2e/`.
- **Network:** tests **mock PokeAPI** with `page.route('https://pokeapi.co/**')` (404s or fixtures), so CI doesn't depend on PokeAPI. Sprites come from GitHub and aren't asserted.
- **Smoke flow:** search "char" → Add Charizard (creates Squad 1) → add Gengar → open the squad → see the sheet → Copy share link → open the link in a new page → "Save as my squad" → the squad list shows 2 squads.
- **Plus:** reload persistence, and no horizontal scroll at 390px on `/squads/:id`.
- **Tooling:** CI gains `npx playwright install --with-deps chromium` and `npm run e2e`. Vitest excludes `e2e/`.

## Risks / Trade-offs

- **[localStorage lost (cleared site data, private mode)]** → A documented limitation: share links are the way to keep or move squads. The UI says squads are saved in this browser.
- **[The index loads asynchronously, but members need it to render]** → Squad pages show the same loading and error states as the Pokédex until the index is ready. Pruning runs once it is ready.
- **[Writing to storage on every change]** → It's a small payload (bytes per squad) and writes only when the slice changes.
- **[Playwright in CI adds about a minute and a browser download]** → Chromium only, with `~/.cache/ms-playwright` cached by `actions/cache`, keyed on the Playwright version.
- **[Random ids could collide]** → 10 url-safe characters is about 60 bits. Creation also checks existing ids and regenerates on a clash.
