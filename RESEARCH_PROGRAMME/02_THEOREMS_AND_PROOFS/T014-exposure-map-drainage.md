# T014 — Exposure-map drainage: along an accrual update sequence the latent stratum of the joint saturation is monotone-decreasing (the C004 drainage corollary)

- **status:** established (author-side draft 2026-06-24; **independent cross-check signed off 2026-06-24** — see [T014 verification prompt](T014-verification-prompt.md) and `## Cross-check notes` below). Settles the **drainage corollary** of [C004](../03_CONJECTURES/C004-joint-saturation-closure.md) (the second sentence of its Statement) — the remaining unproven front (b) of [Q-004](../01_OPEN_QUESTIONS_REGISTRY.md#q-004) — for the **accrual fragment** (witness-monotone, no retraction) over a **fixed behaviour frontier**.
- **partially-resolves:** [Q-004](../01_OPEN_QUESTIONS_REGISTRY.md#q-004) front (b) (drainage). Front (a) — discharging the forward-closure operator `Reach` itself — remains open and rides on [Q-002](../01_OPEN_QUESTIONS_REGISTRY.md#q-002) (participation-closure semantics); this theorem takes `Reach` as a closure operator (hypothesis), exactly as the C004 mechanisation does.
- **depends-on:** [T013](T013-exposure-map-stratified-strength.md) (supplies the exposure map `κ` on moves/designs and the walked/witnessable/latent strata; T013 §7 anticipated this theorem as the *live-state-growth axis* dual of its clause 3); the C004 closure-operator mechanisation ([`../mechanisation/agda/C004/C004.agda`](../mechanisation/agda/C004/C004.agda)) for the `σ_joint` / `Reach` / `moves` setting.
- **proved-by:** drafted 2026-06-24 (continuation of the Q-003 → Q-004 thread; the Q-003 settlement T013 unblocked this).
- **cross-checked-by:** independent non-author reader (2026-06-24; SIGNED OFF against the [verification prompt](T014-verification-prompt.md) — all of §§1–6 discharged, Agda re-built `--safe --without-K` from a cleared cache, order theory re-derived from scratch; no blocking or non-blocking defects; see `## Cross-check notes`)
- **cross-check-date:** 2026-06-24
- **last-reviewed:** 2026-06-24
- **source-of-proof:** this file (paper proof, §3); the constructive core is **mechanised** as corroboration.
- **corroborating-mechanisation:** [`../mechanisation/agda/C004/C004.agda`](../mechanisation/agda/C004/C004.agda)
  §3.2 (`Latent`, `drainage`, `walked-not-latent`, `promoted-drains`) — Agda
  2.7.0.1, agda-stdlib v2.0, `--safe --without-K`, **no postulates / no holes**.
  Evidence-only (it inherits the `ForwardClosure` record of hypotheses for
  `Reach`, like the closure-operator half). Build: `agda C004/C004.agda` from
  [`../mechanisation/agda`](../mechanisation/agda).

> Methodology note. C004's drainage sentence — *"the cardinality of the `latent`
> stratum of `κ ∘ proj_des ∘ σ_joint(x)` is monotone-decreasing along the
> deliberation's update sequence"* — was the one piece of C004 **not** touched by
> the closure-operator mechanisation. The load-bearing content turns out to be a
> short order-theoretic fact (the complement-within-a-fixed-set of a monotone
> operator's image is antitone), but getting there requires pinning down three
> things the loose composition notation leaves implicit: (i) the **universe** the
> latent stratum lives in (the *fixed* behaviour frontier `B`, per the glossary —
> not the *growing* saturation `S_t`, on which the claim is false); (ii) the
> **accrual** hypothesis (no retraction — §0c.3 of the source doc shows retraction
> re-assigns `walked → latent`, which would reverse drainage); (iii) that drainage
> is the **W-axis** (witness growth) dual of T013's **D-axis** (Proponent-seed
> growth) monotonicity, so the two never contradict.

---

## 1. Vocabulary and setup

Carry the C004 / [`LUDICS_OPEN_COMPOSITION_JOINT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)
§0e.1 setting and the T013 exposure map.

- **Moves and witnesses.** A move-universe `Move` and a witness-record set type.
  `moves : 𝒫(Wit) → 𝒫(Move)` is the `ι`-binding extraction (monotone): `moves W`
  is the set of moves **walked** under the witness-record set `W`.
- **Forward closure.** `Reach : 𝒫(Move) → 𝒫(Move)` is the protocol's forward-
  closure operator — a closure operator (extensive, monotone, idempotent), taken
  as the `ForwardClosure` hypothesis of C004 (front (a), open, rides on Q-002).
- **Joint saturation** (§0e.1): `σ_joint(D_P, W) = Reach(D_P ∪ moves W)`, with
  `proj_des(σ_joint(D_P, W)) = Reach(D_P ∪ moves W)` its design component.
- **The exposure map** (T013 §1.2, glossary). Computed against the live state
  `(D_P, W)`. A move `m` is
  - **walked** iff `m ∈ moves W` (a witness record binds it);
  - **witnessable** iff `m ∉ moves W` but `m ∈ Reach(moves W)` (reachable from a
    walked locus);
  - **latent** iff `m ∉ Reach(moves W)` (reachable by no current participant).

  **LB2 (union reachability).** "Reachable by some participant" is taken to be
  `Reach(moves W)` — the forward closure of the *union* of all walked loci. This
  folds the per-participant quantifier ("a participant holding ≥ 1 binding") into a
  single closure; it is the participant-agnostic cut that the latent/non-latent
  boundary needs. The finer per-participant substratification of the *witnessable*
  band does not affect the latent stratum (latent is the complement of
  reachable-from-*any*-walked-locus) and is left to a refinement. §5 records this.

- **The behaviour frontier (the universe).** Per the glossary, *latent* means
  *"the move exists in the behaviour but is reachable by no current participant"* —
  so the universe is the **behaviour** `B ⊆ Move`, a **fixed** finite set (e.g. the
  mature saturation `S_* = proj_des(σ_joint(D_*, W_*))` at the deliberation's
  fixpoint, or any fixed frontier containing every `S_t`). The latent stratum is

  $$\Lambda(B, W) \;:=\; \{\, m \in B : m \notin \mathrm{Reach}(\mathrm{moves}\,W) \,\}.$$

- **The update sequence.** A deliberation's evolution is a chain of live states
  `x_0 ⊑ x_1 ⊑ ⋯`, `x_t = (D_t, W_t)`. The **accrual fragment** is the sub-chain on
  which the witness component only grows: `W_t ⊆ W_{t+1}` (witness records are
  append-only — `WitnessRecord` rows are never deleted, only `fossilizedAt`-marked).
  Write `Λ_t := Λ(B, W_t)`.

---

## 2. Statement

**Theorem (drainage).** Fix a behaviour frontier `B`. Along any accrual update
sequence `(x_t)` (so `W_t ⊆ W_{t+1}`):

1. **Monotone drainage (the constructive core).** `Λ_{t+1} ⊆ Λ_t`. Hence, for
   finite `B`, `|Λ_{t+1}| ≤ |Λ_t|` — the latent-stratum **cardinality is
   monotone non-increasing** along the update sequence (C004's claim).
2. **Stratum disjointness.** No walked move is latent: `moves W_t ∩ Λ_t = ∅`.
3. **Strictness / fixpoint.** `|Λ_{t+1}| < |Λ_t|` iff some frontier move is
   **promoted** at step `t` — i.e. `∃ m ∈ B` with `m ∉ Reach(moves W_t)` and
   `m ∈ Reach(moves W_{t+1})` (a previously-latent move newly reached). When the
   witness component is stationary (`W_{t+1} = W_t`, hence `moves` and `Reach`
   unchanged), `Λ_{t+1} = Λ_t`. The limit `Λ_∞ = B ∖ Reach(moves W_∞)` is the
   **residual latent stratum** — frontier moves reachable only via the Proponent
   seed, never witnessed (the deliberation's *unwalked residue*).

---

## 3. Proof

### 3.1 Clause 1 — monotone drainage

Let `W_t ⊆ W_{t+1}`. Then:
- `moves W_t ⊆ moves W_{t+1}` (`moves` monotone), so
- `Reach(moves W_t) ⊆ Reach(moves W_{t+1})` (`Reach` monotone).

Take `m ∈ Λ_{t+1}`, i.e. `m ∈ B` and `m ∉ Reach(moves W_{t+1})`. From the inclusion
above, `m ∈ Reach(moves W_t) ⇒ m ∈ Reach(moves W_{t+1})`; contraposing,
`m ∉ Reach(moves W_{t+1}) ⇒ m ∉ Reach(moves W_t)`. So `m ∈ B` and
`m ∉ Reach(moves W_t)`, i.e. `m ∈ Λ_t`. Hence `Λ_{t+1} ⊆ Λ_t`. ∎

The cardinality statement `|Λ_{t+1}| ≤ |Λ_t|` is the standard
`A ⊆ B ⇒ |A| ≤ |B|` for finite `B` (the latent strata are subsets of the finite
frontier). The `⊆`-antitone core is mechanised as `drainage` in
[`C004.agda §3.2`](../mechanisation/agda/C004/C004.agda); it is exactly the
contraposition above, requiring only `reach-mono` and `moves-mono`.

### 3.2 Clause 2 — stratum disjointness

If `m ∈ moves W_t` then `m ∈ Reach(moves W_t)` by extensivity of `Reach`, so `m`
fails the latent condition `m ∉ Reach(moves W_t)`; hence `m ∉ Λ_t`. Mechanised as
`walked-not-latent`. ∎

### 3.3 Clause 3 — strictness and fixpoint

If `m` is promoted at step `t` (`m ∈ B`, `m ∉ Reach(moves W_t)`,
`m ∈ Reach(moves W_{t+1})`), then `m ∈ Λ_t ∖ Λ_{t+1}`; with `Λ_{t+1} ⊆ Λ_t`
(clause 1) and `B` finite, `|Λ_{t+1}| < |Λ_t|`. The promoted move leaving the
stratum is mechanised as `promoted-drains`. Conversely if no move is promoted then
`Reach(moves W_{t+1}) ∩ B = Reach(moves W_t) ∩ B`, so `Λ_{t+1} = Λ_t`. When
`W_{t+1} = W_t` the operators are unchanged and `Λ_{t+1} = Λ_t` trivially. ∎

---

## 4. The two axes — why drainage and T013 clause 3 never collide

The latent stratum's cardinality moves under **two independent variables**, and
their monotonicities have **opposite sign**. This is the subtlety T013 §7 flagged.

| axis | what grows | what is held fixed | latent stratum | result |
|---|---|---|---|---|
| **D-axis** (T013 cl. 3) | the Proponent seed / successful-attack set, at **fixed** live state `L` | the witness state `W` (so `κ` fixed) | **non-decreasing** | adding (unwitnessed) attackers can only *add* latent moves |
| **W-axis** (T014, here) | the witness/walked set `W_t` | the behaviour frontier `B` | **non-increasing** | walking moves drains the latent stratum |

These are not in tension because they vary *different* arguments of
`Λ(B, W)`. T013 clause 3 fixes `W` (hence `κ`) and grows the seed — `κ` is
*intrinsic* (LB1), so latent counts can only rise as more moves enter. T014 fixes
`B` and grows `W` — `κ` itself evolves, promoting `latent → witnessable → walked`,
so latent counts fall. **Deliberative progress is the W-axis dominating the
D-axis:** a deliberation makes progress precisely when witnessing (walking moves)
outpaces the introduction of unwitnessed Proponent structure. The literal
*growing-universe* reading (classify the **growing** `S_t = proj_des σ_joint(x_t)`
rather than the fixed `B`) conflates the two axes and is **not** monotone —
"argument-dumping" (the Proponent posting many unwitnessed arguments) inflates the
latent count even as witnessing proceeds. Fixing the universe to the behaviour `B`
(the glossary's reading) is what isolates the W-axis and makes drainage a theorem.

---

## 5. Scope and load-bearing assumptions

- **Accrual (no retraction).** Drainage holds on the witness-monotone fragment
  `W_t ⊆ W_{t+1}`. Retraction breaks it: §0c.3 of
  [`LUDICS_OPEN_COMPOSITION_JOINT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)
  notes a move *"walked in `E_w(B_t)` can become latent in `E_ℓ(B_{t'})` if the
  locus it answered has been retracted"* — a `walked → latent` reassignment that
  *raises* the latent count. The accrual fragment is the substrate-faithful one for
  *progress* (the append-only `WitnessRecord` log; the fossil-record read keeps
  retracted moves as historical facts, so the *walked* count of record never
  falls). On the full retraction-permitting dynamics, drainage is replaced by the
  weaker statement that the latent count is non-increasing *between* retraction
  events. This mirrors T013's accrual-fragment scoping of clause 3.
- **Fixed frontier `B` (glossary universe).** Drainage is a statement about the
  latent stratum *within the behaviour* `B`, held fixed. On the `t`-varying
  saturation `S_t` it is false (§4). `B` is finite (so cardinality is defined);
  the `⊆`-antitone core (clause 1) needs no finiteness.
- **LB2 (union reachability).** "Reachable by a participant" `= Reach(moves W)`
  (forward closure of the union of walked loci). The latent stratum is the
  complement of this, so it is insensitive to the per-participant refinement of the
  *witnessable* band; clauses 1–3 are LB2-robust at the latent boundary.
- **`Reach` is hypothesised, not constructed.** Like the C004 closure mechanisation,
  this theorem takes `Reach` as a closure operator. Constructing the substrate's
  actual `Reach` (front (a)) rides on Q-002 (participation-closure semantics) and is
  **not** discharged here.

---

## 6. What this settles for Q-004 / C004

- **C004 drainage corollary — settled (cross-check signed off 2026-06-24).** The
  second sentence of C004's Statement is proved on the accrual fragment over a
  fixed frontier, with the constructive core mechanised. Combined with the
  already-mechanised closure-operator + Galois half, the only residual content of
  C004 is the construction of `Reach` itself (front (a)).
- **Q-004 front (b) — discharged.** The drainage corollary that was
  *"currently untouched"* (Q-004 next-action) now has a paper proof + mechanised
  core. The `κ ∘ proj_des` stratum map it quantifies over was supplied by
  [T013 §7](T013-exposure-map-stratified-strength.md); this theorem supplies the
  monotone-decrease of its latent cardinality.
- **Q-004 front (a) — still open.** Discharging `Reach` (the forward-closure
  operator) rides on [Q-002](../01_OPEN_QUESTIONS_REGISTRY.md#q-002). Until then
  both the closure-operator half and this drainage half are *conditional on `Reach`
  being a closure operator* — visible in the types as the `ForwardClosure` record.

---

## 7. Mechanisation

[`C004.agda §3.2`](../mechanisation/agda/C004/C004.agda) adds, inside the
`JointSaturation` module (so it shares `Reach`, `moves`, `moves-mono`):

- `ReachWalked W = Reach (moves W)` — the non-latent predicate (`σ_joint`'s reach
  of the witness seed).
- `Latent B W m = (m ∈ B) × (m ∈ ReachWalked W → ⊥)` — the latent stratum within a
  fixed frontier `B`.
- `walked-not-latent` — clause 2 (a walked move is never latent), from `reach-ext`.
- `drainage : W ⊆ W′ → Latent B W′ ⊆ Latent B W` — clause 1's `⊆`-antitone core,
  from `reach-mono ∘ moves-mono` by contraposition.
- `promoted-drains` — clause 3's strictness witness (a promoted move is latent
  before, not after).

Type-checks `--safe --without-K`, no postulates/holes (the `Reach` closure
structure is the inherited `ForwardClosure` *record* of hypotheses, not a
`postulate`). **Evidence-only** under the register policy: it corroborates the
order theory but does not construct `Reach`. The cardinality decrease (clause 1's
`|·|` form) and strictness counting are argued on paper (§3); the Agda carries the
`⊆`-antitone content, which is the load-bearing part.

## Cross-check notes

**SIGNED OFF — 2026-06-24 (independent non-author reader).** Verdict against the
[T014 verification prompt](T014-verification-prompt.md): all obligations of §§1–6
discharged. The `--safe --without-K` Agda was rebuilt from a cleared cache (full
recheck, not an interface hit); the order theory of all three clauses was
re-derived independently; every load-bearing modelling decision (the universe
choice, the accrual scope, LB2, the `Reach` hypothesis) was checked against the
source documents, not trusted from the proof's own summaries. **No blocking
defects; no non-blocking defects requiring repair.** Two clarifying observations
(neither a defect) are recorded at the end. Detail by prompt section:

**§1 — Build the mechanisation.** From `../mechanisation/agda`,
`agda --safe --without-K C004/C004.agda` type-checks cleanly after deleting the
cached `.agdai` (the build log shows `Checking C004.C004 …`, i.e. a genuine
recheck). No postulates (the only `postulate` token in the file is a comment
asserting the *absence* of postulates) and no holes (`{! !}` / `?`). `Reach`'s
closure structure enters **only** as the `ForwardClosure` *record* fields
(`reach-ext` / `reach-mono` / `reach-idem`), a hypothesis, never an Agda
`postulate`. Each §3.2 lemma matches its paper clause with no hidden extra
hypothesis and no weakened conclusion:
- `drainage : W ⊆ W′ → Latent B W′ ⊆ Latent B W` = clause 1's `⊆`-antitone core,
  discharged as `λ reachW → ¬reachW′ (reach-mono (moves-mono W⊆W′) reachW)` — the
  exact contraposition through `reach-mono ∘ moves-mono`, using **neither**
  `reach-ext` nor `reach-idem`. ✓
- `walked-not-latent` = clause 2, via `reach-ext {moves W}`. ✓
- `promoted-drains` = clause 3's strictness witness: a move latent at `W` and
  reached at `W′` is returned as `(m ∈ Latent B W) × (m ∈ Latent B W′ → ⊥)`, i.e.
  it inhabits `Λ_t ∖ Λ_{t+1}`. ✓
- `Latent B W m = (m ∈ B) × (m ∈ Reach (moves W) → ⊥)` is literally
  `Λ(B,W) = {m ∈ B : m ∉ Reach(moves W)}`. ✓

**§2 — Clause 1 (monotone drainage).** Re-derived: `W_t ⊆ W_{t+1}`
`⟹ moves W_t ⊆ moves W_{t+1}` (`moves-mono`) `⟹ Reach(moves W_t) ⊆ Reach(moves W_{t+1})`
(`reach-mono`); contraposing the latter inclusion at `m` and conjoining the
unchanged `m ∈ B` gives `Λ_{t+1} ⊆ Λ_t`. Confirmed **no** appeal to idempotence or
extensivity and **no** finiteness in the `⊆` core. The `|Λ_{t+1}| ≤ |Λ_t|` step is
the standard finite `A ⊆ B ⇒ |A| ≤ |B|` with `B` finite by hypothesis; correctly
left to paper (the README's §"What this cannot check" discloses this). ✓

**§3 — Clauses 2 and 3.**
- Clause 2 (`moves W_t ∩ Λ_t = ∅`) is immediate from extensivity
  (`m ∈ moves W ⟹ m ∈ Reach(moves W)`), contradicting the latent condition. ✓
- Clause 3 strictness: a promoted `m` sits in `Λ_t ∖ Λ_{t+1}` with `Λ_{t+1} ⊆ Λ_t`
  and `B` finite, so `|Λ_{t+1}| < |Λ_t|`. The converse ("no promotion ⇒ equality")
  is sound: *no promotion* means `∀ m ∈ B, m ∈ Reach(moves W_{t+1}) ⇒ m ∈ Reach(moves W_t)`,
  which with accrual monotonicity (`⊆` the other way) gives
  `Reach(moves W_{t+1}) ∩ B = Reach(moves W_t) ∩ B`, hence equal complements within
  `B`, i.e. `Λ_{t+1} = Λ_t`. The stationary case `W_{t+1} = W_t` is the trivial
  specialisation. ✓

**§4 — The universe choice (the load-bearing modelling decision).**
- *Universe is the fixed `B`, matching the glossary.* `Latent` quantifies `m ∈ B`
  with `B` a fixed frontier, exactly the glossary's *"the move exists in the
  behaviour but is reachable by no current participant"* — not the growing
  `S_t = proj_des σ_joint(x_t)`. ✓
- *Growing-universe non-monotonicity confirmed by my own instance — adversarial
  item (a) cleared.* Take a step that holds `W` fixed (`W_{t+1} = W_t`) and grows
  the Proponent seed `D_t ⊊ D_{t+1}` by one unwitnessed move
  `m^\* ∈ D_{t+1}` with `m^\* ∉ Reach(moves W_t)` (a posted argument no witness
  binds and no walked locus reaches). Then `Reach(moves W_t)` is unchanged, but
  `m^\* ∈ S_{t+1} = Reach(D_{t+1} ∪ moves W_t)` while `m^\* ∉ S_t`, so on the
  **growing-universe** reading `m^\*` is a *new* latent element:
  `|{m ∈ S_{t+1} : latent}| > |{m ∈ S_t : latent}|` with `W` unchanged. This is
  literally "argument-dumping". So the growing-universe reading is **not**
  monotone, and the fixed-`B` framing is a **necessary** restriction, not an
  unnecessary weakening. (On the fixed-`B` reading the same step leaves
  `Reach(moves W)` and `B` fixed, so `Λ` is unchanged — clause 1's stationary
  case — exactly as it should be.) ✓
- *Two-axes table correct — reconciliation delivered.* Re-checked against
  [T013 §7](T013-exposure-map-stratified-strength.md): T013 clause 3 grows the
  expansion/seed at **fixed** live state (`κ` intrinsic via LB1) and gives `ℓ`
  **non-decreasing**; T014 grows `W` at **fixed** `B` and gives `Λ`
  **non-increasing**. Opposite sign, *different argument* of `Λ(B, W)`, so no
  contradiction. This is precisely the dual T013 §7 anticipated; T014 §4 supplies
  it. ✓

**§5 — The accrual scope (retraction genuinely fatal).**
- *Accrual is necessary.* Source §0c.3 states a move "walked in `E_w(B_t)` can
  become latent in `E_ℓ(B_{t′})` if the locus it answered has been retracted",
  and §0e.2 (J2) states `σ_joint` is monotone in `Witness` — *"Removing one
  shrinks it"*. So a retraction shrinks `moves W`, shrinks `Reach(moves W)`, and
  **raises** the latent count within `B`, breaking clause 1's `Λ_{t+1} ⊆ Λ_t`. The
  `W_t ⊆ W_{t+1}` hypothesis is therefore load-bearing, not cosmetic. ✓
- *Append-only `WitnessRecord` is the substrate-faithful home for progress.* §0c.3's
  fossil-record read keeps the walked move as a historical fact even after the
  answered locus moves; on that append-only log `moves W` never falls, so the
  accrual fragment is exactly where *progress* lives. T014 does not overclaim:
  §5 explicitly downgrades the full retraction-permitting dynamics to "latent count
  non-increasing *between* retraction events". ✓ (See clarifying note (i).)

**§6 — LB2 and the `Reach` hypothesis.**
- *LB2 stated as load-bearing and faithful.* §1/§5 record LB2 (reachable-by-a-
  participant `= Reach(moves W)`, the closure of the *union* of walked loci). This
  is **exactly** the second term of `σ_joint` as defined in source §0e.1
  (`Reach({m ∣ ∃ w ∈ Witness, w.m = m})` — a single closure over the union of all
  participants' bindings). So for the σ_joint drainage corollary LB2 is not an
  arbitrary cut: it is what σ_joint computes. The latent stratum is the complement
  of this union closure within `B`, hence insensitive to any internal
  per-participant refinement of the *witnessable* band. ✓ (See clarifying note (ii).)
- *`Reach` hypothesised, conditional status correctly recorded.* `Reach` is the
  `ForwardClosure` record, never constructed; `drainage` is a function of that
  record plus `moves-mono`. T014's metadata and §6 record that front (a) (the
  `Reach` construction, riding on Q-002) stays open, and that T014
  **partially-resolves** Q-004 front (b) only — it is *not* read as closing Q-004
  outright. ✓ The `Model` instance (`Reach = id`) is a non-vacuity witness, not a
  construction of the substrate `Reach`.

**Clarifying observations (not defects, no repair required).**
- *(i) Two readings of `W`.* Drainage is stated on the append-only fossil log,
  where `moves W` is monotone; source §0c.3's `walked → latent` reassignment lives
  in the *current dialectical layer*, a different (retraction-permitting) reading.
  T014 §5 already separates these and scopes drainage to the fossil/accrual
  fragment, so this is a correctly-handled modelling choice rather than an
  ambiguity — recorded here only to make the two `W`s explicit for future readers.
- *(ii) LB2 vs. the glossary's per-participant phrasing.* The glossary phrases
  *witnessable*/*latent* per participant ("reachable … by a participant holding
  ≥ 1 binding"); LB2 uses the union closure `Reach(moves W)`. Because `Reach` is a
  monotone closure, union-reachability can in principle exceed
  `⋃_p Reach(moves W_p)`, so a *strict* per-participant latent reading could be a
  (finer) superset of the LB2 latent stratum. This is **not** a defect: the
  drainage corollary is a statement about **`σ_joint`**, whose definition (§0e.1)
  is union-based, so LB2 is the faithful reading for this theorem; the finer
  per-participant stratum is a different object that T014 legitimately defers to a
  refinement (§5). Worth flagging only so the union-vs-per-participant distinction
  is on record.

**Net.** T014 → `established`. The C004 drainage corollary (second sentence of its
Statement) is **settled** — the closure-operator + Galois half was already
mechanised, and the drainage half is now proven on paper with its `⊆`-antitone
core mechanised; the only residual C004 content is front (a), the construction of
`Reach`. [Q-004](../01_OPEN_QUESTIONS_REGISTRY.md#q-004) **front (b) is
discharged**; front (a) remains open and rides on
[Q-002](../01_OPEN_QUESTIONS_REGISTRY.md#q-002).

## Bibliography

- [C004](../03_CONJECTURES/C004-joint-saturation-closure.md) (the conjecture; the
  closure-operator + Galois half and its mechanisation).
- [T013](T013-exposure-map-stratified-strength.md) (the exposure map `κ`; §7's
  two-axes anticipation of this theorem).
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OPEN_COMPOSITION_JOINT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)
  §0c.3 (strata reassign under retraction — the accrual-scope justification), §0e.1
  (the `σ_joint` definition).
- [`../07_GLOSSARY.md`](../07_GLOSSARY.md) (walked / witnessable / latent; the
  behaviour-as-universe reading of *latent*).
- [`../mechanisation/agda/C004/C004.agda`](../mechanisation/agda/C004/C004.agda)
  §3.2 (the mechanised drainage core).
- Davey & Priestley 2002, *Introduction to Lattices and Order* (closure operators;
  monotone-image complements).
