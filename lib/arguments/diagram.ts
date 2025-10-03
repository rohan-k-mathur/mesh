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
};

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

  return { id: `synth:${arg.id}`, title: null, statements, inferences, evidence: [] };
}
