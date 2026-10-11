// Pure, UI-free game logic lives here. See README.md.
export {
  PROBLEM_WEAK_THRESHOLD,
  classify,
  createTypeEngine,
  type BestAttack,
  type Coverage,
  type Defender,
  type DefensiveModifier,
  type Effectiveness,
  type SquadSummaryRow,
  type TypeEngine,
  type TypeMultiplier,
} from './typeEffectiveness'
export {
  SCORE_WEIGHTS,
  recommend,
  scoreParts,
  scoreSquad,
  type RecommendInput,
  type ScoreParts,
  type Suggestion,
  type SuggestionReasons,
} from './recommend'
