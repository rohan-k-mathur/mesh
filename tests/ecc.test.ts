// tests/ecc.test.ts
// Unit tests for Evidential Category of Claims (ECC) with assumption tracking
// Phase: Gap 4 - Per-Derivation Assumption Tracking

import { 
  Arrow, 
  zero, 
  join, 
  compose, 
  minimalAssumptions, 
  derivationsUsingAssumption,
  tensor,
  internalHom,
  isSimple,
  isEntire,
  isSelected,
  arrowMeta,
  isLogical,
  isDerivationLogical,
  confidence,
  MIN_MONOID,
  PRODUCT_MONOID,
  DS_MONOID,
  LOGODDS_MONOID,
  withMinScores,
  withProductScores,
  withDsScores,
  withLogoddsScores,
  getConfidenceMonoid,
  registerConfidenceMonoid,
  type ConfidenceMonoid,
  type Functor,
  transport,
  aggregateAcrossRooms,
  culpritSets,
  detectEnthymemes,
  type SchemeCatalog,
} from "../lib/argumentation/ecc";

describe("Evidential Category - Arrow with Assumptions", () => {
  
  describe("zero()", () => {
    test("creates empty assumption map", () => {
      const z = zero("A", "B");
      
      expect(z.from).toBe("A");
      expect(z.to).toBe("B");
      expect(z.derivs.size).toBe(0);
      expect(z.assumptions.size).toBe(0);
    });

    test("maintains type parameters", () => {
      const z = zero<string, string>("claim1", "claim2");
      
      expect(z.from).toBe("claim1");
      expect(z.to).toBe("claim2");
    });
  });

  describe("join()", () => {
    test("merges derivation sets", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const g: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };
      
      const joined = join(f, g);
      
      expect(joined.from).toBe("A");
      expect(joined.to).toBe("B");
      expect(joined.derivs).toEqual(new Set(["d1", "d2"]));
    });

    test("merges assumption maps correctly", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const g: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };
      
      const joined = join(f, g);
      
      expect(joined.assumptions.size).toBe(2);
      expect(joined.assumptions.get("d1")).toEqual(new Set(["λ1"]));
      expect(joined.assumptions.get("d2")).toEqual(new Set(["λ2"]));
    });

    test("unions assumptions when same derivation appears in both", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const g: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),  // Same derivation ID
        assumptions: new Map([["d1", new Set(["λ2"])]])
      };
      
      const joined = join(f, g);
      
      expect(joined.derivs).toEqual(new Set(["d1"]));
      expect(joined.assumptions.get("d1")).toEqual(new Set(["λ1", "λ2"]));
    });

    test("handles empty assumptions", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map()
      };
      const g: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };
      
      const joined = join(f, g);
      
      expect(joined.assumptions.size).toBe(1);
      expect(joined.assumptions.get("d2")).toEqual(new Set(["λ2"]));
    });

    test("is commutative", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const g: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };
      
      const fg = join(f, g);
      const gf = join(g, f);
      
      expect(fg.derivs).toEqual(gf.derivs);
      expect(fg.assumptions.get("d1")).toEqual(gf.assumptions.get("d1"));
      expect(fg.assumptions.get("d2")).toEqual(gf.assumptions.get("d2"));
    });

    test("throws error on domain mismatch", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map()
      };
      const g: Arrow = {
        from: "X", to: "B",  // Different domain
        derivs: new Set(["d2"]),
        assumptions: new Map()
      };
      
      expect(() => join(f, g)).toThrow("join: type mismatch");
    });

    test("throws error on codomain mismatch", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map()
      };
      const g: Arrow = {
        from: "A", to: "Y",  // Different codomain
        derivs: new Set(["d2"]),
        assumptions: new Map()
      };
      
      expect(() => join(f, g)).toThrow("join: type mismatch");
    });

    test("identity: join(f, zero) = f", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const z = zero("A", "B");
      
      const joined = join(f, z);
      
      expect(joined.derivs).toEqual(f.derivs);
      expect(joined.assumptions.get("d1")).toEqual(new Set(["λ1"]));
    });
  });

  describe("compose()", () => {
    test("creates composed derivations", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map()
      };
      const g: Arrow = {
        from: "B", to: "C",
        derivs: new Set(["d2"]),
        assumptions: new Map()
      };
      
      const composed = compose(g, f);
      
      expect(composed.from).toBe("A");
      expect(composed.to).toBe("C");
      expect(composed.derivs).toEqual(new Set(["d1∘d2"]));
    });

    test("unions assumptions transitively", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const g: Arrow = {
        from: "B", to: "C",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };
      
      const composed = compose(g, f);
      
      expect(composed.derivs).toEqual(new Set(["d1∘d2"]));
      expect(composed.assumptions.get("d1∘d2")).toEqual(new Set(["λ1", "λ2"]));
    });

    test("handles multiple derivations (Cartesian product)", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1", "d2"]),
        assumptions: new Map([
          ["d1", new Set(["λ1"])],
          ["d2", new Set(["λ2"])]
        ])
      };
      const g: Arrow = {
        from: "B", to: "C",
        derivs: new Set(["d3"]),
        assumptions: new Map([["d3", new Set(["λ3"])]])
      };
      
      const composed = compose(g, f);
      
      expect(composed.derivs).toEqual(new Set(["d1∘d3", "d2∘d3"]));
      expect(composed.assumptions.get("d1∘d3")).toEqual(new Set(["λ1", "λ3"]));
      expect(composed.assumptions.get("d2∘d3")).toEqual(new Set(["λ2", "λ3"]));
    });

    test("handles empty assumptions in first morphism", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map()  // No assumptions
      };
      const g: Arrow = {
        from: "B", to: "C",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };
      
      const composed = compose(g, f);
      
      expect(composed.assumptions.get("d1∘d2")).toEqual(new Set(["λ2"]));
    });

    test("handles empty assumptions in second morphism", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const g: Arrow = {
        from: "B", to: "C",
        derivs: new Set(["d2"]),
        assumptions: new Map()  // No assumptions
      };
      
      const composed = compose(g, f);
      
      expect(composed.assumptions.get("d1∘d2")).toEqual(new Set(["λ1"]));
    });

    test("is associative (transitivity)", () => {
      const f: Arrow = { 
        from: "A", to: "B", 
        derivs: new Set(["d1"]), 
        assumptions: new Map([["d1", new Set(["λ1"])]]) 
      };
      const g: Arrow = { 
        from: "B", to: "C", 
        derivs: new Set(["d2"]), 
        assumptions: new Map([["d2", new Set(["λ2"])]]) 
      };
      const h: Arrow = { 
        from: "C", to: "D", 
        derivs: new Set(["d3"]), 
        assumptions: new Map([["d3", new Set(["λ3"])]]) 
      };

      const hgf_left = compose(h, compose(g, f));
      const hgf_right = compose(compose(h, g), f);
      
      // Both should have same assumptions
      const minimalLeft = minimalAssumptions(hgf_left);
      const minimalRight = minimalAssumptions(hgf_right);
      
      expect(minimalLeft).toEqual(new Set(["λ1", "λ2", "λ3"]));
      expect(minimalRight).toEqual(new Set(["λ1", "λ2", "λ3"]));
    });

    test("three-step composition accumulates all assumptions", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const g: Arrow = {
        from: "B", to: "C",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };
      const h: Arrow = {
        from: "C", to: "D",
        derivs: new Set(["d3"]),
        assumptions: new Map([["d3", new Set(["λ3"])]])
      };

      const gf = compose(g, f);  // A → C uses {λ1, λ2}
      const hgf = compose(h, gf); // A → D uses {λ1, λ2, λ3}
      
      const minimal = minimalAssumptions(hgf);
      expect(minimal).toEqual(new Set(["λ1", "λ2", "λ3"]));
    });
  });

  describe("minimalAssumptions()", () => {
    test("extracts union of all assumptions", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1", "d2"]),
        assumptions: new Map([
          ["d1", new Set(["λ1", "λ2"])],
          ["d2", new Set(["λ2", "λ3"])]
        ])
      };
      
      const minimal = minimalAssumptions(arrow);
      
      expect(minimal).toEqual(new Set(["λ1", "λ2", "λ3"]));
    });

    test("returns empty set for no assumptions", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1", "d2"]),
        assumptions: new Map()
      };
      
      const minimal = minimalAssumptions(arrow);
      
      expect(minimal.size).toBe(0);
    });

    test("handles single derivation with multiple assumptions", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([
          ["d1", new Set(["λ1", "λ2", "λ3"])]
        ])
      };
      
      const minimal = minimalAssumptions(arrow);
      
      expect(minimal).toEqual(new Set(["λ1", "λ2", "λ3"]));
    });

    test("deduplicates assumptions across derivations", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1", "d2", "d3"]),
        assumptions: new Map([
          ["d1", new Set(["λ1", "λ2"])],
          ["d2", new Set(["λ2", "λ3"])],
          ["d3", new Set(["λ3", "λ1"])]
        ])
      };
      
      const minimal = minimalAssumptions(arrow);
      
      expect(minimal).toEqual(new Set(["λ1", "λ2", "λ3"]));
    });
  });

  describe("derivationsUsingAssumption()", () => {
    test("finds derivations using specific assumption", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1", "d2", "d3"]),
        assumptions: new Map([
          ["d1", new Set(["λ1", "λ2"])],
          ["d2", new Set(["λ2"])],
          ["d3", new Set(["λ3"])]
        ])
      };
      
      const affectedByLambda1 = derivationsUsingAssumption(arrow, "λ1");
      
      expect(affectedByLambda1).toEqual(new Set(["d1"]));
    });

    test("finds multiple derivations using same assumption", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1", "d2", "d3"]),
        assumptions: new Map([
          ["d1", new Set(["λ1", "λ2"])],
          ["d2", new Set(["λ2"])],
          ["d3", new Set(["λ3"])]
        ])
      };
      
      const affectedByLambda2 = derivationsUsingAssumption(arrow, "λ2");
      
      expect(affectedByLambda2).toEqual(new Set(["d1", "d2"]));
    });

    test("returns empty set if assumption not used", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1", "d2"]),
        assumptions: new Map([
          ["d1", new Set(["λ1"])],
          ["d2", new Set(["λ2"])]
        ])
      };
      
      const affectedByLambda3 = derivationsUsingAssumption(arrow, "λ3");
      
      expect(affectedByLambda3.size).toBe(0);
    });

    test("handles derivations with no assumptions", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1", "d2", "d3"]),
        assumptions: new Map([
          ["d1", new Set(["λ1"])],
          // d2 has no assumptions
          ["d3", new Set(["λ2"])]
        ])
      };
      
      const affectedByLambda1 = derivationsUsingAssumption(arrow, "λ1");
      
      expect(affectedByLambda1).toEqual(new Set(["d1"]));
    });
  });

  describe("Integration: compose() + minimalAssumptions()", () => {
    test("multi-step composition tracks all assumptions", () => {
      // A → B (uses λ1)
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };

      // B → C (uses λ2)
      const g: Arrow = {
        from: "B", to: "C",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };

      // C → D (uses λ3)
      const h: Arrow = {
        from: "C", to: "D",
        derivs: new Set(["d3"]),
        assumptions: new Map([["d3", new Set(["λ3"])]])
      };

      const gf = compose(g, f);  // A → C
      const hgf = compose(h, gf); // A → D
      
      const minimal = minimalAssumptions(hgf);
      
      expect(minimal).toEqual(new Set(["λ1", "λ2", "λ3"]));
    });
  });

  describe("Integration: join() + compose()", () => {
    test("join before compose preserves assumptions correctly", () => {
      // Two paths from A to B
      const f1: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const f2: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d2"]),
        assumptions: new Map([["d2", new Set(["λ2"])]])
      };

      // One path from B to C
      const g: Arrow = {
        from: "B", to: "C",
        derivs: new Set(["d3"]),
        assumptions: new Map([["d3", new Set(["λ3"])]])
      };

      const f = join(f1, f2);  // Combined A → B
      const gf = compose(g, f); // A → C
      
      // Should have two composed derivations: d1∘d3 and d2∘d3
      expect(gf.derivs).toEqual(new Set(["d1∘d3", "d2∘d3"]));
      
      // d1∘d3 should use λ1 and λ3
      expect(gf.assumptions.get("d1∘d3")).toEqual(new Set(["λ1", "λ3"]));
      
      // d2∘d3 should use λ2 and λ3
      expect(gf.assumptions.get("d2∘d3")).toEqual(new Set(["λ2", "λ3"]));
      
      // Minimal assumptions should be union of all
      const minimal = minimalAssumptions(gf);
      expect(minimal).toEqual(new Set(["λ1", "λ2", "λ3"]));
    });
  });

  describe("Edge Cases", () => {
    test("empty derivation set has no assumptions", () => {
      const z = zero("A", "B");
      const minimal = minimalAssumptions(z);
      
      expect(minimal.size).toBe(0);
    });

    test("derivation with empty assumption set", () => {
      const arrow: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set()]])
      };
      
      const minimal = minimalAssumptions(arrow);
      
      expect(minimal.size).toBe(0);
    });

    test("compose with zero returns zero", () => {
      const f: Arrow = {
        from: "A", to: "B",
        derivs: new Set(["d1"]),
        assumptions: new Map([["d1", new Set(["λ1"])]])
      };
      const z = zero<string, string>("B", "C");
      
      const composed = compose(z, f);
      
      expect(composed.derivs.size).toBe(0);
      expect(composed.assumptions.size).toBe(0);
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Sprint A2 — Property tests for the refined ECC surface
// Each suite cites the contract in
// `Development and Ideation Documents/ARCHITECTURE/ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md`
// or the Ambler 1996 lemma it discharges.
// ────────────────────────────────────────────────────────────────────────────

const arr = (
  from: string,
  to: string,
  pairs: Array<[string, string[]]>
): Arrow => ({
  from,
  to,
  derivs: new Set(pairs.map(([d]) => d)),
  assumptions: new Map(pairs.map(([d, a]) => [d, new Set(a)])),
});

describe("Sprint A — structural predicates (Ambler Def. 8)", () => {
  test("isSimple holds for empty and singleton hom-sets", () => {
    expect(isSimple(zero("A", "B"))).toBe(true);
    expect(isSimple(arr("A", "B", [["d1", []]]))).toBe(true);
    expect(isSimple(arr("A", "B", [["d1", []], ["d2", []]]))).toBe(false);
  });

  test("isEntire holds iff derivations exist", () => {
    expect(isEntire(zero("A", "B"))).toBe(false);
    expect(isEntire(arr("A", "B", [["d1", []]]))).toBe(true);
  });

  test("isSelected ⇔ isSimple ∧ isEntire ⇔ |derivs| === 1", () => {
    expect(isSelected(zero("A", "B"))).toBe(false);
    expect(isSelected(arr("A", "B", [["d1", []]]))).toBe(true);
    expect(isSelected(arr("A", "B", [["d1", []], ["d2", []]]))).toBe(false);
  });

  test("arrowMeta packages the three predicates", () => {
    const m = arrowMeta(arr("A", "B", [["d1", ["λ1"]]]));
    expect(m).toEqual({ simple: true, entire: true, selected: true });
  });

  test("comonoid laxness — duplication: equality iff selected", () => {
    // For our materialization: tensor(f,f).derivs has |f.derivs|^2 elements;
    // duplicating the source ("Δ_X") and applying (f⊗f) gives the same
    // count. The "Δ_Y ∘ f" side has |f.derivs| elements (one per derivation
    // of f, then duplicated). They agree in cardinality iff |f.derivs| ≤ 1
    // — i.e. iff f is simple. This is the materialized echo of Lemma 7.
    const selected = arr("A", "B", [["d1", ["λ1"]]]);
    const ff_sel = tensor(selected, selected);
    expect(ff_sel.derivs.size).toBe(selected.derivs.size); // 1 = 1²

    const nonSelected = arr("A", "B", [["d1", []], ["d2", []]]);
    const ff_ns = tensor(nonSelected, nonSelected);
    expect(ff_ns.derivs.size).toBe(nonSelected.derivs.size ** 2); // 4 ≠ 2
    expect(ff_ns.derivs.size).toBeGreaterThan(nonSelected.derivs.size);
  });

  test("comonoid laxness — terminal: t_X ≥ t_Y∘f, equality iff entire", () => {
    // The terminal-map condition `t_X = t_Y ∘ f` requires `f` to be entire.
    // Materialized: an empty arrow has no terminal coverage.
    expect(isEntire(zero("A", "B"))).toBe(false);
    expect(isEntire(arr("A", "B", [["d1", []]]))).toBe(true);
  });
});

describe("Sprint A — tensor (⊗) (Ambler §2.1)", () => {
  test("derivs is the Cartesian product of input derivs", () => {
    const f = arr("A", "B", [["d1", []], ["d2", []]]);
    const g = arr("C", "D", [["d3", []], ["d4", []]]);
    const t = tensor(f, g);
    expect(t.derivs.size).toBe(4);
    expect(t.derivs.has("d1⊗d3")).toBe(true);
    expect(t.derivs.has("d2⊗d4")).toBe(true);
  });

  test("each pair's assumptions are the union of the two sides", () => {
    const f = arr("A", "B", [["d1", ["λ1"]]]);
    const g = arr("C", "D", [["d3", ["λ2"]]]);
    const t = tensor(f, g);
    expect(t.assumptions.get("d1⊗d3")).toEqual(new Set(["λ1", "λ2"]));
  });

  test("from/to are pair-typed", () => {
    const f = arr("A", "B", [["d1", []]]);
    const g = arr("C", "D", [["d3", []]]);
    const t = tensor(f, g);
    expect(t.from).toEqual(["A", "C"]);
    expect(t.to).toEqual(["B", "D"]);
  });

  test("tensor with empty arrow yields empty derivs", () => {
    const f = arr("A", "B", [["d1", []]]);
    const z = zero<string, string>("C", "D");
    const t = tensor(f, z);
    expect(t.derivs.size).toBe(0);
  });
});

describe("Sprint A — internalHom / Warrant (Ambler §2.4)", () => {
  test("returns a tagged warrant object", () => {
    const w = internalHom("A", "B", "claim-warrant-123");
    expect(w.kind).toBe("warrant");
    expect(w.from).toBe("A");
    expect(w.to).toBe("B");
    expect(w.warrantClaimId).toBe("claim-warrant-123");
  });
});

describe("Sprint A — isLogical (ECC plan §4 row 1, strict)", () => {
  const allAccepted = () => "ACCEPTED" as const;
  const allProposed = () => "PROPOSED" as const;
  const mixed = (id: string) =>
    id === "λ1" ? ("ACCEPTED" as const) : ("PROPOSED" as const);

  test("empty arrow is not logical (no derivations)", () => {
    expect(isLogical(zero("A", "B"), { assumptionStatus: allAccepted })).toBe(false);
  });

  test("derivation with all-ACCEPTED assumptions is logical", () => {
    const a = arr("A", "B", [["d1", ["λ1", "λ2"]]]);
    expect(isLogical(a, { assumptionStatus: allAccepted })).toBe(true);
  });

  test("PROPOSED assumption blocks the derivation (strict)", () => {
    const a = arr("A", "B", [["d1", ["λ1", "λ2"]]]);
    expect(isLogical(a, { assumptionStatus: allProposed })).toBe(false);
  });

  test("CHALLENGED assumption blocks the derivation (strict)", () => {
    const a = arr("A", "B", [["d1", ["λ1"]]]);
    expect(isLogical(a, { assumptionStatus: () => "CHALLENGED" })).toBe(false);
  });

  test("RETRACTED assumption blocks the derivation (strict)", () => {
    const a = arr("A", "B", [["d1", ["λ1"]]]);
    expect(isLogical(a, { assumptionStatus: () => "RETRACTED" })).toBe(false);
  });

  test("arrow with one logical and one non-logical derivation is logical", () => {
    // Closure under join: any single closed proof suffices.
    const a = arr("A", "B", [["d1", ["λ1"]], ["d2", ["λ1", "λ2"]]]);
    expect(isLogical(a, { assumptionStatus: mixed })).toBe(true);
    expect(isDerivationLogical(a, "d1", { assumptionStatus: mixed })).toBe(true);
    expect(isDerivationLogical(a, "d2", { assumptionStatus: mixed })).toBe(false);
  });

  test("AI-authored derivation without human ratification is NOT logical", () => {
    const a = arr("A", "B", [["d1", []]]);
    expect(
      isLogical(a, {
        assumptionStatus: allAccepted,
        derivationProvenance: () => ({ authorKind: "AI", humanRatified: false }),
      })
    ).toBe(false);
  });

  test("HYBRID-authored derivation without human ratification is NOT logical", () => {
    const a = arr("A", "B", [["d1", []]]);
    expect(
      isLogical(a, {
        assumptionStatus: allAccepted,
        derivationProvenance: () => ({ authorKind: "HYBRID", humanRatified: false }),
      })
    ).toBe(false);
  });

  test("AI-authored derivation WITH human ratification can be logical", () => {
    const a = arr("A", "B", [["d1", []]]);
    expect(
      isLogical(a, {
        assumptionStatus: allAccepted,
        derivationProvenance: () => ({ authorKind: "AI", humanRatified: true }),
      })
    ).toBe(true);
  });

  test("HUMAN-authored derivation needs no ratification flag", () => {
    const a = arr("A", "B", [["d1", []]]);
    expect(
      isLogical(a, {
        assumptionStatus: allAccepted,
        derivationProvenance: () => ({ authorKind: "HUMAN" }),
      })
    ).toBe(true);
  });
});

describe("Sprint A — confidence monoids (Ambler §3, Lemma 26)", () => {
  test("MIN: combine = min, join = max, top = 1", () => {
    expect(MIN_MONOID.combine(0.6, 0.4)).toBe(0.4);
    expect(MIN_MONOID.join(0.6, 0.4)).toBe(0.6);
    expect(MIN_MONOID.top).toBe(1);
  });

  test("PRODUCT: combine = *, join = noisy-OR, top = 1", () => {
    expect(PRODUCT_MONOID.combine(0.5, 0.4)).toBeCloseTo(0.2);
    expect(PRODUCT_MONOID.join(0.5, 0.5)).toBeCloseTo(0.75);
    expect(PRODUCT_MONOID.top).toBe(1);
  });

  test("DS: pointwise product / noisy-OR, top = {bel:1, pl:1}", () => {
    expect(DS_MONOID.combine({ bel: 0.5, pl: 0.8 }, { bel: 0.4, pl: 0.6 }))
      .toEqual({ bel: 0.2, pl: expect.closeTo(0.48, 5) });
    expect(DS_MONOID.top).toEqual({ bel: 1, pl: 1 });
  });

  test("identity law: combine(top, x) === x for every monoid", () => {
    expect(MIN_MONOID.combine(MIN_MONOID.top, 0.7)).toBe(0.7);
    expect(PRODUCT_MONOID.combine(PRODUCT_MONOID.top, 0.7)).toBeCloseTo(0.7);
    const ds = DS_MONOID.combine(DS_MONOID.top, { bel: 0.3, pl: 0.7 });
    expect(ds).toEqual({ bel: 0.3, pl: 0.7 });
  });

  test("commutativity of combine for every monoid", () => {
    expect(MIN_MONOID.combine(0.3, 0.7)).toBe(MIN_MONOID.combine(0.7, 0.3));
    expect(PRODUCT_MONOID.combine(0.3, 0.7))
      .toBeCloseTo(PRODUCT_MONOID.combine(0.7, 0.3));
  });

  test("associativity of join for MIN/PRODUCT", () => {
    const a = 0.2, b = 0.5, c = 0.7;
    expect(MIN_MONOID.join(MIN_MONOID.join(a, b), c))
      .toBe(MIN_MONOID.join(a, MIN_MONOID.join(b, c)));
    expect(PRODUCT_MONOID.join(PRODUCT_MONOID.join(a, b), c))
      .toBeCloseTo(PRODUCT_MONOID.join(a, PRODUCT_MONOID.join(b, c)));
  });

  test("withMinScores injects per-derivation scores", () => {
    const m = withMinScores(new Map([["d1", 0.4], ["d2", 0.9]]));
    const a = arr("A", "B", [["d1", []], ["d2", []]]);
    // join over derivs of base => max(0.4, 0.9) = 0.9
    expect(confidence(a, m)).toBe(0.9);
  });

  test("withProductScores: noisy-OR over derivations", () => {
    const m = withProductScores(new Map([["d1", 0.5], ["d2", 0.5]]));
    const a = arr("A", "B", [["d1", []], ["d2", []]]);
    expect(confidence(a, m)).toBeCloseTo(0.75);
  });

  test("withLogoddsScores: log-odds corroboration over derivations (non-idempotent)", () => {
    const m = withLogoddsScores(new Map([["d1", 0.6], ["d2", 0.6]]));
    const a = arr("A", "B", [["d1", []], ["d2", []]]);
    const c = confidence(a, m);
    // 0.6 ⊕ 0.6 ≈ 0.6923 — above either input, below noisy-OR's 0.84.
    expect(c).toBeCloseTo(0.6923, 3);
    expect(c).toBeGreaterThan(0.6);
    expect(c).toBeLessThan(0.84);
  });

  test("withDsScores: pointwise noisy-OR over derivations", () => {
    const m = withDsScores(
      new Map([
        ["d1", { bel: 0.3, pl: 0.6 }],
        ["d2", { bel: 0.4, pl: 0.7 }],
      ])
    );
    const a = arr("A", "B", [["d1", []], ["d2", []]]);
    const c = confidence(a, m);
    expect(c.bel).toBeCloseTo(1 - 0.7 * 0.6, 5);
    expect(c.pl).toBeCloseTo(1 - 0.4 * 0.3, 5);
  });

  test("Theorem 30 soundness: bel ≤ pl on the DS monoid", () => {
    const scores = new Map([
      ["d1", { bel: 0.3, pl: 0.6 }],
      ["d2", { bel: 0.4, pl: 0.7 }],
    ]);
    const m = withDsScores(scores);
    const a = arr("A", "B", [["d1", []], ["d2", []]]);
    const c = confidence(a, m);
    expect(c.bel).toBeLessThanOrEqual(c.pl);
  });

  test("Lemma 23.1 corollary: isLogical ⇒ confidence === top, for every monoid", () => {
    const a = arr("A", "B", [["d1", ["λ1"]]]);
    const ctx = { assumptionStatus: () => "ACCEPTED" as const };
    expect(isLogical(a, ctx)).toBe(true);

    // Caller honours its half of the contract: base(d) === top for logical d.
    const monoids: ConfidenceMonoid<any>[] = [
      { ...MIN_MONOID, base: () => MIN_MONOID.top },
      { ...PRODUCT_MONOID, base: () => PRODUCT_MONOID.top },
      { ...DS_MONOID, base: () => DS_MONOID.top },
    ];
    for (const m of monoids) {
      expect(confidence(a, m)).toEqual(m.top);
    }
  });
});

describe("Sprint A — confidence monoid registry (ECC plan §4 row 5)", () => {
  test("the four built-ins are pre-registered", () => {
    expect(getConfidenceMonoid("min")?.key).toBe("min");
    expect(getConfidenceMonoid("product")?.key).toBe("product");
    expect(getConfidenceMonoid("logodds")?.key).toBe("logodds");
    expect(getConfidenceMonoid("ds")?.key).toBe("ds");
  });

  test("unknown keys return undefined (closed enum behaviour)", () => {
    expect(getConfidenceMonoid("possibility")).toBeUndefined();
    expect(getConfidenceMonoid("")).toBeUndefined();
  });

  test("registerConfidenceMonoid extends the registry (admin path)", () => {
    const negLog: ConfidenceMonoid<number> = {
      key: "test-neg-log",
      top: 0,
      combine: (x, y) => x + y,
      join: (x, y) => Math.min(x, y),
      base: () => 0,
    };
    registerConfidenceMonoid(negLog);
    expect(getConfidenceMonoid("test-neg-log")).toBe(negLog);
  });
});

describe("Sprint A — transport (Isonomia extension; ECC plan §4 row 2)", () => {
  const F: Functor = {
    mapClaim: (id) =>
      id === "A" ? "A'" : id === "B" ? "B'" : id === "C" ? "C'" : null,
  };

  test("transports endpoints through the functor", () => {
    const a = arr("A", "B", [["d1", ["λ1"]]]);
    const t = transport(F, a);
    expect(t).not.toBeNull();
    expect(t!.from).toBe("A'");
    expect(t!.to).toBe("B'");
    expect(t!.derivs).toEqual(new Set(["d1"]));
    expect(t!.assumptions.get("d1")).toEqual(new Set(["λ1"]));
  });

  test("returns null when an endpoint has no image", () => {
    const a = arr("A", "Z", [["d1", []]]); // Z has no image
    expect(transport(F, a)).toBeNull();
  });

  test("transport preserves composition (one-hop) on minimal assumptions", () => {
    const f = arr("A", "B", [["d1", ["λ1"]]]);
    const g = arr("B", "C", [["d2", ["λ2"]]]);
    const composedThenTransported = transport(F, compose(g, f))!;
    const transportedThenComposed = compose(transport(F, g)!, transport(F, f)!);
    expect(minimalAssumptions(composedThenTransported))
      .toEqual(minimalAssumptions(transportedThenComposed));
  });
});

// ── A1 — two-functor composition (Direction 4, sub-program A coherence) ──────
// Audit: RESEARCH_PROGRAMME/audits/a0-onehop-contract-laxity-vs-policy-2026-06-07.md
//
// These tests DEMONSTRATE that object-level functor composition and the
// symbolic arrow algebra already support multi-hop transport — i.e. the
// one-hop contract (ECC plan §4 row 2) is a *scalar-band provenance* guardrail,
// not a categorical wall. Per the A0 audit, two-functor composition is defined
// LOCALLY here and is deliberately NOT added to lib/argumentation/ecc.ts: the
// production surface keeps the one-hop contract because the scalar log-odds
// band loses source identity (audit §1.3). This suite characterizes WHEN the
// guardrail could lift; it does not lift it.
describe("A1 — two-functor composition (coherence sub-program; NOT a prod surface)", () => {
  // Object-level functor composition: partial-function composition of claim
  // maps, with null propagation. The whole audit §1.1 finding in one helper.
  const composeFunctors = (G: Functor, F: Functor): Functor => ({
    mapClaim: (id) => {
      const mid = F.mapClaim(id);
      return mid === null ? null : G.mapClaim(mid);
    },
  });

  const F: Functor = { mapClaim: (id) => (id === "A" ? "B" : id === "P" ? "Q" : null) };
  const G: Functor = { mapClaim: (id) => (id === "B" ? "C" : id === "Q" ? "R" : null) };

  test("arrow-level: transport(G, transport(F, a)) === transport(compose(G,F), a)", () => {
    // Audit §1.2: transport is identity on derivations + relabels endpoints, so
    // composing the relabelings equals relabeling by the composite.
    const a = arr("A", "P", [["d1", ["λ1"]]]);
    const twoStep = transport(G, transport(F, a)!)!;
    const oneStep = transport(composeFunctors(G, F), a)!;
    expect(oneStep.from).toBe("C");
    expect(oneStep.to).toBe("R");
    expect(oneStep.from).toBe(twoStep.from);
    expect(oneStep.to).toBe(twoStep.to);
    expect(oneStep.derivs).toEqual(twoStep.derivs);
    expect(minimalAssumptions(oneStep)).toEqual(minimalAssumptions(twoStep));
  });

  test("partiality propagates: composite is null iff a hop drops an endpoint", () => {
    // G' maps P→R (so an arrow's `to` survives) but DROPS B (the arrow's `from`
    // image under F). Two-step and composite must agree: both null.
    const Gdrop: Functor = { mapClaim: (id) => (id === "Q" ? "R" : null) };
    const a = arr("A", "P", [["d1", []]]);
    const mid = transport(F, a)!; // B → Q
    expect(transport(Gdrop, mid)).toBeNull(); // B has no Gdrop-image
    expect(transport(composeFunctors(Gdrop, F), a)).toBeNull();
  });

  test("object-level composition is associative (H∘(G∘F) = (H∘G)∘F)", () => {
    // Audit §1.1: partial-function composition is associative ⇒ no categorical
    // obstruction to chaining functors.
    const H: Functor = { mapClaim: (id) => (id === "C" ? "D" : id === "R" ? "S" : null) };
    const a = arr("A", "P", [["d1", ["λ1"]]]);
    const left = transport(composeFunctors(H, composeFunctors(G, F)), a)!;
    const right = transport(composeFunctors(composeFunctors(H, G), F), a)!;
    expect(left.from).toBe("D");
    expect(left.to).toBe("S");
    expect(left.from).toBe(right.from);
    expect(left.to).toBe(right.to);
    expect(left.derivs).toEqual(right.derivs);
  });

  test("band caveat: symbolic aggregation is idempotent (Set union) so it does NOT double-count — the scalar log-odds band is the real one-hop obstruction (audit §1.3)", () => {
    // Re-importing the SAME remote arrow twice dedupes by derivation id, so the
    // symbolic layer is already multi-hop-safe. The double-count the one-hop
    // contract guards against lives in transportAggregator's scalar reducer
    // (corroboration = addition, no derivation identity), NOT here.
    const Fid: Functor = { mapClaim: (id) => (id === "A" || id === "B" ? id : null) };
    const local = arr("A", "B", [["dL", []]]);
    const remote = arr("A", "B", [["dR", ["λR"]]]);
    const once = aggregateAcrossRooms(local, [{ functor: Fid, remote }]);
    const twice = aggregateAcrossRooms(local, [
      { functor: Fid, remote },
      { functor: Fid, remote },
    ]);
    expect(once.derivs).toEqual(new Set(["dL", "dR"]));
    expect(twice.derivs).toEqual(once.derivs); // idempotent ⇒ no symbolic double-count
  });
});


describe("Sprint A — aggregateAcrossRooms (one-hop)", () => {
  const F: Functor = { mapClaim: (id) => id === "A" ? "A" : id === "B" ? "B" : null };

  test("joins local with successfully-transported remotes", () => {
    const local = arr("A", "B", [["dL", ["λL"]]]);
    const remote = arr("A", "B", [["dR", ["λR"]]]);
    const out = aggregateAcrossRooms(local, [{ functor: F, remote }]);
    expect(out.derivs).toEqual(new Set(["dL", "dR"]));
    expect(out.assumptions.get("dL")).toEqual(new Set(["λL"]));
    expect(out.assumptions.get("dR")).toEqual(new Set(["λR"]));
  });

  test("skips remotes whose endpoints don't transport", () => {
    const partial: Functor = { mapClaim: (id) => id === "A" ? "A" : null };
    const local = arr("A", "B", [["dL", []]]);
    const remote = arr("A", "B", [["dR", []]]);
    const out = aggregateAcrossRooms(local, [{ functor: partial, remote }]);
    expect(out.derivs).toEqual(new Set(["dL"]));
  });

  test("skips remotes that land on a different (from,to) pair", () => {
    const fMis: Functor = { mapClaim: (id) => id === "A" ? "X" : id === "B" ? "Y" : null };
    const local = arr("A", "B", [["dL", []]]);
    const remote = arr("A", "B", [["dR", []]]);
    const out = aggregateAcrossRooms(local, [{ functor: fMis, remote }]);
    expect(out.derivs).toEqual(new Set(["dL"]));
  });

  test("commutative under reordering of imports", () => {
    const r1 = arr("A", "B", [["d1", ["λ1"]]]);
    const r2 = arr("A", "B", [["d2", ["λ2"]]]);
    const local = arr("A", "B", [["dL", []]]);
    const a = aggregateAcrossRooms(local, [{ functor: F, remote: r1 }, { functor: F, remote: r2 }]);
    const b = aggregateAcrossRooms(local, [{ functor: F, remote: r2 }, { functor: F, remote: r1 }]);
    expect(a.derivs).toEqual(b.derivs);
  });

  test("identity: empty imports list returns local unchanged", () => {
    const local = arr("A", "B", [["dL", ["λL"]]]);
    const out = aggregateAcrossRooms(local, []);
    expect(out.derivs).toEqual(local.derivs);
    expect(out.assumptions.get("dL")).toEqual(new Set(["λL"]));
  });
});

describe("Sprint A — culpritSets (Ambler §4)", () => {
  test("empty arrow ⇒ empty culprits", () => {
    expect(culpritSets(zero("A", "B"))).toEqual([]);
  });

  test("derivations with no assumptions contribute nothing", () => {
    const a = arr("A", "B", [["d1", []]]);
    expect(culpritSets(a)).toEqual([]);
  });

  test("emits one candidate per distinct assumption-set", () => {
    const a = arr("A", "B", [
      ["d1", ["λ1", "λ2"]],
      ["d2", ["λ1", "λ2"]], // duplicate set — should dedupe
      ["d3", ["λ3"]],
    ]);
    const sets = culpritSets(a);
    expect(sets.length).toBe(2);
  });

  test("ranks by coverage descending then by cost ascending", () => {
    const a = arr("A", "B", [
      ["d1", ["λ1"]],          // candidate {λ1} kills d1, d2, d4 (covers 3)
      ["d2", ["λ1", "λ2"]],    // candidate {λ1,λ2} kills d1, d2, d4 (covers 3)
      ["d3", ["λ3"]],          // candidate {λ3} kills only d3 (covers 1)
      ["d4", ["λ1", "λ4"]],
    ]);
    const sets = culpritSets(a);
    // Top candidate has max coverage and (ties broken) min cost.
    expect(sets[0].badConclusionsExplained).toBe(3);
    expect(sets[0].retractionCost).toBe(1);
    expect(sets[0].assumptions).toEqual(new Set(["λ1"]));
  });

  test("coverage monotonicity: a superset never decreases coverage", () => {
    // Build a hand-crafted arrow and compare two candidates by hand.
    const a = arr("A", "B", [
      ["d1", ["λ1"]],
      ["d2", ["λ2"]],
      ["d3", ["λ1", "λ2"]],
    ]);
    const sets = culpritSets(a);
    const single = sets.find(s => s.assumptions.size === 1)!;
    const dual = sets.find(s => s.assumptions.size === 2)!;
    expect(dual.badConclusionsExplained)
      .toBeGreaterThanOrEqual(single.badConclusionsExplained);
  });

  test("deterministic ordering across calls", () => {
    const a = arr("A", "B", [
      ["d1", ["λ2", "λ1"]],
      ["d2", ["λ3"]],
    ]);
    const r1 = culpritSets(a).map(s => Array.from(s.assumptions).sort().join("|"));
    const r2 = culpritSets(a).map(s => Array.from(s.assumptions).sort().join("|"));
    expect(r1).toEqual(r2);
  });
});

describe("Sprint A — detectEnthymemes", () => {
  const schemes: SchemeCatalog = {
    get(key) {
      if (key === "expert-opinion") {
        return { key, requiredRoles: ["warrant", "background"] };
      }
      return undefined;
    },
  };

  test("emits a nudge for each derivation missing a required role", () => {
    const a = arr("A", "B", [["d1", []]]);
    const nudges = detectEnthymemes(a, schemes, () => ({
      schemeKey: "expert-opinion",
      argumentId: "arg-1",
      rolesPresent: ["warrant"],
    }));
    expect(nudges).toHaveLength(1);
    expect(nudges[0].missingPremiseRoles).toEqual(["background"]);
    expect(nudges[0].argumentId).toBe("arg-1");
    expect(nudges[0].suggestedWarrantText).toBe("");
  });

  test("emits no nudge when all roles are present", () => {
    const a = arr("A", "B", [["d1", []]]);
    const nudges = detectEnthymemes(a, schemes, () => ({
      schemeKey: "expert-opinion",
      argumentId: "arg-1",
      rolesPresent: ["warrant", "background"],
    }));
    expect(nudges).toEqual([]);
  });

  test("fail-quiet: derivation with no schemeKey yields no nudge", () => {
    const a = arr("A", "B", [["d1", []]]);
    const nudges = detectEnthymemes(a, schemes, () => ({ argumentId: "arg-1" }));
    expect(nudges).toEqual([]);
  });

  test("fail-quiet: unknown schemeKey yields no nudge", () => {
    const a = arr("A", "B", [["d1", []]]);
    const nudges = detectEnthymemes(a, schemes, () => ({
      schemeKey: "no-such-scheme",
      argumentId: "arg-1",
    }));
    expect(nudges).toEqual([]);
  });

  test("idempotent: two calls return equal results", () => {
    const a = arr("A", "B", [["d1", []], ["d2", []]]);
    const meta = (d: string) => ({
      schemeKey: "expert-opinion",
      argumentId: `arg-${d}`,
      rolesPresent: [],
    });
    const r1 = detectEnthymemes(a, schemes, meta);
    const r2 = detectEnthymemes(a, schemes, meta);
    expect(r1).toEqual(r2);
  });
});

describe("Sprint A — distributivity sanity (compose over join)", () => {
  test("compose(g, join(f1,f2)) ≈ join(compose(g,f1), compose(g,f2)) on minimal assumptions", () => {
    const f1 = arr("A", "B", [["d1", ["λ1"]]]);
    const f2 = arr("A", "B", [["d2", ["λ2"]]]);
    const g = arr("B", "C", [["d3", ["λ3"]]]);
    const lhs = compose(g, join(f1, f2));
    const rhs = join(compose(g, f1), compose(g, f2));
    expect(minimalAssumptions(lhs)).toEqual(minimalAssumptions(rhs));
    expect(lhs.derivs).toEqual(rhs.derivs);
  });
});
