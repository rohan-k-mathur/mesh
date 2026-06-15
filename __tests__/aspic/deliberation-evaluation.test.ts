/**
 * Phase 2.1: lib/aspic/deliberationEvaluation.ts builds an AIF graph for a
 * deliberation from the DB and evaluates it, so the per-argument defeats
 * endpoint can show real data. This test covers the DB→graph mapping (RA/I/CA
 * nodes, premise/conclusion/conflicting/conflicted edges keyed by `RA:<id>`)
 * and the shape of the per-argument defeat extraction.
 */
import { describe, test, expect } from "@jest/globals";

const mockArgFindMany = jest.fn();
const mockConflictFindMany = jest.fn(async () => []);
const mockPAFindMany = jest.fn(async () => []);
const mockArgFindUnique = jest.fn(async ({ where }: any) => ({ id: where.id }));
const mockClaimFindUnique = jest.fn(async () => ({ text: "" }));

jest.mock("@/lib/prismaclient", () => ({
  prisma: {
    argument: { findMany: (a: any) => mockArgFindMany(a), findUnique: (a: any) => mockArgFindUnique(a) },
    conflictApplication: { findMany: (a: any) => mockConflictFindMany(a) },
    preferenceApplication: { findMany: (a: any) => mockPAFindMany(a) },
    claim: { findUnique: (a: any) => mockClaimFindUnique(a) },
  },
}));

import { buildDeliberationGraph, getArgumentDefeats } from "@/lib/aspic/deliberationEvaluation";

const argFixture = [
  { id: "argA", text: "A", schemeId: null, conclusionClaimId: "cA", conclusion: { id: "cA", text: "c" }, premises: [{ claim: { id: "pA", text: "p" } }] },
  { id: "argB", text: "B", schemeId: null, conclusionClaimId: "cB", conclusion: { id: "cB", text: "¬c" }, premises: [{ claim: { id: "pB", text: "q" } }] },
];
const conflictFixture = [
  { id: "k1", conflictingArgumentId: "argA", conflictedArgumentId: "argB", conflictingClaimId: null, conflictedClaimId: null, aspicAttackType: "rebutting", legacyAttackType: "REBUTS" },
];

describe("buildDeliberationGraph", () => {
  test("maps DB arguments + conflicts to an RA-keyed AIF graph", async () => {
    mockArgFindMany.mockResolvedValue(argFixture);
    mockConflictFindMany.mockResolvedValue(conflictFixture);

    const g = await buildDeliberationGraph("d1");
    const ids = g.nodes.map((n: any) => n.id);
    expect(ids).toEqual(expect.arrayContaining(["RA:argA", "RA:argB", "I:cA", "I:cB", "I:pA", "I:pB", "CA:k1"]));

    const edgeKeys = g.edges.map((e: any) => `${e.sourceId}|${e.edgeType}|${e.targetId}`);
    expect(edgeKeys).toEqual(
      expect.arrayContaining([
        "RA:argA|conclusion|I:cA",
        "I:pA|premise|RA:argA",
        "RA:argA|conflicting|CA:k1",
        "CA:k1|conflicted|RA:argB",
      ]),
    );
  });
});

describe("getArgumentDefeats", () => {
  test("returns defeatsBy/defeatedBy arrays for the argument", async () => {
    mockArgFindMany.mockResolvedValue(argFixture);
    mockConflictFindMany.mockResolvedValue(conflictFixture);
    mockPAFindMany.mockResolvedValue([]);

    const res = await getArgumentDefeats("d1", "argA");
    expect(res).toHaveProperty("defeatsBy");
    expect(res).toHaveProperty("defeatedBy");
    expect(Array.isArray(res.defeatsBy)).toBe(true);
    expect(Array.isArray(res.defeatedBy)).toBe(true);
  });
});
