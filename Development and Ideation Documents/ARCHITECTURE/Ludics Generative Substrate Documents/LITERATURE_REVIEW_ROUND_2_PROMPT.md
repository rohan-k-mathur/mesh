# Literature Review Prompt — Round 2 (Revised Docs + Session 0f Claims)

**Purpose:** Self-contained research brief for an Opus-4.6-class deep-research agent. This is the second pass of the Ludics Generative Substrate literature review. Round 1 (`LITERATURE_REVIEW_ROUND_1.md`) established a baseline verdict table for 20 claims. Round 2 has three jobs:

1. **Re-verify five non-confirmed Round 1 claims** under the corrected document framing (Tier-1/Tier-2 revisions + Session 0f) — check whether the corrections close the identified gaps or whether the caveats stand.
2. **Verify five new claims** arising from Session 0f (Triads bridge, ⊥⊥-closure join, Confidence-Erasure-Functor) and from the cross-track alignment with the AI extensions roadmap (briefing-fingerprint optimistic concurrency, explicit-exclusion-list governance).
3. **Close five residual open questions** from Round 1 §10 (Q2, Q3, Q4, Q6, Q7 — Q1, Q5, Q8 were addressed internally after Round 1 completed).

**How to use:** Paste this entire document as the system/initial prompt to a fresh research-agent instance with web/search access. The Round 1 verdict summary is in §1; the full Appendix A table is in the attached LITERATURE_REVIEW_ROUND_1.md. The agent should treat §1 as context, §2 as the re-verification checklist, §3 as the new claims checklist, §4 as the residual-questions checklist, §5 as the bucket structure, §6 as scope discipline, §7 as source-quality rules, and §8 as the required output format.

---

## 1. Round 1 baseline and what changed

### Round 1 verdict summary

Of the original 20 claims, Round 1 found:
- **Confirmed (≥2 independent sources):** C2, C6, C7, C9, C11, C12, C13, C16, C17, C18
- **Confirmed with caveats:** C8, C19
- **Partially confirmed with substantive caveats:** C1, C14, C15, C17 *(note: C17 appeared in both lists; net status: confirmed)*
- **Original to track (active-search null result):** C4, C10, C20
- **Single-source structural identification (original to track):** C3
- **Open / inconclusive:** C5

No claim was outright contradicted. Three findings required substantive revisions to the substrate docs:

- **ECC terminology.** "ECC" as used in the substrate docs referred to Ambler 1996's *semilattice-enriched cartesian closed category* (in the Kelly/Lawvere/Pitts lineage), *not* Luo's Extended Calculus of Constructions. The docs have been corrected: all prose instances of "ECC" with that meaning are replaced with "Ambler's semilattice-enriched CCC"; the deployed `ecc_*` MCP tool names are retained as engineering identifiers (separate decision).
- **Cohen-1989 framing.** The substrate's gloss "legitimacy without identifiable authorship" overreached Cohen; his legitimacy criterion is content-side ("reasons all reasonable participants could accept"), not attribution-architectural. The T4 witnessing-layer description now cites Habermas *Between Facts and Norms* (1996, p. 486), Fishkin's aggregate-only Deliberative-Polling reporting discipline (*When the People Speak*, 2009), and Mansbridge et al. 2012 "Systemic Approach" instead. Cohen is explicitly noted as not a layer-architectural argument.
- **Exposure map vs. Prakken 2024.** C8 noted that Prakken (2024, *AI* 335:104193) provides a partial precedent via expansion-based dialectical strength. The substrate's exposure-map section (`LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md` §2.1) now includes a positioning paragraph framing the exposure map as a generalization of Prakken's expansion family, with the participant-access stratification and Ludics-internal generator as the novel axes.

### What changed after Round 1

**Session 0f** (documented in `LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md`) addressed two Round 1 open questions and produced three new checkable claims:

- *Q1 (Triads → Reading C):* Reading C is now formalized as a Basaldella-Triads instance $(P, N, \perp)$ with structural player-role assignment ($P$ = the Proponent design $D_P$; $N$ = the anonymous-behaviour Opponent $\sigma(D_P)^\perp$) plus an external $\mathsf{Witness}$ relation. T3′ and T4 translate cleanly into Triads vocabulary. The substrate commits to this as the positive technical home for Reading C; it is the specific role-and-witness instantiation no published Triads work has committed to.
- *Q5 (⊥⊥-closure join):* The corrected join $D_1 \vee D_2 := (D_1 \cup D_2)^{\perp\perp}$ is now the official definition of the join in $\mathsf{Art}(B)$, restricted to $\mathsf{Inc}(B)$ (or quotient by $\sim_{\perp\perp}$) to recover idempotence. Associativity, bottom-as-incarnation, and delocation-compatibility hold by the general theory.
- *Q8 (AIFdb):* Reframed as an export question (Isonomia → AIF for Argument Web interop), not an import or extension question. Settled internally; not a literature-review item.

**Cross-track alignment** (the new "Relation to the Ludics Generative Substrate Conceptual Track" section appended to `docs/isonomia-ai-roadmap.md`) identified two product design decisions that are novel enough to warrant a literature check: the briefing-fingerprint optimistic concurrency mechanism (Phase 3) and the "what is deliberately not computed" explicit exclusion list as a governance artifact (Phase 5).

---

## 2. Re-verification claims (R-prefix: re-check under corrected framing)

These are Round 1 claims whose verdict was non-confirmed or whose framing was corrected. For each, state: **verdict stands**, **verdict upgrades to confirmed**, **verdict downgrades**, or **verdict changes** — with sources.

**R-C1.** *(Partially confirmed in Round 1; framing now corrected.)* The original claim stated Art$(B)$ carries a join-semilattice structure under "union of articulations." Round 1 found that raw union closure fails; the correct join is $D_1 \vee D_2 := (D_1 \cup D_2)^{\perp\perp}$ restricted to $\mathsf{Inc}(B)$. The substrate now states Art$(B) = (\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$. Question: does this corrected formulation — poset of incarnations with $\perp\perp$-closed binary upper bounds — now match any published characterization of a structure on designs within a behaviour? Specifically: does Baelde–Doumane–Saurin (CSL 2016) or Fleury–Saurin (CSL 2017) treat the internal structure of a single behaviour in a way that maps to this? Check also any 2022–2025 Ludics papers.

**R-C3.** *(Single-source structural identification in Round 1; Session 0f tightened the framing.)* The claim is now explicitly: "This is a *proposed structural identification* — each design in $B$ is a derivation, the $\perp\perp$-closure join corresponds to Ambler's $\vee$, minimal incarnations correspond to selected arrows in Ambler's sense — presented with explicit single-source basis (Ambler 1996 and Girard 2001 / Fouqueré–Quatrini 2013 for the two halves; the bridge unattested)." Question: has any 2022–2025 paper in categorical logic, proof-net theory, or categorical argumentation explicitly connected Ambler-style enriched-CCC derivation hom-sets to bi-orthogonally-closed design sets? Check the Basaldella–Faggian lineage (2011–2025) and any recent work combining game semantics with enriched categories.

**R-C5.** *(Open / inconclusive in Round 1.)* The claim: behaviours form a directed system $\{B_t\}$ over time with partial transition maps, consistent with Girard's framework rather than a deviation. Round 1 found only weak support (Fleury–Saurin 2017 informally; Lecomte–Quatrini 2011 informally). Question: has any paper since 2017 treated *dynamic* or *evolving* behaviours — where the behaviour itself changes over a sequence of moves — in a way that provides either support or a clean contradiction? Check in particular: dynamic argumentation literature (Cayrol–Lagasquie-Schiex, Baumann, Dondio) for any Ludics-adjacent treatment of evolving objection spaces.

**R-C8.** *(Confirmed with caveat in Round 1; Tier-2 Prakken-2024 positioning added.)* The caveat was that Prakken (2024, *AI* 335) provides a partial precedent via expansion-based dialectical strength. The substrate now explicitly positions the exposure map as a generalization of Prakken's expansion family. Question: does the new positioning paragraph accurately characterize the relationship? Specifically: does Prakken 2024 define anything like a *participant-access* stratification on the expansion family (distinguishing moves already made from moves reachable but not yet made), or is the participant-access modality wholly absent from that paper? Check whether Prakken 2024's supplementary material or any 2025 follow-on addresses multi-participant access.

**R-C14.** *(Confirmed with caveat; Cohen gloss corrected, Habermas/Fishkin/Mansbridge substituted.)* Question: does the corrected framing — Habermas BFN p. 486 ("subjectless popular sovereignty flowing through procedure"), Fishkin aggregate-only reporting discipline, Mansbridge et al. 2012 systemic-approach component decomposition — accurately characterize those sources as the closest layer-architectural analogs to T4, or are there more recent deliberative-democracy papers (2020–2025) that come closer to a formal two-layer separation? Check Landemore (2020, *Open Democracy*), Niemeyer & Dryzek (2024 or recent), and any CSCW 2022–2025 papers on separation between structural deliberation artifacts and participant attribution.

---

## 3. New claims (N-prefix: first-time verification)

**N-C21.** *(From Session 0f.)* No published paper in the Basaldella–Triads lineage (arXiv:1502.04773, any sequel, any citing paper) commits to the specific Reading C instantiation: $P$ = the Proponent design, $N$ = the anonymous Opponent behaviour $\sigma(D_P)^\perp$, with an external $\mathsf{Witness}$ relation recording which moves in $N$ have been instantiated by participants. The substrate proposes this as an original application of the Triads framework. Check: (a) all Basaldella papers 2015–2025; (b) any Triads-citing paper in the Ludics dialogue/NLP lineage; (c) whether any paper in the game-semantics dialogue tradition (Abramsky, Japaridze) introduces a "witness" relation at the role-assignment level.

**N-C22.** *(From Session 0f — Confidence-Erasure-Functor.)* Session 0f identifies a conceptual need: a functor from Ambler's semilattice-enriched CCC (where hom-sets carry confidence weights or semilattice structure encoding the *strength* of a derivation) to the Ludics-incarnation side (where the articulation lattice carries only structural inclusion, with confidence erased). This would be a forgetful functor that preserves the compositional CCC structure while discarding the semilattice enrichment. Question: does any paper in the enriched-category-theory / proof-net literature treat forgetful functors from enriched to plain categories in a way that preserves compositional structure for argumentation or game-semantics purposes? Check: Lawvere 1973 (original enriched categories), Kelly 1982 (standard reference), any recent categorical argumentation paper that involves projection from enriched to plain structure.

**N-C23.** *(From Session 0f — ⊥⊥-closure join in subsequent Ludics literature.)* The corrected articulation-lattice join $D_1 \vee D_2 := (D_1 \cup D_2)^{\perp\perp}$ (with idempotence via restriction to $\mathsf{Inc}(B)$) is not attributed to any prior source in Round 1. Question: does any Ludics paper from 2015–2025 explicitly define or use a $\perp\perp$-closure-based join on designs within a fixed behaviour? Check in particular: Faggian–Della Rocchetta 2020–2025 (recent Ludics/linear logic), Basaldella 2015–2025, any LICS or ICALP paper on proof-nets and orthogonality that addresses internal lattice structure.

**N-C24.** *(From cross-track alignment — Phase 3 briefing fingerprint.)* The briefing fingerprint is a content hash over (targeted-region nodes, their statuses, direct neighbors in the attack/support graph, open-CQ set for the scheme instance) used for optimistic concurrency in a deliberation graph: the server recomputes the fingerprint at post time; equality → fast-path post; inequality → diff-and-classify. This is a non-standard use of optimistic concurrency because the state being hashed is a *partial* region of a graph (not the full resource) and the "conflict" classification requires domain-specific rules (the five "material change" rules). Question: does any paper in distributed systems, CRDT theory, or collaborative editing apply content-hashing to *partial graph regions* for optimistic concurrency with domain-specific conflict classification? Check in particular: the argumentation-framework update and change-detection literature (Bisquert et al., Cocarascu et al.) and recent CSCW / wiki-collaboration papers on partial-document locking.

**N-C25.** *(From cross-track alignment — Phase 5 explicit exclusion governance.)* The Phase 5 diagnostic design includes an explicit "what is deliberately not computed" list (per-participant scoring, participation-quality scores, reading tracking, sentiment analysis, predictive churn) with the stated governance property: additions to the list in future are recognized as principle-level decisions requiring explicit justification, not feature additions. Question: does any deliberative-platform design paper, HCI paper, or AI governance paper treat *explicit non-computation lists* as a first-class governance artifact in this way? Check in particular: participatory design literature on refusal (Suchman 2002 and descendants), FAccT 2022–2025 papers on what not to compute in deliberation/recommendation systems, and the "meaningful human control" / "explainability refusal" literature.

---

## 4. Residual open questions from Round 1 §10

These were surfaced by Round 1 but not addressed internally (unlike Q1, Q5, Q8 which were closed by Session 0f and the Tier-2 revision). For each, state whether you found a relevant source or whether the question remains open.

**Q2. Prakken-2024 expansions as exposure-map skeleton.** Can the walked/witnessable/latent stratification be added as a participant-access modality on Prakken's (2024) expansion family, yielding a structured-argumentation version of the exposure map without going through Ludics? If yes, this provides a natural ASPIC+/AIF interface for the substrate's exposure-map concept and a translation layer. Specifically: does Prakken 2024 or any immediate follow-on define "moves not yet made but structurally reachable" as a distinct stratum, or is the expansion family only defined over *actual* moves? Check Prakken's 2024 paper and supplementary material, plus any COMMA 2024 or IJCAI 2025 paper citing it.

**Q3. Singh-style commitment patterns at four grain sizes.** Singh's create/cancel/release/discharge/assign/delegate operations are uniform over commitments at one grain size. The substrate's "one operation, four call sites" pattern (commitment / warrant / dialogue-move / UX-promotion) has no established name in Round 1. Open question: does there exist a categorical or type-theoretic generalization of Singh's commitment operations that handles multiple grain sizes? Check: Minsky & Papert (Perceptrons, foundational but unrelated; skip), rather Singh's full 2000 ACM CS paper and any categorical commitment-type theory paper from the AAMAS 2020–2025 proceedings.

**Q4. Mansbridge et al. 2012 as ancestor architecture.** T4 can be pitched as a particular operationalization of the 2012 "Systemic Approach to Deliberative Democracy" where one component (the dialectical layer) is structurally anonymized. Open question: does framing T4 as a systemic-deliberation instantiation provide additional normative leverage (legitimacy arguments) over presenting T4 as architecturally novel? Check: Mansbridge et al. 2012 (full text, not just abstract); Parkinson & Mansbridge (2012, *Deliberative Systems*); and any CSCW / CHI 2022–2025 paper that builds on the systemic approach for platform design.

**Q6. Structural-similarity metric for continually-recomputed fidelity scorecard.** The substrate's fidelity scorecard compares LLM agent briefings against a continually-recomputed structural manifest. Round 1 finds that standard argument-mining F1-against-gold is structurally static; the continually-recomputed-manifest discipline is novel (C17 confirmed). Open question: what is the right structural-similarity metric between an LLM briefing and the current structural manifest? Specifically: (a) do any LLM-evaluation papers from 2024–2025 use partial-graph-isomorphism or subgraph-matching metrics for factual-accuracy evaluation over knowledge graphs? (b) Does any recent paper in the deliberation-AI space (IJCAI/AAMAS 2024–2025) define fidelity against a dynamically-computed structural ground truth?

**Q7. Minimum Ludics-MCP tool surface spec as warrant-mcp analog.** warrant-mcp (Glama 2025–2026) provides a 10-tool surface over Dung/ASPIC+/Prakken. The substrate has proposed ~14 Ludics-native MCP read tools. Open question: what is the minimum tool surface that exposes loci, exposure-map slices, articulation-lattice queries, and witnessing records, specified concretely enough to be falsifiable (i.e., a schema that warrant-mcp could be compared against)? This is a design question, not a literature question — but check whether any 2024–2025 MCP/tool-use paper specifies an argumentation-query interface at this level of concreteness.

---

## 5. Bucket structure for the search

Round 2 has four narrower buckets (not six). Allocate roughly equal effort; cap each at ~8 high-relevance sources.

### Bucket A — Ludics internal structure (2015–2025)
Address R-C1, R-C3, R-C5, N-C21, N-C22, N-C23. Focus on: Basaldella–Triads follow-on papers (any); Faggian, Della Rocchetta, Saurin, Baelde, Fleury recent work; categorical game semantics connecting enriched categories to proof-nets or orthogonality. The goal is to close the gap on the corrected Art$(B)$ formulation and the new 0f claims.

### Bucket B — Prakken 2024 + dynamic argumentation (2020–2025)
Address R-C8, R-C5 (dynamic behaviours), Q2, Q3. Focus on: Prakken (2024, *AI* 335) full paper and supplements; any COMMA/IJCAI/KR 2024–2025 paper building on expansion-based dialectical strength; Cayrol–Lagasquie-Schiex 2020–2025; Baumann–Gabbay–Rodrigues follow-ons; Singh commitment-type papers in AAMAS 2022–2025.

### Bucket C — Deliberative democracy + platform design (2020–2025)
Address R-C14, N-C25, Q4. Focus on: Habermas BFN p. 486 (verify specific passage); Mansbridge et al. 2012 full text + Parkinson–Mansbridge 2012; Landemore 2020; Niemeyer–Dryzek 2024; CSCW/CHI 2022–2025 on deliberation platforms and the systemic approach; FAccT 2022–2025 on non-computation governance.

### Bucket D — AI/LLM over argumentation graphs + MCP surfaces (2023–2025)
Address N-C24, Q6, Q7. Focus on: partial-graph content-hashing in collaborative editing or CRDT literature; argumentation-framework change-detection papers (Bisquert, Cocarascu); LLM-over-knowledge-graph fidelity metrics with dynamic ground truth; any AAMAS/IJCAI/NeurIPS 2024–2025 paper on LLM agents over argument graphs with structural validation; warrant-mcp follow-on documentation.

---

## 6. Scope discipline

**In scope:** Items listed in §2–§4 only. Do not re-review claims with confirmed (non-caveat) status from Round 1 (C2, C6, C7, C9, C11, C12, C13, C16, C18, C19) unless you find new contradicting evidence. Do not re-summarize Girard 2001, Hamblin 1970, Walton–Krabbe 1995, or other foundational sources already covered in Round 1.

**Out of scope:** Full Ludics math foundations; full argumentation-semantics literature; proof-theory background; general LLM agent literature beyond Bucket D's specific focus; general deliberative-democracy theory beyond the named touchpoints.

**If you find new prior art that contradicts a Round 1 "confirmed" claim:** Flag it prominently in §1 (Executive summary) and §9 (Concrete revisions). Do not silently discard it. This is the highest-value possible finding.

**If a Round 1 open/inconclusive claim remains open after active search:** Say so explicitly. That is itself a finding.

---

## 7. Source-quality rules

Same as Round 1:

- **Prefer:** Peer-reviewed papers (LICS, COMMA, IJCAI, AAAI, KR, AAMAS, ACL, EMNLP, CHI, CSCW, FAccT), authoritative books, recent (≤5 years) survey papers, primary-source platform documentation.
- **Acceptable:** Workshop papers (DELIBA, IDEA, ArgMining), arXiv preprints from established researchers, technical reports from research groups.
- **Avoid:** Blog posts, marketing material, non-peer-reviewed whitepapers, Wikipedia (except as navigation).
- **Verification:** For new load-bearing claims (N-C21, N-C22, N-C25), cite ≥2 independent sources or explicitly note single-source basis. "Original to this track" requires active search and null result, not assumption.
- **No fabrication:** If you cannot find a source for a claim, mark it *open / inconclusive*, not *original to this track*.

---

## 8. Required deliverable format

Produce a **single markdown document** named `LITERATURE_REVIEW_ROUND_2.md`, intended to live in `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/`. Use KaTeX inline math (`$...$`) and block math (`$$...$$`) consistent with the substrate docs. Use the same claim-first, no-hedging-filler voice as Round 1.

### Required structure

```
# Ludics Generative Substrate — Literature Review Round 2

**Date:** [completion date]
**Baseline:** LITERATURE_REVIEW_ROUND_1.md (verdict table reproduced in Appendix A for reference)
**Companion to:** LUDICS_GENERATIVE_SUBSTRATE.md, LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md, LUDICS_OPEN_COMPOSITION_JOINT.md, LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md
**Scope:** Re-verification of 5 non-confirmed Round 1 claims under revised framing; first-time verification of 5 new claims from Session 0f and cross-track alignment; closure of 5 residual §10 open questions.

## §1. Executive summary
[~1 page. Key findings: how many re-verifications upgraded, downgraded, or held; how many new claims confirmed vs. original; which residual questions closed vs. still open. Three to five most consequential findings for the conceptual track.]

## §2. Re-verification results
[One subsection per re-verified claim (R-C1, R-C3, R-C5, R-C8, R-C14). For each: verdict update + sources + one-sentence implication for the substrate docs. ~0.5 pages each.]

## §3. New claim results
[One subsection per new claim (N-C21 through N-C25). For each: verdict + sources + framing for the substrate. ~0.5–0.75 pages each; N-C21 and N-C22 likely need more space.]

## §4. Residual open questions
[One subsection per question (Q2, Q3, Q4, Q6, Q7). For each: what was found, what remains open, whether the question closes or carries forward. ~0.4 pages each.]

## §5. Reference-cluster index
[Flat list of new sources introduced in this round (not duplicating Round 1 §8). Each: full reference + 1–2 sentence relevance note tying to specific claim/question IDs. This plus Round 1 §8 forms the complete reference set.]

## §6. Concrete revisions to the substrate docs
[Bulleted list. Each bullet: "If finding X holds, update [substrate-doc §Y] to [proposed change]." Actionable, not aspirational.]

## §7. Open research questions carried forward
[Items still unresolved after Round 2, plus any new ones surfaced. Each with a one-paragraph framing. These feed the 0g session and/or a Round 3 if needed.]

## Appendix A — Updated claims verdict table
[Full table: Claim ID | one-line restatement | Round 1 verdict | Round 2 verdict | Primary source(s) | Notes on change.
Include all original C1–C20 plus new N-C21–N-C25. Mark re-verified claims with ↑ (upgrade), ↓ (downgrade), = (unchanged), or ~ (framing changed, verdict same).
Mark new claims with NEW.]
```

### Length target

10–18 pages total. Shorter than Round 1 because scope is narrower. §2 and §3 carry most of the weight; §4 should be concise.

### Style

Same as Round 1: claim-first, no hedging filler, KaTeX inline math, double-quoted code identifiers. When summarizing a paper, state what it claims before whether it confirms the substrate. Cite inline as `(Author Year)` with full reference in §5.

---

## 9. Process guidance for the agent

- **Order of work:** Start with Bucket A (R-C1, R-C3, N-C21–C23) since these are most technically specific and quickest to resolve definitively. Then Bucket D (N-C24, Q6, Q7) since these are the novel cross-track claims with the least prior literature. Then Buckets B and C.
- **When a re-verification is straightforward (verdict clearly holds under new framing):** Note it quickly in §2, move on. Do not re-summarize Round 1 findings.
- **When a new claim (N-prefix) resists resolution after ~30 minutes of active search:** Declare it *original to this track* with null-result note. Do not chase indefinitely.
- **When you find prior art that changes a Round 1 "confirmed" verdict:** Flag it in §1 and §6. This is the highest-value possible finding.
- **The Round 1 verdict table is in Appendix A of `LITERATURE_REVIEW_ROUND_1.md`.** You do not have access to that file, but the relevant verdicts are reproduced in §1 of this prompt. Do not re-derive them.
- **Do not re-verify Round 1 confirmed claims** (C2, C6, C7, C9, C11, C12, C13, C16, C18, C19) unless you encounter new contradicting evidence in the course of Bucket searches.

---

## 10. Out-of-band note to the human running this in parallel

The manual Round 2 review should focus on: (a) verifying N-C21 by reading all Basaldella papers 2015–2025 in full (the agent may miss a non-indexed paper); (b) verifying N-C25 by scanning FAccT 2022–2025 proceedings for "non-computation" / "deliberate non-measurement" governance papers; (c) closing Q4 by reading the Mansbridge 2012 full text for the specific passage about component-level anonymization.

When merging with the agent's output: prefer the agent's §5 reference index for completeness; prefer the human's §6 revisions list for actionability. §1 should be co-authored. Disagreements between the two reviews on verdict changes are the most valuable artifact — they surface interpretive ambiguities in the claim formulations.
