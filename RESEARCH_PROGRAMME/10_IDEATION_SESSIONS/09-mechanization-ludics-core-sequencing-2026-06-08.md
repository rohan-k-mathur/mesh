# Session 09 — Planning Direction 5: sequencing the mechanization programme (corroboration track → standalone artifacts)

**Date:** 2026-06-08
**Direction:** 5 — Mechanization (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §5)
**Status:** **Planning / scoping OPEN** (no theorems claimed; no code changed; no Agda written this session)
**Purpose:** turn the §5 narrative — *"mechanize the Ludics core… and give the Walton schemes a type-theoretic treatment"* — into an executable sequence, and in particular name the work that converts the paragraph's two **slogans** ("a mechanized Ludics, wanted for twenty years"; "scheme identity is behaviour-extensional = univalence") into **mechanized artifacts**, rather than leaving them as aspirations riding on a per-theorem corroboration habit.

---

## 0. The headline reframe: Direction 5 is currently a *corroboration reflex*, not a *programme*

The honest first observation mirrors the one that opened Direction 4 (Session 07): the work is **not** greenfield, but neither is it yet what §5 promises. What exists is a disciplined **habit** — every load-bearing order/closure theorem gets a parallel Agda check — and that habit has compounded into a real asset. What does *not* exist is the **standalone object** §5 actually names: a mechanized **Ludics core** (interaction, associativity, separation, internal completeness) that stands on its own as a proof-theory contribution, independent of any particular T-number.

The distinction that organizes this whole session:

> **Corroborating mechanization** (what we do now) takes an *already-`established`* human theorem and re-checks its load-bearing lemmas on a *convenient concrete model*, as evidence under the Theorem Register's evidence-only policy. **Constitutive mechanization** (what §5 promises) builds the *primitive objects themselves* — designs, the interaction/normalization relation, orthogonality, behaviours — in type theory, so that the theorems become *consequences of the definitions* rather than re-encodings of a paper proof on a toy carrier.

Everything mechanized so far is corroborating. The §5 deliverable is constitutive. The gap between them is the actual content of this session.

### 0.1 Inventory — what has landed (all Agda 2.7.0.1 / stdlib v2.0, `--safe --without-K`, no postulates/holes, EXIT:0)

| Artifact | Content | Kind |
|---|---|---|
| [`lib/Order.agda`](../mechanisation/agda/lib/Order.agda) | setoid partial order; `JoinFromLUB`; `Cone`; `Behaviour`; `ListSetInclusion` | shared substrate |
| [`lib/Closure.agda`](../mechanisation/agda/lib/Closure.agda) | `Powerset`; `ClosureOp`; **`Biorthogonal`** (`pol⁺/pol⁻`, galois, `clo = pol⁻∘pol⁺`) | shared substrate |
| [`T002/T002.agda`](../mechanisation/agda/T002/T002.agda) | Inc(B) antichain + cone decomposition | corroborating |
| [`T001/T001.agda`](../mechanisation/agda/T001/T001.agda) | per-cone join-semilattice axioms | corroborating |
| [`C001/C001a.agda`](../mechanisation/agda/C001) (= T004) | JSL-fragment bridge (free/forgetful unit) | corroborating |
| [`C004/C004.agda`](../mechanisation/agda/C004) | σ-joint saturation closure operator | corroborating |
| [`T009/T009.agda`](../mechanisation/agda/T009/T009.agda) | branching separating-context: O-parity-b + O-smyth on `Locus = List ℕ` | corroborating |

**Two facts about this inventory drive the plan:**

1. **`lib/Closure.agda` already contains `Biorthogonal`** — the `B = B^⊥⊥` machinery — *abstractly*, over an opaque relation `_⊥_ : X → Y → Set`. This is the single most valuable pre-existing asset: the constitutive Ludics core needs exactly this, but with `_⊥_` *instantiated* by actual design interaction rather than left opaque. The closure theory is done; the **engine that feeds it is missing**.
2. **T009 already touches separation** — but on a *concrete locus model* (`List ℕ` with the prefix order), mechanizing the two order-theoretic lemmas while **explicitly postponing** the `Matches`↔kernel faithfulness and the global normalization (those are flagged "human-review" in the file header). T009 is therefore the **boundary marker**: it shows precisely where corroborating mechanization stops and constitutive mechanization would have to begin (at the normalization relation itself).

### 0.2 Inventory — what §5 promises and is *not started*

- **The Ludics core proper.** No Agda object for: a **design** (as a coherent set of chronicles / a sliced strategy), the **interaction / normalization** relation `⟨D | E⟩`, **orthogonality** `D ⊥ E` defined *via* normalization-to-daimon, **associativity of interaction**, the **separation theorem** (Böhm-analogue), **internal completeness**. The TS engine ([`packages/ludics-engine/stepCore.ts`](../../packages/ludics-engine/stepCore.ts), [`stepper.ts`](../../packages/ludics-engine/stepper.ts), [`checkOrthogonal.ts`](../../packages/ludics-engine/checkOrthogonal.ts), [`separation.ts`](../../packages/ludics-engine/separation.ts)) is the *operational* counterpart, but there is no type-theoretic model of it.
- **The HoTT/type-theoretic scheme treatment.** [T003](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) (established) resolved the C006/C007/C008 trilemma *on paper* and even frames it as "univalence-flavored" (scheme identity = behavioural equivalence), but there is **no Agda/HoTT artifact**: no dependent type whose terms are scheme instances, no encoding of CQs as elimination obligations, no `Scheme ≃ Scheme` from behavioural equivalence. The slogan is a slogan.

So the §5 paragraph describes two flagship artifacts; **zero of the two have been begun.** The corroboration track is healthy and the headline deliverables are unstarted. This session sequences the path from one to the other.

---

## 1. The two slogans, and what "slogan → artifact" actually costs

### 1.1 Slogan A — "a mechanized Ludics core, wanted for twenty years"

The phrase hides a **foundational fork** that has to be decided *before* any code, because it determines the entire shape of the development:

> **Fork A — what is a design, formally?** (a) **Chronicle/strategy presentation** (Curien/Faggian–Hyland: a design is a set of chronicles closed under conditions, or a sliced innocent strategy); or (b) **the abstract / interactive presentation** (Terui's *computational ludics*: designs as possibly-infinite terms with a single reduction relation), or (c) **the substrate's own presentation** — designs as the `stepCore` engine already realizes them (acts at loci, positive/negative polarity, daimon).

This is the **exact analogue** of Direction 3's semiring-vs-quantale fork and Direction 4's coefficient-object fork, and it must be resolved the same way: *against the actual implementation*, not on aesthetics. The decisive constraint is **(2) the corroboration synergy** — if the Agda design model is chosen to mirror `stepCore`'s act/locus/polarity representation, then T006/T007/T008/T009 stop being re-encodings on a toy carrier and become *theorems about the same object the engine computes on*, and the Direction-2 separation work and Direction-5 mechanization **fuse into one artifact** (exactly the synergy [IMPLEMENTATION_TRACKS.md §"foundational program"](../IMPLEMENTATION_TRACKS.md) already bets on). Picking the textbook chronicle presentation buys closer contact with the literature but *re-opens* the faithfulness gap T009 deliberately parked.

The cost ladder, cheapest rung first:

1. **Designs + interaction + orthogonality as definitions** — the irreducible foundation. Until `⟨D | E⟩` and `D ⊥ E` are Agda definitions (not opaque relations), nothing constitutive is possible. Mechanizing this is where the **real difficulty of Ludics formalization lives**: normalization is a partial, possibly-non-terminating interaction, and encoding it `--safe` (no general recursion, no postulated reduction) is the twenty-year-hard part. The honest expectation is that this requires either (i) a **fuel/step-indexed** normalizer with a separate convergence predicate, or (ii) **sized types / coinduction** for the infinitary designs, or (iii) restriction to a **terminating fragment** first (finite designs, the fragment the substrate's bridge contract L3 already scopes to). **Recommendation: start with the terminating finite fragment** — it is where every current theorem lives, it sidesteps the partiality, and it is honestly publishable as "mechanized finite Ludics" while the infinitary extension is staged behind it.
2. **Associativity of interaction** — the first genuine theorem; the cut-elimination-flavored result that makes the model a *model*. Hard, but well-posed once (1) is fixed.
3. **Separation theorem** (Böhm-analogue) — the crown that **also discharges Direction 2's minimality argument** (per the §"foundational program" sequencing). This is the synergy payoff: one Agda theorem closes the Direction-5 flagship *and* certifies the Direction-2 paper result T006–T009 rest on.
4. **Internal completeness** — `B = B^⊥⊥` *for the instantiated `_⊥_`*, i.e. feed the design-interaction orthogonality into the **already-built** `lib/Closure.agda` `Biorthogonal` module. This rung is *cheap conditional on (1)* precisely because the closure half already exists abstractly — it is the clearest evidence the inventory should drive the order of attack.

### 1.2 Slogan B — "scheme identity is behaviour-extensional = univalence"

The §5 text wants a scheme to be a dependent type, CQs to be its elimination obligations, an argument to be a term, and "two schemes are equal iff behaviourally equivalent" to be a univalence-flavored statement. The slogan→artifact cost here is **structurally different** from Slogan A: the *mathematics* is already settled (T003), so the work is **encoding, not discovery** — but the encoding choice forks too:

> **Fork B — what type theory?** (a) **plain Agda** (schemes as records/`Set`s; behavioural equivalence as a bi-implication; "identity = equivalence" remains *external*, a proved iso, not a definitional equality); or (b) **cubical Agda / HoTT** (behavioural equivalence becomes a genuine `≃`, and **univalence makes it an actual `≡`** — the slogan becomes *literally true in the type theory*, not merely analogized).

Only route (b) cashes the slogan. Route (a) is a faithful corroboration of T003 (cheap, low-ceiling); route (b) is the actual §5 ambition (a real HoTT artifact tying the argumentation layer to univalence) and is **genuinely novel** but carries the cost of a separate toolchain (`cubical` stdlib, *not* `--safe --without-K`, so it lives in its own `agda/hott/` tree with its own `.agda-lib`, segregated from the `--without-K` corroboration corpus). **Recommendation: route (b), but staged *last* and *small*** — a single worked scheme family (e.g. Argument from Expert Opinion, the T003 worked example) as `Scheme`-dependent-type with its CQ eliminators, and one `behaviourEquiv → PathScheme` application of univalence, as a *proof of concept* rather than a full catalogue port.

A sharp dependency worth naming: **Slogan B's "behaviour" is Slogan A's behaviour.** A scheme's behavioural identity is identity of the *Ludics behaviour* it denotes (T003's C006 layer = `𝓑(𝓢)`). So the HoTT scheme artifact is only fully honest *after* the constitutive design/orthogonality core exists — otherwise "behaviourally equivalent" is itself an opaque relation. This forces the ordering: **A before B**, not in parallel.

---

## 2. The optimal sequence

The organizing principle, borrowed from the directions that have already shipped: **let the inventory and the implementation pick the order, cheapest-real-result first, and fuse with Direction 2 wherever the same object serves both.** Six phases, the first three constitutive-core, the last three the HoTT extension and consolidation.

> **M0 (decide the carrier) → M1 (finite design + interaction + orthogonality) → M2 (associativity) → M3 (separation, fused with Direction 2) → M4 (internal completeness, via existing `Biorthogonal`) → M5 (HoTT scheme PoC).** Infinitary/partial normalization (M1′) is staged *behind* M1 as an explicit extension, not a blocker.

- **M0 — Resolve Fork A against the engine.** *Cheapest, highest-leverage, no Agda.* An audit (mirroring Session 07's A0) of `stepCore.ts` / `stepper.ts` / `separation.ts` to fix the design representation that *both* matches the engine *and* is `--safe`-encodable. Output: a one-page "design carrier decision" + a stub `agda/ludics/Core.agda` signature (types only, no proofs). This is the analogue of the semiring-vs-quantale and coefficient-object decisions; it must be made *before* code or the whole tree is rebuilt later.
- **M1 — Finite design, interaction, orthogonality as definitions.** The foundation. Restrict to the terminating finite fragment (substrate contract L3). Define `Design`, `⟨_|_⟩` (step-indexed/structural normalizer), `_⊥_` via normalization-to-daimon. *This is the twenty-year-hard rung; everything downstream is conditional on it.* Deliverable: a self-standing `agda/ludics/` tree with its own README, **independent of any T-number** — the first piece of the actual §5 contribution.
- **M2 — Associativity of interaction.** First constitutive theorem. Makes the model a model.
- **M3 — Separation theorem (FUSED with Direction 2).** The crown. By construction this is *also* the abstract certificate for the minimality argument that T006/T007/T008/T009 carry on paper — so it is double-counted value and should be resourced as *the* Direction-2/5 joint deliverable, not a separate item. When it lands, the concrete-locus T009 corroboration is *subsumed* by a theorem about the real object.
- **M4 — Internal completeness.** Instantiate `lib/Closure.agda`'s `Biorthogonal` `_⊥_` with M1's design-orthogonality; derive `B = B^⊥⊥` for designs. Cheap *given M1* (the closure half is already built and `--safe`).
- **M5 — HoTT scheme proof-of-concept (Slogan B).** Separate `agda/hott/` cubical tree. One scheme family as a dependent type, CQs as eliminators, one univalence application turning a behavioural `≃` into a `≡`. Gated on M1–M4 (so "behaviour" is a real object) and on T003 (already done). Small and illustrative, not a catalogue port.
- **M1′ (staged extension, not blocking) — infinitary/partial normalization.** Sized types / coinduction to lift M1 off the finite fragment. Opened only once M1–M3 demonstrate the finite core is sound; the publishable "mechanized finite Ludics" result does not wait on it.

### 2.1 Why this order (rationale, mirroring the §"foundational program" logic)

- **The closure half is already done, so completeness is cheap-last-but-easy** — M4 riding on the existing `Biorthogonal` module is the clearest inventory-driven signal: build the engine (M1), and the completeness theorem is a short instantiation, not a fresh development.
- **Separation is shared infrastructure, so it pays twice** — M3 is simultaneously the §5 crown and the Direction-2 minimality certificate; sequencing it *after* M1–M2 (which it needs) but flagging it as the joint deliverable is the single biggest efficiency in the plan.
- **The finite fragment is where every theorem already lives**, so starting there (M1) costs nothing in coverage and removes the partiality that is the genuine obstruction. Restricting first, generalizing later (M1′) is the standard mechanization move and keeps each rung honestly `--safe`.
- **B after A, because B's "behaviour" is A's behaviour.** The HoTT scheme artifact is only fully grounded once orthogonality of designs is a real Agda relation; doing B first would re-introduce the opacity T003 already removed on paper but not in type theory.
- **Direction 5 stays low-risk by construction** — each rung is independently valuable and publishable (finite Ludics; associativity; separation; completeness; a HoTT scheme PoC), so the track degrades gracefully if a later rung stalls, exactly the property that justified running it in parallel in the first place.

---

## 3. Work plan

| Step | What | Depends on | Output / promotion target |
|------|------|-----------|---------------------------|
| **M0** | Design-carrier decision: audit `stepCore`/`stepper`/`separation`, fix the `--safe`-encodable design representation that mirrors the engine; type-only stub | engine code (no Agda) | ✅ **done 2026-06-09** — audit [`m0-design-carrier-ludics-core-2026-06-09.md`](../audits/m0-design-carrier-ludics-core-2026-06-09.md) + stub [`mechanisation/agda/ludics/Core.agda`](../mechanisation/agda/ludics/Core.agda) (type-checks, EXIT:0); decision §6 below |
| **M1** | `Design`, `⟨_|_⟩`, `_⊥_` for the **finite terminating fragment**; standalone `agda/ludics/` tree + README | M0 | ✅ **done 2026-06-09** — `interact` defined in [`ludics/Core.agda`](../mechanisation/agda/ludics/Core.agda), `--safe --without-K`, no postulates/holes, EXIT:0; postulate discharged; §7 below |
| **M1′** | Lift to infinitary/partial via sized types/coinduction | M1 (+ if M1 sound) | staged extension; *not* on the critical path |
| **M2** | Associativity of interaction | M1 | ✅ **done 2026-06-09** (re-scoped) — determinacy + fuel-monotonicity in [`ludics/Interaction.agda`](../mechanisation/agda/ludics/Interaction.agda), `--safe`, EXIT:0; associativity *proper* re-scoped to need composition first ([Q-046](../01_OPEN_QUESTIONS_REGISTRY.md)); §8 below |
| **M3** | Separation theorem (Böhm-analogue) — **fused Direction-2 minimality certificate** | M1, M2 | ✅ **done 2026-06-09** — behavioural separation in [`ludics/Separation.agda`](../mechanisation/agda/ludics/Separation.agda), `--safe`, EXIT:0; **+ M3-bridge** [`ludics/Locus.agda`](../mechanisation/agda/ludics/Locus.agda) (`interactL` + first-divergence locus = T006 E0 on the T008/T009 `List ℕ` object, projection law, unique/stable); deep half (Böhm proper, eventual-decidedness pigeonhole, per-line antichain) named under [Q-046](../01_OPEN_QUESTIONS_REGISTRY.md); §9–§10 below |
| **M4** | Internal completeness `B = B^⊥⊥` for designs, via `lib/Closure.agda` `Biorthogonal` | M1 | ✅ **done 2026-06-09** — [`ludics/Completeness.agda`](../mechanisation/agda/ludics/Completeness.agda), `--safe`, EXIT:0; behaviours = closed design sets, generation, polars-are-behaviours, **internal completeness** `pol⁺(clo S)≡pol⁺ S`; §11 below |
| **M5** | HoTT scheme PoC: one scheme as dependent type, CQs as eliminators, univalence `≃→≡` | M1–M4, T003 | separate `agda/hott/` cubical tree; cashes Slogan B; corroborates T003 |

**Toolchain note (load-bearing):** the corroboration corpus is `--safe --without-K` on stdlib v2.0; **M5 requires cubical Agda** and therefore a *segregated* `agda/hott/` directory with its own `.agda-lib` and its own `OPTIONS` (`--cubical`, *not* `--without-K`). Do not contaminate the existing `mesh-substrate.agda-lib` with cubical deps. M0–M4 stay in the existing `--safe` regime.

---

## 4. Open forks (NOT resolved this session — honour the no-premature-premise discipline)

- **Fork A (design carrier).** Chronicle/strategy vs Terui-computational vs substrate-mirroring. *Recommendation logged (substrate-mirroring, finite-first) but NOT adopted* — it is M0's job to settle it against the engine, the same way Session 01 settled confidence against the reducers.
- **Fork B (type theory for schemes).** Plain Agda (external iso) vs cubical/HoTT (univalent `≡`). *Recommendation logged (cubical, staged last, small) but NOT adopted.*
- **Normalization encoding.** Fuel/step-indexed vs sized-types/coinduction vs finite-fragment-only. *Recommendation: finite-fragment-first (M1), the rest staged as M1′* — but the choice for M1′ is open.
- **Whether M3 subsumes or merely corroborates T009.** Conjecture: a constitutive separation theorem on the real design object *subsumes* the concrete-locus T009 lemmas. To be confirmed at M3, not assumed.

---

## 5. Decisions recorded this session

- **Resolved (framing):** Direction 5 today is a **corroboration reflex** (per-theorem Agda evidence on convenient models), not yet the **constitutive Ludics core** §5 promises. The two flagship artifacts — standalone mechanized Ludics core, and a HoTT scheme treatment — are **both unstarted**; everything landed (T001/T002/T004/C004/T009 + `lib`) is corroborating.
- **Resolved (key inventory leverage):** `lib/Closure.agda` **already** contains the abstract `Biorthogonal` (`B = B^⊥⊥`) machinery over an opaque `_⊥_`. The constitutive gap is therefore *not* the closure theory but the **interaction engine that would instantiate `_⊥_`**. This makes internal completeness (M4) cheap *conditional on* the design/interaction core (M1), and dictates the build order.
- **Resolved (sequencing):** **M0 → M1 → M2 → M3 → M4 → M5**, with **M1′ (infinitary normalization) staged behind M1**, not blocking. Start with the **finite terminating fragment** (substrate contract L3) — it carries every existing theorem and removes the partiality that is the genuine twenty-year obstruction.
- **Resolved (the synergy is the plan, not a bonus):** **M3 (separation) is simultaneously the §5 crown and the Direction-2 minimality certificate.** It is the single fusion point; resource it as the joint 2/5 deliverable. This is the concrete cash-out of [IMPLEMENTATION_TRACKS.md §"foundational program"](../IMPLEMENTATION_TRACKS.md)'s claim that "formalizing separation in Agda is both the Direction-5 deliverable and the strongest check on Direction 2."
- **Resolved (ordering of the two slogans):** **A before B** — Slogan B's "behaviour" *is* Slogan A's design-orthogonality, so the HoTT scheme artifact (M5) is only fully grounded after the constitutive core (M1–M4). Doing B first would re-open the opacity T003 closed on paper.
- **Resolved (toolchain segregation):** M5 needs **cubical Agda** in a separate `agda/hott/` tree with its own `.agda-lib` and `--cubical` options; the `--safe --without-K` corroboration corpus stays untouched.
- **Parked:** the full infinitary Ludics (M1′), the full catalogue port of schemes-as-types (M5 is a single-family PoC), and any `agda-categories`/`coq-mathcomp` route (the existing hand-rolled `lib` substrate is the chosen idiom).
- **Conjecture (not premise):** that M3 *subsumes* (not merely corroborates) the concrete-locus T009 lemmas; confirm at M3.
- **Next concrete step:** execute **M0** — the design-carrier audit against `packages/ludics-engine/stepCore.ts` / `stepper.ts` / `separation.ts`, producing the carrier decision and the type-only `agda/ludics/Core.agda` stub. No theorem, no proof, no production change — the analogue of Session 07's A0 audit.

---

## 6. M0 executed (2026-06-09)

**Done.** Carrier audit filed at [`audits/m0-design-carrier-ludics-core-2026-06-09.md`](../audits/m0-design-carrier-ludics-core-2026-06-09.md); type-only stub [`mechanisation/agda/ludics/Core.agda`](../mechanisation/agda/ludics/Core.agda) type-checks (Agda 2.7.0.1 / stdlib v2.0, `--without-K`, EXIT:0); `ludics/` [README](../mechanisation/agda/ludics/README.md) added; `ludics` added to `mesh-substrate.agda-lib` include; the five `--safe` artifacts (T001/T002/C004/T009/lib.Closure) re-verified EXIT:0 (corpus unaffected).

**Fork A resolved → substrate-mirroring, finite/fuel-indexed** (the audit's option (c)). The decision was *forced by the engine, not chosen on aesthetics*:

- **The engine already factored the carrier.** `stepCore`'s `CoreAct` (`kind`, `polarity`, `locusId`, `isAdditive`) *is* the structural subset the interaction loop reads; the wider `DialogueAct`/`LudicDesign` (text, ramification, ids) is never consulted. ⟹ `Design = List Act`, `Act ≅ CoreAct` minus `id`.
- **Decisive finding — the loop is already step-indexed.** `for (let steps = 0; steps < fuel; steps++)`, fuel ≤ 10 000. So the "twenty-year-hard" partial-normalizer problem **does not arise for the fragment the platform runs**: M1's `interact : ℕ → Design → Design → Status` is a *transcription*, not a partiality-taming exercise. Partiality re-enters only at **M1′** (infinitary), exactly as staged.
- **Locus model inherited, not invented.** `Locus = List ℕ`, the same object as [`separation.ts`](../../packages/ludics-engine/separation.ts) `isPrefixLocus` and the landed [T009](../mechanisation/agda/T009/T009.agda); the engine's `locusId↔path` indirection collapses in a pure model, and match-by-equal-`locusId` becomes `≡` on `List ℕ` (= T009's match-by-equal-address). This is the first concrete payoff of the **M3 fusion** — separation's locus object and the engine's are literally the same Agda type.
- **Orthogonality verbatim.** `D ⊥ E := ∃ n, interact n D E ≡ CONVERGENT`, mirroring [`checkOrthogonal.ts`](../../packages/ludics-engine/checkOrthogonal.ts) `orthogonal = status === 'CONVERGENT'`. **`_⊥_` is already *defined*** in the stub (only `interact` is postulated) — so M4's feed into `lib/Closure.agda`'s `Biorthogonal` is type-ready.
- **Three scope cuts logged for M1** (audit §4): additive fragment (stage M2→M3, needed for branching parity per Q-039), consensus testers (out of `ludics/` entirely — bridge layer), focus/phase gate (optional, post-M4).
- **Stub discipline:** `Core.agda` is the **only** non-`--safe` file, banner-marked, hosting the single `postulate interact`; nothing in the `--safe` corpus imports it, so the corpus stays safe-clean. **M1 discharges the postulate and restores `--safe`.**

**Next concrete step (M1):** define `interact` by fuel-recursion implementing the multiplicative loop (audit §4 — `findNextPositive` / `findNextNegativeAtLocus`-at-equal-locus / alternating A·B cursor / four-way status), discharge the `postulate`, promote `Core.agda` to `--safe`, and open the "mechanized finite Ludics" conjecture/OQ. Additive, testers, phase stay out per the logged cuts.

---

## 7. M1 executed (2026-06-09)

**Done.** `interact` is **defined** in [`ludics/Core.agda`](../mechanisation/agda/ludics/Core.agda); the M0 `postulate` is discharged and `--safe` is restored. The file now type-checks `--safe --without-K`, **no postulates, no holes, EXIT:0**, and is a full member of the safe corpus (all seven artifacts — T001/T002/C004/T009/lib.Order/lib.Closure/ludics.Core — re-verified green together).

**What M1 is:** a *faithful transcription* of the multiplicative fragment of the engine loop `stepCore`, not an idealization. The decisive M0 finding (the loop is already step-indexed) made this a transcription, exactly as predicted:

- **`interact : ℕ → Design → Design → Status`** = `loop` by structural fuel-recursion. Each `suc f` is one engine `for`-iteration; `zero` fuel ⇒ `ONGOING` (= engine fuel-exhausted). Terminating, hence `--safe`.
- **The two finders transcribed verbatim:** `findNextPositive from acts` (`drop`-then-scan for the next DAIMON / PROPER-P, absolute indices preserved); `findNextNegativeAtLocus loc used acts` (search **all** acts from 0 for an unused PROPER-O at the **equal** locus — the engine's "search ALL acts … not just from cursor" + match-by-equal-address, = T009's rule).
- **The alternating handshake** (`Side`/`St`/`advance`): producer and provider swap each match, **both** cursors advance, and the dual's index joins the provider's used-set. The engine's id-keyed `usedNegActIds` is recovered **structurally** as two per-list index sets (`usedA`/`usedB`) — equivalent because A and B are distinct lists.
- **Four-way status faithful:** no positive ⇒ `STUCK` (engine `no-response`); DAIMON ⇒ `CONVERGENT`; PROPER-P with no dual ⇒ `DIVERGENT` (engine `incoherent-move`); fuel out ⇒ `ONGOING`. The other engine DIVERGENT causes (`additive-violation`, `consensus-draw`) **cannot arise** because their machinery is out of scope (audit §4) — so the fragment's only divergence is an unmatched positive, as intended.
- **`_⊥_` unchanged** from M0 (`∃ n, interact n D E ≡ CONVERGENT`); it was already a real definition, now with real content underneath.
- **Non-vacuity by `refl`:** five worked checks — one per status (`ex-stuck`, `ex-conv-trivial`, `ex-div`, `ex-conv-handshake`, `ex-ongoing`) plus an orthogonality witness (`ex-orth : (p0 ∷ []) ⊥ (o0 ∷ dai ∷ [])` with fuel 2). The handshake example exercises the alternation, the equal-address match, and both cursors.

**Scope cuts held (audit §4):** additive (carrier field present, unread), consensus testers (absent), focus/phase (absent). No silent widening.

**Honest status of the artifact.** This is the **constitutive** core's first real object: `interact` is *the* function, not a re-encoding of a paper theorem on a toy carrier — it is the same multiplicative semantics `stepCore` runs. But M1 proves **no theorem about it yet**; the examples are computations, not laws. The laws are M2 (associativity) and M3 (separation). The "mechanized finite Ludics" conjecture/OQ remains to be opened in the registry as the umbrella these land under — deferred to M2 so it can be stated with its first real theorem rather than as an empty placeholder.

**Next concrete step (M2):** state and prove **associativity of interaction** over the finite fragment — the first constitutive *theorem*, and the point at which the "mechanized finite Ludics" OQ should be filed. The additive fragment is folded in between M2 and M3 (needed for branching parity, Q-039) before separation (M3) fuses with Direction 2.

---

## 8. M2 executed (2026-06-09) — re-scoped on contact with the implementation

**Done**, with the kind of honest re-scoping the programme rewards. [`ludics/Interaction.agda`](../mechanisation/agda/ludics/Interaction.agda) type-checks `--safe --without-K`, no postulates/holes, EXIT:0 (full corpus, now eight artifacts, green together). The "mechanized finite Ludics" umbrella OQ is filed as **[Q-046](../01_OPEN_QUESTIONS_REGISTRY.md)**.

**The named obstruction (the real M2 finding).** Session 09 §2 named M2 "associativity of interaction." On contact with the M1 carrier, associativity *proper* is **not statable**, for two precise reasons — and naming them *is* the result (cf. T007's refutation, the one-hop-contract reframe):

1. **`interact : ℕ → Design → Design → Status` is two-party and Status-valued.** Associativity $\langle(D\circ E)\circ F\rangle = \langle D\circ(E\circ F)\rangle$ needs a **composition / cut** operation taking two designs to a *residual design* (cut on a shared locus, normalize to a new design). M1 collapses each run to a `Status`; it has no such operation. **Composition is a prerequisite step, not a corollary of M1.**
2. **The confluence reading is vacuous.** The other classical sense of "associativity of normalization" is Church–Rosser — normal form independent of reduction order. But `interact` is **deterministic** (each `step1` has exactly one successor; one fixed trajectory). With no reduction-order freedom there is nothing to confluently reorder. So the entire content of "associativity" lives in the multi-party composition of (1).

**What M2 delivered instead — the well-definedness backbone the slogan presupposed.** What *is* statable and load-bearing over M1 is that the normalizer behaves like one:

- **Determinacy** (`interact-det`): the run is determinate by construction — we modelled normalization as a *function*, not a relation.
- **Fuel-monotonicity** (`loop-mono` → `interact-mono-suc` → `interact-mono-≤`): once a run is **decided** (CONVERGENT / DIVERGENT / STUCK), more fuel never changes the verdict; only ONGOING can flip. Proof by fuel-induction generalized over the state; the `step1` factoring (Core §6) makes it a clean two-case `with`.
- **Orthogonality is fuel-independent** (`⊥-upward`, `⊥-eventually`): `D ⊥ E` (converges at *some* fuel) ⇒ converges at *every* larger fuel. **This is exactly what M4's `B = B^⊥⊥` needs** — orthogonality is a property of the design pair, not of the chosen budget. So M2, though not associativity, is precisely the lemma that unblocks M4.
- **Non-vacuity:** the Core handshake (converges at fuel 2) yields convergence at fuel 5 *for free* via monotonicity, and the DIVERGENT verdict is shown equally stable — the theorems fire on real runs, not just types.

**Refactor (behavior-preserving):** Core §6 now factors the one-step decision into `step1 : Design → Design → St → Step` (`done`/`cont`), with `loop` a plain iterator. `interact` and all M1 examples are unchanged (still `refl`); the factoring exists only so the M2 induction is structural.

**Next concrete step (M3 prerequisite):** **define a composition / cut operation** on designs so associativity becomes statable; prove associativity over the finite fragment; fold in the additive fragment ([Q-039](../01_OPEN_QUESTIONS_REGISTRY.md#q-039) branching parity); then the separation theorem (M3) as the fused Direction-2/5 deliverable. Tracked under [Q-046](../01_OPEN_QUESTIONS_REGISTRY.md) next-action.

---

## 9. M3 executed (2026-06-09) — separation taken directly over `interact`

**Done.** [`ludics/Separation.agda`](../mechanisation/agda/ludics/Separation.agda) type-checks `--safe --without-K`, no postulates/holes, EXIT:0 (corpus now nine artifacts green together).

**Route decision (recorded).** M2 left two threads both loosely called "M3": (a) *composition/cut → associativity* (the parked prerequisite), and (b) *separation* (the planned crown + Direction-2 fusion). **M3 takes route (b), and the reason is structural:** Girard separation is the statement that designs are distinguished by their behaviour **under interaction** — and interaction-as-`Status` is exactly what M1 provides. So separation is statable **directly over `interact`, with no composition required**. Route (a) (full cut-elimination) stays parked under [Q-046](../01_OPEN_QUESTIONS_REGISTRY.md); it is the genuinely multi-session "twenty-year" piece and is not on the critical path for the crown.

**What M3 proved (the sound, constitutive core):**

- **Behaviour + observational equivalence.** `Beh D = λ E → D ⊥ E`; the preorder `D₁ ≼ D₂` (every test D₁ passes, D₂ passes) and equivalence `_≈_`, with full preorder/equivalence laws.
- **The biorthogonal characterisation — and the M4 object, delivered early.** Instantiating the *already-built* [`lib.Closure.Biorthogonal`](../mechanisation/agda/lib/Closure.agda) at the design orthogonality `_⊥_` makes `Beh D` the **right polar `pol⁺⟨D⟩`** of the design's singleton (`Beh→pol`/`pol→Beh`), so observational equivalence is **equality of polars** and the biorthogonal closure `clo = (·)^⊥⊥` and the closed behaviours `Closed` are now in scope over designs. This is exactly what M4 was scheduled to build; the inventory bet from §2 ("the closure half is already done") cashed out one step early.
- **Separation, sound half.** `≡⇒≈` (structural equality ⇒ observational equivalence — the easy half of the separation theorem); and the **testing characterisation**, sound directions: a separating test refutes equivalence (`separates⇒≉`) and equivalent designs admit none (`≈⇒no-separator`).
- **Fuel-robustness** of behaviour, inherited from M2 (`Beh-eventually`): membership is budget-independent, so the whole apparatus is a property of the design pair.
- **A constructive separation that fires:** the empty test `[]` separates the daimon-design `o0 ∷ dai ∷ []` (converges at fuel 1) from the bare positive `p0 ∷ []` (DIVERGENT at every fuel ≥1, ONGOING at 0 — `¬orth-bare` by absurd-pattern on the fuel), hence `¬ ((o0∷dai∷[]) ≈ (p0∷[]))`. Not just types — a real discriminated pair.

**The deep half, named not assumed (programme discipline):**

1. **Böhm/Girard separation proper** — `≈ ⇒` equality of **incarnations** (material designs). The easy converse is here; the hard direction needs an incarnation operation absent in M1.
2. **The Direction-2 minimal locus** — that a separating test's failure has a determinate **first-divergence locus**, *minimal* in the T006/T008/T009 sense. The bridge needs a locus-returning `interactL : ℕ → Design → Design → Status × Maybe Locus` with `proj₁ ∘ interactL ≡ interact` (mirroring the engine's `stepCore`, which returns both `status` and `divergenceLocus`), plus an **eventual-decidedness lemma for finite designs** (the run leaves `ONGOING` within fuel ≈ `length D + length E` — the substantive step, complementary to M2's fuel-monotonicity). A *single* run gives one locus = the E0 of [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md), single-chronicle-minimal per [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md); the **per-line antichain** of [T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md) is assembled by per-line `interactL` runs fed to T009's already-mechanised order theory (`maximalLoci` glue). All three are **multiplicative additive-free**, so the parked additive cut is not a dependency; the off-thread `O-faithful` gate stays parked. This is the concrete fusion step.

**Net:** the separation *framework* and its sound core are mechanised over the real `interact` object; the crown's deep direction and the Direction-2 locus refinement are precisely scoped as the remaining work, both under [Q-046](../01_OPEN_QUESTIONS_REGISTRY.md).

**Next concrete step:** the highest-leverage single item is **`interactL`** (locus-returning interaction) plus its **eventual-decidedness lemma** — together they bridge a *single* run to the [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md)/[T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md) first-divergence locus, and per-line runs to the already-mechanised [T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md) antichain, turning the named fusion into a theorem (all in the multiplicative additive-free fragment, so the additive cut is not a dependency). In parallel, M4 can finish the `Closed`/`clo`-for-designs consequences now that the `Biorthogonal` instantiation exists. Composition/cut (route a) remains the separate, parked, multi-session associativity track. **Gating verdict (2026-06-09): cleared, no hard blocks** — the only substantive step is the eventual-decidedness lemma; `interactL` plumbing and the projection law are mechanical.

---

## 10. M3-bridge executed (2026-06-09) — `interactL` + the first-divergence locus

**Done.** [`ludics/Locus.agda`](../mechanisation/agda/ludics/Locus.agda) type-checks `--safe --without-K`, no postulates/holes, EXIT:0 (corpus now ten artifacts green together). This lands the highest-leverage item from §9 — the Direction-2 fusion — exactly as the gating verdict scoped it.

**What the bridge proves:**

- **`interactL : ℕ → Design → Design → Status × Maybe Locus`** — the interaction loop, now also returning the divergence-locus candidate (faithful to the engine `stepCore`'s `divergenceLocus`: a `Maybe Locus`, `just loc` exactly on the unmatched-positive break, `nothing` on CONVERGENT/STUCK/no-locus). Implemented via a small `divLocus1` helper added to [`Core.agda`](../mechanisation/agda/ludics/Core.agda) that mirrors `step1`'s case analysis.
- **Projection law `proj₁ ∘ interactL ≡ interact`** (`interactL-proj`) — the status component is byte-for-byte M1's `interact`; the locus is pure extra information that never perturbs the verdict. This is the faithfulness the gating verdict promised, now a theorem.
- **Fuel-monotonicity of the pair** (`interactL-mono-≤`) — the M2 argument replayed for the (status, locus) pair: a decided outcome, locus included, is stable under more fuel.
- **First-divergence locus, unique and fuel-stable** (`divLocus-stable`, `divLocus-unique`) — this is **T006's E0**, now mechanised over the constitutive `interact`. Crucially `ℓ : Locus = List ℕ` is *literally* the T008/T009 object (the segment-wise prefix model of `separation.ts`), so the extracted locus feeds their minimality theorems with **no translation** — the fusion is real, not analogical.

**The one substantive obligation, named not faked.** Turning `¬ (D ⊥ E)` into "∃ ℓ, the pair diverges at ℓ" needs **eventual-decidedness** (a finite pair leaves `ONGOING` within bounded fuel). §5 of the file states it precisely and — this is the value — identifies the *genuine* crux:

- **The naive cursor measure fails.** `(length D ∸ curA) + (length E ∸ curB)` does *not* decrease, because the dual-search `findNextNegativeAtLocus` scans **all** provider acts from 0 (engine: "search ALL acts … not just from cursor"), so the **provider cursor can jump backward**. This is exactly why the engine needs a fuel cap and why termination is non-trivial.
- **The correct measure is used-set growth.** Each `cont` step records the matched O-act's index in the provider used-set, and `scanNeg` skips used indices, so every step consumes a **distinct, previously-absent** provider index `< length`. Hence `#cont ≤ length D + length E`. The genuine crux is the **pigeonhole** (distinct indices `< L` ⇒ count `≤ L`), mechanisable via stdlib `Unique` + a counting lemma — the analogue of the bound T009 already carries. Left under [Q-046](../01_OPEN_QUESTIONS_REGISTRY.md), not postulated; nothing above it depends on it.

**Non-vacuity by `refl`:** the bare positive `p0 ∷ []` diverges at the root `ℓ0 = 0 ∷ []`; the pair, the projection, the extracted `divergenceLocusOf`, and fuel-stability of the locus to fuel 4 are all checked.

**Net for Direction 2:** the single-run first-divergence locus is mechanised and pinned to the exact `List ℕ` object the established T006/T008/T009 reason about. The remaining work to "the platform identifies *the minimal* place you disagree" is (i) the eventual-decidedness pigeonhole (existence), and (ii) the per-line assembly into T009's antichain (`maximalLoci` glue) — both sharply scoped under Q-046.

**Next concrete step:** discharge **eventual-decidedness** (the used-set pigeonhole) to get existence of the divergence locus, then the per-line `maximalLoci` assembly to reach the T009 Smyth-minimal antichain. M4's `Closed`/`clo`-for-designs consequences remain available in parallel.

---

## 11. M4 executed (2026-06-09) — behaviours & internal completeness

**Done.** [`ludics/Completeness.agda`](../mechanisation/agda/ludics/Completeness.agda) type-checks `--safe --without-K`, no postulates/holes, EXIT:0 (corpus now eleven artifacts green together). This lands the **M4** milestone of the master plan and cashes the §5 "internal completeness" slogan — the last of the core constitutive theorems (M1 interaction · M2 determinacy/monotonicity · M3 separation · M3-bridge locus · M4 completeness).

**The §2 inventory bet paid off exactly as predicted.** §2.1 argued M4 would be "cheap *conditional on* M1" because the biorthogonal-closure half was already built abstractly in [`lib.Closure`](../mechanisation/agda/lib/Closure.agda) (`Biorthogonal`) and only needed `_⊥_` instantiated. M3 did that instantiation; M4 is a short read-off:

- **Behaviour = biorthogonally-closed design set** (`Behaviour G = clo G ≐ G`, i.e. `G = G^⊥⊥`), with the always-true expansion half and the behaviour-only contraction half separated.
- **Generation:** the closure of any design set *is* a behaviour (`clo-behaviour`) and is the **least** behaviour containing it (`clo-least`) — `clo S` is the behaviour generated by S.
- **Every polar is a behaviour** (`polar-behaviour`): the designs orthogonal to a fixed test-set are biorthogonally closed, so behaviours are exactly the double-polars.
- **Internal completeness proper** (`internal-completeness`): `pol⁺ (clo S) ≐ pol⁺ S` — closing a design set does **not** change the tests it passes. The generated behaviour already contains every design the tests can see; nothing new is reachable by appeal to the ambient logic. This is Girard's internal completeness, now a theorem over the real `interact`-orthogonality (not a toy carrier).
- **Non-vacuity:** the designs orthogonal to the daimon-test form a concrete inhabited behaviour containing the Core handshake.

**Faithfulness chain closed:** `_⊥_` is M1's `interact`-convergence, M2-proved fuel-independent (well-defined), M3-shown to characterise behaviour, M4-shown biorthogonally complete — all over the same design object the engine computes on.

**Net plan status:** the constitutive core (M1–M4 + the M3-bridge locus) is mechanised and `--safe`. What remains of Direction 5: the **M5** HoTT scheme proof-of-concept (separate cubical tree), and three precisely-scoped obligations under [Q-046](../01_OPEN_QUESTIONS_REGISTRY.md) — eventual-decidedness (the used-set pigeonhole, for locus *existence*), the per-line `maximalLoci` assembly into the T009 antichain, and the parked composition/cut → associativity track (full cut-elimination).

**Next concrete step:** either (a) the eventual-decidedness pigeonhole + per-line antichain assembly to finish the Direction-2 fusion, or (b) open the **M5** cubical `hott/` tree for the scheme proof-of-concept (the last unstarted §5 slogan, "scheme identity is behaviour-extensional = univalence"). Composition/cut → associativity stays the parked multi-session track.

---

## 12. Composition/cut track opened (2026-06-10) — M2-associativity, step 1

**Done (step 1).** [`ludics/Composition.agda`](../mechanisation/agda/ludics/Composition.agda) type-checks `--safe --without-K`, no postulates/holes, EXIT:0 (corpus now twelve artifacts green together). This *starts* the parked composition/cut → associativity track — the named M2 obstruction — by building the structural backbone of cut bottom-up, rather than attempting the full cut-elimination theorem in one go.

**What's proven (the structural layer of cut):**

- **Relocation** `relocate p D` — prepend a locus prefix to every act (the abstract form of the engine's delocation, [`delocate.ts`](../../packages/ludics-engine/delocate.ts) / `cloneDesignWithShift`), proven **functorial**: `relocate [] = id` and `relocate p ∘ relocate q = relocate (p ++ q)` (a monoid action of `(List ℕ, ++)` on designs).
- **Disjoint merge** `_⊕ᴰ_` — juxtaposition on disjoint sub-addresses (the multiplicative par one level up from designs), proven a **strictly-associative monoid** (`⊕-assoc`, `⊕-identityˡ/ʳ`), with relocation distributing over it (`relocate-⊕`).
- **Cut** `cut D E` — left/right-tag shift then merge, faithful to the engine `compose.ts` `spiritual` branch (`cloneDesignWithShift(_,'L'/'R')` then join under disjoint directories); proven relocation-natural (`relocate-cut`).

**The two named obligations (§5, neither postulated):**

- **(A) Strict associativity of `cut` fails — it holds only up to the associator.** `cut (cut D E) F` tags D,E,F at LL/LR/R; `cut D (cut E F)` tags them at L/RL/RR. These designs differ by a per-operand locus renaming (LL/LR/R ↦ L/RL/RR) — the bicategory **associator**, a locus *isomorphism*, not a uniform `relocate p`. The strictly-associative operation is the **merge** `_⊕ᴰ_` (proven); the tagged `cut` inherits exactly the associator coherence the Plexus pseudofunctor work (T010) handles at the transport level. Mechanising the associator + its pentagon is the next concrete step on this track.
- **(B) Associativity of the residual-cut normalizer — the deep theorem (cut-elimination).** It needs `normCut : ℕ → Locus → Design → Design → Design` returning the *surviving* design (M1's `interact` collapses the run to a `Status`). Its associativity (for distinct cut loci) is Church–Rosser, and its crux is **confluence at distinct cut loci = T009's already-mechanized O-parity-b non-interference** (matches are by equal address, so cuts at ⊑-incomparable loci never interfere). So the hard content is already abstractly in hand; what remains is (i) defining `normCut` as a residual-producing fuel-recursion (mirroring `loop` but retaining survivors), and (ii) porting O-parity-b from "no cross-line match" to "cuts at incomparable loci commute". This is the multi-session cut-elimination piece.

**Honest status:** composition now *exists* and a genuine associativity is proven — the disjoint **merge** is a strictly-associative monoid, which is the multiplicative backbone of cut. "Associativity proper" (of `cut`) is unblocked in the sense that its two remaining theorems are now precisely posed: (A) the structural associator/pentagon, and (B) the interaction-level cut-elimination whose crux is already mechanized in T009. Both tracked under [Q-046](../01_OPEN_QUESTIONS_REGISTRY.md).

**Next concrete step:** (A) define the associator locus-renaming and prove `cut`-associativity up to it (structural, reuses the relocation laws); then (B) define `normCut` and port the O-parity-b non-interference argument to cut-commutation. M5 (the cubical HoTT scheme PoC) remains the other open front.

---

## 13. Composition/cut step 2 (2026-06-10) — the associator: obligation (A) discharged

**Done.** [`ludics/Composition.agda`](../mechanisation/agda/ludics/Composition.agda) extended (still `--safe --without-K`, no postulates/holes, EXIT:0; corpus twelve artifacts green). Obligation **(A)** named in step 1 — *cut is associative only up to the associator* — is now a theorem, in **both directions**.

**What's proven:**

- **The associator as a genuine locus isomorphism.** `cut (cut D E) F` tags its three operands at LL = `0.0`, LR = `0.1`, R = `1`; `cut D (cut E F)` tags them at L = `0`, RL = `1.0`, RR = `1.1`. The associator `assocL : Locus → Locus` is the per-operand renaming LL↦L, LR↦RL, R↦RR (inverse `assocL⁻¹`) — a real iso, *not* a uniform `relocate p` (it acts by a different prefix on each operand, which is exactly why strict associativity fails).
- **`cut-assoc`** : `renameDesign assocL (cut (cut D E) F) ≡ cut D (cut E F)` — forward.
- **`cut-assoc⁻¹`** : `renameDesign assocL⁻¹ (cut D (cut E F)) ≡ cut (cut D E) F` — backward; together they witness the associator as an actual isomorphism, not a one-sided coincidence.
- **The supporting machinery** is all reuse of step-1 laws: a generic `renameDesign` (act-wise locus map), the fusion lemma `rename-reloc` (renaming after relocation = relocation by a shifted prefix, given `r (p ++ ℓ) ≡ p′ ++ ℓ`), and `renameDesign-⊕` (= `map-++`). The two normal-form lemmas `cut-nfL`/`cut-nfR` are single `relocate-cut` rewrites; the main proofs are clean `≡-Reasoning` chains whose only non-`refl` steps are the three per-operand `rename-reloc` instances and one `⊕-assoc`. Each `rename-reloc` hypothesis discharges by `λ _ → refl` because the associator clauses reduce on the produced prefixes definitionally.
- **Non-vacuity:** `ex-assoc` runs the forward equation on a concrete left-nested cut.

**Net:** "associativity proper" for the *structural* cut is now fully accounted for — strictly on the merge `_⊕ᴰ_`, and up to the proven associator iso on the tagged `cut`. The two remaining items are precisely the associator **pentagon** (Mac Lane coherence — a finite locus-renaming computation in the same idiom) and obligation **(B)**, the residual-cut normalizer's associativity (cut-elimination, crux = T009 O-parity-b).

**Next concrete step:** either the associator **pentagon** (cheap, same idiom — finishes the structural bicategory coherence of `cut`) or obligation **(B)** `normCut` (the deep cut-elimination piece). M5 (cubical HoTT scheme PoC) remains the other open front.

---

## 14. Track-remainder plan + Round 1 (the pentagon) executed (2026-06-11)

**Plan recorded (three phases).** The Direction-5 remainder is sequenced as:

- **Round 1 (close-out, short): the associator pentagon.** Finishes the *structural* bicategory coherence of `cut`. Low-risk, same locus-renaming idiom as `cut-assoc`. **— DONE this session (below).**
- **Round 2 (sprint): obligation (B)** — `normCut` residual-cut normalizer + its associativity (cut-elimination), crux = T009 O-parity-b. The genuine multi-session piece. Completing it closes **the three core theorems §5 names — associativity ∧ separation ∧ internal completeness** — i.e. Q-046's "positive" criterion for the finite fragment, making "mechanized finite Ludics core" a self-contained publishable unit.
- **Then M5 (sprint): the cubical/HoTT scheme PoC.** Sits cleanly *on top of a completed core*. **Ordering rationale:** B before M5 because B completes the core (the canonical M2→…→M5 order); but M5 is genuinely independent (its "behaviour" is M1/M4, already done; segregated `--cubical` tree), so it is a **parallelizable fallback** if B stalls, not a hard successor.

**Round 1 done.** [`ludics/Composition.agda`](../mechanisation/agda/ludics/Composition.agda) §6 adds the **associator pentagon**, `--safe --without-K`, no postulates/holes, EXIT:0 (corpus twelve artifacts green). Mac Lane coherence for `cut` is now mechanised:

- **Whiskering** `whiskerL` / `whiskerR` — apply a locus renaming only under the left / right tag (the associator applied to a triple sitting *inside* an outer cut). With a generic **fusion lemma** `renameDesign-reloc-fusion` (`f (p ++ y) ≡ p′ ++ r y` ⇒ renaming-after-relocate = relocate-after-renaming) and `renameDesign-id`, each whisker reduces to: `renameDesign-whiskerL-cut` (renames the left operand, fixes the right) and `renameDesign-whiskerR-cut` (mirror).
- **`pentagon-top`** : two top-level associators send `((AB)C)D` to `A(B(CD))`.
- **`pentagon-bottom`** : whiskerL-assocL → assocL → whiskerR-assocL sends `((AB)C)D` to `A(B(CD))` (the three-edge route).
- **`pentagon`** : the two routes agree (`trans pentagon-top (sym pentagon-bottom)`).

**Why it stayed cheap:** every associator in this concrete encoding is the *same* content-independent `assocL` (top-level) or a whiskering of it; the whole pentagon reduces to `cut-assoc` applied five times (twice top, three times bottom under whiskerings) plus the fusion lemma — all `≡-Reasoning`, no new conceptual content. Both routes are proven to land on the *same* `A(B(CD))`, which is the pentagon by transitivity.

**Net:** the **structural** layer of cut is now bicategorically coherent — strict on the merge `_⊕ᴰ_`, associative up to the associator iso (§5), and the associator satisfies the pentagon (§6). The only remaining composition obligation is **(B)** the residual-cut normalizer (cut-elimination).

**Next concrete step:** **Round 2** — obligation (B): define `normCut : ℕ → Locus → Design → Design → Design` as a residual-producing fuel-recursion (mirroring `loop` but retaining survivors) and port T009's O-parity-b non-interference from "no cross-line match" to "cuts at incomparable loci commute".

---

## 15. Round 2 step 1 (2026-06-11) — the non-interference crux, proven self-contained

**Done.** [`ludics/CutElim.agda`](../mechanisation/agda/ludics/CutElim.agda) type-checks `--safe --without-K`, no postulates/holes, EXIT:0 (corpus thirteen artifacts green). Round 2 opens by mechanising **the documented crux** of obligation (B) — confluence at distinct cut loci — *self-contained in the cut vocabulary*, rather than leaving it as a by-reference appeal to T009's O-parity-b.

**What's proven:**

- **A K-free prefix order** `_⊑_` on loci (`Locus = List ℕ`, the T008/T009/`separation.ts` model), as a recursive *function* into `Set` (the inductive presentation hit a `--without-K` reflexive-head unification wall — the function form sidesteps it), with decidability `_⊑?_`.
- **`bifurcate`** — two prefixes of a common locus are **comparable**. This is exactly the list fact behind O-parity-b: distinct lines occupy ⊑-incomparable addresses, so they share no descendant.
- **`TouchedBy κ a`** — act `a` is consumed by a cut at `κ` (its locus lies under `κ`); the daimon (no locus) is touched by nothing.
- **`footprint-disjoint`** — **THE CRUX**: at ⊑-incomparable cut loci κ₁, κ₂, *no act is touched by both*. This is O-parity-b ("matches are by equal address, so acts under incomparable loci never interfere") restated and proven for cut loci.
- **`footprint-preserved` / `residual` / `residual-preserves`** — a cut at κ₁ leaves κ₂'s entire footprint intact when the loci are incomparable; the residual `residual κ D` (acts surviving a cut at `κ`, via the decidable footprint) makes this concrete at the list/membership level (`∈-residual⁺`). This is what licenses "cut at κ₁ then κ₂ = cut at κ₂ then κ₁".
- **Concrete witnesses** on the `ℓL = 0` / `ℓR = 1` cut tags (`ℓL-ℓR-incomp`, `footprint-witness`, `ex-residual`).

**Why this is the right first move for Round 2:** the docs (and Q-046) record that obligation (B)'s "hard content is already in hand abstractly" via T009's O-parity-b. Mechanising it *here*, in the cut vocabulary, makes the eventual `normCut` associativity **self-contained** — it no longer reaches into the separation development for its crux. The remaining work is now purely the *definition* of the interaction-level residual normalizer and the routing of `footprint-disjoint` through it.

**Remaining (§5 of the file):** define `normCut : ℕ → Locus → Design → Design → Design` (run `interact` at the cut locus, return the surviving design — `residual` here is the *address-level* residual; `normCut`'s is the *interaction-level* one) and prove its associativity for distinct cut loci, which reduces to the proven `footprint-disjoint`. That is the remaining multi-session piece; once it lands, M2's "associativity proper" closes — the third of the three core theorems §5 names.

**Next concrete step:** define `normCut` as the residual-producing fuel-recursion (mirror `loop`, accumulate survivors) and prove the commutation at incomparable cut loci via `footprint-disjoint`. Then the three core theorems are complete and M5 (the cubical HoTT scheme PoC) is the final Direction-5 front.
---

## 16. Round 2 step 2 (2026-06-11) — `normCut` + cut-commutation at incomparable loci

**Done.** [`ludics/CutElim.agda`](../mechanisation/agda/ludics/CutElim.agda) §5 adds the residual normalizer and proves cut-commutation (`--safe --without-K`, no postulates/holes, EXIT:0; ludics corpus seven files green). This is the load-bearing theorem of obligation (B) — associativity of composition for distinct cuts — with `footprint-disjoint` (the §2 crux) as its engine.

**What's proven:**

- **`normCut κ rs D = residual κ D ++ rs`** — the residual normalizer at cut locus `κ`: drop `κ`'s footprint (the consumed acts) and splice in `rs`, the normal form produced under `κ`. The survivors `residual κ D` are exactly the "accumulate survivors" of a `loop`-style walk that drops the κ-footprint.
- **`normCut-commute`** — for ⊑-**incomparable** cut loci κ₁, κ₂ (and results `rs₁` under κ₁, `rs₂` under κ₂): `normCut κ₂ rs₂ (normCut κ₁ rs₁ D) ↭ normCut κ₁ rs₁ (normCut κ₂ rs₂ D)`. This is associativity of composition for distinct cuts, **up to permutation** (designs are act-multisets — the same order-insensitivity `_⊕ᴰ_` already shows). The proof composes three pieces: `residual-++` (residual distributes over splice), **`residual-fixed-disjoint`** (each cut's result survives the *other* cut — directly `footprint-disjoint`, so incomparability is load-bearing: without it a result would fall in the other's footprint and be consumed), `residual-comm` (the residual cores commute), and `reassoc-↭` (the leftover block-swap is a permutation).
- Supporting: `residual` switched to explicit recursion + `res-drop`/`res-keep` cons-lemmas (the `filter` form left nested `with`-reductions stuck under `--without-K`); `residual-comm` proved via a `where`-helper taking the `Dec` decisions as explicit arguments (a `with` would pollute the goal with abstracted-but-stuck inner residuals — the proof-engineering lesson of this step).

**Why incomparability is the hypothesis that matters:** `normCut-commute` would *fail* for comparable loci — one cut's spliced result would land inside the other's footprint and be consumed, so the order would matter. `footprint-disjoint` is exactly the fact that rules this out for incomparable loci. This is T009's O-parity-b doing its job in the cut setting.

**What remains (§6, the only piece left of (B)):** compute the result `rs` by *running the interaction* rather than taking it as a parameter — `normRun f κ D E = normCut κ (interact-residual f κ D E) (D ⊕ᴰ E)`, where `interact-residual` runs the M1 `interact`/`loop` at `κ` and reads off the survivors (all under `κ` by construction, discharging the `All (TouchedBy κ)` hypothesis `normCut-commute` needs). No new crux — just the definition + the all-under-κ discharge. With it, `normCut-commute` becomes the literal cut-elimination associativity and M2's "associativity proper" closes — the third of the three core theorems §5 names.

**Next concrete step:** the §6 `interact-residual` definition (mirror `loop`, collect survivors under κ) + discharge `All (TouchedBy κ)` for its output — finishing obligation (B). Then **M5** (the cubical HoTT scheme PoC) is the final Direction-5 front.

---

## 17. Round 2 step 3 (2026-06-11) — obligation (B) CLOSED; the three core theorems are mechanized

**Done.** [`ludics/CutElim.agda`](../mechanisation/agda/ludics/CutElim.agda) §6 computes the cut result by interaction and discharges the last hypothesis (`--safe --without-K`, no postulates/holes, EXIT:0; full corpus thirteen artifacts green). **This closes obligation (B) — and with it M2's "associativity proper".**

**What's proven:**

- **`underκ κ D`** — the κ-footprint (acts at or under κ, the complement of `residual`), with **`underκ-All`**: everything it returns is `TouchedBy κ`, by construction.
- **`interact-residual f κ D E`** — the cut's installed result: run the M1 `interact` (genuinely — `with interact f D E`); on `CONVERGENT`, the material in the cut region `underκ κ (D ++ E)`; otherwise empty. **`interact-residual-All`** proves its output is always under κ.
- **`normRun f κ D E = normCut κ (interact-residual f κ D E) (D ++ E)`** — the interaction-computed cut.
- **`normRun-commute`** — for ⊑-incomparable κ₁, κ₂, two cuts whose results are **computed by running the interaction** commute on a common base (up to permutation). It is `normCut-commute` with *both* `All (TouchedBy κ)` hypotheses discharged by `interact-residual-All` — so the commutation no longer rests on any external promise about the cut results; they are the genuine `interact`-derived residuals.

**Significance:** the three core theorems §5 of the brainstorm names — **associativity ∧ separation ∧ internal completeness** — are now all mechanized over the same constitutive `interact` object:
- **separation** = M3 ([`Separation.agda`](../mechanisation/agda/ludics/Separation.agda));
- **internal completeness** = M4 ([`Completeness.agda`](../mechanisation/agda/ludics/Completeness.agda));
- **associativity** = the composition/cut track ([`Composition.agda`](../mechanisation/agda/ludics/Composition.agda) structural coherence + [`CutElim.agda`](../mechanisation/agda/ludics/CutElim.agda) interaction-level commutation).

This is Q-046's "positive" criterion for the finite fragment: **"mechanized finite Ludics core" is now a self-contained, machine-checked unit.**

**The one honest residual (content, not theorem):** the converging cut currently installs the *whole* κ-region `underκ κ (D ++ E)` — the faithful upper bound (everything the cut could retain). A survivor-by-survivor `loop`-style collector (mirroring `Core.loop` but accumulating matched acts instead of a `Status`) would narrow this to the exact normalised trace. That changes the *content* of `rs`, **not** the commutation theorem (which holds for *any* `All (TouchedBy κ)` result, as `normCut-commute` shows). Logged under Q-046 as a content refinement, not an open obligation.

**Next concrete step:** **M5** — the cubical/HoTT scheme proof-of-concept ("scheme identity is behaviour-extensional = univalence"), a separate `agda/hott/` tree with `--cubical`, segregated from the `--safe` corpus. It is the **last unstarted §5 slogan**, and now sits cleanly on top of a *completed* core. (Per the §14 plan: B before M5 because B completes the core; M5 is the final front.) Optionally in parallel: the Direction-2 fusion's remaining `(1a)` eventual-decidedness pigeonhole.

---

## 18. M5 scoping (2026-06-11) — the target fixed (no separate ideation session)

The conceptual scoping for M5 was already settled at §1.2 (Fork B → cubical/HoTT, staged last and small) and by [T003](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) (the trilemma resolved, "scheme identity = behaviour-extensional" already framed as univalence-flavored). M5 is therefore **encoding, not discovery**, and needs **no new ideation session** — only this short target-fixing note plus a one-time toolchain step.

**Readiness verdict (2026-06-11):** start immediately after one mechanical prep. The conceptual dependencies are all satisfied — M5's "behaviour" is M1/M4's `_⊥_`/biorthogonal closure (done), honouring "A before B"; the math is T003 (done). The **one genuine prerequisite** is the cubical Agda library, which is **not yet installed** (`~/.agda/libraries` lists only `agda-stdlib`); installing a version matched to Agda 2.7.0.1 is infrastructure, not research.

**Regime-boundary decision — RESOLVED: option (b).** Cubical Agda (`--cubical`) and the `--safe --without-K` `ludics/` corpus **cannot share a module** (different type-theory regimes). The two options were (a) re-state a minimal `Behaviour`-equivalence interface inside the cubical tree and link it to the real `_⊥_`, or (b) **keep behavioural equivalence abstract** — M5 is purely about *schemes-as-types* with the behaviour relation a module parameter. **Adopted: (b).** It cashes the univalence slogan without entangling the two regimes; the link to the constitutive `_⊥_` stays a *documented correspondence* (T003's C006 behaviour = `𝓑(𝓢)`), not a cross-regime import. This keeps M5 honest about its scope: a proof-of-concept that the *form* of the slogan holds, not a re-mechanisation of behaviour inside cubical.

**The target (three artifacts the PoC must exhibit):**

1. **`Scheme` as a dependent type** — a record over a worked family: **Argument from Expert Opinion** (T003's worked example, so the PoC reuses settled content). Fields: the premise/conclusion slots and the CQ-bundle.
2. **CQs as elimination obligations** — the critical questions presented as the eliminators/projections of the scheme type (the "a scheme is a typed inference rule whose CQs are its elimination obligations" reading).
3. **The univalence step `≃ → ≡`** — with behavioural equivalence **abstract** (a parameter `_≈ᵇ_` on an abstract `Behaviour : Type`), exhibit the slogan's content: when two schemes' behaviours are *equivalent as types* (`≃`), univalence (`ua`) makes them *equal* (`≡`) — "scheme identity is behaviour-extensional" as the inferentialist's "equivalence is equality". This is the one place `--cubical`/`ua` is load-bearing.

**Toolchain plan (the one-time prep):**

- Install the **cubical Agda library** at a tag compatible with **Agda 2.7.0.1**, register it in `~/.agda/libraries`. (Version-match is the one compatibility check that could bite — verify the tag's `agda-lib` against 2.7.0.1 before committing.)
- Create a **segregated `mechanisation/agda/hott/` tree** with its own `.agda-lib` (`depend: standard-library cubical`) and `{-# OPTIONS --cubical #-}`. **Never** add cubical deps to `mesh-substrate.agda-lib`; the `--safe --without-K` corpus stays untouched.
- If `ua` from the full library proves awkward, the fallback is `--cubical` + Agda's builtin cubical primitives with a *minimal local* univalence — but the library route is preferred for robustness.

**Honesty boundary (recorded):** M5 is a **single-family proof-of-concept**, explicitly *not* the catalogue port, and its behaviour relation is *abstract* (option b) — so it demonstrates the slogan's *form*, with the tie to the real `_⊥_`-behaviour standing as a documented correspondence rather than a mechanised identity. That tie (importing/relating the constitutive behaviour into a cubical setting) is a deliberately larger, separate undertaking, parked under Q-046.

**Next concrete step:** install the version-matched cubical library + scaffold `mechanisation/agda/hott/` (`.agda-lib` + a `--cubical` smoke-test importing `Cubical.Foundations.Univalence`), then write the Expert-Opinion `Scheme` type with its CQ eliminators and the abstract-behaviour `ua` step.

---

## 19. M5 executed (2026-06-11) — the univalence cash-out; the M0→M5 sequence is complete

**Done.** The cubical toolchain prep (§18) and the M5 content both landed. [`hott/Scheme.agda`](../mechanisation/agda/hott/Scheme.agda) type-checks `--cubical` (cubical-0.8, Agda 2.7.0.1-matched), EXIT:0, in the segregated `hott/` tree; the `--safe --without-K` ludics corpus is confirmed unaffected.

**What's proven:**

- **Scheme as a dependent type.** `ExpertOpinion` (Argument from Expert Opinion, T003's worked family) is a record over abstract atoms (agents, domains, statements + the relational atoms a CQ can challenge), with the scheme's own defeasible premises (`isExpert`, `didAssert`) as fields.
- **CQs as elimination obligations.** The critical questions (`CQ-field`, `CQ-trust`, `CQ-consistency`, `CQ-backup`) are *types the eliminator demands*: `conclude : (s : ExpertOpinion) → CQs s → Statement` yields the conclusion **only** when the CQ bundle is discharged — the "typed inference rule whose CQs are its elimination obligations" reading. An `Argument` is a term of the corresponding dependent Σ-type (`Σ[ s ] CQs s`).
- **Behaviour-extensional identity via univalence — the slogan, cashed.** With the behaviour denotation `⟦_⟧` *abstract* (option (b), per §18), behavioural equivalence is `s ≈ᵇ s' = ⟦ s ⟧ ≃ ⟦ s' ⟧`, and:
  - **`behaviour-extensional = ua`** : `s ≈ᵇ s' → ⟦ s ⟧ ≡ ⟦ s' ⟧` — behavioural equivalence *is* behaviour identity;
  - **`behaviour-univalence = univalence`** : `(⟦ s ⟧ ≡ ⟦ s' ⟧) ≃ (s ≈ᵇ s')` — the full correspondence.
  This is exactly "scheme identity is behaviour-extensional" = the inferentialist's "equivalence is equality", made precise in HoTT — the §5 slogan, no longer a slogan.

**Honesty boundary held:** M5 is a single-family proof-of-concept with behaviour *abstract*; the tie to the constitutive `_⊥_`-behaviour of `ludics/` (T003's C006 `𝓑(𝓢)`) is a *documented correspondence*, not a cross-regime import (cubical and `--safe --without-K` cannot share a module). It demonstrates the slogan's *form*, which is what the §1.2 plan scoped it to do.

**Net: the Direction-5 master sequence M0→M5 is complete.**
- **M0** carrier · **M1** interaction · **M2** determinacy/monotonicity · **M3** separation · **M3-bridge** first-divergence locus · **M4** internal completeness · **composition/cut** associativity (structural coherence + cut-elimination commutation) · **M5** the HoTT scheme univalence cash-out.
- The two §5 flagship deliverables are both realized: the **constitutive finite Ludics core** (`ludics/`, seven files, `--safe`, the three core theorems associativity ∧ separation ∧ internal completeness), and the **HoTT scheme treatment** (`hott/`, cubical, the univalence slogan).

**What remains (beyond the M-sequence, all logged under Q-046):** the M1′ infinitary normalizer extension; the Direction-2 fusion's `(1a)` eventual-decidedness pigeonhole + `(1b)` per-line antichain assembly; the Böhm-separation-proper (incarnation) deep half; and content refinements (the exact cut-survivor trace). None are on the M0→M5 critical path; all are precisely scoped.