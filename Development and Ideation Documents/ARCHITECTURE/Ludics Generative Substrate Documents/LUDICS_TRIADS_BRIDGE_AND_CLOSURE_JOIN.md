# The Triads Bridge and the ⊥⊥-Closure Join — Two Technical Prerequisites for the C3 Rewrite

> **Post-review status (CORRECTED post-2e/2f, 2026-05-21).** This Session 0f doc stages the C3 rewrite under the working assumption that $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ is a join-semilattice with bottom $|B|$. Phase 2e refuted that at the $\mathsf{Inc}(B)$ level (antichain; $\vee_{\perp\perp}$ exits $\mathsf{Inc}(B)$ universally) and reframed the JSL carrier as the per-cone $(C_i, \leq_\subseteq, \vee)$. Phrases in §II.2 / §III such as "$\mathsf{Inc}(B)$ has $|B|$ as bottom", "is a join-semilattice with bottom $|B|$", and "the incarnations $|B|$" should be read with the per-cone reframe applied: each cone has its own bottom $D_i$ and its own JSL structure; there is no global $|B|$. The Ambler hom-set identification (C3) is consequently per-cone, not global — see the **OQ-JSL-Ambler** entry in [LUDICS_CONSOLIDATION_AND_DEV_READINESS.md](./LUDICS_CONSOLIDATION_AND_DEV_READINESS.md). Authoritative source: [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md), [LUDICS_ORDER_RELATION_DEFINITION.md](./LUDICS_ORDER_RELATION_DEFINITION.md).

**Session:** 0f (Conceptual)
**Date:** 2026-05-17
**Track:** Conceptual / pre-product
**Scope:** Two narrow technical questions surfaced by Literature Review Round 1
(`LITERATURE_REVIEW_ROUND_1.md` §10 Q1 and §10 Q5). Both are prerequisites
for the planned Tier-2 substantive rewrite of C3 in
`LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md` §2.2 (the articulation-lattice ≅
Ambler-hom-set identification). 0f does *not* attempt the C3 rewrite itself;
it stages the two structural moves the rewrite needs to make honestly.
**Carries:** T3′ (anonymous polarity) and T4 (dialectical/witnessing
separation) are the closing tests of each part.
**Companions:**
[LUDICS_GENERATIVE_SUBSTRATE.md](./LUDICS_GENERATIVE_SUBSTRATE.md) ·
[LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md](./LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) ·
[LUDICS_OPEN_COMPOSITION_JOINT.md](./LUDICS_OPEN_COMPOSITION_JOINT.md) ·
[LITERATURE_REVIEW_ROUND_1.md](./LITERATURE_REVIEW_ROUND_1.md) ·
[LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md](./LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) (0g — follow-on) ·
[LUDICS_SYSTEM_ARCHITECTURE.md](../LUDICS_SYSTEM_ARCHITECTURE.md) ·
[ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md](../ECC_REFINEMENT_AND_MCP_INTEGRATION_PLAN.md) ·
[../../../packages/isonomia-mcp/src/server.ts](../../../packages/isonomia-mcp/src/server.ts)

> **Terminological reminder.** "Protocol saturation" $\sigma(D)$ throughout
> is distinct from Fouquéré–Quatrini 2018 visitable-paths saturation. Prose
> uses "Ambler-style evidential closed category" / "semilattice-enriched
> CCC" instead of the earlier "ECC" label; deployed MCP tool names
> (`ecc_*`) are unchanged.

---

## 0. Frame and stakes

Round 1 surfaced two pressure points on the substrate's C3 load-bearing
claim that $\mathsf{Art}(B) \cong \mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B)$
as join-semilattices.

- **(Q1, Reading C grounding.)** Reading C asserts that Opponent is the
  behaviour $\sigma(D_P)^\perp$ rather than any coalition of participants.
  That assertion sits *between* standard two-player Ludics (where Opponent
  is a single design) and any multi-agent reading proposed in the
  literature. **Basaldella's Triads** (arXiv:1502.04773, 2015) is the
  closest stepping-stone: it abstracts to a triple $(P, N, \perp)$ without
  committing to which side carries the player-role. The question is whether
  Reading C lives naturally as a Triads-shape with $N$ promoted to the
  Opponent role and many participant-side instantiations on the $P$ side —
  giving Reading C a positive technical home rather than only a negative
  ("not a coalition") definition.
- **(Q5, the join in $\mathsf{Art}(B)$.)** Designs in a behaviour $B$ are
  *not* literally closed under set-theoretic union $\cup$: $D_1 \cup D_2$
  need not be a design of $B$. The natural join in Ludics is the
  bi-orthogonal closure $D_1 \vee D_2 := (D_1 \cup D_2)^{\perp\perp}$.
  Substrate-side, C3 implicitly used $\cup$ as the join, which is
  technically wrong. The question is whether the corrected join is
  idempotent and associative, whether it preserves incarnation as the
  bottom, and whether it interacts well with delocation. If yes, $(B,
  \leq, \vee)$ carries the join-semilattice structure C3 needs; if no,
  C3 must be weakened to a poset claim with conditional joins.

Both questions sharpen the same underlying issue: **what algebraic structure
does $\mathsf{Art}(B)$ actually carry?** Only after that is fixed can C3 be
restated honestly as "the same object as the Ambler hom-set under such-and-such
identification, modulo such-and-such caveat."

---

## Part I — The Triads bridge to Reading C

### I.1 What Triads gives us

Basaldella 2015 ("Ludics without Designs I: Triads") proposes that a Ludics
structure can be abstracted to a triple

$$
(P,\; N,\; \perp \subseteq P \times N)
$$

where $P$ and $N$ are sets of "moves" or "atoms" without committing them to
the Player/Opponent designs of the original Girard 2001 presentation, and
$\perp$ is an orthogonality relation between them. Designs and behaviours
are recovered as derived constructions: a *design* is a (suitably structured)
subset of $P$, a *behaviour* is a $\perp$-closed subset of $P$, and the
standard Ludics theorems lift one direction at a time. The framework is
deliberately neutral about which side carries which role — Triads abstracts
out the player-vs-opponent distinction.

**N-C21 (Round 2 confirmed original-to-track; active null across ≥3 sources).**
Round 2 surveyed the full Basaldella–Faggian–Terui–Saurin–Baelde–Doumane–Quatrini
2015–2025 lineage. Basaldella 2015 (LINEARITY 2014 / arXiv:1502.04773),
Definition 1.1 defines a triad as $(\mathcal{P}_A, \mathcal{N}_A, \bot_A)$
with $\mathcal{P}_A$, $\mathcal{N}_A$ sets of polarity-typed *terms* and
$\bot_A \subseteq \mathcal{P}_A \times \mathcal{N}_A$ a semantic
orthogonality—*not* a Proponent/Opponent role-assignment with an external
witness relation. No paper in that lineage introduces a
participant-tracking $\mathsf{Witness}$ relation. The substrate’s Reading
C—$P$ = the Proponent design, $N$ = $\sigma(D_P)^\perp$, with external
$\mathsf{Witness}$—is an original instantiation of the Triads
abstraction. Cite Basaldella 2015 arXiv:1502.04773 as the formal base;
label Reading C explicitly as “Triads instance with external
participant-tracking relation, original to this track.”

This neutrality is what Reading C needs. Reading A and Reading B both *commit*
to the player-role assignment up front: Opponent is "the other player," a
design (Reading A) or a saturated coalition (Reading B). Reading C refuses
that commitment and identifies Opponent with $\sigma(D_P)^\perp$ — a behaviour,
not a player. In the standard Girardian vocabulary this is an awkward thing
to say, because "Opponent" already means "the design facing $D_P$." In the
Triads vocabulary it is straightforward: Reading C just *picks* which of the
two atoms-sides $P$ and $N$ carries which role, and picks the
non-player-role for $N$.

### I.2 Reading C as a Triads instance

The structural translation:

| Substrate concept | Standard Ludics | Triads element |
| --- | --- | --- |
| Proponent design $D_P$ | design at $\xi$ | a subset $\hat{D}_P \subseteq P$ |
| Saturated $D_P$ | $\sigma(D_P)$ | $\sigma(\hat{D}_P) \subseteq P$ (closure on $P$ side) |
| Opponent (Reading C) | a *behaviour*, not a design | $\sigma(\hat{D}_P)^{\perp} \subseteq N$ |
| A participant's witnessed move | (no native concept) | one $n \in N$ in $\sigma(\hat{D}_P)^{\perp}$, plus a witness tuple in the witnessing layer |
| Witnessing record | (no native concept) | a relation $\mathsf{Witness} \subseteq N \times \mathrm{Participants} \times \ldots$ |

The substrate's commitments translate cleanly:

- **T3′ (anonymous polarity)** becomes: the assignment of player-roles to
  $P$ and $N$ is *not* derived from authorship; it is a structural
  property of the protocol. Authorship lives in $\mathsf{Witness}$,
  which is *external* to the Triad itself.
- **T4 (dialectical/witnessing separation)** becomes: the Triad
  $(P, N, \perp)$ is the dialectical layer; $\mathsf{Witness}$ is the
  witnessing layer. The two layers cohabit on the same $N$ (every
  witnessed move is an $n$) but the Triad is unaware of who witnessed
  what. This is exactly the records-only $\iota$ invariant from 0b §1.3,
  expressed at the Triads level.
- **Reading C** becomes: Opponent is $\sigma(\hat{D}_P)^\perp \subseteq N$.
  Individual participants are not players in the Triad. They are
  *instantiators* of pre-existing $n \in N$ via $\iota$. Many
  participants may instantiate the same $n$; the Triad sees one $n$;
  the witnessing layer sees many tuples.

### I.3 What this buys

Three things.

- **A positive characterization of Reading C.** Reading C is no longer
  defined only by what it refuses (the coalition Opponent, the
  per-participant Opponent). It is the Triad-shape with a structural
  player-role assignment plus an external witnessing relation. That is a
  *constructive* definition: given a behaviour and a witnessing relation,
  Reading C tells you exactly what counts as Opponent and what counts as a
  witness.
- **A technical positioning for C7.** C7 ("no multi-agent Ludics commits to
  Reading C") becomes a *Triads-relative* claim: no published instantiation
  of the Triads framework picks this particular role assignment plus
  external witnessing relation. That is much more checkable than the
  current "no prior art" framing.
- **A natural locale for the $\iota$ invariants.** The four invariants
  (I1 records-only / I2 idempotent / I3 locus-injective / I4 total-modulo-
  extension) are restated in Triads terms as conditions on the map
  $\mathsf{Witness} \to N$: it must be (I1) a function into the existing
  carrier of $N$, (I2) idempotent on repeated presentations, (I3) injective
  on the witness side modulo the carrier $N$, and (I4) total modulo carrier
  extension. This is exactly the discipline 0b §1.3 articulated; Triads
  gives it a setting.

### I.4 What this does *not* prove

The translation above is *structural*, not formal: it tells us that Reading
C is the kind of thing a Triads-instance can be, but does not check that
the specific orthogonality relation we need (the one driven by Ludics
protocol semantics — dual moves, focalization, daimon as the
ultra-positive end-marker) lifts cleanly to a Triads instance with the
expected closure properties. The substrate's working assumption — that it
does — is conjectural until checked against the Triads paper directly.

**✅ Closed in Session 0g §I.** The compatibility check passes for the
Ludics-induced Triad $\mathfrak{T}_L$: $\sigma_T(\hat{D}_P)^{\perp_T} =
\sigma(D_P)^{\perp}$ (CQ1–CQ2) and carrier-set extension of $N$ equals
delocation (CQ3). See
[LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md §I](./LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md).

---

## Part II — The bi-orthogonal closure join in $\mathsf{Art}(B)$

### II.1 Why $\cup$ is the wrong join

Substrate-side (e.g.\ 0b §2.2) C3 wrote the join in $\mathsf{Art}(B)$ as
"taking the union of articulations." That is informally correct — "I commit
to both this articulation and that articulation" — but technically wrong as
stated, for two reasons:

- **Closure.** $D_1 \cup D_2$ is in general *not* a design: it can violate
  daimon-uniqueness on a locus, can violate focalization, can introduce
  branchings that no single Player strategy could produce. Designs are a
  proper subclass of subsets of moves, and $\cup$ does not preserve that
  subclass.
- **Membership in $B$.** Even when $D_1 \cup D_2$ is a design, it need not
  be a design of the specific behaviour $B$: orthogonality against
  $\sigma(D_P)^\perp$ is a non-trivial constraint that need not be preserved
  by union.

The standard Ludics fix is the **bi-orthogonal closure**:

$$
D_1 \vee D_2 \;:=\; (D_1 \cup D_2)^{\perp\perp}.
$$

This is the smallest behaviour-closed set containing both designs. It is
the canonical Ludics analogue of join in a topology of closed sets, and is
the only join consistent with treating $B$ as a $\perp\perp$-closed
collection in the first place.

### II.2 The four algebraic checks

For $(B, \leq, \vee)$ to be a join-semilattice in the sense C3 needs, the
join must satisfy four properties. Each is checkable in the substrate's
intended use; below is the substrate's current best understanding of each,
with explicit flagging of what is conjectural.

**(II.2.a) Idempotence.** $D \vee D = D$?

$(D \cup D)^{\perp\perp} = D^{\perp\perp}$. So idempotence holds iff
$D^{\perp\perp} = D$ for every design $D \in B$. In a $\perp\perp$-closed
behaviour, every *incarnation* satisfies $D^{\perp\perp} = D$ by definition
of incarnation (the minimum element of its $\perp\perp$-closure equivalence
class). For non-incarnation designs, $D^{\perp\perp} \supseteq D$ strictly,
so $D \vee D = D^{\perp\perp} \neq D$ in the strict order. **This is a
problem.** Two options:

- **Option A (restrict to incarnations).** Work with $\mathsf{Inc}(B) :=
  \{D \in B : D^{\perp\perp} = D\}$ instead of $B$ itself. On
  $\mathsf{Inc}(B)$, $\vee$ is idempotent by construction. C3 then
  identifies $\mathsf{Inc}(B)$, not $B$, with the Ambler hom-set. This is
  the cleaner story and probably the right one, but loses the "every
  design in $B$" framing.
- **Option B (quotient by $\perp\perp$).** Work with $B / \sim_{\perp\perp}$
  where $D_1 \sim D_2$ iff $D_1^{\perp\perp} = D_2^{\perp\perp}$.
  Equivalence classes are represented by their incarnations.
  $\mathsf{Art}(B) / \sim$ is a join-semilattice with $\vee$ idempotent.
  Equivalent to Option A modulo choice of representatives.

Either way, **the substrate must restrict $\mathsf{Art}(B)$ either to
$\mathsf{Inc}(B)$ or to $B / \sim_{\perp\perp}$ before claiming
idempotence.** The substrate doc's current "minimum elements of
$\mathsf{Art}(B)$ are the incarnations" phrasing is consistent with Option
A; the C3 rewrite should make this explicit.

**(II.2.b) Associativity.** $(D_1 \vee D_2) \vee D_3 = D_1 \vee (D_2 \vee
D_3)$?

LHS = $((D_1 \cup D_2)^{\perp\perp} \cup D_3)^{\perp\perp}$. RHS =
$(D_1 \cup (D_2 \cup D_3)^{\perp\perp})^{\perp\perp}$. Both equal
$(D_1 \cup D_2 \cup D_3)^{\perp\perp}$ provided $(X \cup Y^{\perp\perp})^
{\perp\perp} = (X \cup Y)^{\perp\perp}$, which is the standard
monotonicity-plus-closure property of $\perp\perp$ in any orthogonality
space (and which Girard proves for Ludics directly). **Associativity is
expected to hold by the general theory; no substrate-specific obstruction
is visible.**

**(II.2.c) Bottom as incarnation.** Does $\mathsf{Art}(B)$ (after
restriction per II.2.a) have a least element, and is it Girard's
incarnation $|B|$?

The incarnation of $B$ is the unique minimal incarnated design in $B$ when
$B$ has one — in particular, when $B$ is principal in the sense of
Fouquéré–Quatrini 2013. The substrate's behaviours $B = \sigma(D_P)^{\perp}$
are principal by construction (they are the orthogonal of a single design's
saturation). So **$\mathsf{Inc}(B)$ has $|B|$ as bottom**, and the
"minimum-commitment design that plays the position" reading from 0b §2.2
is correct.

**(II.2.d) Compatibility with delocation.** If $\delta: \xi \to \eta$ is a
delocation and $\delta_*$ is the induced map on designs, does $\delta_*(D_1
\vee D_2) = \delta_*(D_1) \vee \delta_*(D_2)$?

Delocation is by construction a renaming, and renamings commute with
orthogonality and with union. So they commute with $\perp\perp$, and
**delocation preserves $\vee$**. The directed system $\{B_t\}$ from 0c
extends to a directed system of *join-semilattices* under delocation
transitions, not just a directed system of underlying sets.

### II.3 Net result for C3

On the corrected story:

$$
\mathsf{Art}(B) \;:=\; (\mathsf{Inc}(B),\; \leq,\; \vee)
\quad\text{where}\quad
D_1 \vee D_2 = (D_1 \cup D_2)^{\perp\perp},
$$

is a join-semilattice with bottom $|B|$, compatible with delocation. The
informal "union of articulations" gloss is preserved as the *underlying
operation* before $\perp\perp$-closure; the closure step is the technical
correction.

This is the precise object that C3 should identify with the Ambler hom-set
$\mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B)$ viewed as a join-semilattice of
derivations under Ambler's $\vee$. Ambler's selected arrows correspond to
the incarnations $|B|$; Ambler's $\vee$ corresponds to ours;
non-incarnation designs correspond to non-canonical derivations in Ambler's
sense and are quotiented to their incarnations.

### II.4 What this does *not* prove

The C3 identification is a *structural correspondence*, not a derived
equivalence of two pre-existing constructions in the literature. The
correspondence has the right shape on both sides (same algebraic carrier,
same bottom, same join), but the bridge itself — that these are *the same*
mathematical object and not two different objects of the same shape — is
original to this track and is what Round 1's Appendix-A "single-source
structural identification" verdict refers to.

The honest statement for the C3 rewrite is therefore:

> **C3 (rewritten).** We propose a structural identification of
> $\mathsf{Art}(B) := (\mathsf{Inc}(B), \leq, \vee_{\perp\perp})$ with
> the Ambler hom-set $\mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B)$ viewed as a
> join-semilattice of derivations. The correspondence sends incarnations to
> selected arrows, the $\perp\perp$-closure join to Ambler's $\vee$, and
> the inclusion order to derivation-extension order. We claim no theorem
> bridging Girard 2001 and Ambler 1996 in the literature; the
> identification is offered as a working hypothesis whose payoff is the
> unification of the Ludics-native articulation-lattice reads with the
> Ambler-style evidential-closed-category algebra already deployed on the
> platform. Verification belongs to a future formal-proof effort.

This is the version the Tier-2 rewrite should target.

---

## Part III — Joint payoff and remaining gaps

### III.1 What 0f gives the Tier-2 C3 rewrite

Three pre-conditions are now satisfied:

- **A positive setting for Reading C** (the Triads instance), so C3 can
  *start* from a defined dialectical layer rather than from a negative
  characterization of Opponent.
- **A correct algebraic carrier** ($\mathsf{Inc}(B)$ with
  $\vee_{\perp\perp}$), so C3 can identify *that* with the Ambler hom-set
  rather than identifying the wrong object.
- **Explicit framing as structural identification** with explicit caveats
  (single-source bridge, incarnation restriction, $\perp\perp$-closure on
  join), so C3 reads as a working hypothesis rather than as a derived
  theorem.

### III.2 What 0f does *not* give

- **The Confidence-Erasure-Functor caveat.** Ambler’s hom-sets carry
  Dempster–Shafer confidence weights on derivations. The Ludics side does
  not. The identification at best holds *after* erasing confidence
  weighting; this is naturally captured as a forgetful functor from the
  Ambler semilattice-enriched CCC to a Ludics-style plain CCC, discarding
  the semilattice enrichment while preserving cartesian-closed structure.
  **N-C22 (Round 2).** The categorical machinery for this pattern is
  standard: the underlying-ordinary-category 2-functor
  $(-)_0 : V\text{-}\mathbf{CAT} \to \mathbf{CAT}$ along a lax monoidal
  functor $V \to W$ is formalized in Kelly (*Basic Concepts of Enriched
  Category Theory*, TAC reprint 10, 2005, §1.2); Borceux & Stubbe
  (*Short Introduction to Enriched Categories*) give the archetype;
  Jansana & San Martín (arXiv:1811.03698, 2018) exhibit an explicit
  adjoint to a forgetful functor between semilattice-enriched and weaker
  algebraic categories—a close analogue. The *application* of this
  pattern to confidence-stripping in the Ambler↔Ludics bridge is original
  to this track. The functor has not been written down here and is queued
  for Session 0g.
- **The Triads check.** Whether the substrate's specific $\sigma$ and
  $\perp$ lift to a Triads instance with the expected closure properties
  is the open item from §I.4. ✅ Closed in Session 0g §I: the compatibility
  check passes for $\mathfrak{T}_L$ (see
  [LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md §I](./LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)).
- **A category-theoretic statement of C10.** "Composition lifts to
  articulation-lattice composition" was confirmed in principle by Round 1
  (mechanism categorically available), but writing out the lifting
  explicitly for the deliberation setting is a separate exercise, deferred.

### III.3 T5 closer — MCP/AI consumer implications

Two read-tool shapes are clarified by 0f.

- `get_articulation_lattice(deliberationId, claimId, options: {
  representatives: "incarnations" | "raw" })`. The default
  `representatives: "incarnations"` returns
  $\mathsf{Inc}(B)$ as a poset of named representatives; `raw` returns the
  full $B$ with $\perp\perp$-closure equivalence classes annotated. The
  distinction is invisible to a participant but load-bearing for an AI
  agent that wants to reason about the algebraic structure.
- `compute_articulation_join(deliberationId, claimId, designIds[])`.
  Returns the $\vee_{\perp\perp}$ of the supplied designs as a (named)
  incarnation in $\mathsf{Inc}(B)$. T5 use: an LLM drafting a synthesis
  move that "combines articulations A and B" can check what the formal
  join actually is, rather than guessing.

Both fit naturally in the ~14-tool Ludics-native MCP surface the substrate
proposes; neither has an existing analog in `packages/isonomia-mcp/src/server.ts`.

---

## §0f deliverables summary

- Reading C is now defined positively as a Triads instance $(P, N, \perp)$
  with a structural player-role assignment plus an external witnessing
  relation; the four $\iota$ invariants are restated in Triads terms.
- The join in $\mathsf{Art}(B)$ is corrected to $\vee_{\perp\perp}$; the
  underlying object is restricted to $\mathsf{Inc}(B)$ to recover
  idempotence; associativity, bottom-as-incarnation, and
  delocation-compatibility hold by the general theory.
- The honest restatement of C3 is given (Part II §II.3), suitable for
  Tier-2 substitution into `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`
  §2.2 once the rewrite is actioned.
- Two T5-flagged MCP read shapes (`get_articulation_lattice` with
  representatives mode; `compute_articulation_join`) are clarified.
- Two open items are queued: (a) a Triads-internal check of $\sigma$/$\perp$
  closure compatibility, (b) the Confidence-Erasure-Functor between
  Ambler and Ludics sides for the C3 identification.

The Tier-2 C3 rewrite is now unblocked.
