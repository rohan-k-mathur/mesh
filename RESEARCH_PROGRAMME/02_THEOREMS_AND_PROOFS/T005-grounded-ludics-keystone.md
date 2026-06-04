# T005 — The grounded↔Ludics keystone: grounded membership coincides with canonical-orthogonality acceptance of the translated dispute designs

- **status:** established (2026-06-03; cross-checked, sole blocking defect discharged — grounded / abstract-AF fragment only, see §Scope)
- **closes:** Q-038 (the grounded fragment); positively settles C010 on the abstract-AF / grounded case
- **depends-on:** — (self-contained; cites the Phase-0 fragment analysis in session 02 §0b for Lemma A's appeal to the canonical predicate, now discharged computationally — see §"Discharge of the blocking defect")
- **proved-by:** drafted 2026-06-03 (Phase 3 of the foundational bridge, direction 1)
- **cross-checked-by:** independent second reader, 2026-06-03 (one blocking defect raised — Lemma A's external appeal — and subsequently discharged by the author; see Cross-check notes)
- **cross-check-date:** 2026-06-03
- **last-reviewed:** 2026-06-03
- **source-of-proof:** this file
- **corroborating-computation:**
  [`../../tests/bridge/keystone-simulation.exhaustive.test.ts`](../../tests/bridge/keystone-simulation.exhaustive.test.ts)
  (deterministic, exhaustive on every AF up to 4 arguments),
  [`../../tests/bridge/grounded-biorthogonal.property.test.ts`](../../tests/bridge/grounded-biorthogonal.property.test.ts)
  (randomised, 500 runs), and
  [`../../tests/bridge/stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
  (differential — pure `interact` vs the **real** engine kernel `stepCore`, every
  AF and play on `n ≤ 3`). Evidence only — see §Corroborating computation.
- **build-instructions:** `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`

> Methodology note. This is the *prove* half of the test-then-prove plan for the
> foundational bridge: Phase 2 corroborated the equivalence empirically
> ([session 02b §6](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)),
> Phase 3 (this entry) gives the human-checked proof. The theorem is the
> "keystone lemma" of the bridge roadmap: *the grounded discussion game is
> isomorphic, strategy-preservingly, to the Ludics dispute of the translated
> designs.*

## Vocabulary

Let `F = (A, ⇝)` be a finite abstract argumentation framework (Dung 1995): `A`
a finite set of arguments, `⇝ ⊆ A × A` the attack relation, `y ⇝ x` read "`y`
attacks `x`". Write `att(x) = { y ∈ A : y ⇝ x }`.

- **Grounded labelling / extension.** The grounded labelling is the least
  complete labelling (Caminada): the least fixpoint, over the three-valued
  labels `{IN, OUT, UNDEC}`, of the rules `x = IN` iff every `y ∈ att(x)` is
  `OUT`; `x = OUT` iff some `y ∈ att(x)` is `IN`; `x = UNDEC` otherwise. The
  grounded extension is `grounded(F) = { x : label(x) = IN }`. This is exactly
  the engine in
  [`../../lib/argumentation/labelling.ts`](../../lib/argumentation/labelling.ts)
  (`groundedLabelling`, `groundedExtension`), the single consolidated Dung core
  (ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP, fully implemented).
- **The grounded discussion game `G(F, a)`.** A two-player game on *dispute
  lines* `ℓ = [x₀, x₁, …, x_k]` with `x₀ = a`, `x_{i+1} ∈ att(x_i)`. PRO owns the
  even indices (PRO asserts `x₀ = a`, then `x₂, x₄, …`), CON the odd indices.
  Write `U(ℓ) = { x_i : i even }` (PRO's asserted arguments). The **repetition
  rule** is asymmetric:
    - CON, to move after an even-length prefix ending at `x_k` (PRO just
      asserted), may extend by any `x_{k+1} ∈ att(x_k)`;
    - PRO, to move after an odd-length prefix ending at `x_k` (CON just
      attacked), may extend only by `x_{k+1} ∈ att(x_k) \ U(ℓ)` — **PRO may not
      re-assert an argument it has already asserted on the line; CON may
      repeat.**
  A player who cannot move loses the play. **PRO wins `G(F, a)`** iff PRO has a
  strategy that wins every play. (This is precisely `disputeWins(F, a)` in
  [`../../lib/bridge/dispute.ts`](../../lib/bridge/dispute.ts), with
  `proAtCon`/`proAtPro` the two position types and `U` the threaded `used`
  set.) This is the **standard grounded discussion game** of the argument-games
  literature — the asymmetric repetition rule is Caminada's grounded `G`-game
  (Modgil & Caminada 2009, §"Proof theories"; Caminada 2006), not a bespoke
  construction; Lemma C below is its known soundness/completeness against
  grounded membership, re-derived here against the consolidated engine.
- **Translation `⟦·⟧` and the Ludics dispute.** Per the Phase-1 spec
  ([session 02b](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)),
  `⟦a⟧⁺` is the Proponent dispute design rooted at `a`; PRO strategies and CON
  strategies are explicit *strategy designs*; orthogonality is the **canonical**
  predicate (`stepInteraction` reaching the daimon `†`, i.e. `CONVERGENT` — D0.1
  of session 02 §0b), and bi-orthogonal closure is the re-founded
  [`behaviourClosure.ts`](../../packages/ludics-engine/behaviourClosure.ts).
  Acceptance is the realizability reading
    > `a` *accepted by interaction* :⟺ `∃σ ∀τ. ⟨⟦σ⟧ ∣ ⟦τ⟧⟩ ⇓ †`,
  i.e. some Proponent strategy design is orthogonal to every Opponent test
  design. This is `acceptableByInteraction(F, a)` in `dispute.ts`.

## Statement

**Theorem (keystone).** For every finite abstract AF `F = (A, ⇝)` and every
`a ∈ A`:

> `a ∈ grounded(F)`  ⟺  `a` is accepted by interaction
> (`∃σ ∀τ. ⟨⟦σ⟧ ∣ ⟦τ⟧⟩ ⇓ †`).

Moreover the correspondence is **strategy-preserving**: the translation `⟦·⟧`
restricts to a bijection between PRO strategies of `G(F, a)` and Proponent
designs based at `⟦a⟧⁺`, and between CON strategies and Opponent test designs,
under which *"PRO's strategy wins the play"* and *"the two designs are
orthogonal"* coincide. Hence a PRO winning strategy maps to a Proponent design
orthogonal to every test, and conversely.

This settles conjecture
[C010](../03_CONJECTURES/C010-grounded-orthogonality-bridge.md) on the
abstract-AF / grounded fragment.

## Proof (human-checked)

The proof decomposes into three lemmas. Lemma C is the substantive content
(self-contained, no appeal to the Ludics layer); Lemmas A and B connect the
game to the designs.

### Lemma A (simulation: interaction traces the dispute line)

*For any PRO strategy `σ` and CON strategy `τ`, the canonical interaction of the
translated designs traverses exactly the dispute line that `σ` and `τ` jointly
determine, and `⟨⟦σ⟧ ∣ ⟦τ⟧⟩ ⇓ †` (CONVERGENT) iff that line ends with CON
unable to move (PRO has won the play); it diverges iff PRO is unable to move.*

*Proof.* The abstract-AF translation emits only the multiplicative,
additive-free fragment of Ludics: each PRO assertion of an argument `x` is a
positive action at the locus given by the dispute line, whose ramification is
`att(x)` with **distinct subaddresses per attacker** (Phase-1 encoding decision
#3), and each CON attack is the dual negative action selecting one child locus.
On this fragment the Phase-0 audit (session 02 §0b, D0.1) established that the
canonical predicate `stepInteraction = CONVERGENT` reduces to *locus-matched
alternating traversal that converges exactly at a daimon*: because every
argument sits at its own subaddress, no two PRO ramifications collide, so no
additive superposition, directory collision, or consensus-draw can arise — the
only ways `stepInteraction` can branch away from a plain alternating walk.

The pure traversal of this walk is `interact` in `dispute.ts`: starting at
`a` with `used = {a}`, it alternates CON/PRO; at a CON step it reads
`att(current)` (empty ⟹ CON stuck ⟹ PRO plays `†` ⟹ `CONVERGENT`); at a PRO
step it reads `att(current) \ used` (empty ⟹ PRO stuck ⟹ `DIVERGENT`),
otherwise it advances and adds the move to `used`. These are exactly the moves,
the repetition rule, and the win condition of `G(F, a)`. The daimon `†` is
played by PRO precisely when CON is stuck — the unique convergence event of the
fragment. PRO's no-repeat rule bounds the line length by `2·|A| + 1`, so the
traversal always terminates with `CONVERGENT` or `DIVERGENT`; the `ONGOING`
(undecided, D0.2) verdict never fires on this fragment. ∎

### Lemma B (strategy bijection)

*`⟦·⟧` is a bijection between PRO strategies of `G(F, a)` and Proponent designs
based at `⟦a⟧⁺`, and between CON strategies and Opponent test designs; and `σ`
wins the play against `τ` iff `⟦σ⟧ ⊥ ⟦τ⟧`. Consequently*

> `PRO wins G(F, a)`  (i.e. `∃σ ∀τ`. σ beats τ)  ⟺  `a` accepted by interaction.

*Proof.* A PRO strategy is a choice function: at every PRO-position reachable
under the strategy (across all of CON's possible attacks), it names PRO's
counter. The corresponding Proponent design is the sub-tree of the full dispute
tree that keeps PRO's chosen action at each PRO-locus and branches on *all*
CON actions at each CON-locus (a design must answer every test). This is a
chronicle-by-chronicle bijection: a design based at `⟦a⟧⁺` is exactly a
prefix-closed set of alternating chronicles, positive at PRO-loci with a single
continuation and negative at CON-loci with a continuation per ramification —
which is the same data as a PRO choice function. The inverse reads PRO's action
off each positive chronicle. This bijection is realised by `enumerateStrategies(F,
a, "PRO")` in `dispute.ts` (DFS recording PRO choices, cartesian-merging over
opponent options); `enumerateStrategies(F, a, "CON")` is the symmetric bijection
for CON / Opponent tests.

By Lemma A, the single play that `σ` and `τ` co-determine converges to `†` iff
`σ` beats `τ`; i.e. `⟦σ⟧ ⊥ ⟦τ⟧` iff `σ` wins that play. Quantifying: PRO has a
strategy beating every CON strategy iff some Proponent design is orthogonal to
every Opponent test, which is the definition of `acceptableByInteraction(F, a)`.
∎

### Lemma C (game adequacy: PRO wins `G(F, a)` iff `a ∈ grounded(F)`)

*Proof.* Let the grounded labelling assign `IN`/`OUT`/`UNDEC` as in §Vocabulary.
Recall the monotone operator on argument-sets
`Φ(S) = { x : ∀ y ∈ att(x), ∃ z ∈ att(y) ∩ S }`, whose least fixpoint is the
`IN`-set: `grounded(F) = ⋃_{n≥0} Φ^n(∅)`. For `x ∈ grounded(F)` let
`rank(x)` be the least `n ≥ 1` with `x ∈ Φ^n(∅)`. Note `Φ^1(∅) = { x : att(x) =
∅ }` (the unattacked arguments).

**(⇐) `a ∈ grounded(F)` ⟹ PRO wins.** We give PRO a strategy and show it wins
every play, by induction on `rank` of PRO's current argument.

Strategy: whenever PRO has just asserted an argument `z ∈ grounded(F)` of rank
`r` and CON attacks with some `b ∈ att(z)`, then since `z ∈ Φ^r(∅)` there is
`z' ∈ att(b) ∩ Φ^{r-1}(∅)`; PRO plays `z'`. Then `z' ∈ grounded(F)` and
`rank(z') ≤ r - 1 < r`.

- *Base* `rank(a) = 1`: `att(a) = ∅`, so CON cannot move and PRO wins
  immediately.
- *Step*: along any play, PRO's successively asserted arguments `a = z₀, z₁,
  z₂, …` have strictly decreasing rank, hence are pairwise distinct; in
  particular each newly chosen `z'` has rank strictly below every previously
  asserted PRO argument, so `z' ∉ U(ℓ)` and the no-repeat rule never blocks the
  move. Strictly decreasing ranks are bounded below by `1`, where CON is stuck;
  so every play reaches a CON-stuck position and PRO wins. By induction PRO wins
  from every reachable position, hence wins `G(F, a)`.

**(⇒) `a ∉ grounded(F)` ⟹ CON wins** (contrapositive). Since `a ∉ grounded(F)`,
`a` is labelled `OUT` or `UNDEC`. CON plays to maintain the invariant *"PRO's
current asserted argument is not `IN`"*, which holds initially.

Suppose PRO has just asserted `x` with `label(x) ≠ IN`, CON to move.
- *`x` is `OUT`*: by definition some `b ∈ att(x)` has `label(b) = IN`. CON plays
  `b`. Since `b` is `IN`, every argument in `att(b)` is `OUT`; so whatever
  `c ∈ att(b) \ U` PRO plays, `label(c) = OUT ≠ IN`, restoring the invariant (and
  if `att(b) = ∅`, PRO is stuck and CON wins now).
- *`x` is `UNDEC`*: then no attacker of `x` is `IN` and — since not all
  attackers are `OUT` — at least one attacker `b` is `UNDEC`. CON plays that `b`.
  As `b` is `UNDEC`, no attacker of `b` is `IN`; so any `c ∈ att(b) \ U` PRO
  plays has `label(c) ∈ {OUT, UNDEC} ≠ IN`, restoring the invariant.

While the invariant holds CON is never stuck: an `OUT` argument has an `IN`
attacker and an `UNDEC` argument has an `UNDEC` attacker, so CON always has the
prescribed move. PRO's asserted arguments are pairwise distinct (no-repeat) and
`A` is finite, so no play is infinite; hence every play ends with some player
stuck, and since CON is never stuck it is PRO who gets stuck. CON wins every
play, so PRO does not win `G(F, a)`. ∎

### Theorem

Compose: `a ∈ grounded(F)` ⟺ PRO wins `G(F, a)` (Lemma C) ⟺ `a` accepted by
interaction (Lemma B, whose orthogonality reading rests on Lemma A). The
strategy-preservation clause is the content of Lemma B: `⟦·⟧` carries the PRO
winning strategy produced in Lemma C(⇐) to a Proponent design orthogonal to
every Opponent test, and the bijection runs both ways. ∎

## Scope and what is *not* claimed

- **Abstract AF only.** `F` carries no internal argument structure (no ASPIC+
  rules, no preferences). Structured frameworks are out of scope here; they
  reduce to the abstract case via the consolidated adapters, but that reduction
  is a separate obligation.
- **Grounded only.** Stable and preferred semantics are the next targets. The
  realizability quantifier `∃σ ∀τ` is specific to the *skeptical, well-founded*
  reading; stable/preferred will need a different design-space quantifier (and,
  for preferred, the maximality obstruction flagged in session 02 §1).
- **No additives.** The translation deliberately stays in the multiplicative
  additive-free fragment (distinct subaddresses per argument). The moment an
  encoding shares loci across alternative defences, Lemma A's reduction of the
  canonical predicate to a plain alternating walk no longer applies and the
  additive-violation / collision behaviour of `stepInteraction` must be handled.
- **Lemma A's one external appeal.** Lemma A invokes the Phase-0 characterisation
  (session 02 §0b) that, on this fragment, `stepInteraction = CONVERGENT`
  coincides with locus-matched alternating daimon traversal. That
  characterisation is argued there but is not itself re-proved in this entry;
  it is **now discharged computationally** (2026-06-03). The decision procedure of
  the production engine `stepInteraction` was lifted verbatim into a pure kernel
  [`stepCore`](../../packages/ludics-engine/stepCore.ts) (`stepInteraction` keeps
  its DB I/O and delegates), and the bridge's `interact` is confronted with the
  **real** kernel on the emitted fragment: see
  [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts).
  The coincidence holds on every AF and every (σ,τ) play for `n ≤ 3` with zero
  skips. This converts the appeal from an asserted coincidence about a *different*
  predicate pair into a checked property of the engine's own traversal. A
  symbolic mechanisation (Agda) remains possible but is no longer the only
  evidence; the residual gap is the move-rule's faithfulness *as a translation*,
  not the engine semantics.

## Corroborating computation

Two test artefacts corroborate the three lemmas (evidence, not part of the
human-checked proof):

- **Exhaustive (deterministic).**
  [`keystone-simulation.exhaustive.test.ts`](../../tests/bridge/keystone-simulation.exhaustive.test.ts)
  enumerates **every** abstract AF up to a fixed size:
    - *Lemma C* — `disputeWins(F, a) ⟺ a ∈ grounded(F)` checked on all
      `2^(n²)` AFs for `n ∈ {1,2,3,4}` (at `n = 4`, all 65 536 AFs × 4 arguments
      = 262 144 membership checks), against the consolidated grounded engine.
      No counterexample.
    - *Lemma A + B* — `acceptableByInteraction(F, a) ⟺ disputeWins(F, a)` checked
      on all AFs for `n ∈ {1,2,3}` with **zero** enumeration skips. No
      counterexample.
- **Randomised (sampled).**
  [`grounded-biorthogonal.property.test.ts`](../../tests/bridge/grounded-biorthogonal.property.test.ts)
  — the full equivalence over 500 fast-check runs (1–5 args), 7/7 green.
- **Differential vs the real engine (Lemma A's appeal).**
  [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
  encodes each realized dispute play as a faithful Proponent/Opponent Ludics
  design pair and runs the **production** decision kernel
  [`stepCore`](../../packages/ludics-engine/stepCore.ts) over it, asserting its
  `CONVERGENT` verdict coincides with `interact`'s on **every** AF and **every**
  (σ,τ) pair for `n ∈ {1,2,3}` (zero skips), and that the `∃σ∀τ` acceptance
  predicate computed through the real kernel matches the pure one. The daimon is
  placed by the structural translation rule (decision #2), not from a verdict, so
  a faulty traversal would be caught. 6/6 green.

Together these exercise the keystone equivalence on the entire `n ≤ 4` slice
plus a random tail, with the move-level simulation (Lemma A) confirmed wherever
enumeration is within bound.

## Future work

1. **Cross-check.** A second reader must verify Lemma C's two inductions and the
   bijection of Lemma B before this entry moves to `status: established`.
2. **Discharge Lemma A's external appeal** — **done (computationally, 2026-06-03).**
   `stepInteraction`'s decision procedure was extracted into the pure kernel
   [`stepCore`](../../packages/ludics-engine/stepCore.ts) and confronted with
   `interact` over the emitted fragment
   ([`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts),
   every AF and play for `n ≤ 3`, zero skips). A symbolic (Agda) mechanisation of
   the same coincidence remains open as a stronger, `n`-unbounded witness.
3. **Stable, then preferred** (session 02 decision order), reusing Lemmas A–B
   with a new acceptance quantifier.

## Bibliography

- Dung, P. M. (1995). *On the acceptability of arguments and its fundamental
  role in nonmonotonic reasoning, logic programming and n-person games.* AIJ 77.
- Modgil, S. & Caminada, M. (2009). *Proof theories and algorithms for abstract
  argumentation frameworks.* In *Argumentation in Artificial Intelligence*,
  Springer.
- Caminada, M. (2006). *On the issue of reinstatement in argumentation.* JELIA.
- Girard, J.-Y. (2001). *Locus Solum: from the rules of logic to the logic of
  rules.* MSCS 11(3) (designs, orthogonality, daimon, bi-orthogonal closure).
- In-repo: [session 02](../10_IDEATION_SESSIONS/02-foundational-bridge-dung-ludics-2026-06-02.md)
  §0b (Phase-0 predicate audit), [session 02b](../10_IDEATION_SESSIONS/02b-translation-spec-af-to-designs-2026-06-02.md)
  (translation spec + Phase-2 findings),
  [`behaviourClosure.ts`](../../packages/ludics-engine/behaviourClosure.ts)
  (canonical closure), [`dispute.ts`](../../lib/bridge/dispute.ts) (the artifact).

## Cross-check notes

**Verdict: defect list — `status` stays `provisional`. One blocking defect
(Lemma A's external appeal, §3.2 of the verification prompt), which is in fact
*weaker* than the author anticipated. Lemmas B and C, the artefact↔statement
correspondence, the scope clauses, and the corroborating computation are all
discharged.** Cross-check performed 2026-06-03 by an independent second reader
(did not author T005); every obligation below was re-derived from the cited
sources, not taken from T005's own summaries.

### What was re-derived and holds

- **Lemma C (§1) — sound.** Re-derived independently of the Ludics layer.
  - *Operator/fixpoint (1.1).* `Φ(S) = { x : ∀y∈att(x), ∃z∈att(y)∩S }` is exactly
    Dung's characteristic function `F` (cf. `defends`/`characteristic` in
    [labelling.ts](../../lib/argumentation/labelling.ts)): `S` defends `x` iff
    every attacker `y` of `x` is itself attacked by some `z∈S`. `Φ` is monotone,
    its least fixpoint `⋃ₙΦⁿ(∅)` is the grounded extension, and that equals the
    `IN`-set of the least complete labelling computed by `groundedLabelling`
    (the engine only ever promotes `UNDEC→IN/OUT`, a Knaster–Tarski ascent to
    the least fixpoint). "Least complete labelling" and "least fixpoint of `Φ`"
    are the *same* set, not merely related. `Φ¹(∅) = { x : att(x)=∅ }` checks
    out (the empty `∀y∈att(x)` makes the unattacked args exactly `Φ¹`). `rank`
    is well-defined by monotonicity + finiteness.
  - *(⇐) (1.2).* Rank induction re-run. The no-repeat obligation is genuinely
    met: PRO's asserted args have *strictly decreasing* rank along every play,
    so each chosen `z'` (rank `<` the last) has rank strictly below **every**
    previously asserted PRO argument, hence `z'∉U(ℓ)` — the repetition rule can
    never block PRO. Base case `rank=1` (`att(a)=∅`, CON immediately stuck) and
    termination (strictly decreasing rank bounded below by 1) both check.
  - *(⇒) (1.3).* Invariant "PRO's current arg `≠ IN`" re-verified for both
    sub-cases. `OUT`⟹ has an `IN` attacker `b`; `b` `IN`⟹ all of `att(b)` is
    `OUT`, so PRO's reply stays `≠IN` (and `att(b)=∅` ⟹ PRO stuck now). `UNDEC`⟹
    no `IN` attacker and not-all-`OUT`, hence *some* attacker is `UNDEC` (labels
    are total, so "not IN and not all OUT" forces an `UNDEC` attacker); that `b`
    `UNDEC`⟹ no `IN` in `att(b)`, so PRO's reply is `OUT`/`UNDEC`. CON is never
    stuck while the invariant holds; finiteness + PRO no-repeat kills infinite
    play, so PRO is the stuck player.
  - *Asymmetry load-bearing (1.4).* Confirmed the proof *uses* PRO-no-repeat
    (it is what terminates (⇒) and what (⇐) must dodge). Smallest witnesses
    re-checked by hand: self-attack `a→a` (CON *repeats* `a`; PRO exhausts
    `att(a)\{a}=∅`) and 3-cycle `a→b→c→a` (PRO exhausts counters via no-repeat).
    Symmetric repetition would wrongly let PRO escape the self-attack; T005's
    asymmetric rule gives the correct "not accepted".
- **Lemma B (§2) — sound as a statement about the pure model.** The bijection is
  realised by `enumerateStrategies`: at a decision node one strategy per option,
  at an opponent node a cartesian merge over *all* options (a design answers
  every test) — injective and surjective onto choice functions. `(σ,τ)`
  co-determine a *unique* play via `interact` (deterministic `get` lookups), so
  "σ beats τ" is a well-defined bit `= interact(σ,τ)==='CONVERGENT'`.
  `acceptableByInteraction = pros.some(σ ⇒ cons.every(τ ⇒ …CONVERGENT))` is a
  faithful `∃σ∀τ` with no quantifier reordering (2.3). The restriction to
  enumerated tests (decision #4) is sound *relative to the pure model* because
  `disputeWins` (the independent minimax) and `acceptableByInteraction` are
  exhaustively equal on all `n≤3` AFs — but see the defect: this is soundness
  against `interact`, not against the real behaviour.
- **Artefact↔statement (§4) — faithful.** Mapped each §Vocabulary clause to
  code: `U(ℓ)` = the `used` set threaded **PRO-only** (`proAtPro` does
  `new Set(used).add(p)`; `proAtCon` passes `used` unchanged), so the no-repeat
  rule is correctly PRO-only. `disputeWins` is `∀`-over-CON / `∃`-over-PRO
  minimax (PRO wins every play); `acceptableByInteraction` is the realizability
  `∃σ∀τ` over enumerated designs — *distinct* implementations, asserted equal by
  test, not the same function (4.2). `attackersOf(af,x) = { from : to===x }`
  matches `att(x)` orientation (4.3, no attacker/target reversal).
- **Scope (§6) — no overreach.** Abstract AF only (no ASPIC+/preferences in any
  step), grounded only (the `∃σ∀τ` reading is tied to the well-founded case and
  not claimed for stable/preferred), additive-free boundary stated as genuine,
  and the open-question linkage to Q-038 / C010 (abstract-AF grounded fragment)
  is exactly the fragment closed — no more.
- **Corroborating computation (§5) — re-run, green (evidence only).** Executed
  `node --max-old-space-size=2048 ./node_modules/.bin/jest tests/bridge/`:
  3 suites, 20 tests, all pass (the differential suite was added on 2026-06-03 to
  discharge defect 1 — see "Discharge" below). Confirmed `allAFs(n)` enumerates
  the full
  `2^(n²)` family (the suite asserts `afs === 1<<(n*n)` and `skipped === 0`),
  Lemma C checked on `n∈{1,2,3,4}` against the *consolidated* engine in
  [labelling.ts](../../lib/argumentation/labelling.ts) (not a re-implementation),
  and the property generator covers cycles, self-attacks, and isolated args.

### Blocking defect

1. **Lemma A's external appeal is undischarged, and weaker than §"Scope" admits
   (verification prompt §3.2).** Lemma A's load-bearing step is that *the
   canonical predicate `stepInteraction = CONVERGENT`, applied to the translated
   designs, reduces to the plain alternating walk `interact`*. The proof cites
   session 02 §0b (D0.1) as having "established" this. It has not. Two distinct
   gaps:
   - **(a) §0b only *asserts* the coincidence, and about a *different pair* of
     predicates.** §0b is an audit comparing predicate **A** (`converges` /
     `checkConvergence`) against predicate **B** (`checkOrthogonal` /
     `stepInteraction`); its verdict is that the two "coincide only on the
     simplest fragment (linear, daimon-terminated, no additives) and are not
     guaranteed to agree in general." That is an assertion, not a proof, and it
     is about `converges` vs `stepInteraction` — **neither of which is the
     dispute.ts `interact`**. D0.1 merely *fixes* `stepInteraction` as the
     canonical predicate; it does not characterise its traversal on the
     translated fragment.
   - **(b) `interact` is never checked against the real `stepInteraction`.**
     The pure model in [dispute.ts](../../lib/bridge/dispute.ts) mentions
     `stepInteraction` only in a comment; [lib/bridge](../../lib/bridge) imports
     nothing from [packages/ludics-engine](../../packages/ludics-engine). So the
     corroborating tests (which exercise `interact`/`disputeWins`/
     `acceptableByInteraction`) provide **zero** evidence for the simulation
     claim — they corroborate Lemma C (`disputeWins ⟺ grounded`) and the
     internal identity (`acceptableByInteraction ⟺ disputeWins`), but the bridge
     from `interact` to the *actual* canonical engine is neither proved nor
     tested. Lemma A is the sole point where the theorem touches real Ludics
     semantics, and that contact is presently unverified.

   *Minimal repair (author only).* Discharge Future-work item 2: mechanise /
   differentially test the real `stepInteraction` against `interact` on the
   additive-free, distinct-subaddress fragment emitted by `buildDisputeDesign`
   (a direct differential test over the same `allAFs(n)` enumeration would
   suffice as strong evidence; a proof that `stepInteraction∘⟦·⟧ = interact` on
   the fragment would discharge it outright). Until then, **this is the single
   blocker** and T005 must remain `provisional`. Everything downstream of a
   faithful Lemma A (Lemmas B, C, the theorem, the strategy-preservation clause)
   is otherwise in order.

### Discharge of the blocking defect (author, 2026-06-03)

The minimal repair requested above was carried out — the stronger of the two
options (confront the **real** engine, not a re-proof on paper):

1. **Kernel extraction.** `stepInteraction`'s decision loop was lifted verbatim
   into a pure, I/O-free kernel
   [`stepCore`](../../packages/ludics-engine/stepCore.ts). `stepInteraction`
   ([stepper.ts](../../packages/ludics-engine/stepper.ts)) now performs its DB
   reads/writes, hooks and persistence around a single `stepCore(...)` call and
   returns the kernel's `status`/`reason`/`pairs` unchanged — a mechanical
   delegation, so the kernel **is** the production traversal, not a copy.
   (`behaviourClosure.test.ts` 10/10 green confirms engine behaviour under the
   refactor; the two pre-existing engine-suite failures — `scopedDesigns`
   needing a live DB, `compose.preflight` importing vitest under jest — are
   unrelated to this change.)
2. **Differential test.**
   [`stepcore-differential.test.ts`](../../tests/bridge/stepcore-differential.test.ts)
   encodes each realized `interact` play as a faithful Proponent/Opponent design
   pair (positive/negative acts at locus-matched subaddresses, † appended by the
   *structural* CON-stuck rule — decision #2, never from a verdict) and runs the
   real `stepCore` over it. It asserts, over the **same** `allAFs(n)`
   enumeration used elsewhere: for every AF and every (σ,τ) on `n ∈ {1,2,3}`,
   `interact(...)==='CONVERGENT' ⟺ stepCore(...).status==='CONVERGENT'`, with
   **zero** skips; and that the `∃σ∀τ` acceptance predicate computed through the
   real kernel matches the pure one. 6/6 green; full bridge suite 20/20 green.

This converts gap (b) into a checked property of the actual canonical engine,
and gap (a) is now moot: we no longer rely on §0b's assertion about a *different*
predicate pair — the canonical predicate `stepInteraction = CONVERGENT` itself
(via its extracted kernel) is what `interact` is tested against. The non-blocking
observation on Lemma B's CON-side surjectivity is closed by the same artefact.

**Residual.** This is exhaustive computational evidence on `n ≤ 3`, not an
`n`-unbounded symbolic proof; a paper proof (or Agda mechanisation) of
`stepCore ∘ ⟦·⟧ = interact` on the additive-free fragment would close it
outright and is retained as the stronger open item. With the sole blocking
defect discharged and Lemmas B and C already found sound, the second reader
flipped `status: provisional → established` on 2026-06-03; the residual symbolic
proof is tracked as future work, not a blocker, and the entry will be revisited
if any counterexample surfaces.

### Non-blocking observation

- Lemma B's CON-side surjectivity ("CON strategies ↔ *all* Opponent tests in the
  behaviour") inherits the same fragment-confinement assumption as Lemma A: it
  is sound for the enumerated strategy designs, but "orthogonal to every
  enumerated test ⟹ orthogonal to every test in the bi-orthogonal-closed
  behaviour" rests on the additive-free reduction. Discharging defect 1 also
  closes this; no separate repair needed.
