// app/api/connective-test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({}));
  const { deliberationId, premises = [], conclusion, mode = 'deductive' } = body;

  if (!deliberationId || !Array.isArray(premises) || !conclusion)
    return NextResponse.json({ ok:false, error:'missing deliberationId/premises/conclusion' }, { status: 400 });

  const checks = { anaphora: premises.length > 0, presupposition: premises.length > 0, support: false };

  if (!checks.anaphora) return NextResponse.json({ status: 'missing-premises', checks });

  if (mode !== 'deductive') {
    return NextResponse.json({ status: 'undefined', checks, trace: { reason: 'only deductive slice implemented' } });
  }

  // naive support: do we have an RA with these premises → conclusion?
  const args = await prisma.argument.findMany({
    where: { deliberationId, conclusionClaimId: conclusion },
    include: { premises: true }
  });

  const premSet = new Set(premises);
  for (const a of args) {
    const argPrems = a.premises.map(p => p.claimId);
    if (argPrems.length === premSet.size && argPrems.every(id => premSet.has(id))) {
      checks.support = true; break;
    }
  }

  return NextResponse.json({ status: checks.support ? 'pass' : 'undefined', checks, trace: { matches: checks.support } }, { status: 200 });
}
