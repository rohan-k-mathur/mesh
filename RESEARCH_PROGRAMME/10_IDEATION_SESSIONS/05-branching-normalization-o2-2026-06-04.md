# Session 05 — Branching normalization: separation when multiple lines are open at once (Q-041 O2)

**Date:** 2026-06-04
**Direction:** 2 — Separation / locus of disagreement (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §2), branching half; hard overlap with Direction 5 (mechanization)
**Status:** **Scoping / problem statement — OPEN** (no theorem claimed; no code changed). Frames the attack on [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) **O2** so it can be worked deliberately.
**Purpose:** the [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md) result recovered minimality on a **single realized chronicle**. The [branching-prevalence baseline](../../tests/bridge/branching-prevalence.test.ts) shows branching is the **common** case (41.7% at n=2, 71.9% at n=3, growing). So the linear theorem underwrites a minority of real disputes; this session scopes what "the minimal place you disagree" *means*, and whether it is *provable*, when several `⊑`-incomparable lines are open at once.

> Reading order: [session 03 synthesis](03-separation-locus-of-disagreement-2026-06-03.md#synthesis--what-the-repair-1-outcome-means-for-direction-2-2026-06-04),
> [session 04](04-separating-context-predicate-decision-2026-06-04.md) (R2 ratified),
> [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
> (the linear theorem + faithfulness boundary), [C012 §Phase 3 → Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md)
> (the original branching probe), and the prevalence baseline above.

---

## 0. The problem in one sentence

On a single chronicle, `Sep(D, E) = { ξ(E) }` is a singleton and "the minimal
separating context" is unambiguous (T008). When `D` defends **multiple
`⊑`-incomparable attack lines simultaneously** (a genuine `⟦a⟧⁺` tree — one child
per attacker, recursively), a disagreement can sit on *several* lines and the
candidate minimal loci are **`⊑`-incomparable**, so there may be **no single
`⊑`-least separating context** — the order is partial, not total, exactly where
T007's chain argument stops working.

## 1. What changes from linear to branching (the three things that break)

1. **The object: a test is now a *tree* of concessions, not a single frontier.**
   T008's proper test (Definition 1) concedes (`†`) or refuses at *one* frontier on
   *one* line. A branching opponent must answer-or-concede at **every** line `D`
   opens — so a proper test is a **daimon-closed sub-tree**: at each of its positive
   turns across all open loci it carries an act (attack or `†`). "Frontier" becomes
   "frontier *set*" — an antichain of loci, one per line it refuses on.
2. **The order: `⊑` on single anchors → a (multi)set order on antichains.** With a
   set of refusal loci, "minimal separating context" is no longer the `⊑`-least
   *element*; it is a minimal *antichain* under some lifting of `⊑` (Hoare / Smyth /
   Egli-Milner powerdomain orders are the candidates). Which lifting is *the right
   one* is a genuine modelling decision, not a detail — it decides whether a minimum
   exists.
3. **The kernel: `stepCore` mis-diverges off-thread on trees.** Already shown
   ([C012 §Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md)): a single
   test along the `0.2` line makes `stepCore` diverge at `0.1.1` (an un-probed line),
   because `findNextPositive` is least-index with no reachability gate. So the
   branching theorem **cannot** be read off the kernel as-is — it must be proved
   against an **abstract normalization** (the R2 discipline), with the kernel related
   by a faithfulness lemma that *fails* on trees the way it failed on truncations.

## 2. Candidate readings of "minimal disagreement" when lines branch

The substance is choosing what the product claim *means* in the branching case.
Four readings, in increasing ambition:

- **(R-a) Per-line minima (punt on aggregation).** Report the `⊑`-minimal separating
  context **per realized line** (T008 applies on each line independently), and present
  a *set* of "minimal commitments, one per open dispute line." Honest, immediately
  underwritten by T008 per line, no new theorem — but it does **not** answer "*the*
  place you disagree"; it answers "the places."
- **(R-b) Shallowest across lines (a single locus).** The `⊑`-minimal over the union
  of per-line anchors *when it exists* — i.e. when one anchor is a prefix of the
  rest (the lines share a stem and diverge below a common point). Often there is a
  shared root segment; the claim is minimal **iff** the per-line minima are
  `⊑`-comparable. Needs a theorem that characterizes *when* this holds.
- **(R-c) Minimal antichain (the powerdomain reading).** The genuine generalization:
  the minimal *set* of loci that together separate `D` from `E`, ordered by a
  powerdomain lifting of `⊑`. "The minimal unshared commitment" becomes "the minimal
  set of presuppositions that jointly distinguish the parties." This is the real
  Girard-separation-over-trees statement and the hardest.
- **(R-d) Negative result.** A branching `(D, E)` whose per-line minima are
  `⊑`-incomparable with **no** powerdomain-least antichain — i.e. minimality is
  *genuinely* unavailable, and the obstruction (the precise tree shape) is the result,
  exactly as the program discipline prescribes.

> **Framing decision to make in this session's follow-up:** is the product claim
> "the place" (needs R-b/R-c) or "the places" (R-a suffices)? R-a is shippable now
> and honest; R-b/R-c are the theorem. The prevalence data says branching is common,
> so R-a-only would leave the *majority* of disputes with a set, not a minimum —
> which may be fine (a frontier *is* a set) or may undersell the claim.

## 3. The two routes, lifted to branching (carry over from session 04)

- **R2-tree (abstract, recommended continuation).** Define the branching proper test
  (daimon-closed sub-tree, §1.1), the antichain order (§1.2, pick the lifting), and
  prove the minimal-separating-**antichain** theorem (or its obstruction) at the
  abstract Ludics level — *decoupled from `stepCore`*. Then a faithfulness lemma
  relates `stepCore ∘ ⟦·⟧` to the abstract tree-normalization, characterizing its
  failure (the off-thread mis-divergence) exactly. **This is the Direction-5
  deliverable's core** and the natural continuation of the linear T008 proof.
- **R1-tree (kernel, still parked).** Add the reachability/justification gate to
  `findNextPositive` so the kernel descends only opened lines, then read minima off
  the gated kernel. Same risk as before (touches the established-T005 discharge
  predicate) plus the harder question of whether a *single* gated run can even
  enumerate a minimal antichain (it explores one line at a time). Parked; R2-tree is
  the path.

## 4. Where the difficulty actually lives (be honest, per the brainstorm)

- **The order, not the kernel, is the crux.** Once "minimal" is over antichains, the
  theorem's truth depends on the powerdomain lifting chosen. The Smyth order (upper
  powerdomain) tends to *have* minima; the Hoare order (lower) tends not to. Picking
  the lifting that (a) matches the product intuition and (b) admits a minimum is the
  real modelling work — and it might force R-d (no minimum under the *intuitive*
  order) as the honest answer.
- **Sequentiality is genuinely gone.** The linear proof leaned on "the chronicle is a
  `⊑`-chain, so index order = chronicle order." Trees have no such total order; the
  abstract normalization must track a **frontier set** and the parity argument
  (Lemma 0) generalizes to per-branch parity. This is where mechanization (Agda)
  earns its keep — the case analysis is exactly what a proof assistant is good at.
- **`⟦·⟧` invertibility is heavier.** Mapping a minimal *antichain* of loci back to
  argument-graph edges (for the product surface) is a set-valued inverse; the
  round-trip test of the [dev spec §8](../DEV_SPEC-minimal-disagreement-extractor-2026-06-04.md)
  must be generalized.

## 5. Concrete first steps (test-then-prove, as throughout)

1. **Branching harness (the empirical surface, missing).** The analogue of the
   daimon-closed harness for *trees*: build a branching `⟦a⟧⁺` (≥2 defended lines),
   the daimon-closed sub-tree tests, and an **abstract tree-normalizer** (pure, not
   `stepCore`) that computes per-line divergence and the candidate minimal antichain.
   Corroborate R-a (per-line minima) immediately; use it to *search* for the R-d
   obstruction (incomparable minima, no powerdomain-least) over `allAFs(n)`.
2. **Pick the antichain order** by running the candidate liftings (Hoare/Smyth/
   Egli-Milner) against the harness and seeing which admits a least element where the
   product intuition says one should exist. This is a measurement, not an armchair
   choice.
3. **State the branching conjecture** (a new C-entry, or extend C012) once the order
   is chosen: either "the first-divergence *antichain* is the powerdomain-minimal
   separating context" (positive) or the characterized obstruction (negative).
4. **Prove or refute on the linear-tree base case first** (a tree that happens to be
   one line = T008), then two incomparable lines, then general — the same staging as
   T006→T007→T008.

## 6. Decisions to record (in the follow-up, not yet)

- **OPEN — product claim semantics:** "the place" (R-b/R-c) vs "the places" (R-a).
- **OPEN — antichain order:** which powerdomain lifting of `⊑`.
- **CARRIED — R2 over R1:** the abstract route stays primary (session 04 §6); R1-tree
  stays parked with the same T005 guardrail.
- **AGREED — R-a is shippable now:** per-line minima are already underwritten by T008
  and could ungate a *set-valued* "minimal commitments" surface without the branching
  theorem — a candidate interim product step independent of the hard proof.

## 7. Open questions handed forward

- Does a branching `(D, E)` with `⊑`-incomparable per-line minima and **no**
  powerdomain-least antichain actually exist over small AFs? (The R-d search; the
  branching harness answers it empirically before any proof.)
- Is the right object a minimal *antichain* of loci, or a minimal *sub-design*
  (Girard's behaviour-level separation), and do they coincide on the fragment?
- Can R-a (per-line) be shipped as a set-valued frontier surface now, decoupling the
  product unblock from the branching theorem entirely?

## 8. Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — designs as trees of chronicles, separation,
  the behaviour-level (sub-design) reading of distinguishing contexts.
- Powerdomain orders: Smyth / Hoare / Plotkin (Egli–Milner); the standard liftings of
  a partial order to its sets, the candidate models for "minimal separating *set*."
- In-repo: [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
  (the linear theorem this generalizes), [C012 §Phase 3 → Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md)
  (the off-thread probe), [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) (O2),
  [session 04](04-separating-context-predicate-decision-2026-06-04.md),
  the [branching-prevalence baseline](../../tests/bridge/branching-prevalence.test.ts),
  kernel [`stepCore.ts`](../../packages/ludics-engine/stepCore.ts),
  extractor [`properTest.ts`](../../packages/ludics-engine/properTest.ts).

---

**Handoff:** this is the problem statement for Q-041 O2. The first concrete artifact
is the **branching harness + abstract tree-normalizer** (§5.1) — it corroborates R-a,
searches for the R-d obstruction, and is the empirical surface the branching theorem
(or its refutation) is proved against. The antichain-order choice (§5.2) is gated on
that harness. R-a (per-line set surface) is a separable interim product step.

---

## Update — branching harness landed; the order choice is decided empirically (2026-06-04)

The harness ([`tests/bridge/branching-normalization.test.ts`](../../tests/bridge/branching-normalization.test.ts))
is built and green (7 tests; full bridge suite 10 suites / 62). Its **abstract
tree-normalizer** runs `stepCore` *per maximal line* (faithful there — each line is a
linear chronicle, T008) and aggregates the per-line minima *purely* (set logic on
`⊑`), sidestepping the off-thread bug that only fires on the *combined* tree. Findings
over `allAFs(n)`, `n ≤ 3` (1344 disputes at n=3, 663 branching):

- **R-b is ruled out structurally.** The per-line minima are the `⊑`-**maximal**
  Proponent-positive loci, so they are *always* a `⊑`-antichain; branching (`|M| ≥ 2`)
  therefore has **no single `⊑`-least locus**. "The minimal place you disagree" cannot
  be one locus when lines branch — it is irreducibly a *set*.
- **§5.2 order choice — answered empirically: SMYTH (upper powerdomain).** Under the
  Smyth lifting `S ≤_S T ⟺ ∀t∈T ∃s∈S. s⊑t`, a **unique least separating set exists on
  every dispute (1344/1344), and it is the full antichain `M`** (= "you disagree at
  *all* of these per-line points"). Under the **Hoare** lifting there is **no least**
  on exactly the branching disputes (663/663) — the incomparable singletons are
  Hoare-minimal with no infimum (the R-d shape, but only under Hoare). Egli–Milner
  inherits Hoare's failure. So the order choice is not a wash: **Smyth makes the
  branching minimal-separating-context well-defined; Hoare does not.**
- **This recasts R-c/R-d.** R-c (minimal antichain) is *positive under Smyth* — the
  minimal separating context is the Smyth-least set, the full per-line antichain. R-d
  (no minimum) is **not** an absolute obstruction; it is **order-relative** — it is the
  Hoare reading. The honest statement: *over proper daimon-closed concession-trees, the
  Smyth-minimal separating set is the antichain of per-line first-divergence loci.*
- **Product reading.** "The minimal unshared commitment" generalizes cleanly to **"the
  minimal set of unshared commitments — one per open dispute line"** (the Smyth-least
  antichain). That is exactly R-a (per-line minima) *recovered as a theorem*, not a
  punt: the set the product would show is provably the Smyth-minimal separating context.

**Decisions now ripe to record (next session / a C-entry):**

- **RESOLVED (empirical) — antichain order = Smyth (upper).** The branching minimal
  separating context is the Smyth-least separating set = the per-line first-divergence
  antichain. Hoare/Egli–Milner are rejected (no least on branching). To be promoted to
  a conjecture/theorem with the abstract proof (the harness corroborates; the proof is
  the Smyth-least = `M` argument generalized off the small-`|M|` enumeration).
  **PROMOTED 2026-06-04 → [C013](../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md)** (statement + five abstract-proof obligations O-tree/O-parity/O-perline/O-smyth/O-faithful).
- **R-a is now theorem-backed, not interim.** The set-valued "minimal commitments, one
  per line" surface is the Smyth-minimal separating context — shippable as *the*
  branching answer, not a fallback.
- **Still OPEN — the abstract tree theorem.** The harness *corroborates* Smyth-least =
  `M`; the **proof** (daimon-closed concession-trees, per-branch parity generalizing
  Lemma 0, Smyth-minimality) is the Direction-5 deliverable and the next formal step.
- **Still OPEN — relative vs absolute.** As in T008, the per-line minima here are the
  *deepest* grants (relative to the maximal disagreement); the absolute floor is the
  root `ξ₀`. The Smyth-least-of-deepest-grants is the product-bearing object.