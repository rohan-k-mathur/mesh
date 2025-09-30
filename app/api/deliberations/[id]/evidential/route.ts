import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Mode = 'product' | 'min';

const clamp01 = (x:number) => Math.max(0, Math.min(1, x));

// composition across premises in a chain
function compose(xs:number[], mode:Mode): number {
  if (!xs.length) return 0;
  return mode === 'min' ? Math.min(...xs) : xs.reduce((a,b)=>a*b, 1);
}

// join (add more independent reasons)
function join(xs:number[], mode:Mode): number {
  if (!xs.length) return 0;
  return mode === 'min'
    ? Math.max(...xs)
    : 1 - xs.reduce((acc, s) => acc * (1 - s), 1); // probabilistic OR
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const mode: Mode = (url.searchParams.get('mode') === 'min' ? 'min' : 'product');

  const deliberationId = params.id;

  // (1) Pull claims and promoted arguments that conclude those claims
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    select: { id:true, text:true }
  });

  const supports = await prisma.argumentSupport.findMany({
    where: { deliberationId, claimId: { in: claims.map(c=>c.id) } },
    select: { id:true, claimId:true, argumentId:true }
  });

  // (2) For premises: direct supporting arguments for each “conclusion argument”
  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId, type: 'support' },
    select: { fromArgumentId:true, toArgumentId:true }
  });

  const byTo = new Map<string, string[]>();
  for (const e of edges) {
    const arr = byTo.get(e.toArgumentId) ?? [];
    arr.push(e.fromArgumentId);
    byTo.set(e.toArgumentId, arr);
  }

  // (3) Assumptions that weaken chains (optional)
  const uses = await prisma.assumptionUse.findMany({
    where: { argumentId: { in: supports.map(s=>s.argumentId) } },
    select: { argumentId:true }
  }).catch(()=>[] as any[]);
  const assumpByArg = new Map<string, number[]>();
  for (const u of uses) {
    const arr = assumpByArg.get(u.argumentId) ?? [];
    arr.push(clamp01((u.confidence ?? 0.6)));
    assumpByArg.set(u.argumentId, arr);
  }

  // (4) Compute per-contribution chain score (one hop premises)
  // S(A -> claim) = compose( [base(A), ...premises], mode ) ⋅ compose(assumptions, mode)
  type Contribution = { argumentId:string; score:number; parts:{base:number; premises:number[]; assumptions:number[]} };
  const contributionsByClaim = new Map<string, Contribution[]>();

  // Since 'base' is not available on argumentSupport, use a default value (e.g., 0.55)
  const baseByArg = new Map(supports.map(s => [s.argumentId, 0.55]));
  for (const s of supports) {
    const base = baseByArg.get(s.argumentId) ?? 0.55;
    const premIds = byTo.get(s.argumentId) ?? [];
    const premBases = premIds.map(pid => baseByArg.get(pid) ?? 0.5);
    const premFactor = premBases.length ? compose(premBases, mode) : 1;

    const aBases = assumpByArg.get(s.argumentId) ?? [];
    const assumpFactor = aBases.length ? compose(aBases, mode) : 1;

    const score = clamp01(compose([base, premFactor], mode) * assumpFactor);

    const list = contributionsByClaim.get(s.claimId) ?? [];
    list.push({ argumentId: s.argumentId, score, parts: { base, premises: premBases, assumptions: aBases } });
    contributionsByClaim.set(s.claimId, list);
  }

  // (5) Join contributions per-claim, return top contributors
  const nodes = claims.map(c => {
    const contribs = (contributionsByClaim.get(c.id) ?? []).sort((a,b)=>b.score - a.score);
    const support = join(contribs.map(x=>x.score), mode);
    const top = contribs.slice(0, 5).map(x => ({ argumentId: x.argumentId, score: x.score }));
    return {
      id: c.id,
      type: 'claim' as const,
      text: c.text,
      score: +support.toFixed(4),
      top
    };
  });

  // optional: echo arguments that appeared as contributors
  const argIds = Array.from(new Set(supports.map(s=>s.argumentId)));
  const argumentsMeta = await prisma.argument.findMany({
    where: { id: { in: argIds } },
    select: { id:true, text:true, quantifier:true, modality:true }
  });

  return NextResponse.json({
    ok: true,
    deliberationId,
    mode,
    nodes,
    arguments: argumentsMeta
  }, { headers: { 'Cache-Control':'no-store' } });
}
