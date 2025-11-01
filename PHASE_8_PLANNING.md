# Phase 8 Planning: Argument Invention & AIF Ontology Integration
## Advanced Computational Argumentation Features

**Planning Date:** January 2025  
**Status:** Planning Phase  
**Theoretical Foundation:** Macagno & Walton Sections 10-11, AIF Ontology Spec, IBM Watson Debater  
**Estimated Timeline:** 8-12 weeks  

---

## Executive Summary

Phase 8 represents a **paradigm shift** from **argument evaluation** (current) to **argument generation** (invention). We're implementing two deeply interconnected advanced features:

1. **Argument Invention (CAS-Style Forward Chaining)**
   - Generate arguments automatically from premises → conclusions
   - IBM Watson Debater-style argument synthesis
   - Template instantiation with knowledge base reasoning

2. **AIF Ontology Integration & Ontological Reasoning**
   - Map schemes to Argument Interchange Format (AIF) ontology
   - Enable automatic inference of scheme properties via subtype relationships
   - Support import/export of arguments in AIF-RDF format

**Why These Two Together?**

The AIF ontology provides the **formal semantic foundation** that argument invention requires. You cannot reliably generate arguments without understanding:
- Scheme subtype relationships (Expert Opinion → Medical Expert Opinion)
- CQ inheritance chains (parent CQs automatically apply to children)
- Premise/conclusion type constraints (what can feed into what)
- Dialogue move semantics (when schemes are appropriate)

This is **research-level computational argumentation** that few systems implement.

---

## Part 1: Argument Invention (Forward Chaining)

### 1.1 Theoretical Background

**Macagno & Walton Section 11.1:**
> "Argumentation schemes serve a dual function: they act as both an **evaluative tool** (for argument analysis and criticism) and a **constructive tool** (for argument invention and generation). In the context of invention, schemes function as templates that guide the construction of arguments by specifying the types of premises needed to support a given conclusion."

**IBM Watson Debater Approach:**
- **Knowledge Graph Mining**: Extract relevant claims and evidence
- **Template Matching**: Find schemes that fit the claim type
- **Premise Instantiation**: Fill scheme templates with KB facts
- **Confidence Scoring**: Evaluate argument strength before generation
- **Rhetoric Optimization**: Select most persuasive scheme for audience

**Key Insight**: Invention is **inverse inference**. Instead of:
```
Text + Schemes → Which scheme matches?  (Evaluation)
```

We do:
```
Claim + Schemes + KB → Which premises support this claim?  (Invention)
```

---

### 1.2 System Architecture

#### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Argument Invention System                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │  Claim Input │ ───> │ Scheme Matcher│ ───> │Template  │  │
│  │  "We should  │      │ (find relevant│      │Instantia-│  │
│  │   ban X"     │      │  schemes)     │      │tion      │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│         │                      │                     │       │
│         │                      │                     │       │
│         v                      v                     v       │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │ Knowledge    │      │ Scheme       │      │Generated │  │
│  │ Base         │ ───> │ Templates    │ ───> │Arguments │  │
│  │ (Facts,      │      │ (premises +  │      │          │  │
│  │  Commitments)│      │  conclusion) │      │          │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Core Algorithms

**1. Scheme Matching (Which schemes can support this claim?)**

```typescript
// lib/argumentation/invention/schemeMatcher.ts

interface ClaimAnalysis {
  claimText: string;
  claimType: "action" | "state_of_affairs" | "value_judgment";
  modalityType: "ought" | "is" | "can" | "must";
  entities: string[];  // Named entities (people, places, things)
  topics: string[];    // Subject matter tags
}

export async function findApplicableSchemes(
  claim: ClaimAnalysis,
  options: {
    dialogueType?: DialogueType;
    maxSchemes?: number;
    requireFullInstantiation?: boolean;
  }
): Promise<ApplicableScheme[]> {
  // Algorithm:
  // 1. Query schemes by conclusion type (ought vs is)
  // 2. Filter by purpose (action vs state_of_affairs)
  // 3. Check if claim matches conclusion template variables
  // 4. Score by taxonomy alignment
  // 5. Filter by dialogue type (if specified)
  
  const schemes = await prisma.argumentScheme.findMany({
    where: {
      conclusionType: claim.modalityType === "ought" ? "ought" : "is",
      purpose: claim.claimType === "action" ? "action" : "state_of_affairs",
      // Filter by dialogue type if specified
      ...(options.dialogueType && {
        appropriateDialogueTypes: { has: options.dialogueType }
      })
    },
    include: {
      premises: true,
      conclusion: true,
      parentScheme: true,  // For ontological reasoning
      cqs: true
    }
  });
  
  // Score each scheme for applicability
  const scored: ApplicableScheme[] = [];
  for (const scheme of schemes) {
    const score = calculateApplicabilityScore(claim, scheme);
    if (score.confidence >= 0.3) {  // Minimum threshold
      scored.push({
        scheme,
        confidence: score.confidence,
        matchReasons: score.reasons,
        requiredPremises: extractPremiseRequirements(scheme)
      });
    }
  }
  
  // Sort by confidence and return top N
  return scored
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, options.maxSchemes || 5);
}

function calculateApplicabilityScore(
  claim: ClaimAnalysis,
  scheme: ArgumentScheme
): { confidence: number; reasons: string[] } {
  let score = 0.5;  // Base score
  const reasons: string[] = [];
  
  // Check conclusion template compatibility
  if (scheme.conclusion) {
    const conclusionVars = extractVariables(scheme.conclusion.text);
    const claimVars = extractVariables(claim.claimText);
    const varMatch = calculateVariableOverlap(conclusionVars, claimVars);
    score += varMatch * 0.3;
    if (varMatch > 0.5) reasons.push("Conclusion structure matches claim");
  }
  
  // Check taxonomy alignment
  if (scheme.materialRelation) {
    const materialScore = scoreMaterialRelation(claim, scheme.materialRelation);
    score += materialScore * 0.2;
    if (materialScore > 0.7) reasons.push(`Material relation: ${scheme.materialRelation}`);
  }
  
  // Check entity type alignment (e.g., expert opinion needs expert entity)
  if (scheme.key === "expert_opinion" && claim.entities.some(e => isExpert(e))) {
    score += 0.2;
    reasons.push("Expert entity detected in claim");
  }
  
  return { confidence: Math.min(score, 1.0), reasons };
}
```

**2. Template Instantiation (Fill scheme templates with KB facts)**

```typescript
// lib/argumentation/invention/templateInstantiation.ts

interface KnowledgeBase {
  facts: Fact[];           // Known true statements
  commitments: Commitment[]; // Opponent's accepted statements
  commonGround: CommonGround[]; // Shared beliefs
  evidence: Evidence[];    // Citations, studies, statistics
}

interface Fact {
  id: string;
  text: string;
  confidence: number;
  source?: string;
  factType: "empirical" | "definitional" | "normative" | "testimony";
}

export async function instantiateSchemeTemplate(
  scheme: ArgumentScheme,
  claim: string,
  kb: KnowledgeBase,
  options: {
    allowPartialInstantiation?: boolean;
    minConfidence?: number;
    preferCommitments?: boolean;  // Prefer opponent's commitments over facts
  }
): Promise<InstantiatedArgument | null> {
  // Algorithm:
  // 1. Parse scheme template (premises + conclusion)
  // 2. Extract variable slots (E, S, A, etc.)
  // 3. Try to bind variables to KB entities/facts
  // 4. Check if all required premises can be filled
  // 5. Calculate overall confidence
  // 6. Return instantiated argument or null
  
  const template = {
    premises: scheme.premises as any[],
    conclusion: scheme.conclusion as any
  };
  
  // Extract variables from template
  const variables = extractAllVariables(template);
  
  // Try to bind variables
  const bindings = await findVariableBindings(variables, claim, kb);
  
  if (!bindings.complete && !options.allowPartialInstantiation) {
    return null;  // Cannot fully instantiate
  }
  
  // Fill premises with bindings
  const filledPremises: FilledPremise[] = [];
  for (const premise of template.premises) {
    const filled = fillPremiseTemplate(premise, bindings);
    if (filled) {
      filledPremises.push(filled);
    } else if (!options.allowPartialInstantiation) {
      return null;  // Missing required premise
    }
  }
  
  // Calculate confidence
  const confidence = calculateInstantiationConfidence(
    filledPremises,
    bindings,
    kb,
    options.minConfidence || 0.5
  );
  
  if (confidence < options.minConfidence || 0.5) {
    return null;  // Too low confidence
  }
  
  return {
    schemeId: scheme.id,
    schemeKey: scheme.key,
    schemeName: scheme.name,
    premises: filledPremises,
    conclusion: { text: claim, variables: bindings.conclusionVars },
    confidence,
    bindings,
    knowledgeSourceIds: filledPremises.map(p => p.sourceId).filter(Boolean)
  };
}

async function findVariableBindings(
  variables: string[],
  claim: string,
  kb: KnowledgeBase
): Promise<VariableBindings> {
  const bindings: Map<string, string> = new Map();
  
  // Example: For expert_opinion scheme
  // Variables: E (expert), S (subject), A (assertion)
  
  // Try to extract from claim
  // "Dr. Smith says climate change is real"
  // → E = "Dr. Smith", S = "climate science", A = "climate change is real"
  
  // 1. Use NLP to extract entities from claim
  const entities = await extractEntities(claim);
  
  // 2. Match entity types to variable roles
  for (const variable of variables) {
    const role = inferVariableRole(variable);  // E → expert, S → subject, etc.
    
    // Try to find KB fact that provides this variable
    const binding = await findKBBinding(role, entities, kb);
    if (binding) {
      bindings.set(variable, binding.value);
    }
  }
  
  return {
    bindings,
    complete: bindings.size === variables.length,
    conclusionVars: extractVariables(claim)
  };
}

function fillPremiseTemplate(
  premise: PremiseTemplate,
  bindings: VariableBindings
): FilledPremise | null {
  // Replace variables in premise text with actual values
  let filledText = premise.text;
  
  for (const [variable, value] of bindings.bindings) {
    // Replace all instances of variable placeholder
    filledText = filledText.replace(new RegExp(`\\b${variable}\\b`, "g"), value);
  }
  
  // Check if any variables remain unfilled
  const remainingVars = extractVariables(filledText);
  if (remainingVars.length > 0) {
    return null;  // Incomplete instantiation
  }
  
  return {
    id: premise.id,
    type: premise.type,
    text: filledText,
    originalTemplate: premise.text,
    variables: Array.from(bindings.bindings.keys()),
    sourceId: bindings.sourceIds?.get(premise.id)  // Link to KB fact
  };
}
```

**3. Argument Generation Pipeline**

```typescript
// lib/argumentation/invention/argumentGeneration.ts

export async function generateArgumentsForClaim(
  claim: string,
  context: {
    knowledgeBase: KnowledgeBase;
    dialogueType?: DialogueType;
    audience?: Audience;
    constraints?: GenerationConstraints;
  },
  options: {
    maxArguments?: number;
    minConfidence?: number;
    diversityBonus?: boolean;  // Prefer different schemes
    rhetoricalOptimization?: boolean;
  }
): Promise<GeneratedArgument[]> {
  // Full pipeline:
  
  // STEP 1: Analyze claim
  const claimAnalysis = await analyzeClaim(claim);
  
  // STEP 2: Find applicable schemes
  const applicableSchemes = await findApplicableSchemes(claimAnalysis, {
    dialogueType: context.dialogueType,
    maxSchemes: 10,
    requireFullInstantiation: false
  });
  
  if (applicableSchemes.length === 0) {
    throw new Error("No applicable schemes found for this claim");
  }
  
  // STEP 3: Instantiate each scheme
  const instantiated: InstantiatedArgument[] = [];
  for (const { scheme, confidence: schemeScore } of applicableSchemes) {
    const instance = await instantiateSchemeTemplate(
      scheme,
      claim,
      context.knowledgeBase,
      {
        allowPartialInstantiation: false,
        minConfidence: options.minConfidence || 0.5,
        preferCommitments: true
      }
    );
    
    if (instance) {
      instance.confidence *= schemeScore;  // Combine scores
      instantiated.push(instance);
    }
  }
  
  if (instantiated.length === 0) {
    throw new Error("Could not instantiate any schemes with available knowledge");
  }
  
  // STEP 4: Score and rank
  const scored = await scoreGeneratedArguments(
    instantiated,
    context,
    options
  );
  
  // STEP 5: Apply diversity bonus (if enabled)
  if (options.diversityBonus) {
    applyDiversityBonus(scored);
  }
  
  // STEP 6: Rhetorical optimization (if enabled)
  if (options.rhetoricalOptimization && context.audience) {
    optimizeForAudience(scored, context.audience);
  }
  
  // STEP 7: Return top N
  return scored
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, options.maxArguments || 3);
}

async function scoreGeneratedArguments(
  arguments: InstantiatedArgument[],
  context: { knowledgeBase: KnowledgeBase; audience?: Audience },
  options: any
): Promise<ScoredArgument[]> {
  const scored: ScoredArgument[] = [];
  
  for (const arg of arguments) {
    let score = arg.confidence;  // Base score from instantiation
    
    // Factor 1: Premise strength (are premises well-supported?)
    const premiseScore = calculatePremiseStrength(arg.premises, context.knowledgeBase);
    score *= premiseScore;
    
    // Factor 2: Scheme appropriateness (dialogue type match)
    if (context.dialogueType) {
      const appropriatenessScore = await getDialogueAppropriateness(
        arg.schemeId,
        context.dialogueType
      );
      score *= appropriatenessScore;
    }
    
    // Factor 3: Audience receptiveness (if audience profile available)
    if (context.audience) {
      const audienceScore = estimateAudienceReceptiveness(arg, context.audience);
      score *= audienceScore;
    }
    
    scored.push({
      ...arg,
      finalScore: score,
      scoreBreakdown: {
        instantiationConfidence: arg.confidence,
        premiseStrength: premiseScore,
        dialogueAppropriateness: appropriatenessScore || 1.0,
        audienceReceptiveness: audienceScore || 1.0
      }
    });
  }
  
  return scored;
}
```

---

### 1.3 Database Schema Changes

```prisma
// lib/models/schema.prisma

// NEW: Knowledge base for argument invention
model KnowledgeFact {
  id          String   @id @default(cuid())
  text        String   @db.Text
  factType    String   // "empirical" | "definitional" | "normative" | "testimony"
  confidence  Float    @default(1.0)
  source      String?  // Citation or URL
  sourceType  String?  // "study" | "expert" | "common_knowledge" | "commitment"
  
  // Entity linking
  entities    String[] // Named entities mentioned
  topics      String[] // Subject tags
  
  // Temporal info
  validFrom   DateTime?
  validUntil  DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  usedInArguments GeneratedArgumentFact[]
  
  @@index([factType])
  @@index([entities])
  @@index([topics])
}

// NEW: Track generated arguments
model GeneratedArgument {
  id              String   @id @default(cuid())
  claimText       String   @db.Text
  schemeId        String
  schemeName      String
  
  // Instantiated premises (JSON)
  premises        Json     // Array of filled premise objects
  conclusion      Json     // Filled conclusion object
  
  // Scoring
  confidence      Float
  finalScore      Float
  scoreBreakdown  Json?    // Detailed scoring breakdown
  
  // Generation context
  dialogueType    String?
  audienceId      String?
  knowledgeBaseSnapshot Json?  // KB state at generation time
  
  // Metadata
  generatedBy     String   // User or system ID
  generatedAt     DateTime @default(now())
  
  // Was it used?
  wasAccepted     Boolean  @default(false)
  finalArgumentId String?  @unique
  
  // Relations
  scheme          ArgumentScheme @relation("GeneratedFromScheme", fields: [schemeId], references: [id])
  finalArgument   Argument?      @relation("AcceptedGeneration", fields: [finalArgumentId], references: [id])
  usedFacts       GeneratedArgumentFact[]
  
  @@index([schemeId])
  @@index([dialogueType])
  @@index([generatedAt])
}

// Junction table: Which KB facts were used in which generated arguments
model GeneratedArgumentFact {
  id                  String   @id @default(cuid())
  generatedArgumentId String
  knowledgeFactId     String
  usedInPremise       String   // Which premise (P1, P2, etc.)
  
  generatedArgument   GeneratedArgument @relation(fields: [generatedArgumentId], references: [id], onDelete: Cascade)
  knowledgeFact       KnowledgeFact     @relation(fields: [knowledgeFactId], references: [id])
  
  @@unique([generatedArgumentId, knowledgeFactId, usedInPremise])
}
```

---

### 1.4 API Endpoints

```typescript
// app/api/invention/generate/route.ts

/**
 * POST /api/invention/generate
 * Generate arguments for a given claim
 * 
 * Body:
 * {
 *   claim: string;
 *   knowledgeBaseIds?: string[];  // Specific KB facts to use
 *   dialogueType?: string;
 *   maxArguments?: number;
 *   minConfidence?: number;
 * }
 * 
 * Response:
 * {
 *   arguments: GeneratedArgument[];
 *   metadata: { 
 *     schemesConsidered: number;
 *     schemesInstantiated: number;
 *     generationTime: number;
 *   }
 * }
 */

// app/api/invention/knowledge/route.ts

/**
 * POST /api/invention/knowledge
 * Add facts to knowledge base
 * 
 * GET /api/invention/knowledge?topics[]=X&factType=Y
 * Query knowledge base
 */

// app/api/invention/evaluate/route.ts

/**
 * POST /api/invention/evaluate
 * Evaluate a generated argument (get CQs, check strength)
 * 
 * Body:
 * {
 *   generatedArgumentId: string;
 * }
 * 
 * Response:
 * {
 *   cqs: CriticalQuestion[];
 *   strengthScore: number;
 *   weaknesses: string[];
 * }
 */
```

---

### 1.5 UI Components

```typescript
// components/invention/ArgumentGenerator.tsx
// - Input: Claim text
// - Select: Dialogue type, audience profile
// - KB browser: Select available facts/commitments
// - Button: "Generate Arguments"
// - Results: List of generated arguments with scores
// - Actions: Accept, Refine, Reject

// components/invention/KnowledgeBaseManager.tsx
// - CRUD for knowledge facts
// - Import from CSV/JSON
// - Tag and categorize facts
// - Link to sources

// components/invention/GeneratedArgumentCard.tsx
// - Display generated argument with premises
// - Show confidence scores and breakdown
// - Highlight which KB facts were used
// - Button: "Use This Argument"

// components/invention/ArgumentRefiner.tsx
// - Edit generated premises
// - Swap KB facts for premises
// - Adjust scheme template
// - Re-generate with constraints
```

---

## Part 2: AIF Ontology Integration

### 2.1 Theoretical Background

**AIF (Argument Interchange Format):**
- W3C standard for representing arguments
- OWL/RDF ontology with formal semantics
- Enables interoperability between argumentation systems
- Supports automatic inference via ontological reasoning

**Core AIF Concepts:**

1. **I-Nodes (Information Nodes)**: Propositions, claims, data
2. **S-Nodes (Scheme Nodes)**: Argumentation schemes
3. **RA-Nodes (Rule Application Nodes)**: Instances of scheme application
4. **CA-Nodes (Conflict Application Nodes)**: Attacks between arguments
5. **Preferences**: Ordering over arguments/schemes

**Why AIF Matters for Invention:**

```
Without AIF:
"Use expert opinion scheme"
→ Manual template filling
→ No automatic inference

With AIF:
"Use expert opinion scheme"
→ AIF knows Expert Opinion ⊆ Authority Schemes
→ Inherits all Authority CQs
→ Knows Expert Opinion inappropriate in negotiation (from ontology)
→ Can automatically suggest Medical Expert Opinion subtype (from ontology)
```

---

### 2.2 AIF Ontology Mapping Strategy

#### Scheme Hierarchy in AIF

```turtle
# Practical Reasoning Family (RDF/Turtle notation)

:PracticalReasoning a aif:ArgumentationScheme ;
  rdfs:label "Practical Reasoning (Goal→Means→Ought)" ;
  aif:hasPurpose :Action ;
  aif:hasMaterialRelation :Practical ;
  aif:hasReasoningType :Practical ;
  aif:hasCriticalQuestion :CQ_Alternatives,
                          :CQ_Feasible,
                          :CQ_SideEffects .

:ValueBasedPR a aif:ArgumentationScheme ;
  rdfs:subClassOf :PracticalReasoning ;
  rdfs:label "Value-Based Practical Reasoning" ;
  aif:addsPremise :ValuePremise ;
  aif:inheritsCQs true .

:NegativeConsequences a aif:ArgumentationScheme ;
  rdfs:subClassOf :PracticalReasoning ;
  rdfs:label "Argument from Negative Consequences" ;
  aif:hasCriticalQuestion :CQ_Likelihood,
                          :CQ_Severity .

:SlipperySlopeArgument a aif:ArgumentationScheme ;
  rdfs:subClassOf :NegativeConsequences ;
  rdfs:label "Slippery Slope Argument" ;
  aif:addsPremise :RecursivePremise ;
  aif:hasCriticalQuestion :CQ_ChainStrength .
```

**Key Ontological Relationships:**

1. **rdfs:subClassOf** → Parent-child scheme relationships
2. **aif:inheritsCQs** → CQ inheritance flag
3. **aif:addsPremise** → Child adds specialized premise
4. **aif:appropriateForDialogue** → Dialogue type constraints

---

### 2.3 Ontological Reasoning Engine

```typescript
// lib/aif/ontologyReasoner.ts

export class AIF_OntologyReasoner {
  /**
   * Given a scheme, infer all properties via ontological reasoning
   */
  async inferSchemeProperties(schemeId: string): Promise<InferredProperties> {
    const scheme = await prisma.argumentScheme.findUnique({
      where: { id: schemeId },
      include: {
        parentScheme: true,
        childSchemes: true,
        cqs: true
      }
    });
    
    // Reasoning chain:
    const properties: InferredProperties = {
      allCQs: [],
      allTaxonomyTags: [],
      appropriateDialogues: [],
      schemeFamily: null,
      ancestorChain: []
    };
    
    // 1. Walk up parent chain
    let current: ArgumentScheme | null = scheme;
    while (current) {
      properties.ancestorChain.push({
        id: current.id,
        key: current.key,
        name: current.name
      });
      
      // Inherit CQs if enabled
      if (current.inheritCQs && current.parentScheme) {
        properties.allCQs.push(...current.parentScheme.cqs);
      }
      
      // Inherit taxonomy tags
      if (current.parentScheme) {
        properties.allTaxonomyTags.push({
          purpose: current.parentScheme.purpose,
          materialRelation: current.parentScheme.materialRelation,
          // ... other taxonomy fields
        });
      }
      
      current = current.parentScheme;
    }
    
    // 2. Add own CQs
    properties.allCQs.push(...scheme.cqs);
    
    // 3. Deduplicate CQs
    properties.allCQs = deduplicateCQs(properties.allCQs);
    
    // 4. Infer appropriate dialogues (from AIF rules)
    properties.appropriateDialogues = await inferDialogueTypes(
      properties.ancestorChain,
      scheme.materialRelation,
      scheme.reasoningType
    );
    
    // 5. Determine scheme family
    properties.schemeFamily = await getSchemeFamily(scheme.clusterTag, properties.ancestorChain);
    
    return properties;
  }
  
  /**
   * Check if scheme A is a subtype of scheme B
   */
  async isSubtypeOf(schemeA: string, schemeB: string): Promise<boolean> {
    const ancestorChain = await getAncestorChain(schemeA);
    return ancestorChain.some(ancestor => ancestor.id === schemeB);
  }
  
  /**
   * Find all schemes in the same cluster/family
   */
  async getSchemeSiblings(schemeId: string): Promise<ArgumentScheme[]> {
    const scheme = await prisma.argumentScheme.findUnique({
      where: { id: schemeId },
      select: { clusterTag: true, parentSchemeId: true }
    });
    
    if (!scheme) return [];
    
    // Find siblings: same parent OR same cluster tag
    return await prisma.argumentScheme.findMany({
      where: {
        OR: [
          { parentSchemeId: scheme.parentSchemeId, id: { not: schemeId } },
          { clusterTag: scheme.clusterTag, id: { not: schemeId } }
        ]
      }
    });
  }
  
  /**
   * Automatic scheme classification via ontological reasoning
   * Example: "fear appeal" → Negative Consequences → Practical Reasoning
   */
  async classifyUnknownScheme(
    schemeDescription: string,
    existingSchemeKeys: string[]
  ): Promise<{ parentSchemeId: string; confidence: number; reasoning: string }> {
    // Use LLM + AIF ontology rules to classify
    // 1. Embed scheme description
    // 2. Find nearest known scheme in embedding space
    // 3. Check if semantic match aligns with ontological rules
    // 4. Return parent scheme + confidence
    
    // Placeholder for now
    throw new Error("Not implemented - requires LLM integration");
  }
}
```

---

### 2.4 AIF Import/Export

```typescript
// lib/aif/aifExporter.ts

export async function exportSchemeToAIF(schemeId: string): Promise<string> {
  const scheme = await prisma.argumentScheme.findUnique({
    where: { id: schemeId },
    include: {
      premises: true,
      conclusion: true,
      cqs: true,
      parentScheme: true,
      childSchemes: true
    }
  });
  
  // Generate AIF-compliant RDF/XML
  const rdf = `
    <?xml version="1.0"?>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:aif="http://www.arg.dundee.ac.uk/aif#"
             xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
      
      <aif:ArgumentationScheme rdf:about="#${scheme.key}">
        <rdfs:label>${scheme.name}</rdfs:label>
        <aif:hasSummary>${scheme.summary}</aif:hasSummary>
        
        <!-- Taxonomy -->
        <aif:hasPurpose>${scheme.purpose}</aif:hasPurpose>
        <aif:hasMaterialRelation>${scheme.materialRelation}</aif:hasMaterialRelation>
        <aif:hasReasoningType>${scheme.reasoningType}</aif:hasReasoningType>
        
        <!-- Parent relationship -->
        ${scheme.parentScheme ? `
          <rdfs:subClassOf rdf:resource="#${scheme.parentScheme.key}" />
          <aif:inheritsCQs>${scheme.inheritCQs}</aif:inheritsCQs>
        ` : ''}
        
        <!-- Premises -->
        ${scheme.premises.map((p: any, i: number) => `
          <aif:hasPremise>
            <aif:Premise rdf:ID="premise_${i}">
              <aif:premiseType>${p.type}</aif:premiseType>
              <aif:premiseText>${escapeXML(p.text)}</aif:premiseText>
              <aif:hasVariables>${p.variables.join(', ')}</aif:hasVariables>
            </aif:Premise>
          </aif:hasPremise>
        `).join('')}
        
        <!-- Conclusion -->
        <aif:hasConclusion>
          <aif:Conclusion>
            <aif:conclusionText>${escapeXML(scheme.conclusion.text)}</aif:conclusionText>
            <aif:hasVariables>${scheme.conclusion.variables.join(', ')}</aif:hasVariables>
          </aif:Conclusion>
        </aif:hasConclusion>
        
        <!-- Critical Questions -->
        ${scheme.cqs.map((cq: any) => `
          <aif:hasCriticalQuestion>
            <aif:CriticalQuestion rdf:ID="cq_${cq.cqKey}">
              <rdfs:label>${cq.cqKey}</rdfs:label>
              <aif:questionText>${escapeXML(cq.text)}</aif:questionText>
              <aif:attackType>${cq.attackType}</aif:attackType>
              <aif:targetScope>${cq.targetScope}</aif:targetScope>
            </aif:CriticalQuestion>
          </aif:hasCriticalQuestion>
        `).join('')}
      </aif:ArgumentationScheme>
    </rdf:RDF>
  `;
  
  return rdf;
}

export async function importSchemeFromAIF(rdfXML: string): Promise<string> {
  // Parse RDF/XML
  // Extract scheme properties
  // Create ArgumentScheme in database
  // Return new scheme ID
  
  throw new Error("Not implemented - requires RDF parser");
}

export async function exportArgumentToAIF(argumentId: string): Promise<string> {
  // Export full argument with:
  // - I-nodes (premises, conclusion)
  // - RA-node (scheme application)
  // - CA-nodes (attacks/supports from CQs)
  
  throw new Error("Not implemented");
}
```

---

### 2.5 Integration with Invention System

**How AIF Enhances Invention:**

1. **Automatic Scheme Selection**
   ```typescript
   // Before (manual):
   const schemes = await findApplicableSchemes(claim);
   
   // After (AIF-enhanced):
   const schemes = await aifReasoner.inferApplicableSchemes(claim, {
     includeSubtypes: true,      // Auto-suggest child schemes
     inferFromSiblings: true,    // If SSA matches, check Neg Consequences
     useOntologyRules: true      // Apply AIF reasoning rules
   });
   ```

2. **CQ Inheritance**
   ```typescript
   // Automatically get parent + grandparent CQs
   const allCQs = await aifReasoner.inferSchemeProperties(schemeId);
   // No manual traversal needed
   ```

3. **Scheme Recommendation**
   ```typescript
   // "You're using Slippery Slope, but Negative Consequences might be stronger"
   const alternatives = await aifReasoner.getSchemeSiblings(currentSchemeId);
   ```

4. **Validation**
   ```typescript
   // Check if generated argument is well-formed per AIF
   const validation = await aifValidator.validateArgument(generatedArg);
   // Returns: missing premises, type mismatches, ontology violations
   ```

---

## Part 3: Implementation Roadmap

### Phase 8A: Knowledge Base Foundation (Week 1-2)

**Goal**: Establish KB infrastructure for invention

**Tasks**:
- [ ] Database schema: KnowledgeFact, GeneratedArgument, GeneratedArgumentFact models
- [ ] API endpoints: POST/GET /api/invention/knowledge
- [ ] Basic KB CRUD UI: components/invention/KnowledgeBaseManager.tsx
- [ ] Seed script: Populate KB with 100+ test facts
- [ ] Entity extraction utility (NLP): lib/nlp/entityExtraction.ts

**Deliverables**:
- Functional KB with facts/commitments
- UI to add/edit/tag facts
- Test data for invention experiments

**Estimated Effort**: 60-80 hours

---

### Phase 8B: Template Instantiation Engine (Week 3-4)

**Goal**: Core invention logic

**Tasks**:
- [ ] Scheme matcher: lib/argumentation/invention/schemeMatcher.ts
- [ ] Template instantiation: lib/argumentation/invention/templateInstantiation.ts
- [ ] Variable binding algorithm: findVariableBindings()
- [ ] Premise filling logic: fillPremiseTemplate()
- [ ] Confidence scoring: calculateInstantiationConfidence()
- [ ] Unit tests: 20+ test cases with different schemes

**Deliverables**:
- Working template instantiation for 5 schemes (Expert Opinion, PR, Consequences, Analogy, Authority)
- API endpoint: POST /api/invention/instantiate
- Test suite with 80%+ coverage

**Estimated Effort**: 80-100 hours

---

### Phase 8C: Argument Generation Pipeline (Week 5-6)

**Goal**: End-to-end generation

**Tasks**:
- [ ] Claim analysis: analyzeClaim()
- [ ] Scheme applicability scoring: calculateApplicabilityScore()
- [ ] Generation pipeline: generateArgumentsForClaim()
- [ ] Argument scoring: scoreGeneratedArguments()
- [ ] Diversity bonus algorithm
- [ ] API endpoint: POST /api/invention/generate
- [ ] Integration tests: Generate args for 10 real-world claims

**Deliverables**:
- Functional argument generator
- Confidence scores for generated arguments
- Ranking algorithm for multi-scheme generation

**Estimated Effort**: 60-80 hours

---

### Phase 8D: Invention UI (Week 7-8)

**Goal**: User-facing generation interface

**Tasks**:
- [ ] ArgumentGenerator.tsx: Main generation UI
- [ ] GeneratedArgumentCard.tsx: Display results
- [ ] ArgumentRefiner.tsx: Edit generated arguments
- [ ] KB browser integration: Select facts for generation
- [ ] Dialogue type selector
- [ ] Audience profile input (basic)
- [ ] "Accept" flow: Convert generated arg to real argument

**Deliverables**:
- Polished generation UI
- Refinement workflow
- Integration with existing argument creation flow

**Estimated Effort**: 60-80 hours

---

### Phase 8E: AIF Ontology Mapping (Week 9-10)

**Goal**: Formalize scheme ontology

**Tasks**:
- [ ] AIF schema design: Map ArgumentScheme to AIF classes
- [ ] Parent-child relationships in RDF
- [ ] CQ inheritance in AIF format
- [ ] Export: exportSchemeToAIF()
- [ ] RDF/XML generation
- [ ] Test: Export all 14 schemes to valid AIF
- [ ] Validation: Use AIF validator tool

**Deliverables**:
- AIF-compliant RDF export for all schemes
- Validated against AIF spec
- Documentation of ontology design

**Estimated Effort**: 40-60 hours

---

### Phase 8F: Ontological Reasoning Engine (Week 11-12)

**Goal**: Leverage AIF for automatic inference

**Tasks**:
- [ ] AIF_OntologyReasoner class
- [ ] inferSchemeProperties(): Full property inference
- [ ] isSubtypeOf(): Subtype checking
- [ ] getSchemeSiblings(): Family detection
- [ ] Integration with invention system
- [ ] Enhanced scheme matching with ontology
- [ ] CQ inheritance via ontology (replace manual traversal)
- [ ] Scheme recommendation based on siblings

**Deliverables**:
- Working ontology reasoner
- 50% improvement in scheme suggestion accuracy (measure against baseline)
- Automatic CQ inheritance without manual code

**Estimated Effort**: 60-80 hours

---

### Phase 8G: Testing & Refinement (Week 13)

**Goal**: Validate and optimize

**Tasks**:
- [ ] End-to-end tests: 20+ generation scenarios
- [ ] Performance optimization: <500ms generation time
- [ ] User testing: 5+ users try generation UI
- [ ] Bug fixes and edge cases
- [ ] Documentation: User guide for invention system
- [ ] API documentation

**Deliverables**:
- Production-ready invention system
- Comprehensive test suite
- User documentation

**Estimated Effort**: 40-60 hours

---

## Part 4: Success Metrics

### Quantitative Metrics

1. **Generation Success Rate**
   - Target: 70%+ of claims can generate at least 1 argument
   - Measure: Track successful vs. failed generations

2. **Confidence Accuracy**
   - Target: 80%+ correlation between system confidence and human ratings
   - Measure: User study with 50+ generated arguments

3. **CQ Coverage**
   - Target: 90%+ of generated arguments trigger all applicable CQs
   - Measure: Compare manual vs. automatic CQ detection

4. **Scheme Diversity**
   - Target: Average 2.5+ different schemes per claim
   - Measure: Track scheme distribution in generation results

5. **Ontology Completeness**
   - Target: 100% of schemes mapped to AIF ontology
   - Measure: AIF validator passes for all exports

### Qualitative Metrics

1. **Argument Quality**
   - Human evaluation: "Is this a reasonable argument?"
   - Target: 7/10 average rating

2. **Novelty**
   - "Did the system generate arguments you wouldn't have thought of?"
   - Target: 60%+ users say yes

3. **Usability**
   - SUS (System Usability Scale) score
   - Target: 75+ (good usability)

---

## Part 5: Technical Challenges

### Challenge 1: Variable Binding Complexity

**Problem**: Matching natural language claims to formal templates

**Example**:
```
Claim: "We should ban plastic straws"
Template: "If G is a goal, and A is an action that promotes G, then we ought to do A"
Binding: G = "environmental protection", A = "ban plastic straws"
```

**How to bind?** Need NLP + reasoning:
- Extract goal from claim (implicit: "protect environment")
- Identify action (explicit: "ban plastic straws")
- Verify action→goal relationship (requires domain knowledge)

**Solutions**:
1. **Pattern-based extraction**: Regex + spaCy NER
2. **LLM-based extraction**: GPT-4 API for complex bindings
3. **User-assisted binding**: Show candidate bindings, let user confirm
4. **Hybrid approach**: Auto-bind easy cases, ask user for hard cases

---

### Challenge 2: Knowledge Base Quality

**Problem**: Generated arguments are only as good as the KB

**Example**:
```
Bad KB: "Climate change is a hoax" (misinformation)
→ Generates bad argument

Good KB: "97% of climate scientists agree on human-caused warming" (reliable)
→ Generates strong argument
```

**Solutions**:
1. **Source credibility scoring**: Track fact sources, weight by reliability
2. **Fact verification**: Integration with fact-checking APIs
3. **Community curation**: Upvote/downvote facts (like Stack Overflow)
4. **Expert review**: Flagging system for disputed facts

---

### Challenge 3: Ontology Maintenance

**Problem**: Keeping AIF mappings in sync with database changes

**Risk**: Update scheme in DB, forget to update AIF export → inconsistency

**Solutions**:
1. **Automated tests**: CI/CD checks AIF export validity
2. **Schema hooks**: Trigger AIF re-generation on scheme updates
3. **Versioning**: Track AIF ontology versions, migrate on breaking changes
4. **Documentation**: Clear guide for adding new schemes with AIF

---

### Challenge 4: Natural Language Generation

**Problem**: Filling templates produces awkward text

**Example**:
```
Template: "Source E is an expert in subject domain S"
Filled: "Dr. Smith is an expert in subject domain climate science"
Better: "Dr. Smith is a climate science expert"
```

**Solutions**:
1. **Post-processing**: Grammar rules to simplify text
2. **LLM paraphrasing**: GPT-4 API to rephrase premises
3. **Multiple templates**: Store 3+ variations per premise
4. **User editing**: Always allow manual premise editing

---

## Part 6: Research Implications

### Publication Opportunities

1. **"Automated Argument Invention via Scheme Template Instantiation"**
   - Venue: COMMA (Computational Models of Argument)
   - Contribution: Novel integration of AIF ontology + KB reasoning for generation

2. **"AIF-Compliant Argumentation Scheme Ontology for Web-Based Deliberation"**
   - Venue: Semantic Web Journal
   - Contribution: Complete AIF mapping of Macagno taxonomy

3. **"Evaluating Generated Arguments: A User Study of Scheme-Based Invention"**
   - Venue: CHI (Human-Computer Interaction)
   - Contribution: First large-scale study of user perception of auto-generated arguments

### Theoretical Advances

- **Formalized Template Instantiation**: Precise algorithm for variable binding
- **Ontology-Enhanced Inference**: Show quantitative improvement from AIF reasoning
- **Argumentation-as-a-Service**: API-first invention system for integration

---

## Part 7: Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Variable binding fails frequently** | High - system unusable | Medium | Implement user-assisted mode, fallback to manual |
| **Generated arguments are low quality** | High - users don't trust system | Medium | Set high confidence thresholds, show scoring breakdown |
| **KB insufficient for domain** | Medium - limited generation | High | Support multiple KB sources, user KB contributions |
| **AIF export invalid** | Low - doesn't break core features | Low | Automated validation tests, AIF community review |
| **Performance too slow (>3s generation)** | Medium - poor UX | Medium | Caching, async generation, progress indicators |
| **Ontology too complex to maintain** | Medium - technical debt | Low | Automated tools, clear documentation, versioning |

---

## Part 8: Next Steps (Immediate Actions)

### This Week

1. **Review & Approval** (2 hours)
   - Review this planning doc
   - Prioritize Phase 8A-8G
   - Decide on timeline (12 weeks? 16 weeks?)

2. **Technical Spike** (8 hours)
   - Prototype variable binding with spaCy
   - Test LLM API for complex bindings
   - Evaluate RDF libraries for AIF export

3. **Database Design** (4 hours)
   - Finalize KnowledgeFact schema
   - Decide on fact versioning strategy
   - Design FK constraints for generated args

### Next Week

4. **Phase 8A Kickoff** (Full week)
   - Implement KnowledgeFact model
   - Build basic KB CRUD API
   - Start KB Manager UI
   - Seed 100 test facts

---

## Conclusion

Phase 8 represents a **major leap forward** in computational argumentation. By implementing:
- **Argument Invention**: Automated generation from templates + KB
- **AIF Ontology**: Formal semantic foundation for reasoning

We achieve:
- **Research-level rigor**: Publication-quality implementation
- **Unique capabilities**: Few systems support automatic generation
- **Theoretical foundation**: AIF compliance enables future extensions

**Timeline**: 12-13 weeks (3 months)  
**Effort**: ~400-520 hours total  
**Outcome**: World-class argumentation invention system

---

**Status**: Ready for Review & Kickoff  
**Author**: AI Architecture Planning  
**Next Milestone**: Phase 8A Database Foundation (Week 1-2)
