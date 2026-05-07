/**
 * orchestrator/finalize/phase-3-finalize.ts
 *
 * Validates platform state against `PHASE_3_PARTIAL.json`, then writes
 * `PHASE_3_COMPLETE.json` (the gate Stage 5 reads).
 *
 * Audit (read-only):
 *   - Both advocates' run records must have outcome === "ok".
 *   - Every rebuttal Argument id and every attack ArgumentEdge id from
 *     the mint result must still exist in the database. (We use prisma
 *     directly because there's no /api/arguments/:id GET that returns
 *     edge metadata and the volume is small enough for a single
 *     `findMany`.)
 *
 * Review-flag gating (mirrors Phase 2):
 *   - If `PHASE_3_PARTIAL.json` has reviewFlags but no review report exists,
 *     finalize refuses.
 *   - If a review report exists, every flag must carry an `**Applied:**`
 *     marker. Otherwise refuse.
 *
 * Output: `PHASE_3_COMPLETE.json` — the canonical Stage-4 manifest.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

import type { OrchestratorConfig } from "../config";
import type { IsonomiaClient } from "../isonomia-client";
import type {
  Phase3PartialFile,
  RebuttalRunRecord,
  MethodologistRunRecord,
} from "../phases/phase-3-attacks";
import type { ReviewFlag } from "../review/phase-3-checks";
import { parseReport, reportPathFor } from "../review/report";
import { prisma } from "@/lib/prismaclient";

export interface Phase3CompleteRebuttal {
  inputIndex: number;
  /** Iter-3 multi-round indicator. "1" = round 1 (Iter-2 default), "2" = round 2 attack-on-attack. */
  round: "1" | "2";
  rebuttalArgumentId: string;
  targetArgumentId: string;
  /** Iter-3: which kind of object `targetArgumentId` resolves to. */
  targetKind: "phase2-arg" | "round1-rebuttal";
  edgeId: string;
  attackType: "REBUT" | "UNDERMINE" | "UNDERCUT";
  targetPremiseIndex: number | null;
  targetPremiseClaimId: string | null;
  schemeKey: string;
  schemeId: string;
  conclusionClaimId: string;
  premiseClaimIds: string[];
  premiseTexts: string[];
  premiseCitationTokens: Array<string | null>;
  warrant: string | null;
  cqKey: string | null;
  conclusionText: string;
  citations: Array<{ sourceId: string; citationId: string; citationToken: string }>;
}

export interface Phase3CompleteCqResponse {
  inputIndex: number;
  /** Iter-3 multi-round indicator. */
  round: "1" | "2";
  targetArgumentId: string;
  /** Iter-3: which kind of object `targetArgumentId` resolves to. */
  targetKind: "phase2-arg" | "round1-rebuttal";
  cqKey: string;
  action: "raise" | "waive";
  rationale: string;
  cqStatusId: string;
  elidedByRebuttalCqKey: boolean;
}

export interface Phase3CompleteAdvocate {
  outcome: "ok";
  attempts: number;
  tokenUsage: { inputTokens: number; outputTokens: number };
  rebuttals: Phase3CompleteRebuttal[];
  cqResponses: Phase3CompleteCqResponse[];
}

/**
 * Methodologist-specific complete record. Same shape as the advocate
 * record except every rebuttal and cqResponse carries an explicit
 * `targetAdvocateRole` ("A" | "B") so downstream phases can route the
 * Methodologist's attacks to the correct advocate.
 */
export interface Phase3CompleteMethodologistRebuttal
  extends Phase3CompleteRebuttal {
  targetAdvocateRole: "A" | "B";
}
export interface Phase3CompleteMethodologistCqResponse
  extends Phase3CompleteCqResponse {
  targetAdvocateRole: "A" | "B";
}
export interface Phase3CompleteMethodologist {
  outcome: "ok";
  attempts: number;
  tokenUsage: { inputTokens: number; outputTokens: number };
  rebuttals: Phase3CompleteMethodologistRebuttal[];
  cqResponses: Phase3CompleteMethodologistCqResponse[];
}

export interface Phase3CompleteFile {
  phase: 3;
  status: "complete";
  completedAt: string;
  deliberationId: string;
  modelTier: string;
  evidenceStackId: string;
  hingeIndices: number[];
  cqCatalog: Phase3PartialFile["cqCatalog"];
  advocates: { a: Phase3CompleteAdvocate; b: Phase3CompleteAdvocate };
  /** Optional Phase-3 third-actor record (cross-side methodological
   *  critic). Older deliberations finalized before the Methodologist
   *  was introduced will not have this field. */
  methodologist?: Phase3CompleteMethodologist;
  totals: Phase3PartialFile["totals"];
  reviewSummary: {
    totalFlags: number;
    accepted: number;
    revised: number;
    retracted: number;
    flagsByRule: Record<string, number>;
    reportPath: string | null;
  };
  judgeUsage?: { calls: number; inputTokens: number; outputTokens: number };
}

export async function finalizePhase3(opts: {
  cfg: OrchestratorConfig;
  iso: IsonomiaClient;
}): Promise<Phase3CompleteFile> {
  const partialPath = path.join(opts.cfg.runtimeDir, "PHASE_3_PARTIAL.json");
  if (!existsSync(partialPath)) {
    throw new Error(`PHASE_3_PARTIAL.json not found. Run \`npm run orchestrator -- phase 3\` first.`);
  }
  const partial = JSON.parse(readFileSync(partialPath, "utf8")) as Phase3PartialFile;

  // ── 1. Both advocates must have outcome === "ok" ──
  const a = partial.advocates.a;
  const b = partial.advocates.b;
  const okA = a?.outcome === "ok";
  const okB = b?.outcome === "ok";
  if (!okA || !okB) {
    const status = (rec?: RebuttalRunRecord) => (rec ? rec.outcome : "missing");
    throw new Error(
      `Phase 3 finalize refused: both advocates must have outcome="ok". ` +
        `Got A=${status(a)}, B=${status(b)}. ` +
        `Re-run \`npm run orchestrator -- phase 3 --resume\` to retry the failed/missing advocate(s).`,
    );
  }

  // ── 2. Argument + edge audit ──
  const expectedArgIds = new Set<string>();
  const expectedEdgeIds = new Set<string>();
  for (const rec of [a!, b!]) {
    if (!rec.mintResult) continue;
    for (const r of rec.mintResult.rebuttals) {
      expectedArgIds.add(r.rebuttalArgumentId);
      expectedEdgeIds.add(r.edgeId);
    }
  }
  // Methodologist (optional). If present and ok, audit its mints too.
  const meth = partial.methodologist;
  if (meth?.outcome === "ok" && meth.mintResult) {
    for (const r of meth.mintResult.rebuttals) {
      expectedArgIds.add(r.rebuttalArgumentId);
      expectedEdgeIds.add(r.edgeId);
    }
  } else if (meth && meth.outcome !== "ok") {
    throw new Error(
      `Phase 3 finalize refused: methodologist record present but outcome="${meth.outcome}". ` +
        `Re-run \`npm run orchestrator -- phase 3 --resume\` to retry the methodologist.`,
    );
  }

  const divergences: string[] = [];
  if (expectedArgIds.size > 0) {
    const presentArgs = await prisma.argument.findMany({
      where: { id: { in: [...expectedArgIds] } },
      select: { id: true },
    });
    const observed = new Set(presentArgs.map((r) => r.id));
    for (const id of expectedArgIds) {
      if (!observed.has(id)) divergences.push(`Rebuttal Argument ${id} not present in DB.`);
    }
  }
  if (expectedEdgeIds.size > 0) {
    const presentEdges = await prisma.argumentEdge.findMany({
      where: { id: { in: [...expectedEdgeIds] } },
      select: { id: true },
    });
    const observed = new Set(presentEdges.map((r) => r.id));
    for (const id of expectedEdgeIds) {
      if (!observed.has(id)) divergences.push(`Attack ArgumentEdge ${id} not present in DB.`);
    }
  }

  if (divergences.length > 0) {
    const divPath = path.join(opts.cfg.runtimeDir, "reviews", "phase-3-divergence.md");
    mkdirSync(path.dirname(divPath), { recursive: true });
    writeFileSync(
      divPath,
      `# Phase 3 Finalization — Divergence Detected\n\n` +
        `Generated: ${new Date().toISOString()}\n\n` +
        divergences.map((d) => `- ${d}`).join("\n") + "\n\n" +
        `Likely causes:\n` +
        `  - A rebuttal Argument or attack edge was manually deleted between phase 3 and finalize.\n` +
        `  - Phase 3 was partially re-run and the orphan-guard cascade removed prior rows.\n\n` +
        `Resolve by re-running \`npm run orchestrator -- phase 3\` against the current Phase 2 state.\n`,
    );
    throw new Error(`Phase 3 finalize refused: ${divergences.length} divergence(s). See ${divPath}.`);
  }

  // ── 3. Review-flag gating ──
  const reviewSummary = await buildReviewSummary(opts.cfg, partial.reviewFlags);

  // ── 4. Build complete file ──
  const complete: Phase3CompleteFile = {
    phase: 3,
    status: "complete",
    completedAt: new Date().toISOString(),
    deliberationId: partial.deliberationId,
    modelTier: partial.modelTier,
    evidenceStackId: partial.evidenceStackId,
    hingeIndices: partial.hingeIndices,
    cqCatalog: partial.cqCatalog,
    advocates: {
      a: buildCompleteAdvocate(a!),
      b: buildCompleteAdvocate(b!),
    },
    methodologist:
      meth?.outcome === "ok" ? buildCompleteMethodologist(meth) : undefined,
    totals: partial.totals,
    reviewSummary,
    judgeUsage: partial.judgeUsage,
  };

  const completePath = path.join(opts.cfg.runtimeDir, "PHASE_3_COMPLETE.json");
  writeFileSync(completePath, JSON.stringify(complete, null, 2));
  return complete;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

async function buildReviewSummary(
  cfg: OrchestratorConfig,
  reviewFlags: ReviewFlag[],
): Promise<Phase3CompleteFile["reviewSummary"]> {
  const flagsByRule: Record<string, number> = {};
  for (const f of reviewFlags) flagsByRule[f.ruleId] = (flagsByRule[f.ruleId] ?? 0) + 1;

  const reportPath = reportPathFor(cfg.runtimeDir, 3);
  if (existsSync(reportPath)) {
    const text = readFileSync(reportPath, "utf8");
    let verdicts;
    try {
      verdicts = parseReport(text);
    } catch (parseErr) {
      throw new Error(
        `Phase 3 finalize: review report at ${reportPath} could not be parsed: ${(parseErr as Error).message}`,
      );
    }
    const unapplied = verdicts.filter((v) => !v.applied);
    if (unapplied.length > 0) {
      throw new Error(
        `Phase 3 finalize refused: ${unapplied.length} flag(s) in the review report have no \`**Applied:**\` marker.`,
      );
    }
    return {
      totalFlags: verdicts.length,
      accepted: verdicts.filter((v) => v.verdict === "accept").length,
      revised: verdicts.filter((v) => v.verdict === "revise").length,
      retracted: verdicts.filter((v) => v.verdict === "retract").length,
      flagsByRule,
      reportPath,
    };
  }

  if (reviewFlags.length > 0) {
    throw new Error(
      `Phase 3 finalize refused: PHASE_3_PARTIAL.json has ${reviewFlags.length} review flag(s) but no review report exists at ${reportPath}. ` +
        `Generate it with \`npm run orchestrator -- review --phase 3\`, fill in verdicts + Applied markers.`,
    );
  }

  return {
    totalFlags: 0,
    accepted: 0,
    revised: 0,
    retracted: 0,
    flagsByRule,
    reportPath: null,
  };
}

function buildCompleteAdvocate(rec: RebuttalRunRecord): Phase3CompleteAdvocate {
  if (rec.outcome !== "ok" || !rec.mintResult || !rec.llmOutput) {
    throw new Error(`buildCompleteAdvocate: advocate ${rec.role} not in "ok" state.`);
  }
  const inputRebuttals = rec.llmOutput.rebuttals;
  const inputCqResponses = rec.llmOutput.cqResponses;

  const rebuttals: Phase3CompleteRebuttal[] = rec.mintResult.rebuttals.map((m) => {
    const orig = inputRebuttals[m.inputIndex];
    return {
      inputIndex: m.inputIndex,
      round: rec.llmOutput!.round ?? "1",
      rebuttalArgumentId: m.rebuttalArgumentId,
      targetArgumentId: m.targetArgumentId,
      targetKind: orig.targetKind ?? "phase2-arg",
      edgeId: m.edgeId,
      attackType: m.attackType,
      targetPremiseIndex: m.targetPremiseIndex,
      targetPremiseClaimId: m.targetPremiseClaimId,
      schemeKey: m.schemeKey,
      schemeId: m.schemeId,
      conclusionClaimId: m.conclusionClaimId,
      premiseClaimIds: m.premiseClaimIds,
      premiseTexts: orig.premises.map((p) => p.text),
      premiseCitationTokens: orig.premises.map((p) => p.citationToken ?? null),
      warrant: orig.warrant ?? null,
      cqKey: m.cqKey,
      conclusionText: orig.conclusionText,
      citations: m.citations,
    };
  });

  const cqResponses: Phase3CompleteCqResponse[] = rec.mintResult.cqResponses.map((m) => {
    const orig = inputCqResponses[m.inputIndex];
    return {
      inputIndex: m.inputIndex,
      round: rec.llmOutput!.round ?? "1",
      targetArgumentId: m.targetArgumentId,
      targetKind: orig.targetKind ?? "phase2-arg",
      cqKey: m.cqKey,
      action: m.action,
      rationale: orig.rationale,
      cqStatusId: m.cqStatusId,
      elidedByRebuttalCqKey: m.elidedByRebuttalCqKey,
    };
  });

  return {
    outcome: "ok",
    attempts: rec.attempts,
    tokenUsage: rec.tokenUsage,
    rebuttals,
    cqResponses,
  };
}

/**
 * Build the complete-file Methodologist record. Mirrors
 * `buildCompleteAdvocate` but propagates the per-item `targetAdvocateRole`
 * field from the LLM output (the translator stripped it; we re-attach
 * it here from `rec.llmOutput`).
 */
function buildCompleteMethodologist(
  rec: MethodologistRunRecord,
): Phase3CompleteMethodologist {
  if (rec.outcome !== "ok" || !rec.mintResult || !rec.llmOutput) {
    throw new Error(`buildCompleteMethodologist: methodologist not in "ok" state.`);
  }
  const inputRebuttals = rec.llmOutput.rebuttals;
  const inputCqResponses = rec.llmOutput.cqResponses;

  const rebuttals: Phase3CompleteMethodologistRebuttal[] = rec.mintResult.rebuttals.map(
    (m) => {
      const orig = inputRebuttals[m.inputIndex];
      return {
        inputIndex: m.inputIndex,
        round: rec.llmOutput!.round ?? "1",
        rebuttalArgumentId: m.rebuttalArgumentId,
        targetArgumentId: m.targetArgumentId,
        targetKind: orig.targetKind ?? "phase2-arg",
        targetAdvocateRole: orig.targetAdvocateRole,
        edgeId: m.edgeId,
        attackType: m.attackType,
        targetPremiseIndex: m.targetPremiseIndex,
        targetPremiseClaimId: m.targetPremiseClaimId,
        schemeKey: m.schemeKey,
        schemeId: m.schemeId,
        conclusionClaimId: m.conclusionClaimId,
        premiseClaimIds: m.premiseClaimIds,
        premiseTexts: orig.premises.map((p) => p.text),
        premiseCitationTokens: orig.premises.map((p) => p.citationToken ?? null),
        warrant: orig.warrant ?? null,
        cqKey: m.cqKey,
        conclusionText: orig.conclusionText,
        citations: m.citations,
      };
    },
  );

  const cqResponses: Phase3CompleteMethodologistCqResponse[] =
    rec.mintResult.cqResponses.map((m) => {
      const orig = inputCqResponses[m.inputIndex];
      return {
        inputIndex: m.inputIndex,
        round: rec.llmOutput!.round ?? "1",
        targetArgumentId: m.targetArgumentId,
        targetKind: orig.targetKind ?? "phase2-arg",
        targetAdvocateRole: orig.targetAdvocateRole,
        cqKey: m.cqKey,
        action: m.action,
        rationale: orig.rationale,
        cqStatusId: m.cqStatusId,
        elidedByRebuttalCqKey: m.elidedByRebuttalCqKey,
      };
    });

  return {
    outcome: "ok",
    attempts: rec.attempts,
    tokenUsage: rec.tokenUsage,
    rebuttals,
    cqResponses,
  };
}
