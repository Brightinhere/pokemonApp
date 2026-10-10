# squad-recommendations Specification

## Purpose

Helps players complete and refine their own squads: once a few members are chosen, suggests type combinations that fix the squad's weak spots, and on a full squad suggests replacements for a member the player wants to swap, always explaining why.

## Requirements

### Requirement: When suggestions appear
On the player's own squad page, suggestions SHALL depend on squad size: none with 0–2 members; a "Complete your squad" section with 3–5 members; and with 6 members, no unprompted suggestions but a "Find a replacement" action on each member. The read-only shared view SHALL show no suggestions.

#### Scenario: Early picks are the player's own
- **WHEN** a squad has 2 members
- **THEN** no suggestions are shown

#### Scenario: Completing a squad
- **WHEN** a squad has 3, 4 or 5 members
- **THEN** a "Complete your squad" section with suggestions is shown

#### Scenario: Full squad
- **WHEN** a squad has 6 members
- **THEN** no suggestions are shown until the player chooses "Find a replacement" on a member

#### Scenario: Shared squads
- **WHEN** someone views a shared squad link
- **THEN** no suggestions or replacement actions are shown

### Requirement: Candidate pool and options
Candidates SHALL be index entries matching the squad page's options: up to a chosen generation (all by default), legendary and mythical Pokémon (excluded by default), battle-only forms (excluded by default). Entries of a species already in the squad, including the member being replaced, SHALL never be candidates. The options SHALL be kept in the squad page's URL.

#### Scenario: Defaults
- **WHEN** suggestions are shown with default options
- **THEN** no legendary, mythical or battle-only entry, and no species already in the squad, appears among them

#### Scenario: Generation limit
- **WHEN** the options are set to "up to generation 4"
- **THEN** only entries introduced in generations 1–4 appear, and the URL keeps that setting across a reload

### Requirement: Squad score
Suggestions SHALL be ranked by how much they raise a squad score computed from types alone. The score is +1 per defending type the squad's own types hit super-effectively, minus, for each attacking type: 2 per weak member beyond the number that resist or are immune, 1 per member taking 4×, and 6 if it is a problem type.

#### Scenario: A problem type costs most
- **WHEN** two candidates differ only in that one resists the squad's problem type
- **THEN** the one that resists it ranks higher

### Requirement: Suggestions are type combinations
Each suggestion SHALL be one type combination, ordered by score gain (highest first), ties broken by the highest total base stats among its Pokémon, then type names. At most 5 SHALL be shown. Additions SHALL only be suggested when they raise the score; if none do, the section SHALL say so.

#### Scenario: Completing the example squad
- **WHEN** the squad is Charizard, Gyarados, Dragonite, Venusaur and Gengar, with default options
- **THEN** the first suggestion is Dark/Steel and every suggestion resists Rock

#### Scenario: Three members
- **WHEN** the squad is Charizard, Gyarados and Venusaur, with default options
- **THEN** the first suggestion is Ground/Steel

### Requirement: Reasons
Each suggestion SHALL explain itself: the problem types it fixes, the squad weaknesses it resists or is immune to, and the defending types it adds to the squad's coverage. Replacement suggestions SHALL also state any problem type the change creates and any coverage it loses.

#### Scenario: Fixing a problem type
- **WHEN** Dark/Steel is suggested for the example five-member squad
- **THEN** its reasons say it fixes Rock

#### Scenario: Costs of a replacement
- **WHEN** a replacement would leave a type uncovered that the replaced member covered
- **THEN** the suggestion says that coverage is lost

### Requirement: Pokémon within a suggestion
Each suggestion SHALL list its matching Pokémon, highest total base stats first, then by dex number, showing the first 3 with an option to show the rest. Each listed Pokémon SHALL offer to add it to the squad (or, for replacements, to swap it in).

#### Scenario: Strongest first
- **WHEN** a Steel/Psychic suggestion is shown with default options
- **THEN** Metagross is listed before Bronzong, and Beldum only appears after choosing to show all

#### Scenario: Adding from a suggestion
- **WHEN** the player adds Kingambit from a suggestion on a five-member squad
- **THEN** Kingambit becomes the sixth member, the addition is announced, and "Complete your squad" is replaced by the full-squad behavior

### Requirement: Finding a replacement
On a full squad, choosing "Find a replacement" on a member SHALL show up to 5 suggestions for that slot, scored as the other five members plus the candidate and compared with the current squad. Each SHALL say whether it improves the squad, keeps it about the same, or weakens it. Swapping a Pokémon in SHALL replace that member in the same position.

#### Scenario: Replacing the fourth member
- **WHEN** the squad is Charizard, Gyarados, Dragonite, Venusaur, Gengar and Pikachu, and the player chooses "Find a replacement" on Venusaur
- **THEN** suggestions for Venusaur's slot are shown, the first being Dark/Steel

#### Scenario: Swapping in
- **WHEN** the player swaps Kingambit in for Venusaur
- **THEN** Kingambit takes Venusaur's position, the swap is announced, and the replacement suggestions close

### Requirement: Suggestions follow the squad
Suggestions SHALL be recomputed whenever the squad's members or the options change.

#### Scenario: Problem fixed
- **WHEN** the player adds a suggested Rock-resisting Pokémon to a four-member squad whose problem type is Rock
- **THEN** the next suggestions no longer mention fixing Rock
