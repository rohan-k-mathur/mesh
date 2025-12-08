/**
 * ChainsTab Component
 * Tab content for viewing and managing argument chains in a deliberation
 * 
 * Task 1.7: Add "Chains" tab to deliberation view
 * 
 * Updated to include full modal functionality matching ThreadedDiscussionTab:
 * - View Details modal (ArgumentCardV2)
 * - Preview Network modal (MiniNeighborhoodPreview)
 * - Reply modal (PropositionComposerPro)
 * - Support modal (AIFArgumentWithSchemeComposer)
 * - Attack modal flow (AttackSuggestions + AttackArgumentWizard)
 */

"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Link2, Plus, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChainListPanel } from "@/components/chains/ChainListPanel";
import { ArgumentChainThread } from "@/components/chains/ArgumentChainThread";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArgumentCardV2 } from "@/components/arguments/ArgumentCardV2";
import { MiniNeighborhoodPreview } from "@/components/aif/MiniNeighborhoodPreview";
import { PropositionComposerPro } from "@/components/propositions/PropositionComposerPro";
import { AIFArgumentWithSchemeComposer } from "@/components/arguments/AIFArgumentWithSchemeComposer";
import { AttackSuggestions } from "@/components/argumentation/AttackSuggestions";
import { AttackArgumentWizard } from "@/components/argumentation/AttackArgumentWizard";
import type { AttackSuggestion } from "@/app/server/services/ArgumentGenerationService";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

// ===== Types =====

/** Action target representing an argument from the chain */
interface ActionTarget {
  argumentId: string;
  claimId?: string;
  text?: string;
}

interface ChainsTabProps {
  deliberationId: string;
  currentUserId?: string | null;
  
  /** Callback to switch to another tab */
  onTabChange?: (tab: any) => void;
  
  /** Currently selected argument ID */
  selectedArgumentId?: string;
}

// ===== Main Component =====

export function ChainsTab({
  deliberationId,
  currentUserId,
  onTabChange,
  selectedArgumentId,
}: ChainsTabProps) {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "thread">("list");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Modal state - matches ThreadedDiscussionTab pattern
  const [previewArgumentId, setPreviewArgumentId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [expandModalOpen, setExpandModalOpen] = useState(false);
  const [expandArgumentId, setExpandArgumentId] = useState<string | null>(null);
  
  // Action modal state
  const [replyMode, setReplyMode] = useState(false);
  const [supportMode, setSupportMode] = useState(false);
  const [attackMode, setAttackMode] = useState(false);
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  
  // Attack flow state
  const [selectedAttack, setSelectedAttack] = useState<AttackSuggestion | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Fetch argument details when needed for modals
  const { data: argumentData, mutate: mutateArgument } = useSWR(
    expandArgumentId ? `/api/arguments/${expandArgumentId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch neighborhood for preview
  const { data: neighborhoodData, error: neighborhoodError, isLoading: neighborhoodLoading } = useSWR(
    previewArgumentId ? `/api/arguments/${previewArgumentId}/aif-neighborhood?depth=1` : null,
    fetcher
  );

  // Handle chain click - expand inline or open thread view
  const handleChainClick = (chainId: string) => {
    setSelectedChainId(chainId);
  };

  // Handle view chain as graph
  const handleViewChainGraph = (chainId: string) => {
    window.open(`/chain/${chainId}`, "_blank");
  };

  // ===== Action Handlers (matching ThreadedDiscussionTab) =====

  // Handle View Details - open ArgumentCardV2 modal
  const handleViewArgument = (argumentId: string) => {
    setExpandArgumentId(argumentId);
    setExpandModalOpen(true);
  };

  // Handle Preview Network - open MiniNeighborhoodPreview modal
  const handlePreviewArgument = (argumentId: string) => {
    setPreviewArgumentId(argumentId);
    setPreviewModalOpen(true);
  };

  // Handle Reply - open PropositionComposerPro modal
  const handleReplyArgument = async (argumentId: string) => {
    // Fetch argument data to get text preview
    try {
      const res = await fetch(`/api/arguments/${argumentId}`);
      const data = await res.json();
      setActionTarget({
        argumentId,
        claimId: data?.conclusionClaimId || data?.claim?.id,
        text: data?.claim?.text || data?.text || "Argument",
      });
      setReplyMode(true);
    } catch (e) {
      // Fallback without text
      setActionTarget({ argumentId, text: "Argument" });
      setReplyMode(true);
    }
  };

  // Handle Support - open AIFArgumentWithSchemeComposer modal
  const handleSupportArgument = async (argumentId: string) => {
    try {
      const res = await fetch(`/api/arguments/${argumentId}`);
      const data = await res.json();
      const claimId = data?.conclusionClaimId || data?.claim?.id;
      
      if (!claimId) {
        toast.error("Cannot support this argument - no claim ID found");
        return;
      }
      
      setActionTarget({
        argumentId,
        claimId,
        text: data?.claim?.text || data?.text || "Argument",
      });
      setSupportMode(true);
    } catch (e) {
      toast.error("Failed to load argument data");
    }
  };

  // Handle Attack - open AttackSuggestions modal
  const handleAttackArgument = async (argumentId: string) => {
    if (!currentUserId) {
      toast.error("Please sign in to create attacks");
      return;
    }

    try {
      const res = await fetch(`/api/arguments/${argumentId}`);
      const data = await res.json();
      const claimId = data?.conclusionClaimId || data?.claim?.id;
      
      if (!claimId) {
        toast.error("Cannot attack this argument - missing conclusion claim");
        return;
      }
      
      setActionTarget({
        argumentId,
        claimId,
        text: data?.claim?.text || data?.text || "Argument",
      });
      setAttackMode(true);
    } catch (e) {
      toast.error("Failed to load argument data");
    }
  };

  // Close composer modals and refresh data
  const handleComposerSuccess = () => {
    setReplyMode(false);
    setSupportMode(false);
    setAttackMode(false);
    setWizardOpen(false);
    setActionTarget(null);
    setSelectedAttack(null);
    mutateArgument(); // Refresh argument data
    toast.success("Successfully posted!");
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
          onViewArgument={handleViewArgument}
          onPreviewArgument={handlePreviewArgument}
          onReplyArgument={handleReplyArgument}
          onSupportArgument={handleSupportArgument}
          onAttackArgument={handleAttackArgument}
          currentArgumentId={selectedArgumentId}
        />
      ) : selectedChainId ? (
        <div className="border rounded-lg p-4 bg-white">
          <ArgumentChainThread
            chainId={selectedChainId}
            currentArgumentId={selectedArgumentId}
            onViewGraph={() => handleViewChainGraph(selectedChainId)}
            onViewArgument={handleViewArgument}
            onPreview={handlePreviewArgument}
            onReply={handleReplyArgument}
            onSupport={handleSupportArgument}
            onAttack={handleAttackArgument}
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

      {/* Preview Network Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-[750px] bg-white/15 backdrop-blur-md border-2 border-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="tracking-wide font-medium">AIF Neighborhood Preview</DialogTitle>
          </DialogHeader>
          <div className="py-0">
            <MiniNeighborhoodPreview
              data={neighborhoodData}
              loading={neighborhoodLoading}
              error={neighborhoodError}
              maxWidth={700}
              maxHeight={400}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Argument Details Modal (ArgumentCardV2) */}
      {expandModalOpen && expandArgumentId && argumentData && (
        <Dialog open={expandModalOpen} onOpenChange={(open) => !open && setExpandModalOpen(false)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-white overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Argument Details</DialogTitle>
            </DialogHeader>
            <ArgumentCardV2
              deliberationId={deliberationId}
              authorId={currentUserId || ""}
              id={argumentData.id || expandArgumentId}
              conclusion={{
                id: argumentData.conclusionClaimId || argumentData.claim?.id || expandArgumentId,
                text: argumentData.claim?.text || argumentData.text || "Untitled claim"
              }}
              premises={argumentData.premises || []}
              schemeKey={argumentData.schemeKey}
              schemeName={argumentData.schemeName}
              onAnyChange={() => mutateArgument()}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Composer Modal */}
      {replyMode && actionTarget && (
        <Dialog open={replyMode} onOpenChange={(open) => !open && setReplyMode(false)}>
          <DialogContent className="max-w-3xl max-h-[90vh] bg-white overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Reply to Argument
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Replying to: {actionTarget.text?.slice(0, 100)}...
              </p>
            </DialogHeader>
            <PropositionComposerPro
              deliberationId={deliberationId}
              replyTarget={
                actionTarget.claimId
                  ? { kind: "claim", id: actionTarget.claimId }
                  : { kind: "argument", id: actionTarget.argumentId }
              }
              onPosted={handleComposerSuccess}
              placeholder="Write your reply..."
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Support Composer Modal */}
      {supportMode && actionTarget && actionTarget.claimId && (
        <Dialog open={supportMode} onOpenChange={(open) => !open && setSupportMode(false)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-white overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Create Supporting Argument
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Supporting: {actionTarget.text?.slice(0, 100)}...
              </p>
            </DialogHeader>
            <AIFArgumentWithSchemeComposer
              deliberationId={deliberationId}
              authorId={currentUserId || ""}
              conclusionClaim={{
                id: actionTarget.claimId,
                text: actionTarget.text || ""
              }}
              onCreated={handleComposerSuccess}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Attack Suggestions Dialog */}
      {attackMode && actionTarget && actionTarget.argumentId && actionTarget.claimId && !wizardOpen && (
        <Dialog 
          open={attackMode && !wizardOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setAttackMode(false);
              setActionTarget(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Strategic Attack</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Attacking: {actionTarget.text?.slice(0, 100)}...
              </p>
            </DialogHeader>
            {currentUserId && (
              <AttackSuggestions
                targetClaimId={actionTarget.claimId}
                targetArgumentId={actionTarget.argumentId}
                userId={currentUserId}
                onAttackSelect={(suggestion) => {
                  console.log("[ChainsTab] Attack selected:", suggestion);
                  setSelectedAttack(suggestion);
                  setWizardOpen(true);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Attack Construction Wizard Dialog */}
      {wizardOpen && actionTarget && actionTarget.argumentId && actionTarget.claimId && selectedAttack && (
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-6xl bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Construct Attack</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Attacking: {actionTarget.text?.slice(0, 100)}...
              </p>
            </DialogHeader>
            {currentUserId && (
              <AttackArgumentWizard
                suggestion={selectedAttack}
                targetArgumentId={actionTarget.argumentId}
                targetClaimId={actionTarget.claimId}
                deliberationId={deliberationId}
                currentUserId={currentUserId}
                onComplete={(attackClaimId) => {
                  console.log("[ChainsTab] Attack completed, claim ID:", attackClaimId);
                  handleComposerSuccess();
                }}
                onCancel={() => {
                  setWizardOpen(false);
                  setSelectedAttack(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ChainsTab;
