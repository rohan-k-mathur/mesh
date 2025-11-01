# AIF Ontology Integration Guide
## Mesh Argumentation Scheme Ontology

**Last Updated**: October 31, 2025  
**Status**: Phase 8E.1 Complete  
**Version**: 1.0.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [What is AIF?](#what-is-aif)
3. [Mesh → AIF Mapping](#mesh--aif-mapping)
4. [Ontology Structure](#ontology-structure)
5. [Custom Extensions](#custom-extensions)
6. [URI Patterns](#uri-patterns)
7. [Examples](#examples)
8. [Design Decisions](#design-decisions)
9. [References](#references)

---

## Introduction

This guide documents how Mesh's argumentation scheme model maps to the W3C Argument Interchange Format (AIF) ontology. The goal is to enable interoperability with other argumentation tools and provide a formal semantic foundation for computational argumentation research.

### Key Goals

- **W3C AIF Compliance**: Export schemes in valid AIF/RDF format
- **Interoperability**: Enable import/export with other AIF tools (OVA, Carneades, AIFdb)
- **Semantic Richness**: Preserve Mesh-specific features (clustering, inheritance) in RDF
- **Research Foundation**: Provide formal ontology for argumentation scheme reasoning

---

## What is AIF?

The **Argument Interchange Format (AIF)** is a W3C-endorsed ontology for representing arguments in a machine-readable format. It defines a core vocabulary for describing argumentation structures.

### AIF Core Concepts

#### 1. Node Types

- **I-nodes (Information nodes)**: Claims, premises, data, conclusions
- **S-nodes (Scheme nodes)**: Inference rules, argumentation schemes
- **RA-nodes (Rule Application nodes)**: Links between I-nodes via S-nodes

#### 2. Key Classes

- `aif:Scheme` — An argumentation scheme (e.g., Argument from Expert Opinion)
- `aif:Question` — A critical question challenging a scheme
- `aif:Argument` — An argument instance using a scheme
- `aif:I-node` — Atomic information unit
- `aif:RA-node` — Application of a scheme to premises

#### 3. Key Properties

- `aif:schemeName` — Human-readable name of scheme
- `aif:hasQuestion` — Links scheme to critical questions
- `aif:questionText` — Text of a critical question
- `aif:appliesScheme` — Links argument to scheme used
- `aif:isSubtypeOf` — Hierarchy relationship between schemes

### AIF in Practice

**Example**: Argument from Expert Opinion

```turtle
@prefix aif: <http://www.arg.dundee.ac.uk/aif#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://example.org/schemes/expert_opinion>
  a aif:Scheme ;
  rdfs:label "expert_opinion" ;
  aif:schemeName "Argument from Expert Opinion" ;
  aif:hasQuestion <http://example.org/schemes/expert_opinion/cq1> .

<http://example.org/schemes/expert_opinion/cq1>
  a aif:Question ;
  aif:questionText "Is the expert credible in this domain?" .
```

---

## Mesh → AIF Mapping

### ArgumentScheme → aif:Scheme (S-node)

| Mesh Field | AIF Property | Type | Notes |
|------------|--------------|------|-------|
| `schemeKey` | `rdfs:label` | `xsd:string` | Unique identifier |
| `name` | `aif:schemeName` | `xsd:string` | Human-readable name |
| `summary` | `rdfs:comment` | `xsd:string` | Brief description |
| `description` | `aif:description` | `xsd:string` | Detailed explanation |
| `parentSchemeId` | `aif:isSubtypeOf` | `owl:ObjectProperty` | Parent scheme reference |
| `clusterTag` | `mesh:clusterTag` | `xsd:string` | **Mesh extension** |
| `inheritCQs` | `mesh:inheritCQs` | `xsd:boolean` | **Mesh extension** |
| `createdAt` | `mesh:createdAt` | `xsd:dateTime` | **Mesh extension** |
| `updatedAt` | `mesh:updatedAt` | `xsd:dateTime` | **Mesh extension** |

### CriticalQuestion → aif:Question

| Mesh Field | AIF Property | Type | Notes |
|------------|--------------|------|-------|
| `question` | `aif:questionText` | `xsd:string` | Question text |
| `category` | `aif:questionCategory` | `xsd:string` | Category (premises, exceptions, etc.) |
| `order` | `mesh:questionOrder` | `xsd:integer` | **Mesh extension** |
| (inherited) | `mesh:inheritedFrom` | `owl:ObjectProperty` | **Mesh extension** |
| (computed) | `mesh:inheritanceDepth` | `xsd:integer` | **Mesh extension** |

### Argument → aif:Argument

| Mesh Field | AIF Property | Type | Notes |
|------------|--------------|------|-------|
| `claimText` | `aif:hasClaim` | `aif:I-node` | Main claim |
| `premises` | `aif:hasPremise` | `aif:I-node` | Supporting premises |
| `schemeId` | `aif:appliesScheme` | Reference to `aif:Scheme` | Scheme used |
| `confidence` | `mesh:confidence` | `xsd:float` | **Mesh extension** |

---

## Ontology Structure

### Namespace Definitions

```turtle
@prefix aif: <http://www.arg.dundee.ac.uk/aif#> .
@prefix mesh: <http://mesh-platform.io/ontology/aif#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
```

### Core Hierarchy

```
owl:Thing
├── aif:Scheme (S-node)
│   └── (Mesh schemes as instances)
├── aif:Question
│   └── (Critical questions as instances)
├── aif:Argument
│   └── (Arguments as instances)
├── aif:I-node (Information node)
└── aif:RA-node (Rule Application node)
```

---

## Custom Extensions

Mesh adds custom properties under the `mesh:` namespace to preserve features not in standard AIF.

### Scheme Clustering

**Property**: `mesh:clusterTag`  
**Type**: `owl:DatatypeProperty`  
**Domain**: `aif:Scheme`  
**Range**: `xsd:string`

Groups related schemes into families (e.g., `practical_reasoning_family`).

```turtle
<http://mesh-platform.io/aif/schemes/practical_reasoning>
  mesh:clusterTag "practical_reasoning_family" .

<http://mesh-platform.io/aif/schemes/sunk_cost_argument>
  mesh:clusterTag "practical_reasoning_family" .
```

### CQ Inheritance Control

**Property**: `mesh:inheritCQs`  
**Type**: `owl:DatatypeProperty`  
**Domain**: `aif:Scheme`  
**Range**: `xsd:boolean`

Controls whether a child scheme inherits critical questions from its parent.

```turtle
<http://mesh-platform.io/aif/schemes/sunk_cost_argument>
  aif:isSubtypeOf <http://mesh-platform.io/aif/schemes/practical_reasoning> ;
  mesh:inheritCQs true .
```

### Transitive Ancestors

**Property**: `mesh:hasAncestor`  
**Type**: `owl:ObjectProperty` (transitive)  
**Domain**: `aif:Scheme`  
**Range**: `aif:Scheme`

Enables efficient SPARQL queries for "all ancestors" without recursive traversal.

```turtle
<http://mesh-platform.io/aif/schemes/sunk_cost_argument>
  mesh:hasAncestor <http://mesh-platform.io/aif/schemes/practical_reasoning> .
```

### CQ Provenance

**Property**: `mesh:inheritedFrom`  
**Type**: `owl:ObjectProperty`  
**Domain**: `aif:Question`  
**Range**: `aif:Scheme`

Tracks the original scheme that defined an inherited critical question.

```turtle
<http://mesh-platform.io/aif/schemes/sunk_cost_argument>
  aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/cq1> .

<http://mesh-platform.io/aif/schemes/practical_reasoning/cq1>
  mesh:inheritedFrom <http://mesh-platform.io/aif/schemes/practical_reasoning> ;
  mesh:inheritanceDepth 1 .
```

### Question Inheritance Metadata

**Class**: `mesh:QuestionInheritance`  
**Purpose**: Detailed tracking of question inheritance chains

```turtle
<http://mesh-platform.io/aif/inheritance/sunk_cost_argument/cq1>
  a mesh:QuestionInheritance ;
  mesh:childScheme <http://mesh-platform.io/aif/schemes/sunk_cost_argument> ;
  mesh:parentScheme <http://mesh-platform.io/aif/schemes/practical_reasoning> ;
  mesh:inheritedQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/cq1> ;
  mesh:inheritanceDepth 1 .
```

---

## URI Patterns

### Scheme URI

**Pattern**: `http://mesh-platform.io/aif/schemes/{schemeKey}`

**Example**: `http://mesh-platform.io/aif/schemes/practical_reasoning`

### Question URI

**Pattern**: `http://mesh-platform.io/aif/schemes/{schemeKey}/questions/{questionId}`

**Example**: `http://mesh-platform.io/aif/schemes/practical_reasoning/questions/cq1`

### Argument URI

**Pattern**: `http://mesh-platform.io/aif/arguments/{argumentId}`

**Example**: `http://mesh-platform.io/aif/arguments/arg_12345`

### Inheritance Metadata URI

**Pattern**: `http://mesh-platform.io/aif/inheritance/{childSchemeId}/{questionId}`

**Example**: `http://mesh-platform.io/aif/inheritance/sunk_cost_argument/cq1`

---

## Examples

### Example 1: Simple Scheme (No Hierarchy)

```turtle
@prefix aif: <http://www.arg.dundee.ac.uk/aif#> .
@prefix mesh: <http://mesh-platform.io/ontology/aif#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://mesh-platform.io/aif/schemes/expert_opinion>
  a aif:Scheme ;
  rdfs:label "expert_opinion" ;
  aif:schemeName "Argument from Expert Opinion" ;
  rdfs:comment "Argument based on expert testimony" ;
  mesh:clusterTag "source_based_family" ;
  aif:hasQuestion <http://mesh-platform.io/aif/schemes/expert_opinion/cq1> ,
                  <http://mesh-platform.io/aif/schemes/expert_opinion/cq2> .

<http://mesh-platform.io/aif/schemes/expert_opinion/cq1>
  a aif:Question ;
  aif:questionText "Is the expert credible in this domain?" ;
  aif:questionCategory "expertise" ;
  mesh:questionOrder 1 .

<http://mesh-platform.io/aif/schemes/expert_opinion/cq2>
  a aif:Question ;
  aif:questionText "Is the expert's statement consistent with other experts?" ;
  aif:questionCategory "evidence" ;
  mesh:questionOrder 2 .
```

### Example 2: Parent-Child Hierarchy

```turtle
# Parent scheme
<http://mesh-platform.io/aif/schemes/practical_reasoning>
  a aif:Scheme ;
  rdfs:label "practical_reasoning" ;
  aif:schemeName "Practical Reasoning" ;
  rdfs:comment "Argument from goals and actions" ;
  mesh:clusterTag "practical_reasoning_family" ;
  aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/cq1> .

<http://mesh-platform.io/aif/schemes/practical_reasoning/cq1>
  a aif:Question ;
  aif:questionText "Are there alternative actions that would better achieve the goal?" ;
  aif:questionCategory "alternatives" .

# Child scheme (inherits CQs)
<http://mesh-platform.io/aif/schemes/sunk_cost_argument>
  a aif:Scheme ;
  rdfs:label "sunk_cost_argument" ;
  aif:schemeName "Sunk Cost Argument" ;
  aif:isSubtypeOf <http://mesh-platform.io/aif/schemes/practical_reasoning> ;
  mesh:clusterTag "practical_reasoning_family" ;
  mesh:inheritCQs true ;
  aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/cq1> ,
                  <http://mesh-platform.io/aif/schemes/sunk_cost_argument/cq1> .

# Child's own CQ
<http://mesh-platform.io/aif/schemes/sunk_cost_argument/cq1>
  a aif:Question ;
  aif:questionText "Has too much already been invested to stop now?" ;
  aif:questionCategory "commitment" .

# Inheritance metadata
<http://mesh-platform.io/aif/inheritance/sunk_cost_argument/pr_cq1>
  a mesh:QuestionInheritance ;
  mesh:childScheme <http://mesh-platform.io/aif/schemes/sunk_cost_argument> ;
  mesh:parentScheme <http://mesh-platform.io/aif/schemes/practical_reasoning> ;
  mesh:inheritedQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/cq1> ;
  mesh:inheritanceDepth 1 .
```

### Example 3: SPARQL Query (Find all descendants)

```sparql
PREFIX aif: <http://www.arg.dundee.ac.uk/aif#>
PREFIX mesh: <http://mesh-platform.io/ontology/aif#>

SELECT ?descendant ?descendantName
WHERE {
  ?descendant aif:isSubtypeOf* <http://mesh-platform.io/aif/schemes/practical_reasoning> .
  ?descendant aif:schemeName ?descendantName .
  FILTER (?descendant != <http://mesh-platform.io/aif/schemes/practical_reasoning>)
}
```

---

## Design Decisions

### Decision 1: Use `aif:isSubtypeOf` for Hierarchy

**Chosen**: `aif:isSubtypeOf`  
**Alternatives**: `rdfs:subClassOf`, custom `mesh:childOf`

**Rationale**:
- Standard OWL property with well-understood semantics
- Matches AIF's intended use for scheme hierarchies
- Compatible with OWL reasoners
- `rdfs:subClassOf` is for classes, not instances

### Decision 2: Separate `mesh:` Namespace

**Chosen**: Create `mesh:` namespace for extensions  
**Alternatives**: Extend `aif:` namespace directly

**Rationale**:
- Best practice: Don't pollute standard namespaces
- Clear distinction between standard and custom properties
- Easier for other tools to ignore Mesh-specific features
- Preserves AIF compliance for core properties

### Decision 3: `mesh:QuestionInheritance` Class

**Chosen**: Explicit class for inheritance metadata  
**Alternatives**: Simple properties only

**Rationale**:
- Enables detailed provenance tracking
- Supports complex queries about inheritance chains
- Future-proof for additional metadata (e.g., override reason)
- Follows RDF reification pattern for metadata about relationships

### Decision 4: Transitive `mesh:hasAncestor`

**Chosen**: Make `mesh:hasAncestor` transitive  
**Alternatives**: Compute ancestors on-demand

**Rationale**:
- Efficient SPARQL queries: `?x mesh:hasAncestor ?y` finds all ancestors
- OWL reasoners can infer transitive closure automatically
- Avoids recursive queries in SPARQL
- Standard OWL pattern for hierarchies

### Decision 5: Multiple Export Formats

**Chosen**: Support RDF/XML, Turtle, JSON-LD  
**Alternatives**: RDF/XML only (official AIF format)

**Rationale**:
- RDF/XML is verbose and hard to read → Turtle for humans
- JSON-LD is web-friendly → better API integration
- Maximizes interoperability with different tools
- Low implementation cost (use `n3` library)

---

## References

### AIF Specification

- **AIF Ontology**: http://www.arg.dundee.ac.uk/aif
- **AIF Paper**: Reed, C., & Rowe, G. (2004). "Araucaria: Software for argument analysis, diagramming and representation"

### Related Tools

- **OVA (Online Visualisation of Argument)**: http://ova.arg-tech.org
- **Carneades**: http://carneades.github.io
- **AIFdb (Argument Database)**: http://aifdb.org
- **Arg:Tech**: https://arg.tech

### W3C Standards

- **RDF Primer**: https://www.w3.org/TR/rdf-primer/
- **OWL 2 Web Ontology Language**: https://www.w3.org/TR/owl2-overview/
- **SPARQL 1.1**: https://www.w3.org/TR/sparql11-overview/

### Academic References

- Macagno, F., & Walton, D. (2015). "Classifying the patterns of natural arguments"
- Walton, D., Reed, C., & Macagno, F. (2008). "Argumentation Schemes"
- Rahwan, I., & Reed, C. (2009). "The Argument Interchange Format"

---

## Next Steps

With Phase 8E.1 complete, proceed to:

1. **Phase 8E.2**: Implement RDF export functions (`lib/aif/aifExporter.ts`)
2. **Phase 8E.3**: Add hierarchy export (parent-child relationships)
3. **Phase 8E.4**: Implement CQ inheritance export with provenance
4. **Phase 8E.5**: Validation and testing

---

**Status**: ✅ Phase 8E.1 Complete  
**Files Created**: 
- `config/aif-ontology-mapping.yaml`
- `lib/aif/types.ts`
- `lib/aif/constants.ts`
- `docs/AIF_ONTOLOGY_GUIDE.md`

**Next**: Phase 8E.2 - RDF/XML Export Implementation
