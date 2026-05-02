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