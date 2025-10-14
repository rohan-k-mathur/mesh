import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/serverutils';
import { legalAttacksFor } from '@/lib/dialogue/legalAttackCuesFor';

const BodySchema = z.object({ text: z.string().min(1) });

export async function POST(req: NextRequest) {
  // If you want anonymous access here, remove the auth check below.
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { text } = parsed.data;
  const { shape, options } = legalAttacksFor(text);

  // Match Option-B’s expected shape: lm.ok && lm.options.length
  return NextResponse.json({
    ok: true,
    shape,
    options, // each has { key, label, template }
  });
}
