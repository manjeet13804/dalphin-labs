import { createHash } from 'crypto';

/**
 * SHA256 hash function
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Xorshift32 PRNG implementation
 * Seeded from first 4 bytes of a hex string (big-endian)
 */
export class Xorshift32 {
  private state: number;

  constructor(seed: string) {
    // Take first 4 bytes (8 hex chars) of seed and convert to uint32
    const seedHex = seed.substring(0, 8);
    this.state = parseInt(seedHex, 16);
    // Ensure non-zero state
    if (this.state === 0) {
      this.state = 1;
    }
  }

  /**
   * Generate next random number and return as [0, 1)
   */
  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x;
    // Convert to [0, 1)
    return (x >>> 0) / 0x100000000;
  }
}

/**
 * Combine serverSeed, clientSeed, and nonce into a deterministic combined seed
 */
export function combineSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string
): string {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

/**
 * Create commit hash from serverSeed and nonce
 */
export function createCommit(serverSeed: string, nonce: string): string {
  return sha256(`${serverSeed}:${nonce}`);
}
