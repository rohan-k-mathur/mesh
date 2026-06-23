# Verification Prompt — independent cross-check of Q-032 **Res-A′** (the BT2010-retargeted representation bijection) + final promotion gate

> Paste into a **fresh** thread. You are an **independent non-author cross-checker**.
> Your job is to **adversarially verify or refute** the Res-A′ discharge — not to
> rubber-stamp it. This is the **final gate** for Q-032: Res-C is already cleared
> (D-C1 resolved) and D-A1 is repaired (route 2), so **a clean Res-A′ sign-off
> promotes [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) → `established`
> and closes [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032).** The programme's
> discipline: confident-but-wrong proofs were caught here twice already (D1 — a
> *linear smuggle*; D-A1 — a *target-grammar mismatch*). Hold this draft to the same
> bar. The single most important thing to confirm is that **Res-A′ does not re-commit
> D1 or D-A1**, and that its **one genuinely open lemma (Leg-1) is a real bijection**,
> not a permutation-quotient dressed up as one.

## What you are checking

The claim (residual **Res-A′** of the Q-032 R-track, after the route-2 re-target): the
map

`φ : { βη-long-normal STLC λ-terms of 𝒞/Γ(A, B^♯) }  ⥲  Gen!(B)`

is a **bijection** on the ground `{→, ×, atom}` Ambler fragment, where `Gen!(B)` is the
set of **material proof designs** of the BT2010 logical behaviour `B = ⟦B^♯⟧`. It is
built as a composite of three legs:
1. **(Leg-1, the open lemma)** βη-long-normal STLC `{→,×}` terms ↔ focalized cut-free **BT2010/LLP** derivations;
2. **(Leg-2, cited)** derivation ↔ design — a bijection *by construction* (BT2010 Def 3.2 proofs-are-proof-terms; §3.1 deterministic proof search; Thm 3.5/3.8);
3. **(Leg-3, cleared)** design ↔ material design — unique material representative ([Res-C](q032-res-c-materiality-2026-06-19.md), D-C1 cleared).

Composed with Leg-2/Leg-3 it yields the full `Gen!(B) ⥲ 𝒞_base(A, B^♯)` the bridge map
`φ` needs (C001b′ b₁′ ∧ b₂′).

## Read (in order)

1. **`RESEARCH_PROGRAMME/audits/q032-res-a-prime-2026-06-20.md`** — the artifact under check (§0–§7; verdict BIJECTION; the open Leg-1 item in §6.1).
2. `RESEARCH_PROGRAMME/audits/q032-res-a-translation-2026-06-19.md` §Re-target (route 2) — the D-A1 repair this builds on (the reason the leg moved off BF MELLS).
3. `RESEARCH_PROGRAMME/audits/q032-res-c-materiality-2026-06-19.md` §Cross-check resolution — the Leg-3 (material-representative) discharge it composes with.
4. **BT2010 (`RESEARCH_PROGRAMME/papers/ON THE MEANING OF LOGICAL COMPLETENESS.pdf`)** — Ex 2.14 (connectives), §3.1 (proof system + deterministic proof search), Def 3.1 (logical behaviours), Def 3.2 (proofs), Thm 3.5/3.8 (soundness/completeness), **App A** (the constant-only LLP embedding — the load-bearing one for Leg-1's target). **Terui 2011 (`Terui_ComputationalLudics.pdf`)** §1 ("designs extend η-long λ-terms"), Def 2.17 (function designs). The PDFs are in-repo; the check's value is in confronting the audit's *readings* of them with the actual text (extract with `python3.12 -m pypdf`).
5. `RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md` §Cross-check notes (D1, D-A1) — the two defects Res-A′ must not re-commit.

## The load-bearing items to attack (do not skip any)

- **V-A′1 — the *native* Leg-1 representation lemma is a genuine bijection (highest priority; now THE sole open item).** **NOTE (re-grounded 2026-06-21):** after defect D-A′1, Leg-1 no longer goes through App A/LLP — it is now the **native** claim: βη-long-normal STLC `{→,×,atom}` terms ↔ cut-free identity-free η-long **BT2010 c-designs** of the corresponding logical behaviour (arrow via Terui **function designs** Def 2.17; product via a binary ramification; atoms via **0-ary names**). The classic trap: *sequent-proofs → terms is usually many-to-one* (rule-permutation quotient). The audit claims the **locative/focalized c-design discipline + deterministic proof search** collapse this to 1–1. **Stress both directions:** (a) construct two distinct cut-free identity-free η-long c-designs of the same behaviour with the **same** λ read-back; (b) construct a βη-long-normal term with a **non-unique** c-design. If either succeeds, Leg-1 degrades to a bijection *up to a proof-equivalence*. (The prior re-check found no counterexample either way — try to.)
- **V-A′2 — confirm D-A′1 is fully excised; the native grounding is the basis (was: the App-A embedding).** The original Res-A′ leaned on **BT2010 App A** as Leg-1's faithfulness certificate; defect **D-A′1** showed App A's Thm A.4/A.5 are *derivability-only* over the design-erased skeleton `L` (BT2010: *"verify carefully that the translation preserves the reduction relation"*), and its LLP is **constant-only (no atoms) and classical** — the D-A1 trap-genus. The audit was **re-grounded** ([§Re-grounding](q032-res-a-prime-2026-06-20.md#re-grounding-d-a1-repair-2026-06-21--leg-1-committed-to-the-native-target)). **Verify the repair is complete:** (a) §1/§4/§6.1 and the §7 verdict no longer cite App A as a *faithfulness* certificate (App A may appear **only** as evidence-of-kind); (b) the Ambler types are obtained as logical behaviours **directly** (Ex 2.14 arrow `↑↑↑A^⊥ ℘ B` + Terui function designs + **0-ary-name** atoms + ramification product), with **no derivability-only step** anywhere on the critical path; (c) no residual `"BT2010/LLP"` conflation survives. If any App-A/derivability dependency remains load-bearing, **D-A′1 is not cleared.**
- **V-A′3 — Leg-2 "bijection by construction," and the materiality subtlety.** The §3.1
  determinism quote is about the **positive** rule ("head variable `z` and first positive
  action `a` determine the next positive rule"). The **negative** rule carries the
  "immaterial" arbitrariness (arbitrary `Pb` for `b ∉ α0`). So design→derivation is
  single-valued **only on material designs**. **Check:** does the audit correctly
  restrict to `Gen!(B)` (material) so that Leg-2 ∘ Leg-3 is actually 1–1, with **no**
  residual ambiguity from the negative rule? Confirm Res-C (Leg-3) is exactly what closes
  this, and that the composition has no seam.
- **V-A′4 — the realizer `⟦M⟧` is a legal proof design, including the nonlinear case.**
  Confirm `⟦M⟧` is total, deterministic (unary `⋀`), `✠`-free, cut-free for every
  βη-long-normal `M` (§2). **Push on `g_r`** (the doubled-`t₁` robustness term): is its
  realizer a legal *nonlinear* BT2010 design with the contraction internalized (Ex 2.14),
  genuinely **not** needing an `!`-box, and still **deterministic** despite the doubled
  use? If the doubled use forces nondeterminism (a non-unary `⋀`), it would fall outside
  the proof fragment (Def 3.2) and `φ` would miss it.
- **V-A′5 — D-A1 non-recurrence.** Confirm Res-A′ genuinely avoids the synthetic-MELLS
  head-exponential grammar that sank the prior Res-A — i.e. that the `⊸`-headed image is a
  legal BT2010 logical behaviour with **no re-synthesis step** smuggled in. (Route 2's
  whole point.)
- **V-A′6 — D1 non-recurrence.** Confirm Res-A′ uses **no** linear-incarnation / Cor 3.22
  stability / `⋂`-meet machinery (it shouldn't — it is proof theory + BT2010 nonlinear
  completeness). A reappearance of linear stability anywhere = D1 again = blocking.
- **V-A′7 — worked instance.** Independently re-derive `⟦g₁⟧, ⟦g₂⟧, ⟦g_r⟧` as **BT2010
  designs** (not MELL proofs), confirm they are material proof designs, pairwise distinct
  (distinct head focus), and that deterministic proof search reads each back to the right
  λ-term. Confirm `|Gen!(B_aspirin^★)| = 3`.

## Cross-cutting checks (the two prior author-side resolutions)

Because this is the **final gate**, also spot-confirm the two defects the author resolved
without an independent pass:
- **D-C1 clearance (Res-C).** The author cleared D-C1 by verifying BF §11 (Prop 11.8, Def
  11.2, Lemma 11.4) against the in-repo PDF. **Spot-check** those three statements verbatim
  in `RESEARCH_PROGRAMME/papers/LUDICS WITH REPETITIONS 1104.0504v3.pdf` and confirm they
  say what Res-C needs (`|D|_B ∈ B` well-formed; `D[E]` union-over-runs; Lemma 11.4 support).
- **D-A1 repair (route 2).** Confirm the *decision* to re-target to BT2010 is sound and the
  carrier consequence is correctly recorded (B → `uses-c-design`; [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030)
  carrier-input bullet) — not a blocker for T012, but it must be honest.

## How to report

- **Clean:** state "Res-A′ cross-check: **SIGNED OFF**" with a one-paragraph justification
  per V-A′1…A′7 (chiefly that Leg-1 is a genuine bijection and the App-A embedding is
  proof/design-level), plus confirmation of the D-C1 spot-check and the D-A1 repair. Then
  **all of Res-A′ + Res-C + D-A1 are clear**, and you may record that
  [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) is eligible for `established`
  and Q-032 for closure (modulo the light Res-B/Res-D, already CONFIRMED/SCOPED-OUT).
- **Blocking defect / degradation:** label it **D-A′1, D-A′2, …**; state precisely which
  item fails, with the minimal counterexample (e.g. the two-derivations-one-term for V-A′1,
  or the derivability-only embedding for V-A′2) or the broken inference, and whether the
  outcome is a **hard failure** or a **degradation** (e.g. bijection-up-to-proof-equivalence).
  **Do not soften** — a Leg-1 permutation-quotient (V-A′1) or a derivability-only App-A
  embedding (V-A′2, = D-A1 redux) is exactly what this check exists to catch.

Record your verdict in the Res-A′ audit's status header + a `## Cross-check notes` section,
and update `RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md` Q-032 status accordingly. On a
clean sign-off, T012 → `established`, Q-032 → closed, Phase 4 ([Q-028a stratum-2](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a))
unblocked; **do not** promote on Res-A′ alone if your spot-checks of D-C1 / D-A1 surface a
new problem.
