# Proposal

> Roadmap change 3 of 6. Short proposal only; specs, design and tasks are written when this change starts. Depends on `foundation` and `type-engine`. Run a `frontend-design` session before starting it.

## Why

Browsing and looking up Pokémon is the entry point to the whole tool and the way users find candidates for their squads. It also delivers the first visible, usable version of the app.

## What Changes

- **Pokédex list** from the static index: one row per species by default. Toggles expand regional, Mega and Gmax forms into their own rows. Cosmetic forms never appear as rows.
- **Search and filters**: name search, filter by one or two types, "national dex up to Gen X", form category toggles, a legendary/mythical toggle.
- **Sorting** by dex number, name, or any base stat.
- **Detail page** (`/pokemon/:name`): artwork, types and number; base stats with bars; defensive matchups from the type engine; abilities with short English descriptions; evolution chain; a forms switcher (cosmetic forms included); Pokédex flavor text. Static fields come from the index; the rest is fetched live through RTK Query.
- **Battle-only badge** on Mega and Gmax forms.
- Image fallback when a hotlinked sprite fails to load.
- Responsive layout, light/dark, keyboard accessible.
- An "Add to squad" entry point if `squad-builder` lands first; otherwise it is added there.

## Capabilities

### New Capabilities
- `pokedex-browse`: Listing, search, filtering and sorting of Pokémon and forms.
- `pokemon-detail`: The detail page content and its forms switcher.

### Modified Capabilities
<!-- Possibly app-shell (route content replaces placeholders); decide when specs are written. -->

## Impact

- New `src/features/pokedex/` and `src/features/pokemon-detail/`, a filter state slice in Redux, more RTK Query endpoints (species, evolution chain, abilities, cosmetic forms).
- Live runtime calls to PokeAPI REST for detail data only.
- Out of scope: moves and learnsets (a candidate later change), non-English text.
