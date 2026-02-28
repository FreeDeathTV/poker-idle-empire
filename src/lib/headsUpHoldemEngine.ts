import { writable, get } from 'svelte/store';
import { 
  gameState, 
  ladderState,
  CPU_PROFILES, 
  type GameState, 
  type CPUProfile 
} from './headsUpHoldemStore';

// Card utilities
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck;
}

export function shuffleDeck(deck: string[], rng: () => number): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Blind Ladder configuration
export const BLIND_LADDER = [
  { smallBlind: 1, bigBlind: 2 },    // 10BB
  { smallBlind: 1.5, bigBlind: 3 },  // 7.4BB
  { smallBlind: 2, bigBlind: 4 },    // 5BB
  { smallBlind: 4, bigBlind: 8 },    // 2.5BB
  { smallBlind: 8, bigBlind: 16 }    // 1BB
];

// Betting Engine
export class HeadsUpHoldemEngine {
  private deck: string[] = [];
  private deckIndex = 0;
  private rng: () => number;

  constructor() {
    this.rng = this.createRNG();
  }

  private createRNG(): () => number {
    // Use the deterministic RNG from the store
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

  private getRNG(): () => number {
    return this.rng;
  }

  // Initialize a new hand
  public startHand(): void {
    gameState.update(state => {
      // Reset game state
      const newState: GameState = {
        ...state,
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
        gameActive: true,
        gameOver: false,
        playerWins: null,
        winner: null
      };

      // Create and shuffle deck
      this.deck = shuffleDeck(createDeck(), this.getRNG());
      this.deckIndex = 0;

      // Deal cards
      newState.playerCards = [this.drawCard(), this.drawCard()];
      newState.cpuCards = [this.drawCard(), this.drawCard()];

      // Post blinds
      this.postBlinds(newState);

      return newState;
    });
  }

  private drawCard(): string {
    if (this.deckIndex >= this.deck.length) {
      throw new Error('Deck exhausted');
    }
    return this.deck[this.deckIndex++];
  }

  private postBlinds(state: GameState): void {
    // Player posts small blind
    state.playerStack -= state.smallBlind;
    state.pot += state.smallBlind;
    state.playerBet = state.smallBlind;
    state.currentBet = state.smallBlind;

    // CPU posts big blind
    state.cpuStack -= state.bigBlind;
    state.pot += state.bigBlind;
    state.cpuBet = state.bigBlind;
    state.currentBet = state.bigBlind;
  }

  // Player actions
  public playerFold(): void {
    gameState.update(state => {
      if (state.phase === 'showdown' || state.gameOver) return state;
      
      state.gameOver = true;
      state.playerWins = false;
      state.winner = 'cpu';
      state.cpuStack += state.pot;
      state.pot = 0;
      
      return state;
    });
  }

  public playerCall(): void {
    gameState.update(state => {
      if (state.phase === 'showdown' || state.gameOver) return state;
      
      const callAmount = state.currentBet - state.playerBet;
      if (callAmount <= 0) {
        // Already matched bet
        this.nextPhase(state);
        return state;
      }

      if (callAmount >= state.playerStack) {
        // All-in
        state.playerBet += state.playerStack;
        state.playerStack = 0;
      } else {
        state.playerStack -= callAmount;
        state.playerBet += callAmount;
      }
      
      state.pot += callAmount;
      
      // Check if both players are all-in or bets are matched
      if (state.playerStack === 0 || state.cpuStack === 0 || state.playerBet === state.cpuBet) {
        this.nextPhase(state);
      }
      
      return state;
    });
  }

  public playerCheck(): void {
    gameState.update(state => {
      if (state.phase === 'showdown' || state.gameOver) return state;
      
      // Can only check if no bet to call
      if (state.currentBet === state.playerBet) {
        this.nextPhase(state);
      }
      
      return state;
    });
  }

  public playerRaise(amount: number): void {
    gameState.update(state => {
      if (state.phase === 'showdown' || state.gameOver) return state;
      
      const raiseAmount = Math.max(amount, state.bigBlind); // Minimum raise is big blind
      const totalBet = state.playerBet + raiseAmount;
      
      if (totalBet >= state.playerStack) {
        // All-in
        state.playerBet += state.playerStack;
        state.playerStack = 0;
      } else {
        state.playerStack -= raiseAmount;
        state.playerBet += raiseAmount;
      }
      
      state.pot += raiseAmount;
      state.currentBet = state.playerBet;
      
      return state;
    });
  }

  public playerAllIn(): void {
    gameState.update(state => {
      if (state.phase === 'showdown' || state.gameOver) return state;
      
      const allInAmount = state.playerStack;
      state.playerBet += allInAmount;
      state.playerStack = 0;
      state.pot += allInAmount;
      state.currentBet = state.playerBet;
      
      return state;
    });
  }

  // Phase progression
  private nextPhase(state: GameState): void {
    switch (state.phase) {
      case 'preflop':
        state.phase = 'flop';
        state.communityCards = [this.drawCard(), this.drawCard(), this.drawCard()];
        this.resetBettingRound(state);
        break;
      case 'flop':
        state.phase = 'turn';
        state.communityCards.push(this.drawCard());
        this.resetBettingRound(state);
        break;
      case 'turn':
        state.phase = 'river';
        state.communityCards.push(this.drawCard());
        this.resetBettingRound(state);
        break;
      case 'river':
        state.phase = 'showdown';
        this.determineWinner(state);
        break;
      case 'showdown':
        // Hand is already over
        break;
    }
  }

  private resetBettingRound(state: GameState): void {
    state.playerBet = 0;
    state.cpuBet = 0;
    state.currentBet = 0;
    state.playerAction = null;
    state.cpuAction = null;
  }

  private determineWinner(state: GameState): void {
    // For now, implement a simple random winner
    // This will be replaced with actual poker hand evaluation in a future phase
    const rng = this.getRNG();
    const playerWins = rng() > 0.5;
    
    state.gameOver = true;
    state.playerWins = playerWins;
    state.winner = playerWins ? 'player' : 'cpu';
    
    if (playerWins) {
      state.playerStack += state.pot;
    } else {
      state.cpuStack += state.pot;
    }
    state.pot = 0;
  }

  // Blind progression
  public updateBlinds(handCount: number): void {
    gameState.update(state => {
      const blindIndex = Math.min(Math.floor(handCount / 10), BLIND_LADDER.length - 1);
      const blinds = BLIND_LADDER[blindIndex];
      
      state.smallBlind = blinds.smallBlind;
      state.bigBlind = blinds.bigBlind;
      
      return state;
    });
  }

  // Utility methods
  public getCurrentState(): GameState {
    return get(gameState);
  }

  public canPlayerAct(): boolean {
    const state = get(gameState);
    return state.gameActive && !state.gameOver && state.phase !== 'showdown';
  }

  public getActionOptions(): string[] {
    const state = get(gameState);
    const options: string[] = [];
    
    if (!this.canPlayerAct()) return options;
    
    if (state.currentBet === state.playerBet) {
      options.push('check');
    } else {
      options.push('call');
    }
    
    options.push('raise', 'allin', 'fold');
    return options;
  }
}

// Export singleton instance
export const headsUpEngine = new HeadsUpHoldemEngine();