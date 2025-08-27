import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

// Seed "Expert Opinion" scheme if missing
async function ensureExpertOpinion() {
  const key = 'expert_opinion';
  const exists = await prisma.argumentScheme.findUnique({ where: { key } });
  if (exists) return exists;
  return prisma.argumentScheme.create({
    data: {
      key,
      title: 'Argument from Expert Opinion',
      summary: 'Expert E asserts that P is true in domain D',
      cq: [
        { id: 'cred', text: 'Is the cited person a credible expert in D?', attackKind: 'UNDERMINES' },
        { id: 'cons', text: 'Is there consensus among relevant experts?', attackKind: 'UNDERCUTS' },
        { id: 'bias', text: 'Is the expert unbiased / are there conflicts?', attackKind: 'UNDERCUTS' },
      ] as any,
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get('targetType') ?? undefined;
  const targetId   = searchParams.get('targetId') ?? undefined;
  if (!targetType || !targetId) return NextResponse.json({ instances: [] });
  const out = await prisma.schemeInstance.findMany({
    where: { targetType, targetId },
    include: { scheme: true },
  });
  // include CQs
  const instances = await Promise.all(out.map(async (inst) => {
    const cqs = await prisma.criticalQuestion.findMany({ where: { instanceId: inst.id } });
    return { ...inst, criticalQuestions: cqs };
  }));
  return NextResponse.json({ instances });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { targetType, targetId, schemeKey, data, createdById } = body as {
    targetType: 'card'|'claim',
    targetId: string,
    schemeKey?: string,
    data?: any,
    createdById: string,
  };
  if (!targetType || !targetId) return NextResponse.json({ error: 'Missing target' }, { status: 400 });
  const scheme = schemeKey
    ? await prisma.argumentScheme.findUnique({ where: { key: schemeKey } })
    : await ensureExpertOpinion();

  if (!scheme) return NextResponse.json({ error: 'Unknown scheme' }, { status: 400 });

  const instance = await prisma.schemeInstance.create({
    data: {
      targetType, targetId, schemeId: scheme.id,
      data: data ?? {},
      createdById,
    },
  });

  // Instantiate CriticalQuestions for this instance
  const cq = (scheme.cq as any[] ?? []).map((q) => ({
    instanceId: instance.id,
    cqId: q.id,
    text: q.text,
    attackKind: q.attackKind,
    status: 'open',
    openedById: createdById,
  }));
  if (cq.length) await prisma.criticalQuestion.createMany({ data: cq });

  const cqs = await prisma.criticalQuestion.findMany({ where: { instanceId: instance.id } });
  return NextResponse.json({ instance, criticalQuestions: cqs });
}
