import { NextRequest, NextResponse } from 'next/server';
import { zStep } from 'packages/ludics-rest/zod';
import { stepInteraction } from 'packages/ludics-engine/stepper';
import { LudicError } from 'packages/ludics-core/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = zStep.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', issues: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const { dialogueId, posDesignId, negDesignId, startPosActId, maxPairs } = parsed.data;
    const res = await stepInteraction({ dialogueId, posDesignId, negDesignId, startPosActId, maxPairs });
    return NextResponse.json({ ok: true, ...res });
  } catch (err: any) {
    if (err instanceof LudicError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message, info: err.info ?? null } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: err?.message ?? 'Unknown error' } },
      { status: 500 },
    );
  }
}
