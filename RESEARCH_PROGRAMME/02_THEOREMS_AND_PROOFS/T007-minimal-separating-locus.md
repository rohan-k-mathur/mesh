# T007 — In a single realized dispute chronicle, the first-divergence locus is a determinate separating context, and the first-divergence anchors form a `⊑`-chain with a least element

- **status:** established (narrowed via **Repair 1**, 2026-06-04). The independent cross-check refuted Lemma A's *leastness* / minimality half against the kernel (a strict odd-depth prefix of `ξ(E)` separates — see [`## Cross-check notes`](#cross-check-notes)); **Repair 1** removes that claim from the theorem. What remains — Lemma A's *separates* half (with E0 uniqueness) and all of Lemma B (the first-divergence anchors form a `⊑`-chain with a unique least element `ξ*`) — was independently discharged in the cross-check (§§2.1 / 3 / 4 / 6) and stands. **Minimality is no longer claimed here**; its recovery (kernel justification-gate or abstract sequentiality) is tracked at [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041). Drafted 2026-06-04 (Phase 3 of Direction 2); promoted from [C012](../03_CONJECTURES/C012-separation-minimal-locus.md) on the rescoped (linear realized-chronicle) statement, then narrowed.
- **closes:** — **does not close** [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) (Q-040 *is* the minimality question, which Repair 1 removed and which is refuted-as-stated against the current kernel — tracked at [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)). T007 *establishes*, for the multiplicative linear-chronicle fragment, that the first-divergence locus is a **determinate separating context** and that the anchors form a `⊑`-**chain with a least element**. Out of scope: branching designs ([Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)) and additive/preferred-stable ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)).
- **depends-on:** [T005](T005-grounded-ludics-keystone.md) (pins `⟦·⟧`, the multiplicative additive-free fragment, canonical orthogonality); [T006](T006-first-divergence-locus-e0.md) (E0 — the per-run first-divergence address is unique and computable)
- **proved-by:** drafted 2026-06-04 (Phase 3; test-then-prove, corroborated Phase 2 then proved)
- **cross-checked-by:** GitHub Copilot (independent second reader; did not author T007) — verdict: defect list, one blocking (Lemma A leastness); **resolved by Repair 1** (the refuted claim is removed). The discharged obligations (§§2.1 / 3 / 4 / 6) cover the narrowed theorem, which therefore stands established.
- **cross-check-date:** 2026-06-04
- **last-reviewed:** 2026-06-04
- **source-of-proof:** this file (statement and proof); [C012 §Phase 3](../03_CONJECTURES/C012-separation-minimal-locus.md) carries the route-(b) obstruction analysis and the rescope rationale
- **corroborating-computation:**
  [`../../tests/bridge/separation-minimal-locus.test.ts`](../../tests/bridge/separation-minimal-locus.test.ts)
  (the `⊑`-order algebra + the minimal-anchor reducer
  [`../../packages/ludics-engine/separation.ts`](../../packages/ludics-engine/separation.ts)
  checked over every AF and play on `n ≤ 3`: `Sep(D)` has a unique, realised
  `⊑`-least element and always forms a `⊑`-chain). Evidence only — see
  §Corroborating computation.
- **build-instructions:** `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`

> Methodology note. Test-then-prove, as for T005/T006: Phase 2 corroborated the
> claim empirically over `allAFs(n)`; this file is the human-checked argument
> against the kernel. The statement is **deliberately rescoped** to a single
> realized dispute chronicle — the setting Phase 2 exercised and the contested-
> frontier product surface consumes. The general *branching* statement was attempted
> (route (b)) and found to overreach the kernel; that obstruction is a tracked
> follow-up ([Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)), recorded in detail in
> [C012 §Phase 3 → Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md).

## Vocabulary

Carry the T005 setting: a finite abstract AF `F = (A, ⇝)`, the translation `⟦·⟧`
into the **multiplicative, additive-free** fragment with distinct subaddresses per
argument, and **canonical** orthogonality (`stepInteraction` reaching `†`,
`CONVERGENT`). Let `D` be a Proponent dispute design.

- **Realized chronicle (the scope restriction).** A **single realized dispute
  chronicle** is one alternating dispute line: the acts in play lie at a `⊑`-chain
  of loci `ξ₀ = "0" ⊏ ξ₁ ⊏ ξ₂ ⊏ ⋯`, each `ξ_{k+1}` a child of `ξ_k` (depth =
  dispute round). This is exactly what `buildPlayDesigns`
  ([`../../tests/bridge/separation-minimal-locus.test.ts`](../../tests/bridge/separation-minimal-locus.test.ts))
  emits from a play line via `locusAt(0…len)`, and what the product's single-
  dispute-line surface consumes. **No two `⊑`-incomparable loci are in play.** (The
  branching design — multiple defended attack lines simultaneously present — is *out
  of scope* here; see Boundary.)
- **The run / first-divergence anchor.** `⟨D ∣ E⟩` is the deterministic kernel run
  ([`stepCore`](../../packages/ludics-engine/stepCore.ts)); for `D ⊥̸ E` its
  first-divergence anchor is `ξ(E) = stepCore(⟦D⟧⁺, ⟦E⟧⁻).divergenceLocus`, unique
  and computable ([T006](T006-first-divergence-locus-e0.md)).
- **Separating context.** For a locus `ℓ` on the chronicle, `E↾ℓ` is `E` truncated
  to acts at loci `⊑ ℓ`. `ℓ` is **separating for `(D, E)`** if `⟨D ∣ E↾ℓ⟩` already
  diverges.
- **The order `⊑` and `Sep(D)`.** `⊑` is the prefix order on locus paths (segment-
  wise; root `"0"` least), realised in code as `isPrefixLocus`
  ([`separation.ts`](../../packages/ludics-engine/separation.ts)).
  `Sep(D) = { ξ(E) : E ∈ D⊥ }`, the first-divergence anchors of `D`'s non-orthogonal
  opponents along the chronicle.

## Statement

**Theorem (T007, narrowed — Repair 1).** Fix `D` in the multiplicative
additive-free T005 fragment and a **single realized dispute chronicle**. Then:

1. **(Lemma A — separation at the first-divergence locus.)** For every Opponent `E`
   with `D ⊥̸ E`, the first-divergence anchor `ξ(E)` is a **separating context**:
   `⟨D ∣ E↾ξ(E)⟩` diverges, and `ξ(E)` is the **unique first-divergence locus** of
   the full run `⟨D ∣ E⟩` ([T006](T006-first-divergence-locus-e0.md), E0).
   *No leastness / minimality is claimed* — a strict odd-depth prefix `ℓ ⊏ ξ(E)` can
   itself separate (refuted against the kernel; see [`## Cross-check notes`](#cross-check-notes)
   and [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)).
2. **(Lemma B — first-divergence anchors form a chain with a least element.)**
   `Sep(D) = { ξ(E) : E ∈ D⊥ }` is the set of `D`-positive loci on the chronicle, a
   finite non-empty `⊑`-**chain**; it has a unique `⊑`-least element `ξ*`, and `ξ*`
   is **realised by a single run** (an opponent `E*` with `ξ(E*) = ξ*`). `ξ*` is the
   **shallowest first-divergence locus over the opponent family** — a determinate,
   computable object. *`ξ*` is not, in general, the `⊑`-minimal separating context*
   (that minimality is the Lemma-A leastness claim Repair 1 removed); it is the least
   *anchor*, not the least *separating context*.

## Proof

Sequentiality is *by construction* in this scope: a realized chronicle places all
acts at the `⊑`-chain `ξ₀ ⊏ ξ₁ ⊏ ⋯`, so no two `⊑`-incomparable loci are ever in
play and `findNextPositive`'s index order coincides with the chronicle order. (This
is the hypothesis that route (b) could *not* secure for branching designs against the
kernel — see [C012 §Phase 3 → Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md);
here it is part of the scope, not an assumption smuggled in.)

**(Lemma A.)** *`ξ(E)` separates.* By E0 ([T006](T006-first-divergence-locus-e0.md))
the deterministic trajectory of `⟨D ∣ E⟩` matched every positive strictly before
`ξ(E)` and breaks at the **first unmatched positive** at `ξ(E)`. The kernel is
locus-matched and advances cursors only across matched duals
(`cursorA = nextPos.idx + 1`, `cursorB = dual.idx + 1`; T006 §Termination); on the
chronicle every consulted act lies at a locus `⊑ ξ(E)` (sequentiality). Truncating
`E` at `ξ(E)` removes only acts the prefix-trajectory had not reached, so
`⟨D ∣ E↾ξ(E)⟩` runs identically up to the break and diverges. Uniqueness of `ξ(E)`
as the first-divergence locus is E0. ∎(A)

> **Leastness is not claimed (Repair 1).** The original Lemma A asserted that *no*
> strict prefix `ℓ ⊏ ξ(E)` separates, hence `ξ(E)` is the `⊑`-least separating
> context. That is **false against the kernel**: a truncated test `E↾ℓ` at odd
> chronicle depth lets `D` play a *justified* positive at the next locus whose dual
> was truncated away, so `⟨D ∣ E↾ℓ⟩` diverges and `ℓ ⊏ ξ(E)` separates (witness in
> [`## Cross-check notes`](#cross-check-notes); the over-run is a legitimate `D`-move,
> not a kernel glitch — a daimon-padded test does not avoid it). Recovering
> minimality requires either a kernel justification-gate that halts `D` at a
> truncated test's frontier, or an abstract Ludics notion of separating context
> decoupled from `stepCore`; both are tracked at
> [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041).

**(Lemma B.)** *Anchors are `D`-positive loci.* In the live `incoherent-move` case
(the only divergence on the fragment, T006 §Existence) the offending positive is the
move of the side to play that the other side leaves without a dual. Because the
opponent family is generated by perturbing the **test** `E` only (withholding an
answering O-act; the Opponent-as-test asymmetry — the single-drop construction of
the Phase-2 harness), the unanswered positive is a move of `D`; its locus is a
`D`-positive locus. Conversely, every `D`-positive locus `ℓ` on the chronicle is
challengeable: the opponent `E_ℓ` matching `D` up to `ℓ` then withholding the dual at
`ℓ` lies in `D⊥` with `ξ(E_ℓ) = ℓ`. So `Sep(D)` is exactly the `D`-positive loci on
the chronicle.

*Chain with least element, realised.* The chronicle's loci form a `⊑`-chain, so
`Sep(D)` (a subset) is a finite non-empty `⊑`-chain; a finite non-empty chain has a
unique least element `ξ*` (totality + antisymmetry of `⊑`). `ξ*` is itself a member,
realised by `E_{ξ*}` — a single run. ∎(B)

## Corroborating computation

[`../../tests/bridge/separation-minimal-locus.test.ts`](../../tests/bridge/separation-minimal-locus.test.ts)
corroborates **Lemma B** empirically over `allAFs(n)`, `n ≤ 3`. For every Proponent
design `D` from a faithful play it enumerates the opponent family (each dropped
Proponent-positive dual → one `DIVERGENT` run at anchor `ξ(E)`) and, against the pure
reducer [`separation.ts`](../../packages/ludics-engine/separation.ts) and an
**independent** shallowest-prefix-least oracle, asserts on `Sep(D)`: existence and
uniqueness of a `⊑`-least `ξ*`; that `ξ*` is a floor (a prefix of every anchor); that
`ξ*` is realised by an actual enumerated opponent; and that the anchors **always form
a `⊑`-chain** (`isChain` true throughout). A standalone block pins the `⊑`-algebra
(reflexive/antisymmetric/transitive, root least, sibling incomparability). All 7
assertions pass; lint clean. **Note (Repair 1):** the harness exercises Lemma B only
— it builds `Sep(D)` from the dropped-dual family and never truncates `E`, so it does
**not** test (and never corroborated) the removed Lemma-A *leastness* claim. This is
evidence, not the proof; the proof is §Proof.

## Scope and boundary

- **In scope (this theorem):** abstract AF, multiplicative/additive-free, canonical
  orthogonality, **single realized dispute chronicle** (a `⊑`-chain of loci).
- **Branching designs — open ([Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)).** When
  `⟦D⟧` simultaneously carries multiple defended attack lines (`⊑`-incomparable loci
  in play), `stepCore`'s index-order positive selection has **no reachability gate**
  and can mis-diverge at an *off-thread* locus: probed concretely (a single Opponent
  test via the `0.2` line yields `divergenceLocus = "0.1.1"`, incomparable to the
  realized thread; matched loci `["0","0.2"]`). On such inputs both lemmas fail. The
  general statement needs either a reachability-gated kernel or an abstract
  sequentiality lemma decoupled from `stepCore`; deferred to Q-041. Full analysis and
  witness: [C012 §Phase 3 → Route (b)](../03_CONJECTURES/C012-separation-minimal-locus.md).
- **Additive / preferred-stable — open ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)
  / [C011](../03_CONJECTURES/C011-additive-preferred-games-bridge.md)).** Opponent
  branching genuinely threatens minimality; out of scope.
- **Leastness / minimality — removed (Repair 1), open at [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041).**
  The original Lemma A held `ξ(E)` to be the `⊑`-least separating context; the
  cross-check refuted it against the kernel (odd-depth truncated tests separate
  earlier). This theorem now claims only that `ξ(E)` *is* a separating context and the
  first-divergence locus, and that the anchors form a chain with a least element. The
  least *anchor* `ξ*` is **not** asserted to be the least *separating context*.

## What this establishes (for the implementation)

- Within a single dispute line, `StepResult.divergenceLocus` is the **unique
  first-divergence locus** (T006) and a **determinate separating context**: `D` is
  genuinely non-orthogonal to the test truncated at `ξ(E)`. The first-divergence
  anchors over the opponent family form a `⊑`-chain with a computable least element
  `ξ*` (Lemma B).
- **The contested-frontier rewire is NOT licensed by this theorem.** `ξ(E)` is *a*
  separating context, **not** the `⊑`-minimal one — a strict odd-depth prefix can
  separate (see Cross-check notes / Repair 1). So sourcing the
  contested-frontier / gap-identification surface
  ([`lib/deliberation/frontier.ts`](../../lib/deliberation/frontier.ts),
  the `/frontier` route, `FrontierLane.tsx`) from `ξ(E)` as "the minimal locus of
  disagreement" would be **unsound**. The rewire stays gated off until minimality is
  recovered under [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041). `divergenceLocus`
  may still be surfaced honestly as *the first point at which the dispute diverges*
  (T006), never as *the minimal unshared commitment*.
- Branching disputes ([Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041)) and additive
  semantics ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)) remain out of scope.

## Cross-check notes

**Verdict — defect list, ONE BLOCKING (2026-06-04, GitHub Copilot, non-author).** I
re-derived every obligation in §§1–6 of
[`T007-verification-prompt.md`](T007-verification-prompt.md) against the kernel
source ([`stepCore.ts`](../../packages/ludics-engine/stepCore.ts)),
[`separation.ts`](../../packages/ludics-engine/separation.ts), the translation spec
([session 02b](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)),
and the harness
([`separation-minimal-locus.test.ts`](../../tests/bridge/separation-minimal-locus.test.ts)),
not against the proof's own summaries. **All obligations discharge except §2.2
(Lemma A leastness), which the kernel refutes.** A single blocking defect withholds
promotion to `established`; the entry stays `provisional`.

### Discharged obligations (re-derived)

- **§1 Scope restriction — discharged.** `buildPlayDesigns` emits `locusAt(t) =
  "0.1.….t"`, each a strict prefix of `locusAt(t+1)`: a `⊑`-chain, no two
  incomparable loci in play (§1.1). Acts are pushed in depth order, so
  `findNextPositive`'s least-index choice equals chronicle order *on the full
  realized line* (§1.2). The branching exclusion is honest: I **reproduced the
  Route-(b) probe** — `pos = [P@0, O@0.1, O@0.2, P@0.1.1, P@0.2.1]`, single test
  `neg = [O@0, P@0.2, O@0.2.1]` → `stepCore` returns `status DIVERGENT`, `reason
  incoherent-move`, `divergenceLocus "0.1.1"`, matched `["0","0.2"]` (off-thread).
  The restriction is necessary, not cosmetic (§1.3).
- **§2.1 `ξ(E)` separates — discharged.** `⟨D ∣ E↾ξ(E)⟩` replays the full run up to
  the break (every consulted act on the chronicle is `⊑ ξ(E)`) and diverges. This
  half is sound. **§2.3 no circularity — discharged** (Lemma A consumes E0's
  first-unmatched-positive characterisation, does not re-derive it).
- **§3 Lemma B — discharged.** Anchors are `D`-positive (even-depth) loci because the
  family perturbs only `E` (`separatingAnchors` drops `neg` O-acts) — the
  Opponent-as-test asymmetry, correctly *not* attributed to a kernel guarantee about
  the moving side (§3.1). The converse single-drop construction gives `ξ(E_ℓ)=ℓ` for
  every `D`-positive `ℓ` (§3.2). `Sep(D)` inherits the chain, has a unique least
  realised by one run, matching `minimalAnchor`'s contract (§3.3).
- **§4 Order `⊑` and reducer — discharged.** `isPrefixLocus` is segment-wise
  (`"0.1" ⋢ "0.12"`), reflexive/antisymmetric/transitive, root `"0"` least;
  `minimalAnchor` returns the unique prefix-of-all witness; the oracle
  `shallowestPrefixLeast` shares no min/order logic with it (only the trivial
  `locusSegments` split); `separation.ts` is zero-I/O.
- **§5 Scope/non-claims — discharged except where the §2.2 defect bites.** Branching
  (Q-041) and additive (Q-039) are correctly out; registry linkage is correct
  (Q-040 partial-close, Q-041/Q-039 open, C012 `promoted` → T007). **Caveat:** §5.3's
  "the product surface must source Lemma A's *relative* minimum `ξ(E)`" is exactly
  the claim broken by the blocking defect — the relative minimum is **not** minimal
  against the kernel (see below).
- **§6 Corroborating computation — re-run, evidence only.** `node
  --max-old-space-size=2048 ./node_modules/.bin/jest
  tests/bridge/separation-minimal-locus.test.ts` → **7/7 green** (~8 s). The harness
  enumerates every AF on `n ≤ 3`, the opponent family produces `DIVERGENT` runs
  (`designsWithSep > 0`), `isChain` is true throughout, and the differential oracle
  agrees. **Crucially, the harness measures Lemma B only** (the dropped-dual family
  `Sep(D)` and its `⊑`-least `ξ*`); it **never truncates `E`**, so it does **not**
  corroborate Lemma A's leastness. The green suite is fully consistent with the
  defect below.

### Defect 1 — BLOCKING — Lemma A's *leastness* is false against the kernel

**Location.** §Statement, Lemma A ("the first-divergence anchor `ξ(E)` is the
`⊑`-**least** separating locus … no strict prefix `ℓ ⊏ ξ(E)` separates"); §Proof,
Lemma A, paragraph "*`ξ(E)` is least*" — specifically the inference "so `⟨D ∣ E↾ℓ⟩`
exhibits no unmatched positive and hits no `DIVERGENT` guard"; and the §Proof
preamble "the off-thread hazard cannot arise **within scope**."

**Why it fails (re-derived against the kernel).** The leastness argument runs the
*truncated* interaction `⟨D ∣ E↾ℓ⟩` for `ℓ ⊏ ξ(E)` and asserts it has no unmatched
positive. That is false. `E↾ℓ` deletes `E`'s O-duals at loci `⊐ ℓ` — duals that
**were matching `D`'s positives** in the full run. After the truncated run matches
every pair up to `ℓ`, `findNextPositive` (least-index, **no reachability/justification
gate** — the very property C012 Finding 1 / Route (b) flagged) lets `D` play its
next positive at the locus just past `ℓ`; its dual is gone, so the run breaks
`DIVERGENT`. The alternation makes this parity-dependent:

- `ℓ` at **even** depth (a `D`-positive locus): after matching `ℓ` it is the
  Opponent's turn, `E↾ℓ` has no deeper positive → `STUCK` (not separating). ✓
- `ℓ` at **odd** depth (an `E`-positive locus): after matching `ℓ` it is `D`'s turn,
  `D` plays the next (even-depth) positive whose dual was truncated → `DIVERGENT`
  (**separating**). ✗

Since `ξ(E)` is always at **even** depth, every `ξ(E)` deeper than the root has an
**odd-depth strict prefix that separates** — so `ξ(E)` is *not* the `⊑`-least
separating locus (in fact it is near-maximal; the least is the shallowest odd-depth
truncation).

**Empirical witness (reproducible, kernel-confirmed).** Take the linear chronicle of
length 5 (`buildPlayDesigns` for a depth-4 line), `D`-positives at even depths:
`pos = [P@0, O@0.1, P@0.1.2, O@0.1.2.3, P@0.1.2.3.4]`. Let `E` be the dropped-dual
opponent withholding `O@0.1.2.3.4`. Then `stepCore(⟦D⟧, ⟦E⟧)` gives `ξ(E) =
"0.1.2.3.4"`. Truncating `E` to acts at loci `⊑ ℓ` and re-running:

| `ℓ` (⊏ `ξ(E)`) | depth | `⟨D ∣ E↾ℓ⟩` | separating? |
| --- | --- | --- | --- |
| `"0"` | 0 | `STUCK` | no |
| `"0.1"` | 1 (odd) | `DIVERGENT` at `"0.1.2"` | **yes** |
| `"0.1.2"` | 2 | `STUCK` | no |
| `"0.1.2.3"` | 3 (odd) | `DIVERGENT` at `"0.1.2.3.4"` | **yes** |

`ℓ = "0.1"` separates and `"0.1" ⊏ "0.1.2.3.4" = ξ(E)`, directly contradicting
"no strict prefix `ℓ ⊏ ξ(E)` separates." (Probe built from the harness's own
`buildPlayDesigns`/`stepCore`; run transiently and removed.)

**Root cause.** The rescope to the linear realized chronicle fixed the *separates*
direction (whose run only consults loci `⊑ ξ(E)`), but the *leastness* direction
**inherently quantifies over truncated tests `E↾ℓ`**, which are early-stopped
chronicles. Against the ungated kernel an early-stopped test cannot stop `D` from
running past it, so the off-thread/over-run hazard the rescope claimed to exclude
**does** arise within the linear scope. "Sequentiality by construction" covers the
full realized line, **not** its prefixes-as-tests.

**Impact.** Lemma A is the operative, product-bearing claim ("`ξ(E)` is **the
minimal separating context**", §Statement; "where you disagree, given what you both
accepted", §What this establishes). Under the kernel's own orthogonality
(`DIVERGENT` = non-orthogonal) a *smaller* separating context exists, so `ξ(E)` is
not minimal and the contested-frontier rewire licensed off Lemma A (§5.3, §What this
establishes) is **not** justified.

**Minimal repair (pick one).**

1. **Demote the claim now (smallest, honest).** Restate Lemma A as only "`ξ(E)`
   separates and is the first-divergence locus of the *full* `⟨D ∣ E⟩`" (E0 +
   §2.1), drop the `⊑`-least/minimality assertion, and keep Lemma B (sound, tested).
   Re-file Q-040 as **not** closed for minimality; move the minimality claim to a
   tracked open question alongside Q-041. The frontier rewire stays gated off.
2. **Gate the kernel (recovers the theorem, larger).** Add a
   reachability/justification gate to `findNextPositive` so a truncated test halts
   `D` at its frontier (`⟨D ∣ E↾ℓ⟩` → `STUCK`/`CONVERGENT`, never over-run
   `DIVERGENT`); then re-derive leastness and re-corroborate **with a truncation
   harness** (the current harness does not exercise truncation). This is the same
   engine work Q-041/Route (b) defers, now also required for the linear leastness.
3. **Redefine "separating" (medium).** Replace `E↾ℓ` with a *padded* test that
   answers-or-blocks past `ℓ` (so over-run cannot occur), prove that is the intended
   Ludics separating context, and re-run leastness over the padded family.

Repair 1 is promotable immediately and matches what is actually proved and tested;
2/3 are tracked follow-ups.

### Recommendation

Do **not** promote T007 to `established`. The *separates* half of Lemma A and all of
Lemma B are sound and corroborated; the *leastness* half — and therefore the
headline "minimal separating context" — is refuted against `stepCore` by the witness
above. Apply Repair 1 to land a correct, narrower theorem now, and track the
minimality claim as open (kernel gate / abstract sequentiality) next to Q-041.

### Repair 1 applied (2026-06-04)

Repair 1 was applied. The refuted *leastness* / minimality claim is removed: the
title, Statement (Lemma A), Proof, §What this establishes, and §Scope are narrowed to
"`ξ(E)` is a determinate separating context and the unique first-divergence locus;
the anchors form a `⊑`-chain with a least element `ξ*`." With the blocking claim
gone, the obligations the cross-check *discharged* (§§2.1 / 3 / 4 / 6) cover the
remaining theorem, so the entry is promoted to **`established` (narrowed)**.

Before applying, a follow-up probe (the same `buildPlayDesigns`/`stepCore` harness,
run transiently and removed) checked whether Repair 2/3 had a cheap form and
sharpened the obstruction recorded for [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041):

- **The over-run is a *justified* `D`-move, not an off-thread wander.** On the
  length-5 chronicle, truncating `E` at the odd-depth `ℓ = "0.1"` yields `⟨D ∣ E↾ℓ⟩`
  → `DIVERGENT` at `"0.1.2"`: at that step it is `D`'s turn and `D` plays `P@0.1.2`,
  whose full locus chain `0 → 0.1 → 0.1.2` was traversed, so the move is legitimately
  justified — `E` simply has no dual. (Distinct from the *branching* off-thread probe,
  where `findNextPositive` jumps to an un-probed line.) A reachability gate keyed on
  *visited loci* therefore does **not** fix it — there is nothing unreachable to
  block; only a change to the **orthogonality verdict** ("justified `D`-positive +
  exhausted `E` ⟹ `CONVERGENT`/D-wins, not `DIVERGENT`") would, and that lands on the
  T005 discharge test ([`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts),
  T005 `established`). So Repair 2 is genuine, T005-adjacent engine work — squarely
  Q-041, not an inline patch.
- **Naive daimon-padding (the cheap form of Repair 3) does not work.** Appending `†`
  to the truncated test (`E↾"0.1" + †@"0.1.2"` or `+ †@"0.1"`) leaves the verdict
  `DIVERGENT` at `"0.1.2"` unchanged, because the over-run is on `D`'s turn and the
  daimon on `E`'s side is never reached. A correct "proper test" must come from the
  abstract Ludics separating-context notion (Q-041 / Route R2), not a quick pad.

Both observations are folded into [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) as
the precise obstruction the minimality recovery must overcome.

## Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — separation, behaviours, divergence.
- Böhm 1968 — the λ-calculus separation theorem (the analogue).
- In-repo: [T005](T005-grounded-ludics-keystone.md),
  [T006](T006-first-divergence-locus-e0.md),
  [C012](../03_CONJECTURES/C012-separation-minimal-locus.md),
  [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040),
  [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041),
  [session 03](../10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md),
  kernel [`stepCore.ts`](../../packages/ludics-engine/stepCore.ts),
  reducer [`separation.ts`](../../packages/ludics-engine/separation.ts).
