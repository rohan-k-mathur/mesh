import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stepInteraction } from 'packages/ludics-engine/stepper';

const q = z.object({
  posDesignId: z.string(),
  negDesignId: z.string(),
  dialogueId: z.string(),
});

export async function GET(req: NextRequest) {
  const parsed = q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status:400 });

  const { dialogueId, posDesignId, negDesignId } = parsed.data;
  const res = await stepInteraction({ dialogueId, posDesignId, negDesignId, maxPairs: 10_000, phase:'neutral' });
  const orthogonal = res.status === 'CONVERGENT';
  return NextResponse.json({ ok:true, orthogonal, trace: res });
}
