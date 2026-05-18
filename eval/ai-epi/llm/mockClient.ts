/**
 * MockBriefingClient — derives a "perfect" BriefingClaim straight
 * from the manifest (the mechanical ground truth). Used by CI to
 * validate the harness end-to-end.
 *
 * Contract: against every committed fixture, this client must pass
 * the scorecard (`scorePhase1(...).pass === true`). That property is
 * what the CI regression test asserts. If the property breaks, either:
 *   (a) the scorecard logic regressed (a check now fires when it
 *       shouldn't), or
 *   (b) the manifest generator regressed (we're extracting different
 *       ground truth from the same readout), or
 *   (c) a fixture was edited inconsistently (the captured readout
 *       changed but the regression expectations didn't).
 *
 * The mock is intentionally simple: it does NOT inspect the readout's
 * prose, frontier scores, or chain summaries. It only emits exactly
 * what the manifest already encodes, which is the upper bound of what
 * a "fully faithful" briefing could honestly assert.
 */

import { generateManifest } from "../manifestGenerator";
import type { BriefingClaim, Fixture } from "../types";
import type { BriefingClient } from "./client";

export class MockBriefingClient implements BriefingClient {
  readonly name = "mock";

  async produceBriefingClaim(fixture: Fixture): Promise<BriefingClaim> {
    const m = generateManifest(fixture);

    // Hub-set claim: faithfully name every hub the topology surfaced.
    const claimedHubSet = m.hubSet.length > 0 ? [...m.hubSet] : undefined;
    const claimedHubShape = m.hubShape;

    // Topology uncertainty: required when the manifest's hubShape is
    // ambiguous (co-equal or diffuse). Setting this true on
    // unambiguous shapes is harmless (the scorecard only checks
    // ambiguous-shape paths). Set it conservatively whenever we make
    // any hub claim on an ambiguous shape.
    const ambiguous =
      m.hubShape === "co-equal-cluster" || m.hubShape === "diffuse";
    const expressedTopologyUncertainty =
      ambiguous && claimedHubSet ? true : undefined;

    // Load-bearing premises: surface exactly the manifest's set (the
    // scorecard rewards full recall).
    const claimedLoadBearingPremises =
      m.loadBearingPremises.length > 0
        ? [...m.loadBearingPremises]
        : undefined;

    // Open CQs: surface them so the briefing isn't silently closing
    // them. Empty array would still satisfy recall when ground truth
    // is empty; emit undefined to keep the claim compact when
    // there's nothing to surface.
    const claimedOpenCqs =
      m.openCqs.length > 0 ? [...m.openCqs] : undefined;

    // Phase 2.1: inline CQ nudges. Surface every CQ targeting a hub
    // argument — the upper bound of what a fully-faithful prioritized
    // briefing could honestly promote. Mock never surfaces non-hub CQs
    // (which would risk priority-inversion when hub CQs exist).
    const surfacedCqPrompts =
      m.loadBearingOpenCqs.length > 0 ? [...m.loadBearingOpenCqs] : undefined;

    // Refused conclusions: the faithful briefing asserts nothing the
    // graph refused. We assert nothing at all — `assertedConclusions`
    // omitted entirely, which trivially satisfies the "no asserted
    // refused conclusion" check.

    // Hierarchical disclosure: required when the readout is in
    // hierarchical mode.
    const surfacedHierarchicalDisclosure = m.hierarchicalMode
      ? true
      : undefined;

    return {
      ...(claimedHubSet ? { claimedHubSet } : {}),
      claimedHubShape,
      ...(expressedTopologyUncertainty
        ? { expressedTopologyUncertainty }
        : {}),
      ...(claimedLoadBearingPremises ? { claimedLoadBearingPremises } : {}),
      ...(claimedOpenCqs ? { claimedOpenCqs } : {}),
      ...(surfacedCqPrompts ? { surfacedCqPrompts } : {}),
      ...(surfacedHierarchicalDisclosure
        ? { surfacedHierarchicalDisclosure }
        : {}),
    };
  }
}
