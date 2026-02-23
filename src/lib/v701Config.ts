export const ACE_TOKEN_PASSIVE_INTERVAL_SECONDS = 120 as const;
export const TURBO_TAPPER_UNLOCK_CHIPS = 1_000_000_000 as const;
export const TURBO_TAPPER_TAPS_PER_SECOND = 2 as const;
export const TURBO_TAPPER_OFFLINE_TAP_VALUE = 35 as const;

export const DAILY_TAP_TARGET = 25 as const;

export const DAILY_REWARD_TABLE = [
  { aceTokens: 2, chipBoost: 25_000, cpsMultiplier: 1, cpsDurationMs: 0 },
  { aceTokens: 3, chipBoost: 50_000, cpsMultiplier: 1, cpsDurationMs: 0 },
  { aceTokens: 4, chipBoost: 100_000, cpsMultiplier: 1, cpsDurationMs: 0 },
  { aceTokens: 5, chipBoost: 250_000, cpsMultiplier: 1, cpsDurationMs: 0 },
  { aceTokens: 6, chipBoost: 500_000, cpsMultiplier: 1, cpsDurationMs: 0 },
  { aceTokens: 8, chipBoost: 750_000, cpsMultiplier: 1.5, cpsDurationMs: 5 * 60 * 1000 },
  { aceTokens: 10, chipBoost: 1_000_000, cpsMultiplier: 2, cpsDurationMs: 10 * 60 * 1000 }
] as const;

export const THEME_NAMES = [
  'Garage / Home Game',
  'Casino Floor',
  'High Roller Suite',
  'VIP Lounge',
  'Back Alley Poker Den'
] as const;

export const PERSONALITY_TOAST_DURATION_MS = 1800 as const;
export const PERSONALITY_TOAST_COOLDOWN_MS = 7000 as const;
