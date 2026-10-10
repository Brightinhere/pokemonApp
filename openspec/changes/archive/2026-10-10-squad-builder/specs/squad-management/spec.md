# Spec Delta

## Purpose

Lets players keep squads of up to six Pokémon in their browser: create, name, fill, reorder and delete them, add Pokémon straight from the Pokédex, and see the current squad at a glance.

## ADDED Requirements

### Requirement: Creating squads
The user SHALL be able to create a squad from the squad list. A new squad SHALL be empty, be named "Squad N" with the lowest number not already used by a squad called "Squad N", become the current squad, and open at `/squads/:id`.

#### Scenario: First squad
- **WHEN** the user has no squads and chooses "New squad"
- **THEN** an empty squad named "Squad 1" is created, it becomes the current squad, and its page opens

#### Scenario: Next free number
- **WHEN** squads named "Squad 1" and "Squad 3" exist and the user chooses "New squad"
- **THEN** the new squad is named "Squad 2"

### Requirement: Squad list
`/squads` SHALL list every squad with its name, its members' artwork and its member count, most recently changed first, each linking to its page, and SHALL mark the current squad. With no squads it SHALL explain that squads hold up to six Pokémon and offer "New squad".

#### Scenario: Empty list
- **WHEN** the user opens `/squads` with no squads
- **THEN** the page explains what a squad is and offers "New squad"

#### Scenario: Listing squads
- **WHEN** the user has two squads and changed "Kanto run" most recently
- **THEN** "Kanto run" is listed first, with its members' artwork and count, and links to its page

### Requirement: Renaming squads
The user SHALL be able to rename a squad. Names SHALL be trimmed and between 1 and 40 characters; an empty name SHALL be rejected with a message, keeping the previous name.

#### Scenario: Rename
- **WHEN** the user renames "Squad 1" to "  Kanto run  "
- **THEN** the squad is called "Kanto run" everywhere it appears

#### Scenario: Empty name rejected
- **WHEN** the user tries to rename a squad to an empty name
- **THEN** a message says the name can't be empty and the previous name is kept

### Requirement: Deleting squads
Deleting a squad SHALL require a second, explicit confirmation. After deletion the user SHALL land on `/squads`; if the deleted squad was current, the most recently changed remaining squad SHALL become current, or none if there are no squads left.

#### Scenario: Confirmed delete
- **WHEN** the user chooses "Delete squad" and then confirms
- **THEN** the squad is removed, the squad list is shown, and the squad is gone after a reload

#### Scenario: Cancelled delete
- **WHEN** the user chooses "Delete squad" and then cancels
- **THEN** the squad is unchanged

### Requirement: The current squad
Exactly one squad SHALL be current whenever at least one squad exists. Creating a squad, opening a squad's page, or saving a shared squad SHALL make that squad current.

#### Scenario: Opening a squad makes it current
- **WHEN** the user opens the page of a squad that is not current
- **THEN** that squad becomes the current squad, and the app bar tray shows it

### Requirement: Adding from the Pokédex
Each Pokédex row and the detail page SHALL offer to add that Pokémon or form to the current squad, naming the squad on the detail page ("Add to Kanto run"). If no squad exists, adding SHALL first create one as in "Creating squads" (without navigating away). Each add SHALL be confirmed in a polite live region. When the current squad has six members, the add actions SHALL be unavailable and say the squad is full.

#### Scenario: Add from a row
- **WHEN** the current squad is "Kanto run" with three members and the user chooses "Add" on Gengar's row
- **THEN** Gengar becomes the fourth member, the page stays on the Pokédex, and "Added Gengar to Kanto run" is announced

#### Scenario: Add with no squads
- **WHEN** the user has no squads and chooses "Add" on Charizard's row
- **THEN** a squad named "Squad 1" is created with Charizard as its only member and becomes current

#### Scenario: Full squad
- **WHEN** the current squad has six members
- **THEN** the add actions are unavailable and explain that the squad is full

### Requirement: Editing members
On a squad's page the user SHALL be able to remove a member and move a member one place earlier or later. Moving the first member earlier or the last member later SHALL NOT be offered.

#### Scenario: Reorder
- **WHEN** the squad is Charizard, Gyarados, Gengar and the user moves Gengar earlier
- **THEN** the order becomes Charizard, Gengar, Gyarados

#### Scenario: Remove
- **WHEN** the user removes Gyarados from a squad of three
- **THEN** the squad has two members and one more slot is free

### Requirement: Soft warnings
A squad's page SHALL warn, without blocking anything, when two members share a species (e.g. Charizard and Mega Charizard X) and when more than one member is a Mega form.

#### Scenario: Same species
- **WHEN** a squad contains Charizard and Mega Charizard X
- **THEN** a warning says Charizard appears more than once, and both stay in the squad

#### Scenario: Two Megas
- **WHEN** a squad contains Mega Charizard X and Mega Gengar
- **THEN** a warning says only one Mega Evolution can be used in a battle

### Requirement: Squad tray
While a current squad exists, the app bar SHALL show its six slots (members' artwork in order, then empty slots) as a link to its page, labelled with the squad's name and member count. On screens 560px wide or less it SHALL collapse to "Squad n/6". Without squads, no tray SHALL be shown.

#### Scenario: Tray follows adds
- **WHEN** the user adds a Pokémon to a current squad of two
- **THEN** the tray shows three filled slots and three empty ones

#### Scenario: Phone width
- **WHEN** the app is shown 390px wide with a current squad of five
- **THEN** the tray reads "Squad 5/6" and the page has no horizontal scroll

### Requirement: Unknown squad
Opening `/squads/:id` for an id that doesn't exist SHALL show a message that the squad was not found, with a link to the squad list.

#### Scenario: Deleted or mistyped squad
- **WHEN** the user opens `/squads/does-not-exist`
- **THEN** a message says the squad was not found and links to `/squads`

### Requirement: Squads persist in the browser
Squads and the current squad SHALL be saved in the browser and restored on the next visit. Members that no longer exist in the index SHALL be dropped on load. Saved data that is unreadable or invalid SHALL NOT break the app: it SHALL be kept aside under a backup key and the app SHALL start with no squads. If browser storage is unavailable, squads SHALL still work for the current visit.

#### Scenario: Reload
- **WHEN** the user creates "Kanto run" with three members and reloads the page
- **THEN** "Kanto run" is still there with the same members in the same order, and is still current

#### Scenario: Corrupt data
- **WHEN** the saved squads are not valid JSON
- **THEN** the app opens normally with no squads, and the unreadable data is kept under the backup key

#### Scenario: Storage blocked
- **WHEN** reading or writing browser storage throws
- **THEN** squads can still be created and used until the page is closed
