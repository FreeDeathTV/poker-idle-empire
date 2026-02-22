import { DAILY_REWARD_TABLE } from './v701Config';

export type DailyTaskId = 'openApp' | 'tap' | 'chaseAceSpin' | 'watchAd' | 'rouletteSpin';

export interface DailyTasksState {
  dateKey: string;
  openApp: boolean;
  tapCount: number;
  tapTarget: number;
  chaseAceSpin: boolean;
  watchAd: boolean;
  rouletteSpin: boolean;
  rewardClaimed: boolean;
}

export interface DailyReward {
  aceTokens: number;
  chipBoost: number;
  cpsMultiplier: number;
  cpsDurationMs: number;
}

export interface PersonalityHandCommentary {
  id: string;
  text: string;
}

export function getLocalDateKey(timestamp: number = Date.now()): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalStartOfDayMs(timestamp: number = Date.now()): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getLocalNextMidnightMs(timestamp: number = Date.now()): number {
  const d = new Date(timestamp);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function getDaysBetweenLocal(dateAKey: string, dateBKey: string): number {
  if (!dateAKey || !dateBKey) return 0;
  const a = new Date(`${dateAKey}T00:00:00`);
  const b = new Date(`${dateBKey}T00:00:00`);
  const diffMs = b.getTime() - a.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function createDailyTasks(dateKey: string, tapTarget: number): DailyTasksState {
  return {
    dateKey,
    openApp: true,
    tapCount: 0,
    tapTarget,
    chaseAceSpin: false,
    watchAd: false,
    rouletteSpin: false,
    rewardClaimed: false
  };
}

export function isDailyTaskSheetComplete(tasks: DailyTasksState, rouletteUnlocked = false): boolean {
  return (
    tasks.openApp &&
    tasks.tapCount >= tasks.tapTarget &&
    tasks.chaseAceSpin &&
    tasks.watchAd &&
    (!rouletteUnlocked || tasks.rouletteSpin)
  );
}

export function getRewardForStreak(streakCount: number): DailyReward {
  const index = Math.max(0, Math.min(DAILY_REWARD_TABLE.length - 1, streakCount - 1));
  const row = DAILY_REWARD_TABLE[index];
  return {
    aceTokens: row.aceTokens,
    chipBoost: row.chipBoost,
    cpsMultiplier: row.cpsMultiplier,
    cpsDurationMs: row.cpsDurationMs
  };
}

export function nextStreakValue(currentStreak: number): number {
  if (currentStreak <= 0) return 1;
  return Math.min(7, currentStreak + 1);
}

export function normalizeStreakAfterGap(
  previousDateKey: string,
  currentDateKey: string,
  currentStreak: number,
  previousClaimed: boolean
): number {
  if (!previousDateKey) return 0;
  const gapDays = getDaysBetweenLocal(previousDateKey, currentDateKey);
  if (gapDays <= 0) return currentStreak;
  if (gapDays > 1) return 0;
  return previousClaimed ? currentStreak : 0;
}

export function isStrongAk(handNotation: string): boolean {
  return handNotation === 'AKo' || handNotation === 'AKs';
}

export function isBadPlayHand(handNotation: string): boolean {
  return handNotation === '42o';
}

export function detectNamedHandCommentary(
  handNotation: string,
  playerHoleCards: string[]
): PersonalityHandCommentary | null {
  if (handNotation === 'KK') {
    return {
      id: 'cowboys',
      text: 'Cowboys - pocket Kings, named after the Dallas Cowboys.'
    };
  }

  const normalized = [...playerHoleCards].sort().join(',');
  if (normalized === ['8s', 'As'].sort().join(',')) {
    return {
      id: 'dead-mans-hand',
      text: "Dead Man's Hand - As8s, Wild Bill Hickok's final hand."
    };
  }

  if (handNotation === '72o' || handNotation === '72s') {
    return {
      id: 'the-hammer',
      text: 'The Hammer - 7-2, chaos incarnate.'
    };
  }

  return null;
}


