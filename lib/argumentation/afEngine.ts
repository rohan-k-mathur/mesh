// lib/argumentation/afEngine.ts
//
// @deprecated Import the AF engine from `@/lib/argumentation` (the consolidated
// engine of record) rather than this module directly. This file remains the
// edge-list (`Array<[string, string]>`) adapter surface and is re-exported by
// `lib/argumentation/index.ts`. As of Phase 1, `grounded` and `preferred` here
// delegate to the exact labelling core (`./labelling`, `./semantics`); the
// previous unsound random-restart fallback for large frameworks is gone.
import { toDefeatGraphFromEdgeList, groundedExtension as groundedExtensionCore } from "@/lib/argumentation/labelling";
import { preferredExtensions as preferredExtensionsCore } from "@/lib/argumentation/semantics";

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

/** Grounded extension via least fixpoint of characteristic function.
 *
 * Delegates to the exact labelling core (`./labelling`) so the whole engine
 * shares one grounded implementation (Phase 1, commitment C1).
 */
export function grounded(A: string[], R: Array<[string, string]>): Set<string> {
  return groundedExtensionCore(toDefeatGraphFromEdgeList(A, R));
}

/** Check admissibility: conflict-free and defends all its members. */
export function isAdmissible(A: string[], R: Array<[string, string]>, S: Set<string>): boolean {
  if (!conflictFree(S, R)) return false;
  for (const a of S) if (!defends(S, a, R)) return false;
  return true;
}

/** Preferred extensions: maximal (w.r.t inclusion) admissible sets.
 *
 * Delegates to the exact labelling-based core (`./semantics`). The previous
 * random multi-start greedy fallback for large frameworks has been removed —
 * the core is exact for all sizes (Phase 1, commitment C2).
 *
 * `maxExplore` is retained for backward signature compatibility and ignored.
 */
export function preferred(A: string[], R: Array<[string, string]>, _maxExplore = 20000): Array<Set<string>> {
  const dg = toDefeatGraphFromEdgeList(A, R);
  return preferredExtensionsCore(dg);
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
