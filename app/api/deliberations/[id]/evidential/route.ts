//app/api/deliberations/[id]/evidential/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { DEFAULT_ARGUMENT_CONFIDENCE, DEFAULT_PREMISE_BASE } from "@/lib/config/confidence";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Mode = 'product'|'min'|'ds';
const clamp01 = (x:number) => Math.max(0, Math.min(1, x));
const compose = (xs:number[], mode:Mode)=> !xs.length ? 0 : (mode==='min' ? Math.min(...xs) : xs.reduce((a,b)=>a*b,1));
const join    = (xs:number[], mode:Mode)=> !xs.length ? 0 : (mode==='min' ? Math.max(...xs) : 1 - xs.reduce((a,s)=>a*(1-s),1));




// const join = (xs: number[], mode: Mode) =>
//   !xs.length ? 0 : (mode === 'min' ? Math.max(...xs) : 1 - xs.reduce((a, s) => a * (1 - s), 1));

// const join = (xs:number[], mode:Mode) => {
//   if (!xs.length) return 0;
//   if (mode==='min') return Math.max(...xs);
//   // 'product' and 'ds' both use noisy-or for now; 'ds' can be returned as pair if you prefer.
//   return 1 - xs.reduce((a,s)=> a*(1-s), 1);
// };




export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const deliberationId = params.id;

  const qMode = (url.searchParams.get('mode') ?? 'product').toLowerCase();
  const mode: Mode = (qMode === 'min' || qMode === 'ds') ? (qMode as Mode) : 'product';
  const imports = (url.searchParams.get('imports') ?? 'off').toLowerCase() as 'off'|'materialized'|'virtual'|'all';

  // 1) claims and concluding args
  const claims = await prisma.claim.findMany({ where: { deliberationId }, select: { id:true, text:true } });
  const claimIds = claims.map(c => c.id);
  const conclusions = await prisma.argument.findMany({
    where: { deliberationId, claimId: { in: claimIds } },
    select: { id:true, claimId:true },
  });
  const conclByClaim = new Map<string,string>(conclusions.map(a => [a.claimId!, a.id]));

  // 2) base supports in this room (materialized)
  const base = await prisma.argumentSupport.findMany({
    where: { deliberationId, claimId: { in: claimIds } },
    select: { claimId:true, argumentId:true, base:true, provenanceJson:true }
  });

  // include/exclude materialized imports
  const includeMat = imports === 'materialized' || imports === 'all';
  const localSupports = includeMat
    ? base
    : base.filter(s => (s.provenanceJson as any)?.kind !== 'import');

  // 3) virtual imports (read-only) → mapped into this room’s claims
  let virtualAdds: Array<{ claimId: string; argumentId: string; base: number }> = [];
  if (imports === 'virtual' || imports === 'all') {
    const imps = await prisma.argumentImport.findMany({
      where: { toDeliberationId: deliberationId, toClaimId: { in: claimIds } },
      select: { fingerprint:true, toClaimId:true, toArgumentId:true, baseAtImport:true }
    });
    virtualAdds = imps
      .filter(i => !i.toArgumentId) // not materialized
      .map(i => ({
        claimId: i.toClaimId!,
        argumentId: `virt:${i.fingerprint}`,
        base: clamp01(i.baseAtImport ?? DEFAULT_ARGUMENT_CONFIDENCE),
      }));
  }

  const allSupports = [
    ...localSupports.map(s => ({ claimId: s.claimId, argumentId: s.argumentId, base: clamp01(s.base ?? DEFAULT_ARGUMENT_CONFIDENCE) })),
    ...virtualAdds,
  ];

  if (!allSupports.length) {
    return NextResponse.json({
      ok:true, deliberationId, mode, support:{}, hom:{}, arguments:[],
      meta: { claims: claims.length, supports: 0, edges: 0, conclusions: conclusions.length }
    }, { headers: { 'Cache-Control':'no-store' } });
  }

  // 4) premises+assumptions only apply to *real* argument ids
  const realArgIds = Array.from(new Set(allSupports.map(s => s.argumentId).filter(id => !id.startsWith('virt:'))));
  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId, type:'support' as any, toArgumentId: { in: realArgIds } },
    select: { fromArgumentId:true, toArgumentId:true },
  });
  const parents = new Map<string,string[]>();
  for (const e of edges) (parents.get(e.toArgumentId) ?? parents.set(e.toArgumentId,[]).get(e.toArgumentId)!).push(e.fromArgumentId);

  // Gap 4: Per-derivation assumption tracking
  // Fetch all derivations (ArgumentSupport) for these arguments
  const derivations = await prisma.argumentSupport.findMany({
    where: { argumentId: { in: realArgIds } },
    select: { id: true, argumentId: true }
  });
  
  const derivationIds = derivations.map(d => d.id);
  const derivByArg = new Map<string, string[]>();
  for (const d of derivations) {
    (derivByArg.get(d.argumentId) ?? derivByArg.set(d.argumentId, []).get(d.argumentId)!).push(d.id);
  }

  // Fetch per-derivation assumptions
  const derivAssumptions = await prisma.derivationAssumption.findMany({
    where: { derivationId: { in: derivationIds } }
  });

  // Map: derivationId -> assumption weights
  const assumpByDeriv = new Map<string, number[]>();
  for (const da of derivAssumptions) {
    (assumpByDeriv.get(da.derivationId) ?? assumpByDeriv.set(da.derivationId, []).get(da.derivationId)!)
      .push(clamp01(da.weight));
  }

  // Legacy fallback: argument-level assumptions (for backward compatibility)
  const legacyUses = await prisma.assumptionUse.findMany({
    where: { argumentId: { in: realArgIds } },
    select: { argumentId:true, weight:true },
  }).catch(()=>[] as any[]);
  const legacyAssump = new Map<string, number[]>();
  for (const u of legacyUses) {
    (legacyAssump.get(u.argumentId) ?? legacyAssump.set(u.argumentId,[]).get(u.argumentId)!)
      .push(clamp01(u.weight ?? 0.6));
  }

  const baseByArg = new Map<string, number>();
  for (const s of allSupports) if (!s.argumentId.startsWith('virt:')) baseByArg.set(s.argumentId, s.base);

  // 5) contributions (per-derivation assumption tracking)
  type Contribution = { argumentId:string; score:number; parts:{base:number; premises:number[]; assumptions:number[]} };
  const contributionsByClaim = new Map<string, Contribution[]>();
  const argsByClaim = new Map<string, string[]>();

  for (const s of allSupports) {
    const real = !s.argumentId.startsWith("virt:");
    const b = real ? (baseByArg.get(s.argumentId) ?? s.base) : s.base;
    const premIds = real ? (parents.get(s.argumentId) ?? []) : [];
    const premBases = real ? premIds.map(pid => baseByArg.get(pid) ?? DEFAULT_PREMISE_BASE) : [];
    const premFactor = premBases.length ? compose(premBases, mode) : 1;

    // Per-derivation assumption tracking:
    let aBases: number[] = [];
    if (real) {
      const derivIds = derivByArg.get(s.argumentId) ?? [];
      const derivAssumps: number[] = [];
      for (const dId of derivIds) {
        const weights = assumpByDeriv.get(dId) ?? [];
        if (weights.length) derivAssumps.push(...weights);
      }
      // Fallback to legacy argument-level if no per-derivation data
      aBases = derivAssumps.length ? derivAssumps : (legacyAssump.get(s.argumentId) ?? []);
    }

    const assumpFactor = aBases.length ? compose(aBases, mode) : 1;
    const score = clamp01(compose([b, premFactor], mode) * assumpFactor);

    (contributionsByClaim.get(s.claimId) ?? contributionsByClaim.set(s.claimId, []).get(s.claimId)!)
      .push({ argumentId: s.argumentId, score, parts:{ base:b, premises: premBases, assumptions: aBases } });

    (argsByClaim.get(s.claimId) ?? argsByClaim.set(s.claimId, []).get(s.claimId)!)
      .push(s.argumentId);
  }

  // 6) support + nodes + hom + DS conflict mass computation
  const support: Record<string, number> = {};
  const dsSupport: Record<string,{ bel:number; pl:number }> = {};

  // For DS mode, fetch negation mappings to compute conflict mass
  let negationMappings: Map<string, string[]> = new Map(); // claimId -> [negatedClaimIds]
  if (mode === "ds") {
    const negMaps = await prisma.negationMap.findMany({
      where: { deliberationId },
      select: { claimId: true, negatedClaimId: true, confidence: true },
    });
    
    for (const nm of negMaps) {
      const list = negationMappings.get(nm.claimId) ?? [];
      list.push(nm.negatedClaimId);
      negationMappings.set(nm.claimId, list);
    }
  }

  const nodes = claims.map(c => {
    const contribs = (contributionsByClaim.get(c.id) ?? []).sort((a,b)=>b.score - a.score);
    const s = join(contribs.map(x=>x.score), mode);
    support[c.id] = +s.toFixed(4);
    
    // DS interval: compute bel and pl with conflict mass
    if (mode === "ds") {
      const bel = support[c.id];
      let conflictMass = 0;
      
      // Find negated claims and compute their support (conflict mass)
      const negatedIds = negationMappings.get(c.id) ?? [];
      if (negatedIds.length > 0) {
        const negContribs: number[] = [];
        for (const negId of negatedIds) {
          const negSupports = contributionsByClaim.get(negId) ?? [];
          const negScore = join(negSupports.map(x => x.score), mode);
          negContribs.push(negScore);
        }
        // Conflict mass = join of all negation supports
        conflictMass = negContribs.length > 0 ? join(negContribs, mode) : 0;
      }
      
      // Uncertainty mass (uncommitted belief)
      const uncertaintyMass = Math.max(0, 1 - bel - conflictMass);
      
      // Plausibility: bel + uncertainty = 1 - conflict
      const pl = Math.min(1, bel + uncertaintyMass);
      
      dsSupport[c.id] = { 
        bel: +bel.toFixed(4), 
        pl: +pl.toFixed(4) 
      };
    }
    
    const top = contribs.slice(0,5).map(x => ({ argumentId: x.argumentId, score: +x.score.toFixed(4) }));
    return { id:c.id, diagramId: conclByClaim.get(c.id) ?? null, type:"claim" as const, text:c.text, score: support[c.id], top };
  });

  const argIds = Array.from(new Set(allSupports.map(s => s.argumentId).filter(id => !id.startsWith('virt:'))));
  const argumentsMeta = await prisma.argument.findMany({
    where: { id: { in: argIds } },
    select: { id:true, text:true, quantifier:true, modality:true },
  });

  const hom: Record<string,{ args:string[] }> = {};
  for (const [claimId, list] of argsByClaim) hom[`I|${claimId}`] = { args: Array.from(new Set(list)) };

  return NextResponse.json({
    ok:true, deliberationId, mode, support, ...(mode==='ds' ? { dsSupport } : {}),
    hom, nodes, arguments: argumentsMeta,
    meta: { claims: claims.length, supports: allSupports.length, edges: edges.length, conclusions: conclusions.length }
  }, { headers: { 'Cache-Control':'no-store' } });
}