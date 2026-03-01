import { writable, derived, get } from 'svelte/store';
import { aceTokens } from './stores';

// ===========================================
// LADDER MODE STATE MANAGEMENT
// ADR-1500, ADR-1503 compliant
// ===========================================

// Save key for persistence
const LADDER_SAVE_KEY = 'heads_up_ladder_state';

// ===========================================
// CPU PROFILES (ADR-1500, ADR-1502)
// Exact values from specification
// ===========================================

export interface LadderCPUProfile {
  id: string;
  name: string;
  tier: number;
  portrait: string;
  bio: string;
  difficultyStars: number;
  // ADR-1502 AI attributes
  aggression: number;
  bluffFrequency: number;
  callFrequency: number;
  raiseFrequency: number;
  handStrengthThreshold: number;
  // ADR-1503 career stats (flavor)
  careerTokensWon: number;
  careerWinRate: number;
  biggestPotWon: number;
  streakRecord: number;
}

export const LADDER_CPU_PROFILES: LadderCPUProfile[] = [
  {
    id: 'theNorm',
    name: 'TheNorm',
    tier: 1,
    portrait: '😐',
    bio: 'The friendly neighborhood player. Plays any two cards, calls too much, rarely raises.',
    difficultyStars: 1,
    // ADR-1502: Very Easy / Donkey
    aggression: 10,
    bluffFrequency: 5,
    callFrequency: 90,
    raiseFrequency: 5,
    handStrengthThreshold: 15,
    // ADR-1503: Career stats
    careerTokensWon: 500,
    careerWinRate: 0.25,
    biggestPotWon: 150,
    streakRecord: 3
  },
  {
    id: 'anyAceNick',
    name: 'AnyAceNick',
    tier: 2,
    portrait: '😎',
    bio: 'Aggressive with any ace. Overvalues Ax hands, calls too light.',
    difficultyStars: 2,
    // ADR-1502: Easy / Loose-Passive
    aggression: 25,
    bluffFrequency: 10,
    callFrequency: 75,
    raiseFrequency: 20,
    handStrengthThreshold: 30,
    // ADR-1503: Career stats
    careerTokensWon: 1200,
    careerWinRate: 0.35,
    biggestPotWon: 280,
    streakRecord: 5
  },
  {
    id: 'redTheRiot',
    name: 'RedTheRiot',
    tier: 3,
    portrait: '😠',
    bio: 'Tight-aggressive. Folds weak hands, bets strong ones, punishes loose play.',
    difficultyStars: 3,
    // ADR-1502: Medium / TAG
    aggression: 50,
    bluffFrequency: 15,
    callFrequency: 40,
    raiseFrequency: 45,
    handStrengthThreshold: 50,
    // ADR-1503: Career stats
    careerTokensWon: 2800,
    careerWinRate: 0.48,
    biggestPotWon: 520,
    streakRecord: 8
  },
  {
    id: 'crazyHorse',
    name: 'CrazyHorse',
    tier: 4,
    portrait: '🤪',
    bio: 'Hyper-aggressive. Shoves light, bluffs often, forces tough decisions.',
    difficultyStars: 4,
    // ADR-1502: Hard / LAG
    aggression: 85,
    bluffFrequency: 35,
    callFrequency: 30,
    raiseFrequency: 80,
    handStrengthThreshold: 40,
    // ADR-1503: Career stats
    careerTokensWon: 5500,
    careerWinRate: 0.52,
    biggestPotWon: 890,
    streakRecord: 6
  },
  {
    id: 'mrMark',
    name: 'MrMark',
    tier: 5,
    portrait: '🧐',
    bio: 'The master strategist. Balanced, mixes bluffs, adapts to patterns.',
    difficultyStars: 5,
    // ADR-1502: Very Hard / TAG+GTO Hybrid
    aggression: 70,
    bluffFrequency: 25,
    callFrequency: 45,
    raiseFrequency: 65,
    handStrengthThreshold: 60,
    // ADR-1503: Career stats
    careerTokensWon: 12000,
    careerWinRate: 0.62,
    biggestPotWon: 1500,
    streakRecord: 12
  }
];

// ===========================================
// LADDER STATE (ADR-1503)
// ===========================================

export interface LadderState {
  unlockedTiers: number; // 0-5, how many CPUs are unlocked
  wins: Record<string, number>; // CPU ID -> win count (need 5 to unlock next)
  currentOpponentId: string | null;
  deterministicSeed: number;
  playerStats: {
    totalTokensWon: number;
    totalTokensLost: number;
    highestTierBeaten: number;
    longestStreak: number;
  };
}

// Initial state - use random seed for first game
const initialLadderState: LadderState = {
  unlockedTiers: 1, // First opponent unlocked by default
  wins: {},
  currentOpponentId: 'theNorm',
  deterministicSeed: Math.floor(Math.random() * 1000000),
  playerStats: {
    totalTokensWon: 0,
    totalTokensLost: 0,
    highestTierBeaten: 0,
    longestStreak: 0
  }
};

export const ladderState = writable<LadderState>(initialLadderState);

// ===========================================
// GAME STATE (ADR-1501)
// Used during active hand
// ===========================================

export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PlayerPosition = 'SB' | 'BB';
export type PlayerAction = 'fold' | 'call' | 'check' | 'raise' | 'allin' | null;
export type Winner = 'player' | 'cpu' | 'tie' | null;

export interface LadderGameState {
  // Game status
  gameActive: boolean;
  gameOver: boolean;
  winner: Winner;
  
  // Phase tracking
  phase: GamePhase;
  handNumber: number;
  
  // Stacks and pot (in chips)
  playerStack: number;
  cpuStack: number;
  pot: number;
  
  // Blinds (ADR-1501 blind ladder)
  smallBlind: number;
  bigBlind: number;
  blindLevel: number; // 0-4
  
  // Positions
  buttonPosition: PlayerPosition;
  playerPosition: PlayerPosition;
  
  // Cards
  playerCards: string[];
  cpuCards: string[];
  communityCards: string[];
  
  // Current betting
  currentBet: number;
  playerBet: number;
  cpuBet: number;
  
  // Actions taken
  playerAction: PlayerAction;
  cpuAction: PlayerAction;
  
  // Player decisions available
  canPlayerAct: boolean;
  actionOptions: string[];
}

// Initial game state - Updated for new chip/blind structure:
//: 1000 chips Starting, 50/100 blinds (10BB)
// After 2 hands: 75/150 blinds (~6.7BB)
// After 2 more: 100/200 blinds (5BB)
// Until 500/1000 (1BB)
const initialGameState: LadderGameState = {
  gameActive: false,
  gameOver: false,
  winner: null,
  phase: 'preflop',
  handNumber: 0,
  playerStack: 1000,
  cpuStack: 1000,
  pot: 0,
  smallBlind: 50,
  bigBlind: 100,
  blindLevel: 0,
  buttonPosition: 'SB',
  playerPosition: 'SB',
  playerCards: [],
  cpuCards: [],
  communityCards: [],
  currentBet: 0,
  playerBet: 0,
  cpuBet: 0,
  playerAction: null,
  cpuAction: null,
  canPlayerAct: false,
  actionOptions: []
};

export const ladderGameState = writable<LadderGameState>(initialGameState);

// ===========================================
// LEADERBOARD (ADR-1503)
// ===========================================

export interface LeaderboardEntry {
  name: string;
  portrait: string;
  tokensWon: number;
  winStreak: number;
  tier: number;
  isPlayer: boolean;
}

export const leaderboard = writable<LeaderboardEntry[]>([
  { name: 'MrMark', portrait: '🧐', tokensWon: 12000, winStreak: 12, tier: 5, isPlayer: false },
  { name: 'CrazyHorse', portrait: '🤪', tokensWon: 5500, winStreak: 6, tier: 4, isPlayer: false },
  { name: 'RedTheRiot', portrait: '😠', tokensWon: 2800, winStreak: 8, tier: 3, isPlayer: false },
  { name: 'AnyAceNick', portrait: '😎', tokensWon: 1200, winStreak: 5, tier: 2, isPlayer: false },
  { name: 'TheNorm', portrait: '😐', tokensWon: 500, winStreak: 3, tier: 1, isPlayer: false }
]);

// ===========================================
// DERIVED STORES
// ===========================================

export const currentOpponent = derived([ladderState], ([$ladderState]) => {
  return LADDER_CPU_PROFILES.find(p => p.id === $ladderState.currentOpponentId) || null;
});

export const isLadderUnlocked = derived([ladderState], ([$ladderState]) => {
  return $ladderState.unlockedTiers > 0;
});

export const canStartMatch = derived([ladderState], ([$ladderState]) => {
  return $ladderState.currentOpponentId !== null;
});

export const currentOpponentWins = derived([ladderState], ([$ladderState]) => {
  const opponent = LADDER_CPU_PROFILES.find(p => p.id === $ladderState.currentOpponentId);
  if (!opponent) return 0;
  return $ladderState.wins[opponent.id] || 0;
});

// ===========================================
// ACTIONS - PROGRESSION (ADR-1503)
// ===========================================

export function setUnlockedTiers(tiers: number) {
  ladderState.update(state => ({ ...state, unlockedTiers: tiers }));
}

export function setCurrentOpponent(opponentId: string) {
  ladderState.update(state => ({ ...state, currentOpponentId: opponentId }));
}

export function recordWin(opponentId: string) {
  ladderState.update(state => {
    const newWins = {
      ...state.wins,
      [opponentId]: (state.wins[opponentId] || 0) + 1
    };
    
    // Check for tier unlock (5 wins unlocks next tier)
    const opponent = LADDER_CPU_PROFILES.find(p => p.id === opponentId);
    if (opponent && newWins[opponentId] >= 5 && state.unlockedTiers < 5) {
      const nextTier = opponent.tier + 1;
      // Unlock next opponent
      const nextOpponent = LADDER_CPU_PROFILES.find(p => p.tier === nextTier);
      if (nextOpponent) {
        return {
          ...state,
          wins: newWins,
          unlockedTiers: nextTier,
          currentOpponentId: nextOpponent.id
        };
      }
    }
    
    return { ...state, wins: newWins };
  });
}

export function recordLoss(opponentId: string) {
  // Reset win streak for this opponent on loss
  ladderState.update(state => ({
    ...state,
    wins: {
      ...state.wins,
      [opponentId]: 0 // Reset progress on loss
    }
  }));
}

// ===========================================
// ACTIONS - TOKEN ECONOMY (ADR-1500)
// ===========================================

export function getEntryCost(tier: number): number {
  // Entry cost scales with tier
  const costs = [1, 2, 3, 5, 8];
  return costs[tier - 1] || 1;
}

export function getBaseReward(tier: number): number {
  // Base reward for winning (scales with tier)
  const rewards = [3, 5, 8, 12, 20];
  return rewards[tier - 1] || 3;
}

export function getStreakBonus(wins: number): number {
  // Bonus for consecutive wins
  if (wins >= 5) return 5;
  if (wins >= 3) return 2;
  return 0;
}

export function canAffordEntry(tier: number): boolean {
  const entryCost = getEntryCost(tier);
  return get(aceTokens) >= entryCost;
}

export function deductEntryFee(tier: number): boolean {
  const entryCost = getEntryCost(tier);
  if (get(aceTokens) >= entryCost) {
    aceTokens.update(tokens => tokens - entryCost);
    
    // Track in player stats
    ladderState.update(state => ({
      ...state,
      playerStats: {
        ...state.playerStats,
        totalTokensLost: state.playerStats.totalTokensLost + entryCost
      }
    }));
    
    return true;
  }
  return false;
}

export function awardReward(tier: number, wins: number): number {
  const baseReward = getBaseReward(tier);
  const streakBonus = getStreakBonus(wins);
  const totalReward = baseReward + streakBonus;
  
  // Award tokens
  aceTokens.update(tokens => tokens + totalReward);
  
  // Update stats
  ladderState.update(state => ({
    ...state,
    playerStats: {
      ...state.playerStats,
      totalTokensWon: state.playerStats.totalTokensWon + totalReward,
      longestStreak: Math.max(state.playerStats.longestStreak, wins)
    }
  }));
  
  // Update leaderboard
  updateLeaderboard(totalReward, wins);
  
  return totalReward;
}

function updateLeaderboard(tokensWon: number, streak: number) {
  leaderboard.update(entries => {
    // Find or create player entry
    const playerIndex = entries.findIndex(e => e.isPlayer);
    if (playerIndex >= 0) {
      entries[playerIndex].tokensWon += tokensWon;
      entries[playerIndex].winStreak = Math.max(entries[playerIndex].winStreak, streak);
    } else {
      entries.push({
        name: 'Player',
        portrait: '🎮',
        tokensWon,
        winStreak: streak,
        tier: 0,
        isPlayer: true
      });
    }
    // Sort by tokens won
    return entries.sort((a, b) => b.tokensWon - a.tokensWon);
  });
}

// ===========================================
// SAVE/LOAD
// ===========================================

export function saveLadderState() {
  ladderState.update(state => {
    localStorage.setItem(LADDER_SAVE_KEY, JSON.stringify(state));
    return state;
  });
}

export function loadLadderState(): boolean {
  if (typeof window === 'undefined') return false;
  
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

// ===========================================
// DETERMINISTIC RNG (ADR-1501)
// ===========================================

export function createDeterministicRNG(seed: number) {
  let s = seed;
  return function(): number {
    s = (s * 1664525 + 1013904223) % 2**32;
    return s / 2**32;
  };
}

export function getDeterministicRNG() {
  const state = get(ladderState);
  return createDeterministicRNG(state.deterministicSeed);
}

// Initialize
if (typeof window !== 'undefined') {
  loadLadderState();
}
