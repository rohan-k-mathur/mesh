import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { getNLIAdapter } from '@/lib/nli/adapter';

const PairSchema = z.object({
  premise: z.string().min(1),
  hypothesis: z.string().min(1),
  // Optional graph ids so we can cache to NLILink
  fromId: z.string().optional(),
  toId: z.string().optional(),
  persist: z.boolean().optional(), // default true when both ids present
});

const BodySchema = z.object({
  pairs: z.array(PairSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { pairs } = parsed.data;
  const adapter = getNLIAdapter();
  const results = await adapter.batch(pairs.map(({ premise, hypothesis }) => ({ premise, hypothesis })));

  // Persist where we can (cheap cache)
  const writes: Promise<any>[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i], r = results[i];
    const shouldPersist = (p.persist ?? true) && !!p.fromId && !!p.toId;
    if (shouldPersist) {
      writes.push(prisma.nLILink.create({
        data: {
          fromId: p.fromId!, toId: p.toId!,
          relation: r.relation, score: r.score,
          createdById: String(userId),
        },
      }).catch(() => null)); // ignore dup/non-critical failures
    }
  }
  if (writes.length) await Promise.all(writes);

  return NextResponse.json({
    adapter: adapter.name,
    results,
  });
}
