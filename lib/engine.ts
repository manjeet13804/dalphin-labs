import { sha256, Xorshift32 } from './crypto';

const ROWS = 12;

export interface Peg {
  leftBias: number;
}

export interface PegMap {
  [row: number]: Peg[];
}

export interface GamePath {
  decisions: boolean[]; // true = left, false = right
  binIndex: number;
}

/**
 * Generate deterministic peg map from PRNG
 * Each peg has a leftBias in [0.4, 0.6]
 * Formula: leftBias = 0.5 + (rand() - 0.5) * 0.2
 */
export function generatePegMap(prng: Xorshift32): PegMap {
  const pegMap: PegMap = {};

  for (let row = 0; row < ROWS; row++) {
    pegMap[row] = [];
    for (let col = 0; col <= row; col++) {
      const rand = prng.next();
      const leftBias = 0.5 + (rand - 0.5) * 0.2;
      // Round to 6 decimals for stable hashing
      const rounded = Math.round(leftBias * 1000000) / 1000000;
      pegMap[row].push({ leftBias: rounded });
    }
  }

  return pegMap;
}

/**
 * Compute stable hash of peg map
 */
export function pegMapHash(pegMap: PegMap): string {
  const json = JSON.stringify(pegMap);
  return sha256(json);
}

/**
 * Simulate ball drop through pegs
 * Returns path decisions and final bin index
 */
export function simulateDrop(
  pegMap: PegMap,
  dropColumn: number,
  prng: Xorshift32
): GamePath {
  let pos = 0; // number of right moves
  const decisions: boolean[] = [];

  // Drop column influence: adj = (dropColumn - floor(R/2)) * 0.01
  const adj = (dropColumn - Math.floor(ROWS / 2)) * 0.01;

  for (let row = 0; row < ROWS; row++) {
    // Get peg under current path
    const pegIndex = Math.min(pos, row);
    const peg = pegMap[row][pegIndex];
    const bias = peg.leftBias;

    // Apply drop column adjustment and clamp
    const adjustedBias = Math.max(0, Math.min(1, bias + adj));

    // Draw random number
    const rnd = prng.next();

    // Decide: left or right
    const goLeft = rnd < adjustedBias;
    decisions.push(goLeft);

    if (!goLeft) {
      pos += 1;
    }
  }

  return {
    decisions,
    binIndex: pos,
  };
}

/**
 * Full game engine: generate peg map, simulate drop, compute hash
 */
export function runGame(
  combinedSeed: string,
  dropColumn: number
): {
  pegMap: PegMap;
  pegMapHash: string;
  path: GamePath;
} {
  const prng = new Xorshift32(combinedSeed);

  // Generate peg map (consumes PRNG values)
  const pegMap = generatePegMap(prng);
  const hash = pegMapHash(pegMap);

  // Simulate drop (continues PRNG stream)
  const path = simulateDrop(pegMap, dropColumn, prng);

  return {
    pegMap,
    pegMapHash: hash,
    path,
  };
}

/**
 * Payout table: symmetric, edges higher
 * Bins 0-12, center (6) lowest, edges highest
 */
export function getPayoutMultiplier(binIndex: number): number {
  const payouts = [2.0, 1.5, 1.2, 1.0, 0.8, 0.5, 0.3, 0.5, 0.8, 1.0, 1.2, 1.5, 2.0];
  return payouts[binIndex] || 0.3;
}
