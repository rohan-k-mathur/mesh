'use client';
import dynamic from 'next/dynamic';
import { useMemo, useRef } from 'react';
import cytoscape from 'cytoscape';
import { useCegData } from './useCegData';
import SchemeOverlayFetch from './SchemeOverlayFetch';


const CytoscapeComponent = dynamic(() => import('react-cytoscapejs'), { ssr: false });

export default function BipolarLens({ deliberationId, height = 420 }: { deliberationId: string; height?: number }) {
  const { nodes, edges } = useCegData(deliberationId);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const elements = useMemo(() => {
    const els: any[] = [];
    for (const n of nodes) {
      els.push({ data: { id: n.id, label: n.text.slice(0, 80) }, classes: 'node' });
    }

    // Add synthetic "warrant stubs" for undercuts-to-inference
    const stubIds = new Set<string>();
    function addWarrantStub(src: string, tgt: string) {
      const id = `warrant:${src}:${tgt}`;
      if (!stubIds.has(id)) {
        stubIds.add(id);
        els.push({ data: { id, label: 'warrant' }, classes: 'warrant-stub' });
        // tiny, we’ll position via the layout/straight edges later
      }
      return id;
    }

    for (const e of edges) {
      const scope = e.targetScope ?? (
        e.attackType === 'UNDERCUTS' ? 'inference' :
        e.attackType === 'UNDERMINES' ? 'premise' :
        e.type === 'rebuts' || e.attackType === 'REBUTS' ? 'conclusion' : null
      );

      const scopeShort = scope === 'premise' ? 'P' : scope === 'inference' ? 'I' : scope === 'conclusion' ? 'C' : '';

      if (e.attackType === 'UNDERCUTS' || scope === 'inference') {
        // undercut: attach to warrant stub of (source → target) pair
        const stub = addWarrantStub(e.source, e.target);
        els.push({
          data: { id: e.id, source: e.source, target: stub, scope, scopeShort },
          classes: 'edge undercut'
        });
        // connect stub to target (cosmetic, dotted)
        els.push({
          data: { id: `${e.id}:stublink`, source: stub, target: e.target },
          classes: 'stublink'
        });
      } else if (e.attackType === 'UNDERMINES' || scope === 'premise') {
        els.push({
          data: { id: e.id, source: e.source, target: e.target, scope, scopeShort },
          classes: 'edge undermine'
        });
      } else if (e.type === 'rebuts' || e.attackType === 'REBUTS' || scope === 'conclusion') {
        els.push({
          data: { id: e.id, source: e.source, target: e.target, scope, scopeShort },
          classes: 'edge rebut'
        });
      } else {
        // supports by default
        els.push({
          data: { id: e.id, source: e.source, target: e.target, scope: null, scopeShort: '' },
          classes: 'edge support'
        });
      }
    }
    return els;
  }, [nodes, edges]);

  const stylesheet: cytoscape.Stylesheet[] = [
    { selector: 'node',
      style: {
        'shape': 'round-rectangle',
        'background-color': '#fff',
        'border-color': '#e5e7eb',
        'border-width': 1,
        'label': 'data(label)',
        'font-size': '11px',
        'text-wrap': 'wrap',
        'text-max-width': '180px',
        'text-valign': 'center',
        'text-halign': 'center',
        'padding': '8px',
        'width': 'label',
        'height': 'label',
      }
    },
    { selector: 'node.warrant-stub',
      style: {
        'shape': 'round-rectangle',
        'background-color': '#f5f3ff', // violet-50
        'border-color': '#ddd6fe',     // violet-200
        'width': '40px',
        'height': '18px',
        'label': 'data(label)',
        'font-size': '10px',
        'color': '#6d28d9',
      }
    },
    { selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'width': 2,
        'target-arrow-shape': 'triangle',
        'label': 'data(scopeShort)',
        'font-size': '8px',
        'text-background-opacity': 0.8,
        'text-background-color': '#ffffff',
        'text-background-padding': '1px',
      }
    },
    { selector: 'edge.support',
      style: { 'line-color': '#22c55e', 'target-arrow-color': '#22c55e' } // green
    },
    { selector: 'edge.rebut',
      style: { 'line-color': '#ef4444', 'target-arrow-color': '#ef4444' } // red
    },
    { selector: 'edge.undermine',
      style: { 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b', 'line-style': 'dashed' } // amber
    },
    { selector: 'edge.undercut',
      style: { 'line-color': '#7c3aed', 'target-arrow-color': '#7c3aed', 'line-style': 'dashed' } // violet
    },
    { selector: 'edge.stublink',
      style: { 'line-color': '#c7d2fe', 'target-arrow-shape': 'none', 'line-style': 'dotted', 'width': 1 } // pale link
    },
    {
        selector: 'node.has-scheme',
        style: {
          // Load per-node icon from node.data('schemeIcon')
          'background-image': 'data(schemeIcon)',
          // Don’t stretch over the node; we just want a small corner badge
          'background-fit': 'none',
          'background-width': '14px',
          'background-height': '14px',
          'background-position-x': '95%',
          'background-position-y': '5%',
          // If you want the badge below the label, you can use position Y ~85%
          // 'background-position-y': '85%',
        }
      },
  ];

  function handleReady(cy: cytoscape.Core) {
    cyRef.current = cy;
    cy.layout({ name: 'cose', padding: 20, animate: false }).run();
  }
  function handleReady(cy: cytoscape.Core) {
    cyRef.current = cy;
    cy.layout({ name: 'cose', padding: 20, animate: false }).run();

    cy.minimap = (cy as any).navigator({
        container: cyRef.current?.container(),
        // optional styling
      });
    const restored = loadLayout('bipolar');  // or 'bipolar' in BipolarLens
  if (!restored) runLayout();
  cy.on('layoutstop', () => saveLayout('af'));

    cy.on('tap', 'node', (evt) => {
      const id = evt.target.id();
      setFocusId(prev => prev === id ? null : id);
    });
  }


  return (
    <div className="rounded border bg-white">
      <div className="flex items-center justify-between p-2 text-xs text-neutral-600">
        <div>Bipolar (support + attack) with scope chips</div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2">
            <i className="inline-block w-3 h-[2px] bg-green-500" /> support
            <i className="inline-block w-3 h-[2px] bg-red-500" /> rebut
            <i className="inline-block w-3 h-[2px] bg-amber-500" /> undermine (P)
            <i className="inline-block w-3 h-[2px] bg-violet-600" /> undercut (I)
          </span>
        </div>
      </div>
      <CytoscapeComponent
        elements={elements}
        stylesheet={stylesheet}
        style={{ width: '100%', height }}
        cy={handleReady}
        wheelSensitivity={0.2}
      />
      <SchemeOverlayFetch deliberationId={deliberationId} cy={cyRef.current} onOpenCQ={(claimId)=> {
  // open your CQ side panel here; for now:
  console.log('Open CQs for claim', claimId);
}}/>
    </div>
  );
}
