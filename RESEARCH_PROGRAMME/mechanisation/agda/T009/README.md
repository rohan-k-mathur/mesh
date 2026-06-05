# T009 — branching Smyth-minimal separating context, Agda mechanisation

Mechanisation of the two **load-bearing lemmas** of
[T009](../../../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md)
(`established`, cross-checked 2026-06-05) — the abstract proof of
[C013](../../../03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md)
that, over daimon-closed concession-**trees**, the Smyth-least separating
set of a branching dispute is the per-line first-divergence antichain
`M(D, E)`. Status: **type-checks without postulates or holes** (`--safe
--without-K`). This is *evidence for* T009 (Direction 5, the parallel
mechanised check); T009 itself is already established by the human proof +
non-author cross-check.

## What this proves

The [session-06 scope](../../../10_IDEATION_SESSIONS/06-c013-abstract-proof-scoping-2026-06-05.md)
identified two load-bearing lemmas; this file mechanises exactly those, on
a concrete locus model (`Locus = List ℕ`, `⊑` = the segment-wise prefix
order — faithful to
[`separation.isPrefixLocus`](../../../../packages/ludics-engine/separation.ts)).

- **§1 — the locus model is a partial order.** `⊑` (prefix: `a ⊑ b ⟺ ∃ c,
  a ++ c ≡ b`) is reflexive, transitive, and antisymmetric into `≡`. The
  bridge lemma `incomp⇒≢` (incomparable ⟹ unequal, since equal loci are
  trivially comparable) connects the order theory to match-by-equal-address.

- **§2 — O-parity-b, the CRUX (locus-disjoint non-interference).** Below a
  branch node `β`, two lines descending into **distinct** children `i ≠ j`
  (T005: distinct subaddresses per argument) occupy `⊑`-**incomparable**,
  hence **unequal**, addresses (`branch-incomp`). Since Ludics
  normalisation matches a positive only against a dual at the **same**
  address (`Matches.same-address`, mirroring the kernel's
  `findNextNegativeAtLocus`), no act of one line can ever match an act of
  another (`no-cross-line-match`). This is the non-interference that
  licenses the per-line factorisation O-parity-c ("run per line and
  aggregate"). It is the only refutation risk the scope pass flagged, and
  it discharges.

- **§3 — O-smyth (the powerdomain order fact).** For any `⊑`-antichain `M`,
  the subset-refusal family `{ U : ∅ ≠ U ⊆ M }` (separating set `U`) has a
  **unique** Smyth-least element under `S ≤ˢ T ⟺ ∀ t∈T ∃ s∈S, s ⊑ t`
  (harness `smythLeq`), and it is `M`: `M-smyth-below` (M is `≤ˢ`-below
  every separating set) and `M-smyth-unique` (the only separating set
  `≤ˢ`-below `M` is `M`, by antisymmetry within the antichain), combined in
  `SmythLeast-is-M`. Pure order theory — the additive-free fragment enters
  only **upstream** (to make `M` an antichain), never here.

- **§4 — non-vacuity.** The harness fixture `["0.1.2", "0.2.2"]` (two lines
  branching at the root into children 1 and 2) as the concrete antichain
  `M = (1∷2∷[]) ∷ (2∷2∷[]) ∷ []`: `incomp-ab` (O-parity-b fires) and
  `ac-M` / `M-is-smyth-least` (O-smyth fires) are discharged on the nose.

## What this does NOT prove (human-review obligations)

Per the Register policy, and because T009 is already established by the
human argument:

- That `Matches` faithfully captures the kernel's match-by-equal-address
  rule (`findNextNegativeAtLocus`) — it is the matching primitive, mirrored
  from the source, not built from `stepCore`.
- **O-parity-a / O-perline:** the per-line reduction to the **linear T008**
  base case (Lemma 0 parity; concessions converge / refusal diverges at
  `ξ_ℓ`) is verbatim T008, not re-mechanised here — it adds no content
  beyond the base case this branching companion sits atop.
- **O-faithful:** that `stepCore`'s least-index scheduler is unfaithful on
  the **combined** tree (the expected, parked off-thread mis-divergence) is
  a kernel-bridge spec characterised in T009 §Faithfulness, not an abstract
  lemma. The faithful computation runs `stepCore` **per line**.

## Relationship to the rest of the mechanisation

Self-contained (concrete `List ℕ` locus model), so it does not import
`lib.Order` — but it is the order-theoretic sibling of `lib/Order.agda`'s
`Behaviour.antichain` (the same "two minimal/incomparable elements ordered
by `⊑` are equal" observation, here in the directly-usable membership
form). The `⊑` partial-order facts mirror
[`separation.ts`](../../../../packages/ludics-engine/separation.ts); the
Smyth order mirrors the harness
[`branching-normalization.test.ts`](../../../../tests/bridge/branching-normalization.test.ts).

## Build

Tested against **Agda 2.7.0.1**, **agda-stdlib v2.0**, `--safe
--without-K`. From `RESEARCH_PROGRAMME/mechanisation/agda`:

```
agda T009/T009.agda
```

Type-checks with no postulates, no holes, no warnings (also clean with
`--ignore-interfaces`).
