/**
 * Phase 3: Enhanced AIF Node Components with Conflict Type Visualization
 * 
 * This file extends the base AIF node rendering with:
 * - Detailed conflict type visualization for CA nodes
 * - Semantic zoom (detail levels)
 * - Enhanced visual differentiation
 */

import type { AifNode, AifNodeKind } from '@/lib/arguments/diagram';

// Map legacy attack types to AIF CA schemes
export const conflictSchemes = {
  rebut: {
    label: 'Logical Conflict',
    color: '#ef4444', // red-500
    icon: '⊥',
    description: 'Direct rebuttal of the conclusion'
  },
  undercut: {
    label: 'Inference Attack',
    color: '#f59e0b', // amber-500
    icon: '⇏',
    description: 'Challenges the reasoning step'
  },
  undermine: {
    label: 'Premise Challenge',
    color: '#ec4899', // pink-500
    icon: '⊗',
    description: 'Questions a premise'
  },
} as const;

export type ConflictSchemeKey = keyof typeof conflictSchemes;

// Get conflict scheme details
export function getConflictScheme(schemeKey?: string) {
  if (!schemeKey) return null;
  return conflictSchemes[schemeKey as ConflictSchemeKey] || {
    label: 'CA',
    color: '#ef4444',
    icon: '⚔',
    description: 'Conflict'
  };
}

// Enhanced CA Node with conflict type visualization
export function EnhancedCANode({
  node,
  width,
  height,
  isHovered,
  zoomLevel = 1,
}: {
  node: AifNode;
  width: number;
  height: number;
  isHovered?: boolean;
  zoomLevel?: number;
}) {
  const scheme = getConflictScheme(node.schemeKey ?? undefined);
  const showDetails = zoomLevel > 0.5; // Show details when zoomed in
  const showIcon = zoomLevel > 0.75; // Show icon only when well zoomed in

  if (!scheme) {
    // Fallback to basic CA node
    return (
      <g>
        {/* <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2 - 2}
          ry={height / 2 - 2}
           */}
                 <rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        rx={4}
          fill="#fef2f2"
          stroke="#ef4444"
          strokeWidth={isHovered ? 3 : 2}
          className="transition-all"
        />
        <text
          x={width / 2}
          y={height / 2}
          className="text-xs font-medium fill-red-700"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          CA
        </text>
      </g>
    );
  }

  return (
    <g>
      {/* Main shape */}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - 2}
        ry={height / 2 - 2}
        fill={`${scheme.color}15`}
        stroke={scheme.color}
        strokeWidth={isHovered ? 3 : 2}
        strokeDasharray={node.schemeKey === 'undercut' ? '4,2' : undefined}
        className="transition-all"
      />

      {/* Label */}
      {showDetails ? (
        <text
          x={width / 2}
          y={height / 2 - 4}
          className="text-[10px] font-semibold"
          fill={scheme.color}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {scheme.label}
        </text>
      ) : (
        <text
          x={width / 2}
          y={height / 2}
          className="text-xs font-medium"
          fill={scheme.color}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          CA
        </text>
      )}

      {/* Icon indicator for specific types */}
      {showIcon && node.schemeKey === 'undercut' && (
        <circle
          cx={width - 6}
          cy={6}
          r={5}
          fill={scheme.color}
          className="animate-pulse"
        />
      )}

      {/* Tooltip info (hidden, for future tooltip implementation) */}
      <title>{scheme.description}</title>
    </g>
  );
}

// Enhanced RA Node with zoom-aware details
export function EnhancedRANode({
  node,
  width,
  height,
  isHovered,
  zoomLevel = 1,
}: {
  node: AifNode;
  width: number;
  height: number;
  isHovered?: boolean;
  zoomLevel?: number;
}) {
  const showScheme = zoomLevel > 0.75;
  const showLabel = zoomLevel > 0.5;

  return (
    <g>
      {/* Main shape */}
      {/* <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - 2}
        ry={height / 2 - 2}
        fill="#eff6ff"
        stroke="#3b82f6"
        strokeWidth={isHovered ? 3 : 2}
        className="transition-all"
      /> */}
       <rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        rx={4}
        fill="#e7ebf3ff"
        stroke="#3b82f6"
        strokeWidth={isHovered ? 3 : 2}
        className="transition-all"
      />

      {/* Text content */}
      {showLabel ? (
        <>
          <text
            x={width / 2}
            y={height / 2 - 4}
            className="text-xs font-medium fill-blue-700"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            RA
          </text>
          {showScheme && node.schemeKey && (
            <text
              x={width / 2}
              y={height / 2 + 8}
              className="text-[9px] fill-blue-600"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {node.schemeKey}
            </text>
          )}
        </>
      ) : (
        <text
          x={width / 2}
          y={height / 2}
          className="text-xs font-medium fill-blue-700"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          RA
        </text>
      )}
    </g>
  );
}

// Enhanced I Node with zoom-aware text truncation
export function EnhancedINode({
  node,
  width,
  height,
  isHovered,
  zoomLevel = 1,
}: {
  node: AifNode;
  width: number;
  height: number;
  isHovered?: boolean;
  zoomLevel?: number;
}) {
  const showFullText = zoomLevel > 0.75;
  const showText = zoomLevel > 0.3;
  
  // Truncate text based on zoom
  const displayText = node.label  || '';
  const maxChars = showFullText ? 100 : zoomLevel > 0.5 ? 50 : 20;
  const truncatedText = displayText.length > maxChars 
    ? displayText.substring(0, maxChars) + '...' 
    : displayText;

  return (
    <g>
      {/* Main shape */}
      <rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        rx={4}
        fill="#fefce8"
        stroke="#eab308"
        strokeWidth={isHovered ? 3 : 2}
        className="transition-all"
      />

      {/* Text with zoom-aware wrapping */}
      {showText && (
        <foreignObject x={6} y={6} width={width - 12} height={height - 12}>
          <div 
            className="flex items-center justify-center h-full text-center"
            style={{ 
              fontSize: zoomLevel > 0.75 ? '11px' : zoomLevel > 0.5 ? '10px' : '9px',
              lineHeight: '1.2'
            }}
          >
            <span className="text-yellow-800 font-normal">
              {truncatedText}
            </span>
          </div>
        </foreignObject>
      )}

      {/* Show just "I" when very zoomed out */}
      {!showText && (
        <text
          x={width / 2}
          y={height / 2}
          className="text-[10px] font-medium fill-yellow-700"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          I
        </text>
      )}
    </g>
  );
}

// Enhanced PA Node
export function EnhancedPANode({
  node,
  width,
  height,
  isHovered,
  zoomLevel = 1,
}: {
  node: AifNode;
  width: number;
  height: number;
  isHovered?: boolean;
  zoomLevel?: number;
}) {
  const showScheme = zoomLevel > 0.75;

  return (
    <g>
      {/* <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - 2}
        ry={height / 2 - 2} */}
              <rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        rx={4}
        fill="#f0fdf4"
        stroke="#22c55e"
        strokeWidth={isHovered ? 3 : 2}
        className="transition-all"
      />
      
      {showScheme && node.schemeKey ? (
        <>
          <text
            x={width / 2}
            y={height / 2 - 4}
            className="text-xs font-medium fill-green-700"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            PA
          </text>
          <text
            x={width / 2}
            y={height / 2 + 8}
            className="text-[9px] fill-green-600"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {node.schemeKey}
          </text>
        </>
      ) : (
        <text
          x={width / 2}
          y={height / 2}
          className="text-xs font-medium fill-green-700"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          PA
        </text>
      )}
    </g>
  );
}

// Zoom-aware node renderer
export function ZoomAwareAifNode({
  node,
  width,
  height,
  isHovered,
  zoomLevel = 1,
}: {
  node: AifNode;
  width: number;
  height: number;
  isHovered?: boolean;
  zoomLevel?: number;
}) {
  switch (node.kind) {
    case 'I':
      return <EnhancedINode node={node} width={width} height={height} isHovered={isHovered} zoomLevel={zoomLevel} />;
    case 'RA':
      return <EnhancedRANode node={node} width={width} height={height} isHovered={isHovered} zoomLevel={zoomLevel} />;
    case 'CA':
      return <EnhancedCANode node={node} width={width} height={height} isHovered={isHovered} zoomLevel={zoomLevel} />;
    case 'PA':
      return <EnhancedPANode node={node} width={width} height={height} isHovered={isHovered} zoomLevel={zoomLevel} />;
    default:
      return null;
  }
}