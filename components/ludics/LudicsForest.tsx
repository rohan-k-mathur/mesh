// components/ludics/LudicsForest.tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { DesignTreeView } from './DesignTreeView';
import LociTreeWithControls from './LociTreeWithControls';
import type { StepResult } from '@/packages/ludics-core/types';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

type ViewMode = 'forest' | 'split-screen' | 'merged';

export function LudicsForest({ 
  deliberationId 
}: { 
  deliberationId: string 
}) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('forest');
  const [selectedDesignId, setSelectedDesignId] = React.useState<string | null>(null);
  
  // Fetch all designs (not merged!)
  const { data: designsData, isLoading: designsLoading } = useSWR(
    `/api/ludics/designs?deliberationId=${encodeURIComponent(deliberationId)}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const designs = React.useMemo(() => {
    if (!designsData) return [];
    if (Array.isArray(designsData)) return designsData;
    if (Array.isArray(designsData.designs)) return designsData.designs;
    if (Array.isArray(designsData.data)) return designsData.data;
    return [];
  }, [designsData]);
  
  // Fetch interaction trace
  const { data: traceData, isLoading: traceLoading } = useSWR<{ ok: boolean; trace?: StepResult }>(
    deliberationId 
      ? `/api/ludics/step?deliberationId=${encodeURIComponent(deliberationId)}&phase=neutral&maxPairs=1024`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const trace = traceData?.trace || null;
  
  const proponentDesign = designs.find((d: any) => d.participantId === 'Proponent');
  const opponentDesign = designs.find((d: any) => d.participantId === 'Opponent');
  
  return (
    <div className="ludics-forest space-y-3">
      {/* Header: View mode selector */}
      <div className="forest-header flex items-center justify-between rounded-lg border bg-white/70 backdrop-blur p-3">
        <div className="view-mode-toggle flex items-center gap-2">
          <button 
            onClick={() => setViewMode('forest')}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              viewMode === 'forest' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Forest: Show all designs independently"
          >
            🌲 Forest
          </button>
          <button 
            onClick={() => setViewMode('split-screen')}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              viewMode === 'split-screen' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Split: Proponent vs Opponent side-by-side"
          >
            ⚔️ Split
          </button>
          <button 
            onClick={() => setViewMode('merged')}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              viewMode === 'merged' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Merged: Legacy unified tree view"
          >
            🌳 Merged (Legacy)
          </button>
        </div>
        
        <div className="forest-stats flex items-center gap-3 text-xs text-slate-600">
          <span className="px-2 py-1 bg-slate-100 rounded">
            <strong>{designs.length}</strong> designs
          </span>
          {trace && (
            <span className="px-2 py-1 bg-slate-100 rounded">
              <strong>{trace.pairs?.length || 0}</strong> interaction steps
            </span>
          )}
          {trace && (
            <span className={`px-2 py-1 rounded font-medium ${
              trace.status === 'CONVERGENT' ? 'bg-emerald-100 text-emerald-700' :
              trace.status === 'DIVERGENT' ? 'bg-rose-100 text-rose-700' :
              trace.status === 'STUCK' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {trace.status}
            </span>
          )}
        </div>
      </div>
      
      {/* Loading state */}
      {designsLoading && (
        <div className="p-4 text-sm text-slate-500 text-center">
          Loading designs...
        </div>
      )}
      
      {/* Forest view: Show all designs independently */}
      {viewMode === 'forest' && !designsLoading && (
        <div className="forest-grid grid gap-4 md:grid-cols-2">
          {designs.length === 0 ? (
            <div className="col-span-2 p-4 text-sm text-slate-500 text-center border rounded-lg bg-white/50">
              No designs found for this deliberation
            </div>
          ) : (
            designs.map((design: any) => (
              <DesignTreeView
                key={design.id}
                design={design}
                deliberationId={deliberationId}
                isSelected={selectedDesignId === design.id}
                onSelect={() => setSelectedDesignId(design.id)}
                trace={trace}
              />
            ))
          )}
        </div>
      )}
      
      {/* Split-screen: P vs O side-by-side */}
      {viewMode === 'split-screen' && !designsLoading && (
        <div className="split-screen-view grid md:grid-cols-2 gap-4">
          <DesignTreeView
            design={proponentDesign}
            deliberationId={deliberationId}
            trace={trace}
            highlight="positive"
          />
          
          <DesignTreeView
            design={opponentDesign}
            deliberationId={deliberationId}
            trace={trace}
            highlight="negative"
          />
        </div>
      )}
      
      {/* Merged view: Current LociTreeWithControls (backward compat) */}
      {viewMode === 'merged' && !designsLoading && proponentDesign && opponentDesign && (
        <div className="merged-view">
          <div className="mb-2 p-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded">
            <strong>Legacy Mode:</strong> This shows a merged tree where both designs are combined. 
            Use Forest or Split view to see designs as independent strategies (more accurate to ludics theory).
          </div>
          <LociTreeWithControls
            dialogueId={deliberationId}
            posDesignId={proponentDesign.id}
            negDesignId={opponentDesign.id}
          />
        </div>
      )}
    </div>
  );
}
