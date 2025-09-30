import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';    
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Q = z.object({
  mode: z.enum(['min','product']).default('product'),   // confidence measure
  supportDefense: z.coerce.boolean().default(true),     // optional AF propagation
  includeContributors: z.coerce.boolean().default(true)
});

type Contributor = {
  argumentId: string;
  text: string;
  atomic: boolean;
  chainStrength: number; // composed along premises (compose)
  leafStrength: number;  // ArgumentSupport.strength (for this mode)
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const u = new URL(req.url);
  const parsed = Q.safeParse({
    mode: u.searchParams.get('mode') ?? undefined,
    supportDefense: u.searchParams.get('supportDefense') ?? undefined,
    includeContributors: u.searchParams.get('includeContributors') ?? undefined
  });
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  const { mode, includeContributors } = parsed.data;

  // Claims in room
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    select: { id: true, text: true }
  });
  const claimIds = claims.map(c => c.id);

  // Base strengths from ArgumentSupport (hom(I, φ))
  const supRows = await prisma.argumentSupport.findMany({
    where: { deliberationId, claimId: { in: claimIds }, mode },
    select: { claimId: true, argumentId: true, strength: true, composed: true }
  });

  // Argument texts
  const argIds = Array.from(new Set(supRows.map((r: { argumentId: any; }) => r.argumentId)));
  const argBy = new Map<string, string>(
    (await prisma.argument.findMany({
      where: { id: { in: argIds } }, select: { id: true, text: true }
    })).map(a => [a.id, typeof a.text === "string" ? a.text : ""])
  );

  // Build premise graph to compute chainStrength (compose)
  const edges = await prisma.argumentEdge.findMany({
    where: { toArgumentId: { in: argIds }, type: { in: ['support','undercut','rebut'] } },
    select: { fromArgumentId:true, toArgumentId:true, type:true }
  });
  const inSup = new Map<string, string[]>(); // arg <- premises[]
  for (const e of edges) if (e.type === 'support') {
    (inSup.get(e.toArgumentId) ?? inSup.set(e.toArgumentId, []).get(e.toArgumentId)!).push(e.fromArgumentId);
  }
  const isAtomic = (aId: string) => !(inSup.get(aId)?.length);

  // Map: claimId -> contributors[]
  const contribBy = new Map<string, Contributor[]>();
  for (const r of supRows) {
    // Compose (chain) = min/product along premises if you want a deeper traversal.
    // For now, we use a single-hop DAG fold: atomic => leaf; non-atomic => min/product of its direct supporters if present.
    const visited = new Set<string>();
    const compose = (aId: string): number => {
      if (visited.has(aId)) return 1; // break cycles defensively
      visited.add(aId);
      const kids = inSup.get(aId) || [];
      if (!kids.length) return r.strength; // atomic leaf strength for this mode
      const vals = kids.map(k => compose(k));
      return mode === 'min'
        ? Math.min(r.strength, ...vals)      // weakest link
        : r.strength * vals.reduce((p, x) => p * x, 1); // product chain
    };

    const c: Contributor = {
      argumentId: r.argumentId,
      text: argBy.get(r.argumentId) || '',
      atomic: isAtomic(r.argumentId),
      chainStrength: compose(r.argumentId),
      leafStrength: r.strength
    };
    (contribBy.get(r.claimId) ?? contribBy.set(r.claimId, []).get(r.claimId)!).push(c);
  }

  // JOIN (aggregate multiple contributors to φ)
  const join = (xs: number[]): number => {
    if (!xs.length) return 0;
    return mode === 'min'
      ? Math.max(...xs)                         // skeptical: best line
      : 1 - xs.reduce((p, x) => p * (1 - x), 1); // probabilistic sum (OR)
  };

  const out = claims.map(c => {
    const cs = contribBy.get(c.id) || [];
    const score = join(cs.map(x => x.chainStrength));
    return {
      claimId: c.id, text: c.text, mode, score,
      contributors: includeContributors
        ? cs.sort((a,b) => b.chainStrength - a.chainStrength).slice(0, 12)
        : undefined
    };
  });

  return NextResponse.json({ ok: true, mode, items: out, version: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
}
