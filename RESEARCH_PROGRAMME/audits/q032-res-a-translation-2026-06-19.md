# Q-032 Res-A discharge — the `!`-translation as a proof-level bijection

- **status:** **D-A1 REPAIRED via route 2 (2026-06-20) — design leg re-targeted to BT2010 c-designs; Res-A re-pointed, provisional pending re-check of Res-A′.** The cross-check's blocking D-A1 was a *target-logic* defect: the curried-arrow CBN image lives in polarized MELL ⊋ BF's synthetic MELLS, so composing with BF Thm 11.16/11.17 (for MELLS) was unlicensed. **Route-2 fix** (see [§Re-target](#re-target-route-2-2026-06-20--design-leg-via-bt2010-c-designs-d-a1-repair)): replace the design↔derivation leg's target with **BT2010's proof system over logical behaviours** — designs *are* λ-style c-designs (arrows native; contraction internalized, Ex 2.14), and **design↔derivation is a bijection by construction** (Def 3.2 proofs = proof-terms; §3.1 deterministic proof search; Thm 3.5/3.8) — *dissolving* D-A1 (no MELLS, no Thm 11.17) and making b₂′ faithfulness definitional (separation-independent). The blocking defect becomes a **standard representation residual Res-A′** (STLC `{→,×,atom}` ↪ BT2010 logical behaviours via Terui function designs Def 2.17 / Lemma 3.2, βη-bijective), lighter than route 1's net-new "extend BF App A Thm A.8 to `{→,×}`." **Carrier cost:** B flips **lineage-neutral → uses-c-design** (record vs [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030); hybrid holds by default, but the b-Terui trigger's B-condition is now met). T012's R2 leg updated to BT2010 Thm 3.8. *(Prior: BLOCKING DEFECT D-A1, 2026-06-19; superseded author-draft "bijection on ground fragment" retained for trail.)*
- **author-draft status (superseded by the cross-check above, retained for trail):** Steps 1–4 DONE (provisional, paper argument) — verdict: BIJECTION on the ground `{→,×,atom}` Ambler fragment. Provisional pending an independent non-author check (load-bearing items in §4.4).
- **started:** 2026-06-19
- **goal:** prove `{ βη-long-normal STLC λ-terms of 𝒞/Γ(A, B^♯) } ⥲ { focalized cut-free MELLS derivations of ⟦A⟧ ⊢ ⟦B^♯⟧ }` is a **bijection** (ground-atom scope) — the derivation↔λ-term leg of the bridge map `φ`.
- **route (session 18 §2.3):** (1) pin the translation · (2) forward map · (3) image characterisation · (4) inverse + bijectivity.
- **inputs:** Girard 1987 (`!`-translation); Lincoln–Scedrov–Shankar 1993 (`!A⊸B` faithfulness); Andreoli 1992 (focalization); [Q-027 audit](q027-thin-cones-2026-05-29.md) §1–§2 (the Ambler base 𝒞/Γ + the aspirin generators); [Q-034/Q-033 review](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) App C.7/C.11 (MELLS grammar; the BT2010 App A LJ₀ embedding).

---

## Step 1 — Pin the translation (DONE)

### 1.1 Source language `L_Γ` (= the Ambler base `𝒞/Γ`)

The bridge generators `𝒞_base(A, B^♯)` are the inhabitants of `𝒞/Γ`, the **free
cartesian-closed category / simply-typed λ-calculus over `Γ`** ([Q-027](q027-thin-cones-2026-05-29.md)
§2). Fixed data:

- **Atoms** `𝒜 = { muscle_pain, aspirin, gastric_ulcer, ¬aspirin, ¬gastric_ulcer, stomach_pain, short_term, anxiety, joint_pain, … }` — the finite set of Ambler propositions. **Negation is a primitive atom** (no classical involution; [Q-027](q027-thin-cones-2026-05-29.md) §1), consistent with the sub-classical / polarity discipline.
- **Types** `τ ::= a  (a ∈ 𝒜)  |  τ × τ  |  τ → τ` — the free CCC types over `𝒜`. (`×` = the conjunctive premise; `→` = rule/implication.)
- **Context** `Γ` = the Ambler rule-base as **typed constants** (e.g. `t₁ : muscle_pain → aspirin`, `t₂ : (muscle_pain × ¬gastric_ulcer) → aspirin`) **plus** the query antecedent as variables `x : A`.
- **Terms / generators** = **βη-long-normal** simply-typed λ-terms of type `B^♯` in context `(x : A, Γ)`. This **η-long-normal** discipline is the canonical-form choice (1.4); `𝒞_base(A, B^♯)` is exactly this set ([Q-027](q027-thin-cones-2026-05-29.md) §2 enumeration).

### 1.2 The CBN `!`-translation `(·)^∘` on types

Girard's **call-by-name** translation (Girard 1987, *Linear Logic* §5.1) — the one
matching STLC normal forms (each *hypothesis* is duplicable, so guarded by `!`):

$$
a^\circ \;=\; \underline{a} \quad(\text{atom} \mapsto \text{the ground MELLS constant; see 1.5}),
$$
$$
(\tau_1 \to \tau_2)^\circ \;=\; \mathbin{!}\tau_1^\circ \multimap \tau_2^\circ,
$$
$$
(\tau_1 \times \tau_2)^\circ \;=\; \tau_1^\circ \mathbin{\&} \tau_2^\circ \quad(\text{additive — but see the premise-position refinement 1.3}).
$$

The `!` on the *premise* of every arrow is the load-bearing point: it is exactly
what licenses a hypothesis (or a sub-derivation) being **used more than once**, i.e.
the **contraction** that the higher-order *argument-chain* generators exercise.

### 1.3 Premise-position conjunction stays multiplicative (keeps MELLS pure)

The naive `(τ₁ × τ₂)^∘ = τ₁^∘ & τ₂^∘` introduces the **additive** `&`, which BF's
MELLS does not carry out (the [Res-D](../10_IDEATION_SESSIONS/18-q032-residual-discharge-scoping-2026-06-19.md)
/ [Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) scope). **But in `L_Γ`, `×` only
ever occurs as a premise conjunction** — the antecedent of a rule or query, hence
always *under a `!`* after translation. There the **Girard exponential isomorphism**

$$
\mathbin{!}(C \mathbin{\&} D) \;\cong\; \mathbin{!}C \otimes \mathbin{!}D \qquad(\text{Girard 1987, MELL})
$$

collapses the additive into a **multiplicative** `⊗` of `!`'d factors:

$$
\big((\tau_1 \times \tau_2) \to \tau_3\big)^\circ
= \mathbin{!}(\tau_1^\circ \mathbin{\&} \tau_2^\circ) \multimap \tau_3^\circ
\;\cong\; \big(\mathbin{!}\tau_1^\circ \otimes \mathbin{!}\tau_2^\circ\big) \multimap \tau_3^\circ.
$$

**So the conjunctive-premise fragment of `L_Γ` lands in pure MELLS** (multiplicative
+ exponential, no additive `&`). Genuine additives are needed *only* for
case-analysis / disjunctive (`⊕`) schemes, which are the Res-D scope and are absent
from the aspirin family. **Refined translation rule:** `×` in premise position →
`⊗` of `!`'d factors (record the iso step); a non-premise/conclusion `×` (none in
the current corpus) would require Res-D additives. This refinement is what keeps
Res-A inside the BF/BT2010 constant-only MELLS where the cited completeness theorems
(R2) actually apply.

### 1.4 Context, sequent, and the η-long discipline

A generator `(x : A, Γ) ⊢ M : B^♯` translates to the **MELLS sequent**

$$
\mathbin{!}A^\circ,\; \mathbin{!}\Gamma^\circ \;\vdash\; (B^\sharp)^\circ
\qquad\text{where } \mathbin{!}\Gamma^\circ = \mathbin{!}\tau_1^\circ, \dots, \mathbin{!}\tau_n^\circ \text{ for } \Gamma = (c_i : \tau_i),
$$

i.e. **every hypothesis is `!`'d** (the CBN discipline: hypotheses are duplicable).
In BF's one-sided polarized presentation this is `⊢ ?(A^\circ)^\perp, ?(\Gamma^\circ)^\perp, (B^\sharp)^\circ`
with the `!`'d hypotheses appearing as `?`'d negative formulas and the goal
right-focused — the **positive/negative split** MELLS already imposes (§1.5).

**η-long discipline (load-bearing for bijectivity).** We work throughout with
**βη-long-normal** source terms. This is *not* cosmetic: η-long normal forms are the
canonical representatives that make the term↔proof correspondence **single-valued in
both directions** (η-short terms or non-normal terms are many-to-one with proofs).
On the target side the matching canonical form is the **focalized** cut-free proof
(Step 3). The bijection of Res-A is, precisely, *βη-long-normal terms ↔ focalized
cut-free MELLS proofs* — pinning the canonical forms on both sides is what turns the
many-to-one sequent-calculus picture into a bijection (Step 4).

### 1.5 Ground-atom scope (atoms ↦ constants)

Per [Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) (sufficient-with-conditions) and
BT2010 App A, each Ambler atom `a ∈ 𝒜` is **ground / Skolemizable**, translated to a
**0-ary MELLS signature name** `\underline{a}` (a logical constant). No propositional
variables are introduced — that is the genuinely net-new, *target-independent*
residue Q-033 isolated, and it is **out of scope here** (a generator over a schematic
atom would need a variable extension no candidate target provides). Within the
ground-atom scope, `(·)^∘` is total and lands in constant-only MELLS, exactly BF's
full-completeness fragment.

### 1.6 Worked instance — the three aspirin generators (instance-first discipline)

Translating the O0/O5 generators ([port audit](q032-antichain-port-2026-06-16.md) §O5.2)
pins the rule on the load-bearing example and exhibits where contraction enters:

| generator (λ-term) | source type of the rule used | `(·)^∘` (in MELLS, via 1.3) |
|---|---|---|
| `g₁ = t₁ fst(x)` | `t₁ : muscle_pain → aspirin` | `!mp ⊸ asp` |
| `g₂ = t₂⟨fst(x), i₂⟨…⟩⟩` | `t₂ : (muscle_pain × ¬gastric_ulcer) → aspirin` | `(!mp ⊗ !¬gu) ⊸ asp`  *(iso 1.3)* |
| `g_r = r⟨!t₁, m, q⟩` | `r : (muscle_pain→aspirin) → muscle_pain → joint_pain → aspirin` | `!(!mp ⊸ asp) ⊸ !mp ⊸ !jp ⊸ asp` |

The higher-order generator `g_r` is decisive: its **first premise** translates to
`!(!mp ⊸ asp)` — a `!`'d *function* type — and "`r` uses its scheme-argument **twice**"
(O0.2) is exactly **contraction on that `!`'d hypothesis**. So the `!`-layer / the
nonlinearity that the whole MELL upgrade is about appears in step 1 as a single,
explicit `!` in front of a function premise, and the bijection Res-A must match the
two-use λ-term `λp.λm.λq. corr(p m, p (j q))` to the focalized MELLS proof that
**contracts** `!(!mp⊸asp)` once. Nothing additive appears (1.3 kept the conjunctive
premise of `t₂` multiplicative), so all three land in pure MELLS — confirming the
ground-atom + conjunctive-premise aspirin fragment is inside the cited-completeness
target.

### 1.7 Step-1 deliverable (pinned)

- **Source:** `L_Γ` = free STLC over the Ambler atoms `𝒜`; generators = βη-long-normal terms (1.1).
- **Type translation:** `a^∘ = \underline{a}`, `(τ₁→τ₂)^∘ = !τ₁^∘ ⊸ τ₂^∘`, premise-`×` → `⊗` of `!`'d factors via `!(C&D) ≅ !C⊗!D` (1.2–1.3).
- **Sequent:** `!A^∘, !Γ^∘ ⊢ (B^♯)^∘`, hypotheses `!`'d (CBN); polarized one-sided form per BF MELLS (1.4).
- **Canonical forms:** βη-long-normal (source) ↔ focalized cut-free (target) — the discipline that makes Res-A a bijection (1.4).
- **Scope:** ground atoms → constants; no propositional variables; conjunctive premises multiplicative; genuine additives deferred to Res-D (1.3, 1.5).

✅ **Step 1 done.** The translation is pinned, total on the ground-atom +
conjunctive-premise fragment, lands in pure constant-only MELLS, and exposes the
contraction site (`!`'d function premise of `r`) that the bijection must track.

---

## Step 2 — Forward map: βη-long-normal term ↦ focalized cut-free MELLS proof (DONE)

### 2.1 The map on the βη-long-normal grammar

βη-long-normal STLC terms split into **normal** `N` and **neutral** (spine) `R`:

```
N  ::=  λx:τ. N            (at arrow type)
     |  ⟨N₁, N₂⟩           (at product type — building a conjunctive argument)
     |  R                  (at atom type — η-long forces neutrals only at atoms)
R  ::=  h                  (head: a variable or an Ambler-rule constant)
     |  R N                (application)
     |  fst R  |  snd R    (projection — accessing a conjunctive antecedent)
```

The forward map `⟦·⟧` sends `N` to a focalized cut-free MELLS derivation of
`!A^∘, !Γ^∘ ⊢ τ^∘`, by the **CBN co-Kleisli** discipline (Girard 1987 §5; the
standard STLC↪MELL embedding, Benton–Bierman–de Paiva–Hyland / Seely), rule-for-rule:

| source construct | MELLS rule(s) | note |
|---|---|---|
| `λx:τ₁. N : τ₁→τ₂` | **`⊸R`** introducing the `!`'d hyp `!τ₁^∘` | the hypothesis enters `!`'d ⇒ may be used 0/1/many times |
| `⟨N₁, N₂⟩` (premise pair) | **`⊗R`** splitting the (all-`!`'d) context | legal because every hyp is `!`'d ⇒ contraction supplies both branches |
| `fst R` / `snd R` | the matching **`⊗L`** projection on the `!`'d-paired antecedent | via `!(C&D) ≅ !C⊗!D` (1.3) |
| head `h` of type `τ₁→…→τₖ→a`, used once | **dereliction `?d`** of `!(…)^∘` then a chain of `k` **`⊸L`** | accesses one copy of the hypothesis |
| each argument `Nᵢ : τᵢ` fed to `⊸L` | **promotion `!R`** of `⟦Nᵢ⟧` | legal — promotion needs an all-`!`'d context, which CBN guarantees |
| a hypothesis used `k ≥ 2` times | **contraction `?c`** on its `!`-formula | the only place contraction appears |
| a hypothesis used `0` times | **weakening `?w`** | |

The alternation *λ-block → neutral spine → λ-block → …* of an η-long normal form is
exactly the **async (negative) / focus (positive) phase alternation** of a focalized
proof (Andreoli 1992; Liang–Miller 2009 "focalization ↔ normal natural deduction"):
the λ-block is the negative/async phase (`⊸R`, hypothesis release), the neutral spine
`h N₁…Nₖ` is one **positive focus** on the head `h` (dereliction + `⊸L`-chain), and
each argument re-enters async under a promotion box. So `⟦N⟧` is **focalized** by
construction, and **cut-free** (no `β`-redex ⇒ no cut introduced).

### 2.2 The contraction lands where Step 1 predicted (worked: `g_r`)

For `g_r = λp.λm.λq. corr(p\,m,\; p\,(j\,q))` of type
`!(!mp⊸asp) ⊸ !mp ⊸ !jp ⊸ asp` (1.6):

1. `λp.λm.λq` ⟼ three **`⊸R`**, releasing the `!`'d hypotheses `p : !(!mp⊸asp)`, `m : !mp`, `q : !jp`.
2. `p` occurs **twice** (`p m` and `p (j q)`) ⟼ one **contraction `?c`** on `!(!mp⊸asp)`, giving two copies.
3. `p m`: **dereliction** of one copy ⟼ `!mp ⊸ asp`; **`⊸L`** consuming `!mp`, supplied by **promoting** `m` (derelict `m:!mp` to `mp`, promote back).
4. `p (j q)`: **dereliction** of the other copy ⟼ `!mp ⊸ asp`; **`⊸L`** consuming `!mp`, supplied by **promoting** `j q` (derelict the rule constant `j:!(jp⊸mp)`, derelict `q:!jp` to `jp`, `⊸L` to get `mp`, promote to `!mp`).
5. `corr(·,·)` ⟼ the head combiner concluding `asp` from the two `asp` results.

**The contraction count is exactly one, on `!(!mp⊸asp)`** — confirming the Step-1
prediction verbatim. `g₁`, `g₂` translate with **no** contraction (each hypothesis
used once), `g₂`'s conjunctive premise handled by `⊗R`/`⊗L` (1.3). All three are
focalized cut-free MELLS proofs.

✅ **Step 2 done.** `⟦·⟧` is a total map from βη-long-normal terms to focalized
cut-free MELLS proofs; the higher-order generator's contraction maps to a single
MELLS contraction, as predicted.

## Step 3 — Image characterisation (DONE)

### 3.1 The image is the CBN co-Kleisli image, cut by two shape constraints

`⟦·⟧` does **not** hit every focalized cut-free MELLS proof — only those of the
**CBN-polarized shape**. Characterise the image `Im⟦·⟧` by:

- **(S1 — formula shape.)** Every formula occurring is a `(·)^∘`-type: built from
  ground constants `\underline a`, `!τ^∘ ⊸ σ^∘`, and `⊗` of `!`'d factors (1.2–1.3).
  Equivalently, the sequent is `!A^∘, !Γ^∘ ⊢ (B^♯)^∘` with all left formulas `!`'d
  and the right formula a translated type. No bare positive atom on the left, no
  `!` except on a hypothesis or an argument-box, no additive `&`/`⊕`.
- **(S2 — box discipline.)** Every promotion `!R` boxes a sub-proof whose entire
  context is `!`'d (the CBN invariant), and dereliction/contraction/weakening act
  **only** on `!`'d hypotheses. This is exactly the condition that the proof is in
  the image of the **co-Kleisli-of-`!`** embedding of the free CCC (= STLC) — i.e.
  it "comes from a λ-term."

A focalized cut-free MELLS proof satisfies (S1)+(S2) **iff** it is `⟦N⟧` for some
βη-long-normal `N`. (Forward direction is Step 2; the converse is Step 4's read-back.)

### 3.2 Corroboration: BT2010 App A is the analogous `¬,∧`-fragment iso

BT2010 App A independently establishes a **bijection** `MELLS derivations ↔ LJ₀
derivations` (**Thm A.8:** `(π*)^◇ = π` and `(π^◇)* = π`) where LJ₀ is "a focalized,
synthesized version of the `¬,∧` fragment of LJ" ([Q-034 review App C.11](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md)).
This is the **same phenomenon** in a *different* intuitionistic fragment (`¬,∧` vs
our `→,×`). It corroborates that the MELLS↔intuitionistic correspondence is a genuine
*proof-level bijection* (not mere provability-faithfulness), but it is **not a drop-in**:
Ambler's base is `{→, ×, atom}` with **negation as a primitive atom** ([Q-027](q027-thin-cones-2026-05-29.md)
§1), not the `¬,∧` fragment, so the relevant embedding is the **Girard CBN `→`-translation**
(1.2), whose image is characterised by (S1)+(S2) above — BT2010 Thm A.8 is cited as
evidence-of-kind, not as the theorem itself.

✅ **Step 3 done.** `Im⟦·⟧` = focalized cut-free MELLS proofs satisfying (S1)+(S2) =
the co-Kleisli-of-`!` image of STLC. The characterisation is intrinsic (checkable on
a given proof) and matches BT2010 App A's analogous `¬,∧` iso.

## Step 4 — Inverse + bijectivity (DONE — verdict: bijection on the ground `{→,×,atom}` fragment)

### 4.1 The read-back (inverse map)

Define `⟪·⟫ : Im⟦·⟧ → {βη-long-normal terms}` by structural recursion on the
focalized proof, inverting the Step-2 table:

- a **negative/async phase** (`⊸R`, hyp release) ⟼ a `λ`-block;
- a **positive focus** on a `!`'d head (dereliction + `⊸L`-chain) ⟼ the neutral spine `h N₁…Nₖ`, with each `Nᵢ = ⟪box-content⟫`;
- `⊗R`/`⊗L` ⟼ pairing/projection; contraction/weakening ⟼ multiple/zero occurrences of the bound variable.

Because the proof is **focalized**, the phase boundaries are forced (no choice of
how to group rules), so `⟪·⟫` is **well-defined** (single-valued). This is precisely
the content that focalization adds over plain sequent calculus: it removes the
rule-permutation ambiguity that makes `proof ↦ term` many-valued in unfocused LJ.

### 4.2 Mutual inverse (bijectivity)

- **`⟪⟦N⟧⟫ = N`** for every βη-long-normal `N`: structural induction; each Step-2
  clause is inverted by the matching 4.1 clause, and **η-long-normality** guarantees
  no `η`-mismatch (a variable of arrow type is already fully expanded, so its
  read-back is the same `λ`-block). βη-normality guarantees no `β`-redex to lose.
- **`⟦⟪P⟫⟧ = P`** for every `P ∈ Im⟦·⟧`: induction on the focused phase structure;
  (S2) ensures every box/dereliction came from a real argument/head, so the
  re-translation rebuilds `P` exactly.

Hence `⟦·⟧` and `⟪·⟫` are **mutually inverse**, so

$$
\langle\!\langle \cdot \rangle\!\rangle \;:\; \{\beta\eta\text{-long-normal STLC terms of } \mathcal{C}/\Gamma(A, B^\sharp)\} \;\xrightarrow{\ \sim\ }\; \mathsf{Im}\langle\!\langle\cdot\rangle\!\rangle = \{\text{focalized cut-free MELLS proofs of } {!}A^\circ, {!}\Gamma^\circ \vdash (B^\sharp)^\circ \text{ satisfying (S1)+(S2)}\}
$$

is a **bijection**. Injectivity (distinct normal terms ↦ distinct proofs) is the
forward direction of mutual-inverse; surjectivity-onto-image is Step 2. This is
strictly stronger than LSS-1993 *provability*-faithfulness (which gives only that the
two sets are simultaneously non-empty), exactly as session 18 §2.2 required.

### 4.3 Worked corroboration (the three aspirin generators)

`⟪·⟫`/`⟦·⟧` match the three `Gen!(B)` proofs of [port §O5.2](q032-antichain-port-2026-06-16.md)
to the three λ-terms bijectively: `⟦g₁⟧`, `⟦g₂⟧`, `⟦g_r⟧` are three *distinct*
focalized cut-free MELLS proofs (distinct heads `t₁`/`t₂`/`r` at the root focus;
`⟦g_r⟧` the only one with a contraction), and their read-backs recover `t₁ fst(x)`,
`t₂⟨…⟩`, `r⟨!t₁,…⟩`. No two collapse ⇒ injectivity holds on the instance; all three
are in `Im⟦·⟧` ⇒ surjectivity holds.

### 4.4 Verdict and honest scope

**Res-A verdict: BIJECTION, on the ground `{→, ×, atom}` Ambler fragment** (atoms →
constants; conjunctive premises multiplicative via 1.3). The bijection rests on three
standard results assembled for this fragment — (i) Girard 1987 §5 CBN translation
(STLC ↪ MELL as the co-Kleisli of `!`); (ii) the free-CCC / co-Kleisli faithfulness-
and-fullness-on-image (Benton–Bierman–de Paiva–Hyland; Seely); (iii) focalization ↔
normal natural deduction (Andreoli 1992; Liang–Miller 2009) — corroborated by BT2010
App A's analogous `¬,∧` iso (Thm A.8) and verified on the aspirin instance.

**Out of scope (degradation boundary, as session 18 §2.4 anticipated):**
- **schematic propositional variables** — absent from all candidate targets ([Q-033](../01_OPEN_QUESTIONS_REGISTRY.md#q-033)); a generator over a non-ground atom is *not* covered and would need a variable extension no target provides. The aspirin family is ground, so it is in scope.
- **genuine additive case-analysis** (`⊕`/disjunctive schemes) — needs **Res-D** (BT2010 Thm 2.17/3.8 additive import); absent from the aspirin family. The conjunctive-premise `×` is **not** in this exclusion (1.3 keeps it multiplicative).

**Status: provisional (paper argument), pending independent non-author check.** The
load-bearing items for the checker: (a) that (S1)+(S2) is exactly the co-Kleisli
image (3.1) and not broader/narrower; (b) that focalization makes `⟪·⟫` single-valued
(4.1) with the η-long discipline (4.2); (c) the `!(C&D)≅!C⊗!D` canonicalisation (1.3)
does not create a two-presentations collapse. None is the D1 stability gap or the S1
separation counterexample.

---

## Status / what remains

- **Res-A: Steps 1–4 DONE (provisional).** Verdict **bijection** on the ground
  `{→,×,atom}` fragment (the aspirin scope); degradation boundary = schematic
  variables (Q-033, out of scope) and additive `⊕` schemes (Res-D).
- **Composition.** This bijection composes with the cited **design↔derivation** leg
  (BF Thm 11.16/11.17, BT2010 Thm 3.8 — R2) to give the full bridge map
  `Gen!(B) ⥲ 𝒞_base(A, B^♯)`.
- **Still open for Q-032 closure:** **Res-C** (`⋃`-materiality idempotence — the
  keystone; [session 18 §1](../10_IDEATION_SESSIONS/18-q032-residual-discharge-scoping-2026-06-19.md));
  the **F1** reword and **F4** Rmk-2.4 micro-check; **Res-B/Res-D** (light); and an
  **independent non-author check** of this Res-A argument (load-bearing items above).
  On all clean, [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) → `established`,
  [Q-032](../01_OPEN_QUESTIONS_REGISTRY.md#q-032) → closed.

---

## Cross-check notes

> Independent non-author cross-check, 2026-06-19. Verdict: **BLOCKING DEFECT D-A1.**
> Sent back. Res-A is **not** signed off; T012 must **not** be promoted on Res-A.
> Read against [the verification prompt](q032-res-a-VERIFICATION-PROMPT.md), the BF
> MELLS grammar verbatim ([Q-034/Q-033 review](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md)
> §(g) App C.7 + App C.11), and [Q-027](q027-thin-cones-2026-05-29.md) §1–§2.

### D-A1 — the CBN image lands in polarized MELL ⊋ MELLS, so the cited composition does not type-check (V-A1)

**The defect.** The draft asserts (1.3, 1.7, Step 3 S1) that the CBN image "lands in
pure constant-only MELLS." It does not. BF's **MELLS** is a *synthetic-connective*
grammar with a strict, head-decorated polarity alternation (BF §2.3, verbatim):

$$\text{Positive } P ::= ?_P(N_1 \otimes \cdots \otimes N_n), \qquad \text{Negative } N ::= !_N(P_1 \,⅋\, \cdots \,⅋\, P_n) \quad (n \ge 0).$$

The load-bearing invariant of this grammar: **every MELLS formula is `!_N`- or
`?_P`-headed** — a synthetic connective *always carries its exponential at the head*.
There is no production for a bare `⅋`/`⊸`/`⊗` cluster.

But the draft's own translation table (1.6) and Step-2 image are written in **ordinary
MELL** and are `⊸`/`⅋`-headed, not exponential-headed. Concretely, take any generator
whose goal/used-rule type contains an arrow (all three aspirin generators do):

- `g₁`: `(B^♯)°`-side rule type `!mp ⊸ asp = (!mp)^⊥ ⅋ asp = ?(mp^⊥) ⅋ asp`. Top
  connective `⅋`. **Not** `!_N(…)` and **not** `?_P(…)`. ✗ fails the grammar at the root.
- `g_r`: `!(!mp ⊸ asp) ⊸ !mp ⊸ !jp ⊸ asp = ?(…) ⅋ ?(mp^⊥) ⅋ ?(jp^⊥) ⅋ asp`. A flat
  `⅋`-cluster of three positives and a constant, **no enclosing `!_N`**. ✗.

A genuine MELLS negative is `!_N(P₁ ⅋ … ⅋ Pₙ)` — a *single top `!`* over a par of
**positives**. The curried CBN implication has (i) no top exponential and (ii) a
mixed-polarity body (the arrow result `τ₂°` is negative, not a positive component).
To reach MELLS you must insert the **polarity shifts** (`↑/↓`, i.e. the `!/?` heads)
that the synthetic discipline bakes in — i.e. apply a *focalized/synthetic* CBN
translation and then **re-synthesize** the formula. That re-synthesis is exactly the
`◇`/`•` embedding of BF App A, and its **proof-level** half is **Theorem A.8**:

$$(\pi^*)^\diamondsuit = \pi, \qquad (\pi^\diamondsuit)^* = \pi \qquad (\text{MELLS derivations} \cong \text{LJ}_0 \text{ derivations}),$$

stated for **LJ₀ = the focalized `¬,∧` fragment of LJ** (BF App A.2; registry line 462
"MELLS is a focalized version of the ¬,∧ fragment of LJ"). The only MELLpol↔MELLS
result that reaches the `{→}`-style image is **Theorem A.15**, which is a
**derivability** equivalence ("⊢ Γ derivable in MELLS iff ⊢ Γ° derivable in MELLpol",
exponential-only sequents) — *provability*, not a proof/design bijection.

**Why this blocks the composition.** Res-A is needed only so it can compose with the
**design↔derivation** leg, **BF Thm 11.16/11.17**, which is **full completeness for
MELLS designs** — its behaviours are indexed by *synthetic MELLS formulas*. For the
composite `Gen!(B) ⥲ 𝒞_base(A,B^♯)` to type-check, the goal `(B^♯)°` must **be** a
MELLS formula whose behaviour Thm 11.17 governs, and the focalized proofs of Step 2–4
must **be** (in bijection with) winning **MELLS** designs of that behaviour. As shown,
`(B^♯)°` for any arrow-typed `B^♯` is *not* a synthetic MELLS formula, so Thm 11.17
does not apply to it directly; the bridge that would carry the MELLpol proof onto a
MELLS design *at the proof/design level* is precisely Thm A.8 — **`¬,∧`, the wrong
fragment**. The draft's §3.2 *already concedes* this ("BT2010 Thm A.8 … cited as
evidence-of-kind, not as the theorem itself") — but that concession is exactly the
hole: with A.8 unavailable for `{→,×}`, nothing licenses the proof-level transfer the
composition consumes. The intrinsic `(S1)+(S2)` characterisation (Step 3) is the
draft's *own* construction in MELL; it is not a set of MELLS designs that BF Thm 11.17
characterises until the synthetic-membership + proof-level transfer is supplied.

**Severity.** Blocking. It is not a scope footnote (the degradation boundary in 4.4
covers schematic variables and additive `⊕`, not this): the failure hits the
**first-order arrow generators** `g₁`, `g₂` too, because *every* Ambler rule is an
implication. As written, "lands in pure MELLS" is asserted, never demonstrated — no
synthetic-grammar parse of even one generator's formula is exhibited, and the three
worked formulas (1.6) are all `⊸`-headed ordinary-MELL types.

**What the repair needs (any one of):**
1. **Synthetic CBN + proof-level transfer.** Replace 1.2 with an explicitly *focalized
   synthetic* CBN translation that emits `!_N`/`?_P`-headed formulas (shifts inserted
   at every polarity alternation), **and** prove the MELLpol-proof ↔ MELLS-design
   correspondence *at the proof/design level* for the `{→,×}` image — i.e. extend BF
   App A Thm A.8 from LJ₀ to the implicative-conjunctive fragment. This is net-new
   proof theory, not a citation; it is the actual missing content of Res-A.
2. **Re-target the design leg.** Land the bijection in **Terui c-designs / BT2010**
   (whose designs *are* λ-style terms with β-reduction, per the [Q-034 review](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md)
   axis (e), and whose full completeness **Thm 3.8** is stated for the proof/behaviour
   pairing directly) rather than BF synthetic MELLS. Then the `⊸`-headed image is a
   natural fit and the `{→,×}` ↔ design correspondence is the native one — but this
   *changes the cited design leg* (BT2010 Thm 3.8 in place of BF Thm 11.16/11.17) and
   must be reconciled with the "BF-engine + BT2010-proof hybrid" carrier decision.
3. **Restrict scope to the `¬,∧`-expressible fragment.** Honest but probably vacuous:
   Ambler rules are intuitionistic implications, and `→` is *not* `¬,∧`-definable
   intuitionistically, so this would gut the aspirin corpus (every `tᵢ` is an arrow).

### Downstream items (assessed, but moot until D-A1 is repaired)

- **V-A2 ((S1)+(S2) = co-Kleisli image).** *Conditionally plausible.* As a
  characterisation of the **MELL** image of STLC under the co-Kleisli-of-`!` embedding,
  (S1) formula-shape + (S2) box-discipline is the standard Benton–Bierman–de
  Paiva–Hyland / Seely image and looks neither too broad nor too narrow. But it
  characterises a class of **MELL** proofs, not **MELLS** designs — so it cannot do the
  job §3.1 claims (identify `Im⟦·⟧` with a Thm-11.17-governed set) until D-A1 is fixed.
- **V-A3 (read-back single-valued).** *Plausible in MELL.* Focalization does remove the
  rule-permutation ambiguity, so `⟪·⟫` is single-valued on focalized cut-free MELL
  proofs. No counterexample found at this level. Unaffected by D-A1 in isolation, but
  inherits its target-mismatch (single-valued onto *MELL*, not *MELLS*).
- **V-A4 (η-long matching).** *Sound and genuinely used.* 4.2 correctly leans on
  η-long-normality to forbid the η-mismatch (a variable of arrow type is fully
  expanded ⇒ read-back is the same λ-block); an η-short term is excluded, not silently
  identified. This part is fine.
- **V-A5 (`!(C&D)≅!C⊗!D` canonicalisation).** *No collapse found, with one caveat.*
  Choosing the `⊗`-of-`!` form as canonical is consistent and does not merge two
  conjunctive-premise terms (the iso is invertible and applied uniformly at every
  premise `×`). Caveat for the repair: under the synthetic grammar the `⊗` must appear
  **under a `?_P`** (`?_P(N₁ ⊗ … ⊗ Nₙ)`) to be well-formed MELLS — another instance of
  the missing head-decoration of D-A1, but not an independent defect.
- **V-A6 (scope honesty).** *Mostly correct, but the boundary is mis-drawn.* Schematic
  variables (Q-033) genuinely out of scope; additive `⊕` genuinely Res-D; conjunctive
  `×` genuinely in scope. **However**, the draft places the whole aspirin family
  "inside MELLS," which D-A1 refutes: the family is inside *polarized MELL*, and its
  membership in *synthetic MELLS* is the unproved step. So 4.4's "in scope" is right
  about the *fragment of source types* but wrong about the *target landing zone*.
- **V-A7 (worked instance `g_r`).** *Correct as MELL bookkeeping.* `⟦g_r⟧` does have
  exactly one contraction on `!(!mp⊸asp)`, is cut-free and focalized, and `⟦g₁⟧,⟦g₂⟧,
  ⟦g_r⟧` are pairwise distinct with read-backs recovering the three terms — **in
  MELL**. The instance corroborates Steps 1–4 *as a MELL argument*; it does not rescue
  the MELLS landing (the three formulas are `⊸`-headed, per D-A1).

### Cross-cutting checks

- **D1 non-recurrence:** ✔ confirmed. Res-A uses no linear-incarnation / stability /
  `⋂`-meet machinery; D-A1 is a *target-grammar / fragment* defect, orthogonal to the
  D1 stability gap. The repair must not reintroduce D1 (route 2 above rides on BT2010
  completeness, not linear stability — clean).
- **Citations vs. claims:** Girard 1987 §5 (CBN), BBdPH/Seely (co-Kleisli), Andreoli
  1992 / Liang–Miller 2009 (focalization↔normal forms) are each used for what they
  prove **in MELL**. The slip is at the **MELL→MELLS** seam: BT2010 App A / BF App A
  Thm A.8 is invoked (§3.2) as "evidence-of-kind" precisely where a *theorem* is
  needed, and that theorem is the `¬,∧` one. That is the defect, stated plainly.

### Disposition

- **Res-A: NOT signed off — BLOCKING DEFECT D-A1.** Back to the author for the
  synthetic-translation + proof-level transfer (repair route 1) or the BT2010 re-target
  (route 2). Steps 2–4 are reusable *as MELL proof theory* once the landing zone is
  fixed; the η-long (V-A4) and canonicalisation (V-A5) work carries over.
- **Do not promote [T012](../02_THEOREMS_AND_PROOFS/T012-gen-b-antichain.md) on Res-A.**
  Q-032 closure remains gated; Res-A returns to *provisional-with-blocking-defect*.

---

## Re-target (route 2, 2026-06-20) — design leg via BT2010 c-designs (D-A1 repair)

**This adopts the cross-check's repair route 2.** D-A1 is entirely a property of the
**target logic of the design↔derivation leg**: BF's *synthetic constant-only MELLS*
has a head-exponential grammar (`P ::= ?_P(…)`, `N ::= !_N(…)`) that the curried-arrow
CBN image fails. The fix is to **replace the design leg's target** — from BF MELLS
(Thm 11.16/11.17) to **BT2010's proof system over logical behaviours** (Thm 3.5/3.8),
whose designs *are* λ-style c-designs and whose connectives admit arrows natively. The
verbatim-sourced facts (BT2010 PDF, in-repo) that make this clean:

### R2.1 — the BT2010 target has native arrows; no head-exponential grammar

BT2010 **logical behaviours** (Def 3.1: `P := α⟨N₁,…,Nₙ⟩`, `N := α(P₁,…,Pₙ)`) are
built from synthetic connectives that include `⊗, ℘(&), ⊕, ↓, ↑, 1, ⊥, ⊤` (Example
3.4, verbatim). The function/arrow is the standard polarized combination of these, and
crucially **the nonlinearity (contraction) is *internalized*** — BT2010 Ex 2.14:
*"we do not have exponentials here, because we are working in a nonlinear setting so
that they are already incorporated into the connectives."* So the Ambler `A → B` maps
to the **nonlinear function behaviour directly**, and the robustness rule's
doubled-use is native contraction — **no explicit `!`-head decoration is required**,
and there is no MELLS-style grammar to violate. *D-A1's root cause (the head-exponential
invariant) is absent from this target.*

### R2.2 — design ↔ derivation is a bijection *by construction* (the key win)

In BT2010, a derivation **is** a design (proof-term), and the correspondence is
definitional, not a separation/grammar-completeness theorem:

> **BT2010 Def 3.2.** "A **proof** is … a **total, deterministic and ✠-free design
> without cuts and identities**." (used as proof-terms for derivations)

> **BT2010 §3.1 (deterministic proof search), verbatim.** "given a positive sequent
> `z|a⟨M₁,…,Mₘ⟩ ⊢ Γ`, the head variable `z` and the first positive action `a`
> **completely determine the next positive rule** to be applied bottom-up." (BT2010
> txt L996-999)

The inference rules (§3.1, Example 3.4) **build the design compositionally** from its
premises, so a derivation determines a design; deterministic proof search inverts
this, so a proof design determines its derivation **uniquely**. Hence

$$\{\text{proof designs of } B\} \;\xleftrightarrow{\;\text{1–1}\;}\; \{\text{cut-free BT2010 derivations of } B\}$$

is a **bijection by construction**. Soundness + completeness pin it to `B`:

> **BT2010 Thm 3.5 (Soundness).** `D ⊢ Λ` derivable ⟹ `D ⊨ Λ`.
> **BT2010 Thm 3.8 (Completeness for proofs).** `D ⊢ Λ` derivable ⟺ `D ⊨ Λ`; a proof
> `P ∈ P` iff `P ⊢ x₀ : P` derivable.

**This dissolves D-A1:** the leg never touches MELLS or BF Thm 11.17; it is BT2010's
own design-as-proof-term framework, where arrows are native and faithfulness is
definitional (the separation failure, Rmk 2.4, is irrelevant — it concerns
`✠`-terminated non-proof designs, and this bijection runs through deterministic proof
search, not orthogonality).

### R2.3 — composing with leg 1 (the re-pointed term↔derivation bijection)

Steps 1–4 of this audit established `{βη-long STLC λ-terms} ↔ {focalized cut-free
derivations}` and were confirmed by the cross-check as **sound proof theory** (only the
*MELLS landing* failed). Re-pointed to BT2010's native-arrow proof system, the
**re-synthesis obstruction (V-A1) vanishes** — there is no head-exponential grammar to
satisfy, so the `⊸`-headed image is a legal BT2010 logical behaviour, and the forward
map (Step 2), image (Step 3), and read-back (Step 4) carry over verbatim. Composing
with R2.2:

$$\varphi \;:\; \{\text{ground } \{\to,\times,\text{atom}\}\ \text{STLC } \lambda\text{-terms of } \mathcal{C}/\Gamma(A,B^\sharp)\} \;\xrightarrow{\;\sim\;}\; \mathsf{Gen!}(B),$$

with `φ(M) = ⟦M⟧` the c-design realizer. In the c-design world this is nearly the
identity: Terui builds the λ-toolkit directly — **function designs (Def 2.17)**,
composition (**Lemma 3.2**), recursion (Prop 2.19) — so `M ↦ ⟦M⟧` is a faithful
encoding, injective by Terui's c-design semantics and surjective onto proof-designs of
`B` by completeness (Thm 3.8). The "derivation" is just the deterministic-proof-search
reading of `⟦M⟧`.

### R2.4 — the new residual (Res-A′) — lighter than D-A1's repair route 1

The re-target converts the *blocking* D-A1 into a **standard representation-fidelity**
residual:

> **Res-A′.** On the ground `{→, ×, atom}` Ambler fragment, the STLC λ-terms embed
> into BT2010 logical behaviours via Terui's function/data-design encoding,
> **βη-normal-bijectively** onto the proof designs `Gen!(B)`.

Grounded in: Terui Def 2.17 + Lemma 3.2 (the λ-toolkit / c-design model of STLC);
BT2010 App A (constant-only LLP embedding — LLP carries `→` via polarization); BT2010
Def 3.2 + Thm 3.5/3.8 + deterministic search (R2.2). This is a representation-theorem
check **native to the c-design lineage**, *not* the net-new "extend BF App A Thm A.8
from LJ₀ to {→,×}" that repair route 1 would demand. Determinism is automatic (STLC
λ-terms ↦ deterministic c-designs, unary `⋀` ⟹ BT2010 proofs, Def 3.2). The aspirin
family is ground, so it is in Res-A′'s scope; schematic variables (Q-033) and additive
`⊕` (Res-D) remain the degradation boundary, unchanged.

### R2.5 — what is gained, and the carrier cost

- **D-A1 dissolved** — no MELLS, no Thm 11.17; the leg is BT2010 Thm 3.8 over native
  logical behaviours.
- **Faithfulness (b₂′) is by construction** (design = proof-term + deterministic
  search), independent of separation — strictly more robust than the BF route.
- **Carrier cost (record against [Q-030](../01_OPEN_QUESTIONS_REGISTRY.md#q-030)).** The
  proof's design leg now **essentially uses c-design structure** (Terui function
  designs, β-style realizers), so the carrier-readout input **B flips from
  "lineage-neutral" → "uses-c-design."** The "BF-engine + BT2010-proof hybrid" still
  holds *by default* (proof-level): proving in the c-design companion while running the
  BF engine is exactly the hybrid. **But** the full-b-Terui-retarget trigger
  (`B = uses-c-design ∧ runtime-hot`) now has its B-condition **met** — only the
  runtime-profile sub-question stands between the hybrid and a Terui retarget. This is
  the Q-030 gate moving, recorded separately.

### R2.6 — disposition

**D-A1 repaired via route 2; Res-A re-pointed to BT2010 c-designs.** Status: **paper
argument, provisional**, pending an independent re-check of **Res-A′** (the
representation-fidelity residual). T012's R2 leg is updated to cite **BT2010 Thm 3.8 /
deterministic proof search** (design↔derivation) in place of BF Thm 11.16/11.17. The
Steps-1–4 proof theory (η-long V-A4, canonicalisation V-A5) is retained and re-pointed;
nothing from the MELL-side work is lost.

> **Res-A′ discharged (2026-06-20):** the representation bijection
> `{ground {→,×,atom} STLC λ-terms} ⥲ Gen!(B)` is written up in
> [`q032-res-a-prime-2026-06-20.md`](q032-res-a-prime-2026-06-20.md) — verdict
> **bijection**, via the native-arrow BT2010 design leg + deterministic-proof-search
> read-back + Res-C material-representative composition. The one open re-check item is
> its **Leg-1 fidelity lemma** (βη-long-normal `{→,×}` ↔ focalized cut-free BT2010/LLP
> derivations).
