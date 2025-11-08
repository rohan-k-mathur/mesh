# Argumentation Schemes: History, Classifications, and Computational Applications
## Detailed Review Document - Part 4

**Document**: Macagno, Walton & Reed (2017)  
**Review Focus**: Section 7 - Nets of Argumentation Schemes; Section 8 - Using Schemes in AI and Law  
**Part**: 4 of series (Sections 7-8)

---

## Section 7: Using Argumentation Schemes: Nets of Argumentation Schemes

### Overview

Section 7 presents the **most critical insight for practical implementation**: argumentation schemes do not appear in isolation but form **nets** - interconnected structures where multiple schemes work together to construct complex arguments. A single scheme captures only "one passage of reasoning," while nets map complete "argumentative strategies" involving distinct, interdependent steps.

**Central Thesis**:
> "Argumentation schemes are imperfect bridges between the logical (or quasi-logical) level and the conceptual one... A single argumentation scheme cannot capture the complexity of such real argumentation. For this reason, we need to conceive the relationship between arguments and schemes in a modular way, in terms of nets of schemes."

**Key Insight**: Real arguments require **multiple conceptual passages**:
- Classify a state of affairs (argument from classification)
- Evaluate it positively/negatively (argument from values)
- Suggest a suitable course of action (practical reasoning)
- Which can lead to further steps (commitment, consequences)

Each passage = one scheme. Complete argument = net of interdependent schemes.

**Profound Implication for Mesh**: The current Argument model assumes **single scheme** per argument (`schemeId: string`). Section 7 demonstrates this is architecturally insufficient - arguments are **compositions of multiple schemes**, with some explicit, some presupposed, some implied.

---

### 7.1 The Theoretical Foundation: Bridging Logic and Concepts

**Opening Framework**:
> "Argumentation schemes are imperfect bridges between the logical (or quasi-logical) level and the conceptual one."

**Two Levels of Analysis**:

**7.1.1 Logical/Quasi-Logical Level**
- Formal inference rules (MP, MT, abduction, induction)
- Deductive validity, inductive strength, defeasibility
- Represented in `reasoningType` and `ruleForm` fields

**7.1.2 Conceptual/Material Level**
- Semantic connections (cause, definition, authority, precedent)
- Domain-specific content and meaning
- Represented in `materialRelation` field

**The Gap**: "There is a crucial gap between the complexity of natural argumentation, characterized by several conceptual passages leading to a conclusion, and the schemes."

**Why Gap Exists**:
- Schemes represent **single inferential step** (premise type → conclusion type)
- Real arguments involve **multiple steps** (classification → evaluation → action)
- Natural language compresses steps (implicit premises, presupposed warrants)

**Solution**: Conceive schemes **modularly** - building blocks that combine into nets.

**Mesh Connection**: Our two-dimensional architecture (material + logical) correctly captures the bridge function, but we need to model **nets** not just individual schemes.

---

### 7.2 Example 7.1: The Hague Speech (Russia-Ukraine Conflict)

**Context**: British Foreign Secretary William Hague commenting on Russia's intervention in Crimea (2014).

**Text**:
> "Be in no doubt, there will be consequences. The world cannot say it is OK to violate the sovereignty of other nations. This clearly is a violation of the sovereignty independence and territorial integrity of Ukraine. If Russia continues on this course we have to be clear this is not an acceptable way to conduct international relations."

**Surface Analysis**: "Apparently an easy case of argument from consequences" - Russia's actions → undesirable consequences.

**Deep Analysis** (Figure 9): The argument is a **net of three interconnected schemes**:

**7.2.1 Scheme 1: Argument from Verbal Classification**
- **Explicit**: "This clearly is a violation of the sovereignty independence and territorial integrity of Ukraine."
- **Implicit premise** (dotted box): "A hostile military intervention in another country is a violation of its sovereignty."
- **Fact premise**: "Russia intervened militarily in Crimea and annexed it."
- **Function**: Classifies the action (military intervention → sovereignty violation)

**7.2.2 Scheme 2: Argument from Commitment**
- **Explicit**: "The world cannot say it is OK to violate the sovereignty of other nations."
- **Implicit**: Links world's commitment to value of "protecting nations' sovereignty"
- **Function**: Establishes that world is committed to opposing sovereignty violations
- **Depends on**: Classification from Scheme 1 (must be sovereignty violation to trigger commitment)

**7.2.3 Scheme 3: Argument from Consequences**
- **Explicit**: "Be in no doubt, there will be consequences."
- **Explicit**: "If Russia continues on this course we have to be clear this is not an acceptable way to conduct international relations."
- **Implicit premise** (dotted box): "Undesirable consequences should be avoided."
- **Implicit conclusion** (dotted box): "Russia should not continue on this course."
- **Function**: Practical conclusion based on negative consequences
- **Depends on**: Commitment from Scheme 2 (world's commitment → consequences)

**Interconnections** (key insight):
> "The classification, the reasoning from commitment, and the argument from consequences are deeply interconnected. The alleged world's commitment to consequences against Russia depends on the classification of the state of affairs."

**Dependency Chain**:
```
Classification (Scheme 1)
    ↓ enables
Commitment (Scheme 2) [classification fits value of sovereignty]
    ↓ enables
Consequences (Scheme 3) [commitment → threat/consequences]
    ↓ produces
Implicit Practical Conclusion [Russia should not continue]
```

**Critical Observation**: The "consequences" (Scheme 3) are only credible if:
1. The action is classified as sovereignty violation (Scheme 1)
2. The world is committed to opposing such violations (Scheme 2)
3. That commitment translates to action (implicit threat)

Remove any scheme → the net collapses.

**Mesh Implication**: When user analyzes this argument in Mesh:
- Current model: Choose ONE scheme (consequences? classification? commitment?)
- Correct model: Argument instantiates NET of three schemes with dependency structure
- UI should show: Argument graph with scheme labels on each node/edge

---

### 7.3 Example 7.2: The Global Escalation (Russian Response)

**Context**: Russian defense analysts responding to U.S. military aid to Ukraine (2015).

**Text**:
> "U.S. provision of military aid to Ukraine would be seen by Moscow as a declaration of war and spark a global escalation of Ukraine's separatist conflict, Russian defense analysts said."

**Surface Analysis**: "Apparently" a slippery slope argument (U.S. aid → chain of escalation → global conflict).

**Deep Analysis** (Figure 10): The argument is a **net of four interconnected schemes**:

**7.3.1 Scheme 1: Argument from Verbal Classification**
- **Explicit**: "U.S. provision of military aid to Ukraine would be seen by Moscow as a declaration of war."
- **Implicit premise** (dotted box): U.S. intends to provide military aid
- **Function**: Classifies the action (military aid → declaration of war)
- **Note**: Classification is from Russian perspective ("seen by Moscow")

**7.3.2 Scheme 2: Argument from Values (Russia's Perspective)**
- **Implicit**: "A declaration of war is unacceptable by Russia."
- **Implicit**: "Russia is going not to accept a tacit declaration of war."
- **Function**: Establishes Russia values preventing/responding to declarations of war
- **Depends on**: Classification from Scheme 1

**7.3.3 Scheme 3: Slippery Slope**
- **Explicit**: "Moscow will react and there will be a global escalation of Ukraine's separatist conflict."
- **Function**: Chain of consequences (Russian reaction → escalation → global conflict)
- **Depends on**: Values from Scheme 2 (Russia will react because values at stake)

**7.3.4 Scheme 4: Argument from Values (Western Perspective)**
- **Implicit**: "Military actions affecting other countries are dangerous."
- **Implicit**: "An escalation will affect also the U.S. and the Western countries."
- **Explicit conclusion** (dotted box): "The escalation is dangerous (Values) and should be avoided (Slippery slope)."
- **Function**: Evaluates endpoint of slippery slope as negative for U.S.
- **Depends on**: Slippery slope from Scheme 3

**Interconnections**:
> "The classification justifies the slippery slope, whose force partially depends on the fact that the escalation is claimed to be global, affecting also other countries. The evaluation of this consequence therefore combines with the chain of events claimed by the analysts, and leads to the practical conclusion of avoiding the provision of military aid."

**Dependency Chain**:
```
Classification (Scheme 1) [military aid = declaration of war]
    ↓ triggers
Values (Scheme 2) [Russia rejects declarations of war]
    ↓ predicts
Slippery Slope (Scheme 3) [Russian reaction → escalation chain]
    ↓ evaluated by
Values (Scheme 4) [global escalation is dangerous to U.S.]
    ↓ produces
Implicit Practical Conclusion [U.S. should not provide aid]
```

**Note the Complexity**: This net uses:
- Same scheme type twice (Argument from Values - Russian and Western perspectives)
- Different agents' perspectives (Russia vs. U.S./Western)
- Causal chains embedded in slippery slope
- Multiple implicit premises and conclusions

**Special Feature - Compressed Presentation**:
> "A special feature of this example is its compressed style of presentation. Slippery slope is a complex form of argument built around a connected sequence of actions and consequences starting from an initial action or policy and then proceeding through a sequence to an eventual outcome. However in many examples, the intervening sequence is left implicit."

**Analytical Challenge**: "Concealing a chain of intervening propositions that have to be filled in as implicit assumptions of the argument."

**Solution**: "By using an argument map that reveals the network of argumentation into which the given slippery slope argument fits, the puzzle of unraveling the network of argumentation using a cluster can be solved."

**Mesh Implication**: 
1. **Argument reconstruction** requires identifying implicit premises/conclusions
2. **Scheme identification** requires recognizing compressed/elliptical arguments
3. **Argument mapping** requires visualizing nets, not single schemes
4. **Common knowledge** fills gaps (military interventions → escalation patterns)

---

### 7.4 The Key Principle: Schemes Appear in Nets, Not Isolation

**Concluding Statement**:
> "On the perspective presented in this section, we notice that argumentation schemes appear in nets instead of in clear and independent occurrences. A scheme can capture only one passage of reasoning, while the nets can map a more complex argumentative strategy, involving distinct and interdependent steps."

**Three Key Terms**:

**7.4.1 "Passage of Reasoning"**
- Single inferential step from premise-type to conclusion-type
- One material relation + one logical form
- Example: "Russia's action is classified as sovereignty violation" (single passage)

**7.4.2 "Argumentative Strategy"**
- Complete rhetorical/dialectical move accomplishing speaker's goal
- Multiple passages working together toward ultimate conclusion
- Example: Hague's strategy is to threaten consequences, not merely classify actions

**7.4.3 "Distinct and Interdependent Steps"**
- **Distinct**: Each scheme has own premises, conclusion, CQs
- **Interdependent**: One scheme's conclusion is another's premise
- Example: Classification enables commitment, commitment enables consequences

**Critical Distinction**:
- **Scheme** (singular) = formal template for one inferential step
- **Net** (plural) = multiple schemes in dependency structure forming strategy

**Mesh Architecture Requirement**: Need to model:
1. **Individual schemes** (ArgumentScheme model - exists)
2. **Scheme instantiations** (Argument model - exists, but single scheme)
3. **Nets of instantiations** (ArgumentNet or ArgumentGraph model - **missing**)
4. **Dependencies between instantiations** (ArgumentDependency - **missing**)

---

### 7.5 Types of Interdependencies in Nets

Based on examples, schemes in nets relate through:

**7.5.1 Premise-Conclusion Dependency**
- One scheme's conclusion becomes another scheme's premise
- Example: Classification conclusion → Commitment premise
- Most common type in examples

**7.5.2 Presuppositional Dependency**
- One scheme presupposes another's holding
- Example: Consequences presuppose commitment to values
- Often implicit in text

**7.5.3 Support Dependency**
- One scheme provides evidential support for another
- Example: Classification supports commitment claim
- Can be explicit or implicit

**7.5.4 Justificational Dependency**
- One scheme justifies applicability of another
- Example: Values justify slippery slope's normative force
- Enables scheme to function effectively

**7.5.5 Sequential Dependency**
- Schemes must be applied in order
- Example: Must classify before can evaluate, before can prescribe action
- Reflects cognitive/argumentative structure

**Mesh Implementation**: ArgumentDependency table:
```typescript
model ArgumentDependency {
  id              String @id
  sourceArgId     String // Argument that depends
  targetArgId     String // Argument depended upon
  dependencyType  String // "premise_conclusion" | "presuppositional" | "support" | "justificational" | "sequential"
  isExplicit      Boolean // Stated in text vs. reconstructed
  order           Int? // For sequential dependencies
}
```

---

### 7.6 Explicit vs. Implicit Schemes in Nets

**Critical Observation** from figures: Dotted boxes represent "tacit premises and the tacit ultimate conclusion, which are taken for granted by the speaker but are needed for reconstructing his reasoning."

**Three Levels of Explicitness**:

**7.6.1 Explicit**
- Directly stated in text
- Example: "Be in no doubt, there will be consequences"
- Easy to identify

**7.6.2 Presupposed**
- Taken for granted by speaker
- Necessary for argument to work
- Example: "Undesirable consequences should be avoided"
- Requires reconstruction

**7.6.3 Simply Implied**
- Recoverable from context/common knowledge
- Example: "Russia should not continue on this course"
- Often the ultimate conclusion

**Analytical Requirement**: "Needed for reconstructing his reasoning."

**Mesh Implication**: Argument model should track explicitness:
```typescript
model Argument {
  // Existing fields...
  
  explicitness: "explicit" | "presupposed" | "implied"
  textEvidence?: string // Quote if explicit
  justification?: string // Why reconstructed if not explicit
}
```

**UI Consideration**: In argument visualization:
- **Solid boxes/borders**: Explicit schemes
- **Dashed boxes/borders**: Presupposed schemes  
- **Dotted boxes/borders**: Implied schemes

Helps users see what speaker stated vs. what analyst reconstructed.

---

### 7.7 The Role of Common Knowledge in Net Reconstruction

**Key Insight**: 
> "These intervening links are basically filled in by common knowledge concerning the normal way we expect military interventions to take place and to have consequences."

**Common Knowledge Types**:

**7.7.1 Domain Knowledge**
- International relations: military interventions → reactions
- Legal domain: violations → sanctions
- Scientific domain: causes → effects

**7.7.2 Normative Knowledge**
- Shared values: sovereignty should be protected
- Shared norms: declarations of war are serious
- Shared principles: escalation is dangerous

**7.7.3 Causal Knowledge**
- Typical causal chains in domain
- Expected consequences of actions
- Predictable patterns of behavior

**7.7.4 Pragmatic Knowledge**
- Speaker's likely intentions
- Discourse conventions
- Rhetorical strategies

**Mesh Application**: When reconstructing arguments, system could:
1. **Flag missing links**: "This argument jumps from classification to action - value premise needed?"
2. **Suggest premises**: "Arguments from consequences typically presuppose 'bad consequences should be avoided'"
3. **Provide templates**: Common knowledge for domain (e.g., policy arguments, legal arguments)

Consider knowledge base:
```typescript
model CommonKnowledgePattern {
  id String @id
  domain String // "international_relations" | "legal" | "scientific" | ...
  fromScheme String // Scheme ID
  toScheme String // Scheme ID
  typicalLinks String[] // Common intermediate premises
  description String
}
```

---

### 7.8 Solving the "Puzzle of Unraveling" with Argument Maps

**The Puzzle**:
> "The puzzle of unraveling the network of argumentation using a cluster can be solved in any given case of argument interpretation."

**Solution Method**: "By using an argument map that reveals the network of argumentation."

**What Argument Maps Reveal**:

**7.8.1 Complete Structure**
- All schemes involved (explicit + implicit)
- Dependencies between schemes
- Implicit premises and conclusions

**7.8.2 Dependency Patterns**
- Which scheme enables which
- Linear chains vs. convergent support
- Presuppositional foundations

**7.8.3 Cluster Usage**
- Which scheme families are active
- Example: decision-making cluster (classification + values + consequences + practical reasoning)

**7.8.4 Strategic Function**
- What is speaker trying to accomplish
- How schemes work together toward goal
- Rhetorical effectiveness

**Mesh Implementation**: Argument visualization should show:
- **Nodes**: Individual scheme instantiations (Arguments)
- **Edges**: Dependencies with types
- **Styling**: Explicit (solid) vs. implicit (dashed) vs. implied (dotted)
- **Annotations**: Premises, conclusions, warrants
- **Clusters**: Visual grouping by scheme family

Current Mesh has argument trees (claim → support arguments). Need **nets** (multiple interconnected schemes with varied dependency types).

---

### 7.9 Connection to Mesh Architecture

**Current State**:

```typescript
model Argument {
  id String @id
  claimId String
  schemeId String? // Single scheme
  // ...
}
```

**Problem**: Real arguments (per Section 7) instantiate **multiple schemes** in interdependent nets.

**Required Enhancements**:

**7.9.1 Multi-Scheme Support**

Option A: Multiple scheme references on Argument
```typescript
model Argument {
  id String @id
  claimId String
  schemes ArgumentSchemeInstance[]
  // ...
}

model ArgumentSchemeInstance {
  id String @id
  argumentId String
  schemeId String
  role String // "primary" | "supporting" | "presupposed" | "implied"
  explicitness String // "explicit" | "presupposed" | "implied"
  order Int
}
```

Option B: Argument becomes node in net, schemes are edges
```typescript
model ArgumentNet {
  id String @id
  claimId String
  nodes ArgumentNode[]
  edges ArgumentEdge[]
}

model ArgumentNode {
  id String @id
  netId String
  type String // "premise" | "conclusion" | "intermediate"
  content String
  explicit Boolean
}

model ArgumentEdge {
  id String @id
  netId String
  sourceNodeId String
  targetNodeId String
  schemeId String
  dependencyType String
}
```

**Recommendation**: Option B (net-based) aligns better with Section 7's theoretical framework.

**7.9.2 Dependency Tracking**

```typescript
model ArgumentDependency {
  id String @id
  sourceArgId String
  targetArgId String
  dependencyType String // Types from 7.5
  isExplicit Boolean
  justification String?
}
```

**7.9.3 Explicitness Tracking**

On Argument or ArgumentNode:
```typescript
explicitness: "explicit" | "presupposed" | "implied"
textEvidence?: string
reconstructionJustification?: string
```

**7.9.4 Common Knowledge Patterns**

```typescript
model SchemeNetPattern {
  id String @id
  name String
  description String
  domain String
  schemes String[] // Scheme IDs in typical order
  typicalDependencies Json // Structure of common links
  examples String[]
}
```

---

### 7.10 Critical Insights for Implementation

**7.10.1 Single Scheme Per Argument is Insufficient**

Section 7 definitively proves real arguments use **multiple schemes simultaneously**. Current architecture's single `schemeId` is a fundamental limitation.

**Impact on**:
- **Scheme selection UI**: Must allow multiple scheme selection
- **CQ generation**: Must compose CQs from all schemes in net
- **Attack construction**: Attacks target specific nodes/schemes in net
- **Argument evaluation**: Strength depends on weakest link in net

**7.10.2 Implicit Reconstruction is Central to Analysis**

Both examples required extensive reconstruction (dotted boxes in figures). System must:
- **Flag gaps**: "This jumps from classification to action - missing value premise?"
- **Suggest schemes**: "Arguments of this type typically include..."
- **Support reconstruction**: UI for adding presupposed/implied schemes
- **Document reasoning**: Why analyst added implicit elements

**7.10.3 Visualization is Essential, Not Optional**

Quote: "By using an argument map that reveals the network... the puzzle... can be solved."

Argument maps are not supplementary but **essential for understanding**. Without visualization, nets remain opaque.

**Mesh Requirements**:
- **Net visualization**: Graph view of interconnected schemes
- **Explicitness styling**: Visual distinction for explicit/presupposed/implied
- **Dependency types**: Different edge styles for different dependencies
- **Interactive exploration**: Click scheme → see dependencies, CQs, attacks

**7.10.4 Common Knowledge Must Be Accessible**

Experts can fill gaps "by common knowledge." System should:
- **Provide templates**: "In legal arguments, classification typically leads to..."
- **Suggest patterns**: "This looks like consequence argument - add value premise?"
- **Explain gaps**: "Slippery slopes typically include these intermediate steps..."

Knowledge base of common patterns enables novices to reconstruct like experts.

**7.10.5 Argumentative Strategy vs. Single Passage**

Design principle: Distinguish **tactical** (single scheme) from **strategic** (net) levels.

**Tactical UI** (current SchemeSpecificCQsModal):
- Focus on single scheme
- Its premises, conclusion, CQs
- Its formal structure

**Strategic UI** (needed):
- Focus on complete argument
- Multiple schemes and dependencies
- Overall argumentative goal
- Rhetorical effectiveness

Both levels necessary - tactics for precision, strategy for understanding.

---

### 7.11 Implications for SchemeSpecificCQsModal Redesign

**Current Limitation**: Modal assumes single scheme per argument.

**Section 7 Requirement**: Support nets of schemes.

**Design Implications**:

**7.11.1 Multi-Scheme Identification**

Don't ask: "What scheme does this argument use?"

Ask: "What schemes does this argument combine?"

UI flow:
```
1. Identify primary scheme (dominant inferential pattern)
2. Identify supporting schemes (enabling premises)
3. Identify presupposed schemes (implicit warrants)
4. Show net structure with dependencies
```

**7.11.2 Composed CQ Sets**

CQs should come from **all schemes in net**:
- Primary scheme's CQs
- Supporting schemes' CQs  
- Dependency-related CQs ("Does premise of scheme A actually follow from conclusion of scheme B?")

Example: Hague speech net
```
CQs from Classification:
- Is Russia's action really a sovereignty violation?
- What definition of sovereignty violation is used?

CQs from Commitment:
- Is the world actually committed to opposing violations?
- What evidence for this commitment?

CQs from Consequences:
- Will consequences actually occur?
- Are consequences actually undesirable to Russia?
- Are there alternative actions?

Dependency CQs:
- Does the classification actually trigger the commitment?
- Does the commitment actually lead to consequences?
```

**7.11.3 Net Visualization in Modal**

Don't just list CQs. Show:
```
[Diagram of net with schemes as nodes]
↓
Click scheme → see its CQs
Click dependency → see linking CQs
Click CQ → see which scheme it questions
```

**7.11.4 Targeting Specific Schemes in Net**

User constructing attack should choose:
- **Attack primary scheme**: Undermines main inference
- **Attack supporting scheme**: Removes enabling premise
- **Attack dependency**: Break link between schemes
- **Attack entire net**: Reject overall strategy

Different attack strategies have different effects.

---

### 7.12 Potential UI Components

**7.12.1 ArgumentNetBuilder**

Component for constructing/visualizing argument nets:
```typescript
<ArgumentNetBuilder
  claimId={claimId}
  onSchemeAdd={(scheme) => /* add node to net */}
  onDependencyAdd={(source, target, type) => /* add edge */}
  onExplicitnessToggle={(node, level) => /* mark explicit/implicit */}
  onNetComplete={(net) => /* save to database */}
/>
```

**7.12.2 NetSchemeSelector**

Enhanced scheme selector understanding nets:
```typescript
<NetSchemeSelector
  existingSchemes={currentNetSchemes}
  onSchemeSelect={(scheme, role) => /* add to net with role */}
  suggestedSchemes={/* based on existing schemes */}
  commonPatterns={/* typical nets for this domain */}
/>
```

**7.12.3 ComposedCQPanel**

CQ panel showing composed questions from net:
```typescript
<ComposedCQPanel
  net={argumentNet}
  groupBy="scheme" // or "attackType" or "dependency"
  onCQSelect={(cq, targetScheme) => /* construct attack */}
  showDependencyCQs={true}
/>
```

**7.12.4 NetVisualization**

Graph visualization of scheme net:
```typescript
<NetVisualization
  net={argumentNet}
  layout="hierarchical" // or "force-directed" or "circular"
  onNodeClick={(scheme) => /* show details */}
  onEdgeClick={(dependency) => /* show link details */}
  highlightPath={attackPath} // Show attack targeting
/>
```

---

### 7.13 Questions Raised

**Q1**: Should all arguments be modeled as nets, or only complex ones?
- Single-scheme arguments as degenerate case (net of size 1)?
- Or separate models for simple arguments vs. nets?

**Q2**: How to handle argument reconstruction in UI?
- Automatic suggestion of implicit schemes?
- Manual addition by expert analysts?
- Collaborative reconstruction?

**Q3**: What level of net detail is appropriate for different users?
- Novices: Just primary scheme?
- Intermediates: Primary + explicit supporting schemes?
- Experts: Full net with all implicit elements?

**Q4**: How to visualize very complex nets?
- Some arguments may have 10+ schemes
- Collapsible sub-nets?
- Hierarchical zoom levels?

**Q5**: Should common net patterns be pre-defined?
- "Classification → Values → Consequences" pattern
- "Authority → Commitment → Action" pattern
- Domain-specific patterns (legal, policy, scientific)?

**Q6**: How to represent same scheme type used multiple times?
- Example 7.2: Argument from Values appears twice (Russian and Western perspectives)
- Label nodes with agent perspective?
- Use scheme variants?

**Q7**: What's the relationship between ClaimArguments (support/attack tree) and ArgumentNets?
- Are they the same? Different views?
- Net = fine-grained scheme analysis of argument tree nodes?

---

### 7.14 Terminology Established

| Term | Definition | Significance |
|------|------------|-------------|
| **Net of Schemes** | Multiple interconnected schemes forming complete argumentative strategy | Real arguments are nets, not single scheme instantiations |
| **Passage of Reasoning** | Single inferential step from premise-type to conclusion-type captured by one scheme | Atomic unit of argumentation |
| **Argumentative Strategy** | Complete rhetorical/dialectical move accomplishing speaker's goal via net of schemes | Strategic level above tactical scheme application |
| **Interconnected** | Schemes in net depend on each other (premise-conclusion, presuppositional, support, etc.) | Dependencies make nets coherent wholes, not mere collections |
| **Interdependent** | Each scheme both distinct (own structure) and dependent (relies on others) | Captures both modularity and integration |
| **Explicit** | Scheme/premise/conclusion directly stated in text | Surface level of argument |
| **Presupposed** | Scheme/premise/conclusion taken for granted, necessary for reconstruction | Implicit level requiring analyst work |
| **Simply Implied** | Scheme/premise/conclusion recoverable from context/common knowledge | Often ultimate conclusion or connecting premise |
| **Compressed Presentation** | Natural language eliding intermediate steps in chain (esp. slippery slopes) | Analyst must "fill in" implicit links |
| **Common Knowledge** | Shared domain/normative/causal/pragmatic knowledge filling gaps in argumentation | Enables reconstruction of compressed arguments |
| **Argument Map** | Visual representation revealing network structure of schemes | Essential tool for "unraveling the puzzle" of complex arguments |
| **Dotted Boxes** | Visual notation (in paper's figures) for implicit/tacit elements | Distinguishes reconstructed from explicit elements |
| **Dependency Chain** | Sequential or presuppositional ordering of schemes in net | Shows how schemes enable each other |

---

### 7.15 Section Summary

Section 7 presents the **most practically important insight** in the entire paper: **argumentation schemes appear in nets, not isolation**. A single scheme captures "one passage of reasoning," while nets map complete "argumentative strategies" with distinct, interdependent steps.

**Core Discovery: Arguments Are Multi-Scheme Compositions**

Two detailed examples (Hague speech, Russian response) demonstrate:
1. **Real arguments instantiate multiple schemes** (3-4 schemes per example)
2. **Schemes form dependency structures** (classification enables commitment enables consequences)
3. **Many elements are implicit** (presupposed premises, implied conclusions)
4. **Common knowledge fills gaps** (domain norms, causal expectations, pragmatic conventions)
5. **Visualization is essential** (argument maps "solve the puzzle" of complex nets)

**Three Levels of Explicitness**:
- **Explicit**: Stated in text (solid boxes)
- **Presupposed**: Taken for granted, necessary for reconstruction (dashed boxes)
- **Simply Implied**: Recoverable from context (dotted boxes)

Analysts must **reconstruct** implicit elements to reveal complete argumentative strategy.

**Types of Dependencies in Nets**:
1. **Premise-Conclusion**: One scheme's output → another's input
2. **Presuppositional**: One scheme presupposes another's holding
3. **Support**: One scheme provides evidence for another
4. **Justificational**: One scheme justifies applicability of another
5. **Sequential**: Schemes applied in cognitive/argumentative order

**Critical Implication for Mesh Architecture**:

Current `Argument` model with single `schemeId` is **fundamentally insufficient**. Section 7 proves arguments are **nets of multiple schemes** with explicit dependency structures.

**Required Architectural Changes**:

1. **Multi-Scheme Arguments**
   ```typescript
   model ArgumentNet {
     claimId String
     nodes ArgumentNode[] // Premises, conclusions, intermediates
     edges ArgumentEdge[] // Schemes connecting nodes
   }
   ```

2. **Dependency Tracking**
   ```typescript
   model ArgumentDependency {
     sourceArgId String
     targetArgId String
     dependencyType String // premise-conclusion, presuppositional, support, etc.
     isExplicit Boolean
   }
   ```

3. **Explicitness Levels**
   ```typescript
   explicitness: "explicit" | "presupposed" | "implied"
   textEvidence?: string
   justification?: string
   ```

4. **Common Knowledge Patterns**
   ```typescript
   model SchemeNetPattern {
     name String
     domain String
     schemes String[]
     typicalDependencies Json
   }
   ```

**Impact on SchemeSpecificCQsModal**:

Current modal assumes single scheme. Must be redesigned for nets:
- **Multi-scheme identification**: Identify all schemes in composition
- **Composed CQ sets**: CQs from all schemes + dependency CQs
- **Net visualization**: Graph showing scheme nodes and dependency edges
- **Targeted attacks**: Choose which scheme/dependency in net to attack

**Visualization is Essential**:

Quote: "By using an argument map... the puzzle... can be solved."

Argument visualization is not optional but **essential for understanding nets**. Must show:
- Scheme nodes (with explicitness styling)
- Dependency edges (with type labels)
- Complete structure (explicit + reconstructed)
- Interactive exploration (click to drill down)

**Connection to Section 6**:

Section 6 showed schemes **compose within clusters** (value-based PR = instrumental PR + values).

Section 7 shows **arguments compose from clusters** (Hague speech = classification + commitment + consequences).

Together: Complete hierarchical composition from atomic schemes → clusters → nets → argumentative strategies.

**Profound Design Principle**:

Distinguish **tactical** (single scheme) from **strategic** (net) levels:
- **Tactical**: Individual scheme's premises, conclusions, CQs, formal structure
- **Strategic**: Complete argument's multiple schemes, dependencies, overall goal, rhetorical effect

Both levels necessary - tactics for precision, strategy for understanding real argumentation.

**Next Section Preview**: Section 8 shifts to computational implementation - how AI systems and legal applications have formalized schemes. Will cover critical questions as attack types, burden of proof, ASPIC+ framework, Carneades system, and practical lessons from AI implementations that directly inform Mesh's architecture.

---

*End of Section 7 Analysis*
