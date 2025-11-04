// // app/api/arguments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
// import { getServerSession } from 'next-auth'; // if you use NextAuth
import { getUserFromCookies } from '@/lib/serverutils';
import { TargetType } from '@prisma/client';
import { inferAndAssignScheme } from '@/lib/argumentation/schemeInference';
import { ensureArgumentSupportInTx } from '@/lib/arguments/ensure-support';
const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

type SlotValidators = Record<string, { expects?: string; required?: boolean }>;
type SlotsPayload   = Record<string, string>; // role -> claimId

async function validateSlotsAgainstScheme(params: {
  tx: typeof prisma;
  schemeId: string | null | undefined;
  slots: SlotsPayload | undefined;
}) {
  const { tx, schemeId, slots } = params;
  if (!schemeId) return; // no scheme → nothing to validate

  const sc = await tx.argumentScheme.findUnique({ where: { id: schemeId }, select: { validators: true, key: true } });
  const v: SlotValidators | undefined = (sc?.validators as any)?.slots;
  if (!v) return;

  // 1) required slots present?
  const missing: string[] = [];
  for (const [role, rule] of Object.entries(v)) {
    if (rule?.required && (!slots || !slots[role])) {
      missing.push(role);
    }
  }
  if (missing.length) {
    throw new Error(`Missing required scheme slots for ${sc?.key}: ${missing.join(', ')}`);
  }

  // 2) type check (if claimType column exists)
  if (!slots || !Object.keys(slots).length) return;

  const slotClaimIds = Object.values(slots);
  const rows = await tx.claim.findMany({
    where: { id: { in: slotClaimIds } },
    select: { id: true }, // keep minimal; we may not have claimType yet
  }) as Array<{ id: string; claimType?: string|null }>; // tolerate absence

  const byId = new Map(rows.map(r => [r.id, r as any]));
  const typeViolations: string[] = [];

  for (const [role, claimId] of Object.entries(slots)) {
    const expects = v[role]?.expects;
    if (!expects) continue;
    const row = byId.get(claimId);
    const claimType = row?.claimType; // may be undefined if column not present
    if (claimType && expects && claimType !== expects) {
      typeViolations.push(`${role}: expected ${expects}, got ${claimType}`);
    }
  }

  if (typeViolations.length) {
    throw new Error(`Scheme slot type mismatch: ${typeViolations.join('; ')}`);
  }
}



export async function POST(req: NextRequest) {
  const b = await req.json().catch(()=> ({}));
  
  const { deliberationId, authorId, conclusionClaimId, premiseClaimIds, premises, implicitWarrant, text } = b ?? {};
  const user = await getUserFromCookies();
  if (!user) return null;

  // // Allow 'current' or empty → resolve from session
  // if (!authorId || authorId === 'current') {
  //   // const session = await getServerSession(authOptions);
  //   authorId = user.userId;
  // }
    
// app/api/arguments/route.ts (POST) — add a friendlier error
if (!Array.isArray(premiseClaimIds) || premiseClaimIds.length === 0) {
  return NextResponse.json({
    ok: false,
    error: "An inference needs at least one premise. Tip: pick the ‘Bare Assertion’ scheme and add a quick reason."
  }, { status: 400, ...NO_STORE });
}

  if (!deliberationId || !authorId || !conclusionClaimId || !Array.isArray(premiseClaimIds) || premiseClaimIds.length === 0) {
    return NextResponse.json({ ok:false, error:'Invalid payload' }, { status:400, ...NO_STORE });
  }
  // const slots = b?.slots;
let { schemeId, slots } = b; // assuming clients may send a role->claimId map when using a scheme

  // Infer scheme if not provided
  if (!schemeId && text) {
    const conclusionText = await prisma.claim.findUnique({
      where: { id: conclusionClaimId },
      select: { text: true }
    }).then(c => c?.text);

    schemeId = await inferAndAssignScheme(text, conclusionText ?? undefined);
  }

  await validateSlotsAgainstScheme({ tx: prisma, schemeId, slots });


  const created = await prisma.$transaction(async (tx) => {
    // Optional: assert the claims exist to avoid foreign key errors
    await tx.claim.findUniqueOrThrow({ where: { id: conclusionClaimId }, select: { id:true } });
    const prems = await tx.claim.findMany({ where: { id: { in: premiseClaimIds } }, select: { id: true } });
    if (prems.length !== premiseClaimIds.length) {
      throw new Error('One or more premiseClaimIds not found');
    }

    const a = await tx.argument.create({
      data: { deliberationId, authorId, conclusionClaimId, schemeId: schemeId ?? null, implicitWarrant: implicitWarrant ?? null, text: text ?? '' }
    });
    
    // NEW: Ensure ArgumentSupport record exists (required for evidential API)
    if (conclusionClaimId) {
      await ensureArgumentSupportInTx(tx, {
        argumentId: a.id,
        claimId: conclusionClaimId,
        deliberationId,
        base: 0.7, // Default confidence
      });
    }
    
   const premData =
      Array.isArray(premises) && premises.length
        ? premises.map((p:any) => ({ argumentId: a.id, claimId: p.claimId, groupKey: p.groupKey ?? null, isImplicit:false }))
        : (premiseClaimIds ?? []).map((cid:string) => ({ argumentId: a.id, claimId: cid, groupKey: null, isImplicit:false }));
    await tx.argumentPremise.createMany({ data: premData, skipDuplicates:true });
    
    // NEW: Create ArgumentSchemeInstance if scheme is provided
    if (schemeId) {
      await (tx as any).argumentSchemeInstance.create({
        data: {
          argumentId: a.id,
          schemeId: schemeId,
          confidence: 1.0,
          isPrimary: true,
        },
      });
    }
    
    return a.id;
  });

  const argId = created;

  // Create a DialogueMove to assert this argument in the deliberation
  // This allows the ludics engine to compile it into designs
  try {
    await prisma.dialogueMove.create({
      data: {
        deliberationId,
        targetType: 'argument',
        targetId: argId,
        kind: 'ASSERT',
        actorId: String(authorId),
        signature: `assert-arg-${argId}`, // Unique signature for this argument assertion
        payload: {
          argumentId: argId,
          conclusionClaimId,
          schemeId: schemeId ?? null,
        },
      }
    });
  } catch (err) {
    console.error('[arguments/POST] Failed to create dialogue move:', err);
    // Non-fatal - argument is already created
  }

  // await validateSlotsAgainstScheme({ tx: prisma, schemeId, slots });


// Seed CQ rows based on the scheme definition (if any)
try {
  if (schemeId) {
    const sc = await prisma.argumentScheme.findUnique({
      where: { id: schemeId },
      select: { key: true, cqs: { select: { cqKey: true } } }
    });
    if (sc?.key && sc.cqs?.length) {
      await prisma.cQStatus.createMany({
        data: sc.cqs
          .filter(c => c.cqKey)
          .map(c => ({
            targetType: "argument" as TargetType,
            targetId: argId,
            argumentId: argId,
            status: "open",
            schemeKey: sc.key!,
            cqKey: c.cqKey!,
            satisfied: false,
            createdById: String(authorId),
          })),
        skipDuplicates: true,
      });
    }
  }
} catch {}

  return NextResponse.json({ ok:true, argumentId: argId }, NO_STORE);
}
