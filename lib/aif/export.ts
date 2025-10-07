// lib/aif/export.ts
import ctx from './context.json';
import { prisma } from '@/lib/prismaclient';

export async function exportDeliberationAsAifJSONLD(deliberationId: string) {
  const [claims, args, edges, moves] = await Promise.all([
    prisma.claim.findMany({ where: { deliberationId } }),
    prisma.argument.findMany({ where: { deliberationId }, include: { scheme: true, premises: true } }),
    prisma.argumentEdge.findMany({ where: { deliberationId } }),
    prisma.dialogueMove.findMany({ where: { deliberationId } })
  ]);

  const N:any[] = [];
  const E:any[] = [];

  // I-nodes
  for (const c of claims)
    N.push({ "@id": `I:${c.id}`, "@type": "aif:InformationNode", "text": c.text });

  // RA-nodes
  for (const a of args) {
    N.push({ "@id": `S:${a.id}`, "@type": "aif:RA", "usesScheme": a.scheme?.key ?? null });
    for (const p of a.premises) E.push({ "from": `I:${p.claimId}`, "to": `S:${a.id}`, "role": "aif:Premise" });
    E.push({ "from": `S:${a.id}`, "to": `I:${a.conclusionClaimId}`, "role": "aif:Conclusion" });
  }

  // CA “nodes” (one per ArgumentEdge)
  for (const e of edges) {
    const caId = `CA:${e.id}`;
    N.push({
      "@id": caId, "@type": "aif:CA",
      "attackType": e.attackType, "targetScope": e.targetScope, "cqKey": e.cqKey ?? null
    });
    const attacker = args.find(a => a.id === e.fromArgumentId)!;
    E.push({ "from": `I:${attacker.conclusionClaimId}`, "to": caId, "role": "aif:Premise" });

    if (e.targetScope === 'conclusion' && e.targetClaimId)
      E.push({ "from": caId, "to": `I:${e.targetClaimId}`, "role": "aif:Attacks" });
    else if (e.targetScope === 'inference')
      E.push({ "from": caId, "to": `S:${e.toArgumentId}`, "role": "aif:Attacks" });
    else if (e.targetScope === 'premise' && e.targetPremiseId)
      E.push({ "from": caId, "to": `I:${e.targetPremiseId}`, "role": "aif:Attacks" });
  }

  // L-nodes
  for (const m of moves) {
    N.push({ "@id": `L:${m.id}`, "@type": "aif:L", "illocution": m.illocution, "text": (m as any)?.payload?.expression ?? null });
    if (m.argumentId)    E.push({ "from": `L:${m.id}`, "to": `S:${m.argumentId}`,   "role": "aif:Illocutes" });
    if (m.contentClaimId)E.push({ "from": `L:${m.id}`, "to": `I:${m.contentClaimId}`, "role": "aif:Illocutes" });
    if (m.replyToMoveId) E.push({ "from": `L:${m.replyToMoveId}`, "to": `L:${m.id}`, "role": "aif:Replies" });
  }

  return { "@context": ctx["@context"], "nodes": N, "edges": E };
}
