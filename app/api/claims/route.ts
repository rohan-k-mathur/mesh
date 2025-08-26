import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { mintClaimMoid } from '@/lib/ids/mintMoid';

const PromoteSchema = z.object({
  deliberationId: z.string().optional(),
  text: z.string().min(1).optional(),
  target: z
    .object({
      type: z.enum(['argument', 'card']),
      id: z.string(),
    })
    .optional(),
});

async function getTextFromTarget(target?: { type: 'argument' | 'card'; id: string }) {
  if (!target) return null;
  if (target.type === 'argument') {
    const a = await prisma.argument.findUnique({ where: { id: target.id }, select: { text: true, deliberationId: true } });
    return a?.text ?? null;
  }
  if (target.type === 'card') {
    const c = await prisma.deliberationCard.findUnique({ where: { id: target.id }, select: { claimText: true, deliberationId: true } as any });
    return (c as any)?.claimText ?? null;
  }
  return null;
}

function getUserId(req: Request) {
  // TODO integrate your auth. For now read header or fallback.
  return (req.headers.get('x-user-id') ?? 'system').toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = PromoteSchema.parse(body);

    let text = input.text ?? null;
    if (!text) text = await getTextFromTarget(input.target);
    if (!text) return NextResponse.json({ error: 'No text found to promote' }, { status: 400 });

    const moid = mintClaimMoid(text);
    const existing = await prisma.claim.findUnique({ where: { moid } });
    if (existing) {
      return NextResponse.json({ claim: existing, created: false });
    }

    const deliberationId =
      input.deliberationId ??
      (input.target
        ? (
            await (input.target.type === 'argument'
              ? prisma.argument.findUnique({ where: { id: input.target.id }, select: { deliberationId: true } })
              : prisma.deliberationCard.findUnique({ where: { id: input.target.id }, select: { deliberationId: true } as any }))
          )?.deliberationId ?? null
        : null);

    const claim = await prisma.claim.create({
      data: {
        deliberationId: deliberationId ?? undefined,
        text,
        createdById: getUserId(req),
        moid,
      },
    });
    return NextResponse.json({ claim, created: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Invalid request' }, { status: 400 });
  }
}
