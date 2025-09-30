// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prismaclient';
// import { z } from 'zod';

// export const dynamic = 'force-dynamic';
// export const revalidate = 0;
// type EdgeRow = { from: string; to: string; kind: 'xref'|'overlap'|'stack_ref'|'imports'|'shared_author'; weight: number };


// // model XRef {
// //   id        String   @id @default(cuid())
// //   fromType  String
// //   fromId    String
// //   toType    String
// //   toId      String
// //   relation  String // 'cites'|'evidence-for'|'discusses'|'originates-from'|'replies-to'|'cross-claim'|...
// //   metaJson  Json?
// //   createdAt DateTime @default(now())

// //   @@unique([fromType, fromId, toType, toId, relation])
// //   @@index([fromType, fromId])
// //   @@index([toType, toId])
// //   @@index([relation])
// //   @@index([fromType, fromId, relation])
// //   @@index([toType, toId, relation])
// // }



// const Q = z.object({
//   scope: z.enum(['public', 'following']).default('public'),
//   maxRooms: z.coerce.number().int().positive().max(500).default(80),
// });

// export async function GET(req: NextRequest) {
//   const url = new URL(req.url);
//   const parsed = Q.safeParse({
//     scope: url.searchParams.get('scope') ?? undefined,
//     maxRooms: url.searchParams.get('maxRooms') ?? undefined,
//   });
//   if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });

//   const { scope, maxRooms } = parsed.data;

//   // 1) Rooms
//   let rooms: { id: string; title?: string | null }[] = [];
//   try {
//     rooms = await prisma.deliberation.findMany({
//       where: scope === 'public' ? ({ visibility: { in: ['public', 'PUBLIC'] } } as any) : {},
//       select: { id: true, title: true },
//       orderBy: { updatedAt: 'desc' as any },
//       take: maxRooms,
//     });
//   } catch {
//     // fallback from arguments
//     const rows = await prisma.argument.findMany({
//       select: { deliberationId: true },
//       distinct: ['deliberationId'],
//       take: maxRooms,
//     });
//     rooms = rows.map((r) => ({ id: r.deliberationId, title: null }));
//   }

//   const roomIds = rooms.map((r) => r.id);

//   // A) explicit xrefs (as you already had)
// const xr = await prisma.xRef.findMany({
//   where: { fromId: { in: roomIds }, toId: { in: roomIds } },
//   select: { fromId: true, toId: true },
//   take: 5000,
// });
// meta.push(...xr.map(x => ({ from: x.fromId, to: x.toId, kind: "xref" as const, weight: 1 })));


//   // 2) Summaries
//   const [argCounts, edgeCounts, labels] = await Promise.all([
//     prisma.argument
//       .groupBy({ by: ['deliberationId'], _count: { deliberationId: true }, where: { deliberationId: { in: roomIds } } })
//       .catch(() => []),
//     prisma.argumentEdge
//       .groupBy({ by: ['deliberationId'], _count: { deliberationId: true }, where: { deliberationId: { in: roomIds } } })
//       .catch(() => []),
//     prisma.claimLabel
//       .findMany({ where: { deliberationId: { in: roomIds } }, select: { deliberationId: true, label: true } })
//       .catch(() => []),
//   ]);

//   const mArgs = new Map<string, number>();
//   for (const r of argCounts as any[]) mArgs.set(r.deliberationId, r._count?.deliberationId ?? 0);

//   const mEdges = new Map<string, number>();
//   for (const r of edgeCounts as any[]) mEdges.set(r.deliberationId, r._count?.deliberationId ?? 0);

//   const accBy = new Map<string, { accepted: number; rejected: number; undecided: number }>();
//   for (const r of labels as any[]) {
//     const b = accBy.get(r.deliberationId) ?? { accepted: 0, rejected: 0, undecided: 0 };
//     if (r.label === 'IN') b.accepted++;
//     else if (r.label === 'OUT') b.rejected++;
//     else b.undecided++;
//     accBy.set(r.deliberationId, b);
//   }

//   // 3) Meta-edges
//   let meta: { from: string; to: string; kind: 'xref' | 'overlap'; weight: number }[] = [];
//   try {
//     // Prefer explicit xrefs if you have this table
//     const xr = await prisma.deliberationXref.findMany({
//       where: { fromId: { in: roomIds }, toId: { in: roomIds } },
//       select: { fromId: true, toId: true },
//       take: 5000,
//     });
//     meta = xr.map((x) => ({ from: x.fromId, to: x.toId, kind: 'xref', weight: 1 }));
//   } catch {
//     // Fallback: canonical-claim overlaps
//     try {
//       const claims = await prisma.claim.findMany({
//         where: { deliberationId: { in: roomIds }, canonicalClaimId: { not: null } },
//         select: { deliberationId: true, canonicalClaimId: true },
//       });
//       const byCanon = new Map<string, string[]>();
//       for (const c of claims) {
//         const a = byCanon.get(c.canonicalClaimId!) ?? [];
//         a.push(c.deliberationId);
//         byCanon.set(c.canonicalClaimId!, a);
//       }
//       for (const [, roomList] of byCanon) {
//         const uniq = Array.from(new Set(roomList));
//         for (let i = 0; i < uniq.length; i++)
//           for (let j = i + 1; j < uniq.length; j++) meta.push({ from: uniq[i], to: uniq[j], kind: 'overlap', weight: 1 });
//       }
//     } catch {}
//   }

//   // Deduplicate & aggregate weights
//   const agg = new Map<string, { from: string; to: string; kind: 'xref' | 'overlap'; weight: number }>();
//   for (const e of meta) {
//     const k = `${e.from}|${e.to}|${e.kind}`;
//     const prev = agg.get(k);
//     agg.set(k, prev ? { ...prev, weight: prev.weight + e.weight } : e);
//   }

//   const out = {
//     scope,
//     version: Date.now(),
//     rooms: rooms.map((r) => ({
//       id: r.id,
//       title: r.title ?? null,
//       nArgs: mArgs.get(r.id) ?? 0,
//       nEdges: mEdges.get(r.id) ?? 0,
//       ...(accBy.get(r.id) ?? { accepted: 0, rejected: 0, undecided: 0 }),
//     })),
//     edges: Array.from(agg.values()),
//   };

//   return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
// }



import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
type EdgeRow = { from: string; to: string; kind: 'xref'|'overlap'|'stack_ref'|'imports'|'shared_author'; weight: number };


const Q = z.object({
  scope: z.enum(['public', 'following']).default('public'),
  maxRooms: z.coerce.number().int().positive().max(500).default(80),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    scope: url.searchParams.get('scope') ?? undefined,
    maxRooms: url.searchParams.get('maxRooms') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });

  const { scope, maxRooms } = parsed.data;
let meta: EdgeRow[] = [];

  // 1) Rooms
  let rooms: { id: string; title?: string | null }[] = [];
  try {
    rooms = await prisma.deliberation.findMany({
      where: scope === 'public' ? ({ visibility: { in: ['public', 'PUBLIC'] } } as any) : {},
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' as any },
      take: maxRooms,
    });
  } catch {
    // fallback from arguments
    const rows = await prisma.argument.findMany({
      select: { deliberationId: true },
      distinct: ['deliberationId'],
      take: maxRooms,
    });
    rooms = rows.map((r) => ({ id: r.deliberationId, title: null }));
  }

  const roomIds = rooms.map((r) => r.id);

  // A) explicit xrefs (as you already had)
const xr = await prisma.xRef.findMany({
  where: { fromId: { in: roomIds }, toId: { in: roomIds } },
  select: { fromId: true, toId: true },
  take: 5000,
});
meta.push(...xr.map(x => ({ from: x.fromId, to: x.toId, kind: "xref" as const, weight: 1 })));


  // 2) Summaries
  const [argCounts, edgeCounts, labels] = await Promise.all([
    prisma.argument
      .groupBy({ by: ['deliberationId'], _count: { deliberationId: true }, where: { deliberationId: { in: roomIds } } })
      .catch(() => []),
    prisma.argumentEdge
      .groupBy({ by: ['deliberationId'], _count: { deliberationId: true }, where: { deliberationId: { in: roomIds } } })
      .catch(() => []),
    prisma.claimLabel
      .findMany({ where: { deliberationId: { in: roomIds } }, select: { deliberationId: true, label: true } })
      .catch(() => []),
  ]);

  const mArgs = new Map<string, number>();
  for (const r of argCounts as any[]) mArgs.set(r.deliberationId, r._count?.deliberationId ?? 0);

  const mEdges = new Map<string, number>();
  for (const r of edgeCounts as any[]) mEdges.set(r.deliberationId, r._count?.deliberationId ?? 0);

  const accBy = new Map<string, { accepted: number; rejected: number; undecided: number }>();
  for (const r of labels as any[]) {
    const b = accBy.get(r.deliberationId) ?? { accepted: 0, rejected: 0, undecided: 0 };
    if (r.label === 'IN') b.accepted++;
    else if (r.label === 'OUT') b.rejected++;
    else b.undecided++;
    accBy.set(r.deliberationId, b);
  }

  // 3) Meta-edges
  //let meta: { from: string; to: string; kind: 'xref' | 'overlap'; weight: number }[] = [];
  try {
    // Prefer explicit xrefs if you have this table
    const xr = await prisma.xRef.findMany({
      where: { fromId: { in: roomIds }, toId: { in: roomIds } },
      select: { fromId: true, toId: true },
      take: 5000,
    });
    meta = xr.map((x) => ({ from: x.fromId, to: x.toId, kind: 'xref', weight: 1 }));
  } catch {
    // Fallback: canonical-claim overlaps
    try {
      const claims = await prisma.claim.findMany({
        where: { deliberationId: { in: roomIds }, canonicalClaimId: { not: null } },
        select: { deliberationId: true, canonicalClaimId: true },
      });
      const byCanon = new Map<string, string[]>();
      for (const c of claims) {
        const a = byCanon.get(c.canonicalClaimId!) ?? [];
        a.push(c.deliberationId);
        byCanon.set(c.canonicalClaimId!, a);
      }
      for (const [, roomList] of byCanon) {
        const uniq = Array.from(new Set(roomList));
        for (let i = 0; i < uniq.length; i++)
          for (let j = i + 1; j < uniq.length; j++) meta.push({ from: uniq[i], to: uniq[j], kind: 'overlap', weight: 1 });
      }
    } catch {}
  }

  // Deduplicate & aggregate weights
//   const agg = new Map<string, { from: string; to: string; kind: 'xref' | 'overlap'; weight: number }>();
//   for (const e of meta) {
//     const k = `${e.from}|${e.to}|${e.kind}`;
//     const prev = agg.get(k);
//     agg.set(k, prev ? { ...prev, weight: prev.weight + e.weight } : e);
//   }

//   const out = {
//     scope,
//     version: Date.now(),
//     rooms: rooms.map((r) => ({
//       id: r.id,
//       title: r.title ?? null,
//       nArgs: mArgs.get(r.id) ?? 0,
//       nEdges: mEdges.get(r.id) ?? 0,
//       ...(accBy.get(r.id) ?? { accepted: 0, rejected: 0, undecided: 0 }),
//     })),
//     edges: Array.from(agg.values()),
//   };

// C) stack references (optional, if you track stack ownership + attachments)
try {
  const srefs = await prisma.stackReference.findMany({
    where: { fromDeliberationId: { in: roomIds }, toDeliberationId: { in: roomIds } },
    select: { fromDeliberationId: true, toDeliberationId: true },
    take: 5000,
  });
  meta.push(...srefs.map(s => ({ from: s.fromDeliberationId, to: s.toDeliberationId, kind: 'stack_ref', weight: 1 })));
} catch {}

// D) imports/restatements of arguments/claims across rooms
try {
  const imps = await prisma.argumentImport.findMany({
    where: { fromDeliberationId: { in: roomIds }, toDeliberationId: { in: roomIds } },
    select: { fromDeliberationId: true, toDeliberationId: true },
    take: 5000,
  });
  meta.push(...imps.map(s => ({ from: s.fromDeliberationId, to: s.toDeliberationId, kind: 'imports', weight: 1 })));
} catch {}

// E) shared author signals (weak tie)
try {
  const sa = await prisma.sharedAuthorRoomEdge.findMany({
    where: { fromId: { in: roomIds }, toId: { in: roomIds } },
    select: { fromId: true, toId: true, strength: true },
    take: 5000,
  });
  meta.push(...sa.map(e => ({ from: e.fromId, to: e.toId, kind: 'shared_author', weight: Math.max(1, Math.round(e.strength ?? 1)) })));
} catch {}

// Aggregate (same as yours)
const agg = new Map<string, EdgeRow>();
for (const e of meta) {
  const k = `${e.from}|${e.to}|${e.kind}`;
  const prev = agg.get(k);
  agg.set(k, prev ? { ...prev, weight: prev.weight + e.weight } : e);
}
const out = {
    scope,
    version: Date.now(),
    rooms: rooms.map((r) => ({
      id: r.id,
      title: r.title ?? null,
      nArgs: mArgs.get(r.id) ?? 0,
      nEdges: mEdges.get(r.id) ?? 0,
      ...(accBy.get(r.id) ?? { accepted: 0, rejected: 0, undecided: 0 }),
    })),
    edges: Array.from(agg.values()),
  };
// JSON shape unchanged but now includes more edge kinds
// return NextResponse.json({
//   scope,
//   version: Date.now(),
//   rooms: rooms.map(/* unchanged */),
//   edges: Array.from(agg.values()),
// }, { headers: { 'Cache-Control': 'no-store' } }); 
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });

}