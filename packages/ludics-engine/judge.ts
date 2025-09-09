import { prisma } from '@/lib/prismaclient';
import { Hooks } from './hooks';
import { endWithDaimon } from './daimon';

export async function closeBranch(targetDesignId: string, locusPath: string) {
  const design = await prisma.ludicDesign.findUnique({ where: { id: targetDesignId } });
  if (!design) throw new Error('NO_SUCH_DESIGN');
  const locus = await prisma.ludicLocus.findFirst({ where: { dialogueId: design.deliberationId, path: locusPath } });
  if (!locus) throw new Error('NO_SUCH_LOCUS');

  // Minimal “close branch”: append a DAIMON at target locus’ design or clear ramifications upstream
  const last = await prisma.ludicAct.findFirst({ where: { designId: targetDesignId }, orderBy: { orderInDesign: 'desc' }});
  const order = (last?.orderInDesign ?? 0) + 1;

  const act = await prisma.ludicAct.create({
    data: { designId: targetDesignId, kind:'DAIMON', orderInDesign: order, expression: 'BRANCH_CLOSED' }
  });
  await prisma.ludicChronicle.create({ data: { designId: targetDesignId, order, actId: act.id } });

  Hooks.emitActAppended({
    designId: targetDesignId,
    dialogueId: design.deliberationId,
    actId: act.id,
    orderInDesign: order,
    act: { kind: 'DAIMON', expression: 'BRANCH_CLOSED' },
  });

  return { appended: [act.id] };
}

export async function forceConcession(params: {
  dialogueId: string; judgeId: string; targetDesignId: string; locus: string; text: string;
}) {
  const { dialogueId, targetDesignId, locus, text } = params;
  const design = await prisma.ludicDesign.findUnique({ where: { id: targetDesignId } });
  if (!design) throw new Error('NO_SUCH_DESIGN');

  // Force a (+ then −) micro-pattern at the locus (simplified)
  // For demo purposes we only append a negative ACK on the target design.
  const targetLocus = await prisma.ludicLocus.findFirst({ where: { dialogueId, path: locus } });
  if (!targetLocus) throw new Error('NO_SUCH_LOCUS');

  const last = await prisma.ludicAct.findFirst({ where: { designId: targetDesignId }, orderBy: { orderInDesign: 'desc' }});
  const order = (last?.orderInDesign ?? 0) + 1;

  const act = await prisma.ludicAct.create({
    data: {
      designId: targetDesignId, kind:'PROPER', polarity:'O',
      locusId: targetLocus.id, ramification: [], expression: text, orderInDesign: order
    }
  });
  await prisma.ludicChronicle.create({ data: { designId: targetDesignId, order, actId: act.id } });
  await endWithDaimon(targetDesignId, 'fail'); // loser forced to †


  Hooks.emitActAppended({
    designId: targetDesignId,
    dialogueId,
    actId: act.id,
    orderInDesign: order,
    act: { kind: 'PROPER', polarity:'O', locusPath: locus, expression: text },
  });

  // If you update CS here, also emit Hooks.emitCSUpdated(...)

  return { appended: [act.id] };
}
