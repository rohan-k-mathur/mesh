# E3 — polarity read-off of the defeat connective (δ₁ vs δ₂)

- **status:** complete (primary-source diagnostic)
- **date:** 2026-05-30
- **method:** primary-source reading + design-level type-check; no mechanisation
- **sources:** Ambler 1996 §2 (the SLat-enriched / symmetric-monoidal structure
  and the evaluation map); Girard 2001 *Locus Solum* §2, §10 (focalization,
  polarity discipline, daimon); the substrate's own polarity fixing in
  [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
  §I.2; the faithfulness constraint already pinned in
  [Q-027 §6.2](q027-thin-cones-2026-05-29.md)
- **runs:** experiment **E3** of the
  [δ decision brainstorm](delta-defeat-encoding-decision-brainstorm-2026-05-30.md)
  §4; = audit §9 stress-test (3) of the
  [Q-028b audit](q028b-freeness-argument-2026-05-29.md), with a δ-selection lens;
  the second (and last) confirmation gate for the §10 R1 commitment
- **settles:** constraint **H2** (polarity coherence with the global alignment,
  side-data item 3) of the brainstorm §3
- **headline verdict:** the polarity read-off returns **negative**, on two
  independent grounds (interaction-structure and evaluation-strategy).
  **δ₁ (defeat-on-the-negative-side) is polarity-consistent; δ₂ (defeat as a
  marked *positive* locus) is not** — it is ill-typed under the focusing
  discipline (Ludics interaction is always positive-vs-negative, never
  positive-vs-positive) and it conflates Ambler's *positive rival argument*
  with the *meta-level defeat*, which Ambler keeps distinct. E3 **confirms δ₁**
  and clears H2. With E1 (A3/H1) and E3 (H2) both landing on δ₁, the two
  confirmation gates of the R1 commitment are closed; caveat C-i is discharged
  (only the orthogonal MELL/Q-030 caveat C-ii remains, plus the Q-037 runtime
  question C-iii).

---

## 0. What E3 tests, after E1's re-scoping

Brainstorm §4 E3 (original intent): read the *type* of Ambler's defeat
connective against the fixed focusing/evaluation alignment (Ambler 1996 §2 +
Girard *Locus Solum* §10) and determine whether it is positive (→ δ₂) or
negative (→ δ₁). The decision rule attached: *a negative read-off commits δ₁;
a positive read-off forces δ₂.*

[E1](e1-reinstatement-aspirin-2026-05-30.md) §0/§7.2 re-scoped this: Ambler
1996 (p. 171) has **no object-level defeat connective** — defeat is meta-level,
and his calculus is monotone. So E3 cannot read a polarity off an Ambler
primitive that does not exist. The corrected E3 question:

> Given the fixed alignment (side-data item 3: Ludics focusing ↔ Ambler
> evaluation strategy), and given that the **substrate** adds the defeat
> structure that Ambler handles at the meta-level, **which polarity does the
> substrate's defeat structure necessarily carry** to remain coherent with the
> alignment? Negative ⇒ δ₁; positive ⇒ δ₂.

This is a sharper question than the original, because the answer is now forced
by *two* fixed data — the substrate's polarity convention **and** Ambler's
evaluation strategy — rather than read off a connective Ambler never defined.

---

## 1. The two fixed data the read-off must respect

### 1.1 The substrate's polarity convention (LUDICS_TRIADS §I.2)

Verbatim structure (Basaldella 2015 Def 1.1 instantiation):

- `P_L` = designs at **positive** loci — "sequences with focalization + daimon
  as ultra-positive end-marker" (Girard 2001 §2). These are the **proponent's**
  assertions.
- `N_L` = designs at **negative** loci `Λ* = {ξ* : ξ ∈ Λ}` — "co-designs /
  counterdesigns". These are the **opponent's** tests.
- Orthogonality: `p ⊥_L n` iff `⟨p | n⟩` normalises to the daimon `✝`.
  **Interaction is a pairing `P_L × N_L → {✝, ⊥}`** — a positive design is run
  *against* a negative one. There is no `P_L × P_L` interaction primitive.

And the faithfulness constraint already pinned in
[Q-027 §6.2](q027-thin-cones-2026-05-29.md):

> "Ambler's `f ∈ 𝒮/Γ(A, B)` is a **positive** offering by the prover; it must
> map to a **positive** design at the conclusion. … inverting the polarity of
> `aspirin` … destroys the bridge."

So the conclusion locus `ξ_B` of an argument *for* `B` is **positive**, fixed,
non-negotiable.

### 1.2 Ambler's evaluation strategy (Ambler 1996 §1.2, §2)

- The base category `𝒞/Γ` is the **simply-typed λ-calculus with pairing** over
  Γ; Curry–Howard identifies its terms with natural-deduction proofs in the
  `(&, ⇒)` fragment of **minimal logic**, and "proof normalisation corresponds
  to βη reduction" (p. 172).
- The hom-sets are **SLat-enriched**: aggregation `f ∨ g` = union, vacuous
  argument `0` = ∅; composition distributes over `∨` (p. 173). Conjunction is a
  tensor `⊗ : 𝒜 ⊗ 𝒜 → 𝒜`, making `𝒜` a **symmetric monoidal SLat-category**,
  "and hence corresponds to a simple form of **linear logic** (Girard 1987)"
  (p. 174).
- Evaluation is the CCC `eval` map `ε_{B,C} : (B ⇒ C) × B → C`, computed by
  head reduction `fst(y)(snd(y))` (p. 173) — i.e. the **function is evaluated
  first**.

The evaluation regime is therefore **call-by-name** (simply-typed λ with
β-normalisation, function-position head reduction). Under the standard
polarisation of evaluation (Danos–Joinet–Schellinx; Curien–Herbelin
*duality of computation*), **call-by-name is the negative regime**: the
`⇒` connective and the conclusion-directed computation are **negatively
biased**.

---

## 2. The read-off, route 1 — interaction structure

A *defeat* is, operationally, **one argument testing/blocking another**: the
defeater confronts the asserted conclusion and (when it succeeds) prevents the
assertion from being the last word. In the substrate's convention (§1.1), "one
design testing another" has exactly one realisation: the **orthogonality
interaction** `⟨p | n⟩`. And that interaction is typed

$$\bot_L \;:\; P_L \times N_L \longrightarrow \{✝, \bot\}.$$

The tester is a **counter-design** `n ∈ N_L = D^{⊥}` — a **negative** design.
There is no positive-vs-positive test. Therefore the defeat structure, *qua*
the thing that confronts the positive conclusion `ξ_B`, must live on the
**negative** side. This is precisely δ₁: a negative design grafting the
attack ramification above the positive skeleton, Daimon-capped (E1 §2).

**Why δ₂ is ill-typed here.** δ₂ encodes defeat as a "marked **positive** locus
for cross-cone interaction" (brainstorm §1, §3). But cross-cone *interaction*
is orthogonality, which is `P_L × N_L`. A positive locus cannot interact with
the positive conclusion `ξ_B` directly. So δ₂ must, to make its "interaction"
well-defined, either:

- **(a)** covertly supply a negative counter-design for the actual test — in
  which case the negative design is doing the defeating and the "marked
  positive locus" is inert decoration: δ₂ **collapses into δ₁**; or
- **(b)** posit a genuine `P_L × P_L` interaction — which is **not a legal
  Ludics interaction**, so the "marked positive design" is not in any
  behaviour's incarnation (it fails constraint **H4**, the behaviour-closure
  / "definitional debt" the brainstorm §2 already flagged for δ₂).

Either way the polarity discipline rejects δ₂'s positive placement. The
read-off is **negative**.

---

## 3. The read-off, route 2 — evaluation strategy

Independently of the interaction argument: side-data item 3 aligns Ludics
focalization with Ambler's evaluation strategy, and that strategy is
**call-by-name** (§1.2). Under CBN polarisation the conclusion connective `⇒`
and the conclusion-directed reduction are **negative**. A defeat is an
**interruption of conclusion-directed evaluation** — it blocks the reduction
that would otherwise drive the proof to its `B`-conclusion and `✝`. An action
that interrupts a negatively-biased evaluation sits on the **negative** side of
the focalization (it is an opponent move in the evaluation, not a new proponent
focus).

This route reaches the same verdict — **negative** — by the evaluation-strategy
half of the alignment, which is the half the original E3 spec named. It does
**not** rely on the interaction-structure argument of §2, so the two routes are
genuinely independent confirmations.

---

## 4. The Ambler-faithfulness catch (why δ₂ mis-models reinstatement *and* polarity)

E1 found that Ambler keeps two things distinct that δ₂ conflates; E3 shows the
conflation is also a *polarity* error, not only an A3 error:

- **The positive rival argument.** In the aspirin fact-base, `¬aspirin` is a
  perfectly good **positive** argument at its **own** locus `ξ_¬asp`
  (`c₁(i₁ snd(x))`, Q-027 §2.2) — its own cone, monotonically aggregated, never
  *removing* the aspirin argument (Ambler p. 171: "competing hypotheses … not
  complementary or exclusive"; aggregation is monotone). This positive thing
  already exists in the enumeration and is **not** a defeat operator.
- **The meta-level defeat.** The actual *blocking* of the aspirin assertion is
  Ambler's meta-level decision procedure. In the substrate that meta-level act
  is realised by the **cross-cone orthogonality test** — a **negative**
  confrontation between cones (Phase 2e Cross-Cone Incompatibility).

δ₂'s "defeat = a positive challenger asserting the rival" **identifies these
two**: it tries to make the *positive rival argument* do the *defeating*. But
the positive rival argument, being positive, can only be **aggregated** (∨,
union) with the original — it cannot test it (§2). So δ₂ either does no actual
defeating (the rival just sits alongside, monotone — which is correct Ambler
*aggregation* but not *defeat*), or it smuggles in the negative test (collapsing
to δ₁). δ₁ respects the distinction natively: the rival argument is a separate
positive cone, and defeat is the negative cross-cone test. **Faithfulness
(brainstorm A7) and polarity (H2) point the same way.**

---

## 5. Verdict and consequences

### 5.1 H2 cleared, on the δ₁ side

| | δ₁ defeat-as-negation | δ₂ defeat-as-coroutine (positive locus) |
|---|---|---|
| Interaction-structure (route 1) | **consistent** — defeat is a counter-design `n ∈ N_L` | **inconsistent** — `P_L × P_L` test is ill-typed; collapses to δ₁ or fails H4 |
| Evaluation-strategy (route 2) | **consistent** — interrupts a CBN (negative) evaluation on the negative side | **inconsistent** — would require a positive interruption of a negative regime |
| Ambler-faithfulness (§4) | **consistent** — keeps positive-rival vs negative-defeat distinct | **inconsistent** — conflates aggregation with defeat |

The brainstorm §3 H2 row is now resolved: **the alignment forces negative
polarity for the defeat structure**, which is δ₁'s placement. H2 was the
constraint the brainstorm §8(2) flagged as "unverified for both"; it is now
**verified, and it selects δ₁**.

### 5.2 The R1 commitment is fully confirmed (caveat C-i discharged)

The §10 R1 record committed δ₁ provisionally, conditional on two confirmations:
**E1** (A3/H1) and **E3** (H2). Both are now executed and **both land on δ₁**:

- E1: reinstatement is Ambler-monotone accrual; δ₁ implements it natively,
  naive δ₂ discards the evidence (A3 → δ₁; H1 holds for δ₁, fails for naive δ₂).
- E3: the alignment forces negative polarity; δ₁ is consistent, δ₂ is ill-typed
  (H2 → δ₁).

**Caveat C-i ("E1/E3 not yet run") is discharged.** The δ₁ commitment is no
longer merely "dominant on the §3 table"; it is **confirmed by both
primary-source gates**. The two remaining caveats are unaffected and orthogonal:
**C-ii** (MELL image pending Q-030/Q-031 — a fragment question, not a δ
question, brainstorm §5) and **C-iii** (the runtime is operationally δ₂; the
δ₁≅δ₂ agreement is [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037)/R3).

### 5.3 A sharper statement of Q-037 (R3)

E3 strengthens the R3 framing. Because δ₂'s positive placement is **ill-typed**
as a *standalone* defeat encoding (§2), the only coherent δ₂ is the one whose
positive challenger is **paired with the negative test it secretly relies on** —
i.e. δ₂ is best understood as a *positive presentation that normalises to a δ₁
negative design when run against its counter-design*. That is exactly the
normalisation map `ν` proposed for R3 (brainstorm §11.3): E3 supplies an
*a priori* reason the map should exist (δ₂'s interaction is δ₁'s test in
disguise), independent of E1's instance-level evidence. Recorded for Q-037: the
R3 iso is not a coincidence to be discovered but a *consequence of δ₂'s only
well-typed reading being "δ₁ + a positive scheduling skin."*

### 5.4 E3 simplified, as E1 predicted

E1 §7.2 predicted E3 would re-scope to the substrate's Cross-Cone
Incompatibility polarity rather than an Ambler connective. That is what
happened: the read-off used the **substrate** convention (§1.1) plus Ambler's
**evaluation strategy** (§1.2, which Ambler *does* fix), not a nonexistent
Ambler defeat connective. The original audit §9 stress-test (3) ("cross-check
Ambler §2 against *Locus Solum* §10") is answered: they are compatible, and the
compatibility **forces** the negative reading.

---

## 6. What E3 does NOT settle

1. **MELL/Q-030 is untouched.** E3 is a MALL-fragment polarity argument
   (brainstorm §5: pick δ on MALL now). Whether δ₁'s `!`-translation image is
   clean under the BF designs-with-repetitions incarnation is
   [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030)/E4, deferred and orthogonal.
2. **Q-037 is not closed, only sharpened.** §5.3 gives an *a priori* reason `ν`
   exists; it does **not** prove O1/O2/O3. The accumulating-δ₂ definition E1 §5.2
   demanded is still the next R3 deliverable; E3 only explains *why* such a δ₂
   must reduce to δ₁.
3. **Higher-order types not exercised.** The polarity read-off used the
   propositional aspirin fragment. Ambler's `𝒮/Γ` is uniform across types, but a
   function-type defeat (where `A ⇒ B` itself is defeated) was not checked — it
   should be on the C001b′ verification list (cf. Q-027 §8.3).

---

## 7. References

- [δ decision brainstorm](delta-defeat-encoding-decision-brainstorm-2026-05-30.md)
  — §3 (H2 row, A7), §4 (E3 spec + decision rule), §8(2) (H2-unverified caveat
  E3 closes), §10 (R1 record; caveat C-i discharged here), §11.3 (the `ν`
  map E3 §5.3 gives an a-priori reason for).
- [E1 audit](e1-reinstatement-aspirin-2026-05-30.md) — §0/§7.2 (the re-scoping
  of E3 to the substrate convention; "Ambler has no object-level defeat"),
  §5.2 (the accumulating-δ₂ requirement E3 §5.3 explains).
- [Q-027 thin-cones audit](q027-thin-cones-2026-05-29.md) — §2.2 (the positive
  `¬aspirin` rival argument), §6.2 (the faithfulness constraint: arguments map
  to positive designs; polarity inversion destroys the bridge).
- [Q-028b freeness audit](q028b-freeness-argument-2026-05-29.md) — §9
  stress-test (3) (the Ambler §2 ↔ *Locus Solum* §10 cross-check E3 executes).
- [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) — R3; E3 §5.3 sharpens its
  framing (δ₂'s only well-typed reading is "δ₁ + scheduling skin").
- [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
  §I.2 (the `P_L`/`N_L` polarity convention and the `P_L × N_L` interaction
  typing), Part II δ commitment note (caveat (i) now both gates executed).
- [AMBLER_PAPER.md](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/AMBLER_PAPER.md)
  §1.2 (simply-typed λ, Curry–Howard, β-normalisation = CBN), §2 (SLat-enriched
  hom-sets, symmetric monoidal = "a simple form of linear logic", the `eval`
  map), p. 171 (monotone aggregation; competing-but-not-complementary
  hypotheses).
- Girard 2001 *Locus Solum* §2 (focalization, daimon), §10 (polarity discipline).
