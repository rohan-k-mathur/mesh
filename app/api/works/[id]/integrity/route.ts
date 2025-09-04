import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const w = await prisma.theoryWork.findUnique({
    where: { id: params.id },
    select: {
      standardOutput: true,
      // ✅ use parent-side relation field names
      hermeneutic: { select: { id: true } },
      practicalJustification: { select: { id: true, result: true } },
      pascal: { select: { id: true, decision: true, assumption: true } },
    },
  });

  if (!w) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const hasStd = !!w.standardOutput;
  const hasHerm = !!w.hermeneutic;
  const hasPrac = !!w.practicalJustification && !!w.practicalJustification.result && Object.keys(w.practicalJustification.result).length > 0;
  const hasPascal = !!w.pascal && !!w.pascal.decision && Object.keys(w.pascal.decision).length > 0;
  const hasAssumption = !!w.pascal?.assumption;

  return NextResponse.json({ hasStd, hasHerm, hasPrac, hasPascal, hasAssumption });
}
