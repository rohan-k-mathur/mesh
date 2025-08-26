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
  const attacks = new Map<NodeID, Set<NodeID>>();
  for (const n of nodes) attacks.set(n, new Set());
  for (const e of edges) {
    if (e.type === 'rebut' || e.type === 'undercut') {
      attacks.get(e.from)?.add(e.to);
    }
  }
  return attacks;
}

function attacks(attacks: Map<NodeID, Set<NodeID>>, a: NodeID, b: NodeID) {
  return attacks.get(a)?.has(b) ?? false;
}

function defendersOf(attacks: Map<NodeID, Set<NodeID>>, s: Set<NodeID>): Set<NodeID> {
  // all nodes attacked by S
  const out = new Set<NodeID>();
  for (const a of s) for (const b of attacks.get(a) ?? []) out.add(b);
  return out;
}

function attackersOf(attacks: Map<NodeID, Set<NodeID>>, x: NodeID): Set<NodeID> {
  const out = new Set<NodeID>();
  for (const [a, tos] of attacks) if (tos.has(x)) out.add(a);
  return out;
}

function isConflictFree(attacks: Map<NodeID, Set<NodeID>>, s: Set<NodeID>) {
  for (const a of s) for (const b of s) {
    if (a !== b && attacks.get(a)?.has(b)) return false;
  }
  return true;
}

function defends(attacks: Map<NodeID, Set<NodeID>>, s: Set<NodeID>, x: NodeID) {
  // for every attacker b of x, S attacks b
  for (const b of attackersOf(attacks, x)) {
    let defended = false;
    for (const a of s) if (attacks(attacks, a, b)) { defended = true; break; }
    if (!defended) return false;
  }
  return true;
}

function isAdmissible(attacks: Map<NodeID, Set<NodeID>>, s: Set<NodeID>) {
  if (!isConflictFree(attacks, s)) return false;
  for (const a of s) if (!defends(attacks, s, a)) return false;
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
export function preferredExtensions(nodes: NodeID[], attacks: Map<NodeID, Set<NodeID>>): Set<NodeID>[] {
  const n = nodes.length;
  const nodeArr = [...nodes];
  const allSets: Set<NodeID>[] = [];

  const pushIfPreferred = (s: Set<NodeID>) => {
    // Must be admissible and not subset of another admissible superset.
    if (!isAdmissible(attacks, s)) return;
    // check maximality among current pool
    for (const t of allSets) {
      if (subset(s, t)) return;     // s is non-maximal
      if (subset(t, s)) {
        // remove t
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
  const seeds: Set<NodeID>[] = [];
  // seed by degree order
  const degree = nodeArr.map(id => (attacks.get(id)?.size ?? 0) + Array.from(attacks).filter(([a, tos]) => tos.has(id)).length);
  const idx = nodeArr.map((id, i) => i).sort((a, b) => degree[a] - degree[b]);

  for (let s = 0; s < Math.min(24, n); s++) {
    const start = new Set<NodeID>([nodeArr[idx[s]]]);
    // grow
    const grow = new Set<NodeID>(start);
    for (const candidate of nodeArr) {
      if (grow.has(candidate)) continue;
      const next = new Set(grow); next.add(candidate);
      if (isAdmissible(attacks, next)) { grow.add(candidate); }
    }
    pushIfPreferred(grow);
  }
  return allSets;
}
