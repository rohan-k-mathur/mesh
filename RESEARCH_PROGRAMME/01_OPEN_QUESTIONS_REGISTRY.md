# Open Questions Registry

> Append-only. To close an entry, do not delete it: change its `status` and add
> a `closed-by` line pointing to the theorem, study, or rationale that closed
> it. Withdrawn questions stay in the file with `status: withdrawn` and a brief
> note explaining why.

## Schema

Each entry uses this template:

```
### Q-NNN — <one-line statement>
- **status:** open | partially-resolved | closed-by-proof | closed-by-experiment | withdrawn
- **ring:** core | inner | middle | outer  (which concentric ring it sits in; see 00_CHARTER §1)
- **tier:** formal | computational | empirical | philosophical
- **method:** how this question is supposed to be settled (the kind of work it requires)
- **how-would-we-know:** what evidence would count as a settlement, positive or negative
- **depends-on:** other Q-IDs / theorem-IDs / conjecture-IDs this rides on
- **affects-implementation:** in-repo paths that would be touched by a settlement (or "none")
- **bibliography:** key citations (relative paths into the repo and/or external)
- **next-action:** the smallest next step
- **closed-by:** (if closed) link to the theorem/study/conjecture entry that closed it
```

IDs are zero-padded, monotonic, and never reused.

---

## Seed entries

### Q-001 — Is the Ambler bridge `Art(B) ≅ Hom_{A_Γ}(A, B)` a faithful isomorphism, or only a structure-preserving functor?
- **status:** open
- **ring:** core
- **tier:** formal
- **method:** category-theoretic; construct the functor in both directions and check unit/counit triangles
- **how-would-we-know:** positive — a written, human-checked proof of the iso (and the corresponding confidence-erasure functor commuting with it); negative — a counterexample exhibited as a behaviour B and an Ambler hom-set H with an Art-structure mismatch the substrate cannot absorb
- **depends-on:** T001, T002
- **affects-implementation:** none directly; if positive, becomes the categorical justification for the announcement-bus event types in [`Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md)
- **bibliography:** [`.../LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md); [`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §3 (C3); Ambler 1996 MSCS 6(2)
- **next-action:** write C001 conjecture file with both directions and the confidence-erasure square

### Q-002 — Is Reading C multi-agent Ludics conservative over bilateral Reading A?
- **status:** open
- **ring:** core
- **tier:** formal
- **method:** prove that for every Reading-C interaction there is a bilateral simulation whose convergence verdict agrees; or construct a deliberation in which they disagree
- **how-would-we-know:** positive — a translation lemma plus a fidelity-of-verdicts proof; negative — an explicit three-or-more-participant deliberation whose Reading-C verdict differs from any bilateral simulation
- **depends-on:** Q-001 (the bridge tells us what objects to translate)
- **affects-implementation:** the participant-anonymisation policy in T4 (no `participantId` on default Ludics reads); the design-set vs. design-pair API surface
- **bibliography:** [`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §2 (C7); Basaldella *Ludics without Designs I: Triads* arXiv:1502.04773
- **next-action:** write C002 conjecture file; identify the smallest non-trivial three-agent test case

### Q-003 — Does the walked / witnessable / latent exposure-map stratification refine Prakken-2024 expansions monotonically?
- **status:** open
- **ring:** inner
- **tier:** formal
- **method:** define the participant-access map from a Prakken expansion to a three-element lattice and prove monotonicity under expansion extension
- **how-would-we-know:** positive — a monotonicity proof and a worked example where strength under the stratified map distinguishes two expansions Prakken's flat counting collapses; negative — a pair of expansions whose stratified ordering disagrees with the substrate's intended semantics
- **depends-on:** —
- **affects-implementation:** the synthetic-readout `writingConstraints` line in [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md) §IV; the `Foundation_Review_of_Ludics_Games_Implementation` exposure surfaces
- **bibliography:** Prakken 2024 *Artificial Intelligence* 335:104193; [`.../LITERATURE_REVIEW_ROUND_2.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) §2.4
- **next-action:** write C003 conjecture file with a worked Prakken example

### Q-004 — Is joint saturation `σ_joint(D_P, Witness)` a closure operator on a defined poset, and is "deliberative progress" exposure-map drainage in that closure?
- **status:** open
- **ring:** core
- **tier:** formal
- **method:** define the poset (likely the product of design-set inclusion and witness-record inclusion); check extensivity, monotonicity, idempotence
- **how-would-we-know:** positive — a closure-operator proof plus a Galois-connection statement; negative — a violation of idempotence in a finite example
- **depends-on:** Q-002, Q-003
- **affects-implementation:** the "contested frontier" and "missing-move report" in [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md) §IV
- **bibliography:** [`.../LUDICS_OPEN_COMPOSITION_JOINT.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md); [`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §2 (C20)
- **next-action:** write C004 conjecture file

### Q-005 — Does a time-indexed family `{B_t}` of behaviours under deliberative move-application form a directed system with partial transition maps, and does its colimit characterise convergence?
- **status:** open
- **ring:** core
- **tier:** formal
- **method:** define the transition maps `B_t → B_{t+1}` and the index category; check directedness; check that the colimit recovers the convergent-design set
- **how-would-we-know:** positive — a colimit theorem with the convergent set as the limit; negative — a deliberation in which the family fails to be directed (two updates produce incomparable behaviours with no common extension)
- **depends-on:** Q-004
- **affects-implementation:** the deliberation-scope fingerprint / synthetic-readout APIs; cross-deliberation aggregation
- **bibliography:** [`.../LITERATURE_REVIEW_ROUND_2.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) §2.3 (R-C5); Doutre, Herzig & Perrussel KR 2023; Coste-Marquis et al. *Control Argumentation Frameworks*
- **next-action:** write C005 conjecture file; reproduce a Control-AF example as a B_t sequence

### Q-006 — Under what conditions does cross-room transport (Plexus one-hop functors) preserve ludics convergence verdicts?
- **status:** open
- **ring:** middle
- **tier:** formal
- **method:** define a functor between scoped designs of two rooms; characterise verdict-preservation as a property of the functor (faithful on chronicles? full on incarnations?)
- **how-would-we-know:** positive — a fidelity-of-transport theorem with a stated functor class; negative — a transported argument whose verdict in the receiving room contradicts its verdict in the source room under a transport the platform actually performs
- **depends-on:** Q-002
- **affects-implementation:** the one-hop contract in transport-aggregator (cf. [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md) §IV "one-hop cross-room transport")
- **bibliography:** [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md) §III "Plexus Network"; SHA-1 fingerprinted room functors
- **next-action:** open a session to define the functor class formally

### Q-007 — Does synthesis quality in iterated three-round adversarial deliberation (the `polarization-1*` design) increase with defence symmetry?
- **status:** open
- **ring:** outer
- **tier:** empirical (computational)
- **method:** pre-registered metric — synthesist judgement score against a held-out methodologist's rubric, regressed on per-round defence-budget asymmetry
- **how-would-we-know:** positive — a pre-registered effect at α=0.05 across ≥3 topics with effect size > 0.3; negative — null or reverse effect with the same protocol
- **depends-on:** —
- **affects-implementation:** the synthesist / methodologist prompt families in [`experiments/polarization-1-iter3-e2e/prompts/`](../experiments/polarization-1-iter3-e2e/prompts/); evidence-corpus harness
- **bibliography:** [`experiments/polarization-1-iter3-e2e/FRAMING.md`](../experiments/polarization-1-cmp-iter3-off/FRAMING.md); the seeded result files [`ludics-development-roadmaps-research/seededludicsdelibresults*.txt`](../ludics-development-roadmaps-research/)
- **next-action:** write S001 pre-registration

### Q-008 — Does AI-authored argumentation (via the MCP `propose_*` tools) survive structural attack at a lower rate than human-authored argumentation, holding the scheme constant?
- **status:** open
- **ring:** outer
- **tier:** empirical
- **method:** observational, using the platform's `authorKind` / `aiProvenance` provenance flags; survival = standing label after K days; matched-pair on scheme, room, claim-density
- **how-would-we-know:** positive — a statistically significant lower survival rate for AI-authored, robust across rooms; negative — equal-or-higher rate, robust across rooms
- **depends-on:** —
- **affects-implementation:** the ratification gate for AI warrants (cf. [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md) §IV); MCP tool surface in [`packages/isonomia-mcp/src/server.ts`](../packages/isonomia-mcp/src/server.ts)
- **bibliography:** [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md) §IV "AI-Epistemic Primitive"
- **next-action:** write S003 pre-registration; identify minimum sample size

### Q-009 — Is "consensus" structurally distinguishable from "exhaustion" in the substrate?
- **status:** open
- **ring:** outer
- **tier:** philosophical
- **method:** articulation, with literature engagement on Habermas BFN 1996 (anonymous popular sovereignty), Mansbridge et al. 2012 (deliberative systems), Mercier & Sperber 2017 (argumentative function); cross-checked against the announcement-bus event types
- **how-would-we-know:** the programme has a position when there is a written statement that (a) names a structural diagnostic on the substrate that distinguishes the two and (b) survives critique from a named opposing position
- **depends-on:** Q-005 (we may need {B_t} to define exhaustion)
- **affects-implementation:** the synthetic-readout "stage" classification (`articulation`, `deliberation`, `matured`) in [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md) §IV
- **bibliography:** Habermas BFN 1996 p.486; Mansbridge et al. 2012 *A Systemic Approach to Deliberative Democracy*; Mercier & Sperber 2017 *The Enigma of Reason*; [`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §1
- **next-action:** add to next quarterly review as a sustained-articulation item

### Q-010 — Are commitments at sub-claim granularity (per-locus commitments, per the substrate's geometric reading) representable in the Singh / Telang–Singh–Yorke-Smith 2022 maintenance-commitment framework, or do they require new vocabulary?
- **status:** open
- **ring:** middle
- **tier:** formal (with empirical fallback if formal route blocks)
- **method:** attempt a representation; identify the smallest commitment in the substrate that has no Singh-style encoding
- **how-would-we-know:** positive — a translation table and a worked example; negative — a substrate commitment with a proven non-representability lemma
- **depends-on:** Q-001
- **affects-implementation:** the Session-3 commitment spec referenced in [`.../LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_HARMONIZATION_PASS_1_THEORETICAL_MAP.md) §1 ("out of scope (deferred)")
- **bibliography:** Telang, Singh & Yorke-Smith 2022 *maintenance commitments*; [`.../LITERATURE_REVIEW_ROUND_2.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) §1 (Q3 residual)
- **next-action:** identify the candidate non-representable commitment from the existing `LudicCommitmentElement` rows

---

## Argumentation-scheme cluster (Q-011 – Q-015)

Opened 2026-05-27. Companion document:
[`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md).
These questions arose from auditing the implicit theory embedded in the
`/admin/schemes` UI ([`app/admin/schemes/page.tsx`](../app/admin/schemes/page.tsx),
[`components/admin/SchemeList.tsx`](../components/admin/SchemeList.tsx),
[`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx),
[`components/admin/SchemeHierarchyView.tsx`](../components/admin/SchemeHierarchyView.tsx)),
which currently makes six load-bearing commitments (see the foundations
doc §1) for which the programme owes a justification.

### Q-011 — Is the Pollock REBUTS / UNDERMINES / UNDERCUTS attack-type trichotomy exhaustive for the substrate, or is at least one further category (e.g. epistemic-undercutters in the sense of Doutre–Herzig–Perrussel 2023) required?
- **status:** open
- **ring:** inner
- **tier:** formal
- **method:** characterise critical questions as required opponent loci in the substrate (per Cluster B of the foundations doc); enumerate the locus-attack modes the substrate's design syntax admits; check whether each maps into Pollock's three categories
- **how-would-we-know:** positive — a bijection (modulo naming) between substrate locus-attack modes and the trichotomy; negative — a substrate attack mode that the trichotomy cannot express, exhibited as a worked CQ on an existing scheme that the admin's `attackType` enum forces into the wrong cell
- **depends-on:** Q-002 (Reading C fixes what "opponent" means in the substrate)
- **affects-implementation:** the `attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES"` enum in [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx) (`CriticalQuestion` type); the parallel column on `argument_scheme_cq` in Prisma; the AIF round-trip in [`lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts) if the enum is widened
- **bibliography:** Pollock 1995 *Cognitive Carpentry* ch. 3; Doutre, Herzig & Perrussel 2023 *KR* (epistemic argumentation frameworks); Modgil & Prakken 2014 ASPIC+ *Argument & Computation* 5(1)
- **next-action:** enumerate the locus-attack modes by reading [`server/ludics/`](../server/ludics/) attack handlers; cross-check against the admin's enum

### Q-012 — What is the formal semantics of scheme inheritance — set-theoretic CQ-extension, lattice refinement of behaviours, or categorical sub-object — and which does the admin's `inheritCQs` flag currently commit to?
- **status:** open
- **ring:** middle
- **tier:** formal
- **method:** state the three candidate semantics precisely; for each, derive the consequences for (a) child behaviour non-emptiness, (b) compositionality with the cluster_family field, (c) what an `inheritCQs: false` override means; pick the one the admin's behaviour is consistent with — or declare the admin currently incoherent
- **how-would-we-know:** positive — a written derivation that identifies the admin's de facto semantics, with one paragraph per candidate explaining why the other two are rejected; negative — a worked example where the admin's UI produces a child scheme whose behaviour is empty (or non-empty under one candidate semantics and empty under another), forcing a choice
- **depends-on:** C006/C007/C008 (the three competing scheme-ontology conjectures; the inheritance semantics is downstream of the ontology choice)
- **affects-implementation:** the `inheritCQs` boolean and `parentSchemeId` column on `argument_scheme`; the "+inherited" badge logic in [`components/admin/SchemeHierarchyView.tsx`](../components/admin/SchemeHierarchyView.tsx); the CQ-merge logic that runs when an instance of a child scheme is evaluated
- **bibliography:** Macagno & Walton 2015 *Classifying the Patterns of Natural Arguments*; Walton, Reed & Macagno 2008 *Argumentation Schemes*; Ambler 1996 (sub-object framing)
- **next-action:** read [`server/`](../server/) for the actual CQ-merge code path; identify whether the merge is set-union or behaviour-intersection in practice

### Q-013 — Does the admin's "Generate from Taxonomy" feature produce CQ-bundles that practitioners accept without modification, and if so, does this support the conjecture that the Walton/Macagno taxonomy fields *functionally determine* a baseline CQ set?
- **status:** open
- **ring:** outer
- **tier:** empirical (observational, with the existing scheme corpus)
- **method:** for every scheme currently in production, compare its CQ set against the output of `generateCQsFromTaxonomy(scheme.taxonomy, scheme.key)` from [`lib/argumentation/cqGeneration.ts`](../lib/argumentation/cqGeneration.ts); measure (a) Jaccard overlap, (b) directional containment (generated ⊆ actual?), (c) per-attack-type agreement
- **how-would-we-know:** positive — ≥ 0.7 Jaccard across ≥ 80% of schemes and no class of schemes where the generator is systematically wrong; negative — < 0.4 mean Jaccard, or one or more taxonomy cells for which the generator is consistently mis-aligned; partial — taxonomy under-determines CQ count (correct *kinds* but missing the discriminating questions)
- **depends-on:** —
- **affects-implementation:** [`lib/argumentation/cqGeneration.ts`](../lib/argumentation/cqGeneration.ts) generator; the "Generate from Taxonomy" button copy in [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx) (currently asserts the bundle is a "baseline")
- **bibliography:** Macagno & Walton 2015 §3 (cluster families and CQ inheritance); the existing scheme rows in `argument_scheme`
- **next-action:** file S004 pre-registration; pull current scheme corpus

### Q-014 — Is the scheme catalogue an *ontology* (curated, axiomatic, closed under principled extension) or a *folksonomy* (open, descriptive, emergent from authoring), and what does either choice obligate the product to do?
- **status:** open
- **ring:** outer
- **tier:** philosophical (with product-design consequences)
- **method:** articulation, with literature engagement on Walton's own openness about extending schemes over thirty years (Walton 1996 → 2008 → 2015) vs. ontology-engineering practice (Gruber, Guarino); cross-check against the substrate's own commitments under T4 (the dialectical layer is structurally pre-existing, which biases ontology, not folksonomy)
- **how-would-we-know:** the programme has a position when there is a written statement that names which the catalogue *is*, lists the well-formedness rules a new scheme must satisfy under that choice (the candidates: non-redundancy, non-vacuity, cluster-conservativity, locative coherence), and survives critique from a position that defends the other side
- **depends-on:** Q-012 (inheritance semantics shapes what "conservative extension" means)
- **affects-implementation:** the unconstrained "Create Scheme" path in [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx); the `POST /api/schemes` validator
- **bibliography:** Walton, Reed & Macagno 2008 *Argumentation Schemes*; Macagno & Walton 2015; Gruber 1993 *A Translation Approach to Portable Ontology Specifications*; substrate T4 framing in [`.../LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)
- **next-action:** add to next quarterly review as a sustained-articulation item

### Q-015 — Does scheme composition in the substrate (an argument that uses two schemes in chain) correspond to cut composition of designs, and if so, do the composite scheme's CQs inherit from both component schemes or only from the consumer side?
- **status:** open
- **ring:** core
- **tier:** formal
- **method:** formalise scheme-application as a design schema with typed holes (Cluster A of the foundations doc, scheme-as-design-schema reading); state the cut between `apply(S₁)` and `apply(S₂)`; check whether the cut-eliminated design lies in a well-defined composite behaviour `⟦S₁ ⊕ S₂⟧`; characterise its CQ-orthogonal set
- **how-would-we-know:** positive — a definition of ⊕ on schemes plus a soundness lemma (every chain of S₁-then-S₂ in the wild is in ⟦S₁ ⊕ S₂⟧) plus a CQ-inheritance rule derived (not stipulated) from the cut; negative — a chained argument whose CQ profile under any candidate ⊕ rule disagrees with what practitioners actually challenge
- **depends-on:** C006/C007/C008 (the right scheme ontology determines what cut is being applied to), Q-001 (Ambler bridge tells us how Hom-set composition lifts), T001/T002
- **affects-implementation:** the chain-of-schemes representation in the chain editor (`components/chain/*`); the `argument_scheme_application` table relationships
- **bibliography:** Walton, Reed & Macagno 2008 ch. 11 (chained schemes); ASPIC+ rule chaining (Modgil & Prakken 2014); Faggian & Hyland 2002 CSL (cut composition on DDS); Terui 2011 TCS (computational Ludics)
- **next-action:** identify the smallest chained-scheme example in the production corpus and trace its cut-shape by hand

---

## Schemes literature-review follow-on cluster (Q-016 – Q-020)

Opened 2026-05-27. Surfaced by
[`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md)
§11 (open research questions). These five questions and the two studies
S005/S006 are downstream of the literature review; they are filed here
to keep the programme's cross-reference discipline intact rather than
leaving them stranded in the lit-review's §11.

### Q-016 — Does the substrate admit a fourth Pollock-style attack category (scheme-rivalry / behaviour-intersection emptiness) that the REBUTS / UNDERMINES / UNDERCUTS trichotomy cannot express?
- **status:** open
- **ring:** inner
- **tier:** formal
- **method:** instantiate C009 on at least one production-corpus argument pair `⟨apply(S₁, x), apply(S₂, x)⟩`; check whether the attack mode coerces into any Pollock primitive without distortion
- **how-would-we-know:** positive — a worked argument pair satisfying C009's three positive-settlement criteria (no Pollock primitive applies; behaviour-intersection emptiness detected; practitioners recognise as a legitimate attack); negative — every candidate scheme-rivalry attack reduces to a Pollock primitive on closer inspection, or the intersection-emptiness condition is empirically vacuous on the production catalogue
- **depends-on:** C009; Q-011 (Pollock trichotomy exhaustiveness — Q-016 is the specific extensionality question; Q-011 the general one)
- **affects-implementation:** the `attackType` enum on `argument_scheme_cq` and in [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx); the AIF round-trip in [`lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts)
- **bibliography:** [`../RESEARCH_PROGRAMME/03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md`](03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md) §10 Q5, Appendix A row SC6; Tiozzo 2024 *Ratio* 37(2-3)
- **next-action:** scan the production scheme catalogue for candidate rival-pair instances

### Q-017 — Does the CQ-of-CQ regress terminate, and if so, at what depth — and is the answer ontology-dependent (C006/C007/C008)?
- **status:** open
- **ring:** middle
- **tier:** formal
- **method:** state the recursive structure precisely under each candidate ontology (under C006: CQs are themselves designs with their own orthogonals; under C007: CQs are sub-trees with their own holes and CQ-bundles; under C008: CQs are protocol clauses that may invoke further protocol clauses); for each, check whether the recursion is well-founded, eventually periodic, or non-terminating
- **how-would-we-know:** positive — a termination (or eventual-periodicity) lemma per ontology with an explicit bound or fixpoint characterisation; negative — a worked CQ-bundle on a production scheme that produces a divergent CQ-of-CQ chain under at least one ontology
- **depends-on:** C006/C007/C008; resolved jointly with the trilemma
- **affects-implementation:** the CQ-merge logic in [`server/`](../server/); the admin's "show inherited CQs" depth limit (if any) in [`components/admin/SchemeHierarchyView.tsx`](../components/admin/SchemeHierarchyView.tsx)
- **bibliography:** Walton & Godden 2005 OSSA §6 (raises the question; no formal answer); Hernández 2023 *Argumentation* 37(3):377–395 (separates CQs from schemes but does not formalise recursion); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md) §3 (SC8), §11 item 2
- **next-action:** pick the deepest extant scheme hierarchy in the production catalogue and walk its CQ-of-CQ chain by hand

### Q-018 — Do the OntoClean meta-properties (rigidity, identity, unity, dependence) classify the existing scheme catalogue consistently, and which schemes (if any) are anti-rigid in a way that obstructs the *ontology* reading of Q-014?
- **status:** open
- **ring:** outer
- **tier:** philosophical (with empirical / ontology-engineering methodology)
- **method:** apply the four OntoClean meta-properties to every scheme in the production catalogue (and to the WRM 2008 Ch. 9 60+ catalogue as a control); produce a matrix of meta-property assignments; flag any subsumption that violates OntoClean's constraints (e.g. a rigid concept subsumed by an anti-rigid one)
- **how-would-we-know:** positive — every production scheme receives a stable meta-property classification, and the subsumption graph satisfies OntoClean's constraints; partial — most schemes classify cleanly but a small named subset (e.g. role-based schemes like *argument from expert opinion* where "expert" is a role, not a kind) is anti-rigid and forces a re-organisation; negative — meta-properties classify the catalogue inconsistently across analysts (κ < 0.6), indicating the catalogue is folksonomic in disguise
- **depends-on:** Q-014 (the ontology-vs-folksonomy framing); the result feeds directly into Q-014's settlement
- **affects-implementation:** the `cluster_family` field on `argument_scheme`; the "Create Custom Scheme" validator (any anti-rigidity-driven re-organisation must update the validator)
- **bibliography:** Guarino & Welty 2002 *Communications of the ACM* 45(2):61–65; Guarino & Welty 2009 *Handbook on Ontologies* 2nd ed. (OntoClean overview); Gruber 1993 *Knowledge Acquisition* 5(2); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md) §6 (Bucket 5), §11 item 4, Appendix A row SC18
- **next-action:** open a dedicated session; produce the meta-property matrix for the current production catalogue

### Q-018 is **the most important of Q-016 – Q-020** because it is the single empirical input that breaks the tie in Q-014.

### Q-019 — What is the precise semantics of `inheritCQs: false` (admin-level opt-out from a parent scheme's CQ inheritance), and which child-of-parent relationships in the current catalogue rely on it?
- **status:** open
- **ring:** middle
- **tier:** formal (with empirical audit)
- **method:** under each candidate ontology (C006/C007/C008), derive the semantics of `inheritCQs: false` from first principles and check whether it is coherent; audit the production catalogue for every child scheme with `inheritCQs: false` and classify each use (was the author signalling "this is a sibling, not a child"? was it a workaround for a missing field? was it genuinely a child with different CQs?)
- **how-would-we-know:** positive — every production use of `inheritCQs: false` falls into a small named taxonomy of intents, and each intent has a coherent semantics under the chosen ontology; negative — uses are heterogeneous and incoherent under all three ontologies, indicating the flag should be retired
- **depends-on:** Q-012 (inheritance semantics); the C006/C007/C008 trilemma resolution; Q-014 (catalogue ontology vs folksonomy)
- **affects-implementation:** the `inheritCQs` boolean column on `argument_scheme`; the "+inherited" badge logic in [`components/admin/SchemeHierarchyView.tsx`](../components/admin/SchemeHierarchyView.tsx); any data migration that retires the flag
- **bibliography:** Macagno & Walton 2015 (informal additive species-of); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md) §10 Q3, §11 item 6, Appendix A row SC12
- **next-action:** SQL audit of `argument_scheme WHERE inherit_cqs = false`

### Q-020 — Which fields exposed by major scheme catalogues (AIF spec, AIFdb, Argdown, ASPIC+ rule signatures, DefLog, WRM 2008's compendium schema, Wagemans PTA) are *not* exposed by the admin's `SchemeCreator`, and which of those omissions are theoretically significant?
- **status:** open
- **ring:** outer
- **tier:** methodological (with empirical schema audit)
- **method:** enumerate every field in each external catalogue; map each onto the admin's `SchemeCreator` fields; classify omissions as (a) intentional (substrate has a principled reason to exclude), (b) accidental (oversight; should be added), (c) representable but absent (could be re-derived from existing fields), (d) load-bearing externally but irrelevant under the substrate's ontology
- **how-would-we-know:** positive — a complete field-by-field comparison table with each omission classified, and any class-(b) field added to the admin or filed as a follow-on Q-NNN; negative — the audit is inconclusive because external catalogues have under-specified field semantics
- **depends-on:** —
- **affects-implementation:** [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx); `prisma/schema.prisma` (`argument_scheme` and `argument_scheme_cq` tables); the AIF round-trip in [`lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts)
- **bibliography:** Chesñevar et al. 2006 *Knowledge Engineering Review* 21(4) (AIF); Walton, Reed & Macagno 2008 (WRM 2008 schema-row format); Modgil & Prakken 2014 (ASPIC+ rule signature); Wagemans 2016 PTA; [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md) §11 item 7, Appendix A row SC24
- **next-action:** build the field-by-field comparison spreadsheet

