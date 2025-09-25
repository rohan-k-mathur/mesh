// app/api/dialogue/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import crypto from "crypto";
import { Prisma } from '@prisma/client';
import { getCurrentUserId } from '@/lib/serverutils';
import { computeLegalMoves } from '@/lib/dialogue/legalMovesServer'; // new

import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import type { MovePayload, DialogueAct } from '@/packages/ludics-core/types';

import { emitBus } from '@/lib/server/bus'; // ✅ use the helper only

function sig(s: string) { return crypto.createHash("sha1").update(s, "utf8").digest("hex"); }
const WHY_TTL_HOURS = 24;

// classify
function isAttack(kind: string, payload: any) {
  if (kind === 'WHY') return true;
  if (kind === 'GROUNDS') return true; // a defensive move that answers an attack, but keeps the branch live until closed
  return false;
}
function isSurrender(kind: string, payload: any) {
  return kind === 'CONCEDE' || (kind === 'ASSERT' && payload?.as === 'CONCEDE') || kind === 'RETRACT';
}

// find open WHY keys for this target (latest-by-key WHERE latest is WHY)
async function openWhyKeys(prisma: any, deliberationId: string, targetType: string, targetId: string) {
  const rows = await prisma.dialogueMove.findMany({
    where: { deliberationId, targetType, targetId, kind: { in: ['WHY','GROUNDS'] } },
    orderBy: { createdAt: 'asc' },
    select: { kind:true, payload:true, createdAt:true },
  });
  const latestByKey = new Map<string, { kind:'WHY'|'GROUNDS'; createdAt:Date }>();
  for (const r of rows as any[]) {
    const key = String(r?.payload?.cqId ?? r?.payload?.schemeKey ?? 'default');
    const prev = latestByKey.get(key);
    if (!prev || r.createdAt > prev.createdAt) latestByKey.set(key, { kind:r.kind, createdAt:r.createdAt });
  }
  return [...latestByKey.entries()].filter(([,v]) => v.kind === 'WHY').map(([k]) => k);
}

// check "target surrendered?"
async function targetSurrendered(prisma: any, deliberationId: string, targetType: string, targetId: string) {
  const exists = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId, targetType, targetId,
      OR: [{ kind:'CONCEDE' }, { kind:'ASSERT', payload: { path:['as'], equals:'CONCEDE' } }]
    },
    select: { id:true }
  });
  return !!exists;
}

const Body = z.object({
  deliberationId: z.string().min(1),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(1),
  kind: z.enum(['ASSERT','WHY','GROUNDS','RETRACT','CONCEDE','CLOSE']),
  payload: z.any().optional(),
  autoCompile: z.boolean().optional().default(true),
  autoStep: z.boolean().optional().default(true),
  phase: z.enum(['focus-P','focus-O','neutral']).optional().default('neutral'),
});

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

function synthesizeActs(kind: string, payload: any): DialogueAct[] {
  const locus = String(payload?.locusPath ?? '0');
  const expr  = String(payload?.expression ?? payload?.brief ?? payload?.note ?? '').slice(0, 2000);
  if (kind === 'WHY')     return [{ polarity:'neg', locusPath:locus, openings:[], expression: expr }];
  if (kind === 'GROUNDS') return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr, additive:false }];
  if (kind === 'CONCEDE' || (kind === 'ASSERT' && payload?.as === 'CONCEDE'))
                           return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr || 'conceded' }];
  if (kind === 'CLOSE')   return [{ polarity:'daimon', locusPath:locus, openings:[], expression:'†' }];
  return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr }];
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let { deliberationId, targetType, targetId, kind, payload, autoCompile, autoStep, phase } = parsed.data;

  // normalize payload object + clamp + locus
  if (!payload || typeof payload !== 'object') payload = {};
  ['expression','brief','note'].forEach((k) => {
    if (typeof payload[k] === 'string') payload[k] = payload[k].slice(0, 2000);
  });
  if (typeof payload.locusPath === 'string') {
    payload.locusPath = payload.locusPath.trim() || '0';
  }
  if (kind === 'GROUNDS' && !payload.locusPath) payload.locusPath = '0';

  // optional: verify target belongs to deliberation
  try {
    if (targetType === 'argument') {
      const ok = await prisma.argument.findFirst({ where: { id: targetId, deliberationId }, select: { id:true } });
      if (!ok) return NextResponse.json({ error:'TARGET_MISMATCH' }, { status: 400 });
    } else if (targetType === 'claim') {
      const ok = await prisma.claim.findFirst({ where: { id: targetId, deliberationId }, select: { id:true } });
      if (!ok) return NextResponse.json({ error:'TARGET_MISMATCH' }, { status: 400 });
    } else if (targetType === 'card') {
      const ok = await prisma.deliberationCard.findFirst({ where: { id: targetId, deliberationId }, select: { id: true } });
      if (!ok) return NextResponse.json({ error:'TARGET_MISMATCH' }, { status: 400 });
    }
  } catch {}

  // map CONCEDE to ASSERT + marker (compat)
  if (kind === 'CONCEDE') { kind = 'ASSERT'; payload = { ...(payload ?? {}), as: 'CONCEDE' }; }

  // WHY TTL
  if (kind === 'WHY') {
    const d = new Date(); d.setHours(d.getHours() + WHY_TTL_HOURS);
    payload = { ...(payload ?? {}), deadlineAt: payload?.deadlineAt || d.toISOString() };
  }

  // Ensure acts
  const acts = Array.isArray(payload?.acts) && payload.acts.length ? payload.acts : synthesizeActs(kind, payload);
  (payload as MovePayload).acts = acts;

  // actor
  const userId = await getCurrentUserId().catch(() => null);
  const actorId = String(userId ?? 'unknown');

  // signature
  const signature = makeSignature(kind, targetType, targetId, payload);

  
const allowed = await computeLegalMoves({ deliberationId, targetType, targetId, locusPath: payload?.locusPath });
const ok = allowed.moves.some(m =>
  m.kind === kind &&
  (!m.payload || !m.payload.cqId || m.payload.cqId === (payload?.cqId ?? payload?.schemeKey))
  && (!m.payload?.locusPath || m.payload.locusPath === payload?.locusPath)
);
if (!ok) {
  return NextResponse.json({ error: 'MOVE_ILLEGAL', details: allowed }, { status: 400 });
}

// role: get target author for self/role guard
  let targetAuthorId: string | null = null;
  if (targetType === 'argument') {
    const a = await prisma.argument.findFirst({ where: { id: targetId }, select: { authorId: true } });
    targetAuthorId = a?.authorId ?? null;
  } else if (targetType === 'claim') {
    const c = await prisma.claim.findFirst({ where: { id: targetId }, select: { createdById: true } });
    targetAuthorId = c?.createdById ?? null;
  }

  // R5: no attack after surrender
  if (isAttack(kind, payload)) {
    const surrendered = await targetSurrendered(prisma, deliberationId, targetType, targetId);
    if (surrendered) {
      return NextResponse.json({ ok:false, error:'TARGET_SURRENDERED' }, { status: 409 });
    }
  }

  // R7 + role guard:
  // - WHY must be asked by someone other than the target's author
  // - GROUNDS must only be posted if there is an open WHY for its key, and ideally by target's author
  if (kind === 'WHY' && targetAuthorId && actorId === String(targetAuthorId)) {
    return NextResponse.json({ ok:false, error:'CANNOT_ASK_SELF' }, { status: 403 });
  }

  if (kind === 'GROUNDS') {
    // require open WHY for same key on this target
    const key = String(payload?.cqId ?? payload?.schemeKey ?? 'default');
    const openKeys = await openWhyKeys(prisma, deliberationId, targetType, targetId);
    if (!openKeys.includes(key)) {
      return NextResponse.json({ ok:false, error:'NO_OPEN_WHY_FOR_KEY', key }, { status: 409 });
    }
    // prefer that the original author answers; soft guard with warning when unknown
    if (targetAuthorId && actorId !== String(targetAuthorId)) {
      return NextResponse.json({ ok:false, error:'ONLY_AUTHOR_MAY_ANSWER', authorId: targetAuthorId }, { status: 403 });
    }
  }


  // write (with P2002 de-dup)
  let move: any, dedup = false;
  try {
    move = await prisma.dialogueMove.create({
      data: { deliberationId, targetType, targetId, kind, payload, actorId, signature },
    });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      move = await prisma.dialogueMove.findUnique({
        where: { dm_unique_signature: { deliberationId, signature } },
      });
      dedup = true;
    } else {
      throw e;
    }
  }

  // compile & step
  let step: any = null;
  if (autoCompile && !(dedup && (kind === 'WHY' || kind === 'GROUNDS'))) {
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
      step = await stepInteraction({ dialogueId: deliberationId, posDesignId: pos.id, negDesignId: neg.id, phase, maxPairs: 1024 }).catch(() => null);
    }
  }

  // bus/SSE
  emitBus("dialogue:changed", { deliberationId, moveId: move?.id, kind });         // ✅ fix: move.id
  emitBus("dialogue:moves:refresh", { deliberationId });

  return NextResponse.json({ ok: true, move, step, dedup });
}
