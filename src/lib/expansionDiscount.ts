import { derived, get, readonly, writable } from 'svelte/store';
import { rollDice, getOutcomeGroup, generateSeed } from './crapsRng';

// ============================================
// V1200 CRAPS RUSH - EXPANSION DISCOUNT STORE
// ============================================
// Discount is always 50% off expansion purchases
// Duration stacks, not discount %
// Daily cap: 60 minutes of discount per day
// Cooldown: 3 minutes between plays
// Streak breaker: after 3 wins, next round forced LOSE

// Constants (Locked per V1200)
export const EXPANSION_DISCOUNT_PERCENT = 50; // Always 50%
export const DAILY_CAP_MINUTES = 60;
export const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

// Reward durations per bet type (per correct prediction)
export const REWARD_DURATION_MS = {
  HIGH: 15 * 60 * 1000,   // 15 minutes for HIGH RISK (WIN)
  MEDIUM: 10 * 60 * 1000, // 10 minutes for MEDIUM RISK (BONUS)
  LOW: 5 * 60 * 1000      // 5 minutes for LOW RISK (SAFE)
} as const;

export type BetType = 'HIGH' | 'MEDIUM' | 'LOW';

export type GamePhase = 'IDLE' | 'BET_SELECT' | 'ROLL' | 'RESULT' | 'PAYOUT' | 'COOLDOWN';

export interface CrapsRushState {
  isUnlocked: boolean;
  isOpen: boolean;
  phase: GamePhase;
  roundId: number;
  betType: BetType | null;
  diceTotal: number | null;
  didWin: boolean | null;
  addedDurationMs: number;
  discountEndsAt: number; // Absolute timestamp when discount expires
  lastPlayAt: number;
  cooldownEndsAt: number; // Absolute timestamp when cooldown expires
  winStreak: number;
  dailyDiscountAccumulatedMinutes: number;
  lastDailyResetDate: string; // ISO date string for daily cap reset
  roundSeed: number; // For deterministic RNG
}

// Get today's date key for daily cap tracking
function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

// Create initial state
function createInitialState(): CrapsRushState {
  const today = getTodayDateKey();
  return {
    isUnlocked: false,
    isOpen: false,
    phase: 'IDLE',
    roundId: 0,
    betType: null,
    diceTotal: null,
    didWin: null,
    addedDurationMs: 0,
    discountEndsAt: 0,
    lastPlayAt: 0,
    cooldownEndsAt: 0,
    winStreak: 0,
    dailyDiscountAccumulatedMinutes: 0,
    lastDailyResetDate: today,
    roundSeed: 0
  };
}

// Internal writable store
const crapsRushStateInternal = writable<CrapsRushState>(createInitialState());
const crapsRushNowMs = writable<number>(Date.now());

// Exported readonly store
export const crapsRushState = readonly(crapsRushStateInternal);

// Derived stores for UI
export const crapsRushDiscountActive = derived(
  [crapsRushStateInternal, crapsRushNowMs],
  ([$state, $now]) => $state.discountEndsAt > $now
);

export const crapsRushRemainingMinutes = derived(
  [crapsRushStateInternal, crapsRushNowMs],
  ([$state, $now]) => {
    if ($state.discountEndsAt <= $now) return 0;
    const remainingMs = $state.discountEndsAt - $now;
    return Math.max(0, Math.ceil(remainingMs / 60000));
  }
);

export const crapsRushCooldownRemainingSeconds = derived(
  [crapsRushStateInternal, crapsRushNowMs],
  ([$state, $now]) => {
    if ($state.cooldownEndsAt <= $now) return 0;
    const remainingMs = $state.cooldownEndsAt - $now;
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
);

export const crapsRushCanPlay = derived(
  [crapsRushStateInternal, crapsRushNowMs],
  ([$state, $now]) => {
    // Check cooldown
    if ($state.cooldownEndsAt > $now) return false;
    // Check daily cap
    if ($state.dailyDiscountAccumulatedMinutes >= DAILY_CAP_MINUTES) return false;
    return true;
  }
);

// Helper to reset daily cap if it's a new day
function checkAndResetDailyCap(state: CrapsRushState): Partial<CrapsRushState> {
  const today = getTodayDateKey();
  if (state.lastDailyResetDate !== today) {
    return {
      dailyDiscountAccumulatedMinutes: 0,
      lastDailyResetDate: today
    };
  }
  return {};
}

// Exported functions

export function getCrapsRushSnapshot(): CrapsRushState {
  return get(crapsRushStateInternal);
}

export function setCrapsRushUnlocked(isUnlocked: boolean): void {
  crapsRushStateInternal.update((state) => {
    if (state.isUnlocked === isUnlocked) return state;
    if (!isUnlocked) {
      return {
        ...state,
        isUnlocked: false,
        isOpen: false,
        phase: 'IDLE'
      };
    }
    return {
      ...state,
      isUnlocked: true,
      phase: state.phase === 'IDLE' ? 'BET_SELECT' : state.phase
    };
  });
}

export function openCrapsRush(): void {
  crapsRushStateInternal.update((state) => {
    if (!state.isUnlocked) return state;
    // Check if we should reset daily cap
    const dailyReset = checkAndResetDailyCap(state);
    return {
      ...state,
      ...dailyReset,
      isOpen: true,
      phase: state.cooldownEndsAt > Date.now() ? 'COOLDOWN' : 'BET_SELECT'
    };
  });
}

export function closeCrapsRush(): void {
  crapsRushStateInternal.update((state) => ({
    ...state,
    isOpen: false
  }));
}

export function startRound(betType: BetType): void {
  const now = Date.now();
  crapsRushStateInternal.update((state) => {
    if (!state.isUnlocked) return state;
    if (state.phase !== 'BET_SELECT') return state;
    if (state.cooldownEndsAt > now) return state;
    if (state.dailyDiscountAccumulatedMinutes >= DAILY_CAP_MINUTES) return state;

    // Generate deterministic seed for this round
    const roundSeed = generateSeed(now, state.roundId + 1);

    return {
      ...state,
      phase: 'ROLL',
      roundId: state.roundId + 1,
      betType,
      diceTotal: null,
      didWin: null,
      addedDurationMs: 0,
      roundSeed
    };
  });
}

export function resolveRound(): void {
  crapsRushStateInternal.update((state) => {
    if (state.phase !== 'ROLL') return state;
    if (state.betType === null) return state;

    const now = Date.now();
    const { total } = rollDice(state.roundSeed);
    const outcome = getOutcomeGroup(total);

    // Determine if the prediction was correct
    let didWin = false;
    let addedDurationMs = 0;

    // Check streak breaker first: if winStreak >= 3, force this round to LOSE
    const isStreakBroken = state.winStreak >= 3;

    if (!isStreakBroken) {
      // Normal win/lose determination
      switch (state.betType) {
        case 'HIGH':
          // HIGH RISK: wins on 7 or 11 (WIN zone)
          didWin = outcome === 'WIN';
          break;
        case 'MEDIUM':
          // MEDIUM RISK: wins on 4,5,6,8,9,10 (BONUS zone)
          didWin = outcome === 'BONUS';
          break;
        case 'LOW':
          // LOW RISK: wins on anything except 2,3,12 (SAFE zone = not LOSE)
          didWin = outcome !== 'LOSE';
          break;
      }
    } else {
      // Streak breaker active - force LOSE
      didWin = false;
    }

    // Calculate reward if won
    if (didWin) {
      switch (state.betType) {
        case 'HIGH':
          addedDurationMs = REWARD_DURATION_MS.HIGH;
          break;
        case 'MEDIUM':
          addedDurationMs = REWARD_DURATION_MS.MEDIUM;
          break;
        case 'LOW':
          addedDurationMs = REWARD_DURATION_MS.LOW;
          break;
      }
    }

    // Check daily cap
    const minutesToAdd = Math.floor(addedDurationMs / 60000);
    const remainingCapMinutes = DAILY_CAP_MINUTES - state.dailyDiscountAccumulatedMinutes;
    const actualMinutesAdded = Math.min(minutesToAdd, remainingCapMinutes);
    const actualMsAdded = actualMinutesAdded * 60000;

    // Apply discount duration
    const newDiscountEndsAt = actualMsAdded > 0
      ? Math.max(state.discountEndsAt, now) + actualMsAdded
      : state.discountEndsAt;

    // Update streak
    const newStreak = didWin ? state.winStreak + 1 : 0;

    return {
      ...state,
      phase: 'RESULT',
      diceTotal: total,
      didWin,
      addedDurationMs: actualMsAdded,
      discountEndsAt: newDiscountEndsAt,
      lastPlayAt: now,
      cooldownEndsAt: now + COOLDOWN_MS,
      winStreak: didWin ? newStreak : 0,
      dailyDiscountAccumulatedMinutes: state.dailyDiscountAccumulatedMinutes + actualMinutesAdded
    };
  });
}

export function resetForNextRound(): void {
  const now = Date.now();
  crapsRushStateInternal.update((state) => {
    if (state.phase !== 'RESULT') return state;
    if (!state.isUnlocked) return state;

    // Check if cooldown is still active
    if (state.cooldownEndsAt > now) {
      return {
        ...state,
        phase: 'COOLDOWN',
        betType: null,
        diceTotal: null,
        didWin: null,
        addedDurationMs: 0,
        roundSeed: 0
      };
    }

    return {
      ...state,
      phase: 'BET_SELECT',
      betType: null,
      diceTotal: null,
      didWin: null,
      addedDurationMs: 0,
      roundSeed: 0
    };
  });
}

export function hydrateState(payload: Partial<CrapsRushState> | null | undefined): void {
  const defaults = createInitialState();
  if (!payload) {
    crapsRushStateInternal.set(defaults);
    return;
  }

  const now = Date.now();
  const today = getTodayDateKey();

  // Handle daily cap reset on load
  let dailyDiscountAccumulatedMinutes = payload.dailyDiscountAccumulatedMinutes;
  let lastDailyResetDate = payload.lastDailyResetDate;

  // If it's a new day, reset the daily cap
  if (lastDailyResetDate !== today) {
    dailyDiscountAccumulatedMinutes = 0;
    lastDailyResetDate = today;
  }

  // Expire discount if needed
  let discountEndsAt = payload.discountEndsAt ?? 0;
  if (discountEndsAt > 0 && discountEndsAt <= now) {
    discountEndsAt = 0;
  }

  // Expire cooldown if needed
  let cooldownEndsAt = payload.cooldownEndsAt ?? 0;
  if (cooldownEndsAt > 0 && cooldownEndsAt <= now) {
    cooldownEndsAt = 0;
  }

  crapsRushStateInternal.set({
    isUnlocked: payload.isUnlocked ?? defaults.isUnlocked,
    isOpen: typeof payload.isOpen === 'boolean' ? payload.isOpen : defaults.isOpen,
    phase: payload.phase ?? defaults.phase,
    roundId: typeof payload.roundId === 'number' ? Math.max(0, Math.floor(payload.roundId)) : defaults.roundId,
    betType: payload.betType ?? null,
    diceTotal: typeof payload.diceTotal === 'number' ? payload.diceTotal : null,
    didWin: typeof payload.didWin === 'boolean' || payload.didWin === null ? payload.didWin : null,
    addedDurationMs: typeof payload.addedDurationMs === 'number' ? Math.max(0, Math.floor(payload.addedDurationMs)) : 0,
    discountEndsAt,
    lastPlayAt: typeof payload.lastPlayAt === 'number' ? payload.lastPlayAt : 0,
    cooldownEndsAt,
    winStreak: typeof payload.winStreak === 'number' ? Math.max(0, Math.floor(payload.winStreak)) : 0,
    dailyDiscountAccumulatedMinutes: typeof dailyDiscountAccumulatedMinutes === 'number' 
      ? Math.max(0, Math.min(DAILY_CAP_MINUTES, Math.floor(dailyDiscountAccumulatedMinutes))) 
      : 0,
    lastDailyResetDate,
    roundSeed: typeof payload.roundSeed === 'number' ? payload.roundSeed : 0
  });
}

export function expireIfNeeded(now: number = Date.now()): void {
  crapsRushStateInternal.update((state) => {
    let updates: Partial<CrapsRushState> = {};

    // Check daily cap reset
    const dailyReset = checkAndResetDailyCap(state);
    if (Object.keys(dailyReset).length > 0) {
      updates = { ...updates, ...dailyReset };
    }

    // Expire discount if needed
    if (state.discountEndsAt > 0 && state.discountEndsAt <= now) {
      updates = { ...updates, discountEndsAt: 0 };
    }

    // Expire cooldown if needed - if so, return to BET_SELECT if open
    let nextPhase = state.phase;
    if (state.cooldownEndsAt > 0 && state.cooldownEndsAt <= now) {
      updates = { ...updates, cooldownEndsAt: 0 };
      if (state.isOpen && state.phase === 'COOLDOWN') {
        nextPhase = 'BET_SELECT';
      }
    }

    if (Object.keys(updates).length === 0) return state;

    return {
      ...state,
      ...updates,
      phase: nextPhase
    };
  });
}

export function tickCrapsRushTimer(now: number = Date.now()): void {
  crapsRushNowMs.set(now);
  expireIfNeeded(now);
}

// Helper to check if discount is currently active
export function isDiscountActive(now: number = Date.now()): boolean {
  const state = get(crapsRushStateInternal);
  return state.discountEndsAt > now;
}

// Helper to get remaining discount minutes
export function getRemainingDiscountMinutes(now: number = Date.now()): number {
  const state = get(crapsRushStateInternal);
  if (state.discountEndsAt <= now) return 0;
  const remainingMs = state.discountEndsAt - now;
  return Math.max(0, Math.ceil(remainingMs / 60000));
}

// Helper to get remaining cooldown seconds
export function getRemainingCooldownSeconds(now: number = Date.now()): number {
  const state = get(crapsRushStateInternal);
  if (state.cooldownEndsAt <= now) return 0;
  const remainingMs = state.cooldownEndsAt - now;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

// Helper to check if player can play now
export function canPlayNow(): boolean {
  const now = Date.now();
  const state = get(crapsRushStateInternal);
  
  if (state.cooldownEndsAt > now) return false;
  if (state.dailyDiscountAccumulatedMinutes >= DAILY_CAP_MINUTES) return false;
  
  return true;
}
