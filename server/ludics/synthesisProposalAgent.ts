/**
 * Synthesis Proposal Agent — Phase 2c.
 *
 * Orchestrates the AI-synthesis workflow: given two existing Design rows,
 * computes their articulation join, enforces structural invariants, and
 * (when the join is trivially closed) commits a WitnessRecord.
 *
 * Invariant enforcement (inherited from I1–I3 framework):
 *   I1  Root locus ⊢A.0 LudicMove must exist for the deliberation
 *   I3  canonicalText must be non-empty
 *
 * Error codes:
 *   409  DELOCATION_REQUIRED  — join added new loci not present in D_P
 *                              (caller must retrain on enlarged loci set)
 *   422  EMPTY_CANONICAL_TEXT — canonicalText empty / blank
 *   404  DESIGNS_NOT_FOUND    — one or both designIds are missing in DB
 *
 * Delocation path: when `newLoci.length > 0`, returns early with
 * `witnessId: null` and `delocationType: "locus-addition-required"`.
 * No WitnessRecord is written.
 *
 * Idempotence: a deterministic `dialogueMoveId` derived from the input
 * ensures that re-issuing identical inputs returns the existing record
 * with `closureSteps: 0`.
 *
 * T4 invariant: participantId is stored but NEVER returned.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prismaclient";
import { computeArticulationJoin } from "@/server/ludics/articulationLattice";
import { create as createWitnessRecord } from "@/server/ludics/witnessRecord";

// ── Error class ───────────────────────────────────────────────────────────────

export type SynthesisErrorCode =
  | "DELOCATION_REQUIRED"
  | "EMPTY_CANONICAL_TEXT"
  | "DESIGNS_NOT_FOUND"
  | "CROSS_CONE"
  | "CLOSURE_STEPS_INVARIANT";

export class SynthesisError extends Error {
  readonly code: SynthesisErrorCode;
  readonly status: 409 | 422 | 404;

  constructor(
    code: SynthesisErrorCode,
    message: string,
    status: 409 | 422 | 404,
  ) {
    super(message);
    this.name = "SynthesisError";
    this.code = code;
    this.status = status;
  }
}

// ── Public shapes ─────────────────────────────────────────────────────────────

export interface SynthesisProposalInput {
  deliberationId: string;
  /** The two Design rows to join. Order is normalised internally. */
  designIds: [string, string];
  /** The participant proposing the synthesis (T4: stored, never returned). */
  participantId: string;
  /**
   * Agent-generated synthesis statement that textually represents the
   * join locus. Stored verbatim in the WitnessRecord.canonicalText
   * column (plain text, NOT JSON.stringify({text:…}) — synthesis
   * statements are not subjected to canonicalize pipeline gating).
   */
  canonicalText: string;
}

export interface SynthesisProposalResult {
  /** WitnessRecord id; null when delocationType is non-null. */
  witnessId: string | null;
  /** The Design row representing Art(B) join of the two inputs. */
  joinDesignId: string;
  /** Closure steps taken by computeArticulationJoin. 0 = existing design used. */
  closureSteps: number;
  /** Loci contributed by the join beyond what both inputs share. */
  newLoci: string[];
  /** True when the join design was not already in the lattice (closureSteps > 0). */
  wasNontrivial: boolean;
  /** Set when the join required new loci not yet in D_P. */
  delocationType: "locus-addition-required" | null;
}

// ── proposeSynthesis ──────────────────────────────────────────────────────────

export async function proposeSynthesis(
  input: SynthesisProposalInput,
): Promise<SynthesisProposalResult> {
  const { deliberationId, designIds, participantId, canonicalText } = input;

  // I3 — canonicalText must not be blank.
  if (!canonicalText.trim()) {
    throw new SynthesisError(
      "EMPTY_CANONICAL_TEXT",
      "canonicalText must not be empty",
      422,
    );
  }

  // Compute the articulation join of the two input designs.
  const joinResult = await computeArticulationJoin([...designIds]);
  if (!joinResult) {
    throw new SynthesisError(
      "DESIGNS_NOT_FOUND",
      "one or both designIds not found or do not share a common Behaviour",
      404,
    );
  }

  // Phase 2e: cross-cone inputs are undefined for ∨_⊥⊥.
  if (joinResult.kind === "cross-cone-rejected") {
    throw new SynthesisError(
      "CROSS_CONE",
      `inputs span ${joinResult.coneIds.length} incarnation cones; ∨_⊥⊥ is undefined in B`,
      422,
    );
  }

  if (joinResult.kind === "same-cone-delocation-required") {
    return {
      witnessId: null,
      joinDesignId: "",
      closureSteps: 0,
      newLoci: joinResult.collidingLoci,
      wasNontrivial: true,
      delocationType: "locus-addition-required",
    };
  }

  const { join, newLoci, closureSteps } = joinResult;
  // Phase 2f Reading A: literal chronicle-set union, so closureSteps is
  // always 0 within a cone. `wasNontrivial` now records whether the join
  // created a new Design row (newLoci.length > 0), not whether closure ran.
  //
  // Invariant (defensive): under Reading A, computeArticulationJoin must
  // always return closureSteps === 0 for the same-cone-join kind. A non-zero
  // value indicates either a regression in the service or a silent revert to
  // Reading B semantics — surface it loudly rather than swallowing it.
  if (closureSteps !== 0) {
    throw new SynthesisError(
      "CLOSURE_STEPS_INVARIANT",
      `Phase 2f Reading A invariant violated: computeArticulationJoin returned ` +
        `closureSteps=${closureSteps} for same-cone-join (expected 0). ` +
        `Cone ${joinResult.coneId}, designs [${designIds.join(", ")}].`,
      422,
    );
  }
  const wasNontrivial = newLoci.length > 0;

  // Delocation path — join added loci not yet in D_P.
  if (newLoci.length > 0) {
    return {
      witnessId: null,
      joinDesignId: join.designId,
      closureSteps,
      newLoci,
      wasNontrivial,
      delocationType: "locus-addition-required",
    };
  }

  // If the join created a new Design row, persist DesignInclusion edges.
  if (wasNontrivial) {
    for (const dId of designIds) {
      await prisma.designInclusion.upsert({
        where: {
          smallerId_largerId: { smallerId: dId, largerId: join.designId },
        },
        create: { smallerId: dId, largerId: join.designId },
        update: {},
      });
    }
  }

  // I1 — root locus LudicMove must exist in D_P.
  const rootMove = await prisma.ludicMove.findFirst({
    where: { deliberationId, locus: "\u22a2A.0" },
    select: { id: true },
  });

  if (!rootMove) {
    throw new SynthesisError(
      "DELOCATION_REQUIRED",
      "root locus \u22a2A.0 not found in D_P for this deliberation",
      409,
    );
  }

  // Deterministic dialogueMoveId for idempotency across identical inputs.
  const sorted = [...designIds].sort();
  const hash = crypto
    .createHash("sha256")
    .update(`${deliberationId}:${sorted.join(",")}:${participantId}`)
    .digest("hex")
    .slice(0, 24);
  const dialogueMoveId = `synthesis:${hash}`;

  // Check for existing WitnessRecord (idempotency).
  const existing = await prisma.witnessRecord.findUnique({
    where: { dialogueMoveId },
    select: { id: true },
  });

  if (existing) {
    return {
      witnessId: existing.id,
      joinDesignId: join.designId,
      closureSteps: 0,
      newLoci: [],
      wasNontrivial: false,
      delocationType: null,
    };
  }

  // Commit the WitnessRecord.
  const witness = await createWitnessRecord({
    ludicMoveId: rootMove.id,
    dialogueMoveId,
    participantId,
    canonicalText,
  });

  return {
    witnessId: witness.id,
    joinDesignId: join.designId,
    closureSteps,
    newLoci: [],
    wasNontrivial,
    delocationType: null,
  };
}
