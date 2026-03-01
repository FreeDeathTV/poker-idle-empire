import { get } from 'svelte/store';
import { 
  ladderGameState, 
  ladderState,
  LADDER_CPU_PROFILES, 
  type LadderCPUProfile,
  type LadderGameState,
  createDeterministicRNG
} from './ladderStore';
import { getHandNotation, getWinProbability } from './poker';

// ===========================================
// LADDER AI SYSTEM
// ADR-1502: CPU AI Profiles & Behaviour System
// ===========================================

// Hand strength evaluation (0-100)
export function evaluateHandStrength(cards: string[], community: string[]): number {
  if (cards.length < 2) return 0;
  
  // Get hand notation for preflop strength
  const handNotation = getHandNotation(cards);
  const baseWinProb = getWinProbability(handNotation);
  
  // Scale to 0-100
  return Math.round(baseWinProb * 100);
}

// Get deterministic RNG from ladder state
function getLadderRNG(): () => number {
  const state = get(ladderState);
  return createDeterministicRNG(state.deterministicSeed);
}

// ===========================================
// CPU AI CLASS
// ADR-1502: Personality-driven decision making
// ===========================================

export class LadderAI {
  private profile: LadderCPUProfile;
  private rng: () => number;
  
  constructor(profile: LadderCPUProfile) {
    this.profile = profile;
    this.rng = getLadderRNG();
  }
  
  // Main decision method
  public makeDecision(): 'fold' | 'call' | 'check' | 'raise' | 'allin' {
    const state = get(ladderGameState);
    
    if (!state.gameActive || state.gameOver) {
      return 'check';
    }
    
    // Evaluate hand strength
    const handStrength = this.evaluateHand();
    
    // Get betting situation
    const callAmount = state.currentBet - state.cpuBet;
    const potOdds = state.pot > 0 ? callAmount / (state.pot + callAmount) : 0;
    
    // Apply personality and make decision
    const action = this.decideAction(handStrength, potOdds, state);
    
    return action;
  }
  
  // Evaluate hand strength
  private evaluateHand(): number {
    const state = get(ladderGameState);
    const handStrength = evaluateHandStrength(state.cpuCards, state.communityCards);
    
    // Apply profile-specific adjustments
    let adjustedStrength = handStrength;
    
    // Phase adjustments (ADR-1502)
    switch (state.phase) {
      case 'preflop':
        // More aggressive preflop for some profiles
        if (this.profile.aggression > 50) {
          adjustedStrength += 10;
        }
        break;
      case 'flop':
        // Standard
        break;
      case 'turn':
        // More cautious on later streets for tight players
        if (this.profile.callFrequency < 50) {
          adjustedStrength += 5;
        }
        break;
      case 'river':
        // Most cautious - showdown
        adjustedStrength = handStrength; // Use raw strength
        break;
    }
    
    // Stack depth adjustments (shallow stack = more all-in happy)
    if (state.cpuStack < state.bigBlind * 3) {
      adjustedStrength = Math.max(adjustedStrength, 40); // Push with any decent hand
    }
    
    return Math.min(100, Math.max(0, adjustedStrength));
  }
  
  // Decide action based on profile and situation
  private decideAction(
    handStrength: number, 
    potOdds: number, 
    state: LadderGameState
  ): 'fold' | 'call' | 'check' | 'raise' | 'allin' {
    const rng = this.rng;
    
    // ===========================================
    // ADR-1502: Profile-based decision logic
    // ===========================================
    
    // Check for all-in situations (short stacked)
    if (state.cpuStack <= state.bigBlind * 2) {
      if (handStrength > 30 || rng() > 0.3) {
        return 'allin';
      }
      return 'fold';
    }
    
    // Determine if facing a bet or can bet
    const facingBet = state.currentBet > state.cpuBet;
    const canCheck = state.currentBet === state.cpuBet;
    
    // ===========================================
    // Apply personality weights (ADR-1502)
    // ===========================================
    
    // Calculate action score based on hand strength + personality
    let actionScore = handStrength;
    
    // Aggression modifies willingness to bet/raise
    actionScore += (this.profile.aggression - 50) * 0.3;
    
    // Bluff tendency adds random strength
    if (rng() * 100 < this.profile.bluffFrequency) {
      actionScore += 25; // Bluff with weak hand
    }
    
    // Phase multiplier
    const phaseMultiplier = this.getPhaseMultiplier(state.phase);
    actionScore *= phaseMultiplier;
    
    // ===========================================
    // Make decision based on situation
    // ===========================================
    
    if (canCheck) {
      // No bet to face - can check or bet
      
      // Raise threshold check
      if (actionScore > this.profile.raiseFrequency) {
        // Raise!
        if (rng() < 0.3 || state.cpuStack < state.bigBlind * 5) {
          return 'allin';
        }
        return 'raise';
      }
      
      // Check
      return 'check';
      
    } else {
      // Facing a bet - must call, raise, or fold
      
      // Pot odds consideration
      const shouldCall = potOdds < (handStrength / 100);
      
      // Call threshold check
      if (actionScore < this.profile.callFrequency - 20) {
        // Fold
        return 'fold';
      } else if (actionScore < this.profile.callFrequency) {
        // Marginal - use pot odds and randomness
        if (shouldCall || rng() > 0.4) {
          return 'call';
        }
        return 'fold';
      } else {
        // Strong hand - call or raise
        
        // Check if should raise
        if (actionScore > this.profile.raiseFrequency) {
          if (rng() < 0.4 || state.cpuStack < state.bigBlind * 5) {
            return 'allin';
          }
          return 'raise';
        }
        
        return 'call';
      }
    }
  }
  
  // Phase-specific multipliers (ADR-1502)
  private getPhaseMultiplier(phase: string): number {
    switch (phase) {
      case 'preflop': return 1.1;  // More aggressive preflop
      case 'flop': return 1.0;    // Standard
      case 'turn': return 0.9;    // More cautious
      case 'river': return 0.8;   // Most cautious
      default: return 1.0;
    }
  }
  
  // Get suggested raise amount
  public getRaiseAmount(): number {
    const state = get(ladderGameState);
    const rng = this.rng;
    
    // Base raise is 2-3x big blind
    let raiseAmount = state.bigBlind * (2 + rng());
    
    // Adjust based on aggression
    raiseAmount *= (this.profile.aggression / 50);
    
    // Random variation
    raiseAmount *= (0.8 + rng() * 0.4);
    
    // Ensure minimum raise
    raiseAmount = Math.max(raiseAmount, state.bigBlind * 2);
    
    // Cap at stack
    raiseAmount = Math.min(raiseAmount, state.cpuStack);
    
    return Math.floor(raiseAmount);
  }
}

// ===========================================
// CPU MANAGER
// Handles CPU actions during gameplay
// ===========================================

export class LadderCPUManager {
  private currentAI: LadderAI | null = null;
  
  // Initialize AI for current opponent
  public initializeAI(): void {
    const state = get(ladderState);
    const opponentId = state.currentOpponentId;
    
    if (opponentId) {
      const profile = LADDER_CPU_PROFILES.find(p => p.id === opponentId);
      if (profile) {
        this.currentAI = new LadderAI(profile);
      }
    }
  }
  
  // Execute CPU action
  public executeAction(): void {
    const state = get(ladderGameState);
    
    if (!state.gameActive || state.gameOver) {
      return;
    }
    
    // Initialize AI if needed
    if (!this.currentAI) {
      this.initializeAI();
    }
    
    if (!this.currentAI) {
      console.warn('No CPU AI initialized');
      return;
    }
    
    // Get decision
    const action = this.currentAI.makeDecision();
    
    // Execute action based on type
    switch (action) {
      case 'fold':
        this.cpuFold();
        break;
      case 'call':
        this.cpuCall();
        break;
      case 'check':
        this.cpuCheck();
        break;
      case 'raise':
        this.cpuRaise();
        break;
      case 'allin':
        this.cpuAllIn();
        break;
    }
  }
  
  private cpuFold(): void {
    ladderGameState.update(s => {
      s.cpuAction = 'fold';
      s.gameOver = true;
      s.winner = 'player';
      s.playerStack += s.pot;
      s.pot = 0;
      return s;
    });
  }
  
  private cpuCall(): void {
    ladderGameState.update(s => {
      const callAmount = s.currentBet - s.cpuBet;
      
      if (callAmount >= s.cpuStack) {
        // All-in call
        s.pot += s.cpuStack;
        s.cpuBet += s.cpuStack;
        s.cpuStack = 0;
      } else {
        s.cpuStack -= callAmount;
        s.cpuBet += callAmount;
        s.pot += callAmount;
      }
      
      s.cpuAction = 'call';
      
      // If player also acted, check for phase advance
      if (s.playerAction && s.playerBet === s.currentBet) {
        // Bets matched - advance phase would be handled elsewhere
      }
      
      return s;
    });
  }
  
  private cpuCheck(): void {
    ladderGameState.update(s => {
      s.cpuAction = 'check';
      
      // If player also checked, advance phase
      if (s.playerAction === 'check') {
        // Phase advance handled elsewhere
      }
      
      return s;
    });
  }
  
  private cpuRaise(): void {
    if (!this.currentAI) return;
    
    const raiseAmount = this.currentAI.getRaiseAmount();
    
    ladderGameState.update(s => {
      if (raiseAmount >= s.cpuStack) {
        // All-in instead
        s.pot += s.cpuStack;
        s.cpuBet += s.cpuStack;
        s.currentBet = s.cpuBet;
        s.cpuStack = 0;
        s.cpuAction = 'allin';
      } else {
        s.cpuStack -= raiseAmount;
        s.cpuBet += raiseAmount;
        s.pot += raiseAmount;
        s.currentBet = s.cpuBet;
        s.cpuAction = 'raise';
      }
      
      return s;
    });
  }
  
  private cpuAllIn(): void {
    ladderGameState.update(s => {
      const allInAmount = s.cpuStack;
      s.pot += allInAmount;
      s.cpuBet += allInAmount;
      s.currentBet = s.cpuBet;
      s.cpuStack = 0;
      s.cpuAction = 'allin';
      
      return s;
    });
  }
}

// Export singleton
export const ladderCPUManager = new LadderCPUManager();
