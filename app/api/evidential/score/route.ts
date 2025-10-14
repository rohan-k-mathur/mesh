// app/api/evidential/score/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

type Mode = 'min'|'prod'|'ds';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const deliberationId = String(u.searchParams.get('deliberationId') ?? '');
  const mode: Mode = (u.searchParams.get('mode') as Mode) ?? 'min';
  const tau = Math.max(0, Math.min(1, Number(u.searchParams.get('tau') ?? 0.7)));
  const explain = u.searchParams.get('explain') === '1';

  if (!deliberationId) return NextResponse.json({ ok:false, error:'missing deliberationId' }, { status:400 });

  // Pull minimal neighborhood for this room
  const [claims, args, edges] = await Promise.all([
    prisma.claim.findMany({ where:{ deliberationId }, select:{ id:true, text:true }}),
    prisma.argument.findMany({
      where:{ deliberationId },
      select:{ id:true, text:true, conclusionClaimId:true,
               premises:{ select:{ claimId:true, isImplicit:true } } }
    }),
    prisma.argumentEdge.findMany({
      where:{ deliberationId },
      select:{ id:true, type:true, attackType:true, targetScope:true,
               fromArgumentId:true, toArgumentId:true,
               targetClaimId:true, targetPremiseId:true }
    })
  ]);

  // Indexes
  const argsByConclusion = new Map<string, any[]>();
  for (const a of args) {
    const k = a.conclusionClaimId ?? '__none__';
    const list = argsByConclusion.get(k) ?? [];
    list.push(a); argsByConclusion.set(k, list);
  }

  const rebutByClaim = new Map<string, any[]>();
  const undercutsByArg = new Map<string, any[]>();
  const underminesByPrem = new Map<string, any[]>();
  for (const e of edges) {
    if (String(e.attackType).toUpperCase() === 'REBUTS' && e.targetClaimId) {
      (rebutByClaim.get(e.targetClaimId) ?? rebutByClaim.set(e.targetClaimId, []), rebutByClaim.get(e.targetClaimId)!).push(e);
    }
    if (String(e.type).toLowerCase() === 'undercut' || String(e.attackType).toUpperCase() === 'UNDERCUTS') {
      if (e.toArgumentId) (undercutsByArg.get(e.toArgumentId) ?? undercutsByArg.set(e.toArgumentId, []), undercutsByArg.get(e.toArgumentId)!).push(e);
    }
    if (String(e.attackType).toUpperCase() === 'UNDERMINES' && e.targetPremiseId) {
      (underminesByPrem.get(e.targetPremiseId) ?? underminesByPrem.set(e.targetPremiseId, []), underminesByPrem.get(e.targetPremiseId)!).push(e);
    }
  }

  // Recursive support with memo
  const memo = new Map<string, { score:number, bel?:number, pl?:number, explain?:any }>();
  const prior = 0.5; // neutral prior for leaf claims (can be parameterized)

  function combineChains(chains:number[]): number {
    if (!chains.length) return 0;
    if (mode === 'min') return Math.max(...chains);               // best single line
    // noisy-OR for independent lines
    const prodNot = chains.reduce((p, s) => p * (1 - s), 1);
    return 1 - prodNot;
  }

  function dsCombine(bels:number[]): { bel:number, pl:number } {
    // light-weight DS: combine independent masses on {φ}, {Θ};
    // treat each line score s => m({φ})=s, m({Θ})=1-s; Dempster's rule on binary frame.
    let mBel = 0, mIgn = 1; // start with vacuous mass
    for (const s of bels) {
      const a = s, aIgn = 1 - s;
      const conflict = 0; // binary positive-only evidence; no direct support for ¬φ here
      const k = 1 - conflict;
      const newBel = (mBel*a + mBel*aIgn + mIgn*a) / (k || 1);
      const newIgn = (mIgn*aIgn) / (k || 1);
      mBel = newBel; mIgn = newIgn;
    }
    const bel = mBel;
    const pl = 1 - 0; // no explicit mass on ¬φ in this first cut
    return { bel: Math.max(0, Math.min(1, bel)), pl: Math.max(bel, Math.min(1, pl)) };
  }

  function supportClaim(claimId: string): { score:number, bel?:number, pl?:number, explain?:any } {
    const cached = memo.get(claimId);
    if (cached) return cached;

    const supporters = argsByConclusion.get(claimId) ?? [];
    if (!supporters.length) {
      const leaf = { score: prior, bel: prior, pl: 1, explain: { kind:'leaf', prior } };
      memo.set(claimId, leaf); return leaf;
    }

    const chainScores:number[] = [];
    const chainExpls:any[] = [];

    for (const a of supporters) {
      // premise aggregation
      const premSupports = a.premises.map((p:any) => supportClaim(p.claimId).score);
      const premMin = premSupports.length ? Math.min(...premSupports) : prior;
      const premProd = premSupports.length ? premSupports.reduce((x,y)=>x*y,1) : prior;
      let chain =
        mode === 'min'  ? premMin :
        mode === 'prod' ? premProd : premMin; // DS uses premMin inside, combine at top

      // undercuts to this argument reduce chain strength
      const u = undercutsByArg.get(a.id) ?? [];
      if (u.length) {
        // crude: treat each undercut as independent defeat with strength = average of its own conclusion supports if available
        const defeat = Math.max(0, Math.min(1, 1 - (1 - 0.4) ** u.length)); // fallback hedge if we can’t resolve attacker strengths
        chain = chain * (1 - defeat);
      }

      // undermines to specific premises reduce that premise before aggregation (already implicit if we computed prem supports);
      // (optional) could downweight premSupports where undermines exist.

      chainScores.push(chain);
      if (explain) chainExpls.push({ argumentId: a.id, premises: a.premises.map((p:any)=>({ id:p.claimId, s: supportClaim(p.claimId).score })), chain });
    }

    // combine multiple lines
    const score = mode === 'ds'
      ? dsCombine(chainScores).bel
      : combineChains(chainScores);

    // rebut attacks (to the conclusion) down‑adjust
    const rebuts = rebutByClaim.get(claimId) ?? [];
    if (rebuts.length) {
      // Estimate counter strength as the combined support of the counterclaims (if their args present), else hedge 0.4
      const counter = 1 - (1 - 0.4) ** rebuts.length;
      const adjusted = score * (1 - counter);
      const result = { score: adjusted, explain: explain ? { lines: chainExpls, rebutCount: rebuts.length, preRebut: score } : undefined };
      memo.set(claimId, result); return result;
    }

    const result = mode === 'ds'
      ? { score, ...dsCombine(chainScores), explain: explain ? { lines: chainExpls } : undefined }
      : { score, explain: explain ? { lines: chainExpls } : undefined };

    memo.set(claimId, result);
    return result;
  }

  const claimItems = claims.map(c => {
    const s = supportClaim(c.id);
    const accepted = (s.score ?? s.bel ?? 0) >= tau;
    return { id: c.id, text: c.text ?? '', score: s.score, bel: s.bel, pl: s.pl, accepted, explain: explain ? s.explain : undefined };
  });

  return NextResponse.json({ ok:true, mode, tau, items: claimItems }, { headers: { 'Cache-Control':'no-store' }});
}
