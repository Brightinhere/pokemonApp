# Spec Delta

## Purpose

Lets a player send a squad to anyone as a link, with no account or server: the link carries the members and name, opens a read-only view with the full analysis, and can be saved as the recipient's own squad.

## ADDED Requirements

### Requirement: Share link format
A squad's share link SHALL be `/squad?m=<ids>&n=<name>`, where `ids` are the members' index entry ids in squad order, comma-separated, and `name` is the URL-encoded squad name.

#### Scenario: Link for a squad
- **WHEN** the user shares "Kanto run" containing Charizard (6), Mega Charizard X (10034) and Gengar (94)
- **THEN** the link is `/squad?m=6,10034,94&n=Kanto+run` on the app's own origin

### Requirement: Copying the link
A squad's page SHALL offer "Copy share link", which copies the full link to the clipboard and confirms "Link copied". If the clipboard is unavailable, the link SHALL be shown in a selectable field instead.

#### Scenario: Copy
- **WHEN** the user chooses "Copy share link"
- **THEN** the full link is on the clipboard and "Link copied" is shown

#### Scenario: No clipboard access
- **WHEN** writing to the clipboard fails
- **THEN** the link is shown in a read-only field, selected, so the user can copy it themselves

### Requirement: Shared view
`/squad?m=...` SHALL show the squad's name (or "Shared squad" without one), its members and the full analysis, read-only: no rename, reorder, remove or delete. Opening it SHALL NOT change the user's own squads or which squad is current.

#### Scenario: Opening a shared link
- **WHEN** someone opens `/squad?m=6,130,149,3,94&n=Kanto+run`
- **THEN** they see "Kanto run" with Charizard, Gyarados, Dragonite, Venusaur and Gengar and the matchup sheet, and their own squads are unchanged

### Requirement: Invalid share links
Ids that are not whole numbers or not in the index SHALL be ignored, and only the first 6 valid ids SHALL be used; when anything was ignored, the view SHALL say some Pokémon in the link couldn't be shown. A link with no valid ids SHALL say it has no Pokémon in it and link to the Pokédex.

#### Scenario: Partly invalid
- **WHEN** someone opens `/squad?m=6,abc,99999,94`
- **THEN** the squad shows Charizard and Gengar, with a note that some Pokémon in the link couldn't be shown

#### Scenario: Nothing valid
- **WHEN** someone opens `/squad?m=abc`
- **THEN** the page says the link has no Pokémon in it and links to the Pokédex

#### Scenario: Too many
- **WHEN** a link lists 8 valid ids
- **THEN** only the first 6 are shown, with the same note

### Requirement: Saving a shared squad
The shared view SHALL offer "Save as my squad", which creates a new squad with the shared name (or "Shared squad") and members, makes it current, and opens its page.

#### Scenario: Save
- **WHEN** the user opens a shared "Kanto run" link and chooses "Save as my squad"
- **THEN** a new squad "Kanto run" with the same members in the same order is created, becomes current, and its page opens
