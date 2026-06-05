# Session 06 — C013 abstract-proof scoping (Direction 2 / Q-041 O2, ≡ Direction 5 mechanized separation)

**Date:** 2026-06-05
**Direction:** 2 — Separation / locus of disagreement (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §2), branching half; ≡ Direction 5 (mechanization) deliverable
**Status:** **Scoping / dev-spec — OPEN** (no kernel changed). Scopes the abstract proof that would upgrade [C013](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md) from *corroborated* to *minimal*, and stages it as a T006→T007→T008-style attack plan. **Update 2026-06-05:** the attack plan was executed the same day — the proof is drafted as [T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md) (`provisional (pending cross-check)`), discharging all five obligations; the crux **O-parity-b held** (locus-disjoint non-interference, from match-by-equal-address + T005 distinct subaddresses). Awaiting non-author cross-check ([`T009-verification-prompt.md`](../02_THEOREMS_AND_PROOFS/T009-verification-prompt.md)).
**Purpose:** [C013](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md) is filed with five abstract-proof obligations (O-tree / O-parity / O-perline / O-smyth / O-faithful) and corroborated by the branching harness over `allAFs(n)`, `n ≤ 3`. This session **does not prove** any of them. It judges, per obligation, *easy / hard / needs-splitting*; fixes the **proof medium** (pen-and-paper first, Agda as the Direction-5 check) and **object model** (the data the proof inducts over); lists the **missing corroboration** (added this session, green); and records the decisions per folder discipline. The single load-bearing finding is that **O-parity is the crux and should be split**, and that C013 **still looks true** after the pass.

> Reading order: [C013](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md)
> (the conjecture + the five obligations — the spine), [session 05](05-branching-normalization-o2-2026-06-04.md)
> (the scoping + the empirical order choice: Smyth admits a least set on 1344/1344, Hoare
> fails on 663/663 branching), [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
> (the linear base case — Lemma 0 parity and §Faithfulness, the parts O-parity/O-faithful
> lift to trees), [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md) (E0,
> per-line ξ), [T007 §Defect 1 / Repair 1](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md)
> (why raw truncations broke leastness — the trap not to re-fall-into; and the reproducible
> off-thread witness `pos=[P@0,O@0.1,O@0.2,P@0.1.1,P@0.2.1]` → `0.1.1`), and the harness
> [`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts).

---

## 0. The problem in one sentence

C013 conjectures that over daimon-closed concession-**trees**, the Smyth-least separating
set of a branching dispute is the antichain `M(D, E)` of per-line first-divergence loci.
The harness corroborates this over `n ≤ 3`; this session scopes the **abstract proof** —
where the difficulty lives, whether it is provable as stated, and how to stage it.

## 1. Per-obligation scope verdict

The verdicts below are the spine of the attack plan (§4). One-word grades: **easy**
(short structural induction / order fact), **hard** (hides a real lemma), **needs-splitting**.

### O-tree — branching proper test is well-defined — **easy (definitional bookkeeping)**

Show the daimon-closed sub-tree of C013 §Setting is a legitimate Ludics counter-design
(closed under net-closure; `†` only on the test's own turns) and *frontier-complete on
every line* (the per-line [`properTest.isFrontierComplete`](../../packages/ludics-engine/properTest.ts)
lifted to a frontier *set*). This is a structural induction on the dispute tree with no
hidden lemma: below the shared stem the test plays a single act per locus (the lines
coincide there); above each branch point the per-line guard is exactly T008's
`isFrontierComplete` on that line. The only care-point is **simultaneity** — "an act at
every positive turn across *all* open lines at once" — but because distinct lines occupy
`⊑`-incomparable (hence distinct) addresses, the per-line completeness predicates are
independent and conjoin without interaction. *Verdict: easy.* It defines the object the
Smyth order ranges over; it borrows no content from O-parity.

### O-parity — per-branch parity / factorization — **HARD; needs-splitting (the crux)**

C013 states O-parity as one obligation: "normalization of a concession-tree **factors**
through its lines — the multiset of per-line runs — with no cross-line interaction below
the branch point." This conflates an **easy** fact (parity) with the **hard** fact
(non-interference / factorization), and the proof should split them:

- **O-parity-a (parity per line) — easy.** Along each individual line the alternation
  parity is the line's local depth parity. This is verbatim [T008 Lemma 0](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
  applied to one line; nothing new.
- **O-parity-b (non-interference / locus-disjointness) — HARD, the real lemma.** That two
  `⊑`-incomparable loci (on different lines below a shared branch point) **never match**
  in normalization, so the matched-pair multiset partitions by line and the divergence on
  line `ℓ` depends only on the line-`ℓ` projection `(D↾ℓ, T↾ℓ)`.
- **O-parity-c (factorization) — follows from a+b.** `⟨D ∣ T⟩ ≅` the multiset of per-line
  runs `{ ⟨D↾ℓ ∣ T↾ℓ⟩ }`. Licenses the harness's "run per line and aggregate."

**Is the factorization true and provable abstractly?** *Yes — and the proof is the content
of O-parity-b.* The argument: Ludics normalization matches a positive against a **dual at
the same address**; distinct lines occupy `⊑`-incomparable, hence **unequal**, addresses,
so an action on line `ℓ` can only ever match an action on line `ℓ`. With the
**justification / reachability** discipline (an act is played only after its `⊑`-predecessor
on its own line was matched), the interaction descends one line at a time and never carries
information across the branch point. Factorization is then a theorem about *that* normalizer.

**The trap (a genuine T007-style risk).** This factorization is **false of `stepCore`**.
The kernel's `findNextPositive` is least-**index** with **no reachability gate**, so on the
*combined* tree it can select a positive on an un-engaged line whose justifier was never
played in the current thread — the reproducible off-thread mis-divergence
([C012 §Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md);
[T007 §Defect 1](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md): the witness
`pos=[P@0,O@0.1,O@0.2,P@0.1.1,P@0.2.1]` diverges at `0.1.1` with matched `["0","0.2"]`,
**off-thread**). So O-parity-b is *not* "a property of the kernel we read off"; it is a
property of the **abstract normalizer the proof must define with the justification gate**.
The danger is defining that gate so as to *assume* the result. The discipline that avoids it:
the gate must be the standard Ludics justification condition (Girard: an action's address is a
child of an already-played address on the *same* chronicle), **independently motivated**, and
the kernel's *failure* to implement it is then the content of O-faithful — not a thing we are
free to assume away. **This is where a refutation could still hide:** if, on the additive-free
fragment, a shared **negative** branch node turned out to admit cross-line matching (e.g. an
address collision the translation `⟦·⟧` does not actually prevent), factorization would fail
and C013 would be false-as-stated. The translation gives **distinct subaddresses per argument**
(T005), which is exactly the hypothesis that rules this out — see §6 (Q-039) for why
additive-freeness is load-bearing here, not incidental. *Verdict: hard; split into a/b/c;
O-parity-b is the single biggest risk and the place mechanization earns its keep.*

### O-perline — per-line separation = T008 — **easy, conditional on O-parity**

On each refused line the sub-run is a single realized chronicle, so T008(1)/(2) apply
verbatim: the concession at any shallower frontier converges, and the genuine refusal
diverges exactly at `ξ_ℓ(E)`. The proof is a one-line invocation of T008 **once O-parity-c
gives that the line-in-the-tree behaves identically to the line-in-isolation.** It carries
no independent difficulty; its entire risk is upstream in O-parity-b. *Verdict: easy
(reduction to T008), gated on O-parity.*

### O-smyth — Smyth-least = M — **easy (a pure antichain/powerdomain fact)**

**Is "Smyth-least = M" genuinely an antichain fact, or does it need the additive-free
fragment?** *It is a pure antichain fact and needs nothing from the fragment.* Given (i) `M`
is a `⊑`-antichain and (ii) the separating-test family is the subset-refusal family
`{ refuse U : ∅ ≠ U ⊆ M }` with separating set `U`, then: every `u ∈ U` has `u ⊑ u ∈ M`,
so `M ≤_S U` for all `U` (Smyth-least); and `U ≤_S M ⟹ U = M` because the `ξ_ℓ` are
pairwise incomparable (no shallower representative). This is exactly the structural law the
harness encodes (`verifyByEnumeration`) and proves, not searches, for any antichain. **The
additive-free fragment is needed only upstream**, to guarantee that hypotheses (i) and (ii)
hold — (i) because per-line minima are `⊑`-maximal loci (an antichain), (ii) because the
branch points are multiplicative superpositions where the family *is* the independent
subset-refusal family (no additive cancellation collapsing lines). The Smyth fact itself is
order theory. *Verdict: easy; mechanizes as a standalone `lib`-level powerdomain lemma,
reusable like `lib/Order.agda`.*

### O-faithful — tree faithfulness lemma + its failure spec — **medium (a spec, not a hard proof; failure is EXPECTED)**

**Restating the parked-R1 trigger for the tree case, precisely.** T008's R1 spec was: the
kernel verdict diverges from the abstract normalization **iff** the run reaches `ℓ'` where
(a) it is the test's turn by parity, (b) the test carries no act at `ℓ'`, and (c) `ℓ' ≠ ξ(E)`
— a *partiality* (raw-truncation) trigger. The **tree** trigger is different in kind: it is an
**off-thread / unjustified-selection** trigger.

> **R1-tree spec (parked).** `stepCore ∘ ⟦·⟧` diverges from the abstract tree-normalization
> **iff** `findNextPositive` selects a positive at a locus `ℓ'` whose `⊑`-predecessor on its
> own line was **not matched in the current thread** — i.e. `ℓ'` is reachable by global
> least-index order but **unjustified** in the descending line. The faithful (abstract)
> verdict ignores `ℓ'` (the justification gate blocks it) and continues the engaged line; the
> kernel instead breaks `DIVERGENT` at `ℓ'` off-thread (witness: `0.1.1` with matched
> `["0","0.2"]`). The faithful reading is therefore the **per-line factorization** (O-parity-c):
> run each line as an isolated frontier-complete chronicle (where `findNextPositive`'s
> least-index order *does* coincide with chronicle order, T008), never the single combined run.

Two notes keep this honest:

- The tree trigger is **distinct** from T008's truncation trigger. T007 §Repair-1 follow-up
  established that the *linear* over-run is a **justified** `D`-move (a reachability gate does
  *not* fix it; only an orthogonality-verdict change would). The *branching* trigger here is a
  genuinely **unjustified** off-thread jump (a reachability/justification gate *would* fix it).
  R1-tree and R1-linear are different kernel surfaces; both stay parked, and the per-line
  factorization makes **neither** necessary for the theorem — exactly as T008 §Faithfulness
  made R1-linear unnecessary on the line.
- The failure on combined trees is **expected, not a bug to fix** (C013 §Out-of-scope; the
  task's R1 constraint). O-faithful's deliverable is the *characterization*, frozen as a
  green regression (added this session, §3), not a kernel patch.

*Verdict: medium; it is a spec + a witness, not a hard proof. Do not touch the kernel.*

### Summary table

| Obligation | Verdict | Where the difficulty lives |
|---|---|---|
| O-tree | **easy** | definitional; per-line completeness conjoins by locus-disjointness |
| O-parity | **HARD — split a/b/c** | **O-parity-b** (locus-disjoint non-interference) is the crux & the only refutation risk |
| O-perline | **easy** (gated on O-parity) | pure reduction to T008 |
| O-smyth | **easy** | antichain/powerdomain order fact; fragment-independent |
| O-faithful | **medium** | spec + frozen witness; failure expected; **no kernel change** |

## 2. Proof medium — **pen-and-paper first, then Agda as the Direction-5 deliverable**

Recommend **pen-and-paper proof + the TS harness as the primary artifact**, with the Agda
mechanization as the parallel check — the exact pattern T006/T007/T008 followed and that
T008 §Mechanization path already earmarks (`mechanisation/agda/T008/`, mirroring `T001/`,
`T002/`). Reasons:

1. **The hard lemma (O-parity-b) is a structural/representational argument**, not a
   computation: it asserts a *non-interference* property of normalization under a
   justification discipline. The right first move is to get the abstract object model and the
   factorization statement exactly right on paper, where the C012/T007 off-thread trap is
   most visible; rushing to Agda risks formalizing a normalizer that bakes in the result.
2. **The cross-check discipline is human-first** (T006/T007/T008 were authored, then
   independently re-derived by a non-author against the kernel — T007's blocking refutation
   came from *that* pass). C013's truth turns on whether O-parity-b is genuinely independent
   of `stepCore`; a human cross-check is the instrument that caught the analogous T007 defect.
3. **Agda is then the strongest available mechanized check** and *is* the Direction-5
   separation deliverable (C013 §Positive-settlement). The obligations decompose cleanly into
   modules (§3 object model), and a proof assistant is exactly suited to the per-branch case
   analysis session 05 §4 flagged. The Agda is a *check on*, not a *substitute for*, the paper
   proof — evidence-only under the Register policy (cf. T002 README's caveats).

Sequencing: **paper proof of O-tree → O-parity(a/b/c) → O-perline → O-smyth → O-faithful**,
cross-checked by a non-author against the kernel and the harness; **then** mechanize, with
O-parity-b and O-smyth as the load-bearing Agda lemmas. Mechanization is staged *after* this
session, not in it.

## 3. Object model (the data the proof inducts over)

The objects, on paper and in Agda (`mechanisation/agda/C013/` or `T009/`). Reuse the shared
`lib.Order` (setoid poset, antichain theory) and `lib.Closure` precedents; the prefix order
`⊑` is `lib.Order` instantiated on locus paths (segment-wise, matching
[`separation.isPrefixLocus`](../../packages/ludics-engine/separation.ts)).

- **`Locus` / `⊑`.** A locus is a path (list of segments); `⊑` is segment-wise prefix
  (root `"0"` least), the code's `isPrefixLocus`. `comparableLoci`, `maximalLoci`,
  `commonStem` are the antichain/stem operations already in `separation.ts` — the Agda
  mirrors them. **Distinct lines ⟹ `⊑`-incomparable ⟹ unequal addresses** is the key fact
  O-parity-b consumes; it is a lemma about `⊑`, provable in `lib.Order`.
- **`DisputeTree` (branching `D`).** A finite tree of acts: a positive `P` at even depth
  with a **ramification** (one child locus per attacker — exactly
  [`buildDisputeDesign`](../../lib/bridge/dispute.ts)'s `ramification` field), a received
  `O` at odd depth, a `†` where an argument has no attacker (T005 structural rule). A **line**
  is a maximal `⊑`-chain from the root; `D` is the union of its lines, sharing stems then
  branching. Induct on tree depth / on the ramification at each negative node.
- **`ConcessionTree` (daimon-closed proper test `T`).** A daimon-closed **sub-tree** of the
  dual base: at every positive turn across all open loci, an act (proper attack or `†`).
  Encoded as a totality predicate `ProperTree` = "an act at every reachable positive turn on
  every line" (the tree lift of [`isFrontierComplete`](../../packages/ludics-engine/properTest.ts)).
  The family is `{ refuse U : ∅ ≠ U ⊆ lines }` — refuse the deepest grant on each `ℓ ∈ U`,
  concede `†` elsewhere.
- **`Normalize : DisputeTree → ConcessionTree → Outcome`** where
  `Outcome = Converge ∣ Diverge (set of loci)`. **Defined with the justification gate**: a
  positive fires only if its `⊑`-predecessor on its line was matched. This is the object
  O-parity-b proves factors; the *un*gated kernel `stepCore` is the separate executable model
  O-faithful relates to it (and where faithfulness *fails* on combined trees).
- **Per-line projection `↾ℓ`.** `D↾ℓ`, `T↾ℓ` restrict to acts at loci `⊑`-comparable to the
  line `ℓ`'s leaf. O-parity-c is `Normalize D T ≅ ⨆_ℓ Normalize (D↾ℓ) (T↾ℓ)`.
- **Smyth order `≤_S`** on locus sets: `S ≤_S T ⟺ ∀ t ∈ T ∃ s ∈ S. s ⊑ t` (the harness's
  `smythLeq`). O-smyth is a `lib`-level lemma: for an antichain `M`, the subset-refusal family
  has `≤_S`-least `= M`.

The five obligations as lemmas over these objects:

```
O-tree     : ProperTree T → IsCounterDesign T            -- well-formedness
O-parity-a : (ℓ : Line) → Parity (lineDepth ℓ)           -- T008 Lemma 0, per line
O-parity-b : Incomparable ℓ ℓ' → NoCrossMatch ℓ ℓ'       -- locus-disjoint non-interference  (CRUX)
O-parity-c : Normalize D T ≅ ⨆_ℓ Normalize (D↾ℓ) (T↾ℓ)   -- factorization (from a+b)
O-perline  : Normalize (D↾ℓ) (Refuse ℓ) = Diverge {ξ_ℓ}  -- T008 invoked per line
O-smyth    : Antichain M → SmythLeast (family M) ≡ M      -- powerdomain order fact
O-faithful : stepCore∘⟦·⟧ ≈ Normalize  iff run per line   -- + the off-thread failure spec
```

## 4. Attack plan (staged T006 → T007 → T008: single line → two incomparable lines → general tree)

1. **Stage A — single line (= T008, the base case).** Confirm C013 specializes to T008 when
   `D` is one line: `M = { ξ(E) }`, the Smyth-least set is the singleton, O-parity is vacuous
   (one line, no branch point). Nothing to prove beyond citing T008; this pins the reduction
   and is the leaf of the induction.
2. **Stage B — two `⊑`-incomparable lines (the first genuine branch).** Prove O-parity-b for a
   single branch point: two lines sharing a stem `s` then diverging into incomparable
   `s.i.…` / `s.j.…`. Show no cross-match (the addresses below `s` are incomparable), hence
   factorization into two T008 runs, hence `M` = the 2-element antichain and (O-smyth) the
   Smyth-least set. **This is the stage that either confirms or refutes the crux** — build the
   adversarial two-line trees here (§5) and run them. If a two-line tree breaks factorization,
   that obstruction *is* the deliverable (the T007 pattern).
3. **Stage C — general tree (induct on the branch structure).** Lift Stage B along the
   ramification at each negative node: a tree is a stem then a set of sub-trees at incomparable
   child loci; apply the Stage-B non-interference at each branch point and the inductive
   hypothesis to each sub-tree. Conclude O-parity-c for arbitrary trees, then O-perline /
   O-smyth / O-faithful as in §1. This is the structural induction the paper proof and the
   Agda both perform.

Cross-check (separate non-author session, the T008 pattern) re-derives each stage against the
kernel + harness **before** promotion to a `T009`.

## 5. Missing corroboration (what the current harness does **not** cover)

The harness ([`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts))
corroborates the **aggregated outcome** (per-line minima form an antichain; Smyth-least = M;
Hoare fails) and the **per-line faithfulness in isolation** (`lineRefusalLocus` rebuilds clean
canonical lines). It does **not**:

- **(i) exercise O-parity's factorization directly.** It reconstructs *clean* lines and
  aggregates; it never ties a *genuine multi-line tree's* per-line stepCore runs to its
  aggregated `M`, nor shows the *combined* run diverging where the factorization says it must
  not be read.
- **(ii) freeze the off-thread witness.** The C012/T007 off-thread mis-divergence (`0.1.1`,
  matched `["0","0.2"]`) — the empirical heart of O-faithful's failure spec — lives only in
  prose, not as a regression.
- **(iii) spot-check beyond n ≤ 3 / symmetric small trees.** No deeper, **asymmetric**
  two-line tree (unequal line lengths, branch point at depth ≥ 1) confirming the
  shared-stem / independent-below picture.

**Added this session** (green; does not relabel any basis, does not touch the kernel):
[`tests/bridge/c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts)
— three describe-blocks pinning (i)/(ii)/(iii):

- **off-thread faithfulness witness (O-faithful failure spec).** Freezes the documented
  combined-tree run `pos=[P@0,O@0.1,O@0.2,P@0.1.1,P@0.2.1]`, `neg=[O@0,P@0.2,O@0.2.1]` →
  `DIVERGENT`, `divergenceLocus "0.1.1"`, matched `["0","0.2"]` (off-thread). This is the
  regression proving *why the normalizer must factor*.
- **factorization probe (O-parity-c).** For the same two-line shape, runs `stepCore` **per
  line** in isolation (each a faithful T008 chronicle) to recover `{ξ_A, ξ_B}`, asserts they
  form an antichain `M` with shared stem `"0"`, and asserts the **combined** run's divergence
  locus is **not** that aggregate — pinning *per-line ≠ combined* as a green fact.
- **deeper asymmetric tree (n=4 spot check).** Two lines of unequal length sharing a stem;
  confirms each line's ξ is its deepest grant and `M` = their antichain (the Stage-B object).

The full proof of O-parity-b is *not* a test — it is the abstract argument staged in §4. These
tests give the crux *differential teeth* before the proof, as T008's harness did for leastness.

## 6. Scoping that must not silently widen

- **Relative vs absolute (state it explicitly, as T008 did).** `M(D, E)` is the antichain of
  the **deepest** per-line grants, **relative to the maximal disagreement `E`**. The root
  `ξ₀ = "0"` is the trivial **absolute** floor — the degenerate "you disagree at the claim
  itself," the singleton `{ξ₀}` that is Smyth-below everything. The proof target is the
  **relative** object: `SepProper(D, E)` has Smyth-least `= M(D, E)` over the proper-test
  *family of the fixed `(D, E)`* — **not** an absolute minimum over all proper tests of `D`
  (which degenerates to `{ξ₀}`). The interior-refusal objection lifts per line (T008 §Statement
  callout): a test refusing a line at an interior even locus `d_{2i} ⊏ ξ_ℓ` diverges there but
  is the refusal of a **different** disagreement `E′ ∉ family(D, E)`, not a shallower separating
  set for the same disagreement. The product-bearing object is the relative `M`.
- **Q-039 (additive / preferred-stable) — additive-freeness is LOAD-BEARING here.** O-parity-b
  is true **because** the branch points are **multiplicative** superpositions (`⊗`/`⅋`) with
  distinct subaddresses per argument (T005), so the lines are independent and the family is the
  subset-refusal family. With **additives** (`&`/`⊕`, the preferred/stable games of
  [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) / [C011](../03_CONJECTURES/C011-additive-preferred-games-bridge.md)),
  a shared negative node is an additive choice where engaging one line **cancels** others —
  factorization can fail, and the Smyth-least set need not be the full antichain. So the
  additive case is **exactly** the place C013's factorization is *expected* to break; it is out
  of scope and must stay so. *Recording this prevents the scope from silently widening into
  Q-039 under the guise of "general trees."*
- **R1 (kernel-verdict change) — stays parked.** Both R1-linear (T008) and R1-tree (§1
  O-faithful) are parked. The per-line factorization makes the theorem independent of either;
  the kernel's off-thread failure on combined trees is characterized (frozen witness), **not
  fixed**. Do not modify `stepCore`.

## 7. Decisions recorded (conjecture / resolved / parked)

- **CONJECTURE — C013 still open, still looks true.** After the scope pass, C013 is *not*
  refuted: O-parity-b (the only refutation risk) is true on the additive-free fragment by
  locus-disjointness; O-smyth/O-perline/O-tree are easy; O-faithful's failure is expected. The
  proof is the next session's work, not assumed here.
- **RESOLVED (this session) — O-parity should be SPLIT** into a (parity, easy) / b
  (non-interference, hard, the crux) / c (factorization). The crux is O-parity-b.
- **RESOLVED (this session) — medium = pen-and-paper first, Agda as the Direction-5 check**
  (§2); object model fixed (§3); attack plan staged A→B→C (§4).
- **RESOLVED (this session) — missing corroboration added** (`c013-factorization-scope.test.ts`,
  green) covering factorization, the off-thread witness, and an asymmetric n=4 spot check (§5).
- **PARKED — R1-linear and R1-tree** (kernel-verdict / justification-gate changes). The
  per-line factorization makes both unnecessary for the theorem.
- **OUT OF SCOPE — Q-039 additive** (the place factorization is expected to fail). **Update
  2026-06-05:** the operational surface relabel, deferred here pending the proof + cross-check,
  is now **done** — with [T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md)
  established (cross-checked), the extractor basis is promoted `per-line-divergence-C013` →
  `smyth-minimal-T009` (a Smyth-minimal **antichain**, never a `⊑`-least locus; still run
  `stepCore` per line).

## 8. Handoff

The next session executes the §4 attack plan (Stage A cite-T008 → Stage B prove/refute
O-parity-b on two lines → Stage C general-tree induction → O-smyth/O-perline/O-faithful), paper
first; a separate non-author session cross-checks it against the kernel + harness (the T008
pattern) before any promotion to a `T009`. The crux to attack first — and the thing most likely
to surface an obstruction — is **O-parity-b** (locus-disjoint non-interference). If it holds,
C013 promotes; if a two-line tree breaks it, that tree is the deliverable.

## 9. Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — designs as trees of chronicles, normalization, the
  daimon, separation; the justification condition (an act's address is a child of an
  already-played address on its chronicle) O-parity-b leans on.
- Smyth 1978 / Plotkin — the upper (Smyth) powerdomain; the liftings of a partial order to its
  sets (O-smyth).
- In-repo: [C013](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md) (the
  conjecture + obligations), [session 05](05-branching-normalization-o2-2026-06-04.md) (the
  scoping + order choice), [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
  (linear base case), [T007 §Defect 1](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md)
  (the off-thread witness + the leastness trap), [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md)
  (E0), [C012 §Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md) (the off-thread
  probe), [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) (O2) / [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)
  (additive), harness [`branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts),
  new corroboration [`c013-factorization-scope.test.ts`](../../tests/bridge/c013-factorization-scope.test.ts),
  order [`separation.ts`](../../packages/ludics-engine/separation.ts), extractor
  [`properTest.ts`](../../packages/ludics-engine/properTest.ts), Agda precedents
  [`mechanisation/agda/T002/`](../mechanisation/agda/T002/T002.agda) / `lib/Order.agda`.

---

**Handoff (one line):** O-parity-b (locus-disjoint non-interference) is the crux and the only
refutation risk; it is true on the additive-free fragment; medium is paper-first then Agda;
C013 still looks true. Next session proves it; a non-author cross-checks.
