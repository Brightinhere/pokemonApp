# Design

## Context

- `typeEngine.squadSummary` already returns, per attacking type, `weak`, `resist`, `immune`, `quadWeak` and `isProblem`. Defense coverage needs no new engine logic.
- `scoreSquad` in `src/engine/recommend.ts` adds coverage and subtracts the defensive penalties in one number. `recommend` stores only `gain`.
- `Coverage` in `SquadAnalysis.tsx` renders two columns (covered / not covered). Tests find them by the list names "Covered types" and "Uncovered types".

See proposal.md for motivation and the specs for behavior.

## Goals / Non-Goals

**Goals:**
- The breakdown comes from the same calculation as the ranking, so the two parts always add up to the gain.
- Defense coverage reads like attack coverage, in the same chips and the same order.

**Non-Goals:**
- Changing weights or the ranking. Every existing recommender test keeps passing unchanged.
- A new view of the matchup sheet. Defense coverage summarises it and doesn't replace it.

## Decisions

### D1. `scoreParts` is the single source; `scoreSquad` sums it
Add `scoreParts(engine, squad): { defense: number; attack: number }` and make `scoreSquad` return `defense + attack`. `recommend` computes the parts once for the current squad and once per candidate, and stores `breakdown = { defense: after.defense − before.defense, attack: after.attack − before.attack }` with `gain = breakdown.defense + breakdown.attack`.
- **Why:** if the parts were derived somewhere else (for example from reasons), they could drift from the ranking.
- **Alternative:** compute the breakdown in the UI by calling the engine again. Rejected because it duplicates the base/candidate logic for replacements.

### D2. Breakdown text lives in `suggestionText.ts`
`breakdownText({ defense, attack })` returns `"Defense +19 · Attack 0"`, using a real minus sign (U+2212) for negatives. It's shown as a small line under the type chips on every card, with the effect label for replacements next to it as today. Screen readers read the visible text as is. The middle dot is punctuation that they skip, so no separate accessible text is needed.

### D3. One "Coverage" section, two blocks
`Coverage` becomes a section headed "Coverage" with two blocks, each a two-column grid on `md` and up:
- **Attack:** "Covered" / "Not covered". The list names "Covered types" and "Uncovered types" stay, so existing tests keep working.
- **Defense:** "Resisted" / "Not resisted", with list names "Resisted types" and "Not resisted types".

A not-resisted type with weak members renders as the chip followed by "3 weak" in `text-ink-soft`. The list item's accessible text is "Rock, 3 members weak". Types nobody is weak to show the chip alone.
- **Why not highlight problem types here too:** they already lead the page with their own explanations and a bar in the sheet. The weak count is enough to make the link.

## Risks / Trade-offs

- **[Raw points are abstract]** → The numbers are only meant to show direction and balance (mostly defense or mostly attack). The reasons beneath still explain the "why" in words.
- **[Two parts look precise but the weights are a judgment call]** → That's unchanged from today. The breakdown makes the judgment visible instead of hidden.
