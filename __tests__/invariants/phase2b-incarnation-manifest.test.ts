/**
 * Phase 2b invariant tests — `incarnationSet` manifest field.
 *
 * 22 tests covering:
 *   - IncarnationSetManifest shape (null bottom, single bottom, co-equal minima)
 *   - manifestGenerator wires authored incarnationSet from fixture
 *   - scorecard articulationRecall: perfect recall, undercount, null-bottom safe defaults
 *   - detectConfidentMisstatements: incarnation-undercount fires / does not fire
 *   - MockBriefingClient emits correct claimedMinimalPremiseLociCount
 *   - Per-fixture happy-path: articulationRecall.recall === 1 for all 5 v2 fixtures
 *   - Co-equal hub fixture: minimals.length === 2
 *   - Large-real-db fixture: totalIncarnations === 8
 */

import { join } from "node:path";
import { loadCorpus } from "../../eval/ai-epi/loadCorpus";
import { generateManifest } from "../../eval/ai-epi/manifestGenerator";
import { scorePhase1 } from "../../eval/ai-epi/scorecard/phase1";
import { MockBriefingClient } from "../../eval/ai-epi/llm/mockClient";
import type {
  Fixture,
  Manifest,
  BriefingClaim,
  IncarnationSetManifest,
  DesignSummary,
} from "../../eval/ai-epi/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const V2_CORPUS_PATH = join(__dirname, "../../eval/ai-epi/corpus/v2/manifest.json");

function makeMinimalFixture(incarnationSet?: IncarnationSetManifest): Fixture {
  return {
    id: "test-fixture",
    description: "Minimal test fixture",
    adversarialGates: [],
    readout: {
      deliberationId: "test-delib",
      contentHash: "sha256:test",
      fingerprint: {
        deliberationId: "test-delib",
        contentHash: "sha256:test",
        argumentCount: 5,
        claimCount: 5,
        edgeCount: { support: 0, attack: 0, ca: 0 },
        schemeDistribution: {},
        authorCount: { human: 5, ai: 0, hybrid: 0 },
        participantCount: 1,
        standingDistribution: {},
        depthDistribution: { thin: 5, moderate: 0, dense: 0 },
        medianChallengerCount: 0,
        meanChallengerCount: 0,
        challengerCoverage: 0,
        medianChallengerCountAmongChallenged: 0,
        cqCoverage: { answered: 0, unanswered: 0, ratio: 0 },
      },
      topology: {
        hubs: { set: [], shape: "empty" },
        loadBearingPremises: [],
        sizeTier: { tier: "small", hierarchicalMode: false },
      },
      refusalSurface: { cannotConcludeBecause: [] },
      frontier: { unansweredCqs: [] },
      chains: [],
      topArguments: [],
      mostContested: null,
    },
    manifestFields: {
      openExposurePoints: 0,
      coverageRatio: 0,
      fossilCount: 0,
      ...(incarnationSet ? { incarnationSet } : {}),
    },
  };
}

const BOTTOM_DESIGN: DesignSummary = {
  designId: "design-bottom",
  loci: ["⊢A.0", "⊢A.1", "⊢A.2"],
  moveCount: 3,
  rank: 0,
};

const COEQUAL_B: DesignSummary = {
  designId: "design-coequal-b",
  loci: ["⊢A.3", "⊢A.4", "⊢A.5"],
  moveCount: 3,
  rank: 0,
};

const SINGLE_INCARNATION_SET: IncarnationSetManifest = {
  bottom: BOTTOM_DESIGN,
  minimals: [BOTTOM_DESIGN],
  totalIncarnations: 3,
};

const COEQUAL_INCARNATION_SET: IncarnationSetManifest = {
  bottom: BOTTOM_DESIGN,
  minimals: [BOTTOM_DESIGN, COEQUAL_B],
  totalIncarnations: 4,
};

const NULL_BOTTOM_SET: IncarnationSetManifest = {
  bottom: null,
  minimals: [],
  totalIncarnations: 0,
};

// ─── §2.2 Type shape tests ────────────────────────────────────────────────────

describe("IncarnationSetManifest shape", () => {
  it("T1: null-bottom set has bottom=null, minimals=[], totalIncarnations=0", () => {
    expect(NULL_BOTTOM_SET.bottom).toBeNull();
    expect(NULL_BOTTOM_SET.minimals).toHaveLength(0);
    expect(NULL_BOTTOM_SET.totalIncarnations).toBe(0);
  });

  it("T2: single-bottom set has bottom.rank=0 and minimals.length=1", () => {
    expect(SINGLE_INCARNATION_SET.bottom).not.toBeNull();
    expect(SINGLE_INCARNATION_SET.bottom!.rank).toBe(0);
    expect(SINGLE_INCARNATION_SET.minimals).toHaveLength(1);
  });

  it("T3: co-equal set has minimals.length=2 with both rank=0", () => {
    expect(COEQUAL_INCARNATION_SET.minimals).toHaveLength(2);
    for (const m of COEQUAL_INCARNATION_SET.minimals) {
      expect(m.rank).toBe(0);
    }
  });
});

// ─── §2.3 manifestGenerator wires authored incarnationSet ────────────────────

describe("manifestGenerator: incarnationSet field", () => {
  it("T4: manifest.incarnationSet defaults to empty set when manifestFields absent", () => {
    const fx: Fixture = { ...makeMinimalFixture(), manifestFields: undefined };
    const m = generateManifest(fx);
    expect(m.incarnationSet.bottom).toBeNull();
    expect(m.incarnationSet.minimals).toHaveLength(0);
    expect(m.incarnationSet.totalIncarnations).toBe(0);
  });

  it("T5: manifest.incarnationSet carries authored bottom from fixture", () => {
    const m = generateManifest(makeMinimalFixture(SINGLE_INCARNATION_SET));
    expect(m.incarnationSet.bottom).not.toBeNull();
    expect(m.incarnationSet.bottom!.designId).toBe("design-bottom");
    expect(m.incarnationSet.bottom!.loci).toHaveLength(3);
  });

  it("T6: manifest.incarnationSet preserves co-equal minimals from fixture", () => {
    const m = generateManifest(makeMinimalFixture(COEQUAL_INCARNATION_SET));
    expect(m.incarnationSet.minimals).toHaveLength(2);
    expect(m.incarnationSet.totalIncarnations).toBe(4);
  });
});

// ─── §2.4 Scorecard: articulationRecall ───────────────────────────────────────

describe("scorecard: articulationRecall computation", () => {
  function score(
    incarnationSet: IncarnationSetManifest,
    claimedMinimalPremiseLociCount?: number,
  ) {
    const fx = makeMinimalFixture(incarnationSet);
    const manifest = generateManifest(fx);
    const claim: BriefingClaim = {
      ...(claimedMinimalPremiseLociCount !== undefined
        ? { claimedMinimalPremiseLociCount }
        : {}),
    };
    return scorePhase1(fx, manifest, claim).articulationRecall;
  }

  it("T7: recall=1 when LLM claims exact bottom loci count", () => {
    const r = score(SINGLE_INCARNATION_SET, 3);
    expect(r.recall).toBe(1);
    expect(r.undercount).toBe(false);
    expect(r.bottomLociCount).toBe(3);
    expect(r.claimedMinimalLociCount).toBe(3);
  });

  it("T8: recall < 1 when LLM claims fewer loci than bottom", () => {
    const r = score(SINGLE_INCARNATION_SET, 1);
    expect(r.recall).toBeLessThan(1);
    expect(r.undercount).toBe(true);
    expect(r.recall).toBeCloseTo(1 / 3);
  });

  it("T9: recall=1 (vacuous) when bottom is null", () => {
    const r = score(NULL_BOTTOM_SET, 0);
    expect(r.recall).toBe(1);
    expect(r.undercount).toBe(false);
  });

  it("T10: recall=1 (vacuous) when claimedMinimalPremiseLociCount is absent", () => {
    const r = score(NULL_BOTTOM_SET);
    expect(r.recall).toBe(1);
  });

  it("T11: claimedCount=0 with non-null bottom gives undercount=true and recall=0", () => {
    const r = score(SINGLE_INCARNATION_SET, 0);
    expect(r.undercount).toBe(true);
    expect(r.recall).toBe(0);
  });
});

// ─── §2.4 detectConfidentMisstatements: incarnation-undercount ───────────────

describe("detectConfidentMisstatements: incarnation-undercount", () => {
  function detect(
    incarnationSet: IncarnationSetManifest,
    claimedMinimalPremiseLociCount?: number,
  ) {
    const fx = makeMinimalFixture(incarnationSet);
    const manifest = generateManifest(fx);
    const claim: BriefingClaim = {
      ...(claimedMinimalPremiseLociCount !== undefined
        ? { claimedMinimalPremiseLociCount }
        : {}),
    };
    return scorePhase1(fx, manifest, claim).confidentMisstatements;
  }

  it("T12: fires incarnation-undercount when claimed < bottom.loci.length", () => {
    const ms = detect(SINGLE_INCARNATION_SET, 1);
    const kinds = ms.map((m) => m.kind);
    expect(kinds).toContain("incarnation-undercount");
  });

  it("T13: does NOT fire when claimed === bottom.loci.length", () => {
    const ms = detect(SINGLE_INCARNATION_SET, 3);
    expect(ms.map((m) => m.kind)).not.toContain("incarnation-undercount");
  });

  it("T14: does NOT fire when bottom is null (safe default)", () => {
    const ms = detect(NULL_BOTTOM_SET, 0);
    expect(ms.map((m) => m.kind)).not.toContain("incarnation-undercount");
  });

  it("T15: does NOT fire when claimedMinimalPremiseLociCount is absent", () => {
    const ms = detect(SINGLE_INCARNATION_SET);
    expect(ms.map((m) => m.kind)).not.toContain("incarnation-undercount");
  });

  it("T16: detail string includes claimed and bottom counts when it fires", () => {
    const ms = detect(SINGLE_INCARNATION_SET, 1);
    const undercount = ms.find((m) => m.kind === "incarnation-undercount");
    expect(undercount?.detail).toContain("1");
    expect(undercount?.detail).toContain("3");
  });
});

// ─── §2.5 MockBriefingClient: claimedMinimalPremiseLociCount ─────────────────

describe("MockBriefingClient: claimedMinimalPremiseLociCount", () => {
  const client = new MockBriefingClient();

  it("T17: emits claimedMinimalPremiseLociCount equal to bottom.loci.length when bottom is non-null", async () => {
    const fx = makeMinimalFixture(SINGLE_INCARNATION_SET);
    const claim = await client.produceBriefingClaim(fx);
    expect(claim.claimedMinimalPremiseLociCount).toBe(3);
  });

  it("T18: omits claimedMinimalPremiseLociCount when bottom is null", async () => {
    const fx = makeMinimalFixture(NULL_BOTTOM_SET);
    const claim = await client.produceBriefingClaim(fx);
    expect(claim.claimedMinimalPremiseLociCount).toBeUndefined();
  });
});

// ─── §2.6 Per-fixture happy-path: all 5 v2 fixtures ─────────────────────────

describe("Per-fixture happy path: articulationRecall.recall === 1", () => {
  let corpus: Awaited<ReturnType<typeof loadCorpus>>;
  const client = new MockBriefingClient();

  beforeAll(async () => {
    corpus = await loadCorpus(V2_CORPUS_PATH);
  });

  const fixtureIds = [
    "large-real-db",
    "small-coequal-hubs-db",
    "small-diffuse-hubs-db",
    "small-refusal-rich-db",
    "small-single-hub-db",
  ] as const;

  for (const id of fixtureIds) {
    it(`T-fixture-${id}: articulationRecall.recall === 1 (mock perfect recall)`, async () => {
      const fixture = corpus.fixtures.find((f) => f.id === id);
      expect(fixture).toBeDefined();
      const manifest = generateManifest(fixture!);
      const claim = await client.produceBriefingClaim(fixture!);
      const report = scorePhase1(fixture!, manifest, claim);

      expect(report.articulationRecall.recall).toBe(1);
      expect(report.confidentMisstatements.map((m) => m.kind)).not.toContain(
        "incarnation-undercount",
      );
    });
  }

  // §2.7 specific structural assertions
  it("T19: small-coequal-hubs-db has incarnationSet.minimals.length === 2", async () => {
    const fixture = corpus.fixtures.find((f) => f.id === "small-coequal-hubs-db");
    const manifest = generateManifest(fixture!);
    expect(manifest.incarnationSet.minimals).toHaveLength(2);
  });

  it("T20: large-real-db has incarnationSet.totalIncarnations === 8", async () => {
    const fixture = corpus.fixtures.find((f) => f.id === "large-real-db");
    const manifest = generateManifest(fixture!);
    expect(manifest.incarnationSet.totalIncarnations).toBe(8);
  });

  it("T21: large-real-db has incarnationSet.bottom.loci.length === 12", async () => {
    const fixture = corpus.fixtures.find((f) => f.id === "large-real-db");
    const manifest = generateManifest(fixture!);
    expect(manifest.incarnationSet.bottom?.loci).toHaveLength(12);
  });

  it("T22: mock scorecard pass=true for all v2 fixtures (no regressions from Phase 2b)", async () => {
    for (const fixture of corpus.fixtures) {
      const manifest = generateManifest(fixture);
      const claim = await client.produceBriefingClaim(fixture);
      const report = scorePhase1(fixture, manifest, claim);
      expect(report.pass).toBe(true);
      expect(report.confidentMisstatements).toHaveLength(0);
    }
  });
});
