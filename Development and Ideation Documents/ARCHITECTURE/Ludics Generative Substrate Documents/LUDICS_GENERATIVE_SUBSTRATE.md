# Ludics as Generative Substrate — Mapping the Theoretical Terrain

**Session:** 0 (Conceptual prelude)
**Date:** 2026-05-16
**Track:** Conceptual / pre-product
**Companions:**
[LUDICS_SYSTEM_ARCHITECTURE.md](../LUDICS_SYSTEM_ARCHITECTURE.md) ·
[LUDICS_USEFULNESS_BRAINSTORM.md](./LUDICS_USEFULNESS_BRAINSTORM.md)

---

## Framing

The full session deck (A–F in the brainstorm doc) implicitly treats Ludics as an
*analytic* layer: given a deliberation, compute things about it (convergence,
decisive loci, standing). This session flips the polarity. *What is the
theoretical terrain for using Ludics to **produce** the formalized possibility
space of how a multi-agent deliberation could progress?*

A thesis to orient everything below, before any cartography:

> **Ludics is already generative.** A design is a total strategy — it
> prescribes a Proponent response at every reachable Opponent move. The
> *unplayed branches of a design are the possibility space.* The analytic
> readings we have been emphasizing (convergence verdicts, decisive-position
> heatmaps) are projections, queries, of an underlying generative structure
> that the engine already constructs. The question is not "how do we add
> generative capability to Ludics" but "which generative structures are we
> already producing, and which do we have to expose, name, and combine."

That reframes the brainstorm. We are not building new theory; we are choosing
which theoretical structures already in the engine to treat as the unit of
work.

What follows is the terrain. Eight regions; for each, the construct, what it
generates, what we already have in the codebase, and the open conceptual
question that would have to be answered before that region could be put to
generative use.

---

## 1. The design itself as a tree of possible continuations

**Construct.** A Ludics design is not a sequence of moves — it is a tree. Each
Proponent node has, beneath it, a branch for every Opponent move the protocol
permits at that locus, and beneath each of those, the Proponent's prescribed
response. The played trace is one root-to-leaf path through this tree; all the
other paths are *the formal possibility space of how the play could have gone*.

**What it generates.** For any partial play, the set of legal continuations,
indexed by Opponent's choices. This is a game tree but with a crucial property
absent from classical game trees: the locus addressing means each branch is
*named*, not just enumerated. "What if Opponent attacked premise 2 of argument
α at sub-locus 2.1?" is a question with an answer that has an address.

**What we have.** The Stepper produces designs from moves; Virtual Evaluation
already lets us try moves without committing. We have the substrate to walk
the tree.

**Open question.** Designs are usually drawn for *one* Proponent and *one*
Opponent. In a multi-agent deliberation, the "Opponent role" is borne by a
coalition (everyone who isn't the current speaker) and shifts move-by-move.
*What is the generative object when the polarity assignment is itself
dynamic?* (See §6.)

---

## 2. Orthogonality and the counter-design space

**Construct.** Two designs are orthogonal when their interaction converges
(terminates with daimon). For any Proponent design $D$, the set $D^\perp$ of
all designs orthogonal to it is the *set of all possible adversaries who would
still let the play terminate with $D$ winning*.

**What it generates.** Given a current Proponent strategy, $D^\perp$
enumerates the possible "complete oppositions" — the structured space of what
a coherent objector to $D$ could look like. Dually, given an Opponent challenge
profile, $\{D : D \perp E\}$ enumerates the Proponent strategies that survive
it.

**What it generates that nothing else on the platform does.** ASPIC+ tells you
whether an argument is in the grounded extension. It does not give you the
*space of possible defenders* of a claim, or the *space of possible attackers*,
as enumerable structured objects. Orthogonality does.

**Open question.** $D^\perp$ is in general infinite. For generative use we
need a *finite, navigable presentation* of it — and that is exactly what
behaviours and incarnations are for. (See §3.)

---

## 3. Behaviours and incarnations: equivalence classes as possibility spaces

**Construct.** A behaviour is a set of designs closed under bi-orthogonality:
$B = B^{\perp\perp}$. The incarnations of $B$ are its minimal elements. Two
designs in the same behaviour are *interchangeable as positions in the game*:
they have exactly the same orthogonal class.

**What it generates.** A behaviour is — literally, definitionally — *the
formal possibility space of "all strategies that play this position
equivalently."* It is a quotient of the design space modulo "what difference
does it make to the adversary." This is the central generative object of
Ludics. It is also exactly what Phase 5 is building.

**Two reading modes:**

- **Author mode.** "Here is the behaviour I am committed to. What are the
  minimal incarnations? Each one is a *minimum-commitment plan* that suffices
  to hold this position."
- **Analyst mode.** "Here is the behaviour the participant is implicitly
  defending. What are *all* its members? Each is a possible elaboration she
  could make without changing her dialectical position."

**Open question.** Behaviours are a clean concept for two-player closed
deliberations. *What is the right notion of behaviour for a deliberation that
is still open* — where loci can still be created, where the type of the
interaction is still being negotiated? "Open" / "unbounded" /
"context-extensible" behaviours are not a standard textbook object. We may
have to define one.

---

## 4. Saturation as a generative operator

> **Terminological note.** "Saturation" in this track always means **protocol
> saturation** $\sigma(D)$: the closure that adds to a design every move
> structurally forced by the protocol given what has already been said. This
> is *distinct from* the "saturation properties on visitable paths" of
> Fouqueré & Quatrini (LMCS 14(2), 2018, arXiv:1403.3772), which is the only
> other published use of the term "saturation" inside Ludics. The two
> operators are unrelated; any external publication of this track must
> disambiguate at first use.

**Construct.** Saturation adds to a design every move that *must* be there for
closure under the protocol — the daimons forced by the addressing structure,
the negative replies required at every visited positive locus, the moves
required by polarity discipline. It is a closure operator: $\sigma(D) \supseteq
D$, $\sigma(\sigma(D)) = \sigma(D)$.

**What it generates.** The *minimum complete continuation space implied by
what has already been said*. If a participant has asserted $A$, saturation
gives the set of moves they are obligated to be willing to make if challenged
at any sub-locus of $A$ — without them having to enumerate those obligations
consciously.

**Why this is important for the platform specifically.** The commitment store
tracks what has been *said*. Saturation gives what has been *implicitly
committed to*. The gap between these is the "obligation surface" — the set of
moves a participant has, by the structure of their prior moves, already
accepted they would have to make.

**Open question.** Classical saturation operates on a single design. *What is
the joint saturation of a multi-agent deliberation* — the closure of all
participants' designs simultaneously under their interaction? This is not just
the union of individual saturations.

---

## 5. The DDS strategy/design correspondence: plans branching on adversary choice

**Construct.** Faggian–Hyland prove an equivalence between innocent strategies
(in the HO/Nickau sense) and designs (with appropriate restrictions). An
innocent strategy is a partial function from Opponent-ending histories to
Proponent moves: a *plan that branches on what Opponent does*.

**What it generates.** A strategy *is* a generative object by construction: it
is the data of "for every possible adversary continuation, here is my next
move." Fully unfolding a strategy produces a design tree (§1); the strategy is
its intensional, *plan-shaped* presentation.

**The generative payoff.** This is the natural data structure for "I am
planning my next contribution to this deliberation." A user (or an agent)
does not specify a sequence of moves; they specify a *branching plan*, with
possible elaborations at each adversary choice point. The deliberation then
unfolds the plan against the actual adversary.

**Open question.** Innocence is single-thread. In a deliberation with parallel
disputes (multiple loci being actively contested), the planner needs something
like a *concurrent* strategy — a plan that branches on adversary moves
*across multiple loci simultaneously*. The DDS layer has plumbing for this but
it is not the standard mathematical object; what is the right generalization?

---

## 6. Polarity, multi-agency, and the question of *whose* possibility space

**The asymmetry.** Classical Ludics is a two-player game: Proponent (positive)
and Opponent (negative). Deliberations on the platform are multi-agent. The
translation in the engine treats "everyone except the current speaker" as a
collective Opponent. This works analytically; it strains conceptually as soon
as we want to generate.

**Three available framings, none yet committed-to in the engine:**

1. **Coalitional Opponent.** Treat all non-speakers as a single collective
   Opponent whose move at each step is the union of what any of them might do.
   The possibility space at an Opponent node is the union over participants.
   *Loses individual strategic agency.*
2. **Locus-partitioned polarity.** Each participant owns a subset of loci
   where she is Proponent; at all other loci she is Opponent or neutral. The
   deliberation is a single design with multiple polarity-bearing agents,
   distinguished by address rather than by global role. *Preserves agency but
   requires a polarity-assignment discipline we don't currently formalize.*
3. **Many-design composition.** Each participant maintains her own design over
   the whole locus space; their joint interaction is a parallel composition.
   The possibility space is a product (or pullback) of individual design
   spaces, with consistency constraints. *Most theoretically expensive;
   closest to what real multi-agent deliberation looks like.*

**Open question, and probably the central one for the brainstorm.** *Which of
these is the right object for "the formal possibility space of a multi-agent
deliberation's progression"?* Each generates a different kind of possibility
space. The answer is not in the existing literature — Ludics is overwhelmingly
two-player. This is where the platform would have to do its own theoretical
work.

### Resolution — Session 0a (2026-05-16)

The three framings above were refined in session 0a into a four-reading
spectrum, of which the platform commits to **Reading C**.

**Reading A — Aggregative coalition.** Opponent's possible move at each step is
the union of moves participants might make. Coalition is post-hoc aggregation
over individual designs; individual strategic intent remains primary. *Does
not genuinely decenter.*

**Reading B — Protocol-saturated coalition.** Reading A augmented with the
moves the protocol *forces* given Proponent's prior content (saturation). The
deliberation now "knows" things its members have not articulated. *First
reading that genuinely decenters.*

**Reading C — Anonymous-behaviour Opponent.** Opponent *is* the
bi-orthogonal closure $\sigma(D_P)^\perp$ — the set of all coherent
opposition designs to Proponent's saturation. Opponent is **a behaviour, not
a participant or a coalition of participants.** Individuals do not constitute
Opponent; they *witness* (instantiate) moves in a pre-structured space whose
extent is fixed by the dialectical content of what Proponent has said.

**Reading D — Universal dialectical complement.** Opponent as bi-orthogonal
closure against the universal background of all coherent rational discourse,
independent of this community and this context. *Rejected as overreach:
collapses the difference between this deliberation and any other.*

#### Why Reading C is affordable: the separation of dialectical and witnessing layers

The philosophical costs of Reading C — loss of attribution, the
"manufactured Opponent" worry, loss of perspectival information, the
boundedness of "coherent opposition" — are real, and would be disqualifying if
Ludics had to bear them alone. **The platform's architecture has pre-committed
to a separation that off-loads each cost to a different layer.**

- The **witnessing layer** (social graph, profiles, reputation system,
  institutional pathways, facilitation cockpit, equity surface,
  intervention log, handoff trail, contribution tracking) is *agent-centric
  on purpose*. It preserves who spoke, how participation distributes across
  constituencies, which authority each speaker carries, what equity is or is
  not being honored, who gets credit for what kind of contribution. It is
  grounded in the Deliberative Democracy research lineage. The closest
  existing structural-architecture analogs are **Habermas's "anonymous
  popular sovereignty" passage** (*Between Facts and Norms* 1996, p. 486 —
  popular sovereignty becomes "subjectless" as it flows through procedure),
  **Fishkin's aggregate-only Deliberative-Polling reporting discipline**
  (*When the People Speak* 2009 — confidential pre/post surveys plus
  attributed face-to-face discussion, with structural results reported only
  in aggregate), and **Mansbridge et al.'s systemic decomposition** of
  deliberative labour across components (2012 "Systemic Approach to
  Deliberative Democracy"). Cohen 1989 is sometimes invoked here but his
  legitimacy criterion is content-side ("reasons all reasonable participants
  could accept") rather than attribution-architectural; the gloss
  "legitimacy without identifiable authorship" overreaches Cohen and should
  not be used. Estlund's epistemic proceduralism is adjacent but not
  layer-architectural. Whichever theorist is invoked, agent-centric
  legitimacy at the witnessing layer is non-negotiable.
- The **dialectical layer** (Ludics) is *position-centric on purpose*. It
  preserves the structural integrity of the position independent of who
  articulates it — what the position commits to, what objections it
  licenses, what equivalence class of strategies plays it.

These are not competing views; they are **complementary projections of the
same deliberation**. Together they cover what the deliberation is; separately
neither over-claims. The Ludics layer is presently *parallel and
non-interactive* — it does not speak to participants — which contains the
"manufactured Opponent" risk by architecture rather than by policy.

This separation is itself a theoretical commitment, captured below as **T4**.

---

## 7. Delocation as a generator of families

**Construct.** Delocation is the renaming of loci so that the same design can
be applied at different addresses. Two designs related by delocation are *the
same strategic structure played at different places*.

**What it generates.** Given a design $D$ at locus $\xi$, delocation produces
a *family* $\{D_\eta : \eta \in \text{Loc}\}$ of structurally identical
designs at every other locus. This is the formal substrate of "the same
argument, in a different context."

**Generative reading.** Given a deliberation $\mathcal{D}_1$ in room $R_1$,
delocation generates a family of possible "delocated versions" in rooms $R_2,
R_3, \ldots$. The possibility space of *how this deliberation could be
re-instantiated elsewhere* is a delocated family. This is exactly what the
Plexus does informally; Ludics gives the formal generator.

**Open question.** Delocation preserves structure but not context. *Under what
conditions does a delocated design retain its dialectical force* — when the
loci it refers to are anchored to actual claims that don't exist in the
target room? The generative object is "the family of all delocations that
remain interpretable." This needs a notion of *interpretability constraint*
that is not classical Ludics.

---

## 8. Composition: cut, interaction, and the algebra of possibility spaces

**Construct.** The cut of two designs $D \bowtie E$ is a new design (or
interaction) formed by joining at a shared locus. If we vary $D$ over a class
$C_D$ and $E$ over a class $C_E$, the cut $C_D \bowtie C_E$ is a *new class*:
the possibility space of *combined positions*.

**What it generates.** An *algebra of possibility spaces.* Possibility spaces
are not just sets of designs; they compose. The possibility space of a
deliberation that combines sub-deliberations $\delta_1$ and $\delta_2$ is
structurally derivable from the possibility spaces of each.

**Why this matters.** This is the compositional pay-off. It means we can
compute the possibility space of a long deliberation without re-deriving it
from scratch — by composing the possibility spaces of its parts. It is the
conceptual basis for any *incremental* generative system: as the deliberation
grows, update the possibility space by composition, not by recomputation.

**Open question.** Cut elimination is well-understood. *The algebra of
possibility-space composition* — what operators preserve which properties,
what closures exist — is not. This is the deepest open territory.

---

## How these eight regions hang together

Two axes organize the terrain:

| | **Static (snapshot)** | **Dynamic (evolution)** |
| --- | --- | --- |
| **Single-design view** | §1 design-tree, §4 saturation | §5 strategy unfolding |
| **Class-of-designs view** | §2 orthogonal class, §3 behaviour | §7 delocated family, §8 cut algebra |

And underlying all of them, as a foundational choice that has not yet been
made: §6, *what is the polarity model for multi-agent deliberation*. Until
that is fixed, every other region produces a different possibility space
depending on which framing you adopt.

---

## Theses

**T1.** *(Affirmed.)* The right unit of generative work is the **behaviour**
(§3), not the individual design. A behaviour is, definitionally, a formalized
possibility space. Everything else (game tree, orthogonal class, saturation
closure, delocated family) is either constructive material for behaviours or
queries over them.

**T2.** *(Affirmed.)* The right *generator* — the operation that *produces*
the possibility space from a partial deliberation — is **saturation followed
by bi-orthogonal closure** ($D \mapsto \sigma(D)^{\perp\perp}$). This is not
a known named operation in the literature; if we want a generative Ludics it
may be the first thing to name. Under Reading C this is also the operation
that *defines the anonymous Opponent behaviour* from the current Proponent's
position.

**T3** *(superseded, see T3′).* ~~Locus-partitioned polarity as the
multi-agent model.~~

**T3′** *(replaces T3, session 0a).* **Polarity belongs to *loci*, not to
agents.** A locus is positive when the position currently articulated at it
commits to defending it; negative when the dialectical situation demands its
challenge. Participants do not own polarities; they instantiate moves whose
polarity is determined by the locus, not by them. This is the polarity
discipline forced by Reading C.

**T4** *(new, session 0a).* **The dialectical layer and the witnessing layer
are coordinate and non-reducible.** The platform's architecture stakes a
position in deliberative-democracy theory: individual voice and collective
dialectical structure are *coordinate, not reducible to each other*, and the
right architecture preserves them as separate but interoperating layers.
Reading C is afforded *because* the witnessing layer exists; the witnessing
layer is intelligible as more than UX *because* the dialectical layer exists.
Neither subsumes the other.

**T5** *(new, session 0a — cross-cutting concern).* **The natural consumer of
generative Ludics outputs is the MCP / AI-agent surface, not the human
participant.** Under Reading C, the Ludics layer is parallel and
non-interactive with respect to human participants — its outputs are
structural facts about the deliberation that have to be *consulted*, not
*spoken*. AI agents (over the model-context-protocol surface) are
different in three respects: (i) they can consume structured behaviour /
exposure / lattice data at speed and resolution humans cannot; (ii) they
benefit from anonymous-dialectical artifacts because they have no standing
as witnesses in the deliberative-democratic sense; (iii) they need exactly
the kind of *honest, content-derived possibility space* that Reading C
produces — to cite against, to test their own outputs against, to be
grounded by. Every subsequent session in this track should ask, at the
end, *what does this expose to an agent consumer that nothing else does?*

---

## Cross-cutting concern: the MCP / AI-agent consumer

The platform already exposes a model-context-protocol surface for the
AI-Epistemic Primitive (read tools: orientation, argument lookup,
counterargument discovery, claim stances, citation resolution; write tools:
`propose_argument`, `propose_structured_argument`, `propose_warrant`).
Generative Ludics under Reading C is a natural *extension surface* for that
protocol. Three intuitions, to be developed in later sessions:

- **The exposure map** (§3 / §4 / §6) is exactly what an agent needs to
  answer "where would this position fail if challenged?" — a question no
  current MCP tool addresses, and one that requires the anonymous Opponent
  behaviour to even formulate.
- **The articulation lattice** (incarnations of the position's behaviour)
  gives an agent a *minimum-commitment* paraphrase of any position. An
  agent that cites an argument can also cite *the minimal version of the
  same dialectical position* — useful for compression, paraphrase,
  cross-room transport, and honest summarization.
- **The witnessing record** (the mapping from anonymous moves in the
  behaviour to who walked which when) is the joint substrate that lets
  agent and human readouts agree on what happened, without forcing the
  dialectical layer to embed authorship. An agent reporting on a
  deliberation reads the dialectical structure *and* the witnessing
  record; either alone would be partial.

The principle to carry forward: the witnessing layer is for humans (it is
the legitimacy surface); the dialectical layer is for agents (it is the
epistemic surface); the *interface between them*, when we get to it (0b),
is where both kinds of consumer have to be served at once.

---

## Suggested next sessions in this conceptual track

- **0a — Multi-agent polarity.** ✅ *Resolved (2026-05-16).* Dissolved into
  Reading C + the dialectical/witnessing separation (T3′, T4). See the
  Resolution subsection of §6.
- **0b — The dialectical/witnessing interface.** ✅ *Resolved (2026-05-17).*
  Captured in [LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md](./LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md).
  Defined the instantiation operation $\iota$ with four invariants;
  gave first-pass precise definitions of the exposure map, articulation
  lattice, and witnessing record; identified the articulation lattice as the
  Ludics-native presentation of an Ambler hom-set; scoped-but-deferred the
  announcement discipline (sub-question ii) behind the §2 MCP tools.
- **0c — Open behaviours.** ✅ *Resolved (2026-05-17).* Captured in
  [LUDICS_OPEN_COMPOSITION_JOINT.md §Session 0c](./LUDICS_OPEN_COMPOSITION_JOINT.md#session-0c--open-behaviours).
  Time-indexed directed system $\{\mathsf{Art}(B_t)\}$ with partial
  transition maps; three openness levels (carrier / loci / orthogonality);
  stable-core / fragile-membership / lost-articulations derived views;
  fossil-witness discipline against the time-indexed exposure map.
- **0d — The composition algebra.** ✅ *Resolved (2026-05-17).* Captured in
  [LUDICS_OPEN_COMPOSITION_JOINT.md §Session 0d](./LUDICS_OPEN_COMPOSITION_JOINT.md#session-0d--the-composition-algebra).
  Three operators (subordination, transport, federation); Ambler-arrow
  composition lifts to articulation-lattice convolution; exposure-map
  composition requires re-saturation; $\iota$ and $\mathsf{Witness}$
  compose by structural reconciliation.
- **0e — Joint saturation in a multi-agent setting.** ✅ *Resolved
  (2026-05-17).* Captured in
  [LUDICS_OPEN_COMPOSITION_JOINT.md §Session 0e](./LUDICS_OPEN_COMPOSITION_JOINT.md#session-0e--joint-saturation-in-a-multi-agent-setting).
  $\sigma_{\mathrm{joint}}(D_P, \mathsf{Witness})$ as forward-closure over
  participation; three properties (J1–J3); drained-latent-stratum as the
  formal account of deliberative "progress."
- **(ii deferred) Announcement discipline implementation.** Re-open after
  the 0b §2 MCP tools (`get_exposure_map`, `get_articulation_lattice`,
  `get_witnesses`, `get_unwitnessed_exposure`) ship and stabilize.

---

## Status

Session 0 produced the eight-region terrain map and three opening theses.
Session 0a (folded into §6 above) refined the framings to a four-reading
spectrum, committed to **Reading C** (anonymous-behaviour Opponent), and
articulated the **dialectical/witnessing separation** (T4) as the
architectural commitment that makes Reading C affordable. T3 was superseded
by T3′ (anonymous polarity). T5 was added as a cross-cutting reminder to
develop every subsequent session with the MCP/AI-agent consumer in view.

Session 0b (captured in
[LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md](./LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md))
formalized the interface itself: the instantiation operation $\iota$ with
four invariants; the exposure map, articulation lattice, and witnessing
record as the first Ludics-native MCP-tool-shaped reads; recognition of the
articulation lattice as the Ludics-native Ambler hom-set, aligning the
conceptual track with the Ambler-style evidential-closed-category algebra
roadmap; and the announcement
discipline (sub-question ii) scoped but deferred behind the §2 MCP tools.

Sessions 0c, 0d, 0e (captured in
[LUDICS_OPEN_COMPOSITION_JOINT.md](./LUDICS_OPEN_COMPOSITION_JOINT.md))
add the time, joining, and closure axes: time-indexed open behaviours; a
three-operator composition algebra over the four 0b components; and
post-Reading-C joint saturation $\sigma_{\mathrm{joint}}$. The complete
Ludics-native MCP read surface proposed by the conceptual track now stands
at ~14 tools.

Round 1 of the external literature review (captured in
[LITERATURE_REVIEW_ROUND_1.md](./LITERATURE_REVIEW_ROUND_1.md)) has been
folded back in: 9 of 20 falsifiable claims confirmed with ≥2 independent
sources, 4 confirmed-with-caveat, 4 original-to-this-track (notably C4
stratification, C10 deliberation-setting categorical composition, C20 joint
saturation, and the C3 Ludics–Ambler bridge as a single-source structural
identification), and substantive corrections to the ECC terminology, the
Cohen-1989 framing, and the positioning of the exposure map relative to
Prakken (AI 2024).

Next conceptual session: **0f — The Triads bridge and the $\perp\perp$-closure
join in $\mathsf{Art}(B)$.** Addresses the two technical questions surfaced
by round-1 review (Q1: Basaldella-Triads → Reading C formalization; Q5:
idempotence/associativity of $D_1 \vee D_2 := (D_1 \cup D_2)^{\perp\perp}$
and its interaction with delocation). Prerequisite for the Tier-2 substantive
rewrites of C3 and the exposure-map positioning. Round 2 of the literature
review can run in parallel once 0f's question set is sharp.
