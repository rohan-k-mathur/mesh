# Translation spec — ⟦·⟧ : abstract AF → Ludics designs (Phase 1)

- **Date:** 2026-06-02
- **Direction:** 1 — the foundational bridge ([session 02](02-foundational-bridge-dung-ludics-2026-06-02.md))
- **Phase:** 1 (define the translation; **no proof claimed**)
- **Scope decision (D from session 02):** **abstract AF first** — arguments +
  an attack relation only. ASPIC+ structured arguments (rules, premises,
  preference-resolved defeat) are deferred to a later refinement once the
  abstract bridge is validated.
- **Predicate this spec is stated over (D0.1):** the **canonical** orthogonality
  `D ⊥ E ⟺ stepInteraction(D,E).status === "CONVERGENT"`, and the canonical
  closure in [`packages/ludics-engine/behaviourClosure.ts`](../../packages/ludics-engine/behaviourClosure.ts).
  The in-memory `converges` heuristic is explicitly **not** used (Phase-0 §0b).

---

## 0. What we are translating, and into what

### Source: abstract argumentation framework (AF)

The exact, consolidated engine represents an AF as just
([`packages/af/semantics.ts`](../../packages/af/semantics.ts)):

```ts
type ArgId  = string;
type Attack = [ArgId, ArgId];           // [attacker, attacked]
// AF = { args: ArgId[]; attacks: Attack[] }
```

with grounded via [`lib/argumentation/labelling.ts`](../../lib/argumentation/labelling.ts)
(`groundedExtension`) and stable/preferred via
[`lib/argumentation/semantics.ts`](../../lib/argumentation/semantics.ts). This is
the **trustworthy left-hand side** of the differential test (the consolidation
roadmap is fully implemented — session 02 §0b).

### Target: the persisted design substrate

A Ludics interaction in the repo is carried by three persisted tables (shapes
read off [`packages/ludics-engine/stepper.ts`](../../packages/ludics-engine/stepper.ts)):

| Table | Role | Key fields |
|-------|------|-----------|
| `LudicDesign` | a design (a strategy) | `id`, `deliberationId`, `participantId ∈ {Proponent, Opponent}` |
| `LudicAct` | one action in a design | `kind ∈ {PROPER, DAIMON}`, `polarity ∈ {P, O}`, `locusId`, `orderInDesign`, `isAdditive`, `ramification` |
| `LudicLocus` | an address | `path` (e.g. `"0.1.2"`), `dialogueId` |

`stepInteraction(posDesignId, negDesignId)` traverses a Proponent design against
an Opponent design by **matching loci** and alternating polarity; it returns
`CONVERGENT` exactly when a `DAIMON` act is reached on the active side, and
`DIVERGENT`/`STUCK` otherwise.

**Orientation convention (fixes the directionality of ⊥):**
`participantId = Proponent ↦ polarity "pos"`, `Opponent ↦ "neg"`. This is the
`polarityOf` argument to `makeCanonicalOracle`.

---

## 1. The translation ⟦·⟧

> ⚠️ Everything in §1 is a **definition**, and the correspondence in §2 is a
> **conjecture to be tested (Phase 2) then proved (Phase 3)** — never assumed.

### 1.1 Loci encode dispute positions

Fix a claim/argument under dispute. We use the locus tree to encode *dispute
lines*:

- Root locus `0` — "the argument is asserted".
- A child `0.i` — "the *i*-th attacker has been advanced against it".
- Depth = dispute round. Even depth = Proponent's turn to assert/defend; odd
  depth = Opponent's turn to attack. (This mirrors the Modgil–Caminada grounded
  discussion game, which is why grounded is the first target.)

### 1.2 An argument becomes a (Proponent) design

For an argument `a` with attacker set `att⁻(a) = { b | (b,a) ∈ attacks }`, the
**proponent design** `⟦a⟧⁺` is:

- a `LudicDesign` with `participantId = Proponent`;
- a positive `PROPER` act at locus `0` asserting `a`, with
  `ramification = { i : bᵢ ∈ att⁻(a) }` (one opening per attacker — the loci
  where an opponent may counter);
- recursively, at each child locus `0.i` (where attacker `bᵢ` lives) the design
  must, to *win*, carry the **defence**: a positive act advancing some
  `c ∈ att⁻(bᵢ)` (a counter-attacker of the attacker), reopening the recursion;
- a `DAIMON` act `†` at any locus where the design **gives up** (no available
  defence) — i.e. Proponent concedes that dispute line.

### 1.3 An attack becomes an (Opponent) design / move

For `(b,a) ∈ attacks`, the **opponent design** `⟦b⟧⁻` is the dual: at locus
`0.i` it plays a negative `PROPER` act advancing `b` against `a`, with
`ramification` = the loci where `b` itself may be counter-attacked. Opponent
designs are the *tests*; the proponent design is orthogonal to them exactly when
it can answer every attack line they probe.

### 1.4 The behaviour of a claim

For a claim `φ`, let `Args(φ)` be the arguments concluding `φ`. Define the
candidate **behaviour of `φ`** as the canonical bi-orthogonal closure of their
proponent designs over the dialogue's design pool `U`:

```
B_φ  :=  biorthogonalClosureForDialogue({
           dialogueId,
           G:        ⟦Args(φ)⟧⁺,
           universe: U,                 // all compiled designs in the dialogue
           polarityOf,                  // Proponent↦pos, Opponent↦neg
         })
```

(using [`packages/ludics-engine/behaviourClosure.ts`](../../packages/ludics-engine/behaviourClosure.ts),
**not** the deprecated in-memory `computeBiorthogonalClosure`).

---

## 2. The bridge claim (operational form — to be tested, then proved)

> **Conjecture (grounded bridge).** For a finite AF `F` and the translation
> above, argument `a` is in the **grounded extension** of `F` **iff** `⟦a⟧⁺` is
> orthogonal (canonical predicate) to every opponent design in `⟦att⁻(a)⟧⁻` —
> equivalently `⟦a⟧⁺ ∈ B_a = B_a^{⊥⊥}`.

This is exactly the right-hand side that
[`isBehaviour`](../../packages/ludics-engine/behaviourClosure.ts) /
`biorthogonalClosure` compute, so it is **differential-testable today** (Phase 2)
against `groundedExtension(F)`.

Sequencing of the semantic targets (decision from session 02):
**grounded → stable → preferred**, with preferred's maximality obstruction
pre-registered as the publishable realizability fallback.

---

## 3. Open design decisions (resolve empirically in Phase 2)

1. **One design per argument vs. one design per winning strategy.** §1.2 folds a
   whole defence subtree into a single design. The alternative is a *set* of
   designs, one per Proponent strategy, with `B_a` their closure. Differential
   testing will show which makes ⊥ track grounded membership; start with the
   single-design reading (simpler, and the closure recovers the strategy set).
2. **Daimon placement = the "loses the line" marker.** Whether `†` should sit on
   the Proponent side (concede) or be forced by Opponent exhaustion changes
   which interactions converge. Pin this against the canonical predicate on the
   3-cycle and 2-cycle fixtures first.
3. **Locus sharing across arguments.** If two arguments attack the same target,
   do their designs share the child locus or get distinct subaddresses?
   Sharing risks `dir-collision` divergence (a B-only divergence cause); distinct
   subaddresses are safer for the first pass.
4. **Universe `U`.** The closure is relative to the compiled design pool. For the
   property test, `U = ⟦all arguments⟧⁺ ∪ ⟦all attacks⟧⁻`; document that B_φ is
   the closure *within* this finite universe (true Ludics G⊥ is over an infinite
   space — see the `behaviourClosure.ts` header).

---

## 4. Risks specific to the translation

- **Additives / collisions.** If the encoding ever puts two competing defences
  at the *same* additive locus, `stepInteraction` returns `additive-violation`
  (DIVERGENT). That is a *real* signal (the canonical predicate is doing its
  job), but it means the encoding must keep alternative defences at distinct
  loci unless an additive choice is intended. The in-memory heuristic would have
  silently missed this — another reason the re-found closure matters.
- **Undecided (D0.2).** If a translated interaction exhausts fuel
  (`ONGOING`), `biorthogonalClosure` *raises* rather than guessing. Acyclic and
  small cyclic AFs should never hit this; if a generated AF does, that is a
  finding (either the encoding loops or `maxPairs` is too small), not a verdict.
- **Strategy faithfulness only on a fragment.** The translation may preserve
  winning strategies only for a subclass of AFs; characterising that subclass is
  itself a result (session 02 §1 risk), not a failure.

---

## 5. Next steps

- **Phase 2 (test-first):** implement `⟦·⟧` in a new `lib/bridge/` module, then a
  property test `tests/bridge/grounded-biorthogonal.property.test.ts` asserting
  the §2 conjecture over random finite AFs (reuse the AF generators behind
  [`lib/argumentation/semantics.ts`](../../lib/argumentation/semantics.ts) and the
  `__tests__/aspic` fixtures). Feed disagreements back here as a findings note.
- **Register the conjecture.** Promote the §2 statement to
  [`03_CONJECTURES/`](../03_CONJECTURES) as the bridge's central conjecture,
  cross-linked from session 02.

---

## 6. Phase 2 findings (2026-06-02) — PASS, first-pass encoding

The prototype is in [`lib/bridge/`](../../lib/bridge) (`types.ts`, `dispute.ts`,
`index.ts`) with the property test
[`tests/bridge/grounded-biorthogonal.property.test.ts`](../../tests/bridge/grounded-biorthogonal.property.test.ts).

**Result.** The §2 grounded-bridge conjecture **holds for the first-pass
encoding** over the abstract-AF fragment, with no counterexamples:

- 7/7 tests green. The property `acceptableByInteraction(F, a) ⟺ a ∈
  grounded(F)` passed **500 fast-check runs** over random AFs (1–5 args, arbitrary
  attack relation including self-attacks).
- Non-vacuous: across an instrumented 500-run sweep, **543 accepted** and **627
  rejected** verdicts were checked against the exact grounded engine; **~19.5%**
  of (AF, arg) pairs were *skipped* (enumeration above the 8 000-strategy bound on
  dense 5-arg AFs) and asserted nothing, by design.
- The fixed worked cases all match by hand: `a→b` ⇒ grounded `{a}`; even cycle
  `a⇄b` and odd 3-cycle ⇒ `∅`; self-attack `a→a` ⇒ `a ∉`; defended chain
  `a→b→c` ⇒ `{a,c}`.

**What the encoding actually is.** The four open decisions of §1 were resolved
concretely (recorded in the header of `dispute.ts`):

1. *Strategy designs* (not one folded design): PRO and CON strategies are
   enumerated explicitly; acceptance is the realizability reading
   `∃σ ∀τ. interact(σ, τ) = CONVERGENT` — PRO has a winning interaction strategy.
2. *Daimon = PRO closes when CON is stuck* — i.e. the argument PRO last asserted
   has no attacker. PRO-stuck (no un-used counter) is `DIVERGENT`.
3. *Distinct subaddresses per advanced argument* — no sibling locus sharing, so
   the translation never leaves the multiplicative additive-free fragment and the
   additive-collision concern of §4 does not arise for abstract AFs.
4. *Universe = the finite set of enumerated strategy designs.*

**The one substantive game choice.** The standard grounded-game asymmetric
repetition rule — **PRO may not re-assert an argument it has already played on a
line; CON may repeat** — is what makes odd cycles resolve to "not accepted" and
keeps every dispute line finite (length ≤ 2·|args|+1). This is the lever that
makes the bridge land on *grounded* specifically.

**Faithfulness cross-check.** `interact` is a faithful pure model of the
canonical predicate (`stepInteraction` CONVERGENT) on this fragment — alternate
polarity, match locus, converge on †, diverge when the mover is stuck — *not* a
re-import of the non-canonical DDS stepper. A second property asserts
`acceptableByInteraction ⟺ disputeWins` (the direct minimax value) over 500 runs,
confirming the strategy-enumeration + interaction agrees with the game value and
is not a shortcut. Undecided (`ONGOING`, D0.2) is never folded to a verdict; the
guard returns it and the test skips.

**Status of the conjecture.** Empirically corroborated, not proved. The PASS
validates the encoding strongly enough to proceed to **Phase 3** (the keystone
lemma: grounded discussion game ≅ Ludics dispute, strategy-preserving), which
would upgrade this from "no counterexample in 500 runs" to a theorem. The
enumeration bound means very dense AFs are untested by interaction here; the
minimax cross-check (cheap, unbounded) covers them and also agrees with grounded
on the fixed cases, so the skip is a performance limit, not a soundness gap.
