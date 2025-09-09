import { NextRequest, NextResponse } from 'next/server';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { z } from 'zod';

const zBody = z.object({ deliberationId: z.string() });

export async function POST(req: NextRequest) {
  const parsed = zBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  const res = await compileFromMoves(parsed.data.deliberationId);
  return NextResponse.json(res);
}
