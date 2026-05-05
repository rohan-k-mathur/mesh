/**
 * orchestrator/translators/attack-mint.ts
 *
 * Materializes a validated `RebuttalOutput` (Phase 3 — Dialectical
 * Testing) onto the live deliberation. For each rebuttal:
 *
 *   1. Mint the rebuttal's `conclusionText` as a Claim (via the per-phase
 *      ClaimRegistry — identical conclusion text from the same advocate
 *      collapses to a single Claim).
 *   2. Mint each premise text as an EMPIRICAL Claim (deduped via the same
 *      registry; identical premise text across phases / advocates / rounds
 *      collapses to a single canonical Claim).
 *   3. Resolve `schemeKey` → `schemeId` via the cached scheme catalog.
 *   4. POST /api/arguments to create the rebuttal `Argument` (just like
 *      Phase 2 — same route, same body shape).
 *   5. POST /api/citations/attach for each premise that has a citation
 *      token (same dedupe-per-arg rule as Phase 2).
 *   6. POST /api/arguments/{targetArgumentId}/attacks to create the
 *      `ArgumentEdge` binding the rebuttal to the target argument with
 *      the right `attackType`/`targetScope`/`targetPremiseId`/`cqKey`. If
 *      the rebuttal carries a `cqKey`, the attacks route also auto-marks
 *      the corresponding CQ as `answered`.
 *
 * Then for each `cqResponse` (raise or waive) NOT already covered by a
 * rebuttal's cqKey:
 *
 *   7. Upsert a `CQStatus` row directly via prisma (no API endpoint
 *      currently exists for the waive case, and the raise case would
 *      require argument-scheme lookups that would force two extra round
 *      trips per CQ). The composite unique key is
 *      (targetType, targetId, schemeKey, cqKey).
 *      - raise: status="open", statusEnum="OPEN"
 *      - waive: status="waived", statusEnum="SATISFIED"
 *
 * Orphan-guard:
 *   - Phase 3 has no partial-resume — every run re-mints from scratch.
 *     Before doing any of the above, delete any rebuttal `Argument` rows
 *     authored by this advocate in this deliberation that have outgoing
 *     `ArgumentEdge`s (the marker that distinguishes rebuttals from the
 *     advocate's Phase-2 arguments, which never have outgoing edges).
 *     Also delete this advocate's prior `CQStatus` rows whose `targetId`
 *     points at one of the opposing arguments. (Cascading from Argument
 *     deletion handles the edges automatically.)
 *
 * Idempotency:
 *   - Premise/conclusion Claim mints dedupe by server-side moid.
 *   - `POST /api/arguments` creates a new Argument every call — the
 *     orphan-guard above ensures we don't double-mint on retry.
 *   - `POST /api/arguments/{id}/attacks` is NOT idempotent — the orphan
 *     guard's cascade-delete of prior rebuttal Arguments removes any
 *     prior edges before we re-create them.
 *   - `POST /api/citations/attach` is idempotent on (targetType, targetId,
 *     sourceId, locator) — server returns existing row on dup.
 *
 * Author signing:
 *   - Each advocate signs its own rebuttal Argument writes, ArgumentEdge
 *     writes, and CQStatus writes ("advocate-a" / "advocate-b").
 */

import type { IsonomiaClient, IsonomiaCallContext } from "../isonomia-client";
import type { RoundLogger } from "../log/round-logger";
import { agentByRole } from "../config";
import type { OrchestratorConfig } from "../config";
import type {
  RebuttalOutput,
  RebuttalArgument,
  CqResponse,
} from "../agents/rebuttal-schema";
import { ClaimRegistry, resolvePremiseClaimIds } from "./claim-mint";
import { prisma } from "@/lib/prismaclient";

export interface AttackMintResult {
  /** Per-rebuttal result row (in input order). */
  rebuttals: Array<{
    inputIndex: number;
    rebuttalArgumentId: string;
    targetArgumentId: string;
    edgeId: string;
    attackType: "REBUT" | "UNDERMINE" | "UNDERCUT";
    targetPremiseIndex: number | null;
    targetPremiseClaimId: string | null;
    schemeKey: string;
    schemeId: string;
    conclusionClaimId: string;
    premiseClaimIds: string[];
    citations: Array<{ sourceId: string; citationId: string; citationToken: string }>;
    uncitedPremiseTexts: string[];
    cqKey: string | null;
  }>;
  /** Per-cqResponse result row (raises and waives). */
  cqResponses: Array<{
    inputIndex: number;
    targetArgumentId: string;
    cqKey: string;
    action: "raise" | "waive";
    cqStatusId: string;
    /** True if this CQResponse was elided because a rebuttal in the same
     *  output already carried this (targetArgumentId, cqKey) pair via
     *  its `cqKey` field. The /attacks route upserts CQStatus on its own
     *  in that case, and we don't write a second row. */
    elidedByRebuttalCqKey: boolean;
  }>;
  totals: {
    rebuttalsCreated: number;
    edgesCreated: number;
    cqStatusesUpserted: number;
    premiseClaimsMinted: number;
    premiseClaimsDeduped: number;
    citationsAttached: number;
  };
}

export interface TranslateRebuttalOpts {
  output: RebuttalOutput;
  deliberationId: string;
  iso: IsonomiaClient;
  logger: RoundLogger;
  cfg: OrchestratorConfig;

  /**
   * Citation token → sourceId map (same shape as Phase 2). Built once at
   * the Phase-3 driver level from the bound evidence corpus.
   */
  tokenToSourceId: Record<string, string>;

  /**
   * Premise-claim registry. Pass a single registry across both advocates
   * within a Phase-3 round so identical premise text collapses to one Claim.
   */
  registry: ClaimRegistry;

  /** Author role for write signing. */
  authorRole: "advocate-a" | "advocate-b";

  /**
   * Map of opposing argument id → that argument's scheme key. Needed to
   * compute the `schemeKey` field on CQStatus rows (the unique constraint
   * is `(targetType, targetId, schemeKey, cqKey)`).
   */
  opposingArgumentSchemeByArgId: ReadonlyMap<string, string>;

  /**
   * Map of opposing argument id → ordered premise claim ids. Needed to
   * resolve UNDERMINE.targetPremiseIndex → targetPremiseClaimId.
   */
  opposingArgumentPremisesByArgId: ReadonlyMap<string, readonly string[]>;

  /**
   * Map of opposing argument id → conclusionClaimId. Needed for REBUT
   * targeting (the route validates that targetClaimId === target.conclusionClaimId).
   */
  opposingArgumentConclusionByArgId: ReadonlyMap<string, string>;

  /**
   * Optional pre-fetched scheme catalog. If omitted, the translator fetches
   * `/api/schemes` itself on first call and caches the result.
   */
  schemeCatalog?: Array<{ id: string; key: string }>;
}

const ATTACK_TYPE_TO_API: Record<RebuttalArgument["attackType"], "REBUTS" | "UNDERMINES" | "UNDERCUTS"> = {
  REBUT: "REBUTS",
  UNDERMINE: "UNDERMINES",
  UNDERCUT: "UNDERCUTS",
};

const ATTACK_TYPE_TO_SCOPE: Record<RebuttalArgument["attackType"], "conclusion" | "inference" | "premise"> = {
  REBUT: "conclusion",
  UNDERCUT: "inference",
  UNDERMINE: "premise",
};

export async function translateRebuttalOutput(opts: TranslateRebuttalOpts): Promise<AttackMintResult> {
  const ctx: IsonomiaCallContext = { role: opts.authorRole, logger: opts.logger };
  const author = agentByRole(opts.cfg, opts.authorRole);
  const authorId = String(author.userId);

  // ─────────────────────────────────────────────────────────────────
  // 0. Orphan guard
  // ─────────────────────────────────────────────────────────────────
  // Delete prior rebuttal Arguments by this bot in this deliberation. We
  // identify rebuttals (vs. Phase-2 arguments) by the presence of an
  // outgoing ArgumentEdge created by this bot — Phase-2 arguments never
  // have outgoing edges. Cascade deletes the edges.
  const priorRebuttalIds = await prisma.argument.findMany({
    where: {
      deliberationId: opts.deliberationId,
      authorId,
      outgoingEdges: {
        some: { deliberationId: opts.deliberationId, createdById: authorId },
      },
    },
    select: { id: true },
  });
  if (priorRebuttalIds.length > 0) {
    const droppedRebuttals = await prisma.argument.deleteMany({
      where: { id: { in: priorRebuttalIds.map((r) => r.id) } },
    });
    opts.logger.event("orphan_cleanup", {
      step: "attack-mint",
      advocate: opts.authorRole,
      droppedRebuttalArguments: droppedRebuttals.count,
    });
  }

  // Delete prior CQStatus rows by this bot pointing at any opposing
  // argument. The unique constraint is (targetType, targetId, schemeKey,
  // cqKey) so we can delete by createdById + targetType + targetId-set.
  const opposingIds = [...opts.opposingArgumentSchemeByArgId.keys()];
  if (opposingIds.length > 0) {
    const droppedCq = await prisma.cQStatus.deleteMany({
      where: {
        createdById: authorId,
        targetType: "argument",
        targetId: { in: opposingIds },
      },
    });
    if (droppedCq.count > 0) {
      opts.logger.event("orphan_cleanup", {
        step: "attack-mint",
        advocate: opts.authorRole,
        droppedCqStatuses: droppedCq.count,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 1. Resolve scheme catalog → key→id map
  // ─────────────────────────────────────────────────────────────────
  const catalog = opts.schemeCatalog ?? (await opts.iso.listSchemes(opts.authorRole, opts.logger));
  const schemeIdByKey = new Map<string, string>();
  for (const s of catalog) schemeIdByKey.set(s.key, s.id);

  const missingSchemes = new Set<string>();
  for (const r of opts.output.rebuttals) {
    if (!schemeIdByKey.has(r.schemeKey)) missingSchemes.add(r.schemeKey);
  }
  if (missingSchemes.size > 0) {
    throw new Error(
      `attack-mint: scheme catalog missing keys [${[...missingSchemes].join(", ")}]; run scripts/seed-experiment-schemes.ts`,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. Pre-flight checks (mirror argument-mint)
  // ─────────────────────────────────────────────────────────────────
  const missingTargets = new Set<string>();
  const missingTokens = new Set<string>();
  for (const r of opts.output.rebuttals) {
    if (!opts.opposingArgumentSchemeByArgId.has(r.targetArgumentId)) {
      missingTargets.add(r.targetArgumentId);
    }
    for (const p of r.premises) {
      if (p.citationToken && !opts.tokenToSourceId[p.citationToken]) missingTokens.add(p.citationToken);
    }
  }
  for (const c of opts.output.cqResponses) {
    if (!opts.opposingArgumentSchemeByArgId.has(c.targetArgumentId)) {
      missingTargets.add(c.targetArgumentId);
    }
  }
  if (missingTargets.size > 0) {
    throw new Error(
      `attack-mint: opposing-argument map missing ids [${[...missingTargets].join(", ")}]; check Phase-3 driver binding`,
    );
  }
  if (missingTokens.size > 0) {
    throw new Error(
      `attack-mint: tokenToSourceId map missing tokens [${[...missingTokens].join(", ")}]; check evidence-context binding`,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. Mint each rebuttal Argument + edge + citations
  // ─────────────────────────────────────────────────────────────────
  const sizeBefore = opts.registry.size();
  const rebuttalResults: AttackMintResult["rebuttals"] = [];
  let citationsAttached = 0;
  let edgesCreated = 0;

  for (let i = 0; i < opts.output.rebuttals.length; i++) {
    const r = opts.output.rebuttals[i];
    const result = await mintOneRebuttal({
      r,
      inputIndex: i,
      authorId,
      ctx,
      iso: opts.iso,
      registry: opts.registry,
      tokenToSourceId: opts.tokenToSourceId,
      schemeIdByKey,
      deliberationId: opts.deliberationId,
      opposingPremisesByArgId: opts.opposingArgumentPremisesByArgId,
      opposingConclusionByArgId: opts.opposingArgumentConclusionByArgId,
      logger: opts.logger,
    });
    rebuttalResults.push(result);
    citationsAttached += result.citations.length;
    edgesCreated += 1;
  }

  // Track which (targetArgId, cqKey) pairs were already covered via a
  // rebuttal's cqKey — the /attacks route upserts CQStatus on its own in
  // that case, so we shouldn't write a duplicate row.
  const coveredByRebuttal = new Set<string>();
  for (const rr of rebuttalResults) {
    if (rr.cqKey !== null) coveredByRebuttal.add(`${rr.targetArgumentId}::${rr.cqKey}`);
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. Upsert each cqResponse (raise / waive) directly via prisma
  // ─────────────────────────────────────────────────────────────────
  const cqResults: AttackMintResult["cqResponses"] = [];
  for (let i = 0; i < opts.output.cqResponses.length; i++) {
    const c = opts.output.cqResponses[i];
    const compositeKey = `${c.targetArgumentId}::${c.cqKey}`;
    const elided = coveredByRebuttal.has(compositeKey);
    if (elided) {
      cqResults.push({
        inputIndex: i,
        targetArgumentId: c.targetArgumentId,
        cqKey: c.cqKey,
        action: c.action,
        cqStatusId: "(elided: covered by rebuttal cqKey)",
        elidedByRebuttalCqKey: true,
      });
      continue;
    }
    const cqStatusId = await upsertCqStatus({
      cq: c,
      authorId,
      schemeKey: opts.opposingArgumentSchemeByArgId.get(c.targetArgumentId)!,
      logger: opts.logger,
      advocate: opts.authorRole,
    });
    cqResults.push({
      inputIndex: i,
      targetArgumentId: c.targetArgumentId,
      cqKey: c.cqKey,
      action: c.action,
      cqStatusId,
      elidedByRebuttalCqKey: false,
    });
  }

  const sizeAfter = opts.registry.size();
  const totalNewClaimTextsSeen = opts.output.rebuttals.reduce(
    (n, r) => n + r.premises.length + 1, // +1 for conclusionText
    0,
  );
  const premiseClaimsMinted = sizeAfter - sizeBefore;
  const premiseClaimsDeduped = totalNewClaimTextsSeen - premiseClaimsMinted;

  const cqStatusesUpserted = cqResults.filter((c) => !c.elidedByRebuttalCqKey).length;

  const totals = {
    rebuttalsCreated: rebuttalResults.length,
    edgesCreated,
    cqStatusesUpserted,
    premiseClaimsMinted,
    premiseClaimsDeduped,
    citationsAttached,
  };

  opts.logger.event("round_summary", {
    step: "attack-mint",
    advocate: opts.authorRole,
    ...totals,
  });

  return { rebuttals: rebuttalResults, cqResponses: cqResults, totals };
}

// ─────────────────────────────────────────────────────────────────
// Per-rebuttal minting
// ─────────────────────────────────────────────────────────────────

interface MintOneRebuttalOpts {
  r: RebuttalArgument;
  inputIndex: number;
  authorId: string;
  ctx: IsonomiaCallContext;
  iso: IsonomiaClient;
  registry: ClaimRegistry;
  tokenToSourceId: Record<string, string>;
  schemeIdByKey: Map<string, string>;
  deliberationId: string;
  opposingPremisesByArgId: ReadonlyMap<string, readonly string[]>;
  opposingConclusionByArgId: ReadonlyMap<string, string>;
  logger: RoundLogger;
}

async function mintOneRebuttal(opts: MintOneRebuttalOpts): Promise<AttackMintResult["rebuttals"][number]> {
  const { r } = opts;
  const schemeId = opts.schemeIdByKey.get(r.schemeKey)!;

  // 1. Mint conclusion claim (deduped via registry).
  const [conclusionClaimId] = await resolvePremiseClaimIds({
    iso: opts.iso,
    ctx: opts.ctx,
    deliberationId: opts.deliberationId,
    registry: opts.registry,
    premiseTexts: [r.conclusionText],
    defaultClaimType: "EMPIRICAL",
  });

  // 2. Mint premise claims.
  const premiseTexts = r.premises.map((p) => p.text);
  const premiseClaimIds = await resolvePremiseClaimIds({
    iso: opts.iso,
    ctx: opts.ctx,
    deliberationId: opts.deliberationId,
    registry: opts.registry,
    premiseTexts,
    defaultClaimType: "EMPIRICAL",
  });

  // 3. Build display text: "P1. P2. ... Therefore, [conclusion]." with
  //    the warrant in a parenthetical when present. (Same shape as
  //    Phase-2 mintOneArgument.)
  const argumentText = buildRebuttalDisplayText(r);

  // 4. Create the rebuttal Argument.
  const { argumentId: rebuttalArgumentId } = await opts.iso.createArgument(
    {
      deliberationId: opts.deliberationId,
      authorId: opts.authorId,
      conclusionClaimId,
      premiseClaimIds,
      schemeId,
      implicitWarrant: r.warrant,
      text: argumentText,
      ruleType: "DEFEASIBLE",
    },
    opts.ctx,
  );

  // 5. Attach citations to the rebuttal Argument (one per premise that has a token).
  const citations: Array<{ sourceId: string; citationId: string; citationToken: string }> = [];
  const uncitedPremiseTexts: string[] = [];
  const seenSourceIds = new Set<string>();
  for (let p = 0; p < r.premises.length; p++) {
    const premise = r.premises[p];
    if (!premise.citationToken) {
      uncitedPremiseTexts.push(premise.text);
      continue;
    }
    const sourceId = opts.tokenToSourceId[premise.citationToken];
    if (seenSourceIds.has(sourceId)) continue;
    seenSourceIds.add(sourceId);

    const { citationId } = await opts.iso.attachCitation(
      {
        targetType: "argument",
        targetId: rebuttalArgumentId,
        sourceId,
        quote: premise.text.length <= 280 ? premise.text : premise.text.slice(0, 277) + "...",
        intent: "supports",
      },
      opts.ctx,
    );
    citations.push({ sourceId, citationId, citationToken: premise.citationToken });
  }

  // 6. Resolve targeting fields.
  let targetPremiseClaimId: string | null = null;
  let targetClaimIdField: string | null = null;
  if (r.attackType === "UNDERMINE") {
    const opposingPremises = opts.opposingPremisesByArgId.get(r.targetArgumentId) ?? [];
    if (r.targetPremiseIndex === null || r.targetPremiseIndex >= opposingPremises.length) {
      throw new Error(
        `attack-mint: rebuttal[${opts.inputIndex}] UNDERMINE has out-of-range targetPremiseIndex=${r.targetPremiseIndex} (target has ${opposingPremises.length} premises)`,
      );
    }
    targetPremiseClaimId = opposingPremises[r.targetPremiseIndex];
  } else if (r.attackType === "REBUT") {
    targetClaimIdField = opts.opposingConclusionByArgId.get(r.targetArgumentId) ?? null;
    if (!targetClaimIdField) {
      throw new Error(
        `attack-mint: rebuttal[${opts.inputIndex}] REBUT cannot resolve target conclusionClaimId for argument ${r.targetArgumentId}`,
      );
    }
  }
  // UNDERCUT: no extra targeting fields.

  // 7. Create the ArgumentEdge via /api/arguments/{targetId}/attacks.
  const { edgeId } = await opts.iso.attachAttack(
    r.targetArgumentId,
    {
      deliberationId: opts.deliberationId,
      createdById: opts.authorId,
      fromArgumentId: rebuttalArgumentId,
      toArgumentId: r.targetArgumentId,
      attackType: ATTACK_TYPE_TO_API[r.attackType],
      targetScope: ATTACK_TYPE_TO_SCOPE[r.attackType],
      targetClaimId: targetClaimIdField,
      targetPremiseId: targetPremiseClaimId,
      cqKey: r.cqKey,
    },
    opts.ctx,
  );

  return {
    inputIndex: opts.inputIndex,
    rebuttalArgumentId,
    targetArgumentId: r.targetArgumentId,
    edgeId,
    attackType: r.attackType,
    targetPremiseIndex: r.targetPremiseIndex,
    targetPremiseClaimId,
    schemeKey: r.schemeKey,
    schemeId,
    conclusionClaimId,
    premiseClaimIds,
    citations,
    uncitedPremiseTexts,
    cqKey: r.cqKey,
  };
}

// ─────────────────────────────────────────────────────────────────
// CQStatus upsert
// ─────────────────────────────────────────────────────────────────

interface UpsertCqStatusOpts {
  cq: CqResponse;
  authorId: string;
  schemeKey: string;
  logger: RoundLogger;
  advocate: "advocate-a" | "advocate-b";
}

async function upsertCqStatus(opts: UpsertCqStatusOpts): Promise<string> {
  const { cq } = opts;
  // Map to legacy + enum status fields. The schema keeps both for backward
  // compatibility; we set both so any consumer reading either gets a
  // consistent picture.
  const legacyStatus = cq.action === "raise" ? "open" : "waived";
  const statusEnum = cq.action === "raise" ? "OPEN" : "SATISFIED";

  const row = await prisma.cQStatus.upsert({
    where: {
      targetType_targetId_schemeKey_cqKey: {
        targetType: "argument",
        targetId: cq.targetArgumentId,
        schemeKey: opts.schemeKey,
        cqKey: cq.cqKey,
      },
    },
    update: {
      status: legacyStatus,
      statusEnum: statusEnum as any,
      argumentId: null,
      groundsText: cq.rationale,
      lastReviewedAt: new Date(),
      lastReviewedBy: opts.authorId,
    },
    create: {
      targetType: "argument",
      targetId: cq.targetArgumentId,
      schemeKey: opts.schemeKey,
      cqKey: cq.cqKey,
      status: legacyStatus,
      statusEnum: statusEnum as any,
      groundsText: cq.rationale,
      createdById: opts.authorId,
      lastReviewedAt: new Date(),
      lastReviewedBy: opts.authorId,
    },
  });

  opts.logger.event("cq_status_upserted", {
    advocate: opts.advocate,
    targetArgumentId: cq.targetArgumentId,
    cqKey: cq.cqKey,
    action: cq.action,
    cqStatusId: row.id,
  });

  return row.id;
}

// ─────────────────────────────────────────────────────────────────
// Display-text builder
// ─────────────────────────────────────────────────────────────────

function buildRebuttalDisplayText(r: RebuttalArgument): string {
  const premiseSentences = r.premises.map((p) => p.text.trim()).join(" ");
  const conclusion = r.conclusionText.trim();
  const warrantParen = r.warrant ? ` (Warrant: ${r.warrant.trim()})` : "";
  const attackLabel =
    r.attackType === "REBUT"
      ? "[REBUT]"
      : r.attackType === "UNDERMINE"
        ? `[UNDERMINE → premise #${r.targetPremiseIndex}]`
        : "[UNDERCUT]";
  return `${attackLabel} ${premiseSentences} Therefore, ${conclusion}${warrantParen}`;
}
