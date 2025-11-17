"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ChainNodeData } from "@/lib/types/argumentChain";

interface ArgumentChainNodeProps extends NodeProps<ChainNodeData> {}

const roleColors: Record<string, string> = {
  PREMISE: "border-blue-500",
  EVIDENCE: "border-teal-500",
  CONCLUSION: "border-green-500",
  OBJECTION: "border-red-500",
  REBUTTAL: "border-orange-500",
  QUALIFIER: "border-purple-500",
};

const roleBgColors: Record<string, string> = {
  PREMISE: "bg-blue-100 text-blue-800",
  EVIDENCE: "bg-teal-100 text-teal-800",
  CONCLUSION: "bg-green-100 text-green-800",
  OBJECTION: "bg-red-100 text-red-800",
  REBUTTAL: "bg-orange-100 text-orange-800",
  QUALIFIER: "bg-purple-100 text-purple-800",
};

const ArgumentChainNode: React.FC<ArgumentChainNodeProps> = ({ data, selected }) => {
  const role = data.role || "PREMISE";
  const borderColor = roleColors[role] || "border-gray-400";
  const badgeColor = roleBgColors[role] || "bg-gray-100 text-gray-800";
  const isHighlighted = data.isHighlighted || false;

  return (
    <div
      className={`
        relative w-[280px] bg-white rounded-lg shadow-md border-l-4 ${borderColor}
        ${selected ? "ring-2 ring-blue-400 shadow-lg" : ""}
        ${isHighlighted ? "ring-4 ring-yellow-400 shadow-xl animate-pulse" : ""}
        transition-all duration-200
      `}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Role Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeColor}`}>
            {role}
          </span>
          {data.nodeOrder !== undefined && (
            <span className="text-xs text-gray-500 font-mono">#{data.nodeOrder}</span>
          )}
        </div>

        {/* Argument Preview */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-800 line-clamp-2">
            {data.argument.title || "Untitled Argument"}
          </h4>
          {data.argument.text && (
            <p className="text-xs text-gray-600 line-clamp-3">{data.argument.text}</p>
          )}
        </div>

        {/* Contributor */}
        {data.addedBy && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">Added by:</span>
            <span className="text-[10px] font-medium text-gray-700">
              {data.addedBy.name || "Unknown"}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(ArgumentChainNode);
