# Verification prompt — fully cross-check T006 (the first-divergence locus, E0)

> **Role.** You are an independent second reader. You did **not** author T006.
> Your job is to either (a) sign off on the lemma as *established*, or (b) return
> a numbered list of substantive defects, each with the precise location and the
> minimal repair you believe is required. Default to skepticism: a clean sign-off
> requires that *every* obligation below is discharged. Do **not** trust the
> proof's own summaries — re-derive against the kernel source.
>
> **Target.** [`T006-first-divergence-locus-e0.md`](T006-first-divergence-locus-e0.md)
> — the claim that, for `D` (Proponent) and `E` (Opponent) in the T005 fragment
> with `⟨D ∣ E⟩` divergent, the run determines a **unique** address `ξ` (the path
> of the first unmatched positive), computed in one pass as
> `stepCore(⟦D⟧⁺, ⟦E⟧⁻).divergenceLocus`, with that field defined **iff**
> `status = DIVERGENT`.
>
> **Scope reminder — what T006 is NOT.** T006 is the *warm-up half* (E0): single-run
> uniqueness/computability of the divergence address. It does **not** assert
> cross-opponent minimality — that is [C012](../03_CONJECTURES/C012-separation-minimal-locus.md)
> / [Q-040](../01_OPEN_QUESTIONS_REGISTRY.md#q-040), still open. A sign-off on T006
> must not be read as evidence for minimality, and you must flag any step that
> silently leans on it (see §5).
>
> **Programme rules you are bound by.** Read [`README.md`](README.md)
> (theorem-register policy) first. An entry must be (1) stated in formal
> vocabulary, (2) human-checkable in one sitting via lemmas, (3) cross-checked by
> a non-author, (4) tied to an open-question entry it retires or updates. Tests
> are **evidence, not proof** — a passing differential test corroborates but never
> discharges a proof obligation. Record your verdict in the format of the existing
> `## Cross-check notes` sections (see
> [`T004-jsl-fragment-bridge.md`](T004-jsl-fragment-bridge.md) for the model).

---

## 0. Source materials you must consult (do not work from T006 alone)

Read these before forming any judgement. E0's correctness is a *property of the
kernel*; the proof is only as good as its match to the code.

- **The lemma.** [`T006-first-divergence-locus-e0.md`](T006-first-divergence-locus-e0.md)
- **The pure kernel (the object of the proof).**
  [`../../packages/ludics-engine/stepCore.ts`](../../packages/ludics-engine/stepCore.ts)
  — `stepCore`, `StepCoreResult.divergenceLocus`, `divergenceLocusOf`, the finders
  `findNextPositive` / `findNextNegativeAtLocus`, the additive-parent detector, and
  the three `DIVERGENT` break sites.
- **The DB-coupled delegate.**
  [`../../packages/ludics-engine/stepper.ts`](../../packages/ludics-engine/stepper.ts)
  — `stepInteraction`, specifically that it captures `core.divergenceLocus` and
  returns it verbatim, adding no second decision.
- **The result type.**
  [`../../packages/ludics-core/types.ts`](../../packages/ludics-core/types.ts)
  — `StepResult` (the `divergenceLocus?: string` and `reason` unions).
- **The translation spec (fragment confinement).**
  [`../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md`](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)
  — distinct subaddresses per argument; no additives; no draw-loci.
- **The keystone it depends on.** [`T005-grounded-ludics-keystone.md`](T005-grounded-ludics-keystone.md)
  — pins the multiplicative additive-free fragment and canonical orthogonality.
- **The corroborating test.**
  [`../../tests/bridge/divergence-locus-differential.test.ts`](../../tests/bridge/divergence-locus-differential.test.ts).

---

## 1. Obligations — determinism (the run is a unique trajectory)

The whole lemma rests on `stepCore` being a deterministic function of its act
lists on this fragment. Re-derive, do not trust the prose.

1. **No non-deterministic branch.** Audit every branch and loop condition in
   `stepCore` and confirm none reads a clock, RNG, global, or I/O. In particular
   locate **every** use of `Date.now()` and confirm each one feeds only (i) the
   `ts` field of an already-decided pair, or (ii) the synthesized id of a *virtual*
   negative — never a guard that selects status/reason/locus. If any `Date.now()`
   (or other ambient value) can change which branch is taken, E0's determinism
   claim fails: report it.
2. **Fragment nullifies the non-multiplicative inputs.** Confirm that for translated
   designs `virtualNegPaths`, `drawAtPaths`, `usedAdditive`, `phase`, and `focusAt`
   are empty/absent, so `allowInPhase` is always `true`, no virtual O is synthesized,
   and `isAdditiveParent` returns `null`. If any of these *can* be non-trivial on the
   T005 fragment, the reduction to a plain alternating walk is not justified — flag it.
3. **Successor-state functionality.** Confirm `findNextPositive` returns the
   least-index eligible positive from the cursor, and `findNextNegativeAtLocus`
   scans deterministically (and that the `usedNegActIds` skip is order-independent
   given fixed inputs). Conclude that `(side, cursorA, cursorB)` + the two fixed act
   lists determine the successor state, hence the trajectory is unique.

---

## 2. Obligations — termination and computability

1. **Cursor strictly advances on a match.** Confirm each matched step sets
   `cursor = idx + 1` on both sides (with the documented A/B role swap) and marks
   the consumed O-act in `usedNegActIds`, so no matched pair recurs and the matched-
   step count is bounded by `|⟦D⟧| + |⟦E⟧|`.
2. **Every exit is reached in finite steps.** Confirm the loop halts at a daimon
   (`CONVERGENT`), an absent next positive (`STUCK`), a divergence guard
   (`DIVERGENT`), or the `fuel` cap (`ONGOING`), and that `fuel` is clamped to a
   finite bound. Conclude `ξ` is computed in a single finite pass.

---

## 3. Obligations — existence, "first unmatched positive", uniqueness, definedness

This is the substantive content. Verify against the three `DIVERGENT` break sites.

1. **Guard taxonomy on the fragment.** Confirm there are exactly three `DIVERGENT`
   exits — `additive-violation`, `consensus-draw`, `incoherent-move` — and that on
   the additive-free / no-draw-loci translation the first two are **vacuous**
   (`isAdditiveParent ⟹ null`; `drawAt` empty), leaving `incoherent-move` as the
   sole live divergence. If either "vacuous" claim is wrong, the characterisation of
   `ξ` changes — report it.
2. **`ξ` is the first unmatched positive.** Confirm that at the live break,
   `nextPos.act` is the offending positive and that every positive strictly earlier
   in the unique trajectory was matched (each advanced a cursor past itself). Confirm
   `divergenceLocus` is assigned the path of *that* act,
   `nextPos.act.locusId ? pathById.get(nextPos.act.locusId) : undefined`, immediately
   before the `break` — not some later or aggregate locus.
3. **Uniqueness.** Confirm the loop `break`s on the **first** guard hit and that,
   given the unique trajectory, this fixes a single `nextPos` and hence a single `ξ`.
   Construct a small divergent play by hand (e.g. drop one Opponent dual) and check
   the address agrees with your manual trace.
4. **Definedness iff `DIVERGENT`.** Confirm `divergenceLocus` is assigned on the
   live `DIVERGENT` branch(es) and on **no** `CONVERGENT` / `STUCK` / `ONGOING`
   exit. Then scrutinise the recorded **boundary case**: a divergent run whose
   offending positive has no resolvable `locusId` would leave `divergenceLocus =
   undefined` while `status = DIVERGENT`. Judge whether T006's claim that the
   translation `⟦·⟧` assigns every advanced argument a locus (so this cannot arise
   for translated designs) is actually true per the spec in §0 — if it is not, the
   "iff" is only a one-way implication and must be restated.

---

## 4. Obligations — kernel-field ↔ delegate correspondence

E0 is stated against `stepCore`; T006 also asserts `stepInteraction` returns the
identical address. This is a *faithfulness* obligation.

1. In `stepper.ts`, confirm `stepInteraction` reads `core.divergenceLocus` and
   returns it unchanged, performing **no** independent locus computation and **no**
   post-hoc rewrite (e.g. via `displayPath` / `maskNamesAt`). If masking *can* alter
   the returned `divergenceLocus`, T006's "returns the identical locus" claim is
   wrong on masked runs — report the scope.
2. Confirm `divergenceLocusOf(input) === stepCore(input).divergenceLocus` is a pure
   projection (no extra logic), so the test's stepper-leg is a faithful stand-in for
   the `stepInteraction` extraction surface, and that this stand-in is sound given
   the engine's existing `stepInteraction == stepCore` integration witnesses.

---

## 5. Obligations — scope and non-claims (do not let E0 overreach)

1. **No minimality.** Confirm no step of T006 asserts (or covertly uses) that `ξ`
   is a *minimal separating context* across opponent designs. E0 is single-run
   uniqueness only; minimality is [C012](../03_CONJECTURES/C012-separation-minimal-locus.md).
   Any leakage is a blocking defect.
2. **Fragment only.** Confirm the additive-violation/consensus-draw vacuity is stated
   as a genuine boundary (the lemma's reach), not silently assumed away — i.e. T006
   does not claim E0 for the additive / draw-loci settings (out of scope, Q-039).
3. **Registry linkage.** Confirm T006 is filed as `provisional`, does **not** claim
   to *close* Q-040, and that Q-040 / C012 reference it as the discharged warm-up
   (updated `depends-on` / `next-action`). Verify it updates rather than retires the
   question, per the register policy.

---

## 6. Obligations — corroborating computation (evidence only)

Per the register these cannot settle the lemma, but a *failure* here is a red flag.
Re-run; do not trust the recorded "green".

1. Execute the build command from T006's front-matter:
   `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`
   (Repo convention: prefer `yarn` / `npm run` wrappers; build `@app/sheaf-acl`
   first if a type error blocks the run — see repo instructions.)
2. Read [`divergence-locus-differential.test.ts`](../../tests/bridge/divergence-locus-differential.test.ts)
   and confirm the **independence** of its oracle `firstUnmatchedPositive`: it must
   share **no** code path with `stepCore`, or the differential check is a tautology.
   Confirm it asserts all three of (i) populated-exactly-on-`DIVERGENT`,
   (ii) field == oracle, (iii) field == `divergenceLocusOf`.
3. Confirm the harness genuinely enumerates every AF on `n ≤ 3` and that the
   "drop each Opponent O-act in turn" perturbation actually produces `DIVERGENT`
   runs (the test's `divergent > 0` assertion). If divergences are never exercised,
   the oracle agreement is vacuous — note it.
4. If any assertion fails or is skipped where T006 claims a clean pass, treat it as a
   blocking defect.

---

## 7. Deliverable

Produce **one** of the following, written into a new `## Cross-check notes` section
appended to [`T006-first-divergence-locus-e0.md`](T006-first-divergence-locus-e0.md):

- **Sign-off.** A statement that every obligation in §§1–6 was discharged, with a
  one-line note per section recording *how* you re-derived it (not "looks fine").
  Then update the front-matter: `status: established`,
  `cross-checked-by: <your handle>`, `cross-check-date: <YYYY-MM-DD>`, and confirm
  the Q-040 / C012 back-pointers still read correctly (E0 discharged; minimality
  open).

- **Defect list.** A numbered list of substantive problems. For each: the exact
  location (proof step, or file + symbol), why it is wrong or unjustified, and the
  minimal repair. Keep `status: provisional`. The two most likely residual gaps are
  (a) a `Date.now()` or ambient value that does gate a branch on some input (§1.1),
  and (b) the definedness-iff boundary case (§3.4) — if one of these is the sole
  outstanding item, say so explicitly and name it as the single blocker.

**Constraints.** Do not edit the proof to make it pass — only the author repairs
defects; you report them. Do not weaken any statement to force a sign-off, and do
not promote E0 toward minimality to make it look stronger. If you are uncertain on
any single obligation, the correct verdict is *defect list*, not sign-off.
