/**
 * DebateTab Component
 * 
 * Main debate/discussion tab for the deliberation panel. Displays:
 * - Deliberation settings panel (conditional)
 * - Proposition composer
 * - Propositions list
 * - Claims minimap
 * - Dialogue inspector
 * 
 * Part of DeepDivePanel V3 migration - Week 4, Task 4.4
 * Uses SheetAwareTabProps (needs delibState for settings panel)
 */

import * as React from "react";
import { BaseTabProps } from "./types";
import { SectionCard } from "../../shared/SectionCard";
import { PropositionComposerPro } from "@/components/propositions/PropositionComposerPro";
import PropositionsList from "@/components/propositions/PropositionsList";
import ClaimMiniMap from "@/components/claims/ClaimMiniMap";
import { DialogueInspector } from "@/components/dialogue/DialogueInspector";
import { DeliberationSettingsPanel } from "@/components/deliberations/DeliberationSettingsPanel";

/**
 * Props for DebateTab
 * Extends BaseTabProps with additional requirements for debate functionality
 */
export interface DebateTabProps extends BaseTabProps {
  /** Whether the deliberation settings panel should be shown */
  delibSettingsOpen: boolean;
  
  /** Currently selected claim ID (if any) */
  selectedClaimId?: string;
  
  /** Callback when a claim is clicked in the minimap */
  onClaimClick: (id: string, locusPath?: string | null) => void;
}

/**
 * DebateTab Component
 * 
 * Primary tab for participating in deliberation discussions. Contains composers
 * for creating propositions, viewing all propositions, visualizing claims structure,
 * and inspecting dialogue timeline.
 * 
 * @param deliberationId - The ID of the deliberation
 * @param currentUserId - The ID of the current user
 * @param delibSettingsOpen - Whether settings panel should be visible
 * @param selectedClaimId - Currently selected claim (for highlighting)
 * @param onClaimClick - Handler for claim selection
 * @param className - Optional additional CSS classes
 */
export function DebateTab({
  deliberationId,
  currentUserId,
  delibSettingsOpen,
  selectedClaimId,
  onClaimClick,
  className,
}: DebateTabProps) {
  return (
    <div className={className}>
      {/* Conditional Settings Panel */}
      {delibSettingsOpen && (
        <SectionCard>
          <DeliberationSettingsPanel deliberationId={deliberationId} />
        </SectionCard>
      )}

      {/* Proposition Composer */}
      <SectionCard title="Compose Proposition">
        <PropositionComposerPro deliberationId={deliberationId} />
      </SectionCard>
    
      {/* Propositions List */}
      <SectionCard>
        <PropositionsList deliberationId={deliberationId} />
      </SectionCard>

      {/* Claims MiniMap */}
      <SectionCard>
        <ClaimMiniMap
          deliberationId={deliberationId}
          selectedClaimId={selectedClaimId}
          onClaimClick={onClaimClick}
          currentUserId={currentUserId}
        />
      </SectionCard>

      {/* Dialogue Inspector */}
      <SectionCard>
        <DialogueInspector
          deliberationId={deliberationId}
          initialTargetType="claim"
          initialLocusPath="0"
        />
      </SectionCard>
    </div>
  );
}
