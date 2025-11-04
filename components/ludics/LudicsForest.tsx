// components/ludics/LudicsForest.tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { DesignTreeView } from './DesignTreeView';
import LociTreeWithControls from './LociTreeWithControls';
import type { StepResult } from '@/packages/ludics-core/types';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

type ViewMode = 'forest' | 'split-screen' | 'merged';
type ScopingStrategy = 'legacy' | 'issue' | 'actor-pair' | 'argument';

export function LudicsForest({ 
  deliberationId 
}: { 
  deliberationId: string 
}) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('forest');
  const [selectedDesignId, setSelectedDesignId] = React.useState<string | null>(null);
  const [scopingStrategy, setScopingStrategy] = React.useState<ScopingStrategy>('issue');
  const [isRecompiling, setIsRecompiling] = React.useState(false);
  
  // Fetch all designs (not merged!)
  const { data: designsData, isLoading: designsLoading, mutate: refreshDesigns } = useSWR(
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
  
  const grouped = designsData?.grouped || {};
  const scopes = designsData?.scopes || [];
  const scopeMetadata = designsData?.scopeMetadata || {};
  
  // Recompile handler
  const handleRecompile = async () => {
    setIsRecompiling(true);
    try {
      const res = await fetch('/api/ludics/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliberationId,
          scopingStrategy,
          forceRecompile: true,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Recompile failed:', error);
        alert(`Recompile failed: ${error.error || 'Unknown error'}`);
        return;
      }
      
      const result = await res.json();
      console.log('Recompiled:', result);
      
      // Refresh designs
      await refreshDesigns();
    } catch (err) {
      console.error('Recompile error:', err);
      alert('Recompile failed. Check console for details.');
    } finally {
      setIsRecompiling(false);
    }
  };
  
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
      {/* Header: View mode selector + Scoping controls */}
      <div className="forest-header flex flex-col gap-3 rounded-lg border bg-white/70 backdrop-blur p-3">
        {/* Row 1: View mode toggle */}
        <div className="flex items-center justify-between">
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
            {scopes.length > 1 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                <strong>{scopes.length}</strong> scopes
              </span>
            )}
            {trace && (
              <span className="px-2 py-1 bg-slate-100 rounded">
                <strong>{trace.pairs?.length || 0}</strong> steps
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
        
        {/* Row 2: Scoping controls */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <label className="text-xs font-medium text-slate-700">
            Scoping Strategy:
          </label>
          <select
            value={scopingStrategy}
            onChange={(e) => setScopingStrategy(e.target.value as ScopingStrategy)}
            className="px-2 py-1 text-sm border rounded-md bg-white"
            title="How to group designs: legacy (all moves), issue (per argument root), actor-pair (per pair of actors), argument (per target)"
          >
            <option value="legacy">Legacy (Monolithic)</option>
            <option value="issue">Issue-Based (Recommended)</option>
            <option value="actor-pair">Actor-Pair</option>
            <option value="argument">Argument-Thread (Fine-Grained)</option>
          </select>
          
          <button
            onClick={handleRecompile}
            disabled={isRecompiling}
            className="px-3 py-1 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isRecompiling ? '⏳ Recompiling...' : '🔄 Recompile'}
          </button>
          
          <span className="text-xs text-slate-500 ml-auto">
            {scopes.length === 0 ? (
              'No designs yet'
            ) : scopes.length === 1 && scopes[0] === 'legacy' ? (
              'Legacy mode: 1 global scope'
            ) : (
              `${scopes.length} independent scopes`
            )}
          </span>
        </div>
      </div>
      
      {/* Loading state */}
      {designsLoading && (
        <div className="p-4 text-sm text-slate-500 text-center">
          Loading designs...
        </div>
      )}
      
      {/* Forest view: Show all designs grouped by scope */}
      {viewMode === 'forest' && !designsLoading && (
        <div className="forest-scopes space-y-4">
          {designs.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center border rounded-lg bg-white/50">
              No designs found for this deliberation.
              {scopes.length === 0 && (
                <div className="mt-2 text-xs">
                  Try clicking <strong>Recompile</strong> to generate designs.
                </div>
              )}
            </div>
          ) : scopes.length === 0 ? (
            <div className="forest-grid grid gap-4 md:grid-cols-2">
              {designs.map((design: any) => (
                <DesignTreeView
                  key={design.id}
                  design={design}
                  deliberationId={deliberationId}
                  isSelected={selectedDesignId === design.id}
                  onSelect={() => setSelectedDesignId(design.id)}
                  trace={trace}
                />
              ))}
            </div>
          ) : (
            // Grouped by scope
            scopes.map((scopeKey: string) => {
              const scopeDesigns = grouped[scopeKey] || [];
              const metadata = scopeMetadata[scopeKey];
              const label = metadata?.label || scopeKey;
              
              return (
                <div key={scopeKey} className="scope-card border rounded-lg bg-white/50 p-4">
                  {/* Scope header */}
                  <div className="scope-header mb-3 pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {label}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        {metadata?.moveCount && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded">
                            {metadata.moveCount} moves
                          </span>
                        )}
                        {metadata?.actors?.all && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded">
                            {metadata.actors.all.length} actors
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {metadata?.actors && (
                      <div className="mt-1 text-xs text-slate-600">
                        <span className="text-green-700 font-medium">P:</span> {metadata.actors.proponent.length} · 
                        <span className="text-red-700 font-medium ml-2">O:</span> {metadata.actors.opponent.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Designs in this scope */}
                  <div className="forest-grid grid gap-4 md:grid-cols-2">
                    {scopeDesigns.map((design: any) => (
                      <DesignTreeView
                        key={design.id}
                        design={design}
                        deliberationId={deliberationId}
                        isSelected={selectedDesignId === design.id}
                        onSelect={() => setSelectedDesignId(design.id)}
                        trace={trace}
                      />
                    ))}
                  </div>
                </div>
              );
            })
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
