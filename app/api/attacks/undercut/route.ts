import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
// If you have auth, wire it; otherwise default to 'system'
import { getCurrentUserId } from '@/lib/serverutils';
import { recomputeGroundedForDelib } from '@/lib/ceg/grounded';
import { mintClaimMoid } from '@/lib/ids/mintMoid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Body = z.object({
  deliberationId: z.string().min(6),
  toArgumentId: z.string().min(6),
  targetInferenceId: z.string().min(6),
  fromArgumentId: z.string().min(6).optional(),
  fromText: z.string().min(3).optional(),  // create a fresh arg if no fromArgumentId
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) {
    return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { deliberationId, toArgumentId, targetInferenceId, fromArgumentId, fromText } = parsed.data;
const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  let fromId = fromArgumentId ?? null;
  if (!fromId) {
    if (!fromText) return NextResponse.json({ ok:false, error:'Either fromArgumentId or fromText is required' }, { status: 400 });
    const a = await prisma.argument.create({
      data: { deliberationId, text: fromText, authorId: String(userId) },
      select: { id:true }
    });
    fromId = a.id;
  }

  // (optional) sanity: ensure the inference belongs to a diagram on `toArgumentId` if you persist that mapping

  const edge = await prisma.argumentEdge.create({
    data: {
      deliberationId,
      fromArgumentId: fromId!,
      toArgumentId,
      type: 'undercut' as any,
      attackSubtype: 'UNDERCUT' as any,
      targetScope: 'inference' as any,
      targetInferenceId,
      createdById: String(userId),
    },
    select: { id:true }
  });

  // small broadcast if your UI listens
  try { window?.dispatchEvent?.(new CustomEvent('dialogue:changed')); } catch {}

  return NextResponse.json({ ok:true, edge }, { headers: { 'Cache-Control':'no-store' } });
}
