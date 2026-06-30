# T015 — additive realizability keystone, Agda mechanisation

Mechanisation of
[T015](../../../02_THEOREMS_AND_PROOFS/T015-additive-realizability-keystone.md)
(`established`, cross-checked 2026-06-28): the realizability trichotomy —
which Dung semantics the additive `&`/`⊕` interaction reads off
orthogonality, and which it cannot. Status: **type-checks without
postulates or holes** (`--safe --without-K`). This is *evidence for* T015
under the Theorem Register policy; T015 itself is already established by the
human proof + non-author cross-check.

It discharges the **"(d) n-unbounded mechanisation"** non-blocking item from
the T015 cross-check: the abstract clauses (1)–(3) are proved parametric
over an arbitrary argument set and attack relation (so `n`-unbounded), and
the two no-go / boundary clauses (4)–(5) are mechanised on their canonical
witnesses (those clauses are inherently about specific small AFs).

## What this proves

`module AF (Arg) (_⇝_)` fixes an abstract AF. An extension is a **decidable
subset** `Ext = Arg → Bool` (matching the substrate's finite, classical
Dung semantics — `a ∈ E = T (E a)`, membership decidable via `T-dec`). The
Dung notions (`ConflictFree`, `AllAttacking`, `Stable`, `Defends`,
`Admissible`) and the additive one-shot predicates (`Answered`, `Orth`) are
defined directly.

- **§1.2 clause 1 — stable.** `stable⇔cf×orth : Stable E ⇔ (ConflictFree E ×
  Orth E)`. `orth→allatt` (orthogonality forces all-attacking, no
  decidability) and `allatt→orth` (the converse, via decidable membership)
  are the two halves. So *conflict-free + orthogonal to the universal
  `&`-test = conflict-free + all-attacking = stable*.
- **§1.3 clause 2 — admissibility is interactive, no descent.**
  `stable→admissible : Stable E → Admissible E` — the committed
  all-attacking set defends each member in **one** round (the would-be
  attacker is either in `E`, impossible by conflict-freedom, or already
  countered). `∅-admissible` shows the empty set is admissible, so a
  preferred extension always exists (sound skeptical guard). This is the
  "no PRO-no-repeat trap" content: the descent is provably unnecessary.
- **§1.4 clause 3 — preferred.** `Preferred E = Admissible E × (E is
  ⊆-maximal among admissible)`; `preferred→admissible`. Preferred = the
  ⊆-maximal admissible sets.
- **§2 clause 4 — maximality no-go.** On the canonical witness `a ↔ b`, `c`
  isolated (`module NoGo`): `Ec-admissible` and `Eac-admissible` show `{c}`
  and `{a,c}` are *both* admissible (both pass every per-attacker defense
  test), `Ec⊆Eac` with `a∈Eac` / `a∉Ec` shows the inclusion is proper, and
  `Ec-not-preferred` concludes `{c}` is admissible but **not** preferred.
  No per-pair orthogonality verdict separates them — only the global ⊆ does,
  so maximality is a selection, not an interaction verdict.
- **§3 clause 5 — boundary.** On the 2-cycle `a ↔ b` (`module Boundary`):
  `Ea-stable` shows `{a}` is stable, while `a-not-defended-by-∅` shows `a`
  is not defended by `∅`, so the grounded least-fixpoint descent from `∅`
  never admits it (grounded(`a↔b`) = ∅). `boundary` packages
  `a ∈ {a}` stable-accepted yet grounded-rejected: the descent does **not**
  compute stable.

The two universal tests are distinct, and **clause 4 turns on it**: the
*stable* test (`Orth`/`AllAttacking`) ranges over all of `A`; the
*admissibility* test (`Defends`) ranges only over attackers of committed
members. `{c}` passes the defense test (admissible) but fails the
all-attacking test (`a`, `b` unanswered) — admissible, not stable.

## What is a parameter (the inherited obligations, not re-proved here)

In line with T015's honest scope (LB1/LB2) and the T001/T002/C004/T012
caveats:

- **LB1 (one-shot reading)** — acceptance via commit-set + one-shot
  orthogonality, modelled by the per-attacker `Defends` / `Answered`
  predicates rather than the fuel-bounded grounded descent. The `&` = ∀
  reading (pool superposition = conjunction) is **T015 Step A** (shared
  with [T012](../T012/README.md)).
- **LB2 (universal test ranges over all of `A`)** — built into `Orth`.
- **⟦·⟧₊ / `stepCore` ⇓ † faithfulness** to these set-level predicates
  (the dispute encoding,
  [`disputeAdditive.ts`](../../../../lib/bridge/disputeAdditive.ts)) — human
  review.
- **Strategy-isomorphism** (handoff item 2) — now mechanised separately in
  [`../T015Strat/T015Strat.agda`](../T015Strat/T015Strat.agda): the full
  `⊕`-resolution ↔ strategy game isomorphism (the branching preferred-game
  verdict ⇔ a concrete winning `⊕`-resolution). This file is the one-shot
  reading; T015Strat is the strategy upgrade.

## Build

Requires Agda 2.7.0.1+ and `agda-stdlib` v2.0 (pinned). Resolution via
[`../mesh-substrate.agda-lib`](../mesh-substrate.agda-lib). From
`mechanisation/agda`:

```sh
agda T015/T015.agda
```

Expected output: clean, no errors, no warnings, no unsolved metas.

## Correspondence to T015

| Toy (this file)                  | T015 object                                              |
|----------------------------------|----------------------------------------------------------|
| `AF (Arg) (_⇝_)`                 | a finite AF `F = (A, ⇝)`                                 |
| `Ext = Arg → Bool`               | an extension `E` (decidable subset / commit-set)         |
| `ConflictFree` / `AllAttacking`  | Dung conflict-free / all-attacking                       |
| `Stable` / `Admissible`          | stable / admissible extensions                           |
| `Answered` / `Orth`              | the universal `&`-test (LB2) and orthogonality to it     |
| `Defends`                        | the one-shot per-attacker defense test (LB1)             |
| `stable⇔cf×orth`                 | clause 1 (stable, one-shot)                              |
| `stable→admissible`/`∅-admissible`| clause 2 (admissibility interactive, no descent)        |
| `Preferred` / `preferred→admissible` | clause 3 (preferred = ⊆-maximal admissible)         |
| `NoGo` (`{c}` ⊊ `{a,c}`)         | clause 4 (maximality non-interactive, the no-go)         |
| `Boundary` (`a↔b`, `{a}`)        | clause 5 (grounded descent ≠ stable)                     |
