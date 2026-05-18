# The Dialectical/Witnessing Interface — Instantiation, Exposure, Articulation, Witness

**Session:** 0b (Conceptual)
**Date:** 2026-05-17
**Track:** Conceptual / pre-product
**Scope:** Sub-question (i) — the instantiation operation; sub-question (iii) — first precise definitions of the exposure map, the articulation lattice, and the witnessing record. Sub-question (ii) — the announcement discipline — *scoped but deferred for implementation* (see §4 below; design is recorded, build is deferred behind the MCP/AI tools).
**Carries:** T5 (MCP/AI agent as natural consumer of generative Ludics outputs) is enforced as the closing test of every sub-part.
**Companions:**
[LUDICS_SYSTEM_ARCHITECTURE.md](../LUDICS_SYSTEM_ARCHITECTURE.md) ·
[LUDICS_GENERATIVE_SUBSTRATE.md](./LUDICS_GENERATIVE_SUBSTRATE.md) ·
[LUDICS_USEFULNESS_BRAINSTORM.md](./LUDICS_USEFULNESS_BRAINSTORM.md) ·
[COMMITMENT_SYSTEM_ARCHITECTURE.md](../COMMITMENT_SYSTEM_ARCHITECTURE.md) ·
[NCR_ISSUES_PROPOSITIONS_ARCHITECTURE.md](../NCR_ISSUES_PROPOSITIONS_ARCHITECTURE.md) ·
[ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md](../ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md) ·
[../../../packages/isonomia-mcp/src/server.ts](../../../packages/isonomia-mcp/src/server.ts)

---

## 0. Recap and frame

> **Terminological note (added post round-1 literature review).** Earlier
> drafts of this track referred to the platform's Ambler-style categorical
> argumentation layer as "ECC." That label is dropped in prose: Ambler
> (MSCS 6(2), 1996) defines a **semilattice-enriched cartesian closed
> category** (an "evidential closed category" in his terminology), which is
> unrelated to Luo's Extended Calculus of Constructions. Going forward this
> doc uses "Ambler-style evidential closed category" or "semilattice-enriched
> CCC." **Deployed MCP tool identifiers (`ecc_arrow`, `ecc_culprits`,
> `ecc_transport`, `ecc_enthymemes`, `ecc_belief_revision_proposals`) keep
> their existing names** — they are code identifiers, not theory labels, and
> renaming them is a separate engineering decision. Also: "protocol
> saturation" $\sigma(D)$ used throughout this doc is distinct from
> Fouquéré–Quatrini 2018's "saturation properties on visitable paths"; the
> two operators are unrelated.

Session 0a committed to **Reading C**: Opponent is not a participant, not a
coalition, but the *behaviour* $\sigma(D_P)^\perp$ — the bi-orthogonal closure
of the protocol-saturation of Proponent's design. Individuals do not
constitute Opponent; they **witness** moves in a pre-structured space. This
was made affordable by **T4**, the separation of the *dialectical layer*
(anonymous, position-centric, Ludics-native) from the *witnessing layer*
(attributed, person-centric, institutional). Each consumer is matched to a
layer: humans → witnessing layer (legitimacy surface); MCP/AI agents →
dialectical layer (epistemic surface).

0b is the seam between those layers. The session formalizes the *write* seam
(the instantiation operation, §1) and three *read* seams (the exposure map,
the articulation lattice, the witnessing record, §2). The announcement
discipline — would the dialectical layer ever push exposure signals *back* into
the witnessing layer — is scoped in §4 but its implementation is deferred
behind the MCP/AI tools the §2 reads define.

Three findings from the context review reshape the session up front.

- The **instantiation operation is already partly built**: `CommitmentLudicMapping`
  and `propose_warrant` are first prototypes. 0b is formalizing the discipline
  that already-shipping code should satisfy, not inventing an operation ex nihilo.
- The witnessing → dialectical promotion is **graded, not binary**. The
  NCM pipeline (Propositions → Clarification → Non-Canonical Moves → Canonical
  DialogueMoves) is the gating; the Ludics instantiation operation sits
  *downstream* of canonicalization. It is therefore *not* a gatekeeping operation
  — it operates on already-vetted dialogue acts and is purely a structural binding.
- The **articulation lattice has a known mathematical identity**: it is the
  Ludics-native presentation of an Ambler hom-set
  $\mathrm{Hom}_{\mathcal{A}_\Gamma}(A,B)$ as a join-semilattice of derivations.
  This convergence is exploited below rather than rediscovered.

---

## Part 1 — The instantiation operation

### 1.1 The setup: what pre-exists, what gets created

Reading C asserts that *the structure pre-exists the participants' acts*.
Concretely:

- Proponent's content (a set of asserted positions, formally a design $D_P$
  in the engine) determines $\sigma(D_P)$ by protocol saturation: the moves
  Proponent is structurally committed to being willing to make at each locus,
  independent of whether anyone asks.
- $\sigma(D_P)^\perp$ is the bi-orthogonal closure of $\sigma(D_P)$: the set
  of all coherent opposition designs against $D_P$. It is the *space of
  structurally possible objections*. It exists the instant Proponent's content
  does.

A participant in the witnessing layer who raises an objection is *not*
authoring a new node in this space. The node — at locus $L$, with polarity
$\downarrow$, of a specific opposition form — already existed in
$\sigma(D_P)^\perp$. The participant's act *picks out* that node. This
picking-out is what we call **instantiation** (Girard's "the design is rented
out" intuition, restated for our setting).

### 1.2 The operation, formally

Let $W$ be a canonical witnessing-layer act: a `DialogueMove` of kind
`ASSERT | CONCEDE | RETRACT | CHALLENGE | …` that has passed the NCM pipeline
and is now part of the official record. Let $\mathcal{D}_P$ be the current
dialectical-layer Ludics structure (Proponent's design and its computed
orthogonal class as of the moment $W$ enters the record).

**Definition (instantiation).** Instantiation is the partial function

$$
\iota: W \times \mathcal{D}_P \rightharpoonup \mathcal{D}_P \times \mathsf{Witness}
$$

that, given a canonical witnessing act $W$ and the current dialectical
structure $\mathcal{D}_P$, returns:

1. **A reference (not a new node)** to a move $m \in \mathcal{D}_P$ —
   specifically, $m$ is the unique element of $\sigma(D_P)^\perp$ (or of
   $\sigma(D_P)$ if $W$ is a Proponent-side concession/retraction) whose
   locus, polarity, and dialectical content match $W$ under the protocol's
   translation rules.
2. **A witness tuple** $w = (m, W, \mathrm{participant}(W), \mathrm{time}(W),
   \mathrm{source\text{-}DialogueMove\text{-}id}(W))$ in the witnessing
   record (defined precisely in §2.3).

The operation is *partial* because not every $W$ has a corresponding $m$:
a participant can speak prose that doesn't translate to any locus in the
current $\mathcal{D}_P$. That case is not a failure of $\iota$ — it is a
*signal that $\mathcal{D}_P$ needs to be extended* (delocation, in Girard's
vocabulary; or, in our terms, the move belongs to a different behaviour and
Proponent's design must grow to include the locus). Where the operation
succeeds, it is a pure binding.

### 1.3 Invariants

Four invariants. These state the discipline that `CommitmentLudicMapping` row
creation and `propose_warrant`-style writes ought to enforce.

- **(I1) Records-only on the dialectical side.** $\iota$ does not change
  $\mathcal{D}_P$ structurally. It adds no new loci, no new branches in
  $\sigma(D_P)^\perp$. The dialectical layer after instantiation has the same
  nodes and the same orthogonal class as before; only the witness layer has a
  new tuple. *Reason*: Reading C requires the space to be pre-existing. If
  $\iota$ could create new nodes, the participant would be authoring the
  dialectical structure, and we would be back at Reading A.
- **(I2) Idempotence under repeated promotion.** If the same canonical $W$ is
  presented to $\iota$ twice, the second call returns the same $(m, w)$ pair
  (modulo timestamp on $w$) without creating a second witness tuple.
  *Reason*: the witnessing record is a relation, not a multiset; two
  promotions of the same act are not two witnesses.
- **(I3) Injectivity on the Ludics side modulo locus equivalence.** Two
  distinct canonical $W_1 \neq W_2$ that resolve to the same move $m$ produce
  two distinct witness tuples $w_1, w_2$ with the same $m$ but different
  participants/times/source-ids. The Ludics move is shared; the witnesses are
  not collapsed. *Reason*: this is what makes "anonymous polarity" cohabit
  with "rich attribution" — the move is anonymous and shared, the witnesses
  are attributed and plural.
- **(I4) Totality over the canonical pipeline modulo extension.** For every
  $W$ that has been admitted as a canonical DialogueMove, *either*
  $\iota(W, \mathcal{D}_P)$ is defined, *or* $\mathcal{D}_P$ is structurally
  insufficient and must be extended (the delocation signal). No canonical $W$
  may be silently dropped by the dialectical layer; that would create a class
  of legitimate participation invisible to Ludics, violating T4's *coordinate*
  (non-hierarchical) framing.

### 1.4 Relationship to existing implementations

`CommitmentLudicMapping` ([COMMITMENT_SYSTEM_ARCHITECTURE.md](../COMMITMENT_SYSTEM_ARCHITECTURE.md))
is the existing realization at the *commitment* granularity: a `Commitment`
row (witnessing-side) is bridged to a `LudicCommitmentElement` (dialectical-side)
by an explicit mapping row. The row is the prototype of the witness tuple
$w$. The current implementation satisfies (I1) — the Ludics element pre-exists
or is created as a structural consequence of the commitment, not as a new
piece of structure — but the discipline is not made explicit, and (I2)
idempotence is currently enforced by application logic rather than by an
invariant.

**What 0b adds is the recognition that this is one instance of a more general
operation, with three other instances:**

- At the **warrant** granularity: `propose_warrant` is $\iota$ applied to an
  inference-license act. The pre-existing object is the warrant slot in the
  scheme's structure; the witnessing tuple binds the participant's articulated
  warrant text to that slot.
- At the **dialogue-move** granularity: every `DialogueMove` that translates
  into a Ludics step (via `applyToCS` and `interactCE` / `interactCEScoped`)
  is $\iota$ applied to a typed speech act. The pre-existing object is the
  corresponding move in $\sigma(D_P)$ or $\sigma(D_P)^\perp$.
- At the **promotion** granularity: the "Promote to Ludics" UX action is the
  *user-facing trigger* for $\iota$ at the commitment level.

The unification recasts these four as *the same operation at four grain
sizes*, with shared invariants. That is a refactor-level claim about the
codebase (one operation, four call sites) rather than a new feature.

### 1.5 What $\iota$ exposes to an MCP/AI consumer (T5 closer)

Three things, none of which any existing tool exposes today:

1. **A query of the form "what is $\iota(W)$?"** — given a `DialogueMove` id,
   what Ludics node does it instantiate? This is the *inverse* of the witnessing
   record (§2.3). It lets an agent that received a briefing about a dialogue
   act check what the act commits the participant to in the dialectical layer
   — which, in turn, is what's needed to predict what objections become *more*
   or *less* exposed by the act. No existing read does this.
2. **A query of the form "is there an $m$ for this $W$?"** — i.e., the
   predicate part of $\iota$'s partiality. An agent drafting a candidate
   dialogue move can ask whether the move would instantiate an existing
   Ludics node or trigger delocation. This is the *write-side* analogue of
   `find_counterarguments`: counterarguments tells you what is already
   attackable; this tells you whether your draft sits inside the current
   structure or extends it.
3. **A handle on the canonical-pipeline boundary.** Every $\iota$ call carries
   the source canonical `DialogueMove` id, so an agent can reason about the
   *provenance discipline*: which Ludics moves are backed by canonical
   witnessing acts, which are structurally implied but unwitnessed, which
   would be created by a hypothetical write. This is the substrate for an
   AI-side "fitness for Ludics" check parallel to the existing fitness scoring
   for arguments.

The MCP-side shape: a new read tool `get_instantiation(dialogueMoveId)` and
its inverse `get_witnesses(ludicMoveId)`. The latter is also the natural
reader of the witnessing record defined in §2.3.

---

## Part 2 — The three generative outputs

Each definition has the same four parts: (a) Ludics-native mathematical object,
(b) projection into existing MCP reads, (c) what is irreducible — the structure
no projection exposes, (d) candidate MCP-tool shape.

### 2.1 The exposure map

**(a) Object.** Let $D_P$ be Proponent's design and $\sigma(D_P)$ its protocol
saturation. Define $E(D_P) = \sigma(D_P)^\perp$, **stratified by the witnessing
record into three layers**:

$$
E(D_P) = E_w(D_P) \sqcup E_o(D_P) \sqcup E_\ell(D_P)
$$

where, given the current witnessing record $\mathsf{Witness}$:

- $E_w(D_P) = \{m \in \sigma(D_P)^\perp \mid \exists w \in \mathsf{Witness},\, w.m = m \}$
  — the **walked** stratum: opposition moves that have been instantiated by
  some canonical witnessing act.
- $E_o(D_P) = \{m \in \sigma(D_P)^\perp \setminus E_w \mid \mathrm{depth}(m) \leq k\}$
  for a small $k$ (e.g. 1) — the **witnessable** stratum: opposition moves
  reachable in $k$ moves from any walked move, not yet walked.
- $E_\ell(D_P) = \sigma(D_P)^\perp \setminus (E_w \cup E_o)$ — the **latent**
  stratum: the rest of the coherent-opposition space.

The map carries two further structures on top of this stratification:

- **Topology.** Hub multiplicity in $E$ (loci where many opposition moves
  converge); load-bearing exposure points (moves in $E_o \cup E_\ell$ whose
  walking would cascade through Ambler-style assumption-retraction — *the
  link to the Ambler-style evidential-closed-category algebra*); depth from
  any walked point.
- **Propagation.** For each $m \in E$, the set
  $\mathrm{Cascade}(m) \subseteq E_\ell$ of further opposition moves that
  walking $m$ would lift out of latency, computed by the Ambler §4 /
  `culpritSets()` algorithm. *Walking is a transition, not just a labeling.*

**(b) Projection.** The existing MCP reads project as follows:

| MCP tool | Projects onto |
| --- | --- |
| `find_counterarguments` | $E_w$ (a flat list) |
| `get_contested_frontier` | $E_o$ (a flat list) |
| `get_missing_moves` | a subset of $E_o \cup E_\ell$ near walked moves |
| `ecc_culprits` | the cascade structure of one $m$, viewed through assumption-retraction |
| `ecc_belief_revision_proposals` | the *advisory* version of cascade computation |

**(c) Irreducible.** The *topology* and *propagation* are irreducible to the
existing flat lists. An agent that calls all five existing tools and
concatenates their results gets a set of moves; it does *not* get hub-set
multiplicity, load-bearing ranking, or "if you walk this, these other three
lift" — those require treating $E(D_P)$ as a stratified graph, not a list.
This is the analog, at the Ludics layer, of the **topology signals** Phase 1
of the AI roadmap names ("hub set with multiplicity, load-bearing premises,
undefended-challenge list"). The exposure map is the *Ludics-native* version
of Phase 1's structural ground-truth manifest, and the same fidelity
discipline (mechanical computation, scorecard regression) should apply to its
serialization.

**(d) MCP shape.** `get_exposure_map(deliberationId, claimId?, options: {
stratifyDepth, includeCascade, includeTopology })`. Returns a stratified,
topology-annotated graph. *T5 implication*: this is the read an AI consumer
needs to do *anything* generative — drafting a candidate dialogue move,
predicting where pressure will land, recommending which thread to develop.
None of the existing tools support this combination; all the data is there,
in the engine, but unexposed.

### 2.2 The articulation lattice

**(a) Object.** Fix a position — concretely, a Ludics behaviour $B$ that the
current Proponent design $D_P$ lies in. The **articulation lattice** of the
position is

$$
\mathsf{Art}(B) = (B,\, \leq)
$$

where $B$ is the set of designs in the behaviour and $\leq$ is the
inclusion-of-loci-and-moves order ($D \leq D'$ iff $D' \supseteq D$ as a tree).
The minimal elements of $\mathsf{Art}(B)$ are the **incarnations** of $B$ —
the minimum-commitment designs that play the position. The join in
$\mathsf{Art}(B)$ corresponds to *taking the union of articulations*
(committing to more); meets, where they exist, correspond to *finding shared
minimum commitments*.

**Mathematical identity.** This is the Ludics-native presentation of an
**Ambler hom-set** $\mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B)$ viewed as a
join-semilattice of derivations
([Ambler 1996 §0.5](../ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md)).
Each design in $B$ is a *derivation* of the position $B$ represents; the
join is Ambler's $\vee$; the order is set-inclusion of derivations; minimal
elements are *selected* arrows in Ambler's sense (single canonical
derivation). **The articulation lattice is the Ludics-native shape of the
same object the Ambler-style evidential-closed-category algebra builds at the assumption-and-derivation level.**
This convergence means we are not inventing a new mathematical object; we
are aligning two unifications of the same one.

**(b) Projection.** Existing MCP coverage is thin and asymmetric:

| MCP tool | Projects onto |
| --- | --- |
| `ecc_enthymemes` | one direction: "what minimal addition would complete the current articulation" — i.e., find a $D' > D$ with strictly more moves making the inference licit |
| `ecc_arrow` | the underlying derivation data for a single direction |
| `propose_warrant` | an *editing operation* on the lattice: bind an explicit warrant to a slot, moving from one articulation to a more explicit one |

**(c) Irreducible.** The full lattice supports navigation operations no
existing tool exposes: *find minimal* (give me an incarnation), *find
equivalents* (other designs in the same $B$), *find substitutes* (a design
$D'$ in $B$ with the same conclusion-set but disjoint or smaller
premise-set), *find compressions* (the meet of two articulations
$D_1 \wedge D_2$ if it exists). These are exactly the operations a participant
or agent needs to **paraphrase a position without changing it** — to swap one
warrant for another, to drop a redundant premise, to find a less committal
version of the same point. The articulation lattice is what makes "what's the
minimum I have to commit to in order to defend this?" a computable query
rather than a craft.

**(d) MCP shape.** `get_articulation_lattice(argumentId | claimId)` returning
the lattice as a navigable structure, plus navigation operations:
`find_minimal_incarnations`, `find_equivalent_articulations`,
`find_substitute_premises(claimId, drop: claimId[])`,
`compress_articulation(argumentIds[])`. *T5 implication*: this is the surface
that makes Phase 2A (prose ↔ structure spectrum translation) and Phase 2B
(assumption surfacing) of the AI roadmap *materially better*. Today's
translation tools choose one structuring of the prose; the articulation
lattice gives them the *space of equivalent structurings* and lets them pick
the minimum-commitment one — which, per the Claude tool-feedback v2 caffeine
session, is exactly what was missing when the LLM produced a "500-word
narrative blob" because it had no notion of *what counted as the same
argument with smaller commitments*.

### 2.3 The witnessing record

**(a) Object.** A relation

$$
\mathsf{Witness} \subseteq \mathcal{D}_P \times W_{\mathrm{canonical}} \times \mathsf{Participant} \times \mathsf{Time}
$$

where each tuple $(m, W, p, t)$ records that participant $p$, by canonical
witnessing act $W$ at time $t$, instantiated Ludics move $m$. The relation is
the codomain-side of $\iota$ from Part 1, viewed as an explicit datum.

**Crucial structural property.** $\mathsf{Witness}$ is **metadata over a
pre-existing structure**, not constitutive of it. The Ludics structure
$\mathcal{D}_P$ is unchanged whether $\mathsf{Witness}$ is empty, partial, or
saturated. This realizes T4 directly: the witnessing layer's data live in
$\mathsf{Witness}$; the dialectical layer's data live in $\mathcal{D}_P$;
they are coordinate, joined only by $\iota$. *Deleting all of
$\mathsf{Witness}$ would leave a fully intact, fully analyzable dialectical
layer with the same exposure map and articulation lattices it had before.*
That is the strong form of the separation, and it is what gives the
witnessing record its character: it is *removable* in a sense the other two
outputs are not.

**(b) Projection.** Existing reads cover the *participant-keyed* direction:

| MCP tool | Projects onto |
| --- | --- |
| `get_claim_stances` | participant → claims they take stances on |
| `get_argument` (with author fields) | argument → author |
| `get_synthetic_readout` (with `topArguments` author metadata) | aggregate participation summary |

**(c) Irreducible.** The *Ludics-move-keyed* direction is new: given a move
$m$ in the dialectical layer, who walked it? When? In which canonical act?
And the inverse-of-inverse: which Ludics moves currently have *no* witnesses
— the **unwitnessed exposure** — i.e., moves in $E_o \cup E_\ell$ that no
participant has walked. The current platform can answer "which arguments has
Alice replied to"; it cannot answer "which exposure points in the current
Ludics structure have no participant attached" — because the question is
keyed by an object (a Ludics move) the MCP surface does not currently
expose.

A second irreducible structure: the **anonymous-by-default discipline**. In
the witnessing record, attribution is a *queryable property*, not a
*default field on the move*. The default rendering of a Ludics move to an
MCP agent has no participant attached; participants appear only when
explicitly queried via `get_witnesses`. This is the operational form of
Reading C: at the MCP-surface level, anonymity is the default and
attribution is a privileged read. Compare this to how `get_argument` works
today, where author identity is part of the default payload.

**(d) MCP shape.** `get_witnesses(ludicMoveId)`,
`get_unwitnessed_exposure(deliberationId, stratum: walked|witnessable|latent)`,
and an access discipline that makes participant attribution opt-in on all
dialectical-layer reads. *T5 implication*: this is the surface that lets an
MCP agent reason about the *epistemic* state of a deliberation (what
positions have been walked, by how many, with what coverage) *without*
coupling to the *attributional* state (who walked them). That decoupling is
what makes agent reasoning safe in deliberative-democracy terms — an agent
that surfaces "this position is exposed and has only been walked once" is
doing structural reasoning; an agent that surfaces "Alice walked it" is
doing attributional reasoning, which the witnessing layer governs
separately. The discipline lets the platform expose the former freely while
regulating the latter through the existing institutional layer.

---

## 3. Synthesis: the seam, restated

The session's overall picture is now sharp. The dialectical/witnessing
interface has four components:

| Component | What it is | Direction |
| --- | --- | --- |
| **The instantiation operation $\iota$** | Witnessing-act → dialectical-move binding (records-only) | Witnessing → Dialectical |
| **The exposure map** | The dialectical-layer space of coherent objection, stratified by what $\mathsf{Witness}$ records | Dialectical (consumed at the witnessing interface) |
| **The articulation lattice** | The dialectical-layer space of position-equivalents, navigable by minimum-commitment | Dialectical (consumed at the witnessing interface) |
| **The witnessing record** | The metadata relation that $\iota$ builds; the inverse query surface | Dialectical-move-keyed witnessing |

The instantiation operation is the *write seam*. The other three are *read
seams*: each is a Ludics-native first-class object that the MCP surface can
serve to agents, with the witnessing record as the join between the agent's
dialectical reads and the human-facing witnessing layer.

The architectural commitment that makes all four sit together cleanly is
**T4 + T3′ + Reading C**: the dialectical layer is anonymous and pre-existing;
the witnessing layer is attributed and constructed by participation; the seam
is a removable metadata join, not a structural identification. Take the
witnessing layer away and the dialectical layer survives; take the
dialectical layer away and the witnessing layer becomes a record of acts no
longer indexed against a structure.

---

## 4. Sub-question (ii) — the announcement discipline (designed, deferred)

The announcement discipline asks: does the dialectical layer ever *push*
exposure-map or unwitnessed-exposure signals *into* the witnessing-layer
surfaces (facilitator cockpit, equity panel, participant nudges), and if so
under what discipline? Strict Reading C parallelism would say "never";
deliberative-democracy facilitation theory says "sometimes, carefully."

**The recorded design (not yet to be built).** When announcements happen,
they should obey four constraints:

- **(A1) Structural, not attributional.** Announced facts are statements
  about the dialectical layer's structure ("this position is exposed at
  locus $L$ with depth-1 reach $k$, no canonical witness instantiates the
  objection") — not statements about *participants* ("Alice has not
  responded"). Attribution remains witnessing-layer-governed.
- **(A2) Pull-default, push-rare.** Announcements should be *available* as
  pulls from witnessing-layer surfaces (a facilitator opens the panel and
  sees the exposure map projection) before any *push* (a notification fires
  unprompted). Pushes are reserved for facilitator/equity-panel-mediated
  surfaces, never direct-to-participant by default, to keep the discipline
  from drifting into AI-nudge territory.
- **(A3) Mediated by the same canonical pipeline.** Anything announced
  must be a structural fact about $\mathcal{D}_P$ computable mechanically
  from $\sigma(D_P)$, $\sigma(D_P)^\perp$, and $\mathsf{Witness}$. No
  judgment, no recommendation, no scored ranking that an LLM has produced
  — only what the engine computes. This is the analog of the Phase 1
  fidelity-scorecard discipline for briefings.
- **(A4) Opt-in per room.** Whether a room turns on dialectical-layer
  announcements is a room-governance decision, not a platform default.
  Communities that prefer strict parallelism keep it; communities that
  want facilitator-side exposure signals turn them on. This is consistent
  with the platform's "infrastructure not policy" stance.

**Why implementation is deferred behind §2's tools.** Every announcement is,
formally, a query against the §2 read surfaces (exposure map, witnessing
record). Building announcements before the underlying reads exist would
hard-code the projection into the announcement channel and lose the ability
to recompose it. Once the §2 tools exist, an announcement is just a
scheduled or triggered call to one of them with a routing target — that is
a much smaller layer than the §2 tools themselves and is best designed
*after* their concrete shape settles. The dependency is one-way.

**Build order, therefore:** §1 invariants → §2 tools → (later, behind a
room-governance flag) the announcement discipline. The MCP/AI tools come
first because they are the substrate every announcement is a projection of.

---

## 5. The MCP-side delta this session implies

Concrete tool additions that would land 0b as engineering work:

- **Write seam**: discipline the existing `CommitmentLudicMapping`,
  `propose_warrant`, and `applyToCS` paths under the four invariants
  (I1)–(I4); no new tools.
- **Read seam — exposure**:
  `get_exposure_map(deliberationId, claimId?, opts)`; deprecate-by-superseding
  (not removing) `get_contested_frontier` and `get_missing_moves` as
  projections.
- **Read seam — articulation**:
  `get_articulation_lattice(argumentId | claimId)` + four navigation tools
  (`find_minimal_incarnations`, `find_equivalent_articulations`,
  `find_substitute_premises`, `compress_articulation`).
- **Read seam — witnessing**: `get_witnesses(ludicMoveId)`,
  `get_unwitnessed_exposure(deliberationId, stratum)`,
  `get_instantiation(dialogueMoveId)`; default-anonymous discipline on
  dialectical reads.

These are the **first Ludics-native MCP reads** — today's 29 tools cover
dialogue, ASPIC+, AIF, and Ambler-style evidential closed categories with no direct Ludics surface. The Phase 1
fidelity scorecard discipline from the AI roadmap should apply: each of
these reads needs a mechanically computable structural manifest and a
regression harness, since agent briefings and writes will compose them.

---

## 6. What's left

- **(ii) Announcement discipline** — *designed in §4, build deferred*.
  Re-open after the §2 tools ship and stabilize.
- **0c — Open behaviours.** Treated $B$ in §2.2 as fixed. In a live
  deliberation, behaviours are open; the lattice grows. What is the right
  notion of an "open articulation lattice" — one that respects the fact
  that new loci and new participants can change membership in $B$?
- **0d — Composition algebra.** When two deliberations join (a
  sub-deliberation resolves into a parent, or a cross-context transport
  happens), how do the three outputs compose? This is where the Ambler
  hom-set identity for $\mathsf{Art}$ becomes especially powerful —
  composition of articulation lattices ought to inherit from composition of
  Ambler arrows.
- **0e — Joint saturation.** T4 makes this tractable in a way it wasn't
  pre-Reading-C. With instantiation as the seam, joint saturation becomes
  the closure of $\sigma$ over *all* participants' dialectical-layer
  contributions, treating their acts as instantiations into a shared
  structure rather than as the merging of distinct designs.

---

## Status

Session 0b produced (a) a formal definition of the instantiation operation
$\iota$ with four invariants (I1)–(I4), unifying four existing call sites
(`CommitmentLudicMapping`, `propose_warrant`, `applyToCS` dialogue translation,
the "Promote to Ludics" UX trigger) under one discipline; (b) precise
first-pass definitions of the exposure map, articulation lattice, and
witnessing record, each with a Ludics-native mathematical object, projection
laws into existing MCP reads, an irreducible-structure account, and a
candidate MCP tool shape; (c) recognition that the articulation lattice is
the Ludics-native presentation of an Ambler hom-set, aligning the conceptual
track with the Ambler-style evidential-closed-category algebra roadmap; (d) a scoped-but-deferred design of the
announcement discipline (§4) with four constraints (A1)–(A4) and an explicit
build order putting the §2 MCP tools first.

Next sessions: **0c (open behaviours), 0d (composition algebra), 0e (joint
saturation).** Announcement-discipline implementation re-opens after §2
tools ship.
