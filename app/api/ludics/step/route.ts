// app/api/ludics/step/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stepInteraction } from 'packages/ludics-engine/stepper';
import { LudicError } from 'packages/ludics-core/errors';
import { z } from 'zod';

const Body = z.object({
  dialogueId: z.string().min(10),
  posDesignId: z.string().min(10),
  negDesignId: z.string().min(10),
  startPosActId: z.string().optional(),
  phase: z.enum(['focus-P','focus-O','neutral']).optional(),
  fuel: z.number().int().min(1).max(10000).optional().default(2048),
  compositionMode: z.enum(['assoc','partial','spiritual']).optional().default('assoc'),
  testers: z.array(
    z.union([
      z.object({ kind: z.literal('herd-to'), parentPath: z.string(), child: z.string() }),
      z.object({ kind: z.literal('timeout-draw'), atPath: z.string() }),
    ])
  ).optional(),
  focusAt: z.string().optional(), // optional pin

});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { dialogueId, posDesignId, negDesignId, startPosActId, phase, fuel, compositionMode, testers = [] } = parsed.data;

    // Map testers → stepper virtuals
    // const testers = parsed.data.testers ?? [];
const virtuals = testers.length ? (await import('@/packages/ludics-engine/testers')).buildVirtuals(testers) : { virtualNegPaths: [], drawAtPaths: [] };


    const res = await stepInteraction({
      dialogueId, posDesignId, negDesignId,
      startPosActId,
      phase: phase ?? 'neutral',
      maxPairs: fuel,
      compositionMode,
      virtualNegPaths: virtuals.virtualNegPaths,
      drawAtPaths: virtuals.drawAtPaths,
    });


    // const virtualNegPaths: string[] = [];
    // const drawAtPaths: string[] = [];
    // // for (const t of testers) {
    // //   if (t.kind === 'herd-to') virtualNegPaths.push(`${t.parentPath}.${t.child}`);
    // //   if (t.kind === 'timeout-draw') drawAtPaths.push(t.atPath);
    // // }

    // const res = await stepInteraction({
    //   dialogueId, posDesignId, negDesignId,
    //   startPosActId,
    //   phase: phase ?? 'neutral',
    //   maxPairs: fuel,
    //   compositionMode,
    //   virtualNegPaths: virtuals.virtualNegPaths,
    //   drawAtPaths: virtuals.drawAtPaths,
    // });

    return NextResponse.json({ ok:true, ...res }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    if (err instanceof LudicError) {
      return NextResponse.json({ ok:false, error:{ code: err.code, message: err.message, info: err.info ?? null }}, { status: 400 });
    }
    return NextResponse.json({ ok:false, error:{ code:'INTERNAL', message: err?.message ?? 'Unknown error' }}, { status: 500 });
  }
}
