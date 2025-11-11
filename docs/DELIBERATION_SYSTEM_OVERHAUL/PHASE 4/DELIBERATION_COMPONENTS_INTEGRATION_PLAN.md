# Deliberation Components Integration Plan
## Phase 4 Net Features → Main Application

**Status**: Planning  
**Date**: November 11, 2025  
**Goal**: Integrate ArgumentNetAnalyzer and SchemeAnalyzer into main deliberation UI

---

## Overview

Now that Week 16 (ArgumentNetAnalyzer Integration) is complete, we need to integrate these new net analysis features into the main deliberation components, particularly the Deep Dive panel and argument viewing interfaces.

**Key Components to Update**:
1. Deep Dive Panel - Main argument analysis interface
2. Argument Cards/Lists - Quick CQ access
3. Deliberation Detail View - Full argument context
4. Scheme Browser - Scheme selection and CQ viewing

---

## Current State Analysis

### Existing Components

#### 1. SchemeSpecificCQsModal
**Location**: `components/arguments/SchemeSpecificCQsModal.tsx` (984 LOC)

**Current Usage**:
- Shows CQs for a single scheme
- Used in argument cards and deep dive
- Phase 3 community responses integrated
- Phase 6 provenance tracking
- Phase 8 dialogue moves

**Status**: ✅ Working, but doesn't support multi-scheme nets

#### 2. ComposedCQsModal
**Location**: `components/arguments/ComposedCQsModal.tsx` (~535 LOC)

**Current Usage**:
- Shows CQs for multi-scheme arguments
- Tabs for each scheme
- Used in Phase 1.5 implementation

**Status**: ✅ Working, but separate from net visualization

#### 3. Deep Dive Panel
**Location**: To be identified

**Current Usage**:
- Primary argument analysis interface
- Shows argument details, CQs, responses
- Integration point for SchemeSpecificCQsModal

**Status**: ⚠️ Needs net integration

### New Components (Week 16)

#### 1. ArgumentNetAnalyzer
**Location**: `components/argumentation/ArgumentNetAnalyzer.tsx` (374 LOC)

**Features**:
- Automatic net detection
- Tabbed interface (visualization + CQs)
- Integration with NetGraphWithCQs
- Integration with ComposedCQsModal
- Graceful fallback for single schemes

**Status**: ✅ Complete, ready for integration

#### 2. SchemeAnalyzer
**Location**: `components/arguments/SchemeAnalyzer.tsx` (172 LOC)

**Features**:
- Wrapper with auto-detection
- Dialog-based UI
- Switches between net view and traditional CQ modal
- 100% backward compatible

**Status**: ✅ Complete, ready for integration

---

## Integration Strategy

### Phase 1: Low-Risk Additions (Week 1)

**Goal**: Add net analysis as optional feature without disrupting existing UI

#### 1.1 Add "View as Net" Button to Argument Cards
**Time**: 2 hours

Add optional button to argument cards that opens ArgumentNetAnalyzer in dialog:

```tsx
// In ArgumentCard component
<div className="flex gap-2">
  <Button onClick={() => setShowCQs(true)}>
    View CQs
  </Button>
  
  {/* NEW: Net view button */}
  <Button variant="outline" onClick={() => setShowNetAnalysis(true)}>
    <Network className="w-4 h-4 mr-2" />
    Net Analysis
  </Button>
</div>

{/* NEW: Net analysis dialog */}
<Dialog open={showNetAnalysis} onOpenChange={setShowNetAnalysis}>
  <DialogContent className="max-w-[95vw] max-h-[95vh]">
    <ArgumentNetAnalyzer
      argumentId={argument.id}
      deliberationId={deliberation.id}
      currentUserId={currentUser?.id}
      showManagement={false}
      compact={false}
    />
  </DialogContent>
</Dialog>
```

**Testing**:
- Click "Net Analysis" button
- Verify dialog opens with ArgumentNetAnalyzer
- Verify net detection works
- Verify fallback for single schemes

#### 1.2 Add Net Badge to Arguments with Nets
**Time**: 3 hours

Detect multi-scheme arguments on load and show badge:

```tsx
// In ArgumentList component
const [netStatus, setNetStatus] = useState<Record<string, boolean>>({});

useEffect(() => {
  // Batch detect nets for all arguments
  detectNetsForArguments(arguments.map(a => a.id))
    .then(results => setNetStatus(results));
}, [arguments]);

// In ArgumentCard render
{netStatus[argument.id] && (
  <Badge variant="secondary" className="ml-2">
    <Network className="w-3 h-3 mr-1" />
    Multi-Scheme Net
  </Badge>
)}
```

**API Endpoint Needed**:
```typescript
// POST /api/nets/detect/batch
{
  argumentIds: string[]
}

// Response:
{
  nets: {
    [argumentId: string]: {
      isNet: boolean;
      netType?: string;
      schemeCount?: number;
    }
  }
}
```

#### 1.3 Add Net View to Deep Dive Panel (Optional Tab)
**Time**: 4 hours

Add "Net View" tab to deep dive panel alongside existing tabs:

```tsx
// In DeepDivePanel component
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="cqs">Critical Questions</TabsTrigger>
    <TabsTrigger value="responses">Responses</TabsTrigger>
    
    {/* NEW: Net view tab */}
    {isMultiSchemeNet && (
      <TabsTrigger value="net">
        <Network className="w-4 h-4 mr-2" />
        Net Analysis
      </TabsTrigger>
    )}
  </TabsList>

  {/* Existing tabs */}
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="cqs">
    <SchemeSpecificCQsModal {...props} />
  </TabsContent>
  <TabsContent value="responses">...</TabsContent>

  {/* NEW: Net analysis tab */}
  {isMultiSchemeNet && (
    <TabsContent value="net">
      <ArgumentNetAnalyzer
        argumentId={argument.id}
        deliberationId={deliberation.id}
        currentUserId={currentUser?.id}
        showManagement={false}
        compact={true}
      />
    </TabsContent>
  )}
</Tabs>
```

**Testing**:
- Load deep dive for multi-scheme argument
- Verify "Net Analysis" tab appears
- Click tab and verify ArgumentNetAnalyzer loads
- Verify single-scheme arguments don't show tab

**Deliverables**:
- ✅ Net analysis button in argument cards
- ✅ Net detection badges
- ✅ Net view tab in deep dive panel
- ✅ No breaking changes to existing functionality

---

### Phase 2: Enhanced Integration (Week 2)

**Goal**: Replace traditional CQ modal with SchemeAnalyzer for automatic net detection

#### 2.1 Replace SchemeSpecificCQsModal Calls with SchemeAnalyzer
**Time**: 8 hours

Systematically replace direct SchemeSpecificCQsModal usage with SchemeAnalyzer:

**Step 1**: Find all SchemeSpecificCQsModal usages
```bash
grep -r "SchemeSpecificCQsModal" components/ app/ --include="*.tsx" --include="*.ts"
```

**Step 2**: Replace with SchemeAnalyzer
```tsx
// OLD:
<SchemeSpecificCQsModal
  argumentId={id}
  deliberationId={delibId}
  cqs={cqs}
  meta={meta}
  onRefresh={onRefresh}
  triggerButton={triggerButton}
/>

// NEW:
<SchemeAnalyzer
  argumentId={id}
  deliberationId={delibId}
  cqs={cqs}  // Fallback data
  meta={meta}
  onRefresh={onRefresh}
  triggerButton={triggerButton}
  preferNetView={true}  // Enable auto-detection
/>
```

**Files to Update** (estimated):
1. Deep dive panel component
2. Argument card components
3. Deliberation detail view
4. Any custom argument viewers

**Testing**:
- Test each component that was updated
- Verify multi-scheme arguments show net view
- Verify single-scheme arguments show traditional CQ modal
- Verify all existing features still work (responses, dialogue moves, etc.)

#### 2.2 Update Deep Dive to Use SchemeAnalyzer as Primary CQ Interface
**Time**: 4 hours

Make SchemeAnalyzer the default CQ interface in deep dive:

```tsx
// In DeepDivePanel
<Tabs>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analysis">
      {/* Dynamic label based on detection */}
      {isMultiSchemeNet ? "Net Analysis" : "Critical Questions"}
    </TabsTrigger>
    <TabsTrigger value="responses">Responses</TabsTrigger>
  </TabsList>

  <TabsContent value="analysis">
    {/* Single unified interface */}
    <SchemeAnalyzer
      argumentId={argument.id}
      deliberationId={deliberation.id}
      cqs={cqs}
      meta={meta}
      preferNetView={true}
      compact={false}
      triggerButton={<></>}  // No trigger needed, already in tab
    />
  </TabsContent>
</Tabs>
```

**Benefits**:
- Single interface for all arguments
- Automatic net detection
- Consistent user experience
- No duplicate code

#### 2.3 Add Quick Net Toggle in Deep Dive Header
**Time**: 2 hours

Add toggle to switch between net view and traditional view:

```tsx
// In DeepDivePanel header
<div className="flex items-center justify-between">
  <h2>Argument Analysis</h2>
  
  {isMultiSchemeNet && (
    <div className="flex items-center gap-2">
      <Label>View Mode:</Label>
      <Toggle
        pressed={viewMode === "net"}
        onPressedChange={(pressed) => 
          setViewMode(pressed ? "net" : "traditional")
        }
      >
        <Network className="w-4 h-4 mr-2" />
        Net View
      </Toggle>
    </div>
  )}
</div>
```

**Testing**:
- Toggle between views
- Verify state persists
- Verify both views work correctly

**Deliverables**:
- ✅ SchemeAnalyzer replaces SchemeSpecificCQsModal in key components
- ✅ Unified CQ interface in deep dive
- ✅ View mode toggle for multi-scheme arguments
- ✅ All existing features preserved

---

### Phase 3: Advanced Features (Week 3)

**Goal**: Add net-specific features and optimizations

#### 3.1 Net Detection Caching
**Time**: 3 hours

Cache net detection results to avoid repeated API calls:

```typescript
// lib/client/netDetectionCache.ts
const NET_DETECTION_CACHE = new Map<string, {
  isNet: boolean;
  netType?: string;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getNetStatus(argumentId: string): Promise<boolean> {
  const cached = NET_DETECTION_CACHE.get(argumentId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.isNet;
  }

  const response = await fetch("/api/nets/detect", {
    method: "POST",
    body: JSON.stringify({ argumentId }),
  });

  const data = await response.json();
  const isNet = !!data.net;

  NET_DETECTION_CACHE.set(argumentId, {
    isNet,
    netType: data.net?.netType,
    timestamp: Date.now(),
  });

  return isNet;
}
```

#### 3.2 Bulk Net Detection for Argument Lists
**Time**: 4 hours

Optimize argument list loading with bulk detection:

```typescript
// In ArgumentList component
useEffect(() => {
  const argumentIds = arguments.map(a => a.id);
  
  fetch("/api/nets/detect/batch", {
    method: "POST",
    body: JSON.stringify({ argumentIds }),
  })
    .then(res => res.json())
    .then(data => {
      setNetStatuses(data.nets);
    });
}, [arguments]);
```

**API Implementation**:
```typescript
// app/api/nets/detect/batch/route.ts
export async function POST(request: NextRequest) {
  const { argumentIds } = await request.json();
  
  const netService = new NetIdentificationService();
  const results: Record<string, any> = {};

  // Parallel detection
  await Promise.all(
    argumentIds.map(async (id: string) => {
      const net = await netService.detectMultiScheme(id);
      results[id] = {
        isNet: !!net,
        netType: net?.netType,
        schemeCount: net?.schemes.length,
        confidence: net?.confidence,
      };
    })
  );

  return NextResponse.json({ nets: results });
}
```

#### 3.3 Net Analysis Preloading
**Time**: 3 hours

Preload net data when user hovers over "Net Analysis" button:

```tsx
// In ArgumentCard
const [netData, setNetData] = useState(null);
const [preloading, setPreloading] = useState(false);

const handleNetButtonHover = async () => {
  if (netData || preloading) return;
  
  setPreloading(true);
  const response = await fetch("/api/nets/detect", {
    method: "POST",
    body: JSON.stringify({ argumentId: argument.id }),
  });
  
  const data = await response.json();
  setNetData(data.net);
  setPreloading(false);
};

<Button
  variant="outline"
  onClick={() => setShowNetAnalysis(true)}
  onMouseEnter={handleNetButtonHover}
>
  <Network className="w-4 h-4 mr-2" />
  Net Analysis
  {preloading && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
</Button>
```

#### 3.4 Net Analysis Keyboard Shortcuts
**Time**: 2 hours

Add keyboard shortcuts for quick net analysis access:

```tsx
// In DeepDivePanel
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Cmd/Ctrl + N: Toggle net view
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      if (isMultiSchemeNet) {
        setActiveTab(activeTab === 'net' ? 'overview' : 'net');
      }
    }
    
    // Cmd/Ctrl + Shift + V: Toggle view mode
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'v') {
      e.preventDefault();
      setViewMode(viewMode === 'net' ? 'traditional' : 'net');
    }
  };

  document.addEventListener('keydown', handleKeyPress);
  return () => document.removeEventListener('keydown', handleKeyPress);
}, [activeTab, viewMode, isMultiSchemeNet]);
```

**Deliverables**:
- ✅ Net detection caching
- ✅ Bulk detection API
- ✅ Preloading on hover
- ✅ Keyboard shortcuts
- ✅ Performance optimizations

---

### Phase 4: User Experience Polish (Week 4)

**Goal**: Refine UX and add onboarding

#### 4.1 Net Analysis Onboarding
**Time**: 4 hours

Add first-time user experience for net analysis:

```tsx
// components/onboarding/NetAnalysisIntro.tsx
export function NetAnalysisIntro({ onComplete }: { onComplete: () => void }) {
  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New: Multi-Scheme Net Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>
            Arguments with multiple argumentation schemes can now be visualized as
            interconnected networks.
          </p>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Interactive network visualization</li>
              <li>Dependency analysis</li>
              <li>Net-aware critical questions</li>
              <li>Scheme relationship mapping</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              Look for the <Badge><Network className="w-3 h-3" /> Multi-Scheme Net</Badge>{" "}
              badge on arguments to try it out!
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onComplete}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Usage in main app
const [showNetIntro, setShowNetIntro] = useState(
  () => !localStorage.getItem('net-analysis-intro-seen')
);

{showNetIntro && (
  <NetAnalysisIntro
    onComplete={() => {
      localStorage.setItem('net-analysis-intro-seen', 'true');
      setShowNetIntro(false);
    }}
  />
)}
```

#### 4.2 Empty States and Error Messages
**Time**: 3 hours

Improve messaging for various states:

```tsx
// No net detected
<Card className="p-6 text-center">
  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
  <h3 className="font-semibold text-gray-700 mb-2">
    Single Scheme Argument
  </h3>
  <p className="text-sm text-gray-600 mb-4">
    This argument uses a single argumentation scheme. Net visualization is available
    for arguments with multiple interconnected schemes.
  </p>
  <Button variant="outline" size="sm">
    View Critical Questions
  </Button>
</Card>

// Net detection failed
<Card className="p-6 text-center">
  <AlertCircle className="w-12 h-12 mx-auto text-orange-500 mb-3" />
  <h3 className="font-semibold text-gray-700 mb-2">
    Unable to Detect Net Structure
  </h3>
  <p className="text-sm text-gray-600 mb-4">
    We couldn&apos;t automatically detect the net structure. You can still view
    critical questions for this argument.
  </p>
  <div className="flex gap-2 justify-center">
    <Button variant="outline" size="sm" onClick={onRetry}>
      Try Again
    </Button>
    <Button size="sm">View CQs</Button>
  </div>
</Card>
```

#### 4.3 Loading State Improvements
**Time**: 2 hours

Add skeleton loaders and progress indicators:

```tsx
// Skeleton loader for net analysis
function NetAnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// Progressive loading
<ArgumentNetAnalyzer
  argumentId={id}
  deliberationId={delibId}
  loadingState={
    <div className="space-y-3 p-6">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Analyzing argument structure...</span>
      </div>
      <NetAnalysisSkeleton />
    </div>
  }
/>
```

#### 4.4 Analytics and Usage Tracking
**Time**: 3 hours

Track net analysis usage for product insights:

```typescript
// lib/analytics/netAnalytics.ts
export function trackNetAnalysisOpened(argumentId: string, netType: string) {
  // Analytics implementation
  analytics.track('Net Analysis Opened', {
    argumentId,
    netType,
    timestamp: new Date().toISOString(),
  });
}

export function trackNetViewToggled(from: string, to: string) {
  analytics.track('Net View Toggled', { from, to });
}

export function trackNetCQSelected(cqType: string, targetScheme: string) {
  analytics.track('Net CQ Selected', { cqType, targetScheme });
}

// Usage in components
useEffect(() => {
  if (netData) {
    trackNetAnalysisOpened(argumentId, netData.netType);
  }
}, [netData]);
```

**Deliverables**:
- ✅ Onboarding flow for new feature
- ✅ Improved empty states and error messages
- ✅ Skeleton loaders and progress indicators
- ✅ Analytics tracking
- ✅ Polished user experience

---

## File Structure Changes

### New Files
```
components/
  nets/
    analysis/
      NetAnalysisButton.tsx          # Reusable button component
      NetAnalysisBadge.tsx            # Badge for multi-scheme arguments
      NetAnalysisDialog.tsx           # Standalone dialog wrapper
  onboarding/
    NetAnalysisIntro.tsx              # First-time user onboarding

lib/
  client/
    netDetectionCache.ts              # Client-side caching
  analytics/
    netAnalytics.ts                   # Analytics tracking

app/
  api/
    nets/
      detect/
        batch/
          route.ts                    # Bulk detection endpoint
```

### Modified Files
```
components/
  arguments/
    ArgumentCard.tsx                  # Add net analysis button
    ArgumentList.tsx                  # Add batch detection
  deep-dive/
    DeepDivePanel.tsx                 # Integrate SchemeAnalyzer
  deliberation/
    DeliberationDetail.tsx            # Add net badges
```

---

## Testing Plan

### Unit Tests
```typescript
// ArgumentNetAnalyzer.test.tsx
describe('ArgumentNetAnalyzer', () => {
  it('detects multi-scheme net', async () => {
    // Test net detection
  });
  
  it('falls back to single scheme view', async () => {
    // Test fallback
  });
  
  it('handles API errors gracefully', async () => {
    // Test error handling
  });
});

// SchemeAnalyzer.test.tsx
describe('SchemeAnalyzer', () => {
  it('switches between net and traditional view', async () => {
    // Test view switching
  });
  
  it('maintains backward compatibility', async () => {
    // Test with old props
  });
});
```

### Integration Tests
```typescript
// net-integration.test.tsx
describe('Net Integration', () => {
  it('loads net analysis from deep dive', async () => {
    // Test deep dive integration
  });
  
  it('detects nets in argument list', async () => {
    // Test bulk detection
  });
  
  it('caches detection results', async () => {
    // Test caching
  });
});
```

### Manual Testing Checklist
- [ ] Open argument card, click "Net Analysis" button
- [ ] Verify dialog opens with correct net data
- [ ] Test with single-scheme argument (should fallback)
- [ ] Test with multi-scheme argument (should show net view)
- [ ] Open deep dive panel, check net analysis tab
- [ ] Toggle between traditional and net view
- [ ] Test keyboard shortcuts (Cmd+N, Cmd+Shift+V)
- [ ] Test on mobile/tablet (responsive)
- [ ] Test with slow network (loading states)
- [ ] Test with API errors (error handling)

---

## Rollout Plan

### Week 1: Alpha Release (Internal Team)
- Deploy Phase 1 changes
- Enable for internal team only
- Gather feedback
- Fix critical bugs

### Week 2: Beta Release (10% of Users)
- Deploy Phase 2 changes
- Enable for 10% of users via feature flag
- Monitor analytics
- Gather user feedback

### Week 3: Gradual Rollout (50% of Users)
- Deploy Phase 3 optimizations
- Increase to 50% of users
- Monitor performance
- Address feedback

### Week 4: Full Rollout (100% of Users)
- Deploy Phase 4 polish
- Enable for all users
- Launch onboarding
- Announce feature

---

## Success Metrics

### Usage Metrics
- % of users who click "Net Analysis" button
- % of multi-scheme arguments that use net view
- Average time spent in net view
- Net view vs traditional view preference

### Performance Metrics
- Net detection API response time (target: < 500ms)
- Component render time (target: < 200ms)
- Cache hit rate (target: > 70%)

### Quality Metrics
- User satisfaction score
- Bug reports per week
- Feature adoption rate

---

## Risks and Mitigation

### Risk 1: Performance Impact
**Risk**: Net detection on every argument load could slow down UI  
**Mitigation**: Implement caching, bulk detection, lazy loading

### Risk 2: User Confusion
**Risk**: Users may not understand difference between views  
**Mitigation**: Clear onboarding, tooltips, help documentation

### Risk 3: Breaking Changes
**Risk**: Integration might break existing CQ functionality  
**Mitigation**: Comprehensive testing, gradual rollout, feature flags

### Risk 4: API Reliability
**Risk**: Net detection API might fail or timeout  
**Mitigation**: Graceful fallback, retry logic, error handling

---

## Next Steps

1. **Immediate** (This Week):
   - Review this plan with team
   - Identify Deep Dive Panel component location
   - Set up feature flags
   - Create tracking ticket for each phase

2. **Week 1** (Starting Next Week):
   - Begin Phase 1 implementation
   - Create NetAnalysisButton component
   - Add net badges to argument list
   - Deploy to staging

3. **Week 2-4**:
   - Continue with Phases 2-4
   - Monitor rollout metrics
   - Gather user feedback
   - Iterate based on learnings

---

## Conclusion

This integration plan provides a systematic, low-risk approach to bringing Phase 4 net features into the main application. By following a phased rollout with comprehensive testing and monitoring, we can ensure a smooth transition that enhances the user experience without disrupting existing functionality.

**Total Estimated Time**: 4 weeks (60-80 hours)  
**Risk Level**: Low (backward compatible, gradual rollout)  
**User Impact**: High (major new feature)  
**Technical Debt**: None (clean integration)

🎯 **Ready to Begin Phase 1 Implementation**
