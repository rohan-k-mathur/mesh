# SCHEMES_LITERATURE_REVIEW.md

**Conceptual track:** Argumentation Schemes Theoretical Foundations
**Platform:** Isonomia / Mesh deliberative-democracy substrate
**Date:** 2026-05-27
**Author:** Lead research, Schemes track

---

## 0. Status of this document relative to the ontology decision

**This document is the literature half of a two-pass research programme on
the schemes admin.** The formal-decision half runs in a separate session
governed by [`SCHEMES_ONTOLOGY_DECISION_PROMPT.md`](SCHEMES_ONTOLOGY_DECISION_PROMPT.md)
and produces `SCHEMES_ONTOLOGY_DECISION.md`. The recommendations in §1
(layered position with C006 as semantic ground truth), §10 (Q1–Q7
recommendations), and the closing paragraph of §7 (Bucket 6) are this
literature pass's **prior**, not a **verdict**. They are written to brief
the decision session, not to pre-empt it.

The decision session is required to run its own coherence check
([SCHEMES_ONTOLOGY_DECISION_PROMPT.md §5 Step 1](SCHEMES_ONTOLOGY_DECISION_PROMPT.md#5-decision-strategy))
independently of this document's recommendations and is permitted to land
on any of three outcomes (layered coherent; trilemma real with C006
winning; trilemma real with C006 losing). The decision prompt's §0.3
already encodes the same prior; this document's role is to *back* that
prior with empirical literature findings, not to certify it.

**Two downstream changes since this lit review was filed.** (i) The
fourth-attack-category claim introduced in §10 Q5 has been promoted to
its own programme entry: [C009 — scheme-rivalry as fourth attack
category](../../RESEARCH_PROGRAMME/03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md)
+ [Q-016](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md). It
should not be smuggled into the decision session's verdict on
C006/C007/C008. (ii) The seven open research questions in §11 have been
filed into the programme as Q-017 – Q-020 plus S005 and S006 (§11.3 was
already Q-015). The §11 list remains here as a literature-side summary;
the registry entries are the canonical owners.

---

## 1. Executive Summary

**Top-line.** The substrate's three-way trilemma — scheme-as-behaviour (C006), scheme-as-design-schema (C007), scheme-as-protocol-constraint (C008) — has **no published precedent that adjudicates among the three readings as mutually exclusive options.** No prior treatment of Walton-style argumentation schemes formalises schemes as $\bot\!\!\bot$-closed behaviours of designs in Girard's Ludics; no prior treatment formalises scheme identity as a locus tree with typed holes; and no prior treatment identifies the scheme itself (rather than its critical questions or its rule) as the protocol fragment. The Ludics-meets-Walton sub-bucket is **confirmed null**: the adjacent literature (Lecomte–Quatrini 2009/2011, Fouqueré–Quatrini 2012/2013) applies Ludics to dialogue acts and natural-language semantics, not to Walton schemes or their critical-question bundles.

**Most consequential finding per cluster.**

- **Cluster A (ontology of schemes, SC1–SC5).** No source commits to any of C006/C007/C008 in the strong sense required by the substrate. All extant traditions treat schemes representationally (Walton/Macagno-Walton 2015 as taxonomic species; AIF as RA-node-with-rule; ASPIC+ as defeasible rule). SC4 (mutual exclusivity) is **original to this track**: no source even poses the question.
- **Cluster B (critical questions, SC6–SC9).** The Pollock trichotomy remains canonical; Hahn & Hornikx 2016 proposes a Bayesian *grading* of attacks, not a fourth attack category. CQ-as-loci is novel. The static/procedural conflation in SC9 is partially documented by Walton & Godden 2005, but not framed as a typing error.
- **Cluster C (inheritance, SC10–SC13).** Macagno-Walton 2015 uses an informal Linnaean species-of hierarchy with "added" premises and CQs — neither set-theoretic union nor behaviour refinement is stated formally. Opt-out (SC12) and non-vacuity (SC13) are unaddressed.
- **Cluster D (identification, SC14–SC16).** Reliable kappa benchmarks exist (Visser et al. 2020: Cohen's $\kappa = 0.723$ for Walton's taxonomy on a 505-inference sample; $\kappa = 0.689$ for Wagemans' PTA; $\kappa = 0.851$ for the predicate/subject sub-task). State-of-the-art scheme mining is Ruiz-Dolz, Kikteva & Lawrence (ACL 2025) with macro-F1 = 62.3 on the 8-class scheme-family task. Pattern-vs-content ablation has **not** been published.
- **Cluster E (catalogue, SC17–SC19).** No formal well-formedness rules for new schemes exist in Walton-school literature. Ontology-engineering methodology (OntoClean) has **not** been applied to scheme catalogues. The folksonomy/ontology framing is **original to this track**.
- **Cluster F (composition, SC20–SC23).** AIF's shared-node representation remains the only published account of scheme composition; ASPIC+ subsumes it under rule chaining without distinction. The cut-of-designs correspondence (SC22) is **original to this track**.

**Three most consequential gaps.**
1. **SC4 — mutual exclusivity of C006/C007/C008.** No prior art exists. The substrate's choice between extensional, intensional, and protocol-extensional identity is genuinely novel.
2. **SC22 — scheme composition as cut composition of designs.** The Faggian–Hyland (2002) and Terui (2011) machinery is mathematically suited but has never been applied to schemes.
3. **SC18/SC19 — schemes as engineered ontology, not folksonomy.** OntoClean meta-properties (rigidity, identity, unity, dependence) have never been applied to scheme catalogues, despite obvious applicability to the substrate's `/admin/schemes` surface.

**Verdict on the C006/C007/C008 trilemma.** The Reading-C commitment of the substrate biases toward **C006 (scheme-as-behaviour)** because behaviours are the primary semantic object in Girard's Ludics ($\mathbf{G} = \mathbf{G}^{\bot\bot}$). C007 (locus-tree-with-holes) is a *presentation* of a behaviour, not a rival ontology; C008 (protocol-fragment) is a *projection* of a behaviour onto the room's dialogue protocol. We recommend a **layered position**: C006 is the metaphysical primitive, C007 is the syntactic presentation, C008 is the procedural shadow. This position has no published precedent (SC4) and is therefore an original contribution of the track.

---

## 2. Bucket 1 — Walton / Macagno-Walton Primary Literature

### Narrative summary

The Walton tradition treats argumentation schemes as **stereotypical patterns of presumptive reasoning** with two parts: a premise–conclusion form and a set of critical questions (CQs) (Walton 1996; Walton, Reed & Macagno 2008, hereafter WRM 2008). The WRM 2008 compendium contains **96 schemes in total** (per Cambridge University Press's publisher description: *"a systematic analysis of many common argumentation schemes and a compendium of 96 schemes"*), with the main Chapter 9 catalogue listing 60+ widely cited ones, spanning expert opinion, position to know, sign, cause-to-effect, analogy, classification, practical reasoning, and the traditional fallacy-derived schemes (ad hominem, slippery slope, ad populum). Critical questions are presented in *prose lists*; they shift the burden of proof back to the proponent if asked (the dialogical interpretation).

Macagno & Walton 2015 ("A Classification System for Argumentation Schemes", *Argument and Computation* 6(3):219–245) is the canonical paper on **inter-scheme structure**. The classification combines a top-down semantic-relations criterion with a bottom-up cluster criterion. Schemes are grouped into clusters (knowledge-based, source-based, practical, causal, value-based) and arranged in species-of relationships. The paper does **not** offer a formal semantics for the parent–child relation: a sub-scheme is presented as a *species* of its parent that "adds" further premises or CQs. Macagno, Walton & Reed 2017 (*IfCoLog J.* 4(8):2493–2556) reproduces these passages verbatim, e.g. "value-based practical reasoning is a species of instrumental practical reasoning with argument from values added on to it"; "the basic slippery slope argument is a species of argument from negative consequences, [which is] in turn built partly from the scheme for argument from values." This is a Linnaean taxonomy, not an algebra.

Walton & Godden 2005 ("The Nature and Status of Critical Questions in Argumentation Schemes", OSSA proceedings; expanded in Godden & Walton 2007, *Informal Logic*) is the paper most often cited as raising unsolved problems about CQs: their argumentative effects, their relation to burden of proof, and their representation in argument diagrams. The paper distinguishes assumption-CQs (whose answer the proponent must defend if challenged) from exception-CQs (whose burden lies on the questioner), and explicitly leaves the formal status open.

No Walton-school source proposes well-formedness rules for new schemes; the catalogue grows by accretion (Walton 1996 → WRM 2008 → Macagno-Walton 2015 → Hernández 2023). Blair 2001 (*Argumentation* 15(4):365–379) and Lumer 2022 (*Informal Logic* 44(1):203–290) are the standard epistemological critiques, both observing that the catalogue lacks principled inclusion criteria. Walton & Macagno 2015 themselves explicitly describe their classification as "a provisional hypothesis that should be subject to improvement as further empirical and analytical work on schemes classification continues."

### Status of substrate claims

- **SC1 (no scheme-as-behaviour reading in Walton).** **Confirmed.** No Walton-school source treats schemes as $\bot\!\!\bot$-closed sets of designs. WRM 2008 and Macagno-Walton 2015 are explicitly representational. Closest analog in the broader field: Caminada labelling semantics treats arguments (not schemes) extensionally; Verheij DefLog (Verheij 2003) treats defeasible support extensionally via dialectical negation $\rightsquigarrow\times$. Neither targets schemes.
- **SC4 (mutual exclusivity of C006/C007/C008).** **Original to this track.** No Walton-school source poses, let alone adjudicates, the trilemma. The closest move is Macagno-Walton 2015's distinction between "representing what an argument is" and "representing how it is understood and interpreted" (from the SSRN abstract of "Classifying the Patterns of Natural Arguments"), which gestures at intensional vs. extensional readings but does not formalise either.
- **SC10 (Macagno-Walton 2015 inheritance semantics).** **Partially confirmed.** The paper introduces clusters and parent–child species-of relationships, but **does not commit to a formal semantics** of CQ inheritance. The companion paper (Macagno, Walton & Reed 2017) makes the additive reading explicit: a sub-scheme has its parent's premises and CQs plus extra ones ("species of … with X added on"). This is informal set-theoretic union by default, but is not stated as a formal commitment.
- **SC11 (no behaviour-theoretic inheritance).** **Confirmed.** Macagno-Walton 2015 and successors are set-theoretic by default. No source proposes $\mathbf{C} \subseteq \mathbf{P}$ in any orthogonality-closure sense.
- **SC12 (opt-out from inherited CQs).** **Open / no prior art.** No Walton-school source addresses what it means for a sub-scheme to *suppress* a parent CQ. The taxonomy is purely additive.
- **SC13 (non-vacuity as well-formedness).** **Original to this track.** No prior work treats scheme non-vacuity (the set of designs surviving all CQs played as opponent being non-empty) as a well-formedness condition. The question cannot even be posed without a behaviour-theoretic substrate.
- **SC17 (well-formedness rules for new schemes).** **Open / no prior art on the four substrate criteria.** Blair 2001 and Lumer 2022 critique the *catalogue* for lacking inclusion criteria, but neither proposes operational rules. Walton & Macagno 2015 explicitly disclaim closure ("a provisional hypothesis…").

---

## 3. Bucket 2 — Pollock and Post-Pollock Attack Typology

### Narrative summary

Pollock's distinction (Pollock 1987 *Cognitive Science*; Pollock 1995 *Cognitive Carpentry*) between **rebutting defeaters** (attacking the conclusion) and **undercutting defeaters** (attacking the premise-to-conclusion link) is the canonical trichotomy when combined with **undermining defeaters** (attacking premises themselves) — although Pollock himself oscillated between two-way and three-way taxonomies. ASPIC+ (Modgil & Prakken 2014, *Argument and Computation* 5(1):31–62) formalises the three-way distinction at the level of arguments: rebuttal targets the conclusion of a defeasible top rule; undermining targets an ordinary premise; undercutting targets the application of the defeasible inference rule itself.

ASPIC+'s premiseType $\in \{$ORDINARY, ASSUMPTION, EXCEPTION$\}$ is a **typing of the rule's premises**, not of the dialogical move that contests them. An ordinary premise can be undermined; an axiom premise cannot; an assumption is defeasible. The typing is therefore *static* (about the knowledge base) whereas burden-of-proof rules in Walton-school dialogue protocols are *procedural* (about who must defend what in which turn).

The Pollock trichotomy is widely treated as exhaustive. Amgoud & Nouioua 2015 ("Undercutting in argumentation systems", SUM 2015) argue undercutting alone suffices to encode rebuttal; this is a *reductive* move that collapses the typology, not a fourth category. Hahn & Hornikx 2016 ("A normative framework for argument quality", *Synthese* 193(6):1833–1873) integrate scheme-based and Bayesian frameworks; their proposal is to *grade* attacks probabilistically, not to add a new attack relation. Verheij 2003 ("DefLog", *J. Logic and Computation* 13(3):319–346) collapses Pollock's two primitives into a single dialectical negation, again reductive rather than expansive. Tiozzo 2024 (*Ratio* 37(2-3):145–155) sub-divides undercutters into *substantive* and *structural*, refining category 2 without expanding the trichotomy.

### Status of substrate claims

- **SC6 (post-2015 fourth attack category).** **Partially confirmed — none proposed.** No post-2015 source proposes a *fourth* Pollock-style attack category. Hahn & Hornikx 2016 propose Bayesian grading within the trichotomy; Amgoud & Nouioua 2015 propose collapse to a single relation; Tiozzo 2024 distinguishes *substantive vs. structural* undercutting, but this is a sub-division of category 2, not a fourth category. Searches did not surface Doutre/Herzig/Perrussel 2023 directly; their epistemic-argumentation line develops modal extensions of Dung frameworks but, on best available evidence, does not add a fourth attack type. **Confirmed null for a published fourth category.**
- **SC7 (CQs as required opponent loci in Ludics sense).** **Original to this track.** Walton & Godden 2005 and successors treat CQs as *moves* the opponent *may* make. The Ludics-theoretic reading (CQs as obligatory opponent loci that the proponent must have answers for in every design in the behaviour) has no prior published statement.
- **SC8 (CQ-of-CQ regress).** **Open / informally raised, not formally answered.** Walton & Godden 2005 raise the question explicitly in §6 of the OSSA paper, but offer no formal answer. Hernández 2023 (*Argumentation* 37(3):377–395, "Disentangling Critical Questions from Argument Schemes") returns to the question and argues for treating CQs as separate from schemes, but again does not give a formal recursive structure.
- **SC9 (static/procedural conflation in ASPIC+ premiseType vs admin's burdenOfProof).** **Partially confirmed.** Walton & Godden 2005 explicitly observe the misalignment between Walton's CQ types (assumption vs exception) and dialogical burden of proof. But the static-vs-procedural framing is not stated as a typing error in any published source; the substrate's framing is the sharpest version.

---

## 4. Bucket 3 — Computational Scheme Handling

### Narrative summary

The Argument Interchange Format (AIF; Chesñevar, McGinnis, Modgil, Rahwan, Reed, Simari, South, Vreeswijk & Willmott 2006, *Knowledge Engineering Review* 21(4):293–316) defines an abstract ontology of nodes: information nodes (I-nodes) and scheme nodes (S-nodes), with three S-node sub-types — rule-of-inference application (RA), preference application (PA), and conflict application (CA). The AIF specification explicitly states: *"a particular scheme node uses (or instantiates) a particular scheme. The AIF thus provides an ontology for expressing schemes and instances of schemes, and constrains the latter to the domain of the former via the function uses."* The scheme is thus an **ontology class**, not a design and not a protocol fragment. Variables are present implicitly (a scheme is instantiated by binding its descriptors to concrete I-nodes) but the spec does not commit to a unification-over-locus-trees semantics.

ASPIC+ (Modgil & Prakken 2014) treats schemes as defeasible inference rules and inherits no notion of "scheme composition" distinct from rule chaining. A chain $A \xrightarrow{r_1} B \xrightarrow{r_2} C$ is just two rule applications; there is no algebraic operation on schemes themselves. Bex, Prakken, Reed & Walton (variously 2003, 2012, 2013) embed schemes within ASPIC+ as named defeasible rules but again do not formalise composition.

Snaith & Reed 2017 (TOAST, the online ASPIC+ implementation, demonstrated at COMMA) implements ASPIC+ with named defeasible rules but does not expose a separate scheme-composition operator. Lawrence & Reed 2015 ("Combining Argument Mining Techniques", 2nd ArgMining Workshop) and Lawrence & Reed 2016 (COMMA, "Argument Mining Using Argumentation Scheme Structures") use scheme structure to *constrain* mining classifiers — implicit recognition that schemes carry exploitable structure — but treat schemes as labels, not as composable objects.

### Status of substrate claims

- **SC2 (no scheme-as-design-schema reading).** **Confirmed.** The closest analog is AIF's RA-node with descriptors (Chesñevar et al. 2006), but AIF does not commit to a locus-tree structure, does not provide unification, and treats the descriptors as informal placeholders. Visser et al. 2020 treats schemes as labels on the inference relation, not as schemata in the unification-theoretic sense.
- **SC3 (no scheme-as-protocol-constraint reading).** **Confirmed.** The closest analogs are Hamblin 1970 commitment-store rules, Mackenzie 1979 DC, Walton & Krabbe 1995 PPD, Prakken 2005 ("Coherence and Flexibility", *J. Logic and Computation* 15:1009–1040), and McBurney, Parsons & Wooldridge 2002 ("Desiderata for agent argumentation protocols", AAMAS). In all of these, the *protocol* extends a dialogue with locutions for arguing-and-questioning, but the *scheme* is a labelled rule embedded *within* the protocol's information state, not the protocol fragment itself.
- **SC11 (no behaviour-theoretic scheme inheritance).** **Confirmed** (cross-checked from Bucket 1). ASPIC+ rule specialisation is by means of additional preconditions or rule priorities, not by behaviour refinement.
- **SC20 (post-2008 scheme composition beyond AIF's shared node).** **Confirmed null.** AIFdb and Argdown both rely on the AIF shared-node representation; no published formal treatment goes beyond it. Visser, Bex, Reed & Garssen 2011 (*Studies in Logic, Grammar and Rhetoric* 23(36):189–224) explores cross-corpus correspondence but does not compose schemes algebraically.
- **SC21 (ASPIC+ distinguishing scheme composition from rule chaining).** **Confirmed: no distinction.** Modgil & Prakken 2014 treats every scheme as a defeasible rule; chains are sequences of rule applications. No paper in the ASPIC+ literature draws a categorial difference.
- **SC23 (CQ inheritance under composition).** **Confirmed null.** No published source addresses which CQs apply to a chained $S_1; S_2$. The question is well-formed only against a substrate that has named schemes and named CQs and a composition operator — the Walton+AIF combination has the first two but lacks the third.

---

## 5. Bucket 4 — Empirical Scheme Classification

### Narrative summary

Empirical scheme classification began with the WRM 2008 compendium and the Araucaria corpus (Reed & Rowe 2004; Reed 2006). Feng & Hirst 2011 ("Classifying arguments by scheme", ACL HLT 2011, pp. 987–996) is the canonical first attempt: they train per-scheme classifiers on the **five most-frequent Walton schemes in Araucaria — argument from example, argument from cause to effect, practical reasoning, argument from consequences, and argument from verbal classification — which together constitute 61% of total occurrences** (Feng & Hirst 2011, Table 1). They report **one-against-others accuracies of 0.63 – 0.91 and pairwise accuracies of 0.80 – 0.94**, with **practical reasoning at 0.908 the highest single one-against-others result** (argument from example a close second at 0.906). The full Araucaria corpus contains approximately 660 manually annotated arguments from sources such as newspapers and court cases; Feng & Hirst use the Walton-scheme-annotated subset.

The breakthrough on annotation reliability is Visser, Lawrence, Reed, Wagemans & Walton 2020 ("Annotating Argument Schemes", *Argumentation* 35(1):101–139). They annotate the US2016 corpus of televised election debates with two typologies: Walton's taxonomy and Wagemans' Periodic Table of Arguments (PTA). On a 10.2% random sample of 505 inference relations they report **Cohen's $\kappa = 0.723$** for Walton's scheme classification ("substantial agreement" per Landis & Koch 1977). For Wagemans' PTA the overall scheme-level kappa is **$\kappa = 0.689$** (10.4% sample), with sub-tasks: predicate vs. subject argument **$\kappa = 0.851$** (strongest), proposition classification (fact/value/policy) $\kappa = 0.778$, first-order vs. second-order $\kappa = 0.658$. These figures are now the empirical baseline.

State-of-the-art LLM-based scheme mining is Ruiz-Dolz, Kikteva & Lawrence 2025 ("Mining Complex Patterns of Argumentative Reasoning in Natural Language Dialogue", ACL 2025 Long Papers, pp. 7421–7435). They introduce QT-Schemes (441 arguments, 24 schemes, $\kappa = 0.39$ at annotation) and report **macro-F1 = 62.3** on the 8-class scheme-family task using a RoBERTa model pre-trained on the NLAS-Processed synthetic corpus and fine-tuned on dialogue (ROBERTA-AF-PROC-DIAL), and **macro-F1 = 29.4** on the full 24-class task with Llama 3.3 70B in few-shot mode. The pre-training-on-synthetic-schemes signal is the key methodological contribution. SOTA uses **fine-tuning of transformer LMs with synthetic scheme pre-training**, not pattern heuristics and not pure prompt-based classification.

No published study has isolated the contribution of *pattern heuristics* (cue-phrase identification patterns) to scheme-classifier accuracy via ablation against a content-only baseline. The closest is Lawrence & Reed 2016, which uses proposition-type classifiers (i.e., role-of-component) rather than scheme-shape cues.

### Status of substrate claims

- **SC14 (inter-annotator agreement for scheme classification).** **Confirmed with specific figures.** Strongest single result: Visser et al. 2020 report Cohen's $\kappa = 0.851$ for the predicate-vs-subject argument sub-task in Wagemans PTA; strongest scheme-level overall result is $\kappa = 0.723$ for Walton's taxonomy on US2016 (505 inferences, 10.2% sample). Wagemans PTA scheme-level $\kappa = 0.689$. Feng & Hirst 2011 do not report kappa (they report classification accuracy on a pre-annotated corpus). Green 2015 reports a mean *accuracy* of 49% for student annotators on her biomedical scheme set, indicating that without trained annotators agreement is poor. **No study has measured kappa conditional on identification-pattern matching.**
- **SC15 (pattern-vs-content ablation).** **Open / confirmed gap.** No published study tests whether scheme-identification patterns (cue phrases like "expert said", "in my experience") improve classifier accuracy over a content-only baseline. Feng & Hirst 2011 use scheme-specific *features* but do not ablate them against content. This is an actionable research opportunity.
- **SC16 (LLM-based scheme classifier SOTA).** **Confirmed with specific figures.** SOTA is Ruiz-Dolz, Kikteva & Lawrence 2025 at macro-F1 = 62.3 on the 8-class scheme-family task and macro-F1 = 29.4 on the 24-class scheme task. The SOTA method is **fine-tuned transformer LM with synthetic-scheme pre-training (NLAS-Processed)**, not prompt-based and not pattern-based.

---

## 6. Bucket 5 — Ontology Engineering and Folksonomy

### Narrative summary

Ontology-engineering methodology has been developed since Gruber 1993 ("A Translation Approach to Portable Ontology Specifications", *Knowledge Acquisition* 5(2):199–220), through Guarino 1998 ("Formal Ontology and Information Systems", FOIS), to the OntoClean methodology (Guarino & Welty 2002, *Communications of the ACM* 45(2):61–65; expanded in Guarino & Welty 2009, *Handbook on Ontologies* 2nd ed.). OntoClean introduces the meta-properties **rigidity** (an instance of $C$ is necessarily an instance of $C$), **identity** ($C$ supplies an identity criterion), **unity** ($C$ supplies a part–whole structure), and **dependence** (instances of $C$ depend on instances of $D$), and uses constraints among these meta-properties to detect modelling pitfalls in subsumption hierarchies. The 2002 article states the goal directly: *"the process of building or engineering ontologies for use in information systems remains an arcane art form, which must become a rigorous engineering discipline."*

Folksonomy is the contrasting paradigm: bottom-up uncontrolled vocabulary by user tagging (Mathes 2004; Peters 2009). The folksonomy-vs-ontology debate is well-rehearsed in information science.

**Argumentation-scheme catalogues have not been treated as engineered ontologies in the OntoClean sense.** Searches across the AIF literature, Walton-school papers, and the Visser-Lawrence-Wagemans corpus papers find no application of rigidity, identity, unity, or dependence meta-properties to schemes. The closest move is Hitchcock & Wagemans 2011 ("The pragma-dialectical account of argument schemes") which critiques the WRM 2008 catalogue for lack of "formal ordering principles", motivating Wagemans' PTA, but neither paper invokes OntoClean.

The folksonomy/ontology framing is **not present in any published scheme-catalogue paper**. Walton-school catalogues grow by accretion (folksonomy-like in practice) but are not described in those terms; Wagemans PTA aspires to ontology-style closure (factorial typology from a small set of dimensions) but does not use the OntoClean vocabulary.

### Status of substrate claims

- **SC18 (OntoClean applied to argumentation schemes).** **Confirmed null.** No source applies OntoClean meta-properties to argumentation-scheme catalogues. This is a clear gap.
- **SC19 (schemes as folksonomy vs ontology).** **Original to this track.** The framing is implicit in critiques of WRM 2008 (Hitchcock & Wagemans 2011; Blair 2001) but is never made explicit. The substrate's choice is a novel framing.

---

## 7. Bucket 6 — Dialogue Protocol-as-Scheme and Ludics-meets-Walton

### Narrative summary

The dialogue-protocol tradition runs from Hamblin 1970 (*Fallacies*, commitment-store dialectic) through Mackenzie 1979 (DC), Walton & Krabbe 1995 (*Commitment in Dialogue*, PPD and other dialogue types), Prakken 2005 ("Coherence and Flexibility"), Prakken 2006 ("Formal systems for persuasion dialogue", *Knowledge Engineering Review* 21:163–188), and McBurney & Parsons 2009 (the dialogue-protocol survey in Rahwan & Simari, *Argumentation in AI*). In all of these, a **protocol** specifies allowed locutions, turn rules, commitment-store updates, and termination conditions. Schemes are embedded *within* the protocol as named rules whose use enables specific locutions (e.g., "argue $C$ from expert opinion that $E$"). The scheme is not the protocol fragment; the protocol's locution rules govern when and how schemes may be deployed.

Reed and colleagues' work on dialogue games and the AIF dialogue-extension brings schemes and dialogue closer but still keeps them as separate ontological strata: the dialogue ontology contains locutions (assert, challenge, concede, retract); the scheme ontology contains rules.

**Ludics-meets-Walton is the substrate's most strongly hypothesised null result. Confirmed null after directed search.** The published Ludics-and-language line is:

- Girard 2001 ("Locus Solum: From the Rules of Logic to the Logic of Rules", *Math. Structures in Computer Science* 11(3):301–506) — the foundational Ludics paper.
- Faggian & Hyland 2002 ("Designs, Disputes and Strategies", CSL 2002 / Cambridge Tech Report UCAM-CL-TR-535) — relates designs to game-semantic strategies and lays out cut composition. Quote: *"To study the traces of the interactions between designs as primitive leads to an alternative presentation, which is to describe a design as the set of its possible interactions, called disputes."*
- Curien 2005; Terui 2011 ("Computational Ludics", *Theoretical Computer Science* 412(20):2048–2071).
- Lecomte & Quatrini 2009 ("Ludics and its Applications to Natural Language Semantics", WoLLIC 2009, LNAI 5514) — *"sentence meanings are given by the counter-meanings they are opposed to in a dialectical interaction… we shall develop many concepts of Ludics like designs, cut-nets, orthogonality and behaviours (that is sets of designs which are equal to their bi-orthogonal). Behaviours give statements their interactive meaning."*
- Lecomte & Quatrini 2011 ("Figures of Dialogue: A View from Ludics", *Synthese* 183(S1):59–85).
- Fouqueré & Quatrini 2012 ("Ludics and Natural Language: First Approaches", LACL 2012, LNCS 7351).
- Fouqueré & Quatrini 2013 ("Argumentation and Inference: A Unified Approach", *Baltic Int. Yearbook of Cognition, Logic and Communication* 8(4):1–41).
- Basaldella & Faggian (Ludics with repetition, LICS 2009); Basaldella & Terui ("On the meaning of logical completeness", *Logical Methods in Computer Science* 6).
- Lecomte 2011 (*Meaning, Logic and Ludics*, Imperial College Press).

All of this work applies Ludics to dialogue acts (assertion, denegation, interrogation), Schopenhauer-style argumentative figures, narrative discourse, and natural-language semantics — **not to Walton-style argumentation schemes or to critical-question bundles as ludical loci**. Fouqueré–Quatrini 2013 comes closest: it relates ludical orthogonality to "argumentation" in the dialogue-act sense, but does not engage with the Walton catalogue, scheme inheritance, or critical questions. The Quatrini line explicitly aligns ludical assertion with *Walton's* assertion (citing Walton in the framework of Lecomte–Quatrini 2011), but Walton is cited there for the speech-act theory of assertion, not for argumentation schemes.

### Status of substrate claims

- **SC3 (no scheme-as-protocol-constraint reading).** **Confirmed** (Bucket 3 corroboration). In Hamblin/Mackenzie/Prakken/McBurney-Parsons, the *protocol* extends the dialogue, and *schemes* are rules used within the protocol; no source identifies the scheme with a protocol fragment.
- **SC5 (any non-representational stance on what a scheme IS).** **Confirmed null.** All extant accounts (Walton, WRM, Macagno-Walton, AIF, ASPIC+, DefLog, Wagemans PTA) treat schemes representationally — as patterns/rules/classes. None treats schemes as interactional behaviours.
- **SC7 (CQs as required opponent loci).** **Original to this track** (cross-listed from Bucket 2). No source formalises CQs as obligatory opponent loci in the ludical sense.
- **SC22 (scheme composition $\equiv$ cut composition of designs).** **Original to this track.** Faggian-Hyland 2002 and Terui 2011 provide the cut-of-designs machinery but no published work applies it to Walton schemes. The correspondence is mathematically motivated but unprecedented.
- **SC25 (Reading-C bias toward ontology consistent with any published metaphysics of inference rules?).** **Partially confirmed.** The Reading-C / behaviour-centric stance aligns with Brandom's inferentialism (*Making It Explicit* 1994) and with Peregrin's *Inferentialism: Why Rules Matter* (2014), both of which treat inference rules as constituted by their role in scorekeeping practices rather than by their syntactic form. Neither is cited in the Walton-school literature, but both are clearly available as philosophical backing for an ontology-over-folksonomy stance on schemes. This is **partially confirmed** as philosophical precedent, not direct precedent.

---

## 8. Reference Cluster Index

### Bucket 1 — Walton primary
1. **Walton 1996.** *Argumentation Schemes for Presumptive Reasoning.* Erlbaum. — Foundational. 25 schemes with CQs. Establishes the scheme-as-pattern reading. (SC1, SC17.)
2. **Walton, Reed & Macagno 2008.** *Argumentation Schemes.* Cambridge UP. — Canonical compendium (96 schemes total; Ch. 9 catalogue: 60+). The substrate's CQ-bundle commitments derive from here. (SC1, SC4, SC17, SC24.)
3. **Walton & Godden 2005.** "The Nature and Status of Critical Questions in Argumentation Schemes." OSSA Proc. — Raises CQ-of-CQ regress; static-vs-procedural framing. (SC8, SC9.)
4. **Godden & Walton 2007.** "Advances in the Theory of Argumentation Schemes and Critical Questions." *Informal Logic* 27(3). — Expansion of OSSA paper. (SC8, SC9.)
5. **Macagno & Walton 2015.** "A Classification System for Argumentation Schemes." *Argument and Computation* 6(3):219–245. — Linnaean taxonomy. Inheritance is informal/additive. (SC10, SC11, SC12, SC13.)
6. **Macagno, Walton & Reed 2017.** "Argumentation Schemes: History, Classifications, and Computational Applications." *IfCoLog J.* 4(8):2493–2556. — Reprises 2015 system; provides the verbatim "species of … with X added on" inheritance language. (SC10.)
7. **Macagno 2015.** "A Means-End Classification of Argumentation Schemes." In van Eemeren & Garssen (eds.), *Reflections on Theoretical Issues in Argumentation Theory.* Springer, pp. 183–201. (SC10.)
8. **Blair 2001.** "Walton's *Argumentation Schemes for Presumptive Reasoning*: A Critique." *Argumentation* 15(4):365–379. — Standard critique; notes lack of inclusion criteria. (SC17.)
9. **Lumer 2022.** "An Epistemological Appraisal of Walton's Argument Schemes." *Informal Logic* 44(1):203–290. — Detailed epistemic critique. (SC17.)
10. **Hernández 2023.** "Disentangling Critical Questions from Argument Schemes." *Argumentation* 37(3):377–395. — Argues CQs should be separated from schemes. (SC8.)
11. **Walton 2005.** "Justification of Argumentation Schemes." *Australasian J. of Logic* 3:1–13. (SC17.)

### Bucket 2 — Pollock / post-Pollock attack
12. **Pollock 1987.** "Defeasible Reasoning." *Cognitive Science* 11(4):481–518. (SC6.)
13. **Pollock 1995.** *Cognitive Carpentry.* MIT Press. (SC6.)
14. **Modgil & Prakken 2014.** "The ASPIC+ Framework: a Tutorial." *Argument and Computation* 5(1):31–62. (SC9.)
15. **Modgil & Prakken 2013.** "A General Account of Argumentation with Preferences." *Artificial Intelligence* 195:361–397. (SC9.)
16. **Hahn & Hornikx 2016.** "A Normative Framework for Argument Quality: Argumentation Schemes with a Bayesian Foundation." *Synthese* 193(6):1833–1873. (SC6.)
17. **Amgoud & Nouioua 2015.** "Undercutting in Argumentation Systems." SUM 2015. (SC6.)
18. **Tiozzo 2024.** "Dualism about Undercutting Defeat." *Ratio* 37(2-3):145–155. (SC6.)
19. **Verheij 2003a.** "DefLog: on the Logical Interpretation of Prima Facie Justified Assumptions." *J. Logic and Computation* 13(3):319–346. (SC1, SC6.)
20. **Verheij 2003b.** "Dialectical Argumentation with Argumentation Schemes: An Approach to Legal Logic." *AI and Law* 11(1–2):167–195. (SC1.)

### Bucket 3 — Computational scheme handling
21. **Chesñevar, McGinnis, Modgil, Rahwan, Reed, Simari, South, Vreeswijk & Willmott 2006.** "Towards an Argument Interchange Format." *Knowledge Engineering Review* 21(4):293–316. (SC2, SC20.)
22. **Rahwan, Zablith & Reed 2007.** "Laying the Foundations for a World Wide Argument Web." *Artificial Intelligence* 171:897–921. (SC2.)
23. **Reed & Rowe 2004.** "Araucaria: Software for Argument Analysis." *International Journal on Artificial Intelligence Tools* 13(4):961–980. (SC14.)
24. **Snaith & Reed 2017.** "TOAST: Online ASPIC+ Implementation." COMMA demo. (SC2.)
25. **Bex, Prakken, Reed & Walton 2003.** "Towards a Formal Account of Reasoning about Evidence." *AI and Law* 11(2–3):125–165. (SC20.)
26. **Visser, Bex, Reed & Garssen 2011.** "Correspondence between the Pragma-Dialectical Discussion Model and the AIF." *Studies in Logic, Grammar and Rhetoric* 23(36):189–224. (SC20.)
27. **Walton, Reed & Macagno AIF-RDF specification.** arg-tech.org. (SC24.)

### Bucket 4 — Empirical scheme classification
28. **Feng & Hirst 2011.** "Classifying Arguments by Scheme." ACL HLT 2011, pp. 987–996. — Five most-frequent Araucaria schemes; accuracies 0.63–0.91 one-against-others; practical reasoning highest at 0.908. (SC14, SC15.)
29. **Lawrence & Reed 2015.** "Combining Argument Mining Techniques." 2nd ArgMining Workshop. (SC15, SC16.)
30. **Lawrence & Reed 2016.** "Argument Mining Using Argumentation Scheme Structures." COMMA 2016. (SC15.)
31. **Lawrence & Reed 2019.** "Argument Mining: A Survey." *Computational Linguistics* 45(4):765–818. (SC14, SC16.)
32. **Visser, Lawrence, Reed, Wagemans & Walton 2020.** "Annotating Argument Schemes." *Argumentation* 35(1):101–139. — $\kappa = 0.723$ (Walton); $\kappa = 0.689$ (PTA); $\kappa = 0.851$ (predicate/subject sub-task). (SC14.)
33. **Ruiz-Dolz, Alemany, Heras Barberá & García-Fornes 2021.** "Transformer-Based Models for Automatic Identification of Argument Relations." *IEEE Intelligent Systems* 36(6):62–70. (SC16.)
34. **Ruiz-Dolz, Kikteva & Lawrence 2025.** "Mining Complex Patterns of Argumentative Reasoning in Natural Language Dialogue." ACL 2025 Long Papers, pp. 7421–7435. — QT-Schemes (441 args, 24 schemes); SOTA macro-F1 = 62.3 on 8-class scheme-family task. (SC16.)
35. **Ruiz-Dolz & Lawrence 2023.** "Detecting Argumentative Fallacies in the Wild." 10th ArgMining Workshop. (SC16.)
36. **Green 2015.** Biomedical custom-scheme guidelines; 49% mean student annotator accuracy. (SC14.)
37. **Gemechu, Ruiz-Dolz, Górska et al. 2025.** "The Open Argument Mining Framework." ACL 2025. (SC16.)

### Bucket 5 — Ontology engineering and folksonomy
38. **Gruber 1993.** "A Translation Approach to Portable Ontology Specifications." *Knowledge Acquisition* 5(2):199–220. (SC18.)
39. **Guarino 1998.** "Formal Ontology and Information Systems." FOIS 1998. (SC18.)
40. **Guarino & Welty 2002.** "Evaluating Ontological Decisions with OntoClean." *Communications of the ACM* 45(2):61–65. (SC18.)
41. **Guarino & Welty 2009.** "An Overview of OntoClean." In Staab & Studer (eds.), *Handbook on Ontologies* 2nd ed. Springer. (SC18.)
42. **Mathes 2004.** "Folksonomies — Cooperative Classification and Communication through Shared Metadata." (SC19.)
43. **Peters 2009.** *Folksonomies: Indexing and Retrieval in Web 2.0.* De Gruyter Saur. (SC19.)
44. **Hitchcock & Wagemans 2011.** "The Pragma-Dialectical Account of Argument Schemes." Proc. ISSA 2010. (SC17, SC18.)
45. **Wagemans 2016.** "Constructing a Periodic Table of Arguments." OSSA 2016. (SC18, SC19.)

### Bucket 6 — Dialogue protocols and Ludics
46. **Hamblin 1970.** *Fallacies.* Methuen. (SC3.)
47. **Mackenzie 1979.** "Question-Begging in Non-Cumulative Systems." *J. Philosophical Logic* 8:117–133. (SC3.)
48. **Walton & Krabbe 1995.** *Commitment in Dialogue.* SUNY Press. (SC3.)
49. **Prakken 2005.** "Coherence and Flexibility in Dialogue Games for Argumentation." *J. Logic and Computation* 15:1009–1040. (SC3.)
50. **Prakken 2006.** "Formal Systems for Persuasion Dialogue." *Knowledge Engineering Review* 21(2):163–188. (SC3.)
51. **McBurney & Parsons 2009.** "Dialogue Games for Agent Argumentation." In Simari & Rahwan (eds.), *Argumentation in AI.* Springer. (SC3.)
52. **McBurney, Parsons & Wooldridge 2002.** "Desiderata for Agent Argumentation Protocols." AAMAS 2002. (SC3.)
53. **Girard 2001.** "Locus Solum: From the Rules of Logic to the Logic of Rules." *Math. Structures in Computer Science* 11(3):301–506. (SC22.)
54. **Faggian & Hyland 2002.** "Designs, Disputes and Strategies." CSL 2002 / Cambridge Tech Report UCAM-CL-TR-535. (SC22.)
55. **Terui 2011.** "Computational Ludics." *Theoretical Computer Science* 412(20):2048–2071. (SC22.)
56. **Lecomte & Quatrini 2009.** "Ludics and its Applications to Natural Language Semantics." WoLLIC 2009, LNAI 5514. (Null for SC22.)
57. **Lecomte & Quatrini 2011.** "Figures of Dialogue: A View from Ludics." *Synthese* 183(S1):59–85. (Null for SC22.)
58. **Fouqueré & Quatrini 2012.** "Ludics and Natural Language: First Approaches." LACL 2012, LNCS 7351. (Null for SC22.)
59. **Fouqueré & Quatrini 2013.** "Argumentation and Inference: A Unified Approach." *Baltic Int. Yearbook of Cognition, Logic and Communication* 8(4):1–41. (Null for SC22.)
60. **Lecomte 2011.** *Meaning, Logic and Ludics.* Imperial College Press. (Null for SC22.)
61. **Basaldella & Terui 2010.** "On the Meaning of Logical Completeness." *Logical Methods in Computer Science* 6. (SC22.)
62. **Brandom 1994.** *Making It Explicit.* Harvard UP. (SC25.)
63. **Peregrin 2014.** *Inferentialism: Why Rules Matter.* Palgrave. (SC25.)

---

## 9. Concrete Revisions to SCHEMES_THEORETICAL_FOUNDATIONS.md

1. **Add a Reading-A/B/C disclosure block** at the top noting that the trilemma C006/C007/C008 has no published prior art (SC4). State the layered position (C006 metaphysical primitive; C007 syntactic presentation; C008 procedural shadow) explicitly and label it original.
2. **Replace the implicit assumption that Macagno-Walton 2015 commits to set-theoretic CQ inheritance.** Macagno-Walton 2015 in fact commits only to an informal additive species-of relation (verbatim language from the 2017 reprise: *"species of … with X added on"*); the substrate must declare its own semantics. Recommend explicit declaration of the inheritance operator: $\subseteq$ on behaviours under C006; locus-tree extension with hole-instantiation under C007; protocol-rule addition under C008.
3. **Insert an explicit Pollock-typology section** clarifying that the rebut/undermine/undercut trichotomy is *not* exhaustive in the substrate, because Reading C admits a fourth attack type (scheme-rivalry / behaviour-intersection-non-emptiness attack: $\mathbf{S}_1 \cap \mathbf{S}_2 = \emptyset$). Cite Tiozzo 2024 as precedent for sub-division *within* the trichotomy.
4. **Add an ASPIC+ premiseType / burdenOfProof clarification.** Note that ASPIC+'s $\{$ORDINARY, ASSUMPTION, EXCEPTION$\}$ is rule-static while the admin's burdenOfProof is procedure-dynamic; the substrate uses both, but they typecheck different objects (premise vs. dialogical obligation). Reference Walton & Godden 2005 §5 for the underlying issue.
5. **Add well-formedness rules section** with the four criteria (non-redundancy, non-vacuity, cluster-conservativity, locative-coherence) and note that all four are original to this track (no Walton-school precedent — SC17).
6. **Add explicit Ludics-meets-Walton novelty notice** (SC22): cite Faggian-Hyland 2002 and Terui 2011 as mathematical infrastructure but state the application to Walton schemes is original.
7. **Replace the prose CQ list with a typed-locus CQ specification** for at least one scheme (suggest argument from expert opinion) to demonstrate the C007 presentation.
8. **Add an OntoClean meta-property declaration** for each scheme cluster: is *expert opinion* rigid? does it supply an identity criterion for its instances? This is the operational implementation of SC18.
9. **Clarify catalogue scope.** The WRM 2008 compendium contains 96 schemes total; the substrate must declare whether it adopts the full 96 or a curated subset, and if curated, by what principle (cluster-conservativity, recommended).

---

## 10. Concrete Inputs to SCHEMES_ONTOLOGY_DECISION_PROMPT.md

Use the following decision template:

> **Question 1.** For scheme $S$ with CQ-bundle $\{q_1, \ldots, q_n\}$, is $S$:
> $$\mathbf{S} \;=\; \{\delta \in \mathrm{Design} : \forall i,\ \delta \perp q_i\}^{\bot\bot} \quad \text{(C006)}$$
> the labelled locus tree $T_S$ with typed holes $h_1, \ldots, h_n$ plus the CQ-bundle as a separate object (C007); or
> the protocol fragment $\Pi_S$ extending the room's protocol with obligations to defend $h_1, \ldots, h_n$ (C008)?
>
> **Prior-art constraint.** No published source forces a choice. The substrate must choose. (SC4.)
>
> **Recommended choice.** C006 as ontological primitive, with C007 and C008 as projections. Justification: Reading C ($\mathbf{G} = \mathbf{G}^{\bot\bot}$) makes behaviours the primary semantic object. C007 is then *a* presentation of $\mathbf{S}$ (not unique — multiple locus trees may present the same behaviour); C008 is the protocol-projection of $\mathbf{S}$ into the dialogue layer.
>
> **Question 2.** How is child-of-parent inheritance defined?
> (a) Set-theoretic: $\mathrm{CQ}(C) = \mathrm{CQ}(P) \cup \Delta$ — Macagno-Walton 2015 informal default (SC10).
> (b) Behaviour refinement: $\mathbf{C} \subseteq \mathbf{P}$ — C006-native (SC11, original).
> (c) Locus-tree extension: $T_C$ extends $T_P$ by filling some holes — C007-native (original).
> (d) Protocol extension: $\Pi_C \supseteq \Pi_P$ — C008-native (original).
>
> **Recommendation.** (b) is the C006-native semantics and the only one that automatically validates the substrate's well-formedness rules.
>
> **Question 3.** Can a child opt out of an inherited CQ?
> No prior art (SC12). Under (b), opting out is well-defined: $\mathbf{C}$ may admit designs that fail $q_i$ if $q_i$ is *removed* from the CQ-bundle in defining $\mathbf{C}$. The result is a sibling rather than a child unless the removal is conservative (the remaining bundle still implies $q_i$).
>
> **Question 4.** Is non-vacuity a well-formedness condition?
> No prior art (SC13). Under (b), yes: a scheme with $\mathbf{S} = \emptyset$ is degenerate (no design survives all CQs played as opponent). Recommend rejection at scheme-creation time.
>
> **Question 5.** Pollock typing: how many attack categories?
> The substrate already exposes rebut/undermine/undercut (Pollock 1987). Reading C admits a fourth — scheme-rivalry — as a behaviour-intersection attack. State this as a deliberate extension; cite Tiozzo 2024 for partial precedent (sub-division within the trichotomy).
>
> **Question 6.** Is the catalogue an ontology or a folksonomy (SC19)?
> Recommend declaring it an *engineered ontology* with OntoClean meta-properties on each cluster (rigidity, identity, unity, dependence). Use Guarino & Welty 2009 as methodology reference.
>
> **Question 7.** Which scheme catalogue is the source of truth?
> WRM 2008 (96 schemes) vs. Macagno-Walton 2015 (clustered re-organisation) vs. Wagemans PTA (factorial typology) vs. substrate-curated. Recommend: start with WRM Ch. 9 (60+ widely-cited schemes) and apply OntoClean filtering. Document divergences from WRM 2008.

---

## 11. Open Research Questions Surfaced

1. **Empirical: pattern-vs-content ablation for scheme classification (SC15).** Build a classifier with and without identification-pattern features; measure delta on US2016 corpus. Methodology is clear; no published study exists.
2. **Theoretical: formal CQ-of-CQ recursion (SC8).** Walton & Godden 2005 raise the question; Hernández 2023 sidesteps it. Under C006, the recursion is mathematically natural (the CQs themselves are designs with their own orthogonals) but unproven.
3. **Theoretical: scheme composition correspondence (SC22).** Prove or refute that the substrate's scheme composition $S_1 ; S_2$ coincides with the cut composition of designs $D(S_1) \,|\, D(S_2)$ in Faggian–Hyland's framework. Provides the substrate's deepest mathematical justification.
4. **Methodological: OntoClean for scheme catalogues (SC18).** Apply rigidity/identity/unity/dependence to WRM 2008's 96-scheme compendium. Most likely outcome: many WRM schemes are anti-rigid (e.g., "expert" is a role, not a kind), suggesting current catalogues are folksonomic in disguise.
5. **Empirical: kappa conditional on identification pattern (SC14).** Re-run Visser et al. 2020 annotation with patterns supplied to annotators; compare $\kappa$ to the 0.723 baseline.
6. **Procedural: opt-out semantics in scheme inheritance (SC12).** The C006-native semantics defines opt-out, but no UX research exists on how admins should declare and audit it.
7. **Catalogue audit (SC24).** Compare fields exposed by AIF spec, AIFdb, Argdown, ASPIC+ rule signatures, DefLog, and the WRM 2008 schema-row format against the admin's SchemeCreator. Candidate missing fields: pragma-dialectical move-type, scheme-provenance (which corpus first attested), Wagemans PTA coordinates, formal cluster-id.

---

## 12. Appendix A — Claims Verdict Table

| Claim | Restatement | Verdict | Primary source(s) | Secondary source(s) | Notes |
|---|---|---|---|---|---|
| SC1 | No published Walton account commits to scheme-as-behaviour. | **Confirmed** | Walton 1996; WRM 2008; Macagno-Walton 2015 | Verheij 2003a; Lawrence-Reed 2019 | Reading C bias originates here. |
| SC2 | No published account commits to scheme-as-design-schema. | **Confirmed** | Chesñevar et al. 2006 (AIF); Snaith-Reed 2017; Visser et al. 2020 | Modgil-Prakken 2014 | AIF RA-nodes have descriptors, not locus trees. |
| SC3 | No published account commits to scheme-as-protocol-constraint. | **Confirmed** | Hamblin 1970; Mackenzie 1979; Prakken 2005, 2006 | McBurney-Parsons 2009; McBurney-Parsons-Wooldridge 2002 | Schemes embedded *in* protocols, never identified with them. |
| SC4 | C006/C007/C008 mutual exclusivity not formally addressed. | **Original to this track** | — | — | Most consequential novelty. |
| SC5 | Any non-representational stance on what a scheme IS. | **Confirmed null** | — | All Bucket-1 sources representational | Brandom 1994 / Peregrin 2014 as philosophical analog only. |
| SC6 | Pollock trichotomy treated as exhaustive; post-2015 fourth category? | **Partially confirmed (none proposed)** | Pollock 1987; Modgil-Prakken 2014 | Hahn-Hornikx 2016; Tiozzo 2024; Amgoud-Nouioua 2015 | All extant proposals are reductive or grading, not expansive. |
| SC7 | CQs as required opponent loci in Ludics sense. | **Original to this track** | — | Walton-Godden 2005 (closest analog: dialogical CQ) | — |
| SC8 | CQ-of-CQ regress: formal treatment? | **Open / informally raised** | Walton-Godden 2005 §6 | Hernández 2023 | No formal recursion. |
| SC9 | ASPIC+ static vs admin procedural premise-typing. | **Partially confirmed** | Modgil-Prakken 2014; Walton-Godden 2005 §5 | — | Static/procedural framing is sharper here. |
| SC10 | Macagno-Walton 2015 inheritance commitments. | **Partially confirmed (informal additive)** | Macagno-Walton 2015 | Macagno-Walton-Reed 2017 ("species of … with X added on") | No formal commitment to set-theoretic union; Linnaean species-of only. |
| SC11 | No behaviour-theoretic scheme inheritance. | **Confirmed** | Macagno-Walton 2015; Modgil-Prakken 2014 | — | — |
| SC12 | Opt-out from inherited CQs. | **Original to this track** | — | — | — |
| SC13 | Scheme non-vacuity as well-formedness condition. | **Original to this track** | — | — | C006-native. |
| SC14 | Inter-annotator agreement for scheme classification. | **Confirmed with figures** | Visser et al. 2020 ($\kappa = 0.723$ Walton; $0.689$ PTA; $0.851$ predicate/subject) | Feng-Hirst 2011 (0.63–0.91 accuracy; practical reasoning 0.908); Green 2015 (0.49) | No study has measured $\kappa$ conditional on identification-pattern matching. |
| SC15 | Pattern-vs-content ablation. | **Open / confirmed gap** | — | Feng-Hirst 2011; Lawrence-Reed 2016 | Actionable research direction. |
| SC16 | LLM-based scheme classifier SOTA. | **Confirmed with figures** | Ruiz-Dolz, Kikteva & Lawrence 2025 (macro-F1 = 62.3 on 8-class; 29.4 on 24-class) | Ruiz-Dolz et al. 2021 | SOTA = fine-tuned RoBERTa with NLAS-Processed synthetic pre-training. |
| SC17 | Well-formedness rules for new schemes. | **Original to this track** | — | Blair 2001; Lumer 2022 (critiques, not rules); Walton-Macagno 2015 (self-described "provisional") | — |
| SC18 | OntoClean applied to scheme catalogues. | **Confirmed null** | — | Guarino-Welty 2002, 2009 available; never applied | — |
| SC19 | Schemes as folksonomy vs ontology. | **Original to this track** | — | Hitchcock-Wagemans 2011 (implicit) | — |
| SC20 | Post-2008 scheme composition beyond AIF shared node. | **Confirmed null** | Chesñevar et al. 2006 | Visser-Bex-Reed-Garssen 2011 | — |
| SC21 | ASPIC+ distinguishing scheme composition from rule chaining. | **Confirmed: no distinction** | Modgil-Prakken 2014 | — | — |
| SC22 | Scheme composition $\equiv$ cut composition of designs. | **Original to this track** | — | Faggian-Hyland 2002; Terui 2011 (machinery) | Mathematical correspondence unproven. |
| SC23 | CQ inheritance under composition. | **Confirmed null** | — | — | — |
| SC24 | Field in major catalogues not in admin's SchemeCreator. | **Open / needs admin schema audit** | Chesñevar 2006; WRM 2008; Argdown spec | — | Candidates: scheme provenance; pragma-dialectical move-type; Wagemans PTA coords; cluster-id. |
| SC25 | Reading C consistent with published metaphysics of inference rules? | **Partially confirmed** | Brandom 1994; Peregrin 2014 | — | Philosophical, not direct precedent. |

---

*End of SCHEMES_LITERATURE_REVIEW.md*