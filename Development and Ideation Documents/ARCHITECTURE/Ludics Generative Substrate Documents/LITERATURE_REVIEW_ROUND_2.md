# Ludics Generative Substrate — Literature Review Round 2

**Date:** 2026-05-18
**Baseline:** LITERATURE_REVIEW_ROUND_1.md
**Companion to:** LUDICS_GENERATIVE_SUBSTRATE.md, LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md, LUDICS_OPEN_COMPOSITION_JOINT.md, LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md
**Scope:** Re-verification of 5 non-confirmed Round 1 claims; first-time verification of 5 new claims from Session 0f and cross-track alignment; closure of 5 residual open questions.

---

## §1. Executive summary

Round 2's three jobs produced eight upgrades or closures and seven items that remain original-to-track or open. The most consequential findings are:

1. **R-C1 upgrades to confirmed-with-caveat.** The corrected triple $\mathrm{Art}(\mathbf{B}) = (\mathrm{Inc}(\mathbf{B}), \leq_\subseteq, \vee_{\bot\bot})$ matches Fouqueré–Quatrini's published characterization of incarnation as the inclusion-poset of "useful" designs in a behaviour (Fouqueré & Quatrini, LMCS 9(4:6), published 16 October 2013, DOI 10.2168/LMCS-9(4:6)2013). The $\bot\bot$-closed join $D_1\vee D_2 := (D_1\cup D_2)^{\bot\bot}$ restricted to $\mathrm{Inc}(\mathbf{B})$ is a specialization not stated as such in any 2015–2025 ludics paper we located.

2. **N-C21 confirmed original-to-track via active null result.** The Basaldella–Triads paper is unambiguously *Ludics without Designs I: Triads* (Basaldella, LINEARITY 2014, EPTCS / arXiv:1502.04773). It defines a triad as a triple $(\mathcal{P}_A, \mathcal{N}_A, \bot_A)$ of polarity-typed terms with a semantic orthogonality relation — *not* a Proponent/Opponent role-assignment with external Witness relation. No paper in the Basaldella / Faggian / Terui / Saurin / Baelde / Doumane / Quatrini 2015–2025 lineage commits to the Reading C instantiation. The substrate's Reading C is original to the track.

3. **R-C5 remains open but is partially addressed by control-argumentation frameworks.** Doutre, Herzig & Perrussel (KR 2023) and Coste-Marquis, Konieczny, Mailly & Marquis's *Control Argumentation Frameworks* (AAAI / IJCAI lineage) model time-indexed argumentation systems $\{F_t\}$ with addition/removal of arguments and uncertainty about future structure. None treats the time-indexed family as a directed system of *ludics behaviours* with partial transition maps; the Ludics-side dynamic-behaviour gap remains.

4. **R-C8 confirms wholesale absence of participant-access modality in Prakken 2024.** Prakken's *An abstract and structured account of dialectical argument strength* (Artificial Intelligence, Volume 335, October 2024, article 104193; available online 30 July 2024) treats expansions as a uniform combinatorial family with no stratification into walked/witnessable/latent. The substrate's three-stratum participant-access modality is therefore original prior art relative to that paper and its 2024–2025 follow-ons.

5. **N-C24 and N-C25 remain original-to-track.** Content-hash fingerprinting over partial argument-graph regions for optimistic concurrency with five domain-specific "material change" rules is not found in either the CRDT literature (Shapiro et al.; Almeida 2023) or the argumentation-change literature (Bisquert, Cayrol, Dupin de Saint-Cyr, Lagasquie-Schiex 2012–2020). Explicit "non-computation" lists as first-class governance artifacts have philosophical antecedents in Suchman 2002 ("located accountability") but are not operationalized as platform deliverables anywhere we located in FAccT/CHI/CSCW 2022–2025.

No new prior art contradicts any Round 1 "confirmed" verdict.

Three residual questions close: **Q2** (resolves with R-C8: Prakken 2024 has no participant-access stratum); **Q4** (Mansbridge et al. 2012 is a confirmed normative ancestor with empirical operationalization via Niemeyer, Veri, Dryzek & Bächtiger, APSR 118(1):345–362, 2024); **Q7** (the MCP literature 2024–2026 specifies tool-surface schemas at JSON-RPC level but has no argumentation-specific surface comparable to the warrant-mcp 10-tool design — original to track). Two residual questions carry forward: **Q3** (Singh-style commitments at multiple grain sizes — partially closed by Telang–Singh–Yorke-Smith 2022 *maintenance commitments*, fully open at the categorical level) and **Q6** (structural-similarity / subgraph-matching as factual-accuracy metric for LLM evaluations — adjacent work exists in GraphEval 2024 and KG-RAG fidelity metrics but none is over dynamically-computed deliberation-graph ground truth).

---

## §2. Re-verification results

### §2.1 R-C1 — corrected formulation Art(B) = (Inc(B), ≤_⊆, ∨_{⊥⊥})

**Verdict: Upgrades from "partially confirmed" to "confirmed with caveat".**

**What the corrected claim says.** Within a fixed behaviour $\mathbf{B}$ (a $\bot\bot$-closed set of designs), the incarnated subdesigns $\mathrm{Inc}(\mathbf{B})$ carry (i) the inclusion partial order $\leq_\subseteq$ inherited from designs-as-sets-of-chronicles/paths, and (ii) a binary upper-bound operation $D_1 \vee D_2 := (D_1 \cup D_2)^{\bot\bot}$, which we restrict to $\mathrm{Inc}(\mathbf{B})$.

**Match in the published literature.** Fouqueré & Quatrini (LMCS 9(4:6), 16 Oct 2013) establish exactly the inclusion-ordered structure on incarnations: "Incarnation is introduced by Girard in Ludics as a characterization of 'useful' designs in a behaviour. The incarnation of a design is defined as its subdesign that is the smallest one in the behaviour ordered by inclusion." (Fouqueré & Quatrini 2013, abstract). The same paper develops a constructive characterization via maximal cliques of paths and gives explicit closure operations under union: "the incarnation $|\mathbf{E}|$ of a behaviour $\mathbf{E}$ is its set of incarnated designs … defined as the smallest design included in $\mathfrak{D}$ and belonging to $\mathbf{E}$." Doumane's *Inductive and Functional Types in Ludics* (CSL 2017) confirms the $\bot\bot$-closure semantics: "Theorem 30. The set $\bigcup_{n\in\mathbb N} A_n$ is a behaviour … $\bot\bot$-closure is useless" under regularity hypotheses, identifying the kinds of upper bound that stay inside a behaviour without needing closure.

**Caveat (single-source structural specialization).** The specific *binary join restricted to Inc(B)*, written $D_1 \vee D_2 := (D_1 \cup D_2)^{\bot\bot}$ and treated as a structure on the incarnation poset, does not appear as a named construct in Fouqueré–Quatrini 2013, Baelde–Doumane–Saurin (CSL 2015, CSL 2016), Doumane 2017, or Fleury–Saurin (CSL 2017). Faggian's lineage uses unions of behaviours and orthogonality closures, but the *join on $\mathrm{Inc}(\mathbf{B})$* is not stated as a primary structure. R-C1 is therefore confirmed for its components (inclusion poset on incarnations; $\bot\bot$-closure-based bound operations on behaviours) but the named triple $\mathrm{Art}(\mathbf{B})$ remains a substrate-specific assemblage.

**Implication.** The substrate's $\mathrm{Art}(\mathbf{B})$ is a faithful re-presentation of published ludics structure — no novelty claim is required at the level of incarnation poset or $\bot\bot$-closure — but the *naming as a unified algebraic object* is the substrate's contribution.

### §2.2 R-C3 — Ambler-style CCC hom-sets ↔ bi-orthogonally closed design sets

**Verdict: Verdict stands (single-source structural identification; original to track).**

**What was checked.** Whether any 2022–2025 paper in categorical logic, proof-net theory, or categorical argumentation explicitly connects (a) Ambler-style semilattice-enriched cartesian-closed-category hom-sets to (b) $\bot\bot$-closed design sets in ludics.

**Result.** No such identification surfaces in the Basaldella–Faggian lineage (Basaldella–Faggian 2011 LMCS; Basaldella–Saurin–Terui 2010 MFPS; Basaldella 2015 LINEARITY; Doumane 2017 CSL) or in the recent enriched-categorical literature (Kelly 1982 reprint TAC 2005; Borceux–Stubbe enriched categories; Jansana–San Martín 2018 frontal implicative semilattices). The two literatures remain disjoint at the level of named identification. The substrate's bridge is therefore an original structural identification.

**Caveat.** The substrate's revised wording (after Round 1) is now "Ambler's semilattice-enriched CCC" rather than "ECC", correctly excluding Luo's Extended Calculus of Constructions. Ambler 1996 — *First Order Linear Logic in Symmetric Monoidal Closed Categories* (Edinburgh PhD thesis, ECS-LFCS-92-194) and follow-on Ambler/Crole categorical-semantics work — is the intended referent.

**Implication.** The CCC↔ludics bridge remains a structural conjecture supported by analogical evidence (CCC composition = Ambler semilattice on derivations; ludics composition = orthogonality on designs) but unsupported by named published prior art. The substrate's Triads-Bridge document should retain the explicit "single-source" caveat.

### §2.3 R-C5 — behaviours as directed system {B_t}

**Verdict: Remains open after active search.**

**What was found.** Two lines of work in dynamic *abstract* argumentation are adjacent but not Ludics-side:

(a) *Control Argumentation Frameworks* (Coste-Marquis et al., AAAI 2018, IJCAI 2018; Cayrol–Lagasquie-Schiex 2020 follow-ons): "Dynamics of argumentation is the family of techniques concerned with the evolution of an argumentation framework (AF) … CAFs … accommodate the possibility of uncertainty in dynamic scenarios … able to deal with situations where the exact set of arguments is unknown and subject to evolution."

(b) Doutre–Herzig–Perrussel (KR 2023, *A Dynamic Logic Framework for Abstract Argumentation*) and Munro–Sarmiento–Bloch–Bourgne–Lesot (XLoKR 2023, *Dynamic Argumentation and Action Languages*) treat AF evolution in dynamic-logic / action-language style: "addition and removal of arguments … the order in which arguments are enunciated … better model dialogues."

**Gap.** None of these treats the evolving structure as a directed system $\{\mathbf{B}_t\}$ of *ludics behaviours* with partial transition maps respecting orthogonality. Baelde–Doumane–Saurin (CSL 2015, 2016) treat fixed-point dynamics inside $\mu\mathrm{MALL}^\infty$, but those are dynamics-of-proof-search, not behaviour evolution over deliberative time.

**Implication.** R-C5 stays open. The substrate's dynamic-behaviour treatment is original to the track; a forward-pointer to Doutre–Herzig–Perrussel KR 2023 and CAFs as the structural-argumentation-side cousin is now appropriate.

### §2.4 R-C8 — Prakken 2024 + participant-access stratification

**Verdict: Confirms participant-access modality wholly absent in Prakken 2024 and direct 2024–2025 follow-ons.**

**Prakken 2024's primitive.** "This paper presents a formal model of dialectical argument strength in terms of the number of ways in which an argument can be successfully attacked in expansions of an abstract argumentation framework" (Prakken, *Artificial Intelligence* 335:104193, October 2024; available online 30 July 2024, abstract). The model is built on the family of all expansions of an AF; dialectical strength is a counting/distributional function over that family.

**What is missing.** No stratification of expansions by participant-access status. There is no notion in Prakken 2024 of "moves already walked", "moves witnessable from current position but not yet walked", or "moves latent in expansion space but structurally unreachable from any current dialogue state". The whole expansion family is treated as a flat uniform combinatorial object on which strength functions are computed.

**Follow-ons.** Van Woerkom–Grossi–Prakken–Verheij (JAIR 2024) and Bezou Vrakatseli–Prakken–Janssen (2024, experimental reinstatement work) extend or test Prakken 2024 but do not add participant-access stratification. The COMMA/KR 2024 citing literature (Vasileiou et al., KR 2024 *Dialectical Reconciliation*) similarly does not stratify expansions by participant access; instead it adds human-model approximation as a separate dimension.

**Implication.** The substrate's exposure-map = (walked, witnessable, latent) stratification on Prakken-style expansion families is original prior art. The substrate should position itself as an *orthogonal refinement*: Prakken counts attacks-across-expansions for strength; the substrate adds a participant-access dimension that Prakken's framework currently lacks.

### §2.5 R-C14 — Habermas BFN p. 486 / Fishkin aggregate / Mansbridge 2012 as T4 ancestors

**Verdict: Confirms corrected framing as accurate.**

**Habermas BFN (1996), two-track model.** Benhabib (1996 review, APSR): "A two-track theory of democracy in which representative institutions exist alongside and contend with a vibrant and free public sphere and civil society of associations, social movements, and citizens' initiatives is sketched. Habermas argues that this two-track view should replace [the Marxian critique of representative democratic institutions]." BFN p.486 (the Faktizität und Geltung pagination) characterizes the deliberative system as a layered architecture of informal opinion-formation feeding institutionalized will-formation — the substrate's T4 layer architecture is a direct computational instantiation.

**Mansbridge et al. 2012.** "To understand the larger goal of deliberation, we suggest that it is necessary to go beyond the study of individual institutions and processes to examine their interaction in the system as a whole" (Mansbridge, Bohman, Chambers, Christiano, Fung, Parkinson, Thompson, Warren, in Parkinson & Mansbridge eds., *Deliberative Systems*, Cambridge UP 2012, ch. 1, p. 1–26, DOI 10.1017/CBO9781139178914.002).

**2020–2025 systemic-deliberation work.** Landemore's *Open Democracy* (Princeton 2020) extends the systemic approach with sortition-based mini-publics articulating with national assemblies — a four-rights design (participation, deliberation, majority, representation, transparency). Niemeyer, Veri, Dryzek & Bächtiger (APSR 118(1):345–362, 2024; online first 9 March 2023; DOI 10.1017/S0003055423000023) operationalize a Deliberative Reason Index (DRI) measured across 19 forums; Dryzek & Niemeyer (Political Research Quarterly 2025, *Expressive Epistemic Injustice*) extends DRI as a measurement instrument.

**Fishkin's aggregate-only reporting.** Fishkin's *Deliberative Polling* reports pre/post aggregate preference shifts but does not report per-participant move traces — confirmed by the Niemeyer et al. 2024 methodology section (cited in *Deliberating in the Reef World*, Benham et al. 2024 Australasian J. Env. Mgmt.), which contrasts DRI's intersubjective-level measure with aggregate-only summaries.

**Implication.** The substrate's T4 = systemic-deliberation instantiation framing is well-grounded. The substrate should cite Niemeyer, Veri, Dryzek & Bächtiger 2024 alongside Mansbridge et al. 2012 to anchor both normative and empirical-operationalization layers.

---

## §3. New claim results

### §3.1 N-C21 — Reading C as Basaldella-Triads instance with external Witness relation

**Verdict: Confirmed original-to-track (active null result; ≥3 independent sources surveyed).**

**What was checked.** Whether any paper in the Basaldella–Triads lineage commits to: $P$ = Proponent design, $N$ = anonymous Opponent behaviour $\sigma(D_P)^\bot$, *with an external Witness relation* recording which moves in $N$ have been instantiated by participants.

**The Triads paper itself.** Basaldella, *Ludics without Designs I: Triads* (LINEARITY 2014, EPTCS pp. 49–63, Feb 2015 / arXiv:1502.04773), Definition 1.1: "A **triad** is an ordered triple $A = (\mathcal{P}_A, \mathcal{N}_A, \bot_A)$ where $\mathcal{P}_A$ is a set whose elements are **positive terms**, $\mathcal{N}_A$ is a set whose elements are **negative terms** … $\bot_A \subseteq \mathcal{P}_A \times \mathcal{N}_A$ called **orthogonality**." The three components are *polarities of terms* plus a *semantic orthogonality relation between positive and negative terms* — not Proponent/Opponent roles, and no external Witness relation. The same paper notes the abstraction direction: "a design is seen as special case of what we are calling *term*: just an *unspecified* and primitive element of the domain of a given triad."

**Follow-ons surveyed.** Basaldella–Faggian 2011 LMCS 7(2); Basaldella–Terui 2010 LICS; Basaldella–Saurin–Terui 2010 MFPS; Baelde–Doumane–Saurin 2015 CSL, 2016 CSL; Doumane 2017 CSL *Inductive and Functional Types in Ludics*; Fouqueré–Quatrini 2013 LMCS; Lecomte–Quatrini 2009/2012 (Springer LNCS 5514, 7218). All use the standard P/N polarity convention ("In the sequel, $P$ will always denote a positive behaviour, $N$ a negative one" — Basaldella–Faggian 2011) and do not introduce a separate Witness relation.

**Game-semantics check.** Hyland–Ong (2000) and Faggian–Maurel ludics-nets framework label moves Player/Opponent via an arena function $\lambda : M \to \{P, O\}$, not via an external witness relation; "witness" appears in game semantics only in the Skolem-value sense (a numerical witness for a choice quantifier), not in role-assignment. Japaridze's Computability Logic (Japaridze CLFTI; arXiv:1612.04513; arXiv:1902.05172): the two agents are "machine" ($\top$) and "environment" ($\bot$) and "witness" appears in the choice-quantifier sense ($\sqcup x \phi$ requires a witness for $x$) — again not as a role-assignment relation tracking instantiation.

**Implication.** Reading C — Proponent design + anonymous Opponent behaviour + external Witness relation — is an original instantiation of the Triads abstraction. The substrate should cite Basaldella 2015 as the formal base and label Reading C explicitly as "Triads instance with external participant-tracking relation; original to this track."

### §3.2 N-C22 — Confidence-Erasure-Functor preserving CCC, discarding semilattice enrichment

**Verdict: Confirmed as standard pattern in enriched category theory (load-bearing claim, ≥2 sources).**

**What the substrate proposes.** A functor $U : \mathbf{C}_{\mathrm{semi}} \to \mathbf{C}_{\mathrm{plain}}$ from Ambler's semilattice-enriched CCC to the plain ludics-incarnation CCC, preserving cartesian-closed structure while discarding the semilattice enrichment (the "confidence" structure).

**Prior art.** This is exactly the change-of-base / forgetful pattern formalized in Kelly's *Basic Concepts of Enriched Category Theory* (1982 LMS Lecture Notes; 2005 TAC reprint). Borceux & Stubbe, *Short Introduction to Enriched Categories* (Univ. Littoral notes): "The forgetful functor $\mathrm{Ab} \to \mathrm{Set}$ has a left adjoint functor … This type of functor is quite rightly called 'forgetful'. Another typical example would be the functor $\mathrm{Vect}_K \to \mathrm{Set}$ that 'forgets' all about the linear algebra." The general theory of change-of-base 2-functors $V\text{-}\mathrm{Cat} \to W\text{-}\mathrm{Cat}$ along a lax monoidal functor $V \to W$ — including the canonical underlying-ordinary-category 2-functor $(-)_0 : V\text{-}\mathrm{CAT} \to \mathrm{CAT}$ — is Kelly 1982 §1.2 standard.

Jansana & San Martín (arXiv:1811.03698, 2018) treat the analogous forgetful functor from frontal implicative semilattices to frontal Hilbert algebras and construct an explicit left adjoint — a direct categorical analogue of the substrate's confidence-erasure direction: "we define a functor from the algebraic category of frontal Hilbert algebras to the algebraic category of frontal implicative semilattices which is left adjoint to the forgetful functor."

**What is original to the track.** The *application* of this pattern to map an Ambler-style semilattice-enriched CCC of derivations into the plain ludics-incarnation CCC, with the semantic interpretation of the discarded structure as "confidence-stripping", is original. The categorical machinery is standard.

**Implication.** N-C22 is confirmed at the categorical-machinery level (≥2 sources: Kelly 1982; Borceux–Stubbe; Jansana–San Martín 2018 as analogue); the substrate-specific naming is original. Cite Kelly and Borceux–Stubbe explicitly.

### §3.3 N-C23 — corrected ⊥⊥-closure join D₁ ∨ D₂ := (D₁ ∪ D₂)^{⊥⊥} on Inc(B)

**Verdict: Original to track at the named level; primitive operations are standard.**

**Primitives.** Bi-orthogonal closure $X \mapsto X^{\bot\bot}$ on sets of designs is the *defining* operation of ludics behaviours: a behaviour is precisely a $\bot\bot$-closed set (Girard 2001; Faggian 2002 PhD; Basaldella–Faggian 2011 LMCS; Faggian–Maurel LICS 2005). Internal completeness (Girard; Basaldella–Faggian 2011) entails that for many connectives "bi-closure is useless" — bounds and unions remain inside the behaviour without re-closure.

**The named join.** The substrate's specific binary $D_1 \vee D_2 := (D_1 \cup D_2)^{\bot\bot}$ *restricted to $\mathrm{Inc}(\mathbf{B})$ to recover idempotence* is not named or stated in Faggian, Della Rocchetta, Saurin, Baelde, Basaldella 2015–2025 work I located. Fouqueré–Quatrini 2013 (LMCS 9(4:6), *Incarnation in Ludics and Maximal Cliques of Paths*) discuss unions and incarnation but do not present this binary-on-incarnations as a named join. Doumane 2017 *Inductive and Functional Types in Ludics* (CSL): "$\bot\bot$-closure is useless" for behaviour unions under simple-regular hypotheses — adjacent but not the join.

**Implication.** N-C23 is best characterized as: primitives drawn from standard ludics ($\bot\bot$-closure, incarnation poset, internal completeness), but the named restricted-to-Inc(B) join is the substrate's own. State this explicitly; do not claim it as a new published result.

### §3.4 N-C24 — briefing fingerprint: content-hash over partial graph region with five material-change rules

**Verdict: Original to track (active null result on conjunction of features).**

**Prior art partials.**

(a) *Merkle-DAG / content-addressed graphs.* CRDT-with-BFT designs use Merkle-DAG hash chains over operation histories: "constructing a hash graph (aka a Merkle-DAG): … The ID of an operation is the hash of the update containing that operation. … if [two nodes' heads] are identical, they can ensure the set of updates they have observed is also identical" (CRDT survey notes, Zhao 2024). Almeida (arXiv:2310.18220, 2023) *Approaches to Conflict-free Replicated Data Types* surveys state-based, op-based, and delta-state CRDTs without giving content-hash of *partial graph regions* as a primary primitive.

(b) *Argumentation-framework change detection.* Bisquert, Cayrol, Dupin de Saint-Cyr, Lagasquie-Schiex characterize change in abstract argumentation systems with a typology of structural and status-based change properties: "An argumentation system can undergo changes (addition/removal of arguments/interactions). At an abstract level, we propose a typology to classify the different properties describing a change operation" (Bisquert et al., *Characterizing change in abstract argumentation systems*, hal-02875531). But classification is over *types* of change at extension/semantics level — not content-hash fingerprints of subgraph regions.

(c) *Optimistic-concurrency wikis.* CRDT and OT-based collaborative editors (CRDT survey, Yjs/Automerge ecosystem) handle text and tree merges, not classifications of "material change" specific to argumentation domain semantics.

**What is original.** The conjunction of: (i) content-hash over a *partial graph region* (not whole-state nor operation-stream); (ii) *optimistic concurrency* gated by that hash; (iii) a *domain-specific* 5-rule taxonomy of "material change" tailored to argumentation graphs. No paper combines these.

**Implication.** N-C24 is original to the track. Cite Bisquert et al. (change typology) and Almeida 2023 (CRDT survey) as the closest prior art establishing that the constituent ideas exist but have not been combined this way.

### §3.5 N-C25 — explicit exclusion governance as first-class artifact

**Verdict: Original to track at the operational level; philosophical antecedent in Suchman 2002.**

**Antecedent.** Suchman, *Located Accountabilities in Technology Production* (Scandinavian J. Information Systems 14(2):91–105, 2002): "Three contrasting positions for design — the view from nowhere, detached intimacy, and located accountability — are discussed as alternative bases for a politics of professional design practice. From the position of located accountability … the only possible route to objectivity on this view is through collective knowledge of the specific locations of our respective visions." Suchman frames the *political and epistemic positioning* of design boundaries as accountable practice but does not specify a deliverable artifact named "what is deliberately not computed."

**Adjacent recent work.**
- Pi (arXiv:2303.00651, 2023) *Algorithmic Governance for Explainability* surveys XAI regulatory instruments without treating non-computation as a primary deliverable.
- *Beyond Explainability: The Case for AI Validation* (arXiv:2505.21570, 2025) argues for validation-as-governance pillar rather than non-computation lists.
- *From access and transparency to refusal* (Internet Policy Review, 2020) frames "refusal" as a third response alongside access and transparency, but at the institutional/movement level (e.g., Black in AI refusing Google funding) rather than as a platform artifact.

**Gap.** No FAccT/CHI/CSCW 2022–2025 paper I located operationalizes an explicit *list of what is deliberately not computed* shipped as a first-class deliverable alongside a deliberation platform.

**Caveats.** I did not exhaustively crawl FAccT 2025 (May 2025 proceedings post-date some queries) or the CSCW 2025 program; possible adjacent work in "meaningful human control" (Santoni de Sio & van den Hoven 2018, Cavalcante Siebert et al. 2023) treats decision-space exclusions but not as platform artifacts in the substrate's sense. Single-source basis for the philosophical antecedent (Suchman 2002).

**Implication.** N-C25 is original to track. The substrate's exclusion-governance artifact should be positioned as an operationalization of Suchman's located-accountability stance, with the explicit list itself being the substrate's contribution.

---

## §4. Residual open questions

### §4.1 Q2 — walked / witnessable / latent stratification on Prakken expansions

**Closes (per R-C8).** Prakken 2024 and 2024–2025 follow-ons do not define participant-access stratification. The exposure map = (walked, witnessable, latent) is original to the substrate. Substrate should explicitly position this as an orthogonal refinement of Prakken's expansion-based dialectical strength.

### §4.2 Q3 — Singh-style commitments at four grain sizes (categorical)

**Partially closes; carries forward.** Singh's commitment ontology and operations (Singh, *Social and Psychological Commitments in Multiagent Systems*, AAAI Fall Symp. 1991; *An Ontology for Commitments*, AI & Law 1999; *Commitments in Multiagent Systems*, chapter 31, 2012) operate at a single conceptual grain — debtor/creditor/condition/discharge. Telang–Singh–Yorke-Smith (AAAI 2022, *Maintenance of Social Commitments in Multiagent Systems*) add a *maintenance* family ("a debtor agent commits to a creditor agent that if some antecedent condition holds it would maintain a consequent condition until some discharge condition holds") — this is a second commitment grain, but the categorical/type-theoretic generalization to four grain sizes (e.g., utterance / move / dialogue / system) is not in Singh's lineage or in AAMAS 2020–2025 work surveyed. Carry forward as open.

### §4.3 Q4 — Mansbridge et al. 2012 as ancestor architecture

**Closes (per R-C14).** Mansbridge et al. 2012 systemic approach + Niemeyer, Veri, Dryzek & Bächtiger 2024 DRI provide both the normative framing and the empirical measurement scaffold for T4. Substrate gains normative leverage by citing both: Mansbridge et al. for the system concept ("A system here means a set of distinguishable, differentiated, but to some degree interdependent parts, often with distributed functions and a division of labour, connected in such a way as to form a complex whole"), Niemeyer et al. for operationalization of deliberative-reason capacity in measurable terms.

### §4.4 Q6 — structural-similarity / subgraph-matching for fidelity scorecard

**Carries forward.** Adjacent work exists:
- GraphEval (Feng et al., arXiv:2503.12600, 2025) uses viewpoint-subgraph extraction for LLM idea evaluation.
- KG-RAG fidelity metrics (ACL 2025 long papers; EMNLP 2025) treat retrieval fidelity over knowledge subgraphs.
- ABIDE (Argumentative Bias Detection, arXiv:2508.04511) and Waller–Rodrigues–Cocarascu QBAF-bias work use argumentation-framework structure for bias detection.

None of these defines a fidelity scorecard for LLM outputs against a *dynamically-computed deliberation-graph ground truth* with subgraph-isomorphism / partial-graph-matching metrics. Q6 is partially supported (subgraph-matching metrics exist; structural fidelity over deliberation graphs is the original part) but remains open. Carry forward.

### §4.5 Q7 — minimum Ludics-MCP tool surface spec

**Closes (original to track).** MCP (Anthropic, November 2024; donated to the Agentic AI Foundation (AAIF) — a directed fund under the Linux Foundation — on 9 December 2025, per the Linux Foundation press release: "The Linux Foundation … today announced the formation of the Agentic AI Foundation (AAIF), and founding contributions … Anthropic's Model Context Protocol (MCP), Block's goose, and OpenAI's AGENTS.md") specifies tool-surface schemas at JSON-RPC level with name/description/input-schema triples. MCPToolBench++ (arXiv:2508.07575, 2025) benchmarks tool-use across many domains; Hasan et al. (arXiv:2602.14878, 2026) analyze tool-description quality. None specifies an *argumentation-query interface* at schema level. The substrate's warrant-mcp 10-tool surface (commit, attack, support, withdraw, restate, query-warrant, query-attack-chain, query-extension, query-strength, query-exposure or similar) is original to the track.

**Implication.** The substrate should publish the 10-tool MCP schema as a contribution; cite MCP spec and MCPToolBench++ for protocol-surface grounding.

---

## §5. Reference-cluster index (Round 2 new sources)

### Bucket A — Ludics internal structure
- **Basaldella 2015** — Michele Basaldella, *Ludics without Designs I: Triads*, LINEARITY 2014, EPTCS, pp. 49–63, Feb 2015. arXiv:1502.04773. — Identifies the Triads abstraction as $(\mathcal P, \mathcal N, \bot)$ with polarity-typed terms and semantic orthogonality. Load-bearing for N-C21.
- **Fouqueré & Quatrini 2013** — *Incarnation in Ludics and Maximal Cliques of Paths*, LMCS 9(4:6), published 16 October 2013 (DOI 10.2168/LMCS-9(4:6)2013; arXiv:1307.1028). — Establishes inclusion order on incarnations; supports R-C1.
- **Doumane 2017** — *Inductive and Functional Types in Ludics*, CSL 2017, LIPIcs. — $\bot\bot$-closure semantics on regular behaviours; supports R-C1 and N-C23.
- **Baelde, Doumane, Saurin 2016** — *Infinitary Proof Theory: the Multiplicative Additive Case*, CSL 2016, LIPIcs 62:42:1–17. — Fixed-point dynamics in $\mu\mathrm{MALL}^\infty$; tangentially relevant to R-C5.
- **Basaldella & Faggian 2011** — *Ludics with Repetitions (Exponentials, Interactive Types and Completeness)*, LMCS 7(2), 2011. — Standard P/N polarity convention; supports N-C21 null result.
- **Kelly 1982 (reprint 2005)** — G. M. Kelly, *Basic Concepts of Enriched Category Theory*, TAC reprint 10, 2005 (orig. LMS Lecture Notes 64, CUP 1982). — Change-of-base forgetful 2-functors; supports N-C22.
- **Borceux & Stubbe (notes)** — *Short Introduction to Enriched Categories*. — Forgetful-functor patterns; supports N-C22.
- **Jansana & San Martín 2018** — *On the Free Frontal Implicative Semilattice Extension of a Frontal Hilbert Algebra*, arXiv:1811.03698. — Adjoint to forgetful functor between semilattice-enriched and weaker algebraic categories; analogue for N-C22.

### Bucket B — Prakken 2024 + dynamic argumentation
- **Prakken 2024** — Henry Prakken, *An abstract and structured account of dialectical argument strength*, Artificial Intelligence, Volume 335, October 2024, article 104193 (available online 30 July 2024; DOI 10.1016/j.artint.2024.104193). — Expansion-based dialectical strength without participant-access stratification; supports R-C8 and Q2.
- **Doutre, Herzig, Perrussel 2023** — *A Dynamic Logic Framework for Abstract Argumentation*, KR 2023. — Dynamic AF in DL-PA; supports R-C5 as adjacent (not Ludics-side).
- **Munro et al. 2023** — *Dynamic Argumentation and Action Languages: Towards Explanations*, XLoKR 2023 (hal-04179071). — Temporality in AF dialogues; supports R-C5.
- **Coste-Marquis, Konieczny, Mailly, Marquis** — *Control Argumentation Frameworks*, AAAI 2018 / IJCAI 2018. — CAFs as dynamics-of-AF cousin; supports R-C5.
- **Telang, Singh, Yorke-Smith 2022** — *Maintenance of Social Commitments in Multiagent Systems*, AAAI 2022. — Maintenance commitment family; partial closure of Q3.
- **Vasileiou, Kumar, Yeoh, Son, Toni 2024** — *Dialectical Reconciliation via Structured Argumentative Dialogues*, KR 2024 (DOI 10.24963/kr.2024/73). — Cites Prakken; no participant-access stratification.

### Bucket C — Deliberative democracy + platform design
- **Mansbridge et al. 2012** — Jane Mansbridge, James Bohman, Simone Chambers, Thomas Christiano, Archon Fung, John Parkinson, Dennis Thompson, Mark Warren, *A Systemic Approach to Deliberative Democracy*, in Parkinson & Mansbridge eds., *Deliberative Systems*, Cambridge UP 2012, ch. 1 pp. 1–26, DOI 10.1017/CBO9781139178914.002. — Systemic-deliberation foundation; supports R-C14, Q4.
- **Habermas 1996** — *Between Facts and Norms*, MIT Press, trans. Rehg. — Two-track model (p. 486 area). Re-verified via Benhabib APSR 1996 review; supports R-C14.
- **Landemore 2020** — Hélène Landemore, *Open Democracy: Reinventing Popular Rule for the Twenty-First Century*, Princeton UP. — Sortition-based deliberative architecture; supports R-C14.
- **Niemeyer, Veri, Dryzek, Bächtiger 2024** — *How Deliberation Happens: Enabling Deliberative Reason*, American Political Science Review 118(1):345–362, 2024 (online first 9 March 2023; DOI 10.1017/S0003055423000023). — DRI across 19 forums; empirical operationalization for Q4.
- **Dryzek & Niemeyer 2025** — *Expressive Epistemic Injustice: Definition, Measurement, and Deliberative Cure*, Political Research Quarterly, 2025 (DOI 10.1177/10659129241297272). — DRI methodology; supports R-C14.
- **Suchman 2002** — Lucy Suchman, *Located Accountabilities in Technology Production*, Scandinavian J. Information Systems 14(2):91–105, 2002. — Located-accountability stance; philosophical antecedent for N-C25.

### Bucket D — AI/LLM over argumentation graphs + MCP
- **Bisquert et al. (hal-02875531)** — *Characterizing change in abstract argumentation systems*. — AF change typology; supports N-C24.
- **Almeida 2023** — Paulo Sérgio Almeida, *Approaches to Conflict-free Replicated Data Types*, arXiv:2310.18220. — CRDT survey; supports N-C24.
- **MCP specification / Anthropic 2024** — Model Context Protocol JSON-RPC client-server architecture (November 2024); donated 9 December 2025 to the Agentic AI Foundation (AAIF), a directed fund under the Linux Foundation. — Supports Q7.
- **MCPToolBench++ 2025** — arXiv:2508.07575. — MCP tool-use benchmark; supports Q7.
- **GraphEval (Feng et al. 2025)** — arXiv:2503.12600, *GraphEval: A Lightweight Graph-Based LLM Framework for Idea Evaluation*. — Subgraph extraction for LLM evaluation; partial support for Q6.
- **ABIDE 2025** — *Argumentative Debates for Transparent Bias Detection*, arXiv:2508.04511 (Waller–Rodrigues–Cocarascu lineage extension). — QBAF-bias detection; tangential to Q6.

---

## §6. Concrete revisions to the substrate docs

1. **LUDICS_GENERATIVE_SUBSTRATE.md §[incarnation structure]**: Rename $\mathrm{Art}(\mathbf{B})$ as a *substrate-specific assemblage* of standard ludics primitives; cite Fouqueré–Quatrini 2013 (LMCS 9(4:6), 16 Oct 2013) for the inclusion-poset of incarnations and Doumane 2017 for $\bot\bot$-closure-on-unions semantics. Add caveat: the named binary join restricted to $\mathrm{Inc}(\mathbf{B})$ is original to the substrate.

2. **LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md §[Triads instance]**: Cite Basaldella 2015 (LINEARITY / arXiv:1502.04773) Definition 1.1 as the formal base of the Triads abstraction. Add explicit note: "Reading C — Proponent design + anonymous Opponent behaviour $\sigma(D_P)^\bot$ + external Witness relation — is an *original* instantiation of the Triads abstraction; the standard Basaldella–Faggian lineage does not introduce a participant-tracking relation." Add cross-reference to Hyland–Ong (2000) and Japaridze CLFTI for the standard role-labelling-by-$\lambda$ convention.

3. **LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md §[Confidence-Erasure-Functor]**: Cite Kelly 1982 / TAC reprint 10 for change-of-base / forgetful 2-functor; cite Borceux–Stubbe notes for the forgetful-functor pattern; cite Jansana–San Martín 2018 (arXiv:1811.03698) as a recent analogue for semilattice-direction adjunctions. Note that the categorical machinery is standard; the *application to confidence stripping* is the substrate's specific framing.

4. **LUDICS_GENERATIVE_SUBSTRATE.md §[Ambler bridge]**: Confirm "Ambler's semilattice-enriched CCC" terminology; explicitly distinguish from Luo's ECC. Mark the CCC↔ludics bridge as single-source structural identification per R-C3 verdict.

5. **LUDICS_GENERATIVE_SUBSTRATE.md §[exposure map]**: Position the walked/witnessable/latent stratification as an *orthogonal refinement* of Prakken 2024 expansion-based strength. Cite Prakken 2024 (Artificial Intelligence Volume 335, October 2024, article 104193) as the closest published expansion family construction without participant-access modality.

6. **LUDICS_GENERATIVE_SUBSTRATE.md §[T4 / deliberative architecture]**: Anchor in Mansbridge et al. 2012 (systemic-deliberation) for normative ancestry and Niemeyer, Veri, Dryzek & Bächtiger 2024 APSR 118(1):345–362 (DRI) for empirical-operationalization grounding. Replace any residual Cohen 1989 gloss with Habermas BFN p.486 area + Mansbridge et al. 2012 + Niemeyer et al. 2024.

7. **LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md §[briefing fingerprint]**: Cite Bisquert et al. (change typology) and Almeida 2023 (CRDT survey) as closest prior art. State explicitly that the conjunction of (content-hash over partial graph region) + (optimistic concurrency) + (5-rule domain-specific material-change taxonomy) is original to the track.

8. **LUDICS_OPEN_COMPOSITION_JOINT.md §[explicit exclusion governance]**: Add Suchman 2002 (*Located Accountabilities*) as philosophical antecedent. Note that the operationalization of explicit "what is deliberately not computed" lists as platform deliverables is the substrate's specific contribution.

9. **LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md §[MCP surface]**: Cite MCP specification (Anthropic November 2024, JSON-RPC; donated to AAIF/Linux Foundation 9 December 2025) and MCPToolBench++ 2025 as protocol-level grounding. Position the 10-tool warrant-mcp surface as the substrate's argumentation-specific schema.

10. **LUDICS_GENERATIVE_SUBSTRATE.md §[dynamic behaviours]**: Mark R-C5 as open. Add forward-pointer to Doutre–Herzig–Perrussel KR 2023 and Coste-Marquis et al. CAFs as structural-argumentation cousins of the substrate's $\{\mathbf{B}_t\}$ directed system.

---

## §7. Open research questions carried forward

**OQ1 (from R-C5).** Is there a clean categorical formulation of an evolving family of ludics behaviours $\{\mathbf{B}_t\}$ as a directed system in $\mathbf{Beh}$ (the category of behaviours) with partial transition maps that respect orthogonality? CAFs and DL-PA-based dynamic AF give structural-side cousins; the question is whether the ludics-side construction is functorial.

**OQ2 (from N-C23).** Does the restricted join $D_1 \vee D_2 := (D_1 \cup D_2)^{\bot\bot}|_{\mathrm{Inc}(\mathbf{B})}$ form a semilattice, a meet-semilattice with absorbing element under $\Omega$, or a more general structure (e.g., a quantale-style operation) on $\mathrm{Inc}(\mathbf{B})$? Stating and proving this would close R-C1 to a full confirmed verdict.

**OQ3 (from Q3).** Is there a categorical / type-theoretic generalization of Singh-style commitment operations across multiple grain sizes (utterance / move / dialogue / system) — e.g., as a graded modal logic indexed by grain, or as a bicategory of commitment-types?

**OQ4 (from Q6).** Define a fidelity scorecard for LLM outputs against dynamically-computed deliberation-graph ground truth, using partial-graph-isomorphism / subgraph-matching as the structural similarity metric. Test against current LLM-over-KG fidelity baselines (GraphEval; KG-RAG with retrieval-quality / reasoning-quality decomposition).

**OQ5 (new, from §3.5).** Is there an empirical CHI/CSCW study of users' response to platforms shipping explicit "what is deliberately not computed" lists alongside outputs? The substrate's hypothesis is that such artifacts increase trust; this is empirically testable.

**OQ6 (new, from §3.4).** Specify the five "material change" rules for argumentation-graph content-hash fingerprints precisely enough to compare against the Bisquert et al. change-typology and against CRDT operation classes. Is there a unifying lattice of change-types?

**OQ7 (new, from §2.4).** Is the participant-access modality (walked / witnessable / latent) a *strict* refinement of Prakken 2024's expansion family, or does it require a different base structure? I.e., can every expansion be assigned a stratum class, or do some expansions resist classification?

---

## Appendix A — Updated claims verdict table

| Claim | One-line restatement | R1 verdict | R2 verdict | Primary source(s) | Notes on change |
|---|---|---|---|---|---|
| C1 | $\mathrm{Art}(\mathbf{B}) = (\mathrm{Inc}(\mathbf{B}), \leq_\subseteq, \vee_{\bot\bot})$ | partial | ↑ confirmed w/ caveat | Fouqueré–Quatrini 2013 (LMCS 9(4:6)); Doumane 2017 | Components match; named assemblage is substrate-specific |
| C2 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C3 | Ambler CCC ↔ $\bot\bot$-closed designs | single-source | = single-source | Ambler 1996; Basaldella 2015 | Framing tightened; no new identification published |
| C4 | (Round 1 original) | original | = | — | Not re-reviewed |
| C5 | Dynamic behaviours $\{\mathbf{B}_t\}$ | open | = open | Doutre et al. KR 2023; CAFs | Adjacent work exists structural-side; ludics-side still gap |
| C6 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C7 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C8 | Prakken 2024 expansion families | confirmed w/ caveat | ~ confirmed w/ positioning | Prakken 2024 AI 335:104193 (online 30 Jul 2024) | Wholesale absence of participant-access modality confirmed |
| C9 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C10 | (Round 1 original) | original | = | — | Not re-reviewed |
| C11 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C12 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C13 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C14 | Habermas/Fishkin/Mansbridge as T4 ancestors | partial | ↑ confirmed | Mansbridge et al. 2012; Niemeyer et al. APSR 118(1):345–362, 2024; Habermas BFN 1996 | Corrected framing verified; DRI adds empirical operationalization |
| C15 | (Round 1 partial) | partial | = partial | (Round 1) | Not re-reviewed in detail |
| C16 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C17 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C18 | (Round 1 confirmed) | confirmed | = | (Round 1) | Not re-reviewed |
| C19 | (Round 1 confirmed w/ caveat) | confirmed w/ caveat | = | (Round 1) | Not re-reviewed |
| C20 | (Round 1 original) | original | = | — | Not re-reviewed |
| **N-C21** | Reading C: P-design + anonymous Opponent + Witness | NEW | original-to-track (active null) | Basaldella 2015 arXiv:1502.04773; Basaldella–Faggian 2011 LMCS | Triads paper identified; ≥3 lineage sources confirm null |
| **N-C22** | Confidence-Erasure-Functor | NEW | confirmed (pattern) + original (application) | Kelly 1982; Borceux–Stubbe; Jansana–San Martín 2018 | Forgetful-functor pattern is standard |
| **N-C23** | $\bot\bot$-closure join on $\mathrm{Inc}(\mathbf{B})$ | NEW | components standard; named join original | Faggian–Basaldella 2011; Doumane 2017; Fouqueré–Quatrini 2013 | Primitives are ludics-standard; restriction is novel |
| **N-C24** | Briefing fingerprint with 5 material-change rules | NEW | original-to-track | Bisquert et al. (typology); Almeida 2023 (CRDT survey) | Conjunction of features not found in prior art |
| **N-C25** | Explicit exclusion governance artifact | NEW | original-to-track; antecedent in Suchman 2002 | Suchman 2002 Scand. J. Inf. Syst. 14(2):91–105 | Philosophical antecedent; operationalization is new |

Legend: ↑ upgrade, ↓ downgrade, = unchanged, ~ framing changed, NEW for new claims.