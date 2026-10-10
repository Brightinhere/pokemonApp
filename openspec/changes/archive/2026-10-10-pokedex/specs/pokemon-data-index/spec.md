# Spec Delta

## MODIFIED Requirements

### Requirement: Form classification
Each entry SHALL have exactly one form category: `default` (the species' default form), `regional` (Alolan, Galarian, Hisuian or Paldean forms), `mega`, `gmax`, or `other` (any remaining alternate form). Totem forms and cap forms SHALL be `other` even when their name contains a region.

#### Scenario: Categories assigned
- **WHEN** the dataset is generated
- **THEN** `charizard` is `default`, `vulpix-alola` is `regional`, `charizard-mega-x` is `mega`, `charizard-gmax` is `gmax`, and `rotom-wash` is `other`

#### Scenario: Battle-only flag
- **WHEN** reading the entries for `charizard-mega-x` and `vulpix-alola`
- **THEN** `charizard-mega-x` has `isBattleOnly` true and `vulpix-alola` has `isBattleOnly` false

#### Scenario: Totem and cap forms are not regional
- **WHEN** the dataset is generated
- **THEN** `raticate-totem-alola` and `pikachu-alola-cap` are `other`, while `raticate-alola`, `darmanitan-galar-zen` and `tauros-paldea-combat-breed` stay `regional`
