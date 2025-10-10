// // app/api/pa/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prismaclient';
// import { z } from 'zod';
// import { getCurrentUserId } from '@/lib/serverutils';

// const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

// const CreatePA = z.object({
//   deliberationId: z.string().min(6),
//   schemeKey: z.string().optional(),
//   // preferred (exactly one)
//   preferredClaimId: z.string().optional(),
//   preferredArgumentId: z.string().optional(),
//   preferredSchemeId: z.string().optional(),
//   // dispreferred (exactly one)
//   dispreferredClaimId: z.string().optional(),
//   dispreferredArgumentId: z.string().optional(),
//   dispreferredSchemeId: z.string().optional(),
// });

// export async function POST(req: NextRequest) {
//   const uid = await getCurrentUserId().catch(()=>null);
//   if (!uid) return NextResponse.json({ error:'Unauthorized' }, { status:401, ...NO_STORE });
//   const p = CreatePA.safeParse(await req.json().catch(()=>({})));
//   if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status:400, ...NO_STORE });
//   const d = p.data;

//   const pref = [d.preferredClaimId, d.preferredArgumentId, d.preferredSchemeId].filter(Boolean).length;
//   const disp = [d.dispreferredClaimId, d.dispreferredArgumentId, d.dispreferredSchemeId].filter(Boolean).length;
//   if (pref !== 1 || disp !== 1) {
//     return NextResponse.json({ error:'PA requires exactly one preferred and one dispreferred element' }, { status:400, ...NO_STORE });
//   }

//   const scheme = d.schemeKey
//     ? await prisma.preferenceScheme.findUnique({ where: { key: d.schemeKey }, select: { id:true } })
//     : null;

//   const created = await prisma.preferenceApplication.create({
//     data: { ...d, schemeId: scheme?.id ?? null, createdById: String(uid) },
//     select: { id:true }
//   });

//   return NextResponse.json({ ok:true, id: created.id }, NO_STORE);
// }

// export async function GET(req: NextRequest) {
//   const u = new URL(req.url);
//   const deliberationId = u.searchParams.get('deliberationId') ?? undefined;
//   const targetArgumentId = u.searchParams.get('targetArgumentId') ?? undefined;
//   const targetClaimId = u.searchParams.get('targetClaimId') ?? undefined;

//   const where: any = {};
//   if (deliberationId) where.deliberationId = deliberationId;
//   if (targetArgumentId) where.OR = [{ preferredArgumentId: targetArgumentId }, { dispreferredArgumentId: targetArgumentId }];
//   if (targetClaimId) where.OR = [{ preferredClaimId: targetClaimId }, { dispreferredClaimId: targetClaimId }];

//   const items = await prisma.preferenceApplication.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
//   return NextResponse.json({ ok:true, items }, NO_STORE);
// }
// app/api/pa/route.ts (shim that delegates)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const legacy = await req.json().catch(()=> ({}));
  const body = {
    deliberationId: legacy.deliberationId,
    createdById: 'self',                 // set from session in your server utils if you prefer
    schemeKey: legacy.schemeKey ?? null,
    preferred: legacy.preferredArgumentId
      ? { kind: 'RA', id: legacy.preferredArgumentId }
      : legacy.preferredClaimId
      ? { kind: 'CLAIM', id: legacy.preferredClaimId }
      : { kind: 'SCHEME', id: legacy.preferredSchemeId },
    dispreferred: legacy.dispreferredArgumentId
      ? { kind: 'RA', id: legacy.dispreferredArgumentId }
      : legacy.dispreferredClaimId
      ? { kind: 'CLAIM', id: legacy.dispreferredClaimId }
      : { kind: 'SCHEME', id: legacy.dispreferredSchemeId },
  };
  const r = await fetch(new URL('/api/aif/preferences', req.url), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  return NextResponse.json(j, { status: r.status, headers: { 'Cache-Control':'no-store' } });
}
