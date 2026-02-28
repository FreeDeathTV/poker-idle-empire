import { writable, derived, get } from 'svelte/store';
import type { AdType } from './stores';
import { aceTokens } from './stores';

// Save keys for persistence
const LADDER_SAVE_KEY = 'heads_up_ladder_state';
const GAME_SAVE_KEY = 'heads_up_game_state';

// CPU Opponent Profiles
export interface CPUProfile {
  id: string;
  name: string;
  tier: number;
  portrait: string;
  bio: string;
  difficultyStars: number;
  aggression: number; // 0-100
  bluff: number; // 0-100
  callThreshold: number; // 0-100
  raiseThreshold: number; // 0-100
}

export const CPU_PROFILES: CPUProfile[] = [
  {
    id: 'theNorm',
    name: 'TheNorm',
    tier: 1,
    portrait: '🃏', // Placeholder
    bio: 'The friendly neighborhood player. Solid fundamentals, predictable patterns.',
    difficultyStars: 1,
    aggression: 40,
    bluff: 20,
    callThreshold: 60,
    raiseThreshold: 70
  },
  {
    id: 'anyAceNick',
    name: 'AnyAceNick',
    tier: 2,
    portrait: '🃏', // Placeholder
    bio: 'Aggressive with any ace. Loves to raise pre-flop.',
    difficultyStars: 2,
    aggression: 65,
    bluff: 35,
    callThreshold: 50,
    raiseThreshold: 60
  },
  {
    id: 'redTheRiot',
    name: 'RedTheRiot',
    tier: 3,
    portrait: '🃏', // Placeholder
    bio: 'Unpredictable and wild. Mixes tight and loose play.',
    difficultyStars: 3,
    aggression: 55,
    bluff: 50,
    callThreshold: 55,
    raiseThreshold: 65
  },
  {
    id: 'crazyHorse',
    name: 'CrazyHorse',
    tier: 4,
    portrait: '🃏', // Placeholder
    bio: 'All-in or fold. High variance player with big swings.',
    difficultyStars: 4,
    aggression: 80,
    bluff: 40,
    callThreshold: 40,
    raiseThreshold: 50
  },
  {
    id: 'mrMark',
    name: 'MrMark',
    tier: 5,
    portrait: '🃏', // Placeholder
    bio: 'The master strategist. Exploits your patterns and adjusts.',
    difficultyStars: 5,
    aggression: 70,
    bluff: 60,
    callThreshold: 45,
    raiseThreshold: 55
  }
];

// Ladder State
export interface LadderState {
  unlockedTiers: number; // 0-5, how many CPUs are unlocked
  wins: Record<string, number>; // CPU ID -> win count
  currentOpponentId: string | null;
  deterministicSeed: number;
}

// Game State
export interface GameState {
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  playerStack: number;
  cpuStack: number;
  pot: number;
  smallBlind: number;
  bigBlind: number;
  playerPosition: 'SB' | 'BB';
  playerCards: string[];
  cpuCards: string[];
  communityCards: string[];
  playerAction: 'fold' | 'call' | 'check' | 'raise' | 'allin' | null;
  cpuAction: 'fold' | 'call' | 'check' | 'raise' | 'allin' | null;
  playerBet: number;
  cpuBet: number;
  currentBet: number;
  gameActive: boolean;
  gameOver: boolean;
  playerWins: boolean | null;
  winner: 'player' | 'cpu' | 'tie' | null;
}

// Leaderboard State
export interface LeaderboardEntry {
  name: string;
  tokensWon: number;
  winStreak: number;
  highestTierBeaten: number;
  totalWins: number;
}

export const ladderState = writable<LadderState>({
  unlockedTiers: 0,
  wins: {},
  currentOpponentId: null,
  deterministicSeed: 12345
});

export const gameState = writable<GameState>({
  phase: 'preflop',
  playerStack: 100,
  cpuStack: 100,
  pot: 0,
  smallBlind: 1,
  bigBlind: 2,
  playerPosition: 'SB',
  playerCards: [],
  cpuCards: [],
  communityCards: [],
  playerAction: null,
  cpuAction: null,
  playerBet: 0,
  cpuBet: 0,
  currentBet: 0,
  gameActive: false,
  gameOver: false,
  playerWins: null,
  winner: null
});

export const leaderboard = writable<LeaderboardEntry[]>([
  {
    name: 'TheNorm',
    tokensWon: 500,
    winStreak: 15,
    highestTierBeaten: 1,
    totalWins: 100
  },
  {
    name: 'AnyAceNick',
    tokensWon: 1200,
    winStreak: 8,
    highestTierBeaten: 2,
    totalWins: 75
  },
  {
    name: 'RedTheRiot',
    tokensWon: 2800,
    winStreak: 12,
    highestTierBeaten: 3,
    totalWins: 60
  },
  {
    name: 'CrazyHorse',
    tokensWon: 5500,
    winStreak: 5,
    highestTierBeaten: 4,
    totalWins: 45
  },
  {
    name: 'MrMark',
    tokensWon: 12000,
    winStreak: 3,
    highestTierBeaten: 5,
    totalWins: 30
  }
]);

// Derived stores
export const currentOpponent = derived([ladderState], ([$ladderState]) => {
  return CPU_PROFILES.find(p => p.id === $ladderState.currentOpponentId) || null;
});

export const isLadderUnlocked = derived([ladderState], ([$ladderState]) => {
  return $ladderState.unlockedTiers > 0;
});

export const canStartMatch = derived([ladderState], ([$ladderState]) => {
  return $ladderState.currentOpponentId !== null;
});

// Actions
export function setUnlockedTiers(tiers: number) {
  ladderState.update(state => ({ ...state, unlockedTiers: tiers }));
}

export function setCurrentOpponent(opponentId: string) {
  ladderState.update(state => ({ ...state, currentOpponentId: opponentId }));
}

export function incrementWins(opponentId: string) {
  ladderState.update(state => ({
    ...state,
    wins: {
      ...state.wins,
      [opponentId]: (state.wins[opponentId] || 0) + 1
    }
  }));
  
  // Check for progression unlock
  checkProgression(opponentId);
}

// Token Economy
export function getEntryCost(tier: number): number {
  return tier;
}

export function getReward(tier: number): number {
  const rewards = [2, 4, 6, 8, 12];
  return rewards[tier - 1] || 2;
}

export function getStreakBonus(wins: number): number {
  if (wins % 5 === 0) return 3;
  if (wins % 3 === 0) return 1;
  return 0;
}

export function canAffordEntry(tier: number): boolean {
  const entryCost = getEntryCost(tier);
  return get(aceTokens) >= entryCost;
}

export function spendEntryFee(tier: number): boolean {
  const entryCost = getEntryCost(tier);
  if (get(aceTokens) >= entryCost) {
    // This would be handled by the main stores
    return true;
  }
  return false;
}

export function awardWinnings(tier: number, wins: number): number {
  const baseReward = getReward(tier);
  const streakBonus = getStreakBonus(wins);
  return baseReward + streakBonus;
}

// Progression Logic
function checkProgression(opponentId: string) {
  const opponent = CPU_PROFILES.find(p => p.id === opponentId);
  if (!opponent) return;

  const state = get(ladderState);
  const wins = state.wins[opponentId] || 0;
  
  // Unlock next tier if 5 wins achieved
  if (wins >= 5 && state.unlockedTiers < 5) {
    setUnlockedTiers(Math.min(opponent.tier + 1, 5));
    
    // Set next opponent as current
    const nextOpponent = CPU_PROFILES.find(p => p.tier === opponent.tier + 1);
    if (nextOpponent) {
      setCurrentOpponent(nextOpponent.id);
    }
  }
}

export function resetGame() {
  gameState.set({
    phase: 'preflop',
    playerStack: 100,
    cpuStack: 100,
    pot: 0,
    smallBlind: 1,
    bigBlind: 2,
    playerPosition: 'SB',
    playerCards: [],
    cpuCards: [],
    communityCards: [],
    playerAction: null,
    cpuAction: null,
    playerBet: 0,
    cpuBet: 0,
    currentBet: 0,
    gameActive: false,
    gameOver: false,
    playerWins: null,
    winner: null
  });
}

export function startNewHand() {
  gameState.update(state => ({
    ...state,
    phase: 'preflop',
    playerAction: null,
    cpuAction: null,
    playerBet: 0,
    cpuBet: 0,
    currentBet: 0,
    gameActive: true,
    gameOver: false,
    playerWins: null,
    winner: null
  }));
}

// Save/Load functions
export function saveLadderState() {
  ladderState.update(state => {
    localStorage.setItem(LADDER_SAVE_KEY, JSON.stringify(state));
    return state;
  });
}

export function loadLadderState() {
  const saved = localStorage.getItem(LADDER_SAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      ladderState.set(parsed);
      return true;
    } catch (e) {
      console.warn('Failed to load ladder state:', e);
      return false;
    }
  }
  return false;
}

export function saveGameState() {
  gameState.update(state => {
    localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(state));
    return state;
  });
}

export function loadGameState() {
  const saved = localStorage.getItem(GAME_SAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameState.set(parsed);
      return true;
    } catch (e) {
      console.warn('Failed to load game state:', e);
      return false;
    }
  }
  return false;
}

// Deterministic RNG
export function createDeterministicRNG(seed: number) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) % 2**32;
    return s / 2**32;
  };
}

export function getDeterministicRNG() {
  let seed = 12345;
  ladderState.subscribe(state => {
    seed = state.deterministicSeed;
  })();
  return createDeterministicRNG(seed);
}

// Initialize with first opponent unlocked
ladderState.update(state => ({
  ...state,
  unlockedTiers: 1,
  currentOpponentId: 'theNorm'
}));

// Load saved state on initialization
if (typeof window !== 'undefined') {
  loadLadderState();
}
