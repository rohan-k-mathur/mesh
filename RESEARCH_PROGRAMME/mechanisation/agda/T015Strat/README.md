# T015-Strat — the ⊕-resolution ↔ strategy game isomorphism

Handoff **item 2**: upgrade
[T015](../../../02_THEOREMS_AND_PROOFS/T015-additive-realizability-keystone.md)'s
ONE-SHOT reading to the full `⊕`-resolution ↔ strategy game isomorphism for
the general (branching) preferred dispute game. Status: **type-checks
without postulates or holes** (`--safe --without-K`). Evidence under the
Theorem Register policy — T015 is already `established`; this retires its
"pending strategy-isomorphism" residual at the abstract game-tree level
(see *Scope*).

## The gap it closes

T015 settled stable + preferred-admissibility via the **one-shot** reading
(LB1): a commit-set + a single round of orthogonality per attacker,
asserting `∃ρ` without exhibiting the full game strategy. Its honest
residual ([T015 §Scope](../../../02_THEOREMS_AND_PROOFS/T015-additive-realizability-keystone.md),
[C011](../../../03_CONJECTURES/C011-additive-preferred-games-bridge.md)) was
a `⊕`-resolution-vs-strategy isomorphism for the **general** preferred game.

## The model (faithful to the dispute engine)

Faithful to [`lib/bridge/dispute.ts`](../../../../lib/bridge/dispute.ts)
`interact` and [`disputeAdditive.ts`](../../../../lib/bridge/disputeAdditive.ts)
`buildAdditiveDisputeDesign`, the dispute is an alternating **AND-OR tree**:

| `Game` | role | reading |
|--------|------|---------|
| `con gs` | CON to move | the opponent's **external `&`-choice** of attack line — PRO must answer **every** attacker (AND / ∀). `con []` = CON stuck → PRO daimon †, **PRO wins** |
| `pro gs` | PRO to move | the proponent's **internal `⊕`-choice** of defence — PRO needs **some** winning counter (OR / ∃). `pro []` = PRO stuck, **PRO loses** |

The full-game verdict is the AND-OR fixpoint (Modgil–Caminada
preferred/credulous game): `wins (con gs) = ⋀ wins gs`,
`wins (pro gs) = ⋁ wins gs`.

A **`⊕`-resolution = PRO strategy** is the type `Res g`: commit to one child
at each PRO node (`pickHere`/`pickThere`) and resolve every CON child
(`conAll`/`AllRes`). `evalRes` follows a fixed resolution — the one-shot
reading (commit to the chosen defence, conjoin over the answered attacks).
`pro []` has **no** resolution (PRO stuck); `con []` has the trivial
`conAll []` (CON stuck → daimon).

## What this proves

```agda
strategy-iso : ∀ g → (wins g ≡ true) ⇔ (Σ[ r ∈ Res g ] (evalRes r ≡ true))
```

The branching game verdict — an `∃` over strategies hidden inside the AND-OR
`⋁` — **is realized by a concrete winning `⊕`-resolution**, and conversely:

- **`sound`** (`soundAny`/`soundAll`): `wins g ≡ true` builds a concrete
  winning strategy — the `⋁` existential at each PRO node is **witnessed** by
  the chosen defence (`pickHere`/`pickThere`), the `⋀` at each CON node by
  resolving every attack.
- **`complete`** (`completePro`/`completeAll`): any winning strategy proves
  `wins g ≡ true` — `evalRes`-following a resolution implies the AND-OR
  verdict.

`Res` **is** the strategy type, so the "isomorphism" is the identity on the
shared choice-function type; the content is the **verdict-correspondence** —
T015's one-shot `∃ρ` upgraded to a full-tree strategy that is exhibited, not
merely asserted. It is **n-unbounded**: arbitrary finite game trees, proved
by structural induction (mutually with the list folds).

`module Worked` grounds it: `g-win` (PRO wins, `win-strategy` exhibits the
resolution via `strategy-iso`) and `g-lose` (PRO stuck — `no-strategy` shows
`Res (pro [])` is uninhabited, so no winning strategy exists).

## Scope / what this is *not*

- It does **not** re-derive Modgil–Caminada **adequacy** (that this game
  equals the Dung preferred extensions) — that stays cited (C011
  bibliography). Here the game tree is the abstract object; the theorem is
  the **strategy-realization of its verdict**.
- The `&`/`⊕` placement faithfulness to `⟦·⟧₊` (which loci get which opener)
  is human review ([`disputeAdditive.ts`](../../../../lib/bridge/disputeAdditive.ts)).
- The one-shot vs strategy *equivalence at the level of T015's commit-set
  predicates* (that `evalRes` coincides with `Admissible`/`Orth` of
  [T015.agda](../T015/T015.agda)) is the natural next link; here `evalRes`
  is the resolution-following verdict on the game tree.

## Build

Requires Agda 2.7.0.1+ and `agda-stdlib` v2.0 (pinned); resolves
[`T012`](../T012/T012.agda) (for `_⇔_`) via
[`../mesh-substrate.agda-lib`](../mesh-substrate.agda-lib). From
`mechanisation/agda`:

```sh
agda T015Strat/T015Strat.agda
```

Expected: clean, no errors/warnings/unsolved metas.

## Correspondence

| Toy (this file)         | Object                                                       |
|-------------------------|--------------------------------------------------------------|
| `Game` (`pro`/`con`)    | the alternating dispute tree (⊕ / & openers)                 |
| `wins` (`anyW`/`allW`)  | the AND-OR preferred-game verdict (⋁ defences / ⋀ attacks)   |
| `Res` / `AllRes`        | a `⊕`-resolution = PRO strategy (choice function)            |
| `evalRes`               | the one-shot reading: follow a fixed resolution              |
| `sound` / `complete`    | verdict ⇒ winning strategy / winning strategy ⇒ verdict      |
| `strategy-iso`          | the isomorphism (verdict ⇔ a winning ⊕-resolution exists)    |
| `Worked.g-win`/`g-lose` | non-vacuity + the win/lose boundary                          |
