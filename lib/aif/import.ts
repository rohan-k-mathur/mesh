// lib/aif/import.ts
import { prisma } from '@/lib/prismaclient';

async function ensureArgumentForClaim(deliberationId: string, claimId: string) {
  const existing = await prisma.argument.findFirst({ where: { deliberationId, conclusionClaimId: claimId } });
  if (existing) return existing.id;
  const a = await prisma.argument.create({
    data: { deliberationId, authorId: 'importer', text: '', conclusionClaimId: claimId, implicitWarrant: { imported: true } }
  });
  await prisma.argumentPremise.create({
    data: { argumentId: a.id, claimId, isImplicit: true }
  });
  return a.id;
}

export async function importAifJSONLD(deliberationId: string, graph: any) {
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  const nodeById = new Map(nodes.map((n:any) => [n['@id'], n]));
  const typeOf = (id: string) => nodeById.get(id)?.['@type'];
  const textOf = (id: string) => nodeById.get(id)?.text ?? '';

  const I_nodes  = nodes.filter((n:any) => n['@type'] === 'aif:InformationNode');
  const RA_nodes = nodes.filter((n:any) => n['@type'] === 'aif:RA');
  const CA_nodes = nodes.filter((n:any) => n['@type'] === 'aif:CA');

  const claimIdMap = new Map<string,string>();
  for (const n of I_nodes) {
    const c = await prisma.claim.create({ data: { deliberationId, text: String(n.text ?? '').trim(), createdById: "importer" }});
    claimIdMap.set(n['@id'], c.id);
  }

  const premisesToRA = edges.filter((e:any) => String(e.role).endsWith('Premise'));
  const raToConc     = edges.filter((e:any) => String(e.role).endsWith('Conclusion'));
  const attacks      = edges.filter((e:any) => String(e.role).endsWith('Attacks'));

  const raIdMap = new Map<string,string>();
  for (const s of RA_nodes) {
    const sid = s['@id'];
    const concI = raToConc.find((e:any) => e.from===sid)?.to;
    if (!concI) continue;
    const premiseIs = premisesToRA.filter((e:any)=>e.to===sid).map((e:any)=>e.from);
    const a = await prisma.argument.create({
      data: { deliberationId, authorId: 'importer', text: '', schemeId: null, conclusionClaimId: claimIdMap.get(concI)! }
    });
    if (premiseIs.length) {
      await prisma.argumentPremise.createMany({
        data: premiseIs.map((Iid:string)=>({ argumentId: a.id, claimId: claimIdMap.get(Iid)!, isImplicit:false }))
      });
    }
    raIdMap.set(sid, a.id);
  }

  for (const ca of CA_nodes) {
    const caId = ca['@id'];
    const attackerI = edges.find((e:any)=>e.to===caId && String(e.role).endsWith('Premise'))?.from;
    if (!attackerI) continue;
    const attackerArgId = await ensureArgumentForClaim(deliberationId, claimIdMap.get(attackerI)!);

    const tgt = attacks.find((e:any)=>e.from===caId);
    if (!tgt) continue;

    const tgtType = typeOf(tgt.to);
    if (tgtType === 'aif:RA') {
      await prisma.argumentEdge.create({
        data: {
          deliberationId, fromArgumentId: attackerArgId, toArgumentId: raIdMap.get(tgt.to)!,
          attackType: 'UNDERCUTS', targetScope: 'inference', createdById: 'importer'
        }
      });
    } else if (tgtType === 'aif:InformationNode') {
      const cid = claimIdMap.get(tgt.to)!;
      const host = premisesToRA.find((e:any) => e.from === tgt.to);
      if (host) {
        await prisma.argumentEdge.create({
          data: {
            deliberationId, fromArgumentId: attackerArgId, toArgumentId: raIdMap.get(host.to)!,
            attackType: 'UNDERMINES', targetScope: 'premise', targetPremiseId: cid, createdById: 'importer'
          }
        });
      } else {
        await prisma.argumentEdge.create({
          data: {
            deliberationId, fromArgumentId: attackerArgId, toArgumentId: attackerArgId,
            attackType: 'REBUTS', targetScope: 'conclusion', targetClaimId: cid, createdById: 'importer'
          }
        });
      }
    }
  }

  // (Optional) import L-nodes later (YA/TA)
  return { ok:true };
}
