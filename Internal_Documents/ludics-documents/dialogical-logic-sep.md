# Dialogical Logic (SEP) — Field Guide for Builders
**Version:** 2025-09-15  •  **Source:** Stanford Encyclopedia of Philosophy, “Dialogical Logic” (Lorenzen–Lorenz tradition)

This guide distills the SEP entry into a practical spec for Mesh. It covers the two levels of dialogical logic—**play** (particle + structural rules) and **strategy**—and provides an engine preset (SR0–SR3 / SR1c), UI hooks, and tests.

---

## 1) What dialogical logic is
- **Play level**: a single dialogue governed by **particle rules** (meaning of ∧, ∨, →, ¬, ∀, ∃) and **structural rules** (who may move, when a play ends).
- **Strategy level**: sets of plays; **validity** means **the Proponent (P) has a winning strategy** for the thesis, i.e., P wins against all legal Opponent (O) moves.

> Pragmatist meaning: a constant’s meaning is its challenge/defence behavior. Demonstration = constructing plays showing how P can win.

---

## 2) Particle rules (local meaning)
Let **X** be the current holder of a statement and **Y** the opponent of that statement.
- **Conjunction** `X: φ ∧ ψ` → `Y: ?L^∧ | ?R^∧`; then `X: φ` or `X: ψ` respectively.
- **Disjunction** `X: φ ∨ ψ` → `Y: ?∨`; then **X chooses** and states a disjunct.
- **Implication** `X: φ ⊃ ψ` → `Y: φ`; then `X: ψ`.
- **Negation** `X: ¬φ` → `Y: φ` (role flips, no further defence for `¬`).
- **Universal** `X: ∀x φ(x)` → `Y: [x/aᵢ]`; then `X: φ(aᵢ)`.
- **Existential** `X: ∃x φ(x)` → `Y: ?∃`; then `X: φ(aᵢ)` for a fresh `aᵢ`.

**Micro‑example**: thesis `(p ∧ q) ⊃ p`
```
O: (p ∧ q)         — attack → by stating antecedent
P: ?L^∧            — P attacks O’s ∧ (Last‑Duty‑First)
O: p               — O defends ∧ with left conjunct
P: p               — P defends → by stating consequent
(O has no legal move) ⇒ P wins.
```

---

## 3) Structural rules (global constraints)

**SR0 — Start.** P states the thesis; O chooses a **repetition rank** `n` (max number of repeats on the same target); then P chooses his rank.  
**SR1i — Intuitionistic play.** React only to earlier moves; at most `n` repetitions per target; **Last‑Duty‑First**: defend only the latest open attack.  
**SR2 — Formal (Copy‑Cat).** **P** may play an **atomic** formula only if **O** has played it earlier (analyticity).  
**SR3 — Win condition.** On your turn with **no legal move** ⇒ you lose (the other wins).

**Classical variant.** Replace SR1i by **SR1c** to validate classical tautologies (tweaked repetition policy).

---

## 4) Strategy level (validity)
A **strategy** for X maps any legal, non‑terminal play (ending with Y’s move) to an X‑move that keeps the play legal. A **winning strategy** ensures all terminal branches end in X’s win. **Validity** of a thesis = P has a winning strategy under the chosen SR‑rules.

---

## 5) Mesh integration — engine preset & enforcement

### 5.1 Engine preset (see `engine-presets-dialogical.md` for the checklist)
Two presets:
- `dialogue:intuitionistic` → {{ SR0, SR1i, SR2, SR3 }}
- `dialogue:classical`      → {{ SR0, SR1c, SR2, SR3 }}

A minimal TypeScript shape:
```ts
export type DialogicalPreset = 'dialogue:intuitionistic'|'dialogue:classical';

export interface EngineDialogicalPolicy {{
  kind: DialogicalPreset;
  repetitionRankP: number; // SR0
  repetitionRankO: number; // SR0
  enforceCopyCatSR2: boolean; // SR2
  lastDutyFirst: boolean;     // SR1i/SR1c schedules latest open attack first
}}
```

### 5.2 Gating legal moves
- **Particle dispatcher**: for each connective/quantifier, generate allowed challenges/defences as above.
- **SR1i/SR1c**: track open attacks; allow **at most n** repeats per target; **only defend the last open attack**.
- **SR2**: when `polarity === P` and the move is **atomic**, check it has been uttered by **O** earlier in the play; otherwise, reject.
- **SR3**: when no legal move exists on your turn, the play ends with opponent victory.

### 5.3 Strategy explorer (validity)
Bound search by ranks from SR0:
1. Unfold the finite dialogue tree (branching only on permitted particle/structural moves).
2. Compute if a **P‑strategy** exists (backward induction on the finite tree).  
Return a certificate (selected replies) to display as a strategy.

---

## 6) UI hooks
- **Engine panel**: toggle `Dialogical mode` (intuitionistic/classical), set ranks (`n_O`, `n_P`), and toggle `Copy‑Cat (SR2)`.
- **Move helper**: particle prompts (`?L^∧`, `?R^∧`, `?∨`, `[x/aᵢ]`, `?∃`) and disable illegal entries automatically.
- **Trace**: annotate when SR2 blocks a move and when SR3 triggers a win; show current open attacks (for LDF).

---

## 7) Tests & fixtures
- `(p ∧ q) ⊃ p` should be **valid** (P‑winning strategy exists).
- `p ∨ ¬p` is **valid under SR1c** (classical) but **not** under SR1i (intuitionistic).
- SR2 negative test: reject P introducing a fresh atom not played by O.

---

## 8) Notes & pointers
- Dialogical logic is **rule‑packable**: many logics arise from the **same particle rules** with different **SR‑packs**.
- SR2 provides **analyticity** akin to “copy‑cat” in other interactive frameworks.
- For deeper context see SEP: “Dialogical Logic” (Lorenzen–Lorenz line).
