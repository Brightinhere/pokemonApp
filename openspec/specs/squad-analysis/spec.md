# squad-analysis Specification

## Purpose

Shows where a squad is weak and what it can hit: a matchup sheet of every attacking type against every member, problem types explained in plain words with the types that would fix them, and the squad's attack coverage.

## Requirements

### Requirement: Matchup sheet
A squad with members SHALL show a sheet with one row per attacking type (18, in canonical order) and one column per member (in squad order). Each cell SHALL show the damage that member takes from that type as a mark, and each row SHALL end with the number of members weak to it and the number that resist it or are immune.

#### Scenario: Sheet shape
- **WHEN** a squad of Charizard, Gyarados, Dragonite, Venusaur and Gengar is shown
- **THEN** the sheet has 18 rows and 5 member columns, and the Rock row shows weak 3, resist 0

#### Scenario: Cell values
- **WHEN** the same squad is shown
- **THEN** the Rock cell for Charizard reads 4×, the Ground cell for Charizard reads immune, and the Electric cell for Gyarados reads 4×

### Requirement: Marks encode multipliers without colour
Cells SHALL use the marks from the design direction: two filled squares for 4×, one filled square for 2×, a small dot for 1×, a hollow square for ½×, a small hollow square for ¼×, and a hollow circle for immune. Marks SHALL be readable without colour, SHALL each carry an accessible label ("takes 2×", "immune"), and a legend SHALL explain them.

#### Scenario: Accessible labels
- **WHEN** a screen reader reaches Charizard's Rock cell
- **THEN** it announces "takes 4×"

### Requirement: Problem types
An attacking type that 3 or more members are weak to, and that no member resists or is immune to, SHALL be marked as a problem in the sheet (a bar in the row margin and an accessible "problem type" label). Above the sheet, each problem type SHALL be explained in a sentence naming how many members it hits super-effectively, followed by the types that resist it.

#### Scenario: One problem type
- **WHEN** the squad is Charizard, Gyarados, Dragonite, Venusaur and Gengar
- **THEN** Rock is the only problem type, and the explanation says Rock hits 3 of the squad's Pokémon super-effectively, none resist it, and lists Fighting, Ground and Steel as types that resist it

#### Scenario: No problem types
- **WHEN** no attacking type meets the problem rule
- **THEN** the page says the squad has no problem types

### Requirement: Attack coverage
The page SHALL list the defending types that at least one member's own types hit super-effectively, and the defending types none of them do.

#### Scenario: Coverage of the example squad
- **WHEN** the squad is Charizard, Gyarados, Dragonite, Venusaur and Gengar
- **THEN** Normal, Flying, Poison, Electric and Dark are listed as not covered, and the other 13 types as covered

### Requirement: Empty squad
A squad with no members SHALL show an invitation to add Pokémon, linking to the Pokédex, instead of the sheet, problem types and coverage.

#### Scenario: New squad
- **WHEN** a squad with no members is opened
- **THEN** the page invites the user to add Pokémon from the Pokédex and shows no matchup sheet

### Requirement: Analysis follows the squad
The sheet, problem types and coverage SHALL update as soon as members are added, removed or reordered. When a member is added, their column's marks SHALL animate in, unless the user prefers reduced motion.

#### Scenario: Adding a resist clears a problem
- **WHEN** a Steel-type member is added to the example squad
- **THEN** Rock is no longer a problem type

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and a member is added
- **THEN** the new column appears without animation

### Requirement: Sheet on small screens
On narrow screens the sheet SHALL scroll sideways inside its own container, keeping the attacking-type column visible, and the page itself SHALL NOT scroll horizontally.

#### Scenario: Phone width
- **WHEN** a squad of six is shown 390px wide
- **THEN** the sheet scrolls inside its container with the type column fixed, and the page has no horizontal scroll
