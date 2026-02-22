export const CHASE_ACE_CARD_COUNT = 3 as const;

export const CHASE_ACE_PHASES = [
  'locked',
  'ready',
  'shuffling',
  'pick',
  'revealing',
  'result'
] as const;

export type ChaseAcePhase = (typeof CHASE_ACE_PHASES)[number];

export const CHASE_ACE_MULTIPLIER = 2 as const;

export const CHASE_ACE_DURATION_LADDER_MS = [
  30_000,
  120_000,
  240_000,
  480_000,
  480_000
] as const;

export const CHASE_ACE_SHUFFLE_INTERVAL_MS = 220 as const;

export const CHASE_ACE_REVEAL_SELECTED_MS = 280 as const;
export const CHASE_ACE_REVEAL_REST_DELAY_MS = 220 as const;
export const CHASE_ACE_REVEAL_REST_MS = 240 as const;

export const CHASE_ACE_CARD_SHUFFLERS_BUILDING_ID = 'CardShufflers' as const;
export const CHASE_ACE_CARD_SHUFFLERS_UNLOCK_LEVEL = 1 as const;

export interface ChaseAceCardTransform {
  x: number;
  y: number;
  rotateDeg: number;
  z: number;
}

export interface ChaseAceShuffleStep {
  durationMs: number;
  cards: readonly [ChaseAceCardTransform, ChaseAceCardTransform, ChaseAceCardTransform];
}

export const CHASE_ACE_SHUFFLE_PATTERN: readonly ChaseAceShuffleStep[] = [
  {
    durationMs: CHASE_ACE_SHUFFLE_INTERVAL_MS,
    cards: [
      { x: -104, y: 0, rotateDeg: -3, z: 1 },
      { x: 0, y: -10, rotateDeg: 0, z: 3 },
      { x: 104, y: 0, rotateDeg: 3, z: 2 }
    ]
  },
  {
    durationMs: CHASE_ACE_SHUFFLE_INTERVAL_MS,
    cards: [
      { x: 104, y: 0, rotateDeg: 3, z: 2 },
      { x: -104, y: 0, rotateDeg: -3, z: 1 },
      { x: 0, y: -10, rotateDeg: 0, z: 3 }
    ]
  },
  {
    durationMs: CHASE_ACE_SHUFFLE_INTERVAL_MS,
    cards: [
      { x: 0, y: -10, rotateDeg: 0, z: 3 },
      { x: 104, y: 0, rotateDeg: 3, z: 2 },
      { x: -104, y: 0, rotateDeg: -3, z: 1 }
    ]
  },
  {
    durationMs: CHASE_ACE_SHUFFLE_INTERVAL_MS,
    cards: [
      { x: -104, y: 0, rotateDeg: 0, z: 1 },
      { x: 0, y: 0, rotateDeg: 0, z: 2 },
      { x: 104, y: 0, rotateDeg: 0, z: 3 }
    ]
  }
] as const;

export const CHASE_ACE_WIN_LOSS_RULES = Object.freeze({
  winWhenSelectedMatchesAce: true,
  resetStreakOnLoss: true,
  extendDurationOnWin: true
});
