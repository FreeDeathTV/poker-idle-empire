import { writable, get } from 'svelte/store';
import { aceTokens } from './stores';
import { saveGame } from './gameLogic';

// ============================================
// TYPES
// ============================================

export type BetTier = 'SMALL' | 'MEDIUM' | 'LARGE';
export type GamePhase = 'IDLE' | 'DEAL' | 'PLAYER_TURN' | 'RESOLVE' | 'PAYOUT';
export type GameResult = 'WIN' | 'LOSE' | 'PUSH' | null;

export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardSuit = '♠' | '♥' | '♦' | '♣';

export interface Card {
  rank: CardRank;
  suit: CardSuit;
  value: number;
  faceUp: boolean;
}

export interface BlackjackState {
  isOpen: boolean;
  phase: GamePhase;
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  betTier: BetTier;
  result: GameResult;
  isBlackjack: boolean;
}

// ============================================
// CONSTANTS
// ============================================

// Fixed reward values (per V1001 spec - values from economy sheet)
export const REWARD_VALUES: Record<BetTier, number> = {
  SMALL: 1,
  MEDIUM: 3,
  LARGE: 5
};

// Base deck order (sorted by suit then rank)
const BASE_DECK = [
  'A♠', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', '10♠', 'J♠', 'Q♠', 'K♠',
  'A♥', '2♥', '3♥', '4♥', '5♥', '6♥', '7♥', '8♥', '9♥', '10♥', 'J♥', 'Q♥', 'K♥',
  'A♦', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', '8♦', '9♦', '10♦', 'J♦', 'Q♦', 'K♦',
  'A♣', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣', '8♣', '9♣', '10♣', 'J♣', 'Q♣', 'K♣'
];

// Round counter for deterministic seeding (increments each round)
let roundCounter = 0;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Deterministic PRNG using linear congruential generator
 * Returns value between 0 and 1
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function parseCard(cardString: string): Card {
  const rank = cardString.slice(0, -1) as CardRank;
  const suit = cardString.slice(-1) as CardSuit;
  
  let value: number;
  if (rank === 'A') {
    value = 11;
  } else if (['K', 'Q', 'J'].includes(rank)) {
    value = 10;
  } else {
    value = parseInt(rank, 10);
  }
  
  return { rank, suit, value, faceUp: true };
}

/**
 * Fisher-Yates shuffle with seeded random
 */
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const random = seededRandom(seed);
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Create a deterministic deck using seeded shuffle
 * Each round gets a different seed for varied card order
 */
export function createDeck(): Card[] {
  // Increment round counter and use it as seed
  roundCounter++;
  
  // Seed based on round counter + timestamp second for variety
  const seed = (roundCounter * 7 + Math.floor(Date.now() / 1000)) % 233280;
  
  // Shuffle the base deck with the seed
  const shuffled = shuffleWithSeed(BASE_DECK, seed);
  
  return shuffled.map(parseCard);
}

/**
 * Deal one card from the deck (from the top)
 */
export function dealCard(deck: Card[]): { card: Card; remainingDeck: Card[] } {
  const card = deck[0];
  const remainingDeck = deck.slice(1);
  return { card, remainingDeck };
}

/**
 * Calculate blackjack total with Ace handling
 * Aces count as 11 unless that would bust, then count as 1
 */
export function calculateTotal(hand: Card[]): number {
  let total = 0;
  let aces = 0;
  
  for (const card of hand) {
    if (!card.faceUp) continue;
    total += card.value;
    if (card.rank === 'A') {
      aces += 1;
    }
  }
  
  // Convert Aces from 11 to 1 if busting
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  
  return total;
}

/**
 * Check if hand is a blackjack (21 with exactly 2 cards)
 */
export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateTotal(hand) === 21;
}

/**
 * Dealer logic: hit until total >= 17
 * Returns the dealer's final hand
 */
export function dealerPlay(dealerHand: Card[], deck: Card[]): { hand: Card[]; remainingDeck: Card[] } {
  let currentHand = [...dealerHand];
  let currentDeck = [...deck];
  
  while (calculateTotal(currentHand) < 17) {
    const { card, remainingDeck } = dealCard(currentDeck);
    currentHand = [...currentHand, card];
    currentDeck = remainingDeck;
  }
  
  return { hand: currentHand, remainingDeck: currentDeck };
}

/**
 * Apply reward to player's Ace Tokens
 * Only called on WIN results
 */
export function applyBlackjackReward(result: GameResult, betTier: BetTier, isBlackjack: boolean): number {
  if (result !== 'WIN') {
    return 0;
  }
  
  let reward = REWARD_VALUES[betTier];
  
  // Blackjack bonus: 1.5x
  if (isBlackjack) {
    reward = Math.floor(reward * 1.5);
  }
  
  // Apply the reward
  aceTokens.update(n => n + reward);
  
  return reward;
}

// ============================================
// STORE
// ============================================

const initialState: BlackjackState = {
  isOpen: false,
  phase: 'IDLE',
  playerHand: [],
  dealerHand: [],
  deck: [],
  betTier: 'SMALL',
  result: null,
  isBlackjack: false
};

function createBlackjackStore() {
  const { subscribe, set, update } = writable<BlackjackState>(initialState);
  
  return {
    subscribe,
    
    // Open the blackjack modal
    openGame() {
      update(state => ({
        ...state,
        isOpen: true,
        phase: 'IDLE',
        playerHand: [],
        dealerHand: [],
        deck: [],
        result: null,
        isBlackjack: false
      }));
    },
    
    // Close the blackjack modal
    closeGame() {
      set(initialState);
    },
    
    // Set bet tier
    setBetTier(tier: BetTier) {
      update(state => ({ ...state, betTier: tier }));
    },
    
    // Start a new hand (deal cards)
    deal() {
      const deck = createDeck();
      
      // Deal: Player, Dealer, Player, Dealer
      let currentDeck = [...deck];
      const { card: playerCard1, remainingDeck: d1 } = dealCard(currentDeck);
      const { card: dealerCard1, remainingDeck: d2 } = dealCard(d1);
      const { card: playerCard2, remainingDeck: d3 } = dealCard(d2);
      const { card: dealerCard2, remainingDeck: d4 } = dealCard(d3);
      
      // Dealer's second card is face down
      const dealerHand = [
        dealerCard1,
        { ...dealerCard2, faceUp: false }
      ];
      
      const playerHand = [playerCard1, playerCard2];
      const playerBJ = isBlackjack(playerHand);
      
      // If player has blackjack, immediately resolve
      let finalPhase: GamePhase = 'PLAYER_TURN';
      let finalDealerHand = dealerHand;
      let finalDeck = d4;
      let finalResult: GameResult = null;
      
      if (playerBJ) {
        // Dealer reveals and checks for blackjack
        const revealedDealerHand = [
          dealerHand[0],
          { ...dealerHand[1], faceUp: true }
        ];
        
        const dealerBJ = isBlackjack(revealedDealerHand);
        finalDealerHand = revealedDealerHand;
        
        if (dealerBJ) {
          // Push - both have blackjack
          finalPhase = 'PAYOUT';
          finalResult = 'PUSH';
          applyBlackjackReward('PUSH', initialState.betTier, true);
        } else {
          // Player wins with blackjack!
          finalPhase = 'PAYOUT';
          finalResult = 'WIN';
          applyBlackjackReward('WIN', initialState.betTier, true);
        }
      }
      
      if (finalResult !== null) {
        update(state => ({
          ...state,
          phase: finalPhase,
          dealerHand: finalDealerHand,
          deck: finalDeck,
          result: finalResult
        }));
        return;
      }
      
      update(state => ({
        ...state,
        phase: finalPhase,
        playerHand,
        dealerHand: finalDealerHand,
        deck: finalDeck,
        isBlackjack: playerBJ
      }));
    },
    
    // Player hits (draw one card)
    hit() {
      update(state => {
        if (state.phase !== 'PLAYER_TURN') return state;
        
        const { card, remainingDeck } = dealCard(state.deck);
        const newHand = [...state.playerHand, card];
        const total = calculateTotal(newHand);
        
        // Check for bust
        if (total > 21) {
          // Player busts - lose immediately
          applyBlackjackReward('LOSE', state.betTier, false);
          return {
            ...state,
            phase: 'PAYOUT',
            playerHand: newHand,
            deck: remainingDeck,
            result: 'LOSE'
          };
        }
        
        return {
          ...state,
          playerHand: newHand,
          deck: remainingDeck
        };
      });
    },
    
    // Player stands - dealer plays
    stand() {
      update(state => {
        if (state.phase !== 'PLAYER_TURN') return state;
        
        // Reveal dealer's hidden card
        const revealedDealerHand = state.dealerHand.map(card => ({
          ...card,
          faceUp: true
        }));
        
        // Dealer plays
        const { hand: finalDealerHand, remainingDeck } = dealerPlay(revealedDealerHand, state.deck);
        
        const playerTotal = calculateTotal(state.playerHand);
        const dealerTotal = calculateTotal(finalDealerHand);
        
        let result: GameResult;
        
        if (dealerTotal > 21) {
          // Dealer busts - player wins
          result = 'WIN';
          applyBlackjackReward('WIN', state.betTier, false);
        } else if (playerTotal > dealerTotal) {
          // Player wins
          result = 'WIN';
          applyBlackjackReward('WIN', state.betTier, false);
        } else if (dealerTotal > playerTotal) {
          // Dealer wins
          result = 'LOSE';
          applyBlackjackReward('LOSE', state.betTier, false);
        } else {
          // Push
          result = 'PUSH';
          applyBlackjackReward('PUSH', state.betTier, false);
        }
        
        saveGame();
        
        return {
          ...state,
          phase: 'PAYOUT',
          dealerHand: finalDealerHand,
          deck: remainingDeck,
          result
        };
      });
    },
    
    // Reset for next hand
    resetHand() {
      update(state => ({
        ...state,
        phase: 'IDLE',
        playerHand: [],
        dealerHand: [],
        deck: [],
        result: null,
        isBlackjack: false
      }));
    }
  };
}

export const blackjackState = createBlackjackStore();

// ============================================
// EXPORTS
// ============================================

export const blackjackUnlocked = writable(false);
