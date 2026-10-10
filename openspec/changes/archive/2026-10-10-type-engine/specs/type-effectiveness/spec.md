# Spec Delta

## Purpose

Answers every type-matchup question the app asks (how much damage an attacking type does to a Pokémon, what a Pokémon or squad is weak to, and which types a set of attacking types can hit super-effectively) from one pure, chart-driven source of truth that works in the browser and on a server.

## ADDED Requirements

### Requirement: Results come from the supplied type chart
All matchup results SHALL be computed from a type chart supplied by the caller, never from values built into the engine. With the committed modern chart, results SHALL match the modern (Gen 6+) type rules.

#### Scenario: Custom chart changes results
- **WHEN** the engine is given a chart where fire→grass is 1 instead of 2
- **THEN** the multiplier of fire against a pure Grass Pokémon is 1

#### Scenario: Modern chart
- **WHEN** the engine is given the committed chart
- **THEN** dragon against a pure Fairy Pokémon is 0 and steel against a pure Fairy Pokémon is 2

### Requirement: Single-type defensive multiplier
For a defender with one type, the multiplier of an attacking type SHALL equal the chart value for that attacker/defender pair.

#### Scenario: Every pair matches the chart
- **WHEN** computing the multiplier for each of the 324 attacking/defending type pairs against a single-type defender
- **THEN** each result equals the chart value for that pair

### Requirement: Dual-type defensive multiplier
For a defender with two types, the multiplier of an attacking type SHALL be the product of the chart values against each of its types, giving one of 0, 0.25, 0.5, 1, 2 or 4. The order of the two types SHALL NOT affect the result.

#### Scenario: Fire/Flying
- **WHEN** computing multipliers against a Fire/Flying defender
- **THEN** rock is 4, water and electric are 2, grass and bug are 0.25, and ground is 0

#### Scenario: Immunity wins over weakness
- **WHEN** computing electric against a Water/Ground defender
- **THEN** the result is 0, even though water alone takes 2 from electric

#### Scenario: Type order does not matter
- **WHEN** computing any attacking type against Water/Ground and against Ground/Water
- **THEN** both results are equal

### Requirement: Defensive profile
The engine SHALL produce a defensive profile for a defender: the multiplier for each of the 18 attacking types, in the canonical type order.

#### Scenario: Profile is complete
- **WHEN** producing the profile for any defender
- **THEN** it contains exactly 18 entries, one per attacking type, in canonical order

#### Scenario: Profile groups
- **WHEN** producing the profile for a Normal/Ghost defender
- **THEN** normal, fighting and ghost are 0, dark is 2, and poison and bug are 0.5

### Requirement: Defensive modifiers
A defender MAY carry defensive modifiers that adjust the result for a specific attacking type after the type product is computed: `immune` sets it to 0, and `scale` multiplies it by a positive factor. A defender without modifiers SHALL get the plain type result.

#### Scenario: Immunity modifier
- **WHEN** a pure Electric defender carries an `immune` modifier for ground
- **THEN** ground against it is 0 and every other attacking type is unchanged

#### Scenario: Scale modifier
- **WHEN** a pure Ice defender carries `scale` modifiers of 0.5 for fire and for ice
- **THEN** fire against it is 1 and ice against it is 0.25

#### Scenario: No modifiers
- **WHEN** a defender carries no modifiers
- **THEN** every result equals the plain type result

### Requirement: Offensive coverage from attacking types
Given a set of attacking types, the engine SHALL list which of the 18 defending types at least one of them hits super-effectively (covered) and which none of them do (uncovered), each in canonical order. An empty set covers nothing.

#### Scenario: Two attacking types
- **WHEN** computing coverage for fire and water
- **THEN** covered is ground, rock, bug, steel, fire, grass and ice, and the other 11 types are uncovered

#### Scenario: No super-effective hits
- **WHEN** computing coverage for normal alone
- **THEN** no type is covered

#### Scenario: Empty set
- **WHEN** computing coverage for no attacking types
- **THEN** all 18 types are uncovered

### Requirement: Best attack against a defender
Given a set of attacking types and a defender, the engine SHALL return the highest multiplier any of the attacking types achieves against that defender, together with the attacking types that achieve it. An empty set of attacking types SHALL return no result rather than a multiplier.

#### Scenario: Picks the strongest attacking type
- **WHEN** finding the best of fire and water against a Rock/Ground defender
- **THEN** the multiplier is 4, achieved by water

#### Scenario: Ties are all reported
- **WHEN** finding the best of water and grass against a pure Ground defender
- **THEN** the multiplier is 2, achieved by both water and grass, in canonical order

### Requirement: Squad defensive summary
For a squad (any number of defenders, including none), the engine SHALL report for each of the 18 attacking types how many members take more than 1× (weak), exactly 1× (neutral), more than 0 but less than 1× (resist) and 0× (immune), and how many of the weak members take 4× or more.

#### Scenario: Counts per attacking type
- **WHEN** summarizing a squad of Fire/Flying, Water/Ground and pure Grass
- **THEN** for electric the counts are weak 1 (Fire/Flying), neutral 0, resist 1 (Grass) and immune 1 (Water/Ground)

#### Scenario: Quadruple weaknesses are counted
- **WHEN** summarizing a squad of Fire/Flying and Water/Ground
- **THEN** for rock the weak count is 1 and the 4× count is 1, and for grass the weak count is 1 and the 4× count is 1

#### Scenario: Empty squad
- **WHEN** summarizing a squad with no members
- **THEN** every attacking type has all counts at 0 and is not a problem type

### Requirement: Problem types
An attacking type SHALL be flagged as a problem for a squad when 3 or more members are weak to it and no member resists it or is immune to it.

#### Scenario: Shared weakness without an answer
- **WHEN** a squad has three pure Fire members and nothing that resists water
- **THEN** water is flagged as a problem type

#### Scenario: One resist clears the flag
- **WHEN** a pure Water member is added to that squad
- **THEN** water is no longer flagged as a problem type

### Requirement: Squad offensive coverage
For a squad, the engine SHALL compute offensive coverage from the union of all members' own types, using the offensive coverage rules above.

#### Scenario: Union of member types
- **WHEN** computing coverage for a squad of pure Fire and pure Water members
- **THEN** the result equals the coverage for the attacking types fire and water

### Requirement: Engine calls are pure
Engine results SHALL depend only on their inputs; the engine SHALL NOT modify its inputs and SHALL return equal results for equal inputs.

#### Scenario: Inputs unchanged
- **WHEN** any engine function is called with a frozen chart and frozen defenders
- **THEN** it returns normally and the inputs are unchanged
