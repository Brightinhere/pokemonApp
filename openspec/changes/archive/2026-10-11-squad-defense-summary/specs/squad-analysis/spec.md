# Spec Delta

## ADDED Requirements

### Requirement: Defense coverage
Next to attack coverage, the page SHALL list the attacking types at least one member resists or is immune to ("Resisted"), and the attacking types no member resists or is immune to ("Not resisted"), both in canonical type order. Each not-resisted type SHALL show how many members are weak to it when that number is above zero.

#### Scenario: Defense coverage of the example squad
- **WHEN** the squad is Charizard, Gyarados, Dragonite, Venusaur and Gengar
- **THEN** Normal, Fighting, Poison, Ground, Bug, Steel, Fire, Water, Grass, Electric and Fairy are listed as resisted, and Flying, Rock, Ghost, Psychic, Ice, Dragon and Dark as not resisted, with Rock showing 3 weak and Psychic and Ice showing 2 weak

#### Scenario: Adding a resist moves a type
- **WHEN** a Steel-type member is added to the example squad
- **THEN** Rock moves from not resisted to resisted

#### Scenario: Shared squads
- **WHEN** someone views a shared squad link with members
- **THEN** defense coverage is shown alongside attack coverage

## MODIFIED Requirements

### Requirement: Empty squad
A squad with no members SHALL show an invitation to add Pokémon, linking to the Pokédex, instead of the sheet, problem types, attack coverage and defense coverage.

#### Scenario: New squad
- **WHEN** a squad with no members is opened
- **THEN** the page invites the user to add Pokémon from the Pokédex and shows no matchup sheet

### Requirement: Analysis follows the squad
The sheet, problem types, attack coverage and defense coverage SHALL update as soon as members are added, removed or reordered. When a member is added, their column's marks SHALL animate in, unless the user prefers reduced motion.

#### Scenario: Adding a resist clears a problem
- **WHEN** a Steel-type member is added to the example squad
- **THEN** Rock is no longer a problem type

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and a member is added
- **THEN** the new column appears without animation
