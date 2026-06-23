# T012 — Canonical `!`-layer generators via completeness-for-proofs (nonlinear analogue of T002)

> **Formulation note (2026-06-19).** This theorem was **originally** stated as a
> nonlinear *antichain* (the FQ/Sironi ⋂-incarnation ported under contraction). That
> formulation was **withdrawn** after cross-check **D1** showed its foundation is
> linear-only (Terui Def 4.7/Cor 3.22 are over *linear* l-designs; see [Cross-check
> notes](#cross-check-notes)). It is **replaced** by the **R-track** below:
> canonicity via *completeness for proofs*, which is proved nonlinearly in BF/BT2010
> and invokes no linear stability — so D1 cannot recur. The filename keeps `antichain`
> for link stability only.

- **status:** **established (2026-06-21)** — the full R-track is discharged. D1 repaired (foundation on completeness-for-proofs; no linear stability — D1 cannot recur); **Res-C / D-C1 cleared** (BF `⋃`-materiality idempotent, verified verbatim); the design leg re-targeted to BT2010 c-designs (**D-A1 dissolved**); and the route-2 **[Res-A′ discharge](../audits/q032-res-a-prime-2026-06-20.md) is SIGNED OFF** by an independent non-author final-gate re-check (2026-06-21 #2). The earlier degradation defect **D-A′1** (Leg-1's App-A/LLP grounding being derivability-only + atom-free) was repaired by re-grounding Leg-1 natively on Terui function designs (Def 2.17) + BT2010 §3.1 deterministic proof search + 0-ary-name atoms; the sole open lemma — the **native V-A′1 representation bijection** (βη-long-normal STLC `{→,×,atom}` ↔ cut-free identity-free η-long BT2010 c-designs) — was confirmed a genuine bijection (both failure modes structurally forbidden by Terui Def 2.4 + deterministic proof search; no counterexample). **V-A′1…A′7 PASS, D-C1 + D-A1-repair verbatim-confirmed.** [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → **closed**; Phase 4 ([Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a)) unblocked. *(Residual now discharged: the native V-A′1 lemma is **written out in full** at `{→,×,atom}` granularity — [Res-A′ §8](../audits/q032-res-a-prime-2026-06-20.md), 2026-06-21.)* \
  *Prior status (R-track, 2026-06-19, retained for trail):* provisional — **D1 repair ACCEPTED by re-check 2026-06-19** (foundation rebuilt on completeness-for-proofs; no linear stability; D1 cannot recur); **still NOT `established`** — the re-check found **Res-C (`⋃`-materiality idempotence) and Res-A (proof-level `!`-translation bijection) are undischarged *load-bearing* lemmas**, not formalities, plus a precision fix **F1** (the bijection b₂′ is reduced-to-residuals, not yet delivered) and a micro-check **F4** (verify BT2010 Rmk 2.4's separation witnesses are `✠`-terminated). See [Cross-check notes → Round 2](#round-2--r-track-re-check-2026-06-19). [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) closes only when Res-A + Res-C are **discharged** (proved), not merely confirmed well-posed. **(2026-06-21: Res-C/D-C1 cleared and the design leg re-targeted to BT2010 c-designs (D-A1 dissolved), but the route-2 [Res-A′ discharge](../audits/q032-res-a-prime-2026-06-20.md) was cross-checked and returned NOT SIGNED OFF — degradation defect D-A′1: Leg-1's App-A/LLP grounding is derivability-only + atom-free, the D-A1 trap-genus re-arising; repairable via the native Terui route, but T012 stays provisional and is NOT promotable until Leg-1 is re-grounded natively and the native V-A′1 lemma re-checked.)**
- **closes:** the `!`-translated (MELL) analogue of [T002](T002-inc-b-antichain.md) — a **canonical generating set** for `!`-bearing behaviours, supplying the left object of [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) `φ` (b₁′∧b₂′) at the exponential layer; partially-resolves [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032)
- **downstream (2026-06-22):** the C001b′ **b₁′∧b₂′ closure** this enables was settled **uniformly** via the [Q-028b `!`-layer settlement](../audits/q028b-settlement-session2-2026-06-22.md) (`F⊣U`-on-generators; freeness = the proof-layer antichain **L-AC!** built on `Gen!(B)`; δ dissolved at `!`), **independently cross-checked / SIGNED OFF** ([crosscheck](../audits/q028b-settlement-crosscheck-2026-06-22.md), 6/6 PASS). So `Gen!(B)` now grounds a *settled* (not merely discovery-level) `!`-layer bridge, on the ground `{→,×,atom}` fragment.
- **depends-on:** Basaldella–Terui 2010 (proofs Def 3.2; **deterministic proof search §3.1**; soundness Thm 3.5; **completeness-for-proofs Thm 3.8** — the design↔derivation leg; arrows native via internalized exponentials Ex 2.14; "equal up to materiality" fn 3); Terui 2011 (**function designs Def 2.17**, composition Lemma 3.2 — the c-design model of STLC, Res-A′); Basaldella–Faggian 2011 (`⋃`-materiality Def 11.5, `D[E]` Def 11.2, `|D|_B ∈ B` Prop 11.8 — the `Gen!(B)` canonicity + Res-C; finiteness via Rmk 11.12); Girard 1987 (`!`-translation) + Lincoln–Scedrov–Shankar 1993 (`!A⊸B` landing zone); [T002](T002-inc-b-antichain.md) (the affine FQ-side analogue). *(Design leg re-targeted from BF MELLS to BT2010 c-designs 2026-06-20 after cross-check D-A1.)*
- **source-of-proof:** [`../audits/q032-antichain-port-2026-06-16.md`](../audits/q032-antichain-port-2026-06-16.md) §"Repair (R-track)" (R0–R5 + Residuals) + §"Source review (2026-06-19)"; [Res-C discharge](../audits/q032-res-c-materiality-2026-06-19.md) (`⋃`-materiality idempotence, D-C1 cleared); [Res-A′ discharge](../audits/q032-res-a-prime-2026-06-20.md) (the design leg + the native V-A′1 representation bijection, §8)
- **proved-by:** Q-032 antichain port + R-track repair (2026-06-19) → D-A1 route-2 re-target + D-C1 clearance + D-A′1 native re-grounding + V-A′1 write-out (2026-06-20/21)
- **cross-checked-by:** independent non-author cross-checks — D1 (2026-06-18, against the original antichain → R-track repair); R-track Round-2 (2026-06-19, accepted-with-residuals); **Res-C** (2026-06-19 → D-C1; cleared 2026-06-20 against in-repo BF PDF); **Res-A** (2026-06-19 → D-A1; repaired route 2); **Res-A′** (2026-06-21 → D-A′1; repaired by native re-grounding); **Res-A′ final-gate re-check (2026-06-21 #2) — SIGNED OFF** ([notes](../audits/q032-res-a-prime-2026-06-20.md#cross-check-notes-2026-06-21-2--independent-non-author-final-gate-re-check-signed-off))
- **last-reviewed:** 2026-06-21

## Statement (R-track)

Let `B` be the `!`-translated (MELLS) image of an Ambler argument type `(A, B^♯)` —
a **logical behaviour** (BT2010 Def 3.1) in the nonlinear setting. Define the
**proof fragment** generating set

```
Gen!(B) := { material proof designs of B }
         = { D ∈ B : D total, deterministic, ✠-free, cut-free, and material (D = |D|_B) },
```

where materiality is `|D|_B = ⋃{ D[E] : E ∈ B⊥ }` (BF Def 11.5, the union of
*visited* parts — **not** the linear ⋂-incarnation). Then:

1. **(Canonicity.)** `Gen!(B)` is determined by `B` alone — the winning conditions
   and `⋃`-materiality mention only `B` and `B⊥`; no presentation choice, no linear
   stability, no `⋂`-meet.
2. **(Completeness bijection — b₁′ now; b₂′ modulo one re-check lemma.)** The bridge map
   `φ : Gen!(B) → 𝒞_base(A, B^♯)` is the composite
   `Gen!(B) ↔ {cut-free BT2010 derivations of B (= proof-terms)} ↔ {β-normal η-long λ-terms} = 𝒞_base(A, B^♯)`.
   **`φ` is surjective onto the generators (b₁′)** — established now, from completeness
   for proofs (BT2010 Thm 3.8) + the design↔derivation **bijection by construction**
   (proofs *are* proof-terms, Def 3.2; deterministic proof search, §3.1; soundness Thm
   3.5). **`φ` is a bijection (adds b₂′ injectivity)** with the **derivation↔λ-term** leg,
   which is **provisional on the single open [Res-A′](../audits/q032-res-a-prime-2026-06-20.md)
   Leg-1 fidelity lemma** (βη-long-normal `{→,×}` ↔ focalized cut-free BT2010/LLP
   derivations); the material-representative leg ([Res-C](../audits/q032-res-c-materiality-2026-06-19.md))
   is **cleared**. So: **b₁′ holds; b₂′/full bijection awaits the Res-A′ Leg-1 re-check.**
   *(The design leg is **BT2010 c-designs**, not BF MELLS — re-targeted after cross-check
   D-A1 showed the curried-arrow image lands in polarized MELL ⊋ BF's synthetic MELLS;
   BT2010 admits arrows natively, dissolving the mismatch.)*
3. **(Generation.)** `B`'s proof content is recovered from `Gen!(B)` (BF Prop
   11.8: `|D|_B ∈ B` for every `D`), and the free-JSL bridge target
   `𝓕(Gen!(B))` matches Ambler's `𝒫_fin(𝒞/Γ)`.

The antichain/cone-decomposition of the original formulation is **superseded** by
(2): the completeness bijection is strictly stronger than "no internal redundancy."

## Proof (pointer)

See [`../audits/q032-antichain-port-2026-06-16.md`](../audits/q032-antichain-port-2026-06-16.md)
§"Repair (R-track)":

- **(1) Canonicity** — R1. `Gen!(B)` = winning designs; `⋃`-materiality (BF Def
  11.5) is defined nonlinearly, so canonicity needs no linear stability.
- **(2) Bijection** — R2, **re-targeted to BT2010 c-designs (D-A1 repair, audit
  §Re-target)**. The design↔derivation correspondence is a **bijection by construction**
  (BT2010 Def 3.2: proofs *are* proof-terms; §3.1 deterministic proof search;
  Thm 3.5/3.8), where arrows are native (Ex 2.14 internalizes contraction) — *not* BF
  Thm 11.17 over MELLS, which D-A1 ruled out. Faithfulness (S1/b₂′) is then definitional
  (separation-independent): the separation counterexample (BT2010 Rmk 2.4) uses
  `✠`-terminated designs, so it does **not** apply to the `✠`-free proof fragment;
  injectivity reduces to the representation residual (Res-A′) and materiality-uniqueness
  (Res-C, **cleared** — BF Prop 11.8 + Def 11.2/Lemma 11.4 verified in-repo 2026-06-20).
- **(3) Generation** — R3.

The worked aspirin instance (O0/O5) is retained and re-read under R5: the three
designs `D_{t₁}, D_{t₂}, D_r` are **material proof designs** in bijection with the
three λ-terms; `D_r`'s doubled-`t₁` contraction is an unremarkable nonlinear proof
design under the bijection.

## What changed from T002 (affine) to T012 (R-track)

| T002 (affine, FQ) | T012 (R-track, nonlinear) |
|---|---|
| canonical set = `⋂`-incarnation antichain `Inc(B)` | canonical set = material **proof designs** `Gen!(B)` (`⋃`-materiality, BF Def 11.5) |
| no-redundancy from antichain (order-theoretic) | no-redundancy **and faithfulness** from the **completeness bijection** (BF Thm 11.17 / BT2010 Thm 3.8) |
| uniqueness of incarnation from FQ-2013 (linear) | not needed — bijection replaces it |
| cone decomposition | generation via BF Prop 11.8 + completeness |
| relies on linearity (each name once) | relies on **determinism + `✠`-freeness** (the proof fragment), which the Ambler `!`-image satisfies |

The substantive move is **abandoning the minimality/antichain target** (unavailable
nonlinearly — D1) and **substituting the cited completeness bijection**, which is
stronger and lands b₁′∧b₂′ directly.

## Status honesty

This is a **paper argument (R-track), provisional pending an independent (non-author)
re-check**, per the programme's status discipline (cf. T005, the E2 audit). The
re-check targets are the four fidelity obligations recorded in the [audit Repair
§Residuals](../audits/q032-antichain-port-2026-06-16.md#repair-r-track-2026-06-19--proof-design-canonicity-via-completeness-for-proofs):

- **Res-A** — the `!`-translation is a bijection STLC β-normal η-long λ-terms ↔
  cut-free MELLS derivations (ground-atom scope); cite Girard 1987 + Lincoln–
  Scedrov–Shankar 1993 + focalization.
- **Res-B** — the `!`-image behaviours are *logical* (BT2010 Def 3.1) so Thm 3.8 /
  Thm 11.17 apply.
- **Res-C** — `⋃`-materiality `|·|_B` is idempotent (a closure), so each
  materiality-class has a unique material representative (closes S1's faithfulness).
- **Res-D** — additive schemes import from BT2010 Thm 2.17/3.8 ([Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) folklore).

None of Res-A…D is the D1 stability gap (dissolved — no linear stability is used)
or the S1 separation counterexample (shown inapplicable to the `✠`-free fragment).

A `--safe` Agda corroboration in the style of T002's artefact is **optional and
evidence-only**; not required for `provisional`, and would not by itself promote to
`established`.

## What this enables

- Supplies the **left-hand object of `φ`** in [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md)
  b₁′/b₂′ at the exponential layer — a canonical generating set for `!`-bearing
  behaviours, which is the higher-order need of the **argument-chain** feature
  (chained schemes = scheme composition).
- Unblocks Phase 4: [Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) →
  [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b) MELL extension.
- Resolves the deferred [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030) carrier
  choice to the **BF-engine + BT2010-proof hybrid** (the proof is lineage-neutral, so
  no Terui retarget is warranted; audit carrier readout). *(Reinforced by the R-track:
  completeness-for-proofs is proved in **both** lineages — BF strategies and BT2010
  c-designs — so `B = lineage-neutral` a fortiori; the hybrid verdict is unchanged.)*

## Cross-check notes

**Independent non-author cross-check, 2026-06-18. Verdict: BLOCKING DEFECT D1; do not promote to `established`; [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) does not close.** (Pattern mirrors the C015 cross-check, which returned a blocking D1, was repaired, then signed off.)

### D1 (blocking) — the linear smuggle in O1 / O3.5

The proof's foundation — O1 (incarnation `|D|_B` is well-defined under contraction) and O3.5 (uniqueness of incarnation) — rests on **Terui 2011 Definition 4.7 (incarnation)** and **Corollary 3.22 (stability)**, and **audit O1.1 asserts “Terui Def 4.7 is *already the nonlinear setting*,”** citing Q-034 review §(e).

This is incorrect. **Terui Def 4.7 is stated over `l-designs`, which are *linear*:** “An l-design is a total, **linear**, identity-free c-design” (Terui §4.1); its behaviour theory is **MALL-level**, connectives “*without* exponentials” (Q-034 review §(a), quoting Terui §4.1/§4.3). The citation O1.1 leans on — Q-034 review §(e), *syntactic ergonomics* — only establishes that c-designs **as a syntax** may be nonlinear; it does **not** establish that Def 4.7's *incarnation theory* is nonlinear. The conflation is “c-designs (the syntax) can be nonlinear” ⇒ “the l-design incarnation theory is nonlinear,” which does not follow.

The programme's **own Phase-1 finding is the opposite, and explicit** ([Q-034/Q-033 review](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) §(b)): *“Terui's incarnation (Def 4.7) … every one of those is proved in the **linear/affine** fragment. The exponential layer that the substrate's `!`-image needs is BT2010's nonlinear setting, where **separation fails** … and **no minimality theorem is proved** — … not a theorem you can cite for the MELL antichain.”* Q-032 was filed precisely as **net-new work with no citable theorem**; closing it by **citing** Def 4.7 + Cor 3.22 contradicts that established finding.

Why this is load-bearing, not cosmetic:
- The genuinely nonlinear `!`-layer is **BT2010**, where normalization is **universally nondeterministic** (Terui Thm 4.10(2)) and behaviours are tested by **non-uniform / τ-sum** strategies (BF B4: non-uniform tests are *required* because linear/deterministic tests fail to validate contraction). Berry **stability is a deterministic/sequential property**; it is exactly what is *not* expected to survive the universal nondeterminism the exponentials introduce — so **Cor 3.22 cannot be invoked at the `!`-layer as written**. The author's own “residual 2” (O3.7: “stability … free of a hidden linear side-condition”) names this check and marks it “expected to pass”; on scrutiny it is the load-bearing gap and **does not pass** — the hidden side-condition is that Def 4.7/Cor 3.22 are the linear/deterministic fragment.
- Consequence: `|D|_B`'s well-definedness (“the meet lands in `B`”, O1.2) and uniqueness (O3.5) are **not established** for `!`-bearing behaviours. The antichain triviality (O3.4 — “minimal elements form an antichain,” correct in any poset) and the load-bearing-repetition Lemma (O3.2 — correct *given* a well-defined minimal-incarnation order) then have **no established foundation to stand on** at the `!`-layer.

**What survives D1 (reusable):** O3.4 (order-theoretic, trivially true) and the **load-bearing-repetition Lemma O3.2** (a genuine, correct new idea: materiality ⇒ every surviving repetition is essential, *given* the incarnation order). The defect is in the **foundation** (that a nonlinear incarnation/uniqueness theory exists), not in these abstract steps. **Repair path:** *construct* incarnation + uniqueness genuinely in the nonlinear BT2010 setting (the actual open work the lit review flagged) — or restrict to a deterministic sub-fragment and **prove** (not cite) stability there *with `!` live*, then show the argument-chain `!`-image lands in that fragment. Either is substantive; neither is a citation.

### S1 (secondary) — faithfulness assumed in O3.6

O3.6 step 1 (“distinct routes yield material designs `D₁ ≠ D₂` … they encode different proofs”) **assumes** distinct Ambler routes give distinct material designs. Under **separation failure** in the nonlinear setting (BT2010 Remark 2.4: distinct deterministic atomic designs `P ≠ Q` with `{P}^⊥ = {Q}^⊥`), “encodes a different proof” does **not** imply “different design.” This route→design **faithfulness** is exactly what the downstream [C001b′](../03_CONJECTURES/C001b-prime-ambler-remainder.md) **b₂′** / [Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) needs; O3.6 presents it as discharged (“closing the Sironi-Prop-2 gap”) but assumes it. Even after D1 is repaired, S1 should be tracked as the genuine b₂′ obstruction, not treated as closed by T012.

### Net

**The original antichain formulation stays withdrawn; the R-track (2026-06-19) is
the repair.** D1 is **addressed**, not patched: the linear ⋂-incarnation foundation
is abandoned and replaced by proof-design canonicity via *completeness for proofs*
(BF Thm 11.16/11.17, BT2010 Thm 3.8), which is proved nonlinearly and invokes no
linear stability — so D1 cannot recur. **S1 is reframed** from a standing separation
counterexample (which uses `✠`-terminated, non-proof designs, hence inapplicable)
to a positive injectivity obligation (Res-A + Res-C). **T012 remains `provisional`**
pending an independent re-check of Res-A…D; on clean signoff, T012 → `established`
and [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → closed. The **carrier readout
(hybrid)** is unaffected (reinforced — see above). *(Process mirrors the C015 → T011
D1 → repair → re-check → `established` precedent.)*

### Round 2 — R-track re-check (2026-06-19)

**Independent non-author re-check of the D1 repair. Verdict: D1 repair ACCEPTED; reduction is sound and D1-/S1-free; but T012 is NOT yet promotable — Res-C and Res-A are undischarged *load-bearing* lemmas, not confirmations.** No new blocking defect; the structure is correct and strictly stronger than the withdrawn antichain.

**What the re-check confirms (accepted):**
- **D1 is genuinely killed.** R1/R2 invoke BF Def 11.5 `⋃`-materiality + BF Thm 11.16/11.17 + BT2010 Thm 3.8 — all genuinely *nonlinear, exponential* results (BF §11 is the non-uniform setting; BT2010 is the `!`-layer). No linear `⋂`-meet, no Terui Cor 3.22 stability, no l-design incarnation. The D1 site (O1/O3.5) is deleted, not patched. ✓
- **The move is the right one and strictly stronger.** Building canonicity on *completeness for proofs* is exactly what the [Phase-1 review §(b)](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) said BF/BT2010 prove nonlinearly; the completeness bijection subsumes the antichain (b₁′∧b₂′ ⊃ no-redundancy). ✓
- **S1's separation counterexample is correctly *neutralised as a standing objection*** — the dodge "Rmk 2.4 witnesses are `✠`-terminated ⇒ not proofs" is the right shape (separation-failure junk is exactly the non-material `✠`-capped designs proofs exclude). It moves S1 from "counterexample" to "open positive obligation," which is honest. ✓ *(but see F4)*

**Why it is still not `established` — the residuals are real lemmas, not formalities:**
- **Res-C (`⋃`-materiality idempotence) is the KEYSTONE, and "plausible from BF Prop 11.8" undersells it.** Injectivity (b₂′) essentially *reduces to Res-C*: if `|·|_B` is the idempotent `⋃`-visited closure, then two material designs with the same `B⊥`-interaction have equal visited-parts, hence are equal — so injectivity on `Gen!(B)` follows and separation-failure (non-material junk) is automatically quotiented away. But idempotence of an **operationally-defined `⋃`-of-visited** operator is **not automatic** (unlike an intersection-incarnation, where it is definitional); it is precisely the kind of property that needs a real argument in the non-uniform setting. Res-C must be **discharged** (shown idempotent from BF Prop 11.8 + Lemma 11.4), not asserted. **This is the load-bearing residual.**
- **Res-A (proof-level `!`-translation bijection) carries the rest, and "standard, cite Girard 1987 + LSS 1993" undersells it.** LSS 1993 establishes *provability*-faithfulness of `!A⊸B`; a **proof-level bijection** {cut-free MELLS derivations} ↔ {β-normal η-long STLC λ-terms} is more (sequent-derivations→terms is usually a *quotient* by rule-permutations; the η-long matching and the focalized shape of the `!`-image need care). Res-A must be stated and **proved** as a bijection on normal forms, not waved as folklore.
- **Res-B, Res-D are light** (membership-in-logical-behaviour is immediate from the image being MELLS-formula interpretations; additives import per Q-033). Not load-bearing.

**Findings to apply:**
- **F1 (precision — reword required).** Statement (2) and audit R2 say `φ` "is a bijection" / "delivers b₁′ **and** b₂′ at once." That overstates: **b₁′ (surjection) follows now** from full completeness (modulo Res-B); **b₂′ (injection) is *reduced to* Res-A + Res-C (open)** — exactly as R4 correctly records. The honest statement is "`φ` is a **surjection** (b₁′) now, and a **bijection** (b₂′) **modulo Res-A + Res-C**." Reword Statement (2) / R2 to match R4, so the theorem head does not assert more than the residuals deliver.
- **F4 (micro-check — the S1-dodge's linchpin).** R4(1)'s "BT2010 Rmk 2.4 witnesses are `✠`-terminated" (cited as "SR.4") is the single fact that keeps separation-failure off the proof fragment. It must be verified against the **actual** Rmk 2.4 designs `P, Q`; if they are *not* `✠`-terminated, separation bites `✠`-free proofs directly and Res-C alone will not save injectivity. Add as an explicit re-check item.

**Net.** The repair is **accepted as a sound, D1-free, S1-free reduction** of Q-032's canonical-generator obligation to four fidelity residuals. T012 stays **`provisional`**. The author's framing — "re-check of Res-A…D is the only remaining todo" — is *almost* right but understates that **Res-C and Res-A are proof obligations to be *discharged*, not confirmations to be ticked**: Res-C (the `⋃`-materiality closure) is the keystone and is not automatic; Res-A needs a genuine proof-level bijection. On a clean **discharge** of Res-A + Res-C (with F1 reworded and F4 verified), T012 → `established` and [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → closed. *(Round 1 D1 → R-track repair → Round 2 accept-with-open-residuals mirrors the C015 → T011 cadence.)*
