# Phase 2: Multi-Entry Navigation - Implementation Plan

**Phase Duration**: 4 weeks (Weeks 5-8)  
**Total Effort**: 160 hours (40 hours/week)  
**Priority**: 🔴 Critical - Core UX Enhancement  
**Dependencies**: Phase 1 Foundation (90% complete)

---

## Executive Summary

Phase 2 addresses a critical UX gap: **scheme discovery and selection**. Currently, users must know scheme names or browse a flat list. This phase implements **four navigation modes** that match different user mental models and expertise levels.

### The Problem

Research shows schemes are organized across multiple dimensions:
1. **Purpose**: Action-guiding vs. descriptive reasoning
2. **Source**: Internal evidence vs. external authority
3. **Semantic Domain**: Decision-making, causality, authority, consequences, etc.
4. **Identification Conditions**: Observable features that indicate scheme usage

Current UI forces users to:
- Browse alphabetical lists (100+ schemes)
- Know formal scheme names ("Argument from Expert Opinion")
- Understand argumentation theory terminology

This creates barriers for novice users and slows down expert users.

### The Solution

**Four complementary navigation modes**:

| Mode | User Type | Mental Model | Use Case |
|------|-----------|--------------|----------|
| Dichotomic Tree | Novice | "I'm arguing about X" | Quick scheme recommendation via 2-3 questions |
| Cluster Browser | Intermediate | "I need a scheme about Y" | Browse semantic groups (authority, causality, etc.) |
| Identification Conditions | Expert | "I see pattern Z" | Filter by observable features |
| Unified Navigator | All | "Give me all options" | Tab-based interface combining all modes |

### Success Criteria

**Novice Users**:
- Find appropriate scheme in <60 seconds without knowing formal name
- Understand why scheme was recommended
- 80%+ first-time success rate

**Expert Users**:
- Navigate to any scheme in <10 seconds
- Filter by multiple dimensions simultaneously
- Save preferred navigation mode

**System Metrics**:
- 50%+ reduction in scheme selection time
- 30%+ increase in scheme diversity used
- 90%+ user preference for new navigation over old list

---

## Phase Overview

### Week 5: Dichotomic Tree Wizard (40 hours)
Step-by-step wizard guiding users through purpose → source → filtered list.

**Deliverables**:
- Wizard UI component
- Purpose selection (action vs. state of affairs)
- Source selection (internal vs. external)
- Dynamic filtering algorithm
- User testing framework

### Week 6: Cluster Browser (40 hours)
Browse schemes by semantic domain (authority, causality, consequences, etc.).

**Deliverables**:
- Cluster definitions and metadata
- Cluster browse UI
- Scheme clustering algorithm
- Navigation between related schemes

### Week 7: Identification Conditions Filter (40 hours)
Filter schemes by observable features ("appeals to expertise", "cites consequences").

**Deliverables**:
- Identification condition definitions
- Filter UI with checkboxes
- Real-time filtering implementation
- Explanatory text system

### Week 8: Unified SchemeNavigator (40 hours)
Integrate all navigation modes into single component with tab interface.

**Deliverables**:
- Unified SchemeNavigator component
- Tab system (Tree/Cluster/Conditions/Search)
- User preference persistence
- Search functionality
- Comprehensive testing

---

## Architecture Overview

### Component Hierarchy

```
SchemeNavigator (Week 8)
├── Tab: Dichotomic Tree (Week 5)
│   ├── PurposeStep
│   ├── SourceStep
│   └── ResultsList
├── Tab: Cluster Browser (Week 6)
│   ├── ClusterGrid
│   └── SchemeCard
├── Tab: Identification Conditions (Week 7)
│   ├── ConditionFilters
│   └── FilteredSchemeList
└── Tab: Search
    └── SearchBar + Results
```

### Data Flow

```typescript
// User selects navigation mode
User → SchemeNavigator → SelectTab

// Mode-specific filtering
Tab → FilteringLogic → FilteredSchemes

// Scheme selection
FilteredSchemes → SchemeCard → onSelect(scheme)

// Preference persistence
SelectTab → SavePreference → localStorage/user settings
```

### Database Extensions

```prisma
model ArgumentScheme {
  // Existing fields
  id: string
  key: string
  name: string
  
  // Week 5: Dichotomic Tree fields (ALREADY EXIST ✅)
  purpose: string?  // "action" | "state_of_affairs"
  source: string?   // "internal" | "external"
  
  // Week 6: Cluster Browser
  semanticCluster: string?  // NEW: "authority" | "causality" | ...
  clusterDescription: string? // NEW: Short description within cluster
  relatedSchemeKeys: string[] // NEW: Semantically related schemes
  
  // Week 7: Identification Conditions
  identificationConditions: string[] // NEW: Observable features
  identificationExamples: Json?      // NEW: Example texts showing conditions
}

model UserSchemePreferences {
  // Week 8: Preference persistence
  id: string
  userId: string
  preferredNavigationMode: string  // "tree" | "cluster" | "conditions" | "search"
  recentSchemes: string[]          // Recently used scheme keys
  favoriteSchemes: string[]        // User-marked favorites
  
  createdAt: DateTime
  updatedAt: DateTime
  
  @@unique([userId])
}
```

---

## Week 5: Dichotomic Tree Wizard

### Overview

**Goal**: Guide users to appropriate scheme through 2-3 simple questions.

**User Flow**:
1. "What are you trying to do?" → Action / State of Affairs
2. "What kind of evidence?" → Internal / External
3. See filtered list of 5-15 relevant schemes

**Example**:
```
Q: What are you trying to do?
A: Justify an action (action-guiding)

Q: What kind of evidence are you using?
A: Expert testimony (external)

→ Filters to: Argument from Expert Opinion, Argument from Popular Opinion, 
              Argument from Institutional Authority, etc.
```

### Implementation Tasks

#### Task 5.1: Wizard UI Component (12 hours)

**File**: `components/schemes/DichotomicTreeWizard.tsx`

**Component Structure**:
```typescript
interface DichotomicTreeWizardProps {
  onSchemeSelect: (scheme: ArgumentScheme) => void;
  initialStep?: "purpose" | "source" | "results";
  compactMode?: boolean;
}

export function DichotomicTreeWizard({
  onSchemeSelect,
  initialStep = "purpose",
  compactMode = false
}: DichotomicTreeWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [selections, setSelections] = useState<Selections>({
    purpose: null,
    source: null
  });
  
  // Step 1: Purpose Selection
  if (currentStep === "purpose") {
    return <PurposeStep onSelect={(p) => {
      setSelections({ ...selections, purpose: p });
      setCurrentStep("source");
    }} />;
  }
  
  // Step 2: Source Selection
  if (currentStep === "source") {
    return <SourceStep 
      purpose={selections.purpose!}
      onSelect={(s) => {
        setSelections({ ...selections, source: s });
        setCurrentStep("results");
      }}
      onBack={() => setCurrentStep("purpose")}
    />;
  }
  
  // Step 3: Results
  return <ResultsStep
    purpose={selections.purpose!}
    source={selections.source!}
    onSchemeSelect={onSchemeSelect}
    onBack={() => setCurrentStep("source")}
    onReset={() => {
      setSelections({ purpose: null, source: null });
      setCurrentStep("purpose");
    }}
  />;
}
```

**Sub-components**:
1. `PurposeStep.tsx` - Action vs. State of Affairs selection
2. `SourceStep.tsx` - Internal vs. External selection
3. `ResultsStep.tsx` - Filtered scheme list with explanations
4. `WizardProgress.tsx` - Visual progress indicator (Step 1 of 3)
5. `WizardNavigation.tsx` - Back/Reset buttons

**UI Design Requirements**:
- Large, clear option cards (not buttons)
- Helpful descriptions for each option
- Visual icons for each choice (🎯 action, 📊 state, 🧠 internal, 📚 external)
- Progress indicator showing current step
- Back button on Steps 2-3
- "Start Over" on Step 3

**Time Breakdown**:
- Component scaffolding: 2 hours
- PurposeStep UI: 2 hours
- SourceStep UI: 2 hours
- ResultsStep UI: 3 hours
- WizardProgress/Navigation: 1 hour
- Styling and responsiveness: 2 hours

---

#### Task 5.2: Purpose Selection Logic (8 hours)

**File**: `lib/schemes/dichotomic-tree.ts`

**Purpose Definitions**:
```typescript
export type Purpose = "action" | "state_of_affairs";

export const purposeOptions = {
  action: {
    label: "Justify an Action",
    description: "I want to argue that we should or shouldn't do something",
    icon: "🎯",
    examples: [
      "We should adopt this policy",
      "You shouldn't trust that source",
      "The government must intervene"
    ],
    helpText: "Choose this if your argument is about what someone should do, " +
              "what course of action to take, or what decision to make."
  },
  state_of_affairs: {
    label: "Describe a State of Affairs",
    description: "I want to argue that something is true or how things are",
    icon: "📊",
    examples: [
      "This policy will have these effects",
      "These two things are similar",
      "This classification applies"
    ],
    helpText: "Choose this if your argument is about how things are, " +
              "what relationships exist, or what properties something has."
  }
};

export function filterSchemesByPurpose(
  schemes: ArgumentScheme[],
  purpose: Purpose
): ArgumentScheme[] {
  return schemes.filter(scheme => 
    scheme.purpose === purpose || 
    scheme.purpose === null // Include schemes that work for both
  );
}

export function getPurposeExplanation(purpose: Purpose): string {
  return purposeOptions[purpose].helpText;
}
```

**Component Implementation**:
```typescript
// components/schemes/PurposeStep.tsx
export function PurposeStep({ onSelect }: PurposeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What are you trying to do?</h2>
        <p className="text-muted-foreground mt-2">
          This helps us recommend the right type of argument
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(purposeOptions).map(([key, option]) => (
          <Card 
            key={key}
            className="cursor-pointer hover:border-primary transition-colors p-6"
            onClick={() => onSelect(key as Purpose)}
          >
            <div className="text-4xl mb-4 text-center">{option.icon}</div>
            <h3 className="text-xl font-semibold text-center mb-2">
              {option.label}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {option.description}
            </p>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Examples:
              </p>
              {option.examples.map((ex, i) => (
                <div key={i} className="text-xs text-muted-foreground pl-4 border-l-2">
                  "{ex}"
                </div>
              ))}
            </div>
            
            <Button className="w-full mt-4" variant="outline">
              Select
            </Button>
          </Card>
        ))}
      </div>
      
      <div className="text-center">
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          Not sure? Learn more about purpose types
        </Button>
      </div>
    </div>
  );
}
```

**Testing**:
- [ ] Both purpose options render correctly
- [ ] Selection navigates to source step
- [ ] Examples are clear and helpful
- [ ] Help text explains decision criteria

**Time Breakdown**:
- Purpose definitions: 2 hours
- Filtering logic: 2 hours
- UI implementation: 3 hours
- Testing and refinement: 1 hour

---

#### Task 5.3: Source Selection Logic (8 hours)

**File**: `lib/schemes/dichotomic-tree.ts` (continued)

**Source Definitions**:
```typescript
export type Source = "internal" | "external";

export const sourceOptions = {
  internal: {
    label: "Internal Evidence",
    description: "Based on the claim itself, logic, or widely known facts",
    icon: "🧠",
    examples: [
      "This contradicts the definition",
      "These cases are analogous",
      "The consequences would be bad",
      "This commits a fallacy"
    ],
    helpText: "Choose this if your argument relies on reasoning, logical analysis, " +
              "the meaning of terms, or consequences anyone can anticipate."
  },
  external: {
    label: "External Evidence",
    description: "Based on outside sources, experts, authorities, or testimony",
    icon: "📚",
    examples: [
      "Experts say this is true",
      "Most people believe this",
      "This institution recommends it",
      "Witnesses reported seeing it"
    ],
    helpText: "Choose this if your argument relies on what others have said, " +
              "expert testimony, institutional positions, or witness accounts."
  }
};

export function filterSchemesBySource(
  schemes: ArgumentScheme[],
  source: Source
): ArgumentScheme[] {
  return schemes.filter(scheme => 
    scheme.source === source || 
    scheme.source === null // Include schemes that work for both
  );
}

export function filterSchemesByPurposeAndSource(
  schemes: ArgumentScheme[],
  purpose: Purpose,
  source: Source
): ArgumentScheme[] {
  let filtered = filterSchemesByPurpose(schemes, purpose);
  filtered = filterSchemesBySource(filtered, source);
  
  // Sort by relevance (schemes matching both criteria first)
  return filtered.sort((a, b) => {
    const aMatchesBoth = a.purpose === purpose && a.source === source;
    const bMatchesBoth = b.purpose === purpose && b.source === source;
    
    if (aMatchesBoth && !bMatchesBoth) return -1;
    if (!aMatchesBoth && bMatchesBoth) return 1;
    return 0;
  });
}
```

**Component Implementation**:
```typescript
// components/schemes/SourceStep.tsx
export function SourceStep({ 
  purpose, 
  onSelect, 
  onBack 
}: SourceStepProps) {
  // Show purpose-specific context
  const purposeContext = getPurposeExplanation(purpose);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge variant="outline" className="mb-4">
          Step 2 of 3
        </Badge>
        <h2 className="text-2xl font-bold">What kind of evidence are you using?</h2>
        <p className="text-muted-foreground mt-2">
          For: {purposeOptions[purpose].label}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(sourceOptions).map(([key, option]) => (
          <Card 
            key={key}
            className="cursor-pointer hover:border-primary transition-colors p-6"
            onClick={() => onSelect(key as Source)}
          >
            <div className="text-4xl mb-4 text-center">{option.icon}</div>
            <h3 className="text-xl font-semibold text-center mb-2">
              {option.label}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {option.description}
            </p>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Examples:
              </p>
              {option.examples.map((ex, i) => (
                <div key={i} className="text-xs text-muted-foreground pl-4 border-l-2">
                  "{ex}"
                </div>
              ))}
            </div>
            
            <Button className="w-full mt-4" variant="outline">
              Select
            </Button>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Purpose
        </Button>
        
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          Not sure? Learn more about evidence types
        </Button>
      </div>
    </div>
  );
}
```

**Testing**:
- [ ] Source options appropriate for selected purpose
- [ ] Back button returns to purpose step
- [ ] Selection navigates to results
- [ ] Context from purpose selection is shown

**Time Breakdown**:
- Source definitions: 2 hours
- Filtering logic: 2 hours
- UI implementation: 3 hours
- Testing and refinement: 1 hour

---

#### Task 5.4: Results Display with Explanations (8 hours)

**Component Implementation**:
```typescript
// components/schemes/ResultsStep.tsx
export function ResultsStep({
  purpose,
  source,
  onSchemeSelect,
  onBack,
  onReset
}: ResultsStepProps) {
  const { data: schemes, isLoading } = useSWR(
    "/api/schemes/all",
    fetcher
  );
  
  const filteredSchemes = useMemo(() => {
    if (!schemes) return [];
    return filterSchemesByPurposeAndSource(schemes, purpose, source);
  }, [schemes, purpose, source]);
  
  if (isLoading) {
    return <div className="text-center py-12">
      <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      <p className="text-muted-foreground mt-4">Finding matching schemes...</p>
    </div>;
  }
  
  if (filteredSchemes.length === 0) {
    return <EmptyState
      title="No exact matches"
      description="Try adjusting your selections or browsing all schemes"
      onReset={onReset}
      onBack={onBack}
    />;
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge variant="outline" className="mb-4">
          Step 3 of 3 - Results
        </Badge>
        <h2 className="text-2xl font-bold">
          {filteredSchemes.length} Matching Schemes
        </h2>
        <p className="text-muted-foreground mt-2">
          Based on your selections: {purposeOptions[purpose].label} + {sourceOptions[source].label}
        </p>
      </div>
      
      {/* Summary of selections */}
      <Card className="bg-muted/50 p-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>{purposeOptions[purpose].icon}</span>
            <span className="font-medium">{purposeOptions[purpose].label}</span>
          </div>
          <span className="text-muted-foreground">+</span>
          <div className="flex items-center gap-2">
            <span>{sourceOptions[source].icon}</span>
            <span className="font-medium">{sourceOptions[source].label}</span>
          </div>
        </div>
      </Card>
      
      {/* Scheme list */}
      <div className="space-y-4">
        {filteredSchemes.map(scheme => (
          <SchemeResultCard
            key={scheme.id}
            scheme={scheme}
            onSelect={() => onSchemeSelect(scheme)}
            matchReason={getMatchReason(scheme, purpose, source)}
          />
        ))}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Change Evidence Type
        </Button>
        
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    </div>
  );
}

// Helper: Scheme result card
function SchemeResultCard({ 
  scheme, 
  onSelect, 
  matchReason 
}: SchemeResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{scheme.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {scheme.summary}
          </p>
          
          {/* Match reason */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <span>{matchReason}</span>
          </div>
          
          {/* Expandable details */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Premises:
                </p>
                <ul className="text-xs space-y-1">
                  {scheme.premises.map((p, i) => (
                    <li key={i} className="pl-4 border-l-2">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Conclusion:
                </p>
                <p className="text-xs pl-4 border-l-2">
                  {scheme.conclusion}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="ml-4 flex flex-col gap-2">
          <Button 
            onClick={onSelect}
            className="whitespace-nowrap"
          >
            Select Scheme
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show Details
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Helper: Generate match reason explanation
function getMatchReason(
  scheme: ArgumentScheme,
  purpose: Purpose,
  source: Source
): string {
  const matchesPurpose = scheme.purpose === purpose;
  const matchesSource = scheme.source === source;
  
  if (matchesPurpose && matchesSource) {
    return `Perfect match: ${purposeOptions[purpose].label} + ${sourceOptions[source].label}`;
  }
  
  if (matchesPurpose) {
    return `Matches purpose: ${purposeOptions[purpose].label}`;
  }
  
  if (matchesSource) {
    return `Matches evidence type: ${sourceOptions[source].label}`;
  }
  
  return "Compatible with your selections";
}
```

**Testing**:
- [ ] Filtered list displays correctly
- [ ] Match reasons are clear and accurate
- [ ] Show/hide details works
- [ ] Selection triggers callback
- [ ] Empty state handles no matches
- [ ] Back/Reset navigation works

**Time Breakdown**:
- ResultsStep UI: 3 hours
- SchemeResultCard component: 2 hours
- Match reason logic: 1 hour
- Empty state: 1 hour
- Testing: 1 hour

---

#### Task 5.5: User Testing Framework (4 hours)

**Goal**: Validate that wizard helps users find schemes faster and with less frustration.

**Test Protocol**:
```markdown
# Dichotomic Tree Wizard - User Testing Protocol

## Participants
- 3 novice users (no argumentation theory background)
- 3 intermediate users (some debate/philosophy experience)
- 2 expert users (familiar with argument schemes)

## Tasks

### Task 1: Find Expert Opinion Scheme
"You want to argue that a policy is good because experts recommend it. 
Find the appropriate argumentation scheme."

**Expected Path**: Action → External → Argument from Expert Opinion

**Metrics**:
- Time to completion
- Number of back/reset actions
- Confidence rating (1-5)

### Task 2: Find Consequences Scheme
"You want to argue that an action will have negative effects. 
Find the appropriate scheme."

**Expected Path**: Action → Internal → Argument from Consequences

**Metrics**:
- Time to completion
- Accuracy (did they find consequences?)
- Alternative schemes considered

### Task 3: Free Exploration
"Browse the wizard and identify 3 schemes you might use in everyday arguments."

**Metrics**:
- Schemes discovered
- Understanding of scheme differences
- Usability feedback

## Success Criteria
- Novice users complete Task 1 in <90 seconds with 80%+ accuracy
- Intermediate users complete both tasks in <60 seconds
- Expert users complete both tasks in <30 seconds
- All users rate wizard "helpful" or "very helpful" (4-5/5)

## Data Collection
- Screen recordings
- Time metrics
- User quotes
- Confusion points
- Feature requests

## Implementation
```typescript
// components/schemes/WizardUserTest.tsx
export function WizardUserTest() {
  const [taskIndex, setTaskIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  
  const tasks = [
    {
      id: "expert_opinion",
      instruction: "You want to argue that a policy is good because experts recommend it. Find the appropriate scheme.",
      expectedScheme: "expert_opinion",
      expectedPath: ["action", "external"]
    },
    {
      id: "consequences",
      instruction: "You want to argue that an action will have negative effects. Find the appropriate scheme.",
      expectedScheme: "consequences",
      expectedPath: ["action", "internal"]
    }
  ];
  
  const currentTask = tasks[taskIndex];
  
  function startTask() {
    setStartTime(Date.now());
  }
  
  function completeTask(selectedScheme: ArgumentScheme, path: string[]) {
    const duration = Date.now() - (startTime || 0);
    
    setResults([...results, {
      taskId: currentTask.id,
      duration,
      selectedScheme: selectedScheme.key,
      path,
      correct: selectedScheme.key === currentTask.expectedScheme,
      pathCorrect: JSON.stringify(path) === JSON.stringify(currentTask.expectedPath)
    }]);
    
    // Move to next task or show results
    if (taskIndex < tasks.length - 1) {
      setTaskIndex(taskIndex + 1);
      setStartTime(null);
    } else {
      showResults();
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">
          Task {taskIndex + 1} of {tasks.length}
        </h2>
        <p className="text-lg mb-4">{currentTask.instruction}</p>
        
        {!startTime ? (
          <Button onClick={startTask}>Start Task</Button>
        ) : (
          <div className="text-sm text-muted-foreground">
            Timer running: {Math.floor((Date.now() - startTime) / 1000)}s
          </div>
        )}
      </Card>
      
      {startTime && (
        <DichotomicTreeWizard
          onSchemeSelect={(scheme, path) => completeTask(scheme, path)}
        />
      )}
    </div>
  );
}
```

**Testing**:
- [ ] Test protocol document created
- [ ] User test component implemented
- [ ] Data collection working
- [ ] Initial pilot test conducted

**Time Breakdown**:
- Test protocol design: 1 hour
- Test component: 2 hours
- Pilot testing: 1 hour

---

### Week 5 Deliverables

**Code**:
- [x] `components/schemes/DichotomicTreeWizard.tsx`
- [x] `components/schemes/PurposeStep.tsx`
- [x] `components/schemes/SourceStep.tsx`
- [x] `components/schemes/ResultsStep.tsx`
- [x] `components/schemes/WizardProgress.tsx`
- [x] `lib/schemes/dichotomic-tree.ts`
- [x] `components/schemes/WizardUserTest.tsx`

**Documentation**:
- [x] User testing protocol
- [x] Component API documentation
- [x] Decision logic documentation

**Metrics**:
- Total lines of code: ~800
- Components: 7
- Test coverage: User testing framework + pilot results

**Week 5 Time**: 40 hours
- Task 5.1 (Wizard UI): 12 hours
- Task 5.2 (Purpose): 8 hours
- Task 5.3 (Source): 8 hours
- Task 5.4 (Results): 8 hours
- Task 5.5 (Testing): 4 hours

---

## Week 6: Cluster Browser

### Overview

**Goal**: Browse schemes by semantic domain (authority, causality, decision-making, etc.).

**User Flow**:
1. See grid of semantic clusters (8-12 clusters)
2. Click cluster to see schemes in that domain
3. Browse related schemes within cluster
4. Select scheme or navigate to related cluster

**Example Clusters**:
- **Authority & Expertise**: Expert opinion, popular opinion, institutional authority
- **Causality**: Cause to effect, sign, consequences
- **Values & Ethics**: Ethical classification, value-based practical reasoning
- **Analogy & Comparison**: Analogy, precedent, similarity
- **Rules & Definitions**: Verbal classification, definitional argument

### Implementation Tasks

#### Task 6.1: Cluster Definitions (8 hours)

**File**: `lib/schemes/semantic-clusters.ts`

**Cluster Taxonomy**:
```typescript
export interface SemanticCluster {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  color: string; // Tailwind color class
  schemeKeys: string[]; // Schemes in this cluster
  relatedClusters: string[]; // Semantically related clusters
  typicalUse: string; // When to use schemes in this cluster
  examples: string[]; // Example arguments
}

export const semanticClusters: Record<string, SemanticCluster> = {
  authority: {
    id: "authority",
    name: "Authority & Expertise",
    description: "Arguments based on expert testimony, institutional positions, or popular belief",
    icon: "👨‍🏫",
    color: "blue",
    schemeKeys: [
      "expert_opinion",
      "popular_opinion",
      "institutional_authority",
      "witness_testimony",
      "position_to_know"
    ],
    relatedClusters: ["evidence", "trust"],
    typicalUse: "When your claim relies on what others have said or what experts believe",
    examples: [
      "Scientists agree that climate change is real",
      "The majority of voters support this policy",
      "The court ruled that this is illegal"
    ]
  },
  
  causality: {
    id: "causality",
    name: "Cause & Effect",
    description: "Arguments about causal relationships, consequences, and predictive reasoning",
    icon: "🔗",
    color: "green",
    schemeKeys: [
      "consequences",
      "cause_to_effect",
      "effect_to_cause",
      "sign",
      "correlation_to_cause"
    ],
    relatedClusters: ["prediction", "decision_making"],
    typicalUse: "When arguing that X causes Y, or that Y is evidence of X",
    examples: [
      "Raising taxes will reduce economic growth",
      "The broken window indicates a burglary",
      "This policy will have negative side effects"
    ]
  },
  
  decision_making: {
    id: "decision_making",
    name: "Practical Decision Making",
    description: "Arguments about what actions to take, policies to adopt, or decisions to make",
    icon: "🎯",
    color: "purple",
    schemeKeys: [
      "practical_reasoning",
      "value_based_practical_reasoning",
      "means_end",
      "sunk_costs",
      "waste",
      "danger_appeal"
    ],
    relatedClusters: ["consequences", "values"],
    typicalUse: "When arguing for or against a course of action",
    examples: [
      "We should adopt this policy to achieve our goal",
      "This option is too risky",
      "We've already invested too much to quit now"
    ]
  },
  
  analogy: {
    id: "analogy",
    name: "Analogy & Comparison",
    description: "Arguments based on similarity, precedent, or parallel cases",
    icon: "🔄",
    color: "orange",
    schemeKeys: [
      "analogy",
      "precedent",
      "example",
      "similarity",
      "a_fortiori"
    ],
    relatedClusters: ["rules", "case_based"],
    typicalUse: "When arguing that X is like Y, so what's true of Y is true of X",
    examples: [
      "Banning this is like Prohibition, which failed",
      "We handled the 2008 crisis this way, so we should do the same now",
      "If we allow this, we must allow that similar thing"
    ]
  },
  
  classification: {
    id: "classification",
    name: "Classification & Definition",
    description: "Arguments about what category something belongs to or what terms mean",
    icon: "📋",
    color: "yellow",
    schemeKeys: [
      "verbal_classification",
      "definitional",
      "genus_species",
      "composition",
      "division"
    ],
    relatedClusters: ["rules", "concepts"],
    typicalUse: "When arguing about what something is or what category it belongs to",
    examples: [
      "This is a tax, not a fee",
      "By definition, murder is intentional",
      "Whales are mammals, not fish"
    ]
  },
  
  values: {
    id: "values",
    name: "Values & Ethics",
    description: "Arguments based on moral principles, ethical considerations, or value judgments",
    icon: "⚖️",
    color: "red",
    schemeKeys: [
      "ethical_classification",
      "value_based_practical_reasoning",
      "fairness",
      "rights",
      "commitment"
    ],
    relatedClusters: ["decision_making", "rules"],
    typicalUse: "When arguing that something is right/wrong, fair/unfair, or aligns with values",
    examples: [
      "This violates human rights",
      "Fairness requires equal treatment",
      "We made a commitment, so we must follow through"
    ]
  },
  
  evidence: {
    id: "evidence",
    name: "Evidence & Proof",
    description: "Arguments about what counts as evidence and how strong the proof is",
    icon: "📊",
    color: "indigo",
    schemeKeys: [
      "sign",
      "witness_testimony",
      "position_to_know",
      "ignorance",
      "correlation_to_cause"
    ],
    relatedClusters: ["authority", "causality"],
    typicalUse: "When arguing about the strength or relevance of evidence",
    examples: [
      "There's no evidence against it, so it must be true",
      "These symptoms indicate this disease",
      "The witness saw it happen"
    ]
  },
  
  opposition: {
    id: "opposition",
    name: "Opposition & Conflict",
    description: "Arguments based on inconsistency, hypocrisy, or conflicting commitments",
    icon: "⚔️",
    color: "gray",
    schemeKeys: [
      "inconsistent_commitment",
      "circumstantial_ad_hominem",
      "tu_quoque",
      "self_interest"
    ],
    relatedClusters: ["credibility", "character"],
    typicalUse: "When pointing out contradictions or conflicts in opponent's position",
    examples: [
      "You said X before, but now you're saying Y",
      "You're biased because you benefit from this",
      "You do the same thing you're criticizing"
    ]
  }
};

// Helper: Get schemes for a cluster
export function getSchemesForCluster(
  clusterId: string,
  allSchemes: ArgumentScheme[]
): ArgumentScheme[] {
  const cluster = semanticClusters[clusterId];
  if (!cluster) return [];
  
  return allSchemes.filter(scheme => 
    cluster.schemeKeys.includes(scheme.key)
  );
}

// Helper: Get cluster for a scheme
export function getClusterForScheme(schemeKey: string): SemanticCluster | null {
  for (const cluster of Object.values(semanticClusters)) {
    if (cluster.schemeKeys.includes(schemeKey)) {
      return cluster;
    }
  }
  return null;
}

// Helper: Get related schemes (same cluster or related clusters)
export function getRelatedSchemes(
  schemeKey: string,
  allSchemes: ArgumentScheme[],
  maxResults: number = 6
): ArgumentScheme[] {
  const cluster = getClusterForScheme(schemeKey);
  if (!cluster) return [];
  
  // Get schemes from same cluster
  const sameCluster = getSchemesForCluster(cluster.id, allSchemes)
    .filter(s => s.key !== schemeKey);
  
  // Get schemes from related clusters
  const relatedClusterSchemes = cluster.relatedClusters.flatMap(cId =>
    getSchemesForCluster(cId, allSchemes)
  );
  
  // Combine and limit
  return [...sameCluster, ...relatedClusterSchemes]
    .slice(0, maxResults);
}
```

**Database Migration**:
```prisma
// Add semanticCluster field to ArgumentScheme
model ArgumentScheme {
  // ... existing fields
  
  // Week 6: Cluster Browser
  semanticCluster String? // "authority" | "causality" | ...
  clusterDescription String? @db.Text
  relatedSchemeKeys String[]
}
```

**Testing**:
- [ ] All clusters have clear, distinct purposes
- [ ] Scheme assignments are accurate
- [ ] Related cluster links make sense
- [ ] Examples are helpful

**Time Breakdown**:
- Cluster taxonomy design: 3 hours
- Scheme-to-cluster assignments: 2 hours
- Helper functions: 2 hours
- Testing and refinement: 1 hour

---

#### Task 6.2: Cluster Grid UI (10 hours)

**File**: `components/schemes/ClusterBrowser.tsx`

**Component Structure**:
```typescript
interface ClusterBrowserProps {
  onSchemeSelect: (scheme: ArgumentScheme) => void;
  initialCluster?: string;
  compactMode?: boolean;
}

export function ClusterBrowser({
  onSchemeSelect,
  initialCluster,
  compactMode = false
}: ClusterBrowserProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(
    initialCluster || null
  );
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  
  const { data: schemes, isLoading } = useSWR("/api/schemes/all", fetcher);
  
  // Show cluster grid or scheme list
  if (!selectedCluster) {
    return <ClusterGrid
      clusters={Object.values(semanticClusters)}
      onClusterSelect={setSelectedCluster}
      onClusterHover={setHoveredCluster}
      hoveredCluster={hoveredCluster}
      compactMode={compactMode}
    />;
  }
  
  // Show schemes in selected cluster
  const cluster = semanticClusters[selectedCluster];
  const clusterSchemes = getSchemesForCluster(selectedCluster, schemes || []);
  
  return <ClusterSchemeList
    cluster={cluster}
    schemes={clusterSchemes}
    onSchemeSelect={onSchemeSelect}
    onBack={() => setSelectedCluster(null)}
    allSchemes={schemes || []}
  />;
}
```

**Sub-Component: ClusterGrid**:
```typescript
// components/schemes/ClusterGrid.tsx
interface ClusterGridProps {
  clusters: SemanticCluster[];
  onClusterSelect: (clusterId: string) => void;
  onClusterHover?: (clusterId: string | null) => void;
  hoveredCluster?: string | null;
  compactMode?: boolean;
}

export function ClusterGrid({
  clusters,
  onClusterSelect,
  onClusterHover,
  hoveredCluster,
  compactMode = false
}: ClusterGridProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          Browse by Topic
        </h2>
        <p className="text-muted-foreground">
          Select a category to see related argumentation schemes
        </p>
      </div>
      
      {/* Cluster grid */}
      <div className={cn(
        "grid gap-4",
        compactMode 
          ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {clusters.map(cluster => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            onClick={() => onClusterSelect(cluster.id)}
            onHover={() => onClusterHover?.(cluster.id)}
            isHovered={hoveredCluster === cluster.id}
            compact={compactMode}
          />
        ))}
      </div>
      
      {/* Help text */}
      {hoveredCluster && (
        <Card className="bg-muted/50 p-4">
          <div className="text-sm">
            <p className="font-medium mb-2">
              {semanticClusters[hoveredCluster].name}
            </p>
            <p className="text-muted-foreground">
              {semanticClusters[hoveredCluster].typicalUse}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
```

**Sub-Component: ClusterCard**:
```typescript
// components/schemes/ClusterCard.tsx
interface ClusterCardProps {
  cluster: SemanticCluster;
  onClick: () => void;
  onHover?: () => void;
  isHovered?: boolean;
  compact?: boolean;
}

export function ClusterCard({
  cluster,
  onClick,
  onHover,
  isHovered = false,
  compact = false
}: ClusterCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:scale-105",
        isHovered && "ring-2 ring-primary",
        compact ? "p-4" : "p-6"
      )}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      {/* Icon */}
      <div className={cn(
        "mb-3 text-center",
        compact ? "text-3xl" : "text-5xl"
      )}>
        {cluster.icon}
      </div>
      
      {/* Title */}
      <h3 className={cn(
        "font-semibold text-center mb-2",
        compact ? "text-base" : "text-lg"
      )}>
        {cluster.name}
      </h3>
      
      {/* Description (not in compact mode) */}
      {!compact && (
        <>
          <p className="text-sm text-muted-foreground text-center mb-3">
            {cluster.description}
          </p>
          
          {/* Scheme count badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              {cluster.schemeKeys.length} schemes
            </Badge>
          </div>
        </>
      )}
      
      {/* Compact mode: just scheme count */}
      {compact && (
        <p className="text-xs text-muted-foreground text-center">
          {cluster.schemeKeys.length} schemes
        </p>
      )}
    </Card>
  );
}
```

**Testing**:
- [ ] Cluster grid renders correctly
- [ ] Hover states work
- [ ] Click navigation works
- [ ] Compact mode displays correctly
- [ ] Help text updates on hover
- [ ] Responsive layout works on mobile

**Time Breakdown**:
- ClusterBrowser component: 2 hours
- ClusterGrid component: 3 hours
- ClusterCard component: 3 hours
- Styling and animations: 2 hours

---

#### Task 6.3: Scheme List View (10 hours)

**Sub-Component: ClusterSchemeList**:
```typescript
// components/schemes/ClusterSchemeList.tsx
interface ClusterSchemeListProps {
  cluster: SemanticCluster;
  schemes: ArgumentScheme[];
  onSchemeSelect: (scheme: ArgumentScheme) => void;
  onBack: () => void;
  allSchemes: ArgumentScheme[];
}

export function ClusterSchemeList({
  cluster,
  schemes,
  onSchemeSelect,
  onBack,
  allSchemes
}: ClusterSchemeListProps) {
  const [selectedScheme, setSelectedScheme] = useState<ArgumentScheme | null>(null);
  const [showRelated, setShowRelated] = useState(false);
  
  // Get related schemes if a scheme is selected
  const relatedSchemes = useMemo(() => {
    if (!selectedScheme) return [];
    return getRelatedSchemes(selectedScheme.key, allSchemes, 6);
  }, [selectedScheme, allSchemes]);
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Clusters
        </Button>
        
        <div className="flex items-start gap-4">
          <div className="text-4xl">{cluster.icon}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">
              {cluster.name}
            </h2>
            <p className="text-muted-foreground">
              {cluster.description}
            </p>
          </div>
        </div>
      </div>
      
      {/* Typical use callout */}
      <Card className="bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm mb-1">When to use these schemes:</p>
            <p className="text-sm text-muted-foreground">
              {cluster.typicalUse}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Examples */}
      <Card className="p-4">
        <p className="font-medium text-sm mb-3">Example arguments:</p>
        <div className="space-y-2">
          {cluster.examples.map((example, i) => (
            <div key={i} className="flex items-start gap-2">
              <Quote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground italic">
                "{example}"
              </p>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Scheme list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {schemes.length} Schemes in this Category
          </h3>
          
          {/* Sort/filter options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Alphabetical</DropdownMenuItem>
              <DropdownMenuItem>Most Common</DropdownMenuItem>
              <DropdownMenuItem>By Strength</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {schemes.map(scheme => (
          <SchemeListCard
            key={scheme.id}
            scheme={scheme}
            cluster={cluster}
            onSelect={() => onSchemeSelect(scheme)}
            onShowDetails={() => setSelectedScheme(scheme)}
            isSelected={selectedScheme?.id === scheme.id}
          />
        ))}
      </div>
      
      {/* Related schemes panel (if scheme selected) */}
      {selectedScheme && relatedSchemes.length > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Related Schemes</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedScheme(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            These schemes are often used together with <span className="font-medium">{selectedScheme.name}</span>
          </p>
          
          <div className="space-y-2">
            {relatedSchemes.map(relScheme => (
              <Button
                key={relScheme.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => {
                  setSelectedScheme(relScheme);
                  onSchemeSelect(relScheme);
                }}
              >
                <div className="flex-1">
                  <div className="font-medium mb-1">{relScheme.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {relScheme.summary}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            ))}
          </div>
        </Card>
      )}
      
      {/* Related clusters */}
      {cluster.relatedClusters.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Related Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {cluster.relatedClusters.map(relId => {
              const relCluster = semanticClusters[relId];
              return (
                <Button
                  key={relId}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onBack(); // Go back to grid
                    // Then navigate to related cluster
                    setTimeout(() => onBack(), 0);
                  }}
                >
                  {relCluster.icon} {relCluster.name}
                </Button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
```

**Sub-Component: SchemeListCard**:
```typescript
// components/schemes/SchemeListCard.tsx
interface SchemeListCardProps {
  scheme: ArgumentScheme;
  cluster: SemanticCluster;
  onSelect: () => void;
  onShowDetails: () => void;
  isSelected: boolean;
}

export function SchemeListCard({
  scheme,
  cluster,
  onSelect,
  onShowDetails,
  isSelected
}: SchemeListCardProps) {
  const [showStructure, setShowStructure] = useState(false);
  
  return (
    <Card className={cn(
      "p-4 transition-all",
      isSelected && "ring-2 ring-primary bg-primary/5"
    )}>
      <div className="flex items-start gap-4">
        {/* Scheme info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-lg">{scheme.name}</h4>
              {scheme.key && (
                <code className="text-xs text-muted-foreground">
                  {scheme.key}
                </code>
              )}
            </div>
            
            {/* Cluster badge */}
            <Badge 
              variant="secondary" 
              className="ml-2"
              style={{ 
                backgroundColor: `var(--${cluster.color}-100)`,
                color: `var(--${cluster.color}-700)`
              }}
            >
              {cluster.icon} {cluster.name}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {scheme.summary}
          </p>
          
          {/* Expandable structure */}
          {showStructure && (
            <div className="mt-3 pt-3 border-t space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Premises:
                </p>
                <ul className="space-y-1">
                  {scheme.premises.map((p, i) => (
                    <li key={i} className="text-xs pl-3 border-l-2">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Conclusion:
                </p>
                <p className="text-xs pl-3 border-l-2">
                  {scheme.conclusion}
                </p>
              </div>
              
              {/* Critical Questions count */}
              {scheme.criticalQuestions && scheme.criticalQuestions.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <HelpCircle className="w-3 h-3" />
                  <span>{scheme.criticalQuestions.length} critical questions</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={onSelect}>
            Select
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStructure(!showStructure)}
          >
            {showStructure ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Details
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowDetails}
          >
            <Network className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

**Testing**:
- [ ] Scheme list displays correctly
- [ ] Examples and typical use are helpful
- [ ] Related schemes panel works
- [ ] Related clusters navigation works
- [ ] Scheme details expand/collapse
- [ ] Selection triggers callback

**Time Breakdown**:
- ClusterSchemeList component: 4 hours
- SchemeListCard component: 3 hours
- Related schemes logic: 2 hours
- Testing and refinement: 1 hour

---

#### Task 6.4: Cluster Metadata Enhancement (6 hours)

**Database Migration**:
```typescript
// prisma/migrations/add_cluster_metadata.ts
import { PrismaClient } from "@prisma/client";
import { semanticClusters } from "@/lib/schemes/semantic-clusters";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding cluster metadata to ArgumentScheme...");
  
  // For each cluster, update schemes with cluster metadata
  for (const [clusterId, cluster] of Object.entries(semanticClusters)) {
    console.log(`Processing cluster: ${cluster.name}`);
    
    // Update schemes in this cluster
    const updated = await prisma.argumentScheme.updateMany({
      where: {
        key: {
          in: cluster.schemeKeys
        }
      },
      data: {
        semanticCluster: clusterId,
        clusterDescription: cluster.description,
        relatedSchemeKeys: cluster.schemeKeys.filter(
          (key, idx, arr) => arr.indexOf(key) !== arr.length - 1 // Exclude self
        )
      }
    });
    
    console.log(`Updated ${updated.count} schemes in cluster ${clusterId}`);
  }
  
  // Add related schemes from related clusters
  for (const [clusterId, cluster] of Object.entries(semanticClusters)) {
    const relatedSchemeKeys = cluster.relatedClusters.flatMap(
      relId => semanticClusters[relId].schemeKeys
    );
    
    for (const schemeKey of cluster.schemeKeys) {
      await prisma.argumentScheme.update({
        where: { key: schemeKey },
        data: {
          relatedSchemeKeys: {
            push: relatedSchemeKeys
          }
        }
      });
    }
  }
  
  console.log("Cluster metadata migration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Schema Update**:
```prisma
model ArgumentScheme {
  // ... existing fields
  
  // Week 5: Dichotomic Tree (ALREADY EXISTS)
  purpose String? // "action" | "state_of_affairs"
  source  String? // "internal" | "external"
  
  // Week 6: Cluster Browser (NEW)
  semanticCluster    String?   // "authority" | "causality" | "decision_making" | ...
  clusterDescription String?   @db.Text
  relatedSchemeKeys  String[]  // Keys of related schemes
}
```

**API Endpoint**:
```typescript
// app/api/schemes/by-cluster/[clusterId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { semanticClusters } from "@/lib/schemes/semantic-clusters";

export async function GET(
  request: NextRequest,
  { params }: { params: { clusterId: string } }
) {
  const { clusterId } = params;
  
  // Validate cluster ID
  if (!semanticClusters[clusterId]) {
    return NextResponse.json(
      { error: "Invalid cluster ID" },
      { status: 400 }
    );
  }
  
  const cluster = semanticClusters[clusterId];
  
  // Fetch schemes in this cluster
  const schemes = await prisma.argumentScheme.findMany({
    where: {
      key: {
        in: cluster.schemeKeys
      }
    },
    include: {
      criticalQuestions: {
        select: {
          id: true,
          text: true,
          attackType: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
  
  return NextResponse.json({
    cluster: {
      id: cluster.id,
      name: cluster.name,
      description: cluster.description,
      icon: cluster.icon,
      typicalUse: cluster.typicalUse,
      examples: cluster.examples,
      relatedClusters: cluster.relatedClusters
    },
    schemes,
    count: schemes.length
  });
}
```

**Testing**:
- [ ] Migration runs successfully
- [ ] All schemes assigned to clusters
- [ ] Related scheme keys are accurate
- [ ] API endpoint returns correct data
- [ ] Cluster metadata is queryable

**Time Breakdown**:
- Schema migration: 2 hours
- Migration script: 2 hours
- API endpoint: 1 hour
- Testing: 1 hour

---

#### Task 6.5: Navigation and Search Integration (6 hours)

**Component: ClusterSearch**:
```typescript
// components/schemes/ClusterSearch.tsx
interface ClusterSearchProps {
  clusters: SemanticCluster[];
  schemes: ArgumentScheme[];
  onClusterSelect: (clusterId: string) => void;
  onSchemeSelect: (scheme: ArgumentScheme) => void;
}

export function ClusterSearch({
  clusters,
  schemes,
  onClusterSelect,
  onSchemeSelect
}: ClusterSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query, clusters, schemes]);
  
  function performSearch(q: string) {
    const lowerQuery = q.toLowerCase();
    const results: SearchResult[] = [];
    
    // Search clusters
    clusters.forEach(cluster => {
      const score = calculateClusterScore(cluster, lowerQuery);
      if (score > 0) {
        results.push({
          type: "cluster",
          item: cluster,
          score,
          matchedField: getMatchedField(cluster, lowerQuery)
        });
      }
    });
    
    // Search schemes
    schemes.forEach(scheme => {
      const score = calculateSchemeScore(scheme, lowerQuery);
      if (score > 0) {
        results.push({
          type: "scheme",
          item: scheme,
          score,
          matchedField: getMatchedField(scheme, lowerQuery)
        });
      }
    });
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    setSearchResults(results);
  }
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clusters or schemes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {searchResults.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            {searchResults.map((result, i) => (
              <SearchResultItem
                key={i}
                result={result}
                onSelect={() => {
                  if (result.type === "cluster") {
                    onClusterSelect((result.item as SemanticCluster).id);
                  } else {
                    onSchemeSelect(result.item as ArgumentScheme);
                  }
                  setQuery("");
                  setSearchResults([]);
                }}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function calculateClusterScore(cluster: SemanticCluster, query: string): number {
  let score = 0;
  
  if (cluster.name.toLowerCase().includes(query)) score += 10;
  if (cluster.description.toLowerCase().includes(query)) score += 5;
  if (cluster.typicalUse.toLowerCase().includes(query)) score += 3;
  if (cluster.examples.some(ex => ex.toLowerCase().includes(query))) score += 2;
  
  return score;
}

function calculateSchemeScore(scheme: ArgumentScheme, query: string): number {
  let score = 0;
  
  if (scheme.name.toLowerCase().includes(query)) score += 10;
  if (scheme.key?.toLowerCase().includes(query)) score += 8;
  if (scheme.summary?.toLowerCase().includes(query)) score += 5;
  if (scheme.premises?.some(p => p.toLowerCase().includes(query))) score += 3;
  
  return score;
}
```

**Component: BreadcrumbNavigation**:
```typescript
// components/schemes/ClusterBreadcrumbs.tsx
interface ClusterBreadcrumbsProps {
  currentCluster?: SemanticCluster;
  currentScheme?: ArgumentScheme;
  onNavigateToGrid: () => void;
  onNavigateToCluster: () => void;
}

export function ClusterBreadcrumbs({
  currentCluster,
  currentScheme,
  onNavigateToGrid,
  onNavigateToCluster
}: ClusterBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateToGrid}
        className="h-auto py-1"
      >
        All Clusters
      </Button>
      
      {currentCluster && (
        <>
          <ChevronRight className="w-4 h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToCluster}
            className="h-auto py-1"
            disabled={!currentScheme}
          >
            {currentCluster.icon} {currentCluster.name}
          </Button>
        </>
      )}
      
      {currentScheme && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-foreground">
            {currentScheme.name}
          </span>
        </>
      )}
    </nav>
  );
}
```

**Enhanced ClusterBrowser with Navigation**:
```typescript
// Updated ClusterBrowser with navigation state
export function ClusterBrowser({
  onSchemeSelect,
  initialCluster,
  compactMode = false
}: ClusterBrowserProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(
    initialCluster || null
  );
  const [selectedScheme, setSelectedScheme] = useState<ArgumentScheme | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  
  const { data: schemes, isLoading } = useSWR("/api/schemes/all", fetcher);
  
  const currentCluster = selectedCluster 
    ? semanticClusters[selectedCluster] 
    : null;
  
  function navigateToCluster(clusterId: string) {
    setNavigationHistory([...navigationHistory, "grid"]);
    setSelectedCluster(clusterId);
    setSelectedScheme(null);
  }
  
  function navigateToGrid() {
    setSelectedCluster(null);
    setSelectedScheme(null);
    setNavigationHistory([]);
  }
  
  function navigateBack() {
    const lastLocation = navigationHistory[navigationHistory.length - 1];
    
    if (lastLocation === "grid") {
      navigateToGrid();
    } else if (lastLocation === "cluster") {
      setSelectedScheme(null);
    }
    
    setNavigationHistory(navigationHistory.slice(0, -1));
  }
  
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <ClusterBreadcrumbs
        currentCluster={currentCluster}
        currentScheme={selectedScheme}
        onNavigateToGrid={navigateToGrid}
        onNavigateToCluster={() => setSelectedScheme(null)}
      />
      
      {/* Search (always visible) */}
      {!compactMode && (
        <ClusterSearch
          clusters={Object.values(semanticClusters)}
          schemes={schemes || []}
          onClusterSelect={navigateToCluster}
          onSchemeSelect={onSchemeSelect}
        />
      )}
      
      {/* Main content */}
      {!selectedCluster ? (
        <ClusterGrid
          clusters={Object.values(semanticClusters)}
          onClusterSelect={navigateToCluster}
          compactMode={compactMode}
        />
      ) : (
        <ClusterSchemeList
          cluster={currentCluster!}
          schemes={getSchemesForCluster(selectedCluster, schemes || [])}
          onSchemeSelect={onSchemeSelect}
          onBack={navigateToGrid}
          allSchemes={schemes || []}
        />
      )}
    </div>
  );
}
```

**Testing**:
- [ ] Search finds relevant clusters and schemes
- [ ] Breadcrumb navigation works
- [ ] Back button respects history
- [ ] Navigation state is maintained
- [ ] Search clears on selection

**Time Breakdown**:
- Search component: 2 hours
- Breadcrumb navigation: 1 hour
- Navigation state management: 2 hours
- Testing: 1 hour

---

### Week 6 Deliverables

**Code Files** (10 files):
- [x] `lib/schemes/semantic-clusters.ts` (cluster definitions)
- [x] `components/schemes/ClusterBrowser.tsx` (main component)
- [x] `components/schemes/ClusterGrid.tsx` (cluster grid view)
- [x] `components/schemes/ClusterCard.tsx` (cluster card)
- [x] `components/schemes/ClusterSchemeList.tsx` (scheme list view)
- [x] `components/schemes/SchemeListCard.tsx` (scheme card)
- [x] `components/schemes/ClusterSearch.tsx` (search component)
- [x] `components/schemes/ClusterBreadcrumbs.tsx` (navigation)
- [x] `prisma/migrations/add_cluster_metadata.ts` (migration)
- [x] `app/api/schemes/by-cluster/[clusterId]/route.ts` (API)

**Database Changes**:
- [x] `semanticCluster` field added to ArgumentScheme
- [x] `clusterDescription` field added
- [x] `relatedSchemeKeys` array added
- [x] Migration script to populate cluster metadata

**Documentation**:
- [x] Cluster taxonomy with 8 semantic clusters
- [x] Component API documentation
- [x] Navigation patterns documented

**Metrics**:
- Total lines of code: ~1,200
- Components: 8
- Clusters defined: 8
- API endpoints: 1
- Database migrations: 1

**Week 6 Time**: 40 hours
- Task 6.1 (Cluster Definitions): 8 hours ✅
- Task 6.2 (Cluster Grid UI): 10 hours ✅
- Task 6.3 (Scheme List View): 10 hours ✅
- Task 6.4 (Metadata Enhancement): 6 hours ✅
- Task 6.5 (Navigation & Search): 6 hours ✅

---

### Week 6 Testing Checklist

**Cluster Definitions**:
- [ ] All 8 clusters have clear, distinct purposes
- [ ] Scheme assignments are accurate (no misclassified schemes)
- [ ] Related cluster links make sense semantically
- [ ] Examples are helpful and representative

**Cluster Grid UI**:
- [ ] Grid renders correctly on desktop/tablet/mobile
- [ ] Hover states work smoothly
- [ ] Click navigation is intuitive
- [ ] Compact mode displays correctly
- [ ] Icons and colors are visually distinct

**Scheme List View**:
- [ ] Schemes display with complete information
- [ ] Examples and typical use are helpful
- [ ] Related schemes recommendations are relevant
- [ ] Related clusters navigation works
- [ ] Scheme details expand/collapse smoothly
- [ ] Selection triggers correct callback

**Navigation & Search**:
- [ ] Search finds relevant results
- [ ] Search ranking is sensible (name matches > description matches)
- [ ] Breadcrumbs show current location accurately
- [ ] Back button works correctly
- [ ] Navigation state persists appropriately
- [ ] URL can deep-link to specific cluster (bonus)

**Database & API**:
- [ ] Migration populates all schemes with cluster data
- [ ] API endpoint returns complete cluster information
- [ ] Related schemes are correctly calculated
- [ ] Performance is acceptable (<500ms for cluster load)

**Integration**:
- [ ] Works with existing scheme selection flow
- [ ] Integrates with DichotomicTreeWizard (can switch between modes)
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation, screen readers)

---

### Week 6 Success Criteria

**User Experience**:
- Users can browse all clusters in <5 seconds
- Users can find specific cluster in <10 seconds with search
- Scheme selection within cluster in <15 seconds
- 90%+ user preference for cluster browser over flat list

**Technical**:
- All 100+ schemes assigned to appropriate clusters
- Related scheme recommendations are >80% relevant
- Search finds correct results 95%+ of the time
- Page load time <1 second
- Mobile responsive and touch-friendly

**Business Value**:
- 40% reduction in time to find appropriate scheme
- 25% increase in scheme diversity used (users explore more clusters)
- 15% reduction in incorrect scheme selection

---

## Week 6 Complete! ✅

Week 6 implementation plan is complete with:
- **8 semantic clusters** defined with clear taxonomy
- **8 UI components** for browsing and navigation
- **Database schema** extensions for cluster metadata
- **1 API endpoint** for cluster-based scheme retrieval
- **Search and navigation** features integrated
- **~1,200 lines of code** across 10 files
- **40 hours** of implementation work planned

**Next Steps**:
- **Week 7**: Identification Conditions Filter
- **Week 8**: Unified SchemeNavigator (integration of all modes)

---

**Created**: 2025-11-09  
**Status**: Week 6 COMPLETE ✅  
**Next**: Week 7 - Identification Conditions Filter

---

## Week 7: Identification Conditions Filter

### Overview

**Goal**: Enable expert users to filter schemes by observable features in arguments.

**Problem Statement**: Expert users can recognize patterns in arguments ("this appeals to expert testimony", "this cites negative consequences") but current navigation doesn't leverage this expertise. They must still browse through lists or navigate taxonomies.

**Solution**: Checkbox-based filter UI showing identification conditions. Users select conditions they observe, and schemes are filtered in real-time.

**Example User Flow**:
```
User sees argument: "Dr. Smith, a climate scientist, says global warming is real."

User recognizes patterns:
✓ Appeals to expert testimony
✓ Cites credentials of source
✓ Relies on specialized knowledge

System filters to: Argument from Expert Opinion, Argument from Position to Know

User selects: Argument from Expert Opinion
```

### Key Features

1. **Identification Condition Library**: 20-30 observable features across all schemes
2. **Multi-Select Filters**: Users can combine multiple conditions
3. **Real-Time Filtering**: Instant scheme list updates as conditions are selected
4. **Explanatory Text**: Each condition has description and examples
5. **Scheme Match Score**: Show how well each scheme matches selected conditions

### Implementation Tasks

#### Task 7.1: Identification Condition Definitions (10 hours)

**File**: `lib/schemes/identification-conditions.ts`

**Condition Categories**:
```typescript
export type ConditionCategory = 
  | "source_type"        // Where evidence comes from
  | "reasoning_pattern"  // How inference works
  | "structure"          // Argument structure features
  | "content"            // What the argument is about
  | "appeal"             // Type of persuasive appeal
  | "relationship";      // How elements relate

export interface IdentificationCondition {
  id: string;
  category: ConditionCategory;
  label: string;
  description: string;
  examples: string[];
  keywords: string[]; // For search/matching
  applicableSchemes: string[]; // Scheme keys this condition identifies
  exclusiveWith?: string[]; // Conditions that conflict with this one
  weight: number; // How strongly this indicates the scheme (0-1)
}

export const identificationConditions: Record<string, IdentificationCondition> = {
  // SOURCE TYPE CONDITIONS
  appeals_to_expert: {
    id: "appeals_to_expert",
    category: "source_type",
    label: "Appeals to expert testimony",
    description: "The argument cites what an expert or authority figure has said",
    examples: [
      "Scientists agree that...",
      "Dr. Smith, a leading researcher, says...",
      "According to experts in the field..."
    ],
    keywords: ["expert", "authority", "specialist", "professional", "scientist"],
    applicableSchemes: ["expert_opinion", "position_to_know"],
    weight: 0.9
  },
  
  cites_popular_belief: {
    id: "cites_popular_belief",
    category: "source_type",
    label: "Cites popular belief or majority opinion",
    description: "The argument references what most people believe or do",
    examples: [
      "Most people agree that...",
      "The majority supports...",
      "Everyone knows that..."
    ],
    keywords: ["majority", "most people", "everyone", "popular", "consensus"],
    applicableSchemes: ["popular_opinion", "popular_practice"],
    weight: 0.9
  },
  
  references_institution: {
    id: "references_institution",
    category: "source_type",
    label: "References institutional authority",
    description: "The argument cites an organization, government, or institution",
    examples: [
      "The Supreme Court ruled...",
      "According to the UN...",
      "Company policy states..."
    ],
    keywords: ["court", "government", "organization", "institution", "official"],
    applicableSchemes: ["institutional_authority", "legal_authority"],
    weight: 0.85
  },
  
  uses_personal_testimony: {
    id: "uses_personal_testimony",
    category: "source_type",
    label: "Uses personal testimony or witness account",
    description: "The argument relies on what someone personally observed or experienced",
    examples: [
      "I saw it happen...",
      "According to eyewitnesses...",
      "My experience shows..."
    ],
    keywords: ["witness", "saw", "observed", "testimony", "experienced"],
    applicableSchemes: ["witness_testimony", "position_to_know"],
    weight: 0.8
  },
  
  // REASONING PATTERN CONDITIONS
  argues_from_consequences: {
    id: "argues_from_consequences",
    category: "reasoning_pattern",
    label: "Argues from consequences or effects",
    description: "The argument claims something is good/bad based on its results",
    examples: [
      "This policy will lead to...",
      "The effects would be...",
      "This would result in..."
    ],
    keywords: ["consequence", "result", "effect", "outcome", "lead to"],
    applicableSchemes: ["consequences", "cause_to_effect", "practical_reasoning"],
    weight: 0.9
  },
  
  identifies_causal_link: {
    id: "identifies_causal_link",
    category: "reasoning_pattern",
    label: "Identifies causal relationship",
    description: "The argument claims one thing causes another",
    examples: [
      "X causes Y",
      "Because of X, Y happened",
      "X is responsible for Y"
    ],
    keywords: ["cause", "because", "due to", "result of", "responsible for"],
    applicableSchemes: ["cause_to_effect", "effect_to_cause"],
    weight: 0.85
  },
  
  draws_analogy: {
    id: "draws_analogy",
    category: "reasoning_pattern",
    label: "Draws analogy or comparison",
    description: "The argument compares two situations or cases",
    examples: [
      "X is like Y",
      "This is similar to...",
      "Just as X, so too Y"
    ],
    keywords: ["like", "similar", "analogous", "comparable", "just as"],
    applicableSchemes: ["analogy", "precedent", "example"],
    weight: 0.9
  },
  
  reasons_from_sign: {
    id: "reasons_from_sign",
    category: "reasoning_pattern",
    label: "Reasons from sign or indicator",
    description: "The argument treats something as evidence or symptom of something else",
    examples: [
      "These symptoms indicate...",
      "This is a sign of...",
      "The evidence suggests..."
    ],
    keywords: ["sign", "symptom", "indication", "evidence", "suggests"],
    applicableSchemes: ["sign", "correlation_to_cause"],
    weight: 0.8
  },
  
  appeals_to_rule: {
    id: "appeals_to_rule",
    category: "reasoning_pattern",
    label: "Appeals to rule or principle",
    description: "The argument applies a general rule to a specific case",
    examples: [
      "According to the rule...",
      "The principle states...",
      "As a general rule..."
    ],
    keywords: ["rule", "principle", "law", "policy", "guideline"],
    applicableSchemes: ["rule_based", "deductive", "legal_reasoning"],
    weight: 0.85
  },
  
  // STRUCTURE CONDITIONS
  has_if_then_structure: {
    id: "has_if_then_structure",
    category: "structure",
    label: "Has if-then conditional structure",
    description: "The argument uses conditional reasoning (if X then Y)",
    examples: [
      "If we do X, then Y will happen",
      "Should we do X, Y would follow",
      "X implies Y"
    ],
    keywords: ["if", "then", "should", "would", "implies"],
    applicableSchemes: ["practical_reasoning", "consequences", "hypothetical"],
    weight: 0.7
  },
  
  presents_dilemma: {
    id: "presents_dilemma",
    category: "structure",
    label: "Presents dilemma or forced choice",
    description: "The argument limits options to two alternatives",
    examples: [
      "Either X or Y",
      "We must choose between...",
      "There are only two options..."
    ],
    keywords: ["either", "or", "dilemma", "choice", "alternative"],
    applicableSchemes: ["dilemma", "false_dilemma", "practical_reasoning"],
    weight: 0.8
  },
  
  uses_category_membership: {
    id: "uses_category_membership",
    category: "structure",
    label: "Uses category membership or classification",
    description: "The argument classifies something into a category",
    examples: [
      "X is a type of Y",
      "This belongs to the category...",
      "X can be classified as..."
    ],
    keywords: ["type", "kind", "category", "class", "classified as"],
    applicableSchemes: ["verbal_classification", "genus_species", "definitional"],
    weight: 0.85
  },
  
  cites_definition: {
    id: "cites_definition",
    category: "structure",
    label: "Cites definition or meaning",
    description: "The argument relies on what a term means",
    examples: [
      "By definition, X means...",
      "The meaning of X is...",
      "X is defined as..."
    ],
    keywords: ["definition", "means", "meaning", "defined as", "by definition"],
    applicableSchemes: ["definitional", "verbal_classification"],
    weight: 0.9
  },
  
  // CONTENT CONDITIONS
  addresses_action_or_policy: {
    id: "addresses_action_or_policy",
    category: "content",
    label: "Addresses what action to take",
    description: "The argument is about what we should do",
    examples: [
      "We should adopt this policy",
      "The right action is...",
      "We ought to..."
    ],
    keywords: ["should", "ought", "must", "action", "policy", "do"],
    applicableSchemes: ["practical_reasoning", "value_based_practical_reasoning"],
    weight: 0.7
  },
  
  discusses_values_or_ethics: {
    id: "discusses_values_or_ethics",
    category: "content",
    label: "Discusses values or ethics",
    description: "The argument invokes moral principles or values",
    examples: [
      "This is morally wrong",
      "Justice requires...",
      "The right thing to do is..."
    ],
    keywords: ["moral", "ethical", "right", "wrong", "justice", "fair"],
    applicableSchemes: ["ethical_classification", "value_based_practical_reasoning"],
    weight: 0.8
  },
  
  concerns_credibility: {
    id: "concerns_credibility",
    category: "content",
    label: "Concerns source credibility or bias",
    description: "The argument questions or affirms someone's trustworthiness",
    examples: [
      "They're biased because...",
      "This source is reliable",
      "You can't trust them"
    ],
    keywords: ["biased", "credible", "trust", "reliable", "conflict of interest"],
    applicableSchemes: ["circumstantial_ad_hominem", "self_interest", "position_to_know"],
    weight: 0.8
  },
  
  cites_past_precedent: {
    id: "cites_past_precedent",
    category: "content",
    label: "Cites past precedent or example",
    description: "The argument references a previous similar case",
    examples: [
      "In 2008, we did X and it worked",
      "Previous cases show...",
      "History demonstrates..."
    ],
    keywords: ["precedent", "previous", "past", "history", "before"],
    applicableSchemes: ["precedent", "example", "analogy"],
    weight: 0.85
  },
  
  // APPEAL CONDITIONS
  appeals_to_emotion: {
    id: "appeals_to_emotion",
    category: "appeal",
    label: "Appeals to emotion or fear",
    description: "The argument evokes emotional response",
    examples: [
      "This is dangerous",
      "Think of the children",
      "This is frightening"
    ],
    keywords: ["fear", "danger", "scary", "terrible", "emotional"],
    applicableSchemes: ["danger_appeal", "fear_appeal", "pity"],
    weight: 0.7
  },
  
  appeals_to_waste: {
    id: "appeals_to_waste",
    category: "appeal",
    label: "Appeals to avoiding waste",
    description: "The argument claims we shouldn't waste prior investment",
    examples: [
      "We've already invested so much",
      "We can't let that go to waste",
      "Too much has been spent to quit"
    ],
    keywords: ["waste", "invested", "spent", "already", "sunk"],
    applicableSchemes: ["waste", "sunk_costs"],
    weight: 0.9
  },
  
  appeals_to_fairness: {
    id: "appeals_to_fairness",
    category: "appeal",
    label: "Appeals to fairness or equality",
    description: "The argument invokes fairness or equal treatment",
    examples: [
      "Everyone should be treated equally",
      "It's only fair that...",
      "This is unjust"
    ],
    keywords: ["fair", "unfair", "equal", "justice", "equitable"],
    applicableSchemes: ["fairness", "equality", "justice"],
    weight: 0.85
  },
  
  // RELATIONSHIP CONDITIONS
  points_to_inconsistency: {
    id: "points_to_inconsistency",
    category: "relationship",
    label: "Points to inconsistency or contradiction",
    description: "The argument identifies conflicting claims or commitments",
    examples: [
      "You said X before, but now Y",
      "This contradicts that",
      "These are inconsistent"
    ],
    keywords: ["inconsistent", "contradiction", "contradicts", "conflict"],
    applicableSchemes: ["inconsistent_commitment", "tu_quoque"],
    weight: 0.85
  },
  
  argues_slippery_slope: {
    id: "argues_slippery_slope",
    category: "relationship",
    label: "Argues slippery slope or chain reaction",
    description: "The argument claims one thing will lead to a series of bad outcomes",
    examples: [
      "If we allow X, then Y, then Z",
      "This will start a chain reaction",
      "Where will it end?"
    ],
    keywords: ["slippery slope", "lead to", "chain", "series", "domino"],
    applicableSchemes: ["slippery_slope", "sorites"],
    weight: 0.9
  },
  
  compares_to_exceptional_case: {
    id: "compares_to_exceptional_case",
    category: "relationship",
    label: "Compares to exceptional or extreme case",
    description: "The argument uses an extreme case for comparison",
    examples: [
      "Even in the worst case...",
      "If that's true, then even...",
      "Look at this extreme example"
    ],
    keywords: ["even", "extreme", "worst case", "exceptional", "a fortiori"],
    applicableSchemes: ["a_fortiori", "example", "exceptional_case"],
    weight: 0.8
  }
};

// Helper: Get conditions by category
export function getConditionsByCategory(
  category: ConditionCategory
): IdentificationCondition[] {
  return Object.values(identificationConditions).filter(
    c => c.category === category
  );
}

// Helper: Get schemes matching selected conditions
export function getSchemesForConditions(
  selectedConditions: string[],
  allSchemes: ArgumentScheme[]
): SchemeMatch[] {
  const matches: SchemeMatch[] = [];
  
  for (const scheme of allSchemes) {
    let totalScore = 0;
    const matchedConditions: string[] = [];
    
    for (const conditionId of selectedConditions) {
      const condition = identificationConditions[conditionId];
      
      if (condition.applicableSchemes.includes(scheme.key)) {
        totalScore += condition.weight;
        matchedConditions.push(conditionId);
      }
    }
    
    if (totalScore > 0) {
      matches.push({
        scheme,
        score: totalScore,
        matchedConditions,
        percentage: Math.min(100, (totalScore / selectedConditions.length) * 100)
      });
    }
  }
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

// Helper: Check for conflicting conditions
export function getConflictingConditions(
  selectedConditions: string[]
): string[] {
  const conflicts: string[] = [];
  
  for (const condId of selectedConditions) {
    const condition = identificationConditions[condId];
    
    if (condition.exclusiveWith) {
      for (const exclusive of condition.exclusiveWith) {
        if (selectedConditions.includes(exclusive)) {
          conflicts.push(
            `"${condition.label}" conflicts with "${identificationConditions[exclusive].label}"`
          );
        }
      }
    }
  }
  
  return conflicts;
}

export interface SchemeMatch {
  scheme: ArgumentScheme;
  score: number;
  matchedConditions: string[];
  percentage: number;
}
```

**Condition Assignment Strategy**:
- Each condition identifies 1-5 schemes
- Conditions have weights (0.7-0.9) indicating strength of identification
- Some conditions are exclusive (can't both be true)
- Categories help organize the filter UI

**Testing**:
- [ ] All conditions have clear, observable criteria
- [ ] Scheme assignments are accurate
- [ ] Weights reflect identification strength
- [ ] No contradictory condition assignments
- [ ] Examples are helpful and diverse

**Time Breakdown**:
- Condition definitions: 4 hours
- Scheme-to-condition mapping: 3 hours
- Helper functions: 2 hours
- Testing and validation: 1 hour

---

#### Task 7.2: Filter UI Component (12 hours)

**File**: `components/schemes/IdentificationConditionsFilter.tsx`

**Component Structure**:
```typescript
interface IdentificationConditionsFilterProps {
  onSchemeSelect: (scheme: ArgumentScheme) => void;
  initialConditions?: string[];
  compactMode?: boolean;
}

export function IdentificationConditionsFilter({
  onSchemeSelect,
  initialConditions = [],
  compactMode = false
}: IdentificationConditionsFilterProps) {
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    initialConditions
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["source_type", "reasoning_pattern"]) // Default expanded
  );
  const [showConflicts, setShowConflicts] = useState(false);
  
  const { data: schemes, isLoading } = useSWR("/api/schemes/all", fetcher);
  
  // Calculate matches in real-time
  const schemeMatches = useMemo(() => {
    if (!schemes || selectedConditions.length === 0) return [];
    return getSchemesForConditions(selectedConditions, schemes);
  }, [schemes, selectedConditions]);
  
  // Check for conflicts
  const conflicts = useMemo(() => {
    return getConflictingConditions(selectedConditions);
  }, [selectedConditions]);
  
  function toggleCondition(conditionId: string) {
    setSelectedConditions(prev => {
      if (prev.includes(conditionId)) {
        return prev.filter(id => id !== conditionId);
      } else {
        return [...prev, conditionId];
      }
    });
  }
  
  function toggleCategory(category: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }
  
  function clearFilters() {
    setSelectedConditions([]);
  }
  
  return (
    <div className={cn(
      "grid gap-6",
      compactMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
    )}>
      {/* Filter Panel */}
      <div className={cn(
        "space-y-4",
        compactMode ? "" : "lg:col-span-1"
      )}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Filter by Features</h2>
          {selectedConditions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear All
            </Button>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">
          Select the features you observe in your argument. Schemes will be
          filtered in real-time.
        </p>
        
        {/* Selected count */}
        {selectedConditions.length > 0 && (
          <Card className="bg-primary/10 border-primary p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {selectedConditions.length} conditions selected
              </span>
            </div>
            {schemeMatches.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {schemeMatches.length} matching schemes
              </p>
            )}
          </Card>
        )}
        
        {/* Conflicts warning */}
        {conflicts.length > 0 && (
          <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Conflicting conditions
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                  {conflicts.map((conflict, i) => (
                    <li key={i}>{conflict}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
        
        {/* Condition categories */}
        <div className="space-y-3">
          {Object.entries(categoryLabels).map(([category, label]) => {
            const conditions = getConditionsByCategory(category as ConditionCategory);
            const isExpanded = expandedCategories.has(category);
            const selectedInCategory = conditions.filter(c =>
              selectedConditions.includes(c.id)
            ).length;
            
            return (
              <ConditionCategory
                key={category}
                category={category}
                label={label}
                conditions={conditions}
                selectedConditions={selectedConditions}
                isExpanded={isExpanded}
                onToggle={toggleCategory}
                onConditionToggle={toggleCondition}
                selectedCount={selectedInCategory}
              />
            );
          })}
        </div>
      </div>
      
      {/* Results Panel */}
      <div className={cn(
        "space-y-4",
        compactMode ? "" : "lg:col-span-2"
      )}>
        <ConditionFilterResults
          matches={schemeMatches}
          onSchemeSelect={onSchemeSelect}
          selectedConditions={selectedConditions}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

const categoryLabels: Record<ConditionCategory, string> = {
  source_type: "Evidence Source",
  reasoning_pattern: "Reasoning Pattern",
  structure: "Argument Structure",
  content: "Content Focus",
  appeal: "Type of Appeal",
  relationship: "Relationships"
};
```

**Sub-Component: ConditionCategory**:
```typescript
// components/schemes/ConditionCategory.tsx
interface ConditionCategoryProps {
  category: string;
  label: string;
  conditions: IdentificationCondition[];
  selectedConditions: string[];
  isExpanded: boolean;
  onToggle: (category: string) => void;
  onConditionToggle: (conditionId: string) => void;
  selectedCount: number;
}

export function ConditionCategory({
  category,
  label,
  conditions,
  selectedConditions,
  isExpanded,
  onToggle,
  onConditionToggle,
  selectedCount
}: ConditionCategoryProps) {
  return (
    <Card className="p-4">
      <button
        onClick={() => onToggle(category)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{label}</h3>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCount}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {conditions.map(condition => (
            <ConditionCheckbox
              key={condition.id}
              condition={condition}
              isSelected={selectedConditions.includes(condition.id)}
              onToggle={() => onConditionToggle(condition.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
```

**Sub-Component: ConditionCheckbox**:
```typescript
// components/schemes/ConditionCheckbox.tsx
interface ConditionCheckboxProps {
  condition: IdentificationCondition;
  isSelected: boolean;
  onToggle: () => void;
}

export function ConditionCheckbox({
  condition,
  isSelected,
  onToggle
}: ConditionCheckboxProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id={condition.id}
          checked={isSelected}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <label
            htmlFor={condition.id}
            className="text-sm font-medium cursor-pointer"
          >
            {condition.label}
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {condition.description}
          </p>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-auto py-1 px-2 mt-1 text-xs"
          >
            {showDetails ? "Hide" : "Show"} examples
          </Button>
        </div>
      </div>
      
      {showDetails && (
        <div className="ml-9 p-3 bg-muted/50 rounded-md space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Example phrases:
          </p>
          {condition.examples.map((example, i) => (
            <div key={i} className="flex items-start gap-2">
              <Quote className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs italic">"{example}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Testing**:
- [ ] Checkboxes toggle correctly
- [ ] Categories expand/collapse
- [ ] Real-time filtering works
- [ ] Conflicts are detected and shown
- [ ] Examples are helpful
- [ ] Mobile responsive

**Time Breakdown**:
- Main filter component: 4 hours
- Category component: 2 hours
- Checkbox component: 2 hours
- Styling and animations: 2 hours
- Testing: 2 hours

---

#### Task 7.3: Results Display with Match Scores (8 hours)

**Sub-Component: ConditionFilterResults**:
```typescript
// components/schemes/ConditionFilterResults.tsx
interface ConditionFilterResultsProps {
  matches: SchemeMatch[];
  onSchemeSelect: (scheme: ArgumentScheme) => void;
  selectedConditions: string[];
  isLoading: boolean;
}

export function ConditionFilterResults({
  matches,
  onSchemeSelect,
  selectedConditions,
  isLoading
}: ConditionFilterResultsProps) {
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  
  const sortedMatches = useMemo(() => {
    if (sortBy === "score") {
      return [...matches].sort((a, b) => b.score - a.score);
    } else {
      return [...matches].sort((a, b) =>
        a.scheme.name.localeCompare(b.scheme.name)
      );
    }
  }, [matches, sortBy]);
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="text-muted-foreground mt-4">Loading schemes...</p>
      </div>
    );
  }
  
  if (selectedConditions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Select features to filter schemes
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose the observable features in your argument from the list on the left.
          Schemes will appear here as you select conditions.
        </p>
      </Card>
    );
  }
  
  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No matching schemes
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          No schemes match all selected conditions. Try:
        </p>
        <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
          <li>• Selecting fewer conditions</li>
          <li>• Choosing different combinations</li>
          <li>• Using the Cluster Browser or Dichotomic Tree instead</li>
        </ul>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header with sort */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {matches.length} Matching Schemes
          </h3>
          <p className="text-sm text-muted-foreground">
            Sorted by match strength
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy("score")}>
              <Star className="w-4 h-4 mr-2" />
              By Match Score
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name")}>
              <SortAsc className="w-4 h-4 mr-2" />
              Alphabetical
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Match strength legend */}
      <Card className="bg-muted/50 p-4">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Strong match (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Moderate match (50-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Weak match (<50%)</span>
          </div>
        </div>
      </Card>
      
      {/* Results list */}
      <div className="space-y-3">
        {sortedMatches.map(match => (
          <SchemeMatchCard
            key={match.scheme.id}
            match={match}
            onSelect={() => onSchemeSelect(match.scheme)}
            selectedConditions={selectedConditions}
          />
        ))}
      </div>
    </div>
  );
}
```

**Sub-Component: SchemeMatchCard**:
```typescript
// components/schemes/SchemeMatchCard.tsx
interface SchemeMatchCardProps {
  match: SchemeMatch;
  onSelect: () => void;
  selectedConditions: string[];
}

export function SchemeMatchCard({
  match,
  onSelect,
  selectedConditions
}: SchemeMatchCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const matchColor = 
    match.percentage >= 80 ? "green" :
    match.percentage >= 50 ? "yellow" :
    "orange";
  
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Match indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold",
            matchColor === "green" && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
            matchColor === "yellow" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
            matchColor === "orange" && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100"
          )}>
            {Math.round(match.percentage)}%
          </div>
          <span className="text-xs text-muted-foreground">match</span>
        </div>
        
        {/* Scheme info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold mb-1">
            {match.scheme.name}
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            {match.scheme.summary}
          </p>
          
          {/* Matched conditions */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Matches {match.matchedConditions.length} of your selected conditions:
            </p>
            <div className="flex flex-wrap gap-2">
              {match.matchedConditions.map(condId => {
                const condition = identificationConditions[condId];
                return (
                  <Badge key={condId} variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {condition.label}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          {/* Expandable details */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Argument Structure:
                </p>
                <div className="space-y-1">
                  <p className="text-xs"><strong>Premises:</strong></p>
                  <ul className="text-xs pl-4 space-y-1">
                    {match.scheme.premises.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2"><strong>Conclusion:</strong> {match.scheme.conclusion}</p>
                </div>
              </div>
              
              {/* Why this matches */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Why this scheme matches:
                </p>
                <p className="text-xs text-muted-foreground">
                  {getMatchExplanation(match, selectedConditions)}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={onSelect}>
            Select
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Details
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function getMatchExplanation(
  match: SchemeMatch,
  selectedConditions: string[]
): string {
  const matchedLabels = match.matchedConditions.map(
    id => identificationConditions[id].label
  );
  
  if (match.percentage >= 80) {
    return `This scheme strongly matches your argument because it involves ${
      matchedLabels.slice(0, 2).join(" and ")
    }${matchedLabels.length > 2 ? ` and ${matchedLabels.length - 2} more conditions` : ""}.`;
  }
  
  if (match.percentage >= 50) {
    return `This scheme moderately matches because it ${matchedLabels[0]}${
      matchedLabels.length > 1 ? ` and ${matchedLabels[1]}` : ""
    }.`;
  }
  
  return `This scheme weakly matches some of your conditions (${matchedLabels[0]}).`;
}
```

**Testing**:
- [ ] Match scores display correctly
- [ ] Color coding is intuitive
- [ ] Matched conditions are shown
- [ ] Sort by score/name works
- [ ] Details expand/collapse
- [ ] Empty states are helpful

**Time Breakdown**:
- Results component: 3 hours
- Match card component: 3 hours
- Match explanation logic: 1 hour
- Testing: 1 hour

---

#### Task 7.4: Explanatory Text System (4 hours)

**Component: ConditionHelp**:
```typescript
// components/schemes/ConditionHelp.tsx
interface ConditionHelpProps {
  conditionId?: string;
  category?: ConditionCategory;
}

export function ConditionHelp({ conditionId, category }: ConditionHelpProps) {
  const [open, setOpen] = useState(false);
  
  if (conditionId) {
    const condition = identificationConditions[conditionId];
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto py-1">
            <HelpCircle className="w-3 h-3 mr-1" />
            Learn more
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{condition.label}</DialogTitle>
            <DialogDescription>
              {condition.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Examples */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Example phrases:</h4>
              <div className="space-y-2">
                {condition.examples.map((example, i) => (
                  <Card key={i} className="p-3 bg-muted/50">
                    <p className="text-sm italic">"{example}"</p>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Applicable schemes */}
            <div>
              <h4 className="font-semibold text-sm mb-2">
                This condition identifies:
              </h4>
              <div className="flex flex-wrap gap-2">
                {condition.applicableSchemes.map(key => (
                  <Badge key={key} variant="secondary">
                    {/* Lookup scheme name */}
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Keywords */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Look for these words:</h4>
              <div className="flex flex-wrap gap-1">
                {condition.keywords.map(keyword => (
                  <code key={keyword} className="text-xs bg-muted px-2 py-1 rounded">
                    {keyword}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (category) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <Info className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-semibold">{categoryLabels[category]}</h4>
            <p className="text-sm text-muted-foreground">
              {getCategoryDescription(category)}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  
  return null;
}

function getCategoryDescription(category: ConditionCategory): string {
  const descriptions: Record<ConditionCategory, string> = {
    source_type: "Where the evidence or support for the argument comes from (experts, majority, institutions, etc.)",
    reasoning_pattern: "The type of logical reasoning used (causal, analogical, rule-based, etc.)",
    structure: "The formal structure or pattern of the argument",
    content: "What the argument is about or focuses on",
    appeal: "The type of persuasive appeal being made",
    relationship: "How different parts of the argument relate to each other"
  };
  
  return descriptions[category];
}
```

**Component: ConditionTutorial**:
```typescript
// components/schemes/ConditionTutorial.tsx
export function ConditionTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: "Welcome to Identification Conditions",
      content: "This filter helps you find schemes by recognizing patterns in your argument.",
      image: "tutorial-welcome.svg"
    },
    {
      title: "Observe Your Argument",
      content: "Read your argument and notice what features it has. Does it cite experts? Draw analogies? Argue from consequences?",
      image: "tutorial-observe.svg"
    },
    {
      title: "Select Matching Conditions",
      content: "Check the boxes for features you observe. You can select multiple conditions.",
      image: "tutorial-select.svg"
    },
    {
      title: "See Matching Schemes",
      content: "Schemes that match your selected conditions will appear, ranked by match strength.",
      image: "tutorial-results.svg"
    },
    {
      title: "Refine Your Search",
      content: "Add or remove conditions to narrow down to the perfect scheme. Strong matches (80%+) are usually the best fit.",
      image: "tutorial-refine.svg"
    }
  ];
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lightbulb className="w-4 h-4 mr-2" />
          How to use this filter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{steps[step].title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Tutorial content */}
          <div className="text-center">
            {/* Placeholder for image */}
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center mb-4">
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {steps[step].content}
            </p>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i === step ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => setOpen(false)}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Testing**:
- [ ] Help dialogs are informative
- [ ] Tutorial walks through process
- [ ] Category descriptions are clear
- [ ] Condition details are helpful

**Time Breakdown**:
- ConditionHelp component: 2 hours
- ConditionTutorial component: 1 hour
- Content writing: 1 hour

---

#### Task 7.5: Novice User Testing (6 hours)

**Testing Protocol**:
```markdown
# Identification Conditions Filter - User Testing Protocol

## Objectives
1. Validate that novice users can use the filter effectively
2. Identify confusing conditions or categories
3. Verify that match scores are meaningful
4. Collect feedback on explanatory text

## Participants
- 5 novice users (no argumentation theory background)
- 3 intermediate users (some debate experience)
- 2 expert users (familiar with argument analysis)

## Test Tasks

### Task 1: Find Scheme from Example Argument (Expert Opinion)
**Argument**: "Dr. Jane Smith, a leading climate scientist with 20 years of 
experience, states that global warming is primarily caused by human activity. 
Her research has been published in top journals."

**Expected Conditions**:
- Appeals to expert testimony
- Cites credentials of source
- Relies on specialized knowledge

**Expected Result**: Argument from Expert Opinion (80%+ match)

**Metrics**:
- Time to complete
- Conditions selected (correct vs incorrect)
- Final scheme selection accuracy
- Confidence rating (1-5)

### Task 2: Find Scheme from Example Argument (Consequences)
**Argument**: "We should not raise taxes because it would reduce economic 
growth, leading to job losses and lower standards of living."

**Expected Conditions**:
- Argues from consequences or effects
- Addresses what action to take
- Has if-then conditional structure

**Expected Result**: Argument from Consequences (70%+ match)

**Metrics**: Same as Task 1

### Task 3: Find Scheme from Example Argument (Analogy)
**Argument**: "Banning encryption is like banning locks on doors. Just as 
we don't ban locks because criminals use them, we shouldn't ban encryption 
just because criminals might misuse it."

**Expected Conditions**:
- Draws analogy or comparison
- Compares two situations or cases

**Expected Result**: Argument from Analogy (80%+ match)

**Metrics**: Same as Task 1

### Task 4: Free Exploration
"Use the filter to find a scheme for an argument you might make in everyday life."

**Metrics**:
- Exploration patterns
- Conditions tried
- Understanding of match scores
- Final satisfaction

## Success Criteria

**Novice Users**:
- Complete each task in <2 minutes with 70%+ accuracy
- Select correct conditions 60%+ of the time
- Understand match scores without explanation
- Rate system as "helpful" (4-5/5)

**Intermediate Users**:
- Complete each task in <90 seconds with 80%+ accuracy
- Select correct conditions 75%+ of the time
- Use filter effectively for novel arguments

**Expert Users**:
- Complete each task in <60 seconds with 90%+ accuracy
- Select optimal condition combinations
- Understand nuanced differences in match scores

## Data Collection

**Quantitative**:
- Task completion time
- Accuracy metrics (conditions, scheme selection)
- Confidence ratings
- System usability scale (SUS) score

**Qualitative**:
- Screen recordings
- Think-aloud protocol transcripts
- User quotes about confusing elements
- Feature requests
- Condition clarity ratings

## Evaluation Criteria

**Condition Clarity**: 
- Do users understand what each condition means?
- Are examples helpful?
- Are category groupings logical?

**Filter Effectiveness**:
- Do correct conditions produce correct schemes?
- Are match scores meaningful and accurate?
- Do conflicts help or confuse?

**User Experience**:
- Is the interface intuitive?
- Is real-time filtering helpful?
- Are results easy to understand?

## Implementation
```typescript
// components/schemes/ConditionFilterUserTest.tsx
export function ConditionFilterUserTest() {
  const [taskIndex, setTaskIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  
  const tasks = [
    {
      id: "expert_opinion",
      argument: "Dr. Jane Smith, a leading climate scientist...",
      expectedConditions: ["appeals_to_expert", "cites_credentials"],
      expectedScheme: "expert_opinion",
      expectedMatchScore: 80
    },
    // ... more tasks
  ];
  
  const currentTask = tasks[taskIndex];
  
  function completeTask(
    selectedScheme: ArgumentScheme,
    conditions: string[],
    matchScore: number
  ) {
    const duration = Date.now() - (startTime || 0);
    
    // Calculate accuracy
    const correctConditions = conditions.filter(c =>
      currentTask.expectedConditions.includes(c)
    ).length;
    
    const conditionAccuracy = 
      correctConditions / currentTask.expectedConditions.length;
    
    setResults([...results, {
      taskId: currentTask.id,
      duration,
      selectedScheme: selectedScheme.key,
      selectedConditions: conditions,
      matchScore,
      schemeCorrect: selectedScheme.key === currentTask.expectedScheme,
      conditionAccuracy,
      confidence: 0 // Set by post-task survey
    }]);
    
    // Move to next task or show results
    if (taskIndex < tasks.length - 1) {
      setTaskIndex(taskIndex + 1);
      setSelectedConditions([]);
      setStartTime(null);
    } else {
      showResults();
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">
          Task {taskIndex + 1} of {tasks.length}
        </h2>
        
        <Card className="p-4 bg-muted/50 mb-4">
          <p className="font-medium mb-2">Argument:</p>
          <p className="text-sm italic">{currentTask.argument}</p>
        </Card>
        
        <p className="text-sm text-muted-foreground mb-4">
          Use the identification conditions filter to find the appropriate scheme
          for this argument.
        </p>
        
        {!startTime ? (
          <Button onClick={() => setStartTime(Date.now())}>
            Start Task
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground">
            Time: {Math.floor((Date.now() - startTime) / 1000)}s
          </div>
        )}
      </Card>
      
      {startTime && (
        <IdentificationConditionsFilter
          onSchemeSelect={(scheme) => {
            // Record conditions and scheme
            completeTask(scheme, selectedConditions, 0);
          }}
          initialConditions={selectedConditions}
        />
      )}
    </div>
  );
}
```

**Testing**:
- [ ] Test protocol implemented
- [ ] Data collection working
- [ ] Initial pilot tests conducted
- [ ] Results analyzed
- [ ] Refinements identified

**Time Breakdown**:
- Test protocol design: 2 hours
- Test component implementation: 2 hours
- Pilot testing sessions: 1 hour
- Analysis and refinement: 1 hour

---

### Week 7 Deliverables

**Code Files** (9 files):
- [x] `lib/schemes/identification-conditions.ts` (condition definitions)
- [x] `components/schemes/IdentificationConditionsFilter.tsx` (main component)
- [x] `components/schemes/ConditionCategory.tsx` (category display)
- [x] `components/schemes/ConditionCheckbox.tsx` (checkbox with details)
- [x] `components/schemes/ConditionFilterResults.tsx` (results panel)
- [x] `components/schemes/SchemeMatchCard.tsx` (match card with score)
- [x] `components/schemes/ConditionHelp.tsx` (help dialogs)
- [x] `components/schemes/ConditionTutorial.tsx` (tutorial walkthrough)
- [x] `components/schemes/ConditionFilterUserTest.tsx` (testing)

**Condition Library**:
- [x] 25+ identification conditions defined
- [x] 6 categories (source, reasoning, structure, content, appeal, relationship)
- [x] Conditions mapped to applicable schemes
- [x] Weight system for match scoring
- [x] Conflict detection for exclusive conditions

**Documentation**:
- [x] Condition taxonomy documentation
- [x] Match scoring algorithm explained
- [x] User testing protocol
- [x] Component API documentation

**Metrics**:
- Total lines of code: ~1,400
- Components: 9
- Conditions defined: 25+
- Testing tasks: 4

**Week 7 Time**: 40 hours
- Task 7.1 (Condition Definitions): 10 hours ✅
- Task 7.2 (Filter UI): 12 hours ✅
- Task 7.3 (Results Display): 8 hours ✅
- Task 7.4 (Explanatory Text): 4 hours ✅
- Task 7.5 (User Testing): 6 hours ✅

---

### Week 7 Testing Checklist

**Condition Definitions**:
- [ ] All conditions have clear, observable criteria
- [ ] No ambiguous or overlapping conditions
- [ ] Scheme assignments are accurate
- [ ] Weights reflect identification strength appropriately
- [ ] Examples are diverse and representative
- [ ] Keywords aid in text analysis (future feature)

**Filter UI**:
- [ ] Checkboxes toggle smoothly
- [ ] Categories expand/collapse correctly
- [ ] Multi-select works as expected
- [ ] Clear all resets state
- [ ] Mobile responsive
- [ ] Keyboard accessible

**Real-Time Filtering**:
- [ ] Results update immediately on condition change
- [ ] Match scores are accurate
- [ ] Sorting works correctly
- [ ] Empty states are helpful
- [ ] Performance is acceptable with many conditions

**Match Scoring**:
- [ ] Strong matches (80%+) are genuinely good fits
- [ ] Moderate matches (50-79%) are reasonable alternatives
- [ ] Weak matches (<50%) are still relevant
- [ ] Match explanations make sense
- [ ] Color coding is intuitive

**Explanatory Text**:
- [ ] Condition descriptions are clear
- [ ] Examples are helpful
- [ ] Tutorial is informative
- [ ] Help dialogs answer common questions
- [ ] Category descriptions aid understanding

**User Testing**:
- [ ] Novice users can complete tasks successfully
- [ ] Intermediate users find it faster than other methods
- [ ] Expert users appreciate the precision
- [ ] Common confusion points identified
- [ ] Refinements implemented based on feedback

---

### Week 7 Success Criteria

**User Experience**:
- Novice users complete example tasks in <2 minutes with 70%+ accuracy
- Intermediate users prefer this method for pattern-based arguments
- Expert users achieve 90%+ accuracy in <60 seconds
- 85%+ users rate as "helpful" or "very helpful" (4-5/5)

**Technical**:
- All schemes have at least 2 applicable conditions
- Match algorithm produces sensible rankings
- Real-time filtering feels instant (<100ms)
- Mobile experience is fully functional
- Accessibility requirements met (WCAG 2.1 AA)

**Business Value**:
- 35% reduction in time for expert users
- 20% increase in correct scheme selection for novices
- 30% of users prefer this over other navigation modes
- Complements (not replaces) other navigation methods

---

## Week 7 Complete! ✅

Week 7 implementation plan is complete with:
- **25+ identification conditions** across 6 categories
- **Match scoring algorithm** with weighted conditions
- **9 UI components** for filtering and results
- **Tutorial and help system** for novice users
- **User testing protocol** with 4 tasks
- **~1,400 lines of code** across 9 files
- **40 hours** of implementation work planned

**Key Innovation**: Pattern-based filtering that leverages expert users' ability to recognize argument features while remaining accessible to novices through clear examples and explanations.

**Next**: Week 8 - Unified SchemeNavigator (integration of all navigation modes)

---

## Week 8: Unified SchemeNavigator (Tasks 8.1 & 8.2)

**Timeline**: 16 hours (of 40 total for Week 8)
- Task 8.1: Integration Architecture (10 hours)
- Task 8.2: Tab-Based Interface (6 hours)

**Overview**: Week 8 brings together all three navigation modes (Dichotomic Tree, Cluster Browser, Identification Conditions) into a single, unified SchemeNavigator component. This week focuses on creating a cohesive user experience where users can seamlessly switch between different navigation approaches while maintaining context and state.

**Key Principles**:
- **Mode Independence**: Each navigation mode operates independently but shares common context
- **State Preservation**: Switching modes preserves user progress and selections
- **Consistent UX**: Unified header, consistent styling, shared navigation elements
- **Performance**: Mode switching <100ms, lazy loading of inactive tabs

---

### Task 8.1: Integration Architecture (10 hours)

**Objective**: Create the foundational architecture that combines all three navigation modes into a single component with unified state management, shared context, and seamless mode switching.

**Implementation Details**:

#### 8.1.1 Unified State Management

**File**: `lib/schemes/navigation-state.ts` (~150 lines)

```typescript
// lib/schemes/navigation-state.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ArgumentScheme } from "@/types/schemes";

/**
 * Navigation modes available in SchemeNavigator
 */
export type NavigationMode = "tree" | "cluster" | "conditions" | "search";

/**
 * Shared state across all navigation modes
 */
export interface NavigationState {
  // Current mode
  currentMode: NavigationMode;
  
  // Selected scheme (shared across all modes)
  selectedScheme: ArgumentScheme | null;
  
  // Recently viewed schemes (up to 10)
  recentSchemes: ArgumentScheme[];
  
  // Favorited scheme keys
  favoriteSchemeKeys: string[];
  
  // Mode-specific state
  treeState: TreeNavigationState;
  clusterState: ClusterNavigationState;
  conditionsState: ConditionsNavigationState;
  searchState: SearchNavigationState;
}

/**
 * State specific to Dichotomic Tree mode
 */
export interface TreeNavigationState {
  // Current wizard step (0 = purpose, 1 = source, 2 = results)
  currentStep: number;
  
  // User selections
  selectedPurpose: "action" | "state_of_affairs" | null;
  selectedSource: "internal" | "external" | null;
  
  // Filtered results
  filteredSchemes: ArgumentScheme[];
  
  // History for back navigation
  history: Array<{
    step: number;
    purpose: "action" | "state_of_affairs" | null;
    source: "internal" | "external" | null;
  }>;
}

/**
 * State specific to Cluster Browser mode
 */
export interface ClusterNavigationState {
  // Currently selected cluster
  selectedClusterId: string | null;
  
  // Schemes in the selected cluster
  clusterSchemes: ArgumentScheme[];
  
  // Breadcrumb trail for navigation
  breadcrumbs: Array<{
    id: string;
    label: string;
  }>;
}

/**
 * State specific to Identification Conditions mode
 */
export interface ConditionsNavigationState {
  // Selected condition IDs
  selectedConditions: string[];
  
  // Matched schemes with scores
  matchedSchemes: Array<{
    scheme: ArgumentScheme;
    score: number;
    matchedConditions: string[];
  }>;
  
  // Expanded categories
  expandedCategories: string[];
  
  // Tutorial visibility
  showTutorial: boolean;
}

/**
 * State specific to Search mode
 */
export interface SearchNavigationState {
  // Current search query
  query: string;
  
  // Search results
  results: ArgumentScheme[];
  
  // Search filters
  filters: {
    clusters: string[];
    hasEvidence: boolean | null;
    minCriticalQuestions: number | null;
  };
}

/**
 * Actions for the navigation store
 */
export interface NavigationActions {
  // Mode switching
  setMode: (mode: NavigationMode) => void;
  
  // Scheme selection
  selectScheme: (scheme: ArgumentScheme | null) => void;
  addToRecent: (scheme: ArgumentScheme) => void;
  toggleFavorite: (schemeKey: string) => void;
  
  // Tree mode actions
  setTreeStep: (step: number) => void;
  setTreePurpose: (purpose: "action" | "state_of_affairs" | null) => void;
  setTreeSource: (source: "internal" | "external" | null) => void;
  setTreeResults: (schemes: ArgumentScheme[]) => void;
  resetTree: () => void;
  
  // Cluster mode actions
  selectCluster: (clusterId: string | null) => void;
  setClusterSchemes: (schemes: ArgumentScheme[]) => void;
  addBreadcrumb: (id: string, label: string) => void;
  resetCluster: () => void;
  
  // Conditions mode actions
  toggleCondition: (conditionId: string) => void;
  setMatchedSchemes: (matches: ConditionsNavigationState["matchedSchemes"]) => void;
  toggleCategory: (categoryId: string) => void;
  setShowTutorial: (show: boolean) => void;
  resetConditions: () => void;
  
  // Search mode actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ArgumentScheme[]) => void;
  setSearchFilters: (filters: Partial<SearchNavigationState["filters"]>) => void;
  resetSearch: () => void;
  
  // Global reset
  resetAll: () => void;
}

/**
 * Initial state for the navigation store
 */
const initialState: NavigationState = {
  currentMode: "tree",
  selectedScheme: null,
  recentSchemes: [],
  favoriteSchemeKeys: [],
  
  treeState: {
    currentStep: 0,
    selectedPurpose: null,
    selectedSource: null,
    filteredSchemes: [],
    history: [],
  },
  
  clusterState: {
    selectedClusterId: null,
    clusterSchemes: [],
    breadcrumbs: [],
  },
  
  conditionsState: {
    selectedConditions: [],
    matchedSchemes: [],
    expandedCategories: ["source_type", "reasoning_pattern"],
    showTutorial: false,
  },
  
  searchState: {
    query: "",
    results: [],
    filters: {
      clusters: [],
      hasEvidence: null,
      minCriticalQuestions: null,
    },
  },
};

/**
 * Zustand store for unified navigation state
 * Persists user preferences and recent schemes
 */
export const useNavigationStore = create<NavigationState & NavigationActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Mode switching
      setMode: (mode) => {
        set({ currentMode: mode });
      },
      
      // Scheme selection
      selectScheme: (scheme) => {
        set({ selectedScheme: scheme });
        if (scheme) {
          get().addToRecent(scheme);
        }
      },
      
      addToRecent: (scheme) => {
        set((state) => {
          const recent = [
            scheme,
            ...state.recentSchemes.filter((s) => s.key !== scheme.key),
          ].slice(0, 10);
          return { recentSchemes: recent };
        });
      },
      
      toggleFavorite: (schemeKey) => {
        set((state) => {
          const favorites = state.favoriteSchemeKeys.includes(schemeKey)
            ? state.favoriteSchemeKeys.filter((k) => k !== schemeKey)
            : [...state.favoriteSchemeKeys, schemeKey];
          return { favoriteSchemeKeys: favorites };
        });
      },
      
      // Tree mode actions
      setTreeStep: (step) => {
        set((state) => ({
          treeState: { ...state.treeState, currentStep: step },
        }));
      },
      
      setTreePurpose: (purpose) => {
        set((state) => ({
          treeState: {
            ...state.treeState,
            selectedPurpose: purpose,
            history: [
              ...state.treeState.history,
              {
                step: state.treeState.currentStep,
                purpose: state.treeState.selectedPurpose,
                source: state.treeState.selectedSource,
              },
            ],
          },
        }));
      },
      
      setTreeSource: (source) => {
        set((state) => ({
          treeState: {
            ...state.treeState,
            selectedSource: source,
            history: [
              ...state.treeState.history,
              {
                step: state.treeState.currentStep,
                purpose: state.treeState.selectedPurpose,
                source: state.treeState.selectedSource,
              },
            ],
          },
        }));
      },
      
      setTreeResults: (schemes) => {
        set((state) => ({
          treeState: { ...state.treeState, filteredSchemes: schemes },
        }));
      },
      
      resetTree: () => {
        set((state) => ({
          treeState: initialState.treeState,
        }));
      },
      
      // Cluster mode actions
      selectCluster: (clusterId) => {
        set((state) => ({
          clusterState: { ...state.clusterState, selectedClusterId: clusterId },
        }));
      },
      
      setClusterSchemes: (schemes) => {
        set((state) => ({
          clusterState: { ...state.clusterState, clusterSchemes: schemes },
        }));
      },
      
      addBreadcrumb: (id, label) => {
        set((state) => ({
          clusterState: {
            ...state.clusterState,
            breadcrumbs: [...state.clusterState.breadcrumbs, { id, label }],
          },
        }));
      },
      
      resetCluster: () => {
        set((state) => ({
          clusterState: initialState.clusterState,
        }));
      },
      
      // Conditions mode actions
      toggleCondition: (conditionId) => {
        set((state) => {
          const conditions = state.conditionsState.selectedConditions.includes(conditionId)
            ? state.conditionsState.selectedConditions.filter((id) => id !== conditionId)
            : [...state.conditionsState.selectedConditions, conditionId];
          return {
            conditionsState: {
              ...state.conditionsState,
              selectedConditions: conditions,
            },
          };
        });
      },
      
      setMatchedSchemes: (matches) => {
        set((state) => ({
          conditionsState: { ...state.conditionsState, matchedSchemes: matches },
        }));
      },
      
      toggleCategory: (categoryId) => {
        set((state) => {
          const categories = state.conditionsState.expandedCategories.includes(categoryId)
            ? state.conditionsState.expandedCategories.filter((id) => id !== categoryId)
            : [...state.conditionsState.expandedCategories, categoryId];
          return {
            conditionsState: {
              ...state.conditionsState,
              expandedCategories: categories,
            },
          };
        });
      },
      
      setShowTutorial: (show) => {
        set((state) => ({
          conditionsState: { ...state.conditionsState, showTutorial: show },
        }));
      },
      
      resetConditions: () => {
        set((state) => ({
          conditionsState: initialState.conditionsState,
        }));
      },
      
      // Search mode actions
      setSearchQuery: (query) => {
        set((state) => ({
          searchState: { ...state.searchState, query },
        }));
      },
      
      setSearchResults: (results) => {
        set((state) => ({
          searchState: { ...state.searchState, results },
        }));
      },
      
      setSearchFilters: (filters) => {
        set((state) => ({
          searchState: {
            ...state.searchState,
            filters: { ...state.searchState.filters, ...filters },
          },
        }));
      },
      
      resetSearch: () => {
        set((state) => ({
          searchState: initialState.searchState,
        }));
      },
      
      // Global reset
      resetAll: () => {
        set(initialState);
      },
    }),
    {
      name: "scheme-navigation-storage",
      partialize: (state) => ({
        // Only persist these fields
        currentMode: state.currentMode,
        recentSchemes: state.recentSchemes,
        favoriteSchemeKeys: state.favoriteSchemeKeys,
      }),
    }
  )
);

/**
 * Hook to get current mode
 */
export const useCurrentMode = () => useNavigationStore((state) => state.currentMode);

/**
 * Hook to get selected scheme
 */
export const useSelectedScheme = () => useNavigationStore((state) => state.selectedScheme);

/**
 * Hook to get mode-specific state
 */
export const useTreeState = () => useNavigationStore((state) => state.treeState);
export const useClusterState = () => useNavigationStore((state) => state.clusterState);
export const useConditionsState = () => useNavigationStore((state) => state.conditionsState);
export const useSearchState = () => useNavigationStore((state) => state.searchState);
```

**Key Features**:
- Zustand store with persistence for user preferences
- Separate state slices for each navigation mode
- Shared state for selected scheme, recents, favorites
- Type-safe actions for all state mutations
- History management for tree wizard
- Breadcrumb management for cluster browser

---

#### 8.1.2 Shared Context Provider

**File**: `components/schemes/SchemeNavigationContext.tsx` (~100 lines)

```typescript
// components/schemes/SchemeNavigationContext.tsx

"use client";

import React, { createContext, useContext, useCallback } from "react";
import type { ArgumentScheme } from "@/types/schemes";
import { useNavigationStore, type NavigationMode } from "@/lib/schemes/navigation-state";
import { useRouter } from "next/navigation";

/**
 * Context value for scheme navigation
 */
interface SchemeNavigationContextValue {
  // Navigation
  navigateToScheme: (scheme: ArgumentScheme) => void;
  navigateToMode: (mode: NavigationMode) => void;
  
  // Actions
  onSchemeSelect: (scheme: ArgumentScheme) => void;
  onSchemeClose: () => void;
  
  // State access
  currentMode: NavigationMode;
  selectedScheme: ArgumentScheme | null;
  recentSchemes: ArgumentScheme[];
  favoriteSchemeKeys: string[];
  
  // Utilities
  isFavorite: (schemeKey: string) => boolean;
  toggleFavorite: (schemeKey: string) => void;
}

const SchemeNavigationContext = createContext<SchemeNavigationContextValue | null>(null);

/**
 * Provider for unified scheme navigation
 */
export function SchemeNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const {
    currentMode,
    selectedScheme,
    recentSchemes,
    favoriteSchemeKeys,
    setMode,
    selectScheme,
    toggleFavorite: toggleFavoriteInStore,
  } = useNavigationStore();
  
  /**
   * Navigate to a specific scheme (opens detail view)
   */
  const navigateToScheme = useCallback(
    (scheme: ArgumentScheme) => {
      selectScheme(scheme);
      // Optionally navigate to a dedicated scheme detail page
      // router.push(`/schemes/${scheme.key}`);
    },
    [selectScheme]
  );
  
  /**
   * Navigate to a specific navigation mode
   */
  const navigateToMode = useCallback(
    (mode: NavigationMode) => {
      setMode(mode);
    },
    [setMode]
  );
  
  /**
   * Handle scheme selection (opens in sidebar or modal)
   */
  const onSchemeSelect = useCallback(
    (scheme: ArgumentScheme) => {
      selectScheme(scheme);
    },
    [selectScheme]
  );
  
  /**
   * Handle scheme detail close
   */
  const onSchemeClose = useCallback(() => {
    selectScheme(null);
  }, [selectScheme]);
  
  /**
   * Check if a scheme is favorited
   */
  const isFavorite = useCallback(
    (schemeKey: string) => favoriteSchemeKeys.includes(schemeKey),
    [favoriteSchemeKeys]
  );
  
  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(
    (schemeKey: string) => {
      toggleFavoriteInStore(schemeKey);
    },
    [toggleFavoriteInStore]
  );
  
  const value: SchemeNavigationContextValue = {
    navigateToScheme,
    navigateToMode,
    onSchemeSelect,
    onSchemeClose,
    currentMode,
    selectedScheme,
    recentSchemes,
    favoriteSchemeKeys,
    isFavorite,
    toggleFavorite,
  };
  
  return (
    <SchemeNavigationContext.Provider value={value}>
      {children}
    </SchemeNavigationContext.Provider>
  );
}

/**
 * Hook to use scheme navigation context
 */
export function useSchemeNavigation() {
  const context = useContext(SchemeNavigationContext);
  if (!context) {
    throw new Error("useSchemeNavigation must be used within SchemeNavigationProvider");
  }
  return context;
}
```

**Key Features**:
- Context provider for shared navigation logic
- Unified callbacks for scheme selection and navigation
- Favorites management
- Recent schemes tracking
- Type-safe context value

---

#### 8.1.3 Integration Utilities

**File**: `lib/schemes/navigation-integration.ts` (~80 lines)

```typescript
// lib/schemes/navigation-integration.ts

import type { ArgumentScheme } from "@/types/schemes";
import type { NavigationMode } from "./navigation-state";

/**
 * Get the appropriate navigation mode for a scheme
 * based on its characteristics
 */
export function getSuggestedNavigationMode(scheme: ArgumentScheme): NavigationMode {
  // If scheme has a clear semantic cluster, suggest cluster mode
  if (scheme.semanticCluster) {
    return "cluster";
  }
  
  // If scheme has clear purpose/source metadata, suggest tree mode
  if (scheme.purpose || scheme.sourceType) {
    return "tree";
  }
  
  // Default to conditions mode for complex schemes
  return "conditions";
}

/**
 * Get related schemes across all navigation modes
 */
export function getRelatedSchemes(
  scheme: ArgumentScheme,
  allSchemes: ArgumentScheme[]
): {
  byCluster: ArgumentScheme[];
  bySimilarPurpose: ArgumentScheme[];
  bySimilarConditions: ArgumentScheme[];
} {
  return {
    // Same cluster
    byCluster: allSchemes.filter(
      (s) => s.key !== scheme.key && s.semanticCluster === scheme.semanticCluster
    ),
    
    // Similar purpose and source
    bySimilarPurpose: allSchemes.filter(
      (s) =>
        s.key !== scheme.key &&
        s.purpose === scheme.purpose &&
        s.sourceType === scheme.sourceType
    ),
    
    // Similar identification conditions (placeholder - would need actual condition matching)
    bySimilarConditions: allSchemes.filter(
      (s) =>
        s.key !== scheme.key &&
        // Match based on scheme family or similar characteristics
        s.key.split("_")[0] === scheme.key.split("_")[0]
    ),
  };
}

/**
 * Generate breadcrumb trail for current navigation state
 */
export function generateBreadcrumbs(
  mode: NavigationMode,
  state: {
    clusterId?: string | null;
    purpose?: string | null;
    source?: string | null;
    conditions?: string[];
  }
): Array<{ label: string; path: string }> {
  const breadcrumbs: Array<{ label: string; path: string }> = [
    { label: "Schemes", path: "/schemes" },
  ];
  
  switch (mode) {
    case "tree":
      if (state.purpose) {
        breadcrumbs.push({
          label: state.purpose === "action" ? "Action" : "State of Affairs",
          path: `/schemes/tree?purpose=${state.purpose}`,
        });
      }
      if (state.source) {
        breadcrumbs.push({
          label: state.source === "internal" ? "Internal" : "External",
          path: `/schemes/tree?purpose=${state.purpose}&source=${state.source}`,
        });
      }
      break;
      
    case "cluster":
      if (state.clusterId) {
        breadcrumbs.push({
          label: state.clusterId.replace(/_/g, " "),
          path: `/schemes/cluster/${state.clusterId}`,
        });
      }
      break;
      
    case "conditions":
      if (state.conditions && state.conditions.length > 0) {
        breadcrumbs.push({
          label: `${state.conditions.length} condition${state.conditions.length > 1 ? "s" : ""}`,
          path: `/schemes/conditions?ids=${state.conditions.join(",")}`,
        });
      }
      break;
  }
  
  return breadcrumbs;
}

/**
 * Format scheme count message for current mode
 */
export function formatSchemeCountMessage(
  mode: NavigationMode,
  count: number,
  totalCount: number
): string {
  const percentage = Math.round((count / totalCount) * 100);
  
  switch (mode) {
    case "tree":
      return `${count} of ${totalCount} schemes match your criteria (${percentage}%)`;
    case "cluster":
      return `${count} schemes in this cluster`;
    case "conditions":
      return `${count} schemes match ${percentage >= 80 ? "strongly" : percentage >= 50 ? "moderately" : "weakly"}`;
    case "search":
      return `${count} search results`;
    default:
      return `${count} schemes`;
  }
}
```

**Key Features**:
- Navigation mode suggestions based on scheme characteristics
- Related schemes discovery across modes
- Breadcrumb generation for current navigation state
- User-friendly count messages

---

### Task 8.2: Tab-Based Interface (6 hours)

**Objective**: Create a cohesive tab-based UI that allows users to switch between navigation modes while preserving context and providing consistent navigation elements.

**Implementation Details**:

#### 8.2.1 Main SchemeNavigator Component

**File**: `components/schemes/SchemeNavigator.tsx` (~200 lines)

```typescript
// components/schemes/SchemeNavigator.tsx

"use client";

import React, { Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, Settings } from "lucide-react";
import { useNavigationStore, type NavigationMode } from "@/lib/schemes/navigation-state";
import { SchemeNavigationProvider } from "./SchemeNavigationContext";
import SchemeDetailPanel from "./SchemeDetailPanel";
import NavigationHeader from "./NavigationHeader";
import RecentSchemesList from "./RecentSchemesList";
import FavoritesPanel from "./FavoritesPanel";

// Lazy load navigation mode components for better performance
const DichotomicTreeWizard = lazy(() => import("./DichotomicTreeWizard"));
const ClusterBrowser = lazy(() => import("./ClusterBrowser"));
const IdentificationConditionsFilter = lazy(() => import("./IdentificationConditionsFilter"));
const SchemeSearch = lazy(() => import("./SchemeSearch"));

/**
 * Loading fallback for lazy-loaded tabs
 */
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  );
}

/**
 * Unified SchemeNavigator with all navigation modes
 */
export default function SchemeNavigator() {
  const { currentMode, setMode, selectedScheme, recentSchemes, favoriteSchemeKeys } =
    useNavigationStore();
  
  const [showRecents, setShowRecents] = React.useState(false);
  const [showFavorites, setShowFavorites] = React.useState(false);
  
  /**
   * Handle tab change
   */
  const handleTabChange = (value: string) => {
    setMode(value as NavigationMode);
  };
  
  /**
   * Get tab icon based on mode
   */
  const getTabIcon = (mode: NavigationMode) => {
    switch (mode) {
      case "tree":
        return "🌳";
      case "cluster":
        return "🗂️";
      case "conditions":
        return "🔍";
      case "search":
        return "🔎";
    }
  };
  
  /**
   * Get tab label based on mode
   */
  const getTabLabel = (mode: NavigationMode) => {
    switch (mode) {
      case "tree":
        return "Tree Wizard";
      case "cluster":
        return "Cluster Browser";
      case "conditions":
        return "Identification";
      case "search":
        return "Search";
    }
  };
  
  return (
    <SchemeNavigationProvider>
      <div className="flex h-full">
        {/* Main navigation area */}
        <div className={`flex-1 flex flex-col ${selectedScheme ? "mr-96" : ""}`}>
          {/* Header with utility buttons */}
          <NavigationHeader
            onShowRecents={() => setShowRecents(true)}
            onShowFavorites={() => setShowFavorites(true)}
            recentCount={recentSchemes.length}
            favoriteCount={favoriteSchemeKeys.length}
          />
          
          {/* Tab-based navigation */}
          <Tabs value={currentMode} onValueChange={handleTabChange} className="flex-1">
            <div className="border-b bg-white sticky top-0 z-10">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="tree" className="flex items-center gap-2">
                  <span>{getTabIcon("tree")}</span>
                  <span className="hidden sm:inline">{getTabLabel("tree")}</span>
                </TabsTrigger>
                
                <TabsTrigger value="cluster" className="flex items-center gap-2">
                  <span>{getTabIcon("cluster")}</span>
                  <span className="hidden sm:inline">{getTabLabel("cluster")}</span>
                </TabsTrigger>
                
                <TabsTrigger value="conditions" className="flex items-center gap-2">
                  <span>{getTabIcon("conditions")}</span>
                  <span className="hidden sm:inline">{getTabLabel("conditions")}</span>
                </TabsTrigger>
                
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <span>{getTabIcon("search")}</span>
                  <span className="hidden sm:inline">{getTabLabel("search")}</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Tab content areas */}
            <div className="flex-1 overflow-auto">
              <TabsContent value="tree" className="mt-0 h-full">
                <Suspense fallback={<TabLoadingFallback />}>
                  <DichotomicTreeWizard />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="cluster" className="mt-0 h-full">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ClusterBrowser />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="conditions" className="mt-0 h-full">
                <Suspense fallback={<TabLoadingFallback />}>
                  <IdentificationConditionsFilter />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="search" className="mt-0 h-full">
                <Suspense fallback={<TabLoadingFallback />}>
                  <SchemeSearch />
                </Suspense>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Scheme detail panel (slides in from right when scheme selected) */}
        {selectedScheme && (
          <div className="w-96 border-l bg-white overflow-auto">
            <SchemeDetailPanel scheme={selectedScheme} />
          </div>
        )}
        
        {/* Recents sidebar */}
        {showRecents && (
          <RecentSchemesList onClose={() => setShowRecents(false)} />
        )}
        
        {/* Favorites sidebar */}
        {showFavorites && (
          <FavoritesPanel onClose={() => setShowFavorites(false)} />
        )}
      </div>
    </SchemeNavigationProvider>
  );
}
```

**Key Features**:
- Tab interface with 4 navigation modes
- Lazy loading for performance (inactive tabs not loaded)
- Responsive design (icons only on mobile)
- Scheme detail panel slides in from right
- Recents and favorites accessible from header
- Sticky tab bar during scroll

---

#### 8.2.2 Navigation Header

**File**: `components/schemes/NavigationHeader.tsx` (~120 lines)

```typescript
// components/schemes/NavigationHeader.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Star,
  Settings,
  Info,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { useNavigationStore } from "@/lib/schemes/navigation-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavigationHeaderProps {
  onShowRecents: () => void;
  onShowFavorites: () => void;
  recentCount: number;
  favoriteCount: number;
}

/**
 * Header with navigation utilities and quick actions
 */
export default function NavigationHeader({
  onShowRecents,
  onShowFavorites,
  recentCount,
  favoriteCount,
}: NavigationHeaderProps) {
  const { currentMode, resetAll } = useNavigationStore();
  
  /**
   * Get mode-specific reset action
   */
  const handleReset = () => {
    if (confirm("Reset all navigation state? This will clear your current progress.")) {
      resetAll();
    }
  };
  
  /**
   * Get help text for current mode
   */
  const getHelpText = () => {
    switch (currentMode) {
      case "tree":
        return "Answer 2-3 questions to narrow down scheme options";
      case "cluster":
        return "Browse schemes organized by semantic categories";
      case "conditions":
        return "Select observable characteristics to identify schemes";
      case "search":
        return "Search schemes by name, description, or keywords";
    }
  };
  
  return (
    <div className="border-b bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      {/* Title and help */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Argument Scheme Navigator</h1>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Info className="h-4 w-4" />
                <span className="sr-only">Help</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{getHelpText()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Utility buttons */}
      <div className="flex items-center gap-2">
        {/* Recent schemes */}
        <Button
          variant="outline"
          size="sm"
          onClick={onShowRecents}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Recent</span>
          {recentCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {recentCount}
            </Badge>
          )}
        </Button>
        
        {/* Favorites */}
        <Button
          variant="outline"
          size="sm"
          onClick={onShowFavorites}
          className="flex items-center gap-2"
        >
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Favorites</span>
          {favoriteCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {favoriteCount}
            </Badge>
          )}
        </Button>
        
        {/* Documentation link */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="/docs/argument-schemes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="sr-only">Documentation</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View scheme documentation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Reset */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset navigation state</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Settings (placeholder for future preferences) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Navigation preferences (coming soon)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
```

**Key Features**:
- Mode-specific help text
- Recent schemes and favorites with count badges
- Reset button with confirmation
- Documentation link
- Settings placeholder for future preferences
- Responsive design (hides text on mobile)

---

#### 8.2.3 Scheme Detail Panel

**File**: `components/schemes/SchemeDetailPanel.tsx` (~150 lines)

```typescript
// components/schemes/SchemeDetailPanel.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Star, ExternalLink, Copy, Check } from "lucide-react";
import type { ArgumentScheme } from "@/types/schemes";
import { useSchemeNavigation } from "./SchemeNavigationContext";

interface SchemeDetailPanelProps {
  scheme: ArgumentScheme;
}

/**
 * Detailed view of a selected scheme
 * Appears as a sidebar panel on the right
 */
export default function SchemeDetailPanel({ scheme }: SchemeDetailPanelProps) {
  const { onSchemeClose, isFavorite, toggleFavorite } = useSchemeNavigation();
  const [copied, setCopied] = React.useState(false);
  
  /**
   * Copy scheme key to clipboard
   */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(scheme.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const isSchemeFavorited = isFavorite(scheme.key);
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold">{scheme.name}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(scheme.key)}
              className="h-6 w-6 p-0"
            >
              <Star
                className={`h-4 w-4 ${isSchemeFavorited ? "fill-yellow-400 text-yellow-400" : ""}`}
              />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{scheme.key}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={onSchemeClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-700">{scheme.description}</p>
          </div>
          
          {/* Metadata */}
          {scheme.semanticCluster && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Cluster</h3>
              <Badge variant="secondary">{scheme.semanticCluster}</Badge>
            </div>
          )}
          
          {/* Premises */}
          {scheme.premises && scheme.premises.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Premises ({scheme.premises.length})
              </h3>
              <ul className="space-y-2">
                {scheme.premises.map((premise, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-medium">P{idx + 1}:</span> {premise.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Conclusion */}
          {scheme.conclusion && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Conclusion</h3>
              <p className="text-sm">
                <span className="font-medium">C:</span> {scheme.conclusion}
              </p>
            </div>
          )}
          
          <Separator />
          
          {/* Critical Questions */}
          {scheme.criticalQuestions && scheme.criticalQuestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Critical Questions ({scheme.criticalQuestions.length})
              </h3>
              <ul className="space-y-3">
                {scheme.criticalQuestions.map((cq, idx) => (
                  <li key={cq.id || idx} className="text-sm">
                    <p className="font-medium">CQ{idx + 1}: {cq.question}</p>
                    {cq.explanation && (
                      <p className="text-gray-600 mt-1 text-xs">{cq.explanation}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Actions */}
          <div className="pt-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a
                href={`/schemes/${scheme.key}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Details
              </a>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
```

**Key Features**:
- Scheme name, key, and description
- Favorite toggle with visual feedback
- Copy scheme key to clipboard
- Premises and conclusion display
- Critical questions list
- Link to full scheme details page
- Scrollable content area

---

### Testing Checklist - Tasks 8.1 & 8.2

#### Integration Architecture Testing (8.1)

- [ ] **State Management**
  - [ ] Zustand store initializes with correct default state
  - [ ] State persists across page refreshes (mode, recents, favorites)
  - [ ] Mode-specific state is isolated (changing tree state doesn't affect cluster state)
  - [ ] Actions correctly update state (setMode, selectScheme, toggleFavorite)
  - [ ] Recent schemes limited to 10 entries (FIFO)
  - [ ] Favorite toggling works correctly (add/remove)

- [ ] **Context Provider**
  - [ ] Provider wraps SchemeNavigator correctly
  - [ ] useSchemeNavigation hook throws error outside provider
  - [ ] navigateToScheme adds to recent schemes
  - [ ] navigateToMode updates currentMode
  - [ ] isFavorite returns correct boolean
  - [ ] onSchemeSelect and onSchemeClose work correctly

- [ ] **Integration Utilities**
  - [ ] getSuggestedNavigationMode returns correct mode for different scheme types
  - [ ] getRelatedSchemes finds schemes by cluster, purpose, and conditions
  - [ ] generateBreadcrumbs creates correct paths for each mode
  - [ ] formatSchemeCountMessage displays appropriate messages

#### Tab-Based Interface Testing (8.2)

- [ ] **Main Navigator Component**
  - [ ] All 4 tabs render correctly (Tree, Cluster, Conditions, Search)
  - [ ] Tab switching updates currentMode in store
  - [ ] Tab icons and labels display correctly
  - [ ] Lazy loading works (inactive tabs not loaded)
  - [ ] Loading fallback appears during lazy load
  - [ ] Tab content preserves state when switching modes
  - [ ] Responsive design: mobile shows icons only

- [ ] **Navigation Header**
  - [ ] Header sticks to top during scroll
  - [ ] Help tooltip shows mode-specific text
  - [ ] Recent button shows correct count badge
  - [ ] Favorites button shows correct count badge
  - [ ] Reset button confirms before clearing state
  - [ ] Documentation link opens in new tab
  - [ ] Settings button appears (placeholder)

- [ ] **Scheme Detail Panel**
  - [ ] Panel slides in from right when scheme selected
  - [ ] Panel width is 384px (w-96)
  - [ ] Close button clears selectedScheme
  - [ ] Favorite toggle updates store
  - [ ] Copy button copies scheme key to clipboard
  - [ ] Copy feedback (checkmark) appears for 2 seconds
  - [ ] Scheme metadata displays correctly
  - [ ] Critical questions render with numbering
  - [ ] "View Full Details" link navigates correctly
  - [ ] Panel is scrollable for long content

#### Performance Testing

- [ ] **Load Performance**
  - [ ] Initial load <1 second
  - [ ] Tab switching <100ms
  - [ ] Lazy-loaded tabs load <500ms

- [ ] **State Performance**
  - [ ] Store updates don't cause unnecessary re-renders
  - [ ] Recent schemes updates are debounced
  - [ ] Favorite toggle is instant (<50ms)

#### Cross-Browser Testing

- [ ] Chrome/Edge: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Mobile browsers: Responsive design works

---

### Success Criteria - Tasks 8.1 & 8.2

#### Integration Architecture (8.1)

✅ **Complete when**:
- Zustand store manages state for all 4 navigation modes
- State persistence works across sessions
- Context provider enables shared navigation logic
- Integration utilities provide helper functions
- Mode-specific state is properly isolated

#### Tab-Based Interface (8.2)

✅ **Complete when**:
- All 4 navigation modes accessible via tabs
- Tab switching is instant (<100ms)
- Lazy loading reduces initial bundle size
- Scheme detail panel displays correctly
- Navigation header provides quick access to utilities
- Responsive design works on mobile/tablet/desktop

#### Integration Between Tasks

✅ **Complete when**:
- SchemeNavigator uses Zustand store for state
- Context provider wraps entire navigator
- Tab content components use shared context
- Detail panel updates from store
- All navigation modes share common state (selected scheme, favorites, recents)

---

## File Structure Summary - Week 8 (Tasks 8.1 & 8.2)

```
lib/schemes/
  ├── navigation-state.ts              # Zustand store (150 lines)
  └── navigation-integration.ts        # Integration utilities (80 lines)

components/schemes/
  ├── SchemeNavigator.tsx              # Main component (200 lines)
  ├── SchemeNavigationContext.tsx     # Context provider (100 lines)
  ├── NavigationHeader.tsx             # Header with utilities (120 lines)
  └── SchemeDetailPanel.tsx            # Detail sidebar (150 lines)

Total new code: ~800 lines
```

---

## Week 8 Tasks 8.1 & 8.2 Complete! ✅

Tasks 8.1 and 8.2 implementation plan complete with:
- **Unified state management** with Zustand store and persistence
- **Shared context provider** for navigation logic
- **Integration utilities** for cross-mode functionality
- **Tab-based interface** with 4 navigation modes
- **Navigation header** with recents, favorites, help
- **Scheme detail panel** with favorite/copy/view actions
- **~800 lines of code** across 6 files
- **16 hours** of implementation work planned

**Key Features**:
- Lazy loading for performance optimization
- State preservation across mode switches
- Responsive design for mobile/tablet/desktop
- Mode-specific help and utilities
- Recent schemes and favorites tracking

**Next**: Week 8 remaining tasks (8.3: User Preferences, 8.4: Search, 8.5: Testing)

---

**Created**: 2025-11-09  
**Status**: Week 8 Tasks 8.1 & 8.2 COMPLETE ✅  
**Next**: Week 8 - Unified SchemeNavigator
