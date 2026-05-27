# C004 — Joint saturation `σ_joint(D_P, W)` is a closure operator on the product poset of design-sets and witness-record sets

- **status:** open
- **ring:** core
- **depends-on:** C002, C003
- **linked-open-questions:** Q-004
- **last-reviewed:** 2026-05-27

## Statement

Let `P := (P_{des}, ⊆) × (P_{wit}, ⊆)` be the product of the powerset poset
on design-sets and the powerset poset on witness-record sets, ordered
componentwise. Let `σ_joint : P → P` be the joint-saturation operator
defined in
[`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OPEN_COMPOSITION_JOINT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md).
Then `σ_joint` is a closure operator: extensive
(`x ≤ σ_joint(x)`), monotone (`x ≤ y ⇒ σ_joint(x) ≤ σ_joint(y)`),
idempotent (`σ_joint(σ_joint(x)) = σ_joint(x)`).

Moreover, **deliberative progress** is exposure-map drainage: the cardinality
of the `latent` stratum of `κ ∘ proj_des ∘ σ_joint(x)` is monotone-decreasing
along the deliberation's update sequence.

## Positive settlement

A proof of the three closure axioms plus the drainage corollary. The proof
should yield, as a side-effect, a Galois connection
`(σ_joint, restrict)` between the live-deliberation poset and the saturated
poset.

## Negative settlement

A finite counterexample to idempotence: a `(D_P, W) ∈ P` with
`σ_joint(σ_joint(D_P, W)) ≠ σ_joint(D_P, W)`. (Extensivity is easy by
construction; monotonicity is unlikely to fail; idempotence is the load
test.)

## Bibliography

- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OPEN_COMPOSITION_JOINT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_1.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §2 (C20)
- Fouqueré & Quatrini 2018, *Visitable paths and saturation*, LMCS 14(2).
