# C004 — Joint saturation `σ_joint(D_P, W)` is a closure operator on the product poset of design-sets and witness-record sets

- **status:** partially-resolved (closure-operator + Galois half mechanised **evidence-only** 2026-06-01; **drainage corollary settled 2026-06-24** as [T014](../02_THEOREMS_AND_PROOFS/T014-exposure-map-drainage.md), `established` — independent cross-check signed off 2026-06-24, no defects). The only residual content is the construction of the forward-closure operator `Reach` itself (Q-004 front (a), rides on [Q-002](../01_OPEN_QUESTIONS_REGISTRY.md#q-002)).
- **ring:** core
- **depends-on:** C002, C003
- **linked-open-questions:** Q-004
- **last-reviewed:** 2026-06-24 (drainage corollary settled; see §Resolution)
- **corroborating-mechanisation:** [`../mechanisation/agda/C004/C004.agda`](../mechanisation/agda/C004/C004.agda) (Agda 2.7.0.1, agda-stdlib v2.0; `--safe --without-K`, no postulates/holes; evidence-only — see §Corroborating mechanisation)
- **build-instructions:** [`../mechanisation/agda/C004/README.md`](../mechanisation/agda/C004/README.md)

## Statement

Let `P := (P_{des}, ⊆) × (P_{wit}, ⊆)` be the product of the powerset poset
on design-sets and the powerset poset on witness-record sets, ordered
componentwise. Let `σ_joint : P → P` be the joint-saturation operator
defined in
[`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OPEN_COMPOSITION_JOINT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md).
Then `σ_joint` is a closure operator: extensive
(`x ≤ σ_joint(x)`), monotone (`x ≤ y ⇒ σ_joint(x) ≤ σ_joint(y)`),
idempotent (`σ_joint(σ_joint(x)) = σ_joint(x)`).

Moreover, **deliberative progress** is exposure-map drainage: the cardinality
of the `latent` stratum of `κ ∘ proj_des ∘ σ_joint(x)` is monotone-decreasing
along the deliberation's update sequence.

## Positive settlement

A proof of the three closure axioms plus the drainage corollary. The proof
should yield, as a side-effect, a Galois connection
`(σ_joint, restrict)` between the live-deliberation poset and the saturated
poset.

## Negative settlement

A finite counterexample to idempotence: a `(D_P, W) ∈ P` with
`σ_joint(σ_joint(D_P, W)) ≠ σ_joint(D_P, W)`. (Extensivity is easy by
construction; monotonicity is unlikely to fail; idempotence is the load
test.)

## Corroborating mechanisation

[`../mechanisation/agda/C004/C004.agda`](../mechanisation/agda/C004/C004.agda)
type-checks (Agda 2.7.0.1, agda-stdlib v2.0, `--safe --without-K`) with no
postulates and no holes. It mechanises the **closure-operator + Galois
half** of C004, with the protocol's forward-closure operator `Reach`
supplied as a hypothesis:

- **The three closure axioms hold.** With `σ_joint(D, W) = (Reach(D ∪
  moves W), W)` on the componentwise product poset, `JointSaturation`
  proves `σ-ext` (extensive), `σ-mono` (monotone) and `σ-idem`
  (idempotent). The load-bearing idempotence step is mechanised exactly as
  the prose argues: the second pass re-adds `moves W`, but `moves W ⊆ U ⊆
  Reach U` already, so the seed collapses and `Reach`'s own idempotence
  finishes.

- **The Galois corollary follows.** `Saturated x = σ x ≈ x` defines the
  closed elements; `σ-saturated`, `σ-below` (`Saturated c → x ⊑ c → σ x ⊑
  c`) and `below-σ` give the `(σ_joint, restrict)` insertion the
  statement's *Positive settlement* asks for as a side-effect.

- **`Reach` is a record, not a postulate.** The forward-closure operator
  (the C002/C003 dependency) enters as a `ForwardClosure` *record* whose
  extensive/monotone/idempotent fields are hypotheses — **not** Agda
  `postulate`s — so the file stays `--safe` while keeping the dependency
  visible in the types. `Model` discharges that record on `Reach = id`
  with an arbitrary monotone `moves`, so the development is non-vacuous.

Under the Register policy this is **evidence-only** and the closure-operator
half's `status` stays mechanised-evidence-only: the artefact shows the
closure/Galois claims *reduce to* `Reach` being a closure operator, but does
not settle that `Reach` construction (asserted via the record, a human-review
obligation recorded in [`../mechanisation/agda/C004/README.md`](../mechanisation/agda/C004/README.md)
§"What this cannot check").

## Resolution of the drainage corollary (2026-06-24, [T014](../02_THEOREMS_AND_PROOFS/T014-exposure-map-drainage.md), `established`)

The **drainage corollary** (the second sentence of §Statement — latent-stratum
cardinality decrease along the update sequence) is now **proven and cross-checked**
(independent non-author sign-off 2026-06-24, all of §§1–6 discharged, no defects),
with its constructive core **mechanised** in [`C004.agda §3.2`](../mechanisation/agda/C004/C004.agda)
(`Latent`, `drainage`, `walked-not-latent`, `promoted-drains`; `--safe
--without-K`, no postulates/holes). Statement and scope:

- The latent stratum lives in a **fixed behaviour frontier** `B` (the glossary's
  *"exists in the behaviour"* reading), as `Λ(B, W) = {m ∈ B : m ∉ Reach(moves W)}`.
- Along an **accrual** update sequence (`W_t ⊆ W_{t+1}`, no retraction), `Λ` is
  `⊆`-decreasing, hence `|Λ_{t+1}| ≤ |Λ_t|` (cardinality monotone non-increasing),
  with strictness exactly at promotion steps (a latent move newly reaches), and a
  residual latent stratum `Λ_∞ = B ∖ Reach(moves W_∞)` (the *unwalked residue*).
- This is the **W-axis** (witness-growth) dual of [T013](../02_THEOREMS_AND_PROOFS/T013-exposure-map-stratified-strength.md)
  clause 3's **D-axis** (Proponent-seed-growth) monotonicity — opposite sign,
  different variable, so no contradiction (T014 §4). The `κ ∘ proj_des` stratum
  map this quantifies over was supplied by T013 §7.
- **Honest scope:** retraction breaks drainage (source §0c.3, `walked → latent`
  reassignment), so the result is scoped to the append-only accrual fragment; and
  the *growing-universe* reading (classify the growing `S_t` rather than the fixed
  `B`) is **non-monotone** (argument-dumping), so the universe is fixed at `B`.

The drainage corollary is **established** ([T014 cross-check](../02_THEOREMS_AND_PROOFS/T014-verification-prompt.md)
signed off 2026-06-24). With drainage settled, **C004's only residual content is front (a)** —
constructing `Reach` (rides on Q-002).

## Bibliography

- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OPEN_COMPOSITION_JOINT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_1.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §2 (C20)
- Fouqueré & Quatrini 2018, *Visitable paths and saturation*, LMCS 14(2).
