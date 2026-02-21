import { get } from 'svelte/store';
import {
  chips,
  cps,
  buildings,
  v2BuildingLevels,
  prestigePoints,
  lastEscapeMethod,
  lastOutcome,
  wheelHistory,
  signingBonusTotal,
  debugState,
  type EscapeMethod,
  type WheelOutcome
} from './stores';
import { spinWheel, calculateBaseBonus, calculateFinalBonus } from './gameLogic';
import { prestigeMultiplier } from './v2';

// ============================================
// 1. INSTANT CASH INJECTION (Transient Only)
// ============================================

/**
 * Inject cash for testing (NOT saved)
 * Returns the new total for display only
 */
export function debugInjectCash(amount: number): number {
  const currentChips = get(chips);
  const newTotal = currentChips + amount;

  // Store injection amount for UI feedback animation
  debugState.update(state => ({
    ...state,
    lastCashInjection: amount
  }));

  return newTotal;
}

export function debugClearCashInjection(): void {
  debugState.update(state => ({
    ...state,
    lastCashInjection: 0
  }));
}

// ============================================
// 2. INSTANT LEVEL-UP TRIGGER (No State Change)
// ============================================

export interface LevelUpTestResult {
  buildingName: string;
  animationDuration: number; // ms for timeout
  reward: {
    type: 'chips' | 'boost';
    amount: number;
  };
}

export function debugTestLevelUp(buildingId: string): LevelUpTestResult {
  // Find building definition
  const buildings_list = get(buildings);
  const targetBuilding = buildings_list.find(b => b.name === buildingId);

  if (!targetBuilding) {
    throw new Error(`Building "${buildingId}" not found`);
  }

  // Simulate level-up animation (500ms)
  const result: LevelUpTestResult = {
    buildingName: buildingId,
    animationDuration: 500,
    reward: {
      type: 'chips',
      amount: Math.floor(targetBuilding.cps * 100) // Simulate reward
    }
  };

  // Track tested building
  debugState.update(state => ({
    ...state,
    lastLevelUpBuilding: buildingId
  }));

  // NO STORE MODIFICATIONS - purely for animation test
  return result;
}

// ============================================
// 3. WHEEL SPIN TESTER (Sandboxed)
// ============================================

export interface WheelTestRun {
  method: EscapeMethod;
  outcome: WheelOutcome;
  multiplier: number;
  baseBonus: number;
  finalBonus: number;
  resetCount: number;
}

export function debugSpinWheel(
  method: EscapeMethod,
  forceOutcomeIndex?: number | null
): WheelTestRun {
  const resets = get(prestigePoints);

  // Let RNG decide or use forced seed
  let outcome: WheelOutcome;
  if (forceOutcomeIndex !== null && forceOutcomeIndex !== undefined) {
    // Force specific outcome by using seed that maps to index
    const seedValue = forceOutcomeIndex / 10; // Map index to probability
    outcome = spinWheel(method, seedValue);
  } else {
    outcome = spinWheel(method); // Normal RNG
  }

  // Calculate bonuses WITHOUT affecting stores
  const baseBonus = calculateBaseBonus(resets);
  const finalBonus = calculateFinalBonus(baseBonus, outcome.multiplier, resets);

  const result: WheelTestRun = {
    method,
    outcome,
    multiplier: outcome.multiplier,
    baseBonus,
    finalBonus,
    resetCount: resets
  };

  // Store in history (max 10 test runs)
  debugState.update(state => ({
    ...state,
    wheelTestResult: result,
    wheelTestHistory: [
      { method, outcome, timestamp: Date.now() },
      ...state.wheelTestHistory
    ].slice(0, 10)
  }));

  // NO STORE MODIFICATIONS - stores remain untouched
  return result;
}

export function debugClearWheelTest(): void {
  debugState.update(state => ({
    ...state,
    wheelTestResult: null,
    wheelTestHistory: []
  }));
}

// ============================================
// 4. RESET FLOW TESTER (Sandbox Simulation)
// ============================================

export interface ResetFlowTestSnapshot {
  stage: 1 | 2 | 3;
  method: EscapeMethod | null;
  outcome: WheelOutcome | null;
  baseBonus: number;
  finalBonus: number;
  confettiWillTrigger: boolean;
}

export function debugStartResetFlowTest(): void {
  debugState.update(state => ({
    ...state,
    resetFlowSnapshot: {
      stage: 1,
      method: null,
      outcome: null,
      canReSpin: true
    }
  }));
}

export function debugAdvanceResetStage(
  method?: EscapeMethod,
  forceMultiplier?: number | null
): ResetFlowTestSnapshot {
  const currentDebugState = get(debugState);
  const currentSnapshot = currentDebugState.resetFlowSnapshot;
  if (!currentSnapshot) throw new Error('Reset test not started');

  let nextStage = currentSnapshot.stage as any;
  let method_val = method || currentSnapshot.method;
  let outcome: WheelOutcome | null = currentSnapshot.outcome;

  if (currentSnapshot.stage === 1) {
    // Advance to stage 2
    nextStage = 2;
    method_val = method;
  } else if (currentSnapshot.stage === 2) {
    // Spin wheel and advance to stage 3
    nextStage = 3;
    if (!method_val) throw new Error('Method required for wheel spin');

    // Use forced multiplier if provided for testing
    if (forceMultiplier !== null && forceMultiplier !== undefined) {
      outcome = { name: 'Test Outcome', multiplier: forceMultiplier };
    } else {
      outcome = spinWheel(method_val);
    }
  }

  const resets = get(prestigePoints);
  const baseBonus = calculateBaseBonus(resets);
  const finalBonus = calculateFinalBonus(
    baseBonus,
    outcome?.multiplier || 1,
    resets
  );

  const snapshot: ResetFlowTestSnapshot = {
    stage: nextStage,
    method: method_val || null,
    outcome,
    baseBonus,
    finalBonus,
    confettiWillTrigger: (outcome?.multiplier || 0) > 1.5
  };

  debugState.update(state => ({
    ...state,
    resetFlowSnapshot: {
      stage: nextStage,
      method: method_val || null,
      outcome,
      canReSpin: currentSnapshot.canReSpin
    }
  }));

  // NO ACTUAL RESET - this is just a test flow
  return snapshot;
}

export function debugClearResetTest(): void {
  debugState.update(state => ({
    ...state,
    resetFlowSnapshot: null,
    resetFlowForceMultiplier: null
  }));
}

// ============================================
// 5. STATE INSPECTOR (Read-Only)
// ============================================

export interface GameStateSnapshot {
  chips: number;
  cps: number;
  buildings: any[];
  boosts: Record<string, number>;
  prestigePoints: number;
  prestigeMultiplier: number;
  signingBonusTotal: number;
  lastEscapeMethod: EscapeMethod | null;
  lastOutcome: WheelOutcome | null;
  wheelHistory: any[];
  v2BuildingLevels: Record<string, number>;
  timestamp: number;
}

export function debugGetStateSnapshot(): GameStateSnapshot {
  const prestigePoints_val = get(prestigePoints);
  return {
    chips: get(chips),
    cps: get(cps),
    buildings: get(buildings),
    boosts: get(v2BuildingLevels),
    prestigePoints: prestigePoints_val,
    prestigeMultiplier: prestigeMultiplier(prestigePoints_val),
    signingBonusTotal: get(signingBonusTotal),
    lastEscapeMethod: get(lastEscapeMethod),
    lastOutcome: get(lastOutcome),
    wheelHistory: get(wheelHistory),
    v2BuildingLevels: get(v2BuildingLevels),
    timestamp: Date.now()
  };
}

export function debugExportStateAsJSON(): string {
  const snapshot = debugGetStateSnapshot();
  return JSON.stringify(snapshot, null, 2);
}

export function debugSetInspectorView(view: 'compact' | 'full' | 'json'): void {
  debugState.update(state => ({
    ...state,
    inspectorView: view
  }));
}
