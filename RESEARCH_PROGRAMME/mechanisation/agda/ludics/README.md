# `ludics/` — the constitutive Ludics core (Direction 5, M-track)

This directory is the home of the **constitutive** Ludics mechanization — the
standalone type-theoretic model of designs, interaction, orthogonality and
behaviours that §5 of
[`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](../../../09_FUTURE_DIRECTIONS_BRAINSTORM.md)
calls for, sequenced in
[session 09](../../../10_IDEATION_SESSIONS/09-mechanization-ludics-core-sequencing-2026-06-08.md).

Unlike `T001/`, `T002/`, `C004/`, `T009/` — which are **corroborating**
mechanizations of already-`established` paper theorems on convenient concrete
models — the artifacts here build the **primitive objects themselves**, so the
theorems become consequences of the definitions.

## Status

| Step | What | State |
|------|------|-------|
| **M0** | Carrier decision + type-only signature stub | ✅ **done 2026-06-09** — [`Core.agda`](Core.agda); decision in [`audits/m0-design-carrier-ludics-core-2026-06-09.md`](../../../audits/m0-design-carrier-ludics-core-2026-06-09.md) |
| **M1** | Define `interact` (multiplicative finite fragment); discharge the postulate; restore `--safe` | ✅ **done 2026-06-09** — [`Core.agda`](Core.agda) now `--safe --without-K`, no postulates/holes, EXIT:0; five status/orthogonality examples by `refl` |
| **M2** | First constitutive theorem: determinacy + fuel-monotonicity ⇒ orthogonality is fuel-independent | ✅ **done 2026-06-09** — [`Interaction.agda`](Interaction.agda), `--safe`, no postulates/holes, EXIT:0. **Named obstruction:** associativity *proper* needs a composition/cut op M1 lacks (and confluence is vacuous under determinism) — see [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md) |
| **M3** | Separation theorem (fused Direction-2 minimality certificate) | ✅ **done 2026-06-09** — [`Separation.agda`](Separation.agda), `--safe`, no postulates/holes, EXIT:0. Behavioural separation framework; `Beh D = pol⁺⟨D⟩` instantiates `lib.Closure.Biorthogonal` over designs (M4 preview); sound half (`≡⇒≈`, testing characterisation) + a constructive separating test. **Deep half named:** Böhm separation (needs incarnation) + the minimal-locus bridge to T009 (needs a locus-returning interaction) — [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md) |
| **M3-bridge** | Locus-returning interaction `interactL` + first-divergence locus (Direction-2 fusion) | ✅ **done 2026-06-09** — [`Locus.agda`](Locus.agda), `--safe`, no postulates/holes, EXIT:0. Projection law `proj₁ ∘ interactL ≡ interact`; first-divergence locus (T006 E0) unique + fuel-stable on the `Locus = List ℕ` model T008/T009 use. **Named obligation:** eventual-decidedness (the pigeonhole on the used-set) — [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md) |
| **M4** | Internal completeness `B = B^⊥⊥` via `lib/Closure.agda` `Biorthogonal` | ✅ **done 2026-06-09** — [`Completeness.agda`](Completeness.agda), `--safe`, no postulates/holes, EXIT:0. Behaviours = biorthogonally-closed design sets; closure is the least behaviour (generation); every polar is a behaviour; **internal completeness proper** `pol⁺(clo S) ≡ pol⁺ S` (closing doesn't change tests) |
| **M2-assoc (composition/cut)** | Composition operation to unblock associativity (the parked M2 obstruction) | ✅ **done 2026-06-11** — [`Composition.agda`](Composition.agda): relocation functorial, disjoint **merge** a strictly-associative monoid, **cut** + **(A) up-to-associator** (`cut-assoc`/`cut-assoc⁻¹`) + **pentagon** (`pentagon`). [`CutElim.agda`](CutElim.agda): the **non-interference crux** (`footprint-disjoint`), the **residual normalizer** `normCut` with **cut-commutation** (`normCut-commute`), and the **`interact`-computed cut** `normRun` with **`normRun-commute`** (associativity for distinct cuts, results computed by running `interact`, `All (TouchedBy κ)` discharged). **Associativity proper closed** — the three core theorems (assoc ∧ separation ∧ completeness) are all mechanized. One *content* refinement open (precise survivor list vs κ-region) — [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md) |
| **M5** | HoTT scheme proof-of-concept (cubical, separate `hott/` tree) | ✅ **done 2026-06-11** — [`hott/Scheme.agda`](../hott/Scheme.agda), `--cubical` (cubical-0.8), EXIT:0, segregated from the `--safe` corpus. Argument-from-Expert-Opinion **scheme as a dependent type**; **CQs as elimination obligations** (`conclude` demands the CQ bundle); an `Argument` is a term of the dependent Σ-type; and **`behaviour-extensional = ua`** + **`behaviour-univalence = univalence`** cash the slogan — behavioural equivalence (`≃`) *is* behaviour identity (`≡`), "equivalence is equality" for scheme identity (behaviour abstract, option b). **Direction-5 sequence M0→M5 complete.** |

## Files

- [`Core.agda`](Core.agda) — **M0 carrier + M1 interaction.** Fixes the carrier
  (`Design = List Act` mirroring the engine `CoreAct[]`; `Locus = List ℕ`, the
  T009 / `separation.ts` model) and **defines** `interact : ℕ → Design → Design
  → Status` by fuel-recursion — a faithful transcription of the multiplicative
  fragment of the engine loop `stepCore` (`findNextPositive` /
  `findNextNegativeAtLocus` at the equal locus / alternating A·B handshake /
  four-way status). Orthogonality `D ⊥ E := ∃ n, interact n D E ≡ CONVERGENT`
  is faithful to `checkOrthogonal.ts`. Five examples (one per status + an
  orthogonality witness) discharge non-vacuity by `refl`.

  > As of **M1 (2026-06-09)** this file is `--safe --without-K` with **no
  > postulates and no holes** — it is now a full member of the safe corpus.
  > (The M0 `postulate interact` has been discharged.)

  **Scope cuts (audit §4), staged not dropped:** the additive fragment
  (between M2 and M3), the consensus testers (bridge layer, out of `ludics/`),
  and the focus/phase gate (post-M4) are deliberately not modelled in M1; the
  `additive` field is kept on the carrier but unread.

- [`Interaction.agda`](Interaction.agda) — **M2: the first constitutive
  theorem.** Determinacy (`interact` is a function) + **fuel-monotonicity**
  (`loop-mono`, `interact-mono-suc`, `interact-mono-≤`): once a run is *decided*
  (CONVERGENT / DIVERGENT / STUCK), more fuel never changes the verdict — only
  ONGOING can flip. The payoff (`⊥-upward`, `⊥-eventually`): **orthogonality is
  fuel-independent** (converges at *some* budget ⇒ at *every* larger budget),
  the well-definedness M4's `B = B^⊥⊥` needs.

  > **Named obstruction (programme discipline).** Session 09 called M2
  > "associativity of interaction". On contact with M1, associativity *proper*
  > is **not statable**: `interact` is a two-party, `Status`-valued normalizer,
  > so associativity needs a **composition/cut** operation (designs → residual
  > *design*) that M1 lacks; and the confluence reading is **vacuous** because
  > `interact` is deterministic. Composition is therefore a prerequisite
  > *step* (M3), not a corollary of M1 — logged as [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md).

- [`Separation.agda`](Separation.agda) — **M3: behavioural separation (the
  crown, fused with Direction 2).** Separation is statable directly over
  `interact` (it is about interaction-as-`Status`), so — unlike associativity
  — it needs **no** composition/cut. Builds: the behaviour `Beh D = λ E → D ⊥ E`,
  the observational preorder `_⯌_` / equivalence `_≈_` (orthogonal to the same
  tests) with their laws; the **biorthogonal characterisation** — instantiating
  `lib.Closure.Biorthogonal` at `_⊥_` makes `Beh D` the right polar `pol⁺⟨D⟩`,
  so `≈` is equality of polars and the closure `clo`/`Closed` over designs is
  delivered early (the **M4 object**); the **sound half** of separation
  (`≡⇒≈`, plus the testing characterisation `separates⇒≉` / `≈⇒no-separator`);
  fuel-robustness of behaviour (from M2); and a **constructive separating
  test** (`[]` separates the daimon-design from the bare positive ⇒ they are
  not observationally equivalent).

  > **Named deep half (programme discipline).** Böhm/Girard separation
  > *proper* (`≈ ⇒` equality of **incarnations**) needs a material-design
  > operation absent in M1; the **Direction-2 minimal locus** (the separating
  > test's failure has a determinate, *minimal* first-divergence locus —
  > exactly T008/T009, already mechanised on this `Locus = List ℕ` model)
  > needs a locus-returning `interactL`. Both named, neither assumed —
  > [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md).

- [`Locus.agda`](Locus.agda) — **M3-bridge: the Direction-2 fusion.** Gives
  interaction a first-divergence locus: `interactL : ℕ → Design → Design →
  Status × Maybe Locus`, with the **projection law** `proj₁ ∘ interactL ≡
  interact` (the status is byte-for-byte M1; the locus never perturbs it).
  Fuel-monotonicity of the *pair* lifts to the **first-divergence locus**
  (T006's E0) being **unique and fuel-stable** (`divLocus-unique`,
  `divLocus-stable`); `ℓ : Locus = List ℕ` is *literally* the T008/T009
  object, so the extracted locus feeds their minimality theorems with no
  translation. The remaining **eventual-decidedness** obligation (§5) is
  stated precisely with its genuine crux — a **pigeonhole on the provider
  used-set** (the naive cursor measure fails because the dual-search scans
  from 0) — left under [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md), not
  postulated.
- [`Completeness.agda`](Completeness.agda) — **M4: behaviours & internal
  completeness.** Instantiates the already-built `lib.Closure.Biorthogonal`
  at `_⊥_` to read off the constitutive closure content: a **behaviour** is a
  biorthogonally-closed design set (`G = G^⊥⊥`); the closure is the **least**
  behaviour containing a set (`clo-least` — generation); **every polar is a
  behaviour** (`polar-behaviour` — behaviours are exactly double-polars); and
  **internal completeness proper** (`internal-completeness`): closing a design
  set does not change the tests it passes, `pol⁺ (clo S) ≡ pol⁺ S` — Girard's
  "already complete from inside", now a theorem over the real
  `interact`-orthogonality. A concrete inhabited behaviour (designs orthogonal
  to the daimon-test, containing the Core handshake) witnesses non-vacuity.
- [`Composition.agda`](Composition.agda) — **composition / cut track (the
  parked M2-associativity obstruction).** Builds the structural backbone of
  cut: **relocation** `relocate p D` (delocation under a locus prefix, the
  abstract form of the engine `delocate.ts` / `cloneDesignWithShift`), proven
  **functorial**; the **disjoint merge** `_⊕ᴰ_`, proven a strictly-associative
  **monoid**; **cut** `cut D E` = left/right-tag-shift then merge (the engine
  `compose.ts` `spiritual` branch), relocation-natural. **§5:** `cut` is
  associative **up to the associator** locus iso `assocL`/`assocL⁻¹`
  (`cut-assoc` / `cut-assoc⁻¹`, both directions). **§6:** the associator
  **pentagon** (`pentagon`, via whiskering `whiskerL`/`whiskerR` + the fusion
  lemma) — Mac Lane coherence; both four-operand re-bracketing routes agree.
  So the **structural** bicategory coherence of `cut` is complete.

  > **Remaining obligation (§7, programme discipline).** (B) the deep theorem
  > — **associativity of the residual-cut normalizer** (cut-elimination),
  > needing a `normCut` that returns a residual *design* (M1's `interact`
  > returns only a `Status`); its crux is confluence at distinct cut loci =
  > T009's already-mechanized O-parity-b non-interference. Named, not
  > postulated — [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md).
- [`CutElim.agda`](CutElim.agda) — **Round 2 of the cut track: the
  non-interference crux + the residual normalizer's commutation.** Re-proves
  T009's O-parity-b in the **cut vocabulary**: a K-free recursive prefix order
  `_⊑_` (with `_⊑?_`), `bifurcate`, `TouchedBy κ a`, and the headline
  **`footprint-disjoint`** — at ⊑-incomparable cut loci, **no act is touched
  by both**. The **residual normalizer** `normCut κ rs D = residual κ D ++ rs`
  (drop κ's footprint, splice in the result `rs`) then satisfies
  **`normCut-commute`**: for ⊑-incomparable cut loci, the two cuts **commute**
  (up to permutation — designs are act-multisets) — associativity of
  composition for distinct cuts. Its load-bearing input is exactly
  `footprint-disjoint` (each cut's result lives under its own locus, so
  survives the other's cut: `residual-fixed-disjoint`); `residual-comm` +
  `reassoc-↭` finish it.

  > **§6 closes (B): the `interact`-computed cut.** `normRun f κ D E = normCut
  > κ (interact-residual f κ D E) (D ++ E)` runs the M1 `interact` at the cut
  > and installs the under-κ result (`underκ`, provably `All (TouchedBy κ)`
  > via `underκ-All`). **`normRun-commute`** is then `normCut-commute` with
  > both `All` hypotheses discharged — cut-commutation for results genuinely
  > computed by interaction, no external promise. **Associativity proper is
  > closed.** One *content* refinement remains (a survivor-by-survivor
  > collector would narrow the κ-region to the exact normalised trace — it
  > changes `rs`'s content, not the theorem) — [Q-046](../../../01_OPEN_QUESTIONS_REGISTRY.md).

### `hott/` — the cubical/HoTT tree (M5, segregated)

A **separate** library (`mesh-hott.agda-lib`, `depend: standard-library cubical-0.8`,
`{-# OPTIONS --cubical #-}`) — cubical and the `--safe --without-K` `ludics/`
corpus are different type-theory regimes and **cannot share a module**, so
`mesh-substrate.agda-lib` never depends on it.

- [`hott/Smoke.agda`](../hott/Smoke.agda) — toolchain smoke-test (`ua` importable).
- [`hott/Scheme.agda`](../hott/Scheme.agda) — **M5: the univalence cash-out.**
  Argument from Expert Opinion as a **dependent type** (`ExpertOpinion`,
  premise slots); its **critical questions as elimination obligations**
  (`CQ-field`/`CQ-trust`/`CQ-consistency`/`CQ-backup`, bundled as `CQs`; the
  eliminator `conclude` demands them); an `Argument` is a term of the
  dependent Σ-type. With behaviour ABSTRACT (a module parameter `⟦_⟧`, per
  the §18 option-(b) decision), **`behaviour-extensional = ua`** turns a
  behavioural `≃` into behaviour `≡`, and **`behaviour-univalence = univalence`**
  gives the full `(≡) ≃ (≃)` — "scheme identity is behaviour-extensional" =
  the inferentialist's "equivalence is equality". The tie to the constitutive
  `_⊥_`-behaviour (T003's C006 𝐑(𝑢)) is a *documented correspondence*, not a
  cross-regime import.
## Build

From `RESEARCH_PROGRAMME/mechanisation/agda`:

```
agda ludics/Core.agda
agda ludics/Interaction.agda
agda ludics/Separation.agda
agda ludics/Locus.agda
agda ludics/Completeness.agda
agda ludics/Composition.agda
agda ludics/CutElim.agda
```

The cubical M5 tree builds separately (from `mechanisation/agda/hott`):

```
agda Smoke.agda
agda Scheme.agda
```

Tested against Agda 2.7.0.1, agda-stdlib v2.0. Type-checks under
`--safe --without-K` with no postulates and no holes (EXIT:0).