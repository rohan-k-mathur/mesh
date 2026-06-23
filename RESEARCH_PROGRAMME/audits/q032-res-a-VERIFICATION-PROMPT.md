# Verification Prompt — independent cross-check of Q-032 **Res-A** (the `!`-translation bijection)

> Paste into a **fresh** thread. You are an **independent non-author cross-checker**.
> Your job is to **adversarially verify or refute** the Res-A discharge — not to
> rubber-stamp it. The programme's discipline: a confident-but-wrong proof was already
> caught once here (defect **D1**), repaired, and re-checked. Hold this draft to the
> same bar. A clean sign-off promotes it; a precise blocking defect sends it back.

## What you are checking

The claim (residual **Res-A** of the Q-032 R-track): the Girard call-by-name
`!`-translation induces a **bijection**

`{ βη-long-normal STLC λ-terms of 𝒞/Γ(A, B^♯) }  ⥲  { focalized cut-free MELLS derivations of !A^∘, !Γ^∘ ⊢ (B^♯)^∘ }`

on the **ground `{→, ×, atom}` Ambler fragment**. This is the *derivation↔λ-term* leg
of the bridge map `φ`; composed with the cited *design↔derivation* leg (BF Thm
11.16/11.17, BT2010 Thm 3.8) it gives the full `Gen!(B) ⥲ 𝒞_base(A, B^♯)` that the
Q-032 R-track needs.

## Read (in order)

1. **`RESEARCH_PROGRAMME/audits/q032-res-a-translation-2026-06-19.md`** — the artifact under check (Steps 1–4 + §4.4 verdict/scope).
2. `RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/18-q032-residual-discharge-scoping-2026-06-19.md` §2 — the scope/route this discharges, and the graceful-degradation boundary it must respect.
3. `Development and Ideation Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md` App C.7 (the **MELLS grammar**, verbatim) and App C.11 (the BT2010 App A `MELLS ↔ LJ₀` iso).
4. `RESEARCH_PROGRAMME/audits/q027-thin-cones-2026-05-29.md` §1–§2 (the Ambler base `𝒞/Γ`, the three worked generators).

## The load-bearing items to attack (do not skip any)

- **V-A1 — does the CBN image actually fit BF's *MELLS* grammar?** This is the sharpest
  question. MELLS has a **specific synthetic-connective grammar** (App C.7: positive
  `P ::= ?_P(N₁⊗…⊗Nₙ)`, negative `N ::= !_N(P₁ &…& Pₙ)`). The audit claims the CBN
  translation `(τ₁→τ₂)^∘ = !τ₁^∘ ⊸ τ₂^∘` (+ the `!(C&D)≅!C⊗!D` premise iso) "lands in
  pure constant-only MELLS." **Verify this literally:** does `!A^∘ ⊸ B^∘` (i.e.
  `(!A^∘)^⊥ ⅋ B^∘`), and the `⊗`-of-`!`'d-factors premise, parse inside the MELLS `P/N`
  grammar **with its focus/polarity discipline**, or does the image live in a *more
  general* polarized MELL that MELLS does not cover? If the latter, the composition
  with BF Thm 11.17 (which is stated **for MELLS**) does **not** type-check — a
  potential blocking defect. Decide: image ⊆ MELLS (clean) / image ⊆ polarized-MELL ⊋
  MELLS (gap — Thm 11.17 doesn't apply as cited).
- **V-A2 — is the image characterisation (S1)+(S2) exactly the co-Kleisli image?**
  (§3.1.) Check it is neither too broad (admits a focalized proof that is *not* a
  λ-term image) nor too narrow (excludes some `⟦N⟧`). Try to construct a focalized
  cut-free MELLS proof satisfying (S1)+(S2) with **no** λ-term preimage, or a `⟦N⟧`
  violating (S1)/(S2).
- **V-A3 — is the read-back `⟪·⟫` genuinely single-valued?** (§4.1.) The claim is that
  *focalization* removes the rule-permutation ambiguity. Stress it: find two distinct
  focalized proofs in the image with the same read-back (would break injectivity of
  `⟦·⟧` / surjectivity bookkeeping), or a focalized proof where the phase boundaries
  are **not** forced (would make `⟪·⟫` many-valued).
- **V-A4 — η-long matching.** (§4.2.) Verify `⟪⟦N⟧⟫ = N` really needs and uses
  η-long-normality, and that an η-short term is correctly *excluded* (not silently
  identified with its η-long form, which would break the bijection's domain).
- **V-A5 — the `!(C&D)≅!C⊗!D` canonicalisation (1.3).** Confirm it does **not** create
  a two-presentations collapse (two distinct conjunctive-premise terms mapping to one
  proof) and that choosing the `⊗`-form as canonical is consistent across the whole map.
- **V-A6 — scope honesty.** Confirm the degradation boundary is correctly placed:
  schematic propositional variables genuinely out of scope (Q-033), additive `⊕`
  case-analysis genuinely Res-D, and the conjunctive-premise `×` genuinely *in* scope.
  Check the aspirin family is actually inside the claimed fragment (it should be).
- **V-A7 — worked instance.** Re-derive `⟦g_r⟧` independently and confirm it has
  **exactly one** contraction (on `!(!mp⊸asp)`), is focalized + cut-free, and that
  `⟦g₁⟧, ⟦g₂⟧, ⟦g_r⟧` are pairwise distinct with read-backs recovering the three terms.

## Cross-cutting checks

- **D1 must not recur:** confirm Res-A uses **no** linear-incarnation / stability /
  `⋂`-meet machinery (it shouldn't — it's pure proof theory).
- **Citations vs. claims:** the audit leans on Girard 1987 §5 (CBN), Benton–Bierman–de
  Paiva–Hyland / Seely (co-Kleisli of `!`), Andreoli 1992 / Liang–Miller 2009
  (focalization↔normal forms), BT2010 App A (the `¬,∧` iso, as *corroboration only*).
  Check each is used for what it actually proves — in particular that BT2010 App A is
  **not** silently treated as the `{→,×}`-fragment theorem (it is the `¬,∧` fragment).

## How to report

- **Clean:** state "Res-A cross-check: SIGNED OFF" with a one-paragraph justification
  per V-A1…A7, and note the verdict (bijection on the ground fragment) stands. Then the
  only gate left for Q-032 is the **Res-C** check + the light F1/F4/Res-B/Res-D items.
- **Blocking defect:** label it **D-A1, D-A2, …**, state precisely which item fails and
  why (with the minimal counterexample or the broken inference), and what the repair
  would need. **Do not soften.** A genuine gap (e.g. V-A1 image ⊋ MELLS) is exactly the
  kind of thing this check exists to catch.

Record your verdict in the Res-A audit's status header + a `## Cross-check notes`
section, and update `RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md` Q-032 status
accordingly. **Do not** mark T012 `established` on Res-A alone — both Res-A and Res-C
must clear.

-------------

Cross-check complete. Verdict: BLOCKING DEFECT D-A1 — Res-A NOT signed off.

What I found
The sharpest item (V-A1) fails. The draft asserts the CBN !-translation image "lands in pure constant-only MELLS," but it does not:

BF's MELLS is a synthetic-connective grammar where every formula is !_N- or ?_P-headed (App C.7, verbatim). The draft's own translation table writes ordinary-MELL types like !mp ⊸ asp and !(!mp⊸asp) ⊸ !mp ⊸ !jp ⊸ asp — these are ⊸/⅋-headed, with no top exponential, so they fail the MELLS grammar at the root. This hits even the first-order generators g₁, g₂ (every Ambler rule is an arrow).
The image therefore lives in polarized MELL (MELLpol) ⊋ MELLS. The only proof-level MELLpol/LJ↔MELLS bridge BF gives is App A Thm A.8, stated for the ¬,∧ fragment (LJ₀), not {→,×}; Thm A.15 is derivability-only.
So the composition with BF Thm 11.16/11.17 (full completeness, stated for MELLS) is not licensed as cited. The draft's §3.2 already concedes Thm A.8 is "evidence-of-kind, not the theorem itself" — which is exactly the hole.
The remaining items: V-A4 (η-long) and V-A5 (canonicalisation) are clean; V-A2/A3/A7 are sound as MELL proof theory but inherit the target mismatch; V-A6 mis-draws the boundary (the aspirin family is in polarized MELL, not synthetic MELLS); D1 non-recurrence ✔.

Two repair routes (recorded): (1) explicitly focalized synthetic CBN translation + extend Thm A.8 from LJ₀ to {→,×} at the proof level (net-new); or (2) re-target the design leg to Terui c-designs / BT2010 Thm 3.8 (designs are λ-style — native fit) instead of BF MELLS.

What I changed
q032-res-a-translation-2026-06-19.md — status header flipped to BLOCKING DEFECT D-A1; added a full ## Cross-check notes section (D-A1 detail with the concrete grammar-parse failures, V-A1…A7, cross-cutting checks, repair routes, disposition).
01_OPEN_QUESTIONS_REGISTRY.md — added a dated cross-check result (Res-A) — D-A1 bullet to the Q-032 entry.
Per the prompt, T012 was not promoted and Q-032 stays open. Res-A failing alone keeps closure gated regardless of the independent Res-C check.