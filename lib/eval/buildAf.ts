// lib/eval/buildAf.ts
import { prisma } from '@/lib/prismaclient';

export async function buildAF(deliberationId: string) {
  const [args, edges] = await Promise.all([
    prisma.argument.findMany({ where: { deliberationId }, include: { premises: true } }),
    prisma.argumentEdge.findMany({ where: { deliberationId } }),
  ]);

  const nodes = args.map(a => a.id);

  const byConclusion = new Map<string,string[]>(
    Object.entries(args.reduce((m:any,a)=>((m[a.conclusionClaimId]??=[]).push(a.id), m), {}))
  );
  const usesPrem = new Map<string,string[]>(
    Object.entries(args.reduce((m:any,a)=>{ for (const p of a.premises) (m[p.claimId]??=[]).push(a.id); return m; }, {}))
  );

  const attacks: [string,string][] = [];
  for (const e of edges) {
    if (e.targetScope === 'inference' && e.toArgumentId)
      attacks.push([e.fromArgumentId, e.toArgumentId]); // undercut RA
    else if (e.targetScope === 'premise' && e.targetPremiseId)
      for (const host of (usesPrem.get(e.targetPremiseId) ?? [])) attacks.push([e.fromArgumentId, host]); // undermine → all RAs using that premise
    else if (e.targetScope === 'conclusion' && e.targetClaimId)
      for (const host of (byConclusion.get(e.targetClaimId) ?? [])) attacks.push([e.fromArgumentId, host]); // rebut → all RAs concluding that claim
  }
  return { nodes, attacks };
}
