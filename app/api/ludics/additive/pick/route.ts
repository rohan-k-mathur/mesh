import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

const zBody = z.object({
  dialogueId: z.string(),
  posDesignId: z.string(),
  negDesignId: z.string(),
  parentPath: z.string(),    // e.g. "0.3"
  childSuffix: z.string(),   // e.g. "1"
});

export async function POST(req: NextRequest) {
  const parsed = zBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  const { dialogueId, posDesignId, negDesignId, parentPath, childSuffix } = parsed.data;

  const last = await prisma.ludicTrace.findFirst({
    where: { deliberationId: dialogueId, posDesignId, negDesignId },
    orderBy: { createdAt: 'desc' },
  });

  const usedAdditive = { ...(last?.extJson as any)?.usedAdditive, [parentPath]: childSuffix };
  const res = await prisma.ludicTrace.create({
    data: {
      deliberationId: dialogueId,
      posDesignId, negDesignId,
      status: last?.status ?? 'ONGOING',
      steps: last?.steps ?? [],
      extJson: { usedAdditive },
    },
  });

  return NextResponse.json({ ok:true, traceId: res.id, usedAdditive });
}
