# T008 — Against complete daimon-closed counter-designs, the first-divergence locus is the `⊑`-minimal separating context (linear chronicle); the kernel is faithful on proper tests and unfaithful exactly on raw truncations

- **status:** established (cross-checked 2026-06-04). Drafted 2026-06-04 (Direction 2, **route R2** of [session 04](../10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md); ≡ the Direction-5 mechanized-separation deliverable). This is the *abstract redefinition* of "separating context" the [session-04 decision](../10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md#6-decisions-recorded) ratified — it **recovers** the minimality the [T007](T007-minimal-separating-locus.md) cross-check removed (Repair 1), by quantifying over *proper* tests rather than raw truncations. Minimality holds (relative to the disagreement `E`, per the cross-check note); the parity artifact dissolves. The recovery is **abstract**: the contested-frontier rewire stays gated off pending a verified extractor (see §What this establishes).
- **closes:** — partially discharges [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) **O1 (linear-leastness)** for the daimon-closed object: against complete daimon-closed counter-designs on the linear chronicle, `ξ(E)` *is* the `⊑`-minimal separating context. Does **not** close O2 (branching) nor change the kernel verdict (R1 stays parked). Re-opens nothing in [T007](T007-minimal-separating-locus.md) (T007's narrowed claims stand); it *adds* the layer T007 deferred.
- **depends-on:** [T005](T005-grounded-ludics-keystone.md) (pins `⟦·⟧`, the multiplicative additive-free fragment, canonical orthogonality, the daimon's *structural* placement rule); [T006](T006-first-divergence-locus-e0.md) (E0 — first-divergence locus unique and computable); [T007](T007-minimal-separating-locus.md) (the narrowed separating-context + anchor-chain results this builds atop)
- **proved-by:** drafted 2026-06-04 (Phase R2; test-then-prove — corroborated by the daimon-closed harness, then proved here)
- **cross-checked-by:** GitHub Copilot (independent second reader; did not author T008) — verdict: **sign-off / established**, with three non-blocking clarifications (relative-to-`E` framing; even-frontier wording; Lemma F terminal-daimon scoping). See [`## Cross-check notes`](#cross-check-notes).
- **cross-check-date:** 2026-06-04
- **last-reviewed:** 2026-06-04
- **source-of-proof:** this file (definitions, statement, proof, faithfulness lemma)
- **corroborating-computation:**
  [`../../tests/bridge/separation-daimon-closed-harness.test.ts`](../../tests/bridge/separation-daimon-closed-harness.test.ts)
  — the proper-test analogue of the truncation harness. Over `allAFs(n)`, `n ≤ 3`,
  it confirms that at every E-positive frontier strictly below `ξ(E)` the complete
  daimon-closed test **concedes** (`†`) and `⟨D ∣ T⟩` is **CONVERGENT** (does not
  separate), while the genuine non-conceding refusal diverges exactly at `ξ(E)`.
  The contrast fixture
  [`../../tests/bridge/separation-truncation-harness.test.ts`](../../tests/bridge/separation-truncation-harness.test.ts)
  freezes the *broken* raw-truncation verdicts at the same frontiers. Evidence only
  — see §Corroborating computation.
- **build-instructions:** `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`

> Methodology note. Test-then-prove, as for T005/T006/T007. Route **R2** was
> ratified in [session 04 §6](../10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md#6-decisions-recorded):
> redefine the *objects* (separating contexts as complete daimon-closed
> counter-designs) rather than the *kernel verdict* (R1, parked). The leastness
> hypothesis was a **conjecture, not a premise** (session 04 §2): it is *proved*
> below for the linear chronicle and *corroborated* by the new harness; the §7
> open question of session 04 — "does the parity artifact dissolve?" — is answered
> **yes** (§Proof, Remark P).

## Vocabulary

Carry the T005 setting: finite abstract AF `F = (A, ⇝)`, the translation `⟦·⟧`
into the **multiplicative, additive-free** fragment with distinct subaddresses per
argument, and **canonical** orthogonality (`stepCore`/`stepInteraction` reaching
`†`, `CONVERGENT`). Carry the T007 scope: a **single realized dispute chronicle** —
one alternating line whose acts lie on a `⊑`-chain `ξ₀ = "0" ⊏ ξ₁ ⊏ ξ₂ ⊏ ⋯`, depth
= dispute round. `D` is a Proponent dispute design; along the chronicle `D` plays a
**positive** at even depths and **receives** (a dual negative) at odd depths. A
*test* (Opponent counter-design) `E` is dual: it **receives** at even depths and
plays a **positive** at odd depths.

**The daimon `†`.** Following *Locus Solum*, `†` is the distinguished **positive**
action by which a design *concedes / closes the net*: a design that plays `†` on
its turn ends the interaction with `CONVERGENT`. It is the kernel's `kind:
"DAIMON"` act (`stepCore` returns `CONVERGENT` the moment `findNextPositive`
selects it), and it is placed by the **structural** translation rule (T005:
Proponent acknowledges with `†` where the asserted argument has no attacker; a test
plays `†` where it concedes), **never** read off a precomputed verdict.

### Definition 1 — complete daimon-closed counter-design (proper test)

A counter-design `T` of `D` (on the chronicle's dual base) is **complete /
daimon-closed** — a **proper test** — when, at every position along the
normalization `⟨D ∣ T⟩` where it is `T`'s turn to play a **positive**, `T` has an
action: either a **proper** positive (its attack) or the **daimon** `†` (it
concedes). Equivalently: `T` never *runs out* at a reachable positive position — at
each of its turns it either continues or closes. (A *raw truncation* `E↾ℓ`, by
contrast, is **partial**: at the first positive position past `ℓ` it is simply
**absent**. This is the distinction T005's canonical orthogonality cannot see, and
the root cause the [session-04 synthesis](../10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md#synthesis--what-the-repair-1-outcome-means-for-direction-2-2026-06-04)
isolates.)

### Definition 2 — the proper test family of `(D, E)`

Fix `D ⊥̸ E` with first-divergence anchor `ξ(E) = "0.…"` at **even** depth `2m`
(T006/T007: `ξ(E)` is a `D`-positive locus, hence even depth). `T`'s positive turns
sit at odd depths `1, 3, …, 2m−1`. Define, for each odd `j` with `1 ≤ j ≤ 2m−1`:

> **`Concede_j`** — the proper test that plays `E`'s proper chronicle actions at all
> depths `< j` (its even-depth O-receives and its odd-depth P-attacks) and then, on
> its own turn at depth `j`, plays `†` (concedes) instead of the proper attack.

And:

> **`Refuse`** — the proper non-conceding test `E` itself (the genuine refusal):
> it plays every proper action and **withholds the single dual at `ξ(E)`** — the
> grant `D` asserts and the test does not concede. `Refuse` reaches no further
> positive turn (the run breaks at `ξ(E)` before depth `2m+1`), so it is vacuously
> daimon-closed: it has an action at every positive turn it *reaches*.

The **frontier** of a proper test is the locus of its `†` (for `Concede_j`,
`anch = "0.…"` at depth `j`) or `ξ(E)` (for `Refuse`).

### Definition 3 — separating context and the order `⊑`, over proper tests

A frontier locus `ℓ ⊑ ξ(E)` is **(properly) separating for `(D, E)`** iff the
proper test with frontier `ℓ` makes `⟨D ∣ ·⟩` **diverge**. Write
`SepProper(D, E) = { ℓ : ℓ properly separating }`. The order is the prefix order
`⊑` of [`separation.ts`](../../packages/ludics-engine/separation.ts) (`isPrefixLocus`,
segment-wise; root `"0"` least), taken on frontiers. This is `⊑` over **proper
tests** — Definition-1 objects — not over raw anchors/truncations (the session-04
§2 correction: the Phase-1 order was over the *wrong* objects).

## Statement

**Theorem (T008).** Fix `D` in the multiplicative additive-free T005 fragment and a
single realized dispute chronicle, and fix `E` with `D ⊥̸ E`, `ξ(E)` at even depth
`2m`. Then over complete daimon-closed counter-designs (Definitions 1–3):

1. **(Concessions converge.)** For every odd `j` with `1 ≤ j ≤ 2m−1`,
   `⟨D ∣ Concede_j⟩` is **CONVERGENT**. Hence **no** frontier `ℓ ⊏ ξ(E)` is
   properly separating.
2. **(Genuine refusal separates at `ξ(E)`.)** `⟨D ∣ Refuse⟩` is **DIVERGENT** with
   first-divergence locus `ξ(E)`. Hence `ξ(E)` is properly separating.
3. **(Leastness / minimality recovered.)** `SepProper(D, E) = { ξ(E) }`; its
   `⊑`-least (and only) element is `ξ(E)`. So **`ξ(E)` is the `⊑`-minimal
   separating context** against proper tests — the claim T007's cross-check refuted
   for raw truncations is **true** for daimon-closed counter-designs.

> **The quantifier is *relative to the disagreement `E`* (read this before objecting).**
> Minimality in (3) is over the proper-test family of the **fixed** `(D, E)`
> (Definition 2: tests that carry `E`'s grants and either concede early or refuse the
> one dual at `ξ(E)`) — it is the proper-test analogue of [T007](T007-minimal-separating-locus.md)
> Lemma A's *relative* minimum, **not** an absolute minimum over every proper test of
> `D`. This is the load-bearing distinction, because the exact objection that killed
> T007 re-arises here and is **met, not avoided**: a proper test that withholds the
> dual at an **interior even locus** `d_{2i} ⊏ ξ(E)` *does* diverge there — verified
> against the kernel (withholding `O@0.1.2` on the length-5 chronicle yields
> `DIVERGENT` at `0.1.2`, `matched = ["0","0.1"]`). That does **not** undercut (3),
> because such a test is the genuine **refusal of a *different* disagreement `E′`**
> (with `ξ(E′) = d_{2i}`), and `E′ ∉ family(D, E)` — `E` itself grants that dual
> (Definition 2 carries `E`'s receives through `ξ(E)`). In one line: *shallower
> divergence against `D` always means a different opponent, never a smaller separating
> context for the same disagreement.* What (3) excludes at `d_{2i} ⊏ ξ(E)` is the
> **concession** `Concede_{2i+1}` (which converges, part (1)), not this interior
> refusal of `E′`. Absolute minimality over all proper tests of `D` is the trivial
> root `ξ₀` (the opponent who refuses the claim outright), exactly as in T007's
> "absolute vs relative" boundary; the product-bearing object is the relative minimum
> here.

**Corollary (parity artifact dissolves).** The raw-truncation separations sit at
**odd** depths `j` (T007 Repair 1 / [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)
O1). At exactly those depths the proper test `Concede_j` **concedes** and converges.
The even/odd parity table of the truncation harness is therefore an **artifact of
truncations-as-tests**, not a feature of separation: under proper tests it vanishes.

## Proof

Throughout, the chronicle is the `⊑`-chain `d_0 = "0" ⊏ d_1 ⊏ ⋯`, `D` plays the
positive `P@d_t` at even `t` and receives `O@d_t` at odd `t`; a test plays `P@d_t`
at odd `t` and receives `O@d_t` at even `t`. **Sequentiality is by construction**
(T007 scope): `findNextPositive`'s least-index choice coincides with chronicle order
because no two `⊑`-incomparable loci are ever in play.

**Lemma 0 (alternation parity).** After the loop has matched the pairs at
`d_0, …, d_{t}` (i.e. `t+1` matched pairs), the side to move next is the Proponent
`D` iff `t` is **odd**, and the test iff `t` is **even**. *Proof.* The loop starts
on `D`'s side and flips `side` once per matched pair; after `t+1` pairs it has
flipped `t+1` times from `D`, landing on `D` iff `t+1` is even, i.e. `t` odd. ∎

**(1) Concessions converge.** Fix odd `j ≤ 2m−1`. `Concede_j` carries `E`'s proper
actions at depths `0,…,j−1`: the receives `O@d_t` (even `t < j`) and the attacks
`P@d_t` (odd `t < j`), and then `†@d_j`. The normalization matches the pairs at
`d_0, …, d_{j−1}` in order: at even `t<j`, `D` plays `P@d_t` and the test grants
`O@d_t`; at odd `t<j`, the test plays `P@d_t` and `D` grants `O@d_t`. Every dual is
present (both designs carry their proper chronicle through depth `j−1`), so all
`j` pairs match. By Lemma 0, after matching through `d_{j−1}` the side to move is
the **test** iff `j−1` is even, i.e. iff `j` is **odd** — which holds. So it is the
test's turn; `findNextPositive` on the test's acts selects the next positive, which
is `†@d_j` (the daimon; all earlier positives are consumed and the receives are
skipped as non-positive). A daimon on the side to move yields **CONVERGENT**
(`stepCore`: `kind === "DAIMON"` ⇒ `status = CONVERGENT`). `D` never plays `P@d_{j+1}`
— the run closes first — so the over-run that broke the raw truncation cannot occur.
Hence `⟨D ∣ Concede_j⟩` is CONVERGENT and `d_j` is **not** properly separating. ∎(1)

> **Remark P (why the artifact dissolves).** The raw truncation `E↾d_j` (odd `j`)
> deleted `E`'s *receives* at depths `> j`, so after matching through `d_j` the
> kernel handed the turn to `D` (Lemma 0: after `d_j`, `j` even ⇒ `D` to move — but
> the divergence in the truncation harness is read after `D`'s over-run), `D` played
> the justified `P@d_{j+1}` whose dual was truncated away, and the kernel reported
> `DIVERGENT`. The *proper* test does not delete receives and does not stay silent
> at its turn: it **plays `†` at `d_j`**, the kernel's `findNextPositive` reaches the
> daimon **before** `D` over-runs, and the verdict flips to `CONVERGENT`. The parity
> that governed the truncation table (odd frontiers separate, even do not) was
> entirely an artifact of *which receives truncation deleted*; complete tests delete
> none, so the parity has nothing to act on.

**(2) Genuine refusal separates at `ξ(E)`.** `Refuse = E` carries every proper
action and withholds the dual `O@d_{2m}` at `ξ(E) = d_{2m}` (even depth — a
`D`-positive locus, T007 Lemma B). The run matches the pairs at `d_0,…,d_{2m−1}` (all
present), then, by Lemma 0, after `d_{2m−1}` (`2m−1` odd) it is **`D`'s** turn; `D`
plays `P@d_{2m}`; `findNextNegativeAtLocus` finds no `O@d_{2m}` in `Refuse` (the one
withheld dual) and no virtual/draw tester applies on the fragment, so the loop breaks
**DIVERGENT** (`incoherent-move`) with `divergenceLocus = d_{2m} = ξ(E)` (this is E0,
[T006](T006-first-divergence-locus-e0.md), re-derived; identical to T007 Lemma A
*separates*). The next test-positive turn would be `d_{2m+1}`, never reached, so
`Refuse` is daimon-closed at every turn it reaches. Hence `ξ(E)` is properly
separating. ∎(2)

**(3) Leastness.** By (1) no `ℓ ⊏ ξ(E)` is properly separating; by (2) `ξ(E)` is.
On the linear chronicle the only frontiers `⊑ ξ(E)` are the chronicle loci
`d_0, …, d_{2m}`; the odd ones host `Concede_j` (converge, (1)); the even ones
`d_{2i}` (`i < m`) host the proper test that receives through `d_{2i}` and concedes
at its next turn `d_{2i+1}` — an instance of `Concede_{2i+1}`, which converges by
(1) — so they are not separating either; and `d_{2m} = ξ(E)` separates (2). Thus
`SepProper(D, E) = { ξ(E) }`, a singleton, whose `⊑`-least element is `ξ(E)`.
`ξ(E)` is the `⊑`-minimal separating context against proper tests. ∎(3)

> **What this says vs T007.** T007 (narrowed) proved `ξ(E)` is *a* separating
> context and the first-divergence locus, and dropped minimality because raw
> truncations gave a `⊑`-smaller separating object. T008 shows that smaller object
> is **not a legitimate test**: replacing it with the proper daimon-closed test at
> the same frontier yields `CONVERGENT`, not a separation. Once the objects are
> Girard-faithful, `ξ(E)` is minimal. The *theorem* is recovered; only the
> *operational* sourcing of `ξ*` from `stepCore` on raw truncations remains
> unsound — see §Faithfulness and §What this establishes.

## Faithfulness lemma (`stepCore ∘ ⟦·⟧` vs the abstract normalization)

This is the lemma session 04 §5 / Q-041 R2 calls for: relate the kernel to the
abstract normalization on in-scope inputs and characterize **exactly** where it
fails — that failure being the precise spec a parked R1 would implement.

**Definition (frontier-complete input).** A test `T` is **frontier-complete for
`D`** if, along `⟨D ∣ T⟩`, at every step where it is `T`'s turn to play a positive,
`T` carries an act (proper or `†`). Proper tests (Definition 1) — `Concede_j` and
`Refuse` — are frontier-complete. Raw truncations `E↾ℓ` are **not**: at the first
positive position past `ℓ` they are absent.

**Lemma F (faithfulness on proper tests).** For every frontier-complete test `T` on
the linear chronicle,

> `stepCore(⟦D⟧, ⟦T⟧).status = CONVERGENT` **iff** the abstract normalization
> `⟨D ∣ T⟩` reaches `†` (the net is closed; `D ⊥ T`), and `= DIVERGENT` **iff**
> `⟨D ∣ T⟩` reaches a **genuine refusal** (a `D`-positive at a chronicle locus `T`
> carried its chronicle through, for which `T` provides no dual and does not
> concede).

*Proof.* On a frontier-complete `T`, `findNextPositive` is only ever consulted at a
turn where the side to move has an act (Lemma 0 fixes whose turn it is; completeness
supplies the act). The two exit branches that fire on the additive-free fragment are
(i) `DAIMON` selected ⇒ `CONVERGENT`, and (ii) a positive with no dual at its locus
⇒ `DIVERGENT` (`incoherent-move`); `additive-violation` and `consensus-draw` are
vacuous (T006 §Existence). Branch (i) fires exactly when the side to move plays `†`,
i.e. when the abstract net closes; branch (ii) fires exactly when a positive at a
**carried** locus lacks its dual — a genuine refusal, since completeness rules out
"the test merely ended here." `STUCK`/`ONGOING` cannot occur on a frontier-complete
linear test: every consulted turn has an act, and the chronicle is finite. So the
kernel verdict coincides with the abstract one. (Applied to T008: `Concede_j`
closes ⇒ CONVERGENT (i); `Refuse` hits the carried-locus refusal at `ξ(E)` ⇒
DIVERGENT (ii) — matching §Proof (1)/(2) and the harness.) ∎

**Failure characterization (the parked-R1 spec).** `stepCore` is **unfaithful
exactly on tests that are not frontier-complete** — partial designs (raw
truncations `E↾ℓ`) silent at a positive position reachable in `⟨D ∣ ·⟩`. There the
kernel, having **no representation of "incomplete here" vs "refuses here,"** runs
`findNextPositive` past the silence: by Lemma 0, after an **odd**-depth frontier the
side to move is `D`, which plays the justified `P@d_{j+1}`; its truncated-away dual
is absent, and the kernel returns `DIVERGENT` (`incoherent-move`) at `d_{j+1} ⊏
ξ(E)`. The abstract reading is instead "`T` is undefined here — not a complete test,
no separation verdict." Precisely:

> **R1 spec (parked).** The kernel verdict diverges from the abstract normalization
> **iff** the run reaches a locus `ℓ'` where (a) it is the test's turn by chronicle
> parity but (b) the test carries no act at `ℓ'` *and* `ℓ'` is not the genuine
> anchor `ξ(E)`. The faithful verdict there is "test incomplete ⇒ `D` wins by
> default of a completed test = `CONVERGENT`," **not** `DIVERGENT`. Detecting (b)
> requires a *completeness/daimon-closure flag on inputs* (or a daimon-closure pass)
> — real kernel surface, not a one-line guard, and it must preserve
> [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
> (T005) and the `stepInteraction == stepCore` witnesses. This is the exact change
> R1 would implement; T008 makes it **unnecessary for the theorem** (proved over
> proper tests) and reduces it to "feed the kernel proper tests" for any future
> *operational* sourcing.

**Consequence (the boundary, stated as a result).** The kernel is faithful on the
*complete* tests Direction 1 always fed it (T005's `stepcore-differential` never
truncates) and on the proper tests T008 quantifies over; it is unfaithful on raw
truncations alone. So Direction 1's predicate is correct, T008 is true, and the only
residue is the **operational extraction** of `ξ*` from `stepCore` on partial inputs —
which is gated, not theoretical.

## Corroborating computation

[`../../tests/bridge/separation-daimon-closed-harness.test.ts`](../../tests/bridge/separation-daimon-closed-harness.test.ts)
is the proper-test analogue of the truncation harness, and **evidence, not the
proof**. (i) Frozen fixtures (length-5 / length-3) pin: the genuine refusal diverges
at `ξ(E)`; and at the odd-depth frontiers `j` whose raw truncations *diverged*
(Q-041 O1), `Concede_j` is **CONVERGENT** — the parity artifact dissolving, made a
regression fixture. (ii) A scan over `allAFs(n)`, `n ≤ 3`, asserts the two robust
properties for every realized line and its deepest-dropped-dual opponent: every
`Concede_j` with `d_j ⊏ ξ(E)` converges (no early separation), and the refusal
diverges exactly at `ξ(E)`. The contrast file
[`../../tests/bridge/separation-truncation-harness.test.ts`](../../tests/bridge/separation-truncation-harness.test.ts)
(unmodified) freezes the broken verdicts at the same frontiers, so the two harnesses
together pin the faithfulness boundary empirically. Full bridge suite green
(7 suites, 40 tests), including the T005 discharge test and all existing bridge
witnesses — never weakened.

## Scope and boundary

- **In scope:** abstract AF, multiplicative/additive-free, canonical orthogonality,
  **single realized dispute chronicle**, and **complete daimon-closed
  counter-designs** (Definition 1). Closes Q-041 **O1** for that object.
- **Branching — open (Q-041 O2).** Multiple `⊑`-incomparable defended lines in play
  is **not** covered: `stepCore`'s ungated index-order selection still mis-diverges
  off-thread (C012 §Route (b) probe), and the daimon-closure of a *branching* test
  is a tree of concessions, not a single frontier. T008 is the linear half of R2;
  the branching half needs the abstract normalization decoupled from `stepCore`.
- **Operational sourcing — gated.** T008 recovers minimality **abstractly**. It does
  **not** license sourcing `ξ*` from `stepCore` on arbitrary (possibly partial)
  inputs, because the kernel is unfaithful there (§Faithfulness). The
  contested-frontier rewire stays **gated off** pending a *verified extractor* that
  either (a) feeds the kernel only proper daimon-closed tests, or (b) implements the
  R1 spec above. Either is engineering against a now-precise specification.
- **Additive / preferred-stable — open ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)).**
  Out of scope.

## What this establishes (for the implementation)

- **The minimality theorem is recovered, abstractly.** Against complete
  daimon-closed counter-designs, the first-divergence locus `ξ(E)` *is* the
  `⊑`-minimal separating context on the linear chronicle (T008(3)). "The platform
  identifies exactly where you disagree, given what you both accepted" is again a
  corollary of separation — **provided** the test is a proper test, not a raw
  truncation.
- **The rewire stays gated — but the gate is now a verified extractor, not a
  theorem.** `divergenceLocus` may still be surfaced honestly as *the first point of
  divergence* (T006); it may be surfaced as *the minimal unshared commitment* only
  once an extractor guarantees its inputs are proper tests (or R1 lands). T008 turns
  "is minimality even true?" (was: refuted-as-stated) into "feed the kernel proper
  tests" — a faithfulness-bounded engineering task.
- **The faithfulness boundary is now exact.** Faithful on proper / complete tests
  (Direction 1's setting and T008's); unfaithful on raw truncations alone, with the
  precise trigger condition written down (§Faithfulness). This is the permanent spec
  of the kernel's adequacy the session-04 decision sought.

## Mechanization path (Direction 5)

T008's objects are clean enough to formalize, and doing so *is* the Direction-5
mechanized-separation deliverable (session 04 §3 pro). Suggested Agda home:
`RESEARCH_PROGRAMME/mechanisation/agda/T008/` (mirroring `T001/`, `T002/`), with:
`Chronicle` (a `⊑`-chain with per-depth polarity), `Action = proper (+/−) ∣ †`,
`ProperTest` (Definition 1 as a totality predicate: an action at every reachable
positive turn), the family `Concede_j` / `Refuse`, and `Normalize : Design → Test →
{ CONVERGENT, DIVERGENT ξ }`. The three parts of §Proof are short structural
inductions on chronicle depth (Lemma 0 is `parity`; (1)/(2) are case splits at the
frontier; (3) is the singleton computation). Lemma F is then the bridge to an
*executable* `stepCore` model. Pen-and-paper proof + the TS harness is the
deliverable for this thread; the Agda is the parallel mechanized check.

## Cross-check notes

**Verdict — sign-off, ESTABLISHED (2026-06-04, GitHub Copilot, non-author).** I
re-derived every obligation in §§1–6 of
[`T008-verification-prompt.md`](T008-verification-prompt.md) against the kernel
source ([`stepCore.ts`](../../packages/ludics-engine/stepCore.ts)),
[`separation.ts`](../../packages/ludics-engine/separation.ts), both harnesses, and an
independent hand-built trace probe (run transiently, removed) — not against the
proof's summaries. **All obligations discharge; the proof is correct.** I recommend
promotion to `established`. Three **non-blocking** clarifications are recorded after
the sign-off; none affects a truth claim.

### Discharged obligations (re-derived)

- **§1 Definitions Girard-faithful, over the right objects — discharged.** Definition
  1 is the *Locus Solum* proper-test notion (an action — proper or `†` — at every
  reachable positive turn; a raw truncation is *partial*, absent at its first positive
  turn past `ℓ`). Definition 3's `⊑` is `isPrefixLocus` taken on **frontiers of proper
  tests**, not on raw anchors/truncations (the session-04 §2 correction is honoured).
  `Concede_j` / `Refuse` (Definition 2) are complete in the §1.1 sense, and `Refuse`
  is the single-dropped-dual opponent of T007 (`ξ(Refuse) = ξ(E)`), confirmed by probe.
- **§2 Lemma 0 parity — discharged (empirically).** `stepCore` starts `side='A'` (the
  Proponent `D`) and flips once per matched pair, so after `t+1` pairs the test is to
  move iff `t` is even. Witnessed directly: `Concede_1` reaches `CONVERGENT` after
  matching only `["0"]` — i.e. after one pair (`t=0`, even) it is the **test's** turn,
  which plays `†`. The parity fact is sound and load-bearing for (1)/(2).
- **§3.1 Concessions converge, `†` before over-run — discharged (the crux).** Probe on
  the length-5 fixture: `Concede_1` (`†@0.1`) → `CONVERGENT`, `matched=["0"]`;
  `Concede_3` (`†@0.1.2.3`) → `CONVERGENT`, `matched=["0","0.1","0.1.2"]`. In both, the
  matched loci stop at `d_{j-1}` and `D` never plays `P@d_{j+1}` — the daimon is
  reached on the **test's own turn before any `D` over-run**. This is exactly the
  contrast with T007's raw truncation (where the over-run was a *justified `D`-move*):
  **completeness, not padding, flips the verdict.** Confirmed.
- **§3.2 Refusal separates at `ξ(E)` — discharged.** Probe: `Refuse` → `DIVERGENT`
  `incoherent-move` at `0.1.2.3.4`, `matched=["0","0.1","0.1.2","0.1.2.3"]` — `D`'s
  turn after `d_{2m-1}`, `P@d_{2m}` has no dual, break at `ξ(E)`. Identical to
  E0/T006 and to T007 Lemma A *separates*.
- **§3.3 Leastness concluded, not assumed — discharged.** `SepProper(D,E)` ranges over
  the Definition-2 family's frontiers; the odd ones host `Concede_j` (converge), only
  `ξ(E)` separates ⇒ `SepProper(D,E) = {ξ(E)}`, minimum `ξ(E)`. Concluded from (1)/(2),
  not posited. (See non-blocking note 1 on the *relative-to-E* reading.)
- **§4 Lemma F + failure characterization — discharged.** On a frontier-complete test
  the only fragment exits are `DAIMON ⇒ CONVERGENT` and unmatched-positive-at-a-carried-
  locus `⇒ DIVERGENT` (`additive-violation`/`consensus-draw` vacuous), so the kernel
  verdict equals the abstract one. The unfaithfulness set is **exactly** the
  non-frontier-complete tests (raw truncations); the R1 trigger "(a) test's turn by
  parity, (b) no carried act, (c) `ℓ' ≠ ξ(E)` ⇒ faithful verdict CONVERGENT" is the
  precise spec, requiring an input completeness flag — correctly **parked**, not
  implemented, and explicitly required to preserve the T005 discharge test.
- **§5 Corroboration discipline — re-run, evidence only.** `jest tests/bridge/` →
  **7 suites, 40 tests green**, including `stepcore-differential.test.ts` (T005,
  unweakened) and both harnesses. The daimon-closed harness asserts what §Proof
  claims; the contrast truncation harness is **unmodified** (its broken verdicts still
  frozen). The file states it is evidence, not proof.
- **§6 Scope honesty — discharged.** O2 (branching) is explicitly open and not covertly
  used; the rewire stays **gated** on a verified extractor (no claim it is now
  licensed); registry linkage is correct (Q-041 O1 partially discharged for the
  daimon-closed object; Q-040 not closed operationally; Q-039 additive open).

### Non-blocking clarifications (author may fold in at leisure; no truth claim affected)

1. **State the minimality as *relative to `E`* (per-disagreement), and meet the
   interior-refusal objection head-on.** *(Folded in 2026-06-04 — see the
   relative-to-`E` callout under §Statement.)* T008's `ξ(E)` is minimal over the family of
   `(D, E)` (Definition 2) — the proper-test analogue of T007 Lemma A's *relative*
   minimum, **not** an absolute minimum over all proper tests of `D`. This matters
   because the exact objection that killed T007 re-arises and should be visibly
   answered: a proper test that withholds the dual at an **interior even locus**
   `d_{2i} ⊏ ξ(E)` *does* diverge there — I verified it (probe `RefuseInterior`:
   withholding `O@0.1.2` → `DIVERGENT` at `0.1.2`, `matched=["0","0.1"]`). It does **not**
   break minimality because it is the **refusal of a *different* disagreement `E′`**
   (with `ξ(E′) = 0.1.2`), hence not in `SepProper(D, E)` — `E` itself grants that dual
   (Definition 2 carries `E`'s receives). The conclusion is correct; the §Statement
   callout now makes the relative-to-`E` quantifier and this exclusion unmissable, with
   the witness, since it is the precise place a skeptic re-attacks.
2. **Definition 3 / Proof (3) even-frontier wording.** "the proper test with frontier
   `ℓ`" plus the aside "even frontiers `d_{2i}` host the proper test that concedes at
   `d_{2i+1}`" is slightly muddled: per Definition 2 a *frontier* is the locus of a `†`
   (odd depth) or `ξ(E)`, so even **interior** loci are not frontiers of any family
   test at all. Cleaner: family frontiers `= {d_1, d_3, …, d_{2m-1}} ∪ {ξ(E)}`; the odd
   ones converge, `ξ(E)` diverges. Presentation only.
3. **Lemma F "STUCK/ONGOING cannot occur" leans on `⟦D⟧`'s terminal daimon.** A proper
   test that *out-grants* `D` (supplies every dual and never concedes) would reach the
   chronicle end; `STUCK` is avoided only because `⟦D⟧` carries the T005 CON-stuck
   closing `†` (so `D` concedes → `CONVERGENT`). True for the real translation, and the
   family tests never reach the terminus, so it does not bite — worth a half-sentence
   scoping the claim to `⟦·⟧`-translated `D`.

**Net:** the leastness/minimality recovery is sound against the kernel — the parity
artifact genuinely dissolves (odd-depth frontiers that *diverged* under raw truncation
*converge* under proper concession), the faithfulness boundary is exact, and the scope
is honest (branching open, rewire gated). Promoted to `established`.

## Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — designs, daimon, tests as counter-designs,
  separation, the closed-net (`†`) reading of convergence.
- Böhm 1968 — the separation theorem analogue.
- In-repo: [T005](T005-grounded-ludics-keystone.md),
  [T006](T006-first-divergence-locus-e0.md),
  [T007](T007-minimal-separating-locus.md),
  [C012](../03_CONJECTURES/C012-separation-minimal-locus.md),
  [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) / [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041),
  [session 03 synthesis](../10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md#synthesis--what-the-repair-1-outcome-means-for-direction-2-2026-06-04),
  [session 04](../10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md),
  kernel [`stepCore.ts`](../../packages/ludics-engine/stepCore.ts),
  reducer [`separation.ts`](../../packages/ludics-engine/separation.ts),
  harnesses [`separation-daimon-closed-harness.test.ts`](../../tests/bridge/separation-daimon-closed-harness.test.ts) /
  [`separation-truncation-harness.test.ts`](../../tests/bridge/separation-truncation-harness.test.ts).
