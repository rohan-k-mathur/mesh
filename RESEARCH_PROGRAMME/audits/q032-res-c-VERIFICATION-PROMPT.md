# Verification Prompt — independent cross-check of Q-032 **Res-C** (`⋃`-materiality idempotence)

> Paste into a **fresh** thread. You are an **independent non-author cross-checker**.
> Your job is to **adversarially verify or refute** the Res-C discharge — not to
> rubber-stamp it. This is the **keystone** residual (it carries b₂′ injectivity), and
> the programme already caught a confident-but-wrong proof here once (defect **D1**, a
> *linear smuggle*). The single most important thing you must confirm is that Res-C
> does **not** re-commit D1, and that its idempotence claim survives the **non-uniform
> (τ-sum) setting** where the nonlinearity genuinely bites.

## What you are checking

The claim (residual **Res-C** of the Q-032 R-track): BF's `⋃`-materiality operator
`|D|_B := ⋃{ D[E] : E ∈ B⊥ }` (BF Def 11.5) is **idempotent** — `||D|_B|_B = |D|_B` —
so the material designs are exactly its fixpoints, every interaction-class has a
**unique material representative**, and the bridge map `φ` has **no residual quotient**
(b₂′ injectivity; and the BT2010 Rmk 2.4 separation junk is auto-quotiented away).

## Read (in order)

1. **`RESEARCH_PROGRAMME/audits/q032-res-c-materiality-2026-06-19.md`** — the artifact under check (§1–§8; the verdict is IDEMPOTENT, no route-ii degradation).
2. `RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/18-q032-residual-discharge-scoping-2026-06-19.md` §1 — the scope/route, and the **route-ii degradation** the draft claims does *not* occur (your job: confirm or force it).
3. `RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md` §Cross-check notes (D1) — the *exact* defect Res-C must not re-commit.
4. **BF 2011 §11** (Def 11.2 `D[E]`, Def 11.5 materiality, Prop 11.8, Lemma 11.4) and **§7–8** (non-uniform strategies / τ-sums; the VAM normalization). These are the verbatim definitions the draft is audit-anchored to; the check's value is in confronting the draft's *readings* of them with the actual text.

## The load-bearing items to attack (do not skip any)

- **V-C1 — D1 non-recurrence (highest priority).** Confirm Res-C uses **only** BF's
  `⋃`-of-visited materiality (Def 11.5) + interaction locality + Prop 11.8, and **none**
  of the linear machinery D1 ruled out: no FQ/Sironi visitable-path *incarnation*, no
  Terui Def 4.7 `⋂`-incarnation, no Cor 3.22 **stability**, no linearity/separation
  assumption. If any linear result sneaks in (even implicitly, e.g. assuming the
  interaction is deterministic), that is **D1 again** → blocking.
- **V-C2 — BF Def 11.2 for non-uniform `E` (the τ-sum reading).** The draft (§3.0) reads
  `D[E]` as the **union over all nondeterministic runs** of the traversed `D`-views.
  **Check this against BF Def 11.2 verbatim.** If BF define `D[E]` only for
  deterministic `E`, or per-run, the §3.3 "non-uniform case is not special" argument
  must be re-expressed — confirm it still goes through or find where it breaks.
- **V-C3 — locality of the interaction ((Loc-1)/(Loc-2), §3.0).** The two-inclusions
  argument (§3.2) rests on: *a run's trajectory depends only on its traversed
  view-history, never on un-traversed parts of the design.* This is innocence/locality
  of the VAM (BF §8). **Stress it with τ-actions present:** is there any global
  condition (coherence, the "Copies" property VAM Prop 8.15, τ-positivity Def 7.2(2))
  by which restricting `D` to `|D|_B` could **change which τ-branches are available** or
  **change a run's convergence/divergence**? If a τ-run that explores `D` cannot be
  reproduced against `|D|_B` (or a new run appears), the inclusion `(|D|_B)[E] = D[E]`
  fails → route-ii degradation (or worse).
- **V-C4 — the saturation step (§3.1).** Confirm `D[E] ⊆ |D|_B` really is *immediate*
  from Def 11.5 (`|D|_B` is the union over **all** `E' ∈ B⊥`, including `E`). This is
  the structural crux; it should be airtight, but confirm there is no quantifier
  subtlety (e.g. `B⊥` not containing the `E` you test against, or `D[E]` defined
  relative to a different design).
- **V-C5 — `|D|_B` is a legal, interactable design.** §2/§4 use `(|D|_B)[E]` and
  `||D|_B|_B`, which require `|D|_B` to be a well-formed non-uniform strategy (Def 7.2:
  coherence + τ-positivity) **and** in `B`. The draft cites **Prop 11.8** (`|D|_B ∈ B`).
  Verify Prop 11.8 actually delivers *well-formedness* (not just set-membership modulo
  something), and that a **union of sub-designs** `⋃ D[E']` is coherent — a union of
  coherent sets need not be coherent in general, so this is a real check.
- **V-C6 — idempotence ⟹ the two roles.** Confirm (R-fix) "material = fixpoint, every
  design has a material rep" and (R-inj) "two material designs with equal interaction
  profiles are equal" genuinely follow (§1, §4). In particular check (R-inj) does not
  secretly need *more* than idempotence (e.g. that the profile `E ↦ D[E]` determines
  `D` — is that exactly `D = ⋃_E D[E] = |D|_B`, i.e. materiality? confirm no gap).
- **V-C7 — F4 tie-in.** Independently verify that **BT2010 Rmk 2.4's** separation
  witnesses `P, Q` (`P ≠ Q`, `{P}⊥ = {Q}⊥`) are **non-material** (and/or `✠`-terminated),
  hence not in `Gen!(B)` — so they are no counterexample to (R-inj). If they turn out
  **material**, separation bites `Gen!(B)` directly and Res-C's injectivity claim fails.

## Cross-cutting checks

- **Monotonicity claim (§4):** the draft calls `|·|_B` a kernel operator (reductive +
  monotone + idempotent). Reductive and idempotent are load-bearing; **monotone** is
  asserted via run-inclusion — check it, but note whether anything downstream actually
  needs it (if not, it can be dropped without affecting the verdict).
- **Route-ii honesty:** the draft claims **no** degradation to "idempotent-up-to-`∼`".
  If your V-C3 stress test forces a τ-run mismatch, the correct verdict is route-ii
  (`Gen!(B)/∼`), which is *recoverable* but weakens b₂′ from bijection to bijection-up-
  to-`∼` — report that precisely rather than as a hard failure.

## How to report

- **Clean:** state "Res-C cross-check: SIGNED OFF" with a one-paragraph justification
  per V-C1…C7, confirming idempotence holds (no route-ii). Then the only gate left for
  Q-032 is the **Res-A** check + the light F1/F4/Res-B/Res-D items.
- **Blocking defect / degradation:** label it **D-C1, D-C2, …**; state precisely which
  item fails, with the minimal τ-sum counterexample or the broken inference, and whether
  the outcome is a **hard failure** (idempotence false) or **route-ii** (idempotent-up-
  to-`∼`). **Do not soften** — a D1-style linear smuggle (V-C1) or a τ-run mismatch
  (V-C3) is exactly what this check exists to catch.

Record your verdict in the Res-C audit's status header + a `## Cross-check notes`
section, and update `RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md` Q-032 status
accordingly. **Do not** mark T012 `established` on Res-C alone — both Res-A and Res-C
must clear.
