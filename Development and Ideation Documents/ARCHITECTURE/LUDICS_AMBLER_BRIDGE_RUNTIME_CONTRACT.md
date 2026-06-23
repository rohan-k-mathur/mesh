# Ludics↔Ambler Bridge — Runtime Contract (settled fragment)

- **status:** draft (opened 2026-05-31; scope widened 2026-05-31 — cyclic guard lifted;
  widened again 2026-06-22 — **G3a** ground-higher-order generators lifted via §3 step 2′
  after [Q-028a stratum-2](../../RESEARCH_PROGRAMME/audits/q028a-stratum2-2026-06-22.md)
  came back discovery-positive; **upgraded to settlement-proven 2026-06-22** after the
  uniform [Q-028b](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028b) settlement
  was independently cross-checked / signed off — b₁′∧b₂′ closed at the `!`-layer; the only
  remaining out-of-fragment case is **G3b** schematic polymorphism, Q-033)
- **scope:** **defeat of any depth / cycle structure over propositional
  (first-order) generators.** Originally *flat / one-level-nested over acyclic*
  rule-bases; the [cyclic-defeat audit](../../RESEARCH_PROGRAMME/audits/q031-cyclic-defeat-collapse-2026-05-31.md)
  (full [Q-031](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-031))
  closed the cyclic / unbounded-depth residue, so [Q-037](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-037)
  is now positive on the **full propositional** fragment and guards **G1
  (acyclicity)** and **G2 (depth ≤ 2)** are **lifted** (§1). [Q-028a](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
  stratum-1 is discovery-positive, and **stratum-2 (higher-order, ground
  `{→,×,atom}`) is now discovery-positive too** ([q028a-stratum2 audit](../../RESEARCH_PROGRAMME/audits/q028a-stratum2-2026-06-22.md),
  enabled by [T012](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md)
  reaching `established`). The §3 projection is correspondingly **extended to ground
  higher-order generators** (§3 step 2′, the `!`-scheme-locus disambiguation; guard
  **G3a** lifted) and the §4 higher-order fallback is **narrowed** to the two residues
  that remain genuinely out-of-fragment: **schematic / polymorphic** generators
  (**G3b**, [Q-033](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-033)) and
  the **settlement-grade** uniformity claim ([Q-028b](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028b)).
  The contract makes a **settlement-grade** projection claim on ground higher-order
  inputs and stays guarded above **G3b**.
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
- **G3 — generator order. PARTIALLY LIFTED (2026-06-22).** Splits into two:
  - **G3a — propositional + ground higher-order. IN FRAGMENT (settlement-proven 2026-06-22).**
    Propositional generators (as before) **and** ground `{→,×,atom}` λ-abstraction /
    hypothetical-derivation generators are now projected by §3 (extended with the
    `!`-scheme-locus step, §3 step 2′): [Q-028a stratum-2](../../RESEARCH_PROGRAMME/audits/q028a-stratum2-2026-06-22.md)
    is discovery-positive **and** the uniform [Q-028b](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028b)
    settlement (`F⊣U`-on-generators) is now **independently cross-checked / signed off**
    ([crosscheck](../../RESEARCH_PROGRAMME/audits/q028b-settlement-crosscheck-2026-06-22.md), 6/6 PASS) —
    so the canonical generators ([T012](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md))
    plus the uniquely-forced `φ` *are* the presentation, **uniformly in `B`**, and no
    bridge-presentation side-data is needed. A runtime MAY tag ground higher-order
    projections *settlement-proven* (b₁′∧b₂′ closed at the `!`-layer). *(Discovery was
    the prior, weaker tag — superseded by the settlement.)*
  - **G3b — schematic / polymorphic generators. STILL REQUIRED (out of fragment).**
    Generators schematic over propositions (Church-encoded composition combinator
    `(B→C)⇒(A→B)⇒(A→C)`, polymorphic over `A,B,C`) make `𝒞/Γ` infinite and have **no**
    canonical ludics-side generator set — [Q-033](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-033),
    the one remaining hard out-of-fragment case (**not** a defeat-depth fixpoint —
    cyclic-defeat audit §6; **not** the in-scope ground Church *numerals*, which are
    settled). Route these to the guarded fallback (§4). **Vacuous on the realized
    catalogue (2026-06-22 triage, Path A — [q033 triage](../../RESEARCH_PROGRAMME/audits/q033-polymorphism-triage-2026-06-22.md)):**
    no stored argument is propositionally polymorphic (premises bind concrete `claimId`s;
    chains compose concrete schemes; no `MetaScheme`/combinator model), so this guard is a
    **defensive check** — not an active route — on the current product.

A runtime that may receive out-of-fragment inputs MUST detect **G3b** violations
(schematic / polymorphic generators) and route them to the guarded fallback (§4), not
silently apply this contract. Ground higher-order (**G3a**) inputs are now projected by
the extended §3 at **settlement strength** (Q-028b signed off 2026-06-22) and tagged
*settlement-proven* — never the unverified path. (G1/G2 are retained above as historical
guards now discharged; no runtime check is needed for them on propositional `Γ`.)

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
2′. **Disambiguate higher-order classes by `!`-scheme locus (the stratum-2 step;
   ground `{→,×,atom}` only).** When a head-rule class contains **higher-order**
   generators that share a head rule and differ only in the *abstracted derivation* in a
   `!`-marked slot (e.g. two `chk`-generators differing only in which scheme occupies
   `chk`'s `!`-argument), distinguish them by the **head action of the `!`-slot
   sub-design**, read by **deterministic proof search descended into the
   exponential/contraction structure** (BT2010 §3.1; the [T012](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md)
   read-back). The generator whose `!`-slot scheme has head `X` maps to the Ambler term
   whose abstracted scheme is `X`. Forced by composition compatibility against the
   `X`-probe ([q028a-stratum2 audit](../../RESEARCH_PROGRAMME/audits/q028a-stratum2-2026-06-22.md)
   §S2 Test 2), so deterministic, not heuristic. Contraction is non-disrupting: all copies
   of one abstracted scheme share a head, so the probe reads it single-valuedly. This step
   carries a **settlement-proven** claim (the uniform [Q-028b](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028b)
   settlement, cross-checked 2026-06-22; instance-corroborated by [Q-028a stratum-2](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a))
   and applies only to ground generators (**G3a**); schematic generators (**G3b**) are
   routed to §4. Tag the result *settlement-proven*.
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
- **Ground higher-order generators (G3a) — SETTLED (2026-06-22), no unverified fallback.**
  [Q-028a stratum-2](../../RESEARCH_PROGRAMME/audits/q028a-stratum2-2026-06-22.md)
  is discovery-positive **and** the uniform [Q-028b](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028b)
  settlement is **cross-checked / signed off** ([crosscheck](../../RESEARCH_PROGRAMME/audits/q028b-settlement-crosscheck-2026-06-22.md)):
  on the ground `{→,×,atom}` fragment the bridge data forces `φ` uniquely **and uniformly
  in `B`**, so the earlier worry — that the projection might have to "bake in a choice that
  becomes explicit bridge-presentation data" — **does not materialise**:
  [T012](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md)'s
  canonical generators + the uniquely-forced `φ` *are* the presentation. The runtime now
  projects such generators via the **extended §3 (step 2′)** and tags them
  *settlement-proven* (b₁′∧b₂′ closed at the `!`-layer).
- **Schematic / polymorphic generators (G3b violated):** still out of fragment —
  `𝒞/Γ` is infinite and there is no canonical ludics-side generator set ([Q-033](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-033)).
  The runtime MUST mark such projections *unverified* and MUST NOT persist them as
  canonical bridge data (doing so would bake in a choice that may need to become
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
  stratum-2 — higher-order canonicality. DISCOVERY-POSITIVE (2026-06-22).**
  [Q-032](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-032) landed
  ([T012](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md)
  `established`), supplying the canonical `!`-layer generator set and the
  deterministic-proof-search read-back; the stratum-2 sweep ([q028a-stratum2 audit](../../RESEARCH_PROGRAMME/audits/q028a-stratum2-2026-06-22.md))
  then forced `φ` **uniquely** on the worked ground higher-order instance. **§4's
  ground-higher-order fallback is discharged at discovery strength** (G3a now in-fragment
  via §3 step 2′); the bridge-presentation side-data worry does **not** materialise.
  Residue: **schematic polymorphism** ([Q-033](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-033),
  G3b) and **settlement** ([Q-028b](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028b)) — see next bullet.
- **[Q-028b](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028b) — settlement of
  higher-order canonicality (the uniform `F ⊣ U` argument). SIGNED OFF (2026-06-22).**
  The uniform settlement was assembled and **independently cross-checked** ([crosscheck](../../RESEARCH_PROGRAMME/audits/q028b-settlement-crosscheck-2026-06-22.md),
  6/6 PASS): `ε = 𝓕(φ_!)` is the unique composition-compatible iso forced uniformly in `B`
  (freeness via the proof-layer antichain L-AC!; δ stays dissolved at `!`). So the
  §3-step-2′ projection now carries a **settlement** (not merely discovery) correctness
  claim on ground higher-order inputs. **b₁′∧b₂′ closed at the `!`-layer.**

With Q-028a stratum-2 discovery-positive **and Q-028b settlement signed off (2026-06-22)**,
guard **G3a** is lifted at **settlement strength** (§3 step 2′ projects ground higher-order
generators with b₁′∧b₂′ closed). **Q-033 (schematic polymorphism, G3b) was scoped out
2026-06-22** ([triage](../../RESEARCH_PROGRAMME/audits/q033-polymorphism-triage-2026-06-22.md),
Path A — the realized catalogue is ground, so G3b is vacuous on the product). **⇒ On the
realized product this is now the full bridge runtime contract** (every realized generator
is in-fragment at settlement strength); `G3b` is retained only as a **defensive guard**
against a future polymorphic-generator model. This document may be promoted from "settled
fragment" to "full bridge runtime contract" for the realized surface.

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
- **T-PROJ-HO (higher-order projection, §3 step 2′).** On the stratum-2 instance
  (aspirin base + `t₃` + `chk : !(mp→asp) ⊸ mp ⊸ asp`; [q028a-stratum2 audit](../../RESEARCH_PROGRAMME/audits/q028a-stratum2-2026-06-22.md)
  §S0), assert the extended §3 reproduces the unique `φ` (head-`chk` block:
  `!`-slot-`t₁` ↦ `b₁`, `!`-slot-`t₃` ↦ `b₃`) and that the scheme-swap `σ` fails the
  `!`-scheme-locus probe; assert the result is tagged *settlement-proven*.
- **T-GUARD (fallback, §4).** Feed a **schematic / polymorphic** (G3b) instance
  (Church-encoded composition combinator); assert the runtime routes it to the guarded
  path and marks it *unverified* rather than asserting T-INV. Feed a **ground
  higher-order** (G3a) instance and assert it is now projected by the extended §3 (step
  2′) and tagged *settlement-proven* — **not** routed to the unverified path. Feed a
  **cyclic-`Γ`** instance and assert the same in-fragment treatment as before: T-INV
  holds, and the cycle's acceptability is computed as the finite grounded/stable fixpoint
  over `𝒫_fin(Inc(B))` (§4), not routed to the unverified path.
- **T-ACCUM (the `μ` merge, I3).** Assert a defeated challenger's chronicle
  `χ_i` survives in the reinstated design (the depth-2 aspirin result lands on
  `D_{t₂}`, the stronger argument, not collapsing to `D_{t₁}` — E1).

---

## 7. References

- [Q-037 registry entry](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-037)
  — the closed question; `affects-implementation` clause this contract enacts.
- [Q-028a registry entry](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
  — stratum-1 + stratum-2 (ground higher-order) both discovery-positive (the §3
  projection incl. step 2′); the stratum-2 sweep is [q028a-stratum2-2026-06-22.md](../../RESEARCH_PROGRAMME/audits/q028a-stratum2-2026-06-22.md).
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
