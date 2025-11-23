import { NextRequest, NextResponse } from 'next/server';
import { createCommit, combineSeed } from '@/lib/crypto';
import { runGame } from '@/lib/engine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serverSeed = searchParams.get('serverSeed');
    const clientSeed = searchParams.get('clientSeed');
    const nonce = searchParams.get('nonce');
    const dropColumnStr = searchParams.get('dropColumn');

    if (!serverSeed || !clientSeed || !nonce || !dropColumnStr) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const dropColumn = parseInt(dropColumnStr, 10);
    if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'Invalid dropColumn' },
        { status: 400 }
      );
    }

    // Recompute everything
    const commitHex = createCommit(serverSeed, nonce);
    const combined = combineSeed(serverSeed, clientSeed, nonce);
    const gameResult = runGame(combined, dropColumn);

    return NextResponse.json({
      commitHex,
      combinedSeed: combined,
      pegMapHash: gameResult.pegMapHash,
      binIndex: gameResult.path.binIndex,
    });
  } catch (error) {
    console.error('Error verifying:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
