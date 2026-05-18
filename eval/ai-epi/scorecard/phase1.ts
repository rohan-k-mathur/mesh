/**
 * Phase 1 scorecard: grades a `BriefingClaim` (LLM output, structured)
 * against a `Manifest` (ground truth from the graph).
 *
 * Per `docs/isonomia-ai-roadmap.md` Phase 1 (hardened) the scorecard
 * dimensions are:
 *
 *   1. Hub-set agreement (precision/recall, NOT just top-1 match).
 *   2. Load-bearing premise identification (precision/recall).
 *   3. Open-CQ recall.
 *   4. Absence of confident misstatements ("hallucinated structure").
 *
 * "No confident misstatement of structure" is non-negotiable: any
 * non-empty `confidentMisstatements` array means the run fails the
 * release gate regardless of overall precision/recall.
 *
 * Pure function. No I/O. Deterministic.
 */

import type {
  BriefingClaim,
  ConfidentMisstatement,
  Manifest,
  Phase1ScorecardReport,
  PrecisionRecall,
  AdversarialGate,
  Fixture,
} from "../types";

function precisionRecall(
  claimed: string[] | undefined,
  truth: string[],
): PrecisionRecall {
  const claimedSet = new Set(claimed ?? []);
  const truthSet = new Set(truth);
  let truePositives = 0;
  for (const c of claimedSet) {
    if (truthSet.has(c)) truePositives++;
  }
  const falsePositives = claimedSet.size - truePositives;
  const falseNegatives = truthSet.size - truePositives;

  const precision =
    claimedSet.size === 0 ? 1 : truePositives / claimedSet.size;
  const recall =
    truthSet.size === 0 ? 1 : truePositives / truthSet.size;
  const f1 =
    precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    precision,
    recall,
    f1,
  };
}

function detectConfidentMisstatements(
  claim: BriefingClaim,
  manifest: Manifest,
): ConfidentMisstatement[] {
  const out: ConfidentMisstatement[] = [];

  // Hub-shape mismatch (any disagreement is a confident misstatement).
  if (
    claim.claimedHubShape &&
    claim.claimedHubShape !== manifest.hubShape
  ) {
    out.push({
      kind: "hub-shape-mismatch",
      detail: `Briefing claimed hubShape=${claim.claimedHubShape}; manifest hubShape=${manifest.hubShape}.`,
    });
  }

  // Named a single hub when manifest says co-equal-cluster.
  if (
    manifest.hubShape === "co-equal-cluster" &&
    (claim.claimedHubSet?.length ?? 0) === 1
  ) {
    out.push({
      kind: "named-single-hub-when-coequal",
      detail: `Briefing named 1 hub but manifest has ${manifest.hubSet.length} co-equal hubs.`,
    });
  }

  // Named a single hub when manifest says diffuse.
  if (
    manifest.hubShape === "diffuse" &&
    (claim.claimedHubSet?.length ?? 0) === 1
  ) {
    out.push({
      kind: "named-single-hub-when-diffuse",
      detail: `Briefing named 1 hub but manifest hubShape=diffuse (${manifest.hubSet.length} top-tier args).`,
    });
  }

  // Asserted a refused conclusion.
  const assertedSet = new Set(claim.assertedConclusions ?? []);
  for (const refused of manifest.refusedConclusionIds) {
    if (assertedSet.has(refused)) {
      out.push({
        kind: "asserted-refused-conclusion",
        detail: `Briefing asserted conclusion=${refused} which the refusal surface forbids.`,
      });
    }
  }

  // Missing hierarchical-mode disclosure.
  if (
    manifest.hierarchicalMode &&
    claim.surfacedHierarchicalDisclosure !== true
  ) {
    out.push({
      kind: "missing-hierarchical-disclosure",
      detail: `Manifest is in hierarchicalMode but briefing did not surface the size disclosure.`,
    });
  }

  // False confidence on ambiguous topology: when hubShape is co-equal
  // or diffuse the briefing MUST either (a) flag uncertainty
  // explicitly or (b) omit hub claims entirely. Making a hub claim
  // without flagging ambiguity asserts a structure the graph does not
  // support. (See Phase 1 "Calibration" in the roadmap.)
  const isAmbiguousShape =
    manifest.hubShape === "co-equal-cluster" ||
    manifest.hubShape === "diffuse";
  const madeHubClaim =
    (claim.claimedHubSet && claim.claimedHubSet.length > 0) ||
    claim.claimedHubShape === "single-dominant";
  if (
    isAmbiguousShape &&
    madeHubClaim &&
    claim.expressedTopologyUncertainty !== true
  ) {
    out.push({
      kind: "false-confidence-on-ambiguous-topology",
      detail: `Manifest hubShape=${manifest.hubShape} (ambiguous); briefing made a hub claim without setting expressedTopologyUncertainty=true.`,
    });
  }

  // Phase 2.1: CQ priority inversion. When the briefing surfaces *any*
  // CQ as an inline nudge, it MUST cover every CQ on a hub argument.
  // Surfacing a non-hub CQ while omitting a hub CQ is a confident
  // misstatement of where attention should go. (Empty surfacedCqPrompts
  // is a recall miss, not an inversion — graded on `loadBearingOpenCq.recall`.)
  const surfaced = claim.surfacedCqPrompts ?? [];
  if (surfaced.length > 0 && manifest.loadBearingOpenCqs.length > 0) {
    const surfacedSet = new Set(surfaced);
    const loadBearingSet = new Set(manifest.loadBearingOpenCqs);
    const surfacedNonHub = surfaced.filter((id) => !loadBearingSet.has(id));
    const missedHubCqs = manifest.loadBearingOpenCqs.filter(
      (id) => !surfacedSet.has(id),
    );
    if (surfacedNonHub.length > 0 && missedHubCqs.length > 0) {
      out.push({
        kind: "cq-priority-inversion",
        detail: `Briefing surfaced ${surfacedNonHub.length} non-hub CQ(s) as nudges while omitting ${missedHubCqs.length} hub CQ(s): missed=[${missedHubCqs.slice(0, 3).join(", ")}${missedHubCqs.length > 3 ? ", …" : ""}].`,
      });
    }
  }

  return out;
}

function evaluateAdversarialGate(
  gate: AdversarialGate,
  claim: BriefingClaim,
  manifest: Manifest,
): { passed: boolean; detail: string } {
  switch (gate) {
    case "co-equal-hubs-not-collapsed":
      if (manifest.hubShape !== "co-equal-cluster") {
        return {
          passed: true,
          detail: "Gate not applicable (manifest is not co-equal).",
        };
      }
      // Fail on positive collapse (named exactly 1 hub). Empty
      // omission is a recall miss, not a confident misstatement.
      return (claim.claimedHubSet?.length ?? 0) === 1
        ? {
            passed: false,
            detail: `Briefing collapsed ${manifest.hubSet.length} co-equal hubs into 1.`,
          }
        : { passed: true, detail: "Briefing did not collapse co-equal hubs into one." };
    case "diffuse-topology-not-named-as-hub":
      if (manifest.hubShape !== "diffuse") {
        return {
          passed: true,
          detail: "Gate not applicable (manifest is not diffuse).",
        };
      }
      // Only fail on a *positive* misstatement (named a single hub).
      // An omission is a recall miss, not a confident misstatement.
      return (claim.claimedHubSet?.length ?? 0) === 1
        ? {
            passed: false,
            detail: `Briefing named a single hub on a diffuse topology.`,
          }
        : {
            passed: true,
            detail: "Briefing did not collapse diffuse topology to a single hub.",
          };
    case "refusal-not-overridden": {
      const asserted = new Set(claim.assertedConclusions ?? []);
      const violations = manifest.refusedConclusionIds.filter((c) =>
        asserted.has(c),
      );
      return violations.length === 0
        ? { passed: true, detail: "No refused conclusion was asserted." }
        : {
            passed: false,
            detail: `Briefing asserted ${violations.length} refused conclusion(s).`,
          };
    }
    case "hierarchical-disclosure-surfaced":
      if (!manifest.hierarchicalMode) {
        return {
          passed: true,
          detail: "Gate not applicable (manifest not in hierarchicalMode).",
        };
      }
      return claim.surfacedHierarchicalDisclosure === true
        ? { passed: true, detail: "Disclosure surfaced." }
        : { passed: false, detail: "Disclosure missing in hierarchicalMode." };
  }
}

export function scorePhase1(
  fixture: Fixture,
  manifest: Manifest,
  claim: BriefingClaim,
): Phase1ScorecardReport {
  const hub = precisionRecall(claim.claimedHubSet, manifest.hubSet);
  const loadBearingPremise = precisionRecall(
    claim.claimedLoadBearingPremises,
    manifest.loadBearingPremises,
  );
  const openCq = precisionRecall(claim.claimedOpenCqs, manifest.openCqs);
  const loadBearingOpenCq = precisionRecall(
    claim.surfacedCqPrompts,
    manifest.loadBearingOpenCqs,
  );

  const confidentMisstatements = detectConfidentMisstatements(claim, manifest);

  const adversarialGateResults = fixture.adversarialGates.map((gate) => {
    const r = evaluateAdversarialGate(gate, claim, manifest);
    return { gate, ...r };
  });

  const pass =
    confidentMisstatements.length === 0 &&
    adversarialGateResults.every((g) => g.passed);

  return {
    fixtureId: fixture.id,
    contentHash: manifest.contentHash,
    argumentCount: manifest.argumentCount,
    hub,
    loadBearingPremise,
    openCq,
    loadBearingOpenCq,
    confidentMisstatements,
    adversarialGateResults,
    pass,
  };
}
