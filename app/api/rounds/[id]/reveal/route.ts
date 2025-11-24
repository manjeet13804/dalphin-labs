import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.round.update({
      where: { id },
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
