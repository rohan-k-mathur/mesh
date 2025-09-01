import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mp = await prisma.missingPremise.update({
      where: { id: params.id },
      data: { status: 'accepted', decidedAt: new Date() },
      select: { id:true, targetType:true, targetId:true, text:true, premiseType:true }
    });

    if (mp.targetType === 'card') {
      if (mp.premiseType === 'warrant') {
        await prisma.deliberationCard.update({
          where: { id: mp.targetId },
          data: { warrantText: mp.text }
        });
      } else {
        const cur = await prisma.deliberationCard.findUnique({ where: { id: mp.targetId }, select: { reasonsText: true }});
        await prisma.deliberationCard.update({
          where: { id: mp.targetId },
          data: { reasonsText: [...(cur?.reasonsText ?? []), mp.text] }
        });
      }
    } else {
      // target is an argument: create an implicit child premise that supports it
      const parent = await prisma.argument.findUnique({ where: { id: mp.targetId }, select: { deliberationId: true, authorId: true }});
      const child = await prisma.argument.create({
        data: {
          deliberationId: parent?.deliberationId ?? '',
          authorId: String(userId),
          text: mp.text,
          isImplicit: true,
        }
      });
      await prisma.argumentEdge.create({
        data: {
          deliberationId: parent?.deliberationId ?? '',
          fromArgumentId: child.id,
          toArgumentId: mp.targetId,
          type: 'support',
          createdById: String(userId),
          targetScope: 'premise'
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    console.error('[missing-premises:accept]', e);
    return NextResponse.json({ error: e?.message ?? 'Invalid request' }, { status: 400 });
  }
}
