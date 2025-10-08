// app/api/deliberations/[id]/arguments/aif/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { PaginationQuery, makePage } from '@/lib/server/pagination';
import type { TargetType } from '@prisma/client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

const Query = PaginationQuery.extend({
  claimId: z.string().optional(),
  sort: z.string().optional(), // e.g. createdAt:desc (kept for parity)
});

type AifRow = {
  id: string;
  deliberationId: string;
  authorId: string;
  createdAt: string;
  text: string;
  mediaType: 'text'|'image'|'video'|'audio' | null;

  // AIF meta
  aif: {
    scheme?: { id: string; key: string; name: string; slotHints?: any | null } | null;
    conclusion?: { id: string; text: string } | null;
    premises?: Array<{ id: string; text: string; isImplicit?: boolean }> | null;
    implicitWarrant?: { text?: string } | null;
    attacks?: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number };
    cq?: { required: number; satisfied: number };
  };
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const parsed = Query.safeParse({
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    sort: url.searchParams.get('sort') ?? 'createdAt:desc',
    claimId: url.searchParams.get('claimId') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, ...NO_STORE });
  }
  const { cursor, limit, sort, claimId } = parsed.data;
  const [field, dir] = (sort ?? 'createdAt:desc').split(':') as ['createdAt','asc'|'desc'];

  // Pull the base rows (no expensive includes yet)
  const rows = await prisma.argument.findMany({
    where: {
      deliberationId: params.id,
      ...(claimId ? { conclusionClaimId: claimId } : {}),
    },
    orderBy: [{ [field]: dir }, { id: dir }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true, deliberationId: true, authorId: true, createdAt: true,
      text: true, mediaType: true,
      schemeId: true, conclusionClaimId: true,
      implicitWarrant: true,
      // premises relation itself is cheap; we’ll hydrate texts in batch below
      premises: { select: { claimId: true, isImplicit: true } },
    },
  });

  const pageRows = rows.slice(0, limit);

  // after computing: const pageRows = rows.slice(0, limit);
if (pageRows.length === 0) {
  const page = makePage([], limit);
  return NextResponse.json(page, NO_STORE);
}


  // Batch lookup: schemes (+ cqs), claims text for conclusion + premises,
  // attack counts against each argument, and CQ statuses.
  const argIds = pageRows.map(r => r.id);
  const schemeIds = Array.from(new Set(pageRows.map(r => r.schemeId).filter(Boolean) as string[]));
  const claimIds = Array.from(new Set([
    ...pageRows.flatMap(r => r.premises.map(p => p.claimId)),
    ...pageRows.map(r => r.conclusionClaimId).filter(Boolean) as string[],
  ]));

  const [schemes, claims, attackCounts, cqStatuses] = await Promise.all([
    schemeIds.length
      ? prisma.argumentScheme.findMany({
          where: { id: { in: schemeIds } },
          select: {
            id: true, key: true, name: true, slotHints: true,
            cqs: { select: { cqKey: true, text: true, attackType: true, targetScope: true } },
          },
        })
      : Promise.resolve([]),
    claimIds.length
      ? prisma.claim.findMany({ where: { id: { in: claimIds } }, select: { id: true, text: true } })
      : Promise.resolve([]),
    // Count attacks AGAINST each argument (edges into toArgumentId)
    prisma.argumentEdge.groupBy({
      by: ['toArgumentId', 'attackType'],
      where: { toArgumentId: { in: argIds } },
      _count: { _all: true },
    }),
    // CQ statuses (support both shapes: argumentId OR (targetType/targetId))
    prisma.cQStatus.findMany({
      where: {
        OR: [
          { argumentId: { in: argIds } },
          { targetType: "argument" as TargetType, targetId: { in: argIds } },
        ],
      },
      select: { argumentId: true, targetId: true, cqKey: true, status: true },
    }),
  ]);

  const schemeById = new Map(schemes.map(s => [s.id, s]));
  const textByClaimId = new Map(claims.map(c => [c.id, c.text ?? '']));

  // Build a quick { argId -> { REBUTS, UNDERCUTS, UNDERMINES } }
  const atkByArg: Record<string, { REBUTS: number; UNDERCUTS: number; UNDERMINES: number }> = {};
  for (const g of attackCounts) {
    const argId = g.toArgumentId as string;
    atkByArg[argId] ??= { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 };
    const t = String(g.attackType || '').toUpperCase() as 'REBUTS'|'UNDERCUTS'|'UNDERMINES';
    if (t in atkByArg[argId]) (atkByArg[argId] as any)[t] += g._count._all;
  }

  // Pack CQ meter per argument
  const cqMap: Record<string, { satisfied: number; seen: Set<string> }> = {};
  for (const s of cqStatuses) {
    const keyArgId = s.argumentId ?? s.targetId ?? '';
    if (!keyArgId) continue;
    cqMap[keyArgId] ??= { satisfied: 0, seen: new Set<string>() };
    if (s.status === 'answered' && s.cqKey && !cqMap[keyArgId].seen.has(s.cqKey)) {
      cqMap[keyArgId].satisfied += 1;
      cqMap[keyArgId].seen.add(s.cqKey);
    }
  }

  const items: AifRow[] = pageRows.map(r => {
    const scheme = r.schemeId ? schemeById.get(r.schemeId) : null;
    const required = scheme?.cqs?.length ?? 0;
    const satisfied = cqMap[r.id]?.satisfied ?? 0;
    return {
      id: r.id,
      deliberationId: r.deliberationId,
      authorId: r.authorId,
      createdAt: r.createdAt.toISOString(),
      text: r.text,
      mediaType: (r.mediaType as any) ?? 'text',
      aif: {
        scheme: scheme
          ? {
              id: scheme.id,
              key: scheme.key,
              name: scheme.name ?? "",
              slotHints: scheme.slotHints ?? null,
            }
          : null,
        conclusion: r.conclusionClaimId ? { id: r.conclusionClaimId, text: textByClaimId.get(r.conclusionClaimId) ?? "" } : null,
        premises: r.premises.map(p => ({ id: p.claimId, text: textByClaimId.get(p.claimId) ?? "", isImplicit: (p as any).isImplicit ?? false })),
        implicitWarrant: (r.implicitWarrant as any) ?? null,
        attacks: atkByArg[r.id] ?? { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 },
        cq: { required, satisfied },
      },
    };
  });

  const page = makePage(items, limit);
  return NextResponse.json(page, NO_STORE);
}
