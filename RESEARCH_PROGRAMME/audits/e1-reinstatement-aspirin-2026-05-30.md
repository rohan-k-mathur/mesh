# E1 — reinstatement on aspirin Q3 (δ₁ vs δ₂ under nested defeat)

- **status:** complete (paper diagnostic)
- **date:** 2026-05-30
- **method:** worked example, no mechanisation; reuses the Q-027 aspirin Q3
  enumeration machinery
- **source instance:** Ambler 1996 §1.1 Example 1 (medical diagnosis / aspirin),
  via the [Q-027 audit](q027-thin-cones-2026-05-29.md) §5
- **runs:** experiment **E1** of the
  [δ decision brainstorm](delta-defeat-encoding-decision-brainstorm-2026-05-30.md)
  §4; = audit §9 stress-test (2) of the
  [Q-028b audit](q028b-freeness-argument-2026-05-29.md); = first deliverable of
  the R3 session ([Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037)) per
  brainstorm §11.4
- **settles axes:** A3 (reinstatement clarity) and constraint H1 (injectivity
  of δ⁻¹ under nesting) of the brainstorm §3 table
- **headline verdict:** the brainstorm's *provisional* A3 reading — "a
  reinstatement residue resolves A3 toward δ₂" — is **reversed**. Ambler's own
  text (1996 p. 171) makes reinstatement **monotone accrual of a stronger
  argument**, not double-negation collapse. Under the corrected criterion **δ₁
  passes A3 natively and δ₂'s naive coroutine *fails* it** (it discards the
  reinstating evidence). The §10 R1 commitment to δ₁ **stands and is
  strengthened**. H1 holds for δ₁. E1 also localises an O1 obstruction for R3:
  the naive δ₂ encoding disagrees with δ₁ on nested defeat, so Q-037 needs the
  *accumulating* coroutine variant of δ₂.

---

## 0. What E1 tests, and the Ambler constraint that reframes it

Brainstorm §4 E1 (verbatim intent): hand-encode the one-defeat-layer
`¬aspirin`-from-`gu` case under δ₁ and δ₂, add a reinstating rule (a defeater
of the defeater), compute `defeat(defeat(·))` under each, and read off A3
(does δ₁'s double-encoding return a design ⊆-equal to the original assertable
chronicle?) and H1 (injectivity under nesting).

The decision rule attached to E1 was: *if E1 leaves a reinstatement residue,
δ₁ loses A3 crispness and A3 resolves toward δ₂.* That rule silently assumes
the **right** model of Ambler reinstatement is **double-negation collapse**
(`defeat∘defeat = id`). The primary source says otherwise.

> **Ambler 1996, p. 171** (medical-diagnosis discussion):
> "given additional evidence to show that the patient does not have a gastric
> ulcer, we obtain a **stronger argument** in favour of aspirin and the
> decision would be reversed. … The propositions `aspirin` and `not_aspirin`
> are competing hypotheses but there is nothing to suggest that they are either
> complementary or exclusive. … the aggregation of arguments is **necessarily
> monotone**. To overturn a decision one must supply a stronger argument on the
> other side. **There is no mechanism for one argument to defeat or undercut
> another.**"

Three load-bearing facts from this passage:

1. **No object-level defeat.** Defeat/undercut is **meta-level** in Ambler;
   his logic has no negation-as-involution and no defeat operator. The
   `defeat(π)` that δ encodes is therefore a **substrate extension** layered
   over Ambler's monotone calculus, not a faithful reading of an Ambler
   primitive. Whatever δ does, its *observable shadow on `𝒞/Γ`* must be
   monotone (it may only **add** arguments, never retract one).
2. **Reinstatement = a stronger argument, not the old one restored.** The
   reinstated support for aspirin is explicitly the argument that *uses* the
   `¬gastric_ulcer` evidence — in the Q3 enumeration that is the `t₂` term
   `t₂ ⟨fst(x), i₂⟨st,an⟩⟩` (Q-027 §2.3), **not** the bare `t₁ fst(x)`.
3. **`aspirin` and `not_aspirin` are not complementary.** So the δ₁
   "double-negation" intuition has no classical involution to lean on — exactly
   the brainstorm §8(1) caveat. But the passage tells us the *replacement*
   reading: monotone accrual.

**Corrected A3 criterion.** δ's `defeat∘defeat` is Ambler-faithful iff it is a
**monotone reinstatement-accrual**: the doubly-defeated design must *extend*
the original by the reinstating evidence and land on Ambler's stronger
argument (`t₂`), i.e.

$$D_{t_1} \;\subseteq\; \mathsf{defeat}^2(D_{t_1}) \;=\; D_{t_2}.$$

The old criterion (`defeat² = D_{t_1}` exactly) is now seen to be the *wrong*
test — it would reward an encoding that **throws the reinstating evidence
away**.

---

## 1. The concrete instance (from Q-027 §5)

The aspirin fact-base already contains a complete two-layer defeat chain; no
new rules are needed beyond Γ (Q-027 §1):

| Layer | Role | Ambler rule(s) | Effect |
|-------|------|----------------|--------|
| 0 | base argument **for** `aspirin` | `t₁ : muscle_pain → aspirin` | `t₁ fst(x)` |
| 1 | **rebuttal** (the defeater) | `c₁∘i₁ : stomach_pain → gastric_ulcer → ¬aspirin` | `c₁(i₁ snd(x))` attacks layer 0 |
| 2 | **undercut of the rebutter** (reinstatement) | `i₂ : (short_term ∧ anxiety) → ¬gastric_ulcer` | `i₂⟨st,an⟩` removes the `gu` premise of layer 1 |

The Q3 context `mp ∧ sp ∧ st ∧ an` (Q-027 §2.3) is exactly the context in
which all three layers are live. We reuse the safe Ludics encoding of Q-027
§5.1 (one positive locus per atom; each rule = one positive ramification at its
conclusion locus; context atoms discharged by daimon).

**Design notation.** A positive action `+ξ·r` selects ramification `r` at
locus `ξ`; a negative action `−ξ·p` is the opponent dispatch on premise `p`;
`✝` is the daimon. From Q-027 §5.2:

- Base argument (layer 0), `D_{t_1} ∈ Inc(B_{Q3})`:

$$D_{t_1} \;=\; \langle\, +\xi_{asp}{\cdot}t_1,\ -mp,\ +\xi_{mp}{\cdot}fst(x),\ ✝\,\rangle$$

- Accrued argument (Ambler's stronger term), `D_{t_2} ∈ Inc(B_{Q3})`:

$$D_{t_2} \;=\; \langle\, +\xi_{asp}{\cdot}t_2,\ -(mp{\wedge}\neg gu),\ +\langle\,\rangle,\ \big[\,+\xi_{mp}{\cdot}fst(x),✝\,\big]\,\otimes\,\big[\,+\xi_{\neg gu}{\cdot}i_2,\ -(st{\wedge}an),\ +\langle\,\rangle,✝\,\big]\,\rangle$$

- Rebutter chronicle (layer 1 producer of `¬aspirin`):

$$\chi_{\mathrm{def}} \;=\; \langle\, +\xi_{\neg asp}{\cdot}c_1,\ -gu,\ +\xi_{gu}{\cdot}i_1,\ -sp,\ +\xi_{sp}{\cdot}snd(x),\ ✝\,\rangle$$

- Undercutter chronicle (layer 2 producer of `¬gastric_ulcer`):

$$\chi_{\mathrm{und}} \;=\; \langle\, +\xi_{\neg gu}{\cdot}i_2,\ -(st{\wedge}an),\ +\langle\,\rangle,\ ✝\,\rangle$$

The crucial structural fact, read straight off Q-027 §2.3: **`χ_und` is the
exact sub-chronicle that distinguishes `D_{t_2}` from `D_{t_1}`.** The
reinstating evidence and the gap between Ambler's two generators are the *same
object*. This is what makes the aspirin instance the right E1 probe: monotone
reinstatement here has a forced, pre-computed target (`D_{t_2}`).

---

## 2. The two encodings on the base chronicle

**δ₁ — defeat-as-negation.** `defeat_{δ₁}(D)` turns the positive assertion at
the conclusion locus into a **blocked chronicle**: the opponent's attack
ramification (the defeater's conclusion move) is grafted on the **negative**
side above `D`'s positive skeleton, and `D`'s continuation is capped by `✝`.
The conclusion is *present but no longer the last word*.

$$\mathsf{defeat}_{δ_1}(D_{t_1}) \;=\; N_1 \;:=\; \big\langle\, +\xi_{asp}{\cdot}t_1,\ -mp,\ +\xi_{mp}{\cdot}fst(x),\ \underbrace{-\xi_{asp}{\cdot}\chi_{\mathrm{def}}}_{\text{opponent grafts }\neg asp},\ ✝\,\big\rangle$$

`N₁` is a legal **negative** design (constraint H4): the positive `t₁`
skeleton survives verbatim, dominated by a negative `¬asp` branch carrying
`χ_def`, Daimon-capped. This is exactly the Phase 2e **Cross-Cone
Incompatibility** shape (brainstorm A1).

**δ₂ — defeat-as-coroutine.** `defeat_{δ₂}(D)` leaves `D` positive and spawns a
**live positive challenger** at a fresh locus, `⊗`-composed for cross-cone
interaction:

$$\mathsf{defeat}_{δ_2}(D_{t_1}) \;=\; D_{t_1}\ \big\Vert\ \mathsf{Chal}(\chi_{\mathrm{def}})$$

where `Chal(χ_def)` is the `c₁∘i₁` computation running as a parallel thread
marked to interact at `ξ_asp`. `D_{t₁}` itself is **unmodified**.

Both flatten correctly at layer 1 (constraint H1 on *flat* defeat — the
brainstorm already noted both pass here): `δ₁` blocks the chronicle, `δ₂`
schedules a challenger; either way `aspirin` is, at layer 1, defeated. The
discrimination is at layer 2.

---

## 3. Layer-2 defeat (reinstatement): the computation

### 3.1 δ₁ — second negation re-opens the chronicle, **carrying** the evidence

`defeat_{δ₁}(N₁)` attacks `N₁`'s attack. `N₁`'s `¬asp` branch rests on `gu`
(supplied inside `χ_def` by `+ξ_gu·i₁`). The reinstating move is the
undercutter `χ_und`: `¬gu` removes that `gu` premise. In Ludics terms, the
design answers the opponent's `¬asp` graft by playing `χ_und` against the `gu`
locus, which **closes the negative `¬asp` branch** and re-opens the positive
aspirin continuation:

$$\mathsf{defeat}_{δ_1}(N_1) \;=\; \big\langle\, +\xi_{asp}{\cdot}t_1,\ -mp,\ +\xi_{mp}{\cdot}fst(x),\ \underbrace{+\xi_{\neg gu}{\cdot}i_2,\ -(st{\wedge}an),\ +\langle\,\rangle,\ ✝}_{\text{reinstating }\chi_{\mathrm{und}}\text{ now threaded into the design}}\,\big\rangle.$$

The reinstatement is **not** a deletion of `N₁`'s negative branch back to the
bare `D_{t₁}`: Ludics bi-orthogonal closure only ever **adds** chronicles
(monotone — Phase 2e). The `χ_und` evidence is now a **positive negative-branch
extension** of the original skeleton. Re-presenting this design at `ξ_asp`
through the rule that *consumes* `¬gu` — namely `t₂`, whose premise is
`mp ∧ ¬gu` — gives precisely `D_{t₂}`:

$$\boxed{\;D_{t_1}\ \subseteq\ \mathsf{defeat}_{δ_1}^2(D_{t_1}) \;=\; D_{t_2}\;}$$

A **strict, monotone extension** by exactly the reinstating evidence —
matching Ambler's "stronger argument in favour of aspirin" (§0, fact 2).

### 3.2 δ₂ — challenger-of-challenger kills, original resumes **unchanged**

`defeat_{δ₂}(defeat_{δ₂}(D_{t₁}))` spawns `Chal(χ_und)` against
`Chal(χ_def)`. Running the coroutine network to quiescence: `χ_und` defeats the
`gu` premise of `χ_def`, so the `¬asp` challenger thread **dies**; the original
`D_{t₁}` thread — which the δ₂ encoding never touched — resumes and converges
on `aspirin`. A dead CSP challenger leaves **no residue**:

$$\boxed{\;\mathsf{defeat}_{δ_2}^2(D_{t_1}) \;=\; D_{t_1}\;}\qquad(\text{naive / non-accumulating challenger}).$$

This is "crisp" in the discarded double-negation sense (`defeat² = id`), but it
**throws away `χ_und`** — the design never reaches `D_{t₂}`, and the Ambler
"stronger argument" is **lost**.

---

## 4. Reading off A3 and H1

### 4.1 A3 (reinstatement clarity) — verdict reversed to **δ₁**

| | literal old criterion `defeat² = D_{t₁}` | corrected criterion `D_{t₁} ⊆ defeat² = D_{t₂}` (Ambler-monotone) |
|---|---|---|
| **δ₁** | **fails** (leaves the `χ_und` residue) | **passes** — the residue *is* the reinstatement; lands on Ambler's `t₂` |
| **δ₂ (naive)** | **passes** (returns `D_{t₁}`) | **fails** — discards `χ_und`, never reaches `t₂` |

The brainstorm's provisional rule fired on the *old* criterion and would have
pushed A3 toward δ₂. The primary source (§0) shows the old criterion rewards
exactly the wrong behaviour (evidence loss). **Under the Ambler-faithful
criterion the A3 "open" cell resolves toward δ₁.** δ₁'s non-classicality
"residue" — flagged as a risk in brainstorm §8(1) — is not noise; it is the
mechanism by which δ₁ *implements* Ambler's monotone reinstatement for free
(Ludics monotonicity = Ambler's "aggregation is necessarily monotone").

### 4.2 H1 (injectivity of δ⁻¹ under nesting) — holds for δ₁

δ₁ sends the three nesting depths to three **distinct** designs:

$$D_{t_1}\ \ \neq\ \ N_1\ (\text{blocked})\ \ \neq\ \ D_{t_2}\ (=\mathsf{defeat}^2),\qquad D_{t_1}\subsetneq D_{t_2}.$$

No two layers collapse to the same design, so δ₁⁻¹ is injective on this
nested-defeat chain — the §6.1 injection step of the Q-028b reduction survives
nesting **on this instance** (the audit §9 stress-test (2) target). For naive
δ₂, depths 0 and 2 **coincide** (`defeat² = D_{t₁} =` depth 0), so δ₂⁻¹ is
**not** injective across the reinstatement layer — an independent strike
against the non-accumulating coroutine.

---

## 5. Consequences

### 5.1 For the R1 commitment (brainstorm §10)

The R1 commitment to δ₁ **stands and is strengthened**: A3 moves from "open"
to a δ₁ lean, and the move rests on a **primary-source** reading rather than an
intuition. The brainstorm §4 decision rule should be amended — see §6 — because
its A3 trigger was calibrated against the wrong criterion. No revision of the
§10 record's *direction* is required (δ₁ still wins); only its caveat (C-i)
weakens, since E1 (one of the two pending confirmations) now **confirms** δ₁
rather than threatening it. E3 (polarity read-off) remains outstanding.

### 5.2 For R3 / Q-037 (brainstorm §11) — an O1 obstruction, and its fix

This is the first deliverable of the R3 session (brainstorm §11.4), and it
already bites. The candidate normalisation iso `ν` (run the δ₂ coroutine to
quiescence → δ₁ blocked design) must satisfy **O1** (object-level iso). On the
nested instance:

$$\nu\big(\mathsf{defeat}_{δ_2}^2(D_{t_1})\big) = \nu(D_{t_1}) = D_{t_1}\ \neq\ D_{t_2} = \mathsf{defeat}_{δ_1}^2(D_{t_1}).$$

So with the **naive** δ₂ challenger, **O1 fails at nesting** — Q-037 would be
in the "partial" branch (iso on flat defeat, breaks on reinstatement,
brainstorm §11.5). The diagnosis is precise: the failure is δ₂'s
**non-accumulation** (dead challengers discard evidence), not a defect of `ν`.
The fix is to define δ₂ as the **accumulating / evidence-merging coroutine**:
on challenger death, merge the challenger's supporting chronicle (`χ_und`) back
into the surviving thread. With that variant,
`defeat²_{δ₂}(D_{t₁}) = D_{t₂} = defeat²_{δ₁}(D_{t₁})` and O1 is restored on
this instance. **E1's contribution to R3:** Q-037 must be stated over the
*accumulating* δ₂, and its first proof obligation is that accumulation is
canonical (no choice in *how* `χ_und` merges). Recorded for the §11.4 worked
example.

### 5.3 For Q-031 (δ fixpoint check)

The δ₁ computation terminated after one reinstatement because `χ_und` is
Daimon-capped (no further `gu`/`¬gu` producers in scope — Q-027 §5.3). So **on
this instance** iterated defeat normalises trivially (depth 2 is a fixpoint:
no rule attacks `¬gu`). This is positive evidence for the
[Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) precondition that the R3
normalisation map terminates, but only at defeat-depth 2 on a fact-base with no
attack cycle. A genuine Q-031 answer still needs a fact-base with a
`gu ⇄ ¬gu` rule cycle to test for divergence.

**Generalised 2026-05-31 ([R3 doc §2.1](r3-delta-iso-session-2026-05-30.md)).**
The R3-termination theorem lifts this instance observation to *all* one-level-nested
defeat over acyclic `Γ`: the depth-2 fixpoint is not a happy accident of the
aspirin chain but **forced**, because the reinstater carries no object-level
defeat (Ambler p. 171), so it is Daimon-capped and cannot spawn depth-3 (a
depth-3 cut would require a `gu ⇄ ¬gu` cycle, excluded by acyclicity). Combined
with the per-input cut-count measure, this **discharges the Q-031 precondition
for the R3 fragment** and closes Q-037 positive outright there. The residue this
section flagged (the genuine `gu ⇄ ¬gu` cycle) remains the open part of full
Q-031.

---

## 6. Recommended amendment to the brainstorm decision rule

Brainstorm §4 "Decision rule" currently reads (paraphrase): *commit δ₁ if E1
keeps δ₁'s A3 crisp; if E1 shows a reinstatement residue, re-open toward δ₂.*
This should be amended to:

> Commit δ₁ if E1 shows `defeat²` is a **monotone reinstatement-accrual**
> landing on Ambler's stronger argument (`D_{t₁} ⊆ defeat² = D_{t₂}`). A bare
> "residue" is **expected and required** (Ambler 1996 p. 171: aggregation is
> necessarily monotone); its *absence* (a δ₂-style `defeat² = D_{t₁}` collapse)
> is the failure mode, because it discards reinstating evidence. Re-open toward
> δ₂ only if the accrual is **non-monotone** (some original chronicle is
> *retracted*), which neither encoding exhibited here.

This is the single substantive correction E1 produces to the brainstorm; the
δ₁ commitment is otherwise undisturbed.

---

## 7. What E1 does NOT settle

1. **One instance, depth 2.** E1 is the aspirin Q3 chain at reinstatement
   depth 2 with no attack cycle. It does not establish monotone accrual for δ₁
   in general, nor O1 for `ν` beyond this instance — it *localises* both. The
   `|Inc(B)| ≥ 3` escalation (brainstorm **E2**) is still needed to stress O2
   (naturality) and the A5 cardinality concern.
2. **H2 / polarity (E3) untouched.** Whether Ambler's (absent!) defeat
   connective aligns to the negative side is now *partly* answered — Ambler has
   **no** object-level defeat (§0 fact 1), so the polarity question is really
   about the **substrate's** defeat extension, not Ambler's logic. E3 should be
   re-scoped accordingly: read the polarity off the *substrate's* Cross-Cone
   Incompatibility convention, with Ambler supplying only the monotonicity
   constraint. This is a meaningful simplification of E3.
3. **The accumulating-δ₂ definition is sketched, not fixed.** §5.2's "merge the
   challenger's chronicle on death" needs a precise operational rule (which
   loci, what `⊗`/`⊕` structure) before R3's O1 can be proved in general. That
   is the next R3 deliverable after this worked example.

---

## 8. References

- [Q-027 thin-cones audit](q027-thin-cones-2026-05-29.md) — §1 (Γ), §2.3 (Q3
  enumeration: `t₁`, `t₂`), §5 (safe Ludics encoding, `Inc(B_{Q3}) =
  {D_{t₁}, D_{t₂}}`, thin cones, Daimon Lock).
- [δ decision brainstorm](delta-defeat-encoding-decision-brainstorm-2026-05-30.md)
  — §3 (A3, H1), §4 (E1 spec + decision rule amended here), §8(1) (the
  non-classicality caveat E1 resolves), §10 (R1 record, unchanged in
  direction), §11.4 (R3 first deliverable = this audit).
- [Q-028b freeness audit](q028b-freeness-argument-2026-05-29.md) — §6.1 (the
  δ⁻¹ injection step E1's H1 result protects under nesting), §9 stress-test (2).
- [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) — R3; E1 supplies the first
  worked instance and the O1-needs-accumulating-δ₂ finding.
- [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) — fixpoint check; E1 gives
  trivial depth-2 termination on an acyclic fact-base.
- [AMBLER_PAPER.md](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/AMBLER_PAPER.md)
  p. 171 — the monotonicity / meta-level-contradiction / "no defeat mechanism"
  passage that reframes the A3 criterion; §1.2 (the syntactic category `𝒞/Γ`).
