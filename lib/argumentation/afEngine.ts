// lib/argumentation/afEngine.ts
export type EdgeType = 'support' | 'rebut' | 'undercut' | 'attack';

export type AFNode = { id: string; label?: string; text?: string };
export type AFEdge = { from: string; to: string; type: EdgeType };

export type AF = { A: string[]; R: Array<[string, string]> };

export type BuildOptions = {
  /** If true, propagate support as defense: s→b and x→b induce s→x. */
  supportDefensePropagation?: boolean;
  /** If true, take transitive closure over supports before propagation. */
  supportClosure?: boolean;
};

const asAttack = (t: EdgeType) => t === 'attack' || t === 'rebut' || t === 'undercut';

/** Project our bipolar graph to a plain AF (Dung): only attacks R ⊆ A×A. */
export function projectToAF(nodes: AFNode[], edges: AFEdge[], opts: BuildOptions = {}): AF {
  const A = nodes.map(n => n.id);
  const idSet = new Set(A);

  const attacks: Array<[string, string]> = [];
  const supportsByTarget = new Map<string, Set<string>>();
  const supportOut = new Map<string, Set<string>>();

  for (const e of edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    if (asAttack(e.type)) attacks.push([e.from, e.to]);
    if (e.type === 'support') {
      if (!supportsByTarget.has(e.to)) supportsByTarget.set(e.to, new Set());
      supportsByTarget.get(e.to)!.add(e.from);
      if (!supportOut.has(e.from)) supportOut.set(e.from, new Set());
      supportOut.get(e.from)!.add(e.to);
    }
  }

  // Optional: compute support transitive closure (s1 supports s2 supports b ⇒ s1 supports b)
  let supportClosure: Map<string, Set<string>> | undefined;
  if (opts.supportClosure) {
    supportClosure = new Map();
    // BFS from each supporter
    for (const s of supportOut.keys()) {
      const seen = new Set<string>();
      const q = [s];
      while (q.length) {
        const cur = q.shift()!;
        const outs = supportOut.get(cur);
        if (!outs) continue;
        for (const t of outs) {
          if (!seen.has(t)) {
            seen.add(t);
            q.push(t);
          }
        }
      }
      supportClosure.set(s, seen);
    }
  }

  if (opts.supportDefensePropagation) {
    const add = (a: string, b: string) => {
      // avoid duplicates
      for (const [x, y] of attacks) if (x === a && y === b) return;
      attacks.push([a, b]);
    };
    // For each attack x→b, every supporter s of b gets a derived attack s→x.
    for (const [x, b] of attacks.slice()) {
      const supporters = new Set<string>();
      // direct supporters
      const direct = supportsByTarget.get(b);
      if (direct) direct.forEach(s => supporters.add(s));
      // transitive supporters
      if (supportClosure) {
        for (const s of supportClosure.keys()) {
          if (supportClosure.get(s)!.has(b)) supporters.add(s);
        }
      }
      supporters.forEach(s => add(s, x));
    }
  }

  // Filter self-attacks if you wish (often allowed but we skip by default)
  const R = attacks.filter(([x, y]) => x !== y);
  return { A, R };
}

/* ---------- Dung semantics ---------- */

function attackersOf(a: string, R: Array<[string, string]>): string[] {
  const arr: string[] = [];
  for (const [x, y] of R) if (y === a) arr.push(x);
  return arr;
}
function attacks(S: Set<string>, b: string, R: Array<[string, string]>): boolean {
  for (const s of S) for (const [x, y] of R) if (x === s && y === b) return true;
  return false;
}
export function conflictFree(S: Set<string>, R: Array<[string, string]>): boolean {
  for (const [x, y] of R) if (S.has(x) && S.has(y)) return false;
  return true;
}
export function defends(S: Set<string>, a: string, R: Array<[string, string]>): boolean {
  const atks = attackersOf(a, R);
  for (const b of atks) {
    if (!attacks(S, b, R)) return false;
  }
  return true;
}
export function characteristicF(A: string[], R: Array<[string, string]>, S: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const a of A) if (defends(S, a, R)) out.add(a);
  return out;
}

/** Grounded extension via least fixpoint of characteristic function. */
export function grounded(A: string[], R: Array<[string, string]>): Set<string> {
  let S = new Set<string>(); // ∅
  while (true) {
    const next = characteristicF(A, R, S);
    // fixpoint?
    if (next.size === S.size && [...next].every(x => S.has(x))) return next;
    S = next;
  }
}

/** Check admissibility: conflict-free and defends all its members. */
export function isAdmissible(A: string[], R: Array<[string, string]>, S: Set<string>): boolean {
  if (!conflictFree(S, R)) return false;
  for (const a of S) if (!defends(S, a, R)) return false;
  return true;
}

/** Preferred extensions: maximal (w.r.t inclusion) admissible sets.  */
export function preferred(A: string[], R: Array<[string, string]>, maxExplore = 20000): Array<Set<string>> {
  // Small DFS with pruning; falls back to greedy if search explodes.
  const nodes = [...A];
  const res: Array<Set<string>> = [];
  let explored = 0;

  const addIfMaximal = (S: Set<string>) => {
    // drop if subset of existing
    for (const T of res) {
      let subset = true;
      for (const x of S) if (!T.has(x)) { subset = false; break; }
      if (subset) return;
    }
    // remove any existing that are subset of S
    for (let i = res.length - 1; i >= 0; i--) {
      const T = res[i];
      let subset = true;
      for (const x of T) if (!S.has(x)) { subset = false; break; }
      if (subset) res.splice(i, 1);
    }
    res.push(new Set(S));
  };

  const dfs = (idx: number, S: Set<string>) => {
    if (explored++ > maxExplore) return; // guard
    if (idx >= nodes.length) {
      if (isAdmissible(A, R, S)) addIfMaximal(S);
      return;
    }
    const a = nodes[idx];

    // Option 1: include a (only if still (potentially) admissible)
    if (conflictFree(new Set([...S, a]), R)) {
      // Light local check: a must be defensible against current attackers
      const S1 = new Set([...S, a]);
      if (defends(S1, a, R)) dfs(idx + 1, S1);
    }
    // Option 2: skip a
    dfs(idx + 1, S);
  };

  dfs(0, new Set());

  if (res.length || nodes.length <= 18) return res;

  // Fallback greedy (multi-start) to approximate preferred sets
  const tries = Math.min(20, nodes.length);
  for (let t = 0; t < tries; t++) {
    const order = [...nodes].sort(() => Math.random() - 0.5);
    const S = new Set<string>();
    for (const a of order) {
      const S1 = new Set([...S, a]);
      if (isAdmissible(A, R, S1)) S.add(a);
    }
    addIfMaximal(S);
  }
  return res;
}

/** Labeling from one extension: IN = E; OUT = attacked by E; UNDEC = rest. */
export function labelingFromExtension(A: string[], R: Array<[string, string]>, E: Set<string>) {
  const IN = new Set(E);
  const OUT = new Set<string>();
  for (const [x, y] of R) if (IN.has(x)) OUT.add(y);
  const UNDEC = new Set<string>();
  for (const a of A) if (!IN.has(a) && !OUT.has(a)) UNDEC.add(a);
  return { IN, OUT, UNDEC };
}
