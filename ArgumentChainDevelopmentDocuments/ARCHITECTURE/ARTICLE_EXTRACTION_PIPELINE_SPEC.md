# Article-to-Argument Extraction Pipeline

## Technical Specification - Part 1: Architecture & Data Model

**Version:** 0.1 (Draft)  
**Last Updated:** December 15, 2025  
**Scope:** Bidirectional claim/argument extraction from Article objects  
**Prerequisite Reading:** ARTICLE_SYSTEM_ARCHITECTURE.md, ASPIC_SYSTEM_ARCHITECTURE.md

---

## Table of Contents (Full Document)

### Part 1: Architecture & Data Model
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Data Model Extensions](#4-data-model-extensions)
5. [Extraction Pipeline Stages](#5-extraction-pipeline-stages)

### Part 2: Extraction Engine Design
6. Claim Detection & Extraction
7. Argument Structure Inference
8. Scheme Recognition
9. Evidence & Citation Linking

### Part 3: Ontology Conversion & Export
10. AIF Conversion Layer
11. ASPIC+ Theory Generation
12. CEG (Carneades Evidence Graph) Export
13. Interoperability Standards

### Part 4: User Interface & Workflows
14. Extraction UI Components
15. Human-in-the-Loop Verification
16. Integration with ArticleReaderWithPins

---

## 1. Executive Summary

### 1.1 Vision

Transform Mesh from a platform where **arguments exist only through manual construction** to one where **arguments can be discovered, extracted, and converted** from existing content—particularly Article objects.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE → TARGET STATE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CURRENT:                                                                    │
│  ┌────────────┐                      ┌────────────────────────────┐         │
│  │  Article   │                      │     Deliberation           │         │
│  │  (prose)   │     MANUAL ONLY      │  ┌───────┐  ┌──────────┐  │         │
│  │            │  ─────────────────▶  │  │ Claim │──│ Argument │  │         │
│  │  No struct │                      │  └───────┘  └──────────┘  │         │
│  │  reasoning │                      │                            │         │
│  └────────────┘                      └────────────────────────────┘         │
│                                                                              │
│  TARGET:                                                                     │
│  ┌────────────┐                      ┌────────────────────────────┐         │
│  │  Article   │                      │     Deliberation           │         │
│  │  (prose)   │     EXTRACTION       │  ┌───────┐  ┌──────────┐  │         │
│  │            │  ═══════════════▶    │  │ Claim │──│ Argument │  │         │
│  │  astJson   │     PIPELINE         │  └───────┘  └──────────┘  │         │
│  │            │                      │        ▲                   │         │
│  └────────────┘                      └────────┼───────────────────┘         │
│        ▲                                      │                              │
│        │              ◀═══════════════════════╯                              │
│        │                  BIDIRECTIONAL                                      │
│        │               (Thesis → Article)                                    │
│        ▼                                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    ONTOLOGY EXPORT LAYER                                │ │
│  │                                                                         │ │
│  │   ┌─────────┐   ┌───────────┐   ┌─────────┐   ┌──────────────────────┐ │ │
│  │   │   AIF   │   │  ASPIC+   │   │   CEG   │   │  Other (OWL, JSON-LD)│ │ │
│  │   │  Graph  │   │  Theory   │   │  Graph  │   │                      │ │ │
│  │   └─────────┘   └───────────┘   └─────────┘   └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Capabilities

| Capability | Description |
|------------|-------------|
| **Claim Extraction** | Identify and extract claim-like statements from article prose |
| **Argument Discovery** | Infer premise-conclusion structures from extracted claims |
| **Scheme Recognition** | Detect which Walton argumentation scheme(s) an argument instantiates |
| **Evidence Linking** | Connect claims to citations/sources already in the article |
| **Anchor Preservation** | Maintain DOM-level anchors linking extracted claims to source text |
| **Ontology Export** | Convert extracted structures to AIF, ASPIC+, CEG, and other standards |
| **Human Verification** | UI for reviewing, correcting, and approving extractions |
| **Bidirectional Sync** | Changes to arguments update article annotations and vice versa |

### 1.3 Design Principles

1. **Anchor-First**: Every extracted claim maintains a precise link to its source text position
2. **Progressive Confidence**: Extraction confidence scores flow through the entire pipeline
3. **Human-in-the-Loop**: AI-assisted extraction with mandatory human verification for publication
4. **Standard Ontologies**: Native support for AIF, ASPIC+, and CEG from the ground up
5. **Minimal Schema Changes**: Extend existing models rather than replacing them

---

## 2. Problem Statement

### 2.1 The Gap in Current Mesh Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CURRENT CONTENT FLOW IN MESH                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Article System                          Deliberation System                 │
│  ─────────────────                       ─────────────────────               │
│                                                                              │
│  ┌─────────────────┐                     ┌─────────────────────┐            │
│  │ TipTap Editor   │                     │  Claim Construction  │            │
│  │                 │                     │                      │            │
│  │ • Rich text     │      ──────▶        │  • Manual creation   │            │
│  │ • astJson       │    (deliberation    │  • DialogueMove      │            │
│  │ • No structure  │      panel only)    │  • No source anchor  │            │
│  └─────────────────┘                     └─────────────────────┘            │
│          │                                          │                        │
│          ▼                                          ▼                        │
│  ┌─────────────────┐                     ┌─────────────────────┐            │
│  │ CommentThread   │                     │  Argument Builder    │            │
│  │                 │       NO LINK       │                      │            │
│  │ • Anchor-based  │    ◀──────────▶     │  • Premises → Concl  │            │
│  │ • DOM path      │                     │  • Scheme annotation │            │
│  │ • No claim link │                     │  • No text anchor    │            │
│  └─────────────────┘                     └─────────────────────┘            │
│                                                                              │
│  GAP: Articles contain rich argumentative content, but there's no           │
│       pipeline to extract claims/arguments while preserving text anchors.   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Why This Matters

| Stakeholder | Current Pain | Extraction Pipeline Value |
|-------------|--------------|---------------------------|
| **Researcher** | Must manually re-create claims from papers they read | Extract claims directly from uploaded articles |
| **Author** | Writes articles but deliberation is disconnected | Article prose auto-populates deliberation |
| **Reviewer** | Comments on text, but comments aren't structured | Annotations can become formal claims/attacks |
| **Platform** | Rich content exists but isn't machine-readable | AIF/ASPIC+ exports for analysis tools |

### 2.3 Existing Infrastructure to Leverage

| Component | Current Use | Extraction Pipeline Use |
|-----------|-------------|-------------------------|
| `Article.astJson` | TipTap document AST | Source for text extraction |
| `CommentThread.anchor` | DOM path for annotations | Model for claim text anchors |
| `Claim` model | Manual claim storage | Storage for extracted claims |
| `ArgumentPremise` | Links claims to arguments | Link extracted premises |
| `ArgumentScheme` | Walton scheme definitions | Scheme recognition targets |
| `Citation` model | Links sources to targets | Evidence for extracted claims |
| `Source` model | External source metadata | Link to article as source |

---

## 3. System Architecture Overview

### 3.1 High-Level Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXTRACTION PIPELINE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         INPUT LAYER                                    │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Article   │  │ LibraryPost │  │ PDF (future)│  │  Web URL    │  │  │
│  │  │  (astJson)  │  │   (Stack)   │  │             │  │  (future)   │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │  │
│  └─────────┼────────────────┼────────────────┼────────────────┼─────────┘  │
│            │                │                │                │             │
│            └────────────────┴────────────────┴────────────────┘             │
│                                     │                                        │
│                                     ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      EXTRACTION ENGINE                                 │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  STAGE 1: TEXT PREPROCESSING                                    │  │  │
│  │  │  • AST → plaintext with position mapping                        │  │  │
│  │  │  • Sentence boundary detection                                  │  │  │
│  │  │  • Section/paragraph structure preservation                     │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                              │                                         │  │
│  │                              ▼                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  STAGE 2: CLAIM DETECTION                                       │  │  │
│  │  │  • Claim indicator detection (hedges, assertions, conclusions)  │  │  │
│  │  │  • Named entity + relation extraction                           │  │  │
│  │  │  • Confidence scoring per candidate claim                       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                              │                                         │  │
│  │                              ▼                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  STAGE 3: ARGUMENT STRUCTURE INFERENCE                          │  │  │
│  │  │  • Premise-conclusion relation detection                        │  │  │
│  │  │  • Discourse connective analysis (therefore, because, since...) │  │  │
│  │  │  • Implicit premise reconstruction (enthymeme detection)        │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                              │                                         │  │
│  │                              ▼                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  STAGE 4: SCHEME RECOGNITION                                    │  │  │
│  │  │  • Match argument patterns to Walton scheme templates           │  │  │
│  │  │  • Multi-scheme classification with confidence                  │  │  │
│  │  │  • Critical question generation                                 │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                              │                                         │  │
│  │                              ▼                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  STAGE 5: EVIDENCE & CITATION LINKING                           │  │  │
│  │  │  • Match claims to inline citations                             │  │  │
│  │  │  • Link to Source model via DOI/URL                             │  │  │
│  │  │  • Evidence type classification                                 │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                              │                                         │  │
│  │                              ▼                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  STAGE 6: ANCHOR GENERATION                                     │  │  │
│  │  │  • Map extracted claims back to AST positions                   │  │  │
│  │  │  • Generate Anchor objects (startPath, endPath, offsets)        │  │  │
│  │  │  • Handle claim spans across multiple DOM nodes                 │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     VERIFICATION LAYER                                 │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  ExtractionJob                                                   │  │  │
│  │  │  • Stores raw extraction results                                 │  │  │
│  │  │  • Status: PENDING → IN_REVIEW → APPROVED → PUBLISHED           │  │  │
│  │  │  • Tracks human edits and corrections                            │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Human-in-the-Loop UI                                            │  │  │
│  │  │  • Review extracted claims in ArticleReaderWithPins context      │  │  │
│  │  │  • Accept / Reject / Edit individual claims                      │  │  │
│  │  │  • Adjust argument structure and scheme assignments              │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      OUTPUT LAYER                                      │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Claim     │  │  Argument   │  │ ArticleClaim│  │  Ontology   │  │  │
│  │  │  (Prisma)   │  │  (Prisma)   │  │  Anchor     │  │   Export    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │         │               │               │               │             │  │
│  │         ▼               ▼               ▼               ▼             │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │                    DELIBERATION                                │   │  │
│  │  │  (extracted claims/arguments now part of structured debate)    │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │                    AIF / ASPIC+ / CEG EXPORT                   │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Text Preprocessor** | Convert astJson → sentences with position maps | TypeScript, AST traversal |
| **Claim Detector** | Identify claim-like statements | LLM (GPT-4/Claude) + heuristics |
| **Argument Assembler** | Infer premise→conclusion structures | LLM + discourse analysis |
| **Scheme Classifier** | Match to Walton schemes | ML classifier + rule-based |
| **Evidence Linker** | Connect claims to citations | Reference parsing, DOI lookup |
| **Anchor Generator** | Create DOM path anchors | AST position tracking |
| **Verification UI** | Human review interface | React, extends ArticleReader |
| **Ontology Exporter** | Convert to AIF/ASPIC+/CEG | TypeScript serializers |

---

## 4. Data Model Extensions

### 4.1 New Models for Extraction Pipeline

```prisma
// ============================================================
// EXTRACTION JOB - Tracks extraction workflow state
// ============================================================

enum ExtractionJobStatus {
  QUEUED          // Job created, awaiting processing
  PROCESSING      // Extraction engine running
  PENDING_REVIEW  // Extraction complete, awaiting human review
  IN_REVIEW       // Human reviewer actively working
  APPROVED        // Human approved, ready to publish
  PUBLISHED       // Claims/arguments created in deliberation
  REJECTED        // Human rejected extraction
  FAILED          // Extraction engine error
}

model ExtractionJob {
  id            String              @id @default(cuid())
  
  // Source document
  sourceType    String              // 'article' | 'libraryPost' | 'pdf'
  sourceId      String              // Article.id, LibraryPost.id, etc.
  
  // Target deliberation
  deliberationId String?            // Optional: pre-specified target
  
  // Job metadata
  status        ExtractionJobStatus @default(QUEUED)
  startedAt     DateTime?
  completedAt   DateTime?
  error         String?             @db.Text
  
  // Extraction configuration
  configJson    Json?               // { model: 'gpt-4', sensitivity: 0.7, ... }
  
  // Raw extraction results (before human review)
  rawResultJson Json?               // Full extraction output
  
  // Human review tracking
  reviewerId    String?
  reviewStartedAt DateTime?
  reviewCompletedAt DateTime?
  reviewNotes   String?             @db.Text
  
  // Statistics
  claimsExtracted     Int           @default(0)
  claimsApproved      Int           @default(0)
  claimsRejected      Int           @default(0)
  claimsModified      Int           @default(0)
  argumentsExtracted  Int           @default(0)
  argumentsApproved   Int           @default(0)
  
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  createdById   String
  
  // Relations
  extractedClaims   ExtractedClaim[]
  extractedArguments ExtractedArgument[]
  
  @@index([sourceType, sourceId])
  @@index([status])
  @@index([deliberationId])
  @@index([createdById])
}

// ============================================================
// EXTRACTED CLAIM - Pre-approval claim with source anchor
// ============================================================

enum ExtractedClaimStatus {
  PENDING     // Awaiting review
  APPROVED    // Human approved, will create Claim
  REJECTED    // Human rejected
  MODIFIED    // Human edited before approval
  MERGED      // Merged with another extracted claim
  PUBLISHED   // Claim entity created
}

model ExtractedClaim {
  id              String               @id @default(cuid())
  jobId           String
  
  // Claim content
  text            String               @db.Text
  normalizedText  String?              @db.Text  // Cleaned/standardized version
  
  // Source anchor (reuses Anchor type from CommentThread)
  anchorJson      Json                 // { startPath, startOffset, endPath, endOffset }
  sourceText      String               @db.Text  // Original text span from article
  
  // Extraction confidence
  confidence      Float                @default(0.5)
  extractorModel  String?              // 'gpt-4', 'claude-3', 'rule-based'
  
  // Classification
  claimType       String?              // 'assertion', 'hypothesis', 'conclusion', 'premise'
  isImplicit      Boolean              @default(false)  // Reconstructed implicit claim
  
  // Review status
  status          ExtractedClaimStatus @default(PENDING)
  reviewNote      String?              @db.Text
  modifiedText    String?              @db.Text  // Human-edited version
  
  // Links
  mergedIntoId    String?              // If MERGED, points to surviving claim
  publishedClaimId String?             // After PUBLISHED, links to Claim.id
  
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  
  // Relations
  job             ExtractionJob        @relation(fields: [jobId], references: [id], onDelete: Cascade)
  mergedInto      ExtractedClaim?      @relation("ClaimMerge", fields: [mergedIntoId], references: [id])
  mergedFrom      ExtractedClaim[]     @relation("ClaimMerge")
  
  asPremise       ExtractedArgumentPremise[]
  asConclusion    ExtractedArgument[]  @relation("ExtractedConclusion")
  evidenceLinks   ExtractedEvidence[]
  
  @@index([jobId])
  @@index([status])
  @@index([publishedClaimId])
}

// ============================================================
// EXTRACTED ARGUMENT - Pre-approval argument structure
// ============================================================

enum ExtractedArgumentStatus {
  PENDING
  APPROVED
  REJECTED
  MODIFIED
  PUBLISHED
}

model ExtractedArgument {
  id              String                  @id @default(cuid())
  jobId           String
  
  // Argument structure
  conclusionId    String                  // ExtractedClaim.id
  
  // Scheme classification
  primarySchemeId String?                 // ArgumentScheme.id (best match)
  schemeConfidence Float?
  alternativeSchemes Json?                // [{ schemeId, confidence }, ...]
  
  // Extraction metadata
  confidence      Float                   @default(0.5)
  extractorModel  String?
  inferenceText   String?                 @db.Text  // Warrant/inference explanation
  
  // Discourse indicators found
  discourseMarkers Json?                  // ['therefore', 'because', ...] with positions
  
  // Review status
  status          ExtractedArgumentStatus @default(PENDING)
  reviewNote      String?                 @db.Text
  
  // Published link
  publishedArgumentId String?             // After PUBLISHED, links to Argument.id
  
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  
  // Relations
  job             ExtractionJob           @relation(fields: [jobId], references: [id], onDelete: Cascade)
  conclusion      ExtractedClaim          @relation("ExtractedConclusion", fields: [conclusionId], references: [id], onDelete: Cascade)
  premises        ExtractedArgumentPremise[]
  
  @@index([jobId])
  @@index([conclusionId])
  @@index([status])
}

model ExtractedArgumentPremise {
  id              String            @id @default(cuid())
  argumentId      String
  claimId         String
  order           Int               @default(0)
  isImplicit      Boolean           @default(false)  // Reconstructed premise
  
  argument        ExtractedArgument @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  claim           ExtractedClaim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  @@unique([argumentId, claimId])
  @@index([argumentId])
  @@index([claimId])
}

// ============================================================
// EXTRACTED EVIDENCE - Links claims to citations in source
// ============================================================

model ExtractedEvidence {
  id              String          @id @default(cuid())
  claimId         String
  
  // Citation reference in source document
  citationText    String?         // "[Smith 2023]" as it appears
  citationAnchor  Json?           // Anchor to citation in source
  
  // Resolved source (if found)
  sourceId        String?         // Source.id if matched
  doi             String?         // DOI if extracted
  url             String?         // URL if extracted
  
  // Evidence classification
  evidenceType    String?         // 'citation', 'quotation', 'data', 'example'
  confidence      Float           @default(0.5)
  
  createdAt       DateTime        @default(now())
  
  claim           ExtractedClaim  @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  @@index([claimId])
  @@index([sourceId])
}

// ============================================================
// ARTICLE CLAIM ANCHOR - Persistent link between Claim and Article text
// ============================================================

model ArticleClaimAnchor {
  id            String    @id @default(cuid())
  articleId     String
  claimId       String
  
  // Anchor data (same structure as CommentThread.anchor)
  anchorJson    Json      // { startPath, startOffset, endPath, endOffset }
  
  // Source text at time of extraction (for drift detection)
  sourceText    String    @db.Text
  
  // Versioning for article updates
  articleRevisionId String?  // Revision.id when anchor was created
  isStale       Boolean   @default(false)  // True if article updated since
  
  // Extraction provenance
  extractionJobId String?
  wasManual     Boolean   @default(false)  // True if user created anchor directly
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([articleId, claimId])
  @@index([articleId])
  @@index([claimId])
  @@index([extractionJobId])
}
```

### 4.2 Modifications to Existing Models

```prisma
// Add to existing Article model
model Article {
  // ... existing fields ...
  
  // NEW: Extraction relations
  extractionJobs    ExtractionJob[]  @relation("ArticleExtractionJobs")
  claimAnchors      ArticleClaimAnchor[]
  
  // NEW: Flag for extraction availability
  extractionEnabled Boolean @default(true)
}

// Add to existing Claim model
model Claim {
  // ... existing fields ...
  
  // NEW: Article anchor relation
  articleAnchors    ArticleClaimAnchor[]
  
  // NEW: Extraction provenance
  extractedFromJobId String?
  extractionConfidence Float?
}

// Add to existing Source model
model Source {
  // ... existing fields ...
  
  // NEW: Link to Article if source is a Mesh article
  articleId         String?  @unique
  article           Article? @relation(fields: [articleId], references: [id])
}
```

### 4.3 Anchor Data Structure

The `anchorJson` field stores the same structure used by `CommentThread` for text annotations, enabling seamless integration with `ArticleReaderWithPins`:

```typescript
// types/extraction.ts

export interface Anchor {
  startPath: number[];   // DOM path from root to start node
  startOffset: number;   // Character offset within start text node
  endPath: number[];     // DOM path from root to end node
  endOffset: number;     // Character offset within end text node
}

export interface ExtractedClaimData {
  id: string;
  text: string;
  normalizedText?: string;
  anchor: Anchor;
  sourceText: string;
  confidence: number;
  claimType?: 'assertion' | 'hypothesis' | 'conclusion' | 'premise' | 'evidence';
  isImplicit: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'MERGED' | 'PUBLISHED';
}

export interface ExtractedArgumentData {
  id: string;
  conclusionId: string;
  premiseIds: string[];
  primarySchemeId?: string;
  schemeConfidence?: number;
  alternativeSchemes?: { schemeId: string; confidence: number }[];
  confidence: number;
  inferenceText?: string;
  discourseMarkers?: { text: string; anchor: Anchor }[];
}

export interface ExtractionResult {
  jobId: string;
  claims: ExtractedClaimData[];
  arguments: ExtractedArgumentData[];
  evidence: ExtractedEvidenceData[];
  metadata: {
    sourceType: string;
    sourceId: string;
    extractorModel: string;
    processingTimeMs: number;
    tokenCount?: number;
  };
}
```

---

## 5. Extraction Pipeline Stages

### 5.1 Stage 1: Text Preprocessing

**Goal**: Convert TipTap AST to extractable text while preserving position mappings.

```typescript
// lib/extraction/preprocessor.ts

import { JSONContent } from '@tiptap/core';

interface TextSpan {
  text: string;
  astPath: number[];       // Path to this node in astJson
  charStart: number;       // Global character offset start
  charEnd: number;         // Global character offset end
  nodeType: string;        // 'paragraph', 'heading', 'listItem', etc.
  metadata: {
    section?: string;      // Heading context
    listDepth?: number;    // Nesting level
    emphasis?: boolean;    // Bold/italic
  };
}

interface PreprocessedDocument {
  fullText: string;
  spans: TextSpan[];
  sentences: SentenceSpan[];
  sections: SectionSpan[];
  
  // Lookup methods
  getSpanAtPosition(charPos: number): TextSpan | null;
  getAnchorForRange(startChar: number, endChar: number): Anchor;
}

export function preprocessArticle(astJson: JSONContent): PreprocessedDocument {
  const spans: TextSpan[] = [];
  let globalOffset = 0;
  
  function traverse(node: JSONContent, path: number[], sectionContext: string | null) {
    if (node.type === 'text' && node.text) {
      spans.push({
        text: node.text,
        astPath: [...path],
        charStart: globalOffset,
        charEnd: globalOffset + node.text.length,
        nodeType: 'text',
        metadata: { section: sectionContext }
      });
      globalOffset += node.text.length;
    }
    
    if (node.type === 'paragraph' || node.type === 'heading') {
      // Add space between blocks
      if (globalOffset > 0) {
        globalOffset += 1; // Implicit newline
      }
      
      if (node.type === 'heading' && node.content?.[0]?.text) {
        sectionContext = node.content[0].text;
      }
    }
    
    if (node.content) {
      node.content.forEach((child, idx) => {
        traverse(child, [...path, idx], sectionContext);
      });
    }
  }
  
  traverse(astJson, [], null);
  
  const fullText = spans.map(s => s.text).join('');
  
  return {
    fullText,
    spans,
    sentences: detectSentences(spans),
    sections: detectSections(spans),
    getSpanAtPosition: (pos) => spans.find(s => pos >= s.charStart && pos < s.charEnd) || null,
    getAnchorForRange: (start, end) => buildAnchorFromCharRange(spans, start, end),
  };
}
```

### 5.2 Stage 2: Claim Detection

**Goal**: Identify statements that function as claims within the document.

```typescript
// lib/extraction/claim-detector.ts

interface ClaimCandidate {
  text: string;
  charStart: number;
  charEnd: number;
  confidence: number;
  claimType: 'assertion' | 'hypothesis' | 'conclusion' | 'premise' | 'evidence';
  indicators: ClaimIndicator[];
}

interface ClaimIndicator {
  type: 'lexical' | 'syntactic' | 'discourse' | 'semantic';
  value: string;
  position: number;
  weight: number;
}

// Claim detection prompts for LLM
const CLAIM_DETECTION_SYSTEM_PROMPT = `You are an expert argumentation analyst. Your task is to identify claims (statements that can be true or false and are asserted as positions) within academic/argumentative text.

For each claim, provide:
1. The exact text of the claim
2. The character positions (start, end) in the source text
3. A confidence score (0.0-1.0)
4. The claim type: 'assertion', 'hypothesis', 'conclusion', 'premise', or 'evidence'

Claim indicators to look for:
- Thesis statements ("I argue that...", "This paper demonstrates...")
- Conclusions ("Therefore...", "Thus...", "We conclude...")
- Hypotheses ("We hypothesize that...", "It is proposed...")
- Factual assertions ("X is Y", "Studies show that...")
- Evidence statements ("Data indicates...", "Results show...")

Do NOT extract:
- Questions
- Definitions (unless used as claims)
- Pure methodology descriptions
- Acknowledgments or metadata

Return as JSON array.`;

interface ClaimDetectionConfig {
  model: 'gpt-4' | 'gpt-4-turbo' | 'claude-3-opus' | 'claude-3-sonnet';
  sensitivity: number;       // 0.0-1.0, higher = more claims extracted
  maxClaimsPerSection: number;
  includeImplicitClaims: boolean;
}

export async function detectClaims(
  doc: PreprocessedDocument,
  config: ClaimDetectionConfig
): Promise<ClaimCandidate[]> {
  // Hybrid approach: LLM + rule-based indicators
  
  const llmCandidates = await detectClaimsWithLLM(doc, config);
  const ruleCandidates = detectClaimsWithRules(doc, config);
  
  // Merge and deduplicate
  return mergeAndRankCandidates(llmCandidates, ruleCandidates, config.sensitivity);
}

function detectClaimsWithRules(
  doc: PreprocessedDocument,
  config: ClaimDetectionConfig
): ClaimCandidate[] {
  const candidates: ClaimCandidate[] = [];
  
  // Rule-based indicators
  const conclusionMarkers = /\b(therefore|thus|hence|consequently|we conclude|this shows|this demonstrates)\b/gi;
  const premiseMarkers = /\b(because|since|given that|as evidence|studies show|data indicates)\b/gi;
  const hypothesisMarkers = /\b(we hypothesize|it is proposed|we argue|I contend|this suggests)\b/gi;
  
  for (const sentence of doc.sentences) {
    let confidence = 0.3; // Base confidence
    let claimType: ClaimCandidate['claimType'] = 'assertion';
    const indicators: ClaimIndicator[] = [];
    
    // Check for conclusion markers
    const conclusionMatches = sentence.text.matchAll(conclusionMarkers);
    for (const match of conclusionMatches) {
      confidence += 0.2;
      claimType = 'conclusion';
      indicators.push({
        type: 'discourse',
        value: match[0],
        position: sentence.charStart + (match.index || 0),
        weight: 0.2
      });
    }
    
    // Check for premise markers
    const premiseMatches = sentence.text.matchAll(premiseMarkers);
    for (const match of premiseMatches) {
      confidence += 0.15;
      claimType = 'premise';
      indicators.push({
        type: 'discourse',
        value: match[0],
        position: sentence.charStart + (match.index || 0),
        weight: 0.15
      });
    }
    
    // Check for hypothesis markers
    const hypothesisMatches = sentence.text.matchAll(hypothesisMarkers);
    for (const match of hypothesisMatches) {
      confidence += 0.25;
      claimType = 'hypothesis';
      indicators.push({
        type: 'discourse',
        value: match[0],
        position: sentence.charStart + (match.index || 0),
        weight: 0.25
      });
    }
    
    if (confidence > config.sensitivity) {
      candidates.push({
        text: sentence.text,
        charStart: sentence.charStart,
        charEnd: sentence.charEnd,
        confidence: Math.min(confidence, 1.0),
        claimType,
        indicators
      });
    }
  }
  
  return candidates;
}
```

---

*Continued in Part 2: Extraction Engine Design (Argument Structure Inference, Scheme Recognition, Evidence Linking)*

---

## Part 1 Summary

This first part establishes:

1. **Vision**: Bidirectional extraction between Article prose and structured Claims/Arguments
2. **Architecture**: 6-stage pipeline from text to verified, ontology-exportable arguments
3. **Data Models**: `ExtractionJob`, `ExtractedClaim`, `ExtractedArgument`, `ArticleClaimAnchor`
4. **Anchor System**: Reuses existing `CommentThread.anchor` structure for seamless UI integration
5. **Preprocessing**: AST → text with position mapping
6. **Claim Detection**: Hybrid LLM + rule-based approach with confidence scoring

**Next in Part 2:**
- Argument structure inference (premise-conclusion detection)
- Scheme recognition algorithms
- Evidence and citation linking
- Discourse connective analysis

---

## Part 2: Extraction Engine Design

### 6. Argument Structure Inference

**Goal**: Given extracted claims, infer which claims function as premises supporting which conclusions.

#### 6.1 Discourse Connective Analysis

Discourse connectives are the primary signals for argument structure in natural language:

```typescript
// lib/extraction/discourse-analysis.ts

interface DiscourseConnective {
  text: string;
  type: 'conclusion' | 'premise' | 'contrast' | 'elaboration' | 'condition';
  direction: 'forward' | 'backward';  // Does it introduce what follows or references what precedes?
  strength: number;  // 0.0-1.0
}

const DISCOURSE_CONNECTIVES: DiscourseConnective[] = [
  // Conclusion indicators (forward-looking)
  { text: 'therefore', type: 'conclusion', direction: 'forward', strength: 0.95 },
  { text: 'thus', type: 'conclusion', direction: 'forward', strength: 0.90 },
  { text: 'hence', type: 'conclusion', direction: 'forward', strength: 0.90 },
  { text: 'consequently', type: 'conclusion', direction: 'forward', strength: 0.85 },
  { text: 'so', type: 'conclusion', direction: 'forward', strength: 0.60 },
  { text: 'it follows that', type: 'conclusion', direction: 'forward', strength: 0.95 },
  { text: 'we can conclude', type: 'conclusion', direction: 'forward', strength: 0.95 },
  { text: 'this shows that', type: 'conclusion', direction: 'forward', strength: 0.85 },
  { text: 'this demonstrates', type: 'conclusion', direction: 'forward', strength: 0.85 },
  { text: 'this proves', type: 'conclusion', direction: 'forward', strength: 0.90 },
  { text: 'this implies', type: 'conclusion', direction: 'forward', strength: 0.80 },
  { text: 'this suggests', type: 'conclusion', direction: 'forward', strength: 0.70 },
  
  // Premise indicators (backward-looking - introduces evidence for prior claim)
  { text: 'because', type: 'premise', direction: 'backward', strength: 0.90 },
  { text: 'since', type: 'premise', direction: 'backward', strength: 0.85 },
  { text: 'for', type: 'premise', direction: 'backward', strength: 0.50 },
  { text: 'given that', type: 'premise', direction: 'backward', strength: 0.90 },
  { text: 'as', type: 'premise', direction: 'backward', strength: 0.40 },
  { text: 'the reason is', type: 'premise', direction: 'backward', strength: 0.95 },
  { text: 'this is because', type: 'premise', direction: 'backward', strength: 0.95 },
  { text: 'due to', type: 'premise', direction: 'backward', strength: 0.80 },
  { text: 'on the grounds that', type: 'premise', direction: 'backward', strength: 0.95 },
  
  // Contrast (may indicate attack or alternative)
  { text: 'however', type: 'contrast', direction: 'forward', strength: 0.80 },
  { text: 'but', type: 'contrast', direction: 'forward', strength: 0.70 },
  { text: 'although', type: 'contrast', direction: 'forward', strength: 0.75 },
  { text: 'nevertheless', type: 'contrast', direction: 'forward', strength: 0.80 },
  { text: 'on the other hand', type: 'contrast', direction: 'forward', strength: 0.85 },
  
  // Conditional (may indicate defeasible reasoning)
  { text: 'if', type: 'condition', direction: 'forward', strength: 0.70 },
  { text: 'provided that', type: 'condition', direction: 'forward', strength: 0.85 },
  { text: 'assuming', type: 'condition', direction: 'forward', strength: 0.80 },
  { text: 'unless', type: 'condition', direction: 'forward', strength: 0.80 },
];

interface DiscourseRelation {
  sourceClaimId: string;
  targetClaimId: string;
  relationType: 'supports' | 'attacks' | 'conditions' | 'elaborates';
  connective?: DiscourseConnective;
  confidence: number;
}

export function inferDiscourseRelations(
  claims: ExtractedClaimData[],
  doc: PreprocessedDocument
): DiscourseRelation[] {
  const relations: DiscourseRelation[] = [];
  
  // Sort claims by position in document
  const sortedClaims = [...claims].sort((a, b) => 
    a.anchor.startPath.join(',').localeCompare(b.anchor.startPath.join(','))
  );
  
  for (let i = 0; i < sortedClaims.length; i++) {
    const claim = sortedClaims[i];
    
    // Check for connectives within claim text
    for (const connective of DISCOURSE_CONNECTIVES) {
      const regex = new RegExp(`\\b${escapeRegex(connective.text)}\\b`, 'gi');
      const match = regex.exec(claim.text);
      
      if (match) {
        if (connective.direction === 'backward' && i > 0) {
          // This claim provides reason for previous claim
          relations.push({
            sourceClaimId: claim.id,
            targetClaimId: sortedClaims[i - 1].id,
            relationType: 'supports',
            connective,
            confidence: connective.strength * claim.confidence
          });
        } else if (connective.direction === 'forward' && i < sortedClaims.length - 1) {
          // Previous claims support this claim (it's a conclusion)
          // Look back for premises
          for (let j = Math.max(0, i - 3); j < i; j++) {
            relations.push({
              sourceClaimId: sortedClaims[j].id,
              targetClaimId: claim.id,
              relationType: 'supports',
              connective,
              confidence: connective.strength * 0.7 // Decay for distance
            });
          }
        }
      }
    }
  }
  
  return relations;
}
```

#### 6.2 Argument Assembly Algorithm

```typescript
// lib/extraction/argument-assembler.ts

interface ArgumentCandidate {
  conclusionId: string;
  premiseIds: string[];
  confidence: number;
  structureType: 'serial' | 'convergent' | 'linked' | 'divergent';
  inferenceText?: string;
}

interface ArgumentAssemblyConfig {
  minPremises: number;           // Minimum premises per argument (default: 1)
  maxPremises: number;           // Maximum premises per argument (default: 5)
  minConfidence: number;         // Threshold for argument acceptance
  allowImplicitPremises: boolean;
  useLLMForAssembly: boolean;
}

export async function assembleArguments(
  claims: ExtractedClaimData[],
  relations: DiscourseRelation[],
  config: ArgumentAssemblyConfig
): Promise<ArgumentCandidate[]> {
  const arguments: ArgumentCandidate[] = [];
  
  // Group relations by target (potential conclusions)
  const supportsByTarget = new Map<string, DiscourseRelation[]>();
  for (const rel of relations.filter(r => r.relationType === 'supports')) {
    const existing = supportsByTarget.get(rel.targetClaimId) || [];
    existing.push(rel);
    supportsByTarget.set(rel.targetClaimId, existing);
  }
  
  // Identify claims that are conclusions (have incoming support)
  for (const [conclusionId, supports] of supportsByTarget) {
    if (supports.length < config.minPremises) continue;
    
    // Determine structure type
    let structureType: ArgumentCandidate['structureType'] = 'convergent';
    if (supports.length === 1) {
      structureType = 'serial';
    }
    
    // Check if premises are linked (jointly required) or convergent (independently sufficient)
    // Heuristic: If premises are in same sentence/paragraph, likely linked
    const premiseClaims = supports.map(s => claims.find(c => c.id === s.sourceClaimId)!);
    const allSameParagraph = premiseClaims.every(p => 
      areSameParagraph(p.anchor, premiseClaims[0].anchor)
    );
    if (allSameParagraph && supports.length > 1) {
      structureType = 'linked';
    }
    
    const avgConfidence = supports.reduce((sum, s) => sum + s.confidence, 0) / supports.length;
    
    if (avgConfidence >= config.minConfidence) {
      arguments.push({
        conclusionId,
        premiseIds: supports.map(s => s.sourceClaimId).slice(0, config.maxPremises),
        confidence: avgConfidence,
        structureType
      });
    }
  }
  
  // Optionally use LLM to infer additional arguments and refine structure
  if (config.useLLMForAssembly) {
    const llmArguments = await inferArgumentsWithLLM(claims, arguments);
    return mergeArgumentCandidates(arguments, llmArguments);
  }
  
  return arguments;
}

// LLM-assisted argument inference
async function inferArgumentsWithLLM(
  claims: ExtractedClaimData[],
  existingArguments: ArgumentCandidate[]
): Promise<ArgumentCandidate[]> {
  
  const ARGUMENT_INFERENCE_PROMPT = `You are an expert in argumentation analysis. Given the following claims extracted from a document, identify argument structures.

Claims:
${claims.map((c, i) => `[${i}] ${c.text} (type: ${c.claimType}, confidence: ${c.confidence})`).join('\n')}

Existing argument hypotheses (may be incomplete or incorrect):
${existingArguments.map(a => `  Conclusion: [${claims.findIndex(c => c.id === a.conclusionId)}], Premises: [${a.premiseIds.map(p => claims.findIndex(c => c.id === p)).join(', ')}]`).join('\n')}

For each argument you identify, provide:
1. The conclusion claim (by index)
2. The premise claims (by indices)
3. A brief description of the inference/warrant
4. Whether premises are LINKED (jointly required) or CONVERGENT (independently sufficient)
5. Your confidence (0.0-1.0)

Also identify any IMPLICIT premises that are assumed but not stated. For implicit premises, provide the text of the missing premise.

Return as JSON array of argument objects.`;

  // Call LLM and parse response
  // ... implementation details ...
  
  return [];
}
```

#### 6.3 Implicit Premise Reconstruction (Enthymeme Detection)

Many real-world arguments omit premises that are assumed. The extraction pipeline should detect and optionally reconstruct these:

```typescript
// lib/extraction/enthymeme-detector.ts

interface ImplicitPremise {
  argumentId: string;
  text: string;                    // Reconstructed premise text
  premiseType: 'major' | 'minor';  // Syllogistic role
  confidence: number;
  justification: string;           // Why this premise is implied
}

const ENTHYMEME_DETECTION_PROMPT = `Analyze this argument for missing (implicit) premises.

Argument:
Conclusion: "{conclusion}"
Explicit Premises: {premises}

Many arguments omit premises that are assumed to be obvious or shared knowledge. These are called "enthymemes."

Common patterns:
1. Missing major premise: "Socrates is a man, therefore Socrates is mortal" (missing: "All men are mortal")
2. Missing minor premise: "All philosophers are wise, therefore Socrates is wise" (missing: "Socrates is a philosopher")
3. Missing warrant: "The data shows X, therefore Y" (missing: the principle connecting X to Y)

Identify any implicit premises needed to make this argument valid. For each:
1. State the missing premise
2. Indicate whether it's a major or minor premise
3. Explain why it's implied
4. Rate your confidence (0.0-1.0)

Return as JSON array.`;

export async function detectEnthymemes(
  argument: ArgumentCandidate,
  claims: ExtractedClaimData[]
): Promise<ImplicitPremise[]> {
  const conclusion = claims.find(c => c.id === argument.conclusionId);
  const premises = argument.premiseIds.map(id => claims.find(c => c.id === id));
  
  // Use LLM to detect missing premises
  const prompt = ENTHYMEME_DETECTION_PROMPT
    .replace('{conclusion}', conclusion?.text || '')
    .replace('{premises}', premises.map(p => `- ${p?.text}`).join('\n'));
  
  // ... LLM call implementation ...
  
  return [];
}
```

---

### 7. Scheme Recognition

**Goal**: Classify extracted arguments according to Walton's argumentation scheme taxonomy.

#### 7.1 Scheme Matching Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCHEME RECOGNITION PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  INPUT: Argument (conclusion + premises + optional inference text)    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│         ┌───────────────────────────┼───────────────────────────┐           │
│         ▼                           ▼                           ▼           │
│  ┌─────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐ │
│  │ RULE-BASED      │  │ EMBEDDING-BASED         │  │ LLM-BASED           │ │
│  │ MATCHER         │  │ MATCHER                 │  │ CLASSIFIER          │ │
│  │                 │  │                         │  │                     │ │
│  │ • Pattern regex │  │ • Embed argument text   │  │ • Zero-shot prompt  │ │
│  │ • Keyword lists │  │ • Compare to scheme     │  │ • Few-shot examples │ │
│  │ • Template fill │  │   embeddings            │  │ • Chain-of-thought  │ │
│  │                 │  │ • Cosine similarity     │  │                     │ │
│  └────────┬────────┘  └───────────┬─────────────┘  └──────────┬──────────┘ │
│           │                       │                           │             │
│           └───────────────────────┴───────────────────────────┘             │
│                                     │                                        │
│                                     ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ENSEMBLE SCORER                                                       │  │
│  │  • Weighted combination of matcher scores                             │  │
│  │  • Multi-label classification (argument may match multiple schemes)   │  │
│  │  • Threshold filtering                                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  OUTPUT: Ranked scheme matches with confidence scores                  │  │
│  │  [{ schemeId: 'expert_opinion', confidence: 0.87 },                   │  │
│  │   { schemeId: 'position_to_know', confidence: 0.62 }, ...]            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 7.2 Rule-Based Scheme Matcher

```typescript
// lib/extraction/scheme-matcher.ts

interface SchemePattern {
  schemeKey: string;
  conclusionPatterns: RegExp[];
  premisePatterns: RegExp[];
  requiredKeywords: string[];
  optionalKeywords: string[];
  baseScore: number;
}

const SCHEME_PATTERNS: SchemePattern[] = [
  // Argument from Expert Opinion
  {
    schemeKey: 'expert_opinion',
    conclusionPatterns: [
      /(?:is|are)\s+(?:true|correct|valid|plausible)/i,
      /should\s+be\s+(?:accepted|believed)/i
    ],
    premisePatterns: [
      /(?:expert|authority|specialist|professor|doctor|scientist)/i,
      /(?:according to|states?|claims?|argues?|shows?)/i,
      /(?:in the field of|domain of|area of)/i
    ],
    requiredKeywords: ['expert', 'authority', 'specialist', 'professor', 'researcher'],
    optionalKeywords: ['credible', 'qualified', 'renowned', 'leading'],
    baseScore: 0.6
  },
  
  // Argument from Analogy
  {
    schemeKey: 'analogy',
    conclusionPatterns: [
      /(?:similarly|likewise|in the same way)/i,
      /(?:just as|like|as with)/i
    ],
    premisePatterns: [
      /(?:similar|analogous|comparable|like|same as)/i,
      /(?:in case|in the case of)/i
    ],
    requiredKeywords: ['similar', 'like', 'same', 'analogous', 'comparable'],
    optionalKeywords: ['parallel', 'resembles', 'corresponds'],
    baseScore: 0.5
  },
  
  // Argument from Cause to Effect
  {
    schemeKey: 'cause_to_effect',
    conclusionPatterns: [
      /will\s+(?:cause|lead to|result in|produce)/i,
      /(?:effect|consequence|outcome)\s+will be/i
    ],
    premisePatterns: [
      /(?:causes?|leads? to|results? in|produces?)/i,
      /(?:whenever|if|when).*(?:then|therefore)/i
    ],
    requiredKeywords: ['cause', 'effect', 'result', 'lead', 'produce'],
    optionalKeywords: ['mechanism', 'process', 'consequence'],
    baseScore: 0.6
  },
  
  // Argument from Sign
  {
    schemeKey: 'sign',
    conclusionPatterns: [
      /(?:indicates?|suggests?|shows?|means?)/i,
      /(?:is a sign|is evidence|demonstrates?)/i
    ],
    premisePatterns: [
      /(?:sign|symptom|indicator|evidence|signal)/i,
      /(?:whenever we see|presence of|occurrence of)/i
    ],
    requiredKeywords: ['sign', 'indicator', 'symptom', 'evidence'],
    optionalKeywords: ['signal', 'marker', 'manifestation'],
    baseScore: 0.5
  },
  
  // Argument from Example
  {
    schemeKey: 'example',
    conclusionPatterns: [
      /(?:in general|generally|typically|usually)/i,
      /(?:we can generalize|this shows that)/i
    ],
    premisePatterns: [
      /(?:for example|for instance|such as|like|e\.g\.)/i,
      /(?:in this case|in the case of|consider)/i
    ],
    requiredKeywords: ['example', 'instance', 'case'],
    optionalKeywords: ['illustration', 'sample', 'demonstration'],
    baseScore: 0.5
  },
  
  // Practical Reasoning (Action-based)
  {
    schemeKey: 'practical_reasoning',
    conclusionPatterns: [
      /(?:should|ought to|must|need to)\s+(?:\w+)/i,
      /(?:best course|right thing|proper action)/i
    ],
    premisePatterns: [
      /(?:goal|objective|aim|want|desire)/i,
      /(?:achieve|accomplish|attain|reach)/i,
      /(?:means|way|method|action)/i
    ],
    requiredKeywords: ['should', 'goal', 'action', 'achieve'],
    optionalKeywords: ['means', 'end', 'purpose', 'intention'],
    baseScore: 0.6
  },
  
  // Argument from Consequences
  {
    schemeKey: 'negative_consequences',
    conclusionPatterns: [
      /(?:should not|ought not|must not)/i,
      /(?:avoid|prevent|stop)/i
    ],
    premisePatterns: [
      /(?:will lead to|will cause|will result in)/i,
      /(?:bad|negative|harmful|dangerous|costly)/i
    ],
    requiredKeywords: ['consequence', 'result', 'lead'],
    optionalKeywords: ['negative', 'harmful', 'dangerous', 'bad'],
    baseScore: 0.55
  },
  
  // ... additional scheme patterns ...
];

export function matchSchemesRuleBased(
  argument: ArgumentCandidate,
  claims: ExtractedClaimData[]
): { schemeKey: string; confidence: number; matchDetails: string[] }[] {
  const conclusion = claims.find(c => c.id === argument.conclusionId);
  const premises = argument.premiseIds.map(id => claims.find(c => c.id === id)).filter(Boolean);
  
  const allText = [conclusion?.text, ...premises.map(p => p?.text)].filter(Boolean).join(' ');
  const matches: { schemeKey: string; confidence: number; matchDetails: string[] }[] = [];
  
  for (const pattern of SCHEME_PATTERNS) {
    let score = 0;
    const details: string[] = [];
    
    // Check conclusion patterns
    for (const regex of pattern.conclusionPatterns) {
      if (regex.test(conclusion?.text || '')) {
        score += 0.2;
        details.push(`Conclusion matches: ${regex.source}`);
      }
    }
    
    // Check premise patterns
    for (const regex of pattern.premisePatterns) {
      for (const premise of premises) {
        if (regex.test(premise?.text || '')) {
          score += 0.15;
          details.push(`Premise matches: ${regex.source}`);
        }
      }
    }
    
    // Check required keywords
    const foundRequired = pattern.requiredKeywords.filter(kw => 
      allText.toLowerCase().includes(kw.toLowerCase())
    );
    if (foundRequired.length > 0) {
      score += 0.1 * foundRequired.length;
      details.push(`Required keywords: ${foundRequired.join(', ')}`);
    }
    
    // Check optional keywords
    const foundOptional = pattern.optionalKeywords.filter(kw => 
      allText.toLowerCase().includes(kw.toLowerCase())
    );
    score += 0.05 * foundOptional.length;
    
    const finalScore = Math.min(pattern.baseScore + score, 1.0);
    
    if (finalScore > 0.3) {
      matches.push({
        schemeKey: pattern.schemeKey,
        confidence: finalScore,
        matchDetails: details
      });
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}
```

#### 7.3 LLM-Based Scheme Classification

```typescript
// lib/extraction/scheme-classifier-llm.ts

const SCHEME_CLASSIFICATION_PROMPT = `You are an expert in Walton's argumentation schemes. Classify the following argument.

ARGUMENT:
Conclusion: {conclusion}
Premises:
{premises}

AVAILABLE SCHEMES (select all that apply):
1. Expert Opinion - Appeal to an expert's authority in a domain
2. Position to Know - Someone is in a position to know something
3. Analogy - Similarity between cases supports similar conclusion
4. Cause to Effect - Known cause leads to predicted effect
5. Effect to Cause - Observed effect implies a cause
6. Sign - Observable sign indicates underlying condition
7. Example - Specific instance supports generalization
8. Precedent - Past case guides current decision
9. Practical Reasoning - Goal + means to achieve it
10. Negative Consequences - Action leads to bad outcomes
11. Positive Consequences - Action leads to good outcomes
12. Popular Opinion - Many people believe it
13. Commitment - Person's past commitment implies current stance
14. Verbal Classification - Definition-based reasoning
15. Sunk Costs - Past investment justifies continued action
16. Slippery Slope - Action leads to chain of undesirable events

For each matching scheme:
1. Name the scheme
2. Explain how the argument instantiates the scheme pattern
3. Rate your confidence (0.0-1.0)
4. List applicable critical questions for this instantiation

Return as JSON array.`;

interface LLMSchemeMatch {
  schemeKey: string;
  schemeName: string;
  explanation: string;
  confidence: number;
  applicableCriticalQuestions: string[];
}

export async function classifySchemesWithLLM(
  argument: ArgumentCandidate,
  claims: ExtractedClaimData[]
): Promise<LLMSchemeMatch[]> {
  const conclusion = claims.find(c => c.id === argument.conclusionId);
  const premises = argument.premiseIds.map(id => claims.find(c => c.id === id)).filter(Boolean);
  
  const prompt = SCHEME_CLASSIFICATION_PROMPT
    .replace('{conclusion}', conclusion?.text || '')
    .replace('{premises}', premises.map((p, i) => `${i + 1}. ${p?.text}`).join('\n'));
  
  // Call LLM API
  // ... implementation ...
  
  return [];
}
```

---

### 8. Evidence & Citation Linking

**Goal**: Connect extracted claims to citations and sources present in the article.

#### 8.1 Citation Detection in Article AST

```typescript
// lib/extraction/citation-linker.ts

interface InlineCitation {
  text: string;              // "[1]", "(Smith 2023)", "[Smith et al., 2023]"
  anchor: Anchor;
  citationStyle: 'numeric' | 'author_year' | 'footnote';
  parsedAuthors?: string[];
  parsedYear?: number;
  parsedNumber?: number;
}

interface ResolvedCitation extends InlineCitation {
  sourceId?: string;         // Matched Source.id
  doi?: string;
  url?: string;
  confidence: number;
}

// Regex patterns for common citation formats
const CITATION_PATTERNS = [
  // Numeric: [1], [1,2], [1-3]
  { regex: /\[(\d+(?:[,\-–]\d+)*)\]/g, style: 'numeric' as const },
  
  // Author-year: (Smith 2023), (Smith & Jones, 2023), (Smith et al., 2023)
  { 
    regex: /\(([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?),?\s*(\d{4})\)/g, 
    style: 'author_year' as const 
  },
  
  // Bracketed author-year: [Smith 2023]
  {
    regex: /\[([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?),?\s*(\d{4})\]/g,
    style: 'author_year' as const
  }
];

export function detectCitations(doc: PreprocessedDocument): InlineCitation[] {
  const citations: InlineCitation[] = [];
  
  for (const { regex, style } of CITATION_PATTERNS) {
    let match;
    while ((match = regex.exec(doc.fullText)) !== null) {
      const anchor = doc.getAnchorForRange(match.index, match.index + match[0].length);
      
      const citation: InlineCitation = {
        text: match[0],
        anchor,
        citationStyle: style
      };
      
      if (style === 'numeric') {
        citation.parsedNumber = parseInt(match[1], 10);
      } else if (style === 'author_year') {
        citation.parsedAuthors = [match[1]];
        citation.parsedYear = parseInt(match[2], 10);
      }
      
      citations.push(citation);
    }
  }
  
  return citations;
}
```

#### 8.2 Linking Claims to Citations

```typescript
// lib/extraction/evidence-matcher.ts

interface ClaimEvidenceLink {
  claimId: string;
  citationAnchor: Anchor;
  citationText: string;
  linkType: 'inline' | 'following' | 'paragraph';
  distance: number;          // Character distance from claim
  confidence: number;
}

export function linkClaimsToEvidence(
  claims: ExtractedClaimData[],
  citations: InlineCitation[],
  doc: PreprocessedDocument
): ClaimEvidenceLink[] {
  const links: ClaimEvidenceLink[] = [];
  
  for (const claim of claims) {
    const claimEnd = getCharPositionFromAnchor(claim.anchor, doc);
    
    // Find citations within or immediately after claim
    for (const citation of citations) {
      const citationStart = getCharPositionFromAnchor(citation.anchor, doc);
      const distance = citationStart - claimEnd;
      
      // Citation is within claim text
      if (isAnchorWithin(citation.anchor, claim.anchor)) {
        links.push({
          claimId: claim.id,
          citationAnchor: citation.anchor,
          citationText: citation.text,
          linkType: 'inline',
          distance: 0,
          confidence: 0.95
        });
        continue;
      }
      
      // Citation immediately follows claim (within 50 chars)
      if (distance >= 0 && distance < 50) {
        links.push({
          claimId: claim.id,
          citationAnchor: citation.anchor,
          citationText: citation.text,
          linkType: 'following',
          distance,
          confidence: 0.85 - (distance * 0.005)
        });
        continue;
      }
      
      // Citation is in same paragraph
      if (distance >= 0 && distance < 500 && areSameParagraph(claim.anchor, citation.anchor)) {
        links.push({
          claimId: claim.id,
          citationAnchor: citation.anchor,
          citationText: citation.text,
          linkType: 'paragraph',
          distance,
          confidence: 0.5 - (distance * 0.001)
        });
      }
    }
  }
  
  return links.filter(l => l.confidence > 0.3);
}
```

---

### 9. Complete Extraction Orchestrator

```typescript
// lib/extraction/orchestrator.ts

import { preprocessArticle } from './preprocessor';
import { detectClaims } from './claim-detector';
import { inferDiscourseRelations, assembleArguments } from './argument-assembler';
import { matchSchemesRuleBased, classifySchemesWithLLM } from './scheme-matcher';
import { detectCitations, linkClaimsToEvidence } from './citation-linker';
import { generateAnchors } from './anchor-generator';

export interface ExtractionConfig {
  // Claim detection
  claimModel: 'gpt-4' | 'claude-3' | 'rule-based';
  claimSensitivity: number;
  includeImplicitClaims: boolean;
  
  // Argument assembly
  minPremises: number;
  maxPremises: number;
  argumentMinConfidence: number;
  useLLMForArguments: boolean;
  
  // Scheme recognition
  schemeMatcherWeights: {
    ruleBased: number;
    embedding: number;
    llm: number;
  };
  
  // Evidence linking
  linkCitations: boolean;
  resolveDOIs: boolean;
}

export async function extractFromArticle(
  articleId: string,
  astJson: JSONContent,
  config: ExtractionConfig
): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  // Stage 1: Preprocess
  const doc = preprocessArticle(astJson);
  
  // Stage 2: Detect claims
  const claimCandidates = await detectClaims(doc, {
    model: config.claimModel,
    sensitivity: config.claimSensitivity,
    maxClaimsPerSection: 20,
    includeImplicitClaims: config.includeImplicitClaims
  });
  
  // Stage 3: Generate anchors for claims
  const claims = claimCandidates.map((candidate, i) => ({
    id: `claim-${i}`,
    text: candidate.text,
    anchor: doc.getAnchorForRange(candidate.charStart, candidate.charEnd),
    sourceText: candidate.text,
    confidence: candidate.confidence,
    claimType: candidate.claimType,
    isImplicit: false,
    status: 'PENDING' as const
  }));
  
  // Stage 4: Infer argument structures
  const discourseRelations = inferDiscourseRelations(claims, doc);
  const argumentCandidates = await assembleArguments(claims, discourseRelations, {
    minPremises: config.minPremises,
    maxPremises: config.maxPremises,
    minConfidence: config.argumentMinConfidence,
    allowImplicitPremises: config.includeImplicitClaims,
    useLLMForAssembly: config.useLLMForArguments
  });
  
  // Stage 5: Classify schemes
  const arguments: ExtractedArgumentData[] = [];
  for (const argCandidate of argumentCandidates) {
    const ruleMatches = matchSchemesRuleBased(argCandidate, claims);
    const llmMatches = await classifySchemesWithLLM(argCandidate, claims);
    
    const combinedMatches = combineSchemeMatches(ruleMatches, llmMatches, config.schemeMatcherWeights);
    
    arguments.push({
      id: `arg-${arguments.length}`,
      conclusionId: argCandidate.conclusionId,
      premiseIds: argCandidate.premiseIds,
      primarySchemeId: combinedMatches[0]?.schemeKey,
      schemeConfidence: combinedMatches[0]?.confidence,
      alternativeSchemes: combinedMatches.slice(1),
      confidence: argCandidate.confidence,
      inferenceText: argCandidate.inferenceText,
      discourseMarkers: [] // TODO: populate from discourse analysis
    });
  }
  
  // Stage 6: Link evidence
  let evidence: ExtractedEvidenceData[] = [];
  if (config.linkCitations) {
    const citations = detectCitations(doc);
    const links = linkClaimsToEvidence(claims, citations, doc);
    
    evidence = links.map(link => ({
      claimId: link.claimId,
      citationText: link.citationText,
      citationAnchor: link.citationAnchor,
      evidenceType: 'citation',
      confidence: link.confidence
    }));
  }
  
  return {
    jobId: '',  // Set by caller
    claims,
    arguments,
    evidence,
    metadata: {
      sourceType: 'article',
      sourceId: articleId,
      extractorModel: config.claimModel,
      processingTimeMs: Date.now() - startTime
    }
  };
}
```

---

*Continued in Part 3: Ontology Conversion & Export (AIF, ASPIC+, CEG)*

---

## Part 2 Summary

This part detailed:

1. **Discourse Analysis**: Connective-based detection of premise-conclusion relations
2. **Argument Assembly**: Algorithm for grouping claims into structured arguments
3. **Enthymeme Detection**: Identifying and reconstructing implicit premises
4. **Scheme Recognition**: 
   - Rule-based pattern matching
   - LLM-based classification
   - Ensemble scoring
5. **Evidence Linking**: Connecting claims to inline citations
6. **Extraction Orchestrator**: Full pipeline coordination

**Next in Part 3:**
- AIF (Argument Interchange Format) conversion
- ASPIC+ theory generation
- CEG (Carneades Evidence Graph) export
- Interoperability standards

---

## Part 3: Ontology Conversion & Export

### 10. AIF (Argument Interchange Format) Conversion

**Goal**: Convert extracted arguments to W3C-compliant AIF format for interoperability with external argumentation tools.

#### 10.1 AIF Ontology Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AIF CORE ONTOLOGY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  NODES (vertices in argument graph)                                  │    │
│  │                                                                      │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  I-NODES (Information Nodes)                                   │  │    │
│  │  │  • Contain propositional content (claims)                      │  │    │
│  │  │  • Types: Claim, Premise, Conclusion, Evidence                 │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                                                                      │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  S-NODES (Scheme Nodes)                                        │  │    │
│  │  │  • Represent inferential relationships                         │  │    │
│  │  │  • Types:                                                       │  │    │
│  │  │    - RA-Node (Rule of Inference Application)                   │  │    │
│  │  │    - CA-Node (Conflict Application - attacks)                  │  │    │
│  │  │    - PA-Node (Preference Application)                          │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  EDGES (relationships between nodes)                                 │    │
│  │                                                                      │    │
│  │  • Premise → RA-Node (this I-node is premise of inference)          │    │
│  │  • RA-Node → Conclusion (inference produces this I-node)            │    │
│  │  • I-Node → CA-Node → I-Node (attack relationship)                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SCHEME APPLICATION                                                  │    │
│  │                                                                      │    │
│  │  RA-Nodes can be typed by argumentation scheme:                      │    │
│  │  • hasScheme: "Expert Opinion" | "Analogy" | "Cause to Effect" | ...│    │
│  │  • Critical questions attached as potential CA-nodes                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 10.2 Mesh → AIF Type Mappings

```typescript
// lib/export/aif-types.ts

// AIF Core Types (based on AIF ontology specification)
interface AIFNode {
  nodeID: string;
  type: 'I' | 'RA' | 'CA' | 'PA' | 'MA' | 'TA';  // I=Info, RA=Rule, CA=Conflict, PA=Pref, MA=Meta, TA=Transition
  text?: string;
  timestamp?: string;
}

interface AIFINode extends AIFNode {
  type: 'I';
  text: string;
  claimant?: string;           // Author/speaker
  source?: string;             // External source reference
}

interface AIFRANode extends AIFNode {
  type: 'RA';
  schemeID?: string;           // Reference to argumentation scheme
  schemeName?: string;
  schemeVariant?: string;
}

interface AIFCANode extends AIFNode {
  type: 'CA';
  conflictType: 'rebut' | 'undercut' | 'undermine';
}

interface AIFEdge {
  edgeID: string;
  fromID: string;
  toID: string;
  formEdgeID?: string;         // Reference to scheme formulation
}

interface AIFGraph {
  nodes: AIFNode[];
  edges: AIFEdge[];
  locutions?: AIFLocution[];   // Dialogue moves (optional)
  schemeFulfillments?: AIFSchemeFulfillment[];
}

// Mesh → AIF mapping table
const MESH_TO_AIF_TYPE_MAP = {
  // Claim types → AIF I-node subtypes
  'Claim': 'I',
  'Proposition': 'I',
  
  // Argument → RA-node
  'Argument': 'RA',
  
  // Edge types → CA-node conflict types
  'rebut': 'rebut',
  'undercut': 'undercut',
  'undermine': 'undermine',
  
  // Scheme keys → AIF scheme references
  'expert_opinion': 'scheme:ExpertOpinion',
  'analogy': 'scheme:Analogy',
  'cause_to_effect': 'scheme:CauseToEffect',
  'practical_reasoning': 'scheme:PracticalReasoning',
  // ... etc
};
```

#### 10.3 AIF Converter Implementation

```typescript
// lib/export/aif-converter.ts

import { ExtractedClaimData, ExtractedArgumentData, ExtractionResult } from '../extraction/types';

interface AIFConversionOptions {
  includeMetadata: boolean;
  includeLocutions: boolean;        // Include dialogue moves
  includeSchemeFulfillments: boolean;
  baseURI: string;                  // Base URI for node IDs
}

export function convertToAIF(
  result: ExtractionResult,
  options: AIFConversionOptions
): AIFGraph {
  const nodes: AIFNode[] = [];
  const edges: AIFEdge[] = [];
  
  const claimIdToNodeId = new Map<string, string>();
  const argIdToNodeId = new Map<string, string>();
  
  // Step 1: Create I-nodes for all claims
  for (const claim of result.claims) {
    const nodeId = `${options.baseURI}/nodes/${claim.id}`;
    claimIdToNodeId.set(claim.id, nodeId);
    
    nodes.push({
      nodeID: nodeId,
      type: 'I',
      text: claim.text,
      timestamp: new Date().toISOString()
    } as AIFINode);
  }
  
  // Step 2: Create RA-nodes for arguments and connect premises/conclusions
  for (const arg of result.arguments) {
    const raNodeId = `${options.baseURI}/nodes/ra-${arg.id}`;
    argIdToNodeId.set(arg.id, raNodeId);
    
    // Create RA-node
    const raNode: AIFRANode = {
      nodeID: raNodeId,
      type: 'RA',
      schemeID: arg.primarySchemeId ? `${options.baseURI}/schemes/${arg.primarySchemeId}` : undefined,
      schemeName: arg.primarySchemeId
    };
    nodes.push(raNode);
    
    // Create edges: Premises → RA-node
    for (const premiseId of arg.premiseIds) {
      const premiseNodeId = claimIdToNodeId.get(premiseId);
      if (premiseNodeId) {
        edges.push({
          edgeID: `${options.baseURI}/edges/premise-${premiseId}-${arg.id}`,
          fromID: premiseNodeId,
          toID: raNodeId
        });
      }
    }
    
    // Create edge: RA-node → Conclusion
    const conclusionNodeId = claimIdToNodeId.get(arg.conclusionId);
    if (conclusionNodeId) {
      edges.push({
        edgeID: `${options.baseURI}/edges/conclusion-${arg.id}`,
        fromID: raNodeId,
        toID: conclusionNodeId
      });
    }
  }
  
  return {
    nodes,
    edges,
    locutions: options.includeLocutions ? generateLocutions(result) : undefined,
    schemeFulfillments: options.includeSchemeFulfillments ? generateFulfillments(result) : undefined
  };
}

// Export to AIF-RDF (Turtle format)
export function exportAIFToTurtle(graph: AIFGraph): string {
  const lines: string[] = [
    '@prefix aif: <http://www.arg.dundee.ac.uk/aif#> .',
    '@prefix mesh: <https://mesh.app/aif/> .',
    '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
    ''
  ];
  
  // Serialize nodes
  for (const node of graph.nodes) {
    lines.push(`mesh:${encodeURIComponent(node.nodeID)} a aif:${node.type}-node ;`);
    
    if (node.type === 'I' && (node as AIFINode).text) {
      lines.push(`    aif:claimText "${escapeRDF((node as AIFINode).text)}" ;`);
    }
    
    if (node.type === 'RA' && (node as AIFRANode).schemeName) {
      lines.push(`    aif:hasScheme mesh:scheme/${(node as AIFRANode).schemeName} ;`);
    }
    
    lines.push(`    aif:timestamp "${node.timestamp}"^^xsd:dateTime .`);
    lines.push('');
  }
  
  // Serialize edges
  for (const edge of graph.edges) {
    lines.push(`mesh:${encodeURIComponent(edge.fromID)} aif:supports mesh:${encodeURIComponent(edge.toID)} .`);
  }
  
  return lines.join('\n');
}

// Export to AIF-JSON (simpler format)
export function exportAIFToJSON(graph: AIFGraph): string {
  return JSON.stringify({
    '@context': 'https://www.arg.dundee.ac.uk/aif/context.jsonld',
    nodes: graph.nodes.map(node => ({
      id: node.nodeID,
      type: `aif:${node.type}-node`,
      ...node
    })),
    edges: graph.edges.map(edge => ({
      id: edge.edgeID,
      from: edge.fromID,
      to: edge.toID
    }))
  }, null, 2);
}
```

---

### 11. ASPIC+ Theory Generation

**Goal**: Convert extracted arguments into formal ASPIC+ theory for acceptability analysis.

#### 11.1 ASPIC+ Framework Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ASPIC+ COMPONENTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ARGUMENTATION SYSTEM AS = (L, R, n)                                         │
│  Where:                                                                       │
│    L = Logical language                                                       │
│    R = Rs ∪ Rd (strict and defeasible rules)                                 │
│    n = Naming function for defeasible rules                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  RULES                                                               │    │
│  │                                                                      │    │
│  │  Strict Rules (Rs):                                                 │    │
│  │    φ₁, φ₂, ..., φₙ → ψ                                              │    │
│  │    "If premises, then conclusion necessarily"                        │    │
│  │    Cannot be attacked                                                │    │
│  │                                                                      │    │
│  │  Defeasible Rules (Rd):                                             │    │
│  │    φ₁, φ₂, ..., φₙ ⇒ ψ                                              │    │
│  │    "If premises, then conclusion presumably"                         │    │
│  │    Named: r₁: φ₁, φ₂ ⇒ ψ                                            │    │
│  │    Can be undercut by attacking the rule itself                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ARGUMENTS                                                           │    │
│  │                                                                      │    │
│  │  An argument A is:                                                   │    │
│  │    • A single premise φ ∈ K (knowledge base), or                    │    │
│  │    • A₁, A₂, ..., Aₙ →/⇒ ψ where each Aᵢ is an argument             │    │
│  │                                                                      │    │
│  │  Components:                                                          │    │
│  │    Prem(A) = set of premises                                         │    │
│  │    Conc(A) = conclusion                                              │    │
│  │    Sub(A) = set of sub-arguments                                     │    │
│  │    TopRule(A) = last inference rule applied                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ATTACKS                                                             │    │
│  │                                                                      │    │
│  │  Rebut: A attacks B on B' ∈ Sub(B) iff                              │    │
│  │         Conc(A) = ¬Conc(B') and B' uses defeasible rule             │    │
│  │                                                                      │    │
│  │  Undercut: A attacks B on B' ∈ Sub(B) iff                           │    │
│  │            Conc(A) = ¬n(r) where r is TopRule(B')                   │    │
│  │                                                                      │    │
│  │  Undermine: A attacks B on φ ∈ Prem(B) iff                          │    │
│  │             Conc(A) = ¬φ and φ is ordinary premise                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PREFERENCES                                                         │    │
│  │                                                                      │    │
│  │  Rule Preference: r₁ < r₂ means r₂ is preferred over r₁            │    │
│  │  Argument Preference: Derived from rule preferences                   │    │
│  │    (last-link, weakest-link, democratic ordering)                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 11.2 ASPIC+ Converter Implementation

```typescript
// lib/export/aspic-converter.ts

interface ASPICProposition {
  id: string;
  text: string;
  negation?: string;          // ID of negated proposition
  isKnowledgeBase: boolean;   // Part of initial knowledge base K
}

interface ASPICRule {
  id: string;
  name: string;               // Named for undercutting attacks
  type: 'strict' | 'defeasible';
  antecedents: string[];      // Proposition IDs
  consequent: string;         // Proposition ID
  schemeId?: string;          // Walton scheme if applicable
}

interface ASPICPreference {
  rule1: string;              // Less preferred
  rule2: string;              // More preferred
  basis: 'specificity' | 'recency' | 'authority' | 'explicit';
}

interface ASPICTheory {
  propositions: ASPICProposition[];
  strictRules: ASPICRule[];
  defeasibleRules: ASPICRule[];
  knowledgeBase: string[];    // Proposition IDs accepted as premises
  preferences: ASPICPreference[];
  contraries: { prop: string; contrary: string }[];  // Contrary/contradictory pairs
}

export function convertToASPIC(
  result: ExtractionResult,
  options: ASPICConversionOptions
): ASPICTheory {
  const propositions: ASPICProposition[] = [];
  const defeasibleRules: ASPICRule[] = [];
  const strictRules: ASPICRule[] = [];
  const knowledgeBase: string[] = [];
  const preferences: ASPICPreference[] = [];
  
  const claimToPropId = new Map<string, string>();
  
  // Step 1: Convert claims to propositions
  for (const claim of result.claims) {
    const propId = `p_${claim.id}`;
    claimToPropId.set(claim.id, propId);
    
    propositions.push({
      id: propId,
      text: claim.text,
      isKnowledgeBase: claim.claimType === 'premise' || claim.claimType === 'evidence'
    });
    
    // Premises with high confidence go into knowledge base
    if (claim.confidence > 0.8 && (claim.claimType === 'premise' || claim.claimType === 'evidence')) {
      knowledgeBase.push(propId);
    }
  }
  
  // Step 2: Convert arguments to rules
  for (const arg of result.arguments) {
    const ruleName = `r_${arg.id}`;
    const antecedents = arg.premiseIds
      .map(id => claimToPropId.get(id))
      .filter(Boolean) as string[];
    const consequent = claimToPropId.get(arg.conclusionId);
    
    if (!consequent || antecedents.length === 0) continue;
    
    // Determine rule type based on scheme
    const isStrict = isStrictScheme(arg.primarySchemeId);
    
    const rule: ASPICRule = {
      id: ruleName,
      name: ruleName,
      type: isStrict ? 'strict' : 'defeasible',
      antecedents,
      consequent,
      schemeId: arg.primarySchemeId
    };
    
    if (isStrict) {
      strictRules.push(rule);
    } else {
      defeasibleRules.push(rule);
    }
  }
  
  // Step 3: Infer preferences from confidence scores
  const sortedRules = [...defeasibleRules].sort((a, b) => {
    const argA = result.arguments.find(arg => `r_${arg.id}` === a.id);
    const argB = result.arguments.find(arg => `r_${arg.id}` === b.id);
    return (argB?.confidence || 0) - (argA?.confidence || 0);
  });
  
  for (let i = 0; i < sortedRules.length - 1; i++) {
    preferences.push({
      rule1: sortedRules[i + 1].id,  // Lower confidence = less preferred
      rule2: sortedRules[i].id,       // Higher confidence = more preferred
      basis: 'explicit'
    });
  }
  
  return {
    propositions,
    strictRules,
    defeasibleRules,
    knowledgeBase,
    preferences,
    contraries: inferContraries(propositions)
  };
}

function isStrictScheme(schemeId?: string): boolean {
  // Some schemes represent strict inference (e.g., modus ponens, definition)
  const strictSchemes = ['verbal_classification', 'definition', 'modus_ponens'];
  return schemeId ? strictSchemes.includes(schemeId) : false;
}

function inferContraries(propositions: ASPICProposition[]): { prop: string; contrary: string }[] {
  const contraries: { prop: string; contrary: string }[] = [];
  
  // Simple heuristic: detect negation markers
  for (let i = 0; i < propositions.length; i++) {
    for (let j = i + 1; j < propositions.length; j++) {
      const p1 = propositions[i].text.toLowerCase();
      const p2 = propositions[j].text.toLowerCase();
      
      // Check if one is negation of other
      if (
        p2.startsWith('not ') && p2.slice(4) === p1 ||
        p1.startsWith('not ') && p1.slice(4) === p2 ||
        p2.includes(`not ${p1}`) ||
        p1.includes(`not ${p2}`)
      ) {
        contraries.push({ prop: propositions[i].id, contrary: propositions[j].id });
      }
    }
  }
  
  return contraries;
}

// Export to ASPIC+ theory file format
export function exportASPICToTheoryFormat(theory: ASPICTheory): string {
  const lines: string[] = [
    '% ASPIC+ Theory generated by Mesh Extraction Pipeline',
    `% Generated: ${new Date().toISOString()}`,
    '',
    '% === PROPOSITIONS ===',
  ];
  
  for (const prop of theory.propositions) {
    lines.push(`prop(${prop.id}, "${escapeQuotes(prop.text)}").`);
  }
  
  lines.push('', '% === KNOWLEDGE BASE ===');
  for (const kb of theory.knowledgeBase) {
    lines.push(`kb(${kb}).`);
  }
  
  lines.push('', '% === STRICT RULES ===');
  for (const rule of theory.strictRules) {
    lines.push(`strict_rule(${rule.id}, [${rule.antecedents.join(', ')}], ${rule.consequent}).`);
  }
  
  lines.push('', '% === DEFEASIBLE RULES ===');
  for (const rule of theory.defeasibleRules) {
    const schemePart = rule.schemeId ? `, scheme(${rule.schemeId})` : '';
    lines.push(`def_rule(${rule.id}, [${rule.antecedents.join(', ')}], ${rule.consequent}${schemePart}).`);
  }
  
  lines.push('', '% === PREFERENCES ===');
  for (const pref of theory.preferences) {
    lines.push(`prefer(${pref.rule2}, ${pref.rule1}).  % ${pref.rule2} > ${pref.rule1}`);
  }
  
  lines.push('', '% === CONTRARIES ===');
  for (const c of theory.contraries) {
    lines.push(`contrary(${c.prop}, ${c.contrary}).`);
  }
  
  return lines.join('\n');
}
```

---

### 12. CEG (Carneades Argument Evaluation Structure) Export

**Goal**: Export to Carneades format for evidence-weighted argument evaluation.

#### 12.1 Carneades Model Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CARNEADES ARGUMENT EVALUATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Key Concepts:                                                               │
│                                                                              │
│  STATEMENTS: Propositions with proof standards                               │
│    • proofStandard: PE (preponderance) | CCE (clear & convincing) |         │
│                     BRD (beyond reasonable doubt) | SE (scintilla)          │
│    • value: true | false | unknown                                          │
│    • weight: 0.0 - 1.0                                                       │
│                                                                              │
│  ARGUMENTS: Support or attack statements                                     │
│    • premises: list of statements                                           │
│    • conclusion: statement                                                  │
│    • weight: intrinsic strength of inference                                │
│    • scheme: argumentation scheme used                                      │
│                                                                              │
│  EVALUATION: Determine statement acceptability                               │
│    • Aggregate pro/con arguments by weight                                  │
│    • Compare to proof standard threshold                                    │
│    • Propagate through argument graph                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 12.2 Carneades Converter

```typescript
// lib/export/carneades-converter.ts

type ProofStandard = 'SE' | 'PE' | 'CCE' | 'BRD' | 'DV';

interface CarneadesStatement {
  id: string;
  text: string;
  proofStandard: ProofStandard;
  value?: 'true' | 'false' | 'unknown';
  weight?: number;
  assumed?: boolean;
}

interface CarneadesArgument {
  id: string;
  conclusion: string;           // Statement ID
  premises: string[];           // Statement IDs
  exceptions?: string[];        // Exception statement IDs
  weight: number;               // 0.0 - 1.0
  pro: boolean;                 // true = supports, false = attacks
  scheme?: string;
}

interface CarneadesArgumentGraph {
  statements: CarneadesStatement[];
  arguments: CarneadesArgument[];
  metadata: {
    title?: string;
    source?: string;
    created: string;
  };
}

// Map claim types to proof standards
function getProofStandard(claimType: string, confidence: number): ProofStandard {
  if (claimType === 'hypothesis') return 'SE';      // Scintilla of evidence
  if (claimType === 'conclusion' && confidence > 0.8) return 'CCE';  // Clear & convincing
  if (claimType === 'evidence') return 'PE';         // Preponderance
  return 'PE';  // Default
}

export function convertToCarneades(
  result: ExtractionResult,
  options: CarneadesConversionOptions
): CarneadesArgumentGraph {
  const statements: CarneadesStatement[] = [];
  const carguments: CarneadesArgument[] = [];
  
  const claimToStatementId = new Map<string, string>();
  
  // Convert claims to statements
  for (const claim of result.claims) {
    const stmtId = `s_${claim.id}`;
    claimToStatementId.set(claim.id, stmtId);
    
    statements.push({
      id: stmtId,
      text: claim.text,
      proofStandard: getProofStandard(claim.claimType || 'assertion', claim.confidence),
      weight: claim.confidence,
      assumed: claim.claimType === 'premise' && claim.confidence > 0.9
    });
  }
  
  // Convert arguments
  for (const arg of result.arguments) {
    const conclusionId = claimToStatementId.get(arg.conclusionId);
    if (!conclusionId) continue;
    
    const premiseIds = arg.premiseIds
      .map(id => claimToStatementId.get(id))
      .filter(Boolean) as string[];
    
    carguments.push({
      id: `a_${arg.id}`,
      conclusion: conclusionId,
      premises: premiseIds,
      weight: arg.confidence,
      pro: true,  // Extracted arguments support their conclusions
      scheme: arg.primarySchemeId
    });
  }
  
  return {
    statements,
    arguments: carguments,
    metadata: {
      source: result.metadata.sourceId,
      created: new Date().toISOString()
    }
  };
}

// Export to Carneades JSON format (compatible with Carneades web tools)
export function exportCarneadesToJSON(graph: CarneadesArgumentGraph): string {
  return JSON.stringify({
    meta: graph.metadata,
    statements: Object.fromEntries(
      graph.statements.map(s => [s.id, {
        text: { en: s.text },
        standard: s.proofStandard,
        weight: s.weight,
        assumed: s.assumed
      }])
    ),
    arguments: Object.fromEntries(
      graph.arguments.map(a => [a.id, {
        conclusion: a.conclusion,
        premises: a.premises,
        exceptions: a.exceptions || [],
        weight: a.weight,
        pro: a.pro,
        scheme: a.scheme
      }])
    )
  }, null, 2);
}
```

---

### 13. Unified Export API

```typescript
// lib/export/index.ts

import { convertToAIF, exportAIFToJSON, exportAIFToTurtle } from './aif-converter';
import { convertToASPIC, exportASPICToTheoryFormat } from './aspic-converter';
import { convertToCarneades, exportCarneadesToJSON } from './carneades-converter';

export type ExportFormat = 
  | 'aif-json'
  | 'aif-rdf'
  | 'aspic-theory'
  | 'carneades-json'
  | 'mesh-native';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeConfidenceScores: boolean;
  baseURI?: string;
}

export async function exportExtractionResult(
  result: ExtractionResult,
  options: ExportOptions
): Promise<{ content: string; mimeType: string; filename: string }> {
  
  switch (options.format) {
    case 'aif-json': {
      const aifGraph = convertToAIF(result, {
        includeMetadata: options.includeMetadata,
        includeLocutions: false,
        includeSchemeFulfillments: true,
        baseURI: options.baseURI || 'https://mesh.app/aif'
      });
      return {
        content: exportAIFToJSON(aifGraph),
        mimeType: 'application/json',
        filename: `extraction-${result.jobId}-aif.json`
      };
    }
    
    case 'aif-rdf': {
      const aifGraph = convertToAIF(result, {
        includeMetadata: options.includeMetadata,
        includeLocutions: false,
        includeSchemeFulfillments: true,
        baseURI: options.baseURI || 'https://mesh.app/aif'
      });
      return {
        content: exportAIFToTurtle(aifGraph),
        mimeType: 'text/turtle',
        filename: `extraction-${result.jobId}-aif.ttl`
      };
    }
    
    case 'aspic-theory': {
      const aspicTheory = convertToASPIC(result, {
        includeSchemeAnnotations: true
      });
      return {
        content: exportASPICToTheoryFormat(aspicTheory),
        mimeType: 'text/plain',
        filename: `extraction-${result.jobId}-aspic.theory`
      };
    }
    
    case 'carneades-json': {
      const carneadesGraph = convertToCarneades(result, {
        defaultProofStandard: 'PE'
      });
      return {
        content: exportCarneadesToJSON(carneadesGraph),
        mimeType: 'application/json',
        filename: `extraction-${result.jobId}-carneades.json`
      };
    }
    
    case 'mesh-native':
    default: {
      return {
        content: JSON.stringify(result, null, 2),
        mimeType: 'application/json',
        filename: `extraction-${result.jobId}.json`
      };
    }
  }
}

// API route for exports
// app/api/extraction/[jobId]/export/route.ts
export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') as ExportFormat || 'mesh-native';
  
  // Load extraction job result
  const job = await prisma.extractionJob.findUnique({
    where: { id: params.jobId },
    include: {
      extractedClaims: true,
      extractedArguments: {
        include: { premises: true }
      }
    }
  });
  
  if (!job || job.status !== 'APPROVED') {
    return new Response('Job not found or not approved', { status: 404 });
  }
  
  const result = reconstructExtractionResult(job);
  const exported = await exportExtractionResult(result, {
    format,
    includeMetadata: true,
    includeConfidenceScores: true
  });
  
  return new Response(exported.content, {
    headers: {
      'Content-Type': exported.mimeType,
      'Content-Disposition': `attachment; filename="${exported.filename}"`
    }
  });
}
```

---

*Continued in Part 4: User Interface & Workflows*

---

## Part 3 Summary

This part detailed:

1. **AIF Conversion**: 
   - I-nodes for claims, RA-nodes for arguments, CA-nodes for attacks
   - JSON and RDF/Turtle export formats
   - W3C-compliant ontology mapping

2. **ASPIC+ Generation**:
   - Propositions, strict rules, defeasible rules
   - Knowledge base construction
   - Preference ordering from confidence scores
   - Contrary inference

3. **Carneades Export**:
   - Statements with proof standards
   - Weighted argument evaluation
   - Evidence graph structure

4. **Unified Export API**:
   - Single interface for all formats
   - API route for download

**Next in Part 4:**
- Extraction UI components
- Human-in-the-loop verification workflow
- Integration with ArticleReaderWithPins
- Real-time extraction feedback

---

## Part 4: User Interface & Workflows

### 14. Extraction UI Components

**Goal**: Provide intuitive interfaces for initiating, monitoring, and reviewing extractions.

#### 14.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXTRACTION UI COMPONENT HIERARCHY                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ArticleReaderWithPins (existing)                                            │
│  └── ExtractionProvider (new context)                                       │
│      │                                                                       │
│      ├── ExtractionToolbar                                                  │
│      │   ├── ExtractButton ("Extract Claims & Arguments")                   │
│      │   ├── ExtractionProgress (during processing)                         │
│      │   └── ExtractionModeToggle (view: off | highlights | full)          │
│      │                                                                       │
│      ├── ExtractionOverlay (highlights in article body)                     │
│      │   ├── ClaimHighlight (per extracted claim)                           │
│      │   ├── ArgumentConnector (lines linking premises to conclusions)      │
│      │   └── ConfidenceBadge (shows extraction confidence)                  │
│      │                                                                       │
│      ├── ExtractionRail (right sidebar, parallel to comment rail)           │
│      │   ├── ClaimCard (per claim, with accept/reject/edit)                │
│      │   ├── ArgumentCard (shows structure, scheme)                        │
│      │   └── EvidenceCard (linked citations)                               │
│      │                                                                       │
│      └── ExtractionReviewPanel (slide-out for detailed review)              │
│          ├── ClaimEditor (edit claim text)                                  │
│          ├── ArgumentStructureEditor (drag-drop premises)                   │
│          ├── SchemeSelector (choose/change scheme)                          │
│          └── ApprovalActions (approve all, reject all, publish)            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 14.2 ExtractionProvider Context

```typescript
// components/article/extraction/ExtractionContext.tsx

"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ExtractedClaimData, ExtractedArgumentData, ExtractionResult } from '@/lib/extraction/types';

interface ExtractionState {
  // Job state
  jobId: string | null;
  status: 'idle' | 'extracting' | 'reviewing' | 'approved' | 'published';
  progress: number;  // 0-100 during extraction
  
  // Extracted content
  claims: ExtractedClaimData[];
  arguments: ExtractedArgumentData[];
  
  // UI state
  viewMode: 'off' | 'highlights' | 'full';
  selectedClaimId: string | null;
  selectedArgumentId: string | null;
  
  // Stats
  stats: {
    totalClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    modifiedClaims: number;
    totalArguments: number;
    approvedArguments: number;
  };
}

interface ExtractionActions {
  // Extraction
  startExtraction: (articleId: string, config?: ExtractionConfig) => Promise<void>;
  cancelExtraction: () => void;
  
  // Review actions
  approveClaim: (claimId: string) => void;
  rejectClaim: (claimId: string) => void;
  modifyClaim: (claimId: string, newText: string) => void;
  mergeClaims: (claimIds: string[], targetId: string) => void;
  
  approveArgument: (argumentId: string) => void;
  rejectArgument: (argumentId: string) => void;
  modifyArgumentStructure: (argumentId: string, premiseIds: string[], conclusionId: string) => void;
  changeScheme: (argumentId: string, schemeId: string) => void;
  
  // Bulk actions
  approveAll: () => void;
  rejectAll: () => void;
  publishApproved: () => Promise<void>;
  
  // UI
  setViewMode: (mode: 'off' | 'highlights' | 'full') => void;
  selectClaim: (claimId: string | null) => void;
  selectArgument: (argumentId: string | null) => void;
}

const ExtractionContext = createContext<{
  state: ExtractionState;
  actions: ExtractionActions;
} | null>(null);

export function ExtractionProvider({ 
  articleId, 
  children 
}: { 
  articleId: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<ExtractionState>({
    jobId: null,
    status: 'idle',
    progress: 0,
    claims: [],
    arguments: [],
    viewMode: 'off',
    selectedClaimId: null,
    selectedArgumentId: null,
    stats: {
      totalClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0,
      modifiedClaims: 0,
      totalArguments: 0,
      approvedArguments: 0
    }
  });
  
  const startExtraction = useCallback(async (articleId: string, config?: ExtractionConfig) => {
    setState(s => ({ ...s, status: 'extracting', progress: 0 }));
    
    try {
      // Start extraction job
      const response = await fetch('/api/extraction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'article', sourceId: articleId, config })
      });
      
      const { jobId } = await response.json();
      setState(s => ({ ...s, jobId }));
      
      // Poll for progress
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/extraction/${jobId}/status`);
        const status = await statusRes.json();
        
        setState(s => ({ ...s, progress: status.progress }));
        
        if (status.status === 'PENDING_REVIEW') {
          clearInterval(pollInterval);
          
          // Load results
          const resultsRes = await fetch(`/api/extraction/${jobId}/results`);
          const results: ExtractionResult = await resultsRes.json();
          
          setState(s => ({
            ...s,
            status: 'reviewing',
            claims: results.claims,
            arguments: results.arguments,
            viewMode: 'highlights',
            stats: {
              totalClaims: results.claims.length,
              approvedClaims: 0,
              rejectedClaims: 0,
              modifiedClaims: 0,
              totalArguments: results.arguments.length,
              approvedArguments: 0
            }
          }));
        }
      }, 1000);
      
    } catch (error) {
      setState(s => ({ ...s, status: 'idle', progress: 0 }));
      throw error;
    }
  }, []);
  
  const approveClaim = useCallback((claimId: string) => {
    setState(s => ({
      ...s,
      claims: s.claims.map(c => 
        c.id === claimId ? { ...c, status: 'APPROVED' as const } : c
      ),
      stats: {
        ...s.stats,
        approvedClaims: s.stats.approvedClaims + 1
      }
    }));
  }, []);
  
  const rejectClaim = useCallback((claimId: string) => {
    setState(s => ({
      ...s,
      claims: s.claims.map(c => 
        c.id === claimId ? { ...c, status: 'REJECTED' as const } : c
      ),
      stats: {
        ...s.stats,
        rejectedClaims: s.stats.rejectedClaims + 1
      }
    }));
  }, []);
  
  const modifyClaim = useCallback((claimId: string, newText: string) => {
    setState(s => ({
      ...s,
      claims: s.claims.map(c => 
        c.id === claimId 
          ? { ...c, text: newText, status: 'MODIFIED' as const }
          : c
      ),
      stats: {
        ...s.stats,
        modifiedClaims: s.stats.modifiedClaims + 1
      }
    }));
  }, []);
  
  const publishApproved = useCallback(async () => {
    if (!state.jobId) return;
    
    const approvedClaims = state.claims.filter(c => 
      c.status === 'APPROVED' || c.status === 'MODIFIED'
    );
    const approvedArguments = state.arguments.filter(a => 
      a.status === 'APPROVED' || a.status === 'MODIFIED'
    );
    
    await fetch(`/api/extraction/${state.jobId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claimIds: approvedClaims.map(c => c.id),
        argumentIds: approvedArguments.map(a => a.id)
      })
    });
    
    setState(s => ({ ...s, status: 'published' }));
  }, [state.jobId, state.claims, state.arguments]);
  
  // ... additional actions ...
  
  const actions: ExtractionActions = {
    startExtraction,
    cancelExtraction: () => setState(s => ({ ...s, status: 'idle' })),
    approveClaim,
    rejectClaim,
    modifyClaim,
    mergeClaims: () => {},  // TODO
    approveArgument: () => {},  // TODO
    rejectArgument: () => {},  // TODO
    modifyArgumentStructure: () => {},  // TODO
    changeScheme: () => {},  // TODO
    approveAll: () => {
      setState(s => ({
        ...s,
        claims: s.claims.map(c => ({ ...c, status: 'APPROVED' as const })),
        arguments: s.arguments.map(a => ({ ...a, status: 'APPROVED' as const }))
      }));
    },
    rejectAll: () => {
      setState(s => ({
        ...s,
        claims: s.claims.map(c => ({ ...c, status: 'REJECTED' as const })),
        arguments: s.arguments.map(a => ({ ...a, status: 'REJECTED' as const }))
      }));
    },
    publishApproved,
    setViewMode: (mode) => setState(s => ({ ...s, viewMode: mode })),
    selectClaim: (id) => setState(s => ({ ...s, selectedClaimId: id })),
    selectArgument: (id) => setState(s => ({ ...s, selectedArgumentId: id }))
  };
  
  return (
    <ExtractionContext.Provider value={{ state, actions }}>
      {children}
    </ExtractionContext.Provider>
  );
}

export function useExtraction() {
  const context = useContext(ExtractionContext);
  if (!context) throw new Error('useExtraction must be within ExtractionProvider');
  return context;
}
```

#### 14.3 Claim Highlight Overlay

```typescript
// components/article/extraction/ClaimHighlight.tsx

"use client";

import { useMemo } from 'react';
import { Anchor } from '@/types/comments';
import { ExtractedClaimData } from '@/lib/extraction/types';
import { useExtraction } from './ExtractionContext';
import { getAnchorRects } from '../ArticleReaderWithPins';  // Reuse existing anchor utils

interface ClaimHighlightProps {
  claim: ExtractedClaimData;
  containerRef: React.RefObject<HTMLDivElement>;
}

const STATUS_COLORS = {
  PENDING: 'bg-amber-200/40 border-amber-400',
  APPROVED: 'bg-green-200/40 border-green-500',
  REJECTED: 'bg-red-200/30 border-red-400 opacity-50',
  MODIFIED: 'bg-blue-200/40 border-blue-500',
  MERGED: 'bg-purple-200/40 border-purple-500',
  PUBLISHED: 'bg-green-300/40 border-green-600'
};

const CLAIM_TYPE_ICONS = {
  assertion: '📝',
  hypothesis: '🔬',
  conclusion: '🎯',
  premise: '📌',
  evidence: '📊'
};

export function ClaimHighlight({ claim, containerRef }: ClaimHighlightProps) {
  const { state, actions } = useExtraction();
  const isSelected = state.selectedClaimId === claim.id;
  
  const rects = useMemo(() => {
    if (!containerRef.current) return [];
    return getAnchorRects(claim.anchor, containerRef.current);
  }, [claim.anchor, containerRef.current]);
  
  if (rects.length === 0) return null;
  
  const colorClass = STATUS_COLORS[claim.status] || STATUS_COLORS.PENDING;
  
  return (
    <>
      {/* Highlight rectangles */}
      {rects.map((rect, i) => (
        <div
          key={`${claim.id}-rect-${i}`}
          className={`
            absolute pointer-events-auto cursor-pointer
            border-b-2 transition-all duration-150
            ${colorClass}
            ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
          `}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }}
          onClick={() => actions.selectClaim(claim.id)}
          onMouseEnter={() => actions.selectClaim(claim.id)}
        />
      ))}
      
      {/* Floating badge on first rect */}
      {rects[0] && (
        <div
          className={`
            absolute pointer-events-auto
            flex items-center gap-1 px-1.5 py-0.5
            text-[10px] font-medium rounded-full
            shadow-sm border
            ${colorClass}
          `}
          style={{
            top: rects[0].top - 18,
            left: rects[0].left
          }}
        >
          <span>{CLAIM_TYPE_ICONS[claim.claimType || 'assertion']}</span>
          <span className="opacity-70">{Math.round(claim.confidence * 100)}%</span>
        </div>
      )}
    </>
  );
}

// Wrapper for all claim highlights
export function ExtractionOverlay({ 
  containerRef 
}: { 
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const { state } = useExtraction();
  
  if (state.viewMode === 'off') return null;
  
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {state.claims.map(claim => (
        <ClaimHighlight
          key={claim.id}
          claim={claim}
          containerRef={containerRef}
        />
      ))}
      
      {/* Argument connectors (in full mode) */}
      {state.viewMode === 'full' && (
        <ArgumentConnectors 
          arguments={state.arguments}
          claims={state.claims}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}
```

#### 14.4 Extraction Review Rail

```typescript
// components/article/extraction/ExtractionRail.tsx

"use client";

import { useExtraction } from './ExtractionContext';
import { ExtractedClaimData, ExtractedArgumentData } from '@/lib/extraction/types';
import { CheckIcon, XIcon, PencilIcon, LinkIcon } from 'lucide-react';

export function ExtractionRail() {
  const { state, actions } = useExtraction();
  
  if (state.status !== 'reviewing' || state.viewMode === 'off') {
    return null;
  }
  
  const pendingClaims = state.claims.filter(c => c.status === 'PENDING');
  const reviewedClaims = state.claims.filter(c => c.status !== 'PENDING');
  
  return (
    <div className="w-80 h-full overflow-y-auto bg-slate-50 border-l border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Extracted Claims</h3>
        <span className="text-sm text-slate-500">
          {state.stats.approvedClaims}/{state.stats.totalClaims} reviewed
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all"
          style={{ 
            width: `${(state.stats.approvedClaims / state.stats.totalClaims) * 100}%` 
          }}
        />
      </div>
      
      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={actions.approveAll}
          className="flex-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Approve All
        </button>
        <button
          onClick={() => actions.publishApproved()}
          className="flex-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          disabled={state.stats.approvedClaims === 0}
        >
          Publish ({state.stats.approvedClaims})
        </button>
      </div>
      
      {/* Pending claims */}
      {pendingClaims.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            Pending Review ({pendingClaims.length})
          </h4>
          <div className="space-y-2">
            {pendingClaims.map(claim => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        </div>
      )}
      
      {/* Reviewed claims */}
      {reviewedClaims.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            Reviewed ({reviewedClaims.length})
          </h4>
          <div className="space-y-2">
            {reviewedClaims.map(claim => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        </div>
      )}
      
      {/* Arguments section */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4">Extracted Arguments</h3>
        <div className="space-y-3">
          {state.arguments.map(arg => (
            <ArgumentCard key={arg.id} argument={arg} claims={state.claims} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClaimCard({ claim }: { claim: ExtractedClaimData }) {
  const { state, actions } = useExtraction();
  const isSelected = state.selectedClaimId === claim.id;
  
  const statusStyles = {
    PENDING: 'border-amber-300 bg-amber-50',
    APPROVED: 'border-green-400 bg-green-50',
    REJECTED: 'border-red-300 bg-red-50 opacity-60',
    MODIFIED: 'border-blue-400 bg-blue-50',
    MERGED: 'border-purple-400 bg-purple-50',
    PUBLISHED: 'border-green-500 bg-green-100'
  };
  
  return (
    <div
      className={`
        p-3 rounded-lg border transition-all cursor-pointer
        ${statusStyles[claim.status]}
        ${isSelected ? 'ring-2 ring-indigo-500' : ''}
      `}
      onClick={() => actions.selectClaim(claim.id)}
    >
      {/* Claim type badge */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
          {claim.claimType?.toUpperCase() || 'CLAIM'}
        </span>
        <span className="text-[10px] text-slate-500">
          {Math.round(claim.confidence * 100)}% confidence
        </span>
      </div>
      
      {/* Claim text */}
      <p className="text-sm text-slate-800 line-clamp-3 mb-2">
        {claim.text}
      </p>
      
      {/* Actions */}
      {claim.status === 'PENDING' && (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); actions.approveClaim(claim.id); }}
            className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
            title="Approve"
          >
            <CheckIcon size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); actions.rejectClaim(claim.id); }}
            className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
            title="Reject"
          >
            <XIcon size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); /* open editor */ }}
            className="p-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
            title="Edit"
          >
            <PencilIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function ArgumentCard({ 
  argument, 
  claims 
}: { 
  argument: ExtractedArgumentData;
  claims: ExtractedClaimData[];
}) {
  const { actions } = useExtraction();
  const conclusion = claims.find(c => c.id === argument.conclusionId);
  const premises = argument.premiseIds.map(id => claims.find(c => c.id === id)).filter(Boolean);
  
  return (
    <div className="p-3 rounded-lg border border-slate-300 bg-white">
      {/* Scheme badge */}
      {argument.primarySchemeId && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {argument.primarySchemeId.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-slate-500">
            {Math.round((argument.schemeConfidence || 0) * 100)}%
          </span>
        </div>
      )}
      
      {/* Premises */}
      <div className="space-y-1 mb-2">
        {premises.map((p, i) => (
          <div key={p!.id} className="flex items-start gap-1.5">
            <span className="text-[10px] text-slate-400 mt-0.5">P{i + 1}</span>
            <p className="text-xs text-slate-600 line-clamp-2">{p!.text}</p>
          </div>
        ))}
      </div>
      
      {/* Arrow */}
      <div className="text-center text-slate-400 text-sm">↓</div>
      
      {/* Conclusion */}
      <div className="flex items-start gap-1.5 mt-1">
        <span className="text-[10px] text-indigo-500 font-medium mt-0.5">∴</span>
        <p className="text-xs text-slate-800 font-medium line-clamp-2">
          {conclusion?.text}
        </p>
      </div>
      
      {/* Confidence */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          Argument confidence: {Math.round(argument.confidence * 100)}%
        </span>
        <button
          onClick={() => actions.selectArgument(argument.id)}
          className="text-[10px] text-indigo-600 hover:underline"
        >
          Edit structure →
        </button>
      </div>
    </div>
  );
}
```

---

### 15. Integration with ArticleReaderWithPins

**Goal**: Seamlessly integrate extraction UI into existing article reading experience.

#### 15.1 Enhanced ArticleReaderWithPins

```typescript
// components/article/ArticleReaderWithPinsExtended.tsx

"use client";

import { useRef } from 'react';
import ArticleReaderWithPins from './ArticleReaderWithPins';
import { ExtractionProvider, useExtraction } from './extraction/ExtractionContext';
import { ExtractionToolbar } from './extraction/ExtractionToolbar';
import { ExtractionOverlay } from './extraction/ClaimHighlight';
import { ExtractionRail } from './extraction/ExtractionRail';

interface ExtendedProps {
  // Existing props from ArticleReaderWithPins
  template: string;
  heroSrc?: string | null;
  html: string;
  threads: CommentThread[];
  articleSlug: string;
  title?: string;
  currentUser?: unknown;
  deliberationId?: string;
  
  // New extraction props
  articleId: string;
  extractionEnabled?: boolean;
}

export default function ArticleReaderWithPinsExtended(props: ExtendedProps) {
  const { articleId, extractionEnabled = true, ...readerProps } = props;
  
  if (!extractionEnabled) {
    return <ArticleReaderWithPins {...readerProps} />;
  }
  
  return (
    <ExtractionProvider articleId={articleId}>
      <ArticleReaderWithExtraction {...readerProps} articleId={articleId} />
    </ExtractionProvider>
  );
}

function ArticleReaderWithExtraction({ 
  articleId,
  ...props 
}: ExtendedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state } = useExtraction();
  
  return (
    <div className="flex">
      {/* Main article area */}
      <div className="flex-1 relative">
        {/* Extraction toolbar (floating) */}
        <ExtractionToolbar articleId={articleId} />
        
        {/* Original reader */}
        <div ref={containerRef} className="relative">
          <ArticleReaderWithPins {...props} />
          
          {/* Extraction overlay */}
          <ExtractionOverlay containerRef={containerRef} />
        </div>
      </div>
      
      {/* Extraction rail (conditional) */}
      {state.status === 'reviewing' && state.viewMode !== 'off' && (
        <ExtractionRail />
      )}
    </div>
  );
}
```

#### 15.2 Extraction Toolbar

```typescript
// components/article/extraction/ExtractionToolbar.tsx

"use client";

import { useState } from 'react';
import { useExtraction } from './ExtractionContext';
import { 
  SparklesIcon, 
  EyeIcon, 
  EyeOffIcon,
  SettingsIcon,
  DownloadIcon 
} from 'lucide-react';

interface ExtractionToolbarProps {
  articleId: string;
}

export function ExtractionToolbar({ articleId }: ExtractionToolbarProps) {
  const { state, actions } = useExtraction();
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className="fixed top-20 right-8 z-50 flex flex-col gap-2">
      {/* Main extraction button */}
      {state.status === 'idle' && (
        <button
          onClick={() => actions.startExtraction(articleId)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <SparklesIcon size={18} />
          <span className="font-medium">Extract Claims</span>
        </button>
      )}
      
      {/* Progress indicator */}
      {state.status === 'extracting' && (
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-lg border border-slate-200">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">Extracting...</span>
            <span className="text-xs text-slate-500">{state.progress}% complete</span>
          </div>
        </div>
      )}
      
      {/* Review mode controls */}
      {state.status === 'reviewing' && (
        <>
          {/* View mode toggle */}
          <div className="flex bg-white rounded-lg shadow-lg border border-slate-200 p-1">
            <button
              onClick={() => actions.setViewMode('off')}
              className={`p-2 rounded ${state.viewMode === 'off' ? 'bg-slate-200' : ''}`}
              title="Hide highlights"
            >
              <EyeOffIcon size={18} className="text-slate-600" />
            </button>
            <button
              onClick={() => actions.setViewMode('highlights')}
              className={`p-2 rounded ${state.viewMode === 'highlights' ? 'bg-slate-200' : ''}`}
              title="Show claim highlights"
            >
              <EyeIcon size={18} className="text-slate-600" />
            </button>
            <button
              onClick={() => actions.setViewMode('full')}
              className={`p-2 rounded ${state.viewMode === 'full' ? 'bg-indigo-100' : ''}`}
              title="Show arguments"
            >
              <SparklesIcon size={18} className="text-indigo-600" />
            </button>
          </div>
          
          {/* Stats badge */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2">
            <div className="text-xs text-slate-500">Extracted</div>
            <div className="flex gap-3 mt-1">
              <span className="text-sm font-medium text-slate-700">
                {state.stats.totalClaims} claims
              </span>
              <span className="text-sm font-medium text-slate-700">
                {state.stats.totalArguments} args
              </span>
            </div>
          </div>
          
          {/* Export button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50"
            title="Export options"
          >
            <DownloadIcon size={18} className="text-slate-600" />
          </button>
        </>
      )}
      
      {/* Export modal */}
      {showSettings && (
        <ExportModal 
          jobId={state.jobId!} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}

function ExportModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const formats = [
    { id: 'mesh-native', name: 'Mesh JSON', desc: 'Native format for re-import' },
    { id: 'aif-json', name: 'AIF JSON', desc: 'Argument Interchange Format' },
    { id: 'aif-rdf', name: 'AIF RDF/Turtle', desc: 'Semantic web format' },
    { id: 'aspic-theory', name: 'ASPIC+ Theory', desc: 'For formal evaluation' },
    { id: 'carneades-json', name: 'Carneades', desc: 'Evidence-weighted format' }
  ];
  
  const handleExport = async (format: string) => {
    window.open(`/api/extraction/${jobId}/export?format=${format}`, '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
        <h3 className="text-lg font-semibold mb-4">Export Extraction</h3>
        
        <div className="space-y-2">
          {formats.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => handleExport(fmt.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left"
            >
              <div>
                <div className="font-medium text-slate-800">{fmt.name}</div>
                <div className="text-xs text-slate-500">{fmt.desc}</div>
              </div>
              <DownloadIcon size={18} className="text-slate-400" />
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-slate-600 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

---

### 16. API Routes for Extraction

```typescript
// app/api/extraction/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { extractFromArticle } from '@/lib/extraction/orchestrator';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { sourceType, sourceId, config } = await request.json();
  
  // Validate source exists
  if (sourceType === 'article') {
    const article = await prisma.article.findUnique({
      where: { id: sourceId },
      select: { id: true, astJson: true, authorId: true }
    });
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
  }
  
  // Create extraction job
  const job = await prisma.extractionJob.create({
    data: {
      sourceType,
      sourceId,
      status: 'QUEUED',
      configJson: config || {},
      createdById: session.user.id
    }
  });
  
  // Queue background processing
  // In production, use BullMQ or similar
  processExtractionJob(job.id).catch(console.error);
  
  return NextResponse.json({ jobId: job.id });
}

async function processExtractionJob(jobId: string) {
  // Update status
  await prisma.extractionJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING', startedAt: new Date() }
  });
  
  try {
    const job = await prisma.extractionJob.findUnique({
      where: { id: jobId }
    });
    
    if (job?.sourceType === 'article') {
      const article = await prisma.article.findUnique({
        where: { id: job.sourceId },
        select: { astJson: true }
      });
      
      const config = job.configJson as ExtractionConfig || {
        claimModel: 'gpt-4',
        claimSensitivity: 0.5,
        includeImplicitClaims: true,
        minPremises: 1,
        maxPremises: 5,
        argumentMinConfidence: 0.4,
        useLLMForArguments: true,
        schemeMatcherWeights: { ruleBased: 0.3, embedding: 0.3, llm: 0.4 },
        linkCitations: true,
        resolveDOIs: true
      };
      
      const result = await extractFromArticle(
        job.sourceId,
        article!.astJson,
        config
      );
      
      // Store results
      for (const claim of result.claims) {
        await prisma.extractedClaim.create({
          data: {
            jobId,
            text: claim.text,
            anchorJson: claim.anchor,
            sourceText: claim.sourceText,
            confidence: claim.confidence,
            claimType: claim.claimType,
            isImplicit: claim.isImplicit,
            status: 'PENDING'
          }
        });
      }
      
      for (const arg of result.arguments) {
        const extArg = await prisma.extractedArgument.create({
          data: {
            jobId,
            conclusionId: arg.conclusionId,  // Will need ID mapping
            primarySchemeId: arg.primarySchemeId,
            schemeConfidence: arg.schemeConfidence,
            confidence: arg.confidence,
            status: 'PENDING'
          }
        });
        
        // Create premise links
        for (const premiseId of arg.premiseIds) {
          await prisma.extractedArgumentPremise.create({
            data: {
              argumentId: extArg.id,
              claimId: premiseId  // Will need ID mapping
            }
          });
        }
      }
      
      await prisma.extractionJob.update({
        where: { id: jobId },
        data: {
          status: 'PENDING_REVIEW',
          completedAt: new Date(),
          claimsExtracted: result.claims.length,
          argumentsExtracted: result.arguments.length,
          rawResultJson: result
        }
      });
    }
    
  } catch (error) {
    await prisma.extractionJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}
```

---

### 17. Publish Workflow

```typescript
// app/api/extraction/[jobId]/publish/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { generateMoid } from '@/lib/util/moid';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { claimIds, argumentIds, deliberationId } = await request.json();
  
  const job = await prisma.extractionJob.findUnique({
    where: { id: params.jobId },
    include: {
      extractedClaims: { where: { id: { in: claimIds } } },
      extractedArguments: { 
        where: { id: { in: argumentIds } },
        include: { premises: true }
      }
    }
  });
  
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  // Get or create target deliberation
  let targetDelibId = deliberationId || job.deliberationId;
  if (!targetDelibId && job.sourceType === 'article') {
    // Create deliberation linked to article
    const delib = await prisma.deliberation.create({
      data: {
        name: `Extracted from article ${job.sourceId}`,
        hostType: 'article',
        hostId: job.sourceId,
        createdById: session.user.id
      }
    });
    targetDelibId = delib.id;
  }
  
  const claimIdMap = new Map<string, string>();  // ExtractedClaim.id → Claim.id
  const createdClaims: string[] = [];
  const createdArguments: string[] = [];
  
  // Create Claim entities
  for (const extClaim of job.extractedClaims) {
    const claim = await prisma.claim.create({
      data: {
        text: extClaim.modifiedText || extClaim.text,
        createdById: session.user.id,
        moid: generateMoid(),
        deliberationId: targetDelibId,
        extractedFromJobId: job.id,
        extractionConfidence: extClaim.confidence
      }
    });
    
    claimIdMap.set(extClaim.id, claim.id);
    createdClaims.push(claim.id);
    
    // Create ArticleClaimAnchor
    if (job.sourceType === 'article') {
      await prisma.articleClaimAnchor.create({
        data: {
          articleId: job.sourceId,
          claimId: claim.id,
          anchorJson: extClaim.anchorJson,
          sourceText: extClaim.sourceText,
          extractionJobId: job.id
        }
      });
    }
    
    // Update extracted claim status
    await prisma.extractedClaim.update({
      where: { id: extClaim.id },
      data: { status: 'PUBLISHED', publishedClaimId: claim.id }
    });
  }
  
  // Create Argument entities
  for (const extArg of job.extractedArguments) {
    const conclusionClaimId = claimIdMap.get(extArg.conclusionId);
    if (!conclusionClaimId) continue;
    
    const argument = await prisma.argument.create({
      data: {
        deliberationId: targetDelibId!,
        authorId: session.user.id,
        text: '',  // Arguments don't have separate text
        conclusionClaimId,
        schemeId: extArg.primarySchemeId,
        confidence: extArg.confidence
      }
    });
    
    // Create premises
    for (const premise of extArg.premises) {
      const premiseClaimId = claimIdMap.get(premise.claimId);
      if (premiseClaimId) {
        await prisma.argumentPremise.create({
          data: {
            argumentId: argument.id,
            claimId: premiseClaimId,
            isImplicit: premise.isImplicit
          }
        });
      }
    }
    
    createdArguments.push(argument.id);
    
    await prisma.extractedArgument.update({
      where: { id: extArg.id },
      data: { status: 'PUBLISHED', publishedArgumentId: argument.id }
    });
  }
  
  // Update job status
  await prisma.extractionJob.update({
    where: { id: params.jobId },
    data: {
      status: 'PUBLISHED',
      deliberationId: targetDelibId,
      claimsApproved: createdClaims.length,
      argumentsApproved: createdArguments.length
    }
  });
  
  return NextResponse.json({
    success: true,
    deliberationId: targetDelibId,
    claimsCreated: createdClaims.length,
    argumentsCreated: createdArguments.length
  });
}
```

---

## Part 4 Summary

This part detailed:

1. **Extraction UI Components**:
   - `ExtractionProvider` context for state management
   - `ClaimHighlight` overlay for visual feedback
   - `ExtractionRail` sidebar for review workflow
   - `ExtractionToolbar` for extraction controls

2. **Integration with ArticleReaderWithPins**:
   - Seamless addition to existing article reading
   - Shared anchor utilities
   - Parallel comment and extraction rails

3. **API Routes**:
   - `/api/extraction/start` - Initiate extraction job
   - `/api/extraction/[jobId]/status` - Poll for progress
   - `/api/extraction/[jobId]/results` - Get extraction results
   - `/api/extraction/[jobId]/publish` - Create real Claims/Arguments
   - `/api/extraction/[jobId]/export` - Export to AIF/ASPIC+/CEG

4. **Publish Workflow**:
   - Map extracted claims to real Claim entities
   - Create Arguments with premises
   - Generate ArticleClaimAnchor for bidirectional linking
   - Update extraction job status

---

## Complete Document Summary

This specification covers the **Article-to-Argument Extraction Pipeline** in four parts:

| Part | Focus | Key Deliverables |
|------|-------|------------------|
| **Part 1** | Architecture & Data Model | System overview, Prisma schema extensions, Anchor design |
| **Part 2** | Extraction Engine | Claim detection, argument assembly, scheme recognition, evidence linking |
| **Part 3** | Ontology Export | AIF, ASPIC+, Carneades converters, unified export API |
| **Part 4** | UI & Workflows | React components, ArticleReaderWithPins integration, publish workflow |

### Implementation Priorities

1. **Phase 1**: Core extraction (claims + basic arguments)
2. **Phase 2**: Scheme recognition
3. **Phase 3**: Evidence linking
4. **Phase 4**: UI integration
5. **Phase 5**: Ontology exports

### Open Questions

1. **LLM selection**: GPT-4 vs Claude for extraction quality/cost tradeoffs?
2. **Implicit claims**: How aggressively to reconstruct enthymemes?
3. **Batch vs. interactive**: Extract whole article or incremental selection?
4. **Multi-user review**: How to handle concurrent review of same extraction?

---

*This document is a living specification. Iterate as implementation reveals new requirements.*
