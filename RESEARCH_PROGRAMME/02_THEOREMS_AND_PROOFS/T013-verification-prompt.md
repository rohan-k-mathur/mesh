# Verification prompt — fully cross-check T013 (exposure-map stratified strength refines Prakken)

> **Role.** You are an independent second reader. You did **not** author T013.
> Your job is to either (a) sign off on the theorem as *established*, or (b) return
> a numbered list of substantive defects, each with the precise location and the
> minimal repair you believe is required. Default to skepticism: a clean sign-off
> requires that *every* obligation below is discharged. Do **not** trust the
> proof's own summaries — re-derive each clause and re-check the Impossibility
> Lemma and its corollary from scratch.
>
> **Target.** [`T013-exposure-map-stratified-strength.md`](T013-exposure-map-stratified-strength.md)
> — two coupled claims: (i) **negative** — the literal C003 encoding
> `μ_S♭ = (w, x, ℓ)` read lexicographically does **not** satisfy C003 clause 1 for
> the multiplicity-sensitive *count* reading of Prakken's `μ_P` (Impossibility
> Lemma + Corollary, §2); (ii) **positive** — the Prakken-subordinate strength
> `μ_S* = (μ_P, w, x)` satisfies C003 clauses 1–3 (clause 3 on the accrual
> fragment `E↑(F)`), with an explicit clause-2 tie-break (§3, §5).
>
> **Programme rules you are bound by.** Read [`README.md`](README.md)
> (theorem-register policy) first. An entry must be (1) stated in formal
> vocabulary, (2) human-checkable in one sitting via lemmas, (3) cross-checked by
> a non-author, (4) tied to an open-question entry it retires or updates. This is a
> **pen-and-paper** theorem — there is no kernel to differentially test; the proof
> stands or falls on the combinatorics. Record your verdict in a
> `## Cross-check notes` section appended to T013 (see
> [`T004-jsl-fragment-bridge.md`](T004-jsl-fragment-bridge.md) for the model).

---

## 0. Source materials you must consult (do not work from T013 alone)

- **The theorem.** [`T013-exposure-map-stratified-strength.md`](T013-exposure-map-stratified-strength.md)
- **The conjecture it settles.** [`../03_CONJECTURES/C003-exposure-map-refines-prakken.md`](../03_CONJECTURES/C003-exposure-map-refines-prakken.md)
  — the three clauses, the positive/negative settlement criteria, the requirement
  that the worked example be encodable with no new tables.
- **The Prakken framing.** [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_2.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md)
  §2.4 (R-C8) — Prakken's primitive is *"the number of ways an argument can be
  successfully attacked"* (a multiplicity), and the participant-access stratum is
  substrate-original.
- **The strata definitions.** [`../07_GLOSSARY.md`](../07_GLOSSARY.md) (walked /
  witnessable / latent).
- **The schema (for the §5 encoding claim).**
  [`../../lib/models/schema.prisma`](../../lib/models/schema.prisma) — `ArgumentEdge`,
  `DialogueMove`, `WitnessRecord` (confirm the walked/witnessable/latent predicates
  are readable off these with **no new tables**).
- **The downstream consumer.** [`../01_OPEN_QUESTIONS_REGISTRY.md#q-004`](../01_OPEN_QUESTIONS_REGISTRY.md#q-004)
  — the drainage corollary that §7 claims to supply `κ ∘ proj_des` and `ℓ` for.

---

## 1. The Impossibility Lemma and its corollary (§2) — the technical heart

1. Re-prove the lemma: for `k ≥ 2`, `≤_lex` on `ℕ^k` does not refine `≤_Σ`.
   Confirm the witness `u = (0,…,0,2)`, `v = (1,0,…,0)` gives `u <_lex v` and
   `Σu > Σv`. Check the lemma is stated for **all** coordinate orderings (the
   proof claims symmetry under coordinate permutation — verify the obstruction is
   not specific to "walked leads").
2. Check the **corollary's realizability**: that the substrate genuinely admits an
   expansion with two latent successful attackers and another with one walked
   successful attacker (two ordinary `ArgumentEdge` configurations). If you can
   argue the `(0,0,2)`-profile is *unrealizable* in the substrate (a structural bar
   on simultaneous independent latent successful attackers), the corollary weakens
   and the literal `μ_S♭` might survive — flag this as a defect with the structural
   reason.
3. Confirm the corollary is correctly read as refuting **C003 clause 1 for the
   count reading**, and that the theorem does not overclaim (it does *not* say
   C003 is globally false — it says the *literal encoding* fails *the count
   reading*; the indicator reading is handled separately in §4).

## 2. Clause 1 for `μ_S*` (§3.1)

Verify refinement is immediate because `μ_P` is the leading coordinate of
`μ_S* = (μ_P, w, x)`. Check there is no hidden circularity (we are not assuming
what we prove): the claim is purely that lex-order on a tuple whose first
coordinate is `μ_P` implies `≤` on that first coordinate. Confirm `μ_S*` really is
a bijective re-coordinatisation of `(w,x,ℓ)` (`(μ_P,w,x) = (w+x+ℓ,w,x)`), so it
"carries the full stratum decomposition" as claimed.

## 3. Clause 2 (§3.2, §5)

1. Re-check the worked example arithmetic: `e₁` walked-success ⇒ `μ_S* = (1,1,0)`;
   `e₂` latent-success ⇒ `μ_S* = (1,0,0)`; `μ_P(e₁)=μ_P(e₂)=1`;
   `(1,0,0) <_lex (1,1,0)`. Confirm this is a genuine **Prakken tie** broken by the
   stratification (not a `μ_P`-difference in disguise).
2. Confirm this refutes C003's negative-settlement disjunct ("no `μ_S` satisfying
   clause 1 can satisfy clause 2") — `μ_S*` satisfies both.

## 4. Clause 3 and its scope (§3.3) — the most error-prone clause

1. **Non-monotonicity on the full lattice.** Verify the claim that `μ_P` is *not*
   monotone under arbitrary `⊑` because reinstatement can drop attackers from
   `SA`. Construct (or confirm the theorem could construct) a concrete `e ⊑ e′`
   with `μ_P(e′) < μ_P(e)`. If `μ_P` *were* monotone on the full lattice, the
   scoping to `E↑(F)` would be unnecessary and the theorem is needlessly weak —
   conversely if it is non-monotone, an *unscoped* clause 3 would be false.
2. **The accrual fragment.** Check `E↑(F) = {e ⊑ e′ : SA(e) ⊆ SA(e′)}` is the
   right hypothesis and that the proof uses **LB1** (intrinsic `κ`) to conclude
   `{b ∈ SA(e) : κ(b)=s} ⊆ {b ∈ SA(e′) : κ(b)=s}` per stratum. The load-bearing
   step is that `κ(b)` does not change between `e` and `e′`.
3. **The two-axes reconciliation (§7).** This is the subtlest point. Verify there
   is **no contradiction** between clause 3 (`ℓ` non-decreasing under `⊑` at fixed
   live state `L`) and Q-004 drainage (`ℓ` decreasing as the live state `L_t`
   grows). Confirm the theorem correctly separates the **expansion-space axis**
   (fixed `L`) from the **live-state-evolution axis** (`{B_t}`), and that LB1 is
   what makes `κ` intrinsic on the first axis. If these two are actually the same
   axis, §7's discharge of Q-004's `κ` is unsound — scrutinise hard.

## 5. LB1 and the alternative reading (§8)

1. Confirm LB1 (reachability computed at the fixed live state, not in `F ⊕ e`) is
   stated as a load-bearing assumption, not smuggled.
2. Check the §8 claim that the *reachability-in-expansion* alternative breaks
   clause 3's componentwise form (latent → witnessable promotion), and that the
   proposed restatement (monotone `w + x` union count + total `μ_P`) is correct.
   You do **not** need to endorse LB1 as the "right" reading — only confirm the
   theorem is honest about the dependence and that clauses 1–2 are LB1-independent.

## 6. The §5 encoding claim (no new tables)

Confirm walked/witnessable/latent are each readable off `WitnessRecord` +
`ArgumentEdge` + `DialogueMove` as the theorem states, with **no new tables**.
Specifically: walked ⇔ a `WitnessRecord` binds the attacker's move; latent ⇔ no
record + no reachable locus. Flag any place the encoding silently needs a column
or table that does not exist.

## 7. Verdict

Append a `## Cross-check notes` section to T013 with one of:

- **SIGNED OFF** — all of §§1–6 discharged; T013 → `established`, C003 →
  `partially-resolved` (positive for `μ_S*`, literal `μ_S♭` refuted), Q-003 →
  `partially-resolved` and its `next-action` advances to the Q-004 drainage
  corollary.
- **DEFECTS** — a numbered list, each with location + minimal repair. Distinguish
  **blocking** (kills a clause or the lemma) from **non-blocking** (precision /
  wording). In particular call out: (a) any unrealizability of the §2 corollary
  witness; (b) any failure of the two-axes reconciliation in §7/§4.3; (c) any
  encoding that needs a new table.
