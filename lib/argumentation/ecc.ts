// lib/argumentation/ecc.ts
// Evidential Category of Claims (ECC)
// Implements categorical operations for argumentation with derivation sets.

export type DerivationId = string;

/**
 * Arrow in the evidential category.
 * 
 * Represents a morphism from A to B in the category of claims.
 * The morphism is materialized as a finite set of derivation IDs,
 * where each derivation represents a distinct argumentation path.
 * 
 * @typeParam A - Domain (source claim or premise)
 * @typeParam B - Codomain (target claim or conclusion)
 * 
 * @property from - Source object (claim A)
 * @property to - Target object (claim B)
 * @property derivs - Finite set of derivation IDs (each has its own assumptions, scheme, sources)
 */
export type Arrow<A=string,B=string> = {
  from: A; 
  to: B;
  derivs: Set<DerivationId>;
};

/**
 * Join (accrual) operation: union of derivation sets.
 * 
 * Categorical semantics: Coproduct (∨) in the hom-set poset hom(A,B).
 * "Piles up" independent arguments for the same conclusion.
 * 
 * PRECONDITION: f and g must be morphisms in the SAME hom-set.
 * That is, f.from === g.from AND f.to === g.to.
 * 
 * Mathematically: If f,g ∈ hom(A,B), then join(f,g) ∈ hom(A,B).
 * 
 * Identity: join(f, zero(A,B)) = f
 * Commutativity: join(f,g) = join(g,f)
 * Associativity: join(join(f,g),h) = join(f,join(g,h))
 * 
 * @param f - First morphism from A to B
 * @param g - Second morphism from A to B
 * @returns New morphism with union of derivation sets
 * @throws {Error} if morphisms have different domains or codomains
 * 
 * @example
 * ```typescript
 * const arg1: Arrow = { from: "P", to: "C", derivs: new Set(["a1"]) };
 * const arg2: Arrow = { from: "P", to: "C", derivs: new Set(["a2"]) };
 * const combined = join(arg1, arg2);
 * // Result: { from: "P", to: "C", derivs: Set(["a1", "a2"]) }
 * ```
 */
export function join<A,B>(f: Arrow<A,B>, g: Arrow<A,B>): Arrow<A,B> {
  if (f.from !== g.from || f.to !== g.to) {
    throw new Error('join: type mismatch - morphisms must be in same hom-set (same domain and codomain)');
  }
  return { from: f.from, to: f.to, derivs: new Set([...f.derivs, ...g.derivs]) };
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
 * @returns Arrow with empty derivation set
 * 
 * @example
 * ```typescript
 * const empty = zero("P", "C");
 * // Result: { from: "P", to: "C", derivs: Set([]) }
 * ```
 */
export function zero<A,B>(from:A, to:B): Arrow<A,B> {
  return { from, to, derivs: new Set() };
}

/**
 * Composition operation: chain two morphisms.
 * 
 * Categorical semantics: Functorial composition (∘) in the evidential category.
 * If f: A→B and g: B→C, then compose(g,f): A→C.
 * 
 * Each composed derivation is the Cartesian product of derivation pairs.
 * Represents transitive argumentation: "A supports B" and "B supports C" implies "A supports C".
 * 
 * Category laws:
 * - Associativity: compose(h, compose(g,f)) = compose(compose(h,g), f)
 * - Identity: compose(id_B, f) = f = compose(f, id_A)
 * 
 * @param g - Second morphism (B→C)
 * @param f - First morphism (A→B)
 * @returns Composed morphism (A→C) with derivation pairs
 * 
 * @example
 * ```typescript
 * const f: Arrow = { from: "A", to: "B", derivs: new Set(["d1", "d2"]) };
 * const g: Arrow = { from: "B", to: "C", derivs: new Set(["d3"]) };
 * const composed = compose(g, f);
 * // Result: { from: "A", to: "C", derivs: Set(["d1∘d3", "d2∘d3"]) }
 * ```
 */
export function compose<A,B,C>(g: Arrow<B,C>, f: Arrow<A,B>): Arrow<A,C> {
  // semantics: each composed derivation references an ordered pair (d_f, d_g)
  const out = zero<A,C>(f.from, g.to);
  for (const df of f.derivs) {
    for (const dg of g.derivs) {
      out.derivs.add(`${df}∘${dg}`);
    }
  }
  return out;
}
