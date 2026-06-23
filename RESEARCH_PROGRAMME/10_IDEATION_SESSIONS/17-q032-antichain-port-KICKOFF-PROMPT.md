# Kickoff Prompt — Q-032 antichain port (Sironi principal sets → the exponential `!`-layer)

> Paste this into a fresh thread to execute the work scoped in
> [`10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md`](10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md).
> This is an **execution** prompt (attempt the proof), not a scoping or research-survey prompt.

---

## Your task in one sentence

Re-establish the [T002](02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md) canonical-generator / antichain result at the `!`-translated (nonlinear, MELL) layer — i.e. show that the **material designs of a `!`-bearing behaviour form a canonical, antichain-like generating set** — by porting **Sironi 2014's principal sets (Def 11)** from the affine fragment, where they are proved, up into the **Terui/Basaldella–Terui (BT2010) nonlinear lineage**, and decide whether the port lands cleanly. This closes (or documents an obstruction to) [Q-032](01_OPEN_QUESTIONS_REGISTRY.md#q-032), the immediate next action of the MALL→MELL upgrade cluster.

## Why this matters (context — do not re-litigate, it is settled)

- The Ambler–Ludics bridge [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md) is **closed on the propositional (MALL) fragment** but open at higher order. The substrate's higher-order need is **real and product-load-bearing**: it is the **argument-chain feature** (chained schemes = scheme composition), confirmed in the [Q-030](01_OPEN_QUESTIONS_REGISTRY.md#q-030) Phase-2 staged decision (2026-06-16).
- [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md)'s generator-level bijection `φ : Inc(B) ↔ 𝒞_base(A, B^♯)` needs a **canonical generating set on the Ludics side**. At the linear layer that set is `Inc(B)` and its canonicity is [T002](02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md). At the `!`-layer **neither BF materiality nor BT2010's nonlinear designs supply it** — the Phase-1 lit review ([`Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) §4 + App C.12) **read BF in full and confirmed: no minimality / antichain / principal-set theorem exists there.** So this port is **net-new, target-independent, and carrier-independent to run**.
- The carrier commit (BF non-uniform strategies vs Terui c-designs) is **deferred behind this very port** — your difficulty readout decides it (see "Carrier-evidence readout" below). Run everything in the BT2010 lineage; that commits nothing.

## Read first (load-bearing inputs)

1. [`10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md`](10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md) — **the full scope**: obligations O0–O5, the single crux O3, the test instance, the carrier-gate rubric (§5). This prompt is its execution.
2. [`02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md`](02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md) — the FQ-side result being ported (Part 1 antichain = order-theoretic; Part 2 cone decomposition = uniqueness-of-incarnation).
3. [`Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md) §4 (Sironi Def 9/11, Prop 3/6/7/10/11, fn 3 affine) + App C.12 (BF has no minimality theorem) — the template and the gap, with verbatim quotes.
4. [`audits/q027-thin-cones-2026-05-29.md`](audits/q027-thin-cones-2026-05-29.md) §1–§2 (the aspirin fact-base Γ, the λ-term enumeration discipline, the Q3 generators `D_{t₁}`, `D_{t₂}`) + [`audits/e2-cardinality-multireinstater-2026-05-31.md`](audits/e2-cardinality-multireinstater-2026-05-31.md) (the `|Inc(B)| = 3` extension pattern) — the propositional anchor your nonlinear instance extends.
5. [`03_CONJECTURES/C001b-prime-ambler-remainder.md`](03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′/b₂′ — what the generating set feeds (b₂′ only needs *distinct generators map to distinct Ambler terms*; a quotient can satisfy this).

## What to produce (the obligations, in attack order)

Work them in this order — the order is chosen so a counterexample, if one exists, surfaces on the worked instance **before** any general proof effort:

- **O0 — pin the minimal higher-order instance.** Construct the smallest extension of the aspirin Γ (q027 §1) with a rule that (a) λ-abstracts over a *derivation* as a premise, and (b) **uses that derivation ≥ 2 times** (so the `!`-image is genuinely nonlinear — a single use stays affine where Sironi already applies). The candidate is a "robustness" meta-rule (`λp. … p … p …`, the `!(muscle_pain → aspirin)` translation). Retain the aspirin fact-base so the propositional `Inc(B)` (`D_{t₁}`, `D_{t₂}`) anchors the comparison. **State the rule, its `!`-type, and the generator λ-term explicitly.**
- **O1 — define `Gen(B)` / materiality in BT2010 nonlinear designs.** Port Sironi Def 9 (incarnation as `⋂` of sub-designs in `B`); confirm BT2010 carries the order `⊑` this needs.
- **O2 — port Sironi Def 11 (principal set) to the nonlinear setting.** State `|E^⊥⊥| = E^𝔝` verbatim in the BT2010 vocabulary.
- **O3 — THE CRUX: re-prove the rigidity step under contraction.** Show distinct material designs are `⊑`-incomparable in the nonlinear setting. The linear proof (FQ Prop 5.2/5.3/5.9, Sironi Prop 2) argues distinct canonical terms **differ on a positive action** — but that is *linear* (each name used once, so a difference can't be absorbed). Under admissible contraction (BT2010 Ex 2.14, Thm 2.15(3)), a repeated action could absorb the difference. **Attack O3 on the O0 instance first.** Classify the outcome:
  - **O-rigid-survives** — rigidity holds directly (e.g. the distinguishing action sits "above" the repeated ones, which repetition cannot absorb). → clean port.
  - **O-rigid-quotient** — holds only up to a repetition-equivalence `∼`; the antichain is on `Gen(B)/∼`. → route (ii); acceptable if `∼`-classes correspond to single Ambler λ-terms (satisfies b₂′).
  - **O-rigid-fails** — exhibit two distinct material designs made `⊑`-comparable by repetition. → route (iii) minimal-repetition-profile, or a documented non-canonical generator. *This is itself a publishable result, not a failure.*
- **O4 — re-prove generation.** `B` recovered from `Gen(B)` via biorthogonal closure / `𝒫_fin` (expected lineage-neutral; not linearity-specific).
- **O5 — consolidated check on the O0 instance.** Compute `Gen(B)`, verify O1–O4, and specifically confirm whether the higher-order generator is `⊑`-incomparable to `D_{t₁}` / `D_{t₂}` once contraction is live.

## Carrier-evidence readout (required, the by-product that resolves the deferred commit)

While proving O3/O4, record the two signals the [session 17 §5](10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md) matrix consumes — this is a **theoretical (proof-side) readout**, measured on the proof, not on any engine code:
- **A** — which O3 route fired (survives / quotient / fails).
- **B (the real discriminator)** — does the rigidity argument **essentially use c-design structure** (named variables, β-reduction, the λ-toolkit), or does it go through on structure BF also has (views, τ-sums)? A proof that *wants* to be a λ-term argument is evidence for a Terui retarget; a lineage-neutral proof is not.
- **C** — did generation (O4) stay lineage-neutral or lean on one side?

Do **not** decide the carrier yourself — just produce A/B/C cleanly. (The matrix also needs the runtime-profile input, which is a separate Q-030 sub-question answered at the gate.)

## Deliverable

A single audit `audits/q032-antichain-port-2026-XX-XX.md` containing: **O0** (the pinned higher-order rule + generator), **O1–O2** (the BT2010-side definitions), the **O3 verdict** (survives / quotient / fails, with the worked O0 instance shown), **O4–O5**, and the **A/B/C carrier-evidence readout**.

- **On success** (O-rigid-survives or a clean O-rigid-quotient): promote to a BT2010-side T002 — create `02_THEOREMS_AND_PROOFS/T0NN-gen-b-antichain.md` (next free T-number) and update [Q-032](01_OPEN_QUESTIONS_REGISTRY.md#q-032) to closed/partially-resolved.
- **On a documented obstruction** (O-rigid-fails): record the route-(iii) / side-data fallback as the result; [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md) then carries the generator presentation as side data at higher order (the runtime contract's already-guarded fallback) — a well-defined-but-not-canonical `!`-layer bridge, which is a real but survivable product outcome.
- **Either way**, update [Q-032](01_OPEN_QUESTIONS_REGISTRY.md#q-032) next-action and the [session 17](10_IDEATION_SESSIONS/17-q032-antichain-port-scoping-2026-06-16.md) status, and note the A/B/C readout against the [Q-030](01_OPEN_QUESTIONS_REGISTRY.md#q-030) carrier-gate sub-decision. Then Phase 4 ([Q-028a stratum-2](01_OPEN_QUESTIONS_REGISTRY.md#q-028a) → [Q-028b](01_OPEN_QUESTIONS_REGISTRY.md#q-028b) MELL extension) is unblocked.

## Discipline (programme conventions)

- **Phase-2-before-Phase-3:** corroborate on the smallest instance (O0/O5) before claiming the general theorem (O3-general), exactly as [T005](02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) and the E2 audit did. A general claim with no worked instance is not `established`.
- **Status honesty:** a paper proof is `provisional (pending cross-check)` until an independent non-author reader signs off; only then `established`. If you mechanise (optional, Agda — the substrate has a corroboration habit; cf. [T002](02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md)'s `--safe` artefact), keep it evidence-only unless it is constitutive.
- **Don't soften a negative.** O-rigid-fails is a legitimate, valuable outcome — document the counterexample precisely; do not massage it into a false positive.
- **Quote, don't paraphrase, the load-bearing source statements** (Sironi Def 9/11, Prop 2/6; BT2010 Ex 2.14 / Thm 2.15(3) for admissible contraction) with their numbers.
- No unrelated refactors; touch only the audit, the new theorem file (on success), and the registry/session-status updates named above.

## First concrete step

Pin **O0** — write the minimal "use-twice" higher-order aspirin rule, its `!`-type, and the generator λ-term — then immediately run **O3 on that instance** (is the higher-order generator `⊑`-incomparable to `D_{t₁}` / `D_{t₂}` once the abstracted derivation is used twice?). That single computation is the fastest signal for the entire question and the carrier choice.
