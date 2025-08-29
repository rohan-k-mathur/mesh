// components/graph/BipolarLens.tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import cytoscape from 'cytoscape';
import navigator from 'cytoscape-navigator';
import CyCanvas from './CyCanvas';
import SchemeOverlayFetch from './SchemeOverlayFetch';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

type GraphNode = {
  id: string;
  text: string;
  approvals?: number;
  schemeIcon?: string | null;
};
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: 'supports' | 'rebuts'; // normalized
  attackType?: 'SUPPORTS' | 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
  targetScope?: 'premise'|'inference'|'conclusion'|null;
};
type GraphResponse = { nodes: GraphNode[]; edges: GraphEdge[]; version?: number|string };

export default function BipolarLens({ deliberationId, height = 420 }: { deliberationId: string; height?: number }) {
  const { data } = useSWR<GraphResponse>(
    deliberationId ? `/api/deliberations/${deliberationId}/graph?lens=bipolar` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const cyRef = useRef<cytoscape.Core | null>(null);
  const navRef = useRef<any>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  // Build Cy elements from server data
  const elements = useMemo(() => {
    if (!data) return [];
    const els: any[] = [];
    const stubIds = new Set<string>();

    const addStub = (src: string, tgt: string) => {
      const id = `warrant:${src}:${tgt}`;
      if (!stubIds.has(id)) {
        stubIds.add(id);
        els.push({ data: { id, label: 'warrant' }, classes: 'warrant-stub' });
      }
      return id;
    };

    for (const n of data.nodes) {
      els.push({
        data: {
          id: n.id,
          label: n.text.length > 80 ? n.text.slice(0, 77) + '…' : n.text,
          approvals: n.approvals ?? 0,
          schemeIcon: n.schemeIcon ?? null,
        },
        classes: n.schemeIcon ? 'has-scheme' : '',
      });
    }

    for (const e of data.edges) {
      // UNDERCUTS: source → warrant-stub → target
      if (e.attackType === 'UNDERCUTS') {
        const stub = addStub(e.source, e.target);
        els.push({ data: { id: e.id, source: e.source, target: stub, scope: 'I' }, classes: 'edge undercut' });
        els.push({ data: { id: `${e.id}:stub`, source: stub, target: e.target }, classes: 'stublink' });
        continue;
      }
      // UNDERMINES: premise-level attack
      if (e.attackType === 'UNDERMINES') {
        els.push({ data: { id: e.id, source: e.source, target: e.target, scope: 'P' }, classes: 'edge undermine' });
        continue;
      }
      // REBUTS vs SUPPORTS
      if (e.type === 'rebuts' || e.attackType === 'REBUTS') {
        els.push({ data: { id: e.id, source: e.source, target: e.target, scope: 'C' }, classes: 'edge rebut' });
      } else {
        els.push({ data: { id: e.id, source: e.source, target: e.target }, classes: 'edge support' });
      }
    }
    return els;
  }, [data]);

  const stylesheet: cytoscape.Stylesheet[] = [
    { selector: 'node',
      style: {
        shape: 'round-rectangle',
        'background-color': '#f1f5f9',
        label: 'data(label)',
        'font-size': '11px',
        'text-wrap': 'wrap',
        'text-max-width': '180px',
        'text-valign': 'center',
        'text-halign': 'center',
        padding: '8px',
        'border-width': 1,
        'border-color': (ele: any) => {
          const a = ele.data('approvals') ?? 0;
          const capped = Math.min(a, 20);
          const hue = (capped / 20) * 120; // 0 red → 120 green
          return `hsl(${hue},70%,45%)`;
        },
        width: 'label',
        height: 'label',
      }},
    { selector: 'node.warrant-stub',
      style: {
        shape: 'round-rectangle',
        'background-color': '#f5f3ff',
        'border-color': '#ddd6fe',
        width: 40, height: 18,
        label: 'data(label)',
        'font-size': '10px',
        color: '#6d28d9',
      }},
    { selector: 'edge',
      style: {
        'curve-style': 'bezier',
        width: 2,
        'target-arrow-shape': 'triangle',
        label: (ele: any) => {
          const scope = ele.data('scope') || ele.data('targetScope');
          if (scope === 'premise' || scope === 'P') return 'P';
          if (scope === 'inference' || scope === 'I') return 'I';
          if (scope === 'conclusion' || scope === 'C') return 'C';
          return '';
        },
        'font-size': '8px',
        'text-background-opacity': 0.8,
        'text-background-color': '#fff',
        'text-background-padding': 1,
      }},
    { selector: 'edge.support',   style: { 'line-color': '#22c55e', 'target-arrow-color': '#22c55e' } },
    { selector: 'edge.rebut',     style: { 'line-color': '#ef4444', 'target-arrow-color': '#ef4444' } },
    { selector: 'edge.undermine', style: { 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b', 'line-style': 'dashed' } },
    { selector: 'edge.undercut',  style: { 'line-color': '#7c3aed', 'target-arrow-color': '#7c3aed', 'line-style': 'dashed' } },
    { selector: 'edge.stublink',  style: { 'line-color': '#c7d2fe', 'line-style': 'dotted', 'target-arrow-shape': 'none', width: 1 } },
    { selector: 'node.has-scheme',
      style: {
        'background-image': 'data(schemeIcon)',
        'background-fit': 'none',
        'background-width': 14,
        'background-height': 14,
        'background-position-x': '95%',
        'background-position-y': '5%',
      }},
    { selector: '.faded', style: { opacity: 0.15 } },
  ];

  // ---- layout + navigator (safe) ----
  const cacheKey = `cy-layout:bipolar:${deliberationId}`;
  const saveLayout = () => {
    const cy = cyRef.current; if (!cy) return;
    const pos: Record<string, {x:number;y:number}> = {};
    cy.nodes().forEach(n => { pos[n.id()] = n.position(); });
    try { localStorage.setItem(cacheKey, JSON.stringify(pos)); } catch {}
  };
  const loadLayout = () => {
    const cy = cyRef.current; if (!cy) return false;
    try {
      const raw = localStorage.getItem(cacheKey); if (!raw) return false;
      const pos = JSON.parse(raw);
      cy.nodes().forEach(n => pos[n.id()] && n.position(pos[n.id()]));
      cy.fit(); return true;
    } catch { return false; }
  };





  const runLayout = () => {
    const cy = cyRef.current; if (!cy) return;
     const lay = cy.layout({ name: 'dagre', nodeSep: 30, rankSep: 70, rankDir: 'TB', padding: 20 });
     cy.one('layoutstop', () => { saveLayout(); });
     lay.run();
  };

 
  // Update elements in-place when data changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !data) return;
    cy.startBatch();
    cy.elements().remove();
    cy.add(elements as any);
    cy.endBatch();
    if (!loadLayout()) runLayout();
  }, [data, elements]);

  // Ready hook from canvas
  const handleReady = (cy: cytoscape.Core) => {
    cyRef.current = cy;

    
         
      const restored = loadLayout();
    if (!restored) runLayout();
    cy.on('layoutstop', saveLayout);
    cy.on('tap', 'node', evt => {
      const id = evt.target.id();
      setFocusId(prev => (prev === id ? null : id));
    });
  };

  // Focus/fade
  useEffect(() => {
    const cy = cyRef.current; if (!cy) return;
    if (focusId) {
      cy.elements().addClass('faded');
      cy.getElementById(focusId).closedNeighborhood().removeClass('faded');
    } else {
      cy.elements().removeClass('faded');
    }
  }, [focusId]);


  return (
    <div className="rounded border bg-white">
      <div className="flex items-center justify-between p-2 text-xs text-neutral-600">
        <span>Bipolar (support + attack)</span>

        <div className="flex items-center gap-2">
          <i className="inline-block w-3 h-[2px] bg-green-500" /> support
          <i className="inline-block w-3 h-[2px] bg-red-500" /> rebut
          <i className="inline-block w-3 h-[2px] bg-amber-500" /> undermine (P)
          <i className="inline-block w-3 h-[2px] bg-violet-600" /> undercut (I)
        </div>
        <button className="px-2 py-0.5 border rounded justify-end items-end" onClick={runLayout}>Re-layout</button>

      </div>
      <div className="relative">
        <CyCanvas elements={elements} stylesheet={stylesheet} height={height} onReady={handleReady} />
      </div>
      <SchemeOverlayFetch deliberationId={deliberationId} cy={cyRef.current} onOpenCQ={(id) => console.log('CQ for', id)} />
    </div>
  );
}