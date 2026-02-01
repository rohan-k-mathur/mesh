# THESIS BRIEF: In Defense of Academic Agora

## Meta-Documentation

**Document Type**: Thesis (Legal-Style Brief)  
**Deliberation**: Platform Self-Justification — Academic Use Case  
**Release Version**: v1.0.0  
**Status**: DEFENDED (subject to challenge)  
**Author**: Platform Development Team  
**Date**: January 2026

---

## Central Thesis

**THESIS-001**: *Academic Agora should exist and be developed as infrastructure for scholarly discourse—transforming academic debate from papers-as-PDFs to papers-as-debatable, composable claim graphs.*

**Thesis Type**: Practical (action-guiding)  
**Status**: IN (grounded extension)

This thesis is supported by six primary prongs, each of which is itself a defended claim supported by structured arguments.

---

## Table of Contents

1. [Prong I: The Scholarly Discourse Deficit](#prong-i-the-scholarly-discourse-deficit)
2. [Prong II: Infrastructure Adequacy](#prong-ii-infrastructure-adequacy)
3. [Prong III: Natural Disciplinary Fit](#prong-iii-natural-disciplinary-fit)
4. [Prong IV: Theory of Change](#prong-iv-theory-of-change)
5. [Prong V: Risk Assessment](#prong-v-risk-assessment)
6. [Prong VI: Alternative Comparison](#prong-vi-alternative-comparison)
7. [Commitment Store](#commitment-store)
8. [Attack Register](#attack-register)
9. [Synthesis & Conclusion](#synthesis--conclusion)

---

## Prong I: The Scholarly Discourse Deficit

### Claim C-101

> **Academic discourse lacks infrastructure for sustained, structured public engagement with research.**

**Claim ID**: C-101  
**Status**: IN  
**Confidence**: 0.90  
**Type**: Empirical/Descriptive

---

### Argument A-101: Argument from Sign (Infrastructure Absence)

**Scheme**: Argument from Sign (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-101                                                      │
│ Scheme: Argument from Sign                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Sustained scholarly discourse requires:                         │
│     (a) Claim-level engagement (not just paper-level)               │
│     (b) Typed dialogue moves (not just comments)                    │
│     (c) Persistent record (not ephemeral threads)                   │
│     (d) Attribution and accountability                              │
│     (e) Cross-paper synthesis                                       │
│     (f) Generative (not just reactive) discussion                   │
│     [Evidence: E-101a - derived from scholarly communication        │
│      literature; Borgman, Scholarly Communication (2007)]           │
│                                                                     │
│ P2: Current platforms provide:                                      │
│     - PubPeer: Paper-level comments, reactive/critical focus        │
│     - Hypothesis: Scattered annotations, no threading               │
│     - OpenReview: Conference-bounded, time-limited                  │
│     - Twitter/X: Ephemeral, unstructured, toxic dynamics            │
│     - ResearchGate: Gamified, noisy, not structured                 │
│     - Email: Private, high friction, no public record               │
│     [Evidence: E-101b - Platform documentation and analysis]        │
│                                                                     │
│ P3: The absence of (a)-(f) in available platforms is a reliable     │
│     sign that infrastructure for scholarly discourse is missing     │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Infrastructure for sustained scholarly discourse is absent       │
│                                                                     │
│ RA-Node: Inference via Sign                                         │
│ Confidence: 0.90                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-101

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | What is the strength of the correlation? | ANSWERED | Requirements derived from scholarly communication research; platforms demonstrably lack features |
| CQ2 | Are there other explanations? | ANSWERED | Gap exists because no one has built for sustained intellectual exchange; not technical impossibility |
| CQ3 | Is there counter-evidence? | CHALLENGED | See Attack ATK-101 |

---

### Attack ATK-101: Peer Review Counter-Example

**Attack Type**: REBUT (presents contrary evidence)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ATTACK ATK-101                                                      │
│ Type: REBUT                                                         │
│ Target: C-101 (conclusion)                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ATTACKING CLAIM:                                                    │
│                                                                     │
│ Peer review already provides structured engagement with research.   │
│ Journals facilitate expert evaluation and dialogue (via revisions   │
│ and responses). Traditional academic discourse infrastructure       │
│ exists—it's called the publishing system.                           │
│                                                                     │
│ CA-Node: Conflict Application (rebut)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Defense D-101: Peer Review Limitations

**Move Type**: GROUNDS  
**Status**: DEFENDED

```
┌─────────────────────────────────────────────────────────────────────┐
│ DEFENSE D-101                                                       │
│ Type: GROUNDS (response to REBUT)                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. Peer review provides evaluation, not discourse:                  │
│    - Private (not public record)                                    │
│    - One-shot (typically 2-3 reviews, then done)                    │
│    - Pre-publication only (no ongoing engagement)                   │
│    - Gatekeeping function, not dialogue function                    │
│    [Evidence: E-D101a - Fyfe et al., "History of Peer Review"       │
│     (2017)]                                                         │
│                                                                     │
│ 2. Peer review operates at paper-level, not claim-level:            │
│    - Cannot engage with specific assertions                         │
│    - Cannot build on prior reviews                                  │
│    - No structured argument types                                   │
│                                                                     │
│ 3. Published responses are rare and slow:                           │
│    - "Comments" and "Replies" take months/years                     │
│    - High bar for publication                                       │
│    - No synthesis or accumulation                                   │
│                                                                     │
│ 4. C-101 should be clarified: peer review exists but is NOT         │
│    infrastructure for sustained PUBLIC discourse.                   │
│                                                                     │
│ ATTACK FORCE: Reduced; peer review serves different function        │
│ REVISED CONFIDENCE: 0.90 (maintained with clarification)            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Claim C-102

> **The discourse deficit has measurable consequences for scholarly knowledge production.**

**Claim ID**: C-102  
**Status**: IN  
**Confidence**: 0.85  
**Type**: Empirical/Causal

---

### Argument A-102: Argument from Cause to Effect

**Scheme**: Argument from Cause to Effect (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-102                                                      │
│ Scheme: Argument from Cause to Effect                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Without structured public discourse, debates repeat across      │
│     decades without resolution or synthesis                         │
│     [Evidence: E-102a - Recurrence of "same debates" in HSS         │
│      documented by disciplinary historians]                         │
│                                                                     │
│ P2: Without claim-level engagement, scholars talk past each other   │
│     and misrepresent positions                                      │
│     [Evidence: E-102b - Citation analysis showing frequent          │
│      misattribution; straw-man prevalence in philosophy]            │
│                                                                     │
│ P3: Without persistent record, intellectual labor is lost:          │
│     - Conference Q&A evaporates                                     │
│     - Email exchanges remain private                                │
│     - Blog posts scatter and decay                                  │
│     [Evidence: E-102c - Knowledge attrition studies]                │
│                                                                     │
│ P4: Without cross-paper synthesis, literature reviews are           │
│     heroic individual efforts rather than cumulative resources      │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: The discourse deficit causes knowledge production inefficiency   │
│    and intellectual labor waste                                     │
│                                                                     │
│ RA-Node: Causal inference                                           │
│ Confidence: 0.85                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-102

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Is there a causal mechanism? | ANSWERED | Mechanism: absent infrastructure → impossible behaviors → negative outcomes |
| CQ2 | Is the cause sufficient? | QUALIFIED | Infrastructure is contributing cause; other factors (incentives, time) also matter |
| CQ3 | Are there intervening factors? | ANSWERED | Yes (academic incentives, time constraints), but infrastructure is independent contributor |
| CQ4 | Is there counter-evidence? | OPEN | No direct challenge registered |

---

### Claim C-103

> **Historical analysis reveals a missing layer in scholarly infrastructure evolution.**

**Claim ID**: C-103  
**Status**: IN  
**Confidence**: 0.80  
**Type**: Historical/Theoretical

---

### Argument A-103: Argument from Historical Pattern

**Scheme**: Argument from Precedent (Walton) — applied to infrastructure evolution

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-103                                                      │
│ Scheme: Argument from Precedent (Infrastructure Evolution)          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Scholarly communication infrastructure has evolved through      │
│     identifiable layers:                                            │
│                                                                     │
│     1800s-1900s: Learned societies, correspondence, journals        │
│                  → Publication as unit of record                    │
│                                                                     │
│     1900s-2000s: Peer review, conferences, indexing                 │
│                  → Evaluation and discovery                         │
│                                                                     │
│     2000s-2020s: Preprints, OA, social media, annotation            │
│                  → Speed, access, informal commentary               │
│                                                                     │
│     [Evidence: E-103a - Shuttleworth (2016) on science periodicals; │
│      Royal Society historical work; BOAI declaration]               │
│                                                                     │
│ P2: Each layer addressed a scaling/coordination problem:            │
│     - Journal explosion → periodicals and disciplinary venues       │
│     - Information overload → citation indexing                      │
│     - Web era → repositories and identifiers (DOI/ORCID)            │
│     - Open science → data/workflow standards (FAIR)                 │
│     [Evidence: E-103b - Clarivate history; DOI handbook]            │
│                                                                     │
│ P3: The current problem—debates repeating, reasoning not            │
│     persisting, claims not addressable—has no layer addressing it   │
│                                                                     │
│ P4: By precedent, a new layer should emerge to address this gap     │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: A "claims/arguments as native first-class objects" layer is      │
│    the missing infrastructure that the evolutionary pattern         │
│    predicts                                                         │
│                                                                     │
│ RA-Node: Precedent-based inference                                  │
│ Confidence: 0.80                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-103

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Is the precedent genuinely similar? | ANSWERED | Each layer addressed coordination failure; current situation is coordination failure |
| CQ2 | Are there relevant differences? | CHALLENGED | See Attack ATK-103 |
| CQ3 | Is there a counter-precedent? | OPEN | No counter-precedent registered |

---

### Attack ATK-103: Disanalogy (Market Forces)

**Attack Type**: UNDERCUT

```
┌─────────────────────────────────────────────────────────────────────┐
│ ATTACK ATK-103                                                      │
│ Type: UNDERCUT                                                      │
│ Target: A-103 (analogy validity)                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ATTACKING CLAIM:                                                    │
│                                                                     │
│ Previous infrastructure layers (journals, DOIs, preprint servers)   │
│ emerged because they had clear business models or institutional     │
│ support. The "argument layer" has no obvious economic driver.       │
│ The historical pattern doesn't predict what will be BUILT, only     │
│ what is NEEDED. The analogy from need to emergence fails.           │
│                                                                     │
│ CA-Node: Conflict Application (undercut on analogy)                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Defense D-103: Need Establishes Warrant

**Move Type**: GROUNDS  
**Status**: DEFENDED

```
┌─────────────────────────────────────────────────────────────────────┐
│ DEFENSE D-103                                                       │
│ Type: GROUNDS                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. The attack correctly identifies that need ≠ automatic emergence. │
│                                                                     │
│ 2. However, the thesis is not "the layer will inevitably emerge"    │
│    but "Academic Agora SHOULD be built" (action-guiding).           │
│                                                                     │
│ 3. The historical pattern establishes:                              │
│    - The gap is real (need exists)                                  │
│    - Solutions to such gaps have historically succeeded             │
│    - The type of intervention (infrastructure layer) is appropriate │
│                                                                     │
│ 4. Business model concerns are addressed in Prong V (Risk).         │
│    Grant funding, institutional subscriptions, and federation       │
│    models have supported similar infrastructure (arXiv, ORCID).     │
│                                                                     │
│ ATTACK FORCE: Reduced; establishes warrant, not prediction          │
│ CONFIDENCE: Maintained at 0.80                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Prong I Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRONG I: THE SCHOLARLY DISCOURSE DEFICIT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Claims Established:                                                 │
│                                                                     │
│ C-101: Infrastructure for sustained discourse is absent      [IN]   │
│        └── A-101 (Argument from Sign)               Conf: 0.90      │
│            └── ATK-101 (Peer review exists)         [DEFENDED]      │
│                                                                     │
│ C-102: Deficit causes knowledge production inefficiency      [IN]   │
│        └── A-102 (Cause to Effect)                  Conf: 0.85      │
│            └── No undefended attacks                                │
│                                                                     │
│ C-103: Historical pattern predicts missing layer             [IN]   │
│        └── A-103 (Argument from Precedent)          Conf: 0.80      │
│            └── ATK-103 (Business model concern)     [DEFENDED]      │
│                                                                     │
│ PRONG CONCLUSION: Scholarly discourse deficit exists and     [IN]   │
│ a new infrastructure layer is warranted                             │
│                                                                     │
│ Aggregate Confidence: 0.85                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prong II: Infrastructure Adequacy

### Claim C-201

> **Academic Agora provides the architectural features necessary for structured scholarly discourse.**

**Claim ID**: C-201  
**Status**: IN  
**Confidence**: 0.90  
**Type**: Technical/Descriptive

---

### Argument A-201: Argument from Classification

**Scheme**: Argument from Classification (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-201                                                      │
│ Scheme: Argument from Classification                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Scholarly discourse infrastructure requires:                    │
│     (a) Claim-level addressability with stable URIs                 │
│     (b) Typed dialogue moves (ASSERT, CHALLENGE, DEFEND, EXTEND)    │
│     (c) Evidence linking with source specificity                    │
│     (d) Argumentation scheme support                                │
│     (e) Critical question generation                                │
│     (f) Commitment tracking                                         │
│     (g) Attack typing (REBUT, UNDERCUT, UNDERMINE)                  │
│     (h) Cross-paper/cross-deliberation synthesis                    │
│     (i) Versioned releases for citation                             │
│     [Evidence: E-201a - derived from C-101 requirements]            │
│                                                                     │
│ P2: Academic Agora implements:                                      │
│     (a) Canonical Claims with UUIDs via Claim model                 │
│     (b) PPD protocol with DialogueMove types                        │
│     (c) Evidence model with locators and DOI integration            │
│     (d) 60+ Walton schemes in ArgumentScheme system                 │
│     (e) Auto-generated CQs per scheme                               │
│     (f) CommitmentStore tracking per participant                    │
│     (g) CA-nodes with typed attack relations                        │
│     (h) Plexus architecture for cross-deliberation transport        │
│     (i) DebateRelease versioning with BibTeX export                 │
│     [Evidence: E-201b - System Architecture Document]               │
│                                                                     │
│ P3: Systems implementing (a)-(i) are instances of scholarly         │
│     discourse infrastructure                                        │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Academic Agora is an instance of scholarly discourse             │
│    infrastructure                                                   │
│                                                                     │
│ RA-Node: Classification inference                                   │
│ Confidence: 0.90                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-201

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Does Academic Agora actually have the properties? | ANSWERED | E-201b provides implementation evidence; properties verifiable in codebase |
| CQ2 | Is the classification appropriate? | ANSWERED | Classification derived from established requirements (P1) |
| CQ3 | Are there exceptions? | OPEN | Real-world scholarly adoption testing pending |

---

### Claim C-202

> **The platform implements theoretically sound argumentation frameworks validated by decades of research.**

**Claim ID**: C-202  
**Status**: IN  
**Confidence**: 0.90  
**Type**: Theoretical/Technical

---

### Argument A-202: Argument from Expert Consensus

**Scheme**: Argument from Expert Opinion (applied to academic consensus)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-202                                                      │
│ Scheme: Argument from Expert Opinion (Academic Consensus)           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: The computational argumentation research community has          │
│     developed formal frameworks for representing arguments          │
│     [Evidence: E-202a - COMMA conference series (2006-present);     │
│      Argument & Computation journal; 40+ years of research]         │
│                                                                     │
│ P2: Walton's argumentation schemes are the standard taxonomy        │
│     for argument patterns in informal logic                         │
│     [Evidence: E-202b - Walton, Reed & Macagno, Argumentation       │
│      Schemes (2008); 10,000+ citations]                             │
│                                                                     │
│ P3: AIF (Argument Interchange Format) is the standard ontology      │
│     for argument representation                                     │
│     [Evidence: E-202c - Chesñevar et al. (2006); Reed et al.        │
│      (2010); AIFdb international adoption]                          │
│                                                                     │
│ P4: ASPIC+ is the leading structured argumentation framework        │
│     [Evidence: E-202d - Prakken (2010); Modgil & Prakken (2018)]    │
│                                                                     │
│ P5: Academic Agora implements Walton schemes, AIF, and ASPIC+       │
│     [Evidence: E-202e - System Architecture Document]               │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Academic Agora's argumentation foundations are theoretically     │
│    sound and validated                                              │
│                                                                     │
│ RA-Node: Inference from academic consensus                          │
│ Confidence: 0.90                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-202

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Is there genuine expert consensus? | ANSWERED | AIF, ASPIC+, and Walton schemes are standard references with no competing paradigm |
| CQ2 | Is implementation faithful to theory? | ANSWERED | Architecture document shows direct mappings; AIF compliance verified |
| CQ3 | Does theoretical soundness imply practical utility? | CHALLENGED | See Attack ATK-202 |

---

### Attack ATK-202: Formal Methods Adoption Failure

**Attack Type**: UNDERCUT

```
┌─────────────────────────────────────────────────────────────────────┐
│ ATTACK ATK-202                                                      │
│ Type: UNDERCUT                                                      │
│ Target: A-202 (inference from theory to utility)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ATTACKING CLAIM:                                                    │
│                                                                     │
│ Formal argumentation theory has existed for decades but has NOT     │
│ been adopted by working scholars. Academics don't use argument      │
│ mapping software, don't learn formal schemes, and find such         │
│ tools cumbersome. Theoretical soundness doesn't translate to        │
│ practical adoption. The field's own track record undermines         │
│ the inference.                                                      │
│                                                                     │
│ CA-Node: Conflict Application (undercut)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Defense D-202: Progressive Formalization + HSS Fit

**Move Type**: GROUNDS  
**Status**: DEFENDED

```
┌─────────────────────────────────────────────────────────────────────┐
│ DEFENSE D-202                                                       │
│ Type: GROUNDS                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. The attack correctly identifies historical adoption failure.     │
│                                                                     │
│ 2. However, previous tools required users to learn formalism        │
│    BEFORE contributing. Academic Agora inverts this:                │
│                                                                     │
│    - Progressive formalization: start informal, add structure       │
│      incrementally as complexity warrants                           │
│    - Formal infrastructure underlies system but is not required     │
│      for basic participation                                        │
│    - Schemes generate critical questions automatically—users        │
│      benefit without mastering formal theory                        │
│                                                                     │
│ 3. HSS disciplines (see Prong III) are ALREADY argumentation-       │
│    based. The platform maps to existing practice rather than        │
│    imposing foreign formalism.                                      │
│                                                                     │
│ 4. Prior tools were standalone; Academic Agora integrates with      │
│    existing scholarly workflow (DOI linking, ORCID, reference       │
│    managers, PDF annotation).                                       │
│                                                                     │
│ ATTACK FORCE: Reduced; design addresses historical failure modes    │
│ CONFIDENCE: Maintained at 0.90                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Claim C-203

> **Academic-specific features address the unique requirements of scholarly discourse.**

**Claim ID**: C-203  
**Status**: IN  
**Confidence**: 0.85  
**Type**: Technical/Descriptive

---

### Argument A-203: Argument from Properties (Academic Features)

**Scheme**: Argument from Properties (specialized)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-203                                                      │
│ Scheme: Argument from Properties                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Scholarly discourse has unique requirements beyond general      │
│     deliberation:                                                   │
│     (a) Paper-to-claim extraction pipeline                          │
│     (b) DOI/ORCID integration for attribution                       │
│     (c) Quote nodes as first-class objects with interpretations     │
│     (d) Claim type classification (THESIS, INTERPRETIVE,            │
│         HISTORICAL, NORMATIVE, METHODOLOGICAL, EMPIRICAL)           │
│     (e) Fork/merge for exploring alternative readings               │
│     (f) BibTeX/RIS export for argument-level citation               │
│     (g) Release versioning for citable snapshots                    │
│                                                                     │
│ P2: Academic Agora implements all of (a)-(g):                       │
│     (a) PDF extraction + AI claim extraction pipeline               │
│     (b) Crossref/OpenAlex/ORCID integration                         │
│     (c) QuoteNode model with interpretation voting                  │
│     (d) ClaimType enum with HSS-specific categories                 │
│     (e) Fork/Merge system with typed fork purposes                  │
│     (f) BibTeX export for arguments and releases                    │
│     (g) DebateRelease versioning with semantic versioning           │
│     [Evidence: E-203 - System Architecture Document, Phase 2]       │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Academic Agora addresses unique scholarly requirements           │
│                                                                     │
│ RA-Node: Properties inference                                       │
│ Confidence: 0.85                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-203

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Are the properties actually implemented? | ANSWERED | Phase 2 complete per development roadmap |
| CQ2 | Are these the right properties? | ANSWERED | Derived from user research and disciplinary analysis |
| CQ3 | Are there missing properties? | OPEN | Ongoing development; Phase 3-4 adds more |

---

### Prong II Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRONG II: INFRASTRUCTURE ADEQUACY                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Claims Established:                                                 │
│                                                                     │
│ C-201: Platform provides necessary architectural features    [IN]   │
│        └── A-201 (Classification)                   Conf: 0.90      │
│            └── No undefended attacks                                │
│                                                                     │
│ C-202: Formal foundations are theoretically sound            [IN]   │
│        └── A-202 (Expert Consensus)                 Conf: 0.90      │
│            └── ATK-202 (Adoption failure history)   [DEFENDED]      │
│                                                                     │
│ C-203: Academic-specific features address unique needs       [IN]   │
│        └── A-203 (Properties)                       Conf: 0.85      │
│            └── No undefended attacks                                │
│                                                                     │
│ PRONG CONCLUSION: Academic Agora is adequate infrastructure  [IN]   │
│ for scholarly discourse                                             │
│                                                                     │
│ Aggregate Confidence: 0.88                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prong III: Natural Disciplinary Fit

### Claim C-301

> **Humanities and Social Sciences scholarship is already argumentation-based, making Academic Agora a natural fit.**

**Claim ID**: C-301  
**Status**: IN  
**Confidence**: 0.90  
**Type**: Descriptive/Disciplinary

---

### Argument A-301: Argument from Analogy (Practice Mapping)

**Scheme**: Argument from Analogy (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-301                                                      │
│ Scheme: Argument from Analogy                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: HSS scholarship core activities are:                            │
│     - Making interpretive claims about texts/events                 │
│     - Marshaling evidence (textual, archival, ethnographic)         │
│     - Responding to other scholars' interpretations                 │
│     - Defending positions against critique                          │
│     [Evidence: E-301a - Disciplinary self-descriptions;             │
│      graduate training curricula]                                   │
│                                                                     │
│ P2: Academic Agora core activities are:                             │
│     - Making claims with evidence linking                           │
│     - Constructing arguments using schemes                          │
│     - Responding via typed dialogue moves                           │
│     - Defending via GROUNDS moves against attacks                   │
│                                                                     │
│ P3: P1 and P2 describe the same activities with different           │
│     vocabulary                                                      │
│                                                                     │
│ P4: Tools that map directly to existing practice have lower         │
│     adoption barriers                                               │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Academic Agora maps directly to HSS practice, making it a        │
│    natural fit with low adoption barriers                           │
│                                                                     │
│ RA-Node: Analogical inference                                       │
│ Confidence: 0.90                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-301

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Are the similarities relevant? | ANSWERED | Core scholarly activities directly mapped |
| CQ2 | Are there relevant differences? | CHALLENGED | See Attack ATK-301 |
| CQ3 | Is the same relationship plausible? | ANSWERED | Platform vocabulary is scholarly vocabulary formalized |

---

### Attack ATK-301: STEM Exclusion

**Attack Type**: UNDERMINE

```
┌─────────────────────────────────────────────────────────────────────┐
│ ATTACK ATK-301                                                      │
│ Type: UNDERMINE                                                     │
│ Target: P1 (HSS focus undermines generality)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ATTACKING CLAIM:                                                    │
│                                                                     │
│ By focusing on HSS, the argument concedes that STEM disciplines     │
│ (with data, replication, quantitative methods) are NOT a natural    │
│ fit. This limits the platform to a minority of scholarship and      │
│ undermines claims of general scholarly infrastructure.              │
│                                                                     │
│ CA-Node: Conflict Application (undermine premise P1 scope)          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Defense D-301: HSS First, Not HSS Only

**Move Type**: GROUNDS  
**Status**: DEFENDED

```
┌─────────────────────────────────────────────────────────────────────┐
│ DEFENSE D-301                                                       │
│ Type: GROUNDS                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. The attack correctly identifies HSS-first strategy.              │
│                                                                     │
│ 2. HSS-first is a SEQUENCING choice, not a limitation:              │
│    - HSS has lower barriers (no data/replication infrastructure     │
│      required)                                                      │
│    - HSS practices map more directly to argumentation               │
│    - Success in HSS validates core infrastructure                   │
│                                                                     │
│ 3. STEM expansion is planned (Year 4+) after HSS validation:        │
│    - Add schemes for statistical inference, replication             │
│    - Integrate with data repositories                               │
│    - Support empirical claim verification                           │
│                                                                     │
│ 4. Even within STEM, theoretical/methodological debates are         │
│    argumentation-based (philosophy of science, methods disputes).   │
│                                                                     │
│ 5. C-301 should be scoped: "natural fit for HSS, with planned       │
│    expansion to STEM."                                              │
│                                                                     │
│ ATTACK FORCE: Reduced to scope clarification                        │
│ CONFIDENCE: Maintained at 0.90 for HSS fit specifically             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Claim C-302

> **HSS scholars have documented frustrations that the platform directly addresses.**

**Claim ID**: C-302  
**Status**: IN  
**Confidence**: 0.85  
**Type**: Empirical/Descriptive

---

### Argument A-302: Argument from Evidence (User Research)

**Scheme**: Argument from Evidence to Hypothesis (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-302                                                      │
│ Scheme: Argument from Evidence to Hypothesis                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: HSS scholars report specific frustrations:                      │
│                                                                     │
│     F1: "Slow publication cycles—years between submission and       │
│          response"                                                  │
│     F2: "Limited space for debate—journals rarely publish           │
│          responses"                                                 │
│     F3: "Scattered discussion—blog posts, Twitter threads,          │
│          conference Q&A"                                            │
│     F4: "No synthesis—same debates recur across decades without     │
│          resolution"                                                │
│     F5: "Invisible reasoning—published work shows conclusions,      │
│          not the path"                                              │
│     [Evidence: E-302a - User interviews; disciplinary commentary;   │
│      Crooked Timber meta-discussions]                               │
│                                                                     │
│ P2: Academic Agora addresses each frustration:                      │
│                                                                     │
│     F1 → Immediate engagement, no publication delay                 │
│     F2 → Unlimited space for structured dialogue                    │
│     F3 → Centralized, persistent, searchable record                 │
│     F4 → Versioned releases track resolution progress               │
│     F5 → Argument chains make reasoning visible                     │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Academic Agora addresses documented HSS scholar frustrations     │
│                                                                     │
│ RA-Node: Evidence-hypothesis inference                              │
│ Confidence: 0.85                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-302

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Is the evidence representative? | QUALIFIED | Based on available user research; larger studies needed |
| CQ2 | Are there alternative solutions? | ANSWERED | Alternatives address subsets; platform addresses all five |
| CQ3 | Will addressing frustrations drive adoption? | OPEN | Empirical validation pending |

---

### Claim C-303

> **Interpretive pluralism in HSS makes structured dialogue more valuable, not less.**

**Claim ID**: C-303  
**Status**: IN  
**Confidence**: 0.80  
**Type**: Theoretical

---

### Argument A-303: Argument from Consequences (Interpretive Pluralism)

**Scheme**: Argument from Consequences (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-303                                                      │
│ Scheme: Argument from Consequences                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: HSS disciplines accept interpretive pluralism: multiple valid   │
│     readings of texts, events, and social phenomena can coexist     │
│     [Evidence: E-303a - Disciplinary norms; hermeneutic tradition]  │
│                                                                     │
│ P2: In contexts of interpretive pluralism, unstructured discourse   │
│     produces:                                                       │
│     - Talking past each other                                       │
│     - Misrepresentation of positions                                │
│     - Inability to locate genuine disagreement vs. mere difference  │
│                                                                     │
│ P3: Structured discourse with:                                      │
│     - Explicit claim formulation                                    │
│     - Quote nodes with competing interpretations                    │
│     - Fork/merge for alternative readings                           │
│     - Commitment tracking                                           │
│     produces:                                                       │
│     - Clear articulation of different positions                     │
│     - Precise identification of where readings diverge              │
│     - Productive disagreement rather than miscommunication          │
│                                                                     │
│ P4: Producing P3 outcomes rather than P2 outcomes is beneficial     │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Structured discourse is especially valuable in contexts of       │
│    interpretive pluralism like HSS                                  │
│                                                                     │
│ RA-Node: Consequentialist inference                                 │
│ Confidence: 0.80                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-303

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Are the consequences accurately described? | ANSWERED | Derived from communication theory and disciplinary observation |
| CQ2 | Are there negative consequences? | CHALLENGED | See Attack ATK-303 |
| CQ3 | Are the consequences sufficient to justify the action? | ANSWERED | Enabling productive disagreement is substantial benefit |

---

### Attack ATK-303: Formalization Constrains Interpretation

**Attack Type**: REBUT

```
┌─────────────────────────────────────────────────────────────────────┐
│ ATTACK ATK-303                                                      │
│ Type: REBUT                                                         │
│ Target: C-303 (conclusion)                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ATTACKING CLAIM:                                                    │
│                                                                     │
│ Formalizing discourse may CONSTRAIN interpretive freedom. The       │
│ requirement to structure arguments into schemes, formulate          │
│ explicit claims, and respond to critical questions may exclude      │
│ modes of interpretation that resist formalization (poetic,          │
│ performative, deconstructive). HSS values cannot be captured in     │
│ formal structures.                                                  │
│                                                                     │
│ CA-Node: Conflict Application (rebut)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Defense D-303: Optional Formalization + Multiple Modes

**Move Type**: GROUNDS  
**Status**: DEFENDED

```
┌─────────────────────────────────────────────────────────────────────┐
│ DEFENSE D-303                                                       │
│ Type: GROUNDS                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. The attack identifies a genuine tension.                         │
│                                                                     │
│ 2. However, the platform is designed for OPTIONAL formalization:    │
│    - Informal discussion remains available indefinitely             │
│    - Formalization is a choice, not a requirement                   │
│    - Structure emerges when participants find it valuable           │
│                                                                     │
│ 3. Multiple contribution modes are supported:                       │
│    - Formal arguments via schemes                                   │
│    - Informal commentary via discussion threads                     │
│    - Quote interpretation voting                                    │
│    - Narrative/testimonial contributions                            │
│                                                                     │
│ 4. The platform claims to be valuable for SOME interpretive work,   │
│    not ALL. Deconstructive practice that resists formalization      │
│    can coexist outside the platform.                                │
│                                                                     │
│ 5. Many HSS scholars DO want structured engagement—the platform     │
│    serves them without forcing others.                              │
│                                                                     │
│ ATTACK FORCE: Reduced; formalization is optional, not mandatory     │
│ CONFIDENCE: Maintained at 0.80                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Prong III Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRONG III: NATURAL DISCIPLINARY FIT                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Claims Established:                                                 │
│                                                                     │
│ C-301: Platform maps directly to HSS practice               [IN]    │
│        └── A-301 (Analogy: Practice Mapping)        Conf: 0.90      │
│            └── ATK-301 (STEM exclusion)             [DEFENDED]      │
│                                                                     │
│ C-302: Platform addresses documented HSS frustrations       [IN]    │
│        └── A-302 (Evidence: User Research)          Conf: 0.85      │
│            └── No undefended attacks                                │
│                                                                     │
│ C-303: Structured discourse especially valuable for HSS     [IN]    │
│        └── A-303 (Consequences)                     Conf: 0.80      │
│            └── ATK-303 (Formalization constrains)   [DEFENDED]      │
│                                                                     │
│ PRONG CONCLUSION: HSS is natural fit for platform           [IN]    │
│                                                                     │
│ Aggregate Confidence: 0.85                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prong IV: Theory of Change

### Claim C-401

> **Making claims the atomic unit of discourse can transform scholarly knowledge production.**

**Claim ID**: C-401  
**Status**: IN  
**Confidence**: 0.75  
**Type**: Theoretical/Causal

---

### Argument A-401: Argument from Analogy (Citation Networks)

**Scheme**: Argument from Analogy (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-401                                                      │
│ Scheme: Argument from Analogy                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Citation networks transformed scholarly discovery:              │
│     - Before citation indexing: discovery via bibliography chains,  │
│       expert recommendation                                         │
│     - After citation indexing (1955-1964): discovery via forward/   │
│       backward citation traversal, impact measurement               │
│     [Evidence: E-401a - Garfield on citation indexing history;      │
│      Clarivate ISI history]                                         │
│                                                                     │
│ P2: The transformation occurred because citation made PAPERS        │
│     the networked unit: addressable, linkable, traversable          │
│                                                                     │
│ P3: Currently, claims/arguments are NOT the networked unit:         │
│     - Not addressable (no stable URIs)                              │
│     - Not linkable (embedded in prose)                              │
│     - Not traversable (no cross-paper argument graph)               │
│                                                                     │
│ P4: If papers-as-networked-unit transformed discovery, then         │
│     claims-as-networked-unit could transform discourse              │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Making claims the atomic unit can transform scholarly discourse  │
│    (by analogy to citation networks)                                │
│                                                                     │
│ RA-Node: Analogical inference                                       │
│ Confidence: 0.75                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-401

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Are the cases genuinely similar? | ANSWERED | Both involve making scholarly objects addressable/linkable |
| CQ2 | Are there relevant differences? | CHALLENGED | See Attack ATK-401 |
| CQ3 | Is the transformation beneficial? | ANSWERED | Discovery transformation was beneficial; discourse transformation would be analogously beneficial |

---

### Attack ATK-401: Claims Are Not As Stable As Papers

**Attack Type**: UNDERCUT

```
┌─────────────────────────────────────────────────────────────────────┐
│ ATTACK ATK-401                                                      │
│ Type: UNDERCUT                                                      │
│ Target: A-401 (analogy validity)                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ATTACKING CLAIM:                                                    │
│                                                                     │
│ Papers are stable, citable objects with clear boundaries. Claims    │
│ are fuzzy—they can be reformulated, interpreted differently,        │
│ paraphrased. Citation networks work because papers don't change.    │
│ Claim networks would be unstable, with boundary disputes and        │
│ reformulation problems. The analogy fails on a crucial dimension.   │
│                                                                     │
│ CA-Node: Conflict Application (undercut on disanalogy)              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Defense D-401: Canonical Claims + Versioning

**Move Type**: GROUNDS  
**Status**: DEFENDED

```
┌─────────────────────────────────────────────────────────────────────┐
│ DEFENSE D-401                                                       │
│ Type: GROUNDS                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. The attack identifies a real difference: claims are more fluid   │
│    than papers.                                                     │
│                                                                     │
│ 2. The platform addresses this through:                             │
│                                                                     │
│    - CANONICAL CLAIMS: Once formulated, a claim has a stable UUID.  │
│      The claim text is fixed; new formulations create new claims.   │
│                                                                     │
│    - VERSIONING: Claims can be versioned. Modifications create      │
│      new versions with tracked changes and provenance.              │
│                                                                     │
│    - CLAIM EQUIVALENCE: Phase 3 includes detection of "same claim   │
│      differently formulated" with cross-linking.                    │
│                                                                     │
│    - QUOTE ANCHORING: Claims can be anchored to specific passages,  │
│      reducing ambiguity about what's being asserted.                │
│                                                                     │
│ 3. Papers also have boundary problems (which claims in a paper      │
│    does a citation endorse?). Citation networks work despite this.  │
│                                                                     │
│ ATTACK FORCE: Reduced; design addresses stability concern           │
│ CONFIDENCE: Maintained at 0.75 (still uncertain)                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Claim C-402

> **Versioned releases enable cumulative knowledge production rather than repetitive debate.**

**Claim ID**: C-402  
**Status**: IN  
**Confidence**: 0.80  
**Type**: Functional/Descriptive

---

### Argument A-402: Argument from Mechanism (Accumulation)

**Scheme**: Argument from Cause to Effect (Mechanism)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-402                                                      │
│ Scheme: Argument from Cause to Effect (Mechanism)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Debates repeat because prior state is not preserved:            │
│     - Conference discussions evaporate                              │
│     - Blog posts scatter and decay                                  │
│     - No "state of the debate" document exists                      │
│     [Evidence: E-402a - Repeated debates in HSS; disciplinary       │
│      self-commentary on amnesia]                                    │
│                                                                     │
│ P2: DebateRelease versioning creates:                               │
│     - Stable snapshots (v1.0, v1.1, v2.0)                           │
│     - DEFENDED/CONTESTED/UNRESOLVED status per claim                │
│     - Changelogs showing what shifted between versions              │
│     - BibTeX citations for referencing specific states              │
│     [Evidence: E-402b - System Architecture Document]               │
│                                                                     │
│ P3: With versioned snapshots:                                       │
│     - New entrants can start from current state, not scratch        │
│     - Progress is visible (what was resolved since v1.0?)           │
│     - Regression is visible (what became contested again?)          │
│     - Citation creates accountability                               │
│                                                                     │
│ P4: This mechanism enables accumulation over repetition             │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Versioned releases enable cumulative rather than repetitive      │
│    knowledge production                                             │
│                                                                     │
│ RA-Node: Mechanism inference                                        │
│ Confidence: 0.80                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-402

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Is the mechanism plausible? | ANSWERED | Directly addresses identified cause of repetition |
| CQ2 | Are there countervailing factors? | ANSWERED | Incentives may still favor novelty over synthesis; platform can't change incentives directly |
| CQ3 | What is the expected effect size? | OPEN | Empirical validation pending |

---

### Claim C-403

> **Credit for argumentation contributions can shift scholarly incentives toward engagement.**

**Claim ID**: C-403  
**Status**: IN  
**Confidence**: 0.70  
**Type**: Causal/Predictive

---

### Argument A-403: Argument from Consequences (Incentive Redesign)

**Scheme**: Argument from Consequences (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-403                                                      │
│ Scheme: Argument from Consequences                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Current academic incentives reward publication, not engagement: │
│     - Authorship credit for papers                                  │
│     - No credit for challenging others' claims                      │
│     - No credit for defending under critique                        │
│     - No credit for synthesizing debates                            │
│     [Evidence: E-403a - Academic incentive literature;              │
│      Edwards & Roy (2017) on perverse incentives]                   │
│                                                                     │
│ P2: Academic Agora enables credit for argumentation contributions:  │
│     - Contribution metrics (claims curated, arguments made)         │
│     - Defense rate tracking                                         │
│     - Reviewer recognition for constructive critique                │
│     - ORCID integration for credit export                           │
│     - CV export for tenure committees                               │
│     [Evidence: E-403b - Phase 4 roadmap]                            │
│                                                                     │
│ P3: If engagement becomes creditable, scholars have incentive       │
│     to engage                                                       │
│                                                                     │
│ P4: Increased engagement improves discourse quality                 │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Crediting argumentation contributions can shift incentives       │
│    toward engagement                                                │
│                                                                     │
│ RA-Node: Consequentialist inference                                 │
│ Confidence: 0.70 (depends on institutional adoption)                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-403

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Will institutions actually credit platform contributions? | OPEN | Unknown; requires institutional partnership development |
| CQ2 | Could new metrics create new gaming? | ANSWERED | Risk acknowledged; quality signals designed to resist gaming |
| CQ3 | Is the causal chain reliable? | QUALIFIED | Depends on external factors (institutional adoption) |

---

### Prong IV Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRONG IV: THEORY OF CHANGE                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Claims Established:                                                 │
│                                                                     │
│ C-401: Claims as atomic unit can transform discourse         [IN]   │
│        └── A-401 (Analogy: Citation Networks)       Conf: 0.75      │
│            └── ATK-401 (Claims not stable)          [DEFENDED]      │
│                                                                     │
│ C-402: Versioned releases enable accumulation                [IN]   │
│        └── A-402 (Mechanism: Accumulation)          Conf: 0.80      │
│            └── No undefended attacks                                │
│                                                                     │
│ C-403: Credit redesign can shift incentives                  [IN]   │
│        └── A-403 (Consequences: Incentives)         Conf: 0.70      │
│            └── No undefended attacks (but CQ1 open)                 │
│                                                                     │
│ PRONG CONCLUSION: Theory of change is plausible but          [IN]   │
│ depends on external factors (institutional adoption)                │
│                                                                     │
│ Aggregate Confidence: 0.75                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prong V: Risk Assessment

### Claim C-501

> **The risks of building Academic Agora are manageable and do not outweigh potential benefits.**

**Claim ID**: C-501  
**Status**: IN  
**Confidence**: 0.80  
**Type**: Practical/Evaluative

---

### Argument A-501: Practical Reasoning (Risk-Benefit)

**Scheme**: Practical Reasoning (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-501                                                      │
│ Scheme: Practical Reasoning (Means-End)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Goal is to improve scholarly discourse infrastructure (G)       │
│                                                                     │
│ P2: Building Academic Agora is a means to realize G                 │
│     [Established in Prongs I-IV]                                    │
│                                                                     │
│ P3: The identified risks are:                                       │
│     R1: Adoption friction (scholars won't use it)                   │
│     R2: Junior scholar vulnerability (retaliation risk)             │
│     R3: Gaming metrics (new metrics, new gaming)                    │
│     R4: Platform power (control over discourse)                     │
│     R5: Sustainability (funding/business model uncertainty)         │
│     R6: Scale performance (technical limitations)                   │
│                                                                     │
│ P4: Each risk has identified mitigations (see register below)       │
│                                                                     │
│ P5: Potential benefits (improved discourse, cumulative knowledge,   │
│     credit for engagement) outweigh residual risks                  │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Building Academic Agora is a reasonable means to pursue G        │
│                                                                     │
│ RA-Node: Practical reasoning inference                              │
│ Confidence: 0.80                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Risk Register with Mitigations

| Risk ID | Risk Description | Severity | Likelihood | Mitigation | Residual |
|---------|------------------|----------|------------|------------|----------|
| R1 | **Adoption friction**: Scholars accustomed to existing workflows won't adopt | High | Medium | Progressive formalization; templates matching existing workflows (journal clubs); champion seeding; graduate student cultivation | Medium |
| R2 | **Junior scholar vulnerability**: Graduate students/ECRs face retaliation for challenging senior scholars | High | Medium | Anonymous/pseudonymous option for sensitive challenges; moderation; community norms; graduated visibility | Medium |
| R3 | **Gaming metrics**: New contribution metrics create new gaming behaviors | Medium | Medium | Quality signals (defense rate vs. raw count); expert review; resistance to quantity-only metrics | Low-Medium |
| R4 | **Platform power**: Centralized control over scholarly discourse | Medium | Low | Open source; federation roadmap; governance transparency; self-hosted option (2027) | Low |
| R5 | **Sustainability**: No clear business model | High | Medium | Grant funding (NEH/NSF); institutional subscriptions; federation reduces central costs | Medium |
| R6 | **Scale performance**: System slows with large deliberations | Medium | Low | Performance optimization; caching; incremental loading | Low |

---

### Attack ATK-501: Junior Scholar Vulnerability Is Unacceptable

**Attack Type**: REBUT (on risk acceptability)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ATTACK ATK-501                                                      │
│ Type: REBUT                                                         │
│ Target: C-501 (risks are acceptable)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ATTACKING CLAIM:                                                    │
│                                                                     │
│ Risk R2 (junior scholar vulnerability) is unacceptable. Academic    │
│ power dynamics are severe; junior scholars who publicly challenge   │
│ senior scholars face real career consequences. Even with            │
│ mitigations, the platform could harm vulnerable community members.  │
│ This risk should be disqualifying.                                  │
│                                                                     │
│ CA-Node: Conflict Application (rebut on acceptability)              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Defense D-501: Mitigations + Current State Comparison

**Move Type**: GROUNDS  
**Status**: DEFENDED

```
┌─────────────────────────────────────────────────────────────────────┐
│ DEFENSE D-501                                                       │
│ Type: GROUNDS                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. The attack identifies a genuine and serious risk.                │
│                                                                     │
│ 2. However, mitigations are specifically designed for this:         │
│    - Anonymous/pseudonymous challenges available                    │
│    - Graduated visibility (not all engagement must be public)       │
│    - Moderation and community norms enforced                        │
│    - Exit surveys to detect negative consequences                   │
│                                                                     │
│ 3. Comparison to status quo matters:                                │
│    - Twitter/X is MORE dangerous (public, unmoderated, hostile)     │
│    - Email is private but still trackable                           │
│    - Conference Q&A is public and ephemeral                         │
│    - Academic Agora with mitigations is NOT worse than current      │
│      state                                                          │
│                                                                     │
│ 4. The platform can be a SAFER venue for structured critique than   │
│    alternatives precisely because of moderation and norms.          │
│                                                                     │
│ 5. We commit to monitoring and responding if harms emerge.          │
│                                                                     │
│ ATTACK FORCE: Reduced; risk serious but mitigated and compared      │
│ CONFIDENCE: Maintained at 0.80                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Prong V Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRONG V: RISK ASSESSMENT                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Claims Established:                                                 │
│                                                                     │
│ C-501: Risks are manageable and don't outweigh benefits      [IN]   │
│        └── A-501 (Practical Reasoning)              Conf: 0.80      │
│            └── ATK-501 (Junior vulnerability)       [DEFENDED]      │
│                                                                     │
│ Risk Register: 6 risks identified, mitigations documented           │
│ Residual Risk: Low to Medium overall                                │
│                                                                     │
│ PRONG CONCLUSION: Risk profile is acceptable                 [IN]   │
│                                                                     │
│ Aggregate Confidence: 0.80                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prong VI: Alternative Comparison

### Claim C-601

> **Academic Agora is superior to available alternatives for structured scholarly discourse.**

**Claim ID**: C-601  
**Status**: IN  
**Confidence**: 0.85  
**Type**: Comparative/Evaluative

---

### Argument A-601: Argument from Comparison

**Scheme**: Argument from Comparison (Walton)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-601                                                      │
│ Scheme: Argument from Comparison                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Available platforms for academic discourse include:             │
│     - PubPeer (post-publication commentary)                         │
│     - Hypothesis (web annotation)                                   │
│     - OpenReview (conference review)                                │
│     - ResearchGate (academic social network)                        │
│     - Twitter/X (informal discussion)                               │
│     - PhilPapers comments (philosophy-specific)                     │
│                                                                     │
│ P2: Evaluation criteria (from C-101 requirements):                  │
│     - Claim-level engagement                                        │
│     - Typed dialogue moves                                          │
│     - Argument structure                                            │
│     - Evidence linking                                              │
│     - Cross-paper synthesis                                         │
│     - Versioned releases                                            │
│     - Persistence                                                   │
│     - Accessibility                                                 │
│                                                                     │
│ P3: Comparative assessment (see matrix below)                       │
│                                                                     │
│ P4: Academic Agora scores highest on weighted criteria              │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Academic Agora is superior for structured scholarly discourse    │
│                                                                     │
│ RA-Node: Comparative inference                                      │
│ Confidence: 0.85                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Comparative Matrix

| Platform | Claims | Dialogue | Arguments | Evidence | Synthesis | Versioning | Persistence | Access | TOTAL |
|----------|--------|----------|-----------|----------|-----------|------------|-------------|--------|-------|
| **PubPeer** | 2 | 1 | 1 | 2 | 1 | 1 | 4 | 4 | 16 |
| **Hypothesis** | 3 | 1 | 1 | 2 | 1 | 1 | 3 | 4 | 16 |
| **OpenReview** | 2 | 2 | 2 | 3 | 1 | 1 | 3 | 3 | 17 |
| **ResearchGate** | 1 | 1 | 1 | 2 | 1 | 1 | 3 | 5 | 15 |
| **Twitter/X** | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 5 | 12 |
| **PhilPapers** | 2 | 2 | 1 | 2 | 1 | 1 | 4 | 3 | 16 |
| **Academic Agora** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 3 | 38 |

*Scale: 1 (absent) to 5 (excellent)*

**Note**: Academic Agora scores lower on accessibility than simple social tools; this is addressed by progressive formalization and facilitated entry.

---

### Claim C-602

> **Academic Agora provides capabilities that cannot be retrofitted onto existing platforms.**

**Claim ID**: C-602  
**Status**: IN  
**Confidence**: 0.85  
**Type**: Technical

---

### Argument A-602: Argument from Properties (Architectural Requirements)

**Scheme**: Argument from Properties

```
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-602                                                      │
│ Scheme: Argument from Properties                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
│ P1: Academic Agora capabilities requiring purpose-built             │
│     architecture:                                                   │
│                                                                     │
│     (a) Canonical claims with ASPIC+ acceptability semantics        │
│         → Requires formal attack graph, extension computation       │
│                                                                     │
│     (b) Typed attack relations (rebut/undercut/undermine)           │
│         → Requires AIF ontology compliance                          │
│                                                                     │
│     (c) Commitment tracking across dialogue                         │
│         → Requires PPD protocol implementation                      │
│                                                                     │
│     (d) Cross-deliberation claim transport with provenance          │
│         → Requires Plexus categorical structure                     │
│                                                                     │
│     (e) Versioned releases with computed claim status               │
│         → Requires snapshot and diff infrastructure                 │
│                                                                     │
│ P2: These capabilities require the platform to be architected       │
│     around them from the start; they cannot be added as features    │
│     to comment systems or social networks                           │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: Academic Agora provides capabilities that cannot be retrofitted  │
│    onto existing platforms                                          │
│                                                                     │
│ RA-Node: Properties inference                                       │
│ Confidence: 0.85                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Critical Questions for A-602

| CQ | Question | Status | Response |
|----|----------|--------|----------|
| CQ1 | Could existing platforms add these features? | ANSWERED | Not without fundamental re-architecture; data model must be argumentation-native |
| CQ2 | Are these features actually valuable? | ANSWERED | Established in Prong II |
| CQ3 | Is there a simpler solution? | OPEN | No simpler solution identified that provides equivalent capabilities |

---

### Prong VI Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRONG VI: ALTERNATIVE COMPARISON                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Claims Established:                                                 │
│                                                                     │
│ C-601: Platform is superior for structured discourse         [IN]   │
│        └── A-601 (Comparison)                       Conf: 0.85      │
│            └── No undefended attacks                                │
│                                                                     │
│ C-602: Capabilities cannot be retrofitted onto alternatives  [IN]   │
│        └── A-602 (Properties: Architecture)         Conf: 0.85      │
│            └── No undefended attacks                                │
│                                                                     │
│ PRONG CONCLUSION: Platform offers unique, irreplaceable      [IN]   │
│ value vs. alternatives                                              │
│                                                                     │
│ Aggregate Confidence: 0.85                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Commitment Store

### Proponent Commitments (Platform Advocates)

| ID | Commitment | Status | Confidence |
|----|------------|--------|------------|
| CM-P01 | Infrastructure for sustained scholarly discourse is absent | ACTIVE | 0.90 |
| CM-P02 | Discourse deficit causes knowledge production inefficiency | ACTIVE | 0.85 |
| CM-P03 | Historical pattern predicts missing argument layer | ACTIVE | 0.80 |
| CM-P04 | Platform provides necessary architectural features | ACTIVE | 0.90 |
| CM-P05 | Formal foundations are theoretically sound | ACTIVE | 0.90 |
| CM-P06 | Academic-specific features address unique needs | ACTIVE | 0.85 |
| CM-P07 | HSS is natural fit for platform | ACTIVE | 0.90 |
| CM-P08 | Platform addresses documented HSS frustrations | ACTIVE | 0.85 |
| CM-P09 | Structured discourse especially valuable for interpretive work | ACTIVE | 0.80 |
| CM-P10 | Claims as atomic unit can transform discourse | ACTIVE | 0.75 |
| CM-P11 | Versioned releases enable accumulation | ACTIVE | 0.80 |
| CM-P12 | Credit redesign can shift incentives | ACTIVE | 0.70 |
| CM-P13 | Risks are manageable | ACTIVE | 0.80 |
| CM-P14 | Platform is superior to alternatives | ACTIVE | 0.85 |
| CM-P15 | Capabilities cannot be retrofitted | ACTIVE | 0.85 |
| CM-P16 | **THESIS**: Academic Agora should exist and be developed | ACTIVE | 0.83 |

### Opponent Challenges Addressed

| ID | Challenge | Resolution | Status |
|----|-----------|------------|--------|
| CH-01 | Peer review is infrastructure | Peer review is evaluation, not discourse; different function | CLOSED |
| CH-02 | Business model concern | Grant funding + subscriptions; warrant established, not prediction | CLOSED |
| CH-03 | Formal methods adoption failure | Progressive formalization inverts barrier; design addresses failure | CLOSED |
| CH-04 | STEM exclusion | HSS-first is sequencing, not limitation; expansion planned | CLOSED |
| CH-05 | Formalization constrains interpretation | Optional formalization; multiple modes supported | CLOSED |
| CH-06 | Claims not as stable as papers | Canonical claims + versioning address stability | CLOSED |
| CH-07 | Junior scholar vulnerability | Mitigations + better than status quo comparison | CLOSED |

---

## Attack Register

### All Registered Attacks

| Attack ID | Type | Target | Status | Resolution |
|-----------|------|--------|--------|------------|
| ATK-101 | REBUT | C-101 | DEFENDED | Peer review is evaluation, not discourse |
| ATK-103 | UNDERCUT | A-103 | DEFENDED | Establishes warrant, not prediction |
| ATK-202 | UNDERCUT | A-202 | DEFENDED | Progressive formalization addresses failure |
| ATK-301 | UNDERMINE | A-301:P1 | DEFENDED | HSS-first is sequencing strategy |
| ATK-303 | REBUT | C-303 | DEFENDED | Optional formalization, multiple modes |
| ATK-401 | UNDERCUT | A-401 | DEFENDED | Canonical claims + versioning |
| ATK-501 | REBUT | C-501 | DEFENDED | Mitigations + status quo comparison |

### Undefended Attacks

None. All registered attacks have been addressed.

### Open Critical Questions

| CQ ID | Question | Status | Impact if Answered Negatively |
|-------|----------|--------|-------------------------------|
| A-201:CQ3 | Real-world scholarly adoption? | OPEN | Requires pilot validation |
| A-302:CQ3 | Will addressing frustrations drive adoption? | OPEN | Empirical validation needed |
| A-402:CQ3 | What is expected effect size of versioning? | OPEN | Would affect expectations |
| A-403:CQ1 | Will institutions credit contributions? | OPEN | Critical for incentive shift |
| A-602:CQ3 | Is there a simpler solution? | OPEN | Would affect build decision |

---

## Synthesis & Conclusion

### Argument Chain: Complete Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        THESIS ARGUMENT CHAIN                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                            THESIS-001                                       │
│                 "Academic Agora should exist and                            │
│                    be developed" [IN: 0.83]                                 │
│                              ▲                                              │
│                              │                                              │
│        ┌─────────────────────┼─────────────────────┐                        │
│        │           │         │         │           │                        │
│    PRONG I     PRONG II  PRONG III  PRONG IV   PRONG V                      │
│   Discourse   Infra-    Disciplinary Theory of   Risk                       │
│    Deficit    structure    Fit        Change   Assessment                   │
│    [0.85]     [0.88]     [0.85]      [0.75]     [0.80]                      │
│       │          │          │           │          │                        │
│  ┌────┴────┐ ┌───┴───┐ ┌────┴────┐ ┌────┴────┐    │                        │
│  │    │    │ │   │   │ │    │    │ │    │    │    │                        │
│ C-101│C-102│ │C-201│  │ │C-301│   │ │C-401│   │    │                        │
│ C-103│     │ │C-202│  │ │C-302│   │ │C-402│   │    │                        │
│      │     │ │C-203│  │ │C-303│   │ │C-403│   │  C-501                      │
│                                                                             │
│                              │                                              │
│                          PRONG VI                                           │
│                         Alternatives                                        │
│                           [0.85]                                            │
│                              │                                              │
│                        ┌─────┴─────┐                                        │
│                       C-601       C-602                                     │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  AGGREGATE THESIS CONFIDENCE:                                               │
│  Geometric mean: (0.85 × 0.88 × 0.85 × 0.75 × 0.80 × 0.85)^(1/6) = 0.83    │
│                                                                             │
│  STATUS: IN (grounded extension)                                            │
│  QUALIFICATION: Theory of change depends on institutional adoption          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Thesis Statement: Final Form

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         THESIS-001 (FINAL)                                  │
│                                                                             │
│  Academic Agora should exist and be developed as infrastructure for         │
│  scholarly discourse—transforming academic debate from papers-as-PDFs       │
│  to papers-as-debatable, composable claim graphs.                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  This thesis is SUPPORTED by:                                               │
│                                                                             │
│  1. PRONG I establishes that infrastructure for sustained scholarly         │
│     discourse is absent, with measurable consequences for knowledge         │
│     production, and historical analysis reveals a missing layer in          │
│     the evolution of scholarly infrastructure.                              │
│                                                                             │
│  2. PRONG II establishes that Academic Agora provides the necessary         │
│     architectural features (claim addressability, typed dialogue,           │
│     argument structure, evidence linking, versioned releases) on            │
│     theoretically sound foundations (Walton schemes, AIF, ASPIC+),          │
│     with academic-specific features (DOI/ORCID integration, quote           │
│     nodes, fork/merge, BibTeX export).                                      │
│                                                                             │
│  3. PRONG III establishes that Humanities and Social Sciences are a         │
│     natural fit because HSS scholarship is already argumentation-           │
│     based, the platform addresses documented HSS frustrations, and          │
│     structured discourse is especially valuable for interpretive            │
│     pluralism.                                                              │
│                                                                             │
│  4. PRONG IV establishes a plausible theory of change: making claims        │
│     the atomic unit can transform discourse (by analogy to citation         │
│     networks), versioned releases enable cumulative rather than             │
│     repetitive knowledge production, and credit for argumentation           │
│     contributions can shift scholarly incentives.                           │
│                                                                             │
│  5. PRONG V establishes that identified risks (adoption friction,           │
│     junior vulnerability, gaming, platform power, sustainability,           │
│     scale) have documented mitigations and do not outweigh benefits.        │
│                                                                             │
│  6. PRONG VI establishes that Academic Agora is superior to available       │
│     alternatives for structured scholarly discourse and provides            │
│     capabilities that cannot be retrofitted onto existing platforms.        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  This thesis is QUALIFIED by:                                               │
│                                                                             │
│  • Theory of change (Prong IV) depends on external factors: will            │
│    institutions credit platform contributions? This is open.                │
│                                                                             │
│  • HSS-first is a sequencing strategy; STEM expansion planned but           │
│    not yet implemented.                                                     │
│                                                                             │
│  • Real-world scholarly adoption requires pilot validation (open CQ).       │
│                                                                             │
│  • Sustainability depends on grant funding and institutional                │
│    partnerships that are not yet secured.                                   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  STATUS: IN (defensible in grounded extension)                              │
│  CONFIDENCE: 0.83                                                           │
│  CHALLENGES ADDRESSED: 7 of 7                                               │
│  OPEN QUESTIONS: 5 (requiring empirical/institutional validation)           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  RECOMMENDED ACTION: Proceed with development, focusing on:                 │
│  1. HSS pilot communities (philosophy of mind, political theory)            │
│  2. Graduate student cultivation as early adopters                          │
│  3. Champion scholar recruitment                                            │
│  4. Grant applications (NEH/NSF) for sustainability                         │
│  5. Measurement framework for validating theory of change                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Evidence Registry

| Evidence ID | Description | Source | Type |
|-------------|-------------|--------|------|
| E-101a | Scholarly communication requirements | Borgman, Scholarly Communication (2007) | Theoretical |
| E-101b | Platform documentation analysis | PubPeer, Hypothesis, OpenReview documentation | Empirical |
| E-D101a | Peer review history | Fyfe et al., "History of Peer Review" (2017) | Historical |
| E-102a | Repeated debates in HSS | Disciplinary self-commentary | Empirical |
| E-102b | Citation misattribution | Citation analysis literature | Empirical |
| E-102c | Knowledge attrition | Knowledge management literature | Empirical |
| E-103a | Scholarly infrastructure history | Shuttleworth (2016); Royal Society | Historical |
| E-103b | Citation indexing history | Clarivate history; DOI handbook | Historical |
| E-201a | Infrastructure requirements | Derived from C-101 | Theoretical |
| E-201b | System Architecture Document | Platform documentation | Technical |
| E-202a | Computational argumentation field | COMMA proceedings; A&C journal | Academic |
| E-202b | Walton schemes | Walton, Reed & Macagno (2008) | Academic |
| E-202c | AIF standard | Chesñevar et al. (2006); Reed et al. (2010) | Technical |
| E-202d | ASPIC+ framework | Prakken (2010); Modgil & Prakken (2018) | Technical |
| E-202e | Implementation | System Architecture Document | Technical |
| E-203 | Academic features | Phase 2 development roadmap | Technical |
| E-301a | HSS disciplinary practices | Graduate curricula; disciplinary self-descriptions | Descriptive |
| E-302a | HSS scholar frustrations | User interviews; Crooked Timber | Empirical |
| E-303a | Interpretive pluralism norms | Hermeneutic tradition | Theoretical |
| E-401a | Citation indexing transformation | Garfield; Clarivate history | Historical |
| E-402a | Repeated debates | Disciplinary self-commentary | Empirical |
| E-402b | DebateRelease versioning | System Architecture Document | Technical |
| E-403a | Academic incentives | Edwards & Roy (2017) | Empirical |
| E-403b | Credit system roadmap | Phase 4 development roadmap | Technical |

---

## Document Metadata

**Release**: v1.0.0  
**Generated**: January 2026  
**ASPIC+ Evaluation**: Grounded extension computed  
**Thesis Status**: IN  
**Aggregate Confidence**: 0.83

**Changelog from v0 (implicit prior state)**:
- Initial thesis formulation
- Six prongs established
- Seven attacks registered and addressed
- Commitment store populated
- Evidence registry compiled

---

*This document demonstrates the platform's thesis generation capability applied to the academic use case. The thesis is subject to further challenge and refinement through ongoing deliberation.*
