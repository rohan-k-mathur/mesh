// app/api/aif/conflicts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';

const Body = z.object({
  deliberationId: z.string().min(6),
  createdById: z.string().min(1),
  schemeKey: z.string().nullable().optional(), // e.g., 'REBUT','UNDERCUT','UNDERMINE','ExpertUnreliability'
  conflicting: z.object({
    kind: z.enum(['CLAIM','RA']),
    id: z.string().min(6),
  }),
  conflicted: z.object({
    kind: z.enum(['CLAIM','RA']),
    id: z.string().min(6),
  }),
  // optional for CQ provenance
  cqKey: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const p = Body.parse(await req.json().catch(()=> ({})));

  // Guard: AIF Def 2.1 — S-nodes must have pred+succ; CA has exactly one conflicting/conflicted.
  // (We ensure that by construction.)

  const scheme = p.schemeKey
    ? await prisma.conflictScheme.upsert({
        where: { key: p.schemeKey },
        update: {},
        create: { key: p.schemeKey, name: p.schemeKey },
        select: { id: true }
      })
    : null;

  const ca = await prisma.conflictApplication.create({
    data: {
      deliberationId: p.deliberationId,
      schemeId: scheme?.id ?? null,
      createdById: p.createdById,
      cqKey: p.cqKey ?? null,
      note: p.note ?? null,
      conflictingKind: p.conflicting.kind as any,
      conflictingClaimId:   p.conflicting.kind === 'CLAIM' ? p.conflicting.id : null,
      conflictingArgumentId:p.conflicting.kind === 'RA'    ? p.conflicting.id : null,
      conflictedKind: p.conflicted.kind as any,
      conflictedClaimId:   p.conflicted.kind === 'CLAIM' ? p.conflicted.id : null,
      conflictedArgumentId:p.conflicted.kind === 'RA'    ? p.conflicted.id : null,
    },
    select: { id: true, schemeId: true }
  });

  // Materialize a legacy view row so your AF stays lit:
  // Map CA to argumentEdge when a RA is the target (undercuts), or when an I is the target (rebuts).
  // You can refine this mapping as needed.
  try {
    const targetArgId =
      p.conflicted.kind === 'RA' ? p.conflicted.id :
      p.conflicting.kind === 'RA' ? p.conflicting.id : null;

    if (targetArgId) {
      await prisma.argumentEdge.create({
        data: {
          deliberationId: p.deliberationId,
          createdById: p.createdById,
          fromArgumentId: p.conflicting.kind === 'RA' ? p.conflicting.id : targetArgId, // heuristic
          toArgumentId: targetArgId,
          type: (p.schemeKey === 'UNDERCUT' ? 'undercut' : 'rebut') as any,
          attackType: (p.schemeKey ?? 'REBUT').toUpperCase() as any,
          targetScope: p.schemeKey === 'UNDERCUT' ? 'inference' : 'conclusion',
          cqKey: p.cqKey ?? null,
        }
      }).catch(()=>{});
    }
  } catch {}

  return NextResponse.json({ ok: true, id: ca.id }, { headers: { 'Cache-Control': 'no-store' } });
}
