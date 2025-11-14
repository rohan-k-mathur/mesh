# AIFArgumentWithSchemeComposer Enhancement Roadmap
## Remaining Gaps & Future Enhancements After System Consolidation

**Date**: November 13, 2025  
**Last Updated**: November 13, 2025 (Post-Consolidation)  
**Status**: Planning Document  
**Purpose**: Identify remaining feature gaps and multi-scheme argument capabilities to be added to AIFArgumentWithSchemeComposer

---

## Executive Summary

Following the ArgumentConstructor deprecation and consolidation to AIFArgumentWithSchemeComposer (November 2025), this roadmap identifies remaining gaps and opportunities for enhancement. The recent enhancement work added taxonomy badges, variable hints, evidence requirements, and citation quality indicators. This document focuses on **multi-scheme arguments** and **argument nets** as the primary unaddressed capability.

**Recent Consolidation** (Complete ✅):
- ✅ Deprecated ArgumentConstructor wizard (2,062 lines)
- ✅ Enhanced AIFArgumentWithSchemeComposer with Phase 1 features (now 1,255 lines)
- ✅ Archived 4 complex components (2,245 lines preserved)
- ✅ Net reduction: -2,445 lines (-57%)

**Key Findings**:
- ✅ AIFArgumentWithSchemeComposer is now the single source of truth for argument creation
- ✅ Core single-scheme functionality is feature-complete
- ❌ Multi-scheme argument creation UI missing (CRITICAL GAP)
- ❌ Argument net builder and visualization incomplete
- 🎯 Estimated 27 hours for Phase 2 multi-scheme support

---

## Part 1: Current State Assessment (November 2025)

### 1.1 What's Complete ✅

**AIFArgumentWithSchemeComposer Feature Set**:
- ✅ Single-scheme argument creation (conclusion + premises)
- ✅ Claim creation (inline, not picker-based yet)
- ✅ Scheme selection from catalog
- ✅ Dual premise modes (structured major/minor OR freeform list)
- ✅ Citation collection (CitationCollector integration)
- ✅ Attack context support (REBUTS, UNDERCUTS, UNDERMINES)
- ✅ ConflictApplication (CA) record creation for attacks
- ✅ Formal structure display (major/minor premise templates)
- ✅ Rich text editors (PropositionComposerPro integration)
- ✅ Slot hints display (role badges from scheme metadata)
- ✅ Axiom designation checkbox (marks premises as indisputable)
- ✅ Implicit warrant field (optional justification text)
- ✅ Event dispatching (claims:changed, arguments:changed)
- ✅ Callback variants (onCreated, onCreatedDetail)
- ✅ **NEW**: Taxonomy badges (materialRelation, reasoningType, clusterTag)
- ✅ **NEW**: Variable hints (from scheme.premises[].variables)
- ✅ **NEW**: Evidence requirements (inferred from scheme metadata)
- ✅ **NEW**: Citation quality indicators (heuristic scoring)

**Backend Infrastructure** (Phase 1 Complete):
- ✅ Multi-scheme database schema (ArgumentSchemeInstance model)
- ✅ API endpoints for scheme management
  - `GET /api/arguments/[id]/schemes` - List all schemes
  - `POST /api/arguments/[id]/schemes` - Add scheme
  - `PATCH /api/arguments/[id]/schemes/[instanceId]` - Update scheme
  - `DELETE /api/arguments/[id]/schemes/[instanceId]` - Remove scheme
- ✅ ArgumentNet model for net-level metadata
- ✅ SchemeNetVisualization component (sequential chain display)
- ✅ ComposedCQPanel (multi-scheme CQ aggregation)

**Verdict**: Single-scheme argument creation is **feature-complete**. Multi-scheme creation is **architecturally supported** but **lacks UI**.

---

### 1.2 Critical Gaps 🔴

**Gap #1: No Multi-Scheme Creation UI** - CRITICAL
- **Problem**: Users can only select one scheme during argument creation
- **Impact**: Cannot model real-world complex arguments (policy, legal, scientific)
- **Backend Ready**: ✅ API endpoints exist
- **Frontend Missing**: ❌ No UI to add schemes post-creation or during creation

**Gap #2: No Dependency Editor** - HIGH
- **Problem**: When users add multiple schemes (via API), dependencies unclear
- **Impact**: No way to specify how Scheme A feeds into Scheme B
- **Needed For**: Argument nets, serial chains (Expert → Sign → Causal)

**Gap #3: No Argument Net Builder** - MEDIUM
- **Problem**: No wizard for creating SchemeNet records with explicit SchemeNetStep chains
- **Impact**: Cannot create pedagogical serial nets with per-step confidence
- **Current Workaround**: Seed scripts only

**Gap #4: No Net Pattern Library** - MEDIUM
- **Problem**: Users don't know common patterns (Policy = Classification → Values → Consequences → Action)
- **Impact**: Reinvent patterns, inconsistent argumentation

**Gap #5: Net Detection Hidden** - LOW
- **Problem**: ArgumentNetAnalyzer auto-detects nets but no user visibility
- **Impact**: Users confused why some arguments show net UI

---

### 1.3 Explicitly NOT Needed ✅

The following features from the old ArgumentConstructor roadmap are **no longer relevant** after consolidation:

- ❌ **Wizard-based UI** - AIFArgumentWithSchemeComposer uses single-page form (better UX)
- ❌ **Template customization** - AIFArgumentWithSchemeComposer uses direct input
- ❌ **Real-time scoring** - Not needed for standard arguments
- ❌ **Evidence collection step** - Handled by CitationCollector inline
- ❌ **CQ Preview Panel** - Already shown in scheme selection (if scheme has CQs)

**Reason**: AIFArgumentWithSchemeComposer's one-page form is simpler and faster than the wizard approach. The consolidation proved that complex multi-step flows are unnecessary for most users.

---

## Part 2: Multi-Scheme Argument Support (Phase 2 Priority)

### 2.1 Theoretical Foundation

**Based on**: Walton, Macagno & Reed (2017) research and deliberation system overhaul strategy

**Key Insight**: Real arguments are **nets of schemes**, not single templates.

**Example - Policy Argument**:
- **Classification**: Classify state of affairs (Argument from Verbal Classification)
- **Evaluation**: Judge it positively/negatively (Argument from Values)
- **Action**: Suggest course of action (Practical Reasoning)
- **Prediction**: Forecast outcomes (Argument from Consequences)

Each passage = one scheme. Complete argument = **interdependent net**.

**Current Limitation**: AIFArgumentWithSchemeComposer can only create single-scheme arguments.

---

### 2.2 Gap Analysis: Multi-Scheme Creation

**What Works** ✅:
- Backend supports multi-scheme (ArgumentSchemeInstance model)
- API endpoints exist for adding/editing/removing schemes
- Display components (ArgumentCardV2) show multi-scheme arguments beautifully
- ComposedCQPanel aggregates CQs from all schemes

**What's Missing** ❌:
- No UI to add schemes to existing arguments
- No UI to create multi-scheme arguments from scratch
- No dependency editor (how schemes relate to each other)
- No pattern guidance (common scheme combinations)

**Impact**:
- Users forced to create separate arguments and manually link them
- Cannot model complex real-world arguments (80% of policy/legal/scientific reasoning)
- No way to leverage backend multi-scheme infrastructure

---

### 2.3 Feature #1: Post-Creation Scheme Addition (HIGH PRIORITY - 6 hours)

**Goal**: Let users add supporting schemes to existing arguments

**User Story**:
```
As a user who created a "Practical Reasoning" argument
I want to add an "Expert Opinion" scheme as supporting evidence
So that my argument becomes a 2-scheme net
```

**Implementation**:

**New Component**: `SchemeAdditionDialog.tsx`
```tsx
<SchemeAdditionDialog
  argumentId={argumentId}
  existingSchemes={argument.argumentSchemes || []}
  onSchemeAdded={(schemeInstanceId) => {
    // Refresh argument data
    window.dispatchEvent(
      new CustomEvent("arguments:changed", { 
        detail: { deliberationId, argumentId } 
      })
    );
  }}
>
  {/* Step 1: Select Scheme */}
  <SchemeSelector
    schemes={availableSchemes}
    onSelect={setSelectedScheme}
  />
  
  {/* Step 2: Configure Role */}
  <Select label="Role in Argument" value={role}>
    <SelectItem value="supporting">
      Supporting - Strengthens the primary argument
    </SelectItem>
    <SelectItem value="presupposed">
      Presupposed - Assumed by the primary argument
    </SelectItem>
    <SelectItem value="implicit">
      Implicit - Not stated but implied
    </SelectItem>
  </Select>
  
  {/* Step 3: Explicitness */}
  <Select label="Explicitness" value={explicitness}>
    <SelectItem value="explicit">
      Explicit - Clearly stated in argument text
    </SelectItem>
    <SelectItem value="presupposed">
      Presupposed - Assumed as background knowledge
    </SelectItem>
    <SelectItem value="implied">
      Implied - Can be inferred but not stated
    </SelectItem>
  </Select>
  
  {/* Step 4: Confidence */}
  <div>
    <Label>Confidence Level</Label>
    <Slider 
      value={confidence} 
      min={0} 
      max={1} 
      step={0.01}
      onChange={setConfidence}
    />
    <span className="text-xs text-muted-foreground">
      {Math.round(confidence * 100)}% - How strongly this scheme applies
    </span>
  </div>
  
  {/* Step 5: Text Evidence (Optional) */}
  <Textarea
    label="Text Evidence"
    placeholder="Quote or passage that shows this scheme being used..."
    value={textEvidence}
    onChange={e => setTextEvidence(e.target.value)}
  />
  
  {/* Step 6: Justification (Optional) */}
  <Textarea
    label="Justification"
    placeholder="Explain why this scheme applies to this argument..."
    value={justification}
    onChange={e => setJustification(e.target.value)}
  />
  
  <DialogFooter>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button onClick={handleAddScheme}>Add Scheme</Button>
  </DialogFooter>
</SchemeAdditionDialog>
```

**API Call**:
```typescript
async function handleAddScheme() {
  const response = await fetch(`/api/arguments/${argumentId}/schemes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schemeId: selectedScheme.id,
      role,
      explicitness,
      isPrimary: false,
      confidence,
      order: existingSchemes.length + 1,
      textEvidence: textEvidence || null,
      justification: justification || null,
    }),
  });
  
  const data = await response.json();
  onSchemeAdded(data.id);
}
```

**Integration Points**:

1. **ArgumentCardV2** - Add button in scheme section:
```tsx
<div className="flex items-center justify-between">
  <SchemesDisplay schemes={argument.argumentSchemes} />
  <Button 
    size="sm" 
    variant="ghost"
    onClick={() => setShowSchemeAddition(true)}
  >
    <Plus className="h-4 w-4 mr-1" />
    Add Scheme
  </Button>
</div>

{showSchemeAddition && (
  <SchemeAdditionDialog
    argumentId={argument.id}
    existingSchemes={argument.argumentSchemes}
    onSchemeAdded={handleSchemeAdded}
    onClose={() => setShowSchemeAddition(false)}
  />
)}
```

2. **ArgumentDetailPanel** (if exists) - Similar integration

**Tasks**:
1. Create SchemeAdditionDialog component (2h)
2. Create SchemeSelector with search/filter (1h)
3. Add role and explicitness selectors (1h)
4. Wire up POST /api/arguments/[id]/schemes (0.5h)
5. Integrate into ArgumentCardV2 (0.5h)
6. Test with various schemes and roles (1h)

**Benefits**:
- ✅ Unlocks multi-scheme arguments for all users
- ✅ Leverages existing backend infrastructure
- ✅ Non-breaking change (optional feature)
- ✅ Immediate value with minimal implementation

---

### 2.4 Feature #2: Dependency Editor (HIGH PRIORITY - 6 hours)

**Goal**: Let users specify how schemes relate to each other

**User Story**:
```
As a user with a 2-scheme argument
I want to specify that "Expert Opinion" feeds into "Practical Reasoning"
So that the logical flow is clear
```

**Dependency Types**:
- **Sequential**: Scheme A's conclusion feeds into Scheme B's premise
- **Presuppositional**: Scheme B assumes Scheme A is true
- **Support**: Scheme A strengthens Scheme B's argument
- **Justificational**: Scheme A justifies Scheme B's warrant

**New Component**: `DependencyEditor.tsx`
```tsx
<DependencyEditor
  argumentId={argumentId}
  schemes={argument.argumentSchemes}
  onDependenciesUpdated={() => { /* refresh */ }}
>
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold">Scheme Dependencies</h4>
      <Badge variant="outline">
        {schemes.length} schemes, {dependencies.length} dependencies
      </Badge>
    </div>
    
    {/* For each pair of schemes, show dependency */}
    {schemePairs.map(([schemeA, schemeB]) => (
      <div key={`${schemeA.id}-${schemeB.id}`} className="border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge>{schemeA.scheme.name}</Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge>{schemeB.scheme.name}</Badge>
        </div>
        
        <Select 
          value={getDependency(schemeA.id, schemeB.id)?.type}
          onValueChange={(type) => setDependency(schemeA.id, schemeB.id, type)}
        >
          <SelectItem value="none">No dependency</SelectItem>
          <SelectItem value="sequential">
            Sequential - A's conclusion feeds into B's premise
          </SelectItem>
          <SelectItem value="presuppositional">
            Presuppositional - B assumes A is true
          </SelectItem>
          <SelectItem value="support">
            Support - A strengthens B's argument
          </SelectItem>
          <SelectItem value="justificational">
            Justificational - A justifies B's warrant
          </SelectItem>
        </Select>
        
        {getDependency(schemeA.id, schemeB.id) && (
          <Textarea
            className="mt-2"
            placeholder="Explain the connection..."
            value={getDependency(schemeA.id, schemeB.id)?.explanation}
            onChange={(e) => updateExplanation(schemeA.id, schemeB.id, e.target.value)}
          />
        )}
      </div>
    ))}
  </div>
</DependencyEditor>
```

**Backend Storage**:
Option A: Store in ArgumentNet.dependencyGraph (JSON field)
```json
{
  "dependencies": [
    {
      "from": "scheme-instance-1",
      "to": "scheme-instance-2",
      "type": "sequential",
      "explanation": "Expert opinion provides warrant for practical reasoning"
    }
  ]
}
```

Option B: New DependencyEdge model (more structured)

**Tasks**:
1. Create DependencyEditor component (2h)
2. Implement dependency type selector (1h)
3. Add dependency storage (backend OR JSON field) (1h)
4. Integrate with ArgumentCardV2/DetailPanel (1h)
5. Update SchemeNetVisualization to show dependencies (1h)

**Benefits**:
- ✅ Makes argument structure explicit
- ✅ Enables proper net visualization
- ✅ Clarifies logical flow for reviewers
- ✅ Foundation for AI-assisted pattern matching

---

### 2.5 Feature #3: Pattern Library (MEDIUM PRIORITY - 8 hours)

**Goal**: Provide common multi-scheme templates

**User Story**:
```
As a policy analyst
I want to use the "Policy Argument" pattern
So that I don't have to manually add Classification → Values → Consequences → Action
```

**Common Patterns**:

**Policy Argument**:
- Classification (Argument from Verbal Classification)
- Values (Argument from Values)
- Consequences (Argument from Consequences)
- Action (Practical Reasoning)

**Authority Argument**:
- Expert (Argument from Expert Opinion)
- Commitment (Argument from Commitment)
- Action (Practical Reasoning)

**Scientific Argument**:
- Evidence (Argument from Evidence to Hypothesis)
- Causal (Argument from Cause to Effect)
- Prediction (Argument from Consequences)

**Legal Argument**:
- Precedent (Argument from Precedent)
- Classification (Argument from Verbal Classification)
- Rules (Argument from Rules)

**New Component**: `ArgumentPatternLibrary.tsx`
```tsx
<ArgumentPatternLibrary
  onPatternSelect={(pattern) => {
    // Apply pattern to new or existing argument
    applyPattern(pattern);
  }}
>
  <Tabs defaultValue="policy">
    <TabsList>
      <TabsTrigger value="policy">Policy</TabsTrigger>
      <TabsTrigger value="authority">Authority</TabsTrigger>
      <TabsTrigger value="scientific">Scientific</TabsTrigger>
      <TabsTrigger value="legal">Legal</TabsTrigger>
    </TabsList>
    
    <TabsContent value="policy">
      {policyPatterns.map(pattern => (
        <PatternCard key={pattern.id} pattern={pattern}>
          <div className="mb-3">
            <h4 className="font-semibold">{pattern.name}</h4>
            <p className="text-sm text-muted-foreground">{pattern.description}</p>
          </div>
          
          <div className="space-y-2 mb-3">
            {pattern.steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{idx + 1}</Badge>
                <span>{step.scheme.name}</span>
                <span className="text-xs text-muted-foreground">
                  — {step.role}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onPatternSelect(pattern)}>
              Use This Pattern
            </Button>
            <Button size="sm" variant="ghost" onClick={() => previewPattern(pattern)}>
              Preview
            </Button>
          </div>
        </PatternCard>
      ))}
    </TabsContent>
  </Tabs>
</ArgumentPatternLibrary>
```

**Pattern Application Flow**:
1. User selects pattern
2. System creates argument with primary scheme
3. System adds supporting schemes with correct roles
4. System sets up dependencies
5. User fills premises for each scheme

**Tasks**:
1. Design pattern data structure (1h)
2. Create ArgumentPatternLibrary component (2h)
3. Implement pattern catalog (policy, authority, scientific, legal) (2h)
4. Implement pattern application logic (2h)
5. Test patterns with real arguments (1h)

**Benefits**:
- ✅ Speeds up complex argument creation
- ✅ Educates users about argumentation theory
- ✅ Ensures consistency across similar arguments
- ✅ Reduces cognitive load for novice users

---

### 2.6 Feature #4: Argument Net Builder (ADVANCED - 20 hours)

**Goal**: Full wizard for creating SchemeNet records with explicit steps

**User Story**:
```
As an expert user
I want to create a serial net showing Expert Opinion → Sign Evidence → Causal Mechanism
With each step's confidence clearly specified
So that the system can identify the weakest link in my reasoning chain
```

**Context**: SchemeNet is different from multi-scheme arguments:
- **Multi-scheme**: Multiple schemes in one argument (ArgumentSchemeInstance)
- **SchemeNet**: Explicit sequential chain with per-step metadata (SchemeNetStep model)

**New Component**: `ArgumentNetBuilder.tsx`
```tsx
<ArgumentNetBuilder
  argumentId={argumentId}
  onComplete={(netId) => { /* refresh */ }}
>
  {/* Step 1: Net Type Selection */}
  <NetTypeSelector value={netType} onChange={setNetType}>
    <RadioGroup>
      <Radio value="serial">
        Serial Chain (A → B → C) - Most common
      </Radio>
      <Radio value="convergent">
        Convergent (A+B+C → D) - Multiple premises
      </Radio>
      <Radio value="divergent">
        Divergent (A → B, A → C, A → D) - Multiple conclusions
      </Radio>
      <Radio value="hybrid">
        Hybrid - Mixed structure
      </Radio>
    </RadioGroup>
  </NetTypeSelector>
  
  {/* Step 2: Add Steps */}
  <NetStepsEditor steps={steps} onStepsChange={setSteps}>
    {steps.map((step, idx) => (
      <StepCard key={step.id} order={idx + 1}>
        <SchemeSelector
          value={step.schemeId}
          onChange={(schemeId) => updateStep(idx, { schemeId })}
        />
        
        <Input
          label="Step Label"
          value={step.label}
          onChange={(e) => updateStep(idx, { label: e.target.value })}
          placeholder="e.g., Expert Consensus"
        />
        
        <Textarea
          label="Step Text"
          value={step.stepText}
          onChange={(e) => updateStep(idx, { stepText: e.target.value })}
          placeholder="The actual text from the argument..."
        />
        
        <Slider
          label="Confidence"
          value={step.confidence}
          onChange={(confidence) => updateStep(idx, { confidence })}
          min={0}
          max={1}
          step={0.01}
        />
        <span className="text-xs">{Math.round(step.confidence * 100)}%</span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeStep(idx)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </StepCard>
    ))}
    
    <Button onClick={addStep}>
      <Plus className="h-4 w-4 mr-1" />
      Add Step
    </Button>
  </NetStepsEditor>
  
  {/* Step 3: Dependencies (for serial/hybrid nets) */}
  {(netType === "serial" || netType === "hybrid") && (
    <DependencyEditor steps={steps}>
      {steps.map((step, idx) => (
        <DependencyRow key={step.id}>
          <span className="font-medium">
            Step {idx + 1}: {step.label}
          </span>
          
          <Select
            label="Feeds from"
            value={step.inputFromStep}
            onValueChange={(val) => updateStep(idx, { inputFromStep: val ? parseInt(val) : null })}
          >
            <SelectItem value={null}>None (first step)</SelectItem>
            {steps.slice(0, idx).map((prevStep) => (
              <SelectItem key={prevStep.order} value={prevStep.order.toString()}>
                Step {prevStep.order}: {prevStep.label}
              </SelectItem>
            ))}
          </Select>
          
          {step.inputFromStep && (
            <Textarea
              label="Slot Mapping (optional, JSON)"
              placeholder='{"A": "P1.conclusion", "B": "P2.premise"}'
              value={step.inputSlotMapping ? JSON.stringify(step.inputSlotMapping, null, 2) : ""}
              onChange={(e) => {
                try {
                  const mapping = JSON.parse(e.target.value);
                  updateStep(idx, { inputSlotMapping: mapping });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
            />
          )}
        </DependencyRow>
      ))}
    </DependencyEditor>
  )}
  
  {/* Step 4: Preview */}
  <NetPreview>
    <SchemeNetVisualization
      schemeNet={{
        steps: steps,
        overallConfidence: steps.length > 0 ? Math.min(...steps.map(s => s.confidence)) : 0,
      }}
    />
  </NetPreview>
  
  {/* Submit */}
  <DialogFooter>
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    <Button onClick={handleSubmit}>Create Net</Button>
  </DialogFooter>
</ArgumentNetBuilder>
```

**API Calls**:
```typescript
async function handleSubmit() {
  // 1. Create SchemeNet record
  const netResponse = await fetch("/api/nets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      argumentId,
      description: `${netType} net with ${steps.length} steps`,
      overallConfidence: Math.min(...steps.map(s => s.confidence)),
    }),
  });
  const { id: netId } = await netResponse.json();
  
  // 2. Create SchemeNetStep records
  for (const step of steps) {
    await fetch(`/api/nets/${netId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepOrder: step.order,
        schemeId: step.schemeId,
        label: step.label,
        stepText: step.stepText,
        confidence: step.confidence,
        inputFromStep: step.inputFromStep,
        inputSlotMapping: step.inputSlotMapping,
      }),
    });
  }
  
  onComplete(netId);
}
```

**Tasks**:
1. Create ArgumentNetBuilder wizard shell (3h)
2. Implement NetTypeSelector (1h)
3. Implement NetStepsEditor with add/remove/reorder (4h)
4. Implement DependencyEditor for steps (3h)
5. Implement slot mapping JSON editor (2h)
6. Wire up API calls (POST /api/nets, POST /api/nets/[id]/steps) (3h)
7. Integrate SchemeNetVisualization preview (2h)
8. Test all net types (serial, convergent, divergent, hybrid) (2h)

**Benefits**:
- ✅ Enables explicit serial nets with weakest link analysis
- ✅ Pedagogical tool for teaching argumentation
- ✅ Useful for scientific/legal arguments
- ✅ Complete multi-scheme infrastructure

---

### 2.7 Feature #5: Net Detection Transparency (LOW PRIORITY - 4 hours)

**Goal**: Show users when multi-scheme nets are detected

**User Story**:
```
As a user viewing an argument
I want to know if the system detected it as a multi-scheme net
So that I can confirm or correct the detection
```

**New Component**: `NetDetectionAlert.tsx`
```tsx
<NetDetectionAlert
  argumentId={argumentId}
  detection={netDetection}
  onConfirm={() => confirmNet(netDetection.netId)}
  onDismiss={() => dismissDetection(argumentId)}
  onEdit={() => openNetEditor(netDetection.netId)}
>
  <Alert>
    <Network className="h-4 w-4" />
    <AlertTitle>Multi-Scheme Net Detected</AlertTitle>
    <AlertDescription>
      <p className="mb-2">
        This argument uses {detection.schemeCount} schemes:
      </p>
      <div className="flex flex-wrap gap-1 mb-2">
        {detection.schemes.map(scheme => (
          <Badge key={scheme.id} variant="outline">
            {scheme.name}
          </Badge>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1 mb-3">
        <div>Detection method: {detection.method}</div>
        <div>Confidence: {Math.round(detection.confidence * 100)}%</div>
        <div>Signals: {detection.signals.join(", ")}</div>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" onClick={onConfirm}>
          Confirm Net Structure
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Treat as Single Scheme
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit Structure
        </Button>
      </div>
    </AlertDescription>
  </Alert>
</NetDetectionAlert>
```

**Integration**: Show in ArgumentCardV2 or ArgumentDetailPanel after detection

**Tasks**:
1. Create NetDetectionAlert component (1h)
2. Add detection state management (1h)
3. Wire up confirmation/dismissal actions (1h)
4. Test with auto-detected nets (1h)

**Benefits**:
- ✅ Transparency in AI detection
- ✅ User control over net structure
- ✅ Correct false positives/negatives

---

## Part 3: Implementation Roadmap

### Phase 2: Multi-Scheme Foundation (Week 1-2 - 12 hours)

**Goal**: Enable multi-scheme arguments with basic UI

**Priority**: P0 (CRITICAL - Unlocks 80% of real-world argument use cases)

**Features**:
1. **Post-Creation Scheme Addition** (6h) - HIGH
   - SchemeAdditionDialog component
   - Role/explicitness/confidence selectors
   - Integration with ArgumentCardV2
   - Wire up POST /api/arguments/[id]/schemes

2. **Dependency Editor** (6h) - HIGH
   - DependencyEditor component
   - Dependency type selector (sequential, presuppositional, support, justificational)
   - Store in ArgumentNet.dependencyGraph (JSON)
   - Update SchemeNetVisualization to show dependencies

**Deliverable**: Users can add supporting schemes to existing arguments and specify relationships.

**Testing Checklist**:
- ✅ Can add scheme to single-scheme argument
- ✅ Can specify role (supporting, presupposed, implicit)
- ✅ Can set explicitness level
- ✅ Can adjust confidence slider
- ✅ ArgumentCardV2 shows multi-scheme badge
- ✅ Dependencies save correctly
- ✅ SchemeNetVisualization displays dependencies

---

### Phase 3: Pattern Library & Guidance (Week 3-4 - 8 hours)

**Goal**: Help users create consistent multi-scheme arguments

**Priority**: P1 (HIGH - Improves UX and reduces cognitive load)

**Features**:
1. **Pattern Library** (8h) - MEDIUM
   - ArgumentPatternLibrary component
   - Pattern catalog (policy, authority, scientific, legal)
   - Pattern application logic
   - Pattern preview

**Deliverable**: Users can browse and apply common argument patterns (e.g., "Policy Argument" = Classification → Values → Consequences → Action).

**Testing Checklist**:
- ✅ Pattern library renders all categories
- ✅ Can preview pattern structure
- ✅ Can apply pattern to new argument
- ✅ Applied pattern creates multi-scheme argument correctly
- ✅ Dependencies set up automatically

---

### Phase 4: Advanced Net Builder (Week 5-7 - 24 hours)

**Goal**: Power user tools for explicit scheme nets

**Priority**: P2 (MEDIUM - Pedagogical value, scientific/legal arguments)

**Features**:
1. **Argument Net Builder** (20h) - ADVANCED
   - ArgumentNetBuilder wizard
   - Net type selector (serial, convergent, divergent, hybrid)
   - Step editor with add/remove/reorder
   - Dependency editor for steps
   - Slot mapping (JSON editor)
   - POST /api/nets and /api/nets/[id]/steps integration
   - SchemeNetVisualization preview

2. **Net Detection Transparency** (4h) - LOW
   - NetDetectionAlert component
   - Show detection confidence and signals
   - Confirm/dismiss/edit actions

**Deliverable**: Expert users can create SchemeNet records with explicit serial chains, per-step confidence, and weakest link analysis.

**Testing Checklist**:
- ✅ Can create serial net (A → B → C)
- ✅ Can create convergent net (A+B+C → D)
- ✅ Can set per-step confidence
- ✅ Can specify inputFromStep dependencies
- ✅ SchemeNetVisualization displays correctly
- ✅ Weakest link calculated accurately
- ✅ Net detection alert appears when appropriate

---

### Phase 5: Optional Enhancements (Future - 0 hours in immediate roadmap)

**Note**: These were part of the old ArgumentConstructor roadmap but are NOT needed for AIFArgumentWithSchemeComposer:

- ❌ **CQ Preview Panel** - Already shown in scheme selection
- ❌ **Wizard UI** - One-page form is simpler
- ❌ **Real-time Scoring** - Not needed for standard arguments
- ❌ **Template Customization** - Direct input is clearer

---

### Total Effort Summary

**Phase 2** (CRITICAL): 12 hours  
**Phase 3** (HIGH): 8 hours  
**Phase 4** (MEDIUM): 24 hours  

**Total Multi-Scheme Support**: 44 hours (~1 week full-time or 2-3 weeks part-time)

---

## Part 4: Success Metrics

### Functionality
- ✅ Users can add schemes to existing arguments via UI
- ✅ Dependencies between schemes are explicit and editable
- ✅ Common patterns available in library
- ✅ Expert users can create SchemeNet records
- ✅ Net detection is transparent

### UX
- ✅ Multi-scheme UI matches AIFArgumentWithSchemeComposer quality
- ✅ Scheme addition is discoverable (visible button)
- ✅ Dependency editor is intuitive
- ✅ Pattern library is helpful for novices
- ✅ Net builder provides clear guidance

### Integration
- ✅ POST /api/arguments/[id]/schemes works correctly
- ✅ ArgumentCardV2 shows multi-scheme badge
- ✅ ComposedCQPanel aggregates CQs from all schemes
- ✅ SchemeNetVisualization displays dependencies
- ✅ Events fire correctly (arguments:changed)

### Code Quality
- ✅ Type-safe props
- ✅ No console errors
- ✅ Lint passes
- ✅ Components reusable
- ✅ Good documentation

---

## Part 5: Migration Strategy

### For Developers

**No breaking changes**:
- AIFArgumentWithSchemeComposer remains single-scheme by default
- Multi-scheme features are additive (opt-in)
- Existing single-scheme creation flows unchanged

**New capabilities**:
- Post-creation: Users can enhance arguments with schemes
- Pattern-based: Users can start from templates
- Expert mode: Users can build explicit nets

**Timeline**:
1. **Phase 2** (Week 1-2): Multi-scheme addition UI deployed
2. **Phase 3** (Week 3-4): Pattern library available
3. **Phase 4** (Week 5-7): Net builder for power users

### For Users

**Gradual adoption**:
- Novice users: Continue single-scheme creation (no change)
- Intermediate users: Explore post-creation scheme addition (Phase 2)
- Advanced users: Use pattern library (Phase 3)
- Expert users: Build explicit nets (Phase 4)

**No forced complexity**:
- Multi-scheme features are optional
- Single-scheme arguments remain simple
- Progressive disclosure of advanced features

---

## Part 6: Next Steps

### Immediate (This Week)
1. ✅ Review updated roadmap with team
2. ✅ Approve Phase 2 priorities and scope
3. Begin Phase 2 implementation:
   - SchemeAdditionDialog component
   - DependencyEditor component
4. Set up feature flags for gradual rollout

### Short-term (2-4 Weeks)
1. Complete Phase 2
2. User testing with beta group (policy analysts, legal scholars)
3. Gather feedback
4. Iterate on UX

### Medium-term (1-2 Months)
1. Complete Phase 3 (pattern library)
2. Full production rollout
3. Monitor usage metrics (% multi-scheme arguments)
4. Collect pattern suggestions from users

### Long-term (3-6 Months)
1. Complete Phase 4 (net builder for experts)
2. AI-assisted pattern detection
3. Scheme suggestion system
4. Multi-scheme search and filtering

---

## Part 7: Conclusion

AIFArgumentWithSchemeComposer is now the consolidated, feature-complete solution for single-scheme argument creation. The consolidation removed -2,445 lines of code while adding taxonomy badges, variable hints, evidence requirements, and citation quality indicators.

**Remaining Gap**: Multi-scheme argument support

**Critical Path**:
1. **Phase 2** (12h): Post-creation scheme addition + dependency editor → Unblocks 80% of real-world use cases
2. **Phase 3** (8h): Pattern library → Improves consistency and reduces cognitive load
3. **Phase 4** (24h): Net builder → Enables expert pedagogical and scientific use cases

**Total Effort**: ~44 hours = 1 week full-time or 2-3 weeks part-time

**ROI Analysis**:
- **12 hours** (Phase 2) → Enables all multi-scheme argument use cases
- **20 hours** (+ Phase 3) → Pattern-driven creation, better UX
- **44 hours** (+ Phase 4) → Production-ready multi-scheme system with expert tools

**Recommendation**: Proceed with Phase 2 implementation (post-creation scheme addition + dependency editor, 12 hours total).

---

## Appendix: Multi-Scheme Arguments & Argument Nets - Complete Reference

**Date Added**: November 13, 2025  
**Last Updated**: November 13, 2025 (Post-Consolidation)  
**Research Question**: How do multi-scheme arguments, scheme hierarchies, and argument nets work from a UI/UX perspective - both creation and display flows?

### A.1 Current Implementation Status (November 2025)

#### Backend Infrastructure (Phase 1 - Complete ✅)

**Multi-Scheme Database Schema**:
```typescript
model Argument {
  id String @id
  schemeId String? // Legacy single scheme
  argumentSchemes ArgumentSchemeInstance[] // NEW: Multiple schemes
}

model ArgumentSchemeInstance {
  id String @id
  argumentId String
  schemeId String
  role "primary" | "supporting" | "presupposed" | "implicit"
  explicitness "explicit" | "presupposed" | "implied"
  isPrimary Boolean
  confidence Float // 0.0 to 1.0
  order Int
  textEvidence String?
  justification String?
  // Relationships
  argument Argument @relation
  scheme ArgumentScheme @relation
}
```

**ArgumentNet Model** (Phase 4 - Partial ✅):
```typescript
model ArgumentNet {
  id String @id
  netType String
  schemes ArgumentSchemeInstance[]
  dependencyGraph Json // Graph structure
  explicitnessAnalysis Json
  complexity Float
  confidence Float
  isConfirmed Boolean
}
```

#### API Endpoints (Phase 1 - Complete ✅)

**Scheme Management**:
- `GET /api/arguments/[id]` - Backward compatible (normalizes legacy → multi-scheme)
- `GET /api/arguments/[id]/schemes` - List all schemes with metadata
- `POST /api/arguments/[id]/schemes` - Add scheme to argument
- `PATCH /api/arguments/[id]/schemes/[instanceId]` - Update scheme
- `DELETE /api/arguments/[id]/schemes/[instanceId]` - Remove scheme

**Net Management**:
- `POST /api/nets/detect` - Detect if argument is multi-scheme net
- `GET /api/nets/[id]` - Fetch net data
- `POST /api/nets/[id]/confirm` - User confirms detected net
- `GET /api/nets/[id]/cqs` - Get composed CQ set

#### Utility Functions (Phase 1 - Complete ✅)

**File**: `lib/utils/argument-scheme-compat.ts`

```typescript
// Detection
usesMultiScheme(arg) // Check if uses new structure
usesLegacyScheme(arg) // Check if uses old structure

// Retrieval
getArgumentScheme(arg) // Get primary scheme
getArgumentSchemeId(arg) // Get primary scheme ID
getAllArgumentSchemes(arg) // Get all schemes with metadata

// Normalization
normalizeArgumentSchemes(arg) // Convert legacy → multi-scheme (virtual)

// Display
formatSchemeDisplay(arg) // "Practical Reasoning + 2 more"
shouldShowMultiSchemeUI(arg) // UI logic with feature flag
getSchemeBadgeVariant(arg) // Badge styling
getSchemeTooltip(arg) // "Primary: X • 2 supporting"
```

---

### A.2 Display/Viewing Flow (Current UX)

#### Single-Scheme Arguments (Legacy & New)

**ArgumentCardV2** component:
```tsx
<button onClick={() => setSchemeDialogOpen(true)}>
  <span>{schemeName}</span>
</button>
```

**User sees**:
- Simple scheme name badge (e.g., "Practical Reasoning")
- Click opens SchemeSpecificCQsModal
- Single set of CQs

#### Multi-Scheme Arguments (Phase 1 ✅)

**ArgumentCardV2** enhanced display:
```tsx
<button onClick={() => setSchemeDialogOpen(true)}>
  <span>{formatSchemeDisplay({ schemeName, schemes })}</span>
  {/* Shows "Primary + 2 more" if multi-scheme */}
  
  {shouldShowMultiSchemeUI({ schemeName, schemes }) && (
    <span className="count-badge">{schemes.length}</span>
  )}
</button>
```

**User sees**:
- Smart formatting: "Practical Reasoning + 2 more"
- Count badge (e.g., "3")
- Tooltip: "Primary: Practical Reasoning • 2 supporting schemes"

**Click behavior**: Opens enhanced modal:
- **ArgumentSchemeList**: All schemes with roles
- **MultiSchemeBadge** for each scheme
- **ComposedCQsModal**: CQs from ALL schemes, grouped

#### Scheme Net Visualization (Phase 5C ✅)

**SchemeNetVisualization** component:

```tsx
<SchemeNetVisualization argumentId={id}>
  {/* Header */}
  <div>
    <h3>Scheme Net (4 steps)</h3>
    <span>Overall confidence: 🟡 70% (weakest link)</span>
  </div>
  
  {/* Step-by-step flow */}
  {net.steps.map(step => (
    <div className="step">
      <div className="step-header">
        <Badge>Step {step.order}</Badge>
        <span>{step.scheme.name}</span>
        <span>{getConfidenceBadge(step.confidence)}</span>
      </div>
      
      {/* Expandable details */}
      {expanded && (
        <div>
          <div>Input from: Step {step.inputFromStep}</div>
          <div>Role: {step.label}</div>
          {showCQs && <CQList stepId={step.id} />}
        </div>
      )}
    </div>
  ))}
</SchemeNetVisualization>
```

**Features**:
- Linear top-to-bottom flow
- Confidence indicators (🟢🟡🔴)
- Weakest link highlighted
- Expandable steps (CQs, dependencies)

#### Composed CQ Panel (Phase 4 ✅)

**ComposedCQPanel** component:

```tsx
<ComposedCQPanel netId={netId}>
  {/* Grouping options */}
  <Select value={groupBy}>
    <SelectItem value="scheme">Group by Scheme</SelectItem>
    <SelectItem value="dependency">Group by Dependency</SelectItem>
    <SelectItem value="attack-type">Group by Attack Type</SelectItem>
  </Select>
  
  {/* CQ groups */}
  <Accordion>
    {groups.map(group => (
      <AccordionItem>
        <AccordionTrigger>
          <span>{group.groupLabel}</span>
          <Badge>{group.questions.length} questions</Badge>
        </AccordionTrigger>
        <AccordionContent>
          {group.questions.map(cq => (
            <CQCard question={cq} />
          ))}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
</ComposedCQPanel>
```

**CQ Types in Nets**:
1. **Scheme CQs**: Standard questions from individual schemes
2. **Dependency CQs**: Questions about links between schemes
3. **Net-structure CQs**: Questions about overall strategy
4. **Explicitness CQs**: Questions about presupposed/implied schemes

---

### A.3 Creation Flow Gaps (CRITICAL MISSING UI 🔴)

#### Current: Single-Scheme Only

**AIFArgumentWithSchemeComposer**:
```
1. Select scheme from catalog
2. Fill conclusion
3. Fill premises (structured or freeform)
4. Add citations
5. Submit → creates single-scheme argument
```

**Limitation**: Can only select **one scheme**

#### Missing: Multi-Scheme Creation UI

**What's Needed**:

**Option A: Post-Creation Enhancement** (6 hours - Phase 2):
```tsx
// After argument created
<ArgumentCardV2>
  <SchemesSection>
    <Button onClick={addScheme}>
      + Add Scheme
    </Button>
  </SchemesSection>
</ArgumentCardV2>

// Opens SchemeAdditionDialog
<SchemeAdditionDialog>
  <SchemeSelector />
  <RoleSelector /> // supporting, presupposed, implicit
  <ExplicitnessSelector /> // explicit, presupposed, implied
  <ConfidenceSlider />
  <TextEvidenceField />
</SchemeAdditionDialog>
```

**Option B: Pattern-Based Creation** (8 hours - Phase 3):
```tsx
// Pattern library
<ArgumentPatternLibrary>
  <PatternCard pattern="Policy Argument">
    <ol>
      <li>Classification (Argument from Verbal Classification)</li>
      <li>Values (Argument from Values)</li>
      <li>Consequences (Argument from Consequences)</li>
      <li>Action (Practical Reasoning)</li>
    </ol>
    <Button onClick={applyPattern}>Use This Pattern</Button>
  </PatternCard>
</ArgumentPatternLibrary>
```

**Option C: Net Builder Wizard** (20 hours - Phase 4):
```tsx
<ArgumentNetBuilder>
  <NetTypeSelector /> // serial, convergent, divergent, hybrid
  <NetStepsEditor /> // add/remove/reorder steps
  <DependencyEditor /> // specify step dependencies
  <Preview /> // SchemeNetVisualization
</ArgumentNetBuilder>
```

---

### A.4 Recommended Phased Approach

**Phase 2** (12 hours):
- Post-creation scheme addition (6h)
- Dependency editor (6h)
- **Unlocks**: 80% of multi-scheme use cases

**Phase 3** (8 hours):
- Pattern library (8h)
- **Unlocks**: Guided creation, consistency

**Phase 4** (24 hours):
- Net builder wizard (20h)
- Net detection transparency (4h)
- **Unlocks**: Expert pedagogical tools

---

### A.5 Common Multi-Scheme Patterns

#### Policy Argument
1. **Classification** (Argument from Verbal Classification)
   - "This situation is an instance of X"
2. **Values** (Argument from Values)
   - "X is good/bad according to value V"
3. **Consequences** (Argument from Consequences)
   - "Action A leads to outcome O"
4. **Action** (Practical Reasoning)
   - "We should do A to achieve goal G"

**Dependencies**: Sequential (1→2→3→4)

#### Authority Argument
1. **Expert** (Argument from Expert Opinion)
   - "Expert E says P"
2. **Commitment** (Argument from Commitment)
   - "If E says P, then P is true"
3. **Action** (Practical Reasoning)
   - "Therefore, we should act on P"

**Dependencies**: Sequential (1→2→3)

#### Scientific Argument
1. **Evidence** (Argument from Evidence to Hypothesis)
   - "Data D supports hypothesis H"
2. **Causal** (Argument from Cause to Effect)
   - "H explains mechanism M"
3. **Prediction** (Argument from Consequences)
   - "If H is true, we predict P"

**Dependencies**: Sequential (1→2→3)

---

### A.6 User Stories for Multi-Scheme Arguments

**Story 1: Policy Analyst** (Phase 2)
```
As a policy analyst
I want to add a "Values" scheme to my "Practical Reasoning" argument
So that I can show the ethical foundation for my policy proposal

Currently: Must create separate arguments
Future: Click "Add Scheme" button after creation
```

**Story 2: Novice Debater** (Phase 3)
```
As a new user
I want to use the "Policy Argument" pattern
So that I don't have to figure out which schemes to combine

Currently: No guidance on multi-scheme patterns
Future: Browse pattern library, apply with one click
```

**Story 3: Expert User** (Phase 4)
```
As an expert user
I want to create a serial net with per-step confidence
So that I can show the weakest link in my reasoning chain

Currently: Must use seed scripts
Future: Use ArgumentNetBuilder wizard
```

---

### A.7 Critical Path Summary

**Critical Path**:
1. **Phase 2** (12h): Post-creation scheme addition + dependency editor
   - **ROI**: Unlocks 80% of real-world multi-scheme use cases
   - **User Impact**: Can now model complex arguments (policy, legal, scientific)

2. **Phase 3** (8h): Pattern library
   - **ROI**: Speeds up creation, improves consistency
   - **User Impact**: Guided workflows, educational value

3. **Phase 4** (24h): Net builder + transparency
   - **ROI**: Enables pedagogical and expert use cases
   - **User Impact**: Serial nets with weakest link analysis

**Total**: 44 hours (~1 week full-time or 2-3 weeks part-time)

---

### A.8 API Call Examples

**Add Scheme to Existing Argument** (Phase 2):
```typescript
POST /api/arguments/arg-123/schemes
{
  "schemeId": "expert-opinion",
  "role": "supporting",
  "explicitness": "explicit",
  "isPrimary": false,
  "confidence": 0.85,
  "order": 2,
  "textEvidence": "As Dr. Smith states...",
  "justification": "Expert opinion provides warrant"
}
```

**Create SchemeNet** (Phase 4):
```typescript
// 1. Create net
POST /api/nets
{
  "argumentId": "arg-123",
  "description": "Serial chain: Expert → Sign → Causal",
  "overallConfidence": 0.88
}

// 2. Add steps
POST /api/nets/net-456/steps
{
  "stepOrder": 1,
  "schemeId": "expert-opinion",
  "label": "Expert Consensus",
  "stepText": "Climate scientists agree...",
  "confidence": 0.95,
  "inputFromStep": null
}
```

---

**End of Appendix**
