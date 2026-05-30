# T003 — Schemes Layered Coherence

- **status:** established (track-internal — uses substrate machinery to compose, not original Ludics theorem)
- **closes:** Q-012 (jointly with the rationale in [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md))
- **depends-on:** T001 (per-cone JSL), T002 (Inc antichain + cone decomposition), C006 (now confirmed as base layer), C007 (now confirmed as structural layer), C008 (now confirmed as procedural layer)
- **proved-by:** Schemes ontology decision session, 2026-05-27
- **cross-checked-by:** Schemes literature review (SC4, SC22, SC25 — no published precedent forces a different reading)
- **cross-check-date:** 2026-05-27
- **last-reviewed:** 2026-05-27
- **source-of-proof:** [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md) §3–§4
- **implementation-spec:** the three coherence conditions land on three different engineering surfaces — condition (1) presentation-determines-behaviour is enforced by [Spec 2 — Admin Tightening](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_ADMIN_TIGHTENING.md) (WF1/WF2/WF3 well-formedness rules at authoring time); condition (2) protocol-soundness (the inclusion $\mathcal{P}(\pi_S) \subseteq \llbracket S \rrbracket$, in general proper) is enforced by [Spec 3 — Protocol Soundness](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) (instance-close soundness gate + latent-stratum UI for the gap); condition (3) CQ-bundle consistency across the three layers is enforced by WF1 (Spec 2) at the authoring side and by the soundness gate (Spec 3) at the runtime side. See [IMPLEMENTATION_TRACKS.md](../IMPLEMENTATION_TRACKS.md).

## Statement

Let `S` be a well-formed Walton/Macagno-style argumentation scheme. Then
the three-layer scheme datum

$$
S \;=\; \bigl\langle \llbracket S \rrbracket,\; \mathcal{S}_S,\; \pi_S \bigr\rangle
\;=\; \llbracket S \rrbracket \;\times_{\mathrm{CQ}(S)}\; \mathcal{S}_S \;\times_{\mathrm{CQ}(S)}\; \pi_S
$$

satisfies the following three coherence conditions:

1. **Presentation determines behaviour.**
   $$\mathcal{B}(\mathcal{S}_S) \;=\; \llbracket S \rrbracket$$
   where `𝓑 : Presentations → 𝒫(Designs)` is the C007-to-C006 map
   $$\mathcal{B}(\mathcal{S}_S) \;=\; \bigl\{ D \in \mathrm{Designs} \;:\; \forall q_i \in \mathrm{CQ}_S,\; D \perp q_i^{\mathrm{opp}} \bigr\}^{\perp\perp}.$$
   The map is well-defined (the CQ-bundle determines the orthogonal class
   via biorthogonal closure) and **many-to-one** (multiple presentations
   can denote the same behaviour — `𝓑` discards the locus-tree shape,
   variable bindings, and hole map).

2. **Protocol soundness.**
   $$\mathcal{P}(\pi_S) \;\subseteq\; \llbracket S \rrbracket$$
   where `𝓟 : Protocols → 𝒫(Designs)` is the C008-to-C006 map sending a
   non-deadlocking, finitely-terminating protocol fragment `π_S` to the
   set of proponent designs producible by some winning play under `π_S`,
   biorthogonally closed. The inclusion is **proper in general**: the
   gap `⟦S⟧ ∖ 𝓟(π_S)` is exactly the *latent stratum* `E_ℓ` of the
   exposure map (see [`LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)
   §2.1) applied to the scheme's behaviour — the designs that are
   semantically in `⟦S⟧` but that no finite dialogue under `π_S` has yet
   forced into existence.

3. **CQ-bundle consistency across layers.** The presentation `𝓢_S` and
   the protocol fragment `π_S` agree on `CQ(S)` — i.e. both layers
   reference the same set of critical questions. Violations of this
   condition are **ill-formedness**, not counterexamples to the theorem;
   the admin should enforce CQ-bundle consistency as a creation-time
   well-formedness rule.

## Corollary (inheritance — closes Q-012)

For `S' ⊑ S` (child-of-parent under the layered reading), the inheritance
relation has a consistent definition at each layer:

- **C006:** `⟦S'⟧ ⊆ ⟦S⟧` (lattice refinement of behaviours).
- **C007:** the child's presentation `𝓢_{S'}` is a constraint-tightening
  of `𝓢_S` (locus tree extension or refinement; hole-map specialisation;
  `CQ(S') ⊇ CQ(S)`).
- **C008:** the child's protocol fragment `π_{S'}` extends `π_S` (all
  parent obligations preserved; burden assignments on inherited CQs are
  *at least as strong*).

The three layer-specific definitions are mutually consistent because
they all follow from the same structural fact: the child's CQ-bundle is
a superset of the parent's. More CQs ⇒ smaller behaviour (C006); more
constraints on the locus tree (C007); more obligations in the protocol
(C008).

**Consequence for `inheritCQs: false`.** Suppressing parent CQs *shrinks*
the child's effective CQ-bundle, which *enlarges* the child's behaviour
(fewer tests, more designs survive). This gives `⟦S'⟧ ⊇ ⟦S⟧`, reversing
the inheritance direction. The flag is therefore **incoherent** under
the layered reading with C006 as ground truth and should be retired
(recommended) or reclassified as a sibling marker. See
[`SCHEMES_ONTOLOGY_DECISION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md)
§6.3 and [Q-019](../01_OPEN_QUESTIONS_REGISTRY.md) (engineering audit).

## Proof (pointer)

See [`SCHEMES_ONTOLOGY_DECISION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md)
§3 (construction of `𝓑` and `𝓟`), §3.4 (soundness proof sketch), §3.5
(structural argument from the ι-instantiation isomorphism — the layered
scheme ontology is structurally isomorphic to the dialectical/witnessing
layer separation, and the soundness condition mirrors `ι`'s I1
records-only invariant), §4 (coherence check worked on three production
schemes from distinct cluster families: Argument from Expert Opinion
[`authority_family`], Practical Reasoning [`practical_reasoning_family`],
Argument from Sign [`evidence_family`]), §4.5 (epistemicMode candidate
counterexample dispatched), §4.6 (no genuine counterexample found).

## Structural justification (why the theorem is forced, not chosen)

The ι-isomorphism in §3.5 of the decision document is the load-bearing
structural argument. The substrate's [Reading C](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)
commitment plus the T4 dialectical/witnessing layer separation already
fix one instance of the layered architecture (deliberation = dialectical
layer + witnessing layer + structural description, connected by the ι
discipline). The schemes layered ontology is the **same architecture
applied to scheme identity rather than to deliberation structure**:

| `ι` deliberation layer separation | Layered scheme ontology |
|---|---|
| Dialectical layer (anonymous, pre-existing, Ludics-native) | C006 behaviour (extensional, pre-existing as semantic object) |
| Witnessing layer (attributed, constructed by participation) | C008 protocol surface (procedural, constructed by scheme declaration in a room) |
| Structural description (locus tree, designs, exposure map) | C007 presentation (locus tree, variables, CQ-bundle) |
| I1: records-only on the dialectical side | Soundness `𝓟(π_S) ⊆ ⟦S⟧` |
| I3: multiple witnesses per move | `𝓑` not injective (multiple presentations per behaviour) |

The layered scheme ontology is therefore **forced by substrate
consistency**, not merely consistent with it: any other resolution of
the C006/C007/C008 trilemma would treat scheme ontology under a
discipline incompatible with how the substrate already treats
deliberation ontology.

## Cross-check notes

- **Literature.** The Schemes literature review (Appendix A row SC4)
  confirms no published source poses, let alone adjudicates, the
  C006/C007/C008 trilemma. The layered resolution and the ι-isomorphism
  argument are original to this track. The Walton/Macagno-Walton 2015
  informal additive species-of inheritance (SC10) is *compatible with*
  but does not formally precede the layered inheritance corollary.
  Fouqueré–Quatrini 2013 confirms incarnations / behaviours as primary
  semantic objects in adjacent Ludics-and-language work but does not
  treat Walton schemes (SC22 confirmed null).
- **Substrate.** The soundness condition `𝓟(π_S) ⊆ 𝓑(𝓢_S)` mirrors the
  ι I1 invariant (records-only on the dialectical side). The gap
  identification (`⟦S⟧ ∖ 𝓟(π_S) = E_ℓ`) reuses the exposure-map latent
  stratum without introducing new primitives.
- **No re-derivation of T001/T002.** The proof uses T001/T002 only via
  the standard Ludics fact that `B = B^{⊥⊥}` (Girard 2001 §4); the
  per-cone JSL structure (T001) and the cone decomposition (T002) are
  not directly invoked but underwrite the well-typedness of biorthogonal
  closure in the finitely-generated regime the substrate operates in.

## What this theorem leaves open

- **Q-015 (composition).** The layered reading gives composition a
  three-layer structure (`S₁ ; S₂` at C006 corresponds to cut composition
  of designs; at C007 to plugging one locus tree into another's hole; at
  C008 to protocol concatenation). The **soundness-of-concatenation**
  conjecture — `𝓟(π_{S₁} · π_{S₂}) ⊆ 𝓑(𝓢_{S₁;S₂})` — extends T003's
  soundness theorem to composed schemes and remains open. This is where
  the Faggian–Hyland 2002 / Terui 2011 cut-composition machinery is
  expected to earn its keep.
- **[Q-021](../01_OPEN_QUESTIONS_REGISTRY.md) (behaviour-equality
  decidability).** The non-injectivity of `𝓑` (multiple presentations
  per behaviour) creates an admin-side decidability problem: two admins
  can independently create different-looking schemes with the same
  effective behaviour. T003 establishes that this can happen but does
  not provide a decision procedure for behaviour-equality.
- **Q-017 (CQ-of-CQ recursion).** Under the layered reading, the
  recursion is *ontology-independent* (all three layers share the
  CQ-bundle, so the recursion is the same regardless of layer).
  Termination remains open.
- **Q-018 (OntoClean).** OntoClean meta-properties now apply to
  *behaviours* (the C006 layer) rather than to presentations or
  catalogue rows. This sharpens Q-018 but does not resolve it.
- **C009 / Q-016 (scheme-rivalry).** Independent of T003; each layer
  admits scheme-rivalry restated in its native vocabulary
  (behaviour-intersection emptiness at C006, locus-tree disjointness at
  C007, protocol incompatibility at C008). T003 does not bear on
  C009's resolution.

## Bibliography

- Girard 2001 *Locus Solum* MSCS 11(3):301–506 — biorthogonal closure
  `B = B^{⊥⊥}`; behaviours as the primary semantic object.
- Faggian & Hyland 2002 *Designs, Disputes and Strategies* CSL — cut
  composition machinery (cited for the open Q-015 question, not used in
  T003's proof).
- Walton, Reed & Macagno 2008 *Argumentation Schemes* — CQ-bundles.
- Macagno & Walton 2015 *A Classification System for Argumentation
  Schemes* — informal additive inheritance (compatible with T003's
  layered inheritance corollary).
- [`SCHEMES_ONTOLOGY_DECISION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md)
  §3–§8 (the proof and its open-question accounting).
- [`SCHEMES_LITERATURE_REVIEW.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md)
  §1 (executive summary), §7 (Bucket 6 — Ludics-meets-Walton null
  result), §10 (Q1–Q7 inputs), Appendix A rows SC4, SC10, SC22, SC25.
- [`LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)
  §1 (T4 layer separation), §2.1 (exposure map and the latent stratum
  `E_ℓ`).
- [`LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)
  (T001 / per-cone JSL — underwrites well-typedness of biorthogonal
  closure).
- [`LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
  (T002 / Inc antichain + cone decomposition).
