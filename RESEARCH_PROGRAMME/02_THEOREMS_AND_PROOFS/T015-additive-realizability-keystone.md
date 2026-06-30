# T015 — The additive realizability keystone: stable and preferred-admissibility are interactive; ⊆-maximality is a constraint

- **status:** established (2026-06-28; cross-checked, signed off — one-shot LB1+LB2, abstract-AF fragment; strategy-isomorphism mechanised 2026-06-29 at the abstract game-tree level, see §Scope). Additive (`&`/`⊕`) layer over T005.
- **closes (target):** the stable + admissibility branch of Q-039 / [C011](../03_CONJECTURES/C011-additive-preferred-games-bridge.md); pins the preferred maximality obstruction as the realizability characterization
- **depends-on:** [T005](T005-grounded-ludics-keystone.md) (the grounded, additive-free base case); [C011](../03_CONJECTURES/C011-additive-preferred-games-bridge.md) (the conjecture); session 21 (shared additive layer)
- **proved-by:** drafted 2026-06-28
- **cross-checked-by:** independent second reader, 2026-06-28 (signed off; no blocking defects)
- **last-reviewed:** 2026-06-28
- **source-of-proof:** this file
- **corroborating-computation:**
  [`../../tests/bridge/stepcore-additive.test.ts`](../../tests/bridge/stepcore-additive.test.ts)
  (kernel additive primitive),
  [`../../tests/bridge/additive-internalisation.test.ts`](../../tests/bridge/additive-internalisation.test.ts)
  (`⟦·⟧₊` reproduces grounded), and
  [`../../tests/bridge/preferred-stable-additive.property.test.ts`](../../tests/bridge/preferred-stable-additive.property.test.ts)
  (stable + preferred ⟺ oracle, every AF on `n ≤ 3`). Evidence only.
- **corroborating-mechanisation:**
  [`../mechanisation/agda/T015/T015.agda`](../mechanisation/agda/T015/T015.agda)
  (Agda 2.7.0.1, stdlib v2.0, `--safe --without-K`, no postulates/holes) mechanises
  the realizability trichotomy: clauses (1)–(3) parametric over an arbitrary
  `(Arg, ⇝)` (`n`-unbounded) — `stable⇔cf×orth`, `stable→admissible`/`∅-admissible`,
  `Preferred`/`preferred→admissible`; and the no-go (4) / boundary (5) on their
  canonical witnesses — `NoGo.Ec-not-preferred` (`{c}` ⊊ `{a,c}` both admissible) and
  `Boundary.boundary` (`{a}` stable yet not defended by ∅). LB1/LB2 and ⟦·⟧₊-fidelity
  are parameters; the trichotomy is the proved content. Evidence only (see
  [README](../mechanisation/agda/T015/README.md)).
- **build-instructions:** `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`; mechanisation: `agda T015/T015.agda` (from `RESEARCH_PROGRAMME/mechanisation/agda`)

> Methodology. The *prove* half of session 21's test-then-prove: Steps A–D
> corroborated the equivalences empirically; this entry gives the human-checked
> argument. The keystone is **not** a single biconditional like T005 — it is a
> *realizability trichotomy*: which Dung semantics the additive interaction reads
> off orthogonality, and which it cannot.

## Vocabulary

`F = (A, ⇝)` a finite AF; `att(x) = { y : y ⇝ x }`. For `E ⊆ A`: **conflict-free**
(no `e, e' ∈ E` with `e ⇝ e'`), **defends** `x` (every `y ∈ att(x)` has some
`e ∈ E` with `e ⇝ y`), **admissible** (conflict-free + defends each member),
**all-attacking** (every `b ∉ E` has some `e ∈ E`, `e ⇝ b`). Stable = conflict-free
+ all-attacking; preferred = ⊆-maximal admissible (Dung 1995). Credulous(σ): `a` in
*some* σ-extension; skeptical(σ): `a` in *every* σ-extension, with the **empty-σ
convention** (no σ-extension ⇒ skeptical false — the substrate's "nothing
justified" reading, [`disputeAdditive.ts`](../../lib/bridge/disputeAdditive.ts)).

**Additive translation `⟦·⟧₊`** (session 21 §2;
[`lib/bridge/disputeAdditive.ts`](../../lib/bridge/disputeAdditive.ts)): the dispute
design with `isAdditive` openers at branch points — `⊕` on a PRO-counter opener
(≥2 un-used counters), `&` on a PRO-assertion opener (≥2 attackers). A **commit**
is a `⊕`-resolution: a choice of one child per `⊕`-opener, generating a set `E`.
The **universal `&`-test** `T(E)` is the opponent behaviour superposing one
attack-line per argument: for each `b ∈ A` a `&`-branch raising `b` against `E`.
Orthogonality `⟦E⟧₊⁺ ⊥ T(E)` is the canonical predicate (`stepCore` ⇓ †), and by
the Step-A finding (`&` = ∀ over the pool) it means *every* `&`-branch converges.

**Load-bearing assumptions** (made explicit, mirroring T005's discipline):
- **LB1 (one-shot reading).** Acceptance is decided by the *commit-set + one-shot*
  orthogonality, not the recursive grounded descent: a `&`-branch `b` is **answered**
  by `E` iff `b ∈ E` (committed) or `∃ e ∈ E. e ⇝ b` (countered in one step). The
  kernel's exclusive-choice primitive (Step A) is the only additive mechanism;
  fuel-bounded ONGOING never occurs on `⟦E⟧₊` (finite, acyclic per commit). This is
  T015's modelling decision and its honest limit — see §Scope.
- **LB2 (universal test).** `T(E)` ranges over *all* `b ∈ A`; this is what makes
  orthogonality equal all-attacking. A finite-pool restriction would weaken (1).

## Theorem

For finite `F` and the additive translation:

1. **(Stable, one-shot)** `E` conflict-free is orthogonal to the universal
   `&`-test ⟺ `E` is all-attacking ⟺ `E` is a stable extension.
2. **(Admissibility, interactive)** `E` conflict-free defends every member ⟺ every
   `&`-branch attacking a committed `e` is answered by a committed counter; this is
   admissibility, realized by one-shot `&`-orthogonality (no recursive descent).
3. **(Preferred = maximal admissible)** preferred extensions are the ⊆-maximal
   admissible sets; credulous/skeptical preferred coincide with their additive
   counterparts.
4. **(Maximality non-interactive)** `⊆`-maximality has no per-pair orthogonality
   counterpart: there exist `E ⊊ E'` both passing every one-shot orthogonality
   test, distinguished only by the global `⊆`-relation. Maximality is a selection,
   not an interaction verdict.
5. **(Boundary)** The grounded interactive descent (PRO-no-repeat) does **not**
   compute stable: `2`-cycle `a ↔ b` has `{a}` stable yet PRO cannot re-assert `a`.

## Proof

**(1) Stable.** Under LB1+LB2, `⟦E⟧₊⁺ ⊥ T(E)` iff every `&`-branch `b ∈ A` is
answered. (⇒) Suppose orthogonal. Take `b ∉ E`: not committed, so it must be
countered, `∃ e ∈ E. e ⇝ b` — all-attacking. If some `e ⇝ e'` in `E`, the committed
attack opens an unanswered `&`-branch the conflicting member cannot close — so
conflict-free. (⇐) If `E` conflict-free + all-attacking, every `b∈E` is committed,
every `b∉E` countered, all branches converge — orthogonal. Hence conflict-free +
orthogonal ⟺ conflict-free + all-attacking = stable (Dung 1995). The `n≤3`
identity `stableExtensionsByAdditive = stableExtensions` corroborates. □

**(2) Admissibility.** `E` conflict-free defends member `x` iff each `y ∈ att(x)`
is answered by a committed counter (`∃ e ∈ E. e ⇝ y`); one round per attacker (the
`&`-branch over `att(x)`) decides it. Over all members: conflict-free +
defends-each = admissible. No descent — committed `E` supplies counters directly,
so T005's PRO-no-repeat trap (clause 5) cannot arise. □

**(3) Preferred.** ⊆-maximal admissible = preferred (Dung). `preferredExtensions`
`ByAdditive` keeps admissible commits, filters ⊆-maximal; credulous = membership in
some, skeptical = in all (≥1 exists, ∅ admissible). `n≤3` agreement corroborated. □

**(4) Maximality is non-interactive (no-go).** *Claim:* no predicate decided by
orthogonality on a single pair `⟨⟦E⟧₊⁺ ∣ T⟩` separates preferred from non-maximal
admissible. *Proof.* Orthogonality tests only whether `E` answers its branches — a
property closed under nothing about other admissible supersets. Witness: `a ↔ b`,
`c` isolated. `{c}` and `{a,c}` are both admissible, both orthogonal to their
universal tests, yet `{c} ⊊ {a,c}` so `{c}` is not preferred. Any per-pair verdict
accepts both or rejects both; only the global `∄ E' ⊋ E admissible` removes `{c}`.
Maximality needs the admissible lattice, not one interaction — a selection. □

**(5) Boundary.** Grounded descent forbids PRO re-asserting; `{a}` defends `a` only
by `a`, refused — descent rejects (grounded(`a↔b`)=∅), commit-set accepts (`{a}`
stable). The divide is exactly T005's additive-free boundary. □

## Worked instance (`a↔b`, `c` isolated)

admissible: ∅,{a},{b},{c},{a,c},{b,c}; stable: {a,c},{b,c}; preferred: {a,c},{b,c}.
Each passes one-shot orthogonality; ∅,{a},{b},{c} pruned only by ⊆. Frozen by
[`preferred-stable-additive.property.test.ts`](../../tests/bridge/preferred-stable-additive.property.test.ts)
Step-D finding.

## Scope

Abstract AF; `n ≤ 3` exhaustively corroborated; clauses (1)–(5) elementary hence
`n`-unbounded. **Honest limit:** this is the *one-shot* reading (LB1) — commit-set
+ per-attacker orthogonality, **not** the full strategy-preserving game
isomorphism C011 ultimately wants; for stable/admissibility the descent is
provably unnecessary (clause 2), but a `⊕`-resolution-vs-strategy isomorphism for
the general preferred game is future work. **Update 2026-06-29: the strategy-iso
is now mechanised** at the abstract game-tree level —
[`../mechanisation/agda/T015Strat/T015Strat.agda`](../mechanisation/agda/T015Strat/T015Strat.agda)
proves `strategy-iso : wins g ≡ true ⇔ Σ (r : Res g). evalRes r ≡ true`, i.e. the
branching AND-OR preferred-game verdict (⋁ defences / ⋀ attacks) is realized by a
concrete winning `⊕`-resolution (= PRO strategy), and conversely; n-unbounded over
finite game trees, `--safe --without-K`, no postulates/holes. Residual: this is the
strategy-realization of the game verdict, NOT Modgil–Caminada adequacy (game =
Dung preferred extensions), which stays cited. Partial settlement: stable +
preferred admissibility branch of C011; maximality = the realizability
characterization.

## Cross-check

Done — see `## Cross-check notes` below. Open items carried as non-blocking:
(c) reconcile with Q-002's `&`=∀; (d) `n`-unbounded mechanisation.

## Cross-check notes

**SIGNED OFF** — independent second reader, 2026-06-28. §§1–5 of the verification
prompt discharged; T015 → `established` (one-shot LB1+LB2, abstract-AF, pending
strategy-iso). C011 stable + preferred-admissibility branch settled; ⊆-maximality
fixed as the realizability characterization; Q-039 → partially-resolved-with-proof.

**§1 Corroboration.** Re-ran `jest tests/bridge/` (max-old-space 2048): 15 suites,
94 tests, **0 skips**. `stepcore-additive` (kernel 4/4), `additive-internalisation`
(`⟦·⟧₊`=grounded), `preferred-stable-additive.property` (stable + preferred ⟺
oracle, `n ≤ 3`) all green. `stableExtensionsByAdditive`/`preferredExtensions`
`ByAdditive` set-equal the oracle (`extKey`) on every AF, `n=1,2,3`.

**§2 Clause 1 (stable), conflict-free direction.** Re-derived. (⇒) all-attacking is
forced by LB2 (`T(E)` ranges over every `b∉E`); conflict-free needs LB2 too — a
committed `e⇝e'` raises a `&`-branch the conflicting member cannot close, so the
break is genuinely via the universal test, not assumed. (⇐) verified. Note the code
defines stable as `conflictFree ∧ allAttacking` directly, so orthogonality cannot
collapse to all-attacking-alone in the test; the semantic claim holds for LB1+LB2.
No counter-AF found.

**§3 Clauses 2/3.** `defends` is one round per attacker, no descent; `conflictFree ∧
defends-each` = `isAdmissibleByAdditive` = Dung admissible. Preferred = ⊆-maximal
admissible; `∅` admissible ⇒ ≥1 preferred exists (skeptical guard correct). Matches
`preferredExtensions`.

**§4 Clause 4 (maximality no-go).** Witness `a↔b`,`c` confirmed by hand: `{c}` and
`{a,c}` both conflict-free, both defend members, both orthogonal; `{c}⊊{a,c}`. The
no-go is genuine — one-shot orthogonality is closed under nothing about supersets,
so no per-pair verdict separates them; only the global lattice does. No honest local
predicate smuggles in maximality.

**§5 Clause 5 + LB1.** grounded(`a↔b`)=∅ yet `{a}` stable ⇒ descent≠stable. LB1
stated as the limit, not hidden; §Scope flags one-shot vs. strategy-iso correctly.
No over-read of orthogonality as the full game.

Non-blocking: tests are evidence over `n ≤ 3` only; clauses are pen-proof for
`n`-unbounded.

**Update 2026-06-29 — (d) n-unbounded mechanisation discharged.** The realizability
trichotomy is now mechanised in Agda
([`../mechanisation/agda/T015/T015.agda`](../mechanisation/agda/T015/T015.agda),
`--safe --without-K`, no postulates/holes): clauses (1)–(3) parametric over an
arbitrary `(Arg, ⇝)` (hence `n`-unbounded) — `stable⇔cf×orth` (clause 1),
`stable→admissible` + `∅-admissible` (clause 2, one-shot defense / no descent),
`Preferred` + `preferred→admissible` (clause 3); and the no-go (4) / boundary (5)
on their canonical witnesses — `NoGo.Ec-not-preferred` (the `{c}` ⊊ `{a,c}` gap, both
admissible) and `Boundary.boundary` (`{a}` stable yet not ∅-defended). LB1 (one-shot
reading, via `Defends`/`Answered`), LB2 (universal test, via `Orth`) and ⟦·⟧₊-fidelity
remain parameters — the human-review obligations — so this is evidence, not a
re-settlement; cross-check item (d) is retired. Item (c) (reconcile with Q-002's
`&`=∀) is shared with the [T012 mechanisation](../mechanisation/agda/T012/T012.agda);
the strategy-isomorphism (handoff item 2) is still future work.
