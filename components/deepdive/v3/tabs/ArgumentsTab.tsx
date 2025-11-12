"use client";

import React, { useState } from "react";
import { NestedTabs } from "@/components/deepdive/shared/NestedTabs";
import { List, Network, GitFork, Shield } from "lucide-react";
import { SectionCard } from "@/components/deepdive/shared";
import AIFArgumentsListPro from "@/components/arguments/AIFArgumentsListPro";
import { SchemesSection } from "../sections/SchemesSection";
import { NetworksSection } from "../sections/NetworksSection";
import { AspicTheoryPanel } from "@/components/aspic/AspicTheoryPanel";
import { ArgumentNetAnalyzer } from "@/components/argumentation/ArgumentNetAnalyzer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ArgumentsTabProps {
  deliberationId: string;
  authorId: string;
  refreshCounter: number;
  dsMode?: boolean;
  onArgumentClick?: (argument: any) => void;
  onViewDialogueMove?: (moveId: string, delibId: string) => void;
  onVisibleTextsChanged?: (texts: string[]) => void;
  onTabChange?: (tab: string) => void;
  setHighlightedDialogueMoveId?: (id: string | null) => void;
}

/**
 * ArgumentsTab - Refactored with nested tabs structure
 * 
 * Structure:
 * - List: All arguments (existing AIFArgumentsListPro)
 * - Schemes: Browse detected schemes (Phase 1 integration)
 * - Networks: Explore multi-scheme nets (Phase 4 integration)
 * - ASPIC: ASPIC theory analysis (migrated from parent tab)
 * 
 * Week 5 Enhancement:
 * - ArgumentNetAnalyzer integration for multi-scheme net analysis
 */
export function ArgumentsTab({
  deliberationId,
  authorId,
  refreshCounter,
  dsMode,
  onArgumentClick,
  onViewDialogueMove,
  onVisibleTextsChanged,
  onTabChange,
  setHighlightedDialogueMoveId,
}: ArgumentsTabProps) {
  // Week 5 Task 5.1: ArgumentNetAnalyzer state
  const [netAnalyzerOpen, setNetAnalyzerOpen] = useState(false);
  const [selectedArgumentId, setSelectedArgumentId] = useState<string | null>(null);

  return (
    <>
      <NestedTabs
        id={`arguments-${deliberationId}`}
        defaultValue="list"
        variant="secondary"
        tabs={[
          {
            value: "list",
            label: "All Arguments",
            icon: <List className="size-3.5" />,
            content: (
              <SectionCard 
                title="Arguments List (Argument Interchange Format)" 
                className="w-full" 
                padded={true}
              >
                <AIFArgumentsListPro
                  key={refreshCounter}
                  deliberationId={deliberationId}
                  onVisibleTextsChanged={(texts) => {
                    onVisibleTextsChanged?.(texts);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("mesh:texts:visible", {
                          detail: { deliberationId, texts },
                        })
                      );
                    }
                  }}
                  dsMode={dsMode}
                  onArgumentClick={(argument) => {
                    onArgumentClick?.(argument);
                  }}
                  onViewDialogueMove={(moveId, delibId) => {
                    setHighlightedDialogueMoveId?.(moveId);
                    onTabChange?.("dialogue");
                  }}
                  onAnalyzeArgument={(argId) => {
                    // Week 5 Task 5.1: Open ArgumentNetAnalyzer for this argument
                    setSelectedArgumentId(argId);
                    setNetAnalyzerOpen(true);
                  }}
                />
                <span className="block mt-2 text-xs text-neutral-500">
                  Note: This list shows all structured arguments in the deliberation&apos;s AIF database. 
                  Some arguments may not yet be linked to claims in the debate.
                </span>
              </SectionCard>
            ),
          },
          {
            value: "schemes",
            label: "Schemes",
            icon: <Network className="size-3.5" />,
            // TODO: Add badge with scheme count
            content: <SchemesSection deliberationId={deliberationId} />,
          },
          {
            value: "networks",
            label: "Networks",
            icon: <GitFork className="size-3.5" />,
            // TODO: Add badge with net count
            content: <NetworksSection deliberationId={deliberationId} />,
          },
          {
            value: "aspic",
            label: "ASPIC",
            icon: <Shield className="size-3.5" />,
            content: <AspicTheoryPanel deliberationId={deliberationId} />,
          },
        ]}
      />

      {/* Week 5 Task 5.1: ArgumentNetAnalyzer Dialog */}
      <Dialog open={netAnalyzerOpen} onOpenChange={setNetAnalyzerOpen}>
        <DialogContent className="max-w-[80vw] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Argument Analysis</DialogTitle>
          </DialogHeader>
          {selectedArgumentId && (
            <ArgumentNetAnalyzer
              argumentId={selectedArgumentId}
              deliberationId={deliberationId}
              currentUserId={authorId}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
