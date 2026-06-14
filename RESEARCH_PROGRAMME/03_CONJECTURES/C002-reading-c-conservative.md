# C002 — Reading C multi-agent Ludics is conservative over bilateral Reading A on convergence verdicts

- **status:** open
- **ring:** core
- **depends-on:** T002, C001
- **linked-open-questions:** Q-002
- **scoping-session:** [session 12 — the additive frontier](../10_IDEATION_SESSIONS/12-additive-frontier-preferred-stable-multiagent-2026-06-14.md) (clusters this conjecture's *horizontal / participant* axis — multi-agent Reading C as a `&`-superposition of opponents — with the *vertical / semantics* axis [C011](C011-additive-preferred-games-bridge.md) under one shared additive `&`/`⊕` treatment; flags the `T004` promotion-filename collision with the established JSL-fragment-bridge T004)
- **last-reviewed:** 2026-06-14

## Statement

Let a *Reading C deliberation* be a tuple `(D_P, W, B)` where `D_P` is a
Proponent design, `W` is a witness-record set, and the Opponent role is
borne by the behaviour `σ(D_P)^⊥`. Let `bilat(D_P, W, B)` denote any
bilateralisation: a sequence of pairwise Reading-A interactions between
`D_P` and individually-witnessed designs from `W`. Then for every Reading C
deliberation, the convergence verdict (the existence and locus of a daimon)
agrees with the verdict of *every* faithful bilateralisation.

## Positive settlement

A translation lemma (Reading C → set of bilateral interactions) plus a
fidelity-of-verdicts theorem. The proof must explicitly handle:

- The case where `|W| ≥ 3` (three-or-more-participant deliberation), since
  the bilateral tradition (Lecomte/Quatrini/Fleury/Tronçon) handles this by
  *nesting* bilateral dialogues; the lemma must show the nesting choice
  does not affect the verdict.
- The polarity-shift case where the active witness changes mid-interaction;
  Reading C absorbs the shift into the behaviour, Reading A models it as a
  player change.

Filed as `T004-reading-c-conservative.md` with `closes: Q-002`.

## Negative settlement

A concrete deliberation `(D_P, W, B)` with `|W| ≥ 3` and a finite trace
exhibiting a daimon under Reading C and no daimon under any
bilateralisation (or vice versa). The example must be presentable in the
substrate's existing JSON wire format, so that the runtime can be modified
to load it as a regression test.

## Bibliography

- Basaldella 2014/2015, *Ludics without Designs I: Triads*, arXiv:1502.04773.
- Lecomte & Quatrini 2011, "Figures of Dialogue," *Synthese* 183.
- Fleury, Quatrini & Tronçon 2011, "Dialogues in Ludics," LNCS 6700.
- Bougsty-Marshall 2020, AGI 2020 (LNAI 12177).
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_1.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §2 (C7, C20)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_2.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) §1 (N-C21)
