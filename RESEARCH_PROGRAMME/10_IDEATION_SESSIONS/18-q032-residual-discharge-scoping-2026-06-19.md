# Session 18 — Scoping the Q-032 R-track residual discharges (Res-C, Res-A)

**Date:** 2026-06-19
**Direction:** core ring — the MALL→MELL substrate upgrade ([Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) Phase 3); discharges the two load-bearing residuals the Round-2 re-check left between [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) and closure.
**Status:** **Scoping — no proof attempted.** States precisely what Res-C and Res-A require to be *discharged* (proved), their proof routes, sub-obligations, risks (with graceful-degradation fallbacks), and deliverables. Also folds in the two small re-check findings F1 (reword) and F4 (Rmk 2.4 micro-check). No theorem promoted, no code touched.
**Purpose:** the [Q-032 R-track repair](../audits/q032-antichain-port-2026-06-16.md#repair-r-track-2026-06-19--proof-design-canonicity-via-completeness-for-proofs) was **accepted** by independent re-check (D1-free, S1-free, strictly stronger than the withdrawn antichain) but [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) is **not yet `established`**: closure reduces to two genuine proof-theory lemmas — **Res-C** (`⋃`-materiality is idempotent) and **Res-A** (the `!`-translation is a proof-level bijection). The re-check flagged that "re-check Res-A…D" understates these as *confirmations*; they are **proofs to be written**. This session scopes that writing.

> Reading order: [T012 §Round 2 re-check](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md#round-2--r-track-re-check-2026-06-19) (why these two are load-bearing), [audit §Repair (R-track) R1/R2/R4 + Residuals](../audits/q032-antichain-port-2026-06-16.md#repair-r-track-2026-06-19--proof-design-canonicity-via-completeness-for-proofs) (the reduction), [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′/b₂′ (what the bijection feeds), [Q-034/Q-033 review](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) App C (BF/BT2010 verbatim theorem statements).

---

## 0. The problem in one sentence

The R-track delivers the bridge bijection `φ : Gen!(B) ⥲ 𝒞_base(A, B^♯)` as a composite of two legs — the **design↔derivation** leg (BF/BT2010 completeness, already cited) and the **derivation↔λ-term** leg (the `!`-translation) — and reduces its two open directions to exactly two lemmas: **b₂′ injectivity rides on Res-C** (material designs are fixpoints of `⋃`-materiality, so two material proof designs with the same interaction are equal), and **the derivation↔λ-term leg rides on Res-A** (the `!`-translation is a *bijection* on normal forms, not merely provability-faithful); discharging both (plus the F1 reword and F4 micro-check) closes Q-032.

## 1. Res-C — `⋃`-materiality is idempotent (the keystone)

### 1.1 What must be proved

> **Lemma (Res-C).** For a logical behaviour `B` and any design `D`, the material part `|D|_B := ⋃{ D[E] : E ∈ B⊥ }` (BF Def 11.5; `D[E]` = the part of `D` *visited* in normalising `⟨D | E⟩`, BF Def 11.2) is **idempotent**: `||D|_B|_B = |D|_B`. Equivalently, `|·|_B` is a (reductive, monotone, idempotent) **kernel operator**, so the material designs are exactly its fixpoints and each interaction-class has a **unique** material representative.

### 1.2 Why it is the b₂′ keystone

Injectivity of `φ` on `Gen!(B)` reduces to Res-C: if `D₁, D₂ ∈ Gen!(B)` realise the same proof content (same interaction against every `E ∈ B⊥`), then `D₁[E] = D₂[E]` for all `E`, so `|D₁|_B = ⋃_E D₁[E] = ⋃_E D₂[E] = |D₂|_B`; and since both are **material** (fixpoints, by Res-C), `D₁ = |D₁|_B = |D₂|_B = D₂`. So **Res-C is exactly what makes "no two material proof designs collapse" true** — and it is *also* what makes the separation counterexample irrelevant: the separation-failure junk (BT2010 Rmk 2.4) is precisely the *non-material* designs that `|·|_B` quotients away.

### 1.3 Proof route

> **DONE (2026-06-19, provisional — [Res-C discharge audit](../audits/q032-res-c-materiality-2026-06-19.md)).** Verdict: **IDEMPOTENT** (no route-ii degradation). Idempotence reduces to **Res-C·1** (`(|D|_B)[E] = D[E]`), proved by the **saturation observation**: `D[E] ⊆ |D|_B` *for the very `E` being tested* (Def 11.5 is a union over **all** tests), so re-testing finds nothing new; the two inclusions follow from **locality** of the interaction (a run's trajectory depends only on traversed views). **The non-uniform τ-sum case is *not* special** — the argument ranges over runs uniformly, so restriction never prunes a τ-run (it only removes views no test visits). **D1-free:** proved from BF `⋃`-materiality (Def 11.2/11.5, Prop 11.8) + locality, **not** from FQ linear visitable-paths. Fidelity items for the checker in audit §7.

The natural route factors idempotence through a single sub-lemma:

> **Sub-lemma (Res-C·1 — restriction-invariance of visits).** For every `E ∈ B⊥`, `|D|_B[E] = D[E]` — restricting `D` to its material part does not change what any test visits.

Given Res-C·1, idempotence is immediate: `||D|_B|_B = ⋃_E |D|_B[E] = ⋃_E D[E] = |D|_B`. Res-C·1 itself holds because (i) `D[E] ⊆ |D|_B` by definition (`|D|_B` is the union over *all* tests, including `E`), and (ii) the interaction `⟨D | E⟩` only ever descends into parts of `D` that some test visits — so deleting the never-visited remainder (`D ∖ |D|_B`) cannot change `⟨D | E⟩`'s trajectory. Assemble from **BF Def 11.2 (visited part), Def 11.5 (materiality), Prop 11.8 (`|D|_B ∈ B`), and Lemma 11.4** (the cited support).

### 1.4 The genuine risk (and graceful degradation)

The risk is **non-uniformity**: `E ∈ B⊥` may be a **τ-sum / non-uniform** test (BF §7), and `D[E]` for a nondeterministic `E` is a union over nondeterministic runs. Res-C·1 must hold with that reading — i.e. the union-over-tests must still contain *each* test's per-run visited set, and restriction to `|D|_B` must not prune a branch some τ-sum run explores. This is exactly the place the linear theory had for free and the nonlinear theory must earn; it is **not automatic** for an operationally-defined `⋃`-operator. **If Res-C·1 fails for some non-uniform `E`** (restriction changes a τ-run's trajectory), idempotence fails and `Gen!(B)` carries a residual quotient — a **route-(ii)-style** outcome (b₂′ holds only up to a finer materiality-equivalence). Recoverable, but it weakens b₂′ from "bijection" to "bijection up to `∼`." So the deliverable must report **idempotent** vs **idempotent-up-to-`∼`**.

### 1.5 Deliverable

A lemma file / audit section proving Res-C (idempotence) via Res-C·1, with the non-uniform `E` case handled explicitly, citing BF Def 11.2/11.5, Prop 11.8, Lemma 11.4. Corroborate on the aspirin O0 instance: `|D_r|_B` (the doubled-`t₁` robustness design) is a fixpoint, and the three generators are pairwise interaction-distinct. Verdict line: **idempotent** (b₂′ clean) / **idempotent-up-to-`∼`** (route ii).

## 2. Res-A — the `!`-translation is a proof-level bijection

### 2.1 What must be proved

> **Lemma (Res-A).** In the ground-atom / constant-only scope, Girard's call-by-name `!`-translation induces a **bijection**
> `{ βη-long-normal STLC λ-terms of 𝒞/Γ(A, B^♯) } ⥲ { focalized cut-free MELLS derivations of the interpreting sequent ⟦A⟧ ⊢ ⟦B^♯⟧ }`,
> with an explicit characterisation of the image (which MELLS derivations are `!`-translations).

This is the **derivation↔λ-term** leg of `φ`; composed with the cited **design↔derivation** leg (BF Thm 11.16/11.17, BT2010 Thm 3.8), it yields the full `Gen!(B) ⥲ 𝒞_base(A, B^♯)`.

### 2.2 Why "cite LSS 1993" is not enough

Lincoln–Scedrov–Shankar 1993 establishes **provability**-faithfulness of `!A ⊸ B` for intuitionistic implication — `A → B` is provable iff `!A^∘ ⊸ B^∘` is. Res-A needs the **proof-level bijection**, which is strictly more: distinct normal λ-terms must give distinct derivations (injective) and every cut-free derivation in the image must come from a term (surjective-onto-image). The standard obstruction is that **plain sequent derivations → terms is many-to-one** (rule-permutations), so the clean bijection is stated against **focalized** proofs (Andreoli): *focalized cut-free proofs* quotient away exactly the permutation noise, giving `βη-normal terms ↔ focalized proofs`. So Res-A = pin the CBN translation + impose focalization + characterise the image + prove the bijection on normal forms.

### 2.3 Proof route

> **Steps 1–4 DONE (2026-06-19, provisional — [Res-A discharge audit](../audits/q032-res-a-translation-2026-06-19.md)).** Verdict: **BIJECTION** on the ground `{→,×,atom}` Ambler fragment. **Step 1** pinned the CBN translation (premise-`×` multiplicative via `!(C&D)≅!C⊗!D` → pure MELLS). **Step 2** built the forward map `⟦·⟧` (λ↦⊸R, neutral spine↦dereliction+⊸L-chain, argument↦promotion, multi-use↦contraction); the higher-order `g_r` maps to **exactly one** contraction on `!(!mp⊸asp)`, as Step 1 predicted. **Step 3** characterised the image as the **co-Kleisli-of-`!`** proofs (S1 formula-shape + S2 box-discipline), corroborated by BT2010 App A's analogous `¬,∧` iso (Thm A.8). **Step 4** gave the read-back `⟪·⟫` (single-valued *because focalized*) and proved mutual-inverse — strictly stronger than LSS-1993 provability-faithfulness; verified on the three aspirin generators. **Provisional, pending independent non-author check** (§4.4 load-bearing items). Degradation boundary = schematic variables (Q-033) + additive `⊕` schemes (Res-D).

1. **Pin the translation.** Fix Girard 1987 CBN `(A→B)^∘ = !A^∘ ⊸ B^∘`, atoms ↦ constants (ground-atom scope, [Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033)); record the `η`-long discipline on the source side. **— DONE.**
2. **Forward map.** A βη-long-normal λ-term ↦ its translation, normalised/focalized; show it is a cut-free focalized MELLS derivation (normal natural deduction ↦ focalized sequent proof is standard).
3. **Image characterisation.** Characterise the sub-class of focalized cut-free MELLS derivations that are `!`-translations (the polarity/focus shape Girard's translation imposes).
4. **Inverse map + bijectivity.** Each derivation in the image reflects back to a unique βη-normal term; prove the two maps are mutually inverse (injective + surjective-onto-image). Cite Girard 1987, LSS 1993 (faithfulness), Andreoli 1992 (focalization), and the normal-ND ↔ focalized-sequent correspondence.

### 2.4 The genuine risk (and graceful degradation)

The risk is the **image characterisation + η-long matching**: if two distinct η-long normal terms collapse to one focalized proof, or the image is not cleanly characterisable, the leg is a quotient/partial, not a bijection — weakening b₂′ (or b₁′-onto-the-right-set). **Graceful degradation:** restrict the scope (e.g. to the first-order / the schemes the argument-chain feature actually instantiates) where the bijection is exact, and document the boundary — exactly the Q-033 "scope-restrict iff polymorphism is needed" discipline. So the deliverable must report **bijection** vs **bijection-on-the-restricted-fragment**.

### 2.5 Deliverable

A fidelity-lemma file / audit section proving Res-A (the focalized bijection) with the image characterisation, citing Girard 1987 + LSS 1993 + Andreoli 1992. Corroborate on the aspirin O0 instance: the three βη-normal λ-terms (`t₁ fst(x)`, `t₂⟨…⟩`, `r⟨!t₁,…⟩`) ↔ three focalized cut-free MELLS derivations, matching the three `Gen!(B)` designs of R5. Verdict line: **bijection** / **bijection-on-restricted-fragment**.

## 3. Sequencing, the small findings, and closure

- **Res-A and Res-C are independent and parallelise** — Res-C is a *design-side* materiality property (BF §11); Res-A is a *translation-side* proof-theory bijection (Girard/LSS/Andreoli). Neither blocks the other. Attack both, instance-first (the aspirin O0 worked example sits on both sides and is the fastest falsifier), then general.
- **Res-C is the keystone / higher novelty risk** (the non-uniform idempotence is where the nonlinearity genuinely bites); **Res-A is the heavier-but-more-standard** lemma (volume of proof-theory, lower conceptual risk). Resource the two accordingly.
- **F1 (reword, fold into the writeup).** Restate [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) Statement (2) and audit R2 as "`φ` is a **surjection** (b₁′) from full completeness (modulo Res-B), and a **bijection** (b₂′) **modulo Res-A + Res-C**" — so the theorem head asserts exactly what the residuals deliver.
- **F4 (micro-check, fold into Res-C/Res-A writeup).** Verify against the actual BT2010 Rmk 2.4 that its separation witnesses `P, Q` are `✠`-terminated (hence non-proofs). If they are not, the S1-dodge fails and separation must be confronted on the `✠`-free fragment directly — escalate before relying on Res-C.
- **Closure condition:** Res-A **discharged** (bijection, or documented restricted scope) ∧ Res-C **discharged** (idempotent, or documented route-ii `∼`) ∧ F1 reworded ∧ F4 verified ∧ Res-B/Res-D (light) confirmed → [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) → `established`, [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → closed, **Phase 4** ([Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) → [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b)) unblocked. The work wants its own independent non-author check (mirroring C015→T011).

## 4. What this means for the research programme as a whole

Isonomia's deepest claim is that the platform's argument structures are not merely *modelled by* a logic but *are* one — concretely, that an Ambler argument hom-set and a Ludics behaviour are the **same mathematical object** (the C001b′ / Q-001 bridge). That identity was already secured for ordinary, propositional arguments; the open frontier was **higher-order** arguments — the **argument-chain** feature, where one argument is fed as input to another. Q-032 is the keystone of that frontier: it asks whether the higher-order layer still has a *canonical set of generators* for the bridge to act on. The first attempt to answer it failed **instructively** — the clean *linear* theory of generators cannot simply be reused at the nonlinear higher-order layer (cross-check defect D1); that is a genuine mathematical obstruction, not a slip. The repair is the most reassuring kind of result a programme can get: rather than inventing new theory, it grounds the higher-order generators in **already-proven** completeness theorems for linear logic with exponentials (Basaldella–Faggian, Basaldella–Terui) — and in doing so obtains something *stronger* than originally sought (a full **bijection** between Ludics proof-objects and Ambler derivations, not merely a non-redundancy guarantee). What now stands between this and closure is no longer frontier research but **two well-shaped fidelity lemmas** — that the translation between λ-terms and linear-logic proofs is exact (Res-A), and that a proof-object's "useful part" is a stable notion (Res-C). So the higher-order bridge has moved from *blocked on an open problem* to *two tractable lemmas from completion*, which de-risks the entire argument-chain feature and the Phase-4 MELL extension that rides on it. Methodologically it is just as significant: the programme's own cross-check discipline caught a confident-but-wrong proof, forced a better and citation-grounded one, and is now bounding exactly what remains — the open-questions registry working precisely as designed.

---

*Scoping only — no proof, no promotion, no code. When the residuals are discharged, file the lemma proofs (audit sections or theorem files), apply F1/F4, and update [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) + [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) accordingly.*
