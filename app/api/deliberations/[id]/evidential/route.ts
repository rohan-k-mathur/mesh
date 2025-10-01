import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Mode = 'product' | 'min';
const clamp01 = (x:number)=> Math.max(0, Math.min(1, x));
const compose = (xs:number[], mode:Mode)=> !xs.length ? 0 : (mode==='min' ? Math.min(...xs) : xs.reduce((a,b)=>a*b,1));
const join    = (xs:number[], mode:Mode)=> !xs.length ? 0 : (mode==='min' ? Math.max(...xs) : 1 - xs.reduce((a,s)=>a*(1-s),1));

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const mode: Mode = (url.searchParams.get('mode') === 'min' ? 'min' : 'product');
  const deliberationId = params.id;

  // (1) Claims in this room
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    select: { id:true, text:true },
  });
  const claimIds = claims.map(c=>c.id);

  // (1b) Concluding arguments for each claim
  const conclusions = await prisma.argument.findMany({
    where: { deliberationId, claimId: { in: claimIds } },
    select: { id:true, claimId:true },
  });
  const conclByClaim = new Map<string,string>(conclusions.map(a => [a.claimId!, a.id]));

  // (2) Supports (base confidence snapshots)
  const supports = await prisma.argumentSupport.findMany({
    where: { deliberationId, claimId: { in: claimIds } },
    select: { id:true, claimId:true, argumentId:true, base:true },
  });

  if (supports.length === 0) {
    return NextResponse.json({
      ok: true, deliberationId, mode, nodes: [], arguments: [],
      meta: { claims: claims.length, supports: 0, edges: 0, conclusions: conclusions.length }
    }, { headers: { 'Cache-Control':'no-store' } });
  }

  // (3) Premise edges (argument → argument)
  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId, type: 'support' },
    select: { fromArgumentId:true, toArgumentId:true },
  });
  const byTo = new Map<string,string[]>();
  for (const e of edges) {
    if (!byTo.has(e.toArgumentId)) byTo.set(e.toArgumentId, []);
    byTo.get(e.toArgumentId)!.push(e.fromArgumentId);
  }

  // (4) Assumptions (use `weight` in schema)
  const uses = await prisma.assumptionUse.findMany({
    where: { argumentId: { in: supports.map(s=>s.argumentId) } },
    select: { argumentId:true, weight:true },
  }).catch(()=>[] as any[]);
  const assumpByArg = new Map<string, number[]>();
  for (const u of uses) {
    const val = clamp01(u.weight ?? 0.6);
    if (!assumpByArg.has(u.argumentId)) assumpByArg.set(u.argumentId, []);
    assumpByArg.get(u.argumentId)!.push(val);
  }

  // (5) Base map
  const baseByArg = new Map<string, number>(supports.map(s => [s.argumentId, s.base ?? 0.55]));

  type Contribution = { argumentId:string; score:number; parts:{base:number; premises:number[]; assumptions:number[]} };
  const contributionsByClaim = new Map<string, Contribution[]>();

  for (const s of supports) {
    const base = baseByArg.get(s.argumentId) ?? 0.55;
    const premIds = byTo.get(s.argumentId) ?? [];
    const premBases = premIds.map(pid => baseByArg.get(pid) ?? 0.5);
    const premFactor = premBases.length ? compose(premBases, mode) : 1;
    const aBases = assumpByArg.get(s.argumentId) ?? [];
    const assumpFactor = aBases.length ? compose(aBases, mode) : 1;
    const score = clamp01(compose([base, premFactor], mode) * assumpFactor);

    if (!contributionsByClaim.has(s.claimId)) contributionsByClaim.set(s.claimId, []);
    contributionsByClaim.get(s.claimId)!.push({ argumentId: s.argumentId, score, parts: { base, premises: premBases, assumptions: aBases } });
  }

  const nodes = claims.map(c => {
    const contribs = (contributionsByClaim.get(c.id) ?? []).sort((a,b)=>b.score - a.score);
    const support = join(contribs.map(x=>x.score), mode);
    const top = contribs.slice(0, 5).map(x => ({ argumentId: x.argumentId, score: +x.score.toFixed(4) }));
    return {
      id: c.id,
      diagramId: conclByClaim.get(c.id) ?? null, // argument id for this claim
      type: 'claim' as const,
      text: c.text,
      score: +support.toFixed(4),
      top
    };
  });

  const argIds = Array.from(new Set(supports.map(s=>s.argumentId)));
  const argumentsMeta = await prisma.argument.findMany({
    where: { id: { in: argIds } },
    select: { id:true, text:true, quantifier:true, modality:true },
  });

  return NextResponse.json({
    ok: true, deliberationId, mode, nodes, arguments: argumentsMeta,
    meta: { claims: claims.length, supports: supports.length, edges: edges.length, conclusions: conclusions.length }
  }, { headers: { 'Cache-Control':'no-store' } });
}
