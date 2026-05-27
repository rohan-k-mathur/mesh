# T002 — Inc(B) is an antichain; B decomposes into disjoint cones

- **status:** established
- **closes:** (none; the antichain status was assumed by C1 and confirmed by Phase 2e analysis — recorded here so subsequent results can cite it as a dependency)
- **depends-on:** Fouqueré–Quatrini 2013 uniqueness-of-incarnation
- **proved-by:** Phase 2e analysis, 2026-05-21
- **cross-checked-by:** Round 2 literature review against Fouqueré–Quatrini 2013 (LMCS 9(4:6))
- **cross-check-date:** 2026-05-18
- **last-reviewed:** 2026-05-27
- **source-of-proof:** [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md) §§3, 4

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
