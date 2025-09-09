// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prismaclient';
// import { z } from 'zod';

// const WHY_TTL_HOURS = 24;

// // ---------- Validation ----------
// const zKind = z.enum(['ASSERT','WHY','GROUNDS','RETRACT','CONCEDE']);

// const zPost = z.object({
//   deliberationId: z.string().min(1),
//   targetType: z.enum(['argument','claim','card']),
//   targetId: z.string().min(1),
//   kind: zKind,
//   payload: z.record(z.any()).default({}),          // may include { text | note | brief | locusPath? | childSuffix? }
//   actorId: z.string().optional().nullable(),       // fill from session if you have auth
//   polarity: z.enum(['P','O']).optional(),          // optional override for compiler (WHY defaults to O)
//   locusId: z.string().optional(),                  // optional anchor
//   endsWithDaimon: z.boolean().optional(),          // for immediate † after RETRACT/ASSERT

//   // Ludics glue
//   autoCompile: z.boolean().optional().default(true),
//   autoStep: z.boolean().optional().default(true),
//   phase: z.enum(['focus-P','focus-O','neutral']).optional().default('neutral'),
// });





// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const deliberationId = searchParams.get('deliberationId') || '';
//   const targetType = searchParams.get('targetType') || undefined;
//   const targetId = searchParams.get('targetId') || undefined;

//   if (!deliberationId) return NextResponse.json({ moves: [] });

//   const moves = await prisma.dialogueMove.findMany({
//     where: { deliberationId, ...(targetType && { targetType }), ...(targetId && { targetId }) },
//     orderBy: { createdAt: 'asc' },
//   });
//   return NextResponse.json({ moves });
// }

// export async function POST(req: NextRequest) {
//   const body = await req.json().catch(() => ({}));
//   const parsed = zPost.safeParse(body);
//   if (!parsed.success) {
//     return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
//   }

//   const {
//     deliberationId, targetType, targetId,
//     polarity, locusId, endsWithDaimon = false,
//     autoCompile, autoStep,
//   } = parsed.data;

//   let { kind, payload } = parsed.data;
//   const actorId = parsed.data.actorId ?? 'unknown';

//   // Normalize "CONCEDE" without schema change (as before)
//   if (kind === 'CONCEDE') {
//     kind = 'ASSERT';
//     payload = { ...(payload || {}), as: 'CONCEDE' };
//   }

//   // WHY → attach a soft deadline if none provided
//   if (kind === 'WHY') {
//     const d = new Date();
//     d.setHours(d.getHours() + WHY_TTL_HOURS);
//     payload = { ...(payload || {}), deadlineAt: payload?.deadlineAt || d.toISOString() };
//   }

//   // Persist the move (compiler v2 will use: polarity, locusId, endsWithDaimon, payload.locusPath/childSuffix)
//   const move = await prisma.dialogueMove.create({
//     data: {
//       deliberationId, targetType, targetId, kind,
//       payload: payload as any,
//       actorId,
//       polarity: polarity ?? null,
//       locusId: locusId ?? null,
//       endsWithDaimon,
//     } as any,
//   });

//   // Optional convenience: compile & (optionally) step so the Ludics tab updates immediately
//   let stepResult: any = null;
//   if (autoCompile) {
//     // local call to /api/ludics/compile
//     try {
//       await fetch(new URL('/api/ludics/compile', req.url), {
//         method: 'POST',
//         headers: { 'content-type': 'application/json' },
//         body: JSON.stringify({ deliberationId }),
//       });
//     } catch (_) {}
//   }

//   if (autoStep) {
//     try {
//       // Grab designs (we expect exactly 2 after compile)
//       const designs = await prisma.ludicDesign.findMany({
//         where: { deliberationId },
//         orderBy: { participantId: 'asc' },
//         select: { id: true, participantId: true },
//       });
//       if (designs.length >= 2) {
//         // Proponent → Opponent if present
//         const pro = designs.find(d => d.participantId === 'Proponent') ?? designs[0];
//         const opp = designs.find(d => d.participantId === 'Opponent')  ?? designs[1] ?? designs[0];
//         stepResult = await fetch(new URL('/api/ludics/step', req.url), {
//           method: 'POST',
//           headers: { 'content-type': 'application/json' },
//           body: JSON.stringify({
//             dialogueId: deliberationId,
//             posDesignId: pro.id,
//             negDesignId: opp.id,
//             // You can pass focus phases from the client if you want:
//             // phase: 'neutral'
//           }),
//         }).then(r => r.json()).catch(() => null);
//       }
//     } catch (_) {}
//   }

//   return NextResponse.json({ ok: true, move, stepResult });
// }

// app/api/dialogue/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { stepInteraction } from '@/packages/ludics-engine/stepper';

const WHY_TTL_HOURS = 24;

const Body = z.object({
  deliberationId: z.string().min(1),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(1),
  kind: z.enum(['ASSERT','WHY','GROUNDS','RETRACT','CONCEDE']).or(z.string()), // accept future kinds
  payload: z.any().optional(),
  actorId: z.string().optional(),

  // Ludics glue
  autoCompile: z.boolean().optional().default(true),
  autoStep: z.boolean().optional().default(true),
  phase: z.enum(['focus-P','focus-O','neutral']).optional().default('neutral'),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  let { deliberationId, targetType, targetId, kind, payload, actorId, autoCompile, autoStep, phase } = parsed.data;

  // Normalize "CONCEDE" through ASSERT flag (no schema bump)
  if (kind === 'CONCEDE') {
    kind = 'ASSERT';
    payload = { ...(payload ?? {}), as: 'CONCEDE' };
  }

  // WHY with a default deadline
  if (kind === 'WHY') {
    const d = new Date(); d.setHours(d.getHours() + WHY_TTL_HOURS);
    payload = { ...(payload ?? {}), deadlineAt: payload?.deadlineAt || d.toISOString() };
  }

  const move = await prisma.dialogueMove.create({
    data: { deliberationId, targetType, targetId, kind: kind as any, payload: payload as any, actorId: actorId ?? 'unknown' },
  });

  // === Ludics: compile and step (optional) ===
  let step: any = null;
  if (autoCompile) await compileFromMoves(deliberationId).catch(()=>{});
  if (autoStep) {
    // pick Proponent/Opponent
      const designs = await prisma.ludicDesign.findMany({
          where: { deliberationId },
          orderBy: [{ participantId: 'asc' }, { id: 'asc' }],
          select: { id: true, participantId: true },
        });
    const pos = designs.find(d => d.participantId === 'Proponent') ?? designs[0];
    const neg = designs.find(d => d.participantId === 'Opponent')  ?? designs[1] ?? designs[0];

    if (pos && neg) {
      step = await stepInteraction({
        dialogueId: deliberationId,
        posDesignId: pos.id,
        negDesignId: neg.id,
        phase,
        maxPairs: 1024,
      }).catch(()=>null);
    }
  }

  // Broadcast to any open panels (no-throw)
  try { (globalThis as any).meshBus?.emit?.('dialogue:moves:refresh', { deliberationId }); } catch {}

  return NextResponse.json({ ok: true, move, step });
}
