import { prisma } from "../prismaclient";

export type Diagram = {
  id: string;
  title?: string | null;
  statements: Array<{ id: string; text: string; kind: 'claim'|'premise'|'warrant'|'backing'|'rebuttal' }>;
  inferences: Array<{ id: string; conclusionId: string; premiseIds: string[]; scheme?: string|null }>;
  evidence: Array<{ id: string; uri: string; note?: string|null }>;
};

export async function buildDiagramForArgument(argumentId: string): Promise<Diagram|null> {
  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { id:true, text:true, claimId:true, deliberationId:true }
  });
  if (!arg) return null;

  // Pull Toulmin-like slots if you have them (or derive from edges)
  // Outgoing edges that *support* this conclusion become premises; rebuts become rebuttals.
    const edges = await prisma.argumentEdge.findMany({
      where: { toArgumentId: argumentId },
      select: { id:true, type:true, fromArgumentId:true }
    });
  
    const supportFrom = edges.filter(e => e.type === 'support').map(e => e.fromArgumentId);
    const rebutFrom   = edges.filter(e => e.type === 'rebut').map(e => e.fromArgumentId);
    const underFrom   = edges.filter(e => e.type === 'undercut').map(e => e.fromArgumentId);

    const [premiseArgs, rebutArgs, undercutArgs] = await Promise.all([
      prisma.argument.findMany({ where: { id: { in: supportFrom } },  select: { id:true, text:true } }),
      prisma.argument.findMany({ where: { id: { in: rebutFrom } },    select: { id:true, text:true } }),
      prisma.argument.findMany({ where: { id: { in: underFrom } },    select: { id:true, text:true } }),
    ]);


  const statements: Diagram['statements'] = [
    { id: arg.id, text: arg.text, kind: 'claim' },
    ...premiseArgs.map(p => ({ id: p.id, text: p.text, kind: "premise" as const }))
    ,...rebutArgs.map(r => ({ id: r.id, text: r.text, kind: "rebuttal" as const }))
  ];

  const inferences: Diagram['inferences'] = [{
    id: `inf_${argumentId}`,
    conclusionId: arg.id,
    premiseIds: premiseArgs.map(p => p.id),
    scheme: null, // fill from your scheme metadata if available
  }];

  // If you store claim evidence via /api/claims/[id]/evidence, map it here
  const ev: Diagram['evidence'] = []; // optional: attach your citations

  return { id: argumentId, title: null, statements, inferences, evidence: ev };
}
