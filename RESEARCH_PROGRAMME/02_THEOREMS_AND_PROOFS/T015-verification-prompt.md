# Verification prompt — fully cross-check T015 (additive realizability keystone)

> **Role.** You are an independent second reader. You did **not** author T015.
> Either (a) sign off as *established*, or (b) return a numbered list of
> substantive defects, each with location + minimal repair. Default to skepticism:
> a clean sign-off requires *every* obligation below discharged. Re-derive the Dung
> theory yourself; re-run the differential tests; build the bridge AFs by hand.
>
> **Target.** [`T015-additive-realizability-keystone.md`](T015-additive-realizability-keystone.md)
> — the claim that under the additive translation `⟦·⟧₊`, (1) stable extensions =
> conflict-free sets orthogonal to the universal `&`-test, (2) admissibility = one-
> shot `&`-orthogonality, (3) preferred = ⊆-maximal admissible, (4) ⊆-maximality
> has **no** single-pair orthogonality counterpart, (5) the grounded descent does
> not compute stable. The headline is a **realizability trichotomy**, not a single
> biconditional.
>
> **Scope reminder — what T015 is NOT.** It is the **one-shot** reading (LB1): the
> `⊕`-commit-set + per-attacker orthogonality, **not** the full strategy-preserving
> game isomorphism C011 ultimately wants. It does **not** mechanise `n`-unbounded
> (clauses are pen-proof; tests are `n ≤ 3`). It does **not** close Q-002 (that is
> the participant axis). A sign-off is conditional on LB1+LB2 and must flag any step
> that silently assumes the strategy-isomorphism or over-reads the kernel.
>
> **Programme rules.** Read [`README.md`](README.md) first. A theorem must be (1)
> formally stated, (2) human-checkable in one sitting, (3) cross-checked by a
> non-author, (4) tied to the open-question entry it updates. The tests are
> **evidence, not proof** — green over `n ≤ 3` corroborates but does not settle the
> `n`-unbounded clauses. Record your verdict in a `## Cross-check notes` section
> appended to T015.

---

## 0. Source materials (do not work from T015 alone)

- **The theorem.** [`T015-additive-realizability-keystone.md`](T015-additive-realizability-keystone.md)
- **The grounded base case.** [`T005-grounded-ludics-keystone.md`](T005-grounded-ludics-keystone.md)
  (the additive-free boundary clause 5 claims to cross).
- **The conjecture + cluster scoping.** [`../03_CONJECTURES/C011-additive-preferred-games-bridge.md`](../03_CONJECTURES/C011-additive-preferred-games-bridge.md),
  [`../10_IDEATION_SESSIONS/21-additive-layer-translation-spec-stable-first-2026-06-28.md`](../10_IDEATION_SESSIONS/21-additive-layer-translation-spec-stable-first-2026-06-28.md)
  (§1 the kernel one-primitive finding, §3 stable/preferred grading).
- **The translation + readings.** [`../../lib/bridge/disputeAdditive.ts`](../../lib/bridge/disputeAdditive.ts)
  (`buildAdditiveDisputeDesign`, `conflictFree`, `allAttacking`, `isAdmissibleByAdditive`,
  stable/preferred extension + credulous/skeptical).
- **The kernel primitive.** [`../../packages/ludics-engine/stepCore.ts`](../../packages/ludics-engine/stepCore.ts)
  (`isAdditive` / `usedAdditive` / `additive-violation`).
- **The Dung oracle.** [`../../lib/argumentation/semantics.ts`](../../lib/argumentation/semantics.ts)
  (`stableExtensions`, `preferredExtensions`) and [`../../lib/argumentation/labelling.ts`](../../lib/argumentation/labelling.ts).

## 1. Re-run the corroboration yourself

`node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`. Confirm
[`stepcore-additive.test.ts`](../../tests/bridge/stepcore-additive.test.ts) (kernel
4/4), [`additive-internalisation.test.ts`](../../tests/bridge/additive-internalisation.test.ts)
(`⟦·⟧₊`=grounded), [`preferred-stable-additive.property.test.ts`](../../tests/bridge/preferred-stable-additive.property.test.ts)
(stable + preferred ⟺ oracle) all green. Confirm `stableExtensionsByAdditive` /
`preferredExtensionsByAdditive` set-equal the oracle over `n ≤ 3`, zero skips.

## 2. Clause 1 (stable) — the load-bearing one

Re-derive `conflict-free E ⊥ T(E) ⟺ conflict-free + all-attacking` from LB1+LB2.
Scrutinise the **conflict-free direction** hardest: T015 claims a committed `e ⇝ e'`
"opens an unanswered `&`-branch." Confirm this needs LB2 (the universal test raising
`e'`) and is not silently assuming conflict-freedom. Confirm the (⇐) direction: every
`b∈E` committed, every `b∉E` countered. Flag if orthogonality ⟺ all-attacking
without conflict-freedom (it should not — exhibit a counter-AF if so).

## 3. Clause 2 / 3 (admissibility, preferred)

- Clause 2: confirm defends-each is one-round per attacker (no descent) and that
  conflict-free + defends-each = admissible matches `isAdmissibleByAdditive`.
- Clause 3: confirm ⊆-maximal admissible = preferred (Dung) and the credulous/
  skeptical defs (incl. ∅ admissible ⇒ preferred always exists). Verify against
  `preferredExtensions`.

## 4. Clause 4 (maximality no-go) — scrutinise hardest

This is the publishable content. Confirm the witness `a↔b`+`c`: `{c}` and `{a,c}`
both admissible, both orthogonal, `{c}⊊{a,c}`. Verify the no-go is genuine — that
*no* per-pair orthogonality verdict separates them — and not merely that *this*
predicate doesn't. Flag if maximality could be smuggled into the test via a non-
local opponent pool (would that be a third LB? is it honest?).

## 5. Clause 5 + LB1 (boundary, the honest limit)

Confirm grounded(`a↔b`)=∅ and `{a}` stable, so descent≠stable. Confirm LB1 (one-
shot, not strategy-iso) is stated as the limit, not hidden: stable/admissibility
need no descent, but the general preferred strategy-isomorphism is future work.
Flag any place T015 over-reads one-shot orthogonality as the full game.

## 6. Verdict

Append a `## Cross-check notes` section with one of:
- **SIGNED OFF** — §§1–5 discharged; T015 → `established` (one-shot, abstract-AF,
  pending strategy-iso); C011 stable/admissibility branch settled, maximality =
  realizability char; Q-039 → partially-resolved-with-proof.
- **DEFECTS** — numbered, location + minimal repair, **blocking** vs **non-blocking**.
  Call out: (a) clause-1 conflict-free direction failing; (b) a per-pair predicate
  that *does* separate preferred (clause-4 break); (c) test/paper mismatch; (d) LB1
  over-read as strategy-isomorphism.
