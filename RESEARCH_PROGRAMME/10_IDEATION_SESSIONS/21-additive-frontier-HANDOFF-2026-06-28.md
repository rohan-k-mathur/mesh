# Additive frontier — thread close-out & handoff (2026-06-28)

Companion to [session 21](21-additive-layer-translation-spec-stable-first-2026-06-28.md).
Summarises what this thread established (Q-039/C011, Q-002/C002) and lists the
remaining, scopable items for a fresh thread.

## What was established

**The bet.** Session 12 conjectured that preferred/stable game-branching (semantics
axis) and multi-agent Reading C (participant axis) are the *same* `&`/`⊕` algebra,
so one additive layer serves both. This thread built that layer and confirmed the
bet on both axes — the cluster did **not** split.

**Shared additive layer (Steps A–D).**
- **A** — kernel additive primitive verified in isolation: one mechanism, exclusive
  superposition at an `isAdditive` opener ([`stepcore-additive.test.ts`](../../tests/bridge/stepcore-additive.test.ts)).
- **B** — `⟦·⟧₊` emitter + ⊕/& acceptance predicate reproduce grounded
  ([`disputeAdditive.ts`](../../lib/bridge/disputeAdditive.ts), [`additive-internalisation.test.ts`](../../tests/bridge/additive-internalisation.test.ts)).
  Finding: the `&`/`⊕` duality lives in the **design-pool quantifier**, not two flags.
- **C** — stable PASSES via the commit-set ⊥ universal &-test; the grounded descent
  *cannot* compute stable (2-cycle witness). 
- **D** — preferred = realizability characterization: admissibility interactive,
  ⊆-maximality a bolted-on global constraint ([`preferred-stable-additive.property.test.ts`](../../tests/bridge/preferred-stable-additive.property.test.ts)).

**Keystones (both established, cross-checked).**
- **[T015](../02_THEOREMS_AND_PROOFS/T015-additive-realizability-keystone.md)** — semantics axis: realizability trichotomy (grounded by descent; stable/preferred-admissibility by `&`-orthogonality; maximality a constraint).
- **[T012](../02_THEOREMS_AND_PROOFS/T012-reading-c-conservative.md)** — participant axis: multi-agent Reading C ≡ conjunction of bilateral pairs, nesting- and shift-invariant for all `|W|` (3-agent + polarity-shift + `|W|`≤6 corroborated, [`reading-c-conservativity.test.ts`](../../tests/bridge/reading-c-conservativity.test.ts)).

Bridge suite 15 suites / 95 tests green. Q-002 resolved (abstract-AF); Q-039/C011 stable+preferred branch settled; C002 settled.

## What it entails

A principled line between what deliberation **computes** off interaction (grounded,
stable, preferred-admissibility) and what it **selects** by global constraint
(maximality). Multi-party deliberation reduces with no verdict loss to nested
two-party dialogues — underwriting participant-anonymisation, the design-set vs
-pair API, and unblocking Q-004 front (a) (participation-closure) on abstract AFs.

## Remaining items (scopable in a new thread)

1. **T012 ASPIC+/structured-`B`** — lift Reading-C conservativity past abstract AF; full mid-proof polarity re-typing (vs. branch-reorder).
2. **T015 strategy-isomorphism** — upgrade the one-shot reading to the full ⊕-resolution↔strategy game isomorphism for general preferred.
3. **n/k-unbounded mechanisation** — Agda for both keystones (pen-proofs elementary; tests are n≤3, |W|≤6).
4. **Q-004 front (a)** — wire substrate forward-closure into the `ForwardClosure` record now that participation-closure is fixed.
5. **Cross-room / ratified-subgraph** — preferred/stable over ratified subgraphs (session 13 governance dimension); transport (Q-006).
