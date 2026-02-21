import { writable } from 'svelte/store';

export const chips = writable(0);
export const cps = writable(0);

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

export const prestigePoints = writable(0);
export const uiMode = writable<'accordion' | 'tree'>('accordion');
