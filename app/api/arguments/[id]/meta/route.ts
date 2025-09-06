import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await req.json().catch(()=> ({}));
  const { quantifier, modality } = body as { quantifier?: string|null; modality?: string|null };

  // Validate enums softly (skip if empty)
  const Q = ['SOME','MANY','MOST','ALL'];
  const M = ['COULD','LIKELY','NECESSARY'];
  const data: any = {};
  if (quantifier === null || Q.includes(quantifier)) data.quantifier = quantifier ?? null;
  if (modality  === null || M.includes(modality))   data.modality  = modality ?? null;

  if (!Object.keys(data).length) {
    return NextResponse.json({ ok: true, noop: true });
  }
  await prisma.argument.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
