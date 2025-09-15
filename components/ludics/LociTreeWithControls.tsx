'use client';
import * as React from 'react';
import { CompositionModeToggle } from '../engine/CompositionModeToggle';
import LocusControls from './LocusControls';

// If you're importing a package LociTree, swap this import:
import { LociTree } from 'packages/ludics-react/LociTree';

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
  function onSelect(basePath: string, childrenPaths: string[]) {
    setSelected(basePath); setChildren(childrenPaths);
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <CompositionModeToggle value={mode} onChange={setMode} />
        <button className="px-2 py-1 text-xs border rounded bg-white" onClick={stepWithMode}>
          Step with composition = {mode}
        </button>
      </div>

      <div className="rounded border">
        {/* This assumes your LociTree can accept a `key` (version) to force re-fetching */}
        <LociTree
          key={version}
          dialogueId={dialogueId}
          onSelect={(p:string, kids:string[]) => onSelect(p, kids)}
        />
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
