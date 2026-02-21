import { get } from 'svelte/store';
import { chips, cps, buildings, adState, thUnlocked, tapMultiplier, watchingAd, bonusVisible, selectedHole, bonusBet, bonusResult, lastSaveTime, v2BuildingLevels, prestigePoints, uiMode, lastEscapeMethod, lastOutcome, wheelHistory, signingBonusTotal, resetFlowActive, resetFlowStage, selectedMethod, spinResult, canReSpin, slotsUnlocked, slotsMode, type EscapeMethod, type WheelHistoryEntry } from './stores';
import { playBonusRound, getHandNotation, getStartingMultiplier } from './poker';
import type { AdType } from './stores';
import { prestigeMultiplier, totalBoost } from './v2';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const DOUBLE_TAP_DURATION_MS = 5 * 60 * 1000;
const SAVE_KEY = 'poker_idle_save';

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
  // Late-game soft floor: if resets > 20, min wheel multiplier = 1.0×
  const adjustedWheelMultiplier = resets > 20 ? Math.max(wheelMultiplier, 1.0) : wheelMultiplier;

  // Minimum gain guarantee: at least 10%
  const finalBonus = Math.max(baseBonus * adjustedWheelMultiplier, 0.10);

  return finalBonus;
}

// Calculate toast message for display
function formatToastMessage(outcomeName: string, wheelMultiplier: number, finalBonus: number): string {
  const multiplierStr = wheelMultiplier.toFixed(1);
  const bonusPercentage = Math.round(finalBonus * 100);
  return `${outcomeName}! ×${multiplierStr} bonus applied. Permanent bonus +${bonusPercentage}%.`;
}


export function calculateOfflineEarnings(lastTime: number) {
  const now = Date.now();
  const offlineTime = (now - lastTime) / 1000; // seconds
  const currentCps = get(cps);
  if (currentCps > 0 && offlineTime > 0) {
    const earned = Math.floor(currentCps * offlineTime);
    if (earned > 0) {
      chips.update((n) => n + earned);
    }
  }
}

// Core tapper: deal hand for chips
export function dealHand() {
  const multi = get(tapMultiplier);
  const base = 10 * multi;
  const bonus = Math.floor(Math.random() * 50) + 1;
  chips.update((n) => n + base + bonus);
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
  
  ads[type].available = false;
  ads[type].nextAvailable = Date.now() + EIGHT_HOURS_MS;
  adState.set(ads);
  
  if (type === 'doubleTap') {
    tapMultiplier.set(2);
    // Reset after 5 minutes
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
  
  watchingAd.set('none');
  saveGame();
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
      buildings: get(buildings),
      adState: get(adState),
      thUnlocked: get(thUnlocked),
      lastTime: Date.now(),
      v2BuildingLevels: get(v2BuildingLevels),
      prestigePoints: get(prestigePoints),
      uiMode: get(uiMode),
      // V301 Reset Flow fields
      lastEscapeMethod: get(lastEscapeMethod),
      lastOutcome: get(lastOutcome),
      wheelHistory: get(wheelHistory),
      signingBonusTotal: get(signingBonusTotal),
      slotsUnlocked: get(slotsUnlocked),
      slotsMode: get(slotsMode)
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

// Load game from localStorage
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.chips === 'number') chips.set(data.chips);
      if (typeof data.cps === 'number') cps.set(data.cps);
      if (Array.isArray(data.buildings)) buildings.set(data.buildings);
      if (data.adState) adState.set(data.adState);
      if (typeof data.thUnlocked === 'boolean') thUnlocked.set(data.thUnlocked);
      if (typeof data.lastTime === 'number') calculateOfflineEarnings(data.lastTime);
      if (data.v2BuildingLevels) v2BuildingLevels.set(data.v2BuildingLevels);
      if (typeof data.prestigePoints === 'number') prestigePoints.set(data.prestigePoints);
      if (data.uiMode === 'accordion' || data.uiMode === 'tree') uiMode.set(data.uiMode);
      // V301 Reset Flow fields
      if (data.lastEscapeMethod) lastEscapeMethod.set(data.lastEscapeMethod);
      if (data.lastOutcome) lastOutcome.set(data.lastOutcome);
      if (Array.isArray(data.wheelHistory)) wheelHistory.set(data.wheelHistory);
      if (typeof data.signingBonusTotal === 'number') signingBonusTotal.set(data.signingBonusTotal);
      if (typeof data.slotsUnlocked === 'boolean') slotsUnlocked.set(data.slotsUnlocked);
      if (data.slotsMode === 'low' || data.slotsMode === 'high') slotsMode.set(data.slotsMode);
    }
  } catch (e) {
    console.warn('Failed to load game:', e);
  }
}

// Idle update: add CPS chips
export function updateIdle() {
  const base = get(cps);
  const boost = totalBoost(get(v2BuildingLevels));
  const multi = prestigeMultiplier(get(prestigePoints));
  const perSecond = Math.floor(base * multi * (1 + boost));
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
