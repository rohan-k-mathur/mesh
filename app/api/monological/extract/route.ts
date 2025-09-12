import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

function uniq(xs: string[] = []) {
  const s = new Set<string>();
  return xs.filter(t => {
    const k = t.trim().toLowerCase();
    if (!k) return false;
    if (s.has(k)) return false;
    s.add(k);
    return true;
  });
}

export async function GET(req: NextRequest) {
  const argumentId = req.nextUrl.searchParams.get('argumentId');
  if (!argumentId) {
    return NextResponse.json({ ok:false, error:'argumentId required' }, { status: 400 });
  }

  // Find related claim (optional), handy for warrants/backing
  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { id: true, claimId: true },
  });

  // 1) MissingPremise (our canonical store for ground/warrant/backing/qualifier/rebuttal)
  const mp = await prisma.missingPremise.findMany({
    where: { targetType: 'argument', targetId: argumentId },
    select: { premiseType: true, text: true },
  });

  // 2) ArgumentAnnotation with "monological:*"
  const aa = await prisma.argumentAnnotation.findMany({
    where: {
      targetType: 'argument',
      targetId: argumentId,
      type: { startsWith: 'monological:' },
    },
    select: { type: true, text: true },
  });

  // 3) ClaimWarrant if argument was promoted
  const cw = arg?.claimId
    ? await prisma.claimWarrant.findMany({
        where: { claimId: arg.claimId },
        select: { text: true },
      })
    : [];

  // Map everything into slot arrays
  const acc: Record<'grounds'|'warrant'|'backing'|'qualifier'|'rebuttal'|'claim', string[]> = {
    grounds: [], warrant: [], backing: [], qualifier: [], rebuttal: [], claim: [],
  };

  // MissingPremise: premiseType can be 'ground' | 'grounds' | 'warrant' | ...
  for (const r of mp) {
    const t = (r.premiseType || '').toLowerCase();
    const slot =
      t === 'ground' || t === 'grounds' ? 'grounds' :
      t === 'warrant'  ? 'warrant'  :
      t === 'backing'  ? 'backing'  :
      t === 'qualifier'? 'qualifier':
      t === 'rebuttal' ? 'rebuttal' : null;
    if (slot) acc[slot].push(r.text);
  }

  // ArgumentAnnotation: type = 'monological:<slot>'
  for (const r of aa) {
    const t = (r.type || '').toLowerCase().replace('monological:', '');
    const slot =
      t === 'ground' || t === 'grounds' ? 'grounds' :
      t === 'warrant'  ? 'warrant'  :
      t === 'backing'  ? 'backing'  :
      t === 'qualifier'? 'qualifier':
      t === 'rebuttal' ? 'rebuttal' : null;
    if (slot) acc[slot].push(r.text);
  }

  // ClaimWarrant → warrants
  for (const r of cw) acc.warrant.push(r.text);

  // Dedup & cap reasonable counts
  const slots = {
    claim:     uniq(acc.claim).slice(0, 5),
    grounds:   uniq(acc.grounds).slice(0, 5),
    warrant:   uniq(acc.warrant).slice(0, 5),
    backing:   uniq(acc.backing).slice(0, 5),
    qualifier: uniq(acc.qualifier).slice(0, 5),
    rebuttal:  uniq(acc.rebuttal).slice(0, 5),
  };

  return NextResponse.json({ ok: true, slots });
}
