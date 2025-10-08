// app/api/aif/schemes/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

function normalize(s: any) {
  return {
    id: s.id,
    key: s.key,
    name: s.title || s.key,
    slotHints: s.slotHints ?? {
      premises: [
        // sensible default if none in DB
        { role: 'reason', label: 'Reason' }
      ],
    },
    // optional; composer doesn't *need* these to render
    cqs: Array.isArray(s.cq?.questions)
      ? s.cq.questions.map((text: string, i: number) => ({
          cqKey: `CQ${i + 1}`,
          text,
          // defaults; real mappings come from the CQ table when you open them
          attackType: 'REBUTS',
          targetScope: 'conclusion',
        }))
      : [],
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ensure = url.searchParams.get('ensure') === '1';

  if (ensure) {
    const count = await prisma.argumentScheme.count();
    if (count === 0) {
      // Seed one canonical scheme so the dropdown isn't empty
      await prisma.argumentScheme.create({
        data: {
          key: 'expert_opinion',
          title: 'Appeal to Expert Opinion',
          summary: 'Uses an expert’s statement as support.',
          slotHints: {
            premises: [
              { role: 'expert_statement', label: 'Expert’s statement' },
              { role: 'credibility',      label: 'Expert is credible' },
            ],
          },
          // matches your CQ shape used around the platform
          cq: { questions: [
            'Is the source a genuine expert?',
            'Is the field relevant?',
            'Is there consensus?'
          ]},
        } as any,
      });
    }
  }

  const rows = await prisma.argumentScheme.findMany({ orderBy: { title: 'asc' } });
  return NextResponse.json(
    { ok: true, items: rows.map(normalize) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
