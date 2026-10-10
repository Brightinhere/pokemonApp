# Spec Delta

## Purpose

Gives everything a player needs to judge one Pokémon or form: identity, base stats and damage taken (instantly, from the static index), plus flavor text, abilities, evolution chain and forms (loaded live from PokeAPI).

## ADDED Requirements

### Requirement: Detail pages are addressed by index slug
`/pokemon/:name` SHALL show the index entry whose slug is `name`, for every entry in the index (default and alternate forms). An unknown slug SHALL show a not-found message inside the app frame with a link back to the Pokédex, and SHALL NOT request anything from PokeAPI.

#### Scenario: Alternate form page
- **WHEN** the user opens `/pokemon/vulpix-alola`
- **THEN** the page shows Alolan Vulpix with the Ice type

#### Scenario: Unknown name
- **WHEN** the user opens `/pokemon/missingno`
- **THEN** the page says there is no Pokémon called "missingno", links back to the Pokédex, and makes no PokeAPI request

### Requirement: Header from the index
The page SHALL immediately show, without waiting for live data, the entry's artwork, display name, species dex number as four digits, and types in slot order. Battle-only forms SHALL be labelled as battle-only. The browser tab title SHALL include the display name.

#### Scenario: Header content
- **WHEN** the user opens `/pokemon/charizard-mega-x`
- **THEN** the page shows "Mega Charizard X", `#0006`, the Fire and Dragon types and a battle-only label, and the tab title contains "Mega Charizard X"

### Requirement: Base stats
The page SHALL show the six base stats with their values and a proportional bar each, plus their total.

#### Scenario: Charizard's stats
- **WHEN** the user opens `/pokemon/charizard`
- **THEN** it shows HP 78, Attack 84, Defense 78, Sp. Attack 109, Sp. Defense 85, Speed 100 and total 534

### Requirement: Damage taken
The page SHALL show which attacking types deal 4×, 2×, ½×, ¼× and 0× damage to the entry, computed by the type engine from the committed chart, omitting groups with no types. Neutral (1×) types SHALL NOT be listed.

#### Scenario: Charizard's weaknesses
- **WHEN** the user opens `/pokemon/charizard`
- **THEN** 4× lists Rock; 2× lists Water and Electric; ½× lists Fighting, Steel, Fire and Fairy; ¼× lists Bug and Grass; 0× lists Ground

### Requirement: Flavor text
The page SHALL show the species' most recent English Pokédex entry from PokeAPI, with line breaks and control characters replaced by single spaces.

#### Scenario: Flavor text is cleaned
- **WHEN** the most recent English entry contains `\n` or form-feed characters
- **THEN** the text is shown as one paragraph with single spaces

### Requirement: Abilities
The page SHALL list the entry's abilities in PokeAPI order, marking the hidden ability, each with a short English description: the most recent English in-game description, or the English short effect when there is none.

#### Scenario: Charizard's abilities
- **WHEN** the user opens `/pokemon/charizard`
- **THEN** it lists Blaze and Solar Power, with Solar Power marked as the hidden ability, each with a description

### Requirement: Evolution chain
The page SHALL show the species' full evolution chain, including branches, in evolution order. Each stage SHALL link to that species' default entry, and the current species SHALL be marked. Each step SHALL state how it happens for the common methods (level, item, trade, friendship, time of day), and say "special condition" otherwise. A species that does not evolve SHALL say so.

#### Scenario: Linear chain
- **WHEN** the user opens `/pokemon/charizard`
- **THEN** it shows Charmander, then Charmeleon (level 16), then Charizard (level 36), with Charizard marked as current

#### Scenario: Branching chain
- **WHEN** the user opens `/pokemon/eevee`
- **THEN** all eight evolutions are shown as branches from Eevee, including Vaporeon (Water Stone) and Espeon (friendship, during the day)

#### Scenario: Alternate form uses its species' chain
- **WHEN** the user opens `/pokemon/charizard-mega-x`
- **THEN** the same Charmander, Charmeleon, Charizard chain is shown, with Charizard marked

### Requirement: Forms switcher
When the species has more than one index entry or has cosmetic forms, the page SHALL show a forms switcher. Index entries SHALL be links to their own detail pages, with the current entry marked. Cosmetic forms SHALL switch only the artwork and form name shown, without leaving the page. Species with a single form SHALL show no switcher.

#### Scenario: Battle forms
- **WHEN** the user opens `/pokemon/charizard`
- **THEN** the switcher offers Charizard (current), Mega Charizard X, Mega Charizard Y and Gigantamax Charizard as links

#### Scenario: Cosmetic forms
- **WHEN** the user opens `/pokemon/vivillon` and chooses the Polar pattern
- **THEN** the artwork changes to the Polar pattern, the URL stays `/pokemon/vivillon`, and stats and types are unchanged

#### Scenario: Single form
- **WHEN** the user opens `/pokemon/bulbasaur`
- **THEN** no forms switcher is shown

### Requirement: Live sections load independently
Flavor text, abilities, evolution chain and cosmetic forms SHALL each show a loading state while their data loads. If a section's request fails, that section alone SHALL show an error with a "Try again" action. The header, stats and damage taken SHALL stay visible regardless.

#### Scenario: Evolution chain fails
- **WHEN** the evolution chain request fails
- **THEN** the evolution section says it could not be loaded and offers "Try again", while stats, damage taken and abilities still show

#### Scenario: Revisit is instant
- **WHEN** the user leaves a detail page and opens it again in the same session
- **THEN** its live sections show immediately from cache

### Requirement: Detail artwork falls back gracefully
When the entry has no artwork, or the image fails to load, the page SHALL show a neutral placeholder of the same size.

#### Scenario: Koraidon build without artwork
- **WHEN** the user opens `/pokemon/koraidon-limited-build`
- **THEN** a placeholder is shown where the artwork would be, and the rest of the page renders normally
