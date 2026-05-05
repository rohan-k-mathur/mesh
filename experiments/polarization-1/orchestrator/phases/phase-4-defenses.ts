/**
 * orchestrator/phases/phase-4-defenses.ts
 *
 * Phase-4 (Concessions & Defenses) control flow.
 *
 *   loadFraming → loadPhase2Complete → loadPhase3Complete
 *     → for each advocate (A, B, sequentially):
 *           build YOUR_PHASE_2_ARGUMENTS prompt block (THIS bot's Phase-2)
 *           build OPPONENT_ATTACKS_AGAINST_YOU prompt block (the OTHER bot's
 *             Phase-3 attacks targeting THIS bot's args)
 *           runDefenseTurn → translateDefenseOutput
 *     → write PHASE_4_PARTIAL.json
 *     → run Concession Tracker (single-shot judge over the full record)
 *     → re-write PHASE_4_PARTIAL.json with trackerVerdict + soft-check flags
 *
 * Prereqs:
 *   - PHASE_2_COMPLETE.json (Phase 2 finalized; gates Phase 3)
 *   - PHASE_3_COMPLETE.json (Phase 3 finalized; ensures all "[x] revise"
 *     flags from the Phase-3 review report are already applied — that's
 *     what `finalizePhase3` enforces). Therefore the "Flag-12 revision
 *     pre-step" is a no-op in the happy path; the only thing this driver
 *     does is verify PHASE_3_COMPLETE.status === "complete".
 *
 * Resumability: same shape as Phase 3. If both advocates have outcome="ok"
 * AND a tracker verdict is present in the prior partial, this is a no-op.
 * Otherwise: missing/errored advocates re-run and the tracker re-runs.
 *
 * Sequential A→B rationale: same as Phase 3 (Anthropic per-key budget +
 * fail-fast on A before spending B-tokens).
 */

import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import path from "path";

import type { OrchestratorConfig } from "../config";
import type { IsonomiaClient } from "../isonomia-client";
import type { AnthropicClient } from "../anthropic-client";
import { RoundLogger } from "../log/round-logger";

import { loadFraming } from "../util/framing";
import { renderEvidenceCorpus } from "../util/evidence-corpus";

import {
  runDefenseTurn,
  isDefenseRefusal,
  DefenseValidationError,
  type DefenseAgentRole,
} from "../agents/defense";
import type {
  DefenseOutput,
  DefenseRefusal,
} from "../agents/defense-schema";

import {
  runTrackerTurn,
  isTrackerRefusal,
  TrackerValidationError,
} from "../agents/tracker";
import type {
  TrackerVerdict,
  TrackerRefusal,
  TrackerArgumentBinding,
} from "../agents/tracker-schema";

import {
  translateDefenseOutput,
  type DefenseMintResult,
  type OwnArgumentBinding,
  type OpposingRebuttalBinding,
  type OpposingCqRaiseBinding,
} from "../translators/defense-mint";
import { ClaimRegistry } from "../translators/claim-mint";
import { buildTokenToSourceIdMap } from "../translators/argument-mint";

import {
  runPhase4SoftChecks,
  type ReviewFlag,
  type OpposingRebuttalMeta,
  type OpposingCqRaiseMeta,
} from "../review/phase-4-checks";

import type {
  Phase2CompleteFile,
  Phase2CompleteAdvocate,
  Phase2CompleteArgument,
} from "../finalize/phase-2-finalize";
import type {
  Phase3CompleteFile,
  Phase3CompleteAdvocate,
  Phase3CompleteRebuttal,
  Phase3CompleteCqResponse,
} from "../finalize/phase-3-finalize";

// ─────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────

export interface RunPhase4Opts {
  cfg: OrchestratorConfig;
  iso: IsonomiaClient;
  llm: AnthropicClient;
  deliberationId: string;
  onlyAdvocate?: DefenseAgentRole;
  /** If set, skip the tracker run (e.g. for fast iteration on advocates). */
  skipTracker?: boolean;
  resume?: boolean;
}

export interface DefenseRunRecord {
  role: DefenseAgentRole;
  outcome: "ok" | "refused" | "validation-error";
  attempts: number;
  tokenUsage: { inputTokens: number; outputTokens: number };
  llmOutput?: DefenseOutput;
  mintResult?: DefenseMintResult;
  refusal?: DefenseRefusal;
  refusalPath?: string;
  validationError?: { message: string; rawResponsesCount: number };
  artifacts: {
    promptPath: string;
    llmOutputPath?: string;
    roundLogPath: string;
  };
}

export interface TrackerRunRecord {
  outcome: "ok" | "refused" | "validation-error" | "skipped";
  attempts?: number;
  tokenUsage?: { inputTokens: number; outputTokens: number };
  verdict?: TrackerVerdict;
  refusal?: TrackerRefusal;
  refusalPath?: string;
  validationError?: { message: string; rawResponsesCount: number };
  artifacts?: {
    promptPath: string;
    verdictPath?: string;
    roundLogPath: string;
  };
}

export interface Phase4PartialFile {
  phase: 4;
  status: "partial";
  generatedAt: string;
  deliberationId: string;
  modelTier: string;
  evidenceStackId: string;
  hingeIndices: number[];
  advocates: { a?: DefenseRunRecord; b?: DefenseRunRecord };
  tracker: TrackerRunRecord;
  totals: {
    defensesCreated: number;
    edgesCreated: number;
    narrowsCreated: number;
    concedesApplied: number;
    commitmentsRetracted: number;
    cqStatusesUpserted: number;
    citationsAttached: number;
    premiseClaimsMinted: number;
    premiseClaimsDeduped: number;
    inputTokens: number;
    outputTokens: number;
  };
  /** Soft-check review flags (populated by runPhase4SoftChecks). */
  reviewFlags: ReviewFlag[];
  judgeUsage?: { calls: number; inputTokens: number; outputTokens: number };
  artifacts: { partialPath: string };
}

const PHASE_4_LLM_DIR = "llm";
const PHASE_4_PARTIAL_FILE = "PHASE_4_PARTIAL.json";
const REFUSALS_DIR = "refusals";

// ─────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────

export async function runPhase(opts: RunPhase4Opts): Promise<Phase4PartialFile> {
  const phaseLogger = RoundLogger.forRound({
    runtimeDir: opts.cfg.runtimeDir,
    phase: 4,
    round: 0,
  });

  // 1. Prereqs (Phase 2 + Phase 3 complete; Phase 3 finalize already
  //    enforced that every "[x] revise" flag is applied, so the
  //    Flag-12-revision pre-step is a no-op in the happy path).
  const phase2 = loadPhase2Complete(opts.cfg.runtimeDir, opts.deliberationId);
  const phase3 = loadPhase3Complete(opts.cfg.runtimeDir, opts.deliberationId);
  const framing = loadFraming(opts.cfg.experimentRoot);
  const subClaimTextByIndex = loadSubClaimTextByIndex(opts.cfg.runtimeDir);

  // 2. Evidence corpus + scheme catalog.
  const ec = await opts.iso.getEvidenceContext(opts.deliberationId, {
    role: "advocate-a",
    logger: phaseLogger,
  });
  const evidenceCorpusPrompt = renderEvidenceCorpus({ stack: ec.stack, sources: ec.sources });
  const tokenToSourceId = buildTokenToSourceIdMap(ec);
  const allowedCitationTokens = new Set(Object.keys(tokenToSourceId));
  if (allowedCitationTokens.size === 0) {
    throw new Error(
      `Phase 4: bound evidence corpus has no usable citationTokens (stackId=${ec.stack.id}).`,
    );
  }
  const schemeCatalog = await opts.iso.listSchemes("advocate-a", phaseLogger);

  // 3. Build per-advocate own-arg + opposing-rebuttal + opposing-cq-raise maps.
  const ownArgsByRole = {
    "advocate-a": buildOwnArgumentBindings(phase2.advocates.a, schemeCatalog, subClaimTextByIndex),
    "advocate-b": buildOwnArgumentBindings(phase2.advocates.b, schemeCatalog, subClaimTextByIndex),
  } as const;
  const opposingRebuttalsByRole = {
    "advocate-a": buildOpposingRebuttalBindings(phase3.advocates.b, ownArgsByRole["advocate-a"]),
    "advocate-b": buildOpposingRebuttalBindings(phase3.advocates.a, ownArgsByRole["advocate-b"]),
  } as const;
  const opposingCqRaisesByRole = {
    "advocate-a": buildOpposingCqRaiseBindings(phase3.advocates.b, ownArgsByRole["advocate-a"]),
    "advocate-b": buildOpposingCqRaiseBindings(phase3.advocates.a, ownArgsByRole["advocate-b"]),
  } as const;

  // 4. Pre-render YOUR_PHASE_2 + OPPONENT_ATTACKS prompts per advocate.
  const yourPhase2PromptByRole = {
    "advocate-a": renderOwnPhase2(phase2.advocates.a, "A", subClaimTextByIndex),
    "advocate-b": renderOwnPhase2(phase2.advocates.b, "B", subClaimTextByIndex),
  } as const;
  const opponentAttacksPromptByRole = {
    "advocate-a": renderOpponentAttacks(phase3.advocates.b, "B", ownArgsByRole["advocate-a"]),
    "advocate-b": renderOpponentAttacks(phase3.advocates.a, "A", ownArgsByRole["advocate-b"]),
  } as const;

  // 5. Resume.
  const partialPath = path.join(opts.cfg.runtimeDir, PHASE_4_PARTIAL_FILE);
  let priorPartial: Phase4PartialFile | null = null;
  if (existsSync(partialPath)) {
    try {
      const raw = JSON.parse(readFileSync(partialPath, "utf8")) as Phase4PartialFile;
      if (raw.deliberationId === opts.deliberationId) priorPartial = raw;
    } catch {
      // ignore corrupt
    }
  }

  // 6. Decide which advocates to run.
  const advocatesToRun: DefenseAgentRole[] = (() => {
    if (opts.onlyAdvocate) return [opts.onlyAdvocate];
    const all: DefenseAgentRole[] = ["advocate-a", "advocate-b"];
    if (!priorPartial) return all;
    return all.filter((r) => {
      const rec = r === "advocate-a" ? priorPartial!.advocates.a : priorPartial!.advocates.b;
      return !rec || rec.outcome !== "ok";
    });
  })();

  // 7. Shared registry across both advocates within this run.
  const registry = new ClaimRegistry();

  // 8. Run each advocate sequentially.
  const results: { a?: DefenseRunRecord; b?: DefenseRunRecord } = {
    a: priorPartial?.advocates.a,
    b: priorPartial?.advocates.b,
  };

  for (const role of advocatesToRun) {
    const ownArgs = ownArgsByRole[role];
    const oppReb = opposingRebuttalsByRole[role];
    const oppCq = opposingCqRaisesByRole[role];

    if (oppReb.size === 0 && oppCq.size === 0) {
      phaseLogger.event("phase_skip_advocate", {
        phase: 4,
        agent: role,
        reason: "no opposing attacks or CQ raises against this advocate",
      });
      const empty: DefenseRunRecord = {
        role,
        outcome: "ok",
        attempts: 0,
        tokenUsage: { inputTokens: 0, outputTokens: 0 },
        llmOutput: { phase: "4", advocateRole: role === "advocate-a" ? "A" : "B", responses: [], cqAnswers: [] },
        artifacts: {
          promptPath: defensePromptPath(opts.cfg, role),
          roundLogPath: roundLogPath(opts.cfg, role),
        },
      };
      if (role === "advocate-a") results.a = empty;
      else results.b = empty;
      continue;
    }

    const rec = await runOneAdvocate({
      role,
      cfg: opts.cfg,
      iso: opts.iso,
      llm: opts.llm,
      deliberationId: opts.deliberationId,
      framing: framing.full,
      yourPhase2ArgumentsPrompt: yourPhase2PromptByRole[role],
      opponentAttacksPrompt: opponentAttacksPromptByRole[role],
      evidenceCorpusPrompt,
      ownArguments: ownArgs,
      opposingRebuttals: oppReb,
      opposingCqRaises: oppCq,
      tokenToSourceId,
      allowedCitationTokens,
      registry,
      schemeCatalog,
    });
    if (role === "advocate-a") results.a = rec;
    else results.b = rec;

    // Write partial after each advocate so we don't lose work on tracker failure.
    writePartial(
      partialPath,
      opts,
      ec.stack.id,
      phase2.topologyBinding.hingeIndices,
      results,
      priorPartial?.tracker ?? { outcome: "skipped" },
      priorPartial?.reviewFlags ?? [],
    );
  }

  // 9. Concession Tracker.
  const tracker = await maybeRunTracker({
    cfg: opts.cfg,
    iso: opts.iso,
    llm: opts.llm,
    deliberationId: opts.deliberationId,
    skipTracker: opts.skipTracker,
    framing: framing.full,
    subClaimTextByIndex,
    phase2,
    phase3,
    results,
    evidenceCorpusPrompt,
    hingeIndices: phase2.topologyBinding.hingeIndices,
    logger: phaseLogger,
    priorTracker: priorPartial?.tracker,
  });

  // 9b. Soft-track review.
  const defenseOutputs = {
    a: results.a?.outcome === "ok" ? results.a.llmOutput : undefined,
    b: results.b?.outcome === "ok" ? results.b.llmOutput : undefined,
  };
  const anyOk = Boolean(defenseOutputs.a || defenseOutputs.b);
  const opposingRebuttalMetaByAdv = {
    a: buildOpposingRebuttalMeta(phase3.advocates.b, phase2.advocates.a),
    b: buildOpposingRebuttalMeta(phase3.advocates.a, phase2.advocates.b),
  };
  const opposingCqMetaByAdv = {
    a: buildOpposingCqRaiseMeta(phase3.advocates.b, phase2.advocates.a),
    b: buildOpposingCqRaiseMeta(phase3.advocates.a, phase2.advocates.b),
  };
  const reviewSourcesLite = ec.sources.map((s: any) => ({
    sourceId: s.sourceId,
    citationToken: s.citationToken,
    title: s.title ?? null,
    authors: Array.isArray(s.authors) ? s.authors : [],
    publishedAt: s.publishedAt ?? null,
    abstract: s.abstract ?? null,
    keyFindings: Array.isArray(s.keyFindings) ? s.keyFindings : [],
    tags: Array.isArray(s.tags) ? s.tags : [],
  }));
  const review = anyOk
    ? await runPhase4SoftChecks({
        defenses: defenseOutputs,
        opposingRebuttalsByAdvocate: opposingRebuttalMetaByAdv,
        opposingCqRaisesByAdvocate: opposingCqMetaByAdv,
        hingeIndices: phase2.topologyBinding.hingeIndices,
        sources: reviewSourcesLite,
        llm: opts.llm,
        cfg: opts.cfg,
        logger: phaseLogger,
      })
    : { flags: [] as ReviewFlag[], judgeUsage: { calls: 0, inputTokens: 0, outputTokens: 0 } };
  phaseLogger.event("round_summary", {
    step: "soft-review",
    flagCount: review.flags.length,
    judgeCalls: review.judgeUsage.calls,
  });

  // 10. Final partial write.
  const partial = writePartial(
    partialPath,
    opts,
    ec.stack.id,
    phase2.topologyBinding.hingeIndices,
    results,
    tracker,
    review.flags,
    review.judgeUsage.calls > 0 ? review.judgeUsage : undefined,
  );

  const okCount = Number(results.a?.outcome === "ok") + Number(results.b?.outcome === "ok");
  const refusedCount =
    Number(results.a?.outcome === "refused") + Number(results.b?.outcome === "refused");
  const errorCount =
    Number(results.a?.outcome === "validation-error") +
    Number(results.b?.outcome === "validation-error");

  phaseLogger.event("phase_complete", {
    phase: 4,
    outcome: okCount === 2 && tracker.outcome === "ok" ? "partial-written" : "incomplete",
    okCount,
    refusedCount,
    errorCount,
    trackerOutcome: tracker.outcome,
    totals: partial.totals,
    partialPath,
  });

  if (okCount === 0 && refusedCount > 0) {
    const err = new BothAdvocatesRefusedError(
      `Phase 4: both advocates refused. See refusals at runtime/${REFUSALS_DIR}/.`,
    );
    err.partial = partial;
    throw err;
  }
  if (errorCount > 0 && okCount === 0) {
    throw new Error(
      `Phase 4: hard-validation failed for advocate(s) without any successful run. See partial at ${partialPath}.`,
    );
  }

  return partial;
}

// ─────────────────────────────────────────────────────────────────
// One-advocate driver
// ─────────────────────────────────────────────────────────────────

interface RunOneAdvocateOpts {
  role: DefenseAgentRole;
  cfg: OrchestratorConfig;
  iso: IsonomiaClient;
  llm: AnthropicClient;
  deliberationId: string;
  framing: string;
  yourPhase2ArgumentsPrompt: string;
  opponentAttacksPrompt: string;
  evidenceCorpusPrompt: string;
  ownArguments: ReadonlyMap<string, OwnArgumentBinding>;
  opposingRebuttals: ReadonlyMap<string, OpposingRebuttalBinding>;
  opposingCqRaises: ReadonlyMap<string, OpposingCqRaiseBinding>;
  tokenToSourceId: Record<string, string>;
  allowedCitationTokens: Set<string>;
  registry: ClaimRegistry;
  schemeCatalog: Array<{ id: string; key: string }>;
}

async function runOneAdvocate(opts: RunOneAdvocateOpts): Promise<DefenseRunRecord> {
  const round = opts.role === "advocate-a" ? 1 : 2;
  const logger = RoundLogger.forRound({
    runtimeDir: opts.cfg.runtimeDir,
    phase: 4,
    round,
    agentRole: opts.role,
  });
  const promptPath = defensePromptPath(opts.cfg, opts.role);
  const llmDir = path.join(opts.cfg.runtimeDir, PHASE_4_LLM_DIR);
  const llmOutputPath = path.join(llmDir, `phase-4-${opts.role}-output.json`);
  const baseArtifacts = { promptPath, roundLogPath: roundLogPath(opts.cfg, opts.role) };

  // Build the schema-binding shape the agent's runner expects. The Zod
  // schema needs OpposingRebuttalBinding shape from defense-schema.ts;
  // we already have the richer translator-side shape from defense-mint —
  // map it down to what the schema needs.
  const schemaOpposingRebuttals = new Map(
    Array.from(opts.opposingRebuttals.entries()).map(([id, b]) => [
      id,
      {
        rebuttalArgumentId: b.rebuttalArgumentId,
        targetArgumentId: b.targetArgumentId,
        rebuttalPremiseCount: b.rebuttalPremiseCount,
        rebuttalAttackType: b.rebuttalAttackType,
        rebuttalTargetPremiseIndex: b.rebuttalTargetPremiseIndex,
        cqKey: b.cqKey,
      },
    ]),
  );
  const schemaOpposingCqRaises = new Map(
    Array.from(opts.opposingCqRaises.entries()).map(([id, b]) => [
      id,
      {
        cqResponseId: b.cqResponseId,
        targetArgumentId: b.targetArgumentId,
        cqKey: b.cqKey,
      },
    ]),
  );

  let turn;
  try {
    turn = await runDefenseTurn({
      role: opts.role,
      promptPath,
      framing: opts.framing,
      yourPhase2ArgumentsPrompt: opts.yourPhase2ArgumentsPrompt,
      opponentAttacksPrompt: opts.opponentAttacksPrompt,
      evidenceCorpusPrompt: opts.evidenceCorpusPrompt,
      schemaOpts: {
        opposingRebuttals: schemaOpposingRebuttals,
        opposingCqRaises: schemaOpposingCqRaises,
        allowedCitationTokens: opts.allowedCitationTokens,
      },
      cfg: opts.cfg,
      llm: opts.llm,
      logger,
    });
  } catch (err) {
    if (err instanceof DefenseValidationError) {
      logger.event("phase_complete", {
        phase: 4,
        round,
        agent: opts.role,
        outcome: "validation-error",
        attempts: err.attempts,
      });
      return {
        role: opts.role,
        outcome: "validation-error",
        attempts: err.attempts,
        tokenUsage: { inputTokens: 0, outputTokens: 0 },
        validationError: { message: err.message, rawResponsesCount: err.rawResponses.length },
        artifacts: baseArtifacts,
      };
    }
    throw err;
  }

  // Refusal path.
  if (isDefenseRefusal(turn.response)) {
    const refusalPath = path.join(
      opts.cfg.runtimeDir,
      REFUSALS_DIR,
      `phase-4-${opts.role}-refusal.json`,
    );
    mkdirSync(path.dirname(refusalPath), { recursive: true });
    writeFileSync(refusalPath, JSON.stringify(turn.response, null, 2));
    logger.event("phase_complete", {
      phase: 4,
      round,
      agent: opts.role,
      outcome: "refused",
      reason: turn.response.error,
      refusalPath,
    });
    return {
      role: opts.role,
      outcome: "refused",
      attempts: turn.attempts,
      tokenUsage: turn.usage,
      refusal: turn.response,
      refusalPath,
      artifacts: baseArtifacts,
    };
  }

  // Success: persist LLM output, then mint.
  mkdirSync(llmDir, { recursive: true });
  writeFileSync(llmOutputPath, JSON.stringify(turn.response, null, 2));

  const mintResult = await translateDefenseOutput({
    output: turn.response,
    deliberationId: opts.deliberationId,
    iso: opts.iso,
    logger,
    cfg: opts.cfg,
    tokenToSourceId: opts.tokenToSourceId,
    registry: opts.registry,
    authorRole: opts.role,
    ownArguments: opts.ownArguments,
    opposingRebuttals: opts.opposingRebuttals,
    opposingCqRaises: opts.opposingCqRaises,
    schemeCatalog: opts.schemeCatalog,
    stackId: opts.cfg.deliberation.evidenceStackId ?? null,
  });

  logger.event("phase_complete", {
    phase: 4,
    round,
    agent: opts.role,
    outcome: "ok",
    ...mintResult.totals,
  });

  return {
    role: opts.role,
    outcome: "ok",
    attempts: turn.attempts,
    tokenUsage: turn.usage,
    llmOutput: turn.response,
    mintResult,
    artifacts: { ...baseArtifacts, llmOutputPath },
  };
}

// ─────────────────────────────────────────────────────────────────
// Concession Tracker
// ─────────────────────────────────────────────────────────────────

interface MaybeRunTrackerOpts {
  cfg: OrchestratorConfig;
  iso: IsonomiaClient;
  llm: AnthropicClient;
  deliberationId: string;
  skipTracker?: boolean;
  framing: string;
  subClaimTextByIndex: Record<number, string>;
  phase2: Phase2CompleteFile;
  phase3: Phase3CompleteFile;
  results: { a?: DefenseRunRecord; b?: DefenseRunRecord };
  evidenceCorpusPrompt: string;
  hingeIndices: number[];
  logger: RoundLogger;
  priorTracker: TrackerRunRecord | undefined;
}

async function maybeRunTracker(opts: MaybeRunTrackerOpts): Promise<TrackerRunRecord> {
  if (opts.skipTracker) {
    opts.logger.event("phase_skip_tracker", { phase: 4, reason: "skipTracker flag set" });
    return { outcome: "skipped" };
  }
  if (opts.priorTracker?.outcome === "ok") {
    opts.logger.event("phase_skip_tracker", { phase: 4, reason: "tracker already complete in prior partial" });
    return opts.priorTracker;
  }
  if (opts.results.a?.outcome !== "ok" || opts.results.b?.outcome !== "ok") {
    opts.logger.event("phase_skip_tracker", {
      phase: 4,
      reason: "advocate(s) did not complete successfully; tracker requires both A and B Phase-4 outputs",
      aOutcome: opts.results.a?.outcome ?? "(missing)",
      bOutcome: opts.results.b?.outcome ?? "(missing)",
    });
    return { outcome: "skipped" };
  }

  const round = 3;
  const logger = RoundLogger.forRound({
    runtimeDir: opts.cfg.runtimeDir,
    phase: 4,
    round,
    agentRole: "tracker",
  });
  const promptPath = path.join(opts.cfg.experimentRoot, "prompts/8-tracker.md");
  const verdictPath = path.join(opts.cfg.runtimeDir, PHASE_4_LLM_DIR, "phase-4-tracker-verdict.json");
  const baseArtifacts = {
    promptPath,
    roundLogPath: path.join(opts.cfg.runtimeDir, "logs", `round-4-${round}-tracker.jsonl`),
  };

  // Build prompt blocks.
  const topologyPrompt = renderTopology({
    centralClaim: opts.phase3.cqCatalog ? "(see FRAMING)" : "(see FRAMING)",
    subClaimTextByIndex: opts.subClaimTextByIndex,
    hingeIndices: opts.hingeIndices,
    layerByIndex: opts.phase2.topologyBinding.layerByIndex,
  });
  const aPhase2Prompt = renderOwnPhase2(opts.phase2.advocates.a, "A", opts.subClaimTextByIndex);
  const bPhase2Prompt = renderOwnPhase2(opts.phase2.advocates.b, "B", opts.subClaimTextByIndex);
  const aPhase3Prompt = renderPhase3Block(opts.phase3.advocates.a, "A");
  const bPhase3Prompt = renderPhase3Block(opts.phase3.advocates.b, "B");
  const aPhase4Prompt = renderPhase4Block(opts.results.a!, "A");
  const bPhase4Prompt = renderPhase4Block(opts.results.b!, "B");

  // Schema bindings.
  const knownArguments = new Map<string, TrackerArgumentBinding>();
  const hingeSet = new Set(opts.hingeIndices);
  for (const arg of opts.phase2.advocates.a.arguments) {
    knownArguments.set(arg.argumentId, {
      argumentId: arg.argumentId,
      advocateRole: "A",
      isHingeArgument: hingeSet.has(arg.conclusionClaimIndex),
    });
  }
  for (const arg of opts.phase2.advocates.b.arguments) {
    knownArguments.set(arg.argumentId, {
      argumentId: arg.argumentId,
      advocateRole: "B",
      isHingeArgument: hingeSet.has(arg.conclusionClaimIndex),
    });
  }
  const knownAttackIds = new Set<string>();
  for (const r of opts.phase3.advocates.a.rebuttals) knownAttackIds.add(r.rebuttalArgumentId);
  for (const r of opts.phase3.advocates.b.rebuttals) knownAttackIds.add(r.rebuttalArgumentId);
  const knownPhase4ResponseIds = new Set<string>();
  // Tracker references responses by Phase-3 rebuttalArgumentId (drivenBy is
  // a Phase-4 response id which we synthesize: `phase4-{role}-{idx}`).
  // Since we don't currently mint a stable "responseId" in DefenseOutput,
  // accept the synthesized form below.
  if (opts.results.a?.llmOutput) {
    for (let i = 0; i < opts.results.a.llmOutput.responses.length; i++) {
      knownPhase4ResponseIds.add(`phase4-A-r${i}`);
    }
    for (let i = 0; i < opts.results.a.llmOutput.cqAnswers.length; i++) {
      knownPhase4ResponseIds.add(`phase4-A-cq${i}`);
    }
  }
  if (opts.results.b?.llmOutput) {
    for (let i = 0; i < opts.results.b.llmOutput.responses.length; i++) {
      knownPhase4ResponseIds.add(`phase4-B-r${i}`);
    }
    for (let i = 0; i < opts.results.b.llmOutput.cqAnswers.length; i++) {
      knownPhase4ResponseIds.add(`phase4-B-cq${i}`);
    }
  }

  let turn;
  try {
    turn = await runTrackerTurn({
      promptPath,
      framing: opts.framing,
      topologyPrompt,
      advocateAPhase2Prompt: aPhase2Prompt,
      advocateBPhase2Prompt: bPhase2Prompt,
      advocateAPhase3Prompt: aPhase3Prompt,
      advocateBPhase3Prompt: bPhase3Prompt,
      advocateAPhase4Prompt: aPhase4Prompt,
      advocateBPhase4Prompt: bPhase4Prompt,
      evidenceCorpusPrompt: opts.evidenceCorpusPrompt,
      schemaOpts: { knownArguments, knownAttackIds, knownPhase4ResponseIds },
      cfg: opts.cfg,
      llm: opts.llm,
      logger,
    });
  } catch (err) {
    if (err instanceof TrackerValidationError) {
      logger.event("phase_complete", { phase: 4, round, agent: "tracker", outcome: "validation-error", attempts: err.attempts });
      return {
        outcome: "validation-error",
        attempts: err.attempts,
        validationError: { message: err.message, rawResponsesCount: err.rawResponses.length },
        artifacts: baseArtifacts,
      };
    }
    throw err;
  }

  if (isTrackerRefusal(turn.response)) {
    const refusalPath = path.join(opts.cfg.runtimeDir, REFUSALS_DIR, `phase-4-tracker-refusal.json`);
    mkdirSync(path.dirname(refusalPath), { recursive: true });
    writeFileSync(refusalPath, JSON.stringify(turn.response, null, 2));
    logger.event("phase_complete", { phase: 4, round, agent: "tracker", outcome: "refused", reason: turn.response.error });
    return {
      outcome: "refused",
      attempts: turn.attempts,
      tokenUsage: turn.usage,
      refusal: turn.response,
      refusalPath,
      artifacts: baseArtifacts,
    };
  }

  mkdirSync(path.dirname(verdictPath), { recursive: true });
  writeFileSync(verdictPath, JSON.stringify(turn.response, null, 2));
  logger.event("phase_complete", {
    phase: 4,
    round,
    agent: "tracker",
    outcome: "ok",
    verdict: turn.response.centralClaimVerdict.verdict,
  });
  return {
    outcome: "ok",
    attempts: turn.attempts,
    tokenUsage: turn.usage,
    verdict: turn.response,
    artifacts: { ...baseArtifacts, verdictPath },
  };
}

// ─────────────────────────────────────────────────────────────────
// Loaders
// ─────────────────────────────────────────────────────────────────

function loadPhase2Complete(runtimeDir: string, deliberationId: string): Phase2CompleteFile {
  const p = path.join(runtimeDir, "PHASE_2_COMPLETE.json");
  if (!existsSync(p)) {
    throw new Error(`Phase 4 prereq missing: ${p}. Run phase 2 + finalize.`);
  }
  const raw = JSON.parse(readFileSync(p, "utf8")) as Phase2CompleteFile;
  if (raw.status !== "complete") {
    throw new Error(`Phase 4 prereq invalid: ${p} status="${raw.status}", expected "complete"`);
  }
  if (raw.deliberationId !== deliberationId) {
    throw new Error(
      `Phase 4 prereq mismatch: PHASE_2_COMPLETE.json deliberationId=${raw.deliberationId} but current=${deliberationId}`,
    );
  }
  return raw;
}

function loadPhase3Complete(runtimeDir: string, deliberationId: string): Phase3CompleteFile {
  const p = path.join(runtimeDir, "PHASE_3_COMPLETE.json");
  if (!existsSync(p)) {
    throw new Error(`Phase 4 prereq missing: ${p}. Run phase 3 + finalize.`);
  }
  const raw = JSON.parse(readFileSync(p, "utf8")) as Phase3CompleteFile;
  if (raw.status !== "complete") {
    throw new Error(`Phase 4 prereq invalid: ${p} status="${raw.status}", expected "complete"`);
  }
  if (raw.deliberationId !== deliberationId) {
    throw new Error(
      `Phase 4 prereq mismatch: PHASE_3_COMPLETE.json deliberationId=${raw.deliberationId} but current=${deliberationId}`,
    );
  }
  return raw;
}

function loadSubClaimTextByIndex(runtimeDir: string): Record<number, string> {
  const p = path.join(runtimeDir, "PHASE_1_COMPLETE.json");
  const out: Record<number, string> = {};
  if (!existsSync(p)) return out;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as { topology?: Record<string, { text: string }> };
    if (raw.topology) {
      for (const [k, v] of Object.entries(raw.topology)) out[Number(k)] = v.text;
    }
  } catch {
    // tolerate
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────
// Binding builders
// ─────────────────────────────────────────────────────────────────

function buildOwnArgumentBindings(
  own: Phase2CompleteAdvocate,
  schemeCatalog: Array<{ id: string; key: string }>,
  subClaimTextByIndex: Record<number, string>,
): Map<string, OwnArgumentBinding> {
  const schemeIdByKey = new Map(schemeCatalog.map((s) => [s.key, s.id]));
  const m = new Map<string, OwnArgumentBinding>();
  for (const a of own.arguments) {
    const conclusionText = subClaimTextByIndex[a.conclusionClaimIndex] ?? "(text unavailable)";
    m.set(a.argumentId, {
      argumentId: a.argumentId,
      schemeKey: a.schemeKey,
      schemeId: a.schemeId ?? schemeIdByKey.get(a.schemeKey) ?? "",
      conclusionClaimId: a.conclusionClaimId,
      conclusionText,
      premiseClaimIds: a.premiseClaimIds,
      premiseTexts: a.premiseTexts,
    });
  }
  return m;
}

function buildOpposingRebuttalBindings(
  oppPhase3: Phase3CompleteAdvocate,
  ownArgs: ReadonlyMap<string, OwnArgumentBinding>,
): Map<string, OpposingRebuttalBinding> {
  const m = new Map<string, OpposingRebuttalBinding>();
  for (const r of oppPhase3.rebuttals) {
    if (!ownArgs.has(r.targetArgumentId)) continue; // skip rebuttals targeting unknown args
    m.set(r.rebuttalArgumentId, {
      rebuttalArgumentId: r.rebuttalArgumentId,
      targetArgumentId: r.targetArgumentId,
      rebuttalPremiseCount: r.premiseClaimIds.length,
      rebuttalPremiseClaimIds: r.premiseClaimIds,
      rebuttalAttackType: r.attackType,
      rebuttalTargetPremiseIndex: r.targetPremiseIndex,
      rebuttalConclusionClaimId: r.conclusionClaimId,
      cqKey: r.cqKey,
    });
  }
  return m;
}

function buildOpposingCqRaiseBindings(
  oppPhase3: Phase3CompleteAdvocate,
  ownArgs: ReadonlyMap<string, OwnArgumentBinding>,
): Map<string, OpposingCqRaiseBinding> {
  const m = new Map<string, OpposingCqRaiseBinding>();
  // Use index as a stable cqResponseId since CQResponse has no first-class
  // id we exposed in Phase 3 finalize. The composite (targetArgumentId, cqKey)
  // is unique per advocate-direction so we synthesize a stable id.
  for (let i = 0; i < oppPhase3.cqResponses.length; i++) {
    const c = oppPhase3.cqResponses[i];
    if (c.action !== "raise") continue;
    if (c.elidedByRebuttalCqKey) continue; // covered by rebuttal cqKey
    if (!ownArgs.has(c.targetArgumentId)) continue;
    const cqResponseId = `cqraise:${c.targetArgumentId}:${c.cqKey}`;
    m.set(cqResponseId, {
      cqResponseId,
      targetArgumentId: c.targetArgumentId,
      cqKey: c.cqKey,
    });
  }
  return m;
}

/** Build the richer meta map needed by the soft-check judges. */
function buildOpposingRebuttalMeta(
  oppPhase3: Phase3CompleteAdvocate,
  ownPhase2: Phase2CompleteAdvocate,
): Map<string, OpposingRebuttalMeta> {
  const conclusionIndexByOwnArgId = new Map(
    ownPhase2.arguments.map((a) => [a.argumentId, a.conclusionClaimIndex] as const),
  );
  const m = new Map<string, OpposingRebuttalMeta>();
  for (const r of oppPhase3.rebuttals) {
    const targetConclusionClaimIndex = conclusionIndexByOwnArgId.get(r.targetArgumentId);
    if (targetConclusionClaimIndex === undefined) continue;
    m.set(r.rebuttalArgumentId, {
      rebuttalArgumentId: r.rebuttalArgumentId,
      targetArgumentId: r.targetArgumentId,
      targetConclusionClaimIndex,
      rebuttalAttackType: r.attackType,
      rebuttalPremiseCount: r.premiseClaimIds.length,
      rebuttalConclusionText: r.conclusionText,
      rebuttalPremiseTexts: r.premiseTexts,
      rebuttalPremiseCitationTokens: r.premiseCitationTokens,
      cqKey: r.cqKey,
    });
  }
  return m;
}

function buildOpposingCqRaiseMeta(
  oppPhase3: Phase3CompleteAdvocate,
  ownPhase2: Phase2CompleteAdvocate,
): Map<string, OpposingCqRaiseMeta> {
  const conclusionIndexByOwnArgId = new Map(
    ownPhase2.arguments.map((a) => [a.argumentId, a.conclusionClaimIndex] as const),
  );
  const m = new Map<string, OpposingCqRaiseMeta>();
  for (const c of oppPhase3.cqResponses) {
    if (c.action !== "raise") continue;
    if (c.elidedByRebuttalCqKey) continue;
    const targetConclusionClaimIndex = conclusionIndexByOwnArgId.get(c.targetArgumentId);
    if (targetConclusionClaimIndex === undefined) continue;
    const cqResponseId = `cqraise:${c.targetArgumentId}:${c.cqKey}`;
    m.set(cqResponseId, {
      cqResponseId,
      targetArgumentId: c.targetArgumentId,
      targetConclusionClaimIndex,
      cqKey: c.cqKey,
      rationale: c.rationale,
    });
  }
  return m;
}

// ─────────────────────────────────────────────────────────────────
// Prompt renderers
// ─────────────────────────────────────────────────────────────────

function renderOwnPhase2(
  own: Phase2CompleteAdvocate,
  letter: "A" | "B",
  subClaimTextByIndex: Record<number, string>,
): string {
  if (own.arguments.length === 0) {
    return `(Advocate ${letter} produced no Phase-2 arguments.)`;
  }
  const lines: string[] = [];
  for (const a of own.arguments) {
    const subClaimText = subClaimTextByIndex[a.conclusionClaimIndex] ?? "(text unavailable)";
    lines.push(`ARG ${a.argumentId}  scheme=${a.schemeKey}`);
    lines.push(`  concludes-to: sub-claim #${a.conclusionClaimIndex} "${subClaimText}"`);
    lines.push(`  premises (0-indexed):`);
    for (let i = 0; i < a.premiseTexts.length; i++) {
      const tok = a.premiseCitationTokens[i];
      lines.push(`    [${i}] "${a.premiseTexts[i]}"  cite=${tok ?? "null"}`);
    }
    lines.push(`  warrant: ${a.warrant ? `"${a.warrant}"` : "null"}`);
    lines.push(``);
  }
  return lines.join("\n");
}

function renderOpponentAttacks(
  oppPhase3: Phase3CompleteAdvocate,
  oppLetter: "A" | "B",
  ownArgs: ReadonlyMap<string, OwnArgumentBinding>,
): string {
  const lines: string[] = [];
  // Rebuttals.
  for (const r of oppPhase3.rebuttals) {
    if (!ownArgs.has(r.targetArgumentId)) continue;
    lines.push(`ATTACK ${r.rebuttalArgumentId}  attackType=${r.attackType}`);
    lines.push(
      `  targets: ARG ${r.targetArgumentId}  premise=${r.targetPremiseIndex ?? "null"}  cqKey=${r.cqKey ?? "null"}`,
    );
    lines.push(`  concludes: "${r.conclusionText}"`);
    lines.push(`  premises (0-indexed):`);
    for (let i = 0; i < r.premiseTexts.length; i++) {
      const tok = r.premiseCitationTokens[i];
      lines.push(`    [${i}] "${r.premiseTexts[i]}"  cite=${tok ?? "null"}`);
    }
    lines.push(`  warrant: ${r.warrant ? `"${r.warrant}"` : "null"}`);
    lines.push(`  scheme: ${r.schemeKey}`);
    lines.push(``);
  }
  // CQ raises (skip waives — those are not attacks against this advocate).
  for (let i = 0; i < oppPhase3.cqResponses.length; i++) {
    const c = oppPhase3.cqResponses[i];
    if (c.action !== "raise") continue;
    if (c.elidedByRebuttalCqKey) continue;
    if (!ownArgs.has(c.targetArgumentId)) continue;
    const cqResponseId = `cqraise:${c.targetArgumentId}:${c.cqKey}`;
    lines.push(`CQ_RAISE ${cqResponseId}  action=raise`);
    lines.push(`  targets: ARG ${c.targetArgumentId}  cqKey=${c.cqKey}`);
    lines.push(`  rationale: "${c.rationale}"`);
    lines.push(``);
  }
  if (lines.length === 0) {
    return `(Advocate ${oppLetter} filed no rebuttals or CQ raises against your arguments.)`;
  }
  return lines.join("\n");
}

function renderTopology(opts: {
  centralClaim: string;
  subClaimTextByIndex: Record<number, string>;
  hingeIndices: number[];
  layerByIndex: Record<number, string>;
}): string {
  const lines: string[] = [];
  lines.push(`Central claim: ${opts.centralClaim}`);
  lines.push(``);
  lines.push(`Sub-claims (index, layer, text):`);
  const indices = Object.keys(opts.subClaimTextByIndex)
    .map((k) => Number(k))
    .sort((a, b) => a - b);
  for (const idx of indices) {
    const layer = opts.layerByIndex[idx] ?? "(unknown)";
    lines.push(`  #${idx}  layer=${layer}  "${opts.subClaimTextByIndex[idx]}"`);
  }
  lines.push(``);
  lines.push(`Hinge sub-claim indices: [${opts.hingeIndices.join(", ")}]`);
  return lines.join("\n");
}

function renderPhase3Block(adv: Phase3CompleteAdvocate, letter: "A" | "B"): string {
  const lines: string[] = [];
  for (const r of adv.rebuttals) {
    lines.push(`ATTACK ${r.rebuttalArgumentId}  attackType=${r.attackType}`);
    lines.push(
      `  targets: ARG ${r.targetArgumentId}  premise=${r.targetPremiseIndex ?? "null"}  cqKey=${r.cqKey ?? "null"}`,
    );
    lines.push(`  concludes: "${r.conclusionText}"`);
    lines.push(`  premises:`);
    for (let i = 0; i < r.premiseTexts.length; i++) {
      const tok = r.premiseCitationTokens[i];
      lines.push(`    [${i}] "${r.premiseTexts[i]}"  cite=${tok ?? "null"}`);
    }
    lines.push(`  warrant: ${r.warrant ? `"${r.warrant}"` : "null"}`);
    lines.push(`  scheme: ${r.schemeKey}`);
    lines.push(``);
  }
  for (let i = 0; i < adv.cqResponses.length; i++) {
    const c = adv.cqResponses[i];
    if (c.elidedByRebuttalCqKey) continue;
    const cqResponseId = `cqraise:${c.targetArgumentId}:${c.cqKey}`;
    lines.push(`CQ_RAISE ${cqResponseId}  action=${c.action}`);
    lines.push(`  targets: ARG ${c.targetArgumentId}  cqKey=${c.cqKey}`);
    lines.push(`  rationale: "${c.rationale}"`);
    lines.push(``);
  }
  if (lines.length === 0) {
    return `(Advocate ${letter} filed no Phase-3 attacks.)`;
  }
  return lines.join("\n");
}

function renderPhase4Block(rec: DefenseRunRecord, letter: "A" | "B"): string {
  if (!rec.llmOutput) {
    return `(Advocate ${letter} did not produce a Phase-4 output.)`;
  }
  const lines: string[] = [];
  for (let i = 0; i < rec.llmOutput.responses.length; i++) {
    const r = rec.llmOutput.responses[i];
    const responseId = `phase4-${letter}-r${i}`;
    lines.push(`RESPONSE ${responseId}  targets: ATTACK ${r.targetAttackId}`);
    lines.push(`  kind: ${r.kind}`);
    lines.push(`  rationale: "${r.rationale}"`);
    if (r.defense) {
      lines.push(`  defense:`);
      lines.push(`    attackType: ${r.defense.attackType}`);
      if (r.defense.targetPremiseIndex !== null) {
        lines.push(`    targetPremiseIndex: ${r.defense.targetPremiseIndex}`);
      }
      lines.push(`    conclusionText: "${r.defense.conclusionText}"`);
      lines.push(`    premises:`);
      for (let j = 0; j < r.defense.premises.length; j++) {
        const p = r.defense.premises[j];
        lines.push(`      [${j}] "${p.text}"  cite=${p.citationToken ?? "null"}`);
      }
      lines.push(`    schemeKey: ${r.defense.schemeKey}`);
      if (r.defense.warrant) lines.push(`    warrant: "${r.defense.warrant}"`);
    }
    if (r.narrowedConclusionText) {
      lines.push(`  narrowedConclusionText: "${r.narrowedConclusionText}"`);
    }
    lines.push(``);
  }
  for (let i = 0; i < rec.llmOutput.cqAnswers.length; i++) {
    const c = rec.llmOutput.cqAnswers[i];
    const cqAnswerId = `phase4-${letter}-cq${i}`;
    lines.push(`CQ_ANSWER ${cqAnswerId}  targets: CQ_RAISE ${c.targetCqRaiseId}`);
    lines.push(`  kind: ${c.kind}`);
    lines.push(`  rationale: "${c.rationale}"`);
    lines.push(``);
  }
  if (lines.length === 0) {
    return `(Advocate ${letter} produced an empty Phase-4 output.)`;
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────
// Partial writer + totals
// ─────────────────────────────────────────────────────────────────

function writePartial(
  partialPath: string,
  opts: RunPhase4Opts,
  evidenceStackId: string,
  hingeIndices: number[],
  results: { a?: DefenseRunRecord; b?: DefenseRunRecord },
  tracker: TrackerRunRecord,
  reviewFlags: ReviewFlag[],
  judgeUsage?: { calls: number; inputTokens: number; outputTokens: number },
): Phase4PartialFile {
  const totals = aggregateTotals(results, tracker);
  const partial: Phase4PartialFile = {
    phase: 4,
    status: "partial",
    generatedAt: new Date().toISOString(),
    deliberationId: opts.deliberationId,
    modelTier: opts.cfg.modelTier,
    evidenceStackId,
    hingeIndices,
    advocates: results,
    tracker,
    totals,
    reviewFlags,
    judgeUsage,
    artifacts: { partialPath },
  };
  writeFileSync(partialPath, JSON.stringify(partial, null, 2));
  return partial;
}

function aggregateTotals(
  results: { a?: DefenseRunRecord; b?: DefenseRunRecord },
  tracker: TrackerRunRecord,
): Phase4PartialFile["totals"] {
  let defensesCreated = 0;
  let edgesCreated = 0;
  let narrowsCreated = 0;
  let concedesApplied = 0;
  let commitmentsRetracted = 0;
  let cqStatusesUpserted = 0;
  let citationsAttached = 0;
  let premiseClaimsMinted = 0;
  let premiseClaimsDeduped = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  for (const rec of [results.a, results.b]) {
    if (!rec) continue;
    inputTokens += rec.tokenUsage.inputTokens;
    outputTokens += rec.tokenUsage.outputTokens;
    if (rec.mintResult) {
      defensesCreated += rec.mintResult.totals.defensesCreated;
      edgesCreated += rec.mintResult.totals.edgesCreated;
      narrowsCreated += rec.mintResult.totals.narrowsCreated;
      concedesApplied += rec.mintResult.totals.concedesApplied;
      commitmentsRetracted += rec.mintResult.totals.commitmentsRetracted;
      cqStatusesUpserted += rec.mintResult.totals.cqStatusesUpserted;
      citationsAttached += rec.mintResult.totals.citationsAttached;
      premiseClaimsMinted += rec.mintResult.totals.premiseClaimsMinted;
      premiseClaimsDeduped += rec.mintResult.totals.premiseClaimsDeduped;
    }
  }
  if (tracker.tokenUsage) {
    inputTokens += tracker.tokenUsage.inputTokens;
    outputTokens += tracker.tokenUsage.outputTokens;
  }
  return {
    defensesCreated,
    edgesCreated,
    narrowsCreated,
    concedesApplied,
    commitmentsRetracted,
    cqStatusesUpserted,
    citationsAttached,
    premiseClaimsMinted,
    premiseClaimsDeduped,
    inputTokens,
    outputTokens,
  };
}

// ─────────────────────────────────────────────────────────────────
// Path helpers
// ─────────────────────────────────────────────────────────────────

function defensePromptPath(cfg: OrchestratorConfig, role: DefenseAgentRole): string {
  const promptRel = role === "advocate-a" ? "prompts/6-defense-a.md" : "prompts/7-defense-b.md";
  return path.join(cfg.experimentRoot, promptRel);
}

function roundLogPath(cfg: OrchestratorConfig, role: DefenseAgentRole): string {
  const round = role === "advocate-a" ? 1 : 2;
  return path.join(cfg.runtimeDir, "logs", `round-4-${round}-${role}.jsonl`);
}

// ─────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────

export class BothAdvocatesRefusedError extends Error {
  partial?: Phase4PartialFile;
  exitCode = 2;
}
