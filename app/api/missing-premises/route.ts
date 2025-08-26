import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';

const Schema = z.object({
  deliberationId: z.string(),
  targetType: z.enum(['argument','card']),
  targetId: z.string(),
  proposedById: z.string(),
  text: z.string().min(3),
  premiseType: z.enum(['premise','warrant']).optional().default('premise'),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const row = await prisma.missingPremise.create({
    data: parsed.data,
  });

  return NextResponse.json({ ok: true, id: row.id });
}
