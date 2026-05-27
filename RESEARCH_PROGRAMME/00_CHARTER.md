# Isonomia / Mesh — Research Programme Charter

> Status: **active**, seeded 2026-05-27. This directory is the project's theoretical
> source of truth for Ludics, computational argumentation, multi-agent
> deliberation, and the broader category of argumentation software. It is written
> for the project's future selves, not for external publication, and it sits
> deliberately one level above the harmonization sprints and implementation
> roadmaps. Nothing here ships; what ships is justified from here.

---

## §0 Framing: Argumentation as Interaction

**The shift.** Existing approaches to structured argumentation — IBIS,
Toulmin diagrams, AIF and its descendants, Walton-scheme catalogues, abstract
argumentation frameworks in the Dung tradition — treat argumentation as a
*representation* problem: how to encode arguments in a computable format so
that downstream systems (extension semantics, scheme classifiers, graph
layouts, dialectical heuristics) can operate on them. They are, in this sense,
argumentation *as data structure*. This programme treats argumentation
instead as an *interaction* problem: how to structure the process by which
participants exchange, test, and revise positions so that the interaction
itself produces higher-quality outcomes than unstructured exchange. The
representation is downstream of the interaction, not upstream of it.

**Why Ludics, specifically.** Girard's Ludics (*Locus Solum*, MSCS 2001),
developed inside linear logic as a foundation for *interactive* proof, is the
only mathematical framework in which the primary objects — *designs* — are
not propositions or proofs but *strategies for interacting*, where validity
is established by surviving every well-formed counter-interaction (the
orthogonality relation, ⊥). Behaviours — the meaningful semantic types —
are exactly those sets of designs closed under "every counter-strategy that
defeats them is itself defeatable" (⊥⊥-closure). This is not a dialogue
game grafted onto a logic; it is a logic in which interaction is
constitutive. The Lorenzen/Lorenz dialogical tradition, Hintikka's game-
theoretical semantics, and the Hamblin/Mackenzie/Walton-Krabbe/Prakken
commitment-store games are all interaction-first, but in each the
interaction is a *test* for a meaning fixed elsewhere. In Ludics the
interaction *is* the meaning. For an adversarial deliberation substrate,
that means we get for free what AIF-style and Dung-style systems must bolt
on: locative structure (where in the argument a move attaches),
orthogonality as an intrinsic notion of testing, and a closure operator
that distinguishes a position one happens to hold from a position that
survives every challenge it could meet.

**What this buys.** Treating argumentation as interaction lets the
programme pose questions that are not well-formed in a representation-first
setting:

- whether a deliberation has *converged* — closure of the participants'
  joint design set under ⊥⊥ (feeds [Q-007](01_OPEN_QUESTIONS_REGISTRY.md#q-007),
  [C005](03_CONJECTURES/C005-behaviours-directed-system.md),
  [S002](04_EMPIRICAL_STUDIES/S002-cone-coverage-convergence.md));
- whether a participant is *committed* to a sub-claim they did not
  explicitly assert — locative inheritance through the cone structure
  (feeds [Q-010](01_OPEN_QUESTIONS_REGISTRY.md#q-010),
  [T002](02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md));
- whether two rooms in a federated deliberation are *interoperable* —
  preservation of orthogonal-set verdicts across translation (feeds
  [Q-006](01_OPEN_QUESTIONS_REGISTRY.md#q-006));
- whether an outcome is *robust to adversarial probing* — survival under
  the full opponent set of the behaviour, not merely the opponents
  actually present (feeds [Q-009](01_OPEN_QUESTIONS_REGISTRY.md#q-009),
  [S001](04_EMPIRICAL_STUDIES/S001-polarization-defense-asymmetry.md)).

"Formal verification" in this programme means the narrow, defensible thing:
that orthogonality testing replaces majority vote and expert adjudication as
the procedure by which a deliberation's outcome is *certified*, and that the
certification is machine-checkable in the same sense that a proof is. Not
SMT, not theorem-proving in the general sense — orthogonality testing.

This is the load-bearing claim of the programme. Everything in
`02_THEOREMS_AND_PROOFS/`, `03_CONJECTURES/`, and `04_EMPIRICAL_STUDIES/`
either supports it, refines it, or is a probe that could refute it.

---

## How to use this directory (one page)

This directory holds the programme; the rest of the repo holds the product. The
two surfaces relate by **citation in both directions**: every file here cites
the in-repo sources it derives from by relative path, and product-side design
documents (sprint lists, architecture maps, schema migrations) are expected to
cite back into here when their justification turns on a programme-level claim.

### Layout

| File / dir | Purpose |
|---|---|
| [00_CHARTER.md](00_CHARTER.md) | This file. Subject matter, research questions by tractability, methodological commitments, intellectual position, refusals. |
| [01_OPEN_QUESTIONS_REGISTRY.md](01_OPEN_QUESTIONS_REGISTRY.md) | Append-only registry of every question the programme owns. Each entry has a status and a "how would we know it was answered" line. |
| [02_THEOREMS_AND_PROOFS/](02_THEOREMS_AND_PROOFS/) | Things the programme has actually settled, with proofs (or pointers to proofs) and a cross-check policy. Adding a theorem requires retiring the corresponding open-question line. |
| [03_CONJECTURES/](03_CONJECTURES/) | Formal-enough-to-settle conjectures. One file per conjecture; each says what would settle it positively and what would settle it negatively. |
| [04_EMPIRICAL_STUDIES/](04_EMPIRICAL_STUDIES/) | Pre-registrations and post-mortems for computational experiments (e.g. the `polarization-1*` runs) and any user studies. |
| [05_LITERATURE/](05_LITERATURE/) | The literature ingestion ritual. Subsumes the two existing rounds under `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/`. |
| [06_HISTORY_AND_LINEAGE.md](06_HISTORY_AND_LINEAGE.md) | What the programme inherits from. Names people and disagreements. |
| [07_GLOSSARY.md](07_GLOSSARY.md) | Project-internal definitions, noting where they diverge from the upstream literature. |
| [08_QUARTERLY_REVIEW_TEMPLATE.md](08_QUARTERLY_REVIEW_TEMPLATE.md) | The cadence. What changed, what closed, what aged badly. |

### Maintenance ritual

- **On every architectural decision** that turns on a programme-level claim,
  cite the entry from here in the architecture doc, and add a back-pointer in
  the entry's "implementation surface affected" line.
- **On every new theoretical result** (proof, refutation, formalisation), file
  a theorem entry under `02_THEOREMS_AND_PROOFS/`, retire or update the
  matching open question in `01_OPEN_QUESTIONS_REGISTRY.md`, and add a glossary
  entry if a new term appears.
- **On every new paper read in depth**, append to
  `05_LITERATURE/INGESTION_LOG.md` (date, paper, summariser, where notes live,
  which programme entries it touches).
- **Quarterly**, copy `08_QUARTERLY_REVIEW_TEMPLATE.md` to
  `08_QUARTERLY_REVIEWS/YYYY-Qn.md`, fill it out, and resolve every "carry"
  from the previous quarter to a state.

### What goes where (decision tree)

- A new *engineering task* without a theoretical claim → not here; goes to a
  sprint doc or roadmap under `Development and Ideation Documents/` or
  `ludics-development-roadmaps-research/`.
- A new *question that does not yet have a method* → open-questions registry,
  status `open`, method `tbd`.
- A *question with a method, framed for settlement* → registry entry plus a
  conjecture file or a study pre-registration.
- A *settled result* → theorem file plus retirement of the open question.
- A *paper to track* → literature ingestion log.

---

## 1. Subject matter

The programme treats four concentric rings, with **explicit inclusion criteria**
for each. A topic enters the programme only if it (a) constrains or is
constrained by an existing in-repo artefact, or (b) supplies a method the
programme could use to settle a registered open question.

### Core — Ludics as a model of dialogue-as-interaction

The substrate the programme is built around. Designs are chronicle-sets under
literal inclusion, grouped into behaviours per root locus; minimal
incarnations form an antichain `Inc(B)` decomposing the behaviour into
disjoint cones, each of which is a per-cone JSL whose join is set-union
within the cone (see
[`Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_ORDER_RELATION_DEFINITION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
and
[`.../LUDICS_OQ_JSL_PROOF.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)).
A canonical anonymous `LudicMove` at a locus is *instantiated* by a
`WitnessRecord` binding it to a `DialogueMove` via the records-only operation
ι (the dialectical witnessing interface,
[`.../LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)).
The runtime layer (compile, step, orthogonality, daimon, concession, fax,
scoped designs) is documented in
[`Development and Ideation Documents/ARCHITECTURE/LUDICS_SYSTEM_ARCHITECTURE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_SYSTEM_ARCHITECTURE.md).
The substrate↔runtime correspondence is the harmonization programme
([`LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md)).

**In:** Reading C multi-agent Ludics; open composition (joint behaviours,
[`.../LUDICS_OPEN_COMPOSITION_JOINT.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md));
the triads bridge and confidence-erasure functor
([`.../LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md),
[`.../LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md));
the announcement bus protocol
([`.../LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md))
as the public event surface of the substrate.

**Out:** internal-completeness proofs for fragments of MALL/μMALL∞ that have
no candidate use in deliberation (we cite Baelde, Doumane, Saurin but do not
extend them); proof-net optimisation; classical Geometry of Interaction
beyond what informs orthogonality.

### Inner ring — computational argumentation

AIF (Argument Interchange Format), ASPIC+, ABA, Dung-style abstract
argumentation frameworks and the bipolar / weighted / control-based variants.
The runtime bridges ludics into AIF via
[`lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts); the programme owns the
question of what that bridge means, not just what it does.

**In:** ASPIC+ grounded extensions and their relationship to ludic
convergence; AIF as the lingua franca for cross-room transport; Walton's
scheme taxonomy and the auto-generated critical questions as the operational
specification of "what an attack on this argument could even look like";
Prakken-style expansions and dialectical strength (cf.
[`.../LITERATURE_REVIEW_ROUND_2.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md)
§2.4 R-C8).

**Out:** novel labelling semantics for Dung frameworks (we use existing ones);
benchmarking against the ICCMA solver competition; abstract argumentation
algorithms whose only application is to standalone AFs.

### Middle ring — multi-agent deliberation

Epistemic logic, dynamic epistemic logic, judgement aggregation, opinion
dynamics, commitment-store dialogue games (Hamblin, Mackenzie, Walton &
Krabbe, Singh), public-announcement logic and its dialogical relatives.

**In:** the formal relationship between commitment stores and ludics loci;
the doctrinal status of Reading C (the Opponent role borne by the behaviour
itself rather than by a coalition); judgement aggregation as a sanity check
on cross-room arguments imported via the Plexus network.

**Out:** mechanism design for voting; market-based aggregation; agent-based
modelling of opinion dynamics where the agents are not modelled as carrying
structured arguments.

### Outer ring — argumentation software as a category

Other systems that have tried to do approximately what Isonomia is doing:
collaborative reasoning tools (Argument Web, Carneades, Rationale, Kialo,
Polis), decision-support systems, peer-review platforms (Hypothesis,
OpenReview), evidence platforms (factchecking infrastructure, Climate
Feedback, Cochrane reviews), public deliberation infrastructure (Decidim,
Pol.is, Consul, online citizens' assemblies). The product overview
[`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md)
positions Isonomia inside this space; the programme owns the comparative
questions.

**In:** comparative studies of which kinds of structure these systems impose
and what kinds of dialogue those structures empirically support; the
question of which deliberation-software design choices the substrate-level
theory rules in or out.

**Out:** product-feature competitive analysis; market sizing; UX design
patterns disconnected from epistemic claims.

---

## 2. Research questions, by tractability

The programme groups its questions by what kind of work would settle them. The
canonical list lives in
[`01_OPEN_QUESTIONS_REGISTRY.md`](01_OPEN_QUESTIONS_REGISTRY.md); the four
tiers here are the headline shape.

### Tier 1 — settled-in-this-repo (theorems we have proved)

These are recorded under [`02_THEOREMS_AND_PROOFS/`](02_THEOREMS_AND_PROOFS/).
At seed time, two:

- **T001 OQ-JSL per-cone.** Within a behaviour B, the cone above each
  incarnation `Dᵢ ∈ Inc(B)` is a join-semilattice under literal
  chronicle-set inclusion, with join `∪` and bottom `Dᵢ`. Proven in
  [`.../LUDICS_OQ_JSL_PROOF.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)
  with the Phase 2f Reading A reformulation in
  [`.../LUDICS_ORDER_RELATION_DEFINITION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md).
- **T002 Inc(B) antichain.** The set of minimal incarnations of a
  behaviour is an antichain under literal chronicle-set inclusion; B
  decomposes as the disjoint union of cones above incarnations
  (Cone Decomposition Proposition).

### Tier 2 — open and formal (provable / disprovable conjectures)

Recorded under [`03_CONJECTURES/`](03_CONJECTURES/). Each conjecture states
what positive settlement looks like (proof reference) and what negative
settlement looks like (counterexample). Seed set:

- **C001** Art(B) ↔ Hom_{A_Γ}(A, B) (the Ambler bridge).
- **C002** Reading C multi-agent Ludics is conservative over bilateral.
- **C003** The walked / witnessable / latent exposure-map stratification
  refines Prakken-style expansions monotonically.
- **C004** Joint saturation `σ_joint(D_P, Witness)` is a closure operator
  with deliberative-progress = exposure-map drainage.
- **C005** A time-indexed family `{B_t}` of behaviours forms a directed
  system whose limit characterises deliberative convergence.

### Tier 3 — open and empirical (measurable about real or synthetic deliberations)

Recorded under [`04_EMPIRICAL_STUDIES/`](04_EMPIRICAL_STUDIES/). Each study
specifies an explicit hypothesis and the existing platform data it consumes
(or the synthetic generator it requires). Seed set:

- **S001** Synthesis quality vs. defense asymmetry in the
  `experiments/polarization-1-iter3-e2e/` framework.
- **S002** Cone coverage vs. dialogical convergence in seeded deliberations.
- **S003** MCP write traffic: AI-authored vs. human-authored argument
  survival under attack, with the `authorKind` / `aiProvenance` provenance
  flags described in
  [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md)
  §IV.

### Tier 4 — open and philosophical (normative questions about good deliberation)

These cannot be settled by proof or experiment alone; they are settled by
articulation, by literature engagement, and by being willing to be pinned to
a position. They are recorded in the open-questions registry with method
`philosophical`. Seed examples:

- What does it *mean* for a deliberation to be "open enough"? Is openness a
  property of the room's design, of the participants' commitments, or of the
  behaviour's exposure map?
- When is AI-authored argumentation epistemically legitimate? The platform
  already enforces the legality contract (AI warrants do not lift to logical
  until ratified, see
  [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md)
  §IV); the *normative* question of whether this is the right line is open.
- What does "consensus" mean if it is structurally indistinguishable from
  exhaustion?

---

## 3. Methodological commitments (and refusals)

The programme uses five kinds of work; the ordering reflects priority where
two methods compete.

1. **Formal proof.** First-class. A claim that can be stated formally is
   stated formally, in [`02_THEOREMS_AND_PROOFS/`](02_THEOREMS_AND_PROOFS/) or
   as a conjecture in [`03_CONJECTURES/`](03_CONJECTURES/). Proofs are
   human-checked by default; we will not adopt a proof assistant until a
   specific result warrants it.
   - *Refusal:* the programme will not accept "implementation-passes-tests"
     as a substitute for a proof. Tests are a falsification surface for
     conjectures, never a settlement.

2. **Computational experiments on synthetic deliberations.** First-class.
   The `experiments/polarization-1*` lineage and the seeded results in
   [`ludics-development-roadmaps-research/seededludicsdelibresults*.txt`](../ludics-development-roadmaps-research/)
   are the prototype. New experiments are pre-registered under
   [`04_EMPIRICAL_STUDIES/`](04_EMPIRICAL_STUDIES/) before being run.
   - *Refusal:* the programme will not report computational results without a
     pre-registration that fixes the metric and the analysis before the
     data is generated.

3. **Empirical studies with real users.** Auxiliary at this stage; promoted
   to first-class as soon as the platform reaches a deployment that
   ethically supports it. The same pre-registration discipline applies.
   - *Refusal:* the programme will not run user studies on behaviours the
     platform has not exposed in production. Lab studies of mocked-up UIs
     do not count as evidence about Isonomia.

4. **Literature engagement.** First-class as inputs (we read widely);
   auxiliary as outputs (we do not optimise for publication). The ritual is
   in [`05_LITERATURE/`](05_LITERATURE/).
   - *Refusal:* the programme will not cite a paper it has not read in full
     at least once. Round-by-round reviews
     ([`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md),
     [`.../LITERATURE_REVIEW_ROUND_2.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md))
     count as ingestion; secondary citation does not.

5. **Engineering.** Auxiliary to the programme but primary to the project.
   The programme's authority over engineering is **negative**: it can rule
   out architectures that contradict settled theorems (e.g. anything that
   silently joins across cones), but it does not generate sprints. Sprint
   planning lives in
   [`Development and Ideation Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_2_SPRINT_LIST.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_2_SPRINT_LIST.md)
   and the `ludics-development-roadmaps-research/` directory.
   - *Refusal:* the programme will not be used as a roadmap. If a sprint
     justifies itself by "the programme says so," the programme entry it
     cites must already exist.

---

## 4. Intellectual position

The programme inherits from, and disagrees with, the following.

**Dialogical logic (Lorenzen, Lorenz, Felscher, Krabbe).** We inherit the
view that meaning is *dialogically constituted*: the content of a claim is
fixed by what counts as a successful defence of it under attack. We
disagree with the Lorenzen/Lorenz commitment to a single fixed protocol;
the platform's typed dialogue moves are protocol-relative, and the
programme treats protocol choice as a substantive parameter rather than a
foundational commitment.

**Game-theoretical semantics (Hintikka, Sandu).** We inherit the
Player/Opponent framing of evaluation as a game. We disagree with
Hintikka's treatment of the game as *bilateral* by stipulation; under
**Reading C** (substrate-original; literature null result confirmed in
[`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md)
§2 C7) the "Opponent" is the behaviour `σ(D_P)^⊥`, not a coalition of
agents.

**Brandomian inferentialism.** We inherit the priority of *inferential
articulation* over reference: an argument means what it commits its author
to defend. We disagree with Brandom's score-keeping vocabulary being
language-bound; the substrate's commitment-store lives at loci, not at
sentences, and a commitment is geometric before it is linguistic.

**Habermasian discourse ethics.** We inherit the idea that legitimacy is
procedural and that the procedure is justified by what it permits all
participants to do. We disagree with the regulative-ideal framing; the
platform builds the procedure as infrastructure, and the programme treats
its empirical adequacy as testable rather than presupposed. The closest
honest analog for the substrate's two-layer T4 architecture is Habermas's
"anonymous popular sovereignty" passage (BFN 1996 p. 486), not Cohen's
legitimacy criterion (this correction is from
[`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md)
§1).

**Sellars's logical space of reasons.** We inherit the picture of
justification as a social-normative space, and the explicit refusal of the
"Myth of the Given." We disagree with the implicit assumption that the
space of reasons is a *single* space; the Plexus network treats it
explicitly as a graph of rooms with cross-room transport carrying its own
confidence-gating.

**Walton's argumentation schemes.** We inherit the taxonomic apparatus and
the methodology of critical questions: a scheme *names* the inference
license, and the critical questions *expose* the points at which it could
fail. We use the scheme catalogue almost as Walton states it. We disagree
on operational status: Walton's schemes are diagnostic, ours are
constitutive — the scheme is part of the argument's identity, not merely
its classification.

**The Dutch dialogue-logic / commitment-store school (Hamblin, Mackenzie,
Walton & Krabbe, Prakken).** We inherit the apparatus of typed dialogue
moves, commitment stores, and protocol-relative legality. We disagree with
the Dutch tradition's tendency to treat commitments as flat propositional
sets; ours are stratified by locus, witnessed by ι, and (per the substrate's
fossil-record discipline) retain back-pointers to the loci they were
vacated from. The closest extant analog is Prakken-style `retract` in
warrant-mcp (cf.
[`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md)
§1).

**French Ludics tradition (Girard 2001, Faggian & Hyland 2002, Terui 2011,
Fouqueré & Quatrini 2013, Fleury, Saurin, Baelde, Doumane).** We inherit
the entire technical apparatus. We disagree on two points: (i) the
dialogue-Ludics track (Lecomte, Quatrini, Fleury, Tronçon) is uniformly
bilateral, and we depart from it by committing to Reading C; (ii) the
substrate's `Art(B)` named triple is a specialisation not stated as such
in the published Ludics literature, and we own it as substrate-specific
(cf.
[`.../LITERATURE_REVIEW_ROUND_2.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md)
§2.1).

**Israeli / Dung abstract argumentation tradition (Dung, Caminada,
Modgil & Prakken, Cayrol & Lagasquie-Schiex, Bench-Capon).** We inherit
abstract argumentation as the *coarse* semantic layer (grounded extension,
preferred semantics, bipolar / weighted variants) and use ASPIC+ as the
structural bridge. We disagree with the tradition's representational
asceticism: an argument for us has internal geometry (a locus address, a
scheme, a chronicle), and the AF view is a *projection* rather than the
primary object.

**Social epistemology (Goldman, Mercier & Sperber, List & Pettit, Fricker
on epistemic injustice).** We inherit the framing of epistemic systems as
designed artefacts whose performance is evaluable; specifically, we
inherit Mercier & Sperber's argumentative-function hypothesis as a working
empirical conjecture. We disagree with vote-aggregation and
wisdom-of-crowds framings that treat individual judgements as the unit;
the unit for us is the *argument*, and the aggregation question is
structural rather than statistical.

---

## 5. Self-imposed limits (one paragraph)

The programme refuses three things. It refuses to be a roadmap (engineering
work justifies itself, but cites here when its justification turns on a
theoretical claim). It refuses to be a paper (we do not optimise for
external publication; if a result would benefit from publication, we publish
*from* the programme, not *as* it). And it refuses to be silent on what it
does not know: every entry in
[`01_OPEN_QUESTIONS_REGISTRY.md`](01_OPEN_QUESTIONS_REGISTRY.md) carries its
own confession of method, dependency, and how-we-would-know-the-answer.
