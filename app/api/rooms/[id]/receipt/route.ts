// app/api/rooms/[id]/receipt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createReceipt } from '@/server/trust/receipt';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = new PrismaClient();
  const room = await prisma.room.findUnique({ where: { id: params.id } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const payload = {
    roomId: room.id,
    timestamp: new Date().toISOString(),
    shardUrl: room.shardUrl,
    mediaBucket: room.mediaBucket,
    kmsKeyArn: room.kmsKeyArn,
    kmsAlias: room.kmsKeyArn ? `alias/mesh/room/${room.id}` : undefined,
    manifestHash: null
  };
  const receipt = createReceipt(payload);
  return NextResponse.json(receipt);
}
