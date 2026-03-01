import { get } from 'svelte/store';
import {
  ladderGameState,
  ladderState,
  type LadderGameState,
  type GamePhase,
  type PlayerAction,
  type Winner,
  createDeterministicRNG
} from './ladderStore';
import { Hand } from 'pokersolver';

// Card format conversion: ladder engine uses unicode suits, pokersolver uses letter suits
const UNICODE_TO_STANDARD_SUIT: Record<string, string> = {
  '♠': 's',
  '♥': 'h',
  '♦': 'd',
  '♣': 'c'
};

// Convert unicode card to pokersolver format (e.g., "7♥" -> "7h")
function toSolverFormat(card: string): string {
  if (!card || card.length < 2) return card;
  const rank = card[0];
  const unicodeSuit = card[1];
  const standardSuit = UNICODE_TO_STANDARD_SUIT[unicodeSuit] || unicodeSuit;
  return rank + standardSuit;
}

// ===========================================
// LADDER BETTING ENGINE
// ADR-1501: Heads-Up Betting Engine & Blind Ladder
// ===========================================

// Card utilities
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export function createLadderDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck;
}

export function shuffleLadderDeck(deck: string[], rng: () => number): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ===========================================
// BLIND LADDER (ADR-1501)
// Starting: 1000 chips, 50/100 blinds (10BB)
// After 2 hands: 75/150 blinds (7.5BB)
// After 2 more: 100/200 blinds (5BB)
// After 2 more: 150/300 blinds (3.3BB)
// After 2 more: 200/400 blinds (2.5BB)
// After 2 more: 250/500 blinds (2BB)
// After 2 more: 300/600 blinds (1.7BB)
// After 2 more: 400/800 blinds (1.25BB)
// After 2 more: 500/1000 blinds (1BB) - game ends if deadlock
// ===========================================

const BLIND_LADDER = [
  { smallBlind: 50, bigBlind: 100, stackChips: 1000 },  // Level 0: 10BB (hands 0-1)
  { smallBlind: 75, bigBlind: 150, stackChips: 1000 },  // Level 1: 7.5BB (hands 2-3)
  { smallBlind: 100, bigBlind: 200, stackChips: 1000 },  // Level 2: 5BB (hands 4-5)
  { smallBlind: 150, bigBlind: 300, stackChips: 1000 },  // Level 3: 3.3BB (hands 6-7)
  { smallBlind: 200, bigBlind: 400, stackChips: 1000 },  // Level 4: 2.5BB (hands 8-9)
  { smallBlind: 250, bigBlind: 500, stackChips: 1000 },  // Level 5: 2BB (hands 10-11)
  { smallBlind: 300, bigBlind: 600, stackChips: 1000 },  // Level 6: 1.7BB (hands 12-13)
  { smallBlind: 400, bigBlind: 800, stackChips: 1000 },  // Level 7: 1.25BB (hands 14-15)
  { smallBlind: 500, bigBlind: 1000, stackChips: 1000 }   // Level 8: 1BB (hands 16+, game ends if deadlock)
];

// ===========================================
// LADDER ENGINE CLASS
// ===========================================

export class LadderEngine {
  private deck: string[] = [];
  private deckIndex = 0;
  private rng: () => number;
  private handCount = 0;

  constructor() {
    // Use random seed for each game session
    this.rng = createDeterministicRNG(Math.floor(Math.random() * 1000000));
  }

  // Initialize engine with seed (for replay functionality)
  public initialize(seed: number): void {
    this.rng = createDeterministicRNG(seed);
    this.handCount = 0;
  }

  // Get current RNG
  private getRNG(): () => number {
    return this.rng;
  }

  // Draw a card from deck
  private drawCard(): string {
    if (this.deckIndex >= this.deck.length) {
      // Reshuffle if deck exhausted (shouldn't happen in heads-up)
      this.deck = shuffleLadderDeck(createLadderDeck(), this.getRNG());
      this.deckIndex = 0;
    }
    return this.deck[this.deckIndex++];
  }

  // Start a new hand
  public startHand(): void {
    const ladderStateValue = get(ladderState);
    // Blind level increases every 2 hands
    const currentBlindLevel = Math.min(Math.floor(this.handCount / 2), BLIND_LADDER.length - 1);
    const blindConfig = BLIND_LADDER[currentBlindLevel];

    // Determine button position (rotates each hand)
    const buttonPosition = this.handCount % 2 === 0 ? 'SB' : 'BB';
    const playerPosition = buttonPosition === 'SB' ? 'BB' : 'SB';

    // Create and shuffle deck
    this.deck = shuffleLadderDeck(createLadderDeck(), this.getRNG());
    this.deckIndex = 0;

    // Deal hole cards
    const playerCards = [this.drawCard(), this.drawCard()];
    const cpuCards = [this.drawCard(), this.drawCard()];

    // Get current stacks from previous hand - preserve unless we advanced to new blind level
    const currentState = get(ladderGameState);
    const isNewBlindLevel = currentState.blindLevel !== currentBlindLevel;

    // Initialize game state - preserve stacks unless we advanced to a new blind level
    const newState: LadderGameState = {
      gameActive: true,
      gameOver: false,
      winner: null,
      phase: 'preflop',
      handNumber: this.handCount,
      playerStack: isNewBlindLevel ? blindConfig.stackChips : (currentState.playerStack || blindConfig.stackChips),
      cpuStack: isNewBlindLevel ? blindConfig.stackChips : (currentState.cpuStack || blindConfig.stackChips),
      pot: 0,
      smallBlind: blindConfig.smallBlind,
      bigBlind: blindConfig.bigBlind,
      blindLevel: currentBlindLevel,
      buttonPosition,
      playerPosition,
      playerCards,
      cpuCards,
      communityCards: [],
      currentBet: 0,
      playerBet: 0,
      cpuBet: 0,
      playerAction: null,
      cpuAction: null,
      canPlayerAct: false,
      actionOptions: []
    };

    // Post blinds
    this.postBlinds(newState);

    // Update store
    ladderGameState.set(newState);

    // Determine who acts first preflop
    // In heads-up, action starts with player in BB
    if (newState.playerPosition === 'BB') {
      // Player is in big blind, acts first preflop
      this.updatePlayerActionOptions();
    } else {
      // CPU acts first, but we need player to act after
      setTimeout(() => this.processCPUAction(), 500);
    }
  }

  // Post blinds
  private postBlinds(state: LadderGameState): void {
    const { smallBlind, bigBlind } = state;

    // Determine who posts what based on position
    const playerIsSB = state.playerPosition === 'SB';

    if (playerIsSB) {
      // Player posts small blind
      state.playerStack -= smallBlind;
      state.playerBet = smallBlind;
      state.pot += smallBlind;

      // CPU posts big blind
      state.cpuStack -= bigBlind;
      state.cpuBet = bigBlind;
      state.pot += bigBlind;
    } else {
      // CPU posts small blind
      state.cpuStack -= smallBlind;
      state.cpuBet = smallBlind;
      state.pot += smallBlind;

      // Player posts big blind
      state.playerStack -= bigBlind;
      state.playerBet = bigBlind;
      state.pot += bigBlind;
    }

    state.currentBet = bigBlind;
  }

  // Player actions
  public playerFold(): void {
    ladderGameState.update(state => {
      if (!state.gameActive || state.gameOver || state.phase === 'showdown') return state;

      state.gameOver = true;
      state.winner = 'cpu';
      state.cpuStack += state.pot;
      state.pot = 0;
      state.canPlayerAct = false;
      state.playerAction = 'fold';

      return state;
    });
  }

  public playerCall(): void {
    ladderGameState.update(state => {
      if (!state.gameActive || state.gameOver || state.phase === 'showdown') return state;

      const callAmount = state.currentBet - state.playerBet;

      if (callAmount >= state.playerStack) {
        // All-in call
        state.pot += state.playerStack;
        state.playerBet += state.playerStack;
        state.playerStack = 0;
      } else {
        state.playerStack -= callAmount;
        state.playerBet += callAmount;
        state.pot += callAmount;
      }

      state.playerAction = 'call';

      // Check if both players are all-in or bets matched
      if (state.playerStack === 0 || state.cpuStack === 0 || state.playerBet === state.currentBet) {
        this.advanceToNextPhase();
      } else {
        // CPU responds
        setTimeout(() => this.processCPUAction(), 500);
      }

      return state;
    });
  }

  public playerCheck(): void {
    ladderGameState.update(state => {
      if (!state.gameActive || state.gameOver || state.phase === 'showdown') return state;

      // Can only check if current bet is matched
      if (state.currentBet === state.playerBet) {
        state.playerAction = 'check';

        // If CPU also checked, advance
        if (state.cpuAction === 'check' || state.cpuAction === null) {
          this.advanceToNextPhase();
        } else {
          // CPU has a bet to act on
          setTimeout(() => this.processCPUAction(), 500);
        }
      }

      return state;
    });
  }

  public playerRaise(amount: number): void {
    ladderGameState.update(state => {
      if (!state.gameActive || state.gameOver || state.phase === 'showdown') return state;

      const minRaise = state.currentBet + state.bigBlind;
      const raiseAmount = Math.max(amount, minRaise);
      const totalBet = state.playerBet + raiseAmount;

      if (totalBet >= state.playerStack + state.playerBet) {
        // All-in
        state.pot += state.playerStack;
        state.playerBet += state.playerStack;
        state.playerStack = 0;
      } else {
        state.playerStack -= raiseAmount;
        state.playerBet += raiseAmount;
        state.pot += raiseAmount;
      }

      state.currentBet = state.playerBet;
      state.playerAction = 'raise';

      // CPU responds
      setTimeout(() => this.processCPUAction(), 500);

      return state;
    });
  }

  public playerAllIn(): void {
    ladderGameState.update(state => {
      if (!state.gameActive || state.gameOver || state.phase === 'showdown') return state;

      const allInAmount = state.playerStack;
      state.pot += allInAmount;
      state.playerBet += allInAmount;
      state.playerStack = 0;
      state.currentBet = state.playerBet;
      state.playerAction = 'allin';

      // CPU responds
      setTimeout(() => this.processCPUAction(), 500);

      return state;
    });
  }

  // CPU action processing
  private processCPUAction(): void {
    // For now, use simple random AI (will be replaced by ladderAI.ts)
    const state = get(ladderGameState);
    if (!state.gameActive || state.gameOver) return;

    // Simple decision logic
    const rng = this.getRNG();
    const action = rng();

    // If player bet, CPU must respond
    if (state.currentBet > state.cpuBet) {
      // Facing a bet - decide whether to call/fold/raise
      if (action < 0.2) {
        // Fold (20%)
        ladderGameState.update(s => {
          s.cpuAction = 'fold';
          s.gameOver = true;
          s.winner = 'player';
          s.playerStack += s.pot;
          s.pot = 0;
          s.canPlayerAct = false;
          return s;
        });
      } else if (action < 0.7) {
        // Call (50%)
        this.cpuCall();
      } else {
        // Raise/All-in (30%)
        this.cpuRaiseOrAllIn();
      }
    } else {
      // No bet to face - check or bet
      if (action < 0.6) {
        // Check (60%)
        ladderGameState.update(s => {
          s.cpuAction = 'check';
          // If player also checked, advance
          if (s.playerAction === 'check') {
            this.advanceToNextPhase();
          }
          return s;
        });
      } else {
        // Bet/Raise (40%)
        this.cpuRaiseOrAllIn();
      }
    }
  }

  private cpuCall(): void {
    ladderGameState.update(state => {
      const callAmount = state.currentBet - state.cpuBet;

      if (callAmount >= state.cpuStack) {
        // All-in
        state.pot += state.cpuStack;
        state.cpuBet += state.cpuStack;
        state.cpuStack = 0;
      } else {
        state.cpuStack -= callAmount;
        state.cpuBet += callAmount;
        state.pot += callAmount;
      }

      state.cpuAction = 'call';

      // Check if bets are matched or someone all-in
      if (state.cpuStack === 0 || state.playerStack === 0 || state.cpuBet === state.currentBet) {
        this.advanceToNextPhase();
      } else {
        // Player's turn
        this.updatePlayerActionOptions();
      }

      return state;
    });
  }

  private cpuRaiseOrAllIn(): void {
    ladderGameState.update(state => {
      // All-in if short stacked, otherwise raise
      if (state.cpuStack < state.bigBlind * 3) {
        state.pot += state.cpuStack;
        state.cpuBet += state.cpuStack;
        state.currentBet = state.cpuBet;
        state.cpuStack = 0;
        state.cpuAction = 'allin';
      } else {
        const raiseAmount = state.bigBlind * 2;
        state.cpuStack -= raiseAmount;
        state.cpuBet += raiseAmount;
        state.pot += raiseAmount;
        state.currentBet = state.cpuBet;
        state.cpuAction = 'raise';
      }

      // Player responds
      this.updatePlayerActionOptions();

      return state;
    });
  }

  // Advance to next betting phase
  private advanceToNextPhase(): void {
    // Get current state for the switch
    const currentState = get(ladderGameState);
    const currentPhase = currentState.phase;

    switch (currentPhase) {
      case 'preflop':
        // Deal flop
        this.dealCommunityCards(3);
        ladderGameState.update(s => {
          s.phase = 'flop';
          s.playerBet = 0;
          s.cpuBet = 0;
          s.currentBet = 0;
          s.playerAction = null;
          s.cpuAction = null;
          return s;
        });
        // After preflop, SB acts first
        setTimeout(() => {
          const updatedState = get(ladderGameState);
          if (updatedState.playerPosition === 'SB') {
            this.updatePlayerActionOptions();
          } else {
            setTimeout(() => this.processCPUAction(), 500);
          }
        }, 10);
        break;

      case 'flop':
        // Deal turn
        this.dealCommunityCards(1);
        ladderGameState.update(s => {
          s.phase = 'turn';
          s.playerBet = 0;
          s.cpuBet = 0;
          s.currentBet = 0;
          s.playerAction = null;
          s.cpuAction = null;
          return s;
        });
        setTimeout(() => {
          const updatedState = get(ladderGameState);
          if (updatedState.playerPosition === 'SB') {
            this.updatePlayerActionOptions();
          } else {
            setTimeout(() => this.processCPUAction(), 500);
          }
        }, 10);
        break;

      case 'turn':
        // Deal river
        this.dealCommunityCards(1);
        ladderGameState.update(s => {
          s.phase = 'river';
          s.playerBet = 0;
          s.cpuBet = 0;
          s.currentBet = 0;
          s.playerAction = null;
          s.cpuAction = null;
          return s;
        });
        setTimeout(() => {
          const updatedState = get(ladderGameState);
          if (updatedState.playerPosition === 'SB') {
            this.updatePlayerActionOptions();
          } else {
            setTimeout(() => this.processCPUAction(), 500);
          }
        }, 10);
        break;

      case 'river':
        // Showdown
        this.determineShowdown();
        break;
    }
  }

  private dealCommunityCards(count: number): void {
    ladderGameState.update(state => {
      for (let i = 0; i < count; i++) {
        state.communityCards.push(this.drawCard());
      }
      return state;
    });
  }

  // Showdown - evaluate hands using pokersolver
  private determineShowdown(): void {
    const state = get(ladderGameState);

    // Combine hole cards with community cards for evaluation (convert to solver format)
    const player7Cards = [...state.playerCards, ...state.communityCards].map(toSolverFormat);
    const cpu7Cards = [...state.cpuCards, ...state.communityCards].map(toSolverFormat);

    // Evaluate hands using pokersolver
    const playerHand = Hand.solve(player7Cards);
    const cpuHand = Hand.solve(cpu7Cards);

    // Determine winner
    const winners = Hand.winners([playerHand, cpuHand]);
    let winner: Winner;

    if (winners.length === 1) {
      // Single winner
      winner = winners[0] === playerHand ? 'player' : 'cpu';
    } else {
      // Tie - check if both are in winners
      const playerWins = winners.includes(playerHand);
      const cpuWins = winners.includes(cpuHand);
      if (playerWins && cpuWins) {
        winner = 'tie';
      } else {
        winner = playerWins ? 'player' : 'cpu';
      }
    }

    ladderGameState.update(s => {
      s.phase = 'showdown';
      s.gameOver = true;
      s.winner = winner;
      s.canPlayerAct = false;

      if (winner === 'player') {
        s.playerStack += s.pot;
      } else if (winner === 'cpu') {
        s.cpuStack += s.pot;
      } else {
        // Tie - split pot
        s.playerStack += s.pot / 2;
        s.cpuStack += s.pot / 2;
      }
      s.pot = 0;

      return s;
    });

    // Check for blind level advancement or game end
    setTimeout(() => this.checkGameEnd(), 1000);
  }

  // Check if game should end or advance blind level
  private checkGameEnd(): void {
    const state = get(ladderGameState);

    // Check if someone busted (stack is 0)
    if (state.playerStack <= 0 || state.cpuStack <= 0) {
      // Game over - someone busted, DON'T auto-start next hand
      console.log('Game Over: Someone busted!', { playerStack: state.playerStack, cpuStack: state.cpuStack });
      return;
    }

    // Increment hand count for next hand (so next startHand uses new level)
    this.handCount++;

    // Calculate next blind level
    const nextBlindLevel = Math.min(Math.floor(this.handCount / 2), BLIND_LADDER.length - 1);

    // Check if reached final blind level with both players still alive (deadlock)
    if (nextBlindLevel >= BLIND_LADDER.length - 1 && state.playerStack > 0 && state.cpuStack > 0) {
      console.log('Game Over: Deadlock at final blind level!', { playerStack: state.playerStack, cpuStack: state.cpuStack });
      return;
    }

    // Log for debugging
    const currentBlindLevel = Math.min(Math.floor((this.handCount - 1) / 2), BLIND_LADDER.length - 1);
    const blindConfig = BLIND_LADDER[currentBlindLevel];
    const effectiveBB = state.playerStack / blindConfig.bigBlind;
    console.log(`Hand complete. handCount: ${this.handCount - 1}, blindLevel: ${currentBlindLevel}, effectiveBB: ${effectiveBB.toFixed(1)}, playerStack: ${state.playerStack}, cpuStack: ${state.cpuStack}`);
  }

  // Update player's available actions
  private updatePlayerActionOptions(): void {
    ladderGameState.update(state => {
      const options: string[] = [];

      // Always can fold
      options.push('fold');

      // Check or call based on current bet
      if (state.currentBet === state.playerBet) {
        // No bet to call - can check
        options.push('check');
      } else {
        // Have to call
        options.push('call');
      }

      // Can raise if has enough stack
      if (state.playerStack > state.currentBet - state.playerBet + state.bigBlind) {
        options.push('raise');
      }

      // Can go all-in
      if (state.playerStack > 0) {
        options.push('allin');
      }

      state.actionOptions = options;
      state.canPlayerAct = true;

      return state;
    });
  }

  // Get current game state
  public getCurrentState(): LadderGameState {
    return get(ladderGameState);
  }

  // Check if player can act
  public canPlayerAct(): boolean {
    const state = get(ladderGameState);
    return state.gameActive && !state.gameOver && state.canPlayerAct;
  }

  // Get available actions
  public getActionOptions(): string[] {
    const state = get(ladderGameState);
    return state.actionOptions;
  }

  // Get current hand count
  public getHandCount(): number {
    return this.handCount;
  }

  // Reset game
  public resetGame(): void {
    this.handCount = 0;
    ladderGameState.set({
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
    });
  }
}

// Export singleton
export const ladderEngine = new LadderEngine();
