// lib/aif/import.ts
import { prisma } from '@/lib/prismaclient';

async function ensureArgumentForClaim(deliberationId: string, claimId: string) {
  const existing = await prisma.argument.findFirst({
    where: { deliberationId, conclusionClaimId: claimId }
  });
  if (existing) return existing.id;

  const a = await prisma.argument.create({
    data: {
      deliberationId, authorId: 'importer', text: '',
      conclusionClaimId: claimId, implicitWarrant: { imported: true }
    }
  });
  await prisma.argumentPremise.create({
    data: { argumentId: a.id, claimId, isImplicit: true }
  });
  return a.id;
}

/** Import minimal AIF JSON-LD produced by our exporter. */
export async function importAifJSONLD(deliberationId: string, graph: any) {
  const nodeById = new Map(graph.nodes.map((n:any) => [n['@id'], n]));
  const typeOf = (id: string) => nodeById.get(id)?.['@type'];
  const I_nodes = graph.nodes.filter((n:any) => n['@type'] === 'aif:InformationNode');
  const RA_nodes = graph.nodes.filter((n:any) => n['@type'] === 'aif:RA');
  const CA_nodes = graph.nodes.filter((n:any) => n['@type'] === 'aif:CA');
  const edges = graph.edges ?? [];

  const prem = edges.filter((e:any) => e.role?.endsWith('Premise'));
  const conc = edges.filter((e:any) => e.role?.endsWith('Conclusion'));
  const attk = edges.filter((e:any) => e.role?.endsWith('Attacks'));

  // 1) Claims
  const claimMap = new Map<string,string>();
  for (const n of I_nodes) {
    const c = await prisma.claim.create({
      data: { deliberationId, text: (n.text ?? '').trim(), createdById: "importer" }
    });
    claimMap.set(n['@id'], c.id);
  }

  // 2) Arguments (RA)
  const raMap = new Map<string,string>();
  for (const s of RA_nodes) {
    const sid = s['@id'];
    const cI = conc.find((e:any) => e.from === sid)?.to;
    if (!cI) continue;
    const pIs = prem.filter((e:any) => e.to === sid).map((e:any) => e.from);
    const a = await prisma.argument.create({
      data: {
        deliberationId, authorId: 'importer', text: '',
        schemeId: null, conclusionClaimId: claimMap.get(cI)!,
      }
    });
    if (pIs.length) {
      await prisma.argumentPremise.createMany({
        data: pIs.map((Iid:string) => ({
          argumentId: a.id, claimId: claimMap.get(Iid)!, isImplicit: false
        })),
        skipDuplicates: true
      });
    }
    raMap.set(sid, a.id);
  }

  // 3) Attacks (CA)
  for (const ca of CA_nodes) {
    const caId = ca['@id'];
    const attackerI = edges.find((e:any)=> e.to === caId && e.role?.endsWith('Premise'))?.from;
    if (!attackerI) continue;
    const attackerArgId = await ensureArgumentForClaim(deliberationId, claimMap.get(attackerI)!);

    const tgt = attk.find((e:any)=> e.from === caId);
    if (!tgt) continue;
    const tType = typeOf(tgt.to);

    if (tType === 'aif:RA') {
      await prisma.argumentEdge.create({
        data: {
          deliberationId,
          fromArgumentId: attackerArgId,
          toArgumentId: raMap.get(tgt.to)!,
          attackType: 'UNDERCUTS', targetScope: 'inference',
          createdById: 'importer',
        }
      });
    } else if (tType === 'aif:InformationNode') {
      const cid = claimMap.get(tgt.to)!;
      const isPremOf = prem.find((e:any) => e.from === tgt.to);
      if (isPremOf) {
        await prisma.argumentEdge.create({
          data: {
            deliberationId,
            fromArgumentId: attackerArgId,
            toArgumentId: raMap.get(isPremOf.to)!,
            attackType: 'UNDERMINES', targetScope: 'premise',
            targetPremiseId: cid, createdById: 'importer',
          }
        });
      } else {
        await prisma.argumentEdge.create({
          data: {
            deliberationId,
            fromArgumentId: attackerArgId,
            toArgumentId: attackerArgId,
            attackType: 'REBUTS', targetScope: 'conclusion',
            targetClaimId: cid, createdById: 'importer',
          }
        });
      }
    }
  }

  return { ok: true };
}
