import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setEntitlement } from 'packages/ludics-engine/commitments';
import { Hooks } from 'packages/ludics-engine/hooks';

const Body = z.object({
  dialogueId: z.string().min(5),
  ownerId: z.string().min(1),
  label: z.string().min(1),
  entitled: z.boolean(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  const { dialogueId, ownerId, label, entitled } = parsed.data;
  const res = await setEntitlement(dialogueId, ownerId, label, entitled);
  try { Hooks.emitCSUpdated({ ownerId, csId: null, entitlementChanged: { label, entitled } }); } catch {}
  return NextResponse.json(res);
}
