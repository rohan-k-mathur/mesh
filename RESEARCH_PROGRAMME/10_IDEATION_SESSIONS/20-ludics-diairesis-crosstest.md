# Session [20] — Diairesis cross-test: is the Ludics core (co)algebraic, and does interaction generate the arrow?

**Date:** 2026-06-25
**Direction:** Cross-program — serves the *Diairesis / Between* program's **"Removing the Bound" R2** (the Precision Lemma) and **Q-013 §3** (the arrow witness). Runs on the Direction-5 mechanized Ludics core (M0–M5).
**Status:** **COMPLETE (2026-06-26).** L0–L4 closed; four `--safe` artifacts (EXIT:0). **Q-A: full CONFIRM** (D/N/O); **Q-B: CLOSES** (arrow imported, Risk 2 does not fire). Aggregation: [`../Diairesis/L4-aggregation-2026-06-26.md`](../Diairesis/L4-aggregation-2026-06-26.md). One residual carried (M1′ `ν`-pole). *(Original plan below preserved for the record.)*
**Purpose:** Diairesis has reduced its tout-court generalization problem to a single lemma and a single dilemma, and both turn on **ludics** as the highest-value exotic test. This session frames the two imported questions precisely, maps each onto an *already-built* asset of the mechanized core, names the two ways the prediction could fail, and fixes the report-back structure.

> Reading order: presupposes the Diairesis docs `removing-the-bound.md` (R1–R4, the Precision Lemma), `q013-approach.md` (the dilemma of generation, Horn A / Horn B), and `negation-algebras-prestudy.md` (closure operators = Horn A). On the Isonomia side: Session 09 (M0–M5 mechanization), `lib/Closure.agda` (`Biorthogonal`), `ludics/Core.agda` (`interact`, `_⊥_`).

---

## 0. The headline: the core already contains the answer; this session inspects it

The honest first observation, in the spirit of Session 09's "Direction 5 is a corroboration reflex, not yet a programme": **the mechanized Ludics core was built for the Direction-5 deliverable, but it happens to contain exactly the two structures the Diairesis test must classify.** Specifically:

- `interact : ℕ → Design → Design → Status` is **ℕ-fuel-indexed and deterministic** (M1/M2). The `ℕ` is not incidental — in Diairesis terms it *is* the arrow (the well-founded step-index, the μ-pole), sitting in the type signature of normalisation.
- `lib/Closure.agda`'s `Biorthogonal` is already a **Galois `ClosureOp`** (`pol⁺/pol⁻`, `clo = pol⁻∘pol⁺`). In Diairesis terms a closure operator is the diagnostic of **Horn A** (the negation-algebras pre-study: closure = a climb in a *pre-given* order = imported, terminating at a fixed point).

So the test is **not** new development. It is: (i) read off the (co)algebraic classification the existing objects already wear, (ii) run **two escape-risk checks** that are the only places the prediction could flip, (iii) report a verdict back to Diairesis. The cross-program synergy `removing-the-bound.md` §5 bet on ("nearly free") is real because the substrate is already here.

---

## 1. The two imported questions, and their pass/fail

### Q-A — the Precision Lemma (Diairesis R2 / R1)

> **Diairesis claim under test:** *every precise account of self-differentiation is (co)algebraic.* Ludics is the strongest candidate counterexample, because it is **interactive and pre-logical** — its objects are defined by *how they interact* (orthogonality, biorthogonal completion), not by *construction* (a functor / initial algebra). If "definition by interaction/testing" is a genuinely non-(co)algebraic mode, ludics refutes the Lemma and the Diairesis bound is real.

- **CONFIRM (Lemma holds):** the three Ludics primitives — designs, normalisation, behaviours — each reduce to a (co)algebraic structure (coalgebra / recursion / closure-monad).
- **COUNTEREXAMPLE (Lemma fails, bound is real):** at least one primitive is precise *and* provably not (co)algebraic — "definition by orthogonality" is a third mode, not a closure monad.

### Q-B — the arrow witness (Diairesis Q-013 §3)

> **Diairesis claim under test:** *the arrow (irreversible directedness) is never generated, only imported or presupposed* (the dilemma: any generation is Horn A atemporal-structural = imports, or Horn B temporal-processual = presupposes). Ludics is also the strongest candidate for a **third sense of "generate"** — *interactive* generation (an object brought about by its interaction with its counter-objects) that is neither static construction nor temporal process. If ludics' interaction generates directedness from the *symmetric* Player/Opponent structure, the dilemma's third horn opens and the arrow is reducible.

- **CONFIRM (arrow imported, dilemma holds):** ludics' directedness is carried by the normalisation order / the ℕ-fuel / the daimon — all imported — and the symmetric P/O interaction alone yields no orientation.
- **COUNTEREXAMPLE (arrow generated, dilemma breaks):** orientation is *produced* by the symmetric interaction with no imported reduction-order, fuel, or posited terminal — a genuine interactive tertium.

**One test, three Diairesis items.** Q-A is the Precision Lemma (R1/R2). Q-B is Q-013 §3. And the candidate behind both — "definition/generation by interaction" — is exactly the **third-horn check for R3's exhaustiveness**. Ludics is where a non-structural, non-temporal mode would have to live; one session settles all three.

---

## 2. Inventory — the assets that answer the questions

| Asset | What it is | Which question it classifies |
|---|---|---|
| `ludics/Core.agda` `Design` | finite designs (chronicle-sets / Böhm-tree carrier), M0 carrier decision | Q-A: designs as (co)algebra |
| `ludics/Core.agda` `interact : ℕ → Design → Design → Status` | the deterministic, fuel-indexed normaliser (M1) | Q-B: the locus of the arrow |
| `ludics/Core.agda` `_⊥_` (`∃ n, interact n D E ≡ CONVERGENT`) | orthogonality via convergence-to-daimon | Q-A + Q-B |
| `lib/Closure.agda` `Biorthogonal` (`pol⁺/pol⁻`, galois, `clo`) | the bi-orthogonal closure `B = B^⊥⊥` as a Galois `ClosureOp` | Q-A: behaviours as closure monad |
| `ludics/Interaction.agda` (M2) `interact-det`, `⊥-upward`, `⊥-eventually` | determinacy + fuel-monotonicity of normalisation | Q-B: directedness is the ℕ-index |
| `ludics/Separation.agda` (M3), internal completeness (M4) | the core theorems over `interact` | sanity: the object is the real one |

**Two facts drive the plan** (both already established in the core):

1. **Normalisation is a deterministic reduction, step-indexed by ℕ.** M2 found `interact` is a *function* (no confluence freedom) whose verdict, once decided, is fuel-monotone. The directedness of cut-elimination is carried entirely by the `ℕ` argument — the arrow, made explicit.
2. **Bi-orthogonality is the closure of a Galois connection.** `A ⊆ B^⊥ ⟺ B ⊆ A^⊥` is the defining polarity; `Biorthogonal` already encodes it as `pol⁺/pol⁻` with `clo = pol⁻∘pol⁺`. A closure operator is, by the negation-algebras pre-study, the signature of Horn A.

---

## 3. The decomposition — three primitives, three classifications

The test reduces "is ludics (co)algebraic / does it generate the arrow" to classifying three objects:

- **(D) Designs.** Possibly-infinite alternating justified trees (Böhm-tree / strategy presentation). → predicted **coalgebraic**: the final coalgebra of a "ludics action" functor (action × ramification), with the finite fragment (`ludics/Core`) its well-founded (μ) part. Designs therefore already span **both poles of the bidirectional arrow** (Q-015's μ/ν), both imported.
- **(N) Normalisation.** Cut-elimination as a *reduction relation*; in the core, the ℕ-fuelled `interact`. → predicted **recursive (algebraic) over ℕ**, with the reduction's **directedness = the ℕ-index = the arrow, imported** (Horn B: a reduction runs one way).
- **(O) Orthogonality + behaviours.** `D ⊥ E` via convergence-to-daimon; `B = B^⊥⊥` the testing-stable sets. → predicted **the closure monad of the orthogonality Galois connection**; behaviours = its algebras (Eilenberg–Moore) / closure fixed points. "Definition by testing" = a closure operator = **Horn A** (atemporal-structural, imports the inclusion order it climbs).

If all three classifications hold, **Q-A CONFIRMS** (ludics is (co)algebraic) and **Q-B CONFIRMS** (the only directedness is the imported normalisation order / ℕ-fuel / daimon).

---

## 4. The two escape-risks — the only places the prediction flips

This is the genuine content; everything above is inspection. Name the obstruction precisely (cf. T007's refutation, M2's re-scope):

### Risk 1 (Q-A escape) — is "definition by testing" really a closure monad?
The Lemma-refuting possibility: bi-orthogonal completion is *not* the closure of a Galois connection but a third mode of definition. **Check:** confirm `(-)^⊥` is a genuine Galois connection on `Powerset Design` (`A ⊆ B^⊥ ⟺ B ⊆ A^⊥`) and that `(-)^⊥⊥` is its induced closure — i.e. that `Biorthogonal` instantiated at the *real* `_⊥_` (not the opaque relation) is a `ClosureOp`. **Predicted outcome:** it is (the polarity law is definitional), so the risk is *low and already half-discharged by `lib/Closure.agda`* — but instantiating the opaque `_⊥_` with `interact`'s convergence is the step that has never been done, and it is exactly where a surprise would surface.

### Risk 2 (Q-B escape) — is the directedness intrinsic to the symmetric interaction?
The dilemma-breaking possibility: orientation is *generated* by the symmetric Player/Opponent interaction, with the ℕ-fuel a mere mechanization artifact of `--safe` rather than the real source. **Check:** the P/O alternation is symmetric (swap polarities); the daimon `†` is a *posited* terminal (orientation point); the normalisation order is a reduction (directed). Ask precisely: **can convergence-to-daimon be defined without a directed reduction — purely from the symmetric structure?** **Predicted outcome:** no — convergence is intrinsically directed (you *reach* `†` by reducing), so the ℕ-fuel makes explicit an arrow that native normalisation already imports as its reduction order. But "directedness emerges from symmetric interaction" is the single most interesting way this could fail, and it is the one check worth doing slowly.

---

## 5. Work plan

| Step | What | Depends on | Output / promotion target |
|---|---|---|---|
| **L0** | Classify **designs** (D): exhibit the action-functor whose (final/initial) (co)algebra is the design carrier; confirm finite fragment = μ-part. | M0 carrier | one-page "designs are (co)algebraic" note → Diairesis Q-A(D) |
| **L1** | Classify **normalisation** (N): confirm `interact` is recursion over ℕ; locate the arrow as the reduction order / fuel; record M2's determinacy + monotonicity as the formal statement. | M1, M2 | "the arrow is the ℕ-index" note → Diairesis Q-B(N) |
| **L2** | Classify **orthogonality/behaviours** (O): instantiate `Biorthogonal`'s opaque `_⊥_` with the real `interact`-convergence; confirm `(-)^⊥` is a Galois connection and `(-)^⊥⊥` its closure. **(= Risk 1 check.)** | `lib/Closure.agda`, M1, M4 | "behaviours are the closure monad" note → Diairesis Q-A(O) |
| **L3** | **Risk 2 check:** test whether convergence-to-daimon is definable without a directed reduction; classify the daimon as posited-terminal and P/O as symmetric-duality. | M1, L1 | "directedness imported, not generated" note → Diairesis Q-B |
| **L4** | **Verdicts.** Aggregate L0–L3 into CONFIRM / COUNTEREXAMPLE for Q-A and Q-B; write the report-back (§7). | L0–L3 | the cross-program report → Diairesis registry |

**No Agda strictly required for L0/L1/L3** (classification + the Risk-2 conceptual check ride on the M0–M2 facts already established). **L2 is the one place a small Agda step pays:** instantiate the existing `Biorthogonal` at the real `_⊥_` — which is independently valuable to Isonomia (it is the M4 internal-completeness instantiation the core wants anyway). The synergy runs both ways.

### Execution log

- **L2 — CLOSED (2026-06-25).** Artifact: [`mechanisation/agda/ludics/ClosureMonad.agda`](../mechanisation/agda/ludics/ClosureMonad.agda) (`--safe --without-K`, no postulates/holes, EXIT:0). Report-back: [`Diairesis/L2-closure-monad-2026-06-25.md`](../Diairesis/L2-closure-monad-2026-06-25.md). **Verdict Q-A(O): CONFIRM** — behaviours are the closure monad of the orthogonality Galois connection (closure operator = Horn A); **Risk 1 does not fire.** *Premise correction:* M3 (`Separation.agda`) and M4 (`Completeness.agda`) had already instantiated `Biorthogonal Design Design _⊥_`; the genuinely-new (and Risk-1-deciding) content L2 adds is the **Galois equivalence `A ⊆ B^⊥ ⇔ B ⊆ A^⊥` surfaced at the design level**, which M3/M4 never named. The `⊆`-order the closure climbs is imported (Horn A), so Q-B stays open for L1/L3.
- **L1 — CLOSED (2026-06-26).** Artifact: [`mechanisation/agda/ludics/ArrowIndex.agda`](../mechanisation/agda/ludics/ArrowIndex.agda) (`--safe --without-K`, no postulates/holes, EXIT:0). Report-back: [`Diairesis/L1-arrow-index-2026-06-26.md`](../Diairesis/L1-arrow-index-2026-06-26.md). **Verdict Q-B(N): the arrow is the `≤` order on the ℕ step-index — IMPORTED** (corroborates Horn B). Three facts over the real `interact`: (R) it is recursion over ℕ, with fuel 0 ⇒ ONGOING (`no-fuel-is-ONGOING`, the index gates progress); (F) it is a function (M2 determinacy ⇒ confluence vacuous ⇒ the arrow is not in any branching); (A) a decided verdict is monotone and irreversible along `≤` (`verdict-irreversible`, = M2 `interact-mono-≤`). **Fuel-artifact question (§7.4) answered for the record:** the ℕ-fuel is the *visible form* of normalisation's reduction order, not its source — native non-indexed normalisation imports the same arrow as its reduction order. Also lands **Q-A(N): CONFIRM** (normalisation is recursion over ℕ — (co)algebraic). The Risk-2 escape (convergence definable from symmetric P/O without a directed reduction?) is **deferred to L3**.
- **L3 — CLOSED (2026-06-26). Q-B CLOSES.** Artifact: [`mechanisation/agda/ludics/DaimonOrientation.agda`](../mechanisation/agda/ludics/DaimonOrientation.agda) (`--safe --without-K`, no postulates/holes, EXIT:0). Report-back: [`Diairesis/L3-daimon-orientation-2026-06-26.md`](../Diairesis/L3-daimon-orientation-2026-06-26.md). **Verdict: Risk 2 does NOT fire** — convergence is not definable from the symmetric P/O structure without a directed terminal. Three mechanized facts: **(P)** `no-daimon-no-conv` — if neither design has a daimon act, the run never converges at any fuel (the daimon is a posited `Kind` constructor, required for convergence); **(U)** `dai-wins` — a producer playing † converges against *every* opponent at fuel 1 (orientation flows from † alone, not the pair); **(A)** `swap-LR`/`swap-RL`/`interact-not-symmetric` — the same pair at fuel 1 gives ONGOING vs CONVERGENT, so `interact` is producer-first, not symmetric. The arrow enters the *definition* of convergence as the posited daimon + the reduction's "toward" (Horn B, definitional level). **Steelman handled:** a "constitutive/primitive" daimon (Roberts parallel) relocates the irreducibility without making the arrow *generated* — no tertium either way. **Residual (M1′):** the infinitary `ν`-pole is predicted to import the arrow the same way (stated, not proven) — for L4. **Promotion:** Q-013 §3 witness **cleared**; R3 exhaustiveness's last candidate **closed**. Remaining: L0 (designs as coalgebra) for a full Q-A CONFIRM, then L4.
- **L0 — CLOSED (2026-06-26). Q-A COMPLETE.** Artifact: [`mechanisation/agda/ludics/DesignAlgebra.agda`](../mechanisation/agda/ludics/DesignAlgebra.agda) (`--safe --without-K`, no postulates/holes, EXIT:0). Report-back: [`Diairesis/L0-design-algebra-2026-06-26.md`](../Diairesis/L0-design-algebra-2026-06-26.md). **Verdict Q-A(D): CONFIRM** — over the action functor `F Y = ⊤ ⊎ (Act × Y)`, the carrier `Design = List Act` is the **initial algebra μF**: `into` is the structure map, the catamorphism `⟦ A ⟧ = foldr` is the unique F-algebra homomorphism (`fold-hom` + `foldr-unique` = initiality), and **Lambek holds concretely** — `into`/`uncons` mutually inverse give `Design ≅ F Design`, the literal `X ≅ F(X)` fixed point. The μ-pole, imported. **Q-A now CONFIRM at all three objects** (D μF / N ℕ-recursion / O closure monad): ludics falls wholly inside the (co)algebra paradigm. **Residual:** the infinitary M1′ Böhm-tree = final coalgebra νF, stated not proven (needs coinduction; outside this inductive `--safe` corpus) — for L4.
- **L4 — CLOSED (2026-06-26). SESSION COMPLETE.** Aggregation report-back: [`../Diairesis/L4-aggregation-2026-06-26.md`](../Diairesis/L4-aggregation-2026-06-26.md). **Q-A: full CONFIRM** — the arrow's two components split cleanly across the checks (progression → reduction order / ℕ-index [L1]; orientation → posited daimon [L3]), exhausting its structure, so **Q-B CLOSES** with no component left for the symmetric P/O interaction to have generated. **Propagation:** Q-013 §3 witness cleared → the §2 dilemma is exhaustive across all three serious candidates (Hegel/Horn A, physics/Horn B, ludics/Horn B), predicted **FAIL (arrow irreducible) at thesis-grade**; Precision Lemma **CONFIRM at its strongest site**, bound removable to Church–Turing grade for precise accounts. **Cross-witness:** physics and ludics produced the *same* steelman (Roberts T-violation ≈ Girardian constitutive daimon) — relocate-not-remove, no generation either way. Registered into [`../Diairesis/q013-approach.md`](../Diairesis/q013-approach.md) and [`../Diairesis/removing-the-bound.md`](../Diairesis/removing-the-bound.md). **Residual:** M1′ `ν`-pole (infinitary `νF` + coinductive normaliser), predicted-imported, stated not proven.

---

## 6. Predicted verdict and criteria (flagged as prediction)

**Predicted: both CONFIRM.** Ludics is (co)algebraic (designs coalgebraic; normalisation recursive; behaviours a closure monad), so **Q-A confirms the Precision Lemma** — and confirms it at the *strongest* site, the framework most likely to escape (interactive, pre-logical), which is why a clean collapse here is worth more than ten easy confirmations. And the only directedness in ludics is the imported normalisation order / ℕ-fuel / posited daimon, so **Q-B corroborates Horn B** — "interactive generation" collapses to Horn A (a closure operator), opening no third horn, so **R3's dilemma stays exhaustive** across its last serious candidate.

If the prediction holds, the Diairesis status upgrades: the Precision Lemma gains its strongest independent confirmation (Church–Turing-grade support, one more formalization converging), and Q-013's predicted FAIL (arrow irreducible) clears its last witness.

**The honest alternative, stated plainly:** if Risk 1 or Risk 2 *fires* — if bi-orthogonal definition is not a closure monad, or if convergence is definable from the symmetric interaction without imported direction — then ludics is the counterexample, the Diairesis bound is real (Q-A) or the arrow is reducible (Q-B), and *that* is the more important result. The test is genuine; the prediction is not assumed.

---

## 7. Report-back contract (what to send back to Diairesis)

For each of Q-A and Q-B, the execution report should record:

1. **The classification**, object by object (D / N / O): which (co)algebraic structure each is, or where it provably is not.
2. **The verdict:** CONFIRM or COUNTEREXAMPLE, with the deciding fact.
3. **The risk checks:** did Risk 1 (Galois-closure instantiation at real `_⊥_`) and Risk 2 (directedness-from-symmetry) hold or fire? This is where a surprise lives.
4. **The fuel-artifact question (Q-B):** does the result depend on the ℕ-fuel presentation, or would native (non-step-indexed) ludics normalisation import the arrow the same way (as reduction order)? State explicitly — this is the one place a critic will press.
5. **Promotion:** which Diairesis item moves (Precision Lemma → confirmed / refuted; Q-013 §3 → witness cleared / tertium found; R3 exhaustiveness → last candidate closed / third horn opened).

---

## 8. Honesty boundary and handoff

**Boundary.** This classifies *the mechanized finite core* (M0–M5) and the standard Böhm-tree/strategy presentation of ludics. It is a *within-paradigm-relative* test in the Diairesis sense — it asks whether ludics *falls inside* the (co)algebra paradigm, which is precisely Q-A. It does **not** settle the infinitary normaliser (M1′) independently; if the finite fragment is (co)algebraic and the arrow imported there, the report should flag whether the coinductive (M1′) extension could change either verdict (predicted: no — coinduction is the ν-pole, still imported).

**Handoff.** Enter as an Isonomia session under a cross-program tag; on completion, the report-back (§7) returns to the Diairesis registry against `removing-the-bound.md` (R2 / Precision Lemma) and `q013-approach.md` (§3 witness). Immediate first step: **L2** — instantiate `Biorthogonal` at the real `interact`-orthogonality (which doubles as the M4 internal-completeness step), since it is the one rung needing code and it discharges Risk 1, the higher-stakes of the two risks.

## 9. Bibliography

- Diairesis: `removing-the-bound.md` (Precision Lemma, R1–R4), `q013-approach.md` (dilemma of generation), `negation-algebras-prestudy.md` (closure = Horn A), `q016-run.md` (FinSet witness; the (co)algebra/arrow split).
- Isonomia: Session 09 (M0–M5), `LUDICS_THEORY_GLOSSARY.md` (designs, orthogonality, behaviours, internal completeness), `lib/Closure.agda` (`Biorthogonal`), `ludics/Core.agda` / `ludics/Interaction.agda` (`interact`, `_⊥_`, determinacy, monotonicity).
- Upstream: Girard 2001, *Locus Solum*; Curien, *Introduction to ludics* (designs as abstract Böhm trees); Terui, *Computational ludics* (designs as coinductive terms — the coalgebraic reading L0 leans on).