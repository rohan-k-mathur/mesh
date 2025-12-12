# Chain Settings & Phase 4 Integration Audit

**Date:** December 11, 2025  
**Scope:** Chain Types (settings) + Phase 4 (epistemic status, scopes) integration across exports, metadata, prose, and essays

---

## Executive Summary

This audit identifies the current state of chain settings (chain types) and Phase 4 features across the codebase, then outlines what's needed to fully integrate them into exports, metadata, prose narratives, and essays.

### Current Status Overview

| Feature | UI Display | API/Metadata | AIF Export | Prose Generator | Essay Generator | Markdown/Narrative |
|---------|------------|--------------|------------|-----------------|-----------------|---------------------|
| **Chain Type** | ✅ Full | ✅ Included | ✅ In metadata | ✅ Phase A+C | ✅ Phase A+C | ❌ Not used |
| **Epistemic Status** | ✅ Canvas + Thread | ✅ In nodes | ✅ Phase B | ✅ Phase A | ✅ Phase A | ❌ Missing |
| **Scopes** | ✅ Canvas + Thread | ✅ In API | ✅ Phase B | ✅ Phase C | ✅ Phase C | ❌ Missing |
| **Dialectical Role** | ⚠️ Partial | ✅ In nodes | ✅ Phase B | ❌ Missing | ❌ Missing | ❌ Missing |

---

## Part 1: Chain Settings (Chain Types) Audit

### 1.1 What Exists

**Enum Values (Prisma schema):**
```typescript
enum ChainType {
  SERIAL      // Linear A → B → C
  CONVERGENT  // Multiple premises → single conclusion
  DIVERGENT   // Single premise → multiple conclusions
  TREE        // Hierarchical branching
  GRAPH       // General network
}
```

**Current Chain Type Integration:**

| Location | File | Status |
|----------|------|--------|
| UI Settings Panel | `components/chains/ChainMetadataPanel.tsx` | ✅ Full select dropdown |
| List Display | `components/chains/ChainListPanel.tsx` | ✅ Badge with icon/color |
| Thread Header | `components/chains/ChainThreadHeader.tsx` | ✅ Badge display |
| Zustand Store | `lib/stores/chainEditorStore.ts` | ✅ Stores chainType |
| API Response | `app/api/argument-chains/[chainId]/route.ts` | ✅ Returns chainType |
| AIF Export | `lib/utils/chainToAif.ts` | ✅ In metadata block |
| Auto-Detection | `lib/utils/chainAnalysisUtils.ts` | ✅ `detectChainStructureType()` |

**What's Missing:**

1. **Prose Generator** (`lib/chains/proseGenerator.ts`)
   - Does not use `chainType` to adjust prose structure
   - Does not describe the chain's structural nature
   - Serial chains should read linearly; convergent chains should group premises

2. **Essay Generator** (`lib/chains/essayGenerator.ts`)
   - Does not acknowledge chain type in essay structure
   - Could use chain type to shape narrative flow
   - Convergent → "Multiple lines of reasoning converge..."
   - Divergent → "From this foundational claim, several implications follow..."

3. **Narrative Generator** (`lib/chains/narrativeGenerator.ts`)
   - Does not use chain type for formatting decisions
   - Markdown export doesn't include chain type in frontmatter

4. **Export Button** (`components/chains/ChainExportButton.tsx`)
   - Exports don't reflect chain type in filename or content structure

### 1.2 Chain Type Integration Tasks

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Add chain type to prose introduction | High | 2h | `proseGenerator.ts` |
| Shape prose structure based on chain type | Medium | 4h | `proseGenerator.ts` |
| Add chain type description to essay | High | 2h | `essayGenerator.ts` |
| Adjust essay flow for convergent/divergent | Medium | 4h | `essayGenerator.ts` |
| Add chain type to markdown frontmatter | Medium | 1h | `narrativeGenerator.ts` |
| Include chain type in export filename | Low | 30m | `ChainExportButton.tsx` |

---

## Part 2: Phase 4 Features Audit

### 2.1 Epistemic Status

**Enum Values:**
```typescript
type EpistemicStatus = 
  | "ASSERTED"      // Standard assertion
  | "HYPOTHETICAL"  // Tentative/exploratory
  | "COUNTERFACTUAL"// Contrary to fact
  | "CONDITIONAL"   // If-then dependency
  | "QUESTIONED"    // Under scrutiny
  | "DENIED"        // Rejected/negated
  | "SUSPENDED"     // Temporarily set aside
```

**Current Integration:**

| Location | Status |
|----------|--------|
| Database (Prisma) | ✅ `epistemicStatus` field on `ArgumentChainNode` |
| Canvas UI | ✅ Badge display in `ChainArgumentNode.tsx` |
| Thread UI | ✅ Badge display in `ThreadNode.tsx` |
| API Response | ✅ Included in chain detail response |
| Scopes Panel | ✅ Nodes inherit from scope |

**What's Missing for Exports:**

1. **AIF Export** (`lib/utils/chainToAif.ts`)
   - I-nodes should include epistemic status
   - Could map to AIF propositional attitude indicators
   - JSON-LD `@type` could include `aif:Hypothetical` etc.

2. **Prose Generator**
   - Non-ASSERTED status should change language
   - HYPOTHETICAL: "Suppose that...", "If we assume..."
   - COUNTERFACTUAL: "Had X been the case...", "Contrary to fact..."
   - QUESTIONED: "It remains uncertain whether..."
   - DENIED: "This claim has been rejected..."
   - SUSPENDED: "Setting aside for now..."

3. **Essay Generator**
   - Should weave epistemic status into narrative
   - Create distinct sections for hypothetical reasoning
   - Counterfactuals presented as thought experiments
   - Questioned claims presented as open issues

4. **Markdown Export**
   - Should include epistemic status in node metadata
   - Could use formatting: `> [!HYPOTHETICAL] Argument text`

### 2.2 Argument Scopes

**Model:**
```typescript
model ArgumentScope {
  id          String
  chainId     String
  scopeType   ScopeType    // HYPOTHETICAL, COUNTERFACTUAL, CONDITIONAL, OPPONENT, MODAL
  assumption  String       // The governing assumption
  color       String?      // Visual color
  parentId    String?      // For nested scopes
  createdBy   BigInt
  nodes       ArgumentChainNode[]
}
```

**Current Integration:**

| Location | Status |
|----------|--------|
| Database | ✅ Full model with nesting |
| Canvas UI | ✅ Colored boundary boxes |
| Thread UI | ✅ Scope context banner |
| API | ✅ `/api/argument-chains/[chainId]/scopes` |
| Scopes Panel | ✅ Create/edit scopes, assign nodes |

**What's Missing for Exports:**

1. **AIF Export**
   - Scopes should become AIF "contexts" or "locution" containers
   - Assumption text should be an AIF I-node
   - Nested scopes should reflect hierarchy

2. **Prose Generator**
   - Should introduce scope with its assumption
   - "Under the assumption that [assumption], we consider..."
   - "Examining the opponent's position: [assumption]"
   - Group scoped arguments together in prose

3. **Essay Generator**
   - Scopes become distinct essay sections
   - HYPOTHETICAL scope → "Hypothetical Analysis" section
   - OPPONENT scope → "Considering the Opposition" section
   - Nested scopes → subsections

4. **Markdown Export**
   - Scopes as collapsible sections or blockquotes
   - Include scope type and assumption as header
   - Indentation for nested scopes

### 2.3 Dialectical Role

**Field:** `dialecticalRole: string | null` on `ArgumentChainNode`

**Current Status:** 
- Stored in database
- Not consistently displayed
- Not used in exports

**Integration Needed:**
- Define standard dialectical roles (Proponent, Opponent, Moderator, etc.)
- Display in UI consistently
- Include in prose/essay voice distinctions

---

## Part 3: Integration Implementation Plan

### 3.1 AIF Export Updates

**File:** `lib/utils/chainToAif.ts`

```typescript
// Add to I-node creation:
{
  nodeID: `I_${node.id}`,
  text: argumentText,
  type: "I",
  // NEW: Epistemic status
  "mesh:epistemicStatus": node.epistemicStatus || "ASSERTED",
  "mesh:dialecticalRole": node.dialecticalRole || null,
  // NEW: Scope context
  "mesh:scopeId": node.scopeId || null,
}

// Add scopes as context nodes:
const contextNodes = chain.scopes?.map(scope => ({
  nodeID: `CTX_${scope.id}`,
  type: "Context", // or custom mesh:ScopeContext
  "mesh:scopeType": scope.scopeType,
  "mesh:assumption": scope.assumption,
  "mesh:parentScopeId": scope.parentId || null,
})) || [];
```

**Estimated effort:** 3 hours

### 3.2 Prose Generator Updates

**File:** `lib/chains/proseGenerator.ts`

**Changes needed:**

1. **Add options for Phase 4:**
```typescript
export interface ProseOptions {
  // ... existing options
  /** Handle epistemic status in language */
  includeEpistemicLanguage?: boolean;
  /** Group arguments by scope */
  groupByScope?: boolean;
  /** Include chain type description */
  includeChainTypeDescription?: boolean;
}
```

2. **Chain type introduction:**
```typescript
function generateChainTypeIntro(chainType: string): string {
  const descriptions = {
    SERIAL: "This argument proceeds as a chain of sequential reasoning, where each step builds upon the previous.",
    CONVERGENT: "Multiple independent lines of reasoning converge to support a central conclusion.",
    DIVERGENT: "From a foundational claim, several distinct implications and conclusions emerge.",
    TREE: "This argument exhibits a hierarchical structure, branching from general principles to specific applications.",
    GRAPH: "The argumentative structure forms an interconnected network of claims and inferences.",
  };
  return descriptions[chainType] || "";
}
```

3. **Epistemic status language:**
```typescript
function getEpistemicPrefix(status: string): string {
  const prefixes = {
    ASSERTED: "",
    HYPOTHETICAL: "Suppose that ",
    COUNTERFACTUAL: "Had it been the case that ",
    CONDITIONAL: "If we accept that ",
    QUESTIONED: "It remains uncertain whether ",
    DENIED: "While it has been argued that ",
    SUSPENDED: "Setting aside for the moment, ",
  };
  return prefixes[status] || "";
}

function getEpistemicSuffix(status: string): string {
  const suffixes = {
    DENIED: " — though this claim has been rejected.",
    SUSPENDED: " — though this point is currently set aside.",
    QUESTIONED: " — pending further examination.",
  };
  return suffixes[status] || "";
}
```

4. **Scope grouping:**
```typescript
function generateScopeSection(
  scope: ArgumentScope,
  nodesInScope: ArgumentChainNodeWithArgument[]
): ProseSection {
  const scopeIntros = {
    HYPOTHETICAL: `For the sake of argument, let us assume: "${scope.assumption}"`,
    COUNTERFACTUAL: `Consider a counterfactual scenario: "${scope.assumption}"`,
    CONDITIONAL: `Under the condition that ${scope.assumption}, we find:`,
    OPPONENT: `From the opposing perspective, which maintains that "${scope.assumption}":`,
    MODAL: `In the possible world where ${scope.assumption}:`,
  };
  
  return {
    id: `scope_${scope.id}`,
    heading: `${scope.scopeType}: ${scope.assumption}`,
    content: [scopeIntros[scope.scopeType], ...nodeProseTexts].join("\n\n"),
    type: "analysis",
  };
}
```

**Estimated effort:** 6 hours

### 3.3 Essay Generator Updates

**File:** `lib/chains/essayGenerator.ts`

**Changes needed:**

1. **Add options:**
```typescript
export interface EssayOptions {
  // ... existing
  /** Structure essay around scopes */
  structureByScopes?: boolean;
  /** Include chain type in introduction */
  describeChainStructure?: boolean;
}
```

2. **Chain type in introduction:**
```typescript
function generateStructureDescription(chainType: string, nodeCount: number): string {
  switch (chainType) {
    case "SERIAL":
      return `This essay traces a sequence of ${nodeCount} interconnected arguments, each building upon its predecessor in a logical chain.`;
    case "CONVERGENT":
      return `This essay presents multiple independent arguments that converge upon a central thesis, offering complementary perspectives.`;
    case "DIVERGENT":
      return `Beginning from a foundational premise, this essay explores ${nodeCount} distinct implications and conclusions.`;
    case "TREE":
      return `This essay is structured hierarchically, moving from broad principles to specific applications.`;
    case "GRAPH":
      return `The argumentative landscape forms a complex network of interrelated claims, which this essay navigates systematically.`;
    default:
      return "";
  }
}
```

3. **Epistemic sections:**
```typescript
interface NarrativeStructure {
  // ... existing
  hypotheticalSections: {
    scopeId: string;
    assumption: string;
    nodes: ArgumentChainNodeWithArgument[];
  }[];
  counterfactualSections: {...}[];
}

function generateHypotheticalSection(section): string {
  return `
## Hypothetical Analysis

Let us consider a hypothetical scenario: *${section.assumption}*

Under this assumption, the following reasoning emerges:

${section.nodes.map(n => generateNodeProse(n)).join("\n\n")}

This hypothetical analysis illuminates...
  `;
}
```

4. **Scope-based structure:**
```typescript
function structureEssayByScopes(
  chain: ArgumentChainWithRelations
): string[] {
  // Main (unscoped) arguments first
  const mainSection = generateMainArgumentSection(
    chain.nodes.filter(n => !n.scopeId)
  );
  
  // Then each scope as a section
  const scopeSections = chain.scopes?.map(scope => {
    const scopedNodes = chain.nodes.filter(n => n.scopeId === scope.id);
    return generateScopeEssaySection(scope, scopedNodes);
  }) || [];
  
  return [mainSection, ...scopeSections];
}
```

**Estimated effort:** 8 hours

### 3.4 Narrative/Markdown Export Updates

**File:** `lib/chains/narrativeGenerator.ts`

**Changes needed:**

1. **Frontmatter metadata:**
```yaml
---
title: "Chain Name"
chainType: CONVERGENT
nodeCount: 12
scopes:
  - type: HYPOTHETICAL
    assumption: "Market conditions remain stable"
    nodeCount: 4
  - type: OPPONENT
    assumption: "Critics argue that..."
    nodeCount: 3
epistemicBreakdown:
  asserted: 8
  hypothetical: 4
  counterfactual: 2
generatedAt: 2025-12-11T...
---
```

2. **Markdown formatting for epistemic status:**
```markdown
## Argument 3 <badge>HYPOTHETICAL</badge>

> [!NOTE] Hypothetical
> This argument is presented as a hypothesis for exploration.

The claim that renewable energy can fully replace fossil fuels...
```

3. **Scope sections:**
```markdown
## Hypothetical: "If carbon prices rise to $100/ton"

<details>
<summary>Scope Assumption</summary>
This section explores arguments under the assumption that carbon prices rise significantly.
</details>

### Argument 4
...

### Argument 5
...
```

**Estimated effort:** 4 hours

---

## Part 4: Priority Roadmap

### Phase A: Critical Path (Week 1)
**Goal:** Basic chain type and epistemic status in prose/essays

| Task | File | Hours |
|------|------|-------|
| Add `chainType` description to prose intro | `proseGenerator.ts` | 2h |
| Add epistemic status prefixes to prose | `proseGenerator.ts` | 3h |
| Add `chainType` to essay introduction | `essayGenerator.ts` | 2h |
| Add epistemic sections to essay | `essayGenerator.ts` | 4h |
| **Total** | | **11h** |

### Phase B: AIF Compliance (Week 2) ✅ COMPLETED
**Goal:** Full epistemic/scope data in AIF export

| Task | File | Hours | Status |
|------|------|-------|--------|
| Add epistemic status to AIF I-nodes | `chainToAif.ts` | 2h | ✅ Done |
| Add scope context nodes to AIF | `chainToAif.ts` | 2h | ✅ Done |
| Add dialectical role to AIF | `chainToAif.ts` | 1h | ✅ Done |
| Update AIF validation | `chainToAif.ts` | 1h | ✅ Done |
| **Total** | | **6h** | **Complete** |

**Phase B Implementation Summary:**
- I-nodes now include `mesh:epistemicStatus`, `mesh:dialecticalRole`, and `mesh:scopeId`
- New CTX (Context) node type for scopes with `mesh:scopeType`, `mesh:assumption`, `mesh:parentScopeId`, `mesh:color`
- Edges link I-nodes to their containing scope CTX nodes
- Nested scope hierarchy preserved via parent-child edges
- `contexts` array added to AIF document for structured scope access
- `metadata` enhanced with `epistemicBreakdown` (count per status), `scopeCount`, and `scopes` array
- Validation updated to validate all Phase 4 fields and CTX node requirements

### Phase C: Advanced Prose/Essay (Week 3) ✅ COMPLETED
**Goal:** Sophisticated structure based on chain type and scopes

| Task | File | Hours | Status |
|------|------|-------|--------|
| Scope grouping in prose | `proseGenerator.ts` | 4h | ✅ Done |
| Chain type flow adjustment | `proseGenerator.ts` | 3h | ✅ Done |
| Scope-structured essays | `essayGenerator.ts` | 4h | ✅ Done |
| Nested scope handling | `essayGenerator.ts` | 2h | ✅ Done |
| **Total** | | **13h** | **Complete** |

**Phase C Implementation Summary:**

**Prose Generator (`proseGenerator.ts`):**
- New options: `groupByScope`, `adjustFlowForChainType`
- `SCOPE_INTRODUCTIONS` - Templates for each scope type with opening, transition, closing phrases
- `groupNodesByScope()` - Groups nodes into scoped sections with hierarchy support
- `generateScopeSection()` - Generates prose for scope including nested child scopes
- `generateChainTypeFlow()` - Restructures arguments based on chain type:
  - SERIAL: Topological order maintained
  - CONVERGENT: Groups supporting premises, then conclusion
  - DIVERGENT: Root premise first, then branch implications
  - TREE: Organizes by depth levels
  - GRAPH: Uses topological sort
- `toRoman()`, `getScopeHeading()` - Helper functions for section formatting
- Refactored `generateArgumentProse()` into reusable helper function

**Essay Generator (`essayGenerator.ts`):**
- New options: `structureByScopes`, `handleNestedScopes`
- `SCOPE_ESSAY_TEMPLATES` - Rich templates with sectionTitle, opening, transition, closing
- `EssayScopeData` interface with depth tracking for nesting
- `groupNodesForEssay()` - Groups nodes and builds scope hierarchy with depth
- `generateScopeEssaySection()` - Recursive function for scope sections with nested handling
- `generateScopeOverview()` - Opening paragraph introducing scope sections
- `generateScopeConclusion()` - Summary paragraph for scoped analyses
- `countNodesInScope()` - Recursive node counter for nested scopes
- Essay body now separates main arguments from scoped sections
- Enhanced opening and conclusion with scope context

### Phase D: Markdown/Narrative (Week 4)
**Goal:** Rich markdown export with full metadata

| Task | File | Hours |
|------|------|-------|
| Enhanced frontmatter | `narrativeGenerator.ts` | 2h |
| Epistemic formatting | `narrativeGenerator.ts` | 2h |
| Scope sections | `narrativeGenerator.ts` | 3h |
| Export button updates | `ChainExportButton.tsx` | 1h |
| **Total** | | **8h** |

---

## Part 5: Example Output Comparisons

### 5.1 Current Prose Output (Before)
```
Introduction

This document presents an analysis of the argument chain "Climate Policy Analysis" 
containing 8 arguments and 7 connections.

Argument 1: Expert Consensus

Drawing upon expert testimony, the scientific community has reached consensus 
on anthropogenic climate change...
```

### 5.2 Enhanced Prose Output (After)
```
Introduction

This document presents a convergent analysis of the argument chain "Climate Policy Analysis" 
containing 8 arguments and 7 connections. Multiple independent lines of reasoning converge 
to support a central conclusion about climate policy necessity.

Argument 1: Expert Consensus (ASSERTED)

Drawing upon expert testimony, the scientific community has reached consensus 
on anthropogenic climate change...

---

## Hypothetical Analysis: "If carbon pricing reaches $150/ton"

For the sake of argument, let us assume: "If carbon pricing reaches $150/ton"

Under this assumption, the following reasoning emerges:

Argument 4: Economic Transition (HYPOTHETICAL)

Suppose that carbon pricing reaches the assumed threshold. This would trigger 
accelerated investment in renewable infrastructure...

Argument 5: Market Response (HYPOTHETICAL)

Given the hypothetical pricing scenario, market forces would redirect capital flows...
```

### 5.3 Current AIF Export (Before)
```json
{
  "nodes": [
    {
      "nodeID": "I_node1",
      "text": "Expert consensus supports...",
      "type": "I"
    }
  ],
  "metadata": {
    "chainType": "CONVERGENT"
  }
}
```

### 5.4 Enhanced AIF Export (After) - Phase B Implementation
```json
{
  "@context": {
    "AIF": "http://www.arg.dundee.ac.uk/aif#",
    "mesh": "http://mesh-platform.io/ontology/aif#",
    "mesh:epistemicStatus": "mesh:epistemicStatus",
    "mesh:dialecticalRole": "mesh:dialecticalRole",
    "mesh:scopeId": "mesh:scopeId",
    "mesh:scopeType": "mesh:scopeType",
    "mesh:assumption": "mesh:assumption",
    "mesh:parentScopeId": "mesh:parentScopeId"
  },
  "nodes": [
    {
      "nodeID": "CTX_scope_1",
      "text": "[HYPOTHETICAL] If carbon pricing reaches $150/ton",
      "type": "CTX",
      "mesh:scopeType": "HYPOTHETICAL",
      "mesh:assumption": "If carbon pricing reaches $150/ton",
      "mesh:parentScopeId": null,
      "mesh:color": "#fef3c7"
    },
    {
      "nodeID": "I_node1",
      "text": "Expert consensus supports...",
      "type": "I",
      "mesh:epistemicStatus": "ASSERTED",
      "mesh:dialecticalRole": "THESIS",
      "mesh:scopeId": null
    },
    {
      "nodeID": "I_node4",
      "text": "Carbon pricing would trigger...",
      "type": "I",
      "mesh:epistemicStatus": "HYPOTHETICAL",
      "mesh:dialecticalRole": null,
      "mesh:scopeId": "scope_1"
    }
  ],
  "edges": [
    {
      "edgeID": "E_I_node4_scope",
      "fromID": "I_node4",
      "toID": "CTX_scope_1"
    }
  ],
  "contexts": [
    {
      "contextID": "CTX_scope_1",
      "scopeType": "HYPOTHETICAL",
      "assumption": "If carbon pricing reaches $150/ton",
      "color": "#fef3c7",
      "parentContextID": null,
      "nodeCount": 2
    }
  ],
  "metadata": {
    "chainType": "CONVERGENT",
    "epistemicBreakdown": {
      "ASSERTED": 6,
      "HYPOTHETICAL": 2,
      "COUNTERFACTUAL": 0,
      "CONDITIONAL": 0,
      "QUESTIONED": 0,
      "DENIED": 0,
      "SUSPENDED": 0
    },
    "scopeCount": 1,
    "scopes": [
      {
        "id": "scope_1",
        "type": "HYPOTHETICAL",
        "assumption": "If carbon pricing reaches $150/ton",
        "nodeCount": 2,
        "parentId": null
      }
    ]
  }
}
```

---

## Part 6: Testing Strategy

### 6.1 Seed Data for Testing
Use `scripts/seed-test-chain-scopes.ts` which creates:
- 10 arguments with varied epistemic statuses
- 3 scopes (HYPOTHETICAL, COUNTERFACTUAL, CONDITIONAL)
- Nested scope structure
- Mixed chain structure (convergent with hypothetical branches)

### 6.2 Test Cases

| Test | Input | Expected Output |
|------|-------|-----------------|
| Prose with serial chain | Serial chain, 5 nodes | Linear narrative flow |
| Prose with convergent chain | Convergent chain, 8 nodes | Grouped premises section |
| Essay with hypothetical scope | Chain with 1 hypothetical scope | "Hypothetical Analysis" section |
| Essay with nested scopes | Chain with nested scopes | Proper subsection nesting |
| AIF with epistemic status | Node with HYPOTHETICAL | `mesh:epistemicStatus: "HYPOTHETICAL"` |
| AIF with scope | Scoped nodes | Context nodes + scope references |
| Markdown with scopes | Chain with 2 scopes | Collapsible scope sections |

---

## Appendix A: Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `lib/chains/proseGenerator.ts` | ~1500 | Add chain type intro, epistemic prefixes, scope grouping |
| `lib/chains/essayGenerator.ts` | ~1200 | Add chain type description, epistemic sections, scope structure |
| `lib/chains/narrativeGenerator.ts` | ~600 | Add frontmatter, epistemic formatting, scope sections |
| `lib/utils/chainToAif.ts` | ~420 | Add epistemic status, scope contexts, enhanced metadata |
| `components/chains/ChainExportButton.tsx` | ~250 | Update export handlers for new options |

## Appendix B: New Types to Add

```typescript
// lib/types/argumentChain.ts

export interface ExportOptions {
  // Existing
  format: "json" | "aif" | "markdown" | "text" | "prose" | "essay";
  
  // Chain type integration
  includeChainTypeDescription?: boolean;
  
  // Phase 4 integration
  includeEpistemicStatus?: boolean;
  includeScopes?: boolean;
  groupByScopes?: boolean;
  includeDialecticalRoles?: boolean;
}

export interface ScopeExportData {
  id: string;
  scopeType: ScopeType;
  assumption: string;
  color?: string;
  parentId?: string;
  nodeIds: string[];
  depth: number;
}
```

---

**Total Estimated Effort:** 38 hours across 4 phases

**Recommendation:** Start with Phase A (11h) to get immediate value from chain type and basic epistemic integration in prose/essays. This provides visible improvement with moderate effort.
