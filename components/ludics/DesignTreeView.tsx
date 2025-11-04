// components/ludics/DesignTreeView.tsx
'use client';

import * as React from 'react';
import { LociTree } from '@/packages/ludics-react/LociTree';
import { buildTreeFromDesign } from './buildTreeFromDesign';
import type { StepResult } from '@/packages/ludics-core/types';

type Act = {
  id: string;
  kind: string;
  polarity?: string | null;
  expression?: string;
  locus?: { path?: string | null };
  ramification?: string[];
  isAdditive?: boolean;
};

type Design = {
  id: string;
  participantId: string;
  semantics?: string;
  version?: number;
  acts: Act[];
  extJson?: any;
};

export function DesignTreeView({
  design,
  deliberationId,
  isSelected,
  onSelect,
  trace,
  highlight,
}: {
  design: Design | undefined | null;
  deliberationId: string;
  isSelected?: boolean;
  onSelect?: () => void;
  trace?: StepResult | null;
  highlight?: 'positive' | 'negative';
}) {
  // Build tree from SINGLE design (not merged)
  const tree = React.useMemo(() => {
    if (!design) return null;
    return buildTreeFromDesign(design);
  }, [design]);
  
  // Extract acts used by THIS design in trace
  const actIdsUsedInTrace = React.useMemo(() => {
    if (!trace?.pairs || !design) return new Set<string>();
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
  
  // Build step index map for this design's acts
  const stepIndexByActId = React.useMemo(() => {
    if (!trace?.pairs || !design) return {};
    const map: Record<string, number> = {};
    
    trace.pairs.forEach((pair, i) => {
      if (design.participantId === 'Proponent' && pair.posActId) {
        map[pair.posActId] = i + 1;
      }
      if (design.participantId === 'Opponent' && pair.negActId) {
        map[pair.negActId] = i + 1;
      }
    });
    
    return map;
  }, [trace, design]);
  
  if (!design) {
    return (
      <div className="design-tree-view empty">
        <div className="p-4 text-sm text-slate-500">
          No design available
        </div>
      </div>
    );
  }
  
  const isProponent = design.participantId === 'Proponent';
  
  return (
    <div 
      className={`design-tree-view ${isSelected ? 'selected' : ''} ${highlight || ''}`}
      onClick={onSelect}
    >
      {/* Design header with ludics metadata */}
      <div className={`design-header rounded-t-lg border-b-2 p-3 ${
        isProponent 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' 
          : 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200'
      }`}>
        <div className="design-title flex items-center gap-2 mb-2">
          <span className={`polarity-badge text-lg font-bold px-2 py-1 rounded ${
            isProponent 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-rose-100 text-rose-700'
          }`}>
            {isProponent ? '+' : '−'}
          </span>
          <h3 className="text-base font-bold text-slate-800">{design.participantId}</h3>
          <code className="design-id text-xs text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded">
            {design.id.slice(0,8)}
          </code>
        </div>
        
        <div className="design-metadata text-xs text-slate-600 flex flex-wrap gap-3 mb-1">
          <span>Semantics: <strong>{design.semantics || 'CLASSICAL'}</strong></span>
          <span>Version: <strong>{design.version || 1}</strong></span>
          <span>Acts: <strong>{design.acts?.length || 0}</strong></span>
        </div>
        
        <div className="design-description text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-700">Design:</strong> Independent strategy (behavior) for {design.participantId}.
          Interacts with counter-designs at shared loci via normalization.
        </div>
      </div>
      
      {/* Tree: ONLY this design's acts */}
      <div className={`design-tree-container rounded-b-lg border bg-white/70 backdrop-blur p-2 ${
        isProponent ? 'border-blue-200' : 'border-rose-200'
      }`}>
        {tree && design.acts && design.acts.length > 0 ? (
          <LociTree
            root={tree}
            showExpressions
            stepIndexByActId={stepIndexByActId}
            defaultCollapsedDepth={2}
            enableKeyboardNav={false}
            autoScrollOnFocus={false}
          />
        ) : (
          <div className="empty-design p-4 text-sm text-slate-500 text-center">
            No acts in this design yet
          </div>
        )}
      </div>
    </div>
  );
}
