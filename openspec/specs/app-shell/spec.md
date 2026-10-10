# app-shell Specification

## Purpose

Defines the application frame that every feature lives in: the top-level routes and navigation, not-found handling, light/dark theming with type colours, and how live PokeAPI data is fetched and cached.

## Requirements

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

### Requirement: Deep links work on load
Every route SHALL render correctly when opened directly or refreshed in the browser, not only when reached by in-app navigation.

#### Scenario: Refresh on a nested route
- **WHEN** the user refreshes the browser on `/pokemon/pikachu` while running the built app with SPA fallback
- **THEN** the detail page (or its placeholder) is shown instead of a server 404

### Requirement: Not-found page
Any path that matches no route SHALL show a not-found page inside the app frame with a link back to the Pokédex.

#### Scenario: Unknown path
- **WHEN** the user opens `/does-not-exist`
- **THEN** a not-found message is shown with a link to `/`

### Requirement: Persistent navigation
The app frame SHALL show navigation to the Pokédex and the squad list on every page, usable with keyboard alone.

#### Scenario: Navigate by keyboard
- **WHEN** the user tabs to the "Squads" navigation link and presses Enter
- **THEN** the app navigates to `/squads` without a full page reload

### Requirement: Light and dark mode follow the system
The app SHALL render in a light or dark colour scheme matching the operating system preference and SHALL switch when that preference changes, without reload.

#### Scenario: Dark system preference
- **WHEN** the system prefers a dark colour scheme
- **THEN** the app renders with its dark theme

#### Scenario: Preference changes while open
- **WHEN** the system preference changes from light to dark while the app is open
- **THEN** the app switches to its dark theme without a reload

### Requirement: Type colours
Each of the 18 battle types SHALL have a distinct theme colour, usable by any UI component, with readable text contrast (WCAG AA) for a type label in both light and dark mode.

#### Scenario: Type label contrast
- **WHEN** a type label for any of the 18 types is rendered in either theme
- **THEN** its text-to-background contrast ratio is at least 4.5:1

### Requirement: Live data is cached per session
Live PokeAPI requests made by the app SHALL be cached in memory for the browser session, so the same resource is not requested twice in one session while a cached copy exists. Failed requests SHALL surface an error state to the calling page rather than crashing the app.

#### Scenario: Repeat request served from cache
- **WHEN** a page requests the same PokeAPI resource a second time in one session
- **THEN** no second network request to PokeAPI is made

#### Scenario: Network failure
- **WHEN** a live PokeAPI request fails
- **THEN** the requesting page receives an error state and the rest of the app keeps working
