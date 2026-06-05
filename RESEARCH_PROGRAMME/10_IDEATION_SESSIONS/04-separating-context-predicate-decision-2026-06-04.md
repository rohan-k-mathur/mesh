# Session 04 — Separating contexts: change the predicate (R1) or redefine the objects (R2)?

**Date:** 2026-06-04
**Direction:** 2 — Separation / locus of disagreement (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §2), with a hard dependency onto Direction 5 (mechanization)
**Status:** **RESOLVED (2026-06-04) — lead with R2** (redefine separating contexts abstractly as complete daimon-closed counter-designs; ≡ the Direction-5 mechanized-separation deliverable). R1 (kernel-verdict change) is **parked**, to be revisited only if the R2 faithfulness lemma shows the kernel must change. See §6.
**Purpose:** frame the foundational choice that [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) leaves open — **R1** (refine the kernel's orthogonality verdict so truncated tests don't over-run) vs **R2** (redefine "separating context" abstractly as a complete daimon-closed counter-design, prove separation over those, relate to the kernel by a faithfulness lemma) — and decide a sequencing.

> Reading order: this session presupposes the [session 03 synthesis addendum](03-separation-locus-of-disagreement-2026-06-03.md#synthesis--what-the-repair-1-outcome-means-for-direction-2-2026-06-04), [T007 §Cross-check notes / Repair 1](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md), and [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041).

---

## 0. The decision in one sentence

The minimal-separating-context theorem (Q-040) is blocked because the **canonical
orthogonality predicate conflates "the test ran out of acts" with "the test refuses
here"**; we must decide whether to fix that **in the kernel's verdict** (R1) or **in
the definition of the objects the theorem quantifies over** (R2) — and the choice has
consequences for Direction 1 (which shares the predicate) and Direction 5 (which R2
*is*).

## 1. What is actually settled (so the decision isn't re-litigated)

- **E0 / first-divergence locus** — unique, computable, determinate.
  [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md), `established`.
- **`ξ(E)` is a genuine separating context; anchors form a `⊑`-chain with a least
  element `ξ*`** — [T007](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md),
  `established` (narrowed via Repair 1).
- **Minimality is *false as stated* against the current kernel** — the length-5
  witness: truncating `E` at odd-depth `ℓ = "0.1"` gives `⟨D ∣ E↾ℓ⟩` → `DIVERGENT` at
  `"0.1.2"`, a `⊑`-smaller separating context than `ξ(E) = "0.1.2.3.4"`. Reproducible
  from `buildPlayDesigns`/`stepCore`.
- **The over-run is a *justified* `D`-move** (its full locus chain was traversed), so:
  daimon-padding the truncated test does **not** change the verdict, and a
  *reachability* gate has nothing to block. Verified by probe (run transiently, removed).
- **Direction 1's predicate was only ever validated on complete realized plays** —
  [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
  never truncates a test. So the predicate is correct for grounded acceptability and
  silently inadequate for truncation-minimality; **that test is the tripwire for any
  R1 change.**

## 2. The crux: what is a "separating context"?

Two definitions are on the table, and the whole fork is which one the theorem is
*about*.

- **(Raw truncation — current, broken.)** `E↾ℓ` = `E` restricted to acts at loci
  `⊑ ℓ`. Cheap, already in the harness vocabulary, but **not a legitimate Ludics
  test**: it simply stops, and the kernel reads "stopped" as "diverged." This is the
  object Phase 1 implicitly chose, and it is the source of the parity artifact
  (`ξ(E)` even depth, separating prefixes odd depth).
- **(Proper counter-design — Girard-faithful.)** A *complete* design that, on its own
  turn at the frontier `ℓ`, plays daimon (`†`) rather than running out — i.e. it
  *concedes/closes* at `ℓ` instead of being silently absent. Separation in *Locus
  Solum* is stated over these, not over truncations. Over proper tests the
  exhausted-vs-refused conflation cannot arise (the test always has a move: act or
  daimon), so the parity artifact should dissolve and `⊑`-minimality has a chance of
  being true.

> **Working hypothesis (conjecture, not premise):** once "separating context" is a
> proper daimon-closed counter-design, `ξ(E)` *is* the `⊑`-minimal separating context
> on the linear fragment. This is the thing R2 would prove and R1 would make the
> kernel agree with. **Neither is assumed.**

## 3. The two routes

### R1 — change the orthogonality verdict in the kernel

**What.** Refine `stepCore` so that "side-to-move plays a justified positive the other
side does not answer **because the other side has no further acts**" resolves to
`CONVERGENT` (the mover wins / the test conceded), distinct from "…**because the other
side has an act that refuses**" (genuine `DIVERGENT`). Equivalently: make a test's
*running out* behave like a daimon, not like an incoherence.

**Pros.**
- Keeps a single operational predicate; the product surface keeps reading one kernel.
- Directly makes `E↾ℓ` a usable test, so the existing harness vocabulary survives
  (plus a new truncation harness).
- Smallest conceptual surface *if* it doesn't regress Direction 1.

**Cons / risks.**
- **Touches the foundational predicate** that T005 (`established`) depends on. The
  change must provably preserve `stepcore-differential.test.ts` (grounded
  acceptability) *and* the `stepInteraction == stepCore` integration witnesses.
- The exhausted-vs-refused distinction is **not currently representable** — `stepCore`
  has no notion of "this design is complete here" vs "this design happens to have no
  act at this index." Adding it may require a design-completeness flag or a
  daimon-closure pass on inputs, i.e. real kernel surface, not a one-line guard.
- Risk of fixing truncation-minimality while subtly changing some *other* divergence
  verdict that Direction 1 or a downstream caller relies on.

**Guardrails (non-negotiable if R1 is taken).** (i) a **truncation harness** (drop
each suffix of each realized test over `allAFs(n)`, assert the gated verdict matches
the intended chronicle-normalization) — currently missing; (ii) green
`stepcore-differential.test.ts` and the engine integration tests on every iteration;
(iii) the change is gated/feature-flagged until both hold.

### R2 — redefine separating contexts abstractly (≡ Direction 5)

**What.** At the Ludics level, define proper separating contexts (complete,
daimon-closed counter-designs), define `⊑` over *those*, and prove: `D ⊥̸ E` ⟹ the
first-divergence locus is the `⊑`-minimal separating context. Then a **faithfulness
lemma** relates `stepCore ∘ ⟦·⟧` to this abstract normalization on in-scope inputs;
its *failure on raw truncations* is the precise, formal statement of what R1 would
have to change.

**Pros.**
- **This is the Direction-5 deliverable** (§5: "a full formalization of the Ludics
  core — … the separation theorem — in a dependent type theory … people have wanted a
  mechanized Ludics for twenty years"). R2 is not a detour; it *is* that work, now
  with a concrete driving application.
- Proves the theorem where the objects are clean, decoupled from kernel accidents.
- The faithfulness lemma becomes a permanent, precise spec of the kernel's adequacy
  boundary — useful regardless of whether R1 is ever done.

**Cons / risks.**
- **Largest up-front effort**; an abstract separation proof (even on the additive-free
  fragment) is a real undertaking, and in Agda more so.
- Leaves the *operational* surface unchanged: the product still can't source a minimal
  locus from the kernel until/unless R1 (or a verified extractor) lands. R2 proves the
  theorem but does not, by itself, ship the feature.
- Faithfulness may itself fail in instructive ways, deferring the payoff.

## 4. Decision criteria (what should actually drive the choice)

1. **Does the platform need the *operational* minimal locus soon, or the *theorem*
   soon?** R1 is closer to shipping the feature (a gated kernel that returns the
   minimal locus); R2 is closer to the publishable theorem and the Direction-5 export.
2. **Risk tolerance on the shared predicate.** R1 spends risk against an *established*
   result (T005); R2 spends effort but not risk against T005.
3. **Sequencing leverage.** R2 *subsumes* part of Direction 5 already on the roadmap;
   R1 is bespoke to Direction 2. If Direction 5 is going to happen anyway, R2's
   marginal cost is lower than it looks.
4. **Reversibility.** R2 is purely additive (new abstract layer + lemma; nothing
   existing changes). R1 mutates a load-bearing kernel — harder to reverse, must be
   feature-gated.

## 5. Candidate recommendation (to be ratified, not yet a decision)

**Lead with R2, structured so it de-risks R1.** Concretely:

1. **First, write the truncation harness** (needed by *both* routes; cheap; pins O1
   precisely and turns the length-5 witness into a regression fixture).
2. **Then do R2's definitional core** — define proper daimon-closed separating
   contexts and re-derive leastness *abstractly* on the linear fragment (pen-and-paper
   first, Agda as the Direction-5 deliverable). This either proves the working
   hypothesis (§2) or produces a sharper obstruction.
3. **The faithfulness lemma then tells us whether R1 is even necessary** and *exactly*
   what it must change. If faithfulness holds on daimon-closed inputs already, R1 may
   reduce to "feed the kernel proper tests" (a harness/encoding change, not a verdict
   change) — the cheapest possible outcome. If it fails, we have the precise verdict
   change R1 must make, with the truncation harness as its guardrail.

Rationale: this spends **effort before risk**, keeps the established T005 predicate
untouched until we *know* what must change, and merges Direction 2's open half with
Direction 5 rather than running them separately. R1-as-a-blind-kernel-edit is the
thing to avoid.

**Counter-position worth stating:** if the *product* needs "exactly where you
disagree" as a shipped, sound feature on a near horizon, invert the order — do R1
behind a flag first (guarded by the truncation harness + T005 discharge test) to
unblock the surface, and let R2/Direction 5 ratify it afterward. This trades
foundational tidiness for time-to-feature.

## 6. Decisions recorded

- **Route choice — RESOLVED (2026-06-04): lead with R2.** Redefine "separating
  context" abstractly as a complete daimon-closed counter-design, prove the
  minimal-separating-context theorem over those (the linear fragment first), and
  relate to the kernel by a **faithfulness lemma**. This spends *effort before risk*,
  leaves the established T005 predicate untouched, and merges Direction 2's open half
  with the Direction-5 mechanized-separation deliverable. **R1 is parked**, to be
  revisited only if the faithfulness lemma shows the kernel verdict must change — at
  which point the truncation harness + T005 discharge test are its guardrails. The
  product counter-position (ship R1 behind a flag for time-to-feature) is explicitly
  *not* taken now; minimality stays a theorem-first pursuit and the contested-frontier
  rewire stays gated off.
- **Shared prerequisite — AGREED, do first.** The **truncation harness** is needed by
  both routes and is the immediate next step regardless of R2/R1: it is the missing
  corroboration surface and the regression fixture for the length-5 witness, and it
  pins O1 (linear-leastness) precisely as ground truth the abstract proof must match.
  **DONE (2026-06-04):** [`tests/bridge/separation-truncation-harness.test.ts`](../../tests/bridge/separation-truncation-harness.test.ts)
  — freezes the length-5 / length-3 O1 verdict tables and confirms over `allAFs(n)`,
  `n ≤ 3`, that (i) leastness fails on every multi-round realized line (some strict
  prefix `ℓ ⊏ ξ(E)` separates) and (ii) `D` never wins early against a raw truncation
  (no CONVERGENT before `ξ(E)`). This is the ground truth R2's abstract normalization
  must reproduce on truncations; a future R1 changes it on purpose.
- **Non-negotiable guardrail — AGREED.** Any *eventual* kernel change (a revived R1)
  must keep
  [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
  (T005) and the `stepInteraction == stepCore` integration witnesses green, and be
  feature-gated until it does.
- **Working hypothesis — CONJECTURE.** Over proper daimon-closed tests, `ξ(E)` is the
  `⊑`-minimal separating context on the linear fragment. This is exactly what R2 sets
  out to prove; not assumed by any downstream step.

## 7. Open questions this session hands forward

- Can the kernel even *represent* "complete/daimon-closed at `ℓ`" without a schema
  change to `CoreAct` / design inputs? (Determines whether R1 is a guard or a surface.)
- Does the parity artifact (even/odd depth) actually dissolve under proper tests, or
  does a *different* obstruction appear? (Phase-1 redefinition must be checked, not
  assumed.)
- Is the additive-free restriction still the right scope for the *abstract* proof, or
  does R2 naturally cover more? (May interact with [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039).)

## 8. Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — designs, daimon, separation, tests as
  counter-designs.
- Böhm 1968 — the separation theorem analogue.
- In-repo: [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md),
  [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md),
  [T007](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md),
  [C012](../03_CONJECTURES/C012-separation-minimal-locus.md),
  [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) / [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041),
  [session 03](03-separation-locus-of-disagreement-2026-06-03.md),
  [`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](../09_FUTURE_DIRECTIONS_BRAINSTORM.md) §2 / §5,
  kernel [`stepCore.ts`](../../packages/ludics-engine/stepCore.ts).

---

**Handoff:** R1 vs R2 is **ratified — lead R2** (§6). Immediate next step under R2:
write the **truncation harness** (the agreed do-first), then begin R2's definitional
core (proper daimon-closed separating contexts; re-derive leastness on the linear
fragment, pen-and-paper first, Agda as the Direction-5 deliverable). [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)'s
`next-action` is updated accordingly.

---

## 9. R2 landed — leastness recovered, parity artifact dissolved (2026-06-04)

> Status update appended after the R2 definitional core was executed (same day).
> Answers §7's open questions and discharges the working-hypothesis conjecture of §2.

- **The working hypothesis (§2) is PROVED, not assumed.** Over complete
  daimon-closed counter-designs (proper tests), `ξ(E)` *is* the `⊑`-minimal
  separating context on the linear chronicle — [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
  (`established`, cross-checked 2026-06-04; minimality is *relative to the
  disagreement `E`*, the proper-test analogue of T007 Lemma A). The proof: at every
  E-positive frontier `d_j ⊏ ξ(E)` the proper test *concedes* (`†`) and
  `⟨D ∣ Concede_j⟩` is `CONVERGENT` (does not separate); only the genuine
  non-conceding refusal diverges, exactly at `ξ(E)`. So `SepProper(D,E) = { ξ(E) }`,
  minimal.
- **§7 Q1 (can the kernel represent "complete/daimon-closed"?) — not needed for the
  theorem.** R2 builds the proper tests *as inputs* (`Concede_j` carries its
  O-receives and plays `†` at its conceding turn; the daimon is the existing
  structural `kind: "DAIMON"` act, reusing the `stepcore-differential` encoding). No
  schema change. A completeness *flag* is needed only for the parked R1 (to detect
  unfaithfulness on partial inputs) — see the faithfulness failure characterization.
- **§7 Q2 (does the parity artifact dissolve?) — YES.** The odd-depth raw-truncation
  separations sit at exactly the depths where the proper test concedes; the even/odd
  parity table is an artifact of *which receives truncation deletes*, and complete
  tests delete none. Confirmed by the new daimon-closed harness
  ([`tests/bridge/separation-daimon-closed-harness.test.ts`](../../tests/bridge/separation-daimon-closed-harness.test.ts),
  the proper-test analogue of the truncation harness; `allAFs(n)`, `n ≤ 3`).
- **§7 Q3 (right scope?) — linear chronicle is the right scope for R2's first cut.**
  Branching (Q-041 O2) and additive (Q-039) remain out of scope.
- **Faithfulness lemma landed.** `stepCore ∘ ⟦·⟧` is faithful on frontier-complete
  (proper) tests and unfaithful **exactly** on raw truncations; the R1-spec trigger
  is written down (T008 §Faithfulness). R1 stays **parked** — T008 makes it
  unnecessary *for the theorem*; it is needed only for *operational* sourcing of
  `ξ*`, which a verified extractor (feed proper tests) can also supply. The rewire
  stays gated. Registry: [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) O1
  discharged abstractly; [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) recovered
  abstractly, operationally gated.