# L3 report-back — The daimon is the orientation (Q-B closes; Risk 2 does not fire)

**Date:** 2026-06-26
**Session:** [Session 20 — Diairesis cross-test](../10_IDEATION_SESSIONS/20-ludics-diairesis-crosstest.md), step **L3** — the decisive Risk-2 check.
**Artifact:** [`mechanisation/agda/ludics/DaimonOrientation.agda`](../mechanisation/agda/ludics/DaimonOrientation.agda) — type-checks under `--safe --without-K`, no postulates/holes, Agda 2.7.0.1 / stdlib v2.0, `agda ludics/DaimonOrientation.agda` → EXIT:0.
**Feeds:** Diairesis `q013-approach.md` §2–§3 (the dilemma of generation; the third-horn check), object **(O)/(N) boundary** of the Session 20 §3 decomposition.
**Status:** L3 **CLOSED**. **Q-B closes** (modulo the M1′ infinitary note in §5). L0 open; L4 aggregates.

---

## 1. The question (precise form)

Can `D ⊥ E` — convergence-to-daimon — be **defined** without a directed reduction, purely from the symmetric Player/Opponent structure? A Risk-2 escape needs a characterisation that is **(i) static** (no reduction), **(ii) symmetric** (no privileged direction), and **(iii) daimon-free or with an emergent daimon**. If it existed, ludics would *generate* orientation from symmetric materials → interactive tertium → the dilemma's third horn opens → the arrow is reducible.

## 2. Result — Risk 2 does NOT fire (three mechanized facts over the real `interact`)

- **(P) The daimon is a posited terminal, and convergence requires it.** `no-daimon-no-conv : ∀ D E → NoDaimon D → NoDaimon E → ¬ (D ⊥ E)` — if **neither** design contains a daimon act, the interaction **never** converges, at any fuel. Proof: `step1` returns `done CONVERGENT` *only* in its `kind a ≡ DAIMON` branch; over daimon-free material `findNextPositive` only ever yields PROPER acts (`findNextPositive-PROPER`), so that branch is unreachable, and the fuel-induction (`loop-no-conv`) carries this across the whole run (producer/provider are always the same two designs, so daimon-freeness is preserved). **This kills (iii):** the daimon is a *primitive constructor* of `Kind`, not a notion derivable from the symmetric PROPER-action (P/O) material. Convergence has no content without the posited †.
- **(U) The daimon orients unilaterally.** `dai-wins : ∀ E → interact 1 (dai ∷ []) E ≡ CONVERGENT` — a producer that plays † converges against **every** opponent, at fuel 1, **without consulting the other side** (`refl` holds for an abstract `E`). **This kills (ii) at the orientation point:** the "which way it resolves" is fixed by the terminal alone, not produced by the symmetric pair.
- **(A) The operational relation is directed, not symmetric.** `swap-LR` / `swap-RL`: the *same* pair at the *same* fuel 1 gives **ONGOING** one way and **CONVERGENT** the other; `interact-not-symmetric` records that `interact` is not symmetric in its arguments. **This kills (i)+(ii) jointly:** `interact` is producer-first *by construction*; the P/O symmetry is a modelling ideal the concrete convergence-definition does not rest on. Exactly the Q-016 pattern — the symmetry is the duality, the orientation is imported.

Non-vacuity: `ex-no-daimon : ¬ ((p0 ∷ []) ⊥ (o0 ∷ []))` — a concrete pair built from PROPER material alone, provably never orthogonal however the symmetric handshake proceeds.

## 3. Verdict

**Risk 2 DOES NOT FIRE. Q-B closes at ludics.** The arrow enters ludics' **definition** of convergence as the **posited daimon** (the orientation point) plus the reduction's "toward" — Horn B at the *definitional*, not merely operational, level. The symmetric P/O structure supplies the two sides (the duality, Q-016); it never supplies which way the interaction resolves. The decomposition's prediction holds object-by-object: (1) duality is symmetric-but-not-the-arrow, (2) reduction order is imported [L1], (3) the daimon-terminal is posited and required [here]. **No interactive tertium.**

## 4. The steelman, and why it does not rescue a tertium (Roberts parallel)

A committed Girardian reads the daimon's orientation as **constitutive of interaction itself** (primitive), not "imported from outside". This is the exact analog of the thermodynamic witness's Roberts wrinkle (electroweak T-violation as *primitive-lawlike* vs *posited-boundary-condition*). In both cases the steelman **relocates** the irreducibility (posited → primitive-constitutive) **without making the arrow generated** from the symmetric materials: a primitive of the framework is still not *produced* from the P/O duality. The mechanization makes the relocation visible but not escapable — `†` is a `Kind` constructor either way, and `no-daimon-no-conv` shows convergence cannot do without it. **Both readings corroborate Horn B**; they differ only on the *mode* of the daimon's primitiveness — the same posited-vs-primitive split Q-013's two physics arrow-stories already exhibit. No tertium either way.

## 5. Bound — what L3 does not settle

L3 classifies the **mechanized finite core** (M0–M5). The **infinitary M1′** extension is the `ν`-pole; predicted to import the arrow the same way (coinduction = greatest-fixed-point selection, still imported), but this is **stated, not proven** — L4 should carry it as the one residual. And, as for all of R2, L3 operates on a **precise** account: it confirms the Precision Lemma's domain at ludics, not the non-formalizable **(T2)** remainder, which stays **R3-transcendental** territory.

## 6. Promotion

- **Q-013 §3 (the arrow witness):** **cleared.** Ludics — the strongest, most exotic candidate for a third sense of "generate" — imports the arrow at the definitional level (the daimon). The dilemma's third horn does **not** open here.
- **R3 exhaustiveness:** the last serious candidate is **closed**. Across Hegelian determinate negation (negation-algebras pre-study: Horn A), the thermodynamic/physics arrow (Horn B + Past Hypothesis), and now interactive ludics (Horn B, daimon = posited terminal), **no tertium survives**. The dilemma is exhaustive for every precise account examined.
- **Q-B (arrow irreducible):** **closes** at ludics — corroborated-then-confirmed: the directedness is imported as (reduction order [L1]) + (posited daimon [L3]), never generated.
- **Precision Lemma (R2):** Q-A still needs **(D)/L0** for a full CONFIRM; Q-A holds at (N) and (O).

## 7. Next step

**L0** (designs as the final coalgebra of the action functor — low-risk; completes Q-A), then **L4** — aggregate L0–L3 into the Q-A / Q-B verdicts and the §7 report-back: Precision Lemma CONFIRM (pending L0), Q-013 §3 witness **cleared**, R3 exhaustiveness's last candidate **closed**, with the M1′ `ν`-pole residual stated explicitly.
