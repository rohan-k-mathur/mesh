// app/api/dialogue/commitments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

const Q = z.object({ deliberationId: z.string().min(5) });

export async function GET(req: NextRequest) {
  const qs = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = Q.safeParse(qs);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const { deliberationId } = parsed.data;
  const rows = await prisma.commitment.findMany({
    where: { deliberationId, isRetracted: false },
    orderBy: { createdAt: 'asc' },
    select: { participantId:true, proposition:true, locusPath:true, createdAt:true }
  });

  const byUser: Record<string, Array<{ proposition:string; locusPath?:string|null; createdAt:string }>> = {};
  for (const r of rows) {
    const u = String(r.participantId);
    byUser[u] ??= [];
    byUser[u].push({ proposition: r.proposition, locusPath: r.locusPath ?? null, createdAt: r.createdAt.toISOString() });
  }

  return NextResponse.json({ ok:true, commitments: byUser }, { headers: { 'Cache-Control': 'no-store' } });
}
