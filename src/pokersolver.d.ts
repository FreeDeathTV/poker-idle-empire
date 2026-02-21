declare module 'pokersolver' {
  interface SolvedHand {
    name: string;
    value: number;
    cards: string[];
  }

  interface HandConstructor {
    solve(cards: string[]): SolvedHand;
    winners(hands: SolvedHand[]): SolvedHand[];
    ranks: string[];
    evaluate(cards: string[]): SolvedHand;
  }

  export const Hand: HandConstructor;
}
