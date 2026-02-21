import { Hand } from 'pokersolver';

// Canonical odds table provided by design:
// Key = two-card notation (rank-ordered, with 's' or 'o')
// Value = [winProbability (0..1), oddsMultiplier]
const HAND_ODDS: Record<string, [number, number]> = {
  "AA": [0.85, 1.176],
  "KK": [0.82, 1.219],
  "QQ": [0.80, 1.25],
  "JJ": [0.77, 1.299],
  "TT": [0.75, 1.333],
  "99": [0.72, 1.389],
  "88": [0.69, 1.449],
  "77": [0.66, 1.515],
  "66": [0.63, 1.587],
  "55": [0.60, 1.667],
  "44": [0.57, 1.754],
  "33": [0.55, 1.818],
  "22": [0.53, 1.887],

  "AKs": [0.67, 1.493],
  "AQs": [0.65, 1.538],
  "AJs": [0.64, 1.563],
  "ATs": [0.62, 1.613],
  "KQs": [0.60, 1.667],
  "KJs": [0.58, 1.724],
  "QJs": [0.57, 1.754],
  "JTs": [0.54, 1.852],
  "T9s": [0.53, 1.887],
  "98s": [0.52, 1.923],
  "87s": [0.51, 1.961],
  "76s": [0.50, 2.0],

  "AKo": [0.65, 1.538],
  "AQo": [0.63, 1.587],
  "AJo": [0.61, 1.639],
  "ATo": [0.59, 1.695],
  "KQo": [0.57, 1.754],
  "KJo": [0.55, 1.818],
  "QJo": [0.54, 1.852],
  "JTo": [0.50, 2.0],
  "T9o": [0.48, 2.083],
  "98o": [0.47, 2.128],
  "87o": [0.46, 2.174],
  "76o": [0.45, 2.222],

  "A9s": [0.60, 1.667],
  "A8s": [0.59, 1.695],
  "A7s": [0.58, 1.724],
  "A6s": [0.57, 1.754],
  "A5s": [0.57, 1.754],
  "A4s": [0.56, 1.786],
  "A3s": [0.56, 1.786],
  "A2s": [0.55, 1.818],

  "A9o": [0.57, 1.754],
  "A8o": [0.56, 1.786],
  "A7o": [0.55, 1.818],
  "A6o": [0.54, 1.852],
  "A5o": [0.54, 1.852],
  "A4o": [0.53, 1.887],
  "A3o": [0.53, 1.887],
  "A2o": [0.52, 1.923],

  "KTs": [0.56, 1.786],
  "K9s": [0.54, 1.852],
  "K8s": [0.52, 1.923],
  "K7s": [0.51, 1.961],
  "K6s": [0.50, 2.0],
  "K5s": [0.49, 2.041],
  "K4s": [0.48, 2.083],
  "K3s": [0.48, 2.083],
  "K2s": [0.47, 2.128],

  "KTo": [0.53, 1.887],
  "K9o": [0.51, 1.961],
  "K8o": [0.49, 2.041],
  "K7o": [0.48, 2.083],
  "K6o": [0.47, 2.128],
  "K5o": [0.46, 2.174],
  "K4o": [0.45, 2.222],
  "K3o": [0.45, 2.222],
  "K2o": [0.44, 2.273],

  "QTs": [0.55, 1.818],
  "Q9s": [0.53, 1.887],
  "Q8s": [0.51, 1.961],
  "Q7s": [0.49, 2.041],
  "Q6s": [0.48, 2.083],
  "Q5s": [0.47, 2.128],
  "Q4s": [0.46, 2.174],
  "Q3s": [0.46, 2.174],
  "Q2s": [0.45, 2.222],

  "QTo": [0.52, 1.923],
  "Q9o": [0.50, 2.0],
  "Q8o": [0.48, 2.083],
  "Q7o": [0.46, 2.174],
  "Q6o": [0.45, 2.222],
  "Q5o": [0.44, 2.273],
  "Q4o": [0.43, 2.326],
  "Q3o": [0.43, 2.326],
  "Q2o": [0.42, 2.381],

  "J9s": [0.52, 1.923],
  "J8s": [0.50, 2.0],
  "J7s": [0.48, 2.083],
  "J6s": [0.47, 2.128],
  "J5s": [0.46, 2.174],
  "J4s": [0.45, 2.222],
  "J3s": [0.44, 2.273],
  "J2s": [0.44, 2.273],

  "J9o": [0.49, 2.041],
  "J8o": [0.47, 2.128],
  "J7o": [0.45, 2.222],
  "J6o": [0.44, 2.273],
  "J5o": [0.43, 2.326],
  "J4o": [0.42, 2.381],
  "J3o": [0.42, 2.381],
  "J2o": [0.41, 2.439],

  "T8s": [0.49, 2.041],
  "T7s": [0.47, 2.128],
  "T6s": [0.46, 2.174],
  "T5s": [0.45, 2.222],
  "T4s": [0.44, 2.273],
  "T3s": [0.43, 2.326],
  "T2s": [0.42, 2.381],

  "T8o": [0.46, 2.174],
  "T7o": [0.44, 2.273],
  "T6o": [0.43, 2.326],
  "T5o": [0.42, 2.381],
  "T4o": [0.41, 2.439],
  "T3o": [0.40, 2.5],
  "T2o": [0.39, 2.564],

  "97s": [0.48, 2.083],
  "96s": [0.46, 2.174],
  "95s": [0.45, 2.222],
  "94s": [0.44, 2.273],
  "93s": [0.43, 2.326],
  "92s": [0.42, 2.381],

  "97o": [0.45, 2.222],
  "96o": [0.43, 2.326],
  "95o": [0.42, 2.381],
  "94o": [0.41, 2.439],
  "93o": [0.40, 2.5],
  "92o": [0.39, 2.564],

  "86s": [0.47, 2.128],
  "85s": [0.45, 2.222],
  "84s": [0.44, 2.273],
  "83s": [0.43, 2.326],
  "82s": [0.42, 2.381],

  "86o": [0.44, 2.273],
  "85o": [0.42, 2.381],
  "84o": [0.41, 2.439],
  "83o": [0.40, 2.5],
  "82o": [0.39, 2.564],

  "75s": [0.46, 2.174],
  "74s": [0.44, 2.273],
  "73s": [0.43, 2.326],
  "72s": [0.39, 2.564],

  "75o": [0.43, 2.326],
  "74o": [0.41, 2.439],
  "73o": [0.40, 2.5],
  "72o": [0.39, 2.564],

  "64s": [0.45, 2.222],
  "63s": [0.43, 2.326],
  "62s": [0.38, 2.632],

  "64o": [0.42, 2.381],
  "63o": [0.40, 2.5],
  "62o": [0.38, 2.632],

  "53s": [0.44, 2.273],
  "52s": [0.37, 2.703],

  "53o": [0.41, 2.439],
  "52o": [0.37, 2.703],

  "43s": [0.43, 2.326],
  "42s": [0.36, 2.778],

  "43o": [0.40, 2.5],
  "42o": [0.36, 2.778],

  "32s": [0.40, 2.5],
  "32o": [0.35, 2.857]
};

export function getStartingMultiplier(hand: string): number {
  const odds = HAND_ODDS[hand];
  if (odds) return odds[1];
  // Fallback: neutral multiplier
  return 1;
}

export function getWinProbability(hand: string): number {
  const odds = HAND_ODDS[hand];
  if (odds) return odds[0];
  return 0.5;
}

export function getHandNotation(cards: string[]): string {
  if (cards.length !== 2) return '';
  const ranks = cards.map(c => c[0]).sort((a, b) => {
    const order = 'AKQJT98765432';
    // Sort so higher rank comes first (A before K before Q ...)
    return order.indexOf(a) - order.indexOf(b);
  });
  const suits = cards.map(c => c[1]);
  // Pairs have no suitedness suffix in the odds table
  if (ranks[0] === ranks[1]) {
    return ranks.join('');
  }
  const suited = suits[0] === suits[1];
  const rankStr = ranks.join('');
  return suited ? rankStr + 's' : rankStr + 'o';
}

// Create a standard 52-card deck
export function createDeck(): string[] {
  const suits = ['s', 'h', 'd', 'c']; // spades, hearts, diamonds, clubs
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const deck: string[] = [];
  for (const r of ranks) {
    for (const s of suits) {
      deck.push(r + s);
    }
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal n cards from deck (modifies deck in place)
export function dealNCards(deck: string[], n: number): string[] {
  return deck.splice(0, n);
}

// Card display type
export interface CardDisplay {
  rank: string;
  suit: string;
  isRed: boolean;
  full: string;
}

// Get card display name
export function getCardDisplay(card: string): CardDisplay {
  const rankMap: Record<string, string> = {
    'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': '10',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5',
    '4': '4', '3': '3', '2': '2'
  };
  const suitMap: Record<string, string> = {
    's': '♠', 'h': '♥', 'd': '♦', 'c': '♣'
  };
  const rank = rankMap[card[0]] || card[0];
  const suit = suitMap[card[1]] || card[1];
  const isRed = card[1] === 'h' || card[1] === 'd';
  return { rank, suit, isRed, full: rank + suit };
}

// Full bonus round: player picks 2 cards, opponent gets 2, board is 5 cards
// Returns result object with all details
export interface BonusResult {
  playerHole: string[];
  opponentHole: string[];
  board: string[];
  playerHand: string;
  opponentHand: string;
  playerWins: boolean;
  multiplier: number;
  bet: number;
  payout: number;
}

export function playBonusRound(playerCards: string[], bet: number): BonusResult {
  // Create and shuffle deck
  let deck = createDeck();
  deck = shuffleDeck(deck);
  
  // Remove player's chosen cards from deck
  const playerHole = [...playerCards];
  playerCards.forEach(card => {
    const idx = deck.indexOf(card);
    if (idx > -1) deck.splice(idx, 1);
  });
  
  // Deal opponent's hole cards
  const opponentHole = dealNCards(deck, 2);
  
  // Deal 5-card board
  const board = dealNCards(deck, 5);
  
  // Combine hands for evaluation
  const player7 = [...playerHole, ...board];
  const opponent7 = [...opponentHole, ...board];
  
  // Evaluate hands using pokersolver
  const playerHand = Hand.solve(player7);
  const opponentHand = Hand.solve(opponent7);
  
  // Determine winner (ties go to player per spec)
  const winners = Hand.winners([playerHand, opponentHand]);
  const playerWins = winners.includes(playerHand);
  
  // Calculate multiplier based on player's hole cards
  const handNotation = getHandNotation(playerHole);
  const multiplier = getStartingMultiplier(handNotation);
  
  // Calculate payout: bet * multiplier if player wins
  const payout = playerWins ? Math.floor(bet * multiplier) : 0;
  
  return {
    playerHole,
    opponentHole,
    board,
    playerHand: playerHand?.name || 'Unknown',
    opponentHand: opponentHand?.name || 'Unknown',
    playerWins,
    multiplier,
    bet,
    payout
  };
}
