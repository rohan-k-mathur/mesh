# L0 report-back — Designs are the initial algebra (Q-A(D) CONFIRM; Q-A complete)

**Date:** 2026-06-26
**Session:** [Session 20 — Diairesis cross-test](../10_IDEATION_SESSIONS/20-ludics-diairesis-crosstest.md), step **L0** — the last object for a full Q-A.
**Artifact:** [`mechanisation/agda/ludics/DesignAlgebra.agda`](../mechanisation/agda/ludics/DesignAlgebra.agda) — type-checks under `--safe --without-K`, no postulates/holes, Agda 2.7.0.1 / stdlib v2.0, `agda ludics/DesignAlgebra.agda` → EXIT:0.
**Feeds:** Diairesis `removing-the-bound.md` R2 (Precision Lemma), object **(D)** of the Session 20 §3 decomposition.
**Status:** L0 **CLOSED**. **Q-A (Precision Lemma) now CONFIRM at all three objects (D, N, O).** L4 aggregates (with the M1′ `ν`-pole residual).

---

## 1. Classification (object (D): designs)

**Claim under test (Session 20 §3 (D)):** designs are **coalgebraic** — the (possibly-infinite) Böhm-tree/strategy presentation is the **final coalgebra** of a ludics action functor, with the **finite fragment** (`Design = List Act`) its well-founded **μ-part** (the initial algebra). Designs span both poles of the bidirectional arrow (Q-015's μ/ν), both imported.

**Result: CONFIRM, at the real M0 carrier.** The action functor (linear/chronicle fragment) is the list functor over `Act`:
$$F\,Y \;=\; \top \;\uplus\; (\mathsf{Act} \times Y) \qquad\text{("stop, or one action then the rest")}$$
and over it the mechanization establishes:

- **(μ) `Design = List Act` is the initial F-algebra.** Its structure map is `into : F Design → Design` (the `[]`-or-`∷` constructor map); the catamorphism `⟦ A ⟧ = foldr (μ A) (η A)` is an F-algebra homomorphism into **any** algebra `A` (`fold-hom`: the commuting square `⟦A⟧ ∘ into ≗ algMap A ∘ Fmap ⟦A⟧`); and it is the **unique** such homomorphism (`foldr-unique`). Uniqueness of the mediating morphism **is** initiality — `Design = μF`, the least fixed point / well-founded inductive pole.
- **(Lambek) `Design ≅ F Design`.** `into` and `uncons` are mutually inverse (`into-uncons`, `uncons-into`). So the design carrier is a **literal fixed point** of the action functor — `X ≅ F(X)`, the precise form of "self-differentiation" Diairesis quantifies over (§1 genus: the differentiating `F` and the differentiated `Design` coincide up to this iso).

Non-vacuity: `ex-fold` folds a concrete design to its length via the catamorphism — `⟦_⟧` is a genuine structural recursion over the well-founded carrier.

**Faithfulness note.** The mechanized carrier is the **chronicle-as-sequence** projection `List Act` (the engine's `CoreAct[]`, per the M0 carrier audit). The branching Böhm-tree presentation is the rose-tree functor `F Y = ⊤ ⊎ (Act × (ramification → Y))`; the linear core is its chronicle projection. The initial-algebra/fixed-point structure mechanized here is the real carrier's; the tree generalization is the same story with a wider functor.

## 2. Verdict

**Q-A(D): CONFIRM.** The finite design carrier is the **initial algebra (μ)** of the action functor and a **fixed point** `Design ≅ F Design`, with the fold as the unique mediating morphism. It is (co)algebraic — the well-founded μ-pole, **imported** (List's recursion is the structural induction the carrier presupposes; the order is `F`'s, given in advance). This is **Horn A** at the level of the carrier's *constitution*: a fixed point of a pre-given functor, exactly the paradigm.

## 3. Q-A is now complete

With the three objects classified, the Precision Lemma's antecedent is discharged at ludics:

| Object | What | (Co)algebraic structure | Verdict | Step |
|---|---|---|---|---|
| **(D)** designs | `Design = List Act` | initial algebra **μF**; fixed point `Design ≅ F Design` | CONFIRM | L0 |
| **(N)** normalisation | `interact` | recursion over ℕ (the step-index) | CONFIRM | L1 |
| **(O)** behaviours | `B = B^⊥⊥` | closure monad of the orthogonality Galois connection | CONFIRM | L2 |

**Q-A: full CONFIRM.** Ludics — the candidate most likely to escape (interactive, pre-logical) — falls **wholly inside** the (co)algebra paradigm. This is the **strongest-site** corroboration the Precision Lemma can receive: the framework picked precisely because its objects are defined by *interaction* rather than *construction* nonetheless decomposes, object by object, into initial-algebra / recursion / closure-monad structure.

## 4. Bound — the M1′ residual (the ν-pole)

L0 mechanizes the **finite** carrier = the **μ-pole** (initial algebra). The session's full §3(D) prediction also names the **infinitary** Böhm-tree as the **final coalgebra (νF)** — the other pole. That is the **M1′** extension, *stated not proven here* (it needs coinduction / sized types, outside this `--safe --without-K` inductive corpus). Predicted: it imports the arrow the same way — `νF` is the greatest-fixed-point selection, still a pre-given (co)recursion order. **L4 must carry this as the one residual** for both Q-A (the ν-half of (D)) and Q-B (the coinductive normaliser), rather than assume it.

## 5. Promotion

- **Precision Lemma (R2): CONFIRM at ludics** for all precise objects of the finite core. One more independent formalization converges onto the paradigm — Church–Turing-grade support, at the strongest site.
- **Q-015 (μ/ν bidirectional arrow):** corroborated — designs concretely realize the μ-pole (initial algebra, here) with the ν-pole (final coalgebra) as the infinitary extension; both imported.
- **R3 exhaustiveness:** unaffected by L0 (a Q-A object); already closed by L3 for Q-B.

## 6. Next step

**L4 — aggregate.** Combine L0–L3 into the Q-A / Q-B verdicts and the §7 report-back to the Diairesis registry:
- **Q-A: CONFIRM** (Precision Lemma corroborated at ludics, strongest site) — pending the explicit M1′ `ν`-pole statement.
- **Q-B: CLOSES** (arrow imported as reduction order [L1] + posited daimon [L3]; Risk 2 does not fire).
- **Q-013 §3 witness: cleared**; **R3 exhaustiveness's last candidate: closed.**
- **Registry line:** *Ludics classified — designs μF (L0), normalisation ℕ-recursion (L1), behaviours closure monad (L2); arrow imported via daimon (L3). Q-A CONFIRM, Q-B closes. Residual: M1′ ν-pole, predicted-imported, stated.*
