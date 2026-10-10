# pokedex-browse Specification

## Purpose

Lets players find Pokémon and their battle-relevant forms in the static index: a sortable list with search and filters, whose state lives in the URL so it survives refresh, navigation and sharing.

## Requirements

### Requirement: Default list shows one row per species
With no search, filters or toggles applied, the Pokédex SHALL list exactly one row per species (its default form), in ascending dex number order.

#### Scenario: Default view
- **WHEN** the user opens `/` with no query parameters
- **THEN** 1,025 rows are listed, starting with Bulbasaur (#0001), and no alternate form appears as a row

### Requirement: Row content
Each row SHALL show the entry's artwork, its species' dex number as four digits (e.g. `#0006`), its display name linking to its detail page, its types in slot order, and its total base stats. Rows for battle-only forms SHALL be labelled as battle-only.

#### Scenario: Default form row
- **WHEN** Charizard's row is shown
- **THEN** it shows `#0006`, "Charizard" linking to `/pokemon/charizard`, the Fire and Flying types, and the total 534

#### Scenario: Battle-only form row
- **WHEN** Mega Charizard X's row is shown
- **THEN** it shows `#0006`, links to `/pokemon/charizard-mega-x`, and is labelled as a battle-only form

### Requirement: Form toggles
The list SHALL offer four toggles, Regional, Mega, Gigantamax and Other forms, all off by default. Turning one on SHALL add every entry of that form category as a row. Cosmetic forms SHALL never be rows.

#### Scenario: Turning on Mega
- **WHEN** the user turns on the Mega toggle with no other filters
- **THEN** 97 Mega rows are added, for 1,122 rows in total

#### Scenario: Forms follow their species
- **WHEN** the list is sorted by number and the Mega and Gigantamax toggles are on
- **THEN** Mega Charizard X, Mega Charizard Y and Gigantamax Charizard appear directly after Charizard and before Squirtle

#### Scenario: Other forms
- **WHEN** the user turns on Other forms
- **THEN** Heat, Wash, Frost, Fan and Mow Rotom appear as rows, and Alola Cap Pikachu appears under Other forms rather than Regional

### Requirement: Search
The list SHALL filter by a search query matching either a dex number or a name. A query of digits (optionally prefixed with `#`) SHALL match entries with that exact dex number. Any other query SHALL match display names and slugs containing it, ignoring case, accents, spaces and punctuation.

#### Scenario: Name search
- **WHEN** the user searches for "char"
- **THEN** the results include Charmander, Charmeleon, Charizard, Charjabug and Charcadet

#### Scenario: Punctuation and accents are ignored
- **WHEN** the user searches for "farfetchd", "mr mime" or "flabebe"
- **THEN** Farfetch’d, Mr. Mime and Flabébé are found respectively

#### Scenario: Number search
- **WHEN** the user searches for "6" or "#0006"
- **THEN** only entries with dex number 6 are listed

### Requirement: Type filter
The user SHALL be able to select up to two types. Only entries having every selected type SHALL be listed. While two types are selected, the remaining types SHALL be unavailable until one is deselected.

#### Scenario: Two types
- **WHEN** the user selects Fire and Flying with no form toggles on
- **THEN** exactly Charizard, Moltres, Ho-Oh, Fletchinder, Talonflame and Oricorio are listed

#### Scenario: Third type unavailable
- **WHEN** two types are selected
- **THEN** the other 16 type toggles cannot be selected

### Requirement: Generation filter
The user SHALL be able to limit the list to entries introduced in or before a chosen generation, judged by each entry's own generation (so a form can be excluded while its species is included).

#### Scenario: Up to generation 1
- **WHEN** the user chooses "up to generation 1" with no form toggles on
- **THEN** 151 rows are listed

#### Scenario: Forms use their own generation
- **WHEN** the user chooses "up to generation 6" and turns on Regional
- **THEN** Vulpix is listed and Alolan Vulpix (generation 7) is not

### Requirement: Legendary and mythical toggle
Legendary and mythical Pokémon SHALL be included by default. Turning the toggle off SHALL exclude every entry whose species is legendary or mythical.

#### Scenario: Excluding legendaries
- **WHEN** the user turns legendary and mythical Pokémon off
- **THEN** Mewtwo, Mew and Arceus are not listed, and Charizard still is

### Requirement: Sorting
The list SHALL be sortable by dex number (ascending, the default), name (A to Z), total base stats, or any single base stat (highest first). Ties SHALL be broken by dex number, then by entry id.

#### Scenario: Sort by speed
- **WHEN** the user sorts by Speed with no form toggles on
- **THEN** the first three rows are Regieleki (200), Ninjask (160) and Pheromosa (151)

#### Scenario: Sort by total
- **WHEN** the user sorts by total base stats with no form toggles on
- **THEN** the first three rows are Arceus (720), Eternatus (690) and Mewtwo (680)

### Requirement: Result count and empty state
The list SHALL state how many entries match. When nothing matches, it SHALL say so and offer an action that clears search and filters.

#### Scenario: No matches
- **WHEN** the user searches for "zzzz"
- **THEN** a message says no Pokémon match, with a "Clear search and filters" action that restores the default list

### Requirement: List state lives in the URL
Search, type, generation, form toggles, the legendary toggle and sort SHALL be reflected in the URL query, omitting values that equal their defaults. Opening a URL SHALL restore that state, browser back and forward SHALL move between states, and invalid values SHALL be ignored, falling back to the defaults.

#### Scenario: Shared link
- **WHEN** someone opens `/?types=fire,flying&sort=speed`
- **THEN** the list shows only Fire/Flying entries sorted by Speed, with those controls set accordingly

#### Scenario: Returning from a detail page
- **WHEN** the user filters the list, opens a Pokémon, then presses the browser back button
- **THEN** the list is shown with the same search, filters and sort

#### Scenario: Invalid values
- **WHEN** someone opens `/?types=fire,shadow,water,grass&gen=42&sort=height`
- **THEN** unknown values are ignored, at most the first two valid types are applied, and generation and sort use their defaults

#### Scenario: Defaults keep a clean URL
- **WHEN** the user clears all search, filters and sort
- **THEN** the URL is `/` with no query

### Requirement: Index loading and failure
While the index is loading, the list area SHALL show a loading state. If the index fails to load, it SHALL show an error message with a retry action.

#### Scenario: Index fails to load
- **WHEN** loading the index fails
- **THEN** the list area says the Pokémon list could not be loaded and offers "Try again"

### Requirement: Artwork falls back gracefully
When an entry has no artwork URL, or its image fails to load, the row SHALL show a neutral placeholder in the same space, without shifting the layout.

#### Scenario: Missing artwork
- **WHEN** a row's entry has a null sprite
- **THEN** a placeholder of the same size is shown instead of a broken image

### Requirement: Usable by keyboard and on small screens
Every control SHALL be reachable and operable by keyboard with a visible focus indicator. Toggles SHALL expose their on/off state to assistive technology. On narrow screens (960px wide or less) the filters SHALL collapse behind a "Filters" disclosure, and the page SHALL never scroll horizontally at 360px width or wider.

#### Scenario: Toggle by keyboard
- **WHEN** a keyboard user focuses the Mega toggle and presses Space
- **THEN** Mega rows are added and the toggle reports itself as pressed

#### Scenario: Phone width
- **WHEN** the Pokédex is shown 390px wide
- **THEN** the filters are collapsed behind "Filters" and the page has no horizontal scroll
