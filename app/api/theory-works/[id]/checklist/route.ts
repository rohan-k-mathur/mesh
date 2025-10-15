// app/api/theory-works/[id]/checklist/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

const Params = z.object({ id: z.string().min(3) });

type FilledStat = { required: number; filled: number; open: string[] };

function fieldStat<T extends Record<string, any>>(obj?: T | null, req: (keyof T)[] = []): FilledStat {
  if (!obj) return { required: req.length, filled: 0, open: req.map(String) };
  const open: string[] = [];
  let filled = 0;
  for (const k of req) {
    const v = (obj as any)[k as string];
    const ok =
      Array.isArray(v) ? v.length > 0 :
      typeof v === 'string' ? v.trim().length > 0 :
      v !== null && v !== undefined;
    if (ok) filled++; else open.push(String(k));
  }
  return { required: req.length, filled, open };
}

async function countEvidenceForClaims(claimIds: string[]) {
  // Be defensive across schemas: attempt both claimEvidence and claimCitation
  const [ev, cit] = await Promise.all([
    prisma.claimEvidence?.count?.({ where: { claimId: { in: claimIds } } }).catch(() => 0),
    prisma.claimCitation?.count?.({ where: { claimId: { in: claimIds } } }).catch(() => 0),
  ]);
  return (Number(ev) || 0) + (Number(cit) || 0);
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const { id } = Params.parse(ctx.params);

  const work = await prisma.theoryWork.findUnique({
    where: { id },
    include: {
      WorkDNStructure: true, WorkIHTheses: true, WorkTCTheses: true, WorkOPTheses: true,
      dn: true, ih: true, tc: true, op: true,
      relatedClaims: { include: { work: false } },
    }
  });
  if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Compute per‑thesis slot coverage
  const dnSlots = ['explanandum','nomological','ceterisParibus'] as const;
  const ihSlots = ['structure','function','objectivity'] as const;
  const tcSlots = ['instrumentFunction','explanation','applications'] as const;
  const opSlots = ['unrecognizability','alternatives'] as const;

  const dn = fieldStat(work.WorkDNStructure, dnSlots);
  const ih = fieldStat(work.WorkIHTheses, ihSlots);
  const tc = fieldStat(work.WorkTCTheses, tcSlots);
  const op = fieldStat(work.WorkOPTheses, opSlots);

  // Aggregate CQ across linked claims by calling your per‑claim summary route (fast in parallel)
  const claimIds = work.relatedClaims.map(rc => rc.claimId);
  const cqSummaries = await Promise.all(
    claimIds.map(async (cid) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/claims/${cid}/cq/summary`, { cache: 'no-store' })
        .catch(() => null);
      if (!res?.ok) return null;
      return res.json() as Promise<{ schemes: Array<{schemeKey:string; required:number; satisfied:number; open:string[]}>; required:number; satisfied:number; completeness:number }>;
    })
  );

  const cqRequired = cqSummaries.reduce((a,s)=> a + (s?.required ?? 0), 0);
  const cqSatisfied = cqSummaries.reduce((a,s)=> a + (s?.satisfied ?? 0), 0);
  const schemesMap = new Map<string, { required: number; satisfied: number; open: string[] }>();
  for (const s of cqSummaries.filter(Boolean) as NonNullable<typeof cqSummaries[number]>[]) {
    for (const row of s.schemes) {
      const acc = schemesMap.get(row.schemeKey) ?? { required: 0, satisfied: 0, open: [] as string[] };
      acc.required += row.required; acc.satisfied += row.satisfied; acc.open.push(...row.open);
      schemesMap.set(row.schemeKey, acc);
    }
  }
  const openByScheme = [...schemesMap.entries()].map(([schemeKey, v]) => ({ schemeKey, required: v.required, satisfied: v.satisfied, open: v.open }));

  // Evidence count (citations + evidence rows)
  const evidenceCount = claimIds.length ? await countEvidenceForClaims(claimIds) : 0;

  // Advisory dialogue readiness (pull a tiny sample of legal moves)
  // NOTE: thin, optional; if your endpoint requires more context, return empty.
  let dialogue: any = { hasClosableLoci: false, legalMoves: [] as any[] };
  try {
    // e.g., sample the first claim’s legal moves if available
    const first = claimIds[0];
    if (first) {
      const lm = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/dialogue/legal-moves?targetType=claim&targetId=${first}`, { cache: 'no-store' });
      if (lm.ok) {
        const { moves, closable } = await lm.json();
        dialogue = {
          hasClosableLoci: !!closable,
          legalMoves: (moves ?? []).slice(0, 4).map((m: any) => ({
            kind: m.kind, force: m.force, relevance: m.relevance
          }))
        };
      }
    }
  } catch {}

  const cqCompleteness = cqRequired ? cqSatisfied / cqRequired : 0;
  const publishable =
    (work.theoryType === 'DN' ? dn.required === dn.filled :
     work.theoryType === 'IH' ? ih.required === ih.filled :
     work.theoryType === 'TC' ? tc.required === tc.filled :
     work.theoryType === 'OP' ? op.required === op.filled : true)
    && cqCompleteness >= (Number(process.env.CQ_MIN_COMPLETENESS ?? '0.6'));

  return NextResponse.json({
    work: { id: work.id, title: work.title, theoryType: work.theoryType, status: work.status },
    dn, ih, tc, op,
    theses: { dn: dnSlots, ih: ihSlots, tc: tcSlots, op: opSlots },
    claims: {
      count: claimIds.length,
      byRole: work.relatedClaims.reduce((acc, rc) => (acc[rc.role] = (acc[rc.role] ?? 0)+1, acc), {} as Record<string, number>),
      cq: { required: cqRequired, satisfied: cqSatisfied, openByScheme, completeness: cqCompleteness },
      evidence: { count: evidenceCount }
    },
    dialogue,
    publishable
  });
}
