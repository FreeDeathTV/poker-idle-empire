import { get } from 'svelte/store';
import {
  chips,
  cps,
  aceTokens,
  aceTokenPassiveProgressSeconds,
  buildings,
  adState,
  adLimits,
  thUnlocked,
  tapMultiplier,
  watchingAd,
  autoTapperUnlocked,
  autoTapperEnabled,
  bonusVisible,
  selectedHole,
  bonusBet,
  bonusResult,
  lastSaveTime,
  v2BuildingLevels,
  prestigePoints,
  uiMode,
  currentThemeIndex,
  dailyTasks,
  dailyStreakCount,
  dailyLastCompletedDateKey,
  dailyCpsBoostMultiplier,
  dailyCpsBoostEndsAt,
  rouletteUnlocked,
  lastEscapeMethod,
  lastOutcome,
  wheelHistory,
  signingBonusTotal,
  resetFlowActive,
  resetFlowStage,
  selectedMethod,
  spinResult,
  canReSpin,
  slotsUnlocked,
  slotsMode,
  chaseAceState,
  getChaseAceSnapshot,
  hydrateChaseAceState,
  tickChaseAceTimer,
  type EscapeMethod,
  type WheelHistoryEntry
} from './stores';
import { playBonusRound, getHandNotation, getStartingMultiplier } from './poker';
import type { AdType } from './stores';
import { prestigeMultiplier, totalBoost } from './v2';
import { CHASE_ACE_MULTIPLIER } from './chaseAceConfig';
import {
  ACE_TOKEN_PASSIVE_INTERVAL_SECONDS,
  DAILY_TAP_TARGET,
  TURBO_TAPPER_OFFLINE_TAP_VALUE,
  TURBO_TAPPER_TAPS_PER_SECOND,
  TURBO_TAPPER_UNLOCK_CHIPS
} from './v701Config';
import {
  createDailyTasks,
  detectNamedHandCommentary,
  getLocalDateKey,
  getRewardForStreak,
  isBadPlayHand,
  isDailyTaskSheetComplete,
  isStrongAk,
  nextStreakValue,
  normalizeStreakAfterGap
} from './v701Logic';
import { enqueuePersonalityToast } from './personalityToast';

const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
const DOUBLE_TAP_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour instead of 5 minutes
const MAX_DAILY_ADS = 4;
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000; // Keep for other ad types
const LONG_OFFLINE_SECONDS_FOR_TOAST = 60 * 60;
const TURBO_TAPPER_FIRST_TAP_TOAST_KEY = 'poker_idle_turbo_first_tap_toast_seen';
const SAVE_KEY = 'poker_idle_save';

let chaseAceBoostSyncUnsubscribe: (() => void) | null = null;
let lastSeenChaseAceBoostEndsAt: number | null = null;
let turboFirstTapToastChecked = false;

export interface DailyClaimResult {
  streakCount: number;
  aceTokens: number;
  chipBoost: number;
  cpsMultiplier: number;
  cpsDurationMs: number;
}

// V301 Reset Flow: Wheel Definitions
interface WheelOutcomeData {
  name: string;
  multiplier: number;
  probability: number;
}

const WHEELS: Record<EscapeMethod, WheelOutcomeData[]> = {
  relocation: [
    { name: "VIP Jet Escape", multiplier: 2.0, probability: 0.10 },
    { name: "Private Yacht", multiplier: 1.5, probability: 0.30 },
    { name: "Luxury Limo", multiplier: 1.3, probability: 0.30 },
    { name: "Economy Flight", multiplier: 1.0, probability: 0.20 },
    { name: "Bus Ride", multiplier: 0.9, probability: 0.08 },
    { name: "Hitchhike", multiplier: 0.8, probability: 0.02 }
  ],
  identity: [
    { name: "Elite Surgeon", multiplier: 2.0, probability: 0.10 },
    { name: "Perfect Disguise", multiplier: 1.7, probability: 0.20 },
    { name: "Celebrity Lookalike", multiplier: 1.5, probability: 0.30 },
    { name: "New Passport", multiplier: 1.2, probability: 0.20 },
    { name: "Cheap Mask", multiplier: 1.0, probability: 0.12 },
    { name: "Botched Job", multiplier: 0.8, probability: 0.08 }
  ],
  run: [
    { name: "Lucky Break", multiplier: 1.5, probability: 0.15 },
    { name: "Found a Stash House", multiplier: 1.3, probability: 0.25 },
    { name: "Taxi Escape", multiplier: 1.2, probability: 0.30 },
    { name: "Back Alley Shortcut", multiplier: 1.0, probability: 0.18 },
    { name: "Lost in the City", multiplier: 0.9, probability: 0.10 },
    { name: "Caught in Traffic", multiplier: 0.8, probability: 0.02 }
  ]
};

// Spin wheel and get outcome
export function spinWheel(method: EscapeMethod, seed?: number) {
  const rand = seed !== undefined ? seed : Math.random();
  const wheel = WHEELS[method];
  let cumulative = 0;
  for (const outcome of wheel) {
    cumulative += outcome.probability;
    if (rand <= cumulative) {
      return { name: outcome.name, multiplier: outcome.multiplier };
    }
  }
  return { name: wheel[wheel.length - 1].name, multiplier: wheel[wheel.length - 1].multiplier };
}

// Calculate base signing bonus
export function calculateBaseBonus(resets: number): number {
  const baseBonus = 0.10 + 0.05 * Math.log10(resets + 1);
  return Math.min(baseBonus, 0.50); // Cap at 50%
}

// Calculate final bonus after applying all safety rules
export function calculateFinalBonus(baseBonus: number, wheelMultiplier: number, resets: number): number {
  // Late-game soft floor: if resets > 20, min wheel multiplier = 1.0Ã—
  const adjustedWheelMultiplier = resets > 20 ? Math.max(wheelMultiplier, 1.0) : wheelMultiplier;

  // Minimum gain guarantee: at least 10%
  const finalBonus = Math.max(baseBonus * adjustedWheelMultiplier, 0.10);

  return finalBonus;
}

// Calculate toast message for display
function formatToastMessage(outcomeName: string, wheelMultiplier: number, finalBonus: number): string {
  const multiplierStr = wheelMultiplier.toFixed(1);
  const bonusPercentage = Math.round(finalBonus * 100);
  return `${outcomeName}! Ã—${multiplierStr} bonus applied. Permanent bonus +${bonusPercentage}%.`;
}


function grantPassiveAceTokens(elapsedSeconds: number): void {
  if (elapsedSeconds <= 0) return;
  const currentProgress = get(aceTokenPassiveProgressSeconds);
  const totalProgress = currentProgress + elapsedSeconds;
  const earned = Math.floor(totalProgress / ACE_TOKEN_PASSIVE_INTERVAL_SECONDS);
  const remainder = totalProgress % ACE_TOKEN_PASSIVE_INTERVAL_SECONDS;
  aceTokenPassiveProgressSeconds.set(remainder);
  if (earned > 0) {
    aceTokens.update((n) => n + earned);
  }
}

function calculateTurboTapperOfflineEarnings(offlineSeconds: number): number {
  if (!get(autoTapperUnlocked) || !get(autoTapperEnabled)) return 0;
  if (offlineSeconds <= 0) return 0;
  const tapCount = Math.floor(offlineSeconds * TURBO_TAPPER_TAPS_PER_SECOND);
  return tapCount * TURBO_TAPPER_OFFLINE_TAP_VALUE;
}

function consumeTurboTapperFirstToastFlag(): boolean {
  if (turboFirstTapToastChecked) return false;
  turboFirstTapToastChecked = true;
  try {
    if (localStorage.getItem(TURBO_TAPPER_FIRST_TAP_TOAST_KEY) === '1') {
      return false;
    }
    localStorage.setItem(TURBO_TAPPER_FIRST_TAP_TOAST_KEY, '1');
    return true;
  } catch {
    return true;
  }
}

export function calculateOfflineEarnings(lastTime: number) {
  const now = Date.now();
  const offlineTime = Math.max(0, (now - lastTime) / 1000); // seconds
  grantPassiveAceTokens(offlineTime);
  const currentCps = get(cps);
  let idleEarnings = 0;
  if (currentCps > 0 && offlineTime > 0) {
    idleEarnings = Math.floor(currentCps * offlineTime);
    if (idleEarnings > 0) {
      chips.update((n) => n + idleEarnings);
    }
  }
  const turboEarnings = calculateTurboTapperOfflineEarnings(offlineTime);
  if (turboEarnings > 0) {
    chips.update((n) => n + turboEarnings);
  }
  if (offlineTime >= LONG_OFFLINE_SECONDS_FOR_TOAST && idleEarnings + turboEarnings > 0) {
    enqueuePersonalityToast('The tables were kind while you were away, boss.');
  }
}

// Core tapper: deal hand for chips
export function dealHand() {
  const multi = get(tapMultiplier);
  const base = 10 * multi;
  const bonus = Math.floor(Math.random() * 50) + 1;
  chips.update((n) => n + base + bonus);
}

function runTurboTapperOnline(): void {
  if (!get(autoTapperUnlocked) || !get(autoTapperEnabled)) return;
  if (consumeTurboTapperFirstToastFlag()) {
    enqueuePersonalityToast('The dealer never sleeps.');
  }
  for (let i = 0; i < TURBO_TAPPER_TAPS_PER_SECOND; i += 1) {
    dealHand();
  }
}

export function checkTurboTapperUnlock(): boolean {
  if (get(autoTapperUnlocked)) return false;
  if (get(chips) < TURBO_TAPPER_UNLOCK_CHIPS) return false;
  autoTapperUnlocked.set(true);
  autoTapperEnabled.set(true);
  saveGame();
  return true;
}

export function setTurboTapperEnabled(enabled: boolean): void {
  if (!get(autoTapperUnlocked)) return;
  autoTapperEnabled.set(enabled);
  saveGame();
}

export function getThemeIndexFromProgress(): number {
  const levels = get(v2BuildingLevels);
  if ((levels.Sponsors || 0) >= 1 || (levels.BuildingExpansion || 0) >= 1) return 4;
  if ((levels.TDs || 0) >= 1) return 3;
  if ((levels.CardShufflers || 0) >= 1) return 2;
  if ((levels.ProDealers || 0) >= 1) return 1;
  return 0;
}

export function syncThemeFromProgress(): void {
  currentThemeIndex.set(getThemeIndexFromProgress());
}

function getActiveDailyCpsMultiplier(now: number): number {
  const endsAt = get(dailyCpsBoostEndsAt);
  const currentMultiplier = get(dailyCpsBoostMultiplier);
  if (currentMultiplier <= 1) {
    if (endsAt !== 0) dailyCpsBoostEndsAt.set(0);
    if (currentMultiplier !== 1) dailyCpsBoostMultiplier.set(1);
    return 1;
  }
  if (endsAt > now) return currentMultiplier;
  dailyCpsBoostMultiplier.set(1);
  dailyCpsBoostEndsAt.set(0);
  return 1;
}

export function ensureDailyState(now: number = Date.now()): void {
  const todayKey = getLocalDateKey(now);
  const current = get(dailyTasks);
  if (!current.dateKey) {
    dailyTasks.set(createDailyTasks(todayKey, DAILY_TAP_TARGET));
    return;
  }
  if (current.dateKey === todayKey) return;

  const currentStreak = get(dailyStreakCount);
  const normalizedStreak = normalizeStreakAfterGap(
    current.dateKey,
    todayKey,
    currentStreak,
    current.rewardClaimed
  );
  dailyStreakCount.set(normalizedStreak);
  dailyTasks.set(createDailyTasks(todayKey, current.tapTarget || DAILY_TAP_TARGET));
}

export function markDailyOpenApp(): void {
  ensureDailyState(Date.now());
  dailyTasks.update((state) => ({ ...state, openApp: true }));
}

export function recordDailyTap(amount = 1): void {
  ensureDailyState(Date.now());
  if (amount <= 0) return;
  dailyTasks.update((state) => ({
    ...state,
    tapCount: Math.min(state.tapTarget, state.tapCount + amount)
  }));
}

export function markDailyChaseAceSpin(): void {
  ensureDailyState(Date.now());
  dailyTasks.update((state) => ({ ...state, chaseAceSpin: true }));
}

export function markDailyAdWatch(): void {
  ensureDailyState(Date.now());
  dailyTasks.update((state) => ({ ...state, watchAd: true }));
}

export const ROULETTE_SPIN_ACE_TOKEN_REWARD = 1;

export function markDailyRouletteSpin(): void {
  ensureDailyState(Date.now());
  if (!get(rouletteUnlocked)) return;
  const state = get(dailyTasks);
  if (state.rouletteSpin) return; // Already rewarded today
  dailyTasks.update((s) => ({ ...s, rouletteSpin: true }));
  aceTokens.update((n) => n + ROULETTE_SPIN_ACE_TOKEN_REWARD);
  saveGame();
}

export function claimDailyReward(now: number = Date.now()): DailyClaimResult | null {
  ensureDailyState(now);
  const state = get(dailyTasks);
  if (state.rewardClaimed) return null;
  if (!isDailyTaskSheetComplete(state, get(rouletteUnlocked))) return null;

  const nextStreak = nextStreakValue(get(dailyStreakCount));
  const reward = getRewardForStreak(nextStreak);

  aceTokens.update((n) => n + reward.aceTokens);
  chips.update((n) => n + reward.chipBoost);

  if (reward.cpsMultiplier > 1 && reward.cpsDurationMs > 0) {
    const baseline = Math.max(get(dailyCpsBoostEndsAt), now);
    dailyCpsBoostMultiplier.set(reward.cpsMultiplier);
    dailyCpsBoostEndsAt.set(baseline + reward.cpsDurationMs);
  }

  dailyStreakCount.set(nextStreak);
  dailyLastCompletedDateKey.set(state.dateKey);
  dailyTasks.update((tasks) => ({ ...tasks, rewardClaimed: true }));
  saveGame();

  return {
    streakCount: nextStreak,
    aceTokens: reward.aceTokens,
    chipBoost: reward.chipBoost,
    cpsMultiplier: reward.cpsMultiplier,
    cpsDurationMs: reward.cpsDurationMs
  };
}

export function getDailyRewardPreview(): DailyClaimResult {
  const nextStreak = nextStreakValue(get(dailyStreakCount));
  const reward = getRewardForStreak(nextStreak);
  return {
    streakCount: nextStreak,
    aceTokens: reward.aceTokens,
    chipBoost: reward.chipBoost,
    cpsMultiplier: reward.cpsMultiplier,
    cpsDurationMs: reward.cpsDurationMs
  };
}

function queueBonusPersonalityToasts(playerHole: string[], playerWins: boolean, playerHandName: string): void {
  const handNotation = getHandNotation(playerHole);
  const namedHand = detectNamedHandCommentary(handNotation, playerHole);
  if (namedHand) {
    enqueuePersonalityToast(namedHand.text);
  }
  if (playerWins && playerHandName.trim().toLowerCase() === 'royal flush') {
    enqueuePersonalityToast('Royalty has arrived! Bow down.');
  }
  if (isStrongAk(handNotation) && !playerWins) {
    enqueuePersonalityToast('Dah dah dah dahhhhhh... Big Slick goes down.');
  }
  if (isBadPlayHand(handNotation) && playerWins) {
    enqueuePersonalityToast('You lucky fish.');
  }
}

// Buy a building
export function buyBuilding(index: number) {
  const list = get(buildings).slice();
  const b = list[index];
  if (!b) return;
  const current = get(chips);
  if (current < b.cost) return false;
  
  chips.set(current - b.cost);
  b.count += 1;
  cps.update((v) => v + b.cps);
  b.cost = Math.ceil(b.cost * 1.15);
  buildings.set(list);
  saveGame();
  return true;
}

// Check if ad rewards are available now
export function checkAds() {
  const now = Date.now();
  const ads = get(adState);
  let changed = false;
  (Object.keys(ads) as AdType[]).forEach((k) => {
    if (!ads[k].available && now >= ads[k].nextAvailable) {
      ads[k].available = true;
      changed = true;
    }
  });
  if (changed) {
    adState.set(ads);
  }
}

// Start watching a fake ad
export function startAdWatch(type: AdType) {
  const ads = get(adState);
  if (!ads[type]?.available) return false;
  watchingAd.set(type);
  return true;
}

// Grant the ad reward after countdown
export function grantAdReward(type: AdType) {
  const ads = get(adState);
  if (!ads[type]) return;
  
  // Set cooldown based on ad type
  let cooldownMs = EIGHT_HOURS_MS;
  if (type === 'doubleTap') {
    cooldownMs = ONE_HOUR_MS; // 1 hour cooldown for double tap
  }
  
  ads[type].available = false;
  ads[type].nextAvailable = Date.now() + cooldownMs;
  adState.set(ads);
  
  if (type === 'doubleTap') {
    tapMultiplier.set(2);
    // Reset after 1 hour
    setTimeout(() => {
      tapMultiplier.set(1);
    }, DOUBLE_TAP_DURATION_MS);
  } else if (type === 'extraTable') {
    // Add 1 poker table (100 chips value, but gives 1 CPS)
    const list = get(buildings).slice();
    if (list.length > 0) {
      list[0].count += 1;
      cps.update((v) => v + 1);
      buildings.set(list);
    }
  } else if (type === 'unlockTH') {
    thUnlocked.set(true);
  }

  markDailyAdWatch();
  
  watchingAd.set('none');
  saveGame();
}

// Check and reset daily ad limits
function checkDailyAdLimits(): void {
  const now = Date.now();
  const limits = get(adLimits);
  const todayKey = getLocalDateKey(now);
  
  // Check if we need to reset the daily counter
  const lastResetKey = getLocalDateKey(limits.doubleTap.lastResetTime);
  if (todayKey !== lastResetKey) {
    limits.doubleTap.dailyCount = 0;
    limits.doubleTap.lastResetTime = now;
    adLimits.set(limits);
  }
}

// Check if user can watch more ads today
export function canWatchAdToday(type: AdType): boolean {
  checkDailyAdLimits();
  const limits = get(adLimits);
  
  if (type === 'doubleTap') {
    return limits.doubleTap.dailyCount < MAX_DAILY_ADS;
  }
  
  // For other ad types, no daily limit
  return true;
}

// Increment ad count for today
export function incrementAdCount(type: AdType): void {
  if (type === 'doubleTap') {
    const limits = get(adLimits);
    limits.doubleTap.dailyCount += 1;
    adLimits.set(limits);
  }
}

// Get remaining ads for today
export function getRemainingAdsToday(type: AdType): number {
  checkDailyAdLimits();
  const limits = get(adLimits);
  
  if (type === 'doubleTap') {
    return Math.max(0, MAX_DAILY_ADS - limits.doubleTap.dailyCount);
  }
  
  // For other ad types, return a large number (no limit)
  return 999;
}

// Get time remaining for an ad (in ms), or 0 if available
export function getAdCooldown(type: AdType): number {
  const ads = get(adState);
  const ad = ads[type];
  if (!ad) return 0;
  if (ad.available) return 0;
  const remaining = ad.nextAvailable - Date.now();
  return remaining > 0 ? remaining : 0;
}

// Format cooldown time for display
export function formatCooldown(ms: number): string {
  if (ms <= 0) return 'Ready';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Save game to localStorage
export function saveGame() {
  try {
    lastSaveTime.set(Date.now());
    const data = {
      chips: get(chips),
      cps: get(cps),
      aceTokens: get(aceTokens),
      aceTokenPassiveProgressSeconds: get(aceTokenPassiveProgressSeconds),
      buildings: get(buildings),
      adState: get(adState),
      thUnlocked: get(thUnlocked),
      autoTapperUnlocked: get(autoTapperUnlocked),
      autoTapperEnabled: get(autoTapperEnabled),
      lastTime: Date.now(),
      v2BuildingLevels: get(v2BuildingLevels),
      prestigePoints: get(prestigePoints),
      uiMode: get(uiMode),
      currentThemeIndex: get(currentThemeIndex),
      dailyTasks: get(dailyTasks),
      dailyStreakCount: get(dailyStreakCount),
      dailyLastCompletedDateKey: get(dailyLastCompletedDateKey),
      dailyCpsBoostMultiplier: get(dailyCpsBoostMultiplier),
      dailyCpsBoostEndsAt: get(dailyCpsBoostEndsAt),
      // V301 Reset Flow fields
      lastEscapeMethod: get(lastEscapeMethod),
      lastOutcome: get(lastOutcome),
      wheelHistory: get(wheelHistory),
      signingBonusTotal: get(signingBonusTotal),
      slotsUnlocked: get(slotsUnlocked),
      slotsMode: get(slotsMode),
      chaseAce: getChaseAceSnapshot()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

// Load game from localStorage
export function loadGame() {
  try {
    ensureChaseAceBoostAutoSaveSync();
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.chips === 'number') chips.set(data.chips);
      if (typeof data.cps === 'number') cps.set(data.cps);
      if (typeof data.aceTokens === 'number') aceTokens.set(data.aceTokens);
      if (typeof data.aceTokenPassiveProgressSeconds === 'number') {
        aceTokenPassiveProgressSeconds.set(data.aceTokenPassiveProgressSeconds);
      }
      if (Array.isArray(data.buildings)) buildings.set(data.buildings);
      if (data.adState) adState.set(data.adState);
      if (typeof data.thUnlocked === 'boolean') thUnlocked.set(data.thUnlocked);
      if (typeof data.autoTapperUnlocked === 'boolean') autoTapperUnlocked.set(data.autoTapperUnlocked);
      if (typeof data.autoTapperEnabled === 'boolean') autoTapperEnabled.set(data.autoTapperEnabled);
      if (data.v2BuildingLevels) v2BuildingLevels.set(data.v2BuildingLevels);
      if (typeof data.prestigePoints === 'number') prestigePoints.set(data.prestigePoints);
      if (data.uiMode === 'accordion' || data.uiMode === 'tree') uiMode.set(data.uiMode);
      if (typeof data.currentThemeIndex === 'number') currentThemeIndex.set(data.currentThemeIndex);
      if (data.dailyTasks) {
        const dateKey =
          typeof data.dailyTasks.dateKey === 'string' ? data.dailyTasks.dateKey : getLocalDateKey(Date.now());
        dailyTasks.set({
          ...createDailyTasks(dateKey, DAILY_TAP_TARGET),
          ...data.dailyTasks,
          tapTarget: DAILY_TAP_TARGET
        });
      }
      if (typeof data.dailyStreakCount === 'number') dailyStreakCount.set(data.dailyStreakCount);
      if (typeof data.dailyLastCompletedDateKey === 'string' || data.dailyLastCompletedDateKey === null) {
        dailyLastCompletedDateKey.set(data.dailyLastCompletedDateKey);
      }
      if (typeof data.dailyCpsBoostMultiplier === 'number') {
        dailyCpsBoostMultiplier.set(data.dailyCpsBoostMultiplier);
      }
      if (typeof data.dailyCpsBoostEndsAt === 'number') dailyCpsBoostEndsAt.set(data.dailyCpsBoostEndsAt);
      // V301 Reset Flow fields
      if (data.lastEscapeMethod) lastEscapeMethod.set(data.lastEscapeMethod);
      if (data.lastOutcome) lastOutcome.set(data.lastOutcome);
      if (Array.isArray(data.wheelHistory)) wheelHistory.set(data.wheelHistory);
      if (typeof data.signingBonusTotal === 'number') signingBonusTotal.set(data.signingBonusTotal);
      if (typeof data.slotsUnlocked === 'boolean') slotsUnlocked.set(data.slotsUnlocked);
      if (data.slotsMode === 'low' || data.slotsMode === 'high') slotsMode.set(data.slotsMode);
      hydrateChaseAceState(data.chaseAce);
      const now = Date.now();
      ensureDailyState(now);
      syncThemeFromProgress();
      checkTurboTapperUnlock();
      if (typeof data.lastTime === 'number') calculateOfflineEarnings(data.lastTime);
      tickChaseAceTimer(now);
      getActiveDailyCpsMultiplier(now);
    }
  } catch (e) {
    console.warn('Failed to load game:', e);
  }
}

// Idle update: add CPS chips
export function updateIdle() {
  const now = Date.now();
  ensureDailyState(now);
  checkTurboTapperUnlock();
  syncThemeFromProgress();
  grantPassiveAceTokens(1);
  runTurboTapperOnline();
  tickChaseAceTimer(now);
  const chaseAceMultiplier = getChaseAceSnapshot().boostEndsAt > now ? CHASE_ACE_MULTIPLIER : 1;
  const dailyCpsMultiplier = getActiveDailyCpsMultiplier(now);
  const base = get(cps);
  const boost = totalBoost(get(v2BuildingLevels));
  const multi = prestigeMultiplier(get(prestigePoints));
  const perSecond = Math.floor(base * multi * (1 + boost) * chaseAceMultiplier * dailyCpsMultiplier);
  chips.update((n) => n + perSecond);
  checkAds();
}

// Auto-save interval (30 seconds)
let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSave() {
  if (autoSaveInterval) return;
  autoSaveInterval = setInterval(() => {
    saveGame();
  }, 30000);
}

export function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

// Bonus round functions
export function openBonus() {
  if (!get(thUnlocked)) return;
  selectedHole.set([]);
  bonusResult.set(null);
  bonusVisible.set(true);
}

export function closeBonus() {
  bonusVisible.set(false);
  selectedHole.set([]);
  bonusResult.set(null);
}

export function toggleCardSelection(card: string) {
  const current = get(selectedHole);
  if (current.includes(card)) {
    selectedHole.set(current.filter(c => c !== card));
  } else if (current.length < 2) {
    selectedHole.set([...current, card]);
  }
}

export function randomizeHoleCards() {
  const suits = ['s', 'h', 'd', 'c'];
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const deck: string[] = [];
  for (const r of ranks) {
    for (const s of suits) {
      deck.push(r + s);
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  selectedHole.set([deck[0], deck[1]]);
}

export function setBetAmount(amount: number) {
  bonusBet.set(Math.max(1000, amount));
}

export function playBonus() {
  const hole = get(selectedHole);
  const bet = get(bonusBet);
  const currentChips = get(chips);
  
  if (hole.length !== 2) return false;
  if (bet < 1000) return false;
  if (currentChips < bet) return false;
  
  // Deduct bet
  chips.set(currentChips - bet);
  
  // Play the round
  const result = playBonusRound(hole, bet);
  
  // Add payout if won
  if (result.payout > 0) {
    chips.update(n => n + result.payout);
  }

  queueBonusPersonalityToasts(result.playerHole, result.playerWins, result.playerHand);
  
  bonusResult.set(result);
  saveGame();
  return true;
}

// Get current multiplier preview for selected cards
export function getCurrentMultiplier(): number {
  const hole = get(selectedHole);
  if (hole.length !== 2) return 1;
  const notation = getHandNotation(hole);
  return getStartingMultiplier(notation);
}

export function canReset(): boolean {
  return get(chips) >= 1e12;
}

export function performReset(): void {
  if (!canReset()) return;
  prestigePoints.update(n => n + 1);
  chips.set(0);
  cps.set(0);
  buildings.set([{ name: 'Poker Table', count: 0, cost: 10, cps: 1 }]);
  v2BuildingLevels.set({ ProDealers: 0, CardShufflers: 0, TDs: 0, Sponsors: 0, BuildingExpansion: 0 });
  saveGame();
}

// V301 Reset Flow Functions
export function startResetFlow(): void {
  const chips_val = get(chips);
  if (chips_val < 1e12) return; // Check gate

  resetFlowActive.set(true);
  resetFlowStage.set(1);
  selectedMethod.set(null);
  spinResult.set(null);
  canReSpin.set(true);
}

// Toast function (used by reset flow)
let resetToasts: { id: number; text: string }[] = [];

function pushResetToast(text: string) {
  const id = Date.now() + Math.random();
  resetToasts = [...resetToasts, { id, text }];
  // Dispatch event for external listener (the main page component will receive this)
  window.dispatchEvent(new CustomEvent('resetToast', { detail: { id, text } }));
  setTimeout(() => {
    resetToasts = resetToasts.filter((t) => t.id !== id);
  }, 2500);
}

export function applyResetFlow(method: EscapeMethod): void {
  const wheelOutcome = spinWheel(method);
  const resets = get(prestigePoints);
  const baseBonus = calculateBaseBonus(resets);
  const finalBonus = calculateFinalBonus(baseBonus, wheelOutcome.multiplier, resets);

  // Stage 3: Apply reset
  prestigePoints.update(n => n + 1);
  signingBonusTotal.update(n => n + (finalBonus * 100)); // Store as percentage points
  lastEscapeMethod.set(method);
  lastOutcome.set(wheelOutcome);

  // Add to history (keep max 5)
  wheelHistory.update(history => {
    const updated = [
      { method, multiplier: wheelOutcome.multiplier, timestamp: Date.now() } as WheelHistoryEntry,
      ...history
    ];
    return updated.slice(0, 5);
  });

  // Wipe reset state
  chips.set(0);
  cps.set(0);
  buildings.set([{ name: 'Poker Table', count: 0, cost: 10, cps: 1 }]);
  v2BuildingLevels.set({ ProDealers: 0, CardShufflers: 0, TDs: 0, Sponsors: 0, BuildingExpansion: 0 });

  // Show results
  resetFlowStage.set(3);
  const toastMsg = formatToastMessage(wheelOutcome.name, wheelOutcome.multiplier, finalBonus);
  pushResetToast(toastMsg);

  // Save
  saveGame();
}

export function performReSpin(): void {
  const method = get(selectedMethod);
  if (!method || !get(canReSpin)) return;

  // Note: Cost is conceptual (10% of bonus calculation), displayed in UI
  // Just re-spin the wheel and update result
  const newOutcome = spinWheel(method);
  spinResult.set(newOutcome);
  canReSpin.set(false);
}

function ensureChaseAceBoostAutoSaveSync(): void {
  if (chaseAceBoostSyncUnsubscribe) return;
  chaseAceBoostSyncUnsubscribe = chaseAceState.subscribe((state) => {
    if (lastSeenChaseAceBoostEndsAt === null) {
      lastSeenChaseAceBoostEndsAt = state.boostEndsAt;
      return;
    }
    if (state.boostEndsAt === lastSeenChaseAceBoostEndsAt) return;
    lastSeenChaseAceBoostEndsAt = state.boostEndsAt;
    saveGame();
  });
}

