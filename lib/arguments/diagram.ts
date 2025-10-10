 import { prisma } from "../prismaclient";
 
 export type Diagram = {
   id: string;
   title?: string | null;
   statements: Array<{ id: string; text: string; kind: 'claim'|'premise'|'warrant'|'backing'|'rebuttal'|'statement' }>;
   inferences: Array<{
     id: string;
     kind?: string | null;
     conclusion: { id: string; text: string };
     premises: Array<{ statement: { id: string; text: string } }>;
     scheme?: string | null;
   }>;
   evidence: Array<{ id: string; uri: string; note?: string | null }>;
   // NEW: an AIF-true view of the same neighbourhood (non-breaking addition)
   aif?: AifSubgraph;
 };

 // ---------- AIF nodes/edges ----------
 export type AifNodeKind = 'I'|'RA'|'CA'|'PA';
export type AifEdgeRole =
  | 'premise' | 'conclusion'
  | 'conflictingElement' | 'conflictedElement'
  | 'preferredElement'  | 'dispreferredElement';

export type AifNode = {
  id: string;                // e.g., "I:claimId", "RA:argId", "CA:caId", "PA:paId"
  kind: AifNodeKind;
  label?: string | null;     // human label (claim text, "RA a123…", etc.)
  schemeKey?: string | null; // optional: scheme typing for RA/CA/PA (if available)
};
export type AifEdge = { id: string; from: string; to: string; role: AifEdgeRole };
export type AifSubgraph = { nodes: AifNode[]; edges: AifEdge[] };


// Small helpers
const I = (claimId: string) => `I:${claimId}`;
const RA = (argId: string)   => `RA:${argId}`;
const CA = (caId: string)    => `CA:${caId}`;
const PA = (paId: string)    => `PA:${paId}`;

/** Build a local AIF subgraph centered on the given RA (argument). */
export async function buildAifSubgraphForArgument(argumentId: string): Promise<AifSubgraph|null> {
  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: {
      id: true, text: true, schemeId: true,
      conclusionClaimId: true,
      premises: { select: { claimId: true, isImplicit: true } },
      deliberationId: true
    }
  });
  if (!arg) return null;

  const claimIds = Array.from(new Set([
    ...(arg.conclusionClaimId ? [arg.conclusionClaimId] : []),
    ...arg.premises.map(p => p.claimId),
  ]));
  const claims = claimIds.length
    ? await prisma.claim.findMany({ where: { id: { in: claimIds } }, select: { id: true, text: true } })
    : [];
  const labelOf = new Map(claims.map(c => [c.id, c.text || c.id]));

  // Base RA slice
  const nodes: AifNode[] = [
    { id: RA(arg.id), kind: 'RA', label: arg.text || `Argument ${arg.id.slice(0,8)}…` }
  ];
  const edges: AifEdge[] = [];
  if (arg.conclusionClaimId) {
    nodes.push({ id: I(arg.conclusionClaimId), kind: 'I', label: labelOf.get(arg.conclusionClaimId) ?? arg.conclusionClaimId });
    edges.push({ id: `e:${arg.id}:concl`, from: RA(arg.id), to: I(arg.conclusionClaimId), role: 'conclusion' });
  }
  for (const p of arg.premises) {
    nodes.push({ id: I(p.claimId), kind: 'I', label: labelOf.get(p.claimId) ?? p.claimId });
    edges.push({ id: `e:${arg.id}:prem:${p.claimId}`, from: I(p.claimId), to: RA(arg.id), role: 'premise' });
  }

  // Conflicts (CA) that touch this argument or its (conclusion/premises)
  const touchingClaimIds = new Set(claimIds);
  const cas = await prisma.conflictApplication.findMany({
    where: {
      deliberationId: arg.deliberationId,
      OR: [
        { conflictedArgumentId: arg.id },
        { conflictedClaimId: { in: claimIds } },
        { conflictingArgumentId: arg.id }, // include symmetric view if present
        { conflictingClaimId: { in: claimIds } },
      ]
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, schemeId: true,
      conflictingArgumentId: true, conflictingClaimId: true,
      conflictedArgumentId: true,  conflictedClaimId: true,
      legacyAttackType: true, legacyTargetScope: true
    }
  });
  for (const c of cas) {
    const caId = CA(c.id);
    nodes.push({ id: caId, kind: 'CA', label: c.legacyAttackType ?? 'CA', schemeKey: null });
    // left side (conflicting)
    if (c.conflictingArgumentId) {
      nodes.push({ id: RA(c.conflictingArgumentId), kind: 'RA', label: `Argument ${c.conflictingArgumentId.slice(0,8)}…` });
      edges.push({ id:`e:${c.id}:confA`, from: RA(c.conflictingArgumentId), to: caId, role:'conflictingElement' });
    } else if (c.conflictingClaimId) {
      if (!touchingClaimIds.has(c.conflictingClaimId)) {
        const cl = await prisma.claim.findUnique({ where:{ id: c.conflictingClaimId }, select:{ id:true, text:true } });
        if (cl) nodes.push({ id: I(cl.id), kind:'I', label: cl.text || cl.id });
      }
      edges.push({ id:`e:${c.id}:confI`, from: I(c.conflictingClaimId!), to: caId, role:'conflictingElement' });
    }
    // right side (conflicted)
    if (c.conflictedArgumentId) {
      edges.push({ id:`e:${c.id}:tgtA`, from: caId, to: RA(c.conflictedArgumentId), role:'conflictedElement' });
    } else if (c.conflictedClaimId) {
        // ensure node exists
      if (!nodes.some(n => n.id === I(c.conflictedClaimId!))) {
        const cl = await prisma.claim.findUnique({ where:{ id: c.conflictedClaimId! }, select:{ id:true, text:true } });
        if (cl) nodes.push({ id: I(cl.id), kind:'I', label: cl.text || cl.id });
      }
      edges.push({ id:`e:${c.id}:tgtI`, from: caId, to: I(c.conflictedClaimId!), role:'conflictedElement' });
    }
  }

  // Preferences (PA) that touch this argument or its conclusion/premises
  const pas = await prisma.preferenceApplication.findMany({
    where: {
      deliberationId: arg.deliberationId,
      OR: [
        { preferredArgumentId: arg.id }, { dispreferredArgumentId: arg.id },
        ...(arg.conclusionClaimId ? [{ preferredClaimId: arg.conclusionClaimId }, { dispreferredClaimId: arg.conclusionClaimId }] : []),
        ...(arg.premises.length ? [{ preferredClaimId: { in: claimIds } }, { dispreferredClaimId: { in: claimIds } }] : [])
      ]
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id:true, schemeId:true,
      preferredArgumentId:true, dispreferredArgumentId:true,
      preferredClaimId:true,    dispreferredClaimId:true
    }
  });
  for (const p of pas) {
    const paId = PA(p.id);
    nodes.push({ id: paId, kind: 'PA', label: 'PA', schemeKey: null });
    // preferred
    if (p.preferredArgumentId) {
      nodes.push({ id: RA(p.preferredArgumentId), kind:'RA', label:`Argument ${p.preferredArgumentId.slice(0,8)}…` });
      edges.push({ id:`e:${p.id}:prefA`, from: RA(p.preferredArgumentId), to: paId, role:'preferredElement' });
    } else if (p.preferredClaimId) {
      if (!nodes.some(n => n.id === I(p.preferredClaimId!))) {
        const cl = await prisma.claim.findUnique({ where:{ id: p.preferredClaimId! }, select:{ id:true, text:true } });
        if (cl) nodes.push({ id: I(cl.id), kind:'I', label: cl.text || cl.id });
      }
      edges.push({ id:`e:${p.id}:prefI`, from: I(p.preferredClaimId!), to: paId, role:'preferredElement' });
    }
    // dispreferred
    if (p.dispreferredArgumentId) {
      nodes.push({ id: RA(p.dispreferredArgumentId), kind:'RA', label:`Argument ${p.dispreferredArgumentId.slice(0,8)}…` });
      edges.push({ id:`e:${p.id}:dispA`, from: paId, to: RA(p.dispreferredArgumentId), role:'dispreferredElement' });
    } else if (p.dispreferredClaimId) {
      if (!nodes.some(n => n.id === I(p.dispreferredClaimId!))) {
        const cl = await prisma.claim.findUnique({ where:{ id: p.dispreferredClaimId! }, select:{ id:true, text:true } });
        if (cl) nodes.push({ id: I(cl.id), kind:'I', label: cl.text || cl.id });
      }
      edges.push({ id:`e:${p.id}:dispI`, from: paId, to: I(p.dispreferredClaimId!), role:'dispreferredElement' });
    }
  }

  // Dedupe nodes/edges (in case conflict/preference brought repeats)
  const uniqNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values());
  const uniqEdges = Array.from(new Map(edges.map(e => [e.id, e])).values());
  return { nodes: uniqNodes, edges: uniqEdges };
}
export async function buildDiagramForArgument(argumentId: string): Promise<Diagram|null> {
  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { id:true, text:true, claimId:true, deliberationId:true }
  });
  if (!arg) return null;


   // Parents (supports) → premises
  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId: arg.deliberationId, toArgumentId: arg.id },
    select: { fromArgumentId: true, type: true },
  });

  const supportIds = edges
    .filter(e => (String(e.type).toLowerCase() === 'support') || (String(e.type).toLowerCase() === 'grounds'))
    .map(e => e.fromArgumentId);

  const premArgs = supportIds.length
    ? await prisma.argument.findMany({ where: { id: { in: supportIds } }, select: { id: true, text: true } })
    : [];

  // Use *true ids* for consistency across conclusion/premises/statements
  const statements: Diagram['statements'] = [
    { id: arg.id, text: arg.text, kind: 'claim' },
    ...premArgs.map(p => ({ id: p.id, text: p.text, kind: 'premise' })),
  ];


  // // Pull Toulmin-like slots if you have them (or derive from edges)
  // // Outgoing edges that *support* this conclusion become premises; rebuts become rebuttals.
  //   const edges = await prisma.argumentEdge.findMany({
  //     where: { toArgumentId: argumentId },
  //     select: { id:true, type:true, fromArgumentId:true }
  //   });
  
    const supportFrom = edges.filter(e => e.type === 'support').map(e => e.fromArgumentId);
    const rebutFrom   = edges.filter(e => e.type === 'rebut').map(e => e.fromArgumentId);
    const underFrom   = edges.filter(e => e.type === 'undercut').map(e => e.fromArgumentId);

    const [premiseArgs, rebutArgs, undercutArgs] = await Promise.all([
      prisma.argument.findMany({ where: { id: { in: supportFrom } },  select: { id:true, text:true } }),
      prisma.argument.findMany({ where: { id: { in: rebutFrom } },    select: { id:true, text:true } }),
      prisma.argument.findMany({ where: { id: { in: underFrom } },    select: { id:true, text:true } }),
    ]);


  // const statements: Diagram['statements'] = [
  //   { id: arg.id, text: arg.text, kind: 'claim' },
  //   ...premiseArgs.map(p => ({ id: p.id, text: p.text, kind: "premise" as const }))
  //   ,...rebutArgs.map(r => ({ id: r.id, text: r.text, kind: "rebuttal" as const }))
  // ];

  const inferences: Diagram['inferences'] = premArgs.length ? [{
    id: `inf_${arg.id}`,
    kind: 'defeasible',
    conclusion: { id: arg.id, text: arg.text },
    premises: premArgs.map(p => ({ statement: { id: p.id, text: p.text } })),
    scheme: null,
  }] : [];

  // If you store claim evidence via /api/claims/[id]/evidence, map it here
  const ev: Diagram['evidence'] = []; // optional: attach your citations

  // Attach an AIF view for consumers that want AIF-true rendering
  const aif = await buildAifSubgraphForArgument(argumentId).catch(()=>null);
  return { id: `synth:${arg.id}`, title: null, statements, inferences, evidence: [], ...(aif ? { aif } : {}) };
 }