# Ludics Generative Substrate — Literature Review

**Date:** May 17, 2026
**Companion to:** `LUDICS_GENERATIVE_SUBSTRATE.md`, `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`, `LUDICS_OPEN_COMPOSITION_JOINT.md`, `LUDICS_USEFULNESS_BRAINSTORM.md`
**Scope and exclusions:** Pressure-tests 20 falsifiable claims arising from the conceptual track on Ludics as a generative substrate for multi-agent deliberation in the Isonomia platform. Out of scope: Girard's Ludics math foundations (2001), Dung-onward abstract argumentation foundations, general LLM-agent literature, deliberative-democracy theory beyond the named touchpoints. Six research buckets cover: (1) post-Girard dialogical Ludics, (2) Ambler/ECC-style categorical argumentation, (3) ASPIC+ / AIF / dynamic frameworks, (4) commitment-store and dialogue-game literature, (5) deliberative-democracy theory and deployed platforms, (6) LLM/MCP agents over structured argumentation (2023–2026).

---

## §1. Executive summary

Of the 20 falsifiable claims tested, **9 are confirmed** with ≥2 independent sources (C2, C6, C7, C9, C11, C12, C13, C16, C18), **2 are confirmed with caveats** (C8, C19), **4 are partially confirmed with substantive caveats** (C1, C14, C15, C17), **4 are classified original-to-this-track** after active search (C4, C10, C20, and the joint-saturation half of C20), **1 is a single-source structural identification** that the substrate proposes rather than inherits (C3), and **2 are open/inconclusive in the dialogue-Ludics literature** (C5). No claim is contradicted outright, but several should be re-stated more carefully.

**The five most consequential findings:**

The **C3 load-bearing identification** — `Art(B) ≅ Hom_{A_Γ}(A,B)` — is **not in the prior literature** in either direction. Ambler's 1996 enriched-CCC argumentation paper (MSCS 6(2):167–188) and the Ludics literature (Girard 2001; Fouqueré & Quatrini 2013) are entirely disjoint citation communities. The two halves of the identification are each well-attested independently; the bridge itself is original to this track and must be presented as such with explicit single-source basis. Moreover, **"ECC" in the substrate's framing is a misnomer**: Ambler 1996 is a semilattice-enriched cartesian closed category in the Kelly/Lawvere/Pitts lineage, *not* Luo's Extended Calculus of Constructions.

The **Reading C commitment** (Opponent = the behaviour $\sigma(D_P)^\perp$ itself, not a coalition or per-participant) is **genuinely absent from every multi-agent Ludics paper located** — the dialogical-Ludics tradition (Lecomte, Quatrini, Fleury, Tronçon, Fouqueré, Basaldella, plus Bougsty-Marshall AGI 2020) is uniformly bilateral Player/Opponent. The closest stepping-stone is Basaldella's "Triads" abstraction (2014/2015), which removes the player-commitment without going to Reading C. C7 and C20 are confirmed with high confidence.

The **two-layer T4 architecture has no formal precedent in deliberative-democracy theory**, but the substrate's claim that "Cohen on legitimacy without identifiable authorship" is the closest analog **overreaches Cohen's actual position**: Cohen 1989's criterion is "reasons all could accept," a content-side condition logically independent of authorship anonymity. The more honest analogs are **Habermas's "anonymous popular sovereignty" passage** (BFN 1996 p. 486) and **Fishkin's aggregate-only Deliberative-Polling reporting discipline**.

The **fidelity-scorecard discipline (C17) and fossil-record discipline (C19)** appear to be genuinely original — but with **one near-miss each**. Prakken's 2024 *Artificial Intelligence* paper on "dialectical argument strength via expansions" is the closest existing structural-objection-space construct (relevant to C8). Prakken-style `retract` in commitment stores — exposed via the deployed **warrant-mcp** server — is the closest fossil analog for C19.

Exactly **one production MCP server over structured argumentation exists** as of May 2026 (warrant-mcp, jayden-chmod): it covers Dung/ASPIC+/Prakken/Pollock/Walton but has zero Ludics-native primitives. C16 holds.

**The five most consequential gaps the substrate is well-positioned to fill:**
First, the Ludics-Ambler bridge as a published mathematical result; second, a formal Reading-C multi-agent Ludics; third, an "exposure-map / stratified objection space" generalizing Prakken-2024 expansions with participant-access modality; fourth, an upstream NL→canonical-move pipeline as a typed operation rather than an offline argument-mining recipe; fifth, an MCP surface whose primitives are loci, exposure-map slices, and articulation-lattice queries rather than Dung extensions.

---

## §2. Bucket 1 — Ludics applied to dialogue/argumentation

Post-Girard Ludics splits into two largely independent tracks. The **technical track** (Faggian, Basaldella, Terui, Curien, Saurin, Fleury, Fouqueré, Quatrini) develops behaviours, incarnations, internal completeness, computational reformulations, and least-/greatest-fixed-point structure. The **dialogue/argumentation track** (Lecomte, Quatrini, Tronçon, Fleury, Fouqueré) is largely an artifact of the French ANR PRELUDE project (2006–2009), culminating in Lecomte & Tronçon's edited volume *Ludics, Dialogue and Interaction* (LNAI 6505, Springer 2011) and Lecomte's monograph *Meaning, Logic and Ludics* (Imperial College Press 2011). The dialogue track has been essentially dormant since ~2013, with only sporadic continuation (e.g., Fouqueré–Pinto–Quatrini 2021 on incoherent dialogues, Trognon's 2TK model).

A striking finding: **the entire dialogue-Ludics literature operates within a strictly two-role Proponent/Opponent framework** inherited from Lorenzen-style dialogical logic. No paper found treats the behaviour itself ($\sigma(D_P)^\perp$ as a set) as the Opponent role. Multi-participant settings, when discussed, are handled either by nesting bilateral dialogues (Fleury–Quatrini–Tronçon 2011) or by informal appeals to Ducrot-style polyphony (Lecomte 2009). The **COMMA/IJCAI/KR argumentation community has not engaged with Ludics at all** — the substrate's question is genuinely under-explored, not just under-cited.

A terminological warning: **"saturation" already has a Ludics meaning** in Fouqueré–Quatrini 2018 (closure conditions on visitable paths), distinct from the substrate's "protocol saturation." Publication will require explicit disambiguation.

### Status of substrate claims

**C1** *(behaviour as join-semilattice under inclusion of designs)* — **partially confirmed**. The inclusion order on designs within a behaviour is standard and explicit in Girard (2001 *Locus Solum*, MSCS 11(3)) and Fouqueré & Quatrini (2013, LMCS 9(4), arXiv:1307.1028: "*incarnation… is defined as its subdesign that is the smallest one in the behaviour ordered by inclusion*"). However, **designs in a behaviour are not literally closed under union**: a behaviour $B = B^{\perp\perp}$ is bi-orthogonal-closed, not union-closed. To get a genuine join, one must either take $(D_1 \cup D_2)^{\perp\perp}$ or restrict to a sub-poset where unions stay in $B$. Baelde, Doumane & Saurin (CSL 2016, hal-01256773) prove that the *set* of positive behaviours $CP$ is a complete lattice under inclusion, but this is *between* behaviours, not on designs *inside* one behaviour. Fleury & Saurin (CSL 2017, LIPIcs 82:34) prove internal completeness for ω-unions in regular behaviours — implying a directed-union structure for a subclass. **Recommendation:** state $\text{Art}(B)$ as $(B, \leq_\subseteq)$ with binary upper bounds via $\perp\perp$-closure, not as raw union.

**C2** *(minimal elements = Girard's incarnations)* — **confirmed**. Direct definitional match in Girard (2001) and Fouqueré & Quatrini (2013), restated in Basaldella & Faggian (LMCS 2011, arXiv:1104.0504) and Curien (arXiv:cs/0501035).

**C4** *(stratification of $\sigma(D)^\perp$ into walked/reachable-in-k/latent)* — **original to this track**. Fouqueré & Quatrini's "saturation" (LMCS 14(2), 2018, arXiv:1403.3772) is closure conditions on visitable paths, *not* a stratification by external instantiation depth. Terui's *Computational Ludics* (TCS 412(20), 2011) treats $\sigma(D)^\perp$ as languages of a c-design automaton without k-stratification. No published Ludics work partitions the orthogonal by a participant-access modality. Active-search null result.

**C5** *(time-indexed directed system $\{B_t\}$ with partial transitions)* — **open/inconclusive**. Fleury & Saurin (CSL 2017) supply a directed-system of inductively-defined behaviours $\text{Nat}_n \subset \text{Nat}$ (consistent with Girard's framework), but this is a type-construction artifact, not "behaviours evolving over deliberative time." Lecomte–Quatrini (Synthese 183, 2011) describe dialogue convergence dynamically without formalizing $\{B_t\}$ with explicit transition maps. The substrate's construction is consistent with but not directly attested in the literature.

**C6** *(delocation extending $D$ to a new locus)* — **confirmed**. Delocation is primitive in Girard (2001), used explicitly in dialogue examples by Fouqueré & Quatrini (LACL 2012, hal-01286851: "*the design $D_\alpha$ obtained by means of a shift and a delocation… from $\sigma$ to $\alpha.0$*"), and treated in Fleury & Saurin (2017). **Caveat:** standard delocation is single-design between bases of the same shape; the substrate's stronger version (locus *addition* recomputing behaviour membership) is not explicitly analyzed.

**C7** *(no published multi-agent Ludics commits to Reading C)* — **confirmed (load-bearing, 6+ independent sources)**. Lecomte & Quatrini ("Figures of Dialogue," *Synthese* 183, 2011), Fleury–Quatrini–Tronçon ("Dialogues in Ludics," LNCS 6700, 2011), Fleury & Tronçon ("Speech Acts in Ludics," LNAI 6505, 2011), Fouqueré & Quatrini ("Ludics and Natural Language: First Approaches," LACL 2012), Lecomte–Quatrini–Fleury ("Ludics and Anti-Realism": "*confrontation between two players*"), and Bougsty-Marshall (AGI 2020, LNAI 12177) all adopt bilateral Reading A. Basaldella's "Triads" (arXiv:1502.04773) abstracts to $(P, N, \perp)$ but keeps $P$ and $N$ as two disjoint sides; the orthogonal set is not promoted to a role. Reading C is genuinely uninstantiated.

**C20** *(joint saturation $\sigma_{\text{joint}}(D_P, \text{Witness})$ as forward closure over participation, deliberative progress as exposure-map drainage)* — **original to this track**. No paper found defines a joint-saturation operator over multiple Proponent designs. Multi-agent reductions in the literature merge into bilateral dialogues (Reading A); Reading C dissolves this need. Active-search null result.

---

## §3. Bucket 2 — Ambler / categorical argumentation and ECC

### Locating Ambler 1996 and disambiguating "ECC"

The reference is **Simon J. Ambler, "A categorical approach to the semantics of argumentation," *Mathematical Structures in Computer Science* 6(2): 167–188 (April 1996), DOI 10.1017/S0960129500000931**, with predecessor tech-report (QMW TR-606, 1992). Ambler's other major work — the 1991 Edinburgh PhD thesis on first-order linear logic in symmetric monoidal closed categories (hdl 1842/11974) — is a *different* paper on a different topic. Companion: Krause, Ambler, Elvang-Gøransson & Fox (1995), "A logic of argumentation for reasoning under uncertainty," *Computational Intelligence* 11(1): 113–131.

**Important disambiguation:** the substrate's "ECC-style categorical argumentation" terminology conflates two unrelated formalisms. Ambler 1996 is a **semilattice-enriched cartesian closed category** ("evidential closed category") in the Kelly–Lawvere–Pitts enriched-category lineage with Lambek–Scott CCC structure and Dempster–Shafer confidence. Luo's **Extended Calculus of Constructions** (Edinburgh PhD 1990, LFCS ECS-LFCS-90-118; LICS 1989) is a dependent type theory, unrelated to argumentation. **Recommendation:** the substrate documents should drop "ECC" or replace with "evidential closed category" / "semilattice-enriched CCC."

Ambler's construction: arguments are arrows of a semilattice-enriched category. Hom-sets $\text{Hom}(A, B)$ carry a join $\vee$ corresponding to **increasing monotonic aggregation** of arguments supporting the same conclusion. The CCC axioms are modified to model $\wedge / \Rightarrow$ in an evidential closed category. Confidence (Dempster–Shafer) layers on top.

**Bridge to Ludics:** Faggian & Hyland (CSL 2002 "Designs, Disputes and Strategies") connects designs to HO innocent strategies; Baelde, Doumane & Saurin (CSL 2016) prove $CP$ is a complete lattice; Fouqueré & Quatrini (2013) treat incarnation as the minimum-in-inclusion-order. **However, no published work identifies a Ludics behaviour with an Ambler hom-set, in either direction.** The citation graphs of Ambler 1996 (Crossref: Fox–Das 1996; Matt–Toni 2008; McBurney–Parsons 2005/2009; Yearwood–Stranieri 2006) stay in argumentation/AI/decision-support; the Ludics literature never cites Ambler.

### Status of substrate claims

**C3** *(load-bearing: $\text{Art}(B) \cong \text{Hom}_{A_\Gamma}(A, B)$ as join-semilattices)* — **single-source structural identification, originally proposed in this track**.

Each of the two halves is independently well-attested:
- *Ambler-side:* Ambler 1996 (primary) plus Krause–Ambler–Elvang-Gøransson–Fox 1995 (confirming): hom-sets are join-semilattices of derivations with $\vee$ as aggregation. ✓
- *Ludics-side:* Girard 2001 plus Fouqueré–Quatrini 2013: designs in a behaviour form an inclusion poset with canonical minima (incarnations). ✓

But the **identification itself** — that these are the *same* mathematical object — is not asserted in any source located. Two technical caveats must be surfaced in the manuscript:

1. **Behaviours are not closed under design-union without bi-orthogonal closure** (see §2 C1 above). Ambler's $\vee$ is genuinely a semilattice operation; Ludics inclusion lacks closure under set union without going through $\perp\perp$. Either define $D_1 \vee D_2 := (D_1 \cup D_2)^{\perp\perp}$, or restrict to incarnated subposets, or weaken the claim to "poset with bottom" rather than "join-semilattice."
2. **Ambler's $\vee$ carries confidence-weighted aggregation**; pure union is the special case where confidence is erased. The identification holds modulo a confidence-erasure functor.

The slogan "minimal incarnations correspond to selected arrows" requires textual verification against the full 1996 PDF (paywalled; only the abstract, reference list, and citation network were inspected). **Recommendation:** state C3 explicitly as a structural identification proposed by the present work, with Ambler 1996 and Girard 2001 + Fouqueré–Quatrini 2013 as anchor sources for the two halves, and flag that no prior author makes the bridge. This is honest single-source basis, not fabricated multi-source confirmation.

**C10** *(ECC composition lifts to articulation-lattice composition, but not written out for deliberation)* — **substantively correct**. Composition in a semilattice-enriched category lifts pointwise to a $\vee$-preserving operation on hom-semilattices (Kelly 1982, Pitts 1988 enriched-category background cited by Ambler). The mechanism is available. No paper writes this out for deliberation. The argumentation-composition literature instead works at graph-aggregation (Endriss & Grandi, *AI* 2017), judgment aggregation (Awad, Booth, Tohmé & Rahwan 2014), or modular semantics of weighted bipolar AFs (Mossakowski & Neuhaus 2019) — none categorical in Ambler's sense.

---

## §4. Bucket 3 — Structured argumentation: ASPIC+, AIF, dynamic frameworks

The three intertwined lines — **ASPIC+** (Caminada & Amgoud 2007; Modgil & Prakken 2013 AI 195:361–397, with 2018 corrigendum; 2014 tutorial in *Argument & Computation* 5(1)), **AIF** (Chesñevar et al. 2006 KER 21(4); Reed et al. COMMA 2008 "AIF+"; Modgil & McGinnis 2008; Bex–Prakken–Reed COMMA 2010), and **dynamic argumentation** (Cayrol–de Saint-Cyr–Lagasquie-Schiex JAIR 2010; Baumann 2012; Coste-Marquis et al. IJCAI 2015; Baumann–Doutre–Mailly–Wallner 2021 enforcement survey) — converge on the following picture relevant to the substrate.

ASPIC+ attacks are generated **deterministically** from the rule base via the three syntactic attack types (undermining, undercutting, rebutting). Acceptability is computed post-hoc via Dung-style labellings or extensions. There is no modality on attacks — no "this attack exists, but has anyone uttered it / could anyone utter it / is it currently latent?" AIF is explicitly a **representation** ontology, not a generative space: I-nodes, S-nodes (RA / CA / PA), L-nodes (as a subclass of I-nodes), TA-nodes for transitions. The AIF+ dialogue layer is utterance-anchored: locutions are speech events about participants, and the formalism ties illocutionary force to argument structure through Inference Anchoring Theory (Budzyńska & Reed, CMNA 2010).

**The most consequential unanticipated finding for this bucket** is **Prakken (2024), "An abstract and structured account of dialectical argument strength," *Artificial Intelligence* 335: 104193**. Prakken defines argument strength in terms of *the set of possible successful attacks in expansions of an AF* — counterfactual attackers that *could be added*, irrespective of whether anyone utters them — and instantiates this in ASPIC+. This is the closest existing analog in the structured-argumentation tradition to a "structural objection space independent of utterance." It does not have the substrate's walked/witnessable/latent stratification (the model is binary), and is parametrized by a base rule set rather than a Ludics design, but it is closer than the substrate's framing acknowledges.

Adjacent constructs: **incomplete AFs** with *completions* (Baumeister et al. 2021; Mailly 2020; Fazzinga et al. IJCAI 2025) reify possible-worlds over argument/attack existence but the uncertainty is propositional, not modally stratified by participant access; **ABA potential arguments** (Toni 2014 tutorial; Springer 2024 on completing structured arguments) are partial proof trees, conceptually adjacent to "latent" but operating inside argument construction, not opposition layer; **Baumann–Brewka enforcement** is goal-directed (toward extension targets), not a stratified opposition map.

### Status of substrate claims

**C8** *(ASPIC+ has no exposure-map analog)* — **confirmed with caveat**. ASPIC+ labelling is post-hoc dialectical bookkeeping over an already-generated attack graph (Baroni–Caminada–Giacomin KER 2011); Caminada's discussion games are proof-procedural recasts of labelling. The substrate's claim holds. **Caveat: Prakken 2024 expansion-based dialectical strength** is a partial structural-objection-space construct in the same conceptual neighborhood. The walked/witnessable/latent stratification is genuinely absent in both ASPIC+ and Prakken 2024, but the substrate should explicitly position the exposure map *relative to* Prakken's expansions rather than against vanilla ASPIC+ labelling.

**C9** *(AIF has no attribution-independent objection space)* — **confirmed**. CA-nodes represent conflicts *asserted*, not a space of possible conflicts. L-nodes are a subclass of I-nodes (locutions are propositions about speech events), and TA-nodes anchor protocol transitions between locutions; the entire dialogue layer (Reed et al. 2008; Modgil & McGinnis 2008; Bex–Prakken–Reed 2010) is utterance-anchored and attribution-default. Snaith & Reed's Dialogue Induction Algorithm (2016) inducts a grammar from analysed transcripts.

**C10 (cross-check)** *(composition not written as articulation-lattice join in ASPIC+/AIF)* — **confirmed**. ASPIC+ composition is tree-grafting; AIF composition is set-theoretic graph union under typing constraints (Bex–Prakken–Reed 2010 §3). The closest lattice-theoretic streams (Amgoud & Vesic KR 2012; Oikarinen & Woltran AI 2011 strong equivalence; Caminada & Pigozzi JAAMAS 2011 commitment order on labellings) order labellings or characterize equivalence — not argument composition as lattice join.

---

## §5. Bucket 4 — Dialogue systems and commitment stores

Hamblin (1970 *Fallacies*) introduced commitment stores keyed per-participant, with locutions (statement / no commitment / question / why) as side-effecting operations. Walton & Krabbe (1995 *Commitment in Dialogue*) consolidated the paradigm, added the six-type dialogue typology (persuasion, negotiation, information-seeking, inquiry, deliberation, eristic) with shifts and mixed types, and split light-side from dark-side commitments. Singh (1999 *AI & Law* 7; 2000 IJCAI ACL workshop) redirected for multi-agent systems with the four-place social-commitment relation $C(\text{debtor}, \text{creditor}, \text{antecedent}, \text{consequent})$ in a sphere of commitment, explicitly against mentalist (Cohen–Levesque / FIPA-ACL) semantics. McBurney & Parsons (2002 *JLLI* 11(3); 2009 chapter) lifted dialogue games into multi-agent protocol design with a three-tier topic/dialogue/control architecture. Wells & Reed (2012 *J. Applied Logic*) provided DGDL.

**The Singh distinction is genuinely close but not the same.** Singh separates the speech act (verb) from the commitment object (noun) — an act-vs-state distinction. The substrate separates an anonymous structurally-prior dialectical move from an attributed witness — a layer distinction. Mathematically: Singh has *act creates state* (attributed → attributed-new-state); the substrate has *witness binds to pre-existing locus* (attributed → anonymous). These are dual rather than equivalent.

**The closest published precedent** for two-layer maps is **McBurney & Parsons (2005), "A Mathematical Model of Dialog,"** *ENTCS* — category-theoretic maps between utterance objects and commitment objects. But it does not name the construct, does not generalize to four grain sizes, does not impose the records-only invariants, and treats both objects as attributed.

**Argument mining is structurally suggestive for C13** — Lawrence & Reed (*Computational Linguistics* 2019) and the DialAM-2024 shared task use staged pipelines (locution segmentation → proposition extraction → illocutionary-relation labelling → propositional-relation labelling) that resemble the substrate's NCM stack. But argument mining is **offline on transcripts**, not an upstream live gate on commitment binding.

### Status of substrate claims

**C11** *(Hamblin attribution by default; dual-layer not standard — load-bearing)* — **confirmed both halves**. Per-participant indexing is unambiguous in Hamblin (1970 p. 246), Walton (2010 *Argument & Computation* on light/dark-side stores), Walton & Krabbe (1995 ch. 4), and the Gibson/Hitchcock secondary literature. No standard framework has the anonymous-structural / attributed-witness separation joined by an explicit $\iota$. McBurney & Parsons' three-tier (topic / dialogue / control) is *vertical* (content / protocol / meta), not the substrate's separation. Brandom (1994 *Making It Explicit*) bakes attribution in from the start. ≥6 independent sources.

**C12** *(no formal pre-existing-move vs. utterance separation; I1–I4 invariants novel)* — **confirmed**. In Walton & Krabbe, locution and commitment-effect are unified in a single rule schema. Singh's speech-act → commitment-state pattern is the closest analog but goes in the opposite direction (attributed event creates new attributed state). McBurney & Parsons separate locution-rule from commitment-rule but both operate on the same speech-act object; no anonymous structural locus pre-exists. The records-only / idempotent / locus-injective / total-modulo-extension discipline on $\iota$ is absent.

**C13** *(no graded canonicalization pipeline upstream of commitment binding)* — **confirmed**. Clarification dialogues (Purver 2004; Ginzburg; Benotti & Blackburn 2021) are sub-dialogues, not pipelines gating store updates. Argument mining (Lawrence & Reed 2019; DialAM-2024) operates offline. Walton's examination dialogue (2006) is content-level, not a normalization stage. DGDL (Wells & Reed 2012) specifies move grammars but no NL→canonical funnel.

**C18** *(no established name for "one operation, four call sites")* — **confirmed**. Singh's commitment-protocol refinement and aggregation (Chopra & Singh) concerns composing protocols, not reusing a single binding at multiple grain sizes. McBurney & Parsons (2005 ENTCS) has category-theoretic maps but no four-grain generalization. No literature term identified.

---

## §6. Bucket 5 — Deliberative democracy theory and deployed platforms

### Theory

**No major deliberative-democracy theorist formally proposes a T4-style two-layer separation.** Each of the five named touchpoints:

**Habermas (1996 *Between Facts and Norms*)** develops a two-track model (informal public sphere → formal institutions). The passage on p. 486 — "popular sovereignty, even if it becomes anonymous, retreats into democratic procedures" — is the strongest single sentence in the canon resembling layer-anonymity, but it concerns the *subjectlessness of communicative power as it flows through procedure*, not a structural attribution-architecture separation. **This is closer to T4 in spirit than the substrate's current "Cohen" framing acknowledges.**

**Cohen (1989 "Deliberation and Democratic Legitimacy," in Hamlin & Pettit eds.; reprinted Bohman & Rehg 1997)** — actual core text on p. 22: "outcomes are democratically legitimate if and only if they could be the object of a free and reasoned agreement among equals." This is a **content-side condition on reasons**, not authorship anonymity. **The substrate's gloss "legitimacy without identifiable authorship" overreaches Cohen.** A more accurate reading is "legitimacy via reasons all reasonable participants could accept," which does not imply or require attribution anonymization.

**Mansbridge (1999 "Everyday Talk in the Deliberative System")** expands deliberation to informal talk. Register/site distinction, not attribution-layer separation. **Mansbridge et al. (2012 "A Systemic Approach to Deliberative Democracy")** is the **strongest pre-existing structural-architecture analog**, dividing deliberative labour across epistemic/ethical/democratic functions distributed across components. The layers are functional, not anonymized-vs-attributed; accountability requires attribution.

**Estlund (2008 *Democratic Authority*)** is epistemic proceduralism; no attribution-layer architecture.

**Fishkin (2009 *When the People Speak*; Fishkin & Luskin *Acta Politica* 2005)** Deliberative Polling® has **the most anonymity-disciplined methodology**: confidential pre/post surveys, aggregate-only reporting, fully attributed face-to-face discussion. This is **the strongest applied analog** — a two-mode architecture in practice — but it remains a methodological reporting discipline, not a theoretical architecture.

**Landemore (2020 *Open Democracy*)** treats transparency as a foundational principle, which **pulls against T4-style structural anonymity**.

### Platforms

**No deployed platform implements T4 in its strict form.** The landscape is overwhelmingly **attribution-default with strong identity verification**: Decidim (Visitor / Participant / Verified Participant via DNI/NIE/passport/SMS/IdCat Mòbil), Consul Democracy / Decide Madrid (verification required for 1%-threshold counting), Loomio (name + username + email + Gravatar throughout), Stanford Online Deliberation Platform (named within small-group, aggregate-only reporting per Fishkin discipline).

**Pol.is (Small et al. 2021, *Recerca* 26(2), doi:10.6035/recerca.5516; Small et al. 2023 arXiv:2306.11932)** is the only major **pseudonymous-by-default** platform. Login via social-media OAuth, but participant identifiers are not displayed alongside comments; votes are private. The **"opinion landscape" is a derived analytic on votes** (PCA / k-means clustering), not a separately maintained dialectical repository. Closest to T4-spirit in deployment but not T4-form.

**Kialo Edu's Anonymous Discussion mode** is unexpectedly close in *spirit*: each user gets a random color-animal pseudonym, persistent within a discussion but different across discussions, on top of an intrinsically structural argument tree. **However, Owners/Admins retain full real-name visibility, and there is no formal records-only $\iota$.** Classification: structural-content + configurable pseudonymous attribution.

Friess & Eilders (2015 *Policy & Internet* 7(3), doi:10.1002/poi3.95) confirm that the systematic-review literature treats anonymity as a *single throughput parameter* (anonymous / pseudonymous / real-name), not as an architectural layer.

### Status of substrate claims

**C14** *(no theorist formally proposes T4-style separation — load-bearing)* — **confirmed with substantive correction**. The substrate's "Cohen on legitimacy without identifiable authorship" is **not faithful** to Cohen 1989 and should be replaced. Better honest analogs: **Habermas's "anonymous popular sovereignty" image** (BFN 1996 p. 486), **Mansbridge et al.'s 2012 systemic decomposition** (functional-layer architecture), and **Fishkin's aggregate-only reporting discipline**. ≥3 independent confirming sources for the negative claim.

**C15** *(no deployed platform maintains T4 separation)* — **confirmed**. Closest analogs: Pol.is (pseudonymous + opinion landscape) and Kialo Edu Anonymous Discussions (structural tree + peer-pseudonymous). Neither implements records-only $\iota$. Friess & Eilders confirm anonymity-as-parameter rather than anonymity-as-architecture.

---

## §7. Bucket 6 — AI agents over structured argumentation (2023–2026)

As of mid-2026, the LLM-over-argumentation intersection runs along three tracks. **Argument mining with LLMs** (Pietroń et al. 2026 arXiv:2603.19253; Altemeyer et al. 2025; Liu et al. 2024 AMELIA; Cabessa et al. 2025; survey arXiv:2506.16383) evaluates by F1 against gold AIF-style annotations. **LLM-as-judge / argument quality** (Mirzakhmedova et al. arXiv:2404.09696; Wachsmuth-lineage arXiv:2403.16084; "Debatable Intelligence" arXiv:2506.05062; Zheng et al. NeurIPS 2023 + survey arXiv:2411.15594) converges on human-rating-or-LLM-judge with documented biases. **LLM agents over argument graphs** (ArgMed-Agents arXiv:2403.06294; Agent4Debate arXiv:2408.04472; Argunauts/Argdown; ARGORA arXiv:2601.21533; ArgRAG with QBAFs; multi-agent dialectical refinement arXiv:2603.27451) wire to Dung AFs, bipolar AFs, QBAFs, or Argdown reconstructions, with flat graph operations.

**Exactly one MCP server over structured argumentation exists**: **warrant-mcp** (jayden-chmod, 2025–2026, on glama.ai), with 10 tools — Dung extensions, h-Categorizer / counting / bipolar scoring, Walton scheme matching, Pollock defeater classification, Prakken dialogue moves including `retract`, ASPIC+ disagreement diagnosis. **Its presence confirms rather than falsifies C16**: even the most argumentation-aware MCP server stops at Dung/ASPIC+/Prakken with no Ludics primitives (no locus, no exposure map, no articulation lattice, no witnessing record). Other live argument-graph back-ends are AIFdb / Argument Web middle-layer (Lawrence et al. COMMA 2012; Bex et al. *CACM* 2013) with queries "what supports X / what conflicts with Y," and Argdown (argdown.org, @argdown/cli) with parse/validate/compile and JSON/DOT/GraphML/SVG exports. Kialo has no public API beyond CSV/JSON export.

### Status of substrate claims

**C16** *(no MCP / tool-use surface exposes Ludics-native reads — load-bearing)* — **confirmed**. warrant-mcp is grounded in 1995–2010 abstract/structured argumentation; its schema has nothing corresponding to Ludics loci, exposure maps, articulation lattices, witnessing records, or stratified-objection space. AIFdb middle-layer queries are richer than commonly cited (support / conflict / participant / legal-moves) but still graph-flat. ≥2 independent sources confirming the gap.

**C17** *(fidelity-scorecard discipline not standard)* — **confirmed**. Evaluation in the surveyed literature is either F1 against static gold annotation (a *one-shot extraction test*, not a live regression test against a recomputed structural manifest) or LLM-judge / human rating for argument quality. The Planner–Auditor decoupling pattern (Wu et al. 2026) is in the spirit of structural regression but not argumentation-specific. **Caveat:** argument-mining F1 is technically a structural metric in a narrow sense and the substrate's framing should clarify that fidelity-scorecard means *continually-recomputed manifest*, not *static gold*.

**C19** *(fossil-record discipline has no standard analog)* — **confirmed with near-miss**. **Prakken's `retract` speech act** (instantiated in warrant-mcp's `dialogue_move`) is the closest analog: the dialogue transcript preserves `claim φ` and subsequent `retract φ`, but the retracted move is not tagged with "no longer applies to current $D_P$" plus a back-pointer to its target locus. The argumentation-dynamics literature (Cayrol et al. JAIR 2010; Baumann 2012, 2019; Baumann–Gabbay–Rodrigues AAAI 2020 "Forgetting an argument"; Boella–Kaci–van der Torre 2009; the 2024 *IJAR* "Dynamic collective argumentation") is overwhelmingly forward-only: contraction/revision produces a *new* framework; the contracted argument is not preserved in an attribution layer flagged as fossil. AIF supports node timestamps but no "retracted-but-once-walked" query. General LLM audit-trail work (Ojewale et al. arXiv:2601.20727) is organizational-compliance, not argumentation-semantic.

---

## §8. Reference-cluster index

### Bucket 1 — Post-Girard dialogical Ludics

1. **Girard, J.-Y. (2001).** "Locus Solum: From the rules of logic to the logic of rules." *Mathematical Structures in Computer Science* 11(3): 301–506. Foundational: defines designs, behaviours, incarnation, delocation/fax, bi-orthogonal closure. Anchor for C1, C2, C6.
2. **Fouqueré, C. & Quatrini, M. (2013).** "Incarnation in Ludics and maximal cliques of paths." *Logical Methods in Computer Science* 9(4). arXiv:1307.1028. Canonical post-Girard treatment of incarnation as minimum-in-inclusion-order. Anchor for C2; supports C1.
3. **Fouqueré, C. & Quatrini, M. (2018).** "Study of behaviours via visitable paths." *LMCS* 14(2). arXiv:1403.3772. Only published "saturation" framing in Ludics — closure conditions on visitable paths. Establishes terminological collision warning for C4.
4. **Lecomte, A. & Quatrini, M. (2011).** "Figures of dialogue: a view from Ludics." *Synthese* 183(Suppl-1): 59–85. DOI 10.1007/s11229-011-0014-6. Most-cited Ludics-for-dialogue paper; strictly bilateral. Primary evidence for C7.
5. **Lecomte, A. & Tronçon, S., eds. (2011).** *Ludics, Dialogue and Interaction: PRELUDE Project 2006–2009.* LNAI 6505, Springer. Definitive collected volume for the dialogue-Ludics track. Multiple chapters relevant to C7.
6. **Fleury, M.-R., Quatrini, M. & Tronçon, S. (2011).** "Dialogues in Ludics." In *Logic and Grammar* (Pogodalla, Quatrini & Retoré eds.), LNCS 6700, Springer, pp. 138–157. Bilateral dialogue formalization; supports C7.
7. **Fouqueré, C. & Quatrini, M. (2012).** "Ludics and Natural Language: First Approaches." LACL/LNCS. HAL hal-01286851. Explicit delocation in dialogue examples; supports C6 and C7.
8. **Basaldella, M. & Faggian, C. (2011).** "Ludics with Repetitions (Exponentials, Interactive Types and Completeness)." *LMCS* 7(2). arXiv:1104.0504. Modern technical framework for behaviours with exponentials.
9. **Basaldella, M. (2014/2015).** "Ludics without Designs I: Triads." LINEARITY 2014, EPTCS; arXiv:1502.04773. Abstract $(P, N, \perp)$ framework; closest existing stepping-stone toward Reading C but does not commit to it.
10. **Fleury, M.-R. & Saurin, A. (2017).** "Inductive and Functional Types in Ludics." CSL 2017, LIPIcs vol. 82, paper 34. DOI 10.4230/LIPIcs.CSL.2017.34. Internal completeness for infinite unions; weak support for C1 join-structure and C5 directed-system idea.
11. **Lecomte, A. (2011).** *Meaning, Logic and Ludics.* Imperial College Press. Most comprehensive book-length Ludics-for-NL treatment.
12. **Terui, K. (2011).** "Computational Ludics." *Theoretical Computer Science* 412(20): 2048–2071. Finitary term-based reformulation.

### Bucket 2 — Ambler / categorical argumentation

13. **Ambler, S. J. (1996).** "A categorical approach to the semantics of argumentation." *Mathematical Structures in Computer Science* 6(2): 167–188. DOI 10.1017/S0960129500000931. **THE Ambler 1996 reference**: defines evidential closed category, hom = join-semilattice of arguments. Anchor for C3.
14. **Krause, P. J., Ambler, S. J., Elvang-Gøransson, M. & Fox, J. (1995).** "A logic of argumentation for reasoning under uncertainty." *Computational Intelligence* 11(1): 113–131. DOI 10.1111/j.1467-8640.1995.tb00025.x. Companion logical-syntax side.
15. **Faggian, C. & Hyland, M. (2002).** "Designs, Disputes and Strategies." CSL 2002, LNCS 2471: 442–457. Bridges Ludics designs and HO innocent strategies; canonical Ludics-category reference.
16. **Baelde, D., Doumane, A. & Saurin, A. (2016).** "Least and Greatest Fixed Points in Ludics." CSL 2016, hal-01256773. Proves $CP$ is a complete lattice under inclusion at the inter-behaviour level.
17. **Kennes, R. (1991/2013).** "Evidential Reasoning in a Categorial Perspective: Conjunction and Disjunction of Belief Functions." arXiv:1303.5725. Independent categorical treatment of Dempster–Shafer; complementary to Ambler.
18. **Endriss, U. & Grandi, U. (2017).** "Graph Aggregation." *Artificial Intelligence* 245: 86–114. arXiv:1609.03765. Composition-like operation on argumentation graphs; non-categorical.

### Bucket 3 — Structured argumentation

19. **Modgil, S. & Prakken, H. (2013).** "A general account of argumentation with preferences." *Artificial Intelligence* 195: 361–397 (corrigendum 2018). Canonical ASPIC+ reference. Anchor for C8.
20. **Modgil, S. & Prakken, H. (2014).** "The ASPIC+ framework for structured argumentation: a tutorial." *Argument & Computation* 5(1): 31–62.
21. **Chesñevar, C., McGinnis, J., Modgil, S., Rahwan, I., Reed, C., Simari, G., South, M., Vreeswijk, G. & Willmott, S. (2006).** "Towards an argument interchange format." *Knowledge Engineering Review* 21(4): 293–316. Canonical AIF descriptor. Anchor for C9.
22. **Reed, C., Wells, S., Devereux, J. & Rowe, G. (2008).** "AIF+: Dialogue in the Argument Interchange Format." COMMA 2008, FAIA 172, pp. 311–323. Introduces L-nodes and TA-nodes; utterance-anchored. Anchor for C9.
23. **Bex, F., Prakken, H. & Reed, C. (2010).** "A formal analysis of the AIF in terms of the ASPIC framework." COMMA 2010, FAIA 216: 99–110.
24. **Caminada, M. (2006).** "On the issue of reinstatement in argumentation." JELIA 2006. Foundational labelling paper; with **Baroni, P., Caminada, M. & Giacomin, M. (2011)**, "An introduction to argumentation semantics," *Knowledge Engineering Review* 26(4): 365–410.
25. **Toni, F. (2014).** "A tutorial on assumption-based argumentation." *Argument & Computation* 5(1): 89–117. ABA tutorial.
26. **Atkinson, K. et al. (2017).** "Toward Artificial Argumentation." *AI Magazine* 38(3): 25–36. Authoritative recent survey.
27. **Prakken, H. (2024).** "An abstract and structured account of dialectical argument strength." *Artificial Intelligence* 335: 104193. **Key unanticipated finding**: closest existing structural-objection-space construct.
28. **Baumann, R., Doutre, S., Mailly, J.-G. & Wallner, J. P. (2021).** "Enforcement in formal argumentation." *Journal of Applied Logics — IfCoLog* 8(6): 1623–1678. Comprehensive enforcement-dynamics survey.
29. **Cayrol, C., de Saint-Cyr, F. D. & Lagasquie-Schiex, M.-C. (2010).** "Change in abstract argumentation frameworks: adding an argument." *JAIR* 38: 49–84.

### Bucket 4 — Dialogue systems and commitment stores

30. **Hamblin, C. L. (1970).** *Fallacies.* Methuen, London. Original commitment-store formulation, per-participant stores.
31. **Walton, D. & Krabbe, E. C. W. (1995).** *Commitment in Dialogue: Basic Concepts of Interpersonal Reasoning.* SUNY Press. Dialogue typology, light/dark-side commitments.
32. **Walton, D. (2006).** "Examination Dialogue: An Argumentation Framework for Critically Questioning an Expert Opinion." *Studies in Communication Sciences*. Content-level examination sub-type.
33. **Singh, M. P. (1999).** "An Ontology for Commitments in Multiagent Systems." *Artificial Intelligence and Law* 7(1): 97–113. Four-place social-commitment relation.
34. **Singh, M. P. (2000).** "A Social Semantics for Agent Communication Languages." IJCAI-99 ACL Workshop, LNAI 1916: 31–45. Speech-act → social-commitment mapping; closest published analog to C11/C12 but in opposite direction.
35. **McBurney, P. & Parsons, S. (2002).** "Games That Agents Play: A Formal Framework for Dialogues Between Autonomous Agents." *Journal of Logic, Language and Information* 11(3): 315–334.
36. **McBurney, P. & Parsons, S. (2005).** "A Mathematical Model of Dialog." *ENTCS*. Category-theoretic maps between utterance objects and commitment objects — closest published precedent for two-layer maps.
37. **Wells, S. & Reed, C. A. (2012).** "A Domain Specific Language for Describing Diverse Systems of Dialogue." *Journal of Applied Logic* 10(4): 309–329.
38. **Brandom, R. (1994).** *Making It Explicit.* Harvard University Press. Deontic scorekeeping; attribution baked in.
39. **Lawrence, J. & Reed, C. (2019).** "Argument Mining: A Survey." *Computational Linguistics* 45(4): 765–818. Staged extraction pipeline; offline analog to C13.

### Bucket 5 — Deliberative democracy and platforms

40. **Habermas, J. (1996).** *Between Facts and Norms.* MIT Press. Contains "anonymous popular sovereignty" passage (p. 486) — stronger T4 analog than substrate currently uses.
41. **Cohen, J. (1989).** "Deliberation and Democratic Legitimacy." In Hamlin & Pettit eds., *The Good Polity*; reprinted Bohman & Rehg 1997. **Substrate's gloss needs correction** — Cohen's criterion is about reasons-all-could-accept, not authorship anonymity.
42. **Mansbridge, J. (1999).** "Everyday Talk in the Deliberative System." In Macedo ed., *Deliberative Politics*, OUP: 211–239.
43. **Mansbridge, J. et al. (2012).** "A Systemic Approach to Deliberative Democracy." In Parkinson & Mansbridge eds., *Deliberative Systems*, CUP: 1–26. Strongest pre-existing structural-architecture analog.
44. **Estlund, D. (2008).** *Democratic Authority.* Princeton UP.
45. **Fishkin, J. S. (2009).** *When the People Speak.* OUP. With **Fishkin, J. & Luskin, R. (2005).** *Acta Politica* 40(3): 284–298. Strongest applied analog via aggregate-only reporting.
46. **Landemore, H. (2020).** *Open Democracy.* Princeton UP. Transparency pulls against T4 anonymity.
47. **Small, C. et al. (2021).** "Polis: Scaling Deliberation by Mapping High Dimensional Opinion Spaces." *Recerca* 26(2). DOI 10.6035/recerca.5516. Primary Pol.is architecture paper.
48. **Small, C. et al. (2023).** "Opportunities and Risks of LLMs for Scalable Deliberation with Polis." arXiv:2306.11932.
49. **Fishkin, J. et al. (2019).** "Deliberative Democracy with the Online Deliberation Platform." HCOMP 2019. With **Gelauff, L. et al. (2024).** "Scaling Dialogue for Democracy," *Perspectives on Politics*.
50. **Friess, D. & Eilders, C. (2015).** "A Systematic Review of Online Deliberation Research." *Policy & Internet* 7(3): 319–339. DOI 10.1002/poi3.95. Confirms anonymity-as-parameter framing.
51. **Primary platform documentation:** docs.decidim.org; consuldemocracy.org and github.com/consuldemocracy; help.loomio.com; kialo-edu.com.

### Bucket 6 — LLM/MCP agents over argumentation

52. **warrant-mcp** (jayden-chmod, 2025–2026). MCP server: Dung, Toulmin, Walton schemes, Pollock defeaters, Prakken dialogue with `retract`, ASPIC+ diagnosis. Glama listing. The only deployed MCP-over-argumentation found; confirms C16 by stopping at Dung/ASPIC+.
53. **Model Context Protocol Specification** (Anthropic, 2024–2025). modelcontextprotocol.io.
54. **Lawrence, J., Bex, F., Reed, C. & Snaith, M. (2012).** "AIFdb: Infrastructure for the Argument Web." COMMA 2012. With **Bex, F. et al. (2013).** "Implementing the Argument Web." *Communications of the ACM* 56(10).
55. **Argdown documentation and @argdown/cli** (Voigt, Betz, 2018–2024). argdown.org; github.com/christianvoigt/argdown.
56. **Mirzakhmedova, N. et al. (2024).** "Are Large Language Models Reliable Argument Quality Annotators?" arXiv:2404.09696.
57. **Wachsmuth, H. et al. (2024).** "Argument Quality Assessment in the Age of Instruction-Following LLMs." arXiv:2403.16084.
58. **Zheng, L. et al. (2023).** "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." NeurIPS 2023; survey arXiv:2411.15594.
59. **Pietroń, M. et al. (2026).** "Comprehensive study of LLM-based argument classification." arXiv:2603.19253. With argument-mining LLM survey arXiv:2506.16383.
60. **Baumann, R., Gabbay, D. & Rodrigues, O. (2020).** "Forgetting an argument." AAAI 2020. With "Dynamic collective argumentation: revision and contraction operators," *International Journal of Approximate Reasoning* (2024).

---

## §9. Concrete revisions to the substrate docs

The literature review surfaces twelve specific, actionable revisions:

**On C3 (load-bearing identification).** Update `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md §2 (articulation lattice)` to (i) state C3 explicitly as a structural identification proposed by the present work, citing Ambler 1996 and Girard 2001 + Fouqueré–Quatrini 2013 as anchor sources for the two independent halves and acknowledging no prior author makes the bridge; (ii) replace "join-semilattice under union of articulations" with "poset under inclusion with binary upper bounds via $\perp\perp$-closure" or equivalent careful formulation; (iii) note that Ambler's $\vee$ carries confidence-weighted aggregation and the identification is modulo a confidence-erasure functor.

**On "ECC" terminology.** Update `LUDICS_GENERATIVE_SUBSTRATE.md` and all substrate docs to **drop "ECC" framing** or explicitly disambiguate: Ambler 1996 is a semilattice-enriched cartesian closed category, not Luo's Extended Calculus of Constructions. Suggested replacement: "Ambler-style evidential closed category" or "semilattice-enriched CCC."

**On Cohen 1989 paraphrase.** Update `LUDICS_GENERATIVE_SUBSTRATE.md` and any T4 motivational section: **remove "Cohen's legitimacy without identifiable authorship"** as a closest analog. Replace with Habermas's "anonymous popular sovereignty" passage (BFN 1996 p. 486) and/or Fishkin's aggregate-only Deliberative-Polling reporting discipline. The Cohen gloss does not survive textual scrutiny.

**On Reading C grounding.** Update C7 discussion to cite **Basaldella's "Triads" (arXiv:1502.04773)** as the closest existing stepping-stone: it abstracts to $(P, N, \perp)$ without committing to which side is the player-role, and is the natural reference point for positioning Reading C against existing work.

**On "saturation" terminology.** Add explicit disambiguation note in `LUDICS_GENERATIVE_SUBSTRATE.md` and `LUDICS_OPEN_COMPOSITION_JOINT.md`: the substrate's "protocol saturation" is distinct from Fouqueré–Quatrini's (LMCS 2018) "saturation properties on visitable paths." Avoid terminological collision in publication.

**On C8 framing relative to Prakken 2024.** Update `LUDICS_GENERATIVE_SUBSTRATE.md §exposure-map` to **explicitly position the exposure map against Prakken (2024, AI 335:104193) "dialectical argument strength via expansions"** as the closest existing structural-objection-space construct. The walked/witnessable/latent stratification is genuinely the novel piece; the bare "structural objections exist independent of utterance" piece has partial precedent in Prakken-2024 and in incomplete-AF completions (Baumeister et al. 2021).

**On C12 framing relative to Singh.** Update `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md §invariants` to note that Singh's social-commitment semantics (1999, 2000) is the closest published analog but **points in the opposite direction**: act → state (attributed → attributed-new-state), versus the substrate's witness → locus (attributed → pre-existing-anonymous).

**On C13 framing relative to argument mining.** Update `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md §NCM-pipeline` to acknowledge that **argument-mining pipelines (Lawrence & Reed 2019; DialAM-2024) instantiate structurally similar staged refinement but offline on transcripts**, not as an upstream live gate on commitment binding. The novel contribution is the placement, not the staging.

**On C14 closest-analog list.** Update the T4 motivation in `LUDICS_GENERATIVE_SUBSTRATE.md` to use the honest analog set: **Habermas's anonymous-popular-sovereignty passage** + **Mansbridge et al. 2012 systemic decomposition** + **Fishkin's reporting discipline**. Drop the Cohen gloss.

**On C15 closest-analog inclusion.** Update the deployed-platforms motivation to **include Kialo Edu Anonymous Discussions** alongside Pol.is. Kialo Edu's structural argument tree + peer-pseudonymous attribution + admin-visible real names is the closest deployed system in spirit to T4 (without the records-only $\iota$).

**On C19 framing relative to Prakken retract.** Update `LUDICS_OPEN_COMPOSITION_JOINT.md §fossil-record` to note that **Prakken-style `retract` (deployed in warrant-mcp's `dialogue_move`)** is the closest existing analog: it preserves the speech act in the transcript while removing the commitment from the active store. The novel piece is the back-pointer to the specific locus and the explicit "no longer applies to current $D_P$" flag.

**On Pol.is "opinion landscape" disanalogy.** When positioning T4 against Pol.is, flag the **derived-vs-authored distinction**: Pol.is's opinion landscape is computed from individual votes (aggregate-derived), whereas T4's dialectical layer is populated by anonymized claim-content (authored). This is a meaningful disanalogy that should be made explicit.

---

## §10. Open research questions surfaced

**Q1. The Basaldella-Triads to Reading-C path.** Basaldella's "Ludics without Designs I: Triads" (arXiv:1502.04773) abstracts Ludics to $(P, N, \perp)$ without committing to player-roles for $P$ and $N$. Can Reading C be formalized as a Triads-style structure where $N$ is promoted to the Opponent role and participants instantiate moves on the $P$ side? This is a concrete technical question with a plausible affirmative answer that would situate Reading C inside an existing Ludics technical framework, strengthening C7's positive content rather than only its negative claim.

**Q2. Prakken-2024 expansions as exposure-map skeleton.** Prakken's 2024 *AI* paper computes dialectical argument strength as a count over successful attacks in expansions of an AF. Can the walked/witnessable/latent stratification be added as a participant-access modality on Prakken's expansion family, yielding a structured-argumentation version of the exposure map without going through Ludics? If yes, this provides a natural ASPIC+/AIF interface for the substrate's exposure-map concept and a translation layer between the dialectical-layer reads and the existing structured-argumentation literature.

**Q3. Singh-style commitment patterns at four grain sizes.** Singh's create/cancel/release/discharge/assign/delegate operations are uniform over commitments at one grain size. C18 claims the substrate's "one operation, four call sites" pattern (commitment / warrant / dialogue-move / UX-promotion) has no established name. Open question: does there exist a categorical or type-theoretic generalization of Singh's commitment operations that uniformly handles four grain sizes? If so, this would name the pattern and provide a literature anchor; if not, it is genuinely original.

**Q4. Mansbridge et al. 2012 as ancestor architecture.** The 2012 "Systemic Approach to Deliberative Democracy" decomposes deliberation into components with different functions (epistemic / ethical / democratic) joined into a system-level evaluation. T4 can be re-pitched as a particular *operationalization* of the systemic approach where one component (the dialectical layer) is structurally anonymized. Open question: does formulating T4 as a systemic-deliberation instantiation provide additional normative leverage (legitimacy arguments) over presenting T4 as architecturally novel?

**Q5. Bi-orthogonal closure as join in articulation lattices.** The literature review surfaces that designs in a behaviour are not literally closed under union; the natural join is $D_1 \vee D_2 := (D_1 \cup D_2)^{\perp\perp}$. Open question: is this join idempotent and associative in the substrate's intended use? Does it preserve incarnation as bottom? Does it interact well with delocation? These are concrete technical questions whose answers determine whether $\text{Art}(B)$ can carry the algebraic structure the substrate needs.

**Q6. Fidelity-scorecard as continual structural regression test.** The argument-mining F1-against-gold regime is structural in a narrow static sense. The substrate's fidelity-scorecard is structural in a *continually-recomputed-manifest* sense. Open question: what is the right structural-similarity metric between an LLM agent's briefing and the current structural manifest? Span-F1 against extracted-claim-locus pairs? Exposure-map coverage? Drift detection on the articulation lattice? This is a measurable evaluation-protocol question that the substrate is uniquely positioned to define.

**Q7. The warrant-mcp design space as benchmark.** warrant-mcp provides a 10-tool surface over Dung/ASPIC+/Prakken. Open question: what is the minimal Ludics-MCP tool surface that exposes loci, exposure-map slices, articulation-lattice queries, and witnessing records? Specifying this concretely (as an analog to warrant-mcp's schema) would make C16 falsifiable in a stronger way and provide a deployment target.

**Q8. AIF interoperability — export from Isonomia, not extension of AIFdb.** *(Revised after side-by-side inspection of aifdb.org versus Isonomia's deployed search surface and MCP write-tools, 2026-05-17.)* The original framing of this question — "can the substrate's dialectical-layer queries be implemented as conservative extensions of the AIFdb query surface?" — inverts the actual capability gradient. AIFdb's deployed surface is a full-text search over I-node content with force-directed AIF graph drill-down, returning flat unranked propositions with raw RA/CA topology. Isonomia's deployed `/api/v3/search/arguments` already subsumes that surface and adds hybrid retrieval (RRF over dense + sparse), four quality filters (tested-only, min CQ coverage, min evidence, date range), stance decomposition (for/against in one call), counter-citation discovery with honest-null empty states, MCP parity with consumer/claim pages, and a write-tool surface (`propose_structured_argument`) that produces typed-scheme ASPIC+ arguments with evidence provenance, content-addressed permalinks, multi-format citation blocks, and embed snippets — none of which AIFdb has primitives for. **The actionable integration question is therefore export, not extension**: is AIF-export from Isonomia worth building for Argument Web interoperability (AIFdb, OVA, Arvina)? AIF as least-common-denominator interchange would let Isonomia arguments appear in the Argument Web ecosystem (I-nodes for premises/conclusion, RA-nodes for scheme application, CA-nodes for counter-arguments) without requiring AIFdb to understand the richer Isonomia substrate. The import direction is much harder to justify: AIFdb's content is mostly annotated debate transcripts and editorials without evidence provenance, scheme typing, or quality signals; importing would produce a large volume of low-fitness, untested arguments that would need the full NCM pipeline to be useful. Dialectical-layer reads (exposure map, articulation lattice, witnessing record, joint saturation) are *not* expressible in AIF and the question of integrating them with AIFdb does not arise.
    -- response provided below
---

## Appendix A — Claims verdict table

| Claim | One-line restatement | Verdict | Primary source(s) | Secondary source(s) | Notes |
|---|---|---|---|---|---|
| **C1** | $(B, \leq)$ is a join-semilattice under union of articulations | Partially confirmed | Girard 2001; Fouqueré & Quatrini 2013 | Baelde–Doumane–Saurin 2016; Fleury–Saurin 2017 | Inclusion order = confirmed. Union closure requires $\perp\perp$; restate as poset with binary $\perp\perp$-closed upper bounds. |
| **C2** | Minimal elements of $(B, \leq)$ = Girard's incarnations | Confirmed | Girard 2001; Fouqueré & Quatrini 2013 | Basaldella–Faggian 2011; Curien 2005 | Direct definitional match in primary source. |
| **C3** | $\text{Art}(B) \cong$ Ambler hom-set as join-semilattice (load-bearing) | Single-source structural identification (original to track) | Ambler 1996; Girard 2001 + Fouqueré–Quatrini 2013 | Krause et al. 1995; Faggian–Hyland 2002 | Bridge itself unattested. Two halves separately well-attested. Confidence-weighting and bi-orthogonal-closure caveats. |
| **C4** | $\sigma(D)^\perp$ stratifies into walked/reachable-in-k/latent | Original to track | (Active-search null) | Fouqueré–Quatrini 2018 (different "saturation"); Terui 2011 | No published Ludics work stratifies orthogonal by participant-access modality. |
| **C5** | Behaviours form directed system $\{B_t\}$ with partial transitions | Open/inconclusive | Fleury–Saurin 2017 (weakly) | Lecomte–Quatrini 2011 (informally) | Consistent with framework but not formalized in literature. |
| **C6** | Delocation extends $D$ to a new locus, recomputes membership | Confirmed | Girard 2001; Fouqueré–Quatrini 2012 | Fleury–Saurin 2017 | Standard delocation = single-design same-shape; locus-addition stronger variant not explicitly analyzed. |
| **C7** | No multi-agent Ludics commits to Reading C (load-bearing) | Confirmed | Lecomte–Quatrini 2011; Fleury–Quatrini–Tronçon 2011; Fleury–Tronçon 2011 | Fouqueré–Quatrini 2012; Bougsty-Marshall 2020; Basaldella 2015 | ≥6 independent sources, all bilateral. Basaldella Triads = closest stepping-stone but does not commit. |
| **C8** | ASPIC+ has no exposure-map analog | Confirmed with caveat | Modgil & Prakken 2013, 2014; Baroni–Caminada–Giacomin 2011 | Prakken 2024 (partial precedent) | Walked/witnessable/latent stratification absent. Prakken 2024 expansion-based dialectical strength is closest construct; substrate should position relative to it. |
| **C9** | AIF dialogue layer is utterance-centric and attribution-default | Confirmed | Chesñevar et al. 2006; Reed et al. 2008 (AIF+); Modgil–McGinnis 2008 | Bex–Prakken–Reed 2010; Snaith–Reed 2016 | L-nodes are subclass of I-nodes (locutions = propositions about speech events). |
| **C10** | Categorical composition lifts to articulation-lattice composition, unwritten for deliberation | Confirmed (null finding) | (No prior art) | Ambler 1996 (mechanism); Endriss–Grandi 2017; Caminada–Pigozzi 2011 (closest at labelling-level) | Mechanism categorically available; deliberation-setting writeup is genuine gap. |
| **C11** | Hamblin attribution-default; dual-layer not standard (load-bearing) | Confirmed | Hamblin 1970; Walton & Krabbe 1995; Walton 2010 | McBurney–Parsons 2002; Brandom 1994 | ≥6 confirmations on attribution. Singh closest but opposite direction. |
| **C12** | Walton/Singh/McBurney–Parsons have no pre-existing-move vs. utterance separation; I1–I4 novel | Confirmed | Walton & Krabbe 1995; Singh 1999, 2000; McBurney–Parsons 2002 | Brandom 1994 | Singh act-vs-state separation is closest but mathematically dual to substrate split. |
| **C13** | No graded canonicalization pipeline upstream of commitment binding | Confirmed | Walton & Krabbe 1995; Walton 2006; McBurney–Parsons 2002 | Lawrence–Reed 2019 (offline analog); Purver 2004 (clarification, not pipeline) | Argument mining = structurally similar but offline on transcripts. |
| **C14** | No deliberative-democracy theorist proposes T4-style separation (load-bearing) | Confirmed with substantive correction | Cohen 1989 (corrected reading); Habermas 1996; Mansbridge et al. 2012 | Fishkin 2009; Estlund 2008; Landemore 2020 | Cohen gloss in substrate inaccurate; replace with Habermas BFN p. 486 + Fishkin reporting discipline. |
| **C15** | No deployed platform maintains T4 separation | Confirmed | Small et al. 2021 (Pol.is); Decidim docs; Loomio docs; Kialo Edu docs | Fishkin et al. 2019; Friess–Eilders 2015 | Pol.is + Kialo Edu Anonymous Discussions = closest analogs; neither implements records-only $\iota$. |
| **C16** | No MCP / tool-use surface exposes Ludics-native reads (load-bearing) | Confirmed | warrant-mcp (Glama 2025–2026); Lawrence et al. 2012 (AIFdb) | Argdown docs; ARG-tech Bex et al. 2013 | warrant-mcp = only deployed MCP-over-argumentation; covers Dung/ASPIC+/Prakken, zero Ludics. |
| **C17** | Fidelity-scorecard discipline not standard | Confirmed | Mirzakhmedova et al. 2024; Wachsmuth et al. 2024; Zheng et al. 2023 | Pietroń et al. 2026; argument-mining LLM survey 2025 | F1-against-gold is static structural; continually-recomputed-manifest discipline is novel. |
| **C18** | "One operation, four call sites" has no established name | Confirmed | Singh 1999; Chopra–Singh commitment protocols | McBurney–Parsons 2005 (ENTCS, closest precedent) | No literature term identified. |
| **C19** | Fossil-record discipline has no standard analog | Confirmed with near-miss | Prakken retract via warrant-mcp; Cayrol et al. 2010; Baumann–Gabbay–Rodrigues 2020 "Forgetting an argument" | Ojewale et al. 2026 (LLM audit trails, non-argumentation) | Prakken `retract` preserves transcript but no locus back-pointer; dynamics literature is forward-only (produces new AF). |
| **C20** | Joint saturation as forward closure over participation is novel in multi-agent Ludics | Original to track | (Active-search null) | Lecomte–Quatrini 2011; Fleury–Quatrini–Tronçon 2011 (Reading-A merges) | Reading C dissolves the historical Reading-A merge approach. |


----------
The three findings I'd flag as most immediately actionable for the next conceptual session are the ECC terminology fix (quick, high-impact on credibility), the Cohen-to-Habermas swap on T4's closest analog (substantive and affects how you pitch the architecture to deliberative-democracy audiences), and positioning the exposure map against Prakken 2024 rather than vanilla ASPIC+ labelling (sharpens what's actually novel). The rest of §9 can queue behind those.

--------
the AIFDB question:
prompt:"as for the question regarding the aifdb -- I just checked out aifdb.org and found it interesting -- I'll attach some screenshots of that site as well as both the public argument search demo for isonomia and a recent test I ran with the isonomia mcp write tools"

response: "This is a useful side-by-side. The contrast sharpens the Q8 question from the literature review — and honestly shifts my assessment of whether AIFdb integration is worth pursuing.

What stands out from the screenshots: AIFdb is fundamentally a **corpus browser over AIF graphs**. The search is full-text over I-node content, returning flat proposition strings with a "Show Argument Maps" drill-down. The maps are raw AIF topology — I-nodes (blue boxes) connected by RA-nodes (green) and CA-nodes (red), laid out by force-directed graph. There's no quality signal, no standing classification, no scheme identification on the search surface, no evidence layer, no attestation, no counter-citation. The "economy" query returns 1,557 results with no ranking beyond page order. The argument maps are structurally faithful to AIF but opaque to anyone who doesn't already know what RA/CA means.

Your search surface is doing something categorically different. The arg-search spec shows six shipped phases all backed by one canonical endpoint (`/api/v3/search/arguments`), with hybrid retrieval (RRF over dense + sparse), four quality filters (tested-only, min CQ coverage, min evidence, date range), stance retrieval (for/against in a single call), counter-citation discovery with honest-null, and MCP parity — the same endpoint serving the consumer page, the claim page, and the MCP tools. The search results carry standing badges, scheme chips, fitness scores, hybrid-mode chips, attestation links, and inline strongest-counter enrichment. The honest-empties discipline (four distinct empty states surfaced separately, never collapsed) is a design decision AIFdb doesn't even have the vocabulary for.

The MCP write-tool demo is the other side of the gap. The caffeine argument posted via Claude → Isonomia MCP shows a full ASPIC+ structured argument with typed scheme ("Argument from Negative Consequences"), five premises each backed by evidence with provenance URLs, a content-addressed permalink with sha256 hash, multi-format citation block, and embed snippet. AIFdb has an Upload function but no write-tool surface, no scheme typing at ingest, no evidence layer, no attestation envelope.

This changes how I'd frame Q8 from the literature review. The original question was whether Isonomia's dialectical-layer queries could be implemented as "conservative extensions of the AIFdb query surface." Looking at what AIFdb actually exposes versus what you've built, that framing is backwards. AIFdb's query surface is a strict subset of yours — flat text search over I-node content with graph drill-down. Your surface already subsumes it and adds quality filtering, hybrid retrieval, stance decomposition, counter-citation, and MCP parity. The integration question isn't "can we extend AIFdb to support Isonomia queries" — it's whether there's any value in **importing AIFdb corpora** into Isonomia's richer substrate, or in **exporting** Isonomia arguments as AIF for interoperability with the Argument Web ecosystem (AIFdb, OVA, Arvina).

The export direction seems more defensible: AIF is a least-common-denominator interchange format, and being able to serialize an Isonomia argument as an AIF graph (I-nodes for premises/conclusion, RA-nodes for the scheme application, CA-nodes for counter-arguments) would let your arguments show up in the Argument Web without requiring AIFdb to understand your richer structure. The import direction is harder to justify — AIFdb's content is mostly annotated debate transcripts and newspaper editorials without evidence provenance, scheme typing, or quality signals, so importing it would produce a lot of low-fitness, untested arguments that would need the full NCM pipeline to be useful.

I'd revise §10 Q8 accordingly: the actionable question is whether AIF-export from Isonomia is worth building for Argument Web interoperability, not whether AIFdb's query surface is an integration target."
