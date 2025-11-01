# Phase 8 Quick Reference Guide
## Argument Invention & AIF Ontology Integration

**Purpose**: One-page overview for rapid context switching

---

## 🎯 What Are We Building?

**Two Major Systems:**

1. **Argument Invention (Forward Chaining)**
   - **Input**: Claim ("We should ban X") + Knowledge Base (facts, evidence)
   - **Process**: Match claim → Find schemes → Fill templates → Score arguments
   - **Output**: 3-5 generated arguments with confidence scores
   - **Example**: Claim: "Ban plastic straws" → Generates PR argument with environmental premises

2. **AIF Ontology Integration**
   - **What**: Map schemes to W3C Argument Interchange Format (RDF/OWL)
   - **Why**: Enable automatic inference (CQ inheritance, subtype reasoning, validation)
   - **Output**: RDF/XML export of schemes, ontological reasoner for scheme properties
   - **Example**: System knows Slippery Slope ⊆ Neg Consequences ⊆ PR (auto-inherits CQs)

---

## 📊 System Architecture (One Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                      INVENTION PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CLAIM ANALYSIS                                              │
│     "Ban plastic straws"                                        │
│     → Extract: action="ban", target="plastic straws"           │
│     → Classify: type="action", modality="ought"                │
│                                                                  │
│  2. SCHEME MATCHING (via AIF Ontology)                         │
│     Query: conclusionType="ought" + purpose="action"           │
│     → Practical Reasoning (score: 0.9)                         │
│     → Negative Consequences (score: 0.8)                       │
│     → Value-Based PR (score: 0.7)                              │
│                                                                  │
│  3. KNOWLEDGE BASE QUERY                                        │
│     Find facts about: "plastic straws" + "environment"         │
│     → "Plastic straws harm marine life" (confidence: 0.95)     │
│     → "Single-use plastics pollute oceans" (confidence: 0.90)  │
│                                                                  │
│  4. TEMPLATE INSTANTIATION                                      │
│     Practical Reasoning template:                              │
│       P1: G is a goal                                          │
│       P2: A is an action that promotes G                       │
│       C: Therefore, we ought to do A                           │
│     Bind: G="protect marine life", A="ban plastic straws"     │
│                                                                  │
│  5. CONFIDENCE SCORING                                          │
│     - Scheme match: 0.9                                        │
│     - KB fact strength: 0.95                                   │
│     - Variable binding quality: 0.8                            │
│     → Final score: 0.9 × 0.95 × 0.8 = 0.68                    │
│                                                                  │
│  6. OUTPUT                                                      │
│     Generated Argument:                                         │
│       Scheme: Practical Reasoning                              │
│       Premises:                                                │
│         - "Protecting marine life is a goal"                   │
│         - "Banning plastic straws promotes protecting marine life"│
│       Conclusion: "We ought to ban plastic straws"            │
│       Confidence: 0.68 (Moderate)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Key Database Models

### KnowledgeFact
```typescript
{
  id: string;
  text: string;                    // "Plastic straws harm marine life"
  factType: "empirical" | "definitional" | "normative" | "testimony";
  confidence: 0.0-1.0;
  source?: string;                 // URL or citation
  entities: string[];              // ["plastic straws", "marine life"]
  topics: string[];                // ["environment", "pollution"]
}
```

### GeneratedArgument
```typescript
{
  id: string;
  claimText: string;               // Original claim
  schemeId: string;                // Which scheme used
  premises: Array<{                // Filled premises
    id: "P1" | "P2" | ...,
    text: string,                  // Natural language
    sourceFactId?: string          // Link to KB fact
  }>;
  conclusion: { text: string };
  confidence: 0.0-1.0;
  finalScore: 0.0-1.0;             // After all scoring factors
  wasAccepted: boolean;            // Did user use it?
}
```

---

## 🔧 Core Algorithms (Pseudocode)

### 1. Scheme Matching
```typescript
function findApplicableSchemes(claim: string) {
  // Parse claim
  const analysis = analyzeClaim(claim);
  // → { claimType: "action", modality: "ought", entities: [...] }
  
  // Query database
  const schemes = await db.schemes.findMany({
    where: {
      conclusionType: analysis.modality,
      purpose: analysis.claimType
    }
  });
  
  // Score each scheme
  return schemes.map(s => ({
    scheme: s,
    score: calculateApplicability(s, analysis)
  }))
  .filter(s => s.score >= 0.3)
  .sort((a, b) => b.score - a.score);
}
```

### 2. Variable Binding
```typescript
function bindVariables(template, claim, knowledgeBase) {
  // Extract variables from template
  const vars = extractVars(template.premises);
  // → ["G", "A"] for Practical Reasoning
  
  // Try to map claim entities to variables
  const bindings = new Map();
  
  for (const variable of vars) {
    const role = inferRole(variable);  // G → "goal", A → "action"
    const value = findInClaim(claim, role) 
               || findInKB(knowledgeBase, role);
    
    if (value) {
      bindings.set(variable, value);
    }
  }
  
  return bindings;
}
```

### 3. Premise Instantiation
```typescript
function fillPremises(template, bindings) {
  return template.premises.map(premise => {
    let text = premise.text;
    
    // Replace variables: "G is a goal" → "Protecting marine life is a goal"
    for (const [variable, value] of bindings) {
      text = text.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
    }
    
    return { ...premise, text };
  });
}
```

### 4. Confidence Calculation
```typescript
function calculateConfidence(generatedArg, kb) {
  let score = generatedArg.schemeMatchScore;  // Base: how well scheme fits
  
  // Factor 1: Premise strength
  for (const premise of generatedArg.premises) {
    if (premise.sourceFactId) {
      const fact = kb.getFact(premise.sourceFactId);
      score *= fact.confidence;
    } else {
      score *= 0.7;  // Penalty for unsupported premise
    }
  }
  
  // Factor 2: Variable binding quality
  const bindingQuality = assessBindingQuality(generatedArg.bindings);
  score *= bindingQuality;
  
  return Math.min(score, 1.0);
}
```

---

## 🌐 AIF Ontology Mapping

### RDF/Turtle Example
```turtle
# Practical Reasoning Family

:PracticalReasoning a aif:ArgumentationScheme ;
  rdfs:label "Practical Reasoning" ;
  aif:hasPurpose :Action ;
  aif:hasMaterialRelation :Practical ;
  aif:hasCriticalQuestion :CQ_Alternatives, :CQ_Feasible .

:SlipperySlopeArgument a aif:ArgumentationScheme ;
  rdfs:subClassOf :NegativeConsequences ;
  rdfs:subClassOf :PracticalReasoning ;  # Multiple inheritance
  aif:inheritsCQs true ;
  aif:addsCriticalQuestion :CQ_ChainStrength .
```

### Ontological Inference
```typescript
// Automatic property inference via ontology

const reasoner = new AIF_OntologyReasoner();

// Query: What are ALL CQs for Slippery Slope?
const allCQs = await reasoner.inferSchemeProperties("slippery_slope");
// → Returns: Own CQs + Neg Consequences CQs + Practical Reasoning CQs
// → 18 total CQs (without manual traversal!)

// Query: Is Slippery Slope a type of Practical Reasoning?
const isSubtype = await reasoner.isSubtypeOf("slippery_slope", "practical_reasoning");
// → true (via transitive closure)
```

---

## 📁 File Structure

```
lib/
  argumentation/
    invention/
      schemeMatcher.ts         # Find applicable schemes
      templateInstantiation.ts # Fill templates with KB
      argumentGeneration.ts    # Full pipeline
      knowledgeBase.ts         # KB queries
    
  aif/
    ontologyReasoner.ts        # AIF-based inference
    aifExporter.ts             # RDF/XML export
    aifImporter.ts             # RDF/XML import
    aifValidator.ts            # Check AIF compliance

app/
  api/
    invention/
      generate/route.ts        # POST: Generate arguments
      knowledge/route.ts       # CRUD: Knowledge base
      evaluate/route.ts        # POST: Evaluate generated arg
    
    aif/
      export/[schemeId]/route.ts  # GET: Export scheme as RDF
      import/route.ts             # POST: Import RDF scheme

components/
  invention/
    ArgumentGenerator.tsx      # Main generation UI
    GeneratedArgumentCard.tsx  # Display result
    ArgumentRefiner.tsx        # Edit generated arg
    KnowledgeBaseManager.tsx   # KB CRUD UI
```

---

## 🧪 Testing Strategy

### Unit Tests
- Variable binding: 20+ cases (simple → complex)
- Premise filling: All 14 schemes
- Confidence scoring: Edge cases (no KB, partial KB, full KB)
- AIF export: Validate RDF/XML for all schemes

### Integration Tests
- End-to-end generation: 10 real-world claims
- KB query performance: <100ms for 10K facts
- Ontology reasoning: Subtype chains 3+ levels deep

### User Testing
- 5 users generate 10 arguments each
- Measure: Success rate, confidence accuracy, perceived quality
- Target: 70% success, 7/10 quality rating

---

## 📈 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Generation Success Rate** | 70% | % of claims that generate ≥1 argument |
| **Confidence Accuracy** | 80% | Correlation: system score vs. human rating |
| **Scheme Diversity** | 2.5 avg | Avg # of different schemes per claim |
| **CQ Coverage** | 90% | % of applicable CQs triggered |
| **AIF Compliance** | 100% | % of exports passing AIF validator |
| **Performance** | <500ms | Time to generate 3 arguments |

---

## ⚠️ Common Pitfalls

1. **Variable Binding Fails**
   - **Problem**: Can't map "ban plastic straws" to "A is an action"
   - **Solution**: Fallback to user-assisted binding

2. **KB Insufficient**
   - **Problem**: No facts about topic → can't fill premises
   - **Solution**: Support multiple KB sources, user contributions

3. **Generated Text Awkward**
   - **Problem**: "Dr. Smith is an expert in subject domain climate science"
   - **Solution**: LLM post-processing or template variations

4. **Ontology Drift**
   - **Problem**: DB scheme updated, AIF export outdated
   - **Solution**: Automated tests + schema hooks

5. **Slow Performance**
   - **Problem**: Generating takes 5+ seconds
   - **Solution**: Cache schemes, async generation, progress UI

---

## 🚀 Quick Start (When Ready)

### Phase 8A Kickoff (Week 1)
```bash
# 1. Create KB models
npx prisma db push

# 2. Seed test data
npx tsx scripts/seed-knowledge-base.ts

# 3. Start dev server
npm run dev

# 4. Test KB API
curl -X POST http://localhost:3002/api/invention/knowledge \
  -H "Content-Type: application/json" \
  -d '{"text": "Plastic straws harm marine life", "factType": "empirical", "confidence": 0.95}'
```

### Phase 8B Kickoff (Week 3)
```bash
# Test template instantiation
npx tsx scripts/test-template-instantiation.ts

# Expected output:
# ✅ Practical Reasoning: 0.85 confidence
# ✅ Negative Consequences: 0.78 confidence
# ❌ Expert Opinion: Cannot instantiate (no expert entity)
```

---

## 🔗 Key References

- **Macagno & Walton (2014)**: Section 11.1 (Invention), Section 10 (AIF)
- **AIF Ontology Spec**: http://www.arg.dundee.ac.uk/aif/
- **IBM Watson Debater**: https://research.ibm.com/artificial-intelligence/project-debater/
- **Phase 8 Planning Doc**: `PHASE_8_PLANNING.md` (full details)

---

**Last Updated**: January 2025  
**Status**: Planning Phase  
**Next Milestone**: Phase 8A Database Foundation

---

## Quick Context Reminder

**What We Just Finished (Phase 6D):**
- ✅ Scheme hierarchy UI (parent-child relationships)
- ✅ Cluster families visualization
- ✅ CQ inheritance working

**What We're Building Next (Phase 8):**
- 🔄 Argument invention (auto-generate from claims)
- 🔄 AIF ontology (formal semantic foundation)

**Why Skip Phase 7 (Dialogue)?**
- Phase 8 provides more theoretical value
- AIF ontology can handle dialogue appropriateness
- Dialogue can be added later as enhancement

**Timeline**: 12-13 weeks for full Phase 8 implementation
