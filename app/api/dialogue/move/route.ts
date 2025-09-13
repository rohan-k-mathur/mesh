// app/api/dialogue/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import { getCurrentUserId } from '@/lib/serverutils';
import { Prisma } from '@prisma/client';
import type { DialogueAct, MovePayload } from '@/types/shared'; // NEW

const WHY_TTL_HOURS = 24;

const Body = z.object({
  deliberationId: z.string().min(1),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(1),
  // NEW: add 'CLOSE' which maps to a daimon act
  kind: z.enum(['ASSERT','WHY','GROUNDS','RETRACT','CONCEDE','CLOSE']),
  payload: z.any().optional(),
  autoCompile: z.boolean().optional().default(true),
  autoStep: z.boolean().optional().default(true),
  phase: z.enum(['focus-P','focus-O','neutral']).optional().default('neutral'),
});

// --- signature helpers (unchanged from your version) ---
function cqKey(p: any) { return String(p?.cqId ?? p?.schemeKey ?? 'default'); }
function hashExpr(s?: string) { if (!s) return '∅'; let h=0; for (let i=0;i<s.length;i++) h=((h<<5)-h)+s.charCodeAt(i)|0; return String(h); }
function makeSignature(kind: string, targetType: string, targetId: string, payload: any) {
  if (kind === 'WHY') return ['WHY', targetType, targetId, cqKey(payload)].join(':');
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
  if (kind === 'CLOSE') {
    const locus = String(payload?.locusPath ?? '0');
    return ['CLOSE', targetType, targetId, locus].join(':');
  }
  return [kind, targetType, targetId, Date.now().toString(36), Math.random().toString(36).slice(2,8)].join(':');
}

// NEW: synthesize acts[] from legacy kinds if caller didn't pass payload.acts
function synthesizeActs(kind: string, payload: any): DialogueAct[] {
  const locus = String(payload?.locusPath ?? '0');
  const expr  = String(payload?.expression ?? payload?.brief ?? payload?.note ?? '');
  if (kind === 'WHY') {
    return [{ polarity:'neg', locusPath:locus, openings:[], expression: expr }];
  }
  if (kind === 'GROUNDS') {
    return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr, additive:false }];
  }
  if (kind === 'CONCEDE' || (kind === 'ASSERT' && payload?.as === 'CONCEDE')) {
    return [
      { polarity:'pos', locusPath:locus, openings:['/⊥'], expression: expr }, // content
      { polarity:'neg', locusPath:'/⊥', openings:[], expression:'conceded' } // close that line
    ];
  }
  if (kind === 'CLOSE') {
    return [{ polarity:'daimon', locusPath:locus, openings:[], expression:'†' }];
  }
  // Default ASSERT/replies -> a single positive act
  return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr }];
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let { deliberationId, targetType, targetId, kind, payload, autoCompile, autoStep, phase } = parsed.data;

  // normalize payload to object + defaults
  if (!payload || typeof payload !== 'object') payload = {};
  if (kind === 'GROUNDS' && !payload.locusPath) payload.locusPath = '0';

  // optional: verify target belongs to deliberation
  try {
    if (targetType === 'argument') {
      const ok = await prisma.argument.findFirst({ where: { id: targetId, deliberationId }, select: { id:true } });
      if (!ok) return NextResponse.json({ error:'TARGET_MISMATCH' }, { status: 400 });
    } else if (targetType === 'claim') {
      const ok = await prisma.claim.findFirst({ where: { id: targetId, deliberationId }, select: { id:true } });
      if (!ok) return NextResponse.json({ error:'TARGET_MISMATCH' }, { status: 400 });
    }
  } catch {}

  // CONCEDE remains an ASSERT with marker (compat), but we also synthesize acts (see below)
  if (kind === 'CONCEDE') { kind = 'ASSERT'; payload = { ...(payload ?? {}), as: 'CONCEDE' }; }

  // WHY deadline TTL
  if (kind === 'WHY') {
    const d = new Date(); d.setHours(d.getHours() + WHY_TTL_HOURS);
    payload = { ...(payload ?? {}), deadlineAt: payload?.deadlineAt || d.toISOString() };
  }

  // Ensure acts[] present
  const acts: DialogueAct[] = Array.isArray(payload?.acts) && payload.acts.length
    ? payload.acts
    : synthesizeActs(kind, payload);
  (payload as MovePayload).acts = acts;

  // actor
  const userId = await getCurrentUserId().catch(() => null);
  const actorId = String(userId ?? 'unknown');

  const signature = makeSignature(kind, targetType, targetId, payload);

  let move: any, dedup = false;
  try {
    move = await prisma.dialogueMove.create({
      data: { deliberationId, targetType, targetId, kind, payload, actorId, signature },
    });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // Compound unique – fetch existing
      move = await prisma.dialogueMove.findUnique({
        where: { dm_unique_signature: { deliberationId, signature } },
      });
      dedup = true;
    } else {
      throw e;
    }
  }

  // Compile & optional step
  let step: any = null;
  if (autoCompile && !(dedup && kind === 'WHY')) {
    await compileFromMoves(deliberationId).catch(() => {});
  }
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
        dialogueId: deliberationId, posDesignId: pos.id, negDesignId: neg.id,
        phase, maxPairs: 1024,
      }).catch(() => null);
    }
  }

  try { (globalThis as any).meshBus?.emit?.('dialogue:moves:refresh', { deliberationId }); } catch {}
  return NextResponse.json({ ok: true, move, step, dedup });
}
