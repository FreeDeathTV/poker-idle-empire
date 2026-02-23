import { derived, writable } from 'svelte/store';
import { DAILY_TAP_TARGET } from './v701Config';
import { createDailyTasks, getLocalDateKey, type DailyTasksState } from './v701Logic';
import { checkTDUnlocked } from './rouletteLogic';

export const chips = writable(0);
export const cps = writable(0);
export const aceTokens = writable(0);
export const aceTokenPassiveProgressSeconds = writable(0);

export interface Building {
  name: string;
  count: number;
  cost: number;
  cps: number;
}

export const buildings = writable<Building[]>([
  { name: 'Poker Table', count: 0, cost: 10, cps: 1 }
]);

export type AdType = 'doubleTap' | 'extraTable' | 'unlockTH';

export interface AdItem {
  available: boolean;
  nextAvailable: number;
  permanent?: boolean;
}

export const adState = writable<Record<AdType, AdItem>>({
  doubleTap: { available: true, nextAvailable: 0 },
  extraTable: { available: true, nextAvailable: 0 },
  unlockTH: { available: true, nextAvailable: 0 }
});

export const thUnlocked = writable(false);
export const tapMultiplier = writable(1);
export const watchingAd = writable<'none' | AdType>('none');
export const autoTapperUnlocked = writable(false);
export const autoTapperEnabled = writable(false);

export const bonusVisible = writable(false);
export const selectedHole = writable<string[]>([]);
export const bonusBet = writable(1000); // Default bet amount
export const bonusResult = writable<{
  playerHole: string[];
  opponentHole: string[];
  board: string[];
  playerHand: string;
  opponentHand: string;
  playerWins: boolean;
  multiplier: number;
  bet: number;
  payout: number;
} | null>(null);

// Last save timestamp for offline calculation
export const lastSaveTime = writable<number>(Date.now());

// Number formatting helper: 1.2K, 3.4M, 7.8B
export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

export type V2BuildingId = 'ProDealers' | 'CardShufflers' | 'TDs' | 'Sponsors' | 'BuildingExpansion';

export const v2BuildingLevels = writable<Record<V2BuildingId, number>>({
  ProDealers: 0,
  CardShufflers: 0,
  TDs: 0,
  Sponsors: 0,
  BuildingExpansion: 0
});

export const rouletteUnlocked = derived(v2BuildingLevels, ($levels) => checkTDUnlocked($levels));

export const prestigePoints = writable(0);
export const uiMode = writable<'accordion' | 'tree'>('accordion');

// V501 Empire Slots
export type SlotsMode = 'low' | 'high';
export const slotsUnlocked = writable(false);
export const slotsMode = writable<SlotsMode>('high');
export const currentThemeIndex = writable(0);

const initialDailyDateKey = getLocalDateKey();
export const dailyTasks = writable<DailyTasksState>(createDailyTasks(initialDailyDateKey, DAILY_TAP_TARGET));
export const dailyStreakCount = writable(0);
export const dailyLastCompletedDateKey = writable<string | null>(null);
export const dailyCpsBoostMultiplier = writable(1);
export const dailyCpsBoostEndsAt = writable(0);

// V301 Reset Flow State
export type EscapeMethod = 'relocation' | 'identity' | 'run';

export interface WheelOutcome {
  name: string;
  multiplier: number;
}

export interface WheelHistoryEntry {
  method: EscapeMethod;
  multiplier: number;
  timestamp: number;
}

export const lastEscapeMethod = writable<EscapeMethod | null>(null);
export const lastOutcome = writable<WheelOutcome | null>(null);
export const wheelHistory = writable<WheelHistoryEntry[]>([]);
export const signingBonusTotal = writable(0); // Cumulative permanent bonus (stored as percentage points, e.g., 22.5)

// Transient UI state (reset per flow)
export const resetFlowActive = writable(false);
export const resetFlowStage = writable<1 | 2 | 3>(1); // 1=method selection, 2=wheel spin, 3=results
export const selectedMethod = writable<EscapeMethod | null>(null);
export const spinResult = writable<WheelOutcome | null>(null);
export const canReSpin = writable(true);

// ============================================
// V302 DEBUG SUITE STATE (Transient Only)
// ============================================
// CRITICAL: This state is NEVER persisted to localStorage
// All debug actions are temporary and cleared on reload

export const debugEnabled = writable(false); // Set via environment or query param

export interface DebugState {
  lastCashInjection: number; // Amount added (for UI feedback)
  lastLevelUpBuilding: string | null; // Which building was tested

  wheelTestResult: {
    method: EscapeMethod;
    outcome: WheelOutcome;
    multiplier: number;
    baseBonus: number;
    finalBonus: number;
    resetCount: number;
  } | null;
  wheelTestHistory: Array<{ method: EscapeMethod; outcome: WheelOutcome; timestamp: number }>;

  resetFlowSnapshot: {
    stage: 1 | 2 | 3;
    method: EscapeMethod | null;
    outcome: WheelOutcome | null;
    canReSpin: boolean;
  } | null;
  resetFlowForceMultiplier: number | null; // Force specific multiplier in test

  inspectorView: 'compact' | 'full' | 'json';
}

export const debugState = writable<DebugState>({
  lastCashInjection: 0,
  lastLevelUpBuilding: null,
  wheelTestResult: null,
  wheelTestHistory: [],
  resetFlowSnapshot: null,
  resetFlowForceMultiplier: null,
  inspectorView: 'compact'
});

// Initialize debug mode from environment or query param
export function initializeDebugMode(): void {
  const isEnvDebug = import.meta.env.VITE_DEBUG === 'true';
  const isQueryDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1');
  debugEnabled.set(isEnvDebug || isQueryDebug);
}

export { personalityToasts } from './personalityToast';

export type { ChaseAceState } from './chaseAceStore';
export {
  chaseAceState,
  chaseAceRemainingMs,
  chaseAceTimerText,
  chaseAceBoostActive,
  getChaseAceSnapshot,
  openChaseAce,
  closeChaseAce,
  setUnlocked as setChaseAceUnlocked,
  startRound as startChaseAceRound,
  startShuffle as startChaseAceShuffle,
  advanceShuffleStep as advanceChaseAceShuffleStep,
  finishShuffle as finishChaseAceShuffle,
  pickCard as pickChaseAceCard,
  resolveRound as resolveChaseAceRound,
  resetForNextRound as resetChaseAceForNextRound,
  hydrateState as hydrateChaseAceState,
  expireBoostIfNeeded as expireChaseAceBoostIfNeeded,
  tickChaseAceTimer
} from './chaseAceStore';

// V1200 Craps Rush - Expansion Discount
export type { CrapsRushState, BetType, GamePhase } from './expansionDiscount';
export {
  crapsRushState,
  crapsRushDiscountActive,
  crapsRushRemainingMinutes,
  crapsRushCooldownRemainingSeconds,
  crapsRushCanPlay,
  getCrapsRushSnapshot,
  setCrapsRushUnlocked,
  openCrapsRush,
  closeCrapsRush,
  startRound,
  resolveRound,
  resetForNextRound,
  hydrateState as hydrateCrapsRushState,
  expireIfNeeded as expireCrapsRushIfNeeded,
  tickCrapsRushTimer,
  isDiscountActive,
  getRemainingDiscountMinutes,
  getRemainingCooldownSeconds,
  canPlayNow,
  EXPANSION_DISCOUNT_PERCENT,
  DAILY_CAP_MINUTES,
  COOLDOWN_MS,
  REWARD_DURATION_MS
} from './expansionDiscount';
