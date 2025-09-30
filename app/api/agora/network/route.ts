import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type EdgeKind = 'xref' | 'overlap' | 'stack_ref' | 'imports' | 'shared_author';
type EdgeRow = { from: string; to: string; kind: EdgeKind; weight: number };

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
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { scope, maxRooms } = parsed.data;

  /* --------------------- 1) Rooms --------------------- */
  let rooms: { id: string; title?: string | null }[] = [];
  try {
    rooms = await prisma.deliberation.findMany({
      where: scope === 'public' ? ({ visibility: { in: ['public', 'PUBLIC'] } } as any) : {}, // TODO: following scope
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' as any },
      take: maxRooms,
    });
  } catch {
    // fallback from arguments (should rarely trigger)
    const rows = await prisma.argument.findMany({
      select: { deliberationId: true },
      distinct: ['deliberationId'],
      take: maxRooms,
    });
    rooms = rows.map((r) => ({ id: r.deliberationId, title: null }));
  }
  const roomIds = rooms.map((r) => r.id);
  if (!roomIds.length) {
    return NextResponse.json({ scope, version: Date.now(), rooms: [], edges: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  /* ---------------- 2) Per-room summaries -------------- */
  const [argCounts, edgeCounts, labels] = await Promise.all([
    prisma.argument.groupBy({
      by: ['deliberationId'],
      _count: { deliberationId: true },
      where: { deliberationId: { in: roomIds } },
    }).catch(() => [] as any),
    prisma.argumentEdge.groupBy({
      by: ['deliberationId'],
      _count: { deliberationId: true },
      where: { deliberationId: { in: roomIds } },
    }).catch(() => [] as any),
    prisma.claimLabel.findMany({
      where: { deliberationId: { in: roomIds } },
      select: { deliberationId: true, label: true },
    }).catch(() => [] as any),
  ]);

  const mArgs = new Map<string, number>();
  (argCounts as any[]).forEach(r => mArgs.set(r.deliberationId, r._count?.deliberationId ?? 0));

  const mEdges = new Map<string, number>();
  (edgeCounts as any[]).forEach(r => mEdges.set(r.deliberationId, r._count?.deliberationId ?? 0));

  const accBy = new Map<string, { accepted: number; rejected: number; undecided: number }>();
  (labels as any[]).forEach(r => {
    const b = accBy.get(r.deliberationId) ?? { accepted: 0, rejected: 0, undecided: 0 };
    if (r.label === 'IN') b.accepted++;
    else if (r.label === 'OUT') b.rejected++;
    else b.undecided++;
    accBy.set(r.deliberationId, b);
  });

  /* ---------------- 3) Meta-edges (XR + overlap + 3 new kinds) -------------- */
  const meta: EdgeRow[] = [];

  // A) explicit cross-refs (your generic XRef table). NOTE: model name may be XRef or Xref in your Prisma;
  try {
    const xr = await (prisma as any).xRef.findMany({
      where: { fromId: { in: roomIds }, toId: { in: roomIds } },
      select: { fromId: true, toId: true },
      take: 5000,
    });
    meta.push(...xr.map((x: any) => ({ from: x.fromId, to: x.toId, kind: 'xref' as const, weight: 1 })));
  } catch {
    // Optional fallback: canonical-claim overlap if XRef absent
    try {
      const claims = await prisma.claim.findMany({
        where: { deliberationId: { in: roomIds }, canonicalClaimId: { not: null } },
        select: { deliberationId: true, canonicalClaimId: true },
      });
      const byCanon = new Map<string, string[]>();
      for (const c of claims) {
        const arr = byCanon.get(c.canonicalClaimId!) ?? [];
        arr.push(c.deliberationId);
        byCanon.set(c.canonicalClaimId!, arr);
      }
      for (const [, list] of byCanon) {
        const uniq = Array.from(new Set(list));
        for (let i = 0; i < uniq.length; i++) {
          for (let j = i + 1; j < uniq.length; j++) {
            meta.push({ from: uniq[i], to: uniq[j], kind: 'overlap', weight: 1 });
          }
        }
      }
    } catch {}
  }

  // B) stack references
  try {
    const srefs = await prisma.stackReference.findMany({
      where: { fromDeliberationId: { in: roomIds }, toDeliberationId: { in: roomIds } },
      select: { fromDeliberationId: true, toDeliberationId: true },
      take: 5000,
    });
    meta.push(...srefs.map(s => ({ from: s.fromDeliberationId, to: s.toDeliberationId, kind: 'stack_ref' as const, weight: 1 })));
  } catch {}

  // C) imports/restatements
  try {
    const imps = await prisma.argumentImport.findMany({
      where: { fromDeliberationId: { in: roomIds }, toDeliberationId: { in: roomIds } },
      select: { fromDeliberationId: true, toDeliberationId: true },
      take: 5000,
    });
    meta.push(...imps.map(s => ({ from: s.fromDeliberationId, to: s.toDeliberationId, kind: 'imports' as const, weight: 1 })));
  } catch {}

  // D) shared authorship weak ties
  try {
    const sa = await prisma.sharedAuthorRoomEdge.findMany({
      where: { fromId: { in: roomIds }, toId: { in: roomIds } },
      select: { fromId: true, toId: true, strength: true },
      take: 5000,
    });
    meta.push(...sa.map(e => ({
      from: e.fromId,
      to: e.toId,
      kind: 'shared_author' as const,
      weight: Math.max(1, Math.round((e.strength ?? 1))),
    })));
  } catch {}

  // Aggregate duplicates across the same (from,to,kind)
  const agg = new Map<string, EdgeRow>();
  for (const e of meta) {
    const k = `${e.from}|${e.to}|${e.kind}`;
    const prev = agg.get(k);
    agg.set(k, prev ? { ...prev, weight: prev.weight + e.weight } : e);
  }

  /* ---------------- 4) Response ---------------- */
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

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
