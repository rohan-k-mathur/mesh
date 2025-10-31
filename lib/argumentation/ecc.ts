// lib/argumentation/ecc.ts
// Evidential Category of Claims (ECC)
// Implements categorical operations for argumentation with derivation sets.
// Phase: Gap 4 - Per-Derivation Assumption Tracking

export type DerivationId = string;
export type AssumptionId = string;

/**
 * Arrow in the evidential category with per-derivation assumptions.
 * 
 * Represents a morphism from A to B in the category of claims.
 * The morphism is materialized as a finite set of derivation IDs,
 * where each derivation represents a distinct argumentation path.
 * 
 * Each derivation in the hom-set may rely on a different set of assumptions.
 * This enables precise tracking of assumption dependencies through composition.
 * 
 * @typeParam A - Domain (source claim or premise)
 * @typeParam B - Codomain (target claim or conclusion)
 * 
 * @property from - Source object (claim A)
 * @property to - Target object (claim B)
 * @property derivs - Finite set of derivation IDs (each has its own assumptions, scheme, sources)
 * @property assumptions - Map from derivationId to set of assumptionIds
 *   - Key: derivationId (must be in `derivs` set)
 *   - Value: Set of AssumptionUse.id that this derivation requires
 * 
 * @invariant assumptions.keys() ⊆ derivs
 * 
 * @example
 * ```typescript
 * const arrow: Arrow = {
 *   from: "P",
 *   to: "C",
 *   derivs: new Set(["d1", "d2"]),
 *   assumptions: new Map([
 *     ["d1", new Set(["λ1", "λ2"])],  // d1 uses λ1, λ2
 *     ["d2", new Set(["λ1"])]         // d2 uses only λ1
 *   ])
 * };
 * ```
 */
export type Arrow<A=string,B=string> = {
  from: A; 
  to: B;
  derivs: Set<DerivationId>;
  assumptions: Map<DerivationId, Set<AssumptionId>>;
};

/**
 * Join (accrual) operation: union of derivation sets with assumption tracking.
 * 
 * Categorical semantics: Coproduct (∨) in the hom-set poset hom(A,B).
 * "Piles up" independent arguments for the same conclusion.
 * Merges independent arguments while preserving per-derivation assumptions.
 * 
 * PRECONDITION: f and g must be morphisms in the SAME hom-set.
 * That is, f.from === g.from AND f.to === g.to.
 * 
 * Mathematically: If f,g ∈ hom(A,B), then join(f,g) ∈ hom(A,B).
 * 
 * Assumption merge strategy: Simple union of both assumption maps.
 * - If derivation d appears in both f and g with different assumptions,
 *   union them (should be rare - derivation IDs are typically unique).
 * 
 * Identity: join(f, zero(A,B)) = f
 * Commutativity: join(f,g) = join(g,f)
 * Associativity: join(join(f,g),h) = join(f,join(g,h))
 * 
 * @param f - First morphism from A to B
 * @param g - Second morphism from A to B
 * @returns New morphism with union of derivation sets and merged assumptions
 * @throws {Error} if morphisms have different domains or codomains
 * 
 * @example
 * ```typescript
 * const arg1: Arrow = { 
 *   from: "P", to: "C", 
 *   derivs: new Set(["d1"]),
 *   assumptions: new Map([["d1", new Set(["λ1"])]])
 * };
 * const arg2: Arrow = { 
 *   from: "P", to: "C", 
 *   derivs: new Set(["d2"]),
 *   assumptions: new Map([["d2", new Set(["λ2"])]])
 * };
 * const combined = join(arg1, arg2);
 * // Result: { 
 * //   from: "P", to: "C", 
 * //   derivs: Set(["d1", "d2"]),
 * //   assumptions: Map([["d1", Set(["λ1"])], ["d2", Set(["λ2"])]])
 * // }
 * ```
 */
export function join<A,B>(f: Arrow<A,B>, g: Arrow<A,B>): Arrow<A,B> {
  if (f.from !== g.from || f.to !== g.to) {
    throw new Error('join: type mismatch - morphisms must be in same hom-set (same domain and codomain)');
  }
  
  // Merge derivation sets
  const derivs = new Set([...f.derivs, ...g.derivs]);
  
  // Merge assumption maps
  const assumptions = new Map<DerivationId, Set<AssumptionId>>();
  for (const [deriv, assums] of f.assumptions) {
    assumptions.set(deriv, new Set(assums));  // Deep copy
  }
  for (const [deriv, assums] of g.assumptions) {
    if (assumptions.has(deriv)) {
      // Same derivation in both - union assumptions (should be rare)
      const existing = assumptions.get(deriv)!;
      for (const a of assums) existing.add(a);
    } else {
      assumptions.set(deriv, new Set(assums));
    }
  }
  
  return { from: f.from, to: f.to, derivs, assumptions };
}

/**
 * Zero morphism: empty derivation set (vacuous support).
 * 
 * Categorical semantics: Bottom element (⊥) in the hom-set poset hom(A,B).
 * Represents "no argumentation path from A to B".
 * 
 * Identity for join: join(f, zero(A,B)) = f
 * 
 * @param from - Domain (source claim A)
 * @param to - Codomain (target claim B)
 * @returns Arrow with empty derivation set and empty assumptions map
 * 
 * @example
 * ```typescript
 * const empty = zero("P", "C");
 * // Result: { from: "P", to: "C", derivs: Set([]), assumptions: Map([]) }
 * ```
 */
export function zero<A,B>(from:A, to:B): Arrow<A,B> {
  return { 
    from, 
    to, 
    derivs: new Set(),
    assumptions: new Map()  // Empty map for vacuous morphism
  };
}

/**
 * Composition operation: chain two morphisms with transitive assumption tracking.
 * 
 * Categorical semantics: Functorial composition (∘) in the evidential category.
 * If f: A→B and g: B→C, then compose(g,f): A→C.
 * 
 * Each composed derivation is the Cartesian product of derivation pairs.
 * Represents transitive argumentation: "A supports B" and "B supports C" implies "A supports C".
 * 
 * Assumption propagation:
 * - The composed derivation `d_f ∘ d_g` inherits assumptions from BOTH derivations.
 * - This models transitive dependencies: "To believe C via this path, you must accept
 *   all assumptions from A→B AND all assumptions from B→C."
 * 
 * Mathematical property: If f uses {λ1} and g uses {λ2}, then compose(g,f) uses {λ1, λ2}.
 * 
 * Category laws:
 * - Associativity: compose(h, compose(g,f)) = compose(compose(h,g), f)
 * - Identity: compose(id_B, f) = f = compose(f, id_A)
 * 
 * @param g - Second morphism (B→C)
 * @param f - First morphism (A→B)
 * @returns Composed morphism (A→C) with derivation pairs and inherited assumptions
 * 
 * @example
 * ```typescript
 * const f: Arrow = { 
 *   from: "A", to: "B", 
 *   derivs: new Set(["d1", "d2"]),
 *   assumptions: new Map([["d1", new Set(["λ1"])]])
 * };
 * const g: Arrow = { 
 *   from: "B", to: "C", 
 *   derivs: new Set(["d3"]),
 *   assumptions: new Map([["d3", new Set(["λ2"])]])
 * };
 * const composed = compose(g, f);
 * // Result: { 
 * //   from: "A", to: "C", 
 * //   derivs: Set(["d1∘d3", "d2∘d3"]),
 * //   assumptions: Map([
 * //     ["d1∘d3", Set(["λ1", "λ2"])],  // Union from d1 and d3
 * //     ["d2∘d3", Set(["λ2"])]         // Only from d3 (d2 has no assumptions)
 * //   ])
 * // }
 * ```
 */
export function compose<A,B,C>(g: Arrow<B,C>, f: Arrow<A,B>): Arrow<A,C> {
  // semantics: each composed derivation references an ordered pair (d_f, d_g)
  const out = zero<A,C>(f.from, g.to);
  
  for (const df of f.derivs) {
    for (const dg of g.derivs) {
      const composedDerivId = `${df}∘${dg}`;
      out.derivs.add(composedDerivId);
      
      // Union assumptions from both derivations
      const assumsF = f.assumptions.get(df) ?? new Set();
      const assumsG = g.assumptions.get(dg) ?? new Set();
      const unionAssums = new Set([...assumsF, ...assumsG]);
      
      out.assumptions.set(composedDerivId, unionAssums);
    }
  }
  
  return out;
}

/**
 * Extract the minimal set of assumptions required for a morphism.
 * 
 * Returns the union of all assumptions across all derivations in the morphism.
 * This represents the complete set of assumptions needed to accept the conclusion.
 * 
 * @param arrow - Arrow to extract assumptions from
 * @returns Set of all unique assumption IDs
 * 
 * @example
 * ```typescript
 * const arrow: Arrow = {
 *   from: "P", to: "C",
 *   derivs: new Set(["d1", "d2"]),
 *   assumptions: new Map([
 *     ["d1", new Set(["λ1", "λ2"])],
 *     ["d2", new Set(["λ2", "λ3"])]
 *   ])
 * };
 * const minimal = minimalAssumptions(arrow);
 * // Result: Set(["λ1", "λ2", "λ3"])
 * ```
 */
export function minimalAssumptions<A,B>(arrow: Arrow<A,B>): Set<AssumptionId> {
  const result = new Set<AssumptionId>();
  for (const assums of arrow.assumptions.values()) {
    for (const a of assums) result.add(a);
  }
  return result;
}

/**
 * Find all derivations in a morphism that use a given assumption.
 * 
 * Useful for "what if λ₁ fails?" analysis - find affected derivations.
 * 
 * @param arrow - Arrow to search
 * @param assumptionId - Assumption ID to find
 * @returns Set of derivation IDs that use this assumption
 * 
 * @example
 * ```typescript
 * const arrow: Arrow = {
 *   from: "P", to: "C",
 *   derivs: new Set(["d1", "d2", "d3"]),
 *   assumptions: new Map([
 *     ["d1", new Set(["λ1", "λ2"])],
 *     ["d2", new Set(["λ2"])],
 *     ["d3", new Set(["λ3"])]
 *   ])
 * };
 * const affectedDerivs = derivationsUsingAssumption(arrow, "λ1");
 * // Result: Set(["d1"])  (only d1 uses λ1)
 * ```
 */
export function derivationsUsingAssumption<A,B>(
  arrow: Arrow<A,B>, 
  assumptionId: AssumptionId
): Set<DerivationId> {
  const result = new Set<DerivationId>();
  for (const [deriv, assums] of arrow.assumptions) {
    if (assums.has(assumptionId)) {
      result.add(deriv);
    }
  }
  return result;
}
