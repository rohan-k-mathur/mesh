# Phase 8: AIF Ontology Integration Roadmap
## Focused Implementation Plan (No LLM/Argument Invention)

**Last Updated**: October 31, 2025  
**Status**: Ready to Start  
**Estimated Duration**: 5-6 weeks  
**Estimated Effort**: 200-250 hours

---

## Overview

This roadmap focuses **exclusively** on AIF (Argument Interchange Format) ontology integration and ontological reasoning, deferring LLM-powered argument invention features to a later phase.

### Goals

1. **W3C AIF Compliance**: Export argumentation schemes in valid AIF/RDF format
2. **Ontological Reasoning**: Leverage scheme hierarchies for enhanced inference
3. **Enhanced Admin Tools**: Provide ontology insights in the UI
4. **Foundation for Future Work**: Create infrastructure that argument invention can build upon

### Non-Goals (Deferred)

- ❌ Argument generation/invention
- ❌ LLM-based variable binding
- ❌ Knowledge base for facts/commitments
- ❌ Template instantiation engine

---

## Phase 8E: AIF Ontology Mapping (3 weeks, 120-150 hours)

### 8E.1: AIF Schema Design & Mapping (Week 1, 30-40 hours)

**Goal**: Design how Mesh's argumentation scheme model maps to W3C AIF ontology

#### AIF Core Concepts

The AIF ontology defines:
- **I-nodes** (Information nodes): Claims, premises, data
- **S-nodes** (Scheme nodes): Inference rules, argumentation schemes
- **RA-nodes** (Rule Application nodes): Links between I-nodes via S-nodes

#### Mapping Strategy

```typescript
// Our model → AIF classes

ArgumentScheme → aif:Scheme (S-node)
  - schemeKey → rdfs:label
  - name → aif:schemeName
  - summary → rdfs:comment
  - description → aif:description
  - criticalQuestions → aif:hasQuestion (collection)
  - parentSchemeId → aif:isSubtypeOf
  - clusterTag → aif:schemeFamily (custom property)

CriticalQuestion → aif:Question
  - question → aif:questionText
  - category → aif:questionCategory
  - (inherited) → aif:inheritedFrom

Argument → aif:Argument
  - claimText → aif:hasClaim (I-node)
  - premises → aif:hasPremise (collection of I-nodes)
  - schemeId → aif:appliesScheme (S-node reference)
```

#### Ontology Extensions

We'll add custom properties for Mesh-specific features:
```turtle
# Custom namespace: mesh:
@prefix mesh: <http://mesh-platform.io/ontology/aif#> .

mesh:clusterTag rdf:type owl:DatatypeProperty ;
  rdfs:domain aif:Scheme ;
  rdfs:range xsd:string ;
  rdfs:comment "Cluster family identifier for scheme grouping" .

mesh:inheritCQs rdf:type owl:DatatypeProperty ;
  rdfs:domain aif:Scheme ;
  rdfs:range xsd:boolean ;
  rdfs:comment "Whether scheme inherits critical questions from parent" .

mesh:inheritedFrom rdf:type owl:ObjectProperty ;
  rdfs:domain aif:Question ;
  rdfs:range aif:Scheme ;
  rdfs:comment "Original scheme that defined this critical question" .
```

#### Deliverables

- [ ] **config/aif-ontology-mapping.yaml** - Schema mapping configuration
- [ ] **lib/aif/types.ts** - TypeScript types for AIF structures
- [ ] **docs/AIF_ONTOLOGY_GUIDE.md** - Documentation of mapping decisions

**Files to Create**:
```
config/aif-ontology-mapping.yaml
lib/aif/types.ts
lib/aif/constants.ts (namespace URIs)
docs/AIF_ONTOLOGY_GUIDE.md
```

---

### 8E.2: RDF/XML Export Implementation (Week 1-2, 40-50 hours)

**Goal**: Export individual argumentation schemes as valid AIF/RDF

#### Core Export Function

```typescript
// lib/aif/aifExporter.ts

import { Scheme, CriticalQuestion } from "@prisma/client";

export interface AIFExportOptions {
  format: "rdfxml" | "turtle" | "jsonld";
  includeHierarchy: boolean;
  includeCQs: boolean;
  baseURI?: string;
}

export async function exportSchemeToAIF(
  schemeId: string,
  options: AIFExportOptions = { format: "rdfxml", includeHierarchy: true, includeCQs: true }
): Promise<string> {
  // 1. Fetch scheme with relations
  const scheme = await prisma.argumentScheme.findUnique({
    where: { id: schemeId },
    include: {
      criticalQuestions: true,
      parentScheme: true,
      childSchemes: true,
    },
  });

  // 2. Build RDF graph
  const graph = buildAIFGraph(scheme, options);

  // 3. Serialize to requested format
  switch (options.format) {
    case "rdfxml":
      return serializeToRDFXML(graph);
    case "turtle":
      return serializeToTurtle(graph);
    case "jsonld":
      return serializeToJSONLD(graph);
  }
}
```

#### Example RDF/XML Output

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:aif="http://www.arg.dundee.ac.uk/aif#"
  xmlns:mesh="http://mesh-platform.io/ontology/aif#">
  
  <!-- Scheme Definition -->
  <aif:Scheme rdf:about="http://mesh-platform.io/schemes/practical_reasoning">
    <rdfs:label>practical_reasoning</rdfs:label>
    <aif:schemeName>Practical Reasoning</aif:schemeName>
    <rdfs:comment>Argument from goals and actions to justify policies</rdfs:comment>
    <mesh:clusterTag>practical_reasoning_family</mesh:clusterTag>
    
    <!-- Critical Questions -->
    <aif:hasQuestion>
      <aif:Question rdf:about="http://mesh-platform.io/schemes/practical_reasoning/cq1">
        <aif:questionText>Are there alternative actions that would better achieve the goal?</aif:questionText>
        <aif:questionCategory>alternatives</aif:questionCategory>
      </aif:Question>
    </aif:hasQuestion>
    
    <!-- More CQs... -->
  </aif:Scheme>
</rdf:RDF>
```

#### RDF Library Choice

**Recommendation**: Use `rdflib` (if we add Node.js RDF parser) or manual string building

```typescript
// Option A: Manual string building (simple, no deps)
function serializeToRDFXML(graph: AIFGraph): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rdf:RDF\n';
  xml += '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n';
  // ... namespaces ...
  xml += '>\n';
  
  for (const node of graph.nodes) {
    xml += `  <${node.type} rdf:about="${node.uri}">\n`;
    for (const [prop, value] of Object.entries(node.properties)) {
      xml += `    <${prop}>${escapeXML(value)}</${prop}>\n`;
    }
    xml += `  </${node.type}>\n`;
  }
  
  xml += '</rdf:RDF>';
  return xml;
}

// Option B: Use n3 library (popular, well-maintained)
// npm install n3
import { Writer } from "n3";

function serializeToTurtle(graph: AIFGraph): string {
  const writer = new Writer({
    prefixes: {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      aif: "http://www.arg.dundee.ac.uk/aif#",
      mesh: "http://mesh-platform.io/ontology/aif#",
    },
  });
  
  for (const triple of graph.triples) {
    writer.addQuad(triple.subject, triple.predicate, triple.object);
  }
  
  return new Promise((resolve) => {
    writer.end((error, result) => resolve(result));
  });
}
```

**Decision**: Start with **Option A (manual)** for RDF/XML, add **Option B (n3)** for Turtle/JSON-LD

#### Deliverables

- [ ] **lib/aif/aifExporter.ts** - Core export logic
- [ ] **lib/aif/rdfSerializer.ts** - RDF/XML serialization
- [ ] **lib/aif/turtleSerializer.ts** - Turtle serialization (using n3)
- [ ] **API route: GET /api/aif/export/:schemeId** - Export endpoint
- [ ] **Tests**: Export 3 schemes, validate structure

**New Dependencies**:
```bash
npm install n3  # RDF library for Turtle/JSON-LD
npm install -D @types/n3
```

---

### 8E.3: Hierarchy Export (Week 2, 20-30 hours)

**Goal**: Export parent-child scheme relationships in RDF

#### Extending RDF with Hierarchy

```turtle
@prefix aif: <http://www.arg.dundee.ac.uk/aif#> .
@prefix mesh: <http://mesh-platform.io/ontology/aif#> .

# Parent scheme
<http://mesh-platform.io/schemes/practical_reasoning>
  a aif:Scheme ;
  rdfs:label "practical_reasoning" ;
  aif:schemeName "Practical Reasoning" ;
  mesh:clusterTag "practical_reasoning_family" .

# Child scheme with parent reference
<http://mesh-platform.io/schemes/sunk_cost_argument>
  a aif:Scheme ;
  rdfs:label "sunk_cost_argument" ;
  aif:schemeName "Sunk Cost Argument" ;
  aif:isSubtypeOf <http://mesh-platform.io/schemes/practical_reasoning> ;
  mesh:clusterTag "practical_reasoning_family" ;
  mesh:inheritCQs true .

# Transitive closure (optional - for reasoning)
<http://mesh-platform.io/schemes/sunk_cost_argument>
  mesh:hasAncestor <http://mesh-platform.io/schemes/practical_reasoning> .
```

#### Cluster Family Export

```typescript
// Export entire cluster family as single RDF file

export async function exportClusterFamily(
  clusterTag: string,
  format: "rdfxml" | "turtle" = "turtle"
): Promise<string> {
  // Fetch all schemes in cluster
  const schemes = await prisma.argumentScheme.findMany({
    where: { clusterTag },
    include: { criticalQuestions: true, parentScheme: true, childSchemes: true },
  });

  // Build unified graph
  const graph = new AIFGraph();
  
  for (const scheme of schemes) {
    graph.addScheme(scheme);
    
    // Add parent relationship
    if (scheme.parentScheme) {
      graph.addTriple(
        scheme.uri,
        "aif:isSubtypeOf",
        scheme.parentScheme.uri
      );
    }
  }

  // Add transitive ancestors (for reasoning)
  for (const scheme of schemes) {
    const ancestors = await getAncestorChain(scheme.id);
    for (const ancestor of ancestors) {
      graph.addTriple(
        scheme.uri,
        "mesh:hasAncestor",
        ancestor.uri
      );
    }
  }

  return serializeGraph(graph, format);
}
```

#### Deliverables

- [ ] Extend `exportSchemeToAIF()` to include parent/child relations
- [ ] **lib/aif/hierarchyExporter.ts** - Cluster family export
- [ ] **API route: GET /api/aif/export/cluster/:tag** - Export cluster
- [ ] **Tests**: Export practical_reasoning_family, verify hierarchy

---

### 8E.4: CQ Inheritance in AIF Format (Week 2, 20-30 hours)

**Goal**: Represent inherited CQs with provenance in RDF

#### CQ Provenance Model

```turtle
# Original CQ (defined on parent scheme)
<http://mesh-platform.io/schemes/practical_reasoning/cq1>
  a aif:Question ;
  aif:questionText "Are there alternative actions?" ;
  aif:definedOn <http://mesh-platform.io/schemes/practical_reasoning> .

# Inherited CQ (child scheme inherits)
<http://mesh-platform.io/schemes/sunk_cost_argument>
  aif:hasQuestion <http://mesh-platform.io/schemes/practical_reasoning/cq1> .

# Metadata about inheritance
<http://mesh-platform.io/schemes/sunk_cost_argument/cq1_inheritance>
  a mesh:QuestionInheritance ;
  mesh:childScheme <http://mesh-platform.io/schemes/sunk_cost_argument> ;
  mesh:parentScheme <http://mesh-platform.io/schemes/practical_reasoning> ;
  mesh:inheritedQuestion <http://mesh-platform.io/schemes/practical_reasoning/cq1> ;
  mesh:inheritanceDepth 1 .
```

#### Implementation

```typescript
// lib/aif/cqExporter.ts

export function exportCQsWithInheritance(
  scheme: SchemeWithCQs,
  includeInherited: boolean = true
): AIFGraph {
  const graph = new AIFGraph();

  // Add own CQs
  for (const cq of scheme.criticalQuestions) {
    graph.addQuestion(cq, scheme.uri);
  }

  if (includeInherited && scheme.inheritCQs) {
    // Get inherited CQs with provenance
    const inherited = await getInheritedCQsWithSource(scheme.id);
    
    for (const { cq, sourceScheme, depth } of inherited) {
      // Add question (if not already added)
      graph.addQuestion(cq, sourceScheme.uri);
      
      // Link to current scheme
      graph.addTriple(scheme.uri, "aif:hasQuestion", cq.uri);
      
      // Add inheritance metadata
      graph.addInheritanceMetadata({
        childScheme: scheme.uri,
        parentScheme: sourceScheme.uri,
        question: cq.uri,
        depth,
      });
    }
  }

  return graph;
}
```

#### Deliverables

- [ ] **lib/aif/cqExporter.ts** - CQ export with inheritance
- [ ] Extend `getInheritedCQs()` to return provenance (source scheme)
- [ ] Add inheritance metadata to RDF output
- [ ] **Tests**: Export SSA, verify 9 inherited CQs with provenance

---

### 8E.5: AIF Validation & Testing (Week 3, 10-20 hours)

**Goal**: Ensure exported RDF is valid AIF

#### Validation Strategy

1. **Structural Validation**: Check RDF syntax (well-formed XML/Turtle)
2. **AIF Compliance**: Verify against AIF ontology (required properties, correct types)
3. **Consistency**: Check for broken references, circular dependencies
4. **Completeness**: Ensure all schemes/CQs exported

#### Validation Tools

```typescript
// lib/aif/aifValidator.ts

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateAIFExport(
  rdf: string,
  format: "rdfxml" | "turtle"
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Parse RDF
  const graph = await parseRDF(rdf, format);
  if (!graph) {
    return { valid: false, errors: ["Invalid RDF syntax"], warnings: [] };
  }

  // 2. Check AIF namespace usage
  const aifNodes = graph.match(null, "rdf:type", "aif:Scheme");
  if (aifNodes.length === 0) {
    errors.push("No aif:Scheme nodes found");
  }

  // 3. Check required properties
  for (const node of aifNodes) {
    if (!graph.match(node, "aif:schemeName", null).length) {
      errors.push(`Scheme ${node} missing aif:schemeName`);
    }
  }

  // 4. Check references
  const parentRefs = graph.match(null, "aif:isSubtypeOf", null);
  for (const { object } of parentRefs) {
    if (!graph.match(object, "rdf:type", "aif:Scheme").length) {
      errors.push(`Invalid parent reference: ${object}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

#### Test Suite

```typescript
// __tests__/aif/aifExporter.test.ts

describe("AIF Export", () => {
  test("exports valid RDF/XML for single scheme", async () => {
    const rdf = await exportSchemeToAIF("practical_reasoning", { format: "rdfxml" });
    const validation = await validateAIFExport(rdf, "rdfxml");
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test("includes critical questions", async () => {
    const rdf = await exportSchemeToAIF("practical_reasoning", { format: "turtle" });
    expect(rdf).toContain("aif:hasQuestion");
    expect(rdf).toContain("aif:questionText");
  });

  test("exports parent-child relationship", async () => {
    const rdf = await exportSchemeToAIF("sunk_cost_argument", { format: "turtle" });
    expect(rdf).toContain("aif:isSubtypeOf");
    expect(rdf).toContain("practical_reasoning");
  });

  test("exports cluster family with all schemes", async () => {
    const rdf = await exportClusterFamily("practical_reasoning_family", "turtle");
    const graph = await parseRDF(rdf, "turtle");
    const schemes = graph.match(null, "rdf:type", "aif:Scheme");
    
    expect(schemes.length).toBeGreaterThanOrEqual(3); // PR, SSA, CCF
  });

  test("includes inherited CQs with provenance", async () => {
    const rdf = await exportSchemeToAIF("sunk_cost_argument", { format: "turtle" });
    expect(rdf).toContain("mesh:inheritedFrom");
  });
});
```

#### External Validation

Test with existing AIF tools if available:
- [AIF Validator](http://arg.tech/aif) (if online tool exists)
- Import into Protégé (OWL editor)
- Verify with SPARQL queries

#### Deliverables

- [ ] **lib/aif/aifValidator.ts** - Validation logic
- [ ] **__tests__/aif/*.test.ts** - Comprehensive test suite (15+ tests)
- [ ] **scripts/validate-all-schemes.ts** - Bulk validation script
- [ ] Export all 14 schemes, confirm no validation errors

---

## Phase 8F: Ontological Reasoning Engine (2-3 weeks, 80-100 hours)

### 8F.1: Ontology Reasoner Foundation (Week 4, 20-25 hours)

**Goal**: Create core reasoning infrastructure

#### Reasoner Class

```typescript
// lib/aif/ontologyReasoner.ts

export class AIF_OntologyReasoner {
  private schemeCache: Map<string, SchemeWithRelations> = new Map();

  /**
   * Get full ancestor chain for a scheme (transitive parent traversal)
   */
  async getAncestorChain(schemeId: string): Promise<ArgumentScheme[]> {
    const chain: ArgumentScheme[] = [];
    const visited = new Set<string>();
    
    let currentId: string | null = schemeId;
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      
      const scheme = await this.getScheme(currentId);
      if (!scheme) break;
      
      chain.push(scheme);
      currentId = scheme.parentSchemeId;
    }
    
    return chain.slice(1); // Exclude self
  }

  /**
   * Get all descendants of a scheme (transitive children)
   */
  async getDescendants(schemeId: string): Promise<ArgumentScheme[]> {
    const descendants: ArgumentScheme[] = [];
    const visited = new Set<string>();
    
    const traverse = async (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const children = await this.getDirectChildren(id);
      for (const child of children) {
        descendants.push(child);
        await traverse(child.id);
      }
    };
    
    await traverse(schemeId);
    return descendants;
  }

  /**
   * Check if schemeA is a subtype of schemeB (direct or transitive)
   */
  async isSubtypeOf(schemeAId: string, schemeBId: string): Promise<boolean> {
    if (schemeAId === schemeBId) return true;
    
    const ancestors = await this.getAncestorChain(schemeAId);
    return ancestors.some(a => a.id === schemeBId);
  }

  /**
   * Get depth of scheme in hierarchy (0 = root, 1 = direct child, etc.)
   */
  async getDepth(schemeId: string): Promise<number> {
    const ancestors = await this.getAncestorChain(schemeId);
    return ancestors.length;
  }

  /**
   * Get root scheme (top of hierarchy)
   */
  async getRootScheme(schemeId: string): Promise<ArgumentScheme | null> {
    const ancestors = await this.getAncestorChain(schemeId);
    return ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
  }

  // Helper methods
  private async getScheme(id: string): Promise<SchemeWithRelations | null> {
    if (this.schemeCache.has(id)) {
      return this.schemeCache.get(id)!;
    }
    
    const scheme = await prisma.argumentScheme.findUnique({
      where: { id },
      include: { parentScheme: true, childSchemes: true, criticalQuestions: true },
    });
    
    if (scheme) {
      this.schemeCache.set(id, scheme);
    }
    
    return scheme;
  }

  private async getDirectChildren(id: string): Promise<ArgumentScheme[]> {
    return prisma.argumentScheme.findMany({
      where: { parentSchemeId: id },
    });
  }

  /**
   * Clear cache (call after scheme updates)
   */
  clearCache() {
    this.schemeCache.clear();
  }
}

// Singleton instance
export const ontologyReasoner = new AIF_OntologyReasoner();
```

#### Deliverables

- [ ] **lib/aif/ontologyReasoner.ts** - Reasoner class
- [ ] **__tests__/aif/ontologyReasoner.test.ts** - Tests for traversal algorithms
- [ ] Performance: <10ms for ancestor chain, <50ms for descendants

---

### 8F.2: Property Inference Engine (Week 4-5, 25-30 hours)

**Goal**: Infer scheme properties from ontology

#### Property Inference

```typescript
// Extend AIF_OntologyReasoner class

export interface InferredProperties {
  // Hierarchy
  isRoot: boolean;
  isLeaf: boolean;
  depth: number;
  rootScheme: ArgumentScheme | null;
  
  // Family
  clusterTag: string | null;
  familySize: number; // Total schemes in cluster
  siblings: ArgumentScheme[];
  
  // CQs
  totalCQs: number;
  ownCQs: number;
  inheritedCQs: number;
  cqSources: Map<string, string>; // CQ ID → source scheme ID
  
  // Relationships
  ancestors: ArgumentScheme[];
  descendants: ArgumentScheme[];
  relatedSchemes: ArgumentScheme[]; // Siblings + cousins
}

async inferSchemeProperties(schemeId: string): Promise<InferredProperties> {
  const scheme = await this.getScheme(schemeId);
  if (!scheme) throw new Error(`Scheme ${schemeId} not found`);
  
  // Hierarchy
  const ancestors = await this.getAncestorChain(schemeId);
  const descendants = await this.getDescendants(schemeId);
  const depth = ancestors.length;
  const isRoot = depth === 0;
  const isLeaf = descendants.length === 0;
  const rootScheme = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
  
  // Family
  const siblings = await this.getSchemeSiblings(schemeId);
  const familySize = scheme.clusterTag 
    ? await this.getClusterSize(scheme.clusterTag)
    : 1;
  
  // CQs
  const ownCQs = scheme.criticalQuestions.length;
  const inheritedCQData = await getInheritedCQsWithSource(schemeId);
  const inheritedCQs = inheritedCQData.length;
  const cqSources = new Map(
    inheritedCQData.map(({ cq, sourceScheme }) => [cq.id, sourceScheme.id])
  );
  
  // Related schemes (siblings + children of siblings)
  const relatedSchemes = await this.findRelatedSchemes(schemeId);
  
  return {
    isRoot,
    isLeaf,
    depth,
    rootScheme,
    clusterTag: scheme.clusterTag,
    familySize,
    siblings,
    totalCQs: ownCQs + inheritedCQs,
    ownCQs,
    inheritedCQs,
    cqSources,
    ancestors,
    descendants,
    relatedSchemes,
  };
}

/**
 * Check if two schemes are related (same family or hierarchy)
 */
async areRelated(schemeAId: string, schemeBId: string): Promise<boolean> {
  // Same scheme
  if (schemeAId === schemeBId) return true;
  
  // Parent-child
  if (await this.isSubtypeOf(schemeAId, schemeBId)) return true;
  if (await this.isSubtypeOf(schemeBId, schemeAId)) return true;
  
  // Siblings (same parent)
  const schemeA = await this.getScheme(schemeAId);
  const schemeB = await this.getScheme(schemeBId);
  if (schemeA?.parentSchemeId === schemeB?.parentSchemeId && schemeA?.parentSchemeId) {
    return true;
  }
  
  // Same cluster
  if (schemeA?.clusterTag && schemeA.clusterTag === schemeB?.clusterTag) {
    return true;
  }
  
  return false;
}
```

#### Deliverables

- [ ] Extend `AIF_OntologyReasoner` with inference methods
- [ ] **API route: GET /api/aif/infer/:schemeId** - Get inferred properties
- [ ] **Tests**: Verify inference for PR, SSA, CCF schemes
- [ ] Performance: <100ms for full property inference

---

### 8F.3: Scheme Relationship Detection (Week 5, 20-25 hours)

**Goal**: Detect and score scheme relationships

#### Sibling Detection

```typescript
/**
 * Get sibling schemes (same parent)
 */
async getSchemeSiblings(schemeId: string): Promise<ArgumentScheme[]> {
  const scheme = await this.getScheme(schemeId);
  if (!scheme?.parentSchemeId) return [];
  
  return prisma.argumentScheme.findMany({
    where: {
      parentSchemeId: scheme.parentSchemeId,
      id: { not: schemeId }, // Exclude self
    },
  });
}

/**
 * Find related schemes with similarity scoring
 */
async findRelatedSchemes(
  schemeId: string,
  limit: number = 10
): Promise<Array<{ scheme: ArgumentScheme; score: number; reason: string }>> {
  const scheme = await this.getScheme(schemeId);
  if (!scheme) return [];
  
  const related: Array<{ scheme: ArgumentScheme; score: number; reason: string }> = [];
  
  // 1. Parent (highest relevance)
  if (scheme.parentSchemeId) {
    const parent = await this.getScheme(scheme.parentSchemeId);
    if (parent) {
      related.push({ scheme: parent, score: 1.0, reason: "parent" });
    }
  }
  
  // 2. Children
  const children = await this.getDirectChildren(schemeId);
  for (const child of children) {
    related.push({ scheme: child, score: 0.9, reason: "child" });
  }
  
  // 3. Siblings
  const siblings = await this.getSchemeSiblings(schemeId);
  for (const sibling of siblings) {
    related.push({ scheme: sibling, score: 0.8, reason: "sibling" });
  }
  
  // 4. Same cluster (not already included)
  if (scheme.clusterTag) {
    const clusterSchemes = await prisma.argumentScheme.findMany({
      where: {
        clusterTag: scheme.clusterTag,
        id: { notIn: [schemeId, ...related.map(r => r.scheme.id)] },
      },
    });
    for (const cs of clusterSchemes) {
      related.push({ scheme: cs, score: 0.7, reason: "cluster" });
    }
  }
  
  // 5. Ancestors (lower relevance)
  const ancestors = await this.getAncestorChain(schemeId);
  for (const [i, ancestor] of ancestors.entries()) {
    if (i === 0) continue; // Skip parent (already added)
    const score = 0.6 - (i * 0.1); // Decreasing score for distant ancestors
    related.push({ scheme: ancestor, score: Math.max(score, 0.3), reason: "ancestor" });
  }
  
  // Sort by score and limit
  return related
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

#### Scheme Recommendation

```typescript
/**
 * Recommend schemes based on context
 */
async recommendSchemes(context: {
  dialogueType?: string;
  existingSchemesUsed?: string[];
  clusterPreference?: string;
}): Promise<Array<{ scheme: ArgumentScheme; score: number; reason: string }>> {
  const candidates: Array<{ scheme: ArgumentScheme; score: number; reason: string }> = [];
  
  // Get all schemes
  const allSchemes = await prisma.argumentScheme.findMany({
    include: { criticalQuestions: true },
  });
  
  for (const scheme of allSchemes) {
    let score = 0.5; // Base score
    const reasons: string[] = [];
    
    // Boost for cluster preference
    if (context.clusterPreference && scheme.clusterTag === context.clusterPreference) {
      score += 0.3;
      reasons.push("matching cluster");
    }
    
    // Boost for root schemes (more general)
    if (!scheme.parentSchemeId) {
      score += 0.1;
      reasons.push("root scheme");
    }
    
    // Penalize if already used
    if (context.existingSchemesUsed?.includes(scheme.id)) {
      score -= 0.4;
      reasons.push("already used");
    }
    
    // Boost for schemes with many CQs (more robust)
    const totalCQs = await this.getTotalCQCount(scheme.id);
    if (totalCQs >= 8) {
      score += 0.2;
      reasons.push("many CQs");
    }
    
    candidates.push({
      scheme,
      score: Math.max(0, Math.min(1, score)),
      reason: reasons.join(", "),
    });
  }
  
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
```

#### Deliverables

- [ ] Implement sibling/related scheme detection
- [ ] Add scheme recommendation algorithm
- [ ] **API route: GET /api/aif/related/:schemeId** - Get related schemes
- [ ] **API route: GET /api/aif/recommend** - Recommend schemes
- [ ] **Tests**: Verify relationship detection accuracy

---

### 8F.4: Enhanced CQ Inference (Week 5-6, 15-20 hours)

**Goal**: Use ontology for smarter CQ suggestions

#### Ontology-Aware CQ Suggestions

```typescript
/**
 * Suggest additional CQs based on ontology
 */
async inferMissingCQs(schemeId: string): Promise<CriticalQuestion[]> {
  const scheme = await this.getScheme(schemeId);
  if (!scheme) return [];
  
  const suggestions: CriticalQuestion[] = [];
  
  // 1. Suggest CQs from siblings (similar schemes may share CQs)
  const siblings = await this.getSchemeSiblings(schemeId);
  for (const sibling of siblings) {
    const siblingCQs = await prisma.criticalQuestion.findMany({
      where: { schemeId: sibling.id },
    });
    
    // Filter out CQs already present
    const existingTexts = new Set(scheme.criticalQuestions.map(cq => cq.question));
    const newCQs = siblingCQs.filter(cq => !existingTexts.has(cq.question));
    
    suggestions.push(...newCQs);
  }
  
  // 2. Suggest CQs from children (specializations may reveal gaps)
  const descendants = await this.getDescendants(schemeId);
  for (const descendant of descendants) {
    const childScheme = await this.getScheme(descendant.id);
    if (!childScheme) continue;
    
    const childCQs = childScheme.criticalQuestions.filter(cq => {
      // Only suggest CQs that are specific to child (not inherited)
      return !scheme.criticalQuestions.some(parentCQ => parentCQ.question === cq.question);
    });
    
    suggestions.push(...childCQs);
  }
  
  // Deduplicate by question text
  const uniqueCQs = Array.from(
    new Map(suggestions.map(cq => [cq.question, cq])).values()
  );
  
  return uniqueCQs;
}

/**
 * Validate CQ coverage for a scheme
 */
async validateCQCoverage(schemeId: string): Promise<{
  coverage: "complete" | "partial" | "sparse";
  totalCQs: number;
  missingCQCategories: string[];
  suggestions: CriticalQuestion[];
}> {
  const properties = await this.inferSchemeProperties(schemeId);
  const suggestions = await this.inferMissingCQs(schemeId);
  
  // Expected CQ categories (from Walton's taxonomy)
  const expectedCategories = [
    "premises",
    "exceptions",
    "alternatives",
    "side_effects",
    "evidence",
  ];
  
  const existingCategories = new Set(
    (await this.getScheme(schemeId))?.criticalQuestions.map(cq => cq.category) || []
  );
  
  const missingCQCategories = expectedCategories.filter(
    cat => !existingCategories.has(cat)
  );
  
  let coverage: "complete" | "partial" | "sparse" = "sparse";
  if (properties.totalCQs >= 8) coverage = "complete";
  else if (properties.totalCQs >= 5) coverage = "partial";
  
  return {
    coverage,
    totalCQs: properties.totalCQs,
    missingCQCategories,
    suggestions,
  };
}
```

#### Integration with Existing CQ System

```typescript
// Enhance lib/argumentation/cqInheritance.ts

import { ontologyReasoner } from "@/lib/aif/ontologyReasoner";

export async function getInheritedCQsEnhanced(schemeId: string) {
  // Original inheritance logic
  const inherited = await getInheritedCQs(schemeId);
  
  // Add ontology-based suggestions
  const suggestions = await ontologyReasoner.inferMissingCQs(schemeId);
  
  return {
    inherited,
    suggestions,
    coverage: await ontologyReasoner.validateCQCoverage(schemeId),
  };
}
```

#### Deliverables

- [ ] Implement `inferMissingCQs()` and `validateCQCoverage()`
- [ ] Integrate with existing `cqInheritance.ts`
- [ ] **API route: GET /api/aif/cq-suggestions/:schemeId** - Get CQ suggestions
- [ ] **Tests**: Verify suggestions are relevant and non-duplicate

---

### 8F.5: Admin UI Integration (Week 6, 20-25 hours)

**Goal**: Show ontology insights in admin interface

#### Ontology Insights Panel

```tsx
// components/admin/OntologyInsightsPanel.tsx

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OntologyInsights {
  isRoot: boolean;
  isLeaf: boolean;
  depth: number;
  familySize: number;
  totalCQs: number;
  ownCQs: number;
  inheritedCQs: number;
  relatedSchemes: Array<{ name: string; relationship: string }>;
  suggestedCQs: Array<{ question: string; source: string }>;
}

export function OntologyInsightsPanel({ schemeId }: { schemeId: string }) {
  const [insights, setInsights] = useState<OntologyInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      const res = await fetch(`/api/aif/infer/${schemeId}`);
      const data = await res.json();
      setInsights(data);
      setLoading(false);
    }
    fetchInsights();
  }, [schemeId]);

  if (loading) return <div>Loading ontology insights...</div>;
  if (!insights) return null;

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Ontology Insights</h3>
      
      {/* Hierarchy Position */}
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Hierarchy Position</h4>
        <div className="flex gap-2 mt-2">
          {insights.isRoot && <Badge variant="secondary">Root Scheme</Badge>}
          {insights.isLeaf && <Badge variant="secondary">Leaf Scheme</Badge>}
          <Badge variant="outline">Depth: {insights.depth}</Badge>
        </div>
      </div>

      {/* Family Info */}
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Family</h4>
        <p className="text-sm mt-1">
          Part of a family with <strong>{insights.familySize}</strong> schemes
        </p>
      </div>

      {/* CQ Coverage */}
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Critical Questions</h4>
        <div className="space-y-1 mt-1">
          <p className="text-sm">
            <strong>{insights.totalCQs}</strong> total CQs 
            ({insights.ownCQs} own + {insights.inheritedCQs} inherited)
          </p>
          {insights.suggestedCQs.length > 0 && (
            <p className="text-sm text-yellow-600">
              💡 {insights.suggestedCQs.length} suggested CQs from related schemes
            </p>
          )}
        </div>
      </div>

      {/* Related Schemes */}
      <div>
        <h4 className="font-medium text-sm text-muted-foreground">Related Schemes</h4>
        <div className="space-y-1 mt-2">
          {insights.relatedSchemes.slice(0, 5).map((related, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">
                {related.relationship}
              </Badge>
              <span>{related.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
```

#### Enhanced Scheme Hierarchy View

```tsx
// Update components/admin/SchemeHierarchyView.tsx

import { OntologyInsightsPanel } from "./OntologyInsightsPanel";

export function SchemeHierarchyView() {
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left: Hierarchy Tree (existing) */}
      <div className="col-span-2">
        {/* ... existing tree view ... */}
      </div>

      {/* Right: Ontology Insights */}
      <div>
        {selectedScheme && (
          <OntologyInsightsPanel schemeId={selectedScheme} />
        )}
      </div>
    </div>
  );
}
```

#### CQ Suggestions UI

```tsx
// components/admin/CQSuggestionsPanel.tsx

export function CQSuggestionsPanel({ schemeId }: { schemeId: string }) {
  const [suggestions, setSuggestions] = useState<CQSuggestion[]>([]);

  useEffect(() => {
    async function fetchSuggestions() {
      const res = await fetch(`/api/aif/cq-suggestions/${schemeId}`);
      const data = await res.json();
      setSuggestions(data.suggestions);
    }
    fetchSuggestions();
  }, [schemeId]);

  const handleAddCQ = async (suggestion: CQSuggestion) => {
    await fetch(`/api/critical-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schemeId,
        question: suggestion.question,
        category: suggestion.category,
        order: suggestions.length + 1,
      }),
    });
    // Refresh
    window.location.reload();
  };

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3">Suggested Critical Questions</h4>
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
            <div className="flex-1">
              <p className="text-sm">{suggestion.question}</p>
              <p className="text-xs text-muted-foreground mt-1">
                From: {suggestion.sourceSchemeName} ({suggestion.category})
              </p>
            </div>
            <Button size="sm" onClick={() => handleAddCQ(suggestion)}>
              Add
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

#### Deliverables

- [ ] **components/admin/OntologyInsightsPanel.tsx** - Insights component
- [ ] **components/admin/CQSuggestionsPanel.tsx** - CQ suggestions component
- [ ] Integrate into SchemeHierarchyView and SchemeCreator
- [ ] Add "Ontology" tab to scheme detail page
- [ ] **Tests**: Visual regression tests for new UI components

---

## Phase 8: Testing & Documentation (Week 6-7, 20-30 hours)

### Testing Strategy

#### Unit Tests (50+ tests)

```typescript
// __tests__/aif/ontologyReasoner.test.ts
- getAncestorChain()
- getDescendants()
- isSubtypeOf()
- getSchemeSiblings()
- inferSchemeProperties()
- findRelatedSchemes()
- inferMissingCQs()

// __tests__/aif/aifExporter.test.ts
- exportSchemeToAIF() (all formats)
- exportClusterFamily()
- CQ export with inheritance
- Hierarchy export

// __tests__/aif/aifValidator.test.ts
- Validation of exported RDF
- Error detection
```

#### Integration Tests (20+ tests)

```typescript
// __tests__/integration/aif-api.test.ts
- API endpoints for export
- API endpoints for inference
- API endpoints for recommendations
- Error handling
```

#### End-to-End Tests (5+ tests)

```typescript
// __tests__/e2e/aif-ui.spec.ts (Playwright)
- View ontology insights for a scheme
- Export scheme to RDF/XML
- Accept CQ suggestion
- Navigate hierarchy with insights panel
```

### Performance Benchmarks

| Operation | Target | Measured | Status |
|-----------|--------|----------|--------|
| Ancestor chain | <10ms | TBD | 🟡 |
| Descendant tree | <50ms | TBD | 🟡 |
| Property inference | <100ms | TBD | 🟡 |
| RDF export (single scheme) | <200ms | TBD | 🟡 |
| RDF export (cluster) | <500ms | TBD | 🟡 |
| CQ suggestions | <150ms | TBD | 🟡 |

### Documentation

1. **docs/AIF_ONTOLOGY_GUIDE.md** - Complete ontology mapping documentation
2. **docs/AIF_API.md** - API reference for AIF endpoints
3. **docs/ONTOLOGY_REASONING.md** - Reasoning engine usage guide
4. **docs/AIF_EXPORT_TUTORIAL.md** - Tutorial for exporting schemes

### Deliverables

- [ ] 70+ passing tests (unit + integration + E2E)
- [ ] Performance benchmarks documented
- [ ] API documentation complete
- [ ] User guide for ontology features
- [ ] Code review and cleanup

---

## Success Metrics

### Technical Metrics

- ✅ All 14 schemes exportable to valid AIF/RDF
- ✅ 100% validation success rate for exported RDF
- ✅ <100ms average for ontology reasoning queries
- ✅ 70+ passing tests with >80% coverage
- ✅ Zero TypeScript errors

### Functional Metrics

- ✅ Scheme hierarchies correctly represented in RDF
- ✅ CQ inheritance with provenance tracked
- ✅ Related scheme recommendations 80%+ accuracy
- ✅ CQ suggestions accepted by admin 50%+ of time
- ✅ Ontology insights panel helpful (user feedback)

### Research Impact

- ✅ Mesh schemes interoperable with other AIF tools
- ✅ Foundation for formal argumentation research
- ✅ Ontological reasoning enhances scheme management
- ✅ Publishable work on argumentation scheme ontologies

---

## Timeline Summary

| Phase | Duration | Effort | Deliverables |
|-------|----------|--------|--------------|
| 8E.1: AIF Schema Design | Week 1 | 30-40h | Mapping config, types, docs |
| 8E.2: RDF Export | Week 1-2 | 40-50h | RDF/XML, Turtle, JSON-LD exporters |
| 8E.3: Hierarchy Export | Week 2 | 20-30h | Parent-child in RDF, cluster export |
| 8E.4: CQ Inheritance | Week 2 | 20-30h | CQ provenance, inheritance metadata |
| 8E.5: AIF Validation | Week 3 | 10-20h | Validator, test suite, bulk export |
| 8F.1: Reasoner Foundation | Week 4 | 20-25h | Ontology reasoner class, traversal |
| 8F.2: Property Inference | Week 4-5 | 25-30h | Infer properties, API endpoints |
| 8F.3: Relationship Detection | Week 5 | 20-25h | Siblings, related schemes, recommendations |
| 8F.4: Enhanced CQ Inference | Week 5-6 | 15-20h | CQ suggestions, coverage validation |
| 8F.5: Admin UI Integration | Week 6 | 20-25h | Insights panel, CQ suggestions UI |
| Testing & Documentation | Week 6-7 | 20-30h | Tests, benchmarks, docs |

**Total**: 5-6 weeks, 200-250 hours

---

## Dependencies & Tools

### New npm Packages

```bash
npm install n3  # RDF library for Turtle/JSON-LD
npm install -D @types/n3
```

### External Tools (Optional)

- [Protégé](https://protege.stanford.edu/) - OWL ontology editor (for validation)
- [RDF Validator](https://www.w3.org/RDF/Validator/) - W3C RDF validation service
- [SPARQL Playground](https://www.w3.org/2001/sw/DataAccess/sp-playground/) - Test SPARQL queries

---

## Risk Mitigation

### Risk 1: AIF Spec Ambiguity

**Risk**: W3C AIF spec may be unclear or incomplete

**Mitigation**:
- Reference existing AIF implementations (OVA, Carneades)
- Consult academic papers on AIF usage
- Document assumptions and deviations

### Risk 2: Performance Issues

**Risk**: Transitive queries on large hierarchies may be slow

**Mitigation**:
- Implement caching in reasoner
- Add database indexes on parentSchemeId
- Precompute ancestor chains if needed

### Risk 3: RDF Complexity

**Risk**: RDF/OWL may be overly complex for our needs

**Mitigation**:
- Start simple (RDF/XML with basic properties)
- Add complexity incrementally
- Focus on practical use cases, not theoretical completeness

---

## Next Steps

**Immediate**:
1. Review this roadmap
2. Install `n3` package
3. Create branch: `feature/aif-ontology-integration`
4. Start with Phase 8E.1 (AIF schema design)

**Week 1**:
- Complete AIF schema mapping
- Begin RDF export implementation

**Week 2-3**:
- Complete RDF export (all formats)
- Hierarchy and CQ inheritance export
- Validation and testing

**Week 4-6**:
- Ontology reasoner implementation
- Property inference and relationship detection
- Admin UI integration

**Week 7**:
- Final testing and documentation
- Deploy to staging
- User testing with admin team

---

**Status**: ✅ Ready to Start  
**Next Action**: Install `n3` package and create `config/aif-ontology-mapping.yaml`
