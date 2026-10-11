# Spec Delta

## ADDED Requirements

### Requirement: Score breakdown
Each suggestion, for additions and replacements, SHALL show its score gain split into a defense part and an attack part, each signed ("Defense +18 · Attack +1"; a zero part reads "0"). The two parts SHALL add up to the gain used for ranking.

#### Scenario: Defense-only suggestion
- **WHEN** Dark/Steel is suggested for the example five-member squad (Charizard, Gyarados, Dragonite, Venusaur, Gengar)
- **THEN** it shows "Defense +19 · Attack 0"

#### Scenario: Mixed suggestion
- **WHEN** Fairy/Steel is suggested for the same squad
- **THEN** it shows "Defense +18 · Attack +1", and it ranks level with Dark/Steel on gain (19)

#### Scenario: Replacement costs show as negative parts
- **WHEN** a replacement suggestion makes the squad's defense worse
- **THEN** its defense part is negative, shown with a minus sign

## MODIFIED Requirements

### Requirement: Squad score
Suggestions SHALL be ranked by how much they raise a squad score computed from types alone. The score is a defense part plus an attack part. The attack part is +1 per defending type the squad's own types hit super-effectively. The defense part is minus, for each attacking type: 2 per weak member beyond the number that resist or are immune, 1 per member taking 4×, and 6 if it is a problem type.

#### Scenario: A problem type costs most
- **WHEN** two candidates differ only in that one resists the squad's problem type
- **THEN** the one that resists it ranks higher
