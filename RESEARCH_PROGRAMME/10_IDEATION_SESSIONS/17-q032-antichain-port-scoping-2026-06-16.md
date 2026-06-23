# Session 17 — Scoping the Q-032 antichain port (Sironi principal sets → the exponential layer)

**Date:** 2026-06-16
**Direction:** core ring — the MALL→MELL substrate upgrade ([Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) Phase 3); the [session 16](16-ambler-bridge-mell-cluster-sequencing-2026-06-16.md) cluster's immediate next action
**Status:** **Scoping — no proof attempted.** This session states the port's target, names its single load-bearing obstruction, fixes the worked test instance, decomposes the proof into obligations, and records what evidence the port yields for the deferred carrier choice. No theorem proved, no conjecture promoted, no code touched.
> **Port executed (2026-06-18):** the scope below was run in [`audits/q032-antichain-port-2026-06-16.md`](../audits/q032-antichain-port-2026-06-16.md). **Outcome: O3 = O-rigid-survives (clean).** O0–O5 all discharged; the crux uses the **load-bearing-repetition Lemma** (materiality ⟹ every surviving repetition is essential) in place of the affine "each name once". Promoted to [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) (`provisional`, pending cross-check); [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → partially-resolved. **Carrier readout: A=survives, B=lineage-neutral, C=lineage-neutral ⇒ the [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) carrier gate resolves to the "BF-engine + BT2010-proof" hybrid** (no Terui retarget; Input 2 runtime-profile moot because B is neutral). Phase 4 ([Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a)) unblocked.
> **⚠ Cross-check 2026-06-18 — RETRACTED (BLOCKING DEFECT D1):** the independent non-author cross-check found the "clean / O-rigid-survives" verdict **premature**. O1/O3.5 imported **Terui Def 4.7 (incarnation) + Cor 3.22 (stability) — which are stated over *linear* l-designs** (Terui §4.1) — to the `!`-layer where the nonlinear incarnation/uniqueness theory was never constructed; residual-2 (stability with `!` live) does **not** pass under universal nondeterminism (Terui Thm 4.10(2)). **T012 is NOT promoted; [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) does NOT close.** What survives: the abstract antichain triviality (O3.4) and the **load-bearing-repetition Lemma** (O3.2) — both reusable once a genuine nonlinear incarnation order is built. Secondary **S1**: route→design faithfulness (O3.6) is assumed, not discharged (BT2010 separation-failure) — the downstream b₂′ obstruction. The **carrier readout (hybrid) survives** (rides on argument shape, not the foundation). Back to the author for the D1 repair; see [T012 Cross-check notes](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md#cross-check-notes).
**Purpose:** [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) is now the immediate action ([Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) Phase-2 staged decision, 2026-06-16): re-establish the [T002](../02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md) canonical-generator/antichain result at the `!`-translated (MELL) layer, where neither BF materiality nor BT2010's nonlinear designs supply it. Phase 1 ([Q-034/Q-033 review](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md)) identified **Sironi 2014 principal sets (Def 11)** as the template and confirmed the port is **net-new, target-independent**, and **carrier-independent** (run it in the Terui/BT2010 lineage where Sironi natively lives). This session scopes that port.

> Reading order: [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) (the question), [T002](../02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md) (the FQ-side result being ported), [Q-034/Q-033 review](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) §4 + App C.12 (Sironi Def 11; BF has no minimality theorem), [Q-027 audit](../audits/q027-thin-cones-2026-05-29.md) §1–§2 + [E2 audit](../audits/e2-cardinality-multireinstater-2026-05-31.md) (the aspirin worked instances), [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′/b₂′ (what the generator set feeds).

---

## 0. The problem in one sentence

[T002](../02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md) gives the Ludics side a **canonical generating set** — `Inc(B)`, the material designs of a behaviour, an antichain under `⊆` by Fouqueré–Quatrini uniqueness-of-incarnation — and that set is exactly what [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md)'s generator-level bijection `φ : Inc(B) ↔ 𝒞_base(A, B^♯)` operates on; the FQ proof **uses linearity**, the `!`-layer the argument-chain feature needs is **nonlinear** (contraction), and the port's whole job is to re-establish "the material designs form a canonical antichain-like generating set" in the nonlinear setting, using Sironi's principal sets as the template.

## 1. What the port must deliver

A **BT2010-side analogue of T002**: for a `!`-bearing (nonlinear) behaviour `B`, a canonically-defined finite set `Gen(B)` of material designs such that

1. **(Canonicity)** `Gen(B)` is determined by `B` alone (no presentation choice) — the analogue of T002's "`Inc(B) := {D ∈ B : ∄ D′ ∈ B, D′ ⊊ D}`";
2. **(Antichain / rigidity)** distinct elements of `Gen(B)` are mutually incomparable under the relevant order, so `Gen(B)` is a genuine *set of generators* with no internal redundancy — the analogue of T002 Part 1;
3. **(Generation)** `B` is recovered from `Gen(B)` (biorthogonal closure / `𝒫_fin` free-JSL generation) — the analogue of T002 Part 2's cone decomposition;

sufficient to serve as the **left-hand object of `φ`** in [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′/b₂′ at the exponential layer.

**The template (Sironi 2014, affine).** Sironi's principal set is exactly (1)+(2)+(3) in the affine fragment:

> **Def 9 (incarnation).** `|D|_G = ⋂{D′ | D′ ⊑ D, D′ ∈ G}` — `D` material in `G` iff `D = |D|_G`.
> **Def 11 (principal).** A set `E` is *principal* when its elements are `𝔝`-free and its `𝔝`-shortening is the incarnation of its biorthogonal: `|E^⊥⊥| = E^𝔝`.

Sironi *proves* principality for `ℕat` (Prop 3), `𝕃_n` (Prop 6), `A ⇒ B` (Prop 7), `Πx∈A.B(x)` (Prop 10), `Σx∈A.B(x)` (Prop 11), and the antichain falls out en route (distinct canonical terms differ on a positive action ⇒ `⊑`-incomparable, Prop 2 / Lemma 5). **The port re-runs this in BT2010's nonlinear designs.**

## 2. The single load-bearing obstruction

Everything in §1 is mechanical *except* where the proofs use **linearity**. The port has exactly one hard joint:

> **The rigidity step (T002/Sironi Part 2) uses "each name is used once."** FQ Props 5.2/5.3/5.9 and Sironi Prop 2 establish `⊑`-incomparability of distinct material designs by arguing that distinct canonical terms **differ on a positive action**. That argument is **linear**: it assumes a name/locus is consumed exactly once, so a difference at one action cannot be "absorbed" elsewhere. In BT2010's nonlinear designs, **contraction is admissible** (an action on the same name may repeat — BT2010 Ex 2.14, Thm 2.15(3)), so two distinct material designs could in principle become `⊑`-comparable *through repetition*, or the incarnation `⋂` could behave differently than in the affine case.

This is the same wall the Q-030 Phase-1 audit named (B3: "FQ Prop 5.2/5.3 minimality argument explicitly invokes linearity") and that **Sironi herself flags** (fn 3 affine; "there exist extensions of Ludics that integrate exponentials [BF], on which our approach may be applied" — she does not carry it out). The port either:

- **(O-rigid-survives)** shows the rigidity step survives nonlinearity directly (distinct material designs still differ on an action that repetition cannot absorb — plausible if the repeated actions are "below" the distinguishing action), or
- **(O-rigid-quotient)** shows it survives only **up to a repetition-equivalence** — the antichain is on `Gen(B)/∼` rather than `Gen(B)` (this is Q-032 fallback route ii), or
- **(O-rigid-fails)** exhibits two distinct material designs made `⊑`-comparable by repetition — a genuine obstruction, which is itself the result and forces route iii (minimal repetition profile) or a non-canonical generator.

**This is the whole game.** Canonicity (1) and generation (3) are expected to port cleanly (incarnation-as-intersection and biorthogonal closure are not linearity-specific); the rigidity/antichain step (2) is where the nonlinearity bites.

## 3. The worked test instance — a minimal higher-order Ambler rule

The port must be tested on a **nonlinear** behaviour, i.e. one whose `!`-image genuinely uses contraction. The existing aspirin instances are *propositional* (Q-027 Q3, `|Inc(B)| = 2`; E2 Q4, `|Inc(B)| = 3`) — they live in the closed MALL bridge and do **not** exercise `!`. The port needs the **smallest extension of the aspirin fact-base with a higher-order rule** — a rule whose premise is itself a derivation (a λ-abstraction), which is exactly the **argument-chain** construct the Phase-2 decision identified as the higher-order need, and exactly the [Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) instance.

**Candidate minimal higher-order rule (to be pinned in the port itself).** Extend Γ (Q-027 §1) with a rule that *consumes a derivation as a premise* and *uses it more than once* (to force contraction), e.g. a meta-rule that takes an argument `p : muscle_pain → aspirin` and applies it twice (a "robustness" rule: an argument that survives two independent instantiations is trusted). The `!`-translation of "use `p` twice" is `!(muscle_pain → aspirin)`, and the generator is a λ-term `λp. … p … p …` — a nonlinear use. **This is the design whose materiality/antichain status the port checks.**

> **Scoping note, not yet executed:** the exact minimal rule is the port's first deliverable. The constraint is: (a) it must λ-abstract over a derivation (so the generator is higher-order), and (b) it must use the abstracted derivation **≥ 2 times** (so the `!`-image is genuinely nonlinear — a single use stays in the affine fragment where Sironi already applies). The aspirin fact-base is retained so the propositional sub-structure (and its already-computed `Inc(B)`) anchors the comparison, exactly as E2 extended Q-027.

The test the instance must pass: compute `Gen(B)` for this nonlinear behaviour under the BT2010 incarnation (Def 9 analogue), check the three obligations of §1, and **specifically** check whether the higher-order generator is `⊑`-incomparable to the propositional generators (`D_{t₁}`, `D_{t₂}`) — i.e. whether the rigidity step (O-rigid) holds on the first instance where contraction is live.

## 4. Proof obligations (the port's internal decomposition)

| # | obligation | expected difficulty | maps to |
|---|---|---|---|
| **O0** | Pin the minimal higher-order rule (§3): λ-abstracts a derivation, uses it ≥2×, extends the aspirin Γ. | easy (construction) | Q-028a stratum-2 instance |
| **O1** | Define `Gen(B)` / materiality in BT2010 nonlinear designs (port Sironi Def 9 — incarnation as `⋂` of sub-designs in `B`). | easy (BT2010 has the order + `⊑`) | T002 (1) canonicity |
| **O2** | Port Sironi Def 11 (principal set) verbatim to the nonlinear setting; state `|E^⊥⊥| = E^𝔝`. | easy (definitional) | template |
| **O3** | **(THE CRUX)** Re-prove the rigidity step: distinct material designs are `⊑`-incomparable in the nonlinear setting — or up to repetition-equivalence (O-rigid-quotient), or exhibit a counterexample (O-rigid-fails). | **hard** — the one linearity-dependent step | T002 (2) antichain; §2 |
| **O4** | Re-prove generation: `B` recovered from `Gen(B)` via biorthogonal closure / `𝒫_fin`. | medium (not linearity-specific) | T002 (3) cone decomposition |
| **O5** | Verify on the O0 instance: compute `Gen(B)`, check O1–O4, confirm the higher-order generator is rigid against the propositional ones. | medium (worked example) | E2-style corroboration |

**Attack order:** O0 → O1 → O2 (all quick, set the stage) → **O3 on the O0 instance first** (the worked example is the fastest way to find out whether rigidity survives — if a counterexample exists, it shows up here before any general proof) → O3 general → O4 → O5 as the consolidated check. This mirrors the programme's *Phase-2-before-Phase-3* discipline (corroborate on the smallest instance before the general theorem), exactly as [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) and the E2 audit did.

## 5. What the port yields for the deferred carrier choice — gate, rubric, matrix

Per the [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) staged decision, the b-BF vs b-Terui carrier commit is **held behind this port**. The port produces the deciding evidence as a by-product — but "clean → Terui / awkward → hybrid" is too loose to act on. The decision is pinned by a **gate** (when), a **two-input rubric** (how), and a **default-asymmetric matrix** (the rule).

### 5.1 The gate (when the carrier is decided)

**At the close of O3-general + O4, *before* Phase 4 (Q-028a-2) starts.** Three reasons:

- **Not at O3-on-the-instance.** A single worked instance can mislead either way (a degenerately clean instance, or an awkward one that is an artifact of the specific rule). Read the carrier signal only once rigidity is settled *in general*.
- **Not after Phase 4.** Phase 4 *builds the bridge extension on the chosen carrier* — deferring past it means doing Phase-4 work against an undecided carrier, or redoing it. The carrier must be fixed before the thing that consumes it.
- So the binding read is the **explicit closing deliverable of Q-032**. There is a non-binding *preliminary* read at O3-on-the-instance — it does not decide, but if the instance looks Terui-flavored it licenses starting the long-pole c-design path-characterization (Pavaux) dependency in parallel.

### 5.2 The rubric (two inputs, not one)

Port difficulty alone is necessary but not sufficient. The carrier is a function of **two** signals — and the second is the runtime-profile question deferred earlier in the cluster, which must be answered *here*, jointly:

**Input 1 — port difficulty (from O3), three sub-signals:**
- **A — which route fired:** O-rigid-survives (clean) / O-rigid-quotient (route ii) / O-rigid-fails (route iii).
- **B — proof dependency (the real discriminator):** does the rigidity argument *essentially use* c-design structure (named variables, β-reduction, the λ-toolkit), or does it go through on structure BF also has (views, τ-sums)? A proof that *wants* to be a λ-term argument is evidence the substrate should be c-designs; a proof that is lineage-neutral is not.
- **C — generation (O4):** did `𝒫_fin`/biorthogonal recovery stay lineage-neutral, or lean on one side's machinery?

**Input 2 — runtime profile:** is the Ludics→Ambler bridge **runtime-hot** (engine frequently projects designs → Ambler derivations for display/persistence) or **proof-level** (mainly justificatory)? *(Promoted to a named [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) sub-decision so it is answered at this gate, not forgotten.)*

### 5.3 The decision matrix (default = hybrid; retarget is one bit)

The commit is **asymmetric**: b-BF is the default because b-Terui costs an engine rewrite (`stepCore` act-lists → c-designs) + Agda re-mechanisation + the open Pavaux path-characterization dependency, whereas b-BF costs only a strategy↔λ-term shim at the bridge boundary.

| port (Input 1) | runtime-hot | proof-level |
|---|---|---|
| **clean & Terui-flavored** (A=survives, B=uses c-design) | **b-Terui** (full retarget — both bars cleared) | **hybrid** (clean BT2010 proof, but the syntactic win doesn't recur → keep BF engine) |
| **clean but lineage-neutral** (A=survives, B=neutral) | **hybrid**, BF-leaning | **hybrid** (BF) |
| **awkward** (A=quotient/fails) | **hybrid** (BF engine carries the quotient/profile structure) | **hybrid** (BF) |

**One-sentence rule:** a full **b-Terui** retarget fires only on `A=survives ∧ B=uses-c-design-structure ∧ runtime-hot` (top-left cell); **every other cell stays the "BF-engine + BT2010-proof" hybrid.** So the matrix is a **one-bit decision** — "retarget to Terui, yes/no" — defaulting to **no**, and the hybrid is the *automatic landing spot of doing the port at all* (prove in BT2010, run on BF). Ambiguous evidence ⇒ stay hybrid: you lose nothing and can retarget later if a runtime-hot use case materializes, whereas a premature retarget burns the engine rewrite.

### 5.4 Is the "awkwardness" theoretical or implementation?

**It is overwhelmingly a *theoretical* (proof-side) property, by construction — and that is deliberate.** The whole point of running Q-032 in the carrier-independent BT2010 lineage is that "awkward" is measured on the *proof*, before any engine code is touched:

- **Input 1 (A, B, C) is entirely theoretical** — which route fires (survives/quotient/fails), and whether the rigidity argument leans on c-design structure, are facts about the *proof of the antichain*, established on paper/Agda with no runtime in sight. "Awkward" here = the proof needs a repetition-quotient, a minimal-profile selection, or heavy machinery — a mathematical verdict.
- **The implementation cost is downstream and *asymmetric between the carriers*, not a property of the awkwardness itself.** A b-Terui retarget's expense (engine rewrite, re-mechanisation, Pavaux dependency) is fixed and large *regardless* of how the proof went; a b-BF hybrid's expense (a shim) is fixed and small. So implementation cost doesn't vary with awkwardness — it varies with *which carrier you pick*, and the matrix already prices it in via the default-asymmetry.
- **The one place theory becomes implementation:** an O-rigid-quotient/-fails outcome forces the substrate to *carry extra structure* (a `∼` relation, or a canonical-representative selector) on materiality — that is a real downstream data-model obligation. But even then the *carrier decision* it drives is "stay hybrid," and the structure is carried on whichever engine you keep. So awkwardness adds an implementation *artifact* (the quotient/selector) without changing the carrier *cost* comparison.

**Net:** awkwardness is a theoretical readout that *informs* the carrier decision; it never *is* the implementation cost. The implementation cost lives entirely in the carrier asymmetry (rewrite vs shim), which is known in advance and independent of how the proof turns out. This is exactly why the port can be run first and the carrier committed second.

## 6. Off-ramps and fallback routes


- **Route (ii) — antichain-up-to-repetition-equivalence.** If O3 is O-rigid-quotient, define `∼` (repetition-equivalence on material designs) and prove `Gen(B)/∼` is an antichain. Cost: the substrate carries `∼` as extra structure on materiality; `φ`'s domain becomes a quotient. Acceptable — C001b′ b₂′ only needs *distinct generators map to distinct Ambler terms*, which a quotient can still satisfy if `∼`-classes correspond to single Ambler λ-terms.
- **Route (iii) — minimal repetition profile.** If O3 is O-rigid-fails, among material designs with the same support pick the canonical representative with minimal multiplicities; prove *those* form an antichain. Cost: a canonical-representative selection function; heavier.
- **Hard off-ramp.** If none of O-rigid-{survives, quotient, profile} yields a canonical generator, that is a **documented obstruction** — it would mean the exponential bridge has no canonical generator set, forcing C001b′ to carry the generator presentation as side data at higher order (the runtime contract's already-guarded fallback for higher-order generators), and is itself a publishable Q-032 result. The argument-chain feature would then have a bridge that is *well-defined but not canonical* at the `!`-layer — a real but survivable product outcome.

## 7. Deliverable

An audit `audits/q032-antichain-port-2026-XX-XX.md` containing: O0 (the pinned higher-order rule), O1–O2 (the BT2010-side definitions), the **O3 verdict** (survives / quotient / fails, with the worked O0 instance), O4–O5, and the **§5 carrier-evidence readout**. On success it promotes to a BT2010-side T002 (a new `T0NN-gen-b-antichain.md`) and closes [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032); on a documented obstruction it records the route-iii/side-data fallback and still resolves the carrier choice. Either outcome unblocks **Phase 4** ([Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) → [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b) MELL extension).

## 8. One-paragraph honest framing

The port is **one hard step wrapped in five easy ones**. Canonicity, the principal-set definition, and generation all carry over because incarnation-as-intersection and biorthogonal closure are not linearity-specific. The entire risk is concentrated in **O3 — does the rigidity/antichain step survive contraction** — and the fastest way to learn the answer is to compute it on the **smallest nonlinear instance** (a single higher-order aspirin rule that uses its argument twice), *before* attempting any general proof. That single computation also resolves the deferred b-BF/b-Terui carrier question. The work is well-posed, the test instance is concrete, and the failure modes are all survivable (quotient, profile, or a non-canonical-but-well-defined higher-order bridge).

---

*Scoping only — no proof, no promotion, no code. When the port runs, file the audit and update [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) + [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) (carrier choice) accordingly.*
