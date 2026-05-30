/**
 * lib/ludics/createDialogueMove.ts
 *
 * H1 keystone seam — the single canonical entry point for creating
 * `DialogueMove` rows across the codebase. Per
 * `Development and Ideation Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_2_SPRINT_LIST.md` §H1,
 * this helper atomically writes (in one `$transaction`):
 *
 *   1. the `DialogueMove` row (legacy), with P2002 dedup on
 *      `(deliberationId, signature)`;
 *   2. the AIF graph (`AifNode` + `AifEdge` of types `premise` /
 *      `conclusion` / `asserts`) when the move targets an `argument`, by
 *      delegating to `services/aif/syncArgument.syncArgumentToAif`;
 *   3. the substrate `LudicMove` (idempotent on `(deliberationId, locus)`);
 *   4. the substrate `WitnessRecord` binding `DialogueMove ↔ LudicMove`
 *      (records-only ι, idempotent on `dialogueMoveId`).
 *
 * **Design materialisation is deliberately deferred.** Per the spec the
 * fresh-`Design` write is conditional on "first realisation of a
 * chronicle-set not already in `Behaviour.designs`", which depends on the
 * compiled chronicle being known. At per-move creation time that
 * chronicle is not yet known — the engine produces it later in
 * `compileFromMoves`. The bridge / compile path continues to materialise
 * `Design` rows in batch. The seam ensures the substrate `Behaviour` and
 * `LudicMove` rows exist so downstream Design creation can attach.
 *
 * **Legacy `LudicAct` + `LudicLocus` writes are also deferred.** Those
 * are produced lazily by `packages/ludics-engine/compileFromMoves.ts`
 * (delete-and-recreate) when the caller subsequently runs the engine
 * step. The seam does not touch them.
 *
 * Invariant I-Seam: every newly-created `DialogueMove` is left with
 * either a `WitnessRecord` row or `payload.unbridgeable = { reason }`.
 * Callers that know up-front that the move cannot be bridged (e.g. no
 * locus path is available) should pass `unbridgeable: { reason }`; the
 * seam will record the marker and skip steps 3-4. If a locus is missing
 * and no marker is passed, the seam auto-marks
 * `unbridgeable: { reason: "missing_locus_path" }`.
 *
 * @see scripts/bridge-legacy-to-substrate.ts (the batch counterpart)
 * @see services/aif/syncArgument.ts (the AIF helper this seam calls)
 * @see __tests__/invariants/h1-creation-seam.test.ts
 */

import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prismaclient";
import { syncArgumentToAif } from "@/services/aif/syncArgument";

/** Prefix the bridge applies to every legacy locus path. */
const LOCUS_PREFIX = "⊢A.";
const ROOT_LOCUS = `${LOCUS_PREFIX}0`;

export interface CreateDialogueMoveInput {
  deliberationId: string;
  actorId: string;
  /** Falls back to `actorId` when omitted. */
  authorId?: string | null;

  /** Canonical DM kind: ASSERT|WHY|GROUNDS|CONCEDE|RETRACT|CLOSE|ATTACK|... */
  kind: string;
  /** Legacy `type` column. Falls back to `kind` when omitted. */
  type?: string | null;
  illocution?: string | null;

  targetType: "argument" | "claim" | "locus" | string;
  targetId: string;

  /**
   * Caller-computed deduplication signature. The seam treats this as
   * opaque; it relies on the `dm_unique_signature` unique constraint to
   * dedup on `(deliberationId, signature)`.
   */
  signature: string;

  payload?: Record<string, unknown> | null;
  replyToMoveId?: string | null;
  replyTarget?: string | null;

  polarity?: "P" | "O" | null;
  /** Semantic locus, e.g. "0.54.1" (no `⊢A.` prefix). */
  locusPath?: string | null;
  locusId?: string | null;
  endsWithDaimon?: boolean;
  /** Anchors a GROUNDS move to the Argument it realises. */
  argumentId?: string | null;

  /**
   * If set, write `payload.unbridgeable = { reason }` and SKIP substrate
   * writes (LudicMove + WitnessRecord). The DM row + AIF sync still
   * happen. Used by callers that know the move cannot be bridged.
   */
  unbridgeable?: { reason: string } | null;
}

export interface CreateDialogueMoveResult {
  move: { id: string; signature: string; deliberationId: string };
  /** True when an existing row was returned via P2002 dedup. */
  deduplicated: boolean;
  /** Non-null only when `targetType === "argument"` and AIF sync ran. */
  aif: {
    raNodeId: string | null;
    assertsEdgesCreated: number;
    premiseEdgesCreated: number;
    conclusionEdgesCreated: number;
  } | null;
  ludicMoveId: string | null;
  witnessRecordId: string | null;
  /** Non-null when the seam wrote `payload.unbridgeable` (caller-supplied or auto). */
  unbridgeable: { reason: string } | null;
}

export interface CreateDialogueMoveOptions {
  /** Override the prisma client (e.g. for tests). */
  prisma?: typeof defaultPrisma;
  /**
   * When false, skip the AIF write path. Default true. Useful for
   * scripts / tests that exercise only the substrate plumbing.
   */
  syncAif?: boolean;
}

function canonicalText(input: CreateDialogueMoveInput): string {
  const p = (input.payload ?? {}) as Record<string, unknown>;
  const raw = String(
    (p.expression as string | undefined) ??
      (p.text as string | undefined) ??
      (p.note as string | undefined) ??
      "",
  );
  return raw.trim().slice(0, 2000);
}

function pickLudicMoveType(input: CreateDialogueMoveInput): string {
  if (input.kind === "DAIMON" || input.kind === "CLOSE") return "daimon";
  if (input.polarity === "O") return "negative";
  if (input.polarity === "P") return "positive";
  switch (input.kind) {
    case "WHY":
    case "ATTACK":
      return "negative";
    case "ASSERT":
    case "GROUNDS":
    case "THEREFORE":
    case "CONCEDE":
    case "ACCEPT_ARGUMENT":
      return "positive";
    default:
      return "positive";
  }
}

function resolveSubstrateLocus(
  legacyPath: string | null | undefined,
): string | null {
  if (!legacyPath) return null;
  return legacyPath.startsWith(LOCUS_PREFIX)
    ? legacyPath
    : `${LOCUS_PREFIX}${legacyPath}`;
}

function pickSchemeKey(input: CreateDialogueMoveInput): string | null {
  const p = (input.payload ?? {}) as Record<string, unknown>;
  const k =
    (p.schemeKey as string | undefined) ??
    (p.cqId as string | undefined) ??
    null;
  return k ?? null;
}

export async function createDialogueMove(
  input: CreateDialogueMoveInput,
  options: CreateDialogueMoveOptions = {},
): Promise<CreateDialogueMoveResult> {
  const db = options.prisma ?? defaultPrisma;
  const syncAif = options.syncAif !== false;

  const initialPayload: Record<string, unknown> = {
    ...(input.payload ?? {}),
  };
  if (input.unbridgeable) {
    initialPayload.unbridgeable = input.unbridgeable;
  }

  const semanticLocus =
    input.locusPath ??
    (typeof (input.payload as Record<string, unknown> | null | undefined)
      ?.locusPath === "string"
      ? ((input.payload as Record<string, unknown>).locusPath as string)
      : null);
  const substrateLocus = resolveSubstrateLocus(semanticLocus);

  return db.$transaction(async (tx) => {
    // ── 1. DialogueMove row (with P2002 dedup) ─────────────────────────────
    let dm: { id: string; signature: string; deliberationId: string };
    try {
      dm = await tx.dialogueMove.create({
        data: {
          deliberationId: input.deliberationId,
          actorId: input.actorId,
          authorId: input.authorId ?? input.actorId,
          kind: input.kind,
          type: input.type ?? input.kind,
          illocution: input.illocution as never,
          targetType: input.targetType,
          targetId: input.targetId,
          signature: input.signature,
          payload: initialPayload as Prisma.InputJsonValue,
          replyToMoveId: input.replyToMoveId ?? null,
          replyTarget: (input.replyTarget ?? null) as never,
          polarity: input.polarity ?? null,
          locusId: input.locusId ?? null,
          endsWithDaimon: input.endsWithDaimon ?? false,
          argumentId: input.argumentId ?? null,
        },
        select: { id: true, signature: true, deliberationId: true },
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const existing = await tx.dialogueMove.findUnique({
          where: {
            dm_unique_signature: {
              deliberationId: input.deliberationId,
              signature: input.signature,
            },
          },
          select: { id: true, signature: true, deliberationId: true },
        });
        if (!existing) throw e;
        return {
          move: existing,
          deduplicated: true,
          aif: null,
          ludicMoveId: null,
          witnessRecordId: null,
          unbridgeable: input.unbridgeable ?? null,
        } satisfies CreateDialogueMoveResult;
      }
      throw e;
    }

    // ── 2. AIF write path (delegates to existing helper) ───────────────────
    let aifResult: CreateDialogueMoveResult["aif"] = null;
    if (syncAif && input.targetType === "argument" && input.targetId) {
      try {
        const r = await syncArgumentToAif({
          argumentId: input.targetId,
          tx: tx as unknown as PrismaClient,
          dialogueMoveId: dm.id,
        });
        aifResult = {
          raNodeId: r.raNodeId,
          assertsEdgesCreated: r.assertsEdgesCreated,
          premiseEdgesCreated: r.premiseEdgesCreated,
          conclusionEdgesCreated: r.conclusionEdgesCreated,
        };
      } catch (err: unknown) {
        // AIF failures must not break the DM write (mirrors the
        // long-standing convention in `packages/ludics-engine/aif-sync.ts`).
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[createDialogueMove] AIF sync failed:", msg);
      }
    }

    // ── 3-4. Substrate (skip if caller-supplied unbridgeable) ──────────────
    if (input.unbridgeable) {
      return {
        move: dm,
        deduplicated: false,
        aif: aifResult,
        ludicMoveId: null,
        witnessRecordId: null,
        unbridgeable: input.unbridgeable,
      } satisfies CreateDialogueMoveResult;
    }

    if (!substrateLocus) {
      // No locus available → auto-mark unbridgeable to satisfy I-Seam.
      const reason = "missing_locus_path";
      await tx.dialogueMove.update({
        where: { id: dm.id },
        data: {
          payload: {
            ...initialPayload,
            unbridgeable: { reason },
          } as Prisma.InputJsonValue,
        },
      });
      return {
        move: dm,
        deduplicated: false,
        aif: aifResult,
        ludicMoveId: null,
        witnessRecordId: null,
        unbridgeable: { reason },
      } satisfies CreateDialogueMoveResult;
    }

    // 3a. Behaviour upsert (single root behaviour per deliberation,
    //     matching `scripts/bridge-legacy-to-substrate.ts`).
    await tx.behaviour.upsert({
      where: {
        deliberationId_rootLocus: {
          deliberationId: input.deliberationId,
          rootLocus: ROOT_LOCUS,
        },
      },
      create: {
        deliberationId: input.deliberationId,
        rootLocus: ROOT_LOCUS,
      },
      update: {},
      select: { id: true },
    });

    // 3b. LudicMove upsert idempotent on (deliberationId, locus).
    const moveType = pickLudicMoveType(input);
    const existingLudicMove = await tx.ludicMove.findUnique({
      where: {
        deliberationId_locus: {
          deliberationId: input.deliberationId,
          locus: substrateLocus,
        },
      },
      select: { id: true },
    });
    let ludicMoveId: string;
    if (existingLudicMove) {
      ludicMoveId = existingLudicMove.id;
      await tx.ludicMove.update({
        where: { id: ludicMoveId },
        data: {
          moveType,
          stratumLabel: "witnessable",
          ...(input.argumentId ? { argumentId: input.argumentId } : {}),
        },
      });
    } else {
      const created = await tx.ludicMove.create({
        data: {
          deliberationId: input.deliberationId,
          locus: substrateLocus,
          moveType,
          stratumLabel: "witnessable",
          argumentId: input.argumentId ?? null,
        },
        select: { id: true },
      });
      ludicMoveId = created.id;
    }

    // 4. WitnessRecord (idempotent on dialogueMoveId).
    const schemeKey = pickSchemeKey(input);
    const canon = canonicalText(input);
    const existingWitness = await tx.witnessRecord.findUnique({
      where: { dialogueMoveId: dm.id },
      select: { id: true },
    });
    let witnessRecordId: string;
    if (existingWitness) {
      witnessRecordId = existingWitness.id;
      await tx.witnessRecord.update({
        where: { id: witnessRecordId },
        data: {
          ludicMoveId,
          participantId: input.actorId,
          canonicalText: canon,
          schemeKey,
          fossilizedAt: null,
          retractLayer: null,
          retractReason: null,
        },
      });
    } else {
      const wr = await tx.witnessRecord.create({
        data: {
          ludicMoveId,
          dialogueMoveId: dm.id,
          participantId: input.actorId,
          canonicalText: canon,
          schemeKey,
        },
        select: { id: true },
      });
      witnessRecordId = wr.id;
    }

    return {
      move: dm,
      deduplicated: false,
      aif: aifResult,
      ludicMoveId,
      witnessRecordId,
      unbridgeable: null,
    } satisfies CreateDialogueMoveResult;
  });
}
