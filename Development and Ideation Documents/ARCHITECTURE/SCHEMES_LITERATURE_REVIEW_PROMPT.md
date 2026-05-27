# Literature Review Prompt — Argumentation Schemes Theoretical Foundations

**Purpose.** Self-contained research brief for an Opus-4.6-class deep-research agent. Run in parallel to manual literature review. The agent's deliverable is a single referenceable document (specified in §6) that the conceptual track and any follow-on formal-decision session can consult.

**How to use.** Paste this entire document as the system / initial prompt to a fresh research-agent instance with web/search access. The agent should treat §1 as background, §2 as the falsifiable-claims checklist driving the search, §3 as the bucket structure, §4 as scope discipline, §5 as source-quality rules, §6 as the required output format, §7 as process guidance, and §8 as the parallel-review reconciliation note.

**Sequencing.** This is the *literature* half of a two-step pass on the argumentation-schemes admin foundations. The *formal-decision* follow-on (`SCHEMES_ONTOLOGY_DECISION_PROMPT.md`) explicitly waits on this deliverable; do not duplicate that work here.

---

## §1. Background

You are reviewing literature in support of the *Argumentation Schemes Theoretical Foundations* conceptual track for the Mesh / Isonomia platform — a deliberative-democracy system whose `/admin/schemes` surface (see
[`app/admin/schemes/page.tsx`](../../../app/admin/schemes/page.tsx),
[`components/admin/SchemeList.tsx`](../../../components/admin/SchemeList.tsx),
[`components/admin/SchemeCreator.tsx`](../../../components/admin/SchemeCreator.tsx),
[`components/admin/SchemeHierarchyView.tsx`](../../../components/admin/SchemeHierarchyView.tsx),
[`lib/argumentation/cqGeneration.ts`](../../../lib/argumentation/cqGeneration.ts))
lets admins define, classify, cluster, and inherit Walton-style argumentation schemes — and which currently encodes commitments from at least four theoretical traditions (Walton/Macagno-Walton, Pollock attack typology, Kienpointner epistemic mode, ASPIC+ premise typing) without a unified justification.

The conceptual track has produced one orienting document and five programme entries that you do not have access to; the relevant content is summarized below.

**The bridging document.** [`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md) (in this directory) names six implicit commitments the admin currently makes (§1) and groups them into six clusters (§2): Cluster A (ontology — what *is* a scheme); B (CQs as opponent loci); C (inheritance semantics); D (identification); E (open catalogue / well-formedness); F (composition). A reverse-index table in §3 maps every admin form field to its cluster.

**The wider substrate framing.** The Mesh / Isonomia substrate has been developed around Girard's Ludics treated as a generative substrate for multi-agent deliberation (see the four prior conceptual-track documents under `Ludics Generative Substrate Documents/`: `LUDICS_GENERATIVE_SUBSTRATE.md`, `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`, `LUDICS_OPEN_COMPOSITION_JOINT.md`, `LUDICS_USEFULNESS_BRAINSTORM.md`, plus the Ludics-substrate literature review at `LUDICS_GENERATIVE_SUBSTRATE_LITERATURE_REVIEW.md` if produced). The substrate commits to:

- **Reading C multi-agent Ludics** — Opponent is the behaviour $\sigma(D_P)^\perp$, not a coalition of participants.
- **Argumentation as interaction, not representation** — the programme's §0 framing (see `RESEARCH_PROGRAMME/00_CHARTER.md` §0). The Walton tradition is representation-first; the substrate is interaction-first; the schemes admin lives at the fracture line between them.
- **Behaviours as the primary semantic object** — meaning is $\perp\perp$-closure, not propositional content.

These commitments bias toward, but do not by themselves entail, any of the three competing scheme ontologies below. The literature review's job is to find prior art that constrains the choice.

**The three competing scheme ontologies (C006 / C007 / C008).** The programme has filed three *mutually exclusive* conjectures naming candidate answers to "what is a scheme?":

- **C006 — Scheme-as-behaviour.** $\llbracket S \rrbracket \subseteq \mathrm{Designs}$ is the $\perp\perp$-closed set of proponent designs that survive every CQ in $\mathrm{CQ}(S)$ played as opponent. *Extensional* identity: same orthogonal set ⇒ same scheme.
- **C007 — Scheme-as-design-schema.** $S = \langle L_S, V_S, \Phi_S, \mathrm{CQ}_S \rangle$ — a locus tree with typed holes for premise variables plus a CQ-bundle. *Intensional, structural* identity; membership decidable by unification. Suggested by the admin's `variables: string[]` field on each `Premise`.
- **C008 — Scheme-as-protocol-constraint.** $S$ is a protocol fragment $\pi_S$ that, once a proponent declares scheme application, extends the room's dialogue protocol with locus obligations, opponent rights, and closure conditions. Identity is protocol-extensional. Suggested by the admin's `burdenOfProof` / `requiresEvidence` / `premiseType` fields.

The literature review must locate prior art for each, refute or confirm the *mutual exclusivity* claim (a layered position may turn out to be consistent), and identify any fourth candidate the bridging document missed.

---

## §2. Falsifiable claims (the search checklist)

These are the substrate-side claims you should pressure-test against the literature. For *each*, the output must say one of: **confirmed**, **partially confirmed (with caveat)**, **original to this track (no prior art found)**, **contradicted by source X**, or **open / inconclusive**. Cite specific sources for every non-"original" classification.

### Ontology cluster (Cluster A — C006 / C007 / C008)

- **SC1.** No published account of Walton argumentation schemes commits to the **scheme-as-behaviour** reading (C006), in which scheme identity is extensional in the orthogonality-closure of the CQ-bundle. The closest analogs are (a) Caminada-style labelling semantics over instantiated schemes, (b) Verheij's DefLog defeasible-rules, (c) ASPIC+'s rule-application semantics — none of which is behaviour-extensional in the Ludics sense.
- **SC2.** No published account of Walton schemes commits to the **scheme-as-design-schema** reading (C007), in which schemes are partially-specified Ludics designs with typed holes for premise variables. The closest analogs are (a) AIF's RA-node-with-variables (Chesñevar et al. 2006), (b) Snaith & Reed 2017 TOAST scheme instantiation, (c) Visser et al. 2020 scheme-matching — none of which uses locus structure or unification over designs.
- **SC3.** No published account of Walton schemes commits to the **scheme-as-protocol-constraint** reading (C008), in which a scheme is a fragment of the room's dialogue protocol that extends it with locus obligations and opponent rights upon declaration. The closest analogs are Hamblin/Mackenzie commitment-store rules, Prakken 2005 *Coherence and Flexibility*, and McBurney-Parsons dialogue protocols — but none formalises *the scheme itself* as the protocol fragment.
- **SC4.** No published account formally addresses the question "are these three readings mutually exclusive, or is a layered position (e.g. C006 as semantic ground truth, C007 as presentation, C008 as protocol surface) coherent?" If a published source addresses this, surface it prominently.
- **SC5.** The substrate's §0 framing (argumentation-as-interaction) implies any **representation-first** scheme ontology is at best a projection. Locate any prior treatment that explicitly takes a non-representational stance on what a scheme *is* (as opposed to how schemes are used).

### Critical-questions cluster (Cluster B — Q-011)

- **SC6.** Pollock's REBUTS / UNDERMINES / UNDERCUTS attack-type trichotomy (Pollock 1995 *Cognitive Carpentry* ch. 3) is treated as *exhaustive* in the schemes admin. Locate post-2015 work that proposes a fourth (or more) attack category — candidates include Doutre-Herzig-Perrussel 2023 (epistemic argumentation frameworks), audience-relative undercutters (Hahn-Hornikx 2016), and scheme-rivalry attacks.
- **SC7.** No published treatment formalises CQs as **required opponent loci** in the Ludics sense (a sub-locus the proponent must be prepared to defend at, that the opponent has the right to play). The closest analogs are Walton's "burden shift" and Prakken's procedural-burden rules.
- **SC8.** The CQ-of-CQ regress question — are CQs themselves first-class arguments with their own CQs? — has been raised informally in the Walton literature (e.g. Walton-Godden 2005) but not formally answered. Locate any formal treatment.
- **SC9.** The ASPIC+ `premiseType ∈ {ORDINARY, ASSUMPTION, EXCEPTION}` distinction (Modgil & Prakken 2014 §3) is used as a CQ-field in the admin. The semantics ASPIC+ gives this distinction is *static* (about the rule), but the admin's `burdenOfProof: PROPONENT | CHALLENGER` field is *procedural*. Locate any prior work that has noticed or addressed this static/procedural conflation.

### Inheritance cluster (Cluster C — Q-012)

- **SC10.** Macagno-Walton 2015 *Classifying the Patterns of Natural Arguments* introduces cluster-families and parent-child relationships among schemes. Locate the exact paper / chapter where the semantics of "child inherits parent's CQs" is stated, and determine whether Macagno-Walton commits to set-theoretic union, behaviour refinement, or something else.
- **SC11.** No published account of scheme inheritance is *behaviour-theoretic* (child.behaviour ⊆ parent.behaviour). The Macagno-Walton tradition is set-theoretic by default. The categorical/sub-object framing is not stated for schemes specifically (though it is stated for Ambler hom-sets in Ambler 1996, and the bridge is open as C001 in the programme).
- **SC12.** The schemes admin allows `inheritCQs: false` as an override but does not specify the semantics. No prior work in the Walton / Macagno-Walton tradition addresses what it means to *opt out* of inherited CQs while remaining a child scheme.
- **SC13.** A child scheme's behaviour can be *empty* under any inheritance semantics if the inherited CQs are mutually unsatisfiable. No prior work addresses scheme **non-vacuity** as a well-formedness condition.

### Identification cluster (Cluster D — Q-013, S004)

- **SC14.** The empirical literature on scheme classification (Lawrence & Reed 2015 *Combining Argument Mining Techniques*; Visser, Lawrence, Reed et al. 2020 *Annotating Argument Schemes*; Feng & Hirst 2011) has produced inter-annotator agreement numbers (Cohen's κ) for scheme assignment. Report the typical range and the strongest single result; identify whether any study has measured agreement *conditional on identification-pattern matching* (the substrate's Q-013 design).
- **SC15.** The admin's `identificationPatterns` field treats scheme assignment as string-pattern matching. Locate any prior work that has *tested* whether identification patterns improve scheme-classifier accuracy versus a content-only baseline.
- **SC16.** LLM-based scheme classifiers have appeared in the last two years (Ruiz-Dolz et al. 2023; possibly others). Identify the SOTA accuracy on standard scheme-classification benchmarks (e.g. AIFdb scheme corpus) and whether the SOTA system uses pattern-style heuristics, fine-tuning, or prompt-based classification.

### Catalogue cluster (Cluster E — Q-014)

- **SC17.** Walton's own treatment of the scheme catalogue evolved over 30 years (Walton 1996 → Walton, Reed, Macagno 2008 → Macagno & Walton 2015). The catalogue is open by Walton's own practice. Locate any source — Walton's own or commentary on Walton — that proposes **well-formedness rules** for a new scheme (non-redundancy, non-vacuity, cluster-conservativity, locative-coherence, or other).
- **SC18.** The ontology-engineering literature (Gruber 1993, Guarino 1998, Guarino-Welty 2002 OntoClean) has explicit criteria for "well-formed concept in an ontology" that have *not* been applied to argumentation-scheme catalogues. Identify any cross-pollination between ontology engineering and scheme cataloguing.
- **SC19.** Folksonomy-vs-ontology has been studied as a deliberate design choice in classification systems (Mathes 2004, Peters 2009). Locate any explicit framing of the *scheme catalogue itself* as one or the other.

### Composition cluster (Cluster F — Q-015)

- **SC20.** Walton, Reed & Macagno 2008 ch. 11 addresses *chained* schemes informally. The composition is *not* given a formal semantics in that book or in subsequent Walton-school work. Identify any post-2008 formal treatment of scheme composition that goes beyond AIF's "shared node" representation.
- **SC21.** ASPIC+ supports rule chaining via its argument-construction grammar. Identify whether the Modgil-Prakken-school literature distinguishes "scheme composition" from "rule chaining" — these are not the same operation if schemes are anything more than ASPIC+ rules.
- **SC22.** The substrate's claim is that scheme composition corresponds to **cut composition of designs** (in the Faggian-Hyland 2002 DDS sense or the Terui 2011 computational-Ludics sense). No published work makes this correspondence. Confirm; or locate prior art if it exists.
- **SC23.** CQ inheritance under composition (which CQs apply to a chained S₁;S₂ argument — both, only the consumer's, or a derived bundle) has not been formally addressed in the Walton or ASPIC+ literatures. Confirm.

### Substrate-original cross-links (Cluster-spanning)

- **SC24.** The bridging document's reverse-index table (admin field → cluster → conjecture) presupposes the admin field set is reasonably complete with respect to the literature. Identify any field present in major published scheme catalogues (Walton 1996; Walton, Reed, Macagno 2008; Macagno-Walton 2015; AIFdb; ASPIC+ rule-base format; Verheij DefLog; Argdown scheme syntax) that the admin's `SchemeCreator` form does *not* expose, and flag it as a gap.
- **SC25.** The substrate's commitment to Reading C and to a structurally pre-existing dialectical layer (T4 in the Ludics substrate documents) biases the catalogue toward **ontology** (the catalogue describes pre-existing structure) over **folksonomy**. Identify whether this bias is consistent with any published philosophical position on the metaphysics of inference rules.

Claim numbering above is the canonical reference for the deliverable's Appendix A. If you find a sub-claim that needs splitting, do so in the output.

---

## §3. Bucket structure for the search

Run the search in six buckets. Allocate roughly equal effort, but cap each bucket at ~10 high-relevance sources (see §4 scope discipline). Buckets map to clusters A–F of the bridging document.

### Bucket 1 — The Walton / Macagno-Walton primary literature (Cluster A, E)

Walton 1996 *Argumentation Schemes for Presumptive Reasoning*; Walton, Reed & Macagno 2008 *Argumentation Schemes*; Macagno & Walton 2015 *Classifying the Patterns of Natural Arguments*; Walton's *Methods of Argumentation* 2013; Walton-Godden 2005 on CQ regress; Walton's *Witness Testimony Evidence* 2008. Identify the canonical statements of: scheme identity, CQ status, cluster-family semantics, scheme catalogue openness. Address SC1, SC4, SC10, SC11, SC12, SC13, SC17.

### Bucket 2 — Pollock / post-Pollock attack typology (Cluster B)

Pollock 1995 *Cognitive Carpentry*; Pollock 1987 *Defeasible Reasoning* (the original undercutter / rebutter distinction); Prakken 2010 *An Abstract Framework for Argumentation with Structured Arguments*; Modgil & Prakken 2014 ASPIC+; Doutre-Herzig-Perrussel 2023 *KR* (epistemic argumentation); Hahn-Hornikx 2016 *Bayesian critical-question approach*; Verheij 2003 *DefLog*. Address SC6, SC7, SC8, SC9.

### Bucket 3 — Computational scheme handling: AIF, ASPIC+, dialogue (Cluster A, C, F)

Chesñevar et al. 2006 AIF; Snaith & Reed 2017 *TOAST and AIF-RA*; Modgil & Prakken 2014 ASPIC+; Toni 2014 *A tutorial on assumption-based argumentation*; Verheij 2003 *DefLog*; Bex et al. 2013 *Implementing the Argument Web*; Lawrence-Reed 2015 *Combining Argument Mining Techniques* on scheme prediction. Address SC2, SC11, SC20, SC21, SC23.

### Bucket 4 — Empirical scheme classification (Cluster D)

Feng & Hirst 2011; Lawrence & Reed 2015; Visser, Lawrence, Reed et al. 2020 *Annotating Argument Schemes*; Ruiz-Dolz, Alemany, Heras 2023 (and any 2024–2025 work) on LLM scheme classification; AIFdb scheme corpora; the Hirst-Visser-Lawrence-Reed 2020 paper on inter-annotator agreement. Address SC14, SC15, SC16.

### Bucket 5 — Ontology engineering & folksonomy (Cluster E)

Gruber 1993; Guarino 1998 *Formal Ontology in Information Systems*; Guarino-Welty 2002 *OntoClean*; Mathes 2004 *Folksonomies*; Peters 2009 *Folksonomies: Indexing and Retrieval in Web 2.0*; any work on ontology-engineering applied to argumentation (rare but check). Address SC18, SC19.

### Bucket 6 — Dialogue-protocol-as-scheme treatments + Ludics-meets-Walton (Cluster A, B, F; substrate-spanning)

Hamblin 1970 *Fallacies* commitment-store rules; Mackenzie 1979 *DC dialogue*; Walton & Krabbe 1995 *Commitment in Dialogue*; Prakken 2005 *Coherence and Flexibility in Dialogue Games*; McBurney & Parsons 2009 *Dialogue Games for Agent Argumentation*. Then explicitly search for any work (probably null) that has applied **Ludics** to argumentation-scheme semantics — Lecomte-Quatrini-Tronçon-Fleury *Ludics and Natural Language* line, Fouqueré-Quatrini 2013 LMCS 9(4:6), Faggian-Hyland 2002, Basaldella 2015 *Triads*. Address SC3, SC7, SC22.

---

## §4. Scope discipline (what to *exclude*)

The deliverable must be referenceable, not encyclopedic. Exclusions:

- **Out of scope:** Walton-school primary literature beyond the named books; general defeasible-reasoning literature (Reiter, McCarthy, etc.) beyond Pollock; abstract argumentation semantics for *frameworks* (covered in the Ludics substrate review); general argument-mining literature beyond scheme classification; general LLM agent literature.
- **Skip:** middle-aged incremental work in any bucket that does not directly bear on an SC-claim. Prefer (a) recent surveys (≤ 5 years), (b) foundational papers, (c) work explicitly addressing an SC-claim. Drop the rest.
- **Do not:** re-explain Walton's argumentation-scheme apparatus from scratch — assume the reader has Walton-Reed-Macagno 2008 to hand. Do not re-explain Ludics — assume the reader has the prior Ludics-substrate literature review.

If a bucket has fewer than ~5 high-relevance sources, *say so explicitly* — that is itself a finding (the substrate is operating in genuinely under-explored territory).

---

## §5. Source-quality rules

- **Prefer:** peer-reviewed papers (journal or top-tier conference: COMMA, IJCAI, AAAI, KR, AAMAS, ACL, EMNLP, ECAI, CHI, LICS), authoritative books (Walton-Reed-Macagno 2008; Pollock 1995; Walton & Krabbe 1995), recent surveys, primary-source platform documentation (AIF spec; AIFdb; Argdown specification; Carneades).
- **Acceptable:** workshop papers (ArgMining, DELIBA, IDEA), arXiv preprints from established researchers, well-maintained open-source project documentation.
- **Avoid:** blog posts, marketing material, undergraduate theses, Wikipedia (except as navigation aid, never cited).
- **Verification:** for any load-bearing claim (especially SC1–SC4, SC22, SC23), cite at least two independent sources or explicitly note the single-source basis.
- **No fabrication:** if you cannot find a source, mark *open / inconclusive*, not *original to this track*. The "original" verdict requires you to have actively searched and found nothing.

---

## §6. Required deliverable format

Produce a single markdown document named `SCHEMES_LITERATURE_REVIEW.md`, intended to live in `Development and Ideation Documents/ARCHITECTURE/`. Use KaTeX inline math (`$...$`) and block math (`$$...$$`) consistent with the existing substrate docs.

### Required structure

```
# Argumentation Schemes Theoretical Foundations — Literature Review

**Date:** [completion date]
**Companion to:** SCHEMES_THEORETICAL_FOUNDATIONS.md
**Feeds:** SCHEMES_ONTOLOGY_DECISION_PROMPT.md (the formal-decision follow-on)
**Programme entries touched:** Q-011, Q-012, Q-013, Q-014, Q-015; C006, C007, C008; S004
**Scope and exclusions:** [verbatim from §4 of the prompt]

## §1. Executive summary
[~1 page. Top-line findings: how many claims confirmed, partially confirmed, original, contradicted, open. The single most consequential finding for each of the six clusters A–F. The three most consequential gaps the substrate is well-positioned to fill. A one-paragraph verdict on whether the C006 / C007 / C008 trilemma survives the literature pass intact, or whether prior art forces a refinement / collapse / extension.]

## §2. Bucket 1 — Walton / Macagno-Walton primary literature
[~2 pages. Narrative summary, then "Status of substrate claims" subsection covering each SC-claim assigned to this bucket with verdict + sources.]

## §3. Bucket 2 — Pollock / post-Pollock attack typology
[Same shape.]

## §4. Bucket 3 — Computational scheme handling: AIF, ASPIC+, dialogue
[Same shape.]

## §5. Bucket 4 — Empirical scheme classification
[Same shape. Report the SOTA Cohen's κ numbers in §1 verdict for SC14.]

## §6. Bucket 5 — Ontology engineering & folksonomy
[Same shape.]

## §7. Bucket 6 — Dialogue-protocol-as-scheme + Ludics-meets-Walton
[Same shape. The Ludics-meets-Walton sub-bucket is likely null; if so, say so prominently — that is the substrate's most original surface.]

## §8. Reference-cluster index
[Flat list of ~30–60 canonical citations, organised by bucket. Each citation: full reference + 1–3 sentence relevance note tying it to specific SC-claims. Grep-friendly.]

## §9. Concrete revisions to SCHEMES_THEORETICAL_FOUNDATIONS.md
[Bulleted list. Each bullet: "If finding X holds, update SCHEMES_THEORETICAL_FOUNDATIONS.md § Y to [proposed change]." Actionable, not aspirational.]

## §10. Concrete inputs to SCHEMES_ONTOLOGY_DECISION_PROMPT.md
[Bulleted list. Each bullet: which prior art the follow-on formal-decision prompt should cite, which arguments the formal pass should engage with, which counterexamples it should test C006/C007/C008 against. This is the deliverable's payload for the next pass.]

## §11. Open research questions surfaced
[Items the review found that the substrate had not anticipated. Numbered, with a one-paragraph framing each. These feed the programme as candidate Q-NNN entries.]

## Appendix A — Claims verdict table
[Compact table: Claim ID | one-line restatement | Verdict | Primary source(s) | Secondary source(s) | Notes. All 25 claims from §2 of this prompt, in order, with any sub-splits.]
```

### Length target

15–25 pages total. §§2–7 roughly equal weight (~2 pages each), §8 dense, §9 and §10 short and pointed, §11 brief. The SC1–SC4 ontology cluster and the Ludics-meets-Walton sub-bucket of Bucket 6 are the highest-leverage findings; spend slightly more space there if budget allows.

### Style

- Match the substrate-doc voice: precise, claim-first, no hedging filler, KaTeX inline math, double-quoted code identifiers, sub-section headings as questions only when the question is the structuring device.
- Cite inline as `(Author Year)` with full reference in §8. No footnotes.
- When summarizing a paper, say *what it claims* before *whether it confirms the substrate*. Reverse order makes the review feel selective.

---

## §7. Process guidance for the agent

- **Order of work:** Start with Bucket 1 (Walton primary literature) since SC1, SC10, SC11, SC17 are load-bearing and quickly checkable against canonical sources. Then Bucket 6 (Ludics-meets-Walton sub-bucket) since a null result there is the substrate's clearest original-territory finding. Then Buckets 2–5 in parallel as time allows.
- **When a claim resolves quickly:** note it in Appendix A, move on. Do not spend extra effort on confirmed claims with strong sources.
- **When a claim resists resolution:** spend up to ~30 minutes of focused search before declaring *open / inconclusive*. Do not chase indefinitely.
- **When you find a substrate-relevant result the prompt did not anticipate:** surface in §11. Do not silently fold into existing sections.
- **When you find prior art that the substrate appears to duplicate:** flag prominently in §1 and §9. This is the highest-value possible finding.
- **When you find a contradicting source:** cite precisely, state what it would imply for the substrate, recommend a specific revision in §9 and a specific decision-prompt input in §10.
- **Do not weaken claims to avoid contradictions.** The substrate authors want sharp verdicts. *Original to this track* is a valid finding when genuinely the case.
- **Special care on SC4 (mutual exclusivity of C006/C007/C008).** If you find a published *layered* position (e.g. a semantic / structural / procedural account that explicitly nests), this is the single most consequential finding in the review. Surface in §1, expand in §10.

---

## §8. Out-of-band note: parallel manual review

The manual review and this agent review should converge on the same Appendix A table. Disagreements are the most useful artifact of running both in parallel — they identify either (a) sources one side missed, or (b) interpretive ambiguity in the substrate claims. Reconcile by editing the prompt's §2 to sharpen the claim, not by averaging the verdicts.

When merging the two reviews into a final single document, prefer the agent's §8 reference index (likely more comprehensive) and the human's §9 / §10 revisions and decision-prompt inputs (likely more actionable). §1 should be co-authored.
