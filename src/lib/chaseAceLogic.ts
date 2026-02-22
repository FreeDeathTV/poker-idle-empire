import {
  CHASE_ACE_CARD_COUNT,
  CHASE_ACE_DURATION_LADDER_MS,
  CHASE_ACE_PHASES
} from './chaseAceConfig';
import type { ChaseAcePhase } from './chaseAceConfig';

export interface ChaseAceRoundResolution {
  didWin: boolean;
  nextStreak: number;
  addedDurationMs: number;
  nextBoostEndsAt: number;
  lastResolvedAt: number;
}

export interface ChaseAceInitialState {
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

export function randomAceIndex(rand: () => number = Math.random): number {
  return Math.floor(rand() * CHASE_ACE_CARD_COUNT);
}

export function durationGainForStreak(streak: number): number {
  if (streak <= 0) return 0;
  if (streak <= CHASE_ACE_DURATION_LADDER_MS.length) {
    return CHASE_ACE_DURATION_LADDER_MS[streak - 1];
  }
  return CHASE_ACE_DURATION_LADDER_MS[CHASE_ACE_DURATION_LADDER_MS.length - 1];
}

export function isBoostActive(boostEndsAt: number, now: number = Date.now()): boolean {
  return boostEndsAt > now;
}

export function remainingBoostMs(boostEndsAt: number, now: number = Date.now()): number {
  return Math.max(0, boostEndsAt - now);
}

export function formatRemaining(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function resolveRoundResult(
  aceIndex: number,
  selectedIndex: number,
  currentStreak: number,
  boostEndsAt: number,
  now: number = Date.now()
): ChaseAceRoundResolution {
  const didWin = selectedIndex === aceIndex;
  const nextStreak = didWin ? currentStreak + 1 : 0;
  const addedDurationMs = didWin ? durationGainForStreak(nextStreak) : 0;
  const baseline = Math.max(boostEndsAt, now);
  const nextBoostEndsAt = didWin ? baseline + addedDurationMs : boostEndsAt;

  return {
    didWin,
    nextStreak,
    addedDurationMs,
    nextBoostEndsAt,
    lastResolvedAt: now
  };
}

export function createInitialRoundState(initialUnlock = false): ChaseAceInitialState {
  const defaultPhase: ChaseAcePhase = initialUnlock ? CHASE_ACE_PHASES[1] : CHASE_ACE_PHASES[0];
  return {
    isUnlocked: initialUnlock,
    isOpen: false,
    phase: defaultPhase,
    roundId: 0,
    aceIndex: 0,
    selectedIndex: null,
    streak: 0,
    didWin: null,
    addedDurationMs: 0,
    boostEndsAt: 0,
    shuffleStep: 0,
    lastResolvedAt: 0
  };
}

