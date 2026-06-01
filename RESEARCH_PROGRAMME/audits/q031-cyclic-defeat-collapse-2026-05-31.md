# Q-031 (full) — cyclic / unbounded-depth defeat: does the cycle force a fixpoint outside MELL?

- **status:** **positive on the propositional fragment** (2026-05-31). The
  cyclic `gu ⇄ ¬gu` rule-base does **not** force a least-fixpoint operator into
  the substrate's *design* logic. The only fixpoint the cycle introduces lives
  one level up, in the **finite** free JSL `𝒫_fin(Inc(B))` (the aggregation /
  acceptability layer), where it is a standard Knaster–Tarski fixpoint over a
  finite complete lattice — reached in `≤ |Inc(B)|` steps, **not** μMELL/μMALL.
  Residue: the higher-order (λ-abstraction / exponential-behaviour) case, where
  `𝒞/Γ` can be infinite — but that is [Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
  / [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) territory, not a defeat-depth
  fixpoint.
- **date:** 2026-05-31
- **settles (target):** [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) — does
  the substrate's defeat-encoding `δ` require a fixpoint/closure operator outside
  MELL? Specifically the **open residue** left by the
  [R3-termination theorem §2.1](r3-delta-iso-session-2026-05-30.md): the
  **cyclic / unbounded-depth** case that the one-level-nested / acyclic
  discharge explicitly excluded.
- **method:** worked example (the minimal `gu ⇄ ¬gu` attack cycle over the
  aspirin family, the case [E1 §5.3](e1-reinstatement-aspirin-2026-05-30.md)
  flagged untested), reasoned against Ambler's meta-level-defeat constraint
  (1996 p. 171) and the L-MERGE accumulation operator
  ([R3 §5.5](r3-delta-iso-session-2026-05-30.md)). No mechanisation.
- **inputs:** [R3 doc §2.1](r3-delta-iso-session-2026-05-30.md) (the global-vs-pointwise
  framing — each incarnation realises a finite λ-term and so ν terminates
  pointwise; the residue is whether `Inc(B)` stays finite as depth grows),
  [E1 §5.3](e1-reinstatement-aspirin-2026-05-30.md) (the depth-2 fixpoint seed
  and the explicit call for a `gu ⇄ ¬gu` cycle), [E2 §4](e2-cardinality-multireinstater-2026-05-31.md)
  (the generator/power-set level split that localises *where* any fixpoint can
  live).
- **headline:** the cycle is **collapsed**, on two independent grounds that
  reinforce each other:
  1. **Ambler-monotone-accrual (primary-source).** Ambler 1996 p. 171: there is
     **no object-level defeat operator** — aggregation is monotone, and "there
     is no mechanism for one argument to defeat or undercut another." So the
     "iterated defeat `defeat(defeat(…))`" that threatened an infinite descent
     is iterating an operator Ambler's calculus *does not have*. The cyclic
     attack is a **static** pair of competing finite arguments, not a dynamic
     that mints fresh object-level terms.
  2. **L-MERGE idempotence (substrate-side).** Even reading defeat dynamically
     (the naive δ₂ coroutine), the reinstating defeater at each layer of a cycle
     is the **same generator** that appeared one period earlier — so the
     accumulation merge `μ` re-grafts an **already-present** chronicle, a no-op.
     The design saturates after one cycle-period; ν reaches a normal form.
  The net is a **refined trichotomy answer (a)**: `δ`'s *design-level* image
  stays inside the finitely-iterated MELL image, so **[Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037)
  lifts to positive *unrestricted*** (the acyclicity guard G1 drops). It is
  **not (b)** (no μMELL/μMALL infrastructure in the design logic) and **not (c)**
  (no defeat-depth bound needed as a validation rule).

---

## 1. The minimal cyclic instance

E1 §5.3 closed the depth-2 aspirin chain by observing the reinstater `χ_und`
(`i₂ : short_term ∧ anxiety → ¬gu`) is Daimon-capped: nothing in scope attacks
`¬gu`, so iteration stops at depth 2. The flagged untested case is a fact-base
that *does* put a producer of `gu` back in scope above `¬gu`, closing the loop.

Take the aspirin rule-base `Γ` (Q-027 §1) and add the two rules that close a
`gu ⇄ ¬gu` cycle:

| Rule | Type | Reading |
|------|------|---------|
| `r_gu` | `e_A → gastric_ulcer` | a route to `gu` from base evidence `e_A` (e.g. `stomach_pain ∧ x-ray-shadow`) |
| `r_¬gu` | `e_B → ¬gastric_ulcer` | a route to `¬gu` from base evidence `e_B` (e.g. `short_term ∧ anxiety`, the `i₂` family) |

with the **cycle condition** that makes this a genuine attack loop rather than a
mere pair of competing rules: `r_gu`'s argument *rebuts* `r_¬gu`'s conclusion and
`r_¬gu`'s argument *rebuts* `r_gu`'s conclusion (each concludes the negation of
the other). In the substrate's defeat-extension this is a **mutual-attack
2-cycle**: `A := r_gu(e_A)` attacks `B := r_¬gu(e_B)` and `B` attacks `A`.

**Two readings of "`gu ⇄ ¬gu`" must be separated** — only the second is the
genuine test:

- **Reading 1 — derivational-dependency cycle.** `r_gu`'s *premise* is `¬gu` and
  `r_¬gu`'s *premise* is `gu` (each rule consumes the other's conclusion). Then
  neither atom is derivable from base facts: any would-be derivation is
  non-well-founded, hence **not a λ-term** in Ambler's (simply-typed, strongly
  normalising) calculus. `𝒞/Γ` for `gu`/`¬gu` is **empty**. The cycle does not
  produce infinitely many arguments; it produces **zero**. Trivially finite,
  trivially no fixpoint. (This is the degenerate reading; record it only to set
  it aside.)
- **Reading 2 — mutual-rebuttal attack cycle.** `e_A`, `e_B` are **both**
  derivable from base facts independently; `A` and `B` are **both finite,
  well-founded λ-terms**; the loop is purely at the **meta/attack** level (`A`
  rebuts `B`, `B` rebuts `A`). This is the Dung-style even cycle and the case
  E1 §5.3 actually intends. **§2–§4 work Reading 2.**

---

## 2. The would-be infinite descent, written out

Under a *naive object-level* reading of defeat, the cycle generates the descent

```
A                                   (base argument for gu)
defeat(A)        = A blocked by B    (¬gu rebuts gu)
defeat²(A)       = A reinstated by defeating B   (gu rebuts ¬gu — but the rebutter IS A)
defeat³(A)       = A blocked by B again
defeat⁴(A)       = A reinstated again
…
```

This is the sequence that *looks* like it demands a least-fixpoint `μ` (the
"does iterated defeat descend forever?" of the Q-031 entry; the μMALL/μMELL risk
of Baelde 2012). The orbit `{A, defeat(A)}` oscillates with period 2 and never
visits a *new* object. The question is whether this oscillation forces an
infinitary construction anywhere the substrate has to represent it.

The answer is **no**, and the two sections below say why — first from Ambler's
semantics (the oscillation never even starts), then from the substrate's
encoding (even if you start it, it saturates).

---

## 3. Collapse (1): Ambler's meta-level defeat — the oscillation never starts

Ambler 1996 p. 171, verbatim (as quoted in [E1 §0](e1-reinstatement-aspirin-2026-05-30.md)):

> "the aggregation of arguments is **necessarily monotone**. To overturn a
> decision one must supply a stronger argument on the other side. **There is no
> mechanism for one argument to defeat or undercut another.**"

Three consequences for the cycle:

1. **No `defeat³` term exists.** `defeat` is not an object-level connective in
   `𝒞/Γ`; it is a **meta-level evaluation** layered over a monotone calculus
   (E1 §0 fact 1). The substrate's `δ` *encodes* a meta-level comparison; it does
   **not** add an iterable object-level rewrite. So the descent of §2 is
   iterating a non-existent operator. The generator set is exactly
   `𝒞/Γ = {…, A, B, …}` — the finite set of distinct **well-founded λ-derivations
   over the finite `Γ`** — and the cycle adds to it **only the two finite terms
   `A`, `B`**, not an infinite family `defeatⁿ(A)`.
2. **The cycle is a static competition, not a dynamic.** Under monotone accrual,
   `A` and `B` simply **coexist** in the argument set; both accrue. The "cycle"
   is a static pair of competing arguments whose **relative strength is evaluated
   once** (meta-level), not a temporal ping-pong. There is nothing to iterate.
3. **`δ₁` (the committed semantics) inherits the static reading.** `δ₁` is
   defeat-**as-negation**: `defeat(A)` is a *blocked negative design* (a fixed
   chronicle), not a rewrite step that can be re-applied to its own output. So in
   the encoding the substrate actually commits to, `defeat(A)` and `defeat(B)`
   are **two static blocked designs**; there is no `defeat³` to form. The
   appearance of an infinite descent was an artefact of the *naive δ₂ dynamic*
   reading only.

So **`Inc(B)` stays finite**: `|Inc(B)|` is bounded by the number of distinct
well-founded λ-derivations over `Γ`, which is finite for a **propositional**
(first-order) `Γ`, independent of how many attack-cycles the defeat-extension
draws on top. The global-finiteness question the R3 doc §2.1 left open is
answered **yes** on the propositional fragment.

> **Why "propositional" is the honest scope boundary.** Finiteness of `𝒞/Γ` uses
> that there are finitely many normal λ-terms over `Γ`. With **λ-abstraction /
> function types** (Church-encoded combinators, hypothetical-derivation rules)
> this can fail — e.g. the Church numerals give infinitely many normal terms of
> one type. That infinitude is **not** a defeat-depth fixpoint; it is the
> higher-order generator question ([Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a))
> and the exponential-behaviour incarnation question
> ([Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030)/[Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032)).
> See [§6](#6-the-higher-order-residue-is-q-028a-stratum-2-not-q-031).

---

## 4. Collapse (2): L-MERGE idempotence — even the δ₂ dynamic saturates

Suppose one nonetheless runs the **naive δ₂ coroutine** dynamically (the runtime
presentation). Does *its* normalisation `ν` terminate on the cycle, or does it
spawn cuts forever? It terminates, by **idempotence of the accumulation merge**.

Recall L-MERGE ([R3 §5.5](r3-delta-iso-session-2026-05-30.md), the I3 invariant
of the [runtime contract §2](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md)):
when a challenger at layer `i` dies, its supporting chronicle `χ_i` is **grafted**
as a `⊗`-ramification at the negative leaf `ℓ_i` — **retained, not
re-spawned**. In the **acyclic** aspirin chain each layer's `χ_i` was a
**genuinely new** rule-chronicle (`χ_def = c₁∘i₁`, then `χ_und = i₂`), so the
merged set grew, but only by the finite number of rules — termination at depth 2.

In a **cycle** the defeater at layer `i+2` is the **same generator** as at layer
`i` (the period-2 orbit of §2: `A` defeats `B`, then to reinstate `A` we defeat
`B` **with `A` again**). So at layer `i+2` the merge step tries to graft `χ_A` at
`ℓ_A` — but `χ_A` is **already present** in the design from layer `i`. The graft
is therefore a **no-op**:

$$\mathsf{merge}(\chi_A,\ D)\ =\ D \qquad\text{whenever } \chi_A \subseteq D,$$

i.e. `μ` is **idempotent on already-present chronicles**. (This is immediate from
its definition as a *set*-graft of chronicles at a fixed locus: grafting a
chronicle a design already contains adds no new chronicle. Ludics
bi-orthogonal closure is monotone and a chronicle set is a set — re-adding an
element is identity.)

Consequence: the accumulated chronicle set **saturates after one cycle-period**.
Concretely, the design stabilises at

$$D^\star\ =\ D_0 \ \cup\ \chi_A \ \cup\ \chi_B,$$

the finite design carrying both competitors' support, and every further
reinstatement step re-grafts a chronicle already in `D^\star`. Normalisation `ν`
on `D^\star` has **no fresh cut to consume** (L-MERGE creates no cut — R3 §2.1
(T1)), so it is already in cut-free normal form. **ν terminates; the design is
finite.** The period-2 oscillation of §2 is, at the design level, a single fixed
point `D^\star` reached after one round — not an infinite chain.

> **Contrast with the acyclic case sharpened.** Acyclic termination (R3 §2.1)
> rode on *depth being bounded by the rule count* because each layer brought a
> new rule. Cyclic termination rides on a **different** measure: depth is
> unbounded, but the **merged-chronicle set is bounded by `𝒞/Γ`** (finite,
> §3) and the merge is **idempotent**, so the design reaches a fixpoint in the
> finite chronicle lattice. Two different finiteness arguments, same conclusion:
> `ν` halts and `Inc(B)` is finite.

---

## 5. So where *does* the fixpoint live? — the trichotomy, resolved

The cycle genuinely *does* introduce a fixpoint — the resolution is about
**which level** it lives at, and that decides the trichotomy.

- **Design / generator level (`𝒞/Γ`, `Inc(B)`, the MELL designs).** **No
  fixpoint.** `Inc(B)` is finite (§3); `ν` terminates pointwise (R3 §2.1 (T1))
  **and** globally (§4 idempotence). `δ`'s design-level image stays inside the
  **finitely-iterated MELL image**. This is trichotomy answer **(a)**.
- **Aggregation level (`𝒫_fin(Inc(B))`, the free JSL — one level up).** **A
  fixpoint, but a benign one.** Deciding *which* of the mutually-attacking
  arguments is accepted is the **acceptability evaluation** of Dung-style
  argumentation: the least fixpoint of the characteristic ("defence") operator on
  the lattice of argument-sets. By E2 §4 that lattice is exactly
  `𝒫_fin(Inc(B))` — **finite** (since `Inc(B)` is finite). On a finite complete
  lattice Knaster–Tarski gives the least (grounded) and greatest (preferred/stable
  candidates) fixpoints, **reached in `≤ |Inc(B)|` iterations**. For an **even**
  cycle there are two stable extensions (`{A}`, `{B}`); for an **odd** cycle the
  grounded extension leaves the cycle **undecided** — a third value in the finite
  lattice. Either way the computation is **finite** and **already lives in the
  free-JSL aggregation layer the substrate carries** (E2 §4; runtime contract §3
  "aggregation lives one level up").

The decisive structural point: **the cycle's fixpoint is a finite-lattice
acceptability fixpoint at the aggregation level, not an infinitary-design fixpoint
at the MELL level.** Baelde 2012 μMALL/μMELL is required only if the fixpoint had
to be expressed **inside a linear-logic proof/design**. Ambler's meta-level defeat
(p. 171) puts it in the **evaluation over the argument set** instead — the finite
free JSL `𝒫_fin(Inc(B))` — where it is the ordinary Knaster–Tarski fixpoint of a
monotone operator on a **finite** lattice. Finite lattice ⟹ no infinitary `μ`,
no μ-Ludics infrastructure, no defeat-depth bound.

**Trichotomy verdict.**

| Branch | Claim | Verdict |
|--------|-------|---------|
| **(a)** | iterated defeat stays in the finitely-iterated MELL image; Q-037 lifts unconditionally | **YES** — design level (§3, §4) |
| **(b)** | needs μMELL/μMALL (Baelde 2012) in the design logic | **NO** — the fixpoint is a finite-lattice one, one level up, not in MELL |
| **(c)** | forces a defeat-depth bound as a validation rule | **NO** — depth doesn't grow at the design level (L-MERGE idempotence caps it at the cycle period) |

The substrate needs **neither μ-Ludics infrastructure nor a defeat-depth bound**.
It needs only the **finite acceptability fixpoint over `𝒫_fin(Inc(B))`** it
already has (the free JSL of E2 §4) — i.e. a standard Dung grounded/stable
computation on a finite argument graph.

---

## 6. The higher-order residue is Q-028a stratum-2, not Q-031

The one place finiteness of `Inc(B)` (§3) can fail is **λ-abstraction /
function-type generators**, where `𝒞/Γ` may be infinite. This is **not** a
defeat-depth fixpoint and must not be re-filed under Q-031:

- it is the **higher-order canonicality** question
  ([Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a)): whether the
  deterministic `Inc(B) → 𝒞/Γ` projection extends canonically to exponential
  behaviours `!A` / function-type loci;
- and it is gated on the **incarnation notion for `!`-behaviours**
  ([Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) option (b)) plus the
  **BF-materiality antichain** ([Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032)) —
  there is no canonical generator set on the Ludics side for `!A` until Q-032
  lands.

So full-full Q-031 (allowing higher-order arguments) is **subsumed** by the
already-open Q-028a-stratum-2 / Q-030 / Q-032 thread, **not** a separate
fixpoint obstruction. Q-031 *qua defeat-depth fixpoint* is **closed positive** on
the fragment it was actually asking about (propositional defeat, any cycle
structure).

---

## 7. What this closes

- **Q-031 (defeat-depth fixpoint):** **positive on the propositional fragment.**
  No `μ`/closure operator outside MELL in the design logic; the cycle's only
  fixpoint is the finite-lattice acceptability fixpoint at the aggregation level.
- **Q-037:** the sole residue (cyclic / unbounded-depth) is **discharged** ⟹
  Q-037 lifts from "positive on the one-level-nested / acyclic fragment" to
  **positive on the full propositional defeasible fragment** — the **acyclicity
  guard drops**.
- **Runtime contract §4 (first guarded fallback) / §5 (first open fork):**
  resolved. The depth-bound-vs-μ-infrastructure decision the §4 TODO deferred is
  **decided: neither.** Guard **G1 (acyclic `Γ`) lifts**; guard **G2 (depth ≤ 2)
  lifts** for propositional generators. The cyclic path no longer routes to the
  unverified fallback; it routes to the **finite grounded/stable acceptability
  computation over `𝒫_fin(Inc(B))`**.
- **Still guarded:** **G3 (propositional generators)** stays — higher-order /
  exponential behaviours remain out of fragment, now correctly attributed to
  Q-028a stratum-2 / Q-030 / Q-032 (§6), not to a defeat-depth fixpoint.

---

## 8. What this does NOT settle

1. **Higher-order generators (§6).** `𝒞/Γ` infinite under λ-abstraction is open
   — but as Q-028a stratum-2 / Q-030 / Q-032, not Q-031.
2. **Which argumentation semantics the runtime computes.** §5 establishes the
   acceptability fixpoint is *finite and benign*; it does not legislate
   grounded-vs-preferred-vs-stable. That is a product/UX choice for the
   deliberation engine (which extension to surface for an odd cycle), orthogonal
   to the substrate-correctness claim here. Record as a runtime-config item, not
   an open research question.
3. **Confidence-graded strength on the cycle.** Ambler's `[0,1]` rule weights
   (which `U` erases) decide the *strength* comparison that breaks an even cycle
   in the monotone-accrual reading; this audit treats the cycle structurally
   (unweighted attack graph). The weighted refinement is the same finite-lattice
   computation with a strength order and is not a fixpoint obstruction.

---

## 9. References

- [Q-031 registry entry](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) — the question;
  the trichotomy this audit resolves.
- [R3 working doc §2.1](r3-delta-iso-session-2026-05-30.md) — the acyclic
  R3-termination theorem and the global-vs-pointwise framing this audit completes;
  §5.5 (L-MERGE, whose idempotence §4 uses).
- [E1 §5.3](e1-reinstatement-aspirin-2026-05-30.md) — the depth-2 fixpoint seed
  and the explicit call for a `gu ⇄ ¬gu` cycle (now supplied).
- [E2 §4](e2-cardinality-multireinstater-2026-05-31.md) — the generator/power-set
  level split (`Inc(B)` vs `𝒫_fin(Inc(B))`) that localises the fixpoint to the
  aggregation level.
- [Q-037 registry entry](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) — lifts to
  unrestricted-propositional on this close.
- [`LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md)
  §4/§5 — the guarded fallback this audit resolves.
- Ambler, S. (1996). *A categorical approach to the semantics of argumentation*.
  MSCS 6(2) — p. 171 (monotone accrual; no object-level defeat).
- Baelde, D. (2012). *Least and greatest fixed points in linear logic*. ACM TOCL
  13(1) — the μMALL/μMELL the design level is shown **not** to need.
- Dung, P. M. (1995). *On the acceptability of arguments…*. Artif. Intell. 77(2)
  — the acceptability fixpoint the aggregation level **does** carry (finite).
- Knaster–Tarski (fixpoints on complete lattices) — finite lattice ⟹ finite
  iteration, the structural reason (b) does not fire.
