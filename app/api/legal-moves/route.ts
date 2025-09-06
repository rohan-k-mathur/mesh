// app/api/dialogue/legal-moves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/serverutils';
import { legalAttacksFor } from '@/lib/dialogue/legalMoves';

const BodySchema = z.object({ text: z.string().min(1) });

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { text } = parsed.data;
  const res = legalAttacksFor(text);

  return NextResponse.json({ ok: true, ...res });
}
