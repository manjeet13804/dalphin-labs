import { Xorshift32 } from '@/lib/crypto';
import { generatePegMap, pegMapHash, simulateDrop, runGame, getPayoutMultiplier } from '@/lib/engine';

describe('Game Engine', () => {
  describe('generatePegMap', () => {
    it('should generate correct number of pegs per row', () => {
      const prng = new Xorshift32('12345678');
      const pegMap = generatePegMap(prng);

      for (let row = 0; row < 12; row++) {
        expect(pegMap[row].length).toBe(row + 1);
      }
    });

    it('should generate biases in valid range', () => {
      const prng = new Xorshift32('12345678');
      const pegMap = generatePegMap(prng);

      for (let row = 0; row < 12; row++) {
        for (const peg of pegMap[row]) {
          expect(peg.leftBias).toBeGreaterThanOrEqual(0.4);
          expect(peg.leftBias).toBeLessThanOrEqual(0.6);
        }
      }
    });

    it('should generate consistent peg map from same seed', () => {
      const prng1 = new Xorshift32('12345678');
      const prng2 = new Xorshift32('12345678');

      const map1 = generatePegMap(prng1);
      const map2 = generatePegMap(prng2);

      for (let row = 0; row < 12; row++) {
        for (let col = 0; col <= row; col++) {
          expect(map1[row][col].leftBias).toBe(map2[row][col].leftBias);
        }
      }
    });
  });

  describe('pegMapHash', () => {
    it('should produce consistent hash', () => {
      const prng = new Xorshift32('12345678');
      const map = generatePegMap(prng);

      const hash1 = pegMapHash(map);
      const hash2 = pegMapHash(map);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different maps', () => {
      const prng1 = new Xorshift32('12345678');
      const prng2 = new Xorshift32('87654321');

      const map1 = generatePegMap(prng1);
      const map2 = generatePegMap(prng2);

      const hash1 = pegMapHash(map1);
      const hash2 = pegMapHash(map2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('simulateDrop', () => {
    it('should return valid bin index', () => {
      const prng = new Xorshift32('12345678');
      const pegMap = generatePegMap(prng);

      const result = simulateDrop(pegMap, 6, prng);

      expect(result.binIndex).toBeGreaterThanOrEqual(0);
      expect(result.binIndex).toBeLessThanOrEqual(12);
    });

    it('should generate 12 decisions', () => {
      const prng = new Xorshift32('12345678');
      const pegMap = generatePegMap(prng);

      const result = simulateDrop(pegMap, 6, prng);

      expect(result.decisions.length).toBe(12);
      expect(result.decisions.every((d) => typeof d === 'boolean')).toBe(true);
    });

    it('should be deterministic', () => {
      const prng1 = new Xorshift32('12345678');
      const pegMap1 = generatePegMap(prng1);
      const result1 = simulateDrop(pegMap1, 6, prng1);

      const prng2 = new Xorshift32('12345678');
      const pegMap2 = generatePegMap(prng2);
      const result2 = simulateDrop(pegMap2, 6, prng2);

      expect(result1.binIndex).toBe(result2.binIndex);
      expect(result1.decisions).toEqual(result2.decisions);
    });
  });

  describe('runGame', () => {
    it('should return complete game result', () => {
      const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const result = runGame(combinedSeed, 6);

      expect(result.pegMap).toBeDefined();
      expect(result.pegMapHash).toBeDefined();
      expect(result.path).toBeDefined();
      expect(result.path.binIndex).toBeDefined();
      expect(result.path.decisions).toBeDefined();
    });

    it('should be deterministic across calls', () => {
      const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';

      const result1 = runGame(combinedSeed, 6);
      const result2 = runGame(combinedSeed, 6);

      expect(result1.pegMapHash).toBe(result2.pegMapHash);
      expect(result1.path.binIndex).toBe(result2.path.binIndex);
      expect(result1.path.decisions).toEqual(result2.path.decisions);
    });

    it('should match test vector for center drop', () => {
      const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const result = runGame(combinedSeed, 6);

      // Test vector expects binIndex = 6 for center drop
      expect(result.path.binIndex).toBe(6);
    });
  });

  describe('getPayoutMultiplier', () => {
    it('should return valid multipliers for all bins', () => {
      for (let bin = 0; bin <= 12; bin++) {
        const multiplier = getPayoutMultiplier(bin);
        expect(multiplier).toBeGreaterThan(0);
      }
    });

    it('should be symmetric', () => {
      for (let bin = 0; bin <= 6; bin++) {
        const leftMult = getPayoutMultiplier(bin);
        const rightMult = getPayoutMultiplier(12 - bin);
        expect(leftMult).toBe(rightMult);
      }
    });

    it('should have lower multiplier at center', () => {
      const centerMult = getPayoutMultiplier(6);
      const edgeMult = getPayoutMultiplier(0);
      expect(centerMult).toBeLessThan(edgeMult);
    });
  });

  describe('Test Vector Integration', () => {
    it('should match reference test vector', () => {
      const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const dropColumn = 6;

      const result = runGame(combinedSeed, dropColumn);

      // Expected from test vector
      expect(result.path.binIndex).toBe(6);

      // Verify peg map first rows match reference
      const prng = new Xorshift32(combinedSeed);
      const pegMap = generatePegMap(prng);

      // Row 0
      expect(pegMap[0][0].leftBias).toBeCloseTo(0.422123, 5);

      // Row 1
      expect(pegMap[1][0].leftBias).toBeCloseTo(0.552503, 5);
      expect(pegMap[1][1].leftBias).toBeCloseTo(0.408786, 5);

      // Row 2
      expect(pegMap[2][0].leftBias).toBeCloseTo(0.491574, 5);
      expect(pegMap[2][1].leftBias).toBeCloseTo(0.468780, 5);
      expect(pegMap[2][2].leftBias).toBeCloseTo(0.436540, 5);
    });
  });
});
