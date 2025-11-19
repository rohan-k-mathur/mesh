// components/aif/CommitmentStorePanel.tsx
"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, User, History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * CommitmentStorePanel Component
 * 
 * Displays per-participant commitment tracking in dialogue visualizations.
 * Shows which claims each participant has asserted, conceded, or retracted.
 * 
 * Commitment Store Semantics (Formal Dialogue Games):
 * - ASSERT: Adds claim to participant's commitment store
 * - CONCEDE: Adds opponent's claim to participant's commitment store
 * - RETRACT: Removes claim from participant's commitment store
 * 
 * Visual Features:
 * - Per-participant tabs for easy navigation
 * - Color-coded claims (active vs retracted)
 * - Timeline view showing commitment evolution
 * - Diff mode highlighting changes between participants
 * 
 * References:
 * - Prakken, H. (2006). Formal systems for persuasion dialogue.
 * - Walton, D. & Krabbe, E. (1995). Commitment in Dialogue.
 */

export interface CommitmentRecord {
  claimId: string;
  claimText: string;
  moveId: string;
  moveKind: "ASSERT" | "CONCEDE" | "RETRACT";
  timestamp: string;
  isActive: boolean; // false if retracted
}

export interface CommitmentStore {
  participantId: string;
  participantName: string;
  commitments: CommitmentRecord[];
}

interface CommitmentStorePanelProps {
  /** Commitment stores for all participants */
  stores: CommitmentStore[];
  
  /** Callback when claim is clicked */
  onClaimClick?: (claimId: string) => void;
  
  /** Show timeline view */
  showTimeline?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Renders a single commitment record with visual indicators
 */
function CommitmentItem({
  record,
  onClick
}: {
  record: CommitmentRecord;
  onClick?: () => void;
}) {
  const moveIcons = {
    ASSERT: <CheckCircle2 className="h-3 w-3 text-sky-600" />,
    CONCEDE: <CheckCircle2 className="h-3 w-3 text-green-600" />,
    RETRACT: <XCircle className="h-3 w-3 text-red-600" />
  };

  const formattedTime = new Date(record.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              p-2 rounded border text-sm
              ${record.isActive 
                ? "bg-white border-gray-200 hover:border-sky-300" 
                : "bg-gray-50 border-gray-300 opacity-60 line-through"
              }
              ${onClick ? "cursor-pointer" : ""}
              transition-colors
            `}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5">{moveIcons[record.moveKind]}</span>
              <span className="flex-1 text-gray-800">
                {record.claimText}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white border-gray-800">
          <div className="space-y-1 text-xs">
            <div className="font-semibold">
              {record.moveKind === "ASSERT" && "Asserted"}
              {record.moveKind === "CONCEDE" && "Conceded"}
              {record.moveKind === "RETRACT" && "Retracted"}
            </div>
            <div className="text-gray-400">{formattedTime}</div>
            {!record.isActive && (
              <div className="text-red-400">No longer committed</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Timeline view showing commitment evolution
 */
function CommitmentTimeline({
  records,
  onClaimClick
}: {
  records: CommitmentRecord[];
  onClaimClick?: (claimId: string) => void;
}) {
  // Sort by timestamp
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-2">
      {sortedRecords.map((record, idx) => (
        <div key={`${record.moveId}-${idx}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div 
              className={`
                w-2 h-2 rounded-full
                ${record.moveKind === "ASSERT" ? "bg-sky-500" : ""}
                ${record.moveKind === "CONCEDE" ? "bg-green-500" : ""}
                ${record.moveKind === "RETRACT" ? "bg-red-500" : ""}
              `}
            />
            {idx < sortedRecords.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 min-h-[20px]" />
            )}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[9px]">
                {record.moveKind}
              </Badge>
              <span className="text-[10px] text-gray-500">
                {new Date(record.timestamp).toLocaleString("en-US", {
                  hour: "numeric",
                  minute: "2-digit"
                })}
              </span>
            </div>
            <div
              className={`
                text-sm
                ${record.isActive ? "text-gray-800" : "text-gray-500 line-through"}
                ${onClaimClick ? "cursor-pointer hover:text-sky-600" : ""}
              `}
              onClick={() => onClaimClick?.(record.claimId)}
            >
              {record.claimText}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommitmentStorePanel({
  stores,
  onClaimClick,
  showTimeline = false,
  className = ""
}: CommitmentStorePanelProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    stores.length > 0 ? stores[0].participantId : null
  );

  const selectedStore = stores.find(s => s.participantId === selectedParticipant);

  // Calculate statistics
  const stats = selectedStore ? {
    total: selectedStore.commitments.length,
    active: selectedStore.commitments.filter(c => c.isActive).length,
    retracted: selectedStore.commitments.filter(c => !c.isActive).length
  } : null;

  if (stores.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Commitment Stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No commitment data available. Enable dialogue layer to track participant commitments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Commitment Stores
          {stats && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {stats.active} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedParticipant || undefined} onValueChange={setSelectedParticipant}>
          {/* Participant selector */}
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${stores.length}, 1fr)` }}>
            {stores.map(store => (
              <TabsTrigger key={store.participantId} value={store.participantId} className="text-xs">
                {store.participantName}
                <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">
                  {store.commitments.filter(c => c.isActive).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Commitment list per participant */}
          {stores.map(store => (
            <TabsContent key={store.participantId} value={store.participantId} className="mt-4">
              {/* View mode toggle */}
              {showTimeline && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    className="text-xs flex items-center gap-1 text-sky-600 hover:text-sky-700"
                    onClick={() => {/* Toggle timeline view */}}
                  >
                    <History className="h-3 w-3" />
                    Timeline View
                  </button>
                </div>
              )}

              {/* Statistics */}
              {stats && (
                <div className="flex gap-2 mb-3 text-xs">
                  <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                    {stats.active} active
                  </Badge>
                  {stats.retracted > 0 && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      {stats.retracted} retracted
                    </Badge>
                  )}
                </div>
              )}

              {/* Commitment list or timeline */}
              <div className="h-[300px] overflow-y-auto pr-4">
                {showTimeline ? (
                  <CommitmentTimeline
                    records={store.commitments}
                    onClaimClick={onClaimClick}
                  />
                ) : (
                  <div className="space-y-2">
                    {/* Active commitments first */}
                    {store.commitments
                      .filter(c => c.isActive)
                      .map((record, idx) => (
                        <CommitmentItem
                          key={`${record.moveId}-${idx}`}
                          record={record}
                          onClick={() => onClaimClick?.(record.claimId)}
                        />
                      ))}
                    
                    {/* Retracted commitments (if any) */}
                    {store.commitments.filter(c => !c.isActive).length > 0 && (
                      <>
                        <div className="text-xs font-semibold text-gray-500 mt-4 mb-2">
                          Retracted
                        </div>
                        {store.commitments
                          .filter(c => !c.isActive)
                          .map((record, idx) => (
                            <CommitmentItem
                              key={`${record.moveId}-${idx}`}
                              record={record}
                              onClick={() => onClaimClick?.(record.claimId)}
                            />
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
