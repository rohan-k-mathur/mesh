// app/api/works/[id]/pascal/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getUserFromCookies } from '@/lib/serverutils';

export const dynamic = 'force-dynamic';

const PutSchema = z.object({
  assumption: z.string().max(1000).optional(),
  propositions: z.array(z.object({ id: z.string(), statement: z.string() })).nonempty('Add at least one proposition').optional(),
  actions: z.array(z.object({ id: z.string(), label: z.string() })).nonempty('Add at least one action').optional(),
  utilities: z.record(z.record(z.number())).optional(), // {[actionId]: {[worldId]: number}}
});

/** Compute expected utility by simple Laplace (uniform over propositions) */
function computeDecision(actions: {id:string}[], propositions: {id:string}[], utilities: Record<string, Record<string, number>>) {
  const n = propositions.length || 1;
  const eu: Record<string, number> = {};
  for (const a of actions) {
    const uMap = utilities[a.id] || {};
    let sum = 0;
    for (const w of propositions) sum += (uMap[w.id] ?? 0);
    eu[a.id] = sum / n;
  }
  let bestActionId = actions[0]?.id ?? null;
  let best = -Infinity;
  for (const a of actions) {
    if (eu[a.id] > best) { best = eu[a.id]; bestActionId = a.id; }
  }
  return { bestActionId, eu };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const workId = params.id;
  const [work, pm] = await Promise.all([
    prisma.theoryWork.findUnique({ where: { id: workId }, select: { id: true, authorId: true, theoryType: true } }),
    prisma.workPascalModel.findUnique({ where: { workId } }),
  ]);
  if (!work) return NextResponse.json({ error: 'Work not found' }, { status: 404 });

  return NextResponse.json({
    ok: true,
    work: { id: work.id, theoryType: work.theoryType },
    pascal: pm ?? {
      id: null,
      workId,
      propositions: [],
      actions: [],
      utilities: {},
      assumption: '',
      decision: {},
    },
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const workId = params.id;
  const user = await getUserFromCookies();
  if (!user?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const work = await prisma.theoryWork.findUnique({ where: { id: workId } });
  if (!work) return NextResponse.json({ error: 'Work not found' }, { status: 404 });
  if (String(work.authorId) !== String(user.userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }
  const { propositions = [], actions = [], utilities = {}, assumption } = parsed.data;

  const decision = computeDecision(actions, propositions, utilities);

  const pm = await prisma.workPascalModel.upsert({
    where: { workId },
    create: {
      workId, propositions, actions, utilities, assumption: assumption || null, decision,
    },
    update: {
      propositions, actions, utilities, assumption: assumption || null, decision,
    },
  });

  return NextResponse.json({ ok: true, pascal: pm });
}
