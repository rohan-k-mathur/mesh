import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { selectViewpoints, type SelectionRule } from '@/lib/deepdive/selection';
import { asUserIdString } from '@/lib/auth/normalize';

const Body = z.object({
  k: z.number().min(1).max(7).default(3),
  rule: z.enum(['utilitarian', 'harmonic', 'maxcov']).default('utilitarian'),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userIdStr = asUserIdString(userId);
  const deliberationId = params.id;
// Load deliberation + (optional) room default
const delib = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { id: true, rule: true, roomId: true }
  });
  if (!delib) return NextResponse.json({ error: 'Deliberation not found' }, { status: 404 });
  
  const roomRule = delib.roomId
    ? (await prisma.room.findUnique({ where: { id: delib.roomId }, select: { representationRule: true } }))?.representationRule
    : undefined;
  
  // Body parse after we know defaults
  const parsed = Body.safeParse(await req.json());
  let rule: 'utilitarian'|'harmonic'|'maxcov' =
    (parsed.success ? parsed.data.rule : undefined) ?? delib.rule ?? roomRule ?? 'utilitarian';
  const k: number = (parsed.success ? parsed.data.k : 3);
  // Load nodes, edges, approvals
  const [args, edges, approvalsRaw] = await Promise.all([
    prisma.argument.findMany({ where: { deliberationId }, select: { id: true, text: true, confidence: true } }),
    prisma.argumentEdge.findMany({ where: { deliberationId }, select: { fromArgumentId: true, toArgumentId: true, type: true } }),
    prisma.argumentApproval.findMany({ where: { deliberationId }, select: { userId: true, argumentId: true } }),
  ]);

  const nodes = args.map(a => a.id);
  const edgeList = edges.map(e => ({ from: e.fromArgumentId, to: e.toArgumentId, type: e.type })) as any;

  const approvals = new Map<string, Set<string>>();
  for (const a of approvalsRaw) {
    if (!approvals.has(a.userId)) approvals.set(a.userId, new Set());
    approvals.get(a.userId)!.add(a.argumentId);
  }

  const { chosen, coverageAvg, coverageMin, jrSatisfied, repVector, bestPossibleAvg, conflictsTopPairs } =
    selectViewpoints(nodes, edgeList, approvals, { k, rule: rule as SelectionRule });

  // persist selection
  const selection = await prisma.viewpointSelection.create({
    data: {
      deliberationId,
      rule,
      k,
      coverageAvg,
      coverageMin,
      jrSatisfied,
      createdById: userIdStr,
      explainJson: {
        repVector,
        counts: {
          users: approvals.size,
          nodes: nodes.length,
          edges: edgeList.length,
        },
        repVector,
        bestPossibleAvg,
        conflictsTopPairs,
        counts: { users: approvals.size, nodes: nodes.length, edges: edgeList.length },
      
      },
    },
  });

  // write viewpoint arguments
  const vpArgsCreate = chosen.flatMap((set, idx) =>
    [...set].map(argId => ({
      selectionId: selection.id,
      argumentId: argId,
      viewpoint: idx,
    })),
  );
  if (vpArgsCreate.length) {
    await prisma.viewpointArgument.createMany({ data: vpArgsCreate, skipDuplicates: true });
  }

  // amplify ledger (human readable reason)
  await prisma.amplificationEvent.create({
    data: {
      kind: 'deliberation_viewpoint_selected',
      originId: selection.id,
      userId: userIdStr,
      reason: rule === 'utilitarian'
        ? 'Chosen to maximize average coverage of approvals'
        : rule === 'harmonic'
          ? 'Chosen to balance average and fairness (harmonic weights)'
          : 'Chosen to maximize the count of fully represented voters (JR-oriented)',
      payload: { deliberationId, selectionId: selection.id, k, coverageAvg, coverageMin, jrSatisfied, rule },
    },
  });

  // hydrate response with argument snippets per viewpoint
  const mapText = new Map(args.map(a => [a.id, { text: a.text, confidence: a.confidence }]));
  const views = chosen.map((set, idx) => ({
    index: idx,
    arguments: [...set].map(id => ({ id, ...mapText.get(id)! })),
  }));

  return NextResponse.json({
    ok: true,
    selection: {
      id: selection.id,
      rule,
      k,
      coverageAvg,
      coverageMin,
      jrSatisfied,
            bestPossibleAvg,
     conflictsTopPairs,
      views,
    },
  });
}
