/**
 * phases/phase-3-round2.ts
 *
 * Iter-3 multi-round Phase 3 — round-2 driver. Gated behind
 * `cfg.iter3MultiRound`. Round 1 runs via the existing `runPhase`
 * code path; this module orchestrates round 2 (attacks-on-attacks
 * + new direct attacks) for advocates A, B, and the Methodologist.
 *
 * Status: SCAFFOLD (Iter-3 in progress).
 *
 * What's wired:
 *   - Reads the round-2 addendum prompts (4b/5b/10b) and appends them
 *     to the base round-1 system prompts.
 *   - Skeleton for fetching round-1 rebuttals + building the extended
 *     opposing-argument bindings (round-1 rebuttalArgumentIds become
 *     legitimate round-2 targets).
 *   - Skeleton for rendering the `## ROUND_1_ATTACKS_ON_YOU` user
 *     block.
 *   - Calls `runOneAdvocate`-style logic with `round: "2"` plumbed
 *     through to `translateRebuttalOutput`.
 *
 * What's TODO (marked inline):
 *   1. `loadRound1RebuttalsForBindings`: fetch the round-1 rebuttal
 *      Arguments + their premise/conclusion claim ids from prisma so
 *      they can be added to the opposing-arg maps.
 *   2. `renderRound1AttacksOnYou`: render the structured Markdown
 *      block listing attacks the recipient must defend / can attack.
 *   3. Persistence: extend `Phase3PartialFile` with a
 *      `round2: { advocates, methodologist }` sub-record (or use a
 *      flat `rebuttals[]` with `round` field — see locked design
 *      memo `/memories/repo/polarization-1-iteration-3-design.md`).
 *
 * NEVER call this directly from the orchestrator CLI without the
 * gating flag check; doing so will silently re-mint round-1 work.
 */

import path from "path";
import { readFileSync, existsSync } from "fs";
import type { OrchestratorConfig } from "../config";
import type { IsonomiaClient } from "../isonomia-client";
import type { AnthropicClient } from "../anthropic-client";
import type { RoundLogger } from "../log/round-logger";

export interface RunPhase3Round2Opts {
  cfg: OrchestratorConfig;
  iso: IsonomiaClient;
  llm: AnthropicClient;
  deliberationId: string;
  /** Path to PHASE_3_COMPLETE.json (round-1 finalize result). */
  phase3CompletePath: string;
  logger: RoundLogger;
}

export interface RunPhase3Round2Result {
  /** TODO: typed round-2 result records (rebuttals, methodologist). */
  status: "not-implemented" | "ok";
  notes: string[];
}

/**
 * Read a round-2 addendum prompt by role. Returns the file content if
 * present, or empty string if absent (defensive — addendums are
 * scaffolding files in `experiments/polarization-1/prompts/`).
 */
export function readRound2Addendum(
  cfg: OrchestratorConfig,
  role: "advocate-a" | "advocate-b" | "methodologist",
): string {
  const filename =
    role === "advocate-a"
      ? "4b-rebuttal-a-round2-addendum.md"
      : role === "advocate-b"
        ? "5b-rebuttal-b-round2-addendum.md"
        : "10b-methodologist-round2-addendum.md";
  const p = path.join(cfg.experimentRoot, "prompts", filename);
  if (!existsSync(p)) {
    return "";
  }
  return readFileSync(p, "utf8");
}

/**
 * TODO(Iter-3): Build the `## ROUND_1_ATTACKS_ON_YOU` Markdown block
 * for a recipient advocate. Lists every round-1 rebuttal filed against
 * the recipient's Phase-2 arguments by the opponent and Methodologist,
 * with their `rebuttalArgumentId` (legal `targetArgumentId` for round-2
 * attacks-on-attacks), conclusion text, premises, and `cqKey` (if any).
 *
 * Spec (from locked design memo):
 *   - For Advocate A, list B's + Methodologist's round-1 rebuttals
 *     against A's Phase-2 args.
 *   - For Advocate B, list A's + Methodologist's round-1 rebuttals
 *     against B's Phase-2 args.
 *   - For Methodologist, list ALL round-1 rebuttals (A's + B's + own)
 *     in `## ROUND_1_ATTACKS_ALL`.
 */
export function renderRound1AttacksOnYou(
  _recipientRole: "advocate-a" | "advocate-b" | "methodologist",
  _phase3Complete: unknown,
): string {
  return "## ROUND_1_ATTACKS_ON_YOU\n\n_(TODO: implement renderer in phase-3-round2.ts)_\n";
}

/**
 * Main entry point — called from `runPhase` (phase-3-attacks.ts) after
 * round-1 finalizes successfully and ONLY when `cfg.iter3MultiRound`
 * is true.
 */
export async function runPhase3Round2(
  opts: RunPhase3Round2Opts,
): Promise<RunPhase3Round2Result> {
  opts.logger.event("phase_round2_start", {
    phase: 3,
    round: 2,
    deliberationId: opts.deliberationId,
  });

  // TODO(Iter-3):
  //   1. Load PHASE_3_COMPLETE.json from `opts.phase3CompletePath`.
  //   2. Build extended `opposingArgumentSchemeByArgId` /
  //      `opposingArgumentPremisesByArgId` /
  //      `opposingArgumentConclusionByArgId` maps including round-1
  //      rebuttal ids (with their `schemeKey`, premise claims, and
  //      conclusion claim from the persisted complete record).
  //   3. Render `## ROUND_1_ATTACKS_ON_YOU` per recipient.
  //   4. For each of advocate-a, advocate-b, methodologist:
  //      a. Load base prompt; append round-2 addendum via
  //         `runRebuttalTurn({ appendedSystemPrompt, appendedUserBlock })`
  //         or `runMethodologistTurn({ ... })`.
  //      b. On ok, call `translateRebuttalOutput({ ..., round: "2" })`
  //         (translator skips orphan-guard automatically).
  //   5. Write PHASE_3_ROUND2_PARTIAL.json (same shape as round-1
  //      partial) and let finalize merge.

  return {
    status: "not-implemented",
    notes: [
      "round-2 driver is scaffold-only; complete the TODOs in phase-3-round2.ts.",
      "schemas, translator, prompts, and finalize already accept round-2 inputs.",
    ],
  };
}
