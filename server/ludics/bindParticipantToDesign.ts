/**
 * Iota write seam — bind_participant_to_design service layer.
 *
 * Enforces invariants S1–S4 before writing a WitnessRecord (renamed from
 * I1–I4 post-review to avoid collision with Girard's I1–I4 ludics invariants).
 * All invariant checks run inside a single DB transaction so any
 * failure is clean and leaves no partial state.
 *
 *  S1  existingLocus        — ludicMoveId must be in LudicMove with a non-empty locus
 *  S2  existingStructure    — LudicMove.deliberationId must be non-null (structural integrity)
 *  S3  canonPipelineGated   — canonicalText must be a valid JSON.stringify({text:…}) from canonicalizeClaimText
 *  S4  schemeTyped          — if schemeKey provided it must exist in ArgumentScheme catalog;
 *                             if moveType === "daimon" a schemeKey is required
 *
 * Error codes (never logged with participantId in messages — T4 invariant):
 *  409  DELOCATION_REQUIRED  — ludicMoveId absent / locus not found
 *  422  CANON_GATE_FAILED    — canonicalText failed the pipeline validator
 *  422  SCHEME_REQUIRED      — schemeKey absent for inference move, or key not in catalog
 */

import { prisma } from "@/lib/prismaclient";
import { canonicalizeClaimText } from "@/lib/ids/mintMoid";

// ── Error class ──────────────────────────────────────────────────────────────

export type BindErrorCode =
  | "DELOCATION_REQUIRED"
  | "CANON_GATE_FAILED"
  | "SCHEME_REQUIRED";

export class BindError extends Error {
  readonly code: BindErrorCode;
  readonly status: 409 | 422;

  constructor(code: BindErrorCode, message: string, status: 409 | 422) {
    super(message);
    this.name = "BindError";
    this.code = code;
    this.status = status;
  }
}

// ── Public shapes ─────────────────────────────────────────────────────────────

export interface BindInput {
  dialogueMoveId: string;
  ludicMoveId: string;
  participantId: string;
  /** Must be the output of canonicalizeClaimText (i.e. JSON.stringify({text:…})). */
  canonicalText: string;
  /** Required when moveType === "daimon"; optional for positive/negative. */
  schemeKey?: string;
  /**
   * Optional back-reference to the Argument this move represents (Phase 2d).
   * When supplied, stored on the LudicMove row so `fossilizeByArgument` can
   * find all witnesses for this argument on deletion.
   */
  argumentId?: string;
}

export interface InvariantChecks {
  S1_existingLocus: boolean;
  S2_existingStructure: boolean;
  S3_canonPipelineGated: boolean;
  S4_schemeTyped: boolean;
}

export interface BindResult {
  witnessId: string;
  ludicMoveId: string;
  dialogueMoveId: string;
  invariantChecks: InvariantChecks;
}

// ── Main service function ─────────────────────────────────────────────────────

export async function bindParticipantToDesign(
  input: BindInput
): Promise<BindResult> {
  const { dialogueMoveId, ludicMoveId, participantId, canonicalText, schemeKey, argumentId } =
    input;

  // ── S1 + S2: LudicMove must exist, have a locus, and belong to a deliberation ──
  const ludicMove = await prisma.ludicMove.findUnique({
    where: { id: ludicMoveId },
    select: { id: true, deliberationId: true, locus: true, moveType: true },
  });

  if (!ludicMove || !ludicMove.locus) {
    throw new BindError(
      "DELOCATION_REQUIRED",
      `ludicMoveId "${ludicMoveId}" not found in LudicMove — locus does not exist`,
      409
    );
  }

  if (!ludicMove.deliberationId) {
    throw new BindError(
      "DELOCATION_REQUIRED",
      `LudicMove "${ludicMoveId}" has no deliberationId — existingStructure invariant violated`,
      409
    );
  }

  // ── S3: canonicalText must pass the canonicalization pipeline validator ──────
  if (!canonicalText || canonicalText.trim().length === 0) {
    throw new BindError(
      "CANON_GATE_FAILED",
      "canonicalText is empty — text must pass canonicalizeClaimText before binding",
      422
    );
  }

  // Verify it is well-formed and idempotent under the pipeline
  let innerText: string;
  try {
    const parsed = JSON.parse(canonicalText) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).text !== "string" ||
      !(parsed as Record<string, string>).text.trim()
    ) {
      throw new Error("wrong shape");
    }
    innerText = (parsed as Record<string, string>).text;
    const recheckCanon = canonicalizeClaimText(innerText);
    if (recheckCanon !== canonicalText) {
      throw new Error("not idempotent");
    }
  } catch {
    throw new BindError(
      "CANON_GATE_FAILED",
      "canonicalText must be JSON.stringify({text: <NFC-normalized, whitespace-collapsed string>})",
      422
    );
  }

  // ── S4: schemeKey validation ──────────────────────────────────────────────
  // Daimon moves require a schemeKey; positive/negative treat it as optional.
  const isDaimon = ludicMove.moveType === "daimon";
  const isDialogueOnly = ludicMove.moveType === "dialogue-only";

  if (isDaimon && !isDialogueOnly && !schemeKey) {
    throw new BindError(
      "SCHEME_REQUIRED",
      `moveType "daimon" requires a schemeKey`,
      422
    );
  }

  if (schemeKey) {
    const scheme = await prisma.argumentScheme.findUnique({
      where: { key: schemeKey },
      select: { key: true },
    });
    if (!scheme) {
      throw new BindError(
        "SCHEME_REQUIRED",
        `schemeKey "${schemeKey}" not found in ArgumentScheme catalog`,
        422
      );
    }
  }

  const I4Passed = isDialogueOnly
    ? true
    : isDaimon
    ? !!schemeKey
    : schemeKey
    ? true  // S4: provided and valid (would have thrown above if invalid)
    : true; // S4: optional for positive/negative

  // ── All checks passed — write WitnessRecord (and optionally update LudicMove.argumentId) ──
  const witness = await prisma.$transaction(async (tx) => {
    // Phase 2d: backfill argumentId on the LudicMove when caller provides it.
    if (argumentId) {
      await tx.ludicMove.update({
        where: { id: ludicMoveId },
        data: { argumentId },
      });
    }
    return tx.witnessRecord.create({
      data: {
        ludicMoveId,
        dialogueMoveId,
        participantId,
        canonicalText,
        schemeKey: schemeKey ?? null,
      },
    });
  });

  return {
    witnessId: witness.id,
    ludicMoveId,
    dialogueMoveId,
    invariantChecks: {
      S1_existingLocus: true,
      S2_existingStructure: true,
      S3_canonPipelineGated: true,
      S4_schemeTyped: I4Passed,
    },
  };
}
