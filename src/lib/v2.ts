export type BuildingId = 'ProDealers' | 'CardShufflers' | 'TDs' | 'Sponsors' | 'BuildingExpansion';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  baseCost: number;
  costMultiplier: number;
  baseBoost: number;
  softCapLevel: number;
  hardCapLevel: number;
  prereqBuildingId: BuildingId | null;
  prereqLevelRequired: number;
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'ProDealers',
    name: 'Pro Dealers',
    baseCost: 1e6,
    costMultiplier: 1.11,
    baseBoost: 0.04,
    softCapLevel: 300,
    hardCapLevel: 1000,
    prereqBuildingId: null,
    prereqLevelRequired: 0
  },
  {
    id: 'CardShufflers',
    name: 'Card Shufflers',
    baseCost: 4e6,
    costMultiplier: 1.12,
    baseBoost: 0.06,
    softCapLevel: 300,
    hardCapLevel: 1000,
    prereqBuildingId: 'ProDealers',
    prereqLevelRequired: 10
  },
  {
    id: 'TDs',
    name: 'TDs',
    baseCost: 1.5e7,
    costMultiplier: 1.13,
    baseBoost: 0.08,
    softCapLevel: 300,
    hardCapLevel: 1000,
    prereqBuildingId: 'CardShufflers',
    prereqLevelRequired: 10
  },
  {
    id: 'Sponsors',
    name: 'Sponsors',
    baseCost: 7e7,
    costMultiplier: 1.14,
    baseBoost: 0.12,
    softCapLevel: 300,
    hardCapLevel: 1000,
    prereqBuildingId: 'TDs',
    prereqLevelRequired: 10
  },
  {
    id: 'BuildingExpansion',
    name: 'Building Expansion',
    baseCost: 3e8,
    costMultiplier: 1.15,
    baseBoost: 0.16,
    softCapLevel: 300,
    hardCapLevel: 1000,
    prereqBuildingId: 'Sponsors',
    prereqLevelRequired: 10
  }
];

export function getDef(id: BuildingId): BuildingDef | undefined {
  return BUILDINGS.find(b => b.id === id);
}

export function isUnlocked(id: BuildingId, state: Record<BuildingId, number>, pokerTables: number): boolean {
  const def = getDef(id);
  if (!def) return false;
  if (id === 'ProDealers') return pokerTables >= 10;
  if (!def.prereqBuildingId) return false;
  const level = state[def.prereqBuildingId] || 0;
  return level >= def.prereqLevelRequired;
}

export function levelCost(id: BuildingId, level: number): number {
  const def = getDef(id);
  if (!def) return Infinity;
  if (def.baseCost <= 0 || def.costMultiplier <= 1) return Infinity;
  return Math.ceil(def.baseCost * Math.pow(def.costMultiplier, level));
}

export function calculateBoost(level: number, baseBoost: number, softCapLevel: number): number {
  if (level <= 0) return 0;
  if (level <= 100) return level * baseBoost;
  if (level <= 300) return (100 * baseBoost) + ((level - 100) * (baseBoost / 1.5));
  return (100 * baseBoost) + (200 * (baseBoost / 1.5)) + ((level - 300) * (baseBoost / 2));
}

export function totalBoost(levels: Record<BuildingId, number>): number {
  let total = 0;
  for (const def of BUILDINGS) {
    total += calculateBoost(levels[def.id] || 0, def.baseBoost, def.softCapLevel);
  }
  return total;
}

export function prestigeMultiplier(points: number): number {
  if (points <= 0) return 1;
  if (points <= 3) return 1 + points * 0.35;
  if (points <= 10) return 1 + (1.05 + (points - 3) * 0.25);
  return 1 + (1.05 + 7 * 0.25 + (points - 10) * 0.2);
}

export function signingBonus(points: number): number {
  const bonus = 0.10 + 0.05 * Math.log10(points + 1);
  return Math.min(0.50, Math.max(0, bonus));
}
