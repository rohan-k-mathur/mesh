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

1. **T012 ASPIC+/structured-`B`** — lift Reading-C conservativity past abstract AF; full mid-proof polarity re-typing (vs. branch-reorder). **First increment 2026-06-29** — [`T012Struct/T012Struct.agda`](../mechanisation/agda/T012Struct/T012Struct.agda): the ⋀-aggregation lifts **verbatim** to structured witnesses (ASPIC+ attack-type + read-polarity, clauses 1/2/4 reuse `ReadingC`); clause 3 done under **genuine mid-proof re-typing** (`retype-neutral` — stronger than reorder), riding on the substrate cut-symmetry `conv-pol-sym`, shown non-vacuous (`conv-pol-sym-fails`). **Second increment 2026-06-29** — [`T012Aspic/T012Aspic.agda`](../mechanisation/agda/T012Aspic/T012Aspic.agda): genuine ASPIC+ argument **trees** (premises/rules/conclusions + contrariness); the three attack types **derived** from structure; the ASPIC+ restrictions as theorems (`firm-not-underminable`, `strict-not-rebuttable`); the re-typing **symmetry classification** (`rebut-sym` fixed point vs. `Witness` undermine↦rebut reorientation) grounding `conv-pol-sym`. Both `--safe --without-K`, no postulates/holes. **Still open:** wire `typeOf` into T012Struct's `convS` end-to-end; derive `conv-pol-sym` from a kernel ⟦·⟧₊ model (needs ludics substrate polarity re-typing, which does not exist yet). **Self-contained portion CLOSED 2026-06-29** — [`T012End2End/T012End2End.agda`](../mechanisation/agda/T012End2End/T012End2End.agda) wires structural attacks → derived `typeOf` → T012Struct witnesses → Reading-C verdict + re-typing end-to-end (`swOf`, `derived-*`, `rc`, `rc-retyped`). **Only blocked residual:** `conv-pol-sym` from a kernel ⟦·⟧₊ model (substrate polarity re-typing does not exist; `Action.polarity` static).
2. **T015 strategy-isomorphism** — upgrade the one-shot reading to the full ⊕-resolution↔strategy game isomorphism for general preferred. **Done 2026-06-29** — [`T015Strat/T015Strat.agda`](../mechanisation/agda/T015Strat/T015Strat.agda): `strategy-iso : wins g ≡ true ⇔ Σ (r : Res g). evalRes r ≡ true` — the branching AND-OR preferred-game verdict (⋁ defences / ⋀ attacks) is realized by a concrete winning ⊕-resolution (= PRO strategy), and conversely; n-unbounded over finite game trees, `--safe --without-K`, no postulates/holes. **Residual:** Modgil–Caminada adequacy (game = Dung preferred extensions) tying the tree to a specific AF stays cited, not re-derived.
3. **n/k-unbounded mechanisation** — ~~Agda for both keystones (pen-proofs elementary; tests are n≤3, |W|≤6).~~ **Done 2026-06-29** — [`T012/T012.agda`](../mechanisation/agda/T012/T012.agda) (all four clauses k-unbounded; retires T012 item (c)) and [`T015/T015.agda`](../mechanisation/agda/T015/T015.agda) (realizability trichotomy: clauses 1–3 n-unbounded, no-go (4) / boundary (5) on canonical witnesses; retires T015 item (d)). Both `--safe --without-K`, no postulates/holes. Residual: LB1/LB2 + `&`=∀ (T015 Step A) and ⟦·⟧₊-fidelity are human-review parameters; strategy-iso = item 2.
4. **Q-004 front (a)** — ~~wire substrate forward-closure into the `ForwardClosure` record now that participation-closure is fixed.~~ **Done 2026-06-29** — [`C004.agda §4`](../mechanisation/agda/C004/C004.agda) (`module Reachability`/`module AbstractAF`) constructs `Reach` as move-graph reachability and proves the three closure axioms; front (a) discharged on the abstract-AF fragment, residual is move-graph faithfulness (human review). Structured-`B`/ASPIC+ lift rides on item 1.
5. **Cross-room / ratified-subgraph** — preferred/stable over ratified subgraphs (session 13 governance dimension); transport (Q-006).
