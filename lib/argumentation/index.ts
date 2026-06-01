// lib/argumentation/index.ts
//
// Single public surface for the Dung abstract-argumentation (AF) engine.
//
// Phase 0 (consolidation) of the argumentation-semantics roadmap:
// `Development and Ideation Documents/ARCHITECTURE/ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md`.
//
// Until Phase 0 lands, grounded/preferred/labelling were reimplemented in ≥ 3
// places (lib/deepdive/af.ts, lib/argumentation/afEngine.ts, and inline copies
// in app/api/.../route.ts). This module is the engine of record: all call sites
// should import from `@/lib/argumentation` rather than the underlying modules.
//
// Two graph representations coexist (both re-exported here, unchanged for now):
//   • attack-map  — `Map<NodeID, Set<NodeID>>` (lib/deepdive/af.ts)
//   • edge-list   — `Array<[string, string]>`  (lib/argumentation/afEngine.ts)
//
// Phase 1 will unify these behind a labelling-based core; Phase 0 only removes
// the duplication by routing everything through this surface.

// ----------------------------------------------------------------------------
// Attack-map representation (Map<NodeID, Set<NodeID>>)
// ----------------------------------------------------------------------------

import type { NodeID } from "@/lib/deepdive/af";
import { preferredExtensions as preferredExtensionsImpl } from "@/lib/deepdive/af";

export type { NodeID, Edge } from "@/lib/deepdive/af";
export { buildAttackGraph, preferredExtensions } from "@/lib/deepdive/af";

/**
 * Grounded extension over the attack-map representation — the least fixpoint of
 * Dung's characteristic function F(S) = { a | every attacker of a is attacked
 * by S }, starting from ∅.
 *
 * This is the canonical copy. It replaces the byte-identical inline definitions
 * previously carried in `app/api/deliberations/[id]/dialectic/route.ts` and
 * `app/api/sheets/[id]/route.ts`.
 *
 * Exact and poly-time; terminates in ≤ |nodes| iterations (the acceptability
 * computation is a finite Knaster–Tarski fixpoint — see the cyclic-defeat
 * closure, Q-031).
 */
export function groundedExtension(
  nodes: NodeID[],
  attackMap: Map<NodeID, Set<NodeID>>
): Set<NodeID> {
  const attackersOf = (x: NodeID): Set<NodeID> => {
    const res = new Set<NodeID>();
    for (const [a, tos] of attackMap) if (tos.has(x)) res.add(a);
    return res;
  };
  const sAttacks = (S: Set<NodeID>, y: NodeID): boolean => {
    for (const a of S) if (attackMap.get(a)?.has(y)) return true;
    return false;
  };

  let S = new Set<NodeID>(); // start from ∅
  for (;;) {
    const F = new Set<NodeID>();
    for (const a of nodes) {
      const atks = attackersOf(a);
      const defended = [...atks].every((b) => sAttacks(S, b));
      if (defended) F.add(a);
    }
    if (F.size === S.size && [...F].every((x) => S.has(x))) return F; // fixpoint
    S = F;
  }
}

/**
 * IN/OUT/UNDEC labelling derived from a single extension over the attack-map
 * representation. IN = E; OUT = attacked by E; UNDEC = everything else.
 */
export function labelingFromAttackMap(
  nodes: NodeID[],
  attackMap: Map<NodeID, Set<NodeID>>,
  extension: Set<NodeID>
): { IN: Set<NodeID>; OUT: Set<NodeID>; UNDEC: Set<NodeID> } {
  const IN = new Set(extension);
  const OUT = new Set<NodeID>();
  for (const [att, tos] of attackMap) {
    if (IN.has(att)) for (const t of tos) if (!IN.has(t)) OUT.add(t);
  }
  const UNDEC = new Set<NodeID>();
  for (const n of nodes) if (!IN.has(n) && !OUT.has(n)) UNDEC.add(n);
  return { IN, OUT, UNDEC };
}

/**
 * Skeptical acceptance under preferred semantics over the attack-map
 * representation: the arguments in *every* preferred extension.
 */
export function skepticalPreferred(
  nodes: NodeID[],
  attackMap: Map<NodeID, Set<NodeID>>,
  extensions?: Set<NodeID>[]
): Set<NodeID> {
  const exts: Set<NodeID>[] = extensions ?? preferredExtensionsImpl(nodes, attackMap) ?? [];
  const inAll = new Set<NodeID>();
  if (exts.length > 0) {
    for (const n of exts[0]) if (exts.every((s) => s.has(n))) inAll.add(n);
  }
  return inAll;
}

// ----------------------------------------------------------------------------
// Edge-list representation (Array<[string, string]>)
// ----------------------------------------------------------------------------

export type { AFNode, AFEdge, AF, EdgeType, BuildOptions } from "@/lib/argumentation/afEngine";
export {
  projectToAF,
  conflictFree,
  defends,
  characteristicF,
  isAdmissible,
  grounded,
  preferred,
  labelingFromExtension,
} from "@/lib/argumentation/afEngine";

// ----------------------------------------------------------------------------
// Labelling core (Phase 1) — the engine of record's exact, semantics-complete
// surface. Operates on the representation-neutral `DefeatGraph`; build one with
// `toDefeatGraphFromEdgeList` / `toDefeatGraphFromAttackMap`.
// ----------------------------------------------------------------------------

export type { Label, ArgId, Labelling, DefeatGraph } from "@/lib/argumentation/types";
export {
  toDefeatGraphFromEdgeList,
  toDefeatGraphFromAttackMap,
  groundedLabelling,
  groundedExtension as groundedExtensionDG,
  labellingOf,
  labellingToSets,
} from "@/lib/argumentation/labelling";
export {
  completeExtensions,
  preferredExtensions as preferredExtensionsDG,
  stableExtensions,
  semiStableExtensions,
} from "@/lib/argumentation/semantics";
