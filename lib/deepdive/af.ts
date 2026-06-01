// lib/deepdive/af.ts
//
// @deprecated Import the AF engine from `@/lib/argumentation` (the consolidated
// engine of record) rather than this module directly. This file remains the
// attack-map (`Map<NodeID, Set<NodeID>>`) adapter surface and is re-exported by
// `lib/argumentation/index.ts`. As of Phase 1, `preferredExtensions` delegates
// to the exact labelling core (`@/lib/argumentation/semantics`); the previous
// heuristic fallback for > 18 nodes is gone — results are exact for all sizes.
import { toDefeatGraphFromAttackMap } from "@/lib/argumentation/labelling";
import { preferredExtensions as preferredExtensionsCore } from "@/lib/argumentation/semantics";

export type NodeID = string;

export type Edge = {
  from: NodeID;
  to: NodeID;
  type: 'rebut' | 'undercut' | 'support';
};

/**
 * Build an attack graph (Dung AF) from edges.
 * We treat 'rebut' as attack and 'undercut' as attack on the target claim.
 * 'support' is ignored for conflict; can be used later for labeling.
 */
export function buildAttackGraph(nodes: NodeID[], edges: Edge[]) {
  const attackMap = new Map<NodeID, Set<NodeID>>();
  for (const n of nodes) attackMap.set(n, new Set());
  for (const e of edges) {
    if (e.type === 'rebut' || e.type === 'undercut') {
      attackMap.get(e.from)?.add(e.to);
    }
  }
  return attackMap;
}

/**
 * Enumerate preferred extensions — the ⊆-maximal admissible sets.
 *
 * Delegates to the exact labelling-based core. Exact for all framework sizes;
 * the previous brute-force-≤18 / unsound-heuristic-above-18 split has been
 * removed (Phase 1, commitment C2).
 */
export function preferredExtensions(
  nodes: NodeID[],
  attackMap: Map<NodeID, Set<NodeID>>
): Set<NodeID>[] {
  return preferredExtensionsCore(toDefeatGraphFromAttackMap(nodes, attackMap));
}
