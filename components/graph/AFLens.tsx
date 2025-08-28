'use client';
import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useCegData } from './useCegData';
import SchemeOverlayFetch from './SchemeOverlayFetch';
import navigator from 'cytoscape.js-navigator';

cytoscape.use(navigator);


const CytoscapeComponent = dynamic(() => import('react-cytoscapejs'), { ssr: false });

// Register dagre once (avoid HMR dupes)
try { (cytoscape as any).__dagre__ || (cytoscape as any).use(dagre), ((cytoscape as any).__dagre__ = true); } catch {}

function colorFor(label?: 'IN'|'OUT'|'UNDEC') {
  if (label === 'IN') return '#16a34a';       // green 600
  if (label === 'OUT') return '#ef4444';      // red 500
  return '#9ca3af';                           // gray 400
}

export default function AFLens({ deliberationId, height = 420 }: { deliberationId: string; height?: number }) {
  const { nodes, edges } = useCegData(deliberationId);
  const [focusId, setFocusId] = useState<string | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Abstract "attack" edges: rebuts/undercuts/undermines
  const attackEdges = useMemo(() => (
    edges.filter(e => {
      if (e.type === 'rebuts') return true;
      if (e.attackType && e.attackType !== 'SUPPORTS') return true;
      return false;
    })
  ), [edges]);

  const elements = useMemo(() => {
    const els: any[] = [];
    for (const n of nodes) {
      els.push({ data: { id: n.id, label: n.text.slice(0, 80), state: n.label } });
    }
    for (const e of attackEdges) {
      if (!e.source || !e.target) continue;
      const klass =
        e.attackType === 'UNDERCUTS' ? 'attack undercut' :
        e.attackType === 'UNDERMINES' ? 'attack undermine' : 'attack';
      els.push({ data: { id: e.id, source: e.source, target: e.target }, classes: klass });
    }
    return els;
  }, [nodes, attackEdges]);

  const stylesheet: cytoscape.Stylesheet[] = [
    { selector: 'node',
      style: {
        'shape': 'round-rectangle',
        'background-color': (ele: any) => colorFor(ele.data('state')),
        'label': 'data(label)',
        'color': '#111',
        'font-size': '11px',
        'text-wrap': 'wrap',
        'text-max-width': '160px',
        'text-valign': 'center',
        'text-halign': 'center',
        'width': 'mapData(label.length, 10, 120, 70, 160)',
        'height': 'label',
        'padding': '8px',
        'border-width': 1,
        'border-color': '#e5e7eb',
      }
    },
    { selector: 'edge',
      style: {
        'width': 2,
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#ef4444',
        'line-color': '#ef4444',
        'opacity': 0.9,
      }
    },
    { selector: 'edge.undercut',
      style: { 'line-style': 'dashed', 'line-color': '#7c3aed', 'target-arrow-color': '#7c3aed' } // violet
    },
    { selector: 'edge.undermine',
      style: { 'line-style': 'dashed', 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b' } // amber
    },
    { selector: '.faded',
      style: { 'opacity': 0.15 }
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

  function runLayout() {
    cyRef.current?.layout({
      name: 'dagre',
      nodeSep: 30,
      rankSep: 70,
      edgeSep: 10,
      rankDir: 'TB',
      padding: 20,
    }).run();
  }
  const cacheKey = (lens: string) => `cy-layout:${lens}:${deliberationId}`;

  function saveLayout(lens: string) {
    if (!cyRef.current) return;
    const positions: Record<string, { x: number; y: number }> = {};
    cyRef.current.nodes().forEach(n => {
      positions[n.id()] = n.position();
    });
    try { localStorage.setItem(cacheKey(lens), JSON.stringify(positions)); } catch {}
  }
  
  function loadLayout(lens: string) {
    if (!cyRef.current) return false;
    try {
      const raw = localStorage.getItem(cacheKey(lens));
      if (!raw) return false;
      const positions = JSON.parse(raw);
      cyRef.current.nodes().forEach(n => {
        const p = positions[n.id()];
        if (p) n.position(p);
      });
      cyRef.current.fit();
      return true;
    } catch { return false; }
  }
  
  function handleReady(cy: cytoscape.Core) {
    cyRef.current = cy;
    runLayout();
    cy.minimap = (cy as any).navigator({
        container: cyRef.current?.container(),
        // optional styling
      });
    const restored = loadLayout('af');  // or 'bipolar' in BipolarLens
  if (!restored) runLayout();
  cy.on('layoutstop', () => saveLayout('af'));

    cy.on('tap', 'node', (evt) => {
      const id = evt.target.id();
      setFocusId(prev => prev === id ? null : id);
    });
  }

  // focus+context styling
  if (focusId && cyRef.current) {
    const cy = cyRef.current;
    cy.elements().addClass('faded');
    cy.getElementById(focusId).closedNeighborhood().removeClass('faded');
  } else if (cyRef.current) {
    cyRef.current.elements().removeClass('faded');
  }

  return (
    <div className="rounded border bg-white">
      <div className="flex items-center justify-between p-2 text-xs text-neutral-600">
        <div>Abstract AF (grounded labels)</div>
        <div className="flex items-center gap-3">
          <span>● IN&nbsp; ○ OUT&nbsp; ◐ UNDEC</span>
          <button className="px-2 py-0.5 border rounded" onClick={runLayout}>Re‑layout</button>
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
