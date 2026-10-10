# Proposal

## Why

Browsing and looking up Pokémon is the entry point to the whole tool and the way users find candidates for their squads. This change delivers the first real, usable screens, replacing the `/` and `/pokemon/:name` placeholders, and introduces the visual system that the squad builder will reuse.

## What Changes

- **Design system foundation**: adopt the direction in `design/README.md`.
  - Neutral colour tokens for both themes; the old red `--color-accent` is retired.
  - Self-hosted Archivo, using its width axis.
  - Shared building blocks: type chips, buttons, toggles, list rows, artwork with fallback.
- **Pokédex list** (`/`) from the static index:
  - One row per species by default.
  - Four toggles (Regional, Mega, Gigantamax, Other forms) add form entries as rows. Cosmetic forms never become rows.
- **Search and filters**: name or number search, one or two types, "up to generation X", form toggles, a legendary/mythical toggle.
- **Sorting** by dex number, name, total base stats, or any single base stat.
- **Filters, search and sort live in the URL**, so refresh, back/forward and shared links keep them.
- **Detail page** (`/pokemon/:name`):
  - From the index: artwork, name, number, types, base stats, and damage taken from the type engine.
  - Fetched live: flavor text, abilities with short descriptions, the evolution chain (including branches and how each step happens), and a forms switcher that includes cosmetic forms.
- **Battle-only label** on Mega, Gigantamax and other battle-only forms.
- **Data fix**: Alola Cap Pikachu and Totem Alolan Raticate are wrongly classified as regional forms. The classifier is corrected and the index regenerated.
- Responsive down to phone width, light and dark, keyboard accessible. Long lists render all rows, optimised by the browser.
- **Not in this change**: "Add to squad" buttons. They arrive with `squad-builder`, together with the squad tray in the app bar.

## Capabilities

### New Capabilities
- `pokedex-browse`: Listing, search, filtering and sorting of Pokémon and forms, and how that state lives in the URL.
- `pokemon-detail`: The detail page: what it shows from the index, what it loads live, the forms switcher, and its loading, error and not-found behavior.

### Modified Capabilities
- `pokemon-data-index`: Form classification. Totem and cap forms are `other` even when their name contains a region.

## Impact

- New `src/features/pokedex/`, `src/features/pokemon-detail/`, and shared UI in `src/ui/`. The theme tokens in `src/theme/index.css` are replaced (type colours keep their values).
- New RTK Query endpoints: pokemon, species, ability, evolution chain, pokemon form. Live calls to PokeAPI REST only from the detail page.
- New dependency: `@fontsource-variable/archivo`.
- `scripts/build-index/transform.ts` changes, and `src/data/index.json` is regenerated (2 entries change category).
- Out of scope: moves and learnsets, non-English text, squad features.
