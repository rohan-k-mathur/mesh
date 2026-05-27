# Glossary

> Project-internal definitions. Each term notes where it diverges from the
> upstream literature; an undivergent definition is also flagged as such.
> One paragraph per term, in this project's sense.

## Behaviour

A set of designs `B` over a fixed root locus, closed under bi-orthogonality
(`B = B^⊥⊥`). In the substrate, a `Behaviour` is a first-class container
keyed by `(deliberationId, rootLocus)`; designs are not participant-owned,
the behaviour is. **Upstream:** Girard 2001 *Locus Solum*; Fouqueré &
Quatrini 2013. **Divergence:** the substrate treats `Behaviour` as a
storage and addressing primitive (a Prisma row), where the literature
treats it as a derived semantic object. The substrate's per-deliberation
scoping (so two deliberations can have behaviours over the "same" locus
path without collision) is not in the upstream literature.

## Design

A chronicle-set (equivalently, a set of justified, focalised, daimon-
terminating action-sequences) realising a strategy at a root locus. In the
substrate, a `Design` is a set, not a sequence: ordering is engine-internal
state, not semantic content (see
[`../Development and Ideation Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md)
§1). **Upstream:** Girard 2001. **Divergence:** the substrate
explicitly forgets the `LudicAct.orderInDesign` field present in the legacy
layer; designs in the substrate are unordered collections of loci.

## Locus

A finite path of natural numbers `0.i₁.i₂.…` addressing a node in the
ludics forest. In the substrate, loci are persisted as `LudicLocus` rows
keyed by `(dialogueId, path)`; substrate addresses serialise as strings
with the prefix `⊢A.` (e.g. `"⊢A.0.54.1"`). **Upstream:** Girard 2001
(standard). **Divergence:** the substrate prefix `⊢A.` and the
deliberation-scoped uniqueness key are project-internal; the upstream
literature uses unscoped paths.

## Walked / witnessable / latent (the exposure-map stratification)

A three-element classification of moves in a behaviour's exposed surface,
relative to the live deliberation: **walked** = some witness record binds
the move to a dialogue move; **witnessable** = the move is reachable from
a walked locus by a participant who has at least one binding; **latent** =
the move exists in the behaviour but is reachable by no current
participant. **Upstream:** none (original to this programme; Round 1 §2
C4 active-search null result;
[Round 2 §2.4 R-C8](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md)
confirms Prakken 2024 has no participant-access stratum).

## OQ-JSL (per-cone)

The settled (T001) form of the original OQ-JSL claim: within a behaviour
`B`, the cone above each incarnation `Dᵢ ∈ Inc(B)` is a join-semilattice
`(Cᵢ, ⊆, ∪)` with bottom `Dᵢ` and join = literal chronicle-set union.
**Upstream:** the components (inclusion order on designs; incarnation as
minimum) are in Fouqueré & Quatrini 2013. **Divergence:** the per-cone JSL
specialisation, named as `Art(Cᵢ)`, is substrate-original.

## AIF (Argument Interchange Format)

The Argument Interchange Format of Chesñevar et al. 2006, extended by the
Walton scheme catalogue. In the platform, AIF is the *thin DM-index* of
the substrate: the active AIF graph is currently read-only (see
[`../Development and Ideation Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md)
§0) and is bridged from ludics by
[`../lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts). **Upstream:**
unmodified. **Divergence:** AIF is treated as a *projection* of the
substrate, not as the primary representation.

## Commitment store

A per-participant ledger of asserted, conceded, and retracted commitments
that constrain what subsequent dialogue moves may permissibly do. In the
substrate, commitments are stratified by locus: `LudicCommitmentElement`
binds a commitment to a locus path, and the runtime checks consistency
locus-by-locus. **Upstream:** Hamblin 1970; Mackenzie 1979; Walton &
Krabbe 1995; Singh 1999; Telang, Singh & Yorke-Smith 2022. **Divergence:**
upstream commitments are propositional and flat; ours are geometric and
locus-stratified. The relationship to upstream is an open question
([Q-010](01_OPEN_QUESTIONS_REGISTRY.md#q-010)).

## Cone

The substructure `Cᵢ ⊆ B` of designs whose incarnation is `Dᵢ ∈ Inc(B)`.
By T002, `B = ⨆ᵢ Cᵢ` and the cones are pairwise disjoint. Within a cone
the positive/daimon skeleton is invariant (Daimon Lock Lemma,
[`../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_ORDER_RELATION_DEFINITION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)).
**Upstream:** the underlying decomposition follows from Fouqueré &
Quatrini 2013 uniqueness of incarnation. **Divergence:** the *name* "cone"
and the use of the per-cone structure as the carrier of `Art` is
substrate-original.

## Antichain

`Inc(B)` is an antichain under chronicle-set inclusion (T002). In the
programme's usage this is doing real work: it rules out any architecture
that presents `Inc(B)` as a linearly-ordered list with a designated
greatest element. **Upstream:** standard order theory. **Divergence:**
none in the term itself; the substantive content is in *which* set is
asserted to be antichain.

## Dialectical witnessing (the ι operation)

The records-only operation `ι` that binds an anonymous `LudicMove` at a
locus to a `DialogueMove`, creating a `WitnessRecord` row. ι is
idempotent and creates no new dialectical nodes; the act of witnessing
*recognises* the move's instantiation, it does not generate it. **Upstream:**
none directly; the closest analog is Brandomian "scorekeeping," but
scorekeeping in Brandom is propositional whereas ι is geometric. See
[`../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md).

## Scoped design

A `LudicDesign` that is not over the whole deliberation but over a
substructure addressed by `scopeType` (topic, actor-pair, argument).
Scoped designs are the runtime device that lets one deliberation host
many parallel design forests; the substrate v1 covers same-scope designs
only (`referencedScopes` and `crossScopeActIds` are unmodelled in
substrate v1; see
[`../Development and Ideation Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md)
§1). **Upstream:** none; scoped designs are project-original. The closest
analog in the Ludics literature is delocation, which is a single-design
locus-renaming, not a multi-design forest.
