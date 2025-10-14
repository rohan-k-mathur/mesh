// components/map/Aifdiagramviewerdagre.tsx
/**
 * AIF Diagram Viewer - Complete with Dagre Layout
 * * All features integrated + hierarchical layout
 * This replaces the grid layout with intelligent dagre positioning
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import type { AifSubgraph } from '@/lib/arguments/diagram';
import { AifDiagramMinimap } from './Aifdiagramminimap';
import { AifPathHighlighter, usePathHighlight, type ArgumentPath } from './Aifpathhighlighter';
import { AifDiagramSearch, useGraphSearch } from './Aifdiagramsearch';
import { AifDiagramExportMenu } from './Aifdiagramexport';
import { ZoomAwareAifNode } from './Enhancedaifnodes';
import { useDagreLayout, LAYOUT_PRESETS } from './Aifdagrelayout';

export function AifDiagramViewerDagre({
  initialGraph,
  onNodeClick,
  layoutPreset = 'standard',
  className = '',
}: {
  initialGraph: AifSubgraph;
  onNodeClick?: (nodeId: string) => void;
  layoutPreset?: keyof typeof LAYOUT_PRESETS;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Graph state
  const [graph, setGraph] = useState(initialGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  
  // Layout calculation with Dagre
  const { nodePositions, graphBounds } = useDagreLayout(
    graph,
    LAYOUT_PRESETS[layoutPreset]
  );
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // **NEW**: State for drag-to-zoom
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStart, setZoomStart] = useState({ y: 0, initialZoom: 1 });

  // Feature states
  const [activePath, setActivePath] = useState<ArgumentPath | null>(null);
  const { highlightedNodes, highlightedEdges } = usePathHighlight(activePath);
  const { searchResults, selectedResult, highlightedNodeIds, onSearchChange, onResultSelect } = 
    useGraphSearch(graph);
  
  // **REMOVED**: Old handleWheel zoom handler
  
  // **UPDATED**: Mouse down handler to differentiate between pan and zoom
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return; // Ignore right/middle clicks
    
    if (e.shiftKey) {
      // Start zooming
      setIsZooming(true);
      setZoomStart({ y: e.clientY, initialZoom: zoom });
    } else {
      // Start panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }
  
  // **UPDATED**: Mouse move handler for both pan and zoom
  function handleMouseMove(e: React.MouseEvent) {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isZooming) {
      const deltaY = e.clientY - zoomStart.y;
      // Adjust sensitivity by dividing; moving down zooms out
      const newZoom = zoomStart.initialZoom - deltaY * 0.005; 
      setZoom(Math.max(0.2, Math.min(3, newZoom)));
    }
  }
  
  // **UPDATED**: Mouse up handler to reset both states
  function handleMouseUp() {
    setIsPanning(false);
    setIsZooming(false);
  }
  
  // Node click handler
  function handleNodeClickInternal(nodeId: string) {
    setSelectedNodeId(nodeId);
    onNodeClick?.(nodeId);
  }
  
  // Search result navigation
  function handleSearchResultSelect(result: any) {
    onResultSelect(result);
    setSelectedNodeId(result.node.id);
    
    // Pan to node
    const pos = nodePositions.get(result.node.id);
    if (pos) {
      setPan({
        x: -pos.x * zoom + (containerRef.current?.clientWidth || 800) / 2,
        y: -pos.y * zoom + (containerRef.current?.clientHeight || 600) / 2,
      });
    }
  }
  
  // Minimap navigation
  function handleMinimapNavigate(x: number, y: number) {
    setPan({
      x: -x * zoom + (containerRef.current?.clientWidth || 800) / 2,
      y: -y * zoom + (containerRef.current?.clientHeight || 600) / 2,
    });
  }
  
  // Calculate viewBox for minimap
  const viewBox = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    width: (containerRef.current?.clientWidth || 800) / zoom,
    height: (containerRef.current?.clientHeight || 600) / zoom,
  };
  
  // Auto-center on mount
  useEffect(() => {
    if (containerRef.current && nodePositions.size > 0) {
      const centerX = (graphBounds.minX + graphBounds.maxX) / 2;
      const centerY = (graphBounds.minY + graphBounds.maxY) / 2;
      
      setPan({
        x: -centerX + containerRef.current.clientWidth / 2,
        y: -centerY + containerRef.current.clientHeight / 2,
      });
    }
  }, [graphBounds, nodePositions.size]);
  
  return (
    <div className={`relative w-full bg-gray-50 ${className}`} ref={containerRef}>
      {/* Top Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <div className="w-80">
          <AifDiagramSearch
            graph={graph}
            onResultSelect={handleSearchResultSelect}
            onSearchChange={onSearchChange}
          />
        </div>
        
        <AifDiagramExportMenu svgRef={svgRef} graph={graph} />
        
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={() => setZoom((z) => Math.min(3, z * 1.25))}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="ml-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
        </div>
      </div>
      
      {selectedNodeId && (
        <AifPathHighlighter
          graph={graph}
          selectedNodeId={selectedNodeId}
          onPathSelect={setActivePath}
        />
      )}
      
      {/* Main SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-move"
        // **UPDATED**: SVG event handlers
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
          </marker>
          <marker id="arrowhead-highlighted" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
        
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {graph.edges.map((edge) => {
            const from = nodePositions.get(edge.from);
            const to = nodePositions.get(edge.to);
            if (!from || !to) return null;
            
            const isHighlighted = highlightedEdges.has(edge.id);
            const opacity = activePath && !isHighlighted ? 0.2 : 1;
            
            return (
              <line
                key={edge.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlighted ? '#3b82f6' : '#64748b'}
                strokeWidth={isHighlighted ? 3 : 2}
                strokeOpacity={opacity}
                markerEnd={isHighlighted ? 'url(#arrowhead-highlighted)' : 'url(#arrowhead)'}
                className="transition-all"
              />
            );
          })}
          
          {/* Nodes */}
          {graph.nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;
            
            const isSelected = selectedNodeId === node.id;
            const isHighlighted = highlightedNodes.has(node.id);
            const isSearchMatch = highlightedNodeIds.has(node.id);
            const isSearchSelected = selectedResult?.node.id === node.id;
            const opacity = activePath && !isHighlighted ? 0.3 : 1;
            
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x - pos.width / 2}, ${pos.y - pos.height / 2})`}
                opacity={opacity}
                onClick={() => handleNodeClickInternal(node.id)}
                className="cursor-pointer transition-all"
              >
                {(isSelected || isSearchSelected) && (
                  <rect
                    x={-4} y={-4}
                    width={pos.width + 8}
                    height={pos.height + 8}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    rx={node.kind === 'I' ? 6 : pos.width / 2}
                    className="animate-pulse"
                  />
                )}
                
                {isSearchMatch && !isSearchSelected && (
                  <rect
                    x={-2} y={-2}
                    width={pos.width + 4}
                    height={pos.height + 4}
                    fill="none"
                    stroke="#eab308"
                    strokeWidth={2}
                    rx={node.kind === 'I' ? 6 : pos.width / 2}
                  />
                )}
                
                <ZoomAwareAifNode
                  node={node}
                  width={pos.width}
                  height={pos.height}
                  isHovered={isSelected}
                  zoomLevel={zoom}
                />
              </g>
            );
          })}
        </g>
      </svg>
      
      <AifDiagramMinimap
        graph={graph}
        viewBox={viewBox}
        graphBounds={graphBounds}
        onNavigate={handleMinimapNavigate}
      />
      
      {/* **UPDATED**: Controls display text */}
      <div className="absolute bottom-4 left-4 bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600">
        <div className="font-semibold mb-1">Controls:</div>
        <div>• Drag to pan</div>
        <div>• Shift + Drag to zoom</div>
        <div>• Click node to select</div>
      </div>
      
      <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg px-4 py-2 text-xs">
        <div className="font-semibold text-gray-900">{graph.nodes.length} nodes</div>
        <div className="text-gray-500">{graph.edges.length} edges</div>
        <div className="text-blue-600 mt-1">✨ Dagre layout</div>
      </div>
    </div>
  );
}