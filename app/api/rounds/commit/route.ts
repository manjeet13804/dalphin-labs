import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createCommit } from '@/lib/crypto';

const prisma = new PrismaClient();

export async function POST(_request: NextRequest) {
  try {
    // Generate random serverSeed and nonce
    const serverSeed = randomBytes(32).toString('hex');
    const nonce = randomBytes(16).toString('hex');

    // Create commit hash
    const commitHex = createCommit(serverSeed, nonce);

    // Create round in DB
    const round = await prisma.round.create({
      data: {
        serverSeed,
        nonce,
        commitHex,
        status: 'CREATED',
      },
    });

    return NextResponse.json({
      roundId: round.id,
      commitHex: round.commitHex,
      nonce: round.nonce,
    });
  } catch (error) {
    console.error('Error creating round:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
}
