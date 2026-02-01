# Academic Agora for STEM: Architecture & Design Exploration

## Purpose

This document explores what Academic Agora would need to become to serve STEM disciplines (natural sciences, engineering, mathematics, computer science, medicine). The HSS-first strategy is sound for initial deployment, but eventual STEM compatibility requires significant architectural extensions beyond "adding features."

**Core Challenge**: STEM discourse is not just argumentation about texts—it is argumentation grounded in *data*, *methods*, *code*, and *reproducible procedures*. The platform must become not just a discourse layer but a *verification layer* that connects claims to their empirical and computational substrates.

---

## Table of Contents

1. [Fundamental Differences: HSS vs. STEM Discourse](#1-fundamental-differences)
2. [Extended Claim Ontology for STEM](#2-extended-claim-ontology)
3. [New Argumentation Schemes for STEM](#3-new-argumentation-schemes)
4. [The Empirical Grounding Layer](#4-the-empirical-grounding-layer)
5. [Computational Reproducibility Infrastructure](#5-computational-reproducibility-infrastructure)
6. [The Replication Tracking System](#6-the-replication-tracking-system)
7. [Statistical Verification Layer](#7-statistical-verification-layer)
8. [Integration Ecosystem](#8-integration-ecosystem)
9. [Discipline-Specific Modules](#9-discipline-specific-modules)
10. [The "Picturing Face" Implementation](#10-the-picturing-face-implementation)
11. [New UI/UX Paradigms](#11-new-uiux-paradigms)
12. [Governance & Quality Assurance](#12-governance--quality-assurance)
13. [Adoption Strategy for STEM](#13-adoption-strategy-for-stem)
14. [Open Research Questions](#14-open-research-questions)

---

## 1. Fundamental Differences: HSS vs. STEM Discourse

### 1.1 Epistemic Structure Comparison

| Dimension | HSS Discourse | STEM Discourse |
|-----------|---------------|----------------|
| **Primary evidence** | Texts, archives, interpretations | Data, measurements, experiments |
| **Validation method** | Peer critique, interpretive coherence | Replication, statistical inference, prediction |
| **Claim stability** | Interpretive pluralism persists | Convergence toward "correct" answers expected |
| **Time horizon** | Debates span decades/centuries | Rapid obsolescence in some fields |
| **Formalization** | Natural language, qualitative | Mathematical, statistical, computational |
| **Reproducibility** | Not applicable (interpretation) | Central concern |
| **Data sharing** | Primary sources often public | Data often proprietary, sensitive, or massive |
| **Code/methods** | Not applicable | Critical for verification |
| **Consensus mechanism** | Ongoing dialogue | Empirical adjudication |

### 1.2 What STEM Adds to the Complexity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STEM DISCOURSE COMPLEXITY LAYERS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HSS LAYER (already built):                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Claims → Arguments → Schemes → Attacks → Commitments → Releases     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STEM LAYER 1: Empirical Grounding                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Data → Measurements → Datasets → Repositories → Versioning          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STEM LAYER 2: Methodological Specification                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Protocols → Parameters → Conditions → Equipment → Reagents          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STEM LAYER 3: Computational Substrate                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Code → Notebooks → Environments → Dependencies → Execution          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STEM LAYER 4: Statistical/Inferential Machinery                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Tests → Effect Sizes → Confidence Intervals → Power → Priors        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STEM LAYER 5: Verification & Replication                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Replications → Meta-analyses → Effect Aggregation → Status          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 The Core Insight

> **For STEM, claims are not just propositions to be argued about—they are propositions with *empirical grounding conditions* that can be independently verified.**

This means the platform must track not just "what people assert and how they defend it" but "what the world says back when we check."

---

## 2. Extended Claim Ontology for STEM

### 2.1 STEM Claim Types

The HSS claim types (THESIS, INTERPRETIVE, HISTORICAL, NORMATIVE, METHODOLOGICAL) need expansion:

```typescript
enum STEMClaimType {
  // Empirical claims
  EMPIRICAL_OBSERVATION,     // "We observed X in conditions Y"
  EMPIRICAL_MEASUREMENT,     // "The measured value of X is Y ± Z"
  EMPIRICAL_CORRELATION,     // "X correlates with Y (r = Z)"
  EMPIRICAL_CAUSAL,          // "X causes Y"
  EMPIRICAL_EFFECT_SIZE,     // "The effect of X on Y is d = Z"
  
  // Statistical claims
  STATISTICAL_SIGNIFICANCE,  // "p < 0.05 for H0: X"
  STATISTICAL_INFERENCE,     // "Based on data, we infer θ = X"
  STATISTICAL_PREDICTION,    // "Model predicts Y with accuracy Z"
  STATISTICAL_POWER,         // "Study has power β to detect effect d"
  
  // Methodological claims
  METHODOLOGICAL_VALIDITY,   // "Method X validly measures construct Y"
  METHODOLOGICAL_RELIABILITY,// "Method X has reliability r"
  METHODOLOGICAL_PROTOCOL,   // "Protocol X should be followed for Y"
  
  // Mechanistic claims
  MECHANISTIC_EXPLANATION,   // "Mechanism M explains phenomenon P"
  MECHANISTIC_PATHWAY,       // "Process proceeds via steps A→B→C"
  MECHANISTIC_COMPONENT,     // "Component X is necessary for function Y"
  
  // Model-based claims
  MODEL_SPECIFICATION,       // "Phenomenon P is described by model M"
  MODEL_ASSUMPTION,          // "Model M assumes condition C"
  MODEL_PREDICTION,          // "Model M predicts observation O"
  MODEL_FIT,                 // "Model M fits data D with goodness G"
  
  // Computational claims
  COMPUTATIONAL_RESULT,      // "Algorithm A produces output O on input I"
  COMPUTATIONAL_COMPLEXITY,  // "Algorithm A has complexity O(f(n))"
  COMPUTATIONAL_CORRECTNESS, // "Implementation I correctly implements A"
  
  // Meta-scientific claims
  META_REPLICATION,          // "Finding F has replicated / failed to replicate"
  META_AGGREGATION,          // "Meta-analysis yields effect d across k studies"
  META_HETEROGENEITY,        // "Effect varies across conditions (I² = X)"
}
```

### 2.2 Claim Grounding Requirements

Each STEM claim type has *grounding requirements*—what must be linked for the claim to be evaluable:

| Claim Type | Required Grounding | Optional Grounding |
|------------|-------------------|-------------------|
| EMPIRICAL_MEASUREMENT | Dataset, Protocol, Equipment | Raw data, Calibration |
| STATISTICAL_SIGNIFICANCE | Data, Test specification, Code | Pre-registration |
| MECHANISTIC_EXPLANATION | Evidence chain, Alternative exclusion | Simulation |
| MODEL_PREDICTION | Model specification, Parameters | Training data |
| COMPUTATIONAL_RESULT | Code, Input data, Environment | Execution log |
| META_AGGREGATION | Included studies, Coding scheme | Forest plot data |

### 2.3 The Grounded Claim Model

```typescript
model GroundedClaim {
  id              String   @id @default(cuid())
  claim           Claim    @relation(fields: [claimId], references: [id])
  claimId         String
  
  // Grounding type
  groundingType   GroundingType  // DATA, CODE, PROTOCOL, MODEL, etc.
  
  // Linked resources
  datasetLinks    DatasetLink[]
  codeLinks       CodeLink[]
  protocolLinks   ProtocolLink[]
  modelLinks      ModelLink[]
  
  // Verification status
  groundingStatus GroundingStatus  // UNVERIFIED, VERIFIED, FAILED, CONTESTED
  verifiedAt      DateTime?
  verifiedBy      User?
  
  // Reproducibility tracking
  reproductions   Reproduction[]
  
  // Automated checks
  automatedChecks AutomatedCheck[]
}

enum GroundingStatus {
  UNGROUNDED      // No empirical grounding linked
  GROUNDED        // Resources linked but not verified
  VERIFIED        // Resources verified accessible/executable
  REPRODUCED      // Independent reproduction succeeded
  FAILED          // Verification or reproduction failed
  CONTESTED       // Conflicting reproduction results
}
```

---

## 3. New Argumentation Schemes for STEM

### 3.1 Empirical Schemes

#### Scheme: Argument from Statistical Inference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCHEME: Argument from Statistical Inference                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PREMISES:                                                                   │
│   P1: Data D was collected under conditions C                               │
│   P2: Statistical test T was applied to D                                   │
│   P3: Test T yielded result R (e.g., p < α, or posterior P(H|D))            │
│   P4: Result R supports hypothesis H over null H₀                           │
│                                                                             │
│ CONCLUSION:                                                                 │
│   C: H is supported (defeasibly)                                            │
│                                                                             │
│ CRITICAL QUESTIONS:                                                         │
│   CQ1: Was the sample size sufficient? (power analysis)                     │
│   CQ2: Were appropriate statistical assumptions met?                        │
│   CQ3: Was the test pre-specified or post-hoc?                              │
│   CQ4: Were multiple comparisons corrected for?                             │
│   CQ5: Is the effect size practically significant?                          │
│   CQ6: Could there be confounding variables?                                │
│   CQ7: Is there selection bias in the sample?                               │
│   CQ8: Has this been replicated?                                            │
│                                                                             │
│ ATTACK TYPES:                                                               │
│   UNDERMINE P1: Challenge data quality/collection                           │
│   UNDERMINE P2: Challenge test appropriateness                              │
│   UNDERMINE P3: Challenge computation (statistical error)                   │
│   UNDERCUT: Challenge inference validity (CQ1-CQ7)                          │
│   REBUT: Present contradicting evidence                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Scheme: Argument from Replication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCHEME: Argument from Replication                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PREMISES:                                                                   │
│   P1: Original study S₁ reported finding F                                  │
│   P2: Replication study S₂ attempted to reproduce F                         │
│   P3: S₂ used methods M comparable to S₁                                    │
│   P4: S₂ obtained result R                                                  │
│                                                                             │
│ CONCLUSION (if R ≈ F):                                                      │
│   C: F is more credible (replication success)                               │
│                                                                             │
│ CONCLUSION (if R ≉ F):                                                      │
│   C: F is less credible (replication failure)                               │
│                                                                             │
│ CRITICAL QUESTIONS:                                                         │
│   CQ1: Was S₂ a direct or conceptual replication?                           │
│   CQ2: Were conditions sufficiently similar?                                │
│   CQ3: Did S₂ have adequate power to detect F?                              │
│   CQ4: Were there hidden moderators that differed?                          │
│   CQ5: Was the original S₁ pre-registered?                                  │
│   CQ6: What is the overall replication rate for this finding?               │
│   CQ7: Could publication bias affect this comparison?                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Scheme: Argument from Mechanism

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCHEME: Argument from Mechanism                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PREMISES:                                                                   │
│   P1: Phenomenon P occurs                                                   │
│   P2: Mechanism M, if operative, would produce P                            │
│   P3: Evidence E supports that M is operative                               │
│   P4: Alternative mechanisms M' have been excluded or are less plausible    │
│                                                                             │
│ CONCLUSION:                                                                 │
│   C: M explains P                                                           │
│                                                                             │
│ CRITICAL QUESTIONS:                                                         │
│   CQ1: Is the proposed mechanism M well-established?                        │
│   CQ2: Are all steps in M empirically supported?                            │
│   CQ3: Have alternative mechanisms been adequately considered?              │
│   CQ4: Are there necessary conditions for M that might not hold?            │
│   CQ5: Does M predict additional observations that have been tested?        │
│   CQ6: Is M consistent with known physical/chemical/biological laws?        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Computational Schemes

#### Scheme: Argument from Computational Experiment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCHEME: Argument from Computational Experiment                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PREMISES:                                                                   │
│   P1: Algorithm/model A was implemented as code C                           │
│   P2: C was executed on input data D                                        │
│   P3: Execution produced output O                                           │
│   P4: O has property/value V                                                │
│                                                                             │
│ CONCLUSION:                                                                 │
│   C: A produces V on D                                                      │
│                                                                             │
│ CRITICAL QUESTIONS:                                                         │
│   CQ1: Does C correctly implement A?                                        │
│   CQ2: Is D representative/appropriate for the claim?                       │
│   CQ3: Are there bugs in C that could affect O?                             │
│   CQ4: Are results sensitive to random seeds/initialization?                │
│   CQ5: Is the computational environment specified?                          │
│   CQ6: Has execution been independently verified?                           │
│   CQ7: Are numerical precision issues relevant?                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Scheme: Argument from Model Fit

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCHEME: Argument from Model Fit                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PREMISES:                                                                   │
│   P1: Model M makes predictions about phenomenon P                          │
│   P2: Data D was collected about P                                          │
│   P3: M's predictions match D with fit statistic F                          │
│   P4: F meets threshold T for acceptable fit                                │
│                                                                             │
│ CONCLUSION:                                                                 │
│   C: M is a valid model of P (provisionally)                                │
│                                                                             │
│ CRITICAL QUESTIONS:                                                         │
│   CQ1: Is M overfitting the data?                                           │
│   CQ2: Has M been tested on held-out data?                                  │
│   CQ3: Are M's assumptions reasonable for the domain?                       │
│   CQ4: Are there simpler models with comparable fit?                        │
│   CQ5: Does M generalize to new data/conditions?                            │
│   CQ6: Are there known limitations of fit statistic F?                      │
│   CQ7: What is the theoretical justification for M?                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Meta-Scientific Schemes

#### Scheme: Argument from Meta-Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCHEME: Argument from Meta-Analysis                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PREMISES:                                                                   │
│   P1: Studies S₁...Sₙ investigated effect E                                 │
│   P2: Meta-analytic synthesis was conducted                                 │
│   P3: Pooled effect estimate is d with CI [a, b]                            │
│   P4: Heterogeneity is I² = X%                                              │
│                                                                             │
│ CONCLUSION:                                                                 │
│   C: Best estimate of E is d [a, b] (with qualifier based on I²)            │
│                                                                             │
│ CRITICAL QUESTIONS:                                                         │
│   CQ1: Is there publication bias (funnel plot asymmetry)?                   │
│   CQ2: Are the studies sufficiently similar to pool?                        │
│   CQ3: Were quality weights appropriate?                                    │
│   CQ4: Were inclusion/exclusion criteria appropriate?                       │
│   CQ5: Is heterogeneity explained by moderators?                            │
│   CQ6: Are there influential outlier studies?                               │
│   CQ7: Was the search strategy comprehensive?                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. The Empirical Grounding Layer

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EMPIRICAL GROUNDING ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLAIM LAYER (existing)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Claim                                        │   │
│  │                           │                                          │   │
│  │                    GroundingLink                                     │   │
│  │                           │                                          │   │
│  └───────────────────────────┼─────────────────────────────────────────┘   │
│                              ▼                                              │
│  GROUNDING LAYER (new)                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Dataset  │  │ Protocol │  │   Code   │  │  Model   │            │   │
│  │  │ Anchor   │  │  Anchor  │  │  Anchor  │  │  Anchor  │            │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │   │
│  │       │             │             │             │                   │   │
│  │       ▼             ▼             ▼             ▼                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ External │  │ External │  │ External │  │ External │            │   │
│  │  │ Dataset  │  │ Protocol │  │   Repo   │  │  Model   │            │   │
│  │  │ Registry │  │ Registry │  │ (GitHub) │  │   Hub    │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  │                                                                     │   │
│  │       │             │             │             │                   │   │
│  │       └─────────────┴─────────────┴─────────────┘                   │   │
│  │                           │                                         │   │
│  │                    VERIFICATION                                     │   │
│  │                      ENGINE                                         │   │
│  │                           │                                         │   │
│  │              ┌────────────┼────────────┐                            │   │
│  │              ▼            ▼            ▼                            │   │
│  │        ┌──────────┐ ┌──────────┐ ┌──────────┐                       │   │
│  │        │Accessible│ │Executable│ │Consistent│                       │   │
│  │        │  Check   │ │  Check   │ │  Check   │                       │   │
│  │        └──────────┘ └──────────┘ └──────────┘                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Models

```typescript
// Dataset linking
model DatasetAnchor {
  id              String   @id @default(cuid())
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id])
  
  // External reference
  repositoryType  DataRepository  // ZENODO, FIGSHARE, DRYAD, OSF, CUSTOM
  externalId      String          // DOI or repository-specific ID
  externalUrl     String
  
  // Specificity
  subset          String?         // Which part of dataset (table, column, rows)
  version         String?         // Dataset version
  
  // Verification
  accessStatus    AccessStatus    // ACCESSIBLE, RESTRICTED, UNAVAILABLE
  lastVerified    DateTime?
  hashVerified    String?         // Hash of data at verification time
  
  // Metadata
  description     String?
  dataType        DataType        // TABULAR, IMAGE, SEQUENCE, TEXT, etc.
  size            BigInt?         // Bytes
}

// Protocol linking
model ProtocolAnchor {
  id              String   @id @default(cuid())
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id])
  
  // External reference
  repositoryType  ProtocolRepository  // PROTOCOLS_IO, NATURE_PROTOCOLS, JOVE, CUSTOM
  externalId      String
  externalUrl     String
  
  // Specificity
  section         String?         // Which section of protocol
  step            String?         // Which step
  version         String?
  
  // Verification
  accessStatus    AccessStatus
  lastVerified    DateTime?
}

// Code linking
model CodeAnchor {
  id              String   @id @default(cuid())
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id])
  
  // External reference
  repositoryType  CodeRepository  // GITHUB, GITLAB, BITBUCKET, ZENODO
  repositoryUrl   String
  commitHash      String?         // Specific commit
  tag             String?         // Release tag
  
  // Specificity
  filePath        String?         // Specific file
  lineRange       String?         // Line numbers
  function        String?         // Specific function/method
  
  // Environment
  language        String?
  dependencies    Json?           // requirements.txt, package.json, etc.
  dockerImage     String?         // Container for reproducibility
  
  // Verification
  accessStatus    AccessStatus
  lastVerified    DateTime?
  executableStatus ExecutableStatus? // UNTESTED, PASSES, FAILS
}

enum DataRepository {
  ZENODO
  FIGSHARE
  DRYAD
  OSF
  DATAVERSE
  PANGAEA       // Earth science
  GENBANK       // Genetics
  PDB           // Protein structures
  ICPSR         // Social science
  CUSTOM
}

enum CodeRepository {
  GITHUB
  GITLAB
  BITBUCKET
  ZENODO
  CODE_OCEAN
  BINDER
  CUSTOM
}
```

### 4.3 Grounding Status Computation

```typescript
// Compute overall grounding status for a claim
function computeGroundingStatus(claim: Claim): GroundingStatus {
  const anchors = [
    ...claim.datasetAnchors,
    ...claim.codeAnchors,
    ...claim.protocolAnchors,
    ...claim.modelAnchors
  ];
  
  if (anchors.length === 0) {
    return GroundingStatus.UNGROUNDED;
  }
  
  const statuses = anchors.map(a => a.accessStatus);
  
  if (statuses.every(s => s === AccessStatus.ACCESSIBLE)) {
    // Check if any have been independently verified
    const reproductions = claim.reproductions;
    if (reproductions.some(r => r.status === 'SUCCESS')) {
      return GroundingStatus.REPRODUCED;
    }
    if (reproductions.some(r => r.status === 'FAILED')) {
      return GroundingStatus.CONTESTED;
    }
    return GroundingStatus.VERIFIED;
  }
  
  if (statuses.some(s => s === AccessStatus.UNAVAILABLE)) {
    return GroundingStatus.FAILED;
  }
  
  return GroundingStatus.GROUNDED;
}
```

---

## 5. Computational Reproducibility Infrastructure

### 5.1 The Execution Layer

For computational claims, the platform needs to support *actually running code* to verify claims:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 COMPUTATIONAL VERIFICATION PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CODE RETRIEVAL                                                          │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │ Fetch from GitHub/GitLab at specific commit                     │    │
│     │ Verify hash matches claimed version                             │    │
│     │ Check all dependencies available                                │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  2. ENVIRONMENT CONSTRUCTION                                                │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │ Build container from specification (Docker/Singularity)         │    │
│     │ Or: Use pre-built environment (Binder, Code Ocean)              │    │
│     │ Install exact dependency versions                               │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  3. DATA RETRIEVAL                                                          │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │ Fetch dataset from repository                                   │    │
│     │ Verify hash matches claimed version                             │    │
│     │ Check data format compatibility                                 │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  4. EXECUTION                                                               │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │ Run specified analysis script                                   │    │
│     │ Capture stdout, stderr, exit code                               │    │
│     │ Record resource usage (time, memory)                            │    │
│     │ Save all outputs                                                │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  5. VERIFICATION                                                            │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │ Compare outputs to claimed results                              │    │
│     │ Statistical comparison for stochastic results                   │    │
│     │ Generate verification report                                    │    │
│     │ Update claim status                                             │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Integration Options

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Binder integration** | Easy, established | Limited compute, timeout limits | Quick verification |
| **Code Ocean** | Full reproducibility, persistent | Cost, learning curve | Published papers |
| **Self-hosted runners** | Full control, no limits | Infrastructure burden | Heavy compute |
| **Cloud functions** | Scalable, pay-per-use | Cold start, time limits | Batch verification |
| **Manual verification** | Human judgment, complex cases | Slow, doesn't scale | Edge cases |

### 5.3 Verification Report Model

```typescript
model VerificationReport {
  id              String   @id @default(cuid())
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id])
  
  // Execution metadata
  executedAt      DateTime
  executedBy      String   // System or user ID
  executionTime   Int      // Seconds
  computeEnvironment String // Description of environment
  
  // Inputs
  codeCommit      String
  datasetVersion  String
  environmentSpec Json     // Full environment specification
  
  // Outputs
  exitCode        Int
  stdout          String
  stderr          String
  outputFiles     Json     // List of output files with hashes
  
  // Comparison
  claimedResult   Json     // What the paper claimed
  actualResult    Json     // What we got
  matchStatus     MatchStatus // EXACT, APPROXIMATE, DIFFERENT, ERROR
  matchDetails    String   // Explanation of comparison
  
  // Verdict
  verdict         VerificationVerdict // VERIFIED, PARTIALLY_VERIFIED, NOT_VERIFIED, INCONCLUSIVE
  notes           String?
}

enum VerificationVerdict {
  VERIFIED            // Results match claimed
  PARTIALLY_VERIFIED  // Some results match, some differ
  NOT_VERIFIED        // Results don't match
  INCONCLUSIVE        // Couldn't determine (e.g., stochastic, different conditions)
  ERROR               // Execution failed
}
```

---

## 6. The Replication Tracking System

### 6.1 Replication as First-Class Object

```typescript
model Replication {
  id              String   @id @default(cuid())
  
  // What's being replicated
  originalClaimId String
  originalClaim   Claim    @relation("ReplicatedClaim", fields: [originalClaimId], references: [id])
  
  // The replication study
  replicationStudyDOI String?
  replicationStudyUrl String?
  replicationClaimId  String?
  replicationClaim    Claim?   @relation("ReplicationClaim", fields: [replicationClaimId], references: [id])
  
  // Replication type
  replicationType ReplicationType
  
  // Method comparison
  methodSimilarity    MethodSimilarity
  methodDifferences   String?          // Free text description
  
  // Results
  replicationStatus   ReplicationStatus
  effectSizeOriginal  Float?
  effectSizeReplication Float?
  statisticalComparison Json?          // Detailed comparison
  
  // Metadata
  registeredAt    DateTime @default(now())
  registeredBy    User     @relation(fields: [registeredById], references: [id])
  registeredById  BigInt
  
  // Discussion
  deliberationId  String?
  deliberation    Deliberation? @relation(fields: [deliberationId], references: [id])
}

enum ReplicationType {
  DIRECT          // Same methods, same population
  CLOSE           // Same methods, different population
  CONCEPTUAL      // Different methods, same construct
  EXTENSION       // Original + additional conditions
}

enum MethodSimilarity {
  IDENTICAL       // Exact same protocol
  VERY_SIMILAR    // Minor differences
  SIMILAR         // Same general approach
  DIFFERENT       // Substantially different
}

enum ReplicationStatus {
  SUCCESSFUL      // Effect replicated
  PARTIAL         // Some effects replicated
  FAILED          // Effect did not replicate
  INCONCLUSIVE    // Underpowered or ambiguous
  REVERSED        // Opposite effect found
}
```

### 6.2 Replication Dashboard

For each empirical claim, the platform can show:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLAIM: "Priming with achievement words improves test performance"           │
│ Original: Bargh et al. (1996)                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ REPLICATION STATUS SUMMARY                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  Total replications: 12                                                 │ │
│ │  ✓ Successful: 3 (25%)                                                  │ │
│ │  ~ Partial: 2 (17%)                                                     │ │
│ │  ✗ Failed: 5 (42%)                                                      │ │
│ │  ? Inconclusive: 2 (17%)                                                │ │
│ │                                                                         │ │
│ │  Meta-analytic effect: d = 0.12 [95% CI: -0.05, 0.29]                   │ │
│ │  Heterogeneity: I² = 68%                                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ REPLICATION TIMELINE                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 1996 ●───────────────────────────────────────────────────────────────   │ │
│ │      │ Original (d = 0.82)                                              │ │
│ │ 2008 │     ✓ Direct replication (d = 0.71)                              │ │
│ │ 2012 │           ✗ Failed (d = 0.05)                                    │ │
│ │ 2014 │               ✗ Multi-lab (d = 0.01)                             │ │
│ │ 2016 │                   ~ Partial (d = 0.23)                           │ │
│ │ 2018 │                       ✗ Pre-registered (d = -0.08)               │ │
│ │ ...  │                                                                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [View all replications] [Register new replication] [Discuss]               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Automated Replication Detection

The system can scan new publications for potential replications:

```typescript
interface ReplicationCandidate {
  newPaperId: string;
  originalClaimId: string;
  similarityScore: number;
  matchedElements: {
    hypothesis: boolean;
    method: boolean;
    population: boolean;
    measures: boolean;
  };
  suggestedReplicationType: ReplicationType;
}

// Scan new paper for potential replications
async function detectReplications(paper: Paper): Promise<ReplicationCandidate[]> {
  const claims = await extractClaims(paper);
  const candidates: ReplicationCandidate[] = [];
  
  for (const claim of claims) {
    // Find similar claims in database
    const similar = await findSimilarClaims(claim, {
      threshold: 0.8,
      mustBeEmpirical: true
    });
    
    for (const match of similar) {
      // Check if this looks like a replication
      const comparison = await compareMethodology(claim, match);
      if (comparison.isLikelyReplication) {
        candidates.push({
          newPaperId: paper.id,
          originalClaimId: match.id,
          similarityScore: comparison.score,
          matchedElements: comparison.elements,
          suggestedReplicationType: comparison.type
        });
      }
    }
  }
  
  return candidates;
}
```

---

## 7. Statistical Verification Layer

### 7.1 Automated Statistical Checks

For claims involving statistical inference, the platform can run automated checks:

```typescript
interface StatisticalCheck {
  checkType: StatCheckType;
  passed: boolean;
  details: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

enum StatCheckType {
  // Data availability
  DATA_ACCESSIBLE,
  DATA_COMPLETE,
  
  // Analysis verification
  TEST_REPRODUCIBLE,
  EFFECT_SIZE_MATCHES,
  P_VALUE_MATCHES,
  CI_MATCHES,
  
  // Methodological checks
  POWER_ADEQUATE,
  ASSUMPTIONS_MET,
  MULTIPLE_COMPARISONS_CORRECTED,
  
  // Red flags
  ROUND_NUMBERS,        // Suspicious round p-values
  IMPOSSIBLE_STATS,     // e.g., F(2,20) = 45, p = 0.04
  GRIM_TEST,           // Granularity-inconsistent mean
  SPRITE_TEST,         // SPRITE inconsistency
  
  // Meta-analytic
  PUBLICATION_BIAS,
  HETEROGENEITY_FLAG,
}

// Run automated statistical checks on a claim
async function runStatisticalChecks(claim: Claim): Promise<StatisticalCheck[]> {
  const checks: StatisticalCheck[] = [];
  
  // Extract reported statistics
  const reportedStats = extractStatistics(claim);
  
  // Check for impossible statistics
  for (const stat of reportedStats) {
    if (stat.type === 'F_TEST') {
      const possible = checkFTestPossible(stat.df1, stat.df2, stat.f, stat.p);
      if (!possible) {
        checks.push({
          checkType: StatCheckType.IMPOSSIBLE_STATS,
          passed: false,
          details: `F(${stat.df1}, ${stat.df2}) = ${stat.f} cannot yield p = ${stat.p}`,
          severity: 'ERROR'
        });
      }
    }
    
    if (stat.type === 'MEAN') {
      const grimPasses = grimTest(stat.mean, stat.n, stat.decimals);
      if (!grimPasses) {
        checks.push({
          checkType: StatCheckType.GRIM_TEST,
          passed: false,
          details: `Mean ${stat.mean} with N=${stat.n} fails GRIM test`,
          severity: 'WARNING'
        });
      }
    }
  }
  
  // If data is available, reproduce analysis
  if (claim.datasetAnchors.length > 0) {
    const reproResult = await reproduceAnalysis(claim);
    checks.push({
      checkType: StatCheckType.TEST_REPRODUCIBLE,
      passed: reproResult.matches,
      details: reproResult.summary,
      severity: reproResult.matches ? 'INFO' : 'ERROR'
    });
  }
  
  return checks;
}
```

### 7.2 Statistical Claim Enrichment

When users submit statistical claims, the platform can:

1. **Parse and validate** the statistical statement
2. **Compute derived measures** (e.g., effect size from t and df)
3. **Check consistency** between reported values
4. **Flag potential issues**
5. **Link to verification data** if available

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLAIM: "Treatment group showed significantly higher scores, t(48) = 2.34,   │
│         p = .023, d = 0.67"                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PARSED STATISTICS                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Test type: Independent samples t-test                                   │ │
│ │ Degrees of freedom: 48 (implies N ≈ 50)                                 │ │
│ │ Test statistic: t = 2.34                                                │ │
│ │ p-value: 0.023 (two-tailed)                                             │ │
│ │ Effect size: Cohen's d = 0.67 (medium-large)                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ AUTOMATED CHECKS                                                            │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ✓ Statistics internally consistent                                      │ │
│ │ ✓ Effect size computable from t and df: d_computed = 0.66 ≈ 0.67 ✓      │ │
│ │ ⚠ Power for this effect: ~60% (potentially underpowered)                │ │
│ │ ○ Data not linked (cannot verify)                                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ CONTEXT                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Similar effects in literature: d̄ = 0.45 [0.32, 0.58] (k = 23 studies)  │ │
│ │ This effect is above average for the field                              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [Link data] [Challenge statistics] [View replications]                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Integration Ecosystem

### 8.1 Data Repositories

| Repository | Domain | Integration Type | Data |
|------------|--------|------------------|------|
| **Zenodo** | General | DOI-based linking | Any |
| **Figshare** | General | DOI + API | Any |
| **Dryad** | General | DOI + API | Any |
| **OSF** | General + preregistration | API | Any + prereg |
| **Dataverse** | Social science | DOI + API | Tabular |
| **GenBank** | Genetics | Accession numbers | Sequences |
| **PDB** | Structural biology | PDB IDs | Structures |
| **PANGAEA** | Earth science | DOI | Geospatial |
| **ICPSR** | Social science | Study numbers | Survey |
| **UK Data Service** | UK social science | Study numbers | Survey |
| **EUDAT B2SHARE** | European | DOI | Any |

### 8.2 Code Repositories

| Repository | Integration | Features |
|------------|-------------|----------|
| **GitHub** | Full API | Issues, commits, releases |
| **GitLab** | Full API | CI/CD integration |
| **Bitbucket** | API | Basic linking |
| **Code Ocean** | API | Executable capsules |
| **Binder** | URL-based | Live notebooks |
| **Software Heritage** | SWHID | Archival |

### 8.3 Protocol Repositories

| Repository | Domain | Integration |
|------------|--------|-------------|
| **protocols.io** | Life sciences | DOI + API |
| **JoVE** | Life sciences | Video protocols |
| **Nature Protocols** | Life sciences | DOI |
| **STAR Protocols** | Life sciences | DOI |
| **Protocol Exchange** | General | DOI |

### 8.4 Pre-registration Registries

| Registry | Domain | Integration |
|----------|--------|-------------|
| **OSF Registries** | General | API |
| **AsPredicted** | General | URL |
| **ClinicalTrials.gov** | Medicine | NCT numbers |
| **PROSPERO** | Systematic reviews | Registry ID |
| **EGAP** | Political science | Registration ID |
| **AEA RCT Registry** | Economics | Registry ID |

### 8.5 Academic Infrastructure

| System | Integration Purpose |
|--------|---------------------|
| **Crossref** | Paper DOI resolution, citation linking |
| **ORCID** | Researcher identity |
| **OpenAlex** | Bibliographic data |
| **Semantic Scholar** | Paper metadata, citations |
| **arXiv/bioRxiv/medRxiv** | Preprint linking |
| **PubMed** | Medical literature |
| **Web of Science** | Citation data |
| **Scopus** | Citation data |

---

## 9. Discipline-Specific Modules

### 9.1 Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DISCIPLINE MODULE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CORE PLATFORM                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Claims, Arguments, Schemes, Dialogue, Releases                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                    ┌─────────┴─────────┐                                    │
│                    ▼                   ▼                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐                        │
│  │  STEM Grounding      │  │  HSS Grounding       │                        │
│  │  (data, code, repro) │  │  (texts, archives)   │                        │
│  └──────────────────────┘  └──────────────────────┘                        │
│           │                                                                 │
│     ┌─────┴─────┬─────────────┬─────────────┬─────────────┐                │
│     ▼           ▼             ▼             ▼             ▼                │
│ ┌────────┐ ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐              │
│ │ Life   │ │Physical│   │Computer│   │ Social │   │Medicine│              │
│ │Sciences│ │Sciences│   │Science │   │Sciences│   │        │              │
│ │ Module │ │ Module │   │ Module │   │ Module │   │ Module │              │
│ └────────┘ └────────┘   └────────┘   └────────┘   └────────┘              │
│                                                                             │
│ Each module provides:                                                       │
│ • Domain-specific claim types                                               │
│ • Specialized argument schemes                                              │
│ • Repository integrations                                                   │
│ • Verification rules                                                        │
│ • Visualization types                                                       │
│ • Community norms                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Life Sciences Module

```typescript
interface LifeSciencesModule {
  claimTypes: [
    'GENE_FUNCTION',
    'PROTEIN_INTERACTION',
    'PATHWAY_COMPONENT',
    'PHENOTYPE_ASSOCIATION',
    'DRUG_EFFECT',
    'DISEASE_MECHANISM',
    'EVOLUTIONARY_RELATIONSHIP',
  ];
  
  schemes: [
    'ArgumentFromKnockout',
    'ArgumentFromOverexpression',
    'ArgumentFromPharmacology',
    'ArgumentFromGWAS',
    'ArgumentFromPhylogeny',
    'ArgumentFromStructuralBiology',
  ];
  
  repositories: [
    'GenBank', 'UniProt', 'PDB', 'GEO', 'ArrayExpress',
    'BioStudies', 'PRIDE', 'MetaboLights'
  ];
  
  verificationRules: {
    sequenceClaimsMustLinkToGenBank: true,
    structureClaimsMustLinkToPDB: true,
    expressionClaimsMustLinkToGEO: true,
  };
  
  visualizations: [
    'SequenceAlignment',
    'PhylogeneticTree',
    'ProteinStructure',
    'PathwayDiagram',
    'GeneExpressionHeatmap',
  ];
}
```

### 9.3 Computer Science Module

```typescript
interface ComputerScienceModule {
  claimTypes: [
    'ALGORITHMIC_COMPLEXITY',
    'SYSTEM_PERFORMANCE',
    'ML_MODEL_ACCURACY',
    'SECURITY_VULNERABILITY',
    'FORMAL_PROOF',
    'BENCHMARK_RESULT',
  ];
  
  schemes: [
    'ArgumentFromComplexityAnalysis',
    'ArgumentFromBenchmark',
    'ArgumentFromAblation',
    'ArgumentFromFormalProof',
    'ArgumentFromUserStudy',
  ];
  
  repositories: [
    'GitHub', 'PapersWithCode', 'HuggingFace', 
    'Kaggle', 'OpenML', 'UCI ML Repository'
  ];
  
  verificationRules: {
    mlClaimsMustLinkToCode: true,
    benchmarksMustBeReproducible: true,
    modelsMusSpecifyHyperparameters: true,
    datasetsMustBeAccessible: true,
  };
  
  visualizations: [
    'BenchmarkComparison',
    'AblationTable',
    'ConfusionMatrix',
    'LearningCurve',
    'ArchitectureDiagram',
  ];
  
  // Special: ML reproducibility checklist
  mlReproducibilityChecklist: {
    randomSeeds: boolean,
    hyperparameterSearch: boolean,
    datasetSplits: boolean,
    computeEnvironment: boolean,
    trainingTime: boolean,
    modelCheckpoints: boolean,
  };
}
```

### 9.4 Physics Module

```typescript
interface PhysicsModule {
  claimTypes: [
    'THEORETICAL_PREDICTION',
    'EXPERIMENTAL_MEASUREMENT',
    'FUNDAMENTAL_CONSTANT',
    'PARTICLE_PROPERTY',
    'COSMOLOGICAL_PARAMETER',
    'MATERIAL_PROPERTY',
  ];
  
  schemes: [
    'ArgumentFromTheoreticaDerivation',
    'ArgumentFromExperiment',
    'ArgumentFromSimulation',
    'ArgumentFromSymmetry',
    'ArgumentFromDimensionalAnalysis',
  ];
  
  repositories: [
    'arXiv', 'HEPData', 'Zenodo', 'INSPIRE-HEP',
    'PDG (Particle Data Group)', 'NIST databases'
  ];
  
  verificationRules: {
    measurementsMustIncludeUncertainty: true,
    theoreticalDerivationsMustShowSteps: true,
    simulationsMustSpecifyParameters: true,
  };
  
  specialFeatures: {
    unitHandling: true,        // Automatic unit conversion
    uncertaintyPropagation: true,
    latexEquationRendering: true,
    feynmanDiagrams: true,
  };
}
```

### 9.5 Medicine/Clinical Module

```typescript
interface MedicineModule {
  claimTypes: [
    'TREATMENT_EFFICACY',
    'DIAGNOSTIC_ACCURACY',
    'RISK_FACTOR',
    'PROGNOSTIC_FACTOR',
    'ADVERSE_EVENT',
    'MECHANISM_OF_ACTION',
    'EPIDEMIOLOGICAL',
  ];
  
  schemes: [
    'ArgumentFromRCT',
    'ArgumentFromCohortStudy',
    'ArgumentFromCaseControl',
    'ArgumentFromMetaAnalysis',
    'ArgumentFromMechanisticEvidence',
  ];
  
  repositories: [
    'ClinicalTrials.gov', 'PROSPERO', 'Cochrane Library',
    'PubMed', 'MIMIC', 'UK Biobank'
  ];
  
  verificationRules: {
    rctsMustBeRegistered: true,
    systematicReviewsMustFollowPRISMA: true,
    observationalStudiesMustFollowSTROBE: true,
  };
  
  specialFeatures: {
    gradeEvidence: true,       // GRADE quality assessment
    riskOfBias: true,          // Cochrane RoB tool integration
    nntCalculation: true,      // Number needed to treat
    forestPlots: true,
  };
  
  // Evidence hierarchy visualization
  evidenceHierarchy: [
    'SystematicReviewOfRCTs',
    'IndividualRCT',
    'CohortStudy',
    'CaseControlStudy',
    'CaseSeries',
    'ExpertOpinion',
  ];
}
```

---

## 10. The "Picturing Face" Implementation

### 10.1 Connecting to Sellarsian Architecture

The existing Sellarsian framework distinguishes:
- **Signifying Face (Space of Reasons)**: Inferential relations, normative status, commitments
- **Picturing Face (Realm of Law)**: Causal correspondence, empirical outcomes

For STEM, the Picturing Face becomes fully operational:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DUAL CHARACTERIZATION FOR STEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SIGNIFYING FACE (Space of Reasons)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Inferential position: what follows from the claim                 │   │
│  │ • Commitment status: who endorses it                                │   │
│  │ • Attack status: undefeated, rebutted, undercut                     │   │
│  │ • Scheme compliance: which argument pattern                         │   │
│  │ • Critical questions: which CQs answered/open                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              │ Both faces characterize same claim           │
│                              │                                              │
│  PICTURING FACE (Realm of Law)                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Empirical grounding: linked data, code, protocols                 │   │
│  │ • Predictions: what the claim predicts should be observable         │   │
│  │ • Observations: what has been observed when tested                  │   │
│  │ • Picturing score: track record of prediction success               │   │
│  │ • Replication status: independent verification record               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  INTEGRATION                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ A claim is fully characterized when:                                │   │
│  │ • Its inferential role is specified (Signifying)                    │   │
│  │ • Its empirical grounding is linked (Picturing)                     │   │
│  │ • Its predictions are registered (Picturing)                        │   │
│  │ • Outcomes are tracked against predictions (Picturing)              │   │
│  │ • Discourse status is computed (Integration)                        │   │
│  │                                                                     │   │
│  │ The platform computes: "This claim is well-defended in argument     │   │
│  │ AND has good empirical track record" or "well-argued BUT            │   │
│  │ empirically contested"                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Prediction Registration

```typescript
model ClaimPrediction {
  id              String   @id @default(cuid())
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id])
  
  // The prediction
  predictionText  String          // Natural language description
  predictionType  PredictionType  // QUANTITATIVE, QUALITATIVE, TEMPORAL, etc.
  
  // Quantitative predictions
  predictedValue  Float?
  predictedRange  Json?           // { min, max, unit }
  confidenceLevel Float?          // Bayesian credence or frequentist CI
  
  // Testing conditions
  testConditions  String          // Under what conditions prediction applies
  testMethod      String?         // How to test
  
  // Status
  status          PredictionStatus // UNTESTED, CONFIRMED, DISCONFIRMED, PARTIAL
  
  // Linked outcome
  outcome         ClaimOutcome?
  
  // Metadata
  registeredAt    DateTime @default(now())
  registeredBy    User
}

model ClaimOutcome {
  id              String   @id @default(cuid())
  predictionId    String   @unique
  prediction      ClaimPrediction @relation(fields: [predictionId], references: [id])
  
  // The observed outcome
  observedValue   Float?
  observedResult  String
  outcomeData     DatasetAnchor?
  
  // Comparison
  matchStatus     MatchStatus  // EXACT, APPROXIMATE, DIFFERENT
  deviationMagnitude Float?   // How far from prediction
  
  // Source
  sourceStudyDOI  String?
  sourceClaimId   String?
  
  // Metadata
  recordedAt      DateTime @default(now())
  recordedBy      User
}
```

### 10.3 Picturing Score Computation

```typescript
interface PicturingScore {
  claimId: string;
  
  // Prediction track record
  totalPredictions: number;
  confirmedPredictions: number;
  disconfirmedPredictions: number;
  untestedPredictions: number;
  
  // Accuracy metrics
  predictionAccuracy: number;        // confirmed / (confirmed + disconfirmed)
  calibration: number;               // How well confidence matches accuracy
  
  // Replication record
  totalReplications: number;
  successfulReplications: number;
  failedReplications: number;
  replicationRate: number;
  
  // Meta-analytic summary
  metaAnalyticEffect?: {
    estimate: number;
    ci: [number, number];
    heterogeneity: number;
  };
  
  // Overall picturing status
  overallStatus: 'WELL_GROUNDED' | 'PARTIALLY_GROUNDED' | 'CONTESTED' | 'UNGROUNDED';
}

function computePicturingScore(claim: Claim): PicturingScore {
  const predictions = claim.predictions;
  const replications = claim.replications;
  
  const confirmed = predictions.filter(p => p.status === 'CONFIRMED').length;
  const disconfirmed = predictions.filter(p => p.status === 'DISCONFIRMED').length;
  
  const successfulReps = replications.filter(r => r.status === 'SUCCESSFUL').length;
  const failedReps = replications.filter(r => r.status === 'FAILED').length;
  
  // Compute overall status
  let overallStatus: PicturingScore['overallStatus'];
  
  const predictionAccuracy = confirmed / (confirmed + disconfirmed) || 0;
  const replicationRate = successfulReps / (successfulReps + failedReps) || 0;
  
  if (predictionAccuracy > 0.8 && replicationRate > 0.8) {
    overallStatus = 'WELL_GROUNDED';
  } else if (predictionAccuracy > 0.5 || replicationRate > 0.5) {
    overallStatus = 'PARTIALLY_GROUNDED';
  } else if (failedReps > 0 || disconfirmed > 0) {
    overallStatus = 'CONTESTED';
  } else {
    overallStatus = 'UNGROUNDED';
  }
  
  return {
    claimId: claim.id,
    totalPredictions: predictions.length,
    confirmedPredictions: confirmed,
    disconfirmedPredictions: disconfirmed,
    untestedPredictions: predictions.filter(p => p.status === 'UNTESTED').length,
    predictionAccuracy,
    calibration: computeCalibration(predictions),
    totalReplications: replications.length,
    successfulReplications: successfulReps,
    failedReplications: failedReps,
    replicationRate,
    metaAnalyticEffect: computeMetaAnalysis(replications),
    overallStatus,
  };
}
```

---

## 11. New UI/UX Paradigms

### 11.1 The Empirical Claim Card

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─ EMPIRICAL ─┐  CLAIM C-4521                                               │
│ │ MEASUREMENT │                                                             │
│ └─────────────┘                                                             │
│                                                                             │
│ "The mean reaction time in the congruent condition was 423ms (SD = 67ms)"   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ SIGNIFYING FACE                 │ PICTURING FACE                        │ │
│ │                                 │                                       │ │
│ │ Argument status: DEFENDED       │ Data: ✓ Linked (OSF)                  │ │
│ │ Attacks: 2 (both answered)      │ Code: ✓ Linked (GitHub)               │ │
│ │ Commitments: 3 authors          │ Protocol: ✓ Linked (protocols.io)    │ │
│ │ CQs: 5/6 answered               │ Replications: 2 (1 ✓, 1 ~)            │ │
│ │                                 │ Verification: ✓ Reproducible          │ │
│ │ [View arguments]                │ [View data] [Run verification]        │ │
│ └─────────────────────────────────┴───────────────────────────────────────┘ │
│                                                                             │
│ From: Smith et al. (2024) "Attention and Response Time"                     │
│ DOI: 10.1234/example.2024.001                                               │
│                                                                             │
│ [Challenge] [Support] [Discuss] [Cite]                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 The Replication Timeline View

Visual representation of a claim's empirical history:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLAIM: "Ego depletion reduces self-control"                                 │
│ REPLICATION TIMELINE                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Effect Size                                                                 │
│ d = 1.0 │                                                                   │
│         │ ●                                                                 │
│ d = 0.8 │ │ Original                                                        │
│         │ │   (Baumeister, 1998)                                            │
│ d = 0.6 │ │         ●                                                       │
│         │ │         │ ● ●                                                   │
│ d = 0.4 │ │         │ │ │   ●                                               │
│         │ │         │ │ │   │ ● ●                                           │
│ d = 0.2 │─┼─────────┼─┼─┼───┼─┼─┼───────────────── Meta-analytic mean ───   │
│         │ │         │ │ │   │ │ │   ● ● ●                                   │
│ d = 0.0 │─┼─────────┼─┼─┼───┼─┼─┼───┼─┼─┼───────────────────────────────   │
│         │ │         │ │ │   │ │ │   │ │ │   ○ ○                             │
│ d =-0.2 │ │         │ │ │   │ │ │   │ │ │   │ │  Multi-lab                  │
│         │ │         │ │ │   │ │ │   │ │ │   │ │  (RRR, 2016)                │
│         └─┴─────────┴─┴─┴───┴─┴─┴───┴─┴─┴───┴─┴───────────────────────────  │
│          1998      2005    2010    2015    2020                             │
│                                                                             │
│ Legend: ● = Individual study, ○ = Failed replication, ─ = Meta-analytic CI  │
│                                                                             │
│ Summary: Initial strong effects (d ≈ 0.6) declined; multi-lab finds d ≈ 0   │
│ Current status: CONTESTED                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.3 The Data-Argument Link View

Showing how data connects to claims:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DATA-ARGUMENT TRACEABILITY                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   RAW DATA   │────▶│   ANALYSIS   │────▶│   RESULT     │                │
│  │              │     │              │     │              │                │
│  │ experiment_  │     │ analysis.R   │     │ t = 2.34     │                │
│  │ data.csv     │     │ line 45-67   │     │ p = .023     │                │
│  │              │     │              │     │              │                │
│  │ [View/DL]    │     │ [View code]  │     │ [View output]│                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                         │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CLAIM                                        │   │
│  │  "Treatment improved performance, t(48) = 2.34, p = .023"            │   │
│  │                                                                      │   │
│  │  Grounding status: VERIFIED ✓                                        │   │
│  │  Last verified: 2024-01-15 by ReproCheck Bot                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ARGUMENT                                      │   │
│  │  Scheme: Argument from Statistical Inference                         │   │
│  │  Status: DEFENDED (2 attacks answered)                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Governance & Quality Assurance

### 12.1 Verification Tiers

| Tier | Description | Who Can Grant | Badge |
|------|-------------|---------------|-------|
| **Unverified** | Claim entered, no verification | Default | ○ |
| **Self-Attested** | Author attests data/code available | Claim author | ◐ |
| **Community Verified** | Community member verified access | Any verified user | ◑ |
| **Computationally Verified** | Automated execution succeeded | System | ◕ |
| **Independently Replicated** | Independent replication published | Replicating team | ● |
| **Meta-Analytically Confirmed** | Consistent across multiple studies | Meta-analyst | ★ |

### 12.2 Domain Expert Roles

```typescript
model DomainExpert {
  id              String   @id @default(cuid())
  userId          BigInt
  user            User     @relation(fields: [userId], references: [id])
  
  // Expertise
  domain          String           // e.g., "cognitive psychology", "organic chemistry"
  subdomains      String[]
  
  // Verification
  verifiedBy      VerificationType // ORCID, INSTITUTIONAL, COMMUNITY
  credentials     Json             // Publications, h-index, institutional affiliation
  
  // Permissions
  canVerifyClaims boolean
  canModerate     boolean
  canApproveExperts boolean
  
  // Activity
  verificationsPerformed Int
  accuracy        Float            // Agreement with subsequent replications
}
```

### 12.3 Conflict of Interest Management

```typescript
model ConflictDeclaration {
  id              String   @id @default(cuid())
  userId          BigInt
  claimId         String
  
  conflictType    ConflictType  // AUTHOR, FUNDING, INSTITUTIONAL, COMMERCIAL, PERSONAL
  description     String
  
  // Impact on permissions
  cannotChallenge boolean
  cannotVerify    boolean
  mustDisclose    boolean
}
```

---

## 13. Adoption Strategy for STEM

### 13.1 Discipline Sequencing

| Phase | Disciplines | Rationale |
|-------|-------------|-----------|
| **Phase 1** | Psychology, Social Sciences | Replication crisis awareness; culture of open science |
| **Phase 2** | Neuroscience, Cognitive Science | Adjacent to psychology; data sharing norms emerging |
| **Phase 3** | Computer Science (ML/AI) | Strong reproducibility concerns; code-centric |
| **Phase 4** | Biomedical Sciences | Large field; regulatory interest in reproducibility |
| **Phase 5** | Physics, Chemistry | Mature data sharing; some reproducibility concerns |

### 13.2 Entry Points

| Entry Point | Description | Target Users |
|-------------|-------------|--------------|
| **Replication Registry** | Track and discuss replications | Researchers doing replications |
| **Pre-registration Discussion** | Discuss pre-registered studies before results | Methodology-focused researchers |
| **Paper Discussion** | Structured post-publication commentary | All researchers |
| **Meta-Analysis Workspace** | Collaborative meta-analytic synthesis | Meta-analysts |
| **Methods Debate** | Discuss methodological controversies | Methodologists |

### 13.3 Partnership Strategy

| Partner Type | Value Proposition | Examples |
|--------------|-------------------|----------|
| **Replication Initiatives** | Tracking infrastructure | Many Labs, SCORE, FORRT |
| **Open Science Organizations** | Community access | COS, BITSS, SIPS |
| **Data Repositories** | Integration | Zenodo, OSF, Figshare |
| **Journals** | Discussion layer | PLOS, eLife, F1000 |
| **Funding Agencies** | Transparency mandate | NIH, NSF, Wellcome |

---

## 14. Open Research Questions

### 14.1 Technical Questions

- How to handle massive datasets that can't be easily verified?
- How to deal with proprietary data that can't be shared?
- How to verify computational claims that require expensive resources?
- How to handle stochastic results that vary across runs?
- How to integrate with existing lab notebooks and workflows?

### 14.2 Social Questions

- Will researchers participate if it creates more work?
- How to handle adversarial verification attempts?
- How to manage conflicts between researchers and verifiers?
- How to prevent the system from being gamed?
- How to handle sensitive findings (e.g., drug efficacy) during verification?

### 14.3 Epistemological Questions

- What counts as "successful" replication?
- How to handle conceptual vs. direct replications?
- How to weigh different types of evidence?
- When does a claim become "settled"?
- How to handle paradigm shifts that invalidate prior claims?

---

## 15. Summary: The Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ACADEMIC AGORA FOR STEM: THE VISION                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FROM:                                                                      │
│  • Papers as static PDFs                                                    │
│  • Private peer review                                                      │
│  • Fragmented replication tracking                                          │
│  • Data/code sharing as afterthought                                        │
│  • Debates that repeat indefinitely                                         │
│                                                                             │
│  TO:                                                                        │
│  • Claims as addressable, linkable, verifiable objects                      │
│  • Public, structured, ongoing deliberation                                 │
│  • Integrated replication tracking with meta-analysis                       │
│  • Data/code as first-class grounding for claims                            │
│  • Cumulative progress visible in claim status                              │
│                                                                             │
│  THE PLATFORM PROVIDES:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  SIGNIFYING FACE          │  PICTURING FACE                        │   │
│  │  (Argument quality)       │  (Empirical quality)                   │   │
│  │                           │                                        │   │
│  │  • Scheme compliance      │  • Data/code linkage                   │   │
│  │  • Attack/defense status  │  • Verification status                 │   │
│  │  • Commitment tracking    │  • Replication record                  │   │
│  │  • CQ resolution          │  • Prediction track record             │   │
│  │                           │                                        │   │
│  │  → "Is this well-argued?" │  → "Does nature agree?"                │   │
│  │                           │                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  OUTCOME: Scientists can see at a glance:                                   │
│  • What claims are made in a field                                          │
│  • How well-argued each claim is                                            │
│  • How well each claim is empirically grounded                              │
│  • What the replication record shows                                        │
│  • Where controversies lie and why                                          │
│  • What would settle the controversy                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*This document explores what Academic Agora would need to become to serve STEM disciplines. The architectural extensions are substantial but build on the existing foundation. The core insight is that STEM discourse requires not just argumentation about claims but **verification** of the empirical grounding that makes claims testable.*

---

## Appendix: Comparison to Existing Reproducibility Infrastructure

| System | What It Does | What Agora Adds |
|--------|--------------|-----------------|
| **OSF** | Project management, pre-registration | Structured discourse about registered projects |
| **Code Ocean** | Executable code capsules | Link execution to specific claims and arguments |
| **ReplicationWiki** | Catalog of replications | Structured deliberation about replication results |
| **PubPeer** | Post-publication comments | Typed arguments, scheme-based challenges, integration with data |
| **Curate Science** | Track replications and effects | Full deliberation layer, meta-analytic synthesis |
| **Papers With Code** | Link papers to code | Verification pipeline, claim-level code linking |

**Agora's unique contribution**: Integrating *structured discourse* with *empirical verification*—making the relationship between arguments and evidence explicit, traceable, and cumulative.
