# The Dialectical/Witnessing Interface — Instantiation, Exposure, Articulation, Witness

> **Post-review status (CORRECTED post-2e/2f, 2026-05-21).** The articulation-lattice section of this doc (§2) and the Ambler-hom-set identification of §2.2 (C3) were authored under the working assumption that $\mathsf{Inc}(B)$ is a join-semilattice with unique bottom `|B|`. The Phase 2e OQ-JSL proof refuted that assumption: $\mathsf{Inc}(B)$ is an **antichain**, $(B, \leq_\subseteq)$ decomposes into **disjoint cones** $\{C_i\}$, $\vee_{\perp\perp}$ is well-defined only **within a cone** and there equals literal chronicle-set union (Phase 2f Reading A; Daimon Lock Lemma). Phrases like "the bottom $|B|$", "$\mathsf{Inc}(B)$ as a join-semilattice with bottom $|B|$", and "the least derivation of $B$" in this doc should be read with the per-cone reframe in mind. Authoritative status:
>
> - [LUDICS_CONSOLIDATION_AND_DEV_READINESS.md](./LUDICS_CONSOLIDATION_AND_DEV_READINESS.md) § claims register (C1, C3, N-C23 rows)
> - [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md) for the refutation + per-cone reframe
> - [LUDICS_ORDER_RELATION_DEFINITION.md](./LUDICS_ORDER_RELATION_DEFINITION.md) for the within-cone join definition
> - [LUDICS_SESSION_1_DEV_SPEC.md](./LUDICS_SESSION_1_DEV_SPEC.md) (post-review-corrected) for the dev-layer consequences

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

> **Positioning note (Singh dual direction).** The closest pre-existing
> semantics for these invariants is Singh's social-commitment relation
> $C(\mathrm{debtor}, \mathrm{creditor}, \mathrm{antecedent},
> \mathrm{consequent})$ (1999 *AI & Law* 7; 2000 IJCAI ACL workshop), which
> creates a *new* commitment state from an attributed speech act
> (`create` / `cancel` / `release` / `discharge` / `assign` / `delegate`).
> $\iota$ runs in the **opposite direction**: an attributed canonical
> witnessing act binds *to a pre-existing* anonymous Ludics move, leaving
> the dialectical state structurally unchanged (I1 records-only). Singh:
> attributed-act → attributed-new-state. $\iota$: attributed-act →
> pre-existing-anonymous-state, with a new witness tuple on the side. The
> two patterns share the four-place act/state shape but compose oppositely;
> neither subsumes the other.

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

**Positioning relative to existing structured-argumentation work.** The
closest pre-existing analog is **Prakken (2024), "An abstract and structured
account of dialectical argument strength," *Artificial Intelligence* 335:
104193**, which defines argument strength via the set of *possible*
successful attacks across expansions of an AF — counterfactual attackers
that *could be added*, irrespective of whether anyone utters them — and
instantiates this in ASPIC+. Prakken-2024 is the only existing
structural-objection-space construct in the structured-argumentation
tradition with the right shape; vanilla ASPIC+/Dung labelling and Caminada
discussion-games are post-hoc bookkeeping over already-generated attack
graphs (Baroni–Caminada–Giacomin, KER 2011) and are *not* the right point
of comparison. The exposure map differs from Prakken-2024 in two specific
ways: **(i) participant-access stratification.** Prakken-2024 is binary
(an attacker either is in some expansion or is not). The walked /
witnessable / latent stratification adds an access modality that splits
the "could be added" set by *whether the deliberation has accessed it yet*.
**(ii) Ludics-internal generator.** Prakken-2024 parametrizes expansions
by a base rule set (ASPIC+ axioms plus orderings); the exposure map
parametrizes by a Ludics design $D_P$ and computes $\sigma(D_P)^\perp$
directly from the protocol semantics. The right framing for C8 is
therefore "exposure map *generalizes* Prakken-2024 with a participant-
access axis," not "exposure map *has no analog* in ASPIC+"; the latter is
true at the vanilla-labelling level but elides the closer construct.

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

**N-C24 (Round 2, original-to-track).** The Phase 3 briefing-fingerprint
mechanism described in the AI roadmap — a content hash over a *partial
region* of this map (targeted-region nodes + statuses + direct neighbours
+ open-CQ set) used for optimistic concurrency, with a 5-rule
domain-specific "material change" taxonomy — combines three features not
found jointly in prior art: (i) content-hashing over a partial graph
region rather than the full resource; (ii) optimistic concurrency gated
by that hash; (iii) domain-specific change classification rather than
structural-only conflict detection. Closest priors: Bisquert, Cayrol,
Dupin de Saint-Cyr & Lagasquie-Schiex (*Characterizing change in abstract
argumentation systems*, hal-02875531) for change typology; Almeida
(arXiv:2310.18220, 2023) for the CRDT survey. Neither combines these
three.

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
\mathsf{Art}(B) \;:=\; \bigl(\mathsf{Inc}(B),\; \leq,\; \vee_{\perp\perp}\bigr)
$$

where:

- $\mathsf{Inc}(B) := \{D \in B : D^{\perp\perp} = D\}$ is the set of
  **incarnations** in $B$ — the $\perp\perp$-fixed designs, equivalently
  the canonical representatives of $\sim_{\perp\perp}$ equivalence classes
  of designs in $B$;
- $\leq$ is the inclusion-of-loci-and-moves order ($D \leq D'$ iff
  $D' \supseteq D$ as a tree);
- the join is the **bi-orthogonal closure of the union**,

  $$ D_1 \vee_{\perp\perp} D_2 \;:=\; (D_1 \cup D_2)^{\perp\perp}, $$

  which is the smallest behaviour-closed design containing both $D_1$ and
  $D_2$ (set-theoretic $D_1 \cup D_2$ is not generally a design and
  generally not in $B$; the $\perp\perp$-closure is the standard Ludics
  fix). Informally: "taking the union of articulations, closed under
  whatever the protocol forces."

The minimum-commitment design in $\mathsf{Inc}(B)$ — when it exists — is
Girard's **incarnation** $|B|$. Substrate behaviours $B = \sigma(D_P)^\perp$
are principal by construction, so $|B|$ exists and is the bottom of
$\mathsf{Art}(B)$. Meets, where they exist, correspond to *finding shared
minimum commitments*. See
[LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md §II](./LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md)
for the four algebraic checks (idempotence, associativity, bottom, delocation
compatibility).

> **Note on the restriction to $\mathsf{Inc}(B)$.** Earlier drafts of this
> section took the carrier to be all of $B$ with join given by set-union.
> Both choices are wrong: $\cup$ is not the join in Ludics (the closure
> step is needed), and idempotence of $\vee_{\perp\perp}$ fails on
> non-incarnation designs (where $D^{\perp\perp} \supsetneq D$).
> Restricting to incarnations — equivalently, quotienting $B$ by
> $\sim_{\perp\perp}$ and choosing canonical representatives — recovers
> idempotence and is what the substrate has implicitly been computing
> when it says "the minimum-commitment design that plays the position."

> **R-C1 (Round 2 upgrade: confirmed-with-caveat).** The
> inclusion-ordered structure on incarnations ($\mathrm{Inc}(B)$,
> $\leq_\subseteq$) matches published ludics: Fouqueré & Quatrini
> (LMCS 9(4:6), 16 Oct 2013; DOI 10.2168/LMCS-9(4:6)2013) establish
> the incarnation inclusion-poset and characterise incarnation as
> “the smallest design included in $\mathfrak{D}$ and belonging to
> $\mathbf{E}$”; Doumane (*Inductive and Functional Types in Ludics*,
> CSL 2017) confirms $\perp\perp$-closure semantics on
> behaviour-unions. The named triple
> $\mathrm{Art}(B) = (\mathrm{Inc}(B), \leq_\subseteq,
> \vee_{\perp\perp})$ as a unified algebraic assemblage is the
> substrate’s specific contribution; neither cited paper names or
> uses this binary join restricted to $\mathrm{Inc}(B)$ as a primary
> construct.

**Mathematical identity (proposed).** We *propose a structural
identification* of $\mathsf{Art}(B)$ with the **Ambler hom-set**
$\mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B)$ viewed as a join-semilattice of
derivations ([Ambler 1996 §0.5](../ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md)).
The correspondence sends:

- incarnations $D \in \mathsf{Inc}(B)$ to **selected arrows** in Ambler's
  sense (canonical derivations);
- the $\perp\perp$-closure join $\vee_{\perp\perp}$ to Ambler's $\vee$
  (semilattice join on derivations);
- the inclusion order $\leq$ to Ambler's derivation-extension order;
- the bottom $|B|$ to Ambler's least derivation of $B$ at that arrow.

**This identification is original to this conceptual track.** Girard 2001 +
Fouquéré–Quatrini 2013 (the Ludics side) and Ambler 1996 (the
semilattice-enriched-CCC side) are disjoint citation communities; no
published theorem bridges them. The two halves of the identification are
each well-attested in their own literature, but the bridge itself is a
working hypothesis. Round 1 of the literature review classified C3 as a
*single-source structural identification* on this basis (see
[LITERATURE_REVIEW_ROUND_1.md Appendix A](./LITERATURE_REVIEW_ROUND_1.md)).

Two caveats on the identification:

- **Confidence-erasure.** Ambler's hom-sets carry Dempster–Shafer
  confidence weights on derivations; the Ludics side does not. The
  identification holds at best *after* applying a forgetful functor from
  the Ambler category to a Ludics-style category that erases the
  confidence structure. The functor is written down in Session 0g §II; see
  [LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md §II](./LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md).
- **Single-source bridge.** The platform's deployed Ambler-style algebra
  (the `ecc_*` MCP tools) and the proposed Ludics-native articulation
  lattice reads (`get_articulation_lattice` and friends) are *aligned by
  this identification*. If the identification fails on inspection, the
  two stacks remain individually well-defined but the substrate loses one
  of its main unification claims; the algebraic surfaces would have to be
  presented as parallel rather than as two presentations of the same
  object.

The payoff of the identification, if it holds, is that we are *not*
inventing a new mathematical object: we are aligning two unifications of
the same one, which is what licenses the substrate's design choice to
deploy `ecc_*` and `get_articulation_lattice` as views over a single
underlying structure rather than as competing abstractions.

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

**(d) MCP shape.** `get_articulation_lattice(argumentId | claimId, options:
{ representatives: "incarnations" | "raw" })` returning the lattice as a
navigable structure. The default `representatives: "incarnations"` returns
$\mathsf{Inc}(B)$ as a poset of canonical representatives; `raw` returns
the full $B$ with $\sim_{\perp\perp}$ equivalence classes annotated (load-
bearing for an AI consumer that wants to reason about the algebraic
structure rather than just navigate it). Plus navigation operations:
`find_minimal_incarnations`, `find_equivalent_articulations`,
`find_substitute_premises(claimId, drop: claimId[])`,
`compress_articulation(argumentIds[])`, and
`compute_articulation_join(designIds[])` returning the
$\vee_{\perp\perp}$ of the supplied designs as a named incarnation in
$\mathsf{Inc}(B)$ — the formal counterpart to "combine articulations A and
B" that an LLM drafting a synthesis move would otherwise have to guess.
*T5 implication*: this is the surface
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
**Protocol grounding (Round 2, Q7 closed).** The MCP protocol is
specified as a JSON-RPC client-server architecture with
name/description/input-schema tool triples (Anthropic, November 2024;
donated to the Agentic AI Foundation (AAIF), a directed fund under the
Linux Foundation, 9 December 2025). MCPToolBench++ (arXiv:2508.07575,
2025) benchmarks tool-use across many domains; no argumentation-query
interface at Ludics-native grain exists in that benchmark or in any
2024–2025 MCP paper surveyed (Round 2 Q7 confirmed original-to-track).
The ∼14-tool surface above is the only proposed argumentation-specific
MCP schema at this specificity.
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
