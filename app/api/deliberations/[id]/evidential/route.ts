import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Mode = 'product'|'min'|'ds';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const compose = (xs: number[], mode: Mode) =>
  !xs.length ? 0 : (mode === 'min' ? Math.min(...xs) : xs.reduce((a, b) => a * b, 1));



// const join = (xs: number[], mode: Mode) =>
//   !xs.length ? 0 : (mode === 'min' ? Math.max(...xs) : 1 - xs.reduce((a, s) => a * (1 - s), 1));

// const join = (xs:number[], mode:Mode) => {
//   if (!xs.length) return 0;
//   if (mode==='min') return Math.max(...xs);
//   // 'product' and 'ds' both use noisy-or for now; 'ds' can be returned as pair if you prefer.
//   return 1 - xs.reduce((a,s)=> a*(1-s), 1);
// };


const join = (xs:number[], mode:Mode) => {
  if (!xs.length) return 0;
  if (mode==='min') return Math.max(...xs);
  // product & ds: noisy-or accrual
  return 1 - xs.reduce((a,s)=> a*(1-s), 1);
};


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // const url = new URL(req.url);
  // const mode: Mode = (url.searchParams.get('mode') === 'min' ? 'min' : 'product');
  const deliberationId = params.id;

    const url = new URL(req.url);
  const q = (url.searchParams.get('mode') ?? 'product').toLowerCase();
  const mode: Mode = (q === 'min' || q === 'ds') ? (q as Mode) : 'product';
  // (1) All claims for this room
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    select: { id: true, text: true },
  });
  const claimIds = claims.map(c => c.id);
  

  // (2) All “promoted” arguments concluding each claim (argument.claimId = claim.id)
  const conclusions = await prisma.argument.findMany({
    where: { deliberationId, claimId: { in: claimIds } },
    select: { id: true, claimId: true },
  });
  const conclByClaim = new Map<string, string>(conclusions.map(a => [a.claimId!, a.id]));

  // (3) Materialized supports (backfilled base)
  const supports = await prisma.argumentSupport.findMany({
    where: { deliberationId, claimId: { in: claimIds } },
    select: { id: true, claimId: true, argumentId: true, base: true },
  });

  // Early out: still respond with the new shape
  if (supports.length === 0) {
    return NextResponse.json(
      {
        ok: true,
        deliberationId,
        mode,
        support: {},
        hom: {},
        arguments: [],
        meta: { claims: claims.length, supports: 0, edges: 0, conclusions: conclusions.length },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

   // (3) Premise edges (argument → argument)
  const aEdges = await prisma.argumentEdge.findMany({
    where: { deliberationId, type: 'support' },
    select: { fromArgumentId:true, toArgumentId:true },
  });
  const parents = new Map<string,string[]>();      // toArg -> [fromArgs]
  for (const e of aEdges) (parents.get(e.toArgumentId) ?? parents.set(e.toArgumentId, []).get(e.toArgumentId)!).push(e.fromArgumentId);

  // (4) Assumptions
  const uses = await prisma.assumptionUse.findMany({
    where: { argumentId: { in: supports.map(s=>s.argumentId) } },
    select: { argumentId:true, weight:true },
  }).catch(()=>[] as any[]);
  const assump = new Map<string, number[]>();      // arg -> [weights]
  for (const u of uses) (assump.get(u.argumentId) ?? assump.set(u.argumentId, []).get(u.argumentId)!).push(clamp01(u.weight ?? 0.6));

  // (5) Base map
  const base = new Map<string, number>(supports.map(s => [s.argumentId, s.base ?? 0.55]));
  
  type Contribution = { argumentId: string; score: number; parts: { base: number; premises: number[]; assumptions: number[] } };
  const contributionsByClaim = new Map<string, Contribution[]>();
  const argsByClaim = new Map<string, string[]>(); // for hom(I, φ)


  // type Contribution = { argumentId:string; score:number; parts:{base:number; premises:number[]; assumptions:number[]} };
  const byClaim = new Map<string, Contribution[]>();
  const atomicByClaim = new Map<string, string[]>(); // hom(I,φ): arg ids with no premises
 for (const s of supports) {
    const b = base.get(s.argumentId) ?? 0.55;
    const premIds = parents.get(s.argumentId) ?? [];
    const premBases = premIds.map(pid => base.get(pid) ?? 0.5);
    const premFactor = premBases.length ? compose(premBases, mode) : 1;
    const aBases = assump.get(s.argumentId) ?? [];
    const assumpFactor = aBases.length ? compose(aBases, mode) : 1;
    const score = clamp01(compose([b, premFactor], mode) * assumpFactor);

    (byClaim.get(s.claimId) ?? byClaim.set(s.claimId, []).get(s.claimId)!)
      .push({ argumentId: s.argumentId, score, parts: { base: b, premises: premBases, assumptions: aBases } });

    if (!premIds.length) {
      (atomicByClaim.get(s.claimId) ?? atomicByClaim.set(s.claimId, []).get(s.claimId)!)
        .push(s.argumentId);
    }
  }

  // (4) Premise edges (argument → argument)
  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId, type: 'support' },
    select: { fromArgumentId: true, toArgumentId: true },
  });
  const byTo = new Map<string, string[]>();
  for (const e of edges) {
    if (!byTo.has(e.toArgumentId)) byTo.set(e.toArgumentId, []);
    byTo.get(e.toArgumentId)!.push(e.fromArgumentId);
  }

  // (5) Assumptions (use `weight` in AssumptionUse)
  // const uses = await prisma.assumptionUse.findMany({
  //   where: { argumentId: { in: supports.map(s => s.argumentId) } },
  //   select: { argumentId: true, weight: true },
  // }).catch(() => [] as any[]);

  const assumpByArg = new Map<string, number[]>();
  for (const u of uses) {
    const val = clamp01(u.weight ?? 0.6);
    if (!assumpByArg.has(u.argumentId)) assumpByArg.set(u.argumentId, []);
    assumpByArg.get(u.argumentId)!.push(val);
  }

  // (6) Base confidence for each supporting arg
  const baseByArg = new Map<string, number>(supports.map(s => [s.argumentId, s.base ?? 0.55]));

  // (7) Per-claim contributions and “hom(I, φ)” membership
  for (const s of supports) {
    const base = baseByArg.get(s.argumentId) ?? 0.55;

    // premises as independent sub-arguments
    const premIds = byTo.get(s.argumentId) ?? [];
    const premBases = premIds.map(pid => baseByArg.get(pid) ?? 0.5);
    const premFactor = premBases.length ? compose(premBases, mode) : 1;

    // assumptions
    const aBases = assumpByArg.get(s.argumentId) ?? [];
    const assumpFactor = aBases.length ? compose(aBases, mode) : 1;

    const score = clamp01(compose([base, premFactor], mode) * assumpFactor);

    if (!contributionsByClaim.has(s.claimId)) contributionsByClaim.set(s.claimId, []);
    contributionsByClaim.get(s.claimId)!.push({
      argumentId: s.argumentId,
      score,
      parts: { base, premises: premBases, assumptions: aBases },
    });

    if (!argsByClaim.has(s.claimId)) argsByClaim.set(s.claimId, []);
    argsByClaim.get(s.claimId)!.push(s.argumentId);
  }

  // (8) Claim‑level support and top contributors
  const support: Record<string, number> = {};
    const dsSupport: Record<string,{bel:number; pl:number}> = {}; // NEW

  const nodes = claims.map(c => {
    const contribs = (contributionsByClaim.get(c.id) ?? []).sort((a,b)=>b.score - a.score);
    const s = join(contribs.map(x => x.score), mode);
    support[c.id] = +s.toFixed(4);

    if (mode === 'ds') {
      // first cut: no conflict mass computed yet → Pl = Bel
      dsSupport[c.id] = { bel: support[c.id], pl: support[c.id] };
    }
    
    //support[c.id] = +s.toFixed(4);
    const top = contribs.slice(0, 5).map(x => ({ argumentId: x.argumentId, score: +x.score.toFixed(4) }));
    return {
      id: c.id,
      diagramId: conclByClaim.get(c.id) ?? null, // argument id for this claim
      type: 'claim' as const,
      text: c.text,
      score: support[c.id],
      top,
    };

  });

  

  const argIds = Array.from(new Set(supports.map(s => s.argumentId)));
  const argumentsMeta = await prisma.argument.findMany({
    where: { id: { in: argIds } },
    select: { id: true, text: true, quantifier: true, modality: true },
  });

  // (9) hom-set “I|φ” → { args: [...] }
  const hom: Record<string, { args: string[] }> = {};
  for (const [claimId, argList] of argsByClaim) hom[`I|${claimId}`] = { args: Array.from(new Set(argList)) };

  return NextResponse.json({
    ok: true, deliberationId, mode, support, ...(mode==='ds' ? { dsSupport } : {}),
    hom, nodes, arguments: argumentsMeta,
    meta: { claims: claims.length, supports: supports.length, edges: edges.length, conclusions: conclusions.length }
  }, { headers: { 'Cache-Control': 'no-store' } });
}