# Ludics↔Ambler Bridge — Runtime Contract (settled fragment)

- **status:** draft (opened 2026-05-31; scope widened 2026-05-31 — cyclic guard lifted)
- **scope:** **defeat of any depth / cycle structure over propositional
  (first-order) generators.** Originally *flat / one-level-nested over acyclic*
  rule-bases; the [cyclic-defeat audit](../../RESEARCH_PROGRAMME/audits/q031-cyclic-defeat-collapse-2026-05-31.md)
  (full [Q-031](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-031))
  closed the cyclic / unbounded-depth residue, so [Q-037](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-037)
  is now positive on the **full propositional** fragment and guards **G1
  (acyclicity)** and **G2 (depth ≤ 2)** are **lifted** (§1). [Q-028a](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
  stratum-1 is discovery-positive. The one remaining fork is **higher-order
  generators** (Q-028a stratum-2 / Q-030); the contract stays bounded below G3
  so that fork cannot invalidate it.
- **operationalises:** the `affects-implementation` clauses of
  [Q-037](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-037) (the δ
  scheduler decision) and [Q-028a](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
  (the deterministic `Inc(B) → 𝒞/Γ` projection)
- **upstream (proof inputs):**
  - [R3 working doc](../../RESEARCH_PROGRAMME/audits/r3-delta-iso-session-2026-05-30.md)
    — §2 (ν = normalisation), §2.1 (R3-termination theorem), §5.5 (the merge
    operator `μ` / L-MERGE)
  - [E2 audit](../../RESEARCH_PROGRAMME/audits/e2-cardinality-multireinstater-2026-05-31.md)
    — §3 (no cardinality inflation), §4 (single-generator scope structural),
    §4.5 (the bijection sweep → the projection algorithm below)
  - [E1 audit](../../RESEARCH_PROGRAMME/audits/e1-reinstatement-aspirin-2026-05-30.md)
    — the accumulating-δ₂ requirement
  - [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
    Part II — the R1 commitment to δ₁ semantics
- **downstream surfaces:** the Mesh deliberation engine's challenge scheduler
  (coroutine / CSP-style), and any code that projects an `Inc(B)` snapshot into
  an Ambler-side display or persists Ambler argument-sets as Ludics designs.

---

## 0. What this contract pins, in one paragraph

The deliberation runtime already schedules challenges coroutine-style — i.e. it
is operationally a **δ₂ engine** (defeat-as-coroutine). The research question was
whether that operational presentation is faithful to the **δ₁** (defeat-as-negation)
semantics the C001b′ bridge proof uses. Q-037 answered **yes, on the full
propositional fragment** (cyclic and unbounded-depth defeat included, after the
cyclic-defeat audit closed full Q-031): the normalisation map `ν` (Ludics cut-elimination) is a *proven*
bijection between the δ₂ canonical-cut presentations the runtime produces and the
δ₁ blocked designs the proof consumes. **Consequence: the runtime keeps its
coroutine scheduler unchanged.** No rewrite, no non-canonical translation carried
as data. The runtime's only new obligations are the *invariants* that make `ν`
applicable (§2) and the deterministic projection algorithm (§3).

---

## 1. Scope guards (load-bearing — read before implementing)

This contract is valid **only** inside the fragment below. Each guard is a
runtime precondition; violating one moves the input outside the proven region and
the contract makes **no** correctness claim there.

- **G1 — acyclic rule-base. ~~Required~~ LIFTED (2026-05-31).** Cyclic `p ⇄ ¬p`
  attack loops (e.g. `gastric_ulcer ⇄ ¬gastric_ulcer`) are now **in fragment**:
  the [cyclic-defeat audit](../../RESEARCH_PROGRAMME/audits/q031-cyclic-defeat-collapse-2026-05-31.md)
  shows the cycle forces no fixpoint in the design logic (Ambler-monotone-accrual
  + L-MERGE idempotence ⟹ `Inc(B)` finite, `ν` terminates globally). A cycle's
  acceptability is resolved one level up, in the finite free JSL — see §4.
- **G2 — one-level nesting (reinstatement depth ≤ 2). ~~Required~~ LIFTED
  (2026-05-31).** Unbounded reinstatement depth is in fragment: pointwise each
  incarnation is a finite λ-term (R3 §2.1 T1) and globally the merged-chronicle
  set saturates (idempotent `μ`, cyclic-defeat audit §4), so `Inc(B)` stays
  finite at any depth over propositional `Γ`.
- **G3 — propositional (first-order) generators. STILL REQUIRED.** Ambler
  arguments without λ-abstraction / hypothetical-derivation rules. With
  λ-abstraction `𝒞/Γ` can be infinite (Church-encoded combinators); this is the
  one remaining out-of-fragment case — Q-028a stratum-2 / Q-030, **not** a
  defeat-depth fixpoint (cyclic-defeat audit §6) — see §4/§5.

A runtime that may receive out-of-fragment inputs MUST detect **G3** violations
and route them to the guarded fallback (§4), not silently apply this contract.
(G1/G2 are retained above as historical guards now discharged; no runtime check
is needed for them on propositional `Γ`.)

---

## 2. The δ₂ scheduler invariants (make ν applicable)

The coroutine scheduler is retained **as-is** at the scheduling level. For `ν`
to be the proven bijection, every design the scheduler emits for the bridge must
be in **canonical-cut form** (R3 §3). Three invariants enforce that:

- **I1 — one cut per defeat layer.** A depth-`n` defeat configuration carries
  exactly `n` challenger cuts, nested in chain order (R3 §3 cond. 1). The
  scheduler already spawns one challenger per defeat event; the invariant is that
  it does **not** spawn duplicate or speculative cuts for the same layer.
- **I2 — minimal challengers.** Each challenger design is the ⊆-minimal design
  realising that layer's defeater chronicle — no spurious positive actions
  (R3 §3 cond. 2).
- **I3 — accumulation on death (the `μ` merge).** When a challenger at layer `i`
  is itself defeated (reinstatement), its supporting chronicle `χ_i` is **retained**,
  not garbage-collected: grafted as a `⊗`-ramification at the unique negative
  leaf `ℓ_i` (R3 §5.5, lemma L-MERGE). **This is the one place the naive
  coroutine reading is wrong** — a dead challenger must merge its evidence into
  the surviving thread, not discard it (E1 §5.2). Concretely: on
  challenger-death, append `χ_i` to the survivor's negative-branch at `ℓ_i`;
  do **not** free it.

> **Correctness invariant (the contract's core claim).** For any incarnation `D`
> the scheduler emits under I1–I3 inside the fragment (§1), `ν(D)` — the cut-free
> normal form — equals the δ₁ blocked design the bridge proof assigns to the same
> Ambler argument. `ν` terminates (R3 §2.1) and is bijective per defeater
> (L-MERGE). Engineering reading: **running the coroutine to quiescence and
> reading off the surviving material design is the same as constructing the
> δ₁ design directly.**

---

## 3. The projection algorithm `Inc(B) → 𝒞/Γ` (deterministic)

This is the bridge's actual computational content: the deterministic translation
from a Ludics incarnation snapshot to an Ambler argument generator. The algorithm
is the **uniquely-forced bijection `φ`** from the E2 §4.5 sweep. Given the
material designs of `Inc(B)`:

1. **Partition by head action (daimon-lock).** Group incarnations by their first
   positive action = the top rule each selects (Q-027 §5 thin cones; E2 §4.5
   Test 1). Each Ambler generator's head rule names its class. This pins every
   single-occupancy class immediately (e.g. the unique head-`t₁` design ↦ the
   unique head-`t₁` term).
2. **Disambiguate multi-occupancy classes by premise locus (composition).**
   Within a class sharing a head rule (e.g. two `t₂`-routes), distinguish
   incarnations by the **premise sub-chronicle** at the disambiguating locus —
   the `¬gu` support route in the worked instance: `ξ_{st∧an}` (undercutter `i₂`)
   vs `ξ_{miso}` (undercutter `i₃`). The incarnation whose support chronicle
   occupies locus `ξ_X` maps to the Ambler term whose corresponding
   sub-derivation uses rule `X` (E2 §4.5 Test 2). This step is forced by
   composition compatibility (the bridge commutes with cutting against the
   `ξ_X` probe), so it is deterministic, not heuristic.
3. **(No `U`-erasure step needed.)** `U`-erasure is non-discriminating at the
   generator level (E2 §4.5 Test 3); it only rules out cardinality mismatches,
   which I1–I3 + the fragment guards already preclude.

**Cardinality guarantee.** Inside the fragment, `|Inc(B)| = |𝒞/Γ|` (E2 §3): defeat
does not multiply incarnations and δ₂ does not inflate the count. The projection
is therefore a total bijection; a runtime assertion `|Inc(B)| == |𝒞/Γ|` is a
cheap integrity check and SHOULD be wired as a debug-mode invariant.

**Aggregation lives one level up.** Combining multiple reinstaters / multiple
arguments is **not** a design-level operation — it is the free-JSL join `∨_A` in
`𝒫_fin(Inc(B))` (E2 §4). Code that aggregates argument-sets MUST operate on
`𝒫_fin(Inc(B))`, never by merging designs inside `Inc(B)` (the latter would
violate Phase 2e Cross-Cone Incompatibility). This is the generator/power-set
level separation; keep it explicit in the type that carries aggregated arguments.

---

## 4. Guarded fallback (out-of-fragment inputs)

When G3 (§1) cannot be guaranteed:

- **Cyclic `Γ` / unbounded depth (G1, G2) — RESOLVED, no fallback.** `ν`
  termination on cyclic / unbounded-depth defeat over propositional `Γ` is now
  **proven** ([cyclic-defeat audit](../../RESEARCH_PROGRAMME/audits/q031-cyclic-defeat-collapse-2026-05-31.md),
  full Q-031). **The earlier depth-bound-vs-μ-infrastructure decision is
  decided: neither.** No configured defeat-depth bound, no μ-Ludics
  infrastructure. The runtime keeps the §2 correctness invariant on cyclic
  inputs. **Cycle resolution lives one level up:** to decide which of a set of
  mutually-attacking arguments is accepted, compute the **finite Dung-style
  grounded/stable acceptability fixpoint over `𝒫_fin(Inc(B))`** (the free JSL of
  §3 "aggregation lives one level up"), reached in `≤ |Inc(B)|` steps by
  Knaster–Tarski on the finite lattice — **not** a design-level operation. For an
  even cycle this yields two stable extensions; for an odd cycle the grounded
  extension marks the cycle *undecided* (a third value). Which extension to
  surface is a deliberation-engine UX/config choice, not a correctness concern.
- **Higher-order generators (G3 violated):** the projection §3 is not yet proven
  canonical for λ-abstraction generators (Q-028a stratum-2; `𝒞/Γ` may be
  infinite, gated on the BF-incarnation antichain Q-032 / Q-030). The runtime
  MUST mark such projections *unverified* and MUST NOT persist them as canonical
  bridge data (doing so would bake in a choice that may need to become
  explicit bridge-presentation data — Q-028a `affects-implementation`).

---

## 5. Open forks that gate the *unrestricted* contract

This contract becomes fully unrestricted (drops the last §1 guard, G3) exactly
when the **one** remaining research item lands. It is tracked in the registry and
does not block the propositional-fragment contract above.

- **Full [Q-031](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-031)
  — cyclic / unbounded-depth defeat. CLOSED (2026-05-31).** Decided **neither**
  defeat-depth bound nor μMELL/μMALL infrastructure: the cycle forces no fixpoint
  in the design logic (Ambler-monotone-accrual + L-MERGE idempotence). Guards
  G1/G2 lifted. The only fixpoint is the finite-lattice acceptability fixpoint
  one level up. See [cyclic-defeat audit](../../RESEARCH_PROGRAMME/audits/q031-cyclic-defeat-collapse-2026-05-31.md).
- **[Q-028a](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
  stratum-2 — higher-order canonicality (OPEN).** Decides whether the §3
  projection extends canonically to function-type / exponential-behaviour
  generators, or whether the substrate must carry the bridge-presentation choice
  as data. Gated on the BF-incarnation antichain ([Q-032](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-032))
  / [Q-030](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-030) — there
  is no canonical Ludics-side generator set for `!`-behaviours until Q-032 lands.
  Resolves §4's remaining fallback (G3).

When Q-028a stratum-2 closes positive, guard G3 lifts and §3 becomes the
unconditional bridge projection; this document should then be promoted from
"settled fragment" to the full bridge runtime contract.

---

## 6. Test obligations

- **T-INV (correctness invariant, §2).** For each in-fragment worked instance
  (start with the E2 `Inc(B) = 3` aspirin+`i₃` case), assert
  `ν(scheduler_emit(arg)) == delta1_design(arg)` design-equal (setoid `≈ᴰ`, not
  `≡` — cf. the C001 Agda toy F2 finding).
- **T-PROJ (projection determinism, §3).** On the same instance, assert the §3
  algorithm reproduces the unique `φ` from E2 §4.5 (head-`t₁` ↦ `a₁`; `ξ_miso`
  route ↦ `a₃`); assert no other bijection passes both partition + premise-locus
  steps.
- **T-CARD (cardinality, §3).** Assert `|Inc(B)| == |𝒞/Γ|` on every in-fragment
  instance.
- **T-GUARD (fallback, §4).** Feed a **λ-abstraction** (higher-order) instance;
  assert the runtime routes it to the guarded path and marks it *unverified*
  rather than asserting T-INV. Feed a **cyclic-`Γ`** instance and assert the
  opposite — it is now **in fragment**: T-INV holds, and the cycle's
  acceptability is computed as the finite grounded/stable fixpoint over
  `𝒫_fin(Inc(B))` (§4), not routed to the unverified path.
- **T-ACCUM (the `μ` merge, I3).** Assert a defeated challenger's chronicle
  `χ_i` survives in the reinstated design (the depth-2 aspirin result lands on
  `D_{t₂}`, the stronger argument, not collapsing to `D_{t₁}` — E1).

---

## 7. References

- [Q-037 registry entry](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-037)
  — the closed question; `affects-implementation` clause this contract enacts.
- [Q-028a registry entry](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
  — stratum-1 discovery-positive (the §3 projection); stratum-2 open (§4/§5).
- [R3 working doc](../../RESEARCH_PROGRAMME/audits/r3-delta-iso-session-2026-05-30.md),
  [E1](../../RESEARCH_PROGRAMME/audits/e1-reinstatement-aspirin-2026-05-30.md),
  [E2](../../RESEARCH_PROGRAMME/audits/e2-cardinality-multireinstater-2026-05-31.md),
  [E3](../../RESEARCH_PROGRAMME/audits/e3-polarity-readoff-2026-05-30.md).
- [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
  Part II — the δ₁ commitment now proven-presented by the δ₂ runtime.
- [C001b′](../../RESEARCH_PROGRAMME/03_CONJECTURES/C001b-prime-ambler-remainder.md)
  — the bridge conjecture this contract serves.
- Ambler 1996 §2–§3 ([`AMBLER_PAPER.md`](AMBLER_PAPER.md)) — `𝒞/Γ` generators,
  meta-level defeat (p. 171).
