// // app/api/dialogue/move/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prismaclient';
// import { z } from 'zod';
// import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
// import { stepInteraction } from '@/packages/ludics-engine/stepper';

// const WHY_TTL_HOURS = 24;

// const Body = z.object({
//   deliberationId: z.string().min(1),
//   targetType: z.enum(['argument', 'claim', 'card']),
//   targetId: z.string().min(1),
//   kind: z.enum(['ASSERT', 'WHY', 'GROUNDS', 'RETRACT', 'CONCEDE']).or(z.string()),
//   payload: z.any().optional(),
//   actorId: z.string().optional(),

//   // Ludics glue
//   autoCompile: z.boolean().optional().default(true),
//   autoStep: z.boolean().optional().default(true),
//   phase: z.enum(['focus-P', 'focus-O', 'neutral']).optional().default('neutral'),
// });

// const cqKey = (p: any) => String(p?.cqId ?? p?.schemeKey ?? 'default');

// export async function POST(req: NextRequest) {
//   const parsed = Body.safeParse(await req.json().catch(() => ({})));
//   if (!parsed.success) {
//     return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
//   }

//   let {
//     deliberationId,
//     targetType,
//     targetId,
//     kind,
//     payload,
//     actorId,
//     autoCompile,
//     autoStep,
//     phase,
//   } = parsed.data;

//   // Concede is an ASSERT with a marker
//   if (kind === 'CONCEDE') {
//     kind = 'ASSERT';
//     payload = { ...(payload ?? {}), as: 'CONCEDE' };
//   }

//   // WHY gets a deadline (TTL) if missing
//   if (kind === 'WHY') {
//     const d = new Date();
//     d.setHours(d.getHours() + WHY_TTL_HOURS);
//     payload = { ...(payload ?? {}), deadlineAt: payload?.deadlineAt || d.toISOString() };
//   }

//   // --- Idempotency for WHY: reuse a very recent identical WHY (same CQ key) ---
//   let dedup = false;
//   let move: any = null;

//   if (kind === 'WHY') {
//     const since = new Date(Date.now() - 10_000); // 10s window
//     const recent = await prisma.dialogueMove.findFirst({
//       where: {
//         deliberationId,
//         targetType,
//         targetId,
//         kind: 'WHY',
//         createdAt: { gte: since },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//     if (recent && cqKey(recent.payload) === cqKey(payload)) {
//       move = recent;
//       dedup = true;
//     }
//   }

//   if (!move) {
//     move = await prisma.dialogueMove.create({
//       data: {
//         deliberationId,
//         targetType,
//         targetId,
//         kind: kind as any,
//         payload: payload as any,
//         actorId: actorId ?? 'unknown',
//       },
//     });
//   }

//   // --- Ludics: compile & optional step ---
//   let step: any = null;
//   if (autoCompile) await compileFromMoves(deliberationId).catch(() => {});
//   if (autoStep) {
//     const designs = await prisma.ludicDesign.findMany({
//       where: { deliberationId },
//       orderBy: [{ participantId: 'asc' }, { id: 'asc' }],
//       select: { id: true, participantId: true },
//     });
//     const pos = designs.find((d) => d.participantId === 'Proponent') ?? designs[0];
//     const neg = designs.find((d) => d.participantId === 'Opponent') ?? designs[1] ?? designs[0];
//     if (pos && neg) {
//       step = await stepInteraction({
//         dialogueId: deliberationId,
//         posDesignId: pos.id,
//         negDesignId: neg.id,
//         phase,
//         maxPairs: 1024,
//       }).catch(() => null);
//     }
//   }

//   try {
//     (globalThis as any).meshBus?.emit?.('dialogue:moves:refresh', { deliberationId });
//   } catch {}

//   return NextResponse.json({ ok: true, move, step, dedup });
// }

// app/api/dialogue/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import { getCurrentUserId } from '@/lib/serverutils';
import { Prisma } from '@prisma/client';


const WHY_TTL_HOURS = 24;

const Body = z.object({
  deliberationId: z.string().min(1),
  targetType: z.enum(['argument', 'claim', 'card']),
  targetId: z.string().min(1),
  kind: z.enum(['ASSERT', 'WHY', 'GROUNDS', 'RETRACT', 'CONCEDE']).or(z.string()),
  payload: z.any().optional(),
  actorId: z.string().optional(),
  autoCompile: z.boolean().optional().default(true),
  autoStep: z.boolean().optional().default(true),
  phase: z.enum(['focus-P','focus-O','neutral']).optional().default('neutral'),
});

// Stable key used in DB unique index. We allow multiple GROUNDS per CQ by
// including a hash of expression; WHY is strictly idempotent per (target, cqKey).
function cqKey(p: any) {
  return String(p?.cqId ?? p?.schemeKey ?? 'default');
}
function hashExpr(s?: string) {
  if (!s) return '∅';
  let h = 0; for (let i = 0; i < s.length; i++) h = ((h<<5) - h) + s.charCodeAt(i) | 0;
  return String(h);
}
function makeSignature(kind: string, targetType: string, targetId: string, payload: any) {
  if (kind === 'WHY') {
    return ['WHY', targetType, targetId, cqKey(payload)].join(':');
  }
  if (kind === 'GROUNDS') {
    const key = cqKey(payload);
    const locus = String(payload?.locusPath ?? '');
    const child = String(payload?.childSuffix ?? '');
    const hexpr = hashExpr(String(payload?.expression ?? payload?.text ?? payload?.note ?? ''));
    return ['GROUNDS', targetType, targetId, key, locus, child, hexpr].join(':');
  }
  if (kind === 'ASSERT' && payload?.as === 'CONCEDE') {
    return ['CONCEDE', targetType, targetId, hashExpr(String(payload?.expression ?? payload?.text ?? ''))].join(':');
  }
  return [kind, targetType, targetId, Date.now().toString(36), Math.random().toString(36).slice(2,8)].join(':');
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let { deliberationId, targetType, targetId, kind, payload, actorId, autoCompile, autoStep, phase } = parsed.data;

  const userId = await getCurrentUserId().catch(() => null);
actorId = actorId ?? userId ?? 'unknown';

  // CONCEDE folds into ASSERT with marker
  if (kind === 'CONCEDE') { kind = 'ASSERT'; payload = { ...(payload ?? {}), as: 'CONCEDE' }; }

  // WHY deadline TTL
  if (kind === 'WHY') {
    const d = new Date(); d.setHours(d.getHours() + WHY_TTL_HOURS);
    payload = { ...(payload ?? {}), deadlineAt: payload?.deadlineAt || d.toISOString() };
  }

  const signature = makeSignature(kind, targetType, targetId, payload);

  // Try insert; on unique violation, fetch existing and continue
  let move: any, dedup = false;
  try {
    move = await prisma.dialogueMove.create({
      data: { deliberationId, targetType, targetId, kind, payload, actorId: actorId ?? 'unknown', signature },
    });
  } catch (e: any) {
         if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
             // compound unique on (deliberationId, signature)
             move = await prisma.dialogueMove.findUnique({
               where: { deliberationId_signature: { deliberationId, signature } },
             });
      dedup = true;
    } else {
      throw e;
    }
  }

  // Compile & optional step
  let step: any = null;
  if (autoCompile) await compileFromMoves(deliberationId).catch(() => {});
  if (autoStep) {
    const designs = await prisma.ludicDesign.findMany({
      where: { deliberationId },
      orderBy: [{ participantId:'asc' }, { id:'asc' }],
      select: { id:true, participantId:true },
    });
    const pos = designs.find(d => d.participantId === 'Proponent') ?? designs[0];
    const neg = designs.find(d => d.participantId === 'Opponent')  ?? designs[1] ?? designs[0];
    if (pos && neg) {
      step = await stepInteraction({
        dialogueId: deliberationId,
        posDesignId: pos.id, negDesignId: neg.id,
        phase, maxPairs: 1024,
      }).catch(() => null);
    }
  }

  try { (globalThis as any).meshBus?.emit?.('dialogue:moves:refresh', { deliberationId }); } catch {}

  return NextResponse.json({ ok: true, move, step, dedup });
}
