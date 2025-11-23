'use client';

import { useState, useEffect } from 'react';
import styles from './verify.module.css';

interface VerifyResult {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
}

interface StoredRound {
  id: string;
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  serverSeed: string;
  clientSeed: string;
  nonce: string;
  dropColumn: number;
}

export default function VerifyPage() {
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [dropColumn, setDropColumn] = useState('6');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [storedRound, setStoredRound] = useState<StoredRound | null>(null);
  const [isMatching, setIsMatching] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load from URL params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rid = params.get('roundId');
    if (rid) {
      loadRound(rid);
    }
  }, []);

  const loadRound = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rounds/${id}`);
      if (!res.ok) throw new Error('Round not found');
      const data = await res.json();
      setStoredRound(data);
      setServerSeed(data.serverSeed || '');
      setClientSeed(data.clientSeed || '');
      setNonce(data.nonce || '');
      setDropColumn(data.dropColumn?.toString() || '6');
    } catch (err) {
      setError(`Failed to load round: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed || !nonce || !dropColumn) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setIsMatching(null);

      const params = new URLSearchParams({
        serverSeed,
        clientSeed,
        nonce,
        dropColumn,
      });

      const res = await fetch(`/api/verify?${params}`);
      if (!res.ok) throw new Error('Verification failed');

      const result = await res.json();
      setVerifyResult(result);

      // Check if matches stored round
      if (storedRound) {
        const matches =
          result.commitHex === storedRound.commitHex &&
          result.combinedSeed === storedRound.combinedSeed &&
          result.pegMapHash === storedRound.pegMapHash &&
          result.binIndex === storedRound.binIndex;
        setIsMatching(matches);
      }
    } catch (err) {
      setError(`Verification error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTestVector = () => {
    setServerSeed('b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc');
    setClientSeed('candidate-hello');
    setNonce('42');
    setDropColumn('6');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🔍 Verifier</h1>
        <p>Verify Plinko game fairness</p>
      </header>

      <main className={styles.main}>
        <div className={styles.verifyBox}>
          <h2>Verify Round</h2>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Server Seed:</label>
            <input
              type="text"
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              placeholder="64-char hex string"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Client Seed:</label>
            <input
              type="text"
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              placeholder="Any string"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Nonce:</label>
            <input
              type="text"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              placeholder="Hex string"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Drop Column (0-12):</label>
            <input
              type="number"
              min="0"
              max="12"
              value={dropColumn}
              onChange={(e) => setDropColumn(e.target.value)}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={styles.verifyBtn}
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              className={styles.testBtn}
              onClick={handleLoadTestVector}
              disabled={loading}
            >
              Load Test Vector
            </button>
          </div>

          {verifyResult && (
            <div className={styles.result}>
              <h3>Computed Result</h3>
              <div className={styles.resultItem}>
                <strong>Commit Hash:</strong>
                <code>{verifyResult.commitHex}</code>
              </div>
              <div className={styles.resultItem}>
                <strong>Combined Seed:</strong>
                <code>{verifyResult.combinedSeed}</code>
              </div>
              <div className={styles.resultItem}>
                <strong>Peg Map Hash:</strong>
                <code>{verifyResult.pegMapHash}</code>
              </div>
              <div className={styles.resultItem}>
                <strong>Bin Index:</strong>
                <code>{verifyResult.binIndex}</code>
              </div>

              {isMatching !== null && (
                <div className={isMatching ? styles.matchSuccess : styles.matchFail}>
                  {isMatching ? '✅ Matches stored round!' : '❌ Does not match stored round'}
                </div>
              )}
            </div>
          )}

          {storedRound && (
            <div className={styles.storedRound}>
              <h3>Stored Round</h3>
              <div className={styles.resultItem}>
                <strong>Round ID:</strong>
                <code>{storedRound.id}</code>
              </div>
              <div className={styles.resultItem}>
                <strong>Commit Hash:</strong>
                <code>{storedRound.commitHex}</code>
              </div>
              <div className={styles.resultItem}>
                <strong>Bin Index:</strong>
                <code>{storedRound.binIndex}</code>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <a href="/">← Back to Game</a>
      </footer>
    </div>
  );
}
