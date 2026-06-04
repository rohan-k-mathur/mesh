# Session 02 — Planning the foundational bridge: Dung acceptability ↔ Ludics interaction

**Date:** 2026-06-02
**Direction:** 1 — The foundational bridge (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §1)
**Status:** **Planning** (no theorems claimed; no code changed)
**Purpose:** turn the §1 narrative into an executable research-and-development plan, grounded in the machinery that already exists in the repo.

---

## 0. The headline finding: both endpoints already exist

The bridge does **not** start from a greenfield. Both sides of the
correspondence are already implemented and tested; the missing piece is the
*translation functor between them and the equivalence proof*, not the
endpoints themselves.

### Argumentation side (Dung / ASPIC+ extensions)

| What | Where | Signature / note |
|------|-------|------------------|
| Grounded extension (ASPIC+) | [`lib/aspic/semantics.ts`](../../lib/aspic/semantics.ts) | `computeGroundedExtension(args, defeats)` |
| Stable extensions, conflict-free, stable-attack test | [`packages/af/semantics.ts`](../../packages/af/semantics.ts) | `stableExtensions(args, attacks)`, `conflictFree`, `attacksAllOutside` |
| Admissible-set enumeration | [`lib/eval/af.ts`](../../lib/eval/af.ts) | powerset → admissible filter |
| Grounded labelling over the live CEG | [`lib/ceg/grounded.ts`](../../lib/ceg/grounded.ts) | `recomputeGroundedForDelib(deliberationId)` (DB-backed, drives the UI labels) |

### Ludics side (designs / orthogonality / behaviours)

| What | Where | Signature / note |
|------|-------|------------------|
| Orthogonality of two designs (in-memory) | [`packages/ludics-core/dds/landscape/behaviour-computer.ts`](../../packages/ludics-core/dds/landscape/behaviour-computer.ts) | `converges(d1,d2)`, `checkConvergence(d1,d2)` — daimon = convergence; stuck/loop/max_depth = divergence |
| Orthogonal set G⊥ and **bi-orthogonal closure G⊥⊥** | same file | `computeOrthogonal(designs, pool?)`, `computeBiorthogonalClosure(designs)` — "a set is a behaviour iff G = G⊥⊥" is already the doc-comment |
| Orthogonality over the persisted substrate | [`packages/ludics-engine/checkOrthogonal.ts`](../../packages/ludics-engine/checkOrthogonal.ts) | `checkOrthogonal({dialogueId,posDesignId,negDesignId})` → `orthogonal = status==='CONVERGENT'` |
| Interaction stepper / normalization | [`packages/ludics-engine/stepper.ts`](../../packages/ludics-engine/stepper.ts) | `stepInteraction(...)` (DB) and `packages/ludics-core/dds/interaction/stepper.ts` (pure) |
| Behaviour substrate (designs, incarnations, antichain `Inc(B)`) | [`lib/ludics/substrate/read.ts`](../../lib/ludics/substrate/read.ts) | `getBehaviour`, incarnation reads — note the T002 antichain result is already mechanised (see repo memory) |

**Consequence for planning:** the conjecture in §1 — "the acceptable arguments
for a claim form a Ludics behaviour, a set closed under B = B⊥⊥" — is *directly
testable today* by running `computeGroundedExtension` / `stableExtensions` on
one side and `computeBiorthogonalClosure` on the translated designs on the
other. That makes a **differential-testing-first** strategy viable and is the
single biggest de-risking lever we have.

> ⚠️ Caveat to verify early: `converges`/`checkConvergence` in
> `behaviour-computer.ts` is an in-memory heuristic (depth-bounded, loop-guarded)
> and may **not** be a faithful Ludics orthogonality test. Auditing it against
> the persisted `stepInteraction` semantics and against the theory is **Phase 0
> work** — the whole bridge rests on this predicate meaning what we think it means.

---

## 0b. Phase 0 outcome — the orthogonality-predicate audit (2026-06-02)

**Verdict: the two predicates are *not* the same orthogonality relation. They
coincide only on the simplest fragment (linear, daimon-terminated, no
additives) and are not guaranteed to agree in general. `checkOrthogonal`
(over `stepInteraction`) is the canonical one; `converges` is an unverified
in-memory approximation, and — critically — it is the one the bi-orthogonal
closure machinery is currently wired to.**

### The two predicates, side by side

| | **A — `converges` / `checkConvergence`** ([behaviour-computer.ts](../../packages/ludics-core/dds/landscape/behaviour-computer.ts#L120)) | **B — `checkOrthogonal` / `stepInteraction`** ([stepper.ts](../../packages/ludics-engine/stepper.ts#L161), [checkOrthogonal.ts](../../packages/ludics-engine/checkOrthogonal.ts)) |
|---|---|---|
| Input model | `LudicDesignTheory` (in-memory chronicles/actions/addresses) | persisted `LudicDesign`/`LudicAct`/`LudicLocus` rows |
| Execution | sync, in-memory | async, DB-backed; persists a `LudicTrace` |
| Orthogonal ⟺ | `termination === "daimon"` | `status === 'CONVERGENT'` (a `DAIMON` act is reached) |
| Non-orthogonal causes | `stuck`, `loop`, `max_depth` | `DIVERGENT` (`incoherent-move`, `additive-violation`, `dir-collision`, `consensus-draw`), `STUCK` (`no-response`) |
| Branching | follows **`ramification[0]` only** — a single linear path | locus-matched alternating traversal; handles multiple O-acts, virtual negatives |
| Additives | **none** | additive directory choice + `additive-violation` divergence |
| Loop handling | `visited` key = `addr:polarity:depth` | explicit `fuel` (≤ 10 000 pairs) |
| Daimon test | `design.hasDaimon` flag **plus** a daimon action at the current address (`checkDaimonAt`) | the daimon must be the **next positive act actually reached** by traversal |

### Why they diverge (concrete, not hypothetical)

1. **Different inputs with no shared translation.** A consumes the in-memory
   `LudicDesignTheory`; B consumes persisted design rows. Nothing in the repo
   guarantees the in-memory theory is derived from the same persisted design,
   so the two can be fed structurally different objects for "the same" pair.

2. **A explores strictly less of the interaction tree.** A only ever follows
   `ramification[0]` (the first child). On any design with branching or
   additive structure, A walks a single linear projection while B traverses the
   matched loci with additive-choice bookkeeping. A can therefore declare
   `daimon` (orthogonal) on a linear slice while B declares `DIVERGENT` via an
   `additive-violation` or an unmatched locus elsewhere — or the reverse.

3. **A's loop guard is effectively dead code.** The `visited` key includes
   `depth`, which strictly increases every iteration, so the same
   `(address, polarity)` state never collides — the `termination: "loop"`
   branch can essentially never fire, and real loops silently fall through to
   `max_depth` after 100 steps. A therefore has *no* working loop semantics;
   B bounds by explicit fuel.

4. **A can short-circuit convergence via the daimon flag.** `checkDaimonAt`
   keys off `design.hasDaimon` plus a daimon action *at the current address*,
   so A can report `daimon`/orthogonal by finding a daimon that B would never
   reach under its strict alternating, locus-matched traversal.

5. **B's divergence taxonomy has no analogue in A.** `additive-violation`,
   `dir-collision`, `consensus-draw` are B-only. A has no concept of additive
   directories or consensus draws, so for those configurations the two
   predicates are simply answering different questions.

The **signs agree** (both call "reached †" orthogonal and "stuck/loop/timeout"
non-orthogonal), so on a simple linear daimon-terminated dialogue they return
the same answer. That surface agreement is exactly what makes the discrepancy
dangerous: it passes a casual smoke test while being false in general.

### The load-bearing consequence

`computeOrthogonal` → `computeBiorthogonalClosure` in
[behaviour-computer.ts](../../packages/ludics-core/dds/landscape/behaviour-computer.ts)
are built on **predicate A**. So the entire $B = B^{\perp\perp}$ machinery — the
literal object the §1 conjecture is about — currently rests on the *unverified
heuristic*, not on the canonical persisted predicate. **No bridge result may
rest on `computeBiorthogonalClosure` as it stands.**

### Phase 0 decisions (fixed)

- **D0.1 — Canonical predicate.** Orthogonality for the bridge is
  `checkOrthogonal` / `stepInteraction`:
  `D ⊥ E  ⟺  stepInteraction(D,E).status === 'CONVERGENT'`. It is the
  production semantics, persisted as `LudicTrace`, and handles additives /
  collisions / consensus / phases.
- **D0.2 — Totalize the decision.** Treat the result as three-valued and do
  **not** silently fold `ONGOING` into "not orthogonal":
  `CONVERGENT → ⊥`; `DIVERGENT | STUCK → not ⊥`; `ONGOING` (fuel exhaustion /
  phase gate) → **undecided/raise**, never an answer. (Note B persists `STUCK`
  as `ONGOING` in the DB row; the in-memory `status` still distinguishes them —
  read the return value, not the persisted enum.)
- **D0.3 — Re-found the closure.** Before Phase 4 rests on it, either
  (i) re-implement `computeOrthogonal` / `computeBiorthogonalClosure` on top of
  `checkOrthogonal`, **or** (ii) formally restrict to the linear
  daimon-terminated fragment and *prove* `converges ≡ checkOrthogonal` there
  (option (i) is the recommended default; (ii) is unlikely to hold once
  additives appear). Until then, `computeBiorthogonalClosure` is "approximation
  only — not canonical," mirroring the AF-engine's deprecation discipline.
- **D0.4 — Two A-bugs to file regardless.** The dead loop-guard (depth in the
  `visited` key) and the daimon-flag short-circuit should be fixed or
  explicitly documented as known-unsound, so no later reader mistakes A for a
  faithful test.

### Cross-check: the argumentation endpoint is genuinely consolidated

Independently confirmed that
[ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md)
is **fully implemented**, so the Dung side of the bridge is now a single, exact,
labelling-based engine of record rather than the four-way fragmentation it
inventories:

- `lib/argumentation/index.ts` is the public surface; the four overlapping
  engines are gone — `lib/deepdive/af.ts` and `lib/argumentation/afEngine.ts`
  are **deleted** (Phase 4c), their adapter content moved to
  [`lib/argumentation/adapters.ts`](../../lib/argumentation/adapters.ts).
- Labelling core ([`labelling.ts`](../../lib/argumentation/labelling.ts)) +
  exact grounded/preferred/stable/semi-stable
  ([`semantics.ts`](../../lib/argumentation/semantics.ts)); the unsound
  random/greedy preferred fallbacks are removed (C2 satisfied).
- ASPIC+ instantiation ([`instantiate.ts`](../../lib/argumentation/instantiate.ts));
  `lib/aspic/semantics.ts` now delegates to the shared core.
- Stored policy: schema enum `ArgumentSemantics { grounded | preferred | stable }`
  with `Deliberation.argumentSemantics @default(preferred)` ([lib/models/schema.prisma](../../lib/models/schema.prisma#L4631)),
  resolved via [`policy.ts`](../../lib/argumentation/policy.ts) and consumed by
  the `sheets` and `dialectic` routes.

**Bridge implication.** Because the Dung side is now exact and labelling-based,
the differential test in Phase 2 has a *trustworthy* left-hand side — the only
remaining unknown for the test is the Ludics predicate (resolved by D0.1) and
the translation `⟦·⟧`. The audit therefore narrows the open surface to exactly
one place: the translation map.

---

## 1. What the theorem actually has to say

Target statement (grounded first, the tractable case):

> **Bridge (grounded).** Let $\mathcal{F}=(\mathrm{Args},\mathrm{att})$ be a
> finite AF and $\llbracket\cdot\rrbracket$ the translation into designs. Then
> argument $a$ is in the grounded extension of $\mathcal{F}$ **iff**
> $\llbracket a\rrbracket$ is orthogonal to every design in
> $\llbracket\mathrm{att}(a)\rrbracket$ (equivalently: $\llbracket a\rrbracket$
> lies in the bi-orthogonally-closed behaviour $B_a = B_a^{\perp\perp}$).

The §1 narrative already names the right proof strategy and the right risk:

- **Strategy (the bridge that half-exists):** Modgil–Caminada *argument games*
  give a move-by-move dialogical characterization of grounded/preferred
  semantics; Ludics is a theory of dialogical interaction. So prove the
  *argument game = the Ludics dispute, up to a translation that preserves
  winning strategies.* Grounded has the cleanest game (the grounded discussion
  game / standard "G-game"), which is why it goes first.
- **Risk (the obstruction worth publishing):** preferred semantics carries a
  *maximality* condition with no obvious interactive counterpart. If the clean
  bridge fails there, the result becomes the **realizability characterization**
  — *which* semantics are interactively realizable and which are not — which
  feeds direction 6's Negarestani symmetry axiom and is itself a real paper.

---

## 2. Workplan (phased, de-risking front-loaded)

### Phase 0 — Predicate audit & formal-target fixing *(prerequisite)* — **✅ done (2026-06-02, see §0b)**
- ~~Audit `converges`/`computeOrthogonal` against the persisted
  `stepInteraction` orthogonality and the Ludics definition.~~ **Done.** The two
  predicates are *not* equivalent; `checkOrthogonal` is canonical and the
  bi-orthogonal closure machinery is wired to the wrong (heuristic) one — see
  §0b decisions D0.1–D0.4.
- **Semantics order fixed: grounded → stable → preferred** (preferred's
  maximality obstruction pre-registered as a publishable realizability fallback).
- **Translation source fixed: abstract AF first** (arguments + attacks only),
  ASPIC+ structured arguments second — keeps the first proof free of ASPIC+
  rule/defeat bookkeeping. The Dung side is now a single exact engine
  (consolidation roadmap fully implemented, §0b), so the test's left-hand side
  is trustworthy.

### Phase 1 — Define the translation ⟦·⟧: AF → designs
- Map: argument → design; attack → the opponent/counter-design at the dual
  locus; the proponent/opponent flip → design polarity. Define "the behaviour
  $B_\varphi$ of a claim $\varphi$" precisely (candidate: bi-orthogonal closure
  of the designs of arguments concluding $\varphi$).
- Deliverable: a `lib/bridge/` translation module + a written spec of the map.
  **No proof yet** — just the definition and its type.

### Phase 2 — Differential testing (empirical bridge, runs before/with proof)
- Property-based test over random finite AFs: assert
  `computeGroundedExtension(F)` agrees with
  "`⟦a⟧ ∈ closure(⟦args_φ⟧)`" for every argument, where `closure` is the
  bi-orthogonal closure built on the **canonical** predicate (D0.1) — *not*
  `computeBiorthogonalClosure` as it stands, which rests on the heuristic
  `converges` (D0.3). Re-found the closure on `checkOrthogonal` first, or scope
  the generator to the linear daimon-terminated fragment where A ≡ B.
- This is the fastest way to (a) find the *correct* translation empirically,
  (b) surface counterexamples that tell us where faithfulness breaks, and
  (c) build confidence before investing in the paper proof. Reuse the existing
  AF generators / `__tests__/aspic` fixtures.
- Deliverable: `tests/bridge/grounded-biorthogonal.property.test.ts` + a short
  findings note appended to this session doc.

### Phase 3 — The keystone lemma (grounded game ≅ Ludics dispute)
- Prove: a winning strategy for Proponent in the grounded discussion game for
  $a$ maps to a design orthogonal to all opponent designs, and back
  (strategy-preserving translation). This is the *real* mathematical content.
- Deliverable: a proof sketch in `02_THEOREMS_AND_PROOFS/` (promoted out of this
  folder once stable), with the lemma stated precisely enough for mechanization.

### Phase 4 — Behaviour / bi-orthogonal characterization
- Prove the acceptable arguments for $\varphi$ form a behaviour $B_\varphi =
  B_\varphi^{\perp\perp}$; connect to `computeBiorthogonalClosure`. Tie
  "internal completeness" to the Plexus "closed vs. import-requiring
  deliberation" question (the §1 closing point).

### Phase 5 — Stable, then preferred (the obstruction)
- Extend to stable (expected to go through). Attempt preferred; if the
  maximality condition resists, *characterize the obstruction* rather than
  forcing it. Either outcome is a deliverable.

### Phase 6 — Mechanization handoff (→ direction 5)
- Hand the Phase 3–4 lemmas to the Agda track. Mechanized Ludics orthogonality
  + the grounded bridge is a proof-theory contribution independent of the
  platform.

---

## 3. Decision points — **all four settled (2026-06-02)**

1. **Orthogonality predicate — RESOLVED.** Canonical = persisted
   `checkOrthogonal` / `stepInteraction` (`status==='CONVERGENT'`); in-memory
   `converges` is an unverified approximation and the bi-orthogonal closure must
   be re-founded on the canonical predicate. See §0b (D0.1–D0.4).
2. **Translation source — RESOLVED: abstract AF first** (arguments + attacks),
   ASPIC+ structured arguments second.
3. **Proof-first vs. test-first — RESOLVED: test-first** (Phase 2 before
   Phase 3), because both endpoints run and the differential test will localize
   the correct translation faster than a whiteboard.
4. **Semantics order — RESOLVED: grounded → stable → preferred**, with
   preferred's maximality obstruction pre-registered as an acceptable
   (publishable realizability) outcome.

## 4. Risks / open
- The `converges` heuristic may diverge from true Ludics orthogonality →
  Phase 0 must resolve this first.
- The translation may only preserve winning strategies on a *fragment* of AFs
  → that fragment characterization is itself a result, not a failure.
- Preferred-semantics maximality → expected obstruction; the realizability
  characterization is the fallback paper (feeds direction 6).

## 5. To promote (when stable)
- Phase 1 spec → keep here until Phase 3 lands, then the theorem → `02_THEOREMS_AND_PROOFS/`.
- The B = B⊥⊥ conjecture → register now in [`03_CONJECTURES/`](../03_CONJECTURES) as the bridge's central conjecture, cross-linked here.

## 6. Phase-1 artifacts (2026-06-02)
- **Canonical closure re-founded (D0.3):** [`packages/ludics-engine/behaviourClosure.ts`](../../packages/ludics-engine/behaviourClosure.ts)
  — `makeCanonicalOracle` (orthogonality = `stepInteraction` `CONVERGENT`,
  three-valued with `undecided` raising per D0.2), `orthogonalSet`,
  `biorthogonalClosure`, `isBehaviour`, `biorthogonalClosureForDialogue`.
  Set-algebra locked by [`packages/ludics-engine/__tests__/behaviourClosure.test.ts`](../../packages/ludics-engine/__tests__/behaviourClosure.test.ts)
  (10 tests, stub oracle, no DB).
- **In-memory closure demoted (D0.4):** `converges` / `computeOrthogonal` /
  `computeBiorthogonalClosure` in
  [`behaviour-computer.ts`](../../packages/ludics-core/dds/landscape/behaviour-computer.ts)
  now carry "approximation only — not canonical" banners; the dead loop-guard
  and the `hasDaimon` short-circuit are annotated as known-unsound.
- **Translation spec (Phase 1):** [`02b-translation-spec-af-to-designs-2026-06-02.md`](02b-translation-spec-af-to-designs-2026-06-02.md)
  — abstract AF → designs, the behaviour-of-a-claim definition over the
  canonical closure, the grounded-bridge conjecture (test-then-prove), and the
  four open encoding decisions for Phase 2.

## 7. Phase-2 artifacts (2026-06-02) — empirical bridge PASS

- **Bridge prototype:** [`lib/bridge/`](../../lib/bridge) (`types.ts`,
  `dispute.ts`, `index.ts`). `dispute.ts` carries the translation `⟦·⟧`
  (`buildDisputeDesign`), a faithful **pure** model of the canonical predicate
  (`interact`, alternate-polarity locus-matched daimon traversal — *not* the
  non-canonical DDS stepper), explicit strategy enumeration (bounded), the
  acceptance predicate `acceptableByInteraction` (`∃σ ∀τ` converge), and the
  minimax cross-check `disputeWins`.
- **Property test:** [`tests/bridge/grounded-biorthogonal.property.test.ts`](../../tests/bridge/grounded-biorthogonal.property.test.ts)
  — 7/7 green. `a ∈ grounded(F) ⟺ acceptableByInteraction(F, a)` held over **500
  fast-check runs** (1–5 args, arbitrary attacks incl. self-attack); non-vacuous
  (543 accepted / 627 rejected verdicts checked; ~19.5% skipped above the
  enumeration bound). Faithfulness cross-check `acceptable ⟺ disputeWins` also
  green over 500 runs.
- **Conjecture registered:** [`../03_CONJECTURES/C010-grounded-orthogonality-bridge.md`](../03_CONJECTURES/C010-grounded-orthogonality-bridge.md)
  — the bridge's central biconditional, status *open (empirically corroborated)*,
  positive settlement = the Phase-3 keystone lemma.
- **Findings note:** §6 of [`02b`](02b-translation-spec-af-to-designs-2026-06-02.md)
  records the resolved encoding decisions and the asymmetric repetition rule
  (PRO no-repeat, CON may repeat) that makes the bridge land on *grounded*.

**Next:** Phase 3 — prove the keystone lemma (grounded discussion game ≅ Ludics
dispute, strategy-preserving), then stable, then preferred.

## 8. Phase-3 artifacts (2026-06-03) — keystone lemma PROVED (grounded)

- **Theorem:** [`../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md`](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md)
  — `a ∈ grounded(F) ⟺ a accepted by canonical interaction (∃σ ∀τ ⇓ †)`,
  strategy-preserving. Human-checked, status *provisional (pending cross-check)*.
  Decomposed into Lemma A (simulation: `interact` traces the dispute line, †
  ⟺ CON-stuck), Lemma B (strategy bijection ⟦·⟧, realised by
  `enumerateStrategies`), Lemma C (game adequacy: PRO wins the no-repeat
  grounded game ⟺ `a ∈ grounded` — self-contained, via the grounded fixpoint
  rank for ⇐ and a labelling-invariant CON refutation for ⇒).
- **Exhaustive corroboration:** [`../../tests/bridge/keystone-simulation.exhaustive.test.ts`](../../tests/bridge/keystone-simulation.exhaustive.test.ts)
  — `disputeWins ⟺ grounded` on **every** AF up to 4 args (65 536 AFs at n=4);
  `acceptableByInteraction ⟺ disputeWins` on every AF up to 3 args, zero skips.
  7/7 green.
- **Open question registered:** [`../01_OPEN_QUESTIONS_REGISTRY.md`](../01_OPEN_QUESTIONS_REGISTRY.md)
  Q-038 (the Dung→Ludics bridge), grounded fragment `closed-by` T005;
  [C010](../03_CONJECTURES/C010-grounded-orthogonality-bridge.md) now
  partially-resolved (`proved-by` T005).

**Next:** cross-check T005, then **stable** (a design realizing a complete,
conflict-free, all-attacking labelling — new acceptance quantifier, Lemmas A–B
reused), then **preferred** (maximality obstruction → realizability fallback).
