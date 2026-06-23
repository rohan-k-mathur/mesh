# Q-028b settlement — Session 1 (O-1, O-2, O-3 the freeness crux)

- **date:** 2026-06-22
- **session:** Gate 2 Session 1 of [session-19 scope](../10_IDEATION_SESSIONS/19-q028b-settlement-q033-polymorphism-scoping-2026-06-22.md) (Part A).
- **scope of this audit:** the three Session-1 obligations — **O-1** (DP-leg substitution), **O-2** (discharge the fifth side-data item), **O-3** (the freeness crux: is `𝒫_fin(Gen!(B))` genuinely the *free* JSL the bridge needs?). O-4 (δ-dissolution at `!`) + O-5 (write the reduction theorem) are Session 2.
- **verdict:** **O-1 ✓ assembly clean · O-2 ✓ discharged via T012 · O-3 ✓ POSITIVE — freeness holds.** The crux passes: `𝒫_fin(Gen!(B))` is the free JSL on `Gen!(B)`, and it faithfully matches Ambler's `𝒫_fin(𝒞/Γ)`. The one genuine `!`-layer obligation surfaced and discharged here is the **antichain lemma (L-AC!)** — the proof-layer analogue of the Phase-2e/T002 antichain, which T012 had superseded and freeness needs back. It is **D1-free**. One non-blocking residual recorded (within-cone join at the `!`-layer; orthogonal to the bridge join). **Gate 2 is on track; Session 2 (O-4 + O-5) may proceed.**
- **cross-check (2026-06-22):** **SIGNED OFF** as part of the [Q-028b settlement cross-check](q028b-settlement-crosscheck-2026-06-22.md) (6/6 PASS). Two grounding tightenings folded below: **N-1** — L-AC!'s negative-locus step rides on **determinism + materiality (BF Def 11.5) + winning (`Gen!(B)⊆B`)**, *not* on "totality" as a bare syntactic property (substantively the same, but the citation is now exact); **N-2** — Cross-Cone Incompatibility at the `!`-layer rides on **Res-C** (unique material representative), not the linear FQ minimality the MALL Phase-2e text invokes.

> Reading order: [Q-028b freeness audit](q028b-freeness-argument-2026-05-29.md) §1 (the free-JSL setup) + §9.2 (the fifth side-data item); [T012 Statement (R-track)](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md#statement-r-track) (Gen!(B), φ, generation); [Res-C discharge](q032-res-c-materiality-2026-06-19.md) (unique material representative); Phase 2e proof [`LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md) (the antichain + Cross-Cone Incompatibility this ports).

---

## 0. The session in one sentence

Settlement plugs T012's `Gen!(B)` into the generator slot of the MALL freeness argument; Session 1 confirms the two assembly steps (O-1, O-2) are clean and resolves the one place a real obstruction could hide — **O-3, whether the Ludics-side bridge object is genuinely the free JSL `𝒫_fin(Gen!(B))`** (so that "maps between free JSLs are determined on generators" applies and T012's generator bijection lifts to the full JSL iso).

---

## 1. O-1 — DP-leg substitution (assembly)

The MALL reduction ([freeness audit §6](q028b-freeness-argument-2026-05-29.md)) defines

```
φ_MALL : Inc(B) → 𝒞/Γ(A, B^♯),   D ↦ δ⁻¹(CH(DP(D)))
```

a composite of **DP** (design-as-proof, FQ-2013, MALL) → **CH** (Curry–Howard, β-normal λ-terms) → **δ⁻¹** (inverse defeat-encoding). The §9.1 obstruction was that **DP is MALL-only**; the `!`-translated image is MELL.

**T012 supplies the MELL replacement and it factors identically.** T012 Statement (2) gives

```
φ : Gen!(B) ⥲ 𝒞_base(A, B^♯)
  = Gen!(B) ↔ {cut-free BT2010 derivations of B}  ↔  {β-normal η-long λ-terms} = 𝒞_base
                 └────── DP (BT2010 Def 3.2 + §3.1 + Thm 3.8) ──────┘ └─ CH (Res-A′ §8) ─┘
```

The two legs are exactly **DP** (design↔derivation, now BT2010 c-designs — bijection by construction, D-A1-repaired) and **CH** (derivation↔λ-term, the native Res-A′ representation bijection). Composing with **δ⁻¹** on defeat actions reproduces the §6 chain verbatim, only re-grounded at the `!`-layer:

```
φ_! : Gen!(B) → 𝒞_base(A, B^♯),   D ↦ δ⁻¹(CH(DP_!(D)))
```

**Finding (O-1).** The substitution is structural: `φ_!` *is* T012's φ pre-composed with `δ⁻¹`, and the reduction theorem's chain is unchanged in shape. No new content; the §9.1 "linear shadow of B" restriction is lifted because BT2010 admits arrows / contraction natively (Ex 2.14). **O-1 clean.** ∎

---

## 2. O-2 — discharge the fifth side-data item (assembly)

[Freeness audit §9.2](q028b-freeness-argument-2026-05-29.md) recorded that, under BF-incarnation (option b), the four-item side-data taxonomy `(Γ, A-pres, pol-align, δ)` gains a **fifth** item:

> *"the side-data taxonomy gains a fifth item under option (b): the antichain witness, since materiality is no longer minimality-by-theorem."*

i.e. at MALL the generating set's canonicity was free (FQ Prop 5.2/5.3 minimality-by-theorem); at the `!`-layer BF materiality proves no minimality theorem, so a *witness* that `Gen!(B)` is a canonical generating set would have to be carried as extra input.

**Finding (O-2).** **T012 IS that witness** — it is precisely the `!`-layer canonical-generator theorem (`Gen!(B)` determined by `B` alone; Statement (1) Canonicity + Statement (2) the completeness bijection). With T012 `established`, the fifth item is **discharged as a theorem, not carried as side data**. The taxonomy returns to the four conventional/dissolved items. Moreover O-3 below sharpens this: the *antichain* part of the witness is recovered structurally (totality + determinism), so it is not even an independent input — it is a corollary of the proof-design discipline. **O-2 discharged.** ∎

---

## 3. O-3 — the freeness crux (the substantive check)

### 3.1 What freeness must deliver, and why it is the crux

The settlement argument is: both bridge sides are **free JSLs on canonical generating sets**, so (Mac Lane *CWM* IV.1) a map between them is determined by its restriction to generators, whence

```
C001b′ b₁′∧b₂′  ⟺  φ_! : Gen!(B) ⥲ 𝒞_base(A, B^♯) a bijection,
```

and T012 gives the bijection. **The hinge is the word "free" on the Ludics side.** At MALL, freeness of the LHS came from the **T002 antichain** (`Inc(B)` is an antichain ⇒ generators are independent join-irreducibles ⇒ `𝒫_fin(Inc(B))` is free and faithfully models `B`'s aggregation) — proved in [Phase 2e](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md). **T012 explicitly *superseded* the antichain** ("the completeness bijection is strictly stronger than 'no internal redundancy'"). So freeness needs the antichain **back at the `!`-layer**, and the completeness bijection alone (a bijection of *sets*) does not obviously supply it. **This is O-3.**

Precisely: `𝒫_fin(X)` is *tautologically* the free JSL on any set `X`. The real question is whether the **actual Ludics-side bridge object** `𝒞_semi(A, B^♯)` (the hom in the JSL-enriched category, living inside the bi-orthogonally closed `B = B^⊥⊥`) **equals** `𝒫_fin(Gen!(B))` or is a **proper quotient** of it. It is a quotient iff some aggregate of generators that `𝒫_fin` keeps distinct is identified inside `B` — i.e. iff a generator is a non-trivial design-level join of others (failure of join-irreducibility), or two distinct generators are forced equal (failure of distinctness).

### 3.2 The load-bearing lemma — L-AC! (antichain from totality + determinism)

> **Lemma L-AC! (`!`-layer antichain).** Distinct elements of `Gen!(B)` are pairwise `⊑`-incomparable (`⊑` = chronicle-set inclusion). Equivalently, no material proof design is a non-trivial design-level join of other material proof designs — every `D ∈ Gen!(B)` is **join-irreducible** in `B`.

**Proof.** Let `D₁, D₂ ∈ Gen!(B)` with `D₁ ⊑ D₂`. Both are **total, deterministic, `✠`-free proof designs** and **material** (`D = |D|_B`, BF Def 11.5), and both lie in the behaviour (`Gen!(B) ⊆ B`, hence **winning**: `[D,E]` converges for all `E ∈ B⊥`). Suppose `D₁ ≠ D₂`, so some `χ ∈ D₂ \ D₁` first diverges at a locus `p`:

- **Positive (Player) locus.** Determinism gives each design one action at `p`; if they differ, `D₁` plays `b'` and `p·b' ∈ D₁ \ D₂`, contradicting `D₁ ⊑ D₂`. So divergence cannot first occur at a positive locus.
- **Negative (Opponent) locus.** Then `χ` branches at a negative `p ∈ D₁` via an Opponent action `a` that `D₁` lacks. **Materiality of `D₂`** makes `χ` *visited* by some `E ∈ B⊥`; since `D₁ ⊑ D₂` share the prefix to `p`, that same `E` drives `D₁` to `p` and plays `a`. **Winning of `D₁`** (`D₁ ∈ B`) forces `[D₁,E]` to converge, so `D₁` must already respond at `a` — i.e. it has the `a`-branch. Contradiction.

Hence `D₂ = D₁`, and `Gen!(B)` is a `⊑`-antichain. ∎

*(Grounding per cross-check N-1: the load-bearing facts are **determinism + materiality of the larger + winning of the smaller** — all in the `Gen!(B)` definition — not "totality" as a standalone completeness property. Totality still guarantees the designs are complete proofs; the antichain step itself is carried by materiality + winning.)*

For join-irreducibility: suppose `D = D' ∨ D''` for the *design-level* join with `D', D'' ⊑ D`, `D', D'' ∈ Gen!(B)`. By the antichain, `D' ⊑ D` with both in `Gen!(B)` forces `D' = D` (or `D'` not a generator); likewise `D''`. So any such decomposition is trivial — `D` is join-irreducible. ∎

**Why this is the right `!`-layer argument and is D1-free.** At MALL the antichain (T002) needed real work because `Inc(B)` ranges over **incarnations**, which can be *partial* (material but not total) and hence `⊑`-comparable — minimality-by-theorem (FQ Prop 5.2/5.3, *linear*) did the lifting. **`Gen!(B)` is the set of total *proof* designs**, where the antichain follows from **determinism + materiality + winning** (§3.2 proof) with no appeal to linear stability (Terui Cor 3.22) or FQ minimality. This is exactly why T012 could drop the explicit antichain construction: at the proof layer it is recovered for free. **D1 cannot recur** (the D1 defect was importing *linear* stability; L-AC! uses neither stability nor linearity).

### 3.3 Distinctness and generation (the two supporting facts)

- **Distinctness (no duplicate generators).** Two material proof designs with the same interaction against every `E ∈ B⊥` are equal — this is exactly [Res-C](q032-res-c-materiality-2026-06-19.md) (idempotent `⋃`-materiality ⇒ unique material representative per interaction class), already **cleared** (D-C1 resolved). So `Gen!(B)` is a set of genuinely distinct elements; equivalently φ_! is injective (b₂′). No two generators collapse.
- **Generation (no missing generators).** `B`'s proof content is recovered from `Gen!(B)`: BF Prop 11.8 (`|D|_B ∈ B` for every `D`) + T012 Statement (3) (`𝓕(Gen!(B))` matches Ambler's `𝒫_fin(𝒞/Γ)`). So the join-closure of `Gen!(B)` is all of `𝒞_semi(A, B^♯)`; nothing outside the generated free object.

### 3.4 The join is the free join (Phase 2e), so no accidental relations

The remaining way freeness could fail is an **accidental relation** among joins — e.g. `{D₁} ∨ {D₂} = {D₃}` (a 2-set equal to a singleton) or `{D₁,D₂} = {D₃,D₄}`. This is exactly what **Phase-2e Cross-Cone Incompatibility** rules out, and the structure ports:

- **Cross-cone:** distinct generators in disjoint cones have **no design-level join** in `B` (Phase 2e Cross-Cone Incompatibility); their only aggregate is the `𝒫_fin` 2-set — which is never a singleton. ✓ *(Grounding per cross-check N-2: the MALL Phase-2e Cross-Cone proof invokes FQ uniqueness-of-incarnation, which is **linear**; at the `!`-layer its analogue is **[Res-C](q032-res-c-materiality-2026-06-19.md)** — idempotent `⋃`-materiality ⇒ unique material representative. The port is licensed because Res-C is cleared; this is the one place the MALL antichain was genuinely linear, now threaded through Res-C.)*
- **Same-cone (incl. the stratum-2 head-`chk` block):** generators sharing a head action still cannot merge into one design — **determinism** at the disambiguating locus (the `!`-scheme locus for the `chk`-block; the premise locus at MALL) forbids a single design from offering both, so the aggregate is again the 2-set, not a generator (L-AC! join-irreducibility). ✓
- **Aggregation lives one level up:** the bridge join is `𝒫_fin` set-union by construction (the substrate models `𝒞_semi` as `𝒫_fin(Gen!(B))`; design-level within-cone unions are a *finer* object the bridge does not use). Ambler's side is identical — `𝒫_fin(𝒞/Γ)`, finite sets of λ-terms under union. So both sides are the **same free construction**, and φ_! (generator bijection) lifts to the JSL iso by Mac Lane IV.1. ✓

### 3.5 Assembling O-3

`𝒞_semi(A, B^♯) = 𝒫_fin(Gen!(B))` is the **free** JSL on `Gen!(B)` because: generators are a distinct set (Res-C, §3.3), they are join-irreducible / an antichain (L-AC!, §3.2), the join is `𝒫_fin` set-union with no accidental relations (Phase 2e, §3.4), and they generate everything (Prop 11.8 + T012(3), §3.3). Via the set bijection φ_! : `Gen!(B) ⥲ 𝒞_base`, Mac Lane IV.1 lifts this to a JSL isomorphism `𝒫_fin(Gen!(B)) ≅ 𝒫_fin(𝒞/Γ)` — i.e. the bridge `ε_{A,B}` is iso, **b₁′∧b₂′** at the `!`-layer, *uniformly* (no instance enumeration). **O-3 POSITIVE.** ∎

### 3.6 Worked-instance corroboration (the stratum-2 head-`chk` block)

The four generators of the [stratum-2 instance](q028a-stratum2-2026-06-22.md) (`D_{t₁}, D_{t₃}, D_{chk/t₁}, D_{chk/t₃}`) are pairwise `⊑`-incomparable total proof designs (L-AC!): none is a sub-design of another, since each is a complete deterministic proof selecting its own head/`!`-slot. The same-head pair `D_{chk/t₁}, D_{chk/t₃}` does **not** admit a design-level join (determinism at the `!`-scheme locus); their aggregate is the 2-set `{D_{chk/t₁}, D_{chk/t₃}} ∈ 𝒫_fin`. So on the worked instance `𝒫_fin` of the four generators is free on four join-irreducibles, matching `𝒫_fin` of the four Ambler terms `{a₁, a₃, b₁, b₃}`. Freeness is concrete here, not just asymptotic. ✓

### 3.7 Honest residual (non-blocking, orthogonal to O-3)

Phase 2f Reading A fixed the **within-cone** design-level join as literal chronicle-set union `D₁ ∪ D₂` at MALL. At the `!`-layer (BF designs-with-repetitions) this union may need a **repetition-aware** reading. This is a real Q-030 Phase-4 / Phase-2f-at-`!`-layer item — **but it concerns the design-level join, which the bridge does not use** (the bridge join is the `𝒫_fin` set-union, §3.4). So it **does not threaten O-3 / freeness of the bridge LHS**. Recorded here for the Q-030 architectural track, flagged orthogonal.

---

## 4. Verdict and what Session 2 inherits

| obligation | result |
|---|---|
| **O-1** DP-leg substitution | ✓ clean (φ_! = T012 φ ∘ δ⁻¹; chain unchanged in shape) |
| **O-2** fifth side-data item | ✓ discharged (T012 *is* the antichain witness; taxonomy back to 4 items) |
| **O-3** freeness crux | ✓ **POSITIVE** — `𝒫_fin(Gen!(B))` free & matches Ambler; load-bearing **L-AC!** (antichain from totality + determinism, D1-free) |

**The crux passed.** The one place Session-1 could have surfaced a genuine obstruction (O-3) instead yielded a clean positive, with the freeness recovered structurally at the proof layer (L-AC!) rather than needing a re-proved nonlinear antichain. Settlement is therefore **assembly-complete on the generator/freeness side**; what remains for **Session 2** is:

- **O-4 — δ-dissolution at the `!`-layer.** Confirm the `!`-translated defeat operator introduces no new encoding choice for higher-order generators (Q-031 deferred exactly this). The only remaining substantive check.
- **O-5 — write the `!`-layer reduction theorem** (the §6 Proposition re-grounded), run the explicit `F⊣U`-on-generators uniqueness step using L-AC! + O-1…O-3, and update Q-028b / C001b′ / T012 / runtime-contract guard tag. File an independent non-author **verification prompt** (L-AC! and the freeness assembly are the items to re-check) per the T012 / Res-A′ precedent.

**No promotion in this session.** T012 stays `established`; Q-028b stays "positive on MALL / discovery-positive at `!`-layer" until Session 2's reduction theorem + independent cross-check land. L-AC! is an **author-side** result pending that cross-check.

---

*Session 1 complete (O-1 ✓ · O-2 ✓ · O-3 ✓ POSITIVE). The freeness crux is the proof-layer antichain L-AC!, recovered from totality + determinism (D1-free) and backed by Res-C (distinctness), Prop 11.8 + T012(3) (generation), and Phase 2e Cross-Cone Incompatibility (free join). Next: Session 2 — O-4 (δ at `!`) + O-5 (reduction theorem + cross-check prompt).*
