# T002 — Inc(B) is an antichain; B decomposes into disjoint cones

- **status:** established
- **closes:** (none; the antichain status was assumed by C1 and confirmed by Phase 2e analysis — recorded here so subsequent results can cite it as a dependency)
- **depends-on:** Fouqueré–Quatrini 2013 uniqueness-of-incarnation
- **proved-by:** Phase 2e analysis, 2026-05-21
- **cross-checked-by:** Round 2 literature review against Fouqueré–Quatrini 2013 (LMCS 9(4:6))
- **cross-check-date:** 2026-05-18
- **last-reviewed:** 2026-05-29 (added corroborating Agda mechanisation; see §Corroborating mechanisation)
- **source-of-proof:** [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md) §§3, 4
- **corroborating-mechanisation:** [`../mechanisation/agda/T002/T002.agda`](../mechanisation/agda/T002/T002.agda) (Agda 2.7.0.1, agda-stdlib v2.0; `--safe --without-K`, no postulates/holes; evidence-only — see §Corroborating mechanisation)
- **build-instructions:** [`../mechanisation/agda/T002/README.md`](../mechanisation/agda/T002/README.md)

## Statement

For any behaviour `B` (`B = B^⊥⊥`):

1. **Antichain.** `Inc(B) := { D ∈ B : ∄ D′ ∈ B, D′ ⊊ D }` is an antichain
   under `⊆`. (If `D₁, D₂ ∈ Inc(B)` and `D₁ ⊆ D₂`, then `D₁ = D₂` by
   minimality of `D₂`.)
2. **Cone decomposition.** `B = ⨆_{Dᵢ ∈ Inc(B)} Cᵢ`, where `Cᵢ` is the
   cone above `Dᵢ` as defined in T001. The disjoint union follows from the
   uniqueness of `|D|_B` (Fouqueré–Quatrini 2013).

## Proof (pointer)

See [`.../LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)
§3 (antichain argument, "purely order-theoretic, requires no Ludics-specific
machinery") and §4 (Cone Decomposition Proposition, citing Fouqueré–Quatrini
2013).

## Cross-check notes

The antichain step is order-theoretic and does not depend on any specific
feature of Ludics; it holds for the minimal elements of any partially
ordered set. The cone decomposition does depend on uniqueness of incarnation,
which is a Ludics-specific theorem of Fouqueré–Quatrini 2013. The Round 2
review confirmed the literature attribution.

## What this rules out (for the implementation)

- Any UI affordance that presents `Inc(B)` as a linearly ordered list with a
  designated maximum. The display must be antichain-aware.
- Any aggregation primitive that takes a "join across the whole behaviour"
  without first selecting a cone; cf. the cone-decomposed view policy in
  [`.../LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md)
  §2 (H6).

## Corroborating mechanisation

[`../mechanisation/agda/T002/T002.agda`](../mechanisation/agda/T002/T002.agda)
type-checks (Agda 2.7.0.1, agda-stdlib v2.0, `--safe --without-K`) with
no postulates and no holes. It mechanises both parts of T002, following
the split the human proof already makes between the order-theoretic core
and the Fouqueré–Quatrini dependency:

- **Part 1 (antichain) is unconditional.** `Order.Behaviour.antichain`
  proves that the minimal elements of *any* setoid partial order form an
  antichain — `D₁ ⊑ D₂ → D₁ ≈ D₂` for minimal `D₁, D₂` — discharging
  from antisymmetry alone, exactly as
  [`LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)
  §5.1 advertises ("requires no properties of ⊥⊥-closure … holds for the
  minimal elements of any partially ordered set"). The corollary
  `no-upper-bound-in-Inc` follows.

- **Part 2 (cone decomposition) is conditional on F-Q.** The
  uniqueness-of-incarnation theorem is supplied as an explicit
  `Incarnation` *record* (a hypothesis), **not** an Agda `postulate`, so
  the artefact remains `--safe` while keeping the dependency visible in
  the types. From it the file derives `inc-minimal`, `inc-unique`,
  `cross-cone-incompat` (§5.2), the partition `cone-total` +
  `cone-disjoint` (§4), and `cone-bottom` (the Dᵢ-as-bottom link to
  T001's cone definition).

- **Non-vacuity.** `ListModel` instantiates the abstract order on the
  C001a list-design model (set-inclusion / set-equality `≈ᴰ`),
  discharging every order axiom, so the theorems apply to the
  designs-as-sets representation.

Under the Register policy this is **evidence-only**, not a positive
settlement: the fidelity of the `Incarnation` record to F-Q 2013 and of
the `List A` model to chronicle-tree designs are human-review
obligations, recorded in
[`../mechanisation/agda/T002/README.md`](../mechanisation/agda/T002/README.md)
§"What this cannot check". T002's `status` remains `established` on the
strength of the human proof; the mechanisation corroborates the
order-theoretic core and isolates exactly which claims ride on the cited
theorem.
