import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';

const Body = z.object({
  uri: z.string().min(5),
  kind: z.enum(['primary','secondary','dataset','code']).optional().default('secondary'),
  cite: z.boolean().optional().default(false),  // also create a ClaimCitation
});

function isDoi(u: string) {
  return /^doi:\s*\S+/i.test(u) || /doi\.org\/\S+/i.test(u);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const claimId = params.id;
  const parsed = Body.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { uri, kind, cite } = parsed.data;

  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { id:true } });
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

  // EvidenceLink
  const evidence = await prisma.evidenceLink.create({
    data: { claimId, kind, uri },
    select: { id:true },
  }).catch(()=>null);

  // Optional quick citation (no excerpt)
  let citation: { id: string } | null = null;
  if (cite || isDoi(uri)) {
    citation = await prisma.claimCitation.create({
      data: { claimId, uri, excerptHash: `direct:${Date.now()}`, locatorStart: 0, locatorEnd: 0 },
      select: { id:true },
    }).catch(()=>null);
  }

  // Return quick counts for UI
  const [evidenceCount, citationCount] = await Promise.all([
    prisma.evidenceLink.count({ where: { claimId } }),
    prisma.claimCitation.count({ where: { claimId } }),
  ]);

  return NextResponse.json({
    ok: true,
    evidenceId: evidence?.id ?? null,
    citationId: citation?.id ?? null,
    counts: { evidence: evidenceCount, citations: citationCount },
  });
}
