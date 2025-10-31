// tests/ecc.test.ts
// Unit tests for Evidential Category of Claims (ECC) with assumption tracking
// Phase: Gap 4 - Per-Derivation Assumption Tracking

import { 
  Arrow, 
  zero, 
  join, 
  compose, 
  minimalAssumptions, 
  derivationsUsingAssumption 
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
