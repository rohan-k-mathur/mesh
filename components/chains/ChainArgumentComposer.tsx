"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AIFArgumentWithSchemeComposer,
  AttackContext,
} from "@/components/arguments/AIFArgumentWithSchemeComposer";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import { getNewNodePosition } from "@/lib/utils/chainLayoutUtils";
import { Shield, Swords, Plus, MessageSquare } from "lucide-react";

/**
 * Context for the chain argument composer
 * Supports multiple modes for different argument creation scenarios
 */
export interface ChainComposerContext {
  mode: "support" | "attack";
  attackType?: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  targetNode?: {
    nodeId: string;
    argumentId: string;
    conclusionId?: string;
    conclusionText?: string;
  };
  targetEdge?: {
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
  };
  suggestedRole?: string;
  suggestedScheme?: string;
  scopeId?: string;
}

interface ChainArgumentComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliberationId: string;
  userId: string;
  chainId: string;
  context?: ChainComposerContext;
  onCreated?: (argument: any) => void;
  onSuccess?: () => void;
}

const ROLE_OPTIONS = [
  { value: "PREMISE", label: "Premise", description: "Provides foundational claim" },
  { value: "EVIDENCE", label: "Evidence", description: "Supports with data/facts" },
  { value: "CONCLUSION", label: "Conclusion", description: "Final claim being argued for" },
  { value: "OBJECTION", label: "Objection", description: "Challenges another argument" },
  { value: "REBUTTAL", label: "Rebuttal", description: "Responds to objection" },
  { value: "QUALIFIER", label: "Qualifier", description: "Adds conditions/scope" },
];

// Get default role based on context mode
function getDefaultRole(context?: ChainComposerContext): string {
  if (context?.suggestedRole) return context.suggestedRole;
  switch (context?.mode) {
    case "attack":
      return "OBJECTION";
    case "support":
      return "PREMISE";
    default:
      return "PREMISE";
  }
}

// Get edge type based on context mode
function getEdgeTypeForMode(context?: ChainComposerContext): string {
  if (context?.attackType) return context.attackType;
  switch (context?.mode) {
    case "attack":
      return "REBUTS";
    case "support":
      return "SUPPORTS";
    default:
      return "SUPPORTS";
  }
}

export function ChainArgumentComposer({
  open,
  onOpenChange,
  deliberationId,
  userId,
  chainId,
  context,
  onCreated,
  onSuccess,
}: ChainArgumentComposerProps) {
  const [selectedRole, setSelectedRole] = useState<string>(getDefaultRole(context));
  const [isCreating, setIsCreating] = useState(false);

  const { nodes, addNode, addEdge } = useChainEditorStore();

  // Derive attack context from chain context for the composer
  const attackContext: AttackContext | null = (() => {
    if (context?.mode !== "attack") return null;
    
    if (context.targetNode) {
      const attackType = context.attackType || "REBUTS";
      if (attackType === "REBUTS") {
        return {
          mode: "REBUTS" as const,
          targetClaimId: context.targetNode.argumentId,
          hint: `Challenging: "${context.targetNode.conclusionText || "this argument"}"`,
        };
      }
      if (attackType === "UNDERMINES") {
        return {
          mode: "UNDERMINES" as const,
          targetPremiseId: context.targetNode.argumentId,
          hint: `Undermining premise of: "${context.targetNode.conclusionText || "this argument"}"`,
        };
      }
      if (attackType === "UNDERCUTS") {
        return {
          mode: "UNDERCUTS" as const,
          targetArgumentId: context.targetNode.argumentId,
          hint: `Challenging reasoning in: "${context.targetNode.conclusionText || "this argument"}"`,
        };
      }
    }
    
    if (context.targetEdge) {
      return {
        mode: "UNDERCUTS" as const,
        targetArgumentId: context.targetEdge.edgeId,
        hint: "Challenging the inference connection",
      };
    }
    
    return null;
  })();

  // Get title and description based on mode
  const getDialogContent = () => {
    const isUndercut = context?.attackType === "UNDERCUTS";
    const isUndermine = context?.attackType === "UNDERMINES";
    
    switch (context?.mode) {
      case "attack":
        if (isUndercut) {
          return {
            title: "Challenge Inference",
            description: context.targetEdge 
              ? "Challenge the reasoning connection between these arguments"
              : `Challenge the reasoning that leads to: "${context.targetNode?.conclusionText || "this conclusion"}"`,
            icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
            accentColor: "purple",
          };
        }
        if (isUndermine) {
          return {
            title: "Undermine Premise",
            description: `Challenge a premise supporting: "${context.targetNode?.conclusionText || "this conclusion"}"`,
            icon: <Swords className="w-5 h-5 text-orange-500" />,
            accentColor: "orange",
          };
        }
        return {
          title: "Create Objection",
          description: `Build an argument that challenges: "${context.targetNode?.conclusionText || "this argument"}"`,
          icon: <Swords className="w-5 h-5 text-red-500" />,
          accentColor: "red",
        };
      case "support":
        return {
          title: "Create Supporting Argument",
          description: `Build an argument that supports: "${context.targetNode?.conclusionText || "this argument"}"`,
          icon: <Shield className="w-5 h-5 text-green-500" />,
          accentColor: "green",
        };
      default:
        return {
          title: "Create New Argument",
          description: "Build a structured argument with premises and conclusion",
          icon: <Plus className="w-5 h-5 text-sky-500" />,
          accentColor: "sky",
        };
    }
  };

  const dialogContent = getDialogContent();

  const handleCreated = useCallback(
    async (argumentId: string, argument?: any) => {
      if (isCreating) return;
      setIsCreating(true);

      try {
        // If external handler provided, delegate to it
        if (onCreated && argument) {
          onCreated(argument);
          return;
        }

        // Otherwise handle internally
        // 1. Add argument as node to the chain
        const nodeResponse = await fetch(`/api/argument-chains/${chainId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            argumentId,
            role: selectedRole,
          }),
        });

        if (!nodeResponse.ok) {
          throw new Error("Failed to add node to chain");
        }

        const { node: nodeData } = await nodeResponse.json();

        // Calculate position for new node
        const position = getNewNodePosition(nodes, 280, 180);

        // Add to local state
        addNode({
          id: nodeData.id,
          type: "argumentNode",
          position,
          data: {
            argument: nodeData.argument,
            role: nodeData.role,
            addedBy: nodeData.contributor,
            nodeOrder: nodeData.nodeOrder,
          },
        });

        // 2. If we have a target node, create the edge automatically
        if (context?.targetNode) {
          const edgeType = getEdgeTypeForMode(context);
          
          // Determine source and target based on mode
          // For attacks: new node attacks target (new -> target with REBUTS)
          // For support: new node supports target (new -> target with SUPPORTS)
          const edgeResponse = await fetch(`/api/argument-chains/${chainId}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceNodeId: nodeData.id,
              targetNodeId: context.targetNode.nodeId,
              edgeType,
              strength: 0.8,
              description: context.mode === "attack" 
                ? "Challenges this claim"
                : "Supports this claim",
            }),
          });

          if (edgeResponse.ok) {
            const { edge: edgeData } = await edgeResponse.json();
            
            // Add edge to local state
            addEdge({
              id: edgeData.id,
              source: nodeData.id,
              target: context.targetNode.nodeId,
              type: "chainEdge",
              data: {
                edgeType,
                strength: 0.8,
              },
            });
          }
        }

        // 3. If we have a target edge (undercut), handle edge attack
        if (context?.targetEdge && context.attackType === "UNDERCUTS") {
          const attackResponse = await fetch(`/api/argument-chains/${chainId}/attack-edge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              argumentId,
              edgeId: context.targetEdge.edgeId,
              role: selectedRole,
            }),
          });

          if (!attackResponse.ok) {
            console.error("Failed to create edge attack");
          }
        }

        onOpenChange(false);
        onSuccess?.();
      } catch (error) {
        console.error("Failed to create argument in chain context:", error);
      } finally {
        setIsCreating(false);
      }
    },
    [chainId, selectedRole, nodes, addNode, addEdge, context, onOpenChange, onSuccess, onCreated, isCreating]
  );

  // Reset role when context changes
  useEffect(() => {
    setSelectedRole(getDefaultRole(context));
  }, [context]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dialogContent.icon}
            {dialogContent.title}
          </DialogTitle>
          <DialogDescription>{dialogContent.description}</DialogDescription>
        </DialogHeader>

        {/* Context Banner */}
        {context && (
          <div
            className={`p-3 rounded-lg border ${
              context.mode === "attack"
                ? context.attackType === "UNDERCUTS" 
                  ? "bg-purple-50 border-purple-200"
                  : context.attackType === "UNDERMINES"
                  ? "bg-orange-50 border-orange-200"
                  : "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {dialogContent.icon}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    context.mode === "attack"
                      ? context.attackType === "UNDERCUTS"
                        ? "text-purple-800"
                        : context.attackType === "UNDERMINES"
                        ? "text-orange-800"
                        : "text-red-800"
                      : "text-green-800"
                  }`}
                >
                  {context.mode === "attack"
                    ? context.attackType === "UNDERCUTS"
                      ? "Challenging inference"
                      : context.attackType === "UNDERMINES"
                      ? "Undermining a premise"
                      : "Creating an objection"
                    : "Creating supporting evidence"}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    context.mode === "attack"
                      ? context.attackType === "UNDERCUTS"
                        ? "text-purple-600"
                        : context.attackType === "UNDERMINES"
                        ? "text-orange-600"
                        : "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {context.targetNode
                    ? `Target: "${context.targetNode.conclusionText || "argument"}"`
                    : context.targetEdge
                    ? "Target: inference connection"
                    : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Role selector */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Role in Chain</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{role.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {role.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AIFArgumentWithSchemeComposer
          deliberationId={deliberationId}
          authorId={userId}
          conclusionClaim={null}
          defaultSchemeKey={null}
          attackContext={attackContext}
          onCreated={handleCreated}
        />

        {isCreating && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Adding to chain...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ChainArgumentComposer;
