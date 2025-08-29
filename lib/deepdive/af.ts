// lib/deepdive/af.ts
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

// ✅ predicate has a distinct name; no shadowing
function doesAttack(attackMap: Map<NodeID, Set<NodeID>>, a: NodeID, b: NodeID) {
  return attackMap.get(a)?.has(b) ?? false;
}

function defendersOf(attackMap: Map<NodeID, Set<NodeID>>, s: Set<NodeID>): Set<NodeID> {
  // all nodes attacked by S
  const out = new Set<NodeID>();
  for (const a of s) for (const b of attackMap.get(a) ?? []) out.add(b);
  return out;
}

function attackersOf(attackMap: Map<NodeID, Set<NodeID>>, x: NodeID): Set<NodeID> {
  const out = new Set<NodeID>();
  for (const [a, tos] of attackMap) if (tos.has(x)) out.add(a);
  return out;
}

function isConflictFree(attackMap: Map<NodeID, Set<NodeID>>, s: Set<NodeID>) {
  for (const a of s) for (const b of s) {
    if (a !== b && attackMap.get(a)?.has(b)) return false;
  }
  return true;
}

function defends(attackMap: Map<NodeID, Set<NodeID>>, s: Set<NodeID>, x: NodeID) {
  // for every attacker b of x, S attacks b
  for (const b of attackersOf(attackMap, x)) {
    let defended = false;
    for (const a of s) if (doesAttack(attackMap, a, b)) { defended = true; break; }
    if (!defended) return false;
  }
  return true;
}

function isAdmissible(attackMap: Map<NodeID, Set<NodeID>>, s: Set<NodeID>) {
  if (!isConflictFree(attackMap, s)) return false;
  for (const a of s) if (!defends(attackMap, s, a)) return false;
  return true;
}

function subset<T>(a: Set<T>, b: Set<T>) {
  if (a.size > b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * Enumerate preferred extensions:
 *  - exact for n <= 18 (2^n is manageable in practice for P1)
 *  - heuristic for n > 18: greedy grow admissible sets to maximal, produce a small pool.
 */
export function preferredExtensions(
  nodes: NodeID[],
  attackMap: Map<NodeID, Set<NodeID>>
): Set<NodeID>[] {
  const n = nodes.length;
  const nodeArr = [...nodes];
  const allSets: Set<NodeID>[] = [];

  const pushIfPreferred = (s: Set<NodeID>) => {
    // Must be admissible and not subset of another admissible superset.
    if (!isAdmissible(attackMap, s)) return;
    // check maximality among current pool
    for (const t of allSets) {
      if (subset(s, t)) return;     // s is non-maximal
      if (subset(t, s)) {
        const idx = allSets.indexOf(t);
        if (idx >= 0) allSets.splice(idx, 1);
      }
    }
    allSets.push(s);
  };

  if (n <= 18) {
    const total = 1 << n;
    for (let mask = 0; mask < total; mask++) {
      const s = new Set<NodeID>();
      for (let i = 0; i < n; i++) if (mask & (1 << i)) s.add(nodeArr[i]);
      pushIfPreferred(s);
    }
    return allSets;
  }

  // Heuristic: grow several seeds greedily to maximal admissible sets
  const degree = nodeArr.map(
    id => (attackMap.get(id)?.size ?? 0) + Array.from(attackMap).filter(([_, tos]) => tos.has(id)).length
  );
  const idx = nodeArr.map((_, i) => i).sort((a, b) => degree[a] - degree[b]);

  for (let s = 0; s < Math.min(24, n); s++) {
    const start = new Set<NodeID>([nodeArr[idx[s]]]);
    const grow = new Set<NodeID>(start);
    for (const candidate of nodeArr) {
      if (grow.has(candidate)) continue;
      const next = new Set(grow); next.add(candidate);
      if (isAdmissible(attackMap, next)) { grow.add(candidate); }
    }
    pushIfPreferred(grow);
  }
  return allSets;
}
