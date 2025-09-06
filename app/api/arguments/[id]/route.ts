// app/api/arguments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';

const UpdateSchema = z.object({
  quantifier: z.enum(['SOME','MANY','MOST','ALL']).nullable().optional(),
  modality:   z.enum(['COULD','LIKELY','NECESSARY']).nullable().optional(),
});

const selectArg = {
  id: true, text: true,
  quantifier: true, modality: true,
  mediaType: true, mediaUrl: true,
  createdAt: true,
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const arg = await prisma.argument.findUnique({
    where: { id: params.id },
    select: selectArg,
  });
  if (!arg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ argument: arg });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // If you want public updates, drop the guard
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Only set fields explicitly present; allow null to clear
  const data: Record<string, any> = {};
  if ('quantifier' in parsed.data) data.quantifier = parsed.data.quantifier ?? null;
  if ('modality'   in parsed.data) data.modality   = parsed.data.modality   ?? null;

  if (!Object.keys(data).length) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const updated = await prisma.argument.update({
    where: { id: params.id },
    data,
    select: selectArg,
  });

  return NextResponse.json({ ok: true, argument: updated });
}
