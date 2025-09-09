import { prisma } from '@/lib/prismaclient';

export async function endWithDaimon(designId: string, reason: 'accept'|'fail'='accept') {
  const last = await prisma.ludicAct.findFirst({ where:{ designId }, orderBy:{ orderInDesign:'desc' } });
  const order = (last?.orderInDesign ?? 0) + 1;
  const act = await prisma.ludicAct.create({
    data: {
      designId, kind:'DAIMON', orderInDesign: order, expression: reason === 'accept' ? '†(accept)' : '†(fail)',
    }
  });
  await prisma.ludicDesign.update({ where:{ id: designId }, data:{ hasDaimon: true } });
  return { ok:true, actId: act.id, order };
}
