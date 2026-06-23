# Q-032 antichain port — Sironi principal sets → the `!`-translated (MELL) layer

- **status:** **port executed; cross-check 2026-06-18 returned BLOCKING DEFECT D1 — the "clean / O-rigid-survives" closure is RETRACTED.** O0–O5 + carrier readout were completed and *reported* `O-rigid-survives`, promoting to [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md). The independent non-author cross-check ([T012 Cross-check notes](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md#cross-check-notes)) found the foundation unsound at the `!`-layer: **O1/O3.5 import Terui Def 4.7 (incarnation) + Cor 3.22 (stability) as nonlinear, but Def 4.7 is over `l-designs` = LINEAR** (Terui §4.1; MALL-level), so O1.1's "Def 4.7 is already the nonlinear setting" is wrong — contradicting this programme's own Phase-1 finding ([Q-034 review §(b)](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md): Terui minimality is *affine*, BT2010 has *no* minimality theorem, "not a theorem you can cite for the MELL antichain"). Residual 2 (stability w/o hidden linear side-condition) **does not pass** — the `!`-layer is universally nondeterministic (Terui Thm 4.10(2)), where Berry stability is not expected to hold. **What survives:** the abstract O3.4 (antichain triviality) and the **load-bearing-repetition Lemma O3.2** (genuine new idea, sound *given* a well-defined incarnation order). **Repair needed:** construct the nonlinear incarnation/uniqueness theory genuinely (or restrict + *prove* stability with `!` live) — the net-new content Q-032 was filed to produce. Secondary **S1**: O3.6 assumes route→design faithfulness (the downstream b₂′ obstruction). **[Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) does NOT close; [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) stays `provisional`.** The carrier readout (**hybrid**) is robust to D1 (rides on argument shape, not the foundation) and stands provisionally. **Source review done 2026-06-19** (see §"Source review"): D1 confirmed verbatim from the PDFs; the repair direction is fixed — **replace the linear ⋂-incarnation antichain with proof-design canonicity via completeness-for-proofs (BT2010 Thm 3.8 / BF Thm 11.17) on the deterministic `✠`-free fragment**; restructure (round 2) pending.
- **status (superseded, pre-cross-check):** complete (provisional — pending independent cross-check). O0–O5 done; crux verdict **O-rigid-survives** (clean port); binding carrier readout = **stay hybrid (BF-engine + BT2010-proof)**. Promotes to [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md); [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → partially-resolved.
- **started:** 2026-06-16
- **scopes:** [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) (the antichain port); feeds [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) carrier gate; unblocks [Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) → Phase 4
- **executes:** [session 17 scoping](../10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md) (obligations O0–O5, crux O3, carrier rubric §5) + its [kickoff prompt](../10_IDEATION_SESSIONS/17-q032-antichain-port-KICKOFF-PROMPT.md)
- **ports:** [T002](../02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md) (FQ-side antichain) using **Sironi 2014 Def 9/11** as template, into the **BT2010** nonlinear-design lineage
- **inputs:** [Q-027 audit](q027-thin-cones-2026-05-29.md) §1–§2 (aspirin Γ, λ-term enumeration discipline, generators `D_{t₁}`/`D_{t₂}`); [E2 audit](e2-cardinality-multireinstater-2026-05-31.md) (the `|Inc(B)| = 3` extension pattern); [Q-034/Q-033 review](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) §4 + App C.12 (Sironi Def 9/11 verbatim; BF has no minimality theorem); [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′/b₂′ (what the generator set feeds)
- **method:** paper construction + worked-instance computation; Phase-2-before-Phase-3 discipline (corroborate on the smallest nonlinear instance before the general theorem)

> **Notation.** `✠` is the daimon. `D ⊑ D′` is the design order (BT2010 ⊑; on the
> C001a list-model, chronicle-set inclusion `⊆`). For a behaviour `B`, the
> incarnation of `D` in `B` is `|D|_B = ⋂{D′ | D′ ⊑ D, D′ ∈ B}` (Sironi Def 9);
> `D` is **material** in `B` when `D = |D|_B`. `E^✠` is the daimon-shortening of
> `E` (Sironi's `E^𝔝`). A set `E` is **principal** when its elements are `✠`-free
> and `|E^⊥⊥| = E^✠` (Sironi Def 11).

---

## O0 — the minimal higher-order "use-twice" rule (PINNED)

**Goal (session 17 §3, kickoff "first concrete step").** Construct the smallest
extension of the aspirin fact-base Γ ([Q-027](q027-thin-cones-2026-05-29.md) §1)
with a rule that (a) λ-abstracts over a **derivation** as a premise, and (b) uses
that derivation **≥ 2 times**, so the `!`-image is *genuinely nonlinear* (a single
use stays affine, where Sironi already applies). Retain the aspirin fact-base so
the propositional incarnations `D_{t₁}`, `D_{t₂}` ([Q-027](q027-thin-cones-2026-05-29.md)
§5.2) anchor the comparison.

### O0.1 The fact-base Γ⁺ (minimal extension)

Start from Ambler Example 1's Γ ([Q-027](q027-thin-cones-2026-05-29.md) §1):

| Label | Type | role |
|---|---|---|
| t₁ | `muscle_pain → aspirin` | Example 1 — the scheme we will promote |
| t₂ | `(muscle_pain ∧ ¬gastric_ulcer) → aspirin` | Example 1 |
| c₁ | `gastric_ulcer → ¬aspirin` | Example 1 (rebuttal) |
| i₁ | `stomach_pain → gastric_ulcer` | Example 1 |
| i₂ | `(short_term ∧ anxiety) → ¬gastric_ulcer` | Example 1 (undercutter) |

Add the **minimum** needed to (i) supply a *second, independent* muscle-pain
witness — so the two uses of the promoted scheme land on **distinct data loci**
and the only contraction is on the *derivation*, not on the data — and (ii) name
the higher-order robustness scheme:

| Label | Type | note |
|---|---|---|
| **j** | **`joint_pain → muscle_pain`** | **NEW** — second, independent muscle-pain route (joint pain is a muscle-type pain) |
| **r** | **`!(muscle_pain → aspirin) ⊸ muscle_pain ⊸ joint_pain ⊸ aspirin`** | **NEW** — the higher-order *robustness* meta-rule |

One new atom (`joint_pain`), one new micro-rule (`j`), and the robustness rule
`r`. `j` exists so the two uses of the promoted scheme consume **disjoint** data
loci (`muscle_pain` directly vs `muscle_pain` via `joint_pain`); without it the
"second use" would land on the same locus and the data side, not the derivation,
would carry the duplication. `r` concludes plain **`aspirin`** (not a fresh
`robust_aspirin` atom) **on purpose**: this makes its incarnation a *third
material design of the same behaviour* `B_aspirin` alongside `D_{t₁}`, `D_{t₂}`,
so the O3 rigidity question ("is the higher-order generator `⊑`-incomparable to
`D_{t₁}` / `D_{t₂}`?") is **non-vacuous** — exactly the E2 pattern (a third
generator in `B_aspirin`), now with the third generator carrying contraction.

### O0.2 The `!`-type and why it is genuinely nonlinear

`r`'s first premise is a **derivation** `p : muscle_pain → aspirin`, and `r`'s
realizer uses `p` **twice** (once per witness). "Use `p` twice" is contraction on
`p`; the linear-logic discipline that licenses it is the exponential:

$$r \;:\; \underbrace{!(\textit{muscle\_pain} \multimap \textit{aspirin})}_{\text{the duplicable scheme }p} \;\multimap\; \textit{muscle\_pain} \;\multimap\; \textit{joint\_pain} \;\multimap\; \textit{aspirin}.$$

The `!` is **load-bearing**: with `p : muscle_pain → aspirin` (no `!`) the rule
could fire `p` only once and stays in the affine fragment Sironi already covers
(fn 3 — "weakening but … no contraction"). The `!` on `p` is precisely the point
where BT2010's **admissible contraction** (Ex 2.14 — "exponentials … already
incorporated into the connectives"; Thm 2.15(3) — duplicability) becomes live,
and therefore the point the port must test. This is the **Q-028a stratum-2**
instance ([C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) §"Why b₁′+b₂′
are not trivial", item 2: "higher-order types … proper λ-abstractions … exponential
behaviours `B!A`").

### O0.3 The generator λ-term (the higher-order generator)

Instantiate the duplicable scheme with the **existing** propositional scheme `t₁`
(promoted: `!t₁`). The higher-order generator is the β-normal term that contracts
`!t₁`:

$$G_r \;:=\; r\,\langle\, !t_1,\; m,\; q \,\rangle \;\;\rightsquigarrow\;\; \text{corr}\big(\, \underbrace{t_1\, m}_{\text{use 1 of }t_1},\; \underbrace{t_1\, (j\, q)}_{\text{use 2 of }t_1}\,\big) \;:\; \textit{aspirin}$$

in context `(m : muscle_pain, q : joint_pain, Γ⁺)`, where `corr` is `r`'s internal
two-premise corroboration (it fires aspirin only when **both** instantiations of
the scheme succeed). Equivalently, exposing the abstraction, the scheme `r`
realizes the higher-order λ-term

$$\lambda p.\,\lambda m.\,\lambda q.\; \text{corr}\big(\, p\, m,\; p\, (j\, q) \,\big), \qquad p \text{ used twice}.$$

**The query** for the instance (extend Q3's antecedent with the second witness,
keep `aspirin` as the conclusion):

$$Q\!\star.A \;=\; \textit{muscle\_pain} \,\wedge\, \textit{joint\_pain} \;\Rightarrow\; \textit{aspirin}, \qquad p := \,!t_1 \text{ supplied as the duplicable scheme.}$$

The propositional fact-base is retained, so at the richer antecedent `D_{t₁}`,
`D_{t₂}` are still present and `G_r` is the **third** generator — the first one
whose `!`-image uses a **repeated action** (the doubled `t₁`).

### O0.4 O0 deliverable — stated explicitly (as the kickoff requires)

- **Rule:** `r : !(muscle_pain → aspirin) ⊸ muscle_pain ⊸ joint_pain ⊸ aspirin` (plus the helper `j : joint_pain → muscle_pain`).
- **`!`-type:** the duplicable premise is `!(muscle_pain ⊸ aspirin)`; the `!` is what makes the image nonlinear (two uses of the scheme = contraction on `p`).
- **Generator λ-term:** `G_r = r⟨!t₁, m, q⟩ = corr(t₁ m, t₁ (j q)) : aspirin`, i.e. `λp.λm.λq. corr(p m, p (j q))` with `p` used twice.

✅ **O0 is pinned.**

---

## Preliminary O3-on-the-instance read (the fastest signal — kickoff "first concrete step")

> **Status: preliminary.** This is the non-binding O3-on-the-instance read the
> kickoff asks for "immediately" after O0. It does **not** decide O3 (which needs
> O1/O2 set up + the general argument + the worked incarnation of §O5). It is the
> fast first-look signal and the *preliminary* carrier read (session 17 §5.1).

**Question.** Is the higher-order material design `D_r := |⟦G_r⟧|_{B_aspirin}` (the
incarnation of the robustness route) `⊑`-incomparable to `D_{t₁}` and `D_{t₂}`,
*once the doubled `t₁` makes contraction live*?

**Observation 1 — the head actions differ; the contraction sits strictly below
them.** A design for a derivation tree carries the **last-applied rule** (the one
producing the conclusion `aspirin`) as its **root / first positive action**.

- `D_{t₁}`: root action = `t₁` (ramification = `t₁`'s single premise, `muscle_pain`).
- `D_{t₂}`: root action = `t₂` (ramification = `t₂`'s two premises, `muscle_pain ∧ ¬gastric_ulcer`).
- `D_r`: root action = **`r`** (ramification = `r`'s premises: the `!`-scheme slot + `muscle_pain` + `joint_pain`).

The two **copies of `t₁`** inside `D_r` (the contraction) live in the **sub-tree
above the `!`-scheme address opened by `r`** — i.e. *strictly below the root*. The
FQ/Sironi rigidity criterion ("distinct material designs differ on a positive
action", FQ Prop 5.2/5.3/5.9, Sironi Prop 2) fires **at the root**, because the
root *ramifications differ* (`r` opens three premise addresses; `t₁` one; `t₂`
two). Since the repeated action is below the distinguishing root action, **the
repetition cannot absorb the difference** — there is no way to make `D_r`'s root
look like a `t₁`-root or a `t₂`-root by contracting the `t₁` sub-design.

This is precisely the scenario session 17 §2 predicted survives:

> *(O-rigid-survives)* shows the rigidity step survives nonlinearity directly
> (distinct material designs still differ on an action that repetition cannot
> absorb — **plausible if the repeated actions are "below" the distinguishing
> action**).

**Observation 2 — `D_r` is material (minimal) in `B_aspirin`.** `r`'s type
requires **both** witnesses (`muscle_pain` and `joint_pain`); deleting either use
of the scheme breaks the derivation and leaves `B_aspirin`. So no `D′ ⊊ D_r`
stays in `B_aspirin`: `D_r = |D_r|_{B_aspirin}`. (Full O1 materiality check
deferred to §O5.)

**Preliminary verdict: O-rigid-survives (likely).** On this first nonlinear
instance the antichain holds for the same reason it did affinely — distinct
material designs differ at the **root** positive action — and the contraction is
quarantined **below** that root, so it cannot collapse the order. No counterexample
surfaces at the smallest instance. **Subject to confirmation by the general O3
argument (does a difference *always* surface above all repeated actions?) and the
worked incarnation computation in §O5.**

**Preliminary carrier read (session 17 §5.2, non-binding):**
- **A (route):** survives (preliminary).
- **B (proof dependency):** the distinguishing argument is "**root ramifications
  differ**" — a property both BF chronicles/views **and** Terui c-designs carry
  (every design has a root positive action with a ramification). It does **not**
  yet lean on named-variable / β-reduction / λ-toolkit structure. So the
  preliminary B is **lineage-neutral** → leans **hybrid / BF-engine** (session 17
  §5.3 default). *Revisit at O3-general: if the general rigidity proof must track
  *which* copy of a repeated action a difference lives in via the λ-binding
  structure, B shifts toward c-design-flavored.*
- **C (generation):** not yet probed (O4).

---

## O1 — `Gen(B)` / materiality in BT2010 nonlinear designs (DONE)

**Goal (session 17 §4, O1).** Port Sironi Def 9 (incarnation as `⋂` of
sub-designs in `B`) into BT2010's nonlinear designs and confirm BT2010 carries the
order `⊑` the intersection needs. Expected easy — "BT2010 has the order + `⊑`."

### O1.1 The order `⊑` survives nonlinearity verbatim

The two sources state the **same** incarnation-as-intersection, the linear/affine
one and the nonlinear one, and the second is **not** linearity-qualified:

> **Definition 9** (incarnation, Sironi 2014, affine). *`|D|_G = ⋂{D′ | D′ ⊑ D, D′ ∈ G}`; `D` is material in `G` when it is equal to its incarnation.*
>
> **Definition 4.7** (incarnation, Terui 2011, the **nonlinear** c-design lineage). *Let `T` be a behaviour and `U` an l-design in it. The incarnation of `U` in `T` is `|U|_T = ⋂{U′ : U′ ⊑ ⟦U⟧, U′ ∈ T}`. An l-design `U` is **material** in `T` if `U = |U|_T`. `U` is **pure** in `T` if it is material in `T` and furthermore `✠`-free.*

Terui Def 4.7 is **already the nonlinear setting** (c-designs "may not be linear …
variables are introduced in the model"; Q-034 review §(e)). So the incarnation `⋂`
is **not** a thing we must re-port from affine to nonlinear — it is *defined in the
nonlinear lineage to begin with*. The only thing O1 must check is that the
**order `⊑`** and the **intersection `⋂`** are well-defined when contraction is
admissible, i.e. that BT2010's nonlinearity (Ex 2.14: "exponentials … already
incorporated into the connectives"; Thm 2.15(3): duplicability) does not break
the meet.

### O1.2 Why the meet is well-defined under contraction

`|U|_T = ⋂{U′ ⊑ ⟦U⟧ : U′ ∈ T}` is only meaningful if (a) `⊑` is a partial order
on designs, and (b) the family `{U′ ∈ T : U′ ⊑ ⟦U⟧}` has a greatest lower bound
**that lands back in `T`**. Both hold in the c-design lineage independently of
linearity:

- **(a) `⊑` is structural.** `U ⊑ U′` is the approximation/sub-design order on the
  design **tree** (`Ω`-rooted prefix order: `U` is obtained from `U′` by pruning
  positive sub-actions to `Ω`). It is defined on the *syntax of designs*, which
  has nothing to do with how many times a name is consumed. Contraction changes
  *which* designs are well-formed (a name may head more than one action), but the
  prefix order on whatever designs exist is unchanged.
- **(b) The meet lands in `T` by stability.** Normalization in the c-design
  lineage is **stable** — `⟦·⟧` is a stable (meet-preserving on compatible
  families) map:

  > **Corollary 3.22** (stability, Terui 2011). *Normalization is stable.*

  Stability is exactly the property that makes `⋂{U′ ∈ T : U′ ⊑ ⟦U⟧}` itself a
  member of `T` (the glb of designs interaction-equivalent-below `U` is again
  interaction-equivalent and so in the behaviour `T = T^⊥⊥`). **Stability is
  proved in the nonlinear setting** (it is the engine of Terui's whole
  normalization theory, which is Turing-complete / universally nondeterministic),
  so contraction does not cost us the meet. This is the precise sense in which O1
  is "easy": the well-definedness of `|U|_T` rides on stability, and stability is
  already a nonlinear theorem.

### O1.3 Definition (the BT2010-side `Gen(B)`)

Fix a behaviour `B = B^⊥⊥` (here the `!`-bearing `B_aspirin` of O0). Define, porting
Sironi Def 9 / Terui Def 4.7:

- **Incarnation of `B`:** `|B| := {|D|_B : D ∈ B}` — the set of **material** designs
  of `B` (`D` material ⟺ `D = |D|_B`), equivalently the `⊑`-minimal generators.
- **The generating set:** `Gen(B) := { D ∈ |B| : D is ✠-free }` — the **pure**
  designs of `B` (material **and** `✠`-free, Terui's "pure"). These are the
  `!`-layer analogue of T002's `Inc(B) = {D ∈ B : ∄ D′ ∈ B, D′ ⊊ D}`.

**Canonicity (T002 (1)) ports for free.** `|B|` and hence `Gen(B)` are defined
**from `B` alone** — the intersection `⋂{D′ ∈ B : D′ ⊑ D}` mentions only `B` and
the structural order, no presentation/derivation choice. So `Gen(B)` is determined
by `B`, discharging obligation (1) of session 17 §1 ("Gen(B) is determined by `B`
alone — the analogue of T002's `Inc(B)`"). The canonicity half of the port carries
over **unchanged**, exactly as the scoping note predicted ("Canonicity (1) and
generation (3) are expected to port cleanly … incarnation-as-intersection … is not
linearity-specific").

✅ **O1 done.** The incarnation `⋂` is native to the nonlinear lineage (Terui Def
4.7); its well-definedness under contraction rides on stability (Cor 3.22); and
`Gen(B)` (= pure designs of `B`) is canonical by construction. *The one thing O1
does **not** deliver is that distinct elements of `Gen(B)` are incomparable — that
is the antichain/rigidity content, which is precisely O3.*

## O2 — port Sironi Def 11 (principal set) to the nonlinear setting (DONE)

**Goal (session 17 §4, O2).** State Sironi's principal-set condition
`|E^⊥⊥| = E^✠` verbatim in the BT2010 vocabulary; `Gen(B)` is the candidate
principal set. Expected easy — definitional.

### O2.1 The definition, verbatim, then ported

> **Definition 11** (principal set, Sironi 2014). *A set `E` of designs is
> **principal** when its elements are `✠`-free and its `✠`-shortening is the
> incarnation of its biorthogonal, i.e., `|E^⊥⊥| = E^✠`.*

Two pieces of vocabulary, both lineage-neutral:

- **`E^⊥⊥`** — the biorthogonal closure of `E`, i.e. the **behaviour generated by
  `E`**. Orthogonality `⊥` is interaction-to-`✠` (`D ⊥ D′` iff `⟦D | D′⟧ = ✠`),
  which is defined in the c-design lineage identically (it is how behaviours are
  defined there: `T = T^⊥⊥`).
- **`E^✠`** — the **`✠`-shortening** of `E`: the set of designs obtained from
  elements of `E` by stopping each maximal play at its first daimon (replacing the
  positive continuation past a `✠` with `✠`). `✠`-shortening is a structural
  pruning on the design tree, again independent of linearity.

**Ported statement (BT2010 vocabulary).** A set `E` of c-designs is **principal**
when (i) every `D ∈ E` is `✠`-free, and (ii) `|E^⊥⊥| = E^✠`, where `|·|` is the
incarnation of O1 (Terui Def 4.7) and `E^⊥⊥` the behaviour generated by `E` under
c-design orthogonality. **The statement is identical** — Def 11 mentions only `✠`,
`⊑` (inside `|·|`), `⊥`, and `✠`-shortening, none of which is linearity-specific.
The port of the *definition* is therefore verbatim; all the content is in whether
`Gen(B)` *satisfies* it (O3 + O4).

### O2.2 What principality decomposes into — and where the crux hides

`Gen(B)` is the candidate principal set for `B`. Reading `|E^⊥⊥| = E^✠` with
`E = Gen(B)` factors the port's three obligations cleanly:

| Sironi Def 11 clause | reads as | obligation |
|---|---|---|
| elements of `E` are `✠`-free | `Gen(B)` is pure (built in, O1.3) | (1) canonicity — **O1 ✅** |
| `E^⊥⊥ = B` (the behaviour is recovered) | generation: `B = Gen(B)^⊥⊥` | (3) generation — **O4** |
| `\|E^⊥⊥\| = E^✠` (incarnation of the generated behaviour = `✠`-shortening of `E`) | the material designs of `B` are **exactly** the `✠`-completions of `Gen(B)` — *no more* (no spurious material design) and *no fewer* (no generator collapses) | binds (1)+(3); the **"no two generators collapse" direction is the antichain** — **O3** |

**Crucial observation for the crux.** Sironi's principal-set equation `|E^⊥⊥| = E^✠`
**bundles** the antichain into the *injectivity* of `✠`-shortening on `E`: if two
distinct `✠`-free generators `D₁ ≠ D₂ ∈ Gen(B)` had the **same** `✠`-shortening, or
became `⊑`-comparable so that one's incarnation absorbed the other, then `E^✠`
would be **strictly smaller** than `|E^⊥⊥|` (a material design of `B` with no
generator, or two generators counted once) and principality would **fail**. So:

> **Principality (Def 11) holds for `Gen(B)` ⟺ generation (O4) holds *and* distinct
> generators stay distinct/incomparable after `✠`-shortening under contraction
> (O3).** The principal-set equation is exactly the packaging that turns "is
> `Gen(B)` an antichain?" into a single closed equation — and it localizes the
> linearity risk to the same place session 17 §2 named: **whether contraction lets
> two material designs collapse**.

This is the precise sense in which O2 is "definitional but load-bearing": porting
the *definition* is free, but the definition's **equation cannot be checked without
O3** (the `✠`-shortening-injective / antichain direction) and **O4** (generation).

✅ **O2 done.** Sironi Def 11 ports verbatim; `Gen(B)` is the candidate principal
set; principality `|Gen(B)^⊥⊥| = Gen(B)^✠` decomposes into O1 (✅ canonicity), O4
(generation), and — the one nonlinear-risky direction — O3 (the antichain, now seen
as `✠`-shortening injectivity surviving contraction).

## O3 (general) — rigidity under contraction, THE CRUX (DONE — verdict: O-rigid-survives)

**Goal (session 17 §4, O3; the one hard joint, §2).** Re-prove that distinct
material designs of a `!`-bearing behaviour are `⊑`-incomparable — i.e. `Gen(B)`
is an antichain — *with contraction live*, or classify the failure
(O-rigid-quotient / O-rigid-fails).

> **Verdict: O-rigid-survives.** The antichain holds in the nonlinear setting, and
> it holds for a reason **intrinsic to materiality**, not borrowed from linearity:
> *minimality forces every surviving repetition to be load-bearing*, which is the
> exact property the affine "each name used once" was standing in for. Status:
> **provisional (pending cross-check)** per programme discipline — a paper proof,
> corroborated on the O0 instance (§O5), not yet independently signed off.

### O3.1 Exactly where the affine proof used linearity

The statement to port (T002 Part 1 + the FQ/Sironi generator-distinctness it rides on):

> **Sironi Prop 2 / Lemma 5 (affine).** Distinct canonical terms of a behaviour
> differ on a **positive action**; hence the corresponding material designs are
> `⊑`-incomparable.
> **FQ Prop 5.2/5.3/5.9 (affine).** The minimality argument for uniqueness of
> incarnation.

The **linearity** enters at exactly one inference (session 17 §2; Q-030 Phase-1
audit B3): *"a difference at one positive action cannot be **absorbed** elsewhere,
because each name/locus is consumed exactly once."* In the affine fragment a locus
carries at most one action, so if `D₁` and `D₂` differ at locus `ξ`, that
difference is **permanent** — there is no second occurrence of `ξ` that could
"make up for" it. Under BT2010 contraction (Ex 2.14 — exponentials "already
incorporated into the connectives"; Thm 2.15(3) — duplicability) a name **may head
several actions**, so a difference at one occurrence of `ξ` could a priori be
compensated at another occurrence, and the affine inference is **not directly
available**. That, and only that, is the gap.

### O3.2 The replacement principle: materiality ⟹ every repetition is load-bearing

**Lemma (load-bearing repetition).** *Let `B` be a behaviour and `D ∈ Gen(B)` a
material (`= |D|_B`), `✠`-free design. Then every positive action occurrence in `D`
is **load-bearing**: pruning it (replacing its sub-design by `Ω`) yields a design
**not** in `B`.*

*Proof.* Suppose some occurrence `a` of an action in `D` is **not** load-bearing —
i.e. the pruned design `D∖a` (replace the sub-design rooted at `a` by `Ω`) is still
in `B`. Then `D∖a ⊑ D`, `D∖a ≠ D`, and `D∖a ∈ B`, so `D∖a ⊊ D` with `D∖a ∈ B`,
contradicting minimality of `D` (`D = |D|_B` means `D` is the `⊑`-least design of
`B` interaction-equivalent to it; a strictly smaller member of `B` below it is
impossible). ∎

This Lemma is the crux move. It says: **the very property that makes `D` a
generator (minimality/materiality) already rules out redundant repetition.** A
material design *cannot* carry a repeated action that contraction could "absorb,"
because an absorbable repetition is by definition a prunable one, and a prunable
action that stays in `B` contradicts minimality. The affine proof needed "each name
once" to guarantee no absorption; the nonlinear proof gets the *same guarantee*
from minimality itself — repetition is allowed, but only **essential** repetition
survives into a material design. **The guarantee was never really about linearity;
it was about minimality, which linearity happened to imply trivially.**

### O3.3 Rootedness of `⊑` (the first separating mechanism)

**Fact (rooted order).** `D ⊑ D′` holds only if `D` and `D′` have the **same root
positive action** (with the same ramification at the root). Reason: `⊑` is the
approximation order generated by `Ω ⊑ (anything)` propagated through the tree;
pruning replaces a *sub-design* by `Ω` but can never **rewrite the root** (the root
of `Ω` is `Ω`, which is `⊑` everything, but a *non-`Ω`* design's root action is
fixed under `⊑`). So two designs whose root actions differ are automatically
`⊑`-incomparable. This Fact is lineage-neutral (it holds of chronicle-forests and
of c-design trees identically) and **does not use linearity**.

Rootedness alone discharges the antichain whenever the generators have **distinct
last-rules** — which is the typical case, and the entire O0 instance (`t₁` vs `t₂`
vs `r` roots; §O5). Crucially, in the O0 instance the contraction inside `D_r`
lives **strictly above** the root `r`, so rootedness separates `D_r` from `D_{t₁}`,
`D_{t₂}` *before contraction is ever consulted* — the repeated `t₁` cannot reach
down to the root to forge comparability.

### O3.4 The general antichain theorem (same-root case included)

**Proposition (nonlinear antichain).** *Let `B = B^⊥⊥` be any behaviour (linear or
`!`-bearing). Distinct elements of `Gen(B)` are `⊑`-incomparable.*

*Proof.* Let `D₁ ≠ D₂ ∈ Gen(B)`; suppose for contradiction `D₁ ⊑ D₂`. Both are
material, so both are `⊑`-minimal in `B` (O1.3). `D₁ ⊑ D₂` with `D₁ ∈ B` and
`D₁ ≠ D₂` gives `D₁ ⊊ D₂` with `D₁ ∈ B`, contradicting minimality of `D₂`. Hence
`D₁ ⋢ D₂`, and symmetrically `D₂ ⋢ D₁`: incomparable. ∎

This is **T002 Part 1 verbatim** — purely order-theoretic, "requires no
Ludics-specific machinery" (T002 §Cross-check; the Agda `Order.Behaviour.antichain`
discharges it "from antisymmetry alone"). It holds in *any* poset for its minimal
elements and is therefore **completely indifferent to contraction**. So the
antichain among material designs is *not where the difficulty was* — the difficulty
was hidden in the **hypothesis** that the elements of `Gen(B)` are genuinely
distinct *and* genuinely material under contraction, i.e. that the generator map
does not silently collapse. That is what §O3.2 (the Lemma) and §O3.5 (uniqueness)
secure.

### O3.5 Uniqueness of incarnation under contraction (the FQ-2013 dependency)

T002 Part 2 (cone decomposition) and the well-definedness of "the material
representative" ride on **uniqueness of incarnation** (FQ 2013), the one Ludics-
specific input. Its nonlinear replacement is **stability** (O1.2):

> **Corollary 3.22** (stability, Terui 2011, nonlinear). *Normalization is stable.*

Stability gives that the family `{D′ ∈ B : D′ ⊑ D}` is **directed downward with a
greatest lower bound in `B`** (the meet of compatible designs-in-`B` interaction-
equivalent below `D` is again in `B`), so `|D|_B = ⋂{D′ ∈ B : D′ ⊑ D}` is a
*unique* member of `B` — incarnation is single-valued. This is precisely the FQ-2013
content, re-proved (not assumed) in the nonlinear lineage, so the cone
decomposition and "each design has a unique generator" survive contraction. The
generator map `D ↦ |D|_B` is therefore well-defined and, by §O3.2, does not merge
distinct essential routes.

### O3.6 Why distinct *generators* stay distinct (closing the Sironi-Prop-2 gap)

Combine the pieces into the nonlinear analogue of "distinct canonical terms differ
on a positive action":

1. Two distinct canonical generators (e.g. two distinct derivation routes to
   `aspirin`) yield material designs `D₁ ≠ D₂` that differ at some positive action
   occurrence `a` (they encode different proofs).
2. By the **Lemma (O3.2)**, `a` is **load-bearing** in whichever design contains the
   distinguishing content — pruning it exits `B`.
3. A load-bearing distinguishing action **cannot be absorbed by contraction**:
   absorption would mean the difference is recoverable by a *second occurrence*,
   i.e. the first occurrence is prunable-while-staying-in-`B` — contradicting
   load-bearingness from (2).
4. Hence the difference at `a` is **permanent**, exactly as in the affine case — but
   now justified by minimality (O3.2), not by "each name once." So `D₁`, `D₂` are
   `⊑`-incomparable (also re-derivable directly from O3.4).

This is the affine argument with its **one linear step swapped for the Lemma**. The
swap is sound because the Lemma is a theorem about materiality, and materiality is
defined identically in both fragments.

### O3.7 Verdict and honest scope

**A = O-rigid-survives.** `Gen(B)` is a `⊑`-antichain in the nonlinear setting;
distinct material designs stay distinct and incomparable; incarnation is unique
(stability). The principal-set equation `|Gen(B)^⊥⊥| = Gen(B)^✠` (O2) has its
antichain/`✠`-shortening-injective direction discharged — modulo generation (O4).

**The survival is *not* a coincidence of the instance.** The proof is general: it
turns on (i) rootedness of `⊑`, (ii) the order-theoretic minimal-antichain fact, and
(iii) the load-bearing-repetition Lemma — none of which references the number of
times a name *may* be used, only the number of times it *is* used in a **minimal**
design. Contraction is admitted in full; it simply cannot manifest in a material
generator except load-bearingly.

**Honest residual obligations (for the cross-check, not blockers):**
- The Lemma's "prune occurrence `a` ⟹ `D∖a ∉ B`" step uses that pruning a
  *single* occurrence is a legitimate `⊑`-decrement. In a `!`-box presentation where
  duplicated copies share structure, "prune one copy" must be the genuine
  sub-design operation, not a shared-node deletion that removes both. This is a
  presentation-fidelity check (BT2010 c-designs: copies are delocated, so distinct
  occupiable positions — the check passes; flagged for the signoff).
- Uniqueness-of-incarnation via stability (O3.5) is the nonlinear *re-proof* of
  FQ-2013; T002 kept FQ-2013 as an explicit hypothesis (the Agda `Incarnation`
  record). The cross-check should confirm Cor 3.22 discharges that hypothesis rather
  than re-importing it — i.e. that stability really gives the meet-in-`B`, with no
  hidden linear side-condition.

### O3.8 Carrier-evidence readout (Input 1, from O3)

- **A — route fired:** **O-rigid-survives** (clean).
- **B — proof dependency (the discriminator):** **lineage-neutral.** The three
  load-bearing moves are (i) rootedness of `⊑`, (ii) minimal-elements-form-an-
  antichain, (iii) materiality ⟹ load-bearing repetition. All three are stated in
  the vocabulary of the **incarnation order + behaviour membership**, which BF
  chronicle-forests and Terui c-designs carry *identically*. The argument **does
  not essentially use** named variables, β-reduction, or the λ-toolkit — it never
  needs to point at *which* λ-binder a repeated action belongs to, only that the
  occurrence is prunable-or-not. (The λ-term picture is convenient for *exposition*
  — "the scheme `p` is used twice" — but the *proof* runs on prunability, an
  interaction-theoretic property BF expresses.) → **leans hybrid / BF-engine**
  (session 17 §5.3: `B = neutral` ⇒ no full Terui retarget; the default holds).
- **C — generation:** deferred to O4.

This **upgrades** the preliminary read (which already guessed survives/neutral) to
the binding O3 signal: the binding carrier readout will fire **hybrid** unless O4
turns out to lean hard on one lineage's machinery (not expected) and the runtime
profile (Input 2) comes back runtime-hot.

## O4 — generation (DONE)

**Goal (session 17 §4, O4).** Re-prove generation: recover `B` from `Gen(B)` via
biorthogonal closure / `𝒫_fin`, now in the nonlinear (`!`-bearing) setting.

### O4.1 Statement

For any behaviour `B`, with `Gen(B)` as fixed in O1:

1. `B = Gen(B)^⊥⊥` (behaviour recovery from generators).
2. Equivalently, if `C_G := {D ∈ B : |D|_B = G}` for `G ∈ Gen(B)`, then
  $$B = \bigsqcup_{G \in Gen(B)} C_G$$
  with disjointness of the family `{C_G}` by uniqueness of incarnation.

This is the exact nonlinear analogue of T002 Part 2 (cone decomposition).

### O4.2 Proof (lineage-neutral decomposition)

Fix `B = B^⊥⊥`.

1. **Each design has a unique generator in `Gen(B)`.**
  For `D ∈ B`, set `G_D := |D|_B`. By O1/O3, `G_D` is material and `✠`-free,
  hence `G_D ∈ Gen(B)`, and incarnation uniqueness (O3.5; stability) makes `G_D`
  unique.

2. **Cone partition.**
  Define `C_G := {D ∈ B : |D|_B = G}` for each `G ∈ Gen(B)`.
  Then every `D ∈ B` lies in exactly one `C_G` (existence from step 1;
  uniqueness from unique incarnation). Therefore
  $$B = \bigsqcup_{G \in Gen(B)} C_G.$$

3. **From partition to generated behaviour.**
  Since `Gen(B) ⊆ B` and `B` is a behaviour, minimality of biorthogonal closure
  gives `Gen(B)^⊥⊥ ⊆ B`.

  Conversely, for any `D ∈ B`, step 1 gives `G_D ∈ Gen(B)` with `G_D = |D|_B`.
  So `D` lies in the cone above a generator from `Gen(B)`. The union of these
  generator-indexed cones is exactly `B` (step 2), i.e. no element of `B` sits
  outside the behaviour generated by `Gen(B)`. Hence `B ⊆ Gen(B)^⊥⊥`.

Combining both inclusions: `B = Gen(B)^⊥⊥`. ∎

### O4.3 What changed from affine to nonlinear (and what did not)

Nothing in O4 needs the affine "single-use" property. The generation argument uses
only:

- existence/uniqueness of incarnation,
- materiality as minimality,
- behaviour closure under `⊥⊥`.

In the affine FQ/Sironi route, uniqueness is imported from FQ-2013. In the
nonlinear BT2010 route, the same role is discharged by stability (O3.5). So O4 is
exactly as the scoping forecast predicted: **lineage-neutral once O3 is in place**.

### O4.4 Carrier-evidence update from O4 (Input 1, signal C)

- **C — generation dependency:** **lineage-neutral.** The proof never invokes
  c-design-specific λ machinery (binding/β). It depends on incarnation uniqueness
  and closure/partition structure that BF and BT2010 both carry. This keeps the
  A/B/C readout in the "clean but lineage-neutral" row of session 17's matrix.

✅ **O4 done.** Combined with O3, this discharges the principal-set equation shape
`|Gen(B)^⊥⊥| = Gen(B)^✠` up to the instance-level consolidation in O5.

## O5 — consolidated check on the O0 instance (DONE)

**Goal (session 17 §4, O5).** Compute the O0-instance generator set explicitly,
verify O1–O4 on that instance, and confirm the higher-order generator is
`⊑`-incomparable to the propositional generators with contraction live.

### O5.1 Instance shape (scoping note made explicit)

To keep the intended comparand with Q-027/E2, O5 works in the **scoped behaviour**
`B_aspirin^★` generated by the three target routes:

- the baseline `t₁` route,
- the baseline `t₂` route via `i₂`,
- the higher-order robustness route `r` using `!t₁` twice.

Concretely, use the consolidated antecedent
$$A^★ := muscle\_pain \wedge stomach\_pain \wedge short\_term \wedge anxiety \wedge joint\_pain$$
so that both the Q-027-style `t₂` route and the O0 higher-order route are present.

**Important helper-rule scoping.** The helper `j : joint_pain → muscle_pain` was
introduced to witness the *second* use of the promoted scheme inside `r`. If `j` is
treated as a globally exposed top-level rule, it also yields an additional direct
route `t₁(j(q)) : aspirin`. O5 therefore uses the same discipline as the O0 intent:
`j` is **auxiliary to `r`'s internal second witness** (not a public independent
generator route to `aspirin`). Under that intended scope, the instance has exactly
the three target generators. (If one insists on globally exposing `j`, the check
still goes through with a 4-element generator set; it does not affect O3/O4.)

### O5.2 Explicit generators and their incarnations

In context `(x : A^★, Γ⁺)`, the three generator terms are:

1. `g₁ := t₁(mp(x)) : aspirin`.
2. `g₂ := t₂⟨mp(x), i₂⟨st(x), an(x)⟩⟩ : aspirin`.
3. `g_r := r⟨!t₁, mp(x), jp(x)⟩ \rightsquigarrow corr(t₁(mp(x)), t₁(j(jp(x)))) : aspirin`.

Let
`D_{t₁} := |⟦g₁⟧|_{B_aspirin^★}`,
`D_{t₂} := |⟦g₂⟧|_{B_aspirin^★}`,
`D_r := |⟦g_r⟧|_{B_aspirin^★}`.

Then the worked-instance generator set is
$$Gen(B_{aspirin}^★) = \{D_{t₁}, D_{t₂}, D_r\}.$$

### O5.3 Verification matrix (O1–O4 on the instance)

| obligation | worked-instance check | result |
|---|---|---|
| O1 (materiality / canonicity) | each `D` above is by definition an incarnation of its route term in `B_aspirin^★`; no strict pruning stays in `B_aspirin^★` (for `D_r`, deleting either scheme-use invalidates `r`) | pass |
| O2 (principal-set form) | candidate principal set is exactly the pure generator set `Gen(B_aspirin^★)`; Def 11 equation checked via O3+O4 below | pass |
| O3 (rigidity) | roots are distinct (`t₁`, `t₂`, `r`); contraction in `D_r` is strictly below root `r`; rootedness + material minimality give pairwise incomparability | pass |
| O4 (generation) | every design in `B_aspirin^★` has unique incarnation in `{D_{t₁},D_{t₂},D_r}`; therefore `B_aspirin^★ = Gen(B_aspirin^★)^⊥⊥` and cone partition holds | pass |

### O5.4 Explicit incomparability check requested in the kickoff

The specific O5 question was whether the higher-order generator is
`⊑`-incomparable to `D_{t₁}` / `D_{t₂}` once contraction is live.

- `D_r` vs `D_{t₁}`: incomparable (root `r` vs root `t₁`).
- `D_r` vs `D_{t₂}`: incomparable (root `r` vs root `t₂`).
- The repeated `t₁` actions inside `D_r` do not alter the root and are load-bearing
  (O3.2), so contraction cannot create comparability.

Hence O5 confirms the higher-order generator remains rigid against the baseline
propositional generators.

### O5.5 Consolidated instance verdict

The smallest nonlinear aspirin instance corroborates the general proof path:

- `Gen(B_aspirin^★)` is canonical and finite,
- its elements are pairwise `⊑`-incomparable,
- they generate the whole behaviour by `⊥⊥` closure,
- and the nonlinear generator `D_r` behaves exactly as O3 predicts.

✅ **O5 done.** This satisfies the programme's Phase-2-before-Phase-3 discipline:
the general O3/O4 claims now have a concrete nonlinear worked-instance witness.

## Carrier-evidence readout A/B/C (BINDING — the deferred Q-030 carrier choice)

Per [session 17 §5](../10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md),
the b-BF/b-Terui carrier commit is bound at the **close of O3-general + O4**
(now reached) by a **two-input rubric** read against a **default-asymmetric matrix**
(default = hybrid; a full b-Terui retarget is a single bit that fires **only** on
`A=survives ∧ B=uses-c-design ∧ runtime-hot`).

### Input 1 — port difficulty (from O3 + O4)

- **A — which O3 route fired:** **O-rigid-survives** (clean; O3.7). No quotient, no
  counterexample.
- **B — proof dependency (the real discriminator):** **lineage-neutral** (O3.8).
  The three load-bearing moves — rootedness of `⊑`, minimal-elements-antichain, and
  the load-bearing-repetition Lemma — are stated in incarnation-order + behaviour-
  membership vocabulary that **BF chronicle-forests and Terui c-designs carry
  identically**. The proof runs on *prunability*, never on named-variable / β /
  λ-toolkit structure; the λ-term picture is expository only. **B ≠ uses-c-design.**
- **C — generation dependency (from O4):** **lineage-neutral** (O4.4). `𝒫_fin` /
  biorthogonal recovery leans on incarnation uniqueness (stability) and closure,
  not on one lineage's machinery.

### Input 2 — runtime profile (the Q-030 sub-decision)

The runtime-hot vs proof-level question (is the Ludics→Ambler bridge frequently
projecting designs→Ambler derivations at runtime, or mainly justificatory?) is the
other half of the rubric. It is **not resolved here** (default assumption:
**proof-level**, per the Q-030 sub-decision). **But for this readout it does not
matter:** the full-Terui cell requires `B = uses-c-design`, and **B came back
neutral**, so the top-left cell cannot fire on *either* runtime profile.

### Binding verdict — stay hybrid

Reading Input 1 into the [session 17 §5.3](../10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md)
matrix: `A = survives`, `B = neutral` lands in the **"clean but lineage-neutral"**
row, whose **both** cells (runtime-hot and proof-level) are **hybrid**. Therefore:

> **Carrier decision: keep the "BF-engine + BT2010-proof" hybrid.** The locative BF
> engine (`stepCore` act-lists, the existing FQ visitable-path tooling, the Agda
> mechanisation, the closed MALL bridge) is **retained**; the `!`-layer antichain is
> **proved in the BT2010 companion lineage** (this audit → [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md)).
> No engine rewrite, no Agda re-mechanisation, no Pavaux path-characterization
> dependency is incurred. The hybrid is the *automatic landing spot of doing the
> port at all* (prove in BT2010, run on BF), and the lineage-neutral proof means a
> later retarget loses nothing it could have kept.

**One-bit summary:** *retarget to Terui? — **no**.* The only signal that could ever
flip this (a `B = uses-c-design` finding **and** a runtime-hot profile) did not
occur — `B` is neutral, which closes the question independently of the runtime
profile. If a runtime-hot use case later materializes, the decision is reversible
(retarget is a strategy↔λ-term shim away on the proof side, since the proof is
lineage-neutral), so nothing is foreclosed.

---

## Source review (2026-06-19) — primary-source reading for the D1 repair

**Purpose.** The D1 cross-check forbade closing Q-032 by *citing* a digested
summary. This section reads the load-bearing statements **verbatim from the
primary-source PDFs** (`RESEARCH_PROGRAMME/papers/`, extracted to text via pypdf;
line numbers below are into those extractions). It (a) **confirms D1 from the
sources**, and (b) records the **citable foundation that replaces** the linear
⋂-incarnation target. *This is the input to the repair (round 2); the repair
itself is not yet written.*

### SR.1 D1 confirmed verbatim — Terui's incarnation theory is linear

> **Terui 2011, Definition 4.1.** "An **l-design** `T` is a total, **linear**,
> identity-free c-design such that `fv(T)` is finite." (Terui txt L1214)

> **Terui 2011, Corollary 3.22 (Stability).** "Let `{Tᵢ}_{i∈Λ}` be a family of
> **linear** c-designs. If `{Tᵢ}` are pairwise compatible, then `[[⋂ …]] = …`."
> (Terui txt L1165)

> **Terui 2011, Definition 4.7 (incarnation).** "Let `T` be a behaviour and `U` an
> **l-design** in it. The incarnation of `U` in `T` is … the least portion of `U`
> required for interacting with the anti-l-designs in `T⊥` … `U` is material in `T`
> if `U = |U|_T`. `U` is pure in `T` if material and `z`-free." (Terui txt L1280-85)

The entire incarnation / material / pure / stability apparatus (Def 4.1, 4.7; Cor
3.22) is stated over **l-designs, which are *linear* by definition.** T012's O1.1
claim "Terui Def 4.7 is *already the nonlinear setting*" is therefore **false at
the source**, and O3.5's appeal to Cor 3.22 at the `!`-layer imports a
linearity-restricted theorem. **D1 is vindicated by the primary text, not merely
asserted.**

### SR.2 BF/BT2010 deliberately drop the ⋂-incarnation — and supply a *different* canonicity

> **BF 2011, Definition 11.5 (Materiality).** "the material part of `D` in `G` …
> `|D|_G := ⋃ { D[E] : E ∈ G⊥ }`. A strategy `D ∈ G` is material in `G` if
> `D = |D|_G`." (BF txt L2386-92)

BF materiality is a **union of *visited* parts** (`⋃`), the opposite construction
to Terui/FQ/Sironi incarnation (`⋂` of sub-designs). It is **not** a
minimal-generator / least-element notion, and BF prove **no** antichain/minimality
theorem. So the FQ-style antichain has **no `⋃`-materiality analogue** to port.

What BF/BT2010 *do* prove is canonicity through **completeness**, on a
**deterministic, ✠-free** proof fragment:

> **BF 2011, Definition 11.11 (Winning strategy).** "A strategy `D ∈ ⊢ Γ` is
> **winning** if it is **finite, deterministic, daimon-free and material** in
> `⊢ Γ`." (BF txt L2434-38)

> **BT2010, Definition 3.2 (Proofs, Models).** "A **proof** is a standard design …
> in which all the conjunctions are unary. In other words, a proof is a **total,
> deterministic and ✠-free design without cuts and identities.**" (BT2010 txt L954)

> **BT2010, Theorem 3.8 (Completeness for proofs).** "A sequent `D ⊢ Λ` is
> derivable in the proof system **if and only if** `D ⊨ Λ`. In particular, for any
> positive logical behaviour `P` and a **proof** `P`, `P ⊢ x₀ : P` is derivable iff
> `P ∈ P`." (BT2010 txt L1110-13)

> **BF 2011, Theorem 11.17 (Full Completeness).** "Let `⊢ Γ` be the interpretation
> of a sequent `⊢ Γ` of MELLS and let `D ∈ ⊢ Γ`. **If `D` is winning, then `D` is
> the interpretation of a cut-free derivation `π`** of the sequent `⊢ Γ`." (BF txt
> L2559-62)

So **winning/proof designs of a behaviour ↔ cut-free MELLS derivations** is a
*proved* correspondence (BT2010 Thm 3.8 / BF Thm 11.17), with the proof design
*being* the proof-term. This is canonicity from **completeness**, not from
minimality/stability — and it lands the bridge bijection directly:
`proof-designs(B) ↔ derivations ↔ Ambler λ-terms` is exactly
[C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′∧b₂′, in the same
constant-only/ground-atom scope [Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033)
already accepts.

### SR.3 Individuation "up to materiality"; finiteness is free

> **BT2010, fn 3.** "two designs `D` and `E` are **equal up to materiality** in a
> behaviour `G` if they only differ in occurrences of positive subdesign which are
> **irrelevant for the normalization against designs of `G⊥`**." (BT2010 txt L942)

> **BF 2011, Remark 11.12.** "recent work by Basaldella and Terui [= BT2010] shows
> … **any material, deterministic and daimon-free strategy in a behaviour which is
> the interpretation of a logical formula is finite.**" (BF txt L2444-48; cf.
> BT2010 "proofs are always finite", txt L36)

The canonical generator is thus the **material proof design** (the fully-visited
representative of its materiality-class), and finiteness comes for free on the
logical fragment — no separate well-foundedness argument is required.

### SR.4 S1 is materially weakened — the separation counterexample is ✠-terminated

> **BT2010, Remark 2.4.** "separation does not hold, even when `D` and `E` are
> deterministic (atomic) designs. For instance … `P := x₀|↓⟨↑(y).✠⟩`,
> `Q := x₀|↓⟨↑(y).P⟩` … We therefore conclude `{P}⊥ = {Q}⊥`, even though
> `P ≠ Q`." (BT2010 txt L608-625)

Both witnessing designs **end in `✠`**, so **neither is a *proof*** (Def 3.2
requires `✠`-free). The cited separation counterexample therefore **does not apply
to the `✠`-free proof fragment** where the Ambler `!`-image lives. This does **not**
auto-discharge S1, but it **removes the headline obstruction**: faithfulness
reduces to injectivity of the proof-design↔derivation correspondence on the
`✠`-free fragment (near-definitional, since proof designs *are* proof-terms),
stated against materiality-equivalence (SR.3). **S1 stays open but is now a
positive injectivity obligation, not a standing counterexample.**

### SR.5 What this means for the repair (round-2 plan, not yet executed)

- **Drop** the FQ ⋂-incarnation antichain as the `!`-layer target — it is
  linear-only (SR.1) and has no `⋃`-materiality analogue (SR.2).
- **Replace** it with: *generators of `B` = proof designs (total, deterministic,
  `✠`-free, cut-free), individuated up to materiality; canonicity = completeness
  for proofs (BT2010 Thm 3.8 / BF Thm 11.17).* This **dissolves D1** (no linear
  stability needed).
- **Restrict** to the deterministic `✠`-free fragment, and show the argument-chain
  `!`-image lands there (it is the `!`-translation of STLC derivations ⇒
  deterministic, `✠`-free, finite by Remark 11.12).
- **S1** becomes the injectivity obligation of SR.4 (track against b₂′).
- T012's surviving abstract pieces (O3.2 load-bearing-repetition Lemma, O3.4
  minimal-antichain) become **secondary** — usable for a minimality statement on
  proof designs up-to-materiality if wanted, but **no longer load-bearing**.

> **Extraction recipe (for reproducibility):** `python3.12` + `pypdf` over
> `RESEARCH_PROGRAMME/papers/*.pdf` → `/tmp/ludics_txt/*.txt` with per-page
> markers. Papers read: BF 2011 (`1104.0504v3`), BT2010 (*On the Meaning of
> Logical Completeness*), Terui 2011 (*Computational Ludics*), Sironi 2014.

---

## Repair (R-track, 2026-06-19) — proof-design canonicity via completeness-for-proofs

**Status: paper argument, provisional (pending an independent re-check of Res-A…D
below).** This is the D1 repair. It **abandons** the linear ⋂-incarnation antichain
(O1–O5, killed by D1) and **rebuilds** the `!`-layer generator object on the
canonicity that BF/BT2010 actually prove nonlinearly — *completeness for proofs* —
restricted to the deterministic `✠`-free proof fragment where the Ambler `!`-image
lives. The construction invokes **no** linear stability, **no** `⋂`-meet, **no**
separation, so the D1 defect cannot recur.

### R0 — setup and the fragment

The Ambler base `𝒞/Γ` is the free simply-typed λ-calculus over `Γ`; the bridge
generators `𝒞_base(A, B^♯)` are the β-normal η-long λ-terms = derivations
([Q-027](q027-thin-cones-2026-05-29.md) §2). Girard's `!`-translation sends an
Ambler derivation to a **MELLS** derivation, interpreted as a design in the
`!`-behaviour `B`. Define the **proof fragment**:

> **(BT2010 Def 3.2)** a *proof* is a **total, deterministic, ✠-free, cut-free**
> design; **(BF Def 11.11)** a *winning* strategy is **finite, deterministic,
> ✠-free, material**.

A **material proof design** is a design that is both (winning) and (a proof) — i.e.
the fully-visited (`D = |D|_B`, BF Def 11.5) total deterministic `✠`-free cut-free
representative.

> **R0 claim (Res-A, Res-B).** The `!`-image of every Ambler derivation is a
> material proof design of a *logical* behaviour: **deterministic** (STLC λ-terms
> are single-valued; the translation uses only unary `⋀`), **✠-free** (a genuine
> derivation never "assumes its conclusion"), **cut-free** (take the normal form),
> **finite** (BF Rmk 11.12 → BT2010), in a **logical behaviour** (BT2010 Def 3.1,
> being the interpretation of a MELLS formula). Flagged as fidelity obligations
> Res-A/Res-B (§Residuals).

### R1 — `Gen!(B)` and canonicity (replaces O1)

Define the `!`-layer generating set

```
Gen!(B) := { material proof designs of B } = { winning designs of B } (BF Def 11.11).
```

**Canonicity.** `Gen!(B)` is determined by `B` alone: the winning conditions
(finite, deterministic, `✠`-free) and materiality `|D|_B = ⋃{D[E] : E ∈ B⊥}` (BF
Def 11.5) mention only `B` and its orthogonal `B⊥`. **No presentation choice, no
stability, no linear meet** — materiality is the `⋃`-of-visited operation, which is
defined for non-uniform/nonlinear strategies in BF §11. This is the canonicity
obligation T002 (1) supplied affinely, now from a nonlinearly-defined object.

### R2 — the bijection (replaces O3 — this is the real engine)

> **Update 2026-06-20 (D-A1 repair).** Cross-check **D-A1** showed the curried-arrow
> `!`-image lands in polarized MELL ⊋ BF's synthetic **MELLS**, so the BF Thm
> 11.16/11.17 (MELLS) citation below is **not licensed** for arrow-typed `B`. The
> design↔derivation leg is therefore **re-targeted to BT2010 c-designs** (route 2):
> in BT2010 a proof *is* a proof-term design (Def 3.2), proof search is **deterministic**
> (§3.1), and soundness + completeness-for-proofs (Thm 3.5/3.8) make
> **design↔derivation a bijection by construction** — arrows native (Ex 2.14), no
> MELLS grammar. See [Res-A §Re-target](q032-res-a-translation-2026-06-19.md#re-target-route-2-2026-06-20--design-leg-via-bt2010-c-designs-d-a1-repair). The R2 statement below stands with **BT2010 Thm 3.5/3.8 + deterministic proof search** as the design leg (BF Thm 11.17 struck); "MELLS derivations" ↦ "BT2010 derivations".

The antichain is **not ported**; it is **superseded** by a stronger, *cited*,
nonlinear theorem — the proof/derivation bijection:

> **(BT2010 Def 3.2 + §3.1)** a proof is a total, deterministic, `✠`-free, cut-free
> *design* = proof-term; bottom-up proof search is deterministic (the design's head
> determines the rule), so **design ↔ derivation is 1–1 by construction**.
> **(BT2010 Thm 3.5, Soundness)** `D ⊢ Λ` derivable ⟹ `D ⊨ Λ`.
> **(BT2010 Thm 3.8, Completeness for proofs)** `D ⊢ Λ` derivable ⟺ `D ⊨ Λ`; a
> proof `P ∈ P` iff `P ⊢ x₀ : P` derivable.

Together, **`Gen!(B) ↔ { cut-free BT2010 derivations concluding B }`**, with the
proof design *being* the proof-term (BT2010 Def 3.2). Composing with the re-pointed
`!`-translation correspondence (Res-A′) `{cut-free BT2010 derivations} ↔ {β-normal
η-long λ-terms} = 𝒞_base(A, B^♯)` gives the bridge map

$$\varphi \;:\; \mathsf{Gen!}(B) \;\xrightarrow{\;\sim\;}\; \mathcal{C}_{\mathrm{base}}(A, B^\sharp),$$

a **bijection**. This delivers **b₁′ (surjection onto generators) and b₂′
(injection) in one stroke** — strictly more than the antichain, which only gave
"no internal redundancy."

### R3 — generation (replaces O4)

`B` is recovered from `Gen!(B)`: by BF Prop 11.8, `|D|_B ⊥ E` for each `E ∈ B⊥` and
`|D|_B ∈ B`, so every inhabitant's material part is a winning design; and by full
completeness the winning designs are exactly the proof content of `B`. So
`B`'s generators-as-proofs are exactly `Gen!(B)`, and the free-JSL bridge target
`𝓕(Gen!(B))` matches Ambler's `𝒫_fin(𝒞/Γ)` (the same alignment T002 (3) gave,
now via the bijection rather than cone decomposition).

### R4 — S1 as a positive injectivity obligation (replaces O3.6's assumption)

S1 (b₂′ faithfulness: distinct λ-terms ↦ distinct generators) is now **stated and
attacked**, not assumed:

1. **The separation counterexample does not bite.** BT2010 Remark 2.4's
   `{P}⊥ = {Q}⊥, P ≠ Q` uses `✠`-terminated `P, Q` ∉ proof fragment (SR.4). So it
   is **not** a counterexample to injectivity on `Gen!(B)`.
2. **Positive injectivity = materiality-uniqueness + translation injectivity.**
   `φ` is injective iff (a) distinct cut-free derivations have distinct proof
   designs **up to materiality**, and (b) each materiality-class has a **unique
   material representative** (so `Gen!(B)`, the material proofs, has no residual
   quotient). (b) follows if `|·|_B` is **idempotent** (`||D|_B|_B = |D|_B`) — a
   closure — which BF Prop 11.8 makes plausible (`|D|_B ∈ B`, same normal forms)
   but which must be **verified** (Res-C). (a) is the `!`-translation injectivity
   (Res-A). Under Res-A + Res-C, **S1 closes positive** on the proof fragment.

So S1 moves from "standing counterexample (separation fails)" to "**two
dischargeable obligations (Res-A, Res-C)**," neither of which is the separation
failure.

### R5 — what happens to O1–O5 and the carrier readout

- **O1, O3.5 (the D1 site):** **deleted** — replaced by R1 (`⋃`-materiality
  canonicity) + R2 (completeness bijection). No linear stability is invoked, so D1
  cannot recur.
- **O3.2 (load-bearing-repetition Lemma), O3.4 (minimal-antichain):** **demoted to
  optional** — they remain correct *as abstract poset facts* and could support a
  secondary "`Gen!(B)` is a `⊑`-antichain up to materiality" corollary, but they
  are **no longer load-bearing**; the bijection R2 carries the result.
- **O0, O5 (the worked aspirin instance):** **retained and re-interpreted** — the
  three generators `D_{t₁}, D_{t₂}, D_r` are now read as **material proof designs**
  in bijection with the three λ-terms `t₁ fst(x)`, `t₂⟨…⟩`, `r⟨!t₁,…⟩`; `D_r`'s
  doubled-`t₁` contraction is just a nonlinear proof design, unremarkable under R2.
- **Carrier readout (hybrid): reinforced, not changed.** Completeness-for-proofs is
  proved in **both** lineages (BF strategies *and* BT2010 c-designs), so the
  repaired argument is **even more clearly lineage-neutral** (`B = neutral`); the
  Q-030 hybrid verdict stands a fortiori.

### Residuals (the re-check targets — replace T012's old residuals 1–2)

> **Disposition update (2026-06-20, post cross-check).** Of the four, **Res-C is
> CLEARED** (D-C1 resolved — BF §11 verified in-repo), **Res-A is re-pointed to
> [Res-A′](q032-res-a-prime-2026-06-20.md)** (BT2010 design leg, drafted; one open
> Leg-1 lemma), **Res-B CONFIRMED**, **Res-D SCOPED-OUT** for the aspirin corpus. Only
> the Res-A′ Leg-1 lemma awaits an independent re-check.

- **Res-A → [Res-A′](q032-res-a-prime-2026-06-20.md) (re-pointed, drafted 2026-06-20).**
  *Superseded MELLS framing:* STLC βη-long λ-terms ↔ cut-free **MELLS** derivations —
  **withdrawn** (cross-check D-A1: image is polarized MELL ⊋ MELLS). *Current:* STLC
  `{→,×,atom}` λ-terms ↔ **BT2010** logical-behaviour proof designs, bijectively, via
  Terui's "designs extend η-long λ-terms" + BT2010 deterministic proof search. One open
  re-check item: the **Leg-1** βη-normal ↔ focalized-cut-free-LLP-derivation lemma.
- **Res-B (logical-behaviour membership) — CONFIRMED (light).** The `!`-image behaviours
  are *logical* (BT2010 Def 3.1): they are built from BT2010 synthetic connectives
  (Ex 2.14) / the App A constant-only LLP embedding, and "the orthogonal of a logical
  behaviour is again logical" (BT2010 Def 3.1), so Thm 3.5/3.8 apply. No obstruction.
- **Res-C (materiality is a closure) — CLEARED (2026-06-20).** `|·|_B` idempotent ⇒
  unique material representative; injectivity (b₂′) reduces to it. Verified from BF
  Prop 11.8 + Def 11.2 + Lemma 11.4 (in-repo PDF); see
  [Res-C audit](q032-res-c-materiality-2026-06-19.md) (D-C1 cleared).
- **Res-D (additives) — SCOPED-OUT for the aspirin corpus.** Every aspirin premise is a
  conjunctive `×` (kept multiplicative, R0), never a genuine disjunctive/case-analysis
  `⊕`; so no additive completeness is invoked on the in-scope family. Flag retained only
  for any future `⊕`-scheme, which would import BT2010 Thm 2.17/3.8 (folklore, per
  [Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033)).

**Net.** The repair replaces a *net-new linear-style minimality theorem* (which D1
showed is unavailable at the `!`-layer) with an *application of cited nonlinear
completeness* (BT2010 Thm 3.5/3.8 + deterministic proof search — the design leg, after
the D-A1 re-target) on a fragment where the separation obstruction provably does not
apply. After the 2026-06-20 cross-checks, the remaining work is **one** fidelity lemma
(the Res-A′ Leg-1 βη↔derivation bijection); Res-C/Res-B/Res-D are cleared/confirmed/
scoped-out, and D-A1 is repaired. On a clean re-check of the Res-A′ Leg-1 lemma, T012
(R-track) → `established` and [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → closed.

---

*Port complete 2026-06-18. O0–O5 + binding carrier readout done; all proof-side
results are **provisional pending independent (non-author) cross-check** per the
programme's status-honesty discipline. Promotes to [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md)
(`provisional`); [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) moves to
partially-resolved; the [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) carrier gate
resolves to **hybrid**. Phase 4 ([Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
→ Q-028b MELL extension) is unblocked.*
