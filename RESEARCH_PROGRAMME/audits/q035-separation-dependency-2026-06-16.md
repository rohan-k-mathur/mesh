# Q-035 — Separation-dependency inventory; breakage under BF non-uniform materiality

**Date:** 2026-06-16
**Question:** [Q-035](../01_OPEN_QUESTIONS_REGISTRY.md#q-035) (Phase 0 of [session 16](../10_IDEATION_SESSIONS/16-ambler-bridge-mell-cluster-sequencing-2026-06-16.md))
**Method:** `grep` the substrate for Ludics-technical *separation* / *distinguish*; for each occurrence write out the proof step and classify as **survives-unchanged** / **survives-with-restatement** / **breaks** under BF's dropped separation. Apply the option-(b) kill-switch (≤2 replaceable → (b) proceeds; ≥3 load-bearing with no replacement → (b) infeasible).
**Source of the worry:** the [MALL→MELL Phase-1 audit](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/MALL%E2%86%92MELL%20Incarnation%20Upgrade%20for%20the%20Isonomia%20Ludics%20Substrate.md) §B7: *"separation fails, so any substrate reasoning relying on FQ/Girard separation (e.g. the ⪯ order) breaks."* Maurel 2004 is the canonical reference for separation failure under repetitions.

---

## Verdict (headline)

**LOW IMPACT — option (b) clears the separation kill-switch. Zero in-scope substrate components break on the separation axis.**

The B7 verdict named the `⪯` order as the paradigm separation-dependency. On inspection of the actual substrate documents, **the substrate does not depend on Girard/Böhm separation anywhere in the BF-migration scope.** Every component the Q-035 method flagged (sites i–v) turns out to rest on one of three things, none of which is separation:

1. **chronicle-set inclusion `⊆`** — a purely set-theoretic relation (the substrate explicitly *rejected* the separation-flavoured approximation order `⊑`); survives unchanged;
2. **coherence comparability** — a definitional property of designs-as-chronicle-sets that BF non-uniform strategies *also* satisfy (Def 7.2(1)); survives with at most a notational restatement on views;
3. **uniqueness of incarnation / minimality** — the FQ-specific theorem that BF lacks. This is a genuine breakage, **but it is the antichain/minimality gap already tracked as [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032), not a separation dependency.**

The one place the substrate genuinely uses Girard separation — the Direction-2 locus-of-disagreement theorems **T005–T011** — is **out of the BF-migration scope**: it lives on the multiplicative additive-free **MALL** kernel, backs a product feature (the contested frontier), and is corroborated against the TypeScript `stepCore` interaction kernel, which is independent of the FQ-vs-BF incarnation notion. BF's dropped separation does not reach it because nothing proposes to rebuild that kernel on BF.

**Consequence for the cluster:** the separation worry collapses into the minimality worry. Q-035 does **not** gate option (b); **[Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) is the real Phase-3 obstruction.** This matches what the [Q-028b freeness audit §B7 follow-up](q028b-freeness-argument-2026-05-29.md) already recorded: *"Separation also fails in BF … The argument shape (free JSL on canonical generators → adjunction-forced bijection) survives, but it now requires a fifth side-data item … the antichain witness on the BF side (since materiality is no longer minimality-by-theorem)."*

---

## 1. The two senses of "separation" in the corpus

The `grep` surfaces two **unrelated** uses of the word, and the bulk of hits are the wrong one:

| sense | meaning | relevant to Q-035? |
|---|---|---|
| **T4 "dialectical/witnessing separation"** | a *layer-architecture* commitment: the dialectical layer (designs) and the witnessing layer (participant attribution) are kept apart. Also "level separation" (the generator vs. power-set level split). | **No.** Nothing to do with Girard separation; survives any incarnation-notion change trivially. The dominant hit across `LUDICS_GENERATIVE_SUBSTRATE.md`, `LUDICS_TRIADS_*.md`, `T003`, and most audits. |
| **Girard/Böhm separation** | the Ludics theorem that *distinct designs are separated by some test* (the analogue of Böhm's λ-calculus separation theorem). This is what BF drops under non-uniformity. | **Yes** — the target of this audit. |

Filtering to the Girard sense leaves exactly the five sites the Q-035 method named, plus the Direction-2 separation programme.

## 2. Site-by-site inventory

### Site (i) — the design order ("⪯") — **survives-unchanged**

The B7 verdict's paradigm case. On inspection it is a **non-dependency**: the substrate's order is **literal chronicle-set inclusion `⊆`** (Reading A), pinned in [`LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md) §4:

> *"The order relation used for incarnation in F-Q 2013 (and in Girard 2001) is set inclusion on chronicle sets."*

The doc explicitly contrasts this with the **approximation / extension order `⊑`** (Reading B, daimon-replacement) and **rejects it** for the substrate (§3.2, §4): *"F-Q's incarnation uses `⊆`, not `⊑`."* There is no `⪯` order in the substrate distinct from `⊆`. Set inclusion is a relation on sets of chronicles/views; it makes no appeal to a separating test. BF non-uniform strategies are still prefix-closed sets of views (Def 7.2), so `⊆` is defined on them verbatim. **No separation content; survives unchanged.** The B7 worry checked a dependency the substrate deliberately does not have.

### Site (iv) — the Daimon Lock Lemma — **survives-with-restatement**

[`LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md) §4:

> **Daimon Lock Lemma.** If `D' ⊆ D` then `D` has daimon at every positive node where `D'` has daimon … *Proof.* If `D'` has `w𝔝`, then `w𝔝 ∈ D`; if `D` also had `wκ⁺…` with `κ⁺ ≠ 𝔝`, the two first differ on **positive** actions, violating the coherence comparability condition. □

The lemma rests entirely on **coherence comparability** (FQ Def 2.7 / Girard *Locus Solum*) — a *definitional* constraint on designs-as-chronicle-sets, not on separation. BF non-uniform strategies carry their own coherence condition (Def 7.2(1): *"if `s.m, s.n ∈ D` and `m ≠ n` then `m, n` are negative"*), which is precisely the comparability condition the lemma uses. The argument therefore has a BF-side analogue; what changes is the carrier (views with possible repetition rather than linear chronicles), so the statement needs a **notational restatement on views**, not a new idea. **Survives with restatement.**

### Site (iii) — Phase 2e Cross-Cone Incompatibility — **survives-unchanged on the separation axis (real exposure = Q-032)**

The Q-035 method worried about "distinguishing-test arguments." The actual proof ([`LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md) §5.2) uses **no test at all**:

> **Theorem (Cross-Cone Incompatibility).** For distinct `D₁, D₂ ∈ Inc(B)`, there is no `D ∈ B` with `D₁ ⊆ D` and `D₂ ⊆ D`. *Proof.* By **uniqueness of incarnation**, `D` has a unique `|D|_B ∈ Inc(B)` with `|D|_B ⊆ D`; minimality forces `|D|_B = D₁` and `= D₂`, so `D₁ = D₂`. □

The doc stresses the argument is *"purely order-theoretic and require[s] no `⊥⊥`-closure."* It depends on **uniqueness of incarnation** (FQ minimality), **not** separation. Under BF this *does* lose its FQ theorem — but that loss is exactly **[Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032)** (BF materiality has no minimality/antichain theorem), not a separation breakage. On the separation axis specifically: **survives unchanged**; its real BF exposure is routed to Q-032.

### Site (v) — "designs determined by behaviour profile" / T002 antichain — **split: survives + Q-032**

[T002](../02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md) has two parts with different exposure:

- **Part 1 (antichain).** *"order-theoretic and does not depend on any specific feature of Ludics; it holds for the minimal elements of any partially ordered set."* No separation, no incarnation notion. **Survives unchanged** (the Agda artefact discharges it from antisymmetry alone).
- **Part 2 (cone decomposition).** *"does depend on uniqueness of incarnation, which is a Ludics-specific theorem of Fouqueré–Quatrini 2013."* Again **uniqueness of incarnation**, not separation → **[Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032)**.

No separation dependency in either part.

### Site (ii) — defeat-encoding uniqueness — **survives (real exposure = Q-032)**

The δ-encoding's well-definedness rests on (a) **δ⁻¹ injectivity** under nested defeat (checked on the aspirin Q3 case, [E1 audit](e1-reinstatement-aspirin-2026-05-30.md)), (b) the **δ₁ ≅ δ₂ normalisation** iso (Q-037, via cut-elimination + the L-CANON merge-canonicality lemma), and (c) minimality of `Inc(B)`. None of these is a separating-test argument; (a)/(b) are normalisation/injectivity facts and (c) is minimality. The [Q-028b freeness audit](q028b-freeness-argument-2026-05-29.md) §B7 follow-up states the position directly: under BF *"the argument shape … survives, but it now requires a fifth side-data item … the antichain witness on the BF side (since materiality is no longer minimality-by-theorem)."* So the BF exposure is, once more, **Q-032 (minimality)**, not separation. **Survives on the separation axis.**

### The Direction-2 separation programme (T005–T011) — **out of BF-migration scope**

This is the substrate's **only genuine, load-bearing use of Girard/Böhm separation** — the locus-of-disagreement results: [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md) (first-divergence locus), [T007](../02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md)/[T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md) (minimal separating context), [T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md) (branching), each citing Böhm 1968 as the analogue. It is nonetheless **outside the scope of the BF upgrade**, on four independent grounds:

1. **Fragment.** T007 is explicit: *"the multiplicative, additive-free fragment."* The BF upgrade targets the `!`-translated **MELL** image of the *Ambler bridge* — a different fragment. The two do not overlap.
2. **Purpose.** T005–T011 back a **product feature** (the contested-frontier / gap-identification surface) by translating *abstract argumentation frameworks*; they are not part of the Ambler-bridge `φ = δ⁻¹ ∘ CH ∘ DP` pipeline the BF migration rebuilds.
3. **Carrier.** They are corroborated against the TypeScript `stepCore` interaction kernel (`Design = List Act`, `Locus = List ℕ`, a finite/fuel-indexed `interact`), which is **independent of the FQ-vs-BF incarnation notion** (see [M0 audit](m0-design-carrier-ludics-core-2026-06-09.md)). Migrating the *bridge's* incarnation notion to BF does not touch this kernel.
4. **No proposed unification.** Nothing in the Q-030 workflow proposes to rebuild the locus-of-disagreement kernel on BF non-uniform strategies. Absent such a unification, BF's dropped separation never reaches these theorems.

**Classification: survives-unchanged (out of scope).** See the caveat below for the one scenario in which this would change.

## 3. Classification summary

| site | what it actually rests on | separation dependency? | classification | BF exposure routes to |
|---|---|---|---|---|
| (i) design order `⪯` | chronicle-set inclusion `⊆` (Reading A; `⊑` rejected) | none | **survives-unchanged** | — |
| (ii) defeat-encoding uniqueness | δ⁻¹ injectivity + δ₁≅δ₂ normalisation + minimality | none | **survives** | Q-032 (minimality) |
| (iii) Cross-Cone Incompatibility | uniqueness of incarnation + minimality | none | **survives-unchanged** | Q-032 |
| (iv) Daimon Lock Lemma | coherence comparability (definitional) | none | **survives-with-restatement** | — |
| (v) T002 antichain | Pt 1 order-theoretic; Pt 2 uniqueness of incarnation | none | **survives** (+ Q-032 for Pt 2) | Q-032 |
| Direction-2 T005–T011 | Girard/Böhm separation (genuine) | **yes** | **survives-unchanged (out of BF scope)** | — (MALL kernel, not migrated) |

**Components that break on the separation axis within the BF-migration scope: 0.**
**Components whose BF exposure is real but routes to Q-032 (minimality), not separation: 3 (sites ii, iii, v-Pt2).**

## 4. Kill-switch application

The option-(b) kill-switch: *≤2 replaceable separation-dependent components → (b) proceeds; ≥3 load-bearing with no replacement → (b) infeasible.*

- In-scope separation-breakages: **0** → comfortably under the threshold. **Option (b) clears the separation kill-switch.**
- The genuine separation user (Direction-2) is out of scope and is **1** component even if counted, still under threshold, and it is not migrated.

**Q-035 returns LOW IMPACT.** It does **not** veto option (b). The cluster's real Phase-3 weight is concentrated in [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) (re-establish the antichain/minimality structure under BF materiality), which three of the five sites funnel into. The session-16 sequencing is unaffected: Q-035 was the Phase-0 kill-switch; it has fired green.

## 5. Caveat (the one scenario that would reopen this)

The Direction-2 finding is **scope-conditional**, not unconditional. If a future decision **unified the substrate's design notion across both the Ambler bridge and the locus-of-disagreement engine onto BF non-uniform strategies** (e.g. to run the contested-frontier feature over higher-order/MELL deliberations), then T005–T011's reliance on Girard separation would have to be re-examined under non-uniformity, and Maurel's separation failure would become directly load-bearing. No such unification is currently proposed; the locus-of-disagreement kernel is additive-free MALL and the BF upgrade is bridge-only. Should that unification ever be tabled, this audit's verdict must be revisited for the Direction-2 row specifically. (It would also collide with the additive frontier, [Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) — additives are exactly where the locus-of-disagreement minimality is already fragile.)

## 6. Methodological note

The audit's main finding is a **diagnosis correction**: the B7 verdict's phrase *"any substrate reasoning relying on FQ/Girard separation (e.g. the ⪯ order) breaks"* conflated three distinct FQ/Girard properties — **separation** (distinct designs separated by a test), **uniqueness of incarnation** (each design has a unique minimal sub-design in its behaviour), and **coherence** (the comparability constraint). The substrate's load-bearing dependencies are on the *second and third*, not the first. BF drops separation **and** lacks a minimality theorem, but it is the *minimality* loss that touches the substrate — and that loss already has a home in Q-032. Separation, the property the question was named for, turns out not to be load-bearing in the BF-migration scope at all.

---

*Deliverable for Q-035 Phase 0. No code, no substrate edit. Verdict: low impact, option (b) clears the separation kill-switch; real obstruction is Q-032. Single scope-conditional caveat recorded in §5.*
