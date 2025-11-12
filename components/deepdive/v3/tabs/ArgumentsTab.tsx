"use client";

import React from "react";
import { NestedTabs } from "@/components/deepdive/shared/NestedTabs";
import { List, Network, GitFork, Shield } from "lucide-react";
import { SectionCard } from "@/components/deepdive/shared";
import AIFArgumentsListPro from "@/components/arguments/AIFArgumentsListPro";
import { SchemesSection } from "../sections/SchemesSection";
import { NetworksSection } from "../sections/NetworksSection";
import { AspicTheoryPanel } from "@/components/aspic/AspicTheoryPanel";

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
  return (
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
  );
}
