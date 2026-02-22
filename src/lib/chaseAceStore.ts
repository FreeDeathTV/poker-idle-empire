import { derived, get, readonly, writable } from 'svelte/store';
import {
  CHASE_ACE_CARD_COUNT,
  CHASE_ACE_PHASES,
  CHASE_ACE_SHUFFLE_PATTERN
} from './chaseAceConfig';
import type { ChaseAcePhase } from './chaseAceConfig';
import {
  createInitialRoundState,
  formatRemaining,
  isBoostActive,
  randomAceIndex,
  remainingBoostMs,
  resolveRoundResult
} from './chaseAceLogic';

export interface ChaseAceState {
  isUnlocked: boolean;
  isOpen: boolean;
  phase: ChaseAcePhase;
  roundId: number;
  aceIndex: number;
  selectedIndex: number | null;
  streak: number;
  didWin: boolean | null;
  addedDurationMs: number;
  boostEndsAt: number;
  shuffleStep: number;
  lastResolvedAt: number;
}

const chaseAceStateInternal = writable<ChaseAceState>(createInitialRoundState(false));
const chaseAceNowMs = writable<number>(Date.now());

export const chaseAceState = readonly(chaseAceStateInternal);

export const chaseAceRemainingMs = derived([chaseAceStateInternal, chaseAceNowMs], ([$state, $now]) =>
  remainingBoostMs($state.boostEndsAt, $now)
);
export const chaseAceTimerText = derived(chaseAceRemainingMs, ($remaining) => formatRemaining($remaining));
export const chaseAceBoostActive = derived([chaseAceStateInternal, chaseAceNowMs], ([$state, $now]) =>
  isBoostActive($state.boostEndsAt, $now)
);

function normalizePhase(isUnlocked: boolean, phase: unknown): ChaseAcePhase {
  if (!CHASE_ACE_PHASES.includes(phase as ChaseAcePhase)) {
    return isUnlocked ? 'ready' : 'locked';
  }
  if (!isUnlocked && phase !== 'locked') return 'locked';
  if (isUnlocked && phase === 'locked') return 'ready';
  return phase as ChaseAcePhase;
}

function clampCardIndex(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(CHASE_ACE_CARD_COUNT - 1, Math.floor(value)));
}

function clampShuffleStep(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(CHASE_ACE_SHUFFLE_PATTERN.length, Math.floor(value)));
}

export function getChaseAceSnapshot(): ChaseAceState {
  return get(chaseAceStateInternal);
}

export function openChaseAce(): void {
  chaseAceStateInternal.update((state) => {
    if (!state.isUnlocked) return state;
    return {
      ...state,
      isOpen: true,
      phase: state.phase === 'locked' ? 'ready' : state.phase
    };
  });
}

export function closeChaseAce(): void {
  chaseAceStateInternal.update((state) => ({
    ...state,
    isOpen: false
  }));
}

export function setUnlocked(isUnlocked: boolean): void {
  chaseAceStateInternal.update((state) => {
    if (state.isUnlocked === isUnlocked) return state;
    if (!isUnlocked) {
      return {
        ...state,
        isUnlocked: false,
        isOpen: false,
        phase: 'locked'
      };
    }
    return {
      ...state,
      isUnlocked: true,
      phase: state.phase === 'locked' ? 'ready' : state.phase
    };
  });
}

export function startRound(): void {
  chaseAceStateInternal.update((state) => {
    if (!state.isUnlocked) return state;
    if (state.phase !== 'ready') return state;

    // Ace randomization is locked to round start only.
    const nextAceIndex = randomAceIndex();
    return {
      ...state,
      roundId: state.roundId + 1,
      aceIndex: nextAceIndex,
      selectedIndex: null,
      didWin: null,
      addedDurationMs: 0,
      shuffleStep: 0
    };
  });
}

export function startShuffle(): void {
  chaseAceStateInternal.update((state) => {
    if (!state.isUnlocked) return state;
    if (state.phase !== 'ready') return state;
    if (state.roundId <= 0) return state;
    return {
      ...state,
      phase: 'shuffling',
      shuffleStep: 0
    };
  });
}

export function advanceShuffleStep(): void {
  chaseAceStateInternal.update((state) => {
    if (state.phase !== 'shuffling') return state;
    if (state.shuffleStep >= CHASE_ACE_SHUFFLE_PATTERN.length) return state;
    return {
      ...state,
      shuffleStep: state.shuffleStep + 1
    };
  });
}

export function finishShuffle(): void {
  chaseAceStateInternal.update((state) => {
    if (state.phase !== 'shuffling') return state;
    return {
      ...state,
      phase: 'pick',
      shuffleStep: CHASE_ACE_SHUFFLE_PATTERN.length
    };
  });
}

export function pickCard(index: number): void {
  chaseAceStateInternal.update((state) => {
    if (state.phase !== 'pick') return state;
    const clamped = clampCardIndex(index);
    return {
      ...state,
      selectedIndex: clamped,
      phase: 'revealing'
    };
  });
}

export function resolveRound(now: number = Date.now()): void {
  chaseAceStateInternal.update((state) => {
    if (state.phase !== 'revealing') return state;
    if (state.selectedIndex === null) return state;

    const result = resolveRoundResult(
      state.aceIndex,
      state.selectedIndex,
      state.streak,
      state.boostEndsAt,
      now
    );
    return {
      ...state,
      phase: 'result',
      didWin: result.didWin,
      streak: result.nextStreak,
      addedDurationMs: result.addedDurationMs,
      boostEndsAt: result.nextBoostEndsAt,
      lastResolvedAt: result.lastResolvedAt
    };
  });
}

export function resetForNextRound(): void {
  chaseAceStateInternal.update((state) => {
    if (state.phase !== 'result') return state;
    if (!state.isUnlocked) return state;
    return {
      ...state,
      phase: 'ready',
      selectedIndex: null,
      didWin: null,
      addedDurationMs: 0,
      shuffleStep: 0
    };
  });
}

export function hydrateState(payload: Partial<ChaseAceState> | null | undefined): void {
  const defaults = createInitialRoundState(false);
  if (!payload) {
    chaseAceStateInternal.set(defaults);
    return;
  }

  const nextUnlocked = typeof payload.isUnlocked === 'boolean' ? payload.isUnlocked : defaults.isUnlocked;
  const nextPhase = normalizePhase(nextUnlocked, payload.phase);
  const nextSelected =
    payload.selectedIndex === null || payload.selectedIndex === undefined
      ? null
      : clampCardIndex(payload.selectedIndex);

  chaseAceStateInternal.set({
    isUnlocked: nextUnlocked,
    isOpen: typeof payload.isOpen === 'boolean' ? payload.isOpen : defaults.isOpen,
    phase: nextPhase,
    roundId:
      typeof payload.roundId === 'number' && Number.isFinite(payload.roundId)
        ? Math.max(0, Math.floor(payload.roundId))
        : defaults.roundId,
    aceIndex: clampCardIndex(payload.aceIndex),
    selectedIndex: nextSelected,
    streak:
      typeof payload.streak === 'number' && Number.isFinite(payload.streak)
        ? Math.max(0, Math.floor(payload.streak))
        : defaults.streak,
    didWin:
      typeof payload.didWin === 'boolean' || payload.didWin === null ? payload.didWin : defaults.didWin,
    addedDurationMs:
      typeof payload.addedDurationMs === 'number' && Number.isFinite(payload.addedDurationMs)
        ? Math.max(0, Math.floor(payload.addedDurationMs))
        : defaults.addedDurationMs,
    boostEndsAt:
      typeof payload.boostEndsAt === 'number' && Number.isFinite(payload.boostEndsAt)
        ? Math.max(0, Math.floor(payload.boostEndsAt))
        : defaults.boostEndsAt,
    shuffleStep: clampShuffleStep(payload.shuffleStep),
    lastResolvedAt:
      typeof payload.lastResolvedAt === 'number' && Number.isFinite(payload.lastResolvedAt)
        ? Math.max(0, Math.floor(payload.lastResolvedAt))
        : defaults.lastResolvedAt
  });
}

export function expireBoostIfNeeded(now: number = Date.now()): void {
  chaseAceStateInternal.update((state) => {
    if (state.boostEndsAt <= 0) return state;
    if (state.boostEndsAt > now) return state;
    return {
      ...state,
      boostEndsAt: 0
    };
  });
}

export function tickChaseAceTimer(now: number = Date.now()): void {
  chaseAceNowMs.set(now);
  expireBoostIfNeeded(now);
}
