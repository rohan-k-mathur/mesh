# Reading C — the multi-agent reading of Ludics: theory and architecture

> A standalone conceptual/architectural reference for **Reading C**, the
> substrate's doctrinal commitment about *who the Opponent is*. Companion to the
> charter ([`00_CHARTER.md`](00_CHARTER.md) §"middle ring", §"French Ludics
> tradition"), the conservativity theorem ([`02_THEOREMS_AND_PROOFS/T012-reading-c-conservative.md`](02_THEOREMS_AND_PROOFS/T012-reading-c-conservative.md)),
> the conjecture it settled ([`03_CONJECTURES/C002-reading-c-conservative.md`](03_CONJECTURES/C002-reading-c-conservative.md)),
> and the canonical substrate spec
> ([`.../LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)).

## 0. The commitment in one sentence

> **Reading C: the Opponent is not a participant, and not a coalition of
> participants — it is the *behaviour* `σ(D_P)^⊥`, the space of all coherent
> objections that the Proponent's content already determines. Individuals do not
> *constitute* the Opponent; they *witness* moves in a structure that pre-exists
> their acts.**

This is the substrate's single most consequential departure from the inherited
Ludics tradition. Everything below unpacks what it means and what it forces
architecturally.

## 1. The three readings of "Opponent"

Ludics evaluates a claim as a game between **Proponent** (`P`, who asserts and
defends) and **Opponent** (`O`, who tests). When the platform hosts a *many-person*
deliberation, "who is `O`?" admits three readings:

| Reading | Who bears the Opponent role | Tradition |
|---------|------------------------------|-----------|
| **A — bilateral** | a *single* Opponent design; one tester facing one Proponent | the dialogue-Ludics tradition (Lecomte, Quatrini, Fleury, Tronçon) — *uniformly* Reading A |
| **B — coalition** | an *aggregate of the participants' designs* — `O` is the group of dissenting agents, taken together | the natural "multi-agent = many players" generalisation |
| **C — behavioural** | the **behaviour** `σ(D_P)^⊥` itself — no agent and no coalition *is* `O`; agents only witness moves within it | **substrate-original** (literature null result confirmed, [`LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §2 C7) |

The substrate commits to **C**. Hintikka's game-theoretic semantics fixes the
game as bilateral *by stipulation*; the dialogue-Ludics school inherits that. We
depart: under Reading C the "Opponent" is `σ(D_P)^⊥`, not a coalition of agents
(charter §"Game-theoretical semantics", §"French Ludics tradition").

### 1.1 What `σ(D_P)^⊥` is

- `D_P` — the Proponent's content, a **design** in the engine (a set of asserted
  positions at loci).
- `σ(D_P)` — its **protocol saturation**: the moves Proponent is *structurally
  committed* to being willing to make at each locus, whether or not anyone asks.
- `σ(D_P)^⊥` — the **bi-orthogonal closure**: the set of all coherent opposition
  designs against `D_P`. It is the **space of structurally possible objections**,
  and it exists the instant Proponent's content does (the canonical closure is
  [`packages/ludics-engine/behaviourClosure.ts`](../packages/ludics-engine/behaviourClosure.ts)).

So the objections are not *produced* by opponents; they are *latent in the
content* and merely *walked* by whoever shows up.

## 2. Why Reading C (the theory)

- **Meaning is positional, not personal.** A claim's content is fixed by what
  counts as a successful defence under *every* coherent attack — the whole of
  `σ(D_P)^⊥` — not by which people happen to attack it. This is the
  dialogical/inferentialist inheritance (Lorenzen, Brandom) taken to its
  structural limit: a commitment is *geometric before it is linguistic*, living
  at a locus, not at a sentence (charter §"Brandomian inferentialism").
- **The objection space pre-exists the objectors.** Reading C says the structure
  *pre-exists the participants' acts* ([`...WITNESSING_INTERFACE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) §1.1).
  A deliberation does not *build* the space of reasons move by move; it *explores*
  an already-determined one. "No one raised objection X" becomes a fact about
  coverage (a latent, un-walked region of `σ(D_P)^⊥`), not about whether X exists.
- **It dissolves the coalition problem.** Reading B (coalition) must answer "whose
  commitments count, weighted how, aggregated when?" — judgement-aggregation
  questions with no canonical answer. Reading C never asks: the Opponent is a
  *behaviour*, fixed by the content, indifferent to headcount.

## 3. The witnessing reframe

If individuals do not constitute the Opponent, what do they do? They **witness**.
The instantiation operation `ι` binds a person's vetted dialogue act to a move in
the pre-structured space (`CommitmentLudicMapping`, `propose_warrant`). A move can
be:

- **walked** — some participant has witnessed it;
- **witnessable** — reachable but not yet witnessed;
- **latent** — in the behaviour but reachable by no current participant.

This is the exposure-map stratification (`κ`, [`T013`](02_THEOREMS_AND_PROOFS/T013-exposure-map-stratified-strength.md)).
"Deliberative progress" is then *drainage* of the latent stratum
([`T014`](02_THEOREMS_AND_PROOFS/T014-exposure-map-drainage.md)) — the deliberation
walking more of a fixed objection space, not enlarging it.

## 4. What Reading C forces architecturally

### 4.1 The T4 two-layer separation

Because the Opponent is anonymous (a behaviour, not people), the substrate splits
into two layers, each matched to a consumer:

| Layer | Nature | Consumer | Surfaces |
|-------|--------|----------|----------|
| **Dialectical** | anonymous, position-centric, Ludics-native | MCP / AI agents (epistemic surface) | designs, loci, orthogonality, daimon |
| **Witnessing** | attributed, person-centric, institutional | humans (legitimacy surface) | who said what, when, with what standing |

The seam between them is `ι` (write) and the exposure/articulation/witness reads
([`...WITNESSING_INTERFACE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) §0).
This is the architecture's analog of Habermas's "anonymous popular sovereignty":
legitimacy is procedural and person-attributed; epistemic content is anonymous and
position-attributed.

### 4.2 Participant-anonymisation

Default Ludics reads carry **no `participantId`** — the verdict is a property of
positions, not people. The Opponent design needs no author. This is a direct
consequence of Reading C, and the policy `Q-002` was filed to protect.

### 4.3 Design-set vs design-pair API

Under Reading A every interaction is a *pair* `⟨D_P ∣ D_O⟩`. Under Reading C the
natural object is `D_P` against a *behaviour* (a **set** of opposition designs). The
API surface must speak design-*sets*, not just design-*pairs* — the orthogonality
predicate ranges over `σ(D_P)^⊥`, and the runtime reads acceptability off a
behaviour, not a single duel.

### 4.4 The announcement bus

The public event surface of the substrate
([`LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md))
emits *position-level* events (a move walked, a locus contested), not *person-level*
ones — again because the dialectical layer is anonymous.

## 5. The conservativity guarantee (why Reading C is safe)

Reading C is a strong, original commitment; the risk is that it diverges from the
well-understood bilateral theory and the tooling built on it. **[T012](02_THEOREMS_AND_PROOFS/T012-reading-c-conservative.md)**
(established, cross-checked 2026-06-28) discharges that risk on the abstract-AF
fragment:

> Multi-agent Reading-C convergence verdicts **coincide** with bilateral Reading-A:
> Reading C against `k` witnesses equals the **conjunction** of the `k` pairwise
> Reading-A interactions, and is **invariant** under how the witnesses are nested
> and under the active witness changing mid-interaction — for any `|W|`.

The mechanism is the additive frontier's shared `&`/`⊕` layer (session 21): `k`
opponents form a `&`-superposition, and `&` distributes as `∀` over the witnesses,
so Reading C `= ⋀ᵢ` bilateral pair `=` grounded acceptance. **Practically:** the
anonymous behavioural reading loses *no* verdict relative to the bilateral
tradition, so the substrate keeps Reading C's conceptual gains *and* stays
interoperable with bilateral Ludics tooling and proofs. It also fixes what
"Opponent"/participation-closure means, unblocking — and, with the substrate
forward-closure now wired into the joint-saturation operator
([`C004` §4](mechanisation/agda/C004/C004.agda)), discharging on the abstract-AF
fragment — [Q-004](01_OPEN_QUESTIONS_REGISTRY.md#q-004)
front (a). The companion **[T015](02_THEOREMS_AND_PROOFS/T015-additive-realizability-keystone.md)**
locates *which* acceptance verdicts the anonymous behaviour computes off
interaction (grounded, stable, preferred-admissibility) vs. selects by constraint
(maximality).

**Mechanised (2026-06-29).** The guarantee is now machine-checked, not only
argued. T012's four clauses are mechanised **`k`-unbounded**
([`mechanisation/agda/T012/`](mechanisation/agda/T012/T012.agda)); T015's
realizability trichotomy and the `⊕`-resolution↔strategy game isomorphism likewise
([`T015/`](mechanisation/agda/T015/T015.agda),
[`T015Strat/`](mechanisation/agda/T015Strat/T015Strat.agda)). The
ASPIC+/structured-`B` lift (§7) has its first increments: the `⋀`-aggregation lifts
*verbatim* to structured witnesses with **full mid-proof polarity re-typing**
([`T012Struct/`](mechanisation/agda/T012Struct/T012Struct.agda)) — superseding the
branch-reorder model — the three attack types are *derived* from genuine argument
trees ([`T012Aspic/`](mechanisation/agda/T012Aspic/T012Aspic.agda)), and the
pipeline composes end-to-end
([`T012End2End/`](mechanisation/agda/T012End2End/T012End2End.agda)). All `--safe
--without-K`, no postulates/holes.

## 6. Disambiguation — two uses of "Reading A/B/C"

The labels are overloaded in the codebase; keep them apart:

- **This doc — the *participant* axis.** Who bears the Opponent role (bilateral /
  coalition / behaviour). Settled by Reading C; the subject of `Q-002` / `T012`.
- **The Phase-2f *order/join* axis.** A separate question — which order `⊑` the
  design lattice carries and how the articulation join is computed. There
  "Reading A" means *literal chronicle-set inclusion/union* (vs. a closure-based
  "Reading B" join); see [`LUDICS_ORDER_RELATION_DEFINITION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
  and [`T001`](02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md). Same labels, different
  question — do not conflate.

## 7. Status & pointers

- **Settled (abstract-AF):** [Q-002](01_OPEN_QUESTIONS_REGISTRY.md#q-002) resolved
  by [T012](02_THEOREMS_AND_PROOFS/T012-reading-c-conservative.md); [C002](03_CONJECTURES/C002-reading-c-conservative.md) settled.
  Both keystones are now mechanised (T012 `k`-unbounded; T015 trichotomy +
  `⊕`-resolution↔strategy isomorphism), and [Q-004](01_OPEN_QUESTIONS_REGISTRY.md#q-004)
  front (a) is discharged on the abstract-AF fragment
  ([`C004` §4](mechanisation/agda/C004/C004.agda)).
- **Advanced this thread (2026-06-29):** the **full mid-proof polarity re-typing**
  is mechanised ([`T012Struct`](mechanisation/agda/T012Struct/T012Struct.agda),
  `retype-neutral` — an arbitrary per-witness polarity-flip schedule, strictly
  stronger than the verdict-equivalent branch-reorder), and the
  **ASPIC+/structured-`B` lift** has its self-contained portion closed: structured
  argument trees with the three attack types *derived* from structure
  ([`T012Aspic`](mechanisation/agda/T012Aspic/T012Aspic.agda)), wired through the
  Reading-C `⋀`-lift end-to-end
  ([`T012End2End`](mechanisation/agda/T012End2End/T012End2End.agda)).
- **Open / future:** deriving the structured re-typing's load-bearing cut-symmetry
  (`conv-pol-sym`) from a kernel `⟦·⟧₊` model — **blocked** on Ludics substrate
  *polarity re-typing*, which does not yet exist (`Action.polarity` is static); a
  full structured-`B` argument-tree verdict beyond attack-type + read-polarity; and
  Modgil–Caminada adequacy tying the strategy game to the Dung preferred extensions
  ([T015Strat §Scope](mechanisation/agda/T015Strat/T015Strat.agda)).
- **Doctrine & lineage:** [`00_CHARTER.md`](00_CHARTER.md) (the departure from the
  bilateral tradition), [`06_HISTORY_AND_LINEAGE.md`](06_HISTORY_AND_LINEAGE.md)
  ("Reading C as the right multi-agent reading").
- **Substrate spec:** [`LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)
  (Session 0a/0b — `ι`, exposure, articulation, witness),
  [`LUDICS_OPEN_COMPOSITION_JOINT.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)
  (joint behaviours).
