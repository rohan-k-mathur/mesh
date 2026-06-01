# δ defeat-encoding — decision brainstorm

- **date:** 2026-05-30
- **type:** brainstorm / decision-scaffold — **R1 enacted 2026-05-30** (see §10; this doc now records a register-status change: δ₁ committed, [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) filed)
- **outcome:** **δ₁ (defeat-as-negation) committed (provisional, MALL fragment)** as the C001b′ proof encoding; the δ₂ (defeat-as-coroutine) runtime reading and the δ₁ ≅ δ₂ equivalence are carried forward as [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) (R3); see the §11 session kickoff. **Both confirmation gates now executed and both confirm δ₁:** [E1](e1-reinstatement-aspirin-2026-05-30.md) (A3/H1 — reinstatement is Ambler-monotone accrual) and [E3](e3-polarity-readoff-2026-05-30.md) (H2 — the alignment forces negative polarity); the provisional caveat is now only the orthogonal MELL/Q-030 image plus the Q-037 runtime question.
- **decides:** side-data item 4 (δ) of the [Q-028b reduction](q028b-freeness-argument-2026-05-29.md) — the substrate's commitment to a defeat-encoding
- **blocks:** [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′ ∧ b₂′ (the reduction is *qualified positive given δ*; δ is the only genuinely substantive of the four side-data items)
- **decision venue (commitment recorded):** [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) Part II (δ commitment note, 2026-05-30)
- **interacts-with:** [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) (MALL→MELL incarnation upgrade); [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) (δ fixpoint check); [Q-029](../01_OPEN_QUESTIONS_REGISTRY.md#q-029) (categorical home for side data); [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) (BF-side antichain witness); [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) (R3, δ₁ ≅ δ₂)

---

## 0. Purpose and scope

This doc does **not** pick δ. It builds the decision so the pick, when made,
is defensible and recorded against explicit criteria rather than taste. The
goal is a rubric: a set of axes on which δ₁ and δ₂ can be scored, the
hard constraints each must satisfy, the downstream artefacts each commits us
to, and the smallest experiments that would discriminate them.

The two candidates, verbatim from the [Q-028b audit §5](q028b-freeness-argument-2026-05-29.md):

> **δ₁ — defeat-as-negation.** An Ambler defeat `defeat(π)` becomes a
> *negative design*: a Daimon ramification with an explicit attack
> ramification — the defeated argument is a *blocked chronicle* on the
> negative side. Matches Phase 2e's **Cross-Cone Incompatibility**
> interpretation; this is the **substrate-default** reading.
>
> **δ₂ — defeat-as-coroutine.** An Ambler defeat becomes a *positive locus*
> marked for cross-cone interaction — the defeated argument is a parallel
> *challenger* computation. Matches a **CSP-style operational** reading.

These are **not equivalent** and produce different bijections `φ` on
`Inc(B)` for any `B` involving defeat (audit §5). So the choice is
architectural, not presentational, and it propagates into every artefact
that depends on `φ`.

---

## 1. What the choice actually controls

δ is the third factor of the bijection
`φ : Inc(B) → 𝒞/Γ(A, B^♯)`,  `D ↦ δ⁻¹(CH(DP(D)))`:

```
        DP                 CH                  δ⁻¹
Inc(B) ────► cut-free ────► linear λ-term ────► Ambler λ-term
            MALL/MELL       (Proofs & Types     (defeat operator
            proof            ch.8)               restored)
```

DP and CH are pinned by cited theorems (modulo the Q-030 MELL question). δ is
the **only** factor the substrate chooses freely. Concretely δ decides:

1. **Where a defeated argument lives in a design.** δ₁: on the *negative*
   side (the Opponent's ramification carries the attack; the defeated
   positive chronicle is capped by a Daimon). δ₂: on the *positive* side (a
   live locus that the challenger interacts at).
2. **How `defeat(π)` composes with `defeat(defeat(π))`.** Nested defeat
   (reinstatement) is the stress-test in audit §9(2). δ₁ reads a double
   defeat as *two* polarity flips → back to a positive/assertable chronicle
   (reinstatement = double negation). δ₂ reads it as a challenger-of-a-
   challenger, i.e. a second coroutine spawned against the first.
3. **The shape of `Inc(B)` for defeasible `B`.** Because δ changes which
   designs are incarnations of `B^♯`'s Ludics image, it changes the
   *generating set* of the LHS free JSL — hence the cardinality counts that
   Q-028a stratum 1 checks.

So a δ commitment is upstream of: the C001b′ bijection, the Q-028a
worked-example enumeration, and (via the generator set) T002's antichain
claim restated for defeasible behaviours.

---

## 2. Hard constraints (a candidate that fails any of these is out)

A defeat-encoding is only admissible if it clears the following. These are
gates, not scored axes.

- **H1 — Injectivity of δ⁻¹ on defeat actions.** The reduction's §6.1
  injection step assumes δ⁻¹ is injective. Both candidates are injective on
  *flat* (single-layer) defeat. **Open for both** on nested defeat — this is
  audit §9 stress-test (2), to be run on the aspirin Q3 case (`¬aspirin`
  from `gu`, one defeat layer).
- **H2 — Polarity coherence with the global alignment.** δ must respect
  side-data item 3 (Ludics focusing ↔ Ambler evaluation strategy, fixed by
  Ambler 1996 §2 + Girard *Locus Solum*). δ₁ places defeat on the negative
  side; δ₂ on the positive side. Exactly one of these is consistent with the
  fixed polarity convention for the *defeat connective's* type — this needs
  to be read off the alignment, not assumed. (Audit §9 stress-test (3) is the
  prerequisite primary-source check; it has **not** been done.)
  **— DONE 2026-05-30 ([E3](e3-polarity-readoff-2026-05-30.md)):** the
  alignment **forces negative** polarity (the `P_L × N_L` interaction typing
  and the call-by-name evaluation regime both give this independently), so
  **δ₁ clears H2 and δ₂ fails it** (a positive-vs-positive test is ill-typed;
  δ₂ either collapses to δ₁ or fails H4).
- **H3 — MELL-representability.** Defeasible reasoning uses contraction and
  weakening, so the defeat operator's `!`-translation image must land inside
  MELL (audit §9.1 + Q-030). Whichever δ we pick must have a well-defined
  image under the BF-2011 designs-with-repetitions incarnation, *not* just
  under MALL FQ-incarnation. This constraint is **shared** by both
  candidates and is really a Q-030 dependency — see §5.
- **H4 — Behaviour-closure.** The image of a defeated argument under δ must
  still be a design *in a behaviour* (bi-orthogonally closed). A negative
  Daimon-capped chronicle (δ₁) is manifestly a legal design; a "marked
  positive locus" (δ₂) needs a precise definition of the mark such that the
  marked design is still in `B^♯`'s incarnation. δ₂ carries a definitional
  debt here that δ₁ does not.

---

## 3. Scored axes

For each axis, a short rationale and a provisional lean. Scores are
deliberately not numeric — the point is to surface *why*, so the eventual
commitment cites reasons.

| # | Axis | δ₁ defeat-as-negation | δ₂ defeat-as-coroutine | Lean |
|---|------|------------------------|------------------------|------|
| A1 | **Substrate consistency** | Native: matches Phase 2e Cross-Cone Incompatibility, which already lives at the design level as a *negative* incompatibility. No new substrate primitive. | Requires a "marked positive locus / cross-cone interaction" primitive the substrate does not yet have. | **δ₁** |
| A2 | **Theorem reuse** | Reuses the existing negative-side machinery; T002 antichain argument is about minimality under ⊆, which is polarity-agnostic but stated on FQ designs. | Coroutine semantics may need a fresh interaction-based ordering; less obviously compatible with the ⊆-minimality story. | **δ₁** |
| A3 | **Reinstatement (nested defeat) clarity** | Double-negation reading is mathematically crisp (`defeat∘defeat` = identity-up-to-iso on the chronicle), but **double negation in Ludics is not the identity** — Ludics is not classical. Risk: `defeat(defeat(π)) ≠ π`, which may *mismatch* Ambler's intended reinstatement. **Needs checking.** | Challenger-of-challenger is operationally explicit and may model reinstatement-with-residue more faithfully (the first attack leaves a trace). | **δ₁** — *resolved by [E1](e1-reinstatement-aspirin-2026-05-30.md) 2026-05-30:* the "residue" is Ambler's **monotone accrual** (`D_{t₁} ⊆ defeat² = D_{t₂}`), which δ₁ implements natively; naive δ₂ *discards* it |
| A4 | **Operational / implementation fit** | Static, declarative; easy to read off a finished design. Good for the *bridge proof*. | Dynamic; aligns with how an actual deliberation *engine* would schedule challenges (the Mesh dialogue runtime is closer to CSP than to static negation). Good for the *implementation*. | **δ₂** for runtime, **δ₁** for proof |
| A5 | **Cardinality behaviour for `φ`** | Defeat does not multiply incarnations (a blocked chronicle is one design). Keeps `|Inc(B)|` small — friendly to Q-028a stratum-1 enumeration. | A challenger is a parallel computation; may *increase* `|Inc(B)|` (challenger threads as distinct incarnations), risking a cardinality mismatch on the Ambler side (audit §9 stress-test (4), the `|Inc(B)| ≥ 3` check). | **δ₁** |
| A6 | **MELL/BF compatibility (Q-030)** | Negative Daimon ramifications are exactly what BF "designs with repetitions" decorate; plausibly the cheaper fit under the option-(b) upgrade. | Coroutine threads under repetitions may proliferate materiality witnesses (Q-032), complicating the antichain restatement. | **δ₁** (tentative — gated on Q-030 Phase 2/3) |
| A7 | **Faithfulness to Ambler 1996 §3** | Ambler's `defeat` is a *logical* operator on arguments; negation-style reading is closer to his categorical semantics. | CSP reading imports an operational intuition Ambler did not state; risk of encoding *our* model rather than *his*. | **δ₁** |
| A8 | **Naturality (b₃′ / Q-029)** | Static encoding → naturality square is a 1-cell diagram chase (the Q-029 fibration's within-fibre law). | Coroutine interaction may force 2-cells (Q-029 "negative-too-rich" branch), making b₃′ a coherence problem. | **δ₁** (keeps b₃′ tractable) |

**Reading of the table.** δ₁ wins on consistency, theorem reuse, cardinality,
faithfulness, and proof-tractability. δ₂ wins on *implementation/runtime fit*
(A4) and possibly on *reinstatement faithfulness* (A3) — and those two are the
axes most likely to matter for the deliberation engine rather than the bridge
proof. The tension is real: **the choice that is best for the C001b′ proof
(δ₁) may not be the choice that is best for the runtime (δ₂).**

---

## 4. Discriminating experiments (smallest tests that move the lean)

Ordered cheapest-first. Each is designed to flip at least one *open* cell
above, not to re-confirm a lean.

1. **E1 — Reinstatement on aspirin Q3 (settles A3, H1).**
   Take the one-defeat-layer case `¬aspirin` from `gu` in the
   [Q-027 audit](q027-thin-cones-2026-05-29.md). Hand-encode it under both
   δ₁ and δ₂. Then add a *reinstating* rule (a defeater of the defeater) and
   compute `defeat(defeat(·))` under each.
   - δ₁ passes A3 iff the double-encoding returns a design ⊆-equal to the
     original assertable chronicle. If Ludics non-classicality leaves a
     residue, δ₁ *loses* its A3 crispness and the table's A3 "open" resolves
     toward δ₂.
   - Simultaneously checks H1 (injectivity under nesting) for both.
   - **Cost:** paper, reuses existing Q-027 enumeration machinery. Do first.

2. **E2 — Cardinality of `Inc(B)` on a `|Inc(B)| ≥ 3` defeasible behaviour
   (settles A5, feeds Q-028a stratum 1).**
   Build the smallest defeasible `B` with ≥ 3 incarnations (the audit
   suggests a third independent route to `¬aspirin`). Count `|Inc(B)|` under
   δ₁ vs δ₂. If δ₂'s challenger-threads make `|Inc(B)| > |𝒞/Γ(A,B^♯)|`, δ₂
   triggers the **negative-cardinality** branch of Q-028a and is effectively
   eliminated for the bridge.
   - **Cost:** paper, but needs the Ambler-side λ-term enumeration for the
     extended fact-base. Do second.

3. **E3 — Polarity read-off (settles H2, depends on audit §9 stress-test 3).**
   Read the *type* of Ambler's defeat connective against the fixed
   focusing/evaluation alignment from primary sources (Ambler 1996 §2 +
   Girard *Locus Solum* §10). Determine whether the defeat connective is
   positive or negative in the aligned convention. This *directly* selects
   between δ₁ (negative) and δ₂ (positive) on H2 grounds, and may settle the
   whole question if the alignment forces a polarity.
   - **Cost:** primary-source reading; this is the one genuinely external
     dependency. It is also already on Q-028b's next-action list as
     stress-test (3), so E3 = that stress-test with a δ-selection lens.

4. **E4 — BF-incarnation sanity (settles A6, depends on Q-030 Phase 2).**
   Once Q-030 Phase 2 fixes the BF designs-with-repetitions base notion,
   check which δ has the cleaner image under BF materiality (Def 11.5) and
   the Q-032 antichain witness. Deferred until Q-030 advances; do **not**
   block the δ lean on it.

**Decision rule.** If E1 keeps δ₁'s A3 crisp **and** E3's polarity read-off is
negative, commit δ₁ now (with a recorded note that the runtime may later wrap
δ₁ in a δ₂-style operational layer — see §6). If E1 shows a reinstatement
residue **or** E3 forces positive polarity, re-open the table with δ₂ as the
new default and run E2 before committing.

> **AMENDED 2026-05-30 after running E1** (see
> [E1 audit](e1-reinstatement-aspirin-2026-05-30.md)). The original rule's
> A3 trigger was mis-calibrated: it treated a reinstatement *residue* as a
> δ₁ failure. Ambler 1996 p. 171 ("aggregation is necessarily monotone … no
> mechanism for one argument to defeat or undercut another") shows
> reinstatement is **monotone accrual of a stronger argument**, not
> double-negation collapse. Corrected rule: **commit δ₁ if `defeat²` is a
> monotone accrual `D_{t₁} ⊆ defeat² = D_{t₂}` landing on Ambler's stronger
> term**; a residue is *required*, and its **absence** (a δ₂-style
> `defeat² = D_{t₁}` collapse) is the failure mode (it discards reinstating
> evidence). Re-open toward δ₂ only on a **non-monotone** accrual (some
> original chronicle retracted) — which E1 did not exhibit. E1 thus
> **confirms** δ₁ on A3 and H1.

---

## 5. The Q-030 entanglement (do not conflate)

A subtlety worth stating loudly: **the δ choice and the MELL upgrade are
orthogonal but both block C001b′.** H3 (MELL-representability) is shared by
both candidates and is really a Q-030 question, not a δ question. We can — and
should — pick δ on the MALL fragment now (E1–E3 are all MALL-or-paper), and
let Q-030 decide *which incarnation notion* δ's image lives in later. The
argument shape is incarnation-notion-independent (audit §9.1), so a δ
committed on MALL grounds transfers to BF-incarnation unchanged in *shape*;
only the cardinality counts (A5/A6) get re-checked under repetitions.

Practical consequence: **δ is not blocked on Q-030.** Treat them as a 2×N
matrix — {δ₁, δ₂} × {MALL, MELL-via-BF} — and fill the MALL column now.

---

## 6. The proof-vs-runtime split (the most important open tension)

The single most important thing this brainstorm surfaces: A4 and A3 suggest
δ₂ is the better *operational* model (the Mesh deliberation runtime schedules
challenges like coroutines), while A1/A2/A5/A7/A8 make δ₁ the better *proof*
encoding. These need not be the same object.

Three ways to resolve the tension, in increasing ambition:

- **R1 — Commit δ₁, prove with it, note δ₂ as runtime view.** Cleanest for
  closing C001b′. Record that the runtime's coroutine scheduling is a *δ₂
  presentation* of the *δ₁ semantics*, with an obligation (new question) to
  show the two agree on `Inc(B)`. Lowest risk to the research programme.
- **R2 — Commit δ₂, prove the bridge survives the larger generating set.**
  Only viable if E2 shows no cardinality blow-up. Higher risk; better
  runtime story.
- **R3 — Prove δ₁ ≅ δ₂ as a substrate theorem.** The ideal: a canonical iso
  `Inc_δ₁(B) ≅ Inc_δ₂(B)` would make the choice presentational after all and
  *retroactively justify* the audit's "not equivalent" caveat being only
  about the *naive* encodings. This is the highest-value outcome and should
  be filed as a candidate question regardless of which of R1/R2 we adopt
  short-term — if R3 lands, the side-data item 4 substantiveness *dissolves*.
  **Now filed as [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037); the dedicated
  session brief is §11 below.**

**Recommendation — ENACTED 2026-05-30 (see §10):** pursued **R1** — committed
δ₁ as the substrate-default for the C001b′ proof (it is already the documented
default and dominates on the proof-relevant axes), and filed **R3** as
[Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) so the δ₂ runtime reading is
not lost and the equivalence question has a home. This unblocks Q-028b's
side-data item 4 on the MALL fragment while keeping the operational reading on
the books. The commitment is provisional pending confirmatory E1 + E3 (§4).

---

## 7. Concrete next actions (status as of 2026-05-30)

> **R1 already enacted** (§10): δ₁ recorded in the substrate venue, Q-028b
> item 4 updated, R3 filed as [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037).
> The remaining actions are *confirmation* of the provisional commitment and
> the R3 session.

1. ~~Run **E1** (reinstatement on aspirin Q3, both δ)~~ **— DONE 2026-05-30**
   ([E1 audit](e1-reinstatement-aspirin-2026-05-30.md)). Verdict: **confirms
   δ₁** on A3 (under the Ambler-monotone criterion) and H1 (injective under
   nesting); amends the §4 decision rule; surfaces an O1 obstruction for R3
   (naive δ₂ breaks O1 at nesting → Q-037 needs the *accumulating* coroutine).
2. Run **E3** (polarity read-off) — primary-source; this is audit §9
   stress-test (3) with a δ-selection lens. E1 already landed on the δ₁ side,
   so the provisional commitment now needs **only E3** to be fully confirmed.
   A positive-polarity E3 would still reopen toward δ₂ and force a §10 revision;
   note E1 found Ambler has **no** object-level defeat, so E3 re-scopes to the
   *substrate's* Cross-Cone Incompatibility polarity (E1 §7.2).
   **— DONE 2026-05-30** ([E3 audit](e3-polarity-readoff-2026-05-30.md)).
   Verdict: the alignment **forces negative polarity** (two independent routes:
   the `P_L × N_L` interaction typing, and the call-by-name evaluation regime),
   so **H2 is cleared on the δ₁ side** and δ₂'s positive locus is ill-typed
   (collapses to δ₁ or fails H4). Both confirmation gates now land on δ₁.
3. ~~Record the commitment + file R3~~ **— DONE 2026-05-30 (§10).** Recorded in
   [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
   Part II; Q-028b item 4 moved to "committed (provisional, MALL)";
   [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) (R3) filed.
4. **Kick off the R3 session** per §11 — settle Q-037 (δ₁ ≅ δ₂). First commit:
   functor definitions for `Inc_δ₁`/`Inc_δ₂` + the candidate normalisation iso
   `ν` on the aspirin instance (= E1).
5. Run **E2** only if E1/E3 reopen toward δ₂, or as the Q-028a stratum-1
   cross-check on the committed δ, or to stress O2/A5 within the R3 session.
   **— DONE 2026-05-31** ([E2 audit](e2-cardinality-multireinstater-2026-05-31.md)),
   run as the R3 O2/A5 stress-test. Verdict: `|Inc_δ₁| = |Inc_δ₂| = |𝒞/Γ⁺| = 3`
   on the minimal two-undercutter instance — **defeat does not multiply
   incarnations and δ₂ does not inflate the count (A5 → δ₁)**; multi-reinstater
   accrual decomposes into per-defeater single-generator `defeat²` + JSL join
   one level up, discharging the R3 multi-generator risk. Q-037 closes positive
   on the full defeasible fragment (modulo Q-031 termination).
6. **E4** stays deferred behind Q-030 Phase 2.

---

## 8. Open obstructions / caveats

1. **A3 rests on Ludics non-classicality.** The δ₁ double-negation
   reinstatement reading is only crisp if `defeat∘defeat` collapses; Ludics
   is intuitionistic-flavoured, so this is *not* automatic. E1 is the gate.
   If it fails, the whole table's lean shifts. **— RESOLVED 2026-05-30
   ([E1](e1-reinstatement-aspirin-2026-05-30.md)):** the premise was wrong —
   Ambler reinstatement is *monotone accrual*, not collapse, so the δ₁
   "residue" is **required**, not a defect; A3 lands on δ₁.
2. **H2 is unverified for both.** The polarity of Ambler's defeat connective
   under the fixed alignment has not been read from primary sources (it is
   the still-open audit stress-test (3)). The §3 table assumes δ₁'s negative
   placement is consistent; if the alignment forces positive, δ₁ fails H2 and
   δ₂ is forced. **— RESOLVED 2026-05-30 ([E3](e3-polarity-readoff-2026-05-30.md)):**
   the alignment **forces negative** polarity (interaction typing `P_L × N_L`
   + call-by-name evaluation), so δ₁ **clears** H2 and δ₂'s positive placement
   is ill-typed. This caveat is discharged on the δ₁ side.
3. **A5/A6 cardinality claims are MALL-side.** Under BF repetitions the
   counts change; the §3 leans on A5/A6 must be re-validated post-Q-030
   (filed implicitly under Q-032). **— A5 confirmed on MALL 2026-05-31
   ([E2](e2-cardinality-multireinstater-2026-05-31.md)):** on the minimal
   `|Inc(B)| = 3` instance, defeat does not multiply incarnations and δ₂ does
   not inflate the count (`|Inc_δ₁| = |Inc_δ₂| = |𝒞/Γ⁺| = 3`); the MELL/BF
   re-validation stays open under Q-030/Q-032.
4. **R3 may be false.** If δ₁ and δ₂ are *genuinely* non-isomorphic on
   `Inc(B)` (the audit's stated position), R3 fails and the choice stays
   substantive forever — making the R1 "runtime is a δ₂ view of δ₁" note an
   actual proof obligation, not a formality. **— RESOLVED 2026-05-31
   ([R3 doc](r3-delta-iso-session-2026-05-30.md) + [E2](e2-cardinality-multireinstater-2026-05-31.md)):**
   the iso `ν` = normalisation is a bijection (L-MERGE merge-canonicality,
   R3 §5.5), and E2 discharges the multi-generator risk, so **R3 is positive
   on the full defeasible fragment** — the runtime δ₂ view is a *proven*
   presentation of the δ₁ semantics, conditional only on the orthogonal
   termination precondition Q-031. **— TERMINATION DISCHARGED 2026-05-31
   ([R3 doc §2.1](r3-delta-iso-session-2026-05-30.md)):** the R3-termination
   theorem removes the Q-031 precondition on the one-level-nested / acyclic
   fragment (cut-count measure T1 + the structural depth-2 cap T2), so **R3
   closes positive *outright* there** — unconditionally. The only residue is the
   cyclic / unbounded-depth case (full Q-031), never instantiated by the bridge
   image.

---

## 10. Decision record — R1 enacted (2026-05-30)

**R1 is now committed.** Acting on this brainstorm, the substrate adopts
**δ₁ — defeat-as-negation** as the working defeat-encoding for the C001b′
proof. Three artefacts were updated the same day:

1. **Substrate venue.** [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
   Part II carries a dated "δ defeat-encoding commitment (provisional, R1)"
   note recording δ₁, its rationale, and the three caveats below.
2. **Open-questions registry.** [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b)
   gains a `δ-commitment (2026-05-30)` bullet moving side-data item 4 from
   "not yet committed" to "committed (provisional, MALL); confirmatory
   E1/E3 pending"; its `affects-implementation` line is annotated likewise.
3. **New question filed.** R3 is filed as
   [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) — *is there a canonical iso
   `Inc_δ₁(B) ≅ Inc_δ₂(B)`?* — so the δ₂ runtime reading is not lost and the
   equivalence question has a home.

**The commitment is explicitly provisional**, scoped to the MALL fragment,
and carries exactly these three caveats (mirrored in the substrate doc):

- **(C-i) E1 and E3 both executed — both confirm δ₁; caveat discharged.** The
  decision rule in §4 made δ₁'s commitment conditional on E1 and E3.
  **E1** ([audit](e1-reinstatement-aspirin-2026-05-30.md)) confirms δ₁ on A3
  (Ambler-monotone reinstatement) and H1; **E3**
  ([audit](e3-polarity-readoff-2026-05-30.md)) confirms δ₁ on H2 (the alignment
  forces negative polarity; δ₂'s positive locus is ill-typed). Both
  primary-source gates land on δ₁, so the commitment is **no longer merely
  table-dominant but confirmed**, and this caveat is **discharged**. (The
  remaining caveats C-ii and C-iii below are orthogonal and stand.)
- **(C-ii) MELL image pending.** δ₁'s `!`-translation image is subject to
  [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) (BF incarnation upgrade) and
  [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) (fixpoint check on iterated
  defeat). The commitment is MALL-side; the MELL column of the §5 2×N matrix
  stays open.
- **(C-iii) Runtime is δ₂.** The Mesh deliberation engine schedules challenges
  coroutine-style, so the runtime is operationally a δ₂ engine. R1's stance is
  that this is a δ₂ *presentation* of the δ₁ *semantics* — a claim that is only
  a formality if Q-037 (R3) lands, and otherwise an actual proof obligation
  (caveat §8(4)).

This decision record is the close-out of the brainstorm's §7 next-action (3).
The remaining next-actions (E1, E3, and conditionally E2) carry forward; E1 is
also the first deliverable of the R3 session below.

---

## 11. R3 session kickoff — proving δ₁ ≅ δ₂

> **Purpose.** This section is a standalone brief for a *future focused
> session* whose single goal is to settle [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037):
> construct (or refute) a canonical iso `Inc_δ₁(B) ≅ Inc_δ₂(B)`. A reader
> starting that session should be able to begin from this section alone.

> **EXECUTED 2026-05-30 — see [R3 working doc](r3-delta-iso-session-2026-05-30.md).**
> The session below was run. Outcome: the functor definitions (§11.6
> deliverable) and the candidate ν (§11.3) are done; ν = Ludics normalisation,
> ν⁻¹ = canonical de-normalisation, over the **accumulating-δ₂ = canonical-cut**
> class. O1-surj ✓ general; O1-inj ✓ on the aspirin instance and reduced in
> general to lemma **L-CANON** ("the accumulation merge is canonical"); O3 ✓
> (δ₂⁻¹ = δ₁⁻¹∘ν, ν = id on incarnations); O2 reduced to associativity of
> composition + L-CANON. Net: Q-037's open content is now the **single lemma
> L-CANON** + termination ([Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031)). The
> §11.5 outcome lands in "positive modulo one local lemma." Next deliverable:
> pin the merge operationally and prove L-CANON (R3 doc §8).

### 11.1 Why R3 is the highest-value follow-up

R1 bought us a *usable* δ at the cost of a standing obligation (caveat
C-iii). R3 is the move that retires the obligation **and** upgrades Q-028b
itself: if δ₁ and δ₂ are canonically isomorphic on the generating set, then
side-data item 4 — the *only* genuinely substantive of the four bridge
side-data items (audit §5) — stops being a choice. Q-028b's verdict improves
from *"qualified positive given δ"* to *"positive"* (modulo the MELL/Q-030
question, which is orthogonal — §5). No other single result on the δ axis does
this: E1–E3 can only *select* an encoding; R3 can *dissolve the selection*.

Concretely, a positive R3 delivers four things at once:
- **Q-028b:** removes the last substantive side-data item.
- **C001b′ b₃′:** the runtime/proof naturality square becomes trivial (the two
  encodings are the same object up to canonical iso), collapsing part of the
  b₃′ diagram chase.
- **Q-029:** the side-data fibration's δ-fibre becomes a point, simplifying the
  categorical home.
- **Runtime:** the Mesh engine keeps its coroutine scheduler with a *proven*
  correspondence to the bridge semantics — no rewrite.

### 11.2 The precise claim to prove

Define, for a defeasible behaviour `B`, two incarnation-construction maps:

- `Inc_δ₁(B)` — incarnations of `B^♯`'s Ludics image under the
  **defeat-as-negation** encoding: defeated arguments are negative,
  Daimon-capped, blocked chronicles.
- `Inc_δ₂(B)` — incarnations under the **defeat-as-coroutine** encoding:
  defeated arguments are marked positive loci (challenger threads).

> **Conjecture (R3 / Q-037).** There is a natural iso
> `ν_B : Inc_δ₂(B) ⟶ Inc_δ₁(B)`, natural in `B` along behaviour morphisms,
> such that `δ₁⁻¹ ∘ CH ∘ DP = δ₂⁻¹ ∘ CH ∘ DP` on `Inc(B)` — i.e. `ν` commutes
> with the bridge bijection `φ`.

Three obligations, in order of expected difficulty:

1. **(O1) Object-level iso.** `ν_B` and an inverse `ν_B⁻¹`, with both
   composites identity up to design-equality.
2. **(O2) Naturality in `B`.** `ν` commutes with the action of behaviour
   morphisms — this is what makes the choice presentational for b₃′.
3. **(O3) Bridge-compatibility.** `ν` is compatible with `φ` (the displayed
   equation), so the *same* Ambler generator set results either way.

### 11.3 The candidate construction (where to start)

The natural shape of `ν` is **normalisation**:

```
   δ₂ challenger-coroutine design
            │
            │  ν : run the coroutine to quiescence
            │      (cut-elimination / orthogonality saturation)
            ▼
   δ₁ negative-Daimon blocked design
            ▲
            │  ν⁻¹ : spawn one challenger per blocked
            │        negative chronicle
            │
   δ₁ negative-Daimon blocked design
```

- **Forward `ν` (δ₂ → δ₁):** a δ₂ design carries live challenger loci. Running
  the design's interaction to quiescence (Ludics normalisation against the
  counter-designs of `B^⊥`) collapses each resolved challenge into a Daimon
  cap — exactly the δ₁ blocked-chronicle shape. *Hypothesis:* normalisation is
  the iso. This is why [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031)
  (does iterated defeat stay in MELL, i.e. does normalisation terminate?) is a
  **precondition** for R3: if normalisation diverges on `defeat(defeat(…))`,
  `ν` is not well-defined.
- **Inverse `ν⁻¹` (δ₁ → δ₂):** canonically spawn a challenger thread for each
  blocked negative chronicle. Well-definedness needs δ₁'s blocked chronicles
  to be in bijection with δ₂'s challenger loci — plausible by construction but
  to be checked.

### 11.4 The discriminating worked example (first deliverable)

**Start with the aspirin Q3 reinstatement instance** — the same case as
brainstorm **E1**, so the R3 session's first deliverable doubles as the
still-pending E1 stress-test. Steps:

> **Partly executed 2026-05-30** — the worked example is done in the
> [E1 audit](e1-reinstatement-aspirin-2026-05-30.md). Key R3 finding: with the
> **naive** δ₂ (dead challengers discard evidence), O1 **fails at nesting**
> (`ν(defeat²_{δ₂}) = D_{t₁} ≠ D_{t₂} = defeat²_{δ₁}`); Q-037 must therefore be
> stated over the **accumulating / evidence-merging** δ₂ variant, whose first
> proof obligation is that the merge is canonical. See E1 §5.2.

1. Hand-encode the one-defeat-layer case (`¬aspirin` from `gu`, Q-027 audit)
   under both δ₁ and δ₂. Compute `ν` and `ν⁻¹` explicitly; check O1 on this
   instance.
2. Add the reinstating rule (a defeater of the defeater) and re-run. This is
   where Ludics non-classicality bites: confirm `ν` still lands a well-defined
   δ₁ design (caveat §8(1)). If `defeat∘defeat` under δ₂ normalises to the
   δ₁ double-negation residue *exactly*, O1 holds here and δ₁'s A3 crispness
   is simultaneously confirmed; if a residue survives, R3 is in the **partial**
   branch (iso on flat defeat, breaks on nested) and Q-037's scope narrows.
3. Cross-check O3: verify `φ` computes the same Ambler λ-term either way on
   this instance.

If the aspirin instance passes O1 + O3, escalate to a `|Inc(B)| ≥ 3` instance
(brainstorm **E2**) to stress O2 (naturality) and the cardinality concern
(A5): a positive R3 *requires* δ₂'s challenger threads **not** to create
incarnations absent on the δ₁ side — exactly the cardinality gap E2 checks.

### 11.5 Failure modes and what each implies

- **O1 fails (object iso doesn't exist):** δ₁ and δ₂ are genuinely distinct;
  Q-037 closes **negative**; caveat §8(4) fires — the R1 "runtime is a δ₂
  view" note is retracted and the runtime must either adopt δ₁ natively or
  carry an explicit non-canonical translation. R1's δ₁ proof commitment still
  stands (it was never contingent on R3), but the runtime/proof gap becomes
  permanent.
- **O1 holds, O2 fails (not natural):** the encodings agree object-wise but
  the iso doesn't transport along behaviour morphisms; b₃′ does *not* simplify
  and Q-029's δ-fibre stays non-trivial. Q-037 closes **partial**.
- **O1 + O2 hold, O3 fails (different `φ`):** the two encodings give iso
  generating sets but *different* Ambler images — the bridge is encoding-
  dependent after all; this is the most surprising outcome and would mean the
  audit §5 "not equivalent" caveat is about `φ`, not about `Inc`. Re-open the
  audit's reduction.
- **Normalisation diverges (Q-031 negative):** `ν` ill-defined on nested
  defeat; R3 blocked until the target logic is fixed (μMELL or a defeat-depth
  bound). Q-037 waits on Q-031.

### 11.6 Session preconditions and reading list

- **Precondition:** [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) need not be
  *closed*, but the session should at least know whether single-layer and
  one-level-nested defeat normalise (enough for the aspirin instance). The
  MELL/Q-030 column is *not* a precondition — work δ₁/δ₂ on MALL first (§5).
- **Reading:** Girard 2001 *Locus Solum* (normalisation, orthogonality);
  Curien 2003 *Introduction to Linear Logic and Ludics* (the
  coroutine/interaction reading of normalisation that motivates `ν`);
  Ambler 1996 §3 (the defeat operator both encodings target); the
  [Q-027 audit](q027-thin-cones-2026-05-29.md) (aspirin Q3 machinery reused in
  §11.4); [Q-028b audit](q028b-freeness-argument-2026-05-29.md) §5–§6 (the two
  encodings and `φ`).
- **First commit of the session:** precise functor definitions for
  `Inc_δ₁` and `Inc_δ₂` + the candidate `ν` on the aspirin instance. Everything
  else hangs off whether O1 survives that example.

---

## 12. References

- [Q-028b freeness audit](q028b-freeness-argument-2026-05-29.md) — §5 (the two
  δ candidates), §6 (the reduction φ = δ⁻¹∘CH∘DP), §9/§9.1 (stress-tests and
  the MELL obstruction).
- [Q-027 thin-cones audit](q027-thin-cones-2026-05-29.md) — the aspirin Q3
  worked example reused by E1/E2.
- [E1 audit](e1-reinstatement-aspirin-2026-05-30.md) — the executed E1
  (reinstatement on aspirin Q3): confirms δ₁ on A3/H1, amends the §4 decision
  rule, and supplies the R3 §11.4 worked example + the accumulating-δ₂ O1
  finding.
- [E3 audit](e3-polarity-readoff-2026-05-30.md) — the executed E3 (polarity
  read-off): the alignment forces negative polarity, clearing H2 on the δ₁
  side and showing δ₂'s positive locus is ill-typed; sharpens Q-037 (δ₂'s only
  well-typed reading is "δ₁ + a positive scheduling skin").
- [C001b′ conjecture](../03_CONJECTURES/C001b-prime-ambler-remainder.md) —
  b₁′ ∧ b₂′ gated on the δ commitment.
- [Q-029](../01_OPEN_QUESTIONS_REGISTRY.md#q-029) — categorical home for side
  data; A8 feeds its within-fibre vs 2-cell branch.
- [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) — MALL→MELL incarnation
  upgrade; H3/A6/E4 dependency.
- [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) — δ fixpoint check
  (precondition for the R3 normalisation map to terminate).
- [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) — R3, the δ₁ ≅ δ₂
  equivalence; session brief at §11.
- [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
  Part II — the decision venue (Cross-Cone Incompatibility = δ₁'s native home);
  carries the 2026-05-30 δ₁ commitment note.
- Ambler 1996 §3 (defeat operator); Girard *Locus Solum* §10 (polarity);
  Basaldella–Faggian 2011 *Ludics with Repetitions* (the MELL incarnation for H3/E4).
