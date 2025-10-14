// components/graph/CegMiniMap.tsx
'use client';

import { useRef, useState, useMemo } from 'react';
import { useCegData } from '../graph/useCegData';
import type { CegNode, CegEdge } from '../graph/useCegData';
interface CegMiniMapProps {
  deliberationId: string;
  selectedClaimId?: string | null;
  onSelectClaim?: (claimId: string) => void;
  width?: number;
  height?: number;
  showStats?: boolean;
  showLegend?: boolean;
  focusMode?: 'all' | 'attacks' | 'supports';
}

// Simple force simulation for layout
function useForceLayout(
  nodes: CegNode[],
  edges: CegEdge[],
  width: number,
  height: number
) {
  return useMemo(() => {
    if (nodes.length === 0) {
      return new Map<string, { x: number; y: number }>();
    }

    // Initialize with circular layout
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    const radius = Math.min(width, height) * 0.35;
    const centerX = width / 2;
    const centerY = height / 2;

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      });
    });

    // Simple force simulation (50 iterations)
    const iterations = 50;
    const repulsion = 100;
    const attraction = 0.01;
    const damping = 0.7;

    for (let iter = 0; iter < iterations; iter++) {
      const alpha = 1 - iter / iterations;

      // Repulsion between all nodes
      nodes.forEach(nodeA => {
        const posA = positions.get(nodeA.id)!;
        
        nodes.forEach(nodeB => {
          if (nodeA.id === nodeB.id) return;
          const posB = positions.get(nodeB.id)!;
          
          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq > 0) {
            const force = (repulsion * alpha) / Math.max(distSq, 1);
            const dist = Math.sqrt(distSq);
            posA.vx += (dx / dist) * force;
            posA.vy += (dy / dist) * force;
          }
        });
      });

      // Attraction along edges
      edges.forEach(edge => {
        const posA = positions.get(edge.source);
        const posB = positions.get(edge.target);
        if (!posA || !posB) return;

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const force = dist * attraction * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          posA.vx += fx;
          posA.vy += fy;
          posB.vx -= fx;
          posB.vy -= fy;
        }
      });

      // Update positions with damping
      positions.forEach(pos => {
        pos.vx *= damping;
        pos.vy *= damping;
        pos.x += pos.vx;
        pos.y += pos.vy;

        // Keep in bounds
        const padding = 15;
        pos.x = Math.max(padding, Math.min(width - padding, pos.x));
        pos.y = Math.max(padding, Math.min(height - padding, pos.y));
      });
    }

    return new Map(
      Array.from(positions.entries()).map(([id, pos]) => [id, { x: pos.x, y: pos.y }])
    );
  }, [nodes, edges, width, height]);
}

function getNodeColor(node: CegNode): string {
  switch (node.label) {
    case 'IN': return '#16a34a';
    case 'OUT': return '#dc2626';
    case 'UNDEC': return '#64748b';
    default: return '#94a3b8';
  }
}

function getEdgeStyle(edge: CegEdge): { stroke: string; strokeDasharray?: string } {
  if (edge.type === 'supports') {
    return { stroke: '#64748b' };
  }
  
  // Attacks (rebuts, undercuts, undermines)
  switch (edge.attackType) {
    case 'UNDERCUTS':
      return { stroke: '#a16207', strokeDasharray: '4 2' };
    case 'UNDERMINES':
      return { stroke: '#dc2626', strokeDasharray: '2 2' };
    case 'REBUTS':
      return { stroke: '#dc2626' };
    default:
      return { stroke: '#ef4444' };
  }
}

export default function CegMiniMap({
  deliberationId,
  selectedClaimId,
  onSelectClaim,
  width = 280,
  height = 200,
  showStats = true,
  showLegend = true,
  focusMode = 'all',
}: CegMiniMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    node: CegNode;
    x: number;
    y: number;
  } | null>(null);

  const { nodes, edges, stats, loading, error } = useCegData(deliberationId);

  // Filter edges based on focus mode
  const filteredEdges = useMemo(() => {
    switch (focusMode) {
      case 'attacks':
        return edges.filter(e => e.type === 'rebuts');
      case 'supports':
        return edges.filter(e => e.type === 'supports');
      default:
        return edges;
    }
  }, [edges, focusMode]);

  const nodePositions = useForceLayout(nodes, filteredEdges, width, height);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <div className="text-sm text-rose-700">Failed to load graph</div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
        <div className="text-sm text-slate-500">No claims yet</div>
      </div>
    );
  }

  // Calculate connected nodes for hover highlighting
  const getConnectedNodes = (nodeId: string): Set<string> => {
    const connected = new Set<string>([nodeId]);
    filteredEdges.forEach(e => {
      if (e.source === nodeId) connected.add(e.target);
      if (e.target === nodeId) connected.add(e.source);
    });
    return connected;
  };

  const connectedNodes = hoveredId ? getConnectedNodes(hoveredId) : new Set<string>();

  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur shadow-sm">
      {/* Header with Stats */}
      {showStats && stats && (
        <div className="px-3 py-2 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-700">Claim Graph</h4>
            <span className="text-[10px] text-slate-500">
              {nodes.length} claims
            </span>
          </div>
          
          {/* Support vs Counter Bars */}
          <div className="space-y-1.5">
            <Bar
              label="Support"
              pct={stats.supportPct}
              value={stats.supportWeighted}
              color="#16a34a"
            />
            <Bar
              label="Counter"
              pct={stats.counterPct}
              value={stats.counterWeighted}
              color="#dc2626"
            />
          </div>

          {/* Grounded Semantics Stats */}
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span>IN: {stats.inClaims}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
              <span>OUT: {stats.outClaims}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#64748b]" />
              <span>UNDEC: {stats.undecClaims}</span>
            </div>
          </div>
        </div>
      )}

      {/* Graph Visualization */}
      <div className="relative p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="bg-slate-50/50 rounded-lg"
        >
          <defs>
            {/* Arrow markers */}
            <marker
              id="arrow-support"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="#64748b" />
            </marker>
            <marker
              id="arrow-attack"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="#dc2626" />
            </marker>
            <marker
              id="arrow-undercut"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="#a16207" />
            </marker>
          </defs>

          {/* Edges */}
          <g className="edges">
            {filteredEdges.map(edge => {
              const from = nodePositions.get(edge.source);
              const to = nodePositions.get(edge.target);
              if (!from || !to) return null;

              const style = getEdgeStyle(edge);
              const isHighlighted = hoveredId && (
                connectedNodes.has(edge.source) && connectedNodes.has(edge.target)
              );

              const markerId = 
                edge.attackType === 'UNDERCUTS' ? 'arrow-undercut' :
                edge.type === 'rebuts' ? 'arrow-attack' :
                'arrow-support';

              return (
                <line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={style.stroke}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray={style.strokeDasharray}
                  strokeOpacity={isHighlighted ? 0.9 : 0.4}
                  markerEnd={`url(#${markerId})`}
                  className="transition-all duration-200"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {nodes.map(node => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;

              const isSelected = node.id === selectedClaimId;
              const isHovered = node.id === hoveredId;
              const isConnected = connectedNodes.has(node.id);
              const radius = isSelected ? 7 : isHovered ? 6 : 5;
              const opacity = hoveredId && !isConnected ? 0.3 : 1;

              return (
                <g
                  key={node.id}
                  style={{ cursor: 'pointer' }}
                  opacity={opacity}
                  onClick={() => onSelectClaim?.(node.id)}
                  onMouseEnter={() => {
                    setHoveredId(node.id);
                    setTooltipData({ node, x: pos.x, y: pos.y });
                  }}
                  onMouseLeave={() => {
                    setHoveredId(null);
                    setTooltipData(null);
                  }}
                  className="transition-all duration-200"
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 3}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )}

                  {/* Node circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill={getNodeColor(node)}
                    stroke="#fff"
                    strokeWidth={isHovered ? 2 : 1}
                  />

                  {/* Approval indicator */}
                  {node.approvals > 0 && (
                    <text
                      x={pos.x}
                      y={pos.y + radius + 7}
                      fontSize="6"
                      fill="#64748b"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      +{node.approvals}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltipData && (
          <div
            className="absolute z-50 bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded shadow-lg pointer-events-none max-w-[200px]"
            style={{
              left: Math.min(tooltipData.x + 10, width - 100),
              top: Math.max(tooltipData.y - 40, 10),
            }}
          >
            <div className="font-semibold mb-0.5">
              {tooltipData.node.label || 'UNDEC'}
            </div>
            <div className="opacity-90 line-clamp-3">
              {tooltipData.node.text.substring(0, 100)}
              {tooltipData.node.text.length > 100 && '...'}
            </div>
            {tooltipData.node.approvals > 0 && (
              <div className="mt-1 text-emerald-300">
                {tooltipData.node.approvals} approval{tooltipData.node.approvals !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="px-3 py-2 border-t border-slate-200 space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-600 mb-1">Legend</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
              Support
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
              Rebut
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#a16207]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #a16207 0, #a16207 2px, transparent 2px, transparent 4px)' }} />
              Undercut
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({
  label,
  pct,
  value,
  color,
}: {
  label: string;
  pct: number;
  value: number;
  color: string;
}) {
  const width = Math.round(pct * 100);
  
  return (
    <div>
      <div className="flex justify-between items-center text-[10px] mb-0.5">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-700">
          {width}% ({value.toFixed(1)})
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}