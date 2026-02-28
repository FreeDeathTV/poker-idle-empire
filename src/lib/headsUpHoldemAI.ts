import { get } from 'svelte/store';
import { 
  gameState, 
  ladderState,
  CPU_PROFILES, 
  type GameState, 
  type CPUProfile 
} from './headsUpHoldemStore';
import { headsUpEngine } from './headsUpHoldemEngine';

// Hand strength evaluation (simplified for now)
export function evaluateHandStrength(cards: string[], community: string[]): number {
  // For now, return a random strength between 0-100
  // This will be replaced with actual poker hand evaluation in a future phase
  const rng = getDeterministicRNG();
  return Math.floor(rng() * 100);
}

// Get deterministic RNG
function getDeterministicRNG(): () => number {
  let seed = 12345;
  ladderState.subscribe(state => {
    seed = state.deterministicSeed || 12345;
  })();
  
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) % 2**32;
    return s / 2**32;
  };
}

// CPU Decision Engine
export class CPUAI {
  private profile: CPUProfile;
  private rng: () => number;

  constructor(profile: CPUProfile) {
    this.profile = profile;
    this.rng = getDeterministicRNG();
  }

  public makeDecision(): 'fold' | 'call' | 'check' | 'raise' | 'allin' {
    const state = get(gameState);
    
    // Evaluate hand strength
    const handStrength = evaluateHandStrength(state.cpuCards, state.communityCards);
    
    // Get current betting situation
    const currentBet = state.currentBet;
    const cpuBet = state.cpuBet;
    const callAmount = currentBet - cpuBet;
    const potOdds = callAmount / (state.pot + callAmount);
    
    // Determine action based on profile and situation
    const action = this.decideAction(handStrength, potOdds, state);
    
    return action;
  }

  private decideAction(handStrength: number, potOdds: number, state: GameState): 'fold' | 'call' | 'check' | 'raise' | 'allin' {
    const rng = this.rng;
    
    // Shallow stack logic (all-in heavy when low on chips)
    if (state.cpuStack < state.bigBlind * 5) {
      if (handStrength > 40 || rng() > 0.7) {
        return 'allin';
      }
    }

    // Base decision logic
    let decisionScore = handStrength;
    
    // Adjust based on aggression
    decisionScore += (this.profile.aggression - 50) * 0.5;
    
    // Adjust based on bluff tendency
    if (rng() < this.profile.bluff / 100) {
      decisionScore += 20; // Bluff increases decision score
    }

    // Phase-specific adjustments
    const phaseMultiplier = this.getPhaseMultiplier(state.phase);
    decisionScore *= phaseMultiplier;

    // Determine action
    if (state.currentBet === state.cpuBet) {
      // No bet to call - can check or raise
      if (decisionScore > this.profile.raiseThreshold) {
        return this.decideRaise();
      } else {
        return 'check';
      }
    } else {
      // There's a bet to call
      const callThreshold = this.profile.callThreshold;
      
      if (decisionScore < callThreshold - 20) {
        return 'fold';
      } else if (decisionScore < callThreshold) {
        return 'call';
      } else {
        return this.decideRaise();
      }
    }
  }

  private getPhaseMultiplier(phase: string): number {
    switch (phase) {
      case 'preflop': return 1.2; // More aggressive pre-flop
      case 'flop': return 1.0;
      case 'turn': return 0.9; // More cautious
      case 'river': return 0.8; // Most cautious
      default: return 1.0;
    }
  }

  private decideRaise(): 'raise' | 'allin' {
    const rng = this.rng;
    
    // MrMark has special exploit logic
    if (this.profile.id === 'mrMark') {
      return this.mrMarkExploitLogic();
    }

    // Normal raise logic
    const raiseProbability = this.profile.aggression / 100;
    
    if (rng() < 0.3) {
      return 'allin'; // 30% chance of all-in when raising
    } else {
      return 'raise';
    }
  }

  private mrMarkExploitLogic(): 'raise' | 'allin' {
    // MrMark analyzes player patterns and exploits them
    const rng = this.rng;
    
    // 60% chance to go all-in to exploit player tendencies
    if (rng() < 0.6) {
      return 'allin';
    } else {
      return 'raise';
    }
  }

  // Get suggested raise amount
  public getSuggestedRaiseAmount(): number {
    const state = get(gameState);
    const rng = this.rng;
    
    // Base raise amount
    let raiseAmount = state.bigBlind * 3;
    
    // Adjust based on aggression
    raiseAmount += (this.profile.aggression / 10) * state.bigBlind;
    
    // Random variation
    raiseAmount *= (0.8 + rng() * 0.4);
    
    // Ensure minimum raise
    raiseAmount = Math.max(raiseAmount, state.bigBlind * 2);
    
    // Don't exceed stack
    raiseAmount = Math.min(raiseAmount, state.cpuStack);
    
    return Math.floor(raiseAmount);
  }
}

// CPU Manager
export class CPUManager {
  private currentAI: CPUAI | null = null;

  public initializeAI(): void {
    const state = get(ladderState);
    const opponentId = state.currentOpponentId;
    
    if (opponentId) {
      const profile = CPU_PROFILES.find(p => p.id === opponentId);
      if (profile) {
        this.currentAI = new CPUAI(profile);
      }
    }
  }

  public makeCPUAction(): void {
    if (!this.currentAI) {
      this.initializeAI();
    }

    if (this.currentAI) {
      const action = this.currentAI.makeDecision();
      const state = get(gameState);
      
      // Execute the action
      switch (action) {
        case 'fold':
          // CPU folds
          gameState.update(s => {
            s.gameOver = true;
            s.playerWins = true;
            s.winner = 'player';
            s.playerStack += s.pot;
            s.pot = 0;
            return s;
          });
          break;
          
        case 'call':
          // CPU calls
          const callAmount = state.currentBet - state.cpuBet;
          if (callAmount >= state.cpuStack) {
            // All-in
            gameState.update(s => {
              s.cpuBet += s.cpuStack;
              s.cpuStack = 0;
              s.pot += s.cpuStack;
              s.currentBet = s.cpuBet;
              return s;
            });
          } else {
            gameState.update(s => {
              s.cpuStack -= callAmount;
              s.cpuBet += callAmount;
              s.pot += callAmount;
              return s;
            });
          }
          break;
          
        case 'check':
          // CPU checks - advance phase
          this.advancePhase();
          break;
          
        case 'raise':
          const raiseAmount = this.currentAI.getSuggestedRaiseAmount();
          gameState.update(s => {
            s.cpuStack -= raiseAmount;
            s.cpuBet += raiseAmount;
            s.pot += raiseAmount;
            s.currentBet = s.cpuBet;
            return s;
          });
          break;
          
        case 'allin':
          const allInAmount = state.cpuStack;
          gameState.update(s => {
            s.cpuBet += s.cpuStack;
            s.cpuStack = 0;
            s.pot += allInAmount;
            s.currentBet = s.cpuBet;
            return s;
          });
          break;
      }
      
      // Update game state
      gameState.update(s => {
        s.cpuAction = action;
        return s;
      });
    }
  }

  private advancePhase(): void {
    const state = get(gameState);
    switch (state.phase) {
      case 'preflop':
        gameState.update(s => {
          s.phase = 'flop';
          s.communityCards = this.dealCommunityCards(3);
          this.resetBettingRound(s);
          return s;
        });
        break;
      case 'flop':
        gameState.update(s => {
          s.phase = 'turn';
          s.communityCards.push(this.drawCard());
          this.resetBettingRound(s);
          return s;
        });
        break;
      case 'turn':
        gameState.update(s => {
          s.phase = 'river';
          s.communityCards.push(this.drawCard());
          this.resetBettingRound(s);
          return s;
        });
        break;
      case 'river':
        gameState.update(s => {
          s.phase = 'showdown';
          this.determineWinner(s);
          return s;
        });
        break;
    }
  }

  private dealCommunityCards(count: number): string[] {
    // This would use the actual deck from the engine
    // For now, return empty array
    return [];
  }

  private drawCard(): string {
    // This would use the actual deck from the engine
    // For now, return placeholder
    return '🂠';
  }

  private resetBettingRound(state: GameState): void {
    state.playerBet = 0;
    state.cpuBet = 0;
    state.currentBet = 0;
    state.playerAction = null;
    state.cpuAction = null;
  }

  private determineWinner(state: GameState): void {
    // Use the engine's winner determination
    const engineState = headsUpEngine.getCurrentState();
    gameState.update(s => {
      s.gameOver = true;
      s.playerWins = engineState.playerWins;
      s.winner = engineState.winner;
      s.playerStack = engineState.playerStack;
      s.cpuStack = engineState.cpuStack;
      s.pot = 0;
      return s;
    });
  }
}

// Export singleton instance
export const cpuManager = new CPUManager();