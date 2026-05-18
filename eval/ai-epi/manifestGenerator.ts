/**
 * Manifest generator: extract the structural ground truth from a
 * fixture's `SyntheticReadout`-shaped payload.
 *
 * The harness believes the graph, not the LLM. This module is the
 * single source of truth for "what does the structure actually say?"
 * and is shared across every Phase 1 scorecard run.
 *
 * Pure function. No I/O. No prose. Same input → same manifest.
 */

import type { Fixture, Manifest } from "./types";

/** Premises are "load-bearing" iff `topology.loadBearingPremises[]` includes them. */
export function generateManifest(fixture: Fixture): Manifest {
  const r = fixture.readout;

  const hubSet = (r.topology?.hubs?.set ?? []).map((h) => h.argumentId);
  const hubShape = r.topology?.hubs?.shape ?? "empty";

  const loadBearingPremises = (r.topology?.loadBearingPremises ?? []).map(
    (p) => p.claimId,
  );

  const openCqs = (r.frontier?.unansweredCqs ?? []).map(
    (q) => `${q.targetArgumentId}::${q.cqKey}`,
  );

  // Phase 2.1: subset of openCqs whose targetArgumentId is a hub.
  // These are the CQs a briefing MUST elevate as inline nudges.
  const hubSetLookup = new Set(hubSet);
  const loadBearingOpenCqs = (r.frontier?.unansweredCqs ?? [])
    .filter((q) => hubSetLookup.has(q.targetArgumentId))
    .map((q) => `${q.targetArgumentId}::${q.cqKey}`);

  const refusedConclusionIds = (
    r.refusalSurface?.cannotConcludeBecause ?? []
  )
    .map((e) => e.conclusionClaimId)
    .filter((id) => id && id.length > 0);

  const hierarchicalMode = !!r.topology?.sizeTier?.hierarchicalMode;

  return {
    fixtureId: fixture.id,
    contentHash: r.contentHash,
    hubSet,
    hubShape,
    loadBearingPremises,
    openCqs,
    loadBearingOpenCqs,
    refusedConclusionIds,
    hierarchicalMode,
    argumentCount: r.fingerprint?.argumentCount ?? 0,
  };
}
