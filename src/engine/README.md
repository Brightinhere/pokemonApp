# `src/engine`

Pure, UI-free game logic: type effectiveness, squad scoring, and later perhaps battle rules.

## The rule

Code in this folder must run anywhere JavaScript runs — the browser app today, a Node battle
server tomorrow. So it may **not** import:

- React, Redux, React Router, or any other UI/state library
- anything from `src/` outside `src/engine/`, except the shared data types in `src/data/types.ts`

and it may **not** use browser globals (`window`, `document`, `localStorage`, `fetch`, ...).

Data comes in as function arguments (e.g. the type chart), results go out as plain values.

## How it is enforced

- **ESLint** (`eslint.config.js`): restricted imports and globals for `src/engine/**`.
- **TypeScript** (`tsconfig.engine.json`): this folder is compiled without the DOM library, so a
  stray `document` or `window` is a type error.

When a server exists, this folder can be extracted into its own package with no code changes.

## Type effectiveness (`typeEffectiveness.ts`)

`createTypeEngine(chart)` binds the type logic to a chart (`chart[attacker][defender]`). App code
uses the ready-made instance bound to the committed modern chart:

```ts
import { typeEngine } from '../data/typeEngine'

const charizard = { types: ['fire', 'flying'] } // any PokemonEntry works as-is

typeEngine.multiplier('rock', charizard) // 4
typeEngine.multiplier('ground', charizard) // 0
typeEngine.defensiveProfile(charizard) // [{ type: 'normal', multiplier: 1 }, ... 18 entries]

typeEngine.coverage(['fire', 'water']).covered
// ['ground', 'rock', 'bug', 'steel', 'fire', 'grass', 'ice']

typeEngine.bestAttack(['fire', 'water'], { types: ['rock', 'ground'] })
// { multiplier: 4, types: ['water'] }

typeEngine.squadSummary(squad) // 18 rows: { attackingType, weak, neutral, resist, immune, quadWeak, isProblem }
typeEngine.squadCoverage(squad) // coverage of all members' own types
```

- Results and lists always follow the canonical type order (`POKEMON_TYPES`).
- `classify(multiplier)` maps a number to `'immune' | 'resist' | 'neutral' | 'weak'`.
- A type is a **problem** for a squad when at least `PROBLEM_WEAK_THRESHOLD` (3) members are weak
  to it and none resist it or are immune to it.

### Defensive modifiers

A defender can carry `modifiers`, applied after the type product, in order. They are plain data,
so they can be stored, shared in URLs, or sent to a server.

```ts
const levitating = {
  types: ['electric'],
  modifiers: [{ attackingType: 'ground', effect: 'immune' }],
}
typeEngine.multiplier('ground', levitating) // 0

const thickFat = {
  types: ['ice'],
  modifiers: [
    { attackingType: 'fire', effect: 'scale', factor: 0.5 },
    { attackingType: 'ice', effect: 'scale', factor: 0.5 },
  ],
}
typeEngine.multiplier('fire', thickFat) // 1
typeEngine.multiplier('ice', thickFat) // 0.25
```

No abilities are mapped to modifiers yet; that is a later change.
