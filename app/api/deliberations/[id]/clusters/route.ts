import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const clusters = await prisma.cluster.findMany({
    where: { deliberationId, type: 'affinity' },
    include: {
      users: { select: { userId: true } },
      arguments: { select: { argumentId: true } }
    }
  });
  return NextResponse.json({
    items: clusters.map(c => ({
      id: c.id,
      label: c.label,
      userCount: c.users.length,
      argumentCount: c.arguments.length
    }))
  });
}
