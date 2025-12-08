# ArgumentChain Research Integration Guide
## Synthesizing WWAW, AIF, ASPIC+, and Mesh Architecture

**Created**: November 16, 2025  
**Context**: Phase 3 planning for ArgumentChain feature  
**Purpose**: Map research papers to existing Mesh systems for theory-driven development

---

## Executive Summary

This document maps the **World Wide Argument Web (WWAW)**, **Argument Interchange Format (AIF)**, and **ASPIC+** frameworks to Mesh's existing ArgumentChain, SchemeNet, and ASPIC systems. Rather than requiring architectural redesign, the research papers **validate and enrich** the current implementation.

### Key Finding

**Mesh already implements the core WWAW infrastructure:**
- ✅ **AIF I-nodes** → `Argument.claimText` + `Argument.premises`
- ✅ **AIF S-nodes** → `ArgumentScheme` model (65+ Walton schemes)
- ✅ **AIF RA-nodes** → `ArgumentSchemeInstance` junction table
- ✅ **Argument chaining** → `ArgumentChain` + `SchemeNet` models
- ✅ **ASPIC+ attacks** → `ArgumentAttack` with `aspicAttackType` (rebut/undermine/undercut)
- ✅ **Semantic web export** → `/api/arguments/[id]/aif` endpoints + JSON-LD serialization

**What's needed:** Connect these systems and add Phase 3+ analysis features informed by research.

---

## Part 1: Architecture Mapping

### 1.1 WWAW Desiderata → Mesh Features

The "Towards Large Scale Argumentation Support on the Semantic Web" paper outlines 8 requirements for WWAW infrastructure. Here's how Mesh fulfills them:

| WWAW Requirement | Mesh Implementation | Status |
|------------------|---------------------|--------|
| **1. Store/Create/Update Arguments** | `Argument` model, `/api/arguments` CRUD | ✅ Complete |
| **2. Web-accessible Repositories** | Next.js API routes with REST + JSON | ✅ Complete |
| **3. Open Standards** | AIF export endpoints (`/api/arguments/[id]/aif`) | ✅ Complete |
| **4. Unified Ontology** | `ArgumentScheme` (65 Walton schemes) + AIF mapping | ✅ Complete |
| **5. Multiple Schemes Support** | `ArgumentSchemeInstance` many-to-many + scheme inheritance | ✅ Complete |
| **6. Presumptions/Exceptions** | `CriticalQuestion` model (700+ CQs) | ✅ Complete |
| **7. Query Interface** | `/api/deliberations/[id]/arguments` with filters | ✅ Complete |
| **8. Interoperability** | AIF-RDF export + JSON-LD context | ✅ Complete |

**Gap identified in Phase 3:** No strength calculation aggregating support/attack edges (WWAW strength = sum of incoming supports − incoming attacks).

---

### 1.2 AIF Ontology → Prisma Schema

#### Core AIF Node Types

```typescript
// AIF Upper Ontology (from research paper)
type AIFNode = 
  | { type: "I-node"; content: string }           // Information node
  | { type: "S-node"; schemeType: string }        // Scheme application
  | { type: "RA-node"; conclusion: string }       // Rule application
  | { type: "CA-node"; conflict: boolean }        // Conflict application
  | { type: "PA-node"; preference: string }       // Preference application

// Mesh Implementation
// I-nodes → Argument model
model Argument {
  id            BigInt  @id @default(autoincrement())
  claimText     String  @db.Text  // AIF I-node content (conclusion)
  text          String  @db.Text  // AIF I-node content (premises)
  // ... relations to other I-nodes via ArgumentChain
}

// S-nodes → ArgumentScheme model
model ArgumentScheme {
  id           String  @id @default(cuid())
  schemeKey    String  @unique  // AIF rdfs:label
  name         String             // AIF aif:schemeName
  summary      String  @db.Text   // AIF rdfs:comment
  // ... scheme structure (premises, conclusion, CQs)
}

// RA-nodes → ArgumentSchemeInstance junction
model ArgumentSchemeInstance {
  id           String @id @default(cuid())
  argumentId   BigInt               // Links I-node (argument)
  schemeId     String               // Links S-node (scheme)
  confidence   Float                // Strength of scheme application
  // This IS the RA-node in AIF terminology
  argument     Argument        @relation(...)
  scheme       ArgumentScheme  @relation(...)
}

// CA-nodes → ArgumentAttack model (conflict applications)
model ArgumentAttack {
  id              String  @id @default(cuid())
  sourceArgId     BigInt? // Attacking argument (I-node)
  targetArgId     BigInt? // Target argument (I-node)
  aspicAttackType String? // "rebut" | "undermine" | "undercut"
  // ... ASPIC+ metadata
}

// PA-nodes → (Not yet implemented - see Phase 3/4 gaps below)
// Preference orderings between arguments for ASPIC+ defeat calculation
```

#### AIF Extended Ontology for Chaining

```typescript
// ArgumentChain = WWAW "chaining arguments" concept
// (conclusion of Arg A becomes premise of Arg B)

model ArgumentChain {
  id             String      @id @default(cuid())
  name           String
  chainType      ChainType   // Maps to Wei & Prakken taxonomy (see 1.3)
  nodes          ArgumentChainNode[]
  edges          ArgumentChainEdge[]
}

model ArgumentChainNode {
  id          String        @id @default(cuid())
  argumentId  BigInt        // Reference to I-node
  role        ChainNodeRole // PREMISE | INFERENCE | CONCLUSION
  // Position data for visualization
  positionX   Float
  positionY   Float
}

model ArgumentChainEdge {
  id           String   @id @default(cuid())
  sourceNodeId String   // Source I-node
  targetNodeId String   // Target I-node
  edgeType     EdgeType // SUPPORTS | REFUTES | ENABLES | etc.
  strength     Float    // 0.0-1.0 (used for WWAW strength calculation)
  // This represents typed inference links in AIF-RDF
}
```

**AIF Mapping Summary:**
- Each `Argument` = AIF I-node with unique URI (`http://mesh-platform.io/aif/arguments/{id}`)
- Each `ArgumentScheme` = AIF S-node (`http://mesh-platform.io/aif/schemes/{schemeKey}`)
- Each `ArgumentSchemeInstance` = AIF RA-node linking I-node → S-node
- `ArgumentChain` edges = AIF inference links with typed relations

---

### 1.3 Wei & Prakken Taxonomy → ChainType Enum

The "Argument Structures Taxonomy" paper formalizes ASPIC+ structure types. Mesh's `ChainType` enum maps directly:

```typescript
// From Prisma schema
enum ChainType {
  SERIAL      // = "Multiple I" (serial chain of inferences)
  CONVERGENT  // = "SCS" (Serial Convergent Structure)
  DIVERGENT   // = "SDS" (Serial Divergent Structure)
  TREE        // = "LCS/LDS" (Linked Convergent/Divergent)
  GRAPH       // = "MS" (Mixed Structure)
}

// Wei & Prakken Classification Algorithm (Phase 3 addition)
function detectChainStructureType(chain: ArgumentChain): string {
  const nodes = chain.nodes;
  const edges = chain.edges;
  
  // Count incoming/outgoing edges per node
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  
  for (const edge of edges) {
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
    outDegree.set(edge.sourceNodeId, (outDegree.get(edge.sourceNodeId) || 0) + 1);
  }
  
  // Classify based on branching patterns
  const hasConvergence = Array.from(inDegree.values()).some(deg => deg > 1);
  const hasDivergence = Array.from(outDegree.values()).some(deg => deg > 1);
  
  if (!hasConvergence && !hasDivergence) return "SCS" // Serial (linear)
  if (hasConvergence && !hasDivergence) return "Convergent" // Multiple premises → single conclusion
  if (!hasConvergence && hasDivergence) return "Divergent" // Single premise → multiple conclusions
  return "Mixed"; // Complex graph structure
}
```

**Phase 3 Task 3.5** (new): Add `detectedStructure` field to `ArgumentChain` that auto-classifies using Wei & Prakken algorithm.

---

### 1.4 ASPIC+ Framework → Mesh ASPIC System

The "Formalising a legal opinion... ASPIC+" paper demonstrates how to use strict/defeasible rules, preference orderings, and attack classification. Mesh partially implements this:

#### Currently Implemented (✅)

```typescript
// ASPIC+ Attack Types (ArgumentAttack model)
enum AspicAttackType {
  REBUT     // Attack on conclusion (targets I-node content)
  UNDERMINE // Attack on ordinary premise (targets I-node source)
  UNDERCUT  // Attack on inference (targets RA-node/scheme application)
}

// Usage in UI (components/arguments/ArgumentCardV2.tsx)
const getAspicStyle = (aspicType: string | undefined) => {
  switch (aspicType.toLowerCase()) {
    case "rebut": return { label: "Rebut", bg: "bg-red-50", ... };
    case "undermine": return { label: "Undermine", bg: "bg-orange-50", ... };
    case "undercut": return { label: "Undercut", bg: "bg-yellow-50", ... };
  }
}

// ASPIC Theory Panel (components/aspic/AspicTheoryPanel.tsx)
// - Displays grounded extension
// - Shows arguments, rules, attacks
// - Computes acceptability via /api/aspic/evaluate
```

#### Missing from ASPIC_IMPLEMENTATION_TODO.md (Phase 3/4 gaps)

```typescript
// 1. Strict Rules (axioms) - Prakken uses GC/BC sets, modus ponens, etc.
model StrictRule {
  id          String   @id @default(cuid())
  name        String   // "Modus Ponens", "GC Aggregation"
  formula     String   // Logical formula
  type        RuleType // AXIOM | THEOREM
  domain      String?  // "legal" | "policy" | "ethics"
}

// 2. Preference Orderings (for defeat calculation)
model ArgumentPreference {
  id            String @id @default(cuid())
  weakerArgId   BigInt // Less preferred argument
  strongerArgId BigInt // More preferred argument
  reason        String @db.Text // Justification for preference
  orderingType  String // "elitist" | "weakest-link" | "user-defined"
}

// 3. Enhanced ArgumentChainEdge semantics
// Add subtype field to map to ASPIC+ rule types
model ArgumentChainEdge {
  // ... existing fields
  edgeSubtype   String? // "strict" | "defeasible" | "presumption"
  ruleReference String? // FK to StrictRule if this is axiom-based inference
}
```

**Phase 4 Tasks** (from TODO):
- Implement `StrictRule` model with library of common axioms
- Add preference relations for defeat calculation
- Extend `ArgumentChainEdge` with ASPIC+ rule semantics

---

## Part 2: Integration Opportunities

### 2.1 SchemeNet ↔ ArgumentChain Unification

**Current state:** Two separate compositional systems exist:
1. **SchemeNet**: Multi-scheme arguments (within single `Argument`)
2. **ArgumentChain**: Multi-argument compositions (across multiple `Argument`s)

**Research insight:** Both are instances of AIF graph structures. SchemeNet = S-node chains, ArgumentChain = I-node chains.

#### Proposed Integration (Phase 3 Task 3.6 - New)

```typescript
// Add cross-references between systems
model ArgumentChain {
  // ... existing fields
  containsSchemeNets Boolean @default(false) // Flag: does this chain include SchemeNet arguments?
}

model ArgumentChainNode {
  // ... existing fields
  hasSchemeNet Boolean @default(false) // Does this node's argument have a SchemeNet?
  
  argument Argument @relation(...) // Already includes schemeNet via relation
}

// API Enhancement: When fetching ArgumentChain, include SchemeNet data
// GET /api/argument-chains/[chainId]?includeSchemeNets=true
{
  "id": "chain_123",
  "nodes": [
    {
      "id": "node_1",
      "argumentId": 42,
      "argument": {
        "claimText": "Policy X is effective",
        "schemeNet": {
          "steps": [
            { "scheme": { "name": "Expert Opinion" }, "stepOrder": 1 },
            { "scheme": { "name": "Practical Reasoning" }, "stepOrder": 2 }
          ]
        }
      }
    }
  ],
  "edges": [
    { "sourceNodeId": "node_1", "targetNodeId": "node_2", "edgeType": "SUPPORTS" }
  ]
}
```

**Visualization Impact:** `ArgumentChainNode` component should show SchemeNet indicator badge if argument has multi-scheme structure.

---

### 2.2 WWAW Strength Calculation (Phase 3 Task 3.3 Enhancement)

Research paper formula: `strength(A) = Σ(incoming SUPPORTS) - Σ(incoming REFUTES)`

```typescript
// lib/utils/chainAnalysisUtils.ts (new file for Phase 3)

interface ChainStrengthAnalysis {
  overallStrength: number;        // Weakest link in chain
  nodeStrengths: Map<string, number>; // Per-node strength scores
  criticalPath: string[];          // Strongest reasoning path
  vulnerableNodes: string[];       // Nodes with strength < 0.5
}

export function calculateChainStrength(
  nodes: ArgumentChainNode[],
  edges: ArgumentChainEdge[]
): ChainStrengthAnalysis {
  const nodeStrengths = new Map<string, number>();
  
  // Calculate per-node strength using WWAW formula
  for (const node of nodes) {
    const incomingEdges = edges.filter(e => e.targetNodeId === node.id);
    
    const supportStrength = incomingEdges
      .filter(e => e.edgeType === "SUPPORTS" || e.edgeType === "ENABLES")
      .reduce((sum, e) => sum + e.strength, 0);
    
    const attackStrength = incomingEdges
      .filter(e => e.edgeType === "REFUTES" || e.edgeType === "UNDERCUTS")
      .reduce((sum, e) => sum + e.strength, 0);
    
    nodeStrengths.set(node.id, supportStrength - attackStrength);
  }
  
  // Overall chain strength = weakest link (serial) or aggregated (convergent)
  const chainType = detectChainType(nodes, edges);
  let overallStrength: number;
  
  if (chainType === "SERIAL") {
    // Weakest link principle
    overallStrength = Math.min(...Array.from(nodeStrengths.values()));
  } else {
    // Weighted average for convergent structures
    overallStrength = 
      Array.from(nodeStrengths.values()).reduce((a, b) => a + b, 0) / nodes.length;
  }
  
  return {
    overallStrength,
    nodeStrengths,
    criticalPath: findStrongestPath(nodes, edges, nodeStrengths),
    vulnerableNodes: nodes.filter(n => nodeStrengths.get(n.id)! < 0.5).map(n => n.id),
  };
}

// Update API endpoint
// PATCH /api/argument-chains/[chainId]/analyze
export async function POST(req: Request, { params }: { params: { chainId: string } }) {
  const chain = await prisma.argumentChain.findUnique({
    where: { id: params.chainId },
    include: { nodes: true, edges: true },
  });
  
  const analysis = calculateChainStrength(chain.nodes, chain.edges);
  
  return Response.json(analysis);
}
```

---

### 2.3 Prakken-Style Preference Orderings (Phase 4)

The legal opinion paper uses preference orderings to determine which attacks succeed as defeats.

```typescript
// Phase 4 Addition: Preference system for ASPIC+ defeat calculation

model ArgumentPreference {
  id            String   @id @default(cuid())
  chainId       String?  // Optional: preferences scoped to specific chain
  weakerArgId   BigInt
  strongerArgId BigInt
  reason        String   @db.Text
  orderingType  String   // "elitist" | "weakest-link" | "user-defined"
  createdAt     DateTime @default(now())
  
  weakerArg     Argument @relation("WeakerArgument", fields: [weakerArgId], ...)
  strongerArg   Argument @relation("StrongerArgument", fields: [strongerArgId], ...)
  chain         ArgumentChain? @relation(fields: [chainId], ...)
  
  @@unique([weakerArgId, strongerArgId, chainId])
  @@index([chainId])
}

// API: POST /api/argument-chains/[chainId]/preferences
{
  "weakerArgId": 42,
  "strongerArgId": 55,
  "reason": "Argument 55 uses primary source evidence",
  "orderingType": "user-defined"
}

// Update ArgumentChainEdge to respect preferences
// An attack only succeeds if attacker is preferred over target
function attackSucceeds(
  attack: ArgumentAttack,
  preferences: ArgumentPreference[]
): boolean {
  const pref = preferences.find(
    p => p.weakerArgId === attack.targetArgId && p.strongerArgId === attack.sourceArgId
  );
  
  return pref !== undefined; // Attack succeeds if attacker is preferred
}
```

**UI Impact:** Add preference editor to `ChainMetadataPanel` (new Phase 4 modal).

---

### 2.4 AIF-RDF Export (Phase 5)

Research paper emphasizes interoperability with other WWAW tools via RDF serialization.

```typescript
// Extend existing /api/arguments/[id]/aif endpoint to include chain context

// GET /api/argument-chains/[chainId]/aif?format=rdf
export async function GET(req: Request, { params }: { params: { chainId: string } }) {
  const chain = await prisma.argumentChain.findUnique({
    where: { id: params.chainId },
    include: {
      nodes: { include: { argument: { include: { argumentSchemes: true } } } },
      edges: true,
    },
  });
  
  const format = new URL(req.url).searchParams.get("format") || "jsonld";
  
  if (format === "rdf") {
    return Response.json(
      exportChainToRDF(chain), // Use existing lib/aif/export.ts infrastructure
      { headers: { "Content-Type": "application/rdf+xml" } }
    );
  }
  
  return Response.json(exportChainToJSONLD(chain));
}

// lib/aif/chainExporter.ts (new file)
function exportChainToJSONLD(chain: ArgumentChainWithRelations) {
  return {
    "@context": "http://www.arg.dundee.ac.uk/aif#",
    "@graph": [
      // Each node becomes an AIF I-node
      ...chain.nodes.map(node => ({
        "@id": `http://mesh-platform.io/aif/arguments/${node.argumentId}`,
        "@type": "aif:I-node",
        "aif:text": node.argument.claimText,
      })),
      // Each edge becomes an AIF inference link
      ...chain.edges.map(edge => ({
        "@id": `http://mesh-platform.io/aif/edges/${edge.id}`,
        "@type": "aif:RA-node",
        "aif:premise": `http://mesh-platform.io/aif/arguments/${edge.sourceNodeId}`,
        "aif:conclusion": `http://mesh-platform.io/aif/arguments/${edge.targetNodeId}`,
        "mesh:edgeType": edge.edgeType,
        "mesh:strength": edge.strength,
      })),
    ],
  };
}
```

**External Tool Compatibility:**
- Export to **AIFdb** (http://aifdb.org) for academic research
- Import into **OVA** (Online Visualization of Argument) for pedagogy
- Exchange with **Carneades** for legal reasoning

---

## Part 3: Phase 3 Implementation Roadmap (Revised)

### Original Phase 3 Tasks (from ROADMAP_PHASE3.md)

1. ✅ **Task 3.1:** Critical path detection
2. ✅ **Task 3.2:** Cycle detection for GRAPH chains
3. ✅ **Task 3.3:** Chain strength calculation
4. ✅ **Task 3.4:** AI suggestions for missing arguments

### Research-Informed Enhancements (NEW)

5. **Task 3.5:** Wei & Prakken structure type detection (1 day)
   - Add `detectChainStructureType()` function
   - Display detected structure in `ChainMetadataPanel`
   - Validate that user-selected `chainType` matches detected structure

6. **Task 3.6:** SchemeNet integration indicators (1 day)
   - Add `hasSchemeNet` boolean to `ArgumentChainNode`
   - Show SchemeNet badge in `ArgumentChainNode` component
   - Extend `/api/argument-chains/[chainId]` to include SchemeNet data

7. **Task 3.7:** WWAW strength calculation (2 days)
   - Implement `calculateChainStrength()` with support/attack aggregation
   - Add `POST /api/argument-chains/[chainId]/analyze` endpoint
   - Display strength heatmap in `ArgumentChainCanvas` minimap

8. **Task 3.8:** AIF export for chains (1 day)
   - Extend `/api/argument-chains/[chainId]/aif` to return JSON-LD
   - Add RDF/XML format support
   - Update `ChainExportButton` dropdown to include "Export to AIF"

**Updated Phase 3 Duration:** 5-6 days (original 2-3 days + 3 research tasks)

---

## Part 4: Phase 4 Enhancements (Research-Driven)

### 4.1 Preference System (from Prakken paper)

**Goal:** Enable defeat calculation where attacks only succeed if attacker > target in preference ordering.

**Tasks:**
- Add `ArgumentPreference` model to schema
- Create `/api/argument-chains/[chainId]/preferences` CRUD endpoints
- Build `PreferenceEditor` component (modal in `ChainMetadataPanel`)
- Update ASPIC evaluation to respect preferences

**Estimated:** 3-4 days

---

### 4.2 Strict Rules Library (from ASPIC_IMPLEMENTATION_TODO.md)

**Goal:** Formalize logical axioms (modus ponens, consequence aggregation) as reusable rules.

**Tasks:**
- Add `StrictRule` model with pre-seeded axioms
- Create `/api/aspic/rules/strict` endpoints
- Build `StrictRuleLibrary` UI component
- Extend `ArgumentChainEdge` to reference strict rules

**Estimated:** 3-4 days

---

### 4.3 ASPIC+ Attack Classification Enhancement

**Goal:** Extend `ArgumentAttack` to distinguish sub-types (undermine premise vs undermine source).

**Tasks:**
- Add `attackSubtype` field to `ArgumentAttack` model
- Update `AttackCreationModal` to show subtype options
- Visualize subtypes in `ArgumentCardV2` attack badges

**Estimated:** 1-2 days

---

## Part 5: Quick Wins (Immediate Implementation)

These are small additions that provide high theoretical value with minimal effort:

### 5.1 Structure Type Auto-Detection (30 minutes)

```typescript
// Add to lib/utils/chainLayoutUtils.ts
export function detectChainStructureType(
  nodes: Node<ChainNodeData>[],
  edges: Edge<ChainEdgeData>[]
): string {
  // Wei & Prakken algorithm (see 1.3 above)
  // ... implementation
}

// Update components/chains/ChainMetadataPanel.tsx
<div className="text-sm text-muted-foreground">
  Detected Structure: {detectChainStructureType(nodes, edges)}
  {detectedType !== chainType && (
    <Badge variant="warning">Mismatch with selected type</Badge>
  )}
</div>
```

### 5.2 AIF Ontology Documentation Badge (15 minutes)

```typescript
// Add to components/chains/ArgumentChainCanvas.tsx
<div className="absolute top-2 right-2 flex gap-2">
  <Badge variant="outline" className="text-xs">
    <InfoIcon className="w-3 h-3 mr-1" />
    AIF-Compliant
  </Badge>
  <ChainExportButton chainId={chainId} />
</div>
```

### 5.3 SchemeNet Indicator in Node (20 minutes)

```typescript
// Update components/chains/ArgumentChainNode.tsx
{data.argument.schemeNet && (
  <div className="absolute -top-2 -right-2">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className="text-[9px] h-4 px-1">
            🔗 {data.argument.schemeNet.steps.length} schemes
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Multi-scheme argument (SchemeNet)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)}
```

---

## Part 6: Documentation Improvements

### 6.1 Create AIF-ASPIC+ Mapping Reference

**File:** `docs/AIF_ASPIC_MESH_MAPPING.md`

Contents:
- Table mapping Prisma models to AIF classes
- EdgeType → ASPIC+ rule type correspondence
- ChainType → Wei & Prakken structure types
- Code examples for each mapping

### 6.2 Update ARGUMENT_CHAIN_PHASE3_COMPLETE.md

Add section on research integration:
- WWAW strength calculation formula
- Wei & Prakken structure detection algorithm
- Prakken preference ordering approach
- AIF export format specification

### 6.3 Create Integration Examples

**File:** `examples/legal-argument-chain.json`

Based on Prakken's mandatory sentencing opinion:
- 29 arguments as `ArgumentChainNode`s
- GC/BC consequences as `ArgumentChainEdge`s with custom `edgeSubtype`
- Preference orderings as `ArgumentPreference` records

---

## Part 7: Testing Strategy

### 7.1 Structure Type Detection Tests

```typescript
// __tests__/lib/utils/chainLayoutUtils.test.ts
describe("detectChainStructureType", () => {
  it("detects serial chain", () => {
    const nodes = [node1, node2, node3];
    const edges = [
      { source: "node1", target: "node2" },
      { source: "node2", target: "node3" },
    ];
    expect(detectChainStructureType(nodes, edges)).toBe("SCS");
  });
  
  it("detects convergent structure", () => {
    const edges = [
      { source: "node1", target: "node3" },
      { source: "node2", target: "node3" }, // Two premises converge
    ];
    expect(detectChainStructureType(nodes, edges)).toBe("Convergent");
  });
});
```

### 7.2 WWAW Strength Calculation Tests

```typescript
// __tests__/lib/utils/chainAnalysisUtils.test.ts
describe("calculateChainStrength", () => {
  it("calculates WWAW strength formula", () => {
    const edges = [
      { source: "n1", target: "n2", edgeType: "SUPPORTS", strength: 0.8 },
      { source: "n3", target: "n2", edgeType: "REFUTES", strength: 0.3 },
    ];
    const analysis = calculateChainStrength(nodes, edges);
    expect(analysis.nodeStrengths.get("n2")).toBe(0.8 - 0.3); // = 0.5
  });
});
```

### 7.3 AIF Export Validation Tests

```typescript
// __tests__/api/argument-chains/[chainId]/aif.test.ts
describe("GET /api/argument-chains/[chainId]/aif", () => {
  it("exports valid JSON-LD", async () => {
    const response = await fetch(`/api/argument-chains/${chainId}/aif`);
    const jsonld = await response.json();
    
    expect(jsonld["@context"]).toBe("http://www.arg.dundee.ac.uk/aif#");
    expect(jsonld["@graph"]).toHaveLength(nodes.length + edges.length);
  });
  
  it("includes AIF I-nodes for arguments", async () => {
    const jsonld = await getChainAIF(chainId);
    const iNodes = jsonld["@graph"].filter(n => n["@type"] === "aif:I-node");
    expect(iNodes).toHaveLength(chain.nodes.length);
  });
});
```

---

## Part 8: Open Research Questions

These are areas where Mesh could contribute novel computational argumentation research:

### 8.1 Compositional Argumentation Semantics

**Question:** How should Dung semantics apply to ArgumentChains with nested SchemeNets?

**Current approaches:**
- Flatten nested structure to single Dung AF (loses compositional semantics)
- Hierarchical evaluation (bottom-up from SchemeNet → ArgumentChain)

**Mesh opportunity:** Implement both approaches and compare results. Publish findings.

### 8.2 Collaborative Chain Construction

**Question:** How do multiple users collaboratively build ArgumentChains in real-time?

**AGORA-NET insights:**
- Normative constraints (require justification for each edge)
- Adversarial feedback (opponent must review before adding node)

**Mesh opportunity:** Phase 4 real-time collaboration features with A/B testing of collaboration modes.

### 8.3 Scheme Pattern Mining

**Question:** Can we automatically discover common SchemeNet patterns from user data?

**Approach:**
- Analyze `SchemeNetPattern.structure` JSON across 1000+ arguments
- Cluster similar patterns using graph embedding
- Surface common patterns in UI suggestions

**Mesh opportunity:** Build pattern mining pipeline, create dataset for academic publication.

---

## Conclusion

### Summary of Findings

1. **Mesh already implements WWAW/AIF infrastructure** — no redesign needed
2. **ArgumentChain validates Wei & Prakken taxonomy** — theory confirms practice
3. **ASPIC+ enhancements are incremental additions** — not architectural changes
4. **Research papers provide implementation details** — Prakken's legal opinion = integration guide

### Immediate Next Steps

1. ✅ Complete Phase 3 Tasks 3.1-3.4 (critical path, cycles, strength, suggestions)
2. 🆕 Add Phase 3 Tasks 3.5-3.8 (structure detection, SchemeNet integration, WWAW strength, AIF export)
3. 🆕 Implement Quick Wins (structure badges, SchemeNet indicators)
4. 📝 Document AIF-ASPIC+ mappings
5. ⏭️ Plan Phase 4 with research-informed features (preferences, strict rules)

### Long-Term Vision

**Mesh as WWAW Reference Implementation:**
- Full AIF-RDF import/export for academic interoperability
- ASPIC+ with preferences, strict rules, rationality postulates
- Collaborative chain construction with adversarial feedback
- Pattern mining for scheme discovery
- Publish research on compositional argumentation semantics

**Estimated Timeline:**
- Phase 3 (with research enhancements): 5-6 days
- Phase 4 (preferences + strict rules): 8-10 days
- Phase 5 (full AIF interoperability): 2 weeks
- **Total: 4-5 weeks to research-grade WWAW implementation**

---

**Last Updated:** November 16, 2025  
**Authors:** Mesh Development Team  
**References:**
- Rahwan et al. (2007) - "Towards Large Scale Argumentation Support on the Semantic Web"
- Wei & Prakken (2019) - "Argument Structures Taxonomy"
- Prakken (2012) - "Formalising a legal opinion in ASPIC+"
- ASPIC_IMPLEMENTATION_TODO.md
- ARGUMENT_CHAIN_IMPLEMENTATION_ROADMAP_PHASE1.md
