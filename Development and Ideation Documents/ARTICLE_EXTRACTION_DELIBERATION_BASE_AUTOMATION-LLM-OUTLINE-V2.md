# Isonomia Extraction Pipeline: System Architecture

## High-Level Architecture for Article Extraction, Argument Reconstruction, Deliberation-Base Construction, Confidence Scoring, and Human-in-the-Loop Validation

---

## 1. System Overview

The extraction pipeline transforms unstructured source material (academic papers, policy documents, journalism, opinion essays, reviews) into structured, scheme-annotated argument graphs that populate Isonomia's deliberation base. The pipeline is designed around two core principles: **conservative extraction** (better to under-extract than to produce plausible-but-wrong reconstructions) and **legible uncertainty** (every stage of the pipeline emits compositional confidence scores that travel with the output through the entire system).

The pipeline has five major stages, each producing artifacts that feed downstream:

```
Source Ingestion → Claim Extraction → Argument Reconstruction → Deliberation-Base Assembly → Human Validation
       ↑                                                                                          |
       |__________________ Calibration Feedback Loop ______________________________________________|
```

---

## 2. Stage 1: Source Ingestion & Preprocessing

### Purpose
Normalize heterogeneous source documents into a clean, citable, content-addressed text corpus.

### Inputs
- URLs, PDFs, DOIs, or raw text
- Source metadata (author, publication, date, type/genre classification)

### Processing
- **Format normalization**: Convert to structured text with paragraph and section boundaries preserved. Retain document structure (headings, figure captions, footnotes) as metadata annotations rather than discarding them.
- **Content hashing**: Generate SHA-256 content hashes per source document and per paragraph/section. This is the provenance anchor for all downstream citations.
- **Archival snapshot**: Fetch and store an archived version (via Wayback Machine or internal archival) at ingestion time. Link the content hash to the archived URL so that evidence provenance is immutable even if the source changes.
- **Source classification**: Tag the source with a genre/type label (peer-reviewed empirical study, review/meta-analysis, policy document, opinion/editorial, journalism, book chapter, etc.). This classification influences downstream extraction heuristics — empirical papers have different argumentative structures than op-eds.
- **Deduplication**: Check content hashes against the existing corpus. If a source or near-duplicate is already ingested, link rather than re-ingest. Use similarity hashing (e.g., SimHash or MinHash) for near-duplicate detection.

### Outputs
- Normalized text corpus entry with content hash, archived URL, and genre tag
- Paragraph-level content hashes for fine-grained evidence linkage

### Confidence Dimensions at This Stage
- `source_accessibility`: Was the full text retrieved, or only an abstract/snippet?
- `format_fidelity`: How much structural information survived normalization? (High for clean HTML/well-tagged PDFs, lower for scanned documents or image-heavy layouts)

---

## 3. Stage 2: Claim Extraction

### Purpose
Identify discrete, propositional claim atoms in the source text — the atomic units of argumentation.

### Inputs
- Normalized source text with paragraph boundaries and genre tag

### Processing

#### 3.1 Sentence-Level Claim Detection
Classify each sentence (or clause, for compound sentences) as:
- **Assertive claim**: A propositional statement that could be true or false and that the author appears to endorse. This is the primary extraction target.
- **Evidential statement**: A report of data, findings, or observations. (These become evidence artifacts, not claim atoms.)
- **Framing/contextual**: Background, hedging, narrative scaffolding. Not extracted as claims, but retained as context metadata.
- **Quoted/attributed**: A claim the author is reporting rather than endorsing. Flagged for attribution linkage.

Confidence dimension: `claim_boundary: float` — how confident the pipeline is that a given text span constitutes a single, well-bounded claim atom.

#### 3.2 Claim Normalization & Deduplication
- Rewrite claims into canonical propositional form (declarative, present tense, explicit subject). Retain the original text as a `source_text` field for provenance.
- Generate a MOID (content-addressed hash of the canonical claim text) for identity.
- Check the canonical claim against the existing claim base for semantic duplicates. Use embedding similarity with a conservative threshold — flag near-duplicates for human review rather than auto-merging. This is critical: premature merging of claims that are *almost* the same but differ in important ways (scope, modality, specificity) is one of the most damaging errors the pipeline can make.

> **Scaling Concern — Tiered Deduplication Architecture**
>
> At scale (hundreds of sources on a contested topic), the number of near-duplicate candidate pairs grows combinatorially, and the human review queue for dedup alone can swamp reviewer bandwidth. The design principle — "flag near-duplicates for human review" — is correct but needs operational structure to remain viable. Recommended tiered approach:
>
> - **Tier 1 — Exact MOID match**: Auto-merge. Identical canonical text, no review needed.
> - **Tier 2 — High embedding similarity** (above a tuned threshold, e.g. >0.95 cosine): Auto-flag with a diff view showing the specific textual differences. These are the most likely true duplicates and the easiest for a reviewer to adjudicate quickly.
> - **Tier 3 — Moderate embedding similarity** (e.g. 0.80–0.95): Treat as distinct unless a reviewer manually initiates a merge. Surface these as "possibly related claims" in the validation interface, but do not add them to the dedup review queue by default.
> - **Tier 4 — Below threshold** (<0.80): Treat as distinct, no flagging.
>
> The key design constraint: **false merges are much more damaging than false splits.** Two distinct claims that should have been merged just create redundancy in the deliberation base (cosmetic, fixable later). Two different claims that get wrongly merged destroy information — the scope/modality distinction between them is lost, and any arguments built on the merged claim may inherit the wrong specificity. The tiered system is biased toward under-merging, which is the correct failure mode.

Confidence dimensions:
- `normalization_fidelity: float` — how well the canonical form preserves the meaning of the original text
- `dedup_distinctness: float` — how confident the pipeline is that this claim is genuinely distinct from existing near-matches in the claim base (low score = likely duplicate, flagged for human review)

#### 3.3 Claim Typing & Metadata
Tag each claim with:
- **Claim type**: Empirical (testable by observation), normative (value/ought claim), definitional, methodological, causal, predictive, etc.
- **Scope & modality**: Universal/existential, necessary/contingent, qualified/unqualified
- **Domain tags**: Topic-level classification for routing to appropriate deliberations

Confidence dimension: `claim_typing: float` — how confident the pipeline is in the type/scope/modality classification

### Outputs
- Claim atom records: `{ moid, canonical_text, source_text, source_hash, paragraph_hash, claim_type, scope, modality, domain_tags, confidence_profile }`

---

## 4. Stage 3: Argument Reconstruction

### Purpose
Identify inferential relationships between extracted claims (and implicit claims) to reconstruct the source's argument structure: premises, warrants, conclusions, and argumentation schemes.

This is the hardest and most error-prone stage of the pipeline. Conservative extraction is paramount.

### Inputs
- Extracted claim atoms with source context
- Source genre tag (influences reconstruction heuristics)

### Processing

#### 4.1 Premise-Conclusion Relation Detection
Identify which claims in the source function as premises (reasons given) and which as conclusions (claims being argued for). Look for:
- Explicit discourse markers ("therefore," "because," "this suggests," "it follows that," etc.)
- Paragraph-level rhetorical structure (topic sentences as conclusions, supporting sentences as premises)
- Citation patterns (a claim followed by a citation is more likely a premise being evidenced; a claim preceded by several evidenced premises is more likely a conclusion)

This stage produces candidate **inference links**: directed edges from premise-sets to conclusions.

Confidence dimension: `inference_detection: float` — how confident the pipeline is that a genuine inferential relationship exists between these specific claims (as opposed to mere co-occurrence or narrative sequence)

#### 4.2 Implicit Premise & Warrant Reconstruction
This is the most epistemically dangerous part of the pipeline, and where conservatism matters most.

Many arguments in natural text suppress one or more premises or the bridging warrant. The pipeline should:
1. **Detect gaps**: Identify premise→conclusion links where the inference doesn't follow from the stated premises alone. Use logical gap analysis: given the stated premises, does the conclusion follow, or is there a missing step?
2. **Reconstruct candidates**: Generate candidate implicit premises or warrants that would make the inference valid. Typically this involves identifying the unstated general principle (warrant) or the unstated minor premise.
3. **Flag, don't assert**: Reconstructed implicit premises should be clearly marked as `isImplicit: true` with a `reconstruction_confidence` score. At low confidence, the pipeline should leave a gap marker ("implicit premise detected but not reconstructed") rather than guess.

The warrant — the general inferential principle connecting premises to conclusion — is often the most important element to make explicit, and the hardest to reconstruct correctly. The pipeline should attempt warrant reconstruction only when:
- The scheme classification (see 4.3) is confident enough to constrain the space of plausible warrants
- The reconstructed warrant is one of a small number of canonical warrants for the identified scheme

Otherwise, the warrant should be left as a typed gap: "this argument appears to rely on a warrant of type [scheme], but the specific warrant has not been reconstructed."

> **⚠ Circularity Warning — Scheme/Warrant Co-Determination**
>
> The sequential framing above (classify scheme → constrain warrant space → reconstruct warrant) understates a genuine architectural difficulty: scheme classification and warrant reconstruction are co-determined. You classify an argument as "cause to effect" partly by recognizing that its implicit warrant is a causal generalization, but you reconstruct the causal generalization partly by having classified the scheme as causal. The confidence scores for each stage are therefore entangled in ways the compositional confidence model does not fully capture — a high `scheme_classification` score can mask the fact that the classification was partly derived from a warrant guess that itself has low confidence.
>
> **Bootstrap-phase recommendation:** During the initial implementation, **defer warrant reconstruction almost entirely** and focus on premise-conclusion structure, scheme classification, and evidence linkage. Leave warrants as typed gaps. The critical questions generated by scheme classification already do most of the work that explicit warrants would do — they tell you what would need to be true for the argument to hold. Explicit warrant reconstruction is intellectually satisfying but practically high-risk for low marginal payoff during bootstrap, where human validation bandwidth is the scarcest resource. Every badly reconstructed warrant that enters the deliberation base is a thing a reviewer must catch and fix, and the failure mode is insidious: a plausible-but-wrong warrant generates plausible-but-wrong critical questions, and the error propagates silently through downstream dialectical relations. Warrant reconstruction can be phased in once the pipeline's scheme classification is well-calibrated and the validation infrastructure can handle the additional review load.

Confidence dimensions:
- `gap_detection: float` — confidence that a genuine inferential gap exists
- `implicit_premise_reconstruction: float` — confidence in the specific reconstructed premise/warrant (this will often be low, and that's fine)
- `warrant_reconstruction: float` — confidence in the reconstructed bridging principle (separate from premise reconstruction because warrants are a different kind of claim)

#### 4.3 Argumentation Scheme Classification
Map reconstructed arguments to Walton-style argumentation schemes (cause to effect, expert opinion, sign, practical reasoning, analogy, etc.). Scheme classification matters because:
- Each scheme carries a specific set of **critical questions** that define the argument's vulnerability surface
- Scheme classification constrains warrant reconstruction (see 4.2)
- Scheme identity is the primary mechanism for linking arguments to the appropriate dialectical testing procedures

The pipeline should:
1. **Classify the scheme** based on the structure of the premises, the type of the conclusion, and any explicit scheme indicators in the text
2. **Generate the critical question set** for the classified scheme
3. **Check whether any critical questions are already answered** in the source text (e.g., a causal argument that pre-emptively addresses alternative causes has already answered one of its critical questions)

Confidence dimension: `scheme_classification: float` — how confident the pipeline is in the scheme assignment. If below threshold, flag the argument as "scheme-unclassified" rather than guessing. A wrong scheme assignment is worse than no scheme assignment because it generates the wrong critical questions.

#### 4.4 Evidence-Premise Linkage
Link evidential statements (identified in Stage 2) to the specific premises they support. A single piece of evidence may support multiple premises; a single premise may be supported by multiple pieces of evidence.

For each link:
- Record the source passage, the content hash, and the archived URL
- Classify the evidence type (statistical finding, case study, expert testimony, survey data, experimental result, observational report)
- Assess the directness of support (does the evidence *directly* assert the premise, or does it require interpretation?)

Confidence dimension: `evidence_linkage: float` — how confident the pipeline is that this specific piece of evidence supports this specific premise (as opposed to a nearby but different claim)

### Outputs
- Argument records:
```
{
  argument_id,
  conclusion: claim_atom_ref,
  premises: [{ claim_atom_ref, isImplicit, reconstruction_confidence }],
  warrant: { text, isImplicit, reconstruction_confidence } | null,
  scheme: { key, name, critical_questions[] },
  evidence_links: [{ evidence_ref, premise_ref, evidence_type, directness }],
  confidence_profile: {
    inference_detection,
    implicit_premise_reconstruction,
    warrant_reconstruction,
    scheme_classification,
    evidence_linkage,
    composite  // weighted aggregate, but always presented alongside components
  }
}
```

---

## 5. Stage 4: Deliberation-Base Assembly

### Purpose
Organize reconstructed arguments into deliberation structures by identifying dialectical relationships (attack, support, rebuttal) and clustering arguments around shared topics and claims.

### Inputs
- Reconstructed argument records from Stage 3
- Existing deliberation base (for integration with previously extracted and/or human-authored arguments)

### Processing

#### 5.1 Cross-Source Claim Alignment
When arguments from different sources share claims (same or semantically equivalent conclusions, premises, or targets), align them:
- Use MOID matching for exact duplicates
- Use embedding similarity for semantic near-matches, with human review for borderline cases
- Distinguish between: same claim asserted independently (convergent support), same claim cited from a common source (shared evidence), and near-similar claims that differ in important ways (do not merge)

#### 5.2 Dialectical Relation Detection
Identify attack and support relations between arguments:
- **Direct rebuttal**: Argument B concludes with the negation of Argument A's conclusion
- **Undercutting attack**: Argument B attacks the inferential link (warrant) of Argument A without directly negating its conclusion
- **Premise attack**: Argument B concludes with the negation of one of Argument A's premises
- **Support/reinforcement**: Argument B's conclusion strengthens or provides additional evidence for a premise or conclusion in Argument A
- **Critical question response**: Argument B answers one of the open critical questions generated by Argument A's scheme classification

Confidence dimension: `relation_detection: float` — how confident the pipeline is in the identified dialectical relation. Misclassifying an attack as a support (or vice versa) would corrupt the deliberation structure, so the threshold for asserting relations should be high.

#### 5.3 Deliberation Routing & Clustering
Group arguments into deliberation structures by topic/question:
- Identify the central contested claims (claims that appear as conclusions in some arguments and are attacked by others)
- Cluster arguments around these contested claims
- Route to existing deliberations if the contested claim already has an active deliberation, or create a new deliberation seed if not

#### 5.4 Standing Initialization
For newly assembled deliberation clusters:
- Set standing scores based on the structural properties of the extracted arguments (evidence count, critical questions answered, attack/support ratio)
- Mark all standings as `source: extraction_pipeline` to distinguish from standings that emerge from live dialectical interaction
- Set all standing states to `untested-default` or `untested-supported` — extraction alone should never produce a `tested-survived` or `tested-attacked` state, since no actual dialectical testing has occurred

### Outputs
- Deliberation records with argument nodes, dialectical edges, and initialized standing scores
- Orphan arguments (extracted arguments that don't yet connect to any deliberation) flagged for manual routing

---

## 6. Stage 5: Human-in-the-Loop Validation

### Purpose
Validate, correct, and enrich pipeline outputs; recalibrate the pipeline's confidence model.

### Design Principles
- Validation is a **separate epistemic layer** from extraction. The representation distinguishes between `extraction_confidence` (pipeline's self-assessment) and `validation_status` (human judgment).
- Human attention is a scarce resource. The system must triage effectively.
- Validation data feeds back into the pipeline's confidence calibration model.

### Validation Workflow

#### 6.1 Triage Queue
The system generates a priority-ordered validation queue based on:

1. **Impact**: Arguments in active or high-traffic deliberations are prioritized over orphans
2. **Confidence band**: Medium-confidence extractions (roughly 0.4–0.7 composite) are prioritized over high-confidence (less likely to be wrong) and low-confidence (more likely to need full manual reconstruction rather than validation)
3. **Error-type risk**: Warrant reconstructions and scheme classifications are prioritized over claim boundary detection (because errors in warrants and schemes propagate more damagingly through the deliberation structure)
4. **Novelty**: Arguments introducing claims or relations not already present in the deliberation base are prioritized (because they're extending the frontier of the knowledge base and there's no existing structure to sanity-check them against)

> **Phase-Dependent Priority Weighting**
>
> These four dimensions are well-chosen but their relative weighting should shift across the platform's lifecycle:
>
> - **During bootstrap**, **novelty should dominate.** The goal is to build out the frontier of the deliberation base. Validating an argument that extends coverage into an unrepresented area is more valuable than polishing a high-confidence argument in a well-populated deliberation. Impact scoring is necessarily low during bootstrap because traffic is sparse.
> - **At steady state**, **impact should dominate.** Reviewer attention should go where users are actually engaging — errors in high-traffic deliberations are the ones most likely to mislead real consumers and most likely to generate downstream dialectical confusion.
> - **The transition** between these weighting regimes should be driven by a coverage metric (e.g., percentage of active deliberations that have at least one human-validated argument on each side of the central contested claim). Once coverage crosses a threshold, the weighting shifts from novelty-dominant to impact-dominant. This transition should be designed explicitly rather than left to emerge.

#### 6.2 Validation Interface
Reviewers see:
- The reconstructed argument (premises, warrant, conclusion, scheme, evidence links)
- The original source text with the relevant passages highlighted
- The pipeline's per-stage confidence scores
- Near-duplicate candidates (for claim dedup validation)
- Proposed dialectical relations (for relation validation)

Reviewers can:
- **Affirm**: Mark a specific component as correct. This sets `validation_status: affirmed` on that component.
- **Correct**: Edit a claim's canonical text, reassign a scheme, fix a premise-conclusion link, merge or split claims, add or remove implicit premises. This sets `validation_status: corrected` and stores the diff.
- **Reject**: Mark a component as incorrectly extracted (e.g., a non-claim extracted as a claim, a wrong scheme classification). This sets `validation_status: rejected`.
- **Escalate**: Flag for domain expert review (e.g., when the reviewer isn't confident they have the domain knowledge to assess whether a warrant reconstruction is correct).

#### 6.3 Validation Status Representation
Every extractable component carries a validation record:

```
validation: {
  status: 'unreviewed' | 'affirmed' | 'corrected' | 'rejected' | 'escalated',
  reviewer_id: string | null,
  reviewed_at: timestamp | null,
  correction_diff: object | null,   // if corrected, what changed
  reviewer_confidence: float | null  // reviewer's self-assessed confidence in their judgment
}
```

This is **separate from and parallel to** the extraction confidence profile. Consumers (including LLMs) see both:
- `extraction_confidence.warrant_reconstruction: 0.45` — the pipeline isn't sure about this warrant
- `validation.status: 'affirmed'` — but a human reviewer confirmed it

Or conversely:
- `extraction_confidence.scheme_classification: 0.88` — the pipeline is quite confident about the scheme
- `validation.status: 'corrected'` — but a human reviewer reclassified it

Both signals are informative. Neither supersedes the other entirely (a human reviewer can be wrong too, but their judgment carries a different kind of epistemic weight than a model's self-assessment).

#### 6.4 Calibration Feedback Loop
Validation decisions are fed back into the pipeline's confidence model:

- **Calibration assessment**: Periodically compare the pipeline's confidence scores against validation outcomes. Is the pipeline well-calibrated? (When it says 0.7, is it correct ~70% of the time?) If not, recalibrate.
- **Per-stage calibration**: Different stages may be differently calibrated. The pipeline might be overconfident on scheme classification and underconfident on claim boundary detection. Per-stage calibration curves allow fine-grained recalibration.
- **Error pattern detection**: Identify systematic error patterns (e.g., the pipeline consistently misclassifies practical reasoning as causal reasoning, or consistently fails to detect implicit normative premises in policy documents). These patterns feed back as targeted improvements to the extraction heuristics.
- **Genre-specific calibration**: Different source types may require different calibration profiles. The pipeline might perform well on structured empirical papers and poorly on discursive opinion essays. Genre-specific calibration allows the confidence scores to reflect this.

---

## 7. Cross-Cutting Concerns

### 7.1 Provenance Chain
Every artifact in the system — from raw source text to assembled deliberation — should carry a complete provenance chain:
- Source document → content hash → archived URL
- Claim atom → source paragraph hash → extraction confidence → validation status
- Argument → constituent claim atoms → scheme classification → evidence links → validation status
- Deliberation → constituent arguments → dialectical relations → standing initialization

This chain is what makes the system auditable. An LLM consuming an argument from the deliberation base should be able to trace any claim back to the specific passage in the specific source that gave rise to it, and to see exactly how confident the pipeline was in each step of the reconstruction, and whether a human has reviewed it.

### 7.2 Versioning & Immutability
- Claim atoms, once created with a MOID, are immutable. Corrections create new versions with new MOIDs, linked to the old version.
- Arguments are versioned. Edits (human or pipeline) create new versions; old versions remain accessible via content-hash permalinks.
- Validation records are append-only. A correction doesn't erase the original extraction; it layers a new judgment on top.

### 7.3 Consumer Interface for LLMs
The deliberation base should expose a query interface that allows LLMs to:
- Search by topic/claim and retrieve structured argument graphs
- Filter by confidence thresholds (e.g., "only show me arguments where all components have extraction confidence > 0.6 or have been human-validated")
- Access compositional confidence profiles per argument and per component
- Distinguish between extraction-derived standing scores and dialectically-derived standing scores
- Retrieve the provenance chain for any claim or evidence link

### 7.4 Bootstrap Phase vs. Steady State
During bootstrap:
- All extraction-derived arguments are clearly marked as `source: extraction_pipeline`
- Standing states are initialized conservatively (no `tested-*` states from extraction alone)
- The human validation queue is the primary quality-control mechanism
- Calibration feedback runs frequently (weekly or per-batch) as the pipeline improves

At steady state:
- Human-authored arguments coexist with extraction-derived arguments in the same deliberation structures
- Extraction-derived arguments that have been validated and dialectically tested are indistinguishable in standing from human-authored arguments
- The pipeline continues to ingest new sources, but with a well-calibrated confidence model and lower need for human validation of routine extractions
- Human attention shifts from validation-of-extraction to dialectical participation (attacking, supporting, answering critical questions)

### 7.4.1 Intermediate Pathology: The "Sophisticated Corpse" Risk

There is a failure mode between bootstrap and steady state that this architecture must actively guard against. The pipeline generates a dense, structurally well-formed deliberation base. LLMs synthesize it fluently for consumers via the MCP surface. Humans *never show up to do the dialectical work.* In that scenario, the platform fills with `untested-default` arguments bearing high extraction confidence, consumed by LLMs that present them as if they represent substantive positions in a real debate — when in fact no debate ever happened.

The standing labels would be technically honest ("untested"). But the volume and structural polish of the extraction-derived content would create an impression of a living deliberation that is actually a machine's reconstruction of what reasoning looks like, sitting in amber. This is the AI-seeding risk identified in the MCP stress test (see Section 9, item 5), scaled up by an order of magnitude: the pipeline doesn't just seed a few arguments where stubs exist — it potentially fills the entire deliberation base with machine-reconstructed positions that have never been tested by anyone.

This risk implies two design requirements:

1. **Pipeline success metrics must include downstream dialectical engagement.** Extraction quality (calibration scores, validation pass rates) is necessary but not sufficient. If the pipeline extracts a thousand arguments and none of them ever get attacked, supported, or have their critical questions answered by a human, the pipeline has failed — regardless of how well-calibrated its confidence scores are. Track: arguments-with-human-engagement / total-extracted-arguments, per deliberation and aggregate.

2. **Content presentation should differentiate extraction density from deliberation depth.** The consumer interface (both UI and MCP/API) should make it visually and structurally obvious when a deliberation is populated entirely by extraction-derived, untested arguments versus when it contains genuine dialectical interaction. A deliberation with twenty `untested-default` arguments is not "richer" than one with three `tested-survived` arguments — it's just more thoroughly indexed. The presentation layer must not reward extraction volume over dialectical substance.

### 7.4.2 Materials Library as Bootstrap Strategy

The bootstrap-to-steady-state transition may be better served by an alternative framing of the pipeline's initial role: rather than producing *finished arguments* for humans to *validate*, produce *structured materials* for humans to *build with*.

Concretely, this means deploying Stages 1–2 (source ingestion, claim extraction) and the evidence-linkage component of Stage 3 (section 4.4) first, while deferring full argument reconstruction (sections 4.1–4.3) and deliberation-base assembly (Stage 4). The result is a **materials library**: a structured corpus of claims, evidence passages, and source metadata that human authors can assemble into arguments using the platform's existing argument-authoring interface.

This reframes the human role from **reviewer** (auditing someone else's reconstruction) to **author** (building an argument from good materials). Authoring is more engaging than auditing, produces higher-quality arguments (because the human understands the inferential structure they're building rather than checking someone else's), and generates genuine dialectical engagement from the start — which is the metric that actually matters for the platform's epistemic health.

The full pipeline as described in Stages 3–4 remains the right long-term architecture. But the materials-library mode is a viable and potentially superior path through the bootstrap phase, where the risk of producing polished-but-untested content is highest and the incentive to shift human attention toward authorship (rather than review) is strongest.

See Section 9 (Phased Implementation Roadmap) for the recommended build order.

---

## 8. Component Summary

| Stage | Primary Output | Key Confidence Dimensions | Failure Mode to Guard Against |
|---|---|---|---|
| Source Ingestion | Normalized, content-hashed, archived corpus | `source_accessibility`, `format_fidelity` | Incomplete text extraction, broken archival links |
| Claim Extraction | Canonical claim atoms with MOIDs | `claim_boundary`, `normalization_fidelity`, `dedup_distinctness`, `claim_typing` | Premature claim merging, splitting compound claims incorrectly |
| Argument Reconstruction | Scheme-annotated premise→conclusion structures | `inference_detection`, `implicit_premise_reconstruction`, `warrant_reconstruction`, `scheme_classification`, `evidence_linkage` | Wrong warrant reconstruction, wrong scheme (→ wrong critical questions) |
| Deliberation-Base Assembly | Deliberation graphs with dialectical edges | `relation_detection` | Misclassifying attack as support (or vice versa), false claim alignment |
| Human Validation | Validated/corrected argument records | `validation_status`, `reviewer_confidence` | Reviewer error, insufficient domain expertise, triage failures |
| Calibration Loop | Updated confidence model | Per-stage calibration curves | Systematic miscalibration undetected |

---

## 9. Phased Implementation Roadmap

The full pipeline architecture described in Sections 2–6 is the correct long-term design. However, the bootstrap phase presents specific risks (the "sophisticated corpse" pathology in Section 7.4.1, the warrant reconstruction circularity in Section 4.2, the dedup scaling problem in Section 3.2) that favor a phased approach. The following phases are ordered by implementation priority, risk profile, and dependency structure.

### Phase 1: Source Ingestion + Claim Extraction (Materials Library)

**Build:** Stages 1–2 in full, plus Evidence-Premise Linkage (Section 4.4) from Stage 3.

**Defer:** Premise-conclusion relation detection (4.1), implicit premise & warrant reconstruction (4.2), scheme classification (4.3), full deliberation-base assembly (Stage 4).

**What this produces:** A structured corpus of canonical claim atoms, evidence passages with source provenance, and domain-tagged metadata — a **materials library** that human authors can draw from when composing arguments on the platform. Claims surface as suggested building blocks in the argument-authoring interface; evidence passages surface as citable, provenance-tracked support material.

**Why this order:**
- Stages 1–2 are relatively well-understood NLP problems with manageable error rates and well-calibrated confidence models
- The materials library shifts humans from the reviewer role (auditing machine reconstructions) to the author role (building arguments from good materials), which is both more engaging and more likely to generate genuine dialectical participation
- Validation bandwidth during this phase focuses on claim dedup and typing accuracy, which are simpler review tasks than full argument reconstruction audits
- This phase generates calibration data for Stage 3 (what kinds of claims appear in which source genres, how reliable is the typing, where does dedup fail) without the risk of producing plausible-but-wrong argument structures

**Success metrics:** Claim extraction precision/recall (via sampled validation), dedup accuracy, materials-library usage rate (are human authors actually using extracted claims/evidence when composing arguments?).

### Phase 2: Scheme Classification + Critical Question Generation

**Build:** Scheme classification (Section 4.3) and the critical question generation system. Apply to *existing human-authored arguments* first, then to newly extracted material.

**Defer:** Warrant reconstruction (Section 4.2), full premise-conclusion relation detection for extraction (Section 4.1).

**Why this order:**
- Scheme classification applied to human-authored arguments is lower risk than applied to machine-reconstructed ones — the argument structure is already correct, the pipeline is just labeling it
- This phase delivers the unanswered-CQ feature (item 2 from the MCP stress test — see Section 10) which has high user-facing value: every argument on the platform gets a visible checklist of what would strengthen or weaken it
- Calibration of scheme classification on human-authored arguments produces training signal for the more difficult task of classifying extraction-derived arguments in Phase 3
- Avoids the scheme-warrant circularity problem (Section 4.2) by not attempting warrant reconstruction at all in this phase

**Success metrics:** Scheme classification accuracy (validated against human judgment on existing arguments), critical question coverage (percentage of arguments with at least one CQ answered), user engagement with CQ prompts (do surfaced CQs lead to new argument submissions?).

### Phase 3: Premise-Conclusion Detection + Deliberation Assembly

**Build:** Premise-conclusion relation detection (Section 4.1), dialectical relation detection (Section 5.2), deliberation routing & clustering (Section 5.3), standing initialization (Section 5.4).

**Defer:** Warrant reconstruction (Section 4.2) remains deferred; warrants are left as typed gaps.

**Why this order:**
- By this phase, the pipeline has well-calibrated claim extraction (Phase 1) and scheme classification (Phase 2), which constrain and inform premise-conclusion detection
- The deliberation-base assembly components (Stage 4) can now operate on a mix of human-authored and extraction-derived arguments, with the human-authored arguments providing structural scaffolding that the extraction-derived ones integrate into
- Standing initialization is conservative (untested-default only), and the participation-depth annotations (item 3 from the MCP stress test) make the provenance and testing status legible to consumers

**Success metrics:** Inference detection precision (validated via sampled review), relation detection accuracy, false-merge rate in cross-source claim alignment, and — critically — downstream dialectical engagement rate on extraction-derived arguments.

### Phase 4: Warrant Reconstruction (Full Pipeline)

**Build:** Implicit premise & warrant reconstruction (Section 4.2), with the circularity-aware approach described in the warning note.

**Prerequisites:** Well-calibrated scheme classification (Phase 2), stable premise-conclusion detection (Phase 3), sufficient validation infrastructure to handle the additional review load.

**Why last:**
- Warrant reconstruction is the highest-risk, lowest-marginal-payoff component during bootstrap
- Critical questions (delivered in Phase 2) already do most of the work that explicit warrants would do
- By this phase, the pipeline has enough calibration history to know where warrant reconstruction is likely to succeed (which scheme types, which source genres) and where it should leave typed gaps

**Success metrics:** Warrant reconstruction accuracy (validated against human judgment), reduction in typed-gap rate for high-confidence scheme classifications, minimal increase in validation rejection rate.

---

## 10. MCP Stress Test Integration Items

The following items were identified through an MCP integration stress test (LLM-mediated consumption of Isonomia's deliberation base via the MCP tool surface). They represent platform improvements surfaced by the experience of an LLM consumer encountering the existing data model and identifying where it under-serves both machine and human consumers. Items are ordered by implementation priority and dependency structure.

### 10.1 Fitness Score Decomposition in MCP/API Responses

**Status:** Not yet implemented
**Pipeline dependency:** None (existing platform feature, independent of extraction pipeline)

The dialectical fitness score currently arrives as an opaque scalar. Decompose it into its component dimensions (answered CQs, evidence count with provenance, support weight, open attack weight) in MCP and API responses. This makes the platform's epistemic claim *checkable* — an LLM consumer can show its work when reporting fitness, and downstream UIs can render component bars rather than a single number.

### 10.2 Unanswered Critical Questions as First-Class Structured Data

**Status:** Not yet implemented
**Pipeline dependency:** Phase 2 (scheme classification + CQ generation)

Each ASPIC+ scheme carries a critical question list. Expose which CQs are answered and which remain open as structured data in the argument record, the MCP search response, and the API. This transforms stubs from "TODO" into a concrete, scheme-grounded invitation — both for human contributors (who see a checklist of what would strengthen or weaken an argument) and for LLM consumers (who can report the argument's vulnerability surface rather than inferring absences). This is the single highest-value intersection between the extraction pipeline and the MCP surface: the pipeline generates CQ sets during scheme classification (Phase 2), and the MCP surface exposes them as actionable structure.

### 10.3 Standing Labels Annotated with Participation Depth

**Status:** Not yet implemented
**Pipeline dependency:** None (existing platform feature)

Annotate standing labels with participation metadata: `tested-survived (3 challengers, 1 domain expert reviewer)` rather than bare `tested-survived`. This directly addresses the cold-start honesty problem identified in the stress test. The standing system's epistemic value is conditional on participation density; without depth annotations, the labels have the *form* of a strong epistemic signal without necessarily the *substance*. Sophisticated consumers (both human and LLM) will — and should — discount unannotated standing labels. This is the lowest-risk, highest-trust-building change on the list.

### 10.4 Topic-Level Debate Topology Endpoint

**Status:** Not yet implemented
**Pipeline dependency:** Phase 3 (deliberation-base assembly)

Expose a structured representation of the debate topology (central contested claims, supporting/attacking argument clusters, scheme distribution, dialectical layer structure) as a query endpoint. Currently, consumers must reconstruct this topology from edges — the stress test showed an LLM correctly identifying a three-layer architecture (empirical / policy-bridge / policy-attack) from the graph structure, but only because it performed the interpretive work.

**Design caution:** Expose the graph structure (attack/support relations, scheme types, claim clusters) and let consumers derive the topology, rather than asserting what the layers are. The three-layer reading identified in the stress test was an *interpretation*, not a retrieval. Baking one interpretation into the endpoint risks ossifying a reading of a debate that could be structured differently by different consumers. The endpoint should make reconstruction trivial without prescribing the result.

### 10.5 AI-Authored Arguments with First-Class Provenance

**Status:** Not yet implemented
**Pipeline dependency:** Phase 1+ (can begin with materials library, deepens with full pipeline)

This is the primary cold-start mitigation item. AI-authored arguments enter the deliberation base at `untested-default` and stay there until a human engages. The existing standing machinery prevents AI-authored content from inflating the dialectical record — no special-case logic needed.

**Perception risk:** If early users arrive and find the debate is mostly AI-seeded, the platform reads as "a place where an AI had a debate with itself." Mitigations: (a) clearly label AI-authored arguments with `source: ai_authored` provenance, (b) prioritize AI-seeding where articulation gaps are most visible (stubs, unanswered CQs) rather than at scale, (c) track and surface the ratio of human-authored to AI-authored arguments per deliberation, (d) ensure the materials-library mode (Phase 1) is available so that users who prefer to build from extracted materials rather than encounter finished AI arguments have that option.

### 10.6 Scheme-Typed Query Primitive

**Status:** Not yet implemented
**Pipeline dependency:** Phase 2 (scheme classification)

Make scheme labels load-bearing for search and retrieval. Currently scheme labels are display-only metadata; making them a query filter (e.g., "show me all expert-opinion arguments in this deliberation," "find causal-reasoning arguments that attack this claim") encourages LLM consumers to reason scheme-by-scheme rather than flattening the debate into undifferentiated prose. This also enables the CQ system (item 10.2) to work as a retrieval pathway: "find arguments where CQ 3 of the cause-to-effect scheme is unanswered."

### 10.7 Structured Citation Provenance Pass-Through

**Status:** Not yet implemented
**Pipeline dependency:** Phase 1 (source ingestion provides the provenance chain)

Make each evidence citation a structured object in the MCP/API response (source title, author, publication date, archived URL, content hash, paragraph hash, evidence type) rather than embedding provenance in prose. This lets LLM consumers quote with machine-readable attribution and lets downstream UIs render proper citation chips. Trivial to implement given that Stage 1 of the extraction pipeline already produces the necessary content-hashed, archived provenance chain. Large credibility multiplier for minimal engineering cost.