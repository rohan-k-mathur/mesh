# L2 report-back — Behaviours are the closure monad (Q-A(O), Risk 1 discharged)

**Date:** 2026-06-25
**Session:** [Session 20 — Diairesis cross-test](../10_IDEATION_SESSIONS/20-ludics-diairesis-crosstest.md), step **L2** (the one rung that needs code).
**Artifact:** [`mechanisation/agda/ludics/ClosureMonad.agda`](../mechanisation/agda/ludics/ClosureMonad.agda) — type-checks under `--safe --without-K`, no postulates/holes, Agda 2.7.0.1 / stdlib v2.0, `agda ludics/ClosureMonad.agda` → EXIT:0.
**Feeds:** Diairesis `removing-the-bound.md` R2 (Precision Lemma) and `q013-approach.md` §3, via the **(O)** primitive of the §3 decomposition.
**Status:** L2 **CLOSED**. L0, L1, L3, L4 remain open.

---

## 1. Classification (object (O): orthogonality + behaviours)

**Claim under test (Session 20 §3 (O)):** "definition by testing" — `B = B^⊥⊥` — is the **closure monad of the orthogonality Galois connection**; behaviours are its algebras (the closure's fixed points). If true, (O) is (co)algebraic and Q-A confirms at this object; if "definition by orthogonality" were a *third* mode, the Precision Lemma would fail here.

**Result: CONFIRM, definitionally, at the real `interact`-orthogonality.** Instantiating the abstract `lib.Closure.Biorthogonal` at the genuine convergence relation `D ⊥ E := ∃ n, interact n D E ≡ CONVERGENT` (ludics.Core M1, proved fuel-independent by M2), the new module surfaces the two facts the classification needs, both discharged by reuse of already-`--safe` lemmas:

- **(G) Galois connection** — `galois` / `galois⁻¹`: `S ⊆ ⊥^T ⇔ T ⊆ S^⊥`, i.e. the defining antitone polarity `A ⊆ B^⊥ ⇔ B ⊆ A^⊥`. Both sides unfold to "∀ D∈S, ∀ E∈T, D ⊥ E", so the equivalence holds **definitionally** — no added structure.
- **(C) Closure operator** — `clo-extensive`, `clo-monotone`, `clo-idempotent`: the three `lib.Closure.ClosureOp` axioms for `(·)^⊥⊥ = pol⁻ ∘ pol⁺` on the powerset poset `(𝒫(Design), ⊆)`. Their conjunction *is* "`clo` is a closure operator".

**Behaviour = fixed point.** A behaviour is `G^⊥⊥ ≐ G` (`clo-is-behaviour`), and `S^⊥⊥` is the **least** behaviour above `S` (`clo-least-behaviour`) — the generation map (monad unit + algebra). Non-vacuity is pinned by the Core handshake: `p0 ∷ []` lies in a genuine co-design behaviour (`handshake-in-behaviour`), so the classification has a non-empty model over the real relation, not a toy carrier.

## 2. Verdict

**Q-A(O): CONFIRM.** "Definition by testing" is a **closure operator** — a monotone, extensive, **idempotent** climb in the *pre-given* inclusion order `⊆` on `𝒫(Design)`, terminating at a fixed point (the behaviour). By the negation-algebras pre-study (closure operator ⇒ **Horn A**: imports the order it climbs; one-step termination at a fixed point), ludics' most exotic primitive falls **inside** the (co)algebra paradigm. No third mode of definition appears. This is the **strongest-site** confirmation the Precision Lemma can get: the framework most likely to escape (interactive, pre-logical) collapses cleanly.

## 3. Risk checks

- **Risk 1 (Q-A escape) — DOES NOT FIRE.** Session 20 §4 flagged that instantiating the opaque `_⊥_` with `interact`'s convergence "is the step that has never been done, and exactly where a surprise would surface." Run now: no surprise. Both (G) and (C) hold, definitionally, at the real relation. **Correction to the session premise:** M3 (`Separation.agda`) and M4 (`Completeness.agda`) had *already* instantiated `Biorthogonal Design Design _⊥_` and read off behaviours / internal completeness — so the instantiation itself was not new. What L2 adds, and what M3/M4 never surfaced, is the **Galois equivalence `A ⊆ B^⊥ ⇔ B ⊆ A^⊥` named at the design level** (M4 used only `clo-below`/`expand⁻`). That equivalence is the precise content of Risk 1, and it is now a checked artifact.
- **Risk 2 (Q-B escape):** out of scope for L2 (belongs to L3). Untouched here.

## 4. The fuel-artifact question (Q-B preview, flagged honestly)

L2 confirms (O) is a closure *without* settling the arrow. The inclusion order `⊆` that `clo` climbs is **imported**, exactly as Horn A predicts — the order is pre-given on `𝒫(Design)`, not produced by the orthogonality. Where the *directedness* lives (the ℕ-fuel / the daimon / the normalisation order) is the L1/L3 question. L2 deliberately makes no claim there; it only removes (O) as a candidate third mode of *definition*.

## 5. Promotion

- **Precision Lemma (R2):** gains its strongest independent confirmation at object (O) — the testing-definition of behaviours is a closure monad, hence (co)algebraic. One more formalization converges onto the paradigm.
- **R3 exhaustiveness:** "interactive definition" does **not** open a third horn at (O); it collapses to Horn A. The last serious candidate's *definitional* half is closed; its *generative* half (the arrow) is L1/L3.
- **Q-013 §3:** no tertium at (O). Witness for Q-A(O) cleared.

## 6. Next step

**L1** (classify normalisation `interact` as recursion over ℕ; locate the arrow as the fuel/reduction order — no new code, rides on M2's determinacy + monotonicity), then **L3** (Risk 2: is convergence-to-daimon definable without a directed reduction?). L0 (designs as (co)algebra) can run in parallel. L4 aggregates into the Q-A / Q-B verdicts.
