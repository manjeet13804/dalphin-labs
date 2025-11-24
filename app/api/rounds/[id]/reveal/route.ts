import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const round = await prisma.round.findUnique({
      where: { id: params.id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.round.update({
      where: { id: params.id },
      data: {
        status: 'REVEALED',
        revealedAt: new Date(),
      },
    });

    return NextResponse.json({
      roundId: updated.id,
      serverSeed: updated.serverSeed,
      status: updated.status,
    });
  } catch (error) {
    console.error('Error revealing round:', error);
    return NextResponse.json(
      { error: 'Failed to reveal round' },
      { status: 500 }
    );
  }
}
