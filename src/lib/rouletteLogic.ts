export type RouletteColor = 'red' | 'black' | 'green';

export type RouletteBetType =
  | 'straight'
  | 'split'
  | 'street'
  | 'corner'
  | 'line'
  | 'dozen'
  | 'column'
  | 'redblack'
  | 'oddeven'
  | 'highlow';

export interface RouletteBet {
  type: RouletteBetType;
  numbers: number[];
  amount: number;
  chipValues?: number[];
}

export interface RouletteResolveResult {
  totalBet: number;
  totalPayout: number;
  winningNet: number;
  winningKeys: Set<string>;
  losingKeys: Set<string>;
}

export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20,
  14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
] as const;

const MATRIX_ROW_COUNT = 12;
const MATRIX_COL_COUNT = 3;

export const ROULETTE_MATRIX: readonly (readonly [number, number, number])[] = Array.from(
  { length: MATRIX_ROW_COUNT },
  (_, rowIndex) => {
    const start = rowIndex * MATRIX_COL_COUNT + 1;
    return [start, start + 1, start + 2] as const;
  }
);

export const ROULETTE_ROWS: number[][] = ROULETTE_MATRIX.map((row) => [...row]);

export const ROULETTE_RED_NUMBERS = new Set<number>([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

export const ROULETTE_BLACK_NUMBERS = new Set<number>([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
]);

export const ROULETTE_OUTSIDE = {
  dozen1: buildRange(1, 12),
  dozen2: buildRange(13, 24),
  dozen3: buildRange(25, 36),
  column1: buildColumn(0),
  column2: buildColumn(1),
  column3: buildColumn(2),
  red: Array.from(ROULETTE_RED_NUMBERS).sort((a, b) => a - b),
  black: Array.from(ROULETTE_BLACK_NUMBERS).sort((a, b) => a - b),
  odd: buildRange(1, 36).filter((n) => n % 2 === 1),
  even: buildRange(1, 36).filter((n) => n % 2 === 0),
  low: buildRange(1, 18),
  high: buildRange(19, 36)
} as const;

export function checkTDUnlocked(levels: Record<string, number>): boolean {
  return (levels.CardShufflers || 0) >= 10;
}

export function getRouletteCell(rowIndex: number, colIndex: number): number | null {
  if (!Number.isInteger(rowIndex) || !Number.isInteger(colIndex)) return null;
  if (rowIndex < 0 || rowIndex >= MATRIX_ROW_COUNT) return null;
  if (colIndex < 0 || colIndex >= MATRIX_COL_COUNT) return null;
  return ROULETTE_MATRIX[rowIndex][colIndex];
}

export function getStraightNumbers(rowIndex: number, colIndex: number): number[] | null {
  const value = getRouletteCell(rowIndex, colIndex);
  if (value === null) return null;
  return [value];
}

export function getSplitHorizontalNumbers(rowIndex: number, colIndex: number): number[] | null {
  const left = getRouletteCell(rowIndex, colIndex);
  const right = getRouletteCell(rowIndex, colIndex + 1);
  if (left === null || right === null) return null;
  return [left, right];
}

export function getSplitVerticalNumbers(rowIndex: number, colIndex: number): number[] | null {
  const top = getRouletteCell(rowIndex, colIndex);
  const bottom = getRouletteCell(rowIndex + 1, colIndex);
  if (top === null || bottom === null) return null;
  return [top, bottom];
}

export function getCornerNumbers(rowIndex: number, colIndex: number): number[] | null {
  const topLeft = getRouletteCell(rowIndex, colIndex);
  const topRight = getRouletteCell(rowIndex, colIndex + 1);
  const bottomLeft = getRouletteCell(rowIndex + 1, colIndex);
  const bottomRight = getRouletteCell(rowIndex + 1, colIndex + 1);
  if (topLeft === null || topRight === null || bottomLeft === null || bottomRight === null) return null;
  return [topLeft, topRight, bottomLeft, bottomRight];
}

export function getStreetNumbers(rowIndex: number): number[] | null {
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= MATRIX_ROW_COUNT) return null;
  return [...ROULETTE_MATRIX[rowIndex]];
}

export function getLineNumbers(rowIndex: number): number[] | null {
  const top = getStreetNumbers(rowIndex);
  const bottom = getStreetNumbers(rowIndex + 1);
  if (!top || !bottom) return null;
  return [...top, ...bottom];
}

export function getRouletteColor(number: number): RouletteColor {
  if (number === 0) return 'green';
  if (ROULETTE_RED_NUMBERS.has(number)) return 'red';
  return 'black';
}

export function getRouletteMultiplier(type: RouletteBetType): number {
  switch (type) {
    case 'straight':
      return 35;
    case 'split':
      return 17;
    case 'street':
      return 11;
    case 'corner':
      return 8;
    case 'line':
      return 5;
    case 'dozen':
      return 2;
    case 'column':
      return 2;
    case 'redblack':
      return 1;
    case 'oddeven':
      return 1;
    case 'highlow':
      return 1;
    default:
      return 0;
  }
}

export function getBetKey(type: RouletteBetType, numbers: number[]): string {
  const normalized = normalizeNumbers(numbers);
  return `${type}:${normalized.join('-')}`;
}

export function normalizeNumbers(numbers: number[]): number[] {
  const deduped = Array.from(new Set(numbers));
  deduped.sort((a, b) => a - b);
  return deduped;
}

export function mergeBet(bets: RouletteBet[], nextBet: RouletteBet): RouletteBet[] {
  const normalizedNumbers = normalizeNumbers(nextBet.numbers);
  if (normalizedNumbers.length === 0) return bets;

  const incomingChips = normalizeChipValues(nextBet.chipValues, nextBet.amount);
  if (incomingChips.length === 0) return bets;
  const incomingAmount = incomingChips.reduce((sum, value) => sum + value, 0);
  const key = getBetKey(nextBet.type, normalizedNumbers);
  const next = bets.map((bet) => ({
    ...bet,
    numbers: normalizeNumbers(bet.numbers),
    amount: Math.max(0, Math.floor(bet.amount)),
    chipValues: normalizeChipValues(bet.chipValues, bet.amount)
  }));
  const index = next.findIndex((bet) => getBetKey(bet.type, bet.numbers) === key);
  if (index === -1) {
    next.push({
      type: nextBet.type,
      numbers: normalizedNumbers,
      amount: incomingAmount,
      chipValues: incomingChips
    });
    return next;
  }
  next[index] = {
    ...next[index],
    amount: next[index].amount + incomingAmount,
    chipValues: [...normalizeChipValues(next[index].chipValues, next[index].amount), ...incomingChips]
  };
  return next;
}

export function removeLastBetChip(
  bets: RouletteBet[],
  type: RouletteBetType,
  numbers: number[]
): RouletteBet[] {
  const normalizedNumbers = normalizeNumbers(numbers);
  if (normalizedNumbers.length === 0) return bets;

  const key = getBetKey(type, normalizedNumbers);
  const next = bets.map((bet) => ({
    ...bet,
    numbers: normalizeNumbers(bet.numbers),
    amount: Math.max(0, Math.floor(bet.amount)),
    chipValues: normalizeChipValues(bet.chipValues, bet.amount)
  }));
  const index = next.findIndex((bet) => getBetKey(bet.type, bet.numbers) === key);
  if (index === -1) return bets;

  const current = next[index];
  const chipValues = [...normalizeChipValues(current.chipValues, current.amount)];
  const removed = chipValues.pop();
  if (removed === undefined) return bets;

  const nextAmount = Math.max(0, current.amount - removed);
  if (nextAmount === 0 || chipValues.length === 0) {
    next.splice(index, 1);
    return next;
  }

  next[index] = {
    ...current,
    amount: nextAmount,
    chipValues
  };
  return next;
}

export function getBetChipValues(
  bets: RouletteBet[],
  type: RouletteBetType,
  numbers: number[]
): number[] {
  const normalizedNumbers = normalizeNumbers(numbers);
  const key = getBetKey(type, normalizedNumbers);
  const found = bets.find((bet) => getBetKey(bet.type, normalizeNumbers(bet.numbers)) === key);
  if (!found) return [];
  return normalizeChipValues(found.chipValues, found.amount);
}

export function getTotalBet(bets: RouletteBet[]): number {
  return bets.reduce((sum, bet) => sum + Math.max(0, Math.floor(bet.amount)), 0);
}

export function resolveRouletteBets(bets: RouletteBet[], winningNumber: number): RouletteResolveResult {
  const normalizedBets = bets.map((bet) => ({
    ...bet,
    numbers: normalizeNumbers(bet.numbers),
    amount: Math.max(0, Math.floor(bet.amount))
  }));
  const totalBet = getTotalBet(normalizedBets);
  let totalPayout = 0;
  const winningKeys = new Set<string>();
  const losingKeys = new Set<string>();

  for (const bet of normalizedBets) {
    const key = getBetKey(bet.type, bet.numbers);
    if (bet.numbers.includes(winningNumber)) {
      const payout = bet.amount * getRouletteMultiplier(bet.type);
      totalPayout += payout;
      winningKeys.add(key);
    } else {
      losingKeys.add(key);
    }
  }

  return {
    totalBet,
    totalPayout,
    winningNet: totalPayout - totalBet,
    winningKeys,
    losingKeys
  };
}

function buildRange(start: number, end: number): number[] {
  const out: number[] = [];
  for (let n = start; n <= end; n += 1) out.push(n);
  return out;
}

function buildColumn(colIndex: number): number[] {
  const out: number[] = [];
  for (let rowIndex = 0; rowIndex < MATRIX_ROW_COUNT; rowIndex += 1) {
    out.push(ROULETTE_MATRIX[rowIndex][colIndex]);
  }
  return out;
}

function normalizeChipValues(chipValues: number[] | undefined, fallbackAmount: number): number[] {
  const next = (chipValues ?? [])
    .map((value) => Math.max(0, Math.floor(value)))
    .filter((value) => value > 0);
  if (next.length > 0) return next;

  const fallback = Math.max(0, Math.floor(fallbackAmount));
  if (fallback <= 0) return [];
  return [fallback];
}
