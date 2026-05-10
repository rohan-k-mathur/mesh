// tests/transportAggregator.test.ts
// Sprint C tests for the pure transport aggregator.
//
// Citations: ECC plan §C, §0.5.7 (Isonomia, not Ambler), §4 row 2 (one-hop).

import {
  computeTransportPayload,
  computeTransportHash,
  reduceImportedScores,
  combineLocalAndImported,
  type TransportSource,
} from "@/lib/argumentation/transportAggregator";

describe("transportAggregator — payload", () => {
  test("empty source produces empty payload", () => {
    const out = computeTransportPayload({ fromRoomId: "r1", claimMap: {}, supports: [] });
    expect(out.byClaim).toEqual({});
  });

  test("claims without an image in the functor are dropped (partial functor)", () => {
    const out = computeTransportPayload({
      fromRoomId: "r1",
      claimMap: { c1: "C1" },
      supports: [
        { claimId: "c1", score: 0.7 },
        { claimId: "c-orphan", score: 0.9 },
      ],
    });
    expect(Object.keys(out.byClaim)).toEqual(["C1"]);
    expect(out.byClaim["C1"].sources).toEqual([
      { fromRoomId: "r1", fromClaimId: "c1", score: 0.7 },
    ]);
  });

  test("multiple source claims map to the same target (collected, not joined)", () => {
    const out = computeTransportPayload({
      fromRoomId: "r1",
      claimMap: { a: "T", b: "T" },
      supports: [
        { claimId: "a", score: 0.4 },
        { claimId: "b", score: 0.6 },
      ],
    });
    expect(out.byClaim["T"].sources.map((s) => s.score).sort()).toEqual([0.4, 0.6]);
  });
});

describe("transportAggregator — hash", () => {
  const base: TransportSource = {
    fromRoomId: "r1",
    claimMap: { a: "A", b: "B" },
    supports: [
      { claimId: "a", score: 0.5 },
      { claimId: "b", score: 0.7 },
    ],
  };

  test("stable across input ordering", () => {
    const reordered: TransportSource = {
      ...base,
      supports: [...base.supports].reverse(),
      claimMap: { b: "B", a: "A" },
    };
    expect(computeTransportHash(base)).toBe(computeTransportHash(reordered));
  });

  test("changes when a score changes", () => {
    const mutated = { ...base, supports: [{ claimId: "a", score: 0.500001 }, base.supports[1]] };
    expect(computeTransportHash(base)).not.toBe(computeTransportHash(mutated));
  });

  test("changes when the claim map changes", () => {
    const mutated = { ...base, claimMap: { a: "A", b: "B2" } };
    expect(computeTransportHash(base)).not.toBe(computeTransportHash(mutated));
  });
});

describe("transportAggregator — reduce", () => {
  test("empty → 0 in every mode", () => {
    expect(reduceImportedScores([], "min")).toBe(0);
    expect(reduceImportedScores([], "product")).toBe(0);
    expect(reduceImportedScores([], "ds")).toBe(0);
  });

  test("min mode reduces with max (the join in the min-monoid)", () => {
    expect(reduceImportedScores([0.2, 0.8, 0.5], "min")).toBe(0.8);
  });

  test("product mode is noisy-OR", () => {
    // 1 - (1-0.5)(1-0.5) = 0.75
    expect(reduceImportedScores([0.5, 0.5], "product")).toBeCloseTo(0.75, 6);
  });
});

describe("transportAggregator — combine", () => {
  test("identity: combine(local, 0) === local", () => {
    expect(combineLocalAndImported(0.42, 0, "min")).toBe(0.42);
    expect(combineLocalAndImported(0.42, 0, "product")).toBe(0.42);
  });

  test("monotone in imported (Ambler p.171, §0.5.6)", () => {
    const a = combineLocalAndImported(0.3, 0.1, "product");
    const b = combineLocalAndImported(0.3, 0.4, "product");
    expect(b).toBeGreaterThanOrEqual(a);
  });

  test("min mode combines with max", () => {
    expect(combineLocalAndImported(0.4, 0.7, "min")).toBe(0.7);
    expect(combineLocalAndImported(0.9, 0.1, "min")).toBe(0.9);
  });

  test("product mode combines with noisy-OR", () => {
    // 1 - (1-0.4)(1-0.5) = 0.7
    expect(combineLocalAndImported(0.4, 0.5, "product")).toBeCloseTo(0.7, 6);
  });
});
