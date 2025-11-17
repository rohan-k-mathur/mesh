"use client";

import React, { memo } from "react";
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from "reactflow";
import { ChainEdgeData } from "@/lib/types/argumentChain";
import { getEdgeTypeConfig, getEdgeStrokeWidth } from "@/lib/constants/chainEdgeTypes";

interface ArgumentChainEdgeProps extends EdgeProps<ChainEdgeData> {}

const ArgumentChainEdge: React.FC<ArgumentChainEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}) => {
  const edgeConfig = getEdgeTypeConfig(data?.edgeType || "SUPPORTS");
  const strokeWidth = getEdgeStrokeWidth(data?.strength || 0.5);
  const isTargeted = (data as any)?.isTargeted || false;
  const attackCount = (data as any)?.attackCount || 0;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Base Edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isTargeted ? "#ef4444" : selected ? "#3b82f6" : edgeConfig.color,
          strokeWidth: isTargeted ? strokeWidth + 2 : selected ? strokeWidth + 1 : strokeWidth,
          strokeDasharray: edgeConfig.strokeDasharray,
        }}
        markerEnd={markerEnd}
      />

      {/* Edge Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div
            className={`
              px-2 py-1 text-xs font-medium rounded shadow-sm
              ${isTargeted ? "bg-red-100 text-red-800 border border-red-300 animate-pulse" : selected ? "bg-blue-100 text-blue-800 border border-blue-300" : "bg-white text-gray-700 border border-gray-200"}
              transition-colors duration-200
            `}
            style={{
              borderLeftWidth: "3px",
              borderLeftColor: isTargeted ? "#ef4444" : edgeConfig.color,
            }}
          >
            <div className="flex items-center gap-1.5">
              {isTargeted && <span className="text-xs">🎯</span>}
              <span>{edgeConfig.label}</span>
              {data?.strength !== undefined && (
                <span className="text-[10px] opacity-70">
                  {Math.round(data.strength * 100)}%
                </span>
              )}
              {attackCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-red-200 text-red-800 rounded-full">
                  ⚔️ {attackCount}
                </span>
              )}
            </div>
            {data?.description && (
              <div className="text-[10px] text-gray-500 mt-0.5 max-w-[120px] truncate">
                {data.description}
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(ArgumentChainEdge);
