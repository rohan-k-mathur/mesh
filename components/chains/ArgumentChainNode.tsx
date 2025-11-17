"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ChainNodeData } from "@/lib/types/argumentChain";
import { Network, Info } from "lucide-react";

interface ArgumentChainNodeProps extends NodeProps<ChainNodeData> {}

const roleColors: Record<string, string> = {
  PREMISE: "border-blue-500",
  EVIDENCE: "border-teal-500",
  CONCLUSION: "border-green-500",
  OBJECTION: "border-red-500",
  REBUTTAL: "border-orange-500",
  QUALIFIER: "border-purple-500",
  COMMENT: "border-gray-400",
};

const roleBgColors: Record<string, string> = {
  PREMISE: "bg-blue-100 text-blue-800",
  EVIDENCE: "bg-teal-100 text-teal-800",
  CONCLUSION: "bg-green-100 text-green-800",
  OBJECTION: "bg-red-100 text-red-800",
  REBUTTAL: "bg-orange-100 text-orange-800",
  QUALIFIER: "bg-purple-100 text-purple-800",
  COMMENT: "bg-gray-100 text-gray-600",
};

const ArgumentChainNode: React.FC<ArgumentChainNodeProps> = ({ data, selected }) => {
  const role = data.role || "PREMISE";
  const borderColor = roleColors[role] || "border-gray-400";
  const badgeColor = roleBgColors[role] || "bg-gray-100 text-gray-800";
  const isHighlighted = data.isHighlighted || false;
  const [showSchemeNetDetails, setShowSchemeNetDetails] = useState(false);

  // Check for multi-scheme structure
  const hasSchemeNet = data.argument.schemeNet !== null && data.argument.schemeNet !== undefined;
  const multipleSchemes = data.argument.argumentSchemes?.length > 1;
  const schemeCount = data.argument.argumentSchemes?.length || 0;
  const hasSchemeNetSteps = hasSchemeNet && data.argument.schemeNet?.steps?.length > 0;

  const showSchemeNetIndicator = hasSchemeNet && (hasSchemeNetSteps || multipleSchemes);

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
        {/* Role Badge and SchemeNet Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeColor}`}>
              {role}
            </span>
            {showSchemeNetIndicator && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSchemeNetDetails(!showSchemeNetDetails);
                }}
                className="relative group"
                title="Multi-scheme argument"
              >
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded border border-purple-300 hover:bg-purple-200 transition-colors">
                  <Network className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">{schemeCount}</span>
                </div>
              </button>
            )}
          </div>
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

        {/* SchemeNet Details Popover */}
        {showSchemeNetDetails && showSchemeNetIndicator && (
          <div 
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-purple-200 z-50 p-3 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-gray-800">Multi-Scheme Structure</h4>
              </div>
              <button
                onClick={() => setShowSchemeNetDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Schemes List */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-gray-600">
                Schemes ({schemeCount}):
              </div>
              {data.argument.argumentSchemes?.map((argScheme: any, idx: number) => (
                <div key={argScheme.id} className="flex items-start gap-2 bg-gray-50 rounded p-2">
                  <span className="text-[10px] font-mono text-gray-500 mt-0.5">#{idx + 1}</span>
                  <div className="flex-1 space-y-0.5">
                    <div className="text-xs font-medium text-gray-800">
                      {argScheme.scheme?.name || "Unknown Scheme"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        argScheme.isPrimary 
                          ? "bg-blue-100 text-blue-700" 
                          : argScheme.role === "supporting"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {argScheme.role || "primary"}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {Math.round(argScheme.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SchemeNet Info */}
            {hasSchemeNet && data.argument.schemeNet && (
              <div className="space-y-1.5 pt-2 border-t">
                <div className="text-xs font-medium text-gray-600">
                  SchemeNet:
                </div>
                <div className="bg-purple-50 rounded p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600">Overall Confidence:</span>
                    <span className="text-[10px] font-semibold text-purple-700">
                      {Math.round(data.argument.schemeNet.overallConfidence * 100)}%
                    </span>
                  </div>
                  {data.argument.schemeNet.description && (
                    <div className="text-[10px] text-gray-700 italic line-clamp-2">
                      {typeof data.argument.schemeNet.description === 'string' 
                        ? data.argument.schemeNet.description 
                        : JSON.stringify(data.argument.schemeNet.description)}
                    </div>
                  )}
                  {hasSchemeNetSteps && (
                    <div className="text-[10px] text-gray-600">
                      {data.argument.schemeNet.steps.length} sequential steps
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="flex items-start gap-1.5 text-[10px] text-gray-500 pt-1 border-t">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                This argument uses multiple argumentation schemes in a coordinated structure,
                indicating complex reasoning.
              </span>
            </div>
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
