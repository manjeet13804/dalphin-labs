import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { combineSeed } from '@/lib/crypto';
import { runGame, getPayoutMultiplier } from '@/lib/engine';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { clientSeed, betCents, dropColumn } = await request.json();

    // Validate inputs
    if (!clientSeed || typeof betCents !== 'number' || typeof dropColumn !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    if (dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'dropColumn must be 0-12' },
        { status: 400 }
      );
    }

    // Get round
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    if (!round.serverSeed) {
      return NextResponse.json(
        { error: 'Round not properly initialized' },
        { status: 400 }
      );
    }

    // Compute combined seed
    const combined = combineSeed(round.serverSeed, clientSeed, round.nonce);

    // Run game engine
    const gameResult = runGame(combined, dropColumn);

    // Get payout
    const payoutMultiplier = getPayoutMultiplier(gameResult.path.binIndex);

    // Update round
    const updated = await prisma.round.update({
      where: { id },
      data: {
        status: 'STARTED',
        clientSeed,
        combinedSeed: combined,
        pegMapHash: gameResult.pegMapHash,
        dropColumn,
        binIndex: gameResult.path.binIndex,
        payoutMultiplier,
        betCents,
        pathJson: JSON.stringify(gameResult.path.decisions),
      },
    });

    return NextResponse.json({
      roundId: updated.id,
      pegMapHash: updated.pegMapHash,
      rows: updated.rows,
      binIndex: updated.binIndex,
      payoutMultiplier,
    });
  } catch (error) {
    console.error('Error starting round:', error);
    return NextResponse.json(
      { error: 'Failed to start round' },
      { status: 500 }
    );
  }
}
