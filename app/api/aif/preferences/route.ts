// app/api/aif/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';

const Body = z.object({
  deliberationId: z.string().min(6),
  createdById: z.string().min(1),
  schemeKey: z.string().nullable().optional(), // e.g., 'EO_OVER_GK'
  preferred: z.object({ kind: z.enum(['CLAIM','RA']), id: z.string().min(6) }),
  dispreferred: z.object({ kind: z.enum(['CLAIM','RA']), id: z.string().min(6) }),
});

export async function POST(req: NextRequest) {
  const p = Body.parse(await req.json().catch(()=> ({})));
  if (p.preferred.kind === p.dispreferred.kind && p.preferred.id === p.dispreferred.id) {
    return NextResponse.json({ ok:false, error:'preferred==dispreferred' }, { status: 400 });
  }

  const scheme = p.schemeKey
    ? await prisma.preferenceScheme.upsert({
        where: { key: p.schemeKey }, update: {},
        create: { key: p.schemeKey, name: p.schemeKey },
        select: { id: true }
      })
    : null;

  const pa = await prisma.preferenceApplication.create({
    data: {
      deliberationId: p.deliberationId, createdById: p.createdById,
      schemeId: scheme?.id ?? null,
      preferredKind: p.preferred.kind as any,
      preferredClaimId:    p.preferred.kind==='CLAIM' ? p.preferred.id : null,
      preferredArgumentId: p.preferred.kind==='RA'    ? p.preferred.id : null,
      dispreferredKind: p.dispreferred.kind as any,
      dispreferredClaimId:    p.dispreferred.kind==='CLAIM' ? p.dispreferred.id : null,
      dispreferredArgumentId: p.dispreferred.kind==='RA'    ? p.dispreferred.id : null,
    },
    select: { id: true }
  });

  return NextResponse.json({ ok: true, id: pa.id }, { headers: { 'Cache-Control': 'no-store' } });
}
