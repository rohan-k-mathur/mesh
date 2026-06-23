# Session 19 — Scoping the `!`-layer settlement (Q-028b) and the schematic-polymorphism residue (Q-033)

**Date:** 2026-06-22
**Direction:** core ring — the two remaining gates between the now-`established` [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) / discovery-positive [Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) and a **diligence-grade** exponential-layer claim. **Gate 2** = [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b) uniform settlement (the actual C001b′ b₁′∧b₂′ closure at the `!`-layer). **Gate 3** = [Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) schematic / propositional-variable polymorphism (ground → schematic scope extension).
**Status:** **Scoping — no proof attempted.** States precisely what each gate requires, the obligations, the crux risk (with graceful-degradation fallbacks), honest scope boundaries, how-would-we-know, and an execution order. No theorem promoted, no code touched.
**Purpose:** record the plan agreed in-thread so the next working session reads an accurate trigger. The chain now holds at **discovery** strength end-to-end (T012 `established` → φ uniquely forced on the worked higher-order instance → runtime contract projects ground higher-order at *discovery* strength, [G3a lifted](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md)). The investor/presentational brief update (`docs/isonomia-ai-investor-brief-version2.md`) is gated on **settlement** (Gate 2), per the decision rule *"discovery-strength reachable now; wait for settlement before diligence-grade copy."* This session scopes the move from discovery → settlement, and the orthogonal polymorphism residue after it.

> Reading order: [Q-028b freeness audit](../audits/q028b-freeness-argument-2026-05-29.md) §1 + §6 (the MALL reduction whose *shape* ports) and §9.1/§9.2 (the MELL obstruction T012 now resolves); [T012 Statement (R-track)](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md#statement-r-track) (the `Gen!(B)`/φ this settlement plugs in); [Q-028a stratum-2 audit](../audits/q028a-stratum2-2026-06-22.md) (the discovery being upgraded to settlement); [Q-033 registry entry](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) (the SUFFICIENT-with-conditions lit-review verdict Gate 3 actions).

---

## 0. The two gates in one sentence each

- **Gate 2 (Q-028b settlement).** Move from *"φ uniquely forced on the worked higher-order instance"* (stratum-2 **discovery**) to *"φ uniquely forced for every `B` in the ground `{→,×,atom}` fragment, without instance enumeration"* (**settlement**) by plugging T012's canonical generator object `Gen!(B)` into the generator slot of the [Q-028b freeness argument](../audits/q028b-freeness-argument-2026-05-29.md) and running the `F⊣U`-on-generators uniqueness step — closing C001b′ **b₁′∧b₂′** at the exponential layer.
- **Gate 3 (Q-033 polymorphism).** Decide whether the product's *realized* scheme catalogue needs genuine propositional-variable polymorphism (Church-encoded combinators, schematic over propositions) or whether ground/parametric atoms suffice — i.e. whether the runtime contract's **G3b** guard can be made provably vacuous (scope-restriction, cheap) or must be discharged by a net-new ∀-layer canonicity arc (heavy, separate programme).

---

# PART A — Gate 2: Q-028b uniform settlement at the `!`-layer

## A.1 What "settlement" means and why it is mostly *assembly*

The registry's own Q-028b status records the MELL residue as *"**not** a settlement gap in the freeness argument but the orthogonal substrate-incarnation question Q-030 / Q-028a-stratum-2 (gated on Q-032)."* Both blockers are now cleared:

- **Q-032 / T012** supplies the MELL-capable **canonical generator object** `Gen!(B)` + the bijection `φ : Gen!(B) ⥲ 𝒞_base(A, B^♯)` — exactly the object §9.1 of the freeness audit said was missing. It already factors as the `CH∘DP` chain the §6 reduction uses: `Gen!(B) ↔ {cut-free BT2010 derivations} ↔ {β-normal η-long λ-terms} = 𝒞_base`.
- **Stratum-2** supplies the *discovery* that the bridge data forces φ at the higher-order layer.
- **Stress-test-1 verdict** (on file, [freeness audit §9.1](../audits/q028b-freeness-argument-2026-05-29.md)): *"the argument's shape is incarnation-notion-independent."*

So settlement = **substitute** `Gen!(B)`/T012 into the generator slot of the MALL §6 argument and **verify the categorical machinery carries over** — plus two genuine settlement-grade checks (O-3, O-4).

## A.2 Obligations

### Assembly (bookkeeping, low risk)

- **O-1 — DP-leg substitution.** Replace FQ-2013 MALL design-as-proof with T012's φ throughout the §6 reduction; confirm φ *is* the `δ⁻¹∘CH∘DP` composite at the `!`-layer (it is, by T012 Statement (2)), so the reduction theorem's chain is unchanged in shape, only re-grounded.
- **O-2 — discharge the fifth side-data item.** [Freeness audit §9.2](../audits/q028b-freeness-argument-2026-05-29.md) noted that under BF-incarnation a **fifth** side-data item appears — *"the antichain witness, since materiality is no longer minimality-by-theorem."* **T012 IS that witness.** With it discharged, the side-data taxonomy returns to the four conventional/dissolved items `(Γ, A-pres, pol-align, δ)`.

### The two genuine settlement-grade checks (the actual work)

- **O-3 (THE CRUX) — freeness of `𝒫_fin(Gen!(B))`.** At MALL, freeness of the LHS JSL came from the T002 antichain + FQ uniqueness-of-incarnation (no relations among generators). At the `!`-layer, BF materiality is a `⋃`-closure (Res-C idempotent). **Must confirm materiality-identification imposes no hidden JSL relations among the `Gen!(B)` generators** — i.e. `𝒫_fin(Gen!(B))` is genuinely the *free* JSL on `Gen!(B)`, not a non-trivial quotient. This is the analogue of stratum-2's `!`-scheme-locus crux: the one place a real obstruction could hide. Lean on T012 Statement (3) (`𝓕(Gen!(B))` matches Ambler's `𝒫_fin(𝒞/Γ)`) but earn the *no-relations* claim, since contraction/materiality could in principle identify generators the free construction must keep distinct.
- **O-4 — δ stays dissolved at the `!`-layer.** [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037)/[Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) dissolved the defeat-encoding side-data item *on the propositional fragment* — and Q-031 **explicitly deferred** the higher-order case to *"Q-028a stratum-2 / Q-030 territory."* Must confirm the `!`-translated defeat operator introduces **no new encoding choice** for higher-order generators. Plausible (the higher-order obstruction was generator-canonicality, now T012, not defeat-depth), but it is the one deferred check, so it must be stated and discharged, not assumed.

### Closing

- **O-5 — run the adjunction step + write the `!`-layer reduction theorem.** With O-1…O-4 clean, state the `!`-layer analogue of the §6 Proposition; the freeness step (Mac Lane *CWM* IV.1: maps between free JSLs are determined on generators; `F⊣U` restricted to generators forces the unique generator map) gives uniqueness **uniformly** — the move from discovery to settlement. Then update [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b) status (MALL-positive → MELL-positive on the ground fragment), [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′∧b₂′, T012 cross-links, and the runtime contract guard tag (*discovery-verified* → *settlement-proven* on ground higher-order).

## A.3 Honest scope boundaries

- **Ground `{→,×,atom}` only** — Q-033 schematic polymorphism stays out (Gate 3 / Part B).
- **Closes b₁′∧b₂′, NOT b₃′** — naturality remains downstream ([Q-029](../01_OPEN_QUESTIONS_REGISTRY.md#q-029) fibration home).
- **Paper meta-argument.** Optional `agda-categories` mechanisation is a follow-on cross-check (mirrors the T004→C001a precedent), not part of settlement.
- Likely touches one substrate doc — [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) Part II (the `F⊣U` framing; Q-030 Phase 4b) — to state the adjunction at BF-incarnation.

## A.4 How-would-we-know

- **positive** — O-3 confirms freeness, O-4 confirms δ-dissolution, the adjunction forces φ uniformly → **b₁′∧b₂′ close at the `!`-layer**; Q-028b promotes *"positive on MALL"* → *"positive on MELL (ground fragment)"*; the runtime guard upgrades *discovery-verified* → *settlement-proven*; the brief's conservative one-clause update is unblocked.
- **negative-obstruction (O-3 fails)** — materiality imposes relations → `𝒫_fin(Gen!(B))` is a quotient, not free; settlement needs a quotient-aware restatement and discovery-strength is the ceiling. (Graceful degradation: report "free" vs "free-up-to-materiality-`∼`", mirroring the Res-C "idempotent vs idempotent-up-to-`∼`" deliverable.)
- **negative-restatement (O-4 fails)** — higher-order defeat reintroduces an encoding choice → δ becomes substantive again at the `!`-layer; settlement carries an explicit δ parameter (still a positive, but parameterised).

## A.5 Session breakdown

- **Session 1 — O-1 + O-2 (assembly) and O-3 (the freeness crux).** O-3 is make-or-break; if it obstructs, stop and report — everything downstream is gated on it. **✅ COMPLETE 2026-06-22 ([audit](../audits/q028b-settlement-session1-2026-06-22.md)) — O-1/O-2 clean, O-3 POSITIVE** (freeness holds via the proof-layer antichain **L-AC!**, D1-free).
- **Session 2 — O-4 (δ-dissolution at `!`) + O-5 (write the reduction theorem, run the adjunction step, registry / C001b′ / T012 / contract updates).** File an independent non-author **verification prompt** per the T012 / Res-A′ precedent; promotion waits on a clean cross-check. **✅ DRAFTED 2026-06-22 ([audit](../audits/q028b-settlement-session2-2026-06-22.md)) — O-4 POSITIVE (δ order-blind), O-5 reduction theorem + `F⊣U` uniform-forcing assembled; [verification prompt](../audits/q028b-settlement-VERIFICATION-PROMPT.md) filed. Author-side / provisional pending cross-check — no promotion yet.**

---

# PART B — Gate 3: Q-033 schematic / propositional-variable polymorphism

## B.1 What Gate 3 is (and is mostly NOT)

[Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) is already **resolved-by-lit-review — SUFFICIENT-with-conditions**. The three-way split:

- **(i) ground factual atoms — SUFFICIENT, no extension** (Skolemise into MELLS 0-ary signature names).
- **(ii) additives — folklore-importable, NOT net-new** (BT2010 Thm 2.17/3.8; Terui Thm 4.14).
- **(iii) propositional-variable polymorphism — net-new BUT target-independent** — *none* of the four candidate ludics frameworks has propositional variables (all constant-only; BT2010 lists them + 2nd-order quantifiers as future work). So schematic polymorphism is a **scope question, not a target-selection one.**

Gate 3 is therefore **primarily a triage/scoping decision**, not necessarily a proof. It corresponds exactly to the runtime contract's **G3b** guard (schematic / polymorphic generators still routed to the unverified fallback).

## B.2 Obligations

- **P-1 — catalogue triage.** Inventory the substrate's *realized* scheme catalogue and argument-chain features ([the chain editor `components/chain/*`](../../components); [Q-015](../01_OPEN_QUESTIONS_REGISTRY.md#q-015) scheme-composition-as-cut-composition) for any generator needing **genuine propositional-variable polymorphism** (schematic over propositions, e.g. a Church-encoded composition combinator `(B→C)⇒(A→B)⇒(A→C)` polymorphic over `A,B,C`) — as opposed to **ground / parametric atoms** that Skolemise into 0-ary names and are already covered by Gate 2's settlement.
- **P-2 — the decision (per the registry next-action):**
  - **Path A (likely — scope-restrict).** If no realized scheme needs genuine polymorphism → **Q-033 closes by scope-restriction**; the **G3b** guard becomes *provably vacuous* on the product's actual inputs, so Gate 2's ground-higher-order settlement covers the **entire realized fragment**. Cheap; no new theory. This is the "responsible move" the registry already leans toward.
  - **Path B (heavy — carry out polymorphism).** If some realized scheme needs genuine propositional variables → file a **net-new ∀-layer canonicity arc** (a T012-analogue at the second-order / polymorphic-behaviour layer — no candidate framework provides it; BT2010 lists it as future work). This is a separate research programme, **NOT** part of the conservative brief claim.

## B.3 Honest scope boundaries

- **Gated on Gate 2.** Polymorphism extends the *settled* ground fragment; there is no point extending an unsettled one. So Gate 3 *decision* waits on Gate 2 landing — though P-1's empirical triage (product-facing) can run in parallel.
- **Likely a scoping decision, not a theorem.** The most probable outcome (Path A) closes Q-033 without new mathematics, by restricting scope and making G3b vacuous.
- **Brief impact:** Gate 3 only matters for a *maximal* "higher-order + schematic" claim. The conservative one-clause brief update (Gate 2) does **not** need Gate 3.

## B.4 How-would-we-know

- **positive-sufficiency (likely)** — P-1 finds no genuine polymorphism in the realized catalogue → scope-restrict, G3b vacuous, Q-033 closes cheaply; the realized fragment is fully settlement-covered.
- **negative (needs polymorphism)** — at least one realized scheme needs propositional variables → a net-new ∀-layer canonicity arc is filed; the brief claim stays at "ground higher-order" and the maximal claim is deferred to that arc.

## B.5 Session breakdown

- **Session 3 (after Gate 2 lands) — P-1 triage + P-2 decision.** Empirical inventory of the realized catalogue; then Path A (scope-restrict, close Q-033, retire G3b as vacuous) or Path B (file the ∀-layer arc). P-1 may be pre-fetched in parallel with Gate 2 Session 2 since it is product-facing, not proof-facing. **✅ DONE 2026-06-22 ([triage](../audits/q033-polymorphism-triage-2026-06-22.md)) — PATH A: realized catalogue is ground (architecturally enforced via `ArgumentPremise.claimId`); G3b vacuous; Q-033 closed by scope-restriction.**

---

## C. Execution order (the whole remaining arc)

1. **Gate 2 Session 1** — O-1 + O-2 + **O-3 freeness crux** — **✅ DONE 2026-06-22** ([audit](../audits/q028b-settlement-session1-2026-06-22.md); O-3 POSITIVE, lemma L-AC!).
2. **Gate 2 Session 2** — O-4 + O-5 + verification prompt → independent cross-check → Q-028b MELL-positive; runtime guard *discovery-verified* → *settlement-proven*. **✅ SIGNED OFF 2026-06-22 ([crosscheck](../audits/q028b-settlement-crosscheck-2026-06-22.md), 6/6 PASS) — promotion list fired across registry / C001b′ / runtime contract / TRIADS / brief.**
3. **Brief update** — the conservative one-clause edit to `docs/isonomia-ai-investor-brief-version2.md` (refusal-surface-geometry bullet / certification-theorem scope note), now diligence-grade. Gated on step 2 only. **✅ DONE 2026-06-22 — one clause added to the refusal-surface-geometry bullet (canonical-generator constraint extends to the exponential layer: function-typed rules + reused premises/contraction).**
4. **Gate 3 Session 3** — Q-033 triage + decision (Path A scope-restrict, likely; or Path B ∀-layer arc). For the *maximal* claim only. **✅ DONE 2026-06-22 — PATH A (scope-restrict); realized catalogue is ground; G3b vacuous; Q-033 closed.**

**Crux to watch:** Gate 2 **O-3** — the one place this could be a genuine obstruction rather than assembly. Everything else is either already in hand (T012, stratum-2, stress-test-1) or a deferred-but-plausible check (O-4, P-1).

---

*Session 19 scoping complete. Next action: Gate 2 Session 1 (O-1 + O-2 + the O-3 freeness crux). No theorem promoted; T012 stays `established`, Q-028b stays "positive on MALL / discovery-positive at `!`-layer", Q-033 stays "SUFFICIENT-with-conditions". Gate 3 is gated on Gate 2.*
