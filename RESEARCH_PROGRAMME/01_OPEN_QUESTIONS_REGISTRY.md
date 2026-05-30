# Open Questions Registry

> Append-only. To close an entry, do not delete it: change its `status` and add
> a `closed-by` line pointing to the theorem, study, or rationale that closed
> it. Withdrawn questions stay in the file with `status: withdrawn` and a brief
> note explaining why.

## Schema

Each entry uses this template:

```
### Q-NNN — <one-line statement>
- **status:** open | partially-resolved | closed-by-proof | closed-by-experiment | closed-by-rationale | resolved-with-redirect | withdrawn

  *Status notes:*
  - **`resolved-with-redirect`** (added 2026-05-29): the question's framing turned out to be wrong but its execution productively identified a better question. Settled negatively within the original framing AND a new question is filed that the original question redirects to. Requires (i) an audit doc in `audits/` recording the diagnostic, (ii) a `status-original` line preserving the prior status, (iii) a forward pointer to the redirect question, (iv) the next-action line annotated `*(historical, pre-resolution)*` followed by the actual resolution path. First instance: [Q-027](#q-027) → [Q-028a](#q-028a--discovery-is-the-generator-level-bijection-mathsfincb-leftrightarrow-mathcalc_mathrmbasea-bsharp-underlying-the-c001b-bridge-canonical-on-small-instances) / [Q-028b](#q-028b--settlement-is-the-generator-level-bijection-forced-uniformly-by-the-f-dashv-u-adjunction-restricted-to-generators-so-that-b_1-wedge-b_2-closes-without-instance-enumeration) (originally redirected to Q-028, bifurcated same day) via [audit](audits/q027-thin-cones-2026-05-29.md), 2026-05-29.
  - **`closed-by-rationale`** (in use; not from the original schema): closed by a methodological/charter argument rather than by proof or experiment. Used when the question's resolution depends on a project-scope decision the programme owner has settled. See e.g. [Q-009](#q-009).
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
- **status:** partially closed (C001a closed by [T004](02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) 2026-05-29; C001b remains open)
- **ring:** core
- **tier:** formal
- **method:** category-theoretic; construct the functor in both directions and check unit/counit triangles
- **how-would-we-know:** positive — a written, human-checked proof of the iso (and the corresponding confidence-erasure functor commuting with it); negative — a counterexample exhibited as a behaviour B and an Ambler hom-set H with an Art-structure mismatch the substrate cannot absorb
- **depends-on:** T001, T002
- **affects-implementation:** none directly; if positive, becomes the categorical justification for the announcement-bus event types in [`Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md)
- **bibliography:** [`.../LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md); [`.../LITERATURE_REVIEW_ROUND_1.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §3 (C3); Ambler 1996 MSCS 6(2); mechanisation findings F1/F2/F3 in [`03_CONJECTURES/C001-ambler-bridge-iso.md`](03_CONJECTURES/C001-ambler-bridge-iso.md) §Mechanisation strategy
- **mechanisation-note:** 2026-05-28 — an exploratory Agda toy ([`mechanisation/agda/C001/Toy.agda`](mechanisation/agda/C001/Toy.agda)) surfaced three findings (F1 structure preservation is essential; F2 design-equality is a setoid `≈ᴰ`, not propositional `≡`; F3 the bridge in the JSL fragment is the free-1-generator JSL adjunction unit, distinct from the Ambler-specific remainder). The findings isolate the JSL fragment from the Ambler-specific content and motivate splitting C001 into two sub-conjectures (see `next-action`).
- **next-action:** split C001 into two sub-conjectures: (a) **C001a — JSL-fragment bridge** stating `Art(Cᵢ) ≅ Hom_{JSL}(𝟐, Art(Cᵢ))` as the unit of the free/forgetful adjunction `Set ⇄ JSL`, settlement *up to* set-equality `≈ᴰ` (consequence of F1+F2+F3, route B in C001 §Mechanisation), with the Agda toy reformulated to introduce a separate `Gen` object and a setoid layer; (b) **C001b — Ambler-specific remainder** stating the bridge's extension to the confidence-graded cartesian-closed `A_Γ` structure (the content of C001 that C001a *does not* cover), with the confidence-erasure square as its load-bearing diagram. C001 itself is then re-cast as the conjunction `C001a ∧ C001b`, with C001a expected to be mechanisable and C001b expected to remain primarily human-checked. **Attack order (decided 2026-05-28): C001a first, then C001b** — C001a is mechanisable and produces a real result independently; C001b can then cite C001a once it is closed and focus exclusively on the Ambler-specific extension. The Agda work resumes against C001a in [`mechanisation/agda/C001/C001a.agda`](mechanisation/agda/C001/C001a.agda). **Update 2026-05-28 (later same day): C001a drafted as [T004](02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md), provisional pending cross-check; remaining work on Q-001 is therefore exactly C001b (the cartesian-closed + confidence-erasure remainder).** **Update 2026-05-29: T004 established and C001a closed; C001b rewritten to absorb the substrate's `F ⊣ U` / counit-`ε` framing from `LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md` Part II and decomposed into three labelled sub-claims (b₁ `ε` surjective, b₂ `ε` injective, b₃ erasure-square commutes). A new gate question [Q-027](#q-027) (thin-cones diagnostic) was filed; it determines whether the C001b bridge is well-typed against the chronicle-set inclusion order `⊆` (T001/T004 world) or must be restated against the approximation order `⊑`. The attack order is now: Q-027 (small-cone diagnostic) → C001b b₁ → b₂ → b₃.** **Update 2026-05-29 (later same day): Q-027 diagnostic executed on Ambler Example 1 / Q3 (aspirin) under both safe and compressed Ludics encodings; both yielded thin cones (`|Inc(B_{Q3})| = 2`, each cone a singleton). The image of `ε` misses the cross-cone Ambler join, so C001b's per-cone bridge target fails. Crucially, the diagnostic surfaced an alternative bridge target — `𝒫_fin(Inc(B))`, the free JSL on incarnations — at which `ε` is iso for trivial reasons (free extension of a generator-level bijection `Inc(B) ↔ 𝒞/Γ(A,B)`), respecting Phase 2e Cross-Cone Incompatibility because the set-union operates one level up from designs. C001b is **superseded** by [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md) at this new target; the substantive open content collapses into [Q-028](#q-028) (canonicality of the generator-level bijection on `|Inc(B)| ≥ 3` cases and higher-order types). New attack order: Q-028 stratum 1 (3-derivation propositional case, extending the aspirin fact-base) → Q-028 stratum 2 (higher-order case) → C001b′ b₃′ (naturality diagram chase). Audit: [audits/q027-thin-cones-2026-05-29.md](audits/q027-thin-cones-2026-05-29.md).** **Update 2026-05-29 (further same day): Q-028 bifurcated into [Q-028a](#q-028a--discovery-is-the-generator-level-bijection-mathsfincb-leftrightarrow-mathcalc_mathrmbasea-bsharp-underlying-the-c001b-bridge-canonical-on-small-instances) (discovery via worked-example) and [Q-028b](#q-028b--settlement-is-the-generator-level-bijection-forced-uniformly-by-the-f-dashv-u-adjunction-restricted-to-generators-so-that-b_1-wedge-b_2-closes-without-instance-enumeration) (settlement via $F \dashv U$ freeness argument). Recognising the methodological lesson from C001a/T004 — worked-example diagnostics are insufficient to *settle* canonicality — the new attack order is: Q-028a stratum 1 (discovery) ∥ Q-028b paper attempt (settlement); if Q-028a stratum 1 is discovery-positive AND Q-028b lands, b₁′ ∧ b₂′ close uniformly and only b₃′ remains. Q-028a stratum 2 (higher-order) becomes a cross-check on the uniform argument rather than primary evidence.**

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
- **status:** closed-by-rationale
- **ring:** middle
- **tier:** formal
- **method:** state the three candidate semantics precisely; for each, derive the consequences for (a) child behaviour non-emptiness, (b) compositionality with the cluster_family field, (c) what an `inheritCQs: false` override means; pick the one the admin's behaviour is consistent with — or declare the admin currently incoherent
- **how-would-we-know:** positive — a written derivation that identifies the admin's de facto semantics, with one paragraph per candidate explaining why the other two are rejected; negative — a worked example where the admin's UI produces a child scheme whose behaviour is empty (or non-empty under one candidate semantics and empty under another), forcing a choice
- **depends-on:** C006/C007/C008 (the three competing scheme-ontology conjectures; the inheritance semantics is downstream of the ontology choice)
- **affects-implementation:** the `inheritCQs` boolean and `parentSchemeId` column on `argument_scheme`; the "+inherited" badge logic in [`components/admin/SchemeHierarchyView.tsx`](../components/admin/SchemeHierarchyView.tsx); the CQ-merge logic that runs when an instance of a child scheme is evaluated
- **bibliography:** Macagno & Walton 2015 *Classifying the Patterns of Natural Arguments*; Walton, Reed & Macagno 2008 *Argumentation Schemes*; Ambler 1996 (sub-object framing)
- **resolution:** Under the layered scheme ontology (Outcome A of [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md)), inheritance is *layered refinement*: `⟦S'⟧ ⊆ ⟦S⟧` at C006 (lattice refinement of behaviours), constraint-tightening on the locus tree and hole map at C007, protocol extension at C008. The three layer-specific definitions are consistent because they all follow from the same structural fact: the child's CQ-bundle is a superset of the parent's. `inheritCQs: false` is **incoherent** under C006 ground truth — suppressing parent CQs *enlarges* the child's behaviour relative to the parent, reversing inheritance. The flag should be retired (recommended) or reclassified as a sibling marker.
- **closed-by:** [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md) §6; [T003 — Schemes Layered Coherence](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)
- **implementation-spec:** [Spec 2 — Admin Tightening](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_ADMIN_TIGHTENING.md) (WF3 inheritance monotonicity + `inheritCQs` retirement); see also [IMPLEMENTATION_TRACKS.md](IMPLEMENTATION_TRACKS.md)
- **next-action:** *(closed — engineering follow-up is Q-019, the `inheritCQs: false` audit)*

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
- **implementation-spec:** *(no direct implementation; two empirical inputs are produced by the implementation track that will break the tie when read together)* — [Q-018](#q-018) OntoClean matrix via [Spec 5 phase 5b](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_AUDIT_PROTOCOLS.md) (folksonomy expected to show high anti-rigidity); [Spec 4 phase 4d](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md) catalogue-redundancy audit (folksonomy expected to show many `equal` / `subset` verdicts)
- **next-action:** add to next quarterly review as a sustained-articulation item

### Q-015 — Does scheme composition in the substrate (an argument that uses two schemes in chain) correspond to cut composition of designs, and if so, do the composite scheme's CQs inherit from both component schemes or only from the consumer side?
- **status:** open
- **ring:** core
- **tier:** formal
- **method:** formalise scheme-application as a design schema with typed holes (Cluster A of the foundations doc, scheme-as-design-schema reading); state the cut between `apply(S₁)` and `apply(S₂)`; check whether the cut-eliminated design lies in a well-defined composite behaviour `⟦S₁ ⊕ S₂⟧`; characterise its CQ-orthogonal set
- **how-would-we-know:** positive — a definition of ⊕ on schemes plus a soundness lemma (every chain of S₁-then-S₂ in the wild is in ⟦S₁ ⊕ S₂⟧) plus a CQ-inheritance rule derived (not stipulated) from the cut; negative — a chained argument whose CQ profile under any candidate ⊕ rule disagrees with what practitioners actually challenge
- **depends-on:** C006/C007/C008 (the right scheme ontology determines what cut is being applied to), Q-001 (Ambler bridge tells us how Hom-set composition lifts), T001/T002
- **affects-implementation:** the chain-of-schemes representation in the chain editor (`components/chain/*`); the `argument_scheme_application` table relationships
- **bibliography:** Walton, Reed & Macagno 2008 ch. 11 (chained schemes); ASPIC+ rule chaining (Modgil & Prakken 2014); Faggian & Hyland 2002 CSL (cut composition on DDS); Terui 2011 TCS (computational Ludics); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md) §8.1
- **implementation-spec:** *(out of scope for the current track; acknowledged in [Spec 3 — Protocol Soundness](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) §7 R6 and [Spec 4 — Verifier](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md) §7 R5 as the downstream cross-instance soundness work)*
- **next-action:** under the layered ontology now in force ([T003](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)), state composition at all three layers — C006: cut of designs giving `⟦S₁ ; S₂⟧`; C007: hole-plugging of locus trees giving `𝓢_{S₁;S₂}`; C008: protocol concatenation `π_{S₁} · π_{S₂}` — and prove the **soundness-of-concatenation conjecture** $\mathcal{P}(\pi_{S_1} \cdot \pi_{S_2}) \subseteq \mathcal{B}(\mathcal{S}_{S_1;S_2}) = \llbracket S_1 ; S_2 \rrbracket$ (the three-layer extension of T003's single-scheme soundness). Identify the smallest chained-scheme example in the production corpus and trace its cut-shape by hand to ground the proof attempt

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
- **status:** closed-by-experiment (first-pass; single analyst)
- **ring:** outer
- **tier:** philosophical (with empirical / ontology-engineering methodology)
- **method:** apply the four OntoClean meta-properties to every scheme in the production catalogue (and to the WRM 2008 Ch. 9 60+ catalogue as a control); produce a matrix of meta-property assignments; flag any subsumption that violates OntoClean's constraints (e.g. a rigid concept subsumed by an anti-rigid one)
- **how-would-we-know:** positive — every production scheme receives a stable meta-property classification, and the subsumption graph satisfies OntoClean's constraints; partial — most schemes classify cleanly but a small named subset (e.g. role-based schemes like *argument from expert opinion* where "expert" is a role, not a kind) is anti-rigid and forces a re-organisation; negative — meta-properties classify the catalogue inconsistently across analysts (κ < 0.6), indicating the catalogue is folksonomic in disguise
- **depends-on:** Q-014 (the ontology-vs-folksonomy framing); the result feeds directly into Q-014's settlement
- **affects-implementation:** the `cluster_family` field on `argument_scheme`; the "Create Custom Scheme" validator (any anti-rigidity-driven re-organisation must update the validator)
- **bibliography:** Guarino & Welty 2002 *Communications of the ACM* 45(2):61–65; Guarino & Welty 2009 *Handbook on Ontologies* 2nd ed. (OntoClean overview); Gruber 1993 *Knowledge Acquisition* 5(2); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md) §6 (Bucket 5), §11 item 4, Appendix A row SC18
- **implementation-spec:** [Spec 5 — Audit Protocols](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_AUDIT_PROTOCOLS.md) phase 5b produced the meta-property matrix; output gates [Spec 2](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_ADMIN_TIGHTENING.md) phase 2b back-test scope and [Q-014](#q-014) tie-breaking
- **closed-by:** [`audits/q018-ontoclean-20260528.md`](../audits/q018-ontoclean-20260528.md) — 0 rigid / **31 non-rigid** / 0 anti-rigid; 0 strict OntoClean violations; 1 soft violation (`scheme_test` as independent child under dependent parent `analogy`). Strict-machinery clean but qualitative folksonomy signals are uniform: **3 duplicate-candidate pairs** (`expert_opinion`/`expert-opinion`, `positive_consequences`/`good_consequences`, `causal`/`cause_to_effect`), **2 test placeholders shipped to production** (`scheme_test`, `test_scheme`), **4 dialogue-meta entries miscategorised as argument schemes** (`bare_assertion`, `claim_clarity`, `claim_relevance`, `claim_truth`), **9 of 31 schemes (29%) with `clusterTag = null`**, and one cluster-naming inconsistency (`causal_family` vs `causality_family`). Anti-rigidity-driven obstruction to the ontology reading of Q-014 is **structurally void** — no anti-rigid scheme exists in this domain. Spec 3 phase 3d (Carneades `premiseType` defaults) is therefore unobstructed; Spec 2 phase 2b WF1 back-test should prioritise the three duplicate pairs.
- **caveat:** single-analyst pass. A second-analyst replication is needed before invoking the κ ≥ 0.6 inter-rater threshold from `how-would-we-know`.
- **next-action:** *(closed — engineering follow-ons: Spec 2 phase 2b back-test queue; Spec 4 phase 4a verifier test corpus; catalogue-hygiene migration to remove `scheme_test` and `test_scheme` from production)*

### Q-018 was **the most important of Q-016 – Q-020** because it is the single empirical input that breaks the tie in Q-014. With Q-018 first-pass closed, Q-014's verdict is **"folksonomy in practice, ontology in aspiration"** (see [audits/q018-ontoclean-20260528.md](../audits/q018-ontoclean-20260528.md) §4).

### Q-019 — What is the precise semantics of `inheritCQs: false` (admin-level opt-out from a parent scheme's CQ inheritance), and which child-of-parent relationships in the current catalogue rely on it?
- **status:** closed-by-experiment
- **ring:** middle
- **tier:** formal (with empirical audit)
- **method:** under each candidate ontology (C006/C007/C008), derive the semantics of `inheritCQs: false` from first principles and check whether it is coherent; audit the production catalogue for every child scheme with `inheritCQs: false` and classify each use (was the author signalling "this is a sibling, not a child"? was it a workaround for a missing field? was it genuinely a child with different CQs?)
- **how-would-we-know:** positive — every production use of `inheritCQs: false` falls into a small named taxonomy of intents, and each intent has a coherent semantics under the chosen ontology; negative — uses are heterogeneous and incoherent under all three ontologies, indicating the flag should be retired
- **depends-on:** Q-012 (inheritance semantics); the C006/C007/C008 trilemma resolution; Q-014 (catalogue ontology vs folksonomy)
- **affects-implementation:** the `inheritCQs` boolean column on `argument_scheme`; the "+inherited" badge logic in [`components/admin/SchemeHierarchyView.tsx`](../components/admin/SchemeHierarchyView.tsx); any data migration that retires the flag
- **bibliography:** Macagno & Walton 2015 (informal additive species-of); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md) §10 Q3, §11 item 6, Appendix A row SC12
- **implementation-spec:** [Spec 5 — Audit Protocols](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_AUDIT_PROTOCOLS.md) phase 5a produced the audit; **output: zero rows** ([audits/q019-inherit-cqs-false-20260528.md](../audits/q019-inherit-cqs-false-20260528.md)). [Spec 2 — Admin Tightening](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_ADMIN_TIGHTENING.md) phase 2c proceeds with Shape A (retirement) trivially; the WF3 phase-ordering constraint dissolves (no `sibling-navigational` rows exist, so WF3 flips to error on the original phase-2b schedule)
- **closed-by:** [`audits/q019-inherit-cqs-false-20260528.md`](../audits/q019-inherit-cqs-false-20260528.md) — 0 of 31 schemes use `inheritCQs: false`. The flag is unused in production; the theoretical incoherence under the layered ontology (per [T003](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) and [SCHEMES_ONTOLOGY_DECISION.md](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md) §3) is unobstructed by production load
- **next-action:** *(closed — engineering follow-on is Spec 2 phase 2c-A retirement migration)*

### Q-020 — Which fields exposed by major scheme catalogues (AIF spec, AIFdb, Argdown, ASPIC+ rule signatures, DefLog, WRM 2008's compendium schema, Wagemans PTA) are *not* exposed by the admin's `SchemeCreator`, and which of those omissions are theoretically significant?
- **status:** closed-by-experiment (first-pass; single analyst)
- **ring:** outer
- **tier:** methodological (with empirical schema audit)
- **method:** enumerate every field in each external catalogue; map each onto the admin's `SchemeCreator` fields; classify omissions as (a) intentional (substrate has a principled reason to exclude), (b) accidental (oversight; should be added), (c) representable but absent (could be re-derived from existing fields), (d) load-bearing externally but irrelevant under the substrate's ontology
- **how-would-we-know:** positive — a complete field-by-field comparison table with each omission classified, and any class-(b) field added to the admin or filed as a follow-on Q-NNN; negative — the audit is inconclusive because external catalogues have under-specified field semantics
- **depends-on:** —
- **affects-implementation:** [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx); `prisma/schema.prisma` (`argument_scheme` and `argument_scheme_cq` tables); the AIF round-trip in [`lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts)
- **bibliography:** Chesñevar et al. 2006 *Knowledge Engineering Review* 21(4) (AIF); Walton, Reed & Macagno 2008 (WRM 2008 schema-row format); Modgil & Prakken 2014 (ASPIC+ rule signature); Wagemans 2016 PTA; Lawrence & Reed 2012 (AIFdb); Verheij 2003 (DefLog); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md) §11 item 7, Appendix A row SC24
- **implementation-spec:** [Spec 5 — Audit Protocols](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_AUDIT_PROTOCOLS.md) phase 5c produced the comparison; output gates [Spec 4 — Verifier](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md) phase 4c (AIF round-trip identity discipline) and widens the fingerprint scope (Spec 4 §3.5)
- **closed-by:** [`audits/q020-external-fields-20260528.md`](../audits/q020-external-fields-20260528.md) — 51 fields across 7 catalogues: **19 exposed (37%), 11 representable-but-absent (22%), 12 intentional-exclusion (24%), 6 accidental-omission (12%), 3 externally-load-bearing-internally-irrelevant (6%)**. Substrate posture is principled minimalism: 59% covered directly or by derivation; 30% absent for stated principled reasons (scheme/argument/dialogue/provenance separation); only 12% are genuine gaps. Six accidental omissions cluster into five follow-on questions (Q-022 through Q-026, opened below). Verdict for Spec 4 phase 4c: round-trip identity must be `import(export(scheme)) ≡_substrate-relevant scheme` rather than flat equality; for §3.5: fingerprint domain widens to include `epistemicMode`.
- **caveat:** single-analyst pass against substrate at [`lib/models/schema.prisma`](../lib/models/schema.prisma) line 4062. A second-analyst replication and a spot-check against the upstream AIF / AIFdb specs would strengthen the classification.
- **next-action:** *(closed — engineering follow-ons: open Q-022 to Q-026 below; Spec 4 §3.5 widens fingerprint domain to include `epistemicMode`; Spec 4 phase 4c soundness predicate updated to `≡_substrate-relevant`)*

---

## Schemes ontology decision follow-on (Q-021)

Opened 2026-05-27. Surfaced by
[`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md)
§8.7 as the engineering-decidability consequence of T003's
non-injectivity result for the presentation→behaviour map `𝓑`.

### Q-021 — How does the admin decide behaviour-equality `⟦S⟧ = ⟦S'⟧` between two independently-created schemes, given that the presentation→behaviour map is provably non-injective?
- **status:** open
- **ring:** core
- **tier:** formal (with engineering consequences)
- **method:** The decision document forecloses route (a) — *canonical-form* equality — because a canonicaliser `c : Presentations → Presentations` with `𝓑(𝓢) = 𝓑(𝓢') ⇔ c(𝓢) = c(𝓢')` would constitute a section of `𝓑`, which by T003's non-injectivity argument cannot exist in general (the fibres of `𝓑` are too irregular: locus-tree shape, variable renaming, hole-map permutation, CQ-bundle order all live in the kernel of `𝓑` but interact non-trivially). The decision document forces route (b) — *certificate-based equality*: the admin asserts a claim `⟦S⟧ = ⟦S'⟧` (or `⟦S⟧ ⊆ ⟦S'⟧`) and a separate verifier searches for a discriminating design `D ∈ ⟦S⟧ △ ⟦S'⟧` (or a CQ-orthogonality counterexample). The verifier may use witnessing strategies analogous to ι-witness construction. Open sub-questions: is the search bounded? does the production-corpus finitely-generated regime make it decidable? what is the right notion of "approximate" behaviour-equality for the admin's non-redundancy UI when exact equality is infeasible?
- **how-would-we-know:** positive — a verifier algorithm with a soundness lemma (if the verifier returns `equal`, the behaviours coincide; if it returns a discriminating design, they differ) plus an upper bound on its runtime under the substrate's finitely-generated regime; negative — a pair of production schemes whose behaviour-equality is provably undecidable in the verifier's intended use (e.g. reduces to a Halting-type problem on CQ-of-CQ recursion), forcing the admin to a strictly approximate non-redundancy check
- **depends-on:** T003 (the non-injectivity of `𝓑`); Q-014 (catalogue ontology — whether schemes are first-class enough to warrant a decidability check at all); Q-017 (CQ-of-CQ termination — the recursion depth bounds the verifier's search depth); Q-020 (the externally-exposed fields determine what counts as "different-looking" presentations the admin can plausibly create)
- **affects-implementation:** the admin's non-redundancy check at scheme-creation time (currently absent in [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx); the answer determines whether this UI is feasible at all); the catalogue de-duplication script (if any); the AIF round-trip's identity discipline in [`lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts) (round-tripping two presentations of the same behaviour through AIF and back must not silently merge them)
- **bibliography:** Girard 2001 *Locus Solum* §4 (biorthogonal closure and behaviour-equality in the abstract); Faggian & Hyland 2002 CSL (cut composition and the regularity properties needed for behaviour-equality decision); [`../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md) §3.2 (non-injectivity of `𝓑`), §8.7 (this question, originally stated); [T003 — Schemes Layered Coherence](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)
- **implementation-spec:** [Spec 4 — Verifier](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md) operationalises route (b) (certificate-based equality). The verifier returns `equal | subset | incomparable | inconclusive`; the behaviour fingerprint (Spec 4 §3.5, §4.3) is a necessary-but-not-sufficient pre-filter, **not** a canonical form (P3 + Q-021 explicitly foreclose canonical-form route)
- **next-action:** state the verifier's intended interface (input, output, soundness contract); attempt a worked example on a pair of production schemes the admin team suspects are behaviourally equivalent


---

## Q-020 catalogue-comparison follow-ons (Q-022 – Q-026)

Opened 2026-05-28. All five surfaced by [`audits/q020-external-fields-20260528.md`](../audits/q020-external-fields-20260528.md) §3. Each isolates one accidentally-omitted external field cluster.

### Q-022 — What is the minimal per-scheme provenance schema sufficient to make catalogue-redundancy diagnosis tractable, and where in the substrate should it live?
- **status:** open
- **ring:** middle
- **tier:** engineering (with empirical input from Q-018)
- **method:** enumerate the minimum fields needed to (a) trace a scheme back to its source catalogue (AIF/AIFdb/WRM-2008/admin-authored); (b) tell whether two duplicate-candidate keys (e.g. `expert_opinion` vs `expert-opinion` from Q-018) originate from the same external row; (c) support the [Spec 4](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md) verifier's reasoning about which substrate fields belong in the fingerprint domain. Candidate fields: `sourceCatalogue` (enum), `sourceId` (string), `sourceVersion` (string), `importedAt` (timestamp), `importerVersion` (string). Decide whether these live as columns on `ArgumentScheme` or in a `SchemeProvenance` side-table.
- **how-would-we-know:** positive — every production scheme has provenance recoverable in O(1), and the [Q-018 §3.1](../audits/q018-ontoclean-20260528.md) duplicate-candidate diagnosis becomes a single SQL JOIN; negative — provenance is fundamentally many-to-many (a scheme can have multiple source catalogues with conflicting metadata), forcing a richer model
- **depends-on:** [Q-014](#q-014) (catalogue-ontology framing), Q-018 (which surfaced the diagnostic need)
- **affects-implementation:** [`lib/models/schema.prisma`](../lib/models/schema.prisma) (`ArgumentScheme` extension); [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx) (capture-at-creation); [Spec 4 §3.5](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md) (fingerprint scope decision)
- **bibliography:** [`audits/q020-external-fields-20260528.md`](../audits/q020-external-fields-20260528.md) §3; AIF `hassource` field (Chesñevar et al. 2006); AIFdb `mapId` (Lawrence & Reed 2012); WRM-2008 chapter/section provenance (Walton Reed Macagno 2008)
- **next-action:** draft a one-page schema proposal; review against the three duplicate-candidate pairs identified in Q-018 §3.1

### Q-023 — Which AIF spec version is the substrate's round-trip targeting, and how is version-skew handled?
- **status:** open
- **ring:** outer
- **tier:** engineering
- **method:** inventory [`lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts) against the AIF spec versions (2006 Chesñevar; 2011 extensions; AIF+); decide whether the substrate pins a single version or supports multi-version import with explicit translation
- **how-would-we-know:** positive — round-trip identity (Spec 4 phase 4c) is parameterised by version; negative — version drift causes silent data loss on import
- **depends-on:** Q-020 (surfaced); Q-022 (provenance schema would carry version)
- **affects-implementation:** [`lib/aif/syncArgument.ts`](../lib/aif/syncArgument.ts); [Spec 4 phase 4c](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md)
- **bibliography:** Chesñevar et al. 2006; AIF Ontology Working Group post-2006 extensions; [`audits/q020-external-fields-20260528.md`](../audits/q020-external-fields-20260528.md) §3 Q-023 paragraph
- **next-action:** grep `lib/aif/` for version literals; decide pin vs. translate

### Q-024 — Should `ArgumentScheme` carry `createdAt`, `updatedAt`, and `createdBy` columns?
- **status:** open
- **ring:** outer
- **tier:** engineering
- **method:** assess data-migration impact of adding three columns; decide whether to backfill from Postgres write-ahead log or leave NULL for pre-existing rows; verify no schema readers assume their absence
- **how-would-we-know:** positive — chronological auditing of catalogue evolution becomes a SQL window query; the [Q-019 audit](../scripts/audits/audit-inherit-cqs-false.ts) blocker (no `createdAt` to order by) is dissolved; negative — backfill is cost-prohibitive or schema-readers break
- **depends-on:** Q-020 (surfaced); independent of Q-022 in principle but pairs naturally
- **affects-implementation:** [`lib/models/schema.prisma`](../lib/models/schema.prisma); audit scripts under [`scripts/audits/`](../scripts/audits/)
- **bibliography:** [`audits/q020-external-fields-20260528.md`](../audits/q020-external-fields-20260528.md) §3 Q-024 paragraph
- **next-action:** Prisma migration draft; assess backfill plan

### Q-025 — Does the substrate gain expressive power from an explicit `isAxiomatic` flag on `CriticalQuestion`, or is Carneades `premiseType` sufficient?
- **status:** open (likely-closed-in-favour-of-premiseType)
- **ring:** outer
- **tier:** formal
- **method:** map the ASPIC+ K_n / K_p / K_a / K_i premise classification onto Carneades's `premiseType ∈ {ordinary, assumption, exception}`; identify cases where the mappings collapse information; assess whether [Spec 3](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) phase 3d defaults are sufficient or whether an explicit flag would surface invariants
- **how-would-we-know:** positive — Carneades `premiseType` is provably as expressive as ASPIC+ axiomatic/non-axiomatic in the substrate's intended use; negative — there exists a worked production case where the two encodings give different protocol-soundness verdicts
- **depends-on:** Q-020 (surfaced); Q-016 (CQ-as-premise typology)
- **affects-implementation:** [Spec 3 phase 3d](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) (premiseType defaults rollout)
- **bibliography:** Modgil & Prakken 2014 *Argument & Computation* 5(1) (ASPIC+ knowledge-base classification); Gordon Prakken Walton 2007 (Carneades premiseType); [`audits/q020-external-fields-20260528.md`](../audits/q020-external-fields-20260528.md) §3 Q-025 paragraph
- **next-action:** worked example pair on `expert_opinion`'s CQs

### Q-026 — Should `ArgumentScheme` add `subjectType` for full Wagemans PTA placement?
- **status:** open
- **ring:** outer
- **tier:** methodological
- **method:** decide whether full Wagemans PTA placement is a substrate goal or a derivation responsibility (e.g. computed at export time from `conclusionType` + `materialRelation` + premise structure); if a substrate goal, add `subjectType` enum to `ArgumentScheme`
- **how-would-we-know:** positive — every catalogue scheme places uniquely in Wagemans's PTA; negative — many schemes are PTA-ambiguous and `subjectType` would be filled with `null` more often than not
- **depends-on:** Q-020 (surfaced)
- **affects-implementation:** [`lib/models/schema.prisma`](../lib/models/schema.prisma); [`components/admin/SchemeCreator.tsx`](../components/admin/SchemeCreator.tsx)
- **bibliography:** Wagemans 2016 PTA (the Periodic Table of Arguments); [`audits/q020-external-fields-20260528.md`](../audits/q020-external-fields-20260528.md) §3 Q-026 paragraph
- **next-action:** spot-check 5 production schemes against PTA placement; assess `null` rate

### Q-027 — Are Reading-A cones $(C_i, \subseteq)$ thick enough to populate the Ambler hom-set, or does the C001b bridge need to be restated against the approximation order $\sqsubseteq$ instead?
- **status:** resolved-negative-with-redirect (2026-05-29) — see [audit](audits/q027-thin-cones-2026-05-29.md). Reading-A cones are *not* thick enough under the per-cone bridge target (Q3 aspirin worked example, both safe and compressed encodings, yields thin cones whose images miss the cross-cone Ambler join). However, the failure is not the `⊆`-vs-`⊑` choice the question anticipated; it is a **level mismatch** in the bridge target. The natural bridge target is `𝒫_fin(Inc(B))` (free JSL on incarnations) rather than the per-cone JSL `Cᵢ`. Under this re-target, `ε` is a JSL iso trivially (free extension of a generator-level bijection `Inc(B) ↔ 𝒞/Γ(A,B)`), respecting Phase 2e Cross-Cone Incompatibility because the set-union operates one level up from designs. Follow-up: C001b to be superseded by C001b′ at the new target; [Q-028a](#q-028a--discovery-is-the-generator-level-bijection-mathsfincb-leftrightarrow-mathcalc_mathrmbasea-bsharp-underlying-the-c001b-bridge-canonical-on-small-instances) (discovery) and [Q-028b](#q-028b--settlement-is-the-generator-level-bijection-forced-uniformly-by-the-f-dashv-u-adjunction-restricted-to-generators-so-that-b_1-wedge-b_2-closes-without-instance-enumeration) (settlement) test canonicality of the generator-level bijection.
- **status-original:** open
- **ring:** core
- **tier:** formal
- **method:** small-cone diagnostic. Pick a concrete cone $(C_i, \subseteq, \cup, D_i)$ with a non-trivial negative-branching structure (e.g. the worked example queued for C001b); enumerate its elements; construct a candidate JSL map $\mathcal{F}(C_i) \to \mathcal{C}_\mathrm{semi}(A, B_i)$ in the Ambler image; check whether the counit $\varepsilon_{A,B_i}: \mathcal{F}(C_i) \to \mathcal{C}_\mathrm{semi}(A, B_i)$ is surjective onto the Ambler hom-set. If yes, the chronicle-set-inclusion order survives. If no, restate the C3/C001b bridge against the approximation order $\sqsubseteq$ (daimon-replacement extension; see [`.../LUDICS_ORDER_RELATION_DEFINITION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md) §7.2) and re-examine T001 under the new order.
- **how-would-we-know:** positive — the diagnostic constructs a surjection on the worked example and the construction is uniform enough to generalise; negative — the diagnostic exhibits an Ambler-side derivation that has no preimage under any candidate $\varepsilon$ from a $\subseteq$-cone, isolating a degree of freedom that only $\sqsubseteq$ supplies (e.g. an Ambler derivation that *replaces* a daimon rather than extending past it).
- **depends-on:** T001 (the per-cone JSL whose order is at issue); flagged by [`.../LUDICS_ORDER_RELATION_DEFINITION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md) §7.2 ("OQ-C3-thin-cones")
- **gates:** [C001b](03_CONJECTURES/C001b-ambler-remainder.md) — the statement of the bridge is parametric in the choice of order; until Q-027 resolves, the C001b iso is not yet well-typed in a way that picks out either $\subseteq$ or $\sqsubseteq$ as the carrier of the JSL fragment on the Ludics side. T001 and T004 are unaffected (they hold in the $\subseteq$ world); only the *Ludics-side input* to the C001b bridge depends on Q-027.
- **affects-implementation:** none directly. If the resolution is $\sqsubseteq$, the implementation-level obligation flagged in [T001 audit](02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md) (quotient or canonicalise representations) extends to a *different* equivalence (modulo daimon-replacement), and the announcement-bus event types in [`.../LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md) inherit a slightly richer ordering.
- **bibliography:** [`.../LUDICS_ORDER_RELATION_DEFINITION.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md) §7.2; [`.../LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) §II.4 (three-case taxonomy of the counit $\varepsilon$); Phase 2f working notes; Ambler 1996 MSCS 6(2)
- **next-action:** *(historical, pre-resolution)* build the small-cone diagnostic on the C001b worked example (≥ 3 cones, ≥ 2 ramifications/cone). If cones populate cleanly under $\subseteq$, close Q-027 positively and proceed to C001b sub-claim b₁ ($\varepsilon$ surjectivity). If they do not, open C001b restatement under $\sqsubseteq$ as a parallel branch and revisit the T001 order convention. **Resolution path actually taken (2026-05-29):** diagnostic executed on Q3 of Ambler Example 1; both safe and compressed encodings yielded thin cones (image misses Ambler join). Rather than redirect to $\sqsubseteq$, the diagnostic surfaced a level-mismatch on the bridge target (per-cone $C_i$ → $\mathcal{P}_{\mathrm{fin}}(\mathsf{Inc}(B))$). Resolution recorded; next action moves to C001b′ supersession (pending authorization) and Q-028 filing.

### Q-028 — (bifurcated 2026-05-29 into Q-028a / Q-028b)

The original Q-028 ("is the generator-level bijection canonical?") asked a single question with a single method (worked-example canonicality test). Re-reading the C001 lineage made clear that worked-example diagnostics are appropriate for **discovery** (catching framing errors) but cannot **settle** a canonicality claim by themselves — the inductive gap from "canonical on N tested cases" to "canonical in general" must be crossed by a uniformity argument, as in C001a's T004 closure. Q-028 has therefore been split into:

- **Q-028a** — discovery via worked-example canonicality test on two strata (the original Q-028 body).
- **Q-028b** — settlement via a meta-argument that the bijection is forced by the $F \dashv U$ adjunction restricted to generators.

A positive Q-028a alone does **not** close C001b′ b₁′ ∧ b₂′ — it merely licenses pursuing Q-028b. A positive Q-028b closes b₁′ ∧ b₂′ uniformly. A negative Q-028a (cardinality mismatch or surviving non-canonicity at low cardinality) refutes both Q-028b and C001b′ in its current form.

### Q-028a — (discovery) Is the generator-level bijection $\mathsf{Inc}(B) \leftrightarrow \mathcal{C}_{\mathrm{base}}(A, B^\sharp)$ underlying the C001b′ bridge canonical on small instances?
- **status:** open (filed 2026-05-29 as Q-028; bifurcated and renamed 2026-05-29)
- **ring:** core
- **tier:** formal
- **method:** worked-example canonicality test on two strata.
  **Stratum 1 (propositional, $|\mathsf{Inc}(B)| \geq 3$):** Construct or adapt one or two Ambler $\mathcal{S}/\Gamma$ instances with at least 3 distinct rule-derivations of a target proposition. Compute both $\mathsf{Inc}(B)$ and $\mathcal{C}/\Gamma(A, B^\sharp)$. Enumerate all candidate bijections. Check whether the bridge data — composition compatibility, $U$-erasure compatibility, daimon-lock structure — forces a unique choice, or whether multiple non-equivalent bijections survive every test the data can apply. **Stratum 2 (higher-order):** Pick a small Ambler instance with at least one $\lambda$-abstraction in the term (e.g. a Church-encoded composition combinator, or an instance with a hypothetical-derivation rule). Check whether the natural generator presentation on the Ludics side (exponential behaviours $B!A$ or function-type loci, per [`.../LUDICS_GENERATIVE_SUBSTRATE.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_GENERATIVE_SUBSTRATE.md)) admits a canonical bijection to Ambler's $\lambda$-term generators.
- **how-would-we-know:** **positive (discovery-positive)** — on each stratum, the bridge data uniquely determines one bijection from $\mathsf{Inc}(B)$ to $\mathcal{C}_{\mathrm{base}}(A, B^\sharp)$ for the instances tested; this *licenses pursuing Q-028b* but does **not** close C001b′ b₁′ ∧ b₂′ by itself. **negative-cardinality** — at some instance $|\mathsf{Inc}(B)| \neq |\mathcal{C}_{\mathrm{base}}(A, B^\sharp)|$, ruling out any bijection and forcing C001b′ to be restated either with a quotient on one side or at yet another bridge level; this also refutes Q-028b *a fortiori*. **negative-non-canonicality** — bijection exists but multiple plausible bijections survive all the bridge-data constraints at low cardinality, indicating the uniqueness Q-028b would seek does not hold (refutes Q-028b; C001b′ needs additional choice data — a *bridge presentation* rather than a canonical bridge).
- **depends-on:** [Q-027](#q-027) (resolved-with-redirect, surfaces the power-set bridge target this question lives at); [T002](02_THEOREMS_AND_PROOFS/T002-design-set-antichain.md) (the antichain $\mathsf{Inc}(B)$ is the canonical generator set on the Ludics side); the [Q-027 audit](audits/q027-thin-cones-2026-05-29.md) §7.1 shape-match table that motivates the question.
- **gates:** [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′ ∧ b₂′ — but only conditionally: discovery-positive Q-028a does not close them. Negative Q-028a does refute C001b′ in its current form.
- **affects-implementation:** the canonical bijection, if it exists, gives a deterministic translation between Ludics behaviours and Ambler argument-sets. This is the actual computational content of the C001b′ bridge — it tells the substrate how to project an `Inc(B)` snapshot into an Ambler-side display or persist Ambler proofs as Ludics designs. Non-canonical resolution would mean the substrate must carry the bridge-presentation choice as data.
- **bibliography:** [Q-027 audit](audits/q027-thin-cones-2026-05-29.md); [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md); Ambler 1996 §2 (definition of $\mathcal{C}/\Gamma$ generators); Fouqueré–Quatrini 2013 LMCS 9(4:6) (uniqueness of incarnation — the Ludics-side generator canonicity).
- **next-action:** Stratum 1 first — construct a 3-derivation propositional example. The aspirin fact-base extended with one extra rule (e.g. a third independent route to aspirin, or a third independent route to `¬aspirin` via a different mechanism) is the natural extension of the existing Q-027 worked example and reuses the Ambler-side enumeration machinery from the audit. Aim: 3 incarnations, 3 base λ-terms, enumerate all 6 bijections, see which (if any) survive composition compatibility. Stratum 1 can be executed in parallel with a first attempt at Q-028b; the two inform each other.

### Q-028b — (settlement) Is the generator-level bijection forced uniformly by the $F \dashv U$ adjunction restricted to generators (so that b₁′ ∧ b₂′ closes without instance enumeration)?
- **status:** partially-resolved (filed 2026-05-29; reduction theorem established same day, [audit](audits/q028b-freeness-argument-2026-05-29.md); residual content is the substrate's commitment to a defeat-encoding $\delta$ plus four stress-tests)
- **status-original:** open
- **ring:** core
- **tier:** formal
- **method:** paper meta-argument. The candidate shape: both sides of the bridge are *free constructions* on a canonical generating set — the Ludics side is the free JSL on $\mathsf{Inc}(B)$ (T002 + Fouqueré–Quatrini uniqueness of incarnation gives canonicality of the generator set), the Ambler side is by construction the free JSL $\mathcal{P}_{\mathrm{fin}}(\mathcal{C}/\Gamma(A,B^\sharp))$ on its base term-set. Maps between free objects on canonical generating sets are determined by maps on generators; show that the $F \dashv U$ adjunction restricted to generators induces a unique map $\mathsf{Inc}(B) \to \mathcal{C}_{\mathrm{base}}(A, B^\sharp)$, with inverse from the unit. The substantive content reduces to: *is the choice of $A_\Gamma$ for a given $B$ canonical?* — a categorical question one level up from the bijection itself. Mechanisation pathway (optional, parallel to C001a/T004): if the paper argument lands, encode in `agda-categories` or `coq-mathcomp` as cross-check.
- **reduction (2026-05-29):** see [`audits/q028b-freeness-argument-2026-05-29.md`](audits/q028b-freeness-argument-2026-05-29.md). The paper argument lands as a **qualified positive**: $\phi : \mathsf{Inc}(B) \to \mathcal{C}/\Gamma(A, B^\sharp)$ is canonical bijection $D \mapsto \delta^{-1}(\mathrm{CH}(\mathrm{DP}(D)))$ — design-as-proof (FQ 2013 §4.2) $\circ$ Curry–Howard (Girard–Lafont–Taylor *Proofs and Types* ch. 8) $\circ$ inverse defeat-encoding — *given four pieces of side data*: (i) $\Gamma$, the defeasible rule-base; (ii) $A$-presentation (quotient-trivial); (iii) polarity-to-evaluation alignment (fixed globally by Ambler 1996 + Girard 2001 conventions); (iv) **$\delta$, the defeat-encoding** — the only genuinely non-trivial choice, at minimum two candidates (defeat-as-negation vs defeat-as-coroutine), not yet committed by the substrate. Structurally analogous to T004's closure of C001a *given a JSL-fragment specification*: in both cases the side data is honest scientific input.
- **how-would-we-know:** **positive (achieved 2026-05-29 modulo side data)** — the adjointness/freeness argument goes through cleanly; the bijection is forced for every $(A, B)$ in the bridge's domain given the four side-data items; this closes C001b′ b₁′ ∧ b₂′ uniformly (parametrically in side data) and reduces the conjecture to b₃′ (the naturality diagram chase). **negative-obstruction** — the argument encounters a definite obstruction at a named step (e.g. "the choice of $A_\Gamma$ is not canonical because …"); the obstruction itself becomes a smaller open question, and Q-028a evidence becomes the primary support for whatever weaker positive claim survives. **negative-restatement** — the argument can only be stated by assuming the bijection it seeks to prove (vicious circularity); this would indicate the categorical vocabulary is not the right settlement vehicle, and C001b′ b₁′ ∧ b₂′ must be settled by a different uniformity argument (e.g. proof-theoretic via cut-elimination on the Ambler $\lambda$-calculus) or accept inductive-only support from Q-028a + a stress-test suite.
- **depends-on:** [Q-027](#q-027); [T002](02_THEOREMS_AND_PROOFS/T002-design-set-antichain.md); [T004](02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) (model for the meta-argument approach; T004 closes C001a by a freeness argument on JSL morphisms out of $\mathbf{2}$); the substrate's $F \dashv U$ framing in [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) Part II.
- **gates:** [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md) b₁′ ∧ b₂′ — settlement-strength gate; positive Q-028b (achieved modulo side data) closes them parametrically in $(\Gamma, A\text{-pres}, \text{pol-align}, \delta)$; b₃′ remains downstream as a naturality diagram chase. [Q-029](#q-029) inherits the side-data parameterisation as its primary content.
- **affects-implementation:** the bijection is implementation-determined by the adjunction *given* a substrate-level commitment to $\delta$. The substrate must commit to a defeat-encoding in [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) Part II for the projection between Ludics and Ambler views to be canonical. Defeat-as-negation is the substrate-default consistent with Phase 2e Cross-Cone Incompatibility; defeat-as-coroutine is a CSP-style alternative. The choice is architectural, not merely presentational.
- **bibliography:** [Q-028b audit](audits/q028b-freeness-argument-2026-05-29.md); [T004 proof](02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) (template for freeness-based settlement); [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) Part II ($F \dashv U$ framing); Kelly 1982 *Basic Concepts of Enriched Category Theory* §1.2 (the confidence-erasure functor's adjoint structure); Mac Lane *CWM* IV.1 (adjoints determine maps on free objects); Fouqueré–Quatrini 2013 LMCS 9(4:6) §4.2 (design-as-proof, incarnation as cut-free-proof quotient); Girard–Lafont–Taylor *Proofs and Types* ch. 8 (Curry–Howard for linear logic); Girard 1987 *TCS* 50 ($!$-translation); Ambler 1996 §3 (defeat operator).
- **next-action:** *(historical, pre-resolution)* attempt the freeness/adjointness argument on paper, aiming for a one-to-two-paragraph proof modelled on T004. The crucial intermediate question to identify first: *given $B$, is $A_\Gamma$ canonical?* — if yes, the rest is bookkeeping; if no, the obstruction is named and Q-028a evidence carries the residual claim. **Resolution path actually taken (2026-05-29):** paper attempt executed; the named critical question's negative answer ("$\Gamma$ is required side data") was informative rather than blocking and produced a four-item side-data taxonomy. Reduction theorem established. **Current next-action:** four stress-tests before promoting to full settlement (audit §9):
  1. Verify the FQ 2013 design-as-proof correspondence extends from MALL to MELL ($!$-translated intuitionistic) on which Ambler's $\lambda$-calculus actually rests. Check FQ 2013 §6 (extensions) or successor papers.
  2. Verify $\delta^{-1}$ remains injective on Ambler instances with nested defeat (`defeat(defeat(π))`). Use the aspirin Q3 case from the Q-027 audit as the smallest non-trivial test.
  3. Verify the polarity-alignment claim by cross-checking Ambler 1996 §2 against Girard *Locus Solum* §10. The substrate doc asserts compatibility; the asserted compatibility should be verified from primary sources.
  4. Verify the reduction's $\phi$ matches the by-hand bijection on a $|\mathsf{Inc}(B)| \geq 3$ instance (this is also Q-028a stratum 1's revised role).
  Once these four are clean, promote Q-028b to `closed-by-proof` modulo a substrate commitment to $\delta$, and consider mechanising the reduction in `agda-categories` for cross-check.

### Q-029 — What is the right categorical home for the Ambler–Ludics bridge's side-data parameterisation?
- **status:** open (filed 2026-05-29)
- **ring:** core
- **tier:** formal
- **method:** paper categorical work. The [Q-028b audit](audits/q028b-freeness-argument-2026-05-29.md) §5 isolated four side-data items the bridge requires: $(\Gamma, A\text{-pres}, \text{pol-align}, \delta)$. Items 2–3 are quotient-trivial or fixed-once; items 1 and 4 are genuine parameters that vary across substrate applications. The bridge from C001b′ is therefore not a single functor $\mathbf{Ludics} \to \mathcal{S}/\Gamma$ but a family of functors indexed by side-data choices. The candidate categorical structures are: (a) a **fibration** with base category whose objects are pairs $(\Gamma, \delta)$ and morphisms are rule-base extensions + defeat-encoding refinements, and fibre over each base object the per-choice bridge functor; (b) an **indexed category** $\mathrm{Bridge} : \mathbf{SideData}^{\mathrm{op}} \to \mathbf{Cat}$ with the same content in pseudofunctorial form; (c) a **double category** with horizontal arrows = bridges and vertical arrows = side-data refinements. Determine which is the right home — likely fibration, given that side-data refinements (e.g. extending $\Gamma$ with new rules) should induce *strict* functorial action on the bridge.
- **how-would-we-know:** **positive** — one of (a)/(b)/(c) admits a clean definition of the morphism part (side-data refinement → bridge transformation), satisfies the expected coherence (composition of refinements composes bridges), and absorbs C001b′ b₃′ as the cleavage/transport law for the fibration. **negative-no-structure** — no categorical home with reasonable coherence exists; the side-data parameterisation must be carried as ad-hoc data on the bridge. **negative-too-rich** — the natural structure is strictly richer than a fibration (e.g. genuinely double-categorical with non-trivial 2-cells) such that C001b′ b₃′'s diagram chase becomes a 2-cell coherence problem rather than a 1-cell naturality square.
- **depends-on:** [Q-028b](#q-028b) (audit's §5 isolates the four side-data items); [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md) (b₃′ is the bridge naturality content this question reorganises).
- **gates:** [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md) b₃′ — naturality in $B$ for fixed side data is a within-fibre claim; the full b₃′ content (naturality across side-data refinements + within-fibre) is the cleavage law for the candidate fibration. Positive Q-029 may absorb b₃′ entirely.
- **affects-implementation:** if (a) or (b) lands, the substrate's bridge implementation has a principled type: a fibration object in a suitable categorical infrastructure (e.g. `agda-categories`' `Fibration` record) rather than a parameterised collection of functors. If (c) lands, the substrate needs higher-categorical infrastructure, which is currently out of scope. If negative, the bridge stays parameterised by side-data choices but without a structural home, and downstream code must track side-data items as explicit parameters.
- **bibliography:** [Q-028b audit](audits/q028b-freeness-argument-2026-05-29.md) §5, §8.4; Jacobs 1999 *Categorical Logic and Type Theory* ch. 1 (fibrations of categorical logic over signatures); Bénabou 1985 *Fibred Categories and the Foundations of Naive Category Theory* (the classical reference for fibrations as parameter spaces); Shulman 2008 *Framed Bicategories and Monoidal Fibrations* (double-categorical option); the substrate's $F \dashv U$ adjunction in [`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md).
- **next-action:** before any new categorical work, complete the four Q-028b stress-tests (those may sharpen which side-data items are substantive and which are quotient-trivial, affecting the base-category definition). Then attempt option (a): define a fibration with base $(\Gamma, \delta)$, total category $\bigsqcup_{(\Gamma, \delta)} \mathrm{Bridge}_{(\Gamma, \delta)}$, and check whether substrate-natural refinements (extending $\Gamma$ with a new rule; refining $\delta$) induce strict cartesian morphisms.
