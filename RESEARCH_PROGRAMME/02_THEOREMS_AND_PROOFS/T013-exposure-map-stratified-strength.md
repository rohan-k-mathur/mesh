# T013 — The walked / witnessable / latent exposure map refines Prakken-2024 dialectical strength, but only when the refinement is subordinated to Prakken's count; the naive lexicographic stratum vector does not

- **status:** established (author-side draft 2026-06-24; **independent cross-check signed off 2026-06-24** — see [T013 verification prompt](T013-verification-prompt.md) and `## Cross-check notes` below). Settles the §Positive-settlement content of [C003](../03_CONJECTURES/C003-exposure-map-refines-prakken.md) for a **sharpened** strength function `μ_S*`, and **refutes the literal encoding** `μ_S♭ = (w, x, ℓ)` of C003 for the faithful *count* reading of Prakken's `μ_P`.
- **partially-resolves:** [Q-003](../01_OPEN_QUESTIONS_REGISTRY.md#q-003) (positive for `μ_S*`; the literal `(w,x,ℓ)`-lex encoding is shown insufficient for the count reading via the Impossibility Lemma).
- **discharges:** the `κ ∘ proj_des` stratum map that [Q-004](../01_OPEN_QUESTIONS_REGISTRY.md#q-004)'s drainage corollary quantifies over (§7).
- **depends-on:** — (self-contained; pen-and-paper; no engine work; no new tables). Uses only the existing argument-graph schema (`ArgumentEdge`, `DialogueMove`, `WitnessRecord` — §6).
- **proved-by:** drafted 2026-06-24 (Phase A of [session 15](../10_IDEATION_SESSIONS/15-q002-q003-sequencing-2026-06-16.md): the self-contained, dependency-free Q-003 track).
- **cross-checked-by:** independent non-author reader (2026-06-24; SIGNED OFF against the [verification prompt](T013-verification-prompt.md) — all of §§1–6 re-derived from scratch, no blocking or non-blocking defects; see `## Cross-check notes`)
- **cross-check-date:** 2026-06-24
- **last-reviewed:** 2026-06-24
- **source-of-proof:** this file
- **corroborating-computation:** none required — the result is finitary and pen-and-paper. The worked example (§5) is JSON/schema-encodable as a regression fixture if desired, but no kernel is exercised.

> Methodology note. This is the *prove* half of the Q-003 track. There is no engine
> to differentially test against (unlike T005–T011): C003 is a statement about
> Prakken-2024 expansion families and the substrate's participant-access
> stratification, both of which are combinatorial. The load-bearing technical
> content is the **Impossibility Lemma** (a lexicographic order on `ℕ^k`, `k ≥ 2`,
> never refines the `L¹`-sum order), which is what forces the refinement to be
> *subordinate to* Prakken's count rather than a free re-ranking by stratum. The
> result is therefore a **refute-the-naive-encoding / establish-the-repair**
> settlement, in the programme's honest-restatement discipline.

---

## 1. Vocabulary and setup

### 1.1 Prakken's per-expansion strength

Fix a finite abstract argumentation framework `F = (A, ⇝)` and a **target
argument** `a₀ ∈ A` whose dialectical strength is at issue.

- **Expansion.** An expansion `e` of `F` yields `F ⊕ e = (A ∪ A_e, ⇝ ∪ ⇝_e)`,
  adding a finite set of arguments `A_e` and attacks `⇝_e` (Baumann–Brewka normal
  expansion theory; Prakken 2024 §2). `E(F)` is the family of all such expansions.
- **Expansion-extension order.** `e ⊑ e′` iff `A_e ⊆ A_{e′}` and `⇝_e ⊆ ⇝_{e′}`
  (e′ extends e). `(E(F), ⊑)` is a poset with least element the empty expansion.
- **Successful attack.** Under a fixed Dung semantics (we use **grounded**; the
  argument is semantics-agnostic and is noted where it matters), an attacker
  `b ⇝ a₀` in `F ⊕ e` is **successful** iff it keeps `a₀` out of the extension —
  i.e. `b` is in the grounded extension of `F ⊕ e` and `a₀` is not. Write
  `SA(e) ⊆ A ∪ A_e` for the set of successful attackers of `a₀` in `F ⊕ e`.
- **Prakken's per-expansion count.** Following the paper's primitive — *"the
  number of ways in which an argument can be successfully attacked in
  expansions"* (Prakken, *AIJ* 335:104193, abstract) — the faithful
  per-expansion reading is the **count**

  $$\mu_P(e) \;:=\; |\mathrm{SA}(e)| \;\in\; \mathbb{N}.$$

  This is multiplicity-sensitive: two distinct successful attackers count twice.
  (The degenerate **indicator** reading `μ_P^{ind}(e) := [\,\mathrm{SA}(e) \neq \varnothing\,] ∈ \{0,1\}`
  discards multiplicity; §4 shows it behaves differently, and why the count
  reading is the faithful one.)

### 1.2 The exposure map `κ` on moves/designs

Fix the **live deliberation state** `L`: the realized dialogue. Concretely `L`
comprises the `DialogueMove`s actually played, their `WitnessRecord` bindings
(each binds a ludic move to one dialogue move and a `participantId`), and the
**realized argument graph** `G_L ⊆ F` they induce. For an attacker `b` (a
move/design that an expansion may introduce), define the **stratum**

$$
\kappa(b) \;=\;
\begin{cases}
\textbf{walked} & \exists\,\text{a witness record binding } b \text{ to a dialogue move in } L,\\[2pt]
\textbf{witnessable} & b \text{ is not walked, but in } G_L \text{ is reachable from a walked} \\
                     & \text{locus by a participant holding } \ge 1 \text{ binding,}\\[2pt]
\textbf{latent} & \text{otherwise (reachable by no current participant).}
\end{cases}
$$

This is `κ` at the level of **moves/designs** — exactly `κ ∘ proj_des`, where
`proj_des` extracts the introduced design/move from an expansion element (the map
[Q-004](../01_OPEN_QUESTIONS_REGISTRY.md#q-004)'s drainage corollary quantifies
over; §7). Lift `κ` to expansions by the **per-stratum successful-attack counts**

$$
w(e) = |\{b \in \mathrm{SA}(e) : \kappa(b) = \textbf{walked}\}|,\quad
x(e) = |\{\dots \textbf{witnessable}\}|,\quad
\ell(e) = |\{\dots \textbf{latent}\}|,
$$

so that `w(e) + x(e) + ℓ(e) = μ_P(e)`. The triple `(w(e), x(e), ℓ(e))` is the
**walked-witnessable-latent decomposition** of the expansion's successful-attack
count.

### 1.3 Load-bearing reachability convention (LB1)

> **LB1.** `κ(b)` is computed against the **fixed** live state `L` and the
> **base** realized graph `G_L`, *not* against the expanded graph `F ⊕ e`.

Consequence: `κ(b)` is an **intrinsic** attribute of the move `b` relative to `L`,
independent of which expansion `e` happens to carry `b`. LB1 is the substrate's
intended reading — *"witnessable"* is meant to mean *"a participant could play
this **now**, from where they actually stand"*, which is a fact about the live
state, not about a hypothetical expansion's internal scaffolding. §8 records the
alternative *reachability-in-expansion* reading and exactly what it would cost
(it breaks clause 3's componentwise form).

### 1.4 Two candidate stratified strengths

Both map `E(F) → ℕ³` and are read **lexicographically** (most-significant
coordinate first):

- **Naive (the literal C003 encoding):** `μ_S♭(e) = (w(e), x(e), ℓ(e))`.
- **Prakken-subordinate (this theorem's choice):**
  `μ_S*(e) = (μ_P(e),\; w(e),\; x(e))` — Prakken's count leads, then the walked
  count, then the witnessable count; the latent count is recovered as
  `ℓ(e) = μ_P(e) − w(e) − x(e)`, so `μ_S*` still carries the full
  walked-witnessable-latent decomposition (it is a bijective re-coordinatisation
  of `(w, x, ℓ)`, since `(μ_P, w, x) = (w+x+ℓ, w, x)`).

---

## 2. The Impossibility Lemma (why the naive encoding cannot refine the count)

**Lemma (lex never refines the `L¹`-sum).** For every `k ≥ 2`, the lexicographic
order `≤_lex` on `ℕ^k` does **not** refine the sum preorder `≤_Σ` (where
`u ≤_Σ v` iff `Σᵢ uᵢ ≤ Σᵢ vᵢ`): there exist `u, v ∈ ℕ^k` with `u <_lex v` yet
`Σ u > Σ v`.

*Proof.* Take `u = (0, …, 0, 2)` and `v = (1, 0, …, 0)`. The first coordinate
gives `u <_lex v` (since `0 < 1`), while `Σ u = 2 > 1 = Σ v`. ∎

**Corollary (clause 1 fails for `μ_S♭` under the count reading).** Whenever the
substrate realizes both stratum profiles — an expansion `e` with **two latent**
successful attackers (`(w,x,ℓ)(e) = (0,0,2)`) and an expansion `e′` with **one
walked** successful attacker (`(w,x,ℓ)(e′) = (1,0,0)`) — we have

$$\mu_S♭(e) = (0,0,2) \;<_{\mathrm{lex}}\; (1,0,0) = \mu_S♭(e′)\quad\text{but}\quad \mu_P(e) = 2 \;>\; 1 = \mu_P(e′),$$

contradicting C003 clause 1 (`μ_S♭(e) ≤_lex μ_S♭(e′) ⇒ μ_P(e) ≤ μ_P(e′)`). Both
profiles are realizable in the substrate (a base AF in which `a₀` has two
mutually-independent latent successful attackers, vs. one in which it has a single
walked successful attacker — both are ordinary `ArgumentEdge` configurations), so
this is not a vacuous obstruction. **Hence the literal C003 encoding `μ_S♭` is
unsound for the faithful, multiplicity-sensitive reading of Prakken's count.** ∎

The diagnosis is structural, not incidental: any lexicographic order is
*dictatorial in its leading coordinate*, while Prakken's count weights every
stratum **equally**. A single large count in a low-significance stratum (latent)
must, under the sum, outweigh a small count in the leading stratum (walked) — but
the lex order, by construction, never lets it. The two orders are therefore
incompatible by design, for any choice of which stratum leads (the lemma is
symmetric in coordinate permutation). The repair is to stop trying to make the
stratum vector *re-rank* Prakken and instead make it *break Prakken's ties*.

---

## 3. Theorem — the Prakken-subordinate stratified strength refines Prakken

**Theorem.** Let `μ_S := μ_S*(e) = (μ_P(e), w(e), x(e))`, lexicographic. Then:

1. **Refinement.** For all `e, e′ ∈ E(F)`, `μ_S(e) ≤_lex μ_S(e′) ⇒ μ_P(e) ≤ μ_P(e′)`.
2. **Strict refinement on ≥ 1 pair.** There exist `e, e′` with `μ_P(e) = μ_P(e′)`
   but `μ_S(e) <_lex μ_S(e′)`.
3. **Monotonicity under expansion extension** (on the accrual fragment
   `E↑(F)`, §3.3): if `e ⊑ e′` then `(w, x, ℓ)(e) ≤ (w, x, ℓ)(e′)` componentwise,
   hence `μ_S(e) ≤_lex μ_S(e′)`.

### 3.1 Proof of clause 1 (refinement)

`μ_P` is the **leading** coordinate of `μ_S*`. If `μ_S*(e) ≤_lex μ_S*(e′)` then
either the leading coordinates are equal (`μ_P(e) = μ_P(e′)`, so `μ_P(e) ≤ μ_P(e′)`)
or the leading coordinate of `e` is strictly smaller (`μ_P(e) < μ_P(e′)`). In both
cases `μ_P(e) ≤ μ_P(e′)`. ∎

> Clause 1 is *immediate by construction* for `μ_S*` — and this is the point.
> §2 proved no `(w,x,ℓ)`-lex encoding can secure it; subordinating the refinement
> to `μ_P` secures it trivially while still carrying the full stratum
> decomposition. The non-triviality has moved entirely into clauses 2–3 and into
> the honesty of the construction (we did not invent discriminating power; we only
> reorganised the tie-breaking).

### 3.2 Proof of clause 2 (strict refinement)

Exhibited concretely by the worked example of §5: two expansions `e₁`, `e₂` with
`μ_P(e₁) = μ_P(e₂) = 1` (each adds exactly one successful attacker of `a₀`) whose
attackers differ in stratum — `e₁`'s is **walked**, `e₂`'s is **latent**. Then

$$\mu_S*(e₂) = (1, 0, 0) \;<_{\mathrm{lex}}\; (1, 1, 0) = \mu_S*(e₁),$$

with `μ_P(e₁) = μ_P(e₂)`. So `μ_S*` strictly orders a pair that `μ_P` ties: the
stratification has genuine discriminating power. ∎

This refutes C003's *negative*-settlement disjunct ("no `μ_S` satisfying clause 1
can satisfy clause 2"): `μ_S*` satisfies both.

### 3.3 Proof of clause 3 (monotonicity), and its scope

**Why a scope is needed.** On the *full* lattice `(E(F), ⊑)`, `μ_P` is **not**
monotone: an expansion `e′ ⊒ e` may add a defeater of some `b ∈ SA(e)`,
**reinstating** `a₀` against `b` and dropping `b` from `SA(e′)`. Then
`μ_P(e′) < μ_P(e)` and the stratum counts can fall. Non-monotonicity under
reinstatement is intrinsic to Dung semantics, not an artefact of our encoding;
Prakken's own monotonicity statements are likewise restricted to specific
expansion classes. We therefore scope clause 3 to the fragment on which it can
hold.

**The accrual fragment.** Let

$$E↑(F) \;=\; \{\, e \sqsubseteq e′ \in E(F) : \mathrm{SA}(e) \subseteq \mathrm{SA}(e′) \,\}$$

— the expansion steps that **only add successful attackers and never reinstate**
`a₀` (equivalently: no argument added by `e′ ∖ e` defeats any `b ∈ SA(e)`). This
is the dialectical-accrual regime, and it is exactly the regime the Q-004 joint
saturation sequence lives in (§7).

**Proof on `E↑(F)`.** Suppose `e ⊑ e′` with `SA(e) ⊆ SA(e′)`. By **LB1**, `κ(b)`
depends only on the fixed live state `L`, not on `e` or `e′`; so for each stratum
`s ∈ {walked, witnessable, latent}`,

$$\{b \in \mathrm{SA}(e) : \kappa(b) = s\} \;\subseteq\; \{b \in \mathrm{SA}(e′) : \kappa(b) = s\}.$$

Taking cardinalities, `w(e) ≤ w(e′)`, `x(e) ≤ x(e′)`, `ℓ(e) ≤ ℓ(e′)` — the
componentwise inequality on the walked-witnessable-latent decomposition, as
clause 3 demands. Componentwise `≤` implies lexicographic `≤` on `(μ_P, w, x)`
(since `μ_P = w+x+ℓ` is then also non-decreasing), so `μ_S*(e) ≤_lex μ_S*(e′)`. ∎

---

## 4. The indicator reading, for completeness

Under the degenerate **indicator** reading `μ_P^{ind}(e) = [\,SA(e) ≠ ∅\,]`, the
*naive* literal encoding `μ_S♭ = (w,x,ℓ)` **does** satisfy all three clauses:

- Clause 1: `μ_P^{ind}(e) > μ_P^{ind}(e′)` forces `μ_P^{ind}(e)=1, μ_P^{ind}(e′)=0`,
  i.e. `SA(e) ≠ ∅` and `SA(e′) = ∅`, so `μ_S♭(e) ≠ (0,0,0) = μ_S♭(e′)` and thus
  `μ_S♭(e) >_lex μ_S♭(e′)` (every nonzero vector exceeds the zero vector in lex);
  the antecedent `μ_S♭(e) ≤_lex μ_S♭(e′)` is false, so the implication holds.
- Clauses 2–3: as in §3 (the stratum decomposition is unchanged).

So the literal C003 statement is **satisfiable for the indicator reading and
refuted for the count reading.** The count reading is the faithful one — Prakken's
primitive is *"the number of ways"*, a multiplicity, not a yes/no — so the
operative settlement is §3's `μ_S*`. The indicator result is recorded only to
locate the exact boundary: the naive encoding works iff Prakken's count is
collapsed to a bit, which is precisely the information the substrate's refinement
is supposed to *add back*, not throw away. **`μ_S*` is the unique-up-to-recoordinatisation
choice that refines the count reading while carrying the stratum decomposition**,
and it refines the indicator reading *a fortiori*.

---

## 5. Worked tie-break example (clause 2), schema-encodable, no new tables

A minimal deliberation breaking a Prakken tie by stratification.

**Base AF `F`.** Arguments `{a₀, p}` with `p ⇝ a₀` already defeated/irrelevant in
the live deliberation (or simply `F = ({a₀}, ∅)` — `a₀` asserted, unattacked).
Participants `P` (proponent of `a₀`) and `Q`.

**Live state `L`.** `Q` has actually asserted an argument `b₁` and attacked `a₀`
with it: there is a `DialogueMove` for `b₁` and a `WitnessRecord` binding it to
`Q`. So `κ(b₁) = walked`. Separately, there is an argument `b₂` in expansion
space that also attacks `a₀`, reachable from no walked locus by any current
participant (no `WitnessRecord` touches it and `G_L` contains no path to it from a
binding `Q` or `P` holds): `κ(b₂) = latent`.

**Two single-attacker expansions.**

| expansion | adds | `SA` | `μ_P` | `κ` of the attacker | `(w, x, ℓ)` | `μ_S*` |
|---|---|---|---|---|---|---|
| `e₁` | edge `b₁ ⇝ a₀` (with `b₁` already walked) | `{b₁}` | 1 | walked | `(1, 0, 0)` | `(1, 1, 0)` |
| `e₂` | edge `b₂ ⇝ a₀` (with `b₂` latent) | `{b₂}` | 1 | latent | `(0, 0, 1)` | `(1, 0, 0)` |

Both attacks succeed (each attacker is unattacked in `F ⊕ eᵢ`, so it enters the
grounded extension and evicts `a₀`): `μ_P(e₁) = μ_P(e₂) = 1`. **Prakken ties them.**
The stratified strength does not:
`μ_S*(e₂) = (1,0,0) <_lex (1,1,0) = μ_S*(e₁)` — the *walked* attack is
dialectically stronger than the *latent* one at equal Prakken count. ∎

**Encoding in the existing schema (no new tables).**

- `a₀, b₁, b₂` — argument/claim nodes (existing argument layer).
- `b₁ ⇝ a₀`, `b₂ ⇝ a₀` — two rows in [`ArgumentEdge`](../../lib/models/schema.prisma)
  (`type = rebut/undercut`, `toArgumentId = a₀`).
- `b₁` walked — one [`DialogueMove`](../../lib/models/schema.prisma) for `Q`'s
  assertion of `b₁`, plus one [`WitnessRecord`](../../lib/models/schema.prisma)
  (`dialogueMoveId → b₁`'s move, `participantId = Q`). This binding **is** the
  walked predicate.
- `b₂` latent — **no** `WitnessRecord` references `b₂`, and `G_L` (the realized
  `ArgumentEdge`/`DialogueMove` graph) has no path to `b₂` from any locus `P` or
  `Q` holds a binding to.

`κ` is then read directly off the data: walked = "has a `WitnessRecord`";
witnessable = "no record, but graph-reachable from a walked locus by a
binding-holder"; latent = "neither". No schema change is required — this is the
sense in which C003's clause (d) is discharged.

---

## 6. What is settled, and what is refuted

- **Settled (positive), cross-check signed off 2026-06-24.** The Prakken-subordinate
  stratified strength `μ_S*(e) = (μ_P(e), w(e), x(e))` satisfies C003 clauses 1–3
  (clause 3 on the accrual fragment `E↑(F)`), with an explicit clause-2 tie-break. The
  exposure-map stratification therefore **does** monotonically refine Prakken's
  dialectical strength, *as an orthogonal tie-breaker subordinate to Prakken's
  count* — matching the lit-review framing (R-C8: "an orthogonal refinement …
  a participant-access dimension Prakken's framework lacks").
- **Refuted (negative).** The **literal** C003 encoding `μ_S♭ = (w, x, ℓ)` read
  lexicographically does **not** satisfy clause 1 for the faithful, multiplicity-
  sensitive count reading of `μ_P` (Impossibility Lemma + Corollary, §2). It
  satisfies clause 1 only for the degenerate indicator reading (§4), which
  discards the very multiplicity the refinement is meant to stratify.

Net: C003's *intent* is vindicated; its *literal strength-function* is corrected.
This is a **sharpened-statement** settlement, not a clean confirmation — the
correction (subordinate the stratum vector to `μ_P`) is the substantive content.

---

## 7. Discharge of the `κ ∘ proj_des` stratum map for Q-004

[Q-004](../01_OPEN_QUESTIONS_REGISTRY.md#q-004)'s drainage corollary quantifies
over "the `latent`-stratum cardinality of `κ ∘ proj_des ∘ σ_joint` along the
update sequence". This theorem supplies that map:

- `κ ∘ proj_des` **is** the §1.2 stratum map `κ` on moves/designs (`proj_des`
  extracts the introduced design; `κ` classifies it). It is well-defined and
  computable directly from `WitnessRecord` + the realized graph `G_L`.
- The **latent-stratum cardinality** the drainage corollary tracks is exactly
  `ℓ(·)` here.

**Two axes — no contradiction with drainage.** Clause 3 proves `ℓ` is
*non-decreasing under `⊑`* (expansion-space growth at **fixed** live state `L`,
via LB1). Q-004's drainage proves `ℓ` *decreases along the saturation sequence* —
but that sequence grows the **live state** `L_t` (participants walk new moves), and
as `L_t` grows, moves cross strata `latent → witnessable → walked`, draining `ℓ`.
These are **orthogonal axes**: `κ` is intrinsic at fixed `L` (clause 3) and
*drains* as `L` evolves (Q-004; the `{B_t}` time axis of
[Q-005](../01_OPEN_QUESTIONS_REGISTRY.md#q-005)). T013 fixes the **fixed-`L`**
behaviour and the well-definedness of `κ`; Q-004 owns the **`L`-evolution**
dynamics. The drainage corollary may now cite `κ`, `proj_des`, and `ℓ` as
established objects rather than placeholders.

---

## 8. Load-bearing assumptions and the alternative reading

- **LB1 (reachability at fixed live state)** is the one substantive modelling
  choice. Under the **alternative** *reachability-in-expansion* reading — where
  `κ(b)` is computed in the expanded graph `F ⊕ e` (so an expansion that bundles a
  bridge argument can **promote** a would-be-latent `b` to witnessable) — clause 3's
  *componentwise* form **breaks**: extending `e` to `e′` can move a successful
  attacker from the latent stratum to the witnessable stratum, so `ℓ` falls while
  `x` rises. On that reading clause 3 must be restated as monotonicity of a
  *coarser* quantity, e.g. the **walked-or-witnessable union count** `w + x` (which
  is non-decreasing, since promotions only ever flow *into* it) together with the
  total `μ_P`; the pure latent coordinate is then not individually monotone. This
  theorem commits to **LB1** because the substrate's intended semantics of
  "witnessable" is *"playable by a participant **now**"*, a property of the live
  state and not of a counterfactual expansion's internal scaffolding. A future
  decision to adopt reachability-in-expansion would reopen clause 3 only (clauses
  1–2 are LB1-independent).
- **Grounded semantics** is used for "successful attack". The argument is
  semantics-agnostic for clauses 1–2 (they need only that `SA(·)` and hence
  `μ_P`, `w`, `x`, `ℓ` are well-defined). Clause 3's `SA(e) ⊆ SA(e′)` accrual
  hypothesis is what carries the monotonicity; under credulous/preferred semantics
  the accrual fragment is defined identically and the proof is unchanged.
- **Per-expansion count vs. family aggregate.** C003 (and this theorem) work with
  the *per-expansion* `μ_P : E(F) → ℕ`. Prakken's *family-level* strength of `a₀`
  aggregates `μ_P` over `E(F)`; the refinement here lifts to the family level by
  comparing the multisets `{μ_S*(e) : e ∈ E(F)}` lexicographically-pointwise, but
  that lift is not needed for clauses 1–3 and is left to the Q-004/Q-005 dynamics.

---

## 9. Relationship to the registry

- **C003** ([`../03_CONJECTURES/C003-exposure-map-refines-prakken.md`](../03_CONJECTURES/C003-exposure-map-refines-prakken.md)):
  status is *partially-resolved* (cross-check signed off 2026-06-24) — positive
  for the sharpened `μ_S*`, with the literal `μ_S♭` refuted for the count reading.
- **Q-003** ([`../01_OPEN_QUESTIONS_REGISTRY.md#q-003`](../01_OPEN_QUESTIONS_REGISTRY.md#q-003)):
  status is *partially-resolved* (cross-check signed off 2026-06-24); the
  next-action advances to the Q-004 drainage corollary that now has its `κ`,
  `proj_des`, and `ℓ` as established objects.
- **Q-004**: this theorem discharges the `κ ∘ proj_des` stratum map (§7); the
  drainage corollary's remaining content (monotone `ℓ`-drainage along `σ_joint`)
  is unblocked but not itself settled here.

## Cross-check notes

**SIGNED OFF — 2026-06-24 (independent non-author reader).** Verdict against the
[T013 verification prompt](T013-verification-prompt.md): all obligations of
§§1–6 discharged; every clause and the Impossibility Lemma re-derived from
scratch, not trusted from the proof's own summaries. No blocking defects; no
non-blocking defects requiring repair. Detail by prompt section:

**§1 — Impossibility Lemma and corollary (the technical heart).**
- *Lemma re-proved.* For `k ≥ 2`, `u = (0,…,0,2)`, `v = (1,0,…,0)`: leading
  coordinate `0 < 1` gives `u <_lex v`, while `Σu = 2 > 1 = Σv`. So `≤_lex` does
  not refine `≤_Σ`. ✓
- *Coordinate-permutation symmetry confirmed.* The obstruction is not specific to
  "walked leads". For any choice of leading stratum, put `0` in the leading
  coordinate of `u` and `1` in that of `v`, and `2` in any other coordinate of
  `u` (exists since `k ≥ 2`); the same witness recurs. The dictatorship-of-the-
  leading-coordinate diagnosis is correct and order-independent. ✓
- *Corollary realizability confirmed — adversarial item (a) cleared.* Take base
  `F = ({a₀}, ∅)` at a fixed live state `L`. Expansion `e` adds two mutually
  non-attacking, unattacked arguments `b, b′` with `b ⇝ a₀`, `b′ ⇝ a₀`, neither
  witnessed nor reachable in `G_L` from a binding-holder; under grounded, `b, b′`
  both enter and evict `a₀`, so `SA(e) = {b, b′}`, `μ_P(e) = 2`, `(w,x,ℓ)(e) =
  (0,0,2)`. Expansion `e′` (same `F`, same `L`) adds one unattacked walked
  attacker `b″`, `SA(e′) = {b″}`, `(w,x,ℓ)(e′) = (1,0,0)`. **There is no
  structural bar on two simultaneous independent latent successful attackers** —
  latency is a participant-access property of `L`, not a constraint on `SA`, and
  two unattacked attackers are jointly admissible under grounded. The `(0,0,2)`
  profile is genuinely realizable, so the corollary is not vacuous. Both
  expansions live in the same `E(F)` at the same `L`, so they are legitimately
  comparable under C003 clause 1: `μ_S♭(e) = (0,0,2) <_lex (1,0,0) = μ_S♭(e′)`
  yet `μ_P(e) = 2 > 1 = μ_P(e′)`. ✓
- *No overclaim.* The theorem refutes the **literal `μ_S♭` encoding for the count
  reading**, not C003 globally (the indicator reading is handled in §4 and `μ_S*`
  in §3). Correctly scoped. ✓

**§2 — Clause 1 for `μ_S*` (§3.1).** `μ_P` is the leading coordinate of
`μ_S* = (μ_P, w, x)`; `μ_S*(e) ≤_lex μ_S*(e′)` forces `μ_P(e) ≤ μ_P(e′)` by
projection to the leading coordinate. No circularity (pure projection). The
re-coordinatisation `(w,x,ℓ) ↦ (w+x+ℓ, w, x)` is injective with `ℓ` recovered as
`μ_P − w − x`, so `μ_S*` carries the full stratum decomposition. ✓

**§3 — Clause 2 (§3.2, §5).** Arithmetic re-checked: `e₁` walked ⇒ `(1,0,0)` ⇒
`μ_S* = (1,1,0)`; `e₂` latent ⇒ `(0,0,1)` ⇒ `μ_S* = (1,0,0)`;
`μ_P(e₁) = μ_P(e₂) = 1`; `(1,0,0) <_lex (1,1,0)` on the second coordinate
(`0 < 1`). This is a genuine Prakken tie (equal leading coordinates) broken by
the stratification, not a `μ_P`-difference in disguise. Refutes C003's negative-
settlement disjunct, since `μ_S*` satisfies both clause 1 and clause 2. ✓

**§4 — Clause 3 and scope (§3.3) — most error-prone, scrutinised hardest.**
- *Non-monotonicity on the full lattice, concretely.* `F = ({a₀}, ∅)`; `e` adds
  `b ⇝ a₀` (`b` unattacked), `SA(e) = {b}`, `μ_P(e) = 1`; `e′ ⊒ e` additionally
  adds `c ⇝ b` (`c` unattacked). Grounded on `F ⊕ e′`: `c` in ⇒ `b` out ⇒ `a₀`
  reinstated ⇒ `a₀` in, so `SA(e′) = ∅`, `μ_P(e′) = 0 < 1`. Confirms `μ_P` is
  non-monotone under reinstatement, so an **unscoped** clause 3 would be false and
  the restriction to `E↑(F)` is necessary, not a needless weakening. ✓
- *Accrual fragment + LB1.* On `E↑(F) = {e ⊑ e′ : SA(e) ⊆ SA(e′)}`, LB1 makes
  `κ(b)` intrinsic to `b` at the fixed `L`, so the same `b` carries the same
  stratum in `e` and `e′`; hence `{b ∈ SA(e) : κ(b)=s} ⊆ {b ∈ SA(e′) : κ(b)=s}`
  per stratum. Cardinalities give `w, x, ℓ` each non-decreasing — the
  componentwise inequality C003 clause 3 demands — and `(μ_P, w, x)` is then
  componentwise non-decreasing, hence `≤_lex`. The load-bearing step (κ fixed
  across `e, e′`) is exactly LB1. ✓
- *Two-axes reconciliation (§7) — adversarial item (b) cleared.* Clause 3 varies
  the expansion `e` under `⊑` at **fixed** `L` (κ a fixed labelling, counts
  accrue, `ℓ` non-decreasing). Q-004 drainage varies the **live state** `L_t`
  (participants walk moves; for a fixed attacker the stratum reclassifies
  `latent → witnessable → walked`, draining `ℓ`). These are independent variables:
  extending an expansion does **not** create `WitnessRecord`s, so it does not grow
  `L`; conversely growing `L` is a change to the realized dialogue independent of
  which expansion is being scored. No contradiction; the Q-004 `κ` discharge is
  sound. ✓

**§5 — LB1 and the alternative reading (§8).** LB1 is stated explicitly as a
load-bearing modelling choice (§1.3, §8), not smuggled. Under
reachability-in-expansion, an expansion bundling a bridge promotes
`latent → witnessable`, so `ℓ` falls while `x` rises and the componentwise form
breaks; the proposed restatement (monotone union count `w + x` — promotions only
flow in, and reachability is monotone in `e` — plus total `μ_P`) is correct.
Clauses 1–2 are confirmed LB1-independent: clause 1 needs only that `μ_P` leads;
clause 2 needs only a walked-vs-non-walked tie at equal `μ_P`, and walked status
is `L`-dependent in either reading. ✓

**§6 — Encoding (no new tables).** Confirmed against
[`../../lib/models/schema.prisma`](../../lib/models/schema.prisma): `ArgumentEdge`
(`fromArgumentId`, `toArgumentId`, `type ∈ EdgeType` with `rebut`/`undercut`
present) encodes `b₁ ⇝ a₀`, `b₂ ⇝ a₀`; `DialogueMove` (`argumentId` /
`createdArguments`) encodes `Q`'s assertion of `b₁`; `WitnessRecord`
(`dialogueMoveId @unique`, `participantId`) binds that move and **is** the walked
predicate. walked ⇔ a `WitnessRecord` binds the attacker's move; latent ⇔ no
record + no reachable locus; witnessable ⇔ no record + graph-reachable from a
walked locus by a binding-holder — each readable off `WitnessRecord` +
`ArgumentEdge` + `DialogueMove` with **no new table or column**. ✓

**Verdict.** T013 → `established`. C003 → `partially-resolved` (positive for
`μ_S*`; literal `μ_S♭` refuted for the count reading). Q-003 →
`partially-resolved`, next-action advances to the Q-004 drainage corollary, for
which §7 now supplies `κ`, `proj_des`, and `ℓ` as established objects.

## Bibliography

- Prakken 2024, *An abstract and structured account of dialectical argument
  strength*, *Artificial Intelligence* 335:104193 (per-expansion successful-attack
  count `μ_P`).
- Baumann & Brewka 2010, *Expanding argumentation frameworks* (normal expansions;
  the `⊑` order).
- Dung 1995, *On the acceptability of arguments* (grounded extension; reinstatement
  ⇒ non-monotonicity of `SA` on the full lattice).
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_2.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md)
  §2.4 (R-C8 — Prakken 2024 has no participant-access stratum; the stratification
  is substrate-original).
- [`../07_GLOSSARY.md`](../07_GLOSSARY.md) (walked / witnessable / latent
  definitions).
- [C003](../03_CONJECTURES/C003-exposure-map-refines-prakken.md);
  [session 15](../10_IDEATION_SESSIONS/15-q002-q003-sequencing-2026-06-16.md) (the
  Q-003 track scoping).
