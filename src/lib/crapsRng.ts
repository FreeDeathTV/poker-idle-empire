/**
 * V1200 - Deterministic RNG for Craps Rush
 * Uses a seeded linear congruential generator for reproducible results.
 */

/**
 * Creates a seeded random number generator.
 * Uses a simple LCG algorithm with parameters from Numerical Recipes.
 * @param seed - Initial seed value
 * @returns Function that returns deterministic random values in [0, 1)
 */
export function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Rolls two dice using a seeded RNG.
 * @param seed - Seed for the RNG
 * @returns Object with dieA, dieB, and total values
 */
export function rollDice(seed: number): { dieA: number; dieB: number; total: number } {
  const rng = createSeededRng(seed);
  const dieA = 1 + Math.floor(rng() * 6);
  const dieB = 1 + Math.floor(rng() * 6);
  return {
    dieA,
    dieB,
    total: dieA + dieB
  };
}

/**
 * Determines the outcome group based on dice total.
 * @param total - Sum of two dice
 * @returns 'WIN' (7,11), 'BONUS' (4,5,6,8,9,10), 'LOSE' (2,3,12), or 'SAFE' (not 2,3,12)
 */
export function getOutcomeGroup(total: number): 'WIN' | 'BONUS' | 'LOSE' | 'SAFE' {
  if (total === 7 || total === 11) {
    return 'WIN';
  }
  if (total === 2 || total === 3 || total === 12) {
    return 'LOSE';
  }
  if (total >= 4 && total <= 10) {
    // Check if it's in the bonus range (4,5,6,8,9,10)
    if ([4, 5, 6, 8, 9, 10].includes(total)) {
      return 'BONUS';
    }
  }
  // Should not reach here with valid dice totals, but treat as SAFE
  return 'SAFE';
}

/**
 * Generates a seed from timestamp and round counter for deterministic rolls.
 * @param timestamp - Current timestamp
 * @param roundCounter - Internal round counter
 * @returns Combined seed value
 */
export function generateSeed(timestamp: number, roundCounter: number): number {
  // Combine timestamp with round counter for unique but deterministic seeds
  return timestamp + roundCounter * 1000000;
}
