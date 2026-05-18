/**
 * Briefing payload — the composite, LLM-consumable endpoint for the
 * AI-EPI Phase 1 contract.
 *
 * Background. The AI-EPI roadmap (Phase 1) requires a single
 * deliberation-scope payload that downstream synthesis clients (LLM
 * briefings, summarizers, "what does this deliberation think?" UI) can
 * consume in one round trip and from which they can produce structurally
 * faithful prose. That payload IS the `SyntheticReadout` — the editorial
 * primitive defined in `lib/deliberation/syntheticReadout.ts`. This
 * module:
 *
 *   1. Re-exports `SyntheticReadout` under the name `BriefingPayload` so
 *      callers don't have to import the readout module directly and so
 *      the Phase 1 contract has a stable, distinct name.
 *   2. Exposes `buildBriefingPayload(deliberationId)` — the one
 *      entrypoint clients should call. Returns the readout or `null`
 *      when the deliberation is unreachable / empty.
 *   3. Documents the canonical tool-call sequence an LLM briefing
 *      should follow.
 *
 * NOT in scope:
 *   - LLM transport. This module returns structured data; it does not
 *     call an LLM, does not render prose, does not assemble a system
 *     prompt. Those live in the `eval/ai-epi/llm/` adapters and in the
 *     consuming feature (synthesis route, briefing UI, etc.).
 *   - Truncation / chunking for token budgets. Consumers that need a
 *     smaller object for cheap models should project away
 *     `mostContested`, narrow `topArguments` to the top-K, or fall back
 *     to `fingerprint` + `refusalSurface` + `topology` alone. The full
 *     payload is intentionally complete.
 *
 * Canonical tool-call sequence (recommended for LLM clients):
 *
 *   1. `get_briefing_payload(deliberationId)` → BriefingPayload
 *      (this module). Single fetch. All structural ground-truth in one
 *      object.
 *   2. Optional drill-downs only when the briefing genuinely needs more
 *      than the payload surfaces:
 *      - `get_argument(argumentId)` for full premise/citation detail on
 *        a specific load-bearing argument.
 *      - `get_claim(claimId)` for the canonical text of a specific
 *        conclusion or load-bearing premise.
 *   3. NO synthesis tool calls. The briefing MUST be assembled by the
 *      LLM from the payload + drill-downs, not by asking the server
 *      "what should the briefing say?"
 *
 * Fidelity contract (Phase 1 scorecard checks these mechanically; see
 * `eval/ai-epi/scorecard/phase1.ts`):
 *   - Hub claims (`claimedHubSet`, `claimedHubShape`) must match
 *     `topology.hubSet` / `topology.hubShape` or the briefing must
 *     explicitly flag topology uncertainty
 *     (`expressedTopologyUncertainty: true`).
 *   - The briefing MUST NOT assert any conclusion present in
 *     `refusalSurface.cannotConcludeBecause`.
 *   - When `topology.sizeTier === "very-large"` (hierarchicalMode), the
 *     briefing MUST surface a size disclosure
 *     (`surfacedHierarchicalDisclosure: true`).
 *   - Open critical questions (`frontier.openCriticalQuestions`) MUST be
 *     surfaced as gaps, not silently closed.
 */

import {
  computeSyntheticReadout,
  type SyntheticReadout,
} from "@/lib/deliberation/syntheticReadout";
import {
  derivePrioritizedOpenCqs,
  type PrioritizedOpenCq,
} from "@/lib/deliberation/cqPrioritizer";

/**
 * The composite payload an LLM briefing consumes. A superset of
 * `SyntheticReadout` — the raw readout plus the derived
 * `prioritizedOpenCqs` projection (Phase 2.1) that orders unanswered
 * CQs by the load-bearingness of the argument they target, so a
 * briefing can promote a small top-K as inline nudges without
 * re-ranking the flat `frontier.unansweredCqs` itself.
 *
 * Stable surface for downstream consumers. If the readout grows fields
 * those become part of the briefing contract; if a field is dropped,
 * that's a breaking change to the Phase 1/2 contract.
 */
export type BriefingPayload = SyntheticReadout & {
  /**
   * Open critical questions re-projected with hub-membership and
   * load-bearingness, ordered for promotion as inline nudges. Pure
   * derivation of `frontier.unansweredCqs` + `frontier.loadBearingnessScores`
   * + `topology.hubs.set`; see `lib/deliberation/cqPrioritizer.ts`.
   */
  prioritizedOpenCqs: PrioritizedOpenCq[];
};

/**
 * Single-call assembler. Returns the full briefing payload for
 * `deliberationId`, or `null` if no payload can be produced (e.g.
 * unknown id, fingerprint failure, empty graph).
 *
 * Deterministic and cache-friendly: backed by
 * `computeSyntheticReadout`, which keys its cache on
 * (deliberationId, contentHash). Two calls for the same graph state
 * return the same object.
 */
export async function buildBriefingPayload(
  deliberationId: string,
): Promise<BriefingPayload | null> {
  const readout = await computeSyntheticReadout(deliberationId);
  if (!readout) return null;
  return {
    ...readout,
    prioritizedOpenCqs: derivePrioritizedOpenCqs(readout),
  };
}
