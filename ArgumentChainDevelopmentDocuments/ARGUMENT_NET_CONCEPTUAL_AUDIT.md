# Argument Net System: Conceptual-Theoretical-System Design Audit

**Date**: November 15, 2025  
**Purpose**: Comprehensive audit of Argument Net feature to align implementation with theoretical foundations and user value proposition  
**Status**: 🔍 **AUDIT IN PROGRESS**

---

## Executive Summary

### What Is an Argument Net?

**Theoretical Foundation** (Macagno & Walton, Section 7):
> "A single argumentation scheme, defined as a prototypical combination of semantic relations and logical inference rules, is often **inadequate to capture the complexity of real-world arguments**. Natural argumentation frequently involves **multiple conceptual passages**—such as classifying an entity, evaluating it, and then proposing a course of action—requiring a **modular approach**."

**Core Concept**: Argument Nets model **sequential composition** of argumentation schemes where:
- Each scheme represents one inferential step
- The conclusion of step N feeds into the premises of step N+1
- Complex arguments are **chains** or **networks** of interconnected schemes
- Natural language often **compresses** or **omits** intermediate steps

**Real-World Example** (The Hague Speech):
```
Step 1: Argument from Verbal Classification
  Premise: Russia's action in Crimea
  Conclusion: This action = "violation of sovereignty"
  
Step 2: Argument from Commitment (uses Step 1 conclusion)
  Premise: "Violation of sovereignty" (from Step 1)
  Premise: We all share the value that sovereignty cannot be violated
  Conclusion: Russia has violated a shared commitment
  
Step 3: Argument from Consequences (uses Step 2 conclusion)
  Premise: Russia has violated commitment (from Step 2)
  Premise: Violations lead to consequences
  Conclusion: Russia will face consequences (implicit threat)
```

### Why Argument Nets Matter

**Problem They Solve**:
1. **Single schemes are insufficient** - Real arguments require multiple inferential steps
2. **Natural language compression** - Speakers omit intermediate premises/conclusions
3. **Weakest link analysis** - Overall confidence = minimum confidence of any step
4. **Pedagogical value** - Teaching explicit reasoning structure
5. **Critical question targeting** - CQs must address specific steps in the chain

**User Value Propositions**:
- 📊 **Analyze Complex Arguments**: Decompose multi-step reasoning into explicit chains
- 🔍 **Find Weakest Links**: Identify which inferential step is most vulnerable
- 🎓 **Learn Argumentation**: See how expert arguments chain multiple schemes
- ⚖️ **Legal/Scientific Rigor**: Model complex reasoning in policy, law, science
- 🤖 **AI Argument Generation**: Build forward-chaining argument construction systems

---

## Part 1: Current Implementation Analysis

### 1.1 Database Schema: SchemeNet + SchemeNetStep

**Models** (`lib/models/schema.prisma` lines 2375-2410):

```prisma
model SchemeNet {
  id                String  @id @default(cuid())
  argumentId        String  @unique
  description       String? @db.Text
  overallConfidence Float   @default(1.0)
  
  argument Argument        @relation("ArgumentSchemeNet", fields: [argumentId], references: [id], onDelete: Cascade)
  steps    SchemeNetStep[]
}

model SchemeNetStep {
  id               String  @id @default(cuid())
  netId            String
  schemeId         String
  stepOrder        Int
  label            String?
  inputFromStep    Int?    // Which step's conclusion feeds into this premise?
  inputSlotMapping Json?   // Map conclusion variables to premise variables
  stepText         String? @db.Text
  confidence       Float   @default(1.0)
  
  net    SchemeNet      @relation(fields: [netId], references: [id], onDelete: Cascade)
  scheme ArgumentScheme @relation("SchemeNetSteps", fields: [schemeId], references: [id], onDelete: Restrict)
  
  @@unique([netId, stepOrder])
}
```

**Key Design Decisions**:
- ✅ **1:1 Relationship**: One ArgumentArgument has at most one SchemeNet
- ✅ **Sequential Steps**: `stepOrder` creates ordered chain
- ✅ **Dependency Tracking**: `inputFromStep` links steps together
- ✅ **Per-Step Confidence**: Individual confidence scores for each inferential step
- ✅ **Weakest Link**: `overallConfidence` = min(step confidences)
- ⚠️ **Argument-Centric**: Net is always attached to one Argument

**What This Enables**:
- Serial chains (A → B → C)
- Per-step critical questions
- Confidence propagation analysis
- Visual dependency graphs

**What This Constrains**:
- Cannot chain multiple arguments together
- Cannot model cross-argument dependencies
- Net is tied to single Argument's lifecycle

---

### 1.2 UI Component: ArgumentNetBuilder

**Component** (`components/argumentation/ArgumentNetBuilder.tsx` - 912 lines):

**Features**:
- 🧙‍♂️ **Multi-Step Wizard**: 4-5 tab interface depending on mode
- 🔧 **Standalone Mode**: Can operate without pre-existing argumentId
- 📝 **Argument Selection**: User picks existing argument OR creates new one
- 🎨 **Net Type Selection**: Serial, Convergent, Divergent, Hybrid
- ➕ **Step Management**: Add/remove/reorder steps
- 🎚️ **Confidence Sliders**: Per-step confidence (0-1 scale)
- 🔗 **Dependency Editor**: Configure `inputFromStep` mappings
- 📊 **Live Preview**: Shows overall confidence (weakest link)
- 💾 **API Integration**: POST /api/nets, POST /api/nets/[id]/steps

**User Flow**:
```
WITHOUT argumentId (Standalone Mode):
Step 1: Select Argument
  → Pick existing argument from deliberation
  → OR create new argument (currently disabled)
  
Step 2: Choose Net Type
  → Serial (A→B→C)
  → Convergent (A+B+C→D)
  → Divergent (A→B, A→C, A→D)
  → Hybrid (mixed)
  
Step 3: Add Steps
  → For each step:
    - Select argumentation scheme
    - Add label
    - Add step text
    - Set confidence
  
Step 4: Configure Dependencies
  → For each step (except first):
    - Select which previous step feeds into it
    - Optional: JSON slot mapping
  
Step 5: Preview & Submit
  → Shows overall confidence
  → Shows step count
  → Create net

WITH argumentId (Integrated Mode):
  → Skips Step 1 (argument already selected)
  → Otherwise identical
```

**Current State**:
- ✅ Fully functional wizard
- ✅ Standalone and integrated modes
- ✅ Creates SchemeNet and SchemeNetStep records
- ⚠️ "Create New Argument" disabled (shows helpful message)
- ⚠️ No edit mode (cannot load existing net)
- ⚠️ No validation of scheme compatibility

---

### 1.3 Display Components

**NetDetailView** (`components/nets/NetDetailView.tsx` - 570 lines):
- Full-screen modal with 3 tabs
- **Visualization**: ReactFlow graph with color-coded confidence
- **Step Details**: Full breakdown with critical questions
- **Analysis**: Weakest link identification, confidence distribution
- Export to JSON

**NetsTab** (`components/nets/NetsTab.tsx` - 400 lines):
- Management interface for all nets in deliberation
- Filter by net type, sort by confidence/date
- Statistics dashboard
- Grid view with NetCard components
- Create/View/Edit/Delete handlers

**ArgumentNetAnalyzer** (`components/argumentation/ArgumentNetAnalyzer.tsx` - 374 lines):
- Unified component for multi-scheme argument analysis
- Auto-detects nets via `/api/nets/detect`
- Falls back to single-scheme view if no net
- Integrates NetGraphWithCQs and ComposedCQPanel
- Tabbed interface: Visualization, CQs, History, Export

---

### 1.4 API Endpoints

**Explicit Net Management**:
- `POST /api/nets` - Create SchemeNet record
- `POST /api/nets/[id]/steps` - Add step to net
- `GET /api/nets/[id]` - Fetch net with all steps
- `PATCH /api/scheme-nets/[id]` - Update net metadata
- `DELETE /api/nets` - Delete net

**Deliberation-Level**:
- `GET /api/deliberations/[id]/nets` - List all nets in deliberation
- `POST /api/nets/detect` - Detect if argument has net

**Argument-Level**:
- `GET /api/arguments/[id]/scheme-net` - Get net for argument
- `POST /api/arguments/[id]/scheme-net` - Create/update net

---

### 1.5 Detection & Inference: NetIdentificationService

**Service** (`app/server/services/NetIdentificationService.ts`):

**Detection Priority**:
1. **Explicit SchemeNet** (highest priority) - Direct database record
2. **Multiple ArgumentSchemeInstances** - Infer net from parallel schemes
3. **Heuristic Detection** (fallback) - Analyze argument text

**Key Methods**:
```typescript
detectMultiScheme(argumentId: string): Promise<NetCandidate | null>
  → Checks for nets in priority order
  
detectNetsInDeliberation(deliberationId: string): Promise<NetCandidate[]>
  → Batch analyze all arguments in deliberation
  
fetchExplicitSchemeNet(argumentId: string): Promise<NetCandidate | null>
  → Query SchemeNet table directly
  
fetchSchemeInstancesAsNet(argumentId: string): Promise<NetCandidate | null>
  → Convert ArgumentSchemeInstance records to net format
```

**Net Types Inferred**:
- **Serial**: Steps have sequential `inputFromStep` references
- **Convergent**: Multiple steps have same `inputFromStep` (N → 1)
- **Divergent**: One step feeds multiple (1 → N)
- **Hybrid**: Mixed patterns

**Confidence Calculation**:
- Overall confidence = minimum of all step confidences (weakest link principle)

---

## Part 2: Theoretical Foundations vs. Current Implementation

### 2.1 Macagno & Walton Section 7: Nets of Argumentation Schemes

**What the Theory Says**:

> "A single argumentation scheme... is often inadequate to capture the complexity of real-world arguments. Natural argumentation frequently involves **multiple conceptual passages**—such as classifying an entity, evaluating it, and then proposing a course of action—requiring a modular approach."

**Key Theoretical Principles**:

1. **Modularity**: Complex arguments = sequence of schemes
2. **Sequential Composition**: Conclusion of step N → Premise of step N+1
3. **Implicit Reasoning**: Natural language omits intermediate steps
4. **Dependency Networks**: Not just chains—can be networks
5. **Argument Mapping**: Visual tool to reveal hidden structure

**Examples from Paper**:

**Example 7.1 - The Hague Speech** (Figure 9):
```
Russia's action in Crimea
  ↓ [Verbal Classification]
"This is a violation"
  ↓ [Commitment to shared values]
"Sovereignty cannot be violated"
  ↓ [Consequences]
"Russia will face consequences" (implicit threat)
```

**Example 7.2 - Global Escalation** (Figure 10):
```
US aid to Ukraine
  ↓ [Verbal Classification]
"This is a declaration of war"
  ↓ [Slippery Slope chain]
Regional conflict → European war → Global war
  ↓ [Values]
"Global escalation is dangerous and should be avoided"
```

---

### 2.2 Current Implementation Alignment

| Theoretical Principle | Current Implementation | Status |
|----------------------|------------------------|--------|
| **Sequential Composition** | ✅ `inputFromStep` links steps | ✅ ALIGNED |
| **Per-Step Schemes** | ✅ Each SchemeNetStep has `schemeId` | ✅ ALIGNED |
| **Weakest Link Analysis** | ✅ `overallConfidence` = min(steps) | ✅ ALIGNED |
| **Dependency Tracking** | ✅ `inputFromStep` + `inputSlotMapping` | ✅ ALIGNED |
| **Visual Mapping** | ✅ ReactFlow in NetDetailView | ✅ ALIGNED |
| **Critical Questions per Step** | ✅ NetDetailView groups CQs by step | ✅ ALIGNED |
| **Implicit Reasoning Reconstruction** | ⚠️ User must manually identify steps | ⚠️ PARTIAL |
| **Cross-Argument Nets** | ❌ Net tied to single Argument | ❌ GAP |
| **Automatic Net Detection** | ✅ NetIdentificationService heuristics | ✅ ALIGNED |
| **Forward Chaining (Invention)** | ❌ No AI argument generation | ❌ GAP |

---

### 2.3 Key Design Gaps

#### Gap #1: Argument-Centric Architecture

**Theory**: Nets can span multiple arguments
- The Hague Speech example uses 3 distinct argumentative moves
- Each move could be a separate Argument object
- Net should **connect arguments**, not be **contained by** one argument

**Current Implementation**: 
- `SchemeNet.argumentId` is **unique** (1:1 relationship)
- Net cannot reference multiple arguments
- Cannot model "Argument A enables premise of Argument B"

**Impact**:
- Cannot represent real deliberation structure
- Forces artificial compression into single Argument
- Misaligns with AIF-style argument graphs

**Recommendation**: Consider alternative architectures:
- Option A: `SchemeNet` as standalone entity with M:N ArgumentDependency
- Option B: Keep 1:1 but add `ArgumentNet` model for cross-argument chains
- Option C: SchemeNetStep references `argumentId` instead of net-level

---

#### Gap #2: Standalone Creation Conceptual Confusion

**Theory**: Nets **decompose existing complex arguments**
- You have a text (e.g., political speech)
- Analyst identifies implicit reasoning steps
- Net reconstructs the hidden inferential chain

**Current Implementation**:
- "Create Net" workflow starts with no argument
- User selects argument THEN builds net
- Net is **post-hoc addition** to argument
- Alternative: "Create New Argument" (disabled)

**Conceptual Issues**:

1. **Timing Problem**: When do users create nets?
   - During argument creation? (Net-first)
   - After argument exists? (Net-second)
   - Current implementation assumes net-second

2. **Argument Creation Problem**: If net-first, what is the "argument"?
   - Is the net itself the argument?
   - Or is there a parent Argument that contains the net?
   - Current schema: Net must attach to existing Argument

3. **User Mental Model**: What are they building?
   - Scenario A: "I want to analyze this existing argument by breaking it into steps"
   - Scenario B: "I want to build a multi-step argument from scratch"
   - Current UI supports Scenario A (select existing) and partially B (create new - disabled)

**Real Use Cases**:

**Use Case 1: Pedagogical Analysis**
- Teacher shows student a complex argument from reading
- "Let's break this down step by step"
- Identify: Classification → Commitment → Consequences
- Net is **analytical tool** for existing text

**Use Case 2: Expert Argument Construction**
- Policy analyst building recommendation
- "I need Expert Opinion → Sign Evidence → Causal Mechanism → Practical Reasoning"
- Net is **constructive tool** for building new argument
- Final output = one cohesive argument (but with explicit steps)

**Use Case 3: Deliberation Mapping**
- Multiple participants make related arguments
- Argument A: "Climate change is real" (Expert Opinion)
- Argument B: "Temperatures rising" (Sign Evidence)
- Argument C: "CO2 causes warming" (Causal)
- Net **connects** separate arguments into reasoning chain

**Current Implementation Best Serves**: Use Case 1 (pedagogical analysis)  
**Weakest Support**: Use Case 3 (multi-argument chaining)

---

#### Gap #3: Net Type Semantics Unclear

**Theory**: Different net structures have different meanings
- **Serial**: Sequential inferential chain (A→B→C)
- **Convergent**: Multiple independent reasons for same conclusion (A+B+C→D)
- **Divergent**: One premise supports multiple conclusions (A→B, A→C)
- **Hybrid**: Complex mix

**Current Implementation**:
- User selects net type in wizard Step 2
- But schema doesn't store net type! (inferred later from structure)
- NetIdentificationService **infers** type from `inputFromStep` patterns

**Problems**:
1. **No Explicit Storage**: `SchemeNet` has no `netType` field
2. **Inference Ambiguity**: Same structure could be interpreted multiple ways
3. **User Expectation Mismatch**: User selects "Convergent" but system may infer "Serial"
4. **Loss of Intent**: Why did user think this was convergent? Lost information

**Recommendation**:
- Add `netType` enum field to SchemeNet model
- Store user's selection
- Use as hint for visualization/analysis
- Allow override if inference disagrees

---

#### Gap #4: Relationship to ArgumentSchemeInstance

**Current System Has Two Parallel Concepts**:

1. **ArgumentSchemeInstance** (Phase 4):
   - Multiple schemes assigned to one Argument
   - Parallel schemes (not sequential)
   - Example: "This argument uses Expert Opinion AND Analogy"
   - Inference: Automatic via schemeInference.ts
   - Display: ArgumentNetAnalyzer for multi-scheme args

2. **SchemeNet + SchemeNetStep** (Phase 5):
   - Sequential scheme composition
   - Explicit dependency chain
   - Example: "Expert Opinion → Sign → Causal → Practical Reasoning"
   - Creation: Manual via ArgumentNetBuilder
   - Display: NetDetailView with ReactFlow

**Confusion**:
- Both are called "nets" in UI
- NetIdentificationService detects BOTH:
  - Priority 1: Explicit SchemeNet
  - Priority 2: Multiple ArgumentSchemeInstances (infer as net)
- When should user use which?

**Real-World Mapping**:
- **Parallel Schemes** (ArgumentSchemeInstance): Argument uses multiple warrants
  - "We should act on climate change because [expert opinion] AND because [consequences]"
  - Both schemes support same conclusion independently
  
- **Sequential Schemes** (SchemeNet): Multi-step reasoning chain
  - "Scientists agree (expert) → Temps rising (sign) → CO2 causes it (causal) → We must act (practical)"
  - Each step's conclusion feeds next step's premise

**Recommendation**:
- Rename to clarify distinction:
  - "Multi-Scheme Arguments" for ArgumentSchemeInstance
  - "Argument Chains" or "Reasoning Nets" for SchemeNet
- Update UI copy to explain difference
- Consider workflow: Should parallel schemes → sequential net?

---

## Part 3: Standalone Mode Design Problems

### 3.1 Current Standalone Flow Analysis

**Step 1: Select/Create Argument**

**Options Presented**:
1. Select existing argument from dropdown
2. Create new argument (currently disabled with message)

**Problems**:

**Problem A: "Create New Argument" Disabled**
- Shows message: "Creating new arguments requires using the full argument composer..."
- Directs user to "Create Argument" tab first
- Forces user to exit wizard, create argument elsewhere, return
- Breaks flow, cognitive load

**Problem B: Argument Dropdown Context**
- Shows list of all arguments in deliberation
- Uses `conclusion` text as label
- But which arguments are suitable for nets?
- No indicator of argument complexity
- User must remember which argument they want to analyze

**Problem C: Timing Confusion**
- If argument already exists, is net post-hoc analysis?
- Or is net essential structure of the argument?
- Schema enforces 1:1 (one argument = at most one net)
- But UI treats net as optional add-on

---

### 3.2 Mental Model Mismatch

**What Users Might Expect** (based on theory):

**Scenario A: "I want to build a reasoning chain from scratch"**
```
User thinks: "I'm constructing a multi-step argument"
  → Step 1: Pick schemes that chain together
  → Step 2: For each scheme, fill in premises/conclusion
  → Step 3: Link them together
  → Final output: One complex argument (visualized as net)
```

**Scenario B: "I want to analyze an existing complex argument"**
```
User thinks: "This speech has hidden structure"
  → Step 1: Select the argument (speech text)
  → Step 2: Identify the implicit reasoning steps
  → Step 3: Assign schemes to each step
  → Step 4: Map dependencies
  → Final output: Net that reveals hidden structure
```

**What Current Implementation Enforces**:
```
System says: "Nets attach to Arguments"
  → Step 1: You must have an Argument first
  → Step 2: Then you build a net for it
  → Net is metadata ABOUT the argument
  → Argument exists independently of net
```

**Misalignment**:
- Scenario A users want **net-first construction**
- Scenario B users want **argument-first analysis**
- System forces Argument-first in both cases
- But "Create New Argument" is disabled!
- So currently ONLY Scenario B works (select existing)

---

### 3.3 Core Conceptual Question

**What is the relationship between Argument and SchemeNet?**

**Option 1: Net IS the Argument**
- SchemeNet is the canonical representation
- Argument.text is just natural language rendering
- Steps are the true structure
- Visualization: Show net by default

**Option 2: Net ANALYZES the Argument**
- Argument is primary (text, claims, premises)
- SchemeNet is optional analytical overlay
- Multiple analysts could create different nets for same argument
- Visualization: Show argument, optionally reveal net

**Option 3: Net CONSTRUCTS the Argument**
- User builds net as scaffold
- System generates Argument from net
- Each step becomes premise
- Final step conclusion becomes argument conclusion
- Visualization: Net is authoring tool, argument is output

**Current Implementation Suggests**: Option 2 (net analyzes argument)
- 1:1 relationship (one argument, one analytical decomposition)
- Net references argument, not vice versa
- ArgumentNetBuilder requires argumentId (analysis target)
- "Create New Argument" disabled (forces pre-existing argument)

**But Theoretical Foundation Suggests**: Mix of all three
- Macagno & Walton examples show **retrospective analysis** (Option 2)
- But also discuss **argument invention** (Option 3)
- And nets as **canonical representation** of complex reasoning (Option 1)

---

## Part 4: Integration with Broader Deliberation System

### 4.1 Relationship to Other Features

**Argument Creation Flow**:
```
User creates argument via:
  1. ArgumentConstructor (full AIF structure)
  2. AIFArgumentWithSchemeComposer (single scheme)
  3. Quick argument form (simple text)
  
Then optionally:
  4. Build SchemeNet (ArgumentNetBuilder)
  
Problem: Net creation is separate, disconnected step
```

**Multi-Scheme Classification** (Phase 4):
```
System automatically infers multiple schemes:
  → ArgumentSchemeInstance records created
  → ArgumentNetAnalyzer detects multi-scheme
  → Shows as "net" (but no sequential structure)
  
If user wants sequential structure:
  → Must manually create SchemeNet
  → Replaces or augments ArgumentSchemeInstance?
  → Unclear relationship
```

**Argument Attacks**:
```
ConflictApplication models attacks:
  → Undermines (attacks premise)
  → Undercuts (attacks inference)
  → Rebuts (attacks conclusion)
  
With SchemeNet:
  → Attacks can target specific steps!
  → "I challenge step 2 (the classification)"
  → More precise than attacking whole argument
  
Current Implementation:
  → ConflictApplication references argumentId
  → No reference to specific SchemeNetStep
  → Missed opportunity
```

---

### 4.2 User Value Proposition Analysis

**Who Benefits from Argument Nets?**

**Persona 1: Policy Analyst**
- Needs: Model complex reasoning chains for recommendations
- Value: "I can show Expert Opinion → Evidence → Causal Link → Recommendation"
- Current Support: ⚠️ Partial (if argument already exists)
- Gap: Cannot easily create net-first workflow

**Persona 2: Student/Learner**
- Needs: Understand structure of complex arguments
- Value: "I can see how this speech chains Classification → Values → Consequences"
- Current Support: ✅ Strong (select argument, build analytical net)
- Gap: Limited to arguments in system (cannot analyze external text)

**Persona 3: Legal Professional**
- Needs: Build multi-step legal arguments with precedent chains
- Value: "Classification → Precedent → Statutory Interpretation → Conclusion"
- Current Support: ⚠️ Partial (single-argument limitation)
- Gap: Cannot chain multiple case arguments together

**Persona 4: Deliberation Moderator**
- Needs: Show how multiple participants' arguments connect
- Value: "User A's claim enables User B's premise, leading to User C's conclusion"
- Current Support: ❌ Weak (cannot cross arguments)
- Gap: 1:1 Argument:SchemeNet relationship blocks this

**Persona 5: Researcher/Academic**
- Needs: Computational argumentation research, AIF compliance
- Value: "My system matches Macagno & Walton formal model"
- Current Support: ✅ Strong (schema matches theory)
- Gap: Forward-chaining argument invention not implemented

---

### 4.3 Comparison to ArgumentSchemeInstance (Phase 4)

| Feature | ArgumentSchemeInstance | SchemeNet + SchemeNetStep |
|---------|------------------------|---------------------------|
| **Purpose** | Multiple schemes for same conclusion | Sequential scheme chain |
| **Structure** | Parallel (A+B+C) | Serial (A→B→C) |
| **Creation** | Automatic inference | Manual construction |
| **User Control** | Low (system decides) | High (user specifies structure) |
| **Confidence** | Per-scheme | Per-step + overall (weakest link) |
| **Dependencies** | None (independent) | Explicit (`inputFromStep`) |
| **Visualization** | NetGraphWithCQs (flat) | ReactFlow (hierarchical graph) |
| **Critical Questions** | Merged set (deduplicated) | Per-step (grouped) |
| **Edit/Update** | Can add/remove schemes | No edit mode yet |
| **Typical Use Case** | "This arg uses multiple warrants" | "This is a multi-step reasoning chain" |
| **Complexity** | Medium (3-5 schemes typical) | High (3-10 steps) |
| **Ambiguity** | High (many schemes, unclear priority) | Low (explicit sequence) |

**When to Use Which?**

**Use ArgumentSchemeInstance when**:
- Argument simultaneously appeals to multiple reasoning patterns
- Example: "We should act on climate change because [experts say so] AND [consequences will be bad] AND [we have moral obligation]"
- Schemes are **parallel alternatives** or **reinforcing supports**

**Use SchemeNet when**:
- Argument requires multiple inferential steps
- Example: "Scientists agree → Temps rising → CO2 causes it → Therefore act"
- Each step's conclusion is **necessary premise** for next step
- Analyzing **implicit reasoning** in compressed natural language

---

## Part 5: Recommendations for Standalone Mode Redesign

### 5.1 Clarify Core Use Case

**Recommendation: Focus on "Argument Analysis" not "Argument Creation"**

**Rationale**:
- Theoretical foundation emphasizes **retrospective analysis**
- Macagno & Walton examples analyze existing speeches/texts
- 1:1 Argument:SchemeNet relationship suits analysis (one interpretation)
- Creating argument FROM net requires different schema

**Redesigned Mental Model**:
```
SchemeNet = Analytical Tool for Decomposing Complexity

User's existing argument: "We should implement carbon tax"
  (Natural language: compressed, implicit steps)
  
Analyst creates SchemeNet to reveal hidden structure:
  Step 1: Expert Opinion ("Economists recommend carbon pricing")
  Step 2: Causal Reasoning ("Carbon pricing reduces emissions")
  Step 3: Positive Consequences ("Reduced emissions slow climate change")
  Step 4: Practical Reasoning ("Therefore, implement carbon tax")
  
Net shows what was implicit in original argument
```

---

### 5.2 Redesigned Standalone Workflow

**New Step 1: Select Analysis Target**

Option A: **Analyze Existing Argument** (Recommended Focus)
```
1. Show grid of arguments in deliberation
2. Filter by: "Arguments with 3+ claims" (complexity indicator)
3. For each argument, show:
   - Conclusion text
   - Number of premises
   - Current scheme assignments (if any)
   - "Likely complexity: High/Medium/Low"
4. User selects argument to analyze
5. Continue to Step 2 (Net Type Selection)
```

Option B: **Analyze External Text** (Future Enhancement)
```
1. Textarea: "Paste argument text to analyze"
2. System creates temporary Argument record
3. Continue with net creation
4. On submit: Create permanent Argument + SchemeNet
5. Use case: Teaching tool for analyzing speeches, articles
```

Option C: **Build Argument with Explicit Structure** (Different Feature)
```
Recommendation: This should be SEPARATE feature, not in ArgumentNetBuilder
  → New component: "ArgumentConstructorWithSteps"
  → Net-first construction
  → Each step creates premise claim
  → Final output: Argument + SchemeNet together
  
Do not conflate analysis and construction workflows
```

---

### 5.3 Enhanced "Select Argument" Step

**UI Mockup**:
```tsx
<div className="space-y-4">
  <h3>Select Argument to Analyze</h3>
  <p className="text-sm text-muted-foreground">
    Choose a complex argument from this deliberation to decompose into explicit reasoning steps.
    Look for arguments with multiple premises or implicit inferential leaps.
  </p>
  
  {/* Filters */}
  <div className="flex gap-2">
    <Select value={complexityFilter} onChange={setComplexityFilter}>
      <SelectItem value="all">All Arguments</SelectItem>
      <SelectItem value="high">High Complexity (4+ premises)</SelectItem>
      <SelectItem value="medium">Medium Complexity (2-3 premises)</SelectItem>
    </Select>
    
    <Select value={schemeFilter} onChange={setSchemeFilter}>
      <SelectItem value="all">Any Schemes</SelectItem>
      <SelectItem value="multiple">Multiple Schemes Detected</SelectItem>
      <SelectItem value="none">No Net Yet</SelectItem>
    </Select>
  </div>
  
  {/* Argument Grid */}
  <div className="grid gap-3">
    {arguments.map(arg => (
      <ArgumentCard 
        key={arg.id}
        argument={arg}
        complexity={calculateComplexity(arg)}
        onClick={() => selectArgument(arg.id)}
        showComplexityBadge
        showSchemeCount
      />
    ))}
  </div>
</div>
```

**Complexity Calculation**:
```typescript
function calculateComplexity(argument: Argument): 'high' | 'medium' | 'low' {
  const premiseCount = argument.premises.length;
  const claimCount = argument.claims?.length || 0;
  const schemeCount = argument.argumentSchemes.length;
  
  const score = premiseCount + (claimCount * 0.5) + (schemeCount * 2);
  
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
```

---

### 5.4 Remove "Create New Argument" Option

**Recommendation: Remove this option entirely from ArgumentNetBuilder**

**Rationale**:
1. ArgumentNetBuilder is for **analysis**, not creation
2. Creating argument requires full AIF structure (claims, premises, schemes)
3. "Create New Argument" button currently disabled anyway
4. Directs users to "Create Argument" tab (correct!)
5. Maintaining disabled button is confusing UX

**Proposed Change**:
```tsx
// OLD (current):
<RadioGroup>
  <RadioGroupItem value="existing">Select Existing Argument</RadioGroupItem>
  <RadioGroupItem value="new" disabled>Create New Argument</RadioGroupItem>
</RadioGroup>
{createNewArgument && <Alert>Message: Use Create Argument tab</Alert>}

// NEW (proposed):
<div>
  <Label>Select Argument to Analyze</Label>
  <Select value={argumentId} onChange={setArgumentId}>
    {arguments.map(arg => (
      <SelectItem key={arg.id} value={arg.id}>
        {arg.conclusion}
      </SelectItem>
    ))}
  </Select>
  
  <div className="text-sm text-muted-foreground mt-2">
    Don't see your argument? 
    <Link href="#create-argument-tab" className="text-primary">
      Create a new argument first
    </Link>
    , then return here to build its net.
  </div>
</div>
```

---

### 5.5 Add "Why Build a Net?" Guidance

**Problem**: Users don't understand when/why to use nets

**Solution**: Contextual help in Step 1

```tsx
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>When to Build an Argument Net</AlertTitle>
  <AlertDescription>
    <p className="mb-2">
      Build a net when an argument involves <strong>multiple inferential steps</strong>:
    </p>
    <ul className="list-disc pl-4 space-y-1 text-sm">
      <li><strong>Classification → Action</strong>: "This is a crisis, therefore we must act"</li>
      <li><strong>Expert → Evidence → Causal → Practical</strong>: Scientific reasoning chains</li>
      <li><strong>Precedent → Analogy → Conclusion</strong>: Legal argumentation</li>
    </ul>
    <p className="mt-2 text-sm">
      <strong>Not suitable for</strong>: Simple arguments with one conclusion and supporting premises.
      Use the regular argument creator for those.
    </p>
  </AlertDescription>
</Alert>
```

---

### 5.6 Add Scheme Compatibility Validation

**Problem**: User can select any schemes, even if they don't chain logically

**Solution**: Add validation in Step 3 (Add Steps)

```typescript
function validateSchemeChain(steps: NetStep[]): ValidationResult {
  const issues: string[] = [];
  
  for (let i = 1; i < steps.length; i++) {
    const prevScheme = schemes.find(s => s.id === steps[i-1].schemeId);
    const currScheme = schemes.find(s => s.id === steps[i].schemeId);
    
    // Check if conclusion type of prev matches premise type of curr
    const prevConclusionType = prevScheme?.conclusion?.type;
    const currPremiseType = currScheme?.premises?.[0]?.type;
    
    if (prevConclusionType && currPremiseType) {
      if (!typesCompatible(prevConclusionType, currPremiseType)) {
        issues.push(
          `Step ${i}: ${prevScheme.name} conclusion (${prevConclusionType}) ` +
          `may not chain into ${currScheme.name} premise (${currPremiseType})`
        );
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings: issues.length > 0 ? ['Chain may not be logically sound'] : []
  };
}
```

**Display**:
```tsx
{validation.issues.length > 0 && (
  <Alert variant="warning">
    <AlertDescription>
      <strong>Potential issues in scheme chain:</strong>
      <ul className="list-disc pl-4 mt-2">
        {validation.issues.map((issue, i) => (
          <li key={i}>{issue}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm">
        You can still create this net, but it may not form a valid inferential chain.
      </p>
    </AlertDescription>
  </Alert>
)}
```

---

## Part 6: Alternative Architecture Considerations

### 6.1 Should Nets Cross Arguments?

**Current**: Net tied to single Argument (1:1)  
**Alternative**: Net can reference multiple Arguments (M:N)

**Scenario That Requires Cross-Argument Nets**:
```
Deliberation: "Should we ban TikTok?"

Participant A posts: 
  "TikTok collects user data"
  → Argument from Sign (evidence)
  → Creates Argument #1

Participant B posts:
  "Data collection enables surveillance"
  → Argument from Causal Reasoning
  → Creates Argument #2

Participant C posts:
  "Therefore we should ban TikTok to protect privacy"
  → Argument from Practical Reasoning
  → Creates Argument #3

Ideal Net Structure:
  Argument #1 (Sign) → Argument #2 (Causal) → Argument #3 (Practical)
  
But current schema CANNOT model this!
```

**Proposed Alternative Schema**:
```prisma
model SchemeNet {
  id                String  @id @default(cuid())
  deliberationId    String  // Changed: Now at deliberation level
  name              String?
  description       String? @db.Text
  netType           NetType // NEW: Store user's selection
  overallConfidence Float   @default(1.0)
  
  deliberation Deliberation @relation(fields: [deliberationId], references: [id])
  steps        SchemeNetStep[]
}

model SchemeNetStep {
  id               String  @id @default(cuid())
  netId            String
  argumentId       String  // NEW: Each step references specific Argument
  stepOrder        Int
  label            String?
  inputFromStep    Int?
  confidence       Float   @default(1.0)
  
  net      SchemeNet @relation(fields: [netId], references: [id])
  argument Argument  @relation(fields: [argumentId], references: [id])
  
  @@unique([netId, stepOrder])
}
```

**Benefits**:
- Nets can span multiple Arguments
- Models real deliberation structure
- One Argument can participate in multiple Nets
- Aligns with Macagno & Walton examples (multi-argument chains)

**Drawbacks**:
- Breaks 1:1 assumption throughout codebase
- More complex UI (must select argument per step)
- Raises ownership questions (who can edit multi-user net?)
- May conflict with Argument deletion (cascade?)

**Recommendation**: 
- **Phase 1 (Current)**: Keep 1:1 for single-user analysis use case
- **Phase 2 (Future)**: Add ArgumentNet model for cross-argument chains
- **Both models coexist**: SchemeNet for single-arg analysis, ArgumentNet for multi-arg

---

### 6.2 Net-First Argument Construction

**Alternative Use Case**: Build argument BY building net

**Workflow**:
```
1. User starts: "I want to build a multi-step policy argument"
2. User creates net structure:
   - Step 1: Expert Opinion (economists support carbon tax)
   - Step 2: Causal Reasoning (carbon tax reduces emissions)
   - Step 3: Positive Consequences (reducing emissions helps climate)
   - Step 4: Practical Reasoning (therefore implement tax)
3. For each step, user fills in:
   - Premise text
   - Conclusion text
4. System GENERATES Argument from net:
   - Combines all step texts
   - Infers overall conclusion from final step
   - Creates Claim records for each step conclusion
5. Both Argument AND SchemeNet are created
```

**Schema Requirements**:
- SchemeNetStep needs `premiseTexts` and `conclusionText` fields
- Or reference Claim IDs directly
- Net creation API must also create Argument

**Recommendation**: 
- **Separate component**: ArgumentConstructorWithSteps
- **Different mental model**: "Building" not "Analyzing"
- **Share underlying API**: POST /api/nets and POST /api/arguments

---

## Part 7: Actionable Recommendations Summary

### Priority 1: Clarify Conceptual Purpose (2-3 hours)

**Tasks**:
1. Add documentation/help text explaining net analysis vs. multi-scheme classification
2. Update ArgumentNetBuilder modal title: "Analyze Argument Structure"
3. Remove "Create New Argument" option entirely
4. Add "When to Build a Net" guidance card
5. Update NetsTab description to emphasize analysis use case

**Copy Changes**:
```
OLD: "Create Argument Net"
NEW: "Analyze Argument Structure"

OLD: "Build explicit scheme nets with weakest link detection"
NEW: "Decompose complex arguments into explicit reasoning steps to identify implicit structure and weakest inferential links"
```

---

### Priority 2: Improve Argument Selection UX (3-4 hours)

**Tasks**:
1. Add complexity filters (High/Medium/Low based on premise count)
2. Show scheme count and existing net status on argument cards
3. Add search/filter by conclusion text
4. Highlight arguments that are good candidates for nets
5. Show preview of argument structure before selection

**UI Enhancements**:
```tsx
<ArgumentSelectionGrid
  arguments={arguments}
  filters={{ complexity: 'high', hasSchemes: true, hasNet: false }}
  sortBy="complexity"
  renderCard={(arg) => (
    <Card>
      <Badge>{arg.complexity}</Badge>
      <h4>{arg.conclusion}</h4>
      <p>{arg.premises.length} premises</p>
      {arg.schemeCount > 1 && <Badge variant="outline">{arg.schemeCount} schemes</Badge>}
      {arg.hasNet && <Badge variant="secondary">Net exists</Badge>}
    </Card>
  )}
/>
```

---

### Priority 3: Add Net Type to Schema (1-2 hours)

**Tasks**:
1. Add migration: `netType NetType?` enum to SchemeNet
2. Update ArgumentNetBuilder to store user's selection
3. Use stored type as hint for visualization
4. Validate inferred type matches user selection (warn if mismatch)

**Schema Change**:
```prisma
model SchemeNet {
  id                String   @id @default(cuid())
  argumentId        String   @unique
  description       String?  @db.Text
  netType           NetType? // NEW: Store user's selection
  overallConfidence Float    @default(1.0)
  // ...
}

enum NetType {
  SERIAL
  CONVERGENT
  DIVERGENT
  HYBRID
}
```

---

### Priority 4: Add Scheme Compatibility Validation (4-5 hours)

**Tasks**:
1. Add formal structure validation (conclusion type → premise type)
2. Show warnings (non-blocking) for potential issues
3. Allow override with user acknowledgment
4. Add "Learn More" link explaining compatibility

**Validation Logic**:
```typescript
interface SchemeCompatibility {
  compatible: boolean;
  reason?: string;
  severity: 'error' | 'warning' | 'info';
}

function checkCompatibility(
  prevScheme: ArgumentScheme,
  nextScheme: ArgumentScheme
): SchemeCompatibility {
  // Check if conclusion template variables match premise template variables
  // Check if semantic relation types align
  // Check if reasoning types are compatible
  // Return detailed compatibility assessment
}
```

---

### Priority 5: Create ArgumentConstructorWithSteps (10-15 hours) [Optional]

**Only if net-first construction is desired**

**Tasks**:
1. New component: ArgumentConstructorWithSteps
2. Build net structure first
3. Fill in premise/conclusion text per step
4. Generate Argument + SchemeNet atomically
5. Update NetsTab with "Build New Argument" button

**Separate from ArgumentNetBuilder** - different use case!

---

## Part 8: Conclusion

### Summary of Findings

**What Works Well**:
- ✅ Database schema aligns with Macagno & Walton theory
- ✅ Sequential composition, weakest link analysis implemented
- ✅ Visual mapping with ReactFlow
- ✅ Critical question integration per step
- ✅ Detection service with priority-based inference

**What Needs Clarity**:
- ⚠️ Purpose: Analysis tool vs. Construction tool?
- ⚠️ Relationship to ArgumentSchemeInstance (parallel schemes)
- ⚠️ When users should create nets
- ⚠️ Standalone mode workflow (create new arg disabled)

**What Could Be Enhanced**:
- 🔧 Cross-argument nets (requires schema changes)
- 🔧 Net-first argument construction (separate feature)
- 🔧 Scheme compatibility validation
- 🔧 Better argument selection UX
- 🔧 Explicit net type storage

**Core Recommendation**:

**Focus ArgumentNetBuilder on its intended purpose: Retrospective analysis of existing complex arguments**

- Remove ambiguity by removing "Create New Argument"
- Enhance argument selection with complexity indicators
- Add contextual guidance explaining when/why to use nets
- Save net-first construction for separate future feature

**This aligns with**:
- Macagno & Walton's theoretical examples (analyzing speeches)
- Current schema design (1:1 Argument:SchemeNet)
- User mental model (decomposing complexity)
- Pedagogical use case (teaching argumentation structure)

**Future Extensions** (Separate Features):
- Cross-argument nets for deliberation mapping
- Net-first construction for expert argument building
- AI-assisted net inference from text
- Collaborative net editing

---

**Status**: ✅ Audit Complete  
**Next Step**: Review with team, prioritize recommendations  
**Est. Implementation**: Priority 1-3 = 6-9 hours, Full roadmap = 20-30 hours
