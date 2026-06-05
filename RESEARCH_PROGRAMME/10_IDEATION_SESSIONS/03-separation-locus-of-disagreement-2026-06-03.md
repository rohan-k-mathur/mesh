# Session 03 — Separation: the locus of disagreement as a theorem

**Date:** 2026-06-03
**Direction:** 2 — Separation / locus of disagreement (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §2)
**Status:** **Planning / problem statement** (no theorems claimed; no code changed)
**Purpose:** turn the §2 narrative into a precisely-scoped problem with a stated
minimality conjecture ([C012](../03_CONJECTURES/C012-separation-minimal-locus.md))
and a registry entry ([Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040)), grounded
in the interaction machinery that already exists in the repo.

---

## 0. Why now

Two preconditions are met as of 2026-06-03, which is what schedules this
direction next (see the sequencing decision in
[`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md) — *Foundational program
— research-direction sequencing*):

- **Direction 1's keystone landed.** The grounded↔Ludics bridge is proved on the
  grounded fragment ([T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md),
  established), so the translation `⟦·⟧` from disputes to designs and the
  canonical orthogonality predicate (`stepInteraction` ⇓ `†`) are pinned and
  trusted. Separation is stated *over the same translated designs*.
- **Direction 3's quantitative core shipped.** Confidence is now a lawful
  log-odds semiring (DS retired), so the separation work does not have to wait on
  any quantitative settlement and inherits a stable scoring substrate.

The platform already sells "we locate exactly where you disagree" (the contested
frontier / gap-identification surface). Today that is a heuristic over the
interaction trace. Direction 2 asks for the theorem that makes the claim a
consequence of Girard's separation theorem rather than an engineering promise.

## 1. The headline finding: the divergence endpoint already exists

As with the foundational bridge, the work is **not** greenfield. The interaction
kernel already computes *where* two designs stop matching; what is missing is the
extraction of that address as a first-class object and the **minimality**
argument over it.

| What | Where | Signature / note |
|------|-------|------------------|
| Interaction / normalization (DB) | [`packages/ludics-engine/stepper.ts`](../../packages/ludics-engine/stepper.ts) | `stepInteraction(...)` → `status ∈ {CONVERGENT, DIVERGENT, STUCK, ONGOING}` |
| Pure decision kernel | [`packages/ludics-engine/stepCore.ts`](../../packages/ludics-engine/stepCore.ts) | decides `DIVERGENT` at a determinate `locusId` (`nextPos.act.locusId`); zero I/O — the trustworthy left-hand side for differential tests |
| Orthogonality predicate (substrate) | [`packages/ludics-engine/checkOrthogonal.ts`](../../packages/ludics-engine/checkOrthogonal.ts) | `orthogonal = status === 'CONVERGENT'` |
| Orthogonality + bi-orthogonal closure (in-memory) | [`packages/ludics-core/dds/landscape/behaviour-computer.ts`](../../packages/ludics-core/dds/landscape/behaviour-computer.ts) | `converges`, `computeOrthogonal`, `computeBiorthogonalClosure` |
| Pure stepper (in-memory) | [`packages/ludics-core/dds/interaction/stepper.ts`](../../packages/ludics-core/dds/interaction/stepper.ts) | in-memory normalization |
| Dispute translation `⟦·⟧` | [`lib/bridge/dispute.ts`](../../lib/bridge/dispute.ts) | `buildDisputeDesign`, `acceptableByInteraction` (Direction 1) |

**Consequence for planning.** When `stepCore` returns `DIVERGENT`, the locus at
which it broke (`nextPos.act.locusId`, mapped to a path via `pathById`) **is** the
first-divergence address. So the *easy half* — uniqueness of the first-divergence
address within one dispute — is essentially already in hand operationally; the
remaining R&D is (a) extract it as a typed object with a stable address, and (b)
prove the *load-bearing* half.

## 2. The problem, stated precisely

Fix the Direction-1 setting: a finite abstract AF `F = (A, ⇝)`, the translation
`⟦·⟧` into the multiplicative, additive-free fragment (distinct subaddresses per
argument), and canonical orthogonality (`stepInteraction` ⇓ `†`). Let `D` be a
Proponent dispute design and `E` a non-orthogonal Opponent design — `⟨D ∣ E⟩`
diverges.

Two readings of "where they disagree":

- **(Easy) First-divergence locus.** Along the single normalization run
  `⟨D ∣ E⟩`, there is a determinate first address `ξ` at which the two strategies
  stop matching (the `DIVERGENT` locus of `stepCore`). *Claim E0:* `ξ` is unique
  and computable. This is plausibly a short proof: the run is deterministic and
  the break condition is the first unmatched positive.

- **(Load-bearing) Minimal separating context.** `D` and `E` non-orthogonal means,
  by Girard's separation theorem (the Ludics analogue of Böhm's theorem), there is
  a *separating context* `C[-]` — a design/test that interaction distinguishes `D`
  from at least one alternative on. *Claim C012:* the first-divergence locus `ξ`
  determines **the minimal separating context across all opponent designs** — `ξ`
  is *the* minimal unshared commitment (a presupposition one party holds and the
  other challenges or lacks), not merely *a* separating one.

The distinction is the whole point. E0 is about one dispute; C012 quantifies over
**all** opponent designs and asserts minimality. The minimality argument, not the
uniqueness, is the real theorem — and is what licenses the product claim
"the platform identifies exactly where you disagree."

## 3. Where the difficulty actually lives

- **Easy (E0):** determinism of the run + "first unmatched positive" gives
  uniqueness and computability of the first-divergence address. Risk: low. Mostly
  an extraction + statement exercise against `stepCore`.
- **Hard (C012):** minimality across the opponent design space. Two sub-risks:
  1. *Order on contexts.* "Minimal" needs a partial order on separating contexts
     (by address prefix / sub-design inclusion) under which `ξ`'s context is least.
     Stating this order so that least exists and is unique is itself substantive.
  2. *Quantifier scope.* The separation theorem gives existence of a separating
     context; lifting it to "the first-divergence locus *is* the minimum over the
     whole `D⊥` test space" is the gap. The additive-free fragment (inherited from
     T005) is a help here — branching is exactly where minimality could fail, and
     it is excluded on the grounded fragment.

**Program discipline (per the brainstorm):** if minimality resists, the precise
obstruction — the smallest pair `(D, E)` and order on contexts for which the
first-divergence locus is *not* the minimum — is itself the publishable result.
Do not promote C012 to a premise before it is proved.

## 4. Plan (test-then-prove, mirroring Direction 1)

- **Phase 0 — extract the locus.** Surface the first-divergence address from
  `stepCore` as a typed return (`divergenceLocus?: LocusPath` alongside `status`),
  with a pure helper. Differential-test it against `stepInteraction`. Prove E0
  (uniqueness/computability) as the warm-up lemma.
- **Phase 1 — state the order.** Define the partial order on separating contexts
  and the "minimal unshared commitment" object. Pin it against the contested-
  frontier / gap-identification surface so the theorem and the feature name the
  same thing.
- **Phase 2 — corroborate.** Over `allAFs(n)` (reuse the Direction-1 harness),
  check empirically that the first-divergence locus coincides with the minimum
  separating context across enumerated opponent designs. A counterexample here
  *is* the negative settlement and redirects the conjecture.
- **Phase 3 — prove C012** via Girard separation on the additive-free fragment.
- **Parallel (Direction 5).** Formalize the separation theorem in Agda; this is
  both the Direction-5 deliverable and the strongest check on the Phase-3
  minimality argument.

## 5. Decisions recorded

- **Conjecture (not premise):** the minimal-separating-context claim is filed as
  [C012](../03_CONJECTURES/C012-separation-minimal-locus.md), open. The easy half
  (E0) is stated inside it as the warm-up lemma, explicitly *not* the theorem.
- **Scope = the T005 fragment:** abstract AF, multiplicative/additive-free,
  canonical orthogonality. Preferred/stable (additive) separation is out of scope
  until [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) lands; branching is exactly
  where minimality is fragile.
- **Registry:** [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) registers the
  biconditional question and points at C012.

## 6. Bibliography

- Girard 2001, *Locus Solum: from the rules of logic to the logic of rules* (MSCS
  11) — separation theorem, behaviours as `G = G⊥⊥`, the divergence/orthogonality
  apparatus.
- Böhm 1968 — the λ-calculus separation theorem of which Ludics separation is the
  analogue.
- In-repo: [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md),
  [session 02 / 02b](02-foundational-bridge-dung-ludics-2026-06-02.md),
  [C010](../03_CONJECTURES/C010-grounded-orthogonality-bridge.md),
  [`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](../09_FUTURE_DIRECTIONS_BRAINSTORM.md) §2.

---

**Output promoted to:** [C012](../03_CONJECTURES/C012-separation-minimal-locus.md)
(minimality conjecture) and [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040)
(registry). This session is the problem statement; the formal tracking lives
there.

---

## Addendum — Phase 0/1 progress (2026-06-04)

- **Phase 0 (done).** First-divergence locus extracted from `stepCore` as the typed
  field `divergenceLocus` (pure projection `divergenceLocusOf`), threaded through
  `stepInteraction`, and differential-tested
  ([`tests/bridge/divergence-locus-differential.test.ts`](../../tests/bridge/divergence-locus-differential.test.ts)).
  The **E0** warm-up lemma is proved and cross-checked as
  [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md) (`established`).
- **Phase 1 (done).** The partial order `⊑` (prefix-on-anchors) on separating
  contexts and the **minimal unshared commitment** object `ξ*` (the `⊑`-least
  first-divergence anchor over `D⊥`) are defined in
  [C012 §Phase 1](../03_CONJECTURES/C012-separation-minimal-locus.md), and pinned to
  the contested-frontier surface ([`lib/deliberation/frontier.ts`](../../lib/deliberation/frontier.ts),
  the `/frontier` route, `FrontierLane.tsx`) via the `⟦·⟧` translation. No code is
  rewired — the frontier-sourcing rewire is gated on Phase 3.
- **Phase 2 (done).** The order and the minimal-anchor reducer landed as pure code
  ([`packages/ludics-engine/separation.ts`](../../packages/ludics-engine/separation.ts):
  `isPrefixLocus`, `minimalAnchor`), and cross-opponent minimality is **corroborated
  exhaustively over `allAFs(n)`, `n ≤ 3`**
  ([`tests/bridge/separation-minimal-locus.test.ts`](../../tests/bridge/separation-minimal-locus.test.ts)):
  for every Proponent design `D`, `Sep(D)` has a unique `⊑`-least `ξ*`, realised by a
  single dropped-dual opponent, and the anchors always form a `⊑`-chain (the
  additive-free fragment never produced the incomparable negative-settlement shape).
  The reducer is checked against an independent shallowest-prefix-least oracle. All
  green, lint clean.
- **Phase 3 (done).** **Proved for the additive-free T005 fragment** in
  [C012 §Phase 3](../03_CONJECTURES/C012-separation-minimal-locus.md), two layers:
  *Lemma A* — for a fixed disagreement `(D, E)`, `ξ(E)` is the `⊑`-least separating
  context (the shortest prefix of `E` that already diverges; minimal *relative to the
  common ground granted*), proved from E0's first-unmatched-positive characterisation;
  *Lemma B* — over all opponents, `Sep(D)` is the rooted tree of `D`'s positive loci,
  so the cross-opponent minimum exists, is unique, and is realised (a chain in the
  linear case the Phase-2 harness measured). Recorded boundaries: the absolute
  cross-opponent minimum is the trivial root `ξ₀` (the operative object is Lemma A's
  relative minimum); the chain property is the linear restriction; the additive case
  stays out under Q-039.
- **Phase 3 cross-check + rescope + promotion (2026-06-04).** Independent cross-check
  audited Lemma A/B against the kernel and found the *general branching* direction
  overreaches: a probe showed `stepCore` **mis-diverges off-thread** on a branching
  `⟦D⟧` (single test via the `0.2` line → `divergenceLocus = "0.1.1"`, incomparable to
  the realized thread), because `findNextPositive` has no reachability gate. **Route
  (b)** (a sequentiality lemma to recover the branching case) was attempted and found
  to require a kernel change — deferred as [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041).
  **Route (a)** taken: the lemmas were **rescoped to the single realized-chronicle
  fragment** and **promoted to
  [T007](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md)**.
- **T007 cross-check → leastness refuted → Repair 1 (2026-06-04).** The dedicated
  T007 cross-check then found a **blocking defect even in the linear fragment**:
  Lemma A's *leastness* half is false against the kernel. For a truncated test `E↾ℓ`
  with `ℓ ⊏ ξ(E)` at **odd** chronicle depth, `⟨D ∣ E↾ℓ⟩` diverges at a `⊑`-smaller
  locus (length-5 witness: `ℓ = "0.1"` → `DIVERGENT` at `"0.1.2"` vs
  `ξ(E) = "0.1.2.3.4"`), so `ξ(E)` is *a* separating context, not *the* `⊑`-least one.
  A follow-up probe sharpened it: the over-run is a **justified `D`-move**, so neither
  a reachability gate nor daimon-padding repairs it — only an orthogonality-verdict
  change, which touches the established-T005 discharge test. **Repair 1 applied:**
  T007 narrowed to "`ξ(E)` is a determinate separating context + the anchors form a
  `⊑`-chain with least `ξ*`" and promoted to `established` (narrowed); the
  **minimality claim is removed** and re-filed open at
  [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) (now covering both the
  linear-leastness and branching obstructions). [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040)
  is **not** closed for minimality; the contested-frontier rewire stays gated off.
- **Next:** minimality recovery under Q-041 — write the missing **truncation harness**,
  then decide R1 (kernel justification-gate, guarded by the T005 discharge test) vs R2
  (abstract Ludics separating-context). Direction 5 (Agda separation) runs in parallel.

---

## Synthesis — what the Repair-1 outcome means for Direction 2 (2026-06-04)

A zoom-out, recorded so the strategic reading is not lost between sessions. (No new
claims; this interprets the [T007](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md)
cross-check and [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041).)

- **The difficulty moved, and moved upstream.** The brainstorm
  ([`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](../09_FUTURE_DIRECTIONS_BRAINSTORM.md) §2)
  bet that uniqueness (E0) is easy and *minimality across `D⊥`* is the real theorem,
  expecting minimality to be fragile **at branching**. E0 is indeed easy (T006) and
  minimality is indeed the theorem — but it fails **one level upstream of branching**:
  on a *single linear chronicle* against a *single* opponent, via **truncated tests**.
  The §2 framing "most directly achievable of the major results" is falsified, and
  *why* it is falsified is the finding.
- **Root cause is the predicate, not the proof.** `stepCore`'s canonical orthogonality
  **conflates "the test ran out of acts" with "the test refuses here."** When `E↾ℓ` is
  exhausted and `D` plays a *justified* positive past it, the kernel reports
  `DIVERGENT` (`incoherent-move`), but semantically the test merely *ended*. A raw
  truncation is not a legitimate Ludics test (a proper counter-design plays daimon on
  its own turn when done), so "separating context = `E↾ℓ`" has no clean `⊑`-order
  behaviour. Daimon-padding doesn't fix it (over-run is on `D`'s turn); a reachability
  gate can't (nothing is unreachable) — only a **verdict** change would.
- **It reaches back to Phase 1, not just Phase 3.** The cross-check did not only break
  a proof step; it showed the **Phase-1 definitions were over the wrong objects**.
  "Separating context" should be a *complete, daimon-closed* counter-design, not a raw
  truncation, and the order `⊑` should live over those. The parity structure in the
  witness (`ξ(E)` at even depth, separating prefixes at odd depth) is the artifact of
  truncations-as-tests and would likely dissolve once the objects are proper tests.
  Direction 2's definitional core needs *revisiting*, not patching.
- **The Direction-1 tension is the real constraint.** T005's canonical orthogonality
  was validated **only on complete realized plays** (`stepcore-differential.test.ts`
  never truncates). So the same predicate is *correct* for grounded acceptability
  (Direction 1) and *silently wrong* for the minimal-separating-context question
  (Direction 2). The distinction Direction 2 needs (exhausted vs refused) is one
  Direction 1 never required — which is exactly why an R1 kernel change is dangerous,
  with the discharge test as the tripwire.
- **R2 ≡ Direction 5 work.** Defining proper separating contexts and proving
  separation over them *is* the mechanized-Ludics-separation deliverable §5 already
  wants in Agda. R2 is therefore not a detour but the convergence of Direction 2's
  open half with Direction 5; the faithfulness lemma's *failure on truncations* is the
  precise statement of what the kernel would need to change for R1.
- **Status of the three core deliverables.** *Banked:* the first-divergence locus is a
  determinate, unique, computable object (T006) and a genuine separating context with
  a least *anchor* (T007, narrowed). *Gated:* "identifies **exactly** where you
  disagree" — soundly we may say *first* point of divergence, never *minimal* unshared
  commitment. *Already a result:* by program discipline the **obstruction is itself
  publishable** — the length-5 witness + parity structure + exhausted-vs-refused
  diagnosis is a sharper negative result than "branching breaks it," because it is
  about the predicate, not the fragment.
- **The move.** Not more proof attempts against the current kernel. The next real step
  is the **foundational decision R1 (change the orthogonality verdict) vs R2 (redefine
  separating contexts abstractly, with Direction 5)** — taken deliberately. Opened as
  [session 04](04-separating-context-predicate-decision-2026-06-04.md).

