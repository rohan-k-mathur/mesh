// components/graph/AFLens.tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import navigator from 'cytoscape-navigator';
import CyCanvas from './CyCanvas';
import SchemeOverlayFetch from './SchemeOverlayFetch';
import HullOverlay from './HullOverlay';

cytoscape.use(navigator);
try { (cytoscape as any).__dagre__ || (cytoscape as any).use(dagre); (cytoscape as any).__dagre__ = true; } catch {}

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

type GraphNode = {
  id: string;
  text: string;
  label?: 'IN'|'OUT'|'UNDEC';
  approvals: number;
  schemeIcon?: string | null;
};
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: 'supports'|'rebuts';
  attackType?: 'SUPPORTS'|'REBUTS'|'UNDERCUTS'|'UNDERMINES';
};
type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  version?: number | string;
};

function colorFor(label?: 'IN'|'OUT'|'UNDEC') {
  if (label === 'IN') return '#d1fae5';
  if (label === 'OUT') return '#e0f2fe';
  return '#f1f5f9';
}

export default function AFLens({ deliberationId, height = 420 }: { deliberationId: string; height?: number }) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [extraQuery, setExtraQuery] = useState('');
  const hasFocus = extraQuery.includes('focusClusterId=');
  const [showHulls, setShowHulls] = useState<boolean>(() => {
    try { return localStorage.getItem('graph:showHulls') === '1'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('graph:showHulls', showHulls ? '1' : '0'); } catch {}
  }, [showHulls]);
  

  
// event bus: focus one or multiple clusters
useEffect(() => {
  const handler = (ev: any) => {
    if (ev?.detail?.deliberationId !== deliberationId) return;
    const ids: string[] = ev.detail.clusterIds || (ev.detail.clusterId ? [ev.detail.clusterId] : []);
    if (ids.length >= 2) {
      setExtraQuery(`&focusClusterIds=${encodeURIComponent(ids.join(','))}`);
    } else if (ids.length === 1) {
      setExtraQuery(`&focusClusterId=${encodeURIComponent(ids[0])}`);
    } else {
      setExtraQuery('');
    }
  };
  window.addEventListener('mesh:graph:focusCluster', handler as any);
  return () => window.removeEventListener('mesh:graph:focusCluster', handler as any);
}, [deliberationId]);


  const radius = 1;
  const maxNodes = 400;

  const key = useMemo(() => {
    if (!deliberationId) return null;
    const base = `/api/deliberations/${deliberationId}/graph?lens=af&maxNodes=${maxNodes}`;
    return focusId ? `${base}&focus=${focusId}&radius=${radius}` : base;
  }, [deliberationId, focusId]);

  // const { data } = useSWR<GraphResponse>(key, fetcher, { revalidateOnFocus: false });
  // change SWR key:
  const { data } = useSWR<GraphResponse>(
    deliberationId ? `/api/deliberations/${deliberationId}/graph?lens=af${extraQuery}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const cyRef = useRef<cytoscape.Core | null>(null);

  // Build Cytoscape elements from server data
  const elements = useMemo(() => {
    if (!data) return [];
    const els: any[] = [];

    for (const n of data.nodes) {
      els.push({
        data: {
          id: n.id,
          label: n.text.length > 80 ? n.text.slice(0, 77) + '…' : n.text,
          state: n.label ?? 'UNDEC',
          approvals: n.approvals ?? 0,
          schemeIcon: n.schemeIcon ?? null,
        },
        classes: n.schemeIcon ? 'has-scheme' : '',
      });
    }

    for (const e of data.edges) {
      // AF lens: only render attacks
      const isAttack =
        e.type === 'rebuts' ||
        (e.attackType && e.attackType !== 'SUPPORTS');

      if (!isAttack) continue;

      const klass =
        e.attackType === 'UNDERCUTS' ? 'attack undercut' :
        e.attackType === 'UNDERMINES' ? 'attack undermine' : 'attack';

      els.push({ data: { id: e.id, source: e.source, target: e.target }, classes: klass });
    }

    return els;
  }, [data]);

  const stylesheet: cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        shape: 'round-rectangle',
        'background-color': (ele: any) => colorFor(ele.data('state')),
        label: 'data(label)',
        'font-size': '11px',
        'text-wrap': 'wrap',
        'text-max-width': '160px',
        'text-valign': 'center',
        'text-halign': 'center',
        width: 'label',
        height: 'label',
        padding: '8px',
        'border-width': 1,
        'border-color': (ele: any) => {
          const a = ele.data('approvals') ?? 0;
          const capped = Math.min(a, 20);
          const hue = (capped / 20) * 120; // 0→red, 120→green
          return `hsl(${hue},70%,45%)`;
        },
      },
    },
    { selector: 'edge', style: { width: 2, 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'line-color': '#ef4444', 'target-arrow-color': '#ef4444' } },
    { selector: 'edge.undercut',  style: { 'line-style': 'dashed', 'line-color': '#7c3aed', 'target-arrow-color': '#7c3aed' } },
    { selector: 'edge.undermine', style: { 'line-style': 'dashed', 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b' } },
    { selector: '.faded', style: { opacity: 0.15 } },
    {
      selector: 'node.has-scheme',
      style: {
        'background-image': 'data(schemeIcon)',
        'background-fit': 'none',
        'background-width': 14,
        'background-height': 14,
        'background-position-x': '95%',
        'background-position-y': '5%',
      },
    },
  ];

  const cacheKey = `cy-layout:af:${deliberationId}`;
  function runLayout() {
    cyRef.current?.layout({ name: 'dagre', nodeSep: 30, rankSep: 70, rankDir: 'TB', padding: 20 }).run();
  }
  function saveLayout() {
    if (!cyRef.current) return;
    const positions: Record<string, { x: number; y: number }> = {};
    cyRef.current.nodes().forEach(n => { positions[n.id()] = n.position(); });
    try { localStorage.setItem(cacheKey, JSON.stringify(positions)); } catch {}
  }
  function loadLayout(): boolean {
    if (!cyRef.current) return false;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return false;
      const positions = JSON.parse(raw);
      cyRef.current.nodes().forEach(n => { if (positions[n.id()]) n.position(positions[n.id()]); });
      cyRef.current.fit();
      return true;
    } catch { return false; }
  }

  
  function handleReady(cy: cytoscape.Core) {
    cyRef.current = cy;
    const restored = loadLayout();
    if (!restored) {
      cy.layout({ name: 'dagre', nodeSep: 30, rankSep: 70, rankDir: 'TB', padding: 20 }).run();
    }
    cy.on('layoutstop', saveLayout);
    cy.on('tap', 'node', evt => {
      const id = evt.target.id();
      setFocusId(prev => (prev === id ? null : id));
    });
  }

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !data) return;
  
    // Build fresh elements from server data
    // (reuse your existing `elements` useMemo)
    cy.startBatch();
    cy.elements().remove();
    cy.add(elements as any); // your elements array from useMemo
    cy.endBatch();
  
    // run a layout (or try to restore saved positions first)
    // if you keep your loadLayout/saveLayout helpers:
    if (!loadLayout()) {
      cy.layout({ name: 'dagre', nodeSep: 30, rankSep: 70, rankDir: 'TB', padding: 20 }).run();
    }
  }, [data, elements]); // <-- no remounts, just update

  // Focus/fade styling
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (focusId) {
      cy.elements().addClass('faded');
      cy.getElementById(focusId).closedNeighborhood().removeClass('faded');
    } else {
      cy.elements().removeClass('faded');
    }
  }, [focusId]);


// add effect:
useEffect(() => {
  const handler = (ev: any) => {
    if (ev?.detail?.deliberationId !== deliberationId) return;
    const id = ev.detail.clusterId as string;
    setExtraQuery(id ? `&focusClusterId=${encodeURIComponent(id)}` : '');
  };
  window.addEventListener('mesh:graph:focusCluster', handler as any);
  return () => window.removeEventListener('mesh:graph:focusCluster', handler as any);
}, [deliberationId]);

  return (
    <div className="relative z-10 rounded border bg-white">
      <div className="flex items-center justify-between p-2 text-xs text-neutral-600">
        <div>Abstract AF (grounded labels)</div>
        <div className="flex items-center gap-3">
          <span>● IN ○ OUT ◐ UNDEC</span>
          <label className="inline-flex items-center gap-1">
      <input
        type="checkbox"
        checked={showHulls}
        onChange={(e)=>setShowHulls(e.target.checked)}
      />
      Show hulls
    </label>
          <button className="px-2 py-0.5 border rounded" onClick={runLayout}>Re-layout</button>
        </div>
      </div>

      <div className="relative">
        <CyCanvas
  elements={elements}
  stylesheet={stylesheet}
  height={height}
  onReady={handleReady}
/>
{hasFocus && showHulls && <HullOverlay cy={cyRef.current} height={height} enabled />}

      </div>

      {/* overlays */}
      <SchemeOverlayFetch deliberationId={deliberationId} cy={cyRef.current} onOpenCQ={(id) => console.log('CQ for', id)} />
    </div>
  );
}
