# Support System Audit & AIF-Compliant Enhancement Plan

**Date**: January 19, 2025  
**Context**: CEG edge derivation fix + AIF ontology compliance review  
**Goal**: Leverage RA-node structure for support-aware grounded semantics (AIF-compliant)

---

## Executive Summary

The Mesh platform has **robust attack infrastructure** with explicit CA-nodes (Conflict Application) for REBUTS/UNDERCUTS/UNDERMINES. However, support relationships are **correctly implicit in AIF** but **underutilized in implementation**.

### Current State
- ✅ **Attack System (CA-nodes)**: 98/100 (explicit CA-nodes, rich UI, full visualization)
- ⚠️ **Support System (RA-nodes)**: 45/100 (AIF-compliant but underexploited)

### Key Finding: AIF Already Handles Support
**In AIF ontology, support is inherent in RA-nodes (Rule Application)**:
- Every RA-node represents an inference from premises to conclusion
- Premise I-nodes → RA-node → Conclusion I-node = **support relationship**
- **We don't need SA-nodes (Support Application)** - they don't exist in AIF
- **Problem**: We're not exploiting this structure for:
  - Grounded semantics computation (IN labels ignore premise support)
  - CEG visualization (support edges not derived from RA-nodes)
  - UI workflows (no "strengthen argument" flows leveraging RA-node premises)
  - Quality metrics (no support strength from premise count/quality)

---

## Table of Contents

1. [System Architecture Analysis](#1-system-architecture-analysis)
2. [Storage & Data Model Comparison](#2-storage--data-model-comparison)
3. [Grounded Semantics Analysis](#3-grounded-semantics-analysis)
4. [UI & Construction Workflows](#4-ui--construction-workflows)
5. [Visualization & Display](#5-visualization--display)
6. [API Endpoints & Services](#6-api-endpoints--services)
7. [Gap Analysis & Priority Matrix](#7-gap-analysis--priority-matrix)
8. [Enhancement Roadmap](#8-enhancement-roadmap)

---

## 1. System Architecture Analysis

### 1.1 How Support Works in AIF Ontology

**AIF Standard: RA-nodes ARE Support Structures**

In AIF, support is **not a separate node type** - it's the fundamental structure of RA-nodes:

```typescript
// AIF Structure: RA-node represents inference (support)
// Premise I-nodes support the conclusion I-node via RA-node

// Example in AIF:
// I-node: "Expert studies show policy works" (Claim A)
//    ↓ [premise edge]
// RA-node: "Application of argument from expert opinion"
//    ↓ [conclusion edge]  
// I-node: "Policy will succeed" (Claim B)

// This IS a support relationship: Claim A supports Claim B
// No SA-node needed - the RA-node mediates the support
```

**Current Mesh Implementation (AIF-Compliant):**
```typescript
// Argument model maps to RA-node
model Argument {
  id                String  // → RA-node ID
  conclusionClaimId String? // → Conclusion I-node
  premises          ArgumentPremise[] // → Premise I-nodes
  // This structure IS valid AIF
}

// ArgumentPremise = edge from I-node to RA-node
model ArgumentPremise {
  argumentId String // RA-node
  claimId    String // I-node (premise)
  // This is the "premise" edge type in AIF
}
```

**Key Insight**: Support is **already represented correctly** in our data model. The problem is we don't **leverage** it for:
1. Grounded semantics (IN labels)
2. CEG visualization (showing support edges)
3. UI (support construction workflows)
4. Metrics (support strength scoring)

### 1.2 Architecture Comparison: CA-nodes vs RA-nodes

| Feature | Attack System (CA-nodes) | Support System (RA-nodes) | Gap |
|---------|--------------------------|---------------------------|-----|
| **AIF Compliance** | ✅ Explicit CA-nodes | ✅ Implicit in RA-nodes | None (AIF-compliant) |
| **Explicit Storage** | ✅ ConflictApplication table | ✅ Argument table (RA-nodes) | None |
| **Edge Records** | ✅ ArgumentEdge, ClaimEdge | ✅ ArgumentPremise (I→RA edges) | None |
| **Visualization** | ✅ CA-nodes rendered | ❌ RA support edges not derived | **CRITICAL** |
| **Grounded Semantics** | ✅ Attacks factor into IN/OUT | ❌ Support ignored in labeling | **CRITICAL** |
| **UI Construction** | ✅ AttackConstructionWizard | ⚠️ SupportConstructionWizard incomplete | HIGH |
| **Strength Scoring** | ✅ Conflict confidence, defeats | ❌ No premise quality scoring | HIGH |
| **Provenance** | ✅ Created by, timestamp | ✅ Argument has createdAt | Complete |

**Key Difference**:
- **CA-nodes** (attacks) are **explicit nodes** added to the graph
- **RA-nodes** (support) are **arguments themselves** - support is in their structure

This is **AIF-compliant**. The gap is not in storage but in **exploitation**.

### 1.3 Why AIF-Compliance Matters for Grounded Semantics

**For Grounded Semantics (IN labels):**
- Currently: `label = IN` means "no CA-node attacks OR all attackers are OUT"
- **Should be**: `label = IN` considers "RA-node premise strength"
- **AIF View**: An RA-node with strong I-node premises should have stronger IN confidence

**For CEG Visualization:**
- Currently: CEG shows CA-node attack edges (now derived from ConflictApplication)
- **Missing**: CEG doesn't show RA-node support edges
- **Should derive**: `I-node (premise) → RA-node → I-node (conclusion)` as support edge
- **Result**: Claim B "is supported by" Claim A if A is premise of RA-node concluding B

**For Argumentation Quality:**
- Currently: System emphasizes CA-nodes (attacking)
- Missing: System doesn't emphasize RA-node premise quality
- **Should**: Strengthen RA-nodes by adding more premise I-nodes or higher-quality premises

---

## 2. Storage & Data Model Comparison

### 2.1 Current Data Models (AIF-Compliant)

**Attack Storage (Explicit CA-nodes):**
```prisma
// CA-node: Conflict Application between arguments/claims
model ConflictApplication {
  id                      String @id
  deliberationId          String
  conflictingArgumentId   String?  // Attacking RA-node
  conflictedArgumentId    String?  // Attacked RA-node
  conflictingClaimId      String?  // Attacking I-node
  conflictedClaimId       String?  // Attacked I-node
  aspicAttackType         String?  // "undermining" | "rebutting" | "undercutting"
  legacyAttackType        String?  // "REBUTS" | "UNDERCUTS" | "UNDERMINES"
  confidence              Float?
  // Rich metadata, provenance, resolution status...
}
```

**Support Storage (Implicit in RA-nodes - AIF Standard):**
```prisma
// RA-node: Rule Application (Argument)
model Argument {
  id                String   @id
  deliberationId    String
  conclusionClaimId String?  // Conclusion I-node
  premises          ArgumentPremise[]  // Premise I-nodes
  schemeId          String?  // Argumentation scheme
  // RA-node metadata: scheme, confidence, etc.
}

// Edge: I-node → RA-node (premise edge)
model ArgumentPremise {
  id          String @id
  argumentId  String   // RA-node
  claimId     String   // I-node (premise)
  ordinality  Int      // Premise order
  role        String?  // "primary" | "supporting" | "presupposed"
  // This represents the "premise" edge type in AIF
}
```

**Key Point**: This is **correct AIF architecture**. Support doesn't need separate SA-nodes because:
1. RA-nodes inherently represent inference (support)
2. Premises are I-nodes connected to RA-nodes
3. Support is the **directed path**: Premise I-node → RA-node → Conclusion I-node

### 2.2 What We DON'T Need (Non-AIF Compliant)

**❌ SupportApplication Model** - **Not needed, not AIF-compliant**

```prisma
// ❌ DON'T ADD THIS - violates AIF ontology
model SupportApplication {
  supportingArgumentId String?
  supportedArgumentId  String?
  supportType          String?
  // This duplicates information already in RA-node structure
}
```

**Why Not?**
1. **AIF doesn't have SA-nodes** - only I, RA, CA, PA nodes
2. **Support is already modeled** - it's the RA-node premise→conclusion structure
3. **Would create redundancy** - duplicates ArgumentPremise relationships
4. **Breaks interoperability** - other AIF tools wouldn't recognize SA-nodes

### 2.3 What We DO Need (AIF-Compliant Enhancements)

**✅ Better RA-node Metadata**

```prisma
// Enhance existing Argument model (RA-node)
model Argument {
  id                String   @id
  deliberationId    String
  conclusionClaimId String?
  premises          ArgumentPremise[]
  
  // ENHANCE: Add support quality metrics
  premiseStrength   Float?   // Aggregate strength of premises
  inferenceQuality  Float?   // Quality of inference (scheme-based)
  supportConfidence Float?   // Overall support confidence
  
  // ENHANCE: Add premise validation
  missingPremises   Int @default(0)  // Count of unsupported premises
  weakPremises      Int @default(0)  // Count of low-quality premises
}
```

**✅ Premise Quality Scoring**

```prisma
// Enhance ArgumentPremise (I→RA edges)
model ArgumentPremise {
  id          String @id
  argumentId  String
  claimId     String
  role        String?
  
  // ENHANCE: Add premise quality metrics
  strength    Float?   // Premise strength (0.0-1.0)
  source      String?  // Evidence source
  isGrounded  Boolean @default(false)  // Has supporting arguments
}
```

**✅ Support Edge Type Taxonomy** (for visualization/UI)

```typescript
// NOT a new model, just better typing for ArgumentPremise.role
export type PremiseRole =
  | "evidential"    // Empirical evidence
  | "logical"       // Logical entailment
  | "example"       // Case study
  | "authority"     // Expert opinion
  | "statistical"   // Quantitative data
  | "causal"        // Causal mechanism
  | "background";   // Contextual knowledge
```

### 2.3 ClaimEdge Support Type (Underutilized)

**Current State:**
```typescript
// ClaimEdge supports type EXISTS but is rarely used
enum ClaimEdgeType {
  supports  // ✅ Defined
  rebuts    // ✅ Heavily used
}

enum ClaimAttackType {
  SUPPORTS      // ✅ Defined
  REBUTS        // ✅ Heavily used
  UNDERCUTS     // ✅ Heavily used
  UNDERMINES    // ✅ Heavily used
}
```

**Usage Analysis:**
```bash
# Grep results show:
# - "ClaimEdgeType.rebuts" appears ~50+ times
# - "ClaimEdgeType.supports" appears ~5 times (mostly in seed scripts)
# - "ClaimAttackType.REBUTS" heavily used
# - "ClaimAttackType.SUPPORTS" rarely used in production code
```

**Problem:** Even though the schema supports `ClaimEdge` support edges, the system doesn't automatically create them from `ArgumentPremise` linkages.

---

## 3. Grounded Semantics Analysis

### 3.1 Current Grounded Semantics Algorithm

**File:** `lib/eval/af.ts`

```typescript
export type Label = 'IN' | 'OUT' | 'UNDEC';

export function groundedLabels(af: AF): Record<string, Label> {
  const { nodes, attacks } = af;
  const attackersOf = new Map<string, Set<string>>();
  
  // Build attack map
  for (const n of nodes) attackersOf.set(n, new Set());
  for (const [a, b] of attacks) attackersOf.get(b)!.add(a);

  const IN = new Set<string>();
  const OUT = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;
    
    // Accept unattacked OR all attackers are OUT
    for (const x of nodes) {
      if (!IN.has(x) && !OUT.has(x)) {
        const attackers = attackersOf.get(x)!;
        const allOut = [...attackers].every(a => OUT.has(a));
        if (attackers.size === 0 || allOut) {  // ← ONLY CONSIDERS ATTACKS
          IN.add(x);
          changed = true;
        }
      }
    }
    
    // Reject anything attacked by an IN
    for (const x of nodes) {
      if (!OUT.has(x)) {
        const hasIn = [...attackersOf.get(x)!].some(a => IN.has(a));
        if (hasIn) { OUT.add(x); changed = true; }
      }
    }
  }
  
  // Label assignment
  const labels: Record<string, Label> = {};
  for (const x of nodes) {
    labels[x] = IN.has(x) ? 'IN' : OUT.has(x) ? 'OUT' : 'UNDEC';
  }
  return labels;
}
```

### 3.2 What's Missing: Support-Aware Grounded Semantics

**Problem:** Current algorithm is attack-only. An argument gets `IN` label if:
1. It has no attackers, OR
2. All its attackers are OUT

**Missing:** No consideration of support relationships:
- Arguments with strong support should have higher IN confidence
- Arguments with no support might be questionable even if unattacked
- Support strength should factor into defeat resolution

**Proposed Enhancement:**
```typescript
// ENHANCED: Support-aware grounded semantics
export function supportAwareGroundedLabels(
  af: AF,
  supports: [string, string][],  // [supporter, supported]
  supportStrengths?: Map<string, number>
): Record<string, Label> {
  const { nodes, attacks } = af;
  
  // Build attack map (existing)
  const attackersOf = new Map<string, Set<string>>();
  for (const n of nodes) attackersOf.set(n, new Set());
  for (const [a, b] of attacks) attackersOf.get(b)!.add(a);
  
  // Build support map (NEW)
  const supportersOf = new Map<string, Set<string>>();
  for (const n of nodes) supportersOf.set(n, new Set());
  for (const [a, b] of supports) supportersOf.get(b)!.add(a);
  
  const IN = new Set<string>();
  const OUT = new Set<string>();
  const supportScores = new Map<string, number>();
  
  let changed = true;
  while (changed) {
    changed = false;
    
    // Compute support scores for each node
    for (const x of nodes) {
      if (!supportScores.has(x)) {
        const supporters = supportersOf.get(x)!;
        const inSupporters = [...supporters].filter(s => IN.has(s));
        const score = inSupporters.length > 0 
          ? inSupporters.reduce((sum, s) => sum + (supportStrengths?.get(s) || 0.5), 0)
          : 0;
        supportScores.set(x, score);
      }
    }
    
    // Accept nodes with strong support AND weak/no attacks
    for (const x of nodes) {
      if (!IN.has(x) && !OUT.has(x)) {
        const attackers = attackersOf.get(x)!;
        const allOut = [...attackers].every(a => OUT.has(a));
        const supportScore = supportScores.get(x) || 0;
        
        // IN if: (no attacks OR all attacks OUT) AND has some support
        // OR: very strong support (>0.8) even with weak attacks
        if ((attackers.size === 0 || allOut) && supportScore > 0.3) {
          IN.add(x);
          changed = true;
        } else if (supportScore > 0.8 && attackers.size < 2) {
          IN.add(x);
          changed = true;
        }
      }
    }
    
    // Reject anything attacked by strong IN nodes
    for (const x of nodes) {
      if (!OUT.has(x)) {
        const inAttackers = [...attackersOf.get(x)!].filter(a => IN.has(a));
        const supportScore = supportScores.get(x) || 0;
        
        // OUT if: attacked by IN AND insufficient support to defend
        if (inAttackers.length > 0 && supportScore < 0.5) {
          OUT.add(x);
          changed = true;
        }
      }
    }
  }
  
  const labels: Record<string, Label> = {};
  for (const x of nodes) {
    labels[x] = IN.has(x) ? 'IN' : OUT.has(x) ? 'OUT' : 'UNDEC';
  }
  return labels;
}
```

### 3.3 Impact on CEG Visualization

**Current CEG:**
- Nodes colored by attack-only grounded semantics
- Green (IN) = unattacked or attackers defeated
- Red (OUT) = attacked by IN node
- Gray (UNDEC) = circular attack patterns

**Enhanced CEG (with support):**
- Node size could reflect support strength
- Node opacity could show support confidence
- Support edges visible alongside attack edges
- IN nodes with strong support distinguished from IN nodes with no attacks

---

## 4. UI & Construction Workflows

### 4.1 Attack Construction UI (Complete)

**Components:**
- ✅ `AttackConstructionWizard.tsx` - Full guided workflow
- ✅ `AttackTypeSelector.tsx` - REBUTS/UNDERCUTS/UNDERMINES selector
- ✅ `ConflictResolutionPanel.tsx` - Manage conflicts
- ✅ `ArgumentCardV2.tsx` - Shows attack/defend actions
- ✅ Attack modals, buttons, shortcuts throughout UI

**Workflow:**
1. User clicks "Attack" button on argument
2. System opens wizard with attack type selection
3. User constructs attack argument with premises
4. System creates `ConflictApplication` record
5. System updates ASPIC+ extensions
6. UI reflects new attack in visualization

### 4.2 Support Construction UI (Incomplete)

**Existing Components:**
- ⚠️ `SupportConstructionWizard.tsx` - **Exists but incomplete**
- ⚠️ `SupportSuggestions.tsx` - **Exists but no backend**
- ⚠️ `EvidenceSchemeMapper.tsx` - **Stub implementation**
- ⚠️ `BatchArgumentGenerator.tsx` - **Stub implementation**
- ❌ No support buttons in ArgumentCard
- ❌ No support visualization in argument trees

**Current Status of SupportConstructionWizard:**

**File:** `components/argumentation/SupportConstructionWizard.tsx`

```typescript
// ✅ COMPLETE: Component structure, step navigation
// ⚠️ INCOMPLETE: Backend integration
// ❌ MISSING: Actual support creation logic

export function SupportConstructionWizard({
  targetArgumentId,
  deliberationId,
  currentUserId,
  onComplete,
}: SupportConstructionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("analyze");
  // ... 7 steps defined: analyze, suggestions, evidence, mode, single, batch, review
  
  // ❌ PROBLEM: No actual API calls to create support relationships
  // ❌ PROBLEM: Evidence mapping is mock data
  // ❌ PROBLEM: Batch generation is stub
  
  function handleArgumentComplete(argumentId: string) {
    setCompletedArguments([...completedArguments, argumentId]);
    // ❌ MISSING: Create SupportApplication record
    // ❌ MISSING: Link new argument to target argument
    // ❌ MISSING: Update support strength scores
  }
}
```

### 4.3 SupportSuggestions Component Status

**File:** `components/argumentation/SupportSuggestions.tsx`

```typescript
export function SupportSuggestions({
  argumentId,
  onSelectSuggestion,
  onGenerateSupport,
}: SupportSuggestionsProps) {
  async function analyzeArgument() {
    setIsAnalyzing(true);
    try {
      // ❌ MISSING: This API endpoint doesn't exist
      const response = await fetch(`/api/arguments/${argumentId}/analyze-support`, {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Failed to analyze argument:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }
  
  // ✅ UI is complete and well-designed
  // ❌ No backend service to generate suggestions
  // ❌ No analysis of argument vulnerabilities
  // ❌ No evidence gap detection
}
```

### 4.4 Missing API Endpoints

**Attack System APIs (Complete):**
- ✅ `POST /api/arguments/[id]/attacks` - Create attack
- ✅ `GET /api/arguments/[id]/conflicts` - List conflicts
- ✅ `POST /api/aspic/conflicts/detect` - Auto-detect conflicts
- ✅ `POST /api/aspic/conflicts/resolve` - Resolve conflicts

**Support System APIs (Missing):**
- ❌ `POST /api/arguments/[id]/supports` - Create support
- ❌ `GET /api/arguments/[id]/supporters` - List supporters
- ❌ `POST /api/arguments/[id]/analyze-support` - Analyze support gaps
- ❌ `GET /api/arguments/[id]/support-strength` - Compute support strength
- ❌ `POST /api/arguments/batch-support` - Batch generate support

---

## 5. Visualization & Display

### 5.1 CEG Visualization (Attack-Centric)

**Current Implementation:**
- ✅ Attack edges rendered (red/orange)
- ✅ Node colors by grounded semantics (IN/OUT/UNDEC)
- ⚠️ Support edges technically supported in schema but not rendered
- ❌ No support strength visualization
- ❌ No support path highlighting

**File:** `components/graph/CegMiniMap.tsx`

```typescript
// Edges are rendered based on edge.type
edges.map(edge => {
  const color = edge.type === 'supports' ? '#22c55e' : '#ef4444';  // ✅ Color defined
  const strokeWidth = edge.confidence ? edge.confidence * 3 : 2;
  
  // ⚠️ PROBLEM: Support edges rarely exist in data
  // ⚠️ PROBLEM: No derivation of support edges from ArgumentPremise
})
```

### 5.2 Argument Diagram Visualization

**Current State:**
- ✅ Attack edges show REBUTS/UNDERCUTS/UNDERMINES
- ❌ Support edges not visualized
- ❌ Premise-conclusion linkages not shown as support
- ❌ No support strength indicators

**Documentation Comment Found:**
```typescript
// File: lib/arguments/diagram.ts
// NOTE: Support relationships in the new system should be implicit through
// ArgumentPremise links (premise claims that are conclusions of other arguments)
// ArgumentEdge is legacy/empty. If we need explicit support edges in the future,
// consider using ConflictApplication with a "SUPPORTS" type or a new table.
```

**Current Approach:**
```typescript
// Support edges are INFERRED, not stored:
// 1. Get argument's premise claims
const premises = await prisma.argumentPremise.findMany({
  where: { argumentId },
  select: { claimId: true }
});

// 2. Find arguments that have those claims as conclusions
const supportingArgs = await prisma.argument.findMany({
  where: {
    deliberationId,
    claimId: { in: premises.map(p => p.claimId) }
  }
});

// 3. Create edges: supportingArg supports targetArgument
for (const supportingArg of supportingArgs) {
  edges.push({ 
    source: supportingArg.id, 
    target: argumentId, 
    type: "support"  // ⚠️ Generated on-the-fly, not stored
  });
}
```

### 5.3 Visualization Enhancements Needed

**CEG Enhancements:**
1. **Derive support edges** (like we now derive attack edges from ConflictApplication)
   ```typescript
   // PROPOSED: Add to ceg/mini/route.ts after conflict derivation
   
   // Derive support edges from ArgumentPremise linkages
   const premises = await prisma.argumentPremise.findMany({
     where: { argument: { deliberationId } },
     select: { argumentId: true, claimId: true }
   });
   
   // Find supporting arguments (args whose conclusions are premises)
   const argConclusionMap = new Map<string, string>(); // argId -> conclusionClaimId
   const args = await prisma.argument.findMany({
     where: { deliberationId },
     select: { id: true, conclusionClaimId: true }
   });
   args.forEach(a => {
     if (a.conclusionClaimId) argConclusionMap.set(a.id, a.conclusionClaimId);
     }
   });
   
   const derivedSupportEdges: EdgeData[] = [];
   for (const premise of premises) {
     // Find arguments whose conclusion IS this premise claim
     const supporters = [...argConclusionMap.entries()]
       .filter(([argId, conclusionId]) => conclusionId === premise.claimId)
       .map(([argId]) => argId);
     
     for (const supporterId of supporters) {
       const supporterConclusionId = argConclusionMap.get(supporterId);
       const targetConclusionId = argConclusionMap.get(premise.argumentId);
       
       if (supporterConclusionId && targetConclusionId) {
         derivedSupportEdges.push({
           id: `support_${supporterId}_${premise.argumentId}`,
           source: supporterConclusionId,  // Supporter's conclusion
           target: targetConclusionId,      // Target's conclusion
           type: 'supports',
           confidence: 0.7,
           derivedFrom: 'ArgumentPremise'
         });
       }
     }
   }
   
   // Merge with attack edges
   const allEdges = [...derivedAttackEdges, ...derivedSupportEdges];
   ```

2. **Support strength visualization**
   - Node size proportional to support count
   - Support edge thickness based on support strength
   - Highlight support chains when hovering

3. **Support metrics panel**
   - Show support/attack ratio
   - Display support strength score
   - List supporting arguments

**Argument Diagram Enhancements:**
1. Show support edges explicitly (not just inferred)
2. Visual distinction: dashed green lines for support vs solid red for attacks
3. Support badges on nodes showing supporter count
4. Click to expand support chain

---

## 6. API Endpoints & Services

### 6.1 Existing APIs (Attack-Focused)

**Conflict/Attack APIs:**
- ✅ `/api/arguments/[id]/attacks` - Create/list attacks
- ✅ `/api/aspic/conflicts/detect` - Auto-detect conflicts
- ✅ `/api/aspic/conflicts/resolve` - Resolve conflicts
- ✅ `/api/aspic/extensions/[deliberationId]` - Compute ASPIC+ extensions

### 6.2 Missing Support APIs

**Need to Create:**

**1. Support Creation API**
```typescript
// File: app/api/arguments/[id]/supports/route.ts (NEW)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const targetArgumentId = params.id;
  const body = await request.json();
  
  // Validate: user is creating an argument that supports target
  const { 
    supportingArgumentId,  // Could be new or existing
    supportType,           // "evidential" | "logical" | "authority" | etc.
    premiseKey,            // Which premise is being supported
    strength,              // 0.0-1.0
    metadata
  } = body;
  
  // Create SupportApplication record
  const support = await prisma.supportApplication.create({
    data: {
      deliberationId: body.deliberationId,
      supportingArgumentId,
      supportedArgumentId: targetArgumentId,
      supportType,
      premiseKey,
      strength: strength || 0.7,
      confidence: metadata?.confidence || 0.8,
      createdById: body.userId,
    }
  });
  
  // Update support strength cache
  await updateSupportStrengthCache(targetArgumentId);
  
  // Recompute grounded semantics with support
  await recomputeSupportAwareGrounded(body.deliberationId);
  
  return NextResponse.json({ success: true, support });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const targetArgumentId = params.id;
  
  // Return all supporters (explicit + implicit)
  const explicitSupports = await prisma.supportApplication.findMany({
    where: { supportedArgumentId: targetArgumentId },
    include: { supportingArgument: true }
  });
  
  // Find implicit supports via ArgumentPremise
  const implicitSupports = await findImplicitSupporters(targetArgumentId);
  
  return NextResponse.json({
    explicit: explicitSupports,
    implicit: implicitSupports,
    totalSupportStrength: computeTotalSupportStrength(explicitSupports, implicitSupports)
  });
}
```

**2. Support Analysis API**
```typescript
// File: app/api/arguments/[id]/analyze-support/route.ts (NEW)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const argumentId = params.id;
  
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      premises: { include: { claim: true } },
      scheme: true,
      evidence: true
    }
  });
  
  if (!argument) {
    return NextResponse.json({ error: "Argument not found" }, { status: 404 });
  }
  
  // Analyze support gaps
  const analysis = {
    currentStrength: await calculateArgumentStrength(argument),
    potentialStrength: await calculatePotentialStrength(argument),
    vulnerabilities: await identifyVulnerabilities(argument),
    evidenceGaps: await identifyEvidenceGaps(argument),
    logicalGaps: await identifyLogicalGaps(argument),
  };
  
  // Generate support suggestions
  const suggestions = await generateSupportSuggestions(argument, analysis);
  
  return NextResponse.json({ analysis, suggestions });
}
```

**3. Support Strength Computation API**
```typescript
// File: app/api/arguments/[id]/support-strength/route.ts (NEW)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const argumentId = params.id;
  
  const strength = await computeSupportStrength(argumentId);
  
  return NextResponse.json({
    totalStrength: strength.total,
    explicitStrength: strength.explicit,
    implicitStrength: strength.implicit,
    supporterCount: strength.supporterCount,
    supportTypes: strength.byType,
    breakdown: strength.breakdown
  });
}

async function computeSupportStrength(argumentId: string) {
  // Get explicit supports
  const explicitSupports = await prisma.supportApplication.findMany({
    where: { supportedArgumentId: argumentId }
  });
  
  // Get implicit supports (via ArgumentPremise)
  const implicitSupports = await findImplicitSupporters(argumentId);
  
  // Compute strength scores
  const explicitStrength = explicitSupports.reduce(
    (sum, s) => sum + (s.strength || 0.5),
    0
  );
  
  const implicitStrength = implicitSupports.length * 0.4; // Default implicit strength
  
  const total = Math.min(explicitStrength + implicitStrength, 1.0);
  
  return {
    total,
    explicit: explicitStrength,
    implicit: implicitStrength,
    supporterCount: explicitSupports.length + implicitSupports.length,
    byType: groupSupportsByType(explicitSupports),
    breakdown: [...explicitSupports, ...implicitSupports]
  };
}
```

### 6.3 Service Layer Enhancements

**Need to Create:**

**ArgumentSupportService.ts** (NEW)
```typescript
// File: app/server/services/ArgumentSupportService.ts

export class ArgumentSupportService {
  /**
   * Find all arguments that support a target argument
   * Includes both explicit (SupportApplication) and implicit (ArgumentPremise) supports
   */
  async findSupporters(targetArgumentId: string): Promise<SupportChain[]> {
    // 1. Get explicit supports
    const explicit = await prisma.supportApplication.findMany({
      where: { supportedArgumentId: targetArgumentId },
      include: { supportingArgument: true }
    });
    
    // 2. Get implicit supports via premise linkage
    const target = await prisma.argument.findUnique({
      where: { id: targetArgumentId },
      include: { premises: true }
    });
    
    const premiseClaimIds = target?.premises.map(p => p.claimId) || [];
    
    const implicit = await prisma.argument.findMany({
      where: {
        deliberationId: target?.deliberationId,
        conclusionClaimId: { in: premiseClaimIds }
      }
    });
    
    return [
      ...explicit.map(e => ({ type: 'explicit', argument: e.supportingArgument, strength: e.strength })),
      ...implicit.map(i => ({ type: 'implicit', argument: i, strength: 0.4 }))
    ];
  }
  
  /**
   * Compute support strength score for an argument
   */
  async computeSupportStrength(argumentId: string): Promise<number> {
    const supporters = await this.findSupporters(argumentId);
    
    // Weighted sum of support strengths
    const totalStrength = supporters.reduce((sum, s) => {
      const weight = s.type === 'explicit' ? 1.0 : 0.5;
      return sum + (s.strength || 0.5) * weight;
    }, 0);
    
    // Normalize to 0-1 range
    return Math.min(totalStrength / supporters.length, 1.0);
  }
  
  /**
   * Identify support gaps (missing evidence, weak premises, etc.)
   */
  async identifySupport Gaps(argumentId: string): Promise<SupportGap[]> {
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      include: {
        premises: { include: { claim: true } },
        scheme: true,
        evidence: true
      }
    });
    
    const gaps: SupportGap[] = [];
    
    // Check each premise for support
    for (const premise of argument.premises) {
      const premiseSupporters = await prisma.argument.findMany({
        where: {
          deliberationId: argument.deliberationId,
          conclusionClaimId: premise.claimId
        }
      });
      
      if (premiseSupporters.length === 0) {
        gaps.push({
          type: 'unsupported-premise',
          premiseKey: premise.id,
          premiseText: premise.claim.text,
          severity: 'high',
          recommendation: 'Provide evidence or argument for this premise'
        });
      }
    }
    
    // Check for missing evidence
    if (!argument.evidence || argument.evidence.length === 0) {
      gaps.push({
        type: 'no-evidence',
        severity: 'medium',
        recommendation: 'Add empirical evidence to strengthen argument'
      });
    }
    
    return gaps;
  }
  
  /**
   * Generate support suggestions based on argument analysis
   */
  async generateSupportSuggestions(
    argumentId: string,
    analysis: ArgumentAnalysis
  ): Promise<SupportSuggestion[]> {
    // Use AI/heuristics to suggest how to strengthen argument
    // Based on gaps, vulnerabilities, and argumentation schemes
    return [];  // Implementation TBD
  }
}
```

---

## 7. Gap Analysis & Priority Matrix

### 7.1 Feature Comparison Matrix

| Feature | Attack System | Support System | Priority | Effort |
|---------|---------------|----------------|----------|--------|
| **Data Storage** |
| Explicit relationship records | ✅ ConflictApplication | ❌ None | **CRITICAL** | HIGH |
| Edge records | ✅ ArgumentEdge, ClaimEdge | ⚠️ ClaimEdge unused | HIGH | MEDIUM |
| Type taxonomy | ✅ REBUTS/UNDERCUTS/UNDERMINES | ❌ Generic only | MEDIUM | LOW |
| Metadata (strength, confidence) | ✅ Rich metadata | ❌ None | HIGH | MEDIUM |
| **APIs** |
| Create relationship | ✅ POST /attacks | ❌ None | **CRITICAL** | MEDIUM |
| List relationships | ✅ GET /conflicts | ❌ None | HIGH | LOW |
| Analyze/detect | ✅ Auto-detection | ❌ None | MEDIUM | HIGH |
| Strength computation | ✅ Defeat resolution | ❌ None | HIGH | MEDIUM |
| **UI Components** |
| Construction wizard | ✅ Complete | ⚠️ Incomplete (50%) | **CRITICAL** | HIGH |
| Suggestions/recommendations | ✅ Implicit | ⚠️ UI only, no backend | HIGH | HIGH |
| Quick actions (buttons) | ✅ Everywhere | ❌ None | MEDIUM | LOW |
| Visual feedback | ✅ Conflict badges | ❌ None | MEDIUM | LOW |
| **Visualization** |
| Edge rendering | ✅ Attack edges | ⚠️ Support edges not derived | **CRITICAL** | MEDIUM |
| Strength indicators | ✅ Edge thickness | ❌ None | MEDIUM | LOW |
| Interactive highlighting | ✅ Attack paths | ❌ None | LOW | LOW |
| Metrics display | ✅ Attack stats | ❌ None | MEDIUM | LOW |
| **Algorithms** |
| Grounded semantics | ✅ Attack-based IN/OUT | ❌ No support consideration | **CRITICAL** | HIGH |
| Strength scoring | ✅ Defeat resolution | ❌ None | HIGH | MEDIUM |
| Chain analysis | ✅ Attack chains | ❌ None | LOW | MEDIUM |
| Quality metrics | ✅ Attack quality | ❌ None | MEDIUM | MEDIUM |

### 7.2 Priority Ranking

**CRITICAL (P0) - Must Have:**
1. **Explicit SupportApplication storage** - Without this, support is always implicit and weak
2. **Support creation API** - Enable users to create support relationships
3. **Derive support edges in CEG** - Make support visible in visualization
4. **Support-aware grounded semantics** - IN labels should consider support strength
5. **Complete SupportConstructionWizard** - Match AttackConstructionWizard feature parity

**HIGH (P1) - Should Have:**
6. Support strength computation algorithm
7. Support analysis API (identify gaps)
8. Support metrics in UI (supporter count, strength score)
9. Support edge rendering in diagrams
10. Support type taxonomy (evidential, logical, etc.)

**MEDIUM (P2) - Nice to Have:**
11. Batch support generation
12. Support suggestions with AI
13. Support chain visualization
14. Support quality scoring
15. Evidence-to-scheme matching

**LOW (P3) - Future Enhancement:**
16. Support vs attack balance metrics
17. Interactive support path highlighting
18. Support recommendation engine
19. Cross-deliberation support import
20. Support provenance tracking

---

## 8. Enhancement Roadmap

### Phase 1: Foundation (2-3 weeks)

**Goal:** Establish basic explicit support infrastructure

**Tasks:**
1. **Create SupportApplication model** (schema.prisma)
   - Add fields: supportingArgumentId, supportedArgumentId, supportType, strength
   - Add indexes for performance
   - Run migration

2. **Implement support creation API** (`/api/arguments/[id]/supports/route.ts`)
   - POST endpoint to create explicit support
   - GET endpoint to list supporters (explicit + implicit)
   - Update support strength cache

3. **Derive support edges in CEG** (modify `/api/deliberations/[id]/ceg/mini/route.ts`)
   - Query ArgumentPremise to find implicit supports
   - Create derived support edges (like we did for attacks)
   - Merge with attack edges

4. **Basic support visualization** (CegMiniMap.tsx)
   - Render support edges in green
   - Show support count badge on nodes
   - Basic hover to highlight supporters

**Acceptance Criteria:**
- [ ] SupportApplication table exists in database
- [ ] API can create and list support relationships
- [ ] CEG shows support edges alongside attack edges
- [ ] Support edge count increases from 0 to 50+ (in ludics-forest-demo)

---

### Phase 2: UI & Workflow (2-3 weeks)

**Goal:** Complete support construction UI and workflows

**Tasks:**
1. **Complete SupportConstructionWizard**
   - Implement backend integration for support creation
   - Connect to new API endpoints
   - Add support metadata (type, strength, reasoning)

2. **Implement support analysis backend**
   - Create `/api/arguments/[id]/analyze-support/route.ts`
   - ArgumentSupportService for gap analysis
   - Support suggestion generation

3. **Add support actions to ArgumentCard**
   - "Support" button alongside "Attack"
   - Quick support modal
   - Show supporter count and strength

4. **Support metrics panel**
   - Display support strength score
   - List explicit and implicit supporters
   - Show support type breakdown

**Acceptance Criteria:**
- [ ] Users can click "Support" button and complete wizard
- [ ] Support suggestions show realistic gaps and recommendations
- [ ] ArgumentCard displays supporter count
- [ ] Support metrics panel shows strength breakdown

---

### Phase 3: Grounded Semantics (1-2 weeks)

**Goal:** Integrate support into grounded semantics computation

**Tasks:**
1. **Implement support-aware grounded semantics**
   - Modify `lib/eval/af.ts` to accept support edges
   - Compute support strength scores
   - Update IN/OUT label assignment to consider support

2. **Update grounded semantics API**
   - Modify `/api/deliberations/[id]/grounded/route.ts`
   - Include support edges in AF construction
   - Return support-aware labels

3. **Update ClaimLabel computation**
   - Recompute labels with support awareness
   - Add support strength to explainJson
   - Migrate existing labels

4. **Update ASPIC+ integration**
   - Modify ASPIC+ theory construction to include supports
   - Update defeat resolution to consider support strength
   - Reflect in extensions computation

**Acceptance Criteria:**
- [ ] Grounded semantics considers support strength
- [ ] IN nodes with strong support have higher confidence
- [ ] Weakly supported nodes can be UNDEC even if unattacked
- [ ] ClaimLabel.explainJson includes support information

---

### Phase 4: Advanced Features (2-3 weeks)

**Goal:** Support type taxonomy, strength scoring, quality metrics

**Tasks:**
1. **Implement support type taxonomy**
   - Add SupportType enum (EVIDENTIAL, LOGICAL, AUTHORITY, etc.)
   - Update UI to select support type
   - Display type-specific icons and colors

2. **Advanced strength computation**
   - Weighted strength based on support type
   - Quality scoring (evidence quality, argument strength)
   - Support chain strength propagation

3. **Support chain visualization**
   - Show multi-level support paths
   - Highlight support chains on hover
   - Support tree diagram

4. **Batch support generation**
   - Complete BatchArgumentGenerator
   - AI-powered support suggestions
   - Bulk support creation workflow

**Acceptance Criteria:**
- [ ] Support types are distinguished visually
- [ ] Strength scores reflect support type weights
- [ ] Users can see full support chain for an argument
- [ ] Batch generation creates 5+ support arguments

---

### Phase 5: Polish & Optimization (1 week)

**Goal:** Performance, UX refinement, documentation

**Tasks:**
1. **Performance optimization**
   - Add caching for support strength calculations
   - Optimize support edge derivation queries
   - Add database indexes

2. **UX refinements**
   - Animations for support edge appearance
   - Tooltips explaining support types
   - Guided onboarding for support features

3. **Documentation**
   - API documentation for support endpoints
   - User guide for support construction
   - Developer guide for support system architecture

4. **Testing**
   - Unit tests for support APIs
   - Integration tests for grounded semantics
   - E2E tests for support wizard

**Acceptance Criteria:**
- [ ] Support edge derivation <500ms for 1000-node graph
- [ ] User documentation complete
- [ ] Test coverage >80% for support features

---

## 9. Implementation Examples

### 9.1 Creating Explicit Support

**User Flow:**
1. User viewing argument A clicks "Support" button
2. System opens SupportConstructionWizard
3. User creates new argument B that supports A
4. System creates SupportApplication record linking B → A
5. System updates support strength for A
6. UI reflects new support in argument card and CEG

**Code Example:**
```typescript
// In SupportConstructionWizard.tsx
async function handleArgumentComplete(newArgumentId: string) {
  // Create explicit support relationship
  const response = await fetch(`/api/arguments/${targetArgumentId}/supports`, {
    method: 'POST',
    body: JSON.stringify({
      supportingArgumentId: newArgumentId,
      supportType: selectedSupportType || 'logical',
      strength: 0.8,
      premiseKey: selectedPremise?.id,
      deliberationId,
      userId: currentUserId
    })
  });
  
  if (response.ok) {
    const { support } = await response.json();
    console.log('Created support:', support);
    
    // Update UI
    setCompletedArguments([...completedArguments, newArgumentId]);
    
    // Notify parent
    onComplete?.();
  }
}
```

### 9.2 Deriving Support Edges in CEG

**Add to `/api/deliberations/[id]/ceg/mini/route.ts`:**
```typescript
// After deriving attack edges from ConflictApplications...

// 3.6. Derive support edges from ArgumentPremise linkages
const premises = await prisma.argumentPremise.findMany({
  where: { argument: { deliberationId } },
  select: {
    argumentId: true,
    claimId: true
  }
});

// Build map: argumentId -> conclusionClaimId
const argToConclusionMap = new Map<string, string>();
const args = await prisma.argument.findMany({
  where: { deliberationId },
  select: { id: true, conclusionClaimId: true }
});
args.forEach(arg => {
  if (arg.conclusionClaimId) {
    argToConclusionMap.set(arg.id, arg.conclusionClaimId);
  }
});

// Derive support edges
const derivedSupportEdges: Array<{
  id: string;
  fromClaimId: string;
  toClaimId: string;
  type: 'supports';
  attackType: null;
  targetScope: null;
}> = [];

for (const premise of premises) {
  // Find supporting arguments (those whose conclusion IS this premise claim)
  const supportingArgIds = [...argToConclusionMap.entries()]
    .filter(([argId, conclusionId]) => conclusionId === premise.claimId)
    .map(([argId]) => argId);
  
  for (const supportingArgId of supportingArgIds) {
    const fromClaimId = argToConclusionMap.get(supportingArgId);
    const toClaimId = argToConclusionMap.get(premise.argumentId);
    
    if (fromClaimId && toClaimId && fromClaimId !== toClaimId) {
      derivedSupportEdges.push({
        id: `support_${supportingArgId}_${premise.argumentId}`,
        fromClaimId,
        toClaimId,
        type: 'supports',
        attackType: null,
        targetScope: null
      });
    }
  }
}

// Merge all edges (explicit + derived attacks + derived supports)
const allClaimEdges = [...claimEdges, ...derivedAttackEdges, ...derivedSupportEdges];
```

### 9.3 Support-Aware Grounded Semantics

**Modify `lib/eval/af.ts`:**
```typescript
export type AF = {
  nodes: string[];
  attacks: [string, string][];
  supports?: [string, string][];  // NEW: Optional support edges
};

export function groundedLabels(af: AF): Record<string, Label> {
  const { nodes, attacks, supports = [] } = af;
  
  // Build attack map
  const attackersOf = new Map<string, Set<string>>();
  for (const n of nodes) attackersOf.set(n, new Set());
  for (const [a, b] of attacks) attackersOf.get(b)!.add(a);
  
  // Build support map
  const supportersOf = new Map<string, Set<string>>();
  for (const n of nodes) supportersOf.set(n, new Set());
  for (const [a, b] of supports) supportersOf.get(b)!.add(a);

  const IN = new Set<string>();
  const OUT = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;
    
    // Compute support scores
    const supportScore = (node: string): number => {
      const supporters = supportersOf.get(node)!;
      const inSupporters = [...supporters].filter(s => IN.has(s));
      return inSupporters.length > 0 ? inSupporters.length * 0.25 : 0;
    };
    
    // Accept nodes: (unattacked OR all attackers OUT) AND has support
    for (const x of nodes) {
      if (!IN.has(x) && !OUT.has(x)) {
        const attackers = attackersOf.get(x)!;
        const allOut = [...attackers].every(a => OUT.has(a));
        const support = supportScore(x);
        
        if ((attackers.size === 0 || allOut) && support >= 0.2) {
          IN.add(x);
          changed = true;
        } else if (attackers.size === 0 && support === 0) {
          // Unattacked but unsupported → still IN (default behavior)
          IN.add(x);
          changed = true;
        }
      }
    }
    
    // Reject nodes attacked by IN (unless strong support defends)
    for (const x of nodes) {
      if (!OUT.has(x)) {
        const hasIn = [...attackersOf.get(x)!].some(a => IN.has(a));
        const support = supportScore(x);
        
        if (hasIn && support < 0.5) {
          OUT.add(x);
          changed = true;
        }
      }
    }
  }
  
  const labels: Record<string, Label> = {};
  for (const x of nodes) {
    labels[x] = IN.has(x) ? 'IN' : OUT.has(x) ? 'OUT' : 'UNDEC';
  }
  return labels;
}
```

---

## 10. Success Metrics

### 10.1 Quantitative Metrics

**Storage:**
- [ ] SupportApplication table has >100 records (in test deliberation)
- [ ] Support edges derived count matches ArgumentPremise link count

**API Performance:**
- [ ] Support creation API <200ms response time
- [ ] Support strength computation <300ms for 50 supporters
- [ ] CEG with support edges <2s for 1000 nodes

**Visualization:**
- [ ] CEG shows >100 support edges (in test deliberation)
- [ ] Support edges render in <1s
- [ ] Node metrics include support count

**Grounded Semantics:**
- [ ] IN label accuracy improves by 15% with support awareness
- [ ] UNDEC count reduces by 20% (better resolution)
- [ ] Support-aware labels differ from attack-only labels in 30% of cases

### 10.2 Qualitative Metrics

**User Experience:**
- [ ] Users can find "Support" button easily (>90% in UX test)
- [ ] Support wizard completion rate >70%
- [ ] User satisfaction with support features ≥4/5

**System Quality:**
- [ ] Support system feature parity with attack system ≥90%
- [ ] Support visualization clarity ≥4/5 (user rating)
- [ ] Support recommendations accuracy ≥60% (user accepts suggestion)

---

## 11. Risk Analysis

### 11.1 Technical Risks

**Risk 1: Performance Degradation**
- **Issue:** Deriving support edges adds query complexity
- **Mitigation:** Add indexes, caching, optimize queries
- **Severity:** MEDIUM

**Risk 2: Grounded Semantics Breaking Changes**
- **Issue:** Support-aware semantics might change existing labels
- **Mitigation:** Flag for gradual rollout, A/B testing
- **Severity:** HIGH

**Risk 3: UI Complexity**
- **Issue:** Support wizard might be too complex for users
- **Mitigation:** Progressive disclosure, guided onboarding
- **Severity:** LOW

### 11.2 Product Risks

**Risk 1: User Confusion**
- **Issue:** Users might not understand support vs attack
- **Mitigation:** Clear labeling, tooltips, documentation
- **Severity:** MEDIUM

**Risk 2: Feature Adoption**
- **Issue:** Users might continue using only attacks
- **Mitigation:** Incentivize support creation, show benefits
- **Severity:** MEDIUM

**Risk 3: Data Migration**
- **Issue:** Existing arguments lack explicit support
- **Mitigation:** Backfill script to create SupportApplications from ArgumentPremise
- **Severity:** LOW

---

## 12. Conclusion

The Mesh platform has **robust CA-node (attack) infrastructure (98/100)** and **AIF-compliant RA-node (support) storage (100/100)**, but significantly **underutilizes the RA-node structure for support exploitation (45/100)**.

### Key Insight: We Don't Need SA-Nodes

**AIF Ontology teaches us:**
1. **Support is NOT a separate node type** - it's inherent in RA-nodes
2. **RA-nodes represent inference** - premises supporting conclusions
3. **Support edges are paths**: `I-node (premise) → RA-node → I-node (conclusion)`
4. **Adding SA-nodes would violate AIF** and break interoperability

### The Real Problem

We correctly store RA-nodes but don't leverage them for:

1. **Grounded Semantics** - IN labels ignore premise strength from RA-nodes
2. **Visualization** - Support edges (I→RA→I paths) not derived in CEG
3. **UI Workflows** - No "strengthen argument" by adding premises to RA-nodes
4. **Quality Metrics** - No premise quality scoring or support strength computation

### Recommended Next Steps (AIF-Compliant)

**Immediate (This Week):**
1. **Derive support edges in CEG** from RA-node structures (I→RA→I paths)
2. **Count premises** - RA-nodes with more premises = stronger support
3. **Show support in UI** - display premise count, quality badges

**Short-term (Next 2-3 Weeks):**
4. **Support-aware grounded semantics** - IN labels consider premise count/quality
5. **Complete SupportConstructionWizard** - add premises to existing RA-nodes
6. **Premise quality scoring** - evaluate premise strength

**Medium-term (Next Month):**
7. **Argumentation scheme integration** - scheme-specific premise requirements
8. **Evidence grounding** - link premises to evidence sources  
9. **Support chain visualization** - multi-level RA-node chains

### Expected Impact

**After Phase 1 (Support Edge Derivation):**
- Support edges visible in CEG (~200+ edges derived from RA-node premises)
- Users see both attack and support structure
- Graph appears balanced (not attack-centric)
- Support system visibility: 45/100 → 70/100

**After Phase 3 (Support-Aware Grounded Semantics):**
- IN labels reflect premise count and quality
- RA-nodes with 0 premises have lower IN confidence
- Grounded semantics accuracy improves 15-20%
- Support system completeness: 70/100 → 90/100

**After Phase 5 (Full RA-Node Exploitation):**
- UI emphasizes premise addition (construction)
- Quality metrics show premise strength
- Balanced attack/support ratio in deliberations
- Support system maturity: 90/100 → 95/100

### Core Principle

**Don't add SA-nodes. Exploit RA-nodes.**

Every RA-node already contains support structure through its premises. Our task is to:
- **Visualize** it (derive support edges from I→RA→I paths)
- **Compute** on it (grounded semantics with premise strength)
- **Enhance** it (UI for premise addition, quality scoring)
- **Stay AIF-compliant** (no custom node types)

This aligns with AIF ontology, maintains interoperability, and achieves all our support system goals.

---

**Document Version:** 2.0 (AIF-Compliant Revision)  
**Last Updated:** January 19, 2025  
**Next Review:** After Phase 1 implementation (support edge derivation)
