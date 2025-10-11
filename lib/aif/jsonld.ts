// lib/aif/jsonld.ts

import ctx from "@/lib/aif/context.json";
import { prisma } from "@/lib/prismaclient";
import { TargetType } from "@prisma/client";
/**
 * Build a JSON-LD @graph for a set of arguments (and their local neighborhood)
 * Emits I (claims), RA (arguments), CA (conflicts), PA (preferences), plus L (locutions, optional).
 */
export async function buildAifGraphJSONLD(opts: {
  deliberationId?: string;
  argumentIds?: string[];        // if omitted + deliberationId set, we export all
  includeLocutions?: boolean;    // default false
  includeCQs?: boolean;           
  
}) {
const { deliberationId, argumentIds = [], includeLocutions = false, includeCQs = false } = opts;

  // 1) Pull arguments (scoped)
  const args = await prisma.argument.findMany({
    where: {
      ...(deliberationId ? { deliberationId } : {}),
      ...(argumentIds.length ? { id: { in: argumentIds } } : {}),
    },
    include: {
      scheme: { select: { key: true, name: true } },
      premises: true,
    },
  });

  // If ids not provided, materialize all arg ids in this deliberation
  const argIds = (argumentIds.length ? argumentIds : args.map(a => a.id));

  // 2) Batch claims referenced by RAs (conclusions + premises)
  const claimIds = Array.from(new Set([
    ...args.map(a => a.conclusionClaimId).filter(Boolean) as string[],
    ...args.flatMap(a => a.premises.map(p => p.claimId)),
  ]));
  const claims = claimIds.length
    ? await prisma.claim.findMany({ where: { id: { in: claimIds } }, select: { id:true, text:true } })
    : [];
  const textByClaimId = new Map(claims.map(c => [c.id, c.text || ""]));

  // 3) CA (conflict) nodes via ConflictApplication (first-class) + legacy ArgumentEdge mapping
  const caRows = await prisma.conflictApplication.findMany({
    where: {
      OR: [
        { conflictedArgumentId: { in: argIds } },
        { conflictingArgumentId: { in: argIds } },
        { conflictedClaimId: { in: claimIds } },
        { conflictingClaimId: { in: claimIds } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  // 4) PA (preference) nodes
  const paRows = await prisma.preferenceApplication.findMany({
    where: {
      OR: [
        { preferredArgumentId: { in: argIds } },
        { dispreferredArgumentId: { in: argIds } },
        { preferredClaimId: { in: claimIds } },
        { dispreferredClaimId: { in: claimIds } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  // 5) Optional locutions (L-nodes)
  const locs = includeLocutions && deliberationId
    ? await prisma.dialogueMove.findMany({
        where: { deliberationId },
        select: { id:true, kind:true, authorId:true, payload:true, targetType:true, targetId:true, replyToMoveId:true, argumentId:true, createdAt:true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  // ---------- JSON-LD assembly ----------
  const N: any[] = [];   // @graph items (nodes + edge resources)
  const seen = new Set<string>();
 const pushOnce = (o:any) => { const id=o['@id']; if (id && seen.has(id)) return; if (id) seen.add(id); N.push(o); };

  // I-nodes (claims)
  for (const c of claims) {
    const id = `I:${c.id}`;
       pushOnce({ "@id": id, "@type": "aif:InformationNode", "aif:text": textByClaimId.get(c.id) ?? "" });

  }

  // RA-nodes (arguments) + premise/conclusion edges
  for (const a of args) {
    const sId = `S:${a.id}`;
     pushOnce({
       "@id": sId,
       // Keep canonical RA type, but also allow a scheme type (as:<key>) for consumers
       "@type": ["aif:RA"].concat(a.scheme?.key ? [`as:${a.scheme.key}`] : []),
       "aif:usesScheme": a.scheme?.key ?? null,
       "aif:name": a.scheme?.name ?? null,
       "as:appliesSchemeKey": a.scheme?.key ?? null
     });

    // premises: I → RA
    for (const p of a.premises) {
      const from = `I:${p.claimId}`, to = sId;
      N.push({ "@type": "aif:Premise", "aif:from": from, "aif:to": to });
      if (!seen.has(from)) {
        // In case premises include a claim not in claimIds (paranoia)
        N.push({ "@id": from, "@type": "aif:InformationNode", "aif:text": textByClaimId.get(p.claimId) ?? "" });
        seen.add(from);
      }
    }

    // conclusion: RA → I
    if (a.conclusionClaimId) {
      const to = `I:${a.conclusionClaimId}`;
      N.push({ "@type": "aif:Conclusion", "aif:from": sId, "aif:to": to });
      const toId = `I:${a.conclusionClaimId}`;
      pushOnce({ "@id": toId, "@type": "aif:InformationNode", "aif:text": textByClaimId.get(a.conclusionClaimId) ?? "" });
     }
    }
  

  // CA-nodes (conflict applications): conflicting → CA → conflicted
  for (const c of caRows) {
    const caId = `CA:${c.id}`;
    if (!seen.has(caId)) {
      N.push({ "@id": caId, "@type": "aif:CA", "aif:usesScheme": c.schemeId ?? null });
      seen.add(caId);
    }
    // conflict left
    if (c.conflictingArgumentId) {
      N.push({ "@type":"aif:ConflictingElement", "aif:from": `S:${c.conflictingArgumentId}`, "aif:to": caId });
    } else if (c.conflictingClaimId) {
      N.push({ "@type":"aif:ConflictingElement", "aif:from": `I:${c.conflictingClaimId}`, "aif:to": caId });
    }
    // conflict right
    if (c.conflictedArgumentId) {
      N.push({ "@type":"aif:ConflictedElement", "aif:from": caId, "aif:to": `S:${c.conflictedArgumentId}` });
    } else if (c.conflictedClaimId) {
      N.push({ "@type":"aif:ConflictedElement", "aif:from": caId, "aif:to": `I:${c.conflictedClaimId}` });
    }
  }

  // PA-nodes (preference applications): preferred → PA → dispreferred
  for (const p of paRows) {
    const paId = `PA:${p.id}`;
    if (!seen.has(paId)) {
      N.push({ "@id": paId, "@type": "aif:PA", "aif:usesScheme": p.schemeId ?? null });
      seen.add(paId);
    }
    // preferred element
    if (p.preferredArgumentId) {
      N.push({ "@type":"aif:PreferredElement", "aif:from": `S:${p.preferredArgumentId}`, "aif:to": paId });
    } else if (p.preferredClaimId) {
      N.push({ "@type":"aif:PreferredElement", "aif:from": `I:${p.preferredClaimId}`, "aif:to": paId });
    }
    // dispreferred element
    if (p.dispreferredArgumentId) {
      N.push({ "@type":"aif:DispreferredElement", "aif:from": paId, "aif:to": `S:${p.dispreferredArgumentId}` });
    } else if (p.dispreferredClaimId) {
      N.push({ "@type":"aif:DispreferredElement", "aif:from": paId, "aif:to": `I:${p.dispreferredClaimId}` });
    }
  }

  // L-nodes (locutions) with YA/TA projection (optional)
  if (includeLocutions) {
    for (const m of locs) {
      const lId = `L:${m.id}`;
      if (!seen.has(lId)) {
        N.push({
          "@id": lId, "@type": "aif:L",
          "aif:text": typeof m?.payload === "object" && m?.payload !== null
            ? String((m.payload as Record<string, any>).expression ?? (m.payload as Record<string, any>).note ?? "")
            : String(m?.payload ?? ""),
          "aif:illocution": m.kind ?? null, "aif:author": m.authorId ?? null
        });
        seen.add(lId);
      }
      if (m.argumentId || (m.targetType === "argument" && m.targetId)) {
        N.push({ "@type":"aif:illocutes", "aif:from": lId, "aif:to": `S:${m.argumentId ?? m.targetId}` });
      } else if (m.targetType === "claim" && m.targetId) {
        N.push({ "@type":"aif:illocutes", "aif:from": lId, "aif:to": `I:${m.targetId}` });
      }
      if (m.replyToMoveId) {
        N.push({ "@type":"aif:replies", "aif:from": `L:${m.replyToMoveId}`, "aif:to": lId });
      }
    }
  }
  // ---- Critical Questions (optional export) ----
  if (includeCQs && args.length) {
    const cqStatuses = await prisma.cQStatus.findMany({
      where: {
        OR: [
              { argumentId: { in: args.map(a => a.id) } },
          { targetType: 'argument' as TargetType, targetId: { in: args.map(a => a.id) } },
        ],
      },
      select: { argumentId: true, targetId: true, targetType: true, schemeKey: true, cqKey: true, status: true }
    });
    const statusByArg = new Map<string, Array<{schemeKey:string, cqKey:string, status:string}>>();
    for (const s of cqStatuses) {
      const k = s.argumentId || (s.targetType === 'argument' as TargetType ? s.targetId : null);
      if (!k) continue;
      const arr = statusByArg.get(k) || [];
      arr.push({ schemeKey: s.schemeKey, cqKey: s.cqKey, status: s.status || 'open' });
      statusByArg.set(k, arr);
    }
    for (const a of args) {
      const sId = `S:${a.id}`;
      const items = statusByArg.get(a.id) || [];
      for (const it of items) {
        const qId = `CQ:${a.id}:${it.cqKey}`;
        pushOnce({ "@id": qId, "@type": "cq:CriticalQuestion", "cq:key": it.cqKey, "cq:status": it.status });
        N.push({ "@type": "as:hasCriticalQuestion", "aif:from": sId, "aif:to": qId });
      }
    }
  }

  return { "@context": ctx["@context"], "@graph": N };
}
