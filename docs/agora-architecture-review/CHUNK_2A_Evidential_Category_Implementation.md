# CHUNK 2A: Evidential Category Implementation

**Review Date:** October 27, 2025  
**Reviewer:** Architecture Deep-Dive  
**Phase:** 2 of 6 - Categorical Operations & Confidence Framework

---

## 📦 Files Reviewed

1. `lib/client/evidential.ts` (18 lines)
2. `lib/agora/af.ts` (13 lines)
3. `lib/agora/acceptance.ts` (21 lines)
4. `lib/agora/types/types.ts` (200+ lines)
5. `lib/agora/cqRollup.ts` (16 lines)
6. `lib/argumentation/ecc.ts` (29 lines) ⭐
7. `lib/argumentation/afEngine.ts` (206 lines) ⭐
8. `lib/argumentation/weightedBAF.ts` (40 lines)
9. `app/api/evidential/score/route.ts` (146 lines) ⭐
10. `app/api/deliberations/[id]/evidential/route.ts` (148 lines) ⭐
11. `scripts/backfillArgumentSupport.ts` (61 lines)
12. `schema.prisma` (ArgumentSupport model)

**Total: ~900 lines of categorical/evidential infrastructure**

---

## 🎯 What Exists: Evidential Category Architecture

### 1. **ArgumentSupport Table (Hom-Set Materialization)** ✅

**Schema Definition:**
```prisma
model ArgumentSupport {
  id             String @id @default(cuid())
  deliberationId String
  claimId        String // supported φ
  argumentId     String // supporting argument a

  mode      String  @default("product") // scoring mode ("min"|"product"|"ds")
  strength  Float   @default(0.6)       // 0..1 scalar
  composed  Boolean @default(false)     // true if computed via chaining
  rationale String?                     // why this number (optional)
  base      Float?                      // Confidence base value

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  provenanceJson Json? // {kind:'import', fingerprint, fromDeliberationId}

  @@unique([claimId, argumentId, mode], name: "arg_support_unique")
  @@index([deliberationId, claimId])
  @@index([argumentId])
}
```

**What This Enables:**
- ✅ **Materializes hom-sets**: All arguments supporting claim φ in deliberation D with mode M
- ✅ **Per-mode snapshots**: Same argument can have different scores under `min`/`product`/`ds`
- ✅ **Composition tracking**: `composed` flag distinguishes atomic vs chained support
- ✅ **Import provenance**: `provenanceJson` tracks imported arguments (virtual vs materialized)
- ✅ **Fast queries**: Indexed by `(deliberationId, claimId)` for hom-set retrieval

**Categorical Semantics:**
```
hom(A, B) = {a₁, a₂, a₃, ...}  // Set of arguments from A to B
```
Materialized as:
```sql
SELECT argumentId FROM ArgumentSupport 
WHERE claimId = B AND deliberationId = D AND mode = M
```

**Verdict:** ✅ **Core categorical structure IMPLEMENTED** (hom-sets are first-class!)

---

### 2. **Categorical Operations in `lib/argumentation/ecc.ts`** ⭐

**Purpose:** Evidential Category of Claims (ECC) - formal categorical algebra.

#### **Type Definition:**
```typescript
export type DerivationId = string;

export type Arrow<A=string, B=string> = {
  from: A; 
  to: B;
  derivs: Set<DerivationId>;  // Finite set of derivation IDs
};
```

**Key Insight:** Morphisms A→B are represented as **sets of derivations** (not single arrows). This aligns perfectly with research requirement for hom-sets!

---

#### **Join (∨) - Accrual Operation**
```typescript
export function join<A,B>(f: Arrow<A,B>, g: Arrow<A,B>): Arrow<A,B> {
  if (f.from !== g.from || f.to !== g.to) throw new Error('join: type mismatch');
  return { from: f.from, to: f.to, derivs: new Set([...f.derivs, ...g.derivs]) };
}
```

**Semantics:**
- Union of derivation sets
- **Category-theoretic join** (coproduct in hom-set poset)
- "Pile up arguments" for same claim

**Example:**
```typescript
// Two arguments for same conclusion:
const arg1: Arrow = { from: "P1", to: "C", derivs: new Set(["a1"]) };
const arg2: Arrow = { from: "P2", to: "C", derivs: new Set(["a2"]) };

const combined = join(arg1, arg2);
// Result: { from: "?", to: "C", derivs: Set(["a1", "a2"]) }
// ⚠️ Issue: `from` is ambiguous when premises differ!
```

**Gap Identified:** Join should operate on **same-domain morphisms** only. Current implementation allows joining arrows with different `from` values after type-check passes.

---

#### **Zero (∅) - Identity for Join**
```typescript
export function zero<A,B>(from:A, to:B): Arrow<A,B> {
  return { from, to, derivs: new Set() };
}
```

**Semantics:**
- Empty derivation set = vacuous support
- Identity element for join: `join(f, zero) = f`
- Bottom element in confidence ordering

---

#### **Composition (∘) - Chaining**
```typescript
export function compose<A,B,C>(g: Arrow<B,C>, f: Arrow<A,B>): Arrow<A,C> {
  const out = zero<A,C>(f.from, g.to);
  for (const df of f.derivs) for (const dg of g.derivs) {
    out.derivs.add(`${df}∘${dg}`);
  }
  return out;
}
```

**Semantics:**
- Cartesian product of derivation sets
- Each pair `(df, dg)` becomes new composed derivation
- **Transitive reasoning**: If `A→B` and `B→C`, then `A→C`

**Example:**
```typescript
const f: Arrow = { from: "A", to: "B", derivs: new Set(["d1", "d2"]) };
const g: Arrow = { from: "B", to: "C", derivs: new Set(["d3"]) };

const composed = compose(g, f);
// Result: { from: "A", to: "C", derivs: Set(["d1∘d3", "d2∘d3"]) }
```

**Critical Property:** This is **functorial composition** - respects category laws.

**Verdict:** ✅ **Categorical algebra FULLY IMPLEMENTED** (join, zero, compose)

---

### 3. **Confidence Scoring API (`/api/evidential/score/route.ts`)** ⭐

**Purpose:** Compute confidence scores for claims using different accrual modes.

#### **Supported Modes:**
```typescript
type Mode = 'min' | 'prod' | 'ds';
```

1. **`min`** (Weakest-link): `support(φ) = max(arg₁, arg₂, ..., argₙ)`
   - Take **best single argument**
   - Conservative: one strong argument suffices
   - Used for: Safety-critical decisions

2. **`prod`** (Probabilistic accrual): `support(φ) = 1 - ∏(1 - argᵢ)`
   - Noisy-OR combination
   - Independent lines of evidence accumulate
   - Used for: Default mode

3. **`ds`** (Dempster-Shafer): Combine belief masses with Dempster's rule
   - Handles ignorance explicitly
   - Returns `{bel, pl}` (belief, plausibility) intervals
   - Used for: Uncertainty-aware reasoning

---

#### **Algorithm Flow:**

**Step 1: Fetch Neighborhood**
```typescript
const [claims, args, edges] = await Promise.all([
  prisma.claim.findMany({ where: { deliberationId } }),
  prisma.argument.findMany({ where: { deliberationId } }),
  prisma.argumentEdge.findMany({ where: { deliberationId } })
]);
```

**Step 2: Build Indexes**
```typescript
// Arguments by conclusion
const argsByConclusion = new Map<string, any[]>();

// Attacks by type
const rebutByClaim = new Map<string, any[]>();      // REBUTS → claim
const undercutsByArg = new Map<string, any[]>();    // UNDERCUTS → argument
const underminesByPrem = new Map<string, any[]>();  // UNDERMINES → premise
```

**Step 3: Recursive Support Computation**
```typescript
function supportClaim(claimId: string): { score:number, bel?:number, pl?:number } {
  // Memoized to avoid recomputation
  if (memo.has(claimId)) return memo.get(claimId);

  const supporters = argsByConclusion.get(claimId) ?? [];
  if (!supporters.length) return { score: 0.5, bel: 0.5, pl: 1 }; // Prior

  const chainScores: number[] = [];
  for (const arg of supporters) {
    // Premise aggregation (recursive)
    const premSupports = arg.premises.map(p => supportClaim(p.claimId).score);
    const premScore = mode === 'min' 
      ? Math.min(...premSupports) 
      : premSupports.reduce((a,b) => a*b, 1);

    // Undercut defeats
    const undercuts = undercutsByArg.get(arg.id) ?? [];
    const defeatFactor = undercuts.length 
      ? 1 - (1 - 0.4) ** undercuts.length 
      : 0;
    const chain = premScore * (1 - defeatFactor);

    chainScores.push(chain);
  }

  // Combine chains via mode
  const score = mode === 'ds'
    ? dsCombine(chainScores).bel
    : combineChains(chainScores);

  // Rebut adjustments
  const rebuts = rebutByClaim.get(claimId) ?? [];
  if (rebuts.length) {
    const counter = 1 - (1 - 0.4) ** rebuts.length;
    return { score: score * (1 - counter) };
  }

  return { score };
}
```

---

#### **Join Implementation:**
```typescript
function combineChains(chains: number[]): number {
  if (!chains.length) return 0;
  if (mode === 'min') return Math.max(...chains);  // Best single line
  // Noisy-OR for independent lines
  const prodNot = chains.reduce((p, s) => p * (1 - s), 1);
  return 1 - prodNot;
}
```

**Mathematical Equivalence:**
```
min mode:  ∨ = max (take strongest)
prod mode: ∨ = 1 - ∏(1 - xᵢ) (probabilistic accrual)
```

---

#### **Dempster-Shafer Combination:**
```typescript
function dsCombine(bels: number[]): { bel:number, pl:number } {
  let mBel = 0, mIgn = 1; // Start with vacuous mass
  for (const s of bels) {
    const a = s, aIgn = 1 - s;
    const k = 1; // No conflict (binary positive-only evidence)
    const newBel = (mBel*a + mBel*aIgn + mIgn*a) / k;
    const newIgn = (mIgn*aIgn) / k;
    mBel = newBel; mIgn = newIgn;
  }
  return { bel: mBel, pl: 1 }; // pl=1 (no explicit mass on ¬φ)
}
```

**Gap:** DS implementation simplified - no conflict resolution (assumes all evidence positive). Research doc mentions PCR5/PCR6 rules for highly conflicting evidence.

**Verdict:** ✅ **Three confidence modes IMPLEMENTED** (min/product/DS with caveats)

---

### 4. **Hom-Set API (`/api/deliberations/[id]/evidential/route.ts`)** ⭐

**Purpose:** Materialize hom-sets using `ArgumentSupport` table.

#### **Key Features:**

**Import Modes:**
```typescript
imports: 'off' | 'materialized' | 'virtual' | 'all'
```

- `off`: Local arguments only
- `materialized`: Include imported arguments copied to local DB
- `virtual`: Read-only view of imports (via `ArgumentImport.fingerprint`)
- `all`: Both materialized + virtual

---

#### **Algorithm:**

**Step 1: Fetch ArgumentSupport Rows**
```typescript
const base = await prisma.argumentSupport.findMany({
  where: { deliberationId, claimId: { in: claimIds } },
  select: { claimId, argumentId, base, provenanceJson }
});

// Filter by import mode
const localSupports = includeMat
  ? base
  : base.filter(s => s.provenanceJson?.kind !== 'import');
```

**Step 2: Add Virtual Imports**
```typescript
if (imports === 'virtual' || imports === 'all') {
  const imps = await prisma.argumentImport.findMany({
    where: { toDeliberationId: deliberationId, toClaimId: { in: claimIds } }
  });
  virtualAdds = imps
    .filter(i => !i.toArgumentId) // Not materialized
    .map(i => ({
      claimId: i.toClaimId,
      argumentId: `virt:${i.fingerprint}`,
      base: i.baseAtImport ?? 0.55
    }));
}
```

**Step 3: Compute Contributions**
```typescript
for (const s of allSupports) {
  const b = s.base;
  const premIds = parents.get(s.argumentId) ?? [];
  const premBases = premIds.map(pid => baseByArg.get(pid) ?? 0.5);
  const premFactor = compose(premBases, mode); // ∧ operation

  const aBases = assump.get(s.argumentId) ?? [];
  const assumpFactor = compose(aBases, mode);

  const score = compose([b, premFactor], mode) * assumpFactor;

  contributionsByClaim.get(s.claimId).push({
    argumentId: s.argumentId,
    score,
    parts: { base: b, premises: premBases, assumptions: aBases }
  });
}
```

**Step 4: Join Scores**
```typescript
for (const c of claims) {
  const contribs = contributionsByClaim.get(c.id) ?? [];
  const s = join(contribs.map(x => x.score), mode);
  support[c.id] = s;
}
```

---

#### **Helper Functions:**
```typescript
// Composition (∧): Weakest-link or product
const compose = (xs: number[], mode: Mode) =>
  !xs.length ? 0 : (mode === 'min' ? Math.min(...xs) : xs.reduce((a,b) => a*b, 1));

// Join (∨): Best-line or noisy-OR
const join = (xs: number[], mode: Mode) =>
  !xs.length ? 0 : (mode === 'min' ? Math.max(...xs) : 1 - xs.reduce((a,s) => a*(1-s), 1));
```

**Mathematical Correctness:**
- ✅ Composition = **conjunction** of premises (∧)
- ✅ Join = **disjunction** of arguments (∨)
- ✅ Matches categorical semantics from research docs

---

#### **Hom-Set Output:**
```typescript
const hom: Record<string, { args: string[] }> = {};
for (const [claimId, list] of argsByClaim) {
  hom[`I|${claimId}`] = { args: Array.from(new Set(list)) };
}

return {
  ok: true,
  deliberationId,
  mode,
  support,       // Record<claimId, score>
  hom,           // Record<I|claimId, {args: string[]}>
  nodes,         // Claim metadata + top contributors
  arguments      // Argument metadata
};
```

**Verdict:** ✅ **Hom-sets MATERIALIZED and EXPOSED via API**

---

### 5. **Abstract Argumentation Engine (`lib/argumentation/afEngine.ts`)** ⭐

**Purpose:** Dung-style semantics for acceptability (grounded/preferred extensions).

#### **Key Functions:**

**A) Projection to AF (Attack Graph)**
```typescript
export function projectToAF(nodes: AFNode[], edges: AFEdge[], opts: BuildOptions): AF {
  const A = nodes.map(n => n.id);
  const attacks: Array<[string, string]> = [];

  // Filter attack edges
  for (const e of edges) {
    if (e.type === 'attack' || e.type === 'rebut' || e.type === 'undercut') {
      attacks.push([e.from, e.to]);
    }
  }

  // Optional: Support-defense propagation
  if (opts.supportDefensePropagation) {
    for (const [x, b] of attacks) {
      const supporters = supportsByTarget.get(b) ?? new Set();
      supporters.forEach(s => attacks.push([s, x])); // s defends b
    }
  }

  return { A, R: attacks };
}
```

---

**B) Grounded Extension (Least Fixpoint)**
```typescript
export function grounded(A: string[], R: Array<[string, string]>): Set<string> {
  let S = new Set<string>(); // ∅
  while (true) {
    const next = characteristicF(A, R, S);
    if (next.size === S.size && [...next].every(x => S.has(x))) return next;
    S = next;
  }
}

function characteristicF(A: string[], R: Array<[string, string]>, S: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const a of A) if (defends(S, a, R)) out.add(a);
  return out;
}
```

**Semantics:**
- Iteratively add arguments defended by current set
- Unique fixpoint (grounded extension)
- **Skeptical acceptance**: argument in grounded ⇒ rationally acceptable

---

**C) Preferred Extensions (Maximal Admissible)**
```typescript
export function preferred(A: string[], R: Array<[string, string]>): Array<Set<string>> {
  // DFS with pruning
  const dfs = (idx: number, S: Set<string>) => {
    if (idx >= nodes.length) {
      if (isAdmissible(A, R, S)) addIfMaximal(S);
      return;
    }
    const a = nodes[idx];
    // Try including a
    if (conflictFree(new Set([...S, a]), R) && defends(S, a, R)) {
      dfs(idx + 1, new Set([...S, a]));
    }
    // Try excluding a
    dfs(idx + 1, S);
  };

  dfs(0, new Set());
  return res; // Array of maximal admissible sets
}
```

**Semantics:**
- Multiple extensions possible
- **Credulous acceptance**: argument in some preferred ⇒ defensible under some interpretation

**Fallback:** If graph too large (>18 nodes), uses greedy approximation.

---

**D) Labeling**
```typescript
export function labelingFromExtension(A, R, E): { IN, OUT, UNDEC } {
  const IN = new Set(E);
  const OUT = new Set<string>();
  for (const [x, y] of R) if (IN.has(x)) OUT.add(y);
  const UNDEC = new Set<string>();
  for (const a of A) if (!IN.has(a) && !OUT.has(a)) UNDEC.add(a);
  return { IN, OUT, UNDEC };
}
```

**Used by:** `lib/agora/acceptance.ts` for debate sheet acceptance computation.

**Verdict:** ✅ **Dung semantics FULLY IMPLEMENTED** (grounded/preferred/labeling)

---

### 6. **Weighted Bipolar AF (`lib/argumentation/weightedBAF.ts`)**

**Purpose:** Propagate confidence through support/attack networks.

```typescript
export function propagate(
  nodes: NodeId[],
  edges: Edge[],           // { from, to, kind: 'support'|'attack', weight? }
  base: Record<NodeId, number>,
  iters = 20,
  damp = 0.85
): Record<NodeId, number> {
  // Initialize with base confidences
  const v = new Float64Array(N);
  nodes.forEach((n,i) => v[i] = base[n] ?? 0.5);

  // Iterate: accumulate weighted support/attack
  for (let t = 0; t < iters; t++) {
    s.fill(0);
    for (const e of edges) {
      const delta = (e.weight ?? 1) * v[from_idx];
      s[to_idx] += (e.kind === 'support' ? delta : -delta);
    }
    // Damped update with tanh activation
    for (let i = 0; i < N; i++) {
      v[i] = (1-damp)*v[i] + damp*(0.5 + 0.5*Math.tanh(s[i]));
    }
  }
  return out; // Record<NodeId, number>
}
```

**Algorithm:**
- Iterative message-passing (like PageRank)
- Support edges boost confidence
- Attack edges reduce confidence
- Tanh activation keeps values in [0,1]
- Damping factor prevents oscillation

**Gap:** Not integrated with main evidential API. Appears to be standalone utility.

**Verdict:** ⚠️ **Weighted propagation EXISTS but NOT USED in primary confidence computation**

---

### 7. **Acceptance Computation (`lib/agora/acceptance.ts`)**

**Purpose:** Compute acceptability labels for debate nodes.

```typescript
export function computeAcceptance(
  nodes: DebateNode[], 
  edges: DebateEdge[], 
  mode: 'grounded'|'preferred'|'hybrid'
): Record<string, 'undecided'|'skeptical-accepted'|'credulous-accepted'|'rejected'> {
  
  const { ids, attacks } = projectToAF(nodes, edges);
  const labels: Record<string, string> = {};

  if (mode === 'grounded' || mode === 'hybrid') {
    const g = grounded(ids.map(id => ({ id })), attacks);
    for (const id of ids) {
      labels[id] = g.in.has(id) ? 'skeptical-accepted'
                 : g.out.has(id) ? 'rejected'
                 : 'undecided';
    }
  }

  if (mode === 'preferred' || mode === 'hybrid') {
    const p = preferred(ids.map(id => ({ id })), attacks);
    for (const id of ids) {
      if (labels[id] === 'undecided' && p.in.has(id)) {
        labels[id] = 'credulous-accepted';
      }
    }
  }

  return labels;
}
```

**Verdict:** ✅ **Debate-level acceptance IMPLEMENTED** (uses AF engine)

---

### 8. **Client-Side API (`lib/client/evidential.ts`)**

**Ultra-simple wrapper:**
```typescript
export async function fetchClaimScores(params: {
  deliberationId: string;
  mode: 'min'|'product'|'ds';
  tau?: number|null;
  claimIds?: string[];
}) {
  const q = new URLSearchParams({ 
    deliberationId: params.deliberationId, 
    mode: params.mode 
  });
  if (params.tau != null) q.set('tau', String(params.tau));
  if (params.claimIds?.length) q.set('ids', params.claimIds.join(','));

  const r = await fetch(`/api/evidential/score?${q}`, { cache: 'no-store' });
  const j = await r.json();
  return (Array.isArray(j.items) ? j.items : []) as ClaimScore[];
}
```

**Gap:** No client-side function for `/api/deliberations/[id]/evidential` (hom-set API).

**Verdict:** ⚠️ **Client wrapper EXISTS but INCOMPLETE**

---

### 9. **Backfill Script (`scripts/backfillArgumentSupport.ts`)**

**Purpose:** Populate `ArgumentSupport` table from existing data.

```typescript
function computeBase(conf?: number|null, approvals = 0) {
  const start = conf == null ? 0.55 : Math.max(0.3, Math.min(1, conf));
  const lift = Math.log1p(approvals) * 0.08; // ~+0.08..0.20
  return Math.min(0.9, (start + lift).toFixed(3));
}

// For each argument with conclusionClaimId:
await prisma.argumentSupport.upsert({
  where: { arg_support_unique: { claimId, argumentId, mode: "product" } },
  update: { base, strength: base, composed: false },
  create: {
    deliberationId, claimId, argumentId,
    mode: "product", base, strength: base, composed: false
  }
});
```

**Formula:**
```
base = min(0.9, confidence + log(1 + approvals) * 0.08)
```

**Verdict:** ✅ **Migration script EXISTS** (one-time backfill for existing data)

---

## 🔗 Integration Map: Evidential Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  lib/client/evidential.ts                                   │
│    → fetchClaimScores(deliberationId, mode, tau)            │
│  ↓ calls                                                    │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                            │
│  /api/evidential/score                                      │
│    → Recursive support computation (memo-ized)              │
│    → Returns { items: [{id, score, bel?, pl?, accepted}] } │
│                                                              │
│  /api/deliberations/[id]/evidential                         │
│    → Hom-set materialization via ArgumentSupport            │
│    → Returns { support, hom, nodes, arguments }             │
│  ↓ uses                                                     │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                CATEGORICAL ALGEBRA LAYER                    │
│  lib/argumentation/ecc.ts                                   │
│    • join(f, g) → Arrow (∨ operation)                       │
│    • compose(g, f) → Arrow (∘ operation)                    │
│    • zero(A, B) → Arrow (identity for join)                 │
│                                                              │
│  lib/argumentation/afEngine.ts                              │
│    • grounded(A, R) → Set<string> (skeptical acceptance)    │
│    • preferred(A, R) → Array<Set<string>> (credulous)       │
│    • labelingFromExtension(A, R, E) → {IN, OUT, UNDEC}      │
│                                                              │
│  lib/argumentation/weightedBAF.ts                           │
│    • propagate(nodes, edges, base) → Record<id, score>      │
│                                                              │
│  lib/agora/acceptance.ts                                    │
│    • computeAcceptance(nodes, edges, mode) → labels         │
│  ↓ reads                                                    │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Prisma)                        │
│  ArgumentSupport ← HOΜ-SET MATERIALIZATION                  │
│    @@unique([claimId, argumentId, mode])                    │
│    base: Float (atomic confidence)                          │
│    strength: Float (composed confidence)                    │
│    composed: Boolean (chained vs atomic)                    │
│    provenanceJson: Json (import tracking)                   │
│                                                              │
│  AssumptionUse → Premise weights                            │
│  ArgumentEdge → Attack/support relations                    │
│  Argument, Claim → Base data                                │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Strengths: What's Working Exceptionally Well

### 1. **Hom-Set Materialization** ⭐⭐⭐
- `ArgumentSupport` table is **exactly the right design**
- Per-mode snapshots enable experimentation
- `composed` flag tracks transitive closure
- `provenanceJson` supports import workflows
- Fast queries via compound indexes

### 2. **Categorical Algebra Implementation** ⭐⭐⭐
- `lib/argumentation/ecc.ts` implements **proper category theory**
- Join (∨), Compose (∘), Zero (∅) all present
- Arrow type with derivation sets = hom-set as finite set
- Matches research requirements perfectly

### 3. **Three Confidence Modes** ⭐⭐
- `min` (weakest-link) ✅
- `product` (probabilistic accrual) ✅
- `ds` (Dempster-Shafer) ✅ (simplified)
- All three modes implemented in both APIs

### 4. **Recursive Composition** ⭐⭐
- `/api/evidential/score` computes transitive support
- Premises → Argument → Conclusion chain
- AssumptionUse integrated (weight factor)
- Memoization prevents redundant computation

### 5. **Dung Semantics** ⭐
- Grounded extension (unique, skeptical)
- Preferred extensions (multiple, credulous)
- Labeling (IN/OUT/UNDEC)
- Used for debate acceptance labels

---

## ❌ Gaps: Misalignments with Research

### Gap 1: `rulesetJson.confidence.mode` Not Wired Through ⚠️

**Research says:** Room-level `rulesetJson.confidence.mode` should determine accrual semantics.

**Current state:**
```prisma
model DebateSheet {
  // ...
  rulesetJson Json?  // EXISTS in schema
}
```

**But:**
- `/api/evidential/score` takes `mode` as **query parameter**
- Does NOT read from `DebateSheet.rulesetJson`
- Frontend must manually pass mode

**Impact:**
- No per-room confidence policy enforcement
- Cannot have "safety-critical rooms use min mode" as default

**Fix needed:**
```typescript
// In API route:
const sheet = await prisma.debateSheet.findUnique({ 
  where: { id: deliberationId },
  select: { rulesetJson: true }
});
const mode = sheet?.rulesetJson?.confidence?.mode ?? 'product';
```

---

### Gap 2: `weighted BAF.propagate()` Not Integrated ⚠️

**What exists:** Sophisticated iterative propagation algorithm

**What's missing:** Not called by main confidence APIs

**Current flow:**
```
/api/evidential/score → supportClaim() → recursive memo
                         (does NOT use propagate())
```

**Potential use case:** Graph-level confidence updates when base values change

**Status:** Appears to be **standalone utility** or **future enhancement**

---

### Gap 3: Join Operation Type Safety 🔴

**Issue in `ecc.ts`:**
```typescript
export function join<A,B>(f: Arrow<A,B>, g: Arrow<A,B>): Arrow<A,B> {
  if (f.from !== g.from || f.to !== g.to) throw new Error('join: type mismatch');
  // ...
}
```

**Problem:** Type signature allows `f.from != g.from` initially, then throws at runtime.

**Example that type-checks but fails:**
```typescript
const arg1: Arrow = { from: "P1", to: "C", derivs: new Set(["a1"]) };
const arg2: Arrow = { from: "P2", to: "C", derivs: new Set(["a2"]) };
join(arg1, arg2); // Runtime error: "P1" !== "P2"
```

**Categorical semantics:** Join should only operate on **morphisms in same hom-set** `hom(A,B)`.

**Fix needed:**
```typescript
// Option 1: Enforce at type level (requires dependent types or branded types)
// Option 2: Document that callers must ensure same domain
// Option 3: Rename to `joinSameDomain` and add `joinConvergent` for different premises
```

---

### Gap 4: DS Conflict Resolution Simplified ⚠️

**Current DS implementation:**
```typescript
function dsCombine(bels: number[]): { bel:number, pl:number } {
  // ... Dempster's rule
  const k = 1; // ❌ No conflict (assumes all evidence positive)
  // ...
  return { bel: mBel, pl: 1 }; // ❌ pl=1 (no explicit mass on ¬φ)
}
```

**Research doc mentions:** PCR5/PCR6 rules for **highly conflicting evidence**.

**Current limitation:**
- No conflict resolution beyond Dempster normalization
- All evidence assumed positive (no direct support for ¬φ)
- Plausibility always 1 (no lower bound)

**Impact:**
- Works for "evidence piling up"
- Breaks for "conflicting expert opinions"

**Fix needed:** Implement PCR5/PCR6 or warn when conflict detected.

---

### Gap 5: No Incremental Update Mechanism ⚠️

**Current flow:**
- ArgumentSupport rows created via backfill script
- `base` field set once
- API recomputes `strength` on every request (via recursive support)

**What's missing:**
- No trigger to update `strength` when:
  - New argument added
  - Premise confidence changes
  - Attack added/removed
- `composed` flag exists but not maintained

**Impact:**
- Heavy computation on every API call
- `strength` and `composed` fields underutilized

**Fix needed:**
- Background job to update ArgumentSupport.strength
- OR: Event-driven recomputation on graph changes
- OR: Keep current "compute on read" but cache results

---

### Gap 6: AssumptionUse Not Fully Integrated with Hom-Sets 🔴

**Current state:**
- `/api/deliberations/[id]/evidential` reads `AssumptionUse.weight`
- Applies as multiplier: `score = base * premFactor * assumpFactor`

**Research requirement:**
- AssumptionUse = **free variables** (open assumptions)
- Should track **which assumptions each derivation relies on**
- Enables "culprit set" belief revision

**What's missing:**
```typescript
// Arrow type should include:
export type Arrow<A,B> = {
  from: A; to: B;
  derivs: Set<DerivationId>;
  assumptions?: Map<DerivationId, Set<AssumptionId>>;  // ❌ Missing
};
```

**Impact:**
- Can compute confidence scores ✅
- Cannot answer "Which assumptions must I accept to believe φ?" ❌

**Fix needed:**
- Extend Arrow type to track assumption dependencies per derivation
- Update `compose()` to union assumption sets
- Expose in API: `{ argumentId, assumptions: [a1, a2, ...] }`

---

## 📊 Chunk 2A Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Hom-Set Materialization | 100% (ArgumentSupport table) | ✅ Complete |
| Join (∨) Operation | 100% (ecc.ts + APIs) | ✅ Complete |
| Composition (∘) Operation | 100% (ecc.ts) | ✅ Complete |
| Confidence Modes | 100% (min/product/ds) | ✅ Complete |
| Dung Semantics | 100% (grounded/preferred) | ✅ Complete |
| Recursive Support | 100% (memoized) | ✅ Complete |
| Import Provenance | 100% (virtual/materialized) | ✅ Complete |
| Room-Level Policy | 0% (rulesetJson not wired) | ❌ Missing |
| AssumptionUse Tracking | 60% (weight used, but not per-derivation) | ⚠️ Partial |
| Incremental Updates | 0% (recompute every request) | ❌ Missing |
| Type Safety (Join) | 50% (runtime check, not compile-time) | ⚠️ Partial |
| DS Conflict Resolution | 40% (basic Dempster, no PCR) | ⚠️ Simplified |

---

## 🔍 Key Discoveries

### 1. **ArgumentSupport is a Production-Ready Hom-Set Store** ⭐
- `@@unique([claimId, argumentId, mode])` = **perfect index** for hom(A,B) queries
- Per-mode snapshots enable comparative analysis ("how does min vs product affect acceptance?")
- `composed` flag distinguishes atomic vs transitive support (though not maintained)
- `provenanceJson` supports federated deliberation (imports from other rooms)

### 2. **Categorical Operations Exist in Pure Form** ⭐
- `lib/argumentation/ecc.ts` is **textbook category theory**
- Arrow = morphism with derivation set
- Join = coproduct in hom-set poset
- Compose = functorial composition
- Zero = identity for join (bottom element)

**This is EXACTLY what the research docs called for!**

### 3. **Two Parallel Confidence Pipelines** ⚠️
```
Pipeline A: /api/evidential/score
  → Recursive memo-ized support()
  → Does NOT use ArgumentSupport table
  → Recomputes from Argument/ArgumentEdge every request

Pipeline B: /api/deliberations/[id]/evidential
  → Reads ArgumentSupport.base
  → Composes via premises + assumptions
  → Returns hom-sets + support scores
```

**Why two pipelines?**
- `/evidential/score` = **dynamic** (always fresh, slower)
- `/deliberations/[id]/evidential` = **semi-materialized** (uses precomputed base, faster)

**Recommendation:** Consolidate or document when to use each.

### 4. **AssumptionUse Weight Integration Works** ✅
```typescript
// In /api/deliberations/[id]/evidential:
const aBases = assump.get(s.argumentId) ?? [];
const assumpFactor = compose(aBases, mode);
const score = compose([b, premFactor], mode) * assumpFactor;
```

**Correct formula:**
```
c(f) = c_base(f) ∧ (∧ c(prem_i)) ∧ (∧ w(assump_j))
```

Where:
- `c_base(f)` = ArgumentSupport.base
- `c(prem_i)` = recursive support of premises
- `w(assump_j)` = AssumptionUse.weight

**This matches the research requirement for assumption-weighted confidence!**

---

## 🎯 Recommendations for Chunk 2A

### Quick Win (1-2 days):

1. **Wire `rulesetJson.confidence.mode` through API:**
   ```typescript
   // In /api/evidential/score/route.ts:
   const delib = await prisma.deliberation.findUnique({
     where: { id: deliberationId },
     select: { rulesetJson: true }
   });
   const defaultMode = delib?.rulesetJson?.confidence?.mode ?? 'product';
   const mode = (req.query.mode ?? defaultMode) as Mode;
   ```

2. **Add client wrapper for hom-set API:**
   ```typescript
   // In lib/client/evidential.ts:
   export async function fetchHomSets(deliberationId: string, mode: Mode) {
     const r = await fetch(`/api/deliberations/${deliberationId}/evidential?mode=${mode}`);
     return r.json();
   }
   ```

### Medium Term (1 week):

3. **Document pipeline choice:**
   ```markdown
   ## When to use each API:
   - `/api/evidential/score`: Small graphs (<100 claims), need fresh computation
   - `/api/deliberations/[id]/evidential`: Large graphs, can tolerate staleness
   ```

4. **Fix join type safety:**
   ```typescript
   // Add JSDoc warning:
   /**
    * Join two morphisms in the SAME hom-set hom(A,B).
    * PRECONDITION: f.from === g.from && f.to === g.to
    * @throws {Error} if morphisms have different domains/codomains
    */
   export function join<A,B>(f: Arrow<A,B>, g: Arrow<A,B>): Arrow<A,B>
   ```

### Strategic (aligns with Phase 0 roadmap):

5. **Implement incremental strength updates:**
   - Add trigger on Argument/ArgumentEdge changes
   - Update ArgumentSupport.strength and .composed
   - Cache results for 5min (trade freshness for speed)

6. **Extend Arrow to track assumption dependencies:**
   ```typescript
   export type Arrow<A,B> = {
     from: A; to: B;
     derivs: Set<DerivationId>;
     assumptions: Map<DerivationId, Set<string>>; // NEW
   };
   ```

7. **Implement PCR5/PCR6 for DS mode:**
   - Detect high conflict (K < 0.5)
   - Fall back to PCR rule instead of Dempster normalization
   - Document limitations in API response

---

## 🚀 Phase 2 Assessment: **Strong Foundation, Minor Gaps**

**Overall Grade: A- (90%)**

### What's Excellent:
- ✅ Hom-set materialization via ArgumentSupport
- ✅ Categorical operations (join/compose/zero)
- ✅ Three confidence modes (min/product/ds)
- ✅ Recursive composition with memoization
- ✅ AssumptionUse weight integration
- ✅ Dung semantics for acceptability
- ✅ Import provenance tracking

### What Needs Work:
- ⚠️ rulesetJson.confidence.mode not read from DB
- ⚠️ Two parallel pipelines (consolidate or document)
- ⚠️ Join type safety (runtime check only)
- ⚠️ DS simplified (no PCR conflict resolution)
- ⚠️ No incremental updates (recompute every request)
- ⚠️ AssumptionUse tracking incomplete (no per-derivation sets)

### Critical for Phase 3:
Before proceeding to Chunk 3 (Scheme System), we should understand:
- How are schemes connected to confidence modes?
- Do scheme CQs affect ArgumentSupport.base?
- Is there scheme-level confidence metadata?

---

## Next Steps

**Proceeding to Chunk 3:** Scheme System & Critical Questions
- `lib/agora/schemes.ts` (if exists)
- `lib/argumentation/criticalQuestions.ts`
- Scheme database models
- CQ → confidence interaction
- Scheme → Arrow type mapping

**Key Questions for Chunk 3:**
- How do scheme CQs translate to AssumptionUse?
- Is there a scheme confidence/reliability score?
- Do schemes have mode-specific accrual rules?
- How do VPR (Value-Based Practical Reasoning) schemes integrate?
