# Q-032 Res-C discharge — `⋃`-materiality is idempotent (the b₂′ keystone)

- **status:** **D-C1 CLEARED (2026-06-20) — IDEMPOTENT verdict stands; Res-C gate lifted.** The cross-check's sole blocker (D-C1: BF §11 legality citations "unverified") was a source-availability gate — the reviewer's fresh thread lacked the PDF. The full BF 2011 PDF is now in-repo (`RESEARCH_PROGRAMME/papers/`); **Prop 11.8 (`|D|_B ∈ B`), Lemma 11.4, Def 11.2 (union-over-runs), and Lemma 11.3 (`D[E]` is a strategy) are confirmed verbatim** (see [Cross-check resolution](#cross-check-resolution-2026-06-20--d-c1-cleared-against-the-provided-bf-pdf-f4-cleared)), meeting the reviewer's exact "How to clear D-C1" conditions; **F4** (Rmk 2.4 witnesses `✠`-terminated + non-material ⇒ not in `Gen!(B)`) also cleared verbatim. Combined with the already-accepted V-C1 (D1-free), V-C3 (no route-ii), V-C4, V-C6, the **IDEMPOTENT** verdict holds. **Res-C is not independently `established`** (an independent re-reader may now confirm against the in-repo PDF), and **Q-032 closure stays gated by Res-A (D-A1 live)**. *(Prior: NOT SIGNED OFF — fidelity defect D-C1, 2026-06-19.)*
- **started:** 2026-06-19
- **goal:** prove `|·|_B` is **idempotent** — `||D|_B|_B = |D|_B` — so the material designs are exactly the fixpoints, each interaction-class has a **unique material representative**, and the bridge map `φ` has **no residual quotient** (b₂′ injectivity).
- **the D1 guard (load-bearing):** this is proved **from BF's `⋃`-materiality directly** (BF Def 11.2/11.5, Prop 11.8) and **not** from FQ/Sironi visitable-path incarnation — those are the *linear* (l-design) machinery that **D1** ruled out. No `⋂`-meet, no Terui Cor 3.22 stability, no linearity. See §5.
- **inputs:** BF 2011 §11 (Def 11.2 visited part `D[E]`; Def 11.5 materiality `|D|_B := ⋃{D[E] : E ∈ B⊥}`; Prop 11.8 `|D|_B ∈ B`; Lemma 11.4); BF §7–8 (non-uniform strategies, τ-sums, the VAM normalization); [Q-034 review App C.2](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) (Def 11.5 verbatim); [session 18 §1](../10_IDEATION_SESSIONS/18-q032-residual-discharge-scoping-2026-06-19.md).

> **Notation.** `D[E]` = the sub-design of `D` consisting of the views of `D`
> **visited** during the interaction `⟦D | E⟩` (BF Def 11.2); for a non-uniform /
> τ-sum `E`, "visited" means *visited in some nondeterministic run* (§3.0). `|D|_B :=
> ⋃{ D[E] : E ∈ B⊥ }` (BF Def 11.5). `D` is **material** in `B` iff `D = |D|_B`.

---

## 1. Statement and the two roles it must play

> **Lemma (Res-C — idempotence).** For a behaviour `B = B⊥⊥` and any `D ∈ B`,
> `||D|_B|_B = |D|_B`. Consequently `|·|_B` is a **kernel (interior) operator** —
> reductive (`|D|_B ⊑ D`), monotone, idempotent — whose fixpoints are exactly the
> **material** designs `Gen!(B)`.

Res-C must do two jobs for [session 18 §1.2](../10_IDEATION_SESSIONS/18-q032-residual-discharge-scoping-2026-06-19.md):

- **(R-fix) Material = fixpoint, and every design has a material representative.**
  Idempotence says `|D|_B` is itself material, so `D ↦ |D|_B` is a **retraction**
  onto `Gen!(B)`; every `D ∈ B` has the canonical representative `|D|_B ∈ Gen!(B)`.
  Without idempotence, `|D|_B` need not be material and "the material representative"
  need not be a fixpoint — the quotient would lack canonical reps.
- **(R-inj) Two material designs with the same interaction are equal.** If `D₁, D₂ ∈
  Gen!(B)` and `D₁[E] = D₂[E]` for all `E ∈ B⊥`, then `D₁ = |D₁|_B = ⋃_E D₁[E] =
  ⋃_E D₂[E] = |D₂|_B = D₂` (using materiality = fixpoint twice and the definition of
  `|·|_B`). This is the **b₂′ injectivity** content and the reason the separation
  counterexample (BT2010 Rmk 2.4, non-material junk) cannot bite `Gen!(B)`.

(R-inj) is almost definitional *given* (R-fix); the whole weight is on idempotence.

## 2. Reduction to restriction-invariance of visits

Idempotence reduces to a single sub-lemma:

> **Sub-lemma (Res-C·1 — restriction-invariance of visits).** For every `E ∈ B⊥`,
> `(|D|_B)[E] = D[E]`: restricting `D` to its material part does not change what any
> test visits.

**Res-C·1 ⟹ idempotence**, immediately:
`||D|_B|_B = ⋃_{E ∈ B⊥} (|D|_B)[E] = ⋃_{E ∈ B⊥} D[E] = |D|_B`. ∎

So everything is in Res-C·1. Note `|D|_B` is a bona-fide design interactable with
`E`: BF **Prop 11.8** gives `|D|_B ∈ B` (well-formed, in the behaviour), so
`(|D|_B)[E]` is defined.

## 3. Proof of Res-C·1 (including the non-uniform case)

### 3.0 The visited part for a non-uniform test

For `E ∈ B⊥` a **τ-sum** `Σ^τ x⁻.Eᵢ` (BF Def 7.5), the interaction `⟦D | E⟩` is
nondeterministic: a **run** picks τ-branches. `D[E]` (BF Def 11.2) is the union, over
**all** runs, of the views of `D` traversed. Two facts we use, both **local** to the
interaction (the defining property of normalization / the VAM, BF §8 — *the next move
of a run depends only on the current view-history, never on un-traversed parts of the
design*):

- **(Loc-1)** every view traversed by *any* run of `⟦D | E⟩` lies in `D[E]` (this is
  the definition of `D[E]`);
- **(Loc-2)** a run's trajectory is determined step-by-step by the traversed views;
  it never consults a view it has not (yet) traversed.

### 3.1 The saturation observation (why idempotence holds)

The single load-bearing inclusion is
$$D[E] \;\subseteq\; |D|_B \qquad\text{for the very } E \text{ being tested},$$
which is **immediate from BF Def 11.5**: `|D|_B = ⋃_{E' ∈ B⊥} D[E']` is the union over
**all** tests, and `E ∈ B⊥` is one of them, so `D[E] ⊆ |D|_B`. The material part is
**saturated**: it already contains everything `E` could visit. *This is the structural
reason `|·|_B` is idempotent — it is a union over the full test set, so re-testing
against any single `E` finds nothing new.*

### 3.2 The two inclusions

Let `E ∈ B⊥`. Recall `|D|_B ⊑ D` (Def 11.5: a union of sub-designs `D[E'] ⊑ D`).

**(⊇) `D[E] ⊆ (|D|_B)[E]`.** Take any run `ρ` of `⟦D | E⟩`. By (Loc-1) all views `ρ`
traverses on the `D`-side lie in `D[E]`, hence in `|D|_B` (§3.1). So every view `ρ`
needs is present in `|D|_B`; by (Loc-2) the *same* run `ρ` is available in `⟦|D|_B |
E⟩` and traverses the *same* `D`-views. Ranging over all runs, every view in `D[E]` is
traversed by some run of `⟦|D|_B | E⟩`, i.e. `D[E] ⊆ (|D|_B)[E]`.

**(⊆) `(|D|_B)[E] ⊆ D[E]`.** Take any run `ρ'` of `⟦|D|_B | E⟩`. Since `|D|_B ⊑ D`,
every `D`-view `ρ'` traverses is a view of `D`, and by (Loc-2) `ρ'` is also a run of
`⟦D | E⟩` (D contains everything `|D|_B` does, so nothing `ρ'` needs is missing).
Hence every view `ρ'` traverses lies in `D[E]`, i.e. `(|D|_B)[E] ⊆ D[E]`.

Both inclusions give **`(|D|_B)[E] = D[E]`**. ∎

### 3.3 The non-uniform case is *not* special

The argument never used determinism of `D` or `E`: it ranges over **runs** uniformly,
and the only inputs are (Loc-1), (Loc-2), `|D|_B ⊑ D`, and the saturation `D[E] ⊆
|D|_B`. So a **τ-sum** `E` (or even a non-uniform `D`) is handled identically — a run
against `|D|_B` is a run against `D` and vice versa, visiting the same views, because
all visited views live in the common saturated part `|D|_B`. **The route-ii
degradation [session 18 §1.4](../10_IDEATION_SESSIONS/18-q032-residual-discharge-scoping-2026-06-19.md)
anticipated (a τ-run pruned by restriction) cannot occur:** restriction only removes
views that *no* test visits, and a run by definition only visits views some test
visits. **Verdict: idempotent, not idempotent-up-to-`∼`.**

## 4. Idempotence and the injectivity corollary

- **Idempotence:** Res-C·1 ⟹ `||D|_B|_B = |D|_B` (§2). So `|D|_B` is **material**;
  `Gen!(B)` = fixpoints of `|·|_B` = image of `|·|_B`; `D ↦ |D|_B` retracts `B` onto
  `Gen!(B)`. **(R-fix) ✓.**
- **Kernel operator:** reductive (`|D|_B ⊑ D`, Def 11.5) + idempotent (just shown) +
  monotone (`D₁ ⊑ D₂ ⟹` every `D₁[E] ⊑ D₂[E]` by (Loc-2) run-inclusion `⟹ |D₁|_B ⊑
  |D₂|_B`). So `|·|_B` is a genuine interior operator.
- **Injectivity (b₂′):** **(R-inj) ✓** by the §1 computation, now fully justified
  since materiality = fixpoint is established. Distinct material proof designs have
  distinct interaction profiles; equal profiles force equality. The separation
  counterexample (BT2010 Rmk 2.4) consists of **non-material** designs, which `|·|_B`
  sends to a common material representative — they are *not* in `Gen!(B)`, so they are
  no obstruction (this is also the content the **F4** micro-check confirms on the
  actual Rmk 2.4 witnesses).

## 5. D1-freeness (why this is not the linear smuggle again)

The defect **D1** was: importing **FQ/Sironi/Terui *linear* incarnation** (`⋂`-meet,
Terui Def 4.7, Cor 3.22 stability — all l-design/MALL) into the `!`-layer. Res-C uses
**none** of that:

- the operator is BF's **`⋃`-of-visited** (Def 11.5), defined for **non-uniform**
  strategies — *the genuinely nonlinear notion*, not the linear `⋂`-incarnation;
- the proof uses only **locality of the interaction** ((Loc-1)/(Loc-2), a property of
  BF's VAM normalization §8, valid with τ-sums), **saturation** (Def 11.5 is a union
  over all tests), and **Prop 11.8** (`|D|_B ∈ B`). No stability, no meet, no
  linearity, no separation;
- in particular Res-C is the **nonlinear** replacement for the FQ visitable-path
  idempotence — re-derived from BF `⋃`-materiality, **not** cited from the linear FQ
  theory. So D1 cannot recur here.

## 6. Worked instance (aspirin O0 — instance-first corroboration)

On `B_aspirin^★` ([port §O5](q032-antichain-port-2026-06-16.md)):

- **`D_r` (the doubled-`t₁` robustness design) is a fixpoint.** Every action of `D_r`
  is load-bearing (the `r`-root, the contracted `!t₁`-copies, the `j`/`q` sub-route):
  some test in `B⊥` visits each (a test that drives the corresponding premise). So
  `|D_r|_B = D_r` — material, `||D_r|_B|_B = D_r`. (The doubled `t₁` is visited by
  tests exercising *either* witness, so neither copy is dead.)
- **The three generators have pairwise-distinct interaction profiles.** `D_{t₁}`,
  `D_{t₂}`, `D_r` differ at the root focus (`t₁` / `t₂` / `r`); a test driving the
  `r`-root distinguishes `D_r` from the other two, etc. So by (R-inj) they are pairwise
  distinct material designs — consistent with `|Gen!(B_aspirin^★)| = 3` and the Res-A
  bijection to the three λ-terms.
- **No collapse, no residual quotient** on the instance: idempotence holds and the
  three material designs are the three fixpoints.

## 7. Fidelity items for the independent check (the load-bearing assumptions)

The argument is sound *given* the following readings of BF §11, which the non-author
check must confirm verbatim (they are the places this paper argument touches BF's
actual definitions rather than re-deriving them):

1. **BF Def 11.2 (`D[E]`) for non-uniform `E`** is the **union over runs** of the
   traversed `D`-views (§3.0). If BF instead define `D[E]` per-run / only for
   deterministic `E`, the τ-sum handling (§3.3) must be re-expressed accordingly
   (expected to still go through, but confirm).
2. **Locality of normalization** ((Loc-1)/(Loc-2)): BF's VAM (§8) interaction is
   local — a run's next move depends only on the traversed view-history. This is the
   innocence/locality of cut-elimination; confirm it holds with τ-actions present.
3. **BF Prop 11.8** (`|D|_B ∈ B`, so `|D|_B` is a well-formed interactable design) and
   **Lemma 11.4** (whatever support BF attach to materiality) — confirm they supply
   well-formedness of `|D|_B` with no hidden linear hypothesis.
4. **F4 tie-in:** that BT2010 Rmk 2.4's separation witnesses are non-material (hence
   not in `Gen!(B)`) — consistent with §4's claim that separation junk is quotiented
   away. (F4 is the standalone micro-check; §4 only needs that *material* designs are
   separated by their profiles, which (R-inj) gives.)

None of items 1–4 is the D1 stability gap (no stability/`⋂`/linearity appears).

## 8. Verdict and what remains

**Res-C verdict: IDEMPOTENT** (`|·|_B` a kernel operator; `Gen!(B)` = its fixpoints;
b₂′ injectivity clean). **No route-ii degradation** — the non-uniform τ-sum case is
handled by saturation (§3.1, §3.3). **Status: provisional (paper argument), pending
the §7 independent check.**

With Res-C done, the Q-032 closure checklist is:

- **Res-A** — drafted (Steps 1–4, bijection on the ground `{→,×,atom}` fragment),
  [audit](q032-res-a-translation-2026-06-19.md). ✅ provisional
- **Res-C** — this audit. ✅ provisional
- **F1** (reword [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) Statement (2)/R2: surjection now, bijection *modulo Res-A+Res-C* → now *modulo the two provisional discharges*) — pending
- **F4** (BT2010 Rmk 2.4 witnesses `✠`-terminated) — pending
- **Res-B / Res-D** (light) — pending
- **independent non-author check** of the Res-A (§4.4) and Res-C (§7) arguments — **pending; this is the gate to `established`**.

On a clean check of both discharges, [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md)
→ `established`, [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → closed, Phase 4 unblocked.

---

## Cross-check notes

**Independent non-author cross-check, 2026-06-19. Verdict: NOT SIGNED OFF — one
fidelity defect D-C1; no D1 recurrence; no forced route-ii.** The abstract argument
is structurally correct and, *given its three premises*, idempotence (not
idempotent-up-to-`∼`) follows — so the author's IDEMPOTENT verdict is most likely
right. But two of the three premises are cited to **unverified BF §11 numbers**, and
for the keystone residual that already absorbed a confident-but-wrong proof (D1) that
is exactly the gate that must hold before sign-off. Do **not** mark T012 `established`
on Res-C. *(Closure is independently gated anyway: the [Res-A check](q032-res-a-translation-2026-06-19.md#cross-check-notes)
already returned blocking D-A1.)*

### What clears (accepted)

- **V-C1 — D1 non-recurrence: PASS (the most important item).** The proof uses
  **only** BF `⋃`-of-visited materiality (Def 11.5), the saturation set-inclusion,
  locality of the VAM, and Prop 11.8. It invokes **no** FQ/Sironi visitable-path
  incarnation, **no** Terui Def 4.7 `⋂`-meet, **no** Cor 3.22 stability, **no**
  linearity or separation. The (⊆)/(⊇) inclusions (§3.2) range over **runs**
  uniformly and never assume the interaction is deterministic, so there is no implicit
  linear/deterministic smuggle. D1 cannot recur here. ✓
- **V-C4 — saturation: PASS, airtight, and robust to the Def 11.2 reading.** `D[E] ⊆
  |D|_B` for the tested `E` is pure set-membership: `|D|_B = ⋃_{E'∈B⊥} D[E']` and `E ∈
  B⊥`, so `D[E]` is literally one of the unioned sets. This holds *whatever* `D[E]`
  means, so the structural crux does not even depend on V-C2. ✓
- **V-C6 — the two roles: PASS.** (R-fix) follows from idempotence; (R-inj) follows
  from materiality = fixpoint and needs **even less** than idempotence — `D_i =
  |D_i|_B = ⋃_E D_i[E]`, so equal profiles `D₁[E]=D₂[E] (∀E)` force `D₁ = D₂` directly.
  No hidden gap: "the profile `E↦D[E]` determines `D`" *is* materiality. ✓
- **Monotonicity side-claim (§4): PASS but inessential.** `D₁ ⊑ D₂ ⟹ D₁[E] ⊑ D₂[E]`
  holds (a run against `D₁ ⊆ D₂` reproduces against `D₂`; at a positive node coherence
  forces the shared unique positive child, so no early divergence). Nothing downstream
  needs it; it can be dropped without affecting the verdict.
- **V-C3 — locality with τ: conditionally PASS (no route-ii forced).** Stressing the
  (⊇) direction with τ-actions present: a run `ρ` of `⟦D | E⟩` traverses views all
  lying in `D[E] ⊆ |D|_B`, so every view `ρ` needs (incl. the specific τ-branch it
  took, which is *traversed* hence present) survives restriction; `ρ` replays against
  `|D|_B`. The (⊆) direction is the safe one (`|D|_B ⊆ D`). I could **not** construct a
  τ-sum run that is pruned by restriction or a new run created by it — restriction only
  removes views *no* test visits, and a run visits only views *some* test visits. So
  **route-ii does not occur**, *conditional on* VAM locality genuinely holding with
  τ-actions (BF §8 — a §7–8 fidelity item, not separately re-derived here). ✓ (cond.)

### The defect

- **D-C1 (fidelity, gates sign-off) — the well-formedness backbone rests on
  unverified BF §11 citations (V-C5 + V-C2).** The argument is sound *only if*: (a)
  `|D|_B` is a legal, interactable, **total** design **in `B`** — needed for
  `(|D|_B)[E]` and `||D|_B|_B` to be defined and for the **Positivity** condition to
  survive restriction (restricting a design can expose a previously non-maximal
  negative view as maximal, which would violate BF's Strategy Def cond. (2) "if `s.m`
  maximal then `m` positive"); the draft does **not** argue this, it **outsources it
  entirely to "Prop 11.8 (`|D|_B ∈ B`)"** (§2, §5, §7.3); and (b) `D[E]` (Def 11.2)
  collects views over **all** nondeterministic runs — needed for (Loc-1)/(⊇).
  **Neither Prop 11.8 nor Lemma 11.4 nor the verbatim Def 11.2 appears in any source
  available to this check.** The programme's own literature review states outright that
  **BF §§10–11 "exceeded the fetch length" and remain audit-anchored**; its Appendix C
  quotes Def 11.5, Def 11.11, Rmk 11.12, Thm 11.16, Thm 11.17 verbatim **but no Prop
  11.8 and no Lemma 11.4** — these two numbers occur *only* inside the Q-032 draft
  lineage. Two independent fetches of BF 2011 (arXiv:1104.0504, ar5iv) surfaced only
  §§1–4 here. So the load-bearing legality facts are **cited but unverified** — the
  precise failure mode this keystone check exists to catch. **This is not a hard
  failure (the facts are plausibly true and standard for Girard-style incarnation) and
  not route-ii; it is a fidelity gate.**

### V-C7 — F4 tie-in: OPEN (unchanged)

§4/§7.4's claim that BT2010 Rmk 2.4's separation witnesses `P, Q` are **non-material**
(hence not in `Gen!(B)`, so no counterexample to (R-inj)) is **asserted, not verified**
— the draft itself defers it to the standalone F4 micro-check. It must be confirmed
against the actual Rmk 2.4 designs (are they `✠`-terminated / non-material?). If they
turn out material, separation bites `Gen!(B)` directly and (R-inj) fails. Remains a
separate gate; Res-C does not discharge it.

### How to clear D-C1

Obtain **BF §11 verbatim** and confirm: (1) **Prop 11.8** actually states `|D|_B ∈ B`
with well-formedness (a *total* strategy in the behaviour), not set-membership modulo
something — and that a **union of sub-designs `⋃ D[E']` is coherent and Positivity-
respecting** (a union of coherent sets need not be coherent in general; here it is
because all `D[E'] ⊆ D` and coherence/positivity are inherited from the ambient `D`
*plus* Prop 11.8 — confirm the paper delivers this); (2) **Def 11.2** defines `D[E]`
as the union over **all** nondeterministic runs (or, if per-run/deterministic-only,
re-express §3.3 and re-confirm it still goes through); (3) the actual content of
**Lemma 11.4**. Until then Res-C stays provisional and **T012 must not be promoted on
Res-C**.

### Net

The repair is **D1-free and the idempotence verdict is most likely correct**, but the
draft **cannot be signed off**: its legality backbone (`|D|_B ∈ B`, the coherence/
Positivity of the union, the τ-run reading of `D[E]`) is cited to a never-verified
section of BF 2011. Outcome: **fidelity defect D-C1 (recoverable by source
verification), not a hard refutation and not route-ii.** Register accordingly; do not
close Q-032. *(Round-1 D1 → R-track → Round-2 accept-with-residuals → this check
mirrors the C015→T011 cadence; the gate is now source-fidelity on both residuals.)*

---

## Cross-check resolution (2026-06-20) — D-C1 cleared against the provided BF PDF; F4 cleared

The D-C1 gate was a **source-availability** defect: the cross-check ran in a fresh
thread with only the lit-review's *audit-anchored* note (BF §§10–11 "exceeded fetch
length") and truncating ar5iv/arXiv fetches. The full BF 2011 PDF is now in the repo
(`RESEARCH_PROGRAMME/papers/LUDICS WITH REPETITIONS 1104.0504v3.pdf`) and was
extracted (pypdf → text); **all three cited §11 statements are present verbatim** and
say exactly what the §7.3 fidelity items require. Resolving the reviewer's "How to
clear D-C1" checklist point-by-point:

**(1) Prop 11.8 — `|D|_B ∈ B`, with well-formedness.** Verbatim (BF txt L2413-18):

> **Proposition 11.8.** *Let `G` be a behaviour on a unary interface and `D ∈ G`. We
> have: (1) `[[|D|_G, E]] = [[D, E]]`, for each `E ∈ G⊥`. (2) `|D|_G ⊥ E`, for each
> `E ∈ G⊥`. In particular, `|D|_G ∈ G`. Proof. By Lemma 11.4, `[[D[E], E]] = [[D, E]]`.
> From this we have (1), which implies (2).*

`|D|_G ⊥ E` for **all** `E ∈ G⊥` gives `|D|_G ∈ G⊥⊥ = G`; and a behaviour "only
contains **total** strategies" (BF §4.4, Def Behaviour), so membership *is*
well-formedness — `|D|_B` is a legal, total, interactable strategy in `B`. The
union's coherence/Positivity is delivered exactly here (not assumed): Prop 11.8 places
`⋃ D[E']` into `B`, and `B`'s elements are well-formed strategies. **V-C5 / D-C1(1)
cleared.**

**(2) Def 11.2 — `D[E]` is the union over all runs.** Verbatim (BF txt L2358-62):

> **Definition 11.2.** *Let `R` be a cut-net. … the restriction of `D` to those of its
> views which are used (or visited) … as follows: `D^R = D ∩ {⌜p⌝ : p ∈ I(R)}`. … we
> will also write `D[E₁,…,Eₙ]` for `D^R`.*

`I(R)` is the **set of interactions** (BF Def "Normal form", §8: the prefix-closure of
the VAM/LAM paths); in the non-uniform / τ-sum setting the VAM is nondeterministic, so
`I(R)` collects **every run's** path and `D[E] = D ∩ {visited views over all runs}` —
the §3.0 union-over-runs reading is **literal**, not an interpretation. And **Lemma
11.3** (BF txt L2363) proves `D^R = D[E]` is itself a **strategy** (its printed proof
discharges τ-Positivity), so the restricted object is well-formed independently.
**V-C2 / D-C1(2) cleared.**

**(3) Lemma 11.4 — the support.** Verbatim (BF txt L2373-79):

> **Lemma 11.4.** *Let `R = {D₁,…,Dₙ}` be a cut-net. We have `[[D₁,…,Dₙ]] =
> [[D₁^R,…,Dₙ^R]]`.* (Proof: consequence of Def 8.4 — all views used to construct
> `I(R)` are contained in the `Dᵢ^R`.)

Normalization is invariant under restriction to visited parts — exactly the support
Prop 11.8 invokes. **D-C1(3) cleared.**

**F4 / V-C7 — the Rmk 2.4 witnesses are non-material *and* `✠`-terminated.** From the
BT2010 PDF (Rmk 2.4 / Example 2.20, BT2010 txt L608-625): `P := x₀|↓⟨↑(y).✠⟩`,
`Q := x₀|↓⟨↑(y).P⟩`. **Both contain `✠`** ⇒ not `✠`-free ⇒ **not proofs/winning** ⇒
**not in `Gen!(B)`** on that ground alone; and `{P}⊥ = {Q}⊥` (interaction-equivalent)
⇒ `|P|_B = |Q|_B`, with `P ⪯ Q` so `Q` is non-material (its `↑(y).P` part is
unvisited). **Either route excludes them from `Gen!(B)`**, so they are no
counterexample to (R-inj). **F4 cleared.**

**Net of the resolution.** The three §11 fidelity items (D-C1(1–3)) and F4 are
**confirmed verbatim against the in-repo BF/BT2010 PDFs** — the reviewer's exact
clearance conditions are met. Combined with the already-accepted V-C1 (D1-free),
V-C3 (no route-ii), V-C4, V-C6, **Res-C's blocking gate D-C1 is lifted and the
IDEMPOTENT verdict stands.** Res-C is **not** independently "established" — an
independent re-reader may now confirm the citations directly against the in-repo PDF
— and **Q-032 closure remains gated by Res-A (D-A1, live)**: re-targeting the design
leg from BF MELLS to Terui/BT2010 c-designs. T012 stays `provisional`; not promoted.
