// lib/tiptap/extensions/claim-node.tsx
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import React from "react";
import { MessageSquare, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

// React component for rendering the claim
function ClaimNodeView({ node }: NodeViewProps) {
  const { claimId, claimText, position, authorName } = node.attrs as {
    claimId: string;
    claimText: string;
    position?: "IN" | "OUT" | "UNDEC";
    authorName?: string;
  };

  const positionConfig = {
    IN: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    OUT: {
      icon: XCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
    UNDEC: {
      icon: MinusCircle,
      color: "text-slate-600",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
  };

  const config = position ? positionConfig[position] : positionConfig.UNDEC;
  const Icon = config.icon;

  return (
    <NodeViewWrapper
      as="div"
      className="claim-embed not-prose my-4"
      data-claim-id={claimId}
    >
      <div
        className={`rounded-lg border-2 ${config.border} ${config.bg} p-4 shadow-sm hover:shadow-md transition-shadow`}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Claim
              </span>
              {position && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    position === "IN"
                      ? "bg-emerald-100 text-emerald-800"
                      : position === "OUT"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {position}
                </span>
              )}
            </div>
            <p className="text-slate-900 font-medium leading-relaxed">
              {claimText}
            </p>
            {authorName && (
              <p className="text-xs text-slate-500 mt-2">— {authorName}</p>
            )}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// TipTap extension definition
export const ClaimNode = Node.create({
  name: "claimNode",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      claimId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-claim-id"),
        renderHTML: (attributes) => ({
          "data-claim-id": attributes.claimId,
        }),
      },
      claimText: {
        default: "",
      },
      position: {
        default: null,
      },
      authorName: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="claim-node"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "claim-node" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ClaimNodeView);
  },
});
