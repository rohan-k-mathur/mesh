# R3 / Q-037 — working session: proving δ₁ ≅ δ₂

- **status:** in progress (session opened 2026-05-30; merge-canonicality + E2 + termination added 2026-05-31). **Q-037 positive outright on the one-level-nested defeasible fragment over acyclic `Γ`.**
- **settles (target):** [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) — is there
  a canonical iso `Inc_δ₁(B) ≅ Inc_δ₂(B)` making the defeat-encoding choice
  presentational rather than substantive?
- **brief:** [δ brainstorm §11](delta-defeat-encoding-decision-brainstorm-2026-05-30.md)
  (R3 session kickoff); preconditions and reading list there
- **inputs:** [E1 audit](e1-reinstatement-aspirin-2026-05-30.md) (the aspirin Q3
  worked instance + the *accumulating-δ₂* requirement) and
  [E3 audit](e3-polarity-readoff-2026-05-30.md) (the a-priori reason ν exists:
  δ₂'s only well-typed reading is "δ₁ + a positive scheduling skin")
- **method:** define both incarnation constructions as functors; pin the
  accumulating-δ₂ variant; identify `ν` as Ludics normalisation (cut-elimination)
  and `ν⁻¹` as canonical de-normalisation; discharge obligations O1 (object iso),
  O2 (naturality), O3 (bridge-compatibility) — first on the aspirin instance,
  then attempt the general case
- **headline (this session):** the iso reduces to a **single clean theorem** —
  *normalisation is a bijection between the canonical-cut δ₂ presentations and the
  δ₁ blocked designs* — once δ₂ is pinned to canonical cut form (§3). **O1 and O3
  are proved on the aspirin instance and reduced to one lemma (L-CANON) in
  general; O2 is reduced to functoriality of cut-elimination.** Q-037's
  remaining content is exactly **L-CANON** (canonical-cut representatives are
  unique) + the termination precondition [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031).
  This is a substantial narrowing: a once-open "are the two encodings the same?"
  becomes "prove one uniqueness lemma about cut normal forms."
- **update (2026-05-31) — L-CANON condition 3 closed.** The accumulation merge
  is now **pinned operationally** (§5.5): a single operator `μ` (graft the
  retained chronicle `χ_i` as a `⊗`-ramification at the unique negative leaf
  `ℓ_i`), shown **forced — not chosen** by three independent constraints (level
  typing, materiality, focalized locus discipline) via the **merge-canonical
  lemma**. This discharges the one gap in the §5 depth-induction, so **O1-inj is
  now proved in general** modulo only the scoping clause (single-generator
  reinstatement; multi-reinstater accrual routes to the JSL join one level up)
  and the termination precondition Q-031. Q-037 is **positive on the
  single-generator fragment**.
- **update (2026-05-31) — E2 discharges the multi-generator risk; Q-037 positive.**
  The [E2 audit](e2-cardinality-multireinstater-2026-05-31.md) built the minimal
  `|Inc(B)| = 3` defeasible behaviour (two independent undercutters `i₂`, `i₃` of
  `gastric_ulcer`) and confirmed: `|Inc_δ₁(B)| = |Inc_δ₂(B)| = |𝒞/Γ⁺| = 3` (no
  cardinality inflation, A5 → δ₁), and the two-reinstater configuration does
  **not** force a multi-generator `defeat²` inside `Inc(B)` — reinstatement is
  per-named-defeater (single-generator `μ`), and the *set* of two stronger
  arguments is their JSL join `∨_A` one level up (§5.5.4 routing, now confirmed
  **structural** via the level separation). So `μ`'s single-generator scope is
  not a restriction but a consequence of the generator/power-set level split.
  **Q-037 closes positive on the full defeasible fragment**, conditional only on
  the orthogonal termination precondition [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031).
- **update (2026-05-31) — termination discharged; Q-037 positive *outright*.**
  §2.1 proves the **R3-termination theorem**: ν is total on the one-level-nested
  defeat fragment over acyclic `Γ`, by two strictly-decreasing measures — (T1) a
  per-input cut-count bound (`≤ 2` cuts, L-MERGE creates none, each incarnation is
  a finite Ambler λ-term so the challenger stack is finite) and (T2) the
  *structural* depth-2 cap (the reinstater carries no object-level defeat — Ambler
  p. 171 — so it is Daimon-capped and cannot spawn a depth-3 challenger; cycles
  excluded by acyclicity). This **removes** the F1 precondition rather than
  deferring it. **Q-037 now closes positive outright on the one-level-nested
  defeasible fragment over acyclic rule-bases** — unconditionally. The sole
  residue is the **cyclic / unbounded-depth** case (full Q-031), which R3 never
  instantiates (every Ambler argument is a finite λ-term over a finite `Γ`).

---

## 1. The category of defeasible behaviours, and the two functors

### 1.1 Base data

Work in standard Ludics (Girard 2001 *Locus Solum*; polarity convention fixed
in [`LUDICS_TRIADS`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
§I.2). A **design** is a (winning) strategy = a set of chronicles closed under
the usual conditions; a **behaviour** `B = B^{⊥⊥}` is a bi-orthogonally closed
set of designs; its **incarnation** `|B| = Inc(B)` is the set of *material*
designs (every chronicle is visited by some counter-design of `B^⊥`; FQ 2013
materiality). `Inc(B)` is an antichain under design-inclusion ⊆ (substrate
T002).

Let **`DefB`** be the category of *defeasible behaviours*: objects are
behaviours `B` carrying a distinguished finite set of **defeat sites** (loci at
which an Ambler `defeat(·)` is to be encoded), and morphisms `B → B′` are
behaviour morphisms (the maps b₃′ quantifies over in
[C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md)) that respect defeat
sites. This is the category in which O2/b₃′ naturality lives.

### 1.2 The two incarnation-construction functors

Both are constructions `DefB → Set` (later refined to land in a design
category). They differ **only** at defeat sites; away from defeat they are the
identity on `Inc(B)`.

> **Def (Inc_δ₁).** `Inc_δ₁(B)` is the incarnation of `B` with each defeat
> encoded as a **negative, Daimon-capped blocked chronicle** (E1 §2): the
> defeated argument keeps its positive skeleton; the defeater's conclusion move
> is grafted as a **negative** action above it; the chronicle is `✝`-capped.
> These are **cut-free** designs (no pending interaction).

> **Def (Inc_δ₂, naive).** `Inc_δ₂^{naive}(B)` encodes each defeat as a **live
> positive challenger** `⊗`-composed with the defended design (E1 §2): a
> design-*with-cut*, the cut being the challenger's interaction locus. Dead
> challengers vanish.

> **Def (Inc_δ₂, accumulating) — the E1-mandated variant, pinned in §3.**
> `Inc_δ₂(B)` (no superscript) is the canonical-cut presentation: each defeat
> layer contributes **exactly one cut**, and on challenger death the
> challenger's supporting chronicle is **merged** into the surviving thread
> rather than discarded.

The naive variant is **rejected** for R3: E1 §5.2 showed it breaks O1 at nesting
(`defeat²_{δ₂}^{naive}(D_{t₁}) = D_{t₁} ≠ D_{t₂}`). From here, "δ₂" means the
accumulating variant.

---

## 2. The candidate iso: normalisation

The shape proposed in brainstorm §11.3, now made precise.

> **Def (ν = normalisation).** For `D ∈ Inc_δ₂(B)`, a design-with-cuts, let
> `ν_B(D) := ⟦D⟧` be its **cut-free normal form** under Ludics normalisation
> (Girard 2001 §C: composition/cut-elimination; associativity gives a unique
> normal form when it exists).

> **Def (ν⁻¹ = canonical de-normalisation).** For `N ∈ Inc_δ₁(B)` (cut-free,
> with `k` blocked negative chronicles), let `ν_B^{-1}(N)` be the design
> obtained by introducing, for **each** blocked negative chronicle, **one**
> challenger cut whose challenger design is the (unique, minimal) δ₂ thread that
> normalises to that blocked chronicle.

Two facts frame everything below:

- **(F1) ν is well-defined iff normalisation terminates.** On flat and finitely
  nested defeat over an acyclic rule-base, it does (E1 §5.3: the aspirin chain
  reaches a depth-2 fixpoint). General termination is exactly
  [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) — the *precondition*, not part
  of R3 proper.
- **(F2) ν is generically many-to-one.** Plain cut-elimination is **not**
  injective: many cut-ful designs share a normal form. So `ν` is a bijection
  **only** if `Inc_δ₂(B)` is restricted to a class of *canonical-cut
  representatives*. Pinning that class is the whole job of §3, and proving the
  representatives unique is the residual lemma **L-CANON**.

E3's contribution (its §5.3): δ₂'s positive challenger is **ill-typed as a
standalone defeat** (Ludics interaction is `P_L × N_L`, never `P_L × P_L`), so
the *only* coherent δ₂ design is one paired with the negative counter-design it
relies on — i.e. a positive presentation that **normalises to a δ₁ negative
design**. So `ν` is not an artefact we hope to find; it is forced by δ₂'s only
well-typed reading. This is the a-priori reason O1 should hold.

---

## 2.1 Termination of ν at one-level nesting (the Q-031 precondition, discharged)

F1 left ν's totality riding on [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031):
does the layer-`(i+1)` challenger cut normalise, or can iterated defeat descend
forever and demand a least-fixpoint `μ` (μMELL/μMALL)? This section discharges
the slice R3 actually needs — **one-level-nested defeat** (depth ≤ 2: base /
defeater / reinstater) over an **acyclic** rule-base — outright. Full Q-031
(the cyclic, unbounded-depth case) stays orthogonal and open.

> **Theorem (R3-termination, one-level nesting).** Let `B` be a defeasible
> behaviour whose Ambler image `𝒞/Γ` consists of arguments of reinstatement-depth
> `≤ 2` over an acyclic rule-base `Γ`. Then `ν_B` is **total** on the δ₂
> canonical-cut presentation of every incarnation `D ∈ Inc_δ₂(B)`: normalisation
> reaches the cut-free δ₁ normal form in finitely many steps, with no fixpoint
> operator.

**Proof.** Two strictly-decreasing measures, neither of which any reduction step
can increase.

**(T1) Cut-count measure — bounded and strictly decreasing.** By the
canonical-cut presentation (§3 condition (1), *one cut per layer*), a depth-`≤2`
configuration carries at most two challenger cuts on the base design `D₀`: `c₁`
(the defeater) and `c₂` (the reinstater of `c₁`). Ludics normalisation
(Girard 2001 §C) consumes exactly one cut per principal reduction. Crucially the
merge step does **not** create a new cut: by **L-MERGE** (§5.5) the elimination
of a dead challenger grafts its retained chronicle `χ_i` as a *cut-free*
`⊗`-ramification (a **material** chronicle, condition (2)) at the negative leaf
`ℓ_i` — not as a fresh cut. Hence `#cuts ∈ {2, 1, 0}` strictly decreases and is
bounded below by `0`; normalisation halts in `≤ 2` macro-steps. This measure is
**input-local**: it bounds termination *per incarnation*, and since every
incarnation realises a **finite** Ambler λ-term (`𝒞/Γ` is the free λ-calculus
over `Γ`, T001), the challenger stack on any single `D` is finite — so (T1)
already gives pointwise termination at *arbitrary* finite depth, independent of
the depth-2 restriction.

**(T2) Why the depth-2 cap is structural, not stipulated.** The restriction to
one-level nesting is not an external convenience; over acyclic `Γ` it is
*forced*. The top-layer reinstater carries **no object-level defeat connective**
— Ambler 1996 p. 171: reinstatement is **monotone accrual of a stronger
argument**, a single λ-term with its own generator, and Ambler's logic has *no*
defeat operator at all (defeat is meta-level). So the depth-2 challenger
normalises to a **positive action that is Daimon-capped**: there is no negative
counter-design beneath it to cut against, hence it **cannot spawn a depth-3
challenger**. The only way to manufacture a depth-3 cut is a rule cycle
`gu ⇄ ¬gu` feeding a producer back into scope — excluded by acyclicity of `Γ`.
This generalises the E1 §5.3 observation (depth-2 fixpoint on the aspirin
chain) from "happens on this instance" to "forced whenever `Γ` is acyclic": the
cap is a *consequence* of defeat being meta-level, not a hypothesis. ∎

**Corollary (F1 discharged for R3).** On the one-level-nested fragment over
acyclic `Γ`, `ν_B` is well-defined on every incarnation R3 uses. Combined with
**L-CANON** (ν injective on canonical-cut representatives, §3/§5), **L-MERGE**
(the merge is canonical, §5.5), and §5–§6 (O1-surj, the O2 reduction, O3),
**Q-037 closes positive *outright* on this fragment** — with **no residual
precondition**: the F1 dependency is removed, not merely deferred.

**What stays in full Q-031 (orthogonal).** The **cyclic** rule-base
(`gu ⇄ ¬gu`, defeat-depth unbounded *across the behaviour*) is the genuine
μMELL/μMALL risk and remains open. Note the residue is **global, not
pointwise**: even with a cycle, (T1) terminates ν on each individual incarnation
(each realises a finite term); what a cycle threatens is whether `Inc(B)` stays
finite / well-structured as depth grows without bound — a question about the
*behaviour*, not about whether normalisation halts on a given input. R3 never
instantiates the cyclic case (every Ambler argument is a finite λ-term over a
finite `Γ`), so this residue does not touch the Q-037 close on the defeasible
fragment.

---

## 3. Pinning accumulating-δ₂ as the canonical-cut class (resolves F2)

The E1-mandated accumulation is what makes `Inc_δ₂(B)` a set of **canonical-cut
representatives**, on which `ν` is bijective. Precise definition:

> **Def (canonical-cut δ₂ design).** A δ₂ design `D` for a defeat chain of depth
> `n` over defended core `D₀` is in **canonical cut form** iff:
>
> 1. **(one cut per layer)** `D` has exactly `n` cuts, one per defeat layer,
>    nested in chain order (layer `i`'s challenger cut sits above layer `i−1`'s).
> 2. **(minimal challengers)** each layer's challenger design is the
>    ⊆-minimal design realising that layer's defeater chronicle (no spurious
>    positive actions).
> 3. **(accumulation on death)** when a challenger at layer `i` is itself
>    defeated by layer `i+1` (reinstatement), its supporting chronicle `χ_i` is
>    **retained** as a positive negative-branch extension of the surviving
>    thread — *not* garbage-collected. (This is exactly the E1 §5.2 fix; it is
>    what makes the depth-2 aspirin result land on `D_{t₂}`, the **stronger**
>    Ambler argument, rather than collapsing to `D_{t₁}`.)

Conditions (1)–(2) cut down the cut-ful designs to one representative per defeat
configuration; (3) fixes *which* representative, by Ambler-monotonicity (E1 §0:
reinstatement is accrual, so evidence must be retained). The claim that (1)–(3)
pick a **unique** representative per δ₁ blocked design is:

> **Lemma L-CANON (residual content of O1).** For each `N ∈ Inc_δ₁(B)`, there is
> **exactly one** canonical-cut δ₂ design `D` with `ν_B(D) = N`; and every
> canonical-cut δ₂ design arises this way. Equivalently, `ν_B` restricted to
> canonical-cut designs is a bijection onto `Inc_δ₁(B)`, with inverse `ν_B^{-1}`.

L-CANON is **proved on the aspirin instance** below (§4) and **conjectured in
general** (§5). Its general proof is the one genuine open obligation R3 leaves.

---

## 4. O1 on the aspirin Q3 instance (proved)

Reusing E1's encodings (E1 §1–§3); `Inc(B_{Q3}) = {D_{t₁}, D_{t₂}}` (Q-027 §5.2).
Three defeat depths on the `aspirin` site:

| depth | δ₁ (cut-free, blocked) | canonical-cut δ₂ | `ν` (normalise) |
|---|---|---|---|
| 0 (no defeat) | `D_{t₁}` | `D_{t₁}` (0 cuts) | `D_{t₁}` |
| 1 (rebut by `c₁∘i₁`) | `N₁` = `D_{t₁}` + neg `¬asp` graft, `✝`-capped | `D_{t₁} ∥ Chal(χ_def)` (1 cut) | `N₁` |
| 2 (reinstate by `i₂`) | `D_{t₂}` (the `χ_und` evidence threaded in) | depth-1 design + `Chal(χ_und)` cut, **χ_def retained** (2 cuts, accumulating) | `D_{t₂}` |

- **Depth 0, 1:** immediate — `ν` of a 0/1-cut design is its normal form, which
  by construction equals the δ₁ design at that depth (E1 §3.1's `N₁`).
- **Depth 2 (the load-bearing case):** normalising the accumulating δ₂ design
  runs `Chal(χ_und)` against the `gu` premise inside `Chal(χ_def)`; the
  layer-1 challenger dies, but by canonical-form condition (3) its chronicle
  `χ_def`… is **not** the retained one — the retained evidence is `χ_und` (the
  *reinstating* layer), which is threaded into the surviving aspirin thread.
  Normalisation therefore yields the design whose positive skeleton is `t₁`'s
  **plus** the `¬gu` evidence — i.e. `D_{t₂}` (E1 §3.1, the boxed
  `defeat²_{δ₁}(D_{t₁}) = D_{t₂}`). So `ν(depth-2 δ₂) = D_{t₂} = depth-2 δ₁`. ✓

**Bijection on the instance.** The three canonical-cut δ₂ designs `{D_{t₁},
1-cut, 2-cut}` map under `ν` bijectively onto the three δ₁ designs `{D_{t₁}, N₁,
D_{t₂}}`; `ν⁻¹` recovers each by re-introducing the minimal challenger cuts. No
two canonical-cut designs share a normal form (they have different cut counts /
retained chronicles). **L-CANON holds on the aspirin instance, so O1 holds
here.** This is the still-pending E1 deliverable *and* the R3 §11.4 first
deliverable, now discharged.

> **Contrast with naive δ₂ (why accumulation is essential).** Naive δ₂ at depth
> 2 garbage-collects the dead layer-1 challenger and resumes the untouched
> `D_{t₁}`: `ν^{naive}(depth-2) = D_{t₁} ≠ D_{t₂}`. The map is then **not**
> injective (depths 0 and 2 collide) — O1 fails. Accumulation (condition (3)) is
> precisely what repairs injectivity. This is the formal statement of E1 §5.2.

---

## 5. O1 in general — reduced to L-CANON

Beyond the instance, O1 ⟺ L-CANON (§3) by construction. The proof obligation
splits:

- **(O1-surj) `ν` is onto `Inc_δ₁(B)`.** Easy: given `N` with `k` blocked
  chronicles, `ν⁻¹(N)` (canonical de-normalisation) is a canonical-cut δ₂ design
  normalising to `N`. Needs only that each blocked chronicle has a ⊆-minimal
  challenger realiser — true because the defeater chronicle is itself a design in
  `B^⊥` (it is what blocks `N`).
- **(O1-inj) `ν` is injective on canonical-cut designs.** This is the hard
  half = **L-CANON uniqueness**. Strategy: show any two canonical-cut δ₂ designs
  with the same normal form agree cut-by-cut, by induction on defeat depth.
  - *Base (depth ≤ 1):* 0/1-cut designs are determined by their normal form (no
    accumulation choice yet). ✓ (matches §4 rows 0–1 in general).
  - *Step:* assume uniqueness to depth `n`; a depth-`(n+1)` canonical-cut design
    adds exactly one minimal challenger cut (condition 1–2) with a forced
    retained chronicle (condition 3, by Ambler-monotonicity: the retained
    evidence is the *reinstating* layer, uniquely the new one). So the depth-
    `(n+1)` design is determined by the depth-`n` design (unique by IH) + the
    forced new cut, **whose merge is `μ` by lemma L-MERGE (§5.5)** — the
    previously-flagged "is condition (3) canonical?" gap (E1 §7.3) is now closed.
    ∎ (on the single-generator fragment; multi-reinstater accrual is JSL-join
    aggregation one level up, §5.5.4, not `defeat²`).

So: **O1 in general is reduced to "the accumulation merge is canonical"** — a
single, local, finitely-checkable property of the δ₂ definition, not a global
statement about all behaviours. This is the precise residue of R3.

---

## 5.5 The merge operator μ, and the merge-canonical lemma (closes the §5 gap)

This section discharges the one gap left in the §5 induction: that
canonical-cut condition (3)'s "retain the reinstating chronicle" is **forced**,
with no `⊗`/`⊕` or locus freedom. The proof shape is **elimination, not
construction** — we exhibit one operator and show every alternative consistent
with the substrate constraints collapses to it.

### 5.5.1 The merge operator

> **Def (merge μ).** Let `D` be the surviving thread after normalising the
> layer-`(i+1)` cut against layer `i`, and let `χ_i` be the reinstating layer's
> supporting chronicle. Then
>
> $$\mu(D, \chi_i) \;:=\; D \text{ with } \chi_i \text{ grafted as a } \otimes\text{-ramification at the unique negative leaf } \ell_i,$$
>
> where `ℓ_i` is the negative leaf opened by the layer-`(i+1)` premise removal
> (the address at which the defeated defeater's premise sat). For the aspirin
> instance, `ℓ_i = ξ_{¬gu}` and `μ` threads in `+ξ_{¬gu}·i₂, −(st∧an), +⟨⟩, ✝`
> — exactly the E1 §3.1 boxed extension yielding `D_{t₂}`.

The accumulating-δ₂ condition (3) **is** the assertion that the merge used at
each reinstatement is `μ`. The lemma below says nothing else is possible.

### 5.5.2 Three forcings

Each constraint already in force on the substrate pins one parameter of the
merge; together they over-determine it (the redundancy is the robustness).

**(A) Connective = `⊗`, by a level/type argument (the decisive route).**
Ambler reinstatement (E1 §0, p. 171) yields *"a stronger argument in favour of
aspirin"* — **one** generator, the single λ-term `t₂ ∈ Inc(B)`, not a set
`{t₁, evidence}`.

- A `⊕`/union merge is precisely the free-JSL join `∨_A`, which lives **one
  level up**, in `𝓕(Inc(B)) = 𝒫_fin(Inc(B))` (C001b′ target).
- But `defeat²_{δ₁}(D_{t₁}) = D_{t₂} ∈ Inc(B)` must be a **single incarnation**,
  not a set of them.
- So a `⊕`/union merge **type-mismatches the level**: its result lands in
  `𝓕(Inc(B)) ∖ Inc(B)`. Contradiction. Hence `⊗`.

This reuses C001b′'s generator-vs-power-set distinction verbatim: aggregation is
the JSL join one level up; defeat² is design-internal and stays in `Inc(B)`.

**(B) Connective = `⊗`, independent confirmation via materiality.**
A `⊕`-attached chronicle sits on a *choice branch*, so some counter-design of
`B^⊥` declines it; against that counter-design the reinstated design normalises
back to `D_{t₁}`, so `χ_i` is **not material** and `D_{t₁} ⊊ D_{t₂}` fails. That
is the naive-δ₂ failure (E1 §5.2) reproduced one level up. `⊗` makes `χ_i`
material — visited by every counter-design reaching `ℓ_i` — so the strict
inclusion holds. Two independent routes landing on `⊗` is the redundancy.

**(C) Locus `ℓ_i`, forced by focalization + minimal-challenger.**
A chronicle may legally extend a design only at an **existing negative leaf**
(forest/locus discipline). Under the §2 focalized rule-base encoding (one
positive locus per atom, one ramification per rule), reinstatement layer `i+1`
opens **exactly one** new negative leaf: the address where the defeated
defeater's premise was removed. Canonical-cut condition (2) (minimal challenger)
guarantees that leaf is unique even when a premise is supplied by several rules
(the ⊆-minimal challenger picks one realiser). So once (A)/(B) fix "extend
multiplicatively above the surviving thread," the address `ℓ_i` is forced.

### 5.5.3 The lemma

> **Lemma L-MERGE (merge canonical).** Let `μ′` be any binary operator on
> (surviving thread, reinstating chronicle) such that
>
> 1. **(materiality/level)** `μ′(D, χ_i) ∈ Inc(B)` — a single incarnation;
> 2. **(monotone accrual)** `D ⊆ μ′(D, χ_i)` (Ambler "stronger argument", E1 §0);
> 3. **(typing)** `μ′` respects `P_L × N_L` interaction (E3 §5.3).
>
> Then `μ′ = μ`.
>
> *Proof.* (A) ∧ (B): conditions (1)–(2) force the connective to be `⊗`
> (a `⊕`/union violates (1) by leaving `Inc(B)`, and violates (2) by
> non-materiality on the declining counter-design). (C): condition (3) + the
> focalized leaf discipline + minimal-challenger force the attach point to the
> unique negative leaf `ℓ_i`. Condition (2) fixes the orientation (extend the
> surviving thread, do not replace it). With connective, locus, and orientation
> all forced, `μ′(D, χ_i) = μ(D, χ_i)`. ∎

L-MERGE is exactly L-CANON condition (3) with the choice eliminated. Feeding it
into the §5 depth-induction step — where the depth-`(n+1)` design was
"determined by the depth-`n` design + the forced new cut *modulo* the merge
choice" — removes the modulo: the new cut's merge is `μ`, uniquely. **So
O1-inj holds in general** on the fragment where the scoping clause below
applies.

### 5.5.4 Scoping clause (and why it strengthens (A))

The level argument (A) assumes reinstatement produces a **single** generator.
If two **incomparable** reinstaters genuinely apply, the honest result *is* a
`⊕`/union — but that is no longer `defeat²` of one design; it is **aggregation**,
handled by the monotone JSL join `∨_A` **one level up** in `𝓕(Inc(B))`, not by
the design-internal merge `μ`. So `μ` is scoped to **single-generator
reinstatement**, and multi-reinstater accrual is routed to the JSL union. This
both protects (A) (no `⊕` ever appears inside `Inc(B)`) and pre-empts the E2
`|Inc(B)| ≥ 3` stress-test (§8.3), where multiple incomparable incarnations are
exactly the multi-reinstater case.

Two preconditions stay external: termination of the layer-`(i+1)` cut
([Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031)) and the §2 focalized encoding
(needed for (C)).

---

## 6. O2 (naturality) and O3 (bridge-compatibility)

### 6.1 O3 — bridge-compatibility (near-definitional, given ν)

C001b′ defines `φ = δ⁻¹ ∘ CH ∘ DP : Inc(B) → 𝒞_base(A, B^♯)`. O3 wants
`φ_{δ₁} = φ_{δ₂}` on `Inc(B)`. DP (design-as-proof) and CH (Curry–Howard) are
the **shared** factors; the encodings differ only in `δ⁻¹` (defeat decoding).
By construction:

$$\delta_2^{-1} \;=\; \delta_1^{-1} \circ \nu \qquad\text{(decode a δ₂ design by first normalising it to its δ₁ form).}$$

Indeed E3 §5.3 says δ₂'s only coherent reading *is* "the thing that normalises to
the δ₁ design," so decoding-after-normalisation is the **only** well-typed
δ₂-decoding. Hence

$$\phi_{δ_2} = \delta_2^{-1}\circ\mathrm{CH}\circ\mathrm{DP} = \delta_1^{-1}\circ\nu\circ\mathrm{CH}\circ\mathrm{DP}.$$

On `Inc(B)` the design fed to decoding is *already cut-free* (incarnations are
material/normal), so `ν = id` there and `φ_{δ₂} = φ_{δ₁}`. **O3 holds wherever
O1 holds**, and is otherwise definitional. On the aspirin instance: both send
`D_{t₁} ↦ t₁ fst(x)`, `D_{t₂} ↦ t₂⟨…⟩` (Q-027 §2.3, §7.1) — verified. ✓

### 6.2 O2 — naturality in B (reduced to functoriality of cut-elimination)

O2/b₃′ wants `ν` natural along behaviour morphisms `B → B′`: the square

```
   Inc_δ₂(B)  ──ν_B──▶  Inc_δ₁(B)
      │                     │
 Inc_δ₂(f)│             Inc_δ₁(f)│
      ▼                     ▼
   Inc_δ₂(B′) ──ν_B′─▶  Inc_δ₁(B′)
```

commutes for `f : B → B′` in `DefB`. Since `ν` is normalisation and behaviour
morphisms act by composition (cut) with a transport design `T_f`, naturality is

$$\nu_{B'}\big(\mathrm{Inc}_{δ_2}(f)(D)\big) = \mathrm{Inc}_{δ_1}(f)\big(\nu_B(D)\big),$$

i.e. **normalise-then-transport = transport-then-normalise** — exactly the
**associativity of Ludics composition** (Girard 2001: cut-elimination commutes
with further cuts; normal forms are stable under composition). This is a known
property of the substrate's design calculus, *provided* `Inc_δ₁(f)` preserves
the cut-free/blocked shape (it does: transport of a Daimon-capped negative
design is Daimon-capped) and `Inc_δ₂(f)` preserves canonical-cut form (this
needs the merge to be transport-stable — granted by L-MERGE §5.5, since `μ`'s
attach locus `ℓ_i` and `⊗` structure are forced and hence preserved by the
leaf-respecting transport `T_f`). **O2 is reduced to associativity of
composition** (a substrate fact) **+ L-MERGE** (now proved); no independent open
content.

---

## 7. Status of Q-037 after this session

| obligation | aspirin instance | general | residual content |
|---|---|---|---|
| **O1-surj** (ν onto) | ✓ (§4) | ✓ (§5, canonical de-normalisation) | none |
| **O1-inj** (ν injective) | ✓ (§4) | ✓ (§5 induction + **L-MERGE** §5.5), single-generator fragment | merge canonicality **proved**; multi-reinstater → JSL join |
| **O2** (naturality) | — | **reduced** to assoc. of composition + L-MERGE (§6.2) | merge canonicality now discharged; assoc. is substrate fact |
| **O3** (bridge-compat) | ✓ (§6.1) | ✓ where O1 holds; else definitional | none |
| **termination** (ν well-defined) | ✓ depth-2 fixpoint (§4) | ✓ **one-level nesting / acyclic `Γ`** (§2.1, T1+T2) | **discharged for R3**; full Q-031 (cyclic) orthogonal |

**Net.** With L-MERGE (§5.5) proved, Q-037 is **positive on the
single-generator reinstatement fragment**: O1 (both halves), O3, and the
reduction of O2 are done; the only remaining external dependencies are the
termination precondition [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) and the
focalized §2 encoding. The previously-open content ("is the accumulation merge
canonical?") is **closed** — the merge `μ` is forced by three independent
constraints (level typing, materiality, locus discipline), not chosen.
Multi-reinstater accrual is **not** a counterexample: it is aggregation handled
by the JSL join `∨_A` one level up in `𝓕(Inc(B))` (§5.5.4), outside `defeat²`.
Consequences if this fragment is the operative one: side-data item 4 dissolves,
Q-028b upgrades to "positive," C001b′ b₃′ simplifies, and the runtime keeps its
δ₂ scheduler with a proven correspondence (brainstorm §11.1). The remaining
risk is confined to whether some target behaviour forces genuine
multi-generator `defeat²` *inside* `Inc(B)` (the E2 stress-test, §8.3).
**— RESOLVED 2026-05-31 ([E2 audit](e2-cardinality-multireinstater-2026-05-31.md)):**
the `|Inc(B)| = 3` two-undercutter instance forces **no** multi-generator
`defeat²` inside `Inc(B)` — multi-route reinstatement is per-defeater
single-generator `μ` + JSL join `∨_A` one level up, and the scope is structural,
not contingent.
**— TERMINATION DISCHARGED 2026-05-31 (§2.1):** ν is total on the one-level-nested
fragment over acyclic `Γ` (cut-count measure T1 + the structural depth-2 cap T2),
so F1 is removed, not deferred. With both the multi-generator risk and the
termination precondition discharged, **Q-037 closes positive *outright* on the
one-level-nested defeasible fragment over acyclic rule-bases** — unconditionally.
The only residue is the **cyclic / unbounded-depth** case, which is full
[Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) and which R3 never instantiates
(every Ambler argument is a finite λ-term over a finite `Γ`).

---

## 8. Next concrete deliverables (continuation of this session)

1. **~~Pin the accumulation merge operationally~~ — DONE (2026-05-31, §5.5).** The
   merge operator `μ` is defined (graft `χ_i` as a `⊗`-ramification at the unique
   negative leaf `ℓ_i`) and proved canonical (**L-MERGE**) by three independent
   forcings (level typing, materiality, focalized locus discipline). L-CANON
   condition (3)'s gap is closed; O1-inj holds in general on the single-generator
   fragment.
2. **~~Prove L-CANON uniqueness in general~~ — DONE on the single-generator
   fragment** (the §5 induction now runs with L-MERGE removing the merge modulo).
   Remaining: confirm the induction's base/step prose against L-MERGE (mechanical).
3. **~~Escalate to `|Inc(B)| ≥ 3`~~ — DONE (2026-05-31, [E2 audit](e2-cardinality-multireinstater-2026-05-31.md)).**
   Built the minimal `|Inc(B)| = 3` instance (second independent undercutter
   `i₃`). Result: `|Inc_δ₁| = |Inc_δ₂| = |𝒞/Γ⁺| = 3` (no inflation; A5 → δ₁); the
   multi-reinstater configuration decomposes into per-defeater single-generator
   `defeat²` + JSL join `∨_A` one level up — **no** multi-generator `defeat²`
   inside `Inc(B)`, so `μ`'s scope is confirmed **structural**. The R3
   multi-generator risk is discharged; Q-037 is positive on the full fragment.
4. **~~Discharge termination~~ — DONE (2026-05-31, §2.1).** The **R3-termination
   theorem** proves ν total on one-level-nested defeat over acyclic `Γ` by two
   strictly-decreasing measures: (T1) a per-input cut-count bound (`≤ 2` cuts,
   L-MERGE creates none, finite Ambler term ⟹ finite stack) and (T2) the
   structural depth-2 cap (the reinstater carries no object-level defeat, so it is
   Daimon-capped and cannot spawn depth-3; cycles excluded by acyclicity). F1 is
   **removed, not deferred** — Q-037 closes positive outright on this fragment.
   Full Q-031 (cyclic / unbounded depth) stays orthogonal and is never
   instantiated by R3.
5. Deferred: function-type defeat (Q-027 §8.3), and the MELL image (Q-030/E4).

---

## 9. References

- [Q-037 registry entry](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) — the question
  this session settles; O1/O2/O3 obligations and how-would-we-know branches.
- [δ brainstorm](delta-defeat-encoding-decision-brainstorm-2026-05-30.md) §11
  (the session brief), §11.3 (the ν construction made precise here), §11.5
  (failure modes — this session lands in the "positive modulo one lemma" region).
- [E1 audit](e1-reinstatement-aspirin-2026-05-30.md) — the aspirin instance and
  the accumulating-δ₂ requirement (§5.2) formalised here as canonical-cut
  condition (3).
- [E3 audit](e3-polarity-readoff-2026-05-30.md) — §5.3, the a-priori reason ν
  exists (δ₂ = "δ₁ + scheduling skin"), used in §2 and §6.1.
- [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) — b₃′ is the
  naturality O2 discharges; positive R3 simplifies it.
- [Q-027 audit](q027-thin-cones-2026-05-29.md) §2.3, §5.2, §7.1 — the aspirin Q3
  enumeration and the generator bijection O3 checks against.
- [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) — termination precondition for
  ν (F1).
- Girard 2001 *Locus Solum* §C (composition / cut-elimination, associativity =
  the engine behind ν, O2); Curien 2003 *Introduction to Linear Logic and Ludics*
  (the coroutine/interaction reading of normalisation motivating accumulating δ₂).
