// app/api/dialogue/legal-moves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

type MoveKind = 'ASSERT'|'WHY'|'GROUNDS'|'REBUT'|'CONCEDE'|'RETRACT'|'CLOSE';

function legalReplies(last: { type: string; illocution?: string|null }): MoveKind[] {
  if (last.type === 'ASSERT') return ['WHY','REBUT','CONCEDE','RETRACT'];
  if (last.type === 'WHY') return ['GROUNDS'];            // Argue
  if (last.type === 'GROUNDS') return ['ASSERT','REBUT','WHY'];
  return ['ASSERT','WHY'];
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const at = u.searchParams.get('at');
  if (!at) return NextResponse.json({ ok:false, error:'missing ?at=moveId' }, { status: 400 });

  const last = await prisma.dialogueMove.findUnique({ where: { id: at }, select: { id:true, type:true, illocution:true } });
  if (!last) return NextResponse.json({ ok:false, error:'not found' }, { status: 404 });

  return NextResponse.json({ ok:true, allowed: legalReplies(last) });
}
