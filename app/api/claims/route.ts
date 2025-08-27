import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { mintClaimMoid } from '@/lib/ids/mintMoid';
import { mintUrn } from '@/lib/ids/urn';
import { getCurrentUserId } from '@/lib/serverutils';

const PromoteSchema = z.object({
  deliberationId: z.string().optional(),
  text: z.string().min(1).optional(),
  target: z.object({
    type: z.enum(['argument', 'card']),
    id: z.string(),
  }).optional(),
});

async function getTextFromTarget(target?: { type: 'argument'|'card'; id: string }) {
  if (!target) return null;
  if (target.type === 'argument') {
    const a = await prisma.argument.findUnique({ where: { id: target.id }, select: { text: true } });
    return a?.text ?? null;
  }
  if (target.type === 'card') {
    const c = await prisma.deliberationCard.findUnique({ where: { id: target.id }, select: { claimText: true } });
    return c?.claimText ?? null;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = PromoteSchema.parse(body);

    let text = input.text ?? null;
    if (!text) text = await getTextFromTarget(input.target);
    if (!text) return NextResponse.json({ error: 'No text found to promote' }, { status: 400 });

    const createdById = await getCurrentUserId();
    if (!createdById) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const moid = mintClaimMoid(text);
    const existing = await prisma.claim.findUnique({ where: { moid } });
    if (existing) {
      return NextResponse.json({ claim: existing, created: false });
    }

    // try to resolve deliberationId if not provided
    let deliberationId = input.deliberationId ?? null;
    if (!deliberationId && input.target) {
      if (input.target.type === 'argument') {
        deliberationId = (await prisma.argument.findUnique({ where: { id: input.target.id }, select: { deliberationId: true } }))?.deliberationId ?? null;
      } else {
        deliberationId = (await prisma.deliberationCard.findUnique({ where: { id: input.target.id }, select: { deliberationId: true } }))?.deliberationId ?? null;
      }
    }

    const urn = mintUrn('claim', moid);

    // Build base data
const base: any = {
    text,
    createdById: createdById.toString(),
    moid,
    urn,
  };

  
// If you have a deliberation to connect, add nested relation
if (deliberationId) {
    base.deliberation = { connect: { id: deliberationId } };
  }

  const claim = await prisma.claim.create({ data: base });
  return NextResponse.json({ claim, created: true });
   catch (err: any) {
    console.error('[claims/create] failed', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
