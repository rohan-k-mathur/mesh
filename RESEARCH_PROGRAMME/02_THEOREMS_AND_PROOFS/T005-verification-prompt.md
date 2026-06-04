# Verification prompt — fully cross-check T005 (grounded ↔ Ludics keystone)

> **Role.** You are an independent second reader. You did **not** author T005.
> Your job is to either (a) sign off on the theorem as *established*, or
> (b) return a numbered list of substantive defects, each with the precise
> location and the minimal repair you believe is required. Default to
> skepticism: a clean sign-off requires that *every* obligation below is
> discharged. Do **not** trust the proof's own summaries — re-derive.
>
> **Target.** [`T005-grounded-ludics-keystone.md`](T005-grounded-ludics-keystone.md)
> — the claim that, for every finite abstract AF `F = (A, ⇝)` and `a ∈ A`,
> `a ∈ grounded(F) ⟺ a` is accepted by interaction
> (`∃σ ∀τ. ⟨⟦σ⟧ ∣ ⟦τ⟧⟩ ⇓ †`), strategy-preservingly.
>
> **Programme rules you are bound by.** Read
> [`README.md`](README.md) (theorem-register policy) first. A theorem must be
> (1) stated in formal vocabulary, (2) human-checkable in one sitting via
> lemmas, (3) cross-checked by a non-author, (4) tied to a retired open
> question. Tests are **evidence, not proof** — passing tests can corroborate
> but never discharge a proof obligation. Record your verdict in the format of
> the existing `## Cross-check notes` sections (see
> [`T004-jsl-fragment-bridge.md`](T004-jsl-fragment-bridge.md) for the model).

---

## 0. Source materials you must consult (do not work from T005 alone)

Read these before forming any judgement. The proof's correctness depends on
each matching what T005 asserts about it.

- **The theorem.** [`T005-grounded-ludics-keystone.md`](T005-grounded-ludics-keystone.md)
- **The translation spec + Phase-2 findings.**
  [`../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md`](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)
- **The Phase-0 predicate audit (Lemma A's external appeal).**
  [`../10_IDEATION_SESSIONS/02-foundational-bridge-dung-ludics-2026-06-02.md`](../10_IDEATION_SESSIONS/02-foundational-bridge-dung-ludics-2026-06-02.md)
  §0b, decisions D0.1 (canonical predicate = CONVERGENT) and D0.2 (ONGOING).
- **The grounded engine.**
  [`../../lib/argumentation/labelling.ts`](../../lib/argumentation/labelling.ts)
  (`groundedLabelling`, `groundedExtension`).
- **The bridge artefact.** [`../../lib/bridge/dispute.ts`](../../lib/bridge/dispute.ts)
  (`attackersOf`, `interact`, `enumerateStrategies`, `disputeWins`,
  `acceptableByInteraction`) and [`../../lib/bridge/types.ts`](../../lib/bridge/types.ts).
- **The canonical orthogonality closure.**
  [`../../packages/ludics-engine/behaviourClosure.ts`](../../packages/ludics-engine/behaviourClosure.ts)
  and the `stepInteraction` implementation it rests on.
- **The corroborating tests.**
  [`../../tests/bridge/keystone-simulation.exhaustive.test.ts`](../../tests/bridge/keystone-simulation.exhaustive.test.ts)
  and [`../../tests/bridge/grounded-biorthogonal.property.test.ts`](../../tests/bridge/grounded-biorthogonal.property.test.ts).

---

## 1. Obligations — Lemma C (game adequacy, the substantive content)

Lemma C claims: PRO wins the grounded discussion game `G(F, a)` ⟺ `a ∈ grounded(F)`.
This lemma is self-contained (no Ludics). Verify it *independently of the rest*.

1. **Operator fixpoint.** Confirm `Φ(S) = { x : ∀ y ∈ att(x), ∃ z ∈ att(y) ∩ S }`
   is monotone, that its least fixpoint equals the `IN`-set of the grounded
   labelling as defined in §Vocabulary, and that `rank` is well-defined on
   `grounded(F)`. Check the base claim `Φ¹(∅) = { x : att(x) = ∅ }` precisely.
   Flag any gap between "least complete labelling" (Caminada) and "least fixpoint
   of Φ" — these must be the *same* set, not merely related.
2. **(⇐) direction.** Re-run the rank induction for "PRO wins". Verify in
   particular the **no-repeat interaction**: that the chosen `z'` of rank `< r`
   is genuinely distinct from *every* previously asserted PRO argument (not just
   the immediately preceding one), so the repetition rule never blocks PRO.
   Confirm the base case (`rank = 1`, CON immediately stuck) and that strictly
   decreasing rank bounded below by 1 forces termination at a CON-stuck node.
3. **(⇒) direction (contrapositive).** Re-run the invariant argument
   ("PRO's current argument is not `IN`") for both the `OUT` and `UNDEC` cases.
   Check the two sub-claims that make CON never-stuck:
   - an `OUT` argument has an `IN` attacker, whose attackers are all `OUT`;
   - an `UNDEC` argument has an `UNDEC` attacker (and no `IN` attacker), whose
     attackers contain no `IN`.
   Verify the `UNDEC` case's "not all attackers OUT ⟹ some attacker UNDEC" step
   from the labelling definition. Confirm finiteness of `A` + PRO no-repeat ⟹ no
   infinite play, hence PRO (not CON) is the stuck player.
4. **Asymmetry load-bearing check.** Confirm the proof actually *uses* the
   asymmetric repetition rule (PRO no-repeat, CON may repeat) and that an odd
   cycle (e.g. `a ⇝ a`, or a 3-cycle) is correctly handled by both directions.
   Construct the smallest counterexample-candidate where symmetric repetition
   would give the wrong answer and confirm T005's rule gives the right one.

---

## 2. Obligations — Lemma B (strategy bijection) and the quantifier

Lemma B claims `⟦·⟧` is a bijection PRO-strategies ↔ Proponent designs and
CON-strategies ↔ Opponent tests, with `σ` beats `τ` ⟺ `⟦σ⟧ ⊥ ⟦τ⟧`, hence
`PRO wins ⟺ a accepted by interaction`.

1. **Bijection well-definedness.** Verify the claim that a Proponent design
   based at `⟦a⟧⁺` is *exactly* a prefix-closed set of alternating chronicles
   (single continuation at PRO-loci, one continuation per ramification at
   CON-loci) and that this is the same data as a PRO choice function. Check that
   a "strategy must answer every test" (totality over opponent moves) is what
   forces the cartesian merge in `enumerateStrategies`, and that nothing is
   double-counted or omitted (injectivity **and** surjectivity).
2. **Single-play determinacy.** Confirm that a fixed `(σ, τ)` co-determine a
   *unique* play (not a tree), so "σ beats τ" is a well-defined bit, and that
   this bit equals `⟦σ⟧ ⊥ ⟦τ⟧` via Lemma A.
3. **Quantifier swap.** Verify `∃σ ∀τ (σ beats τ)` ⟺ "some Proponent design
   orthogonal to every Opponent test" is a faithful reading of
   `acceptableByInteraction`, with no hidden reordering of quantifiers and no
   conflation of "orthogonal to every *enumerated* test" with "orthogonal to
   every test in the behaviour" (decision #4 in `dispute.ts` restricts the
   universe to enumerated strategy designs — confirm this restriction is sound,
   i.e. enumerated tests suffice to witness non-orthogonality).

---

## 3. Obligations — Lemma A (simulation) and its external appeal

Lemma A claims the canonical interaction traverses exactly the dispute line and
`⇓ †` (CONVERGENT) ⟺ the line ends with CON stuck.

1. **Fragment confinement.** Verify the translation really stays in the
   multiplicative, additive-free fragment: distinct subaddresses per attacker
   (encoding decision #3), so no two PRO ramifications collide. Confirm that
   *if* this fails, the reduction to a plain alternating walk fails — i.e. that
   the scope restriction is genuinely necessary, not decorative.
2. **The external appeal.** Lemma A *cites* (does not re-prove) the Phase-0
   characterisation (session 02 §0b, D0.1/D0.2): on this fragment,
   `stepInteraction = CONVERGENT` coincides with locus-matched alternating
   daimon traversal, and `ONGOING` never fires. **Read §0b and judge whether
   that characterisation is actually established there or merely asserted.** If
   it is only asserted, T005 must remain `provisional` regardless of the rest;
   say so explicitly and recommend the mechanisation in §Future-work item 2.
3. **`interact` faithfulness.** Read `interact` in `dispute.ts` and confirm
   line-by-line that it implements: start at `a` with `used = {a}`; alternate
   CON/PRO; CON reads `att(current)` (empty ⟹ CONVERGENT via PRO's †); PRO reads
   `att(current) \ used` (empty ⟹ DIVERGENT) else advance and extend `used`.
   Confirm the length bound `2·|A| + 1` and that `ONGOING` is unreachable.
4. **Daimon placement.** Confirm `†` is played by PRO *exactly* when CON is
   stuck (decision #2) and that this is the unique convergence event — not, e.g.,
   also when PRO is stuck.

---

## 4. Obligations — artefact ↔ statement correspondence

The proof leans on `dispute.ts` matching `G(F, a)` as defined in §Vocabulary.
This is a *faithfulness* obligation: a divergence here voids the lemmas even if
the math is sound.

1. Map each clause of the §Vocabulary game definition (`U(ℓ)`, the asymmetric
   repetition rule, the win condition, `proAtCon`/`proAtPro` positions) to the
   exact code in `dispute.ts`. Note any mismatch (e.g. if `used` threads PRO+CON
   moves rather than PRO-only, the no-repeat rule would be wrong).
2. Confirm `disputeWins(F, a)` computes "PRO wins every play" (∀ over CON) and
   `acceptableByInteraction(F, a)` computes the `∃σ ∀τ` realizability reading,
   and that they are **not** accidentally the same function.
3. Confirm `attackersOf` matches `att(x) = { y : y ⇝ x }` orientation (a common
   bug is reversing attacker/target).

---

## 5. Obligations — corroborating computation (evidence only)

Per the register, these cannot settle the theorem, but a *failure* here is a
red flag that the math is wrong. Re-run them; do not trust the recorded "green".

1. Execute the build command from T005's front-matter:
   `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`
   (Repo convention: prefer `yarn`/`npm run` wrappers; build `@app/sheaf-acl`
   first if a type error blocks the run — see repo instructions.)
2. Confirm the exhaustive test genuinely enumerates **all** `2^(n²)` AFs for the
   stated `n` (no silent skips beyond the documented `n ≤ 3` enumeration bound
   for Lemma A+B) and that `disputeWins ⟺ grounded` is checked against the
   *consolidated* engine in `lib/argumentation/labelling.ts`, not a re-implementation.
3. Confirm the property test's generator covers cycles, self-attacks, and
   isolated arguments. If coverage is thin, note it.
4. If any test fails or is skipped where T005 claims a clean pass, treat it as a
   blocking defect.

---

## 6. Obligations — scope and non-claims

Confirm T005 does **not** silently overreach:

1. Abstract AF only (no ASPIC+ structure / preferences). Confirm no step
   secretly assumes structured arguments.
2. Grounded only. Confirm the `∃σ ∀τ` quantifier is tied to the skeptical
   well-founded reading and is **not** claimed to give stable/preferred.
3. No additives. Confirm the "distinct subaddress" restriction is stated as a
   genuine boundary and that Lemma A's reduction is acknowledged to fail outside
   it.
4. Confirm the open-question linkage: Q-038 / C010 (abstract-AF, grounded case)
   in [`../01_OPEN_QUESTIONS_REGISTRY.md`](../01_OPEN_QUESTIONS_REGISTRY.md) and
   [`../03_CONJECTURES/C010-grounded-orthogonality-bridge.md`](../03_CONJECTURES/C010-grounded-orthogonality-bridge.md)
   — verify the theorem closes exactly that fragment and no more.

---

## 7. Deliverable

Produce **one** of the following, written into a new `## Cross-check notes`
section appended to [`T005-grounded-ludics-keystone.md`](T005-grounded-ludics-keystone.md):

- **Sign-off.** A statement that every obligation in §§1–6 was discharged, with
  a one-line note per section recording *how* you re-derived it (not "looks
  fine"). Then update the front-matter: `status: established`,
  `cross-checked-by: <your handle>`, `cross-check-date: <YYYY-MM-DD>`, and in
  [`../01_OPEN_QUESTIONS_REGISTRY.md`](../01_OPEN_QUESTIONS_REGISTRY.md) move
  Q-038's grounded fragment from "provisional pending cross-check" to
  "closed-by-proof".

- **Defect list.** A numbered list of substantive problems. For each: the exact
  location (lemma + step, or file + symbol), why it is wrong or unjustified, and
  the minimal repair. Keep `status: provisional`. If the only outstanding item
  is Lemma A's external appeal (§3.2), say so explicitly and recommend it as the
  single blocker, since that is the most likely residual gap.

**Constraints.** Do not edit the proof to make it pass — only the author repairs
defects; you report them. Do not weaken any statement to force a sign-off. If
you are uncertain on any single obligation, the correct verdict is *defect list*,
not sign-off.
