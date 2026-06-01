// lib/argumentation/types.ts
//
// Core types for the consolidated Dung abstract-argumentation engine.
//
// Phase 1 of the argumentation-semantics consolidation roadmap. The engine is
// *labelling-based* (design commitment C1): the complete labelling is the
// primitive, and grounded / preferred / stable / semi-stable are derived as
// constraints on labellings rather than enumerated extensions with labels
// back-derived.

/** Three-valued argument label (Caminada–Gabbay). */
export type Label = "IN" | "OUT" | "UNDEC";

export type ArgId = string;

/** A total labelling of every argument in a framework. */
export type Labelling = Map<ArgId, Label>;

/**
 * A Dung abstract-argumentation framework (an attack graph).
 *
 * `attacks` is the adjacency map attacker → set-of-attacked. It is the single
 * internal representation; adapters convert the two legacy surface shapes
 * (edge-list `Array<[string, string]>` and attack-map `Map<id, Set<id>>`) into
 * this type via `toDefeatGraph*` in `labelling.ts`.
 *
 * (Phase 3 will extend this with `preferences` and `provenance`; Phase 1 keeps
 * it to the abstract attack relation only.)
 */
export interface DefeatGraph {
  args: ArgId[];
  attacks: Map<ArgId, Set<ArgId>>;
}
