# Verification prompt — fully cross-check T008 (the minimal separating context over daimon-closed counter-designs, linear-chronicle fragment)

> **Role.** You are an independent second reader. You did **not** author T008.
> Your job is to either (a) sign off on the theorem as *established*, or (b) return
> a numbered list of substantive defects, each with the precise location and the
> minimal repair you believe is required. Default to skepticism: a clean sign-off
> requires that *every* obligation below is discharged. Do **not** trust the
> proof's own summaries — re-derive against the kernel source and the harnesses.
>
> **Target.** [`T008-minimal-separating-context-daimon-closed.md`](T008-minimal-separating-context-daimon-closed.md)
> — the claim that, in the multiplicative additive-free T005 fragment restricted to
> a single realized dispute chronicle and quantifying over **complete daimon-closed
> counter-designs** (proper tests), (1) every concession `Concede_j` (`j` odd,
> `d_j ⊏ ξ(E)`) converges, (2) the genuine refusal diverges at `ξ(E)`, (3) hence
> `ξ(E)` is the `⊑`-**minimal** separating context — recovering the minimality
> T007's cross-check refuted for raw truncations — and the **faithfulness lemma**
> (Lemma F) characterizing where `stepCore ∘ ⟦·⟧` is faithful (proper tests) vs
> unfaithful (raw truncations).
>
> **Scope reminder — what T008 is and is NOT.** T008 is **route R2** of
> [session 04](../10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md):
> it redefines the *objects* (separating context = complete daimon-closed
> counter-design), it does **not** change the kernel verdict (R1 is parked). It
> covers the **linear chronicle** only (Q-041 **O1**); branching (**O2**) is **out
> of scope**. It recovers minimality **abstractly** — it does **not** license
> sourcing `ξ*` from `stepCore` on partial inputs (the rewire stays gated on a
> verified extractor). A sign-off must confirm: the leastness claim was a
> *conjecture, not a premise* (proved, not assumed); the parity-dissolution claim
> is genuine; and the faithfulness boundary is exact and honestly bounded.
>
> **Programme rules you are bound by.** Read [`README.md`](README.md)
> (theorem-register policy) first. An entry must be (1) stated in formal
> vocabulary, (2) human-checkable in one sitting via lemmas, (3) cross-checked by a
> non-author, (4) tied to an open-question entry it retires or updates. Tests are
> **evidence, not proof**. Record your verdict in the format of the existing
> `## Cross-check notes` sections (see [T006](T006-first-divergence-locus-e0.md) /
> [T007](T007-minimal-separating-locus.md) for the model).

---

## 0. Source materials you must consult (do not work from T008 alone)

- **The theorem.** [`T008-minimal-separating-context-daimon-closed.md`](T008-minimal-separating-context-daimon-closed.md)
- **The decision that ratified R2.** [`../10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md`](../10_IDEATION_SESSIONS/04-separating-context-predicate-decision-2026-06-04.md)
  — §2 (the crux: raw truncation vs proper counter-design), §6 (R2 ratified, R1
  parked), §7 (the open question "does the parity artifact dissolve?" — T008 answers
  yes; check it).
- **The narrowed theorem it builds atop.** [`T007-minimal-separating-locus.md`](T007-minimal-separating-locus.md)
  — esp. `## Cross-check notes` / Repair 1 (the length-5 witness; *why* raw
  truncation breaks leastness; the "over-run is a justified `D`-move" /
  "daimon-padding does not work" probes).
- **The warm-up.** [`T006-first-divergence-locus-e0.md`](T006-first-divergence-locus-e0.md) (E0).
- **The pure kernel (the object of the proof).**
  [`../../packages/ludics-engine/stepCore.ts`](../../packages/ludics-engine/stepCore.ts)
  — the `side`-flip alternation, `findNextPositive` (note **`kind === "DAIMON"` ⇒
  `CONVERGENT`**), `findNextNegativeAtLocus`, the cursor updates, the `DIVERGENT`
  break sites; the daimon's *structural* placement.
- **The pure order.** [`../../packages/ludics-engine/separation.ts`](../../packages/ludics-engine/separation.ts)
  — `isPrefixLocus` (segment-wise `⊑`).
- **The daimon's encoding precedent.** [`../../tests/bridge/stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
  — `buildPlayDesigns` appends `†` (the structural CON-stuck rule) and the kernel
  reads it as `CONVERGENT`; the precedent T008's `Concede_j` reuses.
- **The corroborating harness (evidence).** [`../../tests/bridge/separation-daimon-closed-harness.test.ts`](../../tests/bridge/separation-daimon-closed-harness.test.ts)
- **The contrast harness (must be unmodified).** [`../../tests/bridge/separation-truncation-harness.test.ts`](../../tests/bridge/separation-truncation-harness.test.ts)
- **The keystone + translation spec.** [`T005-grounded-ludics-keystone.md`](T005-grounded-ludics-keystone.md),
  [`../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md`](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md).

## 1. Definitions are Girard-faithful and over the right objects

1.1 Confirm Definition 1 (complete daimon-closed counter-design) is the *Locus
Solum* proper-test notion: an action (proper or `†`) at every reachable positive
turn; a raw truncation is *partial* (absent at its first positive turn past `ℓ`).
1.2 Confirm Definition 3's `⊑` is taken over **proper tests / frontiers**, not over
raw anchors or truncations — the session-04 §2 correction. A `⊑` quietly still over
truncations is a blocking defect.
1.3 Confirm `Concede_j` and `Refuse` (Definition 2) are *complete* in the sense of
1.1 (each has an act at every positive turn it reaches), and that `Refuse` is the
same single-dropped-dual opponent T007 used (so `ξ(Refuse) = ξ(E)`).

## 2. Lemma 0 (alternation parity) against the kernel

2.1 Re-derive Lemma 0 from `stepCore`'s `side` initialization (`'A'`) and the
one-flip-per-matched-pair update. Confirm: after `t+1` matched pairs the test is to
move iff `t` is even (equivalently `D` to move iff `t` odd). This is the load-bearing
parity fact for both (1) and (2).

## 3. The three proof parts against the kernel source

3.1 **(1) Concessions converge.** Trace `⟨D ∣ Concede_j⟩` (`j` odd) in `stepCore`:
all `j` pairs at `d_0..d_{j-1}` match (both designs carry their proper chronicle),
then by Lemma 0 it is the **test's** turn, `findNextPositive` selects `†@d_j`, and
`kind === "DAIMON"` ⇒ `CONVERGENT`. **Critically verify** the `†` is reached
*before* any `D` over-run (contrast T007's finding that for a raw truncation the
over-run is on `D`'s turn) — i.e. that completeness, not padding, is what flips the
verdict. Reproduce on the length-5 fixture (`j = 1, 3`).
3.2 **(2) Refusal separates at `ξ(E)`.** Trace `⟨D ∣ Refuse⟩`: pairs match through
`d_{2m-1}`, then by Lemma 0 it is `D`'s turn, `P@d_{2m}` has no dual in `Refuse`,
break `DIVERGENT` `incoherent-move` at `ξ(E)`. Confirm this is E0/T006 and identical
to T007 Lemma A *separates*.
3.3 **(3) Leastness.** Confirm `SepProper(D,E) = { ξ(E) }`: odd frontiers host
`Concede_j` (converge), even frontiers `d_{2i} ⊏ ξ(E)` reduce to `Concede_{2i+1}`
(converge), only `ξ(E)` separates. Confirm minimality is *concluded*, not assumed.

## 4. Faithfulness lemma + failure characterization

4.1 **Lemma F.** Confirm: on a frontier-complete test, the only fragment exit
branches are `DAIMON ⇒ CONVERGENT` and `unmatched-positive-at-carried-locus ⇒
DIVERGENT`; `STUCK`/`ONGOING` cannot occur; so kernel verdict = abstract verdict.
4.2 **Failure characterization / R1 spec.** Confirm the unfaithfulness set is
**exactly** the non-frontier-complete tests (raw truncations), with trigger "(a)
test's turn by parity, (b) test carries no act at `ℓ'`, and `ℓ' ≠ ξ(E)`," and that
the faithful verdict there is `CONVERGENT` (D wins by default of a completed test).
Confirm this is presented as the *parked-R1 spec* requiring an input completeness
flag — not implemented (R1 stays parked), and that it would have to preserve the
T005 discharge test and the integration witnesses.

## 5. Corroboration discipline

5.1 Re-run `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`;
confirm all suites green and that the new daimon-closed harness asserts what §Proof
claims (concessions converge; refusal diverges at `ξ(E)`).
5.2 Confirm [`separation-truncation-harness.test.ts`](../../tests/bridge/separation-truncation-harness.test.ts)
is **unmodified** (the contrast fixture) and [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
(T005) is green and unweakened.
5.3 Confirm the harness is evidence, not proof, and the file says so.

## 6. Scope honesty

6.1 Confirm O2 (branching) is still open and not covertly assumed.
6.2 Confirm the **rewire stays gated**: T008 recovers minimality *abstractly*;
operational sourcing of `ξ*` needs a verified extractor (feed proper tests) or R1.
6.3 Confirm registry linkage: Q-041 O1 partially discharged (daimon-closed object);
Q-040 still not closed operationally; the additive case stays under Q-039.

---

## Verdict format

Record under a new `## Cross-check notes` section in T008, in the style of T006/T007:
a numbered discharged-obligations list and, if any, a numbered defect list (mark any
**BLOCKING**). A clean sign-off flips `status` to `established (provisional → )` and
sets `cross-checked-by` / `cross-check-date`. Any covert assumption of branching, any
`⊑` still over truncations, or any claim that the rewire is now licensed, is a
blocking defect.
