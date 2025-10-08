// app/api/schemes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(_: NextRequest) {
  // If you have ArgumentScheme in DB, use it; otherwise serve a minimal built‑in list.
  const db = await prisma.argumentScheme.findMany({
    orderBy: { key: 'asc' },
    select: { id:true, key:true, name:true, slotHints:true, cqs:true }
  }).catch(() => []);
  const builtins = [
    {
      id: 'builtin:expert-opinion',
      key: 'expert_opinion',
      name: 'Argument from Expert Opinion',
      slotHints: { premises: [
        { role: 'expertise',  label: 'E is an expert in domain D' },
        { role: 'assertion',  label: 'E asserts that A is true' },
        { role: 'credibility',label: 'E is credible (unbiased, reliable)' }
      ]},
      cqs: [
        { cqKey: 'expert?',     text: 'Is E an expert in D?',            attackType:'UNDERMINES', targetScope: 'premise' },
        { cqKey: 'says?',       text: 'Did E assert A?',                 attackType:'UNDERMINES', targetScope: 'premise' },
        { cqKey: 'credible?',   text: 'Is E credible / unbiased?',       attackType:'UNDERMINES', targetScope: 'premise' },
        { cqKey: 'exceptions?', text: 'Are there defeaters/exceptions?', attackType:'UNDERCUTS',  targetScope: 'inference' },
        { cqKey: 'consensus?',  text: 'Do other experts disagree?',      attackType:'REBUTS',     targetScope: 'conclusion' },
      ],
    }
  ];
  const items = db.length ? db : builtins;
  return NextResponse.json({ items }, { headers: { 'Cache-Control':'no-store' }});
}
