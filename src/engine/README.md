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
