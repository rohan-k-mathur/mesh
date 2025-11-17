# AIF/ASPIC+ to Mesh Architecture Mapping

**Quick Reference Guide**  
**Created:** November 16, 2025  
**Purpose:** Map academic argumentation frameworks to Mesh implementation

---

## Core Concept Mappings

### AIF Ontology → Prisma Models

| AIF Concept | AIF Type | Mesh Implementation | Prisma Model |
|-------------|----------|---------------------|--------------|
| Information Node | I-node | Individual argument | `Argument` (id, claimText, text) |
| Scheme Node | S-node | Argumentation scheme | `ArgumentScheme` (schemeKey, name, premises) |
| Rule Application | RA-node | Scheme instance | `ArgumentSchemeInstance` (argumentId, schemeId) |
| Conflict Application | CA-node | Attack relation | `ArgumentAttack` (sourceArgId, targetArgId) |
| Preference Application | PA-node | *(Phase 4)* | `ArgumentPreference` (weakerArgId, strongerArgId) |
| Inference Link | Edge | Chain connection | `ArgumentChainEdge` (edgeType, strength) |

### ASPIC+ Framework → Mesh Systems

| ASPIC+ Concept | Definition | Mesh Implementation | Status |
|----------------|------------|---------------------|--------|
| **Strict Rule** | Logical axiom (always holds) | `StrictRule` model | ❌ Phase 4 |
| **Defeasible Rule** | Default inference (can be defeated) | `ArgumentScheme` with confidence | ✅ Complete |
| **Ordinary Premise** | Factual claim | `Argument.claimText` | ✅ Complete |
| **Assumption** | Presumed premise | `Argument` with `isAssumption` flag | ❌ Phase 4 |
| **Rebut Attack** | Attack on conclusion | `ArgumentAttack` (aspicAttackType="rebut") | ✅ Complete |
| **Undermine Attack** | Attack on premise | `ArgumentAttack` (aspicAttackType="undermine") | ✅ Complete |
| **Undercut Attack** | Attack on inference | `ArgumentAttack` (aspicAttackType="undercut") | ✅ Complete |
| **Preference Ordering** | Argument ranking | `ArgumentPreference` | ❌ Phase 4 |
| **Grounded Extension** | Accepted arguments | `/api/aspic/evaluate` | ✅ Complete |

### Wei & Prakken Taxonomy → ChainType Enum

| Formal Structure | Description | Mesh ChainType | Detection Algorithm |
|------------------|-------------|----------------|---------------------|
| **Unit I** | Single premise → conclusion | (Not separate type) | `nodes.length === 2` |
| **Unit II** | Linked premises → conclusion | `SERIAL` | `inDegree[conclusion] > 1` + linking |
| **Multiple I** | Serial chain | `SERIAL` | No branching |
| **Multiple II** | Serial + linked | `SERIAL` | With interdependencies |
| **SCS** | Serial Convergent Structure | `CONVERGENT` | Multiple roots → one leaf |
| **SDS** | Serial Divergent Structure | `DIVERGENT` | One root → multiple leaves |
| **LCS** | Linked Convergent Structure | `TREE` | Complex convergence |
| **LDS** | Linked Divergent Structure | `TREE` | Complex divergence |
| **MS** | Mixed Structure | `GRAPH` | Both convergence + divergence |

---

## WWAW Infrastructure Mapping

### Desiderata → Mesh Features

| WWAW Requirement | Research Paper | Mesh Implementation | API Endpoint |
|------------------|----------------|---------------------|--------------|
| **Store arguments** | Rahwan et al. 2007 | PostgreSQL + Prisma | `POST /api/arguments` |
| **Web-accessible** | — | Next.js API routes | All `/api/*` endpoints |
| **Open standards** | AIF-RDF | JSON-LD serialization | `GET /api/arguments/[id]/aif` |
| **Unified ontology** | 65 Walton schemes | `ArgumentScheme` model | `GET /api/schemes` |
| **Multiple schemes** | Scheme chaining | `SchemeNet` + `SchemeNetStep` | `GET /api/arguments/[id]/scheme-net` |
| **Presumptions** | Critical questions | `CriticalQuestion` model (700+) | `GET /api/schemes/[key]/cqs` |
| **Query interface** | Search/filter | Deliberation argument list | `GET /api/deliberations/[id]/arguments` |
| **Interoperability** | RDF export | AIF JSON-LD + RDF/XML | `GET /api/argument-chains/[id]/aif` |

---

## EdgeType Semantics

### Mesh EdgeType → ASPIC+ Rules

| EdgeType | Description | ASPIC+ Equivalent | Edge Strength Meaning |
|----------|-------------|-------------------|------------------------|
| `SUPPORTS` | Strengthens conclusion | Defeasible rule (→) | Confidence in support |
| `ENABLES` | Prerequisite for inference | Enabling condition | Necessity strength |
| `PRESUPPOSES` | Background assumption | Implicit premise | Assumption confidence |
| `REFUTES` | Contradicts conclusion | Rebut attack | Attack strength |
| `QUALIFIES` | Weakens but doesn't refute | Undercut attack (partial) | Qualification strength |
| `EXEMPLIFIES` | Provides example | Instance-of relation | Representativeness |
| `GENERALIZES` | Abstracts from example | Induction rule | Generalization confidence |

### Edge Semantics for Strength Calculation

```typescript
// WWAW Formula: strength(node) = Σ(supports) - Σ(attacks)

const SUPPORT_EDGES = ["SUPPORTS", "ENABLES", "PRESUPPOSES", "EXEMPLIFIES"];
const ATTACK_EDGES = ["REFUTES", "QUALIFIES"];
const NEUTRAL_EDGES = ["GENERALIZES"]; // Neither support nor attack

// In lib/utils/chainAnalysisUtils.ts:
const supportStrength = incomingEdges
  .filter(e => SUPPORT_EDGES.includes(e.edgeType))
  .reduce((sum, e) => sum + e.strength, 0);

const attackStrength = incomingEdges
  .filter(e => ATTACK_EDGES.includes(e.edgeType))
  .reduce((sum, e) => sum + e.strength, 0);

nodeStrength = supportStrength - attackStrength;
```

---

## ChainNodeRole → Argumentative Function

| ChainNodeRole | Description | Typical Position | ASPIC+ Equivalent |
|---------------|-------------|------------------|-------------------|
| `PREMISE` | Starting claim | Root node | Ordinary premise |
| `INFERENCE` | Intermediate step | Middle node | Sub-argument |
| `CONCLUSION` | Final claim | Leaf node | Top-level conclusion |
| `OBJECTION` | Counter-argument | Attacker node | Rebutting argument |
| `SUPPORT` | Evidence/backing | Supporting node | Additional premise |
| `REBUTTAL` | Response to objection | Defense node | Counter-rebuttal |
| `SYNTHESIS` | Integration of views | Convergence node | Dialectical resolution |

---

## SchemeNet ↔ ArgumentChain Relationship

### Compositional Levels

```
Level 1: Argument (single I-node)
  └─ Uses ArgumentScheme (S-node)
  └─ Applied via ArgumentSchemeInstance (RA-node)

Level 2: SchemeNet (multi-scheme within single argument)
  └─ SchemeNetStep[1] → SchemeNetStep[2] → ... → SchemeNetStep[n]
  └─ Each step uses different ArgumentScheme
  └─ Example: "Expert Opinion" → "Practical Reasoning" → "Consequences"

Level 3: ArgumentChain (multi-argument across chain)
  └─ ArgumentChainNode[1] → ArgumentChainNode[2] → ... → ArgumentChainNode[n]
  └─ Each node is complete Argument (potentially with SchemeNet)
  └─ Connected via ArgumentChainEdge with typed relations
```

### Integration Example

```json
{
  "chain": {
    "name": "Policy Argument",
    "nodes": [
      {
        "id": "node1",
        "argument": {
          "title": "Expert recommends policy",
          "schemeNet": {
            "steps": [
              { "scheme": "Expert Opinion", "stepOrder": 1 },
              { "scheme": "Practical Reasoning", "stepOrder": 2 }
            ]
          }
        }
      },
      {
        "id": "node2",
        "argument": {
          "title": "Policy will have good consequences",
          "schemeNet": null
        }
      }
    ],
    "edges": [
      {
        "source": "node1",
        "target": "node2",
        "edgeType": "SUPPORTS",
        "strength": 0.85
      }
    ]
  }
}
```

**Interpretation:**
- Node 1 contains 2-step SchemeNet (Level 2 composition)
- Nodes 1→2 form ArgumentChain (Level 3 composition)
- Total compositional depth: 3 levels (Argument → SchemeNet → ArgumentChain)

---

## API Endpoint Quick Reference

### ArgumentChain Endpoints

```typescript
// Basic CRUD
GET    /api/argument-chains                        // List all chains
POST   /api/argument-chains                        // Create new chain
GET    /api/argument-chains/[chainId]              // Get chain with nodes/edges
PATCH  /api/argument-chains/[chainId]              // Update metadata
DELETE /api/argument-chains/[chainId]              // Delete chain

// Node management
POST   /api/argument-chains/[chainId]/nodes        // Add node
PATCH  /api/argument-chains/[chainId]/nodes/[id]   // Update node
DELETE /api/argument-chains/[chainId]/nodes/[id]   // Remove node

// Edge management (via ConnectionEditor in UI)
POST   /api/argument-chains/[chainId]/edges        // Add edge (implicit in node creation)
PATCH  /api/argument-chains/[chainId]/edges/[id]   // Update edge
DELETE /api/argument-chains/[chainId]/edges/[id]   // Remove edge

// Phase 3 analysis
POST   /api/argument-chains/[chainId]/analyze      // Run analysis (critical path, cycles, strength)

// Phase 3 export
GET    /api/argument-chains/[chainId]/aif          // Export to AIF JSON-LD

// Phase 4 (planned)
POST   /api/argument-chains/[chainId]/preferences  // Add preference ordering
GET    /api/argument-chains/[chainId]/evaluate     // ASPIC+ acceptability with preferences
```

### ASPIC Endpoints

```typescript
// Current implementation
POST   /api/aspic/evaluate                         // Compute grounded extension

// Phase 4 (planned)
GET    /api/aspic/rules/strict                     // List strict rules (axioms)
POST   /api/aspic/rules/strict                     // Create custom strict rule
GET    /api/aspic/evaluate?includeStrictRules=true // Evaluate with axioms
```

### AIF Export Endpoints

```typescript
GET    /api/arguments/[id]/aif                     // Single argument → AIF
GET    /api/deliberations/[id]/aif                 // All deliberation arguments → AIF graph
GET    /api/argument-chains/[chainId]/aif          // ArgumentChain → AIF JSON-LD
```

---

## Code Pattern Examples

### Creating ArgumentChain with SchemeNet Arguments

```typescript
// 1. Create arguments with SchemeNet
const arg1 = await prisma.argument.create({
  data: {
    title: "Expert Opinion Example",
    claimText: "Policy X should be adopted",
    deliberationId: deliberationId,
    contributorId: userId,
  },
});

const schemeNet1 = await prisma.schemeNet.create({
  data: {
    argumentId: arg1.id,
    description: "Expert opinion followed by practical reasoning",
    steps: {
      create: [
        { schemeId: "expert-opinion-scheme-id", stepOrder: 1 },
        { schemeId: "practical-reasoning-scheme-id", stepOrder: 2 },
      ],
    },
  },
});

// 2. Create ArgumentChain
const chain = await prisma.argumentChain.create({
  data: {
    name: "Policy Argument Chain",
    chainType: "SERIAL",
    creatorId: userId,
    deliberationId: deliberationId,
  },
});

// 3. Add nodes
const node1 = await prisma.argumentChainNode.create({
  data: {
    chainId: chain.id,
    argumentId: arg1.id,
    contributorId: userId,
    role: "PREMISE",
    nodeOrder: 1,
    positionX: 100,
    positionY: 100,
  },
});

// 4. Add edges
const edge = await prisma.argumentChainEdge.create({
  data: {
    chainId: chain.id,
    sourceNodeId: node1.id,
    targetNodeId: node2.id,
    edgeType: "SUPPORTS",
    strength: 0.85,
  },
});
```

### Running Analysis

```typescript
// Client-side
const response = await fetch(`/api/argument-chains/${chainId}/analyze`, {
  method: "POST",
});

const analysis = await response.json();
// {
//   criticalPath: { nodeIds: [...], avgStrength: 0.75 },
//   cycles: [],
//   strength: { overallStrength: 0.68, vulnerableNodes: ["node3"] },
//   suggestions: [{ type: "missing_support", ... }]
// }
```

### Exporting to AIF

```typescript
// Export to JSON-LD
const response = await fetch(`/api/argument-chains/${chainId}/aif`);
const jsonld = await response.json();

// Validate against AIF spec
console.log(jsonld["@context"]); // "http://www.arg.dundee.ac.uk/aif#"
console.log(jsonld["@graph"].length); // nodes + edges count
```

---

## Research Paper → Implementation Lookup

### Need to implement feature X? Check these papers:

| Feature | Research Paper | Mesh Status | Implementation Guide |
|---------|---------------|-------------|----------------------|
| **Argument chaining** | Rahwan et al. 2007 (WWAW) | ✅ Complete | ArgumentChain model |
| **Structure taxonomy** | Wei & Prakken 2019 | 🟡 Phase 3 | detectChainStructureType() |
| **Strength calculation** | Rahwan et al. 2007 (WWAW) | 🟡 Phase 3 | calculateChainStrength() |
| **Preference orderings** | Prakken 2012 (Legal Opinion) | ❌ Phase 4 | ArgumentPreference model |
| **Strict rules** | Prakken 2012 (ASPIC+) | ❌ Phase 4 | StrictRule model |
| **Collaborative editing** | AGORA-NET Philosophy | ❌ Phase 4 | Real-time WebSockets |
| **AIF export** | Rahwan et al. 2007 | 🟡 Phase 3 | /api/.../aif endpoints |
| **Scheme patterns** | Wei & Prakken 2019 | ❌ Phase 5 | SchemeNetPattern mining |

**Legend:**
- ✅ Complete: Already implemented
- 🟡 In Progress: Phase 3 current work
- ❌ Planned: Phase 4+ future work

---

## Testing Strategy

### Unit Test Coverage

```typescript
// Test AIF mapping
describe("AIF Export", () => {
  it("maps Argument to I-node", () => {
    const iNode = mapArgumentToINode(argument);
    expect(iNode["@type"]).toBe("aif:I-node");
  });
  
  it("maps ArgumentScheme to S-node", () => {
    const sNode = mapSchemeToSNode(scheme);
    expect(sNode["@type"]).toBe("aif:Scheme");
  });
});

// Test ASPIC+ semantics
describe("ASPIC Attack Types", () => {
  it("rebut attacks conclusion", () => {
    const attack = { aspicAttackType: "rebut", targetArgId: 42 };
    expect(isRebutAttack(attack)).toBe(true);
  });
});

// Test Wei & Prakken taxonomy
describe("Structure Detection", () => {
  it("detects SCS structure", () => {
    const structure = detectChainStructureType(serialNodes, serialEdges);
    expect(structure.detectedType).toBe("SCS");
  });
});
```

---

## Common Pitfalls

### 1. Confusing SchemeNet with ArgumentChain

**Problem:** Both are compositional structures.

**Solution:**
- SchemeNet = schemes within **one argument** (Level 2)
- ArgumentChain = **multiple arguments** connected (Level 3)

### 2. Misinterpreting EdgeType semantics

**Problem:** `QUALIFIES` looks like support but is actually weak attack.

**Solution:** Use SUPPORT_EDGES and ATTACK_EDGES constants from chainAnalysisUtils.ts

### 3. Forgetting BigInt serialization

**Problem:** `Argument.id` is BigInt, can't JSON serialize directly.

**Solution:** Always use `BigInt.toString()` in API responses:
```typescript
return Response.json({
  ...argument,
  id: argument.id.toString(),
});
```

### 4. Not including SchemeNet in chain queries

**Problem:** ArgumentChainNode doesn't show SchemeNet badges.

**Solution:** Always include nested relation:
```typescript
include: {
  nodes: {
    include: {
      argument: {
        include: { schemeNet: { include: { steps: true } } },
      },
    },
  },
}
```

---

## Further Reading

### Research Papers

1. **Rahwan et al. (2007)** - "Towards Large Scale Argumentation Support on the Semantic Web"
   - Located: `docs/arg-computation-research/Argument Chaining Research/World Wide Argument Web.txt`
   - Key concepts: AIF-RDF, ArgDF, WWAW infrastructure

2. **Wei & Prakken (2019)** - "Argument Structures Taxonomy"
   - Located: `docs/arg-computation-research/Argument Chaining Research/Argument Structures Taxonomy.txt`
   - Key concepts: SCS/SDS/LCS/LDS/MS classification

3. **Prakken (2012)** - "Formalising a legal opinion in ASPIC+"
   - Located: `docs/arg-computation-research/Argument Chaining Research/Formalising a legal opinion... ASPIC+.txt`
   - Key concepts: Preference orderings, GC/BC schemes, defeat calculation

### Mesh Documentation

- `ARGUMENT_CHAIN_RESEARCH_INTEGRATION_GUIDE.md` - Full integration strategy
- `ARGUMENT_CHAIN_PHASE1_COMPLETE.md` - Backend implementation
- `ARGUMENT_CHAIN_PHASE2_COMPLETE.md` - Visual editor implementation
- `ARGUMENT_CHAIN_IMPLEMENTATION_ROADMAP_PHASE3_REVISED.md` - Current phase plan
- `ASPIC_IMPLEMENTATION_TODO.md` - ASPIC+ system roadmap

### External Resources

- AIF Specification: http://www.arg.dundee.ac.uk/aif
- AIFdb Repository: http://aifdb.org
- ASPIC+ Papers: https://research.vu.nl/en/persons/henry-prakken/publications/

---

**Last Updated:** November 16, 2025  
**Maintainer:** Mesh Development Team  
**Status:** Living document (update as systems evolve)
