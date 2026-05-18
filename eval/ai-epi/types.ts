/**
 * Types for the AI-EPI eval harness.
 *
 * Three core artifacts:
 *
 *   - `Fixture`: a synthetic deliberation, stored as a partial
 *     `SyntheticReadout`-shaped object. Minimal but sufficient for
 *     manifest extraction.
 *
 *   - `Manifest`: the structural ground truth extracted mechanically
 *     from a fixture. The single source of truth for "what does the
 *     graph actually say?".
 *
 *   - `Phase1ScorecardReport`: the result of grading an LLM briefing
 *     against a manifest. Per-dimension precision/recall plus a
 *     `confidentMisstatements` list (any entry → release-blocking).
 */

import type { SyntheticReadout } from "@/lib/deliberation/syntheticReadout";

// ────────────────────────────────────────────────────────────
// Fixture
// ────────────────────────────────────────────────────────────

/**
 * Synthetic-tier fixture: an authored partial `SyntheticReadout`. The
 * manifest generator only reads `frontier`, `topology`, `refusalSurface`,
 * `fingerprint`, `chains`, `topArguments`, and `mostContested`, so a
 * fixture only needs to specify those fields.
 */
export type FixtureReadout = Pick<
  SyntheticReadout,
  | "deliberationId"
  | "contentHash"
  | "fingerprint"
  | "frontier"
  | "topology"
  | "refusalSurface"
  | "chains"
  | "topArguments"
  | "mostContested"
>;

export interface Fixture {
  /** Stable id for this fixture; appears in scorecard reports. */
  id: string;
  /** Short description; for human review of the corpus. */
  description: string;
  /**
   * Adversarial gates this fixture is designed to probe. Empty for
   * "main scorecard" fixtures; non-empty for adversarial-set fixtures.
   */
  adversarialGates: AdversarialGate[];
  /** Authored partial readout. */
  readout: FixtureReadout;
}

export type AdversarialGate =
  | "co-equal-hubs-not-collapsed"
  | "diffuse-topology-not-named-as-hub"
  | "refusal-not-overridden"
  | "hierarchical-disclosure-surfaced";

// ────────────────────────────────────────────────────────────
// Manifest (ground truth extracted from a fixture)
// ────────────────────────────────────────────────────────────

export interface Manifest {
  fixtureId: string;
  /** Cache key from the fixture; lets the harness detect drift. */
  contentHash: string;
  /** Hub set with multiplicity. Empty when topology has no hubs. */
  hubSet: string[];
  /** Reported topology shape. Used for hallucinated-structure checks. */
  hubShape: SyntheticReadout["topology"]["hubs"]["shape"];
  /** Load-bearing premise claim ids (top tier). */
  loadBearingPremises: string[];
  /** Open critical questions, keyed `argId::cqKey`. */
  openCqs: string[];
  /**
   * Subset of `openCqs` whose `targetArgumentId` is in `hubSet` —
   * i.e. CQs targeting graph hubs. These are the CQs a briefing
   * MUST elevate as inline nudges (Phase 2.1). Always a subset of
   * `openCqs`; empty when the graph has no hubs.
   */
  loadBearingOpenCqs: string[];
  /** Conclusion claim ids the refusal surface forbids closing on. */
  refusedConclusionIds: string[];
  /** True when the briefing must surface a hierarchical-mode disclosure. */
  hierarchicalMode: boolean;
  /** Argument count (for context in scorecard reports). */
  argumentCount: number;
}

// ────────────────────────────────────────────────────────────
// Briefing claim (the structured form of an LLM's briefing output)
// ────────────────────────────────────────────────────────────

/**
 * The LLM's structured claim about a deliberation. Used as the input
 * to the scorecard. In practice this is parsed out of the LLM's
 * response text by a thin extractor, but the harness operates on the
 * structured form so scoring is deterministic and re-runnable.
 *
 * All fields are *optional* (an LLM may omit anything); the scorecard
 * treats omissions as "did not claim" rather than "claimed false".
 */
export interface BriefingClaim {
  /** Argument ids the briefing identifies as load-bearing hubs. */
  claimedHubSet?: string[];
  /**
   * The briefing's claim about hub *shape*. If this disagrees with the
   * manifest's `hubShape`, that is a confident misstatement.
   */
  claimedHubShape?: SyntheticReadout["topology"]["hubs"]["shape"];
  /** Premise claim ids the briefing identifies as load-bearing. */
  claimedLoadBearingPremises?: string[];
  /** Open CQs the briefing names, keyed `argId::cqKey`. */
  claimedOpenCqs?: string[];
  /**
   * Subset of open CQs the briefing *promotes as inline nudges*
   * (Phase 2.1) — "engage these first." Distinct from `claimedOpenCqs`
   * which is the exhaustive enumeration. A faithful briefing surfaces
   * every load-bearing CQ here; surfacing non-hub CQs while omitting
   * any hub CQ is a `cq-priority-inversion` confident misstatement.
   * Format `argId::cqKey`, matching `claimedOpenCqs`.
   */
  surfacedCqPrompts?: string[];
  /** Conclusion claim ids the briefing asserts as established. */
  assertedConclusions?: string[];
  /**
   * True iff the briefing surfaces a hierarchical-mode disclosure.
   * Only material when `Manifest.hierarchicalMode === true`.
   */
  surfacedHierarchicalDisclosure?: boolean;
  /**
   * True iff the briefing explicitly flagged the topology as ambiguous
   * (e.g. "three roughly co-equal hubs" / "many small hubs, no single
   * dominant one"). On ambiguous topologies (hubShape ∈ {co-equal-cluster,
   * diffuse}), the briefing MUST set this true OR omit hub claims entirely;
   * making a hub claim without flagging ambiguity is a false-confidence
   * misstatement. See Phase 1 "Calibration" in the roadmap.
   */
  expressedTopologyUncertainty?: boolean;
}

// ────────────────────────────────────────────────────────────
// Scorecard report
// ────────────────────────────────────────────────────────────

export interface PrecisionRecall {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number; // 0..1; 1 when no positives at all (vacuous)
  recall: number; // 0..1; 1 when ground-truth set is empty (vacuous)
  f1: number;
}

export type ConfidentMisstatementKind =
  | "hub-shape-mismatch"
  | "asserted-refused-conclusion"
  | "missing-hierarchical-disclosure"
  | "named-single-hub-when-coequal"
  | "named-single-hub-when-diffuse"
  | "false-confidence-on-ambiguous-topology"
  | "cq-priority-inversion";

export interface ConfidentMisstatement {
  kind: ConfidentMisstatementKind;
  /** Human-readable detail for review. */
  detail: string;
}

export interface Phase1ScorecardReport {
  fixtureId: string;
  contentHash: string;
  argumentCount: number;
  hub: PrecisionRecall;
  loadBearingPremise: PrecisionRecall;
  openCq: PrecisionRecall;
  /**
   * Phase 2.1: precision/recall of `claim.surfacedCqPrompts` against
   * the subset of open CQs targeting hub arguments
   * (`manifest.loadBearingOpenCqs`). Recall is the headline metric —
   * a briefing that omits a hub CQ from its inline nudges is failing
   * the Phase 2.1 fidelity contract even if the CQ appears in the
   * exhaustive `claimedOpenCqs` list.
   */
  loadBearingOpenCq: PrecisionRecall;
  /**
   * Confident misstatements. ANY non-empty entry is a release-blocking
   * failure regardless of overall precision/recall.
   */
  confidentMisstatements: ConfidentMisstatement[];
  /** Adversarial gates passed/failed (empty when fixture isn't adversarial). */
  adversarialGateResults: Array<{
    gate: AdversarialGate;
    passed: boolean;
    detail: string;
  }>;
  /** Overall pass: no confident misstatements AND no adversarial-gate failures. */
  pass: boolean;
}

// ────────────────────────────────────────────────────────────
// Corpus index
// ────────────────────────────────────────────────────────────

export interface CorpusIndex {
  /** Corpus version. Bump when fixture shapes change incompatibly. */
  version: string;
  /** Fixture file paths relative to `corpus/<version>/`. */
  fixtures: Array<{
    id: string;
    path: string;
    description: string;
    /**
     * Optional. When present, `loadCorpus` validates that the fixture
     * file's `readout.contentHash` matches this value and throws on
     * mismatch (drift detection). Captured fixtures populate it; v1
     * synthetic fixtures may omit it.
     */
    contentHash?: string;
  }>;
}
