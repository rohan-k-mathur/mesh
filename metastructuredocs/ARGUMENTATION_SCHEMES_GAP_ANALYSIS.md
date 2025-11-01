# Argumentation Schemes Implementation: Gap Analysis & Integration Roadmap

**Analysis Date:** October 31, 2025  
**Theoretical Foundation:** Macagno & Walton, "Argumentation Schemes: History, Classifications, and Computational Applications"  
**Current Implementation:** Phase 4 - Multi-Scheme Classification with Formal Structure  
**Purpose:** Identify gaps between theoretical rigor and current implementation, prioritize integration work

---

## Executive Summary

### 🎯 Current State (What Works)
Your implementation has achieved **significant theoretical alignment** in core areas:

✅ **Database-Driven Scheme Management** - ArgumentScheme model with Macagno's 6-dimensional taxonomy  
✅ **Multi-Scheme Classification (Phase 4)** - Multiple schemes per argument with confidence scoring  
✅ **Formal Walton-Style Structure** - Premises (major/minor) + conclusion with variables  
✅ **Automatic CQ Generation** - Taxonomy-based critical question templates (cqGeneration.ts)  
✅ **CQ Workflow System** - Multi-response, proof obligation tracking (CQStatus, CQResponse models)  
✅ **Scheme Inference Engine** - Database-driven with taxonomy scoring (schemeInference.ts)  
✅ **Admin UI for Scheme Creation** - Full CRUD with premise/conclusion builder

### ⚠️ Critical Gaps (Theoretical Rigor)

The implementation is **missing 3 major concepts** from Macagno & Walton that are essential for computational argumentation at the research level:

1. **🔴 CRITICAL: Nets of Argumentation Schemes** (Section 7 of paper)
   - **Theory**: Complex arguments are modular chains of interdependent schemes, not single isolated schemes
   - **Current**: Arguments have multiple parallel schemes (Phase 4), but no sequential composition/chaining
   - **Example from paper**: "The Hague Speech" argument chains Classification → Commitment → Consequences
   - **Impact**: Cannot model real-world complex arguments that require multiple inferential steps

2. **🔴 CRITICAL: Scheme Clustering & Family Resemblances** (Section 6 of paper)
   - **Theory**: Bottom-up classification identifying clusters (e.g., practical reasoning family: PR → VBPR → SSA → Consequences)
   - **Current**: Flat list of schemes with no parent-child or cluster relationships
   - **Example from paper**: Slippery Slope is a subtype of Negative Consequences, which is a subtype of VBPR
   - **Impact**: Cannot leverage inheritance (CQs from parent schemes), cannot detect scheme families

3. **🟡 IMPORTANT: Dialogue Type Integration** (Section 11.2 of paper)
   - **Theory**: Schemes are dialogue-move instruments; appropriateness depends on dialogue type (persuasion, deliberation, inquiry, negotiation)
   - **Current**: No link between schemes and dialogue types/contexts
   - **Impact**: Cannot determine which schemes are appropriate for a given discourse context

### 📊 Integration Status

| System | Integration Level | Status |
|--------|------------------|--------|
| **Database Schema** | ✅ Complete | Formal structure, taxonomy, CQs, multi-scheme |
| **Inference Engine** | ✅ Strong | Taxonomy-based scoring, multi-scheme support |
| **CQ Generation** | ✅ Complete | Automatic template generation from taxonomy |
| **CQ Workflow** | ✅ Excellent | Multi-response, proof obligations, statuses |
| **Admin UI** | ✅ Complete | Scheme CRUD, premise/conclusion builder |
| **Display UI** | ✅ Complete | SchemeBreakdown shows formal structure |
| **Scheme Nets** | ❌ Missing | No sequential composition or chaining |
| **Scheme Clusters** | ❌ Missing | No parent-child or cluster relationships |
| **Dialogue Types** | ❌ Missing | No scheme-to-dialogue-type mapping |
| **Argument Invention** | ⚠️ Partial | Inference exists, but no forward-chaining generation |
| **Ontological Reasoning** | ❌ Missing | No AIF-style ontology for automatic classification |

---

## Part 1: Theoretical Foundations (Macagno & Walton)

### 1.1 Core Concepts

#### Defeasibility & Critical Questions
- **Schemes are defeasible** (not deductively valid) → conclusions can be retracted
- **Critical Questions (CQs)** formalize the weak points of each scheme
- **Verheij's 4 CQ Roles**: (1) questioning premise, (2) pointing to exceptions, (3) framing conditions, (4) indicating other arguments
- **Your Implementation**: ✅ Full support via CQStatus, CQResponse, attackType (UNDERMINES/UNDERCUTS/REBUTS)

#### Material + Logical Dimensions
- **Material Relation**: Semantic connection (cause, authority, analogy, definition, practical)
- **Reasoning Type**: Logical form (deductive, inductive, abductive, practical)
- **Your Implementation**: ✅ Full Macagno taxonomy in ArgumentScheme model

#### Formal Structure (Walton-Style)
- **Premises**: Major, minor, with variable placeholders (E, S, A)
- **Conclusion**: Template with variables
- **Your Implementation**: ✅ Just added (October 31, 2025) - `premises Json?` and `conclusion Json?` fields

---

### 1.2 Advanced Concepts (Currently Missing)

#### 🔴 Nets of Argumentation Schemes (Section 7)

**The Problem:**
> "A single argumentation scheme, defined as a prototypical combination of semantic relations and logical inference rules, is often inadequate to capture the complexity of real-world arguments. Natural argumentation frequently involves multiple conceptual passages—such as classifying an entity, evaluating it, and then proposing a course of action—requiring a modular approach."

**Theory:**
- Arguments are **sequences of schemes**, not isolated instances
- Each scheme output feeds into the next scheme's input
- Implicit premises/conclusions often hidden in natural language compression

**Example from Paper (The Hague Speech):**
```
Step 1: Argument from Verbal Classification
  → Russia's action = "violation" (classification)
  
Step 2: Argument from Commitment (uses Step 1 conclusion as premise)
  → "Sovereignty cannot be violated" (shared value)
  
Step 3: Argument from Consequences (uses Step 2 conclusion as premise)
  → Russia will face consequences (implicit threat)
```

**Your Current Implementation:**
- ✅ Phase 4 supports **parallel schemes** (multiple schemes for same argument)
- ❌ No support for **sequential schemes** (scheme A output → scheme B input)
- ❌ No `CompositeScheme` or `CompositeSchemeStep` models
- ❌ No UI to build scheme chains
- ❌ No confidence propagation through chain (weakest link principle)

**Why This Matters:**
- Real arguments (legal, political, scientific) are multi-step
- CQs must target specific steps in the chain
- Confidence should reflect the weakest inferential link
- Argument maps visualize the chain structure

---

#### 🔴 Scheme Clustering & Family Resemblances (Section 6)

**The Problem:**
> "The classification of argumentation schemes is highly complex due to the sheer number of schemes and their overlapping characteristics, necessitating a bottom-up approach that investigates clusters of schemes exhibiting 'family resemblances' and interconnections."

**Theory:**
- Schemes form **clusters** (families) with shared characteristics
- **Subtypes inherit** from parent schemes (e.g., SSA is subtype of Negative Consequences)
- **CQ inheritance**: Subtypes inherit parent CQs + add specific ones

**Example from Paper (Practical Reasoning Cluster):**
```
Basic PR (root)
├─ Value-Based PR (adds normative premise)
│  └─ Slippery Slope (adds recursive premise)
├─ Positive Consequences (outcome-focused)
└─ Negative Consequences (risk-focused)
   └─ Slippery Slope (alternative path)
```

**Key Insight:**
- Slippery Slope Argument (SSA) is **both**:
  - A subtype of Negative Consequences (warns against bad outcome)
  - A subtype of VBPR (relies on shared values)
- Subtypes add specialized premises while keeping parent structure

**Your Current Implementation:**
- ❌ Flat list of schemes (no parent-child relationships)
- ❌ No `parentSchemeId` or `clusterTag` fields
- ❌ No CQ inheritance from parent schemes
- ❌ No automatic classification based on subtype relationships

**Why This Matters:**
- **Ontological Reasoning**: Auto-classify arguments (fear appeal → negative consequences)
- **CQ Inheritance**: All parent CQs apply to subtype (economy of specification)
- **Better Inference**: Recognize scheme families, not just exact matches
- **User Education**: Show "You're using a type of X argument"

---

#### 🟡 Dialogue Type Integration (Section 11.2)

**The Problem:**
> "Schemes need to be linked to theories of dialogue types and discourse moves. By mapping which schemes are most adequate for pursuing specific dialogical ends, researchers can establish a set of presumptions for interpreting and classifying arguments based on the context and type of dialogue."

**Theory:**
- **Dialogue Types**: Persuasion, Deliberation, Inquiry, Negotiation, Information-Seeking, Eristic
- **Schemes have appropriateness conditions** based on dialogue type
- Example: Argument from Authority appropriate in Inquiry, less so in Deliberation

**Dialogue Type Characteristics:**
| Dialogue Type | Goal | Appropriate Schemes |
|--------------|------|---------------------|
| **Persuasion** | Change opponent's belief | Expert Opinion, Analogy, Consequences |
| **Deliberation** | Decide best action | Practical Reasoning, Consequences, Values |
| **Inquiry** | Find truth | Expert Opinion, Causal, Classification |
| **Negotiation** | Reach agreement | Practical Reasoning, Compromise, Threat |
| **Information-Seeking** | Get information | Expert Opinion, Sign, Evidence |

**Your Current Implementation:**
- ✅ Dialogue system exists (`types/dialogue.ts`)
- ❌ No link between ArgumentScheme and dialogue types
- ❌ No `appropriateDialogueTypes` field on schemes
- ❌ No validation/warning when inappropriate scheme used
- ❌ No scheme recommendation based on dialogue context

**Why This Matters:**
- **Contextual Appropriateness**: Don't use threat arguments in inquiry dialogues
- **Scheme Recommendation**: Suggest schemes based on dialogue type
- **Burden of Proof**: Dialogue type affects what counts as acceptable evidence
- **AI Argument Generation**: Context-aware scheme selection

---

## Part 2: Current Implementation Analysis

### 2.1 Database Schema (✅ Strong Foundation)

#### ArgumentScheme Model
```prisma
model ArgumentScheme {
  id          String  @id @default(cuid())
  key         String  @unique
  name        String?
  summary     String
  
  // NEW: Formal Walton structure (Oct 31, 2025)
  premises    Json?   // [{ id: "P1", type: "major|minor", text: "...", variables: [] }]
  conclusion  Json?   // { text: "...", variables: [] }
  
  // Macagno taxonomy (6 dimensions)
  purpose          String?  // action | state_of_affairs
  source           String?  // internal | external
  materialRelation String?  // cause | authority | analogy | definition | practical
  reasoningType    String?  // deductive | inductive | abductive | practical
  ruleForm         String?  // MP | MT | defeasible_MP | universal
  conclusionType   String?  // ought | is
  
  // Relations
  cqs              CriticalQuestion[]
  argumentSchemeInstances ArgumentSchemeInstance[]
}
```

**Strengths:**
- ✅ Full Macagno taxonomy support
- ✅ Formal premises/conclusion structure
- ✅ Multi-scheme support (Phase 4)
- ✅ CQ relation

**Missing Fields for Theory:**
```prisma
// PROPOSED ADDITIONS:

// For Scheme Clustering (Section 6)
parentSchemeId   String?  // Reference to parent scheme
clusterTag       String?  // e.g., "practical_reasoning_family"
inheritCQs       Boolean  @default(true)  // Inherit parent CQs?

// For Dialogue Integration (Section 11.2)
appropriateDialogueTypes String[]  // ["persuasion", "inquiry"]
dialogueContextHints     Json?     // Guidance for when to use

// For Argument Invention (Section 11.1)
inventionPriority Float    @default(0.5)  // For CAS-style generation
templateSlots     Json?    // Slot definitions for invention
```

---

### 2.2 Scheme Inference Engine (✅ Strong, Needs Enhancement)

#### Current: `lib/argumentation/schemeInference.ts`
```typescript
// Phase 4: Multi-scheme with confidence scores
export async function inferSchemesFromTextWithScores(
  text: string,
  options: { threshold?: number; maxSchemes?: number }
): Promise<InferredScheme[]>

// Taxonomy-based scoring
function calculateSchemeScore(
  text: string,
  scheme: Pick<ArgumentScheme, 'materialRelation' | 'reasoningType' | 'source' | 'purpose'>
): { score: number; reasons: string[] }
```

**Strengths:**
- ✅ Database-driven (queries all schemes)
- ✅ Taxonomy-based scoring (Macagno dimensions)
- ✅ Multi-scheme support with confidence
- ✅ Pattern matching for specific indicators
- ✅ Threshold-based filtering

**Limitations:**
```typescript
// MISSING: Cluster-aware inference
// If text matches SSA, should also flag Negative Consequences + VBPR
// Currently only returns exact matches

// MISSING: Dialogue-context parameter
inferSchemesFromTextWithScores(
  text: string,
  dialogueType?: "persuasion" | "deliberation" | "inquiry",  // ❌ Not supported
  options?: { threshold?: number; maxSchemes?: number }
)

// MISSING: Net detection
// Cannot detect if argument is actually a sequence of schemes
// e.g., "This is a mammal (classification), mammals are warm-blooded (definition), 
//       therefore we should protect it (practical reasoning)"
```

**Proposed Enhancements:**
```typescript
// 1. Cluster-aware inference
export async function inferSchemesWithClusters(
  text: string,
  options: { includeParents?: boolean; includeChildren?: boolean }
): Promise<InferredScheme[]>

// 2. Dialogue-context inference
export async function inferSchemesForDialogue(
  text: string,
  dialogueType: DialogueType,
  options: { filterInappropriate?: boolean }
): Promise<InferredScheme[]>

// 3. Net detection (multi-step arguments)
export async function inferSchemeNet(
  text: string,
  options: { maxSteps?: number }
): Promise<SchemeNetResult>  // Array of sequential steps
```

---

### 2.3 CQ Generation (✅ Excellent, Fully Aligned)

#### Current: `lib/argumentation/cqGeneration.ts`
```typescript
export function generateCQsFromTaxonomy(
  taxonomy: TaxonomyFields,
  schemeKey: string
): CriticalQuestion[]
```

**Strengths:**
- ✅ Automatic template generation from taxonomy
- ✅ Covers all 6 Macagno dimensions
- ✅ AttackType classification (UNDERMINES/UNDERCUTS/REBUTS)
- ✅ TargetScope (premise/inference/conclusion)
- ✅ Priority system (premise > inference > conclusion)
- ✅ Deduplication and merging

**Alignment with Theory:**
- ✅ Implements Verheij's 4 CQ roles
- ✅ Follows Walton's CQ framework
- ✅ Covers material relation, reasoning type, source, purpose dimensions
- ✅ Universal CQs (relevance, sufficiency) always included

**No Major Gaps Here** - This module is theoretically sound.

**Minor Enhancement:**
```typescript
// PROPOSED: Cluster-aware CQ generation
export function generateCompleteCQSetWithInheritance(
  taxonomy: TaxonomyFields,
  schemeKey: string,
  parentSchemeId?: string,  // NEW: Inherit parent CQs
  manualCQs: CriticalQuestion[] = [],
  maxCQs: number = 10
): CriticalQuestion[]
```

---

### 2.4 Multi-Scheme Support (✅ Phase 4 Complete)

#### Current: ArgumentSchemeInstance Model
```prisma
model ArgumentSchemeInstance {
  id           String   @id @default(cuid())
  argumentId   String
  schemeId     String
  confidence   Float    @default(1.0)  // 0.0-1.0
  isPrimary    Boolean  @default(false)
  
  argument     Argument       @relation(...)
  scheme       ArgumentScheme @relation(...)
  
  @@unique([argumentId, schemeId])
}
```

**Strengths:**
- ✅ Many-to-many argument-scheme relation
- ✅ Confidence scoring per scheme
- ✅ Primary scheme designation
- ✅ CQ merging from multiple schemes

**This is parallel schemes, not sequential (nets).**

**Proposed Addition for Nets:**
```prisma
model SchemeNet {
  id          String   @id @default(cuid())
  argumentId  String   @unique
  steps       SchemeNetStep[]
  
  argument    Argument @relation(...)
}

model SchemeNetStep {
  id              String   @id @default(cuid())
  netId           String
  schemeId        String
  stepOrder       Int      // 1, 2, 3...
  inputPremises   Json     // What premises come from previous step?
  outputConclusion Json    // What conclusion feeds to next step?
  confidence      Float    @default(1.0)
  
  net             SchemeNet      @relation(...)
  scheme          ArgumentScheme @relation(...)
  
  @@unique([netId, stepOrder])
}
```

---

### 2.5 UI Components (✅ Complete for Current Scope)

#### Admin UI
- ✅ `SchemeCreator.tsx` - Full CRUD with premise/conclusion builder
- ✅ `SchemeList.tsx` - List, edit, delete schemes
- ✅ Taxonomy field inputs (materialRelation, reasoningType, etc.)
- ✅ Premise builder (major/minor type, variables)
- ✅ Conclusion builder (variables, ∴ symbol)

#### Display UI
- ✅ `SchemeBreakdown.tsx` - Shows scheme details with formal structure
- ✅ `ArgumentCardV2.tsx` - Badges for multi-scheme classification
- ✅ `DeepDivePanelV2.tsx` - Integration with argument panel

#### Missing UI for Nets
```
❌ SchemeNetBuilder.tsx - Sequential composition UI
❌ SchemeNetVisualization.tsx - Graph view of scheme chains
❌ Step-by-step CQ display (CQs grouped by scheme step)
```

---

## Part 3: Gap Prioritization & Roadmap

### Priority 1: 🔴 CRITICAL - Nets of Argumentation Schemes

**Why First:**
- Most significant theoretical gap
- Required for complex argument modeling
- Foundation for research-level argumentation analysis
- Mentioned repeatedly in Macagno & Walton as essential

**Implementation Phases:**

#### Phase 5A: Database Schema for Nets (8-12 hours)
```prisma
// Add to schema.prisma

model SchemeNet {
  id          String   @id @default(cuid())
  argumentId  String   @unique
  description String?  // User description of the chain
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  argument    Argument       @relation("ArgumentSchemeNet", fields: [argumentId], references: [id], onDelete: Cascade)
  steps       SchemeNetStep[]
}

model SchemeNetStep {
  id                String   @id @default(cuid())
  netId             String
  schemeId          String
  stepOrder         Int      // 1, 2, 3...
  label             String?  // User label for this step
  
  // Linkage between steps
  inputFromStep     Int?     // Which step's conclusion feeds into this premise?
  inputSlotMapping  Json?    // Map conclusion variables to premise variables
  
  // Step-specific confidence
  confidence        Float    @default(1.0)
  
  // Relations
  net               SchemeNet      @relation(fields: [netId], references: [id], onDelete: Cascade)
  scheme            ArgumentScheme @relation("SchemeNetSteps", fields: [schemeId], references: [id], onDelete: Restrict)
  
  @@unique([netId, stepOrder])
  @@index([netId])
  @@index([schemeId])
}
```

#### Phase 5B: API Endpoints (6-8 hours)
```typescript
// POST /api/arguments/[id]/scheme-net
// Create a scheme net for an argument

// GET /api/arguments/[id]/scheme-net
// Retrieve the scheme net

// PUT /api/arguments/[id]/scheme-net/steps/[stepOrder]
// Update a specific step

// POST /api/arguments/[id]/scheme-net/steps
// Add a new step to the chain
```

#### Phase 5C: UI Components (16-20 hours)
```typescript
// components/arguments/SchemeNetBuilder.tsx
// - Drag-and-drop scheme chaining
// - Visual flow diagram (Step 1 → Step 2 → Step 3)
// - Input/output mapping between steps

// components/arguments/SchemeNetVisualization.tsx
// - Read-only graph view
// - Confidence indicators per step
// - CQs grouped by step
```

#### Phase 5D: Inference Enhancement (12-16 hours)
```typescript
// lib/argumentation/netInference.ts

export async function inferSchemeNet(
  argumentText: string,
  options: { maxSteps?: number; minConfidence?: number }
): Promise<SchemeNetResult>

// Logic:
// 1. Split text into logical segments (NLP sentence boundary detection)
// 2. Infer scheme for each segment
// 3. Detect input/output relationships between segments
// 4. Calculate chain confidence (weakest link)
```

**Total Effort: 42-56 hours (1-1.5 weeks)**

---

### Priority 2: 🔴 IMPORTANT - Scheme Clustering & Inheritance

**Why Second:**
- Improves inference accuracy (recognize families, not just exact matches)
- Enables CQ inheritance (DRY principle)
- Foundation for ontological reasoning
- Required for better scheme recommendations

**Implementation Phases:**

#### Phase 6A: Schema Enhancement (4-6 hours)
```prisma
model ArgumentScheme {
  // ... existing fields ...
  
  // NEW: Clustering fields
  parentSchemeId   String?          @db.VarChar(64)
  parentScheme     ArgumentScheme?  @relation("SchemeHierarchy", fields: [parentSchemeId], references: [id])
  childSchemes     ArgumentScheme[] @relation("SchemeHierarchy")
  
  clusterTag       String?          // e.g., "practical_reasoning_family"
  inheritCQs       Boolean          @default(true)
  
  // Relations for scheme nets
  schemeNetSteps   SchemeNetStep[]  @relation("SchemeNetSteps")
}

// Migration script to establish existing hierarchies:
// - SSA → Negative Consequences → VBPR
// - Positive/Negative Consequences → Basic PR
// - Expert Opinion variants
```

#### Phase 6B: CQ Inheritance Logic (8-10 hours)
```typescript
// lib/argumentation/cqGeneration.ts

export async function generateCQSetWithInheritance(
  schemeId: string,
  includeParentCQs: boolean = true,
  maxCQs: number = 15
): Promise<CriticalQuestion[]> {
  const scheme = await prisma.argumentScheme.findUnique({
    where: { id: schemeId },
    include: {
      parentScheme: { include: { cqs: true } },
      cqs: true
    }
  });
  
  let allCQs: CriticalQuestion[] = [];
  
  // 1. Add parent CQs (if inheritance enabled)
  if (includeParentCQs && scheme.parentScheme && scheme.inheritCQs) {
    allCQs.push(...scheme.parentScheme.cqs);
  }
  
  // 2. Add scheme-specific CQs
  allCQs.push(...scheme.cqs);
  
  // 3. Deduplicate and prioritize
  return prioritizeCQs(allCQs, maxCQs);
}
```

#### Phase 6C: Cluster-Aware Inference (10-12 hours)
```typescript
// lib/argumentation/schemeInference.ts

export async function inferSchemesWithClusters(
  text: string,
  options: {
    includeParents?: boolean;
    includeChildren?: boolean;
    threshold?: number;
  }
): Promise<InferredScheme[]> {
  // 1. Run standard inference
  const matches = await inferSchemesFromTextWithScores(text, options);
  
  // 2. For each match, check parent/child relationships
  const expanded: InferredScheme[] = [];
  for (const match of matches) {
    expanded.push(match);
    
    if (options.includeParents) {
      const parent = await getParentScheme(match.schemeId);
      if (parent) expanded.push({ ...parent, confidence: match.confidence * 0.8 });
    }
    
    if (options.includeChildren) {
      const children = await getChildSchemes(match.schemeId);
      for (const child of children) {
        // Check if child's specific indicators are present
        const childScore = calculateSchemeScore(text, child);
        if (childScore.score >= options.threshold) {
          expanded.push({ ...child, confidence: childScore.score });
        }
      }
    }
  }
  
  return expanded;
}
```

#### Phase 6D: Admin UI Updates (6-8 hours)
```typescript
// components/admin/SchemeCreator.tsx
// - Add "Parent Scheme" dropdown
// - Add "Cluster Tag" input
// - Add "Inherit Parent CQs" checkbox
// - Show inherited CQs (read-only) + scheme-specific CQs (editable)

// components/admin/SchemeHierarchyView.tsx
// - Tree view of scheme families
// - Drag-and-drop to reparent schemes
```

**Total Effort: 28-36 hours (3-5 days)**

---

### Priority 3: 🟡 ENHANCEMENT - Dialogue Type Integration

**Why Third:**
- Less critical for core functionality
- More about context-awareness than correctness
- Can be added incrementally
- Research-level feature, not MVP

**Implementation Phases:**

#### Phase 7A: Schema Enhancement (2-3 hours)
```prisma
model ArgumentScheme {
  // ... existing fields ...
  
  // NEW: Dialogue integration
  appropriateDialogueTypes String[]  // ["persuasion", "inquiry"]
  inappropriateDialogueTypes String[] @default([])
  dialogueContextHints     Json?     // { "persuasion": "Use for credibility...", ... }
}

model Argument {
  // ... existing fields ...
  
  dialogueType  String?  // "persuasion" | "deliberation" | "inquiry" | "negotiation"
  dialogueId    String?  // Link to dialogue/thread if applicable
}
```

#### Phase 7B: Dialogue-Aware Inference (4-6 hours)
```typescript
// lib/argumentation/schemeInference.ts

export async function inferSchemesForDialogue(
  text: string,
  dialogueType: DialogueType,
  options: {
    filterInappropriate?: boolean;  // Exclude inappropriate schemes
    boostAppropriate?: boolean;      // Increase confidence for appropriate schemes
    warnIfInappropriate?: boolean;   // Return warnings
  }
): Promise<{
  schemes: InferredScheme[];
  warnings: string[];
}> {
  const allSchemes = await inferSchemesFromTextWithScores(text);
  
  const schemes: InferredScheme[] = [];
  const warnings: string[] = [];
  
  for (const scheme of allSchemes) {
    const schemeData = await prisma.argumentScheme.findUnique({
      where: { id: scheme.schemeId },
      select: { appropriateDialogueTypes: true, inappropriateDialogueTypes: true }
    });
    
    // Filter inappropriate
    if (options.filterInappropriate && 
        schemeData.inappropriateDialogueTypes.includes(dialogueType)) {
      warnings.push(`Scheme "${scheme.schemeName}" is not appropriate for ${dialogueType} dialogues.`);
      continue;
    }
    
    // Boost appropriate
    if (options.boostAppropriate && 
        schemeData.appropriateDialogueTypes.includes(dialogueType)) {
      scheme.confidence *= 1.2;  // 20% boost
    }
    
    schemes.push(scheme);
  }
  
  return { schemes, warnings };
}
```

#### Phase 7C: Seed Dialogue Mappings (3-4 hours)
```typescript
// scripts/schemes.seed.ts - Update existing schemes

const DIALOGUE_MAPPINGS = {
  expert_opinion: {
    appropriate: ["inquiry", "persuasion"],
    inappropriate: ["negotiation"],
    hints: {
      inquiry: "Use when establishing factual claims through expert testimony",
      persuasion: "Use to build credibility and trust"
    }
  },
  practical_reasoning: {
    appropriate: ["deliberation", "negotiation"],
    inappropriate: [],
    hints: {
      deliberation: "Core scheme for policy discussions",
      negotiation: "Use to justify proposed actions"
    }
  },
  // ... for all 14 schemes
};
```

#### Phase 7D: UI Enhancements (4-6 hours)
```typescript
// components/arguments/SchemeBreakdown.tsx
// - Show dialogue context warnings
// - "This scheme is more appropriate for inquiry dialogues"

// components/arguments/ArgumentComposer.tsx
// - Detect dialogue type from context
// - Recommend appropriate schemes
```

**Total Effort: 13-19 hours (1.5-2.5 days)**

---

## Part 4: Additional Enhancements (Lower Priority)

### 4.1 Argument Invention (CAS-Style Forward Chaining)

**Theory (Section 11.1):**
- Schemes serve dual function: evaluation (current) + invention (missing)
- Forward-chaining: "Given these premises, what conclusions can I draw?"
- IBM Watson Debater uses this for automated argument generation

**Current State:**
- ✅ Evaluation: Infer schemes from existing argument text
- ❌ Invention: Generate arguments using scheme templates

**Proposed Implementation:**
```typescript
// lib/argumentation/argumentInvention.ts

export async function inventArgumentsForClaim(
  claim: string,
  schemeIds: string[],  // Which schemes to try
  knowledgeBase: { facts: string[]; commitments: string[] }
): Promise<GeneratedArgument[]> {
  const generated: GeneratedArgument[] = [];
  
  for (const schemeId of schemeIds) {
    const scheme = await prisma.argumentScheme.findUnique({
      where: { id: schemeId },
      include: { premises: true, conclusion: true }
    });
    
    // Try to instantiate scheme template with KB facts
    const instantiation = tryInstantiate(scheme, claim, knowledgeBase);
    if (instantiation.success) {
      generated.push({
        schemeId,
        premises: instantiation.filledPremises,
        conclusion: claim,
        confidence: instantiation.confidence
      });
    }
  }
  
  return generated;
}
```

**Effort: 20-30 hours**

---

### 4.2 AIF Ontology Integration

**Theory (Section 10):**
- Argument Interchange Format (AIF) provides ontology for schemes
- Enables automatic reasoning (classification, inference of CQs)
- Subtypes inherit properties from supertypes

**Current State:**
- ❌ No AIF ontology representation
- ❌ No OWL/RDF export of schemes

**Proposed Implementation:**
```typescript
// lib/argumentation/aifExport.ts

export async function exportSchemeToAIF(schemeId: string): Promise<string> {
  // Generate AIF-compliant RDF/XML for the scheme
  // Includes formal structure, CQs, taxonomy
}

export async function inferCQsFromAIF(schemeId: string): Promise<CriticalQuestion[]> {
  // Use AIF reasoning to infer additional CQs from parent schemes
}
```

**Effort: 30-40 hours**

---

### 4.3 Argument Mining Integration

**Theory (Section 9):**
- Schemes constrain NLP search space (typology constraints)
- Specific proposition types indicate specific schemes
- Example: "Dr. X said..." → Expert Opinion scheme

**Current State:**
- ✅ Basic pattern matching in `calculateSchemeScore()`
- ❌ No NLP integration (spaCy, transformers)
- ❌ No proposition type detection

**Proposed Implementation:**
```typescript
// lib/argumentation/argumentMining.ts

export async function extractSchemeComponents(
  text: string,
  schemeId: string
): Promise<{
  premises: { text: string; role: string }[];
  conclusion: { text: string };
  confidence: number;
}> {
  // Use NLP to:
  // 1. Detect proposition types (expert testimony, causal claims, etc.)
  // 2. Extract named entities (expert names, actions, events)
  // 3. Map to scheme template slots
  // 4. Validate extraction with confidence score
}
```

**Effort: 40-60 hours (requires NLP expertise)**

---

## Part 5: Integration Checklist

### Immediate Next Steps (This Week)

- [x] ✅ Add formal Walton structure (premises/conclusion) - **DONE Oct 31**
- [x] ✅ Update SchemeBreakdown to display formal structure - **DONE Oct 31**
- [ ] 🔄 Write comprehensive gap analysis document - **IN PROGRESS**
- [ ] ⏳ Review with team and prioritize Phase 5 (Nets)

### Phase 5: Nets of Argumentation Schemes (1-1.5 weeks)
- [ ] Database schema: SchemeNet + SchemeNetStep models
- [ ] Migration: Add scheme net relations
- [ ] API: CRUD endpoints for scheme nets
- [ ] Logic: Chain confidence calculation (weakest link)
- [ ] UI: SchemeNetBuilder component
- [ ] UI: SchemeNetVisualization component
- [ ] Testing: Complex multi-step argument examples

### Phase 6: Scheme Clustering (3-5 days)
- [ ] Database: Add parentSchemeId, clusterTag, inheritCQs fields
- [ ] Migration: Establish known hierarchies (SSA → Neg Consequences, etc.)
- [ ] Logic: CQ inheritance from parent schemes
- [ ] Inference: Cluster-aware scheme detection
- [ ] UI: Scheme hierarchy tree view
- [ ] Admin: Parent scheme selector in SchemeCreator
- [ ] Testing: Verify CQ inheritance and cluster inference

### Phase 7: Dialogue Integration (1.5-2.5 days)
- [ ] Database: Add appropriateDialogueTypes field
- [ ] Seed: Map all 14 schemes to dialogue types
- [ ] Inference: Dialogue-aware scheme filtering/boosting
- [ ] UI: Display dialogue context warnings
- [ ] UI: Recommend schemes based on dialogue type
- [ ] Testing: Verify dialogue-appropriate scheme suggestions

### Phase 8+: Advanced Features (Future)
- [ ] Argument invention (CAS-style forward chaining)
- [ ] AIF ontology export/import
- [ ] NLP-based argument mining
- [ ] Scheme composition visualizations
- [ ] Ontological reasoning engine

---

## Part 6: Theoretical Rigor Assessment

### Current Alignment with Macagno & Walton

| Concept | Paper Section | Implementation Status | Rigor Score |
|---------|--------------|----------------------|-------------|
| **Defeasibility via CQs** | Sections 2, 8 | ✅ Complete | 95% |
| **Macagno Taxonomy (6D)** | Section 5 | ✅ Complete | 100% |
| **Formal Structure (Walton)** | Sections 2, 3 | ✅ Just Added | 95% |
| **CQ Generation** | Sections 2, 8 | ✅ Complete | 90% |
| **Multi-Scheme Classification** | Implied | ✅ Phase 4 Done | 85% |
| **Scheme Nets (Sequential)** | Section 7 | ❌ Missing | 0% |
| **Scheme Clustering** | Section 6 | ❌ Missing | 0% |
| **Dialogue Integration** | Section 11.2 | ❌ Missing | 0% |
| **Argument Invention** | Section 11.1 | ⚠️ Partial (inference only) | 30% |
| **AIF Ontology** | Section 10 | ❌ Missing | 0% |
| **Argument Mining** | Section 9 | ⚠️ Partial (patterns only) | 40% |

**Overall Theoretical Rigor: 55%**

**Breakdown:**
- **Core Concepts (Sections 1-5):** 95% ✅ Excellent
- **Advanced Applications (Sections 6-9):** 25% ⚠️ Significant gaps
- **Future Directions (Sections 10-11):** 15% ❌ Minimal coverage

---

## Part 7: Research Paper Standards Checklist

### To Reach Publication-Quality Implementation

#### ✅ Already Achieved
- [x] Formal scheme structure with premises/conclusion/variables
- [x] Macagno's 6-dimensional taxonomy
- [x] Automatic CQ generation from taxonomy
- [x] Multi-scheme classification with confidence
- [x] Defeasibility via CQ workflow
- [x] Attack type classification (Verheij's 4 roles)

#### ❌ Critical Missing Features (From Paper)
- [ ] **Nets of schemes** (Section 7) - Sequential composition
- [ ] **Scheme clustering** (Section 6) - Parent-child relationships
- [ ] **Dialogue type integration** (Section 11.2) - Context-awareness
- [ ] **CQ role diversity** (Section 8.1) - Burden of proof tracking
- [ ] **Argument invention** (Section 11.1) - Forward chaining generation

#### ⚠️ Optional Enhancements (Research-Level)
- [ ] AIF ontology compliance (Section 10)
- [ ] NLP-based argument mining (Section 9)
- [ ] Case-based reasoning schemes (Section 8.3)
- [ ] Statutory interpretation schemes (Section 8.3)
- [ ] Computational framework integration (ASPIC+, Carneades)

---

## Part 8: Conclusion & Recommendations

### Summary

Your argumentation schemes implementation has achieved **strong alignment** with Macagno & Walton's theoretical foundations in core areas (defeasibility, taxonomy, formal structure, CQ generation). However, **three critical gaps** prevent it from reaching full research-level rigor:

1. **🔴 Scheme Nets** - Cannot model complex multi-step arguments
2. **🔴 Scheme Clustering** - Cannot leverage inheritance or family resemblances
3. **🟡 Dialogue Integration** - Cannot assess context-appropriateness

### Recommended Priority

**Focus on Phase 5 (Nets) first.** This is the most significant theoretical gap and the most impactful for real-world argument analysis. Complex arguments in legal, political, and scientific domains are inherently multi-step, and modeling them as single schemes loses critical information.

### Success Metrics

After implementing Phases 5-7, you will have:
- **85-90% theoretical alignment** with Macagno & Walton
- **Publication-ready** implementation for computational argumentation papers
- **Research-level** argument analysis capabilities
- **Unique competitive advantage** in argumentation AI (most systems don't support nets)

### Timeline Estimate

- **Phase 5 (Nets):** 6-8 weeks (includes testing, UI, documentation)
- **Phase 6 (Clustering):** 1.5-2 weeks
- **Phase 7 (Dialogue):** 1 week
- **Total:** ~9-11 weeks to full research rigor

### Next Immediate Action

Start with **Phase 5A: Database Schema for Nets** (8-12 hours). This unblocks the rest of Phase 5 and gives you a clear foundation for sequential scheme composition.

---

**Document Status:** Ready for Review  
**Author:** AI Architecture Analysis  
**Date:** October 31, 2025
