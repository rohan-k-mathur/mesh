# T006 — The first-divergence locus (E0): along the deterministic interaction run, the first address at which two non-orthogonal dispute designs cease to match is unique and computable

- **status:** established (cross-checked 2026-06-04) — the *warm-up half* (E0) of the separation programme. The load-bearing cross-opponent **minimality** claim is **not** this theorem and remains open as [C012](../03_CONJECTURES/C012-separation-minimal-locus.md) / [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040).
- **closes:** — (does not retire an open question; it *establishes the warm-up lemma named inside* [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040) and [C012](../03_CONJECTURES/C012-separation-minimal-locus.md), whose load-bearing minimality claim stays open). Per the register policy this is a sub-lemma promoted to its own file for reuse; it updates Q-040's `next-action`, it does not close it.
- **depends-on:** [T005](T005-grounded-ludics-keystone.md) (pins the translation `⟦·⟧`, the multiplicative additive-free fragment, and canonical orthogonality `stepInteraction` ⇓ `†`)
- **proved-by:** drafted 2026-06-03 (Phase 0 of Direction 2, separation / locus of disagreement)
- **cross-checked-by:** GitHub Copilot (independent second reader; did not author E0)
- **cross-check-date:** 2026-06-04
- **last-reviewed:** 2026-06-04
- **source-of-proof:** this file
- **corroborating-computation:**
  [`../../tests/bridge/divergence-locus-differential.test.ts`](../../tests/bridge/divergence-locus-differential.test.ts)
  (differential — kernel field `stepCore(...).divergenceLocus` vs an independent
  re-derivation of the first unmatched positive, and vs the pure projection
  `divergenceLocusOf` that `stepInteraction` threads; exhaustive over every AF and
  play on `n ≤ 3`, each Opponent O-act dropped in turn to force divergences).
  Evidence only — see §Corroborating computation.
- **build-instructions:** `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`

> Methodology note. This is the *prove* half of Phase 0 of the test-then-prove
> plan for separation
> ([session 03](../10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md)
> §4): the field extraction and differential test corroborate E0 empirically; the
> proof below is the human-checked argument against the kernel. E0 is explicitly
> the *easy half* — uniqueness/computability of the address within one run. The
> *real* theorem of the direction is cross-opponent minimality
> ([C012](../03_CONJECTURES/C012-separation-minimal-locus.md)), which this does not
> address.

## Vocabulary

Carry the T005 setting: a finite abstract AF `F = (A, ⇝)`, the translation `⟦·⟧`
into the **multiplicative, additive-free** fragment with distinct subaddresses per
argument, and **canonical** orthogonality (`stepInteraction` reaching the daimon
`†`, i.e. `CONVERGENT`). Let `D` be a Proponent dispute design and `E` an Opponent
design.

- **The interaction run.** `⟨D ∣ E⟩` denotes the locus-matched alternating
  normalization computed by the pure kernel
  [`stepCore`](../../packages/ludics-engine/stepCore.ts) on `(⟦D⟧⁺, ⟦E⟧⁻)`,
  returning `status ∈ {CONVERGENT, DIVERGENT, STUCK, ONGOING}`. `stepInteraction`
  ([`stepper.ts`](../../packages/ludics-engine/stepper.ts)) is its DB-coupled
  delegate: it resolves designs/loci/prior trace through prisma, calls `stepCore`,
  and persists; the decision procedure is `stepCore`'s, byte-for-byte.
- **Act / locus / path.** An act `α` carries a polarity (`P`/`O`/daimon), a kind
  (`PROPER`/`DAIMON`), and a `locusId`. `pathById` maps a `locusId` to its address
  **path**, a string like `"0.1.2"` (the same address space as the existing
  `pairs[].locusPath` field; there is no separate `LocusPath` type).
- **Non-orthogonal.** `D ⊥̸ E` iff `⟨D ∣ E⟩` returns `DIVERGENT`.
- **First-divergence address.** The field `divergenceLocus?: string` on
  `StepCoreResult`: the path of the offending positive `nextPos.act` at the step at
  which the loop breaks `DIVERGENT`; `undefined` otherwise. Pure projection:
  `divergenceLocusOf(input) = stepCore(input).divergenceLocus`.

## Statement

**Theorem (E0).** Fix `D`, `E` in the T005 fragment with `⟨D ∣ E⟩` divergent.
Then the run `⟨D ∣ E⟩` determines a **single** address `ξ` — the locus of the
**first unmatched positive** — and `ξ` is **computed in one pass** by the pure
kernel:
$$\xi \;=\; \texttt{stepCore}(\llbracket D\rrbracket^{+}, \llbracket E\rrbracket^{-}).\texttt{divergenceLocus},$$
and `divergenceLocus` is defined **iff** `status = DIVERGENT`.

## Proof

**(Determinism — the run is a unique finite trajectory.)**
`stepCore` is a pure function of `(⟦D⟧⁺, ⟦E⟧⁻)`: it performs no I/O and the
decision branch reads no clock — its sole import is the `StepResult` *type* from
[`packages/ludics-core/types`](../../packages/ludics-core/types.ts) (`Date.now()`
appears only in the `ts` timestamp recorded *on already-decided* pairs and in a
synthesized-id string for virtual negatives, neither of which gates a branch; in
this fragment `virtualNegPaths`, `drawAtPaths`, `phase`, `focusAt`, and additives
are all empty/absent). At each step the machine state
`(side, cursorA, cursorB)` together with the two fixed act lists determines:
(i) `nextPos`, the **first** positive at or after the active cursor on the side to
move (`findNextPositive` scans by ascending index and returns the least-index
daimon or proper `P`-act); and (ii) the search for its dual O-act at the **same**
locus (`findNextNegativeAtLocus`). Both finders are deterministic, so the successor
state is a function of the current state. Hence for fixed inputs the sequence of
states — the trajectory — is unique.

**(Termination — computability.)**
Every step that matches a positive against a dual strictly advances a cursor on
each side (`cursorA = nextPos.idx + 1`, `cursorB = dual.idx + 1`, with the roles
swapped on alternating sides) and marks the consumed O-act used
(`usedNegActIds`), so no matched pair recurs; the number of matched steps is bounded
by `|⟦D⟧| + |⟦E⟧|`. The run halts when it reaches a daimon (`CONVERGENT`), finds no
next positive (`STUCK`), or hits a divergence guard (`DIVERGENT`) — and the
`fuel`/`ONGOING` cap bounds it unconditionally. Therefore `ξ` is computed in a
single finite pass.

**(Existence and the "first unmatched positive" characterisation.)**
Because the run is divergent, the loop exits at exactly one of its three
`DIVERGENT` guards, each reached from a single `nextPos`:

1. `additive-violation` — a positive whose additive parent was already resolved to
   a different child. **Vacuous** in the additive-free fragment (no act carries
   `isAdditive`, so `isAdditiveParent` returns `null`).
2. `consensus-draw` — a positive with no dual O at its locus *and* its path in
   `drawAtPaths`. **Vacuous** here (`drawAtPaths` empty).
3. `incoherent-move` — a positive with no available dual O at its locus and no
   virtual negative synthesizable. **The only live case** on this fragment.

In the live case the loop has, by construction, matched every positive strictly
earlier in the (unique) trajectory — each such positive caused a cursor to advance
past it — so `nextPos.act` is the **first** positive without a dual: the first
unmatched positive. The recorded address is the path of *that one act*,
`nextPos.act.locusId ? pathById.get(nextPos.act.locusId) : undefined`, assigned to
`divergenceLocus` immediately before the `break`.

**(Uniqueness.)**
The trajectory is unique (determinism) and the loop `break`s on the **first** guard
it hits; hence the offending `nextPos` at the break — therefore `ξ` — is unique.

**(Definedness iff `DIVERGENT`.)**
`divergenceLocus` is assigned **only** on the two live `DIVERGENT` branches and is
never assigned on the `CONVERGENT` (daimon), `STUCK` (no next positive), or
`ONGOING` (phase gate / fuel) exits. So it is defined exactly when
`status = DIVERGENT`. (On a divergent run in the additive-free fragment whose
offending positive carried no resolvable `locusId`, the value would be `undefined`
while `status = DIVERGENT`; the translation `⟦·⟧` assigns every advanced argument a
locus, so this does not arise for translated designs — recorded as the boundary of
the "iff" rather than a defect.) ∎

## Corroborating computation

[`../../tests/bridge/divergence-locus-differential.test.ts`](../../tests/bridge/divergence-locus-differential.test.ts)
discharges E0 empirically over `allAFs(n)`, `n ≤ 3` (the Direction-1 enumeration
harness). For every encoded play it builds the faithful Proponent/Opponent design
pair, then drops each Opponent O-act in turn — deleting the dual of some Proponent
positive forces an `incoherent-move` divergence at a determinate locus. It asserts,
on every case, that `stepCore(...).divergenceLocus` (i) is populated **exactly** on
`DIVERGENT` runs, (ii) equals an **independent** re-derivation of the first unmatched
positive (no shared code with the kernel), and (iii) is returned identically by the
pure projection `divergenceLocusOf` (the surface `stepInteraction` threads). This is
evidence, not the proof; the proof is §Proof above.

## Cross-check notes

**Verdict — sign-off (2026-06-04, GitHub Copilot, non-author).** Every obligation in
§§1–6 of [`T006-verification-prompt.md`](T006-verification-prompt.md) was re-derived
against the kernel source (not the proof's summaries). I recommend promotion to
`established`. One non-blocking wording nit is recorded at the end.

- **§1 Determinism (re-derived).** Audited every branch/loop guard in `stepCore`
  ([`stepCore.ts`](../../packages/ludics-engine/stepCore.ts)). The two `Date.now()`
  uses are the `ts` field of an already-decided `pairs[]` entry and the synthesized
  id of a *virtual* O (`virt:${p}:${Date.now()}`); neither is ever read by a guard
  that selects status/reason/locus, so neither gates the trajectory. On the T005
  fragment `virtualNegPaths`, `drawAtPaths`, `usedAdditive`, `phase`, `focusAt` are
  empty/absent ⟹ `allowInPhase` is always `true`, no virtual O is synthesized, and
  `isAdditiveParent` returns `null` (confirmed against the translation spec §1–§4:
  distinct subaddresses per argument, additive-free). `findNextPositive` returns the
  least-index eligible positive from the cursor and `findNextNegativeAtLocus` scans
  deterministically; the `usedNegActIds` skip is order-independent given fixed inputs.
  Determinism is in fact robust even if act ids were absent, since `stepCore` is a
  pure function of its inputs. **Discharged.**
- **§2 Termination / computability (re-derived).** Each matched step sets
  `cursor = idx + 1` on the moving (positive) side, which is monotone non-decreasing
  per side, bounding matched steps by `|⟦D⟧| + |⟦E⟧|`; the consumed O is marked in
  `usedNegActIds`. `fuel` is clamped `Math.max(1, Math.min(fuel ?? 10000, 10000))`,
  so the loop halts unconditionally at a daimon (`CONVERGENT`), absent next positive
  (`STUCK`), a divergence guard (`DIVERGENT`), or the cap (`ONGOING`). `ξ` is computed
  in one finite pass. **Discharged.**
- **§3 Existence / first-unmatched / uniqueness / definedness (re-derived).** Exactly
  two assignment sites set `divergenceLocus`, covering the three reasons:
  `additive-violation` (its own break) and the `!dual` block (`consensus-draw` vs
  `incoherent-move`). On the fragment the first two reasons are vacuous
  (`isAdditiveParent ⟹ null`; `drawAt` empty), leaving `incoherent-move` as the sole
  live divergence. At the live break, `divergenceLocus = p =
  nextPos.act.locusId ? pathById.get(nextPos.act.locusId) : undefined`, assigned to
  the offending act's path immediately before `break` — not a later/aggregate locus.
  Every earlier positive along the unique trajectory was matched (it advanced a
  cursor past itself), so `nextPos.act` is the first unmatched positive; the loop
  breaks on the first guard, fixing a single `ξ`. Hand-trace of dropping one Opponent
  dual agrees. The `iff` holds with the recorded boundary: a divergent run whose
  offending act has no resolvable `locusId` would leave `divergenceLocus = undefined`
  while `status = DIVERGENT`; the translation `⟦·⟧` places every advanced argument at
  locus `0` or `0.i` with `pathById` total over those loci (confirmed in the spec and
  the test's `buildPlayDesigns`), so this cannot arise for translated designs. The
  lemma scopes the `iff` to translated designs and records the boundary honestly.
  **Discharged.**
- **§4 Kernel-field ↔ delegate correspondence (re-derived).** In
  [`stepper.ts`](../../packages/ludics-engine/stepper.ts) `stepInteraction` binds
  `const divergenceLocus = core.divergenceLocus` and returns it verbatim; it performs
  no independent locus computation. Critically, the field **bypasses** `displayPath`
  / `maskNamesAt` (masking is applied to other surfaces, never to `divergenceLocus`),
  so the returned address is byte-identical to `stepCore`'s on every run, masked or
  not. `divergenceLocusOf(input) === stepCore(input).divergenceLocus` is a pure
  projection, a faithful stand-in for the extraction surface. **Discharged.**
- **§5 Scope / non-claims (re-derived).** No step asserts or uses cross-opponent
  minimality; the additive/draw vacuity is stated as the lemma's boundary, not
  silently assumed for the additive/draw settings (Q-039). The entry is filed against
  Q-040 / C012 as the discharged warm-up and does not claim to close them.
  **Discharged.**
- **§6 Corroborating computation (re-run, evidence only).** Re-ran
  `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/divergence-locus-differential.test.ts`
  → 3/3 green (~10 s). Confirmed the oracle `firstUnmatchedPositive` is a standalone
  re-implementation importing no `stepCore` internals, and that the harness enumerates
  every AF on `n ≤ 3`, drops each Opponent O-act in turn, asserts `divergent > 0`, and
  checks all three of (i) populated-exactly-on-`DIVERGENT`, (ii) field == oracle,
  (iii) field == `divergenceLocusOf`. Evidence corroborates; it does not discharge.

**Non-blocking nit (author may align at leisure).** In *§Proof → Definedness iff
`DIVERGENT`* the phrase "assigned **only** on the two live `DIVERGENT` branches"
uses "live" inconsistently with the *Existence* paragraph, which (correctly) calls
`incoherent-move` "the only live case" on the fragment. The two *assignment sites*
are `additive-violation` and the `!dual` block, but only one is *live* here.
Suggest "assigned only on the `DIVERGENT` assignment sites" to remove the clash.
This does not affect any truth claim (the substantive point — assigned on no
`CONVERGENT`/`STUCK`/`ONGOING` exit — is correct), hence not a defect.

## What this rules out (for the implementation)

- The first-divergence address is a **determinate object**, not a heuristic: any
  call site may read `StepResult.divergenceLocus` / `StepCoreResult.divergenceLocus`
  and rely on it being the path of the first unmatched positive, populated exactly on
  `DIVERGENT`. The contested-frontier / gap-identification surface can report **this**
  locus as *the* first point of disagreement within a run.
- It does **not** license "the platform identifies exactly *where* you disagree" as a
  minimality claim: E0 is single-run uniqueness only. Cross-opponent minimality is
  [C012](../03_CONJECTURES/C012-separation-minimal-locus.md), still open; do not treat
  `divergenceLocus` as a *minimal separating context* on the strength of this entry.

## Bibliography

- Girard 2001, *Locus Solum* (MSCS 11) — separation, behaviours, divergence/orthogonality.
- Böhm 1968 — the λ-calculus separation theorem (the analogue).
- In-repo: [T005](T005-grounded-ludics-keystone.md),
  [C012](../03_CONJECTURES/C012-separation-minimal-locus.md),
  [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040),
  [session 03](../10_IDEATION_SESSIONS/03-separation-locus-of-disagreement-2026-06-03.md),
  kernel [`stepCore.ts`](../../packages/ludics-engine/stepCore.ts).
