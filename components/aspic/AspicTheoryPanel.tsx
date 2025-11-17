// components/aspic/AspicTheoryPanel.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspicTheoryViewer } from "./AspicTheoryViewer";
import { GroundedExtensionPanel } from "./GroundedExtensionPanel";
import { RationalityChecklist } from "./RationalityChecklist";
// import { AttackGraphVisualization } from "./AttackGraphVisualization"; // Chunk 2

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AspicTheoryPanelProps {
  deliberationId: string;
  initialView?: "theory" | "graph" | "extension" | "rationality";
}

export function AspicTheoryPanel({
  deliberationId,
  initialView = "theory",
}: AspicTheoryPanelProps) {
  const [view, setView] = useState<"theory" | "graph" | "extension" | "rationality">(initialView);

  // Fetch ASPIC+ theory and semantics
  const { data, error, isLoading } = useSWR(
    `/api/aspic/evaluate?deliberationId=${deliberationId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
          <p className="text-sm text-gray-500">Computing ASPIC+ theory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-800 mb-2">
          Error loading ASPIC+ theory
        </h3>
        <p className="text-xs text-red-600">
          {error.message || "Failed to fetch theory data"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-xs text-red-700 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No ASPIC+ theory data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with view tabs */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            ASPIC+ Argumentation Theory
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Formal representation of deliberation arguments
          </p>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="theory">Theory</TabsTrigger>
            <TabsTrigger value="graph" disabled>
              Graph
            </TabsTrigger>
            <TabsTrigger value="extension">
              Extension
            </TabsTrigger>
            <TabsTrigger value="rationality">
              Rationality
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on view */}
      <div className="min-h-[400px]">
        {view === "theory" && <AspicTheoryViewer theory={data.theory} />}
        
        {view === "graph" && (
          <div className="text-center py-12 text-gray-500 text-sm">
            Graph visualization coming in Chunk 2
          </div>
        )}
        
        {view === "extension" && data.semantics && (
          <GroundedExtensionPanel
            arguments={data.semantics.arguments}
            semantics={data.semantics}
          />
        )}
        
        {view === "rationality" && data.rationality && (
          <RationalityChecklist
            rationality={data.rationality}
            deliberationId={deliberationId}
            onRegenerateTransposition={() => {
              // Trigger SWR revalidation
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
