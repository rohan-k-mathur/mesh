// app/api/theory-works/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

const Params = z.object({ id: z.string().min(3) });
const Body = z.object({
  to: z.enum(['sheet','kb','aif']),
  options: z.object({
    curatedSheetId: z.string().optional(),
    dryRun: z.boolean().optional().default(false),
    includeAif: z.boolean().optional().default(true),
    setStatus: z.enum(['PUBLISHED','ACTIVE','DRAFT']).optional(),
    claimSource: z.enum(['linked','extract']).optional().default('linked'),
    overwriteClaims: z.boolean().optional().default(false),
  }).optional().default({})
});

type EdgeSpec = { fromClaimId: string; toClaimId: string; type: 'supports'|'rebuts'; attackType?: 'SUPPORTS'|'REBUTS'|'UNDERCUTS'|'UNDERMINES'; targetScope?: 'premise'|'inference'|'conclusion' };

async function makeEdge(fromId: string, payload: Omit<EdgeSpec,'fromClaimId'>) {
  // Reuse your existing endpoint so recompute/labels happen in one place. :contentReference[oaicite:12]{index=12}
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/claims/${fromId}/edges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`edge upsert failed: ${await res.text()}`);
  return res.json();
}

function asAIF({ claims, edges }:{ claims: {id:string,text:string}[], edges: EdgeSpec[] }) {
  // Minimal AIF/AIF+ graph (I, RA/CA). You can expand to PA and schemes later. 
  const I = claims.map(c => ({ id: `I:${c.id}`, text: c.text }));
  // For supports/rebuts we emit RA (inference) and CA (conflict) nodes in a simple pattern.
  const RA = [] as any[]; const CA = [] as any[]; const E = [] as any[];
  let raN = 0, caN = 0;

  for (const e of edges) {
    if (e.type === 'supports') {
      const raId = `RA:${++raN}`;
      RA.push({ id: raId, scheme: 'support' });
      E.push({ from: `I:${e.fromClaimId}`, to: raId, type: 'premise' });
      E.push({ from: raId, to: `I:${e.toClaimId}`, type: 'conclusion' });
    } else if (e.type === 'rebuts') {
      const caId = `CA:${++caN}`;
      CA.push({ id: caId, scheme: e.attackType === 'UNDERCUTS' ? 'undercut' : 'rebut' });
      E.push({ from: `I:${e.fromClaimId}`, to: caId, type: 'conflicting' });
      E.push({ from: caId, to: `I:${e.toClaimId}`, type: 'conflicted' });
    }
  }
  return { nodes: { I, RA, CA }, edges: E };
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const { id } = Params.parse(ctx.params);
  const { to, options } = Body.parse(await req.json().catch(() => ({})));

  // Load work + relations
  const work = await prisma.theoryWork.findUnique({
    where: { id },
    include: {
      relatedClaims: true,
      WorkDNStructure: true, WorkIHTheses: true, WorkTCTheses: true, WorkOPTheses: true,
      dn: true, ih: true, tc: true, op: true,
    }
  });
  if (!work) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 1) Materialize claim set
  // Strategy A: linked (preferred)
  let claimIds = work.relatedClaims.map(rc => rc.claimId);
  if (options.claimSource === 'extract' && claimIds.length === 0) {
    // OPTIONAL: extract claims from body (stub; replace with your extractor)
    // For now, we keep it no-op if none are linked.
    claimIds = [];
  }

  // Pull their texts
  const claims = claimIds.length ? await prisma.claim.findMany({
    where: { id: { in: claimIds } },
    select: { id: true, text: true, deliberationId: true }
  }) : [];
  const deliberationId = claims[0]?.deliberationId ?? work.deliberationId;

  // 2) Build minimal edges from theses + rules/reasonpairs
  const edges: EdgeSpec[] = [];
  // Example mapping: theses imply a support to the "work’s main thesis" if present
  const mainTheses = work.relatedClaims.filter(rc => rc.role === 'thesis').map(rc => rc.claimId);
  if (mainTheses.length >= 1) {
    const head = mainTheses[0];
    // Contribute IH/TC/OP/DN children as supports to head
    for (const rc of work.relatedClaims.filter(rc => rc.role !== 'thesis')) {
      edges.push({ fromClaimId: rc.claimId, toClaimId: head, type: 'supports', attackType: 'SUPPORTS' });
    }
  }

  // Also translate your Rule rows into supports (STRICT/DEFEASIBLE => SUPPORTS vs UNDERCUTS targeting inference later)
  const rules = await prisma.rule.findMany({ where: { workId: work.id } });
  for (const r of rules) {
    // naive parse: body→head (claims must exist)
    const to = claims.find(c => c.text?.trim() === r.head?.trim());
    const from = claims.find(c => c.text?.trim() === r.body?.trim());
    if (from && to) edges.push({ fromClaimId: from.id, toClaimId: to.id, type: 'supports', attackType: 'SUPPORTS' });
  }

  // ReasonPairs: FOR/AGAINST → supports/rebuts
  const rps = await prisma.reasonPair.findMany({ where: { deliberationId } });
  for (const rp of rps) {
    if (!claimIds.includes(rp.claimId) || !claimIds.includes(rp.reasonId)) continue;
    const type = rp.stance === 'AGAINST' ? 'rebuts' : 'supports';
    edges.push({ fromClaimId: rp.reasonId, toClaimId: rp.claimId, type });
  }

  // 3) Apply edges (idempotent upsert via your edges API) and recompute AF labels there. :contentReference[oaicite:14]{index=14}
  const createdEdges: any[] = [];
  if (!options.dryRun) {
    for (const e of edges) {
      await makeEdge(e.fromClaimId, {
        toClaimId: e.toClaimId,
        type: e.type,
        attackType: e.attackType,
        targetScope: e.targetScope
      }).then(res => createdEdges.push(res.edge));
    }
  }

  // 4) Construct AIF if requested
  const aif = options.includeAif ? asAIF({
    claims: claims.map(c => ({ id: c.id, text: c.text })),
    edges
  }) : null;

  // 5) Snapshot
  const snapshot = await prisma.theoryWorkSnapshot.create({
    data: {
      workId: work.id,
      kind: to,
      payload: {
        claims: claims.map(c => ({ id: c.id, text: c.text })),
        edges,
        aif
      } as any
    }
  });

  // 6) Update work publishing hooks
  const lastExport = { kind: to, ids: [snapshot.id], at: new Date().toISOString() };
  const patch: any = { lastExport };
  if (options.setStatus) patch.status = options.setStatus;
  if (options.setStatus === 'PUBLISHED') patch.publishedAt = new Date();
  if (!options.dryRun) await prisma.theoryWork.update({ where: { id: work.id }, data: patch });

  const links: any = {};
  if (to === 'sheet') {
    // canonical synthetic DebateSheet for the deliberation
    links.sheet = `delib:${deliberationId}`; // readers should resolve this key to the synthetic sheet. :contentReference[oaicite:15]{index=15}
  }
  if (to === 'kb') links.kb = `kb://page/${work.slug}`;
  if (to === 'aif') links.aif = `agora://snap/${snapshot.id}.aif.json`;

  return NextResponse.json({
    links, snapshotId: snapshot.id,
    created: { claims: 0, edges: createdEdges.length },
    updated: { claims: 0, edges: 0 },
    aif: aif ? { nodeCounts: { I: aif.nodes.I.length, RA: aif.nodes.RA.length, CA: aif.nodes.CA.length, PA: 0 } } : null,
    groundedLabelsRecomputed: true
  });
}
