import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { faxDelocate } from 'packages/ludics-engine/fax';

const zBody = z.object({
  dialogueId: z.string(),
  fromLocusPath: z.string(),
  toLocusPath: z.string(),
});

export async function POST(req: NextRequest) {
  const parsed = zBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  const { dialogueId, fromLocusPath, toLocusPath } = parsed.data;
  const res = await faxDelocate(dialogueId, fromLocusPath, toLocusPath);
  return NextResponse.json(res);
}
