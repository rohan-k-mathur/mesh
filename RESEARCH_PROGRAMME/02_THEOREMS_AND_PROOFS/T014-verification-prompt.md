# Verification prompt — fully cross-check T014 (exposure-map drainage, the C004 drainage corollary)

> **Role.** You are an independent second reader. You did **not** author T014.
> Either (a) sign off as *established*, or (b) return a numbered list of
> substantive defects, each with location + minimal repair. Default to skepticism:
> a clean sign-off requires *every* obligation below discharged. Re-derive the
> order theory yourself; re-check the Agda by building it.
>
> **Target.** [`T014-exposure-map-drainage.md`](T014-exposure-map-drainage.md) —
> the claim that, along an **accrual** update sequence (`W_t ⊆ W_{t+1}`), the
> latent stratum `Λ(B, W_t) = {m ∈ B : m ∉ Reach(moves W_t)}` within a **fixed**
> behaviour frontier `B` is `⊆`-decreasing (`Λ_{t+1} ⊆ Λ_t`), hence its cardinality
> is monotone non-increasing — C004's drainage corollary — with stratum
> disjointness and a strictness/fixpoint characterisation.
>
> **Scope reminder — what T014 is NOT.** It does **not** construct the
> forward-closure operator `Reach` (that is Q-004 front (a), riding on
> [Q-002](../01_OPEN_QUESTIONS_REGISTRY.md#q-002)); it takes `Reach` as a closure
> operator, exactly as the C004 closure mechanisation does. It does **not** claim
> drainage on the *growing* saturation `S_t` (it claims the opposite — §4). A
> sign-off is conditional on `Reach` being a closure operator and must flag any
> step that silently constructs or over-uses it.
>
> **Programme rules.** Read [`README.md`](README.md) first. A theorem must be (1)
> formally stated, (2) human-checkable in one sitting, (3) cross-checked by a
> non-author, (4) tied to the open-question entry it updates. The Agda is
> **evidence, not proof** — a clean `--safe` build corroborates the `⊆`-antitone
> core but does not by itself settle the paper claims (cardinality, strictness,
> scope). Record your verdict in a `## Cross-check notes` section appended to T014.

---

## 0. Source materials (do not work from T014 alone)

- **The theorem.** [`T014-exposure-map-drainage.md`](T014-exposure-map-drainage.md)
- **The conjecture.** [`../03_CONJECTURES/C004-joint-saturation-closure.md`](../03_CONJECTURES/C004-joint-saturation-closure.md)
  — the drainage sentence (second sentence of §Statement) and the
  closure-operator + Galois half already mechanised.
- **The exposure map it depends on.** [`T013-exposure-map-stratified-strength.md`](T013-exposure-map-stratified-strength.md)
  §1.2 (κ, the strata) and §7 (the two-axes anticipation).
- **The source dynamics.** [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OPEN_COMPOSITION_JOINT.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)
  §0e.1 (the `σ_joint` definition) and **§0c.3** (strata reassign under retraction
  — the accrual-scope justification).
- **The mechanisation.** [`../mechanisation/agda/C004/C004.agda`](../mechanisation/agda/C004/C004.agda)
  §3.2 (`ReachWalked`, `Latent`, `walked-not-latent`, `drainage`,
  `promoted-drains`) and §1 (`ForwardClosure` record).
- **The glossary.** [`../07_GLOSSARY.md`](../07_GLOSSARY.md) (latent = *"the move
  exists in the behaviour but is reachable by no current participant"* — the
  universe reading).

---

## 1. Build the mechanisation yourself

From [`../mechanisation/agda`](../mechanisation/agda): `agda --safe --without-K C004/C004.agda`.
Confirm it type-checks with **no postulates and no holes**, and that `Reach`'s
closure structure enters only as the `ForwardClosure` **record** (a hypothesis),
not an Agda `postulate`. Then read §3.2 and confirm each lemma matches its paper
clause:
- `drainage` = clause 1's `⊆`-antitone core (contraposition through
  `reach-mono ∘ moves-mono`);
- `walked-not-latent` = clause 2 (via `reach-ext`);
- `promoted-drains` = clause 3's strictness witness.
Flag any mismatch between the Agda statement and the paper statement (e.g. a hidden
extra hypothesis, a weaker conclusion).

## 2. Clause 1 — monotone drainage (paper, §3.1)

Re-derive `Λ_{t+1} ⊆ Λ_t` from `W_t ⊆ W_{t+1}` using only `moves`-monotone and
`Reach`-monotone + contraposition. Confirm there is **no** appeal to `Reach`
idempotence or extensivity here (clause 1 needs only monotonicity), and **no**
finiteness (finiteness enters only for the `|·|` step). Confirm `|Λ_{t+1}| ≤ |Λ_t|`
is the standard finite `A ⊆ B ⇒ |A| ≤ |B|` and that `B` is finite by hypothesis.

## 3. Clause 2 / Clause 3 (§3.2, §3.3)

- Clause 2: `moves W_t ∩ Λ_t = ∅` from extensivity. Trivial — confirm.
- Clause 3: a **promoted** move (`m ∈ B`, latent at `W_t`, reached at `W_{t+1}`)
  lies in `Λ_t ∖ Λ_{t+1}`, giving strict `|·|` decrease; stationary `W` gives
  equality. Check the converse ("no promotion ⇒ `Λ_{t+1} = Λ_t`") is correctly
  argued (`Reach(moves W_{t+1}) ∩ B = Reach(moves W_t) ∩ B`).

## 4. The universe choice (§4, §5) — the load-bearing modelling decision

This is the analogue of the T013 §2 subtlety; scrutinise hardest.
1. Confirm the latent stratum's universe is the **fixed** behaviour `B`, matching
   the glossary's *"exists in the behaviour"*, **not** the growing saturation
   `S_t = proj_des σ_joint(x_t)`.
2. Re-check the §4 **non-monotonicity of the growing-universe reading**: that
   "argument-dumping" (Proponent posting unwitnessed structure) inflates the latent
   count on `S_t`. Construct your own small instance (or confirm one could be
   constructed) where `|{m ∈ S_{t+1} : latent}| > |{m ∈ S_t : latent}|` while
   `W` is unchanged. If the growing-universe reading were actually monotone, the
   fixed-`B` framing would be an unnecessary weakening — confirm it is not.
3. Confirm the **two-axes table** (§4) is correct: T013 clause 3 (D-axis, fixed
   `W`, `κ` intrinsic, latent **non-decreasing**) vs. T014 (W-axis, fixed `B`,
   latent **non-increasing**) vary different arguments of `Λ(B, W)`, so they do not
   contradict. This is exactly the reconciliation T013 §7 claimed; verify T014
   delivers it.

## 5. The accrual scope (§5) — is retraction genuinely fatal?

1. Confirm `W_t ⊆ W_{t+1}` (accrual) is necessary: exhibit (or confirm) that a
   retraction (`walked → latent` reassignment, source §0c.3) can **raise** the
   latent count, breaking clause 1.
2. Confirm the append-only `WitnessRecord` semantics (fossilisation, not deletion)
   makes the accrual fragment the substrate-faithful home for *progress*, and that
   T014 does not overclaim drainage on the full retraction-permitting dynamics.

## 6. LB2 and the `Reach` hypothesis (§1, §5)

- Confirm **LB2** (reachable-by-a-participant `= Reach(moves W)`, the union over
  walked loci) is stated as load-bearing, and that the latent stratum is genuinely
  insensitive to the finer per-participant *witnessable* substratification.
- Confirm `Reach` is hypothesised (the `ForwardClosure` record), and that T014's
  conditional status ("conditional on `Reach` a closure operator", front (a) open
  on Q-002) is correctly recorded — i.e. T014 must **not** be read as closing
  Q-004 outright.

## 7. Verdict

Append a `## Cross-check notes` section to T014 with one of:

- **SIGNED OFF** — all of §§1–6 discharged; T014 → `established`; C004 drainage
  corollary → settled (closure half mechanised + drainage half proven; only `Reach`
  front (a) residual); Q-004 front (b) → discharged, with front (a) still on Q-002.
- **DEFECTS** — numbered, each with location + minimal repair, **blocking** vs.
  **non-blocking**. In particular call out: (a) any way the growing-universe reading
  is *actually* monotone (which would mean the fixed-`B` framing is an unnecessary
  weakening, not a necessary one); (b) any failure of the two-axes reconciliation;
  (c) any Agda/paper statement mismatch; (d) any place `Reach` is silently
  constructed rather than hypothesised.
