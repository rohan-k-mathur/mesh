'use client';
import * as React from 'react';
import { CompositionModeToggle } from '../engine/CompositionModeToggle';
import LocusControls from './LocusControls';

// Package LociTree (client). It can render via `dialogueId` (fetches internally)
// or via a precomputed `root` (same shape you use in the panel).
import { LociTree } from 'packages/ludics-react/LociTree';
import useSWR from 'swr';
const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());
// If you already have this util exported in your pkg, keep it. Otherwise,
// comment this import and continue using the dialogueId path.
import { mergeDesignsToTree } from '@/packages/ludics-react/mergeDesignsToTree'; 

export default function LociTreeWithControls({
  dialogueId, posDesignId, negDesignId,
  defaultMode = 'assoc',
}: {
  dialogueId: string;
  posDesignId: string;
  negDesignId: string;
  defaultMode?: 'assoc'|'partial'|'spiritual';
}) {
  const [selected, setSelected] = React.useState<string>('0');
  const [children, setChildren] = React.useState<string[]>([]);
  const [mode, setMode]         = React.useState<'assoc'|'partial'|'spiritual'>(defaultMode);
  const [version, setVersion]   = React.useState(0); // bump to force refresh

  // Listen for loci updates
  React.useEffect(() => {
    const h = (e:any) => { if (e?.detail?.dialogueId === dialogueId) setVersion(v => v + 1); };
    window.addEventListener('mesh:loci-updated', h as any);
    return () => window.removeEventListener('mesh:loci-updated', h as any);
  }, [dialogueId]);

  // Provide a way for LociTree to report children of selected base

     // Designs -> root (match the panel)
     const { data: designsResp } = useSWR(
       () => dialogueId ? `/api/ludics/designs?deliberationId=${dialogueId}` : null,
       fetcher,
       { keepPreviousData: true, revalidateOnFocus: false }
     );
     const designsArray = React.useMemo(() => {
       // robust to {designs:[...]}, {data:[...]}, or bare array
       if (Array.isArray(designsResp)) return designsResp;
       if (Array.isArray(designsResp?.designs)) return designsResp.designs;
       if (Array.isArray(designsResp?.data)) return designsResp.data;
       return [];
     }, [designsResp]);
     const root = React.useMemo(
       () => designsArray.length ? mergeDesignsToTree(designsArray) : null,
       [designsArray]
     );
   
     // derive children of the focused base for LocusControls
     function childPathsFor(base: string): string[] {
       if (!root) return [];
       const stack = [root as any];
       while (stack.length) {
         const n = stack.pop();
         if (n?.path === base) return (n?.children ?? []).map((c:any)=>c.path);
         for (const c of (n?.children ?? [])) stack.push(c);
       }
       return [];
     }
  // Example of using mode in a step request
  async function stepWithMode() {
    await fetch('/api/ludics/step', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({
        dialogueId, posDesignId, negDesignId, compositionMode: mode, fuel: 2048
      }),
    });
  }

   // --- Option B (match the panel): hydrate designs -> root tree -------------
   // NB: your designs endpoint accepts deliberationId (you scope dialogue==delib in DB).
//    const { data: designs } = useSWR(
//      () => dialogueId ? `/api/ludics/designs?deliberationId=${dialogueId}` : null,
//      fetcher,
//      { keepPreviousData: true, revalidateOnFocus: false }
//    );
//    const root = React.useMemo(
//      () => (designs && Array.isArray(designs)) ? mergeDesignsToTree(designs) : null,
//      [designs]
//    );
 

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <CompositionModeToggle value={mode} onChange={setMode} />
        <button className="px-2 py-1 text-xs border rounded bg-white" onClick={stepWithMode}>
          Step with composition = {mode}
        </button>
      </div>

        {/* Give the tree a real drawing area; otherwise it renders at height 0 */}
       <div className="rounded border bg-white/60 overflow-auto"
            style={{ minHeight: 320, maxHeight: 480 }}>
         {/* Prefer the same data-driven pattern as the panel if designs are available */}
         {root ? (
            <div className="rounded border bg-white/60 overflow-auto" style={{ minHeight: 320, maxHeight: 480 }}>
                     {root ? (
                       <LociTree
                         key={version}
                         root={root}
                         defaultCollapsedDepth={1}
                         showExpressions
                         autoScrollOnFocus
                         enableKeyboardNav
                     heatmap
                    stepIndexByActId
                         // keep the controls in sync with focused path
                         onFocusPathChange={(p:string) => {
                           setSelected(p || '0');
                           setChildren(childPathsFor(p || '0'));
                         }}
                       />
                     ) : (
                       <div className="p-3 text-xs text-neutral-500">Loading loci…</div>
                     )}
                   </div>
         ) : (
           // Fallback: let the package component fetch by dialogueId itself.
           
           <><span className='text-xs'> No Tree Yet</span></>
         )}
       </div>
 

      <div className="rounded border p-2">
        <div className="text-xs text-neutral-600 mb-1">Controls for base <code>{selected}</code></div>
        <LocusControls
          dialogueId={dialogueId}
          posDesignId={posDesignId}
          negDesignId={negDesignId}
          baseLocus={selected}
          childrenPaths={children}
          onRefresh={() => setVersion(v => v + 1)}
        />
      </div>
    </div>
  );
}
