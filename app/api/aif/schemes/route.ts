// app/api/aif/schemes/route.ts  (merge with your existing file)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

function normalize(s: any) {
  return {
    id: s.id,
    key: s.key,
    name: s.title || s.name || s.key,
    slotHints: s.slotHints ?? { premises: [{ role: 'reason', label: 'Reason' }] },
    cqs: Array.isArray(s.cq?.questions)
      ? s.cq.questions.map((text: string, i: number) => ({
          cqKey: `CQ${i + 1}`, text,
          attackType: 'REBUTS', targetScope: 'conclusion',
        }))
      : [],
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ensure = url.searchParams.get('ensure') === '1';

  if (ensure) {
    // Expert Opinion default (kept)
    const hasAny = await prisma.argumentScheme.count();
    if (!hasAny) {
      await prisma.argumentScheme.create({
        data: {
          key: 'expert_opinion',
          name: 'Argument from Expert Opinion',
          slotHints: {
            premises: [
              { role: 'expert_statement', label: 'Expert’s statement' },
              { role: 'credibility',      label: 'Expert is credible' },
            ],
          },
          cq: { questions: ['Is the source a genuine expert?','Is the field relevant?','Is there consensus?'] },
        } as any,
      });
    }

    // NEW: bare_assertion — one premise, one conclusion (defeasible “Because …”)
    await prisma.argumentScheme.upsert({
      where: { key: 'bare_assertion' },
      update: {},
      create: {
        key: 'bare_assertion',
        name: 'Bare Assertion',
        slotHints: { premises: [{ role: 'reason', label: 'Reason' }] },
        summary: 'A simple, defeasible argument consisting of a single reason supporting a conclusion.',
        // keep CQs empty; this is intentionally minimal
      } as any,
    });
  }

  const rows = await prisma.argumentScheme.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ ok: true, items: rows.map(normalize) }, { headers: { 'Cache-Control': 'no-store' } });
}