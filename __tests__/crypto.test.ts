import { sha256, Xorshift32, combineSeed, createCommit } from '@/lib/crypto';

describe('Crypto Functions', () => {
  describe('sha256', () => {
    it('should hash consistently', () => {
      const result1 = sha256('test');
      const result2 = sha256('test');
      expect(result1).toBe(result2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = sha256('test1');
      const hash2 = sha256('test2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Xorshift32 PRNG', () => {
    it('should generate consistent sequence from same seed', () => {
      const prng1 = new Xorshift32('00000001');
      const prng2 = new Xorshift32('00000001');

      for (let i = 0; i < 10; i++) {
        expect(prng1.next()).toBe(prng2.next());
      }
    });

    it('should generate different sequences from different seeds', () => {
      const prng1 = new Xorshift32('00000001');
      const prng2 = new Xorshift32('00000002');

      const vals1 = Array.from({ length: 5 }, () => prng1.next());
      const vals2 = Array.from({ length: 5 }, () => prng2.next());

      expect(vals1).not.toEqual(vals2);
    });

    it('should generate values in [0, 1)', () => {
      const prng = new Xorshift32('12345678');
      for (let i = 0; i < 100; i++) {
        const val = prng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('combineSeed', () => {
    it('should combine seeds consistently', () => {
      const result1 = combineSeed('seed1', 'seed2', 'seed3');
      const result2 = combineSeed('seed1', 'seed2', 'seed3');
      expect(result1).toBe(result2);
    });

    it('should produce different results for different inputs', () => {
      const result1 = combineSeed('seed1', 'seed2', 'seed3');
      const result2 = combineSeed('seed1', 'seed2', 'seed4');
      expect(result1).not.toBe(result2);
    });
  });

  describe('createCommit', () => {
    it('should create commit consistently', () => {
      const result1 = createCommit('serverSeed', 'nonce');
      const result2 = createCommit('serverSeed', 'nonce');
      expect(result1).toBe(result2);
    });
  });

  describe('Test Vector', () => {
    it('should match reference test vector', () => {
      const serverSeed = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
      const clientSeed = 'candidate-hello';
      const nonce = '42';

      const commitHex = createCommit(serverSeed, nonce);
      const combinedSeedResult = combineSeed(serverSeed, clientSeed, nonce);

      expect(commitHex).toBe('bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34');
      expect(combinedSeedResult).toBe('e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0');
    });

    it('should generate correct PRNG sequence from test vector', () => {
      const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const prng = new Xorshift32(combinedSeed);

      const expected = [0.1106166649, 0.7625129214, 0.0439292176, 0.4578678815, 0.3438999297];
      const actual = Array.from({ length: 5 }, () => prng.next());

      // Allow small floating point differences
      for (let i = 0; i < 5; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], 9);
      }
    });
  });
});
