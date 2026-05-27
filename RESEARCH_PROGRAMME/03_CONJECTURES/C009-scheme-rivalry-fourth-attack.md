# C009 — A fourth attack category (scheme-rivalry / behaviour-intersection emptiness) is required by the substrate, beyond Pollock's REBUT / UNDERMINE / UNDERCUT trichotomy

- **status:** open
- **ring:** inner
- **depends-on:** C006 (the formulation below is C006-native; under C007/C008 the attack restates as locus-tree disjointness or protocol incompatibility)
- **linked-open-questions:** Q-011, Q-016
- **last-reviewed:** 2026-05-27

## Statement

There is a class of attacks expressible in the substrate that is **not**
expressible as any of Pollock's three primitives (rebutting the
conclusion, undermining a premise, undercutting the inference). The
canonical case is **scheme-rivalry**:

> Two scheme applications `apply(S₁, x)` and `apply(S₂, x)` over the
> *same* claim `x` such that `⟦S₁⟧ ∩ ⟦S₂⟧ = ∅`. Neither application
> rebuts, undermines, or undercuts the other in Pollock's sense — both
> may have impeccable premises and impeccable inferences — yet the
> behaviours they assert membership in are disjoint, and so the
> *combined* commitment is incoherent.

The substrate's `attackType: REBUTS | UNDERMINES | UNDERCUTS` enum
(declared in [`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx))
cannot express this attack mode without coercion into a category it does
not belong to.

This conjecture is **separate from** and **independent of** the C006 /
C007 / C008 trilemma. Each ontology admits a behaviour-intersection-style
fourth category, restated in its native vocabulary:

- **Under C006:** `⟦S₁⟧ ∩ ⟦S₂⟧ = ∅`.
- **Under C007:** the locus trees `T_{S₁}` and `T_{S₂}` have no common
  unifier under the substituted variables of `x`.
- **Under C008:** the protocol fragments `π_{S₁}` and `π_{S₂}` add
  obligations on the same loci that no legal play can simultaneously
  satisfy.

## Positive settlement

A worked construction exhibits at least one production-corpus argument
pair `⟨apply(S₁, x), apply(S₂, x)⟩` for which:

1. Neither argument rebuts, undermines, or undercuts the other under
   Pollock's definitions (their premises are independent; their
   inferences both apply correctly; their conclusions agree on `x`).
2. The substrate detects a behaviour-intersection emptiness (or its
   C007/C008 analogue).
3. Practitioners recognise the pair as a *legitimate* attack, not as a
   mere classification dispute.

Filed as `T-NNN-scheme-rivalry-attack.md` with `closes: Q-016` and
relaxes the four-cell enum on `argument_scheme_cq.attackType` to add
`RIVALS` (or a comparable label decided at implementation time).

## Negative settlement

Either:

- Every candidate scheme-rivalry attack reduces to a Pollock primitive on
  closer inspection (e.g. `⟦S₁⟧ ∩ ⟦S₂⟧ = ∅` always factors through a
  premise the substrate already exposes as undermine-able); or
- The intersection emptiness condition is decidable but never holds for
  any pair of production schemes (the attack mode is well-defined but
  empirically vacuous).

Either result preserves the Pollock trichotomy as adequate for the
substrate and closes Q-016 negatively.

## Consequences if confirmed

- The admin's `attackType` enum is widened by exactly one label. The
  AIF round-trip in [`lib/aif/syncArgument.ts`](../../lib/aif/syncArgument.ts)
  must declare a translation policy (most likely: emit as a CA-node with
  a substrate-specific scheme annotation, since AIF itself does not
  recognise the category).
- The substrate gains an explicit *scheme-rivalry attack* primitive,
  distinct from the trichotomy. This is the most consequential
  substrate-original extension to argumentation-theoretic attack
  typology since Pollock 1987.
- A new well-formedness check at scheme-creation time becomes
  meaningful: detect pairs `⟨S, S'⟩` in the catalogue with
  `⟦S⟧ ∩ ⟦S'⟧ = ∅` and surface them as a structural feature of the
  catalogue (rivalry graph), not as a bug.

## Consequences if refuted

- Pollock's trichotomy is adequate for the substrate; Tiozzo 2024-style
  sub-divisions within categories may still be useful, but the *count*
  of categories does not increase.
- The substrate's claim to ontological extension beyond the trichotomy
  is retracted; the documentation framing in
  [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md)
  must be updated to reflect this.

## Bibliography

- Pollock 1987 *Defeasible Reasoning* Cognitive Science 11(4) — original
  trichotomy.
- Modgil & Prakken 2014 *The ASPIC+ Framework: a Tutorial* Argument &
  Computation 5(1) — ASPIC+ formalisation of the trichotomy.
- Tiozzo 2024 *Dualism about Undercutting Defeat* Ratio 37(2-3):145–155
  — sub-division within category 2 (substantive vs structural
  undercutting); cited as partial precedent for category-internal
  refinement, *not* for a fourth category.
- Hahn & Hornikx 2016 *Synthese* 193(6) — Bayesian grading within the
  trichotomy (also not a fourth category).
- Amgoud & Nouioua 2015 SUM — reductive collapse to a single attack
  relation (the opposite move; cited for completeness).
- Doutre, Herzig & Perrussel 2023 KR — epistemic-argumentation modal
  extensions (no fourth attack category in the standard sense, but
  cited as adjacent work).
- [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md)
  §3 (Bucket 2), §10 Q5, Appendix A row SC6 — confirms the literature
  proposes no fourth category and identifies the substrate's
  scheme-rivalry move as original.
