# Design direction

The visual direction for Squad Lab, agreed in a design session on 2026-10-10. Feature changes
(starting with `pokedex`) build their screens from this. The `prototype/` folder shows it with
real data; it is a reference, not app code.

## Who it's for

Players who know their types and come to check, compare and decide. The main job is showing
where a squad is weak, quickly and unambiguously. The list, search and detail pages feed Pokémon
into that.

## Principles

1. **Colour belongs to the Pokémon.** The 18 type colours (from `src/theme/index.css`) and the
   official artwork are the only colour. The interface itself is neutral: dark text on a light
   grey background, flipped in dark mode. There is no brand or accent colour, so colour always
   means a type.
2. **Width carries density.** One typeface, Archivo, uses its width axis: wide for identity
   (Pokémon names, page titles), normal for reading, condensed for dense data (type chips, table
   headers, stat labels).
3. **Marks, not colours, carry meaning.** Matchups are drawn as ink marks that read in greyscale
   and for colour-blind players.
4. **One bold element per screen.** On the squad page, that's the matchup sheet. On the detail
   page, the Pokémon's name. Everything around it stays quiet.
5. **Rows, not cards, for lists.** The Pokédex is a dense, sortable list. Cards are only for
   things that really are discrete objects, like the six squad slots.

## Tokens

| Token       | Light     | Dark      | Role                                     |
| ----------- | --------- | --------- | ---------------------------------------- |
| Paper       | `#EEF1F4` | `#121722` | Page background                          |
| Panel       | `#FFFFFF` | `#1A2130` | Rows, raised surfaces                    |
| Ink         | `#18202E` | `#E6EAF0` | Text, marks, primary buttons, focus ring |
| Ink soft    | `#4A5568` | `#9AA5B5` | Secondary text                           |
| Rule        | `#C9D0D9` | `#2C3546` | Dividers, outlines                       |
| Rule strong | `#8D97A5` | `#566175` | Input borders, neutral marks             |

The existing `--color-accent` token (`#c22e28`, which is also the Fighting colour) is retired.

**Type:** Archivo variable (`wdth` 62–125, `wght` 100–900), self-hosted or from Google Fonts.

| Role                                   | Width | Weight  | Size                      |
| -------------------------------------- | ----- | ------- | ------------------------- |
| Hero name (detail)                     | 125%  | 850     | `clamp(44px, 9vw, 104px)` |
| Page title                             | 125%  | 800     | 36                        |
| Section title, list names              | 125%  | 700–750 | 21                        |
| Body                                   | 100%  | 400     | 16                        |
| Type chips, table headers, stat labels | 75%   | 600–700 | 14                        |

Scale: 12 / 14 / 16 / 21 / 28 / 36 / 60. Tabular figures everywhere (stats and dex numbers line
up). Sentence case, no all-caps labels. Dex numbers are four digits: `#0006`.

**Shape:** 3px radius for chips and toggles (tile-like), 6px for panels, rows and buttons.
Focus is a 3px ink outline with a 2px offset.

## The matchup marks

| Multiplier  | Mark                |
| ----------- | ------------------- |
| 4×          | two filled squares  |
| 2×          | one filled square   |
| 1×          | small grey dot      |
| ½×          | hollow square       |
| ¼×          | small hollow square |
| 0× (immune) | hollow circle       |

Filled means the Pokémon takes more damage; hollow means it takes less. Each mark has an
accessible label ("takes 2×"). A **problem type** (3+ members weak, none resisting, see the
`type-effectiveness` spec) gets an 8px ink bar in the row margin. Above the sheet, a plain
sentence says what's wrong and which types would fix it, not a big number.

## Motion

Nothing animates on page load. The one orchestrated moment: when a member is added to a squad,
their column's marks stamp in (a 260ms scale-in, staggered 18ms per row), so you can see what the
new member changed. It is skipped when the user prefers reduced motion.

## Writing

Plain, sentence case, from the player's side: "Add to Kanto run", "One slot left", "Back to the
Pokédex". Problems are stated with their fix ("Add or swap in a Pokémon with one of these types
to take the hit").

## Mobile

- The squad tray collapses into a "Squad 5/6" button.
- Pokédex filters fold into a "Filters" disclosure.
- List rows show art, name, types and the add button.
- Squad slots become a 2–3 column grid.
- The matchup sheet scrolls sideways inside its own container. The page itself never scrolls
  horizontally.

## Prototype

Open `prototype/squad.html`, `prototype/index.html` or `prototype/detail.html` in a browser (a
static file server works best). `data.js` is a snapshot of `src/data` taken for the prototype.
Known gaps, deliberately left for real implementation: filters and sorting are not wired up, and
the form switcher and "Add" buttons don't do anything.
