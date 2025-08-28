// lib/deepdive/selection.ts
import { preferredExtensions, buildAttackGraph, Edge, NodeID } from './af';

export type ApprovalMap = Map<string /*userId*/, Set<NodeID>>;
export type SelectionRule = 'utilitarian' | 'harmonic' | 'maxcov';

const EPS = 0.005; // 0.5% improvement threshold

type Scores = {
  coverageAvg: number;
  coverageMin: number;
  repVector: number[]; // per user
};

function repOf(view: Set<NodeID>, approvals: ApprovalMap, users: string[]): number[] {
  const scores: number[] = [];
  for (const uid of users) {
    const a = approvals.get(uid) ?? new Set<NodeID>();
    if (a.size === 0) { scores.push(0); continue; }
    let count = 0;
    for (const x of a) if (view.has(x)) count++;
    scores.push(count / a.size);
  }
  return scores;
}

function combineMax(a: number[], b: number[]) {
  return a.map((x, i) => Math.max(x, b[i]));
}

function summarize(rep: number[]): Scores {
  const coverageAvg = rep.reduce((s, x) => s + x, 0) / Math.max(1, rep.length);
  const coverageMin = rep.length ? Math.min(...rep) : 0;
  return { coverageAvg, coverageMin, repVector: rep };
}

function harmonicOWA(rep: number[]) {
  // sort ascending and weight with 1/i
  const sorted = [...rep].sort((a, b) => a - b);
  let score = 0;
  for (let i = 0; i < sorted.length; i++) score += sorted[i] / (i + 1);
  return score;
}

/**
 * Unified score function for early-exit comparison.
 * Returns a value in [0,1] (approx), so EPS=0.005 ~= 0.5% improvement.
 */
function score(rep: number[], rule: SelectionRule, nUsers: number): number {
  if (nUsers === 0) return 0;

  if (rule === 'utilitarian') {
    // Average coverage in [0,1]
    return rep.reduce((s, x) => s + x, 0) / nUsers;
  }

  if (rule === 'harmonic') {
    // Normalize harmonic OWA by H_n so result is ~[0,1]
    const Hn = Array.from({ length: nUsers }, (_, i) => 1 / (i + 1)).reduce((a, b) => a + b, 0);
    return Hn > 0 ? harmonicOWA(rep) / Hn : 0;
  }

  // maxcov: proportion fully covered + tiny average coverage tie-breaker
  const full = rep.filter(x => x === 1).length / nUsers;
  const avg  = rep.reduce((s, x) => s + x, 0) / nUsers;
  return full + 1e-6 * avg;
}

export function selectViewpoints(
  nodes: NodeID[],
  edges: Edge[],
  approvals: ApprovalMap,
  opts: { k: number; rule: SelectionRule }
) {
  const users = [...approvals.keys()];
  const attacks = buildAttackGraph(nodes, edges);
  const views = preferredExtensions(nodes, attacks);

  // --- best possible per user (core-rep denominator) ---
  const muFrac: number[] = users.map(uid => {
    const a = approvals.get(uid) ?? new Set<NodeID>();
    const denom = Math.max(1, a.size);
    let best = 0;
    for (const v of views) {
      let c = 0; for (const x of a) if (v.has(x)) c++;
      if (c > best) best = c;
    }
    return best / denom;
  });

  // Greedy selection w.r.t. rule
  let chosen: Set<NodeID>[] = [];
  let currentRep = new Array(users.length).fill(0);
  let currentScore = score(currentRep, opts.rule, users.length); // ✅ base score for early-exit

  const used = new Set<number>();
  for (let t = 0; t < Math.min(opts.k, views.length); t++) {
    let bestIdx = -1;
    let bestScore = -Infinity;

    // pick best next view according to objective
    for (let i = 0; i < views.length; i++) {
      if (used.has(i)) continue;
      const rep = repOf(views[i], approvals, users);
      const combined = combineMax(currentRep, rep);

      if (opts.rule === 'utilitarian') {
        const s = combined.reduce((s, x) => s + x, 0); // sum (not avg) for selection
        if (s > bestScore) { bestScore = s; bestIdx = i; }
      } else if (opts.rule === 'harmonic') {
        const s = harmonicOWA(combined);
        if (s > bestScore) { bestScore = s; bestIdx = i; }
      } else { // maxcov
        const full = combined.filter(x => x === 1).length;
        const s = full + 1e-6 * combined.reduce((s, x) => s + x, 0);
        if (s > bestScore) { bestScore = s; bestIdx = i; }
      }
    }

    if (bestIdx === -1) break;
    // compute gain **in normalized units** for early-exit
    const repBest = repOf(views[bestIdx], approvals, users);
    const combinedBest = combineMax(currentRep, repBest);
    const nextScore = score(combinedBest, opts.rule, users.length);
    const gain = nextScore - currentScore;

    if (gain < EPS) break; // ✅ EARLY EXIT

    // accept
    used.add(bestIdx);
    currentRep = combinedBest;
    currentScore = nextScore;
    chosen.push(views[bestIdx]);
  }

  const summary = summarize(currentRep);

  // --- conflicts: pairs that never co-occur in ANY preferred extension ---
  const co = new Map<string, boolean>(); // key "a|b"
  const nodeSet = new Set(nodes);
  function key(a: NodeID, b: NodeID) { return a < b ? `${a}|${b}` : `${b}|${a}`; }
  // mark all co-occurring pairs
  for (const v of views) {
    const arr = [...v];
    for (let i=0;i<arr.length;i++) for (let j=i+1;j<arr.length;j++) {
      co.set(key(arr[i], arr[j]), true);
    }
  }
  // count user-approved pairs that don't co-occur
  const conflictCounts = new Map<string, number>();
  for (const uid of users) {
    const a = approvals.get(uid) ?? new Set<NodeID>();
    const arr = [...a].filter(x=>nodeSet.has(x));
    for (let i=0;i<arr.length;i++) for (let j=i+1;j<arr.length;j++) {
      const k = key(arr[i], arr[j]);
      if (!co.get(k)) conflictCounts.set(k, (conflictCounts.get(k) ?? 0) + 1);
    }
  }
  const conflictsTopPairs = [...conflictCounts.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 6)
    .map(([k,c]) => {
      const [a,b] = k.split('|'); return { a, b, count: c };
    });

  // Weak JR hint
  const n = users.length;
  let jrSatisfied = false;
  if (opts.rule === 'maxcov' && n > 0) {
    for (const v of chosen) {
      const full = users.filter((uid) => {
        const a = approvals.get(uid) ?? new Set<NodeID>();
        if (a.size === 0) return false;
        for (const x of a) if (!v.has(x)) return false;
        return true;
      }).length;
      if (full >= Math.ceil(n / Math.max(1, opts.k))) { jrSatisfied = true; break; }
    }
  }

  return {
    chosen,
    coverageAvg: summary.coverageAvg,
    coverageMin: summary.coverageMin,
    jrSatisfied,
    repVector: summary.repVector,
    bestPossibleAvg: muFrac.reduce((s,x)=>s+x,0) / Math.max(1, muFrac.length),
    conflictsTopPairs,
  };
}
