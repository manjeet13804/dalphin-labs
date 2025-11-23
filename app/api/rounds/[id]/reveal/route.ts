import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Params = { id: string };

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;

    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(round);
  } catch (error) {
    console.error('Error fetching round:', error);
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    );
  }
}
