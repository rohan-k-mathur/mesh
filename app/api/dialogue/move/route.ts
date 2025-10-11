// app/api/dialogue/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import crypto from "crypto";
import { Prisma } from '@prisma/client';
import { getCurrentUserId } from '@/lib/serverutils';
import { computeLegalMoves } from '@/lib/dialogue/legalMovesServer';
import { TargetType } from '@prisma/client';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';
import { stepInteraction } from '@/packages/ludics-engine/stepper';
import type { MovePayload, DialogueAct } from '@/packages/ludics-core/types';
import { validateMove } from '@/lib/dialogue/validate';
 import { onDialogueMove } from '@/lib/issues/hooks';
import type { MoveKind } from '@/lib/dialogue/types';
import { emitBus } from '@/lib/server/bus'; // ✅ use the helper only

function sig(s: string) { return crypto.createHash("sha1").update(s, "utf8").digest("hex"); }
const WHY_TTL_HOURS = 24;

const Body = z.object({
  deliberationId: z.string().min(1),
  targetType: z.enum(['argument','claim','card']),
  targetId: z.string().min(1),
 kind: z.enum(['ASSERT','WHY','GROUNDS','RETRACT','CONCEDE','CLOSE','THEREFORE','SUPPOSE','DISCHARGE']),
  payload: z.any().optional(),
  autoCompile: z.boolean().optional().default(true),
  autoStep: z.boolean().optional().default(true),
  phase: z.enum(['focus-P','focus-O','neutral']).optional().default('neutral'),
  replyToMoveId: z.string().optional(),
  replyTarget: z.enum(['claim','argument','premise','link','presupposition']).optional(),
 });


function cqKey(p: any) { return String(p?.cqId ?? p?.schemeKey ?? 'default'); }
function hashExpr(s?: string) { if (!s) return '∅'; let h=0; for (let i=0;i<s.length;i++) h=((h<<5)-h)+s.charCodeAt(i)|0; return String(h); }
// function makeSignature(kind: string, targetType: string, targetId: string, payload: any) {
//   if (kind === 'WHY') return ['WHY', targetType, targetId, cqKey(payload)].join(':');
//   if (kind === 'GROUNDS') {
//     const key = cqKey(payload);
//     const locus = String(payload?.locusPath ?? '');
//     const child = String(payload?.childSuffix ?? '');
//     const hexpr = hashExpr(String(payload?.expression ?? payload?.text ?? payload?.note ?? ''));
//     return ['GROUNDS', targetType, targetId, key, locus, child, hexpr].join(':');
//   }
//   if (kind === 'ASSERT' && payload?.as === 'CONCEDE') {
//     return ['CONCEDE', targetType, targetId, hashExpr(String(payload?.expression ?? payload?.text ?? ''))].join(':');
//   }
//   if (kind === 'CLOSE') {
//     const locus = String(payload?.locusPath ?? '0');
//     return ['CLOSE', targetType, targetId, locus].join(':');
//   }
//   return [kind, targetType, targetId, Date.now().toString(36), Math.random().toString(36).slice(2,8)].join(':');
// }

function synthesizeActs(kind: string, payload: any): DialogueAct[] {
  const locus = String(payload?.locusPath ?? '0');
  const expr  = String(payload?.expression ?? payload?.brief ?? payload?.note ?? '').slice(0, 2000);

  if (kind === 'WHY')     return [{ polarity:'neg', locusPath:locus, openings:[], expression: expr }];
   if (kind === 'THEREFORE') return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr, additive:false }];
 if (kind === 'SUPPOSE')   return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr || '+supposition', additive:false }];
 if (kind === 'DISCHARGE') return [{ polarity:'pos', locusPath:locus, openings:[], expression: 'discharge', additive:false }];
  if (kind === 'GROUNDS') return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr, additive:false }];
  if (payload?.as === 'CONCEDE') // 👈 key off marker, not kind
    return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr || 'conceded' }];
  if (kind === 'CLOSE')   return [{ polarity:'daimon', locusPath:locus, openings:[], expression:'†' }];
  return [{ polarity:'pos', locusPath:locus, openings:[], expression: expr }];
}

function makeSignature(kind: string, targetType: string, targetId: string, payload: any) {
  if (kind === 'WHY') return ['WHY', targetType, targetId, cqKey(payload)].join(':');
   if (kind === 'THEREFORE') return ['THEREFORE', targetType, targetId, String(payload?.locusPath ?? '0'), hashExpr(String(payload?.expression ?? ''))].join(':');
 if (kind === 'SUPPOSE')   return ['SUPPOSE', targetType, targetId, String(payload?.locusPath ?? '0'), hashExpr(String(payload?.expression ?? ''))].join(':');
 if (kind === 'DISCHARGE') return ['DISCHARGE', targetType, targetId, String(payload?.locusPath ?? '0')].join(':');

  if (kind === 'GROUNDS') {
    const key = cqKey(payload);
    const locus = String(payload?.locusPath ?? '');
    const child = String(payload?.childSuffix ?? '');
    const hexpr = hashExpr(String(payload?.expression ?? payload?.text ?? payload?.note ?? ''));
    return ['GROUNDS', targetType, targetId, key, locus, child, hexpr].join(':');
  }
  if (payload?.as === 'CONCEDE') { // 👈 again, use the marker
    return ['CONCEDE', targetType, targetId, hashExpr(String(payload?.expression ?? payload?.text ?? ''))].join(':');
  }
  if (kind === 'CLOSE') {
    const locus = String(payload?.locusPath ?? '0');
    return ['CLOSE', targetType, targetId, locus].join(':');
  }
  return [kind, targetType, targetId, Date.now().toString(36), Math.random().toString(36).slice(2,8)].join(':');
}


export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // let { deliberationId, targetType, targetId, kind, payload, autoCompile, autoStep, phase } = parsed.data;
 let { deliberationId, targetType, targetId, kind, payload, autoCompile, autoStep, phase, replyToMoveId, replyTarget } = parsed.data;

  // normalize payload object + clamp + locus
  if (!payload || typeof payload !== 'object') payload = {};
  ['expression','brief','note'].forEach((k) => {
    if (typeof payload[k] === 'string') payload[k] = payload[k].slice(0, 2000);
  });
  if (typeof payload.locusPath === 'string') {
    payload.locusPath = payload.locusPath.trim() || '0';
  }
  if (kind === 'GROUNDS' && !payload.locusPath) payload.locusPath = '0';

  const userId = await getCurrentUserId().catch(() => null);
const actorId = String(userId ?? 'unknown');


    // ---- Protocol validator (R1…R7) ----
    const legal = await validateMove({ deliberationId, actorId, kind, targetType, targetId, replyToMoveId, replyTarget, payload });
    if (!('ok' in legal) || !legal.ok) {
      return NextResponse.json({ ok:false, reasonCodes: legal.reasons }, { status: 409 });
    }

// Enforce allowed shape (R4/R5/R7)
const allowed = await computeLegalMoves({
  deliberationId, targetType, targetId, locusPath: payload?.locusPath ?? '0', actorId
});

const allowedActive = allowed.moves.filter(m => !m.disabled);
const ok = allowedActive.some(m => {
  const kindOk = m.kind === kind;
  const locusOk = !m.payload?.locusPath || m.payload.locusPath === (payload?.locusPath ?? '0');
  const cqOk = !m.payload?.cqId || m.payload.cqId === (payload?.cqId ?? payload?.schemeKey);
  const postAsOk = !m.postAs || (m.postAs.targetType === targetType && m.postAs.targetId === targetId);
  return kindOk && locusOk && cqOk && postAsOk;
});

if (!ok) {
  return NextResponse.json({ error: 'MOVE_ILLEGAL', details: allowed }, { status: 400 });
}

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
const originalKind = kind;
 if (originalKind === 'CONCEDE') { kind = 'ASSERT'; payload = { ...(payload ?? {}), as: 'CONCEDE' }; }
  const wasConcede = originalKind === 'CONCEDE' || payload?.as === 'CONCEDE';

  // ---- CQStatus integration for WHY / GROUNDS ----
try {
  const schemeKey = String(payload?.cqId ?? payload?.schemeKey ?? '');
  if (kind === 'WHY' && schemeKey) {
    await prisma.cQStatus.upsert({
      where: { targetType_targetId_schemeKey_cqKey: { targetType: 'argument' as TargetType, targetId, schemeKey, cqKey: schemeKey } },
      create: { targetType: 'argument' as TargetType, targetId, argumentId: targetType === 'argument' ? targetId : null,
                status: 'open', schemeKey, cqKey: schemeKey, satisfied: false, createdById: actorId },
      update: { status: 'open', satisfied: false },
    });
  } else if (kind === 'GROUNDS' && schemeKey) {
    await prisma.cQStatus.updateMany({
      where: { targetType: 'argument' as TargetType, targetId, schemeKey, cqKey: schemeKey },
      data: { status: 'answered', satisfied: true },
    });
  }
} catch {}

  // WHY TTL
  if (kind === 'WHY') {
    const d = new Date(); d.setHours(d.getHours() + WHY_TTL_HOURS);
    payload = { ...(payload ?? {}), deadlineAt: payload?.deadlineAt || d.toISOString() };
  }

  // Ensure acts
  const acts = Array.isArray(payload?.acts) && payload.acts.length ? payload.acts : synthesizeActs(kind, payload);
  (payload as MovePayload).acts = acts;


  // signature
  const signature = makeSignature(kind, targetType, targetId, payload);

  // write (with P2002 de-dup)
  let move: any, dedup = false;
  try {
    move = await prisma.dialogueMove.create({
      data: { deliberationId, targetType, targetId, kind, payload, actorId, signature, replyToMoveId, replyTarget },
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

  // after creating `move`:
  async function resolveProposition(): Promise<string | null> {
    try {
      if (targetType === 'claim') {
        const c = await prisma.claim.findUnique({ where: { id: targetId }, select: { text:true } });
        if (c?.text) return c.text;
      } else if (targetType === 'argument') {
        const a = await prisma.argument.findUnique({ where: { id: targetId }, select: { text:true } });
        if (a?.text) return a.text;
      }
    } catch {}
    const expr = String(payload?.expression ?? payload?.brief ?? payload?.note ?? '').trim();
    return expr || null;
  }

  const prop = await resolveProposition();

  if (prop) {
   if (wasConcede) {
      await prisma.commitment.upsert({
        where: { deliberationId_participantId_proposition: { deliberationId, participantId: actorId, proposition: prop } },
        update: { isRetracted: false },
        create: { deliberationId, participantId: actorId, proposition: prop, isRetracted: false },
      }).catch(() => {});
      emitBus("dialogue:cs:refresh", { deliberationId, participantId: actorId });

    }
    if (kind === 'RETRACT') {
      await prisma.commitment.updateMany({
        where: { deliberationId, participantId: actorId, proposition: prop, isRetracted: false },
        data: { isRetracted: true },
      }).catch(() => {});
      emitBus("dialogue:cs:refresh", { deliberationId, participantId: actorId });

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

  try {
    await onDialogueMove({ deliberationId, targetType, targetId, kind, payload });
    emitBus('issues:changed', { deliberationId });
  } catch {}
  return NextResponse.json({ ok: true, move, step, dedup });
}


