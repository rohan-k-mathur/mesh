/**
 * ChainsTab Component
 * Tab content for viewing and managing argument chains in a deliberation
 * 
 * Task 1.7: Add "Chains" tab to deliberation view
 */

"use client";

import React, { useState } from "react";
import { Link2, Plus, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChainListPanel } from "@/components/chains/ChainListPanel";
import { ArgumentChainThread } from "@/components/chains/ArgumentChainThread";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ===== Types =====

interface ChainsTabProps {
  deliberationId: string;
  currentUserId?: string | null;
  
  /** Callback when user clicks on an argument */
  onArgumentClick?: (argumentId: string) => void;
  
  /** Callback when user wants to attack an argument */
  onAttackArgument?: (argumentId: string) => void;
  
  /** Callback when user wants to discuss an argument */
  onDiscussArgument?: (argumentId: string) => void;
  
  /** Callback to switch to another tab */
  onTabChange?: (tab: any) => void;
  
  /** Currently selected argument ID */
  selectedArgumentId?: string;
}

// ===== Main Component =====

export function ChainsTab({
  deliberationId,
  currentUserId,
  onArgumentClick,
  onAttackArgument,
  onDiscussArgument,
  onTabChange,
  selectedArgumentId,
}: ChainsTabProps) {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "thread">("list");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Handle chain click - expand inline or open thread view
  const handleChainClick = (chainId: string) => {
    setSelectedChainId(chainId);
    // For now, keep in list mode with expansion
    // Future: could switch to full thread view
  };

  // Handle view chain as graph
  const handleViewChainGraph = (chainId: string) => {
    // Navigate to chain canvas view
    window.open(`/chain/${chainId}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Argument Chains</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
            <Button
              variant={viewMode === "thread" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3"
              onClick={() => setViewMode("thread")}
              disabled={!selectedChainId}
            >
              Thread
            </Button>
          </div>

          {/* Create Chain Button */}
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Chain
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
        <p className="text-sm text-indigo-700">
          <strong>Argument chains</strong> organize related arguments into logical sequences.
          They help visualize how premises lead to conclusions and how arguments support or attack each other.
        </p>
      </div>

      {/* Main Content */}
      {viewMode === "list" ? (
        <ChainListPanel
          deliberationId={deliberationId}
          showCreate={true}
          onCreateChain={() => setShowCreateDialog(true)}
          onChainClick={handleChainClick}
          onViewChainGraph={handleViewChainGraph}
          onAttackArgument={onAttackArgument}
          onDiscussArgument={onDiscussArgument}
          currentArgumentId={selectedArgumentId}
        />
      ) : selectedChainId ? (
        <div className="border rounded-lg p-4 bg-white">
          <ArgumentChainThread
            chainId={selectedChainId}
            currentArgumentId={selectedArgumentId}
            onViewGraph={() => handleViewChainGraph(selectedChainId)}
            onAttack={onAttackArgument}
            onDiscuss={onDiscussArgument}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-slate-500">
          Select a chain to view in thread mode
        </div>
      )}

      {/* Create Chain Dialog - Placeholder */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Chain</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Chain creation will be available in Phase 2 (Linear Construction Interface).
              For now, chains can be created programmatically or via the API.
            </p>
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Network className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                <strong>Coming soon:</strong> Visual chain builder with drag-and-drop argument selection.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChainsTab;
