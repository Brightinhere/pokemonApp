# Spec Delta

## MODIFIED Requirements

### Requirement: Top-level routes
The app SHALL provide these client-side routes: `/` (Pokédex), `/pokemon/:name` (Pokémon detail), `/squads` (squad list), `/squads/:id` (single squad) and `/squad` (a shared squad, described by its query). Until their feature changes land, each route SHALL render a placeholder page naming the feature.

#### Scenario: Known route renders
- **WHEN** the user opens `/squads`
- **THEN** the squad list page (or its placeholder) is shown inside the app frame

#### Scenario: Route parameter is available
- **WHEN** the user opens `/pokemon/pikachu`
- **THEN** the detail page (or its placeholder) is shown and has access to the name `pikachu`

#### Scenario: Shared squad route
- **WHEN** the user opens `/squad?m=6,94`
- **THEN** the shared squad view is shown inside the app frame
