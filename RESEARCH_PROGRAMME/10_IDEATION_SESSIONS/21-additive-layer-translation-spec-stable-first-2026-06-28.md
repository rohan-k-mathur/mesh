# Session 21 — The shared additive layer: `⟦·⟧₊` translation spec + the stable-first shakedown (Q-039 / Q-002)

**Date:** 2026-06-28
**Direction:** 1 — The foundational bridge (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §1), additive generalisations of the grounded keystone
**Status:** **Scoping — OPEN** (no kernel changed, no theorem proved, no translation written). This session opens the **build** that [session 12](12-additive-frontier-preferred-stable-multiagent-2026-06-14.md) scheduled. Session 12 named the cluster, graded each component, and fixed the order (shared `⟦·⟧₊` → stable → preferred → Q-002); this session is the **translation spec** for the shared layer — the additive analogue of [session 02b](02b-translation-spec-af-to-designs-2026-06-02.md) — and the concrete design of the **stable** differential shakedown. It does **not** discharge any obligation.
**Continues:** the grounded keystone [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) (established 2026-06-03, cross-checked), reusing its **test-then-prove** method verbatim: extract / verify the pure kernel path → stand up a differential harness against an exact Dung left-hand side → only then attempt the keystone-style lemma.

> Reading order: [session 12](12-additive-frontier-preferred-stable-multiagent-2026-06-14.md)
> (the cluster scoping — grades, build order, the §1 "same `&`/`⊕` algebra" bet),
> [session 02b](02b-translation-spec-af-to-designs-2026-06-02.md) (the grounded
> translation spec this extends — especially **decision #3, distinct subaddresses**,
> which additives relax, and §3's open-decisions discipline), [T005 Lemma A +
> §Scope](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) (where the
> additive-free reduction to a plain alternating walk is made explicit), and
> [C011](../03_CONJECTURES/C011-additive-preferred-games-bridge.md) (the
> preferred/stable conjecture this layer serves).

---

## 0. The problem in one sentence

T005 keeps **all the choice in the external quantifier**: acceptance is `∃σ ∀τ.
interact(σ, τ) = CONVERGENT` over an *enumerated* set of strategy designs
([`enumerateStrategies`](../../lib/bridge/dispute.ts)), and each individual design is
choice-free (multiplicative, additive-free — decision #3 gives every advanced
argument a distinct subaddress, so no two ramifications collide). The additive
frontier is the proposal to **internalise that choice into a single additive
design** using `&`/`⊕`, exercising the kernel path that already exists for exactly
this (`isAdditive` / `usedAdditive` / `additive-violation` in
[`stepCore.ts`](../../packages/ludics-engine/stepCore.ts)) but has **never been
driven by a translation**. Everything in this session is the spec for that
internalisation plus the smallest test that would falsify it.

---

## 1. What the kernel actually gives us (the load-bearing finding)

Before writing `⟦·⟧₊`, pin down the additive primitive the engine implements, read
directly off [`stepCore.ts`](../../packages/ludics-engine/stepCore.ts):

- **An *additive parent* is a choice point.** `isAdditiveParent(childPath)` returns
  the parent path iff some act at the parent locus carries `isAdditive: true`. When
  a positive act fires at a child of such a parent, the kernel records
  `usedAdditive[parentPath] = childSuffix`.
- **The discipline is exclusive choice.** If a *different* child suffix was already
  committed at that parent, the run breaks `DIVERGENT` with `reason:
  'additive-violation'` (and records the offending locus as `divergenceLocus`).
  I.e. the kernel enforces **"commit to exactly one child of an additive locus;
  a second, distinct child diverges."**

**Finding (to be recorded as a scoping fact, not a premise).** The kernel exposes
**one** additive mechanism: *exclusive superposition* at a marked locus. It does
**not** carry two separate flags for `&` vs `⊕`. The `&` (opponent's *external*
choice of test) vs `⊕` (proponent's *internal* choice of defence) distinction of
[C011](../03_CONJECTURES/C011-additive-preferred-games-bridge.md) / session 12 §3.1
is therefore **not** a difference in act-flag but a difference in **which side owns
the superposed locus and how the design pool is quantified**:

- `⊕` (proponent internal choice) = an `isAdditive` locus on the **Proponent**
  design; the *single* design picks one branch during interaction. This is what
  *collapses* an `∃σ` disjunction over PRO strategies into one design.
- `&` (opponent external choice) = an `isAdditive` locus on the **Opponent** test;
  the proponent must be orthogonal to the test *whichever* branch the opponent
  commits — recovered by the **`∀` over the opponent behaviour / test pool**, with
  the per-run exclusive-choice discipline supplying one branch at a time.

So the `&`/`⊕` duality lives in the **quantifier structure over the (now additive)
design pool**, riding on a *single* kernel primitive. This is the first thing the
shared layer must validate; if it is wrong (e.g. faithful `&` needs a second,
*conjunctive* additive discipline the kernel cannot express — "answer every branch
in one run"), the kernel itself needs an extension and that is a finding, not a
failure.

---

## 2. The translation `⟦·⟧₊` (definition — to be tested, then proved)

> ⚠️ Everything in §2 is a **definition**; the correspondence in §3 is a
> **conjecture to be tested (shakedown) then proved (keystone lemma)** — never
> assumed. Mirrors the 02b discipline.

`⟦·⟧₊` extends [`buildDisputeDesign`](../../lib/bridge/dispute.ts) by **relaxing
decision #3 exactly at game branch points** and nowhere else. Concretely, three
local edits to the grounded encoding:

### 2.1 Proponent defence choice → `⊕` (Proponent-side `isAdditive` locus)

In the grounded encoding, at a CON-attacked locus PRO counters with **un-used
attackers** and the *external* enumeration forks one strategy per choice
([`enumerateStrategies(... "PRO" ...)`](../../lib/bridge/dispute.ts)). In `⟦·⟧₊`:

- emit a **single** design in which the PRO-counter locus is marked
  `isAdditive: true`, with one child per available counter `c ∈ att⁻(b) \ used`;
- the interaction commits to one child (the kernel's `usedAdditive` records it);
  a second distinct counter at the same locus is `additive-violation` — which is
  exactly "PRO already chose its defence on this line."

This replaces the `∃σ` enumeration over PRO defences with a **design-internal `⊕`
superposition**. The `acceptableByInteraction` quantifier loses its outer `∃σ` for
the additive-internalised branches.

### 2.2 Opponent attack-line choice → `&` (Opponent-side `isAdditive` locus)

In the grounded encoding, CON's alternative attack lines are covered by the
`cartesianMerge` over opponent options (a strategy must answer *every* branch the
opponent can force). In `⟦·⟧₊` the opponent's alternative attack lines at a target
become a **`&`-superposition** on the Opponent test: one `isAdditive` Opponent
locus with a child per attacker. The proponent design must be orthogonal to the
test **whichever** branch the opponent commits — preserved by the `∀τ` over the
opponent test pool (each `τ` commits one `&`-branch per run).

### 2.3 Everything else stays decision-#3 (distinct subaddresses, multiplicative)

Loci that are **not** game branch points keep distinct subaddresses and the plain
alternating-walk semantics of T005 Lemma A. The additive content is **localised to
the branch points** — that localisation is the entire claim. (This is the precise
operational reading of session 12's "relax decision #3 *precisely where the game
branches*.")

---

## 3. The bridge claim, restated per semantics (operational form)

For the additive translation and the canonical predicate `D ⊥ E ⟺ stepCore(⟦D⟧,
⟦E⟧).status === "CONVERGENT"`:

- **Stable (the shakedown — expected to go through).** `a` is **credulously
  accepted under stable** ⟺ `⟦a⟧₊⁺` realises a **conflict-free, all-attacking**
  labelling orthogonal to the `&`-superposed opponent behaviour. Stable is a
  *quantifier-plus-constraint* change over T005's Lemmas A–B (conflict-free +
  every outside argument attacked), **not** fundamentally a branching change —
  hence the shakedown target.
- **Preferred (the obstruction — pre-registered).** `a` credulously accepted under
  preferred ⟺ some `⊕`-branch of `⟦a⟧₊⁺` is orthogonal to every `&`-branch of the
  opponent behaviour, **and** the realised admissible set is `⊆`-maximal. The
  **maximality** clause has no obvious local/interactive counterpart (the
  global-fixpoint-vs-local-interaction tension, concentrated). Per programme
  discipline, **if maximality resists, the deliverable flips** to a *realizability
  characterization* (which Dung semantics are interactively realizable over
  additive orthogonality) — itself the publishable result (brainstorm §1).

The **left-hand sides are exact and trustworthy** (consolidation roadmap fully
implemented): stable via
[`stableExtensions`](../../lib/argumentation/semantics.ts), preferred via
[`preferredExtensions`](../../lib/argumentation/semantics.ts), both over
`completeExtensions` /
[`labelling.ts`](../../lib/argumentation/labelling.ts). The only unknown is the
Ludics predicate + `⟦·⟧₊`, exactly as in the grounded Phase 2.

---

## 4. Build steps (the shared layer, then stable)

Mirrors the T005 path; each step is independently checkable and gates the next.

### Step A — Kernel `&`/`⊕` verification *in isolation* (de-risk before translating) — **DONE 2026-06-28**

The kernel additive path had never been driven by a translation. **Before** wiring
`⟦·⟧₊`, drive `stepCore` directly with **hand-built additive designs** and freeze
its behaviour, analogous to
[`tests/bridge/stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
for the multiplicative path. New `tests/bridge/stepcore-additive.test.ts` asserting,
at minimum:

1. committing one child of an `isAdditive` parent → run continues, `usedAdditive`
   records the suffix;
2. committing a **second, distinct** child → `DIVERGENT` / `additive-violation`,
   `divergenceLocus` = the offending child;
3. re-committing the **same** child (idempotent choice) → no violation;
4. an `isAdditive` parent with a single child behaves as the multiplicative case
   (additives degenerate to multiplicatives at arity 1).

This is the "verify the kernel's additive path" half of session 12's shared layer,
and it is **cheap and self-contained** — do it first. **Landed** as
[`tests/bridge/stepcore-additive.test.ts`](../../tests/bridge/stepcore-additive.test.ts)
(4/4 green; full bridge suite 12 suites / 74 tests green). All four invariants
hold against the real kernel, confirming the §1 finding: the additive primitive
is exclusive superposition at an `isAdditive`-opener locus, the flag adds only
`usedAdditive` bookkeeping at arity 1 (invariant 4), and a second distinct sibling
is the `additive-violation` breach (invariant 2).

### Step B — Implement `⟦·⟧₊` (additive extension of `buildDisputeDesign`) — **DONE 2026-06-28**

A new emitter (extend [`lib/bridge/`](../../lib/bridge), do **not** mutate the
established grounded `dispute.ts` surface that T005 depends on — add alongside,
e.g. `lib/bridge/disputeAdditive.ts`) realising §2.1–§2.3: `isAdditive` Proponent
loci at PRO defence forks, `isAdditive` Opponent loci at CON attack-line forks,
distinct subaddresses everywhere else. Plus the additive acceptance predicate
(the `⊕`/`&`-quantified analogue of `acceptableByInteraction`).

**Landed** as [`lib/bridge/disputeAdditive.ts`](../../lib/bridge/disputeAdditive.ts)
(`buildAdditiveDisputeDesign`, `acceptableByAdditiveInteraction`, `forkCensus`) +
optional `isAdditive?` on [`BridgeAct`](../../lib/bridge/types.ts) (non-breaking;
the grounded emitter never sets it), exported from
[`lib/bridge/index.ts`](../../lib/bridge/index.ts). Validated by
[`tests/bridge/additive-internalisation.test.ts`](../../tests/bridge/additive-internalisation.test.ts)
(6/6 green; full bridge suite 13 suites / 80 tests; lint clean): (1) **structural**
— additives land *exactly* at forks (`&` on a PRO-assertion opener with ≥2 attack
lines, `⊕` on a CON-attack opener with ≥2 un-used counters), single-line disputes
carry none; (2) **kernel-driven** — the REAL `stepCore` over the isAdditive-
annotated resolved designs reproduces grounded acceptance over every AF on
`n ≤ 3`; (3) **predicate agreement** — `acceptableByAdditiveInteraction` (`∃ρ∀τ`
over additive resolutions) `⟺` the established grounded `acceptableByInteraction`.
**§6 decision 1 discharged** (the `⊕`-internalisation reproduces `∃σ`); **§1 finding
confirmed in the emitter** — the `&`-marker on a PRO-assertion opener is
documentary (the kernel fires only on positive children), the `⊕`-marker is
verdict-bearing, the duality is in the test-pool quantifier.

### Step C — Stable differential harness (the shakedown) — **DONE 2026-06-28, PASS**

New `tests/bridge/preferred-stable-additive.property.test.ts` over the local
`allAFs(n)` generator (already copied into several bridge tests, e.g.
[`keystone-simulation.exhaustive.test.ts`](../../tests/bridge/keystone-simulation.exhaustive.test.ts)),
`n ≤ 3`, exhaustive + a randomised tail:

- **LHS oracle:** `stableExtensions(dg)` → `a` credulously-stable-accepted ⟺
  `∃ E ∈ stable. a ∈ E`; skeptically ⟺ `∀ E ∈ stable. a ∈ E` (handle the
  **empty-stable** edge case explicitly — no stable extension ⇒ vacuous skeptical
  acceptance, no credulous acceptance).
- **RHS:** the §3 additive-orthogonality predicate over `⟦·⟧₊`.
- **Assertion:** RHS ⟺ LHS over every `(F, a)`, zero skips on `n ≤ 3`; feed any
  disagreement back here as a findings note (it localises whether the bet of §1 /
  session 12 holds).

**Land stable green before touching preferred.** It is the additive translation's
shakedown and the precondition for trusting any preferred-axis result.

**Landed** as [`tests/bridge/preferred-stable-additive.property.test.ts`](../../tests/bridge/preferred-stable-additive.property.test.ts)
+ the stable reading in [`disputeAdditive.ts`](../../lib/bridge/disputeAdditive.ts)
(`conflictFree`, `allAttacking`, `isStableByAdditive`, `stableExtensionsByAdditive`,
`credulouslyStableByAdditive`, `skepticallyStableByAdditive`). 6/6 green; full
bridge suite 14/86; lint clean. **Result: stable PASSES** — the additive
commit-set reading reproduces `stableExtensions` *exactly* and credulous/skeptical
agree with the Dung oracle over every AF on `n ≤ 3`. **Finding (pre-registered by
§3): the grounded interactive descent does NOT compute stable.** The 2-cycle
`a ↔ b` is the witness — `{a}` is stable so `a` is credulously stable, yet the
grounded game rejects `a` (PRO-no-repeat forbids re-asserting `a` to answer `b`).
Stable is therefore the `⊕`-commit-set + one-shot orthogonality to the
`&`-superposed universal test (conflict-free + all-attacking), **not** the
recursive game — confirming stable as the constraint-driven shakedown. Step D's
empty-stable convention is set: no stable extension ⇒ nothing stably justified.

### Step D — Preferred + the realizability fork (only after stable is green) — **DONE 2026-06-28, REALIZABILITY OUTCOME**

Add `preferredExtensions` as a second LHS oracle and the maximality clause to the
RHS. Attempt the keystone-style isomorphism lemma; **on maximality resistance,
characterise the obstruction** (the realizability deliverable) rather than forcing
it. This step is where the §1 bet is most likely to bend.

> **Ratified-subgraph governance note (carried from session 12).** Preferred /
> stable are sensitive to *which* attack edges are present (unlike grounded, which
> composes benignly with [session 13](13-attack-ratification-layer-2026-06-14.md)'s
> ratified subgraph `F_rat ⊆ F_full`). The stable/preferred harness and any lemma
> must be explicit about **which subgraph it realises over** (full vs ratified) —
> a scoping obligation, and it sharpens the realizability fallback with a
> governance dimension. Not an obstruction; state it up front.

---

## 5. Where Q-002 re-enters

This session builds the **shared** layer; Q-002 (multi-agent Reading C) consumes it
on the *participant* axis but is **not** built here. Per session 12 §4 and
[session 15](15-q002-q003-sequencing-2026-06-16.md), Q-002 follows stable (Phase C
of session 15: a T005-style smallest-non-trivial **three-agent base case** with an
exhaustive differential check, before the general [T012](../03_CONJECTURES/C002-reading-c-conservative.md)
fidelity theorem). The relevant reuse: the `&`-superposition of opponents (`|W| ≥ 3`)
and the "nesting doesn't change the verdict" coherence are the **same** kernel
exclusive-choice primitive (§1), applied to participants rather than defence lines —
which is exactly the §1 bet, now spent a second time. The falsification mode
(session 12 §1): if Reading-C nesting is genuinely **non-associative** where the
preferred game branching is associative, the cluster splits and each axis carries
its own additive discipline.

**Base case RUN 2026-06-28, conservative.** [`tests/bridge/reading-c-conservativity.test.ts`](../../tests/bridge/reading-c-conservativity.test.ts)
(2/2; bridge suite 15/93): over every AF whose claim has ≥3 attack lines (three
genuine opponents), the `&`-superposed three-opponent Reading-C verdict equals the
conjunction of the bilateral Reading-A pairs, and is **nesting-invariant** (every
permutation of the three pairs gives the same AND); acceptance `= ∃ρ∀W` coincides
with grounded. The `&`-as-`∀` finding makes nesting associative on this fragment —
no cluster-split witness at the base case. General [T012](../03_CONJECTURES/C002-reading-c-conservative.md) fidelity theorem + polarity-shift case remain.

**Polarity-shift base case RUN 2026-06-28, verdict-neutral.** Same harness, the
active witness changes mid-interaction (interleaved opponent lines, ≥2 distinct
first-movers): the shifted Reading-C verdict equals the conjunction of the
per-witness bilateral verdicts — the shift is verdict-neutral, since each pair is
independent and `&` = `∀`. So both `|W| ≥ 3` nesting and the active-witness shift
are conservative at the base case; the general T012 lift (translation lemma +
fidelity proof for arbitrary `|W|`) is the remaining proof obligation.

---

## 6. Open design decisions (resolve empirically in Steps A–C, 02b §3 discipline)

1. **Does `⊕`-internalisation faithfully reproduce `∃σ`?** Collapsing the external
   PRO-strategy enumeration into one additive design (§2.1) is the central bet.
   The exclusive-choice discipline must not lose a winning defence the enumeration
   would have found. Pin against the grounded fixtures first (the additive design
   at arity-1 loci must agree with T005).
2. **Does `&` need a *conjunctive* discipline the kernel lacks?** §1 reads `&` as
   `∀` over the test pool with per-run exclusive choice. If faithful `&` instead
   needs "answer every branch **within one run**," the kernel's single
   exclusive-superposition primitive is insufficient and an extension is the
   finding.
3. **Daimon placement under additive choice.** Where `†` sits relative to an
   `isAdditive` locus (concede the chosen branch vs concede the superposition)
   changes which interactions converge. Pin on the 2-cycle / 3-cycle fixtures, as
   decision #2 was pinned for grounded.
4. **Termination / fuel under additive designs.** PRO-no-repeat bounded the
   grounded line length; confirm the additive designs stay within `stepCore`'s
   fuel and that exhaustion is treated as `ONGOING` (a finding), never a verdict.
5. **Which subgraph (full vs ratified)** the stable/preferred realisation is stated
   over (§4 governance note).

---

## 7. Decisions recorded (folder discipline: conjecture / resolved / parked)

- **conjecture (carried, sharpened)** — the `&`/`⊕` branching of preferred/stable
  and the participant-superposition of Reading C are **one** kernel primitive
  (exclusive superposition at an `isAdditive` locus), the duality living in the
  *quantifier over the design pool* (§1), not in two act-flags. Falsifiable per §6
  decisions 1–2 and §5 (non-associative nesting). Not promoted to a premise.
- **resolved (build order)** — Step A (kernel additive verification, isolated) →
  Step B (`⟦·⟧₊`) → Step C (stable differential, must be green) → Step D
  (preferred + realizability fork). Consistent with session 12 §4 and the standing
  grounded → stable → preferred order.
- **resolved (no-mutation)** — add `⟦·⟧₊` alongside `dispute.ts`; do **not** alter
  the established grounded surface T005's discharge test guards.
- **resolved (obstruction posture)** — preferred maximality is a pre-registered
  acceptable *negative*: a realizability characterization is a deliverable. No
  forcing.
- **parked** — Q-002's three-agent base case + the [T012](../03_CONJECTURES/C002-reading-c-conservative.md)
  fidelity theorem (Phase C/D of [session 15](15-q002-q003-sequencing-2026-06-16.md));
  the full preferred isomorphism lemma. Scheduled, not attempted here.

## 8. Next concrete step

**Steps A–D are done; the shared additive layer is built, stable PASSES, and
preferred yields the realizability characterization.** Bridge suite 14 suites /
91 tests green. The differential settlement of the *semantics* axis is in hand
(grounded → stable → preferred-admissibility interactive; maximality a constraint);
remaining is the keystone-style *proof* of the stable/admissibility correspondence
(promote toward C011) and the **participant axis Q-002**: a smallest-non-trivial
three-agent base case (T005-style exhaustive differential) reusing this `⊕`/`&`
machinery, before the general T012 fidelity theorem. Next: scope the Q-002
three-agent base case on the shared layer.

**Update 2026-06-28:** Q-002 three-agent + polarity-shift base cases corroborated; keystone [T015](../02_THEOREMS_AND_PROOFS/T015-additive-realizability-keystone.md) **established** (cross-checked). Remaining: general T012 fidelity proof; T015 residuals (strategy-iso, n-unbounded).
