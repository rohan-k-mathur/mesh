# Consolidation, Claims Register, and Dev-Readiness Assessment

**Session:** 0h (Conceptual — Consolidation)
**Date:** 2026-05-18
**Track:** Conceptual / pre-product
**Scope:** Three-part consolidation pass closing the 0a–0g cycle:
(I) forward-pointer resolution — update all stale "queued for 0g" references
across the substrate docs; (II) unified claims register — canonical table of
all 25 claims with final verdicts from Round 1 + Round 2 + Sessions 0f–0g;
(III) dev-readiness assessment — stability tier-map and recommended scope
for the first dev-planning session.
**Companions:**
[LUDICS_GENERATIVE_SUBSTRATE.md](./LUDICS_GENERATIVE_SUBSTRATE.md) ·
[LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md](./LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) ·
[LUDICS_OPEN_COMPOSITION_JOINT.md](./LUDICS_OPEN_COMPOSITION_JOINT.md) ·
[LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md](./LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md) ·
[LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md](./LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md) ·
[LITERATURE_REVIEW_ROUND_1.md](./LITERATURE_REVIEW_ROUND_1.md) ·
[LITERATURE_REVIEW_ROUND_2.md](./LITERATURE_REVIEW_ROUND_2.md)

---

## 0. Frame

Sessions 0a–0g have produced:

- **0a** — Initial terrain map (T1–T5, eight regions, Reading A/B/C, the
  first MCP-tool-surface sketch)
- **0b** — Witnessing layer formalization ($\iota$ with I1–I4, exposure map
  $E(D_P)$, articulation lattice $\mathsf{Art}(B)$, witnessing record,
  announcement discipline design)
- **0c/0d/0e** — Open-behaviour/composition/joint-saturation layer ($\{B_t\}$
  directed system, subordination / transport / federation, $\sigma_\mathrm{joint}$)
- **0f** — Triads bridge and $\vee_{\perp\perp}$ algebraic checks (Reading C
  as Triads instance; corrected $\mathsf{Art}(B) := (\mathsf{Inc}(B),
  \leq_\subseteq, \vee_{\perp\perp})$; honest C3 restatement)
- **0g** — Triads-closure-compatibility check (CQ1–CQ3 all pass for
  $\mathfrak{T}_L$) + Confidence-Erasure-Functor $U: \mathcal{C}_\mathrm{semi}
  \to \mathcal{C}_\mathrm{plain}$ (Kelly 1982 §1.2; $F \dashv U$ adjunction;
  two-level C3)
- **Round 1 + Round 2 literature reviews** — 20 claims tested (R1), 5 new
  claims verified (R2), 3 open questions closed (R2), 7 carried forward

0h's job is to consolidate: resolve all stale pointers, lock in the
canonical claims register, and map the substrate onto a stability tier-map
that drives Phase 1 dev-planning.

---

## Part I — Forward-pointer resolution

The following stale "queued for 0g" / "future session" references have been
updated in-place as part of 0h. All are now resolved.

| Location | Old text | New text |
| --- | --- | --- |
| `LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md` §I.4 | "Open for 0g (Triads check)…" | ✅ Closed in Session 0g §I |
| `LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md` §III.2 (functor) | "…queued for Session 0g" | Written down in Session 0g §II |
| `LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md` §III.2 (Triads check) | "A future session 0g…could close this…" | ✅ Closed in Session 0g §I |
| `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md` §2.2 | "…queued for a future session" | Written down in Session 0g §II |
| `LUDICS_GENERATIVE_SUBSTRATE.md` Status §0f entry | "Two follow-on items queued for a future 0g…" | Addressed in Session 0g (link) |

No other stale pointers to sessions not yet written were found. The ECC
disambiguation note appears correctly in all four substrate docs (each doc
has a blockquote noting the old label is dropped). The $\sigma$ /
"protocol saturation" disambiguation note appears correctly in
`LUDICS_GENERATIVE_SUBSTRATE.md` §3 and `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`
§2.

---

## Part II — Unified claims register

This is the canonical single-source-of-truth table for all 25 falsifiable
claims across the substrate track. R1 = Round 1 verdict; R2 = Round 2 verdict
(where re-checked); **Final** = status after 0h.

### II.1 C1–C20 (original 20 claims)

| # | Claim (brief) | R1 | R2 | **Final** | Primary anchor(s) | Key caveat / note |
| --- | --- | --- | --- | --- | --- | --- |
| **C1** | $\mathsf{Art}(B) = (\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ is a join-semilattice | partial | ↑ conf. w/ caveat | **Corrected** | Fouqueré–Quatrini 2013 LMCS 9(4:6); Doumane 2017 CSL; Phase 2e proof | $\mathsf{Inc}(B)$ is an antichain under $\leq_\subseteq$; $\vee_{\perp\perp}$ maps out of $\mathsf{Inc}(B)$ for every pair of distinct inputs. $(B, \leq_\subseteq)$ also decomposes into disjoint cones (one per incarnation) with no cross-cone upper bounds. Correct JSL carrier = per-incarnation cone $C_i \subseteq B$. See `LUDICS_OQ_JSL_PROOF.md`. |
| **C2** | $\mathsf{Inc}(B)$ = minimal elements of $(B, \leq_\subseteq)$ | confirmed | — | **Confirmed** | Girard 2001; Fouqueré–Quatrini 2013 | Direct definitional match |
| **C3** | $\mathsf{Art}(B) \simeq \mathrm{Hom}_{\mathcal{C}_\mathrm{semi}}(A,B)$ (load-bearing) | single-source | — | **Single-source structural identification (per-cone reframe)** | Ambler 1996; Girard 2001 + Fouqueré–Quatrini 2013 (two halves separately) | Per Phase 2e (C1 correction): identification is **per-cone** — each cone $C_i$ corresponds to one Ambler hom-set component; incarnations = selected arrows; $B = \bigsqcup_i C_i$ corresponds to the disjoint union of Ambler hom-sets over the incarnation index. JSL isomorphism (0g-OQ1) restated as: is each $(C_i, \leq_\subseteq)$ isomorphic to the corresponding Ambler hom-set component? |
| **C4** | $\sigma(D)^{\perp}$ stratifies into walked / witnessable-in-$k$ / latent | original | — | **Original to track** | (active null) | Fouqueré–Quatrini 2018 "saturation" is different construct; stratification by participant-access modality absent from all Ludics work |
| **C5** | Behaviours form directed system $\{B_t\}$ with partial transitions | open | open | **Open** | Doutre–Herzig–Perrussel KR 2023 (cousin); CAFs | Ludics-side formalism unattested; 0c construction is usable but not proved in literature |
| **C6** | Delocation extends $D$ to a new locus | confirmed | — | **Confirmed** | Girard 2001; Fouqueré–Quatrini 2012 | Standard delocation = single-design same-shape; locus-addition stronger variant is working assumption |
| **C7** | No multi-agent Ludics commits to Reading C | confirmed | — | **Confirmed** | ≥6 independent sources (Lecomte–Quatrini 2011; Fleury–Quatrini–Tronçon 2011; Fouqueré–Quatrini 2012; Bougsty-Marshall 2020; Basaldella 2015; Fleury–Tronçon 2011) | Basaldella Triads = closest stepping-stone; does not commit to player-role assignment + external Witness |
| **C8** | ASPIC+/Prakken 2024 have no exposure-map analog | conf. w/ caveat | ↑ strengthened | **Confirmed + explicitly positioned** | Modgil–Prakken 2013; Prakken 2024 AI 335:104193 | Walked/witnessable/latent stratification wholly absent in Prakken 2024; exposure map = orthogonal refinement of Prakken expansion-based dialectical strength |
| **C9** | AIF dialogue layer is utterance-centric and attribution-default | confirmed | — | **Confirmed** | Chesñevar et al. 2006; Reed et al. 2008 (AIF+) | L-nodes = subclass of I-nodes (locutions are propositions about speech events) |
| **C10** | CCC composition lifts to articulation-lattice composition (unwritten for deliberation) | original (mech. available) | — | **Mechanism confirmed; writeup deferred** | Ambler 1996 (Kelly/Pitts enriched-category background) | No published paper writes this for deliberation; deferred (0h-OQ from 0f) |
| **C11** | Hamblin attribution-default; dual-layer not standard (load-bearing) | confirmed | — | **Confirmed** | Hamblin 1970; Walton–Krabbe 1995; Walton 2010 | ≥6 confirmations; Singh closest but opposite direction (act → attributed-new-state) |
| **C12** | No pre-existing-move vs. utterance separation; I1–I4 novel | confirmed | — | **Confirmed** | Walton–Krabbe 1995; Singh 1999; McBurney–Parsons 2002 | Singh's social-commitment is act-creates-state; substrate's ι is witness-binds-to-anonymous-locus — mathematically dual |
| **C13** | No canonicalization pipeline upstream of commitment binding | confirmed | — | **Confirmed** | Walton–Krabbe 1995; Walton 2006; McBurney–Parsons 2002 | Argument mining (Lawrence–Reed 2019) = structurally similar but offline on transcripts; live gate is the novel piece |
| **C14** | No deliberative-democracy theorist proposes T4-style separation (load-bearing) | conf. w/ correction | ↑ confirmed | **Confirmed (corrected framing)** | Habermas BFN 1996 p. 486; Mansbridge et al. 2012; Niemeyer, Veri, Dryzek & Bächtiger APSR 118(1):345–362, 2024 | Cohen 1989 gloss retracted; Habermas anonymous-sovereignty + Fishkin aggregate-only reporting discipline are honest analogs; Niemeyer et al. 2024 adds empirical-operationalization layer |
| **C15** | No deployed platform maintains T4 separation | confirmed | — | **Confirmed** | Small et al. 2021 (Pol.is); Kialo Edu docs; Decidim/Loomio docs | Pol.is (pseudonymous + opinion landscape) and Kialo Edu Anonymous Discussions (structural tree + peer-pseudonymous) are closest; neither implements records-only ι |
| **C16** | No MCP / tool-use surface exposes Ludics-native reads (load-bearing) | confirmed | — | **Confirmed** | warrant-mcp (Glama 2025–2026); AIFdb; Argdown | warrant-mcp = only deployed MCP-over-argumentation; Dung/ASPIC+/Prakken only; zero Ludics primitives. MCP protocol: Anthropic Nov 2024; donated to AAIF/LF Dec 2025 |
| **C17** | Fidelity-scorecard discipline not standard | confirmed | — | **Confirmed** | LLM-judge literature (Mirzakhmedova et al. 2024; Wachsmuth et al. 2024) | F1-against-static-gold ≠ continually-recomputed-manifest discipline |
| **C18** | "One operation, four call sites" has no established name | confirmed | — | **Confirmed** | Singh 1999; McBurney–Parsons 2005 ENTCS | No categorical/type-theoretic generalization to four grain sizes found |
| **C19** | Fossil-record discipline has no standard analog | conf. w/ near-miss | — | **Confirmed-with-near-miss** | Prakken `retract` via warrant-mcp; Cayrol et al. 2010; Baumann–Gabbay–Rodrigues 2020 | Prakken retract preserves transcript but lacks locus back-pointer and "no longer applies to current $D_P$" flag |
| **C20** | Joint saturation $\sigma_\mathrm{joint}$ is novel in multi-agent Ludics | original | — | **Original to track** | (active null) | Reading C dissolves the bilateral-merge approach used in all prior multi-agent Ludics work |

### II.2 N-C21–N-C25 (Round 2 + 0f/0g new claims)

| # | Claim (brief) | R2 | 0g update | **Final** | Primary anchor(s) | Key caveat / note |
| --- | --- | --- | --- | --- | --- | --- |
| **N-C21** | Reading C = Triads instance $(P, N, \perp)$ with external $\mathsf{Witness}$ relation | original (active null; ≥3 sources) | Triads-closure-compatibility proved (CQ1–CQ3) | **Original to track; Triads-compatible** | Basaldella 2015 arXiv:1502.04773 Def. 1.1 (formal base) | No Triads-lineage paper introduces participant-tracking $\mathsf{Witness}$; compatibility with $\mathfrak{T}_L$ proved in 0g §I |
| **N-C22** | Confidence-Erasure-Functor $U: \mathcal{C}_\mathrm{semi} \to \mathcal{C}_\mathrm{plain}$ | pattern confirmed; application original | $U$ formally written down; $F \dashv U$ adjunction identified | **Confirmed (pattern); original (application); functor written** | Kelly 1982 (TAC reprint 10, §1.2); Borceux–Stubbe; Jansana–San Martín 2018 arXiv:1811.03698 | $(-)_0 : V\text{-}\mathbf{CAT} \to \mathbf{CAT}$ is standard; confidence-stripping application is the substrate's framing |
| **N-C23** | $\vee_{\perp\perp}$ join on $\mathsf{Inc}(B)$: primitives standard; named join original | components standard; named join original | C1 corrected (Phase 2e) | **Corrected** | Faggian–Basaldella 2011 LMCS; Fouqueré–Quatrini 2013; Doumane 2017; Phase 2e proof | $\perp\perp$-closure and incarnation-poset are ludics-standard. The restriction to $\mathsf{Inc}(B)$ as the named JSL carrier is incorrect: $\mathsf{Inc}(B)$ is an antichain and $\vee_{\perp\perp}$ always exits it. The per-incarnation cone $C_i$ is the correct carrier for the per-cone JSL (OQ-JSL-Cone open). |
| **N-C24** | Briefing fingerprint: content-hash over partial graph region + optimistic concurrency + 5-rule material-change taxonomy | original (conjunction of features) | — | **Original to track** | Bisquert et al. hal-02875531 (change typology); Almeida 2023 arXiv:2310.18220 (CRDT survey) | Three features not found jointly in prior art |
| **N-C25** | Explicit "what is deliberately not computed" list as first-class governance artifact | original; philosophical antecedent in Suchman 2002 | — | **Original to track** | Suchman 2002 Scand. J. Inf. Syst. 14(2):91–105 | Operationalization as platform deliverable is new |

### II.3 Summary count

| Verdict class | Claims | # |
| --- | --- | --- |
| Confirmed / Confirmed-with-caveat | C2, C6, C7, C8, C9, C11, C12, C13, C14, C15, C16, C17, C18, C19, N-C21, N-C22 | 16 |
| Corrected (claim false as stated; correct form identified) | C1, N-C23 | 2 |
| Restated (per-cone reframe) | C3* | 1 |
| Original to track (active null) | C4, C10†, C20, N-C21, N-C23, N-C24, N-C25 | 7 |
| Open / inconclusive | C5 | 1 |

\* C3 = single-source structural identification; the poset-level correspondence is the working claim; JSL isomorphism is conjectural (0g-OQ1).

† C10 = mechanism confirmed in enriched-category theory; the deliberation-specific writeup is deferred.

**No claim has been contradicted outright across two rounds of active search.**

---

## Part III — Dev-readiness assessment

### III.1 Stability tier-map

The substrate constructs split into three stability tiers for dev-planning
purposes.

#### Tier 1 — Ready to drive Phase 1 dev now

These constructs have confirmed or confirmed-with-caveat verdicts, clear
operational definitions, and no blocking open questions. Any Phase 1 dev
spec can take these as stable requirements.

| Construct | Backing claim(s) | Primary dev target |
| --- | --- | --- |
| $\iota$ (instantiation) with I1–I4 invariants | C12, C11 | `bind_participant_to_design` MCP tool; witnessing layer DB schema |
| $E(D_P)$ exposure map (walked / witnessable / latent) | C4, C8 | `get_exposure_map` MCP tool; Phase 1 structural manifest |
| $\mathsf{Art}(B) = (\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ | C1, C2 | `get_articulation_lattice` / `compute_articulation_join` MCP tools |
| Witnessing record | C12, C18 | `get_witnessing_record` MCP tool |
| Reading C (T3′ anonymized polarity) | C7, N-C21 | 2-layer dialectical/witnessing architecture |
| T4 (dialectical/witnessing separation) | C11, C14, N-C21 | Attribution-anonymized storage discipline; non-attribution invariant |
| Delocation + locus-growth | C6 | Locus-addition in deliberation-engine schema |
| T4 normative anchoring | C14 | DRI measurement hook (Niemeyer et al. 2024 operationalization) |
| No Ludics-native MCP surface exists | C16 | The ~14-tool surface in 0b §5 is the build target; no existing surface to extend |
| Fidelity-scorecard discipline | C17 | Phase 1 structural manifest + regression harness |
| Fossil-record discipline | C19 | `retract`-with-locus-back-pointer; fossil-flagged transcript entries |
| MCP protocol grounding | C16, Q7 | JSON-RPC tool triples; MCPToolBench++ as benchmark baseline |

#### Tier 2 — Working hypotheses; usable in dev planning with explicit caveats

These are original-to-track constructs or single-source structural
identifications. Suitable for Phase 2–4 platform planning; dev specs should
label them "structural conjecture" or "working hypothesis" rather than
confirmed claims.

| Construct | Backing claim(s) | Dev implication | Open dependency |
| --- | --- | --- | --- |
| C3 Ambler↔Ludics bridge | C3, N-C22 | `get_articulation_lattice` semantic interpretation; plain-CCC hom-set = incarnation set after $U$ | 0g-OQ1 (surjective counit) determines whether `get_ambler_derivations` adds value |
| $\{B_t\}$ directed system | C5 | Phase 3 temporal-composition; `get_behaviour_at_time` | Ludics-side formal treatment is open; 0c construction usable |
| $\sigma_\mathrm{joint}$ (joint saturation) | C20 | Phase 4 federation (`compute_joint_saturation`) | Original to track; no blocking open issue for dev but no literature anchor |
| Briefing fingerprint (N-C24) | N-C24 | Phase 3 AI roadmap; optimistic-concurrency hash in agent-briefing API | Five material-change rules need precise spec (OQ6) |
| Confidence-Erasure-Functor $U$ (N-C22) | N-C22, 0g §II | Motivates plain-vs-enriched tool-surface split; `get_articulation_lattice` vs. future `get_ambler_derivations` | 0g-OQ1 (surjective counit) gates the `get_ambler_derivations` tool |

#### Tier 3 — Deferred; do NOT gate Phase 1 on these

These items need formal-proof work or deeper literature engagement before
they can drive requirements.

| Item | Why deferred | Path to resolution |
| --- | --- | --- |
| 0g-OQ1 (surjective counit $\varepsilon$; strong C3) | Determines whether Ambler hom-set ≅ free-semilattice on $\mathsf{Inc}(B)$; not blocking for Phase 1 but required before `get_ambler_derivations` is specifiable | Formal-proof session targeting Ambler 1996 full PDF + Jansana–San Martín 2018 adjoint structure |
| C10 (composition lift writeup) | `compute_articulation_join` is specifiable from C1/C2 alone; the categorical proof that composition *of dialogues* lifts is a separate exercise | Future formal-proof session (after Phase 1 build) |
| OQ2 (full semilattice structure on $\mathsf{Inc}(B)$ under $\vee_{\perp\perp}$) | Affects whether the join satisfies quantale-style conditions beyond associativity + bottom; currently a working assumption | Formal verification against Basaldella 2015 Def. 2.x |
| 0g-OQ3 (full Basaldella axiom check on $\mathfrak{T}_L$) | CQ1–CQ3 cover what Reading C needs; full formal check is a completeness verification | Future formal session or external Ludics collaborator |
| OQ3 (Singh grain-size categorical generalization) | Interesting but does not block any Phase 1–2 dev target | Round 3 literature review or dedicated session |

### III.2 Open question register (all carry-forwards)

Consolidated list of all open questions from Round 1 §10 (unclosed), Round 2 §7, and 0g-OQ1–4.

| # | Question | Source | Priority for dev |
| --- | --- | --- | --- |
| **OQ-C5** | Categorical formulation of $\{B_t\}$ as directed system in $\mathbf{Beh}$ with partial orthogonality-respecting transitions | R1 Q1 / R2 OQ1 | Low (C5 construction usable without proof) |
| **OQ-C10** | Write out the composition lift to articulation-lattice join for the deliberation setting | R1 Q5 / 0f §III.2 | Medium (needed before "Category-C10 confirmed" can appear in publications) |
| **OQ-C3-strong** | Per Phase 2e per-cone reframe: is the per-cone counit $\varepsilon_{A,B,i}: \mathcal{F}(C_i) \to \mathcal{C}_\mathrm{semi}(A, B_i)$ surjective for each incarnation cone $C_i$? (Original global form $\varepsilon_{A,B}: \mathcal{F}(\mathsf{Inc}(B_A)) \to \mathcal{C}_\mathrm{semi}(A,B)$ is ill-typed after C1 correction.) | 0g-OQ1; Phase 2e C3 reframe | Low (gates `get_ambler_derivations`; Phase 1 does not need it) |
| **OQ-JSL** | ~~Does $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ satisfy quantale / full-semilattice axioms beyond assoc. + bottom?~~ **Resolved — negative.** $\mathsf{Inc}(B)$ is an antichain; $\vee_{\perp\perp}$ exits $\mathsf{Inc}(B)$ universally; $(B, \leq_\subseteq)$ decomposes into disjoint cones with no cross-cone joins. See `LUDICS_OQ_JSL_PROOF.md`. | R2 OQ2; Phase 2e | Closed |
| **OQ-JSL-Cone** | Within a single cone $C_i = \{ D \in B : \lvert D \rvert_B = D_i \}$, is $(C_i, \leq_\subseteq, \vee)$ a join-semilattice with bottom $D_i$? (Residual obligation from Phase 2e.) **Pre-session (May 21, 2026):** order ambiguity resolved — $\leq_\subseteq$ is literal chronicle-set inclusion (Reading A); Daimon Lock Lemma forces same-cone designs to share their entire positive/daimon skeleton and differ only in negative-branch coverage. **Expected Outcome I:** $(C_i, \subseteq, \cup)$ is a JSL with bottom $D_i$ and join = literal chronicle-set union. See `LUDICS_ORDER_RELATION_DEFINITION.md`. Still open pending the OQ-JSL-Type/Cone session proper. | Phase 2e open; Phase 2f pre-session | Medium (needed before per-cone JSL is licensed for publication) |
| **OQ-JSL-Type** | Consistent type-level definition of $(D_1 \cup D_2)^{\perp\perp}$ at the design level (chronicle-set closure vs. behaviour closure — two candidate interpretations in `LUDICS_OQ_JSL_PROOF.md` §5.4). **Pre-session (May 21, 2026):** under Reading A, same-cone union is already a valid design in $B$, so $\perp\perp$-closure is trivial (singleton fixed-point) and the join simplifies to literal union $\cup$. Interpretation (a) confirmed as the right reading; (b) abandoned. See `LUDICS_ORDER_RELATION_DEFINITION.md`. Still open pending the OQ-JSL-Type/Cone session proper. | Phase 2e open; Phase 2f pre-session | Low (foundational; does not block current implementation) |
| **OQ-JSL-Ambler** | Does the per-cone reframe of C3 still support the 0d convolution construction? (Convolution assumed a single JSL across all incarnations; under per-cone picture it is per-cone.) | Phase 2e open | Medium (gates cross-room Plexus transport) |
| **OQ-C3-thin-cones** | Under Reading A (literal chronicle-set inclusion; see `LUDICS_ORDER_RELATION_DEFINITION.md`), cones $C_i$ are "thin" — designs grow only by adding negative branches (additive slices at negative nodes), not by extending past incarnation daimons. Question: are thin cones rich enough to populate the Ambler hom-set in the C3 / OQ-C3-strong identification, or does the categorical story need to be restated in terms of the approximation order $\sqsubseteq$ rather than $\subseteq$? Surfaced by Phase 2f pre-session (May 21, 2026) as the one genuinely-new follow-up from resolving the order ambiguity. | Phase 2f pre-session | Medium (gates the publication-form C3 statement; downstream of OQ-JSL-Cone and OQ-C3-strong) |
| **OQ-Triads-ax** | Does $\mathfrak{T}_L$ satisfy all Basaldella 2015 axioms line-by-line? | 0g-OQ3 | Low (CQ1–CQ3 cover what's needed for Reading C) |
| **OQ-Triads-colimit** | Does $\{\mathfrak{T}_{L,t}\}$ have a colimit in the category of Triads? | 0g-OQ4 | Low |
| **OQ-Singh** | Categorical generalization of Singh-style commitment operations to four grain sizes | R1 Q3 / R2 OQ3 | Low |
| **OQ-fidelity** | ~~Define a subgraph-matching fidelity scorecard for LLM outputs against dynamically-computed deliberation-graph ground truth.~~ **Resolved — implemented.** Phase 2f adds: (1) `DependencyEdge` / `ChainDependencyScore` types; (2) `Manifest.dependencyEdges` extracted from all `ChainProjection.edges`; (3) `BriefingClaim.claimedDependencyEdges`; (4) edge-level + node-level P/R/F1 scored in `scorePhase1` via `scoreChainDependency`; (5) `chain-direction-reversal` as a new release-blocking `ConfidentMisstatementKind`; (6) 12 tests in `__tests__/eval/chainDependency.test.ts`. Dynamic-manifest variant distinguishes this from static-gold GraphEval baselines (C17 caveat). See `eval/ai-epi/scorecard/phase1.ts` and `eval/ai-epi/types.ts`. | R1 Q6 / R2 OQ4 | **Closed** |
| **OQ-5rules** | Specify and categorize the five material-change rules for briefing-fingerprint content hashing; compare against Bisquert change-typology | R2 OQ6 | Medium (Phase 3 AI roadmap) |
| **OQ-Prakken-strata** | Is the walked/witnessable/latent stratification a strict refinement of Prakken 2024's expansion family, or does it require a different base structure? | R2 OQ7 | Low |
| **OQ-exclusion-empirical** | Empirical CHI/CSCW study: do users respond positively to explicit "what is deliberately not computed" lists shipped alongside platform outputs? | R2 OQ5 | Low (Phase 5, research) |

---

## Part IV — Recommended scope for dev-planning Session 1

### IV.1 What the substrate licenses for Phase 1

All Tier-1 constructs are ready. The substrate licenses Phase 1 dev planning
targeting the following deliverables (matching the AI roadmap Phase 1 "Structural
Ground Truth" phase):

1. **MCP tool surface (~14 tools) from 0b §5.** All tools have Tier-1 backing:
   - `get_exposure_map`, `get_articulation_lattice`, `compute_articulation_join`,
     `get_witnessing_record`, `get_joint_saturation_witness`
   - `bind_participant_to_design` (ι operation with I1–I4 enforcement)
   - `get_deliberation_schema`, `get_behaviour_at_locus`, `get_incarnation`
   - `get_claim_graph`, `get_claim_topology` (hub-set, load-bearing premises)
   - `get_structured_argument`, `propose_structured_argument` (already deployed)
   - `get_fossil_record` (retract-with-locus-back-pointer)

2. **Fidelity-scorecard discipline.** Mechanically-computable structural
   manifest + regression harness (C17 confirmed; OQ-fidelity is the
   precision-definition question to tackle in Session 1).

3. **Witnessing-layer DB schema.** Non-attribution invariant (T4 confirmed),
   records-only $\iota$ (I1–I4 confirmed), locus-keyed design storage.

4. **Briefing-fingerprint API (Phase 3 hook).** N-C24 is Tier-2; can be
   designed in Phase 1 with "structural conjecture" flagging; five material-change
   rules (OQ-5rules) to be spec'd in Session 1.

### IV.2 What to defer to Phase 2–4

- `get_ambler_derivations` tool: gates on 0g-OQ1 (surjective counit); defer
- `compute_temporal_composition` / `get_behaviour_at_time`: gates on C5
  formal treatment; working assumption is adequate for Phase 3 design
- `compute_joint_saturation`: Phase 4 federation work; Tier 2

### IV.3 Session 1 recommended agenda

Session 1 should be a **dev-spec session** (not conceptual):

1. Finalize the ~14-tool MCP schema as JSON-RPC name/description/input-schema
   triples (mapping 0b §5 tool sketches to implementable schema)
2. Define the "structural manifest" precisely: which graph properties are
   mechanically computable and which require NLP-pipeline components
3. Specify the fidelity scorecard: what is measured, how often, against what
   ground truth (OQ-fidelity)
4. Write the non-attribution DB invariant as a schema constraint and API contract
5. Draft the briefing-fingerprint API with the five material-change rules as
   a preliminary spec (OQ-5rules)

---

## Status

**Session 0h** closes the 0a–0g conceptual cycle.

- **Part I** resolved all 5 stale "queued for 0g" forward pointers across the
  substrate doc corpus. No other stale pointers were found.

- **Part II** produced the canonical claims register for all 25 claims
  (C1–C20, N-C21–25). 16 confirmed/confirmed-with-caveat; 7 original-to-track
  with active-null results; 1 open (C5); 1 single-source structural
  identification (C3, working hypothesis). No claim is contradicted outright
  after two rounds of active search.

- **Part III** produced the stability tier-map: 12 Tier-1 constructs are ready
  to drive Phase 1 dev planning now; 5 Tier-2 constructs are usable as working
  hypotheses in Phase 2–4 planning; 5 formal-proof items are deferred. An 11-item
  open-question register consolidates all carry-forwards from Round 1, Round 2,
  and Sessions 0f–0g.

- **Part IV** identified Session 1 (dev-spec mode) as the immediate next step:
  finalize the ~14-tool MCP schema, define the structural manifest and fidelity
  scorecard, specify the non-attribution DB invariant, and draft the
  briefing-fingerprint API.

**The substrate is stable enough to drive Phase 1 dev planning.** The
conceptual track has served its purpose: the constructs it introduced have
been tested against the literature, corrected where needed, and mapped to a
clear build target. Session 1 should be the first session in which
implementation decisions — schema, API contracts, test harness design — are
the primary output.

