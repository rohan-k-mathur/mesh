# Ludics Forest Architecture: Multi-Design Deliberation Viewer

**Date:** November 4, 2025  
**Problem:** LociTree shows merged view (single tree), but ludics has independent designs (forest)

---

## The Mismatch

### Current Architecture
```
LudicsPanel
    ↓
LociTreeWithControls
    ↓
mergeDesignsToTree([proponentDesign, opponentDesign])
    ↓
LociTree (single unified tree)
    ↓
Each locus shows: [P acts | locus | O acts]
```

**Issue:** Loses design independence! Proponent/Opponent are **separate strategies** that interact, not a single merged structure.

### Ludics Theory
```
Deliberation
    ├─ Design₁ (Proponent)  — independent tree of loci + acts
    ├─ Design₂ (Opponent)   — independent tree of loci + acts
    ├─ Design₃ (Mediator?)  — possible
    └─ Trace (Interaction)  — how they meet at shared loci
```

**Key Insight:** Each design is a **behavior** (strategy, plan). They exist independently until interaction.

---

## Solution: LudicsForest Component

### New Component Hierarchy

```tsx
LudicsPanel
    ↓
LudicsForest (NEW: multi-design orchestrator)
    ↓
    ├─ DesignTreeView (Proponent)   — shows Design₁ structure
    ├─ DesignTreeView (Opponent)    — shows Design₂ structure
    └─ InteractionTraceView          — shows how they interact
```

### LudicsForest Component

```tsx
// components/ludics/LudicsForest.tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { DesignTreeView } from './DesignTreeView';
import { InteractionTraceView } from './InteractionTraceView';
import { CompositionModeToggle } from '../engine/CompositionModeToggle';

type ViewMode = 'forest' | 'merged' | 'trace' | 'split-screen';

export function LudicsForest({ 
  deliberationId 
}: { 
  deliberationId: string 
}) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('forest');
  const [selectedDesignId, setSelectedDesignId] = React.useState<string | null>(null);
  
  // Fetch all designs (not merged!)
  const { data: designsData } = useSWR(
    `/api/ludics/designs?deliberationId=${deliberationId}`,
    fetcher
  );
  
  const designs = designsData?.designs ?? [];
  
  // Fetch interaction trace
  const { data: traceData } = useSWR(
    `/api/ludics/step?deliberationId=${deliberationId}`,
    fetcher
  );
  
  return (
    <div className="ludics-forest">
      {/* Header: View mode selector */}
      <div className="forest-header">
        <div className="view-mode-toggle">
          <button 
            onClick={() => setViewMode('forest')}
            className={viewMode === 'forest' ? 'active' : ''}
          >
            🌲 Forest (All Designs)
          </button>
          <button 
            onClick={() => setViewMode('split-screen')}
            className={viewMode === 'split-screen' ? 'active' : ''}
          >
            ⚔️ Split (P vs O)
          </button>
          <button 
            onClick={() => setViewMode('trace')}
            className={viewMode === 'trace' ? 'active' : ''}
          >
            ⇄ Interaction Trace
          </button>
          <button 
            onClick={() => setViewMode('merged')}
            className={viewMode === 'merged' ? 'active' : ''}
          >
            🌳 Merged (Legacy)
          </button>
        </div>
        
        <div className="forest-stats">
          <span>{designs.length} designs</span>
          <span>{traceData?.pairs?.length || 0} interaction steps</span>
        </div>
      </div>
      
      {/* Forest view: Show all designs independently */}
      {viewMode === 'forest' && (
        <div className="forest-grid">
          {designs.map(design => (
            <DesignTreeView
              key={design.id}
              design={design}
              deliberationId={deliberationId}
              isSelected={selectedDesignId === design.id}
              onSelect={() => setSelectedDesignId(design.id)}
              trace={traceData}
            />
          ))}
        </div>
      )}
      
      {/* Split-screen: P vs O side-by-side */}
      {viewMode === 'split-screen' && (
        <div className="split-screen-view">
          <DesignTreeView
            design={designs.find(d => d.participantId === 'Proponent')}
            deliberationId={deliberationId}
            trace={traceData}
            highlight="positive"
          />
          <div className="vs-divider">⚔️ vs</div>
          <DesignTreeView
            design={designs.find(d => d.participantId === 'Opponent')}
            deliberationId={deliberationId}
            trace={traceData}
            highlight="negative"
          />
        </div>
      )}
      
      {/* Trace view: Show interaction chronologically */}
      {viewMode === 'trace' && (
        <InteractionTraceView
          designs={designs}
          trace={traceData}
          deliberationId={deliberationId}
        />
      )}
      
      {/* Merged view: Current LociTreeWithControls (backward compat) */}
      {viewMode === 'merged' && (
        <LociTreeWithControls
          dialogueId={deliberationId}
          posDesignId={designs.find(d => d.participantId === 'Proponent')?.id}
          negDesignId={designs.find(d => d.participantId === 'Opponent')?.id}
        />
      )}
    </div>
  );
}
```

---

## DesignTreeView: Single Design Strategy

```tsx
// components/ludics/DesignTreeView.tsx
'use client';

import * as React from 'react';
import { buildTreeFromDesign } from './buildTreeFromDesign';
import { LociTree } from '@/packages/ludics-react/LociTree';

type Design = {
  id: string;
  participantId: string;
  semantics: string;
  version: number;
  acts: Act[];
  extJson: any;
};

export function DesignTreeView({
  design,
  deliberationId,
  isSelected,
  onSelect,
  trace,
  highlight,
}: {
  design: Design;
  deliberationId: string;
  isSelected?: boolean;
  onSelect?: () => void;
  trace?: StepResult;
  highlight?: 'positive' | 'negative';
}) {
  // Build tree from SINGLE design (not merged)
  const tree = React.useMemo(() => {
    if (!design) return null;
    return buildTreeFromDesign(design);
  }, [design]);
  
  // Extract acts used by THIS design in trace
  const actIdsUsedInTrace = React.useMemo(() => {
    if (!trace?.pairs) return new Set();
    const ids = new Set<string>();
    trace.pairs.forEach(pair => {
      if (design.participantId === 'Proponent' && pair.posActId) {
        ids.add(pair.posActId);
      }
      if (design.participantId === 'Opponent' && pair.negActId) {
        ids.add(pair.negActId);
      }
    });
    return ids;
  }, [trace, design]);
  
  const stepIndexByActId = React.useMemo(() => {
    if (!trace?.pairs) return {};
    const map: Record<string, number> = {};
    trace.pairs.forEach((pair, i) => {
      if (pair.posActId) map[pair.posActId] = i + 1;
      if (pair.negActId) map[pair.negActId] = i + 1;
    });
    return map;
  }, [trace]);
  
  return (
    <div 
      className={`design-tree-view ${isSelected ? 'selected' : ''} ${highlight || ''}`}
      onClick={onSelect}
    >
      {/* Design header */}
      <div className="design-header">
        <div className="design-title">
          <span className={`polarity-badge ${
            design.participantId === 'Proponent' ? 'positive' : 'negative'
          }`}>
            {design.participantId === 'Proponent' ? '+' : '−'}
          </span>
          <h3>{design.participantId}</h3>
          <code className="design-id">{design.id.slice(0,8)}</code>
        </div>
        
        <div className="design-metadata">
          <span>Semantics: {design.semantics || 'CLASSICAL'}</span>
          <span>Version: {design.version || 1}</span>
          <span>Acts: {design.acts?.length || 0}</span>
        </div>
        
        <div className="design-description">
          <strong>Strategy:</strong> Independent behavior (design) for {design.participantId}.
          Interacts with counter-designs at shared loci.
        </div>
      </div>
      
      {/* Tree: ONLY this design's acts */}
      <div className="design-tree-container">
        {tree ? (
          <LociTree
            root={tree}
            showExpressions
            stepIndexByActId={stepIndexByActId}
            highlightActIds={actIdsUsedInTrace}
            defaultCollapsedDepth={2}
          />
        ) : (
          <div className="empty-design">No acts in this design yet</div>
        )}
      </div>
    </div>
  );
}
```

---

## buildTreeFromDesign: Single-Design Tree Builder

```tsx
// components/ludics/buildTreeFromDesign.ts
import type { LociNode } from '@/packages/ludics-react/LociTree';

type Act = {
  id: string;
  kind: 'PROPER' | 'DAIMON';
  polarity?: string;
  expression?: string;
  locus?: { path?: string };
  ramification?: string[];
  isAdditive?: boolean;
};

type Design = {
  id: string;
  participantId: string;
  acts: Act[];
};

/**
 * Build tree from SINGLE design (not merged)
 * Each design is an independent strategy
 */
export function buildTreeFromDesign(design: Design): LociNode {
  const byPath = new Map<string, LociNode>();
  
  const ensure = (path: string): LociNode => {
    if (!byPath.has(path)) {
      byPath.set(path, { id: path, path, acts: [], children: [] });
    }
    return byPath.get(path)!;
  };
  
  // Add acts to their loci
  for (const act of design.acts || []) {
    const path = act.locus?.path ?? '0';
    const node = ensure(path);
    
    const isDaimon = (act.kind ?? '').toUpperCase() === 'DAIMON';
    
    node.acts.push({
      id: act.id,
      polarity: isDaimon ? null : (design.participantId === 'Proponent' ? 'P' : 'O'),
      expression: act.expression,
      isAdditive: act.isAdditive || false,
    });
    
    // Ensure ancestors exist
    const parts = path.split('.');
    for (let i = 1; i < parts.length; i++) {
      ensure(parts.slice(0, i).join('.'));
    }
  }
  
  // Stitch parent-child relationships
  const dict = Object.fromEntries(Array.from(byPath.entries()));
  for (const node of byPath.values()) {
    const parent = node.path.includes('.') 
      ? node.path.split('.').slice(0, -1).join('.')
      : null;
    if (parent && dict[parent]) {
      dict[parent].children.push(node);
    }
  }
  
  return dict['0'] || { id: '0', path: '0', acts: [], children: [] };
}
```

---

## InteractionTraceView: Chronological Handshake View

```tsx
// components/ludics/InteractionTraceView.tsx
'use client';

import * as React from 'react';

type TracePair = {
  posActId?: string;
  negActId?: string;
  locusPath: string;
  ts: number;
};

export function InteractionTraceView({
  designs,
  trace,
  deliberationId,
}: {
  designs: Design[];
  trace: StepResult;
  deliberationId: string;
}) {
  // Build actId → act map
  const actMap = React.useMemo(() => {
    const map = new Map();
    designs.forEach(design => {
      design.acts?.forEach(act => map.set(act.id, act));
    });
    return map;
  }, [designs]);
  
  return (
    <div className="interaction-trace-view">
      <div className="trace-header">
        <h3>Interaction Trace: ⟨Proponent | Opponent⟩</h3>
        <div className="trace-status">
          <span className={`status-badge ${trace.status.toLowerCase()}`}>
            {trace.status}
          </span>
          <span className="step-count">{trace.pairs?.length || 0} steps</span>
        </div>
      </div>
      
      <div className="trace-explanation">
        <p>
          <strong>Normalization:</strong> Running both designs against each other at shared loci.
          Each step is a "handshake" where both sides exchange actions.
        </p>
      </div>
      
      {/* Chronological trace steps */}
      <div className="trace-steps">
        {trace.pairs?.map((pair, i) => {
          const posAct = pair.posActId ? actMap.get(pair.posActId) : null;
          const negAct = pair.negActId ? actMap.get(pair.negActId) : null;
          
          const isDecisive = trace.decisiveIndices?.includes(i);
          
          return (
            <div 
              key={i} 
              className={`trace-step ${isDecisive ? 'decisive' : ''}`}
            >
              <div className="step-number">
                {i + 1}
                {isDecisive && <span className="decisive-marker">⭐</span>}
              </div>
              
              <div className="step-content">
                {/* Locus address */}
                <div className="locus-address">
                  <code>ξ = {pair.locusPath}</code>
                </div>
                
                {/* Handshake: P ⇄ O */}
                <div className="handshake">
                  <div className="act-side positive">
                    {posAct ? (
                      <div className="act-chip">
                        <span className="polarity">+</span>
                        <span className="expression">{posAct.expression || 'act'}</span>
                      </div>
                    ) : (
                      <div className="no-act">—</div>
                    )}
                  </div>
                  
                  <div className="handshake-icon">⇄</div>
                  
                  <div className="act-side negative">
                    {negAct ? (
                      <div className="act-chip">
                        <span className="polarity">−</span>
                        <span className="expression">{negAct.expression || 'act'}</span>
                      </div>
                    ) : (
                      <div className="no-act">—</div>
                    )}
                  </div>
                </div>
                
                {/* Timestamp */}
                <div className="step-timestamp">
                  {new Date(pair.ts).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Normalization result */}
      {trace.status === 'CONVERGENT' && (
        <div className="trace-result convergent">
          ✓ Convergent: Interaction normalized successfully
          {trace.endedAtDaimonForParticipantId && (
            <span>
              {' '}(♦ {trace.endedAtDaimonForParticipantId} reached terminal)
            </span>
          )}
        </div>
      )}
      
      {trace.status === 'DIVERGENT' && (
        <div className="trace-result divergent">
          ✗ Divergent: Designs are not orthogonal (incompatible)
        </div>
      )}
      
      {trace.status === 'STUCK' && (
        <div className="trace-result stuck">
          ⚠ Stuck: No valid continuation found
          {trace.reason && <span> (reason: {trace.reason})</span>}
        </div>
      )}
    </div>
  );
}
```

---

## Visual Comparison

### Current (Merged Tree)
```
        Locus 0
    [P₁] | ξ=0 | [O₁]
           ↓
        Locus 0.1
    [P₂] | ξ=0.1 | [O₂, O₃]
```
**Problem:** Looks like P and O acts are at the "same place" — they're not!

### New (Forest View)
```
Design₁ (Proponent +)        Design₂ (Opponent −)
     Locus 0                      Locus 0
     [P₁] ξ=0                     [O₁] ξ=0
        ↓                            ↓
     Locus 0.1                   Locus 0.1
     [P₂] ξ=0.1                  [O₂, O₃] ξ=0.1
```
**Correct:** Each design is independent. They interact at shared loci via trace.

---

## Usage in LudicsPanel

```tsx
// components/deepdive/LudicsPanel.tsx

export default function LudicsPanel({
  deliberationId,
  proDesignId,
  oppDesignId,
}: {
  deliberationId: string;
  proDesignId: string;
  oppDesignId: string;
}) {
  const [viewStyle, setViewStyle] = React.useState<'forest' | 'legacy'>('forest');
  
  return (
    <div className="ludics-panel">
      <div className="panel-header">
        <h2>Ludics: Formal Dialogue Structure</h2>
        <button onClick={() => setViewStyle(viewStyle === 'forest' ? 'legacy' : 'forest')}>
          {viewStyle === 'forest' ? 'Switch to Legacy (Merged)' : 'Switch to Forest (Multi-Design)'}
        </button>
      </div>
      
      {viewStyle === 'forest' ? (
        <LudicsForest deliberationId={deliberationId} />
      ) : (
        <LociTreeWithControls
          dialogueId={deliberationId}
          posDesignId={proDesignId}
          negDesignId={oppDesignId}
        />
      )}
    </div>
  );
}
```

---

## Benefits

### Architectural
- ✅ **Accurate to ludics theory:** Each design is independent
- ✅ **Scalable:** Can show 3+ designs (mediators, observers, etc.)
- ✅ **Clear separation:** Design structure vs interaction trace
- ✅ **Composable:** Can switch between views (forest, split, trace, merged)

### User Experience
- ✅ **Clearer mental model:** "I have a strategy (design), you have a strategy, let's interact"
- ✅ **Better debugging:** See which design is causing stuck/divergent
- ✅ **Trace visibility:** Understand interaction chronologically
- ✅ **Multiple participants:** Not limited to P vs O binary

### Technical
- ✅ **Single-design operations:** Copy, instantiate, close work on one design at a time
- ✅ **Chronicle per design:** Each strategy has its own history
- ✅ **Independent evolution:** Can edit Proponent design without touching Opponent
- ✅ **Testability:** Each design can be tested with different counter-designs

---

## Implementation Plan

### Phase 1: Core Forest Component (4-6 hours)
1. Create `LudicsForest.tsx` with view mode toggle
2. Create `DesignTreeView.tsx` for single-design display
3. Create `buildTreeFromDesign.ts` helper
4. Wire up to `LudicsPanel` with toggle

### Phase 2: Interaction Trace View (2-3 hours)
5. Create `InteractionTraceView.tsx`
6. Show chronological handshake steps
7. Highlight decisive steps
8. Show convergence/divergence result

### Phase 3: Polish & Accuracy (2-3 hours)
9. Add design headers with ludics terminology
10. Add polarity badges (+ for P, − for O)
11. Add orthogonality indicator (⟂)
12. Add tooltips explaining forest vs tree

### Phase 4: Split-Screen Mode (1-2 hours)
13. Side-by-side P vs O view
14. Synchronized scrolling
15. Highlight corresponding loci

**Total: ~2 days for complete forest architecture**

---

## Migration Strategy

**Backward Compatibility:**
- Keep `LociTreeWithControls` as "merged view" (legacy)
- Add toggle in `LudicsPanel`: "Forest" vs "Merged"
- Default to forest for new users, preserve merged for existing workflows

**Gradual Rollout:**
1. Week 1: Forest view (read-only, no controls)
2. Week 2: Add controls to individual designs
3. Week 3: Trace view with handshake visualization
4. Week 4: Deprecate merged view, forest becomes default

---

## Success Metrics

**Accuracy:**
- ✅ Each design shown as independent strategy
- ✅ Interaction shown as separate trace (not merged structure)
- ✅ Multiple designs supported (not hardcoded P vs O)

**Usability:**
- ✅ Users understand "I have a strategy, opponent has a strategy"
- ✅ Users can see their design evolve independently
- ✅ Users can debug stuck interactions by examining each design

**Expressiveness:**
- ✅ Forest metaphor matches ludics theory (collection of designs)
- ✅ Interaction trace shows dynamics (not just static structure)
- ✅ Chronicle view shows history of each strategy
