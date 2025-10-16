// app/api/aif/schemes/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';

function normalize(s: any) {
  return {
    id: s.id,
    key: s.key,
    name: s.title || s.name || s.key,
    slotHints: s.slotHints ?? { premises: [{ role: 'reason', label: 'Reason' }] },
    cqs: Array.isArray(s.cq?.questions)
      ? s.cq.questions.map((text: string, i: number) => ({
          cqKey: `CQ${i + 1}`,
          text,
          attackType: 'REBUTS',
          targetScope: 'conclusion',
        }))
      : [],
    // keep validators server-side; add later to the payload if/when the UI needs them
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ensure = url.searchParams.get('ensure') === '1';

  if (ensure) {
    // Seed Expert Opinion if table empty
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
          // seed some baseline CQs
          cq: { questions: [
            'Is the source a genuine expert?',
            'Is the field relevant?',
            'Is there consensus?'
          ] },
          // (optional) validators for future server/client checks
          validators: {
            slots: {
              // Example expectations (can be refined as you introduce claimType)
              expert_statement: { expects: 'Assertion', required: true },
              credibility:      { expects: 'Assertion', required: false },
              conclusion:       { expects: 'Assertion', required: true },
            }
          } as any,
        } as any,
      });
    }

    // A minimal defeasible "Because …" scheme
    await prisma.argumentScheme.upsert({
      where: { key: 'bare_assertion' },
      update: {},
      create: {
        key: 'bare_assertion',
        name: 'Bare Assertion',
        slotHints: { premises: [{ role: 'reason', label: 'Reason' }] },
        summary: 'A simple, defeasible argument consisting of a single reason supporting a conclusion.',
        validators: {
          slots: {
            reason:     { expects: 'Assertion', required: true },
            conclusion: { expects: 'Assertion', required: true }
          }
        } as any
      } as any,
    });
  }

  const rows = await prisma.argumentScheme.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(
    { ok: true, items: rows.map(normalize) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
