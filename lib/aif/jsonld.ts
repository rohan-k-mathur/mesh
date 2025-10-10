import ctx from "@/lib/aif/context.json";
import { prisma } from "@/lib/prismaclient";

/**
 * Build a JSON-LD @graph for a set of arguments (and their local neighborhood)
 * Emits I (claims), RA (arguments), CA (conflicts), PA (preferences), plus L (locutions, optional).
 */
export async function buildAifGraphJSONLD(opts: {
  deliberationId?: string;
  argumentIds?: string[];        // if omitted + deliberationId set, we export all
  includeLocutions?: boolean;    // default false
}) {
  const { deliberationId, argumentIds = [], includeLocutions = false } = opts;

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

  // I-nodes (claims)
  for (const c of claims) {
    const id = `I:${c.id}`;
    if (!seen.has(id)) {
      N.push({ "@id": id, "@type": "aif:InformationNode", "aif:text": textByClaimId.get(c.id) ?? "" });
      seen.add(id);
    }
  }

  // RA-nodes (arguments) + premise/conclusion edges
  for (const a of args) {
    const sId = `S:${a.id}`;
    if (!seen.has(sId)) {
      N.push({
        "@id": sId,
        "@type": "aif:RA",
        "aif:usesScheme": a.scheme?.key ?? null,
        "aif:name": a.scheme?.name ?? null
      });
      seen.add(sId);
    }

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
      if (!seen.has(toId)) {
        N.push({ "@id": toId, "@type": "aif:InformationNode", "aif:text": textByClaimId.get(a.conclusionClaimId) ?? "" });
        seen.add(toId);
      }
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
          "aif:text": String(m?.payload?.expression ?? m?.payload?.note ?? ""),
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

  return { "@context": ctx["@context"], "@graph": N };
}
