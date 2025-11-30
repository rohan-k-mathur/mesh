# Designs, Disputes and Strategies - Development Roadmap
## Phases 4 & 5

This document continues the implementation roadmap for integrating insights from Faggian & Hyland (2002) into the Mesh ludics system.

**Previous Phases**:
- Phase 1: Core Abstractions (Views, Chronicles, Legal Positions)
- Phase 2: Strategy Layer (Innocent Strategies, Propagation)
- Phase 3: Correspondences & Isomorphisms (Disp/Ch operations, bidirectional transformations)

---

## PHASE 4: UI Integration & Developer Experience

**Duration**: 2-3 weeks
**Goal**: Make all Phase 1-3 abstractions visible and actionable in the existing UI

### Phase 4 Overview

Phase 4 takes the backend work from Phases 1-3 and integrates it into the user-facing components. We'll implement this in **three parts**:

**Part 1: LudicsPanel Integration**
- Add Views/Chronicles/Strategies tabs
- Integrate StrategyInspector and CorrespondenceViewer
- Add analysis controls and status indicators

**Part 2: LudicsForest Enhancements**
- Add strategy badges to forest view
- Show correspondence status per design
- Implement quick-analysis actions

**Part 3: Debugging & Analysis Tools**
- View-based debugging interface
- Strategy comparison tools
- Dispute trace viewer
- Chronicle navigation

---

## PHASE 4 - PART 1: LudicsPanel Integration

### 4.1.1 Component Structure Changes

**Extend LudicsPanel State**:

```typescript
// Add to LudicsPanel.tsx state
interface LudicsAnalysisState {
  // View/Chronicle Analysis
  selectedView: View | null;
  selectedChronicle: Chronicle | null;
  viewsExpanded: boolean;
  chroniclesExpanded: boolean;
  
  // Strategy Analysis
  strategyAnalysis: {
    innocenceCheck?: InnocenceCheck;
    propagationCheck?: PropagationCheck;
    inProgress: boolean;
  };
  
  // Correspondence Analysis
  correspondence: {
    verified: boolean;
    isomorphisms?: IsomorphismResults;
    disputes?: Dispute[];
    chronicles?: Chronicle[];
    inProgress: boolean;
  };
  
  // Active analysis mode
  analysisMode: 'design' | 'strategy' | 'correspondence' | null;
}
```

### 4.1.2 New Tab: "Analysis" Panel

Add new tab to LudicsPanel's tab system:

```tsx
// In LudicsPanel.tsx, add to tab list
const tabs = [
  'Compile',
  'Step',
  'Trace',
  'Insights',
  'Analysis', // NEW TAB
  // ... existing tabs
];

// Tab content render
{activeTab === 'Analysis' && (
  <AnalysisPanel
    designId={activeDesignId}
    analysisState={analysisState}
    onAnalysisUpdate={handleAnalysisUpdate}
  />
)}
```

### 4.1.3 AnalysisPanel Component

**New Component** (`components/ludics/AnalysisPanel.tsx`):

```tsx
'use client';

import * as React from 'react';
import { StrategyInspector } from './StrategyInspector';
import { CorrespondenceViewer } from './CorrespondenceViewer';
import { ViewsExplorer } from './ViewsExplorer';
import { ChroniclesExplorer } from './ChroniclesExplorer';
import type { LudicsAnalysisState } from './LudicsPanel';

export function AnalysisPanel({
  designId,
  analysisState,
  onAnalysisUpdate
}: {
  designId: string;
  analysisState: LudicsAnalysisState;
  onAnalysisUpdate: (update: Partial<LudicsAnalysisState>) => void;
}) {
  const [activeSection, setActiveSection] = React.useState<
    'overview' | 'views' | 'chronicles' | 'strategy' | 'correspondence'
  >('overview');
  
  return (
    <div className="analysis-panel h-full flex flex-col">
      {/* Section Selector */}
      <div className="section-tabs flex gap-2 border-b p-2 bg-slate-50">
        <TabButton
          active={activeSection === 'overview'}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </TabButton>
        <TabButton
          active={activeSection === 'views'}
          onClick={() => setActiveSection('views')}
        >
          Views
        </TabButton>
        <TabButton
          active={activeSection === 'chronicles'}
          onClick={() => setActiveSection('chronicles')}
        >
          Chronicles
        </TabButton>
        <TabButton
          active={activeSection === 'strategy'}
          onClick={() => setActiveSection('strategy')}
        >
          Strategy
        </TabButton>
        <TabButton
          active={activeSection === 'correspondence'}
          onClick={() => setActiveSection('correspondence')}
        >
          Correspondence
        </TabButton>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSection === 'overview' && (
          <AnalysisOverview designId={designId} />
        )}
        
        {activeSection === 'views' && (
          <ViewsExplorer
            designId={designId}
            selectedView={analysisState.selectedView}
            onSelectView={(view) => onAnalysisUpdate({ selectedView: view })}
          />
        )}
        
        {activeSection === 'chronicles' && (
          <ChroniclesExplorer
            designId={designId}
            selectedChronicle={analysisState.selectedChronicle}
            onSelectChronicle={(chr) => onAnalysisUpdate({ selectedChronicle: chr })}
          />
        )}
        
        {activeSection === 'strategy' && (
          <StrategyInspector designId={designId} />
        )}
        
        {activeSection === 'correspondence' && (
          <CorrespondenceViewer
            designId={designId}
            strategyId={analysisState.correspondence.strategyId}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded font-medium transition ${
        active
          ? 'bg-white text-slate-800 border border-slate-200 shadow-sm'
          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}
```

### 4.1.4 AnalysisOverview Component

**New Component** (`components/ludics/AnalysisOverview.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { StrategyInspector } from './StrategyInspector';
import { CorrespondenceViewer } from './CorrespondenceViewer';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function AnalysisOverview({
  designId
}: {
  designId: string;
}) {
  const [runningAnalysis, setRunningAnalysis] = React.useState(false);
  
  // Fetch basic stats
  const { data: designData } = useSWR(
    `/api/ludics/designs/${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const { data: viewsData } = useSWR(
    `/api/ludics/views?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const { data: chroniclesData } = useSWR(
    `/api/ludics/chronicles?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const runFullAnalysis = async () => {
    setRunningAnalysis(true);
    try {
      // Run all analyses in parallel
      await Promise.all([
        fetch(`/api/ludics/views?designId=${designId}`, { method: 'POST' }),
        fetch(`/api/ludics/chronicles?designId=${designId}`, { method: 'POST' }),
        fetch('/api/ludics/strategies/innocence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designId })
        }),
        fetch('/api/ludics/strategies/propagation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designId })
        })
      ]);
    } finally {
      setRunningAnalysis(false);
    }
  };
  
  return (
    <div className="analysis-overview space-y-4">
      {/* Header with Run Analysis Button */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Design Analysis
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Complete Games Semantics correspondence check
          </p>
        </div>
        <button
          onClick={runFullAnalysis}
          disabled={runningAnalysis}
          className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {runningAnalysis ? 'Analyzing...' : 'Run Full Analysis'}
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Actions"
          value={designData?.design?.acts?.length || 0}
          icon="🔷"
        />
        <StatCard
          label="Views"
          value={viewsData?.count || 0}
          icon="👁"
        />
        <StatCard
          label="Chronicles"
          value={chroniclesData?.count || 0}
          icon="📜"
        />
      </div>
      
      {/* Inline Strategy Analysis */}
      <div className="strategy-section">
        <StrategyInspector designId={designId} />
      </div>
      
      {/* Inline Correspondence */}
      <div className="correspondence-section">
        <CorrespondenceViewer
          designId={designId}
          strategyId={viewsData?.strategyId}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="stat-card border rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-semibold text-slate-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}
```

### 4.1.5 ViewsExplorer Component

**New Component** (`components/ludics/ViewsExplorer.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { View } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ViewsExplorer({
  designId,
  selectedView,
  onSelectView
}: {
  designId: string;
  selectedView: View | null;
  onSelectView: (view: View) => void;
}) {
  const { data, isLoading, mutate } = useSWR(
    `/api/ludics/views?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const views = (data?.views || []) as View[];
  
  const computeViews = async () => {
    await fetch(`/api/ludics/views?designId=${designId}`, { method: 'POST' });
    await mutate();
  };
  
  return (
    <div className="views-explorer space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          Views Explorer
        </h3>
        <button
          onClick={computeViews}
          className="px-3 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-800"
        >
          Recompute Views
        </button>
      </div>
      
      {/* Description */}
      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border">
        <strong>Views</strong> extract the P-visible subsequence from positions.
        Definition 3.5: p̄ = subsequence of p containing only P actions and their immediate O heirs.
      </div>
      
      {/* Views List */}
      {isLoading ? (
        <div className="text-xs text-slate-500">Loading views...</div>
      ) : (
        <div className="views-grid grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {views.map((view, idx) => (
            <ViewCard
              key={view.id}
              view={view}
              index={idx}
              selected={selectedView?.id === view.id}
              onSelect={() => onSelectView(view)}
            />
          ))}
        </div>
      )}
      
      {!isLoading && views.length === 0 && (
        <div className="text-xs text-slate-500 italic text-center py-8">
          No views found. Click "Recompute Views" to extract.
        </div>
      )}
      
      {/* Selected View Details */}
      {selectedView && (
        <div className="selected-view-details border-t pt-3 mt-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">
            View Details
          </h4>
          <div className="bg-white border rounded p-3 space-y-2 text-xs">
            <div>
              <span className="font-semibold">Player:</span> {selectedView.player}
            </div>
            <div>
              <span className="font-semibold">Length:</span> {selectedView.sequence.length} actions
            </div>
            <div>
              <span className="font-semibold">Sequence:</span>
              <pre className="mt-1 p-2 bg-slate-50 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(selectedView.sequence, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewCard({
  view,
  index,
  selected,
  onSelect
}: {
  view: View;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`view-card text-left p-2 rounded border transition ${
        selected
          ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
          : 'bg-white hover:bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-semibold text-slate-700">
          View {index + 1}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          view.player === 'P'
            ? 'bg-sky-100 text-sky-700'
            : 'bg-rose-100 text-rose-700'
        }`}>
          {view.player}
        </span>
      </div>
      <div className="text-[10px] text-slate-500">
        {view.sequence.length} actions
      </div>
    </button>
  );
}
```

### 4.1.6 ChroniclesExplorer Component

**New Component** (`components/ludics/ChroniclesExplorer.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { Chronicle } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ChroniclesExplorer({
  designId,
  selectedChronicle,
  onSelectChronicle
}: {
  designId: string;
  selectedChronicle: Chronicle | null;
  onSelectChronicle: (chronicle: Chronicle) => void;
}) {
  const { data, isLoading, mutate } = useSWR(
    `/api/ludics/chronicles?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const chronicles = (data?.chronicles || []) as Chronicle[];
  
  const computeChronicles = async () => {
    await fetch(`/api/ludics/chronicles?designId=${designId}`, { method: 'POST' });
    await mutate();
  };
  
  return (
    <div className="chronicles-explorer space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          Chronicles Explorer
        </h3>
        <button
          onClick={computeChronicles}
          className="px-3 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-800"
        >
          Recompute Chronicles
        </button>
      </div>
      
      {/* Description */}
      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border">
        <strong>Chronicles</strong> represent maximal branches in disputes.
        Proposition 3.6: Chronicles partition disputes into coherent paths.
      </div>
      
      {/* Chronicles List */}
      {isLoading ? (
        <div className="text-xs text-slate-500">Loading chronicles...</div>
      ) : (
        <div className="chronicles-list space-y-2 max-h-96 overflow-y-auto">
          {chronicles.map((chronicle, idx) => (
            <ChronicleCard
              key={chronicle.id}
              chronicle={chronicle}
              index={idx}
              selected={selectedChronicle?.id === chronicle.id}
              onSelect={() => onSelectChronicle(chronicle)}
            />
          ))}
        </div>
      )}
      
      {!isLoading && chronicles.length === 0 && (
        <div className="text-xs text-slate-500 italic text-center py-8">
          No chronicles found. Click "Recompute Chronicles" to extract.
        </div>
      )}
      
      {/* Selected Chronicle Details */}
      {selectedChronicle && (
        <div className="selected-chronicle-details border-t pt-3 mt-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">
            Chronicle Details
          </h4>
          <div className="bg-white border rounded p-3 space-y-2 text-xs">
            <div>
              <span className="font-semibold">Length:</span> {selectedChronicle.length} actions
            </div>
            <div>
              <span className="font-semibold">Maximal:</span>{' '}
              {selectedChronicle.isMaximal ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-semibold">Sequence:</span>
              <pre className="mt-1 p-2 bg-slate-50 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(selectedChronicle.sequence, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChronicleCard({
  chronicle,
  index,
  selected,
  onSelect
}: {
  chronicle: Chronicle;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`chronicle-card w-full text-left p-3 rounded border transition ${
        selected
          ? 'bg-violet-50 border-violet-300 ring-2 ring-violet-200'
          : 'bg-white hover:bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-semibold text-slate-700">
          Chronicle {index + 1}
        </span>
        {chronicle.isMaximal && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
            MAXIMAL
          </span>
        )}
      </div>
      <div className="text-[10px] text-slate-500">
        {chronicle.length} actions
      </div>
    </button>
  );
}
```

### 4.1.7 Integration into LudicsPanel

**Modifications to LudicsPanel.tsx**:

```typescript
// 1. Import new components
import { AnalysisPanel } from '@/components/ludics/AnalysisPanel';
import type { LudicsAnalysisState } from '@/components/ludics/types';

// 2. Add analysis state
const [analysisState, setAnalysisState] = React.useState<LudicsAnalysisState>({
  selectedView: null,
  selectedChronicle: null,
  viewsExpanded: false,
  chroniclesExpanded: false,
  strategyAnalysis: {
    inProgress: false
  },
  correspondence: {
    verified: false,
    inProgress: false
  },
  analysisMode: null
});

// 3. Add tab to existing tabs array
const tabs = [
  'Compile',
  'Step',
  'Trace',
  'Insights',
  'Analysis', // NEW
  'NLI',
  'Judge',
  // ... rest
];

// 4. Add tab content rendering
{activeTab === 'Analysis' && activeScope && (
  <AnalysisPanel
    designId={activeScope.designId}
    analysisState={analysisState}
    onAnalysisUpdate={(update) => 
      setAnalysisState(prev => ({ ...prev, ...update }))
    }
  />
)}

// 5. Add analysis status indicator in header (optional)
<div className="analysis-status flex items-center gap-2">
  {analysisState.strategyAnalysis.innocenceCheck?.isInnocent && (
    <span className="px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-700 font-semibold">
      ✓ Innocent
    </span>
  )}
  {analysisState.correspondence.verified && (
    <span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-700 font-semibold">
      ✓ Verified
    </span>
  )}
</div>
```

### 4.1.8 Part 1 Deliverables

✅ AnalysisPanel component with 5 sections (overview, views, chronicles, strategy, correspondence)
✅ AnalysisOverview with stats grid and quick analysis runner
✅ ViewsExplorer with grid view and detail panel
✅ ChroniclesExplorer with list view and detail panel
✅ Integration into LudicsPanel as new "Analysis" tab
✅ Analysis state management in LudicsPanel
✅ Status indicators for innocence and correspondence verification

### 4.1.9 Part 1 Success Metrics

- Analysis tab accessible in LudicsPanel
- Views/Chronicles explorable with detail views
- "Run Full Analysis" executes all checks in <5s
- Stats update in real-time after analysis
- Selected views/chronicles display full details
- UI responsive with >100 views/chronicles

---

## PHASE 4 - PART 2: LudicsForest Enhancements

### 4.2.1 Component Structure Changes

**Extend LudicsForest State**:

```typescript
// Add to LudicsForest.tsx state
interface ForestAnalysisState {
  // Batch analysis
  batchAnalysisInProgress: boolean;
  analyzedDesigns: Set<string>;
  
  // Quick filters
  showOnlyInnocent: boolean;
  showOnlyVerified: boolean;
  showOnlyWithDisputes: boolean;
  
  // Hover states
  hoveredDesignId: string | null;
  
  // Comparison mode
  comparisonMode: boolean;
  comparedDesigns: string[];
}
```

### 4.2.2 Strategy Badges in Forest View

**New Component** (`components/ludics/DesignAnalysisBadges.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function DesignAnalysisBadges({
  designId,
  compact = false
}: {
  designId: string;
  compact?: boolean;
}) {
  // Fetch analysis results
  const { data: innocenceData } = useSWR(
    `/api/ludics/strategies/innocence?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  const { data: propagationData } = useSWR(
    `/api/ludics/strategies/propagation?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  const { data: correspondenceData } = useSWR(
    `/api/ludics/correspondence?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  const isInnocent = innocenceData?.isInnocent;
  const satisfiesPropagation = propagationData?.satisfiesPropagation;
  const isVerified = correspondenceData?.correspondence?.isVerified;
  
  const hasAnalysis = 
    innocenceData !== undefined || 
    propagationData !== undefined || 
    correspondenceData !== undefined;
  
  if (!hasAnalysis) {
    return null;
  }
  
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isInnocent && (
          <span className="text-xs" title="Innocent Strategy">✓</span>
        )}
        {satisfiesPropagation && (
          <span className="text-xs" title="Satisfies Propagation">⚡</span>
        )}
        {isVerified && (
          <span className="text-xs" title="Correspondence Verified">≅</span>
        )}
      </div>
    );
  }
  
  return (
    <div className="design-analysis-badges flex flex-wrap gap-1">
      {isInnocent !== undefined && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          isInnocent
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {isInnocent ? '✓ Innocent' : '⚠ Not Innocent'}
        </span>
      )}
      
      {satisfiesPropagation !== undefined && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          satisfiesPropagation
            ? 'bg-sky-100 text-sky-700'
            : 'bg-rose-100 text-rose-700'
        }`}>
          {satisfiesPropagation ? '⚡ Propagation' : '✗ No Propagation'}
        </span>
      )}
      
      {isVerified !== undefined && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          isVerified
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-slate-100 text-slate-600'
        }`}>
          {isVerified ? '≅ Verified' : '○ Unverified'}
        </span>
      )}
    </div>
  );
}
```

### 4.2.3 Quick Analysis Actions

**New Component** (`components/ludics/QuickAnalysisActions.tsx`):

```tsx
'use client';

import * as React from 'react';

export function QuickAnalysisActions({
  designId,
  onAnalysisComplete
}: {
  designId: string;
  onAnalysisComplete?: () => void;
}) {
  const [running, setRunning] = React.useState(false);
  
  const runQuickAnalysis = async () => {
    setRunning(true);
    try {
      // Run innocence and propagation checks in parallel
      await Promise.all([
        fetch('/api/ludics/strategies/innocence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designId })
        }),
        fetch('/api/ludics/strategies/propagation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designId })
        })
      ]);
      
      onAnalysisComplete?.();
    } catch (error) {
      console.error('Quick analysis failed:', error);
    } finally {
      setRunning(false);
    }
  };
  
  return (
    <button
      onClick={runQuickAnalysis}
      disabled={running}
      className="quick-analysis-btn px-2 py-1 text-[10px] rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium"
      title="Run quick strategy analysis"
    >
      {running ? '⟳ Analyzing...' : '⚡ Quick Check'}
    </button>
  );
}
```

### 4.2.4 Enhanced DesignTreeView with Analysis

**Modifications to DesignTreeView.tsx**:

```tsx
// Add imports
import { DesignAnalysisBadges } from './DesignAnalysisBadges';
import { QuickAnalysisActions } from './QuickAnalysisActions';

// Add to component props
export function DesignTreeView({
  design,
  showAnalysis = false, // NEW PROP
  onBadgeClick, // NEW PROP
  // ... existing props
}: {
  design: LudicsDesign;
  showAnalysis?: boolean;
  onBadgeClick?: (designId: string, analysisType: string) => void;
  // ... existing props
}) {
  // ... existing code ...
  
  return (
    <div className="design-tree-view">
      {/* Header with analysis badges */}
      <div className="design-header flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{design.name}</h3>
          
          {/* NEW: Analysis badges */}
          {showAnalysis && (
            <DesignAnalysisBadges 
              designId={design.id}
              compact={false}
            />
          )}
        </div>
        
        {/* NEW: Quick analysis button */}
        {showAnalysis && (
          <QuickAnalysisActions
            designId={design.id}
            onAnalysisComplete={() => {
              // Refetch badges
              mutate(`/api/ludics/strategies/innocence?designId=${design.id}`);
              mutate(`/api/ludics/strategies/propagation?designId=${design.id}`);
            }}
          />
        )}
      </div>
      
      {/* Existing tree rendering */}
      {/* ... */}
    </div>
  );
}
```

### 4.2.5 Batch Analysis for Forest View

**New Component** (`components/ludics/BatchAnalysisControls.tsx`):

```tsx
'use client';

import * as React from 'react';

export function BatchAnalysisControls({
  designIds,
  onBatchComplete
}: {
  designIds: string[];
  onBatchComplete?: () => void;
}) {
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  
  const runBatchAnalysis = async () => {
    setRunning(true);
    setProgress(0);
    
    try {
      // Process designs in batches of 5
      const batchSize = 5;
      for (let i = 0; i < designIds.length; i += batchSize) {
        const batch = designIds.slice(i, i + batchSize);
        
        // Run analysis for each design in batch
        await Promise.all(
          batch.map(designId =>
            Promise.all([
              fetch('/api/ludics/strategies/innocence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ designId })
              }),
              fetch('/api/ludics/strategies/propagation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ designId })
              })
            ])
          )
        );
        
        setProgress(Math.min(i + batchSize, designIds.length));
      }
      
      onBatchComplete?.();
    } catch (error) {
      console.error('Batch analysis failed:', error);
    } finally {
      setRunning(false);
    }
  };
  
  return (
    <div className="batch-analysis-controls flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
      <div className="flex-1">
        <div className="text-xs font-semibold text-slate-700 mb-1">
          Batch Analysis
        </div>
        <div className="text-[10px] text-slate-600">
          Analyze {designIds.length} designs
        </div>
      </div>
      
      {running && (
        <div className="flex-1">
          <div className="text-xs text-slate-600 mb-1">
            Progress: {progress} / {designIds.length}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${(progress / designIds.length) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      <button
        onClick={runBatchAnalysis}
        disabled={running}
        className="px-4 py-2 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium"
      >
        {running ? 'Analyzing...' : 'Analyze All'}
      </button>
    </div>
  );
}
```

### 4.2.6 Analysis Filters

**New Component** (`components/ludics/AnalysisFilters.tsx`):

```tsx
'use client';

import * as React from 'react';

export interface AnalysisFilterState {
  showOnlyInnocent: boolean;
  showOnlyVerified: boolean;
  showOnlyWithDisputes: boolean;
}

export function AnalysisFilters({
  filters,
  onFiltersChange
}: {
  filters: AnalysisFilterState;
  onFiltersChange: (filters: AnalysisFilterState) => void;
}) {
  const toggleFilter = (key: keyof AnalysisFilterState) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key]
    });
  };
  
  const activeCount = Object.values(filters).filter(Boolean).length;
  
  return (
    <div className="analysis-filters space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">
          Filters {activeCount > 0 && `(${activeCount})`}
        </span>
        {activeCount > 0 && (
          <button
            onClick={() => onFiltersChange({
              showOnlyInnocent: false,
              showOnlyVerified: false,
              showOnlyWithDisputes: false
            })}
            className="text-[10px] text-indigo-600 hover:text-indigo-800"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="space-y-1">
        <FilterCheckbox
          label="Innocent Strategies Only"
          checked={filters.showOnlyInnocent}
          onChange={() => toggleFilter('showOnlyInnocent')}
        />
        <FilterCheckbox
          label="Verified Correspondences Only"
          checked={filters.showOnlyVerified}
          onChange={() => toggleFilter('showOnlyVerified')}
        />
        <FilterCheckbox
          label="With Disputes Only"
          checked={filters.showOnlyWithDisputes}
          onChange={() => toggleFilter('showOnlyWithDisputes')}
        />
      </div>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span>{label}</span>
    </label>
  );
}
```

### 4.2.7 Strategy Comparison Mode

**New Component** (`components/ludics/StrategyComparison.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { Strategy } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function StrategyComparison({
  designIds
}: {
  designIds: string[];
}) {
  if (designIds.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic text-center py-8">
        Select 2+ designs to compare strategies
      </div>
    );
  }
  
  return (
    <div className="strategy-comparison space-y-4">
      <h3 className="text-sm font-bold text-slate-800">
        Strategy Comparison ({designIds.length} designs)
      </h3>
      
      <div className="comparison-grid grid gap-4">
        {designIds.map(designId => (
          <StrategyComparisonCard key={designId} designId={designId} />
        ))}
      </div>
      
      {designIds.length >= 2 && (
        <ComparisonMatrix designIds={designIds} />
      )}
    </div>
  );
}

function StrategyComparisonCard({ designId }: { designId: string }) {
  const { data: innocenceData } = useSWR(
    `/api/ludics/strategies/innocence?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const { data: propagationData } = useSWR(
    `/api/ludics/strategies/propagation?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const { data: viewsData } = useSWR(
    `/api/ludics/views?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  return (
    <div className="comparison-card border rounded-lg p-3 bg-white">
      <div className="text-xs font-mono font-semibold text-slate-700 mb-2">
        Design {designId.slice(0, 8)}...
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-600">Innocent:</span>
          <span className={innocenceData?.isInnocent ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
            {innocenceData?.isInnocent ? '✓ Yes' : '✗ No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-600">Propagation:</span>
          <span className={propagationData?.satisfiesPropagation ? 'text-sky-600 font-semibold' : 'text-rose-600'}>
            {propagationData?.satisfiesPropagation ? '✓ Yes' : '✗ No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-600">Views:</span>
          <span className="text-slate-800 font-semibold">
            {viewsData?.count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

function ComparisonMatrix({ designIds }: { designIds: string[] }) {
  return (
    <div className="comparison-matrix border rounded-lg p-3 bg-slate-50">
      <div className="text-xs font-semibold text-slate-700 mb-2">
        Similarity Matrix
      </div>
      <div className="text-[10px] text-slate-600">
        Comparison matrix implementation would compute view/chronicle overlap
      </div>
      {/* Full implementation would show NxN matrix of similarities */}
    </div>
  );
}
```

### 4.2.8 Integration into LudicsForest

**Modifications to LudicsForest.tsx**:

```typescript
// 1. Add imports
import { BatchAnalysisControls } from './BatchAnalysisControls';
import { AnalysisFilters, AnalysisFilterState } from './AnalysisFilters';
import { StrategyComparison } from './StrategyComparison';
import { DesignAnalysisBadges } from './DesignAnalysisBadges';

// 2. Add analysis state
const [analysisFilters, setAnalysisFilters] = React.useState<AnalysisFilterState>({
  showOnlyInnocent: false,
  showOnlyVerified: false,
  showOnlyWithDisputes: false
});

const [comparisonMode, setComparisonMode] = React.useState(false);
const [comparedDesigns, setComparedDesigns] = React.useState<string[]>([]);

// 3. Add "Analysis" view mode (alongside forest/split-screen/merged)
const [viewMode, setViewMode] = React.useState<'forest' | 'split-screen' | 'merged' | 'analysis'>('forest');

// 4. Add analysis controls in toolbar
<div className="forest-toolbar flex items-center justify-between p-3 border-b bg-slate-50">
  <div className="view-modes flex gap-2">
    {/* Existing view mode buttons */}
    <ViewModeButton
      active={viewMode === 'forest'}
      onClick={() => setViewMode('forest')}
    >
      🌲 Forest
    </ViewModeButton>
    {/* ... other modes ... */}
    
    {/* NEW: Analysis mode */}
    <ViewModeButton
      active={viewMode === 'analysis'}
      onClick={() => setViewMode('analysis')}
    >
      📊 Analysis
    </ViewModeButton>
  </div>
  
  {/* NEW: Comparison toggle */}
  {viewMode === 'forest' && (
    <button
      onClick={() => setComparisonMode(!comparisonMode)}
      className={`px-3 py-1.5 text-xs rounded font-medium transition ${
        comparisonMode
          ? 'bg-indigo-600 text-white'
          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {comparisonMode ? '✓ Compare Mode' : 'Compare'}
    </button>
  )}
</div>

// 5. Add filters sidebar (when in forest view)
{viewMode === 'forest' && (
  <div className="forest-with-filters flex gap-3">
    <div className="filters-sidebar w-64 border-r p-3 bg-slate-50">
      <AnalysisFilters
        filters={analysisFilters}
        onFiltersChange={setAnalysisFilters}
      />
      
      {comparisonMode && comparedDesigns.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Selected for Comparison ({comparedDesigns.length})
          </div>
          <button
            onClick={() => setComparedDesigns([])}
            className="text-[10px] text-indigo-600 hover:text-indigo-800"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
    
    <div className="flex-1">
      {/* Existing forest rendering */}
    </div>
  </div>
)}

// 6. Analysis view mode content
{viewMode === 'analysis' && (
  <div className="analysis-view p-4 space-y-4">
    {/* Batch analysis controls */}
    <BatchAnalysisControls
      designIds={allDesignIds}
      onBatchComplete={() => {
        // Refetch all analysis data
        mutateAnalysisData();
      }}
    />
    
    {/* Strategy comparison */}
    {comparedDesigns.length > 0 ? (
      <StrategyComparison designIds={comparedDesigns} />
    ) : (
      <div className="text-xs text-slate-500 italic text-center py-8">
        Enter comparison mode and select designs to compare strategies
      </div>
    )}
    
    {/* Analysis summary table */}
    <AnalysisSummaryTable designs={visibleDesigns} />
  </div>
)}

// 7. Modify design card rendering to include badges
function renderDesignCard(design: LudicsDesign) {
  const isSelected = comparisonMode && comparedDesigns.includes(design.id);
  
  return (
    <div
      className={`design-card border rounded p-2 ${
        isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-white'
      }`}
      onClick={() => {
        if (comparisonMode) {
          toggleDesignSelection(design.id);
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">{design.name}</span>
        {comparisonMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleDesignSelection(design.id)}
            className="rounded border-slate-300"
          />
        )}
      </div>
      
      {/* NEW: Analysis badges */}
      <DesignAnalysisBadges designId={design.id} compact={false} />
      
      {/* Existing tree view */}
      <DesignTreeView
        design={design}
        showAnalysis={true}
        // ... other props
      />
    </div>
  );
}

// 8. Filter designs based on analysis filters
const filteredDesigns = React.useMemo(() => {
  return designs.filter(design => {
    // Apply filters
    if (analysisFilters.showOnlyInnocent) {
      // Check if design is innocent (would need to fetch/cache this)
    }
    if (analysisFilters.showOnlyVerified) {
      // Check if correspondence is verified
    }
    if (analysisFilters.showOnlyWithDisputes) {
      // Check if design has disputes
    }
    return true;
  });
}, [designs, analysisFilters]);
```

### 4.2.9 Analysis Summary Table

**New Component** (`components/ludics/AnalysisSummaryTable.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function AnalysisSummaryTable({
  designs
}: {
  designs: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="analysis-summary-table border rounded-lg overflow-hidden">
      <div className="bg-slate-100 border-b px-3 py-2">
        <h3 className="text-xs font-bold text-slate-800">
          Analysis Summary
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-2 font-semibold text-slate-700">Design</th>
              <th className="text-center p-2 font-semibold text-slate-700">Innocent</th>
              <th className="text-center p-2 font-semibold text-slate-700">Propagation</th>
              <th className="text-center p-2 font-semibold text-slate-700">Verified</th>
              <th className="text-right p-2 font-semibold text-slate-700">Views</th>
              <th className="text-right p-2 font-semibold text-slate-700">Chronicles</th>
              <th className="text-right p-2 font-semibold text-slate-700">Disputes</th>
            </tr>
          </thead>
          <tbody>
            {designs.map(design => (
              <AnalysisSummaryRow key={design.id} design={design} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalysisSummaryRow({
  design
}: {
  design: { id: string; name: string };
}) {
  const { data: innocenceData } = useSWR(
    `/api/ludics/strategies/innocence?designId=${design.id}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  const { data: propagationData } = useSWR(
    `/api/ludics/strategies/propagation?designId=${design.id}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  const { data: correspondenceData } = useSWR(
    `/api/ludics/correspondence?designId=${design.id}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  const { data: viewsData } = useSWR(
    `/api/ludics/views?designId=${design.id}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  const { data: chroniclesData } = useSWR(
    `/api/ludics/chronicles?designId=${design.id}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  const { data: disputesData } = useSWR(
    `/api/ludics/correspondence/disp?designId=${design.id}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  
  return (
    <tr className="border-b hover:bg-slate-50 transition">
      <td className="p-2 font-mono text-slate-700">{design.name}</td>
      <td className="p-2 text-center">
        {innocenceData?.isInnocent !== undefined ? (
          <span className={innocenceData.isInnocent ? 'text-emerald-600' : 'text-amber-600'}>
            {innocenceData.isInnocent ? '✓' : '✗'}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="p-2 text-center">
        {propagationData?.satisfiesPropagation !== undefined ? (
          <span className={propagationData.satisfiesPropagation ? 'text-sky-600' : 'text-rose-600'}>
            {propagationData.satisfiesPropagation ? '✓' : '✗'}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="p-2 text-center">
        {correspondenceData?.correspondence?.isVerified !== undefined ? (
          <span className={correspondenceData.correspondence.isVerified ? 'text-indigo-600' : 'text-slate-400'}>
            {correspondenceData.correspondence.isVerified ? '≅' : '○'}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="p-2 text-right text-slate-700">
        {viewsData?.count || '—'}
      </td>
      <td className="p-2 text-right text-slate-700">
        {chroniclesData?.count || '—'}
      </td>
      <td className="p-2 text-right text-slate-700">
        {disputesData?.count || '—'}
      </td>
    </tr>
  );
}
```

### 4.2.10 Part 2 Deliverables

✅ DesignAnalysisBadges component (compact and full modes)
✅ QuickAnalysisActions for per-design quick checks
✅ BatchAnalysisControls for analyzing all designs
✅ AnalysisFilters with 3 filter options
✅ StrategyComparison component with comparison matrix
✅ AnalysisSummaryTable with 7 columns of analysis data
✅ Enhanced DesignTreeView with analysis badges
✅ New "Analysis" view mode in LudicsForest
✅ Comparison mode with multi-select
✅ Filters sidebar integration
✅ Design filtering based on analysis results

### 4.2.11 Part 2 Success Metrics

- Analysis badges visible on all designs in forest view
- Quick analysis completes in <2s per design
- Batch analysis processes 20 designs in <30s
- Filters immediately update visible designs
- Comparison mode allows selecting 2+ designs
- Summary table displays all analysis metrics
- UI remains responsive with 50+ designs
- Badges update in real-time after analysis

---

## PHASE 4 - PART 3: Debugging & Analysis Tools

### 4.3.1 View-Based Debugging Interface

**New Component** (`components/ludics/ViewDebugger.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { View, Position, Action } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ViewDebugger({
  designId,
  positionId
}: {
  designId: string;
  positionId?: string;
}) {
  const [selectedView, setSelectedView] = React.useState<View | null>(null);
  const [debugMode, setDebugMode] = React.useState<'step' | 'compare' | 'trace'>('step');
  
  // Fetch all views
  const { data: viewsData } = useSWR(
    `/api/ludics/views?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const views = (viewsData?.views || []) as View[];
  
  return (
    <div className="view-debugger border rounded-lg bg-white">
      {/* Header */}
      <div className="debugger-header flex items-center justify-between p-3 border-b bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800">
          View-Based Debugger
        </h3>
        
        <div className="debug-mode-selector flex gap-1">
          <ModeButton
            active={debugMode === 'step'}
            onClick={() => setDebugMode('step')}
          >
            Step
          </ModeButton>
          <ModeButton
            active={debugMode === 'compare'}
            onClick={() => setDebugMode('compare')}
          >
            Compare
          </ModeButton>
          <ModeButton
            active={debugMode === 'trace'}
            onClick={() => setDebugMode('trace')}
          >
            Trace
          </ModeButton>
        </div>
      </div>
      
      <div className="debugger-content flex h-96">
        {/* Views sidebar */}
        <div className="views-sidebar w-64 border-r overflow-y-auto">
          <div className="p-2 border-b bg-slate-50">
            <div className="text-xs font-semibold text-slate-700">
              Views ({views.length})
            </div>
          </div>
          <div className="space-y-1 p-2">
            {views.map((view, idx) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view)}
                className={`w-full text-left p-2 rounded text-xs transition ${
                  selectedView?.id === view.id
                    ? 'bg-indigo-100 border border-indigo-300 text-indigo-800'
                    : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="font-mono font-semibold">View {idx + 1}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {view.sequence.length} actions
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Main debug area */}
        <div className="flex-1 p-4">
          {selectedView ? (
            <>
              {debugMode === 'step' && (
                <StepDebugger view={selectedView} />
              )}
              {debugMode === 'compare' && (
                <CompareDebugger view={selectedView} allViews={views} />
              )}
              {debugMode === 'trace' && (
                <TraceDebugger view={selectedView} designId={designId} />
              )}
            </>
          ) : (
            <div className="text-xs text-slate-500 italic text-center py-16">
              Select a view to debug
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded font-medium transition ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

// Step-by-step view debugger
function StepDebugger({ view }: { view: View }) {
  const [currentStep, setCurrentStep] = React.useState(0);
  
  const currentAction = view.sequence[currentStep];
  const prefix = view.sequence.slice(0, currentStep + 1);
  
  return (
    <div className="step-debugger space-y-4">
      <div className="text-xs font-semibold text-slate-800">
        Step-by-Step View Analysis
      </div>
      
      {/* Step controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-2 py-1 text-xs rounded bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-30"
        >
          ← Prev
        </button>
        <div className="flex-1 text-center text-xs font-mono text-slate-700">
          Step {currentStep + 1} / {view.sequence.length}
        </div>
        <button
          onClick={() => setCurrentStep(Math.min(view.sequence.length - 1, currentStep + 1))}
          disabled={currentStep === view.sequence.length - 1}
          className="px-2 py-1 text-xs rounded bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-30"
        >
          Next →
        </button>
      </div>
      
      {/* Current action details */}
      <div className="action-details border rounded p-3 bg-slate-50">
        <div className="text-xs font-semibold text-slate-700 mb-2">
          Current Action
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Focus:</span>
            <span className="font-mono text-slate-800">{currentAction?.focus}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Polarity:</span>
            <span className={`font-bold ${
              currentAction?.polarity === 'P' ? 'text-sky-600' : 'text-rose-600'
            }`}>
              {currentAction?.polarity}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Ramification:</span>
            <span className="font-mono text-slate-800">
              [{currentAction?.ramification?.join(', ')}]
            </span>
          </div>
        </div>
      </div>
      
      {/* View prefix so far */}
      <div className="prefix-view border rounded p-3">
        <div className="text-xs font-semibold text-slate-700 mb-2">
          View Prefix ({prefix.length} actions)
        </div>
        <pre className="text-[10px] bg-white p-2 rounded overflow-x-auto">
          {JSON.stringify(prefix, null, 2)}
        </pre>
      </div>
      
      {/* Legality check */}
      <LegalityIndicator actions={prefix} />
    </div>
  );
}

// Compare view with others
function CompareDebugger({
  view,
  allViews
}: {
  view: View;
  allViews: View[];
}) {
  const [compareWith, setCompareWith] = React.useState<View | null>(null);
  
  const similarViews = React.useMemo(() => {
    return allViews
      .filter(v => v.id !== view.id)
      .map(v => ({
        view: v,
        similarity: computeSimilarity(view, v)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }, [view, allViews]);
  
  return (
    <div className="compare-debugger space-y-4">
      <div className="text-xs font-semibold text-slate-800">
        View Comparison
      </div>
      
      {/* Similar views */}
      <div className="similar-views">
        <div className="text-xs font-semibold text-slate-700 mb-2">
          Most Similar Views
        </div>
        <div className="space-y-1">
          {similarViews.map(({ view: v, similarity }, idx) => (
            <button
              key={v.id}
              onClick={() => setCompareWith(v)}
              className={`w-full text-left p-2 rounded border text-xs transition ${
                compareWith?.id === v.id
                  ? 'bg-violet-50 border-violet-300'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono">View {idx + 1}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  {Math.round(similarity * 100)}% similar
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Side-by-side comparison */}
      {compareWith && (
        <div className="comparison-grid grid grid-cols-2 gap-3">
          <ViewCard title="Selected View" view={view} />
          <ViewCard title="Comparing With" view={compareWith} />
        </div>
      )}
    </div>
  );
}

// Trace view through dispute
function TraceDebugger({
  view,
  designId
}: {
  view: View;
  designId: string;
}) {
  const { data: disputesData } = useSWR(
    `/api/ludics/correspondence/disp?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const disputes = disputesData?.disputes || [];
  const matchingDisputes = disputes.filter((d: any) =>
    disputeContainsView(d, view)
  );
  
  return (
    <div className="trace-debugger space-y-4">
      <div className="text-xs font-semibold text-slate-800">
        Trace View in Disputes
      </div>
      
      <div className="text-xs text-slate-600">
        This view appears in {matchingDisputes.length} dispute(s)
      </div>
      
      {matchingDisputes.map((dispute: any, idx: number) => (
        <DisputeTraceCard key={dispute.id} dispute={dispute} view={view} index={idx} />
      ))}
      
      {matchingDisputes.length === 0 && (
        <div className="text-xs text-slate-500 italic text-center py-8">
          This view does not appear in any disputes
        </div>
      )}
    </div>
  );
}

function ViewCard({ title, view }: { title: string; view: View }) {
  return (
    <div className="view-card border rounded p-3 bg-slate-50">
      <div className="text-xs font-semibold text-slate-700 mb-2">{title}</div>
      <div className="text-xs space-y-1">
        <div>Length: {view.sequence.length}</div>
        <div>Player: {view.player}</div>
      </div>
      <pre className="mt-2 text-[10px] bg-white p-2 rounded overflow-x-auto max-h-32">
        {JSON.stringify(view.sequence, null, 2)}
      </pre>
    </div>
  );
}

function LegalityIndicator({ actions }: { actions: Action[] }) {
  // Simplified legality check
  const isLegal = actions.length > 0;
  
  return (
    <div className={`legality-indicator border rounded p-2 text-xs ${
      isLegal
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-rose-50 border-rose-200 text-rose-700'
    }`}>
      <span className="font-bold">{isLegal ? '✓ Legal' : '✗ Illegal'}</span> position
    </div>
  );
}

function DisputeTraceCard({
  dispute,
  view,
  index
}: {
  dispute: any;
  view: View;
  index: number;
}) {
  return (
    <div className="dispute-trace-card border rounded p-3 bg-white">
      <div className="text-xs font-mono font-semibold text-slate-700 mb-2">
        Dispute {index + 1}
      </div>
      <div className="text-[10px] text-slate-600">
        View appears at positions: [computation needed]
      </div>
    </div>
  );
}

// Helper functions
function computeSimilarity(v1: View, v2: View): number {
  const len1 = v1.sequence.length;
  const len2 = v2.sequence.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1;
  
  let matches = 0;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (JSON.stringify(v1.sequence[i]) === JSON.stringify(v2.sequence[i])) {
      matches++;
    }
  }
  
  return matches / maxLen;
}

function disputeContainsView(dispute: any, view: View): boolean {
  // Simplified check
  return true;
}
```

### 4.3.2 Dispute Trace Viewer

**New Component** (`components/ludics/DisputeTraceViewer.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { Dispute } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function DisputeTraceViewer({
  designId
}: {
  designId: string;
}) {
  const [selectedDispute, setSelectedDispute] = React.useState<Dispute | null>(null);
  const [playbackPosition, setPlaybackPosition] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  
  const { data } = useSWR(
    `/api/ludics/correspondence/disp?designId=${designId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const disputes = (data?.disputes || []) as Dispute[];
  
  // Auto-play effect
  React.useEffect(() => {
    if (!isPlaying || !selectedDispute) return;
    
    const interval = setInterval(() => {
      setPlaybackPosition(pos => {
        if (pos >= selectedDispute.length - 1) {
          setIsPlaying(false);
          return pos;
        }
        return pos + 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, selectedDispute]);
  
  return (
    <div className="dispute-trace-viewer border rounded-lg bg-white">
      {/* Header */}
      <div className="viewer-header p-3 border-b bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800">
          Dispute Trace Viewer
        </h3>
      </div>
      
      <div className="viewer-content flex h-96">
        {/* Disputes list */}
        <div className="disputes-sidebar w-64 border-r overflow-y-auto">
          <div className="p-2 border-b bg-slate-50">
            <div className="text-xs font-semibold text-slate-700">
              Disputes ({disputes.length})
            </div>
          </div>
          <div className="space-y-1 p-2">
            {disputes.map((dispute, idx) => (
              <button
                key={dispute.id}
                onClick={() => {
                  setSelectedDispute(dispute);
                  setPlaybackPosition(0);
                  setIsPlaying(false);
                }}
                className={`w-full text-left p-2 rounded text-xs transition ${
                  selectedDispute?.id === dispute.id
                    ? 'bg-violet-100 border border-violet-300 text-violet-800'
                    : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="font-mono font-semibold">Dispute {idx + 1}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {dispute.length} pairs
                </div>
                <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded inline-block ${
                  dispute.status === 'CONVERGED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {dispute.status}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Trace visualization */}
        <div className="flex-1 p-4">
          {selectedDispute ? (
            <div className="trace-content space-y-4">
              {/* Playback controls */}
              <div className="playback-controls flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                
                <button
                  onClick={() => setPlaybackPosition(0)}
                  className="px-2 py-1 text-xs rounded bg-slate-600 text-white hover:bg-slate-700"
                >
                  ⏮ Reset
                </button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={selectedDispute.length - 1}
                    value={playbackPosition}
                    onChange={(e) => setPlaybackPosition(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-600 text-center mt-1">
                    Position {playbackPosition + 1} / {selectedDispute.length}
                  </div>
                </div>
              </div>
              
              {/* Current pair visualization */}
              <DisputePairView
                dispute={selectedDispute}
                position={playbackPosition}
              />
              
              {/* Full trace timeline */}
              <div className="trace-timeline border rounded p-3 bg-slate-50">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Full Trace
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedDispute.pairs?.map((pair: any, idx: number) => (
                    <div
                      key={idx}
                      className={`text-[10px] p-1.5 rounded ${
                        idx === playbackPosition
                          ? 'bg-indigo-100 text-indigo-800 font-semibold'
                          : 'text-slate-600'
                      }`}
                    >
                      {idx + 1}. {pair.posAction?.focus} ⟷ {pair.negAction?.focus}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic text-center py-16">
              Select a dispute to view trace
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DisputePairView({
  dispute,
  position
}: {
  dispute: Dispute;
  position: number;
}) {
  const pair = dispute.pairs?.[position];
  
  if (!pair) {
    return <div className="text-xs text-slate-500">No pair data</div>;
  }
  
  return (
    <div className="dispute-pair border rounded p-4 bg-white">
      <div className="grid grid-cols-2 gap-4">
        {/* Positive action */}
        <div className="pos-action">
          <div className="text-xs font-semibold text-sky-700 mb-2">
            ⊕ Positive Action
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Focus:</span>
              <span className="font-mono text-slate-800">{pair.posAction?.focus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Ramification:</span>
              <span className="font-mono text-slate-800">
                [{pair.posAction?.ramification?.join(', ')}]
              </span>
            </div>
          </div>
        </div>
        
        {/* Negative action */}
        <div className="neg-action">
          <div className="text-xs font-semibold text-rose-700 mb-2">
            ⊖ Negative Action
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Focus:</span>
              <span className="font-mono text-slate-800">{pair.negAction?.focus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Ramification:</span>
              <span className="font-mono text-slate-800">
                [{pair.negAction?.ramification?.join(', ')}]
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.3.3 Chronicle Navigator

**New Component** (`components/ludics/ChronicleNavigator.tsx`):

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import type { Chronicle } from '@/packages/ludics-core/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ChronicleNavigator({
  designId,
  strategyId
}: {
  designId?: string;
  strategyId?: string;
}) {
  const [selectedChronicle, setSelectedChronicle] = React.useState<Chronicle | null>(null);
  const [viewMode, setViewMode] = React.useState<'tree' | 'list' | 'graph'>('tree');
  
  // Fetch chronicles
  const { data: chroniclesData } = useSWR(
    designId
      ? `/api/ludics/chronicles?designId=${designId}`
      : strategyId
      ? `/api/ludics/correspondence/ch?strategyId=${strategyId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const chronicles = (chroniclesData?.chronicles || []) as Chronicle[];
  
  return (
    <div className="chronicle-navigator border rounded-lg bg-white">
      {/* Header */}
      <div className="navigator-header flex items-center justify-between p-3 border-b bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800">
          Chronicle Navigator
        </h3>
        
        <div className="view-mode-selector flex gap-1">
          <ViewModeButton
            active={viewMode === 'tree'}
            onClick={() => setViewMode('tree')}
          >
            🌳 Tree
          </ViewModeButton>
          <ViewModeButton
            active={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </ViewModeButton>
          <ViewModeButton
            active={viewMode === 'graph'}
            onClick={() => setViewMode('graph')}
          >
            📊 Graph
          </ViewModeButton>
        </div>
      </div>
      
      <div className="navigator-content flex h-96">
        {/* Chronicles sidebar */}
        <div className="chronicles-sidebar w-64 border-r overflow-y-auto">
          <div className="p-2 border-b bg-slate-50">
            <div className="text-xs font-semibold text-slate-700">
              Chronicles ({chronicles.length})
            </div>
          </div>
          <div className="space-y-1 p-2">
            {chronicles.map((chronicle, idx) => (
              <button
                key={chronicle.id}
                onClick={() => setSelectedChronicle(chronicle)}
                className={`w-full text-left p-2 rounded text-xs transition ${
                  selectedChronicle?.id === chronicle.id
                    ? 'bg-violet-100 border border-violet-300 text-violet-800'
                    : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-semibold">Chr {idx + 1}</span>
                  {chronicle.isMaximal && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                      MAX
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-600">
                  {chronicle.length} actions
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Main view area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {selectedChronicle ? (
            <>
              {viewMode === 'tree' && (
                <ChronicleTreeView chronicle={selectedChronicle} />
              )}
              {viewMode === 'list' && (
                <ChronicleListView chronicle={selectedChronicle} />
              )}
              {viewMode === 'graph' && (
                <ChronicleGraphView chronicle={selectedChronicle} />
              )}
            </>
          ) : (
            <div className="text-xs text-slate-500 italic text-center py-16">
              Select a chronicle to navigate
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewModeButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[10px] rounded font-medium transition ${
        active
          ? 'bg-violet-600 text-white'
          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function ChronicleTreeView({ chronicle }: { chronicle: Chronicle }) {
  return (
    <div className="chronicle-tree space-y-3">
      <div className="text-xs font-semibold text-slate-800">
        Tree Structure
      </div>
      
      <div className="tree-visualization border rounded p-3 bg-slate-50">
        <div className="space-y-2">
          {chronicle.sequence.map((action: any, idx: number) => (
            <div
              key={idx}
              className="tree-node flex items-center gap-2"
              style={{ marginLeft: `${idx * 12}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <div className="text-xs font-mono text-slate-700">
                {action.focus}
              </div>
              <div className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                action.polarity === 'P'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {action.polarity}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chronicle metadata */}
      <div className="metadata border rounded p-3 bg-white">
        <div className="text-xs font-semibold text-slate-700 mb-2">
          Metadata
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Length:</span>
            <span className="text-slate-800 font-mono">{chronicle.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Maximal:</span>
            <span className="text-slate-800">{chronicle.isMaximal ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Design ID:</span>
            <span className="text-slate-800 font-mono text-[10px]">
              {chronicle.designId?.slice(0, 8)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChronicleListView({ chronicle }: { chronicle: Chronicle }) {
  return (
    <div className="chronicle-list space-y-3">
      <div className="text-xs font-semibold text-slate-800">
        Sequential Actions
      </div>
      
      <div className="actions-list space-y-2">
        {chronicle.sequence.map((action: any, idx: number) => (
          <div key={idx} className="action-item border rounded p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-slate-700">
                Action {idx + 1}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                action.polarity === 'P'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {action.polarity}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Focus:</span>
                <span className="font-mono text-slate-800">{action.focus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ramification:</span>
                <span className="font-mono text-slate-800">
                  [{action.ramification?.join(', ')}]
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChronicleGraphView({ chronicle }: { chronicle: Chronicle }) {
  return (
    <div className="chronicle-graph space-y-3">
      <div className="text-xs font-semibold text-slate-800">
        Graph Representation
      </div>
      
      <div className="graph-container border rounded p-4 bg-slate-50 h-64 flex items-center justify-center">
        <div className="text-xs text-slate-500 italic">
          Graph visualization would render here using D3.js or similar
        </div>
      </div>
      
      {/* Graph statistics */}
      <div className="graph-stats grid grid-cols-3 gap-2">
        <StatBox label="Nodes" value={chronicle.length} />
        <StatBox label="Depth" value={chronicle.length} />
        <StatBox label="Branches" value={1} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-box border rounded p-2 bg-white text-center">
      <div className="text-[10px] text-slate-600">{label}</div>
      <div className="text-lg font-bold text-slate-800">{value}</div>
    </div>
  );
}
```

### 4.3.4 Analysis Dashboard

**New Component** (`components/ludics/AnalysisDashboard.tsx`):

```tsx
'use client';

import * as React from 'react';
import { ViewDebugger } from './ViewDebugger';
import { DisputeTraceViewer } from './DisputeTraceViewer';
import { ChronicleNavigator } from './ChronicleNavigator';

export function AnalysisDashboard({
  designId
}: {
  designId: string;
}) {
  const [activeTool, setActiveTool] = React.useState<
    'view-debugger' | 'dispute-trace' | 'chronicle-nav' | null
  >(null);
  
  return (
    <div className="analysis-dashboard space-y-4">
      {/* Tool selector */}
      <div className="tool-selector grid grid-cols-3 gap-3">
        <ToolCard
          icon="🔍"
          title="View Debugger"
          description="Step through views and analyze positions"
          active={activeTool === 'view-debugger'}
          onClick={() => setActiveTool('view-debugger')}
        />
        <ToolCard
          icon="🎬"
          title="Dispute Trace"
          description="Playback disputes step-by-step"
          active={activeTool === 'dispute-trace'}
          onClick={() => setActiveTool('dispute-trace')}
        />
        <ToolCard
          icon="🧭"
          title="Chronicle Navigator"
          description="Explore chronicles and branches"
          active={activeTool === 'chronicle-nav'}
          onClick={() => setActiveTool('chronicle-nav')}
        />
      </div>
      
      {/* Active tool */}
      <div className="active-tool">
        {activeTool === 'view-debugger' && (
          <ViewDebugger designId={designId} />
        )}
        {activeTool === 'dispute-trace' && (
          <DisputeTraceViewer designId={designId} />
        )}
        {activeTool === 'chronicle-nav' && (
          <ChronicleNavigator designId={designId} />
        )}
        {!activeTool && (
          <div className="empty-state border rounded-lg p-12 text-center bg-slate-50">
            <div className="text-4xl mb-3">🛠</div>
            <div className="text-sm font-semibold text-slate-700 mb-1">
              Select a debugging tool
            </div>
            <div className="text-xs text-slate-600">
              Choose from view debugger, dispute trace, or chronicle navigator
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCard({
  icon,
  title,
  description,
  active,
  onClick
}: {
  icon: string;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`tool-card text-left p-4 rounded-lg border-2 transition ${
        active
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-bold text-slate-800 mb-1">{title}</div>
      <div className="text-xs text-slate-600">{description}</div>
    </button>
  );
}
```

### 4.3.5 Integration into LudicsPanel Analysis Tab

**Extend AnalysisPanel.tsx**:

```typescript
// Add to tab list
const tabs = [
  'overview',
  'views',
  'chronicles',
  'strategy',
  'correspondence',
  'debugger' // NEW TAB
];

// Add to content rendering
{activeSection === 'debugger' && (
  <AnalysisDashboard designId={designId} />
)}
```

### 4.3.6 Part 3 Deliverables

✅ ViewDebugger with 3 modes (step, compare, trace)
✅ Step-by-step view analysis with action details
✅ View comparison with similarity scoring
✅ DisputeTraceViewer with playback controls
✅ Animated dispute playback (1s per step)
✅ Timeline visualization with current position highlighting
✅ ChronicleNavigator with 3 view modes (tree, list, graph)
✅ Tree structure visualization
✅ Sequential action list view
✅ Graph representation placeholder
✅ AnalysisDashboard as tool launcher
✅ Integration into LudicsPanel Analysis tab

### 4.3.7 Part 3 Success Metrics

- View debugger allows step-by-step navigation through all actions
- Similarity computation identifies related views accurately
- Dispute playback runs smoothly at 1 action/second
- Playback controls (play/pause/reset/scrub) responsive
- Chronicle navigator displays tree structure clearly
- All 3 debugging tools accessible from dashboard
- Tools load in <1s when selected
- UI remains responsive during playback

---

## PHASE 4 Summary

Phase 4 implemented comprehensive UI integration across three parts:

**Part 1: LudicsPanel Integration**
- New "Analysis" tab with 5 sections
- AnalysisOverview with stats + quick runner
- ViewsExplorer and ChroniclesExplorer
- Integrated StrategyInspector and CorrespondenceViewer

**Part 2: LudicsForest Enhancements**
- DesignAnalysisBadges on all designs
- BatchAnalysisControls for bulk operations
- AnalysisFilters with 3 filter types
- StrategyComparison and AnalysisSummaryTable
- New "Analysis" view mode with comparison

**Part 3: Debugging & Analysis Tools**
- ViewDebugger with step/compare/trace modes
- DisputeTraceViewer with animated playback
- ChronicleNavigator with tree/list/graph views
- AnalysisDashboard as unified tool launcher

**Key Achievements**:
- Complete visibility into Phase 1-3 backend abstractions
- Batch analysis for forest view (5 designs at a time)
- Real-time filtering and comparison
- Interactive debugging tools with playback
- Professional UI with consistent design language

---

