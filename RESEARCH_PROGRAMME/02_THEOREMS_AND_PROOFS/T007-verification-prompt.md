# Verification prompt — fully cross-check T007 (the minimal separating locus, linear-chronicle fragment)

> **Role.** You are an independent second reader. You did **not** author T007.
> Your job is to either (a) sign off on the theorem as *established*, or (b) return
> a numbered list of substantive defects, each with the precise location and the
> minimal repair you believe is required. Default to skepticism: a clean sign-off
> requires that *every* obligation below is discharged. Do **not** trust the
> proof's own summaries — re-derive against the kernel source and the translation
> spec.
>
> **Target.** [`T007-minimal-separating-locus.md`](T007-minimal-separating-locus.md)
> — the claim that, in the multiplicative additive-free T005 fragment **restricted
> to a single realized dispute chronicle**, (Lemma A) each opponent's
> first-divergence anchor `ξ(E)` is the `⊑`-least separating context for `(D, E)`,
> and (Lemma B) `Sep(D)` is a finite `⊑`-chain with a unique least element `ξ*`
> realised by a single run.
>
> **Scope reminder — what T007 is and is NOT.** T007 is the **rescoped** promotion
> of [C012](../03_CONJECTURES/C012-separation-minimal-locus.md): it is asserted only
> for a **single realized dispute chronicle** (a `⊑`-chain of loci in play). It does
> **not** claim the branching case — that overreaches the kernel and is the tracked
> follow-up [Q-041](../01_OPEN_QUESTIONS_REGISTRY.md#q-041) — nor the additive case
> ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039)). A sign-off must confirm the
> scope restriction is **load-bearing and honestly stated**, not quietly dropped.
> It builds on [T006](T006-first-divergence-locus-e0.md) (E0, established); any step
> that *covertly* assumes the branching generalisation is a blocking defect.
>
> **Programme rules you are bound by.** Read [`README.md`](README.md)
> (theorem-register policy) first. An entry must be (1) stated in formal
> vocabulary, (2) human-checkable in one sitting via lemmas, (3) cross-checked by a
> non-author, (4) tied to an open-question entry it retires or updates. Tests are
> **evidence, not proof**. Record your verdict in the format of the existing
> `## Cross-check notes` sections (see [T006](T006-first-divergence-locus-e0.md) for
> the model).

---

## 0. Source materials you must consult (do not work from T007 alone)

- **The theorem.** [`T007-minimal-separating-locus.md`](T007-minimal-separating-locus.md)
- **The conjecture it was promoted from (carries the obstruction analysis).**
  [`../03_CONJECTURES/C012-separation-minimal-locus.md`](../03_CONJECTURES/C012-separation-minimal-locus.md)
  — esp. *§Phase 1* (the order `⊑`), *§Phase 3* (Lemmas A/B, the Cross-check notes,
  and **Route (b) attempted — blocked at the kernel** with the empirical probe).
- **The warm-up it depends on.** [`T006-first-divergence-locus-e0.md`](T006-first-divergence-locus-e0.md)
  (E0 — first-divergence address unique and computable; established).
- **The pure kernel (the object of the proof).**
  [`../../packages/ludics-engine/stepCore.ts`](../../packages/ludics-engine/stepCore.ts)
  — `stepCore`, `findNextPositive` (note: **least-index, no reachability gate**),
  `findNextNegativeAtLocus`, the cursor updates, the three `DIVERGENT` break sites.
- **The pure order/reducer.**
  [`../../packages/ludics-engine/separation.ts`](../../packages/ludics-engine/separation.ts)
  — `isPrefixLocus` (segment-wise prefix `⊑`), `comparableLoci`, `minimalAnchor`
  (`exists` / `isChain`).
- **The translation spec.**
  [`../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md`](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)
  — §1.2–§1.3: `⟦a⟧⁺` opens **one child per attacker, recursively** (genuinely
  **branching**); the chronicle/dispute-round reading of depth.
- **The keystone.** [`T005-grounded-ludics-keystone.md`](T005-grounded-ludics-keystone.md).
- **The corroborating test + harness.**
  [`../../tests/bridge/separation-minimal-locus.test.ts`](../../tests/bridge/separation-minimal-locus.test.ts)
  — `buildPlayDesigns` (emits a single `⊑`-chain `locusAt(0…len)`), the opponent
  family (`separatingAnchors`, one dropped dual each), and the independent
  `shallowestPrefixLeast` oracle.

---

## 1. Obligations — the scope restriction (sequentiality by construction)

T007's whole correctness hinges on the restriction to a **single realized
chronicle**. Re-derive that this restriction does the work the proof says.

1. **Chronicle ⟹ `⊑`-chain in play.** Confirm that on a single realized dispute
   line the acts lie at a `⊑`-chain of loci `"0" ⊏ ξ₁ ⊏ ξ₂ ⊏ ⋯` and that **no two
   `⊑`-incomparable loci** are ever simultaneously in play. Confirm `buildPlayDesigns`
   actually realises this (`locusAt(t)` is a strict prefix of `locusAt(t+1)`).
2. **Index order = chronicle order.** Confirm that, *given* the chain hypothesis,
   `findNextPositive`'s least-index selection coincides with the chronicle order, so
   the off-thread hazard cannot arise **within scope**. Verify the proof does **not**
   attribute this to cursor mechanics in general (the discredited step) but to the
   scope restriction.
3. **The restriction is honest, not vacuous.** Confirm the branching case is
   genuinely *excluded*, not silently assumed away: read C012 §Phase 3 → Route (b)
   and confirm the probe result (`status DIVERGENT`, `divergenceLocus "0.1.1"` —
   off-thread — for a single test via the `0.2` line) is a real kernel behaviour, so
   the restriction is necessary. If T007 ever uses a fact that only holds for
   branching designs, that is a blocking defect.

---

## 2. Obligations — Lemma A (per-disagreement minimality)

1. **`ξ(E)` separates.** Confirm, via E0 (T006), that the trajectory matches every
   positive strictly before `ξ(E)` and breaks at the first unmatched positive there,
   and that on the chronicle every consulted act lies at a locus `⊑ ξ(E)` — so
   `⟨D ∣ E↾ξ(E)⟩` runs identically up to the break and diverges. Check the truncation
   `E↾ℓ` (acts at loci `⊑ ℓ`) is the one the proof uses.
2. **`ξ(E)` is least.** Confirm that for any strict prefix `ℓ ⊏ ξ(E)`, `⟨D ∣ E↾ℓ⟩`
   has only matched pairs and hits no `DIVERGENT` guard, and that on the fragment a
   non-divergent run (`CONVERGENT` / `STUCK` / `ONGOING`) means `ℓ` is **not**
   separating. Confirm `additive-violation` / `consensus-draw` vacuity is inherited
   from T006, not re-assumed. Conclude `ξ(E)` is the `⊑`-minimum; uniqueness is E0.
3. **No circularity with E0.** Confirm Lemma A *uses* E0's first-unmatched-positive
   characterisation but does not re-derive or contradict it.

---

## 3. Obligations — Lemma B (cross-opponent minimum)

1. **Anchors are `D`-positive loci (the test asymmetry).** Confirm that on the live
   `incoherent-move` divergence the offending positive is a **`D`-move**, and that
   this is justified by the **Opponent-as-test asymmetry** (the family perturbs only
   `E`, by withholding an answering O-act — the single-drop construction), **not** by
   a kernel guarantee that the moving side is always `D`. (The loop alternates
   `side`; verify the proof does not claim otherwise.)
2. **Converse — every `D`-positive locus is challengeable.** Confirm the `E_ℓ`
   construction (match `D` up to `ℓ`, withhold the dual at `ℓ`) yields `ξ(E_ℓ) = ℓ`,
   so `Sep(D)` is exactly the `D`-positive loci on the chronicle.
3. **Chain ⟹ unique least, realised.** Confirm `Sep(D)` inherits the chronicle's
   `⊑`-chain structure, that a finite non-empty chain has a unique least element
   (totality + antisymmetry), and that `ξ*` is realised by an actual opponent (a
   single run), not merely defined. Check this matches `minimalAnchor`'s contract in
   [`separation.ts`](../../packages/ludics-engine/separation.ts) (`exists` true,
   `isChain` true, `min` the prefix-least).

---

## 4. Obligations — the order `⊑` and the reducer (code ↔ proof)

1. **`⊑` is the prefix order, segment-wise.** Confirm `isPrefixLocus` compares
   dot-separated **segments** (so `"0.1" ⋢ "0.12"`), and that it is reflexive,
   antisymmetric, transitive with root `"0"` least — the partial order the proof
   names. Confirm `comparableLoci` and the `isChain` computation are consistent.
2. **`minimalAnchor` computes the `⊑`-least.** Confirm it returns `min` iff some
   anchor is a prefix of **all** anchors, that such a `min` is unique, and that
   `exists` / `isChain` mean what the proof relies on. Confirm it has **no shared
   code** with the test's `shallowestPrefixLeast` oracle (else the corroboration is a
   tautology).
3. **Purity.** Confirm `separation.ts` is zero-I/O (no prisma, clock, RNG), matching
   the purity the theorem leans on (as for `stepCore`).

---

## 5. Obligations — scope, boundary, and non-claims (do not let T007 overreach)

1. **Branching is out (Q-041).** Confirm T007 explicitly scopes out branching
   designs and cites the kernel obstruction (the off-thread mis-divergence probe), and
   that **no** proof step silently assumes a reachability-gated kernel. Confirm the
   probe witness in C012 §Phase 3 → Route (b) is reproducible (you may re-run a hand-
   built branching case against `stepCore`).
2. **Additive is out (Q-039).** Confirm the additive/preferred-stable case is not
   claimed.
3. **Absolute vs relative minimum.** Confirm the proof distinguishes Lemma A's
   **relative** minimum `ξ(E)` (the product-bearing object) from the trivial root
   `ξ₀` (the refuse-the-claim opponent), and that any implementation guidance sources
   the frontier from Lemma A, with `ξ₀` only as the floor. A conflation is a defect.
4. **Registry linkage.** Confirm T007 is filed `provisional`, that it `closes: Q-040`
   **only for the multiplicative linear-chronicle fragment**, and that Q-040 records
   the partial closure while Q-041 (branching) and Q-039 (additive) remain open and
   are referenced. Verify C012's status reads `promoted` and points at T007.

---

## 6. Obligations — corroborating computation (evidence only)

1. Execute the build command from T007's front-matter:
   `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`
   (Build `@app/sheaf-acl` first if a type error blocks the run — see repo
   instructions.) Confirm the 7 assertions of
   [`separation-minimal-locus.test.ts`](../../tests/bridge/separation-minimal-locus.test.ts)
   pass; do not trust the recorded "green".
2. Confirm the harness genuinely enumerates every AF on `n ≤ 3`, that the opponent
   family produces `DIVERGENT` runs (so `Sep(D)` is non-empty for some `D`), and that
   it asserts: existence + uniqueness of `ξ*`, the floor property, realisation by an
   enumerated opponent, and **`isChain` true throughout**. If `isChain` is ever false
   in-fragment, Lemma B's chain claim is contradicted — blocking.
3. Confirm the independence of `shallowestPrefixLeast` from `minimalAnchor` (no shared
   code), so the existence check is differential, not a restatement.
4. Optionally reproduce the branching counter-probe (C012 §Phase 3 → Route (b)) to
   confirm the scope restriction is necessary, not cosmetic.

---

## 7. Deliverable

Produce **one** of the following, written into a new `## Cross-check notes` section
appended to [`T007-minimal-separating-locus.md`](T007-minimal-separating-locus.md):

- **Sign-off.** A statement that every obligation in §§1–6 was discharged, with a
  one-line note per section recording *how* you re-derived it (not "looks fine").
  Then update the front-matter: `status: established`,
  `cross-checked-by: <your handle>`, `cross-check-date: <YYYY-MM-DD>`, and confirm
  the Q-040 (partial close) / Q-041 / Q-039 / C012 back-pointers still read correctly.

- **Defect list.** A numbered list of substantive problems. For each: the exact
  location in T007, why it fails (re-derived against the kernel / spec, not asserted),
  and the minimal repair. Mark each blocking or non-blocking. A single blocking
  defect withholds promotion to `established`.
