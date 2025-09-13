// app/api/dialogue/answer-and-commit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { applyToCS } from '@/packages/ludics-engine/commitments';
import { getCurrentUserId } from '@/lib/serverutils';
import { Prisma } from '@prisma/client';

const Body = z.object({
  deliberationId: z.string().min(5),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(5),
  cqKey: z.string().min(1).default('default'),
  locusPath: z.string().min(1).default('0'),
  expression: z.string().min(1),          // canonical label or rule
  original: z.string().optional().nullable(), // optional NL text
  commitOwner: z.enum(['Proponent','Opponent']),
  commitPolarity: z.enum(['pos','neg']).default('pos'),
});

const makeSignature = (targetType: string, targetId: string, cqKey: string, locusPath: string, expression: string) =>
  ['GROUNDS', targetType, targetId, cqKey, locusPath, String(expression).slice(0,64)].join(':');

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status:400 });

  const { deliberationId, targetType, targetId, cqKey, locusPath, expression, original, commitOwner, commitPolarity } = parsed.data;

  // (optional) cheap target sanity check
  try {
    if (targetType === 'argument') {
      const ok = await prisma.argument.findFirst({ where: { id: targetId, deliberationId }, select:{id:true} });
      if (!ok) return NextResponse.json({ ok:false, error:'TARGET_MISMATCH' }, { status:400 });
    } else if (targetType === 'claim') {
      const ok = await prisma.claim.findFirst({ where: { id: targetId, deliberationId }, select:{id:true} });
      if (!ok) return NextResponse.json({ ok:false, error:'TARGET_MISMATCH' }, { status:400 });
    }
  } catch {}

  const userId = await getCurrentUserId().catch(()=>null);
  const actorId = String(userId ?? 'unknown');

  // 1) Answer the WHY with GROUNDS
  const payload = {
    expression,
    cqId: cqKey,
    locusPath,
    original: original ?? expression, // ✅ define original safely
  };
  const signature = makeSignature(targetType, targetId, cqKey, locusPath, expression);

  let move: any;
  try {
    move = await prisma.dialogueMove.create({
      data: { deliberationId, targetType, targetId, kind:'GROUNDS', payload, actorId, signature },
    });
  } catch (e:any) {
    // if you added a unique on (deliberationId, signature) and hit duplicates, fetch existing
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      move = await prisma.dialogueMove.findFirst({ where: { deliberationId, signature }, orderBy:{ createdAt:'desc' } });
    } else {
      throw e;
    }
  }

  // 2) Commit the same assertion to the chosen owner’s CS
  await applyToCS(deliberationId, commitOwner, {
    add: [{ label: expression, basePolarity: commitPolarity, baseLocusPath: locusPath, entitled: true }]
  });

  try {
    (globalThis as any).meshBus?.emit?.('dialogue:moves:refresh', { deliberationId });
    (globalThis as any).meshBus?.emit?.('dialogue:cs:refresh',   { dialogueId: deliberationId, ownerId: commitOwner });
  } catch {}

  return NextResponse.json({ ok:true, move });
}
