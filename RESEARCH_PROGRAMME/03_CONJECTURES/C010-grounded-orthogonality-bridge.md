# C010 — The grounded extension of a finite abstract AF coincides with the canonical Ludics-orthogonality acceptance of its translated dispute designs

- **status:** partially-resolved — proved on the abstract-AF / grounded fragment by [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) (established 2026-06-03 after cross-check); empirically corroborated Phase 2 (2026-06-02)
- **ring:** core
- **depends-on:** —
- **linked-open-questions:** Q-038 (registers this biconditional); Q-031 (defeat-encoding, tangential)
- **proved-by:** [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) — grounded fragment (Lemmas A simulation, B strategy-bijection, C game-adequacy)
- **last-reviewed:** 2026-06-03

## Statement

Let `F = (A, ⇝)` be a finite abstract argumentation framework (Dung), and let
`⟦·⟧` be the translation of §1–§2 of the bridge spec
([`../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md`](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)),
which sends each argument `a ∈ A` to a Proponent dispute design `⟦a⟧⁺` and the
attack structure to a family of Opponent test designs, all within the
multiplicative, additive-free fragment of Ludics. Let orthogonality be the
**canonical** predicate (`stepInteraction` reaching the daimon `†`, i.e.
`CONVERGENT`), and let acceptance be the realizability reading

> `a` is *accepted by interaction* :⟺ there exists a Proponent strategy design
> `σ` for `a` that is orthogonal to **every** Opponent strategy design — i.e.
> `∃σ ∀τ. ⟨σ ∣ τ⟩ ⇓ †`.

Then for every `a ∈ A`:

> **`a ∈ grounded(F)` ⟺ `a` is accepted by interaction.**

Equivalently, `⟦a⟧⁺` lies in the bi-orthogonal closure `B_φ = B_φ^{⊥⊥}`
(canonical, re-founded on `stepInteraction` — see
[`../../packages/ludics-engine/behaviourClosure.ts`](../../packages/ludics-engine/behaviourClosure.ts))
of the translated dispute behaviour iff `a` is grounded.

The encoding fixes one substantive game choice: the asymmetric grounded-game
repetition rule (**PRO may not re-assert an argument on a line; CON may repeat**),
which both forces odd cycles to "not accepted" and guarantees every dispute line
is finite (length ≤ `2·|A|+1`).

## Positive settlement

A proof of the biconditional — most naturally via the **keystone lemma** (Phase
3): the grounded discussion game is isomorphic, strategy-preservingly, to
interaction of the translated Ludics designs (PRO winning strategy ↦
daimon-terminating design orthogonal to all tests).

**Settled (2026-06-03), established after cross-check.**
[T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) proves the
biconditional on the abstract-AF / grounded fragment, exactly via the keystone
lemma, decomposed into Lemma A (simulation), Lemma B (strategy bijection), and
Lemma C (game adequacy — self-contained, no Ludics appeal). The proof pins the
fragment (multiplicative, additive-free; distinct subaddresses per argument) and
the one substantive game rule (PRO no-repeat / CON may repeat). The second-reader
cross-check raised one blocking defect (Lemma A's external appeal to the canonical
predicate), which was discharged by extracting the engine kernel
[`stepCore`](../../packages/ludics-engine/stepCore.ts) and differentially testing
the pure `interact` against it; T005 is now `established`. The preferred / stable
lift is tracked separately as [C011](C011-additive-preferred-games-bridge.md) /
Q-039.

## Negative settlement

A finite AF `F` and argument `a` with `a ∈ grounded(F)` but no Proponent strategy
design orthogonal to all Opponent tests (or vice versa) — i.e. a divergence
between the consolidated grounded engine
([`../../lib/argumentation/labelling.ts`](../../lib/argumentation/labelling.ts))
and `acceptableByInteraction`. A *non-faithful* encoding (where the translation
loses winning strategies for some AF subclass) settles the statement *as written*
negatively but reopens it for the characterised sub-fragment.

## Evidence (Phase 2, 2026-06-02)

- Prototype: [`../../lib/bridge/`](../../lib/bridge) (`dispute.ts` carries the
  faithful pure interaction and strategy enumeration).
- Test: [`../../tests/bridge/grounded-biorthogonal.property.test.ts`](../../tests/bridge/grounded-biorthogonal.property.test.ts)
  — **7/7 green**; the biconditional held over **500 fast-check runs** (AFs of
  1–5 args, arbitrary attack relation incl. self-attack), with 543 accepted /
  627 rejected verdicts checked against the exact engine and ~19.5% of pairs
  skipped above the enumeration bound (no verdict asserted). A second property
  confirms `acceptableByInteraction ⟺ disputeWins` (direct minimax), so the
  interaction is faithful to the game value, not a shortcut.

## Bibliography

- Modgil & Caminada 2009, *Proof Theories and Algorithms for Abstract
  Argumentation Frameworks*, in Argumentation in AI (grounded discussion game).
- Dung 1995, *On the acceptability of arguments…*, AIJ 77 (grounded extension).
- Girard 2001, *Locus Solum* (designs, orthogonality, bi-orthogonal closure).
