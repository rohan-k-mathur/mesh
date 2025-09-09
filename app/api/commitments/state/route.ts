// app/api/commitments/state/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams;
  const dialogueId = u.get('dialogueId') || '';
  const ownerId    = u.get('ownerId')    || '';
  if (!dialogueId || !ownerId) return NextResponse.json({ ok:false, error:'missing' }, { status:400 });

  const cs = await prisma.ludicCommitmentState.findFirst({
    where: { ownerId },
    include: { elements: { include: { baseLocus: true } } },
  });

  const facts = cs?.elements.filter(e=>e.basePolarity==='pos').map(e=>e.label ?? '') ?? [];
  const rules = cs?.elements.filter(e=>e.basePolarity==='neg').map(e=>e.label ?? '') ?? [];

  // naïve re-derive (mirror interactCE v0)
  const derived = (rules.includes('r1') && facts.includes('contract') && facts.includes('delivered'))
    ? ['to.pay'] : [];

  const contradictions = (derived.includes('to.pay') || facts.includes('to.pay')) && facts.includes('notPaid')
    ? [{ a:'to.pay', b:'notPaid' }] : [];

  return NextResponse.json({ ok:true, facts, rules, derived, contradictions });
}
