# Open Behaviours, Composition Algebra, and Joint Saturation — Time, Joining, and Closure for the Generative Substrate

> **Post-review status (CORRECTED post-2e/2f, 2026-05-21).** The composition-algebra (0d) and joint-saturation (0e) sections assume the C1/C3 framing in which both sides of the bridge are join-semilattices of derivations. Per the Phase 2e OQ-JSL proof, the substrate-side $\mathsf{Inc}(B)$ is an antichain, not a JSL; the JSL structure lives **per cone** $C_i$ where $\vee$ = literal chronicle-set union (Phase 2f Reading A). The convolution / joint-saturation arguments therefore decompose along the cone partition rather than over a single global lattice. See [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md), the **OQ-JSL-Ambler** entry in [LUDICS_CONSOLIDATION_AND_DEV_READINESS.md](./LUDICS_CONSOLIDATION_AND_DEV_READINESS.md), and [LUDICS_ORDER_RELATION_DEFINITION.md](./LUDICS_ORDER_RELATION_DEFINITION.md) for the cone-decomposed normative form.

**Sessions:** 0c, 0d, 0e (Conceptual)
**Date:** 2026-05-17
**Track:** Conceptual / pre-product
**Scope:** Three follow-on sessions to the 0b dialectical/witnessing interface formalization. 0c opens the behaviour $B$ in time; 0d gives the algebra of composing two dialectical structures; 0e specializes Girard's joint saturation to the post-Reading-C setting where there is one shared Proponent design and many instantiating witnesses.
**Carries:** T5 (MCP/AI agent as natural consumer) is enforced as the closing test of each session.
**Companions:**
[LUDICS_SYSTEM_ARCHITECTURE.md](../LUDICS_SYSTEM_ARCHITECTURE.md) ·
[LUDICS_GENERATIVE_SUBSTRATE.md](./LUDICS_GENERATIVE_SUBSTRATE.md) ·
[LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md](./LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) ·
[LUDICS_USEFULNESS_BRAINSTORM.md](./LUDICS_USEFULNESS_BRAINSTORM.md) ·
[COMMITMENT_SYSTEM_ARCHITECTURE.md](../COMMITMENT_SYSTEM_ARCHITECTURE.md) ·
[ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md](../ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md) ·
[AIF_ONTOLOGY_SYSTEM_ARCHITECTURE.md](../AIF_ONTOLOGY_SYSTEM_ARCHITECTURE.md) ·
[../../../packages/isonomia-mcp/src/server.ts](../../../packages/isonomia-mcp/src/server.ts)

---

# Session 0c — Open behaviours

**Frame.** Session 0b §2.2 took a behaviour $B$ as fixed and built the
articulation lattice $\mathsf{Art}(B) = (B, \leq)$ over it. That fixity is
a *theoretical* assumption inherited from Girard's setting, where designs
are exhibited against a determinate behaviour and orthogonality is computed
once. In a live deliberation it is *false* in two specific ways. First,
$B$'s **carrier set grows**: new participants surface new articulations of
the same position, new claims become available as premises, new loci are
created when delocation extends the design. Second, $B$'s **defining
orthogonality moves**: as Proponent's design $D_P$ acquires structure (new
commitments, retractions, warrant promotions), $\sigma(D_P)$ shifts,
$\sigma(D_P)^\perp$ shifts, and the behaviour "the position $D_P$ inhabits"
gets a different membership. Both effects are *normal operating mode*, not
edge cases.

## 0c.1 What "open" actually means here

Three levels of openness, ordered by how disruptive they are.

- **Open carrier (extensional growth).** New designs $D'$ join an existing
  $B$ — same orthogonality class, more articulations available. The lattice
  $(B, \leq)$ gains elements but its order is preserved on the old elements.
  *Cheap*: pure monotone growth.
- **Open loci (delocational growth).** A canonical witnessing act $W$
  arrives that has no $m \in \mathcal{D}_P$ for $\iota(W, \mathcal{D}_P)$ to
  bind to. Invariant (I4) from 0b §1.3 fires: $\mathcal{D}_P$ extends to
  admit the locus, $\sigma(D_P)$ recomputes, $\sigma(D_P)^\perp$ recomputes.
  The behaviour structure changes; old designs that were in $B$ may now be
  in a strictly larger or finer $B'$. *Medium*: monotone in loci, possibly
  non-monotone in membership.
- **Open orthogonality (intensional drift).** Proponent retracts a
  commitment, or a warrant gets promoted that re-licenses an inference. The
  defining computation of $\sigma(D_P)^\perp$ changes its rules, not just
  its inputs. Designs that *were* in $B$ may now sit outside it; designs
  that *weren't* may now be in. *Expensive*: non-monotone in membership;
  the lattice can lose elements as well as gain them.

The platform sees all three constantly. NCM admissions produce open-carrier
and open-loci moves; commitment retractions and `propose_warrant`
promotions produce open-orthogonality moves.

## 0c.2 The right modification — directed system, not snapshot

The natural shape: instead of a single $\mathsf{Art}(B)$, work with the
**directed system** $\{\mathsf{Art}(B_t)\}_{t \in T}$ indexed by
deliberation time, with **transition maps**
$\phi_{t,t'}: \mathsf{Art}(B_t) \to \mathsf{Art}(B_{t'})$ that are *partial
functions* (because of open-orthogonality drift) rather than total
embeddings. The colimit $\varinjlim \mathsf{Art}(B_t)$ is *not* the right
object — it would average over drift, smearing the live structure. The
right object is **the current $\mathsf{Art}(B_t)$ together with the recent
transition map and a record of which elements were lost**.

This is the Ludics-native rendering of what software calls a *materialized
view with change-data-capture*: hold the current lattice, hold the diff
stream against it, expose both.

Three new derived objects fall out:

- **Stable core**: $\bigcap_{t' \geq t_0} B_{t'}$ for some recent window —
  articulations that have survived all recent drift. These are the *robust*
  incarnations of the position.
- **Fragile membership**:
  $\{D \in B_t \mid \exists \text{ recent } t' < t,\, D \notin B_{t'}\}$ —
  articulations that have recently *gained* membership due to a Proponent
  move. These are sensitive to retraction.
- **Lost articulations**: $\bigcup_{t' < t} B_{t'} \setminus B_t$ —
  articulations that *used to* play the position and no longer do. Not
  garbage: a record of how the position has changed shape.

## 0c.3 Interaction with the exposure map

The exposure map $E(D_P) = E_w \sqcup E_o \sqcup E_\ell$ from 0b §2.1 is
*itself* time-indexed via $D_P$. Openness propagates: when $\mathcal{D}_P$
delocates, the carrier of $E$ grows; when orthogonality drifts, the
stratification can re-assign — a move that was *walked* in $E_w(B_t)$ can
become *latent* in $E_\ell(B_{t'})$ if the locus it answered has been
retracted. This is fine and informative: the witnessing record
$\mathsf{Witness}$ retains the historical fact that the move was walked,
but the current dialectical layer no longer needs that response. Surfacing
this is essentially a *fossil-record* read: "you walked this objection, but
the position has since shifted so the objection no longer applies — would
you like to re-articulate against the current position?"

**Closest pre-existing analog.** The deployed **warrant-mcp** server
(jayden-chmod, glama.ai, 2025–2026) exposes Prakken-style `retract` as one
move in `dialogue_move`: an attributed speech act removes the commitment
from the active store while preserving the original `claim φ` and the
following `retract φ` in the transcript. The fossil-record read is a
structural superset of that pattern along two axes. **(i) Locus back-pointer.**
Prakken-`retract` records the speech act but does not tag the retracted
move with a back-pointer to the specific Ludics locus it was answering;
the witnessing tuple in $\mathsf{Witness}$ does (the $m$ field). **(ii)
"No longer applies to current $D_P$" flag.** Prakken-`retract` removes the
commitment but does not surface the dialectical fact that *the locus the
objection answered has itself moved*; the fossil-record read computes this
as $w.m \notin \sigma(D_P)^\perp$ at the current $t$. The broader
argumentation-dynamics literature (Cayrol–de Saint-Cyr–Lagasquie-Schiex,
JAIR 2010; Baumann 2012; Baumann–Gabbay–Rodrigues, AAAI 2020 "Forgetting
an argument") is forward-only: contraction produces a new framework and
does not preserve the contracted argument in an attribution layer flagged
as fossil. The fossil-record read is therefore best framed as
"Prakken-`retract` with a Ludics-locus back-pointer plus a current-$D_P$
relevance flag," not as a new construct from scratch.

## 0c.4 T5 closer — what an open lattice exposes that a fixed one cannot

Three irreducible MCP-side reads.

- `get_articulation_drift(claimId, sinceTimestamp)` — returns the diff of
  $\mathsf{Art}(B_t)$ against an earlier snapshot, broken into
  gained/lost/stable. An agent drafting a position-paraphrase needs to know
  which articulations are stable enough to recommend versus which are
  drift-fragile.
- `get_open_arity(claimId, locus)` — flags loci where the position is
  *currently underspecified* (multiple incompatible articulations in $B_t$
  at that locus). This is the dialectical-layer signal of a *generative
  invitation*: "Proponent's position is open here; either Proponent should
  resolve it, or this is a place where productive elaboration would land."
- `get_fossil_witnesses(deliberationId)` — projects $\mathsf{Witness}$
  against the *current* $E(D_P)$ and returns walked moves whose targets are
  no longer in $\sigma(D_P)^\perp$. The MCP-side hook for the fossil-record
  nudge described in §0c.3.

None of these are computable from the 0b read tools alone — they require
the time-indexed view. Openness adds *one* axis (time), but that axis is
the one that turns a static analytic surface into a *live* generative
substrate.

---

# Session 0d — The composition algebra

> **Terminological note.** Below, mentions of "Ambler-style" or
> "semilattice-enriched" categorical structure refer to Ambler (MSCS 6(2),
> 1996). Earlier drafts called this "ECC"; that label is dropped (it
> collides with Luo's Extended Calculus of Constructions, an unrelated
> dependent type theory). Deployed MCP tool names (`ecc_transport`, etc.)
> keep their existing identifiers — prose-level renaming does not propagate
> to the codebase.

**Frame.** Three composition events happen routinely on the platform: a
**sub-deliberation resolves into a parent** (the SubDeliberation system); a
**claim is transported across contexts** (`ecc_transport`); and **two
deliberations merge** by fiat (federation, cross-room argument import). In
each, two dialectical-layer structures $\mathcal{D}_1, \mathcal{D}_2$
combine into one $\mathcal{D}$. The session asks: how do the three
generative outputs from 0b — exposure map, articulation lattice, witnessing
record — compose? The Ambler hom-set identity for $\mathsf{Art}$ from 0b
§2.2 makes this much more tractable than it would otherwise be: composition
of articulation lattices ought to *inherit* from composition of Ambler
arrows.

## 0d.1 Three composition operators

- **Subordination** $\mathcal{D}_{\text{sub}} \triangleright \mathcal{D}_{\text{par}}$ —
  a child deliberation closes and its conclusion lands as a commitment in
  the parent. Asymmetric: the child contributes a *single* resolved
  articulation to the parent's behaviour space, but the parent's structure
  is unchanged elsewhere.
- **Transport** $\mathcal{D}_1 \xrightarrow{f} \mathcal{D}_2$ — a claim and
  its surrounding structure move from context 1 to context 2 along a
  translation $f$. The `ecc_transport` MCP tool does the assumption-set
  rewriting; what 0d adds is treating $f$ as an operation between *whole*
  dialectical structures, not just isolated arrows.
- **Federation** $\mathcal{D}_1 \otimes \mathcal{D}_2$ — two independent
  deliberations on overlapping content are joined. Symmetric. The hardest
  case.

## 0d.2 What composition preserves

Reading the operators through the four 0b components:

### The instantiation operation $\iota$

$\iota$ composes **trivially** under all three operators *as long as the
canonical NCM pipeline is shared*: the composed structure $\mathcal{D}$
has $\iota_\mathcal{D}$ defined by case analysis on which sub-structure
each canonical $W$ originated in. This is a content-free claim — it just
says "metadata joins disjointly when its underlying acts join disjointly."
Where the NCM pipelines differ (federation across rooms with different
canonicalization conventions), $\iota$ requires a *bridge*: an explicit map
between the two canonical vocabularies, which is the same shape of object
as `ecc_transport`'s assumption-mapping.

### The exposure map

Subordination: $E(\mathcal{D}_{\text{par}})$ gains the *cascade* effect of
the child's resolved articulation but does not gain new loci unless the
resolution touched the parent's structure. Cheap.

Transport: $E(\mathcal{D}_2)$ acquires the image $f(E(\mathcal{D}_1))$,
modulated by the contextual structure already in $\mathcal{D}_2$. Some
walked moves in $E_w(\mathcal{D}_1)$ may land in $E_\ell(\mathcal{D}_2)$ if
$\mathcal{D}_2$'s existing structure already settles them, and vice versa.
The transported exposure map *re-stratifies* against the destination's
witnessing record. This is exactly the discipline the Ambler-style
transport already enforces at the assumption level, lifted to the locus
level.

Federation: $E(\mathcal{D}_1 \otimes \mathcal{D}_2)$ is **not**
$E(\mathcal{D}_1) \cup E(\mathcal{D}_2)$. Joining can *destroy* exposure
(a position exposed in $\mathcal{D}_1$ at locus $L$ may be defended in
$\mathcal{D}_2$ by structure that didn't exist in either alone) and can
*create* exposure (the join opens loci that neither side touched). The
computation is essentially $\sigma(D_{P,1} \otimes D_{P,2})^\perp$, which
is *not* a sum of orthogonals. **Composition of exposure maps is non-trivial
and requires re-running saturation on the join.**

### The articulation lattice

The Ambler identity pays off here. Sub-deliberation closure produces a
*vertical composition* of Ambler arrows: the child's articulations compose
with the parent's. The Ambler hom-set $\mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B)$
composes associatively with $\mathrm{Hom}_{\mathcal{A}_\Gamma}(B, C)$ via
the standard derivation-pasting operation. In Ludics terms: a minimal
incarnation of the child becomes a *premise-component* in the minimal
incarnations of the parent that consume the child's conclusion. The
articulation lattice of the composite is built by **convolving** the two
component lattices through the shared interface, a construction that was
assumed well-defined because both sides are join-semilattices of derivations.

> **Phase 2e caveat (C1 corrected).** $(\mathsf{Inc}(B), \leq_\subseteq,
> \vee_{\perp\perp})$ is not a JSL — $\mathsf{Inc}(B)$ is an antichain and
> $(B, \leq_\subseteq)$ decomposes into disjoint cones. The convolution
> construction above assumes a single JSL across all incarnations; under the
> corrected picture it is per-cone. Whether per-cone convolution still supports
> the cross-room Plexus transport use case is open (**OQ-JSL-Ambler**).
> See `LUDICS_OQ_JSL_PROOF.md` §7.

Transport: $f$ induces a *lax functor* between articulation lattices (lax
because some equivalences in the source need not survive the rewrite).
This is the standard semilattice-enriched-category story: transport preserves selected arrows, may
break equivalence between non-selected ones.

Federation: the lattice for $D_{P,1} \otimes D_{P,2}$ contains
$\mathsf{Art}(B_1)$ and $\mathsf{Art}(B_2)$ as *sublattices*, plus
*cross-articulations* using premises from one side and conclusions from
the other. The cross-articulations are new and can be many; computing
them is the same shape as a database join.

### The witnessing record

$\mathsf{Witness}$ composes by **disjoint union with reconciliation**:
tuples whose source canonical $W$ comes from different originals are kept
separately; tuples whose Ludics-side target moves get identified by the
composition's locus-equivalence are *deduplicated* (same $m$, two
witnesses → one $m$, two witnesses). This is exactly (I3) injectivity from
0b §1.3 applied across the composition seam. **No information is lost in
any of the three operators**; reconciliation is structural, not semantic.

## 0d.3 T5 closer — composition as an MCP surface

Three MCP reads, each backed by the analysis above:

- `transport_articulation_lattice(claimId, fromContext, toContext)` —
  explicit, lax-functor-shaped. Returns the destination lattice with which
  equivalences survived transport flagged.
- `compose_exposure_maps(deliberationIds[])` — re-runs saturation on the
  join. *Expensive*, so this is a precomputed-with-staleness-flag read,
  not a hot path.
- `subordinate_articulation(childDelibId, parentDelibId, resolvedClaimId)` —
  performs the vertical-composition convolution, returning the updated
  parent lattice with the child's incarnations folded in as
  premise-components.

The composition algebra is the surface that lets an MCP agent reason about
*the platform as a whole* rather than one room at a time. None of today's
29 tools reach beyond a single deliberation; even `get_cross_context` is a
same-claim cross-room query, not a structural composition. 0d is what
makes "what does this position look like when it travels?" a structural
read rather than a heuristic.

---

# Session 0e — Joint saturation in a multi-agent setting

**Frame.** Joint saturation was the historically hard problem in classical
Ludics with multiple Proponents: each had a design, each had a
$\sigma$-closure, and merging them required treating each as a peer
Proponent — which produced incoherent orthogonality computations and
forced commitments like "the joint design is the cut of all individuals,"
which was both technically ugly and politically wrong. T4 + Reading C
dissolves the problem: there is **one** Proponent design $D_P$ at any
time, and participants' contributions are *instantiations into* $D_P$ via
$\iota$, not separate designs to be merged. Joint saturation in this
setting is the closure of $\sigma$ over the *shared* dialectical
structure, computed once.

## 0e.1 What joint saturation is, post-Reading-C

Let $\mathcal{P}$ be the set of participants and let
$\{W_p\}_{p \in \mathcal{P}, t \leq T}$ be the canonical witnessing acts
they have contributed by time $T$. Each $W_p$ has, via $\iota$, a binding
to some $m \in \mathcal{D}_P$. Joint saturation is:

$$
\sigma_{\mathrm{joint}}(D_P, \mathsf{Witness}) = \sigma\bigl(D_P\bigr) \cup \mathrm{Reach}\bigl(\{m \mid \exists w \in \mathsf{Witness},\, w.m = m \}\bigr)
$$

where $\mathrm{Reach}$ is the protocol's forward-closure operator on a set
of moves: every move structurally entailed by Proponent's design *plus*
every move structurally entailed by the participation already recorded.
The second term is **what the participants have collectively forced into
the dialectical structure** — not new claims (Reading C: participants
don't author the structure), but *commitments to consequences* that follow
from the witnessing acts already in the record. If three participants
walked move $m$ and $m$'s saturation reaches $m'$, then $m'$ is jointly
saturated even if no one walked $m'$ directly.

This is the operator that turns "what has Proponent committed to" into
"what has Proponent + the participation collectively committed to." It is
single-valued — there is no merging of incompatible Proponent designs,
because there *is* only one Proponent design.

## 0e.2 Three properties

- **(J1) Reading C preserved.** $\sigma_{\mathrm{joint}}$ adds no
  participant-attributable structure to $\mathcal{D}_P$; it only adds
  *consequences* of participation that are computable from the protocol
  rules. The added moves are anonymous in exactly the same sense as
  $\sigma(D_P)$'s original moves.
- **(J2) Monotone in $\mathsf{Witness}$.** Adding a witness tuple
  monotonically grows $\sigma_{\mathrm{joint}}$. Removing one shrinks it.
  There is no "averaging" or "voting" — joint saturation is *not* an
  aggregation. It is a closure under the protocol rules of the union of
  starting points.
- **(J3) Distributes over the §0d composition operators (mostly).**
  $\sigma_{\mathrm{joint}}$ commutes with subordination (the child's joint
  saturation feeds into the parent's). It commutes laxly with transport
  (some reach-edges don't survive $f$). It does *not* commute with
  federation in general, for the same reason exposure-map federation
  doesn't: the joined design has its own saturation, computed from scratch.

## 0e.3 What changes about the three 0b outputs

Joint saturation gives a **richer Proponent side** of the orthogonality
computation. Therefore:

- The exposure map's "Proponent half" $\sigma(D_P)$ grows under
  $\sigma_{\mathrm{joint}}$. This *shrinks* $\sigma(D_P)^\perp$ (more
  Proponent commitments → fewer coherent oppositions). The walked stratum
  $E_w$ stays put (those moves were instantiated). The witnessable and
  latent strata $E_o, E_\ell$ can shrink, sometimes dramatically — joint
  saturation is the formal account of *how participation closes off
  objection space*. An exposure point in $E_\ell$ at $t_0$ may not be in
  $\sigma(D_P)^\perp$ at all by $t_1$ because the participation in between
  has forced its negation into $\sigma_{\mathrm{joint}}$. This is what it
  *looks like*, formally, for a deliberation to *make progress*: the
  latent stratum drains as joint saturation grows.
- The articulation lattice $\mathsf{Art}(B)$ gains *forced articulations*:
  positions that are now in $B$ purely because joint saturation has
  implied them. These are the **collectively forced incarnations** — the
  minimum commitments any agent who accepts the participation-record must
  accept, by closure.
- The witnessing record gains a derived view: the set of moves in
  $\sigma_{\mathrm{joint}} \setminus \sigma(D_P)$ are *participation-forced*
  moves; their "witnesses" are the *set* of canonical acts whose closure
  forced them, not a single $W$.

## 0e.4 T5 closer — the read no other tool can serve

`get_joint_saturation(deliberationId, opts: { includeForced, includeDrain })`:

- Returns $\sigma_{\mathrm{joint}}(D_P, \mathsf{Witness})$ as a set of
  Ludics moves, with each tagged as direct (in $\sigma(D_P)$), instantiated
  (in $E_w$), or forced (in $\sigma_{\mathrm{joint}} \setminus \sigma(D_P)$).
- With `includeForced`: for each forced move, the set of canonical
  witnessing acts whose closure entails it (a many-to-one inverse of the
  closure operator).
- With `includeDrain`: the diff $E_\ell$-at-$t_0$ minus $E_\ell$-at-now,
  i.e., the latent-stratum moves *eliminated* by participation in the
  window — the formal version of "what has the deliberation actually
  settled."

This is the read that lets an MCP agent answer the question every
facilitator wants to ask and no current tool can serve mechanically:
**"what has the participation actually pinned down, beyond what Proponent
originally committed to?"** It is the substrate for a
fidelity-scorecard-disciplined briefing along the lines of *"this
deliberation began with $|E_\ell| = 412$ latent objections; participation
since has drained 87 of them via joint-saturation forcing, and walked an
additional 31. The remaining 294 are the live frontier."* Today's
`get_synthetic_readout` summarizes prose; `get_joint_saturation` would
summarize *structure*. That is the difference between a chat-log digest
and a deliberation-state report.

---

## Cross-session summary

| Session | Generated | Key MCP reads (T5) |
|---|---|---|
| **0c — Open behaviours** | Time-indexed $\{\mathsf{Art}(B_t)\}$ with partial transition maps; three openness levels (carrier / loci / orthogonality); stable-core, fragile-membership, lost-articulations derived views; fossil-witness discipline | `get_articulation_drift`, `get_open_arity`, `get_fossil_witnesses` |
| **0d — Composition algebra** | Three operators (subordination, transport, federation); Ambler-arrow composition lifts to articulation-lattice convolution; exposure-map composition requires re-saturation; $\iota$ and $\mathsf{Witness}$ compose by structural reconciliation | `transport_articulation_lattice`, `compose_exposure_maps`, `subordinate_articulation` |
| **0e — Joint saturation** | $\sigma_{\mathrm{joint}}(D_P, \mathsf{Witness})$ as forward-closure over participation; three properties (J1–J3); drained-latent-stratum as the formal "progress" reading | `get_joint_saturation` (with `includeForced`, `includeDrain`) |

Together with the seven reads proposed in 0b, the **complete Ludics-native
MCP surface this conceptual track proposes** is now ~14 tools, structured
around the four-component dialectical/witnessing interface, time-indexed
for live operation, composable across rooms, and closed under
participation-forcing.

---

## Status

Sessions 0c, 0d, 0e ship the time, joining, and closure axes of the
generative substrate. With 0b's interface formalization as the seam and
this document's three operators on top, the conceptual track now has
sufficient apparatus to specify the first Ludics-native MCP read surface
end-to-end. Next conceptual sessions will pivot from *what the substrate
is* to *what to do with it* — sub-question (ii) re-opened (announcement
discipline build, post-tools), and the deeper Section-D / Section-E
question deck items from the brainstorm. A literature-review pass
(scoped separately) is now both possible and useful, since the conceptual
scaffolding is stable enough to absorb external sources without distortion.

**N-C25 (Round 2, original-to-track).** Phase 5 of the AI roadmap
proposes an explicit "what is deliberately not computed" list
(per-participant scoring, participation-quality scores, reading tracking,
sentiment analysis, predictive churn) as a first-class governance
artifact, with the property that future additions require explicit
principle-level justification. The philosophical antecedent is Suchman's
*located accountability* stance (*Located Accountabilities in Technology
Production*, Scandinavian J. Information Systems 14(2):91–105, 2002),
which frames the political and epistemic positioning of design boundaries
as accountable practice. The operationalization of this stance as a
concrete deliverable list shipped alongside a deliberation platform is
original to this track.
