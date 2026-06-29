# L1 report-back — The arrow is the ℕ-index (Q-B(N))

**Date:** 2026-06-26
**Session:** [Session 20 — Diairesis cross-test](../10_IDEATION_SESSIONS/20-ludics-diairesis-crosstest.md), step **L1**.
**Artifact:** [`mechanisation/agda/ludics/ArrowIndex.agda`](../mechanisation/agda/ludics/ArrowIndex.agda) — type-checks under `--safe --without-K`, no postulates/holes, Agda 2.7.0.1 / stdlib v2.0, `agda ludics/ArrowIndex.agda` → EXIT:0. (No Agda was strictly required for L1; the module packages M2's facts under the Diairesis reading and adds two `refl`-level fuel-gating facts.)
**Feeds:** Diairesis `q013-approach.md` §2–§3 (the dilemma of generation), object **(N)** of the Session 20 §3 decomposition.
**Status:** L1 **CLOSED**. L0, L3 open; L4 aggregates.

---

## 1. Classification (object (N): normalisation `interact`)

**Claim under test (Session 20 §3 (N)):** normalisation is **recursion (algebraic) over ℕ**, whose **directedness — the arrow — is the ℕ-index / reduction order**, and is *imported* (Horn B: a reduction runs one way), not generated from the symmetric Player/Opponent structure.

**Result: CONFIRM.** Three facts, all over the real M1 `interact` (= the engine `stepCore` loop):

- **(R) `interact` is recursion over the ℕ step-index.** `interact fuel D E = loop D E fuel (init)`, and `loop` recurses structurally on `fuel`. The base case is constitutive: `no-fuel-is-ONGOING : ∀ D E → interact 0 D E ≡ ONGOING` (by `refl`). With no fuel, **no reduction step is taken** — the run is undecided *by construction*, independent of `D, E`. So ℕ is the reduction counter / μ step-index; it *gates* progress.
- **(F) Normalisation is a function — confluence is vacuous.** M2 modelled `interact` as a function, not a relation (`normalisation-deterministic = interact-det`): one fixed trajectory of states, no reduction-order freedom. Hence the directedness **cannot hide in branching**; it can only be the index. (This is M2's own observation that "associativity = confluence" is vacuous here — re-read as: the arrow is not in the reordering, because there is none.)
- **(A) The arrow = the `≤` order on the fuel.** A *decided* verdict (CONVERGENT / DIVERGENT / STUCK) is monotone along `≤` and never reverses: `verdict-irreversible : Decided s → n ≤ m → interact n D E ≡ s → interact m D E ≡ s` (= M2 `interact-mono-≤`). The generator is one increment, `verdict-step` (`n ↦ suc n`); convergence specifically is upward-closed (`convergence-upward-closed`, the daimon-terminal stays reached). So the decided-fuels of a run are **upward-closed in (ℕ, ≤)** with the verdict constant on them — a one-way, accumulating structure. That one-wayness **is** the arrow, and it is the pre-given well-order of ℕ.

Non-vacuity: the Core handshake is ONGOING at fuel 0 (`handshake-at-0`), decides CONVERGENT at fuel 2 (`handshake-at-2`), and is *transported* — not recomputed — to fuel 3 by one step of the arrow (`handshake-at-3`); DIVERGENT at fuel 1 persists to fuel 7 (`div-irreversible`). Progress accumulates along ℕ and does not undo.

## 2. Verdict

**Q-B(N): the directedness of normalisation is the `≤` order on the ℕ fuel-index — IMPORTED.** This corroborates Diairesis **Horn B**: the reduction is a *directed process* (it runs, one unit of fuel at a time, toward the daimon), and its direction is the ℕ-order it presupposes. Cut-elimination here does not *manufacture* orientation from the symmetric P/O duality; it consumes the well-order of the step-index. The arrow is presupposed by the running, exactly as Horn B says a generating-process presupposes the directedness it would generate.

## 3. The fuel-artifact question (the pressure point a critic will press)

Session 20 §7(4) demands an explicit answer: **does the result depend on the ℕ-fuel presentation, or would native (non-step-indexed) ludics normalisation import the arrow the same way?** Answer: it does **not** depend on the fuel as a mechanization crutch. The fuel makes *explicit* an arrow that native normalisation already carries as its **reduction order** — the sequence "cut, reduce, reduce, … reach †" is intrinsically ordered whether or not a counter names the steps. The `--safe` step-index is the *visible form* of that reduction order, not an artifact added on top of an otherwise-symmetric object. Two independent reasons:

1. The base fact `no-fuel-is-ONGOING` shows the index is the *reduction counter* — removing it does not remove the directedness, it removes the *measurement* of it; native normalisation still proceeds step-by-step.
2. M2's determinacy shows there is no branching for the index to be "choosing" among; the index only tracks *how far the one trajectory has run* — which is precisely "the reduction order".

So the honest statement: the arrow is the reduction order of normalisation; the ℕ-fuel is its mechanized witness, not its source. **This is the cleanest place the result is robust, and it is stated for the record.** (The deeper Risk-2 question — whether convergence-to-daimon could be *defined* with no directed reduction at all, purely from the symmetric P/O structure — is **L3**, not settled here.)

## 4. Promotion

- **Q-013 §2 (Horn B):** corroborated at object (N) — interactive normalisation's directedness is imported as the reduction order / step-index, no tertium. The last serious candidate's *generative* half is now classified for normalisation; the daimon/symmetry half remains for L3.
- **Precision Lemma (R2):** (N) is recursion over ℕ — (co)algebraic — so Q-A(N) also confirms (the algebraic half of the §3 prediction). Q-A now holds at (O) [L2] and (N) [L1]; only (D) [L0] remains for a full Q-A CONFIRM.

## 5. Next step

**L3** (Risk 2): is convergence-to-daimon definable without a directed reduction — purely from the symmetric P/O duality? This is the single most interesting way Q-B could flip, and it now has L1's precise input: the directedness to be "removed" is the reduction order that `no-fuel-is-ONGOING` + determinacy expose. **L0** (designs as the final coalgebra of the action functor) can run in parallel. **L4** then aggregates L0–L3 into the Q-A / Q-B verdicts and the §7 report-back.
