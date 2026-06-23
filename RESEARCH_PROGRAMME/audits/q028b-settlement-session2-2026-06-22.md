# Q-028b settlement — Session 2 (O-4 δ-dissolution at `!`, O-5 the reduction theorem)

- **date:** 2026-06-22
- **session:** Gate 2 Session 2 of [session-19 scope](../10_IDEATION_SESSIONS/19-q028b-settlement-q033-polymorphism-scoping-2026-06-22.md) (Part A). Builds directly on [Session 1](q028b-settlement-session1-2026-06-22.md) (O-1/O-2 assembly + O-3 freeness crux POSITIVE, lemma L-AC!).
- **scope of this audit:** **O-4** (confirm the `!`-translated defeat-encoding `δ` stays dissolved for higher-order generators — the one substantive check Q-031 deferred) and **O-5** (write the `!`-layer reduction theorem, run the explicit `F⊣U`-on-generators uniqueness step that turns instance-level *discovery* into uniform *settlement*).
- **verdict:** **O-4 ✓ POSITIVE — δ stays dissolved at the `!`-layer** (defeat-encoding and generator-order are orthogonal axes; the dissolution pillars are order-blind). **O-5 ✓ the `!`-layer reduction theorem is assembled and the `F⊣U` uniqueness step goes through** — closing **C001b′ b₁′∧b₂′ uniformly** at the exponential layer (ground `{→,×,atom}`), parametrically in the four side-data items. **Status (2026-06-22): SIGNED OFF** by an independent non-author cross-check ([verdict](q028b-settlement-crosscheck-2026-06-22.md), 6/6 PASS) — see [§5 Cross-check notes](#5-cross-check-notes-2026-06-22--independent-non-author-signed-off). One non-blocking grounding tightening recorded (**N-4**: ground the bijection-*uniqueness* on deterministic proof search + Res-A′, not on T012 set-canonicity); folded into the §4 item-4 write-up. The §4 promotion list is cleared to fire. *(Prior status, retained for trail: author-side / provisional, pending one independent non-author cross-check.)*

> Reading order: [Session 1 audit](q028b-settlement-session1-2026-06-22.md) (O-1/O-2/O-3 + L-AC!); [Q-031 cyclic-defeat audit §6](q031-cyclic-defeat-collapse-2026-05-31.md#6-the-higher-order-residue-is-q-028a-stratum-2-not-q-031) (what was deferred); [Q-028b freeness audit §6](q028b-freeness-argument-2026-05-29.md#6-step-5--the-reduction-theorem-proof-sketch) (the MALL reduction this re-grounds); [T012 Statement](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md#statement-r-track).

---

## 0. The session in one sentence

With freeness secured (Session 1 / O-3), settlement reduces to confirming the **last side-data item `δ` stays dissolved at the `!`-layer** (O-4) and then running the **categorical universal-property argument** (O-5) that forces the bridge bijection **uniformly in `B`** — replacing the stratum-2 *instance* discovery with a *uniform* settlement.

---

## 1. O-4 — δ (defeat-encoding) stays dissolved at the `!`-layer

### 1.1 What must be shown

At MALL the four-item side-data taxonomy `(Γ, A-pres, pol-align, δ)` had **one** substantive item, `δ` (defeat-as-negation `δ₁` vs defeat-as-coroutine `δ₂`). It was **dissolved** on the propositional fragment:

- **[Q-031](q031-cyclic-defeat-collapse-2026-05-31.md)** — the `!`-translated defeat operator needs **no fixpoint/closure operator** outside MELL; `Inc(B)` stays finite (Ambler-monotone-accrual + L-MERGE idempotence).
- **[Q-037 / R3](r3-delta-iso-session-2026-05-30.md)** — the runtime `δ₂` provably **presents** the semantic `δ₁` on `Inc(B)` (the `ν`-normalisation bijection), so `δ` ceases to be a free parameter.

But **Q-031 explicitly deferred the higher-order case** ([§6](q031-cyclic-defeat-collapse-2026-05-31.md#6-the-higher-order-residue-is-q-028a-stratum-2-not-q-031)). O-4 must confirm `δ` stays dissolved when the generators are higher-order (`!`-bearing / function-typed).

### 1.2 The deferral was about generator-canonicality, NOT about δ

Q-031 §6 is precise about *what* it deferred:

> *"The one place finiteness of `Inc(B)` can fail is λ-abstraction / function-type generators, where `𝒞/Γ` may be infinite. This is **not** a defeat-depth fixpoint … it is the higher-order canonicality question (Q-028a stratum-2), gated on the incarnation notion for `!`-behaviours (Q-030) plus the BF-materiality antichain (Q-032) — there is no canonical generator set on the Ludics side for `!A` until Q-032 lands."*

So the higher-order residue was a **generator-set** problem (`𝒞/Γ` possibly infinite, no canonical `!`-layer generating set), **explicitly not** a defeat-encoding problem. **That residue is now resolved:** [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) supplies the canonical `!`-layer generating set `Gen!(B)`, and [Q-028a stratum-2](q028a-stratum2-2026-06-22.md) is discovery-positive. The deferred obstruction is closed on its own (generator-canonicality) axis.

### 1.3 The dissolution pillars are order-blind (the orthogonality argument)

What remains for O-4 is to confirm the **δ-dissolution mechanism itself** survives higher-order generators. It does, because both pillars are statements about the **defeat / aggregation order**, not about whether a generator is propositional or function-typed:

- **Pillar 1 — Ambler-monotone-accrual (Ambler 1996 p. 171).** There is **no object-level defeat operator**; aggregation is monotone. Defeat acts on the **propositional conclusions** (`asp` vs `¬asp`), not on the function-type structure of a rule. A higher-order rule (e.g. the corroboration rule `chk : !(mp→asp)⊸mp⊸asp`) is simply **one more generator contributing a conclusion** to the monotone accrual; its `!`-structure (which scheme is abstracted) lives in the generator's **internal proof**, invisible to the defeat relation. So the accrual order is unchanged by the presence of higher-order generators.
- **Pillar 2 — L-MERGE idempotence ([R3 §5.5](r3-delta-iso-session-2026-05-30.md)).** The reinstating defeater at cycle-layer `i+2` is the **same generator** as at layer `i`, so the accumulation merge re-grafts an already-present chronicle (a no-op); the design saturates after one cycle-period. This is a statement about **defeat depth** — and **higher-order generators do not increase defeat depth.** They add λ-abstraction structure (the generator-canonicality axis, T012), which is orthogonal to how many times defeat iterates. So `Gen!(B)` stays finite under defeat for the same reason `Inc(B)` did.

**Defeat-depth and generator-order are orthogonal axes.** Q-031 closed the defeat-depth axis (positive, propositional, any cycle); T012 closed the generator-order axis (canonical `!`-layer generators). Their conjunction leaves no residue: a higher-order generator participating in a defeat cycle is covered by Pillar 1/2 *as a generator in the accrual*, and its higher-order internal structure is covered by T012 *as a proof design*. No new configuration arises at the intersection.

### 1.4 The runtime δ₂ ≅ δ₁ agreement ports via the T012 read-back

Q-037's `ν`-normalisation bijection (runtime `δ₂` canonical-cut forms ↔ semantic `δ₁` blocked designs) is established on `Inc(B)`. At the `!`-layer the analogue is immediate: the canonical-cut / read-back mechanism is **BT2010 §3.1 deterministic proof search** — *the very read-back T012 supplies and stratum-2 Test 2 used*. So the coroutine scheduler's higher-order defeat configurations normalise to the `δ₁` blocked designs by the same bijection, now grounded in T012's read-back rather than FQ visitable-paths. The δ₂-presents-δ₁ fact therefore holds at the `!`-layer with no new content.

### 1.5 Finding (O-4)

**`δ` stays dissolved at the `!`-layer.** The defeat-encoding introduces **no new choice** for higher-order generators: the dissolution pillars (monotone-accrual, L-MERGE idempotence) are order-blind, the deferred residue was generator-canonicality (now T012, not δ), and the δ₂≅δ₁ runtime agreement ports via T012's read-back. The four-item taxonomy stays `(Γ, A-pres, pol-align, δ)` with all four conventional/dissolved at the `!`-layer. **O-4 POSITIVE.** ∎

*(Honest caveat for the cross-check: this is a structural/orthogonality argument, not a fresh `ν`-termination proof at the `!`-layer. Its load-bearing claim — "higher-order generators add no defeat depth" — is the item to scrutinise. Graceful degradation: were it to fail, `δ` would re-escalate to a substantive item and settlement would carry an explicit `δ` parameter — still a positive, but parameterised, exactly the §A.4 negative-restatement branch.)*

---

## 2. O-5 — the `!`-layer reduction theorem

### 2.1 Statement

> **Proposition (Q-028b `!`-layer reduction).** Fix the four side-data items `(Γ, A-pres, pol-align, δ)`. Let `B` be a `!`-translated logical behaviour (BT2010 Def 3.1) representable under `(Γ, δ)` as an Ambler formula `B^♯` in the **ground `{→,×,atom}` higher-order fragment**. Then the map
> ```
> φ_! : Gen!(B) → 𝒞_base(A, B^♯),   D ↦ δ⁻¹(CH(DP_!(D)))
> ```
> is a **canonical bijection**, and its free-JSL extension
> ```
> ε_{A,B} = 𝓕(φ_!) : 𝒫_fin(Gen!(B)) ⥲ 𝒞_semi(A, B^♯)
> ```
> is a **canonical JSL isomorphism**, forced uniformly in `B` (no instance enumeration). Hence **C001b′ b₁′∧b₂′ close at the `!`-layer**, parametrically in the four side-data items.

### 2.2 Proof (assembly from O-1…O-4 + T012)

**(i) `φ_!` is a bijection.** By **O-1**, `φ_! = ` T012's `φ ∘ δ⁻¹`. T012 gives `φ : Gen!(B) ⥲ 𝒞_base` a bijection (b₁′ surjection from completeness-for-proofs, BT2010 Thm 3.8; b₂′ injection from the native Res-A′ representation bijection + Res-C unique material representatives). By **O-4**, `δ⁻¹` is a canonical injection on defeat actions (dissolved, no free choice). Composite `φ_!` is a canonical bijection. ✓

**(ii) `ε` iso ⟺ `φ_!` bijection.** By **O-3** (Session 1), both bridge sides are **free JSLs** on their generating sets — `𝒞_semi(A,B^♯) = 𝒫_fin(Gen!(B))` (free, via L-AC! antichain + Res-C distinctness + Prop 11.8 generation + Phase-2e free join) and `𝒫_fin(𝒞/Γ)` (Ambler, free by construction). A map between free JSLs is determined by its generator restriction (**Mac Lane *CWM* IV.1**), and is iso iff that restriction is a bijection. With (i), `ε = 𝓕(φ_!)` is a JSL iso. ✓

**(iii) Uniform forcing (the settlement step — `F⊣U` on generators).** Let `F ⊣ U` be the free-JSL ⊣ underlying-set (confidence-erasure) adjunction. The adjunction iso
```
Hom_JSL(F(Gen!(B)), 𝒞_semi) ≅ Hom_Set(Gen!(B), U(𝒞_semi))
```
says **every** JSL morphism `F(Gen!(B)) → 𝒞_semi` is `𝓕(g)` for a unique generator function `g`. For `ε` to be the *bridge* (a JSL iso compatible with the proof/composition structure), `g` must be the **composition-compatible** generator bijection — and **T012 constructs exactly that canonical map** (`φ_!` is determined by `B` alone: T012 Statement (1) Canonicity; the completeness bijection is *the* structure-preserving correspondence, not a free choice). So `ε = 𝓕(φ_!)` is the **unique** bridge iso, and this holds for **every** `B` in the fragment by the same argument (T012 and L-AC! are stated for arbitrary `B`). **No instance enumeration.** ∎

### 2.3 Why this is *settlement*, not *discovery*

Stratum-2 (discovery) verified, **on a worked instance**, that the bridge-data tests (head-action, `!`-scheme-locus composition compatibility, U-erasure) kill every rival bijection but `φ`. O-5 makes the **uniform** argument: it does not enumerate bijections per instance — it observes that (a) any bridge map is determined by its generators (adjunction / Mac Lane), (b) compatibility with the proof structure forces the generator map to be T012's *canonical* completeness bijection, and (c) freeness (O-3) makes its extension the unique iso — **for all `B` at once**. The stratum-2 instance is now a **corollary** (the instance-level shadow of the canonicity), not the evidence. This is precisely the discovery → settlement move the [Q-028 bifurcation contract](../01_OPEN_QUESTIONS_REGISTRY.md#q-028) requires.

### 2.4 Relation to the MALL reduction

This is the [§6 MALL reduction](q028b-freeness-argument-2026-05-29.md#6-step-5--the-reduction-theorem-proof-sketch) with three substitutions, each now licensed: **DP** FQ-MALL → BT2010 c-designs (O-1, D-A1-repaired); the **canonical generator object** `Inc(B)`/T002 → `Gen!(B)`/T012 (O-2 discharges the would-be fifth side-data item); **freeness** T002-antichain → L-AC! (O-3, D1-free). The §9.1 "linear shadow of `B`" restriction that blocked the MALL argument at MELL is **lifted** — BT2010 admits arrows/contraction natively. The argument *shape* is unchanged, as stress-test-1 predicted ("incarnation-notion-independent").

---

## 3. Honest scope and residuals

- **Ground `{→,×,atom}` only.** Schematic / propositional-variable polymorphism is **out** ([Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) / Gate 3); the Church-encoded composition combinator is polymorphic and not covered.
- **Closes b₁′∧b₂′, not b₃′.** Naturality in `B → B'` remains downstream ([Q-029](../01_OPEN_QUESTIONS_REGISTRY.md#q-029) fibration home).
- **Paper meta-argument.** Optional `agda-categories` mechanisation of the `F⊣U` step is a follow-on cross-check (mirrors T004→C001a), not part of settlement.
- **Inherited residual (non-blocking, from Session 1 §3.7):** the within-cone *design-level* join at the `!`-layer may need a repetition-aware reading (Q-030 Phase-4 / Phase-2f-at-`!`); it does not touch the bridge join (`𝒫_fin`) and so does not affect this theorem.
- **O-4's load-bearing claim** ("higher-order generators add no defeat depth") is a structural argument, not a fresh `ν`-termination proof — flagged for the cross-check.

---

## 4. Status and the (deferred) promotion list

**No promotion in this session.** Per the T012 / Res-A′ precedent, the reduction theorem is **author-side / provisional** until an independent non-author cross-check signs off. The [verification prompt](q028b-settlement-VERIFICATION-PROMPT.md) is filed.

**On a clean cross-check, the promotion list is:**
1. [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b) status: *"positive on MALL"* → **"positive on MELL (ground `{→,×,atom}` fragment)"**; b₁′∧b₂′ closed uniformly at the `!`-layer.
2. [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md): b₁′∧b₂′ closed at the `!`-layer; b₃′ remains the open content.
3. [Runtime contract](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md): ground-higher-order guard tag *discovery-verified* → **settlement-proven** (G3a fully discharged, not just at discovery strength).
4. [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) Part II: state the `F⊣U` adjunction at BF-incarnation (Q-030 Phase 4b).
5. The **investor/presentational brief** conservative one-clause update becomes diligence-grade (the [reminder doc](../10_IDEATION_SESSIONS/19-q028b-settlement-q033-polymorphism-scoping-2026-06-22.md) Gate-2 trigger).
6. Gate 3 ([Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033)) triage becomes the next item.

---

## 5. Cross-check notes (2026-06-22) — independent non-author, SIGNED OFF

**Independent non-author final-gate cross-check. Verdict: SIGNED OFF (6/6 PASS).** Full
verdict: [q028b-settlement-crosscheck-2026-06-22.md](q028b-settlement-crosscheck-2026-06-22.md).
The reviewer tried hardest on V-3 (δ-orthogonality) and V-1 (L-AC!) per the prompt; both held.

- **V-1 (L-AC!) PASS.** The antichain is true and **D1-free**. Reconstructed adversarially:
  positive-locus divergence is excluded by the `⊑` hypothesis + determinism; the
  extra-negative-branch case is killed by **materiality of the larger design (BF Def 11.5) +
  winning of the smaller (`Gen!(B) ⊆ B`)** — a visited extra branch would force the same `E ∈ B⊥`
  to drive `D₁` to the same locus, where winning forces the branch to already exist. No linear
  stability, no FQ minimality. *(N-1: §3.2's "totality leaves no such locus" should cite
  materiality + behaviour-membership, not "totality" as a bare syntactic property.)*
- **V-2 (freeness, O-3) PASS.** No proper quotient: the bridge target *is* the free JSL
  `𝒫_fin(Gen!(B))` by the C001b→C001b′ supersession (no design-level "real hom" underneath), and
  Cross-Cone Incompatibility + L-AC! + Res-C + Prop 11.8/T012(3) block any design-level relation.
  *(N-2: the §5.2 Cross-Cone proof uses linear FQ uniqueness-of-incarnation; its `!`-port rides on
  **Res-C's unique material representative** — thread this citation.)*
- **V-3 (O-4) PASS — held under the hardest read.** No higher-order-specific defeat configuration
  exists (Ambler p.171: no object-level defeat/undercut operator ⟹ no undercut into the `!`-slot,
  no cycle routed through it); both dissolution pillars are order- **and cardinality-blind**.
  Strengthening found: the ground `{→,×,atom}` fragment is **infinite** (Church *numerals*
  `(o→o)→o→o`, ground not polymorphic), but O-5's uniform `F⊣U` argument **never uses `Gen!(B)`
  finiteness**, so the Q-031 §6 residue is **harmless** to b₁′∧b₂′. δ does not re-escalate. *(N-3:
  "add no defeat depth" reads "add no unbounded/new-fixpoint depth.")*
- **V-4 (O-5 `F⊣U`) PASS.** Uniform uniqueness is genuine: no composition-automorphism `θ` exists
  because **distinct material designs are observationally distinct** via BT2010 §3.1 deterministic
  proof search (reads every locus incl. `!`-slots single-valuedly — stratum-2 Test 2), so the only
  composition-compatible bijection is `φ_!`, uniformly in `B` (a universal property, not an
  enumeration). **N-4 (recommended tightening):** §2.2(iii) grounds this *uniqueness* on "T012
  Statement (1) Canonicity," which is canonicity of the generating **set**, not uniqueness of the
  **bijection**; re-cite **deterministic proof search (BT2010 §3.1) + Res-A′ §8 + Res-C** (the real
  engine, already signed-off) — a citation tightening, non-blocking. Fold into §4 item 4.
- **V-5 / V-6 PASS.** Assembly and scope honest; the §9.2 fifth side-data item is discharged (T012
  + L-AC!), and the within-cone design-join residual is correctly flagged orthogonal.

**Consequence: the §4 promotion list is cleared to fire** (with N-4 folded into item 4). Q-028b →
"positive on MELL (ground `{→,×,atom}` fragment)".

---

*Session 2 complete (O-4 ✓ POSITIVE · O-5 ✓ reduction theorem assembled + `F⊣U` uniqueness step). Gate 2 is **SIGNED OFF** by an independent non-author cross-check (2026-06-22, 6/6 PASS); the only recorded follow-up is the non-blocking N-4 citation tightening. T012 stays `established`; Q-028b promotes to "positive on MELL (ground `{→,×,atom}` fragment)".*
