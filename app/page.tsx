'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Round {
  id: string;
  commitHex: string;
  nonce: string;
  pegMapHash: string;
  binIndex: number;
  payoutMultiplier: number;
  betCents: number;
}

export default function Home() {
  const [roundId, setRoundId] = useState<string | null>(null);
  const [commitHex, setCommitHex] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [dropColumn, setDropColumn] = useState<number>(6);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'result'>('idle');
  const [result, setResult] = useState<Round | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Step 1: Create commit
  const handleCreateRound = async () => {
    try {
      const res = await fetch('/api/rounds/commit', { method: 'POST' });
      const data = await res.json();
      setRoundId(data.roundId);
      setCommitHex(data.commitHex);
      setNonce(data.nonce);
      setGameState('idle');
    } catch (error) {
      console.error('Error creating round:', error);
      alert('Failed to create round');
    }
  };

  // Step 2: Start game
  const handleStartGame = async () => {
    if (!roundId) {
      alert('Create a round first');
      return;
    }

    try {
      setGameState('playing');
      const res = await fetch(`/api/rounds/${roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSeed,
          betCents: betAmount * 100,
          dropColumn,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }

      // Animate and then reveal
      await animateDrop();

      // Reveal
      const revealRes = await fetch(`/api/rounds/${roundId}/reveal`, {
        method: 'POST',
      });
      await revealRes.json();

      // Fetch full round details
      const roundRes = await fetch(`/api/rounds/${roundId}`);
      const roundData = await roundRes.json();
      setResult(roundData);
      setGameState('result');

      // Play sound
      if (!isMuted) {
        playSound('win');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game');
      setGameState('idle');
    }
  };

  const animateDrop = async () => {
    // Simple animation - in production, use canvas for smooth physics
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 2000);
    });
  };

  const playSound = (type: 'peg' | 'win') => {
    // Placeholder for sound - would use Web Audio API
    console.log(`Playing sound: ${type}`);
  };

  const handlePlayAgain = () => {
    setRoundId(null);
    setCommitHex('');
    setNonce('');
    setClientSeed('');
    setGameState('idle');
    setResult(null);
    handleCreateRound();
  };

  useEffect(() => {
    // Create initial round on mount
    handleCreateRound();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎰 Plinko Lab</h1>
        <p>Provably Fair Game</p>
        <button
          className={styles.muteBtn}
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </header>

      <main className={styles.main}>
        {gameState === 'idle' && (
          <div className={styles.controls}>
            <div className={styles.info}>
              <p><strong>Commit:</strong> {commitHex ? commitHex.substring(0, 16) : 'Loading...'}...</p>
              <p><strong>Nonce:</strong> {nonce ? nonce.substring(0, 16) : 'Loading...'}...</p>
            </div>

            <div className={styles.inputGroup}>
              <label>Client Seed:</label>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                placeholder="Enter any seed (e.g., 'my-seed')"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Bet Amount ($):</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1"
                max="1000"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Drop Column (0-12):</label>
              <input
                type="range"
                min="0"
                max="12"
                value={dropColumn}
                onChange={(e) => setDropColumn(Number(e.target.value))}
              />
              <p className={styles.columnDisplay}>Column: {dropColumn}</p>
            </div>

            <button
              className={styles.dropBtn}
              onClick={handleStartGame}
            >
              DROP BALL
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className={styles.playing}>
            <p>Dropping ball...</p>
            <div className={styles.spinner}></div>
          </div>
        )}

        {gameState === 'result' && result && (
          <div className={styles.result}>
            <h2>🎉 Result</h2>
            <div className={styles.resultDetails}>
              <p><strong>Bin:</strong> {result.binIndex}</p>
              <p><strong>Payout:</strong> {result.payoutMultiplier}x</p>
              <p><strong>Winnings:</strong> ${(result.betCents / 100) * result.payoutMultiplier}</p>
              <p><strong>Round ID:</strong> {result.id}</p>
            </div>

            <div className={styles.fairnessInfo}>
              <p><strong>Peg Map Hash:</strong> {result.pegMapHash.substring(0, 16)}...</p>
              <a href={`/verify?roundId=${result.id}`} target="_blank" rel="noopener noreferrer">
                Verify this round →
              </a>
            </div>

            <button className={styles.playAgainBtn} onClick={handlePlayAgain}>
              Play Again
            </button>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          <a href="/verify">Verifier</a> • Provably Fair • No Real Money
        </p>
      </footer>
    </div>
  );
}
