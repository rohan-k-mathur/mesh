# Session 11 — The Lumerian practical-argument family: from spec to programme commitments

**Date:** 2026-06-12
**Direction:** Argumentation-scheme cluster (inner→core ring); touches Direction 2 (minimal-disagreement typing), Direction 4 (transport typing), the mechanized core (T005 strategy-preservation), and the reflexive layer.
**Status:** **WORKED — verdicts recorded.** Diagnosis accepted as a standing observation (not a premise). Spec sorted foundational / downstream / parked. Three open questions filed ([Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047) adoption umbrella, [Q-048](../01_OPEN_QUESTIONS_REGISTRY.md#q-048) fourth-layer, [Q-049](../01_OPEN_QUESTIONS_REGISTRY.md#q-049) T005 concession-locus) + one conjecture ([C016](../03_CONJECTURES/C016-epistemological-principle-fourth-layer.md)). C009 tension resolved (Burkholder/Pascal is a genuine candidate witness; profile-rivalry exclusion *sharpens* C009, does not narrow it) and handed to [session 10](10-scheme-rivalry-fourth-attack-2026-06-12.md). No schema touched.

> **Superseded for engineering by [session 11b](11b-practical-reasoning-enhancements-2026-06-12.md) (2026-06-12).** The programme **declined to import the Lumer framework**: no `DesirabilityProfile` / `PracticalNetting` / Pascal subfamily / desirability monoid / fourth-layer build. This file remains the canonical record of the **analysis** (diagnosis verdict, forced/chosen sort, C009 resolution, the [Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047)–[Q-049](../01_OPEN_QUESTIONS_REGISTRY.md#q-049)/[C016](../03_CONJECTURES/C016-epistemological-principle-fourth-layer.md) filings, all still open). For **build direction**, read [11b](11b-practical-reasoning-enhancements-2026-06-12.md) — it strengthens the existing Walton machinery instead. **Do not consult the `docs/Lumer …` / `docs/Practical Argumentation …` source documents as a build spec.**
**Purpose:** think through two source documents rigorously and decide what graduates into the registry. **Not** to implement the spec. Separate what is *load-bearing and defensible* from what is *speculative or over-reaching*, map every claim onto existing artifacts, and record adoptable claims as **conjectures / open questions / theorem-targets** — never as premises.

**Source documents (on the table, not yet in the programme):**
- [`docs/Lumer and Isonomia Research.md`](../../docs/Lumer%20and%20Isonomia%20Research.md) — the diagnosis (Isonomia's formal core is alethic; its highest-stakes outputs — recommendation packets, evaluations, design decisions — are *practical* and systematically under-formalized) + four developed contact points.
- [`docs/Practical Argumentation Research for Isonomia.md`](../../docs/Practical%20Argumentation%20Research%20for%20Isonomia.md) — a Draft 0.1 schema spec (`DesirabilityProfile`, `PracticalNetting`, derived per-instance CQs, the desirability monoid in a separate register, transport typing, the Pascal subfamily).

---

## The core thesis to test

Lumer's claim: *optimality judgments about instruments* — justified by practical arguments (netting consequences under a declared **desirability base**) — are the keystone of every theory type, and are under-formalized everywhere (Walton's practical-reasoning schemes are thin instances of the gap). Isonomia inherits exactly that thin catalog and ships exactly those outputs. So: should the programme adopt a **native practical-argument family** with a first-class, contestable `DesirabilityProfile`, and what does that cost and commit?

## Read first (standing artifacts this must reconcile with)

- [`02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md`](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) — the resolved trilemma (behaviour / presentation / protocol). Lumer notes claim a **fourth layer beneath all three** (the *epistemological principle*), which would upgrade "scheme identity = its CQs" from definition to **theorem**. Touches [`mechanisation/agda/hott/Scheme.agda`](../mechanisation/agda/hott/Scheme.agda) (CQs-as-elimination-obligations, the univalence result's "missing why"). Test hard.
- [`03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md`](../03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md) + [session 10](10-scheme-rivalry-fourth-attack-2026-06-12.md) — Lumer notes assert a **ready-made C009 witness** (Burkholder's deductivist reconstruction of Pascal's wager = decision-theoretic-vs-deductive scheme-rivalry). But the spec §4 keeps *profile-rivalry* **out** of the attack typology. Resolve the tension: witness, narrowing, or both.
- [`01_OPEN_QUESTIONS_REGISTRY.md`](../01_OPEN_QUESTIONS_REGISTRY.md) scheme cluster — **Q-011** (Pollock exhaustiveness), **Q-015** (scheme composition/cut), **Q-017** (CQ-of-CQ termination — the spec's per-instance CQs bear on it), and the static-per-scheme CQ-generation model (the spec needs per-instance CQs keyed to netting rows — the one flagged schema migration with real surface area).
- The **closed monoid registry** + log-odds semiring ([Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md); `app/api/deliberations/[id]/evidential/route.ts`) — the spec's desirability monoid lives in a **separate register** (truth-support and value-netting never share a currency). Check against §0.
- **Minimal-disagreement extractor** ([T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md)–[T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md)) + **Plexus pseudofunctor** ([T010](../02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md)) — the spec claims FACTUAL/EVALUATIVE/STRUCTURAL divergence-locus typing and that *epistemological type predicts transport drift* (sharpening T010's monodromy result).
- The **mechanized core** ([`mechanisation/agda/ludics/`](../mechanisation/agda/ludics)) — spec §9.3: does the grounded⇔orthogonality keystone ([T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md)) stay **strategy-preserving** when the framework contains practical arguments whose standing rests on an attackable completeness assumption (a standing concession locus the Opponent may visit)? Name the philosophical friction (epistemological-validity vs interaction-as-meaning); do not smooth it.

## Attack-plan spine (adapt as the material dictates)

1. **Separate diagnosis from solution.** State the diagnosis crisply; decide if it warrants a standing programme commitment. Treat the spec as one *candidate* solution — identify which moves are forced and which are design choices with live alternatives. Do not adopt the data model wholesale.
2. **Completeness-as-assumption** — the claimed single most valuable bridge (unprovable completeness condition → ASPIC+ defeasible assumption premise, `OPEN_UNREFUTED` never `SATISFIED`, undermine-by-instantiation). Genuine dialectical dissolution, or relocation of the problem? Integrates with existing assumption-typed premises without relaxing a contract?
3. **The fourth-layer claim** (epistemological principle beneath the T003 trilemma) — the sharpest *theoretical* claim and the one touching the mechanized result. Either it upgrades scheme-identity to a theorem or it fails against T003. Decide; scope a conjecture if it survives.
4. **The relativization commitment** — practical validity is *validity-given-a-profile*, never simpliciter. Is the first-class, versioned, contestable `DesirabilityProfile` (with `justificationArgumentId` reflexive hook + `STIPULATED_PROFILE` honesty label) the right structural expression of "expose where evaluation bottoms out, don't terminate the regress"? The philosophically load-bearing decision.
5. **Over-reach audit.** Sort the spec's components: *foundational* (native representation + fold semantics — contacts 1–2, the Lumer notes' own sequencing), *downstream* (transport typing, Opponent typing, packet schema — nothing to operate on until 1–2 land), *parkable/speculative* (partition-invariance refinement, Pascal subfamily, welfare-ethical variant, the fourth-layer theorem).
6. **The honest tension (do not smooth it).** Lumer grounds validity in truth-conducive principles *because* surviving interaction ≠ acceptability (cheap orthogonality from an incompetent Opponent) — pointedly against the programme's interaction-as-meaning thesis. The proposed synthesis ("epistemological layer types the test space; interactive layer computes survival within it") is itself a **conjecture**; state it as one. May deserve a follow-on.

## Deliverables & discipline

- A session record: diagnosis verdict; each spec component mapped to an existing artifact or flagged net-new; contributions sorted foundational/downstream/parked; each adoptable claim recorded as a **conjecture** with positive/negative settlement criteria.
- Registry outputs *if warranted*: new open questions (e.g. "adopt a practical-argument family?"; "is there an epistemological-principle layer beneath T003?"; "does T005 strategy-preservation survive a completeness concession locus?") and/or a conjecture file. Cross-link C009/Q-016, T003, T005, T010, the monoid registry, the minimal-disagreement arc. **No Prisma migrations / no production schema changes** — ideation only.
- The CQ-generation migration (static-per-scheme → per-instance) is the one flagged real engineering cost; record it as a scoped implementation-track item *contingent on* the foundational conjectures surviving — not committed work.
- Add this session to [`10_IDEATION_SESSIONS/README.md`](README.md).
- No-premature-premise rule throughout: the practical family, the fourth layer, and the interaction/epistemology synthesis all stay **conjectures** until settled.

---

## Session log

### 0. Headline verdicts (read this first)

1. **The diagnosis is correct and adoptable as a standing observation — not as a premise, and not yet as a build commitment.** Isonomia's *formal core* is alethic (log-odds weight-of-evidence for truth-support; ASPIC+/Dung for which arguments survive; Ludics for interactive convergence) while its *highest-stakes outputs* — recommendation packets, budget deliberations, RFCs, policy recommendations, program evaluations — are **optimality judgments about instruments**, i.e. practical conclusions in Lumer's sense (netting of consequences under a declared desirability base). Walton's practical-reasoning scheme, which the catalogue inherits (`practical_reasoning_family`, one of the three production schemes used in [T003](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) §4), is a *thin* instance of exactly the pattern Lumer diagnoses as under-formalized. This is a checkable fact-claim about the repository, not a conjecture; it *motivates* but does not by itself license adoption. → filed as the motivating finding of **[Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047)**.

2. **Adopt nothing from the spec's data model wholesale.** The spec (`docs/Practical Argumentation Research for Isonomia.md`) is *one candidate solution*. Two of its commitments are **forced given adoption** of practical arguments at all; the rest are design choices with live alternatives or outright speculation. The sort is in §5.

3. **The single most valuable bridge — completeness-as-defeasible-assumption — is real and low-friction, but it is *not philosophically neutral*: its dissolution-character *is* the programme's interaction thesis, the very thing Lumer opposes** (§2, §6). It dissolves the epistemological problem *in the programme's terms* and is therefore load-bearing on the item-6 synthesis, which is itself only a conjecture.

4. **The fourth-layer claim is the sharpest theoretical item and is over-stated as universal.** Locally (practical family) it is plausible and theorem-shaped; universally (all schemes) it risks vacuity (the "epistemological principle" cannot be defined independently of the CQs it is meant to generate). Filed as **[C016](../03_CONJECTURES/C016-epistemological-principle-fourth-layer.md)** / **[Q-048](../01_OPEN_QUESTIONS_REGISTRY.md#q-048)** with the vacuity route as the primary negative settlement.

5. **The deepest item — Lumer's epistemological grounding vs the programme's interaction-as-meaning — is a genuine friction, not a misunderstanding.** The proposed synthesis ("the epistemological layer *types the test space*; the interactive layer *computes survival within it*") is attractive and would dissolve "cheap orthogonality," but it is a conjecture with a concrete formal crux that touches the mechanized keystone: does [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) strategy-preservation survive (i) restriction of the Opponent test space to *well-formed* designs and (ii) a standing completeness *concession locus* on the Proponent design? → filed as **[Q-049](../01_OPEN_QUESTIONS_REGISTRY.md#q-049)**; flagged as a candidate follow-on session.

---

### 1. Diagnosis vs solution — what is forced, what is chosen

**The diagnosis splits into two claims.**

- **(D-descriptive)** *The formal core is alethic; the shipped outputs are practical.* This is verifiable against the repo: the closed monoid registry holds log-odds / min / product — all truth-support semantics ([Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md)); the recommendation-packet / deliberation outputs are optimality judgments. **Strong; accepted as a standing observation.** It is the kind of fact that grounds a programme commitment but is not itself contestable in the conjecture sense.
- **(D-normative)** *Therefore the programme should adopt a native practical-argument family.* This is the live decision. It is **not** a premise and **not** a conjecture (it is a programme-direction choice, like Q-014's ontology question); it is the umbrella **open question [Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047)**.

**Forced-vs-chosen, given a decision to represent practical arguments at all:**

| Move | Forced or chosen | Why |
|------|------------------|-----|
| Validity reported as **profile-relative**, never simpliciter | **Forced** | Lumer's core result: practical-argument validity is relativized to a desirability base. Shipping "valid" without a profile would be dishonest. (§4) |
| The desirability fold lives in a **separate register** from truth-support | **Forced** | §0 constraint 4; reusing log-odds for value-netting is a category error. Confirmed consistent with the resolved Session-01 log-odds adoption (§3 below). |
| Completeness rendered as a **defeasible assumption premise** | **Chosen** (one good option) | This is *the programme's* dialectical move; Lumer himself would not endorse the dissolution (§2, §6). Low engineering friction, but partisan. |
| The specific `DesirabilityProfile` Prisma model (three modes, dimensions, version chain) | **Chosen** | Live alternative: represent the profile as *itself a `practical/adequacy` argument node* in the graph (the spec half-does this via `justificationArgumentId`) rather than a bespoke model. (§4) |
| Pascal subfamily, partition-invariance, welfare-ethical, MAXIMIN/HURWICZ | **Chosen / speculative** | None forced; parked (§5). |

---

### 2. Completeness-as-assumption — dissolution or relocation?

**The move.** Lumer's unprovable completeness condition ("all relevant consequences are covered") is materialized as an **implicit `ASSUMPTION`-typed premise**, auto-generated, carrying no proponent burden, its CQ initialized to a distinct state `OPEN_UNREFUTED` (never `SATISFIED`), attackable only by **undermine-by-instantiation** (the challenger must *name* a candidate missed consequence as a claim and assert its relevance under ≥1 active profile dimension). ASPIC+ assumption-attack semantics compile to ordinary Dung attack edges, so the argument participates in grounded-extension computation natively; an admissibly-attacked-and-undefended completeness assumption takes the argument OUT.

**Does it integrate without relaxing a contract?** The spec asserts premises are already typed `ORDINARY | ASSUMPTION | EXCEPTION` with `implicit`/`axiomatic` flags. *If that typing exists as claimed* (flagged for verification against the live schema — not done in this ideation session), then materializing completeness as an implicit `ASSUMPTION` reuses the typing with **no relaxation of the premise contract**. The **one genuine touch** is the CQ-state model: `OPEN_UNREFUTED` as a state *distinct from* `SATISFIED` is the structural expression of "completeness can never be proven, only left unrefuted." Whether the current CQ-state enum can express it without a migration is the same surface the per-instance CQ migration touches (§5, the flagged engineering cost). **Verdict: low-friction on premise typing; one real touch on CQ-state.**

**Dissolution or relocation? — the sharp finding.** The move does **not** *solve* the epistemological problem (you still cannot prove you have covered all consequences). It **relocates** the burden from *demonstrative* (prove completeness) to *dialectical* (the argument has force until an opponent instantiates a missed consequence). Under the programme's **interaction-as-meaning** reading this relocation *is* a dissolution: an argument's epistemic force is *constituted* by survival-under-attack, so "completeness needn't be proven" is exactly right. Under **Lumer's epistemological** reading it is *only* a relocation that leaves the gap open: an undefeated-but-incomplete argument is dialectically `IN` yet epistemically unsound (a relevant consequence may exist that nobody has noticed).

**Consequence for discipline.** The "single most valuable bridge" is therefore **load-bearing on the item-6 synthesis** (§6), which is still a conjecture. We may adopt completeness-as-assumption as a clean *engineering* pattern, but its philosophical billing as a "dissolution of an epistemological problem" is only earned *if* the interaction/epistemology synthesis ([Q-049](../01_OPEN_QUESTIONS_REGISTRY.md#q-049)) holds. **Recorded as a conjecture inside Q-047, explicitly contingent on Q-049 for its dissolution-claim**; adoptable as an engineering pattern independently. This is exactly the friction the brief asked not to smooth.

---

### 3. The desirability register vs the log-odds semiring

The spec registers a desirability fold in the closed monoid registry **in a separate register** (§0 constraint 4: truth-support and value-netting never share a currency). Checked against the resolved Session-01 log-odds adoption:

- Log-odds is the **truth-support** semiring ($w=\log\frac{c}{1-c}$, corroboration = addition in $\mathbb{R}$).
- The desirability fold is a **different algebraic object**: `CARDINAL` is $\sum_r p(r)\cdot w(\dim r)\cdot \mathrm{pol}(r)\cdot \mathrm{mag}(r) + \sum \text{intrinsic}$ — a lawful **commutative monoid** over signed contributions (identity 0); `ADEQUACY` is multiset-union of `(condition, grade)` pairs compared by **dominance**, i.e. a **partial order** with `INCOMPARABLE` first-class.
- **The comparison/argmax step lives *outside* the monoid** (strict dominance/argmax over per-option folds). So the desirability register is "a commutative monoid for the fold **+** a partial order for the comparison," not a semiring. It is *not* a unification with the truth-support algebra and must not be sold as one.

**Verdict: consistent with §0 and with Session 01; adoptable as a genuinely separate register.** Low risk. The only subtlety to record: `BAND` probabilities fold to intervals, so the fold is really monoid-valued in an interval lattice, yielding `INCOMPARABLE_UNDER_UNCERTAINTY` as an honest output rather than a forced ranking — this is the right behaviour and matches the programme's refusal to collapse empty/ambiguous states.

---

### 4. The relativization commitment

**The commitment:** practical validity is *validity-given-a-profile*, never simpliciter; the `DesirabilityProfile` is first-class, **versioned**, **contestable**, carries `justificationArgumentId` (the reflexive hook — the profile's own justification is an argument *in the graph*), and a `STIPULATED_PROFILE` honesty label when ≥1 dimension is unbound.

**This is the philosophically load-bearing decision, and it is the cleanest of the big ones** because it is almost a corollary of existing house style:

- Confidence cards already disclose every input/weight/contribution.
- The reflexive-layer programme already holds that "the reasoning behind what ships is itself addressable, citable, contestable."
- The contentHash / hash-chained audit discipline already makes objects tamper-evident and citable.
- The standing/score separation already respects the population-intuitionism caution (social scoring is an indicator, never a justification).

**Forced part:** *that* validity is profile-relative and the profile is exposed (not a buried constant) — this is forced by adopting practical arguments. The `STIPULATED_PROFILE` label is the honest structural admission that the regress is **exposed, not terminated** — the right expression of the constitutive-instrumentalism reading from the Lumer notes (the system makes the desirability base a first-class auditable object; it does not pretend to ground it).

**Chosen part:** the *specific data model*. Live alternative worth recording: since `justificationArgumentId` already points at a `practical/adequacy` argument, the profile is arguably **just another argument node with a distinguished role**, not a separate Prisma model. The recursion "the profile's justification is itself a practical argument" is the deeper structural insight; whether it needs a dedicated table is a downstream design question, not a foundational commitment.

**Recorded as a conjecture inside Q-047:** "*if* the substrate represents practical arguments, validity must be reported as profile-relative with the profile a first-class contestable object." Positive settlement: a worked practical argument whose conclusion carries a `PROFILE_RELATIVE(id, version)` qualifier and whose profile is challengeable through the normal protocol. Negative: a coherent way to report practical validity *without* a profile (would refute Lumer's relativization — unexpected, but that is the shape of the disconfirmation).

---

### 5. Over-reach audit — the sort

Following the Lumer notes' own sequencing recommendation (start with the scheme family's *data shape*: the netting object, where the completeness assumption lives, how CQ-derivation interacts with the existing model).

**FOUNDATIONAL (contacts 1–2 — native representation + fold semantics; nothing downstream operates until these land):**
- The elementary scheme family: `practical/evaluation` and `practical/instrument-comparative` (the comparative form is the recommendation-packet payload). `practical/adequacy` as the qualitative fallback *and* the foundational form (profiles justify themselves through it).
- The netting object + consequence records as a side-table on the existing `Argument` (claims/premises/challenges stay canonical).
- **Completeness-as-assumption** (§2) — part of the native representation.
- The desirability **fold semantics** (§3) as a separate register; `CARDINAL` + `ADEQUACY` only.
- The **profile-relativity commitment** (§4) — the representation cannot be honest without it.

**DOWNSTREAM (real, checkable, but nothing to operate on until the foundational layer exists):**
- **Divergence-locus typing** (FACTUAL / EVALUATIVE / STRUCTURAL) — a *typing* of the already-computed [T008](../02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md) minimal separating context by the netting-row class its locus sits on. Not a new theorem; a typing functor on existing output. **Checkable extension claim** (recorded as a conjecture inside Q-047): the minimal locus of two practical-argument designs is canonically typed by netting-row class; the three types are exhaustive and disjoint. Negative: a minimal locus sitting on multiple classes or none. Connects to the minimal-disagreement arc [T006](../02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md)–[T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md).
- **Transport typing** — epistemological type *predicts* T010 monodromy drift: deductive (monotonic → free), probabilistic (db-relative → compatibility check), practical (profile-relative → re-net or flag). **Sharpens [T010](../02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md):** conjecture that the monodromy obstruction is supported *exactly* on db-relative + profile-relative arguments, with deductive arguments in the pseudofunctorial region $\mathcal{P}^\circ$ by type. Connects to [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042)/[Q-043](../01_OPEN_QUESTIONS_REGISTRY.md#q-043). Recorded as a conjecture inside Q-047.
- The sensitivity **probe** (`PROBE_PROFILE`) as a *non-attack* move; recommendation-packet schema; **evaluative culprit sets** (generalize the culprit engine to valuations).

**PARKED / SPECULATIVE:**
- **Pascal subfamily** (`practical/pascal`) + `PASCAL_INVALID` fatal-invalidity semantics.
- **Partition-invariance as a strengthened validity condition** (PAS-CQ3) — the Lumer notes' *own* refinement, explicitly "not in Lumer"; partition-lattice enumeration is exponential. Genuinely speculative.
- **Welfare-ethical** variant; **MAXIMIN / HURWICZ** folds.
- **The fourth-layer theorem** (§6/C016) — theoretically the sharpest, but a *theorem-target*, not a build item; lives in the conjecture registry, not the implementation track.
- **The interaction/epistemology synthesis** (§6/Q-049) — conjecture; candidate follow-on session.

**The one flagged engineering cost (contingent, not committed).** The practical family needs **per-instance critical questions** (one accuracy CQ per consequence record; one per named alternative), where the current model generates CQs **statically per scheme**. This needs an `instanceRefId` on the CQ model + a generation hook on netting writes. **Recorded as a scoped implementation-track item *contingent on* the foundational conjectures (Q-047) surviving** — explicitly NOT committed work, and not added to [`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md) at this stage. It also interacts with **[Q-017](../01_OPEN_QUESTIONS_REGISTRY.md#q-017)** (CQ-of-CQ termination): instantiating the completeness assumption *adds* a consequence record, which *spawns its own* per-instance accuracy CQ — so completeness-CQ resolution generates new CQs. Termination is plausible (each instantiation adds finitely many records; the relevance bar caps admissible instantiations by the finite dimension set) but is a **new input to Q-017** and is recorded there.

---

### 6. The honest tension (named, not smoothed)

**The opposition is real.** Lumer grounds validity in **truth-conducive epistemological principles** *precisely because* surviving interaction does **not** guarantee acceptability — an incompetent Opponent confers **cheap orthogonality**. The programme's organizing thesis is the opposite: **argumentation-as-interaction**, validity = survival of every well-formed counter-interaction, mechanized as the [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) keystone (grounded membership ⇔ canonical-orthogonality acceptance of the translated dispute designs).

**The proposed synthesis (a conjecture, not a resolution).** The epistemological layer **types the test space**; the interactive layer **computes survival within it**. "Every well-formed counter-interaction" is cashed out as: the Opponent designs that *count* are exactly those instantiating the validity-condition-derived attack types (missed consequence, contested weight, inadequate alternatives, bad partition). Lumer normatively constrains *what the Opponent is entitled to test*; Ludics evaluates the game. This **dissolves cheap orthogonality** — orthogonality against only-incompetent (ill-typed) Opponents is no longer acceptance.

**Why it is only a conjecture — the formal crux ([Q-049](../01_OPEN_QUESTIONS_REGISTRY.md#q-049)).** Typing the test space *changes the orthogonality predicate*: T005's "$\forall\tau$" (over all Opponent test designs) becomes "$\forall$ *well-formed* $\tau$." Two sub-risks:

1. **Restricting the test space enlarges behaviour** — fewer tests to survive ⇒ more designs accepted. This is structurally the *same* phenomenon as T003's `inheritCQs:false` (fewer CQs ⇒ larger behaviour, reversing inheritance). So typing-down the Opponent could break the **grounded direction** of the T005 biconditional.
2. **The completeness *concession locus*** — the Proponent design now carries a standing concession point (the completeness assumption) that every Opponent may visit, and the Proponent must answer instantiation visits with a *named exit* (incorporate-and-renet / reject-existence / reject-relevance). Whether the keystone **bijection** (PRO strategies ↔ Proponent designs; CON ↔ tests; *win* ⇔ *orthogonal*) **respects this locus structure** is finer than verdict-preservation: the bijection must treat the concession-answer moves as game moves. The spec conjectures yes (assumption-attacks compile to ordinary attack edges); the mechanized check is whether **strategy-preservation** survives.

**Negative settlement (either head):** a worked abstract AF + practical argument where typing-down the Opponent breaks the grounded direction, **or** a Proponent design with a completeness concession point that has no PRO-strategy preimage under the T005 bijection. A bounded-fuel version over the finite fragment looks checkable with the existing [`mechanisation/agda/ludics/`](../mechanisation/agda/ludics) apparatus. **This is the deepest item; [Q-049](../01_OPEN_QUESTIONS_REGISTRY.md#q-049) is flagged as a candidate follow-on session.**

---

### 7. The fourth-layer claim, tested against T003 ([C016](../03_CONJECTURES/C016-epistemological-principle-fourth-layer.md))

**The claim (Lumer notes).** Beneath the T003 trilemma (behaviour C006 / presentation C007 / protocol C008) there is a **fourth layer** — the *epistemological principle* — from which the other three are derivable, with the **CQs *being* the validity conditions of the principle**. This would "upgrade 'a scheme's identity is its critical questions' from a definition to a theorem," supplying the **"missing why"** for the mechanized univalence result ([`hott/Scheme.agda`](../mechanisation/agda/hott/Scheme.agda): `behaviour-univalence = univalence`, CQs as elimination obligations).

**Test against T003.** In T003 the scheme is a fibered product over `CQ(S)`: $S=\llbracket S\rrbracket \times_{\mathrm{CQ}(S)} \mathcal S_S \times_{\mathrm{CQ}(S)} \pi_S$ — the CQ-bundle is the **shared pivot** all three layers agree on, and it is treated as **primitive**. The fourth-layer claim says: $\mathrm{CQ}(S)$ is **not** primitive — it is the image of an underlying epistemological principle $P(S)$, and $\mathrm{CQ}(S) = \text{validity-conditions}(P(S))$.

**Is this a theorem or a rename?** To make "scheme identity = CQ-bundle" a *theorem* (rather than relocate the primitive from CQ-bundle to principle) you need three things:
- **(a)** a definition of $P(S)$ **independent of** $\mathrm{CQ}(S)$;
- **(b)** a derivation $\mathrm{CQ}(S) = \text{validity-conditions}(P(S))$;
- **(c)** a **faithfulness** result $P(S) \cong \mathrm{CQ}(S)$ (the conditions determine and are determined by the principle).

If (a) fails — i.e. the only way to say what $P(S)$ *is* is to list its CQs — then (c) is **vacuous** and the claim is a rename, not a theorem. **This is the primary negative-settlement route.**

**Local vs universal.**
- **Local (practical family) — plausible, theorem-shaped.** Here $P(S)$ has an independent definition: the **decision-theoretic principle** ("an option is choiceworthy iff it maximizes expected desirability under the profile"). Its validity conditions (cover all consequences; correct probabilities; justified weights; adequate alternatives; partition-adequacy for Pascal) are derivable by analyzing *what could make the expected-desirability computation wrong*. So (a)–(c) are at least *attemptable*, and *for this family* "identity = CQs" would become a theorem with the principle as the load-bearing middle term. This is the spec §6 "CQs derived from validity conditions" claim made precise.
- **Universal (all schemes) — risky.** Walton's schemes were originally *presumptive patterns* with CQs attached post hoc as "pointers to default exceptions." Some schemes (analogy, slippery-slope) have no obvious clean epistemological principle independent of their CQs. So the universal claim is the one that most likely **fails (a)** and collapses to vacuity.

**Decision.** Filed as **[C016](../03_CONJECTURES/C016-epistemological-principle-fourth-layer.md)** (conjecture) + **[Q-048](../01_OPEN_QUESTIONS_REGISTRY.md#q-048)** (the OQ it would close), with the practical-family-local version as the **warm-up / discovery stratum** and the universal version as the **theorem-target**, and the **(a)-vacuity** route named as the principal negative settlement. It explicitly touches T003 (would re-found the fibered-product pivot) and the mechanized univalence result (would supply its "why").

---

### 8. C009 tension, resolved (hand-off to [session 10](10-scheme-rivalry-fourth-attack-2026-06-12.md))

The brief flagged an apparent tension: the Lumer notes assert a **ready-made [C009](../03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md) witness** (Burkholder's deductivist reconstruction of Pascal's wager — Pascal pressed into modus ponens — as decision-theoretic-vs-deductive scheme-rivalry), while the spec §4 **keeps profile-rivalry OUT of the attack typology**.

**Resolution: the two are about different objects; there is no contradiction.**

- **Scheme-rivalry (C009):** two *distinct schemes* applied to the *same claim* with **disjoint behaviours** ($\llbracket S_1\rrbracket \cap \llbracket S_2\rrbracket=\varnothing$), no Pollock primitive applying.
- **Profile-rivalry (spec §4):** the *same* practical argument netted under *two profiles* gives different verdicts (a `PROBE_PROFILE` flip). Both nettings are correct; the disagreement is "which profile binds" — a different object (profile, not scheme/premise/inference/conclusion). Correctly kept out of the attack typology.

**The spec §4 stance *sharpens* C009; it does not narrow it.** It removes a **false-positive class**: a decision-theoretic argument that flips under a different profile is *not* scheme-rivalry — it is profile-sensitivity (a non-attack datum). C009's positive test is thereby tightened to *genuine behaviour-disjointness between distinct schemes*.

**The Burkholder/Pascal case is a genuine candidate C009 witness** — and a stronger lead than a blind catalogue hunt, because Lumer supplies (i) the historical corpus (his Burkholder analysis) and (ii) ready-made **adjudication criteria** (clarity, authenticity, immanence, situational adequacy — which rival classification wins). The decision-theoretic scheme (`practical/pascal`, profile-relative behaviour) and the deductive reconstruction (monotonic/truth-functional behaviour) target one claim with disjoint behaviours and no Pollock primitive (same conclusion ⇒ no rebut; independent premises ⇒ no undermine; both inferences apply ⇒ no undercut). **Handed to session 10 as a lead** (witness + the boundary sharpening as a refined positive-settlement test). C009's `next-action` updated accordingly.

---

### 9. Decisions recorded (conjecture / resolved / parked)

- **Resolved (observation, not premise):** the diagnosis D-descriptive (alethic core / practical outputs / thin Walton schemes). Standing observation; motivates Q-047.
- **Resolved (C009 tension):** scheme-rivalry ≠ profile-rivalry; spec §4 sharpens C009; Burkholder/Pascal is a candidate witness handed to session 10.
- **Resolved (register check):** the desirability fold is a separate register (commutative monoid + dominance order), consistent with §0 and Session 01 — *not* a unification with log-odds.
- **Conjecture (Q-047, umbrella):** adopt a native practical-argument family. Sub-conjectures recorded inside it: completeness-as-assumption integration (contingent on Q-049 for its *dissolution* billing); profile-relativity commitment; divergence-locus typing (T006–T009 extension); transport typing (T010 sharpening).
- **Conjecture (C016 / Q-048):** the epistemological-principle fourth layer beneath T003 — local (practical) warm-up + universal theorem-target; vacuity is the primary negative settlement.
- **Conjecture (Q-049):** T005 strategy-preservation under (i) a typed/well-formed Opponent test space and (ii) a completeness concession locus — the formal head of the interaction/epistemology synthesis; candidate follow-on session.
- **Parked:** Pascal subfamily; partition-invariance refinement; welfare-ethical; MAXIMIN/HURWICZ; the universal fourth-layer *theorem* (vs the conjecture); the philosophical synthesis articulation (its formal head is Q-049).
- **Contingent (not committed):** the static-per-scheme → per-instance CQ-generation migration — scoped only, gated on Q-047 surviving; interacts with Q-017.

**No-premature-premise rule honored:** the practical family, the fourth layer, and the interaction/epistemology synthesis all remain **conjectures**. No production schema touched; no Prisma migration written.
