# DeepDivePanel V3 - Overhaul Integration Plan

**Date**: November 11, 2025  
**Status**: Planning  
**Context**: Weeks 5-8 of V3 Migration - Integrating Phases 0-4 of Deliberation System Overhaul  
**Prerequisites**: Weeks 1-4 complete (tab extraction, shared components, hooks established)

---

## Overview

This document details the **integration** of the completed Deliberation System Overhaul (Phases 0-4) into DeepDivePanelV3. All overhaul components, APIs, and services are **production-ready** and just need to be wired into the redesigned panel structure.

**Key Insight**: We're not building new features - we're **exposing existing, tested features** to users through the V3 interface.

---

## Week 5: Arguments Tab - Net Analysis Foundation

**Goal**: Transform Arguments tab into intelligent net-aware platform  
**Estimated Time**: 8 hours  
**Dependencies**: Week 4 complete (ArgumentsTab extracted)  
**Risk**: Low (all components exist)

### 5.1: ArgumentNetAnalyzer Integration (4 hours)

**Task**: Replace simple CQ modal with full net analyzer

**Current State**:
- Arguments show single-scheme CQs via SchemeSpecificCQsModal
- No multi-scheme detection
- No net visualization

**Target State**:
- Arguments analyzed for nets automatically
- ArgumentNetAnalyzer component displays:
  - Net visualization (graph)
  - Composed CQs grouped by scheme
  - Dependency analysis
  - Explicitness classification
  - Reconstruction suggestions

**Implementation**:

```typescript
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx

// Add imports
import { ArgumentNetAnalyzer } from "@/components/argumentation/ArgumentNetAnalyzer";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Add state for net analyzer
const [netAnalyzerOpen, setNetAnalyzerOpen] = useState(false);
const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(null);

// Replace CQ modal trigger
<Button 
  onClick={() => {
    setSelectedArgumentId(arg.id);
    setNetAnalyzerOpen(true);
  }}
>
  Analyze Argument
</Button>

// Add dialog
<Dialog open={netAnalyzerOpen} onOpenChange={setNetAnalyzerOpen}>
  <DialogContent className="max-w-6xl max-h-[90vh]">
    {selectedArgumentId && (
      <ArgumentNetAnalyzer
        argumentId={selectedArgumentId}
        deliberationId={deliberationId}
        currentUserId={currentUserId}
        onNetDetected={(netId) => {
          // Optional: track net detection
          console.log("Net detected:", netId);
        }}
      />
    )}
  </DialogContent>
</Dialog>
```

**Files to Modify**:
- `components/deepdive/v3/tabs/ArgumentsTab.tsx`
- (Optional) `components/arguments/ArgumentCardV2.tsx` if adding button there

**Testing**:
- [ ] Single-scheme arguments show CQs normally
- [ ] Multi-scheme arguments show net visualization
- [ ] Graph is interactive (click nodes/edges)
- [ ] CQs grouped by scheme and attack type
- [ ] Burden of proof badges display correctly

**Estimated Time**: 4 hours

---

### 5.2: NetworksSection Integration (2 hours)

**Task**: Add deliberation-wide net detection section

**Current State**:
- NetworksSection component exists but not used
- No deliberation-level net overview

**Target State**:
- Collapsible "Detected Argument Networks" section in Arguments tab
- Shows all nets found in deliberation
- Click net → opens detailed analyzer

**Implementation**:

```typescript
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx

import { NetworksSection } from "@/components/deepdive/v3/sections/NetworksSection";

// In tab render, add section
<div className="space-y-4">
  {/* Existing argument list */}
  <SectionCard title="Arguments" {...}>
    {/* existing content */}
  </SectionCard>
  
  {/* NEW: Networks overview */}
  <NetworksSection deliberationId={deliberationId} />
</div>
```

**Files to Modify**:
- `components/deepdive/v3/tabs/ArgumentsTab.tsx`

**Testing**:
- [ ] Section appears below arguments list
- [ ] Detects nets on load
- [ ] Click "Analyze Net" opens ArgumentNetAnalyzer
- [ ] Shows net type, complexity, confidence
- [ ] Empty state when no nets detected

**Estimated Time**: 2 hours

---

### 5.3: Burden of Proof Badges (2 hours)

**Task**: Show burden of proof in CQ displays

**Current State**:
- CQs display without burden indicators
- Users don't know who bears proof burden

**Target State**:
- Burden badges on all CQs
- Tooltips explain what burden means
- Different colors for proponent/challenger

**Implementation**:

```typescript
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx
// Or wherever CQs are displayed

import { 
  BurdenOfProofBadge, 
  BurdenOfProofTooltip 
} from "@/components/argumentation/BurdenOfProofIndicators";

// In CQ list rendering
{cqs.map(cq => (
  <div key={cq.id} className="flex items-start gap-2">
    <div className="flex-1">
      <p>{cq.text}</p>
    </div>
    
    {/* NEW: Burden indicator */}
    <BurdenOfProofBadge 
      burden={cq.burdenOfProof} 
      requiresEvidence={cq.requiresEvidence}
    />
  </div>
))}
```

**Files to Modify**:
- Anywhere CQs are displayed (ArgumentsTab, CQ modals, etc.)
- `components/cqs/ComposedCQPanel.tsx` (if not already added)

**Testing**:
- [ ] Badges appear on all CQs
- [ ] Correct color for burden type
- [ ] Tooltips explain burden
- [ ] "Requires Evidence" badge when applicable
- [ ] Works in both net analyzer and simple CQ view

**Estimated Time**: 2 hours

---

**Week 5 Summary**:
- ✅ Arguments tab becomes net-aware
- ✅ Users can analyze multi-scheme arguments
- ✅ Deliberation-level net overview
- ✅ Burden of proof guidance
- **Total Time**: 8 hours

---

## Week 6: Attack Generation Integration

**Goal**: Add AI-assisted attack generation to Arguments tab  
**Estimated Time**: 10 hours  
**Dependencies**: Week 5 complete  
**Risk**: Medium (workflow changes, need UX testing)

### 6.1: Attack Suggestions Component (6 hours)

**Task**: Add "Generate Attack" flow to argument cards

**Current State**:
- Users manually create counterarguments
- No strategic guidance
- No CQ-based suggestions

**Target State**:
- "Generate Attack" button on every argument
- AttackSuggestions panel shows CQ-based strategies
- Ranked by strategic value and burden
- One-click to start wizard

**Implementation**:

```typescript
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx

import { AttackSuggestions } from "@/components/argumentation/AttackSuggestions";
import { AttackConstructionWizard } from "@/components/argumentation/AttackConstructionWizard";

// Add state
const [attackTargetId, setAttackTargetId] = useState<string | null>(null);
const [selectedAttack, setSelectedAttack] = useState<any | null>(null);
const [wizardOpen, setWizardOpen] = useState(false);

// Add "Generate Attack" button to argument cards
<ArgumentCard {...}>
  <div className="flex gap-2">
    {/* Existing buttons */}
    
    {/* NEW: Attack generator */}
    <Button 
      variant="outline"
      onClick={() => setAttackTargetId(arg.id)}
    >
      <Target className="w-4 h-4 mr-2" />
      Generate Attack
    </Button>
  </div>
</ArgumentCard>

// Add attack suggestions dialog
<Dialog 
  open={!!attackTargetId && !wizardOpen} 
  onOpenChange={(open) => !open && setAttackTargetId(null)}
>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Attack Strategies</DialogTitle>
    </DialogHeader>
    
    {attackTargetId && (
      <AttackSuggestions
        targetArgumentId={attackTargetId}
        deliberationId={deliberationId}
        currentUserId={currentUserId}
        onSelectAttack={(suggestion) => {
          setSelectedAttack(suggestion);
          setWizardOpen(true);
        }}
      />
    )}
  </DialogContent>
</Dialog>

// Add construction wizard
<Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
  <DialogContent className="max-w-5xl max-h-[90vh]">
    {selectedAttack && (
      <AttackConstructionWizard
        suggestion={selectedAttack}
        deliberationId={deliberationId}
        currentUserId={currentUserId}
        onComplete={(attackId) => {
          setWizardOpen(false);
          setSelectedAttack(null);
          setAttackTargetId(null);
          // Refresh arguments list
          mutate(`/api/arguments?deliberationId=${deliberationId}`);
        }}
        onCancel={() => {
          setWizardOpen(false);
          setSelectedAttack(null);
        }}
      />
    )}
  </DialogContent>
</Dialog>
```

**Files to Modify**:
- `components/deepdive/v3/tabs/ArgumentsTab.tsx`
- (Optional) `components/arguments/ArgumentCardV2.tsx`

**API Used**:
- `POST /api/arguments/suggest-attacks` (existing)
- `POST /api/attacks/create` (existing)

**Testing**:
- [ ] Button appears on all arguments
- [ ] Suggestions load with correct CQs
- [ ] Ranking by strategic value works
- [ ] Burden badges show correctly
- [ ] Wizard guides user through attack
- [ ] Evidence guidance appears when needed
- [ ] Attack creates successfully
- [ ] UI refreshes after attack created

**Estimated Time**: 6 hours

---

### 6.2: ArgumentActionsSheet Enhancement (3 hours)

**Task**: Add attack suggestions to existing actions sheet

**Current State**:
- ArgumentActionsSheet has manual actions
- No intelligent suggestions

**Target State**:
- "Suggested Attacks" section in actions sheet
- Top 3 attack strategies shown inline
- Click to open full wizard

**Implementation**:

```typescript
// File: components/arguments/ArgumentActionsSheet.tsx

import { AttackSuggestions } from "@/components/argumentation/AttackSuggestions";
import useSWR from "swr";

// Fetch top suggestions
const { data: suggestions } = useSWR(
  argumentId ? `/api/arguments/suggest-attacks?argumentId=${argumentId}` : null,
  async (url) => {
    const res = await fetch(url, { method: "POST" });
    return res.json();
  }
);

// In sheet content
<div className="space-y-4">
  {/* Existing sections */}
  
  {/* NEW: Suggested attacks */}
  {suggestions?.attacks && suggestions.attacks.length > 0 && (
    <div className="border-t pt-4">
      <h3 className="text-sm font-semibold mb-2">
        Suggested Attacks
      </h3>
      <div className="space-y-2">
        {suggestions.attacks.slice(0, 3).map(attack => (
          <Button
            key={attack.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              // Open attack wizard
              onSelectAttack(attack);
            }}
          >
            <div className="text-left">
              <div className="font-medium">{attack.cq.text}</div>
              <div className="text-xs text-muted-foreground">
                {attack.attackType} • Strength: {attack.strengthScore}/100
              </div>
            </div>
          </Button>
        ))}
      </div>
      <Button 
        variant="link" 
        className="w-full mt-2"
        onClick={() => {
          // Open full AttackSuggestions dialog
        }}
      >
        View All Suggestions →
      </Button>
    </div>
  )}
</div>
```

**Files to Modify**:
- `components/arguments/ArgumentActionsSheet.tsx`

**Testing**:
- [ ] Suggestions appear in sheet
- [ ] Top 3 most strategic shown
- [ ] "View All" opens full suggestions panel
- [ ] Click suggestion opens wizard
- [ ] Works for all argument types

**Estimated Time**: 3 hours

---

### 6.3: Visual Attack Indicators (1 hour)

**Task**: Add visual cues for attack opportunities

**Current State**:
- No visual indication of attack opportunities
- Users don't know which arguments are vulnerable

**Target State**:
- Badge on multi-scheme arguments
- Highlight high-value attack targets
- Color-coded by opportunity strength

**Implementation**:

```typescript
// File: components/arguments/ArgumentCardV2.tsx

// Add badge for multi-scheme
{isMultiScheme && (
  <Badge variant="secondary" className="text-xs">
    <Network className="w-3 h-3 mr-1" />
    Net Argument
  </Badge>
)}

// Add attack opportunity indicator
{attackStrength > 70 && (
  <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
    <Target className="w-3 h-3 mr-1" />
    High-value target
  </Badge>
)}
```

**Files to Modify**:
- `components/arguments/ArgumentCardV2.tsx`

**Testing**:
- [ ] Multi-scheme badge appears
- [ ] Attack opportunity badge on vulnerable arguments
- [ ] Color-coding makes sense
- [ ] Doesn't clutter UI

**Estimated Time**: 1 hour

---

**Week 6 Summary**:
- ✅ Strategic attack generation available
- ✅ Users guided by CQ-based suggestions
- ✅ Integrated into existing workflows
- ✅ Visual cues improve UX
- **Total Time**: 10 hours

---

## Week 7: Scheme Navigation & Support Generation

**Goal**: Complete argumentation toolkit with discovery and support  
**Estimated Time**: 10 hours  
**Dependencies**: Weeks 5-6 complete  
**Risk**: Low

### 7.1: SchemeNavigator Integration (4 hours)

**Task**: Replace simple scheme picker with intelligent navigator

**Current State**:
- AIFArgumentWithSchemeComposer uses simple dropdown
- No scheme discovery features
- Users struggle to find right scheme

**Target State**:
- SchemeNavigator dialog for scheme selection
- 4 navigation modes:
  - Dichotomic Tree (wizard)
  - Cluster Browser (semantic groups)
  - Identification Conditions (filter)
  - Search (text + filters)
- Recent and favorites tracking

**Implementation**:

```typescript
// File: components/arguments/AIFArgumentWithSchemeComposer.tsx

import { SchemeNavigator } from "@/components/schemes/SchemeNavigator";
import { Dialog } from "@/components/ui/dialog";

// Replace scheme dropdown with navigator trigger
const [navigatorOpen, setNavigatorOpen] = useState(false);

// Current scheme display with change button
<div className="flex items-center gap-2">
  <div className="text-sm">
    <span className="text-muted-foreground">Scheme:</span>
    <span className="font-medium ml-2">
      {selectedScheme?.name || "None selected"}
    </span>
  </div>
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => setNavigatorOpen(true)}
  >
    {selectedScheme ? "Change" : "Choose"} Scheme
  </Button>
</div>

// Navigator dialog
<Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen}>
  <DialogContent className="max-w-6xl max-h-[90vh]">
    <SchemeNavigator
      deliberationId={deliberationId}
      onSelectScheme={(scheme) => {
        setSelectedScheme(scheme);
        setNavigatorOpen(false);
      }}
      defaultMode="wizard" // or "clusters" based on user pref
      showRecents={true}
      showFavorites={true}
    />
  </DialogContent>
</Dialog>
```

**Files to Modify**:
- `components/arguments/AIFArgumentWithSchemeComposer.tsx`
- Possibly other scheme pickers in codebase

**Testing**:
- [ ] All 4 navigation modes work
- [ ] Wizard guides through dichotomic tree
- [ ] Clusters show semantic groupings
- [ ] Identification conditions filter correctly
- [ ] Search finds schemes by keyword
- [ ] Recent schemes tracked
- [ ] Favorites save across sessions
- [ ] Selected scheme passed back correctly

**Estimated Time**: 4 hours

---

### 7.2: SchemesSection Addition (2 hours)

**Task**: Add scheme browser for education/exploration

**Current State**:
- No way to browse schemes in deliberation context
- Users can't learn about schemes

**Target State**:
- SchemesSection in Admin tab or as collapsible in Arguments
- Full scheme browser with descriptions
- Examples and usage stats
- Link to arguments using each scheme

**Implementation**:

```typescript
// Option A: In Admin tab
// File: components/deepdive/v3/tabs/AdminTab.tsx (if it exists)

import { SchemesSection } from "@/components/deepdive/v3/sections/SchemesSection";

// Add section
<SchemesSection 
  deliberationId={deliberationId}
  showUsageStats={true}
  onSchemeSelect={(schemeId) => {
    // Optional: highlight arguments using this scheme
  }}
/>

// Option B: As collapsible in Arguments tab
// File: components/deepdive/v3/tabs/ArgumentsTab.tsx

<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">
      <BookOpen className="w-4 h-4 mr-2" />
      Browse Schemes
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <SchemesSection deliberationId={deliberationId} />
  </CollapsibleContent>
</Collapsible>
```

**Files to Modify**:
- `components/deepdive/v3/tabs/AdminTab.tsx` OR
- `components/deepdive/v3/tabs/ArgumentsTab.tsx`

**Testing**:
- [ ] Schemes list loads
- [ ] Descriptions display
- [ ] Examples shown
- [ ] Usage stats accurate
- [ ] Can link to arguments using scheme
- [ ] Responsive layout

**Estimated Time**: 2 hours

---

### 7.3: Support Suggestions (4 hours)

**Task**: Add support generation (mirror of attack generation)

**Current State**:
- No support suggestions
- Users manually create supporting arguments

**Target State**:
- "Suggest Support" button on claims/arguments
- SupportSuggestions component shows schemes that support
- SupportConstructionWizard guides creation
- Evidence matching for premises

**Implementation**:

```typescript
// File: components/deepdive/v3/tabs/DebateTab.tsx
// Or ArgumentsTab, depending on where claims are shown

import { SupportSuggestions } from "@/components/argumentation/SupportSuggestions";
import { SupportConstructionWizard } from "@/components/argumentation/SupportConstructionWizard";

// Add to claim/argument UI
<Button 
  variant="outline"
  onClick={() => setSupportTarget(claim.id)}
>
  <Plus className="w-4 h-4 mr-2" />
  Suggest Support
</Button>

// Support suggestions dialog
<Dialog open={!!supportTarget} onOpenChange={(open) => !open && setSupportTarget(null)}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Supporting Arguments</DialogTitle>
    </DialogHeader>
    
    {supportTarget && (
      <SupportSuggestions
        targetClaimId={supportTarget}
        deliberationId={deliberationId}
        currentUserId={currentUserId}
        onSelectSupport={(suggestion) => {
          setSelectedSupport(suggestion);
          setSupportWizardOpen(true);
        }}
      />
    )}
  </DialogContent>
</Dialog>

// Construction wizard
<Dialog open={supportWizardOpen} onOpenChange={setSupportWizardOpen}>
  <DialogContent className="max-w-5xl">
    {selectedSupport && (
      <SupportConstructionWizard
        suggestion={selectedSupport}
        deliberationId={deliberationId}
        currentUserId={currentUserId}
        onComplete={(argId) => {
          setSupportWizardOpen(false);
          // Refresh
        }}
      />
    )}
  </DialogContent>
</Dialog>
```

**Files to Modify**:
- `components/deepdive/v3/tabs/DebateTab.tsx` or `ArgumentsTab.tsx`

**API Used**:
- Support suggestion API (check if exists, may need to verify implementation)

**Testing**:
- [ ] Support button appears on claims
- [ ] Suggestions show applicable schemes
- [ ] Evidence matching works
- [ ] Wizard guides support creation
- [ ] Premises auto-filled when possible
- [ ] Support argument creates successfully

**Estimated Time**: 4 hours

---

**Week 7 Summary**:
- ✅ Intelligent scheme discovery
- ✅ Educational scheme browsing
- ✅ Support generation mirrors attack
- ✅ Complete argumentation toolkit
- **Total Time**: 10 hours

---

## Week 8: Polish, Evidence, & Analytics

**Goal**: Add finishing touches and advanced integrations  
**Estimated Time**: 8 hours  
**Dependencies**: Weeks 5-7 complete  
**Risk**: Low

### 8.1: Net Visualization Enhancements (3 hours)

**Task**: Improve net graph UX

**Enhancements**:
- Better layout algorithms
- Filtering by explicitness
- Highlighting by scheme type
- Export to PNG/SVG
- Performance optimization for large nets

**Implementation**:

```typescript
// File: components/nets/visualization/NetGraphWithCQs.tsx

// Add controls
<div className="flex gap-2 mb-4">
  <Select value={layout} onValueChange={setLayout}>
    <SelectOption value="hierarchical">Hierarchical</SelectOption>
    <SelectOption value="force">Force-directed</SelectOption>
    <SelectOption value="circular">Circular</SelectOption>
  </Select>
  
  <Select value={filter} onValueChange={setFilter}>
    <SelectOption value="all">All Nodes</SelectOption>
    <SelectOption value="explicit">Explicit Only</SelectOption>
    <SelectOption value="implicit">Implicit Only</SelectOption>
  </Select>
  
  <Button onClick={exportGraph}>
    <Download className="w-4 h-4 mr-2" />
    Export
  </Button>
</div>
```

**Files to Modify**:
- `components/nets/visualization/NetGraphWithCQs.tsx`
- `components/argumentation/ArgumentNetAnalyzer.tsx`

**Testing**:
- [ ] Layout switching works
- [ ] Filtering updates graph
- [ ] Export creates valid files
- [ ] Performance acceptable with 20+ nodes
- [ ] Tooltips remain responsive

**Estimated Time**: 3 hours

---

### 8.2: Evidence Integration (3 hours)

**Task**: Wire evidence guidance to composition flows

**Current State**:
- EvidenceGuidance component exists but not wired
- No evidence prompts in argument creation

**Target State**:
- Evidence guidance in attack/support wizards
- EvidenceSchemeMapper suggests evidence for premises
- Link to EvidenceList for browsing

**Implementation**:

```typescript
// File: components/argumentation/AttackConstructionWizard.tsx

import { EvidenceGuidance } from "@/components/argumentation/EvidenceGuidance";
import { EvidenceSchemeMapper } from "@/components/argumentation/EvidenceSchemeMapper";

// Add evidence step in wizard
<WizardStep title="Gather Evidence">
  <EvidenceGuidance
    scheme={suggestion.scheme}
    cq={suggestion.cq}
    burdenOfProof={suggestion.burdenOfProof}
    requiresEvidence={suggestion.requiresEvidence}
    onEvidenceSelected={(evidence) => {
      // Link evidence to attack
    }}
  />
  
  <div className="mt-4">
    <h4>Suggested Evidence Types:</h4>
    <EvidenceSchemeMapper
      schemeId={suggestion.scheme.id}
      premises={suggestion.template.premises}
      onMatchEvidence={(matches) => {
        // Auto-fill premises with evidence
      }}
    />
  </div>
</WizardStep>
```

**Files to Modify**:
- `components/argumentation/AttackConstructionWizard.tsx`
- `components/argumentation/SupportConstructionWizard.tsx`
- (Optional) Link from Sources tab

**Testing**:
- [ ] Evidence guidance appears when needed
- [ ] Suggestions match scheme requirements
- [ ] Can link evidence to premises
- [ ] Evidence appears in created argument
- [ ] Link to browse all evidence works

**Estimated Time**: 3 hours

---

### 8.3: Analytics Integration (2 hours)

**Task**: Add net and argumentation metrics to Analytics tab

**Current State**:
- Analytics tab has hom-sets confidence
- No argumentation metrics

**Target State**:
- Net complexity distribution
- Scheme usage statistics
- Attack/defense ratios
- Burden of proof balance
- CQ response rates

**Implementation**:

```typescript
// File: components/deepdive/v3/tabs/AnalyticsTab.tsx

import useSWR from "swr";

// Fetch argumentation stats
const { data: argStats } = useSWR(
  `/api/deliberations/${deliberationId}/argumentation-stats`,
  fetcher
);

// Add sections
<div className="grid grid-cols-2 gap-4">
  {/* Net Statistics */}
  <Card>
    <CardHeader>
      <CardTitle>Argument Networks</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Stat label="Nets Detected" value={argStats?.netCount} />
        <Stat label="Avg Complexity" value={argStats?.avgComplexity} />
        <Stat label="Multi-scheme %" value={argStats?.multiSchemePercent} />
      </div>
    </CardContent>
  </Card>
  
  {/* Scheme Usage */}
  <Card>
    <CardHeader>
      <CardTitle>Top Schemes</CardTitle>
    </CardHeader>
    <CardContent>
      <SchemeUsageChart data={argStats?.topSchemes} />
    </CardContent>
  </Card>
  
  {/* Attack/Defense */}
  <Card>
    <CardHeader>
      <CardTitle>Attack Patterns</CardTitle>
    </CardHeader>
    <CardContent>
      <AttackDefenseChart data={argStats?.attackDefense} />
    </CardContent>
  </Card>
  
  {/* Burden Balance */}
  <Card>
    <CardHeader>
      <CardTitle>Burden of Proof</CardTitle>
    </CardHeader>
    <CardContent>
      <BurdenBalanceIndicator data={argStats?.burdenBalance} />
    </CardContent>
  </Card>
</div>
```

**Files to Modify**:
- `components/deepdive/v3/tabs/AnalyticsTab.tsx`

**API Needed**:
- `GET /api/deliberations/[id]/argumentation-stats` (may need to create)

**Testing**:
- [ ] Stats load correctly
- [ ] Charts render
- [ ] Data matches actual deliberation state
- [ ] Updates when arguments change
- [ ] Performance acceptable

**Estimated Time**: 2 hours

---

**Week 8 Summary**:
- ✅ Polished net visualization
- ✅ Evidence seamlessly integrated
- ✅ Analytics show argumentation health
- ✅ V3 feature-complete with overhaul
- **Total Time**: 8 hours

---

## Total Integration Summary

| Week | Focus | Hours | Components Added | Risk |
|------|-------|-------|------------------|------|
| **Week 5** | Net Analysis | 8h | ArgumentNetAnalyzer, NetworksSection, Burden badges | Low |
| **Week 6** | Attack Generation | 10h | AttackSuggestions, AttackConstructionWizard, Visual indicators | Medium |
| **Week 7** | Navigation & Support | 10h | SchemeNavigator, SchemesSection, Support flow | Low |
| **Week 8** | Polish & Advanced | 8h | Enhanced graphs, Evidence, Analytics | Low |
| **TOTAL** | **4 weeks** | **36h** | **~15 major components** | **Low-Medium** |

---

## Risk Mitigation

### Medium Risks

**Week 6: Attack Generation UX Changes**
- **Risk**: Users may not understand new workflow
- **Mitigation**: 
  - Add onboarding tooltips
  - "Learn more" links to documentation
  - Optional feature flag for gradual rollout
  - Beta testing with power users first

**Integration Complexity**
- **Risk**: Many features in Arguments tab could feel cluttered
- **Mitigation**:
  - Use collapsible sections
  - Progressive disclosure (advanced features hidden by default)
  - User preferences for visibility
  - Clean visual hierarchy

### Low Risks

**API Performance**
- **Risk**: Net detection might be slow
- **Mitigation**:
  - Already optimized in Phase 4
  - Caching implemented
  - Background detection possible

**Component Conflicts**
- **Risk**: Multiple dialogs/sheets open at once
- **Mitigation**:
  - Careful state management
  - Close previous dialog when opening new one
  - Modal stacking handled by UI library

---

## Success Criteria

### Week 5 Success
- [ ] ArgumentNetAnalyzer opens from Arguments tab
- [ ] Multi-scheme arguments show net visualization
- [ ] NetworksSection displays detected nets
- [ ] Burden of proof badges visible on all CQs
- [ ] Zero console errors
- [ ] Performance remains acceptable (< 2s load)

### Week 6 Success
- [ ] "Generate Attack" creates full attack flow
- [ ] Suggestions ranked correctly
- [ ] Attack wizard completes successfully
- [ ] ArgumentActionsSheet shows inline suggestions
- [ ] Visual indicators improve clarity
- [ ] At least 3 successful test attacks created

### Week 7 Success
- [ ] SchemeNavigator replaces old picker
- [ ] All 4 navigation modes functional
- [ ] SchemesSection browseable
- [ ] Support suggestions work like attacks
- [ ] Support wizard creates arguments
- [ ] User testing shows improved discovery

### Week 8 Success
- [ ] Net graphs have improved layouts
- [ ] Evidence guidance appears in wizards
- [ ] Analytics show argumentation metrics
- [ ] All integration tests pass
- [ ] Zero blocking bugs
- [ ] Ready for production

---

## Testing Strategy

### Unit Tests
- [ ] Each integrated component renders correctly
- [ ] Props passed correctly from tabs
- [ ] State management works
- [ ] API calls successful

### Integration Tests
- [ ] Full attack generation flow
- [ ] Net detection → analysis → CQ answering
- [ ] Scheme navigation → argument creation
- [ ] Support generation end-to-end

### E2E Tests
- [ ] User can discover scheme via wizard
- [ ] User can generate attack on argument
- [ ] User can analyze multi-scheme argument
- [ ] User can create supported argument
- [ ] All flows work in real deliberation

### Performance Tests
- [ ] Net detection < 2s for 50 arguments
- [ ] Attack suggestions < 1s
- [ ] Graph rendering < 1s for 20 nodes
- [ ] No memory leaks with multiple modals

### User Acceptance
- [ ] Beta users can complete attack flow
- [ ] Scheme navigation improves discovery
- [ ] Net visualization aids understanding
- [ ] Documentation sufficient
- [ ] Onboarding effective

---

## Documentation Requirements

### User Documentation
- [ ] "Generating Strategic Attacks" guide
- [ ] "Understanding Argument Networks" explainer
- [ ] "Navigating Schemes" tutorial
- [ ] "Burden of Proof" FAQ
- [ ] Video walkthrough of key features

### Developer Documentation
- [ ] Integration guide for future features
- [ ] API endpoints reference
- [ ] Component prop interfaces
- [ ] State management patterns
- [ ] Testing guidelines

### Admin Documentation
- [ ] Configuring burden of proof
- [ ] Managing scheme metadata
- [ ] Monitoring net detection
- [ ] Analytics interpretation

---

## Post-Integration Maintenance

### Monitoring
- [ ] Track net detection success rate
- [ ] Monitor attack suggestion usage
- [ ] Measure scheme navigation modes
- [ ] Analytics on feature adoption
- [ ] Performance metrics

### Iteration
- [ ] Collect user feedback on attack flow
- [ ] Refine scheme navigation based on usage
- [ ] Optimize net detection algorithms
- [ ] Improve suggestion ranking

### Future Enhancements
- [ ] AI-powered attack suggestions (LLM integration)
- [ ] Collaborative attack planning
- [ ] Attack effectiveness scoring
- [ ] Net evolution over time
- [ ] Scheme recommendation engine

---

## Conclusion

**The V3 migration is the perfect opportunity** to integrate the completed Deliberation System Overhaul. All components are production-ready, APIs are tested, and the V3 architecture makes integration straightforward.

**36 hours of integration work** unlocks **months of sophisticated argumentation features** that transform DeepDivePanel from a basic viewer into an intelligent, theory-grounded platform.

**The work is already done** - we just need to expose it to users through the clean V3 interface.

---

**Next Steps**:
1. ✅ Complete Week 4 (tab extraction)
2. ✅ Review this integration plan
3. Begin Week 5 integration
4. Iterate based on testing
5. Ship V3 with full overhaul integration

**Document Status**: ✅ Ready for Review  
**Owner**: DeepDivePanel V3 Team  
**Timeline**: Weeks 5-8 (4 weeks, 36 hours)
