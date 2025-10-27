// lib/tiptap/extensions/argument-node.tsx
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import React from "react";
import { Quote, Shield, Swords } from "lucide-react";

// React component for rendering the argument
function ArgumentNodeView({ node }: NodeViewProps) {
  const { argumentId, text, scheme, role, authorName } = node.attrs as {
    argumentId: string;
    text: string;
    scheme?: string;
    role?: "PREMISE" | "OBJECTION" | "REBUTTAL";
    authorName?: string;
  };

  const roleConfig = {
    PREMISE: {
      icon: Shield,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "Premise",
    },
    OBJECTION: {
      icon: Swords,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      label: "Objection",
    },
    REBUTTAL: {
      icon: Shield,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      label: "Rebuttal",
    },
  };

  const config = role ? roleConfig[role] : roleConfig.PREMISE;
  const Icon = config.icon;

  return (
    <NodeViewWrapper
      as="div"
      className="argument-embed not-prose my-4"
      data-argument-id={argumentId}
    >
      <div
        className={`rounded-lg border-2 ${config.border} ${config.bg} p-4 shadow-sm hover:shadow-md transition-shadow`}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Quote className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Argument
              </span>
              {role && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    role === "PREMISE"
                      ? "bg-blue-100 text-blue-800"
                      : role === "OBJECTION"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {config.label}
                </span>
              )}
              {scheme && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {scheme}
                </span>
              )}
            </div>
            <p className="text-slate-900 font-medium leading-relaxed">
              {text}
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
export const ArgumentNode = Node.create({
  name: "argumentNode",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      argumentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-argument-id"),
        renderHTML: (attributes) => ({
          "data-argument-id": attributes.argumentId,
        }),
      },
      text: {
        default: "",
      },
      scheme: {
        default: null,
      },
      role: {
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
        tag: 'div[data-type="argument-node"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "argument-node" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ArgumentNodeView);
  },
});
