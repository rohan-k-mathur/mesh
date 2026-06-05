# C012 — The first-divergence locus of two non-orthogonal dispute designs is the minimal separating context (the minimal unshared commitment)

- **status:** **promoted (narrowed) + minimality refiled open.** Filed 2026-06-03 (Direction 2 starting artifact \u2014 see [session 03](../10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md)). Phase 0: **E0 proved** ([T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md), established). Phase 1: the order **`\u2291` and `\u03be*` defined** (see *Phase 1*). Phase 2: anchor-chain **corroborated over `allAFs(n)`, `n \u2264 3`** (see *Phase 2*). Phase 3: proved, then the independent cross-check **refuted the leastness/minimality half against the kernel** (a strict odd-depth prefix of `\u03be(E)` separates earlier; the over-run is a *justified* `D`-move). Under **Repair 1** the sound remainder \u2014 `\u03be(E)` is a determinate separating context + the anchors form a `\u2291`-chain with least `\u03be*` \u2014 is promoted to [T007](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md) (`established`, narrowed). The **minimality** claim (the original load-bearing conjecture) is **refuted as stated** and re-filed open at [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) (kernel justification-gate vs abstract sequentiality, covering both the linear-leastness and branching obstructions); [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) is **not** closed for minimality. The contested-frontier rewire stays **gated off**. Additive case open under [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039). **R2 follow-up (2026-06-04):** the minimality removed here is **recovered abstractly** by [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md) (`established`, cross-checked 2026-06-04) \u2014 redefining \"separating context\" as a complete daimon-closed counter-design makes `\u03be(E)` the `\u2291`-minimal separating context on the linear chronicle (the parity artifact dissolves); the kernel is faithful on proper tests, unfaithful only on raw truncations. The rewire stays gated on a verified extractor; branching stays open under [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041).
- **ring:** core
- **depends-on:** [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) (pins the translation `⟦·⟧`, the additive-free fragment, and canonical orthogonality); [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md) (the warm-up lemma E0, proved); Girard 2001 separation theorem
- **linked-open-questions:** [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) (registers this biconditional)
- **last-reviewed:** 2026-06-04
## Setting

Fix the Direction-1 translation. `F = (A, ⇝)` is a finite abstract AF;
`⟦·⟧` sends arguments to Proponent dispute designs and the attack structure to
Opponent test designs, all within the **multiplicative, additive-free** fragment
of Ludics with distinct subaddresses per argument
([session 02b](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)).
Orthogonality is the **canonical** predicate (`stepInteraction` reaching the
daimon `†`, i.e. `CONVERGENT`). Let `D` be a Proponent dispute design and `E` an
Opponent design with `D ⊥̸ E` (interaction `⟨D ∣ E⟩` diverges — `DIVERGENT` in
[`stepCore`](../../packages/ludics-engine/stepCore.ts)).

## Warm-up lemma (E0 — the easy half, *not* the theorem)

> Along the deterministic normalization run `⟨D ∣ E⟩`, the first address `ξ` at
> which the two strategies cease to match (the `DIVERGENT` locus —
> `nextPos.act.locusId` in [`stepCore`](../../packages/ludics-engine/stepCore.ts))
> is **unique and computable**.

This is stated explicitly as the warm-up, not the conjecture: the run is
deterministic and the break is the first unmatched positive, so uniqueness and
computability are expected to be a short proof against the kernel.

### E0, proved (Phase 0, 2026-06-03)

> **Promoted.** This warm-up lemma now has a dedicated, citable home —
> [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md)
> (`provisional`, pending cross-check). The statement and proof below are retained
> as the in-conjecture record; T006 is the canonical entry for reuse and the
> single source of truth for E0's status.

**Lemma E0 (first-divergence address — uniqueness and computability).** Fix `D`
(Proponent) and `E` (Opponent) in the T005 fragment — multiplicative,
additive-free, distinct subaddresses per argument, canonical orthogonality — with
`⟨D ∣ E⟩` divergent. Then the run `⟨D ∣ E⟩` determines a single address `ξ`, the
locus of the first unmatched positive, and `ξ` is computed in one pass by the
pure kernel. Concretely `ξ = stepCore(⟦D⟧, ⟦E⟧).divergenceLocus`
([`stepCore.ts`](../../packages/ludics-engine/stepCore.ts)), and it is defined iff
`status = DIVERGENT`.

*Proof.* `stepCore` is the deterministic locus-matched alternating loop: at each
step it selects `nextPos`, the **first** positive at or after the active cursor on
the side to move (`findNextPositive`), and seeks its dual O-act at the **same**
locus (`findNextNegativeAtLocus`). The loop is a pure function of `(⟦D⟧, ⟦E⟧)` —
no I/O, no clock-dependent branch in the decision (`StepResult` from
[`packages/ludics-core/types`](../../packages/ludics-core/types.ts) is its only
import) — so for fixed inputs the sequence of `(side, cursorA, cursorB, nextPos)`
states is unique; the run is a deterministic finite trajectory.

The loop exits `DIVERGENT` at exactly one of three guards, each carrying the
offending positive `nextPos.act`: `additive-violation` (vacuous in the
additive-free fragment), `consensus-draw`, and `incoherent-move` (the only live
case here — no dual O at `nextPos.act.locusId`). In every case the recorded
address is the path of that one offending positive,
`nextPos.act.locusId ? pathById.get(nextPos.act.locusId) : undefined`, i.e. the
field `divergenceLocus`. Because the loop `break`s on the first guard hit and the
state sequence is unique, `nextPos` at the break — hence `ξ` — is unique. It is
the *first* unmatched positive: every positive strictly before it in the
trajectory was matched (the loop advanced past it) and `nextPos` is, at each step,
the least-index eligible positive. Termination within `|⟦D⟧| + |⟦E⟧|` steps
(each matched pair strictly advances a cursor; the offending step consumes none)
gives computability. ∎

**Witness.** Surfaced as the typed field `StepCoreResult.divergenceLocus` (string
path, e.g. `"0.1.2"`, reusing the existing `pairs[].locusPath` address space —
there is no `LocusPath` type) with the pure projection `divergenceLocusOf`, and
threaded verbatim through `stepInteraction`
([`stepper.ts`](../../packages/ludics-engine/stepper.ts)) onto `StepResult`. The
differential test
[`tests/bridge/divergence-locus-differential.test.ts`](../../tests/bridge/divergence-locus-differential.test.ts)
discharges E0 empirically over `allAFs(n)` for `n ≤ 3`: against an independent
re-derivation of the first unmatched positive it confirms `divergenceLocus` is
populated exactly on `DIVERGENT` runs, equals the oracle on every encoded
non-orthogonal `(D, E)` pair (faithful play with each Opponent O-act dropped in
turn), and is returned identically by the kernel, the projection, and the
`stepInteraction` extraction surface. This settles the *easy half* only;
cross-opponent minimality (below) remains open.

## Statement (the load-bearing claim)

Let `Sep(D)` be the set of **separating contexts** for `D` — Opponent designs/tests
`C` that interaction distinguishes `D` on (the witnesses of Girard's separation
theorem, the Ludics analogue of Böhm's theorem), partially ordered by address
prefix / sub-design inclusion `⊑`. Then:

> For every Opponent design `E` with `D ⊥̸ E`, the first-divergence locus `ξ` of
> `⟨D ∣ E⟩` determines **the `⊑`-minimum** of the separating contexts that
> witness the `D`/`E` disagreement — i.e. `ξ` names *the* minimal separating
> context across **all** opponent designs, not merely *a* separating one.

Read at the platform: `ξ` is **the minimal unshared commitment** — the single
smallest presupposition that one party holds and the other challenges or lacks.
The contested-frontier / gap-identification surface, given this theorem, reports a
*provably minimal* locus of disagreement rather than a heuristic one. "The platform
identifies exactly where you disagree" becomes a corollary of separation.

The quantifier scope is the substance: minimality is asserted **across all opponent
designs in `D⊥`**, not within the single run `⟨D ∣ E⟩`. That cross-opponent
minimality — not the uniqueness of E0 — is the real theorem.

## Phase 1 — the order `⊑` and the minimal unshared commitment (2026-06-04)

Phase 1 fixes the partial order the load-bearing claim quantifies over and names
the "minimal unshared commitment" object precisely, so C012's statement, the
Phase-2 harness, and the product surface all refer to **one** object. No theorem is
claimed and no code is rewired here — this is the vocabulary the later phases test
and prove against.

### Anchored separating contexts

In the T005 fragment every Opponent design `E` non-orthogonal to `D` fails to match
`D` for the first time at a determinate address — its first-divergence locus
`ξ(E) = divergenceLocusOf(⟦D⟧, ⟦E⟧)` ([T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md),
E0). Read locatively (Girard): the data that makes `E` a *separating* context for
`D` is not all of `E` but the **shared chronicle up to `ξ(E)`** — the common path
both designs walk before `E` poses, at `ξ(E)`, a positive `D` cannot answer. Call
this the **anchored separating context** `C_E := (chronicle ↾ ξ(E), ξ(E))`, with
**anchor** `anch(C_E) = ξ(E)` a locus path. Set
`Sep(D) = { C_E : E ∈ D⊥ }` — the anchored contexts of `D`'s non-orthogonal
opponents.

### The order `⊑`

Loci are paths (strings `"0.i.j…"`). Write `ξ ⊑ ξ'` for the **prefix order**: `ξ`
is an initial segment of `ξ'` (so `ξ` sits at or above `ξ'` on the dispute tree; the
root `"0"` is the global least). Lift to contexts by their anchors:

> `C ⊑ C'  :⟺  anch(C)` is a prefix of `anch(C')`.

This is the "address prefix / sub-design inclusion" order the Statement names.
Elementary facts (to be re-checked mechanically in Phase 2 and in the Phase-3 proof):

- **Partial order.** Prefix-on-strings is reflexive, antisymmetric (two strings each
  a prefix of the other are equal), and transitive; `⊑` inherits all three.
- **Bounded below.** `"0"` is `⊑`-below every anchor, so `Sep(D) ∪ {root}` always has
  a bottom; whether `Sep(D)` *itself* has a least element is the open point.
- **Partial, not total.** Anchors on distinct branches — e.g. `"0.1"` and `"0.2"` —
  are `⊑`-incomparable. This is exactly where the minimum can fail to exist (the
  negative-settlement clause below).

### Minimal unshared commitment

> The **minimal unshared commitment** of `D` is the `⊑`-least element of `Sep(D)`,
> when it exists: the shallowest (closest-to-root) address at which *some* opponent
> forces a divergence — the single smallest presupposition `D` commits to that an
> opponent challenges or lacks.

E0 / [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md) gives, per
opponent, a unique anchor `ξ(E)`. C012 is then the two-part claim that (i) `Sep(D)`
has a `⊑`-least element `ξ*` (existence **and** uniqueness of the minimum), and
(ii) `ξ*` is **realised by a single run** — there is an opponent `E*` with
`ξ(E*) = ξ*`, so the minimal unshared commitment is *computed*, not merely defined,
as the prefix-least first-divergence locus over `D⊥`. (Shallowest-divergence is
"minimal separating" because a shorter shared chronicle is a *simpler* test — fewer
commitments must be granted before the disagreement bites — which is the Ludics
reading of "smallest distinguishing context" / Böhm.)

### Pinning to the contested-frontier surface

The product surface the theorem underwrites is the **contested frontier**:
[`lib/deliberation/frontier.ts`](../../lib/deliberation/frontier.ts)
(`computeContestedFrontier` → `ContestedFrontier`), the route
[`app/api/v3/deliberations/[id]/frontier/route.ts`](../../app/api/v3/deliberations/%5Bid%5D/frontier/route.ts),
and the UI [`components/deliberation/FrontierLane.tsx`](../../components/deliberation/FrontierLane.tsx).
Today it ranks *open dialectical edges* (unanswered undercuts / undermines / CQs,
terminal leaves) by a **degree-based `loadBearingnessRanking` heuristic** — its own
docstring flags this as *not* a grounded-extension computation. The correspondence
Phase 1 pins:

- The frontier operates on the **argument graph** (Dung level): edges, premises, CQs.
  The minimal unshared commitment `ξ*` lives on the **Ludics dispute** (locus level).
  The [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) translation
  `⟦·⟧` is the bridge between the two: an argument-graph contested edge maps to a
  dispute locus, so "the frontier's most load-bearing open edge" and "the `⊑`-minimal
  divergence locus" are *intended to name the same object on the two sides of `⟦·⟧`*.
- Under C012, the frontier's headline "where you disagree" item is **`ξ*` projected
  back through `⟦·⟧`** — a *provably* minimal locus, replacing the degree heuristic.
  The anti-centrist promise the frontier already makes (open moves listed by name,
  not averaged into "the truth is somewhere between") would then rest on separation
  rather than on a ranking.

The rewire — sourcing the frontier's top item from `ξ*` — is **gated on C012's
positive settlement** (Phase 3); promoting a conjecture to a premise before proof is
exactly what program discipline forbids. Phase 1 only fixes the vocabulary so the
theorem and the feature name one object; Phase 2 tests whether `ξ*` exists and is
realised over `allAFs(n)`.

## Phase 2 — corroboration over `allAFs(n)` (2026-06-04)

Test-then-prove, as for T005: before the Phase-3 proof, the load-bearing claim is
corroborated exhaustively against the kernel. The order `⊑` and the minimal-anchor
reducer now live as pure code
([`packages/ludics-engine/separation.ts`](../../packages/ludics-engine/separation.ts)) —
`isPrefixLocus` (segment-wise prefix, so `"0.1" ⋢ "0.12"`) and `minimalAnchor`,
which returns the `⊑`-least anchor `ξ*` with flags `exists` / `isChain`. This is
the *same* object the theorem and (eventually) the frontier rewire refer to.

The harness
[`tests/bridge/separation-minimal-locus.test.ts`](../../tests/bridge/separation-minimal-locus.test.ts)
enumerates, for every Proponent dispute design `D` from a faithful PRO/CON play over
`allAFs(n)` (`n ≤ 3`), a family of non-orthogonal Opponent designs `{E}` — one per
dropped Proponent-positive dual, each forcing a `DIVERGENT` run at a determinate
anchor `ξ(E)` (E0). Over `Sep(D) = { ξ(E) }` it asserts:

- **existence** — `minimalAnchor(Sep).exists` (a `⊑`-least `ξ*` is present),
  cross-checked against an *independent* shallowest-prefix-least oracle (fewest
  segments + explicit prefix-of-all verification, no shared code with the reducer);
- **uniqueness** — exactly one anchor is a prefix of every other (antisymmetry made
  empirical);
- **floor** — every `ξ(E)` has `ξ*` as a prefix (`ξ*` really is the least, not merely
  *a* minimal element);
- **realisation** — `ξ*` is `ξ(E*)` for an actual enumerated opponent `E*`, witnessed
  by a single dropped dual (the minimal unshared commitment is *computed*, not just
  defined);
- **chain** — `minimalAnchor(Sep).isChain`: the anchors are totally ordered by `⊑`.
  This is the additive-free corroboration — the T005 fragment's linear chronicle
  **never** produced the `⊑`-incomparable anchors of the negative settlement across
  the whole enumeration. A standalone unit block additionally pins the order's
  algebra (reflexive / antisymmetric / transitive, root `"0"` least, and the
  `"0.1"`/`"0.2"` incomparability the negative settlement turns on).

**Result:** all checks pass exhaustively for `n ≤ 3` (7 assertions green; lint
clean). The negative-settlement shape was searched for and not found in-fragment —
strong corroboration that, in the additive-free T005 setting, the first-divergence
locus *is* the unique minimal separating context. This discharges the empirical
precondition of the positive settlement; what remains is the Phase-3 proof that the
corroborated coincidence holds for all `n` via Girard separation.

## Phase 3 — proof: the first-divergence locus is the minimal separating context (2026-06-04)

Phase 2 found no counterexample over `allAFs(n)`, `n ≤ 3`. This section proves the
coincidence **for all `n`** in the additive-free T005 fragment. The argument has two
layers — *per-disagreement* minimality (the operative content) and the
*cross-opponent* structure of `Sep(D)` (what the Phase-2 harness measured) — and
closes by recording, per program discipline, the precise boundary at which the
structure degenerates.

Throughout, `⟨D ∣ E⟩` is the deterministic kernel run
([`stepCore`](../../packages/ludics-engine/stepCore.ts)); `ξ(E)` is its
first-divergence anchor (E0 / [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md));
`⊑` is the prefix order on locus paths ([§Phase 1](#phase-1--the-order--and-the-minimal-unshared-commitment-2026-06-04));
and for a locus `ℓ` on the shared chronicle, `E↾ℓ` is the truncation of `E` to acts
at loci `⊑ ℓ` — the *separating context* (the shared data up to `ℓ`) in Girard's
sense.

### Layer A — per-disagreement minimality (fixed `D`, `E`)

Fix `D ⊥̸ E`. Call a locus `ℓ` **separating for `(D, E)`** if `⟨D ∣ E↾ℓ⟩` already
diverges.

> **Lemma A.** `ξ(E)` is the `⊑`-least separating locus for `(D, E)`.

*Proof.* **(`ξ(E)` separates.)** By E0 the deterministic trajectory of `⟨D ∣ E⟩`
matched every positive strictly before `ξ(E)` and breaks at the *first unmatched
positive* at `ξ(E)` (T006, §Existence). The kernel is locus-matched and advances
its cursors only across matched duals (`cursorA = nextPos.idx + 1`,
`cursorB = dual.idx + 1`; T006 §Termination), so every act the trajectory consults
up to and including the break lies at a locus `⊑ ξ(E)`. Truncating `E` at `ξ(E)`
therefore removes only acts the prefix-trajectory had not yet reached: `⟨D ∣ E↾ξ(E)⟩`
runs identically up to the break and diverges. **(`ξ(E)` is least.)** Let
`ℓ ⊏ ξ(E)` be a strict prefix. Up to `ℓ` the trajectory of `⟨D ∣ E⟩` consists
solely of matched pairs — the first unmatched positive sits strictly deeper, at
`ξ(E)` — so `⟨D ∣ E↾ℓ⟩` exhibits no unmatched positive and hits no `DIVERGENT`
guard. In the fragment `additive-violation` and `consensus-draw` are vacuous (T006
§Existence), so a non-divergent run is `CONVERGENT` / `STUCK` / `ONGOING`; in each
case `ℓ` is not separating. Hence no strict prefix of `ξ(E)` separates, and `ξ(E)`
is the `⊑`-minimum. Uniqueness is E0. ∎

Lemma A is the operative theorem: *relative to a fixed disagreement and the common
ground both parties have granted, the first-divergence locus is exactly the smallest
shared chronicle on which `D` and `E` part.* This is the platform's "where you
disagree, given what you both accepted" — and it is provably the minimum, not a
heuristic. (It is corroborated transitively: T006's differential test pins `ξ(E)` as
the first unmatched positive, which is precisely the prefix-monotonicity Lemma A
turns on.)

### Layer B — cross-opponent structure of `Sep(D)`

Now vary `E` over `D⊥`; `Sep(D) = { ξ(E) : E ∈ D⊥ }`.

> **Lemma B.** `Sep(D)` is the set of positive-act loci of `D`, ordered by `⊑` into
> a tree rooted at the claim locus `ξ₀ = "0"`; hence it has a unique `⊑`-least
> element `ξ* = ξ₀`, and `ξ*` is realised by a single run.

*Proof.* **(Anchors are `D`'s positive loci.)** In the live `incoherent-move` case
(the only divergence on the fragment, T006 §Existence) the offending positive is a
move of `D` left unanswered by `E`; its locus is a positive-act locus of `D`.
Conversely every positive locus `ℓ` of `D` is challengeable: the opponent `E_ℓ` that
matches `D` up to `ℓ` then withholds the dual at `ℓ` lies in `D⊥` with `ξ(E_ℓ) = ℓ`
(the single-drop construction of the Phase-2 harness, taken along the branch through
`ℓ`). So `Sep(D)` is exactly `loci(positive acts of D)`. **(Rooted tree.)** Under
`⟦·⟧` for a single claim, `D`'s positive acts form a tree rooted at `ξ₀`: the
translation opens one base address for the claim and **distinct** subaddresses for
each advance, with no additive superposition of children at a locus
([T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) spec §1–§4). So
every positive locus of `D` has `ξ₀` as a `⊑`-prefix. **(Minimum.)** A non-empty
`⊑`-rooted set has `ξ₀` as least element — a prefix of every member (rootedness) and
itself a member, realised by `E_{ξ₀}` (the opponent refusing the claim). Uniqueness
is antisymmetry of `⊑`. ∎

> **Corollary (linear restriction — the corroborated case).** When the dispute is a
> single realized chronicle (as the Phase-2 harness builds from each play line),
> `Sep(D)` lies on one branch and `⊑` totalises it: `Sep(D)` is a finite non-empty
> **chain** with least element `ξ*`. This is exactly the `isChain`-always-true
> observation of Phase 2; it specialises Lemma B's tree to a chain.

### Boundary (the precise obstruction, recorded as the result)

Two scope boundaries, both load-bearing and stated honestly rather than smoothed
over:

1. **Absolute vs relative minimum.** The unconditional cross-opponent minimum
   (Lemma B) is the root claim `ξ₀` — the opponent who refuses outright always
   realises the shallowest disagreement, so `ξ₀` is a *trivial floor*, the same for
   every `D`. The non-trivial, product-bearing object is the **relative** minimum of
   Lemma A: given the common ground a specific opponent granted, `ξ(E)` is the
   minimal separating context. The contested-frontier rewire must source **Lemma A**
   (where a live disagreement bites along agreed ground), with `ξ₀` as the floor —
   the two layers must not be conflated.
2. **Linear vs branching.** The **chain** property is the linear restriction
   (Corollary) and is what Phase 2 corroborated; the general tree keeps
   existence/uniqueness/realisation via rootedness (Lemma B) but is a rooted tree,
   not a chain. Additive (preferred/stable) separation — where opponent branching
   genuinely threatens minimality — stays out of scope under
   [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) / [C011](C011-additive-preferred-games-bridge.md).

### What Phase 3 settles (pre-cross-check claim — superseded by the rescope below)

> **Superseded.** This paragraph recorded the Phase-3 claim *before* the independent
> cross-check. The cross-check (next subsection) found the general-branching
> direction overreaches the kernel; the operative, promoted statement is the
> **rescoped** *What Phase 3 settles (rescoped…)* further down. Retained as the
> in-conjecture record.

Within the additive-free T005 fragment: **Lemma A** (per-disagreement minimality)
and **Lemma B** (existence / uniqueness / realisation of the cross-opponent minimum;
chain in the linear case) are proved against the kernel and corroborated (Phase 2;
Lemma A transitively via T006). The only genuinely open extension is the additive
case (Q-039). On this basis C012 is ready to migrate to
[`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/) as a theorem closing
Q-040 **for the multiplicative fragment**, with the two boundaries above carried as
its scope — pending the usual independent cross-check (as for T006).

### Cross-check notes (independent, 2026-06-04 — GitHub Copilot, non-author)

I audited Lemma A's truncation/locality step and Lemma B's "anchors = `D`'s positive
loci" claim **against the kernel source**
([`stepCore.ts`](../../packages/ludics-engine/stepCore.ts)) and the translation spec
([session 02b](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)
§1.2–§1.3), not against the proof's own summaries. Verdict: **the proof is correct
and well-corroborated for the linear realized-chronicle case** (the Corollary, which
is exactly what the Phase-2 harness exercises and what the product surface needs — a
single dispute line). **Two steps overreach in the general branching direction** and
must be rescoped or backed by an explicit sequentiality lemma before promotion.

- **Finding 1 — Lemma A locality is a property of the *run*, not of cursor
  mechanics.** The proof justifies "every act the trajectory consults up to the break
  lies at a locus `⊑ ξ(E)`" by "the kernel advances its cursors only across matched
  duals." That inference does **not** hold in general: `findNextPositive` returns the
  **least-index** positive at or after the cursor and advances `cursorA/cursorB` by
  *index* (`nextPos.idx + 1`), with **no** justification/sequentiality check (there is
  no parent-of relation enforced between successive positives in this fragment —
  `focusAt` is unset). So for an act list encoding `⊑`-incomparable loci (e.g.
  positives at `"0.1"` and `"0.2"`), a single run visits both, and the consulted loci
  are **not** a `⊑`-chain. The locality step is true for the designs the harness
  builds because `buildPlayDesigns` emits one **linear chronicle** (`locusAt(0…len)`,
  a `⊑`-chain in index order) — i.e. it is a *sequentiality property of the realized
  run*, which should be **cited explicitly** (or assumed as the linear restriction),
  not attributed to the cursor update.

- **Finding 2 — "offending positive is a `D`-move" is the test asymmetry, not a
  kernel theorem.** The loop **alternates** `side`, with `posSide = A` (Proponent /
  `D`) when `side="A"` and `posSide = B` (Opponent / `E`) when `side="B"`. The
  unmatched positive at the `incoherent-move` break is therefore the move of
  **whichever side is to move**; it is a `D`-move only because the Phase-2 family is
  generated by **dropping `E`'s answering O-acts** (perturbing the *test*, never `D`).
  Lemma B's "`Sep(D)` = `D`'s positive loci" should be stated as a consequence of this
  **Opponent-as-test asymmetry**, not of the kernel alone.

- **Finding 3 — Lemma B's rooted-tree claim inherits Finding 1.** Because
  `⟦a⟧⁺` is genuinely **branching** (spec §1.2: `ramification` opens one child per
  attacker, recursively), and the kernel scans positives by index without
  justification, on a branching `D` the run can diverge at the first index-order
  unanswered `D`-positive — a branch the Opponent test was not probing — so `ξ(E)`
  is not cleanly "the locus `E` tests." The clean statement "`Sep(D)` = loci of
  `D`-positives **along the realized line**" is again the **linear** reading; the
  general tree case needs the sequentiality lemma of Finding 1.

**None of the three refute the theorem in the corroborated setting** — they pin
exactly *which* setting is proved. Recommendation: **do not promote as a
fully-general multiplicative theorem yet.** Either (a) **rescope** C012's Phase-3
claim to the **linear / single-realized-chronicle** fragment — which matches Phase 2,
the Corollary, and the product's single-dispute-line need, and is cleanly promotable
now — or (b) add an explicit **sequentiality lemma** for `⟦·⟧` (a realized run
against an Opponent test visits a `⊑`-chain of loci) and re-derive Lemma A/B over it.
Suggested path: (a) now, (b) as a tracked follow-up. The two existing boundary
clauses above already point the right way; this cross-check makes the linear
restriction *load-bearing for the proof itself*, not merely for the chain corollary.

### Route (b) attempted — blocked at the kernel (2026-06-04)

Route (b) was attempted before falling back to (a). The candidate **sequentiality
lemma** — *a realized run `⟨D ∣ E⟩` against an Opponent test visits a `⊑`-chain of
loci* — is true of the **intended Ludics semantics** (chronicle-following
normalization descends one child per round), but it is **not faithfully realised by
[`stepCore`](../../packages/ludics-engine/stepCore.ts)** on branching designs, so it
cannot be discharged against the kernel without a kernel change.

**Empirical witness (probe, test-then-prove).** Model `⟦a⟧⁺` for a claim `a` with
two *defended* attack lines — `b1@0.1` (defended by `c1@0.1.1`) and `b2@0.2`
(defended by `c2@0.2.1`) — as Proponent acts
`[P@0, O@0.1, O@0.2, P@0.1.1, P@0.2.1]`, against a single Opponent test that attacks
**only** via `b2`: `[O@0, P@0.2, O@0.2.1]`. Reachability-gated normalization should
follow `0 → 0.2 → 0.2.1` and let Proponent **win** (the `b1` line was never opened).
`stepCore` instead returns:

```
status: DIVERGENT   reason: incoherent-move   divergenceLocus: "0.1.1"
matchedLoci: ["0", "0.2"]
```

i.e. it **mis-diverges at `0.1.1`**, an **off-thread** locus *incomparable* to the
realized thread `0 → 0.2`. The cause is precisely Finding 1: `findNextPositive`
selects the **least-index** positive with no justification/reachability gate, so
after matching at `0.2` it jumps to the un-attacked `b1` line's defence `P@0.1.1` and
diverges there. On this input **both** lemmas fail — Lemma A locality (`ξ = 0.1.1` is
off the realized chain) and Lemma B (`ξ` is not the locus the test probes; Proponent
loses a dispute it should win).

**Conclusion.** Generalising separation to *branching* `⟦D⟧` requires either
gating `stepCore`'s positive selection on reachability/justification (genuine engine
work, with risk to the existing `stepInteraction` integration tests) or re-deriving
the lemmas at a purely abstract level decoupled from the kernel (forfeiting the
test-then-prove corroboration the programme requires). Both exceed this session;
route (b) is therefore deferred as a **tracked follow-up**
([Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)). We adopt route (a): the lemmas are
**restated over the linear single-realized-chronicle fragment**, where the
sequentiality property holds *by construction* (`buildPlayDesigns` and every realized
dispute line emit a `⊑`-chain), and that fragment is promoted.

### What Phase 3 settles (rescoped to the linear realized-chronicle fragment)

Within the additive-free T005 fragment **restricted to a single realized dispute
chronicle** — the setting of Phase 2 (`buildPlayDesigns` emits the `⊑`-chain
`locusAt(0…len)`) and of the product's single-dispute-line surface:

- **Sequentiality (by construction).** A realized line emits acts at the `⊑`-chain
  `ξ₀ = "0" ⊏ ξ₁ ⊏ ξ₂ ⊏ …`; there are no `⊑`-incomparable loci in play, so
  `findNextPositive`'s index order coincides with the chronicle and the off-thread
  hazard of the probe cannot arise.
- **Lemma A (per-disagreement minimality)** — `ξ(E)` is the `⊑`-least separating
  context for `(D, E)`: proved as above, with the locality step now resting on
  sequentiality-by-construction rather than on cursor mechanics.
- **Lemma B (cross-opponent structure)** — over the single line, `Sep(D)` is the set
  of `D`-positive loci *on that chain*, a finite non-empty `⊑`-**chain** with a
  unique least element `ξ*`, realised by a single dropped-dual opponent (the
  Corollary, now the main statement). The "offending positive is a `D`-move" step is
  the Opponent-as-test asymmetry (Finding 2), explicit here because the family is
  generated by perturbing only `E`.

These are proved against the kernel and corroborated exhaustively (Phase 2;
Lemma A transitively via T006). On this rescoped basis C012 is promoted to
[T007](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md) as a theorem
closing [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) **for the multiplicative,
linear-chronicle fragment**, carrying two tracked extensions: branching designs
([Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)) and the additive case
([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)).

## Positive settlement

A proof, most naturally:

1. Establish E0 (uniqueness/computability of the first-divergence address) against
   [`stepCore`](../../packages/ludics-engine/stepCore.ts). **(Done — see *E0, proved*.)**
2. Define the order `⊑` on `Sep(D)` so that a least element exists and is unique.
   **(Defined — see *Phase 1*; existence/uniqueness of the least element is what
   Phase 2 corroborates and Phase 3 proves.)**
3. Via Girard separation on the additive-free fragment, show the first-divergence
   locus `ξ` *is* that least element — the additive-free restriction (inherited
   from [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md)) excludes
   the branching where minimality is most fragile.
   **(Proved — see *Phase 3*: Lemma A per-disagreement, Lemma B cross-opponent; the
   chain is the linear restriction, the general case a rooted tree.)**

Corroborated empirically first (test-then-prove, as for T005): over `allAFs(n)`
check that the first-divergence locus coincides with the `⊑`-minimum separating
context across enumerated opponent designs. **(Corroborated — see *Phase 2*; `n ≤ 3`
exhaustive, no counterexample.)** On positive settlement, migrate to
[`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/) with `closes: Q-040`.

A mechanized proof of Girard separation in Agda (Direction 5, parallel track) is
both an independent deliverable and the strongest available check on step 3.

## Negative settlement

A finite AF `F`, a Proponent design `D`, and **two** opponent designs `E₁, E₂`
(both non-orthogonal to `D`) such that the first-divergence locus of one is **not**
the `⊑`-minimum separating context — i.e. some other separating context is strictly
smaller, or the candidate minima of `E₁` and `E₂` are `⊑`-incomparable so no single
minimal unshared commitment exists. Such a counterexample (smallest `n`, exhibited
as a worked dispute) refutes minimality while leaving E0 intact, and **the precise
obstruction is itself the result** (per program discipline): the conjecture is then
restricted to the characterised sub-fragment and the boundary tracked, exactly as
T005's additive-free boundary was.

## Scope and non-goals

- **In scope:** abstract AF, multiplicative/additive-free, canonical orthogonality —
  the T005 fragment.
- **Out of scope (for now):** preferred/stable (additive) separation, where opponent
  branching makes minimality fragile; deferred until
  [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) / [C011](C011-additive-preferred-games-bridge.md)
  land.

## Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — separation theorem, behaviours, divergence.
- Böhm 1968 — λ-calculus separation theorem (the analogue).
- In-repo: [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md),
  [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md) (E0, proved),
  [session 03](../10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md),
  [`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](../09_FUTURE_DIRECTIONS_BRAINSTORM.md) §2,
  engine kernel [`stepCore.ts`](../../packages/ludics-engine/stepCore.ts).
