# Spec Delta

## Purpose

Provides a compact, committed, build-time copy of the Pokémon data the app needs for listing, filtering, team analysis and recommendations, so these features are instant, work offline, and place no runtime load on PokeAPI.

## ADDED Requirements

### Requirement: Index covers every non-cosmetic Pokémon form
The dataset SHALL contain exactly one entry per PokeAPI `pokemon` resource (default forms, regional forms, Mega, Gmax and other alternate forms). Purely cosmetic `pokemon-form` variants that share a `pokemon` resource SHALL NOT appear as separate entries.

#### Scenario: Regional and battle forms are entries
- **WHEN** the dataset is generated
- **THEN** `vulpix`, `vulpix-alola`, `charizard`, `charizard-mega-x`, `charizard-mega-y` and `charizard-gmax` each appear as their own entry

#### Scenario: Cosmetic forms are not entries
- **WHEN** the dataset is generated
- **THEN** `vivillon` appears once and `vivillon-polar` does not appear as an entry

#### Scenario: Entry count matches source
- **WHEN** the dataset is generated
- **THEN** the number of entries equals the number of `pokemon` resources reported by PokeAPI at generation time

### Requirement: Entry fields
Each entry SHALL contain: numeric id, species id, slug name, English display name, one or two types in slot order, the six base stats (hp, attack, defense, special-attack, special-defense, speed), generation number, form category, `isDefault`, `isBattleOnly`, `isLegendary`, `isMythical`, and a sprite URL.

#### Scenario: Dual-type entry
- **WHEN** reading the entry for `vulpix-alola`
- **THEN** its types are `["ice"]` and its species id equals that of `vulpix`

#### Scenario: Stats are complete
- **WHEN** reading any entry
- **THEN** it has all six base stats as non-negative integers

#### Scenario: Legendary flags come from the species
- **WHEN** reading the entries for `mewtwo` and `mewtwo-mega-x`
- **THEN** both have `isLegendary` true

### Requirement: Form classification
Each entry SHALL have exactly one form category: `default` (the species' default form), `regional` (Alolan, Galarian, Hisuian or Paldean forms), `mega`, `gmax`, or `other` (any remaining alternate form).

#### Scenario: Categories assigned
- **WHEN** the dataset is generated
- **THEN** `charizard` is `default`, `vulpix-alola` is `regional`, `charizard-mega-x` is `mega`, `charizard-gmax` is `gmax`, and `rotom-wash` is `other`

#### Scenario: Battle-only flag
- **WHEN** reading the entries for `charizard-mega-x` and `vulpix-alola`
- **THEN** `charizard-mega-x` has `isBattleOnly` true and `vulpix-alola` has `isBattleOnly` false

### Requirement: Generation of an entry is the generation the form was introduced
An entry's generation SHALL be the generation in which that specific form was introduced, not the generation of its species.

#### Scenario: Regional form generation
- **WHEN** reading the entries for `vulpix` and `vulpix-alola`
- **THEN** `vulpix` has generation 1 and `vulpix-alola` has generation 7

#### Scenario: Mega generation
- **WHEN** reading the entry for `charizard-mega-x`
- **THEN** its generation is 6

### Requirement: Sprite URLs avoid PokeAPI servers
Each entry's sprite URL SHALL point to the PokeAPI sprites repository hosted on GitHub (official artwork preferred, front default sprite as fallback), never to `pokeapi.co`. An entry with no available artwork SHALL have a null sprite URL.

#### Scenario: Artwork URL
- **WHEN** reading the entry for `pikachu`
- **THEN** its sprite URL is a `raw.githubusercontent.com/PokeAPI/sprites` URL for its official artwork

### Requirement: Type chart dataset
The system SHALL provide a type-effectiveness chart covering exactly the 18 modern battle types, giving the damage multiplier (0, 0.5, 1 or 2) for every attacking-type/defending-type pair. Non-battle types (such as `stellar`, `unknown`, `shadow`) SHALL be excluded.

#### Scenario: Known matchups
- **WHEN** reading the chart
- **THEN** ground→flying is 0, fire→grass is 2, water→fire is 2, dragon→fairy is 0, and normal→normal is 1

#### Scenario: Chart is complete
- **WHEN** reading the chart
- **THEN** it contains 324 attacking/defending pairs and no type outside the 18 battle types

### Requirement: Data is regenerated only on demand
The datasets SHALL be produced by an explicitly run command and committed to the repository. Installing, building, testing or running the app SHALL NOT contact PokeAPI to produce them.

#### Scenario: Offline build
- **WHEN** the app is built with no network access
- **THEN** the build succeeds using the committed datasets

#### Scenario: Regeneration is deterministic
- **WHEN** the regeneration command is run twice against unchanged PokeAPI data
- **THEN** the produced files are byte-identical

### Requirement: Regeneration fails loudly on bad data
The regeneration command SHALL validate its output and exit with an error, leaving the committed files untouched, if the source is unreachable or the output violates the entry or chart requirements.

#### Scenario: Source unreachable
- **WHEN** the regeneration command runs and PokeAPI cannot be reached
- **THEN** the command exits non-zero and the existing dataset files are unchanged

#### Scenario: Invalid output
- **WHEN** the fetched data would produce an entry with no types
- **THEN** the command exits non-zero naming the offending entry and the existing dataset files are unchanged
